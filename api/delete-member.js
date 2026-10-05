import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp, getCallerProfile } from "./_firebaseAdmin.js";

// Deletes a staff/crew member's Firestore profile *and* their Firebase Auth account.
// The old client-only flow only ever deleted the Firestore doc, leaving the Auth
// account (and therefore login access) behind — this is the fix for that.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { idToken, collectionName, uid } = req.body || {};
  if (!idToken || !["staff", "crew"].includes(collectionName) || !uid) {
    return res.status(400).json({ error: "idToken, collectionName (staff|crew) və uid tələb olunur." });
  }

  try {
    const app = getAdminApp();
    const decoded = await getAuth(app).verifyIdToken(idToken);

    const caller = await getCallerProfile(app, decoded.uid);
    if (caller?.data?.accessLevel !== "admin") {
      return res.status(403).json({ error: "Yalnız admin istifadəçi silə bilər." });
    }

    await getFirestore(app).collection(collectionName).doc(uid).delete();

    try {
      await getAuth(app).deleteUser(uid);
    } catch (authError) {
      if (authError.code === "auth/user-not-found") {
        // Already gone from Auth (e.g. deleted previously) — nothing left to clean up.
        return res.status(200).json({ success: true });
      }
      // Profile is gone but the login still works — tell the admin explicitly instead
      // of reporting a plain success that would hide this.
      return res.status(207).json({
        warning: `Profil silindi, lakin giriş hesabı silinmədi: ${authError.message}. Firebase konsolundan əl ilə silin.`,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Üzv silinmə xətası:", error);
    return res.status(401).json({ error: "Doğrulama uğursuz oldu." });
  }
}
