/*
  Attendance — the registry: one class, students down, recent weekdays across, and the one
  predicate that says what happened to a class on a date.

  THIS IS THE FLOW THAT RUNS WHILE STUDENTS WALK IN. It is the one thing the owner does every
  single period, on an iPad, standing up, and it is measured in seconds. Every decision below that
  looks like an omission is a decision about that clock.

  ── WHERE THIS SCREEN LIVES (WO-1.13) ──

  In <main>, as `#classView` — the open class's working surface, alongside `#homeView`'s class grid,
  one visible at a time. It shipped at WO-2.1 as a dialog over the home screen because there was no
  main area to put it in; there is one now. Nothing about what it shows or stores changed in the
  move, and nothing in this file renders the frame around it: index.html holds the markup, and
  src/views.js decides which view is up. What went with the dialog is named where it mattered — the
  ✕ (see "there is no submit"), and the card's second control (src/home.js).

  ── WHY THIS SCREEN IS A GRID AND NOT A DAY ──

  It shipped once as one class on one day: a list of names with five P/T/A/E/D buttons on each
  row (commit 11f0780). It passed every acceptance line it had and it was WORSE FOR THE OWNER
  than the app it replaces, because Roll Call!'s registry view shows six days of columns at once
  and "which day did I forget?" is answered there by LOOKING. A hole is a blank column. Take that
  away and the question needs a memory, a date picker, and a second screen.

  So the surface is a table. The columns are the last six WEEKDAYS BY CALENDAR — not the dates
  this class has records for, which is the whole mechanism: a day you forgot has no record, so a
  window built from records would omit exactly the column you opened the screen to find. It is
  also not a schedule: nothing here predicts which classes meet, and plans/rotating-schedule.md is
  the decision record that says why there is nothing to predict with.

  ── THE FOUR STATES, AND WHY THERE IS NO SCHEDULE TO ASK ──

  plans/rotating-schedule.md is settled: there is no schedule object, no cycle, no rotation, no
  meeting pattern. A class met if it has an attendance record with no `exception`. So a class on a
  date is in exactly one of four states, and stateOf() below is the only place in the app that
  decides which:

    no record at all              → NOT TAKEN YET   "did I forget?"
    a record with no `exception`  → TAKEN           the class met; this is a meeting and it counts
    a record with an `exception`  → DID NOT MEET    dropped; it counts toward nothing
    no record, an event covers it → COVERED         the calendar says so; it counts toward nothing

  Nothing else in the app tests `exception` for itself, which is what made the fourth arrive as an
  edit to ONE function. It was three until WO-2.3, and the paragraph that stood here promised
  exactly this: *"WO-2.3 adds calendar events to the answer (a `no-school` range covering the date),
  and it adds them HERE, in one function, or the app grows a second opinion about whether a class
  met."* It does, and it did.

  THE ORDER IN THAT LIST IS THE PRECEDENCE RULE, and it is plans/rotating-schedule.md § Precedence
  word for word: a class MET if it has an attendance record with no exception — full stop, before
  the calendar is consulted at all. Otherwise it did not meet, whether that is from its own record
  or from an event covering the date. Which is also THE ONE RULE PROTECTING HISTORY: a retroactive
  snow day dropped over a week that was actually taken cannot void a single mark, because stateOf()
  never reaches the event on a date that has a record. The warning that goes with it is the
  authoring screen's (src/days-off.js) — this file simply cannot be talked into the damage.

  THE COLUMN HEADER WAS BUILT FOR THIS ARRIVING — the state chip is a word and a palette, not a
  boolean, so an event-covered day is a fourth word in the same slot, and the word is the event's
  own: "No school" or "Planned drop", with the teacher's title beside it as the reason. The palette
  is the dropped column's quiet grey made SOLID rather than dashed, because the two mean the same
  thing about the class and different things about where the undo lives.

  AND THE EVENT IS NEVER COPIED ONTO A RECORD. Nothing in this file writes an `exception` that came
  from the calendar; src/calendar.js's header argues why at length. Delete the holiday and every
  column here follows on the next paint, because there was never a copy to go and find.

  ── THE AMBIGUITY A GRID CREATES, WHICH A ONE-DAY SCREEN DID NOT HAVE ──

  An empty cell means TWO different things: "present" on a date the class was taken, and "no data
  at all" on a date it wasn't. If those look alike the teacher reads a forgotten day as a day when
  everybody showed up, which is the exact failure the three states exist to prevent. So a cell is
  never empty:

    the class was taken       → `P` on the positive wash — present, which is what no mark means
    a student not reached yet → `?` on the caution wash, on a column that is otherwise taken
    the class was not taken   → `?` on the caution wash, and the WHOLE COLUMN carries that wash
    the class did not meet    → `–` on a dashed grey, quiet, because there is nothing to do

  The column header says the same thing in words above it. The work order asks for the distinction
  "in the column header AND in the cells under it", and this is both halves. The two `?` readings
  are told apart the same way: an untaken column is amber END TO END and its head says "Not taken";
  a column being taken keeps the taken wash and its head counts what is left ("12 to go").

  ── EXCEPTIONS ONLY. PRESENT IS THE ABSENCE OF A MARK ──

  `marks` holds T / A / E / D, plus `U` for a student the teacher has not reached yet, and nothing
  else. A FINISHED class of 25 with two absences is two entries in the year document, not 25 —
  docs/data-model.md says so, and it is also why marking is fast. Storing `P` would pass every
  acceptance test this work order has, quietly triple the size of the document, and only show up as
  a problem in Phase 7 when it is being pushed through Drive. The guard is in setMark(): `P`
  DELETES, it never writes. There is ONE writer for every path on this screen — the cells, the
  column headers and the class-level buttons all land in the same few functions — because two
  writers means two exceptions-only guards and the second one is where a `P` eventually gets stored.

  Note that a cell still DISPLAYS `P`. Displaying it is the truthful reading of an empty entry on a
  taken day, and it is what Roll Call! shows in the same place; storing it is the trap.

  ── `U`, AND WHY THE RULE ABOVE IS RE-POINTED RATHER THAN REPEALED (WO-2.10) ──

  The owner used the registry and found the model backwards for how she stands in a room: a cell
  started on `?`, the first tap jumped to `A`, so confirming a student PRESENT cost four taps round
  the cycle — and tapping one student flipped every other cell from `?` to `P` at once, so there was
  no way to see who she had actually looked at. Underneath both: an unmarked student should read as
  ABSENT, not present. If she is pulled out mid-period the honest record is "I had not accounted for
  these students", not a silent room full of `P`.

  So the first tap on a class writes `U` — unconfirmed — for every student in it, and each `U` is
  DELETED as its student is confirmed. `U` counts as an absence wherever attendance is counted
  (WO-2.4's denominator, not its numerator), and it is scaffolding rather than a sixth code: it
  never appears on a button, in a total, or in a report.

  Three consequences, and the middle one is the one that keeps the rule above true:

    - THE DOCUMENT AT REST IS UNCHANGED. A finished class holds only its real exceptions, because
      every `U` was deleted on the way. The `U`s exist only between starting a class and finishing
      it, and they shrink as the teacher works.
    - `P` IS STILL NEVER STORED. Clearing a mark still means present. What the document now holds is
      exceptions to present, plus the students nobody has reached.
    - A CLASS LEFT HALF-TAKEN KEEPS ITS `U`s, which is the point — an accurate record of an
      unfinished class rather than a fabricated complete one. That is also DANGEROUS: one stray tap
      makes a meeting with two dozen absences in it, and the failure is silent unless something
      says so. Hence the count on the column head, in the state line, and on the home card. Do not
      make `U` quieter than it is.

  The five letters and their words are Roll Call!'s — P present, T tardy, A absent, E event,
  D dismissed — because the owner reads both apps this year and her fingers already know them.
  docs/data-model.md describes E in prose as an excused absence, which is what an `E` means for the
  percentage in WO-2.4; the word on the button is Roll Call!'s "Event", because that is the word
  she is used to tapping.

  ── ONE CYCLE, AND WHERE A CELL ENTERS IT ──

  Roll Call! cycles a cell `'' → P → A → T → E`, and it has a SECOND cycle for past days in a
  different order (cyclePastAttendance, dashboard.html:3802). Planbook has one cycle and one
  writer, and the order is

      P → A → E → T → D → P

  A cell ENTERS that cycle at `P`: from `?` — whether that is an untaken day or an unconfirmed
  student — the first tap means "I see you, you're here". That is the whole of WO-2.10's first
  complaint, and it is why `?` is not a step: once tapped, a cell never returns to it by cycling.
  (It can be put back deliberately — see un-confirm below.)

  `P` is a step in the cycle and is still never stored: landing on it deletes the entry, which is
  what present IS. `D` is a step because Planbook has no hall-pass flow to log a dismissal from, so
  the grid is the only place it can be said. The order is the owner's — she reordered E ahead of T
  on 2026-08-06 — and it is named on the screen (the hint under the grid) rather than only here,
  because it diverges from a habit in her fingers.

  ── A MARK CELL IS AN OBJECT, AND `T` AND `D` CARRY THE TIME (WO-2.10) ──

  `{ code: "T", at: "2026-09-09T08:14:00-04:00", note: "missed the bus" }`. Every cell is an
  object, including `U` and the untimed codes, because docs/data-model.md's score-cell rule —
  "always an object, never a bare number; polymorphic cells are where grade bugs live" — is the
  same rule one datatype over. `at` and `note` are simply absent where they do not apply.

  The time is captured from the device clock at the moment a cell settles on `T` or `D`, and
  cycling PAST one of them leaves no stray time behind (Roll Call!'s _trackTardyMark() solves the
  same case by discarding its pending capture; here the cell is rewritten whole, so there is
  nothing to discard). It matters because twenty minutes late and two minutes late are different
  conversations with a guardian, and Phase 5's templates want the difference.

  THE TIME LIVES IN THE CELL AND NOWHERE ELSE. A `log` entry mirroring each tardy would reuse
  machinery that already exists and would immediately make one event into two records — the
  second-source-of-truth pattern this project has refused four times.

  AND IT IS ONLY STAMPED ON TODAY'S COLUMN. Marking Tuesday's tardy on Thursday would otherwise
  record Thursday afternoon as the moment the student arrived, which is worse than no time at all:
  it is a wrong fact printed beside a student's name in a conversation with a parent. On a past
  column the mark is recorded without an `at`, and `{ code: "T" }` with no time is the honest
  record of a tardy whose moment was never captured. (The same reasoning as the migration's refusal
  to invent an `at` for marks written before this work order — src/store.js MIGRATIONS.)

  ── THERE IS NO SUBMIT, AND THERE IS NO DRAFT ──

  A tap writes. src/store.js debounces the write into one save 800ms later and the chip in the
  corner says so, but the change is in the document the instant the finger lifts. There is no
  "Save attendance", no "Finalize", no pending-edits buffer, and there must never be one: the
  teacher is interrupted mid-class every day of the week — a phone call, a nurse, a fire drill —
  and a screen that loses what she tapped because she never reached the bottom of it is a screen
  she stops trusting in week two. Nothing on this screen closes it: since WO-1.13 it is a view in
  <main> rather than a dialog, and leaving it is navigation rather than a decision — which is the
  same fact said in the architecture instead of in a ✕ that had to be explained.

  Two consequences worth naming, because both look like bugs from the outside:

    - OPENING THIS SCREEN WRITES NOTHING. Looking at a class is not taking its attendance, and if
      it were, "not taken yet" would be unreachable the moment a teacher browsed. INITIALIZATION IS
      AN ACT, NOT A VISIT — there are exactly two acts that start a class, and they are the two
      below.
    - TAPPING ONE CELL TAKES THE WHOLE CLASS, on that column's date, and CHANGES NO OTHER CELL ON
      THE SCREEN. The record is created by that tap with a `U` for every student in the class, and
      the one student tapped goes to `P`; everybody else still reads `?`, because nobody has looked
      at them yet. (Until WO-2.10 the same tap flipped all twenty-five of them to `P`, which is the
      owner's second complaint and the reason `U` exists.)
    - "EVERYONE'S HERE" TAKES THE CLASS AND RESOLVES EVERY STUDENT AT ONCE. It is the one control
      allowed to change every row, because that is exactly what it says it does.

  ── PAST DAYS TAKE AN UNLOCK; FUTURE DAYS CAN BE READ AND NEVER WRITTEN ──

  Today's column is live: its cells are buttons and its header drops the class in one tap. A past
  column is READ-ONLY until its ✏ is tapped, which is the "deliberate unlock" — one column at a
  time, the column tinted while it is open, a strip above the grid saying in words which day you
  are on, and the class-level controls retargeted to it. That strip is the "you are not on today"
  indication, and it is a strip rather than a subtle tint because it has to survive being read
  across a classroom.

  The window used to END at today and there was no index that could name tomorrow. Since 2026-08-08
  it runs forward as far as the last day off on the calendar, because WO-2.3 made the future worth
  looking at and the owner found the gap in the first sitting: a break you can set and cannot then
  go and look at is a break you cannot check. See dayColumns() and futureLimit().

  WHAT DID NOT MOVE IS THE WRITE. Every writer still refuses a date after today outright, so the
  block is a fact about the storage layer rather than a fact about which buttons got rendered —
  which is exactly why the columns could be opened up without touching it. A future column draws
  locked cells, no unlock, "Ahead" where a past day would say "Not taken", and a neutral wash where
  it would say it in alarm amber: a day that has not happened is not a hole you forgot.

  ── WHAT "TAKEN WITH EVERYONE PRESENT" NEEDS, AND WHY IT IS A BUTTON ──

  A class where nobody is absent produces no marks, so nothing about the ledger would distinguish
  it from a class the teacher forgot. "Everyone's here" is the tap that says the class met — it
  writes `{ classId, date, marks: {} }` and that empty object is the whole point of it. It is a
  toggle rather than a one-way door, and it is offered as an undo ONLY while the record holds no
  marks: there is nothing to lose then, and a control that could destroy a mark by being tapped
  twice does not belong on a screen operated at speed. To un-take a class that has exceptions on
  it, cycle them back to present first; then the toggle is there.

  ── ONE-TAP DROP, AND WHAT IT COSTS ──

  dropClass() writes exactly `{ classId, date, exception: "dropped" }` — the work order's own
  words, and docs/data-model.md's own shape. Nothing else is on that record, which means dropping
  a class that already had marks on it CLEARS THEM. That is a real cost and it was chosen over the
  alternative: keeping the marks alongside the exception would put a shape in the document that
  the data model does not describe, and every later reader — WO-2.4's counters, Phase 4's windows —
  would have to know to ignore marks it can see. So the loss is made loud instead of prevented:
  the announcement and the on-screen note say how many marks went. The realistic mistake here is
  dropping the wrong class, not dropping a class you have just taken.

  Un-dropping removes the record and leaves the day NOT TAKEN YET, which is the honest inverse: the
  teacher said the class did not meet and has taken that back, not claimed that everyone was there.

  ── WHAT IS NOT ON THIS SCREEN, ON PURPOSE ──

  No support data of any kind — no indicator, no plan, no medical note, no behavior plan. This is
  the screen most likely to be on a projector, with the roster of a whole class on it and thirty
  people looking at the wall, and a dot beside a name is a disclosure to all of them. So this
  module never asks src/supports.js its one visibility question, holds no sensitive field, and is
  deliberately absent from flipPresentationMode()'s redraw list in src/shell.js — the same
  arrangement, and the same reasoning, as src/home.js. docs/data-model.md § Accommodations rule 3
  wants a plan surfaced at the moment of use, and the moment it names is a FOURTH absence: that is
  a signal, it belongs to Phase 4, and the day one lands on this screen this paragraph stops being
  true and this module joins that list. (The function is not named here for the reason home.js
  gives: tools/wo-sweep.mjs reports which screens ask, and a mention would report this one as one
  that does.)

  ── THE PASSES COLUMN (WO-2.8) ──

  A fourth thing on this row, between the name and the days: three buttons while a student is in the
  room — 🚽 Bath, 🏥 Nurse, ⚡ Quick — and one Return button, with the time they left under it, while
  they are out. Roll Call!'s `col-passes` (dashboard.html:3988, 4267), same grammar, same three
  types, same 160px.

  WHAT IS NOT LIFTED FROM IT is the storage, and that inversion is the whole of that work order:
  over there an open pass is a module variable and a force-quit forgets a child who is out of the
  room. Here it is a record in the year document. src/passes.js owns that model and argues it; this
  file owns the column, the clock and the announcements.

  THE COLUMN IS ABOUT NOW, NOT ABOUT A DATE. It does not move with the six-day window and it is not
  affected by unlocking a past column: a pass is issued at the moment a student stands up, so there
  is one Passes column rather than one per day, and it says the same thing whichever week is on
  screen. The consequence to know is that it costs the grid ~160px of width, which is why
  dayColumnCount() below now reserves it — see that function.

  A PASS CHANGES NO ATTENDANCE. A student at the bathroom is present; issuing and returning writes
  no record and moves no mark. The one coupling runs one way and lives in setMark(): a `D` on
  TODAY's column closes the student's open pass, and taking that `D` back puts it out again. See the
  block at that branch.

  ── THE PASS BANNER (WO-2.11) ──

  ABOVE the grid, one card per student who is out of THIS room: their name, the type, the time they
  left, `✓ Return`, `✕ Cancel`, and a note field. Roll Call!'s `renderActivePassBanner()`
  (dashboard.html:3403), lifted card and all — avatar, two-line info block, colours and
  measurements. The first build of this kept the shape and re-derived the palette; the owner caught
  it against the running app on 2026-08-07, and the rule that came out of it is worth more than the
  card: WHEN LIFTING FROM ROLL CALL!, TAKE THE DESIGN WITH THE FUNCTION. It has been in a classroom
  for a year and this app has not.

  ── THE ELAPSED CLOCK AND THE TWO OVERDUE ALERTS (WO-2.9) ──

  The piece WO-2.11 left behind, and it landed into the place the stylesheet had held open for it:
  the big orange figure between the name block and the buttons, counting `m:ss` since they left.

  IT IS NOT A COUNTER. Every figure is a subtraction — the stamp in the document from a `now` read
  at the moment of painting — so an iPad that spent ten minutes asleep in a bag paints ten minutes.
  A counter that ticked would paint two, silently, because iOS stops timers when Safari backgrounds
  an installed PWA. That is the trap that kept this work order at M, and the arithmetic lives in
  src/passes.js so nothing on this screen can have a second opinion about it.

  AND AT FIVE AND TEN MINUTES THE CARD ESCALATES AND SAYS SO ONCE. What has already been said is a
  field on the pass — in the document, like the pass itself — so it survives a repaint, a reload and
  a force-quit, and it is gone the moment the student is back because the record it was on is.
  paintPassElapsed() carries the three clauses of that acceptance line, one per paragraph.

  CANCEL LIVES HERE AND NOWHERE ELSE, and that is the point of the banner rather than a consequence
  of it. The Passes column is 160px and already holds three targets; a fourth one beside Return is
  how a thumb aiming at Return destroys a real trip's minutes, so Roll Call! puts cancel on the card
  and never on the row you issued from. Planbook does the same. The cell keeps its bare Return, both
  Returns call the same writer, and the two surfaces repaint together in paintPasses().

  IT IS SCOPED TO THE CLASS ON SCREEN — openPassesFor(), never openPassesIn(). A pass left open in
  period 2 is not hidden by that: its own row in period 2's grid still carries a Return button and
  the time out, which is the surface the owner confirmed reads as a reminder. What it is not is
  noise on the screen you are standing in front of, naming students from a room you are not in.

  ── PORTRAIT SHOWS TODAY, LANDSCAPE SHOWS THE WEEK (WO-2.12) ──

  The six-day window is a landscape and laptop thing. In PORTRAIT this grid draws one day column —
  today's — because that is how the screen is used: held at the classroom door, marking the period
  that is walking in. Reading a week is a thing done sitting down, and the iPad is turned for it.

  It replaced a width budget that had been quietly taking columns away since the Passes column
  landed (four at 768pt, five at the owner's 834pt 11″), and it is a better answer than any number
  that budget could have produced: the name column stops competing for pixels at all, so a full
  surname fits without an ellipsis on the one screen where names are read at a glance.

  The cost, and it is real: BACKFILLING A PAST DAY NEEDS A DAY COLUMN, so correcting Tuesday means
  turning the iPad. The unlock is unchanged — see editPastDay() — and it is landscape that shows a
  Tuesday to unlock. Accepted with the trade on 2026-08-07.

  dayColumnCount() holds the rule and the argument; the listener under it is what makes a turn
  repaint without a reload.

  ── AND THE KEYBOARD MARKS IT (WO-2.5) ──

  `↓` picks up the first name, then one letter per student — P, T, A, E, D — with the selection
  moving down on its own. Since 2026-08-08 the laptop is the device of record and this is the path a
  live class is marked on, so it is built to the same clock everything above is: the hand does not
  leave the letters and the eyes do not have to leave the room. The block at markSelected() holds
  the model and what was taken from Roll Call! to build it; the keys themselves are named in
  src/shell.js's listener, and on screen in the ⌨ Keys dialog, which is what stops them being
  folklore.

  ── AND IT IS THE LEDGER EVERY OTHER READING COMES OFF (WO-2.6) ──

  A student's history and the class's printed record are not on this screen and are not drawn by
  this file: src/attendance-report.js owns both surfaces. What is here is the READING they are made
  of — walkMeetings(), attendanceHistory(), classRecord() — because "which meetings count" has been
  this file's answer since WO-2.1 and a second copy of that filter chain living in an export is a
  printout that disagrees with the percentage above it the first time a day off is added. The two
  doors onto those surfaces are on this screen: a student's own name in the grid, and 🖨 Record in
  the toolbar.

  The pass history reads the same way and is the same shape of thing: src/pass-history.js owns that
  dialog, this file owns the 🚪 Passes door in the toolbar that opens it, and the counting lives in
  src/passes.js where the passes do.

  Out of scope and deliberately absent: percentages and counts over history (WO-2.4)
  and the AUTHORING of calendar events
  (WO-2.3, src/days-off.js) — this screen reads them and never writes one, which is why the only
  control it offers on a covered day is a door to the screen that owns
  them.
*/

import { getDoc, update } from './store.js';
import { announce } from './live-region.js';
/* `initials` and `avatarClass` come from here rather than being re-derived, for the reason WO-1.10
   gives where they were exported: the colour is part of how a teacher recognises a person, so there
   is one answer per student and not one per screen. The roster and the home cards already read
   them; the registry is the third. */
import { getSelectedClass, getSelectedTerm, initials, avatarClass } from './classes.js';
/* WO-2.50, from the module that owns `terms[]`. `outOfTermGap` is the whole of the third write gate
   below and the reason it prints; `termIsDated` replaces the private termHasDates() this file used
   to carry (see the totals path); `termName` is how a term with an empty label still reads in a
   sentence. getSelectedTerm() above is imported for the ARITHMETIC and must not be reached for by
   any of that — the term tab decides what is COUNTED and has never decided what is WRITABLE, which
   is the whole of WO-2.50's decision 1. */
import { outOfTermGap, termIsDated, termName } from './classes.js';
/* The two name helpers, imported rather than re-written. src/roster.js's own header explains why a
   student is one record referenced from many places; how that record READS — "Van Dyke, Mary" in a
   list, "Mary Van Dyke" in a sentence — is the same question here as it is there, off the same
   shape, and a second copy in this file could be right about a hyphen, a suffix or a half-typed
   name in a way the roster is not. That is exactly the second opinion this repo keeps refusing.
   (Contrast src/roster.js's initialsOf(), which is written out separately from src/classes.js's
   initials() because those two read different shapes and answer different questions.) */
import { rosterName, fullName } from './roster.js';
/* The hall-pass model (WO-2.8). It is imported one way and only one way: src/passes.js holds no
   DOM, reads no clock and never calls the store, so this file can hand it the live document inside
   an update() without the two modules being able to disagree about who is out of the room. */
import * as passes from './passes.js';
/* WO-2.29's overdue tone. This file asks for an alert at a level and knows nothing else about it —
   no oscillator, no AudioContext, no preference — which is the module boundary that work order
   exists to draw. src/alert-sound.js is never handed a student. */
import * as alertSound from './alert-sound.js';
/* The calendar model (WO-2.3), imported the same one way src/passes.js is and for the same reason:
   it holds no DOM, reads no clock and never calls the store, so this file can ask it what covers a
   date without the two modules being able to disagree about whether a class met. It is imported
   READ-ONLY here — nothing in this file calls addEvent() or removeEvent(), because a screen that
   both reads an event and writes one is the second source of truth that whole model exists to
   prevent. src/days-off.js is the writer. */
import * as calendar from './calendar.js';
/* Which view is on glass, for the rotation repaint below and for nothing else. Imported rather than
   read off `#classView` here, so that "is the registry showing" has one answer in this app instead
   of two — and it costs no loop, because src/views.js imports src/prefs.js and nothing else. */
import { currentView } from './views.js';

const CLASS_NAME_ID = 'attendanceClassName';
const DATE_ID = 'attendanceDate';
const BANNER_ID = 'attendanceBanner';
const STATE_ID = 'attendanceState';
const ACTIONS_ID = 'attendanceActions';
const NOTE_ID = 'attendanceNote';
const SEARCH_ID = 'attendanceSearch';
const PILLS_ID = 'attendancePills';
const SORT_ID = 'attendanceSort';
const PAGER_ID = 'attendancePager';
const WRAP_ID = 'attendanceGridWrap';
const CAPTION_ID = 'attendanceCaption';
const HEAD_ID = 'attendanceHead';
const BODY_ID = 'attendanceBody';
const EMPTY_ID = 'attendanceEmpty';
const PASS_NOTE_ID = 'attendancePassNote';
const PASS_BANNER_ID = 'attendancePassBanner';
const TOTALS_ID = 'attendanceTotals';

/* ────────────────────────────── the vocabulary ──────────────────────────────
   Roll Call!'s five letters and its five words. `phrase` is the same fact said in a sentence —
   "2 absent", "1 at an event" — because a count line reads as a count and a chip reads as a
   label. */
export const MARKS = [
  { code: 'P', word: 'Present',   phrase: 'present' },
  { code: 'T', word: 'Tardy',     phrase: 'tardy' },
  { code: 'A', word: 'Absent',    phrase: 'absent' },
  { code: 'E', word: 'Event',     phrase: 'at an event' },
  { code: 'D', word: 'Dismissed', phrase: 'dismissed' },
];

/* Present, and the one code that is never stored. Named rather than written as 'P' at each use
   site so that the rule and the letter cannot drift apart. */
export const PRESENT = 'P';

/* Unconfirmed — the temporary code WO-2.10 added, deliberately NOT in MARKS above. It is not a
   sixth attendance code to a teacher: it is never on a button, never in a total, never in a
   report, and a finished class does not contain one. It is in the document only between the tap
   that starts a class and the tap that confirms the last student. See the header. */
export const UNCONFIRMED = 'U';

/* The codes that reach `marks` FROM A BUTTON. Derived from MARKS rather than written out a second
   time: a list that has to be kept in step with another list is a list that will not be. `U`
   reaches `marks` too and is deliberately not in here — every count that treats it as an absence
   asks for it by name, so that nothing can start reporting "1 unconfirmed" as a mark the teacher
   made. */
export const STORED_MARKS = MARKS.filter((m) => m.code !== PRESENT).map((m) => m.code);

/* The word for a code, for an announcement or a label. `U` has one even though no button carries
   it, because a screen reader lands on those cells like any other. */
function wordFor(code) {
  if (code === UNCONFIRMED) return 'Not confirmed';
  const known = MARKS.filter((m) => m.code === code)[0];
  return known ? known.word : 'Marked ' + code;
}

function phraseFor(code) {
  if (code === UNCONFIRMED) return 'not confirmed yet';
  const known = MARKS.filter((m) => m.code === code)[0];
  return known ? known.phrase : 'marked ' + code;
}

/* ────────────────────────────── one cell ──────────────────────────────

   A `marks` entry is `{ code, at?, note? }` and has been since WO-2.10 (src/store.js MIGRATIONS
   walks every older document up to it). These three are the only readers of that shape in the app,
   so a later field is added here rather than everywhere.

   They tolerate a BARE STRING, and that is not a hedge against the migration: the migration is the
   guarantee, and it runs on load and on restore. It is the same posture cellFor() takes toward a
   code this app does not know — a hand-edited or foreign document should render as itself rather
   than crash a screen that runs while a class walks in. Nothing here ever WRITES a string back. */
export function codeOf(cell) {
  if (typeof cell === 'string') return cell;
  return cell && typeof cell === 'object' && typeof cell.code === 'string' ? cell.code : '';
}

export function timeOf(cell) {
  return cell && typeof cell === 'object' && typeof cell.at === 'string' ? cell.at : '';
}

export function noteOf(cell) {
  return cell && typeof cell === 'object' && typeof cell.note === 'string' ? cell.note : '';
}

/*
  THE PASS A DISMISSAL CLOSED (WO-2.8), and the only cell that ever carries one is a `D`.

  It is on the cell rather than derived because the link has to die at exactly the moment the `D`
  does, and the cell is the only record in the document whose lifetime is exactly the dismissal's.
  Deriving it instead — "the most recent dismissed pass for this student" — would be matching two
  records on their contents, which is the `name + time` join that made Roll Call!'s pass rows
  fragile and is why docs/data-model.md makes this log append-only at all.

  Every other cell has no such field, and nothing ever writes one onto a code that is not `D`.
*/
export function passIdOf(cell) {
  return cell && typeof cell === 'object' && typeof cell.passId === 'string' ? cell.passId : '';
}

/*
  THE MOMENT A MARK SETTLED, as a full ISO timestamp WITH ITS OFFSET — `2026-09-09T08:14:00-04:00`
  and not `2026-09-09T12:14:00.000Z`.

  Built from the local calendar fields for the reason todayISO() is, one step further: an attendance
  time read back in another zone, or after the offset changed in November, has to still say the hour
  the teacher's clock said when she tapped. toISOString() would store the same instant and print it
  as a different hour, and "arrived 12:14" against a class that starts at 08:10 is a wrong fact
  beside a student's name.
*/
function stampNow(now = new Date()) {
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const offset = -now.getTimezoneOffset();      /* minutes east of UTC */
  const abs = Math.abs(offset);
  return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate())
    + 'T' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds())
    + (offset < 0 ? '-' : '+') + pad(Math.floor(abs / 60)) + ':' + pad(abs % 60);
}

/* `2026-09-09T08:14:00-04:00` → `8:14 AM`, read straight out of the string rather than through
   `new Date()`. The string already holds the wall clock the teacher saw; parsing it into an instant
   and formatting it back would re-express it in whatever zone the reading device is in, which is
   the one thing the offset above exists to prevent. An unparseable value renders as nothing at all
   rather than as "Invalid Date".

   EXPORTED SINCE WO-2.9 for src/pass-history.js, which prints the two stamps on a finished trip.
   Same reason plainDate() and numericDate() below are exported for src/attendance-report.js: a second
   copy of these four lines in a dialog is a second opinion about what hour a stamp says, and it
   would be wrong in exactly the case this one exists for. */
export function clockTime(iso) {
  const m = /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/.exec(String(iso || ''));
  if (!m) return '';
  const h = Number(m[1]);
  return (h % 12 || 12) + ':' + m[2] + ' ' + (h < 12 ? 'AM' : 'PM');
}

/* The same time in the width a 54px column has for it: `8:14a`. */
function compactTime(iso) {
  const said = clockTime(iso);
  return said ? said.slice(0, -3) + said.charAt(said.length - 2).toLowerCase() : '';
}

/*
  HOW LONG THEY HAVE BEEN GONE, as a figure (WO-2.9): `0:07`, `4:31`, `73:04`.

  Roll Call!'s own format — `m + ':' + pad(s)` (dashboard.html:3425), minutes uncapped, seconds
  always two digits — lifted rather than re-chosen, because it is the string the owner has been
  reading at a glance for a year and because tabular-nums makes a two-character seconds field stop
  moving under the eye.

  IT FORMATS A NUMBER AND READS NO CLOCK. The number comes from src/passes.js's elapsedSeconds(),
  which subtracts the stored stamp from a `now` the caller hands it; this half is here with the two
  other time formatters because how a time READS is this file's job everywhere else on this screen.
*/
function elapsedText(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const rest = s % 60;
  return Math.floor(s / 60) + ':' + (rest < 10 ? '0' : '') + rest;
}

/*
  THE CYCLE, and it is one cycle for every column — today's and any past one the teacher has
  unlocked. Roll Call! splits this into two functions with two different orders; that split exists
  over there because today's marks live in a local buffer and past ones are written straight
  through, which is a bridge problem Planbook does not have.

  Present is FIRST because a cell now ENTERS the cycle there (WO-2.10): from `?` the first tap means
  "I see you, you're here". Landing on it still deletes rather than writes, so present is a step in
  the cycle and never a value in the document.

  EVENT COMES BEFORE TARDY, which reversed WO-2.1's order on 2026-08-06 at the owner's request —
  she is the one whose fingers run this five times a day, and the second-commonest mark in her rooms
  is a student pulled out for an event rather than one arriving late. The order is hers to set; the
  two rules around it are not, and neither moved: P is still never stored, and a resting cell is
  still DRAWN as "P" so that an empty-looking cell on a taken day cannot be confused with a day
  nobody took. The screen says the order in words (the hint under the grid), because the divergence
  from her Roll Call! habit is named on the screen and not only in this comment.
*/
export const CYCLE = [PRESENT].concat(['A', 'E', 'T', 'D']);

/* What one tap gives, from whatever the cell reads now. `U` is not IN the cycle — it is where a
   cell starts — so it enters at present, and so does a code from a foreign document that this app
   cannot place in the ring. */
export function nextCode(code) {
  const index = CYCLE.indexOf(code);
  return index < 0 ? PRESENT : CYCLE[(index + 1) % CYCLE.length];
}

/* The only exception this file writes, and it is still the only one. plans/rotating-schedule.md
   names three more — `no school`, `snow day`, `holiday` — and WO-2.3 authors those as calendar
   EVENTS that this screen reads, never as values copied onto a record. That is now a fact about
   the shipped build rather than a plan: grep this file for `events` and every hit is a read. */
const DROPPED = 'dropped';

/* The four states, as strings rather than booleans, because there are four of them and the whole
   point of this design is that they are not interchangeable: the third is not the second, and the
   fourth is not the third. */
export const TAKEN = 'taken';
export const DID_NOT_MEET = 'dropped';
export const NOT_TAKEN = 'not-taken';
/*
  THE FOURTH (WO-2.3): the class did not meet, and the reason is on the calendar rather than on a
  record. The value is the internal name and never a word on screen — what a teacher reads is the
  event's own "No school" or "Planned drop" plus the title she typed (src/calendar.js KINDS) — but
  it IS a CSS class, worn by the column, the cells and the card's state line, exactly as the other
  three are. `covered` rather than `off` or `no-school`: `off` reads as a toggle, and `no-school`
  would name one of the two kinds that produce this state as if it were the only one.
*/
export const COVERED = 'covered';

/*
  AND THE MODIFIER THAT IS NOT A FIFTH (WO-2.50). There is no `OFF_TERM` state and there must never
  be one: a day outside every term of the class has no record and no covering event, so stateOf()
  answers NOT_TAKEN and goes on answering it — which is this file's own test for a modifier, stated
  at paintActions(). What sits below is a WORD, for the chip that has to say it in the two or three
  syllables a 72px column head holds, and a CSS suffix worn alongside the state class exactly the
  way `attendance-col-future` is. Two syllables, and "off" is the teacher's own word for a day the
  school is not in session on.
*/
const OFF_TERM = 'Off term';

/* Roll Call!'s own number (dashboard.html:3902), matched rather than re-argued: six columns is a
   school week you can see at a glance without the row becoming a scroll. */
const DEFAULT_DAY_COLS = 6;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];

/* ────────────────────────────── the date ──────────────────────────────

   Today, as `YYYY-MM-DD`, built out of the LOCAL calendar fields and never out of
   toISOString(). That method returns UTC, and UTC is a different day from about 7pm Eastern
   onward — so a teacher marking a make-up period after school in the autumn would silently write
   tomorrow's date, and the record would land on a day the class does not meet. The bug is invisible
   in the morning, which is when it would be tested.

   Every function below that writes takes a date rather than reaching for today itself, which is
   what lets one set of writers serve today's column and an unlocked past one. */
export function todayISO(now = new Date()) {
  const pad = (n) => (n < 10 ? '0' : '') + n;
  return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
}

/* `2026-09-08` → a Date at LOCAL midnight. Parsed field by field rather than handed to
   `new Date('2026-09-08')`, which the spec reads as UTC midnight — the same off-by-one-day trap as
   above, arriving from the other direction and showing the wrong weekday. Every date arithmetic in
   this file starts here. */
function parseISO(iso) {
  const parts = String(iso || '').split('-');
  if (parts.length !== 3) return null;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return isNaN(d.getTime()) ? null : d;
}

/* `2026-09-08` → `Tuesday, September 8, 2026`. */
export function spokenDate(iso) {
  const d = parseISO(iso);
  if (!d) return String(iso || '');
  return DAY_NAMES[d.getDay()] + ', ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getDate()
    + ', ' + d.getFullYear();
}

/* `2026-09-08` → `September 8, 2026`: spokenDate without the weekday. What a printed record's
   header and a file's name are read as months later, where the weekday says nothing and the year
   says everything. Added at WO-2.6 for src/attendance-report.js, and it lives HERE rather than
   there for the reason parseISO() above gives at length — `new Date('2026-09-08')` is UTC midnight
   and lands a day early west of Greenwich, and this file is not going to have a second opinion
   about what day a date is. */
export function plainDate(iso) {
  const d = parseISO(iso);
  if (!d) return String(iso || '');
  return MONTH_NAMES[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

/* `2026-09-08` → `9/8`, which is what fits in a column head. The year is deliberately absent: six
   weekdays never span a year boundary in a way a teacher could misread, and the spoken form is on
   every cell's accessible name.

   EXPORTED AT WO-2.6, with dayAbbr() below it, for the same one-clock reason plainDate() gives: the
   printed record's date columns and the history's own rows are the same dates the grid draws, said
   the same way, out of the same parser.

   CALLED shortDate() UNTIL WO-3.20, AND THE RENAME IS THAT WORK ORDER'S WHOLE POINT. Four other
   functions of that name existed in src/, three of them returning `Sep 8` — so the export a new
   screen found first, in good faith, was the one that says `9/8`, and a column of one format beside
   a column of the other is two correct dates that read as a bug. One name, one string: the `Sep 8`
   formatter keeps the name shortDate() and lives in src/date-text.js, and this one is named for what
   it produces. It does not compose from that file — `9/8` shares no substring with `Sep 8` — so
   nothing here changed but the name and its call sites. The format itself is untouched and is
   still this file's own decision, argued in the paragraph above. */
export function numericDate(iso) {
  const d = parseISO(iso);
  return d ? (d.getMonth() + 1) + '/' + d.getDate() : String(iso || '');
}

export function dayAbbr(iso) {
  const d = parseISO(iso);
  return d ? DAY_ABBR[d.getDay()] : '';
}

/*
  THE COLUMNS, and the one place Roll Call! must not be copied.

  getWindowedDays() over there slices `qData.days` — the days that exist in the sheet. Ours is the
  last N weekdays BY CALENDAR, whether or not anything has ever been recorded on them, because a
  day you forgot has no record and a hole you cannot see is a hole you cannot fill. That is the
  entire mechanism behind "a hole left three days ago is findable by looking".

  Today is always the first column even when today is a Saturday, which is Roll Call!'s own rule
  ("today plus the five preceding weekdays", dashboard.html:3899). On the five days that matter the
  two readings are identical; on a weekend this one keeps a column to drop or take, and the
  alternative would have left the screen with no today at all.

  `daysBack` IS IN WEEKDAYS, NOT IN WINDOWS, and that is the 2026-08-07 re-cut. It used to be a
  window index and the slice was `offset * count` — which multiplied the teacher's position by a
  number that CHANGES UNDER HER. Three taps of Earlier in landscape is eighteen weekdays back; turn
  the iPad and a window is one column wide, so the same 3 became three weekdays back and the grid
  jumped four weeks forward. The owner reported it as "I paged back three and turned it and got the
  4th" the day portrait shipped. A laptop window dragged from six columns to five does the same
  thing more quietly: offset 2 slides from twelve weekdays back to ten.

  An anchor date cannot do that. `daysBack` is the position of the LEFTMOST column in the weekday
  list, so a change in how many columns are drawn changes how many days are shown and not WHICH day
  the teacher is standing on. Paging still moves a whole window at a time — see pageDays(), which is
  where `count` is added rather than one — so "two weeks back is two taps" survives intact; it is the
  same distance, expressed in the unit that does not move.

  `daysBack` GOES NEGATIVE SINCE 2026-08-08, and that is the second re-cut of this function. It used
  to build one list walking backwards and slice it, which made "there is no future column" a fact
  about the generator: there was no index that could name tomorrow. That was right while nothing
  could be known about tomorrow. WO-2.3 made it wrong — a teacher can now set Thanksgiving in
  September, and the owner reported the consequence the day after the first sitting: "I can set
  future dates, but I can't scroll to them." A closure you cannot look at is a closure you cannot
  check, and the screen that shows what a class is doing was the one screen that refused to show it.

  So the index space is signed. Zero is today, positive counts weekdays back, negative counts them
  forward, and the window is `count` consecutive indices starting at `daysBack`. Nothing about the
  reading changes — a change in column count still moves how many days are shown rather than which
  day the teacher stands on, in both directions now.

  WHAT DID NOT CHANGE IS THE WRITE. writableDate() still refuses every date after today and is the
  only reason that holds; this function decides what is DRAWN, and the two have been separate since
  WO-2.1 precisely so that a change here could not become a change there. A future column renders
  locked cells and no unlock, the same as a past column nobody has opened — see dayHead().
*/

/*
  ONE INDEX → ONE DATE. Positive walks back, negative walks forward, zero is today whatever day of
  the week today is — Roll Call!'s rule (dashboard.html:3899), kept because on a weekend it is what
  leaves the screen with a column to take rather than with no today at all. Every other index is
  Mon–Fri.
*/
function weekdayAt(index, today) {
  const d = parseISO(today);
  if (!d) return '';
  if (!index) return todayISO(d);
  const step = index > 0 ? -1 : 1;
  let left = Math.abs(index);
  let guard = 0;
  while (left > 0 && guard++ < 4000) {
    d.setDate(d.getDate() + step);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) left--;
  }
  return todayISO(d);
}

function dayColumns(count, daysBack, today) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const iso = weekdayAt(daysBack + i, today);
    if (iso) out.push(iso);
  }
  return out;
}

/*
  HOW FAR FORWARD PAGING GOES, AND WHY IT IS NOT INFINITE.

  The future has nothing in it but the calendar. There is no attendance to read, nothing to mark,
  and no control to tap — so a screen that pages forever is a screen where every tap past the last
  holiday shows the same six empty columns and the teacher cannot tell whether she has reached the
  end or the app has stopped responding. The limit is therefore the last thing there is to SEE: the
  furthest date any day off or planned drop reaches. With an empty calendar it is today, and this
  screen behaves exactly as it did before WO-2.3 — Later disabled at the window that ends today.

  Returned as a `daysBack` index (0 or negative) rather than as a date, because that is what
  pageDays() clamps and what the pager compares against. The horizon sits in the NEWEST column of
  the furthest window, which is the one place it can be while the days around it are still visible.
*/
function futureLimit() {
  const doc = getDoc();
  const today = todayISO();
  const events = doc ? calendar.exceptionsIn(doc) : [];
  let last = today;
  events.forEach((e) => {
    const end = e && typeof e.endDate === 'string' && e.endDate > e.date ? e.endDate : (e && e.date);
    if (typeof end === 'string' && end > last) last = end;
  });
  if (last <= today) return 0;
  /* Walked ONCE rather than by asking weekdayAt() for each index in turn, which would restart the
     walk from today every time and make a June holiday quadratic in a function every paint calls.
     The two are the same arithmetic; this is the one that stays cheap in May. */
  const d = parseISO(today);
  if (!d) return 0;
  let i = 0;
  let guard = 0;
  while (guard++ < 4000) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    if (todayISO(d) > last) break;
    i -= 1;
  }
  return i;
}

/* The floor under a day column, and under the two columns that are not days. Every one of these is
   a number that also appears in src/attendance.css, which is a duplication with a reason: the
   browser distributes the grid, and this file only has to decide HOW MANY columns to ask it to
   distribute. They are named here so the arithmetic under dayColumnCount() can be read rather than
   trusted, and so that changing one in the stylesheet fails visibly here instead of silently there.

     DAY_COL_PX     `.attendance-day`'s min-width, lifted from Roll Call!'s `thead th.day-th`.
     PASS_COL_PX    `.attendance-passes`'s min-width, lifted from Roll Call!'s `col-passes`.
     NAME_COL_PX    what the name column asks for: capped on a coarse pointer (see the cap's own
                    comment in the stylesheet), and an estimate of a long name laid flat on a fine
                    one, where nothing caps it.
     CHROME_PX      the panel padding and page gutters between the viewport and the grid's box.
                    Measured, not derived: a 768px viewport gives the wrap 688px and a 1024px one
                    gives it 944px, on both pointers. */
const DAY_COL_PX = 72;
const PASS_COL_PX = 160;
const NAME_COL_COARSE_PX = 256;
const NAME_COL_FINE_PX = 280;
const CHROME_PX = 80;
/* Three is the fewest the WIDTH BUDGET will draw. Below the width where three fit, the wrap's
   `overflow-x` safety valve takes over — a phone is not the device this grid is for, and dropping
   to two columns would not make it one.

   IT HAS EXACTLY ONE EXCEPTION AND IT IS THE NEXT CONSTANT DOWN. WO-2.12 puts PORTRAIT at one
   column, and that is not the budget running out — it is a different question being answered before
   the budget is ever asked (see dayColumnCount). The floor still governs everything the budget
   decides, which is every landscape viewport and every laptop window; nothing else may go under
   three, and a second exception here would turn the floor into a suggestion. */
const MIN_DAY_COLS = 3;
/* The exception. In portrait this screen is held at the classroom door to mark TODAY — the owner's
   call, 2026-08-07 — so it draws today's column and nothing else. One rather than two: the second
   column would be yesterday, which is neither the day being marked nor the week being read. */
const PORTRAIT_DAY_COLS = 1;

/*
  How many day columns fit. Six is the answer on a laptop and on an iPad in landscape; a narrower
  viewport shows FEWER COLUMNS rather than scrolling sideways, because a grid you have to swipe
  horizontally to read is a grid whose whole argument — see it all at once — has been given away.

  IT IS A BUDGET NOW RATHER THAN A LADDER OF BREAKPOINTS, and WO-2.8 is why. Until the Passes column
  landed the ladder read `<420 → 3, <540 → 4, <680 → 5, else 6`, and those numbers were tuned for a
  grid with two columns in it: a name and six days. At 768px — an iPad in portrait, the device this
  screen is for — that came to 256 + 6×72 = 688, which is exactly the width the wrap has, and it fit
  with nothing to spare. A 160px Passes column does not go into nothing to spare. The choice was
  between three things and only three: overflow the wrap and let the valve engage (which is what
  clipped the WO-2.10 note panel off the right edge of the iPad and is the defect this screen was
  just fixed for), shrink the name column to about 96px (unreadable), or show fewer day columns.
  This screen already had an answer for "not enough width" and it is the third one, so the ladder
  became the arithmetic it was always standing in for.

  AND PORTRAIT NO LONGER ASKS THE BUDGET AT ALL (WO-2.12). What the budget cost was written here as
  "an iPad in portrait now shows four day columns instead of six" — four at 768pt, five on the
  owner's 834pt 11″, six only at 1024. That was escalated to her as a three-way choice (four, five,
  or six bought by cutting the name column to an avatar and an ellipsis) and she rejected the
  question on 2026-08-07: in portrait this screen is held at the classroom door to mark TODAY, and
  the six-day window is a thing you read at a desk. So portrait draws one column and landscape keeps
  six, and the arithmetic below is what LANDSCAPE and every laptop window run on.

  ORIENTATION IS THE SIGNAL, NOT WIDTH — which is why this is a branch above the budget and not a
  smaller number inside it. A 900px browser window is 900px wide and still LANDSCAPE, and a teacher
  who has dragged her laptop window narrow is at a desk reading a week; a width rule would give her
  today only and take the week off the device the week is for. The two questions are asked in the
  order they matter: which way is the screen held, then how much of it is there.

  Measured off the viewport rather than off the panel, and it stays that way after WO-1.13 moved
  this screen out of a dialog: a hidden element measures zero, this screen can legitimately be
  painted while `#classView` is still `.hidden` (boot restores the view and the paint in one pass),
  and a column count of three because the answer was asked a frame early is a defect nobody would
  look for here. THE ORIENTATION QUESTION IS ASKED THE SAME WAY AND FOR THE SAME REASON: it is
  `innerHeight` against `innerWidth`, which is a fact about the window from the first frame, and not
  the shape of an element that may not be on screen yet.

  `height` joins `width` as an optional argument for the reason `width` has one — so the pair can be
  put to this function directly rather than only through a viewport a harness has to emulate.
  Neither is passed by anything in the app.
*/
/* `h >= w` is what CSS's own `(orientation: portrait)` means, down to the square case, so this
   answer and a stylesheet's can never disagree — which matters because the name cap that pays for
   the portrait column lives over there. Written as arithmetic rather than as a matchMedia call so
   that dayColumnCount()'s two optional arguments reach it. Its own name because two things ask now:
   how many columns to draw, and whether paging is allowed at all. */
function isPortrait(width, height) {
  const w = typeof width === 'number' ? width : window.innerWidth;
  const h = typeof height === 'number' ? height : window.innerHeight;
  return h >= w;
}

function dayColumnCount(width, height) {
  const w = typeof width === 'number' ? width : window.innerWidth;
  if (isPortrait(width, height)) return PORTRAIT_DAY_COLS;
  /* The cap on the name column only exists under a coarse pointer, and the cells are 44px there
     rather than 34px, so the two pointers genuinely have different arithmetic. Asked at call time
     rather than at load: an emulated pointer changes under a harness, and a laptop with a
     touchscreen answers this differently from one without. */
  const coarse = typeof window.matchMedia === 'function'
    && window.matchMedia('(pointer: coarse)').matches;
  const spare = w - CHROME_PX - (coarse ? NAME_COL_COARSE_PX : NAME_COL_FINE_PX) - PASS_COL_PX;
  const fits = Math.floor(spare / DAY_COL_PX);
  return Math.max(MIN_DAY_COLS, Math.min(DEFAULT_DAY_COLS, fits));
}

/*
  THE COLUMNS THIS PAINT DRAWS, and the one place PORTRAIT PINS TO TODAY.

  Every render goes through here rather than calling dayColumns() with `pageDaysBack` directly, and
  that is the whole of the fix the owner asked for on 2026-08-07: *in portrait we only want to see
  today*. Enforced AT THE PAINT rather than on the rotation, because a turn is only one of the ways
  into a portrait screen that is paged away — a laptop window dragged tall, an iPad Split View pane,
  a class opened while already upright, a view restored at boot. Zeroing it on the turn would fix the
  route that was reported and leave the other four; zeroing it where the columns are decided means
  there is no state in which portrait is showing a day that is not today.

  IT WRITES TO MODULE STATE FROM A RENDER PATH, which is normally the thing to avoid, and it is
  deliberate: the alternative is a portrait screen that keeps a hidden page position, and a hidden
  position is what turned into "I paged back three, turned the iPad, and got the 4th". The write is
  idempotent — after the first paint in portrait it is already 0 — so a repaint cannot loop.

  Landscape then comes back on the week ending today rather than where the teacher was before she
  turned. That is a consequence of this rather than a separate rule, and it is the honest one: the
  alternative is remembering a paged position across an orientation that is not allowed to have one.
*/
function visibleColumns() {
  const count = dayColumnCount();
  if (isPortrait()) pageDaysBack = 0;
  /* AND THE FORWARD END IS PULLED BACK THE SAME WAY, AT THE PAINT, for the same reason and against
     the same kind of route. The horizon moves when the CALENDAR changes, not when the teacher taps
     anything: page forward to Thanksgiving, remove Thanksgiving, and the position that was legal a
     moment ago is now past the end of a calendar that no longer has anything in it. Clamping in
     pageDays() would only catch the taps; clamping here catches the deletion, the restore of a
     backup with fewer events in it, and a year switched underneath the screen. Idempotent, so a
     repaint cannot loop — exactly as the portrait line above it is. */
  const ahead = futureLimit();
  if (pageDaysBack < ahead) pageDaysBack = ahead;
  return dayColumns(count, pageDaysBack, todayISO());
}

/*
  THE ROTATION REPAINT, and it is the half of WO-2.12 that is not arithmetic. The count above is read
  when the grid is PAINTED, not when it is looked at, so an iPad turned from portrait to landscape
  would sit there with today's column alone until something else happened to redraw — and acceptance
  line 2 is "landscape still draws six, on the same device, WITH NO RELOAD".

  THIS WAS ONE MEDIA-QUERY LISTENER AND IT DID NOT SURVIVE THE OWNER'S IPAD (2026-08-07, the same day
  it shipped). What she saw: the first turn worked, the turn back did not, a reload restored six
  columns, and then the next turn into portrait did nothing at all. The argument for the single
  listener was that `(orientation: portrait)` fires exactly once on a flip while `resize` fires fifty
  times across a laptop window drag and needs a debounce to stop being one. Both halves of that are
  true and neither one held, because WebKit breaks it in two ways a Chrome harness cannot see:

    - **A MediaQueryList with no strong reference can be collected**, and its listener goes with it.
      The query was a `const` inside the registration block, referenced by nothing afterwards — so it
      was collectable the moment registration returned, and "worked once, then never again, timing
      unpredictable" is exactly the shape of a listener that a garbage collection ate. `mediaWatch`
      below is module-scoped for that one reason and must stay that way; it looks unused and is not.
    - **iOS reports `innerWidth`/`innerHeight` from BEFORE the turn** while the change event is being
      delivered. dayColumnCount() then measures the orientation the device just left, repaints the
      count that is already on screen, and the repaint is real but invisible — which is the other
      half of what she saw, and is why one more listener would not have been enough on its own.

  So the trigger is now every signal a turn produces — the media query, `resize`, and the deprecated
  `orientationchange` — and each of them asks THREE TIMES: now, next frame, and once more after the
  rotation animation has settled. The debounce objection is answered by the guard rather than by
  narrowing the trigger: syncDayColumns() compares the count it would draw against the count actually
  on screen and returns without touching the DOM when they match. A laptop window dragged across the
  whole budget repaints on the four widths where the answer changes and does nothing on the other
  forty-six frames, which is what the debounce was for. A duplicate signal is free by construction,
  and that is what makes it safe to listen to all of them.

  What it does NOT do is reset anything. renderAttendance() draws from the module state that is
  already there, so the open detail panel, the filter, the search and the page offset all survive
  the turn — which is the rest of acceptance line 3. A mark cannot be lost in flight because there
  is no flight: a mark is stored on the tap (see setMark), and a note is written per keystroke
  (setNote). What a repaint does cost is the caret, if the teacher is mid-word in a note when she
  rotates; that is the same trade paintDetail() already makes everywhere else, and rotating the iPad
  is not something done absent-mindedly mid-sentence.

  THE ONE THING IT DOES HAVE TO RECONCILE IS AN UNLOCKED PAST COLUMN, and leaving it out ships a
  broken screen rather than an untidy one. Unlock Tuesday in landscape, turn the iPad upright, and
  Tuesday is not a column any more — but `editingPast` still names it, so `editDate()` still answers
  Tuesday, every cell in today's column comes back NOT EDITABLE, and the banner above them says you
  are editing a day that is nowhere on screen. A teacher at the door with a class walking in cannot
  mark anybody. pageDays() already has this rule and states it: the strip that says WHICH day you
  are editing is only honest while that day is on screen. A turn is the second way that day can
  leave, so it takes the same exit — lockPastDay(), which clears it, repaints and says so out loud.

  Registered here rather than in src/shell.js, which owns every other listener in this app: those are
  delegated DOM listeners on `document`, and this is not a DOM event at all — it is this module's own
  measurement changing its answer, and the code that decides HOW MANY COLUMNS is the code that should
  notice. The guard is the same one shell.js's afterClassChange() applies, and for the same reason:
  painting a hidden screen is a hundred and fifty cells nobody is looking at, and the registry is
  repainted on arrival anyway.
*/
/* How many day columns are ON SCREEN right now, written by renderAttendance() at the moment it draws
   them. The guard below reads it, so it is a record of the DOM rather than of a decision — a repaint
   from any other cause (a class change, a page tap) keeps it honest for free, and there is no second
   piece of state that can drift out of step with the grid. */
let paintedDayCols = 0;

/* Long enough for an iPad's rotation animation to finish and the viewport metrics to be the new
   ones. Only ever costs a comparison if the earlier two attempts already got it right. */
const TURN_SETTLE_MS = 400;
let settleTimer = 0;

/* The guard AND the repaint. Cheap enough to call on every resize frame: two window reads and an
   integer compare before anything touches the DOM. */
function syncDayColumns() {
  if (currentView() !== 'class') return;
  const count = dayColumnCount();
  if (count === paintedDayCols) return;
  /* Asked with the NEW count, and through visibleColumns() so that a turn INTO portrait pins to
     today before this decides anything: is the day being edited one of the columns about to be
     drawn? lockPastDay() repaints and announces, so it is the whole of this branch rather than a
     step before renderAttendance(). */
  const shown = visibleColumns();
  if (editingPast && shown.indexOf(editingPast) < 0) lockPastDay();
  else renderAttendance();
}

/* Now, next frame, and after the turn has settled — see the header for why one look is not enough on
   iOS. The settle check is the only one that is debounced, because it is the only one where fifty
   pending timers would be fifty timers rather than fifty integer compares. */
function onTurn() {
  syncDayColumns();
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(syncDayColumns);
  if (settleTimer) clearTimeout(settleTimer);
  settleTimer = setTimeout(() => { settleTimer = 0; syncDayColumns(); }, TURN_SETTLE_MS);
}

/* MODULE-SCOPED SO THE LISTENER LIVES. See the header: a MediaQueryList referenced by nothing is a
   MediaQueryList WebKit may collect, taking the listener with it, and the screen that results looks
   like an iPad that has decided today is all there is. Nothing reads this variable and nothing
   should — holding the object IS its job. */
let mediaWatch = null;
if (typeof window.matchMedia === 'function') {
  mediaWatch = window.matchMedia('(orientation: portrait)');
  /* `addEventListener` on a MediaQueryList is Safari 14 and up; `addListener` is the deprecated
     fallback, kept because the failure it prevents is silent. */
  if (typeof mediaWatch.addEventListener === 'function') {
    mediaWatch.addEventListener('change', onTurn);
  } else if (typeof mediaWatch.addListener === 'function') {
    mediaWatch.addListener(onTurn);
  }
}
/* The two that do not depend on a media query surviving. `orientationchange` is deprecated and is
   here anyway: it is the one iOS has always fired, this app has to work on the iPad in the room, and
   a signal that duplicates another costs one integer compare. */
window.addEventListener('resize', onTurn);
window.addEventListener('orientationchange', onTurn);

/* ────────────────────────────── reading the document ──────────────────────────────

   Every read goes through these three. A document can legitimately arrive without `attendance` —
   restored from another build, or hand-edited — and a screen that checks before it iterates is a
   screen that will eventually forget (src/store.js:108-110, src/roster.js:127-131). */

function attendanceIn(doc) { return doc && Array.isArray(doc.attendance) ? doc.attendance : []; }

/* One record per class per date (docs/data-model.md). If a restored document somehow holds two for
   the same pair, the first is the one this app reads and the one every write below edits — so a
   duplicate is inert rather than a second truth that takes turns being visible. */
export function recordFor(classId, date) {
  return attendanceIn(getDoc())
    .filter((r) => r && r.classId === classId && r.date === date)[0] || null;
}

export function marksOf(record) {
  return record && record.marks && typeof record.marks === 'object' ? record.marks : {};
}

/*
  THE PREDICATE. What happened to this class on this date, in one word.

  Everything on the home screen, every column header on this screen, and every later phase's
  meeting count reads this rather than testing `exception` for itself. WO-2.3's calendar events went
  in here, as the comment that stood in this place said they would, and the four lines below ARE
  plans/rotating-schedule.md § Precedence:

    a record with no `exception`  → the class MET. Asked first, and nothing after it can undo that.
    a record with an `exception`  → it did not meet, from its own record.
    no record, an event covers it → it did not meet, from the calendar.
    nothing at all                → nobody has taken it yet.

  THE ORDER IS THE RULE THAT PROTECTS HISTORY. A retroactive snow day laid over a week that was
  really taken changes nothing here, because the record is answered before the calendar is even
  consulted — the protection is structural rather than a check somebody has to remember to write.
  The teacher is WARNED about it where the event is authored (src/days-off.js), which is the half a
  person needs; this half is why the warning can afford to be a warning rather than a refusal.

  AND THE EVENT IS READ, NOT COPIED. This is the read. There is no other one, and there is no write
  anywhere that turns a covering event into an `exception` on a record — see src/calendar.js.
*/
export function stateOf(classId, date) {
  const record = recordFor(classId, date);
  if (record) return record.exception ? DID_NOT_MEET : TAKEN;
  return coverOf(classId, date) ? COVERED : NOT_TAKEN;
}

/*
  WHICH EVENT COVERS IT, for the screens that owe the teacher a REASON rather than only a state.
  The work order's words are "shows as not-meeting, with the reason", and the reason is the title
  she typed — "Thanksgiving break" is what makes an empty column read as an answer instead of as a
  hole.

  It answers on a date that has a record too, and that is deliberate rather than sloppy: the state
  is TAKEN there and the column is drawn as taken, but the row's own accessible name can still say
  the calendar disagreed, which is the only place a teacher would ever find out that the snow day
  she added is sitting over a period she really did teach.
*/
export function coverOf(classId, date) {
  return calendar.coveringEvent(getDoc(), classId, date);
}

/*
  THE WORD AND THE REASON, from an event, in one place — so the column head, the state line, the
  card and every announcement say the same thing about the same day. `word` alone where there is no
  title, because "No school · No school" is what a required-title-with-a-default would produce.
*/
function coverWord(event) {
  const info = event ? calendar.kindInfo(event.kind) : null;
  return info ? info.word : 'No school';
}
/*
  EVERY MEETING THAT WAS ACTUALLY RECORDED IN A DATE RANGE — the reading behind the warning
  src/days-off.js owes before it lays a retroactive exception over real work.

  It is HERE rather than there because "what is a meeting" is this file's answer and has been since
  WO-2.1: a record with no `exception`. A copy of that test inside the authoring screen could agree
  with itself and disagree with this one, and the day it did, the warning would go quiet about the
  exact records it exists to protect.

  What comes back is `{ classId, date }` and nothing else. The marks are not carried out of here:
  the warning counts periods, not students, and a list of who was absent on the days somebody is
  about to declare a snow day over is a screen nobody asked for. Sorted by date so the sentence
  reads in the order the days happened.
*/
export function meetingsBetween(from, to) {
  return attendanceIn(getDoc())
    .filter((r) => r && !r.exception && typeof r.date === 'string'
      && r.date >= from && r.date <= to)
    .map((r) => ({ classId: r.classId, date: r.date }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/*
  HOW MUCH OF THE LEDGER A WHOLE DOCUMENT HOLDS — every class, every date, in three numbers.
  Written for src/backup.js's restore confirm (WO-1.15), which used to count `students` and
  `classes` and nothing else, so an empty term and a full one drew the same panel.

  IT IS HERE FOR THE REASON meetingsBetween() GIVES ABOVE: "what is a meeting" is this file's
  answer, and `doc.attendance.length` in the backup module would have been the second definition —
  one that counts a dropped class as a meeting and would have gone quietly wrong in the dialog
  that decides whether a term survives. Everything else in this app already asks stateOf().

  IT TAKES A DOCUMENT INSTEAD OF READING getDoc(), which is what makes it the only reader here
  shaped this way, and the restore confirm is why: the two documents it describes are a raw stored
  record for a year that is NOT open (possibly written by an older build) and the parsed contents
  of a file another browser wrote. stateOf() cannot answer about either, because its calendar rung
  is a question about the current document — and it does not need to. Only the first two rungs of
  plans/rotating-schedule.md § Precedence can be seen in a document at all:

    a record with no `exception`  → the class MET, and this counts it
    a record with an `exception`  → it did not meet, counted apart as `notMeeting`
    no record                     → NOT TAKEN YET, which is not a thing any count can see

  A `U` IS NOT A MARK. It means nobody has looked at that student yet, and the rule that arrives
  with it is that it never appears in a total (docs/data-model.md) — a half-taken class must not
  report twenty-five marks the teacher never made, least of all on a screen whose whole job is to
  say how much is at stake. codeOf() does the reading, so a document from before WO-2.10 with bare
  string cells counts identically to one written after it.
*/
export function ledgerCountsIn(doc) {
  const records = attendanceIn(doc);
  let meetings = 0;
  let marks = 0;
  records.forEach((r) => {
    if (!r || r.exception) return;
    meetings += 1;
    const cells = marksOf(r);
    Object.keys(cells).forEach((id) => {
      if (codeOf(cells[id]) !== UNCONFIRMED) marks += 1;
    });
  });
  return { meetings: meetings, notMeeting: records.length - meetings, marks: marks };
}

function coverTitle(event) {
  return event && typeof event.title === 'string' ? event.title.trim() : '';
}
function coverText(event) {
  const title = coverTitle(event);
  return coverWord(event) + (title ? ' · ' + title : '');
}
/* The same fact in a sentence, for a cell's accessible name and for an announcement. The TITLE
   keeps its own capitals — it is a proper noun as often as not ("Thanksgiving break") — so this is
   built from the kind's spoken form rather than by lower-casing the chip. */
function coverSaid(event) {
  const info = event ? calendar.kindInfo(event.kind) : null;
  const title = coverTitle(event);
  return (info ? info.said : 'no school') + (title ? ' — ' + title : '');
}

/*
  How many of each stored code are on the record, `U` among them and counted separately. One date's
  marks only — counts over a term, and the percentage that comes from them, are WO-2.4's and are
  deliberately not here.

  `U` IS COUNTED APART FROM `A` HERE AND FOLDED INTO IT THERE. WO-2.4 owes
  `(P+T+E+D)/(P+T+A+E+D)` with every `U` in the denominator alongside the absences — that is the
  arithmetic. What this function feeds is the SCREEN, and a card that said "26 absent" about a class
  the teacher is half way through taking would be describing a fabricated fact rather than an
  unfinished one. Two numbers here, one sum there.
*/
export function countsFor(classId, date) {
  const marks = marksOf(recordFor(classId, date));
  const counts = {};
  STORED_MARKS.forEach((code) => { counts[code] = 0; });
  counts[UNCONFIRMED] = 0;
  Object.keys(marks).forEach((id) => {
    const code = codeOf(marks[id]);
    if (Object.prototype.hasOwnProperty.call(counts, code)) counts[code] += 1;
  });
  return counts;
}

/*
  WHAT ONE CELL READS AS, which is not the same question as what is stored in it.

    an entry            → its own code, `U` included
    no entry, taken     → present, because present is the absence of a mark
    no entry, no record → unconfirmed, because nobody has looked at this class at all

  The third line is what makes a student added to the roster AFTER a class was taken read as present
  on that day rather than acquiring a mark retroactively: there is a record, so there is no entry to
  invent. Every reader on this screen — the cells, the filter pills, the cycle — goes through here,
  so there is one answer to "what does this cell say".
*/
function readingOf(record, studentId) {
  const entry = marksOf(record)[studentId];
  if (entry) return codeOf(entry) || PRESENT;
  return record ? PRESENT : UNCONFIRMED;
}

/* The ledger supplies candidate dates; stateOf() remains the one meeting predicate. Kept here so
   window totals, signal windows and the rendered class count cannot grow three subtly different
   copies of the same filter chain. */
let meetingDatesCalls = 0;
function meetingDates(classId, from = '', to = '') {
  meetingDatesCalls += 1;
  return attendanceIn(getDoc())
    .filter((r) => r && r.classId === classId && typeof r.date === 'string'
      && (!from || r.date >= from) && (!to || r.date <= to))
    .map((r) => r.date)
    .filter((date, index, all) => all.indexOf(date) === index)
    .filter((date) => stateOf(classId, date) === TAKEN);
}

/* Read-only verification seam for WO-2.13: the browser harness resets this immediately before a
   render and reads it immediately after. It counts calls; it never holds attendance data. */
export function resetMeetingDatesCallCount() { meetingDatesCalls = 0; }
export function meetingDatesCallCount() { return meetingDatesCalls; }

/* Last N recorded meetings of one class, newest first. Candidate dates come from the ledger, but
   stateOf() remains the predicate; callers never grow a second exception or calendar test. */
export function lastMeetings(classId, count, through = todayISO()) {
  const limit = Math.max(0, Math.floor(Number(count) || 0));
  if (!classId || !limit) return [];
  return meetingDates(classId, '', through)
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    .slice(0, limit);
}

function emptyAttendanceCounts() { return { P: 0, T: 0, A: 0, E: 0, D: 0 }; }

function meetingRecords(classId, from = '', to = '') {
  return meetingDates(classId, from, to).map((date) => recordFor(classId, date));
}

/* The counts so far, as the totals every surface in this app phrases. A copy rather than the live
   tally, because walkMeetings() below hands one of these out per row and a shared object would leave
   every row of a history reporting the last row's numbers. */
function summarise(counts) {
  const meetings = MARKS.reduce((sum, mark) => sum + counts[mark.code], 0);
  const attended = counts.P + counts.T + counts.E + counts.D;
  return Object.assign({}, counts, { meetings: meetings, attended: attended,
    percent: meetings ? (attended / meetings) * 100 : null });
}

/*
  ONE WALK OVER ONE SET OF RECORDS: the rows a history lists, and the totals its percentage is.

  WO-2.6's first acceptance line — "a student's history lists exactly the meetings counted in their
  percentage, the two agree" — is a claim about a SHARED SOURCE and not about two implementations
  landing on the same number. A second walk with its own filter would agree on any fixture anybody
  wrote and disagree in November, on the first retroactive snow day, the first class dropped from
  its own record, the first student added to a roster mid-term. So the list and the arithmetic come
  out of the same pass, and totalsFrom() below is the totals half of THIS rather than a second count
  standing beside it. Nothing in this file may grow a second row list.

  CHRONOLOGICAL, oldest first — which the totals do not care about and a history does: a running
  percentage is only running if the rows are in the order the days happened, and the ledger's own
  order is insertion order, where a backfilled Tuesday sits after the Friday that followed it.

  `U` FOLDS INTO `A` HERE, exactly as it did when this was one function, and the fold is what the
  header at the top of this file promises: `U` is scaffolding, it counts as an absence wherever
  attendance is counted, and it never appears in a total or in a report. So an unconfirmed student's
  history row reads `A` and their CSV cell reads `A` — never `U`, and never a blank that would read
  as a day nobody took.
*/
function walkMeetings(records, studentId) {
  const counts = emptyAttendanceCounts();
  const rows = records.slice()
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((record) => {
      const reading = readingOf(record, studentId);
      const code = reading === UNCONFIRMED ? 'A' : reading;
      if (Object.prototype.hasOwnProperty.call(counts, code)) counts[code] += 1;
      const so = summarise(counts);
      return { date: record.date, code: code, meetings: so.meetings, attended: so.attended,
        percent: so.percent };
    });
  return { rows: rows, totals: summarise(counts) };
}

function totalsFrom(records, studentId) {
  return walkMeetings(records, studentId).totals;
}

/* One student's Roll Call!-compatible totals over an inclusive range. stateOf() decides meetings;
   readingOf() includes roster members with no stored mark. U folds into A here and nowhere else.
   `percent: null` is the honest zero-meeting state. */
export function attendanceTotals(classId, studentId, from = '', to = '') {
  return totalsFrom(meetingRecords(classId, from, to), studentId);
}

export function termTotals(classId, studentId, term) {
  return attendanceTotals(classId, studentId, term && term.start, term && term.end);
}
/* `termHasDates()` STOOD HERE AND IS GONE INTO src/classes.js's termIsDated() (WO-2.50), and this
   is the point of departure the work order asks be written down. Its one line — both dates present —
   is the same rule the new bound needs, on the same field, in the module that owns terms; a private
   second copy is the shape src/date-text.js's header is a thousand words about, and the day the two
   disagreed, the two readers below would scope a printed report and a totals line by one rule while
   the register refused days by the other. The composed test also checks the SHAPE of both dates,
   which the copy did not: see termIsDated() for why that difference is an improvement rather than a
   change of behaviour. */

/*
  ONE STUDENT'S RECORDED MEETINGS, oldest first, each with the mark it was given and the percentage
  as it stood after it (WO-2.6). Same range arguments as attendanceTotals() above and the same walk
  underneath, so the list a teacher reads at a conference and the figure on her registry cannot come
  apart — see walkMeetings().

  What a row holds is a date, a code and the running arithmetic. It does NOT hold the note or the
  time on the mark: those are the row's own detail on the registry, they belong to the day rather
  than to the term, and a history that carried them would be a second surface for editing them.
*/
export function attendanceHistory(classId, studentId, from = '', to = '') {
  return walkMeetings(meetingRecords(classId, from, to), studentId).rows;
}

export function termHistory(classId, studentId, term) {
  return attendanceHistory(classId, studentId, term && term.start, term && term.end);
}

/*
  Exported at WO-2.6 so that a printed page, a CSV and a dialog say a percentage in exactly the
  words the registry says it in. Two renderings of one number drawn by two modules is how a printout
  that has left the building comes to disagree with the screen it was taken from.

  countText() below is deliberately NOT exported with it: the report surfaces lay the five counts
  out as five columns, where "P 3 · T 0 · A 0" is a line for a place with one line to spend.
*/
export function percentText(totals) {
  return totals.percent === null ? 'No recorded meetings' : Math.round(totals.percent) + '%';
}
function countText(totals) {
  return MARKS.map((mark) => mark.code + ' ' + totals[mark.code]).join(' · ');
}

/*
  THE WHOLE CLASS'S ATTENDANCE FOR THE OPEN TERM, as data — the reading src/attendance-report.js
  turns into a printed page and a CSV, and the only reading either of them gets.

  IT IS HERE RATHER THAN THERE because "which meetings count" is this file's answer and has been
  since WO-2.1, the same argument meetingsBetween() makes at the top of this file. A copy of that
  filter chain inside an export would agree with itself perfectly and disagree with the percentage
  on the registry the moment a day off is added, which is precisely the failure WO-2.6's first
  acceptance line is written against.

  NO ARGUMENTS, and that is deliberate: it answers "the class and term on screen", which is what
  both surfaces are about, and it reads the roster in markingOrder() — the same order, and the same
  sort toggle, as the rows the teacher is looking at. Nothing here is narrowed by the search box or
  the filter pills: a record with three students missing out of it because a pill was left on is a
  record that is wrong in a way nobody would notice until a conference.

  `dates` IS THE DENOMINATOR AND THE TERM'S RANGE IS A LABEL. Everything in this app counts recorded
  meetings and never calendar days (docs/data-model.md), so `start` and `end` are what the header
  prints and `dates.length` is what the percentages are over. An undated term falls back to the
  first and last meeting there actually was, because a header with an empty range on it says less
  than one that says which days this page covers.

  WHAT IS NOT ON IT: nothing from a student's record but the name they are marked under and the id
  their row is keyed by. No guardian, no counselor, no support block — no accommodation, medical or
  plan field reaches this shape at all, in either presentation mode, which is what makes WO-2.6's
  fourth acceptance line true by construction rather than by a conditional somebody has to
  remember. The rule is docs/data-model.md's and src/supports.js's header states it: the JSON backup
  is the one file that carries any of that, and it says so in its own words on screen.
*/
export function classRecord() {
  const cls = openClass();
  if (!cls) return null;
  const term = getSelectedTerm();
  const dated = termIsDated(term);
  const records = dated ? meetingRecords(cls.id, term.start, term.end) : meetingRecords(cls.id);
  const dates = records.filter(Boolean).map((r) => r.date)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const students = markingOrder(cls).map((student) => {
    const walk = walkMeetings(records, student.id);
    const marks = {};
    walk.rows.forEach((row) => { marks[row.date] = row.code; });
    return { id: student.id, first: String(student.first || ''), last: String(student.last || ''),
      name: rosterName(student), marks: marks, totals: walk.totals };
  });
  return {
    classId: cls.id, className: cls.name,
    termLabel: term && term.label ? term.label : '',
    dated: dated,
    start: dated ? term.start : (dates[0] || ''),
    end: dated ? term.end : (dates[dates.length - 1] || ''),
    dates: dates, students: students,
  };
}

/*
  The state as a sentence, and the one place the words come from — the home screen's card and this
  screen's own line say the same thing about the same class because they call the same function.

  "Taken · 2 absent, 1 tardy" while the list is short enough to read at a glance on a card, and
  "Taken · 4 marked" past that: a card is about 200px wide and a line that ellipsises mid-word says
  less than a shorter true one.

  AND A HALF-TAKEN CLASS LEADS WITH THE NUMBER IT HAS NOT REACHED — "12 unconfirmed · 1 absent"
  rather than "Taken · 1 absent". This is the surface WO-2.10's Traps line demands and it is not
  decoration: a class holding `U`s is a meeting, every `U` in it is an absence, and one stray tap
  therefore creates a meeting with two dozen absences in it. That failure is silent, looks exactly
  like data, and is otherwise found in November when a percentage is wrong. The word "Taken" is
  dropped in that state on purpose — the class is BEING taken, and a green "Taken" over twelve
  students nobody has looked at is the sentence this whole design exists to stop.
*/
export function stateSummary(classId, date) {
  const state = stateOf(classId, date);
  const empty = { state: state, marked: 0, unconfirmed: 0 };
  if (state === NOT_TAKEN) {
    /*
      OUTSIDE EVERY TERM (WO-2.50), AND THIS IS THE ONE PLACE THOSE WORDS ARE DECIDED — the home
      card and the state line above the grid both read them from here, which is what makes "the card
      and the screen it opens are one answer about one class" true of this answer as it already is
      of the other four. `offTerm` rides out on the summary beside `state`, the same shape `cover`
      takes: paintActions() needs the gap to write the sentence under the line and src/home.js needs
      it to pick the quiet palette, and asking a second time would be two answers to one question.

      NOTHING ABOUT THE STATE CHANGES. It is NOT_TAKEN on the way in and NOT_TAKEN on the way out —
      the CSS class the card and the line wear is still `not-taken`, with the modifier on top — and
      this branch is reached only when there is no record, so decision 2 is already satisfied before
      the question is asked. "Not taken yet" is an accusation, and a day the class does not exist on
      is not a hole anybody has to fill.
    */
    const gap = offTermOf(classId, date);
    if (gap) return Object.assign(empty, { text: offTermText(gap), offTerm: gap });
    return Object.assign(empty, { text: 'Not taken yet' });
  }
  if (state === DID_NOT_MEET) return Object.assign(empty, { text: 'Didn’t meet' });
  /* The card and the state line both have a whole line to spend, so this is the one surface where
     the reason fits beside the word — "No school · Thanksgiving break". The event comes back on the
     summary as well, because paintActions() below needs the kind to write the sentence under it and
     asking for the cover a second time would be two answers to one question. */
  if (state === COVERED) {
    const event = coverOf(classId, date);
    return Object.assign(empty, { text: coverText(event), cover: event });
  }

  const counts = countsFor(classId, date);
  const unconfirmed = counts[UNCONFIRMED];
  const marked = STORED_MARKS.reduce((n, code) => n + counts[code], 0);
  const parts = [];
  /* Absences first, then tardies, then the two rarer ones — the order a teacher cares about them
     in, not the order the letters happen to sit in. */
  ['A', 'T', 'E', 'D'].forEach((code) => {
    if (!counts[code]) return;
    parts.push(counts[code] + ' ' + phraseFor(code));
  });
  const lead = unconfirmed ? unconfirmed + ' unconfirmed' : 'Taken';
  const out = { state: state, marked: marked, unconfirmed: unconfirmed };
  if (!parts.length) {
    return Object.assign(out, { text: unconfirmed ? lead : 'Taken · all present' });
  }
  if (parts.length > 2) return Object.assign(out, { text: lead + ' · ' + marked + ' marked' });
  return Object.assign(out, { text: lead + ' · ' + parts.join(', ') });
}

/* The state as a word small enough to sit in a column head. The same answers as stateSummary, said
   in the two or three words a 72px column can hold — and it is a WORD rather than only a colour,
   because "distinguishable without reading fine print" is not a claim colour alone can carry for a
   teacher who does not see red and green apart.

   A column being taken says how many are left rather than "Taken", for the reason stateSummary
   gives at length: this is the second of the three places a half-taken class has to be loud, and
   it is the one directly above the `?`s it is counting. */
function stateChip(state, unconfirmed, cover, future, offTerm) {
  if (state === TAKEN) return unconfirmed ? unconfirmed + ' to go' : 'Taken';
  if (state === DID_NOT_MEET) return 'Didn’t meet';
  /*
    "OFF TERM" RATHER THAN "NOT TAKEN", AND IT OUTRANKS "AHEAD" (WO-2.50). The state is genuinely
    still not-taken — stateOf() is untouched and this changes no answer it gives — but both of the
    other words are wrong here. "Not taken" is an accusation drawn in the one colour on this screen
    that is an alarm, and last June is not a hole. "Ahead" is a promise that the day is coming round
    to be marked, and a day outside every term is not: nothing about waiting will open it, only the
    term dates will, which is where the state line below sends her.

    It is a word and not a state, so the covered branch below still wins on a day off that also
    falls outside a term — what the calendar says about a day is more useful than what the term
    dates say about it, which is the same sentence "Ahead" is subject to one line down and for the
    same reason. The two can never collide anyway: `state` is COVERED there, and NOT_TAKEN here.
  */
  if (offTerm && state === NOT_TAKEN) return OFF_TERM;

  /*
    "AHEAD" RATHER THAN "NOT TAKEN", ON A DAY THAT HAS NOT HAPPENED (2026-08-08, with the columns
    that made it reachable). The state genuinely IS not-taken — stateOf() is untouched and this
    changes no answer it gives — but the two words are an accusation on this screen. "Not taken"
    means you have a hole to go and fill, and it is drawn in the same amber as the `?`s underneath
    it for exactly that reason. Next Tuesday is not a hole. Reading a column of amber alarms across
    a week the teacher is looking at BECAUSE she wanted to check a holiday would be the screen
    inventing five jobs that do not exist.

    It is a word, not a state: the covered branch below still wins on a future day off, because what
    the calendar says about a day is more useful than the fact that the day is ahead.
  */
  if (future && state === NOT_TAKEN) return 'Ahead';
  /* The fourth word, in the slot this header has held open for it since WO-2.1. Two or three
     syllables, because 72px is what a column has: the TITLE — the reason — goes on the head's own
     tooltip and accessible name and on the state line above the grid, where there is room for it.
     A 9px "Thanksgiving break" wrapped over three lines in a column head is fine print, and fine
     print is what the words on this row exist instead of. */
  if (state === COVERED) return coverWord(cover);
  return 'Not taken';
}

/* ────────────────────────────── which class, which date ──────────────────────────────

   The screen works on the class the app has open and it holds no copy of that: the open class is
   src/classes.js's answer for the same reason src/roster.js takes it from there — a second place
   that remembers which class is open is a second answer to the question the header already
   answers.

   Today is asked for FRESHLY AT EVERY RENDER rather than captured at open, so an app left open
   across midnight does not go on writing yesterday. The six-day window has exactly the same hazard
   and gets exactly the same treatment: dayColumns() is called during the render, off today, never
   stored. */
function openClass() { return getSelectedClass(); }

/* ── THE VIEW STATE ──
   Seven values, none of them student data and none of them persisted. They are reset on every
   arrival (see resetRegistry): a teacher who left a past column unlocked yesterday should not find
   it still unlocked when she opens the screen with a class walking in.
   (The count said five until WO-2.5 and had said five since WO-2.10 added `detailFor` — it is a
   number in a comment, which is the kind that goes stale silently. Counted, not guessed.) */
let editingPast = null;    /* an ISO date, or null for "today" */
let pageDaysBack = 0;      /* WEEKDAYS back from today to the leftmost column; 0 is today's window.
                              In weekdays and not in windows since 2026-08-07 — a window changes
                              width when the iPad turns, and multiplying a teacher's position by a
                              number that moves under her is how three taps back became four weeks.
                              Always 0 in portrait; see visibleColumns(). */
let searchText = '';
let filterCode = 'all';    /* 'all' or one of P T A E D */
let sortBy = 'last';       /* 'last' or 'first' */
let detailFor = '';        /* the student whose row detail is open, or '' — one at a time */
let selectedId = '';       /* the student the KEYBOARD is on, or '' — WO-2.5, and see that block
                              below for why it is a row rather than a cell */

/*
  THE DATE THAT ACCEPTS EDITS. Today unless a past column has been deliberately unlocked.

  The `>= today` branch is the midnight case: an app left open overnight with Tuesday unlocked
  wakes up on a Wednesday where Tuesday is still legitimately past, but an app left open with
  TODAY somehow recorded here would be holding a date that is no longer today. Re-derived rather
  than trusted.
*/
function editDate() {
  const t = todayISO();
  if (!editingPast || editingPast >= t) { editingPast = null; return t; }
  return editingPast;
}

/*
  THE ONE GATE EVERY WRITER PASSES THROUGH, and the reason "future dates are blocked" is a fact
  about the storage layer rather than about which buttons happened to get rendered. The grid never
  offers tomorrow — the window ends at today and "Later" is disabled there — but a hook fired from
  a stale DOM, a keyboard path added in WO-2.5, or a restored document with a bad date would all
  arrive here, and marking Friday's attendance on Wednesday is a mistake rather than a feature.
*/
function writableDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(date)) && String(date) <= todayISO();
}

/*
  THE SECOND GATE (WO-2.3), AND IT IS ABOUT THE CALENDAR RATHER THAN ABOUT THE CLOCK.

  The one above answers "is this date in the past or today"; this one answers "has the school
  already said nobody meets". They are two questions and they get two functions — folding the
  calendar into writableDate() would make a date-shape check into a document read on every call,
  and would put "which class" into a signature that deliberately does not have it.

  IT IS DELIBERATELY NOT THE MIRROR OF stateOf()'s COVERED BRANCH, and the difference is the rule
  protecting history: this returns false the moment a record exists, because a day with attendance
  ON it is a day the record won, and the teacher must go on being able to edit the marks she made.
  What it refuses is CREATING a meeting under a holiday, which is the only way the calendar and the
  ledger could come to disagree from this side.

  Like the gate above it, this is a fact about the writers rather than about which buttons got
  rendered: a covered column draws no tappable cell and offers no class-level control, so the only
  ways here are a stale hook, WO-2.5's keyboard path, or a rotation that repainted around a tap.
*/
function coveredDay(classId, date) {
  return !recordFor(classId, date) && !!coverOf(classId, date);
}

/*
  THE THIRD GATE (WO-2.50), AND IT IS ABOUT THE TERMS RATHER THAN ABOUT THE CLOCK OR THE CALENDAR.

  writableDate() answers "is this date today or earlier". coveredDay() answers "has the school
  already said nobody meets". This one answers "does this class exist yet on this day at all" — and
  until it was written, the register was the single place in this app where a term's dates meant
  nothing. `terms[].start` and `.end` have been in the document since WO-1.6 and five surfaces read
  them, every one as ARITHMETIC. Nothing read them as a bound on writing, so on 2026-08-18 the grid
  drew a live column with a tappable cell per student and the drop control in its head, ten days
  before the owner's first term began — and a meeting recorded there is in the document, in the
  backup and in the year total while being in NO term percentage, which is a number wrong in a place
  she cannot see.

  IT IS ANY TERM OF THE CLASS AND NEVER THE SELECTED ONE. src/classes.js's outOfTermGap() is where
  that decision is argued; getSelectedTerm() is imported into this file for the totals and a reader
  who reaches for it here has quietly rebuilt the thing decision 1 refused.

  AND IT IS WRITTEN THE WAY coveredDay() ABOVE IS WRITTEN, `!recordFor(...) && ...`, because it is
  the same rule protecting the same history: WHAT IT REFUSES IS CREATING A MEETING. A day that
  already carries attendance stays fully editable — every mark on it, and the undo of a drop — which
  is the owner's decision 2 and is not a courtesy. A lock that stranded a record would leave a wrong
  number in the year total with no way to reach it from inside the app, and the records this landed
  on top of are her own test taps from the setup fortnight. Nothing migrates them; they stay exactly
  where they are, editable and uncounted, which is decision 2 working rather than a gap.

  It is deliberately NOT a fifth state. paintActions() already wrote the test — if stateOf() would
  still answer the same word, it is a modifier — and it would: the class has no record and no
  covering event, so the day is NOT_TAKEN and stays NOT_TAKEN. Out-of-term rides ALONGSIDE the state
  the way `future` does, and stateOf()'s four-line precedence learns nothing about terms, because
  that precedence is the structural protection for history and a fifth branch inside it would be a
  fifth way for a term-date edit to change what a recorded day means.

  Like both gates above it, this is a fact about the writers rather than about which buttons got
  rendered: an out-of-term column draws no tappable cell and no control at all, so the only ways
  here are a stale hook, WO-2.5's keyboard path, or a rotation that repainted around a tap.
*/
function offTermDay(classId, date) {
  return !recordFor(classId, date) && !!outOfTermGap(classId, date);
}

/*
  THE SAME ANSWER WITH THE REASON ON IT, for the surfaces that owe the teacher one — the sibling of
  coverOf() above, and the one place the two differ is deliberate. coverOf() answers on a date that
  has a record too, so a row can still say the calendar disagreed with a period that was really
  taught. This one goes silent the moment a record exists, because there is nothing for it to say
  there: the record won, the day is fully editable, and a column that read "Off term" over marks a
  teacher can change would be the screen contradicting itself.
*/
function offTermOf(classId, date) {
  return offTermDay(classId, date) ? outOfTermGap(classId, date) : null;
}

/*
  WHICH SIDE OF WHAT, in the words the state line, the head's tooltip and the card all use. It names
  the term, because "outside every term" on its own is a refusal with no address: the teacher most
  likely to meet this screen is the one who has not typed her term dates yet, and dayHead()'s own
  complaint binds hardest here — an app that greys a screen out without saying what would un-grey it
  is an app she has to guess at with a class walking in.
*/
function offTermWhere(gap) {
  if (gap && gap.before && gap.after) {
    return 'between ' + termName(gap.before) + ' and ' + termName(gap.after);
  }
  if (gap && gap.after) return 'before ' + termName(gap.after);
  if (gap && gap.before) return 'after ' + termName(gap.before);
  /* Unreachable from outOfTermGap(), which only answers when the class has a dated term the date is
     outside of — so it is before one, after one, or both. Written anyway, because a sentence that
     ends in the word "before" is what a null would print. */
  return 'outside every term';
}

/* The same fact in the two shapes coverText() and coverSaid() have, and for the identical reasons:
   one for a line and a tooltip, one for an accessible name and an announcement, so the column head,
   the state line, the cells and the card cannot come to say it four ways. */
function offTermText(gap) {
  return OFF_TERM + ' · ' + offTermWhere(gap);
}
function offTermSaid(gap) {
  return 'outside every term — ' + offTermWhere(gap);
}

/* ────────────────────────────── writing ──────────────────────────────

   The writers all have the same shape: refuse what cannot be true, write through src/store.js's
   update(), repaint what changed, say what happened. None of them buffers, and there is nothing
   anywhere in this file that a later tap has to confirm.

   EVERY ONE OF THEM PASSES ALL THREE GATES SINCE WO-2.50, and the asymmetry a reader will notice is
   worth having explained. coveredDay() sits on three of them — the three that can CREATE a record —
   because it is the only three it could ever bite on. offTermDay() sits on all seven and on
   editPastDay(), which is not the same claim flattened: it is the deliverable's own words, "every
   writer that takes a date passes it", and it costs nothing to be literal about it, because that
   gate answers false the moment a record exists. On the four writers that require a record before
   they do anything — the un-take, the un-drop, the un-confirm and the note — it is therefore
   provably inert, and that is the point: DECISION 2 IS WRITTEN INTO THE GUARD ITSELF rather than
   into a reader's memory of which writers were left out of it. The undo paths go on working on an
   out-of-term day that carries a record, which is the only way back to the marks on it.

   EVERY ONE TAKES AN EXPLICIT DATE, defaulting to the column that accepts edits. That parameter is
   the whole of "mark a past date": the exceptions-only guard, the `P`-deletes-rather-than-writes
   rule, the refusal to write onto a dropped record and the no-op-on-an-unchanged-code rule all
   run on one code path for every column. A second writer for grid cells would be a second copy of
   those four rules, and the second copy is where a stored `P` comes from.

   `d` is the live document inside update(); nothing below reads the module-level getDoc() from in
   there, which is what keeps the mutation and the read of the same object in one place. */

function listIn(d) {
  if (!Array.isArray(d.attendance)) d.attendance = [];
  return d.attendance;
}

/*
  The record for this class and date, created if it is not there. Creating one is what "the class
  met" means, so this is the function that takes a class.

  `seed` is WO-2.10's whole initialization rule and it is a PARAMETER because the two acts that
  start a class differ deliberately:

    a tap on one cell   → seed = the roster. Every student gets a `U`, and the caller then moves
                          the one student it was about to `P`. Nothing else on the screen changes.
    "Everyone's here"   → seed = nothing. The class is taken with everybody present, which is an
                          empty `marks` object, which is what that button says it does.

  It only ever seeds on CREATION. A record that already exists is not re-seeded, or confirming a
  student would put every `U` back on the next tap; and a student added to the roster later never
  acquires a mark for a class that was taken before they arrived.
*/
function ensureRecord(d, classId, date, seed) {
  const list = listIn(d);
  let record = list.filter((r) => r && r.classId === classId && r.date === date)[0];
  if (!record) {
    record = { classId: classId, date: date, marks: {} };
    (seed || []).forEach((id) => { record.marks[id] = { code: UNCONFIRMED }; });
    list.push(record);
  }
  if (!record.marks || typeof record.marks !== 'object') record.marks = {};
  return record;
}

/* The ids this class's `U`s are written for: the roster, in the document's own order, and only the
   ids that name a real student — the same filter rosterOf() applies before drawing a row, because a
   `U` for a student who is not on the screen is an absence nobody can clear. */
function seedIds(cls) {
  return rosterOf(cls).map((s) => s.id);
}

function removeRecord(d, classId, date) {
  d.attendance = listIn(d).filter((r) => !(r && r.classId === classId && r.date === date));
}

/*
  One student, one code, one date. This is the whole of "exceptions-only", and the three lines that
  matter are the seed, the delete and the assignment.

  `P` deletes the entry rather than writing one. That is the trap this work order names by name: a
  build that stored `P` would pass every acceptance line here and put twenty-five entries in the
  document for a class where nobody was absent.

  THE FIRST WRITE OF A CLASS SEEDS EVERY STUDENT WITH `U` (WO-2.10), and this is the only place it
  happens — so "tap a cell" and "any later path that writes a mark first" cannot disagree about what
  starting a class means. The tapped student's own entry is then set or deleted on top of the seed,
  which is why one tap gives one `P` and twenty-five `?` rather than a screen full of `P`.

  Setting the code a student already has does nothing at all — no write, no save, no `rev`. The
  cycle below can never ask for that, but a keyboard path or a stale tap can, and a screen operated
  at speed should not spend a revision on a tap that changed nothing.
*/
export function setMark(studentId, code, date) {
  const cls = openClass();
  const on = date || editDate();
  if (!cls || !studentId || !getDoc()) return;
  if (!MARKS.some((m) => m.code === code) && code !== UNCONFIRMED) return;
  if (!writableDate(on)) return;
  /* The calendar says nobody meets and nothing here has been recorded yet, so a mark would be this
     screen inventing a meeting under a holiday. See coveredDay(). */
  if (coveredDay(cls.id, on)) return;
  /* And the term dates say this class does not exist on this day, with nothing recorded on it yet —
     so a mark would be a meeting in a term percentage that can never count it. See offTermDay(),
     and note that it answers false the moment a record exists, which is the whole of decision 2:
     the marks already sitting on the owner's stray Aug-18 taps stay editable from this same path. */
  if (offTermDay(cls.id, on)) return;

  const record = recordFor(cls.id, on);
  /* A class that did not meet has no attendance to hold. Its cells are not rendered as buttons, so
     this is a guard rather than a path — but it is the guard that keeps a stray hook from writing
     marks onto a dropped record, which is a shape the data model does not have. */
  if (record && record.exception) return;

  const current = readingOf(record, studentId);
  /* Nothing to write — but only once the record exists. Setting P on a class that has not been
     taken yet is a real act: it takes the class, with everyone present in front of her and this
     one student confirmed. */
  if (record && current === code) return;

  let passSaid = '';
  update((d) => {
    const r = ensureRecord(d, cls.id, on, seedIds(cls));

    /*
      `D` AND AN OPEN PASS AGREE — the one coupling between a mark and a hall pass, and it runs one
      way only. A student marked dismissed while they are out of the room is not coming back, so the
      pass is CLOSED rather than left open forever; taking the `D` back puts it out again, still
      since the same minute. Roll Call!'s _finalizeDismissedPass() / cancelDismiss() pair is the
      model, and src/passes.js's reopenPass() explains where the two builds diverge.

      IT IS INSIDE THIS update() ON PURPOSE. The mark and the pass are one act, and two update()
      calls would be two saves and a window in which the document says a dismissed student is also
      out of the room.

      TODAY ONLY, AND BOTH HALVES OF IT. A `D` typed onto last Tuesday says nothing about who is in
      the corridor now, and closing a live pass from a past column would be the device clock
      deciding a fact about a day it was not there for — the same refusal as the `at` stamp two
      lines below. THE UNDO IS GATED THE SAME WAY, and it is the half that is easy to leave open:
      the reopen looks like a pure retraction of the app's own write, so a date guard on it feels
      redundant. It is not. Yesterday's `D` still carries yesterday's passId, and yesterday's column
      is unlockable (WO-2.1). Ungated, editing that cell today pushes a finished pass back into
      `openPasses` with YESTERDAY's `out` — the registry then draws a Return button for a student
      who is sitting in the room, the pass eats one of this class's three slots until somebody taps
      it, and the retraction deletes a real completed dismissal out of the append-only history. That
      is the Traps paragraph's own failure — the app asserting a child is out of the room when they
      are not — running in the mirror direction.

      What a past-dated edit does instead: nothing to either collection. The dismissal stands in
      `passes` as the honest record of a trip that did happen, and the link dies with the cell,
      because the cell is rewritten whole below and the passId is not carried across. The pass is
      no longer undoable from that cell, which is the same accepted loss as the two class-level
      resets below and for the same reason — the day it belonged to is over.

      Only a `D` cell ever carries a passId, and setMark() has already refused a no-op, so a prior
      one here means this tap is LEAVING a dismissal. Nothing has to work out which way it went.

      THE TWO CLASS-LEVEL RESETS DO NOT COME THROUGH HERE, and that is a known and accepted cost.
      "Un-confirm everyone" and "Didn't meet" both wipe `marks` wholesale — they say so, loudly,
      counting what goes — and a `D` destroyed that way takes its passId with it, leaving the pass
      logged as a dismissal that can no longer be un-done. That is the honest record: the pass DID
      happen and the student DID leave. What is lost is the undo, on a path whose whole point is
      that it discards the marks on the day.
    */
    const priorPass = on === todayISO() ? passIdOf(r.marks[studentId]) : '';
    if (priorPass && passes.reopenPass(d, priorPass)) {
      passSaid = ' Their pass is open again.';
    }

    if (code === PRESENT) { delete r.marks[studentId]; return; }
    /* THE CELL IS REWRITTEN WHOLE, which is what keeps a stray time from surviving a cycle: going
       T → E builds `{ code: 'E' }` and the tardy's `at` is simply not carried across. Roll Call!
       does the same job by deleting a pending capture (_trackTardyMark, dashboard.html:3568); here
       there is no pending anything, so there is nothing to forget to delete.

       `at` is stamped for T and D and only on today's column — see the header for why a device
       clock says nothing true about a tardy being entered two days later. The note is the one
       thing that DOES carry across a code change: it is a fact about the student on that day
       ("left for the nurse"), not about which letter is on the cell. Cycling to present drops it
       with the entry, which is the branch above and is the acceptance line's own wording.

       AND IT DOES NOT CARRY ONTO A `U`, which is the one exception and was found by the harness
       rather than reasoned out here. Un-confirming means "as if nobody had looked at this student
       yet", and a note left behind on that cell would be a fact about a mark that no longer exists
       — sitting in an entry which is itself deleted the moment somebody confirms them present. A
       `U` is `{ code: "U" }` and nothing else, everywhere. */
    const cell = { code: code };
    if ((code === 'T' || code === 'D') && on === todayISO()) cell.at = stampNow();
    const note = code === UNCONFIRMED ? '' : noteOf(r.marks[studentId]);
    if (note) cell.note = note;
    /* The other half of the dismissal rule. The pass is closed with the same stamp the cell just
       took, so the record says the student left the corridor at the moment the `D` says they were
       dismissed — one clock reading, not two a second apart. The id comes back onto the cell, and
       it is the only field here that is not about the mark. */
    if (code === 'D' && on === todayISO()) {
      const closed = passes.closePass(d, cls.id, studentId, cell.at, passes.BY_DISMISSAL);
      if (closed) {
        cell.passId = closed.id;
        passSaid = ' Their pass is closed at ' + closed.minutes
          + (closed.minutes === 1 ? ' minute.' : ' minutes.');
      }
    }
    r.marks[studentId] = cell;
  });

  /* The whole column, not just the cell: a first mark turns the column from NOT TAKEN to TAKEN, and
     every other cell in it goes from a column-wide `?` to its own `U`. The glyph does not change —
     that is the point of `U` — but the wash, the head and the count above them all do. The tbody is
     NOT rebuilt, so the scroll position of a twenty-six-name table survives a mark made half way
     down it. */
  paintColumn(on);
  paintActions();
  paintRenderedTotals();
  /* The Passes column is repainted from here because a `D` can have closed or reopened a pass, and
     because the cap it is drawn against has moved with it. It costs one pass over the rows on a tap
     that usually changed nothing there; the alternative is a Return button still sitting beside a
     student the teacher has just dismissed. */
  paintPasses();

  const student = findStudent(studentId);
  announce(fullName(student) + ' — ' + wordFor(code)
    + (on === todayISO() ? '' : ' on ' + spokenDate(on)) + '.' + passSaid);
}

/*
  A TAP ON A CELL. Reads what the cell says, writes the next code, and does it through setMark() so
  that every rule above applies to a cell exactly as it applies to anything else.

  From `?` — an untaken day or an unconfirmed student — the next code is present, because `U` is not
  a step in the ring. Once tapped a cell never cycles back to `?`; putting one back is a deliberate
  act with its own control.
*/
export function cycleMark(studentId, date) {
  const cls = openClass();
  const on = date || editDate();
  if (!cls || !studentId) return;
  setMark(studentId, nextCode(readingOf(recordFor(cls.id, on), studentId)), on);
  /* A TAP HANDS THE ROW TO THE KEYBOARD (WO-2.5). Click one cell with the mouse and the rest of the
     class can be finished from the letters, which is the flow a teacher falls into when she starts
     pointing and then puts her hand back on the keys. It takes the selection and deliberately NOT
     the focus: on a touch device, focusing what a thumb just hit is the keyboard path reaching into
     the tap's, and paintColumn() has already restored the ring for anyone who arrived here by
     pressing Enter on the cell. */
  selectStudent(studentId, { focus: false });
}

/*
  "Everyone's here": the tap that records a meeting with no exceptions on it, and the one control on
  this screen allowed to change every row at once. Without it, a class where nobody was absent is
  indistinguishable from a class the teacher forgot, which is the question the whole three-state
  design exists to answer.

  It also finishes a class she is part way through: every `U` goes, because "everyone's here" said
  of the students nobody has reached yet is exactly what this button means. Real marks are left
  alone — a class with two absences already on it stays a class with two absences.
*/
export function takeClass(date) {
  const cls = openClass();
  const on = date || editDate();
  if (!cls || !getDoc() || !writableDate(on)) return;
  if (coveredDay(cls.id, on)) return;
  if (offTermDay(cls.id, on)) return;
  const existing = recordFor(cls.id, on);
  const waiting = countsFor(cls.id, on)[UNCONFIRMED];
  if (existing && !existing.exception && !waiting) return;

  update((d) => {
    const record = ensureRecord(d, cls.id, on);
    /* Defensive: this control is not offered on a class that is already marked as not meeting.
       If it is ever reached from one, taking the class means it met. */
    delete record.exception;
    Object.keys(record.marks).forEach((id) => {
      if (codeOf(record.marks[id]) === UNCONFIRMED) delete record.marks[id];
    });
  });

  paintColumn(on);
  paintActions();
  paintRenderedTotals();
  announce(cls.name + ' is taken for ' + spokenDate(on)
    + (waiting ? ', with the ' + waiting + ' still unconfirmed marked present.' : ', with everyone present.'));
}

/*
  THE CLASS RESET. Every student back to `?`, which is the state a class is in the moment it is
  started and nothing has been looked at.

  It destroys the marks already on the record, and that cost is made LOUD rather than prevented —
  the same call dropClass() makes below, for the same reason and with the same two surfaces saying
  so: the control's own title counts what will go, and the announcement counts what did. The
  realistic mistake here is a teacher who has started the wrong class, not one who has just finished
  marking a period and taps "un-confirm everyone" for fun.

  It is deliberately NOT offered on a class whose record holds nothing real — there the honest
  control is the un-take, which removes the record and leaves the day not taken yet. See
  paintActions().
*/
export function unconfirmAll(date) {
  const cls = openClass();
  const on = date || editDate();
  if (!cls || !getDoc() || !writableDate(on)) return;
  if (offTermDay(cls.id, on)) return;
  const record = recordFor(cls.id, on);
  if (!record || record.exception) return;
  const ids = seedIds(cls);
  if (!ids.length) return;

  const summary = stateSummary(cls.id, on);
  update((d) => {
    const r = ensureRecord(d, cls.id, on);
    r.marks = {};
    ids.forEach((id) => { r.marks[id] = { code: UNCONFIRMED }; });
  });

  paintColumn(on);
  paintActions();
  paintRenderedTotals();
  announce('Every student in ' + cls.name + ' is unconfirmed again for ' + spokenDate(on) + '.'
    + (summary.marked ? ' The ' + summary.marked + (summary.marked === 1 ? ' mark' : ' marks')
      + ' already on it were cleared.' : ''));
}

/* One student back to `?`, from the row's own detail panel. The un-confirm the work order asks for
   at the student level: a cell cycled by mistake goes back to where it started rather than round
   the ring again. It writes a `U` on a record that exists and does nothing at all on one that does
   not — an unconfirmed student on an untaken day is already `?`, and creating a record to say so
   would be this screen taking a class the teacher never touched. */
export function unconfirmStudent(studentId, date) {
  const cls = openClass();
  const on = date || editDate();
  if (!cls || !studentId) return;
  if (!recordFor(cls.id, on)) return;
  setMark(studentId, UNCONFIRMED, on);
}

/*
  A NOTE ON A MARK, typed in the row's detail panel and written as it is typed — the same posture as
  every other field editor in this app (src/roster.js), and for the same reason: there is no submit
  step on this screen and there must never be one.

  IT DOES NOT REPAINT, and that is the load-bearing line rather than an optimisation. Re-rendering
  the row would replace the <input> the teacher is typing into, which takes the caret and the
  software keyboard with it — the same trap that keeps the search box in index.html rather than in a
  renderer.

  A note needs a mark to sit on. A present student has no entry by construction, so there is nothing
  to attach one to and the panel does not offer the field; this refusal is the same rule stated
  where it cannot be skipped.
*/
export function setNote(studentId, text, date) {
  const cls = openClass();
  const on = date || editDate();
  if (!cls || !studentId || !getDoc() || !writableDate(on)) return;
  if (offTermDay(cls.id, on)) return;
  const record = recordFor(cls.id, on);
  if (!record || record.exception || !marksOf(record)[studentId]) return;

  const note = String(text == null ? '' : text);
  update((d) => {
    const r = ensureRecord(d, cls.id, on);
    const cell = r.marks[studentId];
    if (!cell) return;
    /* Normalised on the way past, for the one shape that can still be a bare string here: a
       document hand-edited after the migration ran. Writing the note onto a string primitive
       would throw in a module, and this file never writes a string back. */
    const next = typeof cell === 'object' ? cell : { code: codeOf(cell) };
    if (note.trim()) next.note = note;
    else delete next.note;
    r.marks[studentId] = next;
  });
}

/* And back off again. Offered only while the record holds no MARK — `U`s do not count, because a
   class nobody has confirmed anything on has nothing to lose, and an accidental first tap has to be
   undoable. A control that can destroy a mark by being tapped twice does not belong on a screen
   operated at speed, and the refusal below is that rule stated where it cannot be skipped. */
export function untakeClass(date) {
  const cls = openClass();
  const on = date || editDate();
  if (!cls || !getDoc() || !writableDate(on)) return;
  if (offTermDay(cls.id, on)) return;
  const record = recordFor(cls.id, on);
  if (!record || record.exception) return;
  if (stateSummary(cls.id, on).marked) return;

  update((d) => removeRecord(d, cls.id, on));
  paintColumn(on);
  paintActions();
  paintRenderedTotals();
  announce(cls.name + ' is not taken for ' + spokenDate(on) + '.');
}

/*
  One tap, and the class is done. The record written here is exactly the one the work order and
  docs/data-model.md specify and nothing more: class, date, exception. Nothing to set up at the
  start of the year and nothing to maintain when the rotation shifts, which is the entire argument
  of plans/rotating-schedule.md.

  Marks already on the record go with it. See the header comment for why that is the chosen cost
  rather than a shape the data model does not describe — and note that what is lost is said out
  loud, in the note under the state line and in the announcement, rather than happening quietly.
*/
export function dropClass(date) {
  const cls = openClass();
  const on = date || editDate();
  if (!cls || !getDoc() || !writableDate(on)) return;
  if (offTermDay(cls.id, on)) return;
  if (stateOf(cls.id, on) === DID_NOT_MEET) return;
  /* A day the calendar has already closed does not need a record saying so, and writing one would
     be the copy this whole design refuses — the class would then read as dropped from its own
     ledger, and deleting the holiday would leave that behind. */
  if (coveredDay(cls.id, on)) return;

  /* Real marks only. A half-taken class is mostly `U`s, and "the 26 marks already on it were
     cleared" about a class where the teacher had marked one absence is a sentence that would make
     her think she had lost a period's work. */
  const cleared = stateSummary(cls.id, on).marked;
  update((d) => {
    const list = listIn(d);
    const written = { classId: cls.id, date: on, exception: DROPPED };
    const index = list.findIndex((r) => r && r.classId === cls.id && r.date === on);
    if (index >= 0) list[index] = written;
    else list.push(written);
  });

  paintColumn(on);
  paintActions();
  paintRenderedTotals();
  announce(cls.name + ' did not meet on ' + spokenDate(on) + '.'
    + (cleared ? ' The ' + cleared + (cleared === 1 ? ' mark' : ' marks')
      + ' already on it were cleared.' : ''));
}

/* And one tap back. The record goes entirely, which leaves the day NOT TAKEN YET rather than taken:
   taking back "the class did not meet" is not the same as claiming everyone was there, and the
   teacher who taps this is usually about to mark the class properly. */
export function undropClass(date) {
  const cls = openClass();
  const on = date || editDate();
  if (!cls || !getDoc() || !writableDate(on)) return;
  if (offTermDay(cls.id, on)) return;
  if (stateOf(cls.id, on) !== DID_NOT_MEET) return;

  update((d) => removeRecord(d, cls.id, on));
  paintColumn(on);
  paintActions();
  paintRenderedTotals();
  announce(cls.name + ' met after all on ' + spokenDate(on)
    + '. Its attendance is not taken yet.');
}

/* ────────────────────────────── hall passes ──────────────────────────────

   Four writers, three of them one tap, all about NOW rather than about the column being edited — a
   student stands up and leaves at the moment the button is pressed, whichever week the grid happens
   to be showing. src/passes.js holds the rules and the shapes; these hold the clock, the refusals
   that belong to this screen, and the sentence a screen reader hears.

   NONE OF THEM TOUCHES ATTENDANCE. No record is created, no mark moves, and none of them calls
   paintColumn() or paintActions() — there is nothing on those surfaces for a pass to change. A
   student at the bathroom was present, and the only place the two features meet is the `D` branch
   in setMark() above. */

/*
  ONE TAP OUT: who, which type, and the time they left.

  The refusals repeat guards src/passes.js also makes, and that is deliberate rather than sloppy:
  this one is about the screen (is a class open at all?) and that one is about the document (is this
  student already out? is the room at its limit?). Neither is a substitute for the other, and the
  one that must not be skipped is the second — the buttons are drawn disabled at the cap, but a
  disabled button is a fact about a render and the cap is a fact about the room.
*/
export function issuePass(studentId, type) {
  const cls = openClass();
  if (!cls || !studentId || !getDoc()) return;
  const student = findStudent(studentId);
  if (!student) return;
  const kind = passes.passType(type);
  if (!kind) return;

  const doc = getDoc();
  if (passes.openPassFor(doc, cls.id, studentId)) return;
  if (passes.atCap(doc, cls.id)) {
    /* Said rather than silently ignored. The three buttons on every other row are disabled and the
       line above the grid says why, so this path is only reachable from a stale tap — but a control
       that does nothing and says nothing is the "dead control" the work order refuses by name. */
    announce('No more passes right now — ' + passes.MAX_OPEN_PASSES + ' students from '
      + cls.name + ' are already out.');
    return;
  }

  const at = stampNow();
  update((d) => { passes.openPass(d, cls.id, studentId, kind.type, at); });
  paintPasses();
  announce(fullName(student) + ' is out on a ' + kind.said + ' pass, since ' + clockTime(at) + '.');
}

/*
  AND ONE TAP BACK. The minutes are computed from the two stamps in src/passes.js and the entry is
  appended to the pass log; the student's three buttons come back with the same paint.
*/
export function returnPass(studentId) {
  const cls = openClass();
  if (!cls || !studentId || !getDoc()) return;
  const student = findStudent(studentId);
  if (!student) return;
  if (!passes.openPassFor(getDoc(), cls.id, studentId)) return;

  const at = stampNow();
  let done = null;
  update((d) => { done = passes.closePass(d, cls.id, studentId, at, passes.BY_RETURN); });
  paintPasses();
  if (!done) return;
  announce(fullName(student) + ' is back after ' + done.minutes
    + (done.minutes === 1 ? ' minute.' : ' minutes.'));
}

/*
  OR THE PASS WAS A MISTAKE (WO-2.11). One tap on the card's `✕ Cancel`, and the student who never
  left the room stops being out — with nothing written down about a trip that did not happen.

  IT IS NOT A RETURN WITH NO MINUTES, and this function existing separately is the visible half of
  that. src/passes.js's cancelPass() says why at the definition; what matters here is that this
  reads no clock. There is no moment to stamp, because nothing happened at one.

  IT IS OFFERED ONLY ON THE CARD, never on the row: the Passes column has 160px and three targets
  in it already, and a fourth beside Return is how a thumb reaching for Return destroys a real
  trip's minutes. The announcement says what did NOT happen, in as many words, because the one thing
  a teacher needs to know after tapping this is that the pass log is untouched.
*/
export function cancelPass(studentId) {
  const cls = openClass();
  if (!cls || !studentId || !getDoc()) return;
  const student = findStudent(studentId);
  if (!student) return;
  if (!passes.openPassFor(getDoc(), cls.id, studentId)) return;

  let gone = null;
  update((d) => { gone = passes.cancelPass(d, cls.id, studentId); });
  paintPasses();
  if (!gone) return;
  const kind = passes.passType(gone.type);
  announce(fullName(student) + '’s ' + (kind ? kind.said : 'hall') + ' pass is cancelled. '
    + 'Nothing was written to the pass log.');
}

/*
  A NOTE ON A PASS, typed on the card while the student is out and written as it is typed — the same
  posture setNote() takes over a mark, and the same two rules with it.

  IT DOES NOT REPAINT, which is the load-bearing line rather than an optimisation: paintPassBanner()
  rebuilds the cards, so repainting here would replace the <input> being typed into and take the
  caret and the software keyboard with it. The cards ARE rebuilt by the three writers above, and a
  note half-typed when another student is sent out survives that — every keystroke is already in the
  document, so the field comes back filled. What is lost in that case is the caret position, which
  is the cost of one shared surface rather than a card per row.

  A note needs a pass to sit on, and the refusal is here as well as in the model for the reason
  every other refusal on this screen is doubled: this one is about the screen, that one is about the
  document.
*/
export function setPassNote(studentId, text) {
  const cls = openClass();
  if (!cls || !studentId || !getDoc()) return;
  if (!passes.openPassFor(getDoc(), cls.id, studentId)) return;
  update((d) => { passes.notePass(d, cls.id, studentId, text); });
}

/* ────────────────────────────── moving around the grid ──────────────────────────────

   None of these writes anything. They move the window, unlock a column, or narrow the list, and
   every one of them ends in a render rather than in a patch, because what they change is which
   rows and which columns exist. */

/* The deliberate unlock. One past column at a time — a screen where every past day is live is a
   screen where a mis-tap two columns left is a mark on a day the teacher was not thinking about.

   BACKFILLING A PAST DAY NEEDS A DAY COLUMN, and in portrait there is only today's (WO-2.12). The
   unlock itself is unchanged and so is paging — "Earlier" walks back one weekday per tap there
   instead of six — but the way this is actually done at the door is to TURN THE IPAD, which brings
   the week back and the ✏ with it. That is the accepted cost of portrait showing today, booked with
   the trade on 2026-08-07 rather than discovered later. Written here because this is where someone
   looking for last Tuesday's ✏ will arrive. */
export function editPastDay(date) {
  const cls = openClass();
  if (!writableDate(date) || date === todayISO()) return;
  /* WO-2.50. Unlocking a day whose every write the third gate would refuse is the same control that
     looks live, takes a tap and does nothing that dayHead() refuses to draw — so the ✏ is not there
     to press, and this is that fact stated where a stale hook or the keyboard path arrives. A past
     day OUTSIDE the terms that carries a record is a different day and opens normally: offTermDay()
     answers false there, which is decision 2 and is the only way back to the marks on it. */
  if (cls && offTermDay(cls.id, date)) return;
  editingPast = date;
  /* The open detail panel describes ONE student on ONE date, and that date is the one accepting
     edits. Moving the edit date with a panel open would leave a time and a note on screen that
     belong to a day the teacher just left, so it closes — here and everywhere else the edit date
     moves. */
  detailFor = '';
  renderAttendance();
  announce('Editing ' + spokenDate(date) + '. This is not today.');
}

export function lockPastDay() {
  if (!editingPast) return;
  const was = editingPast;
  editingPast = null;
  detailFor = '';
  renderAttendance();
  announce('Finished editing ' + spokenDate(was) + '. Back on today.');
}

/*
  Paging a whole window at a time, over a position counted in weekdays. "Earlier" goes back six
  weekdays on a full landscape grid, which puts a date two weeks behind two taps away — the
  acceptance line this control exists for. "Later" runs forward to the last day off on the calendar
  and is disabled there, saying why; on a year with nothing scheduled that is the window ending
  today, which is where it always stopped. What it no longer says is that the future is blocked,
  because since 2026-08-08 only WRITING to it is — see dayColumns().

  THE STEP IS THE WINDOW; THE POSITION IS IN DAYS. Adding `count` here rather than 1 is what keeps
  "two taps is two weeks" true while leaving `pageDaysBack` in a unit that does not change when the
  iPad turns — the whole of the 2026-08-07 anchor re-cut, argued at dayColumns(). A narrow laptop
  window pages five at a time and lands five weekdays further back, which is the same sentence about
  a smaller screen rather than a different rule.

  PORTRAIT DOES NOT PAGE AT ALL (the owner's call, 2026-08-07): in portrait this screen shows today
  and turning the iPad is how you read the week or reach a past day. Refused here as well as disabled
  in the pager, because a disabled button is a claim about the UI and this is a claim about the
  state — and `Today` stays live either way, since it is the escape from an unlocked past column
  rather than a page control.

  Paging away from today locks any unlocked past column, because the strip that says WHICH day you
  are editing is only honest while that day is on screen.
*/
export function pageDays(direction) {
  const count = dayColumnCount();
  if (direction !== 'today' && isPortrait()) return;
  const before = pageDaysBack;
  if (direction === 'today') pageDaysBack = 0;
  else if (direction === 'earlier') pageDaysBack += count;
  /* Clamped at the furthest thing on the calendar rather than at today — futureLimit() carries the
     reasoning, and returns 0 on a year with no days off in it, which is the old clamp exactly. */
  else if (direction === 'later') pageDaysBack = Math.max(futureLimit(), pageDaysBack - count);
  else return;
  if (pageDaysBack === before && direction !== 'today') return;
  editingPast = null;
  detailFor = '';
  renderAttendance();
  const shown = visibleColumns();
  /* A one-column window said "Back to this week, ending today" and "Showing Tuesday to Tuesday",
     which is the kind of sentence that makes a screen reader user go looking for the broken part.
     One column is one date, and it is said as one. */
  const one = shown.length === 1;
  if (pageDaysBack === 0) announce(one ? 'Back to today.' : 'Back to this week, ending today.');
  else if (one) announce('Showing ' + spokenDate(shown[0]) + '.');
  else {
    announce('Showing ' + spokenDate(shown[shown.length - 1]) + ' to ' + spokenDate(shown[0]) + '.');
  }
}

/* Search, filter and sort all rebuild the ROWS and nothing else. The search field is markup in
   index.html rather than something this file creates, precisely so that a keystroke cannot destroy
   the element the keystroke came from — the whole grid re-rendering under a teacher's finger is
   how a search box loses focus mid-word. */
export function setSearch(value) {
  searchText = String(value || '').trim().toLowerCase();
  renderRows();
}

export function setFilter(code) {
  filterCode = code === 'all' || MARKS.some((m) => m.code === code) ? code : 'all';
  paintToolbar();
  renderRows();
}

export function setSort(which) {
  sortBy = which === 'first' ? 'first' : 'last';
  paintToolbar();
  renderRows();
}

/*
  THE ROW'S OWN DETAIL, opened and closed by the ⋯ at the end of the name (WO-2.10). One at a time,
  the way one past column is unlocked at a time and for the same reason: a screen with twenty-six
  panels open on it is a screen you scroll instead of read.

  What it holds is what the cell has no room for — the mark in words, the time a `T` or a `D`
  settled, the note field, and the un-confirm — and it opens IN THE ROW rather than over it, which
  is the work order's own wording. A dialog here would take the teacher off the grid mid-period,
  and it would be the second screen this whole design is built to avoid.
*/
export function toggleDetail(studentId) {
  detailFor = studentId && detailFor !== studentId ? studentId : '';
  paintDetail();
  if (!detailFor) return;
  const student = findStudent(detailFor);
  if (student) announce(fullName(student) + ' — details for ' + spokenDate(editDate()) + '.');
}

/* ───────────────────────────── THE KEYBOARD PATH (WO-2.5) ─────────────────────────────

  THE STANDARD IS NOT "REACHABLE FROM THE KEYBOARD". Since 2026-08-08 the laptop is the device of
  record (WO-G1), so this is how a live class gets marked while it walks in — twenty-five to thirty
  students, by someone greeting a room rather than watching a screen. So the shape below is ONE
  KEYSTROKE PER STUDENT with the hand never leaving the letters and the selection advancing on its
  own: `↓` once to pick up the first name, then `P P A P T P …` down the list. A path that were
  merely present and correct — tab to a cell, hit Enter four times to reach `E`, tab again — passes
  the acceptance line and still costs the seconds this whole screen exists to save.

  IT IS ROLL CALL!'s MODEL, LIFTED WITH ITS COMPONENT (dashboard.html:3580-3677, and
  design/portable-components.md:152 for the highlight). Over there a ROW is selected rather than a
  cell, arrows move it, a letter writes and advances, Escape deselects, and the selected row wears
  `.row-selected` — indigo wash and a 3px left rail, which src/attendance.css copies by value.
  Three things differ here and each is named where it happens:

    - A LETTER SETS, IT DOES NOT CYCLE. `A` means absent from wherever the cell was reading, the way
      Roll Call!'s setAttendanceCode() does. cycleMark() is the TAP's writer and stays that way; a
      keyboard that cycled would make one absence cost up to five keystrokes and would make the
      count depend on what the cell already said, which is the opposite of not looking at it.
    - THE SELECTION IS A REAL FOCUS. Roll Call! paints a highlight and leaves document.activeElement
      wherever it was. Here the selected row's cell is FOCUSED, which buys two things for free: the
      style guide's `:focus-visible` ring lands on the exact cell the next letter will write into
      (acceptance line 3), and a screen reader reads that cell's own accessible name — the student,
      the date and the mark — so moving the selection needs no announcement of its own.
    - `D` IS A FIFTH LETTER. Roll Call! has four; this app's cycle carries dismissed, and the grid
      is the only place a dismissal can be said (see the header).

  WHERE THE KEYS DO NOTHING IS EXACTLY WHERE A THUMB DOES NOTHING. Every letter writes through
  setMark(), so a locked past column, a dropped day, a covered day, a date after today and a window
  paged off the day being edited all refuse a keystroke precisely as they refuse a tap. There is no
  second set of rules and no second writer — which is the same discipline the header states about
  `P` never being stored.

  WHAT IS NOT HERE: no key takes the whole class, drops it, unlocks a past column, pages the window
  or opens a row's detail. Those are the controls a mis-typed letter would be most expensive on, and
  the deliverable names five letters, four arrows and Escape. The `?` that opens the shortcut list
  is src/shell.js's, because it is about the dialog rather than about the grid.
*/

const SELECTED_ROW_CLASS = 'attendance-row-selected';

function gridBody() { return document.getElementById(BODY_ID); }

/*
  THE ROWS A KEYSTROKE CAN LAND ON, in the order they are drawn.

  Read off the DOM rather than recomputed from visibleStudents(), and that is the load-bearing half:
  search, filter and sort have already decided which students are on screen and in what order, and a
  second opinion here would let `↓` walk onto a row the teacher cannot see. The detail panel's own
  <tr> carries no `data-attendance-row`, so it is never a stop.
*/
function selectableRows() {
  const body = gridBody();
  if (!body) return [];
  return Array.from(body.querySelectorAll('tr[data-attendance-row]'))
    .map((tr) => tr.getAttribute('data-attendance-row'));
}

/*
  THE CELL A KEYSTROKE WRITES INTO: this student's cell on the day that accepts edits.

  cellFor() draws a <button> only where the column is editable and an inert <span> everywhere else,
  so `button[...]` returning null IS the answer to "may the keyboard write here" — the same fact the
  screen is already showing, rather than a second copy of the rule. It also answers "is the day
  being edited even on screen", which a window paged two weeks back makes a real question.
*/
function markCellFor(studentId) {
  const body = gridBody();
  if (!body || !studentId) return null;
  return body.querySelector('button[data-attendance-cell="' + studentId + '"]'
    + '[data-attendance-date="' + editDate() + '"]');
}

/* Which row the browser's focus is sitting in, or ''. Used to pick the selection back up after an
   Escape, so that an arrow resumes where the teacher was rather than at the top of the class. */
function focusedRowId() {
  const active = document.activeElement;
  const row = active && active.closest ? active.closest('tr[data-attendance-row]') : null;
  return row ? row.getAttribute('data-attendance-row') : '';
}

/*
  THE ROW WASH, AND NOTHING ELSE — no focus, no scroll. Called from renderRows(), so a selection
  survives a search keystroke, a filter pill and a sort.

  A selection whose student is no longer on screen is DROPPED, which is the rule detailFor already
  follows for the same reason: a highlight with no row under it belongs to nobody, and the next
  letter would otherwise write into a student the teacher filtered away.
*/
function paintSelection() {
  const body = gridBody();
  if (!body) return;
  if (selectedId && selectableRows().indexOf(selectedId) === -1) selectedId = '';
  body.querySelectorAll('tr[data-attendance-row]').forEach((tr) => {
    tr.classList.toggle(SELECTED_ROW_CLASS,
      tr.getAttribute('data-attendance-row') === selectedId);
  });
}

/*
  PUT THE KEYBOARD ON A STUDENT.

  `focus: false` is the tap's way in — see cycleMark(). Everywhere else the cell takes focus, and
  the two calls that do it are two on purpose:

    .focus({ preventScroll: true }) then row.scrollIntoView({ block, inline: 'nearest' })

  because the grid lives in `.attendance-grid-wrap`, which scrolls SIDEWAYS. A plain .focus() brings
  its element into view on both axes, so walking down a class on a narrow laptop window would drag
  the columns left and right under a teacher who is not looking at them. `block: 'nearest'` moves
  the page by exactly what the row needs and `inline: 'nearest'` leaves the horizontal position
  where she put it.
*/
export function selectStudent(studentId, opts) {
  const body = gridBody();
  if (!body || selectableRows().indexOf(studentId) === -1) return false;
  selectedId = studentId;
  paintSelection();
  if (opts && opts.focus === false) return true;
  const cell = markCellFor(studentId);
  if (cell) cell.focus({ preventScroll: true });
  const row = body.querySelector('tr[data-attendance-row="' + studentId + '"]');
  if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  return true;
}

/* One row down or up, clamped at both ends. With nothing selected it picks up from wherever focus
   already is, and failing that from the end of the list the arrow came from. */
export function moveSelection(step) {
  const rows = selectableRows();
  if (!rows.length) return false;
  let index = rows.indexOf(selectedId);
  if (index === -1) index = rows.indexOf(focusedRowId());
  if (index === -1) return selectStudent(step > 0 ? rows[0] : rows[rows.length - 1]);
  return selectStudent(rows[Math.min(rows.length - 1, Math.max(0, index + step))]);
}

/*
  ONE LETTER: write it on the selected student, then move on.

  THE ADVANCE IS THE WHOLE FEATURE. One keystroke per student and nothing to move the cursor with is
  what makes a class of thirty a run of thirty keys; a teacher who had to press `↓` between each one
  is doing sixty and watching the screen to know where she is.

  IT STOPS AT THE LAST ROW RATHER THAN WRAPPING. A wrap would put her silently back at the top of a
  class she has just finished, and the next letter would overwrite the first student. Roll Call!
  clamps here too (dashboard.html:3666).

  Returns whether anything was written, so that src/shell.js knows whether to swallow the key: a
  letter that could not be used belongs to the browser, not to this screen.
*/
export function markSelected(code) {
  if (!selectedId) return false;
  const rows = selectableRows();
  const index = rows.indexOf(selectedId);
  if (index === -1) { selectedId = ''; paintSelection(); return false; }
  /* Nothing to write into — a locked past column, a dropped or covered day, a day after today, or a
     window paged off the day being edited. The refusal a thumb gets, said the same way: nothing. */
  if (!markCellFor(selectedId)) return false;
  setMark(selectedId, code, editDate());
  /* setMark() has repainted the column and put focus back on the cell it replaced (paintColumn), so
     the last row keeps its ring rather than losing it to <body> at the bottom of a class. */
  selectStudent(index < rows.length - 1 ? rows[index + 1] : selectedId);
  return true;
}

/*
  ESCAPE: STOP, WITHOUT MOVING ANYTHING.

  The selection goes and DOM focus deliberately stays where it is. Escape's job here is "my next
  keystroke must not land on a student" — the whole of it — and the cheapest way to get that wrong
  is to blur, which puts focus on <body> and leaves a teacher who wanted to pause hunting for her
  place with Tab. So the letters go dead because there is no target, the ring stays on the cell she
  was on, and `↓` picks up from exactly there (see moveSelection).

  Said out loud, because the row wash going quiet is the only other signal and a screen-reader user
  gets none of it.
*/
export function clearSelection() {
  if (!selectedId) return false;
  selectedId = '';
  paintSelection();
  announce('Nothing selected. Press the down arrow to start again.');
  return true;
}

/* Read by tools/verify-shell.mjs through the seam, and by nothing in the app: every caller in here
   already has the id it just passed in. */
export function selectedStudent() { return selectedId; }

/* ────────────────────────────── the roster, in the order this screen reads it ──────────────────

   Sorted by surname then first name by default — a decision src/roster.js's header hands to this
   work order by name ("WO-2.1's marking screen is where an order that is not hers gets decided").

   The roster itself renders in the order the teacher pasted, because that is her list and a second
   opinion about it there would be one she can see. Here the question is different: two students
   have to be FOUND among twenty-six in a few seconds, standing up, while the room fills. A pasted
   SIS list is usually already alphabetical, so sorting changes nothing in the common case and
   guarantees the order in the case where she typed names in as they arrived. The First/Last pair
   above it is Roll Call!'s `.sort-btn` pair, and it exists because a teacher who knows a student by
   their first name should not have to translate. */

function studentsIn(doc) { return doc && Array.isArray(doc.students) ? doc.students : []; }

function findStudent(id) {
  return studentsIn(getDoc()).filter((s) => s.id === id)[0] || null;
}

/* A roster id that names nobody is dropped rather than rendered as a blank row — the same harmless
   failure src/roster.js describes, from a restored or hand-edited document. */
function rosterOf(cls) {
  const ids = cls && Array.isArray(cls.roster) ? cls.roster : [];
  return ids.map((id) => findStudent(id)).filter(Boolean);
}

function markingOrder(cls) {
  const first = sortBy === 'first';
  return rosterOf(cls).slice().sort((a, b) => {
    const lead = first
      ? String(a.first || '').localeCompare(String(b.first || ''))
      : String(a.last || '').localeCompare(String(b.last || ''));
    if (lead !== 0) return lead;
    return first
      ? String(a.last || '').localeCompare(String(b.last || ''))
      : String(a.first || '').localeCompare(String(b.first || ''));
  });
}

/*
  The rows actually drawn: the marking order, narrowed by the search box and by the filter pills.

  THE FILTER READS THE COLUMN THAT ACCEPTS EDITS, not the whole window. "Show me who was absent" is
  a question about the day being marked, and a pill that answered it across six days would answer a
  question nobody asked. `Present` means "confirmed present on that date", which since WO-2.10 is a
  narrower thing than it was: a student nobody has reached yet reads `U`, so an untaken day now
  matches NOBODY on that pill rather than everybody. That is the same inversion the rest of this
  work order is — an unmarked student is not a present one — and the copy under the empty list says
  which pill emptied the screen.

  THERE IS NO PILL FOR `U`, deliberately: it is not a sixth code to a teacher, and the count that
  matters about it is on the column head and the state line above, where she can see it without
  filtering anything.
*/
function visibleStudents(cls) {
  const on = editDate();
  const record = recordFor(cls.id, on);
  return markingOrder(cls).filter((s) => {
    if (searchText && rosterName(s).toLowerCase().indexOf(searchText) < 0
      && fullName(s).toLowerCase().indexOf(searchText) < 0) return false;
    if (filterCode === 'all') return true;
    return readingOf(record, s.id) === filterCode;
  });
}

/* ────────────────────────────── rendering ──────────────────────────────

   createElement and textContent throughout, never innerHTML: a student's name is pasted out of a
   school system, and a student called "Bo <b>x</b>" has to be a student called "Bo <b>x</b>"
   (src/roster.js says the same thing over the same string). */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function actionButton(label, hook, value, extraClass) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'class-action-btn' + (extraClass ? ' ' + extraClass : '');
  btn.setAttribute(hook, value === undefined ? '' : value);
  btn.textContent = label;
  return btn;
}

/* The classes a column's header and every cell under it wear. Written once and applied to both,
   which is what makes "distinguishable in the header AND in the cells" one fact rather than two
   that can drift apart. */
function columnClasses(date, state, today, editing, offTerm) {
  return 'attendance-col-' + state
    + (date === today ? ' attendance-col-today' : '')
    /* A day that has not happened. Carried alongside the state rather than instead of it, because a
       future day off is still `covered` and must still look covered — this only has to quiet the
       one state whose colour is an alarm. See the stylesheet, and stateChip()'s "Ahead". */
    + (date > today ? ' attendance-col-future' : '')
    /* And a day outside every term of this class (WO-2.50), carried the same way and for the same
       reason — a July day off is still `covered` and still reads as one. Its own class rather than
       a second use of the future's, with the values copied across in the stylesheet: the two are
       the same neutral to the eye today and must be able to diverge later without a hunt. It rides
       on top of `future` too, on a day that is both, which costs nothing — both quiet the same one
       state to the same white. */
    + (offTerm ? ' attendance-col-off-term' : '')
    + (editing ? ' attendance-col-editing' : '');
}

/*
  ONE CELL. A <button> where the column accepts edits, an inert <span> where it does not — rather
  than a disabled button, because a disabled control on a past column reads as something broken and
  a plain span reads as a record.

  The glyph is never blank. See the header comment: an empty cell on a taken day and an empty cell
  on a day nobody took would be the same picture, and the teacher would read a forgotten Tuesday as
  a Tuesday when everyone showed up.
*/
function cellFor(student, date, state, cell, editable, cover, future, offTerm) {
  const code = codeOf(cell) || PRESENT;
  const at = timeOf(cell);
  const note = noteOf(cell);
  let glyph = code;
  let tone = code;
  let said;
  if (state === DID_NOT_MEET) { glyph = '–'; tone = 'none'; said = 'the class did not meet'; }
  /* The same dash as a dropped day, because the same thing happened to the student, on its own
     quiet-but-SOLID ring rather than the dropped cell's dashed one — and with the reason in the
     accessible name, which is where a teacher who cannot see the column head finds out that this
     is Thanksgiving and not a day somebody dropped. */
  else if (state === COVERED) { glyph = '–'; tone = 'covered'; said = coverSaid(cover); }
  /* A day that has not happened says so, and says it quietly. Same reasoning as stateChip()'s
     "Ahead" and at the same word count: `?` in the untaken amber means "you have a hole here", and
     next Tuesday is not a hole. The glyph goes to the dash every non-meeting cell uses and the tone
     goes to the future's own neutral, so a week read ahead of time is a week with nothing shouting
     on it. The accessible name follows, because a screen-reader user gets NONE of the colour. */
  /* A day this class does not exist on yet, or any more (WO-2.50). The same middot and the same
     quiet as a day that has not happened, on a tone of its own — `?` in the untaken amber means
     "you have a hole to fill", and a week in July is not a hole any more than next Tuesday is. It
     is checked BEFORE the future branch for the reason stateChip() gives at the same pair of lines:
     "ahead" says the day is coming round to be marked and this one is not. THE ACCESSIBLE NAME
     CARRIES THE WHOLE REASON, side and term, because a screen-reader user gets none of the wash and
     none of the column head's tooltip. */
  else if (state === NOT_TAKEN && offTerm) { glyph = '·'; tone = 'off-term'; said = offTermSaid(offTerm); }
  else if (state === NOT_TAKEN && future) { glyph = '·'; tone = 'future'; said = 'not yet — this day is ahead'; }
  else if (state === NOT_TAKEN) { glyph = '?'; tone = 'untaken'; said = 'not taken yet'; }
  else if (code === UNCONFIRMED) {
    /* The same glyph and the same amber as a day nobody has taken, because it means the same thing
       about this student: nobody has looked at them yet. What tells the two apart is the column
       around it — see the header. */
    glyph = '?'; tone = 'untaken'; said = 'not confirmed yet';
  } else {
    /* A code this app does not know can only arrive from a hand-edited or foreign document. It is
       shown as itself rather than dropped — the same harmless-failure posture src/roster.js takes
       over a roster id that names nobody — because silently rendering it as present would hide a
       mark the teacher can see in her backup file. */
    said = phraseFor(code);
  }
  /* The time and the note go on the accessible name and the tooltip of every cell that carries
     them, taken or locked: a past column is read-only, and "when was that tardy" is a question
     about a past column more often than about today's. */
  const carried = (at ? ' at ' + clockTime(at) : '') + (note ? ' — ' + note : '');

  const node = document.createElement(editable ? 'button' : 'span');
  node.className = 'attendance-cell attendance-cell-' + tone + (editable ? '' : ' locked');
  node.textContent = glyph;
  /* A one-glyph control with no accessible name is a control a screen reader reads as nothing at
     all — style guide §7. The name carries whose row and which day, because a hundred and fifty
     cells otherwise read as a hundred and fifty buttons called "P". */
  const label = fullName(student) + ' — ' + spokenDate(date) + ': ' + said + carried;
  if (editable) {
    node.type = 'button';
    node.setAttribute('data-attendance-cell', student.id);
    node.setAttribute('data-attendance-date', date);
    const next = wordFor(nextCode(state === NOT_TAKEN ? UNCONFIRMED : code));
    node.setAttribute('aria-label', label + '. Tap for ' + next.toLowerCase() + '.');
    node.title = said.charAt(0).toUpperCase() + said.slice(1) + carried + ' · tap for ' + next;
  } else {
    node.setAttribute('aria-label', label);
    node.title = said.charAt(0).toUpperCase() + said.slice(1) + carried;
  }
  return node;
}

/*
  THE TIME, WHERE THE MARK IS. A tardy cell says `8:14a` under its glyph, so that "how late was he"
  is answered by looking at the grid rather than by running a report — which is the deliverable, in
  its own words.

  IT IS POSITIONED OUT OF FLOW (src/attendance.css) and that is the load-bearing decision rather
  than a styling detail. A table row is as tall as its tallest cell, so a caption in normal flow
  would add ~12px to EVERY row of a twenty-six-name grid the moment one student is marked tardy —
  on the one screen in this app measured in seconds and thumb-travel. Out of flow it sits in the
  padding the cell already has, and a class with three tardies in it is exactly as tall as a class
  with none.
*/
function cellTime(at) {
  const node = el('span', 'attendance-cell-time', compactTime(at));
  /* The cell's own aria-label already carries the time in full, so this is decoration to a screen
     reader and would otherwise be read out twice, as "8:14a" — which is not a time anybody says. */
  node.setAttribute('aria-hidden', 'true');
  return node;
}

/* ── THE PASSES COLUMN (WO-2.8) ──
   Roll Call!'s `col-passes`, lifted: the head is one word, and the cell holds three buttons while a
   student is in the room and one while they are out. It is the same column whatever date the grid
   is showing, because a pass is issued now. */

function passHead() {
  const th = el('th', 'attendance-passes', 'Passes');
  th.setAttribute('scope', 'col');
  /* Said in full to a screen reader, because "Passes" above three emoji is a column heading that
     assumes you can see the emoji. */
  th.title = 'Hall passes — bathroom, nurse, or a quick one';
  return th;
}

function passButton(student, kind, disabled) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'attendance-pass-btn ' + kind.type;
  btn.setAttribute('data-pass-issue', student.id);
  btn.setAttribute('data-pass-type', kind.type);
  btn.disabled = !!disabled;
  /* The icon and the word are two elements because the word is what gives way on a touch device:
     three 44px targets and three labels do not both fit a 160px column, and the label is on the
     accessible name and the tooltip either way (src/attendance.css's coarse block). */
  const icon = el('span', 'attendance-pass-icon', kind.icon);
  icon.setAttribute('aria-hidden', 'true');
  btn.append(icon, el('span', 'attendance-pass-word', kind.word));
  const said = kind.said.charAt(0).toUpperCase() + kind.said.slice(1) + ' pass';
  btn.setAttribute('aria-label', said + ' for ' + fullName(student));
  /* WHY IT IS OFF, ON THE CONTROL ITSELF. The line above the grid says it too — a reason a teacher
     reads without hunting for it is the acceptance line — and this is the same fact where the
     finger already is. */
  btn.title = disabled
    ? passes.MAX_OPEN_PASSES + ' students are already out. Tap Return on one of them first.'
    : said;
  return btn;
}

/*
  WHAT ONE STUDENT'S PASS CELL HOLDS. Out of the room: a Return button and THE TIME THEY LEFT, which
  is on the screen rather than only in the document because that time surviving a force-quit is the
  whole safety property this feature is built around — a teacher relaunching the app has to see who
  is out and since when. In the room: the three types, disabled together at the cap.

  The elapsed count is on the CARD and deliberately not here (WO-2.9): the column is 160px, a
  figure that changes every second beside a Return button is movement under a thumb aiming at it,
  and the banner above the grid is where a teacher looks to see who is still gone.
*/
function passControls(student, classId, doc, full) {
  const wrap = el('div', 'attendance-pass-cell');
  const open = passes.openPassFor(doc, classId, student.id);

  if (open) {
    const kind = passes.passType(open.type);
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'attendance-pass-btn out';
    back.setAttribute('data-pass-return', student.id);
    const icon = el('span', 'attendance-pass-icon', kind ? kind.icon : '🚪');
    icon.setAttribute('aria-hidden', 'true');
    back.append(icon, el('span', 'attendance-pass-back', 'Return'));
    const said = (kind ? kind.said : 'hall') + ' pass, out since ' + clockTime(open.out);
    back.setAttribute('aria-label', fullName(student) + ' is back from their ' + said);
    back.title = 'Out on a ' + said;
    wrap.append(back);
    /* The clock face the teacher saw when they left, in the width the column has for it. The
       accessible name above already says it in full, so this is decoration to a screen reader. */
    const since = el('span', 'attendance-pass-since', compactTime(open.out));
    since.setAttribute('aria-hidden', 'true');
    wrap.append(since);
    return wrap;
  }

  passes.PASS_TYPES.forEach((kind) => wrap.append(passButton(student, kind, full)));
  return wrap;
}

/* ── THE PASS BANNER (WO-2.11) ──
   Roll Call!'s `renderActivePassBanner()` (dashboard.html:3403): one card per open pass, above the
   grid. What it carries and what it deliberately does not is argued in the header. */

/*
  ONE CARD. The student, the type, the time they left, and the three things a teacher can do about
  it — send them back, take the pass back, or write down where they actually went.

  THE TWO BUTTONS MUST NOT BE CONFUSABLE AT SPEED, which is a claim about the card rather than about
  either one of them: they differ in glyph (`✓` against `✕`), in word, and in shape — Return is a
  filled button and Cancel is an outline, the same pair Roll Call! draws. The stylesheet owns the
  last of those three, and none of the three is worth anything alone.

  RETURN CARRIES THE SAME HOOK THE ROW'S OWN RETURN CARRIES, so both surfaces reach one writer.
  Cancel has no counterpart on the row and is not going to get one — see the header.
*/
function passCard(student, pass) {
  const card = el('div', 'attendance-pass-card');
  const kind = passes.passType(pass.type);
  const said = kind ? kind.said : 'hall';
  const label = said.charAt(0).toUpperCase() + said.slice(1);
  const at = clockTime(pass.out);

  const main = el('div', 'attendance-pass-card-main');

  /* The avatar Roll Call!'s card carries, off the same avatarClass() the roster and the home screen
     ask, so one student is one colour across every surface. Decoration to a screen reader — the
     name is right beside it and the buttons below say it in full. */
  const face = el('div', 'avatar ' + avatarClass(student.id), initials(rosterName(student)));
  face.setAttribute('aria-hidden', 'true');
  main.append(face);

  /* NAME ON ITS OWN LINE, TYPE AND TIME OUT ON A SECOND — Roll Call!'s `.pass-card-info` block.
     A name that has to share a line with a chip and a clock is a name that gets truncated first. */
  const info = el('div', 'attendance-pass-card-info');
  info.append(el('div', 'attendance-pass-card-name', rosterName(student)));

  const meta = el('div', 'attendance-pass-card-meta');
  /* THE WORD ALONE, NO GLYPH. The row's three pass buttons carry their icons because they lost
     their words to a 160px column; this chip kept its word, so the emoji beside it was saying the
     same thing twice and charging the card's one row about 18px for it. Dropped on the owner's
     report of 2026-08-07 — three cards wrapped their buttons onto two rows in landscape and three
     in portrait, and this is half of what bought the line back. */
  const chip = el('span', 'attendance-pass-card-type ' + (kind ? kind.type : 'quick'));
  chip.append(el('span', 'attendance-pass-card-word', label));
  meta.append(chip);
  /* The clock face in full here, not the grid's abbreviated one: the column is 160px and the card
     is a line across the panel, so the reason `.attendance-pass-since` says "9:12a" does not apply
     to a surface with room for "out 9:12 AM".

     THIS IS THE TIME THEY LEFT, NOT HOW LONG THEY HAVE BEEN GONE. The elapsed counter is the slot
     after this block — `.attendance-pass-card-elapsed`, whose geometry the stylesheet has held open
     since WO-2.11 and which WO-2.9 has now filled. */
  meta.append(el('span', 'attendance-pass-card-out', at ? 'out ' + at : 'out'));
  info.append(meta);
  main.append(info);

  /*
    AND HOW LONG THAT IS BY NOW (WO-2.9). The figure Roll Call! puts in exactly this place
    (dashboard.html:3437), at its own measurements, and the one piece of this card that changes
    while nobody touches it.

    IT IS ADDRESSED BY PASS ID, not by student, because that is what paintPassElapsed() below
    patches in place every second: the cards are REBUILT by every other writer on this screen, and
    rebuilding them once a second would take the note field's caret and the software keyboard with
    it (setPassNote's rule, one function up). One text node changes; the card does not.

    Its value is computed here as well as there, so the figure is right in the frame the card is
    drawn in rather than up to a second later — every one of those computations is the same
    subtraction from the stored stamp, and none of them is a count.

    ARIA-HIDDEN, like `.attendance-pass-since` on the row and the mark cell's time caption: "12:04"
    read out loud is not a thing anybody says, and the Return button beside it already carries the
    time out in full in its accessible name. What a screen reader gets about a trip that has gone on
    too long is the announcement paintPassElapsed() makes when it crosses a threshold, which is a
    sentence rather than a pair of numbers.
  */
  const elapsed = el('span', 'attendance-pass-card-elapsed',
    elapsedText(passes.elapsedSeconds(pass.out, Date.now())));
  elapsed.setAttribute('data-pass-elapsed', pass.id);
  elapsed.setAttribute('aria-hidden', 'true');
  main.append(elapsed);

  const back = el('button', 'attendance-pass-card-btn back', '✓ Return');
  back.type = 'button';
  back.setAttribute('data-pass-return', student.id);
  /* The same sentence the row's Return says, because it is the same act — a screen reader landing
     on either one hears the student, the type and the time out rather than the word "Return". */
  back.setAttribute('aria-label', fullName(student) + ' is back from their ' + said
    + ' pass, out since ' + at);
  back.title = 'Back in the room — this writes the trip and its minutes';

  const drop = el('button', 'attendance-pass-card-btn cancel', '✕ Cancel');
  drop.type = 'button';
  drop.setAttribute('data-pass-cancel', student.id);
  /* What it does AND what it does not, on the accessible name and again on the tooltip: this is the
     control whose whole value is the absence it leaves, and an absence is the one thing a label
     cannot show by being tapped. */
  drop.setAttribute('aria-label', 'Cancel ' + fullName(student) + '’s ' + said
    + ' pass. Nothing is recorded.');
  drop.title = 'They never left — take the pass back and record nothing';
  main.append(back, drop);
  card.append(main);

  const note = document.createElement('input');
  note.type = 'text';
  note.className = 'attendance-pass-card-note';
  note.setAttribute('data-pass-note', student.id);
  note.value = pass.note || '';
  note.placeholder = 'Add a note — went on to the counsellor, third time today…';
  note.setAttribute('aria-label', 'Note on ' + fullName(student) + '’s ' + said + ' pass');
  card.append(note);
  return card;
}

/*
  THE BANNER, REBUILT FROM THE OPEN DOCUMENT. Hidden entirely when this class has nobody out —
  including when the class next door does, which is what openPassesFor() means and is the choice the
  work order makes between the two accessors.

  IT IS ABOVE THE GRID AND NOT BESIDE IT. The registry's width is spent to the last pixel already
  (see dayColumnCount), and a panel beside the rows would buy this card at the price of a day
  column; a band across the top costs the grid nothing but vertical space, which this screen has.

  THE CARDS ARE REBUILT RATHER THAN PATCHED, which is what makes the note field's "does not repaint"
  rule matter one function up. A student whose record has gone — a roster edited under an open pass —
  contributes no card rather than a blank one, so the banner is hidden when nothing could be drawn
  rather than when nothing is open.
*/
function paintPassBanner() {
  const box = document.getElementById(PASS_BANNER_ID);
  /* AND THE CLOCK GOES DOWN WITH THE BANNER ON THIS PATH TOO (WO-2.27). It is one word rather than
     a rule of its own: the stop at the foot of this function is the only one there was, so a build
     whose banner had gone from the document left a 1-second interval behind it with nothing on
     screen to put a figure on — and the promise written at that stop said otherwise. Unreachable in
     today's markup, because `#attendancePassBanner` is static in index.html and src/views.js hides
     views rather than removing them; a guard that is only true while nobody moves the markup is the
     kind that gets found the hard way. */
  if (!box) { stopPassClock(); return; }
  const cls = openClass();
  const doc = getDoc();
  const open = cls && doc ? passes.openPassesFor(doc, cls.id) : [];

  box.textContent = '';
  open.forEach((pass) => {
    const student = findStudent(pass.studentId);
    if (student) box.append(passCard(student, pass));
  });
  const drawn = box.children.length;
  box.classList.toggle('hidden', !drawn);
  /* Named for a screen reader as a group, in this class's own words: a run of cards each naming a
     student is a list of names without a sentence saying what the list is. */
  if (drawn) {
    box.setAttribute('aria-label', drawn === 1
      ? 'One student is out of ' + cls.name + ' on a hall pass'
      : drawn + ' students are out of ' + cls.name + ' on hall passes');
  } else {
    box.removeAttribute('aria-label');
  }
  /* THE CLOCK RUNS ONLY WHILE THERE IS A CARD TO PUT A FIGURE ON (WO-2.9), and it is started and
     stopped here rather than at the four writers because this is the function that knows whether
     any card was drawn. A run with an empty room costs nothing at all, not one timer doing nothing
     once a second — and since WO-2.27 that sentence is true of EVERY path out of this function
     rather than of this one, because the early return above stops it as well. What it does NOT
     claim is that the interval is down whenever the registry is off the glass: it is not, it is
     carrying WO-2.9's overdue alerts, and startPassClock() below is where that is written out. */
  if (drawn) { paintPassElapsed(); startPassClock(); } else stopPassClock();
}

/* ── THE ELAPSED CLOCK, AND THE TWO OVERDUE ALERTS (WO-2.9) ──

   The half of the pass banner that changes while nobody is touching the screen, and the one place
   in this app that is allowed to notice a clock moving on its own.

   TWO RULES, AND THE FIRST IS THE WORK ORDER. Nothing accumulates: every figure below is
   src/passes.js's elapsedSeconds() over the stamp in the document and a `now` read at the moment of
   painting, so a device that was asleep for twenty minutes paints twenty minutes rather than the
   two it managed to tick. iOS stops timers when Safari backgrounds an installed PWA and says
   nothing about it, which is why a counter that added a second per tick would be right on a desk
   and wrong in a classroom.

   And the second: THIS PATCHES, IT DOES NOT REPAINT. paintPassBanner() above rebuilds every card,
   and a rebuild once a second would replace the note field mid-sentence — the same rule
   setPassNote() is written around, applied to the thing that runs on its own. What changes here is
   one text node per card and two class names. */

/* The interval, and the module reference that is its own off switch. Nothing else reads it. */
let passClock = 0;

/* One second, which is Roll Call!'s own tick (dashboard.html:3539) and is what a seconds field on
   screen obliges: a figure showing `:07` that updates every five seconds is a broken clock rather
   than a coarse one. It is three text writes at most — the cap is three students out of a room. */
const PASS_CLOCK_MS = 1000;

/*
  IT KEEPS TICKING AFTER THE TEACHER LEAVES THE REGISTRY, AND THAT IS THE FEATURE (WO-2.27).

  Written down here because it reads like an oversight and was booked as one. Nothing calls
  paintPassBanner() on the way out of this screen — src/views.js swaps views by toggling `.hidden`,
  the banner is static markup in index.html, and showClassScreen() paints the screen it arrives at
  and not the one it left — so a pass left open while the teacher moves to Scores, to a student's
  detail or back to the class grid leaves this interval running.

  THE ALERT IS NOT DRIVEN BY THOSE CARDS. paintPassElapsed() reads every open pass for the open class
  from the document and computes its elapsed seconds and alert level from the stored stamp whether
  or not the banner has a matching `[data-pass-elapsed]` node. When a node exists, the same tick also
  patches its figure and card tint; when one does not, only those DOM writes are skipped. Leaving the
  registry and switching class while away from it therefore both leave the alert computation alive,
  scoped to the class the teacher has opened rather than to whichever class the last banner paint
  happened to draw.

  So the cost is one interval, the open-class computation and at most three text writes a second
  while a pass is open, and the thing it buys is the alert. WO-2.28 supplied the alerts with the
  driver of their own that WO-2.27 said they needed for that computation, and WO-2.29 gave what that
  driver produces somewhere to go: paintPassElapsed() plays a tone at each threshold, so a teacher
  entering scores with a student twenty minutes gone is now told by the one channel that does not
  need a screen. This paragraph used to end by saying she was told nothing — that was true for two
  days and is the reason this interval was worth keeping alive through both work orders.
*/
function startPassClock() {
  if (passClock) return;
  passClock = setInterval(paintPassElapsed, PASS_CLOCK_MS);
}

function stopPassClock() {
  if (!passClock) return;
  clearInterval(passClock);
  passClock = 0;
}

/*
  EVERY FIGURE ON THE BANNER, RECOMPUTED FROM THE DOCUMENT.

  Called on the tick, at the end of every banner paint, and when the tab comes back to the front —
  that last one because the tick is exactly what iOS stops, so the first thing a returning app does
  is ask the stamps rather than wait up to a second to be told.

  THE ALERTS FIRE FROM HERE, and the three clauses of the acceptance line are three different lines
  of this function:

    · ONCE EACH — the level that has already fired is `alerted` on the pass, in the document, and
      markAlerted() refuses anything that is not an increase. This function proposes; the model
      decides, and it decides against a record rather than against a variable.
    · NOT REPEATEDLY — the comparison is `level > alertedLevel(pass)`, so the second and every later
      tick over the same threshold produces nothing. This runs 60 times a minute; anything weaker
      than a stored answer would announce 60 times a minute.
    · AND NOT AGAIN AFTER THE STUDENT RETURNS — there is nothing to reset, which is the point of
      putting the state on the pass: the pass is gone from `openPasses` the moment Return is tapped,
      and the entry closePass() appends to `passes` never carried the field. A student sent out
      again is a new pass with no `alerted` on it.

  A TRIP THAT CROSSED BOTH THRESHOLDS WHILE THE APP WAS ASLEEP ANNOUNCES ONLY THE SECOND. It is one
  update() to level 2, so level 1 never fires — which is what "escalating" means: the teacher is
  told the worse thing, once, rather than told the smaller thing first about a student who is
  already twenty minutes gone.
*/
function paintPassElapsed() {
  const box = document.getElementById(PASS_BANNER_ID);
  const cls = openClass();
  const doc = getDoc();
  if (!box || !cls || !doc) return;

  const now = Date.now();
  /* Collected first and written afterwards, in ONE update(): two students crossing a threshold on
     the same tick is two facts about one document, and the store's debounce is happier with one
     write than with two — the same reason setMark() does the mark and the pass it closes inside a
     single update(). */
  const fired = [];
  /*
    SCOPED TO THE CLASS ON SCREEN — openPassesFor(), the same choice the banner makes and for the
    same reason, made again here rather than inherited. WO-2.11 leaves the door open ("the
    cross-class case, if it ever wants one, belongs to WO-2.9's overdue alerts"), and this work
    order does not walk through it: an alert about a student from period 2, announced into period 3,
    names a child from a room the teacher is not in and about a pass she cannot see, act on or
    return from — there is no card for that student on this screen and no Return button to offer
    with the sentence. The pass is not lost while she is next door: its own row in period 2's grid
    keeps its Return and its time out, which is the surface the owner confirmed reads as a reminder.
    A cross-class alert is a real feature and it needs a surface of its own; it is a work order,
    not three lines here.
  */
  passes.openPassesFor(doc, cls.id).forEach((pass) => {
    const node = box.querySelector('[data-pass-elapsed="' + pass.id + '"]');
    const seconds = passes.elapsedSeconds(pass.out, now);
    const level = passes.alertLevelFor(seconds);
    if (node) {
      node.textContent = elapsedText(seconds);
      /* The card carries the escalation rather than the figure alone, and that is deliberate: a
         colour on 40px of digits is a signal you have to already be looking at, and the whole point
         of an overdue alert is that nobody is. The stylesheet owns what the two states look like. */
      const card = node.closest('.attendance-pass-card');
      if (card) {
        card.classList.toggle('over-one', level === 1);
        card.classList.toggle('over-two', level >= 2);
      }
    }
    if (level > passes.alertedLevel(pass)) {
      fired.push({ studentId: pass.studentId, type: pass.type, level: level, seconds: seconds });
    }
  });
  if (!fired.length) return;

  update((d) => {
    fired.forEach((f) => { passes.markAlerted(d, cls.id, f.studentId, f.level); });
  });
  /* THE TONE IS THE ALERT (WO-2.29), and it goes first because it is the channel that reaches a
     teacher who is not looking at this screen — which, off the registry, is every teacher. What it
     is handed is a level and nothing else: src/alert-sound.js owns the two patterns, the iOS
     unlock and the `soundsOn` preference that silences it, and is never told who is out.

     ONE TONE AT THE WORSE LEVEL when two students cross on the same tick, which is the same choice
     the single sentence below makes and for a sharper reason: two three-second sequences started
     together are one smear nobody can count. The module's own comment carries the rest. */
  alertSound.playOverdueAlert(Math.max.apply(null, fired.map((f) => f.level)));

  /* ONE SENTENCE FOR ALL OF THEM, because src/live-region.js holds one message: two announce()
     calls in the same tick would leave a screen reader with the second student and no first.

     IT NAMES THE STUDENT, like every other announcement this screen makes about a pass — the
     alternative ("a student is overdue") is an alert a teacher has to go and look for, on the one
     surface where knowing WHO is the whole of the information. Roll Call! does the same, for the
     accessibility reason its own comment gives: this sentence is the ACCESSIBLE EQUIVALENT of the
     tone above, so that the alarm is not sound-only for a deaf or hard-of-hearing teacher
     (WCAG 1.4.1). It is the mirror of the alert and not the alert, which is why it stays exactly as
     it is whether or not the sound is switched on — and why `soundsOn` reaches the tone alone and
     never this line or the colour on the card.

     AND IT SAYS HOW LONG IT ACTUALLY IS, not which threshold was crossed. Roll Call! announces
     `config.alertOneMin` minutes; a backgrounded PWA that comes back at nineteen minutes would say
     "ten" under that rule, which is the elapsed-time trap arriving in the sentence instead of in
     the figure. */
  announce(fired.map((f) => {
    const student = findStudent(f.studentId);
    const kind = passes.passType(f.type);
    const mins = Math.floor(f.seconds / 60);
    return (student ? fullName(student) : 'A student') + ' has been out on a '
      + (kind ? kind.said : 'hall') + ' pass for ' + mins + (mins === 1 ? ' minute.' : ' minutes.');
  }).join(' '));
}

/*
  THE TAB CAME BACK. Registered at module scope beside the rotation listener above and for the same
  reason: this is not a delegated DOM event on a control, it is this module's own reading of a clock
  becoming stale, and the code that owns the figure is the code that should notice.

  IT IS THE ONE PATH THE 👤 ACCEPTANCE LINE IS ABOUT. An installed PWA that iOS suspended for ten
  minutes comes back with a timer that has not run; this fires on the way back in and every figure
  on the banner is recomputed from the stamps before the first tick would have.

  AND SINCE WO-2.28 THIS IS NOT A NO-OP WHEN NO CARD IS UP. It used to be — paintPassElapsed()
  found no `[data-pass-elapsed]` node and returned per pass — and that sentence stood here until the
  guard moved. It is now the opposite, and the difference is the whole of what WO-2.28 bought: a
  device that came back on the Scores screen, with a trip that crossed a threshold while it slept,
  ALERTS ON THE WAY IN rather than waiting for the registry. The alert is computed from the open
  passes of openClass(), and the cards are only where the figures get written.

  The early return that does still exist is paintPassElapsed()'s first line (the banner element, the
  open class, the document) — a screen with no class open at all, not a screen with no cards on it.
*/
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') paintPassElapsed();
});

/*
  THE PASSES COLUMN, REPAINTED IN PLACE, after anything that changes who is out — a pass issued,
  returned or cancelled, and a `D` that closed or reopened one. The rows are not rebuilt, for the
  reason paintColumn() gives: a table twenty-six names long must not jump back to the top under the
  thumb of someone half way down it.

  THE BANNER GOES WITH IT, in this function rather than at each of the call sites, which is what
  makes acceptance line 8 structural: cancelling from the card updates the row, and returning from
  the row updates the card, because neither surface has its own repaint to forget.
*/
function paintPasses() {
  paintPassNote();
  paintPassBanner();
  const body = document.getElementById(BODY_ID);
  const cls = openClass();
  const doc = getDoc();
  if (!body || !cls || !doc) return;
  const full = passes.atCap(doc, cls.id);
  body.querySelectorAll('td[data-pass-cell]').forEach((td) => {
    const student = findStudent(td.getAttribute('data-pass-cell'));
    if (!student) return;
    td.textContent = '';
    td.append(passControls(student, cls.id, doc, full));
  });
}

/*
  THE REASON, ON SCREEN. The work order asks for the fourth pass to be refused "with a reason on
  screen, not by a dead button", and this is the half that is not on the button: twenty-five rows of
  greyed-out controls with no sentence anywhere is exactly the dead control it names.

  It is only up at the cap, and it stayed that way when the banner landed above it (WO-2.11). The
  two lines say different things: this one is the reason twenty-five rows of buttons have gone grey,
  and the banner is who is out. Nothing here names anybody, which is why this sentence and not the
  banner is what a class at its limit says when nobody is looking at the cards.
*/
function paintPassNote() {
  const el0 = document.getElementById(PASS_NOTE_ID);
  if (!el0) return;
  const cls = openClass();
  const doc = getDoc();
  const full = !!(cls && doc && passes.atCap(doc, cls.id));
  el0.textContent = full
    ? passes.MAX_OPEN_PASSES + ' students from ' + cls.name + ' are out on a pass — that is as many '
      + 'as this app will let go at once. Tap Return on one of them before sending another.'
    : '';
  el0.classList.toggle('hidden', !full);
}

/*
  ONE COLUMN HEAD: the weekday, the date, the state IN WORDS, and the control that belongs to that
  day. The state chip is the half of "an empty cell is ambiguous" that lives above the column; the
  cells carry the other half.

  The control is one button and its identity is the column's state and position:
    today            🚫 drop the class, or ↩ take that back — one tap, no confirm
    a past column    ✏ unlock it, or Done to close it again
    a covered column 📅 the screen the reason was authored on — every column, past or today
  There is no case after today, because there is no column after today.

  THE COVERED COLUMN'S BUTTON IS A DOOR RATHER THAN AN UNDO (WO-2.3), and that is the deliberate
  half. The undo for a holiday is deleting the holiday, which affects every class on every date in
  its range — that is far too much to hang on a 12px glyph in one class's column head, and a
  "remove this event" here would be a teacher clearing Thanksgiving for the whole school while
  looking at Period 3. So the glyph OPENS the screen that owns it, where the range and the classes
  it covers are on screen beside the Remove. One tap to get there, one deliberate tap there.
*/
function dayHead(date, state, today, editing, unconfirmed, cover, offTerm) {
  const th = el('th', 'attendance-day ' + columnClasses(date, state, today, editing, offTerm));
  th.setAttribute('scope', 'col');
  th.setAttribute('data-attendance-col', date);

  th.append(el('span', 'attendance-day-dow', dayAbbr(date)));
  th.append(el('span', 'attendance-day-date', numericDate(date)));
  const chip = el('span', 'attendance-day-state',
    stateChip(state, unconfirmed, cover, date > today, offTerm));
  /* The count is the alarm, so it is coloured like one rather than like the taken column it sits
     on — the first of the three places a half-taken class has to be loud. */
  if (state === TAKEN && unconfirmed) chip.classList.add('waiting');
  /* The REASON, on the head that carries the word. It has no room to be drawn, so it is on the
     tooltip and — through the chip's own title — on the one surface that is neither of those: a
     teacher hovering a laptop, and a screen reader landing on the column. The state line above the
     grid says it in full for the day being edited, which is the surface an iPad actually gets. */
  if (state === COVERED) chip.title = coverText(cover);
  /* THE REASON, on the head that carries the word (WO-2.50) — the same two syllables on the chip
     and the whole sentence behind them, exactly as a covered day does it one line up. This head
     gets no button, so the tooltip is the only surface here that can hold the side and the term
     names; the cells under it carry the same sentence in their accessible names, and the state line
     above the grid says it in full for the day being edited. */
  if (offTerm && state === NOT_TAKEN) chip.title = offTermText(offTerm);
  th.append(chip);

  /*
    A COLUMN AHEAD OF TODAY GETS NO BUTTON AT ALL (2026-08-08), and the check is here — before one
    is built — rather than as a branch below, so that the future case cannot leave an orphan element
    behind. There is nothing to offer: the ✏ unlock further down opens a day for editing and
    writableDate() would refuse every write it led to, so drawing it would be a control that looks
    live, takes a tap, and does nothing — the exact thing this file refuses to do with a cell.

    Nothing takes its place, and that is deliberate rather than unfinished. The column already says
    what it is twice over, in the chip and in the wash the whole column wears; a third element
    saying "not yet" would be fine print under two things that are not fine print.

    A COVERED DAY IS EXEMPT, WHICHEVER SIDE OF TODAY IT FALLS. That is the one future column with
    somewhere to go from — the 📅 below — and it is the whole reason the columns were opened up.
  */
  /*
    AND SO DOES A COLUMN OUTSIDE EVERY TERM OF THIS CLASS (WO-2.50), for the argument above word for
    word. The 🚫 CREATES a record and the ✏ opens a day whose every write offTermDay() would refuse,
    so either one drawn here would be a control that looks live, takes a tap, and does nothing. The
    column already says what it is twice over, in the chip and in the wash it wears end to end, and
    the state line above the grid holds the one control this day has — the door to the term dates,
    which is the only thing that would un-grey it.

    A COVERED DAY IS EXEMPT HERE TOO, on the same clause and for the same reason it is exempt from
    the future check: the 📅 is somewhere to go from, the calendar outranks the term dates, and a
    holiday in July has to keep the door to the screen that owns it.
  */
  if (state !== COVERED && (date > today || offTerm)) return th;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'attendance-day-btn';
  if (state === COVERED) {
    btn.setAttribute('data-dayoff-panel', '');
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.textContent = '📅';
    btn.title = coverText(cover) + ' — open Days off & drops';
    btn.setAttribute('aria-label', coverSaid(cover) + ' on ' + spokenDate(date)
      + '. Open days off and planned drops.');
  } else if (date === today) {
    if (state === DID_NOT_MEET) {
      btn.setAttribute('data-attendance-undrop', date);
      btn.textContent = '↩';
      btn.title = 'The class met after all';
      btn.setAttribute('aria-label', 'The class met after all on ' + spokenDate(date));
    } else {
      btn.setAttribute('data-attendance-drop', date);
      btn.textContent = '🚫';
      btn.title = 'This class did not meet today';
      btn.setAttribute('aria-label', 'Record that this class did not meet on ' + spokenDate(date));
    }
  } else if (editing) {
    /* The same pencil, pressed. Roll Call! swaps it for a button labelled "Done" (dashboard.html
       :3998); this one does not, because "Done" on a screen with no submit step is a word that
       reads as a commit — and this app's own harness greps for exactly that word for exactly that
       reason. A toggle with `aria-pressed` says the same thing without borrowing the vocabulary of
       a step that must never exist here. */
    btn.setAttribute('data-attendance-lock', '');
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    btn.textContent = '✏️';
    btn.title = 'Stop editing this past day';
    btn.setAttribute('aria-label', 'Stop editing ' + spokenDate(date) + ' and go back to today');
  } else {
    btn.setAttribute('data-attendance-edit', date);
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = '✏️';
    btn.title = 'Edit this past day';
    btn.setAttribute('aria-label', 'Edit attendance for ' + spokenDate(date));
  }
  th.append(btn);
  return th;
}

/*
  ONE COLUMN, REPAINTED IN PLACE, after a write that changed what that day means. The header and
  every cell under it are rebuilt; nothing else on the table is touched, so a table twenty-six rows
  long does not jump back to the top under the thumb of someone half way down it.

  The filter is deliberately NOT re-applied here. A row that vanishes the instant it is marked is a
  row the next tap lands under, and the teacher marking two absences in a filtered list would be
  aiming at a moving target. Filters apply when the rows are drawn.
*/
function paintColumn(date) {
  const cls = openClass();
  const head = document.getElementById(HEAD_ID);
  const body = document.getElementById(BODY_ID);
  if (!cls || !head || !body) return;

  const today = todayISO();
  const editing = date === editDate() && date !== today;
  const state = stateOf(cls.id, date);
  const cover = state === COVERED ? coverOf(cls.id, date) : null;
  const marks = marksOf(recordFor(cls.id, date));
  /* WO-2.50. Read once for the head and every cell under it, the same way `cover` is: the answer is
     a fact about the column, and asking it per cell would walk this class's terms twenty-six times
     to arrive at one of them. */
  const offTerm = offTermOf(cls.id, date);
  const editable = date === editDate() && state !== DID_NOT_MEET && state !== COVERED
    && writableDate(date) && !offTerm;
  const unconfirmed = countsFor(cls.id, date)[UNCONFIRMED];

  const th = head.querySelector('th[data-attendance-col="' + date + '"]');
  if (th) th.replaceWith(dayHead(date, state, today, editing, unconfirmed, cover, offTerm));

  /* WHO HAD THE RING BEFORE THIS COLUMN WAS REBUILT (WO-2.5). Every cell below is REPLACED, so a
     keyboard user who pressed Enter on one — or typed a letter at it, which is the whole of the
     keyboard path — is left with document.activeElement on <body> and no way back but Tab. That is
     acceptance line 3 in one sentence: focus is never lost after a mark. Captured before the loop
     because the node it names is detached inside it. */
  const hadFocus = document.activeElement;

  body.querySelectorAll('td[data-attendance-col="' + date + '"]').forEach((td) => {
    const student = findStudent(td.getAttribute('data-attendance-student'));
    if (!student) return;
    const wasFocused = td.contains(hadFocus);
    td.className = 'attendance-cell-td ' + columnClasses(date, state, today, editing, offTerm);
    td.textContent = '';
    const node = cellFor(student, date, state, marks[student.id], editable, cover, date > today,
      offTerm);
    td.append(node);
    const at = state === TAKEN ? timeOf(marks[student.id]) : '';
    if (at) td.append(cellTime(at));
    /* The REPLACEMENT, not the row — the ring goes back on the exact cell the next keystroke writes
       into. A column that has just gone read-only draws a <span> instead, which cannot hold focus
       and must not be asked to: there is nothing to type at any more. */
    if (wasFocused && node.tagName === 'BUTTON') node.focus({ preventScroll: true });
  });
}

/*
  THE STRIP THAT SAYS YOU ARE NOT ON TODAY, and the acceptance line it answers is "visible in a
  glance, on an iPad, in a classroom". So it is a full-width band above the grid with a coloured
  edge and a way back on it, not a tint on a column — a tint is what the column already has, and a
  tint alone is exactly the fine print this work order keeps refusing.

  Two ways to be off today, and both get the same strip: a past column is unlocked, or the window
  has been paged back so today is not on screen at all.
*/
function paintBanner(columns) {
  const banner = document.getElementById(BANNER_ID);
  if (!banner) return;
  const today = todayISO();
  const on = editDate();
  const todayShown = columns.indexOf(today) >= 0;

  banner.textContent = '';
  if (on === today && todayShown) { banner.classList.add('hidden'); return; }

  banner.classList.remove('hidden');
  /* One column is one date rather than "Tuesday to Tuesday" — the same sentence the pager and
     pageDays() make, and the same reason: portrait draws a one-day window (WO-2.12). */
  const range = columns.length === 1 ? spokenDate(columns[0])
    : spokenDate(columns[columns.length - 1]) + ' to ' + spokenDate(columns[0]);
  const text = on !== today
    ? 'You are editing ' + spokenDate(on) + ' — not today.'
    : 'Showing ' + range + '. Today is not on screen.';
  banner.append(el('span', 'attendance-banner-text', text));
  const back = actionButton('Back to today', 'data-attendance-page', 'today');
  back.classList.add('attendance-banner-btn');
  banner.append(back);
}

/*
  The state line, the class-level controls and the note — everything above the grid that describes
  ONE DAY. That day is the one accepting edits, which is today unless a past column is unlocked.

  Repainted on its own after a write, because the grid below it must not be rebuilt.
*/
function paintActions() {
  const cls = openClass();
  const on = editDate();
  const dateEl = document.getElementById(DATE_ID);
  const stateEl = document.getElementById(STATE_ID);
  const actions = document.getElementById(ACTIONS_ID);
  const note = document.getElementById(NOTE_ID);
  if (dateEl) dateEl.textContent = spokenDate(on);
  if (!stateEl || !actions || !note) return;

  const summary = cls ? stateSummary(cls.id, on)
    : { state: NOT_TAKEN, text: 'No class is open', marked: 0, unconfirmed: 0 };
  stateEl.textContent = summary.text;
  /* The caution palette while anybody is unconfirmed, on top of the state's own — a green "Taken"
     over twelve students nobody has looked at is the silent failure WO-2.10's Traps line is about.
     A MODIFIER RATHER THAN A STATE, and it stayed one when WO-2.3 added a real fourth: `unconfirmed`
     rides on top of `taken` because the class genuinely IS taken, where `covered` replaces it
     because the class genuinely did not meet. That is the test for anything that wants to be a
     fifth — if stateOf() would still answer the same word, it is a modifier. */
  stateEl.className = 'attendance-state ' + summary.state
    + (summary.unconfirmed ? ' unconfirmed' : '');

  actions.textContent = '';
  note.textContent = '';
  note.classList.add('hidden');
  if (!cls) return;

  if (summary.state === DID_NOT_MEET) {
    actions.append(actionButton('The class met after all', 'data-attendance-undrop', on, 'restore'));
    actions.append(daysOffDoor());
    note.textContent = 'Nothing is recorded for this day, and nothing counts toward anything. '
      + 'Undoing this leaves it not taken yet, ready to mark.';
    note.classList.remove('hidden');
    return;
  }

  /*
    A DAY THE CALENDAR HAS ALREADY CLOSED (WO-2.3). One control, and it is a door rather than an
    undo — for the reason dayHead() gives at the 📅: removing the event affects every class on
    every date of its range, and that is not a thing to do from inside one class's screen without
    seeing what it covers.

    The sentence says three things the teacher cannot infer from an empty grid: WHY (her own title),
    that nothing is recorded here and nothing counts, and WHERE the undo lives. The last is the one
    that matters — an app that greys a screen out without saying what would un-grey it is an app
    she has to guess at with a class walking in.
  */
  if (summary.state === COVERED) {
    /* The same door every other state now draws, rather than a second one worded differently — see
       daysOffDoor(). Here it is the ONLY control, because there is nothing on this day to act on;
       everywhere else it sits at the far end past the controls that write. */
    actions.append(daysOffDoor());
    const named = Array.isArray(summary.cover && summary.cover.classIds)
      && summary.cover.classIds.length > 0;
    note.textContent = coverText(summary.cover) + ' — this is on the calendar'
      + (named ? ', for this class and any others it names' : ', for every class') + '. '
      + 'Nothing is recorded here and nothing counts toward anything. Remove it from Days off & '
      + 'drops and every day it covers goes back to not taken yet.';
    note.classList.remove('hidden');
    return;
  }

  /*
    A DAY OUTSIDE EVERY TERM THIS CLASS HAS (WO-2.50). The third answer in the shape the two above
    it already use — the state line, a note saying WHY and WHERE the fix lives, and one door.

    THE STATE STAYS not-taken AND THE NOTE DOES ALL THE WORK, which is what "a modifier, not a fifth
    state" costs here: `summary.state` is NOT_TAKEN, so this cannot be a fourth `if` on the state
    and is a test on the modifier instead, placed after COVERED because the calendar outranks the
    term dates everywhere else on this screen too.

    THE DOOR IS THE TERM EDITOR AND NOT THE CALENDAR. daysOffDoor()'s pattern, aimed at the screen
    that owns the dates this day is outside of: a holiday is not what is wrong here, and offering
    Days off would send the one teacher most likely to see this screen — the one who has not typed
    her term dates yet — to the wrong screen with a class walking in. Nothing else is offered,
    because every control this row can draw writes on this day and every one of those writes the
    third gate refuses.

    AND IT SAYS THE DAY IS NOT LOST. A teacher reading "nothing can be recorded here" on a day she
    has already tapped would go looking for what happened to those marks — so the sentence says what
    is true instead: a day with attendance already on it is not this day, because a record wins and
    this branch is not reached at all.
  */
  if (summary.offTerm) {
    actions.append(termDatesDoor());
    note.textContent = offTermText(summary.offTerm) + ' — this day is outside every term '
      + cls.name + ' has, so nothing can be recorded on it and nothing counts toward anything. '
      + 'Add a term or widen one in Terms, and the day opens for marking. A day that already has '
      + 'attendance on it stays editable whatever the dates say.';
    note.classList.remove('hidden');
    return;
  }

  /* The rule in words, on the screen, whenever it is doing something. "They count as absent" is the
     part a teacher cannot infer from a question mark, and it is the whole reason the count above is
     not decoration. */
  if (summary.unconfirmed) {
    const one = summary.unconfirmed === 1;
    note.textContent = summary.unconfirmed + (one ? ' student has' : ' students have')
      + ' no mark yet, and ' + (one ? 'counts' : 'count')
      + ' as absent until you confirm them. Tap a question mark once for present.';
    note.classList.remove('hidden');
  }

  /*
    THE ACTION ROW, AND THE FIVE STATES IT ANSWERS. Three controls at most, because this row is read
    standing up with a class walking in, and the fourth button is the one that gets mis-tapped. The
    📅 past the middot is outside that count and daysOffDoor() says why: it writes nothing, acts on
    no day, and is held at the far end of the row away from the three that do.

      not taken            [Everyone’s here] · [Didn’t meet]                          · [📅]
      taken, nothing on it [✓ Everyone’s here — pressed] · [Didn’t meet]              · [📅]
      taken, only U's      [Everyone’s here] · [Not taken yet] · [Didn’t meet]        · [📅]
      taken, marks + U's   [Everyone’s here] · [Un-confirm everyone] · [Didn’t meet]  · [📅]
      taken, marks, no U   [Un-confirm everyone] · [Didn’t meet]                      · [📅]

    The way back differs by row on purpose. With nothing real on the record the honest undo is to
    REMOVE it — that leaves the day not taken yet, which is what it was — and with marks on it the
    record must survive, so the reset puts every student back to `?` instead and says how many marks
    that costs. Neither one can destroy a mark by being tapped twice: the first is not offered once
    there is a mark to lose, and the second states the cost in its own title.
  */
  if (summary.state === TAKEN && summary.unconfirmed === 0 && summary.marked === 0) {
    /* The same control that took the class, now pressed, now meaning "actually, I have not taken
       this". */
    const undo = actionButton('✓ Everyone’s here', 'data-attendance-untake', on);
    /* Its own class rather than a variant of `.class-action-btn`: shell.css owns that name and its
       variants, and src/shell.css's header sets the rule that two stylesheets never style one
       class. So the pressed look is `.attendance-toggle-on`, declared in this screen's own sheet
       and winning on load order. */
    undo.classList.add('attendance-toggle-on');
    undo.setAttribute('aria-pressed', 'true');
    undo.title = 'Taken, with everyone present. Tap to take that back.';
    actions.append(undo);
  } else if (summary.state === NOT_TAKEN || summary.unconfirmed) {
    const take = actionButton('Everyone’s here', 'data-attendance-take', on, 'primary');
    take.setAttribute('aria-pressed', 'false');
    take.title = summary.unconfirmed
      ? 'Mark the ' + summary.unconfirmed + ' student'
        + (summary.unconfirmed === 1 ? '' : 's') + ' you have not reached as present.'
      : 'Record this class as met, with nobody absent.';
    actions.append(take);
  }

  if (summary.state === TAKEN && summary.marked === 0 && summary.unconfirmed) {
    const notYet = actionButton('Not taken yet', 'data-attendance-untake', on);
    notYet.title = 'Take this class back to not taken yet. Nothing is marked on it, so nothing is '
      + 'lost.';
    actions.append(notYet);
  } else if (summary.state === TAKEN && seedIds(cls).length) {
    const reset = actionButton('Un-confirm everyone', 'data-attendance-unconfirm-all', on);
    reset.title = summary.marked
      ? 'Put every student back to a question mark. The ' + summary.marked
        + (summary.marked === 1 ? ' mark' : ' marks') + ' on this day will be cleared.'
      : 'Put every student back to a question mark, ready to take again.';
    actions.append(reset);
  }

  const drop = actionButton('Didn’t meet', 'data-attendance-drop', on, 'archive');
  drop.title = summary.marked
    ? 'Record that this class did not meet. The ' + summary.marked
      + (summary.marked === 1 ? ' mark' : ' marks') + ' on it will be cleared.'
    : 'Record that this class did not meet.';
  actions.append(drop);
  actions.append(daysOffDoor());
}

/*
  THE DOOR TO THE CALENDAR, ON EVERY STATE THIS ROW DRAWS (2026-08-08, the owner's call after the
  first iPad sitting). It was reachable from here already, but only on a covered day — which is the
  day you have no reason to go there, because the thing is already done. The tap that wants this
  control is "we are off next Thursday", made standing in the classroom with the class screen open,
  and until now that meant going back to All classes to find the button.

  IT IS NOT A FOURTH ACTION, AND THE ROW'S THREE-CONTROL RULE SURVIVES INTACT. The rule above is
  about the controls that WRITE ON THIS DAY: they are read at speed, they are aimed at with a class
  walking in, and the fourth one of those is the one that gets mis-tapped. This writes nothing, acts
  on no day, and opens a dialog — so it is separated from them, pushed to the far end of the row by
  `.attendance-actions-door` (src/attendance.css) with the taken/dropped controls left where the
  thumb has learned to find them. A mis-tap costs a dialog and an ✕, which is the cheapest wrong
  outcome anything on this screen has.

  Same hook, same words, same route as the home screen's button and the 📅 in a covered column's
  head — three doors, one screen. The two that already existed each say why they are where they are;
  this one is the one a teacher reaches for most, and it took a classroom to find that out.
*/
/*
  THE DOOR TO THE TERM DATES (WO-2.50), and it is daysOffDoor() below with a different destination
  rather than a new kind of control: same shape, same class, same place at the far end of the row,
  and it writes nothing and acts on no day. `data-term-manage` with an EMPTY value, which is that
  hook's documented contract for "the class that is open" (src/shell.js § the census) — the class
  row's own button is the one that carries an id, and this row is only ever drawn inside the open
  class.

  It is drawn on ONE state rather than on every one the way the days-off door is, and that is the
  difference between the two: Days off is a place a teacher wants to go from any day ("we are off
  next Thursday"), and the term editor is a place she wants to go from exactly this one. A second
  permanent door in a row whose whole design is a three-control limit would be the fourth button
  that gets mis-tapped.
*/
function termDatesDoor() {
  const door = actionButton('📅 Terms', 'data-term-manage', '');
  door.classList.add('attendance-actions-door');
  door.setAttribute('aria-haspopup', 'dialog');
  door.title = 'Set this class’s term dates — nothing on this day changes.';
  door.setAttribute('aria-label', 'Open the terms for this class and set their dates');
  return door;
}

function daysOffDoor() {
  const door = actionButton('📅 Days off', 'data-dayoff-panel', '');
  door.classList.add('attendance-actions-door');
  door.setAttribute('aria-haspopup', 'dialog');
  door.title = 'Holidays, breaks and planned drops — nothing on this day changes.';
  door.setAttribute('aria-label', 'Open days off and planned drops');
  return door;
}

/* The pills and the sort pair, which are markup in index.html and only have their pressed state
   set from here — the same arrangement as the search field, and for the same reason: a control the
   renderer re-creates is a control that cannot hold focus. */
function paintToolbar() {
  const pills = document.getElementById(PILLS_ID);
  if (pills) pills.querySelectorAll('[data-attendance-filter]').forEach((p) => {
    const on = p.getAttribute('data-attendance-filter') === filterCode;
    p.classList.toggle('active', on);
    p.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  const sort = document.getElementById(SORT_ID);
  if (sort) sort.querySelectorAll('[data-attendance-sort]').forEach((b) => {
    const on = b.getAttribute('data-attendance-sort') === sortBy;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

/* Earlier · Today · Later. "Later" is disabled at the far end of the calendar and says why. Since
   2026-08-07 "Earlier" is disabled the same way in portrait, for the same kind of reason. */
function paintPager(columns) {
  const pager = document.getElementById(PAGER_ID);
  if (!pager) return;
  pager.textContent = '';
  if (!openClass()) return;

  /* THE WORDING COMES OFF THE WINDOW, NOT OFF THE SIX IT USED TO BE (WO-2.12). Portrait draws one
     column, so "the six weekdays before these" was a tooltip describing a screen the teacher was not
     looking at — and it was already wrong on a narrow laptop window, where the budget draws five.
     One number, read from the columns this paint was handed. */
  const many = columns.length > 1;
  /*
    PORTRAIT DOES NOT PAGE, AND THE CONTROL STAYS ON SCREEN TO SAY SO.

    Disabled rather than removed, which is this strip's own established answer — `Later ▶` has sat
    here greyed at today since WO-2.1 rather than disappearing, because a control that vanishes is a
    control the teacher goes hunting for and a control that explains itself teaches the rule once.
    The tooltip carries the route out, which until now existed only in the work order: turning the
    iPad IS how you read the week and how you reach a past day to correct it.
  */
  const pinned = isPortrait();
  const earlier = actionButton('◀ Earlier', 'data-attendance-page', 'earlier');
  earlier.disabled = pinned;
  earlier.title = pinned
    ? 'Portrait shows today. Turn the iPad to read the week or to correct a past day.'
    : many ? 'The ' + columns.length + ' weekdays before these' : 'The weekday before this';
  pager.append(earlier);

  /* And a one-day window is one date rather than "Aug 7 – Aug 7". */
  pager.append(el('span', 'attendance-pager-range',
    columns.length
      ? (many ? numericDate(columns[columns.length - 1]) + ' – ' + numericDate(columns[0])
        : numericDate(columns[0]))
      : ''));

  /* NOT forced off in portrait, unlike the two page controls either side of it. `Today` is also the
     way out of an unlocked past column, and that is a state this button has to be able to answer
     even on a screen that cannot page — so the existing rule is left to decide it, and in portrait
     `pageDaysBack` is pinned at 0 anyway. */
  const today = actionButton('Today', 'data-attendance-page', 'today');
  today.disabled = pageDaysBack === 0 && !editingPast;
  today.title = today.disabled ? 'You are on today'
    : many ? 'Back to the week ending today' : 'Back to today';
  pager.append(today);

  /* The forward stop is the last day off on the calendar, not today — futureLimit() says why, and
     says why an empty calendar puts it back on today. The two disabled sentences are different
     because the two states are: one is "there is nothing further ahead to look at", the other is
     the old "tomorrow is not something to record yet", which is still true and still the reason a
     year with nothing scheduled stops here. */
  const ahead = futureLimit();
  const later = actionButton('Later ▶', 'data-attendance-page', 'later');
  /* `pinned` FIRST, and it is a fix rather than a tidy-up (2026-08-08, reported the same hour the
     forward columns shipped). Portrait pins `pageDaysBack` to 0, and 0 is no longer the forward end
     — with a day off on the calendar the limit is negative, so the old test alone read "there is
     somewhere further to go" and lit this button up on the one screen that refuses to page. It
     looked live, took a tap, and pageDays() threw the tap away.

     Which is the general shape of the trap: THIS SCREEN NOW HAS TWO REASONS A PAGE CONTROL IS OFF,
     and they are independent. `Earlier` above only ever had the portrait one; `Later` has both, and
     an || between them is the whole of it. Anything added here later needs the same audit. */
  later.disabled = pinned || pageDaysBack <= ahead;
  later.title = later.disabled
    ? (pinned
      ? 'Portrait shows today. Turn the iPad to read the week or to correct a past day.'
      : ahead < 0
        ? 'That is as far ahead as the calendar goes — nothing is scheduled past this window'
        : 'Today is the last column there is — tomorrow’s attendance is not something to record yet')
    : many ? 'The ' + columns.length + ' weekdays after these' : 'The weekday after this';
  pager.append(later);
}

function totalsForRender(cls, term, students) {
  const yearRecords = meetingRecords(cls.id);
  const dated = termIsDated(term);
  const selectedRecords = dated ? meetingRecords(cls.id, term.start, term.end) : yearRecords;
  const year = new Map();
  const selected = dated ? new Map() : year;
  students.forEach((student) => {
    year.set(student.id, totalsFrom(yearRecords, student.id));
    if (dated) selected.set(student.id, totalsFrom(selectedRecords, student.id));
  });
  return { term: term, dated: dated, yearRecords: yearRecords, selectedRecords: selectedRecords,
    year: year, selected: selected };
}

function paintClassTotals(totals) {
  const totalsEl = document.getElementById(TOTALS_ID);
  if (!totalsEl) return;
  if (!totals) { totalsEl.textContent = ''; return; }
  const inYear = totals.yearRecords.length;
  const inTerm = totals.dated ? totals.selectedRecords.length : 0;
  totalsEl.textContent = (totals.dated ? totals.term.label + ': ' + inTerm
    + ' recorded meeting' + (inTerm === 1 ? '' : 's') + ' · ' : 'Term dates not set · ')
    + 'Year: ' + inYear + ' recorded meeting' + (inYear === 1 ? '' : 's');
}

function studentTotalsText(totals, studentId) {
  const value = totals.selected.get(studentId);
  return (totals.dated ? totals.term.label + ' · ' : 'Term dates not set · Year · ')
    + countText(value) + ' · ' + percentText(value);
}

/* The rows, and only the rows. Search, filter and sort come through here; a write does not. */
function renderRows(sharedTotals) {
  const cls = openClass();
  const body = document.getElementById(BODY_ID);
  const empty = document.getElementById(EMPTY_ID);
  const wrap = document.getElementById(WRAP_ID);
  if (!body || !empty || !wrap) return;

  body.textContent = '';
  const doc = getDoc();
  /*
    THE GRID KEEPS ITS HEAD WHENEVER A CLASS IS OPEN, even with nothing under it. A class whose
    roster has not been pasted yet still has to be markable as met or as not meeting, and both of
    those controls live in a column head — take the table off the screen and an empty class becomes
    a class that cannot be dropped. Only the no-year and no-class cases hide it, because in those
    there are no columns to show in the first place.
  */
  const say = (text, keepGrid) => {
    empty.textContent = text;
    empty.classList.remove('hidden');
    wrap.classList.toggle('hidden', !keepGrid);
  };
  if (!doc) return say('No school year is open, so there is nothing to mark.', false);
  if (!cls) return say('No class is open. Attendance belongs to a class — open one from the '
    + 'class bar first.', false);

  const all = rosterOf(cls);
  if (!all.length) return say('No students in ' + cls.name + ' yet. Add the roster and they appear '
    + 'here — the class can still be marked as met, or as not meeting, from the column heads '
    + 'above.', true);

  const students = visibleStudents(cls);
  if (!students.length) {
    return say('No student in ' + cls.name + ' matches that. Clear the search box, or tap All, to '
      + 'see the whole class again.', true);
  }
  empty.textContent = '';
  empty.classList.add('hidden');
  wrap.classList.remove('hidden');

  /* The year and selected-term meeting records are facts about this render, not about one row.
     Read each window once, then fold every student's reading out of those shared records. */
  const totals = sharedTotals || totalsForRender(cls, getSelectedTerm(), students);

  const today = todayISO();
  const on = editDate();
  const columns = visibleColumns();
  /* Read once per column rather than once per cell: twenty-six rows times six columns is a hundred
     and fifty-six lookups through the whole attendance array otherwise. */
  const perColumn = columns.map((date) => {
    const state = stateOf(cls.id, date);
    const offTerm = offTermOf(cls.id, date);
    return { date: date, state: state, marks: marksOf(recordFor(cls.id, date)),
      /* The covering event, read once per column for the same reason the marks are: a covered day
         gives every one of twenty-six cells the same reason, and asking the calendar once per cell
         would walk `events` twenty-six times to arrive at one answer. */
      cover: state === COVERED ? coverOf(cls.id, date) : null,
      editing: date === on && date !== today,
      editable: date === on && state !== DID_NOT_MEET && state !== COVERED && writableDate(date)
        && !offTerm,
      /* Hoisted with the rest rather than compared per cell, for the same reason: one string
         comparison a hundred and fifty-six times is one string comparison six times. */
      future: date > today,
      /* And WO-2.50's, hoisted for the stronger version of that reason — this one walks the class's
         terms, so per cell it would be a hundred and fifty-six walks for six answers. */
      offTerm: offTerm };
  });
  /* Whether the day being edited is on screen at all. Paged two weeks back it is not — every column
     is read-only there — and a ⋯ that opened a panel about a date behind the teacher would be the
     only control on this screen that acted on a day she could not see. */
  const editableToday = perColumn.some((col) => col.editable);
  /* Read once for the whole table rather than once per row: the cap is a fact about the class, and
     asking it twenty-six times would walk `openPasses` twenty-six times. */
  const passesFull = passes.atCap(doc, cls.id);

  students.forEach((student) => {
    const row = el('tr');
    row.setAttribute('data-attendance-row', student.id);
    /* Roll Call!'s `.student-cell` — a flex row of avatar then name, `gap: 9px`. The avatar is
       shell.css's `.avatar`, worn as-is and never restyled from this sheet, the same one the roster
       row and the home card wear. It carries no information a name does not: initials and one of
       ten colours, derived from the id and stored nowhere, which is also why presentation mode has
       nothing to suppress here. */
    const name = el('th', 'attendance-name');
    name.setAttribute('scope', 'row');
    const cell = el('div', 'attendance-student-cell');
    const avatar = el('div', 'avatar ' + avatarClass(student.id), initials(rosterName(student)));
    avatar.setAttribute('aria-hidden', 'true');
    const identity = historyDoor(student);
    identity.append(el('span', 'attendance-student-name', rosterName(student)));
    identity.append(el('span', 'attendance-student-totals',
      studentTotalsText(totals, student.id)));
    cell.append(avatar, identity);
    /* The way into the row's own detail — the time, the note and the un-confirm. Drawn on every row
       whenever the edit column accepts edits, rather than only on rows that have something in it:
       a control that appears and disappears as marks are made is a control that moves the target
       under a thumb aiming at the row below it. */
    if (editableToday) cell.append(detailButton(student));
    name.append(cell);
    /* The whole name stays reachable on `title`, the same arrangement a class card makes. */
    name.title = rosterName(student);
    row.append(name);

    /* The Passes column, between the name and the days exactly as Roll Call! has it. It is drawn on
       every row whatever date the window is showing: a pass is issued now, and a teacher who has
       paged back to check last Tuesday still has a student asking to go to the nurse. */
    const passTd = el('td', 'attendance-pass-td');
    passTd.setAttribute('data-pass-cell', student.id);
    passTd.append(passControls(student, cls.id, doc, passesFull));
    row.append(passTd);

    perColumn.forEach((col) => {
      const td = el('td', 'attendance-cell-td '
        + columnClasses(col.date, col.state, today, col.editing, col.offTerm));
      td.setAttribute('data-attendance-col', col.date);
      td.setAttribute('data-attendance-student', student.id);
      td.append(cellFor(student, col.date, col.state, col.marks[student.id], col.editable,
        col.cover, col.future, col.offTerm));
      const at = col.state === TAKEN ? timeOf(col.marks[student.id]) : '';
      if (at) td.append(cellTime(at));
      row.append(td);
    });
    body.append(row);
  });

  /* The keyboard's row goes back where it was, and for the same reason and under the same rule as
     the panel below it: rows are rebuilt by search, filter and sort, and a selection that survived
     only in a variable would be a highlight the teacher watched vanish — or worse, an invisible one
     the next letter still wrote into. Filtered off the screen, it is dropped (paintSelection). */
  paintSelection();

  /* The open panel goes back where it was. Rows are rebuilt by search, filter and sort, and a
     detail that survived only in a variable would be a panel the teacher watched vanish. If the
     student it belongs to has been filtered off the screen it closes, because a panel with no row
     above it belongs to nobody. */
  paintDetail(totals);
}

/*
  THE WAY INTO ONE STUDENT'S HISTORY (WO-2.6): their own name, in the grid, exactly where Roll Call!
  puts it — `.s-name-link` in dashboard.html, an onclick on the name that opens that student's
  report. Lifted with the function: the name and the term line under it become the control, so the
  target is the whole identity block rather than a strip of 13px text, and the row does not get
  taller for it (the coarse block at the foot of src/attendance.css carries the arithmetic).

  IT IS THE NAME AND NOT A SEVENTH BUTTON ON THE ROW. This grid's width is budgeted to the pixel —
  dayColumnCount() spends it in 72px columns — and a control of its own here would be paid for with
  a day column on the one screen where a missing column is a day nobody can see they forgot. The
  name is already there, it already means "this student", and there is nothing else it could do.

  IT WRITES NOTHING, which is what makes it safe to put on the critical-path screen: the cost of a
  mis-tap is a dialog and an ✕, the same trade daysOffDoor() makes above and the cheapest wrong
  outcome anything on this screen has. The cells a thumb is actually aiming at are on the far side
  of the Passes column.

  The `title` keeps the whole name in it, because this element is what `.attendance-name`'s title
  used to be reachable through and a truncated surname still has to be readable on a laptop.
*/
function historyDoor(student) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'attendance-student-identity';
  btn.setAttribute('data-attendance-history', student.id);
  btn.setAttribute('aria-haspopup', 'dialog');
  /* Named for what it opens rather than left to read out the name and the term totals under it,
     which is what a screen reader would otherwise announce as this control's name. */
  btn.setAttribute('aria-label', 'Attendance history for ' + fullName(student));
  btn.title = rosterName(student) + ' — attendance day by day';
  return btn;
}

/* The ⋯ at the end of a name. Its pressed state is the panel below it, which is why it is a toggle
   with `aria-pressed` rather than a link into something. */
function detailButton(student) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'attendance-detail-btn' + (detailFor === student.id ? ' active' : '');
  btn.setAttribute('data-attendance-detail', student.id);
  btn.setAttribute('aria-pressed', detailFor === student.id ? 'true' : 'false');
  btn.setAttribute('aria-label', (detailFor === student.id ? 'Hide' : 'Show') + ' the mark details '
    + 'for ' + fullName(student) + ' on ' + spokenDate(editDate()));
  btn.title = 'Time, note and un-confirm';
  btn.textContent = '⋯';
  return btn;
}

/*
  Attendance writes repaint a column in place so the teacher keeps her scroll position. Totals
  follow the same rule: rebuild the shared per-render pass, then replace only the text it feeds.

  EXPORTED AT WO-2.17, AND IT IS EVERY FIGURE ON THIS SCREEN THAT KNOWS WHICH TERM IS OPEN — the
  class line, one line per row, and the open detail panel. Those three read getSelectedTerm() and
  the rest of the registry does not: the columns are a window of recent dates and they do not move
  when the term does. So this is what a term change owes the teacher here, and renderAttendance()
  would be the same three lines plus a grid of students × days rebuilt for nothing. Called from
  src/shell.js's afterTermChange(), which is where the order of operations lives; this module still
  does not know that a term nav exists.
*/
export function paintRenderedTotals() {
  const cls = openClass();
  if (!cls) { paintClassTotals(null); return; }
  /* A write can change active-filter membership without rebuilding tbody. Fold the whole roster so
     every row that was present before the write, and its still-open detail panel, has a value in
     this render's maps even when that student is no longer visibleStudents(). */
  const students = rosterOf(cls);
  const totals = totalsForRender(cls, getSelectedTerm(), students);
  paintClassTotals(totals);
  students.forEach((student) => {
    const row = document.querySelector('[data-attendance-row="' + student.id + '"]');
    const line = row && row.querySelector('.attendance-student-totals');
    if (line) line.textContent = studentTotalsText(totals, student.id);
  });
  paintDetail(totals);
}

/*
  THE ROW'S DETAIL PANEL, as a <tr> under the row it belongs to. One at a time.

  It is a row rather than an overlay because "reachable without leaving the row" is the deliverable,
  and because a dialog on this screen would be the second screen the whole registry design refuses.
  It spans the whole table, so the note field gets the width a sentence needs even at 390px, where
  the cell it describes is 44px wide.

  WHAT IT OFFERS DEPENDS ON WHAT THE CELL HOLDS, and the note field is the case worth naming: a note
  needs a mark to live on, and a present student HAS no entry — writing one would be the stored-`P`
  trap arriving through a text field. So a confirmed-present student gets the un-confirm and nothing
  else, and the panel says why rather than showing a field that would silently discard what was
  typed into it.
*/
function paintDetail(sharedTotals) {
  const body = document.getElementById(BODY_ID);
  if (!body) return;
  const existing = body.querySelector('tr[data-attendance-detail-row]');
  if (existing) existing.remove();

  const cls = openClass();
  if (!detailFor || !cls) return;
  const row = body.querySelector('tr[data-attendance-row="' + detailFor + '"]');
  const student = findStudent(detailFor);
  if (!row || !student) { detailFor = ''; return; }

  const on = editDate();
  const record = recordFor(cls.id, on);
  const state = stateOf(cls.id, on);
  /* COVERED sits beside DID_NOT_MEET here rather than being a case of its own: the panel edits a
     mark, and a day with no meeting on it has no mark to edit. Which way the day came to be
     meeting-less is a question for the state line above, not for a panel that would have nothing
     in it. */
  /* WO-2.50 sits beside them on the same line and for the same reason: a day outside every term of
     this class has no record, so it has no mark for this panel to edit — and every write the panel
     offers would be refused by the gate anyway. */
  if (state === DID_NOT_MEET || state === COVERED || !writableDate(on)
    || offTermDay(cls.id, on)) { detailFor = ''; return; }
  const entry = marksOf(record)[detailFor];
  const code = readingOf(record, detailFor);
  const at = timeOf(entry);

  const tr = el('tr', 'attendance-detail-row');
  tr.setAttribute('data-attendance-detail-row', detailFor);
  const td = el('td');
  /* The name column plus one per day. Read off the row above rather than counted here, so a
     narrower viewport that drew three columns cannot leave this cell short. */
  td.colSpan = row.children.length;
  const box = el('div', 'attendance-detail');

  box.append(el('span', 'attendance-detail-who',
    fullName(student) + ' — ' + spokenDate(on)));
  const term = getSelectedTerm();
  const totals = sharedTotals || totalsForRender(cls, term, [student]);
  const year = totals.year.get(student.id);
  const selected = totals.dated ? totals.selected.get(student.id) : null;
  box.append(el('span', 'attendance-detail-totals',
    (selected
      ? term.label + ': ' + countText(selected) + ' · ' + percentText(selected) + ' | '
      : 'Term dates not set · ')
      + 'Year: ' + countText(year) + ' · ' + percentText(year)));
  const says = el('span', 'attendance-detail-mark',
    wordFor(code) + (at ? ' at ' + clockTime(at) : ''));
  says.classList.add('attendance-cell-' + (code === UNCONFIRMED ? 'untaken' : code));
  box.append(says);

  if (entry && code !== UNCONFIRMED) {
    const field = document.createElement('input');
    field.type = 'text';
    field.className = 'attendance-detail-note';
    field.setAttribute('data-attendance-note', detailFor);
    field.setAttribute('data-attendance-note-date', on);
    field.value = noteOf(entry);
    field.placeholder = 'Add a note — missed the bus, left for the nurse…';
    field.setAttribute('aria-label', 'Note on ' + fullName(student) + '’s mark for '
      + spokenDate(on));
    box.append(field);
  } else {
    box.append(el('span', 'attendance-detail-hint', code === UNCONFIRMED
      ? 'Nobody has confirmed this student yet. Tap their question mark once for present.'
      : 'Present is stored as no mark at all, so there is nothing here to note. Mark them absent, '
        + 'tardy, at an event or dismissed and the note field appears.'));
  }

  if (record && code !== UNCONFIRMED) {
    const back = actionButton('Un-confirm', 'data-attendance-unconfirm', detailFor);
    back.title = 'Put this student back to a question mark, as if nobody had looked at them yet.';
    box.append(back);
  }

  td.append(box);
  tr.append(td);
  row.after(tr);
}

/* The whole screen, from the open document. Called at open and after anything that changes what
   the screen is MADE of — the window moved, a past column unlocked. NOT after a mark; see
   paintColumn. */
export function renderAttendance() {
  const cls = openClass();
  const today = todayISO();
  /* Recorded, not just used: this is the number the rotation guard compares against to decide
     whether a turn changed anything, and taking it here means every repaint — from any cause —
     leaves that guard describing what is actually on screen. */
  const count = dayColumnCount();
  paintedDayCols = count;
  const columns = visibleColumns();
  const nameEl = document.getElementById(CLASS_NAME_ID);
  const head = document.getElementById(HEAD_ID);
  const caption = document.getElementById(CAPTION_ID);
  const totals = cls ? totalsForRender(cls, getSelectedTerm(), visibleStudents(cls)) : null;
  if (nameEl) nameEl.textContent = cls ? cls.name : 'no class';
  paintClassTotals(totals);

  paintBanner(columns);
  paintActions();
  paintPassNote();
  paintPassBanner();
  paintToolbar();
  paintPager(columns);

  if (caption) {
    /* The table's own description, and it has to survive a one-column window (WO-2.12): "the last 1
       weekdays are the columns after it" is what the sentence below used to read as in portrait, to
       the one user who cannot see the grid and check. */
    const days = columns.length === 1
      ? (pageDaysBack === 0 ? 'and today is the one day column after it.'
        : 'and one day column follows it.')
      : 'and the last ' + columns.length + ' weekdays are the columns after it, most recent first'
        + (pageDaysBack === 0 ? ', starting with today.' : '.');
    caption.textContent = 'Attendance for ' + (cls ? cls.name : 'no class')
      + '. Students are rows. The first column after the name holds hall passes, ' + days;
  }

  if (head) {
    head.textContent = '';
    if (cls) {
      const row = el('tr');
      const corner = el('th', 'attendance-corner', 'Student');
      corner.setAttribute('scope', 'col');
      row.append(corner);
      row.append(passHead());
      const on = editDate();
      columns.forEach((date) => {
        const state = stateOf(cls.id, date);
        row.append(dayHead(date, state, today, date === on && date !== today,
          countsFor(cls.id, date)[UNCONFIRMED],
          state === COVERED ? coverOf(cls.id, date) : null,
          offTermOf(cls.id, date)));
      });
      head.append(row);
    }
  }
  renderRows(totals);
}

/*
  ARRIVING AT THE SCREEN. Called by src/shell.js when a class is opened — from a card or from a
  header tab, which are one control in two places — immediately before the paint.

  IT NO LONGER OPENS ANYTHING (WO-1.13). Until then this screen was a dialog and this function
  ended in openModal(); it is a view in <main> now, so arriving is navigation and src/views.js does
  it. What is left is the half that was always this module's: putting the screen back to its
  starting state. It does not render either — src/shell.js paints it in the same chain that redraws
  the cards behind it, so a class change is one repaint rather than two.

  EVERY ARRIVAL STARTS ON TODAY, unpaged, unfiltered and unsearched. The screen is opened with a
  class walking through the door; finding it still showing last Tuesday filtered to tardies, because
  that is where it was left an hour ago, would cost the seconds this whole design is about. That is
  why this is called on every arrival and NOT on a repaint: a mark made half way down the list must
  not put the screen back to the top of it.
*/
export function resetRegistry() {
  editingPast = null;
  pageDaysBack = 0;
  searchText = '';
  filterCode = 'all';
  sortBy = 'last';
  detailFor = '';
  /* The keyboard starts on nobody in a new class, for the reason the paragraph above gives about
     every other value here: the screen is opened with a class walking through the door, and a
     selection carried in from the class before it would put the first letter typed onto a student
     in period 2's list who happens to sit in the same place. */
  selectedId = '';
  const search = document.getElementById(SEARCH_ID);
  if (search) search.value = '';
}
