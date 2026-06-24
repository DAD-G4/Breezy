"use client";
import { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  markAsRead as svcMarkAsRead,
  markAllRead as svcMarkAllRead,
  deleteNotification as svcDeleteNotification,
  deleteAllRead as svcDeleteAllRead,
} from "../services/notifications";
import { getUnreadCount } from "../services/dm";
import { resolveUser, ping } from "../services/users";
import { relativeTime } from "../lib/mappers";

const ACTION_KEY = {
  like: "header.notif.liked",
  follow: "header.notif.followed",
  mention: "header.notif.mentioned",
  comment: "header.notif.commented",
};

export function useNotifications(t, locale) {
  const [notifications, setNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchNotifications = async () => {
      try {
        const { notifications: raw } = await getNotifications();
        const mapped = await Promise.all(
          (raw || []).map(async (n) => {
            const sender = await resolveUser(n.sender_id);
            return {
              id: n._id,
              type: n.type,
              postId: n.post_id,
              username: sender.username,
              user: sender.displayName,
              avatar: (sender.displayName || "?").charAt(0).toUpperCase(),
              action: t(ACTION_KEY[n.type] || ACTION_KEY.like),
              time: relativeTime(n.created_at, locale),
              unread: !n.is_read,
            };
          })
        );
        if (active) setNotifications(mapped);
      } catch (err) {
        console.error('[Notifications] Failed to fetch:', err);
      }
      // Compteur de messages privés non lus (pour la pastille rouge).
      try {
        const { unreadCount } = await getUnreadCount();
        if (active) setUnreadMessages(unreadCount || 0);
      } catch {
        /* silencieux */
      }
      // Présence en ligne : on signale que l'utilisateur est actif.
      ping().catch(() => {});
    };

    fetchNotifications();
    // Rafraîchissement live : refetch périodique (likes, commentaires, follows…).
    const interval = setInterval(fetchNotifications, 25000);
    return () => {
      active = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = useCallback(async () => {
    const ids = notifications.filter((n) => n.unread).map((n) => n.id);
    if (ids.length === 0) return;
    setNotifications((ns) => ns.map((n) => ({ ...n, unread: false })));
    await svcMarkAllRead(ids);
  }, [notifications]);

  // Marque UNE notification comme lue (sans la supprimer).
  const markRead = useCallback(async (id) => {
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    await svcMarkAsRead(id).catch(() => {});
  }, []);

  const deleteNotification = useCallback(async (id) => {
    setNotifications((ns) => ns.filter((n) => n.id !== id));
    await svcDeleteNotification(id);
  }, []);

  const deleteAllReadNotifications = useCallback(async () => {
    setNotifications((ns) => ns.filter((n) => n.unread));
    await svcDeleteAllRead();
  }, []);

  return { notifications, unreadCount, unreadMessages, markRead, markAllRead, deleteNotification, deleteAllRead: deleteAllReadNotifications };
}
