// Leak deterrents for sensitive screens (exam questions, practical scenarios, the demo website).
// NOTE: no website can truly block screenshots (phones/OS take them outside the browser). These measures make
// leaking harder and traceable: content is hidden when the page loses focus (most screenshot tools take focus
// first), the Print Screen key is caught on laptops, copy/right-click/print are blocked, and watermarks name the viewer.

let installed = false;
let shield = null, toastTimer = null;

/** Turns on the deterrents for the whole page. Elements with class "protected" are blurred when the page is not in focus. */
export function protectPage({ allowPrint = false } = {}) {
  if (installed) return;
  installed = true;
  document.body.classList.add("no-copy");
  if (allowPrint) document.body.classList.add("allow-print"); // Admin: the QR codes must stay printable

  shield = document.createElement("div");
  shield.className = "privacy-shield";
  shield.innerHTML = `<div><b>Content hidden</b><span>Return to this page to continue. Screenshots and sharing are not allowed.</span></div>`;
  document.body.appendChild(shield);

  const isField = (t) => t && (t.closest?.("input, textarea, select, [contenteditable]"));
  // (projector mode on the Dashboard is a public screen: never blur it when the operator clicks another window)
  const hide = () => { if (!document.body.classList.contains("tv")) document.body.classList.add("is-shielded"); };
  const show = () => document.body.classList.remove("is-shielded");
  // safety: tapping the "Content hidden" box brings the page back if the browser missed the focus event
  shield.addEventListener("click", () => { if (document.hasFocus()) show(); });

  // hide when focus leaves the page (Snipping Tool, app switcher, another window…)
  window.addEventListener("blur", hide);
  window.addEventListener("focus", show);
  document.addEventListener("visibilitychange", () => (document.hidden ? hide() : show()));
  window.addEventListener("pagehide", hide);

  // no right-click / copy / cut / drag (typing in form fields still works)
  document.addEventListener("contextmenu", (e) => { if (!isField(e.target)) e.preventDefault(); });
  ["copy", "cut", "dragstart"].forEach(ev => document.addEventListener(ev, (e) => { if (!isField(e.target)) e.preventDefault(); }));

  // keyboard: Print Screen, print, save, view-source
  document.addEventListener("keydown", (e) => {
    const k = (e.key || "").toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (mod && (allowPrint ? ["s", "u"] : ["p", "s", "u"]).includes(k)) { e.preventDefault(); warn("Printing and saving this page is not allowed."); }
    if (mod && k === "c" && !isField(e.target)) { e.preventDefault(); }
    if (mod && e.shiftKey && ["s", "3", "4", "5"].includes(k)) { hide(); warn("Screenshots are not allowed."); } // Win+Shift+S / Mac screenshot keys
  }, true);
  document.addEventListener("keyup", (e) => {
    if (e.key === "PrintScreen") {
      try { navigator.clipboard?.writeText(" "); } catch { /* clipboard blocked — ignore */ }
      hide(); warn("Screenshots are not allowed."); setTimeout(show, 1500);
    }
  }, true);
  if (!allowPrint) { window.addEventListener("beforeprint", hide); window.addEventListener("afterprint", show); }
}

function warn(text) {
  let t = document.querySelector(".protect-toast");
  if (!t) { t = document.createElement("div"); t.className = "protect-toast"; t.setAttribute("role", "alert"); document.body.appendChild(t); }
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/** Tiled diagonal watermark image (as a CSS background) with the given lines of text. */
export function watermarkCss(lines) {
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const text = lines.filter(Boolean).map((l, i) =>
    `<text x="0" y="${i * 22}" font-family="Arial, sans-serif" font-size="${i ? 13 : 17}" font-weight="${i ? 600 : 800}" fill="#b71c2e" fill-opacity="${i ? 0.11 : 0.13}">${esc(l)}</text>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220"><g transform="translate(30 150) rotate(-24)">${text}</g></svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

/** Puts a "DO NOT SHARE" watermark (+ viewer's name, date) over an element. Re-run after the element's content changes. */
export function watermark(el, who) {
  if (!el) return;
  el.classList.add("wm-host");
  let layer = el.querySelector(":scope > .wm-layer");
  if (!layer) { layer = document.createElement("div"); layer.className = "wm-layer"; layer.setAttribute("aria-hidden", "true"); el.appendChild(layer); }
  layer.style.backgroundImage = watermarkCss(["DO NOT SHARE", who, new Date().toLocaleDateString("en-PH")]);
}
