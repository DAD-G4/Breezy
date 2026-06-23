<div align="center">

# ☁️ Breezy

### Réseau Social Léger & Scalable — Twitter/X Clone

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![Next.js](https://img.shields.io/badge/Next.js-React-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)

*Un réseau social performant, optimisé pour les environnements à faibles ressources, avec une architecture microservices conteneurisée.*

</div>

---

## Table des matières

- [Description](#-description)
- [Stack technique](#-stack-technique)
- [Architecture](#-architecture)
- [Fonctionnalités](#-fonctionnalités)
- [Bases de données](#-bases-de-données)
- [API REST](#-api-rest)
- [Installation](#-installation)
- [Licence](#-licence)

---

## 📝 Description

**Breezy** est un réseau social léger, réactif et hautement scalable, inspiré de Twitter/X. Conçu pour les environnements à faibles ressources, il garantit une expérience utilisateur rapide et fluide grâce à une approche mobile-first, tout en maintenant une architecture back-end robuste et découpée en microservices.

**Objectifs clés :**
- Performance et réactivité sur tous les appareils
- Architecture distribuée et scalabile
- Expérience utilisateur fluide (mobile-first)
- Sécurité renforcée (JWT, rôles stricts)

---

## 🛠️ Stack technique

<table>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>Next.js / React.js, Tailwind CSS, Axios</td>
  </tr>
  <tr>
    <td><strong>Backend</strong></td>
    <td>Node.js, Express.js, TypeScript</td>
  </tr>
  <tr>
    <td><strong>API Gateway</strong></td>
    <td>Nginx (Reverse Proxy, CORS, SSL)</td>
  </tr>
  <tr>
    <td><strong>Authentification</strong></td>
    <td>JWT (JSON Web Tokens), bcrypt</td>
  </tr>
  <tr>
    <td><strong>Base de données</strong></td>
    <td>PostgreSQL 15 + Sequelize, MongoDB 6 + Mongoose</td>
  </tr>
  <tr>
    <td><strong>Conteneurisation</strong></td>
    <td>Docker & Docker Compose</td>
  </tr>
  <tr>
    <td><strong>Monorepo</strong></td>
    <td>npm Workspaces</td>
  </tr>
</table>

---

## 🏗️ Architecture

L'application repose sur une **architecture distribuée en microservices**, orchestrée par Docker. Chaque service est isolé et communique via l'API Gateway (Nginx).

```mermaid
graph TD
    subgraph Client ["📱 Client — Mobile First"]
        Nav["Navigateur / Web App<br/>React Router"]
    end

    subgraph Infra ["🐳 Docker Infrastructure"]
        Nginx["⚡ Nginx<br/>API Gateway · Reverse Proxy · CORS"]

        subgraph Front ["🎨 Frontend"]
            Next["Next.js / React.js<br/>Tailwind CSS · Axios · JWT"]
        end

        subgraph Back ["⚙️ Backend — Microservices"]
            Auth["🔐 AuthService<br/>Inscription · Login · JWT"]
            User["👤 UserService<br/>Profils · Abonnements · Langue · Thème"]
            Post["📝 PostService<br/>Posts · Feed · Likes · Commentaires"]
            Tag["🏷️ TagService<br/>Ajout · Recherche"]
            Notif["🔔 NotificationService<br/>Mentions · Likes · Followers"]
            DM["💬 DMService<br/>Messages Privés"]
            Media["🖼️ MediaService<br/>Upload Images · Vidéos"]
            Mod["🛡️ ModerationService<br/>Signalements · Bannissements"]
        end

        subgraph DB ["💾 Bases de données"]
            PG[("PostgreSQL<br/>Sequelize<br/>Comptes · Auth · Rôles")]
            Mongo[("MongoDB<br/>Mongoose<br/>Posts · Tags · DMs · Notifs")]
            Vol[("Volume Docker<br/>Fichiers Médias")]
        end
    end

    Nav -->|"HTTP/HTTPS"| Nginx
    Nginx -->|"UI"| Next
    Next -->|"API REST + JWT"| Nginx

    Nginx --> Auth
    Nginx --> User
    Nginx --> Post
    Nginx --> Tag
    Nginx --> Notif
    Nginx --> DM
    Nginx --> Media
    Nginx --> Mod

    Auth -.-> PG
    User -.-> PG
    Mod -.-> PG

    Post -.-> Mongo
    Tag -.-> Mongo
    Notif -.-> Mongo
    DM -.-> Mongo
    Mod -.-> Mongo

    Media -.-> Mongo
    Media -.-> Vol
```

### Structure du monorepo

```
breezy/
├── packages/
│   ├── shared/           # Types, utils, middleware partagés
│   ├── auth-service/     # Inscription, connexion, JWT
│   ├── user-service/     # Profils, abonnements, préférences
│   ├── post-service/     # Posts, feed, likes, commentaires
│   ├── tag-service/      # Tags et recherche
│   ├── notification-service/ # Notifications
│   └── dm-service/       # Messages privés
├── docker-compose.yml
├── tsconfig.json
└── package.json          # Workspaces config
```

---

## 🎯 Fonctionnalités

Le système implémente **23 fonctionnalités** régies par une matrice de permissions stricte.

### Rôles utilisateurs

| Rôle | Description |
|------|-------------|
| **Visiteur** | Utilisateur non authentifié |
| **Utilisateur** | Membre standard authentifié |
| **Modérateur** | Veille au respect des règles communautaires |
| **Administrateur** | Pouvoirs totaux sur la configuration et la modération |

### Matrice des permissions

| # | Fonctionnalité | Visiteur | Utilisateur | Modérateur | Admin |
|---|----------------|:--------:|:-----------:|:----------:|:-----:|
| Fx1 | Création de compte avec validation | ✅ | ❌ | ❌ | ✅ |
| Fx2 | Authentification sécurisée (JWT) | ❌ | ✅ | ✅ | ✅ |
| Fx3 | Publication de messages (max 280 car.) | ❌ | ✅ | ✅ | ✅ |
| Fx4 | Affichage des messages sur le profil | ❌ | ✅¹ | ✅ | ✅ |
| Fx5 | Flux chronologique des abonnements | ❌ | ✅ | ✅ | ✅ |
| Fx6 | Liker un post | ❌ | ✅ | ✅ | ✅ |
| Fx7 | Commenter un post | ❌ | ✅ | ✅ | ✅ |
| Fx8 | Répondre à un commentaire | ❌ | ✅ | ✅ | ✅ |
| Fx9 | Suivre / être suivi | ❌ | ✅ | ✅ | ✅ |
| Fx10 | Profil utilisateur | ❌ | ✅ | ✅ | ✅ |
| Fx11 | Liste des posts d'un utilisateur | ❌ | ✅ | ✅ | ✅ |
| Fx12 | Ajout de tags aux messages | ❌ | ✅ | ✅ | ✅ |
| Fx13 | Recherche de posts par tag | ❌ | ✅ | ✅ | ✅ |
| Fx14 | Notifications — mentions | ❌ | ✅ | ✅ | ✅ |
| Fx15 | Notifications — likes | ❌ | ✅ | ❌ | ❌ |
| Fx16 | Notifications — nouveaux followers | ❌ | ✅ | ❌ | ❌ |
| Fx17 | Messages privés | ❌ | ✅ | ✅ | ✅ |
| Fx18 | Images dans les messages | ❌ | ✅ | ✅ | ✅ |
| Fx19 | Vidéos dans les messages | ❌ | ✅ | ✅ | ✅ |
| Fx20 | Signalement de contenu | ❌ | ✅ | ✅ | ✅ |
| Fx21 | Suspension / bannissement | ❌ | ❌ | ✅ | ✅ |
| Fx22 | Interface multi-langues | ❌ | ✅ | ✅ | ✅ |
| Fx23 | Thème sombre / clair | ✅ | ✅ | ✅ | ✅ |

> ¹ L'utilisateur ne voit que ses propres messages sur son profil.

---

## 💾 Bases de données

Les données sont réparties entre deux moteurs pour optimiser performances et intégrité.

### PostgreSQL (Sequelize) — Données relationnelles

| Table | Colonnes principales |
|-------|---------------------|
| **Users** | `id`, `username`, `email`, `password_hash`, `role`, `is_validated`, `created_at`, `updated_at` |
| **Profiles** | `id`, `user_id` (FK), `display_name`, `bio`, `avatar_url`, `language_preference`, `theme_preference` |
| **Followers** | `id`, `follower_id` (FK), `following_id` (FK), `created_at` |
| **Bans** | `id`, `user_id` (FK), `reason`, `banned_by` (FK), `expires_at`, `created_at` |

### MongoDB (Mongoose) — Documents & haute performance

<details>
<summary><strong>Collection Posts</strong></summary>

```json
{
  "_id": "ObjectId",
  "user_id": "Number (Postgres FK)",
  "content": "String (max 280 chars)",
  "likes": ["Number (User IDs)"],
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
</details>

| Collection | Description |
|------------|-------------|
| **Notifications** | `recipient_id`, `sender_id`, `type` (mention/like/follow), `post_id`, `is_read`, `created_at` |
| **DirectMessages** | `conversation_id`, `sender_id`, `recipient_id`, `message_text`, `created_at` |
| **Reports** | `reported_by`, `target_type` (post/comment), `target_id`, `reason`, `status` (pending/resolved) |

---

## 🌐 API REST

Toutes les requêtes passent par l'**API Gateway (Nginx)**. Les routes protégées nécessitent un jeton JWT via le middleware `authenticateToken`.

### Routes publiques

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/auth/register` | Inscription d'un nouvel utilisateur |
| `POST` | `/api/auth/login` | Connexion et génération du token JWT |

### Routes protégées — UserService

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/users/profile/:id` | Récupérer un profil utilisateur |
| `PUT` | `/api/users/profile` | Mettre à jour son profil |
| `POST` | `/api/users/follow/:id` | Suivre un utilisateur |
| `DELETE` | `/api/users/unfollow/:id` | Se désabonner |
| `PUT` | `/api/users/settings` | Configurer langue et thème |

### Routes protégées — PostService

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/posts` | Publier un message |
| `GET` | `/api/posts/feed` | Fil d'actualités chronologique |
| `GET` | `/api/posts/user/:id` | Posts d'un utilisateur |
| `POST` | `/api/posts/:id/like` | Liker un post |
| `POST` | `/api/posts/:id/comment` | Ajouter un commentaire |
| `POST` | `/api/posts/:id/comment/:commentId/reply` | Répondre à un commentaire |

### Routes protégées — TagService

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/tags/search?q=monTag` | Rechercher des posts par hashtag |

### Routes protégées — NotificationService

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/notifications` | Historique des notifications |

### Routes protégées — DMService

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/dms/send` | Envoyer un message privé |
| `GET` | `/api/dms/conversation/:userId` | Historique de conversation |

### Routes protégées — MediaService

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/media/upload` | Téléverser une image ou vidéo |

### Routes de modération — ModerationService

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| `POST` | `/api/moderation/report` | Utilisateur | Signaler un contenu |
| `GET` | `/api/moderation/reports` | Modérateur / Admin | Consulter les signalements |
| `POST` | `/api/moderation/ban` | Modérateur / Admin | Suspendre / bannir un utilisateur |

---

## 🚀 Installation

### Prérequis

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) ≥ 20 (pour le développement local)

### Lancement rapide

```bash
# 1. Cloner le dépôt
git clone https://github.com/votre-organisation/breezy.git
cd breezy

# 2. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 3. Lancer l'infrastructure
docker-compose up --build
```

L'application est accessible sur **`http://localhost`** via l'API Gateway Nginx.

### Variables d'environnement

```env
PORT=3000
JWT_SECRET=votre_cle_secrete_ultra_robuste
POSTGRES_URI=postgres://user:password@postgres_db:5432/breezy
MONGO_URI=mongodb://mongo_db:27017/breezy
```

### Commandes utiles

```bash
# Build tous les packages
npm run build

# Lancer les tests
npm run test

# Linter le code
npm run lint

# Migrations de base de données
npm run db:migrate
npm run db:migrate:undo
```

---

## 📄 Licence

Ce projet est distribué sous la licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour les détails.

---

<div align="center">

**Breezy** — Conçu avec ❤️ par **DAD-G4**

</div>
