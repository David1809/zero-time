-- ZERO TIME — lot 3 : panneaux, manuel, vues filtrées par rôle.
-- Les bonnes réponses ne quittent jamais la base : ni l'opérateur ni le technicien ne les reçoivent.

alter table zt.rooms add column if not exists ends_at timestamptz;
alter table zt.rooms add column if not exists errors int not null default 0;

create table if not exists zt.configs (
  id     text primary key,
  serial text not null,
  wires  text[] not null,
  answer int not null
);
alter table zt.configs enable row level security;
revoke all on zt.configs from anon, authenticated;

insert into zt.configs(id, serial, wires, answer) values
 ('P1','KB-4821','{blue,yellow,white,black}',2),
 ('P2','MT-3067','{red,blue,yellow,white}',1),
 ('P3','HL-9152','{red,blue,yellow,blue}',4),
 ('P4','ZQ-7314','{red,blue,yellow,black}',3),
 ('P5','XD-2605','{yellow,red,white,blue,black}',4),
 ('P6','FV-8140','{yellow,red,yellow,white,black}',1),
 ('P7','GN-5273','{blue,white,red,blue,white}',2),
 ('P8','CS-6908','{black,white,blue,black,yellow}',1)
on conflict (id) do nothing;

create table if not exists zt.room_panels (
  room_code text not null references zt.rooms(code) on delete cascade,
  pos       int  not null check (pos between 1 and 3),
  config_id text not null references zt.configs(id),
  state     text not null default 'todo' check (state in ('todo','solved')),
  cut       int[] not null default '{}',
  primary key (room_code, pos)
);
alter table zt.room_panels enable row level security;
revoke all on zt.room_panels from anon, authenticated;

-- Manuel du technicien (spécification V1.1, §4 et §5).
create or replace function zt.manual() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'read', jsonb_build_array(
      'Compte les fils de haut en bas : 4 ou 5.',
      'Regarde le dernier chiffre du numéro de série : pair ou impair.',
      'Demande à l''opérateur la liste des couleurs, dans l''ordre, de haut en bas.'),
    'w4', jsonb_build_array(
      jsonb_build_object('n','4.1','t','Aucun fil rouge : coupe le 2e fil.'),
      jsonb_build_object('n','4.2','t','Sinon, si le dernier fil est blanc : coupe le 1er fil.'),
      jsonb_build_object('n','4.3','t','Sinon, s''il y a plus d''un fil bleu : coupe le dernier fil bleu.'),
      jsonb_build_object('n','4.4','t','Sinon : coupe le 3e fil.')),
    'w5', jsonb_build_array(
      jsonb_build_object('n','5.1','t','Le dernier fil est noir ET le dernier chiffre du numéro de série est impair : coupe le 4e fil.'),
      jsonb_build_object('n','5.2','t','Sinon, s''il y a exactement un fil rouge ET plus d''un fil jaune : coupe le 1er fil.'),
      jsonb_build_object('n','5.3','t','Sinon, s''il n''y a aucun fil noir : coupe le 2e fil.'),
      jsonb_build_object('n','5.4','t','Sinon : coupe le 1er fil.')),
    'lexicon', jsonb_build_array(
      'Dernier fil = le plus bas.',
      '1er fil = le plus haut.',
      'Exactement un = ni zéro, ni deux.'),
    'penalties', 'Chaque erreur : 1re = −20 s, 2e = −30 s, 3e = explosion.',
    'rule_order', 'Lis les règles dans l''ordre et arrête-toi à la première qui s''applique.'
  )
$$;

-- Vue d'un joueur, filtrée par rôle.
create or replace function zt.view_for(p_code text, p_player uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r zt.rooms; me zt.players; v jsonb; g jsonb;
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
  end if;
  return v;
end $$;

-- Lancer : tire 3 panneaux au hasard parmi les 8, sans répétition, et démarre les 180 s.
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
  insert into zt.room_panels(room_code, pos, config_id)
    select v_code, row_number() over (order by random())::int, id
    from (select id from zt.configs order by random() limit 3) t;
  update zt.rooms set status = 'playing', errors = 0,
         ends_at = now() + interval '180 seconds', updated_at = now()
   where code = v_code;
  perform zt.push_state(v_code);
  return zt.view_for(v_code, me.id);
end $$;

revoke all on function zt.manual() from public, anon, authenticated;
