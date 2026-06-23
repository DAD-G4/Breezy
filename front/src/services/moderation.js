// Service de modération — endpoints /api/moderation/*
import api from "../lib/api";

// Fx20 — POST /api/moderation/report { target_type, target_id, reason }
export async function report({ targetType, targetId, reason }) {
  const res = await api.post("/moderation/report", {
    target_type: targetType,
    target_id: targetId,
    reason,
  });
  return res.data.data;
}

// Fx21 — GET /api/moderation/reports?status=pending → { reports, pagination } (modérateur)
export async function listReports({ status = "pending" } = {}) {
  const res = await api.get("/moderation/reports", { params: { status } });
  return res.data.data;
}

// PUT /api/moderation/reports/:id/resolve
export async function resolveReport(id) {
  const res = await api.put(`/moderation/reports/${id}/resolve`);
  return res.data.data;
}

// POST /api/moderation/ban { user_id, reason, expires_at? }
export async function banUser(userId, reason, expiresAt = null) {
  const res = await api.post("/moderation/ban", { user_id: userId, reason, expires_at: expiresAt });
  return res.data.data;
}

// DELETE /api/moderation/ban/:userId
export async function unbanUser(userId) {
  const res = await api.delete(`/moderation/ban/${userId}`);
  return res.data.data;
}

// GET /api/moderation/bans → { bans, pagination }
export async function listBans() {
  const res = await api.get("/moderation/bans");
  return res.data.data;
}
