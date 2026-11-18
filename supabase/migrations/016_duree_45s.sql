-- Durée de la bombe : 180 s -> 45 s (zt_start et zt_start_solo).
do $$
declare r record; d text;
begin
  for r in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
           where n.nspname='public' and p.proname in ('zt_start','zt_start_solo') loop
    d := pg_get_functiondef(r.oid);
    if d like '%180 seconds%' then
      execute replace(d, '180 seconds', '45 seconds');
    end if;
  end loop;
end $$;
