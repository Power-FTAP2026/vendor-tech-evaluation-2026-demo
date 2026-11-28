// Participant helpers: names, AM/PM session, statuses and KPI calculations.
import { SESSION, EVENTS, REG_DAY_COUNTS, EXPECTED } from "./config.js";

/** Today's date "yyyy-mm-dd" in this device's time zone (Philippine time at the venue). */
export const localToday = () => { const n = new Date(); return new Date(n.getTime() - n.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

/** Which day each person registered. The backend may send it (r.day); if not, it comes from the registration
 *  order: the first REG_DAY_COUNTS people belong to the finished days listed in config.js, everyone after = today
 *  (or, between events, the next evaluation day). Rows must be in registration order (as the server sends them). */
export function withDays(rows) {
  if (rows.some(r => r.day)) return rows;
  const today = localToday(), all = EVENTS.flatMap(e => e.days).sort();
  const last = REG_DAY_COUNTS.length ? REG_DAY_COUNTS[REG_DAY_COUNTS.length - 1][0] : "";
  const after = all.includes(today) && today > last ? today : (all.find(d => d > last) || today);
  let i = 0;
  const marks = REG_DAY_COUNTS.flatMap(([d, n]) => Array(n).fill(d));
  return rows.map(r => ({ ...r, day: marks[i++] || after }));
}

/** Expected participants for a day: { company: n } and the day's total (0 when there's no plan for that day). */
export function expectedFor(day) {
  const by = EXPECTED[day] || {};
  return { by, total: Object.values(by).reduce((a, b) => a + b, 0) };
}

/** "Dela Cruz, Juan P." */
export function fullName(p) {
  if (!p.surname) return p.fullName || "";
  const mi = (p.mi || "").replace(/\./g, "").trim();
  return `${p.surname}, ${p.firstName}${mi ? " " + mi.toUpperCase() + "." : ""}`;
}

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/** "AM" or "PM". Add ?session=AM or ?session=PM to any URL to force one (for testing). */
export function currentSession(now = new Date()) {
  const forced = new URLSearchParams(location.search).get("session");
  if (forced) return forced.toUpperCase() === "PM" ? "PM" : "AM";
  const [h, m] = SESSION.pmStartsAt.split(":").map(Number);
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m ? "PM" : "AM";
}

/** Group "P" = Practical in the morning, "T" = Theoretical in the morning (set by registration order on the server). */
export const scheduleText = (group) => group === "T"
  ? "Morning — Theoretical Exam · Afternoon — Practical Evaluation"
  : "Morning — Practical Evaluation · Afternoon — Theoretical Exam";

// Not started yet → show which batch the person is scheduled in for that evaluation.
export function theoStatus(group, session, raw) {
  if (raw === "done") return "Done";
  if (raw === "ongoing") return "Ongoing";
  if (raw === "live") return "Live";
  return group === "T" ? "AM Batch" : "PM Batch";
}

export function pracStatus(group, session, raw) {
  if (raw === "done") return "Done";
  if (raw === "ongoing") return "Ongoing";
  if (raw === "live") return "Live";
  return group === "P" ? "AM Batch" : "PM Batch";
}

/** Builds the participant rows + KPI numbers for the dashboard from the server's "board" data. */
export function buildBoard(board, session) {
  const rows = (board.rows || []).map(p => ({
    ...p,
    company: p.company || "", role: p.role || "", region: p.region || "",
    name: fullName(p),
    theo: theoStatus(p.group, session, p.theo),
    prac: pracStatus(p.group, session, p.prac),
    stationsDone: (p.stations || []).length,
  }));
  const theoGroup = session === "AM" ? "T" : "P";
  const pracGroup = session === "AM" ? "P" : "T";
  // Ongoing = not done yet AND (scheduled this session, OR pending from the morning batch, OR already started early)
  const started = (st) => st === "Ongoing" || st === "Live";
  const theoSched = rows.filter(r => r.group === theoGroup && r.theo !== "Done").length;
  const pracSched = rows.filter(r => r.group === pracGroup && r.prac !== "Done").length;
  const theoExtra = rows.filter(r => r.group !== theoGroup && r.theo !== "Done" && (session === "PM" || started(r.theo))).length;
  const pracExtra = rows.filter(r => r.group !== pracGroup && r.prac !== "Done" && (session === "PM" || started(r.prac))).length;
  const kpi = {
    attendance: rows.length,
    theoDone: rows.filter(r => r.theo === "Done").length,
    theoOngoing: theoSched + theoExtra, theoSched, theoExtra,
    pracDone: rows.filter(r => r.prac === "Done").length,
    pracOngoing: pracSched + pracExtra, pracSched, pracExtra,
    // actual schedule (an admin can move people between AM and PM, so it isn't always a 50/50 split)
    theoAssigned: rows.filter(r => r.group === theoGroup).length,
    pracAssigned: rows.filter(r => r.group === pracGroup).length,
  };
  return { rows, kpi };
}

export const pill = (status, extra = "") =>
  `<span class="pill ${status.toLowerCase().replace(/\s+/g, "-")}">${esc(status)}${extra}</span>`;
