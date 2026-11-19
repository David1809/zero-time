-- 019 : numéro de série de partie (8 caractères : 5 lettres distinctes + 3 chiffres, mélangés) partagé par tous les modules ;
-- Digicode : les techniciens détiennent des indices liés à certaines lettres du numéro de série (les autres lettres sont des leurres).
-- Rollback : 019_down_serie_lettres.sql
alter table zt.rooms add column if not exists serial text;
alter table zt.players add column if not exists clues jsonb;

create or replace function zt.gen_serial()
 returns text language plpgsql set search_path to ''
as $function$
declare l text[]; d text[]; res text;
begin
  select array_agg(x) into l from (select substr('ABCDEFGHJKLMNPQRSTUVWXYZ', i, 1) x from generate_series(1,24) i order by random() limit 5) s;
  select array_agg(x) into d from (select floor(random()*10)::int::text x from generate_series(1,3)) s;
  select string_agg(c, '' order by random()) into res from unnest(l || d) c;
  return res;
end $function$;

-- Panneau de fils dont la règle visée tient compte de la parité du dernier chiffre du numéro de série de la partie
create or replace function zt.gen_panel2(p_n integer, p_serial text)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  colors text[] := array['red','blue','yellow','white','black'];
  rules text[]; target text; w text[]; d int; ev jsonb; i int; k int;
begin
  d := right(regexp_replace(p_serial, '\D', '', 'g'), 1)::int;
  rules := case p_n when 3 then array['3.1','3.2','3.3','3.4']
                    when 4 then array['4.1','4.2','4.3','4.4']
                    when 5 then array['5.1','5.2','5.3','5.4']
                    when 6 then array['6.1','6.2','6.3','6.4']
                    when 7 then array['7.1','7.2','7.3','7.4']
                    else array['8.1','8.2','8.3','8.4'] end;
  for target in select r from unnest(rules) r order by random() loop
    for k in 1..3000 loop
      w := array[]::text[];
      for i in 1..p_n loop w := w || colors[1 + floor(random() * 5)::int]; end loop;
      ev := zt.eval_panel(w, d % 2 = 1);
      if ev->>'rule' = target then
        return jsonb_build_object('serial', p_serial, 'wires', to_jsonb(w), 'answer', (ev->>'answer')::int, 'rule', target);
      end if;
    end loop;
  end loop;
  raise exception 'generation_impossible';
end $function$;

-- Une phrase d'indice sur le code (vraie si p_real, sinon valeur au hasard : leurre)
create or replace function zt.pin_clue(p_type text, p_digs int[], p_real boolean)
 returns text language plpgsql set search_path to ''
as $function$
declare v int;
begin
  if p_type = 'sum' then
    v := case when p_real then (select sum(x) from unnest(p_digs) x) else 6 + floor(random()*25)::int end;
    return 'La somme des 4 chiffres du code vaut ' || v || '.';
  elsif p_type = 'max' then
    v := case when p_real then (select max(x) from unnest(p_digs) x) else 4 + floor(random()*6)::int end;
    return 'Le plus grand chiffre du code est ' || v || '.';
  elsif p_type = 'min' then
    v := case when p_real then (select min(x) from unnest(p_digs) x) else floor(random()*6)::int end;
    return 'Le plus petit chiffre du code est ' || v || '.';
  elsif p_type = 'has' then
    v := case when p_real then p_digs[1 + floor(random()*4)::int] else floor(random()*10)::int end;
    return 'Le code contient le chiffre ' || v || '.';
  else
    v := case when p_real then (select x from generate_series(0,9) x where x <> all(p_digs) order by random() limit 1) else floor(random()*10)::int end;
    return 'Le code ne contient pas le chiffre ' || v || '.';
  end if;
end $function$;

-- Distribue les indices aux techniciens (1 chacun, 2 si technicien unique ; au plus 3 indices) ; solo : tout au joueur
create or replace function zt.make_pin_info(p_code text)
 returns void language plpgsql security definer set search_path to ''
as $function$
declare s text; v_pin text; digs int[]; sl text[]; n_t int; n_ind int; ind text[]; types text[];
        p record; i int := 0; rows_ jsonb; j int; used text[]; dl text; k int; all_t text[] := array['sum','max','min','has','not'];
begin
  select r.serial into s from zt.rooms r where r.code = p_code;
  select c.pin into v_pin from zt.room_panels rp join zt.configs c on c.id = rp.config_id where rp.room_code = p_code and c.kind = 'pin';
  digs := array(select d::int from unnest(string_to_array(v_pin, null)) d);
  sl := array(select ch from regexp_split_to_table(s, '') ch where ch ~ '[A-Z]');
  select count(*) into n_t from zt.players where room_code = p_code and role = 'technician';
  n_ind := least(greatest(n_t, 2), 3);
  ind := array(select x from unnest(sl) x order by random() limit n_ind);
  types := array(select t from unnest(all_t) t order by random() limit n_ind);
  update zt.players set clues = null where room_code = p_code;
  for p in select id, role from zt.players where room_code = p_code order by random() loop
    if p.role = 'technician' then i := i + 1; end if;
    if p.role <> 'technician' and n_t > 0 then continue; end if;
    rows_ := '[]'::jsonb; used := sl;
    for j in 1..n_ind loop
      if n_t <= 1 or ((i - 1) % n_ind) + 1 = j then
        rows_ := rows_ || jsonb_build_array(jsonb_build_object('l', ind[j], 't', zt.pin_clue(types[j], digs, true)));
      end if;
    end loop;
    while jsonb_array_length(rows_) < 5 loop
      select x into dl from (select substr('ABCDEFGHJKLMNPQRSTUVWXYZ', g, 1) x from generate_series(1,24) g) q where x <> all(used) order by random() limit 1;
      used := used || dl;
      rows_ := rows_ || jsonb_build_array(jsonb_build_object('l', dl, 't', zt.pin_clue(all_t[1 + floor(random()*5)::int], digs, false)));
    end loop;
    update zt.players set clues = (select jsonb_agg(e order by e->>'l') from jsonb_array_elements(rows_) e) where id = p.id;
  end loop;
end $function$;

create or replace function zt.make_panels(p_code text)
 returns void language plpgsql security definer set search_path to ''
as $function$
declare v_ids text[] := array[]::text[]; v_n int; g jsonb; v_id text; v_serial text;
begin
  delete from zt.configs c where c.id like 'G%' and not exists (select 1 from zt.room_panels rp where rp.config_id = c.id);
  v_serial := zt.gen_serial();
  update zt.rooms set serial = v_serial where code = p_code;
  foreach v_n in array array(select x from generate_series(3,8) x order by random() limit 3) loop
    g := zt.gen_panel2(v_n, v_serial);
    v_id := 'G' || replace(gen_random_uuid()::text, '-', '');
    insert into zt.configs(id, serial, wires, answer)
      values (v_id, v_serial, array(select jsonb_array_elements_text(g->'wires')), (g->>'answer')::int);
    v_ids := v_ids || v_id;
  end loop;
  g := zt.gen_pin();
  v_id := 'G' || replace(gen_random_uuid()::text, '-', '');
  insert into zt.configs(id, serial, wires, answer, kind, pin)
    values (v_id, v_serial, '{}'::text[], 0, 'pin', g->>'code');
  v_ids := v_ids || v_id;
  insert into zt.room_panels(room_code, pos, config_id)
    select p_code, row_number() over (order by random())::int, x from unnest(v_ids) x;
  update zt.rooms set batteries = null where code = p_code;
  perform zt.make_pin_info(p_code);
end $function$;

create or replace function zt.manual_pin()
 returns jsonb language sql immutable set search_path to ''
as $function$
  select jsonb_build_object(
    'rules', jsonb_build_array(
      jsonb_build_object('n','P.1','t','Voyants rouges allumés : leur nombre est le nombre de chiffres pairs du code (le 0 est pair).'),
      jsonb_build_object('n','P.2','t','Voyants bleus allumés : leur nombre est le nombre de chiffres du code supérieurs ou égaux à 6.'),
      jsonb_build_object('n','P.3','t','Le code a 4 chiffres, tous différents.'),
      jsonb_build_object('n','P.4','t','Lettres : l''opérateur te lit toutes les lettres du numéro de série. Ton tableau ci-dessous associe un indice à quelques lettres. Si une de ces lettres figure dans le numéro de série, annonce son indice à l''opérateur ; sinon, ignore-la. Les lettres sans ligne dans ton tableau ne te concernent pas.')),
    'verdicts', jsonb_build_array(
      '✓ vert : bon chiffre, bonne place.',
      '◇ orange : bon chiffre, mauvaise place.',
      '✕ gris : ce chiffre n''est pas dans le code.'),
    'penalties', 'Un code faux compte comme une erreur : 1re = −20 s, 2e = −30 s, 3e = explosion.')
$function$;

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
                 'pos', rp.pos, 'kind', 'pin', 'serial', c.serial, 'clues', case when (select count(*) from zt.players where room_code = p_code) = 1 then me.clues else null end, 'wires', '[]'::jsonb, 'cut', '[]'::jsonb,
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
      m := m || jsonb_build_object('techs', v_techs, 'pin_clues', coalesce(me.clues, '[]'::jsonb));
      if (select count(*) from zt.players where room_code = p_code) = 1 then m := m || jsonb_build_object('solo_serial', r.serial); end if;
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
