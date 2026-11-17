-- ZERO TIME — lot 5 : déconnexion, pause, reconnexion sans pénalité, abandon.
-- Chaque téléphone envoie un signal de présence toutes les 5 s (zt_heartbeat). Un joueur est absent
-- au-delà de 15 s. Dès qu'un joueur est absent, le compte à rebours est figé ; à son retour, la fin
-- de la partie est repoussée de la durée d'absence : aucune pénalité (cahier §14.6, décision 9).
-- Abandon : possible seulement quand la partie est en pause (décisions 10 et 11).

alter table zt.players add column if not exists last_seen timestamptz not null default now();
alter table zt.rooms add column if not exists paused_at timestamptz;
alter table zt.rooms add column if not exists waiting_for text;

create or replace function zt.view_for(p_code text, p_player uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r zt.rooms; me zt.players; v jsonb; g jsonb; v_solved int;
begin
  select * into r from zt.rooms where code = p_code;
  select * into me from zt.players where id = p_player and room_code = p_code;
  if r.code is null or me.id is null then return null; end if;
  select jsonb_build_object(
    'code', r.code,
    'status', r.status,
    'role_mode', r.role_mode,
    'creator_role', r.creator_role,
    'is_creator', (r.creator_id = me.id),
    'me', jsonb_build_object('id', me.id, 'pseudo', me.pseudo, 'role', me.role),
    'players', coalesce(jsonb_agg(jsonb_build_object(
        'pseudo', p.pseudo,
        'is_creator', (p.id = r.creator_id)
      ) order by p.joined_at), '[]'::jsonb)
  ) into v
  from zt.players p where p.room_code = p_code;

  if r.status = 'playing' then
    if me.role = 'operator' then
      select jsonb_build_object(
        'server_now', now(),
        'ends_at', r.ends_at,
        'errors', r.errors,
        'event', r.last_event,
        'panels', coalesce(jsonb_agg(jsonb_build_object(
            'pos', rp.pos, 'serial', c.serial, 'wires', to_jsonb(c.wires),
            'cut', to_jsonb(rp.cut), 'state', rp.state) order by rp.pos), '[]'::jsonb)
      ) into g
      from zt.room_panels rp join zt.configs c on c.id = rp.config_id
      where rp.room_code = p_code;
      v := v || jsonb_build_object('game', g);
    elsif me.role = 'technician' then
      v := v || jsonb_build_object('manual', zt.manual());
    end if;
    if r.paused_at is not null then
      -- Le technicien ne voit jamais le temps : seul l'opérateur reçoit le temps figé.
      v := v || jsonb_build_object('paused', jsonb_build_object('pseudo', r.waiting_for, 'can_abandon', true)
        || case when me.role = 'operator'
                then jsonb_build_object('remaining_ms', greatest(0, floor(extract(epoch from (r.ends_at - r.paused_at)) * 1000))::int)
                else '{}'::jsonb end);
    end if;
  elsif r.status = 'ended' then
    select count(*) into v_solved from zt.room_panels where room_code = p_code and state = 'solved';
    v := v || jsonb_build_object('end', jsonb_build_object(
        'outcome', r.outcome, 'cause', r.cause, 'solved', v_solved, 'total', 3, 'errors', r.errors)
        || case when me.role = 'operator' and r.outcome = 'defused'
                then jsonb_build_object('remaining_ms', r.remaining_ms) else '{}'::jsonb end);
  elsif r.status = 'abandoned' then
    v := v || jsonb_build_object('end', jsonb_build_object('outcome', 'abandoned'));
  end if;
  return v;
end $$;

-- Signal de présence + détection des absences + reprise. Renvoie la vue du joueur.
create or replace function public.zt_heartbeat(p_code text, p_token uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms;
  v_min_seen timestamptz; v_other_pseudo text; v_changed boolean := false;
begin
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.status = 'playing' then
    -- Absents avant ce signal (le joueur qui appelle compte s'il était absent).
    select min(last_seen) into v_min_seen from zt.players
     where room_code = v_code and last_seen < now() - interval '15 seconds';
    update zt.players set last_seen = now() where id = me.id;
    select pseudo into v_other_pseudo from zt.players
     where room_code = v_code and id <> me.id and last_seen < now() - interval '15 seconds' limit 1;
    if v_other_pseudo is not null then
      if r.paused_at is null then
        update zt.rooms set paused_at = least(now(), v_min_seen), waiting_for = v_other_pseudo where code = v_code;
        v_changed := true;
      elsif r.waiting_for is distinct from v_other_pseudo then
        update zt.rooms set waiting_for = v_other_pseudo where code = v_code;
        v_changed := true;
      end if;
    elsif r.paused_at is not null then
      -- Tout le monde est de retour : la partie reprend, le temps d'absence n'est pas décompté.
      update zt.rooms set ends_at = ends_at + (now() - paused_at), paused_at = null, waiting_for = null where code = v_code;
      v_changed := true;
    end if;
    select * into r from zt.rooms where code = v_code;
    if r.paused_at is null and now() >= r.ends_at then
      perform zt.finish(v_code, 'exploded', 'time');
      v_changed := true;
    end if;
    if v_changed then perform zt.push_state(v_code); end if;
  else
    update zt.players set last_seen = now() where id = me.id;
  end if;
  return zt.view_for(v_code, me.id);
end $$;

-- Abandon : seulement si la partie est en pause (un membre a disparu).
create or replace function public.zt_abandon(p_code text, p_token uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms;
begin
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.status <> 'playing' or r.paused_at is null then raise exception 'abandon_indisponible'; end if;
  update zt.rooms set status = 'abandoned', paused_at = null, waiting_for = null, updated_at = now() where code = v_code;
  perform zt.push_state(v_code);
  return zt.view_for(v_code, me.id);
end $$;

-- La partie en pause ignore les coupes et le contrôle du temps.
create or replace function public.zt_tick(p_code text, p_token uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms;
begin
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.status = 'playing' and r.paused_at is null and now() >= r.ends_at then
    perform zt.finish(v_code, 'exploded', 'time');
    perform zt.push_state(v_code);
  end if;
  return zt.view_for(v_code, me.id);
end $$;

create or replace function public.zt_replay(p_code text, p_token uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms;
begin
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.status in ('ended','abandoned') then
    delete from zt.room_panels where room_code = v_code;
    delete from zt.actions where room_code = v_code;
    update zt.players set role = null, last_seen = now() where room_code = v_code;
    update zt.rooms set status = 'lobby', errors = 0, ends_at = null, outcome = null, cause = null,
           remaining_ms = null, last_event = null, paused_at = null, waiting_for = null, updated_at = now() where code = v_code;
    perform zt.push_state(v_code);
  end if;
  return zt.view_for(v_code, me.id);
end $$;

revoke all on function public.zt_heartbeat(text, uuid), public.zt_abandon(text, uuid) from public;
grant execute on function public.zt_heartbeat(text, uuid), public.zt_abandon(text, uuid) to anon, authenticated;

-- Coupe : ignorée pendant la pause (l'action n'est pas consommée).
create or replace function public.zt_cut(p_code text, p_token uuid, p_action uuid, p_pos int, p_wire int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms;
  pn zt.room_panels; cf zt.configs; v_errors int; v_pen int;
begin
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  if me.role is distinct from 'operator' then raise exception 'reserve_operateur'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.status <> 'playing' or r.paused_at is not null then return zt.view_for(v_code, me.id); end if;
  if exists (select 1 from zt.actions where action_id = p_action) then return zt.view_for(v_code, me.id); end if;
  insert into zt.actions(action_id, room_code, player_id) values (p_action, v_code, me.id);
  if now() >= r.ends_at then
    perform zt.finish(v_code, 'exploded', 'time');
    perform zt.push_state(v_code);
    return zt.view_for(v_code, me.id);
  end if;
  select * into pn from zt.room_panels where room_code = v_code and pos = p_pos for update;
  if pn.room_code is null then raise exception 'panneau_inconnu'; end if;
  select * into cf from zt.configs where id = pn.config_id;
  if pn.state = 'solved' or p_wire is null or p_wire < 1 or p_wire > array_length(cf.wires, 1)
     or p_wire = any(pn.cut) then raise exception 'coupe_invalide'; end if;

  if p_wire = cf.answer then
    update zt.room_panels set state = 'solved', cut = cut || p_wire where room_code = v_code and pos = p_pos;
    update zt.rooms set last_event = jsonb_build_object('id', p_action, 'type', 'ok', 'pos', p_pos), updated_at = now() where code = v_code;
    if not exists (select 1 from zt.room_panels where room_code = v_code and state <> 'solved') then
      perform zt.finish(v_code, 'defused', null);
    end if;
  else
    update zt.room_panels set cut = cut || p_wire where room_code = v_code and pos = p_pos;
    v_errors := r.errors + 1;
    update zt.rooms set errors = v_errors where code = v_code;
    if v_errors >= 3 then
      update zt.rooms set last_event = jsonb_build_object('id', p_action, 'type', 'error', 'n', v_errors, 'penalty', 0) where code = v_code;
      perform zt.finish(v_code, 'exploded', 'errors');
    else
      v_pen := case when v_errors = 1 then 20 else 30 end;
      update zt.rooms set ends_at = ends_at - make_interval(secs => v_pen),
             last_event = jsonb_build_object('id', p_action, 'type', 'error', 'n', v_errors, 'penalty', v_pen),
             updated_at = now()
       where code = v_code;
      if now() >= r.ends_at - make_interval(secs => v_pen) then
        perform zt.finish(v_code, 'exploded', 'time');
      end if;
    end if;
  end if;
  perform zt.push_state(v_code);
  return zt.view_for(v_code, me.id);
end $$;

-- Lancement : remet la présence à zéro pour les deux joueurs.
create or replace function public.zt_start(p_code text, p_token uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms; v_other uuid; v_cr text;
begin
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.creator_id <> me.id then raise exception 'reserve_au_createur'; end if;
  if r.status <> 'lobby' then raise exception 'partie_deja_lancee'; end if;
  select id into v_other from zt.players where room_code = v_code and id <> me.id;
  if v_other is null then raise exception 'joueur_manquant'; end if;
  if r.role_mode = 'random' then
    v_cr := case when random() < 0.5 then 'operator' else 'technician' end;
  else
    v_cr := r.creator_role;
    if v_cr is null then raise exception 'role_non_choisi'; end if;
  end if;
  update zt.players set role = v_cr, last_seen = now() where id = me.id;
  update zt.players set role = case when v_cr = 'operator' then 'technician' else 'operator' end, last_seen = now() where id = v_other;
  insert into zt.room_panels(room_code, pos, config_id)
    select v_code, row_number() over (order by random())::int, id
    from (select distinct on (array_length(wires, 1)) id
          from zt.configs order by array_length(wires, 1), random()) t;
  update zt.rooms set status = 'playing', errors = 0, paused_at = null, waiting_for = null,
         ends_at = now() + interval '180 seconds', updated_at = now()
   where code = v_code;
  perform zt.push_state(v_code);
  return zt.view_for(v_code, me.id);
end $$;
