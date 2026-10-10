import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/authState";

/**
 * Same external contract as before the Firebase removal: { loading, authorized, profile,
 * collectionName }, redirecting to /auth when signed out and (with requireAdmin) to
 * /staff-profile when signed in but not an admin. profile.kind ("staff" | "crew") is
 * exposed as collectionName to match how callers already used it.
 *
 * Also redirects to /force-password-reset whenever the member is still on a temporary
 * (admin-set) password — before anything else in the app is usable.
 */
export function useAuthGuard({ requireAdmin = false } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, profile } = useAuth();
  const mustReset = !!profile?.mustResetPassword;
  const authorized = !loading && !!profile && !mustReset && (!requireAdmin || profile.accessLevel === "admin");

  useEffect(() => {
    if (loading) return;
    if (!profile) navigate("/auth");
    else if (mustReset) {
      if (location.pathname !== "/force-password-reset") navigate("/force-password-reset");
    } else if (requireAdmin && profile.accessLevel !== "admin") navigate("/staff-profile");
  }, [loading, profile, mustReset, requireAdmin, navigate, location.pathname]);

  return {
    loading,
    authorized,
    profile: authorized ? profile : null,
    collectionName: authorized ? profile.kind : null,
  };
}
