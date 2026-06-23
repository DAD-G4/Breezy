"use client";

import Link from "next/link"; 
import BreezyBadge from "@/components/ui/BreezyBadge";
import { useLanguage } from "@/context/LanguageContext";

export default function RightSidebar() {
  const { t } = useLanguage();

  const trends = [
    { tag: "#Breezy", count: `1 240 ${t('rightSidebar.posts')}` },
    { tag: "#NextJS", count: `980 ${t('rightSidebar.posts')}` },
    { tag: "#DevWeb", count: `642 ${t('rightSidebar.posts')}` },
    { tag: "#OpenSource", count: `311 ${t('rightSidebar.posts')}` },
  ];

  const suggestions = [
    { name: "Alice", username: "alice" },
    { name: "Bob", username: "bob" },
    { name: "Charlie", username: "charlie" },
  ];

  return (
    <aside className="hidden xl:block w-80 shrink-0 px-4 py-4">
      <div className="sticky top-4 flex flex-col gap-4">
        
        {/* BARRE DE RECHERCHE */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input
            type="text"
            placeholder={t('rightSidebar.searchPlaceholder')}
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-gray-100 dark:bg-black/30 text-deep-space-blue dark:text-papaya-whip placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-steel-blue transition-all"
          />
        </div>

        {/* TENDANCES */}
        <section className="bg-white dark:bg-deep-space-blue border border-gray-200 dark:border-steel-blue/30 rounded-2xl overflow-hidden">
          <h2 className="font-bold text-lg text-deep-space-blue dark:text-papaya-whip px-4 pt-4 pb-2">
            {t('rightSidebar.trendsTitle')}
          </h2>
          <ul>
            {trends.map((tItem) => (
              <li
                key={tItem.tag}
                className="px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                <p className="font-bold text-sm text-deep-space-blue dark:text-papaya-whip">{tItem.tag}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{tItem.count}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* SUGGESTIONS */}
        <section className="bg-white dark:bg-deep-space-blue border border-gray-200 dark:border-steel-blue/30 rounded-2xl overflow-hidden">
          <h2 className="font-bold text-lg text-deep-space-blue dark:text-papaya-whip px-4 pt-4 pb-2">
            {t('rightSidebar.suggestionsTitle')}
          </h2>
          <ul>
            {suggestions.map((s) => (
              <li key={s.username} className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                
                <Link href={`/profile/${s.username}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold shrink-0 group-hover:opacity-90 transition-opacity">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-deep-space-blue dark:text-papaya-whip truncate group-hover:text-steel-blue transition-colors">{s.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{s.username}</p>
                  </div>
                </Link>
                
                <button className="ml-2 px-4 py-1.5 text-sm font-bold rounded-full bg-steel-blue text-white hover:bg-deep-space-blue transition-colors shrink-0">
                  {t('rightSidebar.followButton')}
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