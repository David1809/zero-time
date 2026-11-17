# ZERO TIME — Cahier des charges maître et procédure de mise en œuvre

Document fusionné : **Partie A** — Cahier des charges global V6.0 (document maître) ; **Partie B** — Procédure détaillée de mise en œuvre V1.0 (ordre des phases révisé).

## Modifications apportées lors de la fusion

Le cahier des charges (partie A) a reçu les trois premières modifications ; la procédure (partie B) les a reçues toutes. Le reste du contenu est inchangé (seuls les titres ont été mis au format Markdown).

| Modification | Détail |
| --- | --- |
| 4 joueurs maximum par équipe | « 2 à 8 joueurs » devient « 2 à 4 joueurs par équipe » (§2.1, §17.2, §22.7, synthèse, phase 9 de la procédure). |
| Rôle réduit de la télévision | La télévision devient optionnelle : écran spectateur en lecture seule, hors prototype et hors MVP, ajouté après validation. Le compte à rebours, les erreurs et les alertes sont affichés sur les smartphones. Les maquettes TV passent en optionnel dans la procédure. |
| Hébergement en ligne comme Dé-lire | Le §14.5 (fonctionnement local sans Internet) devient « Fonctionnement en ligne » ; le fonctionnement local est repoussé à plus tard. Le prompt d'analyse d'architecture de la procédure est aligné. |
| Procédure réordonnée (partie B) | Le prototype jouable passe avant les maquettes Stitch ; le prototype utilise des configurations Fils écrites à la main (conforme au §18.2) et le générateur n'arrive qu'après la validation du plaisir de jeu (Jalon 0) ; fragmentation « 1 technicien = 1 module » ajoutée ; rotation de l'opérateur à 4 joueurs marquée « À DÉFINIR ». Les phases, étapes et points de contrôle sont renumérotés. |

---

# Partie A — Cahier des charges global (V6.0)

**Version 6.0 — Document maître**

**Statut :** version consolidée  
**Référence fonctionnelle :** cahier des charges DÉMINEURS EXPRESS V5.1  
**Nom officiel du jeu :** ZERO TIME

Ce document reprend la structure complète en 24 chapitres de la V5.1 et y intègre les décisions prises depuis : le nom ZERO TIME, les références graphiques, le périmètre du prototype fondateur et l'organisation du travail entre ChatGPT, Google Stitch et Claude.

Il constitue **l'unique cahier des charges du projet**. Il n'est pas nécessaire de créer une nouvelle spécification fonctionnelle à partir de ce document pour le transmettre aux outils.

## 1. Vision du jeu

### 1.1. Concept

ZERO TIME est un jeu vidéo coopératif dans lequel plusieurs joueurs doivent désamorcer ensemble une série de bombes virtuelles avant la fin du compte à rebours.

Le jeu repose sur trois éléments fondamentaux :

- La communication entre les joueurs.

- La complémentarité des informations détenues par chacun.

- La pression du temps et des erreurs.

Les joueurs ne disposent pas tous des mêmes informations ni des mêmes possibilités d'action.

Le jeu doit obliger les participants à communiquer, à s'écouter, à interpréter des informations et à prendre des décisions collectives.

La réussite dépend de la capacité du groupe à coopérer efficacement.

### 1.2. Le principe central

Le jeu repose sur une séparation des rôles :

- **L'opérateur** voit la bombe et manipule ses modules depuis son smartphone. Il ne dispose pas des règles permettant de les résoudre.

- **Les techniciens** disposent du manuel de désamorçage sur leur smartphone. Ils connaissent les règles, mais ne voient pas directement la bombe.

L'opérateur décrit ce qu'il observe. Les techniciens analysent les informations et lui indiquent les manipulations à effectuer.

La communication constitue donc une mécanique de jeu à part entière.

### 1.3. L'expérience recherchée

Le jeu doit provoquer :

- Une montée progressive de la tension.

- Des échanges rapides et parfois désordonnés.

- Des moments de réflexion collective.

- Des erreurs dues à une mauvaise communication.

- Des réussites obtenues grâce à la coordination.

- Des situations mémorables et amusantes.

L'objectif n'est pas de proposer une simple succession d'énigmes indépendantes. Il faut créer une expérience collective dans laquelle les joueurs ont réellement besoin les uns des autres.

### 1.4. Positionnement

ZERO TIME est un jeu familial et convivial, accessible à des joueurs occasionnels, mais suffisamment riche pour rester intéressant après plusieurs parties.

Il doit pouvoir être utilisé lors d'une soirée, d'un apéritif ou d'un moment entre amis ou en famille.

Le jeu doit être compréhensible rapidement, sans nécessiter de connaissances techniques ou de culture vidéoludique particulière.

## 2. Format et modes de jeu

### 2.1. Format général

| **Élément** | **Cible** |
| --- | --- |
| Nom | ZERO TIME |
| Type | Jeu coopératif de réflexion et de communication |
| Support | Application web progressive (PWA) |
| Écran optionnel | Télévision ou écran partagé (spectateur en lecture seule, non requis pour jouer) |
| Interfaces individuelles | Smartphones |
| Langue initiale | Français |
| Nombre de joueurs | 2 à 4 par équipe |
| Durée d'une partie | Environ 15 à 25 minutes |
| Durée d'une bombe | Environ 2 à 4 minutes |
| Structure initiale | 3 bombes successives |

Le jeu doit fonctionner depuis un navigateur, sans installation obligatoire sur les smartphones.

### 2.2. Mode coopératif

Le mode coopératif constitue le mode principal et le périmètre prioritaire du développement.

Tous les joueurs appartiennent à la même équipe.

Ils doivent désamorcer les trois bombes successives pour remporter la partie.

Le rôle d'opérateur change entre les bombes afin que plusieurs joueurs puissent expérimenter les différentes responsabilités.

Les autres joueurs deviennent techniciens et utilisent le manuel pour guider l'opérateur.

### 2.3. Mode compétitif

Le mode compétitif est prévu comme une évolution future.

Il pourra permettre à plusieurs équipes de s'affronter sur des bombes différentes ou sur des configurations identiques.

Les résultats pourront être comparés selon :

- Le temps restant.

- Le nombre d'erreurs.

- La rapidité de résolution.

- La performance globale de l'équipe.

Ce mode ne fait pas partie du MVP.

L'architecture devra toutefois éviter de rendre son ajout inutilement complexe.

### 2.4. Mode nomade

Un mode nomade pourra être étudié ultérieurement.

Il devra permettre de jouer sans télévision, avec une organisation adaptée à des joueurs réunis autour d'un ou plusieurs smartphones.

Ce mode ne fait pas partie du périmètre initial.

Précision : le jeu sans télévision, sur smartphones uniquement, est le mode de référence du prototype fondateur et du MVP. La télévision est optionnelle (voir 12.5).

## 3. Principes fondamentaux du game design

### 3.1. Coopération obligatoire

La coopération ne doit pas être facultative.

Aucun joueur ne doit pouvoir résoudre seul l'ensemble d'une bombe dans le fonctionnement normal du jeu.

La répartition des informations doit rendre les échanges indispensables.

### 3.2. Asymétrie de l'information

L'opérateur dispose des informations visuelles sur la bombe :

- Les modules présents.

- Les symboles affichés.

- Les fils.

- Les chiffres.

- Les séquences.

- Les états des différents éléments.

Il ne dispose pas des règles complètes de résolution.

Les techniciens disposent des règles du manuel, mais ne voient pas directement la configuration réelle de la bombe.

Ils doivent donc comprendre les descriptions de l'opérateur et les traduire en instructions précises.

### 3.3. Pression temporelle

Le compte à rebours est un élément central de l'expérience.

Il doit rester visible et compréhensible depuis les smartphones et, lorsqu'elle est utilisée, depuis la télévision.

La pression doit augmenter naturellement à mesure que le temps diminue.

### 3.4. Simplicité des interactions

Les actions de l'opérateur doivent être simples :

- Toucher un élément.

- Sélectionner une réponse.

- Modifier un état.

- Valider une action.

Les techniciens doivent pouvoir consulter rapidement les informations utiles dans leur manuel.

La difficulté doit provenir des énigmes et de la communication, pas d'une interface compliquée.

### 3.5. Variété

Les parties doivent varier grâce à :

- La sélection des modules.

- Les paramètres des modules.

- Les règles applicables.

- Les solutions attendues.

- Les dépendances entre modules.

- La répartition des informations dans le manuel.

La génération procédurale doit renouveler les situations sans produire des configurations incohérentes ou impossibles.

### 3.6. Lisibilité

Les informations affichées doivent être immédiatement compréhensibles.

La télévision, lorsqu'elle est utilisée, doit privilégier les informations essentielles.

Les smartphones doivent privilégier la précision et l'accès rapide aux informations.

## 4. Architecture des mécaniques

### 4.1. Structure d'une bombe

Une bombe est composée de plusieurs modules.

Chaque module représente une énigme ou une mécanique à résoudre.

Une bombe peut contenir plusieurs modules indépendants ou interdépendants.

Chaque module possède :

- Une identité.

- Une interface visuelle.

- Des paramètres.

- Des règles de résolution.

- Des indices éventuels.

- Une solution attendue.

- Des actions possibles.

- Des conditions d'erreur.

- Un niveau de difficulté.

- Des dépendances éventuelles avec d'autres modules.

### 4.2. États d'un module

Un module peut notamment être dans les états suivants :

- Non commencé.

- En cours.

- Résolu.

- En erreur.

- Verrouillé, lorsqu'une dépendance l'empêche d'être traité.

L'interface doit permettre de comprendre immédiatement l'état de chaque module.

### 4.3. Validation

Les actions de l'opérateur sont transmises au serveur.

Le serveur vérifie si l'action correspond à la solution attendue.

Il décide ensuite :

- De valider le module.

- De maintenir le module en cours.

- De déclencher une erreur.

- D'appliquer une pénalité.

- De mettre à jour l'état général de la bombe.

Le client ne doit pas être l'autorité sur les résultats du jeu.

### 4.4. Progression

La résolution d'un module peut :

- Débloquer un autre module.

- Fournir une information nécessaire ailleurs.

- Modifier les conditions d'une autre énigme.

- Déclencher une étape supplémentaire.

- Contribuer à la résolution globale de la bombe.

### 4.5. Équilibrage

Le nombre de modules, leur difficulté et leurs dépendances doivent être configurables.

Le système doit permettre d'ajuster la difficulté sans devoir réécrire le moteur du jeu.

## 5. Catalogue des modules et des énigmes

### 5.1. Familles d'énigmes

Le catalogue doit couvrir plusieurs familles de réflexion :

- Observation.

- Déduction.

- Association.

- Séquence.

- Calcul.

- Classification.

- Gestion du temps.

- Mémoire.

- Manipulation.

- Communication.

Cette diversité doit permettre de renouveler les types de raisonnement et d'éviter que toutes les énigmes reposent sur le même mécanisme.

### 5.2. Modules initiaux

Le premier catalogue repose notamment sur trois modules :

- **Fils :** observation et sélection d'un ou plusieurs fils selon des règles précises.

- **Code PIN :** déduction et identification d'une combinaison.

- **Symboles :** reconnaissance et association de symboles selon une règle donnée.

Ces trois modules constituent la base fonctionnelle du MVP.

Le module Fils est également utilisé pour le prototype fondateur du Jalon 0.

### 5.3. Catalogue complémentaire

Le jeu doit pouvoir accueillir progressivement d'autres modules.

Le catalogue cible comprend notamment les familles et mécaniques suivantes :

- Séquences logiques.

- Suites numériques.

- Associations de symboles.

- Reconnaissance visuelle.

- Classements.

- Ordres de priorité.

- Calcul mental.

- Codes et combinaisons.

- Mémoire visuelle.

- Mémorisation de séquences.

- Déduction à partir d'indices.

- Énigmes de correspondance.

- Manipulation d'interrupteurs.

- Gestion de circuits.

- Actions conditionnelles.

- Énigmes temporelles.

- Énigmes nécessitant une coordination.

- Énigmes combinant plusieurs mécanismes.

Chaque nouveau module doit être conçu comme un élément indépendant, intégrable au moteur existant.

### 5.4. Conception des modules

Chaque module doit être décrit de manière structurée :

| **Élément** | **Description** |
| --- | --- |
| Identifiant | Identifiant unique du module |
| Nom | Nom affiché |
| Famille | Type de raisonnement |
| Difficulté | Niveau estimé |
| Paramètres | Données variables |
| Règles | Conditions de résolution |
| Indices | Informations disponibles |
| Solution | Réponse attendue |
| Actions | Interactions possibles |
| Erreurs | Actions incorrectes |
| Dépendances | Liens avec d'autres modules |

Les règles ne doivent pas être dispersées dans le code de l'interface.

Elles doivent être séparées du moteur afin de faciliter l'ajout de nouveaux modules.

## 6. Génération procédurale

### 6.1. Objectif

La génération procédurale doit permettre de créer des bombes différentes à chaque partie.

Le joueur ne doit pas retrouver systématiquement les mêmes configurations, les mêmes solutions ou les mêmes enchaînements.

La rejouabilité constitue un objectif majeur du projet.

### 6.2. Éléments générés

Le système doit pouvoir générer :

- Le nombre et la sélection des modules.

- Les paramètres de chaque module.

- Les règles applicables.

- Les solutions attendues.

- Les indices nécessaires.

- Les dépendances entre modules.

- Les informations distribuées dans le manuel.

- L'ordre de résolution éventuel.

La génération doit respecter les contraintes de difficulté et de cohérence.

### 6.3. Cohérence des configurations

Une bombe générée doit obligatoirement être résoluble.

Le système doit garantir :

- L'existence d'une solution.

- L'absence de contradiction entre les règles.

- L'absence de dépendance circulaire bloquante.

- La disponibilité des informations nécessaires.

- La cohérence entre les éléments affichés et les règles du manuel.

- La possibilité de terminer la bombe dans le temps prévu.

Une configuration impossible ne doit jamais être proposée aux joueurs.

### 6.4. Génération du manuel

Le manuel ne doit pas être un document générique contenant toutes les règles possibles.

Il doit être généré à partir de la configuration réelle de la bombe.

Il contient uniquement les informations utiles à la partie, réparties entre les techniciens.

La distribution des informations doit dépendre du nombre de joueurs et de la configuration de la bombe.

### 6.5. Seeds

Chaque génération doit pouvoir être associée à une seed.

Cette seed permet de reproduire exactement une configuration pour :

- Les tests.

- Le débogage.

- L'analyse d'une partie.

- La vérification d'une anomalie.

- La comparaison de deux générations.

### 6.6. Éviter les répétitions

Le système doit limiter les configurations trop proches des parties précédentes.

Il devra notamment éviter :

- La répétition systématique des mêmes modules.

- Les mêmes combinaisons de paramètres.

- Les mêmes chaînes de dépendances.

- Les mêmes types de résolution successifs.

La génération doit produire de la variété sans sacrifier la qualité.

## 7. Dépendances entre énigmes

### 7.1. Principe

Les modules ne doivent pas nécessairement être indépendants.

La résolution d'un module peut influencer les conditions de résolution d'un autre.

Ces dépendances permettent de créer des énigmes plus riches et des situations nécessitant une réflexion collective.

### 7.2. Types de dépendances

Le moteur doit pouvoir prendre en charge plusieurs types de dépendances :

| **Type** | **Principe** |
| --- | --- |
| Directe | La résolution d'un module débloque un autre module |
| Conditionnelle | Une action dépend d'une condition préalable |
| Résultat | Le résultat d'un module est utilisé dans un autre |
| Collective | Plusieurs résultats sont nécessaires pour progresser |
| Temporelle | Une action doit être réalisée dans un ordre ou un délai donné |
| Prioritaire | Un module doit être traité avant un autre |

### 7.3. Représentation

Les dépendances doivent être définies de manière structurée.

Elles doivent pouvoir être analysées par le générateur et le système de validation.

Le moteur ne doit pas dépendre d'une succession de conditions codées manuellement pour chaque bombe.

### 7.4. Prévention des blocages

Le générateur doit empêcher :

- Les boucles de dépendances.

- Les modules impossibles à débloquer.

- Les contradictions entre modules.

- Les dépendances sans solution.

- Les situations dans lesquelles une information nécessaire n'est jamais accessible.

- Les chaînes de résolution impossibles à terminer.

### 7.5. Progression lisible

Les dépendances doivent être compréhensibles par les joueurs à travers les informations du jeu.

Elles ne doivent pas nécessairement être affichées explicitement sous forme de schéma.

Leur découverte peut faire partie de la réflexion.

## 8. Manuel et coopération

### 8.1. Rôle du manuel

Le manuel constitue l'outil principal des techniciens.

Il contient les règles nécessaires à la résolution des modules présents dans la bombe.

Il ne doit pas simplement reproduire une documentation technique classique.

Il doit être pensé comme un outil de consultation rapide, utilisable sous pression.

### 8.2. Fragmentation des informations

Les informations doivent être réparties entre les techniciens.

Tous les joueurs ne doivent pas disposer systématiquement de la totalité du manuel.

La répartition doit être adaptée au nombre de participants.

Cette fragmentation oblige les techniciens à communiquer entre eux et avec l'opérateur.

### 8.3. Organisation du manuel

Le manuel doit proposer plusieurs mécanismes de consultation :

- Un index.

- Une recherche rapide.

- Des catégories.

- Des filtres.

- Des tableaux.

- Des arbres de décision.

- Des codes visuels.

- Des instructions étape par étape.

- Des informations contextuelles.

L'accès à une règle ne doit pas nécessiter une navigation complexe.

### 8.4. Ergonomie

Le manuel doit être conçu pour une utilisation sur smartphone.

Les textes doivent être lisibles.

Les tableaux doivent rester compréhensibles sur un écran de petite taille.

Les informations essentielles doivent être immédiatement accessibles.

Les joueurs doivent pouvoir retrouver une règle rapidement sans perdre leur concentration.

### 8.5. Communication

La communication entre les participants est une mécanique centrale.

Le jeu ne doit pas imposer de canal vocal intégré dans le MVP.

Les joueurs communiquent naturellement, à voix haute, dans la pièce.

L'interface doit favoriser cette communication en affichant des informations suffisamment précises pour être décrites.

## 9. Difficulté

### 9.1. Profils de difficulté

Le jeu doit proposer trois profils de difficulté.

| **Profil** | **Description** |
| --- | --- |
| Recrue | Découverte, règles simples, temps plus confortable |
| Démineur | Difficulté intermédiaire, coordination nécessaire |
| Expert | Règles plus complexes, dépendances et pression renforcée |

Les valeurs précises de temps, de pénalités et de complexité doivent pouvoir être ajustées.

### 9.2. Paramètres de difficulté

La difficulté peut agir sur :

- Le nombre de modules.

- La complexité des règles.

- Le nombre de paramètres variables.

- Le nombre de dépendances.

- La quantité d'informations à partager.

- La proximité entre les solutions possibles.

- Le temps disponible.

- La fréquence des événements particuliers.

### 9.3. Progression

La difficulté doit être cohérente avec l'expérience recherchée.

Le joueur doit pouvoir comprendre les mécanismes de base avant de rencontrer des combinaisons plus complexes.

### 9.4. Difficulté adaptative

Une difficulté adaptative pourra être étudiée dans une évolution ultérieure.

Elle pourrait ajuster certains paramètres en fonction des résultats des parties précédentes.

Cette fonctionnalité ne fait pas partie du MVP.

## 10. Structure d'une partie

### 10.1. Déroulement général

Une partie standard se compose de trois bombes successives.

Chaque bombe possède son propre compte à rebours et ses propres modules.

L'équipe doit désamorcer les trois bombes pour remporter la partie.

### 10.2. Étapes d'une partie

- Création de la salle.

- Connexion des joueurs.

- Attribution des rôles.

- Présentation de la mission.

- Démarrage de la première bombe.

- Résolution des modules.

- Validation du désamorçage.

- Transition vers la bombe suivante.

- Rotation du rôle d'opérateur.

- Répétition jusqu'à la troisième bombe.

- Affichage du résultat final.

### 10.3. Rotation des rôles

Le rôle d'opérateur change entre les bombes.

Cette rotation doit permettre à chacun de participer activement à l'expérience.

Le système doit gérer la réattribution des rôles et des interfaces sans interrompre la partie.

### 10.4. Progression entre les bombes

La réussite d'une bombe permet de passer à la suivante.

Le jeu doit afficher clairement :

- La bombe terminée.

- La progression globale.

- La prochaine étape.

- Le changement éventuel d'opérateur.

### 10.5. Conditions de victoire

L'équipe gagne lorsqu'elle désamorce les trois bombes de la partie.

### 10.6. Conditions de défaite

L'équipe perd notamment lorsque :

- Le compte à rebours arrive à zéro.

- Le nombre maximal d'erreurs est atteint.

- Une explosion est déclenchée par une règle du jeu.

### 10.7. Évolutions futures

La structure devra pouvoir accueillir ultérieurement :

- Un mode marathon.

- Un mode express.

- Un mode survie.

- Des missions thématiques.

- Des défis quotidiens.

Ces modes ne sont pas inclus dans le MVP.

## 11. Erreurs, pénalités et tension

### 11.1. Principe

Les erreurs doivent avoir des conséquences réelles.

Elles augmentent la pression et obligent les joueurs à vérifier leurs informations avant de demander une action à l'opérateur.

### 11.2. Système de pénalités

Le système de pénalités retenu est le suivant :

| **Erreur** | **Conséquence** |
| --- | --- |
| Première erreur | Retrait de 20 secondes |
| Deuxième erreur | Retrait supplémentaire de 30 secondes |
| Troisième erreur | Explosion immédiate |

Le cumul des erreurs est limité à trois.

La troisième erreur provoque immédiatement la défaite sur la bombe en cours.

### 11.3. Gestion des erreurs

Le serveur est responsable de la validation des actions et de l'application des pénalités.

Une erreur ne doit être comptabilisée qu'une seule fois.

Le système doit empêcher qu'une même action déclenche plusieurs pénalités à cause :

- D'un double clic.

- D'une répétition de requête.

- D'un problème réseau.

- D'une reconnexion.

- D'un événement reçu plusieurs fois.

### 11.4. Gestion du temps

Le temps ne doit jamais devenir négatif.

Une pénalité ne doit pas provoquer un état incohérent.

Le compte à rebours doit être synchronisé et contrôlé par le serveur.

### 11.5. Alertes temporelles

Des alertes doivent être prévues aux seuils suivants :

- 2 minutes restantes.

- 1 minute restante.

- 30 secondes restantes.

- 10 secondes restantes.

Ces alertes peuvent combiner des effets visuels et sonores.

Elles doivent être suffisamment visibles pour être comprises depuis les smartphones et, lorsqu'elle est utilisée, depuis la télévision.

### 11.6. Tension visuelle et sonore

La tension doit augmenter à mesure que le temps diminue.

Les effets visuels et sonores doivent renforcer l'expérience sans nuire à la lisibilité.

Les animations doivent rester courtes et ne pas ralentir les interactions.

## 12. Direction artistique et identité visuelle

### 12.1. Identité

Le nom officiel du jeu est **ZERO TIME**.

L'identité visuelle doit évoquer :

- Le compte à rebours.

- L'urgence.

- La technologie.

- La précision.

- La tension.

- La coopération.

L'ensemble doit être immédiatement identifiable et cohérent entre les smartphones et, lorsqu'elle est utilisée, la télévision.

### 12.2. Référence visuelle principale — Vignette 1

La Vignette 1 est la référence graphique principale pour la conception des interfaces.

Elle définit l'ambiance visuelle générale du jeu : univers sombre, industriel et technologique, avec une forte présence du compte à rebours, des éléments de la bombe et des signaux de tension.

Elle doit guider la conception des interfaces mobiles et de l'écran télévision optionnel.

Les maquettes ne doivent pas s'éloigner de cette direction sans validation explicite.

La Vignette 1 est une référence graphique à transmettre directement à Google Stitch. Elle ne doit pas être remplacée par une simple description textuelle.

### 12.3. Symbole officiel ZERO TIME

Le symbole minimaliste du jeu est un élément distinct de la Vignette 1.

Il repose sur un zéro lumineux blanc au centre d'un anneau circulaire orange-doré, sur fond noir, avec des effets lumineux et des particules.

Ce symbole constitue un élément officiel de l'identité ZERO TIME.

Il doit être utilisé comme logo ou icône selon les besoins, sans être confondu avec la référence de mise en page de la Vignette 1.

### 12.4. Palette de couleurs

La palette de référence est la suivante :

| **Couleur** | **Code** | **Usage** |
| --- | --- | --- |
| Bleu noir | #101820 | Fond principal |
| Bleu industriel | #192630 | Surfaces et panneaux |
| Gris bleu | #263640 | Éléments secondaires |
| Blanc cassé | #F3F5F5 | Texte principal |
| Gris clair | #A8B3BB | Texte secondaire |
| Orange | #FF9F32 | Action, attention, tension |
| Rouge | #F04444 | Erreur, danger, explosion |
| Vert | #42C | État positif à préciser dans le système graphique |

Les couleurs doivent être utilisées de manière cohérente.

Les informations importantes ne doivent jamais être identifiables uniquement par leur couleur.

### 12.5. Écran télévision

L'écran télévision est optionnel. Il n'est pas requis pour jouer et n'est pas inclus dans le prototype fondateur ni dans le MVP : il sera ajouté après leur validation, comme écran spectateur en lecture seule. En son absence, le compte à rebours, le nombre d'erreurs et les alertes sont affichés sur les smartphones. Lorsqu'il est utilisé, l'écran télévision constitue un point de rassemblement de l'expérience collective.

Il doit afficher :

- La bombe en cours.

- Le compte à rebours.

- Les modules.

- L'état de chaque module.

- Le nombre d'erreurs.

- La progression.

- Les alertes.

- Les événements importants.

L'interface doit être lisible à plusieurs mètres.

La hiérarchie visuelle doit privilégier le compte à rebours et les éléments nécessaires à la compréhension de la situation.

Le texte doit rester limité.

### 12.6. Interface opérateur

L'interface opérateur est utilisée sur smartphone.

Elle doit permettre :

- De visualiser la bombe.

- D'identifier les modules.

- De manipuler les éléments.

- De sélectionner les réponses.

- De valider les actions.

- De visualiser les retours du jeu.

Les interactions doivent être adaptées à une utilisation à une main.

Les zones tactiles doivent être suffisamment grandes.

Les erreurs de manipulation involontaires doivent être limitées.

### 12.7. Interface technicien

L'interface technicien donne accès au manuel de désamorçage.

Elle doit permettre :

- De consulter les règles.

- De rechercher une information.

- De filtrer les modules.

- De naviguer dans les tableaux et arbres de décision.

- De retrouver rapidement les consignes utiles.

Elle doit privilégier la lisibilité et la rapidité de consultation.

### 12.8. Typographie et composants

La typographie doit être lisible sur télévision et smartphone.

Les composants graphiques doivent être cohérents :

- Boutons.

- Cartes.

- Panneaux.

- Indicateurs.

- Badges d'état.

- Alertes.

- Compteurs.

- Barres de progression.

- Fenêtres de confirmation.

Un même composant doit conserver une apparence et un comportement cohérents sur les différents écrans.

### 12.9. Accessibilité

Le jeu doit prendre en compte :

- Les contrastes.

- La lisibilité des textes.

- Les tailles des zones tactiles.

- Les informations qui ne reposent pas uniquement sur la couleur.

- Les retours visuels.

- Les vibrations éventuelles.

- Le volume sonore.

- Les animations configurables.

Les effets visuels ne doivent jamais empêcher de comprendre une information essentielle.

## 13. Rejouabilité et durée de vie

### 13.1. Objectif

ZERO TIME doit pouvoir être rejoué un grand nombre de fois sans donner l'impression de répéter systématiquement la même partie.

La rejouabilité doit être intégrée dès la conception du moteur.

Elle ne doit pas dépendre uniquement de l'ajout régulier de nouveaux modules.

### 13.2. Renouvellement des parties

Chaque partie doit pouvoir varier grâce à la combinaison de :

- Modules différents.

- Paramètres différents.

- Règles différentes.

- Solutions différentes.

- Dépendances différentes.

- Ordres de résolution différents.

- Informations réparties différemment dans le manuel.

### 13.3. Combinaisons

Le système doit permettre de générer un grand nombre de configurations valides.

La variété ne doit pas être obtenue au détriment de la cohérence.

Chaque combinaison doit être vérifiée avant d'être proposée aux joueurs.

### 13.4. Évolutivité du catalogue

De nouveaux modules doivent pouvoir être ajoutés sans modifier profondément le moteur.

Les modules doivent être indépendants autant que possible.

Leur intégration doit reposer sur une structure commune.

### 13.5. Évolutions de contenu

La durée de vie pourra être renforcée par :

- De nouveaux modules.

- De nouvelles familles d'énigmes.

- De nouveaux thèmes.

- Des niveaux de difficulté.

- Des événements spéciaux.

- Des modes de jeu supplémentaires.

- Des défis renouvelés.

### 13.6. Absence de répétition artificielle

La génération ne doit pas simplement mélanger quelques valeurs.

Elle doit produire des situations qui demandent réellement des raisonnements différents.

Les tests automatiques doivent détecter les configurations trop proches et les répétitions excessives.

## 14. Architecture technique évolutive

### 14.1. Principes généraux

L'architecture doit être conçue pour permettre :

- Un fonctionnement fluide sur plusieurs smartphones.

- L'affichage optionnel sur télévision (spectateur en lecture seule).

- La synchronisation des informations en temps réel.

- La gestion fiable du compte à rebours.

- La validation centralisée des actions.

- L'ajout de nouveaux modules.

- L'évolution des modes de jeu.

- La maintenance du jeu sans réécriture complète.

La simplicité de mise en œuvre et la maîtrise des coûts sont des critères importants.

### 14.2. Technologies envisagées

La cible technique proposée est la suivante :

| **Domaine** | **Technologie envisagée** |
| --- | --- |
| Application | PWA |
| Interface | React |
| Langage | TypeScript |
| Communication temps réel | Socket.io |
| Serveur | Node.js |
| Graphismes | CSS / SVG |
| Versionnement | Git |
| Développement | Claude Code |
| Maquettes | Google Stitch |

Cette architecture constitue une proposition technique à valider avant le développement complet. Elle ne doit pas être considérée comme une obligation si l'analyse technique démontre qu'une solution plus simple répond mieux aux besoins.

### 14.3. Architecture client-serveur

Le serveur doit être l'autorité sur les éléments sensibles du jeu.

Il gère notamment :

- L'état de la partie.

- Les rôles.

- La configuration de la bombe.

- Les règles de résolution.

- Le compte à rebours.

- La validation des actions.

- Les erreurs.

- Les pénalités.

- Les transitions entre les bombes.

- Le résultat final.

Les clients gèrent principalement :

- L'affichage.

- Les interactions.

- Les animations.

- Les retours visuels.

- La consultation du manuel.

Le client ne doit pas pouvoir décider seul qu'un module est résolu ou qu'une partie est gagnée.

### 14.4. Synchronisation

Les informations doivent être synchronisées en temps réel entre :

- L'écran télévision, lorsqu'il est utilisé.

- Le smartphone de l'opérateur.

- Les smartphones des techniciens.

Une action validée doit produire un état cohérent sur tous les écrans.

Le système doit éviter les décalages importants entre le compte à rebours affiché et le temps réellement géré par le serveur.

### 14.5. Fonctionnement en ligne

Le jeu est hébergé en ligne, comme Dé-lire.

Le fonctionnement est le suivant :

- Le serveur du jeu est hébergé en ligne.

- Les smartphones (et la télévision, si elle est utilisée) se connectent au serveur via Internet, depuis le Wi-Fi ou le réseau mobile.

- Les joueurs rejoignent la partie.

- Les échanges passent par le serveur en ligne.

Un fonctionnement local, avec un appareil qui héberge le serveur sur le réseau Wi-Fi sans connexion Internet, pourra être étudié ultérieurement. Il ne fait pas partie du périmètre initial.

### 14.6. Résilience réseau

Le système doit prendre en compte :

- Une déconnexion temporaire.

- Une reconnexion d'un joueur.

- Une perte momentanée du réseau.

- La répétition d'une requête.

- Un changement d'état pendant une déconnexion.

Une reconnexion ne doit pas réinitialiser la partie ni provoquer une pénalité injustifiée.

L'état de référence doit rester conservé côté serveur.

### 14.7. Sécurité et intégrité

Le serveur doit contrôler les actions reçues.

Il doit empêcher les manipulations incohérentes et les validations frauduleuses.

Les règles de résolution ne doivent pas être considérées comme fiables lorsqu'elles proviennent uniquement du navigateur.

### 14.8. Évolutivité des modules

Les règles et les données des modules doivent être séparées du moteur principal.

Le système doit permettre d'ajouter un module sans modifier l'ensemble de l'application.

Une structure déclarative de type « Conditions → Effets » est à privilégier lorsque cela est pertinent.

### 14.9. Gestion des versions

Les modules, les règles et les contenus doivent pouvoir être versionnés indépendamment du moteur.

Cela doit faciliter :

- L'ajout de nouveaux modules.

- La correction de règles.

- La compatibilité des anciennes configurations.

- La reproduction d'une partie.

- Les tests de non-régression.

### 14.10. Hébergement et coûts

La solution devra privilégier les technologies gratuites ou disposant d'une offre gratuite suffisante.

Aucune API payante ni aucun service générant des coûts récurrents ne doit être introduit sans validation préalable.

Les éventuelles limites des offres gratuites devront être identifiées avant de retenir une solution.

## 15. Évolutions et contenus futurs

### 15.1. Philosophie

ZERO TIME doit être conçu comme un jeu évolutif.

Le MVP doit constituer une base stable sur laquelle il sera possible d'ajouter des contenus et des fonctionnalités.

Les évolutions ne doivent pas nécessiter de remettre en cause les fondations du jeu.

### 15.2. Nouveaux modules

Le catalogue doit pouvoir s'enrichir progressivement.

Chaque module supplémentaire doit respecter le format commun défini dans l'architecture des mécaniques.

### 15.3. Nouveaux thèmes

Des univers visuels et narratifs pourront être ajoutés.

Ils pourront modifier :

- L'apparence des bombes.

- Les décors.

- Les effets visuels.

- Les sons.

- Les éléments de narration.

- Les ambiances de mission.

La mécanique centrale de coopération doit rester identifiable.

### 15.4. Nouveaux modes

Les modes suivants pourront être développés :

- Compétitif.

- Marathon.

- Express.

- Survie.

- Défis quotidiens.

- Missions thématiques.

### 15.5. Progression et statistiques

Des statistiques pourront être ajoutées :

- Nombre de parties.

- Nombre de victoires.

- Nombre d'erreurs.

- Temps moyen de résolution.

- Performance par équipe.

- Performance individuelle.

- Modules les plus difficiles.

Ces éléments ne sont pas nécessaires au MVP.

### 15.6. Évolutions adaptatives

Le jeu pourra intégrer des mécanismes permettant d'adapter la difficulté ou la composition des parties en fonction des résultats précédents.

Ces évolutions ne doivent pas complexifier inutilement la première version.

## 16. Génération, tests et contrôle qualité

### 16.1. Principe

La génération procédurale doit être accompagnée d'un système de contrôle qualité.

Une configuration générée ne doit pas être considérée comme valide simplement parce qu'elle respecte les formats attendus.

Elle doit être vérifiée sur le plan logique et fonctionnel.

### 16.2. Validation des configurations

Chaque configuration doit être contrôlée pour vérifier :

- Qu'une solution existe.

- Que les règles sont cohérentes.

- Que les informations nécessaires sont accessibles.

- Que les dépendances sont valides.

- Que les modules peuvent être terminés.

- Que la difficulté est conforme au profil demandé.

### 16.3. Solveur

Un solveur automatique doit être prévu pour vérifier les configurations générées.

Il doit être capable de déterminer si une bombe est résoluble.

Lorsque cela est possible, il doit également vérifier l'unicité de la solution.

L'objectif est d'éviter les bombes impossibles ou ambiguës.

Le solveur devra évoluer avec la complexité des modules et des dépendances.

### 16.4. Tests automatiques

Le système doit permettre de lancer des séries de générations automatiques.

L'objectif est de tester un grand nombre de configurations, notamment plusieurs milliers lorsque le moteur le permettra.

Les tests doivent détecter :

- Les configurations impossibles.

- Les contradictions.

- Les blocages.

- Les erreurs de validation.

- Les problèmes de dépendances.

- Les répétitions excessives.

- Les déséquilibres de difficulté.

### 16.5. Tests fonctionnels

Chaque module doit être testé individuellement.

Les interactions entre modules doivent également être testées.

Les tests doivent couvrir les différentes situations de jeu, y compris les erreurs et les pénalités.

### 16.6. Tests multi-appareils

Le jeu doit être testé sur plusieurs appareils :

- Télévision ou écran principal (optionnel).

- Smartphone opérateur.

- Smartphones techniciens.

Les tests doivent vérifier la synchronisation, la lisibilité et la cohérence des états.

### 16.7. Tests réseau

Les tests doivent couvrir :

- La connexion initiale.

- Les déconnexions.

- Les reconnexions.

- Les actions simultanées.

- Les requêtes répétées.

- Les changements de rôle.

- Les transitions entre les bombes.

### 16.8. Indicateurs de qualité

Les indicateurs pourront notamment suivre :

- Le taux de configurations valides.

- Le taux de configurations résolubles.

- Le taux de répétition.

- Le temps moyen de résolution.

- Le taux de réussite par difficulté.

- Le nombre d'erreurs par bombe.

- Les problèmes de synchronisation.

- Les incidents techniques.

## 17. MVP — Première version jouable complète

### 17.1. Objectif

Le MVP doit permettre de jouer à une partie complète de ZERO TIME dans des conditions suffisamment abouties pour valider l'expérience.

Il constitue la première version réellement exploitable du jeu.

Il est distinct du Jalon 0, qui sert uniquement à vérifier rapidement le plaisir de jeu et la mécanique fondamentale.

### 17.2. Fonctionnalités incluses

Le MVP doit intégrer :

- La création d'une salle.

- La connexion des joueurs par QR code ou code de salle.

- La prise en charge de 2 à 4 joueurs par équipe.

- Le mode coopératif.

- L'interface opérateur.

- L'interface technicien.

- La génération procédurale des bombes.

- La génération du manuel.

- La fragmentation des informations.

- Les trois modules initiaux : Fils, Code PIN et Symboles.

- Les premières dépendances entre modules.

- Les trois bombes successives.

- Le compte à rebours.

- Le système de pénalités.

- La rotation des rôles.

- La gestion des déconnexions et reconnexions.

- La gestion des seeds.

- Les écrans de victoire et de défaite.

### 17.3. Fonctionnalités exclues du MVP

Ne sont pas prévues dans le MVP :

- Le mode compétitif.

- L'écran télévision (optionnel, ajouté après validation du MVP).

- Les autres modules du catalogue.

- Les événements spéciaux.

- Les classements.

- Les statistiques avancées.

- Les thèmes supplémentaires.

- La difficulté adaptative.

- Les modes marathon et survie.

- Les fonctionnalités sociales avancées.

### 17.4. Critère de réussite

Le MVP doit permettre à un groupe de joueurs de créer une partie, de rejoindre la salle depuis leurs smartphones, de coopérer pour résoudre trois bombes et d'obtenir un résultat final cohérent.

La génération doit garantir que les parties sont jouables et résolubles.

## 18. Jalon 0 — Prototype fondateur

### 18.1. Objectif

Le Jalon 0 est un prototype très réduit destiné à valider le plaisir de jeu.

Il ne doit pas chercher à démontrer toute l'architecture cible.

Il doit permettre de vérifier rapidement que le principe de communication asymétrique fonctionne dans une situation réelle.

### 18.2. Périmètre

Le prototype fondateur repose sur :

- Un seul module : Fils.

- Deux joueurs.

- Un opérateur.

- Un technicien.

- Une seule bombe.

- Une durée de trois minutes.

- Des règles codées en dur.

- Une interface volontairement simple.

### 18.3. Fonctionnement

L'opérateur voit les fils sur son interface.

Le technicien consulte les règles correspondantes dans son manuel.

L'opérateur décrit les fils.

Le technicien interprète la situation et lui indique les fils à couper.

L'opérateur effectue les manipulations.

Le jeu valide les actions et déclenche les conséquences en cas d'erreur.

### 18.4. Interfaces à concevoir

Le prototype doit disposer des écrans nécessaires à une expérience complète, même s'ils sont simples :

- Écran de connexion.

- Écran de préparation.

- Interface smartphone opérateur.

- Interface smartphone technicien.

- Écran de victoire.

- Écran d'explosion.

Le prototype fondateur n'inclut pas d'écran télévision : le compte à rebours, les erreurs et les alertes sont affichés sur les smartphones.

### 18.5. Tests réels

Le prototype doit être testé dans des conditions réelles, notamment lors d'un apéritif ou d'une soirée.

L'objectif est d'observer :

- La compréhension des rôles.

- La qualité des échanges.

- La nécessité de communiquer.

- La tension générée par le temps.

- La compréhension du manuel.

- Le plaisir ressenti.

- Les éventuelles frustrations.

### 18.6. Critère de validation

Le Jalon 0 est validé lorsque le mécanisme central provoque naturellement des échanges et une coopération réelle.

Il ne faut pas investir dans un générateur procédural complexe avant d'avoir validé ce principe.

### 18.7. Limites

Le Jalon 0 n'est pas une version réduite du MVP à conserver telle quelle.

Il s'agit d'une expérimentation destinée à apprendre rapidement.

Les éléments techniques temporaires pourront être remplacés ensuite.

## 19. Roadmap de développement

Le développement doit être progressif.

Chaque étape doit produire un résultat vérifiable avant de passer à la suivante.

| **Phase** | **Objectif** | **Résultat attendu** |
| --- | --- | --- |
| Phase 0 | Prototype fondateur | Une bombe Fils jouable à deux |
| Phase 1 | Fondations techniques | Structure de l'application et communication |
| Phase 2 | Interfaces | Écrans smartphones (télévision optionnelle, ajoutée ensuite) |
| Phase 3 | Mécaniques de jeu | Modules, validation, temps et pénalités |
| Phase 4 | Manuel | Règles et répartition des informations |
| Phase 5 | Génération | Génération de bombes cohérentes |
| Phase 6 | MVP | Partie complète de trois bombes |
| Phase 7 | Stabilisation | Tests, corrections et optimisation |
| Phase 8 | Évolutions | Nouveaux modules et modes de jeu |

### 19.1. Principe de progression

Chaque phase doit être validée avant d'engager la suivante.

Il faut éviter de développer plusieurs fonctionnalités complexes en parallèle sans avoir vérifié les fondations.

### 19.2. Priorité

La priorité est de disposer rapidement d'une expérience jouable.

La sophistication technique et la richesse du catalogue ne doivent pas retarder inutilement la validation du concept.

### 19.3. Réduction des risques

Les principaux risques à maîtriser sont :

- La complexité de la génération procédurale.

- La fiabilité des dépendances.

- La synchronisation entre appareils.

- La lisibilité des interfaces.

- La qualité de l'expérience de coopération.

- La maîtrise des coûts d'hébergement et des outils.

## 20. Organisation du développement avec les IA

### 20.1. Principe général

Le projet s'appuie sur une répartition claire des responsabilités entre les outils utilisés.

L'objectif est de limiter les interventions manuelles de l'utilisateur, qui ne maîtrise pas le développement logiciel.

### 20.2. ChatGPT — Pilotage et conception

ChatGPT intervient comme :

- Chef de projet.

- Responsable de la cohérence fonctionnelle.

- Concepteur des mécaniques de jeu.

- Contrôleur des exigences.

- Relecteur des choix techniques.

- Responsable de la validation des livrables.

Il doit vérifier que les décisions prises restent conformes au cahier des charges.

Il ne doit pas modifier silencieusement les règles ou le périmètre du jeu.

### 20.3. Google Stitch — Conception graphique et UX

Google Stitch est responsable de la conception des interfaces.

Il reçoit directement :

- Le présent cahier des charges.

- La Vignette 1.

- Le symbole officiel ZERO TIME.

- Les éventuelles références graphiques complémentaires.

Il doit produire les maquettes des différents écrans.

Il doit respecter les mécaniques et les règles définies dans le cahier des charges.

Il ne doit pas inventer de nouvelles fonctionnalités pour rendre une interface plus esthétique.

Les écrans validés doivent être exportés sous des formats exploitables par l'équipe de développement, notamment :

- HTML lorsque disponible.

- Images PNG.

- Référentiel graphique DESIGN.md.

### 20.4. Claude — Analyse technique et développement

Claude intervient comme responsable de la réalisation technique.

Il doit :

- Analyser le cahier des charges.

- Étudier les maquettes validées.

- Proposer l'architecture technique.

- Développer les fonctionnalités.

- Intégrer les interfaces.

- Mettre en œuvre les mécaniques.

- Écrire les tests.

- Corriger les anomalies.

- Préparer les versions jouables.

Claude ne doit pas réinterpréter librement les règles du jeu.

Il doit respecter les maquettes graphiques validées.

### 20.5. GitHub — Référentiel du code

Le code source doit être versionné dans un dépôt GitHub.

Les modifications doivent être traçables.

Les versions stables doivent pouvoir être retrouvées et restaurées.

Le dépôt constitue la référence du code, pas un second cahier des charges.

### 20.6. Règles de collaboration

Les responsabilités doivent rester distinctes :

| **Outil** | **Responsabilité principale** |
| --- | --- |
| ChatGPT | Pilotage, game design, cohérence et validation |
| Google Stitch | Maquettes, graphisme et UX |
| Claude | Architecture technique et développement |
| GitHub | Historique et versionnement du code |

Une modification d'une règle fonctionnelle doit être validée avant son intégration.

Une modification graphique importante doit être validée avant son intégration.

Aucune IA ne doit prendre seule une décision qui modifie une exigence structurante.

### 20.7. Simplicité d'utilisation

L'utilisateur ne doit pas avoir à manipuler directement le code.

Les consignes transmises aux outils doivent être explicites, découpées et accompagnées de critères d'acceptation.

Les étapes doivent être détaillées et adaptées à un utilisateur débutant.

### 20.8. Maîtrise des coûts

Les solutions doivent privilégier les offres gratuites disponibles.

L'utilisation d'API payantes, de services facturés à l'usage ou d'abonnements supplémentaires nécessite une validation préalable.

Le développement ne doit pas introduire de dépendance financière non maîtrisée.

## 21. Jalons de validation graphique

La conception graphique doit être validée progressivement.

Les maquettes doivent être produites dans Google Stitch à partir du présent cahier des charges et des références visuelles.

### G0 — Identité visuelle

Validation :

- Du nom ZERO TIME.

- Du symbole officiel.

- De la Vignette 1.

- De la palette.

- De l'ambiance générale.

- Des principes typographiques.

### G1 — Écran télévision (optionnel, après validation du MVP)

Validation de l'écran principal :

- Présentation de la bombe.

- Compte à rebours.

- Modules.

- États.

- Erreurs.

- Progression.

- Alertes.

### G2 — Interface opérateur

Validation de :

- La visualisation de la bombe.

- La manipulation des modules.

- Les interactions.

- Les retours visuels.

- L'ergonomie tactile.

### G3 — Interface technicien

Validation de :

- L'organisation du manuel.

- La navigation.

- La recherche.

- Les filtres.

- Les tableaux.

- Les arbres de décision.

- La consultation sur smartphone.

### G4 — Connexion et préparation

Validation de :

- La création d'une salle.

- Le code ou QR code.

- L'arrivée des joueurs.

- La répartition des rôles.

- Le lancement de la partie.

### G5 — États de jeu

Validation des écrans :

- Préparation.

- Bombe en cours.

- Module résolu.

- Erreur.

- Alerte temporelle.

- Bombe désamorcée.

- Explosion.

- Victoire finale.

- Défaite finale.

### G6 — Cohérence multi-écrans

Validation de la cohérence visuelle entre :

- Télévision (si utilisée).

- Smartphone opérateur.

- Smartphone technicien.

### G7 — Validation finale

Validation de l'ensemble des interfaces avant intégration complète.

Les maquettes approuvées deviennent la référence graphique de développement.

## 22. Critères d'acceptation

### 22.1. Expérience utilisateur

Le jeu doit être compréhensible rapidement.

Les joueurs doivent identifier leur rôle et leurs possibilités d'action.

La communication doit être nécessaire au bon déroulement de la partie.

Les interactions ne doivent pas générer de friction inutile.

### 22.2. Gameplay

Le système doit permettre :

- De créer une partie.

- De connecter les joueurs.

- De répartir les rôles.

- De lancer une bombe.

- De résoudre les modules.

- De déclencher des erreurs.

- D'appliquer les pénalités.

- De désamorcer une bombe.

- De passer à la suivante.

- De terminer une partie par une victoire ou une défaite.

### 22.3. Rejouabilité

Les configurations générées doivent être différentes.

Elles doivent rester cohérentes et résolubles.

Le système doit permettre d'ajouter des modules sans refonte majeure.

### 22.4. Technique

Le jeu doit fonctionner sur les appareils ciblés.

Les états doivent être synchronisés.

Le serveur doit rester l'autorité sur le déroulement de la partie.

Les déconnexions ne doivent pas provoquer de corruption de l'état du jeu.

Les pénalités ne doivent pas être appliquées plusieurs fois pour une même erreur.

### 22.5. Graphisme

Les interfaces doivent respecter la direction artistique validée.

Les informations essentielles doivent rester lisibles.

Lorsqu'elle est utilisée, la télévision doit être exploitable à plusieurs mètres.

Les interfaces mobiles doivent être adaptées à une utilisation tactile.

Les différents écrans doivent former un ensemble cohérent.

### 22.6. Génération

Le générateur doit produire des configurations valides.

Les règles doivent être cohérentes.

Les solutions doivent être vérifiables.

Les configurations impossibles ou bloquées doivent être rejetées.

### 22.7. Validation du MVP

Le MVP est accepté lorsqu'un groupe de 2 à 4 joueurs (une équipe) peut :

- Créer une salle.

- Rejoindre la partie.

- Comprendre les rôles.

- Jouer les trois bombes.

- Communiquer pour résoudre les modules.

- Subir les pénalités prévues.

- Terminer la partie.

- Obtenir un résultat final cohérent.

## 23. Principes directeurs non négociables

Les principes suivants doivent guider toutes les décisions de conception et de développement.

- **La coopération est au cœur du jeu.** Les joueurs doivent avoir besoin les uns des autres.

- **L'asymétrie de l'information est fondamentale.** L'opérateur et les techniciens ne disposent pas des mêmes informations.

- **La communication est une mécanique de jeu.** Elle ne doit pas être remplacée par une automatisation qui supprimerait les échanges.

- **Le temps crée la tension.** Le compte à rebours doit être central dans l'expérience.

- **Les erreurs ont des conséquences.** Le système de pénalités doit rester cohérent et prévisible.

- **Les interactions doivent rester simples.** La difficulté vient des énigmes, pas de l'interface.

- **Le jeu doit être accessible.** Des joueurs occasionnels doivent pouvoir participer.

- **La rejouabilité doit être intégrée dès la conception.** Elle ne doit pas dépendre uniquement de contenus ajoutés plus tard.

- **La génération ne doit jamais produire une bombe impossible.**

- **Les règles doivent être séparées du moteur.** L'ajout de modules ne doit pas nécessiter une réécriture générale.

- **Le serveur est l'autorité du jeu.** Les clients ne décident pas seuls de l'état d'une partie.

- **La synchronisation est essentielle.** Tous les écrans doivent refléter le même état.

- **La résilience réseau doit être prévue.** Une déconnexion ne doit pas compromettre inutilement une partie.

- **La simplicité technique est privilégiée.** Ne pas ajouter de complexité sans bénéfice réel.

- **Les coûts doivent être maîtrisés.** Pas de service payant non validé.

- **L'identité graphique doit rester cohérente.** Les maquettes validées constituent la référence visuelle.

- **Les décisions structurantes ne doivent pas être modifiées silencieusement.** Toute évolution doit être explicitement validée.

- **Le plaisir de jeu prime sur la sophistication technique.** Le Jalon 0 doit vérifier l'intérêt réel du concept avant d'investir dans une architecture complexe.

## 24. Définition du succès

ZERO TIME sera considéré comme réussi si le jeu remplit les conditions suivantes.

### 24.1. Succès ludique

Les joueurs prennent plaisir à jouer ensemble.

Ils communiquent naturellement.

Ils ressentent une tension liée au temps.

Ils comprennent que leur réussite dépend de leur coopération.

Ils ont envie de recommencer une partie.

### 24.2. Succès fonctionnel

Le jeu permet de lancer et de terminer une partie complète.

Les interfaces remplissent correctement leurs fonctions.

Les mécaniques sont compréhensibles et fiables.

Les erreurs et les pénalités sont correctement gérées.

### 24.3. Succès technique

Le jeu fonctionne sur les appareils prévus.

Les échanges sont synchronisés.

Les déconnexions sont gérées.

Les configurations générées sont valides.

Le système peut évoluer sans devoir être reconstruit à chaque ajout de contenu.

### 24.4. Succès dans la durée

Le jeu conserve son intérêt grâce à la génération procédurale.

Le catalogue peut s'enrichir.

De nouveaux modes peuvent être ajoutés.

Les évolutions restent compatibles avec les fondations initiales.

### 24.5. Succès du projet

Le projet doit aboutir à un jeu réellement utilisable, maintenable et évolutif, sans dépendance technique ou financière disproportionnée.

Le résultat attendu n'est pas une démonstration technique, mais une expérience de jeu aboutie, amusante et rejouable.

## Synthèse des décisions structurantes

| **Sujet** | **Décision retenue** |
| --- | --- |
| Nom du jeu | ZERO TIME |
| Concept | Jeu coopératif de désamorçage |
| Nombre de joueurs | 2 à 4 par équipe |
| Support | PWA |
| Écran optionnel | Télévision (spectateur, lecture seule, après le MVP) |
| Interfaces individuelles | Smartphones |
| Rôles | Opérateur et techniciens |
| Mode initial | Coopératif |
| Structure d'une partie | 3 bombes successives |
| Durée cible | 15 à 25 minutes |
| Durée d'une bombe | 2 à 4 minutes |
| Modules initiaux | Fils, Code PIN, Symboles |
| Prototype fondateur | Fils, 2 joueurs, 3 minutes |
| Première erreur | -20 secondes |
| Deuxième erreur | -30 secondes supplémentaires |
| Troisième erreur | Explosion immédiate |
| Génération | Procédurale, contrôlée et reproductible |
| Manuel | Fragmenté entre les techniciens |
| Direction graphique | Vignette 1 comme référence principale |
| Symbole | Zéro blanc lumineux dans un anneau orange-doré |
| Conception graphique | Google Stitch |
| Développement | Claude |
| Pilotage et validation | ChatGPT |
| Versionnement | GitHub |
| Priorité | Valider le plaisir de jeu avant la sophistication technique |
| Coûts | Privilégier les solutions gratuites |

## Règles de référence pour la suite du projet

- Ce document est le cahier des charges maître de ZERO TIME.

- Google Stitch travaille directement à partir de ce document et des références graphiques.

- Claude travaille à partir de ce document et des maquettes validées.

- ChatGPT assure le suivi fonctionnel, le game design et la validation.

- Aucune règle fonctionnelle ne doit être modifiée sans validation.

- Le Jalon 0 doit être réalisé avant le développement complet du générateur procédural.

- Le MVP conserve son périmètre complet : trois modules initiaux, trois bombes et une partie jouable de bout en bout.

- Les évolutions futures ne doivent pas compliquer inutilement le MVP.

**Précision :** cette V6.0 est une reconstruction consolidée à partir du contenu V5.1 disponible dans nos échanges et des décisions ultérieures. Ce n'est pas une reproduction mot à mot de chaque paragraphe original. Le code couleur vert indiqué dans les éléments récupérés était incomplet (#42C) : il devra être vérifié sur la référence graphique, plutôt que considéré comme une valeur hexadécimale valide.

---

# Partie B — Procédure détaillée de mise en œuvre

**ZERO TIME**

**PROCÉDURE DÉTAILLÉE DE MISE EN ŒUVRE**

Guide pas à pas — pilotage depuis un smartphone Android

Version 1.0 — 17 novembre 2026

## Avant de commencer

Ce guide décrit l’ordre d’exécution. Il ne faut pas tout faire d’un coup. Chaque phase possède un résultat attendu et un point de contrôle. Le cahier des charges maître est la référence pour le contenu ; ce document explique comment le mettre en œuvre.

Rôle des outils : ChatGPT = cadrage et contrôle ; Stitch = maquettes ; Claude = analyse et développement ; GitHub = code et historique ; Google Drive = documents et exports.

| **Règle de pilotage**          | **Application**                                                     |
|--------------------------------|---------------------------------------------------------------------|
| Une étape à la fois            | Ne pas lancer la phase suivante avant validation de la précédente.  |
| Pas d’invention                | Claude doit signaler les règles manquantes au lieu de les imaginer. |
| Pas de dépense surprise        | Aucun service payant, API ou dépassement de quota sans validation.  |
| Pas de gros chantier d’un coup | Faire construire et tester le prototype avant les extensions.       |
| Tout garder traçable           | Documents dans Drive, code dans GitHub, décisions écrites.          |
| Le plaisir de jeu d’abord      | Pas de maquettes Stitch ni de générateur avant la validation du plaisir de jeu (Jalon 0). |

## Phase 1 — Préparer l’espace de travail

### Étape 1.1 — Préparer les accès sur le smartphone

1.  Ouvrir Chrome sur le smartphone Android.

2.  Se connecter au compte Google qui servira pour Drive et Stitch.

3.  Se connecter au compte Claude Pro.

4.  Se connecter à GitHub ou créer un compte si nécessaire.

5.  Vérifier que les sites s’ouvrent correctement. Si une interface est mal adaptée au téléphone, utiliser le menu Chrome puis « Version pour ordinateur ».

6.  Ne pas installer d’outil de développement local : le développement sera piloté via l’environnement cloud proposé par Claude, si disponible dans le compte.

### Étape 1.2 — Créer le dossier Drive

7.  Dans Google Drive, créer un dossier nommé ZERO TIME.

8.  Créer à l’intérieur : 01_CADRAGE ; 02_DESIGN ; 03_TECHNIQUE ; 04_DEVELOPPEMENT ; 05_TESTS ; 06_EXPORTS.

9.  Enregistrer le Cahier des charges maître dans 01_CADRAGE.

10. Enregistrer ce guide dans 01_CADRAGE.

11. Enregistrer le visuel du zéro lumineux et la vignette 1 dans 02_DESIGN.

12. Conserver les anciennes versions du cahier des charges dans un sous-dossier ARCHIVES ; ne pas les écraser.

### Point de contrôle 1

Tu dois avoir un dossier ZERO TIME avec deux documents de référence et les deux références visuelles. À ce stade, aucun code n’est à écrire.

## Phase 2 — Finaliser les règles du prototype

### Étape 2.1 — Créer la spécification MVP

13. Créer dans 01_CADRAGE un document nommé SPECIFICATION_MVP_FILS_V1.

14. Reprendre du cahier des charges le périmètre : deux joueurs, une mission, module Fils, trois minutes comme scénario de test.

15. Écrire exactement ce que l’opérateur voit sur son smartphone.

16. Écrire exactement ce que le technicien voit dans le manuel.

17. Préciser que la télévision n’est pas utilisée dans le prototype : le chronomètre, les erreurs et les alertes sont affichés sur les smartphones.

18. Décrire le module Fils : nombre de fils, couleurs/motifs, position, règle de décision et action attendue.

19. Ajouter plusieurs exemples de configurations avec la bonne réponse expliquée : 5 à 10 configurations écrites à la main, qui serviront de configurations fixes du prototype.

20. Définir ce qui compte comme erreur et le retour affiché.

21. Définir le comportement lorsque le temps arrive à zéro.

22. Définir ce qui se passe si l’un des deux joueurs perd la connexion.

23. Marquer les points non arbitrés « À DÉFINIR » ; ne pas laisser Claude les décider.

### Étape 2.2 — Faire relire la spécification

Prompt à envoyer à ChatGPT :

« Relis cette spécification du prototype ZERO TIME. Vérifie uniquement la cohérence, les contradictions, les règles manquantes et les cas impossibles à tester. Ne complète pas les règles à ma place. Classe les problèmes par bloquant, important et secondaire. »

### Point de contrôle 2

La spécification doit permettre à deux personnes de jouer le prototype sans devoir inventer une règle pendant la partie.

## Phase 3 — Créer le dépôt GitHub

24. Ouvrir GitHub et créer un dépôt nommé zero-time.

25. Choisir le dépôt privé pour le développement initial.

26. Initialiser avec un README.

27. Ne pas déposer de mots de passe, clés API ou secrets dans le dépôt.

28. Conserver le lien du dépôt dans le dossier Drive, fichier LIENS_PROJET.

### Point de contrôle 3

Le dépôt existe, il est privé et son accès est maîtrisé.

## Phase 4 — Faire analyser l’architecture par Claude

### Étape 4.1 — Connecter Claude au dépôt

29. Ouvrir Claude et accéder à l’environnement Claude Code/cloud disponible dans le compte.

30. Autoriser l’accès uniquement au dépôt zero-time, si le mécanisme le permet.

31. Fournir le cahier des charges maître et la spécification MVP.

32. Demander une analyse sans modification de fichiers.

### Étape 4.2 — Prompt d’analyse sans développement

« Tu interviens comme architecte logiciel du projet ZERO TIME. Lis les documents et les maquettes disponibles. Pour l’instant, ne crée, ne modifie et ne supprime aucun fichier. Ne commence aucun développement. Produis : 1) résumé des exigences ; 2) liste des ambiguïtés et décisions manquantes ; 3) deux ou trois architectures possibles, toutes hébergées en ligne comme Dé-lire (§14.5 du cahier) ; 4) comparaison des coûts, quotas gratuits et limites ; 5) solution recommandée pour synchroniser les smartphones (et la télévision, en option) ; 6) gestion des rôles et de la confidentialité des informations ; 7) risques ; 8) plan de réalisation par étapes. N’invente aucune règle de jeu. N’engage aucun service payant. Signale les limites de ton analyse. »

### Étape 4.3 — Décider

Lire l’analyse. Vérifier les coûts récurrents, limites gratuites, contraintes de temps réel, compatibilité mobile (et TV, en option) et facilité de maintenance. Ne valider aucune architecture si les coûts ou limites ne sont pas compris. Enregistrer la décision dans 03_TECHNIQUE/DECISION_ARCHITECTURE_V1.

### Point de contrôle 4

Aucun développement ne commence tant que l’architecture, les coûts et le mode de synchronisation ne sont pas compris et acceptés.

## Phase 5 — Développer le prototype par petits lots

### Étape 5.1 — Ordre de développement

Le prototype a une interface volontairement simple, sans maquettes Stitch, et des configurations Fils écrites à la main (cahier §18.2).

| **Lot** | **À faire**                                          | **Test de sortie**                                         |
|---------|------------------------------------------------------|------------------------------------------------------------|
| 1       | Structure de l’application et lancement des clients. | Les écrans de base s’ouvrent sur les appareils cibles.     |
| 2       | Création et entrée dans une session.                 | Deux smartphones rejoignent la même session.               |
| 3       | Rôles opérateur et technicien.                       | Les rôles et permissions sont corrects.                    |
| 4       | État partagé entre smartphones (TV optionnelle).     | Les interfaces utilisées affichent le même état.           |
| 5       | Chronomètre et gestion des erreurs.                  | Les valeurs et pénalités suivent les règles spécifiées.    |
| 6       | Configurations fixes du module Fils (écrites à la main) et validation de la réponse. | Chaque configuration fixe est résoluble et la bonne réponse est reconnue. |
| 7       | Actions du module Fils.                              | L’opérateur peut effectuer le parcours complet.            |
| 8       | Manuel technicien.                                   | Le technicien peut trouver la règle et guider l’opérateur. |
| 9       | Résultat réussite/échec.                             | La mission se termine correctement.                        |
| 10      | Déconnexion/reconnexion.                             | La partie reprend sans incohérence ni action doublée.      |

### Étape 5.2 — Prompt type pour chaque lot

« Objectif de cette tâche : \[indiquer un seul lot\]. Lis d’abord le cahier des charges, la décision d’architecture et le code existant. Avant de modifier quoi que ce soit, explique les fichiers concernés et le plan de changement. N’élargis pas le périmètre. Ne change pas les règles validées. N’ajoute aucune dépendance ou dépense sans autorisation. Après validation du plan, réalise uniquement cette tâche, exécute les tests pertinents et fournis : fichiers modifiés, tests réellement exécutés, résultats, limites et prochaine étape proposée. »

### Étape 5.3 — À chaque fin de lot

33. Lire le résumé de Claude.

34. Vérifier les changements dans le dépôt.

35. Exécuter ou demander les tests annoncés.

36. Tester sur les appareils si le lot modifie le comportement visible.

37. Faire corriger les anomalies avant de passer au lot suivant.

38. Enregistrer une version stable dans GitHub.

### Point de contrôle 5

Le prototype est jouable de bout en bout, avec une interface volontairement simple : connexion, rôles, manuel, manipulation, validation, chronomètre et résultat.

## Phase 6 — Tester avec les appareils réels

### Étape 6.1 — Préparer

- (Optionnel) Télévision ou grand écran avec navigateur compatible.

- Smartphone 1 : opérateur.

- Smartphone 2 : technicien.

- Réseau Wi-Fi stable.

### Étape 6.2 — Test nominal

39. (Optionnel) Ouvrir ZERO TIME sur la télévision.

40. Créer une session.

41. Rejoindre avec le smartphone opérateur.

42. Rejoindre avec le smartphone technicien.

43. Vérifier les rôles.

44. Lancer la mission.

45. Faire décrire les fils par l’opérateur.

46. Faire consulter la règle au technicien.

47. Faire guider l’opérateur et réaliser la bonne action.

48. Vérifier que les écrans utilisés sont synchronisés.

49. Terminer la mission et vérifier le résultat.

### Étape 6.3 — Tests d’erreur

50. Effectuer une mauvaise action et vérifier la pénalité.

51. Répéter jusqu’au seuil d’échec et vérifier la règle.

52. Laisser le temps arriver à zéro.

53. Couper le Wi-Fi d’un téléphone puis le rétablir.

54. Fermer puis rouvrir le navigateur.

55. Actualiser une page pendant la mission.

56. Envoyer deux actions rapprochées et vérifier qu’elles ne sont pas traitées deux fois.

57. Faire quitter un joueur et vérifier le comportement prévu.

### Étape 6.4 — Consigner un bug

| **Champ** | **Exemple de contenu**                            |
|-----------|---------------------------------------------------|
| ID        | BUG-001                                           |
| Version   | Commit ou version testée                          |
| Appareil  | TV / smartphone opérateur / smartphone technicien |
| Étapes    | Actions précises pour reproduire                  |
| Attendu   | Ce que le cahier des charges prévoit              |
| Observé   | Ce qui s’est réellement passé                     |
| Gravité   | Bloquant / majeur / mineur                        |
| Preuve    | Capture ou courte vidéo                           |

### Étape 6.5 — Valider le plaisir de jeu (Jalon 0)

58. Faire jouer le prototype lors d’une soirée ou d’un apéritif, avec plusieurs parties et plusieurs paires de joueurs.

59. Observer la compréhension des rôles, la qualité des échanges, la nécessité de communiquer, la tension générée par le temps, la compréhension du manuel, le plaisir ressenti et les frustrations éventuelles (cahier §18.5).

60. Noter les observations dans 05_TESTS.

61. Décider si le Jalon 0 est validé : le mécanisme central provoque naturellement des échanges et une coopération réelle (cahier §18.6). Consigner la décision dans 05_TESTS.

### Point de contrôle 6

Aucun bug bloquant ne doit rester avant d’élargir le périmètre. Le plaisir de jeu doit être validé (Jalon 0) avant de lancer la conception des maquettes, le générateur ou toute extension.

## Phase 7 — Concevoir les interfaces dans Google Stitch

Cette phase ne démarre qu’après la validation du plaisir de jeu (Jalon 0).

### Étape 7.1 — Créer le projet

62. Ouvrir Google Stitch dans Chrome.

63. Créer un projet nommé ZERO TIME.

64. Importer le visuel du zéro lumineux fourni et la vignette 1 retenue, si Stitch permet l’import.

65. Ajouter le cahier des charges maître et la spécification MVP comme références si l’interface le permet.

66. Préciser que le zéro blanc lumineux entouré d’un anneau orange-doré sur fond noir est le symbole de marque ; la vignette 1 est la référence de style des interfaces.

### Étape 7.2 — Concevoir dans cet ordre

| **Ordre** | **Maquette**            | **Ce qu’elle doit montrer**                                      |
|-----------|-------------------------|------------------------------------------------------------------|
| 1         | OP03 — Opérateur / Fils | Fils clairement différenciés, interactions tactiles, validation. |
| 2         | TE04 — Manuel / Fils    | Règle et tableau de décision lisibles rapidement.                |
| 3         | TV05 — Mission en cours (optionnel) | Chronomètre dominant, dispositif, erreurs, progression. |
| 4         | TV03 — Salle d’attente (optionnel)  | Code de session, joueurs, rôles et connexions.          |
| 5         | TV06 — Résultat mission (optionnel) | Réussite/échec, temps, erreurs et suite.                |
| 6         | TV01 — Accueil (optionnel) | Identité ZERO TIME et entrée dans le jeu.                    |

Les maquettes TV sont optionnelles : elles ne sont conçues qu’après la validation du prototype.

### Étape 7.3 — Prompt Stitch de départ

Ce prompt concerne l’écran TV05, optionnel : à utiliser après la validation de OP03 et TE04.

« Crée l’écran TV05 du jeu ZERO TIME à partir des références fournies. Identité : fond noir, zéro blanc lumineux dans un anneau énergétique orange-doré, particules lumineuses. Ambiance technologique et tendue. La télévision est regardée à plusieurs mètres : le compte à rebours doit être immédiatement lisible, les informations doivent être hiérarchisées et le texte limité. Affiche le dispositif, le temps, les erreurs restantes et la progression. N’invente aucune règle ou fonction non présente dans la spécification. Ne conçois que cet écran pour le moment. »

### Étape 7.4 — Valider chaque maquette

67. Vérifier la lisibilité à distance pour l’écran TV, uniquement si cet écran optionnel est conçu.

68. Vérifier la taille des boutons sur smartphone.

69. Vérifier que les informations de l’opérateur et du technicien sont bien séparées.

70. Vérifier les états erreur, réussite, attente et déconnexion.

71. Demander des corrections ciblées, pas une refonte complète à chaque fois.

72. Exporter les maquettes ou captures validées dans 02_DESIGN.

### Point de contrôle 7

Les deux maquettes principales — opérateur Fils, manuel Fils — doivent être validées avant de commencer l’intégration graphique. Les maquettes TV sont optionnelles.

## Phase 8 — Intégrer les maquettes validées

### Étape 8.1 — Lot d’intégration graphique

| **Lot** | **À faire**                  | **Test de sortie**                        |
|---------|------------------------------|-------------------------------------------|
| 11      | Intégration graphique Stitch. | Le rendu respecte les maquettes validées. |

Utiliser le prompt type de l’étape 5.2 pour ce lot, puis appliquer les vérifications de fin de lot de l’étape 5.3.

### Point de contrôle 8

Le rendu respecte les maquettes validées sur les appareils ciblés, et une version stable est enregistrée dans GitHub.

## Phase 9 — Étendre le jeu

73. Ajouter le générateur et le validateur du module Fils, en remplacement des configurations fixes du prototype : chaque configuration générée doit être résoluble (test automatique sur plusieurs milliers de seeds).

74. Ajouter le module PIN avec sa spécification, ses cas limites et ses tests de génération.

75. Valider PIN indépendamment avant intégration à une partie complète.

76. Ajouter le module Symboles de la même manière.

77. Répartir le manuel entre les techniciens : 1 technicien = 1 module du manuel ; avec un seul technicien, il détient l’ensemble du manuel.

78. À DÉFINIR : rotation de l’opérateur avec 4 joueurs. Avec 3 bombes, un joueur sur 4 n’est jamais opérateur ; choisir entre 4 bombes à 4 joueurs et une rotation sur 3 joueurs (à 2 joueurs : A, B, A). Ne pas laisser Claude décider.

79. Ajouter plusieurs missions par partie et la rotation des opérateurs.

80. Tester les configurations de 2 à 4 joueurs (une équipe).

81. Ajouter les niveaux de difficulté et vérifier leur équilibre.

82. Ajouter, si souhaité, l’écran télévision optionnel (spectateur en lecture seule) à partir des maquettes TV conçues dans Stitch.

83. Ajouter sons, animations et effets après stabilisation du gameplay.

84. Préparer des contenus supplémentaires sans modifier le moteur central.

## Phase 10 — Déployer et maintenir

85. Créer un environnement de test distinct de la version stable.

86. Déployer une version de test et la vérifier sur les appareils cibles.

87. Documenter l’URL et la procédure d’accès.

88. Vérifier les limites gratuites et les éventuels coûts réels avant ouverture à d’autres joueurs.

89. Prévoir une procédure de retour à la dernière version stable.

90. Documenter comment publier une mise à jour.

91. Surveiller les erreurs techniques et les retours de test.

## Checklist de progression

| **Phase**        | **Livrable attendu**           | **Terminé quand…**                        |
|------------------|--------------------------------|-------------------------------------------|
| 1\. Préparation  | Dossier Drive et références    | Tous les éléments sont rangés.            |
| 2\. Règles MVP   | Spécification Fils             | Le prototype est jouable sans improviser. |
| 3\. GitHub       | Dépôt privé                    | Dépôt créé et accès contrôlé.             |
| 4\. Architecture | Décision technique             | Coûts et limites sont compris.            |
| 5\. Prototype    | Version jouable (interface simple) | Parcours complet fonctionne.          |
| 6\. Tests        | Rapport de test et validation du plaisir de jeu | Aucun défaut bloquant et le jeu fait naturellement communiquer les joueurs. |
| 7\. Stitch       | Deux maquettes principales     | Opérateur et technicien sont validés (TV optionnelle). |
| 8\. Intégration graphique | Interface aux maquettes validées | Le rendu respecte les maquettes validées. |
| 9\. Extensions   | Générateur, PIN, Symboles, partie complète | Chaque ajout est testé.       |
| 10\. Déploiement | Version stable                 | Accès et mise à jour documentés.          |

## Règles à ne jamais laisser Claude enfreindre

- Ne pas inventer une règle absente du cahier des charges.

- Ne pas remplacer une technologie ou une architecture validée sans expliquer et demander accord.

- Ne pas engager de service payant.

- Ne pas réécrire tout le projet pour corriger un défaut local.

- Ne pas supprimer de fonctionnalité existante sans validation.

- Ne pas déclarer un test réussi s’il n’a pas été exécuté.

- Ne pas intégrer les solutions secrètes dans les données accessibles à tous les clients.

- Ne pas passer à l’étape suivante tant que le test de sortie de l’étape courante échoue.

## Glossaire simple

| **Terme**              | **Explication**                                               |
|------------------------|---------------------------------------------------------------|
| Maquette               | Image ou prototype visuel d’un écran.                         |
| Frontend               | Partie affichée sur la télévision ou le smartphone.           |
| Backend                | Service qui gère les sessions et l’état partagé.              |
| Synchronisation        | Mécanisme qui maintient les appareils au même état.           |
| Graine aléatoire       | Valeur permettant de reproduire une génération.               |
| Génération procédurale | Création automatique de puzzles à partir de règles.           |
| PWA                    | Application web pouvant être installée comme une application. |
| Dépôt GitHub           | Espace de stockage du code avec historique des versions.      |
| Commit                 | Version enregistrée des modifications du code.                |
