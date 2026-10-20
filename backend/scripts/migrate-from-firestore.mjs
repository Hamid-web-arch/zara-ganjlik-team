#!/usr/bin/env node
// One-time migration: Firestore -> Postgres. Run locally, never on Vercel:
//
//   npm install --no-save firebase-admin
//   node scripts/migrate-from-firestore.mjs
//
// Needs these in your shell env or .env.local (this script loads .env.local itself,
// no extra package required):
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY  (old Firebase
//     service account JSON — Firebase Console > Project Settings > Service Accounts)
//   DATABASE_URL  (the new Neon connection string)
//
// Passwords cannot be migrated — Firebase Auth never exposes them, by design. Every
// migrated member gets a random temporary password; this script prints a list of
// email -> temp password pairs at the end. Share each one with that person privately
// and have them sign in once and use "Forgot password" to set their own.
//
// Safe to re-run: it only ever INSERTs into a fresh schema. Don't run it twice against
// the same database without clearing the tables first, or you'll get duplicates.

import fs from "node:fs";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { neon } from "@neondatabase/serverless";

function loadEnvLocal() {
  try {
    const text = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
  } catch {
    // no .env.local — fine if the vars are already in the environment
  }
}
loadEnvLocal();

for (const name of ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY", "DATABASE_URL"]) {
  if (!process.env[name]) {
    console.error(`Çatışmayan env dəyişəni: ${name}`);
    process.exit(1);
  }
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const firestore = getFirestore(app);
const sql = neon(process.env.DATABASE_URL);

const toDate = (ts) => (ts?.toDate ? ts.toDate() : ts ? new Date(ts) : new Date());
const tempPasswords = [];
const memberIdMap = new Map(); // old Firebase uid -> new Postgres uuid
const momentIdMap = new Map(); // old Firestore doc id -> new uuid
const briefingIdMap = new Map();

async function migrateMembers(collectionName, kind) {
  const snap = await firestore.collection(collectionName).get();
  let count = 0;
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    if (!d.email) {
      console.warn(`Atlandı (email yoxdur): ${collectionName}/${docSnap.id}`);
      continue;
    }
    const tempPassword = crypto.randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    try {
      const [row] = await sql`
        insert into members (kind, name, role, id_code, email, password_hash, access_level, image, created_at)
        values (${kind}, ${d.name || ""}, ${d.role || ""}, ${d.idCode || ""}, ${d.email}, ${passwordHash},
                ${d.accessLevel === "admin" ? "admin" : "user"}, ${d.image || null}, ${toDate(d.createdAt)})
        returning id
      `;
      memberIdMap.set(docSnap.id, row.id);
      tempPasswords.push({ email: d.email, name: d.name, tempPassword });
      count++;
    } catch (error) {
      console.error(`Xəta (${collectionName}/${docSnap.id}, ${d.email}):`, error.message);
    }
  }
  console.log(`${collectionName}: ${count} üzv köçürüldü.`);
}

async function migrateSettings() {
  const hero = await firestore.doc("settings/hero").get();
  if (hero.exists) {
    const d = hero.data();
    const json = JSON.stringify({ title: d.title, image: d.image });
    await sql`insert into settings (key, value) values ('hero', ${json}::jsonb)`;
  }
  const energy = await firestore.doc("settings/energyVideo").get();
  if (energy.exists) {
    const d = energy.data();
    const json = JSON.stringify({ videoUrl: d.videoUrl });
    await sql`insert into settings (key, value) values ('energy', ${json}::jsonb)`;
  }
  console.log("settings: köçürüldü.");
}

async function migrateMoments() {
  const snap = await firestore.collection("approved_moments").get();
  let count = 0;
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const likedBy = (d.likedBy || []).map((uid) => memberIdMap.get(uid)).filter(Boolean);
    const [row] = await sql`
      insert into approved_moments (url, caption, status, liked_by, created_at)
      values (${d.url}, ${d.caption || ""}, ${d.status === "approved" ? "approved" : "pending"}, ${likedBy}::uuid[], ${toDate(d.createdAt)})
      returning id
    `;
    momentIdMap.set(docSnap.id, row.id);
    count++;
  }
  console.log(`approved_moments: ${count} video köçürüldü.`);
}

async function migrateBriefings() {
  const snap = await firestore.collection("briefings").get();
  let count = 0;
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const [row] = await sql`
      insert into briefings (title, description, url, created_at)
      values (${d.title || ""}, ${d.description || ""}, ${d.url}, ${toDate(d.createdAt)})
      returning id
    `;
    briefingIdMap.set(docSnap.id, row.id);
    count++;
  }
  console.log(`briefings: ${count} video köçürüldü.`);
}

async function migrateComments() {
  const snap = await firestore.collection("comments").get();
  const commentIdMap = new Map();
  const pendingParents = []; // [{ newId, oldParentId }]
  let count = 0;

  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const videoId = momentIdMap.get(d.videoId) || briefingIdMap.get(d.videoId);
    if (!videoId) {
      console.warn(`Atlandı (video tapılmadı): comments/${docSnap.id}`);
      continue;
    }
    const authorId = d.authorUid ? memberIdMap.get(d.authorUid) || null : null;
    const [row] = await sql`
      insert into comments (video_id, text, author_id, author_name, author_image, created_at)
      values (${videoId}::uuid, ${d.text || ""}, ${authorId}::uuid, ${d.authorName || null}, ${d.authorImage || null}, ${toDate(d.createdAt)})
      returning id
    `;
    commentIdMap.set(docSnap.id, row.id);
    if (d.parentId) pendingParents.push({ newId: row.id, oldParentId: d.parentId });
    count++;
  }

  for (const { newId, oldParentId } of pendingParents) {
    const newParentId = commentIdMap.get(oldParentId);
    if (newParentId) await sql`update comments set parent_id = ${newParentId}::uuid where id = ${newId}::uuid`;
  }

  console.log(`comments: ${count} şərh köçürüldü.`);
}

async function migrateSchedule() {
  const snap = await firestore.doc("work_schedule/current").get();
  if (!snap.exists) return;
  const d = snap.data();
  const json = JSON.stringify(d.byEmployee || {});
  await sql`
    insert into work_schedule (id, week_label, by_employee, uploaded_at)
    values ('current', ${d.weekLabel || ""}, ${json}::jsonb, ${toDate(d.uploadedAt)})
  `;
  console.log("work_schedule: köçürüldü.");
}

async function main() {
  await migrateMembers("staff", "staff");
  await migrateMembers("crew", "crew");
  await migrateSettings();
  await migrateMoments();
  await migrateBriefings();
  await migrateComments();
  await migrateSchedule();

  console.log("\n=== Müvəqqəti şifrələr (hər istifadəçiyə ayrıca, təhlükəsiz şəkildə göndərin) ===");
  for (const { email, name, tempPassword } of tempPasswords) {
    console.log(`${name || "(adsız)"} <${email}>: ${tempPassword}`);
  }
  console.log(`\nCəmi ${tempPasswords.length} hesab köçürüldü. Hər kəs ilk dəfə bu müvəqqəti şifrə ilə daxil olub,`);
  console.log(`sonra "Şifrəni unutmusunuz?" axını ilə öz şifrəsini təyin etməlidir.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Miqrasiya xətası:", error);
    process.exit(1);
  });
