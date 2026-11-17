# ZERO TIME — Spécification du prototype fondateur (Jalon 0) — Module Fils

**Version :** V1.1 — décisions de David du 17 novembre 2026 intégrées
**Référence :** cahier des charges maître (§5, §11, §12, §18) et procédure, phase 2
**Statut :** les points 1 à 11 sont tous décidés par David (voir le récapitulatif §10). Il ne reste aucun point À DÉFINIR dans cette spécification.

---

## 1. Périmètre

| Élément | Valeur |
| --- | --- |
| Joueurs | 2 : 1 opérateur + 1 technicien |
| Bombe | 1 bombe, **3 minutes** (180 s) |
| Module | Fils uniquement |
| Écrans | Smartphones uniquement (pas de télévision) |
| Règles | Codées en dur, configurations fixes écrites à la main (§18.2) |
| Hébergement | En ligne (§14.5), site publié sur GitHub Pages, jouable depuis l'URL GitHub |
| Erreurs | 1re : −20 s ; 2e : −30 s ; 3e : explosion (§11.2) |

**Décidé 1 — Contenu de la bombe (validé).** Un seul fil à couper ne remplirait pas 3 minutes. La bombe contient **3 panneaux Fils** (3 instances du module), sans dépendance entre eux, à traiter dans l'ordre que l'équipe veut. Chaque panneau a sa propre règle de décision et sa propre réponse.

**Décidé 2 — Choix des panneaux : au hasard.** À chaque partie, la bombe tire **3 panneaux au hasard parmi les 8 configurations du §6**, sans répétition.

---

## 2. Avant la partie

1. Le joueur A crée une salle : un **code de 4 lettres** s'affiche.
2. Le joueur B rejoint avec ce code (ou un QR code plus tard, hors prototype).
3. Chacun saisit un pseudo.
4. Les rôles sont attribués, puis le créateur appuie sur **Lancer**.

**Décidé 3 — Attribution des rôles : les deux possibilités.** Avant de lancer, le créateur de la salle choisit entre **choisir son rôle** (l'autre joueur prend l'autre rôle) et **tirage au sort**.

---

## 3. Ce que voit l'opérateur

Écran portrait, une seule main, zones tactiles d'au moins 48 px.

**En haut, toujours visible :**
- Le compte à rebours (format `2:41`), très gros.
- Les erreurs : trois pastilles, une pleine par erreur commise, avec le texte `Erreurs 1/3`.
- La progression : `Panneaux 1/3`.

**Au centre : les 3 panneaux**, sous forme de 3 onglets ou cartes. Chaque panneau a un état écrit **et** une icône (jamais la couleur seule, §12.4) : `À faire`, `Résolu ✓`.

**Un panneau ouvert montre :**
- Le **numéro de série** du panneau, par exemple `KB-4821`.
- Les fils, **de haut en bas**, numérotés 1, 2, 3… Chaque fil est dessiné dans sa couleur (rouge, bleu, jaune, blanc, noir). **Aucun nom de couleur n'est écrit : les fils sont identifiés uniquement par leur couleur** (décision de David).
- Un fil déjà coupé est dessiné coupé et grisé.

**Dérogation au §12.4 du cahier** (« les informations importantes ne doivent jamais être identifiables uniquement par leur couleur »), décidée par David. Conséquence à connaître : un joueur daltonien ne pourra pas distinguer certains fils. À revoir si ce cas se présente.

**Pour couper :**
1. L'opérateur touche un fil : il est mis en surbrillance (sélection).
2. Un bouton **Couper ce fil** apparaît en bas, assez grand, séparé des fils.
3. Il confirme. Le fil est coupé et le serveur renvoie le résultat.

**Décidé 4 — Confirmation en deux temps.** Sélection puis bouton **Couper ce fil** (limite les coupes involontaires, §12.6).

**L'opérateur ne voit jamais** les règles, ni quel fil est le bon.

---

## 4. Ce que voit le technicien

Le technicien ne voit pas les fils. Il ne voit **que le manuel Fils**. Il ne voit **jamais le temps**, ni les erreurs, ni la progression : c'est à l'opérateur de les lui annoncer à voix haute.

**Décidé 5 — Informations partagées : seulement le manuel.** Aucune information de jeu en direct n'est affichée chez le technicien. Seuls les écrans de fin de partie (victoire, explosion) apparaissent aussi chez lui.

**Contenu du manuel (4 blocs, dans cet ordre) :**

1. **Comment lire un panneau** : compter les fils de haut en bas ; repérer le dernier chiffre du numéro de série (pair ou impair) ; demander à l'opérateur la liste des couleurs dans l'ordre.
2. **Panneau à 4 fils** et **panneau à 5 fils** : deux onglets. Chaque onglet est une **liste de règles à appliquer dans l'ordre : on s'arrête à la première qui s'applique.**
3. **Lexique** : `dernier fil` = le plus bas ; `1er fil` = le plus haut ; `exactement un` = ni zéro ni deux.
   Précision ajoutée au manuel : un chiffre pair est 0, 2, 4, 6 ou 8 (le 0 est pair) ; impair : 1, 3, 5, 7 ou 9.
   Piste pour plus tard (David) : le numéro de série pourra servir à d'autres conditions que pair/impair ; à définir avant le générateur, rien n'est inventé pour le prototype.
4. **Rappel des erreurs et des pénalités.**

---

## 5. Règles du module Fils (validées par David, décision 6)

Les fils sont comptés de haut en bas. Le « chiffre de série » est le dernier chiffre du numéro de série du panneau.

**Panneau à 4 fils** (première règle qui s'applique) :

| N° | Condition | Action |
| --- | --- | --- |
| 4.1 | Aucun fil rouge | Couper le **2e** fil |
| 4.2 | Sinon, le dernier fil est blanc | Couper le **1er** fil |
| 4.3 | Sinon, plus d'un fil bleu | Couper le **dernier fil bleu** |
| 4.4 | Sinon | Couper le **3e** fil |

**Panneau à 5 fils** (première règle qui s'applique) :

| N° | Condition | Action |
| --- | --- | --- |
| 5.1 | Le dernier fil est noir **et** le chiffre de série est impair | Couper le **4e** fil |
| 5.2 | Sinon, exactement un fil rouge **et** plus d'un fil jaune | Couper le **1er** fil |
| 5.3 | Sinon, aucun fil noir | Couper le **2e** fil |
| 5.4 | Sinon | Couper le **dernier** fil (le plus bas) |

**Vérification faite par script :**
- Chacune des 7 500 combinaisons possibles (4 ou 5 fils, 5 couleurs, série paire ou impaire) donne une réponse unique et un fil qui existe.
- Les 8 configurations du §6 couvrent chacune une des 8 règles.

**Réserve à connaître avant le générateur.** Les règles ne sont pas équilibrées sur des tirages aléatoires : à 5 fils, la réponse « dernier fil » sort dans environ 52 % des cas (règle 5.4 modifiée par David le 17 novembre 2026 ; auparavant « 1er fil » à 62 %), et à 4 fils les 2e et 3e fils représentent environ 86 %. Pour le prototype ce n'est pas un problème, car les 8 configurations sont choisies à la main. Il faudra rééquilibrer les règles avant d'écrire le générateur.

---

## 6. Les 8 configurations fixes

Fils listés de haut en bas. Chaque configuration a été vérifiée par script.

| Panneau | Série | Fils (haut → bas) | Série | Règle appliquée | Bonne réponse |
| --- | --- | --- | --- | --- | --- |
| P1 | KB-4821 | Bleu, Jaune, Blanc, Noir | impair | 4.1 | **Fil 2** (Jaune) |
| P2 | MT-3067 | Rouge, Bleu, Jaune, Blanc | impair | 4.2 | **Fil 1** (Rouge) |
| P3 | HL-9152 | Rouge, Bleu, Jaune, Bleu | pair | 4.3 | **Fil 4** (Bleu) |
| P4 | ZQ-7314 | Rouge, Bleu, Jaune, Noir | pair | 4.4 | **Fil 3** (Jaune) |
| P5 | XD-2605 | Jaune, Rouge, Blanc, Bleu, Noir | impair | 5.1 | **Fil 4** (Bleu) |
| P6 | FV-8140 | Jaune, Rouge, Jaune, Blanc, Noir | pair | 5.2 | **Fil 1** (Jaune) |
| P7 | GN-5273 | Bleu, Blanc, Rouge, Bleu, Blanc | impair | 5.3 | **Fil 2** (Blanc) |
| P8 | CS-6908 | Noir, Blanc, Bleu, Noir, Jaune | pair | 5.4 | **Fil 5** (Jaune) |

**Explications pas à pas :**

- **P1** : aucun fil rouge → règle 4.1 → 2e fil (Jaune). Le dernier fil est noir, ce qui ne change rien ici.
- **P2** : il y a du rouge, donc 4.1 ne s'applique pas ; le dernier fil est blanc → 4.2 → 1er fil (Rouge).
- **P3** : du rouge, dernier fil bleu (pas blanc), deux fils bleus → 4.3 → dernier fil bleu, c'est le **4e**. Piège : la règle 4.4 aurait donné le 3e.
- **P4** : du rouge, dernier fil noir, un seul fil bleu → 4.4 → 3e fil (Jaune).
- **P5** : dernier fil noir **et** série impaire (5) → 5.1 → 4e fil (Bleu).
- **P6** : dernier fil noir mais série **paire** (0) → 5.1 ne s'applique pas ; exactement un rouge et deux jaunes → 5.2 → 1er fil (Jaune).
- **P7** : pas de noir ; un seul rouge mais aucun jaune → 5.2 ne s'applique pas ; aucun fil noir → 5.3 → 2e fil (Blanc).
- **P8** : dernier fil jaune ; aucun rouge ; il y a du noir → on arrive à 5.4 → dernier fil, le 5e (Jaune).

---

## 7. Erreurs, pénalités et fin de partie

**Ce qui compte comme une erreur :** couper un fil qui n'est pas la bonne réponse du panneau.

| Erreur | Conséquence | Retour affiché (chez l'opérateur) |
| --- | --- | --- |
| 1re | −20 s | Flash rouge court, vibration, texte `ERREUR 1/3 — −20 s` |
| 2e | −30 s | Idem avec `ERREUR 2/3 — −30 s` |
| 3e | Explosion immédiate | Écran d'explosion (sur les deux téléphones) |

Le technicien ne reçoit aucun retour d'erreur : l'opérateur le lui annonce.

**Règles côté serveur (§11.3 et §11.4) :**
- Le serveur seul décide si une coupe est bonne ou mauvaise, et applique la pénalité.
- Chaque action porte un identifiant unique : un double clic, une requête répétée ou une reconnexion ne compte **qu'une seule fois**.
- Le temps ne descend jamais sous 0. Si une pénalité dépasse le temps restant, le temps passe à 0 et la bombe explose.

**Décidé 7 — Après une erreur (validé).** Le fil coupé reste coupé, le panneau reste en jeu et le bon fil peut encore être coupé. Une erreur ne bloque donc jamais un panneau.

**Décidé 8 — Compteur d'erreurs : par bombe.** Les trois erreurs sont comptées sur la bombe en cours.

**Bonne coupe :** le panneau passe à `Résolu ✓` (icône et texte), vibration courte. Quand les 3 panneaux sont résolus, la bombe est **désamorcée**.

**Alertes de temps (§11.5) :** à 2:00, 1:00, 0:30 et 0:10, **uniquement sur le téléphone de l'opérateur** (décision de David) : bannière avec le temps, son et vibration. Elles ne doivent pas masquer les fils. C'est à l'opérateur de prévenir les autres joueurs à voix haute.

**Temps à zéro :** la bombe explose, écran d'explosion sur les deux téléphones. Les actions reçues après 0:00 sont ignorées par le serveur.

**Écran de victoire :** `BOMBE DÉSAMORCÉE`, temps restant, nombre d'erreurs, bouton `Rejouer`. Chez le technicien, l'écran de fin n'affiche pas le temps restant.
**Écran d'explosion :** `EXPLOSION`, cause (temps écoulé ou 3 erreurs), panneaux résolus x/3, bouton `Rejouer`.

---

## 8. Connexion perdue

Principe du cahier (§14.6) : une reconnexion ne réinitialise pas la partie et ne provoque aucune pénalité.

**Décidé 9 — Connexion perdue : la partie se met en pause.** Dès qu'un joueur est absent, le compte à rebours est figé et l'autre joueur voit `En attente de <pseudo>`. Quand le joueur revient, la partie reprend à l'état exact, sans pénalité. Le téléphone mémorise l'identité du joueur pour qu'il retrouve sa place.

**Décidé 10 — Départ définitif.** Le **créateur de la salle** peut abandonner la partie. Le bouton **Abandonner** n'apparaît que lorsqu'un membre de l'équipe a disparu (connexion perdue).

**Décidé 11 — Si c'est le créateur qui disparaît.** Le créateur étant le seul à pouvoir abandonner, l'autre joueur resterait bloqué sur l'écran d'attente. Dans ce cas, c'est l'autre joueur qui reçoit le bouton **Abandonner**, avec la même règle : il n'apparaît que si un membre de l'équipe a disparu.

---

## 9. Hors prototype

Télévision, générateur, Code PIN, Symboles, 3 bombes, rotation des rôles, sons élaborés, difficultés, statistiques.

---

## 10. Récapitulatif des décisions

| N° | Sujet | Décision de David |
| --- | --- | --- |
| 1 | Contenu de la bombe | 3 panneaux Fils sans dépendance |
| 2 | Choix des panneaux | Au hasard : 3 tirés parmi 8 |
| 3 | Attribution des rôles | Les deux possibilités : choix du créateur ou tirage au sort |
| 3 bis | Identification des fils | Uniquement par la couleur, aucun nom écrit (dérogation au §12.4) |
| 4 | Confirmation de la coupe | En deux temps |
| 5 | Informations chez le technicien | Seulement le manuel ; il ne voit jamais le temps |
| 6 | Règles du module Fils | Validées (§5) |
| 7 | Après une erreur | Le fil reste coupé, le panneau reste jouable |
| 8 | Compteur d'erreurs | Par bombe |
| 8 bis | Alertes de temps | Uniquement chez l'opérateur, qui prévient les autres |
| 9 | Connexion perdue | Pause de la partie |
| 10 | Départ définitif | Le créateur peut abandonner ; le bouton n'apparaît que si un membre a disparu |
| 11 | Créateur disparu | L'autre joueur reçoit le bouton Abandonner (même règle d'apparition) |
