"use client";

import { createContext, useContext, useState, useEffect } from "react";
import fr from "@/locales/fr.json";
import en from "@/locales/en.json";
import es from "@/locales/es.json";

// groupe les dictionnaires
const dictionaries = { fr, en, es };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("fr");

  // on vérifie si l'utilisateur avait déjà choisi qq chose
  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang && dictionaries[savedLang]) {
      setLanguage(savedLang);
    }
  }, []);

  // pour changer la langue
  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("language", lang); // On sauvegarde
  };

  // fonction traduction
  // Exemple : t("sidebar.home")
  const t = (key) => {
    const keys = key.split(".");
    let value = dictionaries[language];
    
    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }
    
    return value || key; // Si on ne trouve pas la trad, on affiche default
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook pour utlilisation
export const useLanguage = () => useContext(LanguageContext);