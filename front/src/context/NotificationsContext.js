"use client";

import { createContext, useContext } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { useLanguage } from "./LanguageContext";

const NotificationsContext = createContext({ notifications: [], unreadCount: 0, markAllRead: () => {} });

export function NotificationsProvider({ children }) {
  const { t } = useLanguage();
  const value = useNotifications(t);
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotificationsContext = () => useContext(NotificationsContext);
