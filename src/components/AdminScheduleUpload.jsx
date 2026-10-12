import { notify } from "../lib/notify";
import { useEffect, useState } from "react";
import { getSchedule, putSchedule, listMembers } from "../lib/api";
import { normalizeName, parseScheduleWorkbook } from "../lib/scheduleParser";
import { useLanguage } from "../lib/i18n/languageContext";

export default function AdminScheduleUpload() {
  const { t } = useLanguage();
  const s = t.adminPanel.schedule;
  const [file, setFile] = useState(null);
  const [weekLabel, setWeekLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentInfo, setCurrentInfo] = useState(null);

  useEffect(() => {
    getSchedule()
      .then((data) => {
        if (data) setCurrentInfo({ weekLabel: data.weekLabel || "", count: Object.keys(data.byEmployee || {}).length });
      })
      .catch((error) => console.error("Qrafik məlumatı yüklənərkən xəta:", error));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      notify(s.noFile);
      return;
    }

    setUploading(true);
    try {
      const [XLSX, staffMembers, crewMembers] = await Promise.all([
        import("xlsx"),
        listMembers("staff"),
        listMembers("crew"),
      ]);

      const employeeNames = [];
      const seen = new Set();
      [...staffMembers, ...crewMembers].forEach((member) => {
        const name = (member.name || "").trim();
        const key = normalizeName(name);
        if (name && !seen.has(key)) {
          seen.add(key);
          employeeNames.push({ key, displayName: name });
        }
      });

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const { byEmployee, conflicts } = parseScheduleWorkbook(XLSX, workbook, employeeNames);
      const matchedCount = Object.keys(byEmployee).length;

      const undetailedCount = Object.values(byEmployee).filter((entry) =>
        Object.values(entry.days).some((day) => (day.hours?.length || 0) === 0 && Number(day.total) > 0)
      ).length;

      await putSchedule(weekLabel.trim(), byEmployee);

      setCurrentInfo({ weekLabel: weekLabel.trim(), count: matchedCount });
      setFile(null);

      let message = s.success.replace("{m}", matchedCount).replace("{t}", employeeNames.length);
      if (undetailedCount > 0) {
        message += `\n\n${s.warnUndetailed.replace("{n}", undetailedCount)}`;
      }
      if (conflicts.length > 0) {
        const names = conflicts.map((c) => c.name).join(", ");
        message += `\n\n${s.warnConflicts.replace("{n}", conflicts.length).replace("{names}", names)}`;
      }
      notify(message);
    } catch (error) {
      console.error("Qrafik yüklənərkən xəta:", error);
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
        {currentInfo && (
          <p className="text-[9px] text-zinc-500 mt-2">
            {s.current} <span className="text-zinc-900">{currentInfo.weekLabel || s.untitledWeek}</span> —{" "}
            {s.foundFor.replace("{n}", currentInfo.count)}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-[9px] uppercase tracking-widest text-zinc-400 block">{s.weekLabel}</label>
          <input
            type="text"
            value={weekLabel}
            onChange={(e) => setWeekLabel(e.target.value)}
            placeholder="13.07 - 19.07.2026"
            className="w-full bg-transparent border-b border-zinc-200 py-3 text-[10px] tracking-widest outline-none focus:border-zinc-900 transition-all text-zinc-900"
          />
        </div>
        <div className="flex-1 space-y-2 w-full">
          <label className="text-[9px] uppercase tracking-widest text-zinc-400 block">{s.excelFile}</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0] || null)}
            className="w-full bg-zinc-50 border border-zinc-200 py-3 px-4 text-[9px] outline-none cursor-pointer text-zinc-700"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="bg-zinc-900 text-white px-8 py-3 text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-700 transition disabled:opacity-40 whitespace-nowrap"
        >
          {uploading ? s.uploading : s.upload}
        </button>
      </form>
    </div>
  );
}
