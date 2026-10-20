import { useEffect, useState } from "react";
import { getSchedule } from "../lib/api";
import { normalizeName } from "../lib/scheduleParser";
import { useLanguage } from "../lib/i18n/languageContext";

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const HOURS = Array.from({ length: 16 }, (_, i) => 6 + i);

// Keys match the normalised note text coming from the Excel file. Only colour is set
// here — the visible label is looked up from the active language.
const NOTE_STYLE = {
  off: { noteKey: "off", className: "text-white/40", lightClassName: "text-gray-400" },
  "day off": { noteKey: "off", className: "text-white/40", lightClassName: "text-gray-400" },
  vacation: { noteKey: "vacation", className: "text-emerald-400", lightClassName: "text-emerald-600" },
  ld: { noteKey: "ld", className: "text-sky-400", lightClassName: "text-sky-600" },
  absent: { noteKey: "absent", className: "text-red-500", lightClassName: "text-red-600" },
  "sick leave": { noteKey: "sick", className: "text-orange-400", lightClassName: "text-orange-600" },
};

function getNoteInfo(note, notes, dark) {
  const key = String(note || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const style = NOTE_STYLE[key];
  if (style) return { label: notes[style.noteKey], className: dark ? style.className : style.lightClassName };
  // Unknown notes are shown as written in the spreadsheet.
  return { label: note, className: "text-amber-500" };
}

function getCodeClassName(code, dark) {
  const key = String(code || "").trim().toLowerCase();
  if (key === "off" || key === "day off" || key === "in") return dark ? "text-white/50" : "text-gray-500";
  return dark ? "text-sky-300" : "text-sky-600";
}

export default function StaffSchedule({ employeeName, dark = true }) {
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

  const dim30 = dark ? "text-white/30" : "text-gray-400";
  const dim40 = dark ? "text-white/40" : "text-gray-400";
  const dim70 = dark ? "text-white/70" : "text-gray-700";
  const stickyBg = dark ? "bg-zinc-900" : "bg-gray-50";

  return (
    <div className={`mt-12 p-8 border rounded-sm ${dark ? "border-white/5 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 className="text-[10px] uppercase tracking-[0.3em]">{s.title}</h2>
        {schedule && (
          <div className="flex items-center gap-4">
            {weekLabel && <span className={`text-[9px] uppercase tracking-widest ${dim40}`}>{weekLabel}</span>}
            {schedule.weeklyTotal !== null && schedule.weeklyTotal !== undefined && schedule.weeklyTotal !== "" && (
              <span
                className={`text-[9px] uppercase tracking-widest border px-3 py-1 rounded-sm ${
                  dark ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" : "text-emerald-700 border-emerald-500/30 bg-emerald-50"
                }`}
              >
                {s.total.replace("{n}", schedule.weeklyTotal)}
              </span>
            )}
          </div>
        )}
      </div>

      {schedule === undefined && (
        <p className={`text-[10px] uppercase tracking-widest animate-pulse ${dim30}`}>{s.loading}</p>
      )}

      {schedule === null && <p className={`text-[10px] uppercase tracking-widest ${dim30}`}>{s.notUploaded}</p>}

      {schedule &&
        (() => {
          // Computed once per day and shared by both the desktop table and the mobile
          // card list below, so the two views can never disagree on what a day shows.
          const rows = DAY_KEYS.map((key) => {
            const day = schedule.days?.[key];
            const hasHours = (day?.hours?.length || 0) > 0;
            const totalNum = Number(day?.total);
            const workedButUndetailed = !hasHours && totalNum > 0;
            const showRestRow = !hasHours && !workedButUndetailed;
            const note = day?.note
              ? getNoteInfo(day.note, s.notes, dark)
              : showRestRow
              ? { label: s.notes.off, className: dim40 }
              : null;
            return { key, day, hasHours, workedButUndetailed, showRestRow, note };
          });

          return (
            <>
              {/* Tablet and up: the full hour-by-hour grid, scrollable if it's narrower than 760px. */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className={`border-b text-[8px] uppercase tracking-[0.2em] ${dark ? "border-white/10" : "border-gray-200"} ${dim30}`}>
                      <th className={`pt-2 pb-3 pl-2 pr-4 sticky left-0 ${stickyBg}`}>{s.day}</th>
                      {HOURS.map((h) => (
                        <th key={h} className="pb-3 px-1 text-center font-normal">
                          {String(h).padStart(2, "0")}
                        </th>
                      ))}
                      <th className="pb-3 pl-4 pr-2 text-right">{s.sum}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ key, day, workedButUndetailed, showRestRow, note }) => (
                      <tr
                        key={key}
                        className={`border-b ${dark ? "border-white/5" : "border-gray-200/70"} ${
                          showRestRow ? (dark ? "bg-white/[0.02]" : "bg-black/[0.02]") : ""
                        }`}
                      >
                        <td className={`py-3 pl-2 pr-4 text-[10px] whitespace-nowrap sticky left-0 ${dim70} ${stickyBg}`}>
                          {s.days[key]}
                          {note && (
                            <span className={`block text-[8px] uppercase tracking-widest mt-0.5 ${note.className}`}>
                              {note.label}
                            </span>
                          )}
                        </td>
                        {workedButUndetailed ? (
                          <td colSpan={HOURS.length} className={`py-3 px-2 text-center text-[8px] italic ${dim30}`}>
                            {s.noBreakdown}
                          </td>
                        ) : showRestRow ? (
                          <td colSpan={HOURS.length} className={`py-3 px-2 text-center text-[8px] ${dark ? "text-white/20" : "text-gray-300"}`}>
                            {s.restDay}
                          </td>
                        ) : (
                          HOURS.map((h) => {
                            const cell = day?.hours?.find((x) => x.hour === h);
                            return (
                              <td key={h} className="py-3 px-1 text-center text-[8px]">
                                {cell ? (
                                  <span className={`uppercase whitespace-nowrap ${getCodeClassName(cell.code, dark)}`}>
                                    {cell.code}
                                  </span>
                                ) : (
                                  <span className={dark ? "text-white/10" : "text-gray-200"}>–</span>
                                )}
                              </td>
                            );
                          })
                        )}
                        <td className={`py-3 pl-4 pr-2 text-right text-[10px] ${dim70}`}>
                          {day?.total !== "" && day?.total != null ? day.total : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Below tablet: a 16-column grid doesn't fit a phone screen, so each day
                  becomes its own card listing only the hours it actually has. */}
              <div className="md:hidden space-y-2">
                {rows.map(({ key, day, hasHours, workedButUndetailed, showRestRow, note }) => (
                  <div
                    key={key}
                    className={`p-3 rounded-sm border ${dark ? "border-white/5" : "border-gray-200/70"} ${
                      showRestRow ? (dark ? "bg-white/[0.02]" : "bg-black/[0.02]") : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] ${dim70}`}>{s.days[key]}</span>
                      {day?.total !== "" && day?.total != null && (
                        <span className={`text-[9px] uppercase tracking-widest ${dim40}`}>
                          {s.sum}: {day.total}
                        </span>
                      )}
                    </div>
                    {note && (
                      <span className={`block text-[8px] uppercase tracking-widest mt-1 ${note.className}`}>
                        {note.label}
                      </span>
                    )}
                    {workedButUndetailed && <p className={`text-[8px] italic mt-2 ${dim30}`}>{s.noBreakdown}</p>}
                    {showRestRow && (
                      <p className={`text-[8px] mt-2 ${dark ? "text-white/20" : "text-gray-300"}`}>{s.restDay}</p>
                    )}
                    {hasHours && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {day.hours.map((cell) => (
                          <span
                            key={cell.hour}
                            className={`text-[9px] px-1.5 py-0.5 rounded-sm border whitespace-nowrap ${
                              dark ? "border-white/10" : "border-gray-200"
                            }`}
                          >
                            <span className={dim40}>{String(cell.hour).padStart(2, "0")}:00</span>{" "}
                            <span className={`uppercase ${getCodeClassName(cell.code, dark)}`}>{cell.code}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          );
        })()}
    </div>
  );
}
