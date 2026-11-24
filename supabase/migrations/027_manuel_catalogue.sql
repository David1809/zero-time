-- 027 — Manuel V2 : catalogue de pages à signature, générateur côté serveur, piles (2 à 4), carnet par technicien.
-- Retour arrière : 027_down.sql (les anciennes fonctions sont conservées sous le suffixe _v1).
create table if not exists zt.pages (
  id text primary key,
  module text not null check (module in ('wires','pin')),
  family text not null,
  sig jsonb not null,
  spec jsonb not null,
  txt jsonb not null,
  unique (module, sig)
);
alter table zt.pages enable row level security;
create table if not exists zt.room_pages (
  room_code text not null references zt.rooms(code) on delete cascade,
  tab int not null,
  page_id text not null references zt.pages(id),
  kind text not null check (kind in ('useful','decoy')),
  holder uuid,
  primary key (room_code, tab)
);
alter table zt.room_pages enable row level security;
alter table zt.configs add column if not exists page_id text;

-- ---------- évaluateur des consignes de fils (source unique : la spec) ----------
create or replace function zt.w_cond(c jsonb, w text[], p int) returns boolean
language plpgsql immutable set search_path to '' as $f$
declare k text := c->>0; n int := array_length(w, 1); i int;
begin
  if k = 'gt' then return cardinality(array_positions(w, c->>1)) > cardinality(array_positions(w, c->>2));
  elsif k = 'eq' then return cardinality(array_positions(w, c->>1)) = (c->>2)::int;
  elsif k = 'ge' then return cardinality(array_positions(w, c->>1)) >= (c->>2)::int;
  elsif k = 'last' then return w[n] = c->>1;
  elsif k = 'first' then return w[1] = c->>1;
  elsif k = 'pos' then return w[(c->>1)::int] = c->>2;
  elsif k = 'adj' then
    for i in 1..n-1 loop if w[i] = c->>1 and w[i+1] = c->>1 then return true; end if; end loop;
    return false;
  elsif k = 'pil_eq' then return p = (c->>1)::int;
  elsif k = 'pil_ge' then return p >= (c->>1)::int;
  elsif k = 'pil_le' then return p <= (c->>1)::int;
  end if;
  raise exception 'condition_inconnue';
end $f$;

create or replace function zt.w_act(a jsonb, w text[]) returns int
language plpgsql immutable set search_path to '' as $f$
declare k text := a->>0; n int := array_length(w, 1);
begin
  if k = 'pos' then return (a->>1)::int;
  elsif k = 'last' then return n;
  elsif k = 'first' then return 1;
  elsif k = 'penult' then return n - 1;
  elsif k = 'lastc' then return (select max(i) from unnest(array_positions(w, a->>1)) i);
  elsif k = 'firstc' then return (select min(i) from unnest(array_positions(w, a->>1)) i);
  end if;
  raise exception 'action_inconnue';
end $f$;

create or replace function zt.w_eval(spec jsonb, w text[], p int) returns jsonb
language plpgsql immutable set search_path to '' as $f$
declare r jsonb; i int := 0;
begin
  for r in select * from jsonb_array_elements(spec->'rules') loop
    i := i + 1;
    if zt.w_cond(r->'c', w, p) then return jsonb_build_object('rule', i, 'answer', zt.w_act(r->'a', w)); end if;
  end loop;
  return jsonb_build_object('rule', 0, 'answer', zt.w_act(spec->'final', w));
end $f$;

-- Tire des fils compatibles avec la signature ; la consigne visée est tirée au hasard (équilibre des réponses).
create or replace function zt.gen_wires(spec jsonb, p int) returns jsonb
language plpgsql set search_path to '' as $f$
declare n int := (spec->>'n')::int; cols text[] := array(select jsonb_array_elements_text(spec->'cols'));
  nc int := array_length(cols, 1); w text[]; ev jsonb; tgt int; k int; i int; tgts int[];
begin
  tgts := array(select x from generate_series(0, jsonb_array_length(spec->'rules')) x order by random());
  foreach tgt in array tgts loop
    for k in 1..2500 loop
      w := array[]::text[];
      for i in 1..n loop w := w || cols[1 + floor(random() * nc)::int]; end loop;
      if (select count(distinct x) from unnest(w) x) <> nc then continue; end if;
      ev := zt.w_eval(spec, w, p);
      if (ev->>'rule')::int = tgt then
        return jsonb_build_object('wires', to_jsonb(w), 'answer', (ev->>'answer')::int, 'rule', tgt);
      end if;
    end loop;
  end loop;
  raise exception 'generation_impossible';
end $f$;

-- ---------- digicode : voyants et indices décrits par la page ----------
create or replace function zt.rule_ok(r jsonb, d int) returns boolean
language sql immutable set search_path to '' as $f$
  select case r->>'t' when 'even' then d % 2 = 0 when 'odd' then d % 2 = 1
                      when 'ge' then d >= (r->>'k')::int else d <= (r->>'k')::int end $f$;

create or replace function zt.clue_ok(c jsonb, digs int[]) returns boolean
language sql immutable set search_path to '' as $f$
  select case c->>'t'
    when 'sum' then (select sum(x) from unnest(digs) x) = (c->>'v')::int
    when 'max' then (select max(x) from unnest(digs) x) = (c->>'v')::int
    when 'min' then (select min(x) from unnest(digs) x) = (c->>'v')::int
    when 'has' then (c->>'v')::int = any(digs)
    else (c->>'v')::int <> all(digs) end $f$;

create or replace function zt.when_ok(w jsonb, piles int, serial text) returns boolean
language sql immutable set search_path to '' as $f$
  select case w->>0
    when 'piles' then piles = (w->>1)::int
    when 'somme_paire' then ((select coalesce(sum(ch::int), 0) from regexp_split_to_table(regexp_replace(serial, '\D', '', 'g'), '') ch where ch <> '') % 2 = 0) = (w->>1)::boolean
    when 'voyelle' then (serial ~ '[AEUY]') = (w->>1)::boolean
    else false end $f$;

create or replace function zt.pin_lamps3(p_pin text, spec jsonb) returns int[]
language sql immutable set search_path to '' as $f$
  with d as (select x::int v from unnest(string_to_array(p_pin, null)) x)
  select array[(select count(*)::int from d where zt.rule_ok(spec->'red', v)),
               (select count(*)::int from d where zt.rule_ok(spec->'blue', v))] $f$;

create or replace function zt.pin_cands(spec jsonb, sr int, sb int, piles int, serial text) returns setof text
language sql stable set search_path to '' as $f$
  select a::text || b::text || c::text || d::text
  from generate_series(0,9) a, generate_series(0,9) b, generate_series(0,9) c, generate_series(0,9) d
  where a <> b and a <> c and a <> d and b <> c and b <> d and c <> d
    and (select count(*) from unnest(array[a,b,c,d]) x where zt.rule_ok(spec->'red', x)) = sr
    and (select count(*) from unnest(array[a,b,c,d]) x where zt.rule_ok(spec->'blue', x)) = sb
    and not exists (select 1 from jsonb_array_elements(spec->'clues') g
                    where zt.when_ok(g->'w', piles, serial)
                      and exists (select 1 from jsonb_array_elements(g->'c') cl where not zt.clue_ok(cl, array[a,b,c,d]))) $f$;

-- ---------- génération d'une partie ----------
alter function zt.make_panels(text) rename to make_panels_v1;
alter function zt.view_for(text, uuid) rename to view_for_v1;

create or replace function zt.make_panels(p_code text) returns void
language plpgsql security definer set search_path to '' as $f$
declare
  v_serial text; v_piles int; v_ids text[] := array[]::text[]; v_id text; g jsonb; pg record;
  v_useful text[] := array[]::text[]; v_dec text[]; v_players uuid[]; v_n int; i int; t record; v_decoys int := 7; v_code text;
begin
  delete from zt.configs c where c.id like 'G%' and not exists (select 1 from zt.room_panels rp where rp.config_id = c.id);
  delete from zt.room_pages where room_code = p_code;
  v_serial := zt.gen_serial();
  v_piles := 2 + floor(random() * 3)::int;
  update zt.rooms set serial = v_serial, batteries = v_piles, lamp_rules = null where code = p_code;
  -- trois configurations de fils, issues de trois familles différentes
  for pg in select * from (select distinct on (family) id, family, spec from zt.pages where module = 'wires' order by family, random()) s
            order by random() limit 3 loop
    g := zt.gen_wires(pg.spec, v_piles);
    v_id := 'G' || replace(gen_random_uuid()::text, '-', '');
    insert into zt.configs(id, serial, wires, answer, kind, page_id)
      values (v_id, v_serial, array(select jsonb_array_elements_text(g->'wires')), (g->>'answer')::int, 'wires', pg.id);
    v_ids := v_ids || v_id; v_useful := v_useful || pg.id;
  end loop;
  -- une configuration de digicode
  select id, spec, sig into pg from zt.pages where module = 'pin' order by random() limit 1;
  select x into v_code from zt.pin_cands(pg.spec, (pg.sig->>'r')::int, (pg.sig->>'b')::int, v_piles, v_serial) x order by random() limit 1;
  if v_code is null then raise exception 'generation_impossible'; end if;
  v_id := 'G' || replace(gen_random_uuid()::text, '-', '');
  insert into zt.configs(id, serial, wires, answer, kind, pin, page_id) values (v_id, v_serial, '{}'::text[], 0, 'pin', v_code, pg.id);
  v_ids := v_ids || v_id; v_useful := v_useful || pg.id;
  insert into zt.room_panels(room_code, pos, config_id)
    select p_code, row_number() over (order by random())::int, x from unnest(v_ids) x;
  -- leurres : d'abord les pages voisines (même famille), puis le complément
  v_dec := array(select p.id from zt.pages p
                  where p.family in (select family from zt.pages where id = any(v_useful)) and p.id <> all(v_useful)
                  order by random() limit v_decoys);
  if coalesce(cardinality(v_dec), 0) < v_decoys then
    v_dec := coalesce(v_dec, '{}') || array(select p.id from zt.pages p
                  where p.id <> all(v_useful) and p.id <> all(coalesce(v_dec, '{}'))
                  order by (p.module = 'wires') desc, random() limit v_decoys - coalesce(cardinality(v_dec), 0));
  end if;
  insert into zt.room_pages(room_code, tab, page_id, kind)
    select p_code, (row_number() over (order by random()))::int, x, case when x = any(v_useful) then 'useful' else 'decoy' end
      from unnest(v_useful || v_dec) x;
  -- répartition : en solo (ou sans technicien) tout va au joueur ; sinon pages utiles en tourniquet, leurres vers le moins chargé
  select array_agg(id order by random()) into v_players from zt.players where room_code = p_code and role = 'technician';
  if v_players is null or (select count(*) from zt.players where room_code = p_code) = 1 then
    select array_agg(id) into v_players from zt.players where room_code = p_code;
  end if;
  v_n := cardinality(v_players); i := 0;
  for t in select tab from zt.room_pages where room_code = p_code and kind = 'useful' order by random() loop
    i := i + 1;
    update zt.room_pages set holder = v_players[1 + (i - 1) % v_n] where room_code = p_code and tab = t.tab;
  end loop;
  for t in select tab from zt.room_pages where room_code = p_code and kind = 'decoy' order by random() loop
    update zt.room_pages set holder = (
      select u.h from unnest(v_players) as u(h)
      left join zt.room_pages rp on rp.room_code = p_code and rp.holder = u.h
      group by u.h order by count(rp.tab), random() limit 1)
     where room_code = p_code and tab = t.tab;
  end loop;
  update zt.players set clues = null where room_code = p_code;
end $f$;

create or replace function zt.view_for(p_code text, p_player uuid) returns jsonb
language plpgsql security definer set search_path to '' as $f$
declare r zt.rooms; me zt.players; v jsonb; g jsonb; v_solved int; m jsonb; v_techs int;
begin
  select * into r from zt.rooms where code = p_code;
  select * into me from zt.players where id = p_player and room_code = p_code;
  if r.code is null or me.id is null then return null; end if;
  select jsonb_build_object(
    'code', r.code, 'status', r.status, 'role_mode', r.role_mode, 'creator_role', r.creator_role,
    'is_creator', (r.creator_id = me.id), 'solo', (count(*) = 1), 'duration_s', r.duration_s,
    'me', jsonb_build_object('id', me.id, 'pseudo', me.pseudo, 'role', me.role),
    'players', coalesce(jsonb_agg(jsonb_build_object('pseudo', p.pseudo, 'is_creator', (p.id = r.creator_id)) order by p.joined_at), '[]'::jsonb)
  ) into v from zt.players p where p.room_code = p_code;

  if r.status = 'playing' then
    if me.role = 'operator' then
      select jsonb_build_object(
        'server_now', now(), 'ends_at', r.ends_at, 'errors', r.errors, 'event', r.last_event, 'batteries', r.batteries,
        'panels', coalesce(jsonb_agg(
          case when c.kind = 'pin' then jsonb_build_object(
                 'pos', rp.pos, 'kind', 'pin', 'serial', c.serial, 'clues', null, 'wires', '[]'::jsonb, 'cut', '[]'::jsonb,
                 'state', rp.state, 'attempts', rp.attempts,
                 'reds', (zt.pin_lamps3(c.pin, pg.spec))[1], 'blues', (zt.pin_lamps3(c.pin, pg.spec))[2])
               else jsonb_build_object(
                 'pos', rp.pos, 'kind', 'wires', 'serial', c.serial, 'wires', to_jsonb(c.wires),
                 'cut', to_jsonb(rp.cut), 'state', rp.state) end
          order by rp.pos), '[]'::jsonb)
      ) into g
      from zt.room_panels rp join zt.configs c on c.id = rp.config_id left join zt.pages pg on pg.id = c.page_id
      where rp.room_code = p_code;
      v := v || jsonb_build_object('game', g);
    elsif me.role = 'technician' then
      select count(*) into v_techs from zt.players where room_code = p_code and role = 'technician';
      m := jsonb_build_object('techs', v_techs, 'pages', coalesce((
             select jsonb_agg(jsonb_build_object('n', rp.tab) || pg.txt order by rp.tab)
               from zt.room_pages rp join zt.pages pg on pg.id = rp.page_id
              where rp.room_code = p_code and rp.holder = me.id), '[]'::jsonb));
      if (select count(*) from zt.players where room_code = p_code) = 1 then
        m := m || jsonb_build_object('solo_serial', r.serial, 'solo_piles', r.batteries);
      end if;
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
        || case when r.outcome = 'defused' then jsonb_build_object('remaining_ms', r.remaining_ms) else '{}'::jsonb end);
  elsif r.status = 'abandoned' then
    v := v || jsonb_build_object('end', jsonb_build_object('outcome', 'abandoned'));
  end if;
  return v;
end $f$;
