"use client"; //on utilise un hook useTheme

import { useTheme } from "../context/ThemeContext";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8">
        Bienvenue sur Breezy !
      </h1>
      
      <p className="mb-8 text-lg text-slate-500 dark:text-slate-400">
        Thème actuel : <span className="font-semibold uppercase">{theme}</span>
      </p>

      {/* Bouton pour tester Fx23 light/dark mode */}
      <button
        onClick={toggleTheme}
        className="px-6 py-3 rounded-full bg-sky-500 text-white font-semibold shadow-lg hover:bg-sky-400 transition-all duration-300 transform hover:scale-105 active:scale-95"
      >
        Basculer le thème
      </button>
    </div>
  );
}