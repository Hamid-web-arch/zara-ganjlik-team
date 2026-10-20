import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../lib/i18n/languageContext";

export default function LanguageSwitcher({ light = false }) {
  const { language, setLanguage, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const current = languages.find((l) => l.code === language) ?? languages[0];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] font-bold transition cursor-pointer ${
          light ? "text-zinc-500 hover:text-zinc-900" : "hover:opacity-50"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current.label}
        <span className={`text-[8px] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute right-0 mt-3 min-w-[80px] py-2 z-50 border ${
            light ? "bg-white text-zinc-900 border-zinc-200 shadow-sm" : "bg-black text-white border-white/20"
          }`}
        >
          {languages.map((lng) => (
            <li key={lng.code}>
              <button
                type="button"
                onClick={() => {
                  setLanguage(lng.code);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-[10px] uppercase tracking-[0.3em] transition ${
                  light ? "hover:bg-zinc-100" : "hover:bg-white/10"
                } ${lng.code === language ? "font-bold" : light ? "font-light text-zinc-400" : "font-light opacity-70"}`}
              >
                {lng.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
