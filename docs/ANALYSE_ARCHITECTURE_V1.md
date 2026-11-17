# ZERO TIME — Analyse d'architecture (sans développement)

**Version :** V1 — 17 novembre 2026
**Portée :** analyse seulement. Aucun fichier de code n'a été créé et aucun service n'a été ouvert ni payé.
**Décision :** elle appartient à David. À consigner ensuite dans `DECISION_ARCHITECTURE_V1`.

## Limites de cette analyse

- J'ai lu le cahier, la spécification du prototype, et dans le dépôt Dé-lire (`soiree-canape`) uniquement `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/SUPABASE.md` et quelques lignes réseau de `app.js`. Je n'ai pas lu `engine.js` en entier.
- Les quotas viennent des pages officielles des fournisseurs quand elles étaient accessibles, et de sites tiers sinon. Ils datent de novembre 2026 et **changent souvent**. À revérifier dans tes tableaux de bord avant de s'engager.
- Rien n'a été testé : latence, tenue de charge et fiabilité sont des estimations.

---

## 1. Résumé des exigences qui pèsent sur l'architecture

- 2 à 4 joueurs par équipe, un opérateur et 1 à 3 techniciens ; smartphones, télévision optionnelle et plus tard (§2.1, §12.5).
- Hébergement **en ligne comme Dé-lire** (§14.5) ; PWA, sans installation (§2.1).
- Le serveur est l'autorité : état, rôles, solutions, compte à rebours, validation, pénalités (§4.3, §14.3).
- Un opérateur ne doit pas recevoir les règles, un technicien ne doit pas recevoir la bombe ; les solutions ne sont jamais dans des données accessibles à tous (§3.2, règles de la procédure).
- Compte à rebours synchronisé, jamais négatif ; une erreur n'est comptée qu'une fois, même avec double clic, requête répétée ou reconnexion (§11.3, §11.4).
- Reconnexion sans réinitialisation ni pénalité (§14.6).
- Règles et données de module séparées du moteur ; seeds reproductibles (§6.5, §14.8).
- Gratuit ou presque, aucun service payant sans accord (§14.10, §20.8).

## 2. Ambiguïtés et décisions manquantes

1. **« Le serveur est l'autorité » ne dit pas ce qu'est le serveur.** Dé-lire n'a pas de serveur : le moteur tourne sur le téléphone de l'hôte. Il faut dire si c'est acceptable pour le prototype (je le propose) et pas pour le MVP.
2. **Confidentialité.** Quel niveau est exigé ? Empêcher une triche par curiosité (un joueur ouvre les outils du navigateur) ou simplement ne jamais afficher l'information ? Dans un jeu en famille, le second suffit probablement. Le cahier §14.7 parle de « validations frauduleuses » sans fixer le niveau de protection.
3. **Où vit l'état entre deux actions** : en mémoire de l'hôte, en base, ou dans un objet serveur ?
4. **Projet Supabase** : réutiliser celui de Dé-lire, en créer un dédié, ou ne pas utiliser Supabase ?
5. **Durée de vie d'une salle** et nettoyage des anciennes salles.
6. **Compteur d'erreurs** par bombe ou par partie (déjà noté dans la spécification, point 8).
7. **Mode hors prototype de la télévision** : pas de contrainte pour l'instant, voir §5.

## 3. Trois architectures possibles

Toutes sont hébergées en ligne.

### Option A — Socle Dé-lire : site statique + Supabase Realtime, moteur sur le téléphone de l'hôte

Ce que fait Dé-lire aujourd'hui (d'après son `CLAUDE.md` et ses docs) : appli web statique sur Netlify ; un salon est une ligne en base ; l'hôte fait tourner le moteur et diffuse la vue publique de l'état aux autres par **Supabase Realtime (broadcast)**. Il y a déjà une page télé qui fonctionne sur une vieille Samsung Tizen.

- **Pour :** c'est ce que tu maîtrises déjà ; presque aucun nouveau service ; la création de salle et la connexion par code existent déjà dans Dé-lire (à vérifier dans son code, je n'ai pas lu cette partie) ; prototype le plus rapide.
- **Contre :** l'autorité est **un téléphone de joueur**, pas un serveur. Si l'hôte verrouille son écran, perd le réseau ou ferme l'onglet, la partie s'arrête. C'est le point que tu cherches déjà à fiabiliser dans Dé-lire (départ du capitaine). L'hôte connaît toutes les solutions en mémoire. Une pénalité « une seule fois » reste de la responsabilité du code de l'hôte.
- **Verdict :** très bien pour un prototype jetable (le cahier §18.7 l'accepte), insuffisant pour le MVP tel que décrit.

### Option B — Supabase seul, serveur autoritaire (Postgres + fonctions + Realtime)

L'état de la partie est en base. Les téléphones n'écrivent jamais l'état : ils appellent des **fonctions côté serveur** (fonctions SQL ou Edge Functions) qui valident l'action, appliquent la pénalité et mettent à jour l'état. Les téléphones écoutent les changements. Le compte à rebours est une **heure de fin** (`ends_at`) stockée côté serveur : chaque téléphone affiche le temps restant calculé localement ; une pénalité décale simplement `ends_at`.

- **Pour :** vraie autorité serveur sans serveur à héberger ; état conservé (reconnexion naturelle) ; confidentialité réelle possible avec des vues par rôle (RLS) : l'opérateur lit la bombe, le technicien lit le manuel, personne ne lit les solutions ; idempotence simple avec un identifiant d'action unique ; tu connais déjà Supabase ; tests du moteur en Node possibles.
- **Contre :** il faut concevoir correctement les droits (RLS) et les fonctions : c'est la partie la plus délicate ; chaque action fait un aller-retour réseau (quelques centaines de millisecondes, acceptable ici) ; les projets gratuits **se mettent en pause après 7 jours sans activité** et sont limités à 2 projets actifs ; les migrations passent par un processus contrôlé (tes règles de Dé-lire interdisent le DDL direct).
- **Verdict :** meilleur compromis pour le MVP.

### Option C — Cloudflare Workers + Durable Objects (un objet par salle)

Un Durable Object par salle tient l'état, les WebSockets et le minuteur (alarme). C'est techniquement le meilleur ajustement au problème : une salle = un objet, autorité serveur, reconnexion simple.

- **Pour :** conception très naturelle ; la version SQLite est disponible sur l'offre gratuite ; WebSocket en veille sans coût de durée quand tout le monde est inactif.
- **Contre :** nouvelle plateforme, nouveaux outils de déploiement (compte, jeton d'API, déploiement depuis l'environnement Claude), nouvelle manière de tester ; les limites gratuites sont **quotidiennes** et les opérations échouent une fois dépassées ; aucun acquis chez toi.
- **Verdict :** bon choix si l'option B montre ses limites, mais pas un premier choix.

**Écartée : Node + Socket.io sur un hébergeur gratuit** (la cible technique du cahier §14.2). Les services web gratuits de type Render s'éteignent après 15 minutes sans trafic et mettent environ une minute à redémarrer, leur disque est éphémère et leur base gratuite expire. Une partie lancée après une pause aurait une attente d'une minute au démarrage. À reconsidérer seulement avec une offre payante, ce qui exige ton accord.

## 4. Coûts, quotas gratuits et limites

Chiffres vérifiés en novembre 2026, voir les sources en fin de document.

| Service | Gratuit | Ce qui compte pour ZERO TIME |
| --- | --- | --- |
| **Supabase** (Realtime et base) | 200 connexions simultanées, 2 millions de messages par mois, 100 messages par seconde, 500 000 appels de fonctions Edge, 2 projets actifs, **pause après 7 jours d'inactivité** | Très largement suffisant pour des soirées en famille. Le risque réel est la **pause du projet** s'il n'est utilisé qu'à l'occasion : un projet partagé avec Dé-lire resterait actif. |
| **Netlify** (hébergement du site statique) | 300 crédits par mois, plafond strict sur les comptes récents ; 15 crédits par mise en production réussie | Environ 20 mises en production par mois sur un compte au nouveau modèle. Les comptes créés avant le 4 septembre 2025 sont sur l'ancien modèle (100 Go de bande passante, 300 minutes de build). **À vérifier dans ton compte.** À éviter : un déploiement à chaque petit changement. |
| **Cloudflare Workers + Durable Objects** | 100 000 requêtes par jour, opérations refusées au-delà ; les messages WebSocket entrants sont comptés 1 pour 20 | Largement suffisant ; remise à zéro chaque jour à 00:00 UTC. |
| **Render** (option écartée) | 750 heures par mois, arrêt après 15 min d'inactivité, démarrage d'environ 1 min | Inadapté tel quel. |

**Estimation du trafic (mon calcul, non mesuré).** Avec un minuteur en heure de fin, il n'y a pas de message toutes les secondes. Une partie de 4 joueurs devrait échanger quelques centaines à quelques milliers de messages. Les 2 millions de messages par mois couvrent donc de l'ordre de plusieurs centaines de parties.

**Coût récurrent : 0 €** pour A et B si le compte Netlify et le projet Supabase existent déjà. Aucun service payant n'est nécessaire dans les trois options retenues.

## 5. Solution recommandée pour la synchronisation

**Prototype (Jalon 0) : option A.** Elle donne un prototype jouable le plus vite possible, avec ce que tu as déjà. C'est jetable, conformément au §18.7 du cahier. Deux précautions à garder dans le code, pour ne pas tout réécrire ensuite :
- Séparer le **moteur** (règles, validation, pénalités, temps) de l'**affichage**, comme `engine.js` / `app.js` dans Dé-lire. Le moteur doit pouvoir tourner en Node pour les tests.
- Le temps est toujours une **heure de fin** (`ends_at`), jamais un compteur décrémenté chaque seconde.

**MVP : décision à prendre après le Jalon 0, avec une préférence pour l'option B.** Si les parties à 2 ont montré que le jeu fonctionne, le moteur est déplacé côté serveur (fonctions Supabase). L'option C reste la solution de repli.

**Télévision (optionnelle, plus tard).** Elle sera un client en lecture seule de plus. Dé-lire prouve déjà qu'une vieille Samsung Tizen peut afficher ce type de page ; il faudra seulement respecter sa contrainte (JavaScript ES5 sans syntaxe récente), à décider au moment venu.

## 6. Rôles et confidentialité des informations

| Information | Opérateur | Technicien | Qui la connaît |
| --- | --- | --- | --- |
| Fils du panneau, numéro de série | Oui | Non | Serveur (B/C) ou hôte (A) |
| Manuel et règles | Non | Oui | Serveur (B/C) ou hôte (A) |
| Bon fil à couper | Non | Non | Moteur seulement |
| Temps restant, erreurs | Oui | Oui | Tous |

- **Option A :** l'hôte (un joueur) a tout en mémoire. Chaque rôle reçoit sa vue filtrée sur **son propre canal** (par exemple `zt-CODE-op` et `zt-CODE-te`). Quelqu'un qui connaît le code et ouvre les outils du navigateur pourrait écouter les deux canaux : ce n'est pas une vraie confidentialité, mais cela suffit pour jouer.
- **Options B et C :** le bon fil n'est stocké que côté serveur, jamais envoyé. Les vues par rôle sont réellement protégées (RLS pour B, objet serveur pour C).
- Dans tous les cas, **le client n'envoie que l'intention** (`couper le fil 3`, avec un identifiant d'action) et reçoit le résultat. Il ne dit jamais « j'ai gagné ».

## 7. Risques

| Risque | Option | Gravité | Réponse |
| --- | --- | --- | --- |
| L'hôte perd le réseau ou verrouille son écran, la partie s'arrête | A | Élevée | Acceptée au prototype ; à lever au MVP |
| Pénalité comptée deux fois (double clic, requête répétée) | Toutes | Élevée | Identifiant d'action unique, traité une seule fois par le moteur ; test dédié |
| Projet Supabase en pause avant une soirée | B (et A) | Moyenne | Projet partagé avec Dé-lire, ou le « réveiller » avant de jouer |
| Quota Netlify atteint (comptes récents) | A, B | Moyenne | Regrouper les déploiements, vérifier le modèle de ton compte |
| RLS mal conçue : un rôle lit ce qu'il ne devrait pas | B | Moyenne | Tests d'accès par rôle dès le départ |
| Dérive d'horloge entre téléphones sur le compte à rebours | Toutes | Faible | Calcul local à partir de `ends_at` plus un décalage d'horloge mesuré à la connexion |
| Règles déséquilibrées une fois générées (voir spécification §5) | Générateur | Moyenne | Rééquilibrer avant d'écrire le générateur |

## 8. Plan de réalisation par étapes

Il suit les lots de la procédure (phase 5), avec l'option A pour le prototype.

1. **Lots 1 et 2.** Structure de l'appli, salle et connexion par code : reprendre le principe de Dé-lire (à faire valider avant de copier du code).
2. **Lot 3.** Rôles opérateur et technicien, avec leur vue filtrée.
3. **Lot 4.** État partagé sur deux téléphones.
4. **Lot 5.** Minuteur en heure de fin, erreurs et pénalités dans un moteur testable en Node, y compris le cas « même action envoyée deux fois ».
5. **Lot 6.** Les 8 configurations fixes de la spécification et la validation de la réponse.
6. **Lots 7 à 10.** Actions Fils, manuel du technicien, victoire et explosion, déconnexion et reconnexion.
7. **Tests réels puis soirée de validation (Jalon 0).** Seulement ensuite : Stitch, puis décision sur l'architecture du MVP.

## Décisions à prendre par David

1. Valider l'option A pour le prototype ?
2. Pour le MVP : accepter de trancher après le Jalon 0 (préférence B) ?
3. Projet Supabase : partagé avec Dé-lire ou dédié ? (Il y a une limite de 2 projets actifs sur l'offre gratuite ; elle est peut-être déjà atteinte chez toi.)
4. Netlify : quel modèle de crédits sur ton compte ?

## Sources

- Supabase, limites Realtime : https://supabase.com/docs/guides/realtime/rate-limits
- Supabase, tarifs et offre gratuite : https://supabase.com/pricing
- Supabase, pause des projets gratuits après une semaine : https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/ et https://aiagencyplus.com/supabase-free-tier-limits/
- Cloudflare, tarifs des Durable Objects : https://developers.cloudflare.com/durable-objects/platform/pricing
- Cloudflare, limites : https://developers.cloudflare.com/durable-objects/platform/limits
- Render, offre gratuite : https://render.com/docs/free
- Netlify, modèle à crédits : https://netli.fyi/blog/netlify-free-plan-limits-2026 et https://costbench.com/software/cloud-infrastructure/netlify/free-plan/
