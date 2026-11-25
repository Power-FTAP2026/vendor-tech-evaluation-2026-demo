// Renders the shared branded header (and footer) into <header class="top" data-page="..." data-sub="..."></header>
import { EVENT, DEMO_SITE } from "./config.js";
import { icon, hydrateIcons } from "./icons.js";
import { protectPage } from "./protect.js";

const el = document.querySelector("header.top");
const page = el.dataset.page || "";
const links = [
  ["home", "index.html", "Dashboard", "grid"],
  ["register", "register.html", "Registration", "user"],
  ["exam", "exam.html", "Theoretical", "pen"],
  ["practical", "practical.html", "Practical", "wrench"],
  ["admin", "admin.html", "Admin", "settings"],
];
// Participants' pages (register/exam) only show the brand, so nobody wanders off mid-exam.
const showNav = !["register", "exam"].includes(page);
el.innerHTML = `
  <div class="inner">
    <a class="brand" href="${showNav ? "index.html" : "#"}" ${showNav ? "" : 'onclick="return false"'}>
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
if (DEMO_SITE) { document.querySelector("main")?.classList.add("protected"); protectPage(); }
