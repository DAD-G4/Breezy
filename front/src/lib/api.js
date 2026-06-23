"use client";

import axios from "axios";

// Base de l'API : le reverse-proxy nginx expose tous les microservices sous /api.
// Surchargeable au build via NEXT_PUBLIC_API_URL (variable inlinée par Next.js).
// Défaut = nginx local (docker-compose), port 80.
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
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
