/*
  The past-due prompt — the one place in Planbook that reads a due date and offers to act on it,
  and the whole of what "offers" is allowed to mean (WO-3.6).

  ── IT IS A SUGGESTION, AND IT IS NEVER ARITHMETIC ──

  An earlier draft of this app computed `missing` from the due date: blank plus past-due equalled
  zero. That draft is why the rule exists, and the rule is stated in four places before this file —
  CLAUDE.md, docs/data-model.md § "Missing is marked, never inferred", src/assignments.js decision 1
  and src/scores.js decision 1. The grade never changes because a date rolled over, and a teacher
  who has not finished grading is not accidentally failing half a class overnight.

  So the shape below is the rule written as code. Nothing here writes anything until a teacher taps
  a button that says in words what it is about to do; the banner changes no stored value while it is
  up; dismissing it changes nothing at all; and the clock is read for exactly one purpose — deciding
  which blanks are worth ASKING about. The sentence this work order was written from is
  docs/data-model.md's own: *"A suggestion the teacher accepts, not arithmetic that happens to
  them."*

  ── SIX THINGS THAT WILL LOOK LIKE OMISSIONS AND ARE DECISIONS ──

  1. WHAT COUNTS AS A PAST-DUE BLANK, and it is NARROWER than "the cell is empty". The set is: an
     assignment in the open class and term, with a `due` date that is a real date and is strictly
     BEFORE today, and a student on that class's roster whose cell carries NOTHING — no key at all,
     or (from a restore or a hand edit) a cell holding neither a value nor a flag.

     THREE KINDS OF EMPTY-LOOKING CELL ARE DELIBERATELY OUT OF IT, and each one is a teacher
     decision this prompt must not overwrite. `excused` holds no number and LEAVES THE DENOMINATOR
     (docs/data-model.md); sweeping it into `missing` would turn a decision into a zero, which is
     the single most expensive mistake available to this file. `missing` is already the answer this
     prompt proposes. And a `late` with no score yet says the work arrived and has not been graded —
     marking it missing would record that it never arrived at all, and the flag is the record.

     THAT MAKES THIS SET DIFFERENT FROM THE SCORE GRID'S BLANK COUNT, which is src/scores.js's
     isUngraded() and which does count a `late` blank. The two numbers can legitimately differ on
     screen at once. They are answers to two different questions — "how much is left to enter" and
     "what could I mark missing right now" — and the second one is allowed to be the smaller.

  2. THE SET IS COMPUTED ONCE AND USED THREE TIMES. The number in the sentence, the rows in the
     review, and the cells written on accept all come from `previewed` — one walk of the document,
     held between the paint and the tap. Acceptance line 3 is "accepting writes to exactly the
     previewed cells", and three separate walks is how a build passes that line on a Tuesday and
     fails it on the day a teacher types a score while the banner is up.

     THE ONE THING ACCEPT RE-CHECKS is that each previewed cell is still untouched. Nothing on this
     screen is blocked while the banner is up (src/scores.js's rule, and WO-3.1's before it), so a
     teacher can type into a cell the prompt is holding — and writing `missing` over a score she has
     just entered would be the "a score that silently isn't what you typed" failure with the app's
     own hand on it. A cell that stopped being blank is dropped and said out loud.

  3. IT IS A BANNER IN THE VIEW AND NOT A DIALOG, and that is the decision this file was most likely
     to get wrong. plans/gradebook-surfaces.md's test — a surface you work in is a view, a task you
     finish and dismiss is a modal — does not obviously settle a prompt that appears unasked, so
     three things settle it here:

       A MODAL CLOSES ON `Esc`, AND THE SCORE GRID HAS NO `Esc` BINDING BY ACCEPTANCE LINE. WO-3.5
       shipped "there is no dialog anywhere in it" as a tested claim — tools/verify-shell.mjs presses
       the key twice, two thirds of the way down a column, with a freshly typed digit in the field.
       A dialog that opened on arriving at that view would put something on screen for that key to
       close, on the screen where the key must do nothing.

       A FOCUS TRAP ON ARRIVAL TAKES THE FIRST KEYSTROKE OF A GRADING SESSION. The teacher opened
       this screen to type a column of numbers; a prompt she did not ask for may not stand between
       her and the first cell.

       AND THE PROMPT IS NOT A TASK SHE CAME TO FINISH. It is the screen telling her something
       before she starts, which is exactly what `.grade-none` one row above it is — so it is the
       same component, deliberately: Roll Call!'s inline notice banner (design/portable-components.md
       § 6), as src/scores.css already lifted it. A second banner shape for the same slot on the same
       screen is the WO-2.11 mistake run the other way round.

     THE REVIEW IS THEREFORE INLINE TOO, not a dialog opened from a banner. It expands under the
     sentence and collapses on the next tap, the same disclosure src/scores.js's key legend is, and
     for the same reason it must not be a preference: what it says is true for five minutes.

  4. A DISMISSAL LIVES IN localStorage, PER ASSIGNMENT, AND NOT IN THE YEAR DOCUMENT. `pastDueDismissed`
     in src/prefs.js — an assignment id on one side and `true` on the other, and nothing from inside
     the document on either. It is the same category of fact as `openClassId` (an id, never a name)
     and `openTermIds` (ids on both sides): which nudge this browser has waved off, which is a fact
     about a browser's chrome rather than about a student.

     THE YEAR DOCUMENT WAS THE OTHER CANDIDATE and it is the wrong home. It syncs and it is restored
     from backup, so a field there is a schema change that docs/data-model.md would have to carry —
     for a banner. Worse, a restore would then resurrect or destroy dismissals along with the grades,
     which makes a UI nudge part of the record of a school year.

     THE COST, STATED RATHER THAN HIDDEN: dismiss on the laptop and the iPad still asks once. That is
     the right way round for a prompt whose whole job is to ask — accepting on either device writes
     the same cells, and the device that never asked is the device that would have quietly stopped
     nudging. Ids for assignments that no longer exist are left where they are, exactly as
     src/prefs.js's `openTermIds` leaves a stale class key: a preference file that prunes itself is a
     preference file that has to know what an assignment is.

  5. THE CLOCK IS THE APP'S ONE CLOCK, AND "PAST DUE" IS STRICTLY BEFORE TODAY. `todayISO()` from
     src/attendance.js, imported rather than re-derived for the reason src/assignments.js gives beside
     its own import: two answers to "what day is it" is how a screen and a record end up disagreeing
     about a date, and that function is built from the local calendar fields so that an evening in
     October is not tomorrow. An EMPTY due date is valid (src/assignments.js decision 1) and can never
     be past due; a date that IS today has not gone by, which is the same comparison the overdue tint
     on the assignment list makes one file over.

     ONE COMPARISON, TWO THINGS DRAWN (WO-3.19). The score grid's column head wears the drawing's
     amber for exactly the assignments in the set below, and it gets there by asking
     pastDueAsksAbout() at the foot of this file rather than by comparing a due date of its own.
     AGENTS.md forbids a second reader of the date in as many words, and two readers is also how a
     banner and a column head come to name different work on the same screen.

  6. NOTHING HERE COMPUTES A GRADE, AND NO SUPPORT DATA IS ON THIS SURFACE. The banner names a count
     of blanks and the points each one would count against — src/grade-engine.js owns every
     percentage in the app and none of them is needed to ask this question. And the review lists
     student names and nothing else: no plan, no accommodation, no indicator (CLAUDE.md
     § Accommodations, and src/scores.js decision 5 on the screen this mostly sits on).
*/

import { getDoc, update } from './store.js';
import { announce } from './live-region.js';
/* The resolution of "which class and which term is open" stays in src/classes.js — this file asks
   rather than keeping its own answer, the same import src/scores.js and src/assignments.js make. The
   import runs one way: nothing in src/classes.js knows this file exists. */
import { getSelectedClass, getSelectedTerm } from './classes.js';
/* How a student's name reads in a list. Imported from src/roster.js for the reason src/scores.js and
   src/attendance.js import the same function: a second copy of those eight lines could be right
   about a hyphen, a suffix or a half-typed name in a way this one is not. */
import { rosterName } from './roster.js';
/* Where a dismissal is written down — decision 4. src/prefs.js is the only door to localStorage in
   this app, and `pastDueDismissed` is declared in its PREF_DEFAULTS with the reasoning beside it. */
import { getPref, setPref } from './prefs.js';
/* What today is, and this is the ONE thing in this file that reads a clock — decision 5. */
import { todayISO } from './attendance.js';
/* How a due date reads in the banner's sentence and on a review row — `Sep 8`, with the raw value
   printed where the date cannot be read (`shortDate(w.due) || w.due`), so a half-typed due date
   stays findable rather than becoming a blank. This file's own copy of that formatter — the third
   byte-identical one in src/, written up at WO-3.6's close as the follow-up that became WO-3.20 —
   is gone; the copies are one function now. It reads no clock, which is why it is not decision 5's
   business: todayISO() above is still the only line here that asks what day it is. */
import { shortDate } from './date-text.js';

const DISMISS_PREF = 'pastDueDismissed';

/* Every screen that wears this prompt carries an empty host with this attribute, and this file
   paints all of them. Two today — the score grid and the assignment list — and a third costs one
   element in the markup rather than a line here, which is the same contract `[data-screen-nav]` has
   with src/screen-nav.js. */
const HOST_SEL = '[data-past-due]';

/* Whether the review list is open. A module variable rather than a preference, for the reason
   src/scores.js's keysOpen is one: a list of which cells are blank this minute is not a fact about
   this browser worth keeping, and src/prefs.js's list is the shorter for not carrying it. */
let reviewOpen = false;

/*
  THE SET ON SCREEN — what the sentence counted, what the review lists, and what accept writes.
  Decision 2. Held as ids and plain strings rather than as objects out of the document, for the
  reason src/classes.js gives about everything held across a render: the document can be replaced
  underneath this module by a restore or a year switch, and an object held across that is work in a
  document nobody has open.

  `[{ id, name, due, points, students: [{ id, name }] }]`
*/
let previewed = [];

/* ────────────────────────────── reading the document ────────────────────────────── */

function assignmentsIn(doc) {
  return doc && Array.isArray(doc.assignments) ? doc.assignments : [];
}

/* THE GUARD, class first and term second and both always — the same two lines every query in
   src/scores.js and src/assignments.js goes through, and their headers carry the long version: the
   moment an assignment can be copied between classes, a query by id alone can answer with another
   class's work. Here that would offer to mark a class the banner does not name. */
function assignmentsOf(classId, termId) {
  if (!classId) return [];
  return assignmentsIn(getDoc()).filter((a) => a.classId === classId && a.termId === termId);
}

function studentsIn(doc) { return doc && Array.isArray(doc.students) ? doc.students : []; }

/* A roster id that names nobody is dropped rather than counted as a blank — the same harmless
   failure src/scores.js's rosterOf() describes, from a restored or hand-edited document. A student
   who does not exist has no cell, and a prompt that offered to mark one missing would be offering
   to write a score for nobody. */
function rosterOf(cls) {
  const doc = getDoc();
  const ids = cls && Array.isArray(cls.roster) ? cls.roster : [];
  return ids.map((id) => studentsIn(doc).filter((s) => s.id === id)[0]).filter(Boolean);
}

/* Every read of one cell goes through here, and a cell that is not an object is treated as no cell
   at all rather than repaired in place — the posture src/grade-engine.js and src/scores.js both
   take, and for the same reason: accepting two shapes is how a later grade comes to depend on which
   path wrote the cell. */
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

function hasValue(cell) {
  if (!cell || cell.v === null || cell.v === undefined) return false;
  return Number.isFinite(Number(cell.v));
}

/*
  IS THIS CELL ONE THE TEACHER HAS SAID NOTHING ABOUT — decision 1, and it is the whole safety of
  this feature in four lines. No key at all, or a cell carrying neither a number nor a flag. Any
  flag at all — `late`, `missing`, `excused` — is a decision she made, and this prompt does not
  propose to overwrite decisions, only to fill in silence.
*/
function isUntouched(cell) {
  if (!cell) return true;
  return !flagOf(cell) && !hasValue(cell);
}

/* A points value that is a number, for the sentence that says what accepting would cost. What is
   STORED is whatever the teacher typed, including 0 — src/assignments.js decision 2. */
function pointsOf(assignment) {
  const n = Number(assignment && assignment.points);
  return Number.isFinite(n) ? n : 0;
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

/* An ISO date this file is willing to compare. Anything else — an empty due date, a half-typed one,
   a field a restore left as a number — is not past due and is not anything else either. */
function isDate(iso) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''));
}

/* ────────────────────────────── dismissals ────────────────────────────── */

/* The map as it is on disk, defended against a preference that arrived as something else from an
   older build or a hand-edited storage. src/prefs.js merges defaults on read; this is the shape
   guard on top of it. */
function dismissedMap() {
  const raw = getPref(DISMISS_PREF);
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

function isDismissed(assignmentId) {
  return dismissedMap()[assignmentId] === true;
}

/* One write for however many assignments the banner named, so that "Not now" is one act rather than
   one act per assignment — the same reason accept below writes every cell in one update(). */
function rememberDismissed(ids) {
  const map = dismissedMap();
  ids.forEach((id) => { map[id] = true; });
  setPref(DISMISS_PREF, map);
}

/* ────────────────────────────── the set ────────────────────────────── */

/*
  THE ONE WALK OF THE DOCUMENT — decision 2. Assignments in the open class and term whose due date
  has gone by and which are not already dismissed, each with the students whose cell says nothing.
  An assignment with no untouched cells is not in the answer at all, so an empty array means there is
  nothing to ask about and the banner stays down.
*/
function pastDueBlanks(cls, termId) {
  const doc = getDoc();
  if (!doc || !cls || !termId) return [];
  const today = todayISO();
  const roster = rosterOf(cls);
  const out = [];

  assignmentsOf(cls.id, termId).forEach((assignment) => {
    /* An empty due date is valid and can never be past due; a date that is today has not gone by —
       decision 5, and the same comparison src/assignments.js's overdue tint makes. */
    if (!isDate(assignment.due) || !(assignment.due < today)) return;
    if (isDismissed(assignment.id)) return;
    const students = roster
      .filter((student) => isUntouched(cellOf(doc, assignment.id, student.id)))
      .map((student) => ({ id: student.id, name: rosterName(student) }));
    if (!students.length) return;
    out.push({
      id: assignment.id,
      name: assignment.name || 'Untitled assignment',
      due: assignment.due,
      points: pointsOf(assignment),
      students: students,
    });
  });

  return out;
}

function countOf(set) {
  return set.reduce((n, work) => n + work.students.length, 0);
}

/* The assignments the banner is about, in words. Two are named; beyond that the tail is counted,
   because a sentence listing nine assignment names is a sentence nobody reads. */
function namesOf(set) {
  const named = set.map((work) => work.name + ' (due ' + (shortDate(work.due) || work.due) + ')');
  if (named.length === 1) return named[0];
  if (named.length === 2) return named[0] + ' and ' + named[1];
  return named[0] + ', ' + named[1] + ' and ' + plural(named.length - 2, 'other', 'others');
}

/* ────────────────────────────── the banner ────────────────────────────── */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function actionButton(label, hook, className) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'class-action-btn past-due-btn' + (className ? ' ' + className : '');
  btn.setAttribute(hook, '');
  btn.textContent = label;
  return btn;
}

/*
  THE SENTENCE, and it is the work order's own copy: "6 blanks are past due — mark them missing?"

  A QUESTION AND NOT A WARNING, which is the register the whole feature lives or dies in. It names a
  number, it pluralises, and it ends in a question mark — because what it describes is not a fault:
  the teacher may simply not have finished grading, and nothing in this app has decided otherwise.
  The line under it is the same sentence the overdue tint's `title` says one file over, kept in the
  same words on purpose (src/assignments.js's renderRow) — nothing has been marked and no grade has
  changed.
*/
function sentence(blanks) {
  return blanks === 1
    ? '1 blank is past due — mark it missing?'
    : blanks + ' blanks are past due — mark them missing?';
}

/* One reviewed row: which work, when it was due, and every student whose cell says nothing about
   it. The ids ride on the row because "exactly the previewed cells" is otherwise a claim nobody can
   read back — a check comparing the names in this list would be comparing a formatter's output, and
   the acceptance line is about cells. */
function reviewRow(work) {
  const row = el('div', 'past-due-row');
  row.setAttribute('data-past-due-work', work.id);

  const head = el('div', 'past-due-row-head');
  head.append(el('b', '', work.name));
  head.append(el('span', 'past-due-row-due', 'due ' + (shortDate(work.due) || work.due)));
  head.append(el('span', 'past-due-row-cost',
    plural(work.students.length, 'blank', 'blanks') + ' · each would count 0 out of '
      + work.points));
  row.append(head);

  const names = el('div', 'past-due-names');
  work.students.forEach((student) => {
    const chip = el('span', 'past-due-name', student.name);
    chip.setAttribute('data-past-due-cell', work.id + '/' + student.id);
    names.append(chip);
  });
  row.append(names);
  return row;
}

/* One host, drawn from `previewed` and nothing else — so the two screens that wear this prompt
   cannot disagree about what it says, and neither can the sentence and the review. */
function paintHost(host, set, blanks) {
  host.textContent = '';
  host.classList.toggle('hidden', !blanks);
  if (!blanks) return;

  const said = el('div', 'past-due-said');
  said.append(el('span', 'past-due-lead', sentence(blanks)));
  said.append(el('span', 'past-due-where', 'In ' + namesOf(set) + '. Nothing has been marked and '
    + 'no grade has changed — Planbook never decides anything from a date.'));
  host.append(said);

  const actions = el('div', 'past-due-actions');
  const review = actionButton((reviewOpen ? 'Hide the ' : 'Review the ') + blanks,
    'data-past-due-review');
  review.setAttribute('aria-expanded', reviewOpen ? 'true' : 'false');
  review.title = 'Show every blank this would mark, student by student, before anything is written.';
  actions.append(review);

  const accept = actionButton('Mark them missing', 'data-past-due-accept', 'primary');
  accept.setAttribute('aria-label', 'Mark all ' + plural(blanks, 'past-due blank', 'past-due blanks')
    + ' missing');
  accept.title = 'Writes missing on each of these blanks. Missing counts as zero out of the full '
    + 'points, and you can take any of them off again in the grid.';
  actions.append(accept);

  const not = actionButton('Not now', 'data-past-due-dismiss');
  not.setAttribute('aria-label', 'Not now — leave these blanks alone and stop asking about '
    + (set.length === 1 ? 'this assignment' : 'these assignments'));
  not.title = 'Changes nothing. The blanks stay blank, no grade moves, and this prompt stops '
    + 'asking about this work.';
  actions.append(not);
  host.append(actions);

  if (!reviewOpen) return;
  const list = el('div', 'past-due-review');
  set.forEach((work) => list.append(reviewRow(work)));
  host.append(list);
}

/*
  THE PROMPT, REDRAWN FROM THE OPEN DOCUMENT. Called by the screens that wear it at the end of their
  own render — src/scores.js and src/assignments.js — which is what makes "on opening an assignment
  or a class gradebook" true without either of them learning what a due date is.

  IT IS DELIBERATELY NOT ON THE TYPING PATH. src/scores.js repaints its grade column on every
  keystroke and does not call this: rebuilding three buttons under a teacher's hand while she types
  is the failure index.html records about the flag bar, and the count going one stale while she fills
  a cell in is the smaller cost. Accept re-checks each cell anyway — decision 2.
*/
export function paintPastDue() {
  const cls = getSelectedClass();
  const term = getSelectedTerm();
  previewed = pastDueBlanks(cls, term ? term.id : '');
  const blanks = countOf(previewed);
  if (!blanks) reviewOpen = false;
  const hosts = Array.prototype.slice.call(document.querySelectorAll(HOST_SEL));
  hosts.forEach((host) => paintHost(host, previewed, blanks));
}

/*
  WHETHER THE PROMPT IS ASKING ABOUT THIS ASSIGNMENT (WO-3.19) — the quiet half of the same nudge,
  and what lets the score grid tint a column head without src/scores.js learning what a due date is.

  IT IS A READ OF `previewed` AND NOT A SECOND WALK, which is the whole reason it is exported.
  AGENTS.md's data invariant says the clock may be read in one place and that no second reader of the
  date may be added; the drawing's `.scores-col-due.overdue` asks the same question this module has
  already answered, so it gets the answer rather than a `due < today` of its own. That also makes the
  tint and the sentence incapable of naming different work — WO-3.19's acceptance line 3 is "exactly
  the assignments the banner's sentence names", and it is held here by construction rather than by
  two comparisons happening to agree.

  IT ANSWERS ABOUT THE LAST PAINT, so the caller has to have painted. paintPastDue() recomputes
  `previewed`, and the screen that draws a tinted head calls it earlier in the same render — see
  src/scores.js at the call, which says what moving that line would cost. A caller asking before
  painting would be asking about the class before.

  TWO CONSEQUENCES, STATED RATHER THAN LEFT TO BE FOUND. A dismissed assignment is not in `previewed`,
  so "Not now" takes the tint off that column head as well as taking the banner down — ON THE NEXT
  RENDER, because dismissPastDue() repaints this banner and cannot touch a grid it does not import, and
  rebuilding the grid under a half-typed digit is a cost src/shell.js refuses to pay for a tap that
  wrote nothing. The owner checked the one-render lag on the iPad on 2026-08-13 and called it
  unnoticeable. The same qualifier is on the sibling comments at src/shell.js:1139 and src/prefs.js:136;
  it was missing here until WO-3.19's own verification caught it, in prose written by a work order about
  keeping comments true. They are one signal at two volumes (src/assignments.css § the past-due prompt, on the shared ink), and an amber
  head with nothing on screen to explain it is the worse half to keep. And the assignment list's own
  amber date is NOT this answer: that is src/assignments.js's own comparison over its own set — a
  column not fully entered, dismissed or not — which is a different question and stays amber after a
  "Not now". Two questions, deliberately, and each is asked where it is answered.
*/
export function pastDueAsksAbout(assignmentId) {
  return previewed.some((work) => work.id === assignmentId);
}

/* The review, opened and closed on the same button. A disclosure and not a preference — decision 3
   — so nothing remembers it past the next repaint of a screen with no blanks left on it. */
export function togglePastDueReview() {
  reviewOpen = !reviewOpen;
  paintPastDue();
  const blanks = countOf(previewed);
  announce(reviewOpen
    ? 'Showing every past-due blank — ' + plural(blanks, 'cell', 'cells') + ', student by student. '
      + 'Nothing is marked until you say so.'
    : 'The list of past-due blanks is hidden. Nothing was marked.');
}

/*
  ACCEPT — the only write in this file, and the only thing in Planbook that ever puts a flag on a
  cell the teacher did not point at.

  ONE update() FOR THE WHOLE SET, because it is one act: she answered one question about six cells,
  and six saves would be six entries in a history this app does not keep and one debounce the store
  would have to coalesce anyway.

  `{ v: null, flag: 'missing' }` AND NOTHING ELSE, which is the shape docs/data-model.md gives and
  the shape src/scores.js's cellFor() writes for the same flag. It is written literally here rather
  than imported: cellFor() is private to that file, and importing it would run a second import back
  into the module that calls this one. The two shapes are asserted against each other in
  tools/verify-shell.mjs rather than trusted.

  A CELL THAT STOPPED BEING BLANK IS DROPPED — decision 2. Nothing is blocked while the banner is
  up, so a teacher can type into one of these cells before she taps; writing over what she typed is
  the failure this whole feature is arranged to avoid.

  Returns whether anything was written, so that src/shell.js knows whether the screen underneath has
  to be redrawn — this module paints its own banner and deliberately knows about no other surface.
*/
export function acceptPastDue() {
  const set = previewed;
  const blanks = countOf(set);
  if (!blanks) {
    announce('There is nothing past due to mark.');
    return false;
  }

  const doc = getDoc();
  const wanted = [];
  const skipped = [];
  set.forEach((work) => {
    work.students.forEach((student) => {
      if (isUntouched(cellOf(doc, work.id, student.id))) wanted.push({ work: work, student: student });
      else skipped.push(student.name);
    });
  });

  if (wanted.length) {
    update((d) => {
      if (!d.scores || typeof d.scores !== 'object') d.scores = {};
      wanted.forEach((cell) => {
        if (!d.scores[cell.work.id]) d.scores[cell.work.id] = {};
        d.scores[cell.work.id][cell.student.id] = { v: null, flag: 'missing' };
      });
    });
  }

  /* Said out loud in the same register src/scores.js's applyFlag() uses for one cell, because this
     is that act done to several at once and there is no undo in this app — the sentence is the
     record of what happened. */
  announce(wanted.length
    ? plural(wanted.length, 'blank', 'blanks') + ' marked missing in ' + namesOf(set) + '. Each '
      + 'counts 0 out of the full points, and nothing else changed.'
      + (skipped.length
        ? ' ' + plural(skipped.length, 'cell', 'cells') + ' was left alone because a score went in '
          + 'while this was on screen: ' + skipped.join(', ') + '.'
        : '')
    : 'Nothing was marked — every one of those cells has a score or a flag on it now.');

  reviewOpen = false;
  /* Its own banner, immediately — the set it was drawn from has just stopped being true. The SCREEN
     under it is src/shell.js's to redraw, which is what the return value is for: this module knows
     about no surface but its own hosts. */
  paintPastDue();
  return wanted.length > 0;
}

/*
  DISMISS — and it does nothing, which is the point.

  No cell is written, no grade moves, and the only thing that changes anywhere is a `planbook_` key
  saying this browser has been asked about this work. Acceptance line 1 is that dismissing changes no
  score and no grade; the way to be sure of that is for this function to contain no path to the
  document at all, which it does.
*/
export function dismissPastDue() {
  const set = previewed;
  if (!set.length) return;
  rememberDismissed(set.map((work) => work.id));
  announce('Left alone. Nothing was marked and no grade changed — ' + namesOf(set)
    + (set.length === 1 ? ' keeps its blanks' : ' keep their blanks')
    + ', and this prompt will not ask about ' + (set.length === 1 ? 'it' : 'them') + ' again.');
  reviewOpen = false;
  paintPastDue();
}
