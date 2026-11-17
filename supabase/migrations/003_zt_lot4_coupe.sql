-- ZERO TIME — lot 4 : couper un fil, pénalités, fin de partie, rejouer.
-- Le serveur seul décide si une coupe est bonne. Chaque action porte un identifiant unique
-- (traité une seule fois). Le temps ne descend jamais sous 0.

alter table zt.rooms add column if not exists outcome text check (outcome in ('defused','exploded'));
alter table zt.rooms add column if not exists cause text check (cause in ('time','errors'));
alter table zt.rooms add column if not exists remaining_ms int;
alter table zt.rooms add column if not exists last_event jsonb;

create table if not exists zt.actions (
  action_id  uuid primary key,
  room_code  text not null references zt.rooms(code) on delete cascade,
  player_id  uuid not null,
  created_at timestamptz not null default now()
);
alter table zt.actions enable row level security;
revoke all on zt.actions from anon, authenticated;

-- Vue d'un joueur : filtrée par rôle, avec fin de partie.
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
  elsif r.status = 'ended' then
    select count(*) into v_solved from zt.room_panels where room_code = p_code and state = 'solved';
    v := v || jsonb_build_object('end', jsonb_build_object(
        'outcome', r.outcome, 'cause', r.cause, 'solved', v_solved, 'total', 3, 'errors', r.errors)
        || case when me.role = 'operator' and r.outcome = 'defused'
                then jsonb_build_object('remaining_ms', r.remaining_ms) else '{}'::jsonb end);
  end if;
  return v;
end $$;

create or replace function zt.finish(p_code text, p_outcome text, p_cause text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update zt.rooms set status = 'ended', outcome = p_outcome, cause = p_cause,
         remaining_ms = case when p_outcome = 'defused'
                        then greatest(0, floor(extract(epoch from (ends_at - now())) * 1000))::int else 0 end,
         updated_at = now()
   where code = p_code;
end $$;

-- Couper un fil (opérateur seul)
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
  if r.status <> 'playing' then return zt.view_for(v_code, me.id); end if;
  -- Action déjà traitée (double clic, requête répétée) : aucun effet supplémentaire.
  if exists (select 1 from zt.actions where action_id = p_action) then return zt.view_for(v_code, me.id); end if;
  insert into zt.actions(action_id, room_code, player_id) values (p_action, v_code, me.id);
  -- Temps écoulé : toute action reçue après 0:00 est ignorée, la bombe a explosé.
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
    -- Mauvaise coupe : le fil reste coupé, le panneau reste en jeu (décision 7).
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

-- Vérifie le temps (appelé par un téléphone quand son compte à rebours atteint 0)
create or replace function public.zt_tick(p_code text, p_token uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms;
begin
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.status = 'playing' and now() >= r.ends_at then
    perform zt.finish(v_code, 'exploded', 'time');
    perform zt.push_state(v_code);
  end if;
  return zt.view_for(v_code, me.id);
end $$;

-- Rejouer : retour à la salle d'attente, mêmes joueurs
create or replace function public.zt_replay(p_code text, p_token uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms;
begin
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.status = 'ended' then
    delete from zt.room_panels where room_code = v_code;
    delete from zt.actions where room_code = v_code;
    update zt.players set role = null where room_code = v_code;
    update zt.rooms set status = 'lobby', errors = 0, ends_at = null, outcome = null, cause = null,
           remaining_ms = null, last_event = null, updated_at = now() where code = v_code;
    perform zt.push_state(v_code);
  end if;
  return zt.view_for(v_code, me.id);
end $$;

revoke all on function zt.finish(text, text, text) from public, anon, authenticated;
revoke all on function public.zt_cut(text, uuid, uuid, int, int), public.zt_tick(text, uuid), public.zt_replay(text, uuid) from public;
grant execute on function public.zt_cut(text, uuid, uuid, int, int), public.zt_tick(text, uuid), public.zt_replay(text, uuid) to anon, authenticated;
