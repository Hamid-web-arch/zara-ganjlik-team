// Client-side only guard: none of these upload forms go through a backend, so this is
// the only check in place before a file reaches ImgBB/Cloudinary. It can't stop a
// determined attacker from calling those APIs directly, but it does stop accidental
// huge uploads and non-video/image files from being submitted via the UI.
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB, matches the UI copy
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

function validate(file, { maxBytes, acceptPrefix, label }) {
  if (!file.type.startsWith(acceptPrefix)) {
    return `Yalnız ${label} faylları qəbul olunur.`;
  }
  if (file.size > maxBytes) {
    return `Fayl ölçüsü ${Math.round(maxBytes / (1024 * 1024))}MB-dan böyük ola bilməz (seçilən: ${(
      file.size /
      (1024 * 1024)
    ).toFixed(1)}MB).`;
  }
  return null;
}

export function validateVideoFile(file, maxBytes = MAX_VIDEO_BYTES) {
  return validate(file, { maxBytes, acceptPrefix: "video/", label: "video" });
}

export function validateImageFile(file, maxBytes = MAX_IMAGE_BYTES) {
  return validate(file, { maxBytes, acceptPrefix: "image/", label: "şəkil" });
}
