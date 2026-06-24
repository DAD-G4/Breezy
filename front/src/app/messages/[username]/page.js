"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getApiErrorMessage } from "@/lib/api";
import { getProfileByUsername } from "@/services/users";
import { getConversation, sendMessage, markConversationRead } from "@/services/dm";
import { useAuth, useRequireAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { relativeTime } from "@/lib/mappers";

export default function ConversationPage({ params }) {
  useRequireAuth();
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const resolvedParams = use(params);
  const username = decodeURIComponent(resolvedParams.username);

  const [otherUser, setOtherUser] = useState(null); // { id, displayName }
  const [messages, setMessages] = useState([]);     // [{ id, mine, text }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollContainerRef = useRef(null);

  // Place le fil sur le dernier message en ne faisant défiler QUE le conteneur
  // interne (scrollIntoView ferait défiler toute la page/fenêtre).
  const scrollToBottom = () => {
    const c = scrollContainerRef.current;
    if (c) c.scrollTop = c.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Résolution username → id, puis chargement de la conversation.
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const u = await getProfileByUsername(username);
        const displayName = u.profile?.display_name || u.username;
        const { messages: raw } = await getConversation(u.id);
        const mapped = (raw || []).map((m) => ({
          id: m._id,
          mine: m.sender_id === user.id,
          text: m.message_text,
          created_at: m.created_at,
          read: !!m.is_read,
        }));
        if (active) {
          setOtherUser({ id: u.id, displayName, lastActive: u.profile?.last_active || null });
          setMessages(mapped);
        }
        // Marque la conversation comme lue (best-effort).
        markConversationRead(u.id).catch(() => {});
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, t('messages.notFound')));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [username, user]);

  // Fx17 — Envoi : POST /api/dms/send { recipient_id, message_text } (UI optimiste).
  const handleSend = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !otherUser || sending) return;

    setSending(true);
    const optimistic = { id: `tmp-${Date.now()}`, mine: true, text, created_at: new Date().toISOString(), read: false };
    setMessages((m) => [...m, optimistic]);
    setNewMessage("");
    try {
      const created = await sendMessage(otherUser.id, text);
      setMessages((m) => m.map((msg) => (msg.id === optimistic.id ? { ...msg, id: created._id || msg.id } : msg)));
    } catch (err) {
      console.error('[Messages] Failed to send:', err);
      // Rollback du message optimiste en cas d'échec.
      setMessages((m) => m.filter((msg) => msg.id !== optimistic.id));
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const title = otherUser?.displayName || username;
  // En ligne si actif il y a moins de ~70s (le ping est émis toutes les 25s).
  const isOnline = otherUser?.lastActive
    ? Date.now() - new Date(otherUser.lastActive).getTime() < 70000
    : false;

  return (
    <AppShell>
      <div className="flex flex-col h-full">

        <header className="sticky top-0 z-10 bg-gray-100/80 dark:bg-night/85 backdrop-blur-lg border-b border-gray-200/60 dark:border-steel-blue/20">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-9 h-9 rounded-full text-steel-blue hover:bg-steel-blue/10 dark:hover:bg-steel-blue/20 active:scale-95 transition-all"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white dark:ring-night shadow-sm">
                  {title.charAt(0).toUpperCase()}
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-night rounded-full ${isOnline ? "bg-emerald-400" : "bg-gray-300 dark:bg-gray-500"}`}
                  title={isOnline ? t('messages.online') : t('messages.offline')}
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-deep-space-blue dark:text-white truncate leading-tight">
                  {title}
                </h1>
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
                  @{username}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-steel-blue/40 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-steel-blue/40 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-steel-blue/40 animate-bounce" />
              </div>
            </div>
          )}

          {!loading && error && (
            <p className="text-center text-brick-red font-semibold py-8">{error}</p>
          )}

          {!loading && !error && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-steel-blue/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-steel-blue" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {t('messages.noMessages')}
              </p>
            </div>
          )}

          {!loading && !error && messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.mine ? "justify-end" : "justify-start"}`}
            >
              {!msg.mine && (
                <div className="w-8 h-8 rounded-full bg-steel-blue flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 shadow-sm">
                  {title.charAt(0).toUpperCase()}
                </div>
              )}

              <div
                className={`
                  max-w-[78%] px-4 py-2.5 text-sm leading-relaxed shadow-sm
                  ${msg.mine
                    ? "bg-steel-blue text-white rounded-2xl rounded-br-md"
                    : "bg-gray-200 dark:bg-gray-700/60 text-deep-space-blue dark:text-white rounded-2xl rounded-bl-md"
                  }
                `}
              >
                {msg.text}
                <p className={`text-[10px] mt-1 flex items-center gap-1 ${msg.mine ? "justify-end text-white/60" : "text-gray-400 dark:text-gray-500"}`}>
                  {relativeTime(msg.created_at, language)}
                  {msg.mine && (
                    msg.read ? (
                      // Lu : double coche
                      <span className="inline-flex items-center text-sky-300" title={t('messages.read')}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2 13l3.5 3.5L11 11" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 13l3.5 3.5L22 7" /></svg>
                      </span>
                    ) : (
                      // Envoyé : simple coche
                      <span className="inline-flex items-center text-white/50" title={t('messages.sent')}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </span>
                    )
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleSend}
        className="fixed bottom-[65px] left-0 right-0 md:sticky md:bottom-0 md:left-auto md:right-auto px-4 py-3 bg-gray-100/90 dark:bg-night/95 backdrop-blur-lg border-t border-gray-200/60 dark:border-steel-blue/20 z-30"
      >
        <div className="flex items-end gap-2">
          <input
            type="text"
            placeholder={t('conversation.placeholder')}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-steel-blue/30 bg-white dark:bg-gray-800 text-deep-space-blue dark:text-white text-sm outline-none focus:border-steel-blue focus:ring-2 focus:ring-steel-blue/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 shadow-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`
              flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full transition-all shadow-sm
              ${newMessage.trim()
                ? "bg-steel-blue text-white hover:bg-steel-blue/80 active:scale-95"
                : "bg-gray-200 dark:bg-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed"
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </form>
    </AppShell>
  );
}
