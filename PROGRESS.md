# Zara React — təhlükəsizlik/bug-fix sessiyası: status (2026-10-05)

React miqrasiyası əvvəllər tamamlanmışdı (bax: git tarixçəsi, ilk commit). Bu sessiyada
aşkarlanan bütün kritik təhlükəsizlik problemləri və funksional baqlar düzəldildi.

## Nə dəyişdi

1. **`firestore.rules`** — `staff`/`crew` üçün self-update yalnız `image` sahəsi ilə
   məhdudlaşdırıldı (əvvəllər istənilən login olmuş istifadəçi özünə admin icazəsi verə
   bilərdi). `approved_moments` yalnız `pending` statuslu yaradıla bilər, `likedBy` hər
   kəs üçün yalnız öz uid-i ilə dəyişə bilər. `comments`-də `authorUid` saxtalaşdırıla
   bilməz.
   **DEPLOY EDİLMƏLİDİR:** `firebase deploy --only firestore:rules` (və ya konsoldan əl
   ilə paste) — mən bunu edə bilmədim, Firebase CLI-ə giriş yoxdur.

2. **Asılılıqlar** — `react-router`/`react-router-dom` 7.18.4-ə qalxdı (CSRF fix).
   `xlsx` npm-dəki köhnə/fix-siz versiya əvəzinə SheetJS-in öz CDN-indəki 0.20.3
   versiyası ilə əvəz olundu.

3. **Auth axınındakı "ilişmə" halları** düzəldildi (`AuthPage`, `useAuthGuard`).

4. **`MemberSection`** — email/password redaktəsi deaktiv edildi (yalnız yaradılışda
   mövcuddur) — çünki bu sahələr yalnız Firestore-u dəyişirdi, Auth hesabını yox.

5. **Serverless backend əlavə olundu (`api/`)** — ImgBB açarı və Cloudinary unsigned
   preset bundle-dan çıxarıldı, Cloudinary **signed upload** axınına keçirildi
   (`api/cloudinary-signature.js`). İşçi silinməsi indi Firestore profili **və** Firebase
   Auth hesabını birlikdə silir (`api/delete-member.js`).

   **DEPLOY ÜÇÜN TƏLƏB OLUNAN ADDIMLAR (istifadəçi tərəfindən edilməlidir):**
   - Vercel project → Settings → Environment Variables-a əlavə et:
     `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
     (Firebase Console → Project Settings → Service Accounts → Generate new private key)
     `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
     (Cloudinary Console → Dashboard)
   - Köhnə `VITE_IMGBB_API_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`,
     `VITE_CLOUDINARY_UPLOAD_PRESET` dəyişənləri artıq istifadə olunmur, silinə bilər.
   - Cloudinary-dəki köhnə **unsigned upload preset**-i (`lkb769t5`) təhlükəsizlik üçün
     silmək/deaktiv etmək tövsiyə olunur — artıq heç bir kod onu çağırmır, amma preset
     adı əvvəllər bundle-da açıq idi.
   - Lokal test üçün `vite dev` kifayət deyil (o, `/api` funksiyalarını icra etmir) —
     `vercel dev` istifadə edin, və yuxarıdakı dəyişənləri `.env.local`-a da əlavə edin.

6. **Digər kiçik fix-lər:** `MomentCard` like-sync baqı, `StaffProfilePage`-də
   idarə olunmayan xəta və bloklayıcı alert ardıcıllığı, `HomePage`-də yanlış
   `<a><li>` strukturu, türkcə mətnlər ("YORUMLAR" → "ŞƏRHLƏR", "BEĞENİ" → "BƏYƏNMƏ"),
   bütün yükləmə formalarına fayl ölçüsü/tip validasiyası (`src/lib/fileValidation.js`).

## Hələ görülməyən (bu sessiyanın əhatə dairəsindən kənar, qeyd olunub)

- 48 yerdə `alert()`/`confirm()` istifadəsi — funksional baq deyil, UX keyfiyyət
  məsələsidir. Toast/modal sisteminə keçid ayrıca iş kimi görülməlidir.
- i18n yalnız `HomePage`-dədir, digər 6 səhifə hard-coded Azərbaycan mətnidir.
- `StaffSchedule` işçini **ad** üzrə uyğunlaşdırır (`idCode` deyil) — Excel-dəki
  yazılış fərqlərinə həssasdır.
- Test faylı yoxdur (`playwright` quraşdırılıb, istifadə olunmur).
