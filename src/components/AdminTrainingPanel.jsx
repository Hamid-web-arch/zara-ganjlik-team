import { notify, confirmAsync } from "../lib/notify";
import { useEffect, useState } from "react";
import { listMembers, listTrainings, getTraining, createTraining, deleteTraining, uploadToCloudinary } from "../lib/api";
import { validateVideoFile } from "../lib/fileValidation";
import { useLanguage } from "../lib/i18n/languageContext";

const SECTIONS = ["woman", "men", "kids"];

function detectFileType(file) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "pdf";
  if (["mp4", "mov", "webm", "avi"].includes(ext)) return "video";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "image";
  return "document";
}

function formatSeconds(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return m > 0 ? `${m}dq ${sec}sn` : `${sec}sn`;
}

export default function AdminTrainingPanel() {
  const { t } = useLanguage();
  const s = t.adminPanel.trainings;
  const [members, setMembers] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [targetSections, setTargetSections] = useState([]);
  const [targetRoles, setTargetRoles] = useState([]);
  const [targetMemberIds, setTargetMemberIds] = useState([]);

  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const roles = [...new Set(members.map((m) => m.role).filter(Boolean))];

  const loadAll = async () => {
    setLoading(true);
    try {
      const [staff, crew, list] = await Promise.all([listMembers("staff"), listMembers("crew"), listTrainings()]);
      setMembers([...staff, ...crew]);
      setTrainings(list);
    } catch (error) {
      console.error("Təlimlər yüklənərkən xəta:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const toggleIn = (setFn) => (value) =>
    setFn((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return notify(s.noFile);
    if (!title.trim()) return notify(s.noTitle);

    setUploading(true);
    try {
      const fileUrl = await uploadToCloudinary(file, "training");
      await createTraining({
        title: title.trim(),
        description: description.trim(),
        fileUrl,
        fileName: file.name,
        fileType: detectFileType(file),
        target: { sections: targetSections, roles: targetRoles, memberIds: targetMemberIds },
      });
      setTitle("");
      setDescription("");
      setFile(null);
      setTargetSections([]);
      setTargetRoles([]);
      setTargetMemberIds([]);
      notify(s.success);
      await loadAll();
    } catch (error) {
      console.error("Təlim yüklənərkən xəta:", error);
      notify(s.saveError + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      setDetail(await getTraining(id));
    } catch (error) {
      notify(s.loadError + error.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirmAsync(s.deleteConfirm))) return;
    setDeletingId(id);
    try {
      await deleteTraining(id);
      if (expandedId === id) {
        setExpandedId(null);
        setDetail(null);
      }
      await loadAll();
    } catch (error) {
      notify(s.deleteError + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const checkboxRowClass = "flex items-center gap-2 text-[10px] text-zinc-600 cursor-pointer";

  return (
    <div className="bg-white border border-zinc-200 p-4 md:p-8 rounded-sm space-y-10">
      <div className="border-b border-zinc-200 pb-4">
        <h2 className="font-sync text-xs tracking-widest uppercase text-zinc-900">{s.title}</h2>
        <p className="text-[9px] uppercase tracking-widest text-zinc-400 mt-1">{s.desc}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={s.titlePh}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent border-b border-zinc-200 py-3 text-[10px] tracking-[0.2em] outline-none focus:border-zinc-900 text-zinc-900 placeholder:text-zinc-400"
          />
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,video/*"
            onChange={(e) => {
              const selected = e.target.files[0] || null;
              if (selected && selected.type.startsWith("video/")) {
                const validationError = validateVideoFile(selected);
                if (validationError) {
                  notify(validationError);
                  e.target.value = "";
                  return;
                }
              }
              setFile(selected);
            }}
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

        <div className="bg-zinc-50 border border-zinc-200 rounded-sm p-4 space-y-4">
          <p className="text-[9px] uppercase tracking-widest text-zinc-400">{s.targetTitle}</p>
          <p className="text-[9px] text-zinc-400">{s.targetHint}</p>

          <div className="space-y-2">
            <span className="text-[8px] uppercase tracking-widest text-zinc-400 block">{s.bySection}</span>
            <div className="flex flex-wrap gap-4">
              {SECTIONS.map((sec) => (
                <label key={sec} className={checkboxRowClass}>
                  <input type="checkbox" checked={targetSections.includes(sec)} onChange={() => toggleIn(setTargetSections)(sec)} />
                  {t.adminPanel.members.sectionOptions[sec]}
                </label>
              ))}
            </div>
          </div>

          {roles.length > 0 && (
            <div className="space-y-2">
              <span className="text-[8px] uppercase tracking-widest text-zinc-400 block">{s.byRole}</span>
              <div className="flex flex-wrap gap-4">
                {roles.map((role) => (
                  <label key={role} className={checkboxRowClass}>
                    <input type="checkbox" checked={targetRoles.includes(role)} onChange={() => toggleIn(setTargetRoles)(role)} />
                    {role}
                  </label>
                ))}
              </div>
            </div>
          )}

          {members.length > 0 && (
            <div className="space-y-2">
              <span className="text-[8px] uppercase tracking-widest text-zinc-400 block">{s.byMember}</span>
              <div className="max-h-32 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-1">
                {members.map((m) => (
                  <label key={m.id} className={checkboxRowClass}>
                    <input
                      type="checkbox"
                      checked={targetMemberIds.includes(m.id)}
                      onChange={() => toggleIn(setTargetMemberIds)(m.id)}
                    />
                    <span className="truncate">
                      {m.name} <span className="text-zinc-400">— {m.role}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="bg-zinc-900 text-white px-8 py-3 text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-700 transition disabled:opacity-40"
        >
          {uploading ? s.uploading : s.add}
        </button>
      </form>

      <div className="space-y-3">
        {loading && <p className="text-center text-zinc-400 text-[9px] uppercase tracking-widest py-6">{t.common.loading}</p>}
        {!loading && trainings.length === 0 && (
          <p className="text-center text-zinc-300 text-[9px] uppercase tracking-widest py-6">{s.empty}</p>
        )}
        {!loading &&
          trainings.map((tr) => (
            <div key={tr.id} className="border border-zinc-200 rounded-sm">
              <div className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="text-[11px] text-zinc-900 truncate">{tr.title}</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5">
                    {tr.fileType.toUpperCase()} · {s.openedOf.replace("{opened}", tr.openedCount).replace("{completed}", tr.completedCount)}
                  </p>
                </div>
                <div className="flex gap-4 shrink-0">
                  <button onClick={() => handleExpand(tr.id)} className="text-[8px] text-blue-600 uppercase tracking-widest">
                    {expandedId === tr.id ? s.hideDetails : s.showDetails}
                  </button>
                  <button
                    disabled={deletingId === tr.id}
                    onClick={() => handleDelete(tr.id)}
                    className="text-[8px] text-red-600 uppercase tracking-widest disabled:opacity-40"
                  >
                    {deletingId === tr.id ? s.deleting : s.remove}
                  </button>
                </div>
              </div>

              {expandedId === tr.id && (
                <div className="border-t border-zinc-100 p-4 bg-zinc-50">
                  {detailLoading && <p className="text-[9px] text-zinc-400 uppercase tracking-widest">{t.common.loading}</p>}
                  {!detailLoading && detail && (
                    <div className="space-y-2">
                      <p className="text-[9px] text-zinc-400 uppercase tracking-widest mb-3">
                        {s.targetedCount.replace("{n}", detail.targetedMembers.length)}
                      </p>
                      {detail.targetedMembers.length === 0 && (
                        <p className="text-[9px] text-zinc-400">{s.noTarget}</p>
                      )}
                      {detail.targetedMembers.map((m) => {
                        const p = detail.progress.find((row) => row.memberId === m.id);
                        return (
                          <div key={m.id} className="flex items-center justify-between gap-3 text-[10px] py-1.5 border-b border-zinc-100 last:border-0">
                            <span className="text-zinc-900 truncate">
                              {m.name} <span className="text-zinc-400">— {m.role}</span>
                            </span>
                            {p ? (
                              <span className={`shrink-0 ${p.completed ? "text-emerald-600" : "text-amber-600"}`}>
                                {p.completed ? s.completed : s.opened} · {formatSeconds(p.secondsSpent)}
                              </span>
                            ) : (
                              <span className="shrink-0 text-zinc-300">{s.notOpened}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
