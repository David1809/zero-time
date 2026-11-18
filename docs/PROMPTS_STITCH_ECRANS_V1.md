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

## Prompt 3 — TE04 : technicien, carnet de manuels (papier manuscrit)

« Crée l'écran TE04 du technicien, smartphone en portrait, interdiction totale de scroller la page elle-même (seul le contenu d'une feuille peut défiler à l'intérieur de son cadre). Il n'affiche JAMAIS de temps, d'erreurs ni de progression. Direction artistique : un VRAI CARNET DE MANUELS PAPIER, écrit à la main, posé sur un établi sombre (même ambiance industrielle que OP03 pour le fond et le cadre de l'écran, mais le carnet lui-même est en papier). Papier recyclé crème/kraft légèrement grisé, grain et fibres visibles, bords un peu irréguliers, taches de café et traces de doigts discrètes, pliures, coins cornés, trombone, scotch jauni, quelques ratures et annotations au stylo rouge dans les marges. Écriture manuscrite (police type Caveat, Patrick Hand ou Kalam), encre bleu-noir, titres soulignés à la main, cases à cocher dessinées au crayon. Ombres portées douces pour donner du relief au papier. Tout doit rester parfaitement lisible d'un coup d'œil.

Structure : 1) Un onglet-index latéral ou en haut, comme les intercalaires d'un classeur : une rangée d'onglets cartonnés dépassant du carnet, un par chapitre (aujourd'hui « Lire un panneau », « 3 fils », « 4 fils », « 5 fils » ; prévoir de la place pour 6, 7, 8 fils et d'autres chapitres plus tard). L'onglet actif est ouvert, les autres dépassent. 2) Un bouton « INDEX » (signet ruban) qui ouvre une page de sommaire manuscrite : liste des chapitres avec numéros de page et un champ de recherche dessiné comme une ligne à remplir au stylo ; taper filtre les chapitres. 3) Page « Lire un panneau » : compter les fils de haut en bas, repérer si le dernier chiffre du numéro de série est pair ou impair (0 est pair), demander à l'opérateur la liste des couleurs dans l'ordre. 4) Pages « 3 fils », « 4 fils », « 5 fils » : une liste numérotée de règles manuscrites à lire dans l'ordre (on s'arrête à la première qui s'applique), chaque règle est courte, avec de petits croquis de fils colorés au crayon de couleur (rouge, bleu, jaune, blanc, noir) pour illustrer « dernier fil rouge » etc. Aucun nom de couleur écrit en toutes lettres : les couleurs sont uniquement représentées par des fils dessinés. 5) Un petit lexique en bas de la page (dernier fil, premier fil, compter de haut en bas). 6) Navigation : tourner la page par glissement latéral ou flèches manuscrites, numéro de page en bas, signet ruban.

Livre-moi l'écran principal (chapitre « 4 fils » ouvert) puis les variantes : page d'index avec recherche active, chapitre « Lire un panneau », chapitre « 3 fils », chapitre « 5 fils ». Même carnet, même papier sur toutes les variantes. »

## Prompt 4 — Écrans communs (après validation de OP03 et TE04)

« Crée quatre écrans simples, cohérents avec OP03 et TE04 : (1) accueil : symbole ZERO TIME, boutons « Créer une salle » et « Rejoindre » ; (2) salle d'attente : code de 4 lettres très visible, liste des deux joueurs avec leur pseudo et leur état de connexion, choix du créateur « Je choisis mon rôle » ou « Tirage au sort », bouton « Lancer » ; (3) victoire : « BOMBE DÉSAMORCÉE », temps restant, nombre d'erreurs, bouton « Rejouer » ; (4) explosion : « EXPLOSION », cause (temps écoulé ou 3 erreurs), panneaux résolus x/3, bouton « Rejouer ». Version technicien des écrans de fin : sans le temps restant. »

## Prompt 5 — OP-PIN : opérateur, module « Digicode » (direction artistique distincte)

**Intention :** le module Fils est organique (câbles, cuivre, lumière chaude). Le Digicode est le contraire : un objet rigide, de précision, un boîtier de sécurité militaire. Même palette, même identité, même tension, mais une matière différente, pour que chaque module de la bombe ait sa personnalité en restant de la même famille.

« Crée l'écran du module « Digicode » côté opérateur, smartphone en portrait, même univers que OP03 (fond #101820, mêmes couleurs, même compte à rebours en haut avec les trois pastilles d'erreur), mais avec une direction artistique propre au module : un BOÎTIER DE SÉCURITÉ MÉTALLIQUE posé sur la bombe. Plaque d'acier brossé gris-bleu sombre, rivets, vis cruciformes dans les angles, léger chanfrein et ombres nettes, quelques rayures d'usage, pas de papier ni de câbles. Éclairage froid et précis, avec des rétroéclairages ambrés (#FF9F32) sur les touches et l'afficheur. Typographie technique (type Share Tech Mono, Orbitron ou Rajdhani), chiffres de type afficheur sept segments.

Structure de haut en bas :
1) Sous le compte à rebours : le nom du module « Digicode » en petites capitales gravées sur la plaque, et un petit voyant d'état dans l'angle (rouge = à faire, vert = résolu, avec le texte « À faire » ou « Résolu ✓ » à côté, jamais la couleur seule).
2) Un afficheur : 4 cases de chiffres en sept segments ambrés, avec un curseur clignotant sur la case en cours de saisie. Cases vides affichées par un tiret éteint.
3) Une rangée de voyants physiques sur le boîtier : une série de petites lampes rouges et une série de petites lampes bleues, allumées ou éteintes, comme des LED encastrées (nombre variable de 0 à 4 allumées pour chaque couleur). Chaque lampe allumée est aussi marquée d'un petit repère de forme (rond pour rouge, carré pour bleu) pour ne pas dépendre de la couleur seule. Aucune étiquette ne dit à quoi elles servent.
4) Un clavier de 10 touches (1 à 9 en grille de 3 sur 3, puis 0 en bas), grosses touches en caoutchouc noir mat à bord métallique, chiffre gravé et rétroéclairé, zone tactile d'au moins 56 px, bon espacement. À côté du 0 : une touche « Effacer » (flèche arrière) et une touche « Valider » orange pleine, plus grande, bien séparée des chiffres pour éviter l'erreur de pression.
5) Un historique des essais, sous le clavier : une pile des essais déjà faits, du plus récent au plus ancien, chacun montrant les 4 chiffres tentés et, sous chaque chiffre, un petit verdict à forme distincte : coche pour « bon chiffre, bonne place », losange pour « bon chiffre, mauvaise place », croix pour « absent du code ». Les formes se lisent sans couleur ; une teinte vert, orange ou gris sombre s'y ajoute seulement en renfort.

Montre l'état d'une saisie en cours (2 chiffres tapés sur 4) avec un historique de 1 essai. N'ajoute aucune règle, aucun indice, aucun score. Les règles restent dans le manuel du technicien. Ne conçois que cet écran pour le moment. »

## Prompt 6 — Variantes d'état du Digicode (après validation du Prompt 5)

« À partir du Digicode validé, crée ces variantes sans rien changer d'autre : (a) mauvais code : l'afficheur clignote rouge, secousse brève du boîtier, bandeau « ERREUR 1/3 — −20 s » (puis « ERREUR 2/3 — −30 s ») ; l'essai est ajouté à l'historique avec ses verdicts ; (b) code juste : les quatre chiffres passent au vert avec coches, le voyant d'angle devient vert, texte « Résolu ✓ », le clavier est verrouillé et grisé ; (c) module résolu consulté plus tard : même écran verrouillé, historique conservé ; (d) pause : compte à rebours figé et texte « En attente de <pseudo> », avec le bouton « Abandonner » visible uniquement dans cet état. »

## Prompt 7 — TE05 : technicien, chapitre « Digicode » du carnet

« Ajoute au carnet de manuels papier de TE04 un chapitre « Digicode », en gardant exactement le même carnet, le même papier et la même écriture manuscrite (le technicien reste sur du papier ; la direction métal est réservée à l'écran de l'opérateur). Ajoute un onglet « Digicode » à la rangée d'intercalaires et une entrée dans l'index. Contenu de la page, tout en manuscrit avec petits croquis au crayon de couleur : 1) comment lire le boîtier que décrit l'opérateur (lampes rouges et bleues, numéro de série) ; 2) un tableau de règles courtes à remplir comme une grille manuscrite : indice → effet sur le code ; 3) comment lire le verdict d'un essai, avec les trois dessins : coche, losange, croix ; 4) un rappel : le code a 4 chiffres tous différents, et trois erreurs font exploser la bombe. Livre l'écran avec le chapitre « Digicode » ouvert, puis la variante de l'index avec recherche sur le mot « code ». N'invente aucune règle absente de la spécification. »

## Points à vérifier à chaque retour de Stitch

- Aucun nom de couleur écrit sur les fils (décision de David) et aucun fil identifiable par une couleur seule hors de cette dérogation.
- Le technicien ne voit jamais le temps.
- Boutons d'au moins 48 px ; bouton « Couper ce fil » séparé des fils.
- Rien d'inventé : pas de score, pas d'indice, pas de fonction hors spécification.
- Digicode : verdicts et lampes lisibles sans la couleur (formes), touche Valider séparée des chiffres, direction métal cohérente avec la palette mais différente des Fils.

## À corriger dans le cahier

Le vert de la palette (§12.4) est écrit « #42C » : ce n'est pas un code couleur complet. À préciser avant l'intégration graphique.
