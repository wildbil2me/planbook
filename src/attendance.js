/*
  Attendance — the registry: one class, students down, recent weekdays across, and the one
  predicate that says what happened to a class on a date.

  THIS IS THE FLOW THAT RUNS WHILE STUDENTS WALK IN. It is the one thing the owner does every
  single period, on an iPad, standing up, and it is measured in seconds. Every decision below that
  looks like an omission is a decision about that clock.

  ── WHERE THIS SCREEN LIVES (WO-1.13) ──

  In <main>, as `#classView` — the open class's working surface, alongside `#homeView`'s class grid,
  one visible at a time. It shipped at WO-2.1 as a dialog over the home screen because there was no
  main area to put it in; there is one now. Nothing about what it shows or stores changed in the
  move, and nothing in this file renders the frame around it: index.html holds the markup, and
  src/views.js decides which view is up. What went with the dialog is named where it mattered — the
  ✕ (see "there is no submit"), and the card's second control (src/home.js).

  ── WHY THIS SCREEN IS A GRID AND NOT A DAY ──

  It shipped once as one class on one day: a list of names with five P/T/A/E/D buttons on each
  row (commit 11f0780). It passed every acceptance line it had and it was WORSE FOR THE OWNER
  than the app it replaces, because Roll Call!'s registry view shows six days of columns at once
  and "which day did I forget?" is answered there by LOOKING. A hole is a blank column. Take that
  away and the question needs a memory, a date picker, and a second screen.

  So the surface is a table. The columns are the last six WEEKDAYS BY CALENDAR — not the dates
  this class has records for, which is the whole mechanism: a day you forgot has no record, so a
  window built from records would omit exactly the column you opened the screen to find. It is
  also not a schedule: nothing here predicts which classes meet, and plans/rotating-schedule.md is
  the decision record that says why there is nothing to predict with.

  ── THE THREE STATES, AND WHY THERE IS NO SCHEDULE TO ASK ──

  plans/rotating-schedule.md is settled: there is no schedule object, no cycle, no rotation, no
  meeting pattern. A class met if it has an attendance record with no `exception`. So a class on a
  date is in exactly one of three states, and stateOf() below is the only place in the app that
  decides which:

    no record at all              → NOT TAKEN YET   "did I forget?"
    a record with no `exception`  → TAKEN           the class met; this is a meeting and it counts
    a record with an `exception`  → DID NOT MEET    dropped; it counts toward nothing

  The third is not the second. Every later phase reads through stateOf() rather than testing
  `exception` itself: WO-2.3 adds calendar events to the answer (a `no-school` range covering the
  date), and it adds them HERE, in one function, or the app grows a second opinion about whether a
  class met. THE COLUMN HEADER IS BUILT FOR A FOURTH REASON ARRIVING — the state chip is a word and
  a palette, not a boolean, so an event-covered day is a fourth word in the same slot.

  ── THE AMBIGUITY A GRID CREATES, WHICH A ONE-DAY SCREEN DID NOT HAVE ──

  An empty cell means TWO different things: "present" on a date the class was taken, and "no data
  at all" on a date it wasn't. If those look alike the teacher reads a forgotten day as a day when
  everybody showed up, which is the exact failure the three states exist to prevent. So a cell is
  never empty:

    the class was taken       → `P` on the positive wash — present, which is what no mark means
    the class was not taken   → `?` on the caution wash, and the WHOLE COLUMN carries that wash
    the class did not meet    → `–` on a dashed grey, quiet, because there is nothing to do

  The column header says the same thing in words above it. The work order asks for the distinction
  "in the column header AND in the cells under it", and this is both halves.

  ── EXCEPTIONS ONLY. PRESENT IS THE ABSENCE OF A MARK ──

  `marks` holds T / A / E / D and nothing else. A class of 25 with two absences is two entries in
  the year document, not 25 — docs/data-model.md says so, and it is also why marking is fast.
  Storing `P` would pass every acceptance test this work order has, quietly triple the size of the
  document, and only show up as a problem in Phase 7 when it is being pushed through Drive. The
  guard is in setMark(): `P` DELETES, it never writes. There is ONE writer for every path on this
  screen — the cells, the column headers and the class-level buttons all land in the same five
  functions — because two writers means two exceptions-only guards and the second one is where a
  `P` eventually gets stored.

  Note that a cell still DISPLAYS `P`. Displaying it is the truthful reading of an empty entry on a
  taken day, and it is what Roll Call! shows in the same place; storing it is the trap.

  The five letters and their words are Roll Call!'s — P present, T tardy, A absent, E event,
  D dismissed — because the owner reads both apps this year and her fingers already know them.
  docs/data-model.md describes E in prose as an excused absence, which is what an `E` means for the
  percentage in WO-2.4; the word on the button is Roll Call!'s "Event", because that is the word
  she is used to tapping.

  ── ONE CYCLE, AND THE ONE PLACE IT DIVERGES FROM HER HABIT ──

  Roll Call! cycles a cell `'' → P → A → T → E`, and it has a SECOND cycle for past days in a
  different order (cyclePastAttendance, dashboard.html:3802). Planbook has one cycle and one
  writer, and the order is

      present → A → E → T → D → present

  `P` is not a step because present is never stored — clearing a mark IS present. `D` is a step
  because Planbook has no hall-pass flow to log a dismissal from, so the grid is the only place it
  can be said. That is a deliberate divergence from a habit in the owner's fingers, so it is named
  on the screen (the hint under the grid) and not only in this comment.

  ── THERE IS NO SUBMIT, AND THERE IS NO DRAFT ──

  A tap writes. src/store.js debounces the write into one save 800ms later and the chip in the
  corner says so, but the change is in the document the instant the finger lifts. There is no
  "Save attendance", no "Finalize", no pending-edits buffer, and there must never be one: the
  teacher is interrupted mid-class every day of the week — a phone call, a nurse, a fire drill —
  and a screen that loses what she tapped because she never reached the bottom of it is a screen
  she stops trusting in week two. Nothing on this screen closes it: since WO-1.13 it is a view in
  <main> rather than a dialog, and leaving it is navigation rather than a decision — which is the
  same fact said in the architecture instead of in a ✕ that had to be explained.

  Two consequences worth naming, because both look like bugs from the outside:

    - OPENING THIS SCREEN WRITES NOTHING. Looking at a class is not taking its attendance, and if
      it were, "not taken yet" would be unreachable the moment a teacher browsed.
    - MARKING ONE STUDENT ABSENT TAKES THE WHOLE CLASS, on that column's date. The record is
      created by the first tap, which is what makes the two-absence case two taps and no more.

  ── PAST DAYS TAKE AN UNLOCK; FUTURE DAYS DO NOT EXIST ──

  Today's column is live: its cells are buttons and its header drops the class in one tap. A past
  column is READ-ONLY until its ✏ is tapped, which is the "deliberate unlock" — one column at a
  time, the column tinted while it is open, a strip above the grid saying in words which day you
  are on, and the class-level controls retargeted to it. That strip is the "you are not on today"
  indication, and it is a strip rather than a subtle tint because it has to survive being read
  across a classroom.

  There is no future column and no way to reach one. The window ENDS at today, "Later" is disabled
  when it already does, and every writer refuses a date after today outright — so the block is a
  fact about the storage layer rather than a fact about which buttons got rendered.

  ── WHAT "TAKEN WITH EVERYONE PRESENT" NEEDS, AND WHY IT IS A BUTTON ──

  A class where nobody is absent produces no marks, so nothing about the ledger would distinguish
  it from a class the teacher forgot. "Everyone's here" is the tap that says the class met — it
  writes `{ classId, date, marks: {} }` and that empty object is the whole point of it. It is a
  toggle rather than a one-way door, and it is offered as an undo ONLY while the record holds no
  marks: there is nothing to lose then, and a control that could destroy a mark by being tapped
  twice does not belong on a screen operated at speed. To un-take a class that has exceptions on
  it, cycle them back to present first; then the toggle is there.

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
  path (WO-2.5), per-student history and print/CSV (WO-2.6), and calendar events (WO-2.3), which
  this screen READS once they exist and never authors.
*/

import { getDoc, update } from './store.js';
import { announce } from './live-region.js';
/* `initials` and `avatarClass` come from here rather than being re-derived, for the reason WO-1.10
   gives where they were exported: the colour is part of how a teacher recognises a person, so there
   is one answer per student and not one per screen. The roster and the home cards already read
   them; the registry is the third. */
import { getSelectedClass, initials, avatarClass } from './classes.js';
/* The two name helpers, imported rather than re-written. src/roster.js's own header explains why a
   student is one record referenced from many places; how that record READS — "Van Dyke, Mary" in a
   list, "Mary Van Dyke" in a sentence — is the same question here as it is there, off the same
   shape, and a second copy in this file could be right about a hyphen, a suffix or a half-typed
   name in a way the roster is not. That is exactly the second opinion this repo keeps refusing.
   (Contrast src/roster.js's initialsOf(), which is written out separately from src/classes.js's
   initials() because those two read different shapes and answer different questions.) */
import { rosterName, fullName } from './roster.js';

const CLASS_NAME_ID = 'attendanceClassName';
const DATE_ID = 'attendanceDate';
const BANNER_ID = 'attendanceBanner';
const STATE_ID = 'attendanceState';
const ACTIONS_ID = 'attendanceActions';
const NOTE_ID = 'attendanceNote';
const SEARCH_ID = 'attendanceSearch';
const PILLS_ID = 'attendancePills';
const SORT_ID = 'attendanceSort';
const PAGER_ID = 'attendancePager';
const WRAP_ID = 'attendanceGridWrap';
const CAPTION_ID = 'attendanceCaption';
const HEAD_ID = 'attendanceHead';
const BODY_ID = 'attendanceBody';
const EMPTY_ID = 'attendanceEmpty';

/* ────────────────────────────── the vocabulary ──────────────────────────────
   Roll Call!'s five letters and its five words. `phrase` is the same fact said in a sentence —
   "2 absent", "1 at an event" — because a count line reads as a count and a chip reads as a
   label. */
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

/*
  THE CYCLE, and it is one cycle for every column — today's and any past one the teacher has
  unlocked. Roll Call! splits this into two functions with two different orders; that split exists
  over there because today's marks live in a local buffer and past ones are written straight
  through, which is a bridge problem Planbook does not have.

  Absent is FIRST because it is the common case: the two-absence class is two taps. Present is the
  wrap-around rather than a step, because present is not a value here — it is the absence of one.

  EVENT COMES BEFORE TARDY, which reversed WO-2.1's order on 2026-08-06 at the owner's request —
  she is the one whose fingers run this five times a day, and the second-commonest mark in her rooms
  is a student pulled out for an event rather than one arriving late. The order is hers to set; the
  two rules around it are not, and neither moved: P is still the never-stored wrap-around, and a
  resting cell is still DRAWN as "P" so that an empty-looking cell on a taken day cannot be confused
  with a day nobody took. The screen says the new order in words (the hint under the grid), because
  the divergence from her Roll Call! habit is named on the screen and not only in this comment.
*/
export const CYCLE = [PRESENT].concat(['A', 'E', 'T', 'D']);

/* The only exception this work order writes. plans/rotating-schedule.md names three more —
   `no school`, `snow day`, `holiday` — and WO-2.3 authors those as calendar EVENTS that this
   screen reads, never as values copied onto a record. */
const DROPPED = 'dropped';

/* The three states, as strings rather than booleans, because there are three of them and the whole
   point of this work order is that the third is not the second. */
export const TAKEN = 'taken';
export const DID_NOT_MEET = 'dropped';
export const NOT_TAKEN = 'not-taken';

/* Roll Call!'s own number (dashboard.html:3902), matched rather than re-argued: six columns is a
   school week you can see at a glance without the row becoming a scroll. */
const DEFAULT_DAY_COLS = 6;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];

/* ────────────────────────────── the date ──────────────────────────────

   Today, as `YYYY-MM-DD`, built out of the LOCAL calendar fields and never out of
   toISOString(). That method returns UTC, and UTC is a different day from about 7pm Eastern
   onward — so a teacher marking a make-up period after school in the autumn would silently write
   tomorrow's date, and the record would land on a day the class does not meet. The bug is invisible
   in the morning, which is when it would be tested.

   Every function below that writes takes a date rather than reaching for today itself, which is
   what lets one set of writers serve today's column and an unlocked past one. */
export function todayISO(now = new Date()) {
  const pad = (n) => (n < 10 ? '0' : '') + n;
  return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
}

/* `2026-09-08` → a Date at LOCAL midnight. Parsed field by field rather than handed to
   `new Date('2026-09-08')`, which the spec reads as UTC midnight — the same off-by-one-day trap as
   above, arriving from the other direction and showing the wrong weekday. Every date arithmetic in
   this file starts here. */
function parseISO(iso) {
  const parts = String(iso || '').split('-');
  if (parts.length !== 3) return null;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return isNaN(d.getTime()) ? null : d;
}

/* `2026-09-08` → `Tuesday, September 8, 2026`. */
export function spokenDate(iso) {
  const d = parseISO(iso);
  if (!d) return String(iso || '');
  return DAY_NAMES[d.getDay()] + ', ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getDate()
    + ', ' + d.getFullYear();
}

/* `2026-09-08` → `9/8`, which is what fits in a column head. The year is deliberately absent: six
   weekdays never span a year boundary in a way a teacher could misread, and the spoken form is on
   every cell's accessible name. */
function shortDate(iso) {
  const d = parseISO(iso);
  return d ? (d.getMonth() + 1) + '/' + d.getDate() : String(iso || '');
}

function dayAbbr(iso) {
  const d = parseISO(iso);
  return d ? DAY_ABBR[d.getDay()] : '';
}

/*
  THE COLUMNS, and the one place Roll Call! must not be copied.

  getWindowedDays() over there slices `qData.days` — the days that exist in the sheet. Ours is the
  last N weekdays BY CALENDAR, whether or not anything has ever been recorded on them, because a
  day you forgot has no record and a hole you cannot see is a hole you cannot fill. That is the
  entire mechanism behind "a hole left three days ago is findable by looking".

  Today is always the first column even when today is a Saturday, which is Roll Call!'s own rule
  ("today plus the five preceding weekdays", dashboard.html:3899). On the five days that matter the
  two readings are identical; on a weekend this one keeps a column to drop or take, and the
  alternative would have left the screen with no today at all.

  `offset` is in whole windows: 0 is the window ending at today, 1 is the six weekdays before it.
  Paging by a window rather than by a day is what puts "two weeks back" two taps away.
*/
function dayColumns(count, offset, today) {
  const needed = count * (offset + 1);
  const out = [];
  const d = parseISO(today);
  if (!d) return out;
  let guard = 0;
  while (out.length < needed && guard++ < 4000) {
    const dow = d.getDay();
    /* The first candidate IS today, and it goes in whatever day of the week it is. Everything
       after it is Mon–Fri. */
    if (!out.length || (dow !== 0 && dow !== 6)) out.push(todayISO(d));
    d.setDate(d.getDate() - 1);
  }
  return out.slice(offset * count, offset * count + count);
}

/*
  How many columns fit. Six is the answer on anything from an iPad up; a narrower viewport shows
  FEWER COLUMNS rather than scrolling sideways, because a grid you have to swipe horizontally to
  read is a grid whose whole argument — see it all at once — has been given away.

  Measured off the viewport rather than off the panel, and it stays that way after WO-1.13 moved
  this screen out of a dialog: a hidden element measures zero, this screen can legitimately be
  painted while `#classView` is still `.hidden` (boot restores the view and the paint in one pass),
  and a column count of three because the answer was asked a frame early is a defect nobody would
  look for here. The panel tracks the viewport below 905px, so the two agree wherever the answer is
  not simply six.
*/
function dayColumnCount(width) {
  const w = typeof width === 'number' ? width : window.innerWidth;
  if (w < 420) return 3;
  if (w < 540) return 4;
  if (w < 680) return 5;
  return DEFAULT_DAY_COLS;
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

  Everything on the home screen, every column header on this screen, and every later phase's
  meeting count reads this rather than testing `exception` for itself. WO-2.3's calendar events go
  in here.
*/
export function stateOf(classId, date) {
  const record = recordFor(classId, date);
  if (!record) return NOT_TAKEN;
  return record.exception ? DID_NOT_MEET : TAKEN;
}

/* How many of each stored code are on the record. One date's marks only — counts over a term, and
   the percentage that comes from them, are WO-2.4's and are deliberately not here. */
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
     in, not the order the letters happen to sit in. */
  ['A', 'T', 'E', 'D'].forEach((code) => {
    if (!counts[code]) return;
    parts.push(counts[code] + ' ' + MARKS.filter((m) => m.code === code)[0].phrase);
  });
  if (!parts.length) return { state: state, text: 'Taken · all present', marked: 0 };
  if (parts.length > 2) return { state: state, text: 'Taken · ' + marked + ' marked', marked: marked };
  return { state: state, text: 'Taken · ' + parts.join(', '), marked: marked };
}

/* The state as a word small enough to sit in a column head. Same three answers as stateSummary,
   said in the two or three words a 52px column can hold — and it is a WORD rather than only a
   colour, because "distinguishable without reading fine print" is not a claim colour alone can
   carry for a teacher who does not see red and green apart. */
function stateChip(state) {
  if (state === TAKEN) return 'Taken';
  if (state === DID_NOT_MEET) return 'Didn’t meet';
  return 'Not taken';
}

/* ────────────────────────────── which class, which date ──────────────────────────────

   The screen works on the class the app has open and it holds no copy of that: the open class is
   src/classes.js's answer for the same reason src/roster.js takes it from there — a second place
   that remembers which class is open is a second answer to the question the header already
   answers.

   Today is asked for FRESHLY AT EVERY RENDER rather than captured at open, so an app left open
   across midnight does not go on writing yesterday. The six-day window has exactly the same hazard
   and gets exactly the same treatment: dayColumns() is called during the render, off today, never
   stored. */
function openClass() { return getSelectedClass(); }

/* ── THE VIEW STATE ──
   Five values, none of them student data and none of them persisted. They are reset on every
   arrival (see resetRegistry): a teacher who left a past column unlocked yesterday should not find
   it still unlocked when she opens the screen with a class walking in. */
let editingPast = null;    /* an ISO date, or null for "today" */
let pageOffset = 0;        /* whole windows back from today; 0 is the window ending at today */
let searchText = '';
let filterCode = 'all';    /* 'all' or one of P T A E D */
let sortBy = 'last';       /* 'last' or 'first' */

/*
  THE DATE THAT ACCEPTS EDITS. Today unless a past column has been deliberately unlocked.

  The `>= today` branch is the midnight case: an app left open overnight with Tuesday unlocked
  wakes up on a Wednesday where Tuesday is still legitimately past, but an app left open with
  TODAY somehow recorded here would be holding a date that is no longer today. Re-derived rather
  than trusted.
*/
function editDate() {
  const t = todayISO();
  if (!editingPast || editingPast >= t) { editingPast = null; return t; }
  return editingPast;
}

/*
  THE ONE GATE EVERY WRITER PASSES THROUGH, and the reason "future dates are blocked" is a fact
  about the storage layer rather than about which buttons happened to get rendered. The grid never
  offers tomorrow — the window ends at today and "Later" is disabled there — but a hook fired from
  a stale DOM, a keyboard path added in WO-2.5, or a restored document with a bad date would all
  arrive here, and marking Friday's attendance on Wednesday is a mistake rather than a feature.
*/
function writableDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(date)) && String(date) <= todayISO();
}

/* ────────────────────────────── writing ──────────────────────────────

   Five writers, and all five have the same shape: refuse what cannot be true, write through
   src/store.js's update(), repaint what changed, say what happened. None of them buffers, and
   there is nothing anywhere in this file that a later tap has to confirm.

   ALL FIVE TAKE AN EXPLICIT DATE, defaulting to the column that accepts edits. That parameter is
   the whole of "mark a past date": the exceptions-only guard, the `P`-deletes-rather-than-writes
   rule, the refusal to write onto a dropped record and the no-op-on-an-unchanged-code rule all
   run on one code path for every column. A second writer for grid cells would be a second copy of
   those four rules, and the second copy is where a stored `P` comes from.

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
  One student, one code, one date. This is the whole of "exceptions-only", and the two lines that
  matter are the delete and the assignment.

  `P` deletes the entry rather than writing one. That is the trap this work order names by name: a
  build that stored `P` would pass every acceptance line here and put twenty-five entries in the
  document for a class where nobody was absent.

  Setting the code a student already has does nothing at all — no write, no save, no `rev`. The
  cycle below can never ask for that, but a keyboard path or a stale tap can, and a screen operated
  at speed should not spend a revision on a tap that changed nothing.
*/
export function setMark(studentId, code, date) {
  const cls = openClass();
  const on = date || editDate();
  if (!cls || !studentId || !getDoc()) return;
  if (!MARKS.some((m) => m.code === code)) return;
  if (!writableDate(on)) return;

  const record = recordFor(cls.id, on);
  /* A class that did not meet has no attendance to hold. Its cells are not rendered as buttons, so
     this is a guard rather than a path — but it is the guard that keeps a stray hook from writing
     marks onto a dropped record, which is a shape the data model does not have. */
  if (record && record.exception) return;

  const current = marksOf(record)[studentId] || PRESENT;
  /* Nothing to write — but only once the record exists. Setting P on a class that has not been
     taken yet is a real act: it takes the class, with everyone present. */
  if (record && current === code) return;

  update((d) => {
    const r = ensureRecord(d, cls.id, on);
    if (code === PRESENT) delete r.marks[studentId];
    else r.marks[studentId] = code;
  });

  /* The whole column, not just the cell: a first mark turns the column from NOT TAKEN to TAKEN,
     and every other cell in it goes from `?` to `P`. Repainting one cell would leave twenty-five
     question marks under a header that says the class was taken. The tbody is NOT rebuilt, so the
     scroll position of a twenty-six-name table survives a mark made half way down it. */
  paintColumn(on);
  paintActions();

  const word = MARKS.filter((m) => m.code === code)[0].word;
  const student = findStudent(studentId);
  announce(fullName(student) + ' — ' + word
    + (on === todayISO() ? '' : ' on ' + spokenDate(on)) + '.');
}

/*
  A TAP ON A CELL. Reads what is there, writes the next code, and does it through setMark() so that
  every rule above applies to a cell exactly as it applies to anything else.
*/
export function cycleMark(studentId, date) {
  const cls = openClass();
  const on = date || editDate();
  if (!cls || !studentId) return;
  const current = marksOf(recordFor(cls.id, on))[studentId] || PRESENT;
  const index = CYCLE.indexOf(current);
  setMark(studentId, CYCLE[(index + 1) % CYCLE.length], on);
}

/* "Everyone's here": the tap that records a meeting with no exceptions on it. Without this, a class
   where nobody was absent is indistinguishable from a class the teacher forgot, which is the
   question the whole three-state design exists to answer. */
export function takeClass(date) {
  const cls = openClass();
  const on = date || editDate();
  if (!cls || !getDoc() || !writableDate(on)) return;
  if (stateOf(cls.id, on) === TAKEN) return;

  update((d) => {
    const record = ensureRecord(d, cls.id, on);
    /* Defensive: this control is not offered on a class that is already marked as not meeting.
       If it is ever reached from one, taking the class means it met. */
    delete record.exception;
  });

  paintColumn(on);
  paintActions();
  announce(cls.name + ' is taken for ' + spokenDate(on) + ', with everyone present.');
}

/* And back off again. Offered only while the record holds no marks — see the header comment: a
   control that can destroy a mark by being tapped twice does not belong on a screen operated at
   speed, and the refusal below is the same rule stated where it cannot be skipped. */
export function untakeClass(date) {
  const cls = openClass();
  const on = date || editDate();
  if (!cls || !getDoc() || !writableDate(on)) return;
  const record = recordFor(cls.id, on);
  if (!record || record.exception) return;
  if (Object.keys(marksOf(record)).length) return;

  update((d) => removeRecord(d, cls.id, on));
  paintColumn(on);
  paintActions();
  announce(cls.name + ' is not taken for ' + spokenDate(on) + '.');
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
export function dropClass(date) {
  const cls = openClass();
  const on = date || editDate();
  if (!cls || !getDoc() || !writableDate(on)) return;
  if (stateOf(cls.id, on) === DID_NOT_MEET) return;

  const cleared = Object.keys(marksOf(recordFor(cls.id, on))).length;
  update((d) => {
    const list = listIn(d);
    const written = { classId: cls.id, date: on, exception: DROPPED };
    const index = list.findIndex((r) => r && r.classId === cls.id && r.date === on);
    if (index >= 0) list[index] = written;
    else list.push(written);
  });

  paintColumn(on);
  paintActions();
  announce(cls.name + ' did not meet on ' + spokenDate(on) + '.'
    + (cleared ? ' The ' + cleared + (cleared === 1 ? ' mark' : ' marks')
      + ' already on it were cleared.' : ''));
}

/* And one tap back. The record goes entirely, which leaves the day NOT TAKEN YET rather than taken:
   taking back "the class did not meet" is not the same as claiming everyone was there, and the
   teacher who taps this is usually about to mark the class properly. */
export function undropClass(date) {
  const cls = openClass();
  const on = date || editDate();
  if (!cls || !getDoc() || !writableDate(on)) return;
  if (stateOf(cls.id, on) !== DID_NOT_MEET) return;

  update((d) => removeRecord(d, cls.id, on));
  paintColumn(on);
  paintActions();
  announce(cls.name + ' met after all on ' + spokenDate(on)
    + '. Its attendance is not taken yet.');
}

/* ────────────────────────────── moving around the grid ──────────────────────────────

   None of these writes anything. They move the window, unlock a column, or narrow the list, and
   every one of them ends in a render rather than in a patch, because what they change is which
   rows and which columns exist. */

/* The deliberate unlock. One past column at a time — a screen where every past day is live is a
   screen where a mis-tap two columns left is a mark on a day the teacher was not thinking about. */
export function editPastDay(date) {
  if (!writableDate(date) || date === todayISO()) return;
  editingPast = date;
  renderAttendance();
  announce('Editing ' + spokenDate(date) + '. This is not today.');
}

export function lockPastDay() {
  if (!editingPast) return;
  const was = editingPast;
  editingPast = null;
  renderAttendance();
  announce('Finished editing ' + spokenDate(was) + '. Back on today.');
}

/*
  Paging, in whole windows. "Earlier" goes back six weekdays at a time, which puts a date two weeks
  behind two taps away — the acceptance line this control exists for. "Later" is clamped at the
  window that ends today, and that clamp is the visible half of "future dates are blocked": the
  button is there, disabled, saying why, rather than absent and unexplained.

  Paging away from today locks any unlocked past column, because the strip that says WHICH day you
  are editing is only honest while that day is on screen.
*/
export function pageDays(direction) {
  const before = pageOffset;
  if (direction === 'today') pageOffset = 0;
  else if (direction === 'earlier') pageOffset += 1;
  else if (direction === 'later') pageOffset = Math.max(0, pageOffset - 1);
  else return;
  if (pageOffset === before && direction !== 'today') return;
  editingPast = null;
  renderAttendance();
  const shown = dayColumns(dayColumnCount(), pageOffset, todayISO());
  announce(pageOffset === 0 ? 'Back to this week, ending today.'
    : 'Showing ' + spokenDate(shown[shown.length - 1]) + ' to ' + spokenDate(shown[0]) + '.');
}

/* Search, filter and sort all rebuild the ROWS and nothing else. The search field is markup in
   index.html rather than something this file creates, precisely so that a keystroke cannot destroy
   the element the keystroke came from — the whole grid re-rendering under a teacher's finger is
   how a search box loses focus mid-word. */
export function setSearch(value) {
  searchText = String(value || '').trim().toLowerCase();
  renderRows();
}

export function setFilter(code) {
  filterCode = code === 'all' || MARKS.some((m) => m.code === code) ? code : 'all';
  paintToolbar();
  renderRows();
}

export function setSort(which) {
  sortBy = which === 'first' ? 'first' : 'last';
  paintToolbar();
  renderRows();
}

/* ────────────────────────────── the roster, in the order this screen reads it ──────────────────

   Sorted by surname then first name by default — a decision src/roster.js's header hands to this
   work order by name ("WO-2.1's marking screen is where an order that is not hers gets decided").

   The roster itself renders in the order the teacher pasted, because that is her list and a second
   opinion about it there would be one she can see. Here the question is different: two students
   have to be FOUND among twenty-six in a few seconds, standing up, while the room fills. A pasted
   SIS list is usually already alphabetical, so sorting changes nothing in the common case and
   guarantees the order in the case where she typed names in as they arrived. The First/Last pair
   above it is Roll Call!'s `.sort-btn` pair, and it exists because a teacher who knows a student by
   their first name should not have to translate. */

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
  const first = sortBy === 'first';
  return rosterOf(cls).slice().sort((a, b) => {
    const lead = first
      ? String(a.first || '').localeCompare(String(b.first || ''))
      : String(a.last || '').localeCompare(String(b.last || ''));
    if (lead !== 0) return lead;
    return first
      ? String(a.last || '').localeCompare(String(b.last || ''))
      : String(a.first || '').localeCompare(String(b.first || ''));
  });
}

/*
  The rows actually drawn: the marking order, narrowed by the search box and by the filter pills.

  THE FILTER READS THE COLUMN THAT ACCEPTS EDITS, not the whole window. "Show me who was absent" is
  a question about the day being marked, and a pill that answered it across six days would answer a
  question nobody asked. `Present` means "no stored mark on that date", which is what present is —
  so on a day that has not been taken yet every student matches it, and the copy under the empty
  list says so rather than pretending otherwise.
*/
function visibleStudents(cls) {
  const on = editDate();
  const marks = marksOf(recordFor(cls.id, on));
  return markingOrder(cls).filter((s) => {
    if (searchText && rosterName(s).toLowerCase().indexOf(searchText) < 0
      && fullName(s).toLowerCase().indexOf(searchText) < 0) return false;
    if (filterCode === 'all') return true;
    return (marks[s.id] || PRESENT) === filterCode;
  });
}

/* ────────────────────────────── rendering ──────────────────────────────

   createElement and textContent throughout, never innerHTML: a student's name is pasted out of a
   school system, and a student called "Bo <b>x</b>" has to be a student called "Bo <b>x</b>"
   (src/roster.js says the same thing over the same string). */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function actionButton(label, hook, value, extraClass) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'class-action-btn' + (extraClass ? ' ' + extraClass : '');
  btn.setAttribute(hook, value === undefined ? '' : value);
  btn.textContent = label;
  return btn;
}

/* The classes a column's header and every cell under it wear. Written once and applied to both,
   which is what makes "distinguishable in the header AND in the cells" one fact rather than two
   that can drift apart. */
function columnClasses(date, state, today, editing) {
  return 'attendance-col-' + state
    + (date === today ? ' attendance-col-today' : '')
    + (editing ? ' attendance-col-editing' : '');
}

/*
  ONE CELL. A <button> where the column accepts edits, an inert <span> where it does not — rather
  than a disabled button, because a disabled control on a past column reads as something broken and
  a plain span reads as a record.

  The glyph is never blank. See the header comment: an empty cell on a taken day and an empty cell
  on a day nobody took would be the same picture, and the teacher would read a forgotten Tuesday as
  a Tuesday when everyone showed up.
*/
function cellFor(student, date, state, code, editable) {
  let glyph = code;
  let tone = code;
  let said;
  if (state === DID_NOT_MEET) { glyph = '–'; tone = 'none'; said = 'the class did not meet'; }
  else if (state === NOT_TAKEN) { glyph = '?'; tone = 'untaken'; said = 'not taken yet'; }
  else {
    /* A code this app does not know can only arrive from a hand-edited or foreign document. It is
       shown as itself rather than dropped — the same harmless-failure posture src/roster.js takes
       over a roster id that names nobody — because silently rendering it as present would hide a
       mark the teacher can see in her backup file. */
    const known = MARKS.filter((m) => m.code === code)[0];
    said = known ? known.phrase : 'marked ' + code;
  }

  const node = document.createElement(editable ? 'button' : 'span');
  node.className = 'attendance-cell attendance-cell-' + tone + (editable ? '' : ' locked');
  node.textContent = glyph;
  /* A one-glyph control with no accessible name is a control a screen reader reads as nothing at
     all — style guide §7. The name carries whose row and which day, because a hundred and fifty
     cells otherwise read as a hundred and fifty buttons called "P". */
  const label = fullName(student) + ' — ' + spokenDate(date) + ': ' + said;
  if (editable) {
    node.type = 'button';
    node.setAttribute('data-attendance-cell', student.id);
    node.setAttribute('data-attendance-date', date);
    const next = MARKS.filter((m) => m.code === CYCLE[(CYCLE.indexOf(code) + 1) % CYCLE.length])[0];
    node.setAttribute('aria-label', label + '. Tap for ' + next.word.toLowerCase() + '.');
    node.title = said.charAt(0).toUpperCase() + said.slice(1) + ' · tap for ' + next.word;
  } else {
    node.setAttribute('aria-label', label);
    node.title = said;
  }
  return node;
}

/*
  ONE COLUMN HEAD: the weekday, the date, the state IN WORDS, and the control that belongs to that
  day. The state chip is the half of "an empty cell is ambiguous" that lives above the column; the
  cells carry the other half.

  The control is one button and its identity is the column's state and position:
    today            🚫 drop the class, or ↩ take that back — one tap, no confirm
    a past column    ✏ unlock it, or Done to close it again
  There is no third case, because there is no column after today.
*/
function dayHead(date, state, today, editing) {
  const th = el('th', 'attendance-day ' + columnClasses(date, state, today, editing));
  th.setAttribute('scope', 'col');
  th.setAttribute('data-attendance-col', date);

  th.append(el('span', 'attendance-day-dow', dayAbbr(date)));
  th.append(el('span', 'attendance-day-date', shortDate(date)));
  th.append(el('span', 'attendance-day-state', stateChip(state)));

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'attendance-day-btn';
  if (date === today) {
    if (state === DID_NOT_MEET) {
      btn.setAttribute('data-attendance-undrop', date);
      btn.textContent = '↩';
      btn.title = 'The class met after all';
      btn.setAttribute('aria-label', 'The class met after all on ' + spokenDate(date));
    } else {
      btn.setAttribute('data-attendance-drop', date);
      btn.textContent = '🚫';
      btn.title = 'This class did not meet today';
      btn.setAttribute('aria-label', 'Record that this class did not meet on ' + spokenDate(date));
    }
  } else if (editing) {
    /* The same pencil, pressed. Roll Call! swaps it for a button labelled "Done" (dashboard.html
       :3998); this one does not, because "Done" on a screen with no submit step is a word that
       reads as a commit — and this app's own harness greps for exactly that word for exactly that
       reason. A toggle with `aria-pressed` says the same thing without borrowing the vocabulary of
       a step that must never exist here. */
    btn.setAttribute('data-attendance-lock', '');
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    btn.textContent = '✏️';
    btn.title = 'Stop editing this past day';
    btn.setAttribute('aria-label', 'Stop editing ' + spokenDate(date) + ' and go back to today');
  } else {
    btn.setAttribute('data-attendance-edit', date);
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = '✏️';
    btn.title = 'Edit this past day';
    btn.setAttribute('aria-label', 'Edit attendance for ' + spokenDate(date));
  }
  th.append(btn);
  return th;
}

/*
  ONE COLUMN, REPAINTED IN PLACE, after a write that changed what that day means. The header and
  every cell under it are rebuilt; nothing else on the table is touched, so a table twenty-six rows
  long does not jump back to the top under the thumb of someone half way down it.

  The filter is deliberately NOT re-applied here. A row that vanishes the instant it is marked is a
  row the next tap lands under, and the teacher marking two absences in a filtered list would be
  aiming at a moving target. Filters apply when the rows are drawn.
*/
function paintColumn(date) {
  const cls = openClass();
  const head = document.getElementById(HEAD_ID);
  const body = document.getElementById(BODY_ID);
  if (!cls || !head || !body) return;

  const today = todayISO();
  const editing = date === editDate() && date !== today;
  const state = stateOf(cls.id, date);
  const marks = marksOf(recordFor(cls.id, date));
  const editable = date === editDate() && state !== DID_NOT_MEET && writableDate(date);

  const th = head.querySelector('th[data-attendance-col="' + date + '"]');
  if (th) th.replaceWith(dayHead(date, state, today, editing));

  body.querySelectorAll('td[data-attendance-col="' + date + '"]').forEach((td) => {
    const student = findStudent(td.getAttribute('data-attendance-student'));
    if (!student) return;
    td.className = 'attendance-cell-td ' + columnClasses(date, state, today, editing);
    td.textContent = '';
    td.append(cellFor(student, date, state, marks[student.id] || PRESENT, editable));
  });
}

/*
  THE STRIP THAT SAYS YOU ARE NOT ON TODAY, and the acceptance line it answers is "visible in a
  glance, on an iPad, in a classroom". So it is a full-width band above the grid with a coloured
  edge and a way back on it, not a tint on a column — a tint is what the column already has, and a
  tint alone is exactly the fine print this work order keeps refusing.

  Two ways to be off today, and both get the same strip: a past column is unlocked, or the window
  has been paged back so today is not on screen at all.
*/
function paintBanner(columns) {
  const banner = document.getElementById(BANNER_ID);
  if (!banner) return;
  const today = todayISO();
  const on = editDate();
  const todayShown = columns.indexOf(today) >= 0;

  banner.textContent = '';
  if (on === today && todayShown) { banner.classList.add('hidden'); return; }

  banner.classList.remove('hidden');
  const text = on !== today
    ? 'You are editing ' + spokenDate(on) + ' — not today.'
    : 'Showing ' + spokenDate(columns[columns.length - 1]) + ' to ' + spokenDate(columns[0])
      + '. Today is not on screen.';
  banner.append(el('span', 'attendance-banner-text', text));
  const back = actionButton('Back to today', 'data-attendance-page', 'today');
  back.classList.add('attendance-banner-btn');
  banner.append(back);
}

/*
  The state line, the class-level controls and the note — everything above the grid that describes
  ONE DAY. That day is the one accepting edits, which is today unless a past column is unlocked.

  Repainted on its own after a write, because the grid below it must not be rebuilt.
*/
function paintActions() {
  const cls = openClass();
  const on = editDate();
  const dateEl = document.getElementById(DATE_ID);
  const stateEl = document.getElementById(STATE_ID);
  const actions = document.getElementById(ACTIONS_ID);
  const note = document.getElementById(NOTE_ID);
  if (dateEl) dateEl.textContent = spokenDate(on);
  if (!stateEl || !actions || !note) return;

  const summary = cls ? stateSummary(cls.id, on)
    : { state: NOT_TAKEN, text: 'No class is open', marked: 0 };
  stateEl.textContent = summary.text;
  stateEl.className = 'attendance-state ' + summary.state;

  actions.textContent = '';
  note.textContent = '';
  note.classList.add('hidden');
  if (!cls) return;

  if (summary.state === DID_NOT_MEET) {
    actions.append(actionButton('The class met after all', 'data-attendance-undrop', on, 'restore'));
    note.textContent = 'Nothing is recorded for this day, and nothing counts toward anything. '
      + 'Undoing this leaves it not taken yet, ready to mark.';
    note.classList.remove('hidden');
    return;
  }

  const record = recordFor(cls.id, on);
  const marked = Object.keys(marksOf(record)).length;
  if (summary.state === TAKEN && marked === 0) {
    /* The same control that took the class, now pressed, now meaning "actually, I have not taken
       this". Offered only here — with a mark on the record it is not offered at all, because
       nothing on this screen may destroy a mark by being tapped a second time. */
    const undo = actionButton('✓ Everyone’s here', 'data-attendance-untake', on);
    /* Its own class rather than a variant of `.class-action-btn`: shell.css owns that name and its
       variants, and src/shell.css's header sets the rule that two stylesheets never style one
       class. So the pressed look is `.attendance-toggle-on`, declared in this screen's own sheet
       and winning on load order. */
    undo.classList.add('attendance-toggle-on');
    undo.setAttribute('aria-pressed', 'true');
    undo.title = 'Taken, with everyone present. Tap to take that back.';
    actions.append(undo);
  } else if (summary.state === NOT_TAKEN) {
    const take = actionButton('Everyone’s here', 'data-attendance-take', on, 'primary');
    take.setAttribute('aria-pressed', 'false');
    take.title = 'Record this class as met, with nobody absent.';
    actions.append(take);
  }

  const drop = actionButton('Didn’t meet', 'data-attendance-drop', on, 'archive');
  drop.title = marked
    ? 'Record that this class did not meet. The ' + marked
      + (marked === 1 ? ' mark' : ' marks') + ' on it will be cleared.'
    : 'Record that this class did not meet.';
  actions.append(drop);
}

/* The pills and the sort pair, which are markup in index.html and only have their pressed state
   set from here — the same arrangement as the search field, and for the same reason: a control the
   renderer re-creates is a control that cannot hold focus. */
function paintToolbar() {
  const pills = document.getElementById(PILLS_ID);
  if (pills) pills.querySelectorAll('[data-attendance-filter]').forEach((p) => {
    const on = p.getAttribute('data-attendance-filter') === filterCode;
    p.classList.toggle('active', on);
    p.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  const sort = document.getElementById(SORT_ID);
  if (sort) sort.querySelectorAll('[data-attendance-sort]').forEach((b) => {
    const on = b.getAttribute('data-attendance-sort') === sortBy;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

/* Earlier · Today · Later. "Later" is disabled at the window that ends today and says why — the
   visible half of the rule that there is no future column. */
function paintPager(columns) {
  const pager = document.getElementById(PAGER_ID);
  if (!pager) return;
  pager.textContent = '';
  if (!openClass()) return;

  const earlier = actionButton('◀ Earlier', 'data-attendance-page', 'earlier');
  earlier.title = 'The six weekdays before these';
  pager.append(earlier);

  pager.append(el('span', 'attendance-pager-range',
    columns.length ? shortDate(columns[columns.length - 1]) + ' – ' + shortDate(columns[0]) : ''));

  const today = actionButton('Today', 'data-attendance-page', 'today');
  today.disabled = pageOffset === 0 && !editingPast;
  today.title = today.disabled ? 'You are on today' : 'Back to the week ending today';
  pager.append(today);

  const later = actionButton('Later ▶', 'data-attendance-page', 'later');
  later.disabled = pageOffset === 0;
  later.title = later.disabled
    ? 'Today is the last column there is — tomorrow’s attendance is not something to record yet'
    : 'The six weekdays after these';
  pager.append(later);
}

/* The rows, and only the rows. Search, filter and sort come through here; a write does not. */
function renderRows() {
  const cls = openClass();
  const body = document.getElementById(BODY_ID);
  const empty = document.getElementById(EMPTY_ID);
  const wrap = document.getElementById(WRAP_ID);
  if (!body || !empty || !wrap) return;

  body.textContent = '';
  const doc = getDoc();
  /*
    THE GRID KEEPS ITS HEAD WHENEVER A CLASS IS OPEN, even with nothing under it. A class whose
    roster has not been pasted yet still has to be markable as met or as not meeting, and both of
    those controls live in a column head — take the table off the screen and an empty class becomes
    a class that cannot be dropped. Only the no-year and no-class cases hide it, because in those
    there are no columns to show in the first place.
  */
  const say = (text, keepGrid) => {
    empty.textContent = text;
    empty.classList.remove('hidden');
    wrap.classList.toggle('hidden', !keepGrid);
  };
  if (!doc) return say('No school year is open, so there is nothing to mark.', false);
  if (!cls) return say('No class is open. Attendance belongs to a class — open one from the '
    + 'class bar first.', false);

  const all = rosterOf(cls);
  if (!all.length) return say('No students in ' + cls.name + ' yet. Add the roster and they appear '
    + 'here — the class can still be marked as met, or as not meeting, from the column heads '
    + 'above.', true);

  const students = visibleStudents(cls);
  if (!students.length) {
    return say('No student in ' + cls.name + ' matches that. Clear the search box, or tap All, to '
      + 'see the whole class again.', true);
  }
  empty.textContent = '';
  empty.classList.add('hidden');
  wrap.classList.remove('hidden');

  const today = todayISO();
  const on = editDate();
  const columns = dayColumns(dayColumnCount(), pageOffset, today);
  /* Read once per column rather than once per cell: twenty-six rows times six columns is a hundred
     and fifty-six lookups through the whole attendance array otherwise. */
  const perColumn = columns.map((date) => {
    const state = stateOf(cls.id, date);
    return { date: date, state: state, marks: marksOf(recordFor(cls.id, date)),
      editing: date === on && date !== today,
      editable: date === on && state !== DID_NOT_MEET && writableDate(date) };
  });

  students.forEach((student) => {
    const row = el('tr');
    row.setAttribute('data-attendance-row', student.id);
    /* Roll Call!'s `.student-cell` — a flex row of avatar then name, `gap: 9px`. The avatar is
       shell.css's `.avatar`, worn as-is and never restyled from this sheet, the same one the roster
       row and the home card wear. It carries no information a name does not: initials and one of
       ten colours, derived from the id and stored nowhere, which is also why presentation mode has
       nothing to suppress here. */
    const name = el('th', 'attendance-name');
    name.setAttribute('scope', 'row');
    const cell = el('div', 'attendance-student-cell');
    const avatar = el('div', 'avatar ' + avatarClass(student.id), initials(rosterName(student)));
    avatar.setAttribute('aria-hidden', 'true');
    cell.append(avatar, el('span', 'attendance-student-name', rosterName(student)));
    name.append(cell);
    /* The whole name stays reachable on `title`, the same arrangement a class card makes. */
    name.title = rosterName(student);
    row.append(name);

    perColumn.forEach((col) => {
      const td = el('td', 'attendance-cell-td '
        + columnClasses(col.date, col.state, today, col.editing));
      td.setAttribute('data-attendance-col', col.date);
      td.setAttribute('data-attendance-student', student.id);
      td.append(cellFor(student, col.date, col.state,
        col.marks[student.id] || PRESENT, col.editable));
      row.append(td);
    });
    body.append(row);
  });
}

/* The whole screen, from the open document. Called at open and after anything that changes what
   the screen is MADE of — the window moved, a past column unlocked. NOT after a mark; see
   paintColumn. */
export function renderAttendance() {
  const cls = openClass();
  const today = todayISO();
  const columns = dayColumns(dayColumnCount(), pageOffset, today);
  const nameEl = document.getElementById(CLASS_NAME_ID);
  const head = document.getElementById(HEAD_ID);
  const caption = document.getElementById(CAPTION_ID);
  if (nameEl) nameEl.textContent = cls ? cls.name : 'no class';

  paintBanner(columns);
  paintActions();
  paintToolbar();
  paintPager(columns);

  if (caption) {
    caption.textContent = 'Attendance for ' + (cls ? cls.name : 'no class')
      + '. Students are rows and the last ' + columns.length
      + ' weekdays are columns, most recent first'
      + (pageOffset === 0 ? ', starting with today.' : '.');
  }

  if (head) {
    head.textContent = '';
    if (cls) {
      const row = el('tr');
      const corner = el('th', 'attendance-corner', 'Student');
      corner.setAttribute('scope', 'col');
      row.append(corner);
      const on = editDate();
      columns.forEach((date) => row.append(dayHead(date, stateOf(cls.id, date), today,
        date === on && date !== today)));
      head.append(row);
    }
  }
  renderRows();
}

/*
  ARRIVING AT THE SCREEN. Called by src/shell.js when a class is opened — from a card or from a
  header tab, which are one control in two places — immediately before the paint.

  IT NO LONGER OPENS ANYTHING (WO-1.13). Until then this screen was a dialog and this function
  ended in openModal(); it is a view in <main> now, so arriving is navigation and src/views.js does
  it. What is left is the half that was always this module's: putting the screen back to its
  starting state. It does not render either — src/shell.js paints it in the same chain that redraws
  the cards behind it, so a class change is one repaint rather than two.

  EVERY ARRIVAL STARTS ON TODAY, unpaged, unfiltered and unsearched. The screen is opened with a
  class walking through the door; finding it still showing last Tuesday filtered to tardies, because
  that is where it was left an hour ago, would cost the seconds this whole design is about. That is
  why this is called on every arrival and NOT on a repaint: a mark made half way down the list must
  not put the screen back to the top of it.
*/
export function resetRegistry() {
  editingPast = null;
  pageOffset = 0;
  searchText = '';
  filterCode = 'all';
  sortBy = 'last';
  const search = document.getElementById(SEARCH_ID);
  if (search) search.value = '';
}
