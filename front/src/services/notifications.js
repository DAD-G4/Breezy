// Service notifications — endpoints /api/notifications/*
import api from "../lib/api";

// Fx14-16 — GET /api/notifications → { notifications, pagination }
export async function getNotifications({ page = 1, limit = 20 } = {}) {
  const res = await api.get("/notifications", { params: { page, limit } });
  return res.data.data;
}

// PUT /api/notifications/:id/read
export async function markAsRead(id) {
  const res = await api.put(`/notifications/${id}/read`);
  return res.data.data;
}

// Marque plusieurs notifications comme lues (best-effort).
export async function markAllRead(ids) {
  await Promise.all(ids.map((id) => markAsRead(id).catch(() => {})));
}
