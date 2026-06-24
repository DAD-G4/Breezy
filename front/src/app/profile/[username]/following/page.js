"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import { getApiErrorMessage } from "@/lib/api";
import { getProfileByUsername, getFollowing, follow, unfollow } from "@/services/users";
import { useAuth, useRequireAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

function UserCard({ u, currentUserId, onFollowChange, t }) {
  const [isFollowing, setIsFollowing] = useState(true);
  const [loading, setLoading] = useState(false);
  const isSelf = u.id === currentUserId;

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    const prev = isFollowing;
    setIsFollowing(!prev);
    try {
      if (prev) await unfollow(u.id);
      else await follow(u.id);
      onFollowChange?.();
    } catch {
      setIsFollowing(prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-steel-blue/20 rounded-xl bg-white dark:bg-surface/70">
      <Link href={`/profile/${u.username}`} className="flex-shrink-0">
        <div className="w-11 h-11 rounded-full bg-steel-blue flex items-center justify-center text-white text-sm font-bold overflow-hidden">
          {u.avatar_url ? (
            <img src={u.avatar_url} alt={u.display_name} className="w-full h-full object-cover" />
          ) : (
            u.display_name?.charAt(0)?.toUpperCase() || "?"
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/profile/${u.username}`} className="block">
          <p className="font-bold text-sm text-deep-space-blue dark:text-white truncate hover:underline">
            {u.display_name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{u.username}</p>
        </Link>
      </div>

      {!isSelf && (
        <button
          onClick={toggle}
          disabled={loading}
          className={`px-4 py-1.5 text-xs rounded-full font-bold transition-all duration-300 flex-shrink-0 ${
            isFollowing
              ? "bg-gray-100 dark:bg-white/10 text-deep-space-blue dark:text-white border border-gray-200 dark:border-white/20"
              : "bg-steel-blue text-white hover:bg-deep-space-blue shadow-md"
          }`}
        >
          {isFollowing ? t("profileView.following") : t("profileView.follow")}
        </button>
      )}
    </div>
  );
}

export default function FollowingPage({ params }) {
  useRequireAuth();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const resolvedParams = use(params);
  const username = decodeURIComponent(resolvedParams.username);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFollowing = async () => {
    setLoading(true);
    setError("");
    try {
      const u = await getProfileByUsername(username);
      const data = await getFollowing(u.id);
      setUsers(data.users || []);
    } catch (err) {
      setError(getApiErrorMessage(err, t("profile.notFound")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowing();
  }, [username]);

  return (
    <AppShell>
      <div className="p-4 flex flex-col gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-steel-blue hover:text-deep-space-blue dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all w-fit"
          aria-label={t("common.back")}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <h1 className="text-xl font-bold text-deep-space-blue dark:text-white">
          {t("profileView.followingLabel")}
        </h1>

        {loading && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t("common.loading")}</p>
        )}
        {!loading && error && (
          <p className="text-center text-brick-red font-semibold py-8">{error}</p>
        )}
        {!loading && !error && users.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t("followingPage.empty")}</p>
        )}
        {!loading && !error && users.length > 0 && (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <UserCard
                key={u.id}
                u={u}
                currentUserId={user?.id}
                onFollowChange={fetchFollowing}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
