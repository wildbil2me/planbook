/*
  The log — what the teacher wrote down about a student, and the one place an entry is appended.

  ── WHAT IS IN `log[]`, AND WHY THE `kind` FILTER IS THE WHOLE OF THE FIREWALL ──

  docs/data-model.md gives one collection, `{ id, studentId, at, kind, audience, subject, body }`,
  and three kinds share it: `behavior` and `note` are WO-4.4's and `contact` is WO-5.4's — this file
  writes all three, through two writers that share nothing but the `push` — and the contact is the
  record of outreach that actually left the building, which the cooldown (WO-4.5) reads and
  `{{behavior.recent}}` does not. **Nothing else in the app reads `log[]`**; a grep for `doc.log`
  outside this file finds nothing. So the filter that stands between a behavior note and an email
  home is `entriesOfKind()` below and the readers built on it, and it is a filter rather than a
  promise: every read in this file names the kinds it wants, and there is no exported reader that
  hands back the whole array.

  THE SECOND HALF OF THAT FIREWALL IS `audience`. An entry written by the SHEET carries
  `audience: ''` — it went to nobody, which is the truth about a note a teacher wrote to herself.
  Writing `"guardian"` on it because the field exists would put a behavior note one loose `filter`
  away from being counted as outreach, and the cooldown's whole job is to count outreach. A
  `contact` carries a real one, which is the same rule read from the other side: it went to
  somebody, and the suppressed row on the signal list says which.

  ── APPEND-ONLY, AND THERE IS NOTHING HERE TO EDIT WITH ──

  Roll Call! made hall passes append-only after matching rows by `name + time` proved fragile
  (docs/data-model.md § log). Same reasoning, same answer, and it is structural here: this module
  exports two writers, `writeEntry()` and `writeContact()`, and each does exactly one thing to the
  document — `push`. There is no update, no delete, no id lookup for a mutation, and no `correctsId`
  on the record. **The second writer arrived at WO-5.4 and changed nothing about that**: a contact
  is appended and a second handoff appends again, because two messages handed over are two facts.

  **A CORRECTION IS AN ORDINARY LATER ENTRY THAT SAYS SO** (the owner, 2026-08-20, after a round
  trip). The ruling first arrived as "don't worry about corrections — you can just delete and
  re-enter", which would have reversed WO-4.4's deliverable, its acceptance line *"entries are never
  mutated or deleted"* and `docs/data-model.md` § log in one move; it was put back the same day and
  settled the other way. So there is no rule anywhere about which of two entries a reader should
  believe: both are in the list, in order, and the later one is later. If a future work order wants
  to strike one through, it wants a schema change and an argument, not a line here.

  ── WHAT THIS FILE IS NOT ──

  IT HAS NO DOM. `src/log-sheet.js` owns the sheet a teacher writes in and the card the record is
  read on, and `src/contact-history.js` owns the two surfaces the contacts are read on; this file
  owns the shape, the writes, and the questions a reader can ask — two at WO-4.4, five since WO-4.5
  whose three are dates and an `audience` and are argued at their own block below, and one at WO-5.4.
  Same split `src/calendar.js` and `src/calendar-view.js` make, and the import runs one way —
  nothing in either of those files is imported back here.

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
  THE TWO KINDS THE SHEET OFFERS, in the order its strip offers them.

  `contact` is deliberately not here, and it stayed out on the day WO-5.4 landed — which is the
  decision this comment reserved for that work order, made and written down. A reader here that
  included it would put an email's subject line on a card headed *"What you have written down"*,
  and that card's own footer promises the teacher that none of what is on it was sent anywhere. The
  contacts are a second card over visibleContactsFor() below, and every caller of the readers built
  on this array sees exactly what it saw before.
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

/* ──────────────────── the contact, and its own record (WO-5.4) ────────────────────

  ── WHY THIS IS A SECOND RECORD BUILDER AND NOT AN EIGHTH ARGUMENT ──

  newLogEntry() above writes the seven fields for the two kinds the SHEET authors, and the block at
  the foot of this file has argued since WO-4.5 that a `ruleId: ''` on every behavior note would be
  an eighth field paid for by every document, for a kind Phase 5 owns. That argument does not stop
  being true on the day Phase 5 arrives — it is exactly why the contact gets its own builder here
  rather than a defaulted parameter there. The seven-field writer is untouched, so a document full
  of behavior notes written by this build is byte-identical to one written by the last.

  ── IT TAKES AN OBJECT, WHERE writeEntry() TAKES POSITIONS ──

  Five arguments of which three are free text is a call site nobody can read and two of them are
  swappable without a type error — `subject` and `body` are both strings the teacher typed, and a
  transposition would put a whole email into a card's first line and go unnoticed for a term. The
  one caller (src/outreach-view.js) names each field at the call.

  ── AND IT DOES NOT REFUSE AN EMPTY SUBJECT, WHICH writeEntry() DOES ──

  A note with no subject is not an entry — the card's first line would be blank and the log would
  carry a row saying nothing happened. A CONTACT with no subject is a message that went out with an
  empty subject line, which is a thing a mail app will happily do, and refusing to record it would
  lose the cooldown's only evidence that the teacher already wrote about this. **The event is the
  entry here, where for a note the words are.** The card prints a stand-in for the missing line.

  `audience` is written as it is handed over and is not checked against `AUDIENCES`: that vocabulary
  is src/templates.js's — it is the drawer a TEMPLATE is filed under — and importing it here would
  put the template model inside the log's. The caller maps a recipient onto it (src/outreach.js's
  audienceOf), which is the one place in the app that mapping is made.
*/
export function newContactEntry(contact) {
  const c = contact || {};
  return {
    id: newId('l'),
    studentId: String(c.studentId || ''),
    at: c.at || localStamp(),
    kind: 'contact',
    /* THE OTHER HALF OF THE FIREWALL, FILLED RATHER THAN EMPTIED. An entry written by the sheet
       carries `audience: ''` because it went to nobody; this one went to somebody, and the
       cooldown's suppressed row says which — "you wrote to their guardian about this on Sep 6". */
    audience: String(c.audience == null ? '' : c.audience).trim(),
    subject: String(c.subject == null ? '' : c.subject).trim(),
    body: String(c.body == null ? '' : c.body).trim(),
    /* THE EIGHTH FIELD, AND IT CARRIES src/signals.js's OWN `hit.ruleId` UNCHANGED. No mapping and
       no second vocabulary — docs/data-model.md § log says so, and lastContactAbout() below reads
       exactly this string. A draft opened with no hit in its direction has no rule and writes `''`,
       which silences nothing: the under-fire posture the block at the foot of this file argues. */
    ruleId: String(c.ruleId == null ? '' : c.ruleId).trim(),
  };
}

/*
  THE SECOND WRITER, AND STILL THE ONLY OTHER THING THIS MODULE DOES TO THE DOCUMENT — a `push`
  inside one update(). There is no update of an entry, no delete, and no id lookup for a mutation
  here either; the append-only rule in this file's header is a property of the two functions, not a
  promise made about them.

  **A SECOND HANDOFF IS A SECOND ENTRY** and that is the append-only rule rather than a gap in this
  one. A teacher who presses *Open in my mail app* twice handed two messages over, which is two
  facts, and the cooldown reads the newest of them; nothing here looks for an entry to reuse,
  because looking for one is the first half of editing it.
*/
export function writeContact(contact) {
  const doc = getDoc();
  const c = contact || {};
  if (!doc || !c.studentId) return null;
  const entry = newContactEntry(c);
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
  ONE STUDENT'S CONTACTS, NEWEST FIRST, AND ONLY THE ONES THAT MAY BE ON SCREEN (WO-5.4).

  **WHAT DID NOT HAPPEN HERE IS THE DECISION.** `contact` is still not in LOG_KINDS or OWN_KINDS, so
  visibleEntriesFor() above and everything built on it hand back exactly behaviour and note, exactly
  as they did before this work order — the card headed *"What you have written down"* does not
  quietly gain an email's subject line, which is the outcome the array's own comment forbids. The
  history is a SECOND card over a SECOND reader (src/contact-history.js), and the two lists never
  meet.

  **THERE IS NO UNFILTERED TWIN OF THIS EXPORTED**, unlike entriesFor()/visibleEntriesFor() one
  function up. That pair exists because the sheet's card had a reason to name the whole list before
  the projector took rows out of it; nothing has such a reason here, and an exported
  `contactsFor()` would be the one call a later screen could make to draw a contact history that the
  presentation-mode rule never touched. The suppression arrives as a SHORTER LIST — the same shape,
  and the same reason: a caller cannot count what it was never handed.
*/
export function visibleContactsFor(doc, studentId) {
  return entriesOfKind(doc, studentId, ['contact']).filter((e) => logKindVisible(e.kind));
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

/* ────────────────────── what the cooldown and the quiet middle read (WO-4.5) ──────────────────────

  ── `ruleId`, THE EIGHTH FIELD, WHICH ONE OF THE TWO WRITERS FILLS ──

  The cooldown suppresses a student on ONE SIGNAL — WO-4.5's trap in one line: keyed on the student
  rather than the signal, it hides a new problem because you emailed about an old one. So it has to
  know which signal a contact was about, and `{ id, studentId, at, kind, audience, subject, body }`
  has nowhere to say it. `ruleId` is that field: `docs/data-model.md` § log names it, WO-5.4's
  newContactEntry() above fills it, and it carries `src/signals.js`'s own `hit.ruleId` unchanged so
  that nothing anywhere has to map one vocabulary onto the other.

  ONLY A CONTACT CARRIES ONE, and newLogEntry() above was deliberately not touched when WO-5.4
  landed. It writes the seven fields the data model names for the two kinds the sheet authors, and a
  `ruleId: ''` on a behavior note would be an eighth field on every record that never means
  anything — a shape change paid by every document, for a field belonging to a kind Phase 5 owns.
  The reader below therefore has to tolerate its absence, and does: an entry with no `ruleId` is
  about no signal this can name, so it silences nothing. **That absence is reachable through the
  front door**: a draft opened about a student with no hit in the tone's direction has no rule to
  name, and the handoff writes `''` rather than inventing one.

  THAT TOLERANCE UNDER-FIRES RATHER THAN OVER-CLAIMS, which is the same posture the turnaround rule
  takes at src/signals.js. A contact whose signal is unknown suppressing NOTHING costs a teacher one
  duplicate email; a contact whose signal is unknown suppressing EVERYTHING is the trap this work
  order names, arrived at through the back door of a missing field.

  ── AND THE FIREWALL IS UNCHANGED ──

  A reader here still names the kinds it wants, and there is still no exported reader that hands
  back an entry. What crosses these three functions is a DATE, and — for the cooldown alone — the
  `audience` enum, because the suppressed row on the list has to say *which* contact silenced it and
  "you emailed his guardian" is the useful half of that sentence. A subject and a body do not cross:
  the list screen would then be one careless template away from putting what a teacher wrote about a
  child into an email about that child.
*/

/* Behavior, note, and Phase 5's contact — the whole of what `log[]` may hold. It is separate from
   LOG_KINDS above for that array's own stated reason: LOG_KINDS is what the SHEET offers and what
   this build's surfaces read back, and folding `contact` into it would put an email's subject line
   on a card headed "What you have written down". This one is used by the two date readers below,
   which read every kind because "nothing has been written down, said, or sent" is a claim about all
   three and would be a lie if it quietly meant two. */
const ALL_KINDS = ['behavior', 'note', 'contact'];

/*
  WHEN THIS STUDENT WAS LAST CONTACTED ABOUT THIS SIGNAL — `{ on, audience }`, or null.

  IT REFUSES AN EMPTY `ruleId` RATHER THAN ANSWERING "ANY CONTACT", and that refusal is the trap
  made structural. A caller who wants "when did I last write about her at all" cannot get it out of
  this function and hand the answer to a cooldown, which is precisely the mistake WO-4.5 exists to
  warn against; lastContactDate() below answers that different question under a name that says so.

  `on` IS A DATE AND NOT A TIMESTAMP. Both ends of every window in this file are compared as the
  first ten characters of `at` — behaviorCountSince() says why — so the offset stays out of an
  arithmetic it has nothing to do with.

  Newest first out of entriesOfKind(), so the first match is the most recent contact about that
  signal, which is the one the cooldown counts from.
*/
export function lastContactAbout(doc, studentId, ruleId, throughISO) {
  const rule = String(ruleId || '');
  if (!rule || !throughISO) return null;
  const found = entriesOfKind(doc, studentId, ['contact'])
    .filter((e) => String(e.ruleId || '') === rule
      && String(e.at || '').slice(0, 10) <= throughISO)[0];
  return found
    ? { on: String(found.at).slice(0, 10), audience: String(found.audience || '') }
    : null;
}

/* WHEN THIS STUDENT WAS LAST CONTACTED ABOUT ANYTHING — a date, or ''. The quiet middle's
   exclusion and nothing else: a student written home about this term is not a student her teacher
   has lost track of, whichever signal prompted it, and that question is about the student where the
   cooldown's is about the pair. */
export function lastContactDate(doc, studentId, throughISO) {
  if (!throughISO) return '';
  const found = entriesOfKind(doc, studentId, ['contact'])
    .filter((e) => String(e.at || '').slice(0, 10) <= throughISO)[0];
  return found ? String(found.at).slice(0, 10) : '';
}

/* WHEN ANYTHING WAS LAST WRITTEN DOWN, SAID OR SENT ABOUT THIS STUDENT — a date, or ''. The quiet
   middle's clock. It takes no `kinds` argument on purpose: the whole of what it measures is "has
   anything happened", and a caller able to narrow it could ask about two kinds and print the answer
   under a heading that claims three. */
export function lastEntryDate(doc, studentId, throughISO) {
  if (!throughISO) return '';
  const found = entriesOfKind(doc, studentId, ALL_KINDS)
    .filter((e) => String(e.at || '').slice(0, 10) <= throughISO)[0];
  return found ? String(found.at).slice(0, 10) : '';
}
