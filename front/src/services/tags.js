// Service de recherche par tags — endpoint /api/tags/*
import api from "../lib/api";

// Fx13 — GET /api/tags/search?q=tag → { posts, pagination }
// Renvoie les posts portant ce tag (tri antéchronologique).
export async function searchByTag(q, { page = 1, limit = 20 } = {}) {
  const res = await api.get("/tags/search", { params: { q, page, limit } });
  return res.data.data;
}

// GET /api/tags/trending → { tags: [{ tag, count }] }
// Renvoie les hashtags les plus populaires des 7 derniers jours.
export async function getTrending() {
  const res = await api.get("/tags/trending");
  return res.data.data.tags;
}

// GET /api/tags/suggest?q=prefix → [{ tag, count }]
// Autocomplétion des hashtags : noms de tags existants correspondant au préfixe.
export async function suggestTags(q) {
  const res = await api.get("/tags/suggest", { params: { q } });
  return res.data.data.tags;
}
