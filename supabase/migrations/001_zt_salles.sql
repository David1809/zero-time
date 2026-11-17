-- ZERO TIME — lots 1 et 2 : schéma zt, salles, joueurs, rôles.
-- Additif uniquement : ne touche à aucune table de Dé-lire (schéma public).
-- Les tables zt ne sont jamais accessibles directement par l'appli (RLS sans politique) ;
-- tout passe par des fonctions public.zt_* (security definer), seul point d'entrée.

create schema if not exists zt;

create table zt.rooms (
  code        text primary key check (code ~ '^[A-Z]{4}$'),
  created_at  timestamptz not null default now(),
  creator_id  uuid,
  status      text not null default 'lobby' check (status in ('lobby','playing','ended','abandoned')),
  role_mode   text not null default 'choose' check (role_mode in ('choose','random')),
  creator_role text check (creator_role in ('operator','technician')),
  updated_at  timestamptz not null default now()
);

create table zt.players (
  id         uuid primary key default gen_random_uuid(),
  room_code  text not null references zt.rooms(code) on delete cascade,
  token      uuid not null default gen_random_uuid(),
  pseudo     text not null check (char_length(pseudo) between 1 and 16),
  role       text check (role in ('operator','technician')),
  joined_at  timestamptz not null default now(),
  unique (room_code, pseudo)
);
create index on zt.players (room_code);

alter table zt.rooms   enable row level security;
alter table zt.players enable row level security;
-- Aucune politique : accès direct refusé à anon et authenticated.
revoke all on all tables in schema zt from anon, authenticated;
revoke usage on schema zt from anon, authenticated;

-- Code de salle : 4 lettres, sans I ni O (confusion avec 1 et 0).
create or replace function zt.new_code() returns text
language plpgsql security definer set search_path = '' as $$
declare c text; i int;
begin
  loop
    c := '';
    for i in 1..4 loop
      c := c || substr('ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random()*24)::int, 1);
    end loop;
    exit when not exists (select 1 from zt.rooms where code = c);
  end loop;
  return c;
end $$;

-- Vue d'un joueur : ne contient que ce qu'il a le droit de voir.
create or replace function zt.view_for(p_code text, p_player uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r zt.rooms; me zt.players; v jsonb;
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
  return v;
end $$;

-- Diffuse à chaque joueur SA vue, sur son canal privé zt-CODE-<id joueur> (id non devinable).
create or replace function zt.push_state(p_code text) returns void
language plpgsql security definer set search_path = '' as $$
declare p record;
begin
  for p in select id from zt.players where room_code = p_code loop
    perform realtime.send(zt.view_for(p_code, p.id), 'state', 'zt-' || p_code || '-' || p.id::text, false);
  end loop;
end $$;

-- Créer une salle
create or replace function public.zt_create_room(p_pseudo text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_code text; v_p zt.players; v_pseudo text := btrim(coalesce(p_pseudo,''));
begin
  if char_length(v_pseudo) not between 1 and 16 then raise exception 'pseudo_invalide'; end if;
  v_code := zt.new_code();
  insert into zt.rooms(code) values (v_code);
  insert into zt.players(room_code, pseudo) values (v_code, v_pseudo) returning * into v_p;
  update zt.rooms set creator_id = v_p.id where code = v_code;
  perform zt.push_state(v_code);
  return jsonb_build_object('code', v_code, 'player_id', v_p.id, 'token', v_p.token);
end $$;

-- Rejoindre une salle (2 joueurs maximum, avant le lancement)
create or replace function public.zt_join_room(p_code text, p_pseudo text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_code text := upper(btrim(coalesce(p_code,''))); r zt.rooms; v_p zt.players; v_pseudo text := btrim(coalesce(p_pseudo,''));
begin
  if char_length(v_pseudo) not between 1 and 16 then raise exception 'pseudo_invalide'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.code is null then raise exception 'salle_introuvable'; end if;
  if r.status <> 'lobby' then raise exception 'partie_deja_lancee'; end if;
  if (select count(*) from zt.players where room_code = v_code) >= 2 then raise exception 'salle_pleine'; end if;
  if exists (select 1 from zt.players where room_code = v_code and lower(pseudo) = lower(v_pseudo)) then raise exception 'pseudo_deja_pris'; end if;
  insert into zt.players(room_code, pseudo) values (v_code, v_pseudo) returning * into v_p;
  perform zt.push_state(v_code);
  return jsonb_build_object('code', v_code, 'player_id', v_p.id, 'token', v_p.token);
end $$;

-- Retrouver sa place (reconnexion, sans pénalité)
create or replace function public.zt_get_state(p_code text, p_token uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players;
begin
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  return zt.view_for(v_code, me.id);
end $$;

-- Le créateur choisit : choisir son rôle ou tirage au sort
create or replace function public.zt_set_role_mode(p_code text, p_token uuid, p_mode text, p_role text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms;
begin
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.creator_id <> me.id then raise exception 'reserve_au_createur'; end if;
  if r.status <> 'lobby' then raise exception 'partie_deja_lancee'; end if;
  if p_mode not in ('choose','random') then raise exception 'mode_invalide'; end if;
  if p_mode = 'choose' and p_role is not null and p_role not in ('operator','technician') then raise exception 'role_invalide'; end if;
  update zt.rooms set role_mode = p_mode,
         creator_role = case when p_mode = 'choose' then p_role else null end,
         updated_at = now()
   where code = v_code;
  perform zt.push_state(v_code);
  return zt.view_for(v_code, me.id);
end $$;

-- Lancer : créateur seul, 2 joueurs présents, rôles attribués (la partie elle-même arrive aux lots suivants)
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
  update zt.players set role = v_cr where id = me.id;
  update zt.players set role = case when v_cr = 'operator' then 'technician' else 'operator' end where id = v_other;
  update zt.rooms set status = 'playing', updated_at = now() where code = v_code;
  perform zt.push_state(v_code);
  return zt.view_for(v_code, me.id);
end $$;

-- Seules les fonctions public.zt_* sont appelables depuis l'appli.
revoke all on function zt.new_code(), zt.view_for(text, uuid), zt.push_state(text) from public, anon, authenticated;
revoke all on function public.zt_create_room(text), public.zt_join_room(text, text), public.zt_get_state(text, uuid),
  public.zt_set_role_mode(text, uuid, text, text), public.zt_start(text, uuid) from public;
grant execute on function public.zt_create_room(text), public.zt_join_room(text, text), public.zt_get_state(text, uuid),
  public.zt_set_role_mode(text, uuid, text, text), public.zt_start(text, uuid) to anon, authenticated;
