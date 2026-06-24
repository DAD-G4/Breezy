"use client";

import axios from "axios";

// Base de l'API : le reverse-proxy nginx expose tous les microservices sous /api.
// Surchargeable au build via NEXT_PUBLIC_API_URL (variable inlinée par Next.js).
// Défaut = nginx local (docker-compose), port 80.
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";

// Pas de Content-Type par défaut : axios pose automatiquement
// « application/json » pour les corps objets ET « multipart/form-data;
// boundary=… » pour les FormData (uploads). Forcer un défaut casserait
// l'encodage multipart des uploads (boundary manquant).
const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Réponse : sur 401 (access token expiré), on tente UN renouvellement via
// /auth/refresh (refresh token 7 j) puis on rejoue la requête. Si le refresh
// échoue, on redirige vers /login. Les routes d'auth elles-mêmes ne déclenchent
// pas de refresh (pour éviter les boucles).
const AUTH_ROUTE = /\/auth\/(login|refresh|me|logout|register)/;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const url = original.url || "";

    if (status === 401 && !AUTH_ROUTE.test(url) && !original._retry) {
      original._retry = true;
      try {
        await api.post("/auth/refresh");
        return api(original); // rejoue la requête avec le nouveau cookie
      } catch {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Extrait un message d'erreur lisible depuis l'enveloppe backend ({ error, statusCode }).
export function getApiErrorMessage(err, fallback = "Une erreur est survenue.") {
  return err?.response?.data?.error || fallback;
}

export default api;
