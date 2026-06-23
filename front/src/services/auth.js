import api from "../lib/api";

export async function login(email, password) {
  const res = await api.post("/auth/login", { email, password });
  return res.data.data;
}

export async function register({ email, username, password }) {
  const res = await api.post("/auth/register", { email, username, password });
  return res.data.data;
}

export async function me() {
  const res = await api.get("/auth/me");
  return res.data.data;
}

export async function logout() {
  const res = await api.post("/auth/logout");
  return res.data.data;
}
