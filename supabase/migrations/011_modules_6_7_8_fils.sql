-- Modules de 6, 7 et 8 fils. Chaque partie tire désormais 3 modules de tailles différentes parmi 3 à 8 fils.

create or replace function zt.eval_panel(p_wires text[], p_odd boolean)
 returns jsonb language plpgsql immutable set search_path to ''
as $function$
declare
  n int := array_length(p_wires, 1); v_last text := p_wires[n];
  c_red int := cardinality(array_positions(p_wires, 'red'));
  c_blue int := cardinality(array_positions(p_wires, 'blue'));
  c_yellow int := cardinality(array_positions(p_wires, 'yellow'));
  c_white int := cardinality(array_positions(p_wires, 'white'));
  c_black int := cardinality(array_positions(p_wires, 'black'));
begin
  if n = 3 then
    if c_red = 0 then return jsonb_build_object('rule','3.1','answer',3); end if;
    if p_wires[1] = 'black' then return jsonb_build_object('rule','3.2','answer',2); end if;
    if not p_odd and c_white > 1 then return jsonb_build_object('rule','3.3','answer',1); end if;
    return jsonb_build_object('rule','3.4','answer',(select max(i) from unnest(array_positions(p_wires, 'red')) i));
  elsif n = 4 then
    if c_red = 0 then return jsonb_build_object('rule','4.1','answer',2); end if;
    if v_last = 'white' then return jsonb_build_object('rule','4.2','answer',1); end if;
    if c_blue > 1 then return jsonb_build_object('rule','4.3','answer',(select max(i) from unnest(array_positions(p_wires, 'blue')) i)); end if;
    return jsonb_build_object('rule','4.4','answer',3);
  elsif n = 5 then
    if v_last = 'black' and p_odd then return jsonb_build_object('rule','5.1','answer',4); end if;
    if c_red = 1 and c_yellow > 1 then return jsonb_build_object('rule','5.2','answer',1); end if;
    if c_black = 0 then return jsonb_build_object('rule','5.3','answer',2); end if;
    return jsonb_build_object('rule','5.4','answer',5);
  elsif n = 6 then
    if v_last = 'yellow' and p_odd then return jsonb_build_object('rule','6.1','answer',3); end if;
    if c_yellow = 1 and c_white = 0 then return jsonb_build_object('rule','6.2','answer',4); end if;
    if c_red > 2 then return jsonb_build_object('rule','6.3','answer',(select max(i) from unnest(array_positions(p_wires, 'red')) i)); end if;
    return jsonb_build_object('rule','6.4','answer',1);
  elsif n = 7 then
    if c_blue = 0 then return jsonb_build_object('rule','7.1','answer',2); end if;
    if p_wires[1] = 'white' and v_last = 'black' then return jsonb_build_object('rule','7.2','answer',5); end if;
    if not p_odd and c_yellow > 1 then return jsonb_build_object('rule','7.3','answer',(select max(i) from unnest(array_positions(p_wires, 'yellow')) i)); end if;
    return jsonb_build_object('rule','7.4','answer',4);
  elsif n = 8 then
    if c_black > 2 then return jsonb_build_object('rule','8.1','answer',3); end if;
    if v_last = 'red' and p_odd then return jsonb_build_object('rule','8.2','answer',6); end if;
    if c_yellow = 0 then return jsonb_build_object('rule','8.3','answer',7); end if;
    return jsonb_build_object('rule','8.4','answer',8);
  end if;
  raise exception 'module_inconnu';
end $function$;

create or replace function zt.gen_panel(p_n integer)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  colors text[] := array['red','blue','yellow','white','black'];
  letters text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  rules text[]; target text; w text[]; d int; ev jsonb; i int; k int; v_serial text;
begin
  rules := case p_n when 3 then array['3.1','3.2','3.3','3.4']
                    when 4 then array['4.1','4.2','4.3','4.4']
                    when 5 then array['5.1','5.2','5.3','5.4']
                    when 6 then array['6.1','6.2','6.3','6.4']
                    when 7 then array['7.1','7.2','7.3','7.4']
                    else array['8.1','8.2','8.3','8.4'] end;
  -- On tire d'abord la règle visée (chacune autant que les autres), puis un panneau qui la déclenche.
  target := rules[1 + floor(random() * 4)::int];
  for k in 1..20000 loop
    w := array[]::text[];
    for i in 1..p_n loop w := w || colors[1 + floor(random() * 5)::int]; end loop;
    d := floor(random() * 10)::int;
    ev := zt.eval_panel(w, d % 2 = 1);
    if ev->>'rule' = target then
      v_serial := substr(letters, 1 + floor(random() * 24)::int, 1) || substr(letters, 1 + floor(random() * 24)::int, 1)
                  || '-' || lpad(floor(random() * 1000)::int::text, 3, '0') || d::text;
      return jsonb_build_object('serial', v_serial, 'wires', to_jsonb(w), 'answer', (ev->>'answer')::int, 'rule', target);
    end if;
  end loop;
  raise exception 'generation_impossible';
end $function$;

create or replace function zt.manual()
 returns jsonb language sql immutable set search_path to ''
as $function$
  select jsonb_build_object(
    'read', jsonb_build_array(
      'L''opérateur annonce son module : de 3 à 8 fils. Ouvre l''onglet correspondant.',
      'Regarde le dernier chiffre du numéro de série : pair (0, 2, 4, 6, 8) ou impair (1, 3, 5, 7, 9). Le 0 est pair.',
      'Demande à l''opérateur la liste des couleurs, dans l''ordre, de haut en bas.'),
    'w3', jsonb_build_array(
      jsonb_build_object('n','3.1','t','Aucun fil rouge : coupe le 3e fil.'),
      jsonb_build_object('n','3.2','t','Sinon, si le 1er fil est noir : coupe le 2e fil.'),
      jsonb_build_object('n','3.3','t','Sinon, si le dernier chiffre du numéro de série est pair ET qu''il y a plus d''un fil blanc : coupe le 1er fil.'),
      jsonb_build_object('n','3.4','t','Sinon : coupe le dernier fil rouge.')),
    'w4', jsonb_build_array(
      jsonb_build_object('n','4.1','t','Aucun fil rouge : coupe le 2e fil.'),
      jsonb_build_object('n','4.2','t','Sinon, si le dernier fil est blanc : coupe le 1er fil.'),
      jsonb_build_object('n','4.3','t','Sinon, s''il y a plus d''un fil bleu : coupe le dernier fil bleu.'),
      jsonb_build_object('n','4.4','t','Sinon : coupe le 3e fil.')),
    'w5', jsonb_build_array(
      jsonb_build_object('n','5.1','t','Le dernier fil est noir ET le dernier chiffre du numéro de série est impair : coupe le 4e fil.'),
      jsonb_build_object('n','5.2','t','Sinon, s''il y a exactement un fil rouge ET plus d''un fil jaune : coupe le 1er fil.'),
      jsonb_build_object('n','5.3','t','Sinon, s''il n''y a aucun fil noir : coupe le 2e fil.'),
      jsonb_build_object('n','5.4','t','Sinon : coupe le dernier fil (le plus bas).')),
    'w6', jsonb_build_array(
      jsonb_build_object('n','6.1','t','Le dernier fil est jaune ET le dernier chiffre du numéro de série est impair : coupe le 3e fil.'),
      jsonb_build_object('n','6.2','t','Sinon, s''il y a exactement un fil jaune ET aucun fil blanc : coupe le 4e fil.'),
      jsonb_build_object('n','6.3','t','Sinon, s''il y a plus de deux fils rouges : coupe le dernier fil rouge.'),
      jsonb_build_object('n','6.4','t','Sinon : coupe le 1er fil.')),
    'w7', jsonb_build_array(
      jsonb_build_object('n','7.1','t','Aucun fil bleu : coupe le 2e fil.'),
      jsonb_build_object('n','7.2','t','Sinon, si le 1er fil est blanc ET que le dernier fil est noir : coupe le 5e fil.'),
      jsonb_build_object('n','7.3','t','Sinon, si le dernier chiffre du numéro de série est pair ET qu''il y a plus d''un fil jaune : coupe le dernier fil jaune.'),
      jsonb_build_object('n','7.4','t','Sinon : coupe le 4e fil.')),
    'w8', jsonb_build_array(
      jsonb_build_object('n','8.1','t','Il y a plus de deux fils noirs : coupe le 3e fil.'),
      jsonb_build_object('n','8.2','t','Sinon, si le dernier fil est rouge ET le dernier chiffre du numéro de série est impair : coupe le 6e fil.'),
      jsonb_build_object('n','8.3','t','Sinon, s''il n''y a aucun fil jaune : coupe le 7e fil.'),
      jsonb_build_object('n','8.4','t','Sinon : coupe le dernier fil (le plus bas).')),
    'lexicon', jsonb_build_array(
      'Dernier fil = le plus bas.',
      '1er fil = le plus haut.',
      'Exactement un = ni zéro, ni deux.'),
    'penalties', 'Chaque erreur : 1re = −20 s, 2e = −30 s, 3e = explosion.',
    'rule_order', 'Lis les règles dans l''ordre et arrête-toi à la première qui s''applique.'
  )
$function$;


-- Démarrage : 3 modules de tailles différentes tirées au hasard parmi 3 à 8 fils (au lieu de 3, 4 et 5 fixes).
create or replace function public.zt_start(p_code text, p_token uuid)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms; v_other uuid; v_cr text;
  v_n int; g jsonb; v_id text; v_ids text[] := array[]::text[];
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
  delete from zt.configs c where c.id like 'G%' and not exists (select 1 from zt.room_panels rp where rp.config_id = c.id);
  foreach v_n in array array(select x from generate_series(3,8) x order by random() limit 3) loop
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
end $function$;

create or replace function public.zt_start_solo(p_code text, p_token uuid, p_role text)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
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
  foreach v_n in array array(select x from generate_series(3,8) x order by random() limit 3) loop
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
end $function$;
