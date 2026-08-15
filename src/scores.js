/*
  The score entry grid — one class, one term, students down and assignments across.

  THE SECOND-MOST-FREQUENT ACTION IN THE APP, and it gets the same care as marking attendance
  (WO-3.5's own first line). Grades go in once or twice a week for five classes; if this is slow,
  the app is not used. So the whole screen is arranged around one sentence from its acceptance list:
  entering 25 scores down a column takes 25 keystroke-groups and no mouse.

  ── IT IS A VIEW AND THERE IS NO DIALOG ANYWHERE IN IT ──

  This is the decision this file was most likely to get wrong, and the evidence in the repository
  points the other way: every class-scoped editor built before 2026-08-09 is a modal, and
  src/assignments.js beside it has three. plans/gradebook-surfaces.md is the record, it is settled
  rather than open, and § "The score grid is the one that cannot be a modal" gives three reasons in
  the order they bite. The first is the one that governs this file:

    A MODAL CLOSES ON `Esc`, and `Esc` is the key a teacher's hand is nearest while typing a column
    of 25 numbers. One stray press two-thirds of the way down and the surface holding her place is
    gone. A focus trap wants `Tab`, which in a grid means the next assignment. And `.modal-panel` is
    480px where this needs the full 1300px `.main`.

  So `Esc` is deliberately not bound here at all, and there is nothing on this screen for it to
  close — which is an acceptance line, and the work order says to prove it by pressing it rather
  than by arguing the screen is a view. tools/verify-shell.mjs § "the score entry grid (WO-3.5)"
  presses it twice, two thirds of the way down a column, with a freshly typed digit in the field,
  and asserts the caret, the digit and the screen are all where they were.

  ── NOTHING HERE COMPUTES A GRADE ──

  Every number on this screen comes out of src/grade-engine.js (WO-3.4), which is the only grade
  arithmetic in the app and is checked by hand against docs/grade-math-cases.md. If you find
  yourself summing points in this file, stop: two answers to "what is this student's grade" is how a
  gradebook and its own detail screen end up disagreeing in front of a guardian.

  Two of the engine's four exports are called below and two are not, deliberately.
  weightedClassGrade() answers each row, and letterFromPercentage() bands the CLASS AVERAGE — which
  is an average across students rather than a weighted average of categories, so the engine has no
  export for it and this file makes it (see classAverage(), which says what it is and is not).
  categoryResult() and categoryPercentage() are the per-category breakdown, and the screen that
  shows one is WO-3.7's.

  ── FIVE THINGS THAT WILL LOOK LIKE OMISSIONS AND ARE DECISIONS ──

  1. NOTHING IN THIS FILE READS A CLOCK. Not `todayISO()`, not `new Date()`, nothing — and that is
     still true now that the drawing's overdue tint on a column head is built, which is the whole
     reason it is built the way it is. `late` and `missing` are marked by the teacher, never inferred
     (CLAUDE.md).

     WHAT CHANGED AT WO-3.6, because this decision said "everything about a past due date on this
     screen is WO-3.6's prompt" and that work order has now landed: the prompt is here, in the
     banner above the grid, and the clock it reads is src/past-due.js's. That module owns the
     comparison, the set of blanks it names, and the one write it offers; this file calls
     paintPastDue() at the end of its render and knows nothing else about a date.

     WHAT CHANGED AT WO-3.19 is the tint itself, which WO-3.5 left in the drawing and WO-3.6
     deliberately did not ship. It is DRAWN here and DECIDED there: columnHead() asks
     pastDueAsksAbout(), which is a read of the set paintPastDue() has already computed this render,
     rather than comparing a due date to today. So the amber heads are exactly the assignments the
     banner's sentence names, and there is still no comparison against a date anywhere in this file.

     THE SPLIT IS THE POINT rather than an accident of layering — a screen that both reads a clock
     and writes score cells is a screen where "the grade changed because a date rolled over" becomes
     a one-line mistake. src/scores.css says the same thing about the rule that colours it.

  2. A CELL IS ALWAYS AN OBJECT, AND CLEARING ONE DELETES THE KEY. There is no `{ v: null }` with no
     flag anywhere in the writes below — writeCell() refuses to store one, and that is acceptance
     line 4 held by construction rather than by remembering. A missing key means ungraded and affects
     nothing (docs/data-model.md); a cell that says `null` and nothing else is the same fact written
     down twice, and the second copy is the one a later reader trusts wrongly.

  3. THE FIELD IS NEVER RE-RENDERED WHILE IT IS BEING TYPED IN, but the grades are, on every
     keystroke. That is the same split src/categories.js states for its weight field: replacing the
     input under the caret takes the caret with it, and a live number that lags the field it is
     computed from is worse than no live number. So editScore() writes, repaints the grade column and
     the summary, and touches no input at all.

  4. THE KEYS STRIP IS NOT A STORED PREFERENCE. It opens on a tap and closes on the next one, and
     nothing remembers. src/roster.js's supportsShown makes the same call for a stronger reason;
     here it is simply that a legend read once in September is not a fact about this browser worth
     keeping, and src/prefs.js's list is the shorter for not carrying it.

  5. NO SUPPORT DATA APPEARS ON THIS SCREEN AT ALL — no indicator dot, no plan, nothing. This is a
     screen teachers project, and the safest form of CLAUDE.md § Accommodations rule 1 on a grid of
     names is to have nothing to suppress. If a later work order wants the roster's dot here, it
     goes through src/supports.js like every other surface, and src/shell.js's flipPresentationMode()
     gains this screen's repaint in the same pass.
*/

import { getDoc, update } from './store.js';
import { announce } from './live-region.js';
/* The resolution of "which class and which term is open" stays in src/classes.js — this file asks
   rather than keeping its own answer, the same import src/assignments.js and src/attendance.js
   make. The import runs one way: nothing in src/classes.js knows this file exists. */
import { getSelectedClass, getSelectedTerm } from './classes.js';
/* The category list and the way a weight is written down. src/categories.js is a leaf and imports
   nothing back, which is what lets this file and src/assignments.js both wear it. formatWeight() is
   imported rather than copied so that the banner here prints a total in exactly the same words the
   categories panel does — two formatters would eventually disagree about 33.335 with a teacher
   looking at both numbers at once. */
import { categoriesOf, formatWeight, weightTotal } from './categories.js';
/* How a student's name reads on a roster row, and how it reads in a sentence. Imported from
   src/roster.js for the reason src/attendance.js imports the same two: a second copy of those eight
   lines could be right about a hyphen, a suffix or a half-typed name in a way this one is not. */
import { rosterName, fullName } from './roster.js';
/* THE ONLY GRADE ARITHMETIC IN THE APP (WO-3.4). See this file's header. */
import { letterFromPercentage, weightedClassGrade } from './grade-engine.js';
/* THE PAST-DUE PROMPT (WO-3.6), which is the one thing on this screen that reads a clock and is
   deliberately not in this file — see decision 1. This file draws it by calling one function and
   passing nothing: that module asks src/classes.js which class and term are open, exactly as this
   one does. The import runs one way; nothing in src/past-due.js knows this file exists, which is
   what keeps the write it offers out of the typing path.

   THE SECOND IMPORT IS THE COLUMN-HEAD TINT (WO-3.19) and it is a QUESTION rather than a paint:
   pastDueAsksAbout() answers, per assignment, whether the banner drawn a moment ago is asking about
   that column. It is imported for the same reason letterFromPercentage() is — the answer is already
   owned somewhere, and a local copy of the comparison would be a second reader of the date that
   AGENTS.md forbids by name. */
import { paintPastDue, pastDueAsksAbout } from './past-due.js';

const CLASS_NAME_ID = 'scoresClassName';
const HEADLINE_ID = 'scoresHeadline';
const SUMMARY_ID = 'scoresSummary';
const NO_GRADE_ID = 'scoresNoGrade';
const NO_GRADE_TEXT_ID = 'scoresNoGradeText';
const ACTIONS_ID = 'scoresActions';
const FLAGS_ID = 'scoresFlags';
const KEYS_ID = 'scoresKeys';
const KEYS_BTN_SEL = '#scoresView [data-scores-keys]';
const GRID_WRAP_ID = 'scoresGridWrap';
const HEAD_ID = 'scoresHead';
const BODY_ID = 'scoresBody';
const CAPTION_ID = 'scoresCaption';
const EMPTY_ID = 'scoresEmpty';
const HINT_TERM_ID = 'scoresHintTerm';

/* Whether the key legend is open. A module variable rather than a preference — decision 4 in the
   header. */
let keysOpen = false;

/*
  WHICH CELL THE FLAG BAR ACTS ON, held as two ids rather than as an element, for the reason
  src/classes.js gives about everything else held across a render: the document can be replaced
  underneath this module by a restore or a year switch, and an element held across that is a cell in
  a grid nobody has open.

  IT IS TRACKED ON `focusin` RATHER THAN READ FROM document.activeElement, and that is Safari
  again — the same divergence src/modal.js records in its header. Safari does not focus a button
  when you tap it, so by the time a tap on "Missing" reaches its handler the active element is
  <body> on the iPad and the button itself on a laptop; neither is the cell the teacher meant. So the
  cell says when it is entered, and the flag bar reads that and hands focus back.
*/
let focusedAssignmentId = '';
let focusedStudentId = '';

/* ────────────────────────────── reading the document ────────────────────────────── */

function assignmentsIn(doc) {
  return doc && Array.isArray(doc.assignments) ? doc.assignments : [];
}

/* THE GUARD, in the two lines every query in this file goes through — class first and term second,
   and both always. src/assignments.js's header carries the long version: the moment an assignment
   can be copied between classes, a query by id alone is a query that can answer with another
   class's work. A column drawn here for an assignment in another class would put a teacher's
   keystroke into a class the screen does not name. */
function assignmentsOf(classId, termId) {
  if (!classId) return [];
  return assignmentsIn(getDoc()).filter((a) => a.classId === classId && a.termId === termId);
}

function findAssignment(classId, termId, id) {
  return assignmentsOf(classId, termId).filter((a) => a.id === id)[0] || null;
}

function studentsIn(doc) { return doc && Array.isArray(doc.students) ? doc.students : []; }

/* A roster id that names nobody is dropped rather than drawn as a blank row — the same harmless
   failure src/attendance.js's rosterOf() describes, from a restored or hand-edited document. */
function rosterOf(cls) {
  const doc = getDoc();
  const ids = cls && Array.isArray(cls.roster) ? cls.roster : [];
  return ids.map((id) => studentsIn(doc).filter((s) => s.id === id)[0]).filter(Boolean);
}

/*
  THE ORDER THE ROWS ARE DRAWN IN, and it is the registry's — surname then first name.

  The two screens list the same students and a teacher moves between them all week, so the seam is
  the thing to avoid: finding Patel in one order on Attendance and another here is the kind of
  friction that gets an app abandoned. src/attendance.js's markingOrder() states the reasoning for
  the sort itself.

  THERE IS NO SORT CONTROL, and the drawing has one ("Sort: roster order"). It is deliberately not
  built: nothing in this work order's deliverables asks for a second order, and the question the
  control is really about — whether a pasted column of marks lines up against the roster's own order
  or an alphabetical one — belongs to WO-3.13, which owns pasting a column and its alignment rules.
  That is the seam this screen leaves for it rather than a surface it builds ahead of it.

  EXPORTED AT WO-3.9, which asked for exactly this order under its own name: the printed grade sheet
  lists students alphabetically by last name, which is what this already is. The import runs one
  way — nothing in this file knows src/grades-report.js exists — and it is one function rather than
  two copies of a sort for the reason src/attendance-report.js gives about its own readers: a second
  comparator could be right about a hyphen or an empty surname in a way this one is not, and a sheet
  that listed a class in a different order from the screen it was printed off is a sheet a teacher
  re-keying from it loses her place in.
*/
export function gridOrder(cls) {
  return rosterOf(cls).slice().sort((a, b) => {
    const lead = String(a.last || '').localeCompare(String(b.last || ''));
    if (lead !== 0) return lead;
    return String(a.first || '').localeCompare(String(b.first || ''));
  });
}

/* Every read of one cell goes through here. A cell is always an object (docs/data-model.md), and a
   document that arrived from a restore or a hand edit carrying a bare number is treated as no cell
   at all rather than being repaired in place — the same posture src/grade-engine.js takes, and for
   the same reason: accepting two shapes is how a later grade comes to depend on which path wrote
   the cell. */
function cellOf(doc, assignmentId, studentId) {
  const column = doc && doc.scores ? doc.scores[assignmentId] : null;
  if (!column || !Object.prototype.hasOwnProperty.call(column, studentId)) return null;
  const cell = column[studentId];
  return cell && typeof cell === 'object' && !Array.isArray(cell) ? cell : null;
}

function flagOf(cell) {
  const flag = cell && cell.flag;
  return flag === 'late' || flag === 'missing' || flag === 'excused' ? flag : '';
}

function valueOf(cell) {
  if (!cell || cell.v === null || cell.v === undefined) return null;
  const n = Number(cell.v);
  return Number.isFinite(n) ? n : null;
}

/*
  WHAT ONE CELL HOLDS, AS THIS SCREEN READS IT — the number and the teacher's mark, and nothing else.

  EXPORTED AT WO-3.9, whose printed grade sheet has to say what is in every cell of a term. It is
  the three private readers above handed over as one answer rather than as three exports, because
  what a caller wants is never "the raw cell" — that is the shape src/grade-engine.js and this file
  each refuse to accept two versions of, and a third module resolving `{ v: null, flag: 'late' }` for
  itself is the copy that eventually disagrees about a late blank.

  `{ value: number|null, flag: '' | 'late' | 'missing' | 'excused' }`, and the pair is the whole of
  it: a cell with no key, a cell holding a bare number from a hand-edited document, and a cell whose
  value cannot be parsed all answer `value: null`, which is what ungraded means (docs/data-model.md).
  The import runs one way — nothing in this file knows src/grades-report.js exists.
*/
export function scoreMark(doc, assignmentId, studentId) {
  const cell = cellOf(doc, assignmentId, studentId);
  return { value: valueOf(cell), flag: flagOf(cell) };
}

/* A points value that is a number, for the sentence that says what a missing mark costs. What is
   STORED is whatever the teacher typed into the assignment editor, including 0 — src/assignments.js
   decision 2, and 0 is the extra-credit mechanism rather than a mistake. */
function pointsOf(assignment) {
  const n = Number(assignment && assignment.points);
  return Number.isFinite(n) ? n : 0;
}

/*
  IS THIS CELL UNGRADED — which is the question the summary's blank count is made of, and it is not
  "is the field empty".

  A cell contributes nothing to the grade when there is no key at all, or when it carries no value
  and no flag that means something (docs/data-model.md § Grade math: `missing` counts zero against
  full points, `excused` drops out). `excused` is therefore NOT a blank — it is a decision the
  teacher made — and neither is `missing`. A `late` with no score yet is: the flag records how it
  arrived and there is nothing to count.
*/
function isUngraded(cell) {
  if (!cell) return true;
  const flag = flagOf(cell);
  if (flag === 'missing' || flag === 'excused') return false;
  return valueOf(cell) === null;
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

/* `2026-09-08` → `Sep 8`. Read field by field rather than handed to `new Date('2026-09-08')`, which
   the spec reads as UTC midnight and which is one timezone away from being the day before —
   src/attendance.js's parseISO() carries the long version of that scar. A local copy for the reason
   src/assignments.js gives beside its own: the registry's short form is `9/8` for a column head and
   this grid wants a month a teacher can read at a glance. THIS IS THE ONLY DATE CODE IN THIS FILE
   AND IT READS NO CLOCK — see decision 1. */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function shortDate(iso) {
  const parts = String(iso || '').split('-');
  if (parts.length !== 3) return '';
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(d.getTime())) return '';
  return MON[d.getMonth()] + ' ' + d.getDate();
}

/*
  HOW A PERCENTAGE IS WRITTEN DOWN HERE: two fixed decimal places, because the SIS carries two
  decimals and this number is re-keyed into it by hand. The grade column and class average both use
  this formatter.

  EXPORTED AT WO-3.7, which is the third surface WO-3.14 said would inherit this line the day it
  existed. The per-student detail imports it from here rather than declaring its own, for the reason
  formatWeight() is imported from src/categories.js above: two formatters that have to agree is the
  second answer this repo keeps refusing, and the one that drifts is the one nobody is looking at.
  The import runs one way — nothing in this file knows src/detail.js exists.

  IT IS DISPLAY FORMATTING AND NOTHING ELSE. The letter beside it is banded from the UNROUNDED
  percentage — src/grade-engine.js asks src/letter-scale.js, which compares against `min`
  unmodified — because the boundary the teacher typed IS the rounding rule and a second one is
  exactly what WO-3.2's design deletes. Nothing here is ever handed back to the arithmetic.
*/
export function formatPercent(p) {
  return Number(p).toFixed(2) + '%';
}

/*
  THE CLASS AVERAGE, and what it is not.

  It is the mean of the grades this class actually has — one weighted grade per student, each one
  the engine's own answer, averaged across the students who have a grade. Students with no graded
  work are left out of the mean rather than counted as zero, which is the same rule the engine
  applies to an empty category one level down.

  IT IS NOT A GRADE, so no letter is written beside it in the summary; a class does not have a
  report card. letterFromPercentage() is called on it for the accessible label only, so a
  screen-reader user hears the same band a sighted teacher would read off the column below.

  With no grades at all it is null, and the summary prints an em dash — design/mockups/README.md's
  open question 3, answered the way the drawing drew it: the class average goes when the grades go,
  because it is made of them.
*/
function classAverage(doc, cls, termId, students) {
  const grades = students
    .map((s) => weightedClassGrade(doc, cls, termId, s.id).percentage)
    .filter((p) => p !== null);
  if (!grades.length) return null;
  return grades.reduce((sum, p) => sum + p, 0) / grades.length;
}

/* ────────────────────────────── writing one cell ────────────────────────────── */

/*
  THE ONLY FUNCTION IN THIS FILE THAT WRITES A SCORE, and the invariant it keeps is acceptance
  line 4: `null` means delete the key.

  A cell with no value and no flag is not a cell — it is the absence of one, and the absence is
  written by removing the key rather than by storing a shape that says the same thing. The column
  goes with its last cell for the same reason: an empty object under an assignment id is a column of
  no scores wearing a column's clothes, and every reader of `scores` would have to know that.
*/
function writeCell(assignmentId, studentId, cell) {
  update((doc) => {
    if (!doc.scores || typeof doc.scores !== 'object') doc.scores = {};
    if (!cell) {
      const column = doc.scores[assignmentId];
      if (!column) return;
      delete column[studentId];
      if (!Object.keys(column).length) delete doc.scores[assignmentId];
      return;
    }
    if (!doc.scores[assignmentId]) doc.scores[assignmentId] = {};
    doc.scores[assignmentId][studentId] = cell;
  });
}

/* A value and a flag folded into the one shape the data model allows, with the no-value-no-flag
   case answered by the caller getting `null` back and writeCell() deleting the key. `missing` and
   `excused` never carry a value: the engine ignores `v` on both (docs/data-model.md § Grade math),
   and a number displayed in a cell that the arithmetic is not using is the exact failure this work
   order's own deliverable names — "a score that silently isn't what you typed". */
function cellFor(value, flag) {
  if (flag === 'missing' || flag === 'excused') return { v: null, flag: flag };
  if (value === null) return flag ? { v: null, flag: flag } : null;
  return flag ? { v: value, flag: flag } : { v: value };
}

/* ────────────────────────────── the screen ────────────────────────────── */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/*
  ONE COLUMN HEAD: what it is, what it is out of, which category it counts in, and when it was due.

  The points are here rather than in every cell, which is what makes a bare `18` in a cell readable
  and what stops the grid printing "/20" twenty-five times down a column. The weight is in the chip
  because it is the fact that makes a mark out of 20 mean anything — `.cat-chip` is
  src/assignments.css § SHARED, worn as-is and never restyled from src/scores.css.

  createElement and textContent throughout, never innerHTML: an assignment called "Lab <write-up>"
  is typed by a teacher and has to be those characters rather than markup, and so is a category
  called "Labs & <projects>".
*/
function columnHead(assignment, cls) {
  const th = el('th', 'scores-col');
  th.scope = 'col';
  /* WHICH assignment this column is, said on the head as well as on every cell under it
     (`data-score-cell` in scoreCell() below). Nothing in the app reads it: it is here so that a check
     about which COLUMNS are tinted can name them rather than count them, which is the same job the
     ids on src/past-due.js's review chips do — "exactly the previewed cells" is otherwise a claim
     nobody can read back. A check that mapped head position to cell position would go quietly wrong
     the day a column is inserted, which is the shape of wrong this repo is worst at noticing. */
  th.setAttribute('data-score-col', assignment.id);
  th.append(el('span', 'scores-col-name', assignment.name || 'Untitled assignment'));
  th.append(el('span', 'scores-col-pts', 'out of ' + pointsOf(assignment)));

  const cat = categoriesOf(cls).filter((c) => c.id === assignment.categoryId)[0] || null;
  const weight = cat ? Number(cat.weight) : NaN;
  const zero = !Number.isFinite(weight) || weight === 0;
  const chip = el('span', 'cat-chip' + (cat && zero ? ' zero' : ''));
  if (cat) {
    chip.append(document.createTextNode((cat.name || 'Untitled category') + ' '));
    chip.append(el('b', '', formatWeight(Number.isFinite(weight) ? weight : 0) + '%'));
  } else {
    /* Work filed under no category this class has — reachable from a restored document, and counted
       by nothing until it is re-filed. src/assignments.js's list says the same thing in red on the
       row itself and is one tap away; here the chip says it without shouting, because this screen
       cannot fix it. */
    chip.append(document.createTextNode('no category'));
  }
  th.append(chip);

  const due = shortDate(assignment.due);
  /* No comparison here — decision 1. An empty due date is valid and stays empty (src/assignments.js
     decision 1), so the line is simply absent rather than printing a dash that would read as a date
     somebody deleted; that is also what makes an undated column impossible to tint, since there is
     no element for the class to go on.

     THE TINT (WO-3.19), AND IT IS A COLOUR AND NOTHING ELSE: it writes no cell, marks no student and
     moves no grade. WHICH columns wear it is src/past-due.js's answer rather than this file's, so
     they are exactly the assignments the banner above the grid names — and a column stops being
     amber on the render after its blanks are filled or marked, because the set it comes out of has
     stopped holding it. The `title` is the assignment list's own overdue tint word for word
     (src/assignments.js's renderRow), and the prompt's second line is the same sentence again: three
     surfaces saying one thing, kept identical on purpose. */
  if (due) {
    const dueLine = el('span', 'scores-col-due', 'due ' + due);
    if (pastDueAsksAbout(assignment.id)) {
      dueLine.classList.add('overdue');
      dueLine.title = 'This date has gone by and not everyone has a score yet. Nothing has been '
        + 'marked and no grade has changed — Planbook never decides anything from a date.';
    }
    th.append(dueLine);
  }
  return th;
}

/*
  ONE CELL: a real <input>, not a button that opens something. 25 scores down a column is the
  acceptance line, and every layer between the keyboard and the number costs 25 times.

  THE FLAG IS SAID TWICE — in the fill and in a glyph pinned to the corner — which is
  src/attendance.css's rule about the registry applied where it bites harder: in a grid of numbers a
  state carried only by a background disappears on hover, in print, and from the back of a room.
  It is also said a third time, to a screen reader, in the field's accessible name.
*/
function scoreCell(assignment, student, cell) {
  const td = el('td');
  const wrap = el('span', 'scores-cell');
  const flag = flagOf(cell);
  const value = valueOf(cell);

  const input = document.createElement('input');
  input.className = 'scores-input' + (flag ? ' ' + flag : '');
  /* `type="text"` with `inputmode="decimal"`, which is the drawing's answer to its own open
     question 1: a number input's spinner eats width in a 96px column and iOS draws its own
     affordances on one. src/scores.css says the rest. Whether iPadOS actually offers the decimal
     keypad for it is a 👤 line in TESTING.md § WO-3.5 and is unticked — no desk can answer it. */
  input.type = 'text';
  input.setAttribute('inputmode', 'decimal');
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('autocapitalize', 'off');
  input.spellcheck = false;
  /* `missing` and `excused` show no number because they hold none — the placeholder says which
     state it is instead, so a cell is never blank-looking while carrying a decision. */
  input.value = value === null ? '' : String(value);
  input.placeholder = flag === 'missing' ? '0' : flag === 'excused' ? 'Ex' : '—';
  input.setAttribute('data-score-cell', assignment.id);
  input.setAttribute('data-score-student', student.id);
  input.setAttribute('aria-label', (assignment.name || 'Untitled assignment')
    + ', out of ' + pointsOf(assignment) + ', for ' + fullName(student)
    + (flag ? ' — ' + flag : ''));
  wrap.append(input);

  if (flag) {
    const glyph = el('span', 'scores-flag ' + flag, flag === 'late' ? 'L' : flag === 'missing' ? 'M' : 'X');
    glyph.setAttribute('aria-hidden', 'true');
    wrap.append(glyph);
  }
  td.append(wrap);
  return td;
}

/* The grade cell's contents, from the engine's answer and nothing else. Two lines when there is a
   grade; a quiet em dash carrying the reason as its accessible name when there is not — never an
   empty cell, which in a grade column is indistinguishable from a rendering fault. */
function gradeContent(grade) {
  const box = document.createDocumentFragment();
  if (grade.percentage === null) {
    const none = el('div', 'scores-grade-none', '—');
    none.setAttribute('aria-label', 'No grade — ' + (grade.message || 'there is no grade yet.'));
    box.append(none);
    return box;
  }
  box.append(el('div', 'scores-grade-num', formatPercent(grade.percentage)));
  /* A document with no letter scale at all answers null rather than guessing a band
     (src/letter-scale.js), and an empty line under the number would read as a letter that failed to
     draw. So the letter appears only when there is one. */
  if (grade.letter) box.append(el('div', 'scores-grade-letter', grade.letter));
  return box;
}

/*
  THE LIVE HALF: every displayed grade, the class average and the banner, recomputed from the
  document and redrawn.

  Called on every keystroke as well as after every flag, and it deliberately touches no <input> —
  see decision 3. Every row is repainted rather than only the one that changed: the class average
  changes with any cell, the cost is 25 calls into a pure function over one class's work, and the
  alternative is this module keeping its own answer to "whose grade is on screen" to compare
  against, which is the second copy of the truth this repo keeps refusing.
*/
function paintGrades(cls, termId, students) {
  const doc = getDoc();
  const body = document.getElementById(BODY_ID);
  if (!body) return;

  students.forEach((student) => {
    const cell = body.querySelector('tr[data-score-row="' + student.id + '"] .scores-grade');
    if (!cell) return;
    cell.textContent = '';
    cell.append(gradeContent(weightedClassGrade(doc, cls, termId, student.id)));
  });

  paintSummary(cls, termId, students);
}

/*
  THE SUMMARY LINE AND THE NO-GRADE BANNER — the two places this screen says why a number is
  missing, and between them acceptance line 9.

  THE BANNER IS NOT A LABEL ON A NUMBER. The owner settled this on 2026-08-09: there is no grade at
  all until the weights total 100 (docs/data-model.md § Grade math), so the banner stands where the
  number would have been and says the total that caused it — "no grade" without the total is
  indistinguishable from a bug, and the total is both the reason and the instruction. Its copy is
  lifted from design/mockups/scores.html, which drew this state before it was built.

  NOTHING IS DISABLED WHILE IT IS UP. Every score field is still live and the keyboard path still
  works: WO-3.1's rule is "don't block them, tell them", and a screen that refused scores until the
  setup was finished would refuse them for the first week of a term.
*/
function paintSummary(cls, termId, students) {
  const doc = getDoc();
  const list = assignmentsOf(cls.id, termId);
  const summary = document.getElementById(SUMMARY_ID);
  const banner = document.getElementById(NO_GRADE_ID);
  const bannerText = document.getElementById(NO_GRADE_TEXT_ID);

  const total = weightTotal(cls);
  const cats = categoriesOf(cls);
  /* Asked of the engine rather than decided here: `weightedClassGrade` refuses to compute while the
     weights are unbalanced and says so in `reason`, and one class can only be in one of those states
     — so any student's answer settles it. A second copy of the equality rule in this file is how the
     banner and the grade come to disagree for decimal weights (src/categories.js's BALANCE_EPSILON
     carries that scar). */
  const probe = weightedClassGrade(doc, cls, termId, students.length ? students[0].id : '');
  const unbalanced = probe.reason === 'weights-unbalanced';

  if (banner && bannerText) {
    banner.classList.toggle('hidden', !unbalanced);
    if (unbalanced) {
      bannerText.textContent = cats.length
        ? 'These weights add up to ' + formatWeight(total) + '%, not 100%, so this class has no '
          + 'grade yet — Planbook will not work one out from weights that don’t add up. Keep '
          + 'entering scores; nothing here is blocked, and the grades appear the moment the '
          + 'weights do.'
        : cls.name + ' has no grading categories yet, so there is nothing for a grade to be an '
          + 'average of. Add the ones this class is graded on and the grades appear. Keep entering '
          + 'scores; nothing here is blocked.';
    }
  }

  if (!summary) return;
  summary.textContent = '';

  const average = classAverage(doc, cls, termId, students);
  const avg = el('span');
  avg.append(document.createTextNode('Class average '));
  avg.append(el('b', '', average === null ? '—' : formatPercent(average)));
  if (average !== null) {
    const band = letterFromPercentage(doc, cls, average);
    /* The band is spoken and not printed — see classAverage(): a class does not have a report card,
       and a letter beside this number would read as one. */
    avg.setAttribute('aria-label', 'Class average ' + formatPercent(average)
      + (band ? ', around a ' + band : ''));
  } else {
    avg.setAttribute('aria-label', 'Class average — no grades yet');
  }
  summary.append(avg);

  let blanks = 0;
  let touched = 0;
  list.forEach((assignment) => {
    const missing = students.filter((s) => isUngraded(cellOf(doc, assignment.id, s.id))).length;
    if (missing) touched += 1;
    blanks += missing;
  });
  summary.append(el('span', 'sep', '·'));
  summary.append(el('span', '', blanks
    ? plural(blanks, 'blank', 'blanks') + ' across ' + plural(touched, 'assignment', 'assignments')
    : 'nothing left blank'));

  summary.append(el('span', 'sep', '·'));
  const weights = el('span');
  weights.append(document.createTextNode('Weights total '));
  weights.append(el('b', '', formatWeight(total) + '%'));
  summary.append(weights);
}

/*
  THE SCREEN, redrawn from the open document. Called by src/shell.js after anything that changes
  what is in it and after a switch onto it — this module never subscribes to the store, for the
  reason src/classes.js gives: a subscriber fires on every save, and a redraw while a teacher is
  typing in a cell would take the caret out from under her.

  IT REBUILDS EVERY CELL, so nothing may call it from the typing path. editScore() and the flag
  writers repaint the grade column and the one cell they touched instead.
*/
export function renderScores() {
  const doc = getDoc();
  const cls = getSelectedClass();
  const term = getSelectedTerm();
  const termId = term ? term.id : '';
  const termLabel = term ? (term.label || 'Untitled term') : '';

  const heading = document.getElementById(CLASS_NAME_ID);
  if (heading) heading.textContent = cls ? cls.name : 'No class open';

  const headline = document.getElementById(HEADLINE_ID);
  const caption = document.getElementById(CAPTION_ID);
  const empty = document.getElementById(EMPTY_ID);
  const wrap = document.getElementById(GRID_WRAP_ID);
  const head = document.getElementById(HEAD_ID);
  const body = document.getElementById(BODY_ID);
  const actions = document.getElementById(ACTIONS_ID);
  const flags = document.getElementById(FLAGS_ID);
  const hintTerm = document.getElementById(HINT_TERM_ID);

  const list = cls ? assignmentsOf(cls.id, termId) : [];
  const students = cls ? gridOrder(cls) : [];

  if (hintTerm) hintTerm.textContent = termLabel || 'this class';
  if (headline) {
    headline.textContent = !doc ? 'No school year is open.'
      : !cls ? 'Add a class from the class bar first.'
        : 'Scores · ' + (termLabel || 'No term set') + ' · '
          + plural(students.length, 'student', 'students') + ' · '
          + plural(list.length, 'assignment', 'assignments');
  }
  if (caption) {
    caption.textContent = cls
      ? 'Scores in ' + cls.name + (termLabel ? ', ' + termLabel : '')
        + ' — students down, assignments across. Enter moves down a column.'
      : 'No class is open.';
  }

  if (!head || !body) return;
  /* Rows and columns are the structure this render replaces; the toolbar is deliberately not.
     That leaves the data-assignment-new opener alive while its modal is up, so Done or Cancel can
     use modal.js's ordinary focus return to put the caret on a stable, useful control instead of
     losing it with a rebuilt grid cell. It also makes another assignment one deliberate tap away. */
  head.textContent = '';
  body.textContent = '';

  /* The five states this screen can be in that are not "here is the grid", each said in words
     rather than left as an empty table. */
  let emptyText = '';
  if (!doc) emptyText = 'No school year is open, so there is nothing to grade yet.';
  else if (!cls) {
    emptyText = 'No class is open. Add one from the class bar first — a score belongs to a student, '
      + 'an assignment, a class and a term.';
  } else if (!termId) {
    emptyText = cls.name + ' has no terms yet, and an assignment belongs to one. Add a term from '
      + 'the class manager and this grid will have something to hold.';
  } else if (!students.length) {
    emptyText = cls.name + ' has no students yet, so there are no rows to grade. Add or paste the '
      + 'roster from the 👥 button and every student gets a line here.';
  } else if (!list.length) {
    emptyText = 'Nothing to grade in ' + cls.name + ' for ' + termLabel + ' yet. Add work on the '
      + 'Assignments screen — one tap on the strip above — and each assignment gets a column here.';
  }

  if (empty) {
    empty.textContent = emptyText;
    empty.classList.toggle('hidden', !emptyText);
  }
  /* The toolbar goes with the grid. A flag bar with no cell to act on and a legend for keys that
     would land nowhere are two dead controls, and a dead control is a feature a teacher goes
     looking for. */
  if (wrap) wrap.classList.toggle('hidden', !!emptyText);
  if (actions) actions.classList.toggle('hidden', !!emptyText);
  if (flags) flags.classList.toggle('hidden', !!emptyText);
  paintKeys();
  /* THE PAST-DUE PROMPT (WO-3.6), painted on both sides of the empty-state return below: with no
     term, no roster or no work there is nothing past due, and a banner left standing from the class
     before would be asking about work this screen is not showing.

     IT IS ALSO WHAT MAKES THE COLUMN HEADS TINTABLE (WO-3.19), which is why this call sits ABOVE the
     head row rather than under the finished grid. paintPastDue() recomputes the set the banner is
     drawn from; columnHead() then asks pastDueAsksAbout() which columns are in it. Move this line
     below the loop and every head answers about the class the teacher was on before — a wrong colour
     on a right date, which is the kind of stale nothing throws about. */
  paintPastDue();
  if (emptyText) {
    const banner = document.getElementById(NO_GRADE_ID);
    if (banner) banner.classList.add('hidden');
    const summary = document.getElementById(SUMMARY_ID);
    if (summary) summary.textContent = '';
    return;
  }

  const headRow = document.createElement('tr');
  const nameHead = el('th', 'scores-name', 'Student');
  nameHead.scope = 'col';
  headRow.append(nameHead);
  const gradeHead = el('th', 'scores-grade', 'Grade');
  gradeHead.scope = 'col';
  headRow.append(gradeHead);
  /* One column per assignment, in the order the document holds them — the same order the assignment
     list draws, which is the order the teacher put them in with its ↑ ↓. Nothing here sorts. */
  list.forEach((assignment) => headRow.append(columnHead(assignment, cls)));
  head.append(headRow);

  students.forEach((student) => {
    const row = document.createElement('tr');
    row.setAttribute('data-score-row', student.id);
    /* A `<td>` and not a `<th scope="row">`, which is the drawing's own markup and is the choice
       that keeps this sheet's `.scores-grid tbody td` padding and rule applying to the frozen
       column. Nothing is lost to a screen reader by it: every input in the row names its student in
       full in its own accessible name, which is more than a row header would have given. */
    const name = el('td', 'scores-name');
    name.append(detailDoor(student));
    row.append(name);
    /* Filled by paintGrades() below rather than here, so there is exactly one writer of a grade on
       this screen and the live path and the first paint cannot disagree. */
    row.append(el('td', 'scores-grade'));
    list.forEach((assignment) => {
      row.append(scoreCell(assignment, student, cellOf(doc, assignment.id, student.id)));
    });
    body.append(row);
  });

  paintGrades(cls, termId, students);
}

/*
  THE WAY INTO ONE STUDENT'S GRADE DETAIL (WO-3.7): their own name, in the frozen column, which is
  the same door src/attendance.js's historyDoor() puts on the registry and lifted for the same
  reason. WO-3.7 owns no navigation target of its own — you arrive there from a NAME, never from
  the switcher — so the names this screen already draws are what have to become the way in.

  IT IS THE NAME AND NOT A COLUMN OF ITS OWN. This grid's width is budgeted to the pixel and the
  frozen pair is 190 + 84 of it; a control beside the name would be paid for with an assignment
  column, on the screen where a column is a piece of work. The name is already there, it already
  means "this student", and there is nothing else it could do.

  IT WRITES NOTHING, which is what makes it safe on a screen built for typing: the cost of a mis-tap
  is a screen change and one tap on the switcher to come back. The cells a hand is aiming at are on
  the far side of the grade column, and the button carries `touch-action: manipulation` with the
  rest of this sheet's controls.

  The `title` keeps the whole name in it, because `.scores-name` is `white-space: nowrap` and a
  surname that runs past the frozen column still has to be readable on a laptop.
*/
function detailDoor(student) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'scores-name-btn';
  btn.setAttribute('data-student-detail', student.id);
  /* Named for what it opens rather than left to read out as a bare name, which is what a screen
     reader would otherwise announce this control as. */
  btn.setAttribute('aria-label', 'Grade detail for ' + fullName(student));
  btn.title = rosterName(student) + ' — where this grade comes from';
  btn.textContent = rosterName(student);
  return btn;
}

/* The key legend, and the button's own state. Drawn from `keysOpen` rather than by toggling a class
   at the tap, so the two cannot disagree after a re-render. */
function paintKeys() {
  const strip = document.getElementById(KEYS_ID);
  const btn = document.querySelector(KEYS_BTN_SEL);
  if (strip) strip.classList.toggle('hidden', !keysOpen);
  if (btn) btn.setAttribute('aria-expanded', keysOpen ? 'true' : 'false');
}

export function toggleScoreKeys() {
  keysOpen = !keysOpen;
  paintKeys();
  announce(keysOpen ? 'Keyboard shortcuts shown.' : 'Keyboard shortcuts hidden.');
}

/* ────────────────────────────── typing a score ────────────────────────────── */

/* Which cell an element is, resolved against the open class and term rather than against the id
   alone — the guard this file's assignmentsOf() exists for. Returns null for a cell that is not in
   the class on screen, which is a document that changed under a keystroke rather than a mistake. */
function resolveCell(element) {
  const cls = getSelectedClass();
  const term = getSelectedTerm();
  if (!cls || !term) return null;
  const assignmentId = element.getAttribute('data-score-cell');
  const studentId = element.getAttribute('data-score-student');
  const assignment = findAssignment(cls.id, term.id, assignmentId);
  if (!assignment) return null;
  const students = gridOrder(cls);
  const student = students.filter((s) => s.id === studentId)[0];
  if (!student) return null;
  return { cls: cls, termId: term.id, assignment: assignment, student: student, students: students };
}

/* Repaint one cell's flag — the wash, the corner glyph, the placeholder and the accessible name —
   without replacing the input the teacher is typing into. The input's VALUE is deliberately left
   alone on the typing path: what is in the field is what she typed, and the document holds the
   number that was read out of it. */
function paintCell(input, at, cell) {
  const flag = flagOf(cell);
  input.classList.remove('late', 'missing', 'excused');
  if (flag) input.classList.add(flag);
  input.placeholder = flag === 'missing' ? '0' : flag === 'excused' ? 'Ex' : '—';
  input.setAttribute('aria-label', (at.assignment.name || 'Untitled assignment')
    + ', out of ' + pointsOf(at.assignment) + ', for ' + fullName(at.student)
    + (flag ? ' — ' + flag : ''));

  const wrap = input.parentElement;
  if (!wrap) return;
  const old = wrap.querySelector('.scores-flag');
  if (old) old.remove();
  if (!flag) return;
  const glyph = el('span', 'scores-flag ' + flag, flag === 'late' ? 'L' : flag === 'missing' ? 'M' : 'X');
  glyph.setAttribute('aria-hidden', 'true');
  wrap.append(glyph);
}

/*
  A SCORE BEING TYPED. Called from src/shell.js's `input` listener, so it fires per keystroke and the
  store's debounce is what turns a column of them into a handful of saves (src/store.js).

  THREE THINGS IT DOES NOT DO. It does not re-render the field (decision 3). It does not clamp,
  round or refuse a number — a score above the points possible is extra credit on that assignment
  and a teacher is allowed to award it (docs/data-model.md § Extra credit), and a value that
  silently is not what she typed is the worst thing a gradebook can do. And it does not touch the
  flag, with one exception below.

  THE EXCEPTION: TYPING A NUMBER INTO A `missing` OR `excused` CELL TAKES THAT FLAG OFF. The engine
  ignores `v` on both of them, so a cell showing 8 and counting 0 would be the silent-wrong-number
  failure in its purest form. `late` is kept, because a late score is a score — the flag is a record
  and not a penalty. The change is visible in the cell the instant it happens, which is what the
  deliverable asks of a flag.
*/
export function editScore(input) {
  const at = resolveCell(input);
  if (!at) return;
  const doc = getDoc();
  const before = cellOf(doc, at.assignment.id, at.student.id);
  const raw = String(input.value).trim();
  let flag = flagOf(before);

  if (raw === '') {
    /* An emptied field is not automatically a cleared cell: a `missing` or `excused` cell shows no
       number either, and deleting the key here would silently undo a decision. What it does mean is
       that any VALUE is gone, and cellFor() turns "no value, no flag" into a deleted key. */
    writeCell(at.assignment.id, at.student.id, cellFor(null, flag));
  } else {
    const n = Number(raw);
    /* A field mid-way through a number reports things Number() cannot read — `-`, `1e`, `.` — and
       the answer to those is to write nothing at all rather than to store 0 or NaN. src/classes.js
       and src/categories.js both refuse the same way, one field over. */
    if (!Number.isFinite(n)) return;
    if (flag === 'missing' || flag === 'excused') flag = '';
    writeCell(at.assignment.id, at.student.id, cellFor(n, flag));
  }

  const after = cellOf(getDoc(), at.assignment.id, at.student.id);
  if (flagOf(before) !== flagOf(after)) paintCell(input, at, after);
  paintGrades(at.cls, at.termId, at.students);
}

/* Which cell the flag bar acts on — see the note at focusedAssignmentId. Called from src/shell.js's
   `focusin` listener. */
export function noteFocusedCell(input) {
  focusedAssignmentId = input.getAttribute('data-score-cell') || '';
  focusedStudentId = input.getAttribute('data-score-student') || '';
}

function inputFor(assignmentId, studentId) {
  return document.querySelector('#' + BODY_ID + ' [data-score-cell="' + assignmentId
    + '"][data-score-student="' + studentId + '"]');
}

/*
  ONE FLAG, SET OR TAKEN OFF, AND SAID OUT LOUD.

  `which` is `late`, `missing`, `excused` or `clear`, and the same value arrives from two places:
  the L / M / X / ⌫ keys, and the four buttons of the flag bar. One writer for both, because they
  are one act — the shape src/attendance.js's cycleMark() has with the registry's keyboard.

  THE SAME FLAG TWICE TAKES IT OFF, which is what makes every state reachable without a mouse:
  `late` off leaves the score, and `missing` or `excused` off leaves the cell blank, because those
  two hold no score to leave. `clear` empties the cell whatever is in it.

  SETTING `missing` OR `excused` CLEARS A TYPED SCORE, and says so out loud when there was one. The
  engine ignores `v` on both; keeping the number would leave the cell showing something the grade is
  not using. There is no undo in this app, so the sentence is the record of it.
*/
function applyFlag(at, which) {
  const input = inputFor(at.assignment.id, at.student.id);
  const before = cellOf(getDoc(), at.assignment.id, at.student.id);
  const had = flagOf(before);
  const value = valueOf(before);
  const who = fullName(at.student);
  const what = at.assignment.name || 'that assignment';
  let said = '';

  if (which === 'clear') {
    if (!before) {
      announce(what + ' for ' + who + ' is already blank.');
      return;
    }
    writeCell(at.assignment.id, at.student.id, null);
    said = what + ' for ' + who + ' is cleared to blank. Blank is ungraded and changes no grade.';
  } else if (had === which) {
    writeCell(at.assignment.id, at.student.id, cellFor(which === 'late' ? value : null, ''));
    said = what + ' for ' + who + ': ' + which + ' taken off.'
      + (which === 'late' && value !== null ? ' The score is unchanged.' : '');
  } else if (which === 'late') {
    writeCell(at.assignment.id, at.student.id, cellFor(value, 'late'));
    said = what + ' for ' + who + ': late. Late is a record and not a penalty — the score counts in '
      + 'full.';
  } else if (which === 'missing') {
    writeCell(at.assignment.id, at.student.id, cellFor(null, 'missing'));
    said = what + ' for ' + who + ': missing. It counts 0 out of ' + pointsOf(at.assignment) + '.'
      + (value !== null ? ' The ' + value + ' that was there has been cleared.' : '');
  } else {
    writeCell(at.assignment.id, at.student.id, cellFor(null, 'excused'));
    said = what + ' for ' + who + ': excused. It leaves the grade entirely — neither earned nor '
      + 'possible points.'
      + (value !== null ? ' The ' + value + ' that was there has been cleared.' : '');
  }

  const after = cellOf(getDoc(), at.assignment.id, at.student.id);
  if (input) {
    /* The field's value is written here — unlike on the typing path — because the flag is what
       changed it: a cell that has just been marked missing must not go on showing the 8 the
       arithmetic has stopped using. */
    const now = valueOf(after);
    input.value = now === null ? '' : String(now);
    paintCell(input, at, after);
  }
  paintGrades(at.cls, at.termId, at.students);
  announce(said);
}

/* The flag bar's four buttons, acting on the cell the teacher is in and handing focus back to it —
   see the note at focusedAssignmentId for why the cell is remembered rather than read off
   document.activeElement. */
export function flagFocusedCell(which) {
  const input = focusedAssignmentId && focusedStudentId
    ? inputFor(focusedAssignmentId, focusedStudentId) : null;
  if (!input) {
    announce('Tap a score first — these mark the cell you are in.');
    return;
  }
  const at = resolveCell(input);
  if (!at) return;
  applyFlag(at, which);
  /* Back to the cell, so the next thing typed lands where she was. The selection goes with it for
     the reason moveWithinColumn() gives: a score is overtyped far more often than it is edited. */
  input.focus();
  input.select();
}

/*
  MOVING DOWN THE COLUMN, which is the entry pattern this whole screen is arranged around: one
  assignment at a time, one keystroke-group per student.

  IT CLAMPS AT THE LAST ROW RATHER THAN WRAPPING, and that is acceptance line 2 — "Enter at the
  bottom of a column does something sensible and predictable". A wrap would put the teacher silently
  back at the top of a class she has just finished, where the next number she typed would overwrite
  the first student's mark. Moving on to the top of the NEXT assignment was the other candidate and
  is worse for the same reason plus one more: it changes which assignment she is grading without
  saying so, and `Tab` already means "the next assignment" in a grid. So the caret stays where it
  is, the cell keeps its selection, and the screen says out loud that this was the last student —
  because a key that does nothing and says nothing reads as a key that was not received.

  src/attendance.js's markSelected() clamps at the last row too, and Roll Call! clamps before it.

  THE VALUE IS SELECTED ON ARRIVAL, which is what makes overtyping the common case free: a cell
  already holding 14 takes `18` and `Enter` without a backspace.
*/
function moveWithinColumn(input, step) {
  const at = resolveCell(input);
  if (!at) return false;
  const column = Array.prototype.slice.call(document.querySelectorAll('#' + BODY_ID
    + ' [data-score-cell="' + at.assignment.id + '"]'));
  const index = column.indexOf(input);
  if (index === -1) return false;
  const next = column[index + step];
  if (!next) {
    const filled = column.filter((box) => String(box.value).trim() !== '').length;
    announce((at.assignment.name || 'This column') + ': that is the '
      + (step > 0 ? 'last' : 'first') + ' student. ' + filled + ' of ' + column.length
      + ' entered.');
    /* Focus and selection are left exactly where they are. Nothing moves, nothing closes, and the
       teacher's place is kept — which is the whole of "sensible and predictable" here. */
    input.select();
    return true;
  }
  next.focus();
  next.select();
  return true;
}

/*
  MOVING ACROSS THE ROW (WO-3.16) — the other half of a two-dimensional grid, and until it was built
  a teacher fixing a handful of cells along one student's row had the keyboard for the column and the
  trackpad for everything else.

  IT CLAMPS AND SAYS SO, exactly as moveWithinColumn() does above, because a different edge behaviour
  on this axis would read as a preference rather than as a rule. What it SAYS is shorter, and that is
  the one thing decided here rather than copied:

    down a column  — "<assignment>: that is the last student. 25 of 25 entered."
    across a row   — "<student>: that is the last assignment."

  The fixed thing is named first on both axes — the column being worked down, the student being
  worked along — and the count is dropped. "N of M entered" down a column is progress through a task
  the teacher is in the middle of and is what tells her the column is finished. Along a row there is
  no such task: the columns with no score in them mostly have no score for anybody yet. Worse, "4 of
  10 entered" spoken beside a student's name invites being heard as how that student is doing, and
  the grade two columns to the left is this app's only answer to that question — weighted, and
  computed by the engine rather than counted here.

  THE CARET IS LEFT ALONE AT THE EDGE, where moveWithinColumn() re-selects, and this is the same
  asymmetry caretCanLeave() below is about: this axis can be pressed with the caret parked inside a
  number, and re-selecting would throw away the position the teacher put it in. Where she arrived by
  keyboard the value is already selected and doing nothing keeps it that way, so the overtype
  affordance survives either way.
*/
function moveAcrossRow(input, step) {
  const at = resolveCell(input);
  if (!at) return false;
  /* Document order along the row IS the drawn column order, the same way the column mover reads the
     drawn rows: a check that mapped stored order to screen order would go quietly wrong the day a
     column is inserted. */
  const row = Array.prototype.slice.call(document.querySelectorAll('#' + BODY_ID
    + ' tr[data-score-row="' + at.student.id + '"] [data-score-cell]'));
  const index = row.indexOf(input);
  if (index === -1) return false;
  const next = row[index + step];
  if (!next) {
    announce(fullName(at.student) + ': that is the ' + (step > 0 ? 'last' : 'first') + ' assignment.');
    return true;
  }
  next.focus();
  next.select();
  return true;
}

/*
  WHETHER A SIDEWAYS ARROW BELONGS TO THIS GRID OR TO THE NUMBER IN THE CELL (WO-3.16), which is the
  whole of that work order rather than a detail of it.

  `ArrowLeft` and `ArrowRight` are ALSO how a caret moves inside a score being corrected. Taking them
  unconditionally would buy a sideways move at the price of making the middle digit of `100`
  unreachable without the pointer — a worse tax than the one the move removes. So THE HORIZONTAL PAIR
  IS DELIBERATELY NOT SYMMETRIC WITH THE VERTICAL ONE: up and down mean nothing to a caret in a
  one-line field, and left and right mean everything. The edge BEHAVIOUR is symmetric; which presses
  reach the edge at all is not.

  THE RULE: the key moves a cell only when the caret has nowhere left to go in the direction pressed.

    · the field is empty — there is no number to move through;
    · the whole value is selected, which is what every arrival leaves behind (moveWithinColumn(),
      moveAcrossRow() and the flag bar all select) and is "ready to overtype" rather than a caret
      position somebody chose;
    · or the caret is collapsed against that end — at the end of the value for `→`, at 0 for `←`.

  Anything else is an edit in progress, and the key goes back to the browser by answering false —
  the same contract every other key on this screen has, stated in the block below. A PARTIAL
  selection counts as an edit position: it is something the teacher made, and collapsing it is
  exactly what the arrow natively does with it.

  WHAT THE RULE COSTS, written down because it was accepted rather than missed: in a cell arrived at
  BY KEYBOARD, with the value selected, no arrow puts a caret inside the number — both of them move a
  cell. The ways in are a tap, which puts the caret where the finger went, and the first digit typed,
  which collapses the selection and hands the arrows straight back. The alternative was a first press
  that only collapses the selection and a second that moves; it was refused because stepping four
  columns along a row would take eight presses and the odd-numbered ones would look like keys that
  were not received — the failure the sentence at the edge exists to prevent.

  MODIFIERS ARE NOT READ, because src/shell.js passes a key name rather than an event and the
  vertical pair has never read them either. `Shift`+`←` over a full selection therefore moves a cell
  where a plain text field would shrink the selection. Named rather than fixed: the fix is a wider
  seam through shell.js for a gesture this screen has no other use for.
*/
function caretCanLeave(input, step) {
  const len = String(input.value).length;
  if (!len) return true;
  const from = input.selectionStart;
  const to = input.selectionEnd;
  /* Both read as numbers here because the cells are `type="text"` with `inputmode="decimal"` and not
     `type="number"`, which answers null to this question — see scoreCell(), where that choice is
     made for a different reason and this one now rides on it. A reading that is not a number is one
     this rule cannot be built on, so it is treated as a caret with nowhere to go: the move is the
     behaviour the key is FOR, and losing it silently is the worse of the two failures. */
  if (typeof from !== 'number' || typeof to !== 'number') return true;
  if (from === 0 && to === len) return true;
  if (from !== to) return false;
  return step > 0 ? from === len : from === 0;
}

/*
  THE GRID'S KEYS, routed from src/shell.js's `keydown` listener because focus is inside an <input>
  and the registry's own handler correctly refuses to look at those.

  Returns whether the key was used, so that shell.js knows whether to swallow it — a key this screen
  could not use belongs to the browser, which is the same contract src/attendance.js's markSelected()
  has and the reason type-ahead and every browser shortcut still work here.

  WHAT IS DELIBERATELY NOT BOUND:

    `Esc` — acceptance line 7. There is no dialog to close and no selection to drop, so it must do
    nothing at all. It is not listed below, so this function answers false and the browser gets it
    back; src/modal.js's own Escape handler returns early when no modal is open.

    `Tab` — it already means "the next assignment" in a grid, natively, because the cells are inputs
    in document order. Binding it would be re-implementing the platform, badly.

    Every digit, `.` and `-` — they are text in a text field, and the `input` listener reads the
    field afterwards. Nothing here intercepts a number.

  `L`, `M` and `X` ARE SWALLOWED WHETHER OR NOT THEY WROTE, which is the one departure from the
  contract above and it is not optional: a letter that fell through to a decimal field would be
  typed into the score. They always write something, so the question is theoretical — but the guard
  is where a later edit would break it.
*/
export function handleScoreKey(key, input) {
  if (key === 'Enter') return moveWithinColumn(input, 1);
  if (key === 'ArrowDown') return moveWithinColumn(input, 1);
  if (key === 'ArrowUp') return moveWithinColumn(input, -1);

  /* WO-3.16, and the `&&` is the contract rather than a shorthand: caretCanLeave() answering false
     answers false from here, so src/shell.js does not preventDefault and the caret gets the key. */
  if (key === 'ArrowRight') return caretCanLeave(input, 1) && moveAcrossRow(input, 1);
  if (key === 'ArrowLeft') return caretCanLeave(input, -1) && moveAcrossRow(input, -1);

  if (key === 'Backspace' || key === 'Delete') {
    /* Native editing while there is text to edit — a teacher correcting 187 to 18 expects a
       backspace to take one character, and hijacking that would make the whole column unfixable.
       Once the field is empty the same key means the cell, which is how "⌫ clear to blank" reaches
       a flag with no score in it: the second press takes the flag off and the key with it. */
    if (String(input.value).length) return false;
    const at = resolveCell(input);
    if (!at) return false;
    if (!cellOf(getDoc(), at.assignment.id, at.student.id)) return false;
    applyFlag(at, 'clear');
    return true;
  }

  const letter = String(key).length === 1 ? String(key).toUpperCase() : '';
  const which = letter === 'L' ? 'late' : letter === 'M' ? 'missing' : letter === 'X' ? 'excused' : '';
  if (!which) return false;
  const at = resolveCell(input);
  if (!at) return true;
  applyFlag(at, which);
  return true;
}
