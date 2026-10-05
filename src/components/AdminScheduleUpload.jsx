import { notify } from "../lib/notify";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
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
    (async () => {
      try {
        const snap = await getDoc(doc(db, "work_schedule", "current"));
        if (snap.exists()) {
          const data = snap.data();
          setCurrentInfo({ weekLabel: data.weekLabel || "", count: Object.keys(data.byEmployee || {}).length });
        }
      } catch (error) {
        console.error("Qrafik məlumatı yüklənərkən xəta:", error);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      notify(s.noFile);
      return;
    }

    setUploading(true);
    try {
      const [XLSX, staffSnap, crewSnap] = await Promise.all([
        import("xlsx"),
        getDocs(collection(db, "staff")),
        getDocs(collection(db, "crew")),
      ]);

      const employeeNames = [];
      const seen = new Set();
      [...staffSnap.docs, ...crewSnap.docs].forEach((docSnap) => {
        const name = (docSnap.data().name || "").trim();
        const key = normalizeName(name);
        if (name && !seen.has(key)) {
          seen.add(key);
          employeeNames.push({ key, displayName: name });
        }
      });

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const byEmployee = parseScheduleWorkbook(XLSX, workbook, employeeNames);
      const matchedCount = Object.keys(byEmployee).length;

      const undetailedCount = Object.values(byEmployee).filter((entry) =>
        Object.values(entry.days).some((day) => (day.hours?.length || 0) === 0 && Number(day.total) > 0)
      ).length;

      await setDoc(doc(db, "work_schedule", "current"), {
        weekLabel: weekLabel.trim(),
        uploadedAt: serverTimestamp(),
        byEmployee,
      });

      setCurrentInfo({ weekLabel: weekLabel.trim(), count: matchedCount });
      setFile(null);

      let message = s.success.replace("{m}", matchedCount).replace("{t}", employeeNames.length);
      if (undetailedCount > 0) {
        message += `\n\n${s.warnUndetailed.replace("{n}", undetailedCount)}`;
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
    <div className="my-8">
      <div className="glass p-8 rounded-sm">
        <div className="border-b border-white/10 pb-4 mb-6">
          <h2 className="font-sync text-xs tracking-widest uppercase">{s.title}</h2>
          <p className="text-[9px] uppercase tracking-widest text-white/30 mt-1">{s.desc}</p>
          {currentInfo && (
            <p className="text-[9px] text-white/40 mt-2">
              {s.current} <span className="text-white">{currentInfo.weekLabel || s.untitledWeek}</span> —{" "}
              {s.foundFor.replace("{n}", currentInfo.count)}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-[9px] uppercase tracking-widest text-white/30 block">{s.weekLabel}</label>
            <input
              type="text"
              value={weekLabel}
              onChange={(e) => setWeekLabel(e.target.value)}
              placeholder="13.07 - 19.07.2026"
              className="w-full bg-transparent border-b border-white/10 py-3 text-[10px] tracking-widest outline-none focus:border-white transition-all text-white"
            />
          </div>
          <div className="flex-1 space-y-2 w-full">
            <label className="text-[9px] uppercase tracking-widest text-white/30 block">{s.excelFile}</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files[0] || null)}
              className="w-full bg-white/5 border border-white/5 py-3 px-4 text-[9px] outline-none cursor-pointer"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="bg-white text-black px-8 py-3 text-[9px] font-bold uppercase tracking-widest hover:bg-gray-50 transition disabled:opacity-40 whitespace-nowrap"
          >
            {uploading ? s.uploading : s.upload}
          </button>
        </form>
      </div>
    </div>
  );
}
