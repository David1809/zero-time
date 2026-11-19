-- 017 : bombe globale (écran paysage) — 4 modules fixes : Alimentation (3 fils), Horloge (4), Détonateur (5), Digicode (4 chiffres).
-- La dernière victoire de module ne désamorce plus : le bouton d'arrêt d'urgence appelle zt_disarm (« verrouillé » -> « déverrouillé »).
-- Indices du digicode : voyants rouges/bleus + historique (plus de numéro de série ni de piles dans ses règles).

create or replace function zt.manual_pin()
 returns jsonb language sql immutable set search_path to ''
as $function$
  select jsonb_build_object(
    'rules', jsonb_build_array(
      jsonb_build_object('n','P.1','t','Voyants rouges allumés : leur nombre est le nombre de chiffres pairs du code (le 0 est pair).'),
      jsonb_build_object('n','P.2','t','Voyants bleus allumés : leur nombre est le nombre de chiffres du code supérieurs ou égaux à 6.'),
      jsonb_build_object('n','P.3','t','Le code a 4 chiffres, tous différents.')),
    'verdicts', jsonb_build_array(
      '✓ vert : bon chiffre, bonne place.',
      '◇ orange : bon chiffre, mauvaise place.',
      '✕ gris : ce chiffre n''est pas dans le code.'),
    'penalties', 'Un code faux compte comme une erreur : 1re = −20 s, 2e = −30 s, 3e = explosion.')
$function$;

create or replace function zt.make_panels(p_code text)
 returns void language plpgsql security definer set search_path to ''
as $function$
declare v_ids text[] := array[]::text[]; v_n int; g jsonb; v_id text;
begin
  delete from zt.configs c where c.id like 'G%' and not exists (select 1 from zt.room_panels rp where rp.config_id = c.id);
  foreach v_n in array array[3,4,5] loop
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
  -- Chapitres : 2 techniciens = fils 3-4 / fils 5 + digicode (page 9) ; 3 techniciens = fils 3-4 / fils 5 / digicode.
  if v_count >= 3 then
    update zt.players p set pages = case
        when v_count = 3 then (case t.rn when 1 then array[3,4] else array[5,9] end)
        else (case t.rn when 1 then array[3,4] when 2 then array[5] else array[9] end) end
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

create or replace function public.zt_disarm(p_code text, p_token uuid, p_action uuid)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms;
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
  elsif exists (select 1 from zt.room_panels where room_code = v_code and state <> 'solved') then
    raise exception 'modules_restants';
  else
    perform zt.finish(v_code, 'defused', null);
  end if;
  perform zt.push_state(v_code);
  return zt.view_for(v_code, me.id);
end $function$;
grant execute on function public.zt_disarm(text, uuid, uuid) to anon, authenticated;

create or replace function public.zt_cut(p_code text, p_token uuid, p_action uuid, p_pos integer, p_wire integer)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
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
  if cf.kind <> 'wires' then raise exception 'coupe_invalide'; end if;
  if pn.state = 'solved' or p_wire is null or p_wire < 1 or p_wire > array_length(cf.wires, 1)
     or p_wire = any(pn.cut) then raise exception 'coupe_invalide'; end if;

  if p_wire = cf.answer then
    update zt.room_panels set state = 'solved', cut = cut || p_wire where room_code = v_code and pos = p_pos;
    update zt.rooms set last_event = jsonb_build_object('id', p_action, 'type', 'ok', 'pos', p_pos), updated_at = now() where code = v_code;
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
end $function$;

create or replace function public.zt_pin_try(p_code text, p_token uuid, p_action uuid, p_pos integer, p_digits text)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms;
  pn zt.room_panels; cf zt.configs; v_errors int; v_pen int;
  v text[] := array['x','x','x','x']; rem int[] := array_fill(0, array[10]); i int; k int; v_ok boolean;
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
  if cf.kind <> 'pin' or pn.state = 'solved' or p_digits is null or p_digits !~ '^[0-9]{4}$' then raise exception 'coupe_invalide'; end if;

  v_ok := (p_digits = cf.pin);
  for i in 1..4 loop
    if substr(p_digits, i, 1) = substr(cf.pin, i, 1) then v[i] := 'g';
    else k := substr(cf.pin, i, 1)::int + 1; rem[k] := rem[k] + 1; end if;
  end loop;
  for i in 1..4 loop
    if v[i] <> 'g' then
      k := substr(p_digits, i, 1)::int + 1;
      if rem[k] > 0 then v[i] := 'o'; rem[k] := rem[k] - 1; end if;
    end if;
  end loop;
  update zt.room_panels set attempts = attempts || jsonb_build_array(jsonb_build_object('digits', p_digits, 'verdict', array_to_string(v, '')))
   where room_code = v_code and pos = p_pos;

  if v_ok then
    update zt.room_panels set state = 'solved' where room_code = v_code and pos = p_pos;
    update zt.rooms set last_event = jsonb_build_object('id', p_action, 'type', 'ok', 'pos', p_pos), updated_at = now() where code = v_code;
  else
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
      m := (zt.manual() - 'w6' - 'w7' - 'w8') || jsonb_build_object('pin', zt.manual_pin());
      select count(*) into v_techs from zt.players where room_code = p_code and role = 'technician';
      if me.pages is not null then
        for k in 3..5 loop
          if not (k = any(me.pages)) then m := m - ('w' || k); end if;
        end loop;
        if not (9 = any(me.pages)) then m := m - 'pin'; end if;
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
