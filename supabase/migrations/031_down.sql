-- retour arrière ROTARY V1
drop function if exists public.zt_rot_move(text, uuid, int, int);
drop function if exists public.zt_rot_check(text, uuid, uuid);
drop function if exists zt.make_panels(text);
drop function if exists zt.view_for(text, uuid);
alter function zt.make_panels_v2(text) rename to make_panels;
alter function zt.view_for_v2(text, uuid) rename to view_for;
-- zt_disarm : redéfinir sans le test zt.rot (voir 024) si besoin
drop table if exists zt.rot;
delete from zt.pages where module = 'rot';
