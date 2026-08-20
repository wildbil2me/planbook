/*
  Attendance, read back — one student's history, and the whole class's record for a term as a page
  that prints and a file that opens in a spreadsheet (WO-2.6).

  ── WHY THIS IS A SEPARATE FILE FROM THE REGISTRY ──

  src/attendance.js is the flow that runs while students walk in: every decision in it is about a
  clock. Nothing here is. These two surfaces are opened sitting down — at a guardian conference, in
  the week grades are due, with a printer or a spreadsheet at the other end — and the work order
  that asked for them says so in as many words ("it becomes urgent the first time a guardian
  conference asks *which days?*"). Two files, because the registry has no room for a screen whose
  answer is a page of paper.

  WHAT IS NOT DUPLICATED HERE, AND THIS IS THE PART TO LEAVE ALONE. Nothing in this file decides
  which meetings count, walks `doc.attendance`, tests `exception`, or asks the calendar anything.
  Every number and every row comes out of three readers in src/attendance.js — classRecord(),
  termHistory(), termTotals() — and all three sit on ONE walk over ONE set of records
  (walkMeetings). That is WO-2.6's first acceptance line in its own terms: *"a student's history
  lists exactly the meetings counted in their percentage — the two agree"* is a statement about a
  shared source, not about two implementations landing on the same number. A second filter chain in
  this file would agree with itself on any fixture anybody wrote and disagree in November.

  The formatters come from there too — percentText(), plainDate(), numericDate(), dayAbbr() — so a
  printed page and the line above the grid it was taken from say a percentage in the same words, out
  of the same date parser. A printout that has left the building and disagrees with the screen is
  worse than no printout. *(numericDate() was called shortDate() until WO-3.20, which applied this
  paragraph's own argument one file over: the app had five functions of that name in three formats,
  and the one this file imports is the `9/8` that fits a column head. Nothing printed changed.)*

  ── WHAT A STUDENT IS, TO THIS FILE ──

  `{ id, first, last, name, marks, totals }`, and that is the whole of it. classRecord() hands over
  the names a class is marked under and the marks against them; NOTHING else about a student can
  reach this file, because nothing else is on the shape it is given. There is no import of
  src/supports.js here and there is no path to `student.supports` — no accommodation, no medical
  need, no IEP or 504 or behavior plan, no case manager, no guardian and no counselor.

  THAT IS ABSOLUTE AND IT IS NOT A PRESENTATION-MODE RULE. WO-2.6's fourth acceptance line is
  "neither surface emits accommodation, medical, or plan data", full stop — in either mode, with the
  toggle in either position, on the page and in the file. An implementation that read those fields
  and hid them behind the one visibility switch in src/supports.js would satisfy the work order's
  third deliverable ("presentation-mode safe") and still be a one-tap disclosure the day somebody
  flips the switch back. So the data never arrives, which makes the presentation-mode line trivially
  true instead of conditionally true — and it is why this file does not import that module at all.
  A grep for its switch is the audit, and this file must never appear in the answer.
  docs/data-model.md § "Accommodations" and src/supports.js's own header are the rule; the teacher's
  JSON backup is the single exception in this app and its UI says so in words.

  AND WO-2.26 DID NOT SPEND ANY OF THAT, which is worth a paragraph because it is the one change to
  this file that could have. The history dialog now carries a hall-pass count for the student whose
  history it is, and NOT ONE LINE OF IT IS COMPUTED OR WORDED HERE: src/pass-history.js's
  studentPassSummary() is handed a class id, a student id and the open term, and hands back an
  element this file appends without looking inside it. That is the arrangement src/assignments.js
  has with src/accommodation-prompt.js one screen over — the host owns the dialog, the module owns
  the rule — and it is why the sentence above is still true rather than nearly true. The alternative
  shapes were both worse and both were tried on paper first: a count summed here would be a second
  loop over a log this file cannot see (the same defect the paragraph above refuses about meetings),
  and a line drawn here would have had to ask whether presentation mode is on, which is a question
  only src/supports.js answers and which this file may not ask. So it asks nobody. The import that
  pays for that is at the foot of the list below, with its own note; what crosses it is two ids and
  the term this dialog is already about.

  WHAT IS NOT HERE ANY MORE IS THE DOOR. The first cut of WO-2.26 put a 🚪 Every trip button under
  that line, and the re-cut deleted it (owner, 2026-08-14): the breakdown of one student's trips now
  lives inline on WO-3.7's Student Report screen, which is the page a teacher is on when she wants
  it, and one room with two doors is two rooms to the teacher who found the second one first.

  ── THE ONE THING IN HERE THAT WRITES (WO-2.53) ──

  One block, high in the history dialog, about the one day the registry accepts writes on: the mark
  in words with its time, the note field when there is a mark to hang one on, and the un-confirm when
  there is a record to put back. It is the row detail panel WO-2.10 built, moved — not a new
  capability. The panel it came from was hollow on the state every row is in at the start of every
  period (the note and the un-confirm were both gated on a confirmed mark), so what it showed
  twenty-six times before the first student was marked was the name, the date and the counts the
  screen behind it was already showing.

  IT SITS ABOVE *Term by term*, under the pass count, for the reason those two are where they are:
  a teacher who opened this dialog to talk about one child should not have to scroll a term of dates
  to find the thing she came for. Its date is editDate()'s — asked for through editableMark() — which
  is the only day the registry has ever let a note be typed on, so a note on a PAST mark still wants
  that column's ✏ first, exactly as before. When there is no such day the block is not drawn, and
  then there is no path through this file that changes a mark at all.

  ── THE TWO DOORS ──

  A student's own name in the grid opens their history. 🖨 Record in the registry's toolbar opens the
  class's record, which is one surface carrying two outputs: Print, and a CSV. Both doors are on the
  registry because that is the screen a teacher is already on when either question comes up.

  ── PRINTING, AND WHY IT IS AN ATTRIBUTE ON <body> ──

  Lifted from Roll Call!'s printStudentReport() (dashboard.html): `data-attendance-print` goes on
  <body> and the @media print block at the foot of src/attendance.css hides everything on the page
  EXCEPT the open record dialog, and only while the attribute is there.

  WHO PUTS IT THERE IS src/print-gate.js AND IT IS NOT A TIMER ANY MORE (WO-2.25). This file used to
  set the attribute, call window.print() and take it off 500ms later, on the reasoning that
  window.print() blocks while the browser's dialog is up. It does not always — the owner printed the
  whole app twice over on 2026-08-12 — so the gate is answered from a `beforeprint` listener at the
  moment the browser serialises the page, by asking whether the record dialog is on screen. The
  reasoning is written out once, over there; this file hands in its attribute and its predicate.

  The attribute is what keeps Ctrl+P honest. A print block that hid the app whenever it felt like it
  would answer a keyboard print on any other screen with a blank sheet of paper, which is the kind
  of thing nobody finds until the day it matters. Planbook has no default print surface — Roll Call!
  prints its registry, and cannot, because Planbook's registry is a six-day WINDOW rather than the
  term (src/attendance.js's header says why). So this is the same idiom with the default half left
  out on purpose.

  ── WHAT "FITS A CLASS ON A PAGE" MEANS HERE ──

  A class fits DOWN a page: one row per student, and a roster of ordinary size lands inside one
  sheet. It is the term's meetings that do not fit ACROSS one — a quarter is forty-odd recorded
  meetings and no arrangement of them and a name column fits a portrait page. So the day-by-day
  table is drawn in SLICES of DATES_PER_SLICE columns, each one repeating the student column and
  starting on a fresh page, and the summary table above them — every student's counts and their
  percentage — is the page a conference actually needs and always fits on its own.

  The slices are on screen as well as on paper, deliberately: what the dialog shows is what comes
  out of the printer, and a preview that quietly reflows is a preview.
*/

import { openModal } from './modal.js';
import { announce } from './live-region.js';
/* The class, its terms, and the avatar the roster row and the home card already wear — imported
   rather than re-derived, the same call src/attendance.js makes at the same import for the same
   reason: the colour is part of how a teacher recognises a person, so there is one answer per
   student and not one per screen. */
import { getSelectedClass, getSelectedTerm, getTerms, initials, avatarClass } from './classes.js';
/* "Mary Van Dyke" in a sentence, off the same shape src/roster.js owns. */
import { fullName } from './roster.js';
/* The one way a file reaches the browser in this app (src/backup.js). Imported rather than copied:
   the revoke delay and the one-download-per-tap rule were both paid for on the owner's own iPad,
   and a second copy of those six lines here would be a second thing to get right. */
import { handToBrowser } from './backup.js';
/* The print gate, for the same reason and with the same scar behind it (WO-2.25): this file used to
   carry its own copy of the mechanism, and that copy is how one bug came to live in three places. */
import { registerPrintGate } from './print-gate.js';
/*
  The ledger, and every number on both surfaces.

  READ-ONLY UNTIL WO-2.53, AND NO LONGER — THE HISTORY DIALOG WRITES. Exactly two writers reach the
  document from this file's surfaces, both of them in src/attendance.js, which is the module that
  owns the ledger: setNote() and unconfirmStudent(). Neither is imported here and neither is called
  here. What this file paints is the two elements that carry their hooks —
  `data-attendance-note` + `data-attendance-note-date` and `data-attendance-unconfirm` — and
  src/shell.js's one delegated listener routes them, exactly as it did while those elements were on
  the registry row. So there is still no second writer, no second hook and no third gate; what moved
  is where the controls are drawn.

  AND NOTHING HERE RECOMPUTES WHAT THEY WROTE. editableMark() is the one reader this work order added
  and it is the whole of what this file knows about a writable day: the date the writers default to,
  the reading in that student's cell, its time and note, and the two booleans that decide which of
  the four cases the block draws. The gate stays in the module with the writers in it — a dialog
  asking writableDate() for itself would be a second opinion about what is writable, held by a file
  that cannot see the ledger.

  The class's record — the print surface and the CSV — is still read-only, all of it. There is no
  path through openRecord(), recordCsv() or printRecord() that changes a mark.
*/
import {
  MARKS, UNCONFIRMED, classRecord, termHistory, termTotals, attendanceTotals, editableMark,
  percentText, plainDate, numericDate, dayAbbr, spokenDate, clockTime, todayISO,
} from './attendance.js';
/*
  THE HALL-PASS COUNT (WO-2.26), drawn by the module that owns the pass log rather than by this one —
  the header's own paragraph says why, and it is the reason this is an import of a SCREEN where every
  other one above is an import of a model.

  This file passes two ids and the open term, and appends what comes back. It never reads `passes`,
  never counts a trip, never words one, and never asks whether presentation mode is on — all three
  live behind that module, and src/supports.js behind the third. The same one-way arrangement
  src/assignments.js has with src/accommodation-prompt.js: nothing in src/pass-history.js knows this
  file exists.
*/
import { studentPassSummary } from './pass-history.js';

const HISTORY_MODAL = 'attendanceHistoryModal';
const HISTORY_BODY = 'attendanceHistoryBody';
const RECORD_MODAL = 'attendanceRecordModal';
const RECORD_BODY = 'attendanceRecordBody';

/* The attribute the @media print block keys on. One string, named once, because the stylesheet and
   this file have to agree about it and a typo would print a blank page rather than throw.

   IT STAYS THIS SURFACE'S OWN. `data-detail-print` re-shows #detailView and `data-grades-print`
   re-shows #gradesRecordModal; either one borrowed here would hide the app and reveal something
   that is not on screen — a blank sheet by a different route. One mechanism, one gate per
   surface. */
const PRINT_ATTR = 'data-attendance-print';

/*
  HOW MANY DATE COLUMNS GO ON ONE PRINTED PAGE, and the arithmetic is the whole of it.

  A4 is the narrower of the two papers this will meet — 210mm against Letter's 216 — and the print
  block sets a 10mm margin, so 190mm is what a page has. The student column is 45mm (a surname and a
  first name at 8pt) and a date column is 6mm (two digits over a letter). 45 + 24 x 6 = 189mm.

  So twenty-four, and it is a floor rather than a target: a term with fewer meetings than this draws
  one slice and no page break, which is most of the reason a teacher prints anything mid-term.
*/
const DATES_PER_SLICE = 24;

/* createElement and textContent, never innerHTML — src/attendance.js says why over the same
   strings: a student's name is pasted out of a school system and has to survive being one. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function cell(tag, className, text) {
  const node = el(tag, className, text);
  if (tag === 'th') node.setAttribute('scope', className === 'attendance-report-row-head'
    ? 'row' : 'col');
  return node;
}

/* ────────────────────────────── the sentences both surfaces share ──────────────────────────────

   One place, so the dialog's subtitle, the printed header and the CSV's file name cannot come to
   disagree about which term a page is of. */

/* "September 8, 2026 – November 7, 2026", or the one date there is, or nothing at all.

   THE RANGE IS A LABEL AND NOT THE DENOMINATOR. Everything in this app counts recorded meetings and
   never calendar days (docs/data-model.md), so this says which days the page covers and the count
   beside it says what the percentages are over. An undated term falls back to the first and last
   meeting there actually was, because a header with an empty range on it says less than one that
   says what it holds. */
function rangeText(record) {
  if (!record.start && !record.end) return '';
  if (!record.start || !record.end) return plainDate(record.start || record.end);
  if (record.start === record.end) return plainDate(record.start);
  return plainDate(record.start) + ' – ' + plainDate(record.end);
}

function meetingsText(n) {
  return n + ' recorded meeting' + (n === 1 ? '' : 's');
}

/* Class, term, range, count — the four things WO-2.6's third acceptance line asks the printed
   header to carry, in one sentence that also serves the history dialog and the record preview. */
function recordCaption(record) {
  const parts = [];
  parts.push(record.termLabel ? record.termLabel : 'All recorded meetings');
  if (!record.dated && record.termLabel) parts[0] = record.termLabel + ' (term dates not set)';
  const range = rangeText(record);
  if (range) parts.push(range);
  parts.push(meetingsText(record.dates.length));
  return parts.join(' · ');
}

/* ────────────────────────────── one student's history ────────────────────────────── */

/*
  ROLL CALL!'s STUDENT REPORT, TRIMMED TO WHAT THIS WORK ORDER OWNS. Over there
  (openStudentModal / renderStudentModalContent) the panel is an avatar and a name, a rate badge, a
  term-by-term table and a strip of recent days. The first three come across as they are; the strip
  of coloured day cells becomes a TABLE here, because the deliverable asks for the running
  percentage beside each mark and a 40px cell has nowhere to put one.

  What deliberately did not come across: the at-risk banner, the absence letter and the email
  composer. Those are Phase 4's (praise and concern, and the outreach that follows), and a threshold
  invented here would be a second opinion about what "at risk" means before the work order that owns
  the first one has been written.

  IT IS TWO FUNCTIONS SINCE WO-2.53 AND THE SPLIT IS WHAT MAKES THE UN-CONFIRM HONEST. Opening is
  this one: remember whose dialog it is, draw it, and hand it to src/modal.js with its opener.
  Drawing is paintHistory() below, which is called again — with no openModal() and no focus dance —
  when a write made INSIDE the dialog goes four of its figures stale. See repaintAfterUnconfirm().
*/
let historyFor = '';       /* whose history the dialog is showing, or '' — one at a time, and it is
                              read only to redraw the dialog that is already on screen. Not
                              persisted, not student data leaving the roster: an id this module was
                              handed one tap ago. */

export function openHistory(studentId, opener) {
  historyFor = studentId || '';
  if (!paintHistory()) return;
  openModal(HISTORY_MODAL, opener);
}

/* Everything inside #attendanceHistoryBody, from the open document. Returns false only when the
   host element is missing, which is a page this module cannot draw on at all. */
function paintHistory() {
  const studentId = historyFor;
  const body = document.getElementById(HISTORY_BODY);
  if (!body) return false;
  body.textContent = '';

  const cls = getSelectedClass();
  const record = classRecord();
  const student = record ? record.students.filter((s) => s.id === studentId)[0] : null;
  if (!cls || !record || !student) {
    body.append(el('p', 'attendance-report-empty',
      'That student is not on this class’s roster any more, so there is no history to show.'));
    return true;
  }

  const person = fullName({ first: student.first, last: student.last });
  const rows = termHistory(cls.id, student.id, getSelectedTerm());

  /* The identity row: Roll Call!'s `.sr-header-left` — avatar, name — with its `.sr-rate-badge` on
     the far side. The badge is the term percentage, which is the number the whole dialog is an
     explanation of. */
  const head = el('div', 'attendance-report-head');
  const avatar = el('div', 'avatar ' + avatarClass(student.id), initials(student.name));
  avatar.setAttribute('aria-hidden', 'true');
  const who = el('div', 'attendance-report-who');
  who.append(el('div', 'attendance-report-name', person));
  who.append(el('div', 'attendance-report-sub', cls.name + ' · ' + recordCaption(record)));
  head.append(avatar, who, el('div', 'attendance-report-rate', percentText(student.totals)));
  body.append(head);

  /*
    AND THE WAY FROM HERE TO THE SAME STUDENT'S GRADES (WO-3.7). That screen owns no navigation
    target of its own — you arrive from a name — and on the registry the name is already spoken for:
    it opens this dialog, and historyDoor() in src/attendance.js records why it must not become a
    seventh control on a row whose width is budgeted in day columns. So the door from attendance is
    HERE, one step further in, on the surface that has already narrowed the question to one student.

    THERE IS A SECOND ONE ON THE ROW SINCE WO-2.53, and this button is untouched by it. That work
    order re-pointed the ⋯ at the end of the name — an existing control, inside the same name cell,
    costing no day column — so the sentence above is still the whole of the ruling: a control of its
    OWN on that row was refused and still is. Both doors carry the one delegated hook, so they are
    two ways to one room rather than two rooms; this one is the way a teacher who is already talking
    about one child gets there, and the row's is the way she skips this dialog entirely.

    It carries an id and nothing else. Nothing about the grade screen is imported into this file:
    src/shell.js routes the hook, closes this dialog and swaps the view, which is where the order of
    operations lives — and it keeps this module's promise that the only thing it knows about a
    student is the name they are marked under and the marks against them.
  */
  const toGrades = el('button', 'class-action-btn attendance-report-door',
    'Grades for ' + person);
  toGrades.type = 'button';
  toGrades.setAttribute('data-student-detail', student.id);
  toGrades.title = 'Where ' + person + '’s grade comes from, and what it would take to move';
  body.append(toGrades);

  /*
    AND HOW OFTEN THIS STUDENT HAS BEEN OUT OF THE ROOM (WO-2.26) — one line, no door. The breakdown
    is inline on the Student Report screen the button above leads to, so this is the fact rather than
    the way to it: a teacher marking attendance wants to know there were nine trips, and the teacher
    who wants to see the nine is one tap away on a page that lists them without opening anything.

    IT IS THE SAME NUMBER THAT CARD SHOWS, over the same term, because it is the same call — the
    block arrives built (see the import) and the window is src/passes.js's. That is this work order's
    third acceptance line, and it is a property of there being one function rather than of two
    surfaces being kept in step.

    It sits directly under the door to the grades because both are facts about this one student, and
    a teacher who opened this dialog to talk about one child should not have to scroll a term of
    dates to find either.
  */
  body.append(studentPassSummary(cls.id, student.id, getSelectedTerm()));

  /* ── the one day this dialog can write on (WO-2.53) ──
     Under the two facts above it and over the term table below it, for the reason the pass line
     gives: a teacher who opened this dialog to talk about one child should not have to scroll a term
     of dates to find the thing she came for, and a note on today's mark is the third thing that
     sentence is about. Nothing is appended at all when there is no writable day. */
  const write = writeBlock(student, person);
  if (write) body.append(write);

  /* ── every term, and the year ── */
  body.append(el('div', 'attendance-report-label', 'Term by term'));
  const summary = el('table', 'attendance-report-table');
  const shead = el('thead');
  const srow = el('tr');
  ['Term', 'P', 'T', 'A', 'E', 'D', 'Meetings', 'Attendance'].forEach((label, i) => {
    srow.append(cell('th', i === 0 ? '' : 'attendance-report-num', label));
  });
  shead.append(srow);
  summary.append(shead);
  const sbody = el('tbody');
  const openTerm = getSelectedTerm();
  getTerms(cls.id).forEach((term) => {
    const totals = termTotals(cls.id, student.id, term);
    const open = !!(openTerm && openTerm.id === term.id);
    sbody.append(totalsRow(term.label + (open ? ' — open' : ''), totals, open));
  });
  /* The year sits under the terms rather than beside them: it is the same student over a wider
     window, and it is what a guardian asks about second. */
  sbody.append(totalsRow('Whole year', attendanceTotals(cls.id, student.id), false));
  summary.append(sbody);
  body.append(summary);

  /* ── every recorded meeting in the open term ── */
  body.append(el('div', 'attendance-report-label',
    (record.termLabel || 'All recorded meetings') + ', day by day'));
  if (!rows.length) {
    body.append(el('p', 'attendance-report-empty',
      'No meetings have been recorded for ' + cls.name + ' in this term yet. A day only appears '
        + 'here once it has been taken — a day nobody has marked is not a day nobody met.'));
  } else {
    const table = el('table', 'attendance-report-table');
    const thead = el('thead');
    const hrow = el('tr');
    hrow.append(cell('th', '', 'Date'));
    hrow.append(cell('th', '', 'Mark'));
    hrow.append(cell('th', 'attendance-report-num', 'Attendance so far'));
    thead.append(hrow);
    table.append(thead);
    const tbody = el('tbody');
    rows.forEach((row) => {
      const tr = el('tr');
      const date = cell('th', 'attendance-report-row-head', '');
      date.append(el('span', 'attendance-report-dow', dayAbbr(row.date)));
      date.append(el('span', 'attendance-report-date', plainDate(row.date)));
      tr.append(date);
      const mark = el('td');
      /* The registry's own palette, worn rather than re-chosen — `.attendance-cell-A` and its four
         siblings are this sheet's, and the row's detail panel already wears them the same way. */
      mark.append(el('span', 'attendance-report-mark attendance-cell-' + row.code,
        wordFor(row.code)));
      tr.append(mark);
      /* The fraction beside the percentage is what makes the first acceptance line something a
         teacher can check by eye: the last row's denominator is the number of meetings, and the
         table above it has exactly that many rows. */
      tr.append(el('td', 'attendance-report-num',
        row.attended + ' of ' + row.meetings + ' · ' + percentText(row)));
      tbody.append(tr);
    });
    table.append(tbody);
    body.append(table);
  }

  body.append(el('p', 'attendance-report-note',
    'Every day this class was taken is a row, and nothing else is: a day the class didn’t meet, '
      + 'a holiday, and a day nobody has marked yet all count toward nothing. A student nobody had '
      + 'confirmed when the class was taken reads as absent, which is what it counts as.'));

  return true;
}

/*
  THE WRITE BLOCK, AND THE FOUR CASES IT CARRIES ARE THE FOUR THE ROW PANEL CARRIED (WO-2.10, moved
  by WO-2.53). It adds no fifth: the mark in words with its time; the note field when there is a mark
  for a note to live on; the un-confirm when there is a record to put a student back on; and the two
  hint sentences for the two ways there is nothing to type into — a student nobody has confirmed yet,
  and a confirmed-present student, who HAS no entry because present is stored as no mark at all. A
  field there would silently discard what was typed into it, which is the stored-`P` trap arriving
  through a text box, so the block says why instead.

  IT DECIDES NONE OF THAT. editableMark() answers with the date, the reading, the time, the note and
  the two booleans, out of the module that owns the writers; this function words and lays out the
  answer. `null` means there is no day to write on — a past column still locked, a window paged off
  the edit date, a day the class did not meet, a covered day, a day outside every term — and then
  nothing is drawn and there is no path through this file that changes a mark.

  `tabindex="-1"` ON THE BOX IS FOR THE UN-CONFIRM. Pressing it destroys the control that was
  pressed: the mark goes back to `?`, so the block redraws without the button and without the note
  field, and focus would land on <body> — outside the dialog, for a keyboard user, with the modal's
  Tab trap the only way back in. So the redraw puts focus on the box itself, which is where the thing
  that just changed is. It is not in the Tab order (src/modal.js's focusablesIn() skips
  `[tabindex="-1"]`), so nothing about tabbing through the dialog changes.
*/
function writeBlock(student, person) {
  const now = editableMark(student.id);
  if (!now) return null;

  const box = el('div', 'attendance-report-write');
  box.setAttribute('tabindex', '-1');
  box.setAttribute('data-attendance-write', student.id);
  box.append(el('div', 'attendance-report-write-day',
    (now.date === todayISO() ? 'Today · ' : '') + spokenDate(now.date)));

  const says = el('span', 'attendance-report-mark attendance-report-write-mark '
    + 'attendance-cell-' + (now.code === UNCONFIRMED ? 'untaken' : now.code),
    wordFor(now.code) + (now.at ? ' at ' + clockTime(now.at) : ''));
  box.append(says);

  if (now.canNote) {
    const field = document.createElement('input');
    field.type = 'text';
    field.className = 'attendance-report-write-note';
    /* The date rides on the element for the reason a cell's does on the registry: which day a
       keystroke lands on must not be a question two files can answer differently. */
    field.setAttribute('data-attendance-note', student.id);
    field.setAttribute('data-attendance-note-date', now.date);
    field.value = now.note;
    field.placeholder = 'Add a note — missed the bus, left for the nurse…';
    field.setAttribute('aria-label', 'Note on ' + person + '’s mark for ' + spokenDate(now.date));
    box.append(field);
  } else {
    box.append(el('span', 'attendance-report-write-hint', now.code === UNCONFIRMED
      ? 'Nobody has confirmed this student yet. Tap their question mark once for present.'
      : 'Present is stored as no mark at all, so there is nothing here to note. Mark them absent, '
        + 'tardy, at an event or dismissed and the note field appears.'));
  }

  if (now.canUnconfirm) {
    const back = el('button', 'class-action-btn', 'Un-confirm');
    back.type = 'button';
    back.setAttribute('data-attendance-unconfirm', student.id);
    back.title = 'Put this student back to a question mark, as if nobody had looked at them yet.';
    box.append(back);
  }
  return box;
}

/*
  AND THE FOUR FIGURES THIS DIALOG OWES AN UN-CONFIRM MADE INSIDE IT.

  src/attendance.js repaints the registry behind this dialog on every write, and src/shell.js redraws
  the home cards after it — that chain is untouched and it is exactly why this listener exists. The
  grid visibly updating under the overlay looks like the whole answer and is not: the percentage in
  the head, the open term's row, the *Whole year* row and the day-by-day table are all drawn from the
  same ledger, and all four are stale the moment a student goes back to `?`.

  IT LISTENS ON `window`, WHICH IS NOT AN ACCIDENT AND IS THE ONLY DETAIL HERE WORTH ARGUING. The
  write is routed by the one delegated listener in src/shell.js, which is on `document`; a listener
  registered here on `document` would run BEFORE it, because src/shell.js imports this module and
  module-scope listeners register in import order — so it would redraw the dialog from the document
  as it was before the write, and look like a repaint that does not work. `window` is the last object
  in a bubbling event's propagation path, after every `document` listener whatever order they were
  added in, so this always runs after the writer. It writes nothing itself: one guard, one repaint.

  THE NOTE FIELD DELIBERATELY DOES NOT COME THROUGH HERE. `input` is a different event and there is
  no listener for it: re-rendering the dialog on a keystroke would replace the <input> being typed
  into and take the caret and the software keyboard with it. src/attendance.js's setNote() carries
  that reasoning at the writer, and this is the seam it is about.
*/
window.addEventListener('click', (e) => {
  if (!historyFor || !e.target || !e.target.closest) return;
  const modal = document.getElementById(HISTORY_MODAL);
  if (!modal || modal.classList.contains('hidden')) return;
  const back = e.target.closest('[data-attendance-unconfirm]');
  if (!back || !modal.contains(back)) return;
  paintHistory();
  const box = modal.querySelector('[data-attendance-write]');
  if (box && typeof box.focus === 'function') box.focus({ preventScroll: true });
});

/* `U` is deliberately not in MARKS — it is not a sixth code to a teacher — and it is the one reading
   the write block can be handed that the day-by-day table below never sees, because the history rows
   fold it into an absence on the way out of the ledger. Worded the same way src/attendance.js words
   it for a cell's accessible name, so the block and the grid behind it say one thing. */
function wordFor(code) {
  if (code === UNCONFIRMED) return 'Not confirmed';
  const known = MARKS.filter((m) => m.code === code)[0];
  return known ? known.word : code;
}

function totalsRow(label, totals, open) {
  const tr = el('tr', open ? 'attendance-report-open' : '');
  tr.append(cell('th', 'attendance-report-row-head', label));
  MARKS.forEach((mark) => tr.append(el('td', 'attendance-report-num', String(totals[mark.code]))));
  tr.append(el('td', 'attendance-report-num', String(totals.meetings)));
  tr.append(el('td', 'attendance-report-num', percentText(totals)));
  return tr;
}

/* ────────────────────────────── the class's record ────────────────────────────── */

export function openRecord(opener) {
  const body = document.getElementById(RECORD_BODY);
  if (!body) return;
  body.textContent = '';

  const record = classRecord();
  if (!record) {
    body.append(el('p', 'attendance-report-empty',
      'No class is open, so there is no record to print. Open a class first.'));
    openModal(RECORD_MODAL, opener);
    return;
  }

  /* THE PRINTED HEADER, and it is the same element on screen. Class, term, date range and the
     count of recorded meetings, plus the day it was printed — which is what makes a sheet found in
     a folder next June mean anything at all. */
  const head = el('div', 'attendance-report-head attendance-report-print-head');
  const who = el('div', 'attendance-report-who');
  who.append(el('div', 'attendance-report-name', record.className));
  who.append(el('div', 'attendance-report-sub', recordCaption(record)));
  who.append(el('div', 'attendance-report-sub',
    'Printed ' + plainDate(todayISO()) + ' · Planbook'));
  head.append(who);
  body.append(head);

  if (!record.students.length) {
    body.append(el('p', 'attendance-report-empty',
      'There is nobody on this class’s roster yet, so the record is empty. Paste the roster in '
        + 'and every student appears here.'));
    openModal(RECORD_MODAL, opener);
    return;
  }

  /* ── the summary: one row per student, and the page a conference needs ── */
  body.append(el('div', 'attendance-report-label', 'Attendance by student'));
  const summary = el('table', 'attendance-report-table');
  const shead = el('thead');
  const srow = el('tr');
  srow.append(cell('th', '', 'Student'));
  MARKS.forEach((mark) => srow.append(cell('th', 'attendance-report-num', mark.code)));
  srow.append(cell('th', 'attendance-report-num', 'Meetings'));
  srow.append(cell('th', 'attendance-report-num', 'Attendance'));
  shead.append(srow);
  summary.append(shead);
  const sbody = el('tbody');
  record.students.forEach((student) => {
    sbody.append(totalsRow(student.name, student.totals, false));
  });
  summary.append(sbody);
  body.append(summary);

  /* ── day by day, in slices ── */
  if (!record.dates.length) {
    body.append(el('p', 'attendance-report-empty',
      'No meetings have been recorded in this term yet, so there is nothing to lay out day by day. '
        + 'The counts above are all zero for the same reason.'));
  } else {
    body.append(el('div', 'attendance-report-label', 'Day by day'));
    for (let from = 0; from < record.dates.length; from += DATES_PER_SLICE) {
      const dates = record.dates.slice(from, from + DATES_PER_SLICE);
      body.append(slice(record, dates, from, record.dates.length));
    }
  }

  body.append(el('p', 'attendance-report-note',
    'This is attendance and nothing else: names, marks and the dates the class actually met. '
      + 'Nothing from a student’s support details is on this page or in the CSV, in either '
      + 'mode — those live on the roster and go nowhere but your own backup file.'));

  openModal(RECORD_MODAL, opener);
}

/* One printed page's worth of date columns, with the student column repeated. The caption is drawn
   only when there is more than one slice: "Meetings 1–24" over a table that is the whole term is a
   label about nothing. */
function slice(record, dates, from, total) {
  const wrap = el('div', 'attendance-report-slice');
  if (total > dates.length) {
    wrap.append(el('div', 'attendance-report-slice-label',
      'Meetings ' + (from + 1) + '–' + (from + dates.length) + ' of ' + total));
  }
  const table = el('table', 'attendance-report-table attendance-report-grid');
  const thead = el('thead');
  const hrow = el('tr');
  hrow.append(cell('th', '', 'Student'));
  dates.forEach((date) => {
    const th = cell('th', 'attendance-report-day', '');
    th.append(el('span', 'attendance-report-dow', dayAbbr(date)));
    th.append(el('span', 'attendance-report-date', numericDate(date)));
    /* The whole date, for a reader who is not looking at a printed page. */
    th.title = plainDate(date);
    hrow.append(th);
  });
  thead.append(hrow);
  table.append(thead);
  const tbody = el('tbody');
  record.students.forEach((student) => {
    const tr = el('tr');
    tr.append(cell('th', 'attendance-report-row-head', student.name));
    dates.forEach((date) => {
      /* A blank is unreachable — every student in the record has a reading on every date the walk
         produced — and it is drawn as a dash rather than as nothing if a later shape ever makes one,
         because an empty cell in this grid would read as "present" and that is the ambiguity the
         whole registry is built to refuse. */
      const code = student.marks[date] || '';
      const td = el('td', 'attendance-report-cell');
      td.append(el('span', 'attendance-report-mark'
        + (code ? ' attendance-cell-' + code : ''), code || '–'));
      td.title = (code ? wordFor(code) : 'No mark') + ' · ' + plainDate(date);
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);
  wrap.append(table);
  return wrap;
}

/* ────────────────────────────── out of the browser ────────────────────────────── */

/* WHETHER THE RECORD IS WHAT IS ON SCREEN, asked of the DOM every time rather than remembered from
   the tap. This is the predicate src/print-gate.js answers the attribute from; that file carries
   the reasoning, including the two ways the timer this replaced came apart. */
function recordOnScreen() {
  const modal = document.getElementById(RECORD_MODAL);
  return !!modal && !modal.classList.contains('hidden');
}

/* Registered at module scope, not around each print: the Ctrl+P a teacher presses with this dialog
   already open never comes through printRecord() and wants the same gate. src/shell.js imports this
   module at startup, so it is live from the first paint. */
const syncPrintGate = registerPrintGate(PRINT_ATTR, recordOnScreen);

export function printRecord() {
  const body = document.body;
  if (!body) return false;
  /* Set here as well, for an engine that fires neither event: the gate has to be on before print()
     is called, and the listeners registered above only correct it later. */
  syncPrintGate();
  window.print();
  return true;
}

/*
  THE FILE, AS TEXT, WITH NO DOM IN IT — the seam src/backup.js's own split named: the half that
  builds a file and the half that hands it over are two functions, so the first one can be driven
  from tools/verify-shell.mjs and asserted character by character. "The CSV opens cleanly in a
  spreadsheet" is otherwise a claim nobody can check without a spreadsheet.

  THE SHAPE IS ROLL CALL!'s, COLUMN FOR COLUMN (exportAttendanceCSV in dashboard.html): the summary
  block first — last name, first name, the five counts, the percentage — then one column per school
  day, oldest first. A teacher who has been exporting from Roll Call! all year opens this in the
  same spreadsheet with the same columns in the same places.

  Three details in it are load-bearing and all three are lifted rather than reasoned out again:

    - A BOM, so Excel reads the file as UTF-8. Without it a name with an accent in it arrives
      mangled, and the teacher's first thought is that the app broke her roster.
    - CRLF line endings, which is what the CSV convention actually says and what Excel is happiest
      with.
    - A cell is quoted only when it holds a quote, a comma or a newline, and a quote inside one is
      doubled. A class called "Period 2, Honors" is a real class name and it must not become two
      columns.
*/
export function recordCsv(record) {
  const rows = [];
  const head = ['Last Name', 'First Name'];
  MARKS.forEach((mark) => head.push(mark.word));
  head.push('Meetings', 'Att %');
  record.dates.forEach((date) => head.push(date));
  rows.push(head);

  record.students.forEach((student) => {
    const row = [student.last, student.first];
    MARKS.forEach((mark) => row.push(student.totals[mark.code]));
    row.push(student.totals.meetings);
    /* Empty rather than "No recorded meetings" when there are none: a sentence in a percentage
       column is a column a spreadsheet cannot add up, and the Meetings column beside it already
       says zero. Everywhere else it is the same string the registry prints. */
    row.push(student.totals.percent === null ? '' : percentText(student.totals));
    record.dates.forEach((date) => row.push(student.marks[date] || ''));
    rows.push(row);
  });

  const text = '﻿' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
  return { name: csvName(record), text: text };
}

function csvCell(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/*
  "Planbook Period 2 Q1 attendance 2026-08-11.csv" — the same "Planbook … <what> <date>" family the
  backup files use, so the whole set sorts together in a Files listing and a teacher can tell at a
  glance which term a file is of.

  The class and term labels are typed by the teacher and can hold anything, including the handful of
  characters iPadOS and Windows both refuse in a file name. They are replaced rather than stripped,
  so "Period 2/3" stays two numbers rather than becoming "Period 23".
*/
function csvName(record) {
  const clean = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = ['Planbook', clean(record.className)];
  if (record.termLabel) parts.push(clean(record.termLabel));
  parts.push('attendance', todayISO());
  return parts.filter(Boolean).join(' ') + '.csv';
}

export function downloadRecordCsv() {
  const record = classRecord();
  if (!record) return false;
  const file = recordCsv(record);
  handToBrowser({ name: file.name,
    blob: new Blob([file.text], { type: 'text/csv;charset=utf-8' }) });
  /* Said rather than shown: this dialog has no status line and does not want one — the file lands
     in the Files app or in Downloads and the browser says so itself. What a screen-reader user gets
     otherwise is a button that does nothing at all. */
  announce('Saved ' + file.name);
  return true;
}
