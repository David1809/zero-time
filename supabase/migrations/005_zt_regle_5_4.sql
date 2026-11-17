-- Règle 5.4 : « Sinon : coupe le dernier fil » (au lieu du 1er) ; P8 : bonne réponse = fil 5 (Jaune).
-- Décision de David, 17 nov. 2026. Le texte du manuel (zt.manual()) est mis à jour en conséquence.
update zt.configs set answer = 5 where id = 'P8';
-- zt.manual() : seule la ligne 5.4 change, voir la fonction dans la base pour le texte complet.
