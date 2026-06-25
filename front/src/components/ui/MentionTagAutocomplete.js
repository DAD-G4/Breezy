"use client";

// Autocomplétion @mentions / #hashtags pour un <textarea> ou <input>.
//
// Composant *contrôlé* : la valeur reste pilotée par le parent (`value` /
// `onChange`), exactement comme un textarea natif — on ne fait qu'ajouter un
// menu déroulant par-dessus. On détecte le « token actif » au niveau du curseur
// (la sous-chaîne depuis le dernier `@`/`#` non précédé d'un caractère de mot,
// jusqu'au curseur, sans espace), on interroge l'API (débounce ~200 ms), et on
// remplace le token par `@username ` / `#tagname ` à la sélection.
//
// NB: les libellés visibles sont volontairement minimaux/neutres (pas d'i18n
// pour l'instant — à externaliser plus tard dans les locales).

import { useEffect, useId, useRef, useState } from "react";
import { searchUsers } from "../../services/users";
import { suggestTags } from "../../services/tags";

const DEBOUNCE_MS = 200;
const MAX_ITEMS = 8;

// Repère le token actif (@… ou #…) terminant exactement au curseur.
// Retourne { type: '@'|'#', query, start } ou null.
function detectToken(value, caret) {
  const upToCaret = value.slice(0, caret);
  // Dernier @ ou # de la portion avant le curseur.
  const match = upToCaret.match(/[@#][\w]*$/);
  if (!match) return null;

  const start = match.index;
  const trigger = match[0][0]; // '@' ou '#'
  const query = match[0].slice(1); // mot après le déclencheur (peut être vide)

  // Le déclencheur ne doit pas être collé à un caractère de mot (ex: e-mail
  // « foo@bar » ne doit pas déclencher de mention).
  const prev = start > 0 ? value[start - 1] : "";
  if (prev && /\w/.test(prev)) return null;

  return { type: trigger, query, start, end: caret };
}

export default function MentionTagAutocomplete({
  as = "textarea",
  value,
  onChange,
  inputRef: externalRef,
  onKeyDown: externalKeyDown,
  ...rest
}) {
  const Tag = as;
  const internalRef = useRef(null);
  const inputRef = externalRef || internalRef;
  const listboxId = useId();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(0);
  const [token, setToken] = useState(null);

  const debounceRef = useRef(null);
  const reqIdRef = useRef(0);

  function close() {
    setOpen(false);
    setItems([]);
    setActive(0);
    setToken(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  // Lance une requête débouncée pour un token donné.
  function queryFor(tok) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const reqId = ++reqIdRef.current;
    debounceRef.current = setTimeout(async () => {
      try {
        let results = [];
        if (tok.type === "@") {
          const users = await searchUsers(tok.query);
          results = (users || []).slice(0, MAX_ITEMS).map((u) => ({
            key: `u${u.id}`,
            insert: u.username,
            primary: u.display_name || u.username,
            secondary: `@${u.username}`,
            avatarUrl: u.avatar_url || null,
          }));
        } else {
          const tags = await suggestTags(tok.query);
          results = (tags || []).slice(0, MAX_ITEMS).map((tg) => ({
            key: `t${tg.tag}`,
            insert: tg.tag,
            primary: `#${tg.tag}`,
            secondary: tg.count != null ? `${tg.count}` : "",
            avatarUrl: null,
          }));
        }
        // Ignore les réponses obsolètes (course entre frappes).
        if (reqId !== reqIdRef.current) return;
        if (results.length === 0) {
          close();
          return;
        }
        setItems(results);
        setActive(0);
        setOpen(true);
      } catch {
        if (reqId === reqIdRef.current) close();
      }
    }, DEBOUNCE_MS);
  }

  // Recalcule le token actif à partir de la valeur + position du curseur.
  function refreshToken() {
    const el = inputRef.current;
    if (!el) return;
    const caret = el.selectionStart ?? value.length;
    const tok = detectToken(value, caret);
    if (!tok) {
      close();
      return;
    }
    setToken(tok);
    // Le déclencheur seul (#/@ sans lettre) n'interroge pas encore l'API.
    if (tok.query.length === 0) {
      setOpen(false);
      setItems([]);
      return;
    }
    queryFor(tok);
  }

  const handleChange = (e) => {
    onChange?.(e);
  };

  // Réévalue le token après chaque mise à jour de la valeur (frappe, collage…).
  useEffect(() => {
    refreshToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Applique la sélection : remplace le token par l'insertion + espace.
  function applySelection(item) {
    const el = inputRef.current;
    if (!el || !token) return;
    const completion = `${token.type}${item.insert} `;
    const next = value.slice(0, token.start) + completion + value.slice(token.end);
    const caret = token.start + completion.length;

    // Propage au parent via un évènement synthétique minimal.
    onChange?.({ target: { value: next } });
    close();

    // Repositionne le curseur après l'insertion (au prochain tick).
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        try {
          el.setSelectionRange(caret, caret);
        } catch {
          /* certains types d'input ne supportent pas setSelectionRange */
        }
      }
    });
  }

  const handleKeyDown = (e) => {
    if (open && items.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (a + 1) % items.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a - 1 + items.length) % items.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applySelection(items[active]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
    }
    // Dropdown fermé : on ne capture rien, le comportement normal (submit /
    // retour à la ligne) du compositeur est préservé.
    externalKeyDown?.(e);
  };

  // Réévalue le token quand le curseur bouge (clic, flèches) sans changer la valeur.
  const handleSelect = () => {
    refreshToken();
  };

  return (
    <div className="relative">
      <Tag
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleSelect}
        onKeyUp={(e) => {
          // Flèches gauche/droite déplacent le curseur sans modifier la valeur.
          if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") {
            refreshToken();
          }
        }}
        onBlur={() => {
          // Léger délai pour laisser le clic sur un item se déclencher avant la fermeture.
          setTimeout(close, 120);
        }}
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-autocomplete="list"
        {...rest}
      />

      {open && items.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-steel-blue/40 bg-white dark:bg-surface shadow-lg dark:shadow-[0_5px_20px_rgba(0,0,0,0.5)] py-1"
        >
          {items.map((item, i) => (
            <li
              key={item.key}
              role="option"
              aria-selected={i === active}
              // onMouseDown plutôt que onClick : se déclenche avant le onBlur du champ.
              onMouseDown={(e) => {
                e.preventDefault();
                applySelection(item);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm ${
                i === active
                  ? "bg-slate-100 dark:bg-white/10"
                  : "hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              {token?.type === "@" && (
                <span className="w-7 h-7 rounded-full bg-steel-blue shrink-0 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                  {item.avatarUrl ? (
                    <img src={item.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    item.primary.charAt(0).toUpperCase()
                  )}
                </span>
              )}
              <span className="flex flex-col min-w-0 flex-1">
                <span className="font-semibold text-deep-space-blue dark:text-white truncate">
                  {item.primary}
                </span>
                {item.secondary && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {item.secondary}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
