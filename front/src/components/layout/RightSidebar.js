"use client";

import BreezyBadge from "../ui/BreezyBadge";

// Colonne droite : visible uniquement sur très grand écran (xl+).
// Contenu de démonstration — à brancher plus tard sur /api/tags et les suggestions.
export default function RightSidebar() {
  const trends = [
    { tag: "#Breezy", count: "1 240 posts" },
    { tag: "#NextJS", count: "980 posts" },
    { tag: "#DevWeb", count: "642 posts" },
    { tag: "#OpenSource", count: "311 posts" },
  ];

  const suggestions = [
    { name: "Alice", username: "alice" },
    { name: "Bob", username: "bob" },
    { name: "Charlie", username: "charlie" },
  ];

  return (
    <aside className="hidden xl:block w-80 shrink-0 px-4 py-4">
      <div className="sticky top-4 flex flex-col gap-4">
        {/* Barre de recherche */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input
            type="text"
            placeholder="Rechercher"
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-gray-100 dark:bg-black/30 text-deep-space-blue dark:text-papaya-whip placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-steel-blue transition-all"
          />
        </div>

        {/* Tendances */}
        <section className="bg-white dark:bg-deep-space-blue border border-gray-200 dark:border-steel-blue/30 rounded-2xl overflow-hidden">
          <h2 className="font-bold text-lg text-deep-space-blue dark:text-papaya-whip px-4 pt-4 pb-2">
            Tendances
          </h2>
          <ul>
            {trends.map((t) => (
              <li
                key={t.tag}
                className="px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                <p className="font-bold text-sm text-deep-space-blue dark:text-papaya-whip">{t.tag}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.count}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Suggestions à suivre */}
        <section className="bg-white dark:bg-deep-space-blue border border-gray-200 dark:border-steel-blue/30 rounded-2xl overflow-hidden">
          <h2 className="font-bold text-lg text-deep-space-blue dark:text-papaya-whip px-4 pt-4 pb-2">
            Suggestions
          </h2>
          <ul>
            {suggestions.map((s) => (
              <li key={s.username} className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold shrink-0">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-deep-space-blue dark:text-papaya-whip truncate">{s.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{s.username}</p>
                  </div>
                </div>
                <button className="ml-2 px-4 py-1.5 text-sm font-bold rounded-full bg-steel-blue text-white hover:bg-deep-space-blue transition-colors shrink-0">
                  Suivre
                </button>
              </li>
            ))}
          </ul>
        </section>

        <p className="px-4 text-xs text-gray-400 flex items-center gap-1.5">
          © 2026 Breezy <BreezyBadge className="w-5 h-5" />
        </p>
      </div>
    </aside>
  );
}
