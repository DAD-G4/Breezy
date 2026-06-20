"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

export default function ConversationPage({ params }) {
  const router = useRouter();
  
  // URL avec decodeURIComponent
  const resolvedParams = use(params);
  const username = decodeURIComponent(resolvedParams.username);

  // MOCK DATA -> A REMPLACER PLUS TARD POUR BACK END
  const [messages, setMessages] = useState([
    { id: 1, sender: username, text: "Lorem ipsum !" },
    { id: 2, sender: "me", text: "Lorem ipsum dolor sit amet" },
    { id: 3, sender: username, text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
    { id: 4, sender: "me", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex." }
  ]);
  
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll vers le dernier message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fonction d'envoi
  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setMessages([...messages, { id: Date.now(), sender: "me", text: newMessage }]);
    setNewMessage(""); // Vide l'input
  };

  return (
    <AppShell>
      <div className="flex flex-col p-4 pb-32 md:pb-4">

        {/* EN-TÊTE (Retour + Infos user) */}
        <div className="flex items-center gap-4 mb-6 sticky top-0 bg-gray-200/90 dark:bg-deep-space-blue/90 backdrop-blur-sm z-10 py-2 border-b border-gray-300 dark:border-steel-blue/30 -mx-4 px-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 text-steel-blue hover:text-deep-space-blue dark:hover:text-papaya-whip rounded-full transition-all"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3 border border-gray-300 dark:border-steel-blue/40 px-4 py-2 rounded-full bg-white dark:bg-deep-space-blue shadow-sm">
            <div className="w-8 h-8 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold text-sm">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="font-bold text-deep-space-blue dark:text-papaya-whip truncate max-w-[120px]">
              {username}
            </span>
            {/* statut en ligne */}
            <div className="w-3 h-3 rounded-full bg-black dark:bg-papaya-whip ml-2"></div>
          </div>
        </div>

        {/* ZONE MESSAGES */}
        <div className="flex flex-col gap-4">
          {messages.map((msg) => {
            const isMe = msg.sender === "me";
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
                
                {/* Avatar*/}
                {!isMe && (
                  <div className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-auto">
                    {username.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Bulle de texte */}
                <div className={`px-4 py-3 max-w-[75%] border rounded-2xl text-sm leading-relaxed ${
                  isMe 
                    ? "bg-white dark:bg-deep-space-blue border-gray-300 dark:border-steel-blue/50 text-deep-space-blue dark:text-papaya-whip rounded-br-sm shadow-sm" 
                    : "bg-white dark:bg-deep-space-blue border-gray-300 dark:border-steel-blue/50 text-deep-space-blue dark:text-papaya-whip rounded-bl-sm shadow-sm"
                }`}>
                  {msg.text}
                </div>

              </div>
            );
          })}
          {/* pour l'auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* BARRE DE SAISIE : fixée au-dessus du BottomNav en mobile, collante en bas de colonne en desktop */}
      <form
        onSubmit={handleSend}
        className="fixed bottom-[65px] left-0 right-0 md:sticky md:bottom-0 md:left-auto md:right-auto p-3 bg-gray-200/95 dark:bg-deep-space-blue/95 backdrop-blur-md border-t border-gray-300 dark:border-steel-blue/40 z-30"
        >
        <div className="relative flex items-center">
          <input 
            type="text" 
            placeholder="Votre message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full pl-4 pr-12 py-3 rounded-2xl border border-gray-300 dark:border-steel-blue/50 bg-white dark:bg-deep-space-blue text-deep-space-blue dark:text-papaya-whip outline-none focus:border-steel-blue shadow-sm"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="absolute right-2 p-2 text-steel-blue hover:text-deep-space-blue disabled:opacity-50 transition-colors"
          >
            {/* Icône Send */}
            <svg className="w-6 h-6 transform rotate-45 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </AppShell>
  );
}