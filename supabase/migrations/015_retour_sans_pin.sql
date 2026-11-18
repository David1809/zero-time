-- 015 : retour en arrière côté jeu — plus de module Digicode dans les parties (le code PIN reste en base, inactif).
-- 3 modules à fils de tailles différentes ; manuel réparti par chapitres de fils (3-5 / 6-8 ou 3-4 / 5-6 / 7-8).
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
  insert into zt.room_panels(room_code, pos, config_id)
    select p_code, row_number() over (order by random())::int, x from unnest(v_ids) x;
  update zt.rooms set batteries = null where code = p_code;
end $function$;
-- (zt_start : distribution des pages 3-5 / 6-8 à 3 joueurs, 3-4 / 5-6 / 7-8 à 4 joueurs — voir 013)
