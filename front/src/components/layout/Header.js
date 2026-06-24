"use client";

import Link from "next/link";
import BreezyBadge from "../ui/BreezyBadge";
import { useLanguage } from "@/context/LanguageContext";
import { useNotificationsContext } from "@/context/NotificationsContext";

export default function Header() {
  const { t } = useLanguage();
  const { unreadCount } = useNotificationsContext();

  return (
    <header className="md:hidden sticky top-0 z-50 bg-white dark:bg-surface text-deep-space-blue dark:text-papaya-whip border-b border-gray-200 dark:border-steel-blue/40 shadow-sm transition-colors duration-300">
      <div className="flex justify-between items-center px-4 h-16 relative">
        
        {/* BOUTON CREER POST */}
        <Link 
          href="/create" 
          className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
          aria-label={t('header.createPostAria')}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </Link>

        {/* LOGO BREEZY */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity absolute left-1/2 -translate-x-1/2">
          <BreezyBadge className="w-8 h-8" />
          <span className="text-xl font-bold tracking-wide hidden sm:block">Breezy</span>
        </Link>

        {/* ICONES DROITE */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* NOTIFICATIONS */}
          <Link 
            href="/notifications" 
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors relative"
            aria-label={t('header.notificationsAria')}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-3 h-3 bg-brick-red border-2 border-white dark:border-night rounded-full"></span>
            )}
          </Link>

          {/* PROFIL UTILISATEUR */}
          <Link 
            href="/profile" 
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
            aria-label={t('header.profileAria')}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
          
        </div>
      </div>
    </header>
  );
}