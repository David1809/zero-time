-- ZERO TIME — Jalon 0 : arrêt de la partie en mode test solo (appliquée dans la base : zt_010_solo_stop).
create or replace function public.zt_solo_stop(p_code text, p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $f$
declare v_code text := upper(btrim(coalesce(p_code,''))); me zt.players; r zt.rooms;
begin
  select * into me from zt.players where room_code = v_code and token = p_token;
  if me.id is null then raise exception 'joueur_inconnu'; end if;
  select * into r from zt.rooms where code = v_code for update;
  if r.status <> 'playing' then raise exception 'partie_non_en_cours'; end if;
  if (select count(*) from zt.players where room_code = v_code) <> 1 then raise exception 'mode_solo_indisponible'; end if;
  update zt.rooms set status = 'abandoned', paused_at = null, waiting_for = null, updated_at = now() where code = v_code;
  perform zt.push_state(v_code);
  return zt.view_for(v_code, me.id);
end $f$;
revoke all on function public.zt_solo_stop(text, uuid) from public;
grant execute on function public.zt_solo_stop(text, uuid) to anon, authenticated;
