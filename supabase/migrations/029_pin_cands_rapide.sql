create or replace function zt.pin_cands(spec jsonb, sr int, sb int, piles int, serial text) returns setof text
language sql stable set search_path to '' as $f$
  with rd as materialized (select array_agg(zt.rule_ok(spec->'red', x) order by x) rr, array_agg(zt.rule_ok(spec->'blue', x) order by x) bb from generate_series(0,9) x),
  p as materialized (select a,b,c,d from generate_series(0,9) a, generate_series(0,9) b, generate_series(0,9) c, generate_series(0,9) d where a<>b and a<>c and a<>d and b<>c and b<>d and c<>d),
  l as materialized (select array[a,b,c,d] dg from p, rd where (rd.rr[a+1]::int+rd.rr[b+1]::int+rd.rr[c+1]::int+rd.rr[d+1]::int)=sr and (rd.bb[a+1]::int+rd.bb[b+1]::int+rd.bb[c+1]::int+rd.bb[d+1]::int)=sb),
  g as materialized (select jsonb_array_elements(spec->'clues') g)
  select dg[1]::text||dg[2]::text||dg[3]::text||dg[4]::text from l
  where not exists (select 1 from g where zt.when_ok(g.g->'w', piles, serial) and exists (select 1 from jsonb_array_elements(g.g->'c') cl where not zt.clue_ok(cl, l.dg))) $f$;
