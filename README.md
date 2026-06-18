# Breezy - Réseau Social Léger & Scalable (Twitter/X Clone)

## 📝 Description du Projet

Le projet **Breezy** vise à développer un réseau social léger, réactif et hautement scalable, fortement inspiré de Twitter/X, mais optimisé spécifiquement pour des environnements à faibles ressources. L’objectif principal est de garantir une expérience utilisateur rapide, fluide et adaptative (approche mobile-first) tout en maintenant une architecture back-end robuste et découpée en microservices conteneurisés.

---

## 🏗️ Architecture Globale & Stack Technique

L'application repose sur une architecture distribuée en microservices, orchestrée par Docker et segmentée pour isoler les responsabilités.

### 🛠️ Stack Technique Complète

* **Environnement Client :** Navigateur Web / Web App géré via React Router.
* **Front-end :** Next.js / React.js, Tailwind CSS, Axios (appels API REST avec injection du store JWT).
* **API Gateway / Proxy Inverse :** Nginx (Gestion du routage, du SSL et des politiques CORS).
* **Back-end (Microservices) :** Node.js & Express.js.
* **Sécurisation :** Authentification par Jetons JWT (JSON Web Tokens).
* **Bases de données & Persistance :**
* **SGBDR (Relationnel) :** PostgreSQL couplé à l'ORM **Sequelize** (pour les données critiques nécessitant une forte intégrité transactionnelle).
* **NoSQL (Orienté Documents) :** MongoDB couplé à l'ODM **Mongoose** (pour la haute performance en lecture/écriture sur les flux de messages et logs).
* **Stockage de fichiers :** Volume Docker persistant dédié aux fichiers bruts multimédias.


* **Conteneurisation & Performance :** Docker & Docker Compose.

### 📊 Schéma Architectural (Code Mermaid.js)

Tu peux visualiser ou restituer l'architecture complète du projet grâce au code Mermaid suivant :

```mermaid
graph TD
    subgraph Client ["Environnement Client - Mobile First"]
        Nav["Navigateur Web / Web App <br>(React Router)"]
    end

    subgraph Infrastructure ["Conteneurs Docker"]

        Nginx["Nginx / API Gateway <br>(Reverse Proxy, CORS)"]

        subgraph Frontend ["Front-end"]
            NextReact["Application Next.js / React.js <br>(Tailwind CSS, Axios, JWT Store)"]
        end

        subgraph Backend ["Back-end - Microservices Node.js / Express"]
            AuthService["Service d'Authentification <br>(Création Fx1, Login Fx2, Sécurisation JWT)"]
            UserService["Service Utilisateurs <br>(Profils Fx10, Abonnements Fx9, Langue Fx22, Thème Fx23)"]
            PostService["Service de Messages <br>(Posts Fx3-Fx4, Feed Fx5, Likes Fx6, Réponses Fx7-Fx8)"]
            TagService["Service de Recherche & Tags <br>(Ajout Fx12, Recherche Fx13)"]
            NotificationService["Service de Notifications <br>(Mentions Fx14, Likes Fx15, Followers Fx16)"]
            DMService["Service de Messagerie <br>(Messages Privés Fx17)"]
            MediaService["Service Médias <br>(Upload Images Fx18, Vidéos Fx19)"]
            ModerationService["Service de Modération <br>(Signalements Fx20, Bannissements Fx21)"]
        end

        subgraph Databases ["Bases de données & Stockage"]
            PG[("PostgreSQL <br>+ Sequelize<br>(Comptes, Auth, Relations, Rôles)")]
            Mongo[("MongoDB <br>+ Mongoose<br>(Posts, Commentaires, Tags, DMs, Notifications)")]
            Storage[("Volume de Stockage<br>(Fichiers Médias)")]
        end
    end

    Nav -->|"Requêtes HTTP/HTTPS"| Nginx
    Nginx -->|"Sert l'interface UI"| NextReact
    NextReact -->|"Appels API REST (Axios avec JWT)"| Nginx

    Nginx -->|"Routage /api/auth"| AuthService
    Nginx -->|"Routage /api/users"| UserService
    Nginx -->|"Routage /api/posts"| PostService
    Nginx -->|"Routage /api/tags"| TagService
    Nginx -->|"Routage /api/notifications"| NotificationService
    Nginx -->|"Routage /api/dms"| DMService
    Nginx -->|"Routage /api/media"| MediaService
    Nginx -->|"Routage /api/moderation"| ModerationService

    AuthService -.->|"Lecture/Écriture Sécurisée"| PG
    UserService -.->|"Gestion Profils & Followers"| PG
    ModerationService -.->|"Mise à jour Statuts (Bans)"| PG

    PostService -.->|"Stockage Documents (Posts, Feed)"| Mongo
    TagService -.->|"Indexation des Tags"| Mongo
    NotificationService -.->|"Logs de Notifications"| Mongo
    DMService -.->|"Historique des Conversations"| Mongo
    ModerationService -.->|"Lecture/Signalement des Posts"| Mongo

    MediaService -.->|"Métadonnées (URL, Poids)"| Mongo
    MediaService -.->|"Fichiers bruts (Uploads)"| Storage

```

---

## 🎯 Spécifications Fonctionnelles & Matrice des Rôles

Le système implémente 23 fonctionnalités réparties en fonctionnalités primaires (obligatoires) et secondaires (optionnelles), régies par une matrice de permissions stricte.

### 🔐 Rôles Utilisateurs

1. **Visiteur :** Utilisateur non authentifié.
2. **Utilisateur :** Membre standard authentifié.
3. **Modérateur :** Membre chargé de veiller au respect des règles communautaires.
4. **Administrateur :** Pouvoirs totaux sur la configuration, la modération et la gestion système.

### 📊 Tableau des Fonctionnalités et Permissions

| Fonctionnalité (Fx) | Visiteur | Utilisateur | Modérateur | Administrateur |
| --- | --- | --- | --- | --- |
| **Fx1.** Création de comptes utilisateurs avec validation | ✅ | ❌ | ❌ | ✅ |
| **Fx2.** Authentification sécurisée (JWT) | ❌ | ✅ | ✅ | ✅ |
| **Fx3.** Publication de messages courts (max 280 caractères) | ❌ | ✅ | ✅ | ✅ |
| **Fx4.** Affichage des messages sur le profil | ❌ | ✅ *(Le sien)* | ✅ | ✅ |
| **Fx5.** Flux chronologique des messages des utilisateurs suivis | ❌ | ✅ | ✅ | ✅ |
| **Fx6.** Liker un post | ❌ | ✅ | ✅ | ✅ |
| **Fx7.** Répondre à un post sous forme de commentaire | ❌ | ✅ | ✅ | ✅ |
| **Fx8.** Répondre à un commentaire sur un post | ❌ | ✅ | ✅ | ✅ |
| **Fx9.** Suivre ou être suivi par d'autres utilisateurs | ❌ | ✅ | ✅ | ✅ |
| **Fx10.** Profil utilisateur avec informations de base | ❌ | ✅ | ✅ | ✅ |
| **Fx11.** Liste des messages publiés par l'utilisateur sur le profil | ❌ | ✅ | ✅ | ✅ |
| **Fx12.** Ajout de tags aux messages | ❌ | ✅ | ✅ | ✅ |
| **Fx13.** Recherche de posts via des tags | ❌ | ✅ | ✅ | ✅ |
| **Fx14.** Notifications pour les mentions | ❌ | ✅ | ✅ *(Mod)* | ✅ *(Admin)* |
| **Fx15.** Notifications pour les likes | ❌ | ✅ | ❌ | ❌ |
| **Fx16.** Notifications pour les nouveaux followers | ❌ | ✅ | ❌ | ❌ |
| **Fx17.** Système de messages privés entre utilisateurs | ❌ | ✅ | ✅ | ✅ |
| **Fx18.** Ajout d’images aux messages | ❌ | ✅ | ✅ | ✅ |
| **Fx19.** Ajout de vidéos aux messages | ❌ | ✅ | ✅ | ✅ |
| **Fx20.** Signalement de contenu inapproprié | ❌ | ✅ | ✅ | ✅ |
| **Fx21.** Suspension ou bannissement des utilisateurs | ❌ | ❌ | ✅ | ✅ |
| **Fx22.** Interface multi-langues | ❌ | ✅ | ✅ | ✅ |
| **Fx23.** Thème personnalisé (Sombre/Clair) | ✅ | ✅ | ✅ | ✅ |

---

## 💾 Architecture des Bases de Données (Spécifique Back-End)

Pour optimiser les ressources, les données sont stratégiquement réparties entre deux moteurs de base de données.

### 1. PostgreSQL (via Sequelize) - Données Relationnelles & Critiques

* **Table `Users` :** `id` (PK), `username`, `email`, `password_hash`, `role` (enum: user, moderator, admin), `is_validated`, `created_at`, `updated_at`.
* **Table `Profiles` :** `id` (PK), `user_id` (FK -> Users), `display_name`, `bio` (text), `avatar_url`, `language_preference`, `theme_preference`.
* **Table `Followers` :** `id` (PK), `follower_id` (FK -> Users), `following_id` (FK -> Users), `created_at`.
* **Table `Bans` :** `id` (PK), `user_id` (FK -> Users), `reason`, `banned_by` (FK -> Users), `expires_at`, `created_at`.

### 2. MongoDB (via Mongoose) - Documents & Haute Performance

* **Collection `Posts` :**
```json
{
  "_id": "ObjectId",
  "user_id": "Number (Postgres FK)",
  "content": "String (max 280 chars)",
  "likes": ["Number (Postgres User IDs)"],
  "comments": [
    {
      "comment_id": "ObjectId",
      "user_id": "Number",
      "content": "String",
      "created_at": "Date",
      "replies": [
        {
          "reply_id": "ObjectId",
          "user_id": "Number",
          "content": "String",
          "created_at": "Date"
        }
      ]
    }
  ],
  "tags": ["String"],
  "media": {
    "type": "String (image/video)",
    "url": "String"
  },
  "created_at": "Date"
}

```


* **Collection `Notifications` :** `_id`, `recipient_id`, `sender_id`, `type` (enum: mention, like, follow), `post_id` (optionnel), `is_read`, `created_at`.
* **Collection `DirectMessages` (DMs) :** `_id`, `conversation_id`, `sender_id`, `recipient_id`, `message_text`, `created_at`.
* **Collection `Reports` :** `_id`, `reported_by`, `target_type` (post/comment), `target_id`, `reason`, `status` (pending/resolved), `created_at`.

---

## 🌐 Cartographie de l'API RESTful (Routage Gateway)

Toutes les requêtes passent par l'API Gateway (Nginx) qui redirige vers les microservices appropriés. Chaque route requiert (sauf exception publique) une vérification du jeton JWT via un middleware global `authenticateToken`.

### 🔓 Routes Publiques

* `POST /api/auth/register` : Fx1. Inscription d'un nouvel utilisateur.
* `POST /api/auth/login` : Fx2. Connexion et génération du Token JWT.

### 🔒 Routes Protégées (Utilisateur standard minimum)

* **UserService (`/api/users`) :**
* `GET /api/users/profile/:id` : Fx10. Récupérer les données de profil d'un utilisateur.
* `PUT /api/users/profile` : Fx10. Mettre à jour ses propres informations de profil.
* `POST /api/users/follow/:id` : Fx9. S'abonner à un utilisateur.
* `DELETE /api/users/unfollow/:id` : Fx9. Se désabonner d'un utilisateur.
* `PUT /api/users/settings` : Fx22 & Fx23. Configurer la langue et le thème.


* **PostService (`/api/posts`) :**
* `POST /api/posts` : Fx3. Publier un message court.
* `GET /api/posts/feed` : Fx5. Récupérer le fil d'actualités chronologique des abonnements.
* `GET /api/posts/user/:id` : Fx4 & Fx11. Récupérer tous les messages d'un profil spécifique.
* `POST /api/posts/:id/like` : Fx6. Liker un message.
* `POST /api/posts/:id/comment` : Fx7. Ajouter un commentaire.
* `POST /api/posts/:id/comment/:commentId/reply` : Fx8. Répondre à un commentaire.


* **TagService (`/api/tags`) :**
* `GET /api/tags/search?q=monTag` : Fx13. Rechercher des messages par hashtag.


* **NotificationService (`/api/notifications`) :**
* `GET /api/notifications` : Fx14, Fx15, Fx16. Récupérer l'historique des notifications de l'utilisateur connecté.


* **DMService (`/api/dms`) :**
* `POST /api/dms/send` : Fx17. Envoyer un message privé.
* `GET /api/dms/conversation/:userId` : Fx17. Charger l'historique des conversations avec un utilisateur.


* **MediaService (`/api/media`) :**
* `POST /api/media/upload` : Fx18 & Fx19. Téléverser une image ou vidéo (stockage brut + métadonnées).



### 🛡️ Routes de Modération & Administration

* **ModerationService (`/api/moderation`) :**
* `POST /api/moderation/report` : Fx20. Signaler un contenu (accessible à tout utilisateur authentifié).
* `GET /api/moderation/reports` : *(Modérateur/Admin)* Consulter la liste des signalements actifs.
* `POST /api/moderation/ban` : *(Modérateur/Admin)* Fx21. Suspendre ou bannir définitivement un utilisateur.



---

## 🚀 Guide de Déploiement et d'Installation Local

Grâce à la containerisation complète via Docker, l'environnement se déploie de manière portable et unifiée.

### Prérequis

* Docker installé sur la machine hôte.
* Docker Compose installé.

### Procédure de Lancement

1. Cloner le dépôt du projet :
```bash
git clone https://github.com/votre-organisation/breezy.git
cd breezy

```


2. Configurer les variables d'environnement (fichiers `.env` à la racine de chaque microservice). Exemple type pour le back-end :
```env
PORT=3000
JWT_SECRET=votre_cle_secrete_ultra_robuste
POSTGRES_URI=postgres://user:password@postgres_db:5432/breezy
MONGO_URI=mongodb://mongo_db:27017/breezy

```


3. Lancer l'infrastructure complète via Docker Compose :
```bash
docker-compose up --build

```


4. L'application est accessible à l'adresse suivante : `http://localhost` (via l'API Gateway Nginx).

---

## 📋 Attentes de Fin d'Études & Soutenance (Rappel Équipe)

Pour garantir la validation du module, le groupe doit impérativement fournir et préparer les éléments suivants conformément au règlement pédagogique :

1. **Le Rapport Écrit :** Doit inclure l'identification claire des objectifs, la représentation structurée de l'architecture choisie, la hiérarchisation des tâches, la méthodologie appliquée, les wireframes d'interface, et respecter les règles strictes du *Guide de rédaction des rapports de décembre 2023*.
2. **La Soutenance Orale (Chronologie stricte de 45 minutes) :**
* **5 min :** Présentation de l'équipe et rappel du contexte.
* **15 min :** Démonstration dynamique de la maquette (Scénario préconstruit obligatoire pour éviter tout problème technique).
* **10 min :** Session de Questions/Réponses collectives avec le jury.
* **5 min :** Questions individuelles sur la maîtrise globale du projet.
* **5 min :** Délibération confidentielle du jury.
* **5 min :** Restitution à chaud des notes et commentaires.
* *Note : Tenue correcte et professionnelle exigée pour tous les membres du projet.*



---

## 📄 Licence

Ce projet est distribué sous la licence **MIT**. Consulter le fichier `LICENSE` pour en savoir plus sur les permissions d'utilisation et d'exploitation du code.