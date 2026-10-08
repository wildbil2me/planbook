/* lib-dates.mjs — today, the last N weekdays, the next N weekdays, and tomorrow
 *
 * Node's answer to "what day is it", in the four shapes this harness asks for. Pure: no browser,
 * no page, no harness object — which is why it is a `lib-` module and not a section, and why it is
 * imported by name rather than handed over on `h`. That is the line WO-1.26 drew and that
 * tools/README.md § "Driving a browser over CDP" states: anything that talks to the browser rides
 * on the harness object; anything that does not is imported from a `lib-` file.
 *
 * Since WO-1.46 it also answers a fifth question, and it is a question about the DOCUMENT rather
 * than the clock: "what is the first day from here that nothing has a record on" —
 * firstClearDayFrom(), at the foot of the file, with its reasoning. It lives here and not in a
 * section because three sites in two sections want it, and a walk copied to each would be three
 * walks — WO-1.44 wrote two of them inline before this file had one.
 *
 * These were module-scope consts in tools/verify-shell.mjs — nodeToday above the classes & terms
 * section, the other three above attendance — and each had already MOVED up the file once or twice
 * as a later section came to need it. Their comments say why, and they travel here unchanged: one
 * definition, because a second answer to "what day is it" is the defect they exist to catch. Living
 * in one file is the end state of that argument rather than a departure from it.
 *
 * One thing the move does change, and it is small enough to be worth stating rather than hiding:
 * these are computed when this module is first imported — at the top of the run — where before they
 * were computed as the script reached line 3,699 and line 9,118. A run that straddled midnight
 * would previously have disagreed with itself between two sections; now it disagrees with the
 * clock. Neither is a case this file has ever met, and the new one is the smaller surface.
 */

/*
  ── THE CLOCK IS AN INPUT SINCE WO-1.44, AND ITS DEFAULT IS THE REAL ONE ──

  `node tools/verify-shell.mjs --today=2026-11-10` runs the whole harness as if today were that
  date (no earlier than `TODAY_FLOOR`, below — WO-1.63). Without the flag nothing here changes by a byte: `SHIFT_DAYS` is 0, `now()` is `new Date()`,
  and every value below is what it has always been. That default is not a convenience, it is the
  rule — a harness whose ordinary run stopped measuring the day the teacher is actually in would
  have swapped one blind spot for another.

  WHY IT IS HERE AND NOT IN THE ENTRY FILE. This module exists because a second answer to "what day
  is it" is the defect it guards, and an offset that lived in `verify-shell.mjs` would be exactly
  that second answer: the four values below would still be reading the real clock while the page was
  reading a shifted one. One offset, one clock, in the file that already owns the question. The
  entry file imports `SHIFT_MS` from here to shift the PAGE's clock by the same amount, so the two
  runtimes go on agreeing — which is the property the check at
  `tools/verify/attendance.mjs` § "the date it will write is today in LOCAL time" asserts, and it
  stays asserted rather than assumed.

  WHAT IT IS FOR. WO-1.44 found the attendance section reading a future date off the real clock —
  `today + 9` — and colliding, on exactly one day of the year, with a fixture an earlier section
  hard-coded on 2026-09-09. That collision is repaired where it lives, by deriving the date from
  the document instead of from the clock. This flag is what lets the repair be PROVED on more than
  the one day it was written on, rather than reasoned about in a comment. (WO-1.53 found the same
  fixture meeting the register's earlier page — `nodeColumns(6, 1)` — for eight days every
  September, a window no walk-forward can route around because the page is not the fixture's to
  choose; the fixture's date is derived off THIS module now, three pages back, and the flag is
  again what proved it, on five dates.)

  IT SHIFTS BY WHOLE DAYS AND IT SHIFTS, IT DOES NOT FREEZE. Everything in this app that measures an
  elapsed time — the hall-pass clock most of all — goes on working, because `Date.now()` on both
  sides is the real clock plus a constant. A frozen clock would have made every duration zero and
  turned a date experiment into a rewrite of the pass card's section.

  `SHIFT_MS` is measured between two real `Date` objects rather than computed as `days × 86400000`,
  so a shift that crosses a daylight-saving seam lands on the same wall-clock time on the far side
  instead of an hour off it.
*/
const SHIFT_ARG = (process.argv.slice(2).filter((a) => a.indexOf('--today=') === 0)[0] || '')
  .slice('--today='.length);
/*
  ── THE EARLIEST DATE `--today` WILL TAKE (WO-1.63, ruled 2026-10-07) ──

  The fixtures are built in the 2026-27 school year, and some of them type a date in calendar 2026
  that they assume today is already PAST. The latest such date decides the floor, and today it is
  `tools/verify/concern-list.mjs`'s June term — 2026-06-01 … 2026-06-30, under a header that says
  "THE FIXTURE IS JUNE 2026 AND IT IS IN THE PAST ON PURPOSE" — with `log-entries.mjs` (meetings on
  2026-06-01 … 2026-06-10) and `term-nav.mjs` (2026-02-02 … 2026-03-02) inside it. Measured, not
  reasoned: the run at the floor and the refusal of the day before are in TESTING.md § WO-1.64.

  THE FLOOR SAT AT 2026-09-19 FOR ONE WORK ORDER, AND IT WAS A CHECK, NOT A FIXTURE. WO-1.63 set it
  there because `score-grid.mjs`'s WO-3.27 laptop-viewport check compared the box's top to 0
  exactly, and only the past-due banner that fixture's *Unit test* (due 2026-09-18) draws from the
  19th on happened to land the top on the positive side of a whole-pixel scroll. WO-1.64 gave that
  check the half-pixel allowance its neighbours already had, and the floor came back down to the
  June term. A due date assumed past is still a past-date assumption — it just no longer decides
  anything, because the check no longer cares whether the banner is drawn.

  A FIXTURE THAT TYPES A LATER DATE IT ASSUMES IS PAST MOVES THIS LINE, in the same sitting, and the
  run at the new floor is recorded in TESTING.md the way WO-1.63's and WO-1.64's were. Before it
  existed a run on 2026-01-20 took thirteen minutes to end in red lines that looked like a regression
  and were not; the ruling is that those dates are out of range, not that those fixtures are broken,
  so the answer is this refusal and never a re-fixture.

  Read only off an explicit `--today`. The real-clock run is never refused, whatever the date.
  No upper bound: whether a date after the fixtures' year is green has not been probed.
*/
export const TODAY_FLOOR = '2026-07-01';
/* The date the refusal suggests instead: the fixtures' own Quarter 3, measured green — 1811 of
   1811 under WO-1.62, and 1832 of 1832 again under WO-1.63 (TESTING.md § both). A suggestion
   computed from the refused date would be a date nobody had run. */
const TODAY_SUGGESTED = '2027-01-20';
export const SHIFT_DAYS = (() => {
  if (!SHIFT_ARG) return 0;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(SHIFT_ARG)) {
    /* Thrown rather than ignored. A typo that quietly ran on the real clock would produce a green
       run somebody would then cite as proof of a day it never saw. */
    throw new Error('--today wants a YYYY-MM-DD date, and got ' + JSON.stringify(SHIFT_ARG));
  }
  const want = new Date(Number(SHIFT_ARG.slice(0, 4)), Number(SHIFT_ARG.slice(5, 7)) - 1,
    Number(SHIFT_ARG.slice(8, 10)));
  /* The shape test passes 2026-13-40 and 2026-02-30, and the Date constructor rolls both over
     without a word — to 2027-02-09 and 2026-03-02 — so the harness would run a day nobody typed.
     A date that does not come back out as the string that went in is a typo, and it takes the
     typo's path (WO-1.64). */
  const p2 = (x) => (x < 10 ? '0' : '') + x;
  if (want.getFullYear() + '-' + p2(want.getMonth() + 1) + '-' + p2(want.getDate()) !== SHIFT_ARG) {
    throw new Error('--today wants a YYYY-MM-DD date, and got ' + JSON.stringify(SHIFT_ARG));
  }
  /* Thrown here, at module evaluation, which is before verify-shell.mjs's body runs at all — every
     import is evaluated first — so no server is started and no Edge is launched. ISO strings of
     one fixed shape compare correctly as strings. */
  if (SHIFT_ARG < TODAY_FLOOR) {
    throw new Error('--today=' + SHIFT_ARG + ' is before ' + TODAY_FLOOR + ', the earliest date '
      + 'this harness supports. The fixtures are built in the 2026-27 school year and some of them '
      + 'type dates they assume are already past - the latest is tools/verify/concern-list.mjs\'s '
      + 'June 2026 term - so an earlier day ends in red checks that are not defects. Dates before '
      + 'the floor are out of range by ruling (WO-1.63), not broken. Try --today=' + TODAY_SUGGESTED
      + ' (the fixtures\' own Quarter 3, measured green), or any date from ' + TODAY_FLOOR + ' on.');
  }
  const real = new Date();
  real.setHours(0, 0, 0, 0);
  return Math.round((want - real) / 86400000);
})();
export const SHIFT_MS = (() => {
  if (!SHIFT_DAYS) return 0;
  const real = new Date();
  const moved = new Date(real.getTime());
  moved.setDate(moved.getDate() + SHIFT_DAYS);
  return moved.getTime() - real.getTime();
})();
/*
  THE ONE PLACE THIS HARNESS READS THE MACHINE CLOCK. Everything below asks it, and so does every
  section that needs a `Date` of its own rather than one of the four ISO strings below — five
  sections cut a fixture window out of "now" with arithmetic these four values cannot express, and
  each of them used to call `new Date()` on the spot. That was harmless while the clock was only
  ever the real one and is not harmless now: `--today` would have moved this file and the page and
  left those five reading the real day, which is the two-answers defect this module exists to
  prevent, arriving from the direction the header did not name.
*/
export const nodeNow = () => {
  const d = new Date();
  if (SHIFT_DAYS) d.setDate(d.getDate() + SHIFT_DAYS);
  return d;
};
const now = nodeNow;
/*
  THE SAME CLOCK AS AN EPOCH NUMBER, for the three checks that ask "is this stamp FRESH" by
  comparing a millisecond the PAGE wrote against a millisecond Node reads. Those three are the only
  place in the harness where the two runtimes are compared as instants rather than as dates, and
  under `--today` they were the first thing to go red — correctly, and about nothing: the page had
  been moved a day and Node had not, so an `updatedAt` written one second ago read as a day stale.
  A tolerance widened to swallow that would have stopped the check noticing a build that never
  stamped at all, which is the one thing it is for.
*/
export const nodeNowMs = () => Date.now() + SHIFT_MS;

/*
  Today's date, computed HERE, in Node, off the same machine clock the browser is reading.

  This is deliberately not asked of the app. src/attendance.js builds it out of the local calendar
  fields precisely because toISOString() would return UTC — a different day from about 7pm Eastern
  onward — and a check that asked the app what today was would agree with a UTC bug perfectly. Two
  runtimes, one clock, one answer.

  IT SITS ABOVE THE CLASSES & TERMS SECTION SINCE WO-2.54, and it has now moved twice for the same
  reason. WO-3.17 pulled it up to the assignments section, which dates a new assignment today; this
  work order pulls it up again because the reload below comes back on the term NEAREST today, and
  the check that says so has to know which term that is without asking the app. Both sections
  underneath still use it and the old site carries a pointer. One definition, because a second one
  is the bug it guards.
*/
export const nodeToday = (() => {
  const n = now();
  const p = (x) => (x < 10 ? '0' : '') + x;
  return n.getFullYear() + '-' + p(n.getMonth() + 1) + '-' + p(n.getDate());
})();

/* `nodeToday` was defined here until WO-3.17, which moved it above the assignments section, and
   WO-2.54 moved it again to the head of classes & terms — each time because a section further up
   came to need the same value, and each time the definition MOVED rather than being copied, because
   two answers to "what day is it" is the defect it exists to catch. Its comment travels with it. */

/*
  And the COLUMNS, computed here too, for the same reason and for a second one.

  The work order's rule is "the last N weekdays, Mon-Fri, by calendar" — deliberately not "the
  dates this class has records for", because a day you forgot has no record and a window built from
  records would omit exactly the column you opened the screen to find. A check that asked the app
  which dates it had chosen could not tell those two rules apart; it would agree with either. So
  this file derives the window from the calendar and compares.

  Today is always index 0, whatever day of the week it is — the app's own documented divergence
  from a literal reading of "weekday", matching Roll Call!'s "today plus the five preceding
  weekdays". On the five days that matter the two readings are the same list.
*/
export const nodeColumns = (count, offset) => {
  const p = (x) => (x < 10 ? '0' : '') + x;
  const iso = (x) => x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate());
  const d = now();
  const out = [];
  while (out.length < count * (offset + 1)) {
    const dow = d.getDay();
    if (!out.length || (dow !== 0 && dow !== 6)) out.push(iso(d));
    d.setDate(d.getDate() - 1);
  }
  return out.slice(offset * count, offset * count + count);
};
export const thisWeek = nodeColumns(6, 0);
export const lastWeek = nodeColumns(6, 1);
/* And the same walk the other way, derived here for the same reason nodeColumns is: since
   2026-08-08 the registry pages FORWARD as far as the calendar goes, and a check that asked the app
   which future dates it had chosen would agree with any answer it gave. `n` is in weekdays after
   today, 1-based — nodeWeekdayAhead(1) is the next weekday, whatever today is. */
export const nodeWeekdayAhead = (n) => {
  const p = (x) => (x < 10 ? '0' : '') + x;
  const d = now();
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) left -= 1;
  }
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};
export const daysApart = (a, b) => Math.round(
  (new Date(a.slice(0, 4), Number(a.slice(5, 7)) - 1, a.slice(8, 10))
    - new Date(b.slice(0, 4), Number(b.slice(5, 7)) - 1, b.slice(8, 10))) / 86400000);
/* The CALENDAR-DAY walk from today, `n` days on (negative walks back) — the sibling of
   nodeWeekdayAhead() for the sites that measure in days a school is not necessarily open: a gap
   between two terms is two days whether or not they are school days, and a pre-drop nine days out
   is nine days out on a Saturday too. `tomorrow` below is this with n = 1 and has been since
   WO-1.26 (the WO-2.54 section carried its own copy as `calDay()` until WO-1.46 — a second walk
   in a second file is the defect this module exists to catch, and it moved here rather than being
   left beside the one it duplicated). */
export const nodeDaysFromToday = (n) => {
  const d = now();
  d.setDate(d.getDate() + n);
  const p = (x) => (x < 10 ? '0' : '') + x;
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};
export const tomorrow = nodeDaysFromToday(1);

/*
  ── THE FIRST DAY THE DOCUMENT HAS NOTHING ON, FROM A GIVEN START (WO-1.46) ──

  The shape WO-1.44 settled on for `preDropDay` in tools/verify/attendance-passes.mjs, moved here so
  there is one of it. A date a fixture is FREE TO PICK — the day a future event is authored on, a
  horizon the register pages forward to — is taken from the document rather than guessed off the
  calendar, because a guess is an offset, and an offset collides with whatever an earlier section
  planted at that distance on exactly the days nobody drove. `today + 9` reached the class manager's
  residue on 2026-08-31 and cost 766 checks and a day; `nodeWeekdayAhead(4)` reached the same residue
  from a Thursday and cost one `--today` run; `nodeWeekdayAhead(9)` in the WO-2.52 section was the
  same construct on the same offset one file along, green on every day anyone had happened to run
  it, which is the evidence that failed on 2026-08-30.

  DERIVED, NOT WIDENED. The walk STARTS at the date the site always used, so the ordinary run picks
  the day it always picked, and it moves forward only past days that already hold a record. A bigger
  offset would move the collision to a day nobody has driven; this removes it.

  IT WALKS CALENDAR DAYS UNLESS ASKED FOR WEEKDAYS, and the caller says which, because the two are
  different properties of the date handed back. A day-off event or a horizon the register pages to
  has to sit on a weekday — the strip draws no Saturday, so a Saturday horizon is a horizon no column
  reaches — and those sites pass `{ weekdays: true }`. The pre-drop predicate reads any date at all
  and keeps the calendar walk WO-1.44 wrote. THE START IS TRUSTED EITHER WAY: a weekday walk handed
  a Saturday hands it back if nothing is recorded there, because every site here starts from a
  `nodeWeekdayAhead()` and a helper that quietly moved a clear start would be a second opinion about
  which day was asked for — the sites assert the weekday themselves.

  A CEILING RATHER THAN A `while (true)`, AND THE CEILING IS NOT A THROW. After sixty taken days in
  a row it hands back the sixty-first whatever is on it, and the site's own precondition — zero
  records on the date, and the date in the future — is what goes red, on one line that says what
  was assumed, instead of the run hanging or a stack trace taking the section with it. Every site
  that calls this asserts that precondition in its fixture check; a call without one is a guess with
  extra steps, and the check is what turns the next collision into a named red line rather than the
  cascade of 2026-08-31.

  UTC throughout, off the ISO string, so the walk cannot land a day either side of itself on a DST
  seam — the same reasoning src/calendar.js's plusDays() gives at the one place that file touches a
  Date at all. `records` is any array of objects carrying a `date`, which is the shape every reader
  in the harness hands back for `doc.attendance`; the classId is deliberately not consulted, because
  the collision this guards against was a NEIGHBOUR's record, and a walk that only stepped past the
  open class's own records would have walked straight onto it.
*/
const utcOf = (iso) => new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1,
  Number(iso.slice(8, 10))));
const isoOfUTC = (d) => {
  const p = (x) => (x < 10 ? '0' : '') + x;
  return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate());
};
/* The next Monday-to-Friday after `iso`, by calendar. Exported because a site that derives an
   event's END from a derived start needs the same step the walk takes — an end the walk had moved
   PAST would be an end the app is right to overwrite. */
export const nextWeekday = (iso) => {
  const d = utcOf(iso);
  do { d.setUTCDate(d.getUTCDate() + 1); } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return isoOfUTC(d);
};
/* Whether an ISO date is a Monday-to-Friday, for the sites that assert it of a derived date. */
export const isWeekday = (iso) => {
  const dow = utcOf(iso).getUTCDay();
  return dow !== 0 && dow !== 6;
};
export const firstClearDayFrom = (records, start, opts) => {
  const weekdays = !!(opts && opts.weekdays);
  const taken = {};
  (records || []).forEach((r) => { if (r && typeof r.date === 'string') taken[r.date] = true; });
  let day = start;
  for (let i = 0; i < 60 && taken[day]; i += 1) {
    if (weekdays) day = nextWeekday(day);
    else { const d = utcOf(day); d.setUTCDate(d.getUTCDate() + 1); day = isoOfUTC(d); }
  }
  return day;
};
