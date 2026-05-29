Je travaille sur un projet Node.js + Express + Sequelize + PostgreSQL nommé StudySync.

IMPORTANT :
Je vais te fournir deux types de fichiers :

1. Un gros fichier de documentation [PLAN.md] (~1100 lignes)
   Ce fichier contient :

* toute l’architecture du projet
* les détails techniques
* la logique métier
* les tâches des membres
* les endpoints
* les rôles
* les relations
* les workflows
* les décisions techniques

Ce fichier sert UNIQUEMENT comme contexte global et référence d’analyse.

TU NE DOIS PAS :

* régénérer ce fichier
* recopier son contenu
* créer tout ce qu’il contient
* modifier l’architecture globale sans raison

TU DOIS :

* le consulter quand il manque du contexte
* l’utiliser pour comprendre la structure du projet
* vérifier les relations et dépendances
* comprendre les conventions déjà utilisées
* éviter les incohérences avec le reste du projet

2. Un fichier SQL
   Ce fichier contient :

* le schéma PostgreSQL
* les relations
* les contraintes
* les données de test

IMPORTANT :
Les modèles suivants existent déjà dans mon projet :

* User
* StudySession

NE PAS :

* recréer ces modèles
* modifier leur structure
* générer des migrations pour eux

Je suis responsable du membre 4 :

* ratings
* reports
* admin moderation
* admin actions

Ta mission :

1. Lire le fichier SQL et identifier UNIQUEMENT les éléments liés au membre 4.

2. Utiliser le fichier de documentation UNIQUEMENT comme support d’analyse et compréhension du projet.

3. Générer uniquement les modèles Sequelize manquants :

* Rating
* Report
* AdminAction
* Message uniquement si nécessaire pour les relations

4. Générer :

* associations Sequelize
* belongsTo
* hasMany
* alias `as`
* foreign keys
* validations
* ENUM
* timestamps

5. Réutiliser les modèles existants :

```js
const User = require('./User');
const StudySession = require('./StudySession');
```

6. Respecter exactement :

* la structure SQL
* les contraintes
* les UUID
* les relations
* les conventions déjà présentes dans le projet

7. Générer aussi :

* seeders Sequelize uniquement pour les tables du membre 4
* basés sur les données de test SQL

8. Générer :

* src/models/
* src/seeders/
* src/models/associations.js

9. Si tu rencontres un blocage ou un manque de contexte :

* consulter d’abord le fichier de documentation
* comprendre l’architecture existante
* vérifier les dépendances et conventions
* puis continuer l’implémentation

10. Ne jamais générer des parties hors scope du membre 4.

11. Ne pas générer :

* architecture enterprise complexe
* code inutile
* services inutiles
* repositories
* patterns excessifs

Objectif :
ajouter proprement uniquement les fonctionnalités liées au membre 4 tout en restant cohérent avec l’architecture globale du projet.
