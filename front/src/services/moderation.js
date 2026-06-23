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
