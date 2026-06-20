// Service d'authentification — endpoints /api/auth/*
import api from "../lib/api";

// POST /api/auth/login → { token, user }
export async function login(email, password) {
  const res = await api.post("/auth/login", { email, password });
  return res.data.data;
}

// POST /api/auth/register (le backend dérive display_name depuis username)
export async function register({ email, username, password }) {
  const res = await api.post("/auth/register", { email, username, password });
  return res.data.data;
}
