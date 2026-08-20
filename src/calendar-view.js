/*
  The month and the week, drawn — Phase 6's first surface with a DOM in it (WO-6.3).

  ── WHAT THIS FILE IS, AND THE THREE IT IS NOT ──

  It is a RENDERER. It reads the open year document through two modules and writes nothing at all:
  src/calendar.js answers what the teacher AUTHORED (`doc.events`), src/calendar-derived.js answers
  everything she did not (due dates, term edges, which classes met, IEP/504 review dates), and this
  file arranges the answers into cells. There is no fifth kind computed here, no cache of a month
  that has already been drawn, and no `update()` anywhere below.

  That is worth stating flatly because a grid is exactly the surface that makes a cache look free.
  A month re-read on every paint is four array walks over a document that fits in memory, and the
  cost of the other arrangement is the second truth docs/data-model.md § "Events: only what can't be
  derived" forbids: move an assignment's due date and a cached month goes on showing the old day,
  correctly by its own lights, until something remembers to go and fix the copy. WO-6.3's fifth
  acceptance line is that claim asked as a question, and the reason it can be answered "yes, with no
  other action" is that there is nothing here to invalidate.

  ── AND THE ONE THING THIS SCREEN MUST NEVER LEARN ──

  IT DOES NOT KNOW WHICH CLASSES ARE EXPECTED TO MEET ON A DATE, and a month grid is the surface
  that makes that look necessary. plans/rotating-schedule.md is a settled decision record: a cycle
  model was designed and removed the same day, because the rotation also changes at random, so a
  second source of truth about which classes meet has to be corrected by hand anyway.

  THE LOOP BELOW IS NOT THAT MODEL, AND THIS IS THE PARAGRAPH THAT SAYS SO. buildDays() walks a
  calendar month a day at a time, because a month grid is thirty-five cells and something has to
  count them. What it puts IN a cell is only what came back from the two readers — an event that
  covers the date, a due date somebody typed, a term edge, an attendance record that exists. A
  weekday nobody wrote anything down about gets a cell with a number in it and nothing else. Draw
  nothing where nothing was recorded (CLAUDE.md): the fourth attendance state, NOT_TAKEN, is the
  did-I-forget answer that belongs on the home screen and is a wall of amber here, and
  src/calendar-derived.js already refuses to carry it onto a date. Nothing here puts it back.

  ── THE MEETING LEDGER IS BEHIND THE CLASS FILTER, AND THAT IS A DECISION (WO-6.3) ──

  Five classes across twenty weekdays is a hundred `Taken` chips, which is a wall of green in place
  of the wall of amber the paragraph above is about — the same failure in the reassuring colour. So
  a per-class meeting state is drawn when the window is A WEEK, where a cell has the room for it, or
  when the class filter names ONE class, which is what the filter is for: the owner teaches five and
  rarely wants all of them at once. With every class showing, a month says what is ON the calendar —
  what was authored, what is due, where the terms turn, whose review is coming — and picking a class
  is one tap away. The screen says so in words under the grid rather than leaving the absence to be
  discovered, because an absence and a bug look identical (tools/README.md § "Two rules that follow").

  ── PRESENTATION MODE IS INHERITED, NOT RE-DECIDED ──

  There is no `presentationMode()` test in this file and there must never be one. A review date
  reaches this screen through src/calendar-derived.js's reviewDatesIn(), which asks src/supports.js
  its one visibility question and returns an EMPTY LIST while the mode is on. So a cell shows nothing
  at all where a review sits, rather than a blank chip or an unlabelled marker, and it does so
  because this file never heard of the preference. That is the whole design of src/supports.js's
  choke point: a screen written in a later phase inherits the suppression without its author knowing
  the switch exists, and a per-screen `if` is the failure that work order named.

  (That question is not named here on purpose, and src/home.js's header makes the identical dodge for
  the identical reason: tools/wo-sweep.mjs greps for the function by name to report which screens
  ASK it, and a paragraph saying this one does not would arrive in that list as one that does. The
  file that asks is src/calendar-derived.js, and it is on the list.)

  What this file does with a review is therefore the whole of what it is allowed to do with one: put
  the DATE and the NAME on a chip and open that student's own editor when it is tapped. No plan type,
  no accommodation, no medical or behavior-plan text, no case manager — none of them is on the record
  this screen is handed, which is a guarantee src/calendar-derived.js makes by construction and
  tools/wo-sweep.mjs § 17 asserts field by field.

  ── AND NONE OF IT REACHES A PRINTER ──

  src/calendar-view.css carries the @media print block and this file carries the gate that selects
  it: `data-calendar-print`, on <body>, answered at `beforeprint` from currentView(). The control
  that ASKS for a print is `data-calendar-month-print`, a different string on purpose —
  src/print-gate.js's standing invariant, bought by the owner's own stuck-attribute bug, where a
  <body> attribute that was also a click hook matched every click on the page for as long as the
  gate was on. The review chip is taken off the printed sheet whatever presentation mode says, and
  the stylesheet says why it is taken off TWICE.

  ── WHAT IS HELD HERE, AND WHY NONE OF IT IS REMEMBERED ──

  Three values: which date the window is anchored on, whether the window is a month or a week, and
  which class the filter names. None of the three is written to localStorage, and that is the call
  src/attendance.js's own filter pills make for the same reason: a remembered filter is a month grid
  quietly hiding four fifths of the school year from a teacher who does not remember setting it,
  which is the one failure a calendar cannot afford. Every arrival starts on today and on the month.

  AND THE THIRD OF THE THREE IS NOW DECIDED BY THE DOOR YOU CAME THROUGH (WO-6.6, the owner's ruling
  of 2026-08-19). This paragraph ended "with every class showing" until that day. The first two
  thirds stand exactly as written; what changed is that resetCalendar() is HANDED the class the
  arrival is about — nothing from the home screen's button, the open class from the Calendar pill
  inside a class — and the Calendar pill inside Period 3 therefore opens on Period 3's month.

  THAT IS NOT THE REMEMBERED FILTER THIS PARAGRAPH REFUSES, and the difference is the whole of why
  it was allowed. A remembered filter is a value that outlives the reason for it: nobody set it
  today, nothing on screen says it is on, and four fifths of the year is missing. An arrival filter
  is recomputed from the door on every arrival, it is the class whose screen the teacher was standing
  on one tap ago, and the toolbar's *All classes* is beside it saying so. Nothing here is written to
  localStorage by that work order either — src/views.js's `openView` is the only preference any of
  this touches, and it writes this view down as `class`.
*/

import { getDoc } from './store.js';
import { getActiveClasses } from './classes.js';
import { shortDate, weekdayShortDate } from './date-text.js';
import { announce } from './live-region.js';
import { currentView } from './views.js';
import { registerPrintGate } from './print-gate.js';
/* The authored half — the events a teacher typed, and the rules for reading a range. */
import { eventsIn, coversDate, coversClass, kindInfo, isDate, isAttendanceKind, shiftDays, weekdayOf }
  from './calendar.js';
/* The derived half. Every function here is a READ; this module adds no fifth kind and computes no
   item of its own (see the header). */
import * as derived from './calendar-derived.js';
/* Today, and the ONE place in the app that decides what a class's day says. A meeting chip wears
   src/attendance.js's own sentence rather than a second wording of it, for the reason src/home.js
   gives about the card: the calendar and the screen it opens are one answer about one class, and
   they must not say it two ways. */
import { stateSummary, todayISO } from './attendance.js';

const RANGE_ID = 'calendarRange';
const GRID_ID = 'calendarGrid';
const CLASSES_ID = 'calendarClasses';
const HINT_ID = 'calendarHint';
const EMPTY_ID = 'calendarEmpty';
const EMPTY_LEAD_ID = 'calendarEmptyLead';
const SCALE_MONTH_ID = 'calendarScaleMonth';
const SCALE_WEEK_ID = 'calendarScaleWeek';
const STAMP_ID = 'calendarPrintStamp';

/* The <body> attribute src/calendar-view.css's @media print block is selected under. NEVER a click
   hook: `closest()` walks up to <body>, so one string doing both jobs matches every click on screen
   for as long as the gate is on, and a print the teacher blocks leaves it on by design.
   src/print-gate.js carries the scar in full; the control that asks is `data-calendar-month-print`. */
const PRINT_ATTR = 'data-calendar-print';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
/* Sunday first, which is what an American school calendar reads as. Written out rather than asked
   of Intl: this app formats every other date from a literal table (src/date-text.js), and a locale
   that reordered the columns would move the grid under a teacher for no reason she chose. */
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH = 'month';
const WEEK = 'week';

/* ── THE VIEW STATE ──
   Three values, none of them student data and none of them persisted — the header says why. */
let anchor = '';
let scale = MONTH;
let filterClassId = '';

/* ────────────────────────────── the window ──────────────────────────────

   Date arithmetic on ISO strings, stepped through src/calendar.js's shiftDays() and asked about
   through its weekdayOf(). Both of those live over there because that file carries the UTC scar in
   full: `new Date('2026-11-26')` is a UTC midnight read through the LOCAL clock, one timezone away
   from being the day before, and a grid built on it would draw a whole month one column out. There
   is no `new Date` in this file except the clock src/attendance.js's todayISO() reads. */

function monthStartOf(iso) { return String(iso).slice(0, 8) + '01'; }

/* The first of the following month, by number rather than by stepping 28 days and hoping. */
function nextMonthStartOf(iso) {
  const y = Number(String(iso).slice(0, 4));
  const m = Number(String(iso).slice(5, 7));
  const pad = (n) => (n < 10 ? '0' : '') + n;
  return (m === 12 ? y + 1 : y) + '-' + pad(m === 12 ? 1 : m + 1) + '-01';
}

function monthEndOf(iso) { return shiftDays(nextMonthStartOf(iso), -1); }
function weekStartOf(iso) { return shiftDays(iso, -weekdayOf(iso)); }

/*
  WHAT IS ON SCREEN: the range the heading names, and the range the GRID covers, which are not the
  same thing in a month. A month grid begins on the Sunday on or before the 1st and ends on the
  Saturday on or after the last day, so it holds whole weeks — and the days it borrows from the
  months either side are real days that can hold real events. They are drawn, dimmed, and they
  count: a break that runs from October 30 to November 3 has to be visible from both months, or a
  teacher checking November finds it starting on the 4th.
*/
function windowOf() {
  const on = isDate(anchor) ? anchor : todayISO();
  if (scale === WEEK) {
    const from = weekStartOf(on);
    return { from: from, to: shiftDays(from, 6), gridFrom: from, gridTo: shiftDays(from, 6) };
  }
  const from = monthStartOf(on);
  const to = monthEndOf(on);
  return { from: from, to: to, gridFrom: weekStartOf(from), gridTo: shiftDays(weekStartOf(to), 6) };
}

/* What the heading says. A month is its name and year; a week is its two edges, which is the phrase
   a teacher checks a week against. */
function rangeText(win) {
  if (scale === WEEK) return weekdayShortDate(win.from) + ' – ' + weekdayShortDate(win.to);
  const y = String(win.from).slice(0, 4);
  const m = Number(String(win.from).slice(5, 7));
  return MONTHS[m - 1] + ' ' + y;
}

/* ────────────────────────────── what goes in a cell ──────────────────────────────

   One shape for every chip, whoever answered it: what it says, what it says out loud, which palette
   it wears, and the four attributes a tap is routed on. Nothing about a student's file is on it —
   see the header, and src/calendar-derived.js's own reviewDatesIn().
*/
function chip(kind, label, said, tone, ref, classId, date) {
  return { kind: kind, label: label, said: said, tone: tone,
    ref: ref || '', classId: classId || '', date: date };
}

function classNameOf(list, id) {
  const cls = list.filter((c) => c.id === id)[0];
  return cls ? cls.name : '';
}

/* Is this student on the filtered class's roster — the question src/calendar-derived.js declined to
   answer on this screen's behalf, and said so in as many words: *"A review belongs to a student and
   not to a class, so there is no `classId` to filter on. What a class filter should do with one of
   these is WO-6.3's decision."*

   THE DECISION: a review follows its student through the filter. Filtering to Period 3 means "show
   me Period 3's month", and a review for a student in Period 3 is exactly the thing that month is
   for; a review for a student the teacher does not have that period is noise she asked to be rid
   of. It is a plain roster read — the same array src/roster.js and src/classes.js walk — and it
   touches nothing in `supports`: the id came off the derived record, and what is being asked is
   which class a student is in, which is not a fact about a plan. */
function onRoster(cls, studentId) {
  return !!cls && Array.isArray(cls.roster) && cls.roster.indexOf(studentId) >= 0;
}

/*
  EVERY DAY IN THE GRID, WITH WHAT SITS ON IT.

  Authored first, then derived, and that order is fixed rather than incidental: what the teacher
  typed is what she is looking for, and a cell whose chips reshuffle between two renders of the same
  month is a cell she cannot learn to read (src/calendar-derived.js's DERIVED_KINDS makes the same
  argument about its own four). Within each half the source module's order stands.
*/
function buildDays(doc, win) {
  const classes = getActiveClasses();
  const filtered = filterClassId
    ? classes.filter((c) => c.id === filterClassId)[0] || null
    : null;
  const days = [];
  const at = Object.create(null);
  for (let date = win.gridFrom, i = 0; date <= win.gridTo && i < 42; date = shiftDays(date, 1), i++) {
    const cell = { date: date, items: [], inRange: date >= win.from && date <= win.to };
    days.push(cell);
    at[date] = cell;
  }

  /* ── the authored half ──
     An event is drawn on EVERY day of its range, not only on the first: a week-long break is one
     entry in `doc.events` (src/calendar.js) and five cells on a grid, and a break that appeared on
     the Monday alone would be a break a teacher reads as one day off. coversDate() is the range
     test the whole app already shares, and coversClass() is the filter — an event that names no
     class is school-wide and survives every filter, which is the data model's own rule. */
  eventsIn(doc).forEach((event) => {
    if (!event || !kindInfo(event.kind)) return;
    if (filterClassId && !coversClass(event, filterClassId)) return;
    const info = kindInfo(event.kind);
    const title = String(event.title || '').trim();
    const spans = isDate(event.endDate) && event.endDate > event.date;
    days.forEach((cell) => {
      if (!coversDate(event, cell.date)) return;
      cell.items.push(chip(event.kind, title || info.word,
        info.word + (title ? ' · ' + title : '')
          + (spans ? ' · ' + shortDate(event.date) + ' to ' + shortDate(event.endDate) : ''),
        'event kind-' + event.kind, event.id, '', cell.date));
    });
  });

  /* ── the derived half ──
     One call over the whole grid, sorted by date and then by kind, exactly as WO-6.2 delivered it.
     Nothing below recomputes a row; what this loop does is decide which rows this screen SHOWS and
     what each one says. */
  derived.derivedItemsIn(doc, win.gridFrom, win.gridTo).forEach((item) => {
    const cell = at[item.date];
    if (!cell) return;

    if (item.kind === derived.REVIEW_DATE) {
      /* Suppressed by src/supports.js before it ever reached this loop while presentation mode is
         on — there is no branch here, and the header says why there must never be one. */
      if (filterClassId && !onRoster(filtered, item.studentId)) return;
      /* THE WORD IS ON THE CHIP, NOT IN THE COLOUR. A bare name on a cell says nothing a
         teacher can act on, and a palette standing in for the meaning is a legend she has to
         learn and a distinction she has to read across a room. "Review · Ada Probe" is the
         whole of it — a date (the cell it sits in) and a name, which is exactly what the
         acceptance line allows and exactly what src/calendar-derived.js hands over. There is no
         plan type here and no path to one. */
      cell.items.push(chip(item.kind, 'Review · ' + item.name,
        'Review · ' + item.name + ' · ' + shortDate(item.date),
        'review', item.studentId, '', item.date));
      return;
    }

    if (filterClassId && item.classId !== filterClassId) return;
    const who = filterClassId ? '' : classNameOf(classes, item.classId);

    if (item.kind === derived.ASSIGNMENT_DUE) {
      cell.items.push(chip(item.kind, item.title,
        'Due · ' + item.title + (who ? ' · ' + who : ''),
        'due', item.assignmentId, item.classId, item.date));
      return;
    }
    if (item.kind === derived.TERM_START || item.kind === derived.TERM_END) {
      const word = (item.kind === derived.TERM_START ? 'Term starts' : 'Term ends');
      cell.items.push(chip(item.kind, who ? who + ' · ' + word : word,
        word + ' · ' + (item.title || 'Untitled term') + (who ? ' · ' + who : ''),
        'term', item.termId, item.classId, item.date));
      return;
    }
    if (item.kind === derived.MEETING_STATE) {
      /* The wall, and the rule that keeps it down — see the header. A week has the room; a month
         has it once the teacher has said which class she is looking at. */
      if (scale !== WEEK && !filterClassId) return;
      /* src/attendance.js's own sentence, not a second wording of it. */
      const said = stateSummary(item.classId, item.date).text;
      cell.items.push(chip(item.kind, who ? who + ' · ' + said : said,
        (who ? who + ' · ' : '') + said,
        'meeting state-' + item.state, item.eventId, item.classId, item.date));
    }
  });

  return days;
}

/*
  THE WHOLE OF WHAT IS ON SCREEN, AS DATA, WITH NO DOM IN IT.

  The same build-it / hand-it-over split src/detail.js's detailModel() and src/grades-report.js's
  gradesRecord() use, and for the same two reasons. The first is that renderCalendar() below becomes
  a function that only draws: every decision about what belongs on a cell is made once, above.

  The second is that it can be asserted. "The class filter applies to derived items as well as
  authored ones" and "a derived due date moves with its assignment" are claims about which rows are
  in which cells, and reading them out of a rendered grid means a check that also has to be right
  about markup. tools/verify-shell.mjs reads this instead — and then reads the DOM as well, so that
  a model which is right about a grid nobody drew still fails.

  NOTHING FROM A STUDENT'S SUPPORT BLOCK IS ON THIS SHAPE, and there is no path to it: what a review
  is to this model is a date, a name and an id, which is the whole of what src/calendar-derived.js
  hands over.
*/
export function calendarModel() {
  const doc = getDoc();
  const win = windowOf();
  const days = doc ? buildDays(doc, win) : [];
  return {
    scale: scale,
    classId: filterClassId,
    from: win.from,
    to: win.to,
    gridFrom: win.gridFrom,
    gridTo: win.gridTo,
    label: rangeText(win),
    today: todayISO(),
    days: days,
    /* What the empty state is decided on: chips inside the range the heading names. A break bleeding
       in from the month before is drawn on a borrowed cell and does not make this month non-empty,
       because the teacher asked about this month. */
    count: days.reduce((n, d) => n + (d.inRange ? d.items.length : 0), 0),
  };
}

/* ────────────────────────────── drawing it ────────────────────────────── */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/*
  ONE CHIP, AND IT IS A <button>.

  Every item taps through to the thing that resolves it (WO-6.3's fourth acceptance line), so every
  item is a control and gets a control's keyboard path for free — tab order, Enter and Space, and
  the focus ring src/shell.css draws on :focus-visible and nothing in this repo ever suppresses.
  There is no roving tabindex and no grid role: this is a table of days holding buttons, which is
  what it is, and inventing a two-dimensional keyboard model over it would be a second navigation
  contract for one screen.

  The label is capped and ellipsised by the stylesheet rather than truncated here, so the whole
  sentence stays reachable: `title` for a pointer, aria-label for a screen reader, and the full text
  in the DOM for find-in-page. A renderer that cut the string would take all three away.
*/
function chipButton(item) {
  const button = el('button', 'calendar-chip ' + item.tone, item.label);
  button.type = 'button';
  button.setAttribute('data-calendar-item', '');
  button.setAttribute('data-calendar-kind', item.kind);
  button.setAttribute('data-calendar-ref', item.ref);
  button.setAttribute('data-calendar-class', item.classId);
  button.setAttribute('data-calendar-date', item.date);
  button.title = item.said;
  button.setAttribute('aria-label', item.said + ' — ' + weekdayShortDate(item.date));
  return button;
}

/*
  Paint the screen from the open document. Called on every arrival and from the chains in
  src/shell.js that can change what a month holds — an event authored or deleted, an assignment
  moved, a class archived, and the presentation-mode flip, which is the one that takes review dates
  off the glass while the projector is on.

  Not subscribed to the store, for the reason src/home.js gives about the cards: a subscriber fires
  on every save, and redrawing a screen while a teacher is typing into a dialog over it is how focus
  gets taken out from under her.
*/
export function renderCalendar() {
  const grid = document.getElementById(GRID_ID);
  if (!grid) return;
  const model = calendarModel();

  const heading = document.getElementById(RANGE_ID);
  if (heading) heading.textContent = model.label;
  const stamp = document.getElementById(STAMP_ID);
  /* The printed sheet's own title. It is in the markup all the time and only visible under the
     print gate, which is src/detail.css's `.detail-print-stamp` arrangement: the panel header is
     the app talking to the teacher and none of it belongs on paper, so the sheet has to say what it
     is of somewhere else. */
  if (stamp) stamp.textContent = 'Planbook · ' + model.label;

  paintScale();
  paintClassFilter();

  grid.textContent = '';
  /* The span is on the TABLE rather than on a wrapper, because the one rule that differs
     between the two — the chip's touch floor — is a rule about a descendant of it
     (src/calendar-view.css's coarse block, and the departure written out there). */
  grid.className = 'calendar-table ' + (scale === WEEK ? 'week' : 'month');
  grid.append(headRow());
  const body = el('tbody');
  for (let i = 0; i < model.days.length; i += 7) {
    body.append(weekRow(model.days.slice(i, i + 7), model));
  }
  grid.append(body);

  /* The absence said out loud rather than left to be discovered — see the header. Only while every
     class is showing and only on the month, which are exactly the two conditions under which a
     meeting state is not drawn. */
  const hint = document.getElementById(HINT_ID);
  if (hint) {
    const quiet = scale !== WEEK && !filterClassId;
    hint.classList.toggle('hidden', !quiet);
    hint.textContent = quiet
      ? 'Pick a class above to see which of its days were taken, dropped, or closed by the '
        + 'calendar. The week view shows every class at once.'
      : '';
  }

  paintEmpty(model);
}

/* The seven column heads, and they are <th scope="col"> rather than a styled row: a month grid is a
   table of days, and a screen reader reading "Wednesday" before each cell is the whole reason to
   use one. */
function headRow() {
  const head = el('thead');
  const row = el('tr');
  DOW.forEach((day) => {
    const cell = el('th', 'calendar-dow', day);
    cell.setAttribute('scope', 'col');
    row.append(cell);
  });
  head.append(row);
  return head;
}

function weekRow(cells, model) {
  const row = el('tr', 'calendar-week');
  cells.forEach((day) => row.append(dayCell(day, model)));
  return row;
}

/*
  ONE DAY.

  THE CELL IS NOT A CONTROL, and that is deliberate rather than an omission. A <button>'s content
  model is phrasing content, so a tappable cell could not hold the tappable chips inside it — the
  exact wall src/home.js hit at WO-2.1 and paid for twice. What a teacher taps here is an item, and
  the item is what resolves.

  A day outside the month the heading names is drawn dimmed rather than blank. It is a real day and
  it can hold a real event; blanking it would hide a break that runs across the turn of a month from
  the month a teacher is standing in.
*/
function dayCell(day, model) {
  const cell = el('td', 'calendar-day'
    + (day.inRange ? '' : ' outside')
    + (day.date === model.today ? ' today' : ''));

  const number = el('span', 'calendar-daynum', String(Number(day.date.slice(8, 10))));
  /* The whole date, for a screen reader and for a pointer: a bare "12" says nothing on its own, and
     the column head only names the weekday. */
  number.title = weekdayShortDate(day.date);
  const head = el('span', 'calendar-dayhead');
  head.append(number);
  if (day.date === model.today) head.append(el('span', 'calendar-todaymark', 'Today'));
  cell.append(head);

  const list = el('span', 'calendar-chips');
  day.items.forEach((item) => list.append(chipButton(item)));
  cell.append(list);
  return cell;
}

/* Which span is showing. `aria-pressed` rather than a `.pill` group, for the reason
   src/shell.css's `.toggle-btn` gives: `.pill` is single-select inside a `data-pill-group` and
   would fight this pair's own handler. */
function paintScale() {
  const pair = [[SCALE_MONTH_ID, MONTH], [SCALE_WEEK_ID, WEEK]];
  pair.forEach(([id, name]) => {
    const button = document.getElementById(id);
    if (!button) return;
    button.classList.toggle('active', scale === name);
    button.setAttribute('aria-pressed', scale === name ? 'true' : 'false');
  });
}

/*
  THE CLASS FILTER — "All classes" and then one button per active class, in the tab bar's order.

  Rebuilt from the document on every paint, like #homeGrid and #classTabBar, so a class archived
  behind this screen cannot leave a filter button pointing at it. If the class the filter names has
  gone, the filter falls back to every class rather than showing an empty month for a class that is
  not there — the same resolution src/classes.js gives a stale `openClassId`.
*/
function paintClassFilter() {
  const host = document.getElementById(CLASSES_ID);
  if (!host) return;
  const classes = getActiveClasses();
  if (filterClassId && !classes.some((c) => c.id === filterClassId)) filterClassId = '';

  host.textContent = '';
  const add = (id, label, title) => {
    /* `.toggle-btn` is src/shell.css's and is worn rather than restyled — this sheet's own
       `.calendar-class-btn` beside it is what caps the width, because that class sets
       `white-space: nowrap` and a teacher who calls a class "Period 3 — Honors Biology B Day" would
       otherwise put one button wider than a 390px screen into a row that cannot wrap out of it. The
       whole name stays on `title`, the way a header tab and a class card both keep theirs. */
    const button = el('button', 'toggle-btn calendar-class-btn'
      + (filterClassId === id ? ' active' : ''), label);
    button.type = 'button';
    button.setAttribute('data-calendar-filter', id);
    button.setAttribute('aria-pressed', filterClassId === id ? 'true' : 'false');
    button.title = title;
    host.append(button);
  };
  add('', 'All classes', 'Show everything on the calendar');
  classes.forEach((cls) => add(cls.id, cls.name, 'Show only ' + cls.name));
}

/*
  THE HONEST EMPTY STATE (WO-6.3's third acceptance line).

  The GRID STAYS UP. A teacher who opened a calendar wants the dates whether or not anything is on
  them, and a month replaced by a sentence is a month she cannot look at. What appears under it is
  shell.css's `.empty-state` — the centred zero-data block — with the two things that component has
  no opinion about: which month is empty, and the two doors that put something in it. The same shape
  src/home.js's own empty state takes, and the same reasoning: an empty region with no explanation
  is indistinguishable from one that failed to load.

  It counts what is INSIDE the range the heading names. A break borrowed from the month before is on
  the grid and is not this month's news.
*/
function paintEmpty(model) {
  const box = document.getElementById(EMPTY_ID);
  if (box) box.classList.toggle('hidden', model.count > 0);
  const lead = document.getElementById(EMPTY_LEAD_ID);
  if (!lead) return;
  const cls = filterClassId ? classNameOf(getActiveClasses(), filterClassId) : '';
  lead.textContent = 'Nothing on ' + model.label + (cls ? ' for ' + cls : '') + '.';
}

/* ────────────────────────────── the controls ──────────────────────────────

   Every one of these ends in a render and a spoken sentence, and none of them writes anything. What
   they change is which days are on screen, which is a fact about this browser and this minute.
*/

/*
  ARRIVAL. Called by src/shell.js when the calendar becomes the view in <main>, and not on a
  repaint — the same split src/attendance.js's resetRegistry() makes, and for the same reason: a
  teacher who has just paged to April must not be put back on today because something behind her
  redrew the screen.

  EVERY ARRIVAL STARTS ON TODAY AND ON THE MONTH. The header says why neither is remembered.

  AND ON THE CLASS THE ARRIVAL IS ABOUT (WO-6.6). The caller passes it: '' from the home screen's
  Calendar button, which is a door out of every class at once, and the open class's id from the
  Calendar pill inside one. Recomputed here on every arrival rather than kept, which is what makes it
  the door rather than a memory — the header's own paragraph is the argument, and it is the reason
  this is an ARGUMENT and not a second module-level value.

  An unknown or empty id lands on every class showing, and so does an id whose class has since been
  archived: paintClassFilter() resolves that on the next paint, exactly as it does for a class
  archived behind this screen.
*/
export function resetCalendar(classId) {
  anchor = todayISO();
  scale = MONTH;
  filterClassId = String(classId || '');
}

/* Move the window. `today` returns to the day the screen opens on, which is the way back from a
   teacher who has paged into next spring — the same control src/attendance.js's pager carries and
   for the same reason. */
export function pageCalendar(direction) {
  const step = scale === WEEK ? 7 : 0;
  if (direction === 'today') anchor = todayISO();
  else if (scale === WEEK) anchor = shiftDays(isDate(anchor) ? anchor : todayISO(), direction === 'earlier' ? -step : step);
  else {
    const on = monthStartOf(isDate(anchor) ? anchor : todayISO());
    anchor = direction === 'earlier' ? monthStartOf(shiftDays(on, -1)) : nextMonthStartOf(on);
  }
  renderCalendar();
  announce(rangeText(windowOf()) + '.');
}

/*
  MONTH OR WEEK, and switching keeps the anchor rather than jumping to today: a teacher who has
  paged to the week of the 14th and then asks for the month means "the month that week is in", and
  a switch that landed on this month would throw away the navigation she just did.
*/
export function setCalendarScale(name) {
  const want = name === WEEK ? WEEK : MONTH;
  if (want === scale) return;
  scale = want;
  renderCalendar();
  announce(rangeText(windowOf()) + '.');
}

/* Which class the grid is about; '' is every class. */
export function setCalendarFilter(classId) {
  filterClassId = String(classId || '');
  renderCalendar();
  const cls = filterClassId ? classNameOf(getActiveClasses(), filterClassId) : '';
  announce(cls ? cls + ' only, on ' + rangeText(windowOf()) + '.'
    : 'Every class, on ' + rangeText(windowOf()) + '.');
}

/* What a tap on a chip is about, read back for src/shell.js — which owns where a tap GOES, the way
   it owns every other order-of-operations answer in this app. This module knows what an item is; it
   deliberately does not know how to open a class, and a renderer that did would have to import the
   navigation that imports it. */
export function itemAt(button) {
  if (!button || !button.getAttribute) return null;
  return {
    kind: button.getAttribute('data-calendar-kind') || '',
    ref: button.getAttribute('data-calendar-ref') || '',
    classId: button.getAttribute('data-calendar-class') || '',
    date: button.getAttribute('data-calendar-date') || '',
    authored: !!kindInfo(button.getAttribute('data-calendar-kind') || ''),
    attendanceKind: isAttendanceKind(button.getAttribute('data-calendar-kind') || ''),
  };
}

/* ────────────────────────────── out of the browser ────────────────────────────── */

/* WHETHER THIS SCREEN IS WHAT IS ON SCREEN, asked of the DOM every time rather than remembered from
   the tap. This is src/detail.js's predicate one view over, and the reason it goes to src/views.js
   rather than to `.hidden` is that file's: the calendar is a view in <main>, `.hidden` on those
   siblings IS the view system, and currentView() is where this app already reads it back off the
   DOM. A second copy of "which view is showing" is the second answer this repo keeps refusing. */
function calendarOnScreen() {
  return currentView() === 'calendar';
}

/* Registered at module scope, not around each print: the Ctrl+P a teacher presses while standing on
   this screen never comes through printCalendar() and wants the same gate. src/shell.js imports
   this module at startup, so it is live from the first paint. */
const syncPrintGate = registerPrintGate(PRINT_ATTR, calendarOnScreen);

export function printCalendar() {
  const body = document.body;
  if (!body) return false;
  /* Set here as well, for an engine that fires neither print event: the gate has to be on before
     print() is called, and the listeners src/print-gate.js registered can only correct it later. */
  syncPrintGate();
  window.print();
  return true;
}
