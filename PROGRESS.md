# Zara React — Firebase-dən öz backend-ə keçid (2026-10-10)

Firebase (Firestore + Auth) layihədən tamamilə çıxarıldı. İndi öz backend-imiz var:
**Postgres (Neon) + Vercel serverless funksiyalar + JWT autentifikasiya**. Media
yükləmələri əvvəlki kimi birbaşa Cloudinary-ə gedir (dəyişməyib).

## Memarlıq

- **Verilənlər bazası:** Postgres, Neon (`@neondatabase/serverless` — HTTP əsaslı, Vercel-in
  qısa ömürlü funksiyaları üçün uyğun). Sxem: [`db/schema.sql`](db/schema.sql).
- **Backend:** `api/` qovluğunda yığcam fayllar (hər endpoint üçün ayrı fayl yox):
  - `api/_db.js`, `api/_auth.js` — ortaq köməkçilər
  - `api/auth.js` — login/refresh/logout/forgot-password/reset-password/me
  - `api/[...route].js` — members, moments, comments, briefings, settings, schedule
  - `api/cloudinary-signature.js` — media yükləmə üçün imza
- **Autentifikasiya:** qısa ömürlü JWT access token (yaddaşda saxlanılır) + httpOnly
  cookie-də refresh token (30 gün, hər istifadədə yenilənir/rotasiya olunur). Şifrələr
  `bcryptjs` ilə hash-lənir.
- **Frontend:** `src/lib/api.js` (Firebase SDK-nı əvəz edir) + `src/lib/authContext.jsx` /
  `authState.js` (React context). `useAuthGuard` hook-u köhnə formasını saxlayır, ona görə
  əksər səhifə kodu dəyişmədi.
- **Real-time → polling:** Firestore-un canlı yenilənməsi (onSnapshot) sorğu-əsaslı
  yüklənmə ilə əvəzləndi (razılaşdırılmış qərar — WebSocket infrastrukturu əlavə edilmədi).

## Quraşdırma addımları (DEPLOY ETMƏZDƏN ƏVVƏL LAZIMDIR)

1. **Neon bazası yaradın:** Vercel → layihə → **Storage** tab → **Create Database** →
   **Neon**. `DATABASE_URL` avtomatik əlavə olunacaq.
2. **Sxemi tətbiq edin:** Vercel Storage-dəki Neon panelindən **SQL Editor**-u açın (və ya
   `psql "$DATABASE_URL" -f db/schema.sql`) və [`db/schema.sql`](db/schema.sql) faylının
   tam məzmununu işlədin.
3. **Env dəyişənləri əlavə edin** (Vercel → Settings → Environment Variables):
   - `JWT_SECRET` — təsadüfi uzun sətir: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `RESEND_API_KEY`, `EMAIL_FROM` — [resend.com](https://resend.com) (parol bərpası
     e-poçtları üçün)
   - `PUBLIC_URL` — `https://zara-react.vercel.app` (bərpa linkləri üçün)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — dəyişmədi
   - Ətraflı: [`.env.example`](.env.example)
4. **Köhnə Firestore məlumatlarını köçürün** (staff/crew, moments, şərhlər, briefing,
   qrafik): lokal olaraq
   ```
   npm install --no-save firebase-admin
   node scripts/migrate-from-firestore.mjs
   ```
   Firebase service account açarı (`FIREBASE_PROJECT_ID`/`CLIENT_EMAIL`/`PRIVATE_KEY`) və
   yeni `DATABASE_URL` `.env.local`-da olmalıdır. Script sonda hər köçürülmüş hesab üçün
   **müvəqqəti şifrə** çap edir — şifrələr Firebase Auth-dan miqrasiya oluna bilmir (heç vaxt
   açıq şəkildə saxlanılmır), ona görə hər işçi ilk dəfə müvəqqəti şifrə ilə daxil olub
   "Şifrəni unutmusunuz?" axını ilə öz şifrəsini təyin etməlidir. Təfərrüatlar script
   daxilindəki şərhlərdə.
5. **Deploy edin:** `npx vercel --prod` (və ya GitHub-a push, əgər layihə qoşulubsa).

## Lokal işləmə

```
npx vercel dev
```

(`npm run dev` yalnız Vite-ı işə salır, `/api` funksiyaları işləmir.)

## Qalan iş

- Sayt responsivliyinin yenidən nəzərdən keçirilməsi — davam edir.
