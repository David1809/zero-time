-- ZERO TIME — décision 12 : un manuel par module (3, 4, 5 fils), un panneau de chaque par partie.
-- Ajoute les configurations P9 à P12 (module 3 fils), l'onglet « 3 fils » du manuel (zt.manual())
-- et un tirage « un panneau de chaque module » dans public.zt_start(). Appliquée dans la base ;
-- voir les fonctions zt.manual() et public.zt_start() pour le texte complet.
insert into zt.configs(id, serial, wires, answer) values
 ('P9','VK-2739','{blue,yellow,white}',3),
 ('P10','RT-5184','{black,red,blue}',2),
 ('P11','JB-6042','{white,red,white}',1),
 ('P12','NM-9315','{yellow,red,blue}',2)
on conflict (id) do nothing;
