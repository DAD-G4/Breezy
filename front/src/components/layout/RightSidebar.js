"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { getTrending } from "@/services/tags";
import { getSuggestions, follow } from "@/services/users";

export default function RightSidebar() {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [trends, setTrends] = useState([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    getTrending()
      .then((data) => { if (!cancelled) setTrends((data || []).slice(0, 5)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setTrendsLoading(false); });
    getSuggestions()
      .then((data) => { if (!cancelled) setSuggestions(data || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleFollow = async (userId) => {
    setFollowingIds((prev) => new Set(prev).add(userId)); // optimiste
    try {
      await follow(userId);
      // une fois suivi, on retire la suggestion de la liste
      setTimeout(() => setSuggestions((prev) => prev.filter((u) => u.id !== userId)), 600);
    } catch (err) {
      console.error("[RightSidebar] Failed to follow:", err);
      setFollowingIds((prev) => { const n = new Set(prev); n.delete(userId); return n; });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setQuery("");
  };

  return (
    <aside className="hidden xl:block w-80 shrink-0 px-4 py-4">
      <div className="sticky top-4 flex flex-col gap-4">
        
        {/* BARRE DE RECHERCHE */}
        <form onSubmit={handleSearch} className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('rightSidebar.searchPlaceholder')}
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-gray-100 dark:bg-black/30 text-deep-space-blue dark:text-papaya-whip placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-steel-blue transition-all"
          />
        </form>

        {/* TENDANCES */}
        <section className="bg-white dark:bg-deep-space-blue border border-gray-200 dark:border-steel-blue/30 rounded-2xl overflow-hidden">
          <h2 className="font-bold text-lg text-deep-space-blue dark:text-papaya-whip px-4 pt-4 pb-2">
            {t('rightSidebar.trendsTitle')}
          </h2>
          <ul>
            {trendsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <li key={`skeleton-${i}`} className="px-4 py-3 animate-pulse">
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10 mb-1.5" />
                    <div className="h-3 w-16 rounded bg-gray-100 dark:bg-white/5" />
                  </li>
                ))
              : trends.map((tItem) => (
                  <li key={tItem.tag}>
                    <Link
                      href={`/search?q=${encodeURIComponent(tItem.tag)}`}
                      className="block px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <p className="font-bold text-sm text-deep-space-blue dark:text-papaya-whip">
                        #{tItem.tag}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {tItem.count} {t('rightSidebar.posts')}
                      </p>
                    </Link>
                  </li>
                ))
            }
          </ul>
        </section>

        {/* SUGGESTIONS */}
        {suggestions.length > 0 && (
          <section className="bg-white dark:bg-deep-space-blue border border-gray-200 dark:border-steel-blue/30 rounded-2xl overflow-hidden">
            <h2 className="font-bold text-lg text-deep-space-blue dark:text-papaya-whip px-4 pt-4 pb-2">
              {t('rightSidebar.suggestionsTitle')}
            </h2>
            <ul>
              {suggestions.map((s) => {
                const isFollowed = followingIds.has(s.id);
                return (
                  <li key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">

                    <Link href={`/profile/${s.username}`} className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold shrink-0 overflow-hidden group-hover:opacity-90 transition-opacity">
                        {s.avatar_url ? (
                          <img src={s.avatar_url} alt={s.display_name} className="w-full h-full object-cover" />
                        ) : (
                          (s.display_name || s.username).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-deep-space-blue dark:text-papaya-whip truncate group-hover:text-steel-blue transition-colors">{s.display_name || s.username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{s.username}</p>
                      </div>
                    </Link>

                    <button
                      onClick={() => handleFollow(s.id)}
                      disabled={isFollowed}
                      className={`ml-2 px-4 py-1.5 text-sm font-bold rounded-full transition-colors shrink-0 ${
                        isFollowed
                          ? "bg-gray-100 dark:bg-white/10 text-deep-space-blue dark:text-papaya-whip border border-gray-200 dark:border-white/20"
                          : "bg-steel-blue text-white hover:bg-deep-space-blue"
                      }`}
                    >
                      {isFollowed ? t('profileView.following') : t('rightSidebar.followButton')}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <p className="px-4 text-xs text-gray-400">
          © 2026 Breezy
        </p>
      </div>
    </aside>
  );
}