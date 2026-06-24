"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  // Au chargement on vérifie si l'utilisateur avait déjà choisi un thème
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;

    // Active la transition douce uniquement le temps de la bascule, puis la retire
    // (évite d'animer survols/menus, qui doivent rester instantanés).
    root.classList.add("theme-transition");
    window.clearTimeout(toggleTheme._timer);
    toggleTheme._timer = window.setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 450);

    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    root.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);