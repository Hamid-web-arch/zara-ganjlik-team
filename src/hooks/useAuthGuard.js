import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/authState";

/**
 * Same external contract as before the Firebase removal: { loading, authorized, profile,
 * collectionName }, redirecting to /auth when signed out and (with requireAdmin) to
 * /staff-profile when signed in but not an admin. profile.kind ("staff" | "crew") is
 * exposed as collectionName to match how callers already used it.
 */
export function useAuthGuard({ requireAdmin = false } = {}) {
  const navigate = useNavigate();
  const { loading, profile } = useAuth();
  const authorized = !loading && !!profile && (!requireAdmin || profile.accessLevel === "admin");

  useEffect(() => {
    if (loading) return;
    if (!profile) navigate("/auth");
    else if (requireAdmin && profile.accessLevel !== "admin") navigate("/staff-profile");
  }, [loading, profile, requireAdmin, navigate]);

  return {
    loading,
    authorized,
    profile: authorized ? profile : null,
    collectionName: authorized ? profile.kind : null,
  };
}
