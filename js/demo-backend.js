// DEMO backend — imitates apps-script/Code.gs inside this browser (localStorage) so the app can be
// tried locally before it is connected to the Google Sheet. Not used once SCRIPT_URL is set.
import { ApiError } from "./api.js";
import { currentSession } from "./people.js";
import { DEMO_SITE, SCRIPT_URL } from "./config.js";

// DEMO WEBSITE "review mode": evaluators log in to Practical with the DEMO PIN (script property DEMO_PIN) and see the
// REAL scenarios of their own station, fetched read-only from the Google backend (which only gives them out with that PIN;
// the demo PIN can never save scores). Nothing is
// ever written to Google from the demo: registrations, exams and practice scores stay in this browser.
const LIVE_REVIEW = DEMO_SITE && /^https:\/\/script\.google\.com\//.test(SCRIPT_URL);
async function live(action, data) { // read-only calls only: checkPin, practicalConfig
  let last;
  for (let a = 0; a < 4; a++) {
    if (a) await new Promise(r => setTimeout(r, 800 * a));
    try {
      const r = await fetch(SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, ...data }) });
      const j = JSON.parse(await r.text());
      if (j.ok) return j;
      if (!(j.retry || j.error === "busy" || j.error === "server_error")) fail(j.error, j.message);
      last = new ApiError(j.error, j.message);
    } catch (e) { if (e instanceof ApiError && e.code !== "busy") throw e; last = e; }
  }
  throw last instanceof ApiError ? last : new ApiError("network", "No internet connection.");
}
const LIVE_STATIONS_KEY = "demoLiveStations"; // this session only (sessionStorage)
// Same rule as the server: Practical-first people ("P") may not take the exam in the morning.
const assertExamAllowed = (p) => { if (DEMO_SITE) fail("demo_exam_off", "Starting the exam is turned off on the demo website."); if (p.group === "P" && currentSession() === "AM") fail("wrong_session", "You are scheduled for the Practical Evaluation this morning. Your Theoretical Exam is in the afternoon session."); };

const DEMO_PIN = "2468";
const PREFIX = "VTE26";
const SET_NAMES = ["A", "B", "C", "D"];
// Demo/practice stations: same stations, parts and scoring rules as the real setup, but SAMPLE scenario names —
// the real scenario list lives only in the private Google Sheet (Practical Setup tab). [Station, Part, Scenario, Max, Scoring]
const DEMO_PRACTICAL = [
  ["AC", "", "Sample scenario 1", 5, "5 and 0 only"],
  ["AC", "", "Sample scenario 2", 5, "0 to 5"],
  ["AC", "", "Sample scenario 3", 5, "0 to 5"],
  ["AC", "", "Sample scenario 4", 5, "5 and 0 only"],
  ["ACU", "", "Sample scenario 1", 5, "0 to 5"],
  ["ACU", "", "Sample scenario 2", 5, "0 to 5"],
  ["ACU", "", "Sample scenario 3", 5, "0 to 5"],
  ["DG", "", "Sample scenario 1", 5, "0 to 5"],
  ["DG", "", "Sample scenario 2", 5, "0 to 5"],
  ["DG", "", "Sample scenario 3", 5, "0 to 5"],
  ["DG", "", "Sample scenario 4", 5, "0 to 5"],
  ["DG", "", "Sample scenario 5", 5, "5 and 0 only"],
  ["DG", "", "Sample scenario 6", 5, "0 to 5"],
  ["DG", "", "Sample scenario 7", 5, "0 to 5"],
  ["RS + Battery System", "4.1. Rectifier System", "Sample scenario 1", 5, "5 and 0 only"],
  ["RS + Battery System", "4.1. Rectifier System", "Sample scenario 2", 5, "5 and 0 only"],
  ["RS + Battery System", "4.1. Rectifier System", "Sample scenario 3", 5, "5 and 0 only"],
  ["RS + Battery System", "4.1. Rectifier System", "Sample scenario 4", 5, "0 to 5"],
  ["RS + Battery System", "4.1. Rectifier System", "Sample scenario 5", 5, "0 to 5"],
  ["RS + Battery System", "4.1. Rectifier System", "Sample scenario 6", 5, "5 and 0 only"],
  ["RS + Battery System", "4.2. Battery", "Sample scenario 7", 5, "5 and 0 only"],
  ["RS + Battery System", "4.2. Battery", "Sample scenario 8", 5, "5 and 0 only"],
  ["RS + Battery System", "4.2. Battery", "Sample scenario 9", 5, "0 to 5"],
  ["RS + Battery System", "4.2. Battery", "Sample scenario 10", 5, "0 to 5"],
];

const load = (k, d) => { try { return JSON.parse(localStorage.getItem("demo2:" + k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem("demo2:" + k, JSON.stringify(v));
const fail = (code, msg) => { throw new ApiError(code, msg); };
const wait = () => new Promise(r => setTimeout(r, 300));
const slug = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
const key = (p) => slug(`${p.surname} ${p.firstName} ${p.mi || ""}`);
const fullName = (p) => { const mi = String(p.mi || "").replace(/\./g, "").trim(); return `${p.surname}, ${p.firstName}${mi ? " " + mi.toUpperCase() + "." : ""}`; };
const title = (s) => String(s).trim().replace(/\s+/g, " ").toUpperCase(); // free text is saved in UPPER CASE
// group: alternating by registration order, unless an admin changed it (same rule as the server's "Session Override")
const regs = () => { const ov = load("session", {}); return load("reg", []).map((p, i) => { const id = key(p);
  return { ...p, id, group: ov[id] || (i % 2 === 0 ? "P" : "T"), sessionSet: !!ov[id] }; }); };
const pub = (p) => ({ id: p.id, fullName: fullName(p), surname: p.surname, firstName: p.firstName, mi: p.mi,
  company: p.company, employment: p.employment, role: p.role, region: p.region, area: p.area || "", group: p.group, sessionSet: !!p.sessionSet });
const person = (id) => regs().find(p => p.id === id) || fail("not_registered", "This person is not registered.");
const stations = () => {
  if (LIVE_REVIEW) { try { const st = JSON.parse(sessionStorage.getItem(LIVE_STATIONS_KEY) || "null"); if (st) return st; } catch { /* ignore */ } }
  const out = [];
  DEMO_PRACTICAL.forEach(([st, part, sc, max, scoring]) => {
    let s = out.find(x => x.name === st); if (!s) out.push(s = { name: st, scenarios: [] });
    s.scenarios.push({ name: sc, max, scoring, passFail: /only/i.test(scoring), part });
  });
  return out;
};
const checkPin = (pin) => { if (String(pin) !== DEMO_PIN) fail("bad_pin", "Incorrect evaluator PIN."); };

async function bank() {
  try { return await import("./demo-questions.js"); }
  catch {
    // no local question file → placeholders
    const ph = (label, n, start) => Array.from({ length: n }, (_, i) => start + i);
    const questions = {};
    const cats = ["Generator", "Rectifier", "Battery", "AC Power (ACPDB and SPD)", "Earthing and Lightning Protection", "Safety and Workmanship", "Site Facilities"];
    for (let no = 1; no <= 210; no++) {
      const legal = no > 200;
      questions[no] = { no, category: legal ? "Legal – Compliance Exam" : cats[no % cats.length],
        q: `Sample question ${no} (demo). The real exam questions are only released on the evaluation day.`,
        choices: ["Sample answer A", "Sample answer B", "Sample answer C", "Sample answer D"] };
    }
    var DEMO_ANSWERS = Object.fromEntries(Object.keys(questions).map(n => [n, "A"])); // sample key: "A" is always right
    return { DEMO_SETS: { A: ph("A", 50, 1), B: ph("B", 50, 51), C: ph("C", 50, 101), D: ph("D", 50, 151), STATIC: ph("S", 10, 201) }, DEMO_QUESTIONS: questions, DEMO_ANSWERS };
  }
}

const RANK = { "": 0, live: 1, ongoing: 2, done: 3 };

const actions = {
  ping: () => ({ app: "DEMO" }),

  register(d) {
    const p = {
      company: d.company, employment: d.employment, surname: title(d.surname), firstName: title(d.firstName),
      mi: String(d.mi || "").replace(/\./g, "").trim().toUpperCase(), role: d.role, region: d.region, area: d.area,
    };
    for (const [k, v] of Object.entries(p)) if (k !== "mi" && !v) fail("missing_field", `${k} is required.`);
    if (!/^data:image\//.test(d.photo || "")) fail("photo_required", "Please add your ID picture.");
    const list = load("reg", []);
    const dup = regs().find(r => r.id === key(p));
    if (dup) return { already: true, id: dup.id, fullName: fullName(dup), group: dup.group };
    const n = list.reduce((m, r) => Math.max(m, Number(r.uid.split("-").pop()) || 0), 0) + 1;
    p.uid = `${PREFIX}-${String(n).padStart(4, "0")}`;
    p.registeredAt = new Date().toISOString();
    list.push(p); save("reg", list);
    try { localStorage.setItem("demo2:photo:" + p.uid, d.photo); } catch { /* browser storage full — skip photo in demo */ }
    return { id: key(p), fullName: fullName(p), group: (list.length - 1) % 2 === 0 ? "P" : "T" };
  },

  findPerson(d) {
    const s = slug(d.surname), f = slug(d.firstName), m = slug(d.mi);
    if (!s || !f) fail("name_required", "Please enter your surname and first name.");
    const same = regs().filter(p => slug(p.surname) === s && slug(p.firstName) === f);
    let p = same.find(x => slug(x.mi) === m);
    if (!p && same.length === 1 && (!m || !same[0].mi)) p = same[0];
    if (!p) fail(same.length > 1 ? "need_mi" : "not_found", same.length > 1
      ? "More than one person is registered with that name. Please enter your middle initial exactly as you registered."
      : "We couldn't find your registration. Please check the spelling (exactly as you registered) or register first.");
    if (d.company && p.company !== d.company) fail("wrong_company", `This name is registered under ${p.company}. Please select the correct company or see the proctor.`);
    return { person: pub(p) };
  },

  board() {
    const theo = load("theo", {}), prac = load("prac", {}), st = stations();
    return {
      stationsTotal: st.length, stationNames: st.map(s => s.name),
      rows: regs().map(p => ({ ...pub(p), theo: theo[p.uid]?.status || "", prac: prac[p.uid]?.status || "", stations: prac[p.uid]?.stations || [] })),
      updatedAt: new Date().toISOString(),
    };
  },

  examStart(d) {
    const p = person(d.id), theo = load("theo", {});
    assertExamAllowed(p);
    const t = theo[p.uid] ||= { status: "" };
    if (!t.status) { t.status = "live"; save("theo", theo); }
    return { status: t.status };
  },

  examProgress(d) {
    const p = person(d.id), theo = load("theo", {});
    const t = theo[p.uid] ||= { status: "" };
    if (RANK[d.status] > RANK[t.status]) { t.status = d.status; if (d.set) t.set = d.set; save("theo", theo); }
    return { status: t.status };
  },

  async examQuestions(d) {
    assertExamAllowed(person(d.id));
    const { DEMO_SETS, DEMO_QUESTIONS } = await bank();
    const set = SET_NAMES.includes(d.set) ? d.set : SET_NAMES[Math.floor(Math.random() * 4)];
    const pick = (nos) => nos.map(n => DEMO_QUESTIONS[n]).filter(Boolean);
    return { set, part1: pick(DEMO_SETS[set]), part2: pick(DEMO_SETS.STATIC) };
  },

  async examSubmit(d) {
    const p = person(d.id), theo = load("theo", {});
    const t = theo[p.uid] ||= { status: "" };
    if (t.status === "done") fail("already_done", "An exam has already been submitted for this person.");
    // Grade like the server: only the set's 50 + the 10 static questions count.
    const { DEMO_SETS, DEMO_ANSWERS } = await bank();
    const nos = [...(DEMO_SETS[d.set] || []), ...(DEMO_SETS.STATIC || [])];
    const score = DEMO_ANSWERS ? nos.filter(n => String(d.answers?.[n] || "") === DEMO_ANSWERS[n]).length : undefined;
    Object.assign(t, { status: "done", set: d.set, answers: d.answers, score, submittedAt: new Date().toISOString() });
    save("theo", theo);
    return { submitted: true, score, total: nos.length };
  },

  async setSession(d) { // Admin: P = AM Practical, T = AM Theoretical, auto = registration order
    if (LIVE_REVIEW) await live("checkPin", { pin: d.pin, review: true }); else checkPin(d.pin);
    if (!["P", "T", "auto"].includes(d.session)) fail("bad_session", "Choose AM Practical or AM Theoretical.");
    const p = person(d.id), ov = load("session", {});
    if (d.session === "auto") delete ov[p.id]; else ov[p.id] = d.session;
    save("session", ov);
    return { person: pub(person(d.id)) };
  },
  async checkPin(d) { if (LIVE_REVIEW) { await live("checkPin", { pin: d.pin, review: true }); return {}; } checkPin(d.pin); return {}; },
  async practicalConfig(d) {
    if (LIVE_REVIEW) { // real scenarios, only with the DEMO PIN (checked by the Google backend)
      const j = await live("practicalConfig", { pin: d.pin, review: true });
      try { sessionStorage.setItem(LIVE_STATIONS_KEY, JSON.stringify(j.stations)); } catch { /* ignore */ }
      return { stations: j.stations };
    }
    checkPin(d.pin); return { stations: stations() };
  },

  practicalLive(d) {
    if (!LIVE_REVIEW) checkPin(d.pin);
    const p = person(d.id), prac = load("prac", {});
    const r = prac[p.uid] ||= { status: "", stations: [], scores: {} };
    if (!r.status) { r.status = "live"; save("prac", prac); }
    return {};
  },

  practicalSave(d) {
    if (!LIVE_REVIEW) checkPin(d.pin);
    const p = person(d.id), st = stations(), station = st.find(s => s.name === d.station) || fail("bad_station", "Unknown station.");
    const prac = load("prac", {});
    const r = prac[p.uid] ||= { status: "", stations: [], scores: {} };
    if (r.stations.includes(station.name)) fail("already_scored", `${fullName(p)} already has submitted scores for ${station.name}. Submitted scores can't be changed.`);
    station.scenarios.forEach(sc => {
      const v = Number(d.scores?.[sc.name]);
      if (d.scores?.[sc.name] === "" || isNaN(v) || v < 0 || v > sc.max) fail("bad_score", `Score for "${sc.name}" must be 0–${sc.max}.`);
      if (sc.passFail && v !== 0 && v !== sc.max) fail("bad_score", `Score for "${sc.name}" must be ${sc.max} or 0 only.`);
      r.scores[sc.name] = v;
    });
    if (!r.stations.includes(station.name)) r.stations.push(station.name);
    r.status = st.every(s => r.stations.includes(s.name)) ? "done" : "ongoing";
    save("prac", prac);
    const stTotal = station.scenarios.reduce((t, sc) => t + r.scores[sc.name], 0);
    return { stationTotal: stTotal, stationMax: station.scenarios.reduce((t, sc) => t + sc.max, 0), status: r.status };
  },
};

export async function demoApi(action, data) {
  await wait();
  const fn = actions[action] || fail("unknown_action", "Unknown action " + action);
  return { ok: true, ...(await fn(data)) };
}
