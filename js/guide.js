// DEMO WEBSITE ONLY: step-by-step instruction popups ("this is for X, tap here to do Y").
// Loaded by js/header.js only when DEMO_SITE is true. Each page has "screens" (e.g. Practical: login → station →
// confirm); the first time a screen appears its guide opens by itself, and the "? Guide" button replays it.
const PAGE = document.querySelector("header.top")?.dataset.page || "";

const GUIDES = {
  home: [{
    key: "home", when: "#kAtt", steps: [
      [null, "Welcome to the DEMO website", "This is a safe place to practice. Nothing you do here is saved to the real evaluation. This short guide shows what each part is for."],
      ["header.top nav", "Pages", "Use these tabs to move between Dashboard, Registration, Theoretical, Practical and Admin. Click the FTAP logo anytime to come back to this Dashboard."],
      ["#session", "Session and time", "Shows whether it is the Morning (AM) or Afternoon (PM) session, with the current time."],
      [".kpis", "Live counts", "How many technicians registered, and how many are taking or have finished the Theoretical exam and the Practical evaluation. Updates by itself."],
      ["#tvBtn", "Projector mode", "Click for a big-screen view to show on the venue's projector or TV."],
      ["#breakdownCard", "Per company", "Progress of each company: registered, exam done and practical done."],
      ["#participantsCard .filters", "Find people", "Search by name, or filter by company, region, area or role."],
      ["#participantsCard", "Participant list", "Everyone registered and their status. \"AM Batch\" / \"PM Batch\" shows when the person is scheduled for that part."],
      [null, "Try it", "Register a sample technician on the Registration tab, then come back here to see them appear. Click \"? Guide\" (bottom-right) anytime to see these tips again."],
    ],
  }],
  register: [
    { key: "form", when: "#form", steps: [
      [null, "Registration", "Technicians do this first when they arrive (they scan the Registration QR code). It records their attendance."],
      ["#company", "Company", "Choose the company. Below it, choose Direct or Subcon."],
      ["#surname", "Name", "Type the surname, first name and middle initial. Letters change to CAPITALS automatically."],
      ["#role", "Role", "Choose the role. Pick \"Other\" to type a role that isn't on the list."],
      ["#area", "Area", "Choose the area. The Region fills in by itself."],
      ["#photoBox", "ID photo", "Take a photo of the company ID with the camera, or upload a picture."],
      ["#submitBtn", "Review", "Tap to check the details before they are saved."],
    ] },
    { key: "review", when: "#review", steps: [
      ["#reviewList", "Check the details", "Make sure the name, company and photo are correct."],
      ["#confirmBtn", "Confirm", "Tap Confirm to register. Use Edit to go back and fix something."],
    ] },
    { key: "done", when: "#done", steps: [
      ["#done", "Registered!", "This shows whether the person takes the Theoretical exam or the Practical first (morning or afternoon). One phone can register only one person."],
      ["#msg", "Register another (demo)", "On the demo, tap \"Start over\" in the yellow box to clear this phone and register another sample person."],
    ] },
  ],
  exam: [{
    key: "start", when: "#startForm", steps: [
      [null, "Theoretical exam", "60 questions in 60 minutes, opened by scanning the Theoretical QR code. Only registered technicians can start it."],
      ["#instructions", "Instructions", "Read these before starting."],
      ["#surname", "Your name", "Choose the company and type the name exactly as registered. The app checks that the person is registered."],
      ["#agree", "Privacy notice", "Check the box to accept the data privacy notice."],
      ["#startBtn", "Start exam", "Starts the exam and the 60-minute timer. On the demo website this button is turned off: the real questions are never shown here."],
    ],
  }],
  practical: [
    { key: "login", when: "#login", steps: [
      [null, "Practical evaluation", "This page is for evaluators only."],
      ["#event", "Event", "Choose the event (location and dates)."],
      ["#evaluator", "Your name", "Choose your name. Your station is shown next to it, and you will only see that station."],
      ["#pin", "Evaluator PIN", "Enter your evaluator PIN. The eye button shows or hides it. On the demo, your PIN lets you review your station's real scenarios; scores are not saved."],
      ["#loginBtn", "Continue", "Tap to open your station."],
    ] },
    { key: "station", when: "#pickerBox", steps: [
      ["#whoBar", "You", "Your name and station. Log out when you are finished."],
      ["#pickerBox", "Choose the technician", "First, type the technician's name and tap them in the list. Technicians already scored at your station can't be chosen again."],
      ["#scenarios", "Scenarios", "Your station's scenarios. Score each one: Pass / Fail (5 or 0) or 0 to 5, as written on it."],
      ["#total", "Total", "The total updates as you score."],
      ["#remarks", "Remarks", "Optional notes about the technician."],
      ["#saveBtn", "Review & Submit", "Opens a confirmation page. After you submit there, the score is locked and can't be changed."],
    ] },
    { key: "timer", when: "#stTimer", steps: [
      ["#picked", "Technician", "The technician you are scoring. Tap Change if you picked the wrong person."],
      ["#stTimer", "10-minute timer", "Each part has its own 10-minute timer. It warns you when 2 minutes are left. Restart begins the current 10 minutes again."],
    ] },
    { key: "confirm", when: "#confirmPage", steps: [
      ["#confirmRows", "Check the scores", "Make sure every score is right."],
      ["#submitFinal", "Submit", "Locks the score. Use the button next to it to go back and fix something first."],
    ] },
  ],
  admin: [{
    key: "admin", when: "#testBtn", steps: [
      ["#testBtn", "Test connection", "Checks that the website is working."],
      ["#msg", "QR codes", "QR codes are not available on the demo. Print them from the Admin page of the real website."],
    ],
  }],
};

const screens = GUIDES[PAGE];
if (screens) init();

function init() {
  const seenKey = (s) => "guideSeen:" + PAGE + ":" + s.key;
  const visible = (sel) => { const el = sel && document.querySelector(sel); return el && el.getClientRects().length ? el : null; };
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k) => { try { localStorage.setItem(k, "1"); } catch { /* ignore */ } } };

  // "? Guide" button
  const fab = document.createElement("button");
  fab.type = "button"; fab.className = "guide-fab no-print"; fab.innerHTML = "<b>?</b> Guide"; fab.title = "Show the instructions for this page";
  fab.onclick = () => { const s = current(); if (s) open(s); };
  document.body.appendChild(fab);

  const current = () => [...screens].reverse().find(s => visible(s.when));
  let active = null;

  // open each screen's guide by itself the first time it appears
  setInterval(() => {
    if (active) return;
    const s = current();
    if (s && !store.get(seenKey(s))) open(s);
  }, 700);

  function open(screen) {
    store.set(seenKey(screen));
    const steps = screen.steps.filter(([sel]) => !sel || visible(sel));
    if (!steps.length) return;
    const dim = document.createElement("div"); dim.className = "guide-dim";
    const spot = document.createElement("div"); spot.className = "guide-spot";
    const tip = document.createElement("div"); tip.className = "guide-tip"; tip.setAttribute("role", "dialog"); tip.setAttribute("aria-live", "polite");
    document.body.append(dim, spot, tip);
    let i = 0, target = null;
    const close = () => { [dim, spot, tip].forEach(n => n.remove()); removeEventListener("resize", place); removeEventListener("scroll", place, true); removeEventListener("keydown", key); active = null; };
    const key = (e) => { if (e.key === "Escape") close(); else if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1); };
    function place() {
      const pad = 6, gap = 12, vw = innerWidth, vh = innerHeight;
      const w = Math.min(340, vw - 32); tip.style.width = w + "px";
      if (!target) { spot.style.display = "none"; dim.style.display = "block"; tip.style.left = (vw - w) / 2 + "px"; tip.style.top = Math.max(16, (vh - tip.offsetHeight) / 2) + "px"; return; }
      dim.style.display = "none"; spot.style.display = "block";
      const r = target.getBoundingClientRect();
      Object.assign(spot.style, { left: r.left - pad + "px", top: r.top - pad + "px", width: r.width + pad * 2 + "px", height: r.height + pad * 2 + "px" });
      const h = tip.offsetHeight;
      let top = r.bottom + pad + gap;
      if (top + h > vh - 12) top = r.top - pad - gap - h;           // no room below → above
      if (top < 12) top = Math.min(vh - h - 12, Math.max(12, r.top + 12)); // big element → overlap its top
      tip.style.top = top + "px";
      tip.style.left = Math.min(vw - w - 16, Math.max(16, r.left + r.width / 2 - w / 2)) + "px";
    }
    function go(d) {
      i += d; if (i < 0) i = 0; if (i >= steps.length) return close();
      const [sel, title, text] = steps[i];
      target = sel ? visible(sel) : null;
      tip.innerHTML = `<div class="guide-count">Step ${i + 1} of ${steps.length}</div><h3></h3><p></p>
        <div class="guide-actions"><button type="button" class="small secondary guide-skip">Skip</button><span></span>
        ${i ? '<button type="button" class="small secondary guide-back">Back</button>' : ""}
        <button type="button" class="small guide-next">${i === steps.length - 1 ? "Got it" : "Next"}</button></div>`;
      tip.querySelector("h3").textContent = title; tip.querySelector("p").textContent = text;
      tip.querySelector(".guide-skip").onclick = close;
      tip.querySelector(".guide-next").onclick = () => go(1);
      const b = tip.querySelector(".guide-back"); if (b) b.onclick = () => go(-1);
      if (target) {
        const r = target.getBoundingClientRect();
        if (r.top < 70 || r.bottom > innerHeight - 160) target.scrollIntoView({ block: r.height > innerHeight * .5 ? "start" : "center" });
      }
      place(); requestAnimationFrame(place);
      tip.querySelector(".guide-next").focus({ preventScroll: true });
    }
    active = screen;
    dim.onclick = close;
    addEventListener("resize", place); addEventListener("scroll", place, true); addEventListener("keydown", key);
    go(0);
  }
}
