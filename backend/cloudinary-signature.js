import crypto from "node:crypto";
import { getAuthUser } from "./_auth.js";

// Who may request a signature for which upload, and what it's used for. Keeping this
// server-side (instead of trusting a client-sent folder/resourceType) is the actual
// security boundary here — Cloudinary's signature only proves *that* we authorized
// these exact params, so the server must be the one choosing them.
const UPLOAD_TYPES = {
  moment: { folder: "zara/moments", resourceType: "video", adminOnly: false },
  avatar: { folder: "zara/avatars", resourceType: "image", adminOnly: false },
  briefing: { folder: "zara/briefings", resourceType: "video", adminOnly: true },
  energy: { folder: "zara/energy", resourceType: "video", adminOnly: true },
  hero: { folder: "zara/hero", resourceType: "image", adminOnly: true },
  // "auto": trainings can be pdf/docx/image/video — Cloudinary detects the right
  // resource type (raw for pdf/docx) from the uploaded file itself.
  training: { folder: "zara/trainings", resourceType: "auto", adminOnly: true },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { uploadType } = req.body || {};
  const config = UPLOAD_TYPES[uploadType];
  if (!config) return res.status(400).json({ error: "Keçərli uploadType tələb olunur." });

  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Giriş tələb olunur." });
  if (config.adminOnly && user.accessLevel !== "admin") {
    return res.status(403).json({ error: "Bu əməliyyat üçün admin icazəsi tələb olunur." });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { folder: config.folder, timestamp };
  // Cloudinary's signing rule: sort the signed params alphabetically by key, join as
  // key=value with "&", then SHA1 the result with the API secret appended.
  const toSign = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");
  const signature = crypto
    .createHash("sha1")
    .update(toSign + process.env.CLOUDINARY_API_SECRET)
    .digest("hex");

  return res.status(200).json({
    signature,
    timestamp,
    folder: config.folder,
    resourceType: config.resourceType,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
}
