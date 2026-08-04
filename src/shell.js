/*
  Boot, and the wiring for everything in the app shell.

  This is the only module index.html loads directly; everything else it imports. Keeping one
  entry point means the load order is stated in one place rather than in five <script> tags.

  A convention this file sets, because WO-1.2 is the first code and every later work order
  will copy whatever it finds here:

    Handlers are attached by delegation, from declarative `data-*` hooks in the markup —
    never `onclick="..."` attributes. Roll Call! uses inline onclick everywhere and it works
    there, because that app is one file with everything on `window`. Planbook is ES modules,
    where an inline attribute is evaluated in global scope and cannot see a module's
    exports; `onclick="openModal('x')"` would throw "openModal is not defined" and it would
    throw at click time rather than at load time, which is the worst place to find out.

    The hooks, all handled by the one listener below:
      data-modal-open="<overlayId>"   opens that overlay
      data-modal-close                closes the overlay it sits inside
      data-save-state="<state>"       shows that save-indicator state
      data-save-cycle                 runs the five-state demo
      data-announce="<message>"       sends a message to the aria-live region
      data-pill-group                 on a container: its .pill children single-select

    Delegation also means markup rendered later needs no re-binding, which is what makes it
    the right default for a screen whose rows come from the year document.
*/

import { openModal, closeModal } from './modal.js';
import { announce } from './live-region.js';
import { showSaveState, demoSaveCycle } from './save-indicator.js';
import { getPref, setPref } from './prefs.js';

/* One click listener for the whole document. Order matters only in that the first hook to
   match wins, and no element carries two of them. */
document.addEventListener('click', (e) => {
  /* The opener is handed to openModal rather than left for it to infer: Safari does not
     focus a button when you tap it, so document.activeElement here is <body>. Without
     this argument the modal has nowhere to give focus back to on the iPad. */
  const open = e.target.closest('[data-modal-open]');
  if (open) { openModal(open.getAttribute('data-modal-open'), open); return; }

  const close = e.target.closest('[data-modal-close]');
  if (close) {
    const overlay = close.closest('.modal-overlay');
    if (overlay) closeModal(overlay);
    return;
  }

  const saveState = e.target.closest('[data-save-state]');
  if (saveState) { showSaveState(saveState.getAttribute('data-save-state')); return; }

  if (e.target.closest('[data-save-cycle]')) { demoSaveCycle(); return; }

  const speak = e.target.closest('[data-announce]');
  if (speak) { announce(speak.getAttribute('data-announce')); return; }

  /* Filter pills are single-select within their group. `aria-pressed` moves with the class
     — a visually active pill that still reads "not pressed" is the standard way this
     component goes wrong. */
  const pill = e.target.closest('[data-pill-group] .pill');
  if (pill) {
    const group = pill.closest('[data-pill-group]');
    group.querySelectorAll('.pill').forEach((p) => {
      const on = (p === pill);
      p.classList.toggle('active', on);
      p.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
});

/* Boot. Today there is nothing to wait for, so the loading screen exists only so that the
   WO-1.4 store has somewhere to load behind. Hidden on DOMContentLoaded rather than on
   `load`: waiting for `load` waits for every image and font, and the shell has neither. */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loadingScreen').classList.add('hidden');
});

/* A console seam, and the reason it exists: WO-1.2 ships no store, so the five save states
   and the live region are only reachable by hand. Later work orders import these modules
   directly — nothing in the app should ever read `window.planbook`, and when the shelf goes
   this goes with it.

   getPref/setPref are here for the same reason and one more: setPref refusing an undeclared
   key is the check behind "no planbook_ key holds anything but a UI preference", and it is
   only runnable by hand until there is a preference to set. */
window.planbook = { showSaveState, demoSaveCycle, announce, openModal, closeModal, getPref, setPref };
