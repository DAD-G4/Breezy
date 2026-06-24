/**
 * Breezy — Seed de base de données (idempotent).
 *
 * Exécuté automatiquement par le service `seed` de docker-compose à chaque
 * démarrage de la stack. Peuple PostgreSQL (comptes, profils, abonnements) ET
 * MongoDB (posts, tags, likes, commentaires, notifications, messages privés)
 * si le contenu n'existe pas encore, puis sort. Relancer ne crée pas de doublon.
 *
 * Comptes : 3 principaux (1 admin, 1 modérateur, 1 utilisateur) + 10 random.
 */

import bcrypt from 'bcrypt';
import {
  sequelize,
  connectMongo,
  UserModel,
  ProfileModel,
  Follower,
  PostModel,
  NotificationModel,
  DirectMessageModel,
} from '@breezy/shared';

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || 'Breezy123!';

type Role = 'user' | 'moderator' | 'admin';

interface SeedUser {
  username: string;
  email: string;
  role: Role;
  display_name: string;
  bio: string;
}

// --- 3 comptes principaux (rôles explicites) ---
const MAIN_USERS: SeedUser[] = [
  { username: 'mxriine', email: 'mxriine@breezy.dev', role: 'admin', display_name: 'Mxriine', bio: 'Administratrice de Breezy ☁️' },
  { username: 'maverick', email: 'maverick@breezy.dev', role: 'moderator', display_name: 'Maverick', bio: 'Modérateur — je veille au grain 🛡️' },
  { username: 'doggo', email: 'doggo@breezy.dev', role: 'user', display_name: 'Doggo', bio: 'Just a good boy 🐕' },
];

// --- 10 utilisateurs aléatoires (rôle user) ---
const RANDOM_NAMES = ['alice', 'bob', 'charlie', 'diana', 'ethan', 'fiona', 'gabriel', 'hanna', 'ines', 'jules'];

const RANDOM_USERS: SeedUser[] = RANDOM_NAMES.map((name) => {
  const display = name.charAt(0).toUpperCase() + name.slice(1);
  return {
    username: name,
    email: `${name}@breezy.dev`,
    role: 'user' as Role,
    display_name: display,
    bio: `Salut, moi c'est ${display} ! Bienvenue sur mon profil Breezy.`,
  };
});

const ALL_USERS: SeedUser[] = [...MAIN_USERS, ...RANDOM_USERS];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const convId = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;

/**
 * Attend que PostgreSQL soit joignable, puis matérialise le schéma relationnel
 * via `sequelize.sync()`.
 *
 * En production, les services n'auto-syncent pas (cf. connectPostgres, qui ne
 * sync qu'en dehors de NODE_ENV=production). Ce one-shot `seed` — qui démarre
 * après que Postgres soit `healthy` — est donc le point unique qui crée les
 * tables avant tout peuplement. Importer @breezy/shared enregistre les 5
 * modèles Postgres (User, Profile, Follower, Ban, BlockedUser), donc sync()
 * crée bien l'ensemble du schéma. Idempotent : sans `force` ni `alter`, sync()
 * laisse intactes les tables existantes → relancer le seed est sûr.
 */
async function ensureSchema(retries = 40, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      await sequelize.sync();
      console.log('✅ PostgreSQL joignable et schéma prêt.');
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`⏳ En attente de PostgreSQL (${attempt}/${retries}) : ${msg}`);
      await sleep(delayMs);
    }
  }
  throw new Error('Base de données indisponible après plusieurs tentatives.');
}

/** Crée les comptes + profils. Renvoie une map username → id. */
async function seedUsers(): Promise<Record<string, number>> {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  let created = 0;
  let skipped = 0;

  for (const u of ALL_USERS) {
    const existing = await UserModel.findOne({ where: { email: u.email } });
    if (existing) {
      skipped++;
      continue;
    }
    const user = await UserModel.create({
      username: u.username,
      email: u.email,
      password_hash: passwordHash,
      role: u.role,
      is_validated: true,
    });
    await ProfileModel.create({
      user_id: user.id,
      display_name: u.display_name,
      bio: u.bio,
      language_preference: 'fr',
      theme_preference: 'light',
    });
    created++;
  }
  console.log(`👤 Comptes : ${created} créé(s), ${skipped} déjà présent(s).`);

  const rows = await UserModel.findAll({ where: { email: ALL_USERS.map((u) => u.email) } });
  const map: Record<string, number> = {};
  for (const r of rows) map[r.username] = r.id;
  return map;
}

/** Crée les abonnements (idempotent grâce à findOrCreate). */
async function seedFollows(id: Record<string, number>): Promise<void> {
  // [follower, following]
  const edges: [string, string][] = [
    // les 3 principaux se suivent mutuellement
    ['doggo', 'mxriine'], ['doggo', 'maverick'],
    ['mxriine', 'doggo'], ['mxriine', 'maverick'],
    ['maverick', 'doggo'], ['maverick', 'mxriine'],
    // des random suivent les principaux
    ['alice', 'doggo'], ['bob', 'doggo'], ['charlie', 'mxriine'],
    ['diana', 'mxriine'], ['ethan', 'maverick'], ['fiona', 'doggo'],
    ['gabriel', 'mxriine'], ['hanna', 'maverick'],
    // les principaux suivent quelques random
    ['doggo', 'alice'], ['doggo', 'bob'], ['mxriine', 'diana'], ['maverick', 'ethan'],
    // quelques liens entre random
    ['ines', 'jules'], ['jules', 'ines'], ['alice', 'bob'], ['charlie', 'diana'],
  ];

  let created = 0;
  for (const [f, g] of edges) {
    if (id[f] == null || id[g] == null) continue;
    const [, made] = await Follower.findOrCreate({
      where: { follower_id: id[f], following_id: id[g] },
      defaults: { follower_id: id[f], following_id: id[g] },
    });
    if (made) created++;
  }
  console.log(`🔗 Abonnements : ${created} créé(s).`);
}

interface SeedPost {
  author: string;
  content: string;
  tags: string[];
  media?: { type: 'image' | 'video'; url: string };
  likes?: string[];
  comments?: { author: string; content: string; replies?: { author: string; content: string }[] }[];
}

/** Crée posts + tags + likes + commentaires (Mongo). Renvoie les posts insérés. */
async function seedPosts(id: Record<string, number>): Promise<{ author: string; postId: string }[]> {
  const POSTS: SeedPost[] = [
    {
      author: 'doggo', content: 'Premier jour sur Breezy ! Hâte de découvrir la commu 🐕 #breezy #hello',
      tags: ['breezy', 'hello'], likes: ['mxriine', 'alice', 'bob'],
      comments: [
        { author: 'alice', content: 'Bienvenue Doggo ! 🎉', replies: [{ author: 'doggo', content: 'Merci Alice 🙏' }] },
        { author: 'bob', content: 'Welcome 👋' },
      ],
    },
    {
      author: 'mxriine', content: 'Bienvenue à toutes et tous sur Breezy ☁️ Profitez bien, on veille au grain. #annonce #breezy',
      tags: ['annonce', 'breezy'], likes: ['doggo', 'maverick', 'charlie', 'diana'],
      comments: [{ author: 'maverick', content: 'Présent ! 🛡️' }],
    },
    {
      author: 'maverick', content: 'Petit rappel : respect et bienveillance dans les échanges 🛡️ #moderation #regles',
      tags: ['moderation', 'regles'], likes: ['mxriine', 'ethan'],
    },
    {
      author: 'alice', content: 'Magnifique coucher de soleil ce soir 🌅 #photo #nature',
      tags: ['photo', 'nature'], media: { type: 'image', url: '/sample-post.jpg' },
      likes: ['doggo', 'bob', 'fiona', 'gabriel'],
      comments: [{ author: 'doggo', content: 'Superbe 😍' }],
    },
    {
      author: 'charlie', content: 'Démo de ma nouvelle appli en vidéo 🎥 #dev #demo',
      tags: ['dev', 'demo'], media: { type: 'video', url: '/sample-video.mp4' },
      likes: ['diana', 'mxriine'],
    },
    {
      author: 'bob', content: 'Quelqu\'un a regardé le match hier soir ? ⚽ #sport #foot',
      tags: ['sport', 'foot'], likes: ['ethan', 'jules'],
      comments: [{ author: 'ethan', content: 'Ouais, quel match ! 🔥' }],
    },
    {
      author: 'diana', content: 'Recette du jour : cookies maison 🍪 #cuisine #gourmandise',
      tags: ['cuisine', 'gourmandise'], likes: ['alice', 'fiona', 'hanna'],
    },
    {
      author: 'ethan', content: 'Session run matinale terminée 🏃 5km avant le boulot ! #sport #motivation',
      tags: ['sport', 'motivation'], likes: ['bob'],
    },
    {
      author: 'fiona', content: 'Playlist du week-end prête 🎶 des recos ? #musique',
      tags: ['musique'], likes: ['gabriel', 'ines'],
      comments: [{ author: 'gabriel', content: 'Envoie le lien ! 🎧' }],
    },
    {
      author: 'gabriel', content: 'Coup de cœur lecture du mois 📚 je recommande ! #livre #lecture',
      tags: ['livre', 'lecture'], likes: ['hanna'],
    },
    {
      author: 'doggo', content: 'Merci pour l\'accueil, déjà fan de Breezy ☁️ #breezy #merci',
      tags: ['breezy', 'merci'], likes: ['mxriine', 'maverick', 'alice'],
    },
    {
      author: 'mxriine', content: 'Astuce : utilisez les #tags pour rendre vos posts trouvables 🔎 #astuce #breezy',
      tags: ['astuce', 'breezy'], likes: ['doggo', 'charlie'],
    },
  ];

  const inserted: { author: string; postId: string }[] = [];
  for (const p of POSTS) {
    if (id[p.author] == null) continue;
    const comments = (p.comments || []).map((c) => ({
      user_id: id[c.author],
      content: c.content,
      created_at: new Date(),
      replies: (c.replies || []).map((r) => ({ user_id: id[r.author], content: r.content, created_at: new Date() })),
    }));
    const doc = await PostModel.create({
      user_id: id[p.author],
      content: p.content,
      tags: p.tags,
      media: p.media || null,
      likes: (p.likes || []).map((u) => id[u]).filter((x) => x != null),
      comments,
    });
    inserted.push({ author: p.author, postId: String(doc._id) });
  }
  console.log(`📝 Posts : ${inserted.length} créé(s) (avec tags, likes, commentaires).`);
  return inserted;
}

/** Crée des notifications cohérentes avec les posts/abonnements. */
async function seedNotifications(id: Record<string, number>, posts: { author: string; postId: string }[]): Promise<void> {
  const find = (author: string) => posts.find((p) => p.author === author)?.postId || null;

  // Le schéma n'autorise que les types : mention | like | follow | dm.
  const notifs: { recipient: string; sender: string; type: 'mention' | 'like' | 'follow' | 'dm'; post: string | null }[] = [
    { recipient: 'doggo', sender: 'alice', type: 'like', post: find('doggo') },
    { recipient: 'doggo', sender: 'bob', type: 'mention', post: find('doggo') },
    { recipient: 'mxriine', sender: 'bob', type: 'follow', post: null },
    { recipient: 'mxriine', sender: 'maverick', type: 'like', post: find('mxriine') },
    { recipient: 'maverick', sender: 'ethan', type: 'follow', post: null },
    { recipient: 'alice', sender: 'doggo', type: 'like', post: find('alice') },
    { recipient: 'doggo', sender: 'mxriine', type: 'mention', post: find('mxriine') },
  ];

  let created = 0;
  for (const n of notifs) {
    if (id[n.recipient] == null || id[n.sender] == null) continue;
    await NotificationModel.create({
      recipient_id: id[n.recipient],
      sender_id: id[n.sender],
      type: n.type,
      post_id: n.post,
      is_read: false,
    });
    created++;
  }
  console.log(`🔔 Notifications : ${created} créée(s).`);
}

/** Crée des conversations de messages privés. */
async function seedMessages(id: Record<string, number>): Promise<void> {
  const threads: { a: string; b: string; messages: { from: string; text: string }[] }[] = [
    {
      a: 'doggo', b: 'alice',
      messages: [
        { from: 'doggo', text: 'Salut Alice ! Merci pour ton accueil 🙏' },
        { from: 'alice', text: 'Avec plaisir Doggo ! Tu t\'installes bien ?' },
        { from: 'doggo', text: 'Carrément, l\'interface est top ☁️' },
      ],
    },
    {
      a: 'mxriine', b: 'maverick',
      messages: [
        { from: 'mxriine', text: 'Hello Maverick, un œil sur les signalements stp ?' },
        { from: 'maverick', text: 'Je m\'en occupe, RAS pour l\'instant 🛡️' },
      ],
    },
    {
      a: 'bob', b: 'ethan',
      messages: [
        { from: 'bob', text: 'Match ce week-end ?' },
        { from: 'ethan', text: 'Partant ! ⚽' },
      ],
    },
  ];

  let created = 0;
  for (const t of threads) {
    if (id[t.a] == null || id[t.b] == null) continue;
    const cid = convId(id[t.a], id[t.b]);
    for (const m of t.messages) {
      const sender = id[m.from];
      const recipient = sender === id[t.a] ? id[t.b] : id[t.a];
      await DirectMessageModel.create({
        conversation_id: cid,
        sender_id: sender,
        recipient_id: recipient,
        message_text: m.text,
        is_read: false,
      });
      created++;
    }
  }
  console.log(`💬 Messages privés : ${created} message(s) dans ${threads.length} conversations.`);
}

async function seed(): Promise<void> {
  console.log('🌱 Seed Breezy — démarrage');
  await ensureSchema();
  await connectMongo();

  // 1) PostgreSQL : comptes + profils + abonnements
  const id = await seedUsers();
  await seedFollows(id);

  // 2) MongoDB : contenu de démo (idempotent — uniquement si aucun post seedé)
  const seededIds = ALL_USERS.map((u) => id[u.username]).filter((x) => x != null);
  const existingPosts = await PostModel.countDocuments({ user_id: { $in: seededIds } });
  if (existingPosts > 0) {
    console.log(`↩️  Contenu Mongo déjà présent (${existingPosts} posts) — étape ignorée.`);
  } else {
    const posts = await seedPosts(id);
    await seedNotifications(id, posts);
    await seedMessages(id);
  }

  console.log('\n────────────────────────────────────────');
  console.log('🌱 Seed terminé.');
  console.log(`🔑 Mot de passe commun : ${DEFAULT_PASSWORD}`);
  console.log('   Comptes principaux : mxriine (admin) · maverick (moderator) · doggo (user)');
  console.log('────────────────────────────────────────');
}

seed()
  .then(async () => {
    await sequelize.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Seed échoué :', err);
    try {
      await sequelize.close();
    } catch {
      /* ignore */
    }
    process.exit(1);
  });
