// Service des messages privés — endpoints /api/dms/*
import api from "../lib/api";

// GET /api/dms/conversations → { conversations: [{ conversation_id, other_user_id, last_message, unread_count }], pagination }
export async function getConversations({ page = 1, limit = 20 } = {}) {
  const res = await api.get("/dms/conversations", { params: { page, limit } });
  return res.data.data;
}

// GET /api/dms/conversation/:userId → { messages, pagination }
export async function getConversation(userId, { page = 1, limit = 50 } = {}) {
  const res = await api.get(`/dms/conversation/${userId}`, { params: { page, limit } });
  return res.data.data;
}

// POST /api/dms/send { recipient_id, message_text } → message créé
export async function sendMessage(recipientId, text) {
  const res = await api.post("/dms/send", { recipient_id: recipientId, message_text: text });
  return res.data.data;
}

// PUT /api/dms/conversation/:userId/read
export async function markConversationRead(userId) {
  const res = await api.put(`/dms/conversation/${userId}/read`);
  return res.data.data;
}

// GET /api/dms/unread-count → { unreadCount }
export async function getUnreadCount() {
  const res = await api.get("/dms/unread-count");
  return res.data.data;
}
