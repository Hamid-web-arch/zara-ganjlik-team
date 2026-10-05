import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../lib/firebase";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../lib/config";

export default function UploadMomentModal({ open, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Zəhmət olmasa video seçin!");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      await addDoc(collection(db, "approved_moments"), {
        url: data.secure_url,
        caption: caption.trim() || "Zara Ganjlik Moment",
        status: "pending",
        createdAt: Date.now(),
      });

      alert("Müraciətiniz uğurla göndərildi! Menecer təsdiqlədikdən sonra canlı yayında görünəcək. 🛡️");
      setFile(null);
      setCaption("");
      onUploaded?.();
      onClose();
    } catch (err) {
      alert("Xəta baş verdi: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] px-4 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[450px] bg-white text-black p-8 md:p-10 shadow-2xl z-10 rounded-sm">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-lg transition-colors cursor-pointer p-2 leading-none z-30"
        >
          <i className="fa-solid fa-xmark" />
        </button>

        <div className="mb-6 select-none">
          <h3 className="text-sm font-black tracking-widest uppercase text-black">YENİ AN PAYLAŞ</h3>
          <p className="text-[9px] text-gray-400 font-light tracking-wide mt-0.5 uppercase">
            ZARA GANJLIK MALL STAFF PORTAL
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="relative w-full h-36 border border-dashed border-gray-400/40 flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-400/10 transition-colors cursor-pointer group rounded-sm">
            <input
              type="file"
              accept="video/*"
              required
              onChange={(e) => setFile(e.target.files[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            {!file ? (
              <div className="text-center flex flex-col items-center gap-1 pointer-events-none">
                <i className="fa-solid fa-cloud-arrow-up text-gray-400 text-lg group-hover:text-black transition-colors" />
                <p className="text-[10px] font-bold tracking-widest uppercase text-black">VİDEO SEÇİN</p>
                <p className="text-[9px] text-gray-400 font-light">MP4 format, max 50MB</p>
              </div>
            ) : (
              <div className="text-center p-2 pointer-events-none">
                <i className="fa-solid fa-circle-check text-green-600 text-lg block mb-1" />
                <p className="text-[11px] font-medium truncate max-w-[280px] text-black/80">{file.name}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400">
              BU ANIN HEKAYƏSİ NƏDİR?
            </label>
            <textarea
              rows={3}
              required
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Gənclik Mall komandası ilə keçən o maraqlı günü təsvir et..."
              className="w-full text-xs p-3 bg-white border border-gray-400/25 text-black outline-none resize-none font-light focus:border-black transition-colors rounded-sm"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-black text-white text-[10px] font-bold tracking-widest py-4 uppercase hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-40"
          >
            {uploading ? "UPLOADING TO BULUD..." : "YÜKLƏ VƏ TƏSDİQƏ GÖNDƏR"}
          </button>
        </form>
      </div>
    </div>
  );
}
