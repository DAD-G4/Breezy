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
