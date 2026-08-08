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

  The five other kinds in the schema — `early-release`, `grades-due`, `conference`, `meeting`,
  `trip`, `reminder` — are WO-6.1's, and this file is deliberately incurious about them: they sit in
  the same array, coveringEvent() ignores them, and nothing here filters them out of the document.
  An event kind this app does not yet author is not an event this app may quietly drop.
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
];

export function kindInfo(kind) {
  return KINDS.filter((k) => k.kind === kind)[0] || null;
}

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
  THE FULL EIGHT-FIELD SHAPE, written out once. docs/data-model.md's entry is
  `id · date · endDate · kind · title · classIds · studentId · notes`, and all eight are written
  rather than only the ones this work order fills: an event this build creates and an event WO-6.1
  creates should be the same shape, so that the calendar screen does not have to ask which build
  wrote a row.

  `classIds` is copied rather than referenced — a caller handing in the array it is also holding
  would otherwise be able to change an event after it was stored, from outside any update().
*/
export function newEvent(kind, date, endDate, title, classIds) {
  const from = isDate(date) ? date : '';
  const to = isDate(endDate) && endDate > from ? endDate : from;
  return {
    id: newId('e'),
    date: from,
    endDate: to,
    kind: kind,
    title: String(title == null ? '' : title).trim(),
    classIds: (classIds || []).slice(),
    studentId: '',
    notes: '',
  };
}

export function addEvent(d, event) {
  listIn(d).push(event);
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

/* The two kinds this build authors, in date order, for the panel that lists them. Sorted on a copy:
   the array in the document is the order things were written in, and a reader that sorts in place
   would reorder the year document as a side effect of drawing a list. */
export function exceptionsIn(doc) {
  return eventsIn(doc)
    .filter((e) => e && (e.kind === NO_SCHOOL || e.kind === DROPPED) && isDate(e.date))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
