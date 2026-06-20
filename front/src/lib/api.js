"use client";

import axios from "axios";

// Base de l'API : le reverse-proxy nginx expose tous les microservices sous /api.
// Surchargeable au build via NEXT_PUBLIC_API_URL (variable inlinée par Next.js).
// Défaut = nginx local (docker-compose), port 80.
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";

// Clés de stockage du JWT et de l'utilisateur courant (LocalStorage).
export const TOKEN_KEY = "breezy_token";
export const USER_KEY = "breezy_user";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Requête : on injecte le JWT (Authorization: Bearer ...) s'il est présent.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Réponse : si le backend renvoie 401 (token absent/expiré), on purge la session
// et on redirige vers /login — sauf si on y est déjà (échec de connexion).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      !window.location.pathname.startsWith("/login")
    ) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Extrait un message d'erreur lisible depuis l'enveloppe backend ({ error, statusCode }).
export function getApiErrorMessage(err, fallback = "Une erreur est survenue.") {
  return err?.response?.data?.error || fallback;
}

export default api;
