"use client";

import Header from "./Header";
import BottomNav from "./BottomNav";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";

export default function AppShell({ children, chat = false }) {
  // Mode `chat` : hauteur bornée au viewport (sous le header mobile, au-dessus de
  // la bottom-nav) avec overflow caché → le document NE scrolle PAS, seule la
  // zone interne (messages) défile. L'en-tête et la saisie restent fixes.
  const mainClass = chat
    ? "flex-1 min-w-0 md:max-w-2xl h-[calc(100dvh-129px)] md:h-screen overflow-hidden border-x border-gray-200 dark:border-white/10"
    : "flex-1 min-w-0 md:max-w-2xl min-h-screen border-x border-gray-200 dark:border-white/10 pb-20 md:pb-0";

  return (
    <div className={chat ? "h-screen overflow-hidden" : "min-h-screen"}>
      <Header />

      <div className="mx-auto flex w-full max-w-7xl">
        <LeftSidebar />

        <main className={mainClass}>
          {children}
        </main>

        <RightSidebar />
      </div>

      <BottomNav />
    </div>
  );
}
