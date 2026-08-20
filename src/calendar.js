/*
  Calendar events — the things a teacher knows in advance, and the two kinds of them that
  attendance READS.

  This module is the MODEL only. It holds no DOM, reads no clock, and never calls the store: every
  function here takes the live year document and mutates it, or takes a document and reads it. The
  same posture src/passes.js takes, and for the same reason — the screen that authors an event
  (src/days-off.js) owns the dialog and the src/store.js update() that wraps these calls, and the
  screen that reads one (src/attendance.js) never writes at all. A model with no store in it cannot
  be talked into a second write on a path that was only supposed to look.

  ── THE ONE RULE THIS FILE EXISTS TO ENFORCE ──

  A CALENDAR EXCEPTION IS READ, NEVER COPIED INTO AN ATTENDANCE RECORD. Nothing in this file
  touches `doc.attendance`; nothing in src/days-off.js does either. Delete the holiday and every
  class follows automatically, because there was never a copy to go and find.

  Copying is the obvious implementation — write a `{ classId, date, exception: "no school" }` for
  every class on every date of the break and the marking screen needs no changes at all. It is also
  the one thing plans/rotating-schedule.md and docs/data-model.md § "Events: only what can't be
  derived" both forbid by name, because it creates a second source of truth and the one the teacher
  isn't looking at is the wrong one: shorten the break by a day and five stale records survive it,
  each one saying a class did not meet on a day it did.

  ── A RANGE IS ONE EVENT ──

  `endDate` is already in the schema (docs/data-model.md), so "Thanksgiving break, the 26th to the
  28th" is ONE entry and not three. Three would be three things to delete, three things to get out
  of step with each other, and three rows in a list that says one thing.

  `endDate` is WRITTEN EVEN ON A ONE-DAY EVENT, equal to `date`. One shape means one comparison —
  `date <= on && on <= endDate` — rather than a covering test that has to decide what an absent
  field meant. coversDate() still tolerates a missing one, because a hand-edited or restored
  document is a real thing (src/store.js:108-110, src/attendance.js's own bare-string tolerance),
  and it reads it as a single day, which is the only thing it could honestly mean.

  ── TWO KINDS, AND `classIds` IS THE DIFFERENCE BETWEEN THEM ──

  `no-school` is the whole school: nobody meets, so `classIds` is empty and every class is covered.
  `dropped` is a planned drop: an assembly moves Thursday's rotation, two classes don't meet, and
  `classIds` names those two. Empty `classIds` means school-wide on EITHER kind — that is the data
  model's rule and this file honours it — but the authoring surface refuses to write a `dropped`
  event with nothing named, because a school-wide drop is a `no-school` day said in a second way.

  The six other kinds in the schema — `early-release`, `grades-due`, `conference`, `meeting`,
  `trip`, `reminder` — arrived at WO-6.1, and this file is still incurious about them where
  ATTENDANCE is concerned: they sit in the same array, coveringEvent() ignores them, and nothing
  here filters them out of the document. An event kind this app does not yet author is not an event
  this app may quietly drop. What WO-6.1 added is the other half — the words for them, the rules
  that refuse a bad one, the series label, and the lead time — and all of it below.

  ── THE RULES LIVE HERE NOW, NOT ON A SCREEN (WO-6.1) ──

  Until this work order every rule protecting `doc.events` lived in `createFromForm()` in
  src/days-off.js: the date must parse, an end date may not precede its start, and a `dropped`
  event naming no class is refused. This file enforced none of them — newEvent() would build a
  class-less `dropped` and addEvent() would store it — and that was survivable only while there was
  exactly one door onto the array. WO-6.1 opens the second one (src/events.js), so the rules came
  down here FIRST, and both forms call eventFault(). One mechanism lifted twice is one mistake
  living in two places; the WO-2.25 move, made before the second caller existed rather than after.

  The fourth rule — a range covering meetings that were really taught raises a warning rather than
  committing — is HALF here and says so at clashingMeetings() below. The half that is a rule (which
  of those meetings this event actually covers) is here; the half that reads the attendance ledger
  stays with the caller, because src/attendance.js imports this file and a model that imported it
  back would close the import loop this repo has now refused six times.

  ── A SERIES IS A LABEL ON INSTANCES THAT ALREADY EXIST ──

  "Repeat weekly until 2026-12-19" MATERIALIZES: N flat entries, each a whole event, no recurrence
  rule stored anywhere and no RRULE. Move one and only that one moves; edit one and there is no
  rule to reason about an exception to. `seriesId` is not that rule sneaking back in — it stores
  nothing about the recurrence and nothing recomputes anything from it. It exists so that "delete
  the whole series" is possible, and the alternative it replaces is matching on title and kind,
  which deletes the second *Faculty meeting* the teacher typed by hand.

  ── AND WHAT THIS FILE STILL DOES NOT KNOW ──

  NOTHING HERE KNOWS WHICH CLASSES ARE EXPECTED TO MEET ON A DATE, and the recurrence is where that
  temptation arrives: a weekly repeat that skipped the days a class does not meet would be a cycle
  model, reached from the convenience side. plans/rotating-schedule.md is the settled decision
  record. Every seventh day gets an entry, including the ones the school is closed on, and the
  teacher deletes the one she does not want — which is one tap against a model that has to be
  correct forever.
*/

import { newId } from './store.js';

/* The two kinds attendance reads, as constants rather than as string literals at each use site —
   the same rule src/attendance.js's PRESENT follows, so that the value and the rule about it
   cannot drift apart. The strings are docs/data-model.md's own. */
export const NO_SCHOOL = 'no-school';
export const DROPPED = 'dropped';

/*
  What each kind is CALLED, in the three voices this app already uses for a code:

    `word`   the chip above a column, which has 72px and two lines to say it in
    `said`   the same fact in a sentence, for an announcement or a state line
    `lead`   what the authoring form calls it, in the teacher's own terms

  "Planned drop" rather than "Didn't meet" is the deliberate half. The outcome is identical to a
  same-day drop, so a shared word would be defensible — but the two have different undos, and the
  undo is the thing a teacher is looking for when she reads that chip. "Didn't meet" is taken back
  with the ↩ in the column head; "Planned drop" is taken back by deleting the event, on a screen
  she has to be told exists. Naming them apart is how she finds out which one she is looking at.
*/
export const KINDS = [
  { kind: NO_SCHOOL, word: 'No school', said: 'no school',
    lead: 'No school — the whole school is off' },
  { kind: DROPPED, word: 'Planned drop', said: 'a planned drop',
    lead: 'A class isn’t meeting — a planned drop' },
  /* WO-6.1's six, in the order docs/data-model.md lists them, which is the order the schema line
     itself is written in. Nothing sorts this table: the panel that draws the pills walks it, and a
     kind that moved rows here would move under a teacher's thumb for no reason she could see. */
  { kind: 'early-release', word: 'Early release', said: 'an early release',
    lead: 'Early release — the day ends early' },
  { kind: 'grades-due', word: 'Grades due', said: 'grades due',
    lead: 'Grades due — the day they have to be in the SIS' },
  { kind: 'conference', word: 'Conference', said: 'a conference',
    lead: 'A conference — a family, a counsellor, a team' },
  { kind: 'meeting', word: 'Meeting', said: 'a meeting',
    lead: 'A meeting — faculty, department, PD' },
  { kind: 'trip', word: 'Trip', said: 'a trip',
    lead: 'A trip — a field trip, or a day the class is away' },
  { kind: 'reminder', word: 'Reminder', said: 'a reminder',
    lead: 'A reminder — anything else worth seeing coming' },
];

export function kindInfo(kind) {
  return KINDS.filter((k) => k.kind === kind)[0] || null;
}

/*
  THE TWO KINDS ATTENDANCE READS, AND THE SIX IT DOES NOT — asked as a question rather than
  restated as a second list at each use site, because that is exactly how coveringEvent() and a
  later reader come to disagree about what an exception is.

  It is also the line between the app's TWO AUTHORING SURFACES, which WO-6.1 kept apart on purpose.
  src/days-off.js writes the two below; src/events.js writes the six above and cannot write these,
  because `commit()` over there stays the one place a day off is written. Two doors onto one array
  is fine — the SIS importer and the roster editor have written the same student fields since
  WO-1.23 — and two WRITERS of one rule is not, which is what the fault check above prevents.
*/
export function isAttendanceKind(kind) { return kind === NO_SCHOOL || kind === DROPPED; }
export function isGeneralKind(kind) { return !!kindInfo(kind) && !isAttendanceKind(kind); }
export function generalKinds() { return KINDS.filter((k) => isGeneralKind(k.kind)); }

/* A document can legitimately arrive without `events` — restored from an older build, or
   hand-edited — and a reader that checks before it iterates is a reader that will not eventually
   forget. src/store.js:153 puts the array in every new document; this is the other half. */
export function eventsIn(doc) {
  return doc && Array.isArray(doc.events) ? doc.events : [];
}

function listIn(d) {
  if (!Array.isArray(d.events)) d.events = [];
  return d.events;
}

/* ISO dates only, and compared as STRINGS. `2026-11-26` sorts and compares correctly as text for
   every date this app will ever hold, which is why no Date object appears in this file at all —
   `new Date('2026-11-26')` is UTC midnight and one timezone away from being yesterday, and that
   trap has already been paid for twice in src/attendance.js. */
const ISO = /^\d{4}-\d{2}-\d{2}$/;
export function isDate(value) { return ISO.test(String(value || '')); }

/*
  ────────────────────────── THE THREE RULES, IN ONE PLACE ──────────────────────────

  What cannot be true of an event, asked of the values a form is holding rather than of a record
  that has already been built — which is the only place the second and third rules are still
  ASKABLE. newEvent() coerces: an unreadable date becomes '' and an end date before its start
  becomes the start, so by the time there is a record to inspect, two of these three faults have
  been quietly tidied into something plausible. A validator that ran on the record would pass every
  time and mean nothing.

  It returns the fault or null, never a boolean: the caller needs the sentence to show and the
  field to put the caret back in, and a second copy of either — one per surface — is the thing this
  lift exists to prevent. The words are generalised out of src/days-off.js's own, which said
  "break" where this now says "something that runs over several days": that file authors holidays
  and this rule now also refuses a conference typed backwards.

  A `kind` this build does not know is NOT a fault. A document restored from a later build can hold
  one, and refusing to let a teacher fix its dates would be this file deciding that an event it
  cannot name is an event nobody may touch.
*/
export function eventFault(kind, date, endDate, classIds) {
  const from = String(date == null ? '' : date);
  const to = String(endDate == null ? '' : endDate);
  if (!isDate(from)) {
    return { field: 'from', code: 'no-start',
      message: 'Pick the date it starts. A single day just needs that one — the second date is '
        + 'for something that runs over several.' };
  }
  if (to && !isDate(to)) {
    return { field: 'to', code: 'bad-end', message: 'That end date did not read as a date.' };
  }
  if (to && to < from) {
    return { field: 'to', code: 'ends-first',
      message: 'It ends before it starts. Swap the two dates, or clear the second one if it is a '
        + 'single day.' };
  }
  if (kind === DROPPED && !(classIds || []).length) {
    return { field: 'classes', code: 'drop-names-nobody',
      message: 'Choose which classes are not meeting. A drop that names nobody would close the '
        + 'whole school, which is what the other kind is for.' };
  }
  return null;
}

/*
  THE FULL NINE-FIELD SHAPE, written out once. docs/data-model.md's entry is
  `id · date · endDate · kind · title · classIds · studentId · notes · seriesId`, and all nine are
  written rather than only the ones a given caller fills: an event src/days-off.js creates and an
  event src/events.js creates are the same shape, so that the calendar screen does not have to ask
  which surface wrote a row. (It was eight until WO-6.1; `seriesId` is the ninth.)

  IT RETURNS null RATHER THAN A PLAUSIBLE RECORD when the draft faults, which is the acceptance
  line: the refusal is the model's, and it happens with no screen module anywhere in the call
  stack. The coercion below still runs for the things that are TOLERANCE rather than fault — an
  empty `endDate` means a single day, and is written equal to `date` because one shape means one
  comparison.

  `classIds` is copied rather than referenced — a caller handing in the array it is also holding
  would otherwise be able to change an event after it was stored, from outside any update().

  `extra` carries the three fields no caller had until WO-6.1: `studentId` (this is its first
  writer anywhere in the app), `notes`, and `seriesId`. It is an optional trailing argument rather
  than a rewrite of the signature into an options bag, so that src/days-off.js's call — which wants
  none of the three — reads exactly as it did before this work order.
*/
export function newEvent(kind, date, endDate, title, classIds, extra) {
  if (eventFault(kind, date, endDate, classIds)) return null;
  const from = date;
  const to = isDate(endDate) && endDate > from ? endDate : from;
  const more = extra || {};
  return {
    id: newId('e'),
    date: from,
    endDate: to,
    kind: kind,
    title: String(title == null ? '' : title).trim(),
    classIds: (classIds || []).slice(),
    studentId: String(more.studentId == null ? '' : more.studentId),
    notes: String(more.notes == null ? '' : more.notes).trim(),
    seriesId: String(more.seriesId == null ? '' : more.seriesId),
  };
}

/*
  AND THE STORE REFUSES TOO, which is belt and braces on purpose. newEvent() is the only builder in
  the app, so a faulting record cannot ordinarily reach here — but `addEvent` is exported, a
  document can be hand-edited, and the one thing this array must never hold is a class-less
  `dropped`, which the data model reads as school-wide and which would close a school nobody closed.
  Refusing here costs one call and closes the gap between "nothing builds one" and "nothing can
  store one".
*/
export function addEvent(d, event) {
  if (!event || eventFault(event.kind, event.date, event.endDate, event.classIds)) return null;
  listIn(d).push(event);
  return event;
}

/*
  EDITING ONE IN PLACE. The same three rules, asked of the values that would result rather than of
  the ones being handed in — a teacher who moves only the end date is still handing in an end date
  that has to sit after a start she did not touch.

  The id, the kind and the series label are NOT editable through here. The id is the document's
  own; a kind change would move an event between the two authoring surfaces and is a delete and a
  re-add said confusingly; and `seriesId` is a label this file writes and nothing else may set,
  because a hand-set one is how two unrelated events come to be deleted together.
*/
export function updateEvent(d, id, changes) {
  const event = findEvent(d, id);
  if (!event || !changes) return null;
  const has = (k) => Object.prototype.hasOwnProperty.call(changes, k);
  const date = has('date') ? changes.date : event.date;
  const endDate = has('endDate') ? changes.endDate : event.endDate;
  const classIds = has('classIds') ? (changes.classIds || []).slice() : event.classIds;
  if (eventFault(event.kind, date, endDate, classIds)) return null;

  event.date = date;
  event.endDate = isDate(endDate) && endDate > date ? endDate : date;
  event.classIds = classIds;
  if (has('title')) event.title = String(changes.title == null ? '' : changes.title).trim();
  if (has('studentId')) event.studentId = String(changes.studentId == null ? '' : changes.studentId);
  if (has('notes')) event.notes = String(changes.notes == null ? '' : changes.notes).trim();
  return event;
}

/*
  And out again — the whole of "delete the holiday and every class follows automatically". There is
  nothing else to undo, because nothing else was written: no attendance record was created by
  authoring this, so none has to be found and unpicked now. That is the entire payoff of the rule at
  the top of this file, and it is one line of code.
*/
export function removeEvent(d, id) {
  const before = listIn(d).length;
  d.events = listIn(d).filter((e) => !(e && e.id === id));
  return d.events.length < before;
}

export function findEvent(doc, id) {
  return eventsIn(doc).filter((e) => e && e.id === id)[0] || null;
}

/* Does this event's range contain that date. An event with no readable `date` covers nothing —
   which is what keeps a half-written or foreign row from silently swallowing a term. */
export function coversDate(event, date) {
  if (!event || !isDate(event.date) || !isDate(date)) return false;
  const to = isDate(event.endDate) && event.endDate > event.date ? event.endDate : event.date;
  return date >= event.date && date <= to;
}

/* Empty `classIds` means school-wide — docs/data-model.md's own rule, and the reason a holiday is
   one entry rather than one per class. A named list covers exactly what it names, so a class
   created after the event was written is not retroactively dropped by it. */
export function coversClass(event, classId) {
  if (!event) return false;
  const ids = Array.isArray(event.classIds) ? event.classIds : [];
  return ids.length === 0 || ids.indexOf(classId) >= 0;
}

/*
  THE ONE QUESTION src/attendance.js ASKS THIS FILE: is there an exception on the calendar covering
  this class on this date, and if so which one — because the work order wants the REASON on screen
  and the reason is the event the teacher typed.

  TWO EVENTS CAN COVER ONE DATE, and the answer is stable rather than incidental: a `no-school` wins
  over a `dropped`, whichever order they sit in the document. Pre-dropping Thursday for an assembly
  and then closing the school for snow is an ordinary sequence, and "No school" is the truer of the
  two sentences on that day. Between two of the same kind the first in document order wins, which is
  the rule src/attendance.js's recordFor() already applies to a duplicate record: a second one is
  inert rather than a second truth that takes turns being visible.
*/
export function coveringEvent(doc, classId, date) {
  const covering = eventsIn(doc).filter((e) =>
    e && (e.kind === NO_SCHOOL || e.kind === DROPPED)
    && coversDate(e, date) && coversClass(e, classId));
  return covering.filter((e) => e.kind === NO_SCHOOL)[0] || covering[0] || null;
}

/* The two kinds attendance reads, in date order, for the panel that lists them. Sorted on a copy:
   the array in the document is the order things were written in, and a reader that sorts in place
   would reorder the year document as a side effect of drawing a list. */
export function exceptionsIn(doc) {
  return eventsIn(doc)
    .filter((e) => e && (e.kind === NO_SCHOOL || e.kind === DROPPED) && isDate(e.date))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/* And the six it does not, the same way, for src/events.js's own list. The two functions are
   deliberately complementary rather than one function with a filter argument: each panel lists
   exactly what it can remove, and a Remove beside a row a screen cannot author is a mis-tap
   waiting to be reported as data loss (src/days-off.js's paintList() says the same from its side).

   An event of a kind THIS BUILD DOES NOT KNOW — restored from a later one — lands here rather than
   nowhere. It is not an exception, so attendance is right to ignore it, and a row a teacher can see
   and delete is better than a row nothing in the app will ever show her again. */
export function generalEventsIn(doc) {
  return eventsIn(doc)
    .filter((e) => e && !isAttendanceKind(e.kind) && isDate(e.date))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/*
  WHICH ALREADY-RECORDED MEETINGS THIS EVENT WOULD COVER — the rule half of the fourth thing
  protecting `doc.events`, and the reason it is only the rule half is worth writing down.

  plans/rotating-schedule.md § Precedence: a day with attendance actually recorded stays a meeting
  even if an exception is laid over it later, so src/days-off.js warns and writes nothing until the
  teacher has read what stays. Deciding WHICH meetings are at issue is a fact about the event —
  its range and its `classIds` — and belongs here with the other rules. READING the ledger does
  not: src/attendance.js imports this file, so importing it back would close the import loop this
  repo has refused six times (src/shell.js's header keeps the tally). So the caller reads the
  meetings and hands them in, and this answers which of them the event covers — the same posture
  WO-4.1 gives a signal rule, which is handed its own measured numbers and never the document.
*/
export function clashingMeetings(event, meetings) {
  if (!event) return [];
  return (meetings || []).filter((m) => m && coversDate(event, m.date) && coversClass(event, m.classId));
}

/* ────────────────────────────── a materialized series ────────────────────────────── */

/* Weekly, and weekly only. "Repeat weekly until 2026-12-19" is the phrase the work order names and
   the one thing a teacher asks for; a second interval is a second control on a form that already
   has nine, and it can be added the day somebody wants it without changing a stored byte, because
   NOTHING ABOUT THE RECURRENCE IS STORED. */
export const SERIES_STEP_DAYS = 7;
/* A ceiling, so that a mistyped year cannot materialize four thousand rows into the document and a
   teacher's only way out is deleting them. 60 weekly instances is fourteen months — longer than
   any school year this app holds — so the cap can only ever be hit by a wrong `until`. */
export const MAX_SERIES = 60;

/*
  N DAYS ON FROM AN ISO DATE, and the ONE place this file touches a Date at all — the header says
  no Date object appears here and this is the stated departure rather than a lapse.

  It is safe because it never leaves UTC. `Date.UTC(y, m-1, d)` is an exact instant built from
  three numbers, adding a whole number of days to it cannot land on a DST seam because UTC has
  none, and the `getUTC*` triple reads the same three numbers back. What the header forbids is
  `new Date('2026-11-26')` — a UTC midnight then read through the LOCAL clock, which is one
  timezone away from being the day before, and which has already cost src/attendance.js twice.
  Parsing and formatting on the same side of that line is the whole of the difference.

  EXPORTED SINCE WO-6.3, AND THAT IS THIS FILE COLLECTING ON A NOTE SOMEBODY ELSE LEFT. It was
  private, and src/calendar-derived.js carried an eight-line copy of it under a comment saying so:
  *"Not imported from src/calendar.js because that file does not export it, and this is eight lines
  against widening that module's surface for one caller. If a third file ever needs a day-step, that
  is the moment it earns an export and both callers take it."* WO-6.3's month grid is the third
  caller, so the export happens here and the copy over there is gone. Two functions stepping a day
  are two functions that can disagree about a DST seam, and this one is the one with the scar on it.
*/
const DAY_MS = 86400000;
function utcOf(iso) {
  const p = String(iso).split('-');
  return Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}
export function shiftDays(iso, days) {
  const at = new Date(utcOf(iso) + days * DAY_MS);
  const pad = (n) => (n < 10 ? '0' : '') + n;
  return at.getUTCFullYear() + '-' + pad(at.getUTCMonth() + 1) + '-' + pad(at.getUTCDate());
}

/* WHICH DAY OF THE WEEK AN ISO DATE IS — 0 for Sunday, 6 for Saturday, and −1 for anything this
   file cannot read as a date. WO-6.3's month grid needs it to know which column a month starts in;
   nothing else in the app has ever asked.

   It rides on utcOf() above for the reason that block gives at length: `getUTCDay()` on an instant
   built from three numbers is the same weekday everywhere on earth, where `new Date(iso).getDay()`
   is one timezone away from being yesterday's. A grid whose first column shifted by a timezone
   would draw the whole month one cell out, which is the kind of wrong that looks like a layout bug
   and is a date bug.

   IT ANSWERS NOTHING ABOUT WHETHER A CLASS MEETS. This is arithmetic on a string; the model that
   plans/rotating-schedule.md removed is the one that maps a weekday to a class, and nothing here
   or anywhere downstream of it does that. */
export function weekdayOf(iso) {
  if (!isDate(iso)) return -1;
  return new Date(utcOf(iso)).getUTCDay();
}

/* The three rules plus the two a repeat adds. Same shape and same contract as eventFault(): the
   fault or null, with the field to put the caret back in. */
export function seriesFault(kind, date, endDate, classIds, until) {
  const fault = eventFault(kind, date, endDate, classIds);
  if (fault) return fault;
  if (!isDate(until)) {
    return { field: 'until', code: 'no-until',
      message: 'Pick the date the repeat stops on, or clear the repeat to add a single entry.' };
  }
  if (until < date) {
    return { field: 'until', code: 'until-first',
      message: 'The repeat stops before the first one happens. Move that date later, or clear it.' };
  }
  const n = Math.floor((utcOf(until) - utcOf(date)) / (SERIES_STEP_DAYS * DAY_MS)) + 1;
  if (n > MAX_SERIES) {
    return { field: 'until', code: 'too-many',
      message: 'That repeats ' + n + ' times, which is more than a school year holds. Bring the '
        + 'last date closer — Planbook stops at ' + MAX_SERIES + '.' };
  }
  return null;
}

/*
  MATERIALIZED, not stored as a rule. Every instance below is a whole event with its own id, its
  own dates and its own everything else; there is no repeat rule in the document, nothing recomputes
  a date from one, and moving the third Tuesday moves the third Tuesday. That is the deliverable in
  one paragraph, and RRULE is V2 if ever.

  The range travels with each instance: a two-day conference repeated weekly is two days every
  week, because both dates shift by the same seven.

  IT SKIPS NOTHING. A repeat that stepped over the days a class does not meet would need to know
  which classes meet when — the cycle model plans/rotating-schedule.md removed on the day it was
  designed, arriving from the convenience side where it looks new. So the holiday in the middle of
  the run gets its instance like every other week, and the teacher deletes that one row.
*/
export function newSeries(kind, date, endDate, title, classIds, extra, until) {
  if (seriesFault(kind, date, endDate, classIds, until)) return null;
  const seriesId = newId('es');
  const out = [];
  for (let i = 0; i < MAX_SERIES; i++) {
    const from = shiftDays(date, i * SERIES_STEP_DAYS);
    if (from > until) break;
    const to = isDate(endDate) && endDate > date
      ? shiftDays(endDate, i * SERIES_STEP_DAYS) : from;
    const one = newEvent(kind, from, to, title, classIds,
      Object.assign({}, extra || {}, { seriesId: seriesId }));
    if (one) out.push(one);
  }
  return out;
}

/* Every instance carrying a label, in date order. An empty label matches nothing — every event
   this app has ever written carries `seriesId: ''` when it is not in a series, so a bare truth
   test here would answer "all of them". */
export function seriesIn(doc, seriesId) {
  if (!seriesId) return [];
  return generalEventsIn(doc).filter((e) => e.seriesId === seriesId);
}

/* And out again, all of them, which is the whole of "delete the series without deleting each
   instance by hand". Returns how many went, because the sentence a teacher hears afterwards is a
   count and the caller must not have to count them itself before and after. */
export function removeSeries(d, seriesId) {
  if (!seriesId) return 0;
  const before = listIn(d).length;
  d.events = listIn(d).filter((e) => !(e && e.seriesId === seriesId));
  return before - d.events.length;
}

/* ────────────────────────────── the grades-due lead time ────────────────────────────── */

/*
  HOW MANY DAYS AHEAD A GRADES-DUE DATE STARTS ASKING. Re-keying a term of grades into the SIS is a
  scheduled job rather than something you remember, so the date wants to be visible before it
  arrives — and WHERE it becomes visible is WO-6.4's *Deadlines closing in* panel on the glance
  page, not a banner of this file's own. One fact, one warning surface; a second one is the answer
  this repo keeps refusing.

  IT IS IN THE DOCUMENT AND NOT UNDER `planbook_`. docs/data-model.md § Signal thresholds carries
  the reasoning and this follows it exactly: it is the teacher's setting, not this browser's, and it
  has to survive a device change and travel with the year.

  AND AN ABSENT KEY IS ITS DEFAULT, which is the WO-4.1 rule applied to a second setting rather
  than a coincidence of shape. Every document written before this work order is missing the key, so
  a reader has to answer for a missing one anyway — and a default re-tuned in a later build then
  reaches a teacher who never opened the field, instead of pinning her to a number she never chose.
  Read it through leadDaysOf(), never off `doc.calendar`.

  Three days, because grades go in once or twice a week (CLAUDE.md § Working agreements) and three
  days is the shortest warning that always covers a weekend.
*/
export const DEFAULT_LEAD_DAYS = 3;

function settingsIn(doc) {
  return doc && doc.calendar && typeof doc.calendar === 'object' && !Array.isArray(doc.calendar)
    ? doc.calendar : {};
}

/* No repair and no write-back, the posture src/signals.js's thresholdOf() states in full: a
   document holding `"three"` reads as 3 here and stays `"three"` on disk until a teacher types a
   number into the field. A value that silently isn't what somebody typed is worse than one that is
   visibly wrong. */
export function leadDaysOf(doc) {
  const block = settingsIn(doc);
  if (Object.prototype.hasOwnProperty.call(block, 'gradesDueLeadDays')) {
    const n = Number(block.gradesDueLeadDays);
    if (Number.isFinite(n)) return n;
  }
  return DEFAULT_LEAD_DAYS;
}

/* The one writer. It refuses anything that is not a finite number — a field mid-way through a
   number reports '' and `Number('')` is 0, which is a real answer (warn on the day itself) and not
   a NaN in the year document. The block is created empty if a restored or hand-edited document
   arrived without it, the way src/signal-settings.js does for `signals`. */
export function setLeadDays(d, days) {
  const n = Number(days);
  if (!Number.isFinite(n)) return false;
  if (!d.calendar || typeof d.calendar !== 'object' || Array.isArray(d.calendar)) d.calendar = {};
  d.calendar.gradesDueLeadDays = n;
  return true;
}
