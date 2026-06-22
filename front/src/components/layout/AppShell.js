"use client";

import Header from "./Header";
import BottomNav from "./BottomNav";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";

// Coquille responsive commune aux pages "app" (feed, profil, post, création).
// - Mobile (<md)  : Header en haut + BottomNav en bas, colonne unique.
// - Tablette (md) : sidebar gauche en icônes + feed.
// - Desktop (lg)  : sidebar gauche complète + feed.
// - Large (xl)    : 3 colonnes (sidebar + feed + tendances/suggestions).
export default function AppShell({ children }) {
  return (
    <div className="min-h-screen">
      {/* Barre du haut : mobile uniquement */}
      <Header />

      <div className="mx-auto flex w-full max-w-7xl">
        <LeftSidebar />

        <main className="flex-1 min-w-0 md:max-w-2xl min-h-screen border-x border-gray-200 dark:border-white/10 pb-20 md:pb-0">
          {children}
        </main>

        <RightSidebar />
      </div>

      {/* Barre du bas : mobile uniquement */}
      <BottomNav />
    </div>
  );
}
