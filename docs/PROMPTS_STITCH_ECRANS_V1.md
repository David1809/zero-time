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

## Prompt 8 — OP02 : écran principal de la bombe (l'opérateur), 6 compartiments

**Principe d'ensemble.** La bombe est un boîtier unique. Elle contient un bloc central (temps, piles, numéro de série, bouton de désarmement) et 6 compartiments de module. Un compartiment vide reste une plaque pleine ; un module créé prend un compartiment vide ; toucher un compartiment ouvre le module en grand, plein écran ; on en sort pour revenir à la bombe, même s'il n'est pas fini, et il garde son état. **Référence :** seule l'organisation générale (un boîtier divisé en cases, un bloc central, des modules distincts avec un voyant dans l'angle) est reprise d'une image de référence d'un autre jeu ; ne pas importer cette image dans Stitch comme référence de style, et ne copier ni son habillage ni ses modules. Le style reste celui de ZERO TIME.

« Crée l'écran principal de la bombe côté opérateur, smartphone en portrait. C'est l'écran d'accueil de la partie : l'opérateur voit toute la bombe et choisit le module à traiter. Même univers que OP03 (fond #101820, surfaces #192630 et #263640, texte #F3F5F5, orange #FF9F32 pour l'action et la tension, rouge #F04444 pour l'erreur, vert pour l'état résolu), mais avec une identité propre : un BOÎTIER DE BOMBE vu de dessus et de face, en métal sombre, avec vis, rivets, charnières, joints, fines rayures d'usage et un éclairage froid. Un seul boîtier, assez détaillé pour faire objet physique, mais lisible d'un coup d'œil.

Disposition (pas de scroll de la page, tout tient sur l'écran) :
1) EN HAUT, UN BLOC CENTRAL sur toute la largeur, plus travaillé que les modules, comme le cœur de la bombe : à gauche et au centre un grand afficheur rouge de compte à rebours en sept segments (format 2:41) avec, juste dessous, trois pastilles d'erreur (une pleine par erreur) et le texte Erreurs 1/3 ; à droite, une petite plaque gravée avec le NUMÉRO DE SÉRIE (par exemple KB-4821) et, dessous, les PILES : des icônes de piles en nombre variable (de 0 à 6), avec le nombre écrit à côté (« Piles ×3 »). Au centre-bas du bloc, un gros BOUTON DE DÉSARMEMENT rond, protégé par un capot basculant ou un anneau de sécurité, bien visible mais à l'écart des compartiments pour éviter l'appui accidentel ; il affiche l'état verrouillé (cadenas, grisé, texte « Verrouillé ») tant que des modules restent à faire.
2) EN DESSOUS, LES 6 COMPARTIMENTS EN GRILLE de 2 colonnes sur 3 lignes, chacun une cellule carrée rivetée aux angles de même taille, avec une zone tactile entière d'au moins 48 px. Ils sont séparés par de fins cadres métalliques. Chaque compartiment a, dans son angle supérieur droit, un voyant rond : rouge = module à faire, vert = module résolu. Le voyant est toujours doublé d'un signe lisible sans couleur : une croix ou un point d'exclamation pour « à faire », une coche pour « résolu ». Le nom du module est gravé en petites capitales sous la vignette.
3) Les compartiments montrent une REPRÉSENTATION GRAPHIQUE PROPRE À CHAQUE TYPE DE MODULE, en miniature, au lieu d'un simple bouton : un module Fils montre un petit boîtier avec 3 à 4 fils colorés ondulés entre deux rangées de bornes ; un module Digicode montre un petit clavier à touches avec un mini afficheur à 4 chiffres. Si le module est résolu, sa miniature est grisée et surmontée de la coche verte. Le nom affiché est celui du module (par exemple « Alimentation », « Horloge », « Détonateur » pour des Fils ; « Digicode »). Sans aucun compte de fils, sans « Module n ».
4) COMPARTIMENT VIDE : une plaque pleine en métal brut, sans voyant, avec seulement deux vis, un léger relief d'emplacement et un petit texte gravé « Emplacement libre ». Non interactif : pas d'état pressé, pas de curseur. Il doit être évident qu'il peut accueillir un module plus tard.

Montre l'écran dans cet état de jeu : 3 compartiments occupés par des modules Fils (un résolu, deux à faire), 1 compartiment occupé par un Digicode (à faire), 2 compartiments vides ; temps 2:41, Erreurs 1/3, numéro de série KB-4821, Piles ×3, bouton de désarmement verrouillé. N'invente aucune règle, aucun indice, aucun score, aucune jauge. L'opérateur ne voit jamais les règles. Ne conçois que cet écran pour le moment. »

## Prompt 9 — Variantes d'état de l'écran de la bombe (après validation du Prompt 8)

« À partir de OP02 validé, crée ces variantes sans rien changer d'autre : (a) erreur : flash rouge court sur tout le boîtier, une pastille d'erreur de plus se remplit, bandeau « ERREUR 2/3 — −30 s » ; (b) alerte de temps : bannière « 1:00 » et afficheur qui pulse, sans masquer les compartiments ; (c) tous les modules résolus : tous les voyants verts avec coches, le capot du bouton de désarmement s'ouvre, le bouton s'allume en orange avec le texte « Désarmer » et un léger halo, il devient le seul élément qui attire l'œil ; (d) bombe avec les 6 compartiments pleins ; (e) bombe avec un seul module créé et 5 compartiments vides ; (f) pause : compte à rebours figé et texte « En attente de <pseudo> » sur le bloc central, bouton « Abandonner » visible seulement dans cet état, compartiments non touchables. »

## Prompt 10 — Ouverture et fermeture d'un module (transition)

« À partir de OP02 validé, montre en quatre images (storyboard vertical) l'ouverture d'un module : 1) l'opérateur touche le compartiment d'un module Fils ; 2) la miniature s'agrandit depuis sa case vers le plein écran, le reste de la bombe se floute et s'éloigne, durée 300 ms environ ; 3) le module s'affiche en grand comme l'écran OP03, avec un petit bandeau haut conservant le compte à rebours et les pastilles d'erreur, et un bouton clair « ← Bombe » ; 4) retour : le module rétrécit vers sa case, dont le voyant est à jour. Même principe pour un Digicode. Le module reste toujours accessible depuis la bombe, qu'il soit fini ou non : un module résolu s'ouvre en lecture seule, verrouillé ; un module non fini conserve exactement son état (fil sélectionné, chiffres tapés, essais précédents) à la réouverture. Aucun module ne ferme la bombe tant que l'opérateur ne revient pas lui-même. Une animation courte ; si l'animation gêne, un simple fondu suffit. »

## Prompt 11 — Désarmement final et écrans de fin

« À partir de OP02 validé, crée la séquence finale côté opérateur : (1) tous les modules sont résolus, le capot s'ouvre, le bouton « Désarmer » s'allume ; (2) l'opérateur maintient son doigt 1 seconde sur le bouton, un anneau de progression se remplit, puis un relâchement avant la fin annule ; (3) écran « BOMBE DÉSARMÉE » avec temps restant et nombre d'erreurs, bouton « Rejouer », sur le même boîtier devenu calme (voyants verts, afficheur figé) ; (4) écran « EXPLOSION » (temps écoulé ou 3 erreurs) avec les modules résolus x/6 et le même bouton « Rejouer ». Version technicien : mêmes écrans sans temps restant. Rien d'inventé : pas de score. »

## Règles de fonctionnement de l'écran de la bombe (à valider avant le dev)

| Sujet | Règle proposée |
|---|---|
| Compartiments | 6 par bombe, ordre fixe. Chaque compartiment contient 0 ou 1 module. |
| Vide | Plaque pleine, non touchable. Aujourd'hui 3 modules Fils (Alimentation, Horloge, Détonateur) : 3 compartiments occupés, 3 vides. |
| Nouveau module | À sa création, il prend le premier compartiment vide de la bombe. Il n'y a pas de choix du compartiment. |
| Représentation | Chaque type de module fournit sa miniature et son nom. Fils : mini fils. Digicode : mini clavier. |
| Ouverture | Toucher un compartiment occupé ouvre le module en plein écran, avec le chrono et les erreurs visibles. |
| Sortie | Bouton « ← Bombe » à tout moment, même module non fini. L'état est conservé côté serveur (fils coupés, essais, chiffres). |
| Voyant | Rouge = à faire, vert = résolu. Toujours doublé d'une croix ou d'une coche. |
| Erreurs | Compteur global à la bombe, pas par module : 1re −20 s, 2e −30 s, 3e explosion. |
| Temps | Un seul compte à rebours pour la bombe, toujours visible, y compris dans les modules. |
| Serial et piles | Affichés en permanence sur le bloc central. Une fois l'écran en place, on retire le numéro de série du module Fils et des prompts du carnet. Les piles servent de repère de règles du Digicode. |
| Désarmement | Bouton verrouillé tant qu'un module occupé reste à faire. Une fois tous résolus : actif, maintien d'1 seconde. Appui impossible avant, donc pas d'erreur de désarmement. |
| Victoire | Quand le désarmement est validé. Les compartiments vides ne comptent pas. |
| Technicien | Ne voit jamais la bombe, ni le temps. Son carnet ne change pas, sauf un chapitre par type de module. |
| Joueurs | Opérateur seul sur la bombe. Rotation de l'opérateur à 4 joueurs : encore à définir par David. |

## Points à vérifier à chaque retour de Stitch

- Aucun nom de couleur écrit sur les fils (décision de David) et aucun fil identifiable par une couleur seule hors de cette dérogation.
- Le technicien ne voit jamais le temps.
- Boutons d'au moins 48 px ; bouton « Couper ce fil » séparé des fils.
- Rien d'inventé : pas de score, pas d'indice, pas de fonction hors spécification.
- Bombe : 6 compartiments + bloc central, compartiment vide non interactif, miniature propre à chaque module, voyant doublé d'un signe, désarmement verrouillé tant que tout n'est pas résolu, aucune règle inventée, rien copié du jeu de référence.
- Digicode : verdicts et lampes lisibles sans la couleur (formes), touche Valider séparée des chiffres, direction métal cohérente avec la palette mais différente des Fils.

## À corriger dans le cahier

Le vert de la palette (§12.4) est écrit « #42C » : ce n'est pas un code couleur complet. À préciser avant l'intégration graphique.
