/*
  The only code in Planbook that is allowed to touch localStorage.

  Two rules from CLAUDE.md meet here, and both are easy to break by accident from three
  work orders away:

    - every key is prefixed `planbook_`, and
    - localStorage holds UI preferences and nothing else. Student data lives in IndexedDB,
      one JSON document per year (docs/data-model.md). Grades, names, contacts,
      attendance, and above all accommodation / medical / plan data never come near this
      file.

  The enforcement is PREF_DEFAULTS: setPref() refuses a key that is not declared there.
  That turns "no planbook_ key holds anything but a UI preference" from a promise into
  something the code cannot violate without someone first adding the key to a list whose
  name says what belongs in it.

  Adding a preference is one line below plus a default, and the defaults-merge means an
  older device missing the key reads the default rather than undefined — the pattern is
  lifted from Roll Call!'s loadConfig() (portable-components.md §8).
*/

export const PREFIX = 'planbook_';

/* key → default value. A key absent from this map cannot be written. */
export const PREF_DEFAULTS = {
  /* Epoch ms of the last "Not now" on the install banner; 0 means never dismissed. A fact
     about this browser's chrome, not about a student — see src/install-banner.js, which owns
     how long the dismissal lasts and why. */
  installBannerDismissedAt: 0,

  /* The year label this browser had open last, e.g. "2026-2027"; '' means "no preference,
     open the most recent one". A fact about this browser and not about a student: the year
     documents themselves live in IndexedDB, and the iPad and the laptop are each allowed to
     sit on a different year without either of them being wrong. Nothing but the label is
     here — no roster, no grades, nothing from inside the document. src/store.js reads it on
     boot and writes it on a year switch. */
  openYear: '',
};

/* Reads never throw: Safari in private mode can make localStorage itself throw on access,
   and a missing preference must degrade to the default rather than take the app down. */
export function getPref(key) {
  if (!(key in PREF_DEFAULTS)) return undefined;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? PREF_DEFAULTS[key] : JSON.parse(raw);
  } catch (e) {
    return PREF_DEFAULTS[key];
  }
}

export function setPref(key, value) {
  if (!(key in PREF_DEFAULTS)) {
    /* Loud on purpose. The likely cause is someone reaching for localStorage to stash
       something that belongs in the year document. */
    console.error('prefs: refusing to write "' + key + '" — not a declared UI preference.');
    return false;
  }
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}
