// Renders the shared branded header (and footer) into <header class="top" data-page="..." data-sub="..."></header>
import { EVENT, DEMO_SITE, MAINTENANCE } from "./config.js";
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

// Demo website: leak deterrents on every page (content hidden when the page loses focus, no copy/print, Print Screen warning)
// Screenshot/copy/print deterrents on every page — except Admin, whose QR codes must stay printable.
if (page !== "admin") { document.querySelector("main")?.classList.add("protected"); protectPage(); }
if (DEMO_SITE) import("./guide.js");

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
