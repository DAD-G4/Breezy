"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getBlockedUsers, unblockUser } from "@/services/users";
import { useAuth, useRequireAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function BlockedUsersPage() {
  useRequireAuth();
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getBlockedUsers()
      .then((users) => setBlockedUsers(users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleUnblock = async (userId) => {
    try {
      await unblockUser(userId);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("[Blocked] Failed to unblock user:", err);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col p-4 gap-6">
        {/* En-tête avec retour */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.back()}
            className="p-2 text-steel-blue hover:text-deep-space-blue dark:hover:text-papaya-whip hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
            aria-label={t("common.back") || "Retour"}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="font-bold text-xl text-deep-space-blue dark:text-papaya-whip">
            {t("settingsPage.blockedUsers.title")}
          </h1>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 px-1 -mt-3">
          {t("settingsPage.blockedUsers.desc")}
        </p>

        <div className="flex flex-col gap-3">
          {loading && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t("common.loading")}</p>
          )}

          {!loading && blockedUsers.length === 0 && (
            <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">
              {t("settingsPage.blockedUsers.empty")}
            </p>
          )}

          {!loading && blockedUsers.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 p-4 border border-gray-200 dark:border-steel-blue/20 rounded-xl bg-white dark:bg-surface/70"
            >
              <Link
                href={`/profile/${u.username}`}
                className="flex items-center gap-3 flex-1 min-w-0 group"
              >
                <div className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.display_name} className="w-full h-full object-cover" />
                  ) : (
                    u.display_name?.charAt(0)?.toUpperCase() || "?"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-deep-space-blue dark:text-papaya-whip truncate group-hover:underline">
                    {u.display_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{u.username}</p>
                </div>
              </Link>
              <button
                onClick={() => handleUnblock(u.id)}
                className="px-4 py-2 text-sm font-semibold rounded-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors shrink-0"
              >
                {t("settingsPage.blockedUsers.unblock")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
