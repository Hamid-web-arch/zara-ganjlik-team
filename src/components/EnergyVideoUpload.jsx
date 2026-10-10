import { notify } from "../lib/notify";
import { useEffect, useState } from "react";
import { getSettings, putSettings, uploadToCloudinary } from "../lib/api";
import { validateVideoFile } from "../lib/fileValidation";
import { useLanguage } from "../lib/i18n/languageContext";

export default function EnergyVideoUpload() {
  const { t } = useLanguage();
  const s = t.adminPanel.energy;
  const [previewUrl, setPreviewUrl] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getSettings("energy")
      .then((data) => {
        if (data?.videoUrl) setPreviewUrl(data.videoUrl);
      })
      .catch((error) => console.error("Video ayarları yüklənərkən xəta:", error));
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
      notify(s.noFile);
      return;
    }

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, "energy");
      await putSettings("energy", { videoUrl: url });
      setPreviewUrl(url);
      setFile(null);
      notify(s.success);
    } catch (error) {
      console.error("Video yüklənərkən xəta:", error);
      notify(t.adminPanel.members.saveError + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 p-4 md:p-8 rounded-sm">
      <div className="border-b border-zinc-200 pb-4 mb-6">
        <h2 className="font-sync text-xs tracking-widest uppercase text-zinc-900">{s.title}</h2>
        <p className="text-[9px] uppercase tracking-widest text-zinc-400 mt-1">{s.desc}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-[9px] uppercase tracking-widest text-zinc-400 block">{s.newVideo}</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="w-full bg-zinc-50 border border-zinc-200 py-3 px-4 text-[9px] outline-none cursor-pointer text-zinc-700"
          />
        </div>

        <button
          type="submit"
          disabled={uploading || !file}
          className="bg-zinc-900 text-white px-8 py-3 text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-700 transition disabled:opacity-40 whitespace-nowrap"
        >
          {uploading ? s.uploading : s.upload}
        </button>
      </form>

      {previewUrl && (
        <div className="mt-6 space-y-2">
          <label className="text-[9px] uppercase tracking-widest text-zinc-400 block">{s.preview}</label>
          <video
            src={previewUrl}
            className="w-full max-w-md h-40 object-cover rounded-sm border border-zinc-200"
            controls
            muted
          />
        </div>
      )}
    </div>
  );
}
