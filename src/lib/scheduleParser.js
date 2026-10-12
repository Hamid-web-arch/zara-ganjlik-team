const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const HOUR_START = 6;
const NOTE_START_COL = 43;

// Column layout of the weekly template (see PROGRESS.md for how this was reverse-engineered).
// Both day-blocks reuse the same columns regardless of which calendar day they represent —
// col1/col22 hold the day-name on header rows and the employee name on data rows.
const BLOCK1 = { col: 1, hoursStart: 4, hoursEnd: 19, total: 20 };
const BLOCK2 = { col: 22, hoursStart: 25, hoursEnd: 40, total: 41 };

function norm(v) {
  return String(v ?? "").trim();
}

function normKey(v) {
  return norm(v).toLowerCase();
}

const AZ_FOLD = { ə: "e", ı: "i" };

function foldWord(word) {
  let s = word.toLowerCase();
  s = s.replace(/[əı]/g, (ch) => AZ_FOLD[ch]);
  s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  s = s.replaceAll("gh", "g").replaceAll("sh", "s").replaceAll("ch", "c");
  s = s.replace(/[^a-z0-9]/g, "");
  // Azerbaijani "c" is pronounced like English "j" (Cavid/Javid, Canmirzoyev/Janmirzoyev) and
  // gets transliterated either way — fold both to the same letter.
  return s.replaceAll("j", "c");
}

// Employee names get typed inconsistently in more ways than one: with proper Azerbaijani
// letters ("Həmid Ağabəyov") or transliterated to plain Latin ("Hemid Aghabeyov"); and — as it
// turns out — "First Last" in the Excel file but "Last First" in Firestore. Fold each word
// individually (ə/ı mapped explicitly since Unicode NFD won't decompose them; ç/ş/ğ/ö/ü stripped
// via NFD; "gh"/"sh"/"ch" digraphs collapsed) and sort the words so word order never matters.
export function normalizeName(v) {
  return norm(v)
    .split(/\s+/)
    .map(foldWord)
    .filter(Boolean)
    .sort()
    .join(" ");
}

// Exact day-name match, used to find header rows and to read a block's own day label.
// Deliberately exact (not startsWith) so an employee whose name happens to start with
// "Sun..."/"Mon..." (e.g. "Sunay") is never mistaken for a "Sunday"/"Monday" header cell.
const DAY_WORD_EXACT = {
  monday: "monday",
  tuesday: "tuesday",
  wednesday: "wednesday",
  wns: "wednesday", // observed typo for the Wednesday header
  thursday: "thursday",
  friday: "friday",
  saturday: "saturday",
  sunday: "sunday",
};

function dayKeyExact(text) {
  return DAY_WORD_EXACT[normKey(text)] || null;
}

// On every header row in this template, the block1/block2 cells always name the same fixed pair
// of days (Monday+Tuesday, Wednesday+Thursday, or Friday+Saturday — Sunday has no pair, it's
// deliberately excluded here). Real files have been seen with one of the two cells left blank by
// mistake (e.g. a "Thursday" label missing next to a "Wednesday" one) — when that happens, recover
// the missing day from its known pair instead of silently dropping that half of the row.
const DAY_PAIR = {
  monday: "tuesday",
  tuesday: "monday",
  wednesday: "thursday",
  thursday: "wednesday",
  friday: "saturday",
  saturday: "friday",
};

// Loose prefix match — only used to locate a weekly-totals summary table, whose own header row
// legitimately contains short tokens like "Mon"/"Tue"/"Wns"/"Thr"/"TOT" rather than full names.
function dayKeyAbbrev(text) {
  const k = normKey(text);
  if (!k) return null;
  if (k.startsWith("mon")) return "monday";
  if (k.startsWith("tue")) return "tuesday";
  if (k.startsWith("wed") || k === "wns") return "wednesday";
  if (k.startsWith("thu") || k.startsWith("thr")) return "thursday";
  if (k.startsWith("fri")) return "friday";
  if (k.startsWith("sat")) return "saturday";
  if (k.startsWith("sun")) return "sunday";
  return null;
}

function extractHours(row, start, end) {
  const hours = [];
  for (let c = start; c <= end; c++) {
    const val = row[c];
    if (val !== "" && val != null) {
      hours.push({ hour: HOUR_START + (c - start), code: norm(val) });
    }
  }
  return hours;
}

function extractNote(row) {
  for (let c = NOTE_START_COL; c < row.length; c++) {
    const val = row[c];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return null;
}

function findHeaderRows(rows) {
  const headers = [];
  rows.forEach((row, i) => {
    if (dayKeyExact(row[BLOCK1.col]) || dayKeyExact(row[BLOCK2.col])) headers.push(i);
  });
  return headers;
}

// A weekly-totals summary table (Mon/Tue/.../Sun columns + a grand total) shows up at a
// row/column offset that varies between the departments in this file — search a small window
// below the header for whichever row actually lists several day abbreviations, instead of
// assuming a fixed position.
function findSummaryHeader(rows, fromRow, toRow) {
  for (let i = fromRow; i <= toRow; i++) {
    const row = rows[i] || [];
    const dayCols = {};
    row.forEach((cell, c) => {
      const key = dayKeyAbbrev(cell);
      if (key) dayCols[key] = c;
      else if (normKey(cell).startsWith("tot")) dayCols.weeklyTotal = c;
    });
    if (Object.keys(dayCols).length >= 3) return { rowIndex: i, dayCols };
  }
  return null;
}

function matchesEmployee(row, normalizedTarget) {
  return normalizeName(row[BLOCK1.col]) === normalizedTarget || normalizeName(row[BLOCK2.col]) === normalizedTarget;
}

// True when a day entry has real content worth protecting from a silent overwrite (an empty
// placeholder — the default-fill at the end of this function — is always safe to replace).
function hasRealContent(day) {
  if (!day) return false;
  if ((day.hours?.length || 0) > 0) return true;
  return day.total !== "" && day.total != null;
}

/** Search one sheet (as array-of-arrays rows) for `employeeName`'s weekly schedule. */
export function parseScheduleSheet(rows, employeeName) {
  const normalizedTarget = normalizeName(employeeName);
  if (!normalizedTarget) return null;

  const headerRows = findHeaderRows(rows);
  const days = {};
  let found = false;
  let weeklyTotal = null;
  // Each employee should appear in exactly one department's block per calendar day. If the same
  // name turns up under a second block for a day that already has real data (a data-entry mistake
  // in the source file, e.g. one person mistakenly listed in two departments), that second match
  // would otherwise silently overwrite the first with no trace — flag it instead.
  const conflicts = [];

  headerRows.forEach((headerIndex, i) => {
    const rangeEnd = (i + 1 < headerRows.length ? headerRows[i + 1] : rows.length) - 1;
    const headerRow = rows[headerIndex] || [];
    // Each block's day is read straight off its own header cell — not inferred from position or
    // from a calendar date, both of which turned out to drift between departments in real files.
    // If one cell is blank, fall back to its known pair (see DAY_PAIR) rather than losing that
    // half of the row.
    let day1Key = dayKeyExact(headerRow[BLOCK1.col]);
    let day2Key = dayKeyExact(headerRow[BLOCK2.col]);
    if (day1Key && !day2Key) day2Key = DAY_PAIR[day1Key] || null;
    if (day2Key && !day1Key) day1Key = DAY_PAIR[day2Key] || null;

    // Hour-by-hour detail, tried unconditionally: harmless (comes back empty) for a department
    // that never schedules that day, and correctly picks up real hours for one that does — some
    // departments in this file genuinely do have hour-level Sunday shifts, others don't.
    for (let r = headerIndex + 1; r <= rangeEnd; r++) {
      const row = rows[r] || [];
      if (!matchesEmployee(row, normalizedTarget)) continue;

      const note = extractNote(row);
      if (day1Key) {
        const entry = { hours: extractHours(row, BLOCK1.hoursStart, BLOCK1.hoursEnd), total: row[BLOCK1.total] ?? "", note };
        if (hasRealContent(days[day1Key]) && hasRealContent(entry)) conflicts.push({ day: day1Key, row: r });
        days[day1Key] = entry;
        found = true;
      }
      if (day2Key) {
        const entry = { hours: extractHours(row, BLOCK2.hoursStart, BLOCK2.hoursEnd), total: row[BLOCK2.total] ?? "", note };
        if (hasRealContent(days[day2Key]) && hasRealContent(entry)) conflicts.push({ day: day2Key, row: r });
        days[day2Key] = entry;
        found = true;
      }
      break;
    }

    // Weekly-totals summary, used only to fill in a day with no hour-by-hour detail above.
    const summaryHeader = findSummaryHeader(rows, headerIndex, Math.min(headerIndex + 2, rangeEnd));
    if (summaryHeader) {
      for (let r = summaryHeader.rowIndex + 1; r <= rangeEnd; r++) {
        const row = rows[r] || [];
        if (!matchesEmployee(row, normalizedTarget)) continue;

        found = true;
        if (summaryHeader.dayCols.weeklyTotal !== undefined) {
          weeklyTotal = row[summaryHeader.dayCols.weeklyTotal] ?? weeklyTotal;
        }
        DAY_KEYS.forEach((key) => {
          const col = summaryHeader.dayCols[key];
          if (col === undefined) return;
          if (!days[key]) {
            days[key] = { hours: [], total: row[col] ?? "", note: null };
          } else if (days[key].total === "" || days[key].total == null) {
            days[key].total = row[col] ?? "";
          }
        });
        break;
      }
    }
  });

  if (!found) return null;

  DAY_KEYS.forEach((key) => {
    if (!days[key]) days[key] = { hours: [], total: "", note: null };
  });

  return { days, weeklyTotal, conflicts };
}

/**
 * employeeNames: [{ key: "normalized lowercase name", displayName: "Original Name" }]
 * Returns { byEmployee, conflicts } — byEmployee maps normalizedName -> { days, weeklyTotal },
 * conflicts lists employees whose source rows looked like they appear in two department blocks
 * for the same day (see hasRealContent above) so the admin can double-check that specific name.
 */
export function parseScheduleWorkbook(XLSXLib, workbook, employeeNames) {
  const byEmployee = {};
  const conflicts = [];

  for (const sheetName of workbook.SheetNames) {
    const rows = XLSXLib.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });

    for (const emp of employeeNames) {
      if (byEmployee[emp.key]) continue;
      const result = parseScheduleSheet(rows, emp.displayName);
      if (result) {
        const { conflicts: rowConflicts, ...rest } = result;
        byEmployee[emp.key] = rest;
        if (rowConflicts.length > 0) conflicts.push({ name: emp.displayName, sheet: sheetName, days: rowConflicts.map((c) => c.day) });
      }
    }
  }

  return { byEmployee, conflicts };
}
