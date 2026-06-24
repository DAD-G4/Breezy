"use client";

import { useEffect } from "react";

/**
 * Boîte de dialogue de confirmation réutilisable et animée.
 * Remplace les window.confirm/alert natifs.
 *
 * Props :
 *  - open : booléen d'affichage
 *  - title / message : textes
 *  - confirmLabel / cancelLabel : libellés des boutons
 *  - variant : "default" | "danger" (couleur du bouton de confirmation)
 *  - icon : "warning" | "block" | "report" | null
 *  - onConfirm / onCancel : callbacks
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "default",
  icon = "warning",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter") onConfirm?.();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const isDanger = variant === "danger";
  const confirmClasses = isDanger
    ? "bg-brick-red hover:bg-molten-lava text-white"
    : "bg-steel-blue hover:bg-deep-space-blue text-white";
  const iconWrapClasses = isDanger
    ? "bg-brick-red/10 text-brick-red"
    : "bg-steel-blue/10 text-steel-blue";

  const ICONS = {
    warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    block: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
    report: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm bg-white dark:bg-surface rounded-2xl shadow-2xl border border-gray-200 dark:border-steel-blue/30 overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col items-center text-center gap-3">
          {icon && ICONS[icon] && (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconWrapClasses}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={ICONS[icon]} />
              </svg>
            </div>
          )}
          {title && (
            <h2 className="font-bold text-lg text-deep-space-blue dark:text-papaya-whip">{title}</h2>
          )}
          {message && (
            <p className="text-sm text-gray-600 dark:text-papaya-whip/70 leading-relaxed">{message}</p>
          )}
        </div>
        <div className="flex gap-2 p-4 pt-0">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-full text-deep-space-blue dark:text-papaya-whip bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-full transition-colors ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
