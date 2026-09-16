/*
  The glance page — the readers its panels draw from, and the one panel that exists only when none
  of theirs does (WO-6.7).

  ── WHAT THIS FILE IS, AND THE ONE DECISION IN IT ──

  `#homeView` is the glance page (WO-6.4, and src/home.js's own header since WO-1.10): a stack of
  panels under the class grid, in the order a teacher needs them at 7:40am — what is on the calendar
  this week, what is waiting to be graded, who needs her, and what is closing in. This file holds
  the READERS those panels draw, one per source, and each one is a call into an engine that already
  exists, handing back that engine's own records:

    weekItems()        src/calendar.js's eventsCovering() and src/calendar-derived.js's due dates
                       and term edges, today through six days on          (WO-6.1 · WO-6.2)
    queueRows()        src/grade-engine.js's openWork(), the `open` rows, one row per assignment —
                       the engine behind the card's "N to grade"          (WO-3.26)
    attentionHits()    src/signals.js's evaluate() through applyCooldown(), the `shown` half — the
                       engine behind the card's "N need you"              (WO-4.5)
    closingIn()        grades-due dates inside src/calendar.js's lead window, term edges inside it,
                       and the review COUNT through reviewDatesIn()        (WO-6.1 · WO-6.2)
    quietMiddleRows()  src/signals.js's quietMiddle(), for the door's N    (WO-4.5)

  THE DECISION IS THAT THERE IS ONE ARRAY. The quiet panel below counts these arrays, WO-6.8 and
  WO-6.4 draw rows from the same arrays, and the card on the class grid asks the same engines about
  one class at a time — so "the card says 5, the chip says 5 and the panel draws 5" is a property of
  there being one reading rather than a thing three screens agree on. WO-6.4's Traps line is about
  a second answer; this file is that line made structural.

  WHICH IS WHY THE READERS ARE THIN ON PURPOSE, AND THE TEMPTATION IS TO MAKE THEM SMART. A reader
  that filtered, ranked or re-dated on the way through would be a second engine — one file away from
  the first, agreeing with itself perfectly and disagreeing with the screen a teacher opens next.
  Nothing here computes a grade, an attendance percentage or a rule; nothing here decides whether a
  cell is "open" or a hit is "silenced" or an event "covers" a day. When a reader needed a question
  the engine did not yet answer, the question went INTO the engine: src/calendar.js gained
  eventsCovering(), gradesDueIn() and leadWindowOf() in this work order, so that a window is
  something a reader asks for rather than something it computes. If a panel later needs an ordering
  these arrays do not carry, the ordering goes in the engine too — severityOrder() and
  praiseOrder() live in src/signals.js for exactly this reason, stated at their definitions.

  ── THE QUIET PANEL, AND WHY IT IS ABOUT HOW MANY PANELS EXIST ──

  When the week, the queue, the hits and the closing-in list are ALL empty, the page draws ONE
  panel under the class grid — "Nothing needs you today" — and the other four panels DO NOT EXIST
  in the DOM, rather than existing empty. The decision is about how many panels there are, which is
  why it cannot live inside any of them as an empty state, and why it is made here, once, over the
  four readers, rather than by four panels each discovering it has nothing to say.

  IT CARRIES ITS WARRANT. A bare "nothing needs you" with nothing behind it sends a teacher off to
  check for herself, and then the page has cost her time instead of saving it. So the panel wears
  four chips saying what was looked at, in the order the missing panels would have appeared, and
  every figure on them is a window's edge, an engine's own setting, or the size of the roster the
  pass walked — never a second computation of anything an engine already answers.
  THE FOUR CHIPS ARE NOT THE CARD'S TWO: the card counts one class and this panel counts the page,
  and building the page's count by summing the cards would be the second answer at a different
  address.

  THE CLASS GRID IS NEVER PART OF THE DECISION. Whether today's attendance is done is not "something
  pending" — it is the question the home screen was built to answer, and it has an answer on a
  quiet day too. What IS a precondition is that there are classes at all: a fresh document with
  nothing in it has nothing pending because it has nothing, and the empty state on panel 1 is the
  honest sentence for that day, not this one.

  ── THE QUIET-MIDDLE DOOR IS ON THIS PANEL ──

  `The quiet middle · N` is a door onto WO-4.2's screen, landing on it scrolled to the panel WO-4.5
  built there (the owner, 2026-08-20: the quiet middle is a panel on that screen and not a surface
  of its own). On a busy day WO-6.4 puts the door in panel 4's header; on a quiet day panel 4 does
  not exist, and a door that lived only there would leave the page on exactly the day index.html's
  own comment says that list is the most useful thing on the screen. One control, two homes, never
  both at once. Its N is quietMiddle() asked of every active class's open term — the same engine
  reading src/signals-view.js's collect() takes for the head of the panel it lands on, which is
  what keeps the two from ever being one number apart.

  ── WHAT IT DOES NOT DO ──

  IT DRAWS AS IT DOES OTHERWISE UNDER A PROJECTOR, and is deliberately absent from src/shell.js's
  flipPresentationMode() redraw list for now. The chips are counts, and the card already puts
  "N need you" on the wall on the same argument — a launcher says how much is waiting and the
  surface it launches says what (the owner, 2026-08-19). Joining that list is WO-6.4's, because
  panel 4 is what changes under the flip and this row draws nothing that does. The one
  supports-derived thing a reader touches — the review count — reaches closingIn() through
  reviewDatesIn(), which already answers with an empty list while projecting: this file asks
  src/supports.js nothing, and inherits the suppression exactly as src/calendar-view.js does.

  IT WRITES NOTHING. Every import below is a reader; there is no update() and no store call.

  IT DOES NOT WEAR THE "NOT YET" LINE. design/mockups/glance.html draws the signals screen's
  `.sig-inert` sentence under the quiet panel — "four rules can't fire yet, the term has 2 so far".
  Decided against for this row at dispatch (2026-09-15): src/signals.js's inertRules() means "not
  BUILT", has answered [] since WO-4.4, and knows nothing about term length, so wearing it as
  shipped draws nothing, and composing the sentence the drawing shows would need term-length
  arithmetic no engine produces — which is exactly the arithmetic this file refuses. If the owner
  wants the line, it is an engine-side function in src/signals.js first and a one-line wear here
  second.

  ── THE COST, SAID ONCE ──

  The signals pass is the one expensive thing on the home screen, and src/home.js already runs it
  once per class for the card. The quiet decision needs it again, page-wide. Two things keep that
  honest: the three cheap arrays are read first and the pass is skipped the moment any of them is
  non-empty, so on most mornings the panel decision costs a few array walks; and on a quiet morning
  the pass runs ONCE more per class, shared between the hits and the quiet middle through one set of
  passes rather than run for each. The renderer is also silent while the grid is not the view on
  screen, for the reason src/home.js's header gives about the chip: src/shell.js chains
  refreshHome() off every attendance mark, and painting a hidden page is work nobody sees. WO-6.4
  will want the hits on every render for panel 4; whether the card's chip then reads from this
  file's array rather than asking again is a decision for that sitting, noted here so it is not
  re-derived from scratch.
*/

import { getDoc } from './store.js';
import { getActiveClasses, getOpenTermId } from './classes.js';
/* The engine behind "N to grade" — src/home.js's own import, for its own reason: nothing here looks
   at a cell, and what "not graded yet" means is decided once, over there. */
import { openWork } from './grade-engine.js';
/* The engine behind "N need you" and behind the quiet middle. Nothing here decides whether a rule
   fired, whether a hit is silenced, or who is on the third list. */
import { evaluate, applyCooldown, quietMiddle } from './signals.js';
/* The authored half of the calendar, and the lead time it owns. All four are READS. */
import { eventsCovering, gradesDueIn, leadWindowOf, shiftDays, daysBetween } from './calendar.js';
/* The derived half. Asked kind by kind rather than through derivedItemsIn(), because the panels
   these feed draw due dates and term edges and never a meeting state — which is the class grid's —
   and asking for the kinds a panel draws is choosing a question, not filtering an answer. */
import { assignmentDuesIn, termEdgesIn, reviewDatesIn } from './calendar-derived.js';
import { todayISO } from './attendance.js';
import { weekdayShortDate } from './date-text.js';
import { currentView } from './views.js';

/* The stack in #homeView (index.html) and the one panel this file draws into it. */
const STACK_ID = 'glanceStack';
const QUIET_ID = 'glanceQuiet';

/* Today through six days on — "today and this week" as a rolling seven days rather than as the
   calendar week the month grid uses, because a Friday morning's "this week" is next Thursday and
   not the two days that are left of a Sunday-anchored one. WO-6.8's panel and the quiet chip read
   the same constant. */
const WEEK_DAYS_AHEAD = 6;

/* The one record this file BUILDS rather than hands on, and it is built because a ruling says so.
   A review is a count on this page and never a name (WO-6.4, the owner, 2026-08-19, WO-1.25), so
   closingIn() hands the panel a count and the student behind it never enters this file's return
   value — the posture src/calendar-derived.js takes with reviewDatesIn(), one step further out.
   Spelled with the derived kinds' hyphen so it can sit in one list with them and be told apart by
   `kind` alone; not a `DERIVED_KINDS` value, because src/calendar-derived.js never produces it. */
export const REVIEW_COUNT = 'review-count';

/* ────────────────────────────── reading the document ──────────────────────────────

   The same two tolerances every reader in this app carries: a document can arrive without an
   array, and a roster can carry an id that names nobody. The second matters more here than it
   reads — src/home.js says why: asking openWork() about a student who does not exist would be told
   every assignment in the term is open. Ids only; a name is nothing a reader here ever needs. */
function studentsIn(doc) { return doc && Array.isArray(doc.students) ? doc.students : []; }
function rosterIdsOf(cls, doc) {
  const people = studentsIn(doc);
  const ids = cls && Array.isArray(cls.roster) ? cls.roster : [];
  return ids.filter((id) => people.some((s) => s && s.id === id));
}

/* Every active class with a term to ask about, paired with that term. WHICH TERM is the one the
   teacher has the class open on, resolved by src/classes.js for the class NAMED rather than for the
   class selected — five cards are five classes and at most one of them is the one she is standing
   in. The same map src/home.js's two counts and src/signals-view.js's collect() read, for the same
   reason. A class with no term is skipped rather than asked about nothing. */
function openTerms(doc) {
  if (!doc) return [];
  return getActiveClasses()
    .map((cls) => ({ cls: cls, termId: getOpenTermId(cls.id) }))
    .filter((pair) => !!pair.termId);
}

function weekWindow(today) {
  return { from: today, to: shiftDays(today, WEEK_DAYS_AHEAD) };
}

/* ────────────────────────────── the readers ──────────────────────────────

   Each takes nothing and reads the open document and today's date, the way src/home.js's counts
   do: these answer for the page as it stands, and a caller that could hand them a different
   document would be a caller drawing one page from two. Each returns an ARRAY, and the array is the
   engine's — records built over there, in the order they came back, with nothing added, dropped or
   re-sorted here. */

/*
  THE WEEK: everything on the calendar from today through six days on. Authored first, then due
  dates, then term edges — the fixed order src/calendar-view.js draws a cell in, and fixed rather
  than incidental for its reason: a list whose rows reshuffle between two renders is a list a
  teacher cannot learn to read. Nothing here sorts across the three halves; a panel that wants one
  date order over authored and derived together asks the engine for it.

  What is deliberately NOT in it: meeting states (panel 1's, and on a list headed "this week" they
  would be five "Taken" rows saying what the cards above already say) and review dates (a count on
  this page, under what is closing in, and never a name in a week list).
*/
export function weekItems() {
  const doc = getDoc();
  if (!doc) return [];
  const w = weekWindow(todayISO());
  return [].concat(
    eventsCovering(doc, w.from, w.to),
    assignmentDuesIn(doc, w.from, w.to),
    termEdgesIn(doc, w.from, w.to));
}

/*
  THE GRADING QUEUE: one row per assignment with ungraded work worth points in its class's open
  term, across every active class. It is src/home.js's ungradedCount() asked of the page rather
  than of one card — openWork() per roster id, the `open` rows kept, unioned per assignment — and
  every part of THAT sentence is a decision that file already argued and this one inherits:
  assignments and not cells, the open term and not the selected one, and `missing`, `bonus` and
  `excused` all outside the count because src/grade-engine.js says so at the one branch that
  decides it.

  A row carries the ids a tap-through needs, the engine's own category and points, and `open` —
  how many roster students the engine reported the assignment open for. That last number is the
  size of a list the engine handed back and nothing else; it is here so WO-6.8's panel can say "0 of
  24" without importing the engine, which its own Acceptance forbids. Ids only, never a name.
*/
export function queueRows() {
  const doc = getDoc();
  const rows = [];
  openTerms(doc).forEach(({ cls, termId }) => {
    const byAssignment = Object.create(null);
    rosterIdsOf(cls, doc).forEach((studentId) => {
      openWork(doc, cls, termId, studentId).forEach((row) => {
        if (row.state !== 'open') return;
        if (!byAssignment[row.id]) {
          byAssignment[row.id] = { classId: cls.id, termId: termId, assignmentId: row.id,
            categoryId: row.categoryId, points: row.points, open: 0 };
          rows.push(byAssignment[row.id]);
        }
        byAssignment[row.id].open += 1;
      });
    });
  });
  return rows;
}

/* ONE FULL PASS PER CLASS, before the cooldown. Built once and handed to both halves below, because
   the quiet middle wants the FULL pass — a student whose only signal is currently silenced has been
   both flagged and written to, and belongs on neither list (src/signals.js's quietMiddle() says so)
   — and running evaluate() twice per class to get the same array twice is WO-2.13's defect reached
   from a fourth direction. */
function signalPasses(doc) {
  return openTerms(doc).map(({ cls, termId }) => ({
    cls: cls, termId: termId, hits: evaluate(doc, cls, termId),
  }));
}
function shownOf(doc, passes) {
  return passes.reduce((all, pass) => all.concat(applyCooldown(doc, pass.hits).shown), []);
}
function quietOf(doc, passes) {
  return passes.reduce((all, pass) =>
    all.concat(quietMiddle(doc, pass.cls, pass.termId, { hits: pass.hits })), []);
}

/*
  WHO NEEDS ATTENTION: every hit the engine produced for every active class's open term, both
  directions, AFTER the cooldown — `applyCooldown(doc, evaluate(doc, cls, termId)).shown`, which is
  the exact reading src/home.js's attentionCount() takes for one card. Hits and not students: a hit
  carries its class, its student, its rule, its direction, its numbers and its sentence, and the
  card and WO-6.4's panel both group by student for themselves — one row per student per class, as
  src/signals-view.js's collect() does — because grouping a list is the list screen's business. The
  suppressed half is not here and not lost: it is applyCooldown()'s other array, and the screen the
  door below opens counts it at each column's foot.
*/
export function attentionHits() {
  const doc = getDoc();
  if (!doc) return [];
  return shownOf(doc, signalPasses(doc));
}

/*
  THE QUIET MIDDLE: the students no threshold will ever produce, across every active class's open
  term — src/signals.js's quietMiddle(), each class's rows in the order that function returns them.
  It exists here for the door on the quiet panel, whose N has to be the same engine reading as the
  head of the panel it lands on; it is not concatenated in any cross-class order, because the screen
  it lands on ranks that for itself and this file does not rank.
*/
export function quietMiddleRows() {
  const doc = getDoc();
  if (!doc) return [];
  return quietOf(doc, signalPasses(doc));
}

/*
  WHAT IS CLOSING IN: the grades-due dates inside their lead time, the term edges inside the same
  window, and the review COUNT inside it — one window, src/calendar.js's leadWindowOf(), because
  the lead time is the one "how far ahead do you want warning" number the teacher owns and a second
  horizon would be a second setting nobody typed. The review count rides in that window rather than
  a wider one as a decision made here for want of a ruling (WO-6.7's result file names it): the
  calendar's month grid is where a review has a date and a name, and this page says "closing in",
  not "coming up this month".

  THE REVIEW ITEM IS ONE RECORD CARRYING A NUMBER, present only when the number is not zero. It is
  the one thing this file builds — see REVIEW_COUNT above for why — and it is absent, not zero,
  while projecting, because reviewDatesIn() answers [] then and this file adds no test of its own.
*/
export function closingIn() {
  const doc = getDoc();
  if (!doc) return [];
  const w = leadWindowOf(doc, todayISO());
  const items = [].concat(
    gradesDueIn(doc, w.from, w.to),
    termEdgesIn(doc, w.from, w.to));
  const reviews = reviewDatesIn(doc, w.from, w.to).length;
  if (reviews) {
    items.push({ derived: true, kind: REVIEW_COUNT, count: reviews, from: w.from, to: w.to });
  }
  return items;
}

/* ────────────────────────────── the quiet panel ────────────────────────────── */

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/* How many students the pass looked at: every id on an active roster that names a student, each
   counted once however many classes hold them. It is the size of the set evaluate() walks and not a
   figure any engine hands back, which is why it is computed here, in the renderer's half of the
   file, and appears on a chip and nowhere else. */
function studentsLookedAt(doc, classes) {
  const seen = Object.create(null);
  classes.forEach((cls) => rosterIdsOf(cls, doc).forEach((id) => { seen[id] = true; }));
  return Object.keys(seen).length;
}

/*
  THE COPY IS HERE AND NOT IN index.html, which is a departure from the rule the install banner and
  the signals screen's three states follow, and it is the panel's own shape that forces it: this
  panel exists only on a quiet day and is created and removed with the day, so there is no static
  element in index.html for the words to live on. They are constants at the top of the renderer for
  the half of that rule that can still be honoured — revisable in one place, without reading how
  the panel is built. The lead does not claim every class is marked: the grid is not part of the
  decision, and at 7:40 every card says "Not taken yet" on a quiet day too.
*/
const QUIET_LEAD = 'Nothing needs you today.';
const QUIET_TEXT = 'Nothing is on the calendar this week, nothing is waiting to be graded, no '
  + 'signal is waiting on you in either direction, and no deadline is inside its warning.';
const QUIET_CHECKED = 'What was checked';
const QUIET_DOOR_TITLE = 'Neither flagged, nor praised, nor contacted this term';

/* The four chips, in the order the missing panels would have appeared, each a figure the page
   already owns: the week's far edge, how many classes the queue was asked about, how many
   students the pass walked, and the lead time the deadline window was read through — read back
   off the window closingIn() used, through src/calendar.js's own daysBetween(), rather than off
   the setting a second time with a second clamp. */
function warrantChips(doc, classes, today) {
  const students = studentsLookedAt(doc, classes);
  const weekTo = weekWindow(today).to;
  const w = leadWindowOf(doc, today);
  const lead = daysBetween(w.from, w.to);
  return [
    'Nothing on the calendar through ' + weekdayShortDate(weekTo),
    'Nothing to grade in ' + plural(classes.length, 'class', 'classes'),
    plural(students, 'student', 'students') + ' checked, both directions',
    lead === 0 ? 'No deadline today' : 'No deadline inside its ' + lead + '-day warning',
  ];
}

function quietPanel(doc, classes, quietCount) {
  const panel = el('div', 'panel');
  panel.id = QUIET_ID;
  /* Which panel of the page this is, by name, so a check — or WO-6.8's rows — can ask the stack
     which panels EXIST without reading headings. The four this one stands in for would carry
     `week`, `queue`, `attention` and `closing`; on a quiet day none of them is in the tree. */
  panel.setAttribute('data-glance-panel', 'quiet');

  const body = el('div', 'gl-quiet');
  const mark = el('div', 'gl-quiet-mark', '✓');
  mark.setAttribute('aria-hidden', 'true');
  body.append(mark);
  body.append(el('p', 'gl-quiet-lead', QUIET_LEAD));
  body.append(el('p', 'gl-quiet-text', QUIET_TEXT));

  const checked = el('div', 'gl-quiet-checked');
  checked.setAttribute('role', 'group');
  checked.setAttribute('aria-label', QUIET_CHECKED);
  warrantChips(doc, classes, todayISO())
    .forEach((text) => checked.append(el('span', 'gl-quiet-chip', text)));
  body.append(checked);

  /* THE DOOR. `.class-action-btn` worn as shipped — floored at 44px by src/shell.css's coarse block,
     which is why src/glance.css names no control of its own here — and the same words
     src/signals-view.js's paintQuiet() writes on the head it lands on, zero included: "The quiet
     middle" with no number when nobody is on it. The hook is src/shell.js's; the value says where
     on that screen to land. */
  const doors = el('div', 'gl-quiet-doors');
  const door = el('button', 'class-action-btn',
    quietCount ? 'The quiet middle · ' + quietCount : 'The quiet middle');
  door.type = 'button';
  door.setAttribute('data-signals-open', 'quiet');
  door.title = QUIET_DOOR_TITLE;
  doors.append(door);
  body.append(doors);

  panel.append(body);
  return panel;
}

/*
  DRAW THE PAGE'S PANELS UNDER THE CLASS GRID — in this work order, the quiet panel or nothing.
  Called by src/home.js's refreshHome() after the cards, so every chain in src/shell.js that
  redraws the grid redraws this too, and every path onto the home screen paints it on arrival.

  SILENT WHILE THE GRID IS NOT ON SCREEN, and the panel is left as it was rather than taken down:
  the next arrival repaints it, and painting a hidden page on every attendance mark is the cost the
  header's last paragraph refuses. Asked of src/views.js rather than read off the DOM, because that
  module owns the answer.

  THE THREE CHEAP READERS FIRST, and the pass only if all three came back empty — see the header.
*/
export function renderGlance() {
  const stack = document.getElementById(STACK_ID);
  if (!stack) return;
  if (currentView() !== 'home') return;

  const was = document.getElementById(QUIET_ID);
  if (was) was.remove();

  const doc = getDoc();
  const classes = doc ? getActiveClasses() : [];
  if (!classes.length) return;
  if (weekItems().length || queueRows().length || closingIn().length) return;

  const passes = signalPasses(doc);
  if (shownOf(doc, passes).length) return;

  stack.append(quietPanel(doc, classes, quietOf(doc, passes).length));
}
