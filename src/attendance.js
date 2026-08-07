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

  ── THE THREE STATES, AND WHY THERE IS NO SCHEDULE TO ASK ──

  plans/rotating-schedule.md is settled: there is no schedule object, no cycle, no rotation, no
  meeting pattern. A class met if it has an attendance record with no `exception`. So a class on a
  date is in exactly one of three states, and stateOf() below is the only place in the app that
  decides which:

    no record at all              → NOT TAKEN YET   "did I forget?"
    a record with no `exception`  → TAKEN           the class met; this is a meeting and it counts
    a record with an `exception`  → DID NOT MEET    dropped; it counts toward nothing

  The third is not the second. Every later phase reads through stateOf() rather than testing
  `exception` itself: WO-2.3 adds calendar events to the answer (a `no-school` range covering the
  date), and it adds them HERE, in one function, or the app grows a second opinion about whether a
  class met. THE COLUMN HEADER IS BUILT FOR A FOURTH REASON ARRIVING — the state chip is a word and
  a palette, not a boolean, so an event-covered day is a fourth word in the same slot.

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

  ── PAST DAYS TAKE AN UNLOCK; FUTURE DAYS DO NOT EXIST ──

  Today's column is live: its cells are buttons and its header drops the class in one tap. A past
  column is READ-ONLY until its ✏ is tapped, which is the "deliberate unlock" — one column at a
  time, the column tinted while it is open, a strip above the grid saying in words which day you
  are on, and the class-level controls retargeted to it. That strip is the "you are not on today"
  indication, and it is a strip rather than a subtle tint because it has to survive being read
  across a classroom.

  There is no future column and no way to reach one. The window ENDS at today, "Later" is disabled
  when it already does, and every writer refuses a date after today outright — so the block is a
  fact about the storage layer rather than a fact about which buttons got rendered.

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

  The one piece still left behind is the ELAPSED CLOCK, and only that: a counter that ticks is the
  thing iOS stops ticking when it suspends a PWA, and that trap is WO-2.9's, cut to Ship 2. Its
  place on the card is held open in the stylesheet so it lands without re-flowing anything.

  CANCEL LIVES HERE AND NOWHERE ELSE, and that is the point of the banner rather than a consequence
  of it. The Passes column is 160px and already holds three targets; a fourth one beside Return is
  how a thumb aiming at Return destroys a real trip's minutes, so Roll Call! puts cancel on the card
  and never on the row you issued from. Planbook does the same. The cell keeps its bare Return, both
  Returns call the same writer, and the two surfaces repaint together in paintPasses().

  IT IS SCOPED TO THE CLASS ON SCREEN — openPassesFor(), never openPassesIn(). A pass left open in
  period 2 is not hidden by that: its own row in period 2's grid still carries a Return button and
  the time out, which is the surface the owner confirmed reads as a reminder. What it is not is
  noise on the screen you are standing in front of, naming students from a room you are not in.

  Out of scope and deliberately absent: percentages and counts over history (WO-2.4), the keyboard
  path (WO-2.5), per-student history and print/CSV (WO-2.6), and calendar events (WO-2.3), which
  this screen READS once they exist and never authors — plus the elapsed clock on the card, the two
  overdue alerts and the pass history view, which are WO-2.9's and are deliberately missing here.
  What is on the screen is the time a student LEFT, which acceptance line 1 asks for; the elapsed
  count that ticks beside it is the next work order's, and it is the one that has to survive iOS
  suspending a timer.
*/

import { getDoc, update } from './store.js';
import { announce } from './live-region.js';
/* `initials` and `avatarClass` come from here rather than being re-derived, for the reason WO-1.10
   gives where they were exported: the colour is part of how a teacher recognises a person, so there
   is one answer per student and not one per screen. The roster and the home cards already read
   them; the registry is the third. */
import { getSelectedClass, initials, avatarClass } from './classes.js';
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
   rather than as "Invalid Date". */
function clockTime(iso) {
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

/* The only exception this work order writes. plans/rotating-schedule.md names three more —
   `no school`, `snow day`, `holiday` — and WO-2.3 authors those as calendar EVENTS that this
   screen reads, never as values copied onto a record. */
const DROPPED = 'dropped';

/* The three states, as strings rather than booleans, because there are three of them and the whole
   point of this work order is that the third is not the second. */
export const TAKEN = 'taken';
export const DID_NOT_MEET = 'dropped';
export const NOT_TAKEN = 'not-taken';

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

/* `2026-09-08` → `9/8`, which is what fits in a column head. The year is deliberately absent: six
   weekdays never span a year boundary in a way a teacher could misread, and the spoken form is on
   every cell's accessible name. */
function shortDate(iso) {
  const d = parseISO(iso);
  return d ? (d.getMonth() + 1) + '/' + d.getDate() : String(iso || '');
}

function dayAbbr(iso) {
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

  `offset` is in whole windows: 0 is the window ending at today, 1 is the six weekdays before it.
  Paging by a window rather than by a day is what puts "two weeks back" two taps away.
*/
function dayColumns(count, offset, today) {
  const needed = count * (offset + 1);
  const out = [];
  const d = parseISO(today);
  if (!d) return out;
  let guard = 0;
  while (out.length < needed && guard++ < 4000) {
    const dow = d.getDay();
    /* The first candidate IS today, and it goes in whatever day of the week it is. Everything
       after it is Mon–Fri. */
    if (!out.length || (dow !== 0 && dow !== 6)) out.push(todayISO(d));
    d.setDate(d.getDate() - 1);
  }
  return out.slice(offset * count, offset * count + count);
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
const NAME_COL_COARSE_PX = 232;
const NAME_COL_FINE_PX = 280;
const CHROME_PX = 80;
/* Three is the fewest this screen will draw. Below the width where three fit, the wrap's
   `overflow-x` safety valve takes over — a phone is not the device this grid is for, and dropping
   to two columns would not make it one. */
const MIN_DAY_COLS = 3;

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

  What that costs, said plainly: an iPad in PORTRAIT now shows four day columns instead of six.
  Landscape, and any laptop, still shows six. If the owner would rather have the sixth column back
  in portrait, the pixels have to come from the name column — see the cap in the stylesheet — and
  that is her call to make, not one to make for her.

  Measured off the viewport rather than off the panel, and it stays that way after WO-1.13 moved
  this screen out of a dialog: a hidden element measures zero, this screen can legitimately be
  painted while `#classView` is still `.hidden` (boot restores the view and the paint in one pass),
  and a column count of three because the answer was asked a frame early is a defect nobody would
  look for here.
*/
function dayColumnCount(width) {
  const w = typeof width === 'number' ? width : window.innerWidth;
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
  meeting count reads this rather than testing `exception` for itself. WO-2.3's calendar events go
  in here.
*/
export function stateOf(classId, date) {
  const record = recordFor(classId, date);
  if (!record) return NOT_TAKEN;
  return record.exception ? DID_NOT_MEET : TAKEN;
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
  if (state === NOT_TAKEN) return Object.assign(empty, { text: 'Not taken yet' });
  if (state === DID_NOT_MEET) return Object.assign(empty, { text: 'Didn’t meet' });

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
function stateChip(state, unconfirmed) {
  if (state === TAKEN) return unconfirmed ? unconfirmed + ' to go' : 'Taken';
  if (state === DID_NOT_MEET) return 'Didn’t meet';
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
   Five values, none of them student data and none of them persisted. They are reset on every
   arrival (see resetRegistry): a teacher who left a past column unlocked yesterday should not find
   it still unlocked when she opens the screen with a class walking in. */
let editingPast = null;    /* an ISO date, or null for "today" */
let pageOffset = 0;        /* whole windows back from today; 0 is the window ending at today */
let searchText = '';
let filterCode = 'all';    /* 'all' or one of P T A E D */
let sortBy = 'last';       /* 'last' or 'first' */
let detailFor = '';        /* the student whose row detail is open, or '' — one at a time */

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

/* ────────────────────────────── writing ──────────────────────────────

   The writers all have the same shape: refuse what cannot be true, write through src/store.js's
   update(), repaint what changed, say what happened. None of them buffers, and there is nothing
   anywhere in this file that a later tap has to confirm.

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
  paintDetail();
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
  paintDetail();
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
  paintDetail();
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
  const record = recordFor(cls.id, on);
  if (!record || record.exception) return;
  if (stateSummary(cls.id, on).marked) return;

  update((d) => removeRecord(d, cls.id, on));
  paintColumn(on);
  paintActions();
  paintDetail();
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
  if (stateOf(cls.id, on) === DID_NOT_MEET) return;

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
  if (stateOf(cls.id, on) !== DID_NOT_MEET) return;

  update((d) => removeRecord(d, cls.id, on));
  paintColumn(on);
  paintActions();
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
   screen where a mis-tap two columns left is a mark on a day the teacher was not thinking about. */
export function editPastDay(date) {
  if (!writableDate(date) || date === todayISO()) return;
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
  Paging, in whole windows. "Earlier" goes back six weekdays at a time, which puts a date two weeks
  behind two taps away — the acceptance line this control exists for. "Later" is clamped at the
  window that ends today, and that clamp is the visible half of "future dates are blocked": the
  button is there, disabled, saying why, rather than absent and unexplained.

  Paging away from today locks any unlocked past column, because the strip that says WHICH day you
  are editing is only honest while that day is on screen.
*/
export function pageDays(direction) {
  const before = pageOffset;
  if (direction === 'today') pageOffset = 0;
  else if (direction === 'earlier') pageOffset += 1;
  else if (direction === 'later') pageOffset = Math.max(0, pageOffset - 1);
  else return;
  if (pageOffset === before && direction !== 'today') return;
  editingPast = null;
  detailFor = '';
  renderAttendance();
  const shown = dayColumns(dayColumnCount(), pageOffset, todayISO());
  announce(pageOffset === 0 ? 'Back to this week, ending today.'
    : 'Showing ' + spokenDate(shown[shown.length - 1]) + ' to ' + spokenDate(shown[0]) + '.');
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
function columnClasses(date, state, today, editing) {
  return 'attendance-col-' + state
    + (date === today ? ' attendance-col-today' : '')
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
function cellFor(student, date, state, cell, editable) {
  const code = codeOf(cell) || PRESENT;
  const at = timeOf(cell);
  const note = noteOf(cell);
  let glyph = code;
  let tone = code;
  let said;
  if (state === DID_NOT_MEET) { glyph = '–'; tone = 'none'; said = 'the class did not meet'; }
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

  The elapsed count that would tick beside that time is WO-2.9's and is deliberately not here.
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

     THIS IS THE TIME THEY LEFT, NOT HOW LONG THEY HAVE BEEN GONE. The elapsed counter belongs in
     the slot after this block — `.attendance-pass-card-elapsed`, whose geometry the stylesheet
     already holds open — and it is WO-2.9's, because it is the one that has to survive iOS
     suspending a backgrounded PWA. Nothing here ticks. */
  meta.append(el('span', 'attendance-pass-card-out', at ? 'out ' + at : 'out'));
  info.append(meta);
  main.append(info);

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
  if (!box) return;
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
}

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
  There is no third case, because there is no column after today.
*/
function dayHead(date, state, today, editing, unconfirmed) {
  const th = el('th', 'attendance-day ' + columnClasses(date, state, today, editing));
  th.setAttribute('scope', 'col');
  th.setAttribute('data-attendance-col', date);

  th.append(el('span', 'attendance-day-dow', dayAbbr(date)));
  th.append(el('span', 'attendance-day-date', shortDate(date)));
  const chip = el('span', 'attendance-day-state', stateChip(state, unconfirmed));
  /* The count is the alarm, so it is coloured like one rather than like the taken column it sits
     on — the first of the three places a half-taken class has to be loud. */
  if (state === TAKEN && unconfirmed) chip.classList.add('waiting');
  th.append(chip);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'attendance-day-btn';
  if (date === today) {
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
  const marks = marksOf(recordFor(cls.id, date));
  const editable = date === editDate() && state !== DID_NOT_MEET && writableDate(date);
  const unconfirmed = countsFor(cls.id, date)[UNCONFIRMED];

  const th = head.querySelector('th[data-attendance-col="' + date + '"]');
  if (th) th.replaceWith(dayHead(date, state, today, editing, unconfirmed));

  body.querySelectorAll('td[data-attendance-col="' + date + '"]').forEach((td) => {
    const student = findStudent(td.getAttribute('data-attendance-student'));
    if (!student) return;
    td.className = 'attendance-cell-td ' + columnClasses(date, state, today, editing);
    td.textContent = '';
    td.append(cellFor(student, date, state, marks[student.id], editable));
    const at = state === TAKEN ? timeOf(marks[student.id]) : '';
    if (at) td.append(cellTime(at));
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
  const text = on !== today
    ? 'You are editing ' + spokenDate(on) + ' — not today.'
    : 'Showing ' + spokenDate(columns[columns.length - 1]) + ' to ' + spokenDate(columns[0])
      + '. Today is not on screen.';
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
     A modifier rather than a fourth state: stateOf() still has three answers, and this class is
     genuinely taken. */
  stateEl.className = 'attendance-state ' + summary.state
    + (summary.unconfirmed ? ' unconfirmed' : '');

  actions.textContent = '';
  note.textContent = '';
  note.classList.add('hidden');
  if (!cls) return;

  if (summary.state === DID_NOT_MEET) {
    actions.append(actionButton('The class met after all', 'data-attendance-undrop', on, 'restore'));
    note.textContent = 'Nothing is recorded for this day, and nothing counts toward anything. '
      + 'Undoing this leaves it not taken yet, ready to mark.';
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
    standing up with a class walking in, and the fourth button is the one that gets mis-tapped.

      not taken            [Everyone’s here] · [Didn’t meet]
      taken, nothing on it [✓ Everyone’s here — pressed] · [Didn’t meet]
      taken, only U's      [Everyone’s here] · [Not taken yet] · [Didn’t meet]
      taken, marks + U's   [Everyone’s here] · [Un-confirm everyone] · [Didn’t meet]
      taken, marks, no U   [Un-confirm everyone] · [Didn’t meet]

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

/* Earlier · Today · Later. "Later" is disabled at the window that ends today and says why — the
   visible half of the rule that there is no future column. */
function paintPager(columns) {
  const pager = document.getElementById(PAGER_ID);
  if (!pager) return;
  pager.textContent = '';
  if (!openClass()) return;

  const earlier = actionButton('◀ Earlier', 'data-attendance-page', 'earlier');
  earlier.title = 'The six weekdays before these';
  pager.append(earlier);

  pager.append(el('span', 'attendance-pager-range',
    columns.length ? shortDate(columns[columns.length - 1]) + ' – ' + shortDate(columns[0]) : ''));

  const today = actionButton('Today', 'data-attendance-page', 'today');
  today.disabled = pageOffset === 0 && !editingPast;
  today.title = today.disabled ? 'You are on today' : 'Back to the week ending today';
  pager.append(today);

  const later = actionButton('Later ▶', 'data-attendance-page', 'later');
  later.disabled = pageOffset === 0;
  later.title = later.disabled
    ? 'Today is the last column there is — tomorrow’s attendance is not something to record yet'
    : 'The six weekdays after these';
  pager.append(later);
}

/* The rows, and only the rows. Search, filter and sort come through here; a write does not. */
function renderRows() {
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

  const today = todayISO();
  const on = editDate();
  const columns = dayColumns(dayColumnCount(), pageOffset, today);
  /* Read once per column rather than once per cell: twenty-six rows times six columns is a hundred
     and fifty-six lookups through the whole attendance array otherwise. */
  const perColumn = columns.map((date) => {
    const state = stateOf(cls.id, date);
    return { date: date, state: state, marks: marksOf(recordFor(cls.id, date)),
      editing: date === on && date !== today,
      editable: date === on && state !== DID_NOT_MEET && writableDate(date) };
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
    cell.append(avatar, el('span', 'attendance-student-name', rosterName(student)));
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
        + columnClasses(col.date, col.state, today, col.editing));
      td.setAttribute('data-attendance-col', col.date);
      td.setAttribute('data-attendance-student', student.id);
      td.append(cellFor(student, col.date, col.state, col.marks[student.id], col.editable));
      const at = col.state === TAKEN ? timeOf(col.marks[student.id]) : '';
      if (at) td.append(cellTime(at));
      row.append(td);
    });
    body.append(row);
  });

  /* The open panel goes back where it was. Rows are rebuilt by search, filter and sort, and a
     detail that survived only in a variable would be a panel the teacher watched vanish. If the
     student it belongs to has been filtered off the screen it closes, because a panel with no row
     above it belongs to nobody. */
  paintDetail();
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
function paintDetail() {
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
  if (state === DID_NOT_MEET || !writableDate(on)) { detailFor = ''; return; }
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
  const columns = dayColumns(dayColumnCount(), pageOffset, today);
  const nameEl = document.getElementById(CLASS_NAME_ID);
  const head = document.getElementById(HEAD_ID);
  const caption = document.getElementById(CAPTION_ID);
  if (nameEl) nameEl.textContent = cls ? cls.name : 'no class';

  paintBanner(columns);
  paintActions();
  paintPassNote();
  paintPassBanner();
  paintToolbar();
  paintPager(columns);

  if (caption) {
    caption.textContent = 'Attendance for ' + (cls ? cls.name : 'no class')
      + '. Students are rows. The first column after the name holds hall passes, and the last '
      + columns.length + ' weekdays are the columns after it, most recent first'
      + (pageOffset === 0 ? ', starting with today.' : '.');
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
      columns.forEach((date) => row.append(dayHead(date, stateOf(cls.id, date), today,
        date === on && date !== today, countsFor(cls.id, date)[UNCONFIRMED])));
      head.append(row);
    }
  }
  renderRows();
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
  pageOffset = 0;
  searchText = '';
  filterCode = 'all';
  sortBy = 'last';
  detailFor = '';
  const search = document.getElementById(SEARCH_ID);
  if (search) search.value = '';
}
