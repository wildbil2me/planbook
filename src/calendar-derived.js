/*
  The derived half of the calendar — everything the month grid shows that the teacher never typed
  into `doc.events`.

  ── WHY THIS IS A READ AND NOT A WRITE ──

  Assignment due dates, term boundaries, which classes met, and IEP/504 review dates are all
  ALREADY IN THE DOCUMENT. Copying any of them into `events[]` so the grid has one array to draw
  would create the second truth docs/data-model.md § "Events: only what can't be derived" and
  plans/work-orders/phase-6-calendar-glance.md's phase header both forbid: move an assignment's due
  date and the calendar would still be showing the old day, correctly by its own lights, until
  something remembered to go and fix the copy. So this file COMPUTES, every time it is asked, and
  it has no writer in it at all.

  THAT IS STRUCTURAL RATHER THAN PROMISED. Nothing here imports `update` from src/store.js, and
  nothing imports addEvent(), updateEvent(), removeEvent() or removeSeries() from src/calendar.js —
  the four functions that can change `doc.events`. Every import below is a reader. A function added
  here that needed one of them would be a function that belongs in a different file.

  ── AND THE ONE THING THIS FILE MUST NEVER LEARN ──

  NOTHING HERE KNOWS WHICH CLASSES ARE EXPECTED TO MEET ON A DATE, and a month grid is the exact
  surface that makes that look necessary. plans/rotating-schedule.md is the settled decision record:
  a cycle model was designed and removed on the same day, because the schedule rotates AND changes
  at random, so a second source of truth about which classes meet has to be corrected by hand
  anyway.

  The temptation arrives from the RENDERING side, which is why it will look new. src/attendance.js's
  stateOf() has four answers and only three of them are facts about the class: NOT_TAKEN is the
  did-I-forget state, which is exactly right on a home screen asking about TODAY and is a wall of
  amber on a grid asking about twenty weekdays across five classes. The obvious way to quiet that
  wall is to know which classes were meant to meet. The fix is the other one:

    · This file NEVER ENUMERATES WEEKDAYS. meetingStatesIn() below walks the attendance ledger and
      the classes an authored `dropped` event NAMES — never a calendar. A date nothing was recorded
      on and nothing was authored over produces no row, so it is blank rather than not-taken-yet.
    · NOT_TAKEN is filtered out even so, belt and braces, the way src/calendar.js's addEvent()
      refuses a record newEvent() could not have built.
    · A school-wide covering event names nobody, so it produces no per-class row either — see
      meetingStatesIn() for why that is the honest answer rather than a gap.

  If a distinction is ever wanted for days the school is not in session, WO-2.50's precedent is the
  one to take: a quiet off-term modifier read off the term bounds — which termEdgesIn() below
  already supplies the dates for — and not a schedule.

  ── THE DOCUMENT ARGUMENT MUST BE THE OPEN ONE ──

  Everything here takes the year document, as a read side should. The MEETING half cannot be a pure
  read of it: "what happened to this class on this date" is src/attendance.js's answer and has been
  since WO-2.1, and stateOf() resolves against the document the store has open. A second copy of
  that four-rung precedence in here would agree with itself perfectly and disagree with the marking
  screen the first time a day off was authored — the exact failure the three states exist to
  prevent. So the document handed in is expected to be the open one, which is the posture
  src/signals.js's evaluate() states at length and for the same reason.

  ── AND THE REVIEW DATE, WHICH IS THE SENSITIVE ONE ──

  `supports.reviewDate` shares a record with `medical`, `behaviorPlan`, `plan` and the whole
  accommodations list (src/roster.js's SUPPORT_FIELDS). So reviewDatesIn() below returns A DATE AND
  A STUDENT AND NOTHING ELSE — an object literal built field by field, never a spread of the
  support block and never the block itself — and it returns NOTHING AT ALL while presentation mode
  is on. Suppressed, not redacted: an unlabelled marker on the cell where a review sits still says
  "this student has something on file" to a room of thirty.
*/

/* Five readers and not one writer, which is the claim the header above makes. */
import { isDate, eventsIn, isAttendanceKind, coversDate, coversClass } from './calendar.js';
import { stateOf, coverOf, TAKEN, DID_NOT_MEET, COVERED, NOT_TAKEN } from './attendance.js';
import { termName } from './classes.js';
import { fullName } from './roster.js';
import { supportsVisible, readSupports } from './supports.js';

/*
  THE FOUR ROWS OF THE DELIVERABLE TABLE, AS FIVE TOKENS. A term contributes two dates rather than
  one range — its first day and its last day are two things a teacher looks for on two different
  cells — so it gets two kinds and no `edge` field to branch on.

  NONE OF THESE IS A `KINDS` VALUE in src/calendar.js, and that is deliberate rather than lucky:
  `meeting-state` reads awkwardly beside the authored `meeting`, and it is spelled that way so the
  two can never collide in a `kind` compare or a CSS class. A derived item and an authored event can
  therefore sit in one list and be told apart by `kind` alone — `derived: true` on every record
  below says the same thing a second way, for a renderer that would rather ask one field than
  consult a table.
*/
export const ASSIGNMENT_DUE = 'assignment-due';
export const TERM_START = 'term-start';
export const TERM_END = 'term-end';
export const MEETING_STATE = 'meeting-state';
export const REVIEW_DATE = 'review-date';

/*
  The order two items on the same day come back in, and it is the order the work order tabulates
  them: what is due, then what a term does, then what happened in class, then what is coming up for
  a student. Fixed rather than incidental, because a cell whose chips reshuffle between two renders
  of the same month is a cell a teacher cannot learn to read.
*/
export const DERIVED_KINDS = [ASSIGNMENT_DUE, TERM_START, TERM_END, MEETING_STATE, REVIEW_DATE];

/* src/assignments.js:354's own fallback, so a chip on the grid and the row on the assignment list
   say the same thing about the same unnamed assignment. If that string ever earns a shared helper
   the way termName() has, both call sites take it. */
const UNTITLED = 'Untitled assignment';

/* A hand-edited or restored document can hold an event spanning years, and meetingStatesIn() walks
   an event's range a day at a time. 400 days is longer than any school year this app holds, so the
   cap can only be reached by a range nobody typed on purpose — and the grid draws the first year of
   it rather than looping. */
const MAX_SPAN_DAYS = 400;

/* ────────────────────────────── reading the document ──────────────────────────────

   A document can legitimately arrive without any of these — restored from an older build, or
   hand-edited — and a reader that checks before it iterates is a reader that will not eventually
   forget (src/store.js:108-110, src/calendar.js's eventsIn()). */

function classesIn(doc) { return doc && Array.isArray(doc.classes) ? doc.classes : []; }
function assignmentsIn(doc) { return doc && Array.isArray(doc.assignments) ? doc.assignments : []; }
function attendanceIn(doc) { return doc && Array.isArray(doc.attendance) ? doc.attendance : []; }
function studentsIn(doc) { return doc && Array.isArray(doc.students) ? doc.students : []; }
function termsOf(cls) { return cls && Array.isArray(cls.terms) ? cls.terms : []; }

/*
  THE CLASSES THIS FILE WILL ANSWER ABOUT — the ones that are not archived, which is the same list
  src/classes.js's getActiveClasses() draws the tab bar from. An archived class is one the teacher
  has PUT AWAY: its due dates on the grid would tap through to a screen that is not on the tab bar,
  which is the same argument that keeps an archived class out of the roster editor's class picker.

  Read off the document rather than through getActiveClasses(), which resolves against the open
  document — every other read in this file takes the document it was handed, and one that did not
  would be the one place a foreign document gave a half-right answer.
*/
function liveClassIds(doc) {
  const ids = Object.create(null);
  classesIn(doc).forEach((c) => { if (c && c.id && !c.archived) ids[c.id] = true; });
  return ids;
}

/*
  IS THIS DATE INSIDE THE WINDOW THE CALLER ASKED ABOUT. Both bounds are optional and an absent one
  is unbounded on that side — a month grid passes two, and WO-6.4's glance page may well want
  everything from today onward and nothing after it. An unreadable bound is treated as absent
  rather than as a range nothing can satisfy, which is the tolerance src/classes.js's termIsDated()
  gives a half-typed term: a caller mid-keystroke gets more rows, not an empty grid.

  ISO strings compared as strings, which is src/calendar.js's rule and the reason no Date object
  appears anywhere in this file except the day-step below.
*/
function inWindow(date, from, to) {
  if (!isDate(date)) return false;
  if (isDate(from) && date < from) return false;
  if (isDate(to) && date > to) return false;
  return true;
}

/* `2026-11-26` + n days, in UTC and out again — the one place this file touches a Date, and it is
   safe for the reason src/calendar.js's shiftDays() states in full: Date.UTC() is an exact instant
   built from three numbers, a whole number of days cannot land on a DST seam because UTC has none,
   and the getUTC* triple reads the same three numbers back. What is forbidden is
   `new Date('2026-11-26')` — a UTC midnight read through the LOCAL clock, one timezone away from
   being the day before. Parsing and formatting on the same side of that line is the whole of it.

   Not imported from src/calendar.js because that file does not export it, and this is eight lines
   against widening that module's surface for one caller. If a third file ever needs a day-step,
   that is the moment it earns an export and both callers take it. */
const DAY_MS = 86400000;
function shiftDays(iso, days) {
  const p = String(iso).split('-');
  const at = new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2])) + days * DAY_MS);
  const pad = (n) => (n < 10 ? '0' : '') + n;
  return at.getUTCFullYear() + '-' + pad(at.getUTCMonth() + 1) + '-' + pad(at.getUTCDate());
}

function text(value) { return String(value == null ? '' : value).trim(); }

/* ────────────────────────────── assignment due dates ──────────────────────────────

   docs/data-model.md § Events, row one: read from `assignments[].due`.

   What comes back carries the ids a tap-through needs and nothing more — the assignment, its class
   and its term are what src/assignments.js needs to open the right screen at the right place. The
   scores, the points and the category are not here: an item on a month cell is a door, and a door
   does not need to know what is behind it. */
export function assignmentDuesIn(doc, from, to) {
  const live = liveClassIds(doc);
  return assignmentsIn(doc)
    .filter((a) => a && live[a.classId] && inWindow(a.due, from, to))
    .map((a) => ({
      derived: true,
      kind: ASSIGNMENT_DUE,
      date: a.due,
      classId: a.classId,
      termId: text(a.termId),
      assignmentId: a.id,
      title: text(a.name) || UNTITLED,
    }));
}

/* ────────────────────────────── term boundaries ──────────────────────────────

   Row two: read from `classes[].terms[]`.

   EACH EDGE IS ASKED ABOUT SEPARATELY, and src/classes.js's termIsDated() is deliberately NOT the
   test used here. That function answers "is there a RANGE to read", which is the right question for
   a report that has to be scoped to one; this is two dates, and a term with a start typed and an
   end not yet typed still has a first day a teacher would like to see on the grid. The rule that
   file's header states holds either way: nothing here sorts terms, repairs them, or reads a
   schedule out of them. */
export function termEdgesIn(doc, from, to) {
  const out = [];
  classesIn(doc).forEach((cls) => {
    if (!cls || !cls.id || cls.archived) return;
    termsOf(cls).forEach((term) => {
      if (!term) return;
      const one = (kind, date) => ({
        derived: true,
        kind: kind,
        date: date,
        classId: cls.id,
        termId: text(term.id),
        title: termName(term),
      });
      if (inWindow(term.start, from, to)) out.push(one(TERM_START, term.start));
      if (inWindow(term.end, from, to)) out.push(one(TERM_END, term.end));
    });
  });
  return out;
}

/* ────────────────────────────── which classes met, and which were dropped ─────────────────────

   Row three: read from `attendance[]`, plus the exceptions authored over it.

   ── THE THREE ANSWERS THAT ARE FACTS, AND THE FOURTH THAT IS NOT ──

   stateOf() has four. Three of them are facts about a class on a date: it was TAKEN, it DID_NOT_MEET
   from its own record, or it is COVERED by an authored `no-school` / `dropped` event. The fourth,
   NOT_TAKEN, is not a fact about the class at all — it is the absence of a record, which on a home
   screen asking about today means "did I forget?" and on a month grid means nothing whatsoever. It
   is not carried onto a date by this work order, and the way it is kept out is structural:

     · CANDIDATE PAIRS COME FROM THINGS THAT WERE WRITTEN DOWN. A `{ classId, date }` gets asked
       about only if an attendance record exists for it, or if an authored exception NAMES that
       class on that date. Nothing here iterates weekdays, and nothing here iterates classes against
       a date. There is no loop in this file that a schedule could be the missing input to.
     · AND THE ANSWER IS FILTERED ANYWAY. A NOT_TAKEN cannot come back from a pair chosen that way,
       so the guard below never fires — which is exactly why it is worth its line, the way
       src/calendar.js's addEvent() refuses a record newEvent() could not have built.

   ── A SCHOOL-WIDE EXCEPTION PRODUCES NO PER-CLASS ROW, AND THAT IS THE HONEST ANSWER ──

   `classIds: []` means school-wide (docs/data-model.md), so a `no-school` day covers every class
   there is. Expanding it into one row per class would mean this file reading the class list to
   decide what a date implies about five classes — a hair's breadth from the model
   plans/rotating-schedule.md removed — and it would bury a week's break under twenty-five identical
   chips saying nothing a teacher did not already know from the event itself. The event IS on the
   calendar: it is authored, it is in `doc.events`, and the grid draws it as the entry the teacher
   typed. So the derived layer stays quiet about it and says nothing twice.

   A `dropped` event always names its classes — src/calendar.js's eventFault() refuses one that does
   not — so the only case this rule gives up is the school-wide half of `no-school`.
*/
export function meetingStatesIn(doc, from, to) {
  const live = liveClassIds(doc);
  const out = [];
  const seen = Object.create(null);

  const take = (classId, date) => {
    const key = classId + '|' + date;
    if (seen[key] || !live[classId]) return;
    seen[key] = true;
    const state = stateOf(classId, date);
    /* The guard the block above says never fires. If it ever does, something started asking about
       a pair nobody wrote down, and drawing nothing is the answer that cannot be wrong. */
    if (state === NOT_TAKEN) return;
    const cover = state === COVERED ? coverOf(classId, date) : null;
    out.push({
      derived: true,
      kind: MEETING_STATE,
      date: date,
      classId: classId,
      state: state,
      /* The event that produced a COVERED, so the item taps through to the thing that resolves it.
         The reason lives on the event the teacher typed and is not copied onto this row. */
      eventId: cover && cover.id ? cover.id : '',
    });
  };

  /* The ledger. A record's own `classId` and `date` are the pair; stateOf() decides which of the
     first two rungs it is, and history is protected there rather than here — a retroactive snow day
     laid over a week that was really taught still answers TAKEN. */
  attendanceIn(doc).forEach((r) => {
    if (r && typeof r.classId === 'string' && inWindow(r.date, from, to)) take(r.classId, r.date);
  });

  /* And the exceptions that NAME classes. Every date the event covers, clipped to the window the
     caller asked about, for each class it names — no class it does not name, and no class at all
     when it names none. */
  eventsIn(doc).forEach((event) => {
    if (!event || !isAttendanceKind(event.kind) || !isDate(event.date)) return;
    const named = Array.isArray(event.classIds) ? event.classIds : [];
    if (!named.length) return;
    let date = isDate(from) && from > event.date ? from : event.date;
    for (let i = 0; i < MAX_SPAN_DAYS && coversDate(event, date); i++) {
      if (!inWindow(date, from, to)) break;
      named.forEach((classId) => {
        if (coversClass(event, classId)) take(classId, date);
      });
      date = shiftDays(date, 1);
    }
  });

  return out;
}

/* ────────────────────────────── IEP/504 review dates ──────────────────────────────

   Row four: read from `students[].supports.reviewDate`, and the row that carries every consequence
   if it is got wrong.

   ── WHAT COMES BACK, AND WHAT CANNOT ──

   A DATE AND A STUDENT. `date`, `studentId`, `name`. There is no `plan`, no accommodation, no
   medical text, no behavior-plan text, no case manager and no support block anywhere in the record
   below, and the record is written field by field precisely so that none of them can arrive by
   accident: a spread of the support block, or a convenience handle on it for the renderer, would
   put all six on a month cell one careless JSON.stringify later. readSupports() is used rather than
   supportsOf() for the second half of the same care — supportsOf() REPAIRS the block in place, and
   a read side that writes into a student record while drawing a calendar is exactly the thing this
   whole work order says it is not.

   ── AND IT IS GONE ENTIRELY IN PRESENTATION MODE ──

   Not redacted, not an unlabelled dot, not a chip that says "review". A marker on the cell where a
   review sits is still a disclosure: it says this student has something on file, to whatever room
   the screen is being projected into, which is the disclosure docs/data-model.md § Accommodations
   rule 1 exists to prevent. So the list is EMPTY while the mode is on, and a grid drawing this list
   inherits the suppression without its author having heard of it — which is what supportsVisible()
   is for, and why there is no second copy of that test in this file.

   The name stays when the mode is OFF, and that is the work order's own ruling: the calendar is a
   surface a teacher opened on purpose, and it discloses strictly less than the roster dot that has
   shipped since WO-1.7. WO-6.4's glance page reads differently — a COUNT, no name — and says why in
   its own fifth box.
*/
export function reviewDatesIn(doc, from, to) {
  if (!supportsVisible()) return [];
  const out = [];
  studentsIn(doc).forEach((student) => {
    if (!student || !student.id) return;
    const block = readSupports(student);
    const on = block && typeof block.reviewDate === 'string' ? block.reviewDate : '';
    if (!inWindow(on, from, to)) return;
    out.push({
      derived: true,
      kind: REVIEW_DATE,
      /* A review belongs to a student and not to a class, so there is no `classId` to filter on.
         What a class filter should do with one of these is WO-6.3's decision, and resolving it
         through the roster is a read this file deliberately does not make on its behalf. */
      classId: '',
      date: on,
      studentId: student.id,
      name: fullName(student),
    });
  });
  return out;
}

/* ────────────────────────────── all four, in one list ──────────────────────────────

   What a month grid asks for, sorted the way a cell has to draw it: by date, then by the order
   DERIVED_KINDS names, then by the order the document holds them in — Array.prototype.sort is
   stable, so two assignments due the same day come back in the order the assignment list shows
   them rather than in an order that changes between renders.

   Sorted on an array this function BUILT. Nothing here sorts `doc.assignments`, `doc.events` or
   `doc.attendance` in place, which is the trap src/calendar.js's exceptionsIn() names: a reader
   that sorted the document as a side effect of drawing a list would be a writer with a read's name
   on it. */
export function derivedItemsIn(doc, from, to) {
  const all = [].concat(
    assignmentDuesIn(doc, from, to),
    termEdgesIn(doc, from, to),
    meetingStatesIn(doc, from, to),
    reviewDatesIn(doc, from, to));
  const rank = (item) => {
    const at = DERIVED_KINDS.indexOf(item.kind);
    return at < 0 ? DERIVED_KINDS.length : at;
  };
  return all.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return rank(a) - rank(b);
  });
}

/* Is this thing one of ours — the question a list holding authored events AND derived items has to
   answer before it decides which of the two a tap should open. Asked of the flag rather than of the
   `kind`, so a renderer never grows its own copy of the five tokens. */
export function isDerived(item) {
  return !!item && item.derived === true && DERIVED_KINDS.indexOf(item.kind) >= 0;
}

/* The three answers meetingStatesIn() can carry, re-exported under this file's own name so a screen
   drawing them imports one module rather than two. The VALUES are src/attendance.js's — they are
   the CSS classes the marking grid already wears — and re-exporting rather than re-declaring is
   what keeps them from becoming a second opinion about what `covered` means. */
export { TAKEN, DID_NOT_MEET, COVERED };
