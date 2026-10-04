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
  classGrade() answers each row, and letterFromPercentage() bands the CLASS AVERAGE — which
  is an average across students rather than a weighted average of categories, so the engine has no
  export for it and this file makes it (see classAverage(), which says what it is and is not).
  categoryResult() and categoryPercentage() are the per-category breakdown, and the screen that
  shows one is WO-3.7's.

  WO-3.28 MADE IT THREE OF FOUR: categoryPercentage() now answers the third frozen column, drawn
  only while one category's pill is picked, and the same figures averaged across the class are the
  category average on the summary line. Same posture as the overall grade — the engine answers per
  student, and the one mean this file takes is classAverage(), shared by both figures. Since the
  correction round on 2026-10-02 letterFromPercentage() also bands each student's category figure,
  under it, as it bands the grade beside it — see categoryAverageContent(). The class's category
  average on the summary line stays letterless, as the class average does.

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

     WO-3.32 IS THE FIRST THING HERE THE MODE TAKES AWAY, and it is not support data: a NOTE on a
     score cell is free text about one student, and under presentation mode it is absent — its mark,
     its panel, its tooltip and the "has a note" in a cell's accessible name. This file does not ask
     the mode itself: every note it draws is read through src/score-notes.js's visibleNoteOf(),
     which answers '' while projecting, so the question lives in one place. The repaint this
     paragraph predicted is in src/shell.js's flipPresentationMode() now.

     THE NOTE PANEL IS NOT A DIALOG, so the first rule above still stands. It is a strip of static
     markup under the flag bar (index.html, #scoresNote), opened by its own button and by no key —
     WO-3.32's Traps: score entry is the fast path, and a note on a keystroke the grid already uses
     would be a note opened by accident two thirds of the way down a column. `Esc` is still bound to
     nothing on this screen but the search box.
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
   lines could be right about a hyphen, a suffix or a half-typed name in a way this one is not.
   searchNeedle() and nameMatches() are the attendance search's rule, moved there at WO-3.29 so that
   this screen's box and the registry's are one test rather than two — see renderScores() below. */
import { rosterName, fullName, searchNeedle, nameMatches } from './roster.js';
/* THE ONLY GRADE ARITHMETIC IN THE APP (WO-3.4). See this file's header. gradingModeOf() is the one
   test of how a class is graded (WO-3.36), asked here rather than reading `cls.gradingMode` so that a
   stray value reads as weighted on this screen exactly as it does in the engine. */
import { categoryPercentage, letterFromPercentage, classGrade, gradingModeOf } from './grade-engine.js';
/* What the grade cell's em dash says when there is no grade (WO-3.42): the sentence student detail
   says, from the same function, so a bonus graded at 0 is never read out as nothing graded here
   while the detail screen one tap away says otherwise. No grade arithmetic — see that file's header;
   in a weighted class it reads no cell and hands back the engine's own sentence. */
import { gradedPieces, noGradeMessage } from './graded-pieces.js';
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
/* How a due date reads on a column head — `Sep 18`. THIS IS STILL THE ONLY DATE CODE ON THIS SCREEN
   AND IT STILL READS NO CLOCK (decision 1): src/date-text.js formats the string it is handed and
   asks nothing about today, so importing it spends none of that decision. It replaces the local copy
   this file carried until WO-3.20 — the copy's own comment said the assignment list carried an
   identical one and why neither was an import, which stopped being an argument at the fifth
   shortDate() in src/ and the third that returned a different string. */
import { shortDate } from './date-text.js';
/* A NOTE ON A CELL (WO-3.32). noteOf() is the stored note, read ONLY by the two writers below, which
   have to carry it across a change of value or flag in either mode; visibleNoteOf() is the note as it
   may be drawn, '' under presentation mode, and it is the only way a note reaches this screen's DOM.
   That file is the one asker of the mode for a note — see its header, and decision 5 above. */
import { noteOf, visibleNoteOf, scoreNotesVisible } from './score-notes.js';

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
const TOOLBAR_ID = 'scoresToolbar';
const SEARCH_ID = 'scoresSearch';
const FOUND_ID = 'scoresFound';
const CATS_ID = 'scoresCategories';
const NOTE_ID = 'scoresNote';
const NOTE_LABEL_ID = 'scoresNoteLabel';
const NOTE_TEXT_ID = 'scoresNoteText';
const NOTE_BTN_SEL = '#scoresView [data-score-note-open]';

/* Whether the key legend is open. A module variable rather than a preference — decision 4 in the
   header. */
let keysOpen = false;

/*
  WHAT THE SEARCH BOX HOLDS (WO-3.29), already trimmed and lower-cased by src/roster.js's
  searchNeedle(). A module variable and NOT a preference, for decision 4's reason and one of its own:
  a grid that reopened on last Tuesday's "ma" would be a class of four with nothing on screen saying
  why. It is emptied on every arrival (resetScoreSearch(), called from src/shell.js's
  showClassScreen()) and on nothing else — a repaint, a term change or a sync under the teacher keeps
  the rows she narrowed to.
*/
let searchText = '';

/*
  WHICH CATEGORY THE COLUMNS ARE NARROWED TO (WO-3.28), as a category id, or '' for *All*. A module
  variable and not a preference, for the calendar's ruling that a filter is a door: a grid that
  reopened on last Tuesday's *Quizzes* would be a grid missing two thirds of its columns with nothing
  on screen saying why. Emptied on every arrival (resetScoreCategory(), beside resetScoreSearch() in
  src/shell.js's showClassScreen()), and by renderScores() itself the moment the id stops naming a
  category with work in the open term — a term switched under the grid, or the last quiz deleted —
  because a pill that is not drawn cannot be the one that is on.
*/
let categoryId = '';

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

/* WHICH CELL THE OPEN NOTE PANEL IS ABOUT (WO-3.32), as two ids for the reason the pair above is —
   or two empty strings when the panel is shut. Not a preference: a panel that reopened after a
   reload would be a student's note on screen that nobody asked for. */
let noteAssignmentId = '';
let noteStudentId = '';

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
  or an alphabetical one — belonged to WO-3.13, which owned pasting a column and its alignment rules.

  WO-3.13 WAS STRUCK ON 2026-08-15: the owner's scores arrive on paper, so there is no column to
  paste and the alignment question has nobody to answer it. The control stays unbuilt, and the
  reason is now simpler than a seam being held open — nothing needs a second order. Do not read
  this as a feature waiting its turn. If pasting is ever wanted the work order is still written in
  plans/work-orders/phase-3-gradebook.md, kept for its positional-paste risk analysis, and this
  paragraph is where its alignment question comes back.

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

  IT TAKES THE PER-STUDENT FIGURE AS A FUNCTION SINCE WO-3.28, and that is the whole of the change.
  The category average on the summary line is the same question one level down — the mean of
  categoryPercentage() across the students who have one, a student with no graded work in the
  category left out rather than counted as zero — so it is this mean handed a different engine
  call, not a second averaging loop. NOT a pooled sum of points across the class: that would be a
  figure the engine never produces for anybody, and the SIS check this exists for is made student
  by student. The figure itself is always the engine's (`figureOf` below is a call into it at both
  sites); this function only averages what it is handed.

  EXPORTED AT WO-3.31, for the categories editor's mode confirmation, which prints the class average
  under each grading mode and has to print THIS figure — the work order's words are "do not write a
  second mean". The import runs one way: src/grading-mode.js reads this, gridOrder() and
  formatPercent() from here, and nothing in this file knows that one exists. The confirmation hands
  in a class COPY carrying the other mode, so the figure it prints for that side is the one this
  screen will draw after the switch.
*/
export function classAverage(students, figureOf) {
  const grades = students.map(figureOf).filter((p) => p !== null && p !== undefined);
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
/*
  A NOTE RIDES THROUGH EVERY WRITE HERE (WO-3.32). Every caller hands in a cell built by cellFor(),
  which knows only a value and a flag — so without this, typing a score, setting a flag or clearing
  to blank would silently delete the note on the cell, with no undo. The note is read off the cell
  as STORED (noteOf(), never the visible reader) because a flag set under presentation mode must not
  cost a note the screen is merely not showing. A cell that would otherwise be deleted keeps its note
  as `{ v: null, note }` — blank, ungraded, and still carrying what the teacher wrote. Only
  writeNote() below takes a note off.
*/
function writeCell(assignmentId, studentId, cell) {
  update((doc) => {
    if (!doc.scores || typeof doc.scores !== 'object') doc.scores = {};
    const column = doc.scores[assignmentId];
    const old = column && Object.prototype.hasOwnProperty.call(column, studentId)
      ? column[studentId] : null;
    const note = noteOf(old);
    const next = note ? Object.assign({}, cell || { v: null }, { note: note }) : cell;
    if (!next) {
      if (!column) return;
      delete column[studentId];
      if (!Object.keys(column).length) delete doc.scores[assignmentId];
      return;
    }
    if (!doc.scores[assignmentId]) doc.scores[assignmentId] = {};
    doc.scores[assignmentId][studentId] = next;
  });
}

/*
  THE ONLY FUNCTION THAT PUTS A NOTE ON A CELL OR TAKES ONE OFF (WO-3.32), on the attendance mark
  note's terms (docs/data-model.md): stored as typed, and an empty or whitespace-only field deletes
  the key rather than storing `""`. The value and the flag are left exactly as they are.

  AND writeCell()'S INVARIANT HOLDS HERE TOO: a cell left with no value, no flag and now no note is
  not a cell, so the key goes, and the column with its last key. Clearing the only note on a blank
  cell leaves the document as it was before the note was added — which is acceptance line 1's
  "clearing it removes the key", read all the way down.
*/
function writeNote(assignmentId, studentId, text) {
  const note = String(text == null ? '' : text);
  update((doc) => {
    if (!doc.scores || typeof doc.scores !== 'object') doc.scores = {};
    const column = doc.scores[assignmentId];
    const old = column && Object.prototype.hasOwnProperty.call(column, studentId)
      ? column[studentId] : null;
    const next = old && typeof old === 'object' && !Array.isArray(old)
      ? Object.assign({}, old) : { v: null };
    if (note.trim()) next.note = note;
    else delete next.note;
    if (valueOf(next) === null && !flagOf(next) && !noteOf(next)) {
      if (!column) return;
      delete column[studentId];
      if (!Object.keys(column).length) delete doc.scores[assignmentId];
      return;
    }
    if (!doc.scores[assignmentId]) doc.scores[assignmentId] = {};
    doc.scores[assignmentId][studentId] = next;
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
  /* A CLASS GRADED ON TOTAL POINTS GETS THE CATEGORY'S NAME AND NOTHING ELSE (WO-3.36). Its grade
     ignores the weights, so "Essays 40%" over a column would be the screen telling her the grade is
     weighted — and the dashed `.zero` chip says "this counts for nothing", which in that formula a
     0% category does not mean. The weighted chip below is unchanged, word for word. No share of the
     points is drawn in its place: src/assignments.js's group head dropped its chip the same way at
     WO-3.34, and a share belongs to pointsShare() and the categories editor, not to a column. */
  const byPoints = gradingModeOf(cls) === 'points';
  const weight = cat ? Number(cat.weight) : NaN;
  const zero = !Number.isFinite(weight) || weight === 0;
  const chip = el('span', 'cat-chip' + (cat && zero && !byPoints ? ' zero' : ''));
  if (cat && byPoints) {
    chip.append(document.createTextNode(cat.name || 'Untitled category'));
  } else if (cat) {
    chip.append(document.createTextNode((cat.name || 'Untitled category') + ' '));
    chip.append(el('b', '', formatWeight(Number.isFinite(weight) ? weight : 0) + '%'));
  } else {
    /* Work filed under no category this class has — reachable from a restored document. In a
       weighted class it is counted by nothing until it is re-filed; in a class graded on total
       points it counts, under "no category" (WO-3.30). src/assignments.js's list says which, on the
       row itself and one tap away; here the chip says it without shouting, because this screen
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
  input.setAttribute('aria-label', cellLabel(assignment, student, cell));
  wrap.append(input);

  if (flag) {
    const glyph = el('span', 'scores-flag ' + flag, flag === 'late' ? 'L' : flag === 'missing' ? 'M' : 'X');
    glyph.setAttribute('aria-hidden', 'true');
    wrap.append(glyph);
  }
  paintNoteMark(input, wrap, cell);
  td.append(wrap);
  return td;
}

/* A cell's accessible name: what it is, out of what, for whom, its flag, and — since WO-3.32 —
   whether it carries a note. Said as "has a note" and never as the note itself: a screen reader
   walking a column would otherwise read twenty-five sentences aloud between the numbers. Under
   presentation mode visibleNoteOf() answers '' and the clause is not there. */
function cellLabel(assignment, student, cell) {
  const flag = flagOf(cell);
  return (assignment.name || 'Untitled assignment')
    + ', out of ' + pointsOf(assignment) + ', for ' + fullName(student)
    + (flag ? ' — ' + flag : '')
    + (visibleNoteOf(cell) ? ', has a note' : '');
}

/*
  THE NOTE MARK (WO-3.32) — a small indigo corner folded down at the cell's top LEFT, because the
  top right is the flag glyph's and a cell can carry both. Indigo because it is the colour of a
  thing the teacher chose (src/attendance.css's write block says the same of its own indigo), and a
  corner rather than a wash because the fill already says the flag: a second fill would be two
  states fighting over one background. It is `aria-hidden` — the accessible name above carries it.

  THE NOTE ITSELF RIDES ON THE FIELD'S `title`, so a laptop reads it on hover without opening the
  panel. Both come from visibleNoteOf(), so under presentation mode there is no mark and no title:
  absent rather than hidden, which is the only kind of hidden a screenshot or find-in-page respects.
  Called on first paint and again after any write that can change the note, never on the typing path.
*/
function paintNoteMark(input, wrap, cell) {
  const note = visibleNoteOf(cell);
  const old = wrap.querySelector('.scores-note-mark');
  if (old) old.remove();
  if (!note) {
    input.removeAttribute('title');
    return;
  }
  input.title = 'Note: ' + note;
  const mark = el('span', 'scores-note-mark');
  mark.setAttribute('aria-hidden', 'true');
  wrap.append(mark);
}

/* The grade cell's contents, from the engine's answer and nothing else. Two lines when there is a
   grade; a quiet em dash carrying the reason as its accessible name when there is not — never an
   empty cell, which in a grade column is indistinguishable from a rendering fault.

   THE REASON IS noGradeMessage()'s (WO-3.42), not the engine's sentence read straight off: in a class
   graded on total points, a student whose only graded work is extra credit graded at 0 has no grade
   and the engine calls that "There is no graded work yet.", which is false. The cells are asked only
   when there is no grade, because this runs on every keystroke and the answer is read nowhere else. */
function gradeContent(grade, doc, cls, termId, studentId) {
  const box = document.createDocumentFragment();
  if (grade.percentage === null) {
    const none = el('div', 'scores-grade-none', '—');
    const says = noGradeMessage(grade, gradedPieces(doc, cls, termId, studentId));
    none.setAttribute('aria-label', 'No grade — ' + (says || 'there is no grade yet.'));
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
    cell.append(gradeContent(classGrade(doc, cls, termId, student.id), doc, cls, termId, student.id));
    /* THE THIRD FROZEN COLUMN (WO-3.28), repainted on the same keystroke as the grade beside it and
       for the same reason: a score typed into a quiz moves the Quizzes average, and a figure that
       lagged the field it is made of would be worse than none. The cell exists only while a
       category is picked; with none picked this finds nothing and writes nothing. */
    const avg = cell.parentElement && cell.parentElement.querySelector('td.scores-cat-avg');
    if (avg && categoryId) {
      avg.textContent = '';
      avg.append(categoryAverageContent(doc, cls,
        categoryPercentage(doc, cls, termId, categoryId, student.id)));
    }
  });

  paintSummary(cls, termId, students);
}

/* One student's category average, from the engine's answer and nothing else, and drawn the way the
   grade beside it is drawn: the percentage on one line and its letter on the next, in the grade
   cell's own two classes, so across a row the two numbers share a line and the two letters share the
   next — the pair reads across rather than stepping.

   THE LETTER IS THE OWNER'S RULING AT THE 👤 READING (2026-10-02), and it reverses the one this
   function was first written to: "a percentage and no letter, because a category does not get a
   report card". A STUDENT'S category figure is what the teacher checks against the SIS, and the SIS
   shows it with its letter, so leaving the letter off made the check a mental banding step. The
   CLASS's category average on the summary line stays letterless, for the reason classAverage() still
   gives about a class. The letter is letterFromPercentage()'s for THIS figure — never the overall
   grade's letter carried across — and, as in gradeContent(), it is absent when the document has no
   letter scale rather than an empty line that reads as a letter which failed to draw.

   A student with no graded work in the category gets the grade column's own quiet em dash with the
   reason as its accessible name, and no letter: there is nothing to band. */
function categoryAverageContent(doc, cls, percentage) {
  const box = document.createDocumentFragment();
  if (percentage === null || percentage === undefined) {
    const none = el('div', 'scores-grade-none', '—');
    none.setAttribute('aria-label', 'No average — no graded work in this category yet.');
    box.append(none);
    return box;
  }
  box.append(el('div', 'scores-grade-num', formatPercent(percentage)));
  const letter = letterFromPercentage(doc, cls, percentage);
  if (letter) box.append(el('div', 'scores-grade-letter', letter));
  return box;
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
  /* Asked of the engine rather than decided here: `classGrade` refuses to compute while a
     weighted class's weights are unbalanced and says so in `reason`, and one class can only be in one of those states
     — so any student's answer settles it. A second copy of the equality rule in this file is how the
     banner and the grade come to disagree for decimal weights (src/categories.js's BALANCE_EPSILON
     carries that scar). */
  /* A CLASS GRADED ON TOTAL POINTS NEVER RAISES IT (WO-3.36, traced rather than assumed): classGrade()
     sends that class to points() in src/grade-engine.js, whose only refusal is 'no-graded-work', so
     `unbalanced` is false whatever its weights total — points-grade.mjs plants one at 75 and reads the
     banner down. No mode test is added here: the engine's answer already is one. */
  const probe = classGrade(doc, cls, termId, students.length ? students[0].id : '');
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

  const average = classAverage(students,
    (s) => classGrade(doc, cls, termId, s.id).percentage);
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

  /* THE PICKED CATEGORY'S CLASS AVERAGE (WO-3.28, Open 5), beside the class average and only while a
     pill other than *All* is on. It is the ONLY figure on this line the pill touches: the class
     average before it and the blank count and weights after it stay whole-class whatever is picked,
     because `students` and `list` here are always the whole class and the whole term — the filter
     narrows what is drawn and moves no number. Labelled with the category's name every time, so it
     cannot be read as the class average changing. */
  const picked = categoryId ? cats.filter((c) => c.id === categoryId)[0] : null;
  if (picked) {
    const catAverage = classAverage(students,
      (s) => categoryPercentage(doc, cls, termId, picked.id, s.id));
    const name = picked.name || 'Untitled category';
    const catAvg = el('span');
    /* Read by nothing in the app — here so a check can find this figure by what it is rather than
       by its position on the line, the job `data-score-col` does on a column head. */
    catAvg.setAttribute('data-scores-cat-average', picked.id);
    catAvg.append(document.createTextNode(name + ' average '));
    catAvg.append(el('b', '', catAverage === null ? '—' : formatPercent(catAverage)));
    catAvg.setAttribute('aria-label', name + ' average '
      + (catAverage === null ? '— no graded work in it yet' : formatPercent(catAverage)));
    summary.append(el('span', 'sep', '·'));
    summary.append(catAvg);
  }

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
  /* THE LAST FIGURE SAYS WHAT THE GRADE IS MADE OF (WO-3.36). In a weighted class that is the weights
     total, the number the banner above refuses on. A class graded on total points has no weights in
     its grade, so "Weights total 75%" there would be a number about nothing — and a number a teacher
     would go and fix. It says how the class is graded instead, in WO-3.34's words, and draws no figure:
     a share computed here would be a second copy of pointsShare(). */
  if (gradingModeOf(cls) === 'points') {
    summary.append(el('span', '', 'graded on total points'));
    return;
  }
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
  /* THE CATEGORY PILLS (WO-3.28): one per category with at least one assignment in the open term,
     because a pill that empties the grid is a dead control. A picked id that is no longer among them
     goes back to *All* here, before anything is drawn from it. */
  const withWork = cls ? categoriesOf(cls).filter((c) => list.some((a) => a.categoryId === c.id)) : [];
  if (categoryId && !withWork.some((c) => c.id === categoryId)) categoryId = '';
  const picked = categoryId ? withWork.filter((c) => c.id === categoryId)[0] : null;

  if (hintTerm) hintTerm.textContent = termLabel || 'this class';
  /* THE HELP SPEAKS THE OPEN CLASS'S MODE (WO-3.39): the third help paragraph carries one block per
     grading mode in index.html, and the block that is not this class's is hidden. It is set here,
     above every early return, so it follows a class switch even onto a class with nothing to grade.
     It reads the mode and nothing else — no figure, no weight total — and gradingModeOf(null) is
     'weighted', which is what a screen with no class open shows. */
  const hintMode = gradingModeOf(cls);
  document.querySelectorAll('#scoresView [data-scores-hint-mode]').forEach((block) => {
    block.classList.toggle('hidden', block.getAttribute('data-scores-hint-mode') !== hintMode);
  });
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
        + (picked ? ' Showing ' + (picked.name || 'Untitled category') + ' only, with its average '
          + 'beside the grade.' : '')
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
  /* The search box goes with them for the same reason — a box that narrows no rows is a dead
     control — but it is only ever HIDDEN, never rebuilt: see paintFound(). */
  const toolbar = document.getElementById(TOOLBAR_ID);
  if (toolbar) toolbar.classList.toggle('hidden', !!emptyText);
  paintCategories(emptyText ? [] : withWork);
  /* THE BOX'S LEFT SCROLL PADDING WIDENS WITH THE THIRD FROZEN COLUMN — src/scores.css
     `.scores-grid-wrap.filtered`, the WO-3.27 focus fix carried one column further. */
  if (wrap) wrap.classList.toggle('filtered', !emptyText && !!picked);
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
    paintFound(0, 0);
    paintNotePanel();
    return;
  }

  /* THE ROWS THE SEARCH LEAVES (WO-3.29), and they are the only rows built. A row that does not
     match is NOT RENDERED rather than hidden with CSS: moveWithinColumn() and moveAcrossRow() walk
     the drawn inputs in document order, and a `display: none` row is still in that order — Enter
     would put the caret in a student the teacher cannot see. Built rows only, so Enter and the
     arrows stop at the last and first SHOWN student with the edge sentence they already speak.

     `students` stays the whole class and is what paintGrades() is handed below, so the class
     average and the blank count in the summary are the class's figures whatever the box says — a
     search narrows what is on screen and changes no number. The headline above counts the whole
     class for the same reason; the count beside the box is where the narrowing is said. */
  const shown = students.filter((s) => nameMatches(s, searchText));
  paintFound(shown.length, students.length);
  if (!shown.length) {
    /* No head over nothing: the grid and the flag bar go, and the empty line says what emptied the
       screen and the way back, in the registry's own words for the same moment. */
    if (wrap) wrap.classList.add('hidden');
    if (flags) flags.classList.add('hidden');
    if (empty) {
      empty.textContent = 'No student in ' + cls.name + ' matches that. Clear the search box, or '
        + 'press Escape in it, to see the whole class again.';
      empty.classList.remove('hidden');
    }
    paintGrades(cls, termId, students);
    paintNotePanel();
    return;
  }

  const headRow = document.createElement('tr');
  /* The two frozen heads carry their words in a span rather than as bare text since WO-3.28's
     correction round: src/scores.css enforces the frozen widths on each frozen cell's CHILDREN (see
     THE WIDTHS ARE ENFORCED there), and a bare text node is not a child any rule can reach. */
  const nameHead = el('th', 'scores-name');
  nameHead.append(el('span', '', 'Student'));
  nameHead.scope = 'col';
  headRow.append(nameHead);
  const gradeHead = el('th', 'scores-grade');
  gradeHead.append(el('span', '', 'Grade'));
  gradeHead.scope = 'col';
  headRow.append(gradeHead);
  /* THE CATEGORY AVERAGE'S HEAD (WO-3.28), naming its category every time it is drawn, so the column
     beside the grade cannot be read as a second overall grade. It carries no `data-score-col`: it is
     not an assignment, and every reader of that attribute means one. */
  if (picked) {
    const catHead = el('th', 'scores-cat-avg');
    catHead.scope = 'col';
    const catName = el('span', 'scores-cat-avg-name', picked.name || 'Untitled category');
    /* A long name trails off in this 84px head (src/scores.css) rather than widening the column; the
       whole name is on the pressed pill above and here as a tooltip. */
    catName.title = picked.name || 'Untitled category';
    catHead.append(catName);
    catHead.append(el('span', 'scores-cat-avg-sub', 'average'));
    headRow.append(catHead);
  }
  /* One column per assignment, in the order the document holds them — the same order the assignment
     list draws, which is the order the teacher put them in with its ↑ ↓. Nothing here sorts.

     WITH A CATEGORY PICKED (WO-3.28), ONLY ITS ASSIGNMENTS ARE BUILT — the same rule as the search's
     rows above, one axis over. A column outside the category is NOT RENDERED rather than hidden with
     CSS, because moveAcrossRow() walks the drawn inputs in document order and Tab walks them
     natively: a `display: none` column is still in both, and → or Tab would put the caret in a cell
     nobody can see. Work filed under no category belongs to no pill and shows under *All* only. */
  const columns = picked ? list.filter((a) => a.categoryId === picked.id) : list;
  columns.forEach((assignment) => headRow.append(columnHead(assignment, cls)));
  head.append(headRow);

  shown.forEach((student) => {
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
    /* Filled by paintGrades() as well, beside the grade, for the same one-writer reason. */
    if (picked) row.append(el('td', 'scores-cat-avg'));
    columns.forEach((assignment) => {
      row.append(scoreCell(assignment, student, cellOf(doc, assignment.id, student.id)));
    });
    body.append(row);
  });

  paintGrades(cls, termId, students);
  /* AFTER the rows, because whether the open note panel's cell is still on the grid is a question
     about the cells just drawn (WO-3.32). */
  paintNotePanel();
}

/*
  THE SEARCH BOX (WO-3.29) — "find one student's row in a class of thirty without scrolling for it".

  THE BOX IS MARKUP IN index.html AND NOTHING HERE CREATES OR REPLACES IT. renderScores() rebuilds
  every cell on the grid, and it runs on every keystroke typed into this box; if the box were inside
  what it rebuilds, the element the keystroke came from would be destroyed under the caret and the
  teacher would lose focus after the first letter. src/attendance.js's setSearch() keeps its box in
  index.html for exactly that reason, and this is the same arrangement: the box is only ever read,
  emptied or hidden from here.

  The count beside it — "3 of 14 students" — is drawn only while the box holds something, because a
  grid of three rows reads as a class of three, and is said as a sentence of two text nodes and a
  <b> rather than through innerHTML: a count is not a name, but this file builds no markup from
  strings anywhere and is not about to start.
*/
function paintFound(count, total) {
  const found = document.getElementById(FOUND_ID);
  if (!found) return;
  found.textContent = '';
  found.classList.toggle('hidden', !searchText);
  if (!searchText) return;
  found.append(el('b', '', String(count)));
  found.append(document.createTextNode(' of ' + plural(total, 'student', 'students')));
}

/* Called from src/shell.js's `input` listener, which is the event a paste, dictation and the
   software keyboard's suggestions all fire — the registry's box is wired the same way. */
export function setScoreSearch(value) {
  searchText = searchNeedle(value);
  renderScores();
}

/*
  ESCAPE IN THE BOX EMPTIES IT, and answers whether it did anything so src/shell.js knows whether
  the key was used. This is the ONE Escape this screen binds, and it is bound to the search box and
  nowhere else: the grid still does nothing on Escape (WO-3.5's seventh acceptance line, and this
  file's header), because a stray Escape two thirds of the way down a column must not cost the
  teacher anything. Clearing a search costs her nothing — every row comes back and the caret stays
  in the box she was typing in.
*/
export function clearScoreSearch() {
  const box = document.getElementById(SEARCH_ID);
  const had = !!searchText || !!(box && box.value);
  if (!had) return false;
  if (box) box.value = '';
  searchText = '';
  renderScores();
  return true;
}

/* EVERY ARRIVAL STARTS UNSEARCHED, and this is the arrival half. It does not render: src/shell.js
   calls it from showClassScreen() BEFORE the view swaps and paints, the order that function already
   keeps for the calendar's and the concern list's own resets, so the first paint is already of the
   whole class. */
export function resetScoreSearch() {
  searchText = '';
  const box = document.getElementById(SEARCH_ID);
  if (box) box.value = '';
}

/*
  THE CATEGORY PILLS (WO-3.28) — *All*, then one per category with work in the open term, in the
  class's own category order. Names only (Open 6): every column head's chip already shows the
  weight, and *Quizzes 20%* on a filter button reads like a setting.

  `.pill` WORN AS SHIPPED, and rebuilt from the document on every render, the way
  src/signals-view.js draws its rule chips — so a category renamed, emptied or deleted behind this
  screen cannot leave a pill pointing at it. Not inside a `data-pill-group`, for the reason that file
  gives: src/shell.js's generic handler would be a second thing moving `.active`.

  NO PILLS AT ALL when no category has work — *All* on its own would be a control that does
  nothing, and that is the case where every assignment in the term is filed under no category.
*/
function paintCategories(withWork) {
  const host = document.getElementById(CATS_ID);
  if (!host) return;
  host.textContent = '';
  host.classList.toggle('hidden', !withWork.length);
  if (!withWork.length) return;
  const add = (id, label, title) => {
    const on = categoryId === id;
    const button = el('button', 'pill' + (on ? ' active' : ''), label);
    button.type = 'button';
    button.setAttribute('data-scores-category', id);
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    button.title = title;
    host.append(button);
  };
  add('', 'All', 'Show every assignment');
  withWork.forEach((c) => {
    const name = c.name || 'Untitled category';
    add(c.id, name, 'Show only ' + name + ', with its average beside the grade');
  });
}

/* Called from src/shell.js's click listener. The pills are rebuilt by the render, so a pill that had
   focus is replaced under it; focus goes to the pill now standing for the same choice, so a keyboard
   user who pressed one is not dropped onto <body>. */
export function setScoreCategory(id) {
  const host = document.getElementById(CATS_ID);
  const hadFocus = !!(host && host.contains(document.activeElement));
  categoryId = String(id || '');
  renderScores();
  if (hadFocus && host) {
    const same = Array.prototype.filter.call(host.querySelectorAll('[data-scores-category]'),
      (b) => b.getAttribute('data-scores-category') === categoryId)[0];
    if (same) same.focus();
  }
  const cls = getSelectedClass();
  const cat = categoryId && cls ? categoriesOf(cls).filter((c) => c.id === categoryId)[0] : null;
  announce(cat ? (cat.name || 'Untitled category') + ' only, with its average beside the grade.'
    : 'Every assignment.');
}

/* EVERY ARRIVAL SHOWS *ALL*, and this is the arrival half — the same shape and the same call site as
   resetScoreSearch() above, before the view swaps and paints. */
export function resetScoreCategory() {
  categoryId = '';
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

/*
  ONE ASSIGNMENT'S COLUMN, BROUGHT INTO VIEW WITH THE CARET IN ITS FIRST CELL (WO-6.8) — the landing
  for a row under the glance page's *Waiting to be graded*, called by src/shell.js after it has made
  the class open and painted this screen. The column is found by `data-score-col`, which
  columnHead() already writes for exactly this kind of question, so nothing new is written on the
  grid to be found by.

  THE FIRST CELL, AND NOT "THE FIRST BLANK ONE". Which cells are waiting is src/grade-engine.js's
  answer, and this screen does not re-ask it on the way past (decision in the header: nothing here
  computes a grade, and nothing here decides what "open" means); Enter moves down a column, which is
  the whole screen's promise, so the top of the column is the honest place for a hand to start.
  `preventScroll` on the focus, because the scroll above has already put the column where it should
  be and a second, browser-chosen scroll would undo the centring.

  Answers false when the column is not on this grid — an assignment deleted, or filed under a term
  the class is not open on, or (since WO-3.28) outside a category pill that is on — and the caller
  then says nothing more than the screen's own arrival. The glance page's door comes through
  showClassScreen(), which resets the pill to *All* first, so from there the column is always drawn.

  THE BOX GOES BACK TO ITS TOP FIRST (WO-3.27), and that is the one line this work order added to
  this file, against its own expectation that none would be needed. Since the grid scrolls in a box
  of its own, the head is sticky inside it, so scrolling the HEAD into view says nothing about the
  rows: a box the teacher left scrolled down keeps its scroll while she goes to the home page and
  back (measured — the offset survives the view being hidden), and the caret then lands in a first
  cell scrolled away above the stuck head. Before the box, the page was the only scroller and the
  head's scroll brought the first row with it. Sideways is still `inline: 'center'` below, which the
  box's `scroll-padding` already keeps clear of the frozen pair.
*/
export function revealScoreColumn(assignmentId) {
  const id = String(assignmentId || '');
  if (!id) return false;
  const heads = document.querySelectorAll('#' + GRID_WRAP_ID + ' [data-score-col]');
  const head = Array.prototype.filter.call(heads, (th) => th.getAttribute('data-score-col') === id)[0];
  if (!head) return false;
  const wrap = document.getElementById(GRID_WRAP_ID);
  if (wrap) wrap.scrollTop = 0;
  head.scrollIntoView({ block: 'nearest', inline: 'center' });
  const cells = document.querySelectorAll('#' + GRID_WRAP_ID + ' [data-score-cell]');
  const first = Array.prototype.filter.call(cells, (input) => input.getAttribute('data-score-cell') === id)[0];
  if (first && typeof first.focus === 'function') first.focus({ preventScroll: true });
  return true;
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
  input.setAttribute('aria-label', cellLabel(at.assignment, at.student, cell));

  const wrap = input.parentElement;
  if (!wrap) return;
  const old = wrap.querySelector('.scores-flag');
  if (old) old.remove();
  if (flag) {
    const glyph = el('span', 'scores-flag ' + flag, flag === 'late' ? 'L' : flag === 'missing' ? 'M' : 'X');
    glyph.setAttribute('aria-hidden', 'true');
    wrap.append(glyph);
  }
  /* The note survives every write that reaches here (writeCell() carries it), so this repaints it
     rather than changes it — kept beside the flag so the two corners are always drawn together. */
  paintNoteMark(input, wrap, cell);
}

/*
  THE GRAMMAR OF A SCORE, WRITTEN DOWN ONCE (WO-3.25) — one decimal number: an optional leading `-`,
  digits, at most one `.`, and AT MOST TWO DIGITS AFTER IT. Two is the owner's call of 2026-08-17 and
  it has a reason: the SIS carries two decimals, this number is re-keyed into it by hand, and
  formatPercent() above is already how every percentage in this app is printed.

  WHAT IT REFUSES IS A NOTATION AND NEVER A VALUE. `1e3`, `0x1f`, `0b101`, `0o17` and `+7` are
  JavaScript's number grammar rather than a gradebook's, and they were not hypothetical: measured
  with bare Node on 2026-08-17, each of them went into a cell through this field and came back out of
  the store as 1000, 31, 5, 15 and 7. A NEGATIVE STAYS LEGAL — `-5` is a penalty the teacher typed
  and meant, which is docs/data-model.md § Extra credit's reasoning about the points she awards above
  the maximum, pointed the other way.

  IT IS DELIBERATELY SATISFIED BY A HALF-TYPED NUMBER. `-`, `.`, `12.` and `-.` all match, because
  that is what a field looks like part-way through a number and a grammar that refused them would
  refuse the keystroke that starts one. THE DISTINCTION THE WHOLE OF WO-3.25 TURNS ON: an incomplete
  legal PREFIX is not an illegal VALUE, and the two get different answers below. The prefix is
  typable, writes nothing, and is left alone under the caret; the illegal value never reaches the
  field at all.

  THE SECOND PATTERN IS THE SAME SHAPE WITH THE TWO-DECIMAL CAP LIFTED, and it is not a second
  grammar — it is what may still be STORED, for data this app has already written. A score of
  12.3456789 entered before WO-3.25 stays 12.3456789: nothing migrates it and nothing rounds it,
  because retro-rounding a number a teacher already typed is exactly the silent-wrong-number failure
  this work order exists to close, wearing a fix's clothes. It renders as typed and it can be edited
  DOWN — every deletion lands in the store, which is what keeps the field and the store agreeing
  while she shortens it — but never extended, because the guard refuses any insertion that would
  leave the field out of grammar. THE NEXT READER WILL WANT TO ADD A MIGRATION HERE, and this
  paragraph is the refusal.
*/
const SCORE_GRAMMAR = /^-?\d*(?:\.\d{0,2})?$/;
const SCORE_STORABLE = /^-?\d*(?:\.\d*)?$/;

/*
  WHETHER AN EDIT ABOUT TO LAND IN A SCORE CELL MAY LAND (WO-3.25). Called from src/shell.js's
  `beforeinput` listener, which cancels the event when this answers false — the same contract
  handleScoreKey() has below: this module decides what an edit means, and that file is the only
  place in the app that touches an event.

  IT TESTS THE PROSPECTIVE FIELD CONTENTS, NEVER THE INSERTED TEXT ALONE. The text is spliced into
  the value across the current selection and the RESULT is tested, which is what makes a paste, a
  drag-and-drop and an autofill fall out of the same three lines: each arrives as one insertion of
  several characters, and "would the field still be a score afterwards" is the same question for all
  of them. Written against the inserted text alone, none of them would be covered — and a `.` typed
  into `12.` would pass.

  DELETIONS ALWAYS PASS. They can only shorten the field, and a value that cannot be got back out of
  a cell is a cell that cannot be corrected — including the pre-WO-3.25 12.3456789 above, which is
  edited down one deletion at a time and would be frozen on screen by any test applied here.

  IT READS THE FIELD AND NOTHING ELSE. The grid draws 25 rows by however many assignments, and this
  runs per keystroke on the second-most-frequent action in the app, so it is a string test that never
  opens the document.

  NOT EVERY beforeinput IS CANCELABLE AND THIS IS NOT THE ONLY DEFENCE. An IME composition reports
  `cancelable: false` — measured in headless Edge on 2026-08-17 through Input.imeSetComposition,
  where the preventDefault this answer produces is simply ignored and the text lands anyway. What
  that path leaves in the field is caught by editScore()'s backstop instead.
*/
export function allowScoreInput(input, data, inputType) {
  /* Every deletion inputType begins with the word: deleteContentBackward, deleteWordForward,
     deleteByCut, deleteContentForward and the rest of the family. */
  if (String(inputType || '').indexOf('delete') === 0) return true;
  const raw = String(input.value);
  /* A `type="text"` field answers both of these with numbers — the same read caretCanLeave() makes
     below, and the same reason it is safe here. A reading that is not a number is treated as a caret
     at the end, which tests the strictest prospective value the field could have. */
  const from = typeof input.selectionStart === 'number' ? input.selectionStart : raw.length;
  const to = typeof input.selectionEnd === 'number' ? input.selectionEnd : raw.length;
  return SCORE_GRAMMAR.test(raw.slice(0, from) + String(data == null ? '' : data) + raw.slice(to));
}

/*
  A SCORE BEING TYPED. Called from src/shell.js's `input` listener, so it fires per keystroke and the
  store's debounce is what turns a column of them into a handful of saves (src/store.js).

  THREE THINGS IT DOES NOT DO. It does not re-render the field (decision 3). It does not clamp or
  round a VALUE — a score above the points possible is extra credit on that assignment and a teacher
  is allowed to award it (docs/data-model.md § Extra credit), a negative is a penalty she typed and
  meant, and a value that silently is not what she typed is the worst thing a gradebook can do. And
  it does not touch the flag, with one exception below.

  WHAT IT DOES REFUSE, SINCE WO-3.25, IS A NOTATION — AND A NOTATION IS NOT A VALUE. The paragraph
  above read "it does not clamp, round or refuse a number" until 2026-08-17, and the third verb
  stopped being true the day `1e3` stopped storing 1000. Nothing here moves a number the teacher
  meant: 87.25 stores 87.25, -5 stores -5, and 300 out of 100 stores 300. What is refused is a
  string Number() can read and a gradebook cannot — `1e3`, `0x1f`, `0b101`, `0o17`, `+7`, and a
  third digit after the decimal point — and it is refused at src/shell.js's `beforeinput` guard,
  before the character reaches the field at all. This sentence is here because a reader who finds a
  refusal under a comment promising none will resolve the contradiction in one of two directions,
  and one of them undoes the work order.

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
    const stored = valueOf(before);
    /* THE ONE VALUE OUT OF GRAMMAR THAT IS STILL WRITTEN, and the reason the test below is not
       simply SCORE_GRAMMAR: this cell ALREADY holds a number the grammar refuses and what is in the
       field is still a plain decimal. That is the pre-WO-3.25 12.3456789 being edited down a
       deletion at a time — the guard lets every deletion through, so refusing the write here would
       snap the field back on each one and freeze a number nobody could correct. */
    const shorteningOldPrecision = stored !== null && SCORE_STORABLE.test(raw)
      && !SCORE_GRAMMAR.test(String(stored));

    if (!SCORE_GRAMMAR.test(raw) && !shorteningOldPrecision) {
      /*
        THE BACKSTOP (WO-3.25), which replaced a bare `return` that was the defect rather than the
        guard against it. Type `8a` on the build before this one: Number() refused it, this function
        returned without writing, the field went on showing `8a`, the store kept the previous number
        — and NOTHING RECONCILED THEM. There is no `blur` and no `change` handler on a score cell
        anywhere in this app (src/shell.js wires `beforeinput`, `input`, `keydown` and `focusin` and
        nothing else), so the screen and the store disagreed until something else forced a re-render.
        A score that silently is not what you typed is the worst thing a gradebook can do, and the
        refusal path was producing one.

        Anything that reaches here now has come through a path the `beforeinput` guard could not
        cancel — an IME composition on a soft keyboard reports `cancelable: false` — so the answer is
        to put the field back to what the document holds. THE FIELD IS WRITTEN AND THE STORE IS NOT:
        no grade moves, and decision 3's rule about never replacing the input under the caret is not
        in play here, because what is under the caret is not a number the teacher can have meant.
      */
      input.value = stored === null ? '' : String(stored);
      return;
    }

    const n = Number(raw);
    /* A field mid-way through a number reports things Number() cannot read — `-`, `.`, `12.`, `-.`
       — and the answer to those is to write nothing at all rather than to store 0 or NaN, and to
       leave the field exactly as it stands under the caret: an incomplete legal prefix is not an
       illegal value. src/classes.js and src/categories.js both refuse the same way, one field
       over. */
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
  /* ENTERING A DIFFERENT CELL SHUTS THE NOTE PANEL (WO-3.32). The panel names the cell it is about,
     but a teacher who has moved on is looking at another one, and a note typed next would land on
     the cell she left. The field is already saved — every keystroke in it writes — so shutting it
     loses nothing. Entering the SAME cell (Done hands focus back to it) leaves it as it is. */
  if (noteAssignmentId && (noteAssignmentId !== focusedAssignmentId
      || noteStudentId !== focusedStudentId)) {
    shutNotePanel();
  }
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
    /* A cell holding only a note is already blank (WO-3.32): it has no score and no flag to clear,
       and Clear is about the score. The note is taken off in its own panel and nowhere else — a
       stray ⌫ two thirds of the way down a column must not cost a teacher a sentence she typed,
       in an app with no undo. */
    if (!before || (value === null && !had)) {
      announce(what + ' for ' + who + ' is already blank.');
      return;
    }
    writeCell(at.assignment.id, at.student.id, null);
    said = what + ' for ' + who + ' is cleared to blank. Blank is ungraded and changes no grade.'
      + (visibleNoteOf(before) ? ' Its note is kept.' : '');
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

/* ────────────────────────────── a note on a cell (WO-3.32) ────────────────────────────── */

/*
  THE NOTE PANEL — a strip of static markup under the flag bar (index.html, #scoresNote), about ONE
  cell: the one the teacher was in when she tapped *Note*. Static rather than built by renderScores()
  for the search box's reason: a field inside what a render rebuilds is destroyed under the caret.

  IT IS OPENED BY ITS BUTTON AND BY NOTHING ELSE. No key on the grid opens it — WO-3.32's Traps, and
  acceptance line 7: Tab, the arrows, Enter, ⌫ and L / M / X all do exactly what they did. The button
  sits in the flag bar because it acts on the cell you are in, the way the four flags do, and is
  reached the same way under a thumb; it carries no letter, because no letter opens it.

  EVERY KEYSTROKE IN THE FIELD WRITES, the way a mark note does in the attendance history dialog and
  the pass card's note does on the registry — there is no Save, so there is nothing to forget to
  press, and shutting the panel by any route loses nothing. *Done* shuts it and hands focus back to
  the cell; *Remove note* empties it and takes the key off.

  UNDER PRESENTATION MODE IT DOES NOT OPEN, and an open one is shut and EMPTIED by the next render
  (src/shell.js's flipPresentationMode() makes that render happen at the flip): a field holding a
  student's note is still a note in the DOM, whatever its display.
*/
function notePanelParts() {
  return {
    panel: document.getElementById(NOTE_ID),
    label: document.getElementById(NOTE_LABEL_ID),
    field: document.getElementById(NOTE_TEXT_ID),
  };
}

function shutNotePanel() {
  noteAssignmentId = '';
  noteStudentId = '';
  const parts = notePanelParts();
  if (parts.field) parts.field.value = '';
  if (parts.label) parts.label.textContent = '';
  if (parts.panel) parts.panel.classList.add('hidden');
}

/* The cell the open panel is about, resolved against the class and term on screen the way every
   other write here is (resolveCell()'s guard). Null when the panel is shut or its cell has gone —
   a term switched, the assignment deleted, the student taken off the roster. */
function noteTarget() {
  if (!noteAssignmentId || !noteStudentId) return null;
  const input = inputFor(noteAssignmentId, noteStudentId);
  const at = input ? resolveCell(input) : null;
  return at ? { input: input, at: at } : null;
}

/* What renderScores() does about the panel and its button on every paint: the button is not drawn
   while notes may not be on screen, and the panel is shut if the mode came on or its cell is no
   longer on the grid. An open panel whose cell is still drawn is LEFT ALONE — the field may be under
   the teacher's thumb, and its value is already the document's. */
function paintNotePanel() {
  const btn = document.querySelector(NOTE_BTN_SEL);
  const visible = scoreNotesVisible();
  if (btn) btn.classList.toggle('hidden', !visible);
  if (!noteAssignmentId) return;
  if (!visible || !noteTarget()) shutNotePanel();
}

/* The *Note* button. Opens the panel on the cell the teacher is in, with the note it carries, and
   puts the caret at the end of it — a note is added to more often than it is retyped. */
export function openScoreNote() {
  if (!scoreNotesVisible()) {
    announce('Notes are hidden while presentation mode is on.');
    return;
  }
  const input = focusedAssignmentId && focusedStudentId
    ? inputFor(focusedAssignmentId, focusedStudentId) : null;
  const at = input ? resolveCell(input) : null;
  if (!at) {
    announce('Tap a score first — the note goes on the cell you are in.');
    return;
  }
  const parts = notePanelParts();
  if (!parts.panel || !parts.field) return;
  noteAssignmentId = at.assignment.id;
  noteStudentId = at.student.id;
  if (parts.label) {
    parts.label.textContent = 'Note on ' + (at.assignment.name || 'Untitled assignment') + ' for '
      + fullName(at.student);
  }
  parts.field.value = visibleNoteOf(cellOf(getDoc(), at.assignment.id, at.student.id));
  parts.panel.classList.remove('hidden');
  parts.field.focus();
  const end = parts.field.value.length;
  if (typeof parts.field.setSelectionRange === 'function') parts.field.setSelectionRange(end, end);
}

/* A keystroke in the note field, from src/shell.js's `input` listener. Writes the note and repaints
   the one cell's mark, title and accessible name — never the field, which is under the caret. No
   grade is repainted, because no grade can have moved: the engine does not read the key. */
export function editScoreNote(field) {
  const target = noteTarget();
  if (!target || !scoreNotesVisible()) return;
  writeNote(target.at.assignment.id, target.at.student.id, field.value);
  paintCell(target.input, target.at,
    cellOf(getDoc(), target.at.assignment.id, target.at.student.id));
}

/* *Done*: shut the panel and put the caret back in the cell it was about, value selected, so the
   next number typed lands where she was — the flag bar's own hand-back. */
export function closeScoreNote() {
  const target = noteTarget();
  shutNotePanel();
  if (target) {
    target.input.focus();
    target.input.select();
  }
}

/* *Remove note*: the key comes off (writeNote() with nothing), the mark goes, and the panel shuts
   with focus back on the cell. Said out loud because there is no undo in this app. */
export function removeScoreNote() {
  const target = noteTarget();
  if (!target) { shutNotePanel(); return; }
  const had = !!noteOf(cellOf(getDoc(), target.at.assignment.id, target.at.student.id));
  writeNote(target.at.assignment.id, target.at.student.id, '');
  paintCell(target.input, target.at,
    cellOf(getDoc(), target.at.assignment.id, target.at.student.id));
  closeScoreNote();
  announce(had ? 'Note removed. The score is unchanged.' : 'There was no note to remove.');
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

  MODIFIERS ARE READ SINCE WO-3.23, and until then they were not: src/shell.js passed a key name
  and nothing else, so `Shift`+`←` over a full selection moved a cell where a plain text field
  shrinks the selection. It now passes a record of the four flags alongside the name, and a HELD
  MODIFIER TAKES THE ARROW AWAY FROM THIS MODULE ALTOGETHER — see handleScoreKey() below, where the
  rule is one clause rather than four. This function is not the place it is applied: the caret rule
  is about where the caret IS, and whether the key belongs here at all is a question asked before
  that one.
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

  THE THIRD ARGUMENT IS THE FOUR MODIFIER FLAGS (WO-3.23), a plain record rather than the event they
  were read off — src/shell.js says why it is not the event. `mods` may be absent, and an absent
  record reads as no modifier held, which is what every call written before that work order meant.

  A HELD MODIFIER TAKES THE FOUR ARROWS AWAY FROM THIS SCREEN, and only the arrows:

    · `Shift`+`←` and `Shift`+`→` extend or shrink a selection inside the number, and at the two
      caret edges the browser's own answer is to do nothing at all — which is still not "step to the
      next assignment". `Ctrl`/`Cmd`+arrow is word motion. `Alt`+`←` is BACK.
    · `Shift`+`↑` and `↓` select to the start and end of the value in a one-line field, which is a
      real gesture this screen was spending on changing student at EVERY caret position, since the
      vertical pair has no caretCanLeave() gate.
    · `L`, `M` and `X` DO NOT get the same treatment, and must not: `e.key` is `'L'` exactly when
      Shift is held, so refusing a modified letter would refuse the capital every teacher types.
    · `Enter` and `⌫` keep theirs. Nothing native happens on `Shift`+`Enter` in a one-line input,
      and `⌫` only acts on an EMPTY cell, where there is nothing for any modifier to have meant.

  WHAT THAT LEAVES EXPOSED, named rather than coded around: `Ctrl`+`X` on a score cell would apply
  Excused and swallow the browser's Cut. It cannot happen today — src/shell.js's listener returns on
  Ctrl, Alt and Meta before the score branch is reached, which was measured rather than read — so
  the branch that would refuse it is one no keystroke can drive red, and an unreachable guard with
  no check behind it is worth less than this sentence. The day that guard moves, this is the line to
  come back to.
*/
export function handleScoreKey(key, input, mods) {
  const held = !!(mods && (mods.shift || mods.ctrl || mods.alt || mods.meta));

  if (key === 'Enter') return moveWithinColumn(input, 1);
  if (key === 'ArrowDown') return !held && moveWithinColumn(input, 1);
  if (key === 'ArrowUp') return !held && moveWithinColumn(input, -1);

  /* WO-3.16, and the `&&` is the contract rather than a shorthand: caretCanLeave() answering false
     answers false from here, so src/shell.js does not preventDefault and the caret gets the key.
     WO-3.23's `!held` is the same contract one clause earlier — a modified arrow never gets as far
     as asking where the caret is, because the answer would not change whose key it is. */
  if (key === 'ArrowRight') return !held && caretCanLeave(input, 1) && moveAcrossRow(input, 1);
  if (key === 'ArrowLeft') return !held && caretCanLeave(input, -1) && moveAcrossRow(input, -1);

  if (key === 'Backspace' || key === 'Delete') {
    /* Native editing while there is text to edit — a teacher correcting 187 to 18 expects a
       backspace to take one character, and hijacking that would make the whole column unfixable.
       Once the field is empty the same key means the cell, which is how "⌫ clear to blank" reaches
       a flag with no score in it: the second press takes the flag off and the key with it. */
    if (String(input.value).length) return false;
    const at = resolveCell(input);
    if (!at) return false;
    /* "Nothing to clear" is no value and no flag, not merely no key (WO-3.32): a cell carrying only a
       note answers false here exactly as an absent cell did before notes existed, so the key goes
       back to the browser and nothing on the grid behaves differently for the note being there. */
    const here = cellOf(getDoc(), at.assignment.id, at.student.id);
    if (!here || (valueOf(here) === null && !flagOf(here))) return false;
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
