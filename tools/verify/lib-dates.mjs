/* lib-dates.mjs — today, the last N weekdays, the next N weekdays, and tomorrow
 *
 * Node's answer to "what day is it", in the four shapes this harness asks for. Pure: no browser,
 * no page, no harness object — which is why it is a `lib-` module and not a section, and why it is
 * imported by name rather than handed over on `h`. That is the line WO-1.26 drew and that
 * tools/README.md § "Driving a browser over CDP" states: anything that talks to the browser rides
 * on the harness object; anything that does not is imported from a `lib-` file.
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

  `node tools/verify-shell.mjs --today=2026-09-03` runs the whole harness as if today were that
  date. Without the flag nothing here changes by a byte: `SHIFT_DAYS` is 0, `now()` is `new Date()`,
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
  hard-codes on 2026-09-09. That collision is repaired where it lives, by deriving the date from
  the document instead of from the clock. This flag is what lets the repair be PROVED on more than
  the one day it was written on, rather than reasoned about in a comment.

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
export const SHIFT_DAYS = (() => {
  if (!SHIFT_ARG) return 0;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(SHIFT_ARG)) {
    /* Thrown rather than ignored. A typo that quietly ran on the real clock would produce a green
       run somebody would then cite as proof of a day it never saw. */
    throw new Error('--today wants a YYYY-MM-DD date, and got ' + JSON.stringify(SHIFT_ARG));
  }
  const want = new Date(Number(SHIFT_ARG.slice(0, 4)), Number(SHIFT_ARG.slice(5, 7)) - 1,
    Number(SHIFT_ARG.slice(8, 10)));
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
export const tomorrow = (() => {
  const d = now();
  d.setDate(d.getDate() + 1);
  const p = (x) => (x < 10 ? '0' : '') + x;
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
})();
