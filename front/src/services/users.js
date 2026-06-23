// Service des utilisateurs — endpoints /api/users/*
import api from "../lib/api";
import { LRUCache } from "../lib/lruCache";

const userCache = new LRUCache(200, 300_000);

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

// PUT /api/users/profile/:id { display_name?, bio?, avatar_url? } (propriétaire uniquement)
export async function updateProfile(userId, fields) {
  const res = await api.put(`/users/profile/${userId}`, fields);
  return res.data.data;
}

// PUT /api/users/settings/:id { language_preference?, theme_preference? }
export async function updateSettings(userId, fields) {
  const res = await api.put(`/users/settings/${userId}`, fields);
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

const BATCH_SIZE = 100;

function mapUser(u) {
  return {
    username: u.username,
    displayName: u.profile?.display_name || u.username,
    avatarUrl: u.profile?.avatar_url || null,
  };
}

export async function resolveUsers(ids) {
  const strIds = ids.map(String);
  const uncachedIds = strIds.filter((id) => !userCache.has(id));

  if (uncachedIds.length === 0) {
    return strIds.map((id) => userCache.get(id));
  }

  for (let i = 0; i < uncachedIds.length; i += BATCH_SIZE) {
    const chunk = uncachedIds.slice(i, i + BATCH_SIZE);
    try {
      const response = await api.post("/users/batch", { ids: chunk });
      const users = response.data.data.users;
      users.forEach((u) => userCache.set(String(u.id), mapUser(u)));
    } catch {
      const fallbacks = await Promise.allSettled(chunk.map((id) => getProfile(id)));
      fallbacks.forEach((result, idx) => {
        const id = chunk[idx];
        if (result.status === "fulfilled") {
          userCache.set(String(id), mapUser(result.value));
        } else {
          userCache.set(String(id), { username: `user${id}`, displayName: `Utilisateur ${id}`, avatarUrl: null });
        }
      });
    }
  }

  return strIds.map((id) => userCache.get(id));
}
