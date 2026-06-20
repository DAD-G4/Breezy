"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "../../context/ThemeContext";
import BreezyBadge from "../ui/BreezyBadge";

// Item de navigation : icône seule en tablette (md), icône + label en desktop (lg+)
function NavItem({ href, label, icon, active, onClick }) {
  const base =
    "flex items-center gap-4 px-3 py-3 rounded-full transition-colors text-deep-space-blue dark:text-papaya-whip hover:bg-black/5 dark:hover:bg-white/5 justify-center lg:justify-start";
  const state = active ? "font-bold bg-black/5 dark:bg-white/5" : "font-medium";
  const content = (
    <>
      {icon}
      <span className="hidden lg:inline text-lg">{label}</span>
    </>
  );

  // Certaines destinations n'ont pas encore de page → simple bouton (parité avec BottomNav)
  if (!href) {
    return (
      <button onClick={onClick} className={`${base} ${state} w-full`} aria-label={label}>
        {content}
      </button>
    );
  }
  return (
    <Link href={href} className={`${base} ${state}`} aria-label={label}>
      {content}
    </Link>
  );
}

export default function LeftSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const iconHome = (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  );
  const iconSearch = (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
  );
  const iconMessages = (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
  );
  const iconProfile = (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  );

  return (
    <aside className="hidden md:flex flex-col sticky top-0 h-screen w-20 lg:w-64 shrink-0 border-r border-gray-200 dark:border-white/10 bg-white dark:bg-deep-space-blue px-2 lg:px-4 py-4 gap-1">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center px-3 py-3 justify-center lg:justify-start"
      >
        <BreezyBadge className="w-14 h-14 shrink-0" />
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 mt-2">
        <NavItem href="/" label="Accueil" icon={iconHome} active={pathname === "/"} />
        <NavItem label="Recherche" icon={iconSearch} onClick={() => {}} />
        <NavItem label="Messages" icon={iconMessages} onClick={() => {}} />
        <NavItem href="/profile" label="Profil" icon={iconProfile} active={pathname?.startsWith("/profile")} />
      </nav>

      {/* Créer un post (CTA) */}
      <Link
        href="/create"
        className="mt-3 flex items-center justify-center gap-2 bg-steel-blue hover:bg-deep-space-blue dark:bg-papaya-whip dark:text-deep-space-blue dark:hover:bg-white text-white font-bold rounded-full p-3 lg:px-4 transition-colors shadow-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
        <span className="hidden lg:inline">Créer un post</span>
      </Link>

      {/* Bascule de thème (en bas) */}
      <button
        onClick={toggleTheme}
        className="mt-auto flex items-center gap-4 px-3 py-3 rounded-full transition-colors text-deep-space-blue dark:text-papaya-whip hover:bg-black/5 dark:hover:bg-white/5 justify-center lg:justify-start"
        aria-label="Changer de thème"
      >
        {theme === "dark" ? (
          <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        ) : (
          <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        )}
        <span className="hidden lg:inline font-medium">
          {theme === "dark" ? "Mode clair" : "Mode sombre"}
        </span>
      </button>
    </aside>
  );
}
