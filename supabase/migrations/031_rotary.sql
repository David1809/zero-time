create table if not exists zt.rot (
  room_code text primary key references zt.rooms(code) on delete cascade,
  page_id text not null, start int[] not null, cur int[] not null, target int[] not null, links jsonb not null,
  state text not null default 'todo', last_good int, moves int not null default 0, tries int not null default 0
);
alter table zt.rot enable row level security;
-- ROTARY V1 : généré par tools/rotary_build.py

insert into zt.pages(id, module, family, sig, spec, txt) values ('R01','rot','RA','{"ang": 0}'::jsonb,'{"off": [1, -1, 1, 0], "links": [{"f": 0, "t": 2, "d": 2}, {"f": 2, "t": 3, "d": 3}, {"f": 3, "t": 1, "d": -1}]}'::jsonb,'{"sig": "Molettes au départ — aucun symbole anguleux (4 ronds)", "rules": ["Molette <strong>A</strong> : position finale = départ <strong>+ nombre de piles</strong> crans vers la droite.", "Molette <strong>B</strong> : position finale = départ <strong>− nombre de piles</strong> crans (vers la gauche).", "Molette <strong>C</strong> : position finale = départ <strong>+ nombre de piles</strong> crans vers la droite.", "Molette <strong>D</strong> : position finale = <strong>départ</strong> (ne pas la déplacer, sauf si elle est entraînée).", "Quand on relâche <strong>A</strong> sur un autre symbole, <strong>C</strong> avance de <strong>2 crans</strong> vers la droite.", "Quand on relâche <strong>C</strong> sur un autre symbole, <strong>D</strong> avance de <strong>3 crans</strong> vers la droite.", "Quand on relâche <strong>D</strong> sur un autre symbole, <strong>B</strong> recule de <strong>1 cran</strong> vers la gauche."], "end": "Réglez chaque molette une seule fois, et toujours <strong>après</strong> celles qui l’entraînent.", "note": "L’entraînement est fixe, quel que soit le nombre de crans tournés. Anguleux : triangle, carré, croix, losange. Ronds : cercle, onde, étoile, cible. Piles : nombre affiché sur la bombe.", "stamp": null}'::jsonb) on conflict (id) do update set spec=excluded.spec, txt=excluded.txt, sig=excluded.sig;
insert into zt.pages(id, module, family, sig, spec, txt) values ('R02','rot','RA','{"ang": 1}'::jsonb,'{"off": [-1, 1, 1, -1], "links": [{"f": 1, "t": 0, "d": 1}, {"f": 3, "t": 2, "d": -2}, {"f": 0, "t": 3, "d": 2}]}'::jsonb,'{"sig": "Molettes au départ — 1 symbole anguleux et 3 ronds", "rules": ["Molette <strong>A</strong> : position finale = départ <strong>− nombre de piles</strong> crans (vers la gauche).", "Molette <strong>B</strong> : position finale = départ <strong>+ nombre de piles</strong> crans vers la droite.", "Molette <strong>C</strong> : position finale = départ <strong>+ nombre de piles</strong> crans vers la droite.", "Molette <strong>D</strong> : position finale = départ <strong>− nombre de piles</strong> crans (vers la gauche).", "Quand on relâche <strong>B</strong> sur un autre symbole, <strong>A</strong> avance de <strong>1 cran</strong> vers la droite.", "Quand on relâche <strong>D</strong> sur un autre symbole, <strong>C</strong> recule de <strong>2 crans</strong> vers la gauche.", "Quand on relâche <strong>A</strong> sur un autre symbole, <strong>D</strong> avance de <strong>2 crans</strong> vers la droite."], "end": "Réglez chaque molette une seule fois, et toujours <strong>après</strong> celles qui l’entraînent.", "note": "L’entraînement est fixe, quel que soit le nombre de crans tournés. Anguleux : triangle, carré, croix, losange. Ronds : cercle, onde, étoile, cible. Piles : nombre affiché sur la bombe.", "stamp": "À VÉRIFIER"}'::jsonb) on conflict (id) do update set spec=excluded.spec, txt=excluded.txt, sig=excluded.sig;
insert into zt.pages(id, module, family, sig, spec, txt) values ('R03','rot','RA','{"ang": 2}'::jsonb,'{"off": [1, 1, -1, -1], "links": [{"f": 2, "t": 0, "d": -1}, {"f": 0, "t": 1, "d": 3}, {"f": 3, "t": 1, "d": 2}]}'::jsonb,'{"sig": "Molettes au départ — 2 symboles anguleux et 2 ronds", "rules": ["Molette <strong>A</strong> : position finale = départ <strong>+ nombre de piles</strong> crans vers la droite.", "Molette <strong>B</strong> : position finale = départ <strong>+ nombre de piles</strong> crans vers la droite.", "Molette <strong>C</strong> : position finale = départ <strong>− nombre de piles</strong> crans (vers la gauche).", "Molette <strong>D</strong> : position finale = départ <strong>− nombre de piles</strong> crans (vers la gauche).", "Quand on relâche <strong>C</strong> sur un autre symbole, <strong>A</strong> recule de <strong>1 cran</strong> vers la gauche.", "Quand on relâche <strong>A</strong> sur un autre symbole, <strong>B</strong> avance de <strong>3 crans</strong> vers la droite.", "Quand on relâche <strong>D</strong> sur un autre symbole, <strong>B</strong> avance de <strong>2 crans</strong> vers la droite."], "end": "Réglez chaque molette une seule fois, et toujours <strong>après</strong> celles qui l’entraînent.", "note": "L’entraînement est fixe, quel que soit le nombre de crans tournés. Anguleux : triangle, carré, croix, losange. Ronds : cercle, onde, étoile, cible. Piles : nombre affiché sur la bombe.", "stamp": "ORDRE IMPÉRATIF"}'::jsonb) on conflict (id) do update set spec=excluded.spec, txt=excluded.txt, sig=excluded.sig;
insert into zt.pages(id, module, family, sig, spec, txt) values ('R04','rot','RA','{"ang": 3}'::jsonb,'{"off": [0, 1, -1, 1], "links": [{"f": 3, "t": 0, "d": 2}, {"f": 1, "t": 2, "d": -3}, {"f": 0, "t": 2, "d": 1}]}'::jsonb,'{"sig": "Molettes au départ — 3 symboles anguleux et 1 rond", "rules": ["Molette <strong>A</strong> : position finale = <strong>départ</strong> (ne pas la déplacer, sauf si elle est entraînée).", "Molette <strong>B</strong> : position finale = départ <strong>+ nombre de piles</strong> crans vers la droite.", "Molette <strong>C</strong> : position finale = départ <strong>− nombre de piles</strong> crans (vers la gauche).", "Molette <strong>D</strong> : position finale = départ <strong>+ nombre de piles</strong> crans vers la droite.", "Quand on relâche <strong>D</strong> sur un autre symbole, <strong>A</strong> avance de <strong>2 crans</strong> vers la droite.", "Quand on relâche <strong>B</strong> sur un autre symbole, <strong>C</strong> recule de <strong>3 crans</strong> vers la gauche.", "Quand on relâche <strong>A</strong> sur un autre symbole, <strong>C</strong> avance de <strong>1 cran</strong> vers la droite."], "end": "Réglez chaque molette une seule fois, et toujours <strong>après</strong> celles qui l’entraînent.", "note": "L’entraînement est fixe, quel que soit le nombre de crans tournés. Anguleux : triangle, carré, croix, losange. Ronds : cercle, onde, étoile, cible. Piles : nombre affiché sur la bombe.", "stamp": null}'::jsonb) on conflict (id) do update set spec=excluded.spec, txt=excluded.txt, sig=excluded.sig;
insert into zt.pages(id, module, family, sig, spec, txt) values ('R05','rot','RA','{"ang": 4}'::jsonb,'{"off": [1, 0, -1, 1], "links": [{"f": 1, "t": 3, "d": -2}, {"f": 2, "t": 1, "d": 1}, {"f": 0, "t": 2, "d": 2}]}'::jsonb,'{"sig": "Molettes au départ — 4 symboles anguleux (aucun rond)", "rules": ["Molette <strong>A</strong> : position finale = départ <strong>+ nombre de piles</strong> crans vers la droite.", "Molette <strong>B</strong> : position finale = <strong>départ</strong> (ne pas la déplacer, sauf si elle est entraînée).", "Molette <strong>C</strong> : position finale = départ <strong>− nombre de piles</strong> crans (vers la gauche).", "Molette <strong>D</strong> : position finale = départ <strong>+ nombre de piles</strong> crans vers la droite.", "Quand on relâche <strong>B</strong> sur un autre symbole, <strong>D</strong> recule de <strong>2 crans</strong> vers la gauche.", "Quand on relâche <strong>C</strong> sur un autre symbole, <strong>B</strong> avance de <strong>1 cran</strong> vers la droite.", "Quand on relâche <strong>A</strong> sur un autre symbole, <strong>C</strong> avance de <strong>2 crans</strong> vers la droite."], "end": "Réglez chaque molette une seule fois, et toujours <strong>après</strong> celles qui l’entraînent.", "note": "L’entraînement est fixe, quel que soit le nombre de crans tournés. Anguleux : triangle, carré, croix, losange. Ronds : cercle, onde, étoile, cible. Piles : nombre affiché sur la bombe.", "stamp": "DOUBLE CONTRÔLE"}'::jsonb) on conflict (id) do update set spec=excluded.spec, txt=excluded.txt, sig=excluded.sig;
alter function zt.make_panels(text) rename to make_panels_v2;
alter function zt.view_for(text, uuid) rename to view_for_v2;

create or replace function zt.make_panels(p_code text) returns void language plpgsql security definer set search_path to '' as $f$
declare r zt.rooms; st int[]; ang int; pg zt.pages; tg int[]; n int; t int; h uuid; i int;
begin
  perform zt.make_panels_v2(p_code);
  delete from zt.rot where room_code = p_code;
  select * into r from zt.rooms where code = p_code;
  st := array[floor(random()*8)::int, floor(random()*8)::int, floor(random()*8)::int, floor(random()*8)::int];
  ang := (select count(*) from unnest(st) x where x in (0,2,3,4));
  select * into pg from zt.pages where module = 'rot' and (sig->>'ang')::int = ang;
  tg := array[]::int[];
  for i in 1..4 loop
    tg := tg || ((((st[i] + (pg.spec->'off'->>(i-1))::int * r.batteries) % 8) + 8) % 8);
  end loop;
  insert into zt.rot(room_code, page_id, start, cur, target, links) values (p_code, pg.id, st, st, tg, pg.spec->'links');
  n := (select count(*) from zt.room_pages where room_code = p_code);
  t := 1 + floor(random()*(n+1))::int;
  update zt.room_pages set tab = -(tab+1) where room_code = p_code and tab >= t;
  update zt.room_pages set tab = -tab where room_code = p_code and tab < 0;
  select p.id into h from zt.players p where p.room_code = p_code and p.role = 'technician'
    order by (select count(*) from zt.room_pages x where x.room_code = p_code and x.holder = p.id and x.kind = 'useful'), random() limit 1;
  if h is null then select p.id into h from zt.players p where p.room_code = p_code order by p.id limit 1; end if;
  insert into zt.room_pages(room_code, tab, page_id, kind, holder) values (p_code, t, pg.id, 'useful', h);
end $f$;

create or replace function zt.view_for(p_code text, p_player uuid) returns jsonb language plpgsql security definer set search_path to '' as $f$
declare v jsonb; rt zt.rot;
begin
  v := zt.view_for_v2(p_code, p_player);
  if v ? 'game' then
    select * into rt from zt.rot where room_code = p_code;
    if rt.room_code is not null then
      v := jsonb_set(v, '{game,rot}', jsonb_build_object('cur', to_jsonb(rt.cur), 'state', rt.state, 'good', rt.last_good, 'moves', rt.moves));
    end if;
  end if;
  return v;
end $f$;
create or replace function public.zt_rot_move(p_code text, p_token uuid, p_knob int, p_pos int) returns jsonb
language plpgsql security definer set search_path to '' as $f$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms; rt zt.rot; nc int[]; l jsonb;
begin
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  if me.role is distinct from 'operator' then raise exception 'reserve_operateur'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.status <> 'playing' or r.paused_at is not null then return zt.view_for(v_code, me.id); end if;
  if now() >= r.ends_at then
    perform zt.finish(v_code, 'exploded', 'time'); perform zt.push_state(v_code); return zt.view_for(v_code, me.id);
  end if;
  select * into rt from zt.rot where room_code = v_code for update;
  if rt.room_code is null or rt.state = 'solved' or p_knob not between 0 and 3 or p_pos not between 0 and 7 then raise exception 'coupe_invalide'; end if;
  if rt.cur[p_knob+1] <> p_pos then
    nc := rt.cur; nc[p_knob+1] := p_pos;
    for l in select * from jsonb_array_elements(rt.links) loop
      if (l->>'f')::int = p_knob then
        nc[(l->>'t')::int + 1] := (((nc[(l->>'t')::int + 1] + (l->>'d')::int) % 8) + 8) % 8;
      end if;
    end loop;
    update zt.rot set cur = nc, moves = moves + 1 where room_code = v_code;
  end if;
  perform zt.push_state(v_code);
  return zt.view_for(v_code, me.id);
end $f$;

create or replace function public.zt_rot_check(p_code text, p_token uuid, p_action uuid) returns jsonb
language plpgsql security definer set search_path to '' as $f$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms; rt zt.rot; v_good int; v_errors int; v_pen int; i int;
begin
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  if me.role is distinct from 'operator' then raise exception 'reserve_operateur'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.status <> 'playing' or r.paused_at is not null then return zt.view_for(v_code, me.id); end if;
  if exists (select 1 from zt.actions where action_id = p_action) then return zt.view_for(v_code, me.id); end if;
  insert into zt.actions(action_id, room_code, player_id) values (p_action, v_code, me.id);
  if now() >= r.ends_at then
    perform zt.finish(v_code, 'exploded', 'time'); perform zt.push_state(v_code); return zt.view_for(v_code, me.id);
  end if;
  select * into rt from zt.rot where room_code = v_code for update;
  if rt.room_code is null or rt.state = 'solved' then raise exception 'coupe_invalide'; end if;
  v_good := 0;
  for i in 1..4 loop if rt.cur[i] = rt.target[i] then v_good := v_good + 1; end if; end loop;
  update zt.rot set last_good = v_good, tries = tries + 1, state = case when v_good = 4 then 'solved' else state end where room_code = v_code;
  if v_good = 4 then
    update zt.rooms set last_event = jsonb_build_object('id', p_action, 'type', 'ok', 'pos', 5), updated_at = now() where code = v_code;
  else
    v_errors := r.errors + 1;
    update zt.rooms set errors = v_errors where code = v_code;
    if v_errors >= 3 then
      update zt.rooms set last_event = jsonb_build_object('id', p_action, 'type', 'error', 'n', v_errors, 'penalty', 0) where code = v_code;
      perform zt.finish(v_code, 'exploded', 'errors');
    else
      v_pen := case when v_errors = 1 then 20 else 30 end;
      update zt.rooms set ends_at = ends_at - make_interval(secs => v_pen),
             last_event = jsonb_build_object('id', p_action, 'type', 'error', 'n', v_errors, 'penalty', v_pen), updated_at = now()
       where code = v_code;
      if now() >= r.ends_at - make_interval(secs => v_pen) then perform zt.finish(v_code, 'exploded', 'time'); end if;
    end if;
  end if;
  perform zt.push_state(v_code);
  return zt.view_for(v_code, me.id);
end $f$;

grant execute on function public.zt_rot_move(text, uuid, int, int) to anon, authenticated;
grant execute on function public.zt_rot_check(text, uuid, uuid) to anon, authenticated;

create or replace function public.zt_disarm(p_code text, p_token uuid, p_action uuid) returns jsonb
language plpgsql security definer set search_path to '' as $f$
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
  elsif exists (select 1 from zt.room_panels where room_code = v_code and state <> 'solved')
     or exists (select 1 from zt.rot where room_code = v_code and state <> 'solved') then
    raise exception 'modules_restants';
  else
    perform zt.finish(v_code, 'defused', null);
  end if;
  perform zt.push_state(v_code);
  return zt.view_for(v_code, me.id);
end $f$;
