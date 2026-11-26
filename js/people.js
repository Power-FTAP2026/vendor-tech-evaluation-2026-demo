// Participant helpers: names, AM/PM session, statuses and KPI calculations.
import { SESSION } from "./config.js";

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
  const kpi = {
    attendance: rows.length,
    theoDone: rows.filter(r => r.theo === "Done").length,
    theoOngoing: rows.filter(r => r.group === theoGroup && r.theo !== "Done").length,
    pracDone: rows.filter(r => r.prac === "Done").length,
    pracOngoing: rows.filter(r => r.group === pracGroup && r.prac !== "Done").length,
    // actual schedule (an admin can move people between AM and PM, so it isn't always a 50/50 split)
    theoAssigned: rows.filter(r => r.group === theoGroup).length,
    pracAssigned: rows.filter(r => r.group === pracGroup).length,
  };
  return { rows, kpi };
}

export const pill = (status, extra = "") =>
  `<span class="pill ${status.toLowerCase().replace(/\s+/g, "-")}">${esc(status)}${extra}</span>`;
