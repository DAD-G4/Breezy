"use client";

// Sélecteur d'emojis *sans dépendance* : un petit bouton rond (🙂) qui ouvre un
// popover affichant une grille d'emojis usuels, groupés par catégorie. Cliquer
// un emoji appelle `onSelect(emoji)`. Le popover se ferme au clic extérieur et
// sur Échap. Pensé pour s'afficher AU-DESSUS du bouton (compositeurs en bas de
// page) sans déborder. Styles light + dark calqués sur les autres composants UI.

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

// Jeu d'emojis curé (~160) — volontairement inline pour rester sans dépendance.
const EMOJI_GROUPS = [
  {
    key: "smileys",
    label: "😀",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🙂", "🙃",
      "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
      "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤔", "🤐", "😶",
      "😏", "😒", "🙄", "😬", "😴", "😪", "😌", "😔", "🤤", "😷",
      "🤒", "🤕", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁", "😮",
      "😯", "😦", "😧", "😢", "😭", "😱", "😖", "😣", "😞", "😤",
      "😡", "🤬", "😈", "👿", "💀", "🤡", "👻", "👽", "🤖", "🥺",
    ],
  },
  {
    key: "gestures",
    label: "👍",
    emojis: [
      "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉",
      "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤝", "👏",
      "🙌", "👐", "🤲", "🙏", "✍️", "💪", "👀", "👂", "👃", "🧠",
    ],
  },
  {
    key: "hearts",
    label: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💯",
      "💥", "💫", "💦", "💨", "🔥", "⭐", "🌟", "✨", "⚡", "🎉",
    ],
  },
  {
    key: "animals",
    label: "🐶",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
      "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦆", "🦉",
      "🦄", "🐝", "🦋", "🐢", "🐙", "🐳", "🐬", "🐟", "🦈", "🐊",
    ],
  },
  {
    key: "food",
    label: "🍎",
    emojis: [
      "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍒", "🍑", "🥭",
      "🍍", "🥥", "🥝", "🍅", "🥑", "🍆", "🥕", "🌽", "🍕", "🍔",
      "🍟", "🌭", "🌮", "🍣", "🍦", "🍩", "🍪", "🎂", "🍫", "🍿",
      "☕", "🍵", "🍺", "🍻", "🥂", "🍷", "🥤", "🧃",
    ],
  },
  {
    key: "activities",
    label: "⚽",
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸",
      "🥊", "🎮", "🎲", "🎯", "🎸", "🎹", "🎺", "🎻", "🥁", "🎤",
      "🎧", "🏆", "🥇", "🥈", "🥉", "🚀", "✈️", "🚗", "🏖️", "⛰️",
    ],
  },
  {
    key: "symbols",
    label: "✅",
    emojis: [
      "✅", "❌", "❓", "❗", "💤", "🔔", "🔕", "💬", "💭", "🗯️",
      "♻️", "⚠️", "🚫", "🆗", "🆒", "🆕", "🔝", "💲", "💡", "🔒",
      "🔑", "🎁", "🎈", "🏁", "🚩", "🌈", "☀️", "🌙", "❄️", "🍃",
    ],
  },
];

export default function EmojiPicker({ onSelect }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState(EMOJI_GROUPS[0].key);
  const rootRef = useRef(null);

  // Fermeture au clic extérieur + Échap.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = EMOJI_GROUPS.find((g) => g.key === group) || EMOJI_GROUPS[0];

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("common.emoji")}
        title={t("common.emoji")}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors group text-steel-blue"
      >
        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("common.emoji")}
          // Ancré au-dessus du bouton, aligné à gauche, sans déborder.
          className="absolute bottom-full left-0 mb-2 z-40 w-[min(20rem,80vw)] rounded-2xl border border-gray-200 dark:border-steel-blue/30 bg-white dark:bg-surface shadow-lg dark:shadow-[0_5px_20px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* Onglets de catégories */}
          <div className="flex items-center gap-1 px-2 pt-2 pb-1 border-b border-gray-100 dark:border-white/10 overflow-x-auto">
            {EMOJI_GROUPS.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setGroup(g.key)}
                className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-colors ${
                  g.key === group
                    ? "bg-slate-100 dark:bg-white/10"
                    : "hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <span aria-hidden="true">{g.label}</span>
              </button>
            ))}
          </div>

          {/* Grille d'emojis */}
          <div className="grid grid-cols-8 gap-0.5 p-2 max-h-52 overflow-y-auto">
            {current.emojis.map((emoji, i) => (
              <button
                key={`${current.key}-${i}`}
                type="button"
                // onMouseDown empêche la perte de focus du champ de texte avant l'insertion.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect?.(emoji)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <span aria-hidden="true">{emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
