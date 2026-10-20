# Zara React — Firebase-dən öz backend-ə keçid (2026-10-10)

Firebase (Firestore + Auth) layihədən tamamilə çıxarıldı. İndi öz backend-imiz var:
**Postgres (Neon) + Vercel serverless funksiyalar + JWT autentifikasiya**. Media
yükləmələri əvvəlki kimi birbaşa Cloudinary-ə gedir (dəyişməyib).

## Memarlıq

- **Qovluq quruluşu:** frontend və backend ayrı qovluqlardadır —
  - `frontend/` — bütün React kodu (əvvəlki `src/`)
  - `backend/` — bütün server kodu: `_db.js`/`_auth.js` ortaq köməkçilər, `auth.js`,
    `router.js`, `cloudinary-signature.js`, `schema.sql`, `scripts/`
  - `api/` — yalnız 3 nazik fayl (`auth.js`, `router.js`, `cloudinary-signature.js`), hər
    biri `backend/`-dəki əsl kodu `export { default } from "../backend/..."` ilə yenidən
    ixrac edir. Bu qovluq görünməz qalmır, çünki **Vercel yalnız kök qovluqdakı `/api/`
    içindəki faylları Serverless Function kimi tanıyır** — başqa yerə köçürülsə, endpoint-lər
    işləməyi dayandırar. Əsl məntiqi dəyişmək üçün həmişə `backend/`-dəki faylı redaktə edin.
- **Verilənlər bazası:** Postgres, Neon (`@neondatabase/serverless` — HTTP əsaslı, Vercel-in
  qısa ömürlü funksiyaları üçün uyğun). Sxem: [`backend/schema.sql`](backend/schema.sql).
- **Autentifikasiya:** qısa ömürlü JWT access token (yaddaşda saxlanılır) + httpOnly
  cookie-də refresh token (30 gün, hər istifadədə yenilənir/rotasiya olunur). Şifrələr
  `bcryptjs` ilə hash-lənir.
- **Frontend:** `frontend/lib/api.js` (Firebase SDK-nı əvəz edir) + `frontend/lib/authContext.jsx` /
  `authState.js` (React context). `useAuthGuard` hook-u köhnə formasını saxlayır, ona görə
  əksər səhifə kodu dəyişmədi.
- **Real-time → polling:** Firestore-un canlı yenilənməsi (onSnapshot) sorğu-əsaslı
  yüklənmə ilə əvəzləndi (razılaşdırılmış qərar — WebSocket infrastrukturu əlavə edilmədi).

## Quraşdırma addımları (DEPLOY ETMƏZDƏN ƏVVƏL LAZIMDIR)

1. **Neon bazası yaradın:** Vercel → layihə → **Storage** tab → **Create Database** →
   **Neon**. `DATABASE_URL` avtomatik əlavə olunacaq.
2. **Sxemi tətbiq edin:** Vercel Storage-dəki Neon panelindən **SQL Editor**-u açın (və ya
   `psql "$DATABASE_URL" -f backend/schema.sql`) və [`backend/schema.sql`](backend/schema.sql)
   faylının tam məzmununu işlədin.
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
   node backend/scripts/migrate-from-firestore.mjs
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
