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

// GET /api/users/search?q=query → { users: [...] }
export async function searchUsers(q) {
  const res = await api.get("/users/search", { params: { q } });
  return res.data.data.users;
}

// GET /api/users/followers/:id → { users: [...] }
export async function getFollowers(userId) {
  const res = await api.get(`/users/followers/${userId}`);
  return res.data.data;
}

// GET /api/users/following/:id → { users: [...] }
export async function getFollowing(userId) {
  const res = await api.get(`/users/following/${userId}`);
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
    return { username: `user${userId}`, displayName: `Utilisateur ${userId}`, avatarUrl: null };
  }
}

const BATCH_SIZE = 100;

// Tolère les deux formes de réponse : imbriquée (GET /profile → u.profile.*)
// et à plat (POST /users/batch → u.display_name / u.avatar_url).
function mapUser(u) {
  return {
    username: u.username,
    displayName: u.profile?.display_name || u.display_name || u.username,
    avatarUrl: u.profile?.avatar_url || u.avatar_url || null,
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
        }
      });
    }
  }

  return strIds.map((id) => userCache.get(id));
}

// POST /api/users/block/:id — Block a user
export async function blockUser(userId) {
  const res = await api.post(`/users/block/${userId}`);
  return res.data.data;
}

// DELETE /api/users/block/:id — Unblock a user
export async function unblockUser(userId) {
  const res = await api.delete(`/users/block/${userId}`);
  return res.data.data;
}

// GET /api/users/blocked — Get list of blocked users
export async function getBlockedUsers() {
  const res = await api.get("/users/blocked");
  return res.data.data.users;
}
