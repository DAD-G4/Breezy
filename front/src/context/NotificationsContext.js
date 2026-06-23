"use client";

import { createContext, useContext } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { useLanguage } from "./LanguageContext";

const NotificationsContext = createContext({ notifications: [], unreadCount: 0, markAllRead: () => {} });

export function NotificationsProvider({ children }) {
  const { t, language } = useLanguage();
  const value = useNotifications(t, language);
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotificationsContext = () => useContext(NotificationsContext);
