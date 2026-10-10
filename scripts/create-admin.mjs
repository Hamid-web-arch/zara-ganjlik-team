#!/usr/bin/env node
// One-time bootstrap: creates the first admin account directly in the database.
// Needed because the admin UI itself requires being logged in as an admin already —
// this is the only way to create the very first one. Run locally:
//
//   node scripts/create-admin.mjs
//
// Needs DATABASE_URL in .env.local (already there if you ran `vercel env pull`).
// Prompts for name/email/password interactively — nothing is hard-coded here, and
// nothing is sent anywhere except straight into your own database as a bcrypt hash.

import fs from "node:fs";
import readline from "node:readline";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

function loadEnvLocal() {
  try {
    const text = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
  } catch {}
}
loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL tapılmadı. Əvvəlcə: npx vercel env pull .env.local");
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

const name = (await ask("Ad Soyad: ")).trim();
const role = (await ask("Vəzifə (məs. General Manager): ")).trim() || "Admin";
const idCode = (await ask("ID kod (məs. 0001): ")).trim() || "0001";
const email = (await ask("Email: ")).trim();
const password = (await ask("Şifrə (ən azı 8 simvol): ")).trim();
rl.close();

if (!name || !email || password.length < 8) {
  console.error("Ad, email tələb olunur, şifrə ən azı 8 simvol olmalıdır.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const passwordHash = await bcrypt.hash(password, 10);

try {
  const [row] = await sql`
    insert into members (kind, name, role, id_code, email, password_hash, access_level)
    values ('staff', ${name}, ${role}, ${idCode}, ${email}, ${passwordHash}, 'admin')
    returning id, email
  `;
  console.log(`\nAdmin hesabı yaradıldı: ${row.email} (id: ${row.id})`);
  console.log("İndi /auth səhifəsində bu email/şifrə ilə Manager girişi edə bilərsiniz.");
} catch (error) {
  if (error.code === "23505") console.error("Bu email artıq mövcuddur.");
  else console.error("Xəta:", error.message);
  process.exit(1);
}
