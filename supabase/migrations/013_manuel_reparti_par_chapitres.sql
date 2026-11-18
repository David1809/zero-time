create or replace function public.zt_start(p_code text, p_token uuid)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms; v_count int; v_op uuid;
  v_n int; g jsonb; v_id text; v_ids text[] := array[]::text[];
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
  -- Répartition des pages du manuel (3 à 8 fils) entre les techniciens, s'ils sont au moins deux.
  -- Répartition par chapitres consécutifs : 2 techniciens = pages 3-5 / 6-8 ; 3 techniciens = 3-4 / 5-6 / 7-8.
  if v_count >= 3 then
    update zt.players p set pages = case
        when v_count = 3 then (case t.rn when 1 then array[3,4,5] else array[6,7,8] end)
        else (case t.rn when 1 then array[3,4] when 2 then array[5,6] else array[7,8] end) end
      from (select id, row_number() over (order by random()) rn from zt.players where room_code = v_code and role = 'technician') t
     where p.id = t.id;
  end if;
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

