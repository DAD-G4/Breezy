"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/layout/AppShell";
import { useRequireAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useNotificationsContext } from "../../context/NotificationsContext";

export default function NotificationsPage() {
  useRequireAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead, deleteAllRead } =
    useNotificationsContext();

  const getNotifLink = useCallback((notif) => {
    if (notif.type === "follow") return `/profile/${notif.username}`;
    return `/post/${notif.postId}`;
  }, []);

  const handleClick = useCallback(
    async (notif) => {
      const link = getNotifLink(notif);
      // On marque comme lue (sans supprimer) puis on navigue.
      if (notif.unread) markRead(notif.id);
      router.push(link);
    },
    [getNotifLink, markRead, router],
  );

  const handleClearRead = useCallback(async () => {
    await deleteAllRead();
  }, [deleteAllRead]);

  return (
    <AppShell>
      <div className="flex flex-col p-4 gap-6">
        <div className="flex items-center justify-between px-1">
          <h1 className="font-bold text-xl text-deep-space-blue dark:text-papaya-whip">
            {t("sidebar.notifications")}
          </h1>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-sm font-medium text-steel-blue hover:underline"
              >
                {t("header.markAllRead")}
              </button>
            )}
            <button
              onClick={handleClearRead}
              className="text-sm font-medium text-brick-red hover:underline"
            >
              {t("notifications.clearRead") ?? "Clear read"}
            </button>
          </div>
        </div>

        {notifications.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-12">
            {t("notifications.empty") ?? "No notifications yet."}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 text-left w-full hover:shadow-md ${
                notif.unread
                  ? "border-steel-blue/50 dark:border-steel-blue bg-blue-50/50 dark:bg-steel-blue/10"
                  : "border-gray-100 dark:border-steel-blue/20 bg-white dark:bg-surface"
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold shrink-0">
                {notif.avatar}
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-sm text-deep-space-blue dark:text-papaya-whip leading-snug">
                  <span className="font-bold mr-1">{notif.user}</span>
                  <span className="opacity-90">{notif.action}</span>
                </p>
                <span
                  className={`text-xs mt-1 ${
                    notif.unread
                      ? "text-steel-blue font-semibold"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {notif.time}
                </span>
              </div>

              {notif.unread && (
                <div className="w-2.5 h-2.5 rounded-full bg-steel-blue mt-2 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
