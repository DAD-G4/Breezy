import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-deep-space-blue text-deep-space-blue dark:text-papaya-whip border-b border-gray-200 dark:border-steel-blue/40 shadow-sm transition-colors duration-300">
      <div className="flex justify-between items-center px-4 h-16">
        
        {/* BOUTON "CRÉER UN POST"*/}
        <Link 
          href="/create" 
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Créer un post"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </Link>

        {/* LOGO BREEZY */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {/* A remplacer par le logo */}
          <svg className="w-8 h-8 text-papaya-whip" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          <span className="text-xl font-bold tracking-wide">Breezy</span>
        </Link>

        {/* PROFIL UTILISATEUR */}
        <Link 
          href="/profile" 
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
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