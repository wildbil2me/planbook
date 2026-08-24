/*
  The log — what the teacher wrote down about a student, and the one place an entry is appended.

  ── WHAT IS IN `log[]`, AND WHY THE `kind` FILTER IS THE WHOLE OF THE FIREWALL ──

  docs/data-model.md gives one collection, `{ id, studentId, at, kind, audience, subject, body }`,
  and three kinds share it: `behavior` and `note` are WO-4.4's — this file writes them — and
  `contact` is Phase 5's record of outreach that actually left the building, which the cooldown
  (WO-4.5) reads and `{{behavior.recent}}` renders into an email. **Nothing else in the app reads
  `log[]` today**; a grep for `doc.log` outside this file finds nothing. So the filter that stands
  between a behavior note and an email home is `entriesOfKind()` below and the readers built on it,
  and it is a filter rather than a promise: every read in this file names the kinds it wants, and
  there is no exported reader that hands back the whole array.

  THE SECOND HALF OF THAT FIREWALL IS `audience`. An entry written here carries `audience: ''` —
  it went to nobody, which is the truth about a note a teacher wrote to herself. Writing
  `"guardian"` on it because the field exists would put a behavior note one loose `filter` away
  from being counted as outreach, and the cooldown's whole job is to count outreach.

  ── APPEND-ONLY, AND THERE IS NOTHING HERE TO EDIT WITH ──

  Roll Call! made hall passes append-only after matching rows by `name + time` proved fragile
  (docs/data-model.md § log). Same reasoning, same answer, and it is structural here: this module
  exports one writer, `writeEntry()`, and it does exactly one thing to the document — `push`. There
  is no update, no delete, no id lookup for a mutation, and no `correctsId` on the record.

  **A CORRECTION IS AN ORDINARY LATER ENTRY THAT SAYS SO** (the owner, 2026-08-20, after a round
  trip). The ruling first arrived as "don't worry about corrections — you can just delete and
  re-enter", which would have reversed WO-4.4's deliverable, its acceptance line *"entries are never
  mutated or deleted"* and `docs/data-model.md` § log in one move; it was put back the same day and
  settled the other way. So there is no rule anywhere about which of two entries a reader should
  believe: both are in the list, in order, and the later one is later. If a future work order wants
  to strike one through, it wants a schema change and an argument, not a line here.

  ── WHAT THIS FILE IS NOT ──

  IT HAS NO DOM. `src/log-sheet.js` owns the sheet a teacher writes in and the card the record is
  read on; this file owns the shape, the write, and the two questions a reader can ask. Same split
  `src/calendar.js` and `src/calendar-view.js` make, and the import runs one way — nothing in
  src/log-sheet.js is imported back here.

  IT DECIDES NOTHING ABOUT PRESENTATION MODE. `visibleEntriesFor()` below asks src/supports.js and
  hands back a shorter list; the rule about WHICH kinds go quiet lives there, in the one function
  the whole app asks, and this file could not answer it if it wanted to. That is the arrangement
  WO-4.4 asks for in as many words — the card asks the model, the model asks src/supports.js, and
  no screen tests `presentationMode()` for itself. Two askers is two answers eventually.
*/

import { getDoc, update, newId } from './store.js';
/* The one visibility question in the app, and the kind rule that hangs off it. Nothing else about
   supports crosses this import: no plan, no accommodation, no clause. */
import { logKindVisible } from './supports.js';
/* THE DAY-STEP, IMPORTED RATHER THAN WRITTEN AGAIN. src/calendar.js's shiftDays() carries the scar
   that makes it the right one — it never leaves UTC, so a whole number of days cannot land on a DST
   seam — and its own comment says an export is what a third caller earns. This is the fourth, and a
   second function stepping a day is a second function that can disagree about the seam. */
import { shiftDays } from './calendar.js';

/*
  THE TWO KINDS THIS WORK ORDER WRITES, in the order the sheet's strip offers them.

  `contact` is deliberately not here. It is Phase 5's, nothing in this build writes one, and a
  reader in this file that included it would put an email's subject line on a card headed *"What you
  have written down"* the day that phase lands — which is a decision for that work order to make
  with its own reasons, not one to inherit from an array both features happen to share.
*/
export const LOG_KINDS = [
  { value: 'behavior', label: 'Behavior' },
  { value: 'note', label: 'Note to self' },
];

/* Which kinds this build's own surfaces read back. One list, so the card and the sheet cannot come
   to disagree about what "what you have written down" means. */
const OWN_KINDS = LOG_KINDS.map((k) => k.value);

export function isLogKind(kind) {
  return OWN_KINDS.indexOf(kind) >= 0;
}

export function kindLabelFor(kind) {
  const found = LOG_KINDS.filter((k) => k.value === kind)[0];
  return found ? found.label : 'Entry';
}

/*
  THE SIX QUICK ENTRIES, FIXED, IN THIS ORDER (the owner, 2026-08-20).

  **A CHIP WRITES A `subject` AND NEVER A CODE**, and that single constraint is the whole of what
  keeps a per-teacher list a settings block later rather than a migration: a written entry is
  indistinguishable from a typed one the moment it lands, so a picker over the teacher's own six
  reads exactly these records and changes no shape. The moment a chip writes an id the app has to
  know about, the custom list becomes a schema change instead of a preference. Nothing in this file
  or any other may branch on one of these strings.

  BOTH DIRECTIONS BELONG IN THE SHEET AND THE MIDDLE GROUND SITS FOURTH — the first slot after the
  conduct entries, and the one a thumb reaches without reading to the end. That is `plans/ROADMAP.md`
  Phase 4's own argument at chip scale: the praise half is what makes this a teacher's assistant
  rather than a gradebook with alarms, and a sheet where trouble is the only thing on offer is a
  sheet that only ever records trouble.

  The `mark` is decoration and is never stored. It is `aria-hidden` on screen for the reason every
  glyph in this app is: the words beside it are the label.
*/
export const QUICK_ENTRIES = [
  { subject: 'Off task', mark: '💬' },
  { subject: 'Phone out', mark: '📵' },
  { subject: 'Disruptive', mark: '🗣' },
  { subject: 'Showing improvement', mark: '📈' },
  { subject: 'Great contribution', mark: '⭐' },
  { subject: 'Helped someone', mark: '🤝' },
];

/* ────────────────────────────── the record ────────────────────────────── */

/*
  ONE ENTRY, EXACTLY THE SEVEN FIELDS docs/data-model.md NAMES, in that order and no others.

  `at` is a LOCAL ISO timestamp with its offset, never a `Z`, which is the rule the attendance mark
  cell settled at WO-2.10 and states at its own definition: the hour read back is the hour the
  teacher's clock showed. A `Z` here would put a 3pm entry on the previous day for anyone reading it
  east of the meridian, and the day is what the card prints.

  `audience` is `''` — see the header. `body` is trimmed and kept even when empty, because the field
  is in the schema and a card that has to test for two kinds of absence is a card with a bug in it.
*/
export function newLogEntry(studentId, kind, subject, body, at) {
  return {
    id: newId('l'),
    studentId: String(studentId || ''),
    at: at || localStamp(),
    kind: isLogKind(kind) ? kind : 'note',
    audience: '',
    subject: String(subject == null ? '' : subject).trim(),
    body: String(body == null ? '' : body).trim(),
  };
}

/*
  The device clock, written down the way this app writes every other moment (src/attendance.js's
  `at`). Built from the parts rather than from toISOString(), which is UTC by definition.
*/
function localStamp(now) {
  const d = now || new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const offset = -d.getTimezoneOffset();
  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
    + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
    + sign + pad(Math.floor(abs / 60)) + ':' + pad(abs % 60);
}

/*
  THE ONE WRITER. Appends and returns the entry, or null when there is nothing to write it into or
  nothing to say — a subject that is empty after trimming is not an entry, because the card's whole
  first line would be blank and the log would carry a row that says nothing happened.

  It is a `push` inside one update(), which is the only shape this operation has. See the header.
*/
export function writeEntry(studentId, kind, subject, body) {
  const doc = getDoc();
  if (!doc || !studentId) return null;
  const entry = newLogEntry(studentId, kind, subject, body);
  if (!entry.subject) return null;
  update((d) => {
    if (!Array.isArray(d.log)) d.log = [];
    d.log.push(entry);
  });
  return entry;
}

/* ────────────────────────────── reading it back ────────────────────────────── */

/* The array, or an empty one for a document from a build or a hand-edit that has none. The same
   tolerance every other collection reader in this app has (src/roster.js's rosterOf). */
export function entriesIn(doc) {
  return doc && Array.isArray(doc.log) ? doc.log.filter((e) => !!e && typeof e === 'object') : [];
}

/*
  ONE STUDENT'S ENTRIES OF THE KINDS ASKED FOR, NEWEST FIRST.

  Sorted by `at` descending and NOT by array order, because array order is write order and the two
  part company the moment a backup written on one device is restored beside entries written on
  another. The comparison is on the ISO string, which sorts correctly for a fixed offset and is what
  every other date comparison in this app does.

  THE TIE IS BROKEN BY WRITE ORDER, NEWEST FIRST, AND THAT IS NOT A DETAIL. `localStamp()` is
  second-granular, so two entries logged in one sitting — which is exactly what the two-tap sheet is
  for — carry the same `at`. A stable sort left alone keeps ARRAY order among them, and array order
  is oldest first, so the tie resolved the precise opposite of the heading on the card. It is also
  visible rather than academic: the card draws the newest four with the rest behind a tap, so a tie
  decides both the order a teacher reads and which entries she must tap to see at all. The worst of
  it is the case the owner settled on 2026-08-20 — a correction is an ordinary later entry that says
  so, with no rule about which of two a reader should believe, because the reader believes the
  newest. A correction written in the same second as the entry it corrects sorted UNDER it, which is
  that ruling broken by an accident of clock precision. Caught by verify-shell.mjs, WO-4.4.
*/
export function entriesOfKind(doc, studentId, kinds) {
  const want = Array.isArray(kinds) ? kinds : OWN_KINDS;
  return entriesIn(doc)
    .filter((e) => e.studentId === studentId && want.indexOf(e.kind) >= 0)
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => String(b.entry.at || '').localeCompare(String(a.entry.at || ''))
      || b.index - a.index)
    .map((held) => held.entry);
}

/* Everything this build wrote about one student, newest first, and the list a screen would draw if
   there were no projector in the room. */
export function entriesFor(doc, studentId) {
  return entriesOfKind(doc, studentId, OWN_KINDS);
}

/*
  AND THE SAME LIST WITH WHATEVER MAY NOT BE ON SCREEN TAKEN OUT OF IT.

  **This is the shape of what the model hands back changing, and not a second visibility test.**
  src/supports.js's logKindVisible() is the whole of the rule; this walks the list past it. A
  suppressed entry is therefore ABSENT from what the card is given, so the card cannot render it,
  count it, or say how many are missing — WO-1.9's standard, and the reason there is no "2 hidden"
  line anywhere: a count is the disclosure.
*/
export function visibleEntriesFor(doc, studentId) {
  return entriesFor(doc, studentId).filter((e) => logKindVisible(e.kind));
}

/*
  HOW MANY BEHAVIOR ENTRIES A STUDENT HAS INSIDE THE LAST N DAYS — the one reading the signal engine
  takes, and the reason it is a count rather than a list: `src/signals.js`'s behavior rule is handed
  its own measured numbers and nothing else, so a rule that received the entries could put a
  student's subject line into a sentence that Phase 5 drafts into an email.

  DAYS AND NOT MEETINGS, which is the one place in this app that unit is right and
  `SIGNAL_SETTINGS` says so at its own row: a behavior entry is a thing the teacher WROTE DOWN at a
  moment, and "two of them inside a month" is a statement about how close together they were rather
  than about how often the class met between them.

  THE WINDOW IS COUNTED OFF `through` RATHER THAN OFF THE CLOCK, so an as-of pass — which is what
  the harness runs — asks about the day it names. Both ends are compared as dates: an entry's `at`
  begins with its local date, exactly as a pass's does (docs/data-model.md), and comparing ten
  characters keeps the offset out of an arithmetic it has no business in.

  IT COUNTS ACROSS EVERY CLASS, and that is a property of the record rather than a choice made here:
  a log entry carries a `studentId` and no `classId`, so "two behavior notes in the last 30 days" is
  two notes about that child, wherever they were written. A teacher who has one student in two of
  her sections will see the rule fire in both, which is the honest reading of what she wrote down.
*/
export function behaviorCountSince(doc, studentId, throughISO, days) {
  const span = Math.max(0, Math.floor(Number(days) || 0));
  if (!span || !throughISO) return 0;
  const from = shiftDays(throughISO, -(span - 1));
  return entriesOfKind(doc, studentId, ['behavior'])
    .filter((e) => {
      const on = String(e.at || '').slice(0, 10);
      return on >= from && on <= throughISO;
    }).length;
}
