import { sql } from "./_db.js";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshCookie,
  clearRefreshCookie,
  getRefreshCookie,
  getAuthUser,
  REFRESH_TOKEN_TTL_DAYS,
} from "./_auth.js";

// Every auth action (login/refresh/logout/forgot-password/reset-password/me) lives in
// this one file, dispatched by body.action, instead of six near-identical endpoint files.

const findMemberByEmail = (email) => sql`select * from members where email = ${email}`.then((r) => r[0] || null);
const findMemberById = (id) => sql`select * from members where id = ${id}::uuid`.then((r) => r[0] || null);

function toProfile(member) {
  return {
    uid: member.id,
    kind: member.kind,
    name: member.name,
    role: member.role,
    idCode: member.id_code,
    email: member.email,
    accessLevel: member.access_level,
    image: member.image,
    mustResetPassword: member.must_reset_password,
  };
}

async function issueSession(res, member) {
  const accessToken = signAccessToken({ id: member.id, kind: member.kind, accessLevel: member.access_level });
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await sql`
    insert into refresh_tokens (member_id, token_hash, expires_at)
    values (${member.id}::uuid, ${hashToken(refreshToken)}, ${expiresAt})
  `;
  setRefreshCookie(res, refreshToken);
  return accessToken;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { action } = req.body || {};

  if (action === "login") {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email və şifrə tələb olunur." });

    const member = await findMemberByEmail(email.trim());
    if (!member || !(await verifyPassword(password, member.password_hash))) {
      return res.status(401).json({ error: "Giriş rədd edildi: Məlumatlar yanlışdır." });
    }
    const accessToken = await issueSession(res, member);
    return res.status(200).json({ accessToken, profile: toProfile(member) });
  }

  if (action === "refresh") {
    const token = getRefreshCookie(req);
    if (!token) return res.status(401).json({ error: "Sessiya tapılmadı." });

    const [row] = await sql`
      select * from refresh_tokens
      where token_hash = ${hashToken(token)} and revoked = false and expires_at > now()
    `;
    if (!row) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: "Sessiya etibarsızdır." });
    }

    const member = await findMemberById(row.member_id);
    if (!member) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: "Sessiya etibarsızdır." });
    }

    // Rotate: revoke the used refresh token and issue a fresh one, so a stolen token
    // only works once before the legitimate client's next refresh invalidates it.
    await sql`update refresh_tokens set revoked = true where id = ${row.id}::uuid`;
    const accessToken = await issueSession(res, member);
    return res.status(200).json({ accessToken, profile: toProfile(member) });
  }

  if (action === "logout") {
    const token = getRefreshCookie(req);
    if (token) await sql`update refresh_tokens set revoked = true where token_hash = ${hashToken(token)}`;
    clearRefreshCookie(res);
    return res.status(200).json({ success: true });
  }

  if (action === "forgot-password") {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email daxil edin." });

    const member = await findMemberByEmail(email.trim());
    if (member) {
      const token = generateRefreshToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await sql`
        insert into password_reset_tokens (member_id, token_hash, expires_at)
        values (${member.id}::uuid, ${hashToken(token)}, ${expiresAt})
      `;
      await sendResetEmail(member.email, token);
    }
    // Always a generic success response — confirming whether an email exists would let
    // anyone enumerate staff accounts.
    return res.status(200).json({ message: "Əgər bu email qeydiyyatdadırsa, bərpa linki göndərildi." });
  }

  if (action === "reset-password") {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: "Token və yeni şifrə tələb olunur." });
    if (newPassword.length < 8) return res.status(400).json({ error: "Şifrə ən azı 8 simvol olmalıdır." });

    const [row] = await sql`
      select * from password_reset_tokens
      where token_hash = ${hashToken(token)} and used = false and expires_at > now()
    `;
    if (!row) return res.status(400).json({ error: "Link etibarsızdır və ya vaxtı keçib." });

    const passwordHash = await hashPassword(newPassword);
    await sql`update members set password_hash = ${passwordHash}, updated_at = now() where id = ${row.member_id}::uuid`;
    await sql`update password_reset_tokens set used = true where id = ${row.id}::uuid`;
    // A password reset invalidates every existing session, in case the reset was
    // triggered because of a compromised account.
    await sql`update refresh_tokens set revoked = true where member_id = ${row.member_id}::uuid`;
    return res.status(200).json({ success: true });
  }

  if (action === "set-password") {
    // For a member who just signed in with a temporary password (mustResetPassword) and
    // needs to choose their own — unlike reset-password, this trusts the access token
    // from the login that just happened instead of an emailed token.
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Giriş tələb olunur." });
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "Şifrə ən azı 8 simvol olmalıdır." });
    }
    const passwordHash = await hashPassword(newPassword);
    await sql`
      update members set password_hash = ${passwordHash}, must_reset_password = false, updated_at = now()
      where id = ${user.id}::uuid
    `;
    const member = await findMemberById(user.id);
    return res.status(200).json({ profile: toProfile(member) });
  }

  if (action === "me") {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Giriş tələb olunur." });
    const member = await findMemberById(user.id);
    if (!member) return res.status(401).json({ error: "Hesab tapılmadı." });
    return res.status(200).json({ profile: toProfile(member) });
  }

  return res.status(400).json({ error: "Naməlum əməliyyat." });
}

async function sendResetEmail(to, token) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY təyin olunmayıb, bərpa e-poçtu göndərilmədi.");
    return;
  }
  const baseUrl = process.env.PUBLIC_URL || "https://zara-react.vercel.app";
  const link = `${baseUrl}/reset-password?token=${token}`;
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Zara GNC <onboarding@resend.dev>",
    to,
    subject: "Şifrə bərpası",
    html: `<p>Şifrənizi bərpa etmək üçün aşağıdakı linkə daxil olun (1 saat etibarlıdır):</p><p><a href="${link}">${link}</a></p>`,
  });
}
