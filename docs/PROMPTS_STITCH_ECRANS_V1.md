# ZERO TIME — Prompts Google Stitch, écrans du prototype (module Fils)

**Version :** V1 — rédigé le 17 novembre 2026, à partir de la spécification V1.1
**À utiliser avec :** le zéro lumineux (symbole de marque) et la Vignette 1 (style), importés dans Stitch. Ces deux images ne sont pas dans le dépôt : elles sont dans Drive (01_CADRAGE).
**Règle :** un prompt à la fois, un écran à la fois. Valider avant de passer au suivant ; corrections ciblées, pas de refonte.

## Prompt 0 — Mise en place du projet (à coller une fois)

« Projet ZERO TIME : jeu coopératif de désamorçage de bombe, joué à deux sur smartphones en portrait. L'un est l'opérateur (il voit la bombe), l'autre le technicien (il lit le manuel). Identité : univers sombre, industriel et technologique, tendu. Le symbole de marque est un zéro blanc lumineux dans un anneau orange-doré sur fond noir, avec particules lumineuses. La Vignette 1 jointe est la référence de style des interfaces. Palette : fond #101820, surfaces #192630, éléments secondaires #263640, texte #F3F5F5, texte secondaire #A8B3BB, action et tension #FF9F32, erreur et danger #F04444, état positif en vert (nuance à choisir, cohérente avec la palette). Règles : boutons d'au moins 48 px, utilisables d'une main, texte court, aucune information portée par la couleur seule (toujours une icône ou un texte en plus), animations courtes. N'invente aucune règle ni fonction absente de ce qui te sera décrit. Réponds simplement OK ; je te donnerai les écrans un par un. »

## Prompt 1 — OP03 : opérateur, panneau Fils (écran principal)

« Crée l'écran OP03 de l'opérateur, smartphone en portrait. En haut, toujours visible : le compte à rebours très gros au format 2:41 ; sous lui trois pastilles d'erreur (une pleine par erreur) avec le texte Erreurs 1/3 ; et le texte Panneaux 1/3. Au centre : trois onglets de panneaux, chacun avec une icône et un état écrit (À faire, Résolu ✓). Le panneau ouvert affiche le numéro de série (par exemple KB-4821) puis 4 ou 5 fils horizontaux empilés de haut en bas, numérotés 1, 2, 3…, dessinés dans leur couleur (rouge, bleu, jaune, blanc, noir), SANS aucun nom de couleur écrit. Chaque fil est une grande zone tactile. Montre l'état d'un fil sélectionné (surbrillance nette, pas seulement la couleur) avec, en bas de l'écran et séparé des fils, un grand bouton orange « Couper ce fil ». Montre aussi un fil déjà coupé (dessiné coupé et grisé). L'opérateur ne voit jamais les règles. Ne conçois que cet écran pour le moment. »

## Prompt 2 — Variantes d'état de OP03 (après validation de OP03)

« À partir de OP03 validé, crée ces variantes, sans rien changer d'autre : (a) erreur : flash rouge court et bandeau « ERREUR 1/3 — −20 s » ; (b) alerte de temps : bannière « 1:00 » qui ne masque pas les fils ; (c) panneau résolu : état « Résolu ✓ » avec icône ; (d) pause : le compte à rebours figé et le texte « En attente de <pseudo> », avec un bouton « Abandonner » visible uniquement dans cet état. »

## Prompt 3 — TE04 : technicien, manuel Fils

« Crée l'écran TE04 du technicien, smartphone en portrait. Il n'affiche JAMAIS de temps, d'erreurs ni de progression : uniquement le manuel Fils. Structure, dans cet ordre : 1) « Comment lire un panneau » : compter les fils de haut en bas, repérer si le dernier chiffre du numéro de série est pair ou impair, demander à l'opérateur la liste des couleurs dans l'ordre ; 2) deux onglets « 4 fils » et « 5 fils », chacun avec une liste numérotée de règles à lire dans l'ordre (on s'arrête à la première qui s'applique), très lisible d'un coup d'œil ; 3) un petit lexique : dernier fil = le plus bas, 1er fil = le plus haut, exactement un = ni zéro ni deux ; 4) un rappel : 1re erreur −20 s, 2e erreur −30 s, 3e erreur = explosion. Le texte des règles sera fourni ensuite ; pour l'instant, utilise ces règles de 4 fils : 4.1 Aucun fil rouge → couper le 2e fil ; 4.2 Sinon, si le dernier fil est blanc → couper le 1er ; 4.3 Sinon, s'il y a plus d'un fil bleu → couper le dernier fil bleu ; 4.4 Sinon → couper le 3e. Règles de 5 fils : 5.1 Le dernier fil est noir ET le dernier chiffre du numéro de série est impair → couper le 4e ; 5.2 Sinon, exactement un fil rouge ET plus d'un fil jaune → couper le 1er ; 5.3 Sinon, aucun fil noir → couper le 2e ; 5.4 Sinon → couper le dernier fil. Ne conçois que cet écran pour le moment. »

## Prompt 4 — Écrans communs (après validation de OP03 et TE04)

« Crée quatre écrans simples, cohérents avec OP03 et TE04 : (1) accueil : symbole ZERO TIME, boutons « Créer une salle » et « Rejoindre » ; (2) salle d'attente : code de 4 lettres très visible, liste des deux joueurs avec leur pseudo et leur état de connexion, choix du créateur « Je choisis mon rôle » ou « Tirage au sort », bouton « Lancer » ; (3) victoire : « BOMBE DÉSAMORCÉE », temps restant, nombre d'erreurs, bouton « Rejouer » ; (4) explosion : « EXPLOSION », cause (temps écoulé ou 3 erreurs), panneaux résolus x/3, bouton « Rejouer ». Version technicien des écrans de fin : sans le temps restant. »

## Points à vérifier à chaque retour de Stitch

- Aucun nom de couleur écrit sur les fils (décision de David) et aucun fil identifiable par une couleur seule hors de cette dérogation.
- Le technicien ne voit jamais le temps.
- Boutons d'au moins 48 px ; bouton « Couper ce fil » séparé des fils.
- Rien d'inventé : pas de score, pas d'indice, pas de fonction hors spécification.

## À corriger dans le cahier

Le vert de la palette (§12.4) est écrit « #42C » : ce n'est pas un code couleur complet. À préciser avant l'intégration graphique.
