import { useEffect, useState } from "react";
import { refreshSession, logout as apiLogout, onAccessTokenChange } from "./api";
import { AuthContext } from "./authState";

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, profile: null });

  useEffect(() => {
    refreshSession().then((profile) => setState({ loading: false, profile }));
    // If a 401-triggered silent refresh inside api.js ever fails mid-session (e.g. the
    // refresh cookie expired while the tab was idle), reflect that as signed-out here too.
    return onAccessTokenChange((token) => {
      if (!token) setState((s) => (s.profile ? { ...s, profile: null } : s));
    });
  }, []);

  const value = {
    loading: state.loading,
    profile: state.profile,
    setProfile: (profile) => setState((s) => ({ ...s, profile })),
    logout: async () => {
      await apiLogout();
      setState({ loading: false, profile: null });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
