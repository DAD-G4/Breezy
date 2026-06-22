"use client";

import { useState } from "react";
import Link from "next/link";
import BreezyBadge from "../ui/BreezyBadge";

export default function Header() {

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // MOCK DATA  NOTIFICATIONS
  const notifications = [
    { id: 1, type: "like", postId: "123", user: "Alice", avatar: "A", action: "a aimé votre publication.", time: "Il y a 5 min", unread: true },
    { id: 2, type: "follow", user: "Bob", avatar: "B", action: "a commencé à vous suivre.", time: "1h", unread: true },
    { id: 3, type: "mention", postId: "124", user: "Charlie", avatar: "C", action: "vous a mentionné dans un commentaire.", time: "Hier", unread: false },
    { id: 4, type: "comment", postId: "123", user: "User67", avatar: "U", action: "a commenté : \"Superbe photo !\"", time: "Il y a 2 jours", unread: false },
  ];

  // nombre de notifications non lues
  const unreadCount = notifications.filter(n => n.unread).length;

  // LOGIQUE DE REDIRECTION POUR LES NOTIFS 
  const getNotifLink = (notif) => {
    if (notif.type === "follow") {
      return `/profile/${notif.user.toLowerCase()}`;
    }
    // Pour les likes, commentaires et mentions, on redirige vers le post
    return `/post/${notif.postId}`;
  };

  return (
    <header className="md:hidden sticky top-0 z-50 bg-white dark:bg-deep-space-blue text-deep-space-blue dark:text-papaya-whip border-b border-gray-200 dark:border-steel-blue/40 shadow-sm transition-colors duration-300">
      <div className="flex justify-between items-center px-4 h-16 relative">
        
        {/* BOUTON "CRÉER UN POST" */}
        <Link 
          href="/create" 
          className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
          aria-label="Créer un post"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </Link>

        {/* LOGO BREEZY */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity absolute left-1/2 -translate-x-1/2">
          <svg className="w-8 h-8 text-steel-blue dark:text-papaya-whip" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          <span className="text-xl font-bold tracking-wide hidden sm:block">Breezy</span>
        </Link>

        {/* ICÔNES DE DROITE */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* MENU DES NOTIFICATIONS */}
          <div className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors relative"
              aria-label="Notifications"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-3 h-3 bg-brick-red border-2 border-white dark:border-deep-space-blue rounded-full"></span>
              )}
            </button>

            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                
                <div className="absolute right-0 mt-2 w-80 max-h-[80vh] overflow-y-auto bg-white dark:bg-deep-space-blue border border-gray-200 dark:border-steel-blue/40 rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                  
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white/90 dark:bg-deep-space-blue/90 backdrop-blur-md z-10">
                    <h3 className="font-bold text-lg">Notifications</h3>
                    <button className="text-sm font-medium text-steel-blue hover:underline">Tout marquer comme lu</button>
                  </div>

                  <div className="flex flex-col">
                    {notifications.map((notif) => (
                      <Link 
                        href={getNotifLink(notif)} // <-- UTILISATION DE LA FONCTION ICI
                        key={notif.id} 
                        className={`flex items-start gap-3 p-4 border-b border-gray-50 dark:border-white/5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${
                          notif.unread ? "bg-blue-50/50 dark:bg-steel-blue/10" : ""
                        }`}
                        onClick={() => setIsNotifOpen(false)}
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold shrink-0">
                          {notif.avatar}
                        </div>
                        
                        {/* Contenu */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <p className="text-sm text-deep-space-blue dark:text-papaya-whip leading-snug">
                            <span className="font-bold mr-1">{notif.user}</span>
                            <span className="opacity-90">{notif.action}</span>
                          </p>
                          <span className={`text-xs mt-1 ${notif.unread ? "text-steel-blue font-semibold" : "text-gray-500 dark:text-gray-400"}`}>
                            {notif.time}
                          </span>
                        </div>

                        {notif.unread && (
                          <div className="w-2.5 h-2.5 rounded-full bg-steel-blue mt-2 shrink-0"></div>
                        )}
                      </Link>
                    ))}
                  </div>

                </div>
              </>
            )}
          </div>

          {/* PROFIL UTILISATEUR */}
          <Link 
            href="/profile" 
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
            aria-label="Mon profil"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
          
        </div>
      </div>
    </header>
  );
}