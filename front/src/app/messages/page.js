"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/layout/AppShell";
import { getApiErrorMessage } from "../../lib/api";
import { relativeTime } from "../../lib/mappers";
import { getConversations } from "../../services/dm";
import { resolveUser } from "../../services/users";
import { useRequireAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export default function MessagesInboxPage() {
  useRequireAuth();
  const { t, language } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { conversations: raw } = await getConversations();
        const list = await Promise.all(
          (raw || []).map(async (c) => {
            const other = await resolveUser(c.other_user_id);
            return {
              username: other.username,
              displayName: other.displayName,
              lastMessage: c.last_message?.message_text || "",
              time: relativeTime(c.last_message?.created_at, language),
              unread: (c.unread_count ?? 0) > 0,
            };
          })
        );
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
        <h1 className="font-bold text-xl text-deep-space-blue dark:text-papaya-whip px-1">{t('sidebar.messages')}</h1>

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
              className={`flex items-center gap-4 p-4 rounded-xl border ${conv.unread ? 'border-steel-blue/50 dark:border-steel-blue bg-blue-50/50 dark:bg-steel-blue/10' : 'border-gray-100 dark:border-steel-blue/20 bg-white dark:bg-deep-space-blue'} hover:shadow-md transition-all duration-200`}
            >
              <div className="w-12 h-12 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {conv.displayName.charAt(0).toUpperCase()}
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`text-base truncate ${conv.unread ? 'font-bold text-deep-space-blue dark:text-white' : 'font-semibold text-deep-space-blue/90 dark:text-papaya-whip/90'}`}>
                    {conv.displayName}
                  </span>
                  <span className={`text-xs flex-shrink-0 ml-2 ${conv.unread ? 'font-bold text-steel-blue dark:text-steel-blue' : 'text-gray-500 dark:text-gray-400'}`}>
                    {conv.time}
                  </span>
                </div>
                <p className={`text-sm truncate ${conv.unread ? 'font-semibold text-deep-space-blue/80 dark:text-papaya-whip' : 'text-gray-500 dark:text-gray-400'}`}>
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
    </AppShell>
  );
}
