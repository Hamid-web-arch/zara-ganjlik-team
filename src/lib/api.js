// Replaces src/lib/firebase.js + src/lib/adminApi.js. One compact client for everything
// the frontend needs from the backend: auth (access token kept in memory only, refresh
// token lives in an httpOnly cookie the browser sends automatically) and every data
// resource, instead of a Firebase SDK call per page/component.

let accessToken = null;
const authListeners = new Set();

function setAccessToken(token) {
  accessToken = token;
  authListeners.forEach((fn) => fn(token));
}

/** Called by authContext.jsx to react to login/logout from anywhere (e.g. a 401 retry). */
export function onAccessTokenChange(fn) {
  authListeners.add(fn);
  return () => authListeners.delete(fn);
}

async function request(path, { method = "GET", body, retry = true } = {}) {
  const resp = await fetch(path, {
    method,
    credentials: "include", // sends the httpOnly refresh cookie
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (resp.status === 401 && retry && path !== "/api/auth") {
    // The access token expires every 15 minutes; a silent refresh keeps the user signed
    // in without them noticing, same as Firebase's token auto-refresh used to.
    const refreshed = await refreshSession();
    if (refreshed) return request(path, { method, body, retry: false });
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `Sorğu uğursuz oldu (${resp.status}).`);
  return data;
}

// ---------- auth ----------
export async function login(email, password, remember = true) {
  const { accessToken: token, profile } = await request("/api/auth", {
    method: "POST",
    body: { action: "login", email, password, remember },
  });
  setAccessToken(token);
  return profile;
}

export async function logout() {
  await request("/api/auth", { method: "POST", body: { action: "logout" } }).catch(() => {});
  setAccessToken(null);
}

export async function refreshSession() {
  try {
    const { accessToken: token, profile } = await request("/api/auth", { method: "POST", body: { action: "refresh" }, retry: false });
    setAccessToken(token);
    return profile;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export const forgotPassword = (email) => request("/api/auth", { method: "POST", body: { action: "forgot-password", email } });
export const resetPassword = (token, newPassword) =>
  request("/api/auth", { method: "POST", body: { action: "reset-password", token, newPassword } });
/** For a member who just signed in with a temporary (admin-set) password. */
export const setPassword = (newPassword) =>
  request("/api/auth", { method: "POST", body: { action: "set-password", newPassword } });
/** Self-service password change from the profile page (knows their current password). */
export const changePassword = (currentPassword, newPassword) =>
  request("/api/auth", { method: "POST", body: { action: "change-password", currentPassword, newPassword } });
/** Admin: issues a new one-time password for an existing member; they must reset it at next login. */
export const issueTemporaryPassword = (memberId, newPassword) =>
  request("/api/auth", { method: "POST", body: { action: "admin-reset-password", memberId, newPassword } });

// ---------- members (staff/crew) ----------
export const listMembers = (kind) => request(`/api/members/${kind}`);
export const createMember = (kind, data) => request(`/api/members/${kind}`, { method: "POST", body: data });
export const updateMember = (kind, id, data) => request(`/api/members/${kind}/${id}`, { method: "PATCH", body: data });
export const deleteMember = (kind, id) => request(`/api/members/${kind}/${id}`, { method: "DELETE" });

// ---------- moments ----------
export const listApprovedMoments = () => request(`/api/moments?status=approved`);
export const listAllMoments = () => request(`/api/moments`); // admin: { pending, approved }
export const createMoment = (url, caption) => request(`/api/moments`, { method: "POST", body: { url, caption } });
export const approveMoment = (id) => request(`/api/moments/${id}`, { method: "PATCH", body: { action: "approve" } });
export const likeMoment = (id) => request(`/api/moments/${id}`, { method: "PATCH", body: { action: "like" } });
export const unlikeMoment = (id) => request(`/api/moments/${id}`, { method: "PATCH", body: { action: "unlike" } });
export const deleteMoment = (id) => request(`/api/moments/${id}`, { method: "DELETE" });

// ---------- comments ----------
export const listComments = (videoId) => request(`/api/comments?videoId=${videoId}`);
export const commentCounts = (videoIds) => request(`/api/comments?videoIds=${videoIds.join(",")}`);
export const createComment = (videoId, text, parentId) => request(`/api/comments`, { method: "POST", body: { videoId, text, parentId } });
export const deleteComment = (id) => request(`/api/comments/${id}`, { method: "DELETE" });

// ---------- briefings ----------
export const listBriefings = () => request(`/api/briefings`);
export const getBriefing = (id) => request(`/api/briefings/${id}`);
export const createBriefing = (data) => request(`/api/briefings`, { method: "POST", body: data });
export const deleteBriefing = (id) => request(`/api/briefings/${id}`, { method: "DELETE" });
/** Toggles the signed-in member's reaction on a briefing (same emoji again removes it). */
export const reactToBriefing = (id, emoji) => request(`/api/briefings/${id}`, { method: "PATCH", body: { emoji } });

// ---------- settings ----------
export const getSettings = (key) => request(`/api/settings/${key}`);
export const putSettings = (key, value) => request(`/api/settings/${key}`, { method: "PUT", body: value });

// ---------- work schedule ----------
export const getSchedule = () => request(`/api/schedule`);
export const putSchedule = (weekLabel, byEmployee) => request(`/api/schedule`, { method: "PUT", body: { weekLabel, byEmployee } });

// ---------- trainings ----------
export const listTrainings = () => request(`/api/trainings`);
export const getTraining = (id) => request(`/api/trainings/${id}`);
export const createTraining = (data) => request(`/api/trainings`, { method: "POST", body: data });
export const deleteTraining = (id) => request(`/api/trainings/${id}`, { method: "DELETE" });
export const markTrainingOpened = (id) => request(`/api/trainings/${id}`, { method: "PATCH", body: { action: "open" } });
export const markTrainingCompleted = (id, secondsSpent) =>
  request(`/api/trainings/${id}`, { method: "PATCH", body: { action: "complete", secondsSpent } });

// ---------- media upload ----------
/**
 * Uploads a file directly to Cloudinary using a short-lived signature issued by
 * /api/cloudinary-signature — the file itself never passes through our serverless
 * function (Vercel's Node functions cap request bodies at 4.5MB, far under a 50MB
 * video), and the Cloudinary API secret never reaches the browser bundle.
 */
export async function uploadToCloudinary(file, uploadType) {
  const { signature, timestamp, folder, apiKey, cloudName, resourceType } = await request("/api/cloudinary-signature", {
    method: "POST",
    body: { uploadType },
  });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, { method: "POST", body: formData });
  const data = await resp.json();
  if (!data.secure_url) throw new Error(data.error?.message || "Yükləmə uğursuz oldu.");
  return data.secure_url;
}
