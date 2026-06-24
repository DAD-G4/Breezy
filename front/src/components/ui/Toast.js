"use client";
import { useState, useEffect, useCallback } from "react";

export default function Toast({ message, onUndo, duration = 5000 }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => setVisible(false), 300);
  }, []);

  useEffect(() => {
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, dismiss]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl border border-steel-blue/20 bg-deep-space-blue text-white dark:bg-steel-blue dark:text-deep-space-blue shadow-[0_8px_30px_rgba(0,48,73,0.35)] dark:shadow-[0_8px_30px_rgba(102,155,188,0.35)] transition-all duration-300 -translate-x-1/2 ${
        exiting
          ? "opacity-0 translate-y-2 scale-95"
          : "opacity-100 translate-y-0 scale-100"
      }`}
    >
      <svg className="w-5 h-5 flex-shrink-0 text-steel-blue dark:text-deep-space-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>

      <span className="text-sm font-medium">{message}</span>

      {onUndo && (
        <button
          onClick={() => {
            onUndo();
            dismiss();
          }}
          className="ml-2 px-3 py-1 text-xs font-bold rounded-full bg-steel-blue/20 dark:bg-surface/40 text-steel-blue dark:text-white hover:bg-steel-blue/30 dark:hover:bg-deep-space-blue/30 transition-colors"
        >
          Undo
        </button>
      )}

      <button
        onClick={dismiss}
        className="ml-1 p-1 rounded-full text-white/50 dark:text-deep-space-blue/50 hover:text-white dark:hover:text-deep-space-blue transition-colors"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
