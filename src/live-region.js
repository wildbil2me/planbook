/*
  The screen reader's channel into the app.

  One `aria-live="polite"` region lives in index.html (`#srLive`, inside `.sr-only`), and
  everything that needs to tell a screen-reader user something goes through announce()
  rather than writing to the DOM and hoping. Save failures and offline states are the
  cases that matter: they are announced visually by a chip that a screen reader has no
  reason to be looking at.

  Lifted from Roll Call!'s announce() (src/dashboard.html, ~line 1936), including the
  scar: setting a live region to text it already contains announces nothing at all, so an
  identical repeat message is cleared first, and the write is deferred a tick so the
  clear-then-set pair actually reaches assistive tech as a change.
*/

const REGION_ID = 'srLive';

let lastMessage = '';

export function announce(message) {
  const el = document.getElementById(REGION_ID);
  if (!el || !message) return;
  if (message === lastMessage) el.textContent = '';
  lastMessage = message;
  setTimeout(() => { el.textContent = message; }, 30);
}
