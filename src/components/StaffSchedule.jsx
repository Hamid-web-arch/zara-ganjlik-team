import { useEffect, useState } from "react";
import { getSchedule } from "../lib/api";
import { normalizeName } from "../lib/scheduleParser";
import { useLanguage } from "../lib/i18n/languageContext";

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const HOURS = Array.from({ length: 16 }, (_, i) => 6 + i);

// Keys match the normalised note text coming from the Excel file. Only colour is set
// here — the visible label is looked up from the active language.
const NOTE_STYLE = {
  off: { noteKey: "off", className: "text-white/40" },
  "day off": { noteKey: "off", className: "text-white/40" },
  vacation: { noteKey: "vacation", className: "text-emerald-400" },
  ld: { noteKey: "ld", className: "text-sky-400" },
  absent: { noteKey: "absent", className: "text-red-500" },
  "sick leave": { noteKey: "sick", className: "text-orange-400" },
};

function getNoteInfo(note, notes) {
  const key = String(note || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const style = NOTE_STYLE[key];
  if (style) return { label: notes[style.noteKey], className: style.className };
  // Unknown notes are shown as written in the spreadsheet.
  return { label: note, className: "text-amber-400" };
}

function getCodeClassName(code) {
  const key = String(code || "").trim().toLowerCase();
  if (key === "off" || key === "day off" || key === "in") return "text-white/50";
  return "text-sky-300";
}

export default function StaffSchedule({ employeeName }) {
  const { t } = useLanguage();
  const s = t.staffSchedule;
  const [schedule, setSchedule] = useState(undefined); // undefined = loading, null = not found
  const [weekLabel, setWeekLabel] = useState("");

  useEffect(() => {
    if (!employeeName) return;

    getSchedule()
      .then((data) => {
        if (!data) {
          setSchedule(null);
          return;
        }
        setWeekLabel(data.weekLabel || "");
        setSchedule(data.byEmployee?.[normalizeName(employeeName)] || null);
      })
      .catch((error) => {
        console.error("İş qrafiki yüklənərkən xəta:", error);
        setSchedule(null);
      });
  }, [employeeName]);

  return (
    <div className="mt-12 p-8 border border-white/5 bg-white/5 rounded-sm">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 className="text-[10px] uppercase tracking-[0.3em]">{s.title}</h2>
        {schedule && (
          <div className="flex items-center gap-4">
            {weekLabel && <span className="text-[9px] text-white/40 uppercase tracking-widest">{weekLabel}</span>}
            {schedule.weeklyTotal !== null && schedule.weeklyTotal !== undefined && schedule.weeklyTotal !== "" && (
              <span className="text-[9px] text-emerald-300 uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 rounded-sm">
                {s.total.replace("{n}", schedule.weeklyTotal)}
              </span>
            )}
          </div>
        )}
      </div>

      {schedule === undefined && (
        <p className="text-[10px] text-white/30 uppercase tracking-widest animate-pulse">{s.loading}</p>
      )}

      {schedule === null && (
        <p className="text-[10px] text-white/30 uppercase tracking-widest">{s.notUploaded}</p>
      )}

      {schedule && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-white/10 text-[8px] uppercase tracking-[0.2em] text-white/30">
                <th className="pt-2 pb-3 pl-2 pr-4 sticky left-0 bg-zinc-900">{s.day}</th>
                {HOURS.map((h) => (
                  <th key={h} className="pb-3 px-1 text-center font-normal">
                    {String(h).padStart(2, "0")}
                  </th>
                ))}
                <th className="pb-3 pl-4 pr-2 text-right">{s.sum}</th>
              </tr>
            </thead>
            <tbody>
              {DAY_KEYS.map((key) => {
                const day = schedule.days?.[key];
                const hasHours = (day?.hours?.length || 0) > 0;
                const totalNum = Number(day?.total);
                const workedButUndetailed = !hasHours && totalNum > 0;
                const showRestRow = !hasHours && !workedButUndetailed;
                const note = day?.note
                  ? getNoteInfo(day.note, s.notes)
                  : showRestRow
                  ? { label: s.notes.off, className: "text-white/40" }
                  : null;

                return (
                  <tr key={key} className={`border-b border-white/5 ${showRestRow ? "bg-white/[0.02]" : ""}`}>
                    <td className="py-3 pl-2 pr-4 text-[10px] text-white/70 whitespace-nowrap sticky left-0 bg-zinc-900">
                      {s.days[key]}
                      {note && (
                        <span className={`block text-[8px] uppercase tracking-widest mt-0.5 ${note.className}`}>
                          {note.label}
                        </span>
                      )}
                    </td>
                    {workedButUndetailed ? (
                      <td colSpan={HOURS.length} className="py-3 px-2 text-center text-[8px] text-white/30 italic">
                        {s.noBreakdown}
                      </td>
                    ) : showRestRow ? (
                      <td colSpan={HOURS.length} className="py-3 px-2 text-center text-[8px] text-white/20">
                        {s.restDay}
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
                    <td className="py-3 pl-4 pr-2 text-right text-[10px] text-white/70">
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
