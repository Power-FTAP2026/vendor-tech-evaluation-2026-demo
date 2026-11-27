// Renders the shared branded header (and footer) into <header class="top" data-page="..." data-sub="..."></header>
import { EVENT, DEMO_SITE, MAINTENANCE, OPENS_AT } from "./config.js";
import { icon, hydrateIcons } from "./icons.js";
import { protectPage } from "./protect.js";

const el = document.querySelector("header.top");
const page = el.dataset.page || "";
const links = [
  ["home", "index.html", "Dashboard", "grid"],
  ["monitor", "monitor.html", "Monitoring", "eye"],
  ["register", "register.html", "Registration", "user"],
  ["exam", "exam.html", "Theoretical", "pen"],
  ["practical", "practical.html", "Practical", "wrench"],
  ["feedback", "feedback.html", "Feedback", "send"],
  ["admin", "admin.html", "Admin", "settings"],
];
// Participants' pages (register/exam/feedback) only show the brand, so nobody wanders off mid-exam.
// Live Monitoring (management view) is a one-way door: no menu and no link back out, on the demo too.
const showNav = !["register", "exam", "feedback", "monitor"].includes(page);
const logoLink = page !== "monitor" && (showNav || DEMO_SITE);
el.innerHTML = `
  <div class="inner">
    <a class="brand" href="${logoLink ? "index.html" : "#"}" ${logoLink ? 'title="Back to Dashboard"' : 'onclick="return false" tabindex="-1" style="cursor:default"'}>
      <img src="assets/logo.jpg" alt="${EVENT.org}" width="140" height="47" />
      <span class="divider"></span>
      <span class="brand-text"><span class="app-name">${EVENT.title}${DEMO_SITE ? ` <span class="demo-pill">DEMO</span>` : ""}</span>${el.dataset.sub ? `<span class="page-name">${el.dataset.sub}</span>` : ""}</span>
    </a>
    ${showNav ? `<nav aria-label="Main">${links.map(([id, href, label, ic]) =>
      `<a href="${href}" class="${id === page ? "active" : ""}" ${id === page ? 'aria-current="page"' : ""}>${icon(ic, 16)}<span>${label}</span></a>`).join("")}</nav>` : ""}
  </div>`;
document.title = (DEMO_SITE ? "DEMO · " : "") + (el.dataset.sub ? el.dataset.sub + " · " : "") + EVENT.title;

// footer
const footer = document.createElement("footer");
footer.className = "site-footer";
footer.innerHTML = `<span>© ${new Date().getFullYear()} ${EVENT.org}</span><span class="muted">${EVENT.title}</span>`;
document.body.appendChild(footer);

hydrateIcons();

// Leak deterrents (content hidden when the page loses focus, no copy/print, Print Screen warning) on every page, real and demo.
// Live Monitoring is the ONLY page that may be screenshotted / copied / printed (management report view).
// Admin is protected too, but its QR codes can still be printed.
if (page !== "monitor") { document.querySelector("main")?.classList.add("protected"); protectPage({ allowPrint: page === "admin" }); }
if (DEMO_SITE) import("./guide.js");

// Pages that open later (real website only): Registration / Theoretical stay covered until OPENS_AT.until, then open by themselves.
(function opensLater() {
  if (DEMO_SITE || !OPENS_AT?.until || !(OPENS_AT.pages || []).includes(page)) return;
  const until = Date.parse(OPENS_AT.until);
  if (!(until > Date.now())) return;
  try {
    if (new URLSearchParams(location.search).has("staff")) sessionStorage.setItem("maintBypass", "1");
    if (sessionStorage.getItem("maintBypass") === "1") return; // staff testing
  } catch { /* storage blocked — show the notice */ }
  const what = page === "exam" ? "The Theoretical exam" : "Registration";
  const cover = document.createElement("div");
  cover.className = "maint-cover"; cover.setAttribute("role", "alertdialog"); cover.setAttribute("aria-modal", "true"); cover.setAttribute("aria-labelledby", "opensTitle");
  cover.innerHTML = `<div class="maint-box"><span class="maint-ic">${icon("clock", 26)}</span>
    <h2 id="opensTitle">${what} opens at ${OPENS_AT.label.split(",")[0]}</h2>
    <p>${what} will be available on <b>${OPENS_AT.label}</b>. This page will open by itself at that time.</p>
    <p class="muted" style="margin-bottom:0">Thank you for your patience.</p></div>`;
  document.body.appendChild(cover);
  document.body.classList.add("maint-on");
  setTimeout(() => location.reload(), Math.min(until - Date.now() + 2000, 2147483000));
})();

// Maintenance notice (real website only): white see-through cover + message until MAINTENANCE.until, then gone by itself.
(function maintenance() {
  if (DEMO_SITE || !MAINTENANCE?.until) return;
  const until = Date.parse(MAINTENANCE.until);
  if (!(until > Date.now())) return;
  try {
    if (new URLSearchParams(location.search).has("staff")) sessionStorage.setItem("maintBypass", "1");
    if (sessionStorage.getItem("maintBypass") === "1") return; // staff testing the updates
  } catch { /* storage blocked — show the notice */ }
  const cover = document.createElement("div");
  cover.className = "maint-cover"; cover.setAttribute("role", "alertdialog"); cover.setAttribute("aria-modal", "true"); cover.setAttribute("aria-labelledby", "maintTitle");
  cover.innerHTML = `<div class="maint-box"><span class="maint-ic">${icon("settings", 26)}</span>
    <h2 id="maintTitle">Website under maintenance</h2>
    <p>We're making improvements for tomorrow's evaluation. The website will be back by <b>${MAINTENANCE.backBy}</b>.</p>
    <p class="muted" style="margin-bottom:0">Thank you for your patience.</p></div>`;
  document.body.appendChild(cover);
  document.body.classList.add("maint-on");
  setTimeout(() => location.reload(), Math.min(until - Date.now() + 2000, 2147483000)); // reopen by itself at the end time
})();
