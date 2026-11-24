-- Retour arrière du manuel V2 : on rétablit les fonctions v1 (les tables restent, sans effet).
drop function if exists zt.make_panels(text);
drop function if exists zt.view_for(text, uuid);
alter function zt.make_panels_v1(text) rename to make_panels;
alter function zt.view_for_v1(text, uuid) rename to view_for;
