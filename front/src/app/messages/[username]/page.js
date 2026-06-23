"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getApiErrorMessage } from "@/lib/api";
import { getProfileByUsername } from "@/services/users";
import { getConversation, sendMessage, markConversationRead } from "@/services/dm";
import { useAuth, useRequireAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function ConversationPage({ params }) {
  useRequireAuth();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const resolvedParams = use(params);
  const username = decodeURIComponent(resolvedParams.username);

  const [otherUser, setOtherUser] = useState(null); // { id, displayName }
  const [messages, setMessages] = useState([]);     // [{ id, mine, text }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        }));
        if (active) {
          setOtherUser({ id: u.id, displayName });
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
    const optimistic = { id: `tmp-${Date.now()}`, mine: true, text };
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

  return (
    <AppShell>
      <div className="flex flex-col p-4 pb-32 md:pb-4">

        {/* EN-TÊTE */}
        <div className="flex items-center gap-4 mb-6 sticky top-0 bg-gray-200/90 dark:bg-deep-space-blue/90 backdrop-blur-sm z-10 py-2 border-b border-gray-300 dark:border-steel-blue/30 -mx-4 px-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-steel-blue hover:text-deep-space-blue dark:hover:text-papaya-whip rounded-full transition-all"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="flex items-center gap-3 border border-gray-300 dark:border-steel-blue/40 px-4 py-2 rounded-full bg-white dark:bg-deep-space-blue shadow-sm">
            <div className="w-8 h-8 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold text-sm">
              {title.charAt(0).toUpperCase()}
            </div>
            <span className="font-bold text-deep-space-blue dark:text-papaya-whip truncate max-w-[160px]">
              {title}
            </span>
          </div>
        </div>

        {/* ZONE MESSAGES */}
        <div className="flex flex-col gap-4">
          {loading && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('common.loading')}</p>
          )}
          {!loading && error && (
            <p className="text-center text-brick-red font-semibold py-8">{error}</p>
          )}
          {!loading && !error && messages.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('messages.noMessages')}
            </p>
          )}
          {!loading && !error && messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.mine ? "justify-end" : "justify-start"}`}>
              {!msg.mine && (
                <div className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-auto">
                  {title.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={`px-4 py-3 max-w-[75%] border rounded-2xl text-sm leading-relaxed bg-white dark:bg-deep-space-blue border-gray-300 dark:border-steel-blue/50 text-deep-space-blue dark:text-papaya-whip shadow-sm ${msg.mine ? "rounded-br-sm" : "rounded-bl-sm"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* BARRE DE SAISIE */}
      <form
        onSubmit={handleSend}
        className="fixed bottom-[65px] left-0 right-0 md:sticky md:bottom-0 md:left-auto md:right-auto p-3 bg-gray-200/95 dark:bg-deep-space-blue/95 backdrop-blur-md border-t border-gray-300 dark:border-steel-blue/40 z-30"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder={t('conversation.placeholder')}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full pl-4 pr-12 py-3 rounded-2xl border border-gray-300 dark:border-steel-blue/50 bg-white dark:bg-deep-space-blue text-deep-space-blue dark:text-papaya-whip outline-none focus:border-steel-blue shadow-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="absolute right-2 p-2 text-steel-blue hover:text-deep-space-blue disabled:opacity-50 transition-colors"
          >
            <svg className="w-6 h-6 transform rotate-45 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </AppShell>
  );
}
