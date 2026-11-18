-- Mode test solo : le créateur seul dans la salle peut lancer la partie dans le rôle de son choix,
-- puis basculer entre les vues opérateur / technicien (tests visuels). Aucun effet sur les parties à deux.

-- 1) La vue indique si la salle est en mode solo (un seul joueur).
create or replace function zt.view_for(p_code text, p_player uuid)
returns jsonb language plpgsql security definer set search_path = '' as $f$
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
    'solo', (count(*) = 1),
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
end $f$;

-- 2) Lancement en solo dans le rôle choisi.
create or replace function public.zt_start_solo(p_code text, p_token uuid, p_role text)
returns jsonb language plpgsql security definer set search_path = '' as $f$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms;
  v_n int; g jsonb; v_id text; v_ids text[] := array[]::text[];
begin
  if p_role not in ('operator','technician') then raise exception 'role_non_choisi'; end if;
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.creator_id <> me.id then raise exception 'reserve_au_createur'; end if;
  if r.status <> 'lobby' then raise exception 'partie_deja_lancee'; end if;
  if (select count(*) from zt.players where room_code = v_code) <> 1 then raise exception 'mode_solo_indisponible'; end if;
  update zt.players set role = p_role, last_seen = now() where id = me.id;
  delete from zt.configs c where c.id like 'G%' and not exists (select 1 from zt.room_panels rp where rp.config_id = c.id);
  foreach v_n in array array[3,4,5] loop
    g := zt.gen_panel(v_n);
    v_id := 'G' || replace(gen_random_uuid()::text, '-', '');
    insert into zt.configs(id, serial, wires, answer)
      values (v_id, g->>'serial', array(select jsonb_array_elements_text(g->'wires')), (g->>'answer')::int);
    v_ids := v_ids || v_id;
  end loop;
  insert into zt.room_panels(room_code, pos, config_id)
    select v_code, row_number() over (order by random())::int, x from unnest(v_ids) x;
  update zt.rooms set status = 'playing', errors = 0, paused_at = null, waiting_for = null,
         ends_at = now() + interval '180 seconds', updated_at = now()
   where code = v_code;
  perform zt.push_state(v_code);
  return zt.view_for(v_code, me.id);
end $f$;

-- 3) Bascule de rôle en cours de partie solo (voir la vue de l'autre rôle).
create or replace function public.zt_solo_role(p_code text, p_token uuid, p_role text)
returns jsonb language plpgsql security definer set search_path = '' as $f$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms;
begin
  if p_role not in ('operator','technician') then raise exception 'role_non_choisi'; end if;
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.status <> 'playing' then return zt.view_for(v_code, me.id); end if;
  if (select count(*) from zt.players where room_code = v_code) <> 1 then raise exception 'mode_solo_indisponible'; end if;
  update zt.players set role = p_role where id = me.id;
  return zt.view_for(v_code, me.id);
end $f$;

revoke all on function public.zt_start_solo(text, uuid, text), public.zt_solo_role(text, uuid, text) from public;
grant execute on function public.zt_start_solo(text, uuid, text) to anon, authenticated;
grant execute on function public.zt_solo_role(text, uuid, text) to anon, authenticated;
