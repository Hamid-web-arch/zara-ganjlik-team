import { useEffect, useRef, useState } from "react";
import { notify } from "../lib/notify";
import { listTrainings, markTrainingOpened, markTrainingCompleted } from "../lib/api";
import { useLanguage } from "../lib/i18n/languageContext";

// Cloudinary's documented way to force a real download (Content-Disposition: attachment)
// instead of navigating to the file — plain `download` attributes are ignored by browsers
// for cross-origin URLs like Cloudinary's, so this has to be a URL-level flag.
function toDownloadUrl(url) {
  return url.includes("/upload/") ? url.replace("/upload/", "/upload/fl_attachment/") : url;
}

export default function StaffTrainings({ dark = true }) {
  const { t } = useLanguage();
  const s = t.staffProfile.trainings;
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // the training currently open in the viewer
  const [submitting, setSubmitting] = useState(false);
  const openedAtRef = useRef(null);

  const load = () =>
    listTrainings()
      .then(setTrainings)
      .catch((error) => console.error("Təlimlər yüklənərkən xəta:", error))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleOpen = (training) => {
    setActive(training);
    openedAtRef.current = Date.now();
    if (!training.myProgress) markTrainingOpened(training.id).catch(() => {});
  };

  const handleComplete = async () => {
    if (!active) return;
    setSubmitting(true);
    const secondsSpent = Math.round((Date.now() - openedAtRef.current) / 1000);
    try {
      await markTrainingCompleted(active.id, secondsSpent);
      notify(s.completedNotice);
      setActive(null);
      await load();
    } catch (error) {
      notify(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && trainings.length === 0) return null;

  const outlineBtn = dark
    ? "border-white/20 hover:bg-white hover:text-black"
    : "border-black/20 hover:bg-black hover:text-white";

  return (
    <div className={`mt-12 p-8 border rounded-sm ${dark ? "border-white/5 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
      <h2 className="text-[10px] uppercase tracking-[0.3em] mb-6">{s.heading}</h2>

      {loading ? (
        <p className={`text-[9px] uppercase tracking-widest ${dark ? "text-white/30" : "text-gray-400"}`}>{t.common.loading}</p>
      ) : (
        <div className="space-y-3">
          {trainings.map((tr) => (
            <button
              key={tr.id}
              onClick={() => handleOpen(tr)}
              className={`w-full flex items-center justify-between gap-4 text-left border rounded-sm px-5 py-4 transition ${
                dark ? "border-white/10 hover:border-white/30" : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <div className="min-w-0">
                <p className="text-[11px] truncate">{tr.title}</p>
                {tr.description && (
                  <p className={`text-[9px] mt-1 truncate ${dark ? "text-white/40" : "text-gray-400"}`}>{tr.description}</p>
                )}
              </div>
              <span
                className={`shrink-0 text-[8px] uppercase tracking-widest px-3 py-1.5 rounded-sm border ${
                  tr.myProgress?.completed
                    ? "border-emerald-500/30 text-emerald-500"
                    : tr.myProgress
                    ? "border-amber-500/30 text-amber-500"
                    : dark
                    ? "border-white/10 text-white/30"
                    : "border-gray-200 text-gray-400"
                }`}
              >
                {tr.myProgress?.completed ? s.completed : tr.myProgress ? s.opened : s.notOpened}
              </span>
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className={`w-full max-w-2xl p-8 space-y-6 relative ${dark ? "glass" : "bg-white border border-gray-200 text-black rounded-sm shadow-xl"}`}>
            <button
              type="button"
              onClick={() => setActive(null)}
              className={`absolute top-4 right-4 transition ${dark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-black"}`}
            >
              ✕
            </button>
            <div className="space-y-2">
              <h3 className="font-sync text-lg font-bold tracking-tighter pr-8">{active.title}</h3>
              {active.description && (
                <p className={`text-[11px] leading-relaxed ${dark ? "text-white/50" : "text-gray-500"}`}>{active.description}</p>
              )}
            </div>

            <div className={`rounded-sm overflow-hidden ${dark ? "bg-black/30" : "bg-gray-100"}`}>
              {active.fileType === "image" && <img src={active.fileUrl} alt={active.title} className="w-full max-h-[50vh] object-contain" />}
              {active.fileType === "video" && (
                <video src={active.fileUrl} controls className="w-full max-h-[50vh]" />
              )}
              {(active.fileType === "pdf" || active.fileType === "document") && (
                <div className="flex flex-col items-center justify-center gap-4 py-12 px-4">
                  <i className={`fa-regular fa-file-lines text-3xl ${dark ? "text-white/30" : "text-gray-300"}`} />
                  <p className={`text-[10px] uppercase tracking-widest text-center break-all ${dark ? "text-white/50" : "text-gray-500"}`}>
                    {active.fileName}
                  </p>
                </div>
              )}
            </div>

            {(active.fileType === "pdf" || active.fileType === "document") && (
              <div className="flex gap-3">
                <a
                  href={active.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex-1 text-center text-[9px] uppercase tracking-widest border py-3 transition ${outlineBtn}`}
                >
                  {s.openFile}
                </a>
                <a
                  href={toDownloadUrl(active.fileUrl)}
                  className={`flex-1 text-center text-[9px] uppercase tracking-widest border py-3 transition ${outlineBtn}`}
                >
                  {s.download}
                </a>
              </div>
            )}

            {(active.fileType === "image" || active.fileType === "video") && (
              <a
                href={toDownloadUrl(active.fileUrl)}
                className={`block text-center text-[9px] uppercase tracking-widest border py-3 transition ${outlineBtn}`}
              >
                {s.download}
              </a>
            )}

            {active.myProgress?.completed ? (
              <p className="text-[10px] uppercase tracking-widest text-emerald-500 text-center">{s.alreadyCompleted}</p>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={submitting}
                className={`w-full border py-4 text-[9px] uppercase tracking-[0.5em] transition-all disabled:opacity-40 ${outlineBtn}`}
              >
                {submitting ? s.submitting : s.markComplete}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
