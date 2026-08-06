/*
  Attendance — the marking screen, and the one predicate that says what happened to a class on a
  date.

  THIS IS THE FLOW THAT RUNS WHILE STUDENTS WALK IN. It is the one thing the owner does every
  single period, on an iPad, standing up, and it is measured in seconds. Every decision below that
  looks like an omission is a decision about that clock.

  ── THE THREE STATES, AND WHY THERE IS NO SCHEDULE TO ASK ──

  plans/rotating-schedule.md is the decision record and it is settled: there is no schedule object,
  no cycle, no rotation, no meeting pattern. A class met if it has an attendance record with no
  `exception`. So a class on a date is in exactly one of three states, and stateOf() below is the
  only place in the app that decides which:

    no record at all              → NOT TAKEN YET   "did I forget?"
    a record with no `exception`  → TAKEN           the class met; this is a meeting and it counts
    a record with an `exception`  → DID NOT MEET    dropped; it counts toward nothing

  The third is not the second, and the difference is the single most useful thing the home screen
  can tell a teacher. Every later phase reads through stateOf() rather than testing `exception`
  itself: WO-2.3 adds calendar events to the answer (a `no-school` range covering the date), and it
  adds them HERE, in one function, or the app grows a second opinion about whether a class met.

  ── EXCEPTIONS ONLY. PRESENT IS THE ABSENCE OF A MARK ──

  `marks` holds T / A / E / D and nothing else. A class of 25 with two absences is two entries in
  the year document, not 25 — docs/data-model.md says so, and it is also why marking is fast.
  Storing `P` would pass every acceptance test this work order has, quietly triple the size of the
  document, and only show up as a problem in Phase 7 when it is being pushed through Drive. The
  guard is in setMark(): `P` DELETES, it never writes. If you find yourself adding a code to the
  stored set, that is the line to read first.

  The five letters and their words are Roll Call!'s — P present, T tardy, A absent, E event,
  D dismissed — because the owner reads both apps this year and her fingers already know them.
  docs/data-model.md describes E in prose as an excused absence, which is what an `E` means for the
  percentage in WO-2.4; the word on the button is Roll Call!'s "Event", because that is the word
  she is used to tapping.

  ── THERE IS NO SUBMIT, AND THERE IS NO DRAFT ──

  A tap writes. src/store.js debounces the write into one save 800ms later and the chip in the
  corner says so, but the change is in the document the instant the finger lifts. There is no
  "Save attendance", no "Finalize", no pending-edits buffer, and there must never be one: the
  teacher is interrupted mid-class every day of the week — a phone call, a nurse, a fire drill —
  and a screen that loses what she tapped because she never reached the bottom of it is a screen
  she stops trusting in week two. The ✕ in the corner closes a screen; it does not commit anything.

  Two consequences worth naming, because both look like bugs from the outside:

    - OPENING THIS SCREEN WRITES NOTHING. Looking at a class is not taking its attendance, and if
      it were, "not taken yet" would be unreachable the moment a teacher browsed.
    - MARKING ONE STUDENT ABSENT TAKES THE WHOLE CLASS. The record is created by the first tap,
      which is what makes the two-absence case two taps and no more.

  ── WHAT "TAKEN WITH EVERYONE PRESENT" NEEDS, AND WHY IT IS A BUTTON ──

  A class where nobody is absent produces no marks, so nothing about the ledger would distinguish
  it from a class the teacher forgot. "Everyone's here" is the tap that says the class met — it
  writes `{ classId, date, marks: {} }` and that empty object is the whole point of it. It is a
  toggle rather than a one-way door, and it is offered as an undo ONLY while the record holds no
  marks: there is nothing to lose then, and a control that could destroy a mark by being tapped
  twice does not belong on a screen operated at speed. To un-take a class that has exceptions on
  it, clear them with P first; then the toggle is there.

  ── ONE-TAP DROP, AND WHAT IT COSTS ──

  dropClass() writes exactly `{ classId, date, exception: "dropped" }` — the work order's own
  words, and docs/data-model.md's own shape. Nothing else is on that record, which means dropping
  a class that already had marks on it CLEARS THEM. That is a real cost and it was chosen over the
  alternative: keeping the marks alongside the exception would put a shape in the document that
  the data model does not describe, and every later reader — WO-2.4's counters, Phase 4's windows —
  would have to know to ignore marks it can see. So the loss is made loud instead of prevented:
  the announcement and the on-screen note say how many marks went. The realistic mistake here is
  dropping the wrong class, not dropping a class you have just taken.

  Un-dropping removes the record and leaves the day NOT TAKEN YET, which is the honest inverse: the
  teacher said the class did not meet and has taken that back, not claimed that everyone was there.

  ── WHAT IS NOT ON THIS SCREEN, ON PURPOSE ──

  No support data of any kind — no indicator, no plan, no medical note, no behavior plan. This is
  the screen most likely to be on a projector, with the roster of a whole class on it and thirty
  people looking at the wall, and a dot beside a name is a disclosure to all of them. So this
  module never asks src/supports.js its one visibility question, holds no sensitive field, and is
  deliberately absent from flipPresentationMode()'s redraw list in src/shell.js — the same
  arrangement, and the same reasoning, as src/home.js. docs/data-model.md § Accommodations rule 3
  wants a plan surfaced at the moment of use, and the moment it names is a FOURTH absence: that is
  a signal, it belongs to Phase 4, and the day one lands on this screen this paragraph stops being
  true and this module joins that list. (The function is not named here for the reason home.js
  gives: tools/wo-sweep.mjs reports which screens ask, and a mention would report this one as one
  that does.)

  Out of scope and deliberately absent: percentages and counts over history (WO-2.4), the keyboard
  path (WO-2.5), history views (WO-2.6), and any date but today (WO-2.2, which replaces the one
  text line this file writes into #attendanceDate with a control).
*/

import { getDoc, update } from './store.js';
import { openModal } from './modal.js';
import { announce } from './live-region.js';
import { getSelectedClass } from './classes.js';
/* The two name helpers, imported rather than re-written. src/roster.js's own header explains why a
   student is one record referenced from many places; how that record READS — "Van Dyke, Mary" in a
   list, "Mary Van Dyke" in a sentence — is the same question here as it is there, off the same
   shape, and a second copy in this file could be right about a hyphen, a suffix or a half-typed
   name in a way the roster is not. That is exactly the second opinion this repo keeps refusing.
   (Contrast src/roster.js's initialsOf(), which is written out separately from src/classes.js's
   initials() because those two read different shapes and answer different questions.) */
import { rosterName, fullName } from './roster.js';

const MODAL_ID = 'attendanceModal';
const CLASS_NAME_ID = 'attendanceClassName';
const DATE_ID = 'attendanceDate';
const STATE_ID = 'attendanceState';
const ACTIONS_ID = 'attendanceActions';
const NOTE_ID = 'attendanceNote';
const LIST_ID = 'attendanceList';

/* ────────────────────────────── the vocabulary ──────────────────────────────
   Roll Call!'s five letters and its five words, in the order the buttons sit in on a row. `phrase`
   is the same fact said in a sentence — "2 absent", "1 at an event" — because a count line reads
   as a count and a button reads as a label. */
export const MARKS = [
  { code: 'P', word: 'Present',   phrase: 'present' },
  { code: 'T', word: 'Tardy',     phrase: 'tardy' },
  { code: 'A', word: 'Absent',    phrase: 'absent' },
  { code: 'E', word: 'Event',     phrase: 'at an event' },
  { code: 'D', word: 'Dismissed', phrase: 'dismissed' },
];

/* Present, and the one code that is never stored. Named rather than written as 'P' at each use
   site so that the rule and the letter cannot drift apart. */
export const PRESENT = 'P';

/* The codes that reach `marks`. Derived from MARKS rather than written out a second time: a list
   that has to be kept in step with another list is a list that will not be. */
export const STORED_MARKS = MARKS.filter((m) => m.code !== PRESENT).map((m) => m.code);

/* The only exception this work order writes. plans/rotating-schedule.md names three more —
   `no school`, `snow day`, `holiday` — and WO-2.3 authors those as calendar EVENTS that this
   screen reads, never as values copied onto a record. */
const DROPPED = 'dropped';

/* The three states, as strings rather than booleans, because there are three of them and the whole
   point of this work order is that the third is not the second. */
export const TAKEN = 'taken';
export const DID_NOT_MEET = 'dropped';
export const NOT_TAKEN = 'not-taken';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];

/* ────────────────────────────── the date ──────────────────────────────

   Today, as `YYYY-MM-DD`, built out of the LOCAL calendar fields and never out of
   toISOString(). That method returns UTC, and UTC is a different day from about 7pm Eastern
   onward — so a teacher marking a make-up period after school in the autumn would silently write
   tomorrow's date, and the record would land on a day the class does not meet. The bug is invisible
   in the morning, which is when it would be tested.

   WO-2.2 owns marking a past date. It arrives as a second argument threaded through the functions
   below, which is why every one of them takes a date rather than reaching for today itself. */
export function todayISO(now = new Date()) {
  const pad = (n) => (n < 10 ? '0' : '') + n;
  return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
}

/* `2026-09-08` → `Tuesday, September 8, 2026`. Parsed field by field rather than handed to
   `new Date('2026-09-08')`, which the spec reads as UTC midnight — the same off-by-one-day trap as
   above, arriving from the other direction and showing the wrong weekday. */
export function spokenDate(iso) {
  const parts = String(iso || '').split('-');
  if (parts.length !== 3) return String(iso || '');
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(d.getTime())) return String(iso);
  return DAY_NAMES[d.getDay()] + ', ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getDate()
    + ', ' + d.getFullYear();
}

/* ────────────────────────────── reading the document ──────────────────────────────

   Every read goes through these three. A document can legitimately arrive without `attendance` —
   restored from another build, or hand-edited — and a screen that checks before it iterates is a
   screen that will eventually forget (src/store.js:108-110, src/roster.js:127-131). */

function attendanceIn(doc) { return doc && Array.isArray(doc.attendance) ? doc.attendance : []; }

/* One record per class per date (docs/data-model.md). If a restored document somehow holds two for
   the same pair, the first is the one this app reads and the one every write below edits — so a
   duplicate is inert rather than a second truth that takes turns being visible. */
export function recordFor(classId, date) {
  return attendanceIn(getDoc())
    .filter((r) => r && r.classId === classId && r.date === date)[0] || null;
}

export function marksOf(record) {
  return record && record.marks && typeof record.marks === 'object' ? record.marks : {};
}

/*
  THE PREDICATE. What happened to this class on this date, in one word.

  Everything on the home screen, everything on this screen, and every later phase's meeting count
  reads this rather than testing `exception` for itself. WO-2.3's calendar events go in here.
*/
export function stateOf(classId, date) {
  const record = recordFor(classId, date);
  if (!record) return NOT_TAKEN;
  return record.exception ? DID_NOT_MEET : TAKEN;
}

/* How many of each stored code are on the record. Today's marks only — counts over a term, and the
   percentage that comes from them, are WO-2.4's and are deliberately not here. */
export function countsFor(classId, date) {
  const marks = marksOf(recordFor(classId, date));
  const counts = {};
  STORED_MARKS.forEach((code) => { counts[code] = 0; });
  Object.keys(marks).forEach((id) => {
    if (Object.prototype.hasOwnProperty.call(counts, marks[id])) counts[marks[id]] += 1;
  });
  return counts;
}

/*
  The state as a sentence, and the one place the words come from — the home screen's card and this
  screen's own line say the same thing about the same class because they call the same function.

  "Taken · 2 absent, 1 tardy" while the list is short enough to read at a glance on a card, and
  "Taken · 4 marked" past that: a card is about 200px wide and a line that ellipsises mid-word says
  less than a shorter true one.
*/
export function stateSummary(classId, date) {
  const state = stateOf(classId, date);
  if (state === NOT_TAKEN) return { state: state, text: 'Not taken yet', marked: 0 };
  if (state === DID_NOT_MEET) return { state: state, text: 'Didn’t meet', marked: 0 };

  const counts = countsFor(classId, date);
  const marked = Object.keys(counts).reduce((n, code) => n + counts[code], 0);
  const parts = [];
  /* Absences first, then tardies, then the two rarer ones — the order a teacher cares about them
     in, not the order the letters happen to sit in on the row. */
  ['A', 'T', 'E', 'D'].forEach((code) => {
    if (!counts[code]) return;
    parts.push(counts[code] + ' ' + MARKS.filter((m) => m.code === code)[0].phrase);
  });
  if (!parts.length) return { state: state, text: 'Taken · all present', marked: 0 };
  if (parts.length > 2) return { state: state, text: 'Taken · ' + marked + ' marked', marked: marked };
  return { state: state, text: 'Taken · ' + parts.join(', '), marked: marked };
}

/* ────────────────────────────── which class, which date ──────────────────────────────

   The screen works on the class the app has open and on today, and it holds neither. The open
   class is src/classes.js's answer for the same reason src/roster.js takes it from there — a second
   place that remembers which class is open is a second answer to the question the header already
   answers — and today is asked for freshly at every render rather than captured at open, so an app
   left open across midnight does not go on writing yesterday. */
function openClass() { return getSelectedClass(); }
function viewDate() { return todayISO(); }

/* ────────────────────────────── writing ──────────────────────────────

   Four writers, and all four have the same shape: refuse what cannot be true, write through
   src/store.js's update(), repaint what changed, say what happened. None of them buffers, and
   there is nothing anywhere in this file that a later tap has to confirm.

   `d` is the live document inside update(); nothing below reads the module-level getDoc() from in
   there, which is what keeps the mutation and the read of the same object in one place. */

function listIn(d) {
  if (!Array.isArray(d.attendance)) d.attendance = [];
  return d.attendance;
}

/* The record for this class and date, created if it is not there. Creating one is what "the class
   met" means, so this is the function that takes a class — and the empty `marks` object it seeds
   is the record for a class where everybody was present. */
function ensureRecord(d, classId, date) {
  const list = listIn(d);
  let record = list.filter((r) => r && r.classId === classId && r.date === date)[0];
  if (!record) {
    record = { classId: classId, date: date, marks: {} };
    list.push(record);
  }
  if (!record.marks || typeof record.marks !== 'object') record.marks = {};
  return record;
}

function removeRecord(d, classId, date) {
  d.attendance = listIn(d).filter((r) => !(r && r.classId === classId && r.date === date));
}

/*
  One student, one code. This is the whole of "exceptions-only", and the two lines that matter are
  the delete and the assignment.

  `P` deletes the entry rather than writing one. That is the trap this work order names by name: a
  build that stored `P` would pass every acceptance line here and put twenty-five entries in the
  document for a class where nobody was absent.

  Tapping a mark a student already has does nothing at all — no write, no save, no `rev`. A
  double-tap on a 44px target with a thumb is common, and the alternative reading (tap it again to
  clear) would make an accidental second tap silently un-mark an absence. Clearing is P, which is
  on the row, which is also what makes all five marks reachable without a submenu.
*/
export function setMark(studentId, code) {
  const cls = openClass();
  const date = viewDate();
  if (!cls || !studentId || !getDoc()) return;
  if (!MARKS.some((m) => m.code === code)) return;

  const record = recordFor(cls.id, date);
  /* A class that did not meet has no attendance to hold. The list is not rendered in that state,
     so this is a guard rather than a path — but it is the guard that keeps a stray hook from
     writing marks onto a dropped record, which is a shape the data model does not have. */
  if (record && record.exception) return;

  const current = marksOf(record)[studentId] || PRESENT;
  /* Nothing to write — but only once the record exists. Tapping P on a class that has not been
     taken yet is a real act: it takes the class, with everyone present. */
  if (record && current === code) return;

  update((d) => {
    const r = ensureRecord(d, cls.id, date);
    if (code === PRESENT) delete r.marks[studentId];
    else r.marks[studentId] = code;
  });

  paintRow(studentId);
  paintHeader();
  const word = MARKS.filter((m) => m.code === code)[0].word;
  const student = findStudent(studentId);
  announce(fullName(student) + ' — ' + word + '.');
}

/* "Everyone's here": the tap that records a meeting with no exceptions on it. Without this, a class
   where nobody was absent is indistinguishable from a class the teacher forgot, which is the
   question the whole three-state design exists to answer. */
export function takeClass() {
  const cls = openClass();
  const date = viewDate();
  if (!cls || !getDoc()) return;
  if (stateOf(cls.id, date) === TAKEN) return;

  update((d) => {
    const record = ensureRecord(d, cls.id, date);
    /* Defensive: this control is not offered on a class that is already marked as not meeting.
       If it is ever reached from one, taking the class means it met. */
    delete record.exception;
  });

  renderAttendance();
  announce(cls.name + ' is taken for ' + spokenDate(date) + ', with everyone present.');
}

/* And back off again. Offered only while the record holds no marks — see the header comment: a
   control that can destroy a mark by being tapped twice does not belong on a screen operated at
   speed, and the refusal below is the same rule stated where it cannot be skipped. */
export function untakeClass() {
  const cls = openClass();
  const date = viewDate();
  if (!cls || !getDoc()) return;
  const record = recordFor(cls.id, date);
  if (!record || record.exception) return;
  if (Object.keys(marksOf(record)).length) return;

  update((d) => removeRecord(d, cls.id, date));
  renderAttendance();
  announce(cls.name + ' is not taken for ' + spokenDate(date) + '.');
}

/*
  One tap, and the class is done. The record written here is exactly the one the work order and
  docs/data-model.md specify and nothing more: class, date, exception. Nothing to set up at the
  start of the year and nothing to maintain when the rotation shifts, which is the entire argument
  of plans/rotating-schedule.md.

  Marks already on the record go with it. See the header comment for why that is the chosen cost
  rather than a shape the data model does not describe — and note that what is lost is said out
  loud, in the note under the state line and in the announcement, rather than happening quietly.
*/
export function dropClass() {
  const cls = openClass();
  const date = viewDate();
  if (!cls || !getDoc()) return;
  if (stateOf(cls.id, date) === DID_NOT_MEET) return;

  const cleared = Object.keys(marksOf(recordFor(cls.id, date))).length;
  update((d) => {
    const list = listIn(d);
    const written = { classId: cls.id, date: date, exception: DROPPED };
    const index = list.findIndex((r) => r && r.classId === cls.id && r.date === date);
    if (index >= 0) list[index] = written;
    else list.push(written);
  });

  renderAttendance();
  announce(cls.name + ' did not meet on ' + spokenDate(date) + '.'
    + (cleared ? ' The ' + cleared + (cleared === 1 ? ' mark' : ' marks')
      + ' already on it were cleared.' : ''));
}

/* And one tap back. The record goes entirely, which leaves the day NOT TAKEN YET rather than taken:
   taking back "the class did not meet" is not the same as claiming everyone was there, and the
   teacher who taps this is usually about to mark the class properly. */
export function undropClass() {
  const cls = openClass();
  const date = viewDate();
  if (!cls || !getDoc()) return;
  if (stateOf(cls.id, date) !== DID_NOT_MEET) return;

  update((d) => removeRecord(d, cls.id, date));
  renderAttendance();
  announce(cls.name + ' met after all on ' + spokenDate(date)
    + '. Its attendance is not taken yet.');
}

/* ────────────────────────────── the roster, in the order this screen reads it ──────────────────

   Sorted by surname, then first name — and this is a decision src/roster.js's header hands to this
   work order by name ("WO-2.1's marking screen is where an order that is not hers gets decided").

   The roster itself renders in the order the teacher pasted, because that is her list and a second
   opinion about it there would be one she can see. Here the question is different: two students
   have to be FOUND among twenty-five in a few seconds, standing up, while the room fills. A pasted
   SIS list is usually already alphabetical, so sorting changes nothing in the common case and
   guarantees the order in the case where she typed names in as they arrived. Nothing else in the
   app depends on this order, and no seating-chart feature exists for it to fight. */

function studentsIn(doc) { return doc && Array.isArray(doc.students) ? doc.students : []; }

function findStudent(id) {
  return studentsIn(getDoc()).filter((s) => s.id === id)[0] || null;
}

/* A roster id that names nobody is dropped rather than rendered as a blank row — the same harmless
   failure src/roster.js describes, from a restored or hand-edited document. */
function rosterOf(cls) {
  const ids = cls && Array.isArray(cls.roster) ? cls.roster : [];
  return ids.map((id) => findStudent(id)).filter(Boolean);
}

function markingOrder(cls) {
  return rosterOf(cls).slice().sort((a, b) => {
    const last = String(a.last || '').localeCompare(String(b.last || ''));
    if (last !== 0) return last;
    return String(a.first || '').localeCompare(String(b.first || ''));
  });
}

/* ────────────────────────────── rendering ──────────────────────────────

   createElement and textContent throughout, never innerHTML: a student's name is pasted out of a
   school system, and a student called "Bo <b>x</b>" has to be a student called "Bo <b>x</b>"
   (src/roster.js says the same thing over the same string). */

function actionButton(label, hook, extraClass) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'class-action-btn' + (extraClass ? ' ' + extraClass : '');
  btn.setAttribute(hook, '');
  btn.textContent = label;
  return btn;
}

/*
  One student's five marks. Exactly one is on at all times, and P is on whenever nothing is stored
  for that student — which is what "present is the default" looks like on a screen.

  P's ON state is the pale wash and the other four are solid, and that is not decoration. The style
  guide reserves a solid accent fill for a state the teacher CHOSE and gives the wash to "where you
  already are" — the same call `.year-row.current` and `.class-card.open` already make. Present is
  where every student already is; an absence is a decision. Twenty-five rows of solid green would
  also read as twenty-five things having been done, which is the opposite of true.
*/
function markButtons(student, code) {
  const group = document.createElement('div');
  group.className = 'attendance-marks';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Mark ' + fullName(student));

  MARKS.forEach((mark) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const on = mark.code === code;
    btn.className = 'attendance-mark m' + mark.code + (on ? ' on' : '');
    btn.setAttribute('data-attendance-mark', mark.code);
    btn.setAttribute('data-attendance-student', student.id);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    /* A one-letter button with no accessible name is a button a screen reader reads as nothing at
       all — style guide §7, and the same call src/roster.js makes over its support dot. The word
       and the name, both, because five identical rows of "A" say whose. */
    btn.setAttribute('aria-label', mark.word + ' — ' + fullName(student));
    btn.title = mark.word;
    btn.textContent = mark.code;
    group.append(btn);
  });
  return group;
}

function studentRow(student, code) {
  const row = document.createElement('div');
  row.className = 'attendance-row' + (code === PRESENT ? '' : ' marked');
  row.setAttribute('data-attendance-row', student.id);

  const name = document.createElement('span');
  name.className = 'attendance-row-name';
  name.textContent = rosterName(student);
  /* Capped and ellipsised by the stylesheet — five 44px targets take 236px of a 480px panel, and a
     name that wrapped would push the row a teacher is aiming at down the screen. The whole name
     stays reachable on `title`, the same arrangement a class card makes. */
  name.title = rosterName(student);
  row.append(name);

  row.append(markButtons(student, code));
  return row;
}

function emptyLine(text) {
  const el = document.createElement('div');
  el.className = 'attendance-empty';
  el.textContent = text;
  return el;
}

/* The state line and the class-level controls — everything above the list. Repainted on its own
   after a mark, because the list below it must not be rebuilt: a rebuild resets the scroll position
   of a twenty-five-name list to the top, under the thumb of someone half way down it. */
function paintHeader() {
  const cls = openClass();
  const date = viewDate();
  const stateEl = document.getElementById(STATE_ID);
  const actions = document.getElementById(ACTIONS_ID);
  const note = document.getElementById(NOTE_ID);
  if (!stateEl || !actions || !note) return;

  const summary = cls ? stateSummary(cls.id, date)
    : { state: NOT_TAKEN, text: 'No class is open', marked: 0 };
  stateEl.textContent = summary.text;
  stateEl.className = 'attendance-state ' + summary.state;

  actions.textContent = '';
  note.textContent = '';
  note.classList.add('hidden');
  if (!cls) return;

  if (summary.state === DID_NOT_MEET) {
    actions.append(actionButton('The class met after all', 'data-attendance-undrop', 'restore'));
    note.textContent = 'Nothing is recorded for this day, and nothing counts toward anything. '
      + 'Undoing this leaves it not taken yet, ready to mark.';
    note.classList.remove('hidden');
    return;
  }

  const record = recordFor(cls.id, date);
  const marked = Object.keys(marksOf(record)).length;
  if (summary.state === TAKEN && marked === 0) {
    /* The same control that took the class, now pressed, now meaning "actually, I have not taken
       this". Offered only here — with a mark on the record it is not offered at all, because
       nothing on this screen may destroy a mark by being tapped a second time. */
    const undo = actionButton('✓ Everyone’s here', 'data-attendance-untake');
    /* Its own class rather than a variant of `.class-action-btn`: shell.css owns that name and its
       variants, and src/shell.css's header sets the rule that two stylesheets never style one
       class. So the pressed look is `.attendance-toggle-on`, declared in this screen's own sheet
       and winning on load order. */
    undo.classList.add('attendance-toggle-on');
    undo.setAttribute('aria-pressed', 'true');
    undo.title = 'Taken, with everyone present. Tap to take that back.';
    actions.append(undo);
  } else if (summary.state === NOT_TAKEN) {
    const take = actionButton('Everyone’s here', 'data-attendance-take', 'primary');
    take.setAttribute('aria-pressed', 'false');
    take.title = 'Record this class as met, with nobody absent.';
    actions.append(take);
  }

  const drop = actionButton('Didn’t meet', 'data-attendance-drop', 'archive');
  drop.title = marked
    ? 'Record that this class did not meet. The ' + marked
      + (marked === 1 ? ' mark' : ' marks') + ' on it will be cleared.'
    : 'Record that this class did not meet.';
  actions.append(drop);
}

/* One row's five buttons, after that row's mark changed. Nothing else on the list is touched. */
function paintRow(studentId) {
  const cls = openClass();
  if (!cls) return;
  const row = document.querySelector('[data-attendance-row="' + studentId + '"]');
  if (!row) return;
  const code = marksOf(recordFor(cls.id, viewDate()))[studentId] || PRESENT;
  row.classList.toggle('marked', code !== PRESENT);
  row.querySelectorAll('[data-attendance-mark]').forEach((btn) => {
    const on = btn.getAttribute('data-attendance-mark') === code;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

/* The whole screen, from the open document. Called at open and after anything that changes what
   the screen is made of — a drop, an un-drop, a take, an un-take. NOT after a mark; see paintRow. */
export function renderAttendance() {
  const cls = openClass();
  const date = viewDate();
  const doc = getDoc();
  const nameEl = document.getElementById(CLASS_NAME_ID);
  const dateEl = document.getElementById(DATE_ID);
  const list = document.getElementById(LIST_ID);
  if (nameEl) nameEl.textContent = cls ? cls.name : 'no class';
  /* Today, as words. WO-2.2 replaces this line with a date control; it is written here rather than
     in index.html because it is the one part of this dialog that is not the same on two days. */
  if (dateEl) dateEl.textContent = spokenDate(date);

  paintHeader();
  if (!list) return;

  list.textContent = '';
  if (!doc) {
    list.append(emptyLine('No school year is open, so there is nothing to mark.'));
    return;
  }
  if (!cls) {
    list.append(emptyLine('No class is open. Attendance belongs to a class — open one from the '
      + 'class bar first.'));
    return;
  }
  if (stateOf(cls.id, date) === DID_NOT_MEET) {
    /* The list is not rendered at all rather than rendered and disabled: a screen showing
       twenty-five greyed rows invites tapping them, and the state above it already says why they
       are not there. */
    return;
  }

  const students = markingOrder(cls);
  if (!students.length) {
    list.append(emptyLine('No students in ' + cls.name + ' yet. Add the roster and they appear '
      + 'here — the class can still be marked as met, or as not meeting.'));
    return;
  }

  const marks = marksOf(recordFor(cls.id, date));
  students.forEach((s) => list.append(studentRow(s, marks[s.id] || PRESENT)));
}

/*
  The way in, from the state line on a class card. Opened through its own hook rather than
  data-modal-open for the reason src/year-picker.js gives: the panel is filled from the document,
  and a modal that opens and then fills in is a modal that flickers.

  src/shell.js makes that class the OPEN class on the way past — the card's state line and the
  card's own tap are two routes onto one selection, and this screen then works on the open class the
  way every other class-scoped screen does. There is no second answer to which class is open.
*/
export function openAttendance(opener) {
  renderAttendance();
  openModal(MODAL_ID, opener);
}
