"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

export default function SettingsPage() {
  const [searchTerm, setSearchTerm] = useState("");

// État pour savoir quel menu déroulant est ouvert (null si aucun)
  const [openDropdown, setOpenDropdown] = useState(null);

  // ÉTATS DES PARAMÈTRES
  // A lier a la base de données
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    privateProfile: false,
    language: "fr",
    dataSaver: false,
    location: true,
  });

  // INITIALISATION MODE SOMBRE 
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    setSettings(prev => ({ ...prev, darkMode: isDark }));
  }, []);

  // FONCTION POUR BASCULER UN PARAMÈTRE 
  const toggleSetting = (key) => {
    setSettings(prev => {
      const newValue = !prev[key];

      // SPÉCIFIQUE AU MODE SOMBRE 
      if (key === "darkMode") {
        if (newValue) {
          document.documentElement.classList.add("dark");
          localStorage.setItem("theme", "dark");
        } else {
          document.documentElement.classList.remove("dark");
          localStorage.setItem("theme", "light");
        }
      }
      return {
        ...prev,
        [key]: newValue
      };
    });
  };

  const handleSelectOption = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  // LISTE DES PARAMÈTRES MOCK DATA
  const settingsList = [
    {
      id: "darkMode",
      title: "Mode Sombre",
      description: "Activer le thème sombre de l'application.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
      )
    },
    {
      id: "notifications",
      title: "Notifications Push",
      description: "Recevoir des alertes pour les nouveaux messages et likes.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
      )
    },
    {
      id: "privateProfile",
      title: "Profil Privé",
      description: "Seuls vos abonnés peuvent voir vos publications.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
      )
    },
    {
      id: "language",
      type: "dropdown", //déroule un menu 
      title: "Langue",
      description: "Choisir la langue de l'application.",
      options: [
        { value: "fr", label: "Français" },
        { value: "en", label: "English" },
        { value: "es", label: "Español" },
      ],
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
    },
    {
      id: "dataSaver",
      title: "Économiseur de données",
      description: "Réduire la qualité des images pour économiser de la data.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      )
    },
    {
      id: "location",
      title: "Service de localisation",
      description: "Permettre d'ajouter un lieu à vos publications.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      )
    }
  ];

  // Filtrage pour la barre de recherche
  const filteredSettings = settingsList.filter(setting => 
    setting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setting.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header />
      
      <main className="flex-1 flex flex-col p-4 gap-6">
        
        {/* BARRE DE RECHERCHE */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Rechercher un paramètre..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 dark:border-steel-blue/40 bg-white dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip outline-none focus:border-steel-blue focus:ring-2 focus:ring-steel-blue/20 transition-all shadow-sm"
          />
        </div>

        {/* LISTE DES PARAMÈTRES */}
        <div className="flex flex-col gap-3">
          {filteredSettings.length > 0 ? (
            filteredSettings.map((setting) => {
              const isDropdownOpen = openDropdown === setting.id;

              return (
                <div key={setting.id} className="flex flex-col">
                  {/* BOUTON PRINCIPAL */}
                  <button 
                    onClick={() => setting.type === "dropdown" ? setOpenDropdown(isDropdownOpen ? null : setting.id) : toggleSetting(setting.id)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-steel-blue/40 bg-white dark:bg-deep-space-blue shadow-sm hover:shadow-md dark:hover:border-steel-blue/70 transition-all duration-200 text-left group z-10"
                  >
                    
                    {/* Icône paramètre */}
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-steel-blue flex-shrink-0 group-hover:scale-110 transition-transform">
                      {setting.icon}
                    </div>
                    
                    {/* Textes */}
                    <div className="flex flex-col flex-1">
                      <span className="font-bold text-deep-space-blue dark:text-papaya-whip text-base">
                        {setting.title}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                        {setting.description}
                      </span>
                    </div>

                    {/* Chevron pour derouler ou cercle pour selectionner*/}
                    <div className="flex-shrink-0 ml-2">
                      {setting.type === "dropdown" ? (
                        <div className="flex items-center gap-2 text-steel-blue dark:text-papaya-whip font-medium">
                          {/* Affiche le label de l'option actuel */}
                          <span className="text-sm">
                            {setting.options.find(opt => opt.value === settings[setting.id])?.label}
                          </span>
                          {/* petite flèche */}
                          <svg className={`w-5 h-5 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      ) : (
                        /* classique Toggle (ON/OFF) */
                        settings[setting.id] ? (
                          <div className="w-6 h-6 rounded-full bg-steel-blue flex items-center justify-center shadow-md transition-all">
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-500 transition-all group-hover:border-steel-blue/50"></div>
                        )
                      )}
                    </div>

                  </button>

                  {/* CONTENU DU MENU DÉROULANT*/}
                  {setting.type === "dropdown" && isDropdownOpen && (
                    <div className="mx-4 mt-2 p-2 bg-white dark:bg-deep-space-blue border border-gray-100 dark:border-steel-blue/30 rounded-xl shadow-inner flex flex-col gap-1">
                      {setting.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleSelectOption(setting.id, option.value)}
                          className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                            settings[setting.id] === option.value 
                              ? 'bg-steel-blue text-white' 
                              : 'text-deep-space-blue dark:text-papaya-whip hover:bg-slate-50 dark:hover:bg-white/10'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              Aucun paramètre trouvé pour "{searchTerm}"
            </div>
          )}
        </div>

      </main>
      
      <BottomNav />
    </div>
  );
}