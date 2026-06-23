"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import BreezyBadge from "@/components/ui/BreezyBadge";
import { useNotificationsContext } from "@/context/NotificationsContext";
import { useAuth } from "@/context/AuthContext";


function NavItem({ href, label, icon, active, onClick, hasNotif }) {
  const base = "flex items-center gap-4 px-3 py-3 rounded-full transition-colors text-deep-space-blue dark:text-papaya-whip hover:bg-black/5 dark:hover:bg-white/5 justify-center lg:justify-start relative";
  const state = active ? "font-bold bg-black/5 dark:bg-white/5" : "font-medium";
  
  const content = (
    <>
      <div className="relative">
        {icon}
        {hasNotif && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-brick-red border-2 border-white dark:border-deep-space-blue rounded-full"></span>
        )}
      </div>
      <span className="hidden lg:inline text-lg">{label}</span>
    </>
  );

  if (!href) {
    return (
      <button onClick={onClick} className={`${base} ${state} w-full`} aria-label={label}>
        {content}
      </button>
    );
  }
  return (
    <Link href={href} className={`${base} ${state}`} aria-label={label}>
      {content}
    </Link>
  );
}

export default function LeftSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  // Le lien Modération n'est visible que pour modérateurs / admins.
  const isStaff = user?.role === "moderator" || user?.role === "admin";

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const { notifications, unreadCount, markAllRead } = useNotificationsContext();

  const getNotifLink = (notif) => {
    if (notif.type === "follow") return `/profile/${notif.username}`;
    return `/post/${notif.postId}`;
  };

  // ICÔNES 
  const iconHome = <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
  const iconSearch = <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
  const iconNotif = <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
  const iconMessages = <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
  const iconProfile = <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  const iconSettings = <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
  // NOUVELLE ICÔNE BOUCLIER
  const iconModeration = <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;

  return (
    <aside className="hidden md:flex flex-col sticky top-0 h-screen w-20 lg:w-64 shrink-0 border-r border-gray-200 dark:border-white/10 bg-white dark:bg-deep-space-blue px-2 lg:px-4 py-4 gap-1 z-50">
      
      <Link href="/" className="flex items-center px-3 py-3 justify-center lg:justify-start">
        <BreezyBadge className="w-14 h-14 shrink-0" />
      </Link>

      <nav className="flex flex-col gap-1 mt-2">
        <NavItem href="/" label={t('sidebar.home')} icon={iconHome} active={pathname === "/"} />
        <NavItem href="/search" label={t('sidebar.search')} icon={iconSearch} active={pathname === "/search"} />
        
        <div className="relative flex">
          <NavItem 
            label={t('sidebar.notifications')} 
            icon={iconNotif} 
            active={isNotifOpen} 
            hasNotif={unreadCount > 0}
            onClick={() => setIsNotifOpen(!isNotifOpen)} 
          />
          
          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
              <div className="absolute left-full top-0 ml-4 w-80 max-h-[80vh] overflow-y-auto bg-white dark:bg-deep-space-blue border border-gray-200 dark:border-steel-blue/40 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-left-2 duration-200 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white/90 dark:bg-deep-space-blue/90 backdrop-blur-md z-10">
                  <h3 className="font-bold text-lg text-deep-space-blue dark:text-papaya-whip">{t('header.notificationsTitle')}</h3>
                  <button onClick={markAllRead} className="text-sm font-medium text-steel-blue hover:underline">{t('header.markAllRead')}</button>
                </div>
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <Link 
                      href={getNotifLink(notif)}
                      key={notif.id} 
                      className={`flex items-start gap-3 p-4 border-b border-gray-50 dark:border-white/5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${notif.unread ? "bg-blue-50/50 dark:bg-steel-blue/10" : ""}`}
                      onClick={() => setIsNotifOpen(false)}
                    >
                      <div className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold shrink-0">
                        {notif.avatar}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm text-deep-space-blue dark:text-papaya-whip leading-snug">
                          <span className="font-bold mr-1">{notif.user}</span>
                          <span className="opacity-90">{notif.action}</span>
                        </p>
                        <span className={`text-xs mt-1 ${notif.unread ? "text-steel-blue font-semibold" : "text-gray-500 dark:text-gray-400"}`}>{notif.time}</span>
                      </div>
                      {notif.unread && <div className="w-2.5 h-2.5 rounded-full bg-steel-blue mt-2 shrink-0"></div>}
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <NavItem href="/messages" label={t('sidebar.messages')} icon={iconMessages} active={pathname?.startsWith("/messages")} />
        <NavItem href="/profile" label={t('sidebar.profile')} icon={iconProfile} active={pathname?.startsWith("/profile")} />
        
        {/* BOUTON MODÉRATION — modérateurs / admins uniquement */}
        {isStaff && (
          <NavItem href="/moderation" label={t('sidebar.moderation')} icon={iconModeration} active={pathname?.startsWith("/moderation")} />
        )}
        
        <NavItem href="/settings" label={t('sidebar.settings')} icon={iconSettings} active={pathname?.startsWith("/settings")} />
      </nav>

      <Link href="/create" className="mt-3 flex items-center justify-center gap-2 bg-steel-blue hover:bg-deep-space-blue dark:bg-papaya-whip dark:text-deep-space-blue dark:hover:bg-white text-white font-bold rounded-full p-3 lg:px-4 transition-colors shadow-md">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
        <span className="hidden lg:inline">{t('sidebar.createPost')}</span>
      </Link>

      <button onClick={toggleTheme} className="mt-auto flex items-center gap-4 px-3 py-3 rounded-full transition-colors text-deep-space-blue dark:text-papaya-whip hover:bg-black/5 dark:hover:bg-white/5 justify-center lg:justify-start" aria-label={theme === "dark" ? t('sidebar.lightMode') : t('sidebar.darkMode')}>
        {theme === "dark" ? (
          <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        ) : (
          <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        )}
        <span className="hidden lg:inline font-medium">{theme === "dark" ? t('sidebar.lightMode') : t('sidebar.darkMode')}</span>
      </button>
    </aside>
  );
}