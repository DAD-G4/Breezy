"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "../../components/layout/AppShell";
import PostCard from "../../components/feed/PostCard";
import { getApiErrorMessage } from "../../lib/api";
import { mapPost } from "../../lib/mappers";
import { searchByTag, getTrending } from "../../services/tags";
import { searchUsers, resolveUsers } from "../../services/users";
import { useAuth, useRequireAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

function SearchContent() {
  useRequireAuth();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Terme courant lu dans l'URL — réactif : change à chaque navigation /search?q=...
  const urlQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(urlQuery);
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [trending, setTrending] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Tendances (tags) + quelques posts tendance à afficher quand on ne cherche pas.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getTrending();
        const tags = (data || []).slice(0, 5);
        if (!cancelled) setTrending(tags);
        if (tags[0]) {
          const { posts: raw } = await searchByTag(tags[0].tag);
          const ids = (raw || []).map((p) => p.user_id);
          const authors = await resolveUsers(ids);
          const mapped = (raw || []).slice(0, 4).map((p, i) =>
            mapPost(p, { authorLabel: authors[i]?.displayName, authorHandle: authors[i]?.username, avatarUrl: authors[i]?.avatarUrl, currentUserId: user?.id, locale: language })
          );
          if (!cancelled) setTrendingPosts(mapped);
        }
      } catch {
        /* silencieux */
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchPosts = useCallback(async (q) => {
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const { posts: raw } = await searchByTag(q);
      const userIds = (raw || []).map((p) => p.user_id);
      const authors = await resolveUsers(userIds);
      const mapped = (raw || []).map((p, i) =>
        mapPost(p, { authorLabel: authors[i]?.displayName, authorHandle: authors[i]?.username, avatarUrl: authors[i]?.avatarUrl, currentUserId: user?.id, locale: language })
      );
      setPosts(mapped);
    } catch (err) {
      setError(getApiErrorMessage(err, t("search.error")));
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, language, t]);

  const handleSearchUsers = useCallback(async (q) => {
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const results = await searchUsers(q);
      setUsers(results || []);
    } catch (err) {
      setError(getApiErrorMessage(err, t("search.error")));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // La soumission met juste l'URL à jour (lien partageable). La recherche
  // elle-même est déclenchée en live par l'effet debouncé ci-dessous.
  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim().replace(/^#/, "");
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab); // l'effet debouncé relance la recherche sur le bon onglet
  };

  const handleTrendingClick = (tag) => {
    setActiveTab("posts");
    setQuery(`#${tag}`);
  };

  // Annule la recherche : vide le champ et l'URL.
  const handleClear = () => {
    setQuery("");
    router.push("/search", { scroll: false });
  };

  // Synchronise le champ avec l'URL (lien partagé, clic d'une tendance depuis
  // la barre latérale alors qu'on est déjà sur /search).
  useEffect(() => {
    if (urlQuery) setQuery(urlQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  // Recherche LIVE (au fil de la frappe) avec debounce, sur l'onglet actif.
  useEffect(() => {
    const q = query.trim().replace(/^#/, "");
    if (!q) {
      setSearched(false);
      setPosts([]);
      setUsers([]);
      setError("");
      return;
    }
    const timer = setTimeout(() => {
      if (activeTab === "users") {
        handleSearchUsers(q);
      } else {
        handleSearchPosts(q);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, activeTab, handleSearchPosts, handleSearchUsers]);

  return (
    <AppShell>
      <div className="flex flex-col p-4 gap-5">
        {/* BARRE DE RECHERCHE */}
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-11 py-3 rounded-full border border-gray-200 dark:border-steel-blue/40 bg-white dark:bg-black/20 text-deep-space-blue dark:text-white outline-none focus:border-steel-blue dark:focus:border-steel-blue focus:ring-2 focus:ring-steel-blue/20 transition-all shadow-sm"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={t("search.clear") || "Effacer"}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-deep-space-blue dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </form>

        {/* ONGLETS */}
        <div className="flex border-b border-gray-200 dark:border-steel-blue/30">
          <button
            onClick={() => handleTabChange("posts")}
            className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${
              activeTab === "posts"
                ? "text-steel-blue"
                : "text-gray-500 hover:text-deep-space-blue dark:hover:text-white"
            }`}
          >
            {t("search.tabPosts")}
            {activeTab === "posts" && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-steel-blue rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => handleTabChange("users")}
            className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${
              activeTab === "users"
                ? "text-steel-blue"
                : "text-gray-500 hover:text-deep-space-blue dark:hover:text-white"
            }`}
          >
            {t("search.tabUsers")}
            {activeTab === "users" && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-steel-blue rounded-t-full" />
            )}
          </button>
        </div>

        {/* TENDANCES (tags) — uniquement quand on ne cherche pas */}
        {!searched && trending.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t("search.trending")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {trending.map((item) => (
                <button
                  key={item.tag}
                  onClick={() => handleTrendingClick(item.tag)}
                  className="px-3 py-1.5 text-sm font-medium rounded-full bg-steel-blue/10 text-steel-blue hover:bg-steel-blue/20 transition-colors"
                >
                  #{item.tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* POSTS TENDANCE — aperçu quand on ne cherche pas */}
        {!searched && trendingPosts.length > 0 && (
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              {t("search.trendingPosts")}
            </h2>
            {trendingPosts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={user?.id} />
            ))}
          </div>
        )}

        {/* RESULTATS */}
        <div className="flex flex-col gap-4">
          {loading && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t("common.loading")}</p>
          )}
          {!loading && error && (
            <p className="text-center text-brick-red font-semibold py-8">{error}</p>
          )}
          {!loading && !error && searched && activeTab === "posts" && posts.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t("search.noResults")} « {query.trim().replace(/^#/, "")} ».
            </p>
          )}
          {!loading && !error && searched && activeTab === "users" && users.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t("search.noResults")} « {query.trim().replace(/^#/, "")} ».
            </p>
          )}

          {/* Résultats posts */}
          {!loading && !error && activeTab === "posts" && posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              onDelete={(postId) => setPosts((prev) => prev.filter((p) => p.id !== postId))}
              onUpdate={(postId, content) =>
                setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, content } : p)))
              }
            />
          ))}

          {/* Résultats utilisateurs */}
          {!loading && !error && activeTab === "users" && users.map((u) => (
            <Link
              key={u.id}
              href={`/profile/${u.username}`}
              className="flex items-center gap-3 p-4 border border-gray-200 dark:border-steel-blue/20 rounded-xl bg-white dark:bg-surface/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-steel-blue flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.display_name} className="w-full h-full object-cover" />
                ) : (
                  u.display_name?.charAt(0)?.toUpperCase() || "?"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-deep-space-blue dark:text-white truncate">
                  {u.display_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{u.username}</p>
                {u.bio && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{u.bio}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<AppShell><div className="flex items-center justify-center py-16"><p className="text-gray-500 dark:text-gray-400">Loading...</p></div></AppShell>}>
      <SearchContent />
    </Suspense>
  );
}
