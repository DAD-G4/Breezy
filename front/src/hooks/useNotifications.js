"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getNotifications,
  markAsRead as svcMarkAsRead,
  markAllRead as svcMarkAllRead,
  deleteNotification as svcDeleteNotification,
  deleteAllRead as svcDeleteAllRead,
} from "../services/notifications";
import { getUnreadCount, getConversations } from "../services/dm";
import { resolveUser, ping } from "../services/users";
import { useAuth } from "../context/AuthContext";
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
  // Popup « nouveau message » (toast en haut).
  const [incomingMessage, setIncomingMessage] = useState(null);

  // Refs lus dans la boucle de polling (pas de redémarrage de l'intervalle).
  const { user } = useAuth();
  const pathname = usePathname();
  const userRef = useRef(user);
  userRef.current = user;
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  // Horodatage du dernier message entrant connu (anti-doublon entre polls).
  const lastSeenTsRef = useRef(0);
  const initializedRef = useRef(false);

  const dismissIncoming = useCallback(() => setIncomingMessage(null), []);

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
      // Détection d'un nouveau message entrant → popup en haut. On repère le
      // message reçu (pas de moi) le plus récent ; on déclenche la popup s'il
      // est plus récent que le dernier connu, non lu, et qu'on n'est pas déjà
      // sur la conversation concernée.
      try {
        const me = userRef.current?.id;
        const { conversations: convs } = await getConversations();
        let newest = null;
        for (const c of convs || []) {
          const lm = c.last_message;
          if (!lm || lm.sender_id === me) continue;
          const ts = new Date(lm.created_at).getTime();
          if (!newest || ts > newest.ts) {
            newest = { ts, text: lm.message_text, otherId: c.other_user_id, unread: (c.unread_count ?? 0) > 0 };
          }
        }
        if (newest && newest.ts > lastSeenTsRef.current) {
          const firstRun = !initializedRef.current;
          lastSeenTsRef.current = newest.ts;
          if (!firstRun && newest.unread) {
            const sender = await resolveUser(newest.otherId);
            const onThisConvo = pathnameRef.current === `/messages/${encodeURIComponent(sender.username)}`;
            if (active && !onThisConvo) {
              setIncomingMessage({
                id: newest.ts,
                name: sender.displayName,
                username: sender.username,
                text: newest.text,
              });
            }
          }
        }
        initializedRef.current = true;
      } catch {
        /* silencieux */
      }
      // Présence en ligne : on signale que l'utilisateur est actif.
      ping().catch(() => {});
    };

    fetchNotifications();
    // Rafraîchissement live : refetch périodique (likes, commentaires, follows…).
    const interval = setInterval(fetchNotifications, 15000);
    // Sur mobile, les navigateurs gèlent setInterval quand l'onglet passe en
    // arrière-plan. On refetch IMMÉDIATEMENT au retour de focus (sinon l'UI
    // reste figée jusqu'au prochain tick et l'utilisateur recharge à la main).
    const onVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchNotifications();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
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

  return { notifications, unreadCount, unreadMessages, incomingMessage, dismissIncoming, markRead, markAllRead, deleteNotification, deleteAllRead: deleteAllReadNotifications };
}
