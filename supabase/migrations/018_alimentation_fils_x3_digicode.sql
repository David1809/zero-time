-- 018 : un seul emplacement « Alimentation » = le jeu coupe-fils (3 panneaux de fils, tailles tirées au hasard comme avant) ;
-- le Digicode est le 2e module actif ; Détonateur et Horloge restent verrouillés sur la bombe. Chapitres du manuel : fils 3-8 répartis, digicode (p. 9) visible par tous.
create or replace function zt.make_panels(p_code text)
 returns void language plpgsql security definer set search_path to ''
as $function$
declare v_ids text[] := array[]::text[]; v_n int; g jsonb; v_id text;
begin
  delete from zt.configs c where c.id like 'G%' and not exists (select 1 from zt.room_panels rp where rp.config_id = c.id);
  foreach v_n in array array(select x from generate_series(3,8) x order by random() limit 3) loop
    g := zt.gen_panel(v_n);
    v_id := 'G' || replace(gen_random_uuid()::text, '-', '');
    insert into zt.configs(id, serial, wires, answer)
      values (v_id, g->>'serial', array(select jsonb_array_elements_text(g->'wires')), (g->>'answer')::int);
    v_ids := v_ids || v_id;
  end loop;
  g := zt.gen_pin();
  v_id := 'G' || replace(gen_random_uuid()::text, '-', '');
  insert into zt.configs(id, serial, wires, answer, kind, pin)
    values (v_id, g->>'serial', '{}'::text[], 0, 'pin', g->>'code');
  v_ids := v_ids || v_id;
  insert into zt.room_panels(room_code, pos, config_id)
    select p_code, row_number() over (order by random())::int, x from unnest(v_ids) x;
  update zt.rooms set batteries = null where code = p_code;
end $function$;

create or replace function public.zt_start(p_code text, p_token uuid)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms; v_count int; v_op uuid;
begin
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.creator_id <> me.id then raise exception 'reserve_au_createur'; end if;
  if r.status <> 'lobby' then raise exception 'partie_deja_lancee'; end if;
  select count(*) into v_count from zt.players where room_code = v_code;
  if v_count < 2 then raise exception 'joueur_manquant'; end if;
  if r.role_mode = 'random' then
    select id into v_op from zt.players where room_code = v_code order by random() limit 1;
  else
    if r.creator_role is null then raise exception 'role_non_choisi'; end if;
    if r.creator_role = 'operator' then v_op := me.id;
    else select id into v_op from zt.players where room_code = v_code and id <> me.id order by random() limit 1; end if;
  end if;
  update zt.players set role = case when id = v_op then 'operator' else 'technician' end, pages = null, last_seen = now()
   where room_code = v_code;
  if v_count >= 3 then
    update zt.players p set pages = case
        when v_count = 3 then (case t.rn when 1 then array[3,4,5] else array[6,7,8] end)
        else (case t.rn when 1 then array[3,4] when 2 then array[5,6] else array[7,8] end) end
      from (select id, row_number() over (order by random()) rn from zt.players where room_code = v_code and role = 'technician') t
     where p.id = t.id;
  end if;
  perform zt.make_panels(v_code);
  update zt.rooms set status = 'playing', errors = 0, paused_at = null, waiting_for = null,
         ends_at = now() + interval '45 seconds', updated_at = now()
   where code = v_code;
  perform zt.push_state(v_code);
  return zt.view_for(v_code, me.id);
end $function$;


create or replace function zt.view_for(p_code text, p_player uuid)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare r zt.rooms; me zt.players; v jsonb; g jsonb; v_solved int; m jsonb; k int; v_techs int;
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
        'batteries', r.batteries,
        'panels', coalesce(jsonb_agg(
          case when c.kind = 'pin' then jsonb_build_object(
                 'pos', rp.pos, 'kind', 'pin', 'serial', c.serial, 'wires', '[]'::jsonb, 'cut', '[]'::jsonb,
                 'state', rp.state, 'attempts', rp.attempts,
                 'reds', (select count(*) from unnest(string_to_array(c.pin, null)) d where d::int % 2 = 0),
                 'blues', (select count(*) from unnest(string_to_array(c.pin, null)) d where d::int >= 6))
               else jsonb_build_object(
                 'pos', rp.pos, 'kind', 'wires', 'serial', c.serial, 'wires', to_jsonb(c.wires),
                 'cut', to_jsonb(rp.cut), 'state', rp.state) end
          order by rp.pos), '[]'::jsonb)
      ) into g
      from zt.room_panels rp join zt.configs c on c.id = rp.config_id
      where rp.room_code = p_code;
      v := v || jsonb_build_object('game', g);
    elsif me.role = 'technician' then
      m := zt.manual() || jsonb_build_object('pin', zt.manual_pin());
      select count(*) into v_techs from zt.players where room_code = p_code and role = 'technician';
      if me.pages is not null then
        for k in 3..8 loop
          if not (k = any(me.pages)) then m := m - ('w' || k); end if;
        end loop;
        m := m || jsonb_build_object('pages', to_jsonb(me.pages));
      end if;
      m := m || jsonb_build_object('techs', v_techs);
      v := v || jsonb_build_object('manual', m);
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
        'outcome', r.outcome, 'cause', r.cause, 'solved', v_solved, 'total', (select count(*) from zt.room_panels where room_code = p_code), 'errors', r.errors)
        || case when me.role = 'operator' and r.outcome = 'defused'
                then jsonb_build_object('remaining_ms', r.remaining_ms) else '{}'::jsonb end);
  elsif r.status = 'abandoned' then
    v := v || jsonb_build_object('end', jsonb_build_object('outcome', 'abandoned'));
  end if;
  return v;
end $function$;
