"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as authService from "../services/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .me()
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {
        // Not authenticated or cookie expired — stay null
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data.user;
  };

  const register = async (credentials) => {
    const data = await authService.register(credentials);
    if (data?.user) setUser(data.user);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Best effort — clear local state even if request fails
    }
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
