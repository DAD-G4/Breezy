"use client";

import { createContext, useContext } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { useLanguage } from "./LanguageContext";
import MessageToast from "../components/ui/MessageToast";

const NotificationsContext = createContext({ notifications: [], unreadCount: 0, markAllRead: () => {} });

export function NotificationsProvider({ children }) {
  const { t, language } = useLanguage();
  const value = useNotifications(t, language);
  return (
    <NotificationsContext.Provider value={value}>
      {children}
      {value.incomingMessage && (
        <MessageToast
          key={value.incomingMessage.id}
          name={value.incomingMessage.name}
          text={value.incomingMessage.text}
          username={value.incomingMessage.username}
          onClose={value.dismissIncoming}
          duration={10000}
        />
      )}
    </NotificationsContext.Provider>
  );
}

export const useNotificationsContext = () => useContext(NotificationsContext);
