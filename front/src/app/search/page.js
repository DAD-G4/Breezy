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

  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTrending()
      .then((data) => { if (!cancelled) setTrending(data || []); })
      .catch(() => {})
      .finally(() => {});
    return () => { cancelled = true; };
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
        mapPost(p, { authorLabel: authors[i]?.displayName, currentUserId: user?.id, locale: language })
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

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = query.trim().replace(/^#/, "");
    if (!q) return;

    router.push(`/search?q=${encodeURIComponent(q)}`, { scroll: false });

    if (activeTab === "posts") {
      await handleSearchPosts(q);
    } else {
      await handleSearchUsers(q);
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (!searched) return;

    const q = query.trim().replace(/^#/, "");
    if (!q) return;

    setError("");
    setPosts([]);
    setUsers([]);

    if (tab === "posts") {
      await handleSearchPosts(q);
    } else {
      await handleSearchUsers(q);
    }
  };

  const handleTrendingClick = async (tag) => {
    setQuery(`#${tag}`);
    setActiveTab("posts");
    router.push(`/search?q=${encodeURIComponent(tag)}`, { scroll: false });
    await handleSearchPosts(tag);
  };

  useEffect(() => {
    if (!initialQuery) return;
    const q = initialQuery.replace(/^#/, "");
    if (!q) return;

    handleSearchPosts(q);
  }, []);

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
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 dark:border-steel-blue/40 bg-white dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip outline-none focus:border-steel-blue dark:focus:border-steel-blue focus:ring-2 focus:ring-steel-blue/20 transition-all shadow-sm"
          />
        </form>

        {/* ONGLETS */}
        <div className="flex border-b border-gray-200 dark:border-steel-blue/30">
          <button
            onClick={() => handleTabChange("posts")}
            className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${
              activeTab === "posts"
                ? "text-steel-blue"
                : "text-gray-500 hover:text-deep-space-blue dark:hover:text-papaya-whip"
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
                : "text-gray-500 hover:text-deep-space-blue dark:hover:text-papaya-whip"
            }`}
          >
            {t("search.tabUsers")}
            {activeTab === "users" && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-steel-blue rounded-t-full" />
            )}
          </button>
        </div>

        {/* TENDANCES */}
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
              className="flex items-center gap-3 p-4 border border-gray-200 dark:border-steel-blue/20 rounded-xl bg-white dark:bg-deep-space-blue/60 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-steel-blue flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.display_name} className="w-full h-full object-cover" />
                ) : (
                  u.display_name?.charAt(0)?.toUpperCase() || "?"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-deep-space-blue dark:text-papaya-whip truncate">
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
