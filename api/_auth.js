import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL_DAYS = 30;
const REFRESH_COOKIE = "refresh_token";

function requireSecret() {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not set.");
  return JWT_SECRET;
}

// --- passwords ---
export const hashPassword = (password) => bcrypt.hash(password, 10);
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

// --- access tokens (short-lived JWT, carries identity + role so most endpoints never
// need a DB round trip just to check who's asking) ---
export function signAccessToken({ id, kind, accessLevel }) {
  return jwt.sign({ uid: id, kind, accessLevel }, requireSecret(), { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, requireSecret());
    return { id: payload.uid, kind: payload.kind, accessLevel: payload.accessLevel };
  } catch {
    return null;
  }
}

/** Reads the Bearer access token from the request and returns the identity, or null. */
export function getAuthUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  return token ? verifyAccessToken(token) : null;
}

export function requireAuth(req, res) {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Giriş tələb olunur." });
    return null;
  }
  return user;
}

export function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (user.accessLevel !== "admin") {
    res.status(403).json({ error: "Bu əməliyyat üçün admin icazəsi tələb olunur." });
    return null;
  }
  return user;
}

// --- refresh tokens (opaque random value; only its SHA-256 hash is stored, so a DB leak
// alone can't be replayed — same reasoning as storing password hashes, not passwords) ---
export function generateRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** `remember=false` sets a session cookie (no Max-Age) that the browser drops on close,
 * instead of the usual 30-day persistent one ("remember me" at login). */
export function setRefreshCookie(res, token, remember = true) {
  const parts = [`${REFRESH_COOKIE}=${token}`, "Path=/api", "HttpOnly", "Secure", "SameSite=Strict"];
  if (remember) parts.push(`Max-Age=${REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60}`);
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearRefreshCookie(res) {
  res.setHeader("Set-Cookie", `${REFRESH_COOKIE}=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

export function getRefreshCookie(req) {
  return req.cookies?.[REFRESH_COOKIE] || null;
}
