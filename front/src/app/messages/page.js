"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "../../components/layout/AppShell";
import { getApiErrorMessage } from "../../lib/api";
import { relativeTime } from "../../lib/mappers";
import { getConversations } from "../../services/dm";
import { resolveUsers, searchUsers } from "../../services/users";
import { useRequireAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export default function MessagesInboxPage() {
  useRequireAuth();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Composer un nouveau message : modale de recherche d'utilisateur.
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeQuery, setComposeQuery] = useState("");
  const [composeResults, setComposeResults] = useState([]);
  const [composeLoading, setComposeLoading] = useState(false);

  useEffect(() => {
    const q = composeQuery.trim();
    if (!q) { setComposeResults([]); return; }
    let active = true;
    setComposeLoading(true);
    const timer = setTimeout(() => {
      searchUsers(q)
        .then((users) => { if (active) setComposeResults(users || []); })
        .catch(() => { if (active) setComposeResults([]); })
        .finally(() => { if (active) setComposeLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [composeQuery]);

  const openConversation = (username) => {
    setComposeOpen(false);
    setComposeQuery("");
    router.push(`/messages/${encodeURIComponent(username)}`);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { conversations: raw } = await getConversations();
        const otherIds = (raw || []).map((c) => c.other_user_id);
        const others = await resolveUsers(otherIds);
        const list = (raw || []).map((c, i) => {
          const other = others[i];
          return {
            username: other?.username,
            displayName: other?.displayName,
            lastMessage: c.last_message?.message_text || "",
            time: relativeTime(c.last_message?.created_at, language),
            unread: (c.unread_count ?? 0) > 0,
          };
        });
        if (active) setConversations(list);
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, t('messages.loadError')));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="flex flex-col p-4 gap-6">
        <div className="flex items-center justify-between px-1">
          <h1 className="font-bold text-xl text-deep-space-blue dark:text-white">{t('sidebar.messages')}</h1>
          <button
            onClick={() => setComposeOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-steel-blue hover:bg-deep-space-blue dark:bg-papaya-whip dark:text-deep-space-blue dark:hover:bg-white text-white text-sm font-bold rounded-full transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            {t('messages.new') || 'Nouveau message'}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {loading && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('common.loading')}</p>
          )}
          {!loading && error && (
            <p className="text-center text-brick-red font-semibold py-8">{error}</p>
          )}
          {!loading && !error && conversations.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('messages.empty')}
            </p>
          )}
          {!loading && !error && conversations.map((conv) => (
            <Link
              key={conv.username}
              href={`/messages/${encodeURIComponent(conv.username)}`}
              className={`flex items-center gap-4 p-4 rounded-xl border ${conv.unread ? 'border-steel-blue/50 dark:border-steel-blue bg-blue-50/50 dark:bg-steel-blue/10' : 'border-gray-100 dark:border-steel-blue/20 bg-white dark:bg-surface'} hover:shadow-md transition-all duration-200`}
            >
              <div className="w-12 h-12 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {conv.displayName.charAt(0).toUpperCase()}
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`text-base truncate ${conv.unread ? 'font-bold text-deep-space-blue dark:text-white' : 'font-semibold text-deep-space-blue/90 dark:text-white/90'}`}>
                    {conv.displayName}
                  </span>
                  <span className={`text-xs flex-shrink-0 ml-2 ${conv.unread ? 'font-bold text-steel-blue dark:text-steel-blue' : 'text-gray-500 dark:text-gray-400'}`}>
                    {conv.time}
                  </span>
                </div>
                <p className={`text-sm truncate ${conv.unread ? 'font-semibold text-deep-space-blue/80 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                  {conv.lastMessage}
                </p>
              </div>

              <div className="flex items-center justify-center w-4 h-4 flex-shrink-0 ml-2">
                {conv.unread ? (
                  <div className="w-3 h-3 rounded-full bg-steel-blue shadow-[0_0_8px_rgba(102,155,188,0.6)]"></div>
                ) : (
                  <div className="w-3 h-3 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* MODALE : nouveau message */}
      {composeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-20"
          onClick={() => setComposeOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-surface rounded-2xl shadow-xl border border-gray-200 dark:border-steel-blue/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10">
              <h2 className="font-bold text-deep-space-blue dark:text-white">
                {t('messages.new') || 'Nouveau message'}
              </h2>
              <button
                onClick={() => setComposeOpen(false)}
                className="p-1.5 rounded-full text-gray-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                aria-label={t('common.close') || 'Fermer'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input
                  type="text"
                  autoFocus
                  value={composeQuery}
                  onChange={(e) => setComposeQuery(e.target.value)}
                  placeholder={t('messages.searchUser') || 'Rechercher un utilisateur…'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-gray-100 dark:bg-black/30 text-deep-space-blue dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-steel-blue transition-all"
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto px-2 pb-2">
              {composeLoading && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">{t('common.loading')}</p>
              )}
              {!composeLoading && composeQuery.trim() && composeResults.length === 0 && (
                <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">
                  {t('search.noResults') || 'Aucun résultat pour'} « {composeQuery.trim()} ».
                </p>
              )}
              {composeResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => openConversation(u.username)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.display_name} className="w-full h-full object-cover" />
                    ) : (
                      (u.display_name || u.username)?.charAt(0)?.toUpperCase() || "?"
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-deep-space-blue dark:text-white truncate">{u.display_name || u.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
