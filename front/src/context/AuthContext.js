"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TOKEN_KEY, USER_KEY } from "../lib/api";
import * as authService from "../services/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Au chargement, on restaure la session (utilisateur) depuis le LocalStorage.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // données corrompues → on ignore
    }
    setLoading(false);
  }, []);

  // POST /api/auth/login → { data: { token, user } }
  // Stocke le JWT + l'utilisateur, met à jour le state. La redirection est
  // gérée par l'appelant (page de login) pour rester souple.
  const login = async (email, password) => {
    const { token, user: loggedUser } = await authService.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  };

  // POST /api/auth/register → 201 (pas de token : il faut ensuite se connecter).
  const register = async (credentials) => {
    await authService.register(credentials);
  };

  // Déconnexion : purge le stockage et renvoie vers /login.
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Garde de route : redirige vers /login si l'utilisateur n'est pas connecté
// (une fois la restauration de session terminée). À appeler en haut d'une page protégée.
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  return { user, loading };
}
