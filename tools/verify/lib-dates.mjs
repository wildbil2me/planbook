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
  const n = new Date();
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
  const d = new Date();
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
  const d = new Date();
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
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const p = (x) => (x < 10 ? '0' : '') + x;
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
})();
