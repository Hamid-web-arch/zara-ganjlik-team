import { useEffect, useMemo, useState } from "react";
import { DEFAULT_LANGUAGE, LANGUAGES, translations } from "./translations";
import { LanguageContext } from "./languageContext";

const STORAGE_KEY = "gnc_lang";

function getInitialLanguage() {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && translations[stored]) return stored;
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      languages: LANGUAGES,
      t: translations[language] ?? translations[DEFAULT_LANGUAGE],
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
