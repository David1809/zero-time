# ZERO TIME

Jeu coopératif de désamorçage de bombes pour smartphones : un opérateur voit la bombe, les techniciens ont le manuel. Il faut communiquer avant la fin du compte à rebours.

- 2 à 4 joueurs par équipe
- Smartphones uniquement pour le prototype (télévision optionnelle plus tard)
- Hébergé en ligne : site publié sur GitHub Pages, jouable depuis l'URL GitHub (pas de Netlify)

## Documents

| Fichier | Contenu |
| --- | --- |
| `docs/CAHIER_DES_CHARGES_ET_PROCEDURE.md` | Cahier des charges maître (partie A) et procédure de mise en œuvre (partie B) |
| `docs/SPECIFICATION_MVP_FILS_V1.md` | Spécification du prototype fondateur (module Fils), points À DÉFINIR à valider |
| `docs/ANALYSE_ARCHITECTURE_V1.md` | Analyse d'architecture, décision à prendre |

> Dépôt **public** (nécessaire à GitHub Pages) : n'y mettre aucun secret.

## Où ranger quoi

- **GitHub (ce dépôt)** : le code et tous les documents texte (`.md`). C'est la seule version de référence.
- **Google Drive (dossier ZERO TIME)** : images (zéro lumineux, Vignette 1), exports et captures Stitch, photos et vidéos de test, archives `.docx` d'origine.

## État

Phase 2 de la procédure : spécification du prototype à valider. Aucun code pour l'instant.

## Règles

- Aucun mot de passe, clé d'API ni secret dans ce dépôt.
- Aucune règle de jeu inventée : les points non tranchés sont marqués À DÉFINIR.
- Aucun service payant sans validation.

## Prototype (lots 1 et 2)

- Appli : `index.html`, `css/`, `js/` à la racine, publiée par GitHub Pages (branche `main`, dossier racine). URL : https://david1809.github.io/zero-time/
- Serveur : schéma `zt` du projet Supabase partagé avec Dé-lire ; migration dans `supabase/migrations/001_zt_salles.sql` (déjà appliquée). L'appli n'appelle que les fonctions `zt_*`, jamais les tables.
- Fait : créer une salle, rejoindre par code, choisir son rôle ou tirage au sort, lancer. Reste : écrans opérateur et technicien (lot 3), état de jeu, minuteur et pénalités (lots 4 à 6).
