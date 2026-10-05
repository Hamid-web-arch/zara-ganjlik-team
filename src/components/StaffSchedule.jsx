import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { normalizeName } from "../lib/scheduleParser";

const DAY_LABELS = [
  ["monday", "Bazar ertəsi"],
  ["tuesday", "Çərşənbə axşamı"],
  ["wednesday", "Çərşənbə"],
  ["thursday", "Cümə axşamı"],
  ["friday", "Cümə"],
  ["saturday", "Şənbə"],
  ["sunday", "Bazar"],
];

const HOURS = Array.from({ length: 16 }, (_, i) => 6 + i);

// Minimal, meaning-based colour use only — no per-code rainbow, just text colour.
const NOTE_INFO = {
  off: { label: "İstirahət günü", className: "text-white/40" },
  "day off": { label: "İstirahət günü", className: "text-white/40" },
  vacation: { label: "Məzuniyyət", className: "text-emerald-400" },
  ld: { label: "İcazə günü", className: "text-sky-400" },
  absent: { label: "Qeyri-iştirak", className: "text-red-500" },
  "sick leave": { label: "Xəstəlik", className: "text-orange-400" },
};

function getNoteInfo(note) {
  const key = String(note || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  return NOTE_INFO[key] || { label: note, className: "text-amber-400" };
}

function getCodeClassName(code) {
  const key = String(code || "").trim().toLowerCase();
  if (key === "off" || key === "day off" || key === "in") return "text-white/50";
  return "text-sky-300";
}

export default function StaffSchedule({ employeeName }) {
  const [schedule, setSchedule] = useState(undefined); // undefined = loading, null = not found
  const [weekLabel, setWeekLabel] = useState("");

  useEffect(() => {
    if (!employeeName) return;

    (async () => {
      try {
        const snap = await getDoc(doc(db, "work_schedule", "current"));
        if (!snap.exists()) {
          setSchedule(null);
          return;
        }
        const data = snap.data();
        setWeekLabel(data.weekLabel || "");
        setSchedule(data.byEmployee?.[normalizeName(employeeName)] || null);
      } catch (error) {
        console.error("İş qrafiki yüklənərkən xəta:", error);
        setSchedule(null);
      }
    })();
  }, [employeeName]);

  return (
    <div className="mt-12 p-8 border border-white/5 bg-white/5 rounded-sm">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 className="text-[10px] uppercase tracking-[0.3em]">İş Qrafiki</h2>
        {schedule && (
          <div className="flex items-center gap-4">
            {weekLabel && <span className="text-[9px] text-white/40 uppercase tracking-widest">{weekLabel}</span>}
            {schedule.weeklyTotal !== null && schedule.weeklyTotal !== undefined && schedule.weeklyTotal !== "" && (
              <span className="text-[9px] text-emerald-300 uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 rounded-sm">
                Cəmi: {schedule.weeklyTotal} saat
              </span>
            )}
          </div>
        )}
      </div>

      {schedule === undefined && (
        <p className="text-[10px] text-white/30 uppercase tracking-widest animate-pulse">Yüklənir...</p>
      )}

      {schedule === null && (
        <p className="text-[10px] text-white/30 uppercase tracking-widest">Hələ iş qrafikiniz yüklənməyib.</p>
      )}

      {schedule && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-white/10 text-[8px] uppercase tracking-[0.2em] text-white/30">
                <th className="pb-3 pr-4 sticky left-0 bg-zinc-900">Gün</th>
                {HOURS.map((h) => (
                  <th key={h} className="pb-3 px-1 text-center font-normal">
                    {String(h).padStart(2, "0")}
                  </th>
                ))}
                <th className="pb-3 pl-4 text-right">Cəm</th>
              </tr>
            </thead>
            <tbody>
              {DAY_LABELS.map(([key, label]) => {
                const day = schedule.days?.[key];
                const hasHours = (day?.hours?.length || 0) > 0;
                const totalNum = Number(day?.total);
                const workedButUndetailed = !hasHours && totalNum > 0;
                const showRestRow = !hasHours && !workedButUndetailed;
                const note = day?.note ? getNoteInfo(day.note) : showRestRow ? NOTE_INFO.off : null;

                return (
                  <tr key={key} className={`border-b border-white/5 ${showRestRow ? "bg-white/[0.02]" : ""}`}>
                    <td className="py-3 pr-4 text-[10px] text-white/70 whitespace-nowrap sticky left-0 bg-zinc-900">
                      {label}
                      {note && (
                        <span className={`block text-[8px] uppercase tracking-widest mt-0.5 ${note.className}`}>
                          {note.label}
                        </span>
                      )}
                    </td>
                    {workedButUndetailed ? (
                      <td colSpan={HOURS.length} className="py-3 px-2 text-center text-[8px] text-white/30 italic">
                        Saat bölgüsü qeyd olunmayıb — menecerlə yoxlayın
                      </td>
                    ) : showRestRow ? (
                      <td colSpan={HOURS.length} className="py-3 px-2 text-center text-[8px] text-white/20">
                        İstirahət günüdür
                      </td>
                    ) : (
                      HOURS.map((h) => {
                        const cell = day?.hours?.find((x) => x.hour === h);
                        return (
                          <td key={h} className="py-3 px-1 text-center text-[8px]">
                            {cell ? (
                              <span className={`uppercase whitespace-nowrap ${getCodeClassName(cell.code)}`}>
                                {cell.code}
                              </span>
                            ) : (
                              <span className="text-white/10">–</span>
                            )}
                          </td>
                        );
                      })
                    )}
                    <td className="py-3 pl-4 text-right text-[10px] text-white/70">
                      {day?.total !== "" && day?.total != null ? day.total : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
