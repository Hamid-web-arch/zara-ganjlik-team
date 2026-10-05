import { cert, getApps, initializeApp } from "firebase-admin/app";

/**
 * Accepts the private key in the shapes it commonly ends up in after being pasted into
 * Vercel's env UI: wrapped in quotes, with literal "\n" sequences instead of newlines,
 * or with surrounding whitespace. Anything else is passed through unchanged.
 */
function normalizePrivateKey(raw) {
  let key = (raw || "").trim();
  if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
  return key.replace(/\\n/g, "\n").trim();
}

/**
 * Vercel may reuse a warm serverless instance across invocations, so this guards
 * against calling initializeApp() more than once (which throws) by reusing the
 * existing app if one is already set up.
 *
 * Requires three env vars on Vercel (from a Firebase service account JSON, generated
 * in Firebase Console > Project Settings > Service Accounts > Generate new private key):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */
export function getAdminApp() {
  const existing = getApps();
  if (existing.length) return existing[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }),
  });
}

/** Resolves the caller's staff/crew profile doc, or null if they have none. */
export async function getCallerProfile(app, uid) {
  const { getFirestore } = await import("firebase-admin/firestore");
  const db = getFirestore(app);
  const [staffSnap, crewSnap] = await Promise.all([
    db.collection("staff").doc(uid).get(),
    db.collection("crew").doc(uid).get(),
  ]);
  if (staffSnap.exists) return { collectionName: "staff", data: staffSnap.data() };
  if (crewSnap.exists) return { collectionName: "crew", data: crewSnap.data() };
  return null;
}
