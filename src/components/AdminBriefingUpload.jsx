import { notify, confirmAsync } from "../lib/notify";
import { useEffect, useState } from "react";
import { listBriefings, createBriefing, deleteBriefing, uploadToCloudinary } from "../lib/api";
import { validateVideoFile } from "../lib/fileValidation";
import { useLanguage } from "../lib/i18n/languageContext";

export default function AdminBriefingUpload() {
  const { t } = useLanguage();
  const s = t.adminPanel.briefings;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [briefings, setBriefings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadBriefings = async () => {
    setLoading(true);
    try {
      setBriefings(await listBriefings());
    } catch (error) {
      console.error("Breefinglər yüklənərkən xəta:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBriefings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      notify(s.noVideo);
      return;
    }
    if (!title.trim()) {
      notify(s.noTitle);
      return;
    }
    const validationError = validateVideoFile(file);
    if (validationError) {
      notify(validationError);
      return;
    }

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, "briefing");
      await createBriefing({ title: title.trim(), description: description.trim(), url });

      setTitle("");
      setDescription("");
      setFile(null);
      notify(s.success);
      await loadBriefings();
    } catch (error) {
      console.error("Breefing yüklənərkən xəta:", error);
      notify(t.adminPanel.members.saveError + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirmAsync(s.deleteConfirm))) return;
    setDeletingId(id);
    try {
      await deleteBriefing(id);
      setBriefings((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      notify(t.adminPanel.comments.deleteError + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 p-4 md:p-8 rounded-sm">
      <div className="border-b border-zinc-200 pb-4 mb-6">
        <h2 className="font-sync text-xs tracking-widest uppercase text-zinc-900">{s.title}</h2>
        <p className="text-[9px] uppercase tracking-widest text-zinc-400 mt-1">{s.desc}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={s.titlePh}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent border-b border-zinc-200 py-3 text-[10px] tracking-[0.2em] outline-none focus:border-zinc-900 text-zinc-900"
          />
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files[0] || null)}
            className="w-full bg-zinc-50 border border-zinc-200 py-3 px-4 text-[9px] outline-none cursor-pointer text-zinc-700"
          />
        </div>
        <textarea
          rows={2}
          placeholder={s.descPh}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-transparent border-b border-zinc-200 py-3 text-[10px] tracking-[0.2em] outline-none focus:border-zinc-900 text-zinc-900 resize-none"
        />
        <button
          type="submit"
          disabled={uploading}
          className="bg-zinc-900 text-white px-8 py-3 text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-700 transition disabled:opacity-40"
        >
          {uploading ? s.uploading : s.add}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto">
        {loading && (
          <p className="col-span-full text-center text-zinc-400 text-[9px] uppercase tracking-widest py-6">
            {t.common.loading}
          </p>
        )}
        {!loading && briefings.length === 0 && (
          <p className="col-span-full text-center text-zinc-300 text-[9px] uppercase tracking-widest py-6">
            {s.empty}
          </p>
        )}
        {!loading &&
          briefings.map((b) => (
            <div key={b.id} className="border border-zinc-200 bg-zinc-50 p-3 rounded-sm space-y-2">
              <video src={b.url} className="w-full aspect-video object-cover rounded-sm bg-zinc-200" muted preload="metadata" />
              <p className="text-[10px] text-zinc-900 truncate">{b.title}</p>
              <button
                disabled={deletingId === b.id}
                onClick={() => handleDelete(b.id)}
                className="text-[8px] text-red-600 uppercase tracking-widest disabled:opacity-40"
              >
                {deletingId === b.id ? s.deleting : s.remove}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
