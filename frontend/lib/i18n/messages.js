import { translations, DEFAULT_LANGUAGE } from "./translations";

// For non-React modules (validation, API helpers) that can't call useLanguage(). Reads
// the same language key LanguageProvider persists, so messages follow the user's choice.
export function currentLanguage() {
  try {
    const stored = window.localStorage.getItem("gnc_lang");
    if (stored && translations[stored]) return stored;
  } catch {
    // Storage can be blocked (private mode); fall back to the default language.
  }
  return DEFAULT_LANGUAGE;
}

/** Looks up a `common.errors.*` message and fills {placeholders}. */
export function errorMessage(key, vars = {}) {
  let text = translations[currentLanguage()].common.errors[key];
  for (const [name, value] of Object.entries(vars)) text = text.replace(`{${name}}`, value);
  return text;
}
