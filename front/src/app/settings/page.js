"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { updateSettings } from "@/services/users";
import { useAuth, useRequireAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingsPage() {
  useRequireAuth();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage, t } = useLanguage();

  const persist = (fields) => {
    if (!user?.id) return;
    updateSettings(user.id, fields).catch(() => {});
  };

  const [darkMode, setDarkMode] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("fr");
  const [openDropdown, setOpenDropdown] = useState(false);

  useEffect(() => {
    setDarkMode(theme === "dark");
    setSelectedLanguage(language);
  }, [theme, language]);

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    toggleTheme();
    persist({ theme_preference: newValue ? "dark" : "light" });
  };

  const handleLanguageChange = (value) => {
    setSelectedLanguage(value);
    setOpenDropdown(false);
    changeLanguage(value);
    persist({ language_preference: value });
  };

  const languageOptions = [
    { value: "fr", label: "Français" },
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
  ];

  const selectedLabel = languageOptions.find(opt => opt.value === selectedLanguage)?.label;

  return (
    <AppShell>
      <div className="flex flex-col p-4 gap-6">

        {/* DARK MODE TOGGLE */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-steel-blue/40 bg-white dark:bg-surface shadow-sm hover:shadow-md dark:hover:border-steel-blue/70 transition-all duration-200 text-left group"
        >
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-steel-blue flex-shrink-0 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>

          <div className="flex flex-col flex-1">
            <span className="font-bold text-deep-space-blue dark:text-white text-base">
              {t('settingsPage.darkMode.title')}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
              {t('settingsPage.darkMode.desc')}
            </span>
          </div>

          <div className="flex-shrink-0 ml-2">
            {darkMode ? (
              <div className="w-6 h-6 rounded-full bg-steel-blue flex items-center justify-center shadow-md transition-all">
                <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-500 transition-all group-hover:border-steel-blue/50"></div>
            )}
          </div>
        </button>

        {/* LANGUAGE DROPDOWN */}
        <div className="flex flex-col">
          <button
            onClick={() => setOpenDropdown(!openDropdown)}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-steel-blue/40 bg-white dark:bg-surface shadow-sm hover:shadow-md dark:hover:border-steel-blue/70 transition-all duration-200 text-left group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-steel-blue flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>

            <div className="flex flex-col flex-1">
              <span className="font-bold text-deep-space-blue dark:text-white text-base">
                {t('settingsPage.language.title')}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                {t('settingsPage.language.desc')}
              </span>
            </div>

            <div className="flex-shrink-0 ml-2 flex items-center gap-2 text-steel-blue dark:text-white font-medium">
              <span className="text-sm">{selectedLabel}</span>
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${openDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {openDropdown && (
            <div className="mx-4 mt-2 p-2 bg-white dark:bg-surface border border-gray-100 dark:border-steel-blue/30 rounded-xl shadow-inner flex flex-col gap-1">
              {languageOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleLanguageChange(option.value)}
                  className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedLanguage === option.value
                      ? 'bg-steel-blue text-white'
                      : 'text-deep-space-blue dark:text-white hover:bg-slate-50 dark:hover:bg-white/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LOGOUT BUTTON */}
        <button
          onClick={logout}
          className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-steel-blue/40 bg-white dark:bg-surface shadow-sm hover:shadow-md dark:hover:border-steel-blue/70 transition-all duration-200 text-left group"
        >
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-steel-blue flex-shrink-0 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>

          <div className="flex flex-col flex-1">
            <span className="font-bold text-deep-space-blue dark:text-white text-base">
              {t('settingsPage.logout.title')}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
              {t('settingsPage.logout.desc')}
            </span>
          </div>
        </button>

        {/* BLOCKED USERS → page dédiée */}
        <Link
          href="/settings/blocked"
          className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-steel-blue/40 bg-white dark:bg-surface shadow-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-steel-blue flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div className="flex flex-col flex-1">
            <span className="font-bold text-deep-space-blue dark:text-white text-base">
              {t('settingsPage.blockedUsers.title')}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
              {t('settingsPage.blockedUsers.desc')}
            </span>
          </div>
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

      </div>
    </AppShell>
  );
}
