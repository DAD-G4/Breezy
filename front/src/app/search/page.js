"use client";

import { useState } from "react";
import AppShell from "../../components/layout/AppShell";
import PostCard from "../../components/feed/PostCard";
import { getApiErrorMessage } from "../../lib/api";
import { mapPost } from "../../lib/mappers";
import { searchByTag } from "../../services/tags";
import { resolveUser } from "../../services/users";
import { useAuth, useRequireAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export default function SearchPage() {
  useRequireAuth();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Fx13 — Recherche de posts via un tag : GET /api/tags/search?q=
  const handleSearch = async (e) => {
    e.preventDefault();
    const q = query.trim().replace(/^#/, "");
    if (!q) return;

    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const { posts: raw } = await searchByTag(q);
      const mapped = await Promise.all(
        (raw || []).map(async (p) => {
          const author = await resolveUser(p.user_id);
          return mapPost(p, { authorLabel: author.displayName, currentUserId: user?.id, locale: language });
        })
      );
      setPosts(mapped);
    } catch (err) {
      setError(getApiErrorMessage(err, "Recherche impossible."));
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col p-4 gap-6">
        {/* BARRE DE RECHERCHE */}
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 dark:border-steel-blue/40 bg-white dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip outline-none focus:border-steel-blue dark:focus:border-steel-blue focus:ring-2 focus:ring-steel-blue/20 transition-all shadow-sm"
          />
        </form>

        {/* RESULTATS */}
        <div className="flex flex-col gap-4">
          {loading && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('common.loading')}</p>
          )}
          {!loading && error && (
            <p className="text-center text-brick-red font-semibold py-8">{error}</p>
          )}
          {!loading && !error && searched && posts.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('search.noResults')} « {query.trim().replace(/^#/, "")} ».
            </p>
          )}
          {!loading && !error && posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
