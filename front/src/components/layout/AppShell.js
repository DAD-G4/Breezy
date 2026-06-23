"use client";

import Header from "./Header";
import BottomNav from "./BottomNav";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import { NotificationsProvider } from "../../context/NotificationsContext";

export default function AppShell({ children }) {
  return (
    <NotificationsProvider>
      <div className="min-h-screen">
        <Header />

        <div className="mx-auto flex w-full max-w-7xl">
          <LeftSidebar />

          <main className="flex-1 min-w-0 md:max-w-2xl min-h-screen border-x border-gray-200 dark:border-white/10 pb-20 md:pb-0">
            {children}
          </main>

          <RightSidebar />
        </div>

        <BottomNav />
      </div>
    </NotificationsProvider>
  );
}
