import { useEffect, useRef, useState } from "react";
import { notify } from "../lib/notify";
import { listTrainings, markTrainingOpened, markTrainingCompleted } from "../lib/api";
import { useLanguage } from "../lib/i18n/languageContext";

export default function StaffTrainings() {
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

  return (
    <div className="mt-12 p-8 border border-white/5 bg-white/5 rounded-sm">
      <h2 className="text-[10px] uppercase tracking-[0.3em] mb-6">{s.heading}</h2>

      {loading ? (
        <p className="text-[9px] text-white/30 uppercase tracking-widest">{t.common.loading}</p>
      ) : (
        <div className="space-y-3">
          {trainings.map((tr) => (
            <button
              key={tr.id}
              onClick={() => handleOpen(tr)}
              className="w-full flex items-center justify-between gap-4 text-left border border-white/10 rounded-sm px-5 py-4 hover:border-white/30 transition"
            >
              <div className="min-w-0">
                <p className="text-[11px] text-white truncate">{tr.title}</p>
                {tr.description && <p className="text-[9px] text-white/40 mt-1 truncate">{tr.description}</p>}
              </div>
              <span
                className={`shrink-0 text-[8px] uppercase tracking-widest px-3 py-1.5 rounded-sm border ${
                  tr.myProgress?.completed
                    ? "border-emerald-500/30 text-emerald-500"
                    : tr.myProgress
                    ? "border-amber-500/30 text-amber-500"
                    : "border-white/10 text-white/30"
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
          <div className="glass w-full max-w-2xl p-8 space-y-6 relative">
            <button
              type="button"
              onClick={() => setActive(null)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition"
            >
              ✕
            </button>
            <div className="space-y-2">
              <h3 className="font-sync text-lg font-bold tracking-tighter pr-8">{active.title}</h3>
              {active.description && <p className="text-[11px] text-white/50 leading-relaxed">{active.description}</p>}
            </div>

            <div className="bg-black/30 rounded-sm overflow-hidden">
              {active.fileType === "image" && <img src={active.fileUrl} alt={active.title} className="w-full max-h-[50vh] object-contain" />}
              {active.fileType === "video" && (
                <video src={active.fileUrl} controls className="w-full max-h-[50vh]" />
              )}
              {active.fileType === "pdf" && (
                <iframe src={active.fileUrl} title={active.title} className="w-full h-[50vh] bg-white" />
              )}
              {active.fileType === "document" && (
                <a
                  href={active.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-10 text-[10px] uppercase tracking-widest text-white/70 hover:text-white transition"
                >
                  {s.openFile} ({active.fileName})
                </a>
              )}
            </div>

            {active.myProgress?.completed ? (
              <p className="text-[10px] uppercase tracking-widest text-emerald-500 text-center">{s.alreadyCompleted}</p>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={submitting}
                className="w-full border border-white/20 py-4 text-[9px] uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all disabled:opacity-40"
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
