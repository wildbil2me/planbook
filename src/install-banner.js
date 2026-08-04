/*
  Install detection, and the banner that warns a teacher who has not installed yet.

  This is a data-safety feature wearing a banner's clothes. iOS Safari erases the storage of a
  site that has not been opened in about seven days; a PWA on the home screen is exempt.
  Everything Planbook holds is in that storage, so the difference between a bookmark and an
  installed icon is the difference between having last term's grades and not (CLAUDE.md →
  "Four things that will bite").

  The copy itself lives in index.html, not here. It is the part of this work order that a
  teacher actually reads, it is longer than any string that belongs in a template literal, and
  keeping it in the markup means it can be read and revised without opening a module.

  ── The two decisions in this file ──

  DETECTION. `display-mode: standalone` covers Chrome, Edge, and iOS 16.4+. `navigator
  .standalone` is the iOS-only flag and covers the older iPads that a school still has in a
  cart. Neither is checked for `minimal-ui` or `fullscreen`: no launch path in this app
  produces them, and a false "you're installed" is a silent failure — the teacher stops being
  warned and finds out at the end of a holiday.

  THE RETURN INTERVAL. "Dismissible but returning" is the design: a banner dismissed forever
  fails the teacher who dismissed it in September and lost October, and a banner that cannot be
  dismissed trains the eye to skip it. Three days, and the number is derived rather than
  chosen — it has to be strictly less than half of the ~7-day eviction window, so that at least
  one warning always falls between a dismissal and the earliest moment data could be erased.
  Seven days would have been the intuitive number and is exactly the wrong one: the banner
  would come back the week after the grades were already gone.
*/

import { getPref, setPref } from './prefs.js';
import { announce } from './live-region.js';

const BANNER_ID = 'installBanner';
const DISMISS_PREF = 'installBannerDismissedAt';
const RETURN_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

export function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

/* Decides whether the banner should be on screen right now. The banner ships `hidden` in the
   markup and is only ever revealed here, so an installed launch cannot flash it on the way
   past. */
export function refreshInstallBanner() {
  const el = document.getElementById(BANNER_ID);
  if (!el) return;

  const dismissedAt = getPref(DISMISS_PREF) || 0;
  const snoozed = Date.now() - dismissedAt < RETURN_AFTER_MS;
  el.classList.toggle('hidden', isInstalled() || snoozed);
}

/* "Not now". The timestamp is a UI dismissal — a fact about this browser, not about a
   student — which is what makes it legal in localStorage at all (src/prefs.js). */
export function dismissInstallBanner() {
  setPref(DISMISS_PREF, Date.now());
  refreshInstallBanner();
  /* The only feedback for dismissing is a strip of the page disappearing, which is no
     feedback at all without sight. Saying it comes back is also the honest part: this is a
     snooze, and a teacher should not think she has turned the warning off. */
  announce('Install reminder hidden. It will come back in a few days, until Planbook is installed.');
}
