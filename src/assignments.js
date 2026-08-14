/*
  The assignment list — one class, one term, the work in it. And the three dialogs that write one
  assignment: the editor, the duplicate, and the delete confirm.

  THE LIST IS A VIEW AND THE EDITORS ARE MODALS, and that split is the decision this file was most
  likely to get wrong. Every class-scoped editor built before it is a dialog — the class manager,
  the term editor, the roster paste box, the student editor, the categories panel — so the
  precedent in this repository points the other way. The rule that beats it is WO-1.13's and it is
  older: a surface a teacher works in is a view, a task she finishes and dismisses is a modal.
  Scanning the term's work in the week before grades are due is the first; writing one assignment
  down is the second. plans/gradebook-surfaces.md is the record, it is settled rather than open,
  and index.html says the same thing at #assignmentsView.

  SHAPED LIKE src/roster.js, which is the shape src/classes.js and src/backup.js follow too: a
  feature in its own file, driven by the data-* hooks src/shell.js routes to it, rendering rows
  with createElement rather than innerHTML, and reporting its refusals into its own panel rather
  than onto the save chip. The chip means "did a save land"; "that class has no categories yet" is
  not a save.

  ── THE classId GUARD, WHICH IS THIS WORK ORDER'S NAMED TRAP ──

  EVERY query below filters by `classId`, and several by `termId` as well, even where an id lookup
  would obviously be enough. That is not belt and braces, it is the thing duplicate-to-another-class
  breaks if it is left out: WO-3.1's removalCounts() and applyRemoval() filter by `categoryId`
  alone, which is safe only while a category id can appear in one class. The moment an assignment
  can be copied across classes, a copy that carried its source's `categoryId` would sit in class B
  filed under a category that only class A has — invisible on B's list, counted by nothing, and
  destroyed by a category removal in A under a dialog naming A. So the copy below chooses the
  target's own category (by NAME, and never by id), and this file never asks "which assignments are
  in this category" without also saying which class. (The two functions in src/categories.js took
  the same guard in this pass, for the same reason and with a note there.)

  ── FIVE THINGS THAT WILL LOOK LIKE OMISSIONS AND ARE DECISIONS ──

  1. TODAY IS OFFERED, AND NOTHING ELSE EVER IS. A newly created assignment arrives with `assigned`
     and `due` both on today — in createAssignment() below, and nowhere else — because today is the
     day a teacher is almost always writing the thing down on, and typing it into an iPad picker
     costs more than it saves. That is the ONLY value this file will ever put in a date field it was
     not handed. Nothing is guessed, nothing is advanced to the end of the term, and above all
     nothing is set to "the next time this class meets", which does not exist and is not going to:
     plans/rotating-schedule.md records a cycle model that was designed and deleted the same day,
     because the owner's rotation also changes at random. **Today is a fact and a next meeting is a
     guess**, and it is the guess the rule forbids — which is why the owner could overrule the older
     version of this decision ("neither date fills itself in") on 2026-08-10 without touching the
     reasoning under it. WO-3.17 is the record, and index.html's hint says the same thing to the
     teacher in her own words.

     THREE THINGS THAT SURVIVE THAT CHANGE, and each is one of that work order's acceptance lines.
     An empty date is still valid and still stays empty — the same rule src/classes.js states for
     term dates — so clearing one must not re-fill it (assignmentDateCommitted() below rebuilds the
     field from the assignment, which is what makes that true rather than remembered). The default
     is a CREATION-time default, so an assignment being EDITED is never touched: open a two-year-old
     assignment with a blank Due and it opens blank. And a COPY keeps whatever its source had, which
     is the duplicate dialog's own rule and not this one — confirmCopy() says why beside it.

     The clock is read in exactly two places in this file, and both of them are today: that default,
     and the overdue TINT below, which changes no stored value and marks no student.

  2. POINTS ARE STORED EXACTLY AS TYPED, INCLUDING 0. Nothing here clamps, rounds, rejects or
     "helpfully" defaults a number a teacher entered — the rule src/categories.js states for a
     weight, one field over, and for the same reason docs/data-model.md gives: a value that
     silently is not what you typed is the worst thing a gradebook can do. **0 is not a mistake to
     be caught: it is the extra-credit mechanism** (docs/data-model.md § Extra credit, owner's
     decision 2026-08-09) — a 0-point assignment scored 5 adds 5 to its category's earned points
     and nothing to its possible ones. So the field accepts it, the document keeps it, and the row
     says EXTRA CREDIT in words beside it rather than leaving a lone zero to read as a slip.

  3. NOTHING HERE COMPUTES A GRADE. Not a percentage, not a category average, not a letter. WO-3.4
     owns that arithmetic together with the hand-computed docs/grade-math-cases.md that is
     deliberately its only test suite, and WO-3.5 owns the screen that draws it; building any of it
     here would land the arithmetic without the document that checks it. What this screen counts is
     COVERAGE — how many of the class's students have a cell on each assignment — which is the
     question the screen is opened to answer in the week before grades are due, and which is
     arithmetic over keys rather than over scores.

  4. NOTHING IS SORTED. The list renders in the order the document holds, grouped by the class's
     own category order, exactly as src/roster.js renders a roster and src/classes.js renders
     terms. The teacher's ↑ ↓ are the only thing that changes it — sorting by due date behind her
     back would be a second opinion about an order she can see and rearrange.

  5. AN EMPTY CATEGORY IS DRAWN, WITH ITS CONSEQUENCE IN WORDS. A category with nothing filed under
     it redistributes its weight across the categories that do have work (docs/data-model.md
     § Grade math), which is the rule a teacher is most likely to be surprised by — so the group
     appears and says so, rather than being dropped and leaving her to wonder whether the app lost
     something. At weight 0 it says something else, because there the redistribution is a no-op and
     the sentence would be false.

  6. NO SUPPORT DATA IS READ IN THIS FILE, AND THE PROMPT IN THE EDITOR IS NOT AN EXCEPTION (WO-3.8).
     The dialog carries a summary — *"3 students have extended time, 2 need a separate setting"* —
     for the category the teacher has chosen, and every part of it that touches a student's
     `supports` block lives in src/accommodation-prompt.js: the counting, the presentation-mode
     suppression, the names behind a deliberate tap, and the words. What this file does is say WHICH
     class and WHICH CATEGORY NAME, which is the one fact the dialog knows and that module cannot
     ask for. Grep this file for `student.supports`, `supportsVisible` or `accommodationsOf` and the
     answer must stay zero — the mentions below are this paragraph and the import beneath it.
*/

import { getDoc, update, newId } from './store.js';
import { openModal, closeModal } from './modal.js';
import { announce } from './live-region.js';
/* The resolution of "which class and which term is open" stays in src/classes.js — this file asks
   rather than keeping its own answer, the same import src/roster.js and src/attendance.js make. The
   import runs one way: nothing in src/classes.js knows this file exists. */
import { getSelectedClass, getSelectedTerm, getActiveClasses, getTerms } from './classes.js';
/* The category list and the way a weight is written down. src/categories.js is a leaf and imports
   nothing back, which is what lets both this file and src/classes.js wear it. */
import { categoriesOf, formatWeight } from './categories.js';
/* What today is, and this is the ONE thing in this file that reads a clock. Imported rather than
   re-derived for the reason src/home.js imports the same function: two answers to "what day is it"
   is how a screen and a record end up disagreeing about a date, and src/attendance.js's todayISO()
   is built from the local calendar fields precisely so that an evening in October is not tomorrow.
   Used in exactly two places, both of them today: the creation-time default both dates arrive on,
   and the overdue tint — see decision 1. */
import { todayISO } from './attendance.js';
/* THE PAST-DUE PROMPT (WO-3.6). The tint below is this file's own answer to "this date has gone
   by"; the banner that OFFERS to do something about it is that module's, on this screen and on the
   score grid both. Drawn by calling one function and passing nothing: it asks src/classes.js which
   class and term are open, exactly as this file does. The import runs one way — nothing in
   src/past-due.js knows this file exists.

   THE SCORE GRID'S COLUMN HEAD ASKS THAT MODULE INSTEAD (WO-3.19), and the asymmetry is deliberate
   rather than a file that was missed. Nothing in src/scores.js reads a clock — its decision 1 — so
   its tint has to be somebody's answer, and it takes the prompt's. This file already reads the clock
   for the creation-time default above, so its own tint stays its own comparison over its own set: a
   column not fully ENTERED, which is a wider question than the prompt's untouched blanks and is not
   silenced by a "Not now". Two questions with two answers, said here because a reader who found them
   drawn in one amber would otherwise read the second one as a bug. */
import { paintPastDue } from './past-due.js';
/* THE ACCOMMODATION PROMPT (WO-3.8), which is the other prompt in this phase and the one with rules
   under it. This file passes it the class and the category NAME chosen in the editor and gets back a
   count; it never reads a student's `supports` block, never asks whether presentation mode is on,
   and holds no part of the match rule — all three live behind that module and src/supports.js
   behind it. The import runs one way: nothing in src/accommodation-prompt.js knows this file
   exists. */
import { paintAccommodationPrompt } from './accommodation-prompt.js';

const EDITOR_MODAL_ID = 'assignmentModal';
const COPY_MODAL_ID = 'assignmentCopyModal';
const DELETE_MODAL_ID = 'assignmentDeleteModal';

const CLASS_NAME_ID = 'assignmentsClassName';
const SUMMARY_ID = 'assignmentsSummary';
const CAPTION_ID = 'assignmentsCaption';
const BODY_ID = 'assignmentsBody';
const TABLE_WRAP_SEL = '#assignmentsView .assign-table-wrap';
const EMPTY_ID = 'assignmentsEmpty';
const HINT_TERM_ID = 'assignmentsHintTerm';

const EDITOR_TITLE_ID = 'assignmentModalTitle';
const EDITOR_FIELDS_ID = 'assignmentFields';
const EDITOR_ERROR_ID = 'assignmentError';

const COPY_LEAD_ID = 'assignmentCopyLead';
const COPY_CLASSES_ID = 'assignmentCopyClasses';
const COPY_FIELDS_ID = 'assignmentCopyFields';
const COPY_NOTE_ID = 'assignmentCopyNote';
const COPY_BTN_ID = 'assignmentCopyBtn';

const DELETE_LEAD_ID = 'assignmentDeleteLead';
const DELETE_FACTS_ID = 'assignmentDeleteFacts';
const DELETE_BTN_ID = 'assignmentDeleteBtn';

/* What a brand-new assignment is worth until the teacher says otherwise, and the one number in
   this file a programmer chose. It is a STARTING POINT and not a rule: the field is the first
   thing the editor opens on and every value including 0 survives being typed into it (decision 2).

   Not 0, and that is the deliberate half. 0 means extra credit in this app, so seeding it would
   make every new assignment extra credit until the teacher noticed — a default that changes what a
   thing MEANS is worse than a default that is merely wrong. Not blank either: `points` is a number
   in the document (docs/data-model.md), and a blank one would be 0 wearing a different hat. */
const DEFAULT_POINTS = 100;

/* Which assignment each dialog is open for, held as ids rather than as objects, for the reason
   src/classes.js gives: the document can be replaced underneath this module by a restore or a year
   switch, and an object held across that is a reference to work in a document nobody has open. */
let editingId = '';
let copyId = '';
let pendingDeleteId = '';

/* What the duplicate dialog is currently proposing. It is a proposal and not a write: nothing here
   reaches the document until the teacher taps the button that names the class it lands in. */
let copyClassId = '';
let copyTermId = '';
let copyCategoryId = '';
let copyName = '';

/* ────────────────────────────── reading the document ────────────────────────────── */

/* Every read of `assignments` goes through here, for the reason src/classes.js's termsOf() exists:
   the key can legitimately be absent — a restored backup written by another build — and a screen
   that has to check before it iterates is a screen that will eventually forget to. */
function assignmentsIn(doc) {
  return doc && Array.isArray(doc.assignments) ? doc.assignments : [];
}

/* THE GUARD, in the two lines every other query in this file goes through. Class first and term
   second, and both always — see the header. */
function assignmentsOf(classId, termId) {
  if (!classId) return [];
  return assignmentsIn(getDoc())
    .filter((a) => a.classId === classId && a.termId === termId);
}

/* Siblings inside one group on screen: same class, same term, same category. This is what the ↑ ↓
   move between, because the list is drawn in groups and an arrow that jumped a group heading would
   move a row somewhere the teacher was not looking. */
function siblingsOf(assignment) {
  return assignmentsOf(assignment.classId, assignment.termId)
    .filter((a) => (a.categoryId || '') === (assignment.categoryId || ''));
}

function findAssignment(id) {
  return assignmentsIn(getDoc()).filter((a) => a.id === id)[0] || null;
}

function findClass(id) {
  return (getDoc() && Array.isArray(getDoc().classes) ? getDoc().classes : [])
    .filter((c) => c.id === id)[0] || null;
}

function findCategory(cls, id) {
  return categoriesOf(cls).filter((c) => c.id === id)[0] || null;
}

function rosterOf(cls) {
  return cls && Array.isArray(cls.roster) ? cls.roster : [];
}

/* A points value that is a number, for arithmetic that must not become NaN. What is STORED is
   whatever was typed (decision 2); this is only how it is added up and printed. */
function pointsOf(assignment) {
  const n = Number(assignment && assignment.points);
  return Number.isFinite(n) ? n : 0;
}

/*
  HOW MUCH OF IT IS ENTERED — the question this screen exists to answer, and the only thing here
  that looks at `scores` at all.

  Counted against the CLASS ROSTER rather than against the score column's own key count: a cell
  left behind by a student who has since been taken off this class's roster is not a student who
  has been graded, and counting it would report 11 of 10. A key that is not there means ungraded
  (docs/data-model.md), which is what makes this a count of keys and never a look at a value —
  nothing in this file reads `v`, and nothing in it can therefore accidentally become arithmetic.
*/
function enteredCount(assignment, cls) {
  const doc = getDoc();
  const column = doc && doc.scores ? doc.scores[assignment.id] : null;
  if (!column) return 0;
  return rosterOf(cls).filter((id) => Object.prototype.hasOwnProperty.call(column, id)).length;
}

function scoreCount(assignmentId) {
  const doc = getDoc();
  const column = doc && doc.scores ? doc.scores[assignmentId] : null;
  return column ? Object.keys(column).length : 0;
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

/* `2026-09-08` → `Sep 8`. Read field by field rather than handed to `new Date('2026-09-08')`,
   which the spec reads as UTC midnight and which is one timezone away from being the day before —
   src/attendance.js's parseISO() carries the long version of that scar. A local copy rather than an
   import for the reason src/days-off.js gives beside its own: the registry's short form is `9/8`
   for a column head and this list wants a month a teacher can read at a glance, so these are two
   formats rather than one function with a flag. */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function shortDate(iso) {
  const parts = String(iso || '').split('-');
  if (parts.length !== 3) return '';
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(d.getTime())) return '';
  return MON[d.getMonth()] + ' ' + d.getDate();
}

/* ────────────────────────────── the screen ────────────────────────────── */

function showAssignmentError(message) {
  const el = document.getElementById(EDITOR_ERROR_ID);
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
  /* Also spoken, for the reason src/classes.js's showClassError() is: it lands in a corner of a
     dialog a screen-reader user has no reason to move to, and there is exactly one aria-live
     region in this app (src/live-region.js). */
  if (message) announce(message);
}

/* Roll Call!'s `.class-action-btn` outline button, built the way src/classes.js and
   src/categories.js each build one. Four lines copied rather than imported, for the reason
   findClass() above is not imported: this is not the resolution of anything. */
function actionButton(label, hook, value, extraClass) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'class-action-btn' + (extraClass ? ' ' + extraClass : '');
  btn.setAttribute(hook, value);
  btn.textContent = label;
  return btn;
}

function cell(row, className, text) {
  const td = document.createElement('td');
  if (className) td.className = className;
  if (text !== undefined) td.textContent = text;
  row.append(td);
  return td;
}

/*
  THE COVERAGE BAR. A bar rather than a number alone, because "18 of 24" is arithmetic and a
  part-filled bar is a glance — and the half-entered state takes the caution wash for the same
  reason src/home.css and src/attendance.css both do with a half-marked class: partly done must not
  read as done.
*/
function progressCell(row, assignment, cls) {
  const td = cell(row, '');
  const total = rosterOf(cls).length;
  const done = enteredCount(assignment, cls);

  const wrap = document.createElement('div');
  wrap.className = 'assign-progress';

  const bar = document.createElement('div');
  bar.className = 'assign-bar';
  const fill = document.createElement('div');
  const share = total ? done / total : 0;
  fill.className = 'assign-bar-fill' + (!done ? ' none' : (done < total ? ' partial' : ''));
  fill.style.width = Math.round(share * 100) + '%';
  bar.append(fill);
  /* The bar is decoration over a number that is already in the row beside it, so it says nothing
     of its own to a screen reader. */
  bar.setAttribute('aria-hidden', 'true');
  wrap.append(bar);

  const count = document.createElement('span');
  count.className = 'assign-count';
  count.textContent = done + '/' + total;
  count.setAttribute('aria-label', done + ' of ' + plural(total, 'student', 'students') + ' entered');
  wrap.append(count);

  td.append(wrap);
  return td;
}

/*
  One row per assignment. createElement rather than innerHTML, and this is a file where that stops
  being a formality: an assignment called "Lab <write-up>" is typed by a teacher and has to be
  those characters rather than markup.
*/
function assignmentRow(assignment, cls, index, siblings) {
  const row = document.createElement('tr');

  const name = cell(row, 'assign-name');
  name.textContent = assignment.name || 'Untitled assignment';
  /* EXTRA CREDIT, in words. A lone 0 in the points column reads as a mistake somebody made; the
     badge says it is a thing the teacher chose, which is what the owner's 2026-08-09 decision
     makes it. Quiet indigo rather than amber — nothing is wrong here. */
  if (pointsOf(assignment) === 0) {
    const badge = document.createElement('span');
    badge.className = 'assign-extra';
    badge.textContent = 'Extra credit';
    badge.title = 'Worth 0 points, so what a student earns on it is added to the category and '
      + 'nothing is added to what was possible.';
    name.append(badge);
  }

  cell(row, 'assign-pts', String(assignment.points === '' || assignment.points === undefined
    ? 0 : assignment.points));
  cell(row, 'assign-date', shortDate(assignment.assigned) || '—');

  const dueCell = cell(row, 'assign-date', shortDate(assignment.due) || '—');
  /*
    THE TINT ON A DATE THAT HAS GONE PAST WITH THE COLUMN UNFINISHED — and it is a tint and
    nothing else. It writes nothing, flags nobody, and changes no grade: no state in this app is
    ever inferred from a date (docs/data-model.md § Grade math, and this phase's own standing
    rule). WO-3.6 owns the prompt that OFFERS to fill the blanks in; this is only the colour that
    makes the teacher look at the row.

    THE `title` BELOW IS COPIED, WORD FOR WORD, IN TWO OTHER PLACES: onto the score grid's own
    overdue column head (WO-3.19) and into the prompt's second line (src/past-due.js's paintHost).
    Three surfaces, one sentence, kept identical on purpose — the reassurance is the same
    reassurance, and a teacher who reads it twice in two wordings has been told two things.
  */
  if (assignment.due && assignment.due < todayISO()
      && enteredCount(assignment, cls) < rosterOf(cls).length) {
    dueCell.classList.add('overdue');
    dueCell.title = 'This date has gone by and not everyone has a score yet. Nothing has been '
      + 'marked and no grade has changed — Planbook never decides anything from a date.';
  }

  progressCell(row, assignment, cls);

  const actionsCell = cell(row, '');
  const actions = document.createElement('div');
  actions.className = 'assign-row-actions';
  const label = assignment.name || 'this assignment';

  /* Explicit up/down rather than drag, for the reason src/classes.js gives about class rows:
     HTML5 drag-and-drop does not fire for touch on iPadOS at all, so a dragged row is a
     laptop-only affordance. The array order IS the order — there is no `order` field, because two
     ways to say where an assignment sits is one way for them to disagree. */
  const up = actionButton('↑', 'data-assignment-move-up', assignment.id, 'move assign-row-btn');
  up.setAttribute('aria-label', 'Move ' + label + ' earlier');
  up.disabled = index === 0;
  const down = actionButton('↓', 'data-assignment-move-down', assignment.id, 'move assign-row-btn');
  down.setAttribute('aria-label', 'Move ' + label + ' later');
  down.disabled = index === siblings - 1;
  actions.append(up, down);

  const edit = actionButton('Edit', 'data-assignment-edit', assignment.id, 'assign-row-btn');
  edit.setAttribute('aria-haspopup', 'dialog');
  edit.setAttribute('aria-label', 'Edit ' + label);
  actions.append(edit);

  const dup = actionButton('Duplicate', 'data-assignment-duplicate', assignment.id, 'assign-row-btn');
  dup.setAttribute('aria-haspopup', 'dialog');
  dup.setAttribute('aria-label', 'Duplicate ' + label + ' into this class or another one');
  actions.append(dup);

  const del = actionButton('Delete', 'data-assignment-delete', assignment.id,
    'delete assign-row-btn');
  del.setAttribute('aria-haspopup', 'dialog');
  del.setAttribute('aria-label', 'Delete ' + label);
  actions.append(del);

  actionsCell.append(actions);
  return row;
}

function groupHead(title, chip, note) {
  const row = document.createElement('tr');
  row.className = 'assign-group-head';
  const td = document.createElement('td');
  td.colSpan = 6;

  const wrap = document.createElement('span');
  wrap.className = 'assign-group-title';
  wrap.append(document.createTextNode(title));

  if (chip) {
    const el = document.createElement('span');
    el.className = 'cat-chip' + (chip.zero ? ' zero' : '');
    el.append(document.createTextNode('weight '));
    const b = document.createElement('b');
    b.textContent = chip.text;
    el.append(b);
    wrap.append(el);
  }
  if (note) {
    const el = document.createElement('span');
    el.className = 'assign-group-note';
    el.textContent = note;
    wrap.append(el);
  }

  td.append(wrap);
  row.append(td);
  return row;
}

function noticeRow(className, text) {
  const row = document.createElement('tr');
  const td = document.createElement('td');
  td.colSpan = 6;
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  td.append(p);
  row.append(td);
  return row;
}

/*
  THE SCREEN, redrawn from the open document. Called by src/shell.js after anything that changes
  what is in it, and after a switch onto it — this module never subscribes to the store, for the
  reason src/classes.js gives: a subscriber fires on every save, and a redraw while a teacher is
  typing in the dialog above would take focus out from under her.
*/
export function renderAssignments() {
  const doc = getDoc();
  const cls = getSelectedClass();
  const term = getSelectedTerm();
  const termId = term ? term.id : '';

  const heading = document.getElementById(CLASS_NAME_ID);
  if (heading) heading.textContent = cls ? cls.name : 'No class open';

  const body = document.getElementById(BODY_ID);
  const empty = document.getElementById(EMPTY_ID);
  const wrap = document.querySelector(TABLE_WRAP_SEL);
  const summary = document.getElementById(SUMMARY_ID);
  const caption = document.getElementById(CAPTION_ID);
  const hintTerm = document.getElementById(HINT_TERM_ID);

  const list = cls ? assignmentsOf(cls.id, termId) : [];
  const points = list.reduce((n, a) => n + pointsOf(a), 0);
  const termLabel = term ? (term.label || 'Untitled term') : '';

  if (hintTerm) hintTerm.textContent = termLabel || 'this class';
  if (summary) {
    summary.textContent = !doc ? 'No school year is open.'
      : !cls ? 'Add a class from the class bar first.'
        : 'Assignments · ' + (termLabel || 'No term set') + ' · '
          + plural(list.length, 'assignment', 'assignments') + ' · '
          + plural(points, 'point', 'points');
  }
  if (caption) {
    caption.textContent = cls
      ? 'Assignments in ' + cls.name + (termLabel ? ', ' + termLabel : '')
        + ', grouped by grading category.'
      : 'No class is open.';
  }

  if (!body) return;
  body.textContent = '';

  /* The three states this screen can be in that are not "here is the work", each said in words
     rather than left as an empty table. */
  let emptyText = '';
  if (!doc) emptyText = 'No school year is open, so there is nowhere to put an assignment yet.';
  else if (!cls) {
    emptyText = 'No class is open. Add one from the class bar first — an assignment belongs to a '
      + 'class and a term.';
  } else if (!termId) {
    emptyText = cls.name + ' has no terms yet, and an assignment belongs to one. Add a term from '
      + 'the class manager and this list will have somewhere to put work.';
  } else if (!list.length) {
    emptyText = 'Nothing in ' + cls.name + ' for ' + termLabel + ' yet. “+ New assignment” above '
      + 'adds the first one — a name, what it is out of, and which category it counts in.';
  }

  if (empty) {
    empty.textContent = emptyText;
    empty.classList.toggle('hidden', !emptyText);
  }
  if (wrap) wrap.classList.toggle('hidden', !!emptyText);
  /* THE PAST-DUE PROMPT (WO-3.6), painted on both sides of the empty-state return below for the
     reason src/scores.js gives at the same point in its own render: with no term or no work there
     is nothing past due, and a banner left standing from the class before would be asking about
     work this screen is not showing. It is the same prompt, from the same computed set, on the
     other screen this work order names — the tint on the Due column beside it is the quiet half of
     the same fact. */
  paintPastDue();
  if (emptyText) return;

  /* Grouped by the class's OWN category order, which is the order the teacher put them in
     (src/categories.js renders the same list the same way). An empty category is drawn rather than
     dropped — see decision 5 in the header. */
  const cats = categoriesOf(cls);
  cats.forEach((cat) => {
    const held = list.filter((a) => a.categoryId === cat.id);
    const weight = Number(cat.weight);
    const zero = !Number.isFinite(weight) || weight === 0;
    const catPoints = held.reduce((n, a) => n + pointsOf(a), 0);
    body.append(groupHead(
      cat.name || 'Untitled category',
      { text: formatWeight(Number.isFinite(weight) ? weight : 0) + '%', zero: zero },
      held.length
        ? plural(held.length, 'assignment', 'assignments') + ' · ' + plural(catPoints, 'point', 'points')
        : 'nothing in it yet'
    ));

    if (!held.length) {
      /*
        WHAT AN EMPTY CATEGORY COSTS, in the two cases where the answer differs. At a real weight
        it redistributes — the data model's rule, and the one a teacher is most likely to be
        surprised by — so the row says so rather than letting her conclude the app lost her work.
        At weight 0 that sentence would be false: there is nothing to redistribute, and saying
        there is would teach her to distrust the next one. (This is the open question the drawing
        left at design/mockups/assignments.html, answered here rather than left to the next reader.)
      */
      body.append(noticeRow('assign-group-empty', zero
        ? 'Nothing is filed under “' + (cat.name || 'this category') + '” yet, and its weight is '
          + '0% — so it counts for nothing either way until you put work in it and give it a weight.'
        : 'Nothing is filed under “' + (cat.name || 'this category') + '” yet, so its '
          + formatWeight(weight) + '% redistributes across the categories that do have work rather '
          + 'than counting as a zero. Nothing is wrong; this category is simply not part of the '
          + 'grade until something is in it.'));
      return;
    }
    held.forEach((a, i) => body.append(assignmentRow(a, cls, i, held.length)));
  });

  /*
    WORK THAT IS IN NO CATEGORY THIS CLASS HAS. Two ways to arrive: an assignment created while the
    class had no categories at all, and one whose category was removed by a build or a document
    this one did not write. Red rather than amber, because an empty category costs nothing and this
    costs the assignment — it is counted by nothing until it is re-filed, and Edit is one tap away
    on its own row.
  */
  const filed = cats.map((c) => c.id);
  const loose = list.filter((a) => filed.indexOf(a.categoryId) === -1);
  if (loose.length) {
    body.append(groupHead('Not in a category', null,
      plural(loose.length, 'assignment', 'assignments')));
    body.append(noticeRow('assign-group-orphan', plural(loose.length, 'assignment', 'assignments')
      + ' below ' + (loose.length === 1 ? 'is' : 'are') + ' not filed under any category '
      + cls.name + ' has, so nothing counts ' + (loose.length === 1 ? 'it' : 'them') + ' at all. '
      + 'Open Edit on each one and choose a category.'));
    loose.forEach((a, i) => body.append(assignmentRow(a, cls, i, loose.length)));
  }
}

/* ────────────────────────────── the editor ────────────────────────────── */

function fieldWrap(labelText, wide) {
  const wrap = document.createElement('label');
  wrap.className = 'assign-field' + (wide ? ' assign-field-wide' : '');
  const caption = document.createElement('span');
  caption.className = 'assign-field-label';
  caption.textContent = labelText;
  wrap.append(caption);
  return wrap;
}

function textField(assignment, field, labelText, wide) {
  const wrap = fieldWrap(labelText, wide);
  const input = document.createElement('input');
  input.className = 'assign-field-input';
  input.type = 'text';
  input.value = typeof assignment[field] === 'string' ? assignment[field] : '';
  input.setAttribute('data-assignment-field', field);
  input.setAttribute('data-assignment-id', assignment.id);
  input.setAttribute('autocomplete', 'off');
  wrap.append(input);
  return wrap;
}

function pointsField(assignment) {
  const wrap = fieldWrap('Points');
  const input = document.createElement('input');
  input.className = 'assign-field-input';
  /* A real number input: iPadOS gives a numeric keypad for it, and the spinner is a laptop path
     for a teacher nudging a mark out of. `min` is a hint to the spinner and to a form validator; it
     is NOT a guard, and nothing here refuses a value it dislikes — see decision 2. Above all `0`
     is typed, kept, and shown as extra credit. */
  input.type = 'number';
  input.min = '0';
  input.step = 'any';
  input.setAttribute('inputmode', 'decimal');
  input.value = String(assignment.points === '' || assignment.points === undefined
    ? 0 : assignment.points);
  input.setAttribute('data-assignment-field', 'points');
  input.setAttribute('data-assignment-id', assignment.id);
  input.setAttribute('aria-describedby', 'assignmentPointsNote');
  wrap.append(input);

  const note = document.createElement('span');
  note.className = 'assign-field-note';
  note.id = 'assignmentPointsNote';
  note.textContent = '0 is extra credit, and it stays 0.';
  wrap.append(note);
  return wrap;
}

function categoryField(assignment, cls) {
  const wrap = fieldWrap('Category', true);
  const select = document.createElement('select');
  select.className = 'assign-field-select';
  /* Its own hook rather than `data-assignment-field`, and that is the same call src/shell.js's
     `data-support-kind` records: a <select> commits on `change`, and carrying the field hook would
     put it in front of the `input` listener as well — one tap writing the same value twice and
     moving `rev` twice. */
  select.setAttribute('data-assignment-category', assignment.id);

  const cats = categoriesOf(cls);
  const known = cats.some((c) => c.id === assignment.categoryId);
  /* The "no category" option exists only while the assignment is in that state, so it cannot be
     chosen back into it by accident — but it is never hidden from an assignment that IS in it,
     because a select that does not offer the value it is showing is a select that reads as having
     silently moved the row. */
  if (!known) {
    const none = document.createElement('option');
    none.value = '';
    none.textContent = cats.length ? '— choose a category —' : '— this class has no categories —';
    none.selected = true;
    select.append(none);
  }
  cats.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat.id;
    /* The weight is in the option because it is the fact that makes a category a choice rather
       than a label: "Quizzes — 25%" is what a teacher is deciding between. */
    option.textContent = (cat.name || 'Untitled category') + ' — '
      + formatWeight(Number(cat.weight) || 0) + '%';
    if (cat.id === assignment.categoryId) option.selected = true;
    select.append(option);
  });

  wrap.append(select);
  return wrap;
}

/* One truth for the two captions, because rebuildDateField() below has to rebuild a field without
   being told what it was called. */
const DATE_LABELS = { assigned: 'Assigned', due: 'Due' };

function dateField(assignment, field) {
  const wrap = fieldWrap(DATE_LABELS[field] || '');
  const input = document.createElement('input');
  input.className = 'assign-field-date';
  /* A real date input, so iPadOS gives the teacher its own picker rather than a text field she has
     to type an ISO string into. Empty is allowed and stays empty. There is no `min`, no `max`, and
     nothing comparing this field to the other one or to a term's dates — see decision 1, and
     src/classes.js's dateField(), which states the same refusal about term dates.

     THIS FUNCTION SHOWS WHAT THE ASSIGNMENT HOLDS AND DECIDES NOTHING. Today arrives on a new
     assignment in createAssignment(), which is a creation-time default; a field built here for an
     EXISTING assignment with a blank date is blank, and so is the one rebuilt after a clear. Both
     of those are acceptance lines of WO-3.17 and both are true because the value is read rather
     than chosen. A `|| todayISO()` on the line below would break them together. */
  input.type = 'date';
  input.value = typeof assignment[field] === 'string' ? assignment[field] : '';
  input.setAttribute('data-assignment-field', field);
  input.setAttribute('data-assignment-id', assignment.id);
  input.setAttribute('aria-label', (DATE_LABELS[field] || '') + ' — '
    + (assignment.name || 'this assignment'));
  wrap.append(input);
  return wrap;
}

/*
  THE ACCOMMODATION PROMPT FOR WHATEVER THE EDITOR IS OPEN ON (WO-3.8), computed from the document
  rather than from anything this module remembers — so a category picked a moment ago, a category
  renamed in the panel behind the dialog, and a document replaced by a restore all give the same
  answer as opening the dialog fresh would.

  IT IS THE CATEGORY'S NAME THAT GOES ACROSS, NOT ITS ID. `appliesTo` is free text a teacher typed
  on the roster and a category name is free text she typed in the categories editor
  (src/supports.js's parseAppliesTo says why there is deliberately no id to join on), so the name is
  the only thing the two sides have in common. An assignment filed under nothing sends '', which is
  a real answer: an accommodation scoped to everything still applies to it, and a scoped one does
  not.
*/
function paintEditorSupports() {
  const assignment = findAssignment(editingId);
  const cls = assignment ? findClass(assignment.classId) : null;
  const cat = cls ? findCategory(cls, assignment.categoryId) : null;
  return paintAccommodationPrompt(cls, cat ? (cat.name || '') : '');
}

/*
  AND THE SAME PAINT AFTER A PRESENTATION-MODE FLIP, called from src/shell.js's
  flipPresentationMode() — which is where this app states the order things happen in, and which asks
  every screen that can be holding support data to redraw the glass rather than waiting for the next
  render. src/roster.js's refreshSupportSurfaces() is the same seam one feature over.

  WITH ONE EXTRA GUARD THAT MODULE DOES NOT NEED: this dialog is not re-opened on a flip, and
  `editingId` outlives a close (nothing clears it but a delete). So a flip made with the editor SHUT
  would otherwise paint a summary into a hidden dialog's DOM — not on screen, but present, which is
  the distinction src/supports.js's sensitiveValue() draws and the one this feature is held to. Shut
  means cleared.
*/
export function refreshAccommodationPrompt() {
  const modal = document.getElementById(EDITOR_MODAL_ID);
  const open = !!modal && !modal.classList.contains('hidden');
  if (!open) { paintAccommodationPrompt(null, ''); return; }
  paintEditorSupports();
}

function renderEditorFields() {
  const box = document.getElementById(EDITOR_FIELDS_ID);
  const title = document.getElementById(EDITOR_TITLE_ID);
  if (!box) return;
  box.textContent = '';

  const assignment = findAssignment(editingId);
  const cls = assignment ? findClass(assignment.classId) : null;
  if (title) {
    title.textContent = assignment && cls
      ? (assignment.name || 'Untitled assignment') + ' — ' + cls.name
      : 'Assignment';
  }
  if (!assignment || !cls) { paintAccommodationPrompt(null, ''); return; }

  const first = document.createElement('div');
  first.className = 'assign-field-row';
  first.append(textField(assignment, 'name', 'Name', true));
  first.append(pointsField(assignment));
  box.append(first);

  const second = document.createElement('div');
  second.className = 'assign-field-row';
  second.append(categoryField(assignment, cls));
  box.append(second);

  const third = document.createElement('div');
  third.className = 'assign-field-row';
  third.append(dateField(assignment, 'assigned'));
  third.append(dateField(assignment, 'due'));
  box.append(third);

  /* Last, and outside `box`, because the prompt is about the fields rather than one of them — it
     lives in its own host in index.html, under this panel and above the two hints. Painted from
     here so that every door into this editor gets it: Edit on a row, the Delete… that comes back,
     and the brand-new assignment createAssignment() writes before opening. */
  paintEditorSupports();
}

/* Opened through its own hook rather than data-modal-open, for the reason src/classes.js gives:
   the panel is filled from the document, and a modal that opens and then fills in flickers. */
export function openAssignmentEditor(id, opener) {
  if (!findAssignment(id)) return;
  editingId = id;
  showAssignmentError('');
  renderEditorFields();
  openModal(EDITOR_MODAL_ID, opener);
}

/*
  A NEW ASSIGNMENT, which is written to the document immediately and then opened for editing.

  There is no draft and no Save, which is this app's standing contract everywhere a teacher types
  (src/classes.js, src/categories.js, src/roster.js): a teacher interrupted mid-sentence must not
  lose what she typed because she never reached the bottom of a form. The cost is an "Untitled
  assignment" row if she closes the dialog without typing anything, and that is the right cost —
  it is visible, it is one Delete away, and the alternative loses work that was typed.
*/
export function createAssignment(opener) {
  const cls = getSelectedClass();
  const term = getSelectedTerm();
  if (!cls) return;
  if (!term) {
    /* Refused rather than written into nowhere: an assignment belongs to a term (the data model),
       and one filed under '' would be invisible on every term's list. The screen already says this
       in its empty state; saying it again here is for the teacher who got to the button first. */
    announce(cls.name + ' has no terms yet, so there is nowhere to file an assignment. Add a term '
      + 'from the class manager first.');
    return;
  }

  const cats = categoriesOf(cls);
  /* Both dates start on today, and this is the ONE place in this file that puts a value in a date
     field the teacher did not type (decision 1). It is a starting point in the same sense
     DEFAULT_POINTS is: it is what she almost always means, and every other value — including empty
     — survives being typed over it. Through todayISO() rather than a local `new Date()`, because
     that function is built from the LOCAL calendar fields and an assignment written down at eight
     on an October evening must not be filed as tomorrow's. */
  const today = todayISO();
  const assignment = {
    id: newId('a'),
    classId: cls.id,
    termId: term.id,
    /* The first category, or none — never a guess at a better one. A class with no categories can
       still hold work; the list shows it under "Not in a category" and says what that costs. */
    categoryId: cats.length ? cats[0].id : '',
    name: '',
    points: DEFAULT_POINTS,
    assigned: today,
    due: today,
  };
  update((doc) => {
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    doc.assignments.push(assignment);
  });

  editingId = assignment.id;
  showAssignmentError('');
  renderAssignments();
  renderEditorFields();
  openModal(EDITOR_MODAL_ID, opener);
  /* The dates are said because they were WRITTEN. Everything this app puts in a field on the
     teacher's behalf is announced with it — a default nobody said out loud is a value a
     screen-reader user finds out about later, from a list she did not expect to read a date on. */
  announce('Added an assignment to ' + cls.name + ', worth ' + DEFAULT_POINTS
    + ' points, assigned and due today. Name it.');

  /* Focus the name after the fields are in the document, for the reason src/classes.js's
     renderClassList() gives: an input that is not yet in the page cannot take focus, and on iPadOS
     a focus() that misses is a software keyboard that never appears. */
  const box = document.getElementById(EDITOR_FIELDS_ID);
  const field = box && box.querySelector('.assign-field-input');
  if (field) { field.focus(); field.select(); }
}

/*
  A field being typed. Called from src/shell.js's `input` listener, so it fires per keystroke and
  the store's debounce is what turns that into one save (src/store.js).

  THE FIELD IS NOT RE-RENDERED — replacing the input the teacher is typing into would take the
  caret with it, which is the rule src/classes.js's editTermField() states — but the LIST behind
  the dialog is, because the name, the points and the dates are all on it and a row that lags the
  field being typed into reads as the app not having taken the change.
*/
export function editAssignmentField(input) {
  const id = input.getAttribute('data-assignment-id');
  const field = input.getAttribute('data-assignment-field');
  const assignment = findAssignment(id);
  if (!assignment) return;
  if (field !== 'name' && field !== 'points' && field !== 'assigned' && field !== 'due') return;

  if (field === 'points') {
    /*
      Stored exactly as typed, including 0 — decision 2 in the header, and half of this work
      order's first acceptance line. An empty field reads as 0, which is Number('') and is what a
      teacher between two numbers means for the second she is between them; a field mid-way
      through a number reports '' too, so there is no state in which this stores NaN. Nothing is
      clamped and nothing is refused.
    */
    const n = Number(input.value);
    if (!Number.isFinite(n)) return;
    update(() => { assignment.points = n; });
  } else {
    const value = input.value;
    update(() => { assignment[field] = value; });
  }

  showAssignmentError('');
  const title = document.getElementById(EDITOR_TITLE_ID);
  const cls = findClass(assignment.classId);
  if (title && cls) {
    title.textContent = (assignment.name || 'Untitled assignment') + ' — ' + cls.name;
  }
  renderAssignments();
}

/*
  Clearing a date on iPadOS, which is a WebKit quirk found on the hardware rather than here, and
  the third field in this app to need the same answer — src/classes.js's termDateCommitted() holds
  the long version and src/roster.js's supportDateCommitted() points at it.

  Short version: the date popover keeps its own selection separate from the input's value, so a
  cleared field still has the old day highlighted and tapping that day again fires nothing. The
  field is thrown away and rebuilt; a fresh element has no picker state.

  ON `change`, NEVER ON `input`: a desktop date field reports '' several times while a date is
  being typed, and rebuilding on those would replace the element under the caret.
*/
export function assignmentDateCommitted(input) {
  const id = input.getAttribute('data-assignment-id');
  const field = input.getAttribute('data-assignment-field');
  if (field !== 'assigned' && field !== 'due') return;
  if (input.value) return;
  const assignment = findAssignment(id);
  if (!assignment) return;

  /* Written here as well as in editAssignmentField(), for the browser that commits a picker change
     without an `input` event first. The write is conditional and the rebuild is not, which is the
     right way round: by the time `change` fires the `input` listener has usually stored the ''
     already, so testing before REBUILDING would skip the rebuild in the exact case it exists for. */
  if (assignment[field]) update(() => { assignment[field] = ''; });
  const wrap = input.closest('.assign-field');
  if (wrap) wrap.replaceWith(dateField(assignment, field));
  renderAssignments();
}

/*
  MOVING AN ASSIGNMENT BETWEEN CATEGORIES — half of this work order's second acceptance line, and
  the half that exists today. The other half ("and the grade updates") names a displayed grade,
  and there is none in this app until WO-3.4 computes one and WO-3.5 draws it.

  It is one `<select>` and one write. What it deliberately does NOT do is touch `scores`: the score
  column is keyed by assignment id (docs/data-model.md), so work that moves between categories
  carries every score with it and nothing has to be copied or repaired. That is the whole reason
  this is safe to offer at all.
*/
export function setAssignmentCategory(select) {
  const id = select.getAttribute('data-assignment-category');
  const assignment = findAssignment(id);
  const cls = assignment ? findClass(assignment.classId) : null;
  if (!assignment || !cls) return;

  const want = select.value;
  /* A category from THIS class or nothing at all. The empty string is a real answer — an
     assignment can legitimately be unfiled — but an id belonging to another class is not, and
     refusing it here is the guard this work order's Traps line asks for, at the one control that
     could otherwise write one. */
  if (want && !findCategory(cls, want)) return;
  if ((assignment.categoryId || '') === want) return;

  const cat = want ? findCategory(cls, want) : null;
  update(() => { assignment.categoryId = want; });
  showAssignmentError('');
  renderAssignments();

  /*
    AND THE ACCOMMODATION PROMPT MOVES WITH THE PICKER (WO-3.8). This is the line that work order's
    brief names as the one to get wrong: a summary computed once when the dialog opened and left
    standing while the teacher changes the category is worse than no summary at all, because it is
    read as current — "3 students have extended time" over a homework assignment is a sentence the
    app made up. Recomputed here rather than by re-rendering the fields, for the reason
    editAssignmentField() gives: rebuilding this dialog's controls would replace the <select> the
    teacher just used, and on iPadOS that closes the wheel under her finger.
  */
  const applies = paintEditorSupports();

  /*
    SAID OUT LOUD AS A POINTER AND NEVER AS THE SENTENCE ITSELF, and the asymmetry with the screen
    is deliberate. The prompt on screen is a disclosure the teacher opened a dialog to see; the live
    region is read aloud, in a room, to whoever is near the iPad — so what is announced is that
    something applies here, and the counts and the kinds stay on the glass. That is the rule
    src/roster.js's toggleSupports() and src/presentation.js both state: announce that support
    details are showing, never a word of what they say.

    Announced HERE and not when the dialog opens, because an announcement exists for a change a
    screen-reader user cannot see happen. On open, the prompt is new content in a dialog she is
    about to read; on a category change it is a block rewritten behind her while the focus is on a
    picker, and nothing else would say so.
  */
  announce((assignment.name || 'That assignment') + ' now counts in '
    + (cat ? (cat.name || 'that category') + ', worth ' + formatWeight(Number(cat.weight) || 0)
      + ' percent of the grade' : 'no category, so nothing counts it') + '.'
    + (applies ? ' Accommodations apply to work in this category — this dialog says which.' : ''));
}

/* Reorder, inside the group the row is drawn in. Swaps with the neighbour, exactly as
   src/classes.js's moveClass() and src/categories.js's moveCategory() do, and says the new
   position out loud — reordering a list is a change a screen-reader user cannot see happen. */
function moveAssignment(id, delta) {
  const doc = getDoc();
  const assignment = findAssignment(id);
  if (!doc || !assignment) return;
  const siblings = siblingsOf(assignment);
  const at = siblings.indexOf(assignment);
  const swapWith = siblings[at + delta];
  if (at === -1 || !swapWith) return;

  const all = assignmentsIn(doc);
  const a = all.indexOf(assignment);
  const b = all.indexOf(swapWith);
  update(() => { all[a] = swapWith; all[b] = assignment; });
  renderAssignments();
  announce((assignment.name || 'That assignment') + ' is now ' + (at + delta + 1) + ' of '
    + siblings.length + ' in its category.');
}

export function moveAssignmentUp(id) { moveAssignment(id, -1); }
export function moveAssignmentDown(id) { moveAssignment(id, 1); }

/* ────────────────────────────── duplicating ────────────────────────────── */

/*
  WHY THE COPY CHOOSES ITS OWN CATEGORY AND TERM RATHER THAN CARRYING THE SOURCE'S.

  Ids are opaque and belong to the class they were made in. A copy that kept `categoryId` would
  land in another class filed under a category that class does not have — invisible on its list,
  counted by nothing, and destroyed by a category removal in the class it came from, under a dialog
  naming a different class. That is this work order's named trap, and this function is where it
  would have happened.

  So the target's category is matched BY NAME — "Quizzes" in Biology I is "Quizzes" in Biology I
  P4, which is exactly why the owner teaches the same content twice — and when there is no match,
  the copy arrives unfiled and the dialog says so before she agrees to it. Never a silent guess at
  the nearest thing.
*/
function matchCategory(target, sourceCategory) {
  if (!sourceCategory) return '';
  const want = String(sourceCategory.name || '').trim().toLowerCase();
  if (!want) return '';
  const hit = categoriesOf(target)
    .filter((c) => String(c.name || '').trim().toLowerCase() === want)[0];
  return hit ? hit.id : '';
}

function firstTermId(cls) {
  const terms = getTerms(cls ? cls.id : '');
  return terms.length ? terms[0].id : '';
}

/* What the dialog proposes for one target class, recomputed whenever the target changes. Copying
   into the SAME class keeps the term and the category it already has; copying elsewhere starts
   from that class's first term and the name match above. */
function proposeCopyInto(classId) {
  const source = findAssignment(copyId);
  const target = findClass(classId);
  if (!source || !target) return;
  copyClassId = classId;
  if (classId === source.classId) {
    copyTermId = source.termId;
    copyCategoryId = source.categoryId || '';
  } else {
    copyTermId = firstTermId(target);
    copyCategoryId = matchCategory(target, findCategory(findClass(source.classId), source.categoryId));
  }
}

function renderCopyClasses() {
  const box = document.getElementById(COPY_CLASSES_ID);
  if (!box) return;
  box.textContent = '';
  /* Active classes only, and `.pill`s in the shape src/letter-scale.js's subject row uses. An
     archived class is one the teacher has put away, and offering to copy work into one is offering
     to file it somewhere she cannot see. */
  getActiveClasses().forEach((cls) => {
    const on = cls.id === copyClassId;
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'pill' + (on ? ' active' : '');
    pill.setAttribute('data-assignment-copy-class', cls.id);
    pill.setAttribute('aria-pressed', on ? 'true' : 'false');
    /* textContent, not innerHTML: a class name is typed by a teacher. */
    pill.textContent = cls.name;
    box.append(pill);
  });
}

/*
  One <select> in the duplicate dialog, and the rule it exists to keep: THE CONTROL SHOWS WHAT THE
  PROPOSAL HOLDS, never something else.

  A <select> with no option marked `selected` displays its first one, so a proposal of "no category"
  against a target class that HAS categories drew “Homework — 25%” while the copy was filed under
  nothing — the teacher read the dialog, tapped Copy into Period 2, and found the row under the red
  “Not in a category” banner. The same gap breaks the note's own instruction from the other side:
  the option a select is already displaying fires no `change` when it is tapped, so “Pick one above”
  was unreachable for exactly the option it pointed at. An unmatched proposal therefore gets a real
  option of its own, at the top, selected — which is categoryField()'s answer above, arrived at for
  the same reason, and the two must not disagree. It appears only while the proposal is unmatched,
  so it cannot be chosen back into by accident once a category has been picked.
*/
function copySelect(hook, label, options, selected, emptyLabel, chooseLabel) {
  const wrap = fieldWrap(label, true);
  const select = document.createElement('select');
  select.className = 'assign-field-select';
  select.setAttribute(hook, '');
  if (!options.length) {
    const none = document.createElement('option');
    none.value = '';
    none.textContent = emptyLabel;
    select.append(none);
    select.disabled = true;
  } else if (!options.some((opt) => opt.value === selected)) {
    const none = document.createElement('option');
    none.value = '';
    none.textContent = chooseLabel;
    none.selected = true;
    select.append(none);
  }
  options.forEach((opt) => {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.label;
    if (opt.value === selected) el.selected = true;
    select.append(el);
  });
  wrap.append(select);
  return wrap;
}

function renderCopyFields() {
  const box = document.getElementById(COPY_FIELDS_ID);
  if (!box) return;
  box.textContent = '';
  const target = findClass(copyClassId);
  if (!target) return;

  const row = document.createElement('div');
  row.className = 'assign-field-row';

  const nameWrap = fieldWrap('Name of the copy', true);
  const name = document.createElement('input');
  name.className = 'assign-field-input';
  name.type = 'text';
  name.value = copyName;
  name.setAttribute('data-assignment-copy-name', '');
  name.setAttribute('autocomplete', 'off');
  nameWrap.append(name);
  row.append(nameWrap);
  box.append(row);

  const second = document.createElement('div');
  second.className = 'assign-field-row';
  second.append(copySelect('data-assignment-copy-term', 'Term',
    getTerms(target.id).map((t) => ({ value: t.id, label: t.label || 'Untitled term' })),
    copyTermId, target.name + ' has no terms yet', '— choose a term —'));
  second.append(copySelect('data-assignment-copy-category', 'Category',
    categoriesOf(target).map((c) => ({
      value: c.id,
      label: (c.name || 'Untitled category') + ' — ' + formatWeight(Number(c.weight) || 0) + '%',
    })),
    copyCategoryId, target.name + ' has no categories yet', '— choose a category —'));
  box.append(second);
}

function renderCopy() {
  const source = findAssignment(copyId);
  const sourceClass = source ? findClass(source.classId) : null;
  const target = findClass(copyClassId);
  const lead = document.getElementById(COPY_LEAD_ID);
  const note = document.getElementById(COPY_NOTE_ID);
  const button = document.getElementById(COPY_BTN_ID);
  if (!source || !sourceClass) return;

  if (lead) {
    lead.textContent = 'Copying “' + (source.name || 'Untitled assignment') + '” from '
      + sourceClass.name + '. It is worth ' + plural(pointsOf(source), 'point', 'points')
      + ', and the copy arrives with no scores on it — that is the point of copying it rather '
      + 'than the cost.';
  }
  renderCopyClasses();
  renderCopyFields();

  if (note) {
    const cats = target ? categoriesOf(target) : [];
    const terms = target ? getTerms(target.id) : [];
    if (!target) note.textContent = 'Choose a class for the copy.';
    else if (!terms.length) {
      note.textContent = target.name + ' has no terms, and an assignment belongs to one. Add a '
        + 'term to it from the class manager first.';
    } else if (!copyCategoryId) {
      note.textContent = cats.length
        ? 'Nothing in ' + target.name + ' is called “'
          + ((findCategory(sourceClass, source.categoryId) || {}).name || 'that category')
          + '”, so the copy is not filed under a category yet. Pick one above, or file it later '
          + 'from its own row — a category id belongs to the class it was made in and is never '
          + 'carried across.'
        : target.name + ' has no grading categories yet, so the copy will land in none. It will '
          + 'sit on the list and count for nothing until you give it one.';
    } else {
      note.textContent = 'The dates come across as they are. Nothing about the copy is settled by '
        + 'making it — it is an ordinary assignment in ' + target.name + ' the moment it exists.';
    }
  }
  if (button) {
    const terms = target ? getTerms(target.id) : [];
    button.disabled = !target || !terms.length;
    button.textContent = target ? 'Copy into ' + target.name : 'Make the copy';
  }
}

export function openCopyEditor(id, opener) {
  const source = findAssignment(id);
  if (!source) return;
  copyId = id;
  copyName = source.name || '';
  proposeCopyInto(source.classId);
  renderCopy();
  openModal(COPY_MODAL_ID, opener);
}

export function setCopyClass(classId) {
  if (!findClass(classId)) return;
  proposeCopyInto(classId);
  renderCopy();
}

export function setCopyTerm(select) {
  copyTermId = select.value;
  renderCopy();
}

export function setCopyCategory(select) {
  copyCategoryId = select.value;
  renderCopy();
}

/* The name is read as it is typed and the panel is NOT re-rendered for it, for the reason
   editAssignmentField() gives: rebuilding the fields would take the caret out of the one being
   typed into. Nothing is written to the document here — this is a proposal until the button. */
export function setCopyName(input) { copyName = input.value; }

/*
  The copy itself, and the only line in this section that writes anything.

  A NEW ID, THE TARGET'S OWN classId / termId / categoryId, AND NO SCORES. `scores` is keyed by
  assignment id (docs/data-model.md), so a fresh id has no column and there is nothing to avoid
  copying — the absence is structural rather than something this function remembers not to do.
  That is this work order's third acceptance line, and it is true by construction.
*/
export function confirmCopy() {
  const source = findAssignment(copyId);
  const target = findClass(copyClassId);
  if (!source || !target) { closeModal(COPY_MODAL_ID); return; }
  if (!getTerms(target.id).some((t) => t.id === copyTermId)) return;
  const category = copyCategoryId && findCategory(target, copyCategoryId) ? copyCategoryId : '';

  const copy = {
    id: newId('a'),
    classId: target.id,
    termId: copyTermId,
    categoryId: category,
    name: copyName,
    points: source.points,
    /* THE SOURCE'S DATES EXACTLY AS THEY ARE, AND DELIBERATELY NOT TODAY. WO-3.17 gives a new
       assignment today in both fields; this is the other creation path in this file and it was
       weighed against that one rather than left unconsidered. Two reasons it goes the other way.
       The dialog above tells the teacher in words that "the dates come across as they are" before
       she taps the button, and a control that quietly re-dated its copy would be contradicting its
       own printed promise — the same fault the hint in index.html was carrying and that work order
       fixed. And a copy that dropped a due date the teacher had already set is a form to fill in
       twice, which is the cost this control exists to remove. Blank in the source stays blank. */
    assigned: source.assigned,
    due: source.due,
  };
  update((doc) => {
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    doc.assignments.push(copy);
  });

  copyId = '';
  closeModal(COPY_MODAL_ID);
  renderAssignments();
  announce('Copied ' + (copy.name || 'the assignment') + ' into ' + target.name
    + ' with no scores on it.');
}

/* No. Nothing has been written, so there is nothing to undo — which is the point of proposing
   before writing rather than writing and offering an undo. */
export function cancelCopy() {
  copyId = '';
  closeModal(COPY_MODAL_ID);
  announce('Nothing was copied.');
}

/* ────────────────────────────── deleting ────────────────────────────── */

/*
  IT ASKS EVERY TIME, INCLUDING WHEN NOTHING IS FILED UNDER IT, and that is where this departs from
  src/categories.js's removeCategory() one level up — that one removes a category holding nothing
  on the tap. A category is a container and an empty one destroys nothing; an assignment IS the
  work, so one with no scores on it is still a name, a mark out of, a category and two dates the
  teacher would have to type again. The count in the dialog is about the scores; the dialog itself
  is about the assignment.

  (That also answers design/mockups/README.md's open question 8 — "the removal confirm counts data,
  not effort" — in the conservative direction, for this surface only. It says nothing about the
  category confirm, which is a different question about a different thing.)
*/
export function openAssignmentDelete(id, opener) {
  /* An empty value means "the one the editor is open for", which is what the Delete… button inside
     the editor carries; a row's own button carries its id. */
  const wanted = id || editingId;
  const assignment = findAssignment(wanted);
  const cls = assignment ? findClass(assignment.classId) : null;
  if (!assignment || !cls) return;
  pendingDeleteId = wanted;

  const scores = scoreCount(assignment.id);
  const lead = document.getElementById(DELETE_LEAD_ID);
  if (lead) {
    lead.textContent = 'Deleting “' + (assignment.name || 'this assignment') + '” from '
      + cls.name + ' removes it and every score on it. This cannot be undone, and a backup file '
      + 'is the only way back.';
  }
  const facts = document.getElementById(DELETE_FACTS_ID);
  if (facts) {
    facts.textContent = '';
    factLine(facts, scores
      ? plural(scores, 'score', 'scores') + ' entered on it'
      : 'No scores have been entered on it yet.');
    const cat = findCategory(cls, assignment.categoryId);
    factLine(facts, plural(pointsOf(assignment), 'point', 'points') + ' in '
      + (cat ? (cat.name || 'an untitled category') : 'no category'));
  }
  const button = document.getElementById(DELETE_BTN_ID);
  if (button) button.textContent = 'Delete ' + (assignment.name || 'this assignment');

  openModal(DELETE_MODAL_ID, opener);
}

function factLine(parent, text) {
  const el = document.createElement('div');
  el.className = 'class-delete-line';
  el.textContent = text;
  parent.append(el);
}

/*
  Yes. The only lines in this module that destroy anything, and they destroy exactly what the
  dialog listed: the assignment and its score column. Nothing else in the document mentions an
  assignment id, so there is nothing else to prune — and the class, the category and the term it
  was filed under are untouched.
*/
export function confirmAssignmentDelete() {
  const assignment = findAssignment(pendingDeleteId);
  const cls = assignment ? findClass(assignment.classId) : null;
  const id = pendingDeleteId;
  pendingDeleteId = '';
  closeModal(DELETE_MODAL_ID);
  if (!assignment || !cls) return;

  const name = assignment.name || 'the assignment';
  const scores = scoreCount(id);
  update((doc) => {
    if (doc.scores) delete doc.scores[id];
    doc.assignments = assignmentsIn(doc).filter((a) => a.id !== id);
  });

  /* The editor may be open on the row that has just gone — the Delete… inside it is one of the two
     doors here — so it is closed rather than left describing work that no longer exists. */
  if (editingId === id) {
    editingId = '';
    closeModal(EDITOR_MODAL_ID);
  }
  renderAssignments();
  announce('Deleted ' + name + ' from ' + cls.name + ', with '
    + plural(scores, 'score', 'scores') + '.');
}

export function cancelAssignmentDelete() {
  pendingDeleteId = '';
  closeModal(DELETE_MODAL_ID);
  announce('Nothing was deleted.');
}
