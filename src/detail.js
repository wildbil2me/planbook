/*
  One student's grade, taken apart — the screen open during a guardian conference (WO-3.7).

  ── IT IS A VIEW, AND IT IS NOT A FOURTH TAB ──

  A screen a teacher sits in front of with a parent, scrolling and pointing, is not a dialog:
  plans/gradebook-surfaces.md names this screen a view by name and the record is settled rather
  than open. So #detailView is a sibling of #homeView, #classView, #assignmentsView and #scoresView
  in <main>, toggled by `.hidden`, and there is nothing here that closes.

  IT ALSO OWNS NO NAVIGATION TARGET. The switcher above it carries three segments and this is not
  one of them (the owner, 2026-08-09): a tab you cannot enter without first choosing a student is
  either dead on a freshly-opened class or it invents a selection nobody made. You arrive from a
  NAME — the student's own name in the score grid, or the door in their attendance history — and
  the strip shows that name as a BREADCRUMB while you are standing here. src/screen-nav.js draws it
  and refuses to draw it on any other screen; this file is what sets it, because this file is the
  one that has already decided a student is on display.

  THE WAY BACK IS THE THREE SEGMENTS BESIDE THE BREADCRUMB, plus the "All classes" door in the
  panel header. There is deliberately no history stack and no "back to where you came from": this
  app has no router (src/views.js's header says why at length), and on an installed iPad PWA there
  is no browser back button on screen at all.

  ── NOTHING HERE COMPUTES A GRADE ──

  Every number on this screen comes out of src/grade-engine.js (WO-3.4), including the projections
  behind "what it would take to move" — that work order's openWork() and projectedClassGrade() were
  added for this screen rather than written into it, because a detail page that summed its own
  points is a detail page that disagrees with the grid a teacher just came from. If you find
  yourself adding up cells in this file, stop.

  What this file does own is ARRANGEMENT and ROUNDING FOR DISPLAY, and one piece of the second is
  worth knowing about: see breakdownRows(), where the contribution column is rounded so that it
  adds up to the total printed under it.

  ── NO SUPPORT DATA REACHES THIS FILE, IN EITHER MODE ──

  There is no import of src/supports.js here and no path to `student.supports` — no accommodation,
  no medical need, no plan, no case manager. That is the same posture src/attendance-report.js
  takes and it is stronger than "presentation-mode safe": WO-3.7's fourth acceptance line is about
  the mode, and its eighth is about the printout and the CSV in BOTH modes, full stop. An
  implementation that read those fields and hid them behind the visibility switch would satisfy the
  first and still be a one-tap disclosure the day somebody flips the switch back. So the data never
  arrives, which makes the mode question trivially true instead of conditionally true.

  THE DRAWING HAS AN INDICATOR AND THIS SCREEN DOES NOT, deliberately, and it is a departure worth
  naming at the point it happens. design/mockups/student.html draws a `.detail-support-btn` — a
  neutral dot and a count — and its own caption calls it the most sensitive control in the
  gradebook. It is not built here for two reasons. It is not in this work order's deliverables; and
  the same screen carries a print surface and a CSV, so building it would put the one module that
  writes a sheet for a guardian to take home in reach of the one block of data that must never be on
  one. src/scores.js made the identical call for the identical reason (its decision 5): the safest
  form of the rule on a screen teachers project is to have nothing to suppress. If a later work
  order wants the indicator here, it goes through src/supports.js like every other surface, it adds
  this screen's repaint to src/shell.js's flipPresentationMode(), and it will have to answer what
  the print and CSV paths do about it first.

  AND WO-2.26 SPENT NONE OF THAT EITHER, which is worth its own paragraph because it is the one
  change to this file that could have. The hall-pass card in the right-hand column is drawn by
  src/pass-history.js's studentPassCard(), which is handed a class id, a student id and the open
  term and hands back an element this file appends without looking inside it. That is the
  arrangement src/assignments.js has with src/accommodation-prompt.js, and the one
  src/attendance-report.js's own header records at the same seam: the host owns the surface, the
  module that has to ask owns the rule. It is worth the import because the alternatives were both
  worse and both were tried on paper first — a card built here would have had to ask whether
  presentation mode is on, which is a question only src/supports.js answers and which this file may
  not ask; and a list of trips counted here would be a second walk over a log this file cannot see.
  So this file asks nobody. What crosses the import is two ids and a term, and what comes back is
  DOM. There is still no import of src/supports.js here, still no path to `student.supports`, and
  the paragraph above is still true of the printed page and the CSV in both modes. The one thing
  this DOES oblige, and it is on the list at src/shell.js's flipPresentationMode(): a screen whose
  content changes with the mode has to be repainted when the mode flips, and this one now is.

  ── PRINTING A VIEW, WHICH IS A HARDER PROBLEM THAN PRINTING A DIALOG ──

  An attribute on <body> gates every rule in the @media print block. Without the gate a Ctrl+P made
  anywhere else in the app prints a blank sheet, and that regression has already happened once in
  this app.

  WHO PUTS IT THERE IS src/print-gate.js AND IT IS NOT A TIMER ANY MORE (WO-2.25). This file used to
  carry WO-2.6's arrangement verbatim — set it, print, clear it 500ms later — and that is how one
  bug came to live in three places: the owner printed the whole app off the grade sheet twice over
  on 2026-08-12, because a refused print() does not block and a preview turned to landscape
  re-generates from the live DOM. The gate is answered from a `beforeprint` listener now, at the
  moment the browser serialises the page, by asking whether this screen is the view on screen. The
  reasoning is written out once, over there; this file hands in its attribute and its predicate.

  The DIFFERENCE is where the printed thing sits. WO-2.6 prints a modal, which is a direct child of
  <body>, so `body[...] > *` hides everything and one `> #id` rule brings it back. This screen is
  inside <main>, under a panel header carrying the class tabs' worth of chrome — the title row, the
  three-tab switcher and the breadcrumb, none of which belongs on a sheet a parent takes home. So
  the print block hides one level further in as well, and the panel header wears a class of this
  screen's own (`.detail-header`) so that hiding it names nothing src/shell.css styles. The
  attribute is DIFFERENT from WO-2.6's, and that is not a second idiom: it is the same idiom with a
  second subject, because the attendance block re-shows a dialog that is not on screen here and
  sharing the attribute would print an empty page.

  AND THE HALL-PASS TRIPS PRINT WITH THE GRADE (WO-2.26's third decision, made here because this is
  where the gate is). Four reasons, in the order they decided it:

    · THE SHEET IS THE SCREEN. This app's standing rule is written into three headers — a printout
      that has left the building and disagrees with the screen it was taken from is worse than no
      printout — and a card the teacher and the guardian have just read together, silently missing
      from the page the guardian takes home, is that disagreement in its most confusing form.
    · IT IS NOT SUPPORT DATA AND CANNOT BECOME ANY. A pass is `{classId, type, out, back, minutes,
      note}` keyed by a student id; src/passes.js's header refuses to keep passes in the `log` array
      precisely so that no rule ever has to filter them, and nothing on this card comes from
      `student.supports`. The paragraph above stays true of the printed page in both modes.
    · IT IS THE CONVERSATION THE CARD WAS BOOKED OUT OF. "How often is she out of the room" is a
      question asked at the desk this sheet is printed at, and the note under the card carries the
      three clauses that stop a trip count being read as attendance.
    · AND THE MODE ANSWER STAYS ONE ANSWER. In presentation mode the card draws the sentence saying
      why it is empty, so the sheet prints that too. What prints is what is on screen, which is one
      rule rather than a second policy about paper.

  WHAT DID NOT CHANGE IS studentCsv(), and that is a boundary rather than an oversight: WO-2.26 says
  nothing about the file, and a column of trips in it is a separate decision with its own reasons on
  both sides. If it is ever wanted it is a work order, not a line here.

  ── THE FILE ──

  studentCsv() takes a model and returns bytes with no DOM in it, which is src/backup.js's own
  build-it/hand-it-over split reused for the third time; handToBrowser() is imported rather than
  copied, because the revoke delay and the one-download-per-tap rule were both paid for on the
  owner's own iPad. "The CSV opens cleanly in a spreadsheet" is otherwise a claim nobody can check
  without a spreadsheet.
*/

import { getDoc } from './store.js';
import { announce } from './live-region.js';
/* Which class and which term are open, and the avatar the roster row, the home card and the
   attendance history all already wear — imported rather than re-derived, because the colour is
   part of how a teacher recognises a person and there is one answer per student, not one per
   screen. */
import { getSelectedClass, getSelectedTerm, initials, avatarClass } from './classes.js';
/* "Mary Van Dyke" in a sentence, and "Van Dyke, Mary" on a row. One shape, owned by src/roster.js,
   worn by every screen that prints a name. */
import { fullName, rosterName } from './roster.js';
/* How a weight is written down, so this screen's "40%" and the categories panel's are the same
   string for the same number. */
import { formatWeight } from './categories.js';
/* THE ONLY GRADE ARITHMETIC IN THE APP (WO-3.4, extended for this screen at WO-3.7). */
import { nextBandFor, openWork, projectedClassGrade,
  weightedClassGrade } from './grade-engine.js';
/*
  HOW A PERCENTAGE IS WRITTEN DOWN, imported from the screen that settled it rather than copied.
  WO-3.14 made it two fixed decimal places, because the SIS carries two decimals and this number is
  re-keyed into it by hand, and that work order's own note says this screen inherits the line when
  it lands. Two formatters that have to agree is exactly the second answer this repo keeps refusing,
  and the import runs one way: nothing in src/scores.js knows this file exists.
*/
import { formatPercent } from './scores.js';
/* The attendance summary, from WO-2.4's readers and WO-2.6's formatters — the same walk the
   registry's own percentage comes out of, so the line a guardian reads here and the line above the
   grid it was taken from cannot come apart. Read-only: there is no writer in src/attendance.js
   imported below, and no path through this file changes a mark. */
import { MARKS, termTotals, percentText, plainDate, todayISO } from './attendance.js';
/* The breadcrumb this screen is the only setter of. A leaf that imports src/views.js and nothing
   else, so wearing it closes no loop. */
import { setDetailBreadcrumb } from './screen-nav.js';
/* Which view is on screen, read off the DOM by the module that owns the answer — the print gate's
   predicate below is the only caller here. src/screen-nav.js, imported just above, already imports
   src/views.js and nothing else, so naming it directly here closes no loop either. */
import { currentView } from './views.js';
/* The one way a file reaches the browser in this app. Imported rather than copied — see the header. */
import { handToBrowser } from './backup.js';
/* The print gate, and the reason this file no longer owns one: WO-2.6's mechanism was copied here
   and then copied again, so one bug lived in three places and was fixed in one (WO-2.25). */
import { registerPrintGate } from './print-gate.js';
/*
  THE HALL-PASS CARD (WO-2.26), drawn by the module that owns the pass log rather than by this one —
  the header's own paragraph says why at length, and it is the reason this is an import of a SCREEN
  where every other one above is an import of a model or a shared component.

  This file passes a class id, a student id and the open term, and appends what comes back. It never
  reads `passes`, never counts a trip, never words one, and never asks whether presentation mode is
  on — all three live behind that module, and src/supports.js behind the third. The same one-way
  arrangement src/assignments.js has with src/accommodation-prompt.js, and the one
  src/attendance-report.js records at the same seam: nothing in src/pass-history.js knows this file
  exists.
*/
import { studentPassCard } from './pass-history.js';

const NAME_ID = 'detailStudentName';
const SUBTITLE_ID = 'detailSubtitle';
const ACTIONS_ID = 'detailActions';
const CONTENT_ID = 'detailContent';
const EMPTY_ID = 'detailEmpty';

/* The attribute the @media print block keys on. One string, named once, because src/detail.css and
   this file have to agree about it and a typo would print a blank page rather than throw.

   IT STAYS THIS SURFACE'S OWN. `data-attendance-print` re-shows #attendanceRecordModal and
   `data-grades-print` re-shows #gradesRecordModal, neither of which is on screen here, so either
   one borrowed would hide the app and reveal a hidden dialog — a blank sheet by a different route.
   One mechanism, one gate per surface.

   IT IS ALSO NOT THE BUTTON'S NAME, which is `data-detail-sheet-print` in index.html. This attribute
   goes on <body> and src/shell.js's delegated hook reaches its control with `closest()`, which walks
   to <body>: one string doing both jobs matched every click on screen for as long as the gate was on.
   src/print-gate.js states the invariant; this is the surface it was found on. */
const PRINT_ATTR = 'data-detail-print';

/*
  WHOSE DETAIL IS ON SCREEN. An id and never a student object, for the reason src/scores.js gives
  about the cell the flag bar points at: the document can be replaced underneath this module by a
  restore or a year switch, and an object held across that is a person nobody has open.

  It is deliberately NOT a preference. src/views.js's REMEMBERED_AS writes every class screen down
  as `class` so that a reload lands on Attendance, and this screen is written down the same way —
  a browser that reopened on a named student's failing grade would be a disclosure the teacher did
  not ask for, on the screen most likely to be projected.
*/
let openStudentId = '';

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
  if (tag === 'th') node.setAttribute('scope', className === 'detail-break-cat' ? 'row' : 'col');
  return node;
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

/* ────────────────────────────── who is on screen ────────────────────────────── */

function rosterOf(cls) { return cls && Array.isArray(cls.roster) ? cls.roster : []; }

/* The open student, resolved against the OPEN CLASS's roster rather than against the document at
   large. A student taken off this class — or a class switched under the screen — leaves nobody
   here, which is the empty state below rather than a page of somebody else's arithmetic. */
function openStudent(cls) {
  const doc = getDoc();
  if (!cls || !openStudentId) return null;
  if (rosterOf(cls).indexOf(openStudentId) === -1) return null;
  const list = doc && Array.isArray(doc.students) ? doc.students : [];
  return list.filter((s) => s && s.id === openStudentId)[0] || null;
}

/*
  OPEN A STUDENT'S DETAIL — the whole of what a tap on a name means, minus the order of operations,
  which is src/shell.js's (this app states that in one place and this file is not it).

  It sets the breadcrumb as well as the id, because those two are one fact: src/screen-nav.js's own
  comment says the name is set by the screen that has already decided a student is on display, and
  a build where the id moved and the caption did not is a strip naming the student before last.
*/
export function openDetail(studentId) {
  openStudentId = String(studentId || '');
  const student = openStudent(getSelectedClass());
  setDetailBreadcrumb(student ? fullName(student) : '');
  return student ? fullName(student) : '';
}

/* Which student the screen is on, for src/shell.js's announcement and for nothing else. */
export function openDetailName() {
  const student = openStudent(getSelectedClass());
  return student ? fullName(student) : '';
}

/* ────────────────────────────── the breakdown ──────────────────────────────

   Every category, its weight, what the student earned in it, and what that contributes to the
   number in the hero. WO-3.7's first acceptance line is that the contributions SUM to the displayed
   overall grade, and this table is where a guardian gets to see the arithmetic rather than be told
   it — so the sum has to hold as PRINTED, not as computed. */

/*
  THE CONTRIBUTION COLUMN, ROUNDED SO THAT IT ADDS UP.

  Rounding each contribution on its own and printing the engine's own total under them does not
  work, and the reason is arithmetic rather than sloppiness: five numbers each rounded to two places
  carry up to half a cent of error apiece, so the column misses the total by a cent something like
  half the time. A guardian who adds the column up and gets a different number from the one in the
  footer has been handed a page that is wrong in the only way that matters here.

  So the cents are allocated by largest remainder, which is what any table of parts and a total
  does: floor every contribution to a cent, then hand the cents that are left over to the rows with
  the biggest fractional part. The column sums to the footer exactly, and no cell is more than a
  cent from its own weight x percentage. The alternative — printing more decimals until the problem
  goes away — makes a conference screen unreadable, and WO-3.14 settled two places for the whole app
  because that is what the SIS takes.
*/
function contributionCents(categories, percentage) {
  const active = categories.filter((c) => c.contribution !== null);
  const floors = active.map((c) => Math.floor(c.contribution * 100));
  const remainders = active.map((c, i) => ({ i: i, r: c.contribution * 100 - floors[i] }));
  const totalCents = Math.round(percentage * 100);
  let left = totalCents - floors.reduce((sum, n) => sum + n, 0);
  remainders.sort((a, b) => b.r - a.r);
  const out = floors.slice();
  for (let n = 0; n < remainders.length && left > 0; n++) { out[remainders[n].i] += 1; left -= 1; }
  /* A leftover that is still non-zero after one cent per row is unreachable with real weights and
     is absorbed by the largest contribution rather than dropped, so the column still sums. */
  if (left !== 0 && out.length) {
    let big = 0;
    out.forEach((v, i) => { if (v > out[big]) big = i; });
    out[big] += left;
  }
  const byId = {};
  active.forEach((c, i) => { byId[c.id] = out[i]; });
  return byId;
}

function cents(n) { return (n / 100).toFixed(2); }

function breakdown(grade) {
  const card = el('div', 'detail-card');
  card.append(el('div', 'detail-card-title', 'Where the grade comes from'));

  const table = el('table', 'detail-break');
  const thead = el('thead');
  const hrow = el('tr');
  ['Category', 'Weight', 'Earned', 'Category %', 'Counts at', 'Contributes'].forEach((label, i) => {
    hrow.append(cell('th', i === 0 ? 'detail-break-head-cat' : '', label));
  });
  thead.append(hrow);
  table.append(thead);

  const share = grade.percentage === null ? {} : contributionCents(grade.categories, grade.percentage);
  const tbody = el('tbody');
  grade.categories.forEach((category) => {
    const empty = category.percentage === null;
    const tr = el('tr', empty ? 'empty' : '');
    tr.append(cell('th', 'detail-break-cat', category.name || 'Untitled category'));
    tr.append(el('td', 'detail-break-weak', formatWeight(category.weight) + '%'));
    if (empty) {
      /* THE EMPTY CATEGORY IS SHOWN, NOT HIDDEN — WO-3.7's second acceptance line. Its weight
         redistributes across the categories that have work rather than counting as a zero, and the
         row says so in the caution wash. A hidden row is how a teacher concludes the app lost an
         assignment, and a row printed as 0% is how a guardian concludes a student scored nothing. */
      const say = el('td', 'detail-break-redist',
        'nothing graded in it yet — its ' + formatWeight(category.weight)
          + '% is shared across the others');
      say.setAttribute('colspan', '3');
      tr.append(say);
      tr.append(el('td', 'detail-break-num', '—'));
    } else {
      tr.append(el('td', 'detail-break-weak', category.earned + ' / ' + category.possible));
      tr.append(el('td', 'detail-break-num', formatPercent(category.percentage)));
      /* WHAT THE WEIGHT ACTUALLY COUNTS AT once the empty categories have given their share back.
         Printed rather than left implicit, because "40%" beside a contribution that is not 40% of
         anything on the row is the question this column exists to answer. */
      tr.append(el('td', 'detail-break-weak', formatWeight(category.effectiveWeight) + '%'));
      tr.append(el('td', 'detail-break-num', cents(share[category.id] || 0)));
    }
    tbody.append(tr);
  });
  table.append(tbody);

  const tfoot = el('tfoot');
  const frow = el('tr');
  frow.append(cell('th', 'detail-break-cat', 'Overall'));
  frow.append(el('td', 'detail-break-weak', formatWeight(grade.weightTotal) + '%'));
  frow.append(el('td', '', ''));
  frow.append(el('td', '', ''));
  frow.append(el('td', '', ''));
  frow.append(el('td', 'detail-break-num',
    grade.percentage === null ? '—' : formatPercent(grade.percentage)));
  tfoot.append(frow);
  table.append(tfoot);
  card.append(table);

  card.append(el('p', 'detail-card-note',
    'The last column adds up to the overall grade. A category with nothing graded in it does not '
      + 'count as a zero — its weight is shared out across the categories that do have work, which '
      + 'is why the “counts at” column can differ from the weight beside it.'));
  return card;
}

/* ────────────────────────────── what is still open ────────────────────────────── */

function assignmentById(id) {
  const doc = getDoc();
  const list = doc && Array.isArray(doc.assignments) ? doc.assignments : [];
  return list.filter((a) => a && a.id === id)[0] || null;
}

function assignmentName(id) {
  const assignment = assignmentById(id);
  return (assignment && assignment.name) || 'Untitled assignment';
}

function categoryName(grade, categoryId) {
  const hit = grade.categories.filter((c) => c.id === categoryId)[0];
  return (hit && hit.name) || '';
}

function workRow(grade, row, points) {
  const line = el('div', 'detail-missing-row');
  line.append(el('span', 'detail-missing-name', assignmentName(row.id)));
  const where = categoryName(grade, row.categoryId);
  if (where) line.append(el('span', 'detail-missing-when', where));
  line.append(el('span', points ? 'detail-missing-pts' : 'detail-missing-bonus',
    points ? plural(row.points, 'pt', 'pts') : 'bonus'));
  return line;
}

function missingCard(grade, rows, person) {
  const missing = rows.filter((r) => r.state === 'missing');
  const points = missing.reduce((sum, r) => sum + r.points, 0);
  const card = el('div', 'detail-card');
  card.append(el('div', 'detail-card-title', missing.length
    ? 'Missing work · ' + plural(points, 'point', 'points') + ' at stake'
    : 'Missing work'));
  if (!missing.length) {
    card.append(el('p', 'detail-missing-none', 'Nothing is marked missing.'));
  } else {
    missing.forEach((row) => card.append(workRow(grade, row, true)));
  }
  card.append(el('p', 'detail-card-note',
    'Missing is marked by you and is never worked out from a due date, so nothing on this list '
      + 'appeared because a date rolled over. A blank score is not on this list either: blank '
      + 'means ungraded and counts toward nothing until you say otherwise. Work marked missing '
      + 'counts as zero out of its full points, which is already in ' + person + '’s grade above.'));
  return card;
}

/* ────────────────────────────── what it would take to move ────────────────────────────── */

/*
  THE FIGURE, AND WHY IT IS SOLVED RATHER THAN GUESSED AT.

  src/grade-engine.js's projectedClassGrade() is linear in the rate — its comment says why — so two
  points settle the line: the grade with nothing scored on the outstanding work, and the grade with
  full marks on it. The score needed to reach the next band is where that line crosses the band's
  boundary, and it is reproducible by hand from the three numbers this card prints.

  IT IS ROUNDED UP, not to nearest. A rate rounded down would be a figure that reads as reaching the
  band and does not, which is the one direction this card must never be wrong in — a teacher who
  promises a parent a C− on a number that lands at 69.99% has been let down by the app.

  BONUS WORK IS NAMED AND NOT FOLDED IN. "Score 75% on everything left" is meaningless for a
  zero-point assignment: 75% of nothing is nothing, so a piece of work that genuinely can move the
  grade would be sitting inside a figure it cannot move. It gets its own line instead
  (design/mockups/README.md's tenth open question, answered that way).

  NOTHING HERE INVENTS A THRESHOLD. There is no "at risk" banner, no letter, no colour that says
  whether this student is in trouble — that is Phase 4's, and a threshold decided here would be a
  second opinion about what "at risk" means before the work order that owns the first one exists.
*/
function toMoveCard(doc, cls, termId, student, grade, rows) {
  const person = fullName(student);
  const card = el('div', 'detail-move');
  card.append(el('div', 'detail-move-head', 'What it would take to move'));

  const say = (text) => card.append(el('p', '', text));

  if (grade.percentage === null) {
    card.classList.add('unreachable');
    say(grade.message || 'There is no grade yet, so there is nothing to move toward.');
    return card;
  }

  const band = nextBandFor(doc, cls, grade.percentage);
  const open = rows.filter((r) => r.state === 'open');
  const bonus = rows.filter((r) => r.state === 'bonus');
  const missing = rows.filter((r) => r.state === 'missing');
  const openPoints = open.reduce((sum, r) => sum + r.points, 0);

  const now = formatPercent(grade.percentage) + (grade.letter ? ' — a ' + grade.letter : '');
  if (!band) {
    card.classList.add('unreachable');
    say(person + ' is at ' + now + ', and there is no band above it on this class’s scale. '
      + 'There is nothing left to reach for.');
    return card;
  }

  const target = band.min;
  const targetText = formatWeight(target) + '%' + (band.letter ? ' — a ' + band.letter : '');

  if (!open.length) {
    card.classList.add('unreachable');
    say(person + ' is at ' + now + '. The next band up is ' + targetText + ', and there is no '
      + 'work outstanding to score it on: every assignment in this term has been graded, marked '
      + 'missing or excused. The grade moves when there is new work, or when a score changes.');
  } else {
    const floor = projectedClassGrade(doc, cls, termId, student.id, { outstanding: 0 });
    const ceiling = projectedClassGrade(doc, cls, termId, student.id, { outstanding: 1 });
    const spread = ceiling.percentage - floor.percentage;
    say(person + ' is at ' + now + '. The next band up is ' + targetText + '. '
      + plural(open.length, 'piece', 'pieces') + ' of work ' + (open.length === 1 ? 'is' : 'are')
      + ' still outstanding, worth ' + plural(openPoints, 'point', 'points') + ' in total: '
      + open.map((r) => assignmentName(r.id) + ' (' + plural(r.points, 'pt', 'pts') + ')').join(', ')
      + '.');
    say('Scoring nothing on ' + (open.length === 1 ? 'it' : 'them') + ' leaves '
      + formatPercent(floor.percentage) + '. Full marks makes '
      + formatPercent(ceiling.percentage) + '.');

    if (spread <= 0 || ceiling.percentage < target) {
      card.classList.add('unreachable');
      say('So ' + targetText.split(' — ')[0] + ' is out of reach with the work that remains — '
        + 'even full marks on all of it stops at ' + formatPercent(ceiling.percentage) + '. Said '
        + 'plainly rather than hidden: a conference is the wrong place to find this out.');
    } else {
      /* The rate the line crosses the boundary at, rounded UP to the two decimals everything else
         on this screen is printed to, and then the grade RE-ASKED at the rounded rate — so the two
         numbers in the sentence are consistent with each other rather than one exact and one
         displayed. */
      const exact = (target - floor.percentage) / spread;
      const rate = Math.min(1, Math.ceil(Math.max(0, exact) * 10000) / 10000);
      const lands = projectedClassGrade(doc, cls, termId, student.id, { outstanding: rate });
      say('So scoring ' + formatPercent(rate * 100) + ' on all of it lands at '
        + formatPercent(lands.percentage)
        + (lands.letter ? ', which is a ' + lands.letter : '') + '. '
        + 'The arithmetic is a straight line between those two figures, so any score in between '
        + 'lands in between.');
    }
  }

  if (missing.length) {
    const handedIn = projectedClassGrade(doc, cls, termId, student.id, { missing: 1 });
    say('Separately: ' + plural(missing.length, 'piece', 'pieces') + ' of work '
      + (missing.length === 1 ? 'is' : 'are') + ' marked missing — '
      + missing.map((r) => assignmentName(r.id)).join(', ') + '. Handing '
      + (missing.length === 1 ? 'it' : 'them') + ' in and scoring '
      + (missing.length === 1 ? 'it' : 'them') + ' in full would put the grade at '
      + formatPercent(handedIn.percentage)
      + (handedIn.letter ? ', a ' + handedIn.letter : '') + '.');
  }

  if (bonus.length) {
    say('And ' + plural(bonus.length, 'piece', 'pieces') + ' of bonus work '
      + (bonus.length === 1 ? 'is' : 'are') + ' outstanding — '
      + bonus.map((r) => assignmentName(r.id)).join(', ') + '. '
      + (bonus.length === 1 ? 'It is' : 'They are') + ' worth 0 points, so anything scored on '
      + (bonus.length === 1 ? 'it' : 'them') + ' adds to what ' + person + ' has earned without '
      + 'adding to what was possible. That is why ' + (bonus.length === 1 ? 'it is' : 'they are')
      + ' not in the figures above: a percentage of nothing is nothing.');
  }

  return card;
}

/* ────────────────────────────── attendance ────────────────────────────── */

/*
  THE SAME COUNTS THE REGISTRY PRINTS, from the same walk (WO-2.4, read through WO-2.6's
  formatters). Nothing here decides which meetings count, walks doc.attendance, or tests an
  exception — a second filter chain would agree with itself on any fixture anybody wrote and
  disagree in November.

  RECORDED MEETINGS AND NEVER CALENDAR DAYS, said out loud on the card, because a percentage with no
  denominator on a conference screen is a percentage a parent reads as days of school.
*/
function attendanceCard(cls, student, term) {
  const totals = termTotals(cls.id, student.id, term);
  const card = el('div', 'detail-card');
  card.append(el('div', 'detail-card-title', 'Attendance · ' + percentText(totals)));

  const stats = el('div', 'detail-att');
  MARKS.forEach((mark) => {
    const box = el('div', 'detail-att-stat');
    box.append(el('div', 'detail-att-num', String(totals[mark.code])));
    box.append(el('div', 'detail-att-label', mark.word));
    stats.append(box);
  });
  card.append(stats);

  const dated = !!(term && term.start && term.end);
  card.append(el('p', 'detail-att-note',
    'Out of ' + plural(totals.meetings, 'recorded meeting', 'recorded meetings')
      + (dated ? ' in ' + (term.label || 'this term') : ' — this term has no dates set, so this is '
        + 'every meeting on the year')
      + ' — not school days. A day this class did not meet, a holiday, and a day nobody has marked '
      + 'yet all count toward nothing in either direction.'));
  return card;
}

/* ────────────────────────────── the screen ────────────────────────────── */

/*
  THE SCREEN, redrawn from the open document. Called by src/shell.js after anything that changes
  what is in it and after a switch onto it — this module never subscribes to the store, for the
  reason src/classes.js gives: a subscriber fires on every save, and this screen is drawn beside a
  score grid a teacher may be typing into.
*/
export function renderDetail() {
  const doc = getDoc();
  const cls = getSelectedClass();
  const term = getSelectedTerm();
  const termId = term ? term.id : '';
  const termLabel = term ? (term.label || 'Untitled term') : '';
  const student = openStudent(cls);

  const heading = document.getElementById(NAME_ID);
  const subtitle = document.getElementById(SUBTITLE_ID);
  const actions = document.getElementById(ACTIONS_ID);
  const content = document.getElementById(CONTENT_ID);
  const empty = document.getElementById(EMPTY_ID);
  if (!content) return;
  content.textContent = '';

  /* The breadcrumb is re-set from what was actually drawn rather than from what was asked for, so a
     student who has left this class's roster takes their name off the strip on the same repaint
     that takes their arithmetic off the screen. */
  setDetailBreadcrumb(student ? fullName(student) : '');

  if (!student) {
    if (heading) heading.textContent = 'No student open';
    if (subtitle) subtitle.textContent = cls ? cls.name : '';
    if (actions) actions.classList.add('hidden');
    if (empty) {
      empty.textContent = !cls
        ? 'No class is open, so there is no student to show. Open a class first.'
        : 'That student is not on ' + cls.name + '’s roster any more, so there is nothing to show '
          + 'here. Open a student by tapping their name on the Scores screen.';
      empty.classList.remove('hidden');
    }
    return;
  }

  const person = fullName(student);
  if (heading) heading.textContent = person;
  if (subtitle) {
    subtitle.textContent = cls.name + (termLabel ? ' · ' + termLabel : '');
  }
  if (actions) actions.classList.remove('hidden');
  if (empty) { empty.textContent = ''; empty.classList.add('hidden'); }

  const grade = weightedClassGrade(doc, cls, termId, student.id);
  const rows = openWork(doc, cls, termId, student.id);

  /* ── the hero: name, grade, band — the three things a guardian looks at first ── */
  const hero = el('div', 'detail-hero');
  const avatar = el('div', 'avatar ' + avatarClass(student.id) + ' detail-avatar',
    initials(rosterName(student)));
  avatar.setAttribute('aria-hidden', 'true');
  const who = el('div', 'detail-hero-who');
  who.append(el('div', 'detail-hero-name', person));
  who.append(el('div', 'detail-hero-sub', cls.name + ' · ' + (termLabel || 'No term set')
    + ' · ' + plural(rows.filter((r) => r.state === 'open').length, 'piece', 'pieces')
    + ' outstanding · ' + plural(rows.filter((r) => r.state === 'missing').length, 'missing', 'missing')));
  hero.append(avatar, who);

  const box = el('div', 'detail-hero-grade');
  if (grade.percentage === null) {
    /* NEVER BLANK. A hero with a hole in it reads as a screen that failed to load, which is the one
       thing this page cannot afford in front of a guardian — so the em dash stands where the number
       would have been and the reason stands where the letter would have. */
    box.append(el('div', 'detail-grade-big none', '—'));
    box.append(el('div', 'detail-grade-band', 'No grade yet'));
    box.setAttribute('aria-label', 'No grade — ' + (grade.message || 'there is no grade yet.'));
  } else {
    box.append(el('div', 'detail-grade-big', formatPercent(grade.percentage)));
    const band = nextBandFor(doc, cls, grade.percentage);
    box.append(el('div', 'detail-grade-band', (grade.letter || 'no band')
      + (band ? ' · next ' + band.letter + ' at ' + formatWeight(band.min) + '%' : '')));
  }
  hero.append(box);
  content.append(hero);

  /* THE PRINTED HEADER'S SECOND LINE, and the only element on this screen that exists for the
     printer. The name, the class and the term are in the hero above and are on the sheet because
     the hero is; what a sheet needs and a screen does not is the day it came off the printer, which
     is what makes a page found in a folder next June mean anything at all. Hidden at rest by
     src/detail.css and shown by the same gated block that hides everything else. */
  content.append(el('div', 'detail-print-stamp',
    'Printed ' + plainDate(todayISO()) + ' · Planbook'));

  if (grade.percentage === null && grade.reason === 'weights-unbalanced') {
    /* § SHARED's banner, worn from src/scores.css exactly as that screen wears it: there is no
       grade at all until the weights total 100, so this is not a caveat attached to a number, it is
       the explanation standing where the number would have been. */
    const banner = el('div', 'grade-none');
    banner.append(el('span', 'grade-none-text', grade.message));
    content.append(banner);
  }

  const cols = el('div', 'detail-cols');
  const left = el('div');
  /* No breakdown at all while the weights are wrong, rather than a table of nothing. The engine
     answers `categories: []` in that state — there is no weighted average to take apart — and a
     grid of empty rows under the banner would read as a rendering fault on the screen that can
     least afford one. The banner above says what the weights come to and where to fix it. */
  if (grade.categories.length) left.append(breakdown(grade));
  left.append(toMoveCard(doc, cls, termId, student, grade, rows));
  const right = el('div');
  right.append(missingCard(grade, rows, person));
  right.append(attendanceCard(cls, student, term));
  /* AND THE TRIPS, UNDER THE ATTENDANCE THEY ARE NOT (WO-2.26). Roll Call! carries the Hall Pass
     History table inline on its Student Report (dashboard.html:4718) and this is that table, in this
     app's card grammar: `.detail-card + .detail-card` gives it attendanceCard()'s own spacing, and
     the two sit together because a teacher reading "92%" is one line away from asking how often this
     student is out of the room. The card arrives built — see the import — so the only decision made
     here is where it goes. It is the last card in the column deliberately: it is the answer to a
     follow-up question, and the grade is what the screen is for. */
  right.append(studentPassCard(cls.id, student.id, term));
  cols.append(left, right);
  content.append(cols);

  /* The sentence names what IS on the page as well as what is not, so it has to keep step with the
     page: hall passes joined grades and attendance at WO-2.26. A list that goes stale is a list that
     stops being read, and this one is the screen's own statement of the firewall in its header. */
  content.append(el('p', 'detail-note',
    'This page is grades, attendance and hall passes and nothing else. Nothing from ' + person
      + '’s support details is on it, on the printed sheet or in the CSV, in either mode — those '
      + 'live on the roster and go nowhere but your own backup file.'));
}

/* ────────────────────────────── out of the browser ────────────────────────────── */

/* WHETHER THIS SCREEN IS WHAT IS ON SCREEN, asked of the DOM every time rather than remembered from
   the tap. This is the predicate src/print-gate.js answers the attribute from; that file carries the
   reasoning, including the two ways the timer this replaced came apart.

   THE QUESTION GOES TO src/views.js RATHER THAN TO `.hidden` HERE, and that is the one difference
   from the two dialog surfaces: this screen is a view in <main>, `.hidden` on those siblings IS the
   view system (src/views.js's header), and currentView() is where this app already reads it back
   off the DOM. A second copy of "which view is showing" is exactly the second answer this repo
   keeps refusing. */
function detailOnScreen() {
  return currentView() === 'detail';
}

/* Registered at module scope, not around each print: the Ctrl+P a teacher presses while standing on
   this screen never comes through printDetail() and wants the same gate. src/shell.js imports this
   module at startup, so it is live from the first paint. */
const syncPrintGate = registerPrintGate(PRINT_ATTR, detailOnScreen);

export function printDetail() {
  const body = document.body;
  if (!body) return false;
  /* Set here as well, for an engine that fires neither event: the gate has to be on before print()
     is called, and the listeners registered above only correct it later. */
  syncPrintGate();
  window.print();
  return true;
}

/*
  WHAT THE FILE IS OF, as data. Built here rather than inside studentCsv() so that the half which
  reads the document and the half which writes bytes are two functions — src/backup.js's own split,
  reused so that the file can be asserted character by character from tools/verify-shell.mjs
  without a browser download.

  NOTHING FROM `student.supports` IS ON THIS SHAPE, and there is no path to it: what a student is to
  this model is a name, an id and their own arithmetic. See this file's header — the guarantee is
  that the data never arrives, not that it is filtered out on the way past.
*/
export function detailModel() {
  const doc = getDoc();
  const cls = getSelectedClass();
  const term = getSelectedTerm();
  const student = openStudent(cls);
  if (!doc || !cls || !student) return null;
  const termId = term ? term.id : '';
  const grade = weightedClassGrade(doc, cls, termId, student.id);
  const rows = openWork(doc, cls, termId, student.id);
  return {
    className: cls.name,
    termLabel: term ? (term.label || 'Untitled term') : '',
    first: String(student.first || ''),
    last: String(student.last || ''),
    name: rosterName(student),
    person: fullName(student),
    grade: grade,
    share: grade.percentage === null ? {} : contributionCents(grade.categories, grade.percentage),
    work: rows.map((row) => ({ name: assignmentName(row.id),
      category: categoryName(grade, row.categoryId), points: row.points, state: row.state })),
    attendance: termTotals(cls.id, student.id, term),
  };
}

/*
  THE FILE, AS TEXT, WITH NO DOM IN IT.

  Three details are load-bearing and all three are lifted from WO-2.6's recordCsv() rather than
  reasoned out again:

    - A BOM, so Excel reads the file as UTF-8. Without it a name with an accent in it arrives
      mangled and the teacher's first thought is that the app broke her roster. WO-2.6 shipped that
      BOM asserted present and never asserted USEFUL, because every name in its fixture was ASCII;
      this work order's fixture carries a name that is not, and the harness decodes the bytes as
      Windows-1252 to show what the BOM is preventing.
    - CRLF line endings, which is what the CSV convention says and what Excel is happiest with.
    - A cell is quoted only when it holds a quote, a comma or a newline, and a quote inside one is
      doubled. "Ruiz, Jr" is a real surname and it must not become two columns.

  IT IS SECTIONS RATHER THAN ONE TABLE, because one student's detail is three tables — the
  breakdown, the work, the attendance — and padding three shapes to one width would produce a sheet
  of empty columns. Each section carries its own header row and is separated by a blank line, which
  is the shape an SIS export takes and which every spreadsheet this will meet opens as written.

  THE NUMBERS ARE THE ONES ON THE SCREEN, character for character, including the contribution
  column's rounding. A file that has left the building and disagrees with the screen it was taken
  from is worse than no file.
*/
export function studentCsv(model) {
  const rows = [];
  const grade = model.grade;

  rows.push(['Planbook — student grade detail']);
  rows.push(['Student', model.last, model.first]);
  rows.push(['Class', model.className]);
  rows.push(['Term', model.termLabel]);
  /* "Overall grade" rather than "Overall", which is what the category section's own footer row is
     called eight lines down. Two rows in one file whose first cell reads the same word are two rows
     a spreadsheet formula — or a check — cannot tell apart. */
  rows.push(['Overall grade', grade.percentage === null ? '' : formatPercent(grade.percentage),
    grade.letter || '']);
  rows.push(['Exported', todayISO()]);
  rows.push([]);

  rows.push(['Category', 'Weight %', 'Earned', 'Possible', 'Category %', 'Counts at %',
    'Contributes']);
  grade.categories.forEach((category) => {
    if (category.percentage === null) {
      rows.push([category.name || 'Untitled category', formatWeight(category.weight),
        '', '', 'nothing graded — weight redistributes', '', '']);
      return;
    }
    rows.push([category.name || 'Untitled category', formatWeight(category.weight),
      category.earned, category.possible, formatPercent(category.percentage),
      formatWeight(category.effectiveWeight), cents(model.share[category.id] || 0)]);
  });
  rows.push(['Overall', formatWeight(grade.weightTotal), '', '', '', '',
    grade.percentage === null ? '' : formatPercent(grade.percentage)]);
  rows.push([]);

  rows.push(['Work', 'Category', 'Points', 'State']);
  model.work.forEach((row) => {
    rows.push([row.name, row.category, row.points,
      row.state === 'missing' ? 'marked missing'
        : row.state === 'bonus' ? 'outstanding bonus work' : 'outstanding']);
  });
  rows.push([]);

  rows.push(['Attendance', 'Count']);
  MARKS.forEach((mark) => rows.push([mark.word, model.attendance[mark.code]]));
  rows.push(['Recorded meetings', model.attendance.meetings]);
  /* Empty rather than "No recorded meetings" when there are none: a sentence in a percentage column
     is a column a spreadsheet cannot add up, and the row above it already says zero. */
  rows.push(['Attendance %',
    model.attendance.percent === null ? '' : percentText(model.attendance)]);

  const text = '﻿' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
  return { name: csvName(model), text: text };
}

function csvCell(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/*
  "Planbook Ruiz, Ana Biology I Q1 grades 2026-08-12.csv" — the same "Planbook … <what> <date>"
  family the backup files and the attendance CSV use, so the whole set sorts together in a Files
  listing and a teacher can tell at a glance which student a file is of.

  The names are typed by the teacher or pasted out of a school system and can hold anything,
  including the handful of characters iPadOS and Windows both refuse in a file name. They are
  replaced rather than stripped, so "Period 2/3" stays two numbers. Accented and non-Latin
  characters are NOT touched: they are legal in a file name on both platforms, and stripping them
  would be the app mangling a student's name on its way out — which is the thing the BOM above
  exists to prevent one layer down.
*/
function csvName(model) {
  const clean = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = ['Planbook', clean(model.name), clean(model.className)];
  if (model.termLabel) parts.push(clean(model.termLabel));
  parts.push('grades', todayISO());
  return parts.filter(Boolean).join(' ') + '.csv';
}

export function downloadDetailCsv() {
  const model = detailModel();
  if (!model) return false;
  const file = studentCsv(model);
  handToBrowser({ name: file.name,
    blob: new Blob([file.text], { type: 'text/csv;charset=utf-8' }) });
  /* Said rather than shown: this screen has no status line and does not want one — the file lands
     in the Files app or in Downloads and the browser says so itself. What a screen-reader user gets
     otherwise is a button that does nothing at all. */
  announce('Saved ' + file.name);
  return true;
}
