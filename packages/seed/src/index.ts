/**
 * Breezy — Seed de base de données (idempotent).
 *
 * Exécuté automatiquement par le service `seed` de docker-compose à chaque
 * démarrage de la stack. Crée les comptes de démonstration s'ils n'existent
 * pas encore, puis sort. Relancer la stack ne crée jamais de doublon.
 *
 * Contenu : 3 comptes principaux (1 admin, 1 modérateur, 1 utilisateur)
 * + 10 utilisateurs aléatoires. Tous partagent le même mot de passe de dev.
 */

import bcrypt from 'bcrypt';
import { sequelize, UserModel, ProfileModel } from '@breezy/shared';

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
  {
    username: 'mxriine',
    email: 'mxriine@breezy.dev',
    role: 'admin',
    display_name: 'Mxriine',
    bio: 'Administratrice de Breezy ☁️',
  },
  {
    username: 'maverick',
    email: 'maverick@breezy.dev',
    role: 'moderator',
    display_name: 'Maverick',
    bio: 'Modérateur — je veille au grain 🛡️',
  },
  {
    username: 'doggo',
    email: 'doggo@breezy.dev',
    role: 'user',
    display_name: 'Doggo',
    bio: 'Just a good boy 🐕',
  },
];

// --- 10 utilisateurs aléatoires (rôle user) ---
const RANDOM_NAMES = [
  'alice', 'bob', 'charlie', 'diana', 'ethan',
  'fiona', 'gabriel', 'hanna', 'ines', 'jules',
];

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

/**
 * Attend que la base ET les tables (créées par le `sync` des services au
 * démarrage) soient disponibles. On sonde avec un simple findOne : il renvoie
 * null si la table existe (prêt), ou lève une erreur tant qu'elle n'existe pas
 * ou que la connexion n'est pas établie.
 */
async function waitForSchema(retries = 40, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await UserModel.findOne({ where: { email: '__seed_probe__' } });
      console.log('✅ Base de données et tables prêtes.');
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`⏳ En attente de la base/tables (${attempt}/${retries}) : ${msg}`);
      await sleep(delayMs);
    }
  }
  throw new Error('Base de données indisponible après plusieurs tentatives.');
}

async function seed(): Promise<void> {
  console.log('🌱 Seed Breezy — démarrage');
  await waitForSchema();

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  let created = 0;
  let skipped = 0;

  for (const u of ALL_USERS) {
    // Idempotence : on ne recrée jamais un compte déjà présent.
    const existing = await UserModel.findOne({ where: { email: u.email } });
    if (existing) {
      skipped++;
      console.log(`↩️  ${u.username.padEnd(10)} (${u.role}) — existe déjà, ignoré`);
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
    console.log(`✅ ${u.username.padEnd(10)} (${u.role}) — créé (id ${user.id})`);
  }

  console.log('\n────────────────────────────────────────');
  console.log(`🌱 Seed terminé : ${created} créé(s), ${skipped} déjà présent(s).`);
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
