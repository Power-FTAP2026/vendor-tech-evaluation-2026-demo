// Talks to the Google Apps Script backend (which reads/writes the Google Sheet + Drive folder).
// While SCRIPT_URL is not set, everything runs against a local DEMO backend in this browser.
import { SCRIPT_URL, DEMO_SITE } from "./config.js";

// DEMO website: keep all of its browser storage separate from the real site. Both sites share the same
// address (power-ftap2026.github.io), so without this a demo registration would lock the real one on that phone.
if (DEMO_SITE && typeof Storage !== "undefined" && !Storage.prototype.__demoSite) {
  const P = "demosite:", proto = Storage.prototype;
  const get = proto.getItem, set = proto.setItem, del = proto.removeItem;
  proto.getItem = function (k) { return get.call(this, P + k); };
  proto.setItem = function (k, v) { return set.call(this, P + k, v); };
  proto.removeItem = function (k) { return del.call(this, P + k); };
  proto.__demoSite = true;
}

const local = typeof location !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

// Practice switch (this computer only): add ?demo=1 to any page address to use DEMO mode (nothing is sent to the
// Google Sheet), and ?demo=0 to go back to LIVE. On the public live site it is ignored — use the demo website instead.
const DEMO_KEY = "forceDemo";
try {
  const want = new URLSearchParams(location.search).get("demo");
  if (want === "1" && local) localStorage.setItem(DEMO_KEY, "1");
  if (want === "0") localStorage.removeItem(DEMO_KEY);
} catch { /* storage blocked — ignore */ }
const forcedDemo = local && (() => { try { return localStorage.getItem(DEMO_KEY) === "1"; } catch { return false; } })();
const hasUrl = !DEMO_SITE && /^https:\/\/script\.google(usercontent)?\.com\//.test(SCRIPT_URL);

export const isConfigured = hasUrl && !forcedDemo;

export class ApiError extends Error {
  constructor(code, message) { super(message || code); this.code = code; }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Calls a backend action, e.g. api("register", {...}).
 * Retries automatically when Google is busy (many people submitting at the same moment) or the network drops.
 */
export async function api(action, data = {}, { retries = 6 } = {}) {
  if (!isConfigured) {
    const { demoApi } = await import("./demo-backend.js");
    return demoApi(action, data);
  }
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt) await sleep(Math.min(8000, 700 * 2 ** (attempt - 1)) + Math.random() * 600);
    let res;
    try {
      // text/plain avoids a CORS pre-flight, which Apps Script does not support.
      const r = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, ...data }),
      });
      const text = await r.text();
      try { res = JSON.parse(text); }
      catch { lastErr = new ApiError("busy", "The server is busy."); continue; } // Google error page → retry
    } catch (e) {
      lastErr = new ApiError("network", "No internet connection."); continue;
    }
    if (res.ok) return res;
    // "busy" and unexpected Google hiccups under heavy load ("server_error") are temporary → try again.
    if (res.retry || res.error === "busy" || res.error === "server_error") { lastErr = new ApiError(res.error, res.message); continue; }
    const e = new ApiError(res.error, res.message);
    e.afterRetry = attempt > 0; // an earlier attempt may already have been saved before its reply was lost
    throw e;
  }
  throw lastErr || new ApiError("network", "Could not reach the server.");
}

/** Friendly sentence for an error, for showing on screen. */
export function errorText(e) {
  if (!e) return "";
  if (e.code === "network") return "No internet connection. Please check the Wi-Fi/data and try again.";
  if (e.code === "busy") return "The server is busy right now. Please wait a few seconds and try again.";
  if (e.code === "setup_needed") return "The Google Sheet is not set up yet: " + e.message;
  return e.message || String(e);
}

/** Demo-mode banner (with a "clear demo data" link). On this computer it also shows a LIVE notice + switch. */
export function showDemoBanner(el) {
  if (!el) return;
  if (isConfigured) {
    if (local) el.innerHTML = `<div class="alert ok"><b>LIVE:</b> saving to the Google Sheet.
      <a href="?demo=1">Switch to demo mode</a> for practice.</div>`;
    return;
  }
  el.innerHTML = DEMO_SITE
    ? `<div class="alert info"><b>DEMO website:</b> practice freely — nothing here is saved to the real evaluation, and the
        Theoretical exam can't be started here. Evaluators: log in to Practical with your evaluator PIN to review your
        station's scenarios (practice scores are not saved). <a href="#" id="demoClear">Start over</a></div>`
    : `<div class="alert info"><b>Demo mode:</b> data is saved only in this browser — nothing goes to the
        Google Sheet. <a href="#" id="demoClear">Clear demo data</a>${hasUrl ? ` · <a href="?demo=0">Switch to LIVE</a>` : ""}</div>`;
  el.querySelector("#demoClear").onclick = (e) => {
    e.preventDefault();
    if (!confirm("Delete all demo data (registrations, exams, scores) in this browser?")) return;
    // (on the demo website every stored key carries the "demosite:" prefix — strip it, because removeItem adds it back)
    const keys = Object.keys(localStorage).map(k => (DEMO_SITE && k.startsWith("demosite:") ? k.slice(9) : k));
    keys.filter(k => k.startsWith("demo")).forEach(k => localStorage.removeItem(k));
    ["examState", "examState2", "examSubmitted", "registrant", "deviceRegistration", "recentScores"].forEach(k => localStorage.removeItem(k));
    location.reload();
  };
}
