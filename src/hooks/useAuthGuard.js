import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

/**
 * Resolves the signed-in user's staff/crew profile doc and redirects to /auth when
 * signed out. With `requireAdmin`, also redirects to /staff-profile when there is no
 * profile doc or its accessLevel isn't "admin" (matches AdminPage's original guard —
 * a missing profile is treated the same as "not admin").
 *
 * Without `requireAdmin`, any authenticated user is authorized even with no profile
 * doc (matches MomentsPage's original guard, which only requires being signed in).
 */
export function useAuthGuard({ requireAdmin = false, onError } = {}) {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, authorized: false, profile: null, collectionName: null });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        const [staffSnap, crewSnap] = await Promise.all([
          getDoc(doc(db, "staff", user.uid)),
          getDoc(doc(db, "crew", user.uid)),
        ]);
        const collectionName = staffSnap.exists() ? "staff" : crewSnap.exists() ? "crew" : null;
        const data = staffSnap.exists() ? staffSnap.data() : crewSnap.exists() ? crewSnap.data() : null;

        if (requireAdmin && data?.accessLevel !== "admin") {
          navigate("/staff-profile");
          return;
        }

        setState({
          loading: false,
          authorized: true,
          profile: data ? { ...data, uid: user.uid, authEmail: user.email } : null,
          collectionName,
        });
      } catch (error) {
        console.error("Auth Guard Xətası:", error);
        // Without this, a Firestore error left `loading: true` forever — the caller
        // (e.g. AdminPage, which doesn't pass onError) would be stuck on an
        // "Authenticating..." screen with no way out.
        setState({ loading: false, authorized: false, profile: null, collectionName: null });
        // Callers without their own onError (e.g. AdminPage) would otherwise sit on the
        // "Authenticating..." screen forever — send them back to sign-in instead.
        if (onError) onError(error);
        else navigate("/auth");
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, requireAdmin]);

  return state;
}
