// Service des posts — endpoints /api/posts/*
import api from "../lib/api";

// GET /api/posts → feed des utilisateurs suivis : { posts, pagination }
export async function getFeed({ page = 1, limit = 20 } = {}) {
  const res = await api.get("/posts", { params: { page, limit } });
  return res.data.data;
}

// GET /api/posts/:id (public) → un post seul (document MongoDB complet)
export async function getPost(postId) {
  const res = await api.get(`/posts/${postId}`);
  return res.data.data;
}

// GET /api/posts/user/:id → posts d'un utilisateur : { posts, pagination }
export async function getUserPosts(userId, { page = 1, limit = 20 } = {}) {
  const res = await api.get(`/posts/user/${userId}`, { params: { page, limit } });
  return res.data.data;
}

// POST /api/posts → crée un post (media optionnel : { type, url })
export async function createPost({ content, media = null }) {
  const res = await api.post("/posts", { content, media });
  return res.data.data;
}

// Fx6 — POST /api/posts/:id/like (toggle) : { liked, likesCount }
export async function toggleLike(postId) {
  const res = await api.post(`/posts/${postId}/like`);
  return res.data.data;
}

// Fx7 — POST /api/posts/:id/comment : { comment_id, user_id, content, created_at, replies }
export async function addComment(postId, content) {
  const res = await api.post(`/posts/${postId}/comment`, { content });
  return res.data.data;
}

// Fx8 — POST /api/posts/:id/comment/:commentId/reply : { reply_id, user_id, content, created_at }
export async function addReply(postId, commentId, content) {
  const res = await api.post(`/posts/${postId}/comment/${commentId}/reply`, { content });
  return res.data.data;
}

// DELETE /api/posts/:postId/comment/:commentId — supprime un commentaire (auteur).
export async function deleteComment(postId, commentId) {
  const res = await api.delete(`/posts/${postId}/comment/${commentId}`);
  return res.data.data;
}

// PUT /api/posts/:id — met à jour le contenu d'un post (propriétaire).
export async function updatePost(postId, content) {
  const res = await api.put(`/posts/${postId}`, { content });
  return res.data.data;
}

// DELETE /api/posts/:id — supprime un post (modération / propriétaire).
export async function deletePost(postId) {
  const res = await api.delete(`/posts/${postId}`);
  return res.data.data;
}
