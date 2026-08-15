/*
  A class's grades for a term, as a page that prints and a file that opens in a spreadsheet
  (WO-3.9).

  ── WHY THIS EXISTS AT ALL, WHICH IS ALSO WHY ITS ORDER IS NOT A MATTER OF TASTE ──

  The school's SIS has no import. Every grade in it is typed by hand off a sheet of paper, five
  classes at a time, and the sheet it is typed off is this one. So the whole value of this file is
  in the ORDER — the work order says as much in its own first paragraph — and the order is the
  owner's answer of 2026-08-12 rather than a decision made here:

    a STUDENT-MAJOR grid   one row per student, assignments across
    rows                   alphabetical by LAST NAME
    columns                by DUE DATE
    names                  `Last, First`, which is how the SIS reads
    student id             none. The SIS entry screen has no id to match on, so the name is the join

  The alternative — one section per assignment with the roster repeated inside each — was drawn as a
  mock-up and rejected: it reads straight down while typing but never puts a student's whole term in
  one place and costs several times the paper. If a re-key against the live SIS turns out to want a
  finger held on one assignment column, THAT is the finding, and the answer is the assignment-major
  layout already designed rather than a redesign from nothing. Nothing in this file builds both.

  ── IT IS A DIALOG OVER THE SCORE GRID, NOT A PRINT OF THE SCORE GRID ──

  plans/gradebook-surfaces.md's rule is what a teacher is doing: a surface she works in is a view, a
  task she finishes and dismisses is a modal. Printing a term is the second. WO-2.6 made the same
  call one screen over — the registry is a view and the record that prints out of it is a dialog —
  and this is that shape again, with the same two doors inside it.

  Printing #scoresView itself was the other candidate and it is wrong for reasons that are about the
  artifact rather than about surfaces. That screen draws its columns in the order the teacher
  arranged them with the assignment list's ↑ ↓ and this sheet draws them by DUE DATE; its cells are
  ~250 live <input>s, and an input is not a printed number; and its grade column is frozen beside
  the name where this sheet's total belongs at the right. What is on screen in this dialog is what
  comes out of the printer, slices and all, so the preview is a preview.

  ── NOTHING HERE COMPUTES A GRADE, AND NOTHING HERE READS A CELL FOR ITSELF ──

  Every percentage and every letter comes out of src/grade-engine.js (WO-3.4) — the printout is what
  gets typed into the SIS, and two implementations of one arithmetic is exactly how a sheet comes to
  disagree with the screen it was printed from. weightedClassGrade() answers each row and nothing in
  this file sums a point.

  The same rule one level down: what a CELL holds is asked of src/scores.js's scoreMark(), which is
  the reading the grid itself draws from. A third copy of "a cell is always an object, and a bare
  number is no cell" — src/grade-engine.js has one, src/scores.js has the other — would be the copy
  that eventually disagrees about a `late` blank. The ROW ORDER is asked of that module too
  (gridOrder), so the sheet lists students in the same order as the screen it was printed from.

  ── `late` AND `missing` ARE THE TEACHER'S MARKS, AND A BLANK STAYS BLANK ──

  markText() below is the one place a cell becomes a string, and BOTH surfaces use it: the printed
  table and the CSV carry identical text in every cell, which is what makes "the printout and the
  file must not disagree" a fact rather than a promise. A score marked late prints as `18 L` — the
  number counts in full, the mark is a record and not a penalty — `missing` prints as `M` because it
  holds no number, `excused` as `Ex`, and an ungraded cell prints as NOTHING.

  THE EMPTY CELL IS THE ONE PLACE THIS DEPARTS FROM src/attendance-report.js, deliberately and at
  the point it happens. That file draws a dash into a blank because an empty attendance cell would
  read as "present", which is the ambiguity the registry exists to refuse. Here the local rule beats
  it: blank means UNGRADED and affects no grade (CLAUDE.md, docs/data-model.md), an empty cell is
  what "nothing has been graded" looks like, and a dash in a column of scores is a character a
  re-keying teacher has to decide about. The work order says it in one line — "a blank stays blank"
  — and a printout that turned a blank into anything at all would be inventing a grade on the sheet
  the SIS gets typed from. The key under the table says so in words.

  ── NO SUPPORT DATA REACHES THIS FILE, IN EITHER MODE ──

  There is no import of src/supports.js here and no path to `student.supports` — no accommodation,
  no medical need, no plan, no case manager. That is the same posture src/attendance-report.js and
  src/detail.js take and it is stronger than "presentation-mode safe": WO-3.9's fourth acceptance
  line is that NEITHER surface emits that data, full stop, in either mode and with the toggle in
  either position. An implementation that read those fields and hid them behind the one visibility
  switch would satisfy the deliverable and still be a one-tap disclosure the day somebody flips the
  switch back. So the data never arrives, which makes the mode question trivially true instead of
  conditionally true. A grep for that switch is the audit, and this file must never be in the answer.

  ── WHAT A TERM DOES NOT FIT ON ──

  A class fits DOWN a page: one row per student at 7pt, and a roster of ordinary size lands on one
  sheet. It is the ASSIGNMENTS that do not fit across one — the arithmetic is at
  ASSIGNMENTS_PER_SLICE below — so the grid is drawn in slices, each repeating the student column
  and the grade column so that every page is a page you can read a total off, and each starting on a
  fresh sheet.
*/

import { getDoc } from './store.js';
import { openModal } from './modal.js';
import { announce } from './live-region.js';
/* Which class and which term are open — asked rather than answered here, the same import every
   other class-scoped screen makes. */
import { getSelectedClass, getSelectedTerm } from './classes.js';
/* `Van Dyke, Mary` on a row, which is the name display the owner pinned for this sheet. One shape,
   owned by src/roster.js, worn by every screen that prints a name. */
import { rosterName } from './roster.js';
/* The category an assignment is filed under, for the column key in the file. */
import { categoriesOf } from './categories.js';
/* THE ONLY GRADE ARITHMETIC IN THE APP (WO-3.4). See this file's header. */
import { weightedClassGrade } from './grade-engine.js';
/* The bands in force for this class, and whether they are its own or the year's — the deliverable
   asks both surfaces to name the scale in use, and that answer has one owner. Nothing here rounds
   anything on the way to a letter: a boundary is printed with String() exactly as
   src/letter-scale.js prints it, because the boundary the teacher typed IS the rounding rule. */
import { hasOwnScale, scaleForClass } from './letter-scale.js';
/* The grid's own order, its own reading of a cell, and its own percentage formatter — three imports
   from the screen this sheet is printed off, so that the paper and the screen cannot come apart.
   The import runs one way: nothing in src/scores.js knows this file exists. */
import { formatPercent, gridOrder, scoreMark } from './scores.js';
/* One clock, one parser. plainDate() and numericDate() are the same date formatters the registry and
   its printed record use, so a date on this sheet reads the way a date reads everywhere else — and
   neither of them is handed to `new Date('2026-09-08')`, which the spec reads as UTC midnight and
   which is one timezone away from being the day before.

   numericDate() WAS CALLED shortDate() UNTIL WO-3.20, and this import is the reason that work order
   was about a name rather than about duplication. What it prints below is an ASSIGNMENT due date, in
   the attendance grid's `9/18` — while the score grid this sheet is taken from prints the same due
   date as `Sep 18` (src/scores.js, through src/date-text.js). Both are correct dates and nothing in
   the harness could tell them apart, which is exactly the good-faith import WO-3.20 exists to make
   impossible for the next screen. It was NOT changed there: that work order is behaviour-neutral by
   construction and this is a printed page, so choosing between the two formats is a decision about
   what a teacher's paper says. Written up as a proposed follow-up in
   .claude/dispatch/WO-3.20-result.md; until it is taken, this sheet prints what it has always
   printed. */
import { plainDate, numericDate, todayISO } from './attendance.js';
/* The one way a file reaches the browser in this app (src/backup.js). Imported rather than copied:
   the revoke delay and the one-download-per-tap rule were both paid for on the owner's own iPad. */
import { handToBrowser } from './backup.js';
/* The print gate, and the only mechanism there is for one: this file is where it was written
   (WO-3.9) and WO-2.25 moved it out so that all three print surfaces answer their attribute the same
   way. The attribute stays this file's own; the reasoning is told once, over there. */
import { registerPrintGate } from './print-gate.js';

const RECORD_MODAL = 'gradesRecordModal';
const RECORD_BODY = 'gradesRecordBody';

/* The attribute the @media print block keys on. One string, named once, because src/scores.css and
   this file have to agree about it and a typo would print a blank page rather than throw.

   A THIRD ATTRIBUTE RATHER THAN A THIRD IDIOM. `data-attendance-print` re-shows
   #attendanceRecordModal and `data-detail-print` re-shows #detailView; either one borrowed here
   would hide the app and reveal something that is not on screen — a blank sheet by a different
   route. One idiom, one gate per surface. */
const PRINT_ATTR = 'data-grades-print';

/*
  HOW MANY ASSIGNMENT COLUMNS GO ON ONE PRINTED PAGE, and the arithmetic is the whole of it.

  A4 is the narrower of the two papers this will meet — 210mm against Letter's 216 — and this app's
  @page rule sets a 10mm margin, so 190mm is what a page has. The student column is 42mm (a
  `Last, First` at 7pt), the grade column is 16mm ("65.24%" over a letter), and an assignment column
  is 16mm (a wrapped name at 6pt over a value like "100 L"). 42 + 16 + 8 x 16 = 186mm.

  So eight, and it is a floor rather than a target: a term with fewer assignments than this draws one
  slice and no page break, which is most of the reason a teacher prints anything mid-term.
*/
const ASSIGNMENTS_PER_SLICE = 8;

/* createElement and textContent, never innerHTML — src/attendance.js says why over the same
   strings: a student's name is pasted out of a school system and has to survive being one, and so
   does an assignment called "Lab <write-up>". */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function cell(tag, className, text) {
  const node = el(tag, className, text);
  if (tag === 'th') node.setAttribute('scope', className === 'grades-report-row-head'
    ? 'row' : 'col');
  return node;
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

/* ────────────────────────────── what the sheet is of ────────────────────────────── */

function assignmentsOf(doc, classId, termId) {
  const list = doc && Array.isArray(doc.assignments) ? doc.assignments : [];
  /* Class first and term second, and both always — src/scores.js's guard, for the reason its header
     gives: the moment an assignment can be copied between classes, a query by id alone is a query
     that can answer with another class's work. */
  return list.filter((a) => a && a.classId === classId && a.termId === termId);
}

/*
  THE COLUMN ORDER: BY DUE DATE, which is the owner's answer and the one thing on this sheet that a
  re-key can be right or wrong about.

  ISO dates are compared as STRINGS, which is exact for `YYYY-MM-DD` and is the reason this file
  parses no dates to sort them — a comparison through `new Date()` would be a second date parser in
  an app that has spent two work orders getting down to one.

  TWO CASES THAT ARE NOT "SORT BY DATE", and each is a decision rather than a fallback:

    A DUE DATE IS OPTIONAL (src/assignments.js decision 1), and work with no date has no place in a
    due-date order. It goes LAST rather than first — a sheet whose first columns are the undated
    ones opens on the work least likely to be what the teacher is typing in — and it keeps the order
    the teacher put it in.

    TWO ASSIGNMENTS DUE THE SAME DAY keep the teacher's own order too, which is the order the
    assignment list draws them in with its ↑ ↓. The index is carried explicitly rather than leaning
    on Array#sort being stable: the guarantee is real since ES2019, and writing the tie rule down is
    what makes it a rule somebody chose rather than a property somebody relied on.
*/
function sheetOrder(list) {
  return list.map((a, i) => ({ a: a, i: i })).sort((x, y) => {
    const dx = String(x.a.due || '');
    const dy = String(y.a.due || '');
    if (dx !== dy) {
      if (!dx) return 1;
      if (!dy) return -1;
      return dx < dy ? -1 : 1;
    }
    return x.i - y.i;
  }).map((entry) => entry.a);
}

function pointsOf(assignment) {
  /* What is STORED is whatever the teacher typed, including 0 — src/assignments.js decision 2, and
     0 is the extra-credit mechanism rather than a mistake. */
  const n = Number(assignment && assignment.points);
  return Number.isFinite(n) ? n : 0;
}

function categoryNameOf(cls, assignment) {
  const hit = categoriesOf(cls).filter((c) => c && c.id === assignment.categoryId)[0];
  if (hit) return hit.name || 'Untitled category';
  /* Work filed under no category this class has — reachable from a restored document, and counted
     by nothing until it is re-filed. src/scores.js's column head says the same thing in the same
     words on the screen this sheet is printed off. */
  return 'no category';
}

/*
  ONE CELL, AS THE STRING BOTH SURFACES PRINT. The single place a mark becomes text — see this
  file's header for why `M`, `Ex`, `18 L` and an empty string are the four answers, and why the
  empty one is empty.
*/
function markText(mark) {
  if (mark.flag === 'missing') return 'M';
  if (mark.flag === 'excused') return 'Ex';
  if (mark.value === null) return mark.flag === 'late' ? 'L' : '';
  return mark.flag === 'late' ? mark.value + ' L' : String(mark.value);
}

/* The bands in force, as `A 93 · A− 90 · …`, and whose they are. String() and no formatter, for the
   reason src/letter-scale.js's boundaryText() gives: 89.5 has to read as 89.5, and a formatter here
   is where a second rounding rule moves in. */
function scaleBands(doc, cls) {
  return scaleForClass(doc, cls)
    .filter((band) => band && band.letter !== undefined && band.letter !== null)
    .map((band) => ({ letter: String(band.letter),
      min: band.min === null || band.min === undefined ? '' : String(band.min) }));
}

/*
  THE SHEET, AS DATA — one call, everything both surfaces need, and no DOM in it.

  src/backup.js's build-it/hand-it-over split, reused for the fourth time so that the file can be
  asserted character by character from tools/verify-shell.mjs without a browser download. "The CSV
  opens cleanly in a spreadsheet" is otherwise a claim nobody can check without a spreadsheet.

  NOTHING FROM `student.supports` IS ON THIS SHAPE, and there is no path to it: what a student is to
  this model is a name, an id, a row of marks and their own arithmetic.
*/
export function gradesRecord() {
  const doc = getDoc();
  const cls = getSelectedClass();
  if (!doc || !cls) return null;
  const term = getSelectedTerm();
  const termId = term ? term.id : '';
  const dated = !!(term && term.start && term.end);

  const assignments = sheetOrder(assignmentsOf(doc, cls.id, termId)).map((a) => ({
    id: a.id,
    name: a.name || 'Untitled assignment',
    category: categoryNameOf(cls, a),
    due: String(a.due || ''),
    points: pointsOf(a),
  }));

  const students = gridOrder(cls).map((student) => {
    const grade = weightedClassGrade(doc, cls, termId, student.id);
    return {
      id: student.id,
      name: rosterName(student),
      cells: assignments.map((a) => {
        const mark = scoreMark(doc, a.id, student.id);
        return { id: a.id, text: markText(mark), flag: mark.flag };
      }),
      /* The percentage as the STRING both surfaces print, taken from the screen's own formatter
         (WO-3.14: two fixed places, because the SIS carries two and this number is re-keyed into it
         by hand). An empty string where the engine has no answer — never a zero, and never a
         percentage this file invented. */
      grade: grade.percentage === null ? '' : formatPercent(grade.percentage),
      letter: grade.letter || '',
      message: grade.message || '',
      reason: grade.reason || '',
    };
  });

  /* WHY THE CLASS HAS NO GRADES, asked of the engine rather than decided here: one class can only be
     in one of those states, so any student's answer settles it, and a second copy of the balance
     rule in this file is how a banner and a grade come to disagree for decimal weights
     (src/categories.js's BALANCE_EPSILON carries that scar). */
  const probe = students.length ? students[0] : null;

  return {
    classId: cls.id,
    className: cls.name,
    termLabel: term && term.label ? term.label : '',
    dated: dated,
    start: dated ? term.start : '',
    end: dated ? term.end : '',
    printedISO: todayISO(),
    ownScale: hasOwnScale(cls),
    scale: scaleBands(doc, cls),
    assignments: assignments,
    students: students,
    unbalanced: !!(probe && probe.reason === 'weights-unbalanced'),
    noGradeMessage: probe && probe.reason === 'weights-unbalanced' ? probe.message : '',
  };
}

/* ────────────────────────────── the sentences both surfaces share ──────────────────────────────

   One place, so the dialog's subtitle, the printed header and the CSV's file name cannot come to
   disagree about which term a sheet is of. */

/* "September 8, 2026 – November 7, 2026", or nothing at all. THE RANGE IS A LABEL: everything in
   this app counts recorded meetings and never calendar days, and nothing on this sheet is counted
   over a date at all — the range says which days the term covers and no arithmetic reads it. */
function rangeText(record) {
  if (!record.dated) return '';
  if (record.start === record.end) return plainDate(record.start);
  return plainDate(record.start) + ' – ' + plainDate(record.end);
}

function recordCaption(record) {
  const parts = [];
  parts.push(record.termLabel ? record.termLabel : 'No term set');
  if (!record.dated && record.termLabel) parts[0] = record.termLabel + ' (term dates not set)';
  const range = rangeText(record);
  if (range) parts.push(range);
  parts.push(plural(record.students.length, 'student', 'students'));
  parts.push(plural(record.assignments.length, 'assignment', 'assignments'));
  return parts.join(' · ');
}

/* "the year's bands" or "this class's own bands", then every band. The deliverable asks both
   surfaces to carry the scale in use, and WHOSE it is matters as much as what it says: a sheet
   printed off a class with an override and read against the year's scale is a sheet that disagrees
   with itself. */
function scaleSubject(record) {
  return record.ownScale ? 'this class’s own bands' : 'the year’s bands';
}

function scaleText(record) {
  if (!record.scale.length) return 'Letter scale · none set, so no grade carries a letter';
  return 'Letter scale · ' + scaleSubject(record) + ' · '
    + record.scale.map((band) => band.letter + ' ' + band.min).join(' · ');
}

/* ────────────────────────────── the dialog ────────────────────────────── */

/* One printed page's worth of assignment columns, with the student column and the grade column
   repeated. The caption is drawn only when there is more than one slice: "Assignments 1–8" over a
   table that is the whole term is a label about nothing. */
function slice(record, from) {
  const columns = record.assignments.slice(from, from + ASSIGNMENTS_PER_SLICE);
  const wrap = el('div', 'grades-report-slice');
  if (record.assignments.length > columns.length) {
    wrap.append(el('div', 'grades-report-slice-label',
      'Assignments ' + (from + 1) + '–' + (from + columns.length)
        + ' of ' + record.assignments.length));
  }

  const table = el('table', 'grades-report-table grades-report-grid');
  const thead = el('thead');
  const hrow = el('tr');
  hrow.append(cell('th', 'grades-report-student-head', 'Student'));
  columns.forEach((assignment) => {
    const th = cell('th', 'grades-report-col', '');
    th.append(el('span', 'grades-report-col-name', assignment.name));
    /* An empty due date is valid and stays empty, so the line is simply absent rather than printing
       a dash that would read as a date somebody deleted. */
    const due = assignment.due ? numericDate(assignment.due) : '';
    if (due) th.append(el('span', 'grades-report-col-due', 'due ' + due));
    th.append(el('span', 'grades-report-col-pts', 'out of ' + assignment.points));
    /* The whole date and the category, for a reader who is not looking at a printed page. */
    th.title = assignment.name + ' · ' + assignment.category
      + (assignment.due ? ' · due ' + plainDate(assignment.due) : ' · no due date')
      + ' · out of ' + assignment.points;
    hrow.append(th);
  });
  hrow.append(cell('th', 'grades-report-total-head', 'Grade'));
  thead.append(hrow);
  table.append(thead);

  const tbody = el('tbody');
  record.students.forEach((student) => {
    const tr = el('tr');
    tr.append(cell('th', 'grades-report-row-head', student.name));
    columns.forEach((assignment) => {
      const mark = student.cells.filter((c) => c.id === assignment.id)[0]
        || { text: '', flag: '' };
      const td = el('td', 'grades-report-cell');
      /* A blank cell holds nothing at all — see this file's header. The <span> is drawn either way
         so that a row's height does not depend on how much of it is graded. */
      td.append(el('span', 'grades-report-mark' + (mark.flag ? ' ' + mark.flag : ''), mark.text));
      tr.append(td);
    });
    const total = el('td', 'grades-report-total');
    if (student.grade) {
      total.append(el('span', 'grades-report-pct', student.grade));
      /* A document with no letter scale at all answers null rather than guessing a band
         (src/letter-scale.js), and an empty line under the number would read as a letter that failed
         to draw. So the letter appears only when there is one. */
      if (student.letter) total.append(el('span', 'grades-report-letter', student.letter));
    } else {
      /* NEVER AN EMPTY GRADE CELL — src/scores.css's rule about the same column on the screen this
         sheet is printed off: an empty cell in a grade column is indistinguishable from a rendering
         fault. The reason is on the cell as an accessible name. */
      const none = el('span', 'grades-report-pct none', '—');
      none.setAttribute('aria-label', 'No grade — ' + (student.message || 'there is no grade yet.'));
      total.append(none);
    }
    tr.append(total);
    tbody.append(tr);
  });
  table.append(tbody);
  wrap.append(table);
  return wrap;
}

export function openGrades(opener) {
  const body = document.getElementById(RECORD_BODY);
  if (!body) return;
  body.textContent = '';

  const record = gradesRecord();
  if (!record) {
    body.append(el('p', 'grades-report-empty',
      'No class is open, so there is no grade sheet to print. Open a class first.'));
    openModal(RECORD_MODAL, opener);
    return;
  }

  /* THE PRINTED HEADER, and it is the same element on screen. Class, term, range, what it holds and
     the scale in use, plus the day it was printed — which is what makes a sheet found in a folder
     next June mean anything at all. */
  const head = el('div', 'grades-report-head');
  const who = el('div', 'grades-report-who');
  who.append(el('div', 'grades-report-name', record.className));
  who.append(el('div', 'grades-report-sub', recordCaption(record)));
  who.append(el('div', 'grades-report-sub',
    'Printed ' + plainDate(record.printedISO) + ' · Planbook'));
  who.append(el('div', 'grades-report-scale', scaleText(record)));
  head.append(who);
  body.append(head);

  if (record.unbalanced) {
    /* § SHARED's banner, worn from src/scores.css exactly as the score grid and the per-student
       detail wear it: there is no grade at all until the weights total 100, so this is not a caveat
       attached to a number, it is the explanation standing where the number would have been. No
       "Open Categories" door on it — that button is on the screen this dialog opened from, one tap
       behind it, and a door out of a dialog that has to close the dialog first is a second route to
       a place the teacher is already standing next to. */
    const banner = el('div', 'grade-none');
    banner.append(el('span', 'grade-none-text', record.noGradeMessage));
    body.append(banner);
  }

  if (!record.students.length) {
    body.append(el('p', 'grades-report-empty',
      'There is nobody on this class’s roster yet, so the sheet has no rows. Paste the roster in '
        + 'and every student gets a line here.'));
    openModal(RECORD_MODAL, opener);
    return;
  }

  if (!record.assignments.length) {
    body.append(el('p', 'grades-report-empty',
      'Nothing has been assigned in ' + record.className
        + (record.termLabel ? ' for ' + record.termLabel : '') + ' yet, so there are no columns to '
        + 'print. Add work on the Assignments screen and each assignment gets one here, in due-date '
        + 'order.'));
    openModal(RECORD_MODAL, opener);
    return;
  }

  body.append(el('div', 'grades-report-label', 'Grades by student'));
  for (let from = 0; from < record.assignments.length; from += ASSIGNMENTS_PER_SLICE) {
    body.append(slice(record, from));
  }

  /* THE KEY, and it is not decoration: four of the five things a cell can say are one or two
     characters, and a teacher re-keying at speed six weeks from now is the reader. The empty cell is
     on the list because "nothing here" is a state somebody chose to leave. */
  const key = el('div', 'grades-report-key');
  [['18 L', 'a score you marked late — it counts in full; late is a record, not a penalty'],
    ['M', 'marked missing by you, and counted as zero out of the full points'],
    ['Ex', 'excused — out of the grade entirely, neither earned nor possible'],
    ['(empty)', 'not graded yet. A blank counts toward nothing and is never a zero']]
    .forEach(([glyph, meaning]) => {
      const item = el('span', 'grades-report-key-item');
      item.append(el('b', '', glyph));
      item.append(document.createTextNode(' ' + meaning));
      key.append(item);
    });
  body.append(key);

  body.append(el('p', 'grades-report-note',
    'This is grades and nothing else: names, the work in this term, and the marks you made. '
      + 'Nothing from a student’s support details is on this page or in the CSV, in either mode — '
      + 'those live on the roster and go nowhere but your own backup file. Nothing on this sheet '
      + 'was worked out from a due date either: late and missing are only ever there because you '
      + 'marked them.'));

  openModal(RECORD_MODAL, opener);
}

/* ────────────────────────────── out of the browser ────────────────────────────── */

/* WHETHER THIS SHEET IS WHAT IS ON SCREEN, asked of the DOM every time rather than remembered from
   a tap. This is the predicate the gate is answered from; src/print-gate.js carries the whole
   reasoning, including the two ways the timer it replaced came apart on 2026-08-12. It was written
   there first (WO-3.9) and moved out at WO-2.25 so that the other two surfaces stopped carrying
   their own copy of the mistake. */
function gradesOnScreen() {
  const modal = document.getElementById(RECORD_MODAL);
  return !!modal && !modal.classList.contains('hidden');
}

/* Registered at module scope, not around each print: the Ctrl+P a teacher presses with this dialog
   already open never comes through printGrades() and wants the same gate. src/shell.js imports this
   module at startup, so it is live from the first paint. */
const syncPrintGate = registerPrintGate(PRINT_ATTR, gradesOnScreen);

export function printGrades() {
  const body = document.body;
  if (!body) return false;
  /* Set here as well, for an engine that fires neither event: the gate has to be on before print()
     is called, and the listeners registered above only correct it later. */
  syncPrintGate();
  window.print();
  return true;
}

/*
  THE FILE, AS TEXT, WITH NO DOM IN IT.

  Three details are load-bearing and all three are lifted from WO-2.6's recordCsv() rather than
  reasoned out again:

    - A BOM, so Excel reads the file as UTF-8. Without it a name with an accent in it arrives
      mangled and the teacher's first thought is that the app broke her roster.
    - CRLF line endings, which is what the CSV convention says and what Excel is happiest with.
    - A cell is quoted only when it holds a quote, a comma or a newline, and a quote inside one is
      doubled. Every student name in this file holds a comma by construction — `Last, First` is the
      display the owner pinned — so the quoting rule is not a precaution here, it is the format.

  IT IS SECTIONS RATHER THAN ONE TABLE, which is src/detail.js's shape and for its reason: the head,
  the scale, the column key and the grid are four shapes, and padding four of them to one width
  would produce a sheet of empty columns. Each carries its own header row and is separated by a
  blank line, which is what every spreadsheet this will meet opens as written.

  THE SECTIONS ARE IN THE ORDER THE PAGE READS — head, scale, columns, grid — and the GRID's rows
  and columns are the printed grid's, cell for cell: the same students in the same order, the same
  assignments in the same order, and the same text in every cell, because both surfaces call
  markText(). The order stops being one decision the moment these two disagree.
*/
export function gradesCsv(record) {
  const rows = [];

  rows.push(['Planbook — class grade sheet']);
  rows.push(['Class', record.className]);
  rows.push(['Term', record.termLabel]);
  if (record.dated) rows.push(['Term dates', record.start, record.end]);
  rows.push(['Exported', record.printedISO]);
  rows.push(['Students', record.students.length]);
  rows.push(['Assignments', record.assignments.length]);
  rows.push([]);

  rows.push(['Letter scale', record.ownScale ? 'this class’s own bands' : 'the year’s bands']);
  rows.push(['Letter', 'Minimum %']);
  record.scale.forEach((band) => rows.push([band.letter, band.min]));
  rows.push([]);

  /* The column key: what each column of the grid below is, in the grid's own order. On paper these
     three facts are IN the column head; a spreadsheet cannot hold three lines in one header cell,
     so they are a section of their own rather than a header row three deep — three header rows
     would read as students called "Due" and "Out of". */
  rows.push(['Assignment', 'Category', 'Due', 'Out of']);
  record.assignments.forEach((a) => rows.push([a.name, a.category, a.due, a.points]));
  rows.push([]);

  /* ONE `Student` COLUMN HOLDING `Last, First`, and it is a departure from WO-2.6's CSV, which
     splits Last Name and First Name into two. That file is Roll Call!'s column-for-column and its
     shape is an export somebody might re-import; this one is a spreadsheet copy of a sheet whose
     name display the owner pinned as the join against the SIS. Two columns here would be a file
     whose first column is not the sheet's first column. */
  const head = ['Student'];
  record.assignments.forEach((a) => head.push(a.name));
  head.push('Grade', 'Letter');
  rows.push(head);

  record.students.forEach((student) => {
    const row = [student.name];
    student.cells.forEach((mark) => row.push(mark.text));
    row.push(student.grade, student.letter);
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
  "Planbook Biology I Q1 grades 2026-08-12.csv" — the same "Planbook … <what> <date>" family the
  backup files, the attendance CSV and the per-student grade CSV all use, so the whole set sorts
  together in a Files listing and a teacher can tell at a glance which term a file is of. The
  per-student file carries the student's name between "Planbook" and the class; this one has no name
  in that position, which is what tells the two apart in a folder.

  The class and term labels are typed by the teacher and can hold anything, including the handful of
  characters iPadOS and Windows both refuse in a file name. They are replaced rather than stripped,
  so "Period 2/3" stays two numbers. Accented characters are NOT touched: they are legal in a file
  name on both platforms, and stripping them would be the app mangling a name on its way out.
*/
function csvName(record) {
  const clean = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = ['Planbook', clean(record.className)];
  if (record.termLabel) parts.push(clean(record.termLabel));
  parts.push('grades', record.printedISO);
  return parts.filter(Boolean).join(' ') + '.csv';
}

export function downloadGradesCsv() {
  const record = gradesRecord();
  if (!record) return false;
  const file = gradesCsv(record);
  handToBrowser({ name: file.name,
    blob: new Blob([file.text], { type: 'text/csv;charset=utf-8' }) });
  /* Said rather than shown: this dialog has no status line and does not want one — the file lands
     in the Files app or in Downloads and the browser says so itself. What a screen-reader user gets
     otherwise is a button that does nothing at all. */
  announce('Saved ' + file.name);
  return true;
}
