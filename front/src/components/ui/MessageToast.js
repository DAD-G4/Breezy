"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Popup affichée en haut de l'écran à la réception d'un nouveau message privé.
 * Rectangulaire : nom de l'expéditeur + début du message + barre de progression
 * qui se vide en `duration` ms, après quoi la popup disparaît automatiquement.
 * Un clic ouvre la conversation.
 */
export default function MessageToast({ name, text, username, onClose, duration = 10000 }) {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const close = useCallback(() => {
    setExiting(true);
    setTimeout(onClose, 300); // laisse jouer l'animation de sortie
  }, [onClose]);

  useEffect(() => {
    // Barre 100% → 0% sur toute la durée, puis fermeture automatique.
    const raf = requestAnimationFrame(() => setProgress(0));
    const timer = setTimeout(close, duration);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [duration, close]);

  const openConversation = () => {
    close();
    router.push(`/messages/${encodeURIComponent(username)}`);
  };

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[120] w-[92%] max-w-sm overflow-hidden rounded-2xl border border-steel-blue/20 bg-white dark:bg-surface shadow-[0_8px_30px_rgba(0,48,73,0.25)] dark:shadow-[0_8px_30px_rgba(102,155,188,0.3)] transition-all duration-300 ${
        exiting ? "opacity-0 -translate-y-3" : "opacity-100 translate-y-0"
      }`}
      role="alert"
    >
      <button
        type="button"
        onClick={openConversation}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-steel-blue flex items-center justify-center text-white font-bold shrink-0">
          {(name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-deep-space-blue dark:text-white truncate">
            {name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {text}
          </p>
        </div>
        <span
          role="button"
          tabIndex={0}
          aria-label="Fermer"
          onClick={(e) => {
            e.stopPropagation();
            close();
          }}
          className="p-1 -mr-1 rounded-full text-gray-400 hover:text-deep-space-blue dark:hover:text-white transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      </button>

      {/* Barre de progression (se vide en `duration`). */}
      <div className="h-1 w-full bg-steel-blue/15">
        <div
          className="h-full bg-steel-blue"
          style={{ width: `${progress}%`, transition: `width ${duration}ms linear` }}
        />
      </div>
    </div>
  );
}
