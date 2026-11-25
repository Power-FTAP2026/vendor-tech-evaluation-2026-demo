// Forces free-text boxes to UPPER CASE while the person types (the saved value is upper case too).
export function forceUpper(...els) {
  for (const el of els) {
    if (!el) continue;
    el.classList.add("upper");
    el.setAttribute("autocapitalize", "characters"); // phone keyboards start in caps
    el.addEventListener("input", () => {
      const up = el.value.toUpperCase();
      if (up === el.value) return;
      const { selectionStart: s, selectionEnd: e } = el; // keep the cursor where it was
      el.value = up;
      try { el.setSelectionRange(s, e); } catch { /* some input types don't support selection */ }
    });
  }
}
