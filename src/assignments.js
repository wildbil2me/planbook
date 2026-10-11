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
  filed under a category that only class A has — listed on B's screen under "Not in a category",
  and filed nowhere B can name (that group gathers every id B lacks), counted by nothing if B is
  weighted (a B graded on total points counts it, under "no category"), and caught up by a category
  removal in A under a dialog naming A — destroyed there until WO-3.43, re-filed under no category
  since, which is the same wrong class's work moved by a dialog that never named it. (WO-3.1's
  applyRemoval() took the assignments and their score columns with the category; since WO-3.43 it
  takes neither, and clears each one's `categoryId` to ''.) So the copy below chooses the
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
     term dates — so clearing one must not re-fill it (assignmentDateCleared() below rebuilds the
     field from the assignment, which is what makes that true rather than remembered). The default
     is a CREATION-time default, so an assignment being EDITED is never touched: open a two-year-old
     assignment with a blank Due and it opens blank. And each COPY's assigned and due dates START on
     its source's and are the teacher's to change per class (WO-3.48 for the due date, WO-3.49 for
     the assigned one) — the duplicate dialog's own rule and not this one, and never today;
     confirmCopy() says why beside it.

     The clock is read in exactly two places in this file, and both of them are today: that default,
     and the overdue TINT below, which changes no stored value and marks no student.

     AND ONE THING SINCE WO-3.50 THAT LOOKS LIKE A FOURTH SURVIVOR BROKEN AND IS NOT. When the editor
     closes after a date was changed, a blank due date takes the ASSIGNED date (the owner's ruling 3)
     and the due date then picks the term. That is a date the teacher typed, copied to the field beside
     it at the close — never today, never on a keystroke, and never into a field she is looking at:
     a cleared field still rebuilds blank and stays blank for as long as the editor is open. The
     section "the due date picks the term" below holds the rule; the clock is still read in two places.

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

  4. NOTHING IS SORTED BEHIND HER BACK. The list renders in the order the document holds, grouped by
     the class's own category order, exactly as src/roster.js renders a roster and src/classes.js
     renders terms. The teacher's ↑ ↓ are the only thing that changes THAT order — sorting by due
     date behind her back would be a second opinion about an order she can see and rearrange.
     SINCE WO-3.55 SHE CAN ASK FOR ONE, and it is a view and never a write: a tap on a column heading
     sorts a COPY of each group for drawing, the document's array is not touched, `rev` does not move,
     and the Scores grid — which reads its columns from that array — never knows. The section "the
     sort" below holds the rules; the ↑ ↓ rest while it is on, because an arrow that moved a row in
     an order nobody can see would be exactly the second opinion this paragraph refuses.

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
   import runs one way: nothing in src/classes.js knows this file exists.

   WHICH TERM A DATE IS IN comes from there too, for the copy dialog (WO-3.49): a copy goes into the
   term of its own class that holds its due date, the way the school's SIS files work. src/classes.js
   owns `terms[]` and already answers that question for the register, and a second date predicate here
   is the copy its own section header refuses (WO-2.50).

   AND FOR THE ASSIGNMENT ITSELF SINCE WO-3.50: the editor files work under the term holding its due
   date, through the same termContaining() and nothing of its own. selectTerm() is how the list
   follows a moved row onto the term it went to — the term strip's own writer, so the list, the strip
   in the header and the score grid all move together rather than this file keeping a fourth opinion
   about which term is on screen. */
import { getSelectedClass, getSelectedTerm, getActiveClasses, getTerms,
  termContaining, outOfTermGap, termIsDated, termName, selectTerm } from './classes.js';
/* The category list and the way a weight is written down. src/categories.js is a leaf and imports
   nothing back, which is what lets both this file and src/classes.js wear it. */
import { categoriesOf, formatWeight } from './categories.js';
/* How the class is graded, asked of the one reader of the key (WO-3.34) — and nothing else from the
   engine. This screen says what a category or its absence does to the grade — in three notices, the
   picker's announcement, and the weight beside every category name — and in a class graded on total
   points most of that was false: uncategorized work counts there, an empty category has no weight
   to share, and no weight is part of the grade. src/grade-engine.js imports src/categories.js and nothing
   that reaches back here, so this closes no loop. */
import { gradingModeOf, isHeld } from './grade-engine.js';
/* HOLDING A COLUMN OUT OF THE GRADE (WO-3.46). The editor's checkbox asks isHeld() above for its
   state — never the key — and hands every change to that module: the confirm that shows which grades
   move, and the two writers. This file writes no `held`, `heldAt` or `committedAt` of its own, which
   is what tools/wo-sweep.mjs § 30 holds it to. That module imports src/scores.js and nothing that
   reaches back here, so no loop closes. */
import { holdColumn, commitColumn, openHoldConfirm } from './held-column.js';
/* What today is, and this is the ONE thing in this file that reads a clock. Imported rather than
   re-derived for the reason src/home.js imports the same function: two answers to "what day is it"
   is how a screen and a record end up disagreeing about a date, and src/attendance.js's todayISO()
   is built from the local calendar fields precisely so that an evening in October is not tomorrow.
   Used in exactly two places, both of them today: the creation-time default both dates arrive on,
   and the overdue tint — see decision 1. */
import { todayISO } from './attendance.js';
/* How a due date reads on this list — `Sep 8`, and `—` where there is no date to read. Imported
   rather than kept locally since WO-3.20: this file used to carry its own copy, and the comment
   above that copy argued the registry's `9/8` was a second format rather than a second opinion. That
   argument is still true about the format and was overruled about the copy — there were five
   functions called shortDate() in src/ by then, and a name that means three things is how a future
   screen renders `9/4` beside a `Sep 4` in good faith. src/date-text.js is a leaf that imports
   nothing and reads no clock, so this is not a second thing in this file that looks at today. */
import { shortDate } from './date-text.js';
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
/* The second half of the hint's sentence about an empty category (WO-3.54, ruling 7), which differs
   by grading mode — see paintHintEmpty(). */
const HINT_EMPTY_ID = 'assignmentsHintEmpty';

const EDITOR_TITLE_ID = 'assignmentModalTitle';
const EDITOR_FIELDS_ID = 'assignmentFields';
const EDITOR_ERROR_ID = 'assignmentError';
const EDITOR_CREATE_CANCEL_ID = 'assignmentCreateCancel';
const EDITOR_DELETE_DOOR_ID = 'assignmentDeleteDoor';
const EDITOR_COPY_DOOR_ID = 'assignmentCopyDoor';

const COPY_TITLE_ID = 'assignmentCopyTitle';
const COPY_LEAD_ID = 'assignmentCopyLead';
const COPY_FIELDS_ID = 'assignmentCopyFields';
const COPY_LIST_ID = 'assignmentCopyList';
const COPY_NOTE_ID = 'assignmentCopyNote';
const COPY_BTN_ID = 'assignmentCopyBtn';

const MOVE_MODAL_ID = 'assignmentMoveModal';
const MOVE_TITLE_ID = 'assignmentMoveTitle';
const MOVE_LEAD_ID = 'assignmentMoveLead';
const MOVE_FACTS_ID = 'assignmentMoveFacts';
const MOVE_BTN_ID = 'assignmentMoveBtn';
const MOVE_KEEP_ID = 'assignmentMoveKeep';
const EDITOR_TERM_NOTE_ID = 'assignmentTermNote';
const LIST_NOTE_ID = 'assignmentsMoved';

/*
  WHAT AN ASSIGNMENT WITH NO NAME IS CALLED (WO-3.56) — a fact, not a fallback string. Every reader in
  this file draws a nameless assignment under these words, and since WO-3.56 they are also the name
  one TAKES: opened to edit or to duplicate (the owner's ruling 2), or closed with the name field blank
  (ruling 5). So the words on screen before and after the write are the same words, and they live
  here once. Exported for the readers in other modules that each keep a quoted copy today
  (src/calendar-derived.js's UNTITLED, src/glance.js's UNTITLED_ASSIGNMENT and the rest) — moving
  them onto this one is a follow-up that work order left out of its scope, not a thing done here.
*/
export const UNTITLED_ASSIGNMENT = 'Untitled assignment';

/* Blank is blank with whitespace in it (the owner's rulings 1 and 4): a name of only spaces draws as
   nothing on every row it is on, so it is refused, and named, exactly as an empty one is. */
function nameIsBlank(name) { return !String(name == null ? '' : name).trim(); }

/* The owner's sentence for ruling 5, word for word. It says "Edit it", not "Tap Edit", because
   WO-3.54 takes the Edit button away and the name opens the editor instead. */
const NAMELESS_WARNING = '“' + UNTITLED_ASSIGNMENT + '” was saved without a name. Edit it to give it '
  + 'a name.';

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
/* Set only for the assignment made by the currently open create flow. An explicit Cancel removes
   it; every ordinary dismissal keeps it, preserving this app's no-lost-draft rule. Opening any row
   through its name (the Edit button's door until WO-3.54) clears the marker, so an assignment that
   has once been accepted is never mistaken for a pending create. */
let creatingId = '';
let copyId = '';
let pendingDeleteId = '';

/* The control that opened the current create flow — `+ New assignment` on the list or on the score
   grid, both of which survive the dialog (src/scores.js says why). Kept so that the create door below
   can hand focus back to it when the copy dialog it opens is dismissed: the door itself sits in an
   editor that has closed by then. */
let createOpener = null;

/* What the duplicate dialog is currently proposing. It is a proposal and not a write: nothing here
   reaches the document until the teacher taps the button that names the classes it lands in.

   ONE ENTRY PER TICKED CLASS, EACH HOLDING ITS OWN PROPOSAL, AND NOTHING SHARED BETWEEN THEM
   (WO-3.48). `{ classId, categoryId, assigned, due, touched }`, kept in the class manager's order so
   the lines read the way the list is drawn. A category id belongs to the class it was made in, so a
   single value beside this list is exactly the leak that work order's Traps name: the last class
   ticked would overwrite what every other line is showing. Every setter below names the class it
   edits.

   NO TERM IS HELD HERE (WO-3.49, the owner's ruling 2). The due date decides the term, so a term id
   kept beside the dates would be a second answer to a question the dates already settle — and one
   that goes stale the moment a date is retyped. copyPlacement() derives it when the line is drawn
   and again inside confirmCopy(), from the values as they stand at that moment.

   `touched` is the follow rule's memory (ruling 6): one flag per field, set when the teacher edits
   that field on that line. A line whose flag is still clear follows the source's held value when it
   changes; a line she changed stays put. Dialog state only, and never written into the document.

   `copyName` is the one field that is NOT per target: one name, applied to every copy, as ruled. */
let copyTargets = [];
let copyName = '';
/* THE SOURCE'S HELD EDITS (WO-3.49, ruling 4). The source heads the list with its category and both
   dates as live fields, and what is typed there lands HERE and nowhere else until the confirm, which
   writes it in the same update() as the copies. Cancel, the ✕ and Escape drop it with everything else.
   `{ categoryId, assigned, due }`, starting as the document holds them, exactly — a stale category id
   is held as it is, so that opening the dialog never reads as a change. The editor's write-as-typed
   contract does not reach in here, on purpose: a source saved on input would survive the Cancel that
   is meant to undo it. */
let copySource = null;
/* Whether the dialog was opened from the create door rather than from a row's Duplicate. It decides
   the title and the lead, and nothing else since WO-3.49: neither door offers the source's own class
   any longer (the owner's ruling 7), because the source heads the list as a line of its own and a
   second copy in the same class is made with New. */
let copyFromCreate = false;

/*
  THE EDITOR'S SESSION (WO-3.50): the two dates the assignment held when the editor opened on it, and
  nothing else. `{ id, assigned, due }`, dialog state only and never written into the document.

  It is what makes ruling 5 true — EXISTING ASSIGNMENTS ARE NOT RE-FILED. The due date picks the term
  when the editor closes, but only an editor in which a date was CHANGED: one opened to fix a name, or
  opened and shut, closes exactly as it always has, however its dates and its term disagree. That is
  the whole of "no migration" — an old backup restores as it was, and a row from before this build
  keeps its term until a teacher next edits one of its dates. Compared by value rather than flagged on
  `input`, so a date typed and then typed back is no change, and so nothing about the dates is decided
  per keystroke (ruling 2).
*/
let editorDates = null;
/* The dates the editor last said no term holds, as one string. The first close on such dates stops
   and says so; a second close on the SAME dates is the teacher having read it, and closes. Typing a
   different date asks again. */
let unplacedSaid = '';
/* A scored move waiting on its confirm: the assignment's id and whether the list follows it. The
   plan itself is NOT held — the confirm works it out again from the dates as they stand, the same rule
   WO-3.49's Traps set for the copy dialog. */
let pendingMove = null;
/* The term the list was showing when a create moved it onto today's term (ruling 1), so that the
   editor's Cancel — "Nothing was added" — can put the list back where the teacher had it. */
let createdFromTermId = '';
/* THE LIST'S NOTE (WO-3.50, ruling 1 and Acceptance 2): `{ classId, termId, text }` — what moved onto
   the term on screen, and why. Since WO-3.56 it can also carry `nameless: true`, which is the warning
   that an assignment was closed with no name and took one (ruling 5), drawn in amber. A VIEW STATE: drawn only while that class and that term are the ones
   up, dropped the first time they are not, and never stored anywhere. */
let listNote = null;
/* THE SORT (WO-3.55): `{ classId, termId, column, reversed }`, or null for the teacher's order. A VIEW
   STATE held here and nowhere else — never in the document, never in `localStorage` (ruling 6). Keyed
   by class and term the way `listNote` is, so the first render of any other class or term drops it;
   src/shell.js's showClassScreen() clears it on every arrival, which is what makes leaving the list
   and coming back a return to the teacher's order. See "the sort" below. */
let listSort = null;
/* THE ORDER THE LIST HAD WHEN THE EDITOR OPENED (WO-3.55, ruling 9): id → position, set only while a
   sort is on, and held for exactly as long as the editor's session. editAssignmentField() repaints the
   list on every keystroke, so a sort read live would move rows about behind the dialog as she types a
   name or a date; this pins them, and endSession() lets go and repaints, which is "sorts again when
   it settles". */
let frozenRank = null;

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
  nothing in this file reads `v` as a number, and nothing in it can therefore accidentally become
  arithmetic. (Since WO-3.32 one key is skipped: a cell holding only a note — see noteOnly().)
*/
function enteredCount(assignment, cls) {
  const doc = getDoc();
  const column = doc && doc.scores ? doc.scores[assignment.id] : null;
  if (!column) return 0;
  return rosterOf(cls).filter((id) => Object.prototype.hasOwnProperty.call(column, id)
    && !noteOnly(column[id])).length;
}

/* A CELL THAT HOLDS NOTHING BUT A NOTE (WO-3.32) — `{ v: null, note }`, a blank the teacher wrote a
   sentence on. It is a key, and it is not an entry: counted, it would move this bar and take the
   overdue tint off a column on the strength of a note, which is the one thing a note must never do
   on any screen. So the count above skips it — the only place in this file that looks inside a cell,
   and it looks for the ABSENCE of a value and a flag rather than at a number, which is still not
   arithmetic. */
/* SINCE WO-3.33 IT IS ANY KEY WITH NO VALUE AND NO FLAG, which is the same test with the note
   requirement dropped: a cell that was revised and then cleared is kept as `{ v: null, at, was }`
   for its history (src/score-history.js), and it is no more an entry than a noted blank is. The
   name stays because the note was the first reason a blank kept its key. */
function noteOnly(cell) {
  if (!cell || typeof cell !== 'object' || Array.isArray(cell)) return false;
  const noValue = cell.v === null || cell.v === undefined;
  return noValue && !cell.flag;
}

function scoreCount(assignmentId) {
  const doc = getDoc();
  const column = doc && doc.scores ? doc.scores[assignmentId] : null;
  return column ? Object.keys(column).length : 0;
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

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

/*
  THE TWO ROW ICONS (WO-3.54, the owner's ruling 3): Duplicate is two offset squares and Delete is a
  bin. The shapes are the drawing's, design/mockups/assignments-tidy.html frame B, which are the
  header's own icon grammar — a 24-unit box, a 2.2 stroke in `currentColor`, round caps — so the row
  takes `.class-action-btn`'s ink and Delete takes `.delete`'s red hover with nothing restated here.
  ✎ is not used for anything on this row: on a roster row it opens the log sheet.

  Built with createElementNS rather than innerHTML, for the reason assignmentRow() gives below about
  names, and because an <svg> made by createElement is an unknown HTML element that draws nothing.
  This is the first SVG any module in src/ builds; every other icon in the app is markup in
  index.html. Kept as data — a tag and its attributes — so the two shapes read as the drawing's
  markup does and nothing here computes a coordinate.
*/
const SVG_NS = 'http://www.w3.org/2000/svg';
const COPY_ICON = [
  ['rect', { x: '9', y: '9', width: '13', height: '13', rx: '2', ry: '2' }],
  ['path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }],
];
const BIN_ICON = [
  ['polyline', { points: '3 6 5 6 21 6' }],
  ['path', { d: 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6' }],
  ['path', { d: 'M10 11v6' }],
  ['path', { d: 'M14 11v6' }],
  ['path', { d: 'M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2' }],
];
const ICON_FRAME = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2',
  'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false',
};

function setAll(el, attrs) {
  Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]));
  return el;
}

/* An icon row button: `.class-action-btn` and `.assign-row-btn` worn as-is, `.assign-icon-btn`
   squaring it round the glyph. Its words are its `aria-label`, naming the assignment, because the
   glyph says nothing to a screen reader; the `title` is a laptop's extra, and the hint under the list
   says in words what the two squares are, because a finger never shows a tooltip (ruling 7). */
function iconButton(shapes, hook, value, extraClass, title, ariaLabel) {
  const btn = actionButton('', hook, value, extraClass + ' assign-icon-btn');
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.setAttribute('aria-label', ariaLabel);
  btn.title = title;
  const svg = setAll(document.createElementNS(SVG_NS, 'svg'), ICON_FRAME);
  shapes.forEach((shape) => svg.append(setAll(document.createElementNS(SVG_NS, shape[0]), shape[1])));
  btn.append(svg);
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
/* THE BAR'S FIGURE, in one place since WO-3.55: what progressCell() draws and what the Entered sort
   orders by are this one reading — enteredCount() over the roster — so the order and the bar cannot
   drift apart. A second count for the sort is the second opinion that work order's Traps refuse. */
function coverageOf(assignment, cls) {
  const total = rosterOf(cls).length;
  const done = enteredCount(assignment, cls);
  return { done, total, share: total ? done / total : 0 };
}

function progressCell(row, assignment, cls) {
  const td = cell(row, '');
  const { done, total, share } = coverageOf(assignment, cls);

  const wrap = document.createElement('div');
  wrap.className = 'assign-progress';

  const bar = document.createElement('div');
  bar.className = 'assign-bar';
  const fill = document.createElement('div');
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
function assignmentRow(assignment, cls, index, siblings, sortedBy) {
  const row = document.createElement('tr');
  const label = assignment.name || 'this assignment';

  /*
    THE NAME IS THE WAY INTO THE EDITOR (WO-3.54, the owner's ruling 2), and the Edit button is gone.
    A real <button> holding the name — focusable, announced as a control, pressed by Enter and Space —
    that src/assignments.css styles to read as the name it is. It carries `data-assignment-edit`, the
    hook the Edit button carried, MOVED AND NOT RENAMED: src/shell.js routes it, and every check that
    opens the editor presses it. The focus ring is the browser's and nothing here or in the sheet
    takes it away to finish the look.
  */
  const name = cell(row, 'assign-name');
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'assign-name-btn';
  open.setAttribute('data-assignment-edit', assignment.id);
  open.setAttribute('aria-haspopup', 'dialog');
  open.title = 'Edit ' + label;
  open.textContent = assignment.name || UNTITLED_ASSIGNMENT;
  name.append(open);
  /* EXTRA CREDIT, in words. Beside the name's button and not inside it, so the button is called what
     the assignment is called. A lone 0 in the points column reads as a mistake somebody made; the
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
  /* WHILE A SORT IS ON THE ARROWS REST (WO-3.55, ruling 4), every one of them, and say why in the
     column's own name. An arrow would move a row in the order the document holds while the screen
     draws another — a tap whose effect nobody can see. ↺ Your order, in the Actions heading, is the
     way back to them. */
  if (sortedBy) {
    [up, down].forEach((btn) => {
      btn.disabled = true;
      btn.title = 'Sorted by ' + sortedBy + ' — tap Your order to move it';
    });
  }
  actions.append(up, down);

  /* Duplicate and Delete keep their hooks and their spoken labels; only their faces changed
     (WO-3.54, ruling 3). There is no Edit here any more — the name above is that door. */
  actions.append(iconButton(COPY_ICON, 'data-assignment-duplicate', assignment.id, 'assign-row-btn',
    'Duplicate into other classes', 'Duplicate ' + label + ' into other classes'));
  actions.append(iconButton(BIN_ICON, 'data-assignment-delete', assignment.id, 'delete assign-row-btn',
    'Delete', 'Delete ' + label));

  actionsCell.append(actions);
  return row;
}

/*
  A category's heading. `state` and `said` are for the two headings that carry a notice (WO-3.54,
  rulings 5 and 6): `state` is the state word src/assignments.css paints — `empty`, `unfiled`,
  `unfiled counted` — and `said` is the full sentence the boxed bar under the heading used to carry.
  NOTHING LIVES ONLY IN A TOOLTIP (ruling 7), so the sentence is hidden text inside the heading, read
  out with it, and the row's `title` is a laptop's extra on top: a `title` on a row is not reliably
  read, and a finger never shows one.
*/
function groupHead(title, chip, note, state, said) {
  const row = document.createElement('tr');
  row.className = 'assign-group-head' + (state ? ' ' + state : '');
  if (said) row.title = said;
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
  if (said) {
    const el = document.createElement('span');
    el.className = 'sr-only';
    /* The leading space keeps the sentence from running into the note when the two are read as one. */
    el.textContent = ' ' + said;
    wrap.append(el);
  }

  td.append(wrap);
  row.append(td);
  return row;
}

/*
  THE HINT'S SENTENCE ABOUT AN EMPTY CATEGORY (WO-3.54, ruling 7), in two halves. The first is markup
  and the same everywhere: a category with nothing in it yet does not count as a zero. The second is
  the owner's words in a weighted class — its weight is shared across the others — and in a class
  graded on total points it is ruling 5's points clause instead, because there the weight is not part
  of the grade and WO-3.34 ruled that that screen names no weight at all. index.html carries the
  weighted words, so the file a person reads says what the owner ruled.
*/
function paintHintEmpty(byPoints) {
  const el = document.getElementById(HINT_EMPTY_ID);
  if (!el) return;
  el.textContent = byPoints
    ? '— it adds nothing until something is in it.'
    : '— its weight is shared across the others until something is in it.';
}

/*
  THE NOTE OVER THE LIST WHEN WORK ARRIVED ON IT FROM ANOTHER TERM (WO-3.50). A row the due date moved
  — or a new assignment filed under today's term while another was on screen — must not simply turn
  up on a list the teacher did not choose: the list switched under her, and the note is the sentence
  that says so and why. Drawn only while the class and term it is about are the ones up; the first
  render on any other drops it, so going back to that term later does not bring back a note about a
  move she has long since read.
*/
function paintListNote(cls, termId) {
  const el = document.getElementById(LIST_NOTE_ID);
  if (listNote && !(cls && listNote.classId === cls.id && listNote.termId === termId)) listNote = null;
  if (!el) return;
  el.textContent = listNote ? listNote.text : '';
  el.classList.toggle('hidden', !listNote);
  /* THE AMBER MODIFIER (WO-3.56, ruling 5) is set for the nameless warning and for nothing else, and
     taken off on every paint that is not one — the element is reused, so a moved-work note drawn
     after a warning would otherwise inherit its amber. */
  el.classList.toggle('assign-moved-nameless', !!listNote && !!listNote.nameless);
}

/* ────────────────────────────── the sort (WO-3.55) ──────────────────────────────

   FIVE HEADINGS SORT WHAT IS UNDER EACH CATEGORY, AND THE CATEGORIES STAY WHERE THE TEACHER PUT THEM
   (the owner's rulings 1 and 2, 2026-10-10). "Not in a category" is a group like any other.

   A SORT IS A VIEW AND WRITES NOTHING (ruling 5), and this is the section most likely to break that
   without anyone noticing. The order a teacher sets with ↑ ↓ IS the array order in the year document,
   and the Scores grid reads its columns from that array (src/scores.js: "Nothing here sorts"). So
   inViewOrder() sorts a NEW array built from the group the painter was handed, and never the group
   itself, never `assignmentsIn(doc)` and never anything update() is given. An in-place `sort()` on the
   wrong array here reorders the year with no update() call at all — the save that carries it is the
   next unrelated keystroke — and the Scores grid rearranges from a heading tap on another screen.
   tools/verify/assignment-sort.mjs reads the stored record, the open document and the grid's columns
   after every tap, and was proved against both plants.

   NOT REMEMBERED (ruling 6): `listSort` above, keyed by class and term, cleared on every arrival.

   THE FIRST TAP GIVES THE USEFUL DIRECTION (ruling 3) — `first` below — the second reverses it and
   the third gives back the teacher's order. `first` is 1 for ascending and -1 for descending, which is
   also what `aria-sort` and the ▲ ▼ say: A→Z, soonest and fewest are ascending, largest is descending.
*/
const SORT_COLUMNS = {
  name: { label: 'Assignment', first: 1, words: ['A to Z', 'Z to A'] },
  points: { label: 'Points', first: -1, words: ['largest first', 'smallest first'] },
  assigned: { label: 'Assigned', first: 1, words: ['soonest first', 'latest first'] },
  due: { label: 'Due', first: 1, words: ['soonest first', 'latest first'] },
  entered: { label: 'Entered', first: 1, words: ['fewest entered first', 'most entered first'] },
};
const RESET_LABEL = '↺ Your order';
const SORT_HEAD_SEL = '#assignmentsView [data-assignment-sort]';
const RESET_CELL_SEL = '#assignmentsView .assign-col-reset';

/* NAMES COMPARE AS A READER WOULD (ruling 7): "Quiz 2" before "Quiz 10", and "quiz" beside "Quiz".
   What is compared is what the row DRAWS — a nameless assignment sorts as the words it is shown under. */
const NAME_ORDER = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/* The sort that applies to this class and term, or null. Asked rather than read off `listSort`, so a
   state left from another class or term can never order this one even for a paint. */
function activeSort(cls, termId) {
  return listSort && cls && listSort.classId === cls.id && listSort.termId === termId
    ? listSort : null;
}

/* Two assignments in one column's order, before the tie-break. `dir` is 1 or -1. A BLANK DATE SORTS
   LAST IN BOTH DIRECTIONS (ruling 7): it is answered before the direction is applied, because a blank
   is not an early date or a late one — it is a date nobody has typed, and reversing the list must not
   put it at the top. */
function compareIn(column, dir, a, b, cls) {
  if (column === 'assigned' || column === 'due') {
    const x = dateOf(a[column]);
    const y = dateOf(b[column]);
    if (!x || !y) return (x ? 0 : 1) - (y ? 0 : 1);
    return dir * (x < y ? -1 : x > y ? 1 : 0);
  }
  if (column === 'name') {
    return dir * NAME_ORDER.compare(a.name || UNTITLED_ASSIGNMENT, b.name || UNTITLED_ASSIGNMENT);
  }
  if (column === 'points') return dir * (pointsOf(a) - pointsOf(b));
  /* Entered: the bar's own figure (coverageOf()), so a held column sorts by its own count like any
     row (ruling 8) — nothing here asks isHeld(), because the bar does not. */
  return dir * (coverageOf(a, cls).share - coverageOf(b, cls).share);
}

/*
  ONE GROUP IN THE ORDER THE SCREEN DRAWS IT. With no sort on, the group itself — the document's
  order. With one on, a NEW array: the group is decorated with each row's position, sorted, and
  undecorated, and the position is the tie-break, so EQUAL KEYS KEEP THE TEACHER'S ORDER (ruling 7)
  whatever the engine's sort happens to do with ties.

  WHILE THE EDITOR IS OPEN THE ORDER IS THE ONE IT HAD WHEN IT OPENED (ruling 9, the owner,
  2026-10-11): `frozenRank` stands in for the comparator, so a name or a date typed behind the dialog
  moves no row. An id the snapshot does not know — none is expected — keeps its place after the rest.
*/
function inViewOrder(group, cls, sort) {
  if (!sort) return group;
  const dir = SORT_COLUMNS[sort.column].first * (sort.reversed ? -1 : 1);
  const rank = frozenRank;
  const at = (a) => (rank && rank.has(a.id) ? rank.get(a.id) : Infinity);
  return group.map((a, i) => ({ a, i }))
    .sort((x, y) => (rank
      ? (at(x.a) === at(y.a) ? 0 : at(x.a) < at(y.a) ? -1 : 1)
      : compareIn(sort.column, dir, x.a, y.a, cls)) || x.i - y.i)
    .map((d) => d.a);
}

/* The snapshot ruling 9 holds while the editor is open: the order the list is drawn in at this
   moment, over the whole term on screen. Ranked across groups rather than within each, which comes to
   the same thing — every group is ordered by the same comparator — and keeps a row the editor files
   into another category in its sorted place among its new neighbours until the close. */
function freezeOrder() {
  frozenRank = null;
  const cls = getSelectedClass();
  const term = getSelectedTerm();
  const sort = activeSort(cls, term ? term.id : '');
  if (!sort) return;
  const rank = new Map();
  inViewOrder(assignmentsOf(cls.id, term.id), cls, sort).forEach((a, i) => rank.set(a.id, i));
  frozenRank = rank;
}

/* The five headings and the Actions heading, painted to the sort that applies. Only the active `<th>`
   carries `aria-sort` (ruling 1) — the others carry none rather than "none", which is what a reader
   expects of a heading that is not the one sorting. ↺ Your order is BUILT while a sort is on and
   REMOVED when it is not (ruling 4), so it is never a dead control; the hidden "Actions" beside it
   stays, so the column keeps its name for a screen reader either way. */
function paintSortHeads(sort) {
  Array.prototype.forEach.call(document.querySelectorAll(SORT_HEAD_SEL), (btn) => {
    const column = btn.getAttribute('data-assignment-sort');
    const th = btn.closest('th');
    const on = !!sort && sort.column === column;
    const dir = on ? SORT_COLUMNS[column].first * (sort.reversed ? -1 : 1) : 0;
    btn.classList.toggle('on', on);
    const mark = btn.querySelector('.assign-sort-mark');
    if (mark) mark.textContent = !on ? '↕' : dir > 0 ? '▲' : '▼';
    if (th) {
      if (on) th.setAttribute('aria-sort', dir > 0 ? 'ascending' : 'descending');
      else th.removeAttribute('aria-sort');
    }
  });
  const slot = document.querySelector(RESET_CELL_SEL);
  if (!slot) return;
  const there = slot.querySelector('[data-assignment-sort-reset]');
  if (sort && !there) {
    const btn = actionButton(RESET_LABEL, 'data-assignment-sort-reset', '', 'assign-row-btn');
    btn.title = 'Back to the order you set with the arrows';
    slot.append(btn);
  } else if (!sort && there) {
    there.remove();
  }
}

/* A heading tapped: first tap the useful direction, second the reverse, third the teacher's order.
   Writes nothing — the state above and a repaint — and says the new order out loud, because a list
   reordering under a heading is a change a screen-reader user cannot see happen. The heading buttons
   are markup in index.html and survive the repaint, so the focus stays where the tap put it. */
export function sortAssignmentsBy(column) {
  const spec = SORT_COLUMNS[column];
  const cls = getSelectedClass();
  const term = getSelectedTerm();
  if (!spec || !cls || !term) return;
  const now = activeSort(cls, term.id);
  if (!now || now.column !== column) {
    listSort = { classId: cls.id, termId: term.id, column, reversed: false };
  } else if (!now.reversed) {
    listSort = { classId: cls.id, termId: term.id, column, reversed: true };
  } else {
    listSort = null;
  }
  renderAssignments();
  announce(listSort
    ? 'Sorted by ' + spec.label + ', ' + spec.words[listSort.reversed ? 1 : 0]
      + ', inside each category. Your own order is kept — ' + RESET_LABEL + ' brings it back.'
    : 'Back to your order.');
}

/* ↺ Your order. The button is gone after the repaint, so the focus goes to the heading that was
   sorting — the control nearest the one that vanished, and the one that would sort again. */
export function showTeacherOrder() {
  const was = listSort ? listSort.column : '';
  listSort = null;
  renderAssignments();
  const head = was ? document.querySelector(SORT_HEAD_SEL + '[data-assignment-sort="' + was + '"]') : null;
  if (head && typeof head.focus === 'function') head.focus();
  announce('Back to your order. The arrows move assignments again.');
}

/* Every arrival on the list (src/shell.js's showClassScreen(), before the view swaps): the teacher's
   order, and nothing painted here — the arrival paints. */
export function clearAssignmentSort() {
  listSort = null;
  frozenRank = null;
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
  paintHintEmpty(!!cls && gradingModeOf(cls) === 'points');
  paintListNote(cls, termId);
  /* A sort set on another class or term is dropped here, as the note above is (WO-3.55, ruling 6):
     changing class or term returns the teacher's order, and coming back does not bring the sort. */
  const sort = activeSort(cls, termId);
  if (!sort) listSort = null;
  paintSortHeads(sort);
  const sortedBy = sort ? SORT_COLUMNS[sort.column].label : '';
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
  const byPoints = gradingModeOf(cls) === 'points';
  cats.forEach((cat) => {
    const held = list.filter((a) => a.categoryId === cat.id);
    const weight = Number(cat.weight);
    const zero = !Number.isFinite(weight) || weight === 0;
    const catPoints = held.reduce((n, a) => n + pointsOf(a), 0);
    /* NO WEIGHT CHIP IN A CLASS GRADED ON TOTAL POINTS (WO-3.34): "weight 40%" on a group whose
       weight the grade ignores is the screen telling her the grade is weighted. The head keeps its
       name and its count, which is what the "Not in a category" head has always carried. */
    const chip = byPoints ? null
      : { text: formatWeight(Number.isFinite(weight) ? weight : 0) + '%', zero: zero };

    if (!held.length) {
      /*
        WHAT AN EMPTY CATEGORY COSTS, in the two cases where the answer differs. At a real weight
        it redistributes — the data model's rule, and the one a teacher is most likely to be
        surprised by — so the row says so rather than letting her conclude the app lost her work.
        At weight 0 that sentence would be false: there is nothing to redistribute, and saying
        there is would teach her to distrust the next one. (This is the open question the drawing
        left at design/mockups/assignments.html, answered here rather than left to the next reader.)

        IN A CLASS GRADED ON TOTAL POINTS THERE IS A THIRD ANSWER, AND IT IS THE SAME FOR EVERY
        WEIGHT (WO-3.34). Neither sentence above is true there: the weight is not part of the grade,
        so there is nothing to redistribute and nothing that "counts for nothing either way" because
        of a 0%. What an empty category costs in that formula is nothing at all — no points on
        either side — so the row says that and names no weight, zero or otherwise.

        ONE HEADING AND NO BAR SINCE WO-3.54 (the owner's ruling 5). The three sentences are kept
        whole, each its own, as the heading's hidden text; what shows is the owner's short note for
        the same three cases, in the old bar's amber. One sentence for all three would be the
        collapse this comment exists to prevent — read the paragraphs above before merging them.
      */
      const what = cat.name || 'this category';
      body.append(groupHead(cat.name || 'Untitled category', chip,
        'Nothing in it yet · ' + (byPoints ? 'adds nothing until something is in it'
          : zero ? '0%, counts for nothing'
            : 'its ' + formatWeight(weight) + '% is shared across the others'),
        'empty',
        byPoints
          ? 'Nothing is filed under “' + what + '” yet. This class is graded '
            + 'on total points, so an empty category adds nothing to either side of the grade until '
            + 'something is in it.'
          : zero
          ? 'Nothing is filed under “' + what + '” yet, and its weight is '
            + '0% — so it counts for nothing either way until you put work in it and give it a weight.'
          : 'Nothing is filed under “' + what + '” yet, so its '
            + formatWeight(weight) + '% redistributes across the categories that do have work rather '
            + 'than counting as a zero. Nothing is wrong; this category is simply not part of the '
            + 'grade until something is in it.'));
      return;
    }
    body.append(groupHead(cat.name || 'Untitled category', chip,
      plural(held.length, 'assignment', 'assignments') + ' · ' + plural(catPoints, 'point', 'points')));
    /* A sorted COPY of the group when a sort is on (WO-3.55) — `held` itself is never reordered. */
    inViewOrder(held, cls, sort)
      .forEach((a, i) => body.append(assignmentRow(a, cls, i, held.length, sortedBy)));
  });

  /*
    WORK THAT IS IN NO CATEGORY THIS CLASS HAS. Three ways to arrive, and since WO-3.43 the third is
    the usual one: an assignment created while the class had no categories at all; one whose
    category id was left behind by a build or a document this one did not write; and work whose
    category the teacher removed, which src/categories.js now re-files here (its `categoryId`
    cleared to '') rather than deleting. The notice's wording was checked against that third way and
    left alone: "not filed under any category this class has" is exactly what a removal leaves, and
    tapping each one's name is how she files it again — "Open Edit on each one" until WO-3.54 took the
    Edit button away. In a WEIGHTED class it is red rather than amber, because an empty category
    costs nothing and this costs the assignment — it is counted by nothing until it is re-filed, and
    its editor is one tap away, on its own name.

    IN A CLASS GRADED ON TOTAL POINTS IT IS COUNTED (WO-3.30's ruling), so the notice there says so
    and still asks for a category — the work is in the grade, and filing it is what puts it in a
    row of the breakdown with a name a guardian recognises. The weighted sentence is unchanged.
    AND IT IS NOT RED THERE (WO-3.36): red says "this costs the assignment", which in that formula
    is false. It adds `.counted`, which src/assignments.css draws in the amber of an empty
    category's heading — something to tidy, not something wrong.

    THE SAME MOVE AS AN EMPTY CATEGORY SINCE WO-3.54 (the owner's ruling 6): the heading carries the
    colour and a short note, the bar under it is gone, and the full sentence is the heading's hidden
    text. Neither note nor sentence says Edit, because there is no Edit to open — the name is the
    door. The note is the owner's words for each mode, word for word; the sentence keeps its own
    count, `it` or `them`, and says "its name" or "each one's name" to match.
  */
  const filed = cats.map((c) => c.id);
  const loose = list.filter((a) => filed.indexOf(a.categoryId) === -1);
  if (loose.length) {
    const tap = loose.length === 1 ? 'Tap its name' : 'Tap each one’s name';
    body.append(groupHead('Not in a category', null,
      plural(loose.length, 'assignment', 'assignments') + ' · ' + (byPoints
        ? 'counted, but in no category — tap its name to file it'
        : 'counted toward nothing — tap its name to file it'),
      byPoints ? 'unfiled counted' : 'unfiled',
      plural(loose.length, 'assignment', 'assignments')
      + ' below ' + (loose.length === 1 ? 'is' : 'are') + ' not filed under any category '
      + cls.name + ' has, ' + (byPoints
        ? 'so the grade counts ' + (loose.length === 1 ? 'it' : 'them') + ' under “no category” — '
          + cls.name + ' is graded on total points, and every point counts. '
          + tap + ' and choose a category to file it where it belongs.'
        : 'so nothing counts ' + (loose.length === 1 ? 'it' : 'them') + ' at all. '
          + tap + ' and choose a category.')));
    inViewOrder(loose, cls, sort)
      .forEach((a, i) => body.append(assignmentRow(a, cls, i, loose.length, sortedBy)));
  }
}

/* ────────────────────────────── the editor ────────────────────────────── */

/* `tag` is 'label' everywhere but the two date fields, which take a <div> (WO-1.48). A <button> is
   a labelable element, so the Clear beside a date cannot live inside a <label> that already wraps an
   input without making that label's own "which control am I for" question ambiguous — and every
   field built here already carries its own `aria-label`, so the wrapper was never where the
   accessible name came from. index.html makes the same swap at the six static date fields. */
function fieldWrap(labelText, wide, tag) {
  const wrap = document.createElement(tag || 'label');
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
  const byPoints = gradingModeOf(cls) === 'points';
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
       than a label: "Quizzes — 25%" is what a teacher is deciding between. In a class graded on
       total points it is not a fact about the grade, so the option is the name alone (WO-3.34). */
    option.textContent = (cat.name || 'Untitled category') + (byPoints ? ''
      : ' — ' + formatWeight(Number(cat.weight) || 0) + '%');
    if (cat.id === assignment.categoryId) option.selected = true;
    select.append(option);
  });

  wrap.append(select);
  return wrap;
}

/* One truth for the two captions, read by the field itself and by the Clear beside it. */
const DATE_LABELS = { assigned: 'Assigned', due: 'Due' };

/* The ELEMENT, apart from the wrapper and the Clear beside it (WO-1.48). Split out because the
   reset the Clear performs replaces the input and nothing else: replacing the whole wrapper would
   take away the button that was just tapped, with the focus on it. */
function dateInput(assignment, field) {
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
  return input;
}

function dateField(assignment, field) {
  const wrap = fieldWrap(DATE_LABELS[field] || '', false, 'div');
  wrap.setAttribute('data-date-field', '');
  wrap.append(dateInput(assignment, field));
  /* THE CLEAR (WO-1.48), and it is the only way this field is emptied by a gesture now. A native
     date input reports `''` both while a date is half typed and when it has been deliberately
     emptied, so every repair that read the second out of the first was arguing with an ambiguity
     rather than removing it. Focus is on the BUTTON when this runs, so the reset underneath it can
     throw the element away with no caret anywhere near it — which is what buys back the case
     WO-1.47 knowingly gave up. src/shell.js routes it; assignmentDateCleared() below does it.

     The label is a word rather than a glyph and the button is `.class-action-btn` shipped as it is,
     for the reasons src/shell.css § "THE CLEAR BESIDE A DATE FIELD" sets out at the class. */
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'class-action-btn date-clear';
  clear.setAttribute('data-date-clear', '');
  clear.setAttribute('aria-label', 'Clear the ' + (DATE_LABELS[field] || '').toLowerCase()
    + ' date — ' + (assignment.name || 'this assignment'));
  clear.textContent = 'Clear';
  wrap.append(clear);
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

/*
  HOLD OUT OF THE GRADE (WO-3.46, the owner's ruling 4): A NEW COLUMN IS LIVE, so the box is
  unticked on every assignment createAssignment() writes and on every assignment from every earlier
  build, and nothing a teacher does today changes unless she ticks it.

  A CHECKBOX IN MEANING AND A BUTTON IN MARKUP — `role="checkbox"` with `aria-checked`, the copy
  dialog's tick for its look. Not `<input type="checkbox">`, which src/shell.css's `.toggle-btn`
  note refuses for this app: 16px of target that no padding makes bigger. The role is the honest
  name for what it is, so a screen reader says "checkbox, not checked" rather than "toggle button".

  ITS CONFIRM OPENS ON THE TAP, NEVER AT THE CLOSE (the work order's Traps). The editor already has a
  confirm at the close — WO-3.50's scored move, settleEditor() — and a teacher who moves a due date
  and ticks the hold must never be shown two dialogs stacked at Done. So the tap opens
  src/held-column.js's confirm over this dialog at once, the same confirm the grid's Hold / Commit
  opens, and the box changes only when that confirm has written. Declining leaves it as it was.

  ONE EXCEPTION, and it is ruling 3's own premise rather than a way round it: a column this create
  flow has only just written, with nothing entered on it, cannot move a grade — the confirm's whole
  content would be "no student's grade changes" — so the tap writes there and then. The moment a
  score is on it, or it is any other column, the tap goes through the confirm.
*/
function holdField(assignment) {
  const wrap = document.createElement('div');
  wrap.className = 'assign-hold';
  const held = isHeld(assignment);
  const tick = document.createElement('button');
  tick.type = 'button';
  tick.className = 'assign-hold-tick';
  tick.setAttribute('role', 'checkbox');
  tick.setAttribute('aria-checked', held ? 'true' : 'false');
  tick.setAttribute('data-assignment-hold', assignment.id);
  tick.setAttribute('aria-describedby', 'assignmentHoldNote');
  const box = document.createElement('span');
  box.className = 'assign-hold-box';
  box.setAttribute('aria-hidden', 'true');
  box.textContent = held ? '✓' : '';
  tick.append(box);
  const label = document.createElement('span');
  label.textContent = 'Hold out of the grade';
  tick.append(label);
  wrap.append(tick);
  const note = document.createElement('span');
  note.className = 'assign-field-note';
  note.id = 'assignmentHoldNote';
  note.textContent = 'A held column takes scores, flags and notes and counts toward nothing until '
    + 'you commit it — here, or with Commit on its column in the score grid.';
  wrap.append(note);
  return wrap;
}

/* The box redrawn in place after the confirm has written — never the whole field set, for the
   reason editAssignmentField() gives: replacing the controls would take the focus the confirm has
   just handed back to this box. Nothing when the editor is shut. */
export function paintEditorHold() {
  if (!editorIsOpen()) return;
  const assignment = findAssignment(editingId);
  const box = document.getElementById(EDITOR_FIELDS_ID);
  const tick = box && box.querySelector('[data-assignment-hold]');
  if (!assignment || !tick) return;
  const held = isHeld(assignment);
  tick.setAttribute('aria-checked', held ? 'true' : 'false');
  const glyph = tick.querySelector('.assign-hold-box');
  if (glyph) glyph.textContent = held ? '✓' : '';
}

/* The tap. `{ wrote }` so src/shell.js can repaint the screens behind the dialog when the create
   flow's exception wrote; otherwise the confirm is up and has written nothing yet. */
export function tapEditorHold(tick) {
  const id = tick ? tick.getAttribute('data-assignment-hold') : '';
  const assignment = id ? findAssignment(id) : null;
  const cls = assignment ? findClass(assignment.classId) : null;
  if (!assignment || !cls || id !== editingId) return { wrote: false };
  if (id === creatingId && enteredCount(assignment, cls) === 0) {
    const toHeld = !isHeld(assignment);
    const wrote = toHeld ? holdColumn(id) : commitColumn(id);
    paintEditorHold();
    if (wrote) {
      announce(toHeld
        ? 'This assignment will be held out of the grade until you commit it.'
        : 'This assignment counts toward the grade.');
    }
    return { wrote };
  }
  openHoldConfirm(id, tick);
  return { wrote: false };
}

function renderEditorFields() {
  const box = document.getElementById(EDITOR_FIELDS_ID);
  const title = document.getElementById(EDITOR_TITLE_ID);
  if (!box) return;
  box.textContent = '';

  const assignment = findAssignment(editingId);
  const cls = assignment ? findClass(assignment.classId) : null;
  const cancelling = document.getElementById(EDITOR_CREATE_CANCEL_ID);
  const deleting = document.getElementById(EDITOR_DELETE_DOOR_ID);
  const isCreating = !!assignment && assignment.id === creatingId;
  if (cancelling) cancelling.classList.toggle('hidden', !isCreating);
  /* A pending create already has an explicit Cancel that removes its new row and empty score
     column. Hide Delete here so the shared editor does not offer two doors to the same outcome;
     ordinary assignment edits still expose Delete exactly as before. */
  if (deleting) deleting.classList.toggle('hidden', isCreating);
  /* THE CREATE DOOR (WO-3.48), shown on exactly the condition Cancel is — a create flow — and only
     when there is another active class to copy into. Opening a row through its name clears
     `creatingId`, so an assignment that was ever accepted never shows it; Duplicate on its row is
     that door. */
  const copyDoor = document.getElementById(EDITOR_COPY_DOOR_ID);
  if (copyDoor) {
    const others = isCreating
      ? getActiveClasses().filter((c) => c.id !== assignment.classId).length : 0;
    copyDoor.classList.toggle('hidden', !isCreating || others < 1);
  }
  if (title) {
    title.textContent = assignment && cls
      ? (assignment.name || UNTITLED_ASSIGNMENT) + ' — ' + cls.name
      : 'Assignment';
  }
  if (!assignment || !cls) { paintTermNote(''); paintAccommodationPrompt(null, ''); return; }
  /* A class whose terms carry no dates is the one place the due date cannot pick a term, and the
     editor says so from the moment it opens rather than at the close — there is no date she could
     type that would change the answer, so stopping her on the way out would be a question with no
     right reply. A fact about the class, not about anything typed (ruling 2). */
  paintTermNote(undatedNoteFor(assignment));

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

  box.append(holdField(assignment));

  /* Last, and outside `box`, because the prompt is about the fields rather than one of them — it
     lives in its own host in index.html, under this panel and above the two hints. Painted from
     here so that every door into this editor gets it: a row's name, the Delete… that comes back,
     and the brand-new assignment createAssignment() writes before opening. */
  paintEditorSupports();
}

/* Opened through its own hook rather than data-modal-open, for the reason src/classes.js gives:
   the panel is filled from the document, and a modal that opens and then fills in flickers. */
export function openAssignmentEditor(id, opener) {
  const assignment = findAssignment(id);
  if (!assignment) return;
  /* OPENING ANOTHER ROW IS A CLOSE OF THIS ONE (WO-3.50). The editor is re-filled in place when it is
     already up, so a date changed on the row it was showing has to be settled first or it never would
     be. No door reaches this while the dialog covers the list today; it is here so the day one does,
     the move is not silently skipped. */
  if (editorIsOpen() && editingId && editingId !== id) {
    const settled = settleEditor(false);
    if (!settled.close) return;
    /* The row it moved is no longer on the list behind the dialog, and nothing else here repaints. */
    if (settled.wrote) renderAssignments();
  }
  /*
    AN EXISTING ASSIGNMENT WITH NO NAME TAKES ONE WHEN IT IS OPENED (WO-3.56, the owner's ruling 2),
    and it is WRITTEN here, on open, because this editor has no Cancel to promise anything to: every
    field in it is written as it is typed. The words are the ones every reader already draws for it,
    so nothing on screen changes; what changes is that the field now shows them, as a name the teacher
    can see and type over. Once — the next opening finds a name and writes nothing — and only for the
    row being opened: nothing names the rest of the year (the work order's Out of scope).

    NEVER A CREATE (the Traps). createAssignment() writes `name: ''` and opens this same panel without
    coming through here, and a create's empty field is a field waiting to be typed into, not an
    assignment nobody named. `creatingId` is checked anyway, before it is cleared below, so a create
    re-opened through this door is still not pre-named under the teacher's caret.
  */
  if (id !== creatingId && nameIsBlank(assignment.name)) {
    update(() => { assignment.name = UNTITLED_ASSIGNMENT; });
  }
  editingId = id;
  creatingId = '';
  beginSession(assignment);
  showAssignmentError('');
  renderEditorFields();
  openModal(EDITOR_MODAL_ID, opener);
}

/*
  A NEW ASSIGNMENT, which is written to the document immediately and then opened for editing.

  There is no draft and no Save, which is this app's standing contract everywhere a teacher types
  (src/classes.js, src/categories.js, src/roster.js): a teacher interrupted mid-sentence must not
  lose what she typed because she never reached the bottom of a form. Close, Escape, the backdrop
  and Done therefore keep the row. The explicit Cancel is different because it names the loss: it
  removes the assignment this create flow wrote, through cancelCreatedAssignment() below.
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
    /* Provisional: replaced just below by the term the due date picks, and kept only when no term
       holds it — today in the gap between two terms, or a class whose terms have no dates. */
    termId: term.id,
    /* The first category, or none — never a guess at a better one. A class with no categories can
       still hold work; the list shows it under "Not in a category" and says what that costs. */
    categoryId: cats.length ? cats[0].id : '',
    name: '',
    points: DEFAULT_POINTS,
    assigned: today,
    due: today,
  };
  /*
    THE DUE DATE PICKS THE TERM (WO-3.50, ruling 1) — and it is the DUE DATE that is asked, the value
    just written into the record, not the clock. They are the same day at this instant, which is
    exactly why the distinction has to be written down: the clock was read once, above, to OFFER a
    date (decision 1), and what files the work is that date as a date the teacher now owns. Nothing in
    this file asks the clock which term anything is in, and nothing here re-files work because time
    passed — "the grade must never change because a date rolled over" (CLAUDE.md) is about the clock,
    and this is a date.
  */
  const placed = termContaining(cls.id, assignment.due);
  if (placed) assignment.termId = placed.id;
  update((doc) => {
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    doc.assignments.push(assignment);
  });

  editingId = assignment.id;
  creatingId = assignment.id;
  createOpener = opener || null;
  beginSession(assignment);
  /* THE LIST GOES WITH IT, AND SAYS SO (ruling 1). A teacher looking at Quarter 1 on the first of
     November has just made work that lives in Quarter 2; leaving the list on Quarter 1 would be the
     new row vanishing the moment it was made. The term she was on is kept for the editor's Cancel. */
  if (assignment.termId !== term.id) {
    createdFromTermId = term.id;
    selectTerm(assignment.termId);
    listNote = { classId: cls.id, termId: assignment.termId,
      text: 'The new assignment is in ' + termName(placed) + ', not ' + termName(term) + ': a new '
        + 'assignment is due today, today is in ' + termName(placed) + ', and the due date picks '
        + 'the term. This list has moved to ' + termName(placed) + ' with it.' };
  }
  showAssignmentError('');
  renderAssignments();
  renderEditorFields();
  openModal(EDITOR_MODAL_ID, opener);
  /* The dates are said because they were WRITTEN. Everything this app puts in a field on the
     teacher's behalf is announced with it — a default nobody said out loud is a value a
     screen-reader user finds out about later, from a list she did not expect to read a date on. */
  announce('Added an assignment to ' + cls.name + ', worth ' + DEFAULT_POINTS
    + ' points, assigned and due today' + (createdFromTermId
      ? ', in ' + termName(placed) + ', the term today is in — the list has moved there'
      : '') + '. Name it.');

  /* Focus the name after the fields are in the document, for the reason src/classes.js's
     renderClassList() gives: an input that is not yet in the page cannot take focus, and on iPadOS
     a focus() that misses is a software keyboard that never appears. */
  const box = document.getElementById(EDITOR_FIELDS_ID);
  const field = box && box.querySelector('.assign-field-input');
  if (field) { field.focus(); field.select(); }
}

/* THE EXPLICIT WAY OUT OF A CREATE, shared by every data-assignment-new opener. Creation writes
   first so the editor can autosave every field; Cancel removes exactly that just-created assignment
   and its necessarily-empty score column. It is deliberately not wired to Close, Escape or the
   backdrop: those are interruptions and keep typed work under the standing no-lost-draft rule. */
export function cancelCreatedAssignment() {
  const id = creatingId;
  const assignment = id ? findAssignment(id) : null;
  if (!assignment || editingId !== id) return false;
  update((doc) => {
    doc.assignments = assignmentsIn(doc).filter((a) => a.id !== id);
    if (doc.scores) delete doc.scores[id];
  });
  /* A create that moved the list onto today's term puts it back: nothing was added, so nothing is
     there to follow (WO-3.50). Before endSession(), which forgets the term. */
  const back = createdFromTermId;
  endSession();
  listNote = null;
  if (back && getTerms(assignment.classId).some((t) => t.id === back)) selectTerm(back);
  editingId = '';
  creatingId = '';
  closeModal(EDITOR_MODAL_ID);
  renderAssignments();
  announce('Cancelled the new assignment. Nothing was added.');
  return true;
}

/* ────────────────────────────── the due date picks the term (WO-3.50) ──────────────────────────────

   THE OWNER'S RULE, FROM THE SCHOOL'S SIS: A TERM IS NEVER NAMED; THE DUE DATE PLACES THE WORK.
   WO-3.49 applied it to copies; this applies it to the assignment the editor is open on, and to the
   copy dialog's source line (ruling 6).

   IT HAPPENS WHEN THE EDITOR CLOSES, NEVER ON A KEYSTROKE (ruling 2). The due field writes on every
   `input`, including the blank Chromium reports for a moment while a leading 0 is typed (WO-1.47's
   phantom), so a term worked out per keystroke would flip mid-date and take the row off the list
   behind the dialog while the teacher was still typing it. Nothing in this section is reached from
   an input event: settleEditor() is the editor's close guard (src/modal.js), and the move confirm's
   two buttons are the only other callers.

   A DATE THE TEACHER TYPED, AND NEVER THE CLOCK. CLAUDE.md's "the grade must never change because a
   date rolled over" is about time passing, and nothing below reads what day it is: every answer is
   termContaining() asked about a date stored in the record. Work is re-filed because a teacher
   changed its date and closed the dialog — and for no other reason, ever, which is also why an
   editor in which no date changed re-files nothing (ruling 5, `editorDates` above).

   A BLANK DUE DATE TAKES THE ASSIGNED DATE (ruling 3, as amended by the owner on 2026-10-06), and it
   is WRITTEN, at the close and not on `input`: the due date is then the only thing that places the
   work. The consequence is intended and is not to be suppressed — a blank due date can never be past
   due (src/past-due.js's isDate()), so a copied one makes the work eligible for the overdue tint and
   the past-due prompt from the next day. With no date at all, or dates no term holds, the work stays
   where it is and the editor says so. */

function editorIsOpen() {
  const modal = document.getElementById(EDITOR_MODAL_ID);
  return !!modal && !modal.classList.contains('hidden');
}

function beginSession(assignment) {
  editorDates = { id: assignment.id, assigned: dateOf(assignment.assigned), due: dateOf(assignment.due) };
  unplacedSaid = '';
  pendingMove = null;
  createdFromTermId = '';
  /* The order the list holds while this editor is open (WO-3.55, ruling 9), taken before anything
     below repaints it. */
  freezeOrder();
  /* A note about an earlier move is not about the row now being edited. */
  if (listNote) { listNote = null; renderAssignments(); }
}

function endSession() {
  editorDates = null;
  unplacedSaid = '';
  pendingMove = null;
  createdFromTermId = '';
  /* THE LIST SORTS AGAIN WHEN THE EDITOR SETTLES (WO-3.55, ruling 9). The close repaints the list
     only when the close wrote something (src/shell.js's afterEditorSettled()), and a due date typed
     while sorted by Due was written per keystroke and moves nothing at the close — so without this
     repaint the row would stay in its frozen place until the next unrelated paint. Painted only when
     a freeze was held and the list is the screen up: an editor opened from the Scores grid holds none. */
  if (frozenRank) {
    frozenRank = null;
    const view = document.getElementById('assignmentsView');
    if (view && !view.classList.contains('hidden')) renderAssignments();
  }
}

function termOf(classId, termId) {
  return getTerms(classId).filter((t) => t.id === termId)[0] || null;
}

/* The amber line in the editor: why no term holds the dates, or '' to take it down. */
function paintTermNote(text) {
  const el = document.getElementById(EDITOR_TERM_NOTE_ID);
  if (!el) return;
  el.textContent = text || '';
  el.classList.toggle('hidden', !text);
}

/* What the editor says on opening when the class has no dated term, or ''. */
function undatedNoteFor(assignment) {
  const cls = assignment ? findClass(assignment.classId) : null;
  if (!cls || getTerms(cls.id).some(termIsDated)) return '';
  return 'None of ' + cls.name + '’s terms has its dates typed in, so no due date can pick a term for '
    + 'this assignment, and it stays in ' + termName(termOf(cls.id, assignment.termId)) + '. Type the '
    + 'term dates in the class manager and the due date will place it.';
}

/*
  WHERE A PAIR OF DATES PUTS AN ASSIGNMENT — the one answer, for the editor and the copy dialog's
  source line both. Handed the dates as they stand and the term the work is filed under now; reads
  nothing else and writes nothing.

  `fill` is ruling 3's copy, '' when there is none. `kind` is one of:
    'none'     — the term the dates pick is the one it is in; nothing to do
    'fill'     — the same, and the blank due date takes the assigned one
    'move'     — `term` holds the placing date and is not where the work is filed
    'unplaced' — no date, or a date no term holds (`why`, `by`, `date`, `gap`): it stays where it is
    'undated'  — the class has no dated term at all, so no date could ever place it: it stays, and the
                 editor has said so since it opened (undatedNoteFor())
*/
function placeByTypedDates(classId, termId, assigned, due) {
  const fill = !due && assigned ? assigned : '';
  const placing = due || fill;
  if (!getTerms(classId).some(termIsDated)) return { kind: 'undated', fill };
  if (!placing) return { kind: 'unplaced', fill, why: 'no-date' };
  const by = due ? 'due' : 'assigned';
  const term = termContaining(classId, placing);
  if (!term) {
    return { kind: 'unplaced', fill, why: 'outside', by, date: placing, gap: outOfTermGap(classId, placing) };
  }
  if (term.id === termId) return { kind: fill ? 'fill' : 'none', fill, term, by, date: placing };
  return { kind: 'move', fill, term, by, date: placing };
}

/* The editor's own question: did a date change in this sitting, and if so, where do the dates put it. */
function closePlan(assignment) {
  if (!editorDates || editorDates.id !== assignment.id) return { kind: 'none', fill: '' };
  const assigned = dateOf(assignment.assigned);
  const due = dateOf(assignment.due);
  if (assigned === editorDates.assigned && due === editorDates.due) return { kind: 'none', fill: '' };
  return placeByTypedDates(assignment.classId, assignment.termId, assigned, due);
}

/* Where a date sits that no term holds, in words — the same four answers the copy dialog's lines give
   (placementFlag() above), read off the same `gap`. */
function gapWords(gap) {
  const g = gap || {};
  return g.before && g.after ? 'falls between ' + termName(g.before) + ' and ' + termName(g.after)
    : g.after ? 'falls before ' + termName(g.after)
    : g.before ? 'falls after ' + termName(g.before)
    : 'falls in no term';
}

function unplacedSentence(plan, assignment, cls) {
  const here = termName(termOf(cls.id, assignment.termId));
  if (plan.why === 'no-date') {
    return 'This assignment has no due date and no assigned date, so no term holds it, and it stays in '
      + here + '. Give it a due date to file it by, or close again to leave it there.';
  }
  return (plan.by === 'due' ? 'Its due date, ' : 'It has no due date, and its assigned date, ')
    + shortDate(plan.date) + ', ' + gapWords(plan.gap) + ', so no term in ' + cls.name + ' holds it, '
    + 'and it stays in ' + here + '. Change the date, or close again to leave it there'
    + (plan.fill ? ', due on ' + shortDate(plan.fill) + ', its assigned date' : '') + '.';
}

/* How many scores a move would carry: entries with a value or a flag, against the roster, exactly as
   the coverage bar counts them — a note on a blank is not a score (noteOnly()), and a cell left by a
   student no longer on the roster is in no grade either term draws. */
function scoresCarried(assignment, cls) { return enteredCount(assignment, cls); }

/*
  THE WRITE: the copied due date and the new term, in ONE update() — one save, one `rev` — and then
  the list follows the row (ruling 1's "the list moves to that term and says so", which is the same
  promise after an edit as after a create). `follow` is the caller's word that a term-filtered screen
  is up behind the dialog; with the calendar or a student's page behind it, the open term is not
  pulled about by an edit made somewhere else, and the announcement says where the work went instead.
  Answers whether it wrote.
*/
function applyPlan(assignment, cls, plan, follow) {
  const moving = plan.kind === 'move';
  /* RULING 5'S NAME GOES IN THIS SAME update() (WO-3.56's Traps): a close that both names a blank
     assignment and moves it is one save and one `rev`, never two. Done refuses a blank name before it
     gets here (settleEditor()), so every blank this function finds is a close ruling 5 governs — the
     ✕, Escape, the backdrop, opening another row, or the scored-move confirm one of those opened — and
     it is read here rather than passed in, so no caller can forget to pass it. */
  const naming = nameIsBlank(assignment.name);
  if (!moving && !plan.fill && !naming) return false;
  const from = termOf(cls.id, assignment.termId);
  const scores = moving ? scoresCarried(assignment, cls) : 0;
  update(() => {
    if (naming) assignment.name = UNTITLED_ASSIGNMENT;
    if (plan.fill) assignment.due = plan.fill;
    if (moving) assignment.termId = plan.term.id;
  });
  /* The warning LEADS whatever else the close says, in the list's note and in the live region alike:
     the region holds one message, so two announce() calls would leave only the second, and a note
     about a move replacing the warning would hide the one thing the teacher has to act on. */
  const warn = naming ? NAMELESS_WARNING + ' ' : '';
  const named = '“' + (assignment.name || UNTITLED_ASSIGNMENT) + '”';
  if (!moving) {
    if (plan.fill) {
      announce(warn + named + ' had no due date, so it is now due on its assigned date, '
        + shortDate(plan.fill) + '.');
    } else {
      announce(NAMELESS_WARNING);
    }
    if (naming) setNamelessNote(cls.id, assignment.termId, '');
    return true;
  }
  const why = plan.fill
    ? 'it had no due date, so it took its assigned date, ' + shortDate(plan.fill) + ', which is in '
      + termName(plan.term)
    : 'its due date, ' + shortDate(plan.date) + ', is in ' + termName(plan.term);
  const carried = scores ? ' Its ' + plural(scores, 'score', 'scores') + ' went with it.' : '';
  const selected = getSelectedClass();
  if (follow && selected && selected.id === cls.id) {
    selectTerm(plan.term.id);
    const moved = named + ' moved here from ' + termName(from) + ': ' + why
      + ', and the due date picks the term.' + carried;
    listNote = { classId: cls.id, termId: plan.term.id, text: moved };
    if (naming) setNamelessNote(cls.id, plan.term.id, moved);
    announce(warn + 'Moved ' + named + ' to ' + termName(plan.term) + ', because ' + why + '. The list '
      + 'has moved to ' + termName(plan.term) + ' with it.' + carried);
  } else {
    if (naming) setNamelessNote(cls.id, assignment.termId, '');
    announce(warn + 'Moved ' + named + ' from ' + termName(from) + ' to ' + termName(plan.term)
      + ', because ' + why + '.' + carried);
  }
  return true;
}

/*
  RULING 5'S VISIBLE WARNING (WO-3.56): on the list's note, the line under the list's head the
  moved-work note already uses, in amber. announce() is beside it at the call and is NOT the warning —
  it writes to an .sr-only region and draws nothing. Set for the class and the term the assignment is
  now in, so it is drawn on that list and dropped by the first render of any other (paintListNote()),
  the same view-state life the moved-work note has. When the same close also moved the work, both
  sentences share the one line, the warning first, and the line is amber: the move is something to
  read and the warning is something to act on.

  NO MARK ON THE ROW (the work order's Deliverables): the row reads "Untitled assignment" exactly as it
  always did, and the note is the one thing that says the words are now a stored name.
*/
function setNamelessNote(classId, termId, moved) {
  /* A note already up for this same list — a create that took the list onto today's term — is kept
     behind the warning rather than replaced by it: it is still true, and it is the only sentence
     saying why the list is on a term the teacher did not pick. */
  const standing = !moved && listNote && !listNote.nameless && listNote.classId === classId
    && listNote.termId === termId ? listNote.text : '';
  const after = moved || standing;
  listNote = { classId, termId, nameless: true,
    text: NAMELESS_WARNING + (after ? ' ' + after : '') };
}

/*
  THE EDITOR'S CLOSE GUARD, set by src/shell.js on #assignmentModal and asked by every gesture that
  closes it — the ✕, Done, Escape, the backdrop (src/modal.js's dismissModal()) — and by the two
  in-file doors that close it too: opening another row, and the create door. `{ close, wrote }`:
  whether the dialog may go, and whether the document changed, so the caller can repaint the screens
  an assignment is drawn on.

  Two answers stop the close, and each puts something on screen saying why. A move that carries
  scores opens the confirm (ruling 4) — before ANY write, so declining leaves the document exactly as
  it was. Dates no term holds paint the editor's amber line, once: the same close again is the
  teacher having read it, and goes through, writing ruling 3's copy if there is one.

  A THIRD STOP, AND IT IS DONE'S ALONE (WO-3.56, the owner's ruling 4). `door` names the gesture when
  it is one that may refuse: 'done' for the Done button, 'copy' for the create door. Done with a blank
  name — whitespace is blank — does not close: the editor says the assignment needs a name and puts the
  caret in the field, before anything else is asked or written. Every other close (`door` absent: the
  ✕, Escape, the backdrop, opening another row) is ruling 5's and is never refused for a name — a
  dialog that will not let Escape out is a trap, and the no-lost-draft contract keeps a half-written
  assignment rather than discarding it — so it closes and applyPlan() names it. `follow` was never this
  distinction: it says whether a term-filtered list is up behind the dialog, and Done, the ✕ and
  Escape all pass the same value for it.

  THE CREATE DOOR REFUSES TOO ('copy'), and that is a decision this work order left open (its Traps).
  The other way — let the blank through and lean on the copy dialog's own refusal (ruling 1) — fails
  at both ends. The editor would close as ruling 5 says a non-Done close does, so the new assignment
  would be stored as "Untitled assignment" and the copy dialog would open with those words already in
  its name field and its button enabled: the very nameless copies ruling 1 exists to stop, one tap
  away. And if the door instead skipped ruling 5, the copy dialog's Cancel — which writes nothing,
  its standing promise — would leave a nameless row behind, with no warning, from a create the
  teacher had already ended. Refusing here costs one sentence and keeps everything she typed: the
  editor stays up, Cancel is still the create's way out, and the name she types is the one every
  copy then starts from. The door is a Done that also copies, so it asks what Done asks.
*/
export function settleEditor(follow, door) {
  const assignment = editingId ? findAssignment(editingId) : null;
  const cls = assignment ? findClass(assignment.classId) : null;
  if (!assignment || !cls || !editorDates || editorDates.id !== assignment.id) {
    endSession();
    return { close: true, wrote: false };
  }
  if ((door === 'done' || door === 'copy') && nameIsBlank(assignment.name)) {
    refuseBlankName(door);
    return { close: false, wrote: false };
  }
  const plan = closePlan(assignment);
  if (plan.kind === 'unplaced') {
    const said = dateOf(assignment.assigned) + '|' + dateOf(assignment.due) + '|' + assignment.termId;
    if (unplacedSaid !== said) {
      unplacedSaid = said;
      const sentence = unplacedSentence(plan, assignment, cls);
      paintTermNote(sentence);
      announce(sentence);
      return { close: false, wrote: false };
    }
  }
  if (plan.kind === 'move' && scoresCarried(assignment, cls) > 0) {
    openMoveConfirm(assignment, cls, plan, follow);
    return { close: false, wrote: false };
  }
  const wrote = applyPlan(assignment, cls, plan, follow);
  endSession();
  return { close: true, wrote };
}

/* Done's refusal (ruling 4): said on the editor's own error line — which also speaks it, for a
   screen-reader user (showAssignmentError()) — and the caret put in the name field, the way the
   editor already stops on dates no term holds. Typing into the field takes the line down again
   (editAssignmentField()). The name field is found by its hook rather than by being first, so a
   reordered panel cannot send the caret somewhere else. */
function refuseBlankName(door) {
  showAssignmentError(door === 'copy'
    ? 'This assignment needs a name before it is copied. Type one in the Name field, and every copy '
      + 'starts from it.'
    : 'This assignment needs a name. Type one in the Name field, then press Done.');
  const box = document.getElementById(EDITOR_FIELDS_ID);
  const field = box && box.querySelector('[data-assignment-field="name"]');
  if (field) field.focus();
}

/*
  A MOVE THAT CARRIES SCORES SAYS SO BEFORE IT HAPPENS (ruling 4). Scores are keyed by assignment, so
  moving a scored one takes them out of one term's grades and into another's — and the one it leaves
  may already be keyed into the SIS, which is the cost a teacher would otherwise find out about at the
  next report. So the confirm names both terms and the number, and the teacher picks: move it, or
  keep it where it is. The ✕, Escape and the backdrop take her back to the editor to change the date,
  writing nothing — the confirm is a question about the close, and backing out of it is not an answer.
  Same tier and grammar as the delete confirm: it counts what goes before it goes.
*/
function openMoveConfirm(assignment, cls, plan, follow) {
  pendingMove = { id: assignment.id, follow: !!follow };
  const from = termOf(cls.id, assignment.termId);
  const scores = scoresCarried(assignment, cls);
  const named = '“' + (assignment.name || UNTITLED_ASSIGNMENT) + '”';
  const title = document.getElementById(MOVE_TITLE_ID);
  if (title) title.textContent = 'Move it to ' + termName(plan.term) + '?';
  const lead = document.getElementById(MOVE_LEAD_ID);
  if (lead) {
    lead.textContent = (plan.fill
      ? named + ' has no due date, so it takes its assigned date, ' + shortDate(plan.fill)
        + ', which is in ' + termName(plan.term)
      : named + ' is now due ' + shortDate(plan.date) + ', which is in ' + termName(plan.term))
      + ', and it is filed in ' + termName(from) + '. The due date picks the term, so closing the '
      + 'editor moves it, and its scores go with it.';
  }
  const facts = document.getElementById(MOVE_FACTS_ID);
  if (facts) {
    facts.textContent = '';
    factLine(facts, plural(scores, 'score moves', 'scores move') + ' from ' + termName(from) + ' to '
      + termName(plan.term) + '.');
    factLine(facts, termName(from) + '’s grades stop counting ' + (scores === 1 ? 'it' : 'them')
      + ' and ' + termName(plan.term) + '’s start. If ' + termName(from) + '’s grades are already in '
      + 'the SIS, they will no longer match.');
  }
  const button = document.getElementById(MOVE_BTN_ID);
  if (button) button.textContent = 'Move it to ' + termName(plan.term);
  const keep = document.getElementById(MOVE_KEEP_ID);
  if (keep) keep.textContent = 'Keep it in ' + termName(from);
  openModal(MOVE_MODAL_ID);
}

/* Yes: worked out again from the dates as they stand now, never from what the confirm was drawn with
   — then written, and both dialogs closed. `{ wrote }` for the caller's repaint. */
export function confirmEditorMove() {
  const pending = pendingMove;
  pendingMove = null;
  closeModal(MOVE_MODAL_ID);
  const assignment = pending ? findAssignment(pending.id) : null;
  const cls = assignment ? findClass(assignment.classId) : null;
  if (!assignment || !cls || editingId !== assignment.id) return { wrote: false };
  const wrote = applyPlan(assignment, cls, closePlan(assignment), pending.follow);
  endSession();
  closeModal(EDITOR_MODAL_ID);
  return { wrote };
}

/* No: nothing is written — not the move, and not ruling 3's copy either, so declining leaves the
   document byte for byte as it was (Acceptance 4). The editor closes, because closing it is what she
   was doing.

   ONE EXCEPTION SINCE WO-3.56, and it is not about the move: a name left blank. Done refuses a blank
   name before this confirm can open, so a blank here came through the ✕, Escape or the backdrop —
   ruling 5's closes — and the editor closing through Keep takes "Untitled assignment" and the amber
   warning exactly as it would have without the confirm in between. Nothing about the dates or the
   term is written, so "Nothing moved" stays true. `{ wrote }` for the caller's repaint. */
export function keepEditorTerm() {
  const pending = pendingMove;
  pendingMove = null;
  closeModal(MOVE_MODAL_ID);
  const assignment = pending ? findAssignment(pending.id) : null;
  const cls = assignment ? findClass(assignment.classId) : null;
  endSession();
  closeModal(EDITOR_MODAL_ID);
  if (!assignment || !cls) return { wrote: false };
  const naming = nameIsBlank(assignment.name);
  if (naming) {
    update(() => { assignment.name = UNTITLED_ASSIGNMENT; });
    setNamelessNote(cls.id, assignment.termId, '');
  }
  announce((naming ? NAMELESS_WARNING + ' ' : '') + 'Kept “' + (assignment.name || UNTITLED_ASSIGNMENT)
    + '” in ' + termName(termOf(cls.id, assignment.termId)) + '. Nothing moved, and no score changed term.');
  return { wrote: naming };
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
    /*
      A PHANTOM EMPTY DATE LIVES HERE FOR ONE KEYSTROKE (WO-1.47), and it is left in place
      deliberately. Chromium blanks a month or a day segment while a leading `0` is typed and
      reports `value === ''` until the second digit lands, so `09/03` really is stored as '' for a
      moment and a reader who ever reacts to an empty stored date has to know that. It is harmless
      only because the element survives to receive the commit that follows — since WO-1.48 the
      rebuild hangs off the Clear button (assignmentDateCleared()) and no event reaches it at all —
      and because the store's debounce turns the empty and the committed write into one save.

      The phantom is still not repaired here, and it is not a thing to react to. Telling *mid-typing*
      from *deliberately emptied* is the ambiguity a native date input does not expose; WO-1.48
      removed the NEED to tell them apart rather than the ambiguity itself, by having the teacher say
      which she meant. A future reader who adds an `if (!value)` branch here is re-opening it.
    */
    const value = input.value;
    update(() => { assignment[field] = value; });
    /* A date that no term held, said at the last close, is not the date on the field any longer. The
       sentence goes; nothing is worked out in its place (ruling 2) — the next close asks again. */
    if (unplacedSaid) { unplacedSaid = ''; paintTermNote(undatedNoteFor(assignment)); }
  }

  showAssignmentError('');
  const title = document.getElementById(EDITOR_TITLE_ID);
  const cls = findClass(assignment.classId);
  if (title && cls) {
    title.textContent = (assignment.name || UNTITLED_ASSIGNMENT) + ' — ' + cls.name;
  }
  renderAssignments();
}

/*
  A DATE COMMITTED EMPTY — the write, and nothing else since WO-1.47.

  Written here as well as in editAssignmentField(), for the browser that commits a picker change
  without an `input` event first. Conditional so that a date that was already empty does not save
  the document over an identical copy of itself.

  THE REBUILD IS NOT REACHED FROM HERE AND IS NOT REACHED FROM ANY EVENT (WO-1.48). It was the second
  half of this function until WO-1.47 moved it to `focusout`, and it now hangs off the Clear button
  beside the field — assignmentDateCleared() below. This is the field WO-1.47 was reported against,
  on the second day of the live term: `change` fires on the momentarily-empty read Chromium reports
  while a `0` is being typed into the month or the day, so a rebuild hung on it replaced the element
  under the caret, took the focus to `BODY`, and left the assignment with no due date at all.
  src/classes.js's termDateCleared() holds the long version of both halves and `plans/known-bugs.md`
  § 1 holds the measurement. DO NOT PUT A REBUILD BACK ON AN EVENT: `change` and `focusout` both
  arrive on values a date input reports empty for two different reasons, and telling those two apart
  is what the button removed the need to do.

  AND THE TRANSIENT EMPTY WRITE BELOW STAYS, deliberately. editAssignmentField() has already stored
  '' on the empty `input` a keystroke before Chromium commits the month, so a date typed as `09/03`
  really is empty in the document for a moment — a phantom a future reader who reacts to an empty
  stored date needs to know about. It is harmless ONLY because the element survives to receive the
  commit that follows, and because the store's debounce turns the pair into one save. It is still
  not a thing to react to: nothing may infer that the teacher meant to empty the field from the
  field being empty, which is the whole of WO-1.48.
*/
export function assignmentDateCommitted(input) {
  const id = input.getAttribute('data-assignment-id');
  const field = input.getAttribute('data-assignment-field');
  if (field !== 'assigned' && field !== 'due') return;
  if (input.value) return;
  const assignment = findAssignment(id);
  if (!assignment) return;

  if (assignment[field]) update(() => { assignment[field] = ''; });
  renderAssignments();
}

/*
  THE CLEAR (WO-1.48) — the whole gesture, and the only path in this file that empties a date field.

  It does three things in one go, in this order: it writes the empty date to the document, it throws
  the element away and builds a fresh one, and it redraws the list behind the dialog because a due
  date is printed on a score-grid column head and a cleared one has to leave it.

  WHY THE ELEMENT IS DISCARDED, which is a WebKit fact found on the hardware rather than here and is
  the third field in this app to need the same answer — src/classes.js's termDateCleared() holds the
  long version and src/roster.js's supportDateCleared() points at it. Short version: the date popover
  keeps its own selection separate from the input's value, so a cleared field still has the old day
  highlighted and tapping that day again fires nothing at all. A fresh element has no picker state.

  AND WHY IT HANGS OFF A BUTTON RATHER THAN AN EVENT. `change`, `input` and `focusout` all arrive
  carrying `value === ''` for two different reasons — a date half typed, and a date deliberately
  emptied — and a native date input offers nothing that tells them apart. WO-1.47 was the guard
  against that (move the rebuild to the one event that cannot fire under a caret); this is the
  removal of it. The teacher says which one she meant by pressing this button, focus is ON the
  button, and there is no caret to take. **Nothing in this file may put a rebuild back on an event.**

  It replaces the INPUT and not the wrapper, because the wrapper holds the Clear that was just
  tapped and the focus is on it.
*/
export function assignmentDateCleared(input) {
  const id = input.getAttribute('data-assignment-id');
  const field = input.getAttribute('data-assignment-field');
  if (field !== 'assigned' && field !== 'due') return;
  const assignment = findAssignment(id);
  if (!assignment) return;

  /* Conditional on the STORED value only, and never on the field's — not saving the document over
     an identical copy of itself and not moving `rev` for a date that was already empty
     (docs/sync.md). The rebuild below is unconditional: a teacher who taps Clear on a field she has
     already emptied by hand is a teacher whose picker still has the old day highlighted, which is
     exactly the state this exists to discard. */
  if (assignment[field]) update(() => { assignment[field] = ''; });
  input.replaceWith(dateInput(assignment, field));
  if (unplacedSaid) { unplacedSaid = ''; paintTermNote(undatedNoteFor(assignment)); }
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
  /* In a class graded on total points a category is worth no percent of the grade and an unfiled
     piece still counts, so the sentence names the category and nothing else (WO-3.34). */
  const byPoints = gradingModeOf(cls) === 'points';
  announce((assignment.name || 'That assignment') + ' now counts in '
    + (byPoints
      ? (cat ? (cat.name || 'that category')
        : 'no category, and in a class graded on total points it still counts toward the grade')
      : cat ? (cat.name || 'that category') + ', worth ' + formatWeight(Number(cat.weight) || 0)
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
  /* The arrows are disabled while a sort is on (WO-3.55, ruling 4); refused here as well, so a route
     that reached this some other way still could not move a row in an order the screen is not showing. */
  if (activeSort(findClass(assignment.classId), assignment.termId)) return;
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
  land in another class filed under a category that class does not have — listed there under "Not
  in a category", filed nowhere that class can name, counted by nothing in a weighted class (a
  class graded on total points counts it, under "no category"), and moved by a category removal in
  the class it came from (destroyed by one, before WO-3.43), under a dialog naming a different class. That is this work order's named trap, and this function is where it
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

/*
  WHICH TERM A COPY GOES INTO, AND WHY IT CANNOT GO INTO ONE (WO-3.49, the owner's ruling 2).

  THE DUE DATE PICKS THE TERM, the way the school's SIS works: a term is never named, the date places
  the work. A blank due date falls back to the assigned date. There is no third fallback, and above
  all not the class's first term — that was `firstTermId()`, which v167 proposed for every copy into
  another class, invisible in Quarter 1 and, from Quarter 2 on, filing every copy into a closed
  quarter under a grade already keyed into the SIS unless the teacher caught it on every card.

  So a line no date can place is BLOCKED rather than guessed at, and `why` says which of four reasons
  it is, because each one is fixed somewhere different: a class with no terms and a class whose
  terms carry no dates are both fixed in the class manager; a copy with no date at all, or a date
  that falls in a gap or past either end of the year, is fixed on the line itself. The last case
  carries src/classes.js's own `{ before, after }` answer, so the sentence can say which side of
  which term the date fell — rather than this file walking the terms a second time.

  termContaining() answers null for a class with no DATED terms as well as for a date in a gap, which
  is the one ambiguity here, and termIsDated() is what tells the two apart, asked before the date is.

  CALLED WITH THE LINE'S VALUES AS THEY STAND, and nothing about its answer is kept: the line's sub
  and its flag are drawn from it, and confirmCopy() asks again from the values it is about to write.
  A term remembered from the last paint would be the copy filed against a date that has since been
  retyped — the Traps' "derive the term from the value at confirm, not from what was last drawn".
*/
function copyPlacement(classId, assigned, due) {
  const terms = getTerms(classId);
  if (!terms.length) return { term: null, why: 'no-terms' };
  if (!terms.some(termIsDated)) return { term: null, why: 'undated' };
  const by = due ? 'due' : assigned ? 'assigned' : '';
  if (!by) return { term: null, why: 'no-date' };
  const date = by === 'due' ? due : assigned;
  const term = termContaining(classId, date);
  if (term) return { term, by };
  return { term: null, why: 'outside', by, date, gap: outOfTermGap(classId, date) };
}

/* The quiet line under a class's name: the term its dates place it in, or why none does. */
function placementSub(place) {
  if (place.term) {
    return termName(place.term) + ', from its ' + (place.by === 'due' ? 'due' : 'assigned') + ' date';
  }
  if (place.why === 'no-terms') return 'no terms yet';
  if (place.why === 'undated') return 'no term dates yet';
  if (place.why === 'no-date') return 'no date to place it';
  return 'no term holds its ' + (place.by === 'due' ? 'due' : 'assigned') + ' date';
}

/* The amber sentence under a blocked line, or '' for a line that is placed. */
function placementFlag(place, cls) {
  if (place.term) return '';
  if (place.why === 'no-terms') {
    return cls.name + ' has no terms, so nothing can be copied into it yet. Add one in the class '
      + 'manager, or untick it to copy into the rest.';
  }
  if (place.why === 'undated') {
    return 'None of ' + cls.name + '’s terms has its dates typed in, so no date can place this copy '
      + 'in one. Add them in the class manager, or untick it to copy into the rest.';
  }
  if (place.why === 'no-date') {
    return 'This copy has no due date and no assigned date, so nothing places it in a term. Give it '
      + 'a date, or untick it.';
  }
  const gap = place.gap || {};
  const where = gap.before && gap.after
    ? 'falls between ' + termName(gap.before) + ' and ' + termName(gap.after)
    : gap.after ? 'falls before ' + termName(gap.after)
    : gap.before ? 'falls after ' + termName(gap.before)
    : 'falls in no term';
  return (place.by === 'due' ? 'Its due date, ' : 'It has no due date, and its assigned date, ')
    + shortDate(place.date) + ', ' + where + ', so no term in ' + cls.name + ' holds it. Change the '
    + 'date, or untick it.';
}

/* What a line says about its category, or '' when it has nothing to say. Each line speaks for its
   own class only: "no category of that name" is a fact about Period 4, and a single note under five
   lines could not say which of them it meant. The source category it names is the HELD one — what
   the source line shows now — because that is what every untouched line was matched against. */
function categoryFlag(target, cls, sourceClass) {
  if (target.categoryId) return '';
  if (!categoriesOf(cls).length) {
    return cls.name + ' has no grading categories yet, so this copy goes in none. '
      + (gradingModeOf(cls) === 'points'
        ? 'It still counts toward the grade, under “no category”, because ' + cls.name
          + ' is graded on total points.'
        : 'It counts for nothing until you give it one.');
  }
  const sourceCat = findCategory(sourceClass, copySource ? copySource.categoryId : '');
  if (!sourceCat) {
    return 'This assignment is in no category, so this copy is not either. Pick one, or file it '
      + 'later.';
  }
  return 'Nothing here is called “' + (sourceCat.name || 'that category') + '”, so this copy goes in '
    + 'no category. Pick one, or file it later.';
}

/* What the dialog proposes for ONE target class, built when that class is ticked and thrown away
   when it is unticked — so a line never carries anything over from a time it was ticked before.

   Every value starts on the SOURCE LINE'S held value, not the document's: a teacher who fixes a slip
   on the source and then ticks another class gets the fixed date, which is what she can see. The
   category is matched by name into the target, normalised to what the target can actually hold —
   WO-3.48's third Acceptance line, the control showing what will be written. Both dates start on the
   source's, blank staying blank (WO-3.48's ruling 2, and WO-3.49's ruling 3 for `assigned`). */
function proposeCopyInto(classId) {
  const source = findAssignment(copyId);
  const target = findClass(classId);
  if (!source || !target || !copySource) return null;
  return {
    classId,
    categoryId: matchCategory(target, findCategory(findClass(source.classId), copySource.categoryId)),
    assigned: copySource.assigned,
    due: copySource.due,
    touched: { categoryId: false, assigned: false, due: false },
  };
}

/* The classes this dialog offers: every active class but the source's own, in the class manager's
   order (rulings 1 and 7). The source heads the list on a line of its own, from either door. */
function copyOffered() {
  const source = findAssignment(copyId);
  return getActiveClasses().filter((cls) => !(source && cls.id === source.classId));
}

function copyTargetFor(classId) {
  return copyTargets.filter((t) => t.classId === classId)[0] || null;
}

/* A date as the document holds it, or '' — the one shape this dialog compares. */
function dateOf(value) { return typeof value === 'string' ? value : ''; }

/* Has the teacher changed the source on its line? Compared field by field against the document,
   which is what decides the confirm's wording (ruling 4) and which fields the confirm writes. */
function sourceEdits(source) {
  const edits = {};
  if (!copySource || !source) return edits;
  if (copySource.categoryId !== (source.categoryId || '')) edits.categoryId = copySource.categoryId;
  if (copySource.assigned !== dateOf(source.assigned)) edits.assigned = copySource.assigned;
  if (copySource.due !== dateOf(source.due)) edits.due = copySource.due;
  return edits;
}

/*
  One <select> in the copy dialog, and the rule it exists to keep: THE CONTROL SHOWS WHAT THE
  PROPOSAL HOLDS, never something else.

  A <select> with no option marked `selected` displays its first one, so a proposal of "no category"
  against a target class that HAS categories drew “Homework — 25%” while the copy was filed under
  nothing — the teacher read the dialog, tapped Copy into Period 2, and found the row under the red
  “Not in a category” banner. The same gap breaks the note's own instruction from the other side:
  the option a select is already displaying fires no `change` when it is tapped, so “Pick one” was
  unreachable for exactly the option it pointed at. An unmatched proposal therefore gets a real
  option of its own, at the top, selected — which is categoryField()'s answer above, arrived at for
  the same reason, and the two must not disagree. It appears only while the proposal is unmatched,
  so it cannot be chosen back into by accident once a category has been picked.

  One of these per ticked class and one on the source line since WO-3.49, each carrying the line it
  belongs to as its hook's value — N lines are N chances to break the rule above, and each one is
  held to it. Its label is the column head in the wide layout and the cue when the line folds, so
  the name a screen reader hears is set on the control itself and names the class.
*/
function copyCategoryCell(hook, value, cls, selected, ariaLabel) {
  const cell = copyCell('Category', 'label');
  const select = document.createElement('select');
  select.className = 'assign-field-select';
  select.setAttribute(hook, value);
  select.setAttribute('aria-label', ariaLabel);
  /* The target's weight beside each name, unless the class is graded on total points, where it is
     not a fact about the grade (WO-3.34) — the same rule as the editor's own picker. */
  const options = categoriesOf(cls).map((c) => ({
    value: c.id,
    label: (c.name || 'Untitled category') + (gradingModeOf(cls) === 'points' ? ''
      : ' — ' + formatWeight(Number(c.weight) || 0) + '%'),
  }));
  if (!options.length) {
    const none = document.createElement('option');
    none.value = '';
    none.textContent = cls.name + ' has no categories yet';
    select.append(none);
    select.disabled = true;
  } else if (!options.some((opt) => opt.value === selected)) {
    const none = document.createElement('option');
    none.value = '';
    none.textContent = '— choose a category —';
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
  cell.append(select);
  return cell;
}

/* A field cell of the list: its cue, shown only when the line folds (the column heads say it
   otherwise), and whatever control goes in it. */
function copyCell(cue, tag) {
  const cell = document.createElement(tag || 'div');
  cell.className = 'assign-copy-cell';
  const said = document.createElement('span');
  said.className = 'assign-copy-cue';
  said.setAttribute('aria-hidden', 'true');
  said.textContent = cue;
  cell.append(said);
  return cell;
}

/* One date input in the list. It shows what the line holds and decides nothing; the source's date
   arrived on a target line in proposeCopyInto(), and nothing here falls back to today. */
function copyDateInput(hook, value, date, ariaLabel) {
  const input = document.createElement('input');
  input.className = 'assign-field-date';
  input.type = 'date';
  input.value = date;
  input.setAttribute(hook, value);
  input.setAttribute('aria-label', ariaLabel);
  return input;
}

/* A date cell: the field and the Clear beside it (WO-1.48's answer, for WO-1.48's reason — a native
   date input reports '' both half typed and deliberately emptied, so emptying is a button rather
   than an inference). `[data-date-field]` is on the pair's own box, so src/shell.js's one Clear
   route finds exactly this input and no other on the line. */
function copyDateCell(cue, hook, value, date, ariaLabel, clearLabel) {
  const cell = copyCell(cue);
  const pair = document.createElement('div');
  pair.className = 'assign-copy-due';
  pair.setAttribute('data-date-field', '');
  pair.append(copyDateInput(hook, value, date, ariaLabel));
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'class-action-btn date-clear';
  clear.setAttribute('data-date-clear', '');
  clear.setAttribute('aria-label', clearLabel);
  clear.textContent = 'Clear';
  pair.append(clear);
  cell.append(pair);
  return cell;
}

/* A class's name with the quiet line under it. textContent throughout: a class name is typed by a
   teacher. */
function copyNameBlock(name, sub, subHook, subValue) {
  const wrap = document.createElement('span');
  wrap.className = 'assign-copy-name';
  wrap.append(document.createTextNode(name));
  if (sub !== null) {
    const quiet = document.createElement('span');
    quiet.className = 'assign-copy-sub';
    if (subHook) quiet.setAttribute(subHook, subValue);
    quiet.textContent = sub;
    wrap.append(quiet);
  }
  return wrap;
}

/* The amber lines under one line, rebuilt in place: the placement first, because it is what keeps
   the confirm disabled, then the category. A <div> rather than the drawing's <p>, because
   `.modal-body p` in src/shell.css outranks a single class and would turn the amber grey. */
function paintLineFlags(line, target, cls, sourceClass, place) {
  Array.prototype.slice.call(line.querySelectorAll('[data-assignment-copy-flag]'))
    .forEach((el) => el.remove());
  [placementFlag(place, cls), categoryFlag(target, cls, sourceClass)].forEach((said) => {
    if (!said) return;
    const flag = document.createElement('div');
    flag.className = 'assign-copy-flag';
    flag.setAttribute('data-assignment-copy-flag', cls.id);
    flag.textContent = said;
    line.append(flag);
  });
}

/*
  WHERE THE SOURCE'S HELD DATES WOULD PUT IT (WO-3.50, ruling 6, lifting WO-3.49's ruling 5): the
  editor's rule exactly, asked through the same placeByTypedDates() — and, as in the editor, only once a
  date on the line has CHANGED (ruling 5), so a source opened and copied unchanged keeps its term
  whatever its dates say.

  WORKED OUT AS THE LINE IS DRAWN AND AGAIN AT THE CONFIRM, the way every other line on this list is
  (copyPlacement()), and for the same reason: nothing here writes before the confirm, so the sub-line
  under the source is a proposal said out loud, not a write made per keystroke — ruling 2's danger is
  a row leaving the list behind the dialog while a date is half typed, and nothing leaves anything
  until the confirm. It is also how ruling 4 reaches this dialog: a source move that carries scores
  says so on the source's own amber line before the button that makes it.
*/
function sourcePlan(source) {
  if (!copySource || !source) return { kind: 'none', fill: '' };
  if (copySource.assigned === dateOf(source.assigned) && copySource.due === dateOf(source.due)) {
    return { kind: 'none', fill: '' };
  }
  return placeByTypedDates(source.classId, source.termId, copySource.assigned, copySource.due);
}

/* The quiet line under the source's name: its term, and where saving will move it. */
function sourceSub(source, sourceClass) {
  const term = termOf(sourceClass.id, source.termId);
  const plan = sourcePlan(source);
  return 'this assignment' + (term ? ' · ' + termName(term) : '')
    + (plan.kind === 'move' ? ' · moves to ' + termName(plan.term) + ' on saving' : '');
}

/* The source's amber lines: a move, with the scores it carries; or dates no term holds. Rebuilt in
   place, under their own hook so a target line's repaint never takes them. */
function paintSourceFlags(line, source, sourceClass) {
  Array.prototype.slice.call(line.querySelectorAll('[data-assignment-copy-source-flag]'))
    .forEach((el) => el.remove());
  const plan = sourcePlan(source);
  const from = termOf(sourceClass.id, source.termId);
  let said = '';
  if (plan.kind === 'move') {
    const scores = scoresCarried(source, sourceClass);
    said = 'Saving moves this assignment from ' + termName(from) + ' to ' + termName(plan.term) + ', '
      + (plan.fill ? 'the term its assigned date is in: with no due date, it takes that date as one'
        : 'the term its due date is in') + '.'
      + (scores ? ' Its ' + plural(scores, 'score goes', 'scores go') + ' with it: ' + termName(from)
        + '’s grades stop counting ' + (scores === 1 ? 'it' : 'them') + ' and ' + termName(plan.term)
        + '’s start. If ' + termName(from) + '’s grades are already in the SIS, they will no longer '
        + 'match.' : '');
  } else if (plan.kind === 'unplaced') {
    said = (plan.why === 'no-date' ? 'With no due date and no assigned date'
      : (plan.by === 'due' ? 'Its due date, ' : 'With no due date, its assigned date, ')
        + shortDate(plan.date) + ', ' + gapWords(plan.gap) + ', so')
      + (plan.why === 'no-date' ? ', no term holds it, so' : '')
      + ' saving keeps it in ' + termName(from) + '.';
  }
  if (!said) return;
  const flag = document.createElement('div');
  flag.className = 'assign-copy-flag';
  flag.setAttribute('data-assignment-copy-source-flag', '');
  flag.textContent = said;
  line.append(flag);
}

/* The source's own line: no tick, its term — and where its held dates will move it on saving, since
   WO-3.50 — and its category and dates as live fields over the HELD values. */
function sourceLine(source, sourceClass) {
  const line = document.createElement('div');
  line.className = 'assign-copy-line source';
  line.setAttribute('data-assignment-copy-line', sourceClass.id);
  line.setAttribute('data-assignment-copy-source-line', '');
  const ref = document.createElement('div');
  ref.className = 'assign-copy-ref';
  ref.append(copyNameBlock(sourceClass.name, sourceSub(source, sourceClass),
    'data-assignment-copy-source-sub', ''));
  line.append(ref);
  line.append(copyCategoryCell('data-assignment-copy-source', 'categoryId', sourceClass,
    copySource.categoryId, 'Category — this assignment, in ' + sourceClass.name));
  line.append(copyDateCell('Assigned', 'data-assignment-copy-source', 'assigned', copySource.assigned,
    'Assigned — this assignment, in ' + sourceClass.name, 'Clear the assigned date — this assignment'));
  line.append(copyDateCell('Due', 'data-assignment-copy-source', 'due', copySource.due,
    'Due — this assignment, in ' + sourceClass.name, 'Clear the due date — this assignment'));
  paintSourceFlags(line, source, sourceClass);
  return line;
}

/* The tick IS the class name: one control, the whole first cell, pressed or not (ruling 1). */
function copyTick(cls, on, sub) {
  const tick = document.createElement('button');
  tick.type = 'button';
  tick.className = 'assign-copy-tick';
  tick.setAttribute('data-assignment-copy-class', cls.id);
  tick.setAttribute('aria-pressed', on ? 'true' : 'false');
  const box = document.createElement('span');
  box.className = 'assign-copy-box';
  box.setAttribute('aria-hidden', 'true');
  box.textContent = on ? '✓' : '';
  tick.append(box);
  tick.append(copyNameBlock(cls.name, sub, 'data-assignment-copy-sub', cls.id));
  return tick;
}

function targetLine(cls, target, sourceClass) {
  const line = document.createElement('div');
  line.setAttribute('data-assignment-copy-line', cls.id);
  if (!target) {
    /* Unticked: the name and *Not copied*, one short line, so ticking it does not move the rest. */
    line.className = 'assign-copy-line off';
    line.append(copyTick(cls, false, null));
    const skip = document.createElement('span');
    skip.className = 'assign-copy-skip';
    skip.textContent = 'Not copied';
    line.append(skip);
    return line;
  }
  const place = copyPlacement(cls.id, target.assigned, target.due);
  line.className = 'assign-copy-line on';
  line.append(copyTick(cls, true, placementSub(place)));
  line.append(copyCategoryCell('data-assignment-copy-category', cls.id, cls, target.categoryId,
    'Category — the copy in ' + cls.name));
  line.append(copyDateCell('Assigned', 'data-assignment-copy-assigned', cls.id, target.assigned,
    'Assigned — the copy in ' + cls.name, 'Clear the assigned date — the copy in ' + cls.name));
  line.append(copyDateCell('Due', 'data-assignment-copy-due', cls.id, target.due,
    'Due — the copy in ' + cls.name, 'Clear the due date — the copy in ' + cls.name));
  paintLineFlags(line, target, cls, sourceClass, place);
  return line;
}

function renderCopyFields() {
  const box = document.getElementById(COPY_FIELDS_ID);
  if (!box) return;
  box.textContent = '';
  if (!findAssignment(copyId)) return;

  /* THE NAME, ONCE, ABOVE THE LIST: it applies to every copy (WO-3.48's second deliverable). */
  const row = document.createElement('div');
  row.className = 'assign-field-row';
  const nameWrap = fieldWrap(copyTargets.length > 1 ? 'Name of each copy' : 'Name of the copy', true);
  const name = document.createElement('input');
  name.className = 'assign-field-input';
  name.type = 'text';
  name.value = copyName;
  name.setAttribute('data-assignment-copy-name', '');
  name.setAttribute('autocomplete', 'off');
  nameWrap.append(name);
  row.append(nameWrap);
  box.append(row);
}

/* THE LIST (WO-3.49, ruling 1): the column heads written once, the source, then one line per class
   it could go into, ticked or not. Every value on a line is read off that line's own target. */
function renderCopyList() {
  const box = document.getElementById(COPY_LIST_ID);
  if (!box) return;
  box.textContent = '';
  const source = findAssignment(copyId);
  const sourceClass = source ? findClass(source.classId) : null;
  if (!source || !sourceClass || !copySource) return;

  const heads = document.createElement('div');
  heads.className = 'assign-copy-heads';
  heads.setAttribute('aria-hidden', 'true');
  ['Class · term', 'Category', 'Assigned', 'Due'].forEach((said) => {
    const head = document.createElement('span');
    head.textContent = said;
    heads.append(head);
  });
  box.append(heads);
  box.append(sourceLine(source, sourceClass));
  copyOffered().forEach((cls) => box.append(targetLine(cls, copyTargetFor(cls.id), sourceClass)));
}

/* Can every ticked line be written? Each into a class that still exists and a term its dates find —
   and, since WO-3.56 (the owner's ruling 1), under a name: a blank one, whitespace included, would put
   a nameless copy into every ticked class, each drawing as "Untitled assignment". */
function copyLinesReady() {
  return copyTargets.length > 0 && copyTargets.every((t) => !!findClass(t.classId)
    && !!copyPlacement(t.classId, t.assigned, t.due).term);
}
function copyReady() { return copyLinesReady() && !nameIsBlank(copyName); }

/* "Period 2", "Period 2 and Period 4", "Period 2, Period 4 and Period 6". */
function listNames(names) {
  if (names.length < 2) return names.join('');
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}

/* The note under the list, and the confirm: the two things a date or a tick can change outside the
   line it was made on. */
function paintCopyFoot(source, sourceClass) {
  const note = document.getElementById(COPY_NOTE_ID);
  const button = document.getElementById(COPY_BTN_ID);
  if (note) {
    /* THE DRAWN WORDING (ruling 9), corrected by the owner at the 👤 reading. It replaced WO-3.48's
       dates note, which said the assigned date comes across as it is — false since each line has an
       assigned date of its own. What it keeps is the promise WO-3.17 cares about: nothing is re-dated
       to today. */
    const said = 'Each copy’s dates start on this one’s and can be changed on its own line. Nothing '
      + 'is re-dated to today.';
    /* THE NAME, WHEN IT IS THE ONLY REASON THE BUTTON IS OFF (WO-3.56's Deliverables). A blocked
       line already says why on its own amber line, and nothing ticked has its own sentence above, so
       this one is said only when every line could be written and the name is all that is missing. */
    const nameless = copyLinesReady() && nameIsBlank(copyName);
    note.textContent = !copyOffered().length
      ? 'There is no other class to copy this into. A second copy in ' + sourceClass.name
        + ' is made with New.'
      : !copyTargets.length ? 'Tick the classes to copy it into; nothing is ticked for you. ' + said
      : nameless ? (copyTargets.length > 1 ? 'Each copy needs a name' : 'The copy needs a name')
        + '. Type one in the name field above to copy it.'
      : said;
  }
  if (button) {
    /* DISABLED WITH NOTHING TICKED WHETHER OR NOT THE SOURCE CHANGED (ruling 4), so this is never an
       editor for the source alone — that is the editor's job, and it writes as it is typed. */
    button.disabled = !copyReady();
    const only = copyTargets.length === 1 ? findClass(copyTargets[0].classId) : null;
    const into = only ? 'copy into ' + only.name
      : copyTargets.length > 1 ? 'copy into ' + copyTargets.length + ' classes'
      : 'copy into other classes';
    const saving = Object.keys(sourceEdits(source)).length > 0;
    button.textContent = saving ? 'Save ' + sourceClass.name + ' and ' + into
      : into.charAt(0).toUpperCase() + into.slice(1);
  }
}

function renderCopy() {
  const source = findAssignment(copyId);
  const sourceClass = source ? findClass(source.classId) : null;
  const title = document.getElementById(COPY_TITLE_ID);
  const lead = document.getElementById(COPY_LEAD_ID);
  if (!source || !sourceClass) return;

  if (title) title.textContent = copyFromCreate ? 'Copy into other classes' : 'Duplicate this assignment';
  if (lead) {
    const named = '“' + (source.name || UNTITLED_ASSIGNMENT) + '”';
    const worth = plural(pointsOf(source), 'point', 'points');
    /* THE CREATE DOOR'S LEAD SAYS THE COPIES ARE SEPARATE (WO-3.48). That door is reached from an
       assignment still being written, and the next thing a teacher does there is often to go back
       and rename it — a copy does not follow, and expecting it to is how the same work ends up
       under two names in two classes. Shortened to the drawing's words at WO-3.49 (ruling 9). */
    lead.textContent = 'Copying ' + named + ' (' + worth + ') from ' + sourceClass.name + '. '
      + (copyFromCreate
        ? 'Each copy is its own assignment, arrives with no scores, and stays as it is if you change '
          + 'this one later.'
        : 'Each copy is its own assignment and arrives with no scores.');
  }
  renderCopyFields();
  renderCopyList();
  paintCopyFoot(source, sourceClass);
}

/*
  A DATE TYPED ON ANY LINE REPAINTS WHAT IT DECIDES AND NOT THE FIELD IT WAS TYPED INTO, for
  editAssignmentField()'s reason: rebuilding the line would take the field out from under the caret.
  What a date decides is the term under a class's name, that line's amber sentence, the confirm and
  — for a date on the source line — the value of every line still following it. So those are set in
  place, and `typed` is the one element left alone, because writing back the value a half-typed
  native date input reports ('') would empty the segments the teacher is part-way through.
*/
function paintCopyDates(typed) {
  const source = findAssignment(copyId);
  const sourceClass = source ? findClass(source.classId) : null;
  const box = document.getElementById(COPY_LIST_ID);
  if (!source || !sourceClass || !box) return;
  const own = box.querySelector('[data-assignment-copy-source-line]');
  if (own) {
    const sub = own.querySelector('[data-assignment-copy-source-sub]');
    if (sub) sub.textContent = sourceSub(source, sourceClass);
    paintSourceFlags(own, source, sourceClass);
  }
  copyTargets.forEach((target) => {
    const cls = findClass(target.classId);
    const line = box.querySelector('[data-assignment-copy-line="' + target.classId + '"]');
    if (!cls || !line) return;
    ['assigned', 'due'].forEach((field) => {
      const input = line.querySelector('[data-assignment-copy-' + field + ']');
      if (input && input !== typed && input.value !== target[field]) input.value = target[field];
    });
    const place = copyPlacement(cls.id, target.assigned, target.due);
    const sub = line.querySelector('[data-assignment-copy-sub]');
    if (sub) sub.textContent = placementSub(place);
    paintLineFlags(line, target, cls, sourceClass, place);
  });
  paintCopyFoot(source, sourceClass);
}

/* Both doors arrive here: the dialog starts with the source named, its held edits equal to the
   document, and NOTHING ticked. */
function startCopy(id, fromCreate) {
  const source = findAssignment(id);
  if (!source) return false;
  copyId = id;
  /* THE SOURCE'S OWN NAME (ruling 3), and for a source that never had one, "Untitled assignment"
     (WO-3.56, the owner's ruling 2) — the words its row already shows, now in the field as a name the
     teacher can see and type over. HELD, NOT WRITTEN (the Traps): Duplicate's Cancel promises that
     nothing reaches the document before the button, so the source takes its name in confirmCopy()'s
     update() with the copies, and never here. This is why the two doors write at different moments —
     the editor has no such promise and names on open. */
  copyName = nameIsBlank(source.name) ? UNTITLED_ASSIGNMENT : source.name;
  copyTargets = [];
  copySource = {
    categoryId: source.categoryId || '',
    assigned: dateOf(source.assigned),
    due: dateOf(source.due),
  };
  copyFromCreate = !!fromCreate;
  renderCopy();
  return true;
}

/* A row's Duplicate. */
export function openCopyEditor(id, opener) {
  if (!startCopy(id, false)) return;
  openModal(COPY_MODAL_ID, opener);
}

/*
  THE CREATE DOOR (WO-3.48): Copy into other classes…, beside the editor's Done, during a create.

  THE EDITOR CLOSES AND THE COPY DIALOG OPENS IN ITS PLACE, rather than stacking on top of it, and
  the create flow ends here. Three reasons, in the order they decided it.
  - Nothing is lost by closing. Every field in the editor is written as it is typed (the
    no-lost-draft contract in createAssignment()'s header), so the assignment the copy dialog reads
    is already the one on the editor's glass. Closing is the same act Done is.
  - The editor's Cancel must not survive the copies. It removes the assignment this flow wrote and
    announces "Nothing was added" — true before a copy is made and false after, with the copies left
    behind in other classes. Ending the flow here (`creatingId` cleared, as opening a row clears it)
    is what makes that sentence impossible to reach; the row's own Delete is still there.
  - One dialog at a time. A dialog stacked on a dialog is a thing to dismiss twice, the reason
    src/past-due.js's review is inline rather than a second modal, and Escape on the top one would
    leave a teacher in an editor she believed she had finished with.
  So Close, Escape and Cancel on the copy dialog are what they are from Duplicate — nothing written,
  including the source line's held edits — and focus goes back to the `+ New assignment` that
  started the create.
*/
export function openCopyFromCreate(follow) {
  const id = creatingId;
  if (!id || editingId !== id || !findAssignment(id)) return { wrote: false };
  /* THE DOOR CLOSES THE EDITOR, SO IT SETTLES IT FIRST (WO-3.50): a due date typed into another term
     before the tap moves the new assignment here, exactly as Done would have, and the copy dialog then
     reads the assignment where it now is. A new assignment has no scores, so this never stops on the
     move confirm; dates no term holds stop it once, and the editor says why. A blank name stops it
     every time, as it stops Done (WO-3.56 — settleEditor()'s header argues why the door refuses
     rather than handing the blank on to the copy dialog). */
  const settled = settleEditor(follow, 'copy');
  if (!settled.close) return settled;
  const opener = createOpener;
  creatingId = '';
  createOpener = null;
  closeModal(EDITOR_MODAL_ID);
  if (!startCopy(id, true)) return settled;
  openModal(COPY_MODAL_ID, opener);
  return settled;
}

/* A tick: ticks the class if it is not ticked, with a fresh proposal of its own, and unticks it —
   dropping that proposal, so a line put back later starts again rather than remembering. */
export function setCopyClass(classId) {
  if (!findClass(classId)) return;
  if (!copyOffered().some((cls) => cls.id === classId)) return;
  if (copyTargetFor(classId)) {
    copyTargets = copyTargets.filter((t) => t.classId !== classId);
  } else {
    const proposal = proposeCopyInto(classId);
    if (!proposal) return;
    const order = copyOffered().map((cls) => cls.id);
    copyTargets = copyTargets.concat([proposal])
      .sort((a, b) => order.indexOf(a.classId) - order.indexOf(b.classId));
  }
  renderCopy();
}

/* One line's category picker. Writes nothing to the document; the line it is on is now the
   teacher's, so a later change to the source's category leaves it where she put it. */
export function setCopyCategory(select) {
  const target = copyTargetFor(select.getAttribute('data-assignment-copy-category'));
  if (!target) return;
  target.categoryId = select.value;
  target.touched.categoryId = true;
  renderCopy();
}

/* One line's assigned or due date, as it is typed or picked (ruling 3): that line's copy only, and
   the other date on the line stays where it was. The empty value a half-typed date reports is taken
   as it comes, because this is a proposal — the line's Clear is what empties it on purpose. */
export function setCopyDate(input) {
  const field = input.hasAttribute('data-assignment-copy-assigned') ? 'assigned' : 'due';
  const target = copyTargetFor(input.getAttribute('data-assignment-copy-' + field));
  if (!target) return;
  target[field] = input.value;
  target.touched[field] = true;
  paintCopyDates(input);
}

/*
  THE SOURCE LINE (ruling 4): held, never written as typed, and followed (ruling 6).

  A line whose flag for that field is still clear is still showing the source's old value — it was
  proposed from it and the teacher has not touched it — so it takes the new one. A line she changed
  keeps hers. Each field follows separately: moving the source's due date moves no assigned date.

  The category follows by NAME, the way it was matched when the line was ticked, which is the only
  thing following can mean across classes — and it is the same rule rather than a new one: without
  it, a line ticked before a slip on the source's category was fixed would keep the slip, and its
  amber sentence would name a category it was never matched against. (Ruling 6 names the dates; the
  category is this file's reading of it, and the result file says so.)
*/
export function setCopySource(el) {
  const field = el.getAttribute('data-assignment-copy-source');
  const source = findAssignment(copyId);
  if (!copySource || !source || ['categoryId', 'assigned', 'due'].indexOf(field) === -1) return;
  copySource[field] = el.value;
  const sourceCat = findCategory(findClass(source.classId), copySource.categoryId);
  copyTargets.forEach((target) => {
    if (target.touched[field]) return;
    target[field] = field === 'categoryId'
      ? matchCategory(findClass(target.classId), sourceCat) : copySource[field];
  });
  /* A select has no caret to lose, so the category redraws the list; a date repaints in place. */
  if (field === 'categoryId') renderCopy();
  else paintCopyDates(el);
}

/* A Clear on any line: empties that one date and replaces the element, for the WebKit reason
   assignmentDateCleared() gives — a cleared picker otherwise keeps the old day highlighted. On the
   source line it is a change like any other, so the lines following it empty too.

   Not called `*DateCleared`, as WO-3.48's copyDueCleared() was not: tools/wo-sweep.mjs § 23 counts
   exactly five of those, one per module that writes a date into the document, and this one writes
   nothing — it moves a proposal. It is still reached from src/shell.js's clearDateField() and from
   nowhere else. */
export function copyFieldCleared(input) {
  const sourceField = input.getAttribute('data-assignment-copy-source');
  const field = sourceField || (input.hasAttribute('data-assignment-copy-assigned') ? 'assigned' : 'due');
  const hook = sourceField ? 'data-assignment-copy-source' : 'data-assignment-copy-' + field;
  const fresh = copyDateInput(hook, input.getAttribute(hook), '', input.getAttribute('aria-label'));
  input.replaceWith(fresh);
  if (sourceField) { setCopySource(fresh); return; }
  setCopyDate(fresh);
}

/* The name is read as it is typed and the panel is NOT re-rendered for it, for the reason
   editAssignmentField() gives: rebuilding the fields would take the caret out of the one being
   typed into. Nothing is written to the document here — this is a proposal until the button. */
export function setCopyName(input) {
  copyName = input.value;
  /* ...but the FOOT is repainted (WO-3.56, ruling 1): the button enables and disables as the name is
     typed, and the note says why when the name is the reason. paintCopyFoot() touches neither field. */
  const source = findAssignment(copyId);
  const sourceClass = source ? findClass(source.classId) : null;
  if (source && sourceClass) paintCopyFoot(source, sourceClass);
}

/*
  The copies themselves, and the only lines in this section that write anything.

  A NEW ID PER COPY, EACH LINE'S OWN classId / categoryId / assigned / due, THE TERM ITS DATES PICK,
  AND NO SCORES. `scores` is keyed by assignment id (docs/data-model.md), so a fresh id has no column
  and there is nothing to avoid copying — the absence is structural rather than something this
  function remembers not to do. Every copy is an independent assignment: there is no structure
  several classes point at, and the grade math never hears that a copy was one (WO-3.48's first
  standing rule).

  THE TERM IS DERIVED HERE, AGAIN, from the dates about to be written (WO-3.49's Traps). The term
  under a class's name was drawn from the same function, but a term carried from the paint into the
  write is the defect this work order exists to remove wearing a different coat.

  BUILT FROM NAMED FIELDS AND NEVER BY SPREADING THE SOURCE. A spread would carry whatever a later
  build adds to an assignment, and WO-3.46's `held` / `committedAt` are the ones already booked:
  a copy is live whatever its source is (that work order's ruling 4), and naming the fields is what
  makes that true here without this function having to know they exist.

  ALL OF IT IN ONE update(), the source's held edits included, so three classes and a fixed slip are
  one save and one `rev`, and a refusal below — any ticked line no date can place — writes none of
  them rather than some. Since WO-3.50 the source's `termId` is written here too, when its held due
  date picks another term (that work order's ruling 6, which lifted WO-3.49's ruling 5).
*/
export function confirmCopy(follow) {
  const source = findAssignment(copyId);
  const sourceClass = source ? findClass(source.classId) : null;
  if (!source || !sourceClass || !copySource) { closeModal(COPY_MODAL_ID); return; }
  /* Nothing ticked is not a way to save the source alone (ruling 4): the button is disabled, and a
     press that reached here anyway writes nothing and leaves the dialog where it is. */
  if (!copyTargets.length) return;
  /* Nor is a blank name (WO-3.56, ruling 1): disabled too, and refused here for the same reason. */
  if (nameIsBlank(copyName)) return;
  const placed = copyTargets.map((target) => ({
    target, cls: findClass(target.classId),
    place: copyPlacement(target.classId, target.assigned, target.due),
  }));
  if (placed.some((p) => !p.cls || !p.place.term)) return;

  const edits = sourceEdits(source);
  /* A held category the source's class does not hold is not written — the same check every copy's
     category takes below — and the source keeps what it had. */
  if ('categoryId' in edits && edits.categoryId && !findCategory(sourceClass, edits.categoryId)) {
    delete edits.categoryId;
  }
  /* THE SOURCE MOVES WITH ITS DUE DATE (WO-3.50, ruling 6), worked out again here from the held dates
     about to be written, and written in this same update() — a blank due date taking the assigned one
     (ruling 3), and the term the due date then picks. A source whose dates did not change keeps its
     term (ruling 5), and so does one no term holds; the line has said which before this button. */
  const placing = sourcePlan(source);
  const fromTerm = termOf(sourceClass.id, source.termId);
  if (placing.fill) edits.due = placing.fill;
  if (placing.kind === 'move') edits.termId = placing.term.id;
  const copies = placed.map(({ target, cls, place }) => ({
    id: newId('a'),
    classId: cls.id,
    termId: place.term.id,
    /* The target's own category id or none, checked against THAT class — never the source's id. */
    categoryId: target.categoryId && findCategory(cls, target.categoryId) ? target.categoryId : '',
    name: copyName,
    points: source.points,
    /* EACH DATE AS ITS LINE SHOWS IT — DELIBERATELY NEVER TODAY. WO-3.17 gives a new assignment
       today in both fields; this is the other creation path in this file and it was weighed against
       that one rather than left unconsidered. Two reasons it goes the other way, and both survive
       WO-3.48 and WO-3.49. The dialog tells the teacher in words that each copy's dates start on
       this one's before she taps the button, and a control that quietly re-dated its copy would be
       contradicting its own printed promise — the same fault the hint in index.html was carrying and
       that work order fixed. And a copy that dropped a date the teacher had already set is a form to
       fill in twice, which is the cost this control exists to remove. What the two later work orders
       changed is only who decides each date: both start on the source's, blank staying blank, and
       the teacher may change either per class on that class's line. */
    assigned: target.assigned,
    due: target.due,
  }));
  update((doc) => {
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    const live = doc.assignments.filter((a) => a.id === source.id)[0];
    if (live) Object.keys(edits).forEach((field) => { live[field] = edits[field]; });
    /* A NAMELESS SOURCE TAKES THE NAME ITS COPIES TAKE, IN THIS SAME update() (WO-3.56, ruling 2 and
       Acceptance 4): the name ruling 2 held when the dialog opened, written now and only now. The
       copies' name and not a second "Untitled assignment": the field opened on those words, and if
       the teacher typed over them she was naming this work — the same name in every period is what
       ruling 3 says she means, and a source left under the old words beside copies under hers would
       be the one period that disagrees. Kept out of sourceEdits() on purpose, so the button does not
       start saying "Save …" for a name the teacher never asked to save. */
    if (live && nameIsBlank(live.name)) live.name = copyName;
    copies.forEach((copy) => doc.assignments.push(copy));
  });

  const names = copies.map((copy) => findClass(copy.classId).name);
  const saved = Object.keys(edits).length > 0;
  const moved = 'termId' in edits ? placing.term : null;
  copyId = '';
  copyTargets = [];
  copySource = null;
  closeModal(COPY_MODAL_ID);
  /* A MOVED SOURCE TAKES THE LIST WITH IT, as an edit in the editor does (ruling 1's "the list moves
     to that term and says so"), when its class is the one on screen behind the dialog. */
  const selected = getSelectedClass();
  if (moved && follow && selected && selected.id === sourceClass.id) {
    selectTerm(moved.id);
    listNote = { classId: sourceClass.id, termId: moved.id,
      text: '“' + (source.name || UNTITLED_ASSIGNMENT) + '” moved here from ' + termName(fromTerm)
        + ' when it was saved with its copies: its due date, ' + shortDate(edits.due || source.due)
        + ', is in ' + termName(moved) + ', and the due date picks the term.' };
  }
  renderAssignments();
  /* THE ANNOUNCEMENT NAMES THE SOURCE WHEN IT WAS SAVED (WO-3.49's Deliverables): a teacher who
     fixed a slip on the source line hears that the fix landed, not only that copies were made — and,
     since WO-3.50, where it went when its due date moved it. */
  announce((saved ? 'Saved ' + (source.name || 'the assignment') + ' in ' + sourceClass.name
    + (moved ? ', moved it to ' + termName(moved) + ' by its due date' : '')
    + ', and copied ' : 'Copied ') + (copyName || 'the assignment') + ' into ' + listNames(names)
    + ' with no ' + (copies.length === 1 ? 'scores on it.' : 'scores on them.'));
}

/* No. Nothing has been written, so there is nothing to undo — which is the point of proposing
   before writing rather than writing and offering an undo. The source line's held edits go with
   the rest. */
export function cancelCopy() {
  copyId = '';
  copyTargets = [];
  copySource = null;
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
    endSession();
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
