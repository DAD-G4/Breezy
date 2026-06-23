"use client";

import { useEffect, useState } from "react";
import PostCard from "../components/feed/PostCard";
import AppShell from "../components/layout/AppShell";
import { getApiErrorMessage } from "../lib/api";
import { mapPost } from "../lib/mappers";
import { getFeed } from "../services/posts";
import { resolveUser } from "../services/users";
import { useAuth, useRequireAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function FeedPage() {
  useRequireAuth();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // On attend la fin de la restauration de session avant de décider.
    if (authLoading) return;

    if (!user) {
      setError(t('feed.loginRequired'));
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        // Feed des utilisateurs suivis (paginé).
        const { posts: raw } = await getFeed();
        // Le backend renvoie user_id (pas le nom) → on résout chaque auteur.
        const mapped = await Promise.all(
          raw.map(async (p) => {
            const author = await resolveUser(p.user_id);
            return mapPost(p, { authorLabel: author.displayName, currentUserId: user.id, locale: language });
          })
        );
        if (active) setPosts(mapped);
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, t('feed.loadError')));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  return (
    <AppShell>
      {/* En-tête de section, collant en haut du feed sur desktop */}
      <div className="sticky top-0 z-30 bg-slate-50/80 dark:bg-deep-space-blue/80 backdrop-blur border-b border-gray-200 dark:border-white/10 px-4 py-3 hidden md:block">
        <h1 className="font-bold text-xl text-deep-space-blue dark:text-papaya-whip">{t('sidebar.home')}</h1>
      </div>

      <div className="flex flex-col p-4 gap-4">
        {loading && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('feed.loading')}</p>
        )}

        {!loading && error && (
          <p className="text-center text-brick-red font-semibold py-8">{error}</p>
        )}

        {!loading && !error && posts.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            {t('feed.empty')}
          </p>
        )}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </AppShell>
  );
}
