/*
  HOW A DATE READS — `2026-09-08` → `Sep 8`, and this is the only place in the app that answers it.

  ── WHY THIS FILE EXISTS (WO-3.20) ──

  There were FIVE functions called shortDate() in src/, in THREE formats: `Sep 4` in
  src/assignments.js, src/scores.js and src/past-due.js — three byte-identical copies — `Thu, Sep 4`
  in src/days-off.js, and `9/4` EXPORTED from src/attendance.js. Two copies was a defensible
  convention and each copy said in a comment why it was not an import. Five is a formatter waiting to
  disagree with itself.

  THE DUPLICATION WAS THE BORING HALF; THE NAME WAS THE TRAP. A screen that reaches for a date
  formatter finds the export first, in good faith, imports `shortDate`, and renders `9/4` in a column
  beside one that says `Sep 4`. Nothing in tools/verify-shell.mjs or tools/wo-sweep.mjs would fail,
  because both are correct dates. src/attendance-report.js's header already argues this case for the
  printed page — *a printout that has left the building and disagrees with the screen is worse than
  no printout* — and the same argument applies to two screens open side by side.

  ── THE NAMES, AND THE RULING (WO-3.20 deliverable 2) ──

  ONE FUNCTION IN THIS APP MAY BE CALLED shortDate(), AND IT IS THE ONE BELOW. The other two formats
  survive, because they are different formats for good reasons, under names that say what they
  produce rather than under a name that says only "short":

    | Function             | Lives in          | `2026-09-08` → | Who reads it                        |
    |----------------------|-------------------|----------------|-------------------------------------|
    | shortDate()          | here              | `Sep 8`        | assignment list, score grid,        |
    |                      |                   |                | past-due prompt and review          |
    | weekdayShortDate()   | here              | `Tue, Sep 8`   | the days-off list and the events    |
    |                      |                   |                | list, where the weekday IS the fact |
    |                      |                   |                | being checked                       |
    | numericDate()        | src/attendance.js | `9/8`          | attendance column heads, the pager  |
    |                      |                   |                | range, both printed reports         |

  THE SECOND ROW SAID `src/days-off.js` UNTIL WO-6.1, and it moved here for this file's own reason
  rather than for tidiness. It was one screen's format while there was one screen listing dated
  rows; WO-6.1 adds a second list (src/events.js) one modal away from the first, and the two must
  not spell `Thu, Nov 26` two ways. The alternative was a second copy of a composition whose whole
  point is that there is one of it — which is the five-copies state this file was created to end,
  arriving again at copy two. The function is unchanged byte for byte, so nothing on the days-off
  list renders differently.

  src/attendance.js's cannot compose — `9/8` shares no substring with `Sep 8` — so it is a rename
  and nothing else, and its own comment holds the reasoning for the format.

  ── WHAT AN UNREADABLE DATE PRODUCES, DECIDED ONCE (WO-3.20 deliverable 3) ──

    a real date   shortDate('2026-09-08')   === 'Sep 8'
    empty         shortDate('')             === ''      — and so are null, undefined, and a due date nobody typed
    malformed     shortDate('next Tuesday') === ''      — anything that is not three numeric fields

  EMPTY STRING RATHER THAN THE INPUT ECHOED BACK, and the caller decides what an unreadable date
  LOOKS like on its own screen: src/assignments.js prints `—` (`shortDate(x) || '—'`), src/past-due.js
  prints the raw value it was handed (`shortDate(w.due) || w.due`) so a half-typed date stays
  findable, and src/scores.js's column head simply has no due line at all. A formatter that echoes its
  input can print `undefined`, or the number a restored document left behind, into a cell a teacher
  reads as a date — three of the five copies had already made this call and this is the one that
  survives.

  THE TWO NAMED FORMATTERS ABOVE STILL ECHO their input when they cannot read it, and that is left
  standing deliberately rather than inherited by accident: WO-3.20 is behaviour-neutral by
  construction, and what src/attendance.js's column heads or src/days-off.js's list print for a
  malformed date is a thing on a screen. Whether either should also answer '' is written up as a
  proposed follow-up in .claude/dispatch/WO-3.20-result.md; it needs an answer to which inputs can
  actually reach them, which is a question about restored documents rather than about formatting.

  ── TWO RULES ABOUT THIS FILE ITSELF ──

  IT IMPORTS NOTHING, and may never import anything from src/. It is a leaf so that every screen can
  wear it: the suite has no bundler, so a cycle here would be paid at load time on every screen in
  the app. That is also why the parse below is its own rather than src/attendance.js's parseISO().

  IT READS NO CLOCK. It formats the string it is handed and asks nothing about today — which is what
  lets src/scores.js import it without spending its decision 1 (*nothing on the score grid reads a
  clock*), and what keeps `late` and `missing` teacher-marked (CLAUDE.md).

  READ FIELD BY FIELD, never `new Date('2026-09-08')`: the spec reads a bare date string as UTC
  midnight, which is one timezone away from being the day before, and src/attendance.js's parseISO()
  carries the long version of that scar.

  AND IT HOLDS DATE TEXT AND NOTHING ELSE. Named for the thing it owns rather than for its layer
  (src/README.md § The convention) — this is the single most likely file in the project to get called
  `utils.js`, and the convention forbids it. A second concern arriving here is how a leaf becomes a
  junk drawer; the next formatter that is not a date belongs in the file that owns its subject.
*/

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* `2026-09-08` → `Sep 8`; anything this cannot read → `''`. The two answers are ruled on above. */
export function shortDate(iso) {
  const parts = String(iso || '').split('-');
  if (parts.length !== 3) return '';
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(d.getTime())) return '';
  return MON[d.getMonth()] + ' ' + d.getDate();
}

/*
  `2026-11-26` → `Thu, Nov 26`. The weekday in front of the format above, for the two lists that are
  read against a school WEEK — the days-off panel and the events panel — where the weekday is the
  fact being checked rather than decoration.

  NOT CALLED shortDate(), AND THAT IS THE POINT OF WO-3.20: it produces a different string from the
  function above, and two functions with one name and two answers is how a later screen renders one
  format beside another in good faith. The name says what comes out. The MONTH AND DAY come from
  that function rather than from a second copy of the same lookup.

  AN UNREADABLE DATE IS ECHOED BACK rather than dropped, which is this function's own answer and
  differs from shortDate()'s '' one row above. Kept as it was when it moved here from
  src/days-off.js at WO-6.1, because that move was behaviour-neutral by construction; the ruling on
  the difference is written out in this file's header.

  The guard is shortDate()'s: it returns a non-empty string only for three numeric fields that make
  a real day, so the parse below cannot be reached with anything `new Date()` would call invalid.
*/
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function weekdayShortDate(iso) {
  const said = shortDate(iso);
  if (!said) return String(iso || '');
  const parts = String(iso).split('-');
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return DOW[d.getDay()] + ', ' + said;
}
