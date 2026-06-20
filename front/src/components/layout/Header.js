import Link from "next/link";
import BreezyBadge from "../ui/BreezyBadge";

export default function Header() {
  return (
    <header className="md:hidden sticky top-0 z-50 bg-white dark:bg-deep-space-blue text-deep-space-blue dark:text-papaya-whip border-b border-gray-200 dark:border-steel-blue/40 shadow-sm transition-colors duration-300">
      <div className="flex justify-between items-center px-4 h-16">

        {/* BOUTON "CRÉER UN POST"*/}
        <Link
          href="/create"
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
          aria-label="Créer un post"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </Link>

        {/* LOGO BREEZY */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <BreezyBadge className="w-9 h-9" />
          <span className="text-xl font-bold tracking-wide">Breezy</span>
        </Link>

        {/* PROFIL UTILISATEUR */}
        <Link
          href="/profile"
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
          aria-label="Mon profil"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Link>

      </div>
    </header>
  );
}
