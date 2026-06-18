"use client";

import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // État pour ouvrir/fermer menu burger

  return (
    <>
      {/* navbar*/}
      <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-papaya-whip/20 bg-white dark:bg-deep-space-blue z-40 relative">
        
        {/*  Menu Burger */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-deep-space-blue dark:text-papaya-whip" 
          aria-label="Ouvrir le menu"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <span className="font-bold text-xl text-deep-space-blue dark:text-papaya-whip flex items-center gap-2">
          🍃 Breezy
        </span>

        {/* Icône Profil */}
        <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-deep-space-blue dark:text-papaya-whip" aria-label="Profil">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </header>

      {/* drawer du menu burger */}
      {/* Fond sombre transparent qui couvre tout l'écran quand le menu est ouvert */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setIsMenuOpen(false)} // Ferme le menu si on clique dans le vide
        />
      )}

      {/* glisse depuis la gauche */}
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-deep-space-blue z-50 transform transition-transform duration-300 ease-in-out shadow-2xl border-r border-gray-200 dark:border-white/10 flex flex-col ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* En-tête du menu avec bouton fermeture */}
        <div className="p-4 border-b border-gray-200 dark:border-papaya-whip/20 flex justify-between items-center">
          <span className="font-bold text-lg text-deep-space-blue dark:text-papaya-whip">Menu</span>
          <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-500 hover:text-brick-red transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Liens et actions du menu */}
        <nav className="flex-1 p-4 space-y-4">
          
          {/* Créer un post */}
          <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-deep-space-blue dark:text-papaya-whip transition-colors text-left font-medium">
            <svg className="w-6 h-6 text-steel-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Créer un post
          </button>

          {/* Thème Sombre/Clair */}
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-deep-space-blue dark:text-papaya-whip transition-colors text-left font-medium"
          >
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
              Mode Sombre
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${theme === "dark" ? "bg-steel-blue" : "bg-gray-300"}`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0"}`} />
            </div>
          </button>

        </nav>
      </div>
    </>
  );
}