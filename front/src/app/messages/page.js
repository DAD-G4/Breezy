"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";

export default function MessagesInboxPage() {
  // MOCK DATA 
  const initialConversations = [
    { id: 1, username: "User1", time: "5min", lastMessage: "Lorem ipsum dolor sit amet consectetur.", unread: true },
    { id: 2, username: "User2", time: "1d", lastMessage: "On se voit demain alors ?", unread: true },
    { id: 3, username: "User3", time: "2w", lastMessage: "Merci pour l'info !", unread: false },
    { id: 4, username: "User67", time: "10y", lastMessage: "Ancien message très très long qui doit être coupé à la fin.", unread: false },
  ];

  const [searchTerm, setSearchTerm] = useState("");

  // Filtrage local
  const filteredConversations = initialConversations.filter(conv => 
    conv.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header />
      
      <main className="flex-1 flex flex-col p-4 gap-6">
        
        {/* BARRE DE RECHERCHE */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Rechercher un message..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 dark:border-steel-blue/40 bg-white dark:bg-black/20 text-deep-space-blue dark:text-papaya-whip outline-none focus:border-steel-blue dark:focus:border-steel-blue focus:ring-2 focus:ring-steel-blue/20 transition-all shadow-sm"
          />
        </div>

        {/* LISTE DES CONVERSATIONS */}
        <div className="flex flex-col gap-3">
          {filteredConversations.map((conv) => (
            <Link 
              key={conv.id} 
              href={`/messages/${conv.username}`}
              className={`flex items-center gap-4 p-4 rounded-xl border ${conv.unread ? 'border-steel-blue/50 dark:border-steel-blue bg-blue-50/50 dark:bg-steel-blue/10' : 'border-gray-100 dark:border-steel-blue/20 bg-white dark:bg-deep-space-blue'} hover:shadow-md transition-all duration-200`}
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {conv.username.charAt(0).toUpperCase()}
              </div>
              
              {/* Infos */}
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`text-base truncate ${conv.unread ? 'font-bold text-deep-space-blue dark:text-white' : 'font-semibold text-deep-space-blue/90 dark:text-papaya-whip/90'}`}>
                    {conv.username}
                  </span>
                  <span className={`text-xs flex-shrink-0 ml-2 ${conv.unread ? 'font-bold text-steel-blue dark:text-steel-blue' : 'text-gray-500 dark:text-gray-400'}`}>
                    {conv.time}
                  </span>
                </div>
                <p className={`text-sm truncate ${conv.unread ? 'font-semibold text-deep-space-blue/80 dark:text-papaya-whip' : 'text-gray-500 dark:text-gray-400'}`}>
                  {conv.lastMessage}
                </p>
              </div>

              {/* Indicateur Lu/Non Lu*/}
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

      </main>
      
      <BottomNav />
    </div>
  );
}