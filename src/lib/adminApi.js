import { errorMessage } from "./i18n/messages";
import { auth } from "./firebase";

async function callApi(path, body) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error(errorMessage("notSignedIn"));

  const resp = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, ...body }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || errorMessage("requestFailed"));
  return data;
}

/**
 * Uploads a file directly to Cloudinary using a short-lived signature issued by
 * /api/cloudinary-signature — the file itself never passes through our serverless
 * function (Vercel's Node functions cap request bodies at 4.5MB, far under a 50MB
 * video), and the Cloudinary API secret never reaches the browser bundle.
 */
export async function uploadToCloudinary(file, uploadType) {
  const { signature, timestamp, folder, apiKey, cloudName, resourceType } = await callApi(
    "/api/cloudinary-signature",
    { uploadType }
  );

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await resp.json();
  if (!data.secure_url) throw new Error(data.error?.message || errorMessage("uploadFailed"));
  return data.secure_url;
}

/** Deletes a staff/crew member's Firestore profile and their Firebase Auth account. */
export async function deleteMember(collectionName, uid) {
  return callApi("/api/delete-member", { collectionName, uid });
}
