import { createContext, useContext } from "react";

// Kept in a non-component module so LanguageContext.jsx exports only components
// (keeps React fast refresh working, and keeps the hook importable everywhere).
export const LanguageContext = createContext(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
