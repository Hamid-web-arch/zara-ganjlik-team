import { errorMessage } from "./i18n/messages";

// Client-side only guard: none of these upload forms go through a backend, so this is
// the only check in place before a file reaches Cloudinary. It can't stop a determined
// attacker from calling the upload API directly, but it does stop accidental huge
// uploads and non-video/image files from being submitted via the UI.
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB, matches the UI copy
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

const MB = 1024 * 1024;

function validate(file, { maxBytes, acceptPrefix, wrongTypeKey }) {
  if (!file.type.startsWith(acceptPrefix)) {
    return errorMessage(wrongTypeKey);
  }
  if (file.size > maxBytes) {
    return errorMessage("tooLarge", {
      max: Math.round(maxBytes / MB),
      size: (file.size / MB).toFixed(1),
    });
  }
  return null;
}

export function validateVideoFile(file, maxBytes = MAX_VIDEO_BYTES) {
  return validate(file, { maxBytes, acceptPrefix: "video/", wrongTypeKey: "videoOnly" });
}

export function validateImageFile(file, maxBytes = MAX_IMAGE_BYTES) {
  return validate(file, { maxBytes, acceptPrefix: "image/", wrongTypeKey: "imageOnly" });
}
