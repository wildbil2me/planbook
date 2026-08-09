/*
  The modal system: open, close, and the four keyboard/focus behaviors that make a
  `<div>` an actual dialog.

  Markup contract — an overlay in index.html looks like this and nothing else:

      <div class="modal-overlay hidden" id="aboutModal">
        <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="aboutTitle">
          <div class="modal-header"><h2 id="aboutTitle">…</h2><button class="modal-close">✕</button></div>
          <div class="modal-body">…</div>
        </div>
      </div>

  Semantics (`role="dialog"`, `aria-modal`, `aria-labelledby`) live in the HTML; this
  module owns behavior only:

    - opening moves focus into the panel,
    - Tab and Shift+Tab cycle inside the top-most open panel and cannot leave it,
    - Escape closes the top-most open modal,
    - a click on the backdrop closes it,
    - closing returns focus to whatever opened it.

  The focus trap and the open-modal stack are lifted from Roll Call! (src/dashboard.html
  ~line 1944), which keeps a hand-maintained MODAL_REGISTRY of every modal id. That list
  is a thing to forget to update, so here the stack is built at open time instead: any
  overlay passed to openModal() participates, and a modal added by a later work order
  needs no registration.

  Two divergences from the source, both because of Safari:

    - The opener is passed in rather than read from document.activeElement. Roll Call!
      pushes document.activeElement and gets away with it because it is only ever driven
      by a mouse on Windows. Safari — desktop and iPadOS both — does not focus a <button>
      when you click it, so document.activeElement at open time is <body> and focus
      returns to nowhere. The iPad is the device that decides go-live, so the caller says
      who opened it and activeElement is only the fallback (keyboard paths, console).

    - Backdrop close is new; Roll Call! has no backdrop dismissal at all. The gotcha it
      brings is handled below: a text selection that starts inside the panel and finishes
      outside it must not be read as a click on the backdrop.
*/

/* Open modals, innermost last. Each entry remembers what to give focus back to and the
   backdrop listeners to unbind on close. */
const stack = [];

function resolve(overlay) {
  return typeof overlay === 'string' ? document.getElementById(overlay) : overlay;
}

function panelOf(overlay) {
  return overlay.querySelector('[role="dialog"]') || overlay;
}

/* Tab order inside the panel. Zero-size elements are skipped: a hidden control is not a
   place Tab should stop, and `.hidden` children are common inside a dialog. */
function focusablesIn(el) {
  const selector = 'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(el.querySelectorAll(selector)).filter(
    (node) => node.offsetWidth > 0 || node.offsetHeight > 0 || node === document.activeElement
  );
}

function top() {
  return stack.length ? stack[stack.length - 1] : null;
}

/*
  IS ANYTHING ON TOP OF THE PAGE RIGHT NOW.

  Exported for one caller: the registry's keyboard path (WO-2.5), which must not let `A` mark a
  student absent while a dialog owns the screen. Roll Call!'s shortcut handler opens with the same
  guard (`if (_topOpenModal()) return;`, dashboard.html:3623) and it is the guard that is invisible
  until it is missing — a teacher typing into a confirm dialog would be writing marks behind it.

  It answers "is one open", never "which". Nothing outside this module may reach into the stack to
  decide whether to OPEN one: openModal() already refuses a duplicate, and a caller that made that
  decision for itself would be a second opinion about what is on screen.
*/
export function anyModalOpen() { return stack.length > 0; }

/* `opener` is the control that opened the modal, and closing gives focus back to it.
   Pass it whenever there is one — see the Safari note in the header comment. */
export function openModal(overlay, opener) {
  const el = resolve(overlay);
  if (!el || stack.some((entry) => entry.overlay === el)) return;

  const entry = {
    overlay: el,
    returnFocus: opener || document.activeElement,
    pressedBackdrop: false
  };
  /* Backdrop listeners are bound to the overlay rather than to document, and that is on
     purpose: iOS Safari only delivers synthesized click events on a non-interactive
     element when that element itself carries a listener. A document-level click handler
     would work on the desktop and quietly do nothing on the iPad — which is the device
     that decides go-live. */
  entry.onPress = (e) => { entry.pressedBackdrop = (e.target === el); };
  entry.onClick = (e) => {
    /* Both press and release must land on the backdrop. Press-inside-release-outside is
       someone dragging a text selection, not a dismissal. */
    if (e.target === el && entry.pressedBackdrop) closeModal(el);
    entry.pressedBackdrop = false;
  };
  el.addEventListener('mousedown', entry.onPress);
  el.addEventListener('touchstart', entry.onPress, { passive: true });
  el.addEventListener('click', entry.onClick);

  stack.push(entry);
  el.classList.remove('hidden');

  /* Focus the first control, or the panel itself if the dialog is all text.
     preventScroll keeps the page from lurching while the panel is still animating in. */
  const panel = panelOf(el);
  const focusable = focusablesIn(panel);
  if (focusable.length) {
    focusable[0].focus({ preventScroll: true });
  } else {
    panel.setAttribute('tabindex', '-1');
    panel.focus({ preventScroll: true });
  }
}

export function closeModal(overlay) {
  const el = resolve(overlay);
  if (!el) return;

  const index = stack.findIndex((entry) => entry.overlay === el);
  el.classList.add('hidden');
  if (index === -1) return;

  const [entry] = stack.splice(index, 1);
  el.removeEventListener('mousedown', entry.onPress);
  el.removeEventListener('touchstart', entry.onPress);
  el.removeEventListener('click', entry.onClick);

  /* The opener can be gone by now — a re-render, or a button inside a modal that closed
     first. try/catch rather than a check, because a detached node still has .focus.
     document.body is excluded because focusing it is not a focus return, it is the
     browser's default; leaving focus alone in that case at least keeps the Tab position. */
  const back = entry.returnFocus;
  if (back && back !== document.body && typeof back.focus === 'function') {
    try { back.focus({ preventScroll: true }); } catch (e) { /* opener is gone */ }
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' && e.key !== 'Escape') return;
  const entry = top();
  if (!entry) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal(entry.overlay);
    return;
  }

  const panel = panelOf(entry.overlay);
  const focusable = focusablesIn(panel);
  if (!focusable.length) { e.preventDefault(); return; }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  } else if (!panel.contains(document.activeElement)) {
    /* Focus escaped — browser chrome, an extension, a stray script. Pull it back. */
    e.preventDefault();
    first.focus();
  }
});
