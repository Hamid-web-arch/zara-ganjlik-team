import { notify } from "../lib/notify";
import { useEffect, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadToCloudinary } from "../lib/adminApi";
import { validateVideoFile } from "../lib/fileValidation";

export default function EnergyVideoUpload() {
  const [previewUrl, setPreviewUrl] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "energyVideo"));
        if (snap.exists() && snap.data().videoUrl) {
          setPreviewUrl(snap.data().videoUrl);
        }
      } catch (error) {
        console.error("Video ayarları yüklənərkən xəta:", error);
      }
    })();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    const validationError = validateVideoFile(selected);
    if (validationError) {
      notify(validationError);
      e.target.value = "";
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      notify("Zəhmət olmasa video seçin.");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, "energy");

      await setDoc(doc(db, "settings", "energyVideo"), {
        videoUrl: url,
        updatedAt: serverTimestamp(),
      });

      setPreviewUrl(url);
      setFile(null);
      notify("Video uğurla yeniləndi!");
    } catch (error) {
      console.error("Video yüklənərkən xəta:", error);
      notify("Xəta baş verdi: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="my-8">
      <div className="glass p-8 rounded-sm">
        <div className="border-b border-white/10 pb-4 mb-6">
          <h2 className="font-sync text-xs tracking-widest uppercase">"Our Energy" Video</h2>
          <p className="text-[9px] uppercase tracking-widest text-white/30 mt-1">
            Əsas səhifədəki video bölməsinin fon videosu
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-[9px] uppercase tracking-widest text-white/30 block">Yeni Video</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="w-full bg-white/5 border border-white/5 py-3 px-4 text-[9px] outline-none cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="bg-white text-black px-8 py-3 text-[9px] font-bold uppercase tracking-widest hover:bg-gray-50 transition disabled:opacity-40 whitespace-nowrap"
          >
            {uploading ? "YÜKLƏNİR..." : "Yüklə"}
          </button>
        </form>

        {previewUrl && (
          <div className="mt-6 space-y-2">
            <label className="text-[9px] uppercase tracking-widest text-white/30 block">Önbaxış</label>
            <video
              src={previewUrl}
              className="w-full max-w-md h-40 object-cover rounded-sm border border-white/10"
              controls
              muted
            />
          </div>
        )}
      </div>
    </div>
  );
}
