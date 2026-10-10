import { createContext, useContext } from "react";

// Kept in a non-component module so authContext.jsx exports only the provider component
// (keeps React fast refresh working), same pattern as lib/i18n/languageContext.js.
export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
