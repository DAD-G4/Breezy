"use client"; // on utilise des hooks interactifs useState / useEffect

import { createContext, useContext, useEffect, useState } from "react";

// On crée le Context
const ThemeContext = createContext();

// On crée le  Provider qui va englober l'app
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

  // fonction pour basculer d'un mode à l'autre
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme); // On sauvegarde le choix en localstorrage
    
    // On ajoute / enlève la classe dark sur la balise html
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (  // On envoie le theme et la fonction de bascule a tous les composants enfants
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// On crée un Custom Hook pour simplifier l'utilisation apres
export const useTheme = () => useContext(ThemeContext);