/*
  The signal engine — one evaluator, both directions, and the thresholds it reads.

  ── WHY ONE EVALUATOR AND NOT TWO ──

  A student can be on the concern list and the praise list at the same time, and that is
  INFORMATION RATHER THAN A BUG (WO-4.1): a student whose grade is climbing while their
  attendance falls is exactly who a teacher wants to see twice. Two evaluators would make that
  state a coincidence between two files instead of a single pass's honest answer, and the first
  time they disagreed about which meetings a window covered nobody would notice.

  So there is one pass over the class, one hit list, and `direction` on every hit. A concern list
  is `hits.filter((h) => h.direction === 'concern')` and the praise list is the other arm — there
  is deliberately no third place where the split could come out differently.

  ── WHAT A RULE IS, AND THE ONE THING THIS SHAPE MAKES IMPOSSIBLE ──

  A rule is two functions, and the split between them is the point:

      measure(ctx, studentId)  →  null, or the NUMBERS that made it fire
      say(numbers, who)        →  one sentence

  `measure` may read anything: the document, the grade engine, the attendance ledger. `say` is
  handed the numbers `measure` published and `who` — a small object of NAMES, strings only, no
  document, no clock, no thresholds of its own. **A rule therefore cannot put a figure in its
  sentence that the hit does not carry**, because there is no figure within reach that is not in
  `numbers`. That is WO-4.1's "explanations are produced by the rule itself" and its "every hit
  carries real numbers" made structural rather than promised: "why is this student here?" is
  answered by construction and cannot drift from the arithmetic, and a later screen that wrote its
  own sentence would be writing one this module can already produce.

  ── WHAT IS NOT HERE ──

  THE RULES THEMSELVES, all but two — UNTIL WO-4.2, WHICH IS WHERE THE NINE CONCERN RULES LANDED
  (2026-08-20), AND WO-4.3, WHICH LANDED THE OTHER FOUR PRAISE RULES ON 2026-08-24. All fourteen
  the data model tabulates are now here; WO-4.4 owned
  the behavior log and delivered it on 2026-08-24, so the ninth concern rule counts something now.
  WO-4.5 LANDED THE COOLDOWN AND THE QUIET MIDDLE ON 2026-08-27, and neither of them is a rule —
  applyCooldown() is a filter over the hits a pass produced and quietMiddle() is a list of the
  students it did NOT produce, both at the foot of this file, both reads. Two rules were registered at WO-4.1 — `grade-below` and `attendance-window` — as
  proofs of the contract above rather than as the feature: an engine with no rules in it cannot
  demonstrate both directions from one pass, and one with a single rule cannot demonstrate a
  student on both lists. Both survived WO-4.2 unaltered except for the `figure` every rule now
  carries; they are ordinary members of the registry and their work orders may still replace them.

  THE BEHAVIOR RULE STOPPED BEING INERT ON 2026-08-24 (WO-4.4), which is that work order's third
  acceptance line and this paragraph's own prediction coming true. It was registered and returning
  nothing while no screen wrote an entry for it to count; `inertRules()` is still here, still drives
  the notice on the concern list, and now returns an EMPTY list — so the sentence that told a teacher
  the rule was not running took itself off the screen the day the log landed, rather than needing to
  be found and deleted.

  AND THE LIST SCREEN IS NOT HERE. src/signals-view.js draws it, the same split
  src/signal-settings.js makes with the editor and for the same reason: this module owns the
  answers, a surface over it owns the pixels, and the import runs one way.

  EVERY THRESHOLD IS HERE, though, and that is deliberate: `SIGNAL_SETTINGS` below names all nine
  concern values, all five praise values and the cooldown, with the defaults tabulated in
  docs/data-model.md § Signal thresholds. WO-4.2, WO-4.3, WO-4.4 and WO-4.5 read the keys named
  there rather than inventing their own, which is the half of this work order that is convention.

  RANKING IS NOT A FIELD ON A HIT. WO-4.2 orders its list by severity and WO-4.3 ranks by DELTA
  rather than by level, and both of those numbers are already in `numbers` — a `rank` beside them
  would be a second copy of a figure the hit carries, free to disagree with it. Both orders are
  FUNCTIONS below — severityOrder() and praiseOrder() — and both band by rule before they compare a
  figure, because "is a 14-point climb bigger than two flags going away?" has no answer and asking
  it would let whichever number happened to be larger decide.

  AND NOTHING IN THE DOCUMENT REMEMBERS WHO WAS ON A LIST. The turnaround rule needs to know that a
  student WAS flagged and is not now, and it derives that by asking this same evaluator about an
  earlier day (`through`) rather than by storing a bit — WO-4.3's own instruction, and the reason
  `newYearDocument()` gained nothing for this work order. A stored bit goes stale the moment a
  threshold moves, and it would be a second truth about who was on the list sitting beside the rules
  that decide it. The rule's own comment carries what that derivation can and cannot prove.

  *(That paragraph ended "Ordering is the list screen's business; this module answers who and why"
  until 2026-08-20, and the owner's severity ruling moved half of it: the ORDER now lives here, as
  severityOrder() — a function over hits, recomputed from their own numbers — because WO-6.4's
  glance panel and Phase 5's send flow inherit it and three surfaces sorting for themselves is
  three answers. The sentence it replaced is still true of the FIELD, which is what it was
  protecting: nothing below writes a rank onto a hit, and there is still no number on one that can
  go stale against the arithmetic beside it.)*

  ── THE DOCUMENT ARGUMENT MUST BE THE OPEN ONE ──

  evaluate() takes the document, as WO-4.1's Deliverables ask, and everything grade-shaped is a
  pure read of it through src/grade-engine.js. The MEETINGS half cannot be: "which dates did this
  class actually meet" is src/attendance.js's answer and has been since WO-2.1, and those helpers
  resolve against the document the store has open. A second copy of that filter chain in here
  would agree with itself perfectly and disagree with the registry the first time a day off was
  authored — which is the exact failure the three states exist to prevent. So the document handed
  in is expected to be the open one; passing a foreign document would mix two years' meetings into
  one answer.

  ── AND NOTHING HERE READS A SUPPORT, A PLAN OR A MEDICAL NEED ──

  Not now, not in WO-4.2, and not in WO-4.4 — which is the one that could have. That work order
  added `supports.attendanceClause` and a prompt that reads it, and the prompt lives in
  src/accommodation-prompt.js precisely so that it does not live here: a signal's explanation is
  drafted into mail that goes to a guardian (docs/data-model.md § Outreach templates,
  `{{signals.list}}`), so a rule that read that half of the roster would make disclosure a
  one-keystroke mistake — the same reason no merge field resolves those paths. Grades, scores,
  marks, meetings and the log are the whole of what a rule may see, and of the log a rule sees a
  COUNT of one kind and never a word of what was written.

  THE COOLDOWN AND THE QUIET MIDDLE READ ONE FIELD MORE, AND IT IS STILL NOT A WORD ANYBODY TYPED
  (WO-4.5). What crosses out of src/log.js is three DATES and the `audience` enum — no subject, no
  body, no entry. A suppressed row has to say which contact silenced it, and *you emailed his
  guardian about this on Sep 6* is that sentence with nothing of the teacher's own writing in it.
  Neither function is a rule, so neither can put any of it into an explanation Phase 5 drafts into
  mail; the suppression record is a wrapper AROUND a hit and the hit is unchanged.

  AND THERE IS STILL NO WRITER IN THIS FILE. WO-4.3's line holds through WO-4.5 without an
  exception: the cooldown derives its suppression from `log[]` at read time and stores nothing, so
  the document is byte-identical either side of a pass and a restored backup restores the cooldowns
  with the log that produced them.
*/

/* The grade half, and BOTH of these are reads of the same arithmetic rather than two of them
   (WO-4.2). weightedClassGrade() is what "fell N points" measures at each end of its window —
   the acceptance line says the weighted grade and not raw scores — and openWork() is where
   `missing` is defined, so the missing-work rule counts the very rows the grade already charged
   for. A rule that decided for itself what a missing cell was would be the second opinion
   src/grade-engine.js's header forbids. */
import { weightedClassGrade, openWork } from './grade-engine.js';
/* attendanceHistory() joins the two window helpers at WO-4.2 because a RUN is the one attendance
   question a totals object cannot answer: `A 3` says how many, never whether they were the last
   three in a row. It is the same walk those totals come out of (src/attendance.js's walkMeetings),
   which is what keeps the run and the percentage from disagreeing about a `U` or about a student
   added to a roster mid-term. */
import { lastMeetings, attendanceTotals, attendanceHistory, todayISO } from './attendance.js';
import { fullName } from './roster.js';
/* One function, from the file that owns `terms[]`. A term bounds three of the concern rules and
   src/classes.js's own header refuses a second copy of this test in as many words — a term
   carrying `start: "sometime"` is not dated, and deciding that here would be the fifth home for a
   rule about one field. */
import { termIsDated } from './classes.js';
/* THE DAY-STEP, IMPORTED RATHER THAN WRITTEN AGAIN (WO-4.3). src/calendar.js's shiftDays() never
   leaves UTC, so a whole number of days cannot land on a DST seam — the scar its own comment
   carries, and the reason src/log.js takes it rather than doing the arithmetic locally. The
   turnaround rule needs one date and one only: the far edge of its own window. */
/* `daysBetween` arrives with it at WO-4.5, from the same file and for the same reason it lives
   there: src/calendar.js's header forbids a Date object outside its own utcOf(), and the cooldown
   needs to say how many days ago a contact went out. */
import { shiftDays, daysBetween } from './calendar.js';
/* The app's two number formatters, imported rather than re-declared. formatPercent() is how every
   percentage in Planbook is written down — two fixed decimals, because the SIS carries two and this
   number is re-keyed into it by hand (src/scores.js) — and src/detail.js already imports it from
   there for exactly this reason: two formatters that have to agree is the answer this repo keeps
   refusing, and the one that drifts is the one nobody is looking at. formatWeight() is the other
   half of that rule pointed at a different kind of number: a threshold is a figure the TEACHER
   TYPED, like a category's weight, so it prints the way she typed it — "65", "89.5" — rather than
   as "65.00%". Which formatter a number takes is decided by where the number came from. */
/* scoreMark() arrives with it at WO-4.2, and for the reason that file states over it: what a rule
   wants is never the raw cell, and a third module resolving `{ v: null, flag: 'late' }` for itself
   is the copy that eventually disagrees about a late blank. The run-of-low-scores rule is the only
   place in this file that reads one cell at a time. */
import { formatPercent, scoreMark } from './scores.js';
/* WO-4.4's half of the behavior rule, and it is ONE FUNCTION returning ONE NUMBER — see the rule
   itself for why the entries themselves never cross this import. src/log.js is a model with no DOM
   in it and it imports nothing from here, so the arrow runs one way exactly as it does for
   src/grade-engine.js above. */
/* THREE MORE JOINED AT WO-4.5, and every one of them hands back a date. `lastContactAbout` is the
   cooldown's whole reading — when this student was last written to about THIS rule, plus the
   `audience` the suppressed row names — and it refuses an empty rule id, which is this work order's
   trap made structural in the file that owns the record. `lastContactDate` and `lastEntryDate` are
   the quiet middle's two: has anybody been written to about this student this term, and when was
   anything last written down about her at all. No subject and no body crosses this import, exactly
   as no entry crosses it for the behavior rule. */
import { behaviorCountSince, lastContactAbout, lastContactDate, lastEntryDate } from './log.js';
import { formatWeight } from './categories.js';

/* ────────────────────────────── the thresholds ──────────────────────────────

   docs/data-model.md § Signal thresholds, in the order it tabulates them, one entry per RULE and
   one field per number. The editor renders this list directly, so the panel and the document
   cannot come to hold different sets of settings.

   NAMING, because WO-4.2 through WO-4.5 read these keys and a rename later is a document
   migration nobody wants:

     · A COUNT of things is `…Count` or `…Run` — `Run` when the things have to be consecutive.
     · A WINDOW NAMES ITS UNIT, always: `…Meetings`, `…Assignments`, `…Days`. That is WO-4.1's
       fifth acceptance line made greppable. "4 absences in the last 20 days" is nonsense over a
       rotating schedule (docs/data-model.md), so no window over a class's own history is measured
       in days, and any key that says `Days` is measuring ELAPSED TIME SINCE SOMETHING WAS WRITTEN
       DOWN rather than sampling class history. There are exactly three, all three specified in
       days by the data model, and each says why at its own row.
     · A COMPARISON says which way it points — `…Below`, `…AtLeast`.

   THE DEFAULTS ARE NOT WRITTEN INTO THE DOCUMENT, and src/store.js's `signals: {}` comment settles
   that: every document written before a threshold existed is missing it, so a missing key HAS to
   read as its default anyway. Given that, seeding the keys would only add a second place for the
   numbers to live. It is also what makes the reset in the editor a DELETE rather than a write —
   see resetThresholds() there.
*/
export const SIGNAL_SETTINGS = [
  {
    direction: 'concern',
    label: 'Concern',
    rules: [
      { ruleId: 'grade-below', text: 'Weighted grade below',
        fields: [{ key: 'gradeBelow', def: 65, unit: '%',
          aria: 'Concern: the weighted grade a student is flagged below, as a percentage' }] },
      { ruleId: 'grade-fell', text: 'Grade fell over recent work',
        fields: [{ key: 'gradeFellPoints', def: 10, unit: 'points',
          aria: 'Concern: how many points a grade must fall by to be flagged' },
        { key: 'gradeFellAssignments', def: 4, before: 'across the last', unit: 'assignments',
          aria: 'Concern: how many recent assignments a fall in grade is measured across' }] },
      { ruleId: 'low-score-run', text: 'A run of low scores',
        fields: [{ key: 'lowScoreRun', def: 3, unit: 'in a row',
          aria: 'Concern: how many low scores in a row are flagged' },
        { key: 'lowScoreBelow', def: 60, before: 'each under', unit: '%',
          aria: 'Concern: the score each of those must be under, as a percentage' }] },
      { ruleId: 'missing-count', text: 'Missing assignments',
        fields: [{ key: 'missingCount', def: 3, unit: 'or more',
          aria: 'Concern: how many missing assignments are flagged' }] },
      { ruleId: 'attendance-below', text: 'Attendance for the term below',
        fields: [{ key: 'attendanceBelow', def: 90, unit: '%',
          aria: 'Concern: the term attendance rate a student is flagged below, as a percentage' }] },
      { ruleId: 'absence-window', text: 'Absences in a recent window',
        fields: [{ key: 'absenceCount', def: 4, unit: 'absences',
          aria: 'Concern: how many absences inside a window are flagged' },
        { key: 'absenceWindowMeetings', def: 20, before: 'within the last',
          unit: 'recorded meetings',
          aria: 'Concern: how many recorded meetings that window of absences covers' }] },
      { ruleId: 'absence-run', text: 'Absences one after another',
        fields: [{ key: 'absenceRun', def: 3, unit: 'meetings in a row',
          aria: 'Concern: how many absences in a row are flagged, counted in recorded meetings' }] },
      { ruleId: 'tardy-count', text: 'Tardies',
        fields: [{ key: 'tardyCount', def: 5, unit: 'or more',
          aria: 'Concern: how many tardies are flagged' }] },
      /* The one `…Days` in this table, and the reason it is days: a behavior entry is a thing the
         teacher WROTE DOWN at a moment, and "two of them inside a month" is a statement about how
         close together they were, not about how many times the class met between them. WO-4.4 owns
         the log and WO-4.2 the rule. */
      { ruleId: 'behavior-window', text: 'Behavior log entries',
        fields: [{ key: 'behaviorCount', def: 2, unit: 'entries',
          aria: 'Concern: how many behavior log entries are flagged' },
        { key: 'behaviorWindowDays', def: 30, before: 'within', unit: 'days',
          aria: 'Concern: how many days that window of behavior entries covers' }] },
    ],
  },
  {
    direction: 'praise',
    label: 'Praise',
    rules: [
      { ruleId: 'grade-rose', text: 'Grade rose over recent work',
        fields: [{ key: 'gradeRosePoints', def: 8, unit: 'points',
          aria: 'Praise: how many points a grade must rise by to be praised' },
        { key: 'gradeRoseAssignments', def: 4, before: 'across the last', unit: 'assignments',
          aria: 'Praise: how many recent assignments a rise in grade is measured across' }] },
      { ruleId: 'high-score-run', text: 'A run of strong scores',
        fields: [{ key: 'highScoreRun', def: 3, unit: 'in a row',
          aria: 'Praise: how many strong scores in a row are praised' },
        { key: 'highScoreAtLeast', def: 90, before: 'each at or above', unit: '%',
          aria: 'Praise: the score each of those must reach, as a percentage' }] },
      /* Days for the same reason the behavior window is: a turnaround is measured from the day the
         student was last on the concern list, which is a date in the record rather than a meeting. */
      { ruleId: 'turnaround', text: 'Came off the concern list',
        fields: [{ key: 'turnaroundDays', def: 21, before: 'within', unit: 'days',
          aria: 'Praise: how many days ago a student can have left the concern list and still '
            + 'count as a turnaround' }] },
      { ruleId: 'no-missing', text: 'Nothing missing over recent work',
        fields: [{ key: 'noMissingAssignments', def: 8, before: 'across the last',
          unit: 'assignments',
          aria: 'Praise: how many recent assignments must have nothing missing in them' }] },
      { ruleId: 'attendance-window', text: 'Attendance over a recent window at or above',
        fields: [{ key: 'attendanceAtLeast', def: 100, unit: '%',
          aria: 'Praise: the attendance rate over a recent window that is praised, as a percentage' },
        { key: 'attendanceWindowMeetings', def: 20, before: 'over the last',
          unit: 'recorded meetings',
          aria: 'Praise: how many recorded meetings that attendance window covers' }] },
    ],
  },
  {
    direction: 'cooldown',
    label: 'Cooldown',
    rules: [
      /* The third `…Days`, and the plainest of the three: it is time elapsed since an email left,
         read off the outreach log (docs/data-model.md § Cooldown). WO-4.5 owns the suppression;
         the number lives here so that it travels and syncs with the rest of them. */
      { ruleId: 'cooldown', text: 'Contacted about the same signal within',
        fields: [{ key: 'cooldownDays', def: 14, unit: 'days',
          aria: 'Cooldown: how many days a student is left off a signal after being contacted '
            + 'about it' }] },
    ],
  },
];

/* Every field in the tables above, flattened — the editor walks the groups, everything else wants
   one list. Built once at load; nothing mutates it. */
const FIELDS = [];
SIGNAL_SETTINGS.forEach((group) => group.rules.forEach((rule) => {
  rule.fields.forEach((field) => FIELDS.push(Object.assign({ direction: group.direction,
    ruleId: rule.ruleId }, field)));
}));

export const THRESHOLD_KEYS = FIELDS.map((f) => f.key);

const DEFAULTS = {};
FIELDS.forEach((f) => { DEFAULTS[f.key] = f.def; });

/* The documented default for a key, and `undefined` for a key this build has never heard of — not
   0. A caller asking for a name nobody declared has a bug, and answering it with a number would
   turn that bug into a threshold that quietly fires for everybody. */
export function defaultThreshold(key) {
  return Object.prototype.hasOwnProperty.call(DEFAULTS, key) ? DEFAULTS[key] : undefined;
}

function signalsIn(doc) {
  return doc && doc.signals && typeof doc.signals === 'object' && !Array.isArray(doc.signals)
    ? doc.signals : {};
}

/*
  ONE THRESHOLD, RESOLVED. The document's value if it holds a usable number there, and the
  documented default otherwise — which covers all three ways a key can be absent: a document
  written before the threshold existed, a document a teacher has never opened this panel on, and a
  restored file that was hand-edited into holding a string.

  There is no repair and no write-back. A document that says `"sixty"` reads as 65 here and stays
  `"sixty"` on disk, exactly as it was, until the teacher types a number into the field — the same
  refusal src/categories.js states about a weight: a value that silently isn't what somebody typed
  is worse than one that is visibly wrong.
*/
export function thresholdOf(doc, key) {
  const block = signalsIn(doc);
  if (Object.prototype.hasOwnProperty.call(block, key)) {
    const n = Number(block[key]);
    if (Number.isFinite(n)) return n;
  }
  return defaultThreshold(key);
}

/* Every threshold resolved at once, for a caller that wants the whole set — the editor's standing
   line, and the evaluator's context below. */
export function thresholdsOf(doc) {
  const out = {};
  THRESHOLD_KEYS.forEach((key) => { out[key] = thresholdOf(doc, key); });
  return out;
}

/* Which thresholds this document does not agree with the defaults about. Compared BY VALUE rather
   than by whether the key is present: a teacher who typed 65 into the box that already said 65 has
   changed nothing, and a standing line that told her she had would be wrong about the only thing
   it says. */
export function changedThresholds(doc) {
  return THRESHOLD_KEYS.filter((key) => thresholdOf(doc, key) !== defaultThreshold(key));
}

/* ────────────────────────────── saying a number ──────────────────────────────

   Two formatters, and which one a number takes is decided by where the number came from — see the
   import block at the head of this file. Computed percentages take src/scores.js's formatPercent();
   thresholds and plain counts take src/categories.js's formatWeight(), which is how a number a
   teacher typed is written down.
*/

/* Whether a printed figure still satisfies the comparison the sentence is making. */
function satisfies(shown, line, sense) {
  return sense === 'below' ? shown < line : shown >= line;
}

/*
  A COMPUTED PERCENTAGE IN A SENTENCE THAT ALSO NAMES THE LINE IT CROSSED, and the one place the
  app's own formatter is not enough.

  A grade of 64.9985% against a 65% line prints as "65.00%" at two decimals, and the sentence would
  then read "65.00%, below 65%" — a comparison the reader can see is false, about a hit that is
  perfectly correct. That is precisely the "rounded lie" WO-4.1's fourth acceptance line forbids.

  So the ordinary case is formatPercent() and nothing else, and when the printed figure stops
  satisfying the comparison, MORE decimals are printed rather than fewer. The sentence is therefore
  never less precise than the grade on the score grid, and the comparison itself is always made
  against the unrounded number, which is what `numbers` carries.
*/
function sayFigure(value, line, sense, isPercent) {
  const n = Number(value);
  const mark = isPercent ? '%' : '';
  if (satisfies(Number(n.toFixed(2)), line, sense)) {
    return isPercent ? formatPercent(n) : n.toFixed(2);
  }
  for (let places = 3; places <= 6; places++) {
    const shown = n.toFixed(places);
    if (satisfies(Number(shown), line, sense)) return shown + mark;
  }
  /* Unreachable with a finite number and a finite line — six decimals is far past where a
     percentage can hide — and it prints the value whole rather than throwing, because a sentence
     is not the place to discover a defect. */
  return String(n) + mark;
}

function sayPercent(value, line, sense) { return sayFigure(value, line, sense, true); }

/*
  THE SAME ESCALATION ON A FIGURE THAT IS NOT A PERCENTAGE (WO-4.2), and the reason it does not go
  through formatPercent() is the arithmetic rather than the punctuation. A grade that moved from
  81.40% to 69.20% fell by 12.20 PERCENTAGE POINTS; writing that "12.20%" would say it fell by a
  twelfth of itself, which is a different and smaller number. So the two decimals are the same two
  — a computed figure is written the way every other computed figure in this app is — and the mark
  is the only thing that differs.
*/
function sayPoints(value, line, sense) { return sayFigure(value, line, sense, false); }

/* A threshold, or a count of things, as the teacher would write it: 65, 89.5, 20. */
function sayNumber(value) { return formatWeight(Number(value)); }

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

/* ────────────────────────────── the rules ──────────────────────────────

   FOURTEEN SINCE WO-4.3 — the nine concern rules the data model tabulates and all five praise
   rules, which is every rule Phase 4 specifies. The praise four landed 2026-08-24 beside the one
   WO-4.1 had registered to prove the contract, and none of them changed the shape below.

   A THIRD FUNCTION ARRIVED WITH THE EIGHT, and it is the only change to the shape this file's
   header describes:

       figure(numbers)  →  { value, text, unit, tone }

   The number a ROW draws big, chosen by the rule out of the numbers it published and nothing else
   — the same fence `say` stands behind, for the same reason. It exists because the drawing puts
   the delta in the strong position on every row and the current grade nowhere on it
   (design/mockups/signals.html, plans/ROADMAP.md Phase 4: rank by change, not by level), and the
   alternative was a list screen holding a `switch` over rule ids to decide what to draw — which is
   a second copy of the arithmetic, free to disagree with the sentence beside it.

   IT IS STILL NOT A RANK. `value` is one of the published numbers, signed the way the row reads it
   (a fall is negative), and `tone` says whether the figure is a CHANGE or a standing count —
   `down`, `up` or `flat`, which are the three classes design/mockups/proposed-phase4.css draws.
   Nothing here holds a position in a list; severityOrder() below computes that from these on
   demand, so there is no field on a hit that can go stale against the numbers under it.
*/

/*
  CONCERN — the weighted grade is under the line.

  A STUDENT WITH NO GRADED WORK DOES NOT APPEAR HERE, which is WO-4.2's fourth acceptance line and
  is the whole of the `percentage === null` arm below: the grade engine answers null for a student
  with nothing graded and for a class whose weights do not add up (src/grade-engine.js), and
  "there is no grade yet" is not a low grade. Treating null as 0 would put every student in a
  freshly set-up class on the concern list on the day the teacher opened it, which is how a list
  stops being read.
*/
const gradeBelow = {
  id: 'grade-below',
  direction: 'concern',
  keys: ['gradeBelow'],
  measure(ctx, studentId) {
    const line = ctx.t.gradeBelow;
    const grade = ctx.grade(studentId);
    if (!grade || grade.percentage === null) return null;
    if (!(grade.percentage < line)) return null;
    return { percentage: grade.percentage, below: line };
  },
  say(numbers, who) {
    return 'In ' + who.className + ', ' + who.name + '’s grade is '
      + sayPercent(numbers.percentage, numbers.below, 'below') + ', below '
      + sayNumber(numbers.below) + '%.';
  },
  /* A LEVEL, WHICH IS WHY IT IS `flat` AND WHY IT SORTS LAST OF THE NINE — see SEVERITY below.
     The figure is drawn because an empty slot reads as a missing value rather than an absent one
     (design/mockups/proposed-phase4.css), not because a level deserves the strong position. */
  figure(numbers) {
    return { value: numbers.percentage, text: formatPercent(numbers.percentage),
      unit: 'grade', tone: 'flat' };
  },
};

/*
  CONCERN — the weighted grade fell across the last N assignments.

  IT MEASURES THE WEIGHTED GRADE AT BOTH ENDS OF THE WINDOW AND NEVER THE RAW SCORES, which is
  WO-4.2's second acceptance line and the whole reason this rule is more than a subtraction. Four
  scores of 50% inside a 10%-weighted category are not a fall; one of them inside a 60% category is.
  So `before` is weightedClassGrade() over a document with the window's assignments taken OUT of
  `assignments[]` — the grade as it stood before that work existed, computed by the engine that
  computes every other grade in this app, with its category redistribution and its empty-category
  rule intact — and `after` is the grade the score grid is showing right now.

  WHICH ASSIGNMENTS ARE "THE LAST N", and this is the decision this rule had to make.

  It is the last N of the class-and-term's assignments IN THE ORDER THE DOCUMENT HOLDS THEM, kept
  to the ones that COUNT TOWARD THIS STUDENT'S GRADE — a score, or a cell the teacher marked
  missing. Three things follow, and each is a refusal of something easier:

    NOT BY DUE DATE. src/assignments.js decision 4 is that nothing on that screen is sorted and the
    teacher's own ↑ ↓ are the only thing that moves a row, because "sorting by due date behind her
    back would be a second opinion about an order she can see and rearrange". A window taken in a
    different order from the list it is a window over is that second opinion, one screen along. It
    would also put the clock inside a grade signal, which CLAUDE.md allows in exactly one place and
    this is not it.

    NOT THE LAST N ROWS REGARDLESS. A window of four whose last three cells are blank is a window
    over one piece of work, and `before` and `after` would be the same number — so the rule would
    go quiet for the student whose four most recent GRADED pieces are the ones that sank her. Blank
    means ungraded and affects nothing (CLAUDE.md); it does not get to hide a fall either.

    AND EXCUSED WORK IS IN NEITHER END. It is out of the grade in both directions
    (src/grade-engine.js), so it is not a piece of the window and cannot be part of a change.

  A STUDENT WHOSE WHOLE GRADED HISTORY IS THE WINDOW HAS NO `before` AND DOES NOT FIRE. There is
  nothing to have fallen from, and answering "fell from 0%" would put every student in a new class
  on this list in the week the first four assignments were graded.
*/
const gradeFell = {
  id: 'grade-fell',
  direction: 'concern',
  keys: ['gradeFellPoints', 'gradeFellAssignments'],
  measure(ctx, studentId) {
    const line = ctx.t.gradeFellPoints;
    const asked = Math.max(0, Math.floor(Number(ctx.t.gradeFellAssignments) || 0));
    if (!asked) return null;
    const window = ctx.countedWork(studentId).slice(-asked);
    if (!window.length) return null;
    const after = ctx.grade(studentId);
    const before = ctx.gradeWithout(studentId, window.length);
    if (!after || after.percentage === null || !before || before.percentage === null) return null;
    const fell = before.percentage - after.percentage;
    if (!(fell >= line)) return null;
    return { fell: fell, points: line, before: before.percentage, after: after.percentage,
      assignments: window.length, asked: asked };
  },
  say(numbers, who) {
    return 'In ' + who.className + ', ' + who.name + '’s grade fell '
      + sayPoints(numbers.fell, numbers.points, 'atLeast') + ' points across the last '
      + plural(numbers.assignments, 'assignment', 'assignments') + ', from '
      + formatPercent(numbers.before) + ' to ' + formatPercent(numbers.after)
      + ' — a fall of ' + sayNumber(numbers.points) + ' or more.';
  },
  /* THE ONE CONCERN RULE WITH A REAL DELTA, and the reason the drawing's rows lead with a signed
     number. Negative, because the row draws what happened rather than the size of it. */
  figure(numbers) {
    return { value: -numbers.fell, text: '−' + Number(numbers.fell).toFixed(2),
      unit: 'points', tone: 'down' };
  },
};

/*
  CONCERN — N scores in a row under N%.

  THE RUN IS THE ONE ENDING AT THE MOST RECENT SCORE, not the longest run anywhere in the term. A
  student who had three bad weeks in September and has been fine since is not a student to write
  home about in November, and a rule that fired on her forever would be the thing that stops a
  teacher reading this list. So the walk starts at the newest score and stops at the first one that
  is not under the line.

  WHAT IS A SCORE HERE: a cell the teacher put a NUMBER in, on a piece of work worth points. Three
  exclusions, each of which would otherwise break or pad a run:

    A BLANK IS SKIPPED AND DOES NOT BREAK THE RUN. Blank means ungraded (CLAUDE.md) — it is the
    absence of a score, not a good one, and letting it end the run would make "three in a row"
    depend on which columns happen to be filled in this week.

    A `missing` IS SKIPPED TOO, and this is the arguable one. It is a zero in the grade, so reading
    it as a 0% score is defensible — and it would then count twice, once here and once on the
    missing-work rule two below, putting one student on the list with two rules that are the same
    fact. The missing rule is the one that owns that fact; this rule reports the numbers a teacher
    actually wrote down.

    ZERO-POINT WORK IS NOT A PERCENTAGE. Extra credit is a scored assignment worth 0
    (docs/data-model.md § Extra credit), and 5 out of 0 has no percentage to be under a line.
*/
const lowScoreRun = {
  id: 'low-score-run',
  direction: 'concern',
  keys: ['lowScoreRun', 'lowScoreBelow'],
  measure(ctx, studentId) {
    const need = ctx.t.lowScoreRun;
    const under = ctx.t.lowScoreBelow;
    const scores = ctx.scorePercents(studentId);
    const run = [];
    for (let i = scores.length - 1; i >= 0; i--) {
      if (!(scores[i] < under)) break;
      run.unshift(scores[i]);
    }
    if (!run.length || !(run.length >= need)) return null;
    return { run: run.length, need: need, under: under, scores: run,
      lowest: Math.min.apply(null, run) };
  },
  say(numbers, who) {
    const list = numbers.scores.map((p) => sayPercent(p, numbers.under, 'below'));
    const said = list.length > 1
      ? list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1]
      : list[0];
    return 'In ' + who.className + ', ' + who.name + ' has '
      + plural(numbers.run, 'score', 'scores') + ' in a row under ' + sayNumber(numbers.under)
      + '% — ' + said + ' — ' + sayNumber(numbers.need) + ' or more.';
  },
  figure(numbers) {
    return { value: numbers.run, text: String(numbers.run), unit: 'in a row', tone: 'flat' };
  },
};

/*
  CONCERN — N pieces of work marked missing.

  `missing` IS THE TEACHER'S MARK AND IS NEVER INFERRED FROM A DATE (CLAUDE.md). Nothing in this
  rule reads a due date, and there is no clock within reach of it: the count comes off
  src/grade-engine.js's openWork(), which is the same list of rows the grade already charged this
  student for at full points. src/past-due.js is the one place in the app allowed to ASK about a
  date, it writes only what the teacher accepts, and by the time a cell reaches here it is a
  decision she made.
*/
const missingCount = {
  id: 'missing-count',
  direction: 'concern',
  keys: ['missingCount'],
  measure(ctx, studentId) {
    const need = ctx.t.missingCount;
    const missing = ctx.missingWork(studentId);
    if (!missing || !(missing >= need)) return null;
    return { missing: missing, need: need };
  },
  say(numbers, who) {
    return 'In ' + who.className + ', ' + who.name + ' has '
      + plural(numbers.missing, 'assignment', 'assignments') + ' marked missing — '
      + sayNumber(numbers.need) + ' or more.';
  },
  figure(numbers) {
    return { value: numbers.missing, text: String(numbers.missing), unit: 'missing',
      tone: 'flat' };
  },
};

/*
  CONCERN — attendance for the term is under the line.

  THE TERM IS THE RANGE, AND A CLASS WITH NO DATED TERM IS UNBOUNDED. src/classes.js's
  termIsDated() decides which, because that file owns `terms[]` and a second shape test on the same
  field is the copy its header refuses. An undated term reads every recorded meeting of the class,
  which is the same fallback the printed attendance record takes.

  IT IS THE SAME PERCENTAGE THE REGISTRY DRAWS — Roll Call!'s `(P+T+E+D)/(P+T+A+E+D)`, out of
  src/attendance.js's own walk — so an excused absence does not damage the rate here either. The
  owner reads both apps' numbers this year and they have to agree (docs/data-model.md).
*/
const attendanceBelow = {
  id: 'attendance-below',
  direction: 'concern',
  keys: ['attendanceBelow'],
  measure(ctx, studentId) {
    const line = ctx.t.attendanceBelow;
    const totals = ctx.termTotals(studentId);
    if (!totals || totals.percent === null) return null;
    if (!(totals.percent < line)) return null;
    return { percent: totals.percent, below: line, meetings: totals.meetings,
      attended: totals.attended };
  },
  say(numbers, who) {
    return 'In ' + who.className + ', ' + who.name + '’s attendance across '
      + plural(numbers.meetings, 'recorded meeting', 'recorded meetings') + ' is '
      + sayPercent(numbers.percent, numbers.below, 'below') + ', below '
      + sayNumber(numbers.below) + '%.';
  },
  figure(numbers) {
    return { value: numbers.percent, text: formatPercent(numbers.percent), unit: 'attendance',
      tone: 'flat' };
  },
};

/*
  CONCERN — N absences inside the last N recorded MEETINGS.

  The window is WO-2.4's lastMeetings() through the evaluator's own `through`, which is the same
  window the praise rule below uses and the same one src/attendance.js hands the registry: a
  dropped class, a snow day and a fortnight the section did not meet are not in it. "4 absences in
  the last 20 days" is nonsense over a rotation that also changes at random
  (plans/rotating-schedule.md), and no key in this file measures a class's own history in days.

  A SHORT WINDOW IS THE MEETINGS THAT EXIST AND IS NEVER PADDED — six meetings into a term the
  sentence says six. `U` counts as an absence here because it counts as one everywhere attendance
  is counted (src/attendance.js), and it is scaffolding a finished class does not contain.
*/
const absenceWindow = {
  id: 'absence-window',
  direction: 'concern',
  keys: ['absenceCount', 'absenceWindowMeetings'],
  measure(ctx, studentId) {
    const need = ctx.t.absenceCount;
    const asked = ctx.t.absenceWindowMeetings;
    const totals = ctx.windowTotals(studentId, asked);
    if (!totals || !totals.meetings) return null;
    if (!(totals.A >= need)) return null;
    return { absences: totals.A, need: need, meetings: totals.meetings, asked: asked };
  },
  say(numbers, who) {
    return 'In ' + who.className + ', ' + who.name + ' has '
      + plural(numbers.absences, 'absence', 'absences') + ' in the last '
      + plural(numbers.meetings, 'recorded meeting', 'recorded meetings') + ' — '
      + sayNumber(numbers.need) + ' or more.';
  },
  figure(numbers) {
    return { value: numbers.absences, text: String(numbers.absences), unit: 'absences',
      tone: 'flat' };
  },
};

/*
  CONCERN — N absences one after another, and this work order's named trap.

  CONSECUTIVE MEANS CONSECUTIVE MEETINGS OF THIS CLASS. Three absences across three weeks of a
  twice-weekly section is still three in a row, and a run counted in DAYS would call that a
  fortnight of nothing much. The sequence this walks is src/attendance.js's own recorded meetings —
  `stateOf() === TAKEN` — so the two states that are not a meeting are not in the list at all:

    A DROPPED DAY IS NOT IN IT, so it cannot break a run. The class did not meet; the student was
    not absent from it.
    A DAY NOBODY TOOK IS NOT IN IT EITHER, and that is the more dangerous of the two — a forgotten
    Tuesday would otherwise read as a day the student turned up and end a run that is still going.

  Skipping them rather than breaking on them is WO-4.2's third acceptance line, and it is true here
  by construction rather than by a filter of this rule's own: there is nothing to skip, because
  meetingDates() never offered those days to anybody.

  THE RUN IS THE ONE ENDING AT THE MOST RECENT MEETING, for the reason the low-score run gives.
  Bounded by the term, like the two rules above it, so that the list a teacher reads for Quarter 2
  is about Quarter 2.
*/
const absenceRun = {
  id: 'absence-run',
  direction: 'concern',
  keys: ['absenceRun'],
  measure(ctx, studentId) {
    const need = ctx.t.absenceRun;
    const codes = ctx.termMarks(studentId);
    let run = 0;
    for (let i = codes.length - 1; i >= 0; i--) {
      if (codes[i] !== 'A') break;
      run += 1;
    }
    if (!run || !(run >= need)) return null;
    return { run: run, need: need, meetings: codes.length };
  },
  say(numbers, who) {
    return 'In ' + who.className + ', ' + who.name + ' has been absent for the last '
      + plural(numbers.run, 'recorded meeting', 'recorded meetings') + ' in a row — '
      + sayNumber(numbers.need) + ' or more.';
  },
  figure(numbers) {
    return { value: numbers.run, text: String(numbers.run), unit: 'in a row', tone: 'flat' };
  },
};

/*
  CONCERN — N tardies.

  Counted over the term, out of the same totals the attendance rule reads, so the figure here and
  the figure on the registry are one number. A tardy is a mark the teacher made; nothing in this
  file has ever seen the time on it, and nothing should — `at` is the cell's own detail and belongs
  to the day (docs/data-model.md).
*/
const tardyCount = {
  id: 'tardy-count',
  direction: 'concern',
  keys: ['tardyCount'],
  measure(ctx, studentId) {
    const need = ctx.t.tardyCount;
    const totals = ctx.termTotals(studentId);
    if (!totals || !(totals.T >= need)) return null;
    return { tardies: totals.T, need: need, meetings: totals.meetings };
  },
  say(numbers, who) {
    return 'In ' + who.className + ', ' + who.name + ' has '
      + plural(numbers.tardies, 'tardy', 'tardies') + ' across '
      + plural(numbers.meetings, 'recorded meeting', 'recorded meetings') + ' — '
      + sayNumber(numbers.need) + ' or more.';
  },
  figure(numbers) {
    return { value: numbers.tardies, text: String(numbers.tardies), unit: 'tardies',
      tone: 'flat' };
  },
};

/*
  CONCERN — N behavior log entries inside N days, AND IT IS INERT.

  WO-4.2's last acceptance line: the behavior rule is inert until WO-4.4 exists, and says so rather
  than erroring. It is registered, it is evaluated on every pass like the other nine, and it
  returns nothing — there is no throw here, no missing-collection branch for a caller to trip over,
  and no half-built reader waiting for data.

  WHY IT IS NOT SIMPLY WRITTEN AND LEFT TO COUNT ZERO. `log` exists in the document
  (docs/data-model.md) and an entry of `kind: "behavior"` is a shape this rule could count today —
  but nothing in the app writes one, so the counting would be code no run of anything has ever
  exercised, sitting on the list looking live. Worse, it would be silently indistinguishable from a
  rule that works: a teacher who sees eight rules fire and never this one cannot tell "nobody
  qualified" from "this one is not built". So the fact is declared instead, `inertRules()` hands it
  to the screen, and the list says in words that this rule is not running yet.

  WHAT WO-4.4 DID TO THIS, 2026-08-24. It wrote measure(), left say() exactly as it stood, and
  deleted the `inert` line — one rule, in one place, with the threshold keys already named above
  and already editable, and inertRules() now returns an empty list so the notice on the concern
  screen disappeared of its own accord rather than having to be found. The `…Days` window is the
  right unit here and SIGNAL_SETTINGS says why at its own row: a behavior entry is a thing the
  teacher wrote down at a moment, and "two of them inside a month" is a statement about how close
  together they were rather than about how often the class met.

  WHAT IT COUNTS, AND THE THREE THINGS IT DOES NOT SEE. src/log.js's behaviorCountSince() hands back
  a NUMBER — not the entries — and that is this file's own contract rather than a nicety: a rule is
  handed its own measured numbers and nothing else, so a rule holding the entries could put a
  teacher's own words about a child into a sentence Phase 5 drafts into an email
  (docs/data-model.md § Outreach templates). It counts entries of kind `behavior` only — a note to
  self is a reminder rather than an incident, and counting one would make a teacher's memory a
  concern signal. It never asks whether presentation mode is on: the mode decides what a SCREEN may
  draw, and a rule that changed its arithmetic when a projector was plugged in would make the whole
  list disagree with itself twice a day.

  IT COUNTS ACROSS CLASSES BECAUSE THE RECORD DOES. A log entry carries a `studentId` and no
  `classId` (docs/data-model.md), so a student in two of the teacher's five sections trips this rule
  in both. That is the honest reading of a record about a child rather than about a period, and the
  alternative — inferring a class from which roster the entry was written on — would be a join on
  something the document does not store.
*/
const behaviorWindow = {
  id: 'behavior-window',
  direction: 'concern',
  keys: ['behaviorCount', 'behaviorWindowDays'],
  measure(ctx, studentId) {
    const need = ctx.t.behaviorCount;
    const days = ctx.t.behaviorWindowDays;
    const entries = behaviorCountSince(ctx.doc, studentId, ctx.through, days);
    if (!(entries >= need) || !entries) return null;
    return { entries: entries, days: days, need: need };
  },
  say(numbers, who) {
    return 'In ' + who.className + ', ' + who.name + ' has '
      + plural(numbers.entries, 'behavior note', 'behavior notes') + ' in the last '
      + plural(numbers.days, 'day', 'days') + ' — ' + sayNumber(numbers.need) + ' or more.';
  },
  figure(numbers) {
    return { value: numbers.entries, text: String(numbers.entries), unit: 'noted', tone: 'flat' };
  },
};

/* ────────────────────────────── the four praise rules (WO-4.3) ──────────────────────────────

   THE PHASE'S WHOLE ARGUMENT IS THAT ONLY ONE OF THEM CAN LEAD A LIST. plans/ROADMAP.md Phase 4
   and docs/data-model.md § Praise both say it: rank by DELTA, not by level, because "top of the
   class" surfaces the same four students every week and is worth nothing. Of the five praise rules
   the data model tabulates, exactly TWO measure a change — the grade that rose, and the concern
   flags that went away — and the other three measure a level or a count. That is not a defect in
   the table; it is why PRAISE_RANK below exists and why a run of 90s sorts last of all five.
*/

/*
  PRAISE — the weighted grade rose across the last N assignments, and it is `grade-fell` read the
  other way up.

  DELIBERATELY THE SAME ARITHMETIC, NOT A SECOND OPINION ABOUT IT. Same window
  (ctx.countedWork()), same `before` (ctx.gradeWithout() — the weighted grade as it stood before
  that work existed, with the category redistribution intact), same `after` (the grade the score
  grid is showing). Everything the concern rule's own comment argues about which assignments are
  "the last N" — not by due date, not the last N rows regardless, excused work in neither end —
  holds here word for word and is not repeated: a second reading of the same question is the second
  answer this file keeps refusing.

  THIS IS THE RULE THE ACCEPTANCE LINE IS ABOUT. A B− student who came up 14 points outranks an A
  student who came up 6, and an A student who came up nothing at all is not on this rule's list
  however high she is sitting — because a rise of zero is not a rise. That is what "a rule that can
  only ever fire for high achievers is the wrong rule" looks like when it is the arithmetic rather
  than the intention.

  A STUDENT WHOSE WHOLE GRADED HISTORY IS THE WINDOW HAS NO `before` AND DOES NOT FIRE, for the
  concern rule's reason inverted: answering "rose from 0%" would praise every student in a new class
  in the week the first four assignments were graded, which is the fastest way to teach a teacher
  that this column means nothing.
*/
const gradeRose = {
  id: 'grade-rose',
  direction: 'praise',
  keys: ['gradeRosePoints', 'gradeRoseAssignments'],
  measure(ctx, studentId) {
    const line = ctx.t.gradeRosePoints;
    const asked = Math.max(0, Math.floor(Number(ctx.t.gradeRoseAssignments) || 0));
    if (!asked) return null;
    const window = ctx.countedWork(studentId).slice(-asked);
    if (!window.length) return null;
    const after = ctx.grade(studentId);
    const before = ctx.gradeWithout(studentId, window.length);
    if (!after || after.percentage === null || !before || before.percentage === null) return null;
    const rose = after.percentage - before.percentage;
    if (!(rose >= line)) return null;
    return { rose: rose, points: line, before: before.percentage, after: after.percentage,
      assignments: window.length, asked: asked };
  },
  say(numbers, who) {
    return 'In ' + who.className + ', ' + who.name + '’s grade rose '
      + sayPoints(numbers.rose, numbers.points, 'atLeast') + ' points across the last '
      + plural(numbers.assignments, 'assignment', 'assignments') + ', from '
      + formatPercent(numbers.before) + ' to ' + formatPercent(numbers.after)
      + ' — a rise of ' + sayNumber(numbers.points) + ' or more.';
  },
  /* THE ONE PRAISE RULE WITH A DELTA IN POINTS, and the number the drawing puts in the strong
     position on every praise row. Signed, because the row draws what happened rather than the size
     of it — and the current grade is nowhere on that row, because a list that ranks by delta and
     draws the level big is arguing with itself (design/mockups/signals.html). */
  figure(numbers) {
    return { value: numbers.rose, text: '+' + Number(numbers.rose).toFixed(2),
      unit: 'points', tone: 'up' };
  },
};

/*
  PRAISE — N scores in a row at or above N%, and it is `low-score-run` read the other way up.

  THE RUN IS THE ONE ENDING AT THE MOST RECENT SCORE, what counts as a score, and why a blank, a
  `missing` and zero-point work are each excluded — all of that is the concern rule's own comment
  and is not written twice here. One asymmetry is worth naming: a `missing` breaks nothing on
  either rule, but on this one skipping it is the generous reading. A student with three 95s and a
  missing between them still fires, and that is deliberate — the missing work is what the concern
  column is for, and a praise rule that also policed it would be the same fact said twice in two
  colours.

  AND IT IS THE RULE THIS PHASE IS SUSPICIOUS OF. "Three scores at or above 90%" can only ever fire
  for a student who is already at the top — it has no before and no after, and it will name the same
  four students every week. It is a deliverable, so it is here; what the phase's argument buys is
  that it sorts LAST of the five (PRAISE_RANK below) and that its figure is `flat`, so it can never
  head a list that has a single climber on it.
*/
const highScoreRun = {
  id: 'high-score-run',
  direction: 'praise',
  keys: ['highScoreRun', 'highScoreAtLeast'],
  measure(ctx, studentId) {
    const need = ctx.t.highScoreRun;
    const atLeast = ctx.t.highScoreAtLeast;
    const scores = ctx.scorePercents(studentId);
    const run = [];
    for (let i = scores.length - 1; i >= 0; i--) {
      if (!(scores[i] >= atLeast)) break;
      run.unshift(scores[i]);
    }
    if (!run.length || !(run.length >= need)) return null;
    return { run: run.length, need: need, atLeast: atLeast, scores: run,
      highest: Math.max.apply(null, run) };
  },
  say(numbers, who) {
    const list = numbers.scores.map((p) => sayPercent(p, numbers.atLeast, 'atLeast'));
    const said = list.length > 1
      ? list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1]
      : list[0];
    return 'In ' + who.className + ', ' + who.name + ' has '
      + plural(numbers.run, 'score', 'scores') + ' in a row at or above '
      + sayNumber(numbers.atLeast) + '% — ' + said + ' — ' + sayNumber(numbers.need) + ' or more.';
  },
  figure(numbers) {
    return { value: numbers.run, text: String(numbers.run), unit: 'in a row', tone: 'flat' };
  },
};

/*
  PRAISE — the concern list was flagging this student and is not any more.

  ── NO STORED BIT, AND THAT IS THE WORK ORDER'S OWN INSTRUCTION ──

  WO-4.3: *"derive it from the log and prior evaluations rather than storing a 'was flagged' bit
  that can go stale."* A bit would go stale in the ordinary way — a threshold moves and every bit
  written under the old number is a lie — and in a worse way this app is specifically shaped against:
  it would be a second truth about who was on the list, sitting beside the rules that decide it, free
  to disagree with them and impossible to check. So there is nothing new in the document for this
  rule, `newYearDocument()` is untouched, and every backup written by every earlier build still
  restores (the scar under CLAUDE.md § "A settings block is created by its first write").

  WHAT "A PRIOR EVALUATION" IS, LITERALLY: this same evaluator, over this same document, with
  `through` set back to the far edge of the window. evaluate() has taken that argument since WO-4.1
  and the whole engine already honours it, so the historical answer is produced by the nine concern
  rules themselves rather than by a reconstruction of what they might have said.

  ── WHAT THE RECORD CAN AND CANNOT PROVE, STATED RATHER THAN GLOSSED ──

  Four of the nine concern rules genuinely move when `through` moves, because the facts under them
  are DATED in the document: absence-run, absence-window and attendance-below read a ledger with a
  date on every row, and behavior-window reads a log with a timestamp on every entry. The other five
  are grade-shaped, and the document dates NOTHING about a score — there is no "when this was
  entered" field and there is deliberately no window taken by due date (src/assignments.js decision
  4, and `grade-fell`'s own comment: sorting by a date behind the teacher's back is a second opinion
  about an order she can see, and it would put the clock inside a grade signal). So those five answer
  the same thing at both ends of the window.

  The consequence is honest and worth knowing: **a turnaround fires on attendance and behavior, and
  a grade recovery on its own will not produce one.** A grade recovery has its own rule — `grade-rose`
  above, which is the better sentence for it anyway. What this rule must never do is claim otherwise,
  and it cannot: it reports how many rules were firing then and that none is firing now.

  ── ONE SAMPLE, AT THE FAR EDGE, AND THE ALTERNATIVE THAT WAS REFUSED ──

  The window is asked ONCE, at `through − turnaroundDays`. Walking every day of the window and
  stopping at the most recent day the student was flagged would let the sentence say *"came off the
  list nine days ago"* the way design/mockups/signals.html's tag does — and it costs twenty-one full
  passes of the concern half, per student, per class, on a screen a teacher opens across five
  classes. That is the defect WO-2.13's meetingDatesCallCount() instrumentation exists because of,
  reached from a different direction. **So the drawing's tag wording is the one thing in it this
  rule does not lift**, and the sentence says what one sample can prove: she was on the list when
  this window opened, and she is not on it now.

  IT UNDER-FIRES RATHER THAN OVER-CLAIMS, deliberately. A student flagged ten days ago and clear
  since is not caught. Praise that is not sent is a missed opportunity; praise that says a student
  came off a list she was never on is the thing that stops a teacher trusting this column.

  ── AND THE "NOT ANY MORE" HALF IS COMPLETE ──

  `concernNow()` is all nine rules, not the four that time-travel. A student who has stopped being
  absent but is now failing is still on the concern list, and praising her for coming off it while
  her name sits in the left-hand column would be the two halves of one screen contradicting each
  other in front of the teacher.
*/
const turnaround = {
  id: 'turnaround',
  direction: 'praise',
  keys: ['turnaroundDays'],
  measure(ctx, studentId) {
    const days = Math.max(0, Math.floor(Number(ctx.t.turnaroundDays) || 0));
    if (!days) return null;
    const then = ctx.concernAsOf(studentId, days);
    /* null is "this pass has no history to consult" — a historical pass itself, which is where the
       recursion would otherwise be. An empty list is a student who was not flagged then. */
    if (!then || !then.length) return null;
    if (ctx.concernNow(studentId).length) return null;
    return { cleared: then.length, days: days };
  },
  /*
    THE RULE IDS ARE NOT PUBLISHED, and that is the contract rather than an omission. `numbers` is
    numbers (this file's header), `who` is names and nothing else, and a sentence built out of
    strings the rule chose is one edit away from a sentence carrying something that should not
    travel — these explanations are drafted into mail through WO-5.1's `{{signals.list}}`. The
    concern column is on the same screen and says which rules they were.
  */
  say(numbers, who) {
    return 'In ' + who.className + ', ' + who.name + ' is off the concern list — '
      + plural(numbers.cleared, 'rule was', 'rules were') + ' flagging them '
      + plural(numbers.days, 'day', 'days') + ' ago and none is today.';
  },
  /* A CHANGE, so it is `up` and it bands above the three rules that measure a level. The figure is
     how many rules went away, which is not comparable with a number of points — PRAISE_RANK is what
     keeps the two from ever being subtracted from one another. */
  figure(numbers) {
    return { value: numbers.cleared, text: String(numbers.cleared), unit: 'cleared', tone: 'up' };
  },
};

/*
  PRAISE — nothing marked missing across the last N pieces of work that count.

  THE WINDOW IS `countedWork`, THE SAME LIST THE FALL AND THE RISE ARE MEASURED OVER, so "the last
  8 assignments" means the same eight rows on every rule in this file. A cell counts when the
  teacher put a number in it or marked it missing; a blank is ungraded and affects nothing, and an
  excused is out of the grade in both directions.

  A BLANK NOT COUNTING IS THE WHOLE OF WHY THIS RULE IS NOT A GIFT. If the window were the last N
  assignments regardless, a student who has handed in nothing at all would have nothing marked
  missing across them and would be praised for it — which is the exact inversion of what a teacher
  means by "no missing work". Read over counted work, that student has an empty window and fires
  nothing.

  THE WINDOW MUST BE FULL, and this is the departure from `grade-fell`, which reports a short window
  honestly and fires on it. A short window here is not honest, it is early: in the first fortnight
  of a term every student in the class has three clean pieces of work, and a rule that fired on
  three at a threshold of eight would fill the praise column with everybody on the day the term
  opened and empty it as the term went on. `missing` is the teacher's own mark and is never inferred
  from a date (CLAUDE.md), so nothing here reads a due date to decide what "yet" means; what it does
  instead is refuse to speak until the work the threshold asks for exists.
*/
const noMissing = {
  id: 'no-missing',
  direction: 'praise',
  keys: ['noMissingAssignments'],
  measure(ctx, studentId) {
    const asked = Math.max(0, Math.floor(Number(ctx.t.noMissingAssignments) || 0));
    if (!asked) return null;
    const rows = ctx.countedRows(studentId);
    if (rows.length < asked) return null;
    const window = rows.slice(-asked);
    if (window.some((row) => row.missing)) return null;
    return { assignments: window.length, asked: asked, missing: 0 };
  },
  say(numbers, who) {
    return 'In ' + who.className + ', ' + who.name + ' has nothing marked missing across the last '
      + plural(numbers.assignments, 'assignment', 'assignments') + ' — '
      + sayNumber(numbers.asked) + ' or more.';
  },
  /* `flat`, because there is no before and no after: a clean window is a standing count. The count
     is drawn anyway, because an empty slot in that column reads as a missing value rather than an
     absent one (design/mockups/proposed-phase4.css). */
  figure(numbers) {
    return { value: numbers.assignments, text: String(numbers.assignments), unit: 'in a row',
      tone: 'flat' };
  },
};

/*
  PRAISE — attendance over the last N recorded meetings is at or above the line.

  WINDOWS COUNT MEETINGS, NOT DAYS, and this is the rule that demonstrates it: the window comes
  from WO-2.4's lastMeetings(), so a dropped class, a snow day and a week the section simply did
  not meet are not in it (docs/data-model.md, plans/rotating-schedule.md).

  A SHORT WINDOW IS THE MEETINGS THAT EXIST AND IS NEVER PADDED. Six meetings into a term there are
  six, not twenty, and the sentence says six — so a partial window cannot overstate itself, and the
  praise half is not silent for the ten weeks it takes a twice-weekly section to reach twenty
  meetings. A run of zero meetings is no window at all and fires nothing: attendanceTotals()
  answers `percent: null` there, which is the honest zero-meeting state rather than 0% or 100%.

  The percentage is Roll Call!'s formula, `(P+T+E+D)/(P+T+A+E+D)`, because src/attendance.js
  computes it and nothing here re-derives it — the owner reads both apps' numbers this year and
  they have to agree.
*/
const attendanceWindow = {
  id: 'attendance-window',
  direction: 'praise',
  keys: ['attendanceAtLeast', 'attendanceWindowMeetings'],
  measure(ctx, studentId) {
    const line = ctx.t.attendanceAtLeast;
    const asked = ctx.t.attendanceWindowMeetings;
    const totals = ctx.windowTotals(studentId, asked);
    if (!totals || totals.percent === null) return null;
    if (!(totals.percent >= line)) return null;
    return { percent: totals.percent, atLeast: line, meetings: totals.meetings,
      attended: totals.attended, asked: asked };
  },
  say(numbers, who) {
    return 'In ' + who.className + ', ' + who.name + '’s attendance across the last '
      + plural(numbers.meetings, 'recorded meeting', 'recorded meetings') + ' is '
      + sayPercent(numbers.percent, numbers.atLeast, 'atLeast') + ', at or above '
      + sayNumber(numbers.atLeast) + '%.';
  },
  /* `flat`, because a rate is a level and this rule has no before to compare an after with.
     WO-4.3 LEFT IT ALONE, and that paragraph is what the decision looked like from the other side:
     the four rules it added include only one with a delta in points, so re-cutting this one into a
     change would have meant inventing a before — "up from what?" over a window that has no earlier
     end — rather than measuring one. What that work order did instead is decide where a level-only
     praise hit SITS, which is PRAISE_RANK below: fourth of five, under both rules that measure a
     change, so a student with perfect attendance and no improvement cannot head this column. */
  figure(numbers) {
    return { value: numbers.percent, text: formatPercent(numbers.percent), unit: 'attendance',
      tone: 'flat' };
  },
};

/* The registry. Written in the order docs/data-model.md tabulates the rules, which is the order
   SIGNAL_SETTINGS declares their thresholds in and the order the editor draws them — three lists
   that have to be read side by side while the numbers are being tuned. It is NOT the order a list
   is drawn in; that is SEVERITY below, and the two are deliberately separate. */
const RULES = [gradeBelow, gradeFell, lowScoreRun, missingCount, attendanceBelow, absenceWindow,
  absenceRun, tardyCount, behaviorWindow,
  /* FOURTEEN SINCE WO-4.3, and the five praise rules are in the order docs/data-model.md § Praise
     tabulates them — which moved `attendance-window` off the end of this array, where it had been
     sitting alone since WO-4.1, to the foot of its own group. It is the same rule and the same
     object; what changed is that it now has four neighbours and the table has an order. */
  gradeRose, highScoreRun, turnaround, noMissing, attendanceWindow];

/* The concern half of the registry, resolved once. The turnaround rule asks "which of these fired"
   twice per student and a filter per call is a filter per student per pass. */
const CONCERN_RULES = RULES.filter((rule) => rule.direction === 'concern');

/*
  ────────────────────────────── HOW URGENT, AND WHY IT LIVES HERE ──────────────────────────────

  THE OWNER'S RULING, 2026-08-20: attendance rules ahead of everything else, and inside each band
  the biggest change leads. A student who is not in the room is the more urgent problem than a
  student whose grade slipped — the second is often a symptom of the first, and it is the one a
  teacher cannot fix later.

  IT IS IN THIS FILE AND NOT ON THE SCREEN because the ruling says so in as many words: *"an
  ordering this work order builds into the list is an ordering WO-6.4's glance panel and Phase 5's
  send flow both inherit."* Three surfaces asking three modules which student matters most is three
  answers, and the two that are wrong are the ones nobody is looking at.

  IT IS STILL NOT A FIELD ON A HIT, which is the line WO-4.1's header draws and this does not
  cross. A `rank` sitting beside `numbers` would be a second copy of a figure the hit already
  carries, free to disagree with it the moment a threshold moves. severityOrder() is a FUNCTION
  over hits that recomputes from the numbers every time it is called, so there is nothing to go
  stale and evaluate() keeps returning the roster order it always did.

  WHAT IS RULED AND WHAT IS THIS FILE'S DEFAULT. The ruling is *attendance leads* — the first three
  entries below, and nothing may go above them without the owner. The rest is the drawing's order
  and is explicitly re-cuttable here without re-opening it (the work order says so): the one rule
  with a real change leads, then the counts, and the LEVEL goes last of all. A grade below a line
  is a fact about where a student has been all term rather than about anything that moved this
  week, and plans/ROADMAP.md Phase 4 is what puts it at the bottom: a list that opened on the level
  surfaces the same four students every week and stops being read.

  A TIE IS BROKEN BY THE BIGGER FIGURE, and that comparison only ever runs between two hits of the
  SAME rule — which is what makes it mean anything. "Is 61% worse than 3 missing?" has no answer
  and is not asked; "is a 20-point fall worse than an 11-point fall" has one.
*/
const SEVERITY = [
  /* the band the ruling names */
  'absence-run', 'absence-window', 'attendance-below',
  /* and everything else: the change first, then the counts, then the level */
  'grade-fell', 'missing-count', 'low-score-run', 'tardy-count', 'behavior-window', 'grade-below',
];

/* Where the ruled band ends. Read by the screen so the concern column can say *attendance first*
   out loud, rather than the screen keeping its own list of which rules are the attendance ones. */
const ATTENDANCE_BAND = 3;

function rankOf(ruleId) {
  const at = SEVERITY.indexOf(ruleId);
  /* A rule nobody put in the table sorts after every rule somebody did, rather than at the top.
     The failure mode of the other choice is a rule added by a later work order silently leading
     the list because its author forgot this array existed. */
  return at < 0 ? SEVERITY.length : at;
}

function ruleById(id) { return RULES.filter((rule) => rule.id === id)[0] || null; }

/*
  THE FIGURE A HIT DRAWS, asked of the rule that produced it. Null for a hit whose rule this build
  does not have — a hit can outlive the pass that made it (WO-5.1 holds several evaluations' worth
  at once), and a restored or foreign one is not worth throwing over.
*/
export function signalFigure(hit) {
  const rule = hit && ruleById(hit.ruleId);
  if (!rule || typeof rule.figure !== 'function' || !hit.numbers) return null;
  return rule.figure(hit.numbers);
}

/*
  THE RULED ORDER, as a new array. Bands first, then the rank inside the band, then the bigger
  figure, and a stable sort underneath all three — so two hits this cannot separate come out in the
  order they went in, which is the roster order evaluate() returned them in.
*/
export function severityOrder(hits) {
  return (Array.isArray(hits) ? hits.slice() : []).sort((a, b) => {
    const ra = rankOf(a.ruleId);
    const rb = rankOf(b.ruleId);
    if (ra !== rb) return ra - rb;
    const fa = signalFigure(a);
    const fb = signalFigure(b);
    const va = fa && Number.isFinite(fa.value) ? Math.abs(fa.value) : -Infinity;
    const vb = fb && Number.isFinite(fb.value) ? Math.abs(fb.value) : -Infinity;
    return vb - va;
  });
}

/* Whether a rule is one of the three the ruling puts first — asked rather than re-listed, for the
   reason the ordering itself is here. */
export function isAttendanceRule(ruleId) { return rankOf(ruleId) < ATTENDANCE_BAND; }

/*
  ────────────────────── BIGGEST CLIMB FIRST, AND WHY IT IS A LIST OF RULES ──────────────────────

  THE PRAISE HALF RANKS BY DELTA — plans/ROADMAP.md Phase 4, docs/data-model.md § Praise, and this
  work order's whole argument. "Top of the class" surfaces the same four students every week and is
  worth nothing; "came up 14 points since October" surfaces a different student every time.

  IT IS BANDED BY RULE FIRST AND BY FIGURE SECOND, which is severityOrder()'s shape above and is
  taken deliberately rather than by habit. A pure sort on the figure would subtract a number of
  RULES CLEARED from a number of POINTS and put whichever happened to be larger on top, and "is a
  14-point climb bigger than two flags going away?" has no answer — the same question the concern
  side refuses to ask about 61% and 3 missing. Inside a band the two figures are the same kind of
  thing and the comparison means something.

  THE ORDER, AND EVERY POSITION IN IT IS AN ARGUMENT:

    grade-rose         the only rule here with a delta in points. It is the sentence that lands at
                       home, it is available to every student in the class, and a B− who came up 14
                       outranks an A who came up 6 — which is the acceptance line, straight out of
                       the banding.
    turnaround         the other rule that measures a change. Second rather than first because its
                       figure counts rules rather than points and because it is derived from one
                       sample at the edge of its window (see the rule): a real climb is the stronger
                       claim, and this one rides above every level.
    no-missing         a count, and the most available of the three that have no delta — turning
                       work in is something a struggling student can do this week.
    attendance-window  a level, and available to anyone who turns up. Trap 2 of this work order in
                       one line: a perfect-attendance student with no improvement sits here, under
                       both rules that measure a change, and cannot head a column that has a single
                       climber in it.
    high-score-run     LAST, and it is the rule this phase is suspicious of. Three scores at or
                       above 90% can only ever fire for a student who is already at the top. It is a
                       deliverable and it is registered; what it does not get is the strong position.

  A rule nobody put in this table sorts after every rule somebody did, for rankOf()'s reason: the
  failure mode of the other choice is a praise rule added later silently leading the column because
  its author did not know this array existed.
*/
const PRAISE_RANK = ['grade-rose', 'turnaround', 'no-missing', 'attendance-window',
  'high-score-run'];

function praiseRankOf(ruleId) {
  const at = PRAISE_RANK.indexOf(ruleId);
  return at < 0 ? PRAISE_RANK.length : at;
}

/*
  THE PRAISE ORDER, as a new array, and a FUNCTION over hits rather than a field on one — the same
  fence severityOrder() stands behind. Nothing below writes a rank onto a hit, so there is no number
  on one that can go stale against the arithmetic beside it.

  It lives here and not on the screen for severityOrder()'s reason, which is the owner's own: WO-6.4's
  glance panel and Phase 5's send flow both inherit "who is most worth writing home about", and three
  surfaces answering that for themselves is three answers.
*/
export function praiseOrder(hits) {
  return (Array.isArray(hits) ? hits.slice() : []).sort((a, b) => {
    const ra = praiseRankOf(a.ruleId);
    const rb = praiseRankOf(b.ruleId);
    if (ra !== rb) return ra - rb;
    const fa = signalFigure(a);
    const fb = signalFigure(b);
    const va = fa && Number.isFinite(fa.value) ? Math.abs(fa.value) : -Infinity;
    const vb = fb && Number.isFinite(fb.value) ? Math.abs(fb.value) : -Infinity;
    return vb - va;
  });
}

/* Which order a hit takes, chosen by its own direction — so a caller holding a mixed list does not
   have to know which table a rule is in. The two orders are separate arrays on purpose: severity is
   the owner's ruling about urgency and this one is about size of change, and a single table would
   have to answer both questions with one number. */
export function orderHits(hits) {
  const all = Array.isArray(hits) ? hits : [];
  return severityOrder(all.filter((h) => h && h.direction !== 'praise'))
    .concat(praiseOrder(all.filter((h) => h && h.direction === 'praise')));
}

/*
  THE RULES THAT ARE REGISTERED AND CANNOT FIRE YET, with the reason each one gives, so a screen
  can say so instead of leaving a teacher to wonder which of "nobody qualified" and "not built" she
  is looking at. Empty the day WO-4.4 lands, and the screen's line disappears with it because it is
  drawn from the length of this.
*/
export function inertRules() {
  return RULES.filter((rule) => rule.inert)
    .map((rule) => ({ id: rule.id, direction: rule.direction, text: ruleText(rule.id),
      why: rule.inert }));
}

/* What a rule is CALLED, read off the settings table rather than written a second time here. The
   editor prints these words beside the fields that tune them, so a chip on the list and the row in
   the panel it sends a teacher to cannot come to say different things. */
export function ruleText(ruleId) {
  let found = '';
  SIGNAL_SETTINGS.forEach((group) => group.rules.forEach((rule) => {
    if (rule.ruleId === ruleId) found = rule.text;
  }));
  return found;
}

/*
  ONE RULE'S THRESHOLDS, IN THE WORDS THE EDITOR PRINTS BESIDE THE FIELDS THAT TUNE THEM — "Grade
  fell over recent work — 10 points, across the last 4 assignments."

  The signal card says the line a student crossed and says it is the TEACHER'S, because an absent
  threshold key IS its default and a card that showed a number without saying it is adjustable
  would be handing her an opinion she cannot argue with. Built out of SIGNAL_SETTINGS rather than
  written on the card, so the sentence on the card and the row in the panel it sends her to cannot
  come to say different things — the same rule ruleText() above states, one field further in.
*/
export function ruleThresholdText(doc, ruleId) {
  const parts = [];
  SIGNAL_SETTINGS.forEach((group) => group.rules.forEach((rule) => {
    if (rule.ruleId !== ruleId) return;
    rule.fields.forEach((field) => {
      parts.push((field.before ? field.before + ' ' : '') + sayNumber(thresholdOf(doc, field.key))
        /* No space before a percent sign and one before every other unit, which is how the app
           writes a percentage everywhere else. */
        + (field.unit === '%' ? '%' : (field.unit ? ' ' + field.unit : '')));
    });
  }));
  return parts.length ? ruleText(ruleId) + ' — ' + parts.join(', ') + '.' : '';
}

/* The registry, as data. A list screen wants to name a rule it is filtering by, and the editor
   wants to know which rules read a threshold it is about to change. A copy rather than the array
   itself: a caller that sorted it would be reordering every evaluation after it. `rank` and
   `inert` arrived at WO-4.2 with the two questions a list asks that this one could not answer. */
export function signalRules() {
  return RULES.map((rule) => ({ id: rule.id, direction: rule.direction, keys: rule.keys.slice(),
    text: ruleText(rule.id),
    /* `rank` IS THE RULE'S POSITION IN ITS OWN DIRECTION'S TABLE (WO-4.3), not one number over
       fourteen rules. A concern rule reads SEVERITY and a praise rule reads PRAISE_RANK, because
       the two tables answer different questions — how urgent, and how big a change — and a chip
       strip that sorted the praise rules by a severity table they are not in would have drawn them
       in registry order and called it a ranking. The only caller groups by direction first. */
    rank: rule.direction === 'praise' ? praiseRankOf(rule.id) : rankOf(rule.id),
    inert: rule.inert || '' }));
}

/* ────────────────────────────── the pass ────────────────────────────── */

function studentsIn(doc) { return doc && Array.isArray(doc.students) ? doc.students : []; }
function rosterOf(cls) { return cls && Array.isArray(cls.roster) ? cls.roster : []; }

/*
  ONE TERM'S RANGE, AND IT IS DEFINED IN EXACTLY ONE PLACE.

  `from` is `''` when the class's term is not dated — which reads as "every recorded meeting of this
  class", exactly as the printed attendance record does (src/attendance.js's classRecord).
  src/classes.js's termIsDated() is the shape test; nothing here repairs or sorts a term's dates,
  which is that file's rule 2.

  THE END IS CLIPPED TO `through`. The evaluator takes that argument so a pass can be run as of a
  date — the harness does exactly this — and a term range that ran past it would count meetings from
  after the moment being asked about. Today it changes nothing, because a meeting in the future is a
  record nobody has written; it is what keeps an as-of pass honest.

  IT IS A FUNCTION SINCE WO-4.5 and was five lines inside makeContext() before it. The quiet middle
  asks the same question — "was this student contacted THIS TERM" — from outside a context, and a
  second copy of a clip against `through` is a second answer about which days a term covers, on two
  halves of one screen.
*/
function termRangeOf(cls, termId, through) {
  const term = (cls && Array.isArray(cls.terms) ? cls.terms : [])
    .filter((t) => t && t.id === termId)[0] || null;
  const dated = termIsDated(term);
  return {
    from: dated ? term.start : '',
    to: dated ? (term.end < through ? term.end : through) : through,
  };
}

/*
  THE CONTEXT, AND WHY IT IS MEMOIZED RATHER THAN A BAG OF ARGUMENTS.

  Fourteen rules over twenty-five students is the shape this ends up in, and every attendance rule
  wants the same window and every grade rule the same weighted grade. Read per rule, that is
  fourteen walks of one class's ledger per student; read here, it is one apiece. WO-2.13's
  meetingDatesCallCount() instrumentation exists because a render that walked the meetings once per
  student was a real defect on the registry, so the engine does the reading and a rule does
  arithmetic on numbers it was handed.

  ONE THING IS DELIBERATELY NOT MEMOIZED AWAY: attendanceTotals() is asked once per student per
  window size, because the walk that produces a student's totals IS per student
  (src/attendance.js's walkMeetings) and a whole-class window reading does not exist to ask for. So
  a pass costs one meetings resolution per window size plus one totals walk per student, and never
  one per rule.

  WO-4.2 IS WHERE THAT CONTRACT EARNED ITS KEEP, and it added three per-student readings and one
  per-pass one. Nine concern rules over twenty-five students would otherwise be nine walks of the
  ledger and nine of the assignment list per student; it is four apiece, and a rule that went to
  the document itself instead of asking here would re-create WO-2.13's defect one screen along:

    termTotals   ONE totals walk per student, over the term's own range.
    termMarks    ONE history walk per student, and the only thing here that is not a total. A run
                 is an order question — `A 3` never says whether the three were the last three —
                 and it comes out of the same walk the totals do, so the run and the percentage
                 cannot disagree about a `U`.
    countedWork  the class's assignments filtered ONCE per pass, then read per student for whose
                 cells count. gradeWithout() rides on it.
    missingWork  openWork() once per student, which is also the only place `missing` is defined.

  `t` is the thresholds resolved once. A rule reads `ctx.t.gradeBelow` rather than calling a
  resolver, so a rule cannot accidentally read a raw key off the document and get `undefined`.
*/
function makeContext(doc, cls, termId, through, historical) {
  const classId = cls && cls.id;
  const grades = new Map();
  const windows = new Map();
  const totals = new Map();
  const termWalks = new Map();
  const termRuns = new Map();
  const counted = new Map();
  const countedIds = new Map();
  const beforeGrades = new Map();
  const percents = new Map();
  const missing = new Map();
  /* WO-4.3's three, and the last of them holds whole CONTEXTS rather than answers — one per window
     length, which in practice is one. See concernAsOf() below. */
  const flaggedNow = new Map();
  const flaggedThen = new Map();
  const pasts = new Map();

  /* THE TERM'S RANGE, RESOLVED ONCE — termRangeOf() below, which is where the reasoning is and
     which the quiet middle reads through as well, so the two cannot come to disagree about which
     days a term covers. */
  const range = termRangeOf(cls, termId, through);
  const termFrom = range.from;
  const termTo = range.to;

  /* Every assignment of this class and term, in the order the document holds them. Once per pass,
     because it is the same list for every student — what differs per student is which of its cells
     count, and that is countedWork() below. */
  const sequence = (doc && Array.isArray(doc.assignments) ? doc.assignments : [])
    .filter((a) => a && a.classId === classId && a.termId === termId);

  return {
    doc: doc,
    cls: cls,
    termId: termId,
    through: through,
    t: thresholdsOf(doc),
    grade(studentId) {
      if (!grades.has(studentId)) {
        grades.set(studentId, weightedClassGrade(doc, cls, termId, studentId));
      }
      return grades.get(studentId);
    },
    /* The last `count` recorded meetings of this class, newest first — WO-2.4's helper, which is
       the meetings-window helper WO-4.1's Deliverables mean. */
    meetings(count) {
      const key = String(count);
      if (!windows.has(key)) windows.set(key, lastMeetings(classId, count, through));
      return windows.get(key);
    },
    /*
      ONE STUDENT'S TOTALS OVER THAT WINDOW, and the date range is derived from the window rather
      than being a second definition of it. The last N meetings through a date are CONTIGUOUS in
      the class's own sequence of meetings — they are the newest N of one sorted list — so the
      inclusive range from the oldest of them to the newest contains exactly those meetings and no
      others. That is what lets the counting go through attendanceTotals(), which is the walk the
      registry and the printed record are drawn from, instead of a second reading of the marks in
      here that could disagree with both about a `U` or a student added to the roster mid-term.
    */
    windowTotals(studentId, count) {
      const key = studentId + '|' + count;
      if (!totals.has(key)) {
        const window = this.meetings(count);
        totals.set(key, window.length
          ? attendanceTotals(classId, studentId, window[window.length - 1], window[0])
          : null);
      }
      return totals.get(key);
    },

    /* ── the four WO-4.2 added, and the header above says what each one costs ── */

    /* One student's totals over the TERM rather than over a window of N meetings — the range the
       two term-shaped rules read, and the same walk the registry's own percentage comes out of. */
    termTotals(studentId) {
      if (!termWalks.has(studentId)) {
        termWalks.set(studentId, attendanceTotals(classId, studentId, termFrom, termTo));
      }
      return termWalks.get(studentId);
    },

    /*
      ONE STUDENT'S RECORDED MEETINGS AS A SEQUENCE OF MARKS, oldest first, over that same range.

      This is the one reading in the pass that a totals object cannot stand in for, and it is
      src/attendance.js's attendanceHistory() — the list a teacher reads at a conference — rather
      than a walk of `marks` in here. WO-2.6's first acceptance line is that the history and the
      percentage come out of one pass; borrowing the history is how this file inherits that instead
      of promising it. Only the codes are kept: the running percentage on each row belongs to the
      screen that draws a history, and a rule has no use for it.
    */
    termMarks(studentId) {
      if (!termRuns.has(studentId)) {
        termRuns.set(studentId, attendanceHistory(classId, studentId, termFrom, termTo)
          .map((row) => row.code));
      }
      return termRuns.get(studentId);
    },

    /*
      THE WORK THAT COUNTS TOWARD THIS STUDENT'S GRADE, in the document's own order — the ids the
      fall window is taken from. A cell counts when the teacher put a number in it or marked it
      missing; a blank is ungraded and an excused is out of the grade in both directions, which is
      src/grade-engine.js's rule read through src/scores.js's own cell reader rather than a third
      opinion about what `{ v: null, flag: 'late' }` means.
    */
    countedWork(studentId) {
      if (!countedIds.has(studentId)) {
        countedIds.set(studentId, this.countedRows(studentId).map((row) => row.id));
      }
      return countedIds.get(studentId);
    },

    /*
      THE SAME LIST WITH THE ONE THING countedWork() DROPS: whether the teacher marked that cell
      MISSING (WO-4.3).

      It is one memo and countedWork() is a projection of it, rather than two filters that both
      decide what "counts" — the second copy would be free to disagree the first time the excused
      rule moved, and the two rules reading them would then be measuring different windows while
      both saying "the last 8 assignments". `no-missing` is the only caller that needs the flag;
      everything else wants the ids and takes them from above.
    */
    countedRows(studentId) {
      if (!counted.has(studentId)) {
        counted.set(studentId, sequence.map((a) => {
          const mark = scoreMark(doc, a.id, studentId);
          if (mark.flag === 'excused') return null;
          if (mark.flag === 'missing') return { id: a.id, missing: true };
          return mark.value !== null ? { id: a.id, missing: false } : null;
        }).filter(Boolean));
      }
      return counted.get(studentId);
    },

    /*
      ── THE TWO READINGS THE TURNAROUND RULE TAKES, AND THE ONLY RECURSION IN THIS FILE ──

      `concernNow` runs the nine concern rules over THIS context and hands back the ids that fired.
      `concernAsOf` does the same over a context built at `through − days`, which is this same
      evaluator asked about an earlier day — the "prior evaluation" WO-4.3 asks the turnaround to be
      derived from, rather than a bit written into the document that a moved threshold turns into a
      lie. See the rule itself for what the record can and cannot prove across that gap.

      THE RECURSION TERMINATES BECAUSE THE HISTORICAL CONTEXT REFUSES TO MAKE ANOTHER. `historical`
      is true on the one below, so its own concernAsOf() answers null and the turnaround rule inside
      it returns null — which is also the right answer on its own terms: a pass being consulted as
      history has no history of its own to consult. Only the CONCERN rules are run over it in any
      case, and the turnaround is a praise rule, so the guard is a second lock on a door already
      shut. Two locks, because the cost of the first one being quietly removed is an evaluator that
      recurses once per 21 days for ever.

      THE COST IS ONE EXTRA CONTEXT PER PASS, not one per student: the historical context is built
      on the first student who reaches it and memoized by window length, and everything expensive
      inside it — the meetings resolution, the totals walk, the weighted grade — memoizes exactly as
      it does out here. What a pass costs is therefore roughly doubled and never multiplied, which
      is the line WO-2.13's instrumentation drew.
    */
    concernNow(studentId) {
      if (!flaggedNow.has(studentId)) {
        flaggedNow.set(studentId, CONCERN_RULES
          .filter((rule) => !!rule.measure(this, studentId)).map((rule) => rule.id));
      }
      return flaggedNow.get(studentId);
    },
    concernAsOf(studentId, days) {
      if (historical) return null;
      const span = Math.max(0, Math.floor(Number(days) || 0));
      if (!span) return null;
      const key = studentId + '|' + span;
      if (!flaggedThen.has(key)) {
        const back = String(span);
        if (!pasts.has(back)) {
          pasts.set(back, makeContext(doc, cls, termId, shiftDays(through, -span), true));
        }
        flaggedThen.set(key, pasts.get(back).concernNow(studentId));
      }
      return flaggedThen.get(key);
    },

    /*
      THE SAME WEIGHTED GRADE WITH THE LAST `count` OF THOSE TAKEN OUT — what the grade was before
      that work existed.

      The window is removed from `assignments[]` rather than from `scores`, because that is what
      "before this work existed" means to the arithmetic: an assignment that is not in the document
      is not in anybody's denominator, and one whose score was merely deleted would still be there
      at full points the moment the teacher had marked it missing. The clone is shallow and its
      `assignments` is a new array — nothing else about the document is copied, so the categories,
      the weights and the letter scale are the same objects the real grade is computed from.
    */
    gradeWithout(studentId, count) {
      const key = studentId + '|' + count;
      if (!beforeGrades.has(key)) {
        const drop = this.countedWork(studentId).slice(-count);
        const kept = (Array.isArray(doc.assignments) ? doc.assignments : [])
          .filter((a) => !(a && drop.indexOf(a.id) >= 0));
        beforeGrades.set(key,
          weightedClassGrade(Object.assign({}, doc, { assignments: kept }), cls, termId, studentId));
      }
      return beforeGrades.get(key);
    },

    /* One student's scored percentages, in the document's order — the sequence a run of low scores
       is read off. Zero-point work is not in it: extra credit has no percentage (see the rule). */
    scorePercents(studentId) {
      if (!percents.has(studentId)) {
        percents.set(studentId, sequence.map((a) => {
          const points = Number(a.points);
          if (!Number.isFinite(points) || points <= 0) return null;
          const mark = scoreMark(doc, a.id, studentId);
          if (mark.flag === 'excused' || mark.flag === 'missing' || mark.value === null) return null;
          return (mark.value / points) * 100;
        }).filter((p) => p !== null));
      }
      return percents.get(studentId);
    },

    /* How many pieces of work the teacher has marked missing. openWork() is where that state is
       defined and it is the same list the grade charged for; nothing here reads a date. */
    missingWork(studentId) {
      if (!missing.has(studentId)) {
        missing.set(studentId, openWork(doc, cls, termId, studentId)
          .filter((row) => row.state === 'missing').length);
      }
      return missing.get(studentId);
    },
  };
}

/* The names a sentence is allowed to know, and nothing else — see this file's header. Strings
   only: there is no number on this object, so a rule's say() cannot reach one that is not in the
   numbers it published. */
function whoOf(cls, student) {
  return {
    name: fullName(student),
    className: String((cls && cls.name) || 'this class'),
  };
}

/*
  EVERY SIGNAL FOR ONE CLASS AND TERM, IN ONE PASS.

    evaluate(doc, cls, termId)                      the whole roster
    evaluate(doc, cls, termId, { studentIds })      a subset, in roster order
    evaluate(doc, cls, termId, { through })         windows end on that date rather than today

  A flat list, `direction` on every hit. Iterated students-outer and rules-inner so that a student
  who fires twice has both hits together, which is the order a "why is this student here?" panel
  reads them in; and the roster's own order rather than a sort, because ordering a LIST is the list
  screen's business (this file's header).

  A hit is exactly what WO-4.1's Deliverables enumerate — direction, rule id, the student, the
  numbers that produced it, and the sentence built from them — plus the class and term it was
  evaluated for, because a hit outlives this call: a cross-class list and WO-5.1's
  `{{signals.list}}` both hold hits from several evaluations at once, and a hit that could not say
  which class it came from would need a wrapper to carry it.
*/
export function evaluate(doc, cls, termId, options) {
  if (!doc || !cls) return [];
  const opts = options || {};
  const through = opts.through || todayISO();
  const ctx = makeContext(doc, cls, termId, through);

  const asked = Array.isArray(opts.studentIds) ? opts.studentIds : null;
  const people = studentsIn(doc);
  const roster = rosterOf(cls)
    .filter((id) => !asked || asked.indexOf(id) >= 0)
    /* A roster id matching no student is reachable — a restored backup, a hand-edited file — and it
       is the harmless failure everywhere else in this app (src/roster.js's studentsOf). It has no
       name, so it could not be explained to anybody, and it is dropped here rather than reported. */
    .map((id) => people.filter((s) => s && s.id === id)[0])
    .filter(Boolean);

  const hits = [];
  roster.forEach((student) => {
    const who = whoOf(cls, student);
    RULES.forEach((rule) => {
      const numbers = rule.measure(ctx, student.id);
      if (!numbers) return;
      hits.push({
        direction: rule.direction,
        ruleId: rule.id,
        studentId: student.id,
        classId: cls.id,
        termId: termId,
        numbers: numbers,
        explanation: rule.say(numbers, who),
      });
    });
  });
  return hits;
}

/* ────────────────────────────── the cooldown (WO-4.5) ──────────────────────────────

  ── WHY IT IS HERE AND NOT ON THE SCREEN ──

  severityOrder()'s reason, unchanged: WO-6.4's glance panel, the home screen's card and Phase 5's
  send flow all ask "who is on this list today", and three surfaces filtering for themselves is
  three answers — with the two that are wrong being the ones nobody is looking at. A cooldown that
  lived in src/signals-view.js would be a suppression the card on the home screen had never heard
  of, on the same morning, about the same student.

  ── IT KEYS ON `student + rule`, WHICH IS THE WHOLE FEATURE ──

  WO-4.5's trap in one line: keyed on the student, it hides a NEW problem because you emailed about
  an OLD one. A student you wrote home about for a grade fall on Monday is still on this list on
  Tuesday for four missing assignments, and that is not a bug to be tidied away — it is the reason
  the pair is the key. `src/log.js`'s lastContactAbout() refuses an empty rule id so that the
  student-only question cannot be asked of it by accident.

  ── AND IT SUPPRESSES, IT DOES NOT DELETE ──

  Both lists come back: `shown` is what the column draws and `suppressed` is what it counts at its
  foot and expands. WO-4.5's fifth acceptance line is that a suppressed hit is recoverable and
  counted rather than silently dropped, and the shape of this return is that line made structural —
  there is no arm of this function that drops a hit on the floor.

  ── NOTHING IS WRITTEN, AND THERE IS NO SUPPRESSION STORE ──

  This reads `log[]` and the thresholds and returns two arrays. The document is byte-identical
  either side of it, `newYearDocument()` gained nothing, and the second acceptance line — restore a
  backup and the cooldowns come back — is paid by the log being in the backup rather than by
  anything here. A `suppressedUntil` field would be a second truth about who is on the list, sitting
  beside the log that decides it, going stale the moment the teacher moved the threshold.

  ── THE WINDOW, AND THE TWO EDGES ──

  Inclusive and counted off `through`, exactly as behaviorCountSince() counts a behavior window: a
  contact ON the day being asked about is inside, and `cooldownDays` of 14 covers the day of the
  contact and the thirteen after it. `until` is therefore the contact's date plus the whole span,
  which is the first day the student is back — the date the suppressed row prints.

  ── WHAT CROSSES OUT OF THE LOG, AND WHAT DOES NOT ──

  A date and the `audience` enum. Not the subject, not the body: a suppressed row says *you emailed
  his guardian about this on Sep 6*, which is what makes the suppression checkable, and it says
  nothing a teacher typed. That is src/log.js's firewall holding one function further out.
*/
export function applyCooldown(doc, hits, options) {
  const opts = options || {};
  const through = opts.through || todayISO();
  const days = Math.max(0, Math.floor(Number(thresholdOf(doc, 'cooldownDays')) || 0));
  const shown = [];
  const suppressed = [];
  (Array.isArray(hits) ? hits : []).forEach((hit) => {
    const held = days && hit ? silencedBy(doc, hit, through, days) : null;
    if (held) suppressed.push(held); else shown.push(hit);
  });
  return { shown: shown, suppressed: suppressed };
}

/* One hit against one contact, or null for a hit nothing silences. `days` is how long ago the
   contact went out — 0 on the day itself — and it is a subtraction of two dates rather than a walk,
   through the one function in this app that touches a Date (src/calendar.js's daysBetween). */
function silencedBy(doc, hit, through, days) {
  const seen = lastContactAbout(doc, hit.studentId, hit.ruleId, through);
  if (!seen) return null;
  if (seen.on < shiftDays(through, -(days - 1))) return null;
  return {
    hit: hit,
    on: seen.on,
    audience: seen.audience,
    until: shiftDays(seen.on, days),
    days: daysBetween(seen.on, through),
    span: days,
  };
}

/* ────────────────────────────── the quiet middle (WO-4.5) ──────────────────────────────

  THE STUDENTS NO THRESHOLD WILL EVER PRODUCE. Neither flagged, nor praised, nor contacted this
  term — plans/ROADMAP.md Phase 4's other half, and the work order's own sentence: the students a
  busy teacher genuinely loses track of are the ones nothing about whom is wrong.

  IT IS RANKED BY HOW LONG IT HAS BEEN, and that is why the drawing makes it a THIRD LIST AND NOT A
  THIRD COLUMN. The two columns share a ranking — how much changed — and this one does not; putting
  it beside them would imply it shares one. The order here is longest-quiet first, ties broken by
  roster order underneath a stable sort, which is the order evaluate() returns a class in.

  ── WHY IT IS IN THE ENGINE ──

  applyCooldown()'s reason and severityOrder()'s: WO-6.4's glance page draws `The quiet middle · N`
  as a door onto the list this returns, so the count on that page and the rows on this one have to
  come out of one function. A screen that answered "how many" for itself would be the second answer,
  and the one nobody checks.

  ── THREE THINGS IT DOES NOT DO ──

  IT DOES NOT RE-EVALUATE WHEN IT IS GIVEN THE HITS. `options.hits` is the pass the caller has
  already run — the FULL pass, before any cooldown, because a student whose only signal is currently
  suppressed has been both flagged and contacted and belongs on neither list. Without it this runs
  its own pass, which is what a caller that wants only this list should do.

  IT DOES NOT COUNT A NOTE AS AN EXCLUSION. "Flagged, praised, or contacted" is the acceptance
  line's own list and a note to self is none of the three: a teacher who wrote *ask about the
  science fair* three weeks ago has not been in touch with anybody. What a note does is move the
  CLOCK, which is what sinks that student down the list rather than off it.

  AND IT DOES NOT READ A SUPPORT, A PLAN OR A MEDICAL NEED, exactly as no rule above does. What it
  reads is the roster, the grade, the hits, and three dates out of src/log.js — of which two are
  dates with no kind attached and the third is the date of a contact. Nothing it returns could name
  what was written.
*/
export function quietMiddle(doc, cls, termId, options) {
  if (!doc || !cls) return [];
  const opts = options || {};
  const through = opts.through || todayISO();
  const hits = Array.isArray(opts.hits) ? opts.hits : evaluate(doc, cls, termId, { through });
  const range = termRangeOf(cls, termId, through);

  const busy = Object.create(null);
  hits.forEach((hit) => { if (hit) busy[hit.studentId] = true; });

  const people = studentsIn(doc);
  const rows = [];
  rosterOf(cls)
    .map((id) => people.filter((s) => s && s.id === id)[0])
    .filter(Boolean)
    .forEach((student) => {
      if (busy[student.id]) return;
      /* CONTACTED THIS TERM, and a `range.from` of '' — an undated term — reads as "ever", which is
         the same reading every other term-shaped question in this file gives an undated term. */
      const wrote = lastContactDate(doc, student.id, through);
      if (wrote && wrote >= range.from) return;

      /* THE CLOCK. The last thing of any kind written down about this student, and the term's own
         start when there is nothing — which is what "all term" means and what the drawing's figure
         says. An undated term has no start to measure from, so the row says so rather than
         inventing a number. */
      const said = lastEntryDate(doc, student.id, through);
      const from = said || range.from;
      const days = from ? Math.max(0, daysBetween(from, through)) : null;
      const grade = weightedClassGrade(doc, cls, termId, student.id);
      const percent = grade && grade.percentage !== null ? grade.percentage : null;
      rows.push({
        studentId: student.id,
        classId: cls.id,
        termId: termId,
        /* `since` is the date the clock runs from and '' is "nothing to run it from"; `days` is
           null in the same case rather than 0, because a zero here would read as "something
           happened today" — the exact opposite of what an undated term with no entries means. */
        since: from,
        days: days,
        wrote: !!said,
        percentage: percent,
        letter: grade ? grade.letter : null,
        explanation: quietSentence(percent, !!said, days, whoOf(cls, student)),
      });
    });

  /* Longest quiet first. A row with no clock at all leads: "nothing has ever been written down and
     this term has no dates on it" is more unknown than any number of days, not less.

     AND THE LIST IS NOT CAPPED, which was read on an empty term on 2026-08-27 and left alone
     deliberately — the owner's call is to watch it rather than act, and TESTING.md § WO-4.5 carries
     the reading. Early in a term this returns most of a roster, because almost nothing has been
     written down yet and most students tie at the term's own start, so the ranking above has little
     to sort by; that inverts as the term fills. Capping it here would invent a threshold the work
     order did not ask for and would drop students silently, which is the failure the suppressed-row
     half of WO-4.5 exists to prevent. If the wall survives real data the fix is the VIEW's — the
     panel collapsing behind its own head, the shape the two cooldown feet already teach — and not
     a number in this function. */
  return rows.sort((a, b) => {
    const da = a.days === null ? Infinity : a.days;
    const db = b.days === null ? Infinity : b.days;
    return db - da;
  });
}

/*
  ONE QUIET ROW'S SENTENCE, built here for the reason every other sentence on this screen is built
  in this file: a renderer that composed it would be free to disagree with the numbers beside it.

  IT IS NOT A RULE'S say() AND THERE IS NO RULE BEHIND IT — nothing fired, which is the whole point
  — so it is not handed a `numbers` object. What it is handed is the same shape a rule's say() is:
  measured figures, and `who`, which is names and strings only.

  WHAT IT DOES NOT SAY, and this is the one place this work order departs from
  design/mockups/signals.html. The drawing's rows read *"78% and steady"* and *"83%, no missing
  work, no absences"*. "and steady" is a claim about a delta, and "no missing work, no absences" is
  two more measurements per student on a list that can hold most of a class — and every one of them
  would be a rule this file already has, run again outside the pass that owns it, to report that it
  did not fire. The grade is kept because it is one read and it is the thing that answers "why did I
  lose track of her"; the rest is one tap away on the row's own destination.
*/
function quietSentence(percentage, said, days, who) {
  const where = 'In ' + who.className + ', ' + who.name;
  const standing = percentage === null
    ? ' has no graded work yet'
    : ' is at ' + formatPercent(percentage);
  if (days === null) {
    return where + standing + ' and nothing has been written down, said or sent about them at all.';
  }
  return where + standing + ' and nothing has been written down, said or sent about them '
    + (said ? 'in ' : 'all term — ') + plural(days, 'day', 'days') + '.';
}
