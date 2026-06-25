# Breezy — MLD & MPD (modèle logique et physique)

> Suite du [dictionnaire des données & MCD](./dictionnaire-donnees-mcd.md).
> - **MLD** (Modèle Logique de Données) : traduction du MCD en relations / collections, indépendante du moteur.
> - **MPD** (Modèle Physique de Données) : le DDL réellement exécuté — `CREATE TABLE` PostgreSQL et schémas/validators MongoDB.
>
> Rappel d'architecture polyglotte : **PostgreSQL** porte l'identité et les relations sociales (5 tables) ; **MongoDB** porte le contenu (4 collections). Les références Mongo → `Users.id` sont **logiques** (pas de FK physique inter-bases).

---

## 1. MLD (notation relationnelle)

Convention : **clé primaire en gras**, `#` = clé étrangère, `(U)` = contrainte d'unicité.

### PostgreSQL
- **Users** (**id**, username (U), email (U), password_hash, role, is_validated, created_at, updated_at)
- **Profiles** (**id**, #user_id → Users (U), display_name, bio, avatar_url, language_preference, theme_preference, last_active)
- **Followers** (**id**, #follower_id → Users, #following_id → Users, created_at) — *(U) (follower_id, following_id)*
- **BlockedUsers** (**id**, #blocker_id → Users, #blocked_id → Users, created_at) — *(U) (blocker_id, blocked_id)*
- **Bans** (**id**, #user_id → Users, reason, #banned_by → Users, expires_at, created_at)

### MongoDB (collections orientées document)
- **posts** (**_id**, *user_id* → Users, content, likes[ *→Users* ], comments[ … ], tags[], media{type,url}|null, created_at)
  - comments[] : { comment_id, *user_id* → Users, content, created_at, replies[ { reply_id, *user_id* → Users, content, created_at } ] }
- **directmessages** (**_id**, conversation_id, *sender_id* → Users, *recipient_id* → Users, message_text, is_read, created_at)
- **notifications** (**_id**, *recipient_id* → Users, *sender_id* → Users, type, *post_id* → posts | null, is_read, created_at)
- **reports** (**_id**, *reported_by* → Users, target_type, target_id, reason, status, created_at)

> *En italique* : référence logique inter-bases (entier `Users.id`), non contrainte par une FK.

---

## 2. MPD — PostgreSQL (DDL)

Types : `DataTypes.DATE` (Sequelize) → `TIMESTAMP WITH TIME ZONE`. Les colonnes `id` sont des `SERIAL` (entier + séquence auto-incrémentée). Le type énuméré du rôle est nommé par convention Sequelize `enum_Users_role`.

```sql
-- Type énuméré du rôle
CREATE TYPE "enum_Users_role" AS ENUM ('user', 'moderator', 'admin');

-- 1) Comptes utilisateurs (entité racine)
CREATE TABLE "Users" (
    "id"            SERIAL            PRIMARY KEY,
    "username"      VARCHAR(50)       NOT NULL UNIQUE,
    "email"         VARCHAR(255)      NOT NULL UNIQUE,
    "password_hash" VARCHAR(255)      NOT NULL,
    "role"          "enum_Users_role" NOT NULL DEFAULT 'user',
    "is_validated"  BOOLEAN           NOT NULL DEFAULT TRUE,
    "created_at"    TIMESTAMPTZ       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMPTZ       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2) Profils (1–1 avec Users)
CREATE TABLE "Profiles" (
    "id"                  SERIAL      PRIMARY KEY,
    "user_id"             INTEGER     NOT NULL UNIQUE
                          REFERENCES "Users" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    "display_name"        VARCHAR(100),
    "bio"                 TEXT,
    "avatar_url"          VARCHAR(500),
    "language_preference" VARCHAR(10) NOT NULL DEFAULT 'en',
    "theme_preference"    VARCHAR(20) NOT NULL DEFAULT 'light',
    "last_active"         TIMESTAMPTZ
);

-- 3) Abonnements (réflexive sur Users)
CREATE TABLE "Followers" (
    "id"           SERIAL      PRIMARY KEY,
    "follower_id"  INTEGER     NOT NULL
                   REFERENCES "Users" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    "following_id" INTEGER     NOT NULL
                   REFERENCES "Users" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    "created_at"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "unique_follower_following" UNIQUE ("follower_id", "following_id")
);

-- 4) Bannissements (modération)
CREATE TABLE "Bans" (
    "id"         SERIAL      PRIMARY KEY,
    "user_id"    INTEGER     NOT NULL
                 REFERENCES "Users" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    "reason"     TEXT        NOT NULL,
    "banned_by"  INTEGER     NOT NULL
                 REFERENCES "Users" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5) Blocages entre utilisateurs (réflexive sur Users)
CREATE TABLE "BlockedUsers" (
    "id"         SERIAL      PRIMARY KEY,
    "blocker_id" INTEGER     NOT NULL
                 REFERENCES "Users" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    "blocked_id" INTEGER     NOT NULL
                 REFERENCES "Users" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "unique_blocker_blocked" UNIQUE ("blocker_id", "blocked_id")
);
```

> L'ordre de création respecte les dépendances : `Users` d'abord, puis les tables qui la référencent. (Dans les migrations, l'ordre est Users → Profiles → Followers → Bans → BlockedUsers.)

---

## 3. MPD — MongoDB (collections, validators & index)

MongoDB est sans schéma par défaut ; ci-dessous le schéma **applicatif** (Mongoose) exprimé en validateur natif `$jsonSchema` pour documenter les contraintes réelles. Noms de collections (pluriel/minuscule Mongoose) : `posts`, `directmessages`, `notifications`, `reports`.

```js
// ---- posts ---------------------------------------------------------------
db.createCollection("posts", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["user_id", "content", "created_at"],
    properties: {
      user_id:  { bsonType: "int" },                       // → Users.id
      content:  { bsonType: "string", maxLength: 280 },
      likes:    { bsonType: "array", items: { bsonType: "int" } },
      tags:     { bsonType: "array", items: { bsonType: "string" } },
      media:    { bsonType: ["object", "null"], properties: {
                    type: { enum: ["image", "video"] },
                    url:  { bsonType: "string" } } },
      comments: { bsonType: "array", items: {
        bsonType: "object",
        required: ["comment_id", "user_id", "content", "created_at"],
        properties: {
          comment_id: { bsonType: "objectId" },
          user_id:    { bsonType: "int" },
          content:    { bsonType: "string", maxLength: 280 },
          created_at: { bsonType: "date" },
          replies:    { bsonType: "array", items: {
            bsonType: "object",
            required: ["reply_id", "user_id", "content", "created_at"],
            properties: {
              reply_id:   { bsonType: "objectId" },
              user_id:    { bsonType: "int" },
              content:    { bsonType: "string" },
              created_at: { bsonType: "date" } } } } } } },
      created_at: { bsonType: "date" }
    }
  } }
});
db.posts.createIndex({ user_id: 1 });
db.posts.createIndex({ tags: 1 });
db.posts.createIndex({ created_at: 1 });
db.posts.createIndex({ user_id: 1, created_at: -1 }); // fil d'un utilisateur
db.posts.createIndex({ tags: 1,    created_at: -1 }); // recherche par tag

// ---- directmessages ------------------------------------------------------
db.createCollection("directmessages", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["conversation_id", "sender_id", "recipient_id", "message_text", "created_at"],
    properties: {
      conversation_id: { bsonType: "string" },
      sender_id:       { bsonType: "int" },   // → Users.id
      recipient_id:    { bsonType: "int" },   // → Users.id
      message_text:    { bsonType: "string" },// max 1000 (validé côté service)
      is_read:         { bsonType: "bool" },
      created_at:      { bsonType: "date" }
    }
  } }
});
db.directmessages.createIndex({ conversation_id: 1 });
db.directmessages.createIndex({ conversation_id: 1, created_at: -1 }); // fil d'une conversation
db.directmessages.createIndex({ recipient_id: 1, is_read: 1 });        // non lus

// ---- notifications -------------------------------------------------------
db.createCollection("notifications", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["recipient_id", "sender_id", "type", "created_at"],
    properties: {
      recipient_id: { bsonType: "int" },  // → Users.id
      sender_id:    { bsonType: "int" },  // → Users.id
      type:         { enum: ["mention", "like", "follow", "dm", "comment"] },
      post_id:      { bsonType: ["objectId", "null"] }, // → posts._id
      is_read:      { bsonType: "bool" },
      created_at:   { bsonType: "date" }
    }
  } }
});
db.notifications.createIndex({ recipient_id: 1 });
db.notifications.createIndex({ is_read: 1 });
db.notifications.createIndex({ recipient_id: 1, is_read: 1 });
db.notifications.createIndex({ recipient_id: 1, created_at: -1 });

// ---- reports -------------------------------------------------------------
db.createCollection("reports", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["reported_by", "target_type", "target_id", "reason", "created_at"],
    properties: {
      reported_by: { bsonType: "int" },  // → Users.id
      target_type: { enum: ["post", "comment", "user"] },
      target_id:   { bsonType: "string" }, // ObjectId de post/commentaire OU Users.id en chaîne
      reason:      { bsonType: "string" },
      status:      { enum: ["pending", "resolved"] },
      created_at:  { bsonType: "date" }
    }
  } }
});
db.reports.createIndex({ target_id: 1 });
db.reports.createIndex({ status: 1 });
db.reports.createIndex({ status: 1, created_at: -1 }); // file de modération
```

---

## 4. Récapitulatif des index

| Base | Objet | Index | But |
|---|---|---|---|
| PG | `Users` | PK `id`, UQ `username`, UQ `email` | identité unique |
| PG | `Profiles` | PK `id`, UQ `user_id` | relation 1–1 |
| PG | `Followers` | PK `id`, UQ (`follower_id`,`following_id`) | abonnement unique |
| PG | `BlockedUsers` | PK `id`, UQ (`blocker_id`,`blocked_id`) | blocage unique |
| PG | `Bans` | PK `id` | — |
| Mongo | `posts` | `user_id`, `tags`, `created_at`, (`user_id`,`created_at`↓), (`tags`,`created_at`↓) | fil & recherche |
| Mongo | `directmessages` | `conversation_id`, (`conversation_id`,`created_at`↓), (`recipient_id`,`is_read`) | conversation & non-lus |
| Mongo | `notifications` | `recipient_id`, `is_read`, (`recipient_id`,`is_read`), (`recipient_id`,`created_at`↓) | inbox & non-lus |
| Mongo | `reports` | `target_id`, `status`, (`status`,`created_at`↓) | file de modération |

> Note : sur les tables PostgreSQL, les colonnes de clé étrangère ne sont pas indexées séparément (seuls les index uniques composés et les PK existent). Les `TIMESTAMPTZ` par défaut sont alimentés par `CURRENT_TIMESTAMP`.
