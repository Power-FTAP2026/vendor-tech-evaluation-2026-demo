// =====================================================================
//  EVENT SETTINGS — edit this file to customise the app.
// =====================================================================
export const EVENT = {
  title: "2026 Vendor's Technicians Evaluation",
  org: "Frontier Tower Associates Philippines",
};

// ---------------------------------------------------------------------
//  GOOGLE CONNECTION
//  SCRIPT_URL = the "Web app URL" you get after Deploy → New deployment in Apps Script.
//  While it says PASTE…, the app runs in DEMO MODE (data saved only in this browser).
// ---------------------------------------------------------------------
// true only on the separate DEMO website (set automatically by tools/build-demo.mjs) — never connects to Google.
export const DEMO_SITE = true;
export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxbtzd_Qe_gqeqm9pgeHSp0Pa01GJlC6IPu7iJBSvuGFeosSPkR_F5oJCg3herhY-zp/exec";
// Separate FEEDBACK backend ("[FEEDBACK] Vendors Technician Evaluation 2026" Sheet + its own Apps Script).
// Empty = the Feedback page runs in practice mode (nothing saved).
export const FEEDBACK_URL = ""; // demo website: feedback is never saved
export const LINKS = {
  sheet: "https://docs.google.com/spreadsheets/d/1EZZeUC1hAoFhFl8BjAgx6lt3n1vE-Ujz34KnoPbahp4/edit",
  drive: "https://drive.google.com/drive/folders/1Nh2C8AY5nLaSFCTqsJig-uTuRNn5_7cL",
  script: "https://script.google.com/home/projects/1reSeE1NPKwCw1LsCcaAKqx6CHFVYUrQf7z29AYBl8f7R3ZGtLERkxETq/edit",
};

// Registration dropdowns
export const COMPANIES = ["QNSI / QROI", "Edgecomm", "FMIDC", "IENG", "ARDOM"];
export const EMPLOYMENT = ["Direct", "Subcon"];
export const ROLES = ["Field Technician", "Lead Technician"];
export const REGIONS = ["Luzon", "Visayas", "Mindanao"];
// Area → its Region (choosing an Area fills in the Region automatically)
export const AREAS = {
  "South Luzon": "Luzon",
  "North Luzon": "Luzon",
  "NCR": "Luzon",
  "Visayas": "Visayas",
  "Mindanao": "Mindanao",
};

// Shown before the Theoretical Exam; examinees must tick "I agree" to start.
export const PRIVACY_DISCLAIMER = {
  title: "Privacy Disclaimer",
  text: "Frontier Tower Associates Philippines Inc. values the privacy and confidentiality of its employees. " +
    "All information disclosed by an employee during any survey/registration with the company, including information " +
    "submitted through the registration/survey form, shall be treated as strictly confidential and shall be limited " +
    "solely to the Vendor and O&M and Power. Frontier does not access, store, or process any information disclosed " +
    "during the registration. Accordingly, Frontier shall not be liable for any disclosure, use, or handling of " +
    "information made by or between the Vendor and the O&M and Power Department. By registering for and participating " +
    "in evaluation, the Vendor acknowledges and agrees to the foregoing.",
};

// Morning / afternoon sessions.
// Participants are split by registration order: 1st → Practical first, 2nd → Theoretical first, 3rd → Practical first…
// so with an odd attendance the extra person always goes to Practical. In the afternoon the groups swap.
export const SESSION = {
  pmStartsAt: "12:00", // 24-hour clock on each device. Before this = Morning, from this time = Afternoon.
};

// Theoretical exam. The questions, the 4 sets and the correct answers live in the Google Sheet
// ("Questions" and "Exam Sets" tabs) — never in this website.
export const EXAM = {
  timeLimitMinutes: 60,       // 0 = no time limit. When time is up the timer counts overtime (no auto-submit); late submissions are still received.
  shuffleQuestionOrder: true, // shuffle the order of the 50 set questions on each device
};

// Practical evaluation time per technician per station (countdown on the evaluator's screen).
export const PRACTICAL = {
  minutesPerStation: 10,
  warnAtMinutes: 2, // timer turns orange when this much time is left
};

// ---------------------------------------------------------------------
//  EVENTS & PRACTICAL EVALUATORS
//  Evaluators pick the event (pre-selected from today's date) and their name; after the PIN they go
//  straight to their station. "station" must match a Station name in the Sheet's "Practical Setup" tab.
//  The PIN is checked by the server (Apps Script → Project Settings → Script properties → EVALUATOR_PIN).
// ---------------------------------------------------------------------
export const EVENTS = [
  {
    id: "mindanao", name: "Mindanao · Davao WH", region: "Mindanao",
    setup: "2026-11-26", days: ["2026-11-27", "2026-11-28"],
    proctor: "Trishia Anne Molo", seminar: ["Allen Val Lastimosa"],
    evaluators: [
      { name: "April Dream Torino", station: "AC" },
      { name: "Faye Mariano", station: "ACU" },
      { name: "Wyler Bongac", station: "DG" },
      { name: "Ahmad Musa", station: "RS + Battery System" },
    ],
  },
  {
    id: "visayas", name: "Visayas · Cebu WH", region: "Visayas",
    setup: "2026-11-30", days: ["2026-11-30", "2026-12-01"],
    proctor: "Trishia Anne Molo", seminar: ["Allen Val Lastimosa"],
    evaluators: [
      { name: "April Dream Torino", station: "AC" },
      { name: "Faye Mariano", station: "ACU" },
      { name: "Jerwin Moldez", station: "DG" },
      { name: "Michael Andrew Barcelon", station: "RS + Battery System" },
      { name: "Ahmad Musa", station: "RS + Battery System" },
    ],
  },
  {
    id: "luzon", name: "Luzon · Bulacan WH", region: "Luzon",
    setup: "2026-12-01", days: ["2026-12-02", "2026-12-03"],
    proctor: "Clarence Del Carmen", seminar: ["Frederick Bunque", "Gene Andrei Napolis"],
    evaluators: [
      { name: "Louie Ghil Rebodos", station: "AC" },
      { name: "Jason Juguilon", station: "ACU" },
      { name: "Jeffrey Cauilan", station: "DG" },
      { name: "Aldrin Aquino", station: "RS + Battery System" },
      { name: "Daniel James Clarin", station: "RS + Battery System" },
      { name: "Jose Brigino", station: "RS + Battery System" },
    ],
  },
];

/** The event happening today (or the next one coming up; the last one once all are over). */
export function todaysEvent(now = new Date()) {
  // local date as YYYY-MM-DD (not UTC, so 8 AM in Manila is still "today")
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return EVENTS.find(e => e.days.includes(today)) || EVENTS.find(e => e.days[0] >= today) || EVENTS[EVENTS.length - 1];
}
