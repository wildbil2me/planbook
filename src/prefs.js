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

  PREF_DEFAULTS is deliberately empty today. WO-1.2 ships chrome and has no preference to
  remember; the first real entry is WO-1.3's install-banner dismissal. Adding one is one
  line here plus a default, and the defaults-merge below means an older device missing the
  key reads the default rather than undefined — the pattern is lifted from Roll Call!'s
  loadConfig() (portable-components.md §8).
*/

export const PREFIX = 'planbook_';

/* key → default value. A key absent from this map cannot be written. */
export const PREF_DEFAULTS = {};

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
