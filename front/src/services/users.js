// Service des utilisateurs — endpoints /api/users/*
import api from "../lib/api";

// Cache mémoire (id -> infos) : le backend n'a pas de lookup d'utilisateurs en
// lot, on résout au cas par cas et on garde le résultat.
const userCache = new Map();

// GET /api/users/profile/:id → { ...user, profile, followers_count, ... }
export async function getProfile(userId) {
  const res = await api.get(`/users/profile/${userId}`);
  return res.data.data;
}

// GET /api/users/username/:username (public) → { id, username, profile, followers_count, following_count, post_count }
// Résout un username en profil complet (requis par Fx9 sur le profil public).
export async function getProfileByUsername(username) {
  const res = await api.get(`/users/username/${encodeURIComponent(username)}`);
  return res.data.data;
}

// Fx9 — POST /api/users/follow/:id
export async function follow(userId) {
  const res = await api.post(`/users/follow/${userId}`);
  return res.data.data;
}

// Fx9 — DELETE /api/users/unfollow/:id
export async function unfollow(userId) {
  const res = await api.delete(`/users/unfollow/${userId}`);
  return res.data.data;
}

// Résout un user_id en infos affichables (nom + avatar), avec cache.
export async function resolveUser(userId) {
  if (userCache.has(userId)) return userCache.get(userId);
  try {
    const u = await getProfile(userId);
    const info = {
      username: u.username,
      displayName: u.profile?.display_name || u.username,
      avatarUrl: u.profile?.avatar_url || null,
    };
    userCache.set(userId, info);
    return info;
  } catch {
    const fallback = { username: `user${userId}`, displayName: `Utilisateur ${userId}`, avatarUrl: null };
    userCache.set(userId, fallback);
    return fallback;
  }
}
