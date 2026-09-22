/*
  The glance page — the readers its panels draw from, and the one panel that exists only when none
  of theirs does (WO-6.7).

  ── WHAT THIS FILE IS, AND THE ONE DECISION IN IT ──

  `#homeView` is the glance page (WO-6.4, and src/home.js's own header since WO-1.10): a stack of
  panels under the class grid, in the order a teacher needs them at 7:40am — what is on the calendar
  this week, what is waiting to be graded, who needs her, and what is closing in. This file holds
  the READERS those panels draw, one per source, and each one is a call into an engine that already
  exists, handing back that engine's own records:

    weekItems()        src/calendar.js's scheduledIn() — every authored event but a grades-due date
                       — and src/calendar-derived.js's due dates and term edges, today through six
                       days on                                            (WO-6.1 · WO-6.2 · WO-6.8)
    queueRows()        src/grade-engine.js's openWork(), the `open` rows, one row per assignment —
                       the engine behind the card's "N to grade"          (WO-3.26)
    attentionHits()    src/signals.js's evaluate() through applyCooldown(), the `shown` half — the
                       engine behind the card's "N need you"              (WO-4.5)
    closingIn()        grades-due dates inside src/calendar.js's lead window, term edges inside it,
                       and the review COUNT through reviewDatesIn()        (WO-6.1 · WO-6.2)
    quietMiddleRows()  src/signals.js's quietMiddle(), for the door's N    (WO-4.5)
    signalReading()    the last two and applyCooldown()'s suppressed half, off one set of passes —
                       what the render, panel 4 and the cards' chips all draw (WO-6.4)

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

  ── THE THREE LIST PANELS (WO-6.8) ──

  *Today and this week*, *Waiting to be graded* and *Closing in* — panels 2, 3 and 5 of the page, in
  that order in the stack, with WO-6.4's panel 4 — *Who needs you* — between the second and the
  third since 2026-09-16 (its own section, below the three).
  Each is a `.panel` holding a `.gl-list` of `.gl-row` BUTTONS lifted from § GLANCE, and each is
  drawn out of ONE reader's array and nothing else: a row per record, in the order the reader
  returned them. What the panel code adds is words — a class's name, an assignment's name, a date
  in src/date-text.js's format — read off the record or off the document by id, and never a
  question put to an engine: no rule, no grade, no window, no cell.

  A PANEL WHOSE READER IS EMPTY IS NOT DRAWN — absent, not empty, which is the quiet panel's
  argument one level down (CLAUDE.md § Data, "a source with nothing draws no panel at all"). So a
  day where only the signals are non-empty draws neither these three nor the quiet panel — and,
  since WO-6.4, panel 4 alone stands under the grid on that day.

  EVERY ROW GOES WHERE THE MONTH GRID ALREADY SENDS THE SAME THING, through the hooks src/shell.js
  already routes, rather than through a route of its own. A derived due date or a term edge, and
  a grades-due date under *Closing in*, wear `data-calendar-item` with its four companions — the
  exact attributes a chip on the grid wears — so openCalendarItem() takes them where a chip goes:
  the assignment's editor, the class's terms, the event loaded into its form. An authored event
  under *Today and this week* is the one departure the work order asks for: it opens the calendar's
  WEEK on that event's day, through `data-calendar-open="<date>"`, the home screen's own calendar
  door with a day on the end. A queue row wears `data-scores-open`, the only new hook.

  THE REVIEW COUNT KEEPS THE DOOR EMPTY AND CARRIES THE WINDOW'S FAR EDGE BESIDE IT (WO-6.9). It
  wears `data-calendar-open=""` — the month on today, the home button's own landing — and
  `data-calendar-through="<iso>"`, which is the `to` of the window closingIn() counted the reviews
  over. The calendar reads that edge on arrival and, when it lies past the page it drew, says so in
  a sentence under the grid (src/calendar-view.js). THE DATE ON THAT ATTRIBUTE IS THE WINDOW'S AND
  NEVER A REVIEW'S: the window is the lead time the teacher set, already printed on the panel's own
  head, and a review's date on this row — in the text or in an attribute, since a projector's mirror
  and a screen reader both read the DOM — would say when a student's plan is reviewed. The obvious
  fix, landing on the month of the earliest review, needs exactly that date and is what WO-6.9's
  Traps line refuses; whether the window crosses a month edge is not decided here either, because
  this file computes nothing — the calendar decides at render from the edge it was handed.

  A GRADES-DUE DATE IS UNDER *CLOSING IN* AND NOWHERE ELSE ON THIS PAGE (the owner, 2026-09-16):
  it is a deadline, and the week lists what is scheduled. The decision is src/calendar.js's
  scheduledIn(), not a filter here. And ALL THREE KINDS UNDER *CLOSING IN* SHARE ONE HORIZON (the
  owner, the same day) — the lead time the teacher set for grades, which the panel's own head says
  in as many words, because a review she is legally obliged to prepare for gets exactly the notice
  she chose for re-keying grades and the page must not let her think otherwise.

  ── WHAT IT DOES NOT DO ──

  IT IS ON src/shell.js's flipPresentationMode() REDRAW LIST SINCE WO-6.8, which is a correction to
  what this paragraph said at WO-6.7: the review COUNT under *Closing in* is the first thing on this
  page that changes under the flip, so a projector switched on with the page up must take it off the
  glass at once, not on the next arrival. The suppression itself is still not this file's — the
  count reaches closingIn() through reviewDatesIn(), which already answers with an empty list while
  projecting: the review count asks src/supports.js nothing, inherits the suppression exactly as
  src/calendar-view.js does, and draws NO "1 hidden" line, because a count of hidden reviews is the
  disclosure one step removed. The quiet panel's chips and the other two panels draw as they do
  otherwise — counts, names of assignments and classes, and the titles the teacher typed on her own
  events. THAT LAST IS A KNOWN EDGE, recorded in the work order rather than fixed: an event titled
  "IEP meeting — Owen Bennett" is free text on the week panel under a projector, as it is on the
  month grid today.

  AND PANEL 4 IS THE ONE PLACE THIS FILE ASKS THE SWITCH ITSELF (WO-6.4). The paragraph above is
  about a support field, whose suppression has an upstream owner; panel 4 is a list of named students
  in trouble, which has none — src/signals-view.js's header says so of its own list — so the panel
  asks `presentationMode()` once, at the point it would build the columns, and builds the refusal
  instead. That is a second asker of the switch on the page and not a second opinion about support
  data: there is still no support field anywhere in panel 4 and no path to one. The flip entry above
  is what makes the panel shut WITH THE PAGE UP rather than on the next arrival — the condition
  src/home.js's header named for joining that list, met in the stack under the cards.

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

  The signals pass is the one expensive thing on the home screen. Until WO-6.4 the card ran it once
  per class for its chip and this file ran it again on a quiet morning. Panel 4 wants the hits on
  every render, so WO-6.4 took the decision WO-6.7 left here: THE CARD'S CHIP READS THIS FILE'S
  ARRAY. src/home.js's refreshHome() asks signalReading() once, counts each card's chip off it, and
  hands the same object to renderGlance() — one pass per class per render, shared by the cards, the
  panel, its feet and the quiet-middle door, where the arrangement before it would have been two.
  The renderer is also silent while the grid is not the view on screen, for the reason src/home.js's
  header gives about the chip: src/shell.js chains refreshHome() off every attendance mark, and
  painting a hidden page is work nobody sees — and refreshHome() takes no reading at all then.
*/

import { getDoc } from './store.js';
import { getActiveClasses, getOpenTermId } from './classes.js';
/* The engine behind "N to grade" — src/home.js's own import, for its own reason: nothing here looks
   at a cell, and what "not graded yet" means is decided once, over there. */
import { openWork } from './grade-engine.js';
/* The engine behind "N need you" and behind the quiet middle. Nothing here decides whether a rule
   fired, whether a hit is silenced, or who is on the third list. */
import { evaluate, applyCooldown, quietMiddle } from './signals.js';
/* PANEL 4's NAMES FROM THE SAME MODULE (WO-6.4), and none of them reads the document — which is the
   ruling under WO-6.8's sixth Acceptance line applied to the panel that draws Phase 4. Each is handed
   hits and answers about hits: `orderHits`, `severityOrder` and `praiseOrder` are the owner's
   rankings, asked rather than re-decided (src/signals.js says at their definitions that this panel
   inherits them); `signalFigure` is the number a rule publishes as its own headline; `ruleText` is
   the word table a tag falls back on. There is no evaluate() or applyCooldown() below the readers —
   the Traps line of WO-6.4 is that such a call in the panel's code is the second answer. */
import { orderHits, severityOrder, praiseOrder, signalFigure, ruleText } from './signals.js';
/* A student's name, off the record, for a row that names her — the one call src/signals-view.js
   makes for the same row. A formatter over one student object; it reads no document. */
import { fullName } from './roster.js';
/* The class's colour and initials on a row's avatar, the ones every other surface wears. */
import { initials, avatarClass } from './classes.js';
/* THE SWITCH, AND THIS FILE'S FIRST ASKER OF IT (WO-6.4). The review count below still asks
   nothing — its suppression is src/calendar-derived.js's — but panel 4 is a list of named students
   in trouble, and there is nowhere upstream for that refusal to live: src/signals-view.js's header
   says so about its own list, word for word, and asks `presentationMode()` and not
   `supportsVisible()` for the reason it gives. This file inherits that choice rather than making
   a second one. */
import { presentationMode } from './supports.js';
/* The authored half of the calendar, and the lead time it owns. All five are READS. scheduledIn()
   replaced eventsCovering() here at WO-6.8, on the owner's ruling that a grades-due date belongs to
   *Closing in* alone — the kind decision is the engine's, one function from gradesDueIn().

   `kindInfo` IS THE ONE NAME THE PANELS ADDED TO THIS LINE, and it is a word table rather than an
   engine: it is handed a kind token and answers the word every other surface prints for it
   ("Conference"), and it never sees the document. Without it an untitled event would need a second
   copy of the eight words, which is how two screens come to call one entry two things. Named in
   WO-6.8's result file against that work order's sixth Acceptance line, for the owner to rule on. */
import { scheduledIn, gradesDueIn, leadWindowOf, shiftDays, daysBetween, kindInfo } from './calendar.js';
/* The derived half. Asked kind by kind rather than through derivedItemsIn(), because the panels
   these feed draw due dates and term edges and never a meeting state — which is the class grid's —
   and asking for the kinds a panel draws is choosing a question, not filtering an answer.

   ASSIGNMENT_DUE and TERM_START are the other two names the panels added, for the same reason as
   `kindInfo` above and under the same note: token constants, so a row can tell a due date from a
   term edge, and a start from an end, without this file holding its own copy of the strings. */
import { assignmentDuesIn, termEdgesIn, reviewDatesIn, ASSIGNMENT_DUE, TERM_START }
  from './calendar-derived.js';
import { todayISO } from './attendance.js';
import { weekdayShortDate } from './date-text.js';
import { currentView } from './views.js';

/* The stack in #homeView (index.html), and the quiet panel's id — the one panel of the five this
   file draws that has one. */
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
  would be five "Taken" rows saying what the cards above already say), review dates (a count on
  this page, under what is closing in, and never a name in a week list), and — since WO-6.8, on the
  owner's ruling of 2026-09-16 — grades-due dates, which are deadlines and live under *Closing in*
  alone. The last is src/calendar.js's scheduledIn() deciding, not a filter here.
*/
export function weekItems() {
  const doc = getDoc();
  if (!doc) return [];
  const w = weekWindow(todayISO());
  return [].concat(
    scheduledIn(doc, w.from, w.to),
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
  THE PAGE'S ONE SIGNALS READING (WO-6.4): both halves of applyCooldown() and the quiet middle, off
  ONE set of passes. attentionHits() and quietMiddleRows() above are the same engine calls asked one
  at a time; this is them asked together, for the render, because panel 4 draws the shown half, its
  two feet count the suppressed half, its header's door counts the quiet middle, and the class cards
  above count the shown half again — and four askers each running evaluate() over every class is
  WO-2.13's defect reached from a fifth direction.

  AND THE CARDS READ IT TOO, WHICH IS THE DECISION WO-6.7 LEFT FOR THIS SITTING. src/home.js's
  refreshHome() asks this once and hands the same object to every card's `N need you` chip and then
  to renderGlance() — so "the chip and the panel cannot disagree" is one array counted twice rather
  than two passes that happen to agree, and the home screen runs the signal pass once per class
  per render rather than twice. `hits` is exactly attentionHits()'s array, and the order is the
  same: class by class, roster order within.
*/
export function signalReading() {
  const doc = getDoc();
  if (!doc) return { hits: [], suppressed: [], quiet: [] };
  const hits = [];
  const suppressed = [];
  const quiet = [];
  signalPasses(doc).forEach((pass) => {
    const cool = applyCooldown(doc, pass.hits);
    cool.shown.forEach((hit) => hits.push(hit));
    cool.suppressed.forEach((row) => suppressed.push(row));
    quietMiddle(doc, pass.cls, pass.termId, { hits: pass.hits }).forEach((row) => quiet.push(row));
  });
  return { hits: hits, suppressed: suppressed, quiet: quiet };
}

/*
  WHAT IS CLOSING IN: the grades-due dates inside their lead time, the term edges inside the same
  window, and the review COUNT inside it — one window, src/calendar.js's leadWindowOf(), because
  the lead time is the one "how far ahead do you want warning" number the teacher owns and a second
  horizon would be a second setting nobody typed. The review count rides in that window rather than
  a wider one — decided here for want of a ruling at WO-6.7, and RULED by the owner on 2026-09-16:
  one window, with the panel's head naming whose lead time it is. The calendar's month grid is where
  a review has a date and a name, and this page says "closing in", not "coming up this month".
  Reversing it is a second key in the `calendar` block, and a row of its own rather than an edit here.

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
/* "SCHEDULED", NOT "ON THE CALENDAR" — since WO-6.8, and the word is load-bearing. The week reader
   no longer carries grades-due dates (the owner, 2026-09-16), so a week whose only entry is a
   grades-due date OUTSIDE its lead time is a quiet day: nothing in the week reader, nothing in the
   closing-in reader. That day is reachable on the default lead of 3 — a Thursday deadline read on a
   Sunday — and on it "Nothing on the calendar through Sat" would be false with the deadline sitting
   on the calendar four days out. The day is right to be quiet: it is exactly the notice the teacher
   chose. The SENTENCE was wrong, and the fix is to claim what the week reader actually asked —
   what is scheduled — beside the fourth chip, which already says deadlines are counted from their
   warning. tools/verify/glance-quiet.mjs plants that day. */
const QUIET_TEXT = 'Nothing is scheduled this week, nothing is waiting to be graded, no '
  + 'signal is waiting on you in either direction, and no deadline is inside its warning.';
const QUIET_CHECKED = 'What was checked';
const QUIET_DOOR_TITLE = 'Neither flagged, nor praised, nor contacted this term';

/* The four chips, in the order the missing panels would have appeared, each a figure the page
   already owns: the week's far edge, how many classes the queue was asked about, how many
   students the pass walked, and the lead time the deadline window was read through — read back
   off the window closingIn() used, through src/calendar.js's own daysBetween(), rather than off
   the setting a second time with a second clamp. */
function leadShown(doc, today) {
  const w = leadWindowOf(doc, today);
  return { to: w.to, days: daysBetween(w.from, w.to) };
}

function warrantChips(doc, classes, today) {
  const students = studentsLookedAt(doc, classes);
  const weekTo = weekWindow(today).to;
  const lead = leadShown(doc, today).days;
  return [
    'Nothing scheduled through ' + weekdayShortDate(weekTo),
    'Nothing to grade in ' + plural(classes.length, 'class', 'classes'),
    plural(students, 'student', 'students') + ' checked, both directions',
    lead === 0 ? 'No deadline today' : 'No deadline inside its ' + lead + '-day warning',
  ];
}

function quietPanel(doc, classes, quietCount) {
  const panel = el('div', 'panel');
  panel.id = QUIET_ID;
  /* Which panel of the page this is, by name, so a check can ask the stack which panels EXIST
     without reading headings. The four this one stands in for carry `week`, `queue`, `attention`
     and `closing` (three of them since WO-6.8); on a quiet day none of them is in the tree. */
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
  doors.append(quietDoor(quietCount));
  body.append(doors);

  panel.append(body);
  return panel;
}

/* THE DOOR ITSELF, built in one place because it has two homes (WO-6.4): this panel on a day with
   nothing pending, and panel 4's header on a day that panel exists — never both at once, which
   renderGlance() decides by drawing one panel or the other. One builder is what keeps the two homes
   from ever saying it two ways. */
function quietDoor(quietCount) {
  const door = el('button', 'class-action-btn',
    quietCount ? 'The quiet middle · ' + quietCount : 'The quiet middle');
  door.type = 'button';
  door.setAttribute('data-signals-open', 'quiet');
  door.title = QUIET_DOOR_TITLE;
  return door;
}

/* ────────────────────────────── the three list panels (WO-6.8) ──────────────────────────────

   The header's WO-6.8 section is the argument. What follows draws, and each builder is handed ONE
   reader's array and draws a row per record in the order it arrived. The copy is constants for
   decision 7 of WO-6.7's result — these panels exist only some days, so there is no static element
   in index.html for their words to live on. */

const WEEK_TITLE = 'Today and this week';
const WEEK_TEXT = 'What is scheduled from today through ';
const WEEK_TEXT_TAIL = '. Grades-due dates are under Closing in.';
const QUEUE_TITLE = 'Waiting to be graded';
const QUEUE_TEXT = 'Assignments in the open term with blanks in them. Each one opens on its own '
  + 'column in the score grid.';
const CLOSING_TITLE = 'Closing in';
/* WHOSE LEAD TIME IT IS, said on the panel's head (the owner, 2026-09-16). The one window is the
   lead time the teacher set for GRADES on the events panel, and term edges and reviews ride it too;
   a head that said only "closing in" would let a review read as if it had its own notice. */
const CLOSING_TEXT = 'Inside the lead time you set for grades — ';
const CLOSING_TEXT_TAIL = '. Term edges and reviews use the same window.';
/* No name, no date, no kind — WO-6.4's ruling. The row's only words are the count and where the
   rest is; there is deliberately no `.gl-row-meta` on it, which is where a date would go. */
const REVIEW_ONE = 'review coming up';
const REVIEW_MANY = 'reviews coming up';
const REVIEW_TEXT = 'Who and when are on the calendar.';
const UNTITLED_ASSIGNMENT = 'Untitled assignment';
const UNTITLED_TERM = 'Untitled term';

function classNameIn(classes, id) {
  const cls = classes.filter((c) => c && c.id === id)[0];
  return cls ? cls.name : '';
}

/* A panel with its head and an empty list, named for which panel of the page it is. */
function listPanel(name, title, text) {
  const panel = el('div', 'panel');
  panel.setAttribute('data-glance-panel', name);
  const header = el('div', 'panel-header');
  const row = el('div', 'panel-title-row');
  const words = el('div', 'panel-title');
  words.append(el('h2', '', title));
  if (text) words.append(el('p', '', text));
  row.append(words);
  header.append(row);
  panel.append(header);
  const list = el('div', 'gl-list');
  panel.append(list);
  return { panel: panel, list: list };
}

/*
  ONE ROW: a <button> whose whole face is the tap, as § GLANCE draws it — title, an optional line
  under it, an optional figure at the right, and the `›` every row on this page carries.

  `out` puts the calendar's ↗ after the title, which is the month grid's grammar for "this is kept
  somewhere else, and the tap goes there" (design/mockups/proposed-phase6.css § SHARED). It is
  aria-hidden: the arrow is a picture of the destination, and the button's own words already say
  what it is. textContent throughout — every title here was typed by a teacher.
*/
function glRow(title, why, meta, out) {
  const button = el('button', 'gl-row');
  button.type = 'button';
  const main = el('span', 'gl-row-main');
  const head = el('span', 'gl-row-title', title);
  if (out) {
    const arrow = el('span', 'gl-row-out', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    head.append(arrow);
  }
  main.append(head);
  if (why) main.append(el('span', 'gl-row-why', why));
  button.append(main);
  if (meta) button.append(el('span', 'gl-row-meta', meta));
  const go = el('span', 'gl-row-go', '›');
  go.setAttribute('aria-hidden', 'true');
  button.append(go);
  return button;
}

/* The month grid's chip attributes, worn by a row, so src/shell.js's openCalendarItem() routes the
   row exactly where it routes the chip. Nothing here decides a destination. */
function asCalendarItem(button, kind, ref, classId, date) {
  button.setAttribute('data-calendar-item', '');
  button.setAttribute('data-calendar-kind', kind || '');
  button.setAttribute('data-calendar-ref', ref || '');
  button.setAttribute('data-calendar-class', classId || '');
  button.setAttribute('data-calendar-date', date || '');
  return button;
}

/* An authored event's name: what the teacher typed, or the kind's own word when she typed nothing —
   `event.title || info.word`, the phrase src/events.js and src/calendar-view.js both use. */
function eventName(event) {
  const info = kindInfo(event.kind);
  return String(event.title || '').trim() || (info ? info.word : 'Event');
}

/* When an authored event is: one day, or its two edges. Equality and not order — an event written
   by newEvent() carries endDate equal to date when it is one day, and this file compares no two
   dates. */
function eventWhen(event) {
  const end = String(event.endDate || '');
  return end && end !== event.date
    ? weekdayShortDate(event.date) + ' – ' + weekdayShortDate(end)
    : weekdayShortDate(event.date);
}

/* A derived term edge, as a row: the class and which edge in the title, the term's name under it. */
function termEdgeRow(item, classes) {
  const who = classNameIn(classes, item.classId);
  const word = item.kind === TERM_START ? 'Term starts' : 'Term ends';
  return asCalendarItem(
    glRow((who ? who + ' · ' : '') + word, item.title || UNTITLED_TERM,
      weekdayShortDate(item.date), true),
    item.kind, item.termId, item.classId, item.date);
}

/*
  PANEL 2 — TODAY AND THIS WEEK, from weekItems(). Three shapes of row, for the reader's three
  halves, and each goes where the work order says:

    an authored event   the calendar's WEEK on that event's day — `data-calendar-open` carrying the
                        day. A range that began before today opens on its first day, the one its
                        row names; the row says both edges, so the landing matches the words.
    a due date          ↗, and the assignment's editor — the month grid's chip exactly.
    a term edge         ↗, and where the month grid's term chip goes (src/shell.js's
                        openCalendarItem(): that class's term editor).
*/
function weekPanel(items, classes, today) {
  const built = listPanel('week', WEEK_TITLE,
    WEEK_TEXT + weekdayShortDate(weekWindow(today).to) + WEEK_TEXT_TAIL);
  items.forEach((item) => {
    if (item && item.derived === true) {
      if (item.kind === ASSIGNMENT_DUE) {
        const who = classNameIn(classes, item.classId);
        built.list.append(asCalendarItem(
          glRow(item.title + ' due' + (who ? ' · ' + who : ''), '', weekdayShortDate(item.date), true),
          item.kind, item.assignmentId, item.classId, item.date));
        return;
      }
      built.list.append(termEdgeRow(item, classes));
      return;
    }
    const info = kindInfo(item.kind);
    const named = String(item.title || '').trim();
    const row = glRow(eventName(item), named && info ? info.word : '', eventWhen(item), false);
    row.setAttribute('data-calendar-open', item.date);
    built.list.append(row);
  });
  return built.panel;
}

/*
  PANEL 3 — WAITING TO BE GRADED, from queueRows(). The head's figure is the reader's LENGTH — one
  row per assignment, which is the unit the card's `N to grade` counts, so the head equals the sum
  of the cards because both are the same engine reading and not because anything here adds them.

  The row's figure is the record's own `open`, the number of students the engine reported the
  assignment blank for, said as "blanks" — the word this app's past-due prompt uses — and NOT as
  "N of M graded", which would be a subtraction this file does not do. The assignment's and the
  category's names are read off the document by id; a name is not an answer.
*/
function queuePanel(rows, classes, doc) {
  const built = listPanel('queue', QUEUE_TITLE + ' · ' + rows.length, QUEUE_TEXT);
  const assignments = doc && Array.isArray(doc.assignments) ? doc.assignments : [];
  rows.forEach((row) => {
    const work = assignments.filter((a) => a && a.id === row.assignmentId)[0] || null;
    const cls = classes.filter((c) => c && c.id === row.classId)[0] || null;
    const cats = cls && Array.isArray(cls.categories) ? cls.categories : [];
    const cat = cats.filter((c) => c && c.id === row.categoryId)[0] || null;
    const why = (cls ? cls.name : '') + (cat && cat.name ? ' · ' + cat.name : '');
    const button = glRow((work && String(work.name || '').trim()) || UNTITLED_ASSIGNMENT, why,
      plural(row.open, 'blank', 'blanks'), false);
    button.setAttribute('data-scores-open', row.assignmentId);
    button.setAttribute('data-scores-class', row.classId);
    built.list.append(button);
  });
  return built.panel;
}

/*
  PANEL 5 — CLOSING IN, from closingIn(). Three shapes of row:

    a grades-due date   amber (`.warn`: § GLANCE's "the one amber row on the page") — every one in
                        this reader is inside its lead time by construction — and the tap loads the
                        event into its form, which is where the month grid's grades-due chip goes.
                        This is the surface WO-6.1's lead-time warning was re-homed to.
    a term edge         as on the week panel.
    the review count    a count and a sentence, opening the calendar on this month, with the
                        window's far edge riding along so the calendar can say when the window runs
                        past the month it drew (WO-6.9; the header's paragraph on the two
                        attributes). No name, no date, no kind, no meta — and absent under a
                        projector because the reader is.
*/
function closingPanel(items, classes, doc, today) {
  const lead = leadShown(doc, today);
  const span = lead.days === 0 ? 'today only'
    : plural(lead.days, 'day', 'days') + ', through ' + weekdayShortDate(lead.to);
  const built = listPanel('closing', CLOSING_TITLE, CLOSING_TEXT + span + CLOSING_TEXT_TAIL);
  items.forEach((item) => {
    if (item.kind === REVIEW_COUNT) {
      const row = glRow(item.count + ' ' + (item.count === 1 ? REVIEW_ONE : REVIEW_MANY),
        REVIEW_TEXT, '', false);
      row.setAttribute('data-calendar-open', '');
      /* The window's `to`, off the record closingIn() already carries — never a review's date, and
         never a month comparison made here. The header says why on both counts (WO-6.9). */
      row.setAttribute('data-calendar-through', item.to);
      /* A count of plan reviews is a support indicator — it is absent under a projector for that
         reason — so src/shell.css's print belt takes it off a Ctrl+P of this page in either mode
         (WO-8.4). A valueless marker and never a click hook. */
      row.setAttribute('data-support-indicator', '');
      built.list.append(row);
      return;
    }
    if (item.derived === true) {
      built.list.append(termEdgeRow(item, classes));
      return;
    }
    const named = String(item.title || '').trim();
    const info = kindInfo(item.kind);
    const row = asCalendarItem(
      glRow(eventName(item), named && info ? info.word : '', eventWhen(item), false),
      item.kind, item.id, '', item.date);
    row.classList.add('warn');
    built.list.append(row);
  });
  return built.panel;
}

/* ────────────────────────────── panel 4: who needs you (WO-6.4) ──────────────────────────────

   A SUMMARY OF WO-4.2's SCREEN, DRAWN IN THAT SCREEN'S OWN CLASSES. `.sig-two`, `.sig-col`,
   `.sig-col-head` with its note, `.sig-row` with the figure in the strong position, `.sig-col-empty`
   and `.sig-hidden` — every one of them src/signals-view.css's, worn as shipped, because a summary
   drawn from a second stylesheet is a summary that drifts (design/mockups/glance.html, redrawn
   2026-09-15). src/glance.css adds only `.gl-more`, `.gl-foot-go` and `.gl-shut`.

   THREE THINGS DIFFER FROM THAT SCREEN, and all three are the work order's. Every row taps THROUGH
   to that screen and opens the student's card there, rather than opening a card over this page. Each
   column's cooldown foot is a DOOR onto that screen with the column's suppressed rows open, not an
   expansion here. And a column longer than the owner's number draws that many rows and an
   `and N more ›` foot that lands on the first row it did not draw. There is no sort control, no
   class strip and no rule chip: the ranking is the owner's ruled order or nothing, and the
   controls are one tap away behind any row.

   THE ROWS ARE BUILT HERE AND THEIR SHAPE IS rowButton()'s in src/signals-view.js — avatar, name
   with the class beside it, the rule's own sentence, the other rules as tags, the figure, the
   chevron. A second copy of a row builder is a drift risk this file accepts rather than importing
   that module, which reads the document and runs its own pass; tools/verify/glance-quiet.mjs reads a
   row here and the same student's row there and fails if the two stop matching. */

/* THE OWNER'S NUMBER (2026-09-16, answered at dispatch): four rows per column, concern and praise
   alike, and then the foot. A column of four or fewer draws no foot at all. */
const ATTENTION_ROWS = 4;

const ATTENTION_TITLE = 'Who needs you';
const ATTENTION_TEXT = 'Both directions, after the cooldown. Every row opens the full list, on that '
  + 'student.';
const ATTENTION_FULL = 'The full list';
const ATTENTION_FULL_TITLE = 'Every student on both lists, on the Who needs you screen';
/* The two heads and their notes, in the words WO-4.2's screen prints over the same columns on its
   arrival order. They are copies of that screen's `SORT_NOTES.ruled` and `PRAISE_NOTE`, and the
   harness reads both screens' heads and fails when they part. */
const CONCERN_LABEL = 'Concern';
const PRAISE_LABEL = 'Praise';
const CONCERN_NOTE = 'attendance first, then the biggest change';
const PRAISE_NOTE = 'biggest climb first';
/* A column with nothing in it while the other has something — that screen's own quiet lines. */
const CONCERN_EMPTY = 'Nobody is flagged here right now.';
const PRAISE_EMPTY = 'Nobody is climbing yet.';
/* THE REFUSAL, in that screen's lead and with the counts kept (design/mockups/glance.html, the
   Tuesday while projecting). The counts are how many rows each column holds — a number names nobody
   and cannot be turned back into a list, which is WO-4.5's ruling for the card's chip. */
const SHUT_LEAD = 'Not while you are projecting.';
const SHUT_TAIL = ' Their names are the one thing here that should never be on a classroom wall — '
  + 'turn presentation mode off with the screen button in the header and they come straight back.';

/*
  THE HITS, GROUPED INTO THE TWO COLUMNS THE SIGNALS SCREEN DRAWS FROM THEM — one row per student
  per class, in that screen's order, and nothing about which hits exist decided here.

  src/signals-view.js's collect() walks the active classes in order, hands each class's live hits to
  orderHits(), and makes a row per student the first time a student appears; columnRows() then
  takes a direction's slice of each row with the first of it as the lead, and order()/orderPraise()
  hand the leads to severityOrder()/praiseOrder(). This is that walk over signalReading()'s array,
  which already arrives class by class in roster order — the same input, the same engine calls, the
  same stable sorts, so the same rows in the same order. Every ordering here is the engine's.

  NO NAME IS READ HERE. The grouping is ids and hits; the renderer below looks a name up only for a
  row it is about to draw, and while projecting it draws none.
*/
function attentionColumns(hits) {
  const classOrder = [];
  const byClass = Object.create(null);
  hits.forEach((hit) => {
    if (!byClass[hit.classId]) { byClass[hit.classId] = []; classOrder.push(hit.classId); }
    byClass[hit.classId].push(hit);
  });
  const rows = [];
  const byKey = Object.create(null);
  classOrder.forEach((classId) => {
    orderHits(byClass[classId]).forEach((hit) => {
      const key = hit.studentId + '|' + hit.classId;
      if (!byKey[key]) {
        byKey[key] = { key: key, studentId: hit.studentId, classId: hit.classId, hits: [] };
        rows.push(byKey[key]);
      }
      byKey[key].hits.push(hit);
    });
  });
  const columnOf = (direction, rank) => {
    const mine = [];
    rows.forEach((row) => {
      const own = row.hits.filter((hit) => hit.direction === direction);
      if (own.length) mine.push({ key: row.key, studentId: row.studentId, classId: row.classId,
        lead: own[0], tags: own.slice(1) });
    });
    return rank(mine.map((row) => row.lead))
      .map((lead) => mine.filter((row) => row.lead === lead)[0]).filter(Boolean);
  };
  return { concern: columnOf('concern', severityOrder), praise: columnOf('praise', praiseOrder) };
}

/* ONE ROW — src/signals-view.js's rowButton(), shape for shape, with a door where that one has a
   card. The column and the key say where on that screen to land; src/shell.js's showSignals() does
   the landing. textContent throughout: a name was pasted out of a school system. */
function attentionRow(doc, classes, direction, row) {
  const student = studentsIn(doc).filter((s) => s && s.id === row.studentId)[0] || null;
  const name = student ? fullName(student) : '';
  const figure = signalFigure(row.lead) || { value: 0, text: '', unit: '', tone: 'flat' };

  const button = el('button', 'sig-row');
  button.type = 'button';
  button.setAttribute('data-signals-open', 'card');
  button.setAttribute('data-signals-column', direction);
  button.setAttribute('data-signals-key', row.key);

  const avatar = el('span', 'avatar ' + avatarClass(row.classId), initials(name));
  avatar.setAttribute('aria-hidden', 'true');
  button.append(avatar);

  const main = el('span', 'sig-row-main');
  const who = el('span', 'sig-row-name');
  who.append(document.createTextNode(name));
  who.append(el('span', 'sig-row-class', classNameIn(classes, row.classId)));
  main.append(who);
  main.append(el('span', 'sig-row-why', row.lead.explanation));
  if (row.tags.length) {
    const tags = el('span', 'sig-row-tags');
    row.tags.forEach((hit) => {
      const shape = signalFigure(hit);
      tags.append(el('span', 'sig-tag',
        (shape ? shape.text + ' ' : '') + (shape ? shape.unit : ruleText(hit.ruleId))));
    });
    main.append(tags);
  }
  button.append(main);

  const delta = el('span', 'sig-delta ' + figure.tone, figure.text);
  delta.append(el('span', 'sig-delta-unit', figure.unit));
  button.append(delta);
  const go = el('span', 'sig-row-go', '›');
  go.setAttribute('aria-hidden', 'true');
  button.append(go);

  button.setAttribute('aria-label', row.lead.explanation + ' Opens why ' + name
    + ' is on the list, on the Who needs you screen.');
  return button;
}

/* A foot that is a door: the words, and the › that says the tap goes somewhere else. */
function footDoor(className, text) {
  const button = el('button', className, text);
  button.type = 'button';
  const go = el('span', 'gl-foot-go', '›');
  go.setAttribute('aria-hidden', 'true');
  button.append(go);
  return button;
}

/*
  ONE COLUMN: its head with the count and the note, up to ATTENTION_ROWS rows, the quiet line when
  it has none, the `and N more ›` foot when it has more, and the cooldown foot when the engine held
  rows out of it.

  `and N more` IS THE LENGTH OF THE ROWS NOT DRAWN — the slice past the owner's number, counted —
  and it lands on the first of them. The cooldown foot's count is the suppressed hits in this
  direction, which is what the signals screen's own foot counts, in that foot's own words.
*/
function attentionColumn(doc, classes, direction, rows, held) {
  const concern = direction === 'concern';
  const col = el('div', 'sig-col ' + direction);
  const head = el('div', 'sig-col-head ' + direction);
  head.append(document.createTextNode((concern ? CONCERN_LABEL : PRAISE_LABEL) + ' · ' + rows.length));
  head.append(el('span', 'sig-col-note', concern ? CONCERN_NOTE : PRAISE_NOTE));
  col.append(head);

  const list = el('div', 'sig-list');
  rows.slice(0, ATTENTION_ROWS).forEach((row) => list.append(attentionRow(doc, classes, direction, row)));
  col.append(list);
  if (!rows.length) col.append(el('p', 'sig-col-empty', concern ? CONCERN_EMPTY : PRAISE_EMPTY));

  const rest = rows.slice(ATTENTION_ROWS);
  if (rest.length) {
    const more = footDoor('gl-more', 'and ' + rest.length + ' more');
    more.setAttribute('data-signals-open', 'more');
    more.setAttribute('data-signals-column', direction);
    more.setAttribute('data-signals-key', rest[0].key);
    col.append(more);
  }

  if (held.length) {
    const foot = footDoor('sig-hidden', held.length + ' you wrote about recently · '
      + (held.length === 1 ? 'show it' : 'show them'));
    foot.setAttribute('data-signals-open', 'held');
    foot.setAttribute('data-signals-column', direction);
    col.append(foot);
  }
  return col;
}

/*
  PANEL 4 — WHO NEEDS YOU, from signalReading(). Drawn only on a day its shown half is not empty;
  a day whose only signals are held by the cooldown is a day with no signal waiting on the teacher,
  which is what the quiet panel's own sentence claims.

  THE HEADER CARRIES TWO DOORS: `The quiet middle · N` (its home on a day this panel exists) and
  `The full list`. Both stay up while projecting — a count and a way in, and the screen they open
  refuses in its turn.

  UNDER A PROJECTOR THE COLUMNS ARE NOT BUILT AT ALL — not built and hidden, because a Ctrl+P and a
  screen reader both read the tree. In their place is the signals screen's own refusal, compact,
  with each column's count in its sentence; no student record is looked at on the way.
*/
function attentionPanel(doc, classes, reading) {
  const panel = el('div', 'panel');
  panel.setAttribute('data-glance-panel', 'attention');
  const header = el('div', 'panel-header');
  const titleRow = el('div', 'panel-title-row');
  const words = el('div', 'panel-title');
  words.append(el('h2', '', ATTENTION_TITLE));
  words.append(el('p', '', ATTENTION_TEXT));
  titleRow.append(words);
  const actions = el('div', 'panel-title-actions');
  actions.append(quietDoor(reading.quiet.length));
  const full = el('button', 'class-action-btn', ATTENTION_FULL);
  full.type = 'button';
  full.setAttribute('data-signals-open', 'list');
  full.title = ATTENTION_FULL_TITLE;
  actions.append(full);
  titleRow.append(actions);
  header.append(titleRow);
  panel.append(header);

  const columns = attentionColumns(reading.hits);
  if (presentationMode()) {
    const shut = el('div', 'gl-shut');
    const mark = el('div', 'sig-blocked-mark', '🔒');
    mark.setAttribute('aria-hidden', 'true');
    shut.append(mark);
    shut.append(el('p', 'sig-blocked-lead', SHUT_LEAD));
    const flagged = columns.concern.length;
    const climbing = columns.praise.length;
    shut.append(el('p', 'sig-blocked-text',
      plural(flagged, 'student is', 'students are') + ' flagged and ' + climbing
        + (climbing === 1 ? ' is' : ' are') + ' climbing.' + SHUT_TAIL));
    panel.append(shut);
    return panel;
  }

  const heldIn = (direction) => reading.suppressed.filter((row) => row.hit.direction === direction);
  const two = el('div', 'sig-two');
  two.append(attentionColumn(doc, classes, 'concern', columns.concern, heldIn('concern')));
  two.append(attentionColumn(doc, classes, 'praise', columns.praise, heldIn('praise')));
  panel.append(two);
  return panel;
}

/*
  DRAW THE PAGE'S PANELS UNDER THE CLASS GRID — the three list panels whose readers have something,
  or the quiet panel, or nothing. Called by src/home.js's refreshHome() after the cards, so every
  chain in src/shell.js that redraws the grid redraws this too, and every path onto the home screen
  paints it on arrival; and by src/shell.js's flipPresentationMode(), because the review count
  under *Closing in* changes under the flip.

  SILENT WHILE THE GRID IS NOT ON SCREEN, and the panels are left as they were rather than taken
  down: the next arrival repaints them, and painting a hidden page on every attendance mark is the
  cost the header's last paragraph refuses. Asked of src/views.js rather than read off the DOM,
  because that module owns the answer.

  EVERY PANEL THIS FILE DREW IS TAKEN DOWN FIRST — found by `data-glance-panel`, which the class
  grid's panel does not carry — so a panel is never drawn twice and never outlives the day it
  belonged to.

  THE SIGNALS READING IS NOW TAKEN ON EVERY RENDER (WO-6.4), which is a correction to what this
  paragraph said at WO-6.7 and WO-6.8 — the three cheap readers first, and the pass skipped the
  moment any of them had something. Panel 4 draws the hits on a busy day as well as a quiet one, so
  there is no day the pass can be skipped. What pays for it is that the pass is taken ONCE: `reading`
  is src/home.js's, handed over by refreshHome() after the cards counted it, and this function only
  asks for its own when it is called from somewhere that has none — src/shell.js's
  flipPresentationMode().

  Then one of two things. ANY of the four sources has something, and each non-empty one draws its
  panel in the page's order — week, queue, who needs you, closing in — and the quiet panel is not
  drawn, which is the day a teacher with two failing students must never be told nothing needs her
  (WO-6.8's seventh Acceptance line). OR all four are empty, and the quiet panel is the one panel.
  The quiet-middle door is on exactly one of panel 4 and the quiet panel, because at most one of
  them is drawn.
*/
export function renderGlance(reading) {
  const stack = document.getElementById(STACK_ID);
  if (!stack) return;
  if (currentView() !== 'home') return;

  Array.prototype.slice.call(stack.querySelectorAll('[data-glance-panel]'))
    .forEach((panel) => panel.remove());

  const doc = getDoc();
  const classes = doc ? getActiveClasses() : [];
  if (!classes.length) return;

  const today = todayISO();
  const week = weekItems();
  const queue = queueRows();
  const closing = closingIn();
  const signals = reading || signalReading();
  if (week.length || queue.length || signals.hits.length || closing.length) {
    if (week.length) stack.append(weekPanel(week, classes, today));
    if (queue.length) stack.append(queuePanel(queue, classes, doc));
    if (signals.hits.length) stack.append(attentionPanel(doc, classes, signals));
    if (closing.length) stack.append(closingPanel(closing, classes, doc, today));
    return;
  }

  stack.append(quietPanel(doc, classes, signals.quiet.length));
}
