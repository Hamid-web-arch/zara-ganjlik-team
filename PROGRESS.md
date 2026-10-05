# Zara Genclik — React miqrasiyası: status

## Kontekst
`ZARA team` layihəsi (Firebase + statik HTML/JS ilə yazılmış Zara Gənclik komanda saytı) React-a köçürülür. Köhnə statik sayt (`auth.htm`, `admin.htm`, `staff-profile.htm`, `moments.htm`, `index.html`, `js/*.js`) toxunulmadan qalıb, React versiyası ayrıca `zara-react/` alt-qovluğunda qurulur.

## Texniki qərarlar
- Build tool: **Vite**
- Stil: **Tailwind CSS v4** (`@tailwindcss/vite` plugin ilə)
- Backend: **Firebase** (Auth + Firestore), `firebase` npm paketi ilə — köhnə `js/firebase-config.js` config-i `zara-react/src/lib/firebase.js`-ə köçürülüb
- Routing: **react-router-dom**

## İndiyə qədər görülənlər
- `zara-react/` Vite+React skeleti quraşdırılıb, Tailwind v4 və Firebase inteqrasiya olunub.
- `auth.htm` + `js/auth.js` **tam köçürülüb**: `zara-react/src/pages/AuthPage.jsx`
  - Admin/Staff rol seçimi, login formu, şifrə sıfırlama modalı, `onAuthStateChanged` ilə avtomatik yönləndirmə (`/admin` və ya `/staff-profile`-ə).
- `staff-profile.htm` + `js/staff-profile.js` **tam köçürülüb**: `zara-react/src/pages/StaffProfilePage.jsx`
  - Profil məlumatları (`staff`/`crew`), ImgBB şəkil yükləmə, şifrə sıfırlama, logout.
- `admin.htm` + `js/admin.js` **tam köçürülüb**: `zara-react/src/pages/AdminPage.jsx`
  - Auth guard (yalnız `accessLevel: admin`), Hero Section ayarları, Crew/Staff idarəetməsi (`src/components/MemberSection.jsx` — hər ikisi üçün ortaq komponent), Moments approve/reject/live-feed idarəetməsi (`src/components/AdminMomentsPanel.jsx`).
  - Qeyd: orijinal kodda crew/staff redaktəsi zamanı şəkil həmişə default avatara sıfırlanırdı (mövcud olmayan `*-img-file` input-una istinad — ölü kod idi). React versiyasında bu düzəldilib, mövcud şəkil redaktədə qorunur.
- `moments.htm` + `js/moments.js` **tam köçürülüb**: `zara-react/src/pages/MomentsPage.jsx`
  - `src/components/MomentCard.jsx` (scroll-snap video feed, IntersectionObserver ilə avtomatik play/pause, progress bar), `src/components/CommentPanel.jsx` (real-time şərh/cavab paneli), `src/components/UploadMomentModal.jsx` (Cloudinary video yükləmə).
  - Font Awesome CDN linki `zara-react/index.html`-ə əlavə olundu (ikonlar üçün).
- `index.html` (əsas sayt) **tam köçürülüb**: `zara-react/src/pages/HomePage.jsx`
  - Header scroll effekti (React state ilə, imperativ DOM manipulyasiyası əvəzinə), Hero (Firestore `settings/hero`-dan real-time başlıq/şəkil), Video bölməsi ("Explore Moments" düyməsi indi `/moments` route-una `navigate` edir), Store Philosophy, 6 Basics, Core Values (statik məzmun), Crew/Staff komandası (`src/components/TeamSwiper.jsx` — hər ikisi üçün ortaq **Swiper React** komponenti, əvvəlki vanilla Swiper CDN-i əvəz edir), statik Moments qalereyası, Digitalization bölməsi, Footer.
  - `swiper` npm paketi əlavə olundu (CDN script/link əvəzinə — layihənin artıq npm-ə keçmiş Firebase konvensiyasına uyğun).
  - Qeyd: orijinal `index.html`-də ikinci, istifadə olunmayan bir upload modal var idi (`#uploadModal`/`#uploadForm` — onu açan `#openUploadBtn` yalnız `moments.htm` overlay-i inject olunanda mövcud olurdu, ölü kod idi). React versiyasında köçürülmədi, çünki `/moments` route-unda tam işlək upload axını artıq var.
  - Qeyd: `.font-fashion` üçün orijinalda iki fərqli tərif var idi (`style.css`-də Playfair Display, `auth.htm`-in öz stilində Georgia). React versiyasında tətbiq boyu tək dizayn sistemi üçün artıq qurulmuş Georgia tərifi saxlanıldı.
- Routing `zara-react/src/App.jsx`-də təyin olunub: `/` → `HomePage`, `/auth`, `/admin`, `/staff-profile`, `/moments` — hamısı əsl komponentlərə bağlıdır, placeholder qalmayıb.
- Firebase key-lər (`IMGBB_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`) `src/lib/config.js`-də mərkəzləşdirilib.
- Bir CSS xətası düzəldildi: Google Fonts `@import` sətri Tailwind `@import "tailwindcss"`-dən **əvvəl** olmalıdır (`src/index.css`), əks halda Vite build xətası verir.

## Miqrasiya tamamlandı
Bütün səhifələr (`auth`, `staff-profile`, `admin`, `moments`, əsas sayt) React-a köçürülüb. Qalan işlər:
- Deploy üçün `firebase.json`-dakı `hosting.public` sahəsini `.`-dan `zara-react/dist`-ə dəyişmək.
- Real brauzerdə tam interaktiv test (login axınları, Cloudinary/ImgBB yükləmə, real-time şərhlər, Swiper carousel davranışı) hələ edilməyib — bu mühitdə browser automation aləti (chromium-cli/playwright) yoxdur, yalnız `vite build` + `oxlint` + route-ların HTTP 200 qaytarması yoxlanılıb. İstifadəçi `npm run dev` ilə əl ilə test etməlidir.
- Köhnə statik fayllar (`auth.htm`, `admin.htm`, `staff-profile.htm`, `moments.htm`, `index.html`, `js/*.js`) hələ toxunulmayıb qalıb — React versiyası tam təsdiqlənəndən sonra silinə bilər.

## Necə davam etmək
Bu fayl bitəndən sonra silinə bilər — sadəcə davamlılıq üçün yazılıb.
