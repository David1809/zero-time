# ZERO TIME — Cahier des charges du manuel des techniciens (V2)

_Statut : document de conception, rien n'est codé. Il complète le cahier des charges maître (`CAHIER_DES_CHARGES_ET_PROCEDURE.md`) et remplace, une fois mis en œuvre, le manuel statique actuel (`zt.manual()` et la répartition par chapitres `me.pages`). Il fusionne le document de cadrage « Évolution du système de manuel des techniciens », les arbitrages pris en exploration le 24/11/2026 et le prototype de carnet (`test/carnet.html`)._

## 1. Objectif

Faire de la difficulté du jeu un effet de l'**observation**, de la **description orale**, de la **recherche dans le manuel** et de la **coopération**. L'opérateur décrit ce qu'il voit ; le technicien identifie la bonne page parmi plusieurs, puis dicte les consignes. Le système ne doit jamais créer d'ambiguïté sur la réponse correcte.

## 2. Principe

- Chaque configuration de module a une **signature** : une description observable par l'opérateur.
- Le manuel contient **une seule page par signature**. La page porte la signature en tête, 3 consignes, puis une règle finale (« dans tous les autres cas »).
- Les pages n'ont **aucun titre de module**. Les onglets sont anonymes et leur ordre est mélangé à chaque partie.
- Chaque partie reçoit des **pages utiles** (configurations réelles) et des **pages leurres**, mélangées puis réparties entre les techniciens.

## 3. Décisions arrêtées

| Sujet | Décision |
|---|---|
| Couleurs de fils | Six : noir, rouge, vert, jaune, blanc, bleu (le vert est ajouté) |
| Pages écartées | Non, pas de fonction « écarter une page » |
| ROTARY | Mis de côté pour le moment (hors périmètre de cette version) |
| Nombre de piles | Variable globale de la bombe, **2 à 4**, variable graphiquement ; utilisable par **tous** les modules |
| Digicode | **Piste 1** : les voyants rouges/bleus allumés deviennent la signature de la page ; la page donne le code selon les piles |
| Essai papier | Non : validation par script côté serveur puis parties réelles |
| Génération et contrôle | Côté serveur, comme l'architecture actuelle |
| Carnet | Design du carnet vintage joint (onglets post-it anonymes, papier, reliure), texte noir, tampons rouges |

## 4. Données globales de la bombe

- **Piles** : 2, 3 ou 4, tirées par salle côté serveur, affichées sur la bombe de l'opérateur (trois variantes graphiques) et en mode TV. L'opérateur les annonce une seule fois en début de partie.
- **Numéro de série** : reste disponible, mais le manuel V2 n'en dépend pas. **Règle d'écriture : une consigne utilise au plus un critère global (piles).**
- Les piles font varier la réponse d'une même page d'une partie à l'autre, ce qui limite la mémorisation du catalogue.

## 5. Module Fils

### 5.1 Signature
- Nombre de fils (3 à 8) + **ensemble exact des couleurs** présentes, **2 ou 3 couleurs** (jamais 1).
- « Exactement » est écrit sur la page : « noir, rouge et jaune » exclut toute autre couleur.
- Deux configurations avec le même nombre de fils et le même ensemble de couleurs partagent la même signature, quel que soit le nombre d'occurrences : **les règles doivent donc couvrir toutes ces configurations sans ambiguïté**.
- Espace des signatures : 15 paires + 20 triplets = 35 ensembles de couleurs × 6 nombres de fils = **210 signatures**.

### 5.2 Ce que les règles peuvent tester
La signature fixe déjà les couleurs présentes ; les règles ne portent donc que sur ce qu'elle ne fixe pas :
- le **nombre d'occurrences** (« exactement deux fils rouges », « plus de blancs que de rouges », « au moins trois noirs ») ;
- l'**ordre** (« le dernier fil est noir », « le quatrième fil est jaune », « deux fils verts se suivent ») ;
- les **piles** (« la bombe porte au moins 3 piles »).

Actions possibles : couper le n-ième fil, le premier, le dernier, l'avant-dernier, le premier ou le dernier fil d'une couleur. Les fils sont numérotés **de haut en bas**.

### 5.3 Forme d'une page
3 consignes évaluées dans l'ordre (la première qui s'applique est la bonne) + règle finale. Texte uniquement.

### 5.4 Exclusions
- Aucune règle ne teste l'absence ou la présence d'une couleur déjà fixée par la signature.
- Aucune action ne désigne un fil qui peut ne pas exister (le fil d'une couleur de la signature existe toujours).

## 6. Module Digicode (piste 1)

- **Signature** : nombre de voyants rouges allumés + nombre de voyants bleus allumés (le panneau compte 4 rouges et 4 bleus : 25 combinaisons). Voyants rouges ronds, bleus carrés, comme aujourd'hui.
- **Page** : pour 2, 3 et 4 piles, le code à 4 chiffres tous différents.
- **Génération** : le serveur tire une page, affiche ses voyants, et le code attendu est celui que la page indique pour le nombre de piles de la salle.
- **Conséquence** : les voyants ne dérivent plus du code secret ; les règles de voyants par lettre du numéro de série (migrations 022/023) et les indices-lettres sont retirés du Digicode. À confirmer à la mise en œuvre.
- **Contraintes du catalogue** : codes tous différents d'une page à l'autre pour une même valeur de piles ; un code faux reste une erreur.

## 7. ROTARY, Détonateur, Horloge

Hors périmètre de cette version. Les notes du cadrage restent valables : signature = symboles actifs au démarrage des 4 potentiomètres, avec départ tiré au hasard (aujourd'hui tous sur le triangle) ; les consignes de résolution du ROTARY n'existent pas encore et sont à concevoir avant son intégration.

## 8. Constitution du manuel d'une partie

- Pages utiles : **3 configurations de fils + 1 configuration Digicode = 4** (5 avec ROTARY plus tard).
- Environ **7 pages leurres** (valeur de départ, réglable) : au total une dizaine de pages consultables.
- Les 3 panneaux de fils d'une partie ont **trois signatures distinctes** (sinon une page correspondrait à deux configurations).

### Leurres
1. **Proches** : même module, même nombre de fils, un seul élément de la signature change (une couleur). Ils sont construits **par familles de 3** dans le catalogue, pas page par page. Exemple : 5 fils — noir, rouge, jaune / noir, rouge, bleu / noir, vert, jaune.
2. **Éloignés** : signatures d'autres configurations, qui ne correspondent à aucune situation de la partie.
- Un leurre est une **vraie page du catalogue non utilisée** dans la partie.
- La plupart des leurres appartiennent au même module que les pages utiles (un leurre de Digicode au milieu de pages de fils est écarté tout de suite).

## 9. Répartition entre techniciens

- Un seul technicien : il reçoit toutes les pages.
- Plusieurs : les pages sont mélangées puis réparties ; **aucun technicien ne détient plus de ⌈pages utiles ÷ nombre de techniciens⌉ pages utiles**, pour que la coopération reste nécessaire.

## 10. Architecture serveur

| Composant | Rôle |
|---|---|
| Catalogue | Pages structurées : identifiant, module, signature, consignes (données, pas du texte libre), action attendue |
| Générateur | Tire les pages utiles, construit des configurations réelles **compatibles** avec leur signature (on part de la page, on fabrique les fils / les voyants), limite à 3 couleurs |
| Validateur | Vérifie l'unicité de la page par configuration, l'absence d'ambiguïté, l'absence de correspondance accidentelle des leurres |
| Distributeur | Ajoute les leurres, mélange pages et onglets, répartit entre techniciens |

Principes :
- **Source unique de vérité** : les consignes sont des données structurées dont on tire à la fois le **texte affiché** et l'**évaluation côté serveur** (coupe attendue). Impossible que le texte dise une chose et que le jeu en vérifie une autre.
- Le manuel devient **propre à chaque salle** (construit à la création de la partie) au lieu d'un contenu fixe.
- Séquence : tirer les pages utiles → générer les configurations → vérifier l'unicité → ajouter les leurres → mélanger → distribuer.

## 11. Script de contrôle du catalogue

À exécuter à chaque modification du catalogue, sur toutes les configurations (Fils : exhaustif, moins de 3⁸ séquences par signature × 3 valeurs de piles).
- Aucune signature en double.
- Chaque configuration réelle correspond à une seule page.
- Les leurres ne correspondent à aucune configuration réelle de la partie.
- Chaque consigne est utilisable (se déclenche dans une part non nulle des cas).
- La réponse attendue est toujours unique.
- Les actions sont équilibrées : aucune réponse (« dernier fil ») ne domine ; par page, la consigne finale ne dépasse pas environ la moitié des cas.
- Simulations de milliers de parties pour mesurer la cohérence (pas la difficulté ressentie, qui dépend de joueurs réels).

Un prototype de ce contrôle a été exécuté sur le catalogue de l'annexe A : toutes les consignes se déclenchent, la règle finale est comprise entre 10 et 25 % selon la page.

## 12. Réglages de difficulté

Paramètres indépendants du code des modules : nombre de leurres, nombre de leurres proches, nombre de couleurs dans les signatures (2 ou 3), complexité des règles, répartition entre techniciens, durée de la partie. Niveaux envisagés : soirée (peu de leurres proches), normal, expert (familles complètes de leurres proches). Valeurs définitives après parties réelles.

## 13. Direction artistique du carnet

Référence : `test/carnet.html` (design du fichier joint repris tel quel).
- Carnet vieilli, reliure visible, onglets post-it anonymes sans libellé, papier jauni, navigation latérale (flèches, glissement).
- **Texte uniquement en noir** ; **tampons rouges** sur certaines pages ; **couleurs de fils écrites en toutes lettres**, jamais en symbole ni en pastille.
- Pas de titre de page : en tête, la signature (« Signature observée »), puis les consignes numérotées, la règle finale et une note de lecture.
- Pas de moteur de recherche : le technicien feuillette.

## 14. Points ouverts

1. **Temps** : une partie de 2 minutes avec 4 épreuves et une phase d'identification par épreuve peut être trop courte ; durée réglable, à revoir en partie réelle.
2. **Mémorisation** : les piles aident ; un catalogue fixe de 12 + 6 pages reste apprenable après quelques parties. Piste : faire varier certaines consignes par salle.
3. **Digicode** : codes fixes par page (3 par page) ; vérifier que la table n'est pas trop facile à retenir.
4. **Numérotation des fils** de haut en bas à confirmer sur l'interface réelle des modules.
5. **Graphismes des piles** : trois variantes de bombe (opérateur et TV).
6. **Étendre** à ROTARY (départ aléatoire + consignes à concevoir), Détonateur, Horloge.

## 15. Ordre de développement

1. Fils : catalogue, générateur, validateur, distributeur, piles.
2. Test de jeu complet : communication, leurres, ambiguïtés.
3. Digicode : adapter les voyants et les pages.
4. Équilibrage (leurres, temps, difficulté).
5. ROTARY, puis Détonateur et Horloge.

---

## Annexe A — Catalogue prototype : Fils (12 pages, 4 familles)

Convention : fils numérotés de haut en bas ; la première consigne qui s'applique est la bonne.

**Famille A — 5 fils**

**P-F01 — 5 fils — exactement noir, rouge et jaune**  · tampon « À VÉRIFIER »
   1. S’il y a exactement deux fils rouges, coupez le dernier fil rouge.
   2. Sinon, si le dernier fil est noir, coupez le deuxième fil.
   3. Sinon, si la bombe porte au moins 3 piles, coupez le premier fil jaune.
   Sinon : coupez le dernier fil.
   _Contrôle (toutes configurations × 2/3/4 piles) : consignes 40 / 21 / 26 % · règle finale 13 %._

**P-F02 — 5 fils — exactement noir, rouge et bleu**
   1. S’il y a exactement deux fils rouges, coupez le premier fil rouge.
   2. Sinon, si le dernier fil est noir, coupez le troisième fil.
   3. Sinon, si la bombe porte au moins 3 piles, coupez le premier fil bleu.
   Sinon : coupez le dernier fil.
   _Contrôle (toutes configurations × 2/3/4 piles) : consignes 40 / 21 / 26 % · règle finale 13 %._

**P-F03 — 5 fils — exactement noir, vert et jaune**  · tampon « ORDRE IMPÉRATIF »
   1. S’il y a exactement deux fils verts, coupez le dernier fil vert.
   2. Sinon, si le premier fil est noir, coupez le quatrième fil.
   3. Sinon, si la bombe porte au plus 3 piles, coupez le premier fil jaune.
   Sinon : coupez le deuxième fil.
   _Contrôle (toutes configurations × 2/3/4 piles) : consignes 40 / 21 / 26 % · règle finale 13 %._


**Famille B — 6 fils**

**P-F04 — 6 fils — exactement blanc, rouge et bleu**  · tampon « LECTURE AVANT ACTION »
   1. S’il y a plus de fils blancs que de fils rouges, coupez le dernier fil blanc.
   2. Sinon, si deux fils bleus se suivent, coupez le premier fil bleu.
   3. Sinon, si la bombe porte 4 piles, coupez le troisième fil.
   Sinon : coupez le dernier fil.
   _Contrôle (toutes configurations × 2/3/4 piles) : consignes 39 / 24 / 12 % · règle finale 25 %._

**P-F05 — 6 fils — exactement blanc, rouge et vert**
   1. S’il y a plus de fils blancs que de fils rouges, coupez le premier fil blanc.
   2. Sinon, si deux fils verts se suivent, coupez le dernier fil vert.
   3. Sinon, si la bombe porte 2 piles, coupez le quatrième fil.
   Sinon : coupez le dernier fil.
   _Contrôle (toutes configurations × 2/3/4 piles) : consignes 39 / 24 / 12 % · règle finale 25 %._

**P-F06 — 6 fils — exactement blanc, bleu et vert**  · tampon « DOUBLE CONTRÔLE »
   1. S’il y a plus de fils blancs que de fils bleus, coupez le dernier fil blanc.
   2. Sinon, si deux fils verts se suivent, coupez le premier fil vert.
   3. Sinon, si la bombe porte au moins 3 piles, coupez le deuxième fil.
   Sinon : coupez l’avant-dernier fil.
   _Contrôle (toutes configurations × 2/3/4 piles) : consignes 39 / 24 / 25 % · règle finale 12 %._


**Famille C — 4 fils**

**P-F07 — 4 fils — exactement rouge et jaune**
   1. S’il y a plus de fils rouges que de fils jaunes, coupez le dernier fil rouge.
   2. Sinon, si le dernier fil est jaune, coupez le deuxième fil.
   3. Sinon, si la bombe porte au moins 4 piles, coupez le premier fil jaune.
   Sinon : coupez le premier fil.
   _Contrôle (toutes configurations × 2/3/4 piles) : consignes 29 / 43 / 10 % · règle finale 19 %._

**P-F08 — 4 fils — exactement rouge et bleu**  · tampon « ORDRE IMPÉRATIF »
   1. S’il y a plus de fils bleus que de fils rouges, coupez le dernier fil bleu.
   2. Sinon, si le premier fil est rouge, coupez le troisième fil.
   3. Sinon, si la bombe porte au plus 3 piles, coupez le dernier fil rouge.
   Sinon : coupez le deuxième fil.
   _Contrôle (toutes configurations × 2/3/4 piles) : consignes 29 / 43 / 19 % · règle finale 10 %._

**P-F09 — 4 fils — exactement vert et jaune**
   1. S’il y a plus de fils jaunes que de fils verts, coupez le premier fil jaune.
   2. Sinon, si le dernier fil est vert, coupez le deuxième fil.
   3. Sinon, si la bombe porte 2 piles, coupez le dernier fil vert.
   Sinon : coupez le dernier fil.
   _Contrôle (toutes configurations × 2/3/4 piles) : consignes 29 / 43 / 10 % · règle finale 19 %._


**Famille D — 7 fils**

**P-F10 — 7 fils — exactement noir, blanc et jaune**  · tampon « À VÉRIFIER »
   1. S’il y a au moins trois fils noirs, coupez le dernier fil noir.
   2. Sinon, si le quatrième fil est jaune, coupez le deuxième fil.
   3. Sinon, si la bombe porte au moins 3 piles, coupez le premier fil jaune.
   Sinon : coupez le dernier fil.
   _Contrôle (toutes configurations × 2/3/4 piles) : consignes 41 / 23 / 24 % · règle finale 12 %._

**P-F11 — 7 fils — exactement noir, blanc et vert**
   1. S’il y a au moins trois fils noirs, coupez le premier fil noir.
   2. Sinon, si le quatrième fil est vert, coupez le sixième fil.
   3. Sinon, si la bombe porte au moins 3 piles, coupez le dernier fil vert.
   Sinon : coupez le troisième fil.
   _Contrôle (toutes configurations × 2/3/4 piles) : consignes 41 / 23 / 24 % · règle finale 12 %._

**P-F12 — 7 fils — exactement noir, blanc et bleu**  · tampon « LECTURE AVANT ACTION »
   1. S’il y a au moins trois fils noirs, coupez le dernier fil noir.
   2. Sinon, si le quatrième fil est bleu, coupez le cinquième fil.
   3. Sinon, si la bombe porte au plus 3 piles, coupez le premier fil bleu.
   Sinon : coupez l’avant-dernier fil.
   _Contrôle (toutes configurations × 2/3/4 piles) : consignes 41 / 23 / 24 % · règle finale 12 %._

## Annexe B — Catalogue prototype : Digicode (6 pages)

- **P-D01 — Voyants allumés — 2 rouges et 1 bleu** : 2 piles → 6 4 0 8 · 3 piles → 5 0 1 6 · 4 piles → 4 6 2 3  · tampon « VÉRIFIER LES PILES »
- **P-D02 — Voyants allumés — 2 rouges et 2 bleus** : 2 piles → 1 6 5 9 · 3 piles → 9 1 7 3 · 4 piles → 8 0 7 2
- **P-D03 — Voyants allumés — 1 rouge et 2 bleus** : 2 piles → 3 8 5 4 · 3 piles → 5 0 1 2 · 4 piles → 1 9 7 5
- **P-D04 — Voyants allumés — 3 rouges et 1 bleu** : 2 piles → 0 1 6 9 · 3 piles → 7 5 0 4 · 4 piles → 3 9 0 8  · tampon « ATTENTION AUX ERREURS »
- **P-D05 — Voyants allumés — 3 rouges et 2 bleus** : 2 piles → 4 2 1 3 · 3 piles → 2 8 6 7 · 4 piles → 9 6 3 5
- **P-D06 — Voyants allumés — 1 rouge et 3 bleus** : 2 piles → 1 4 9 7 · 3 piles → 4 1 6 5 · 4 piles → 5 9 8 7

## Annexe C — Vocabulaire des consignes (Fils)

Conditions : « il y a plus de fils A que de fils B », « il y a exactement N fils A », « il y a au moins N fils A », « le premier / dernier fil est A », « le n-ième fil est A », « deux fils A se suivent », « la bombe porte N / au moins N / au plus N piles ».
Actions : « coupez le n-ième / premier / dernier / avant-dernier fil », « coupez le premier / dernier fil A ».
