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
  (2026-08-20). WO-4.3 still owns four of the five praise rules, WO-4.4 the behavior log, WO-4.5
  the cooldown. Two rules were registered at WO-4.1 — `grade-below` and `attendance-window` — as
  proofs of the contract above rather than as the feature: an engine with no rules in it cannot
  demonstrate both directions from one pass, and one with a single rule cannot demonstrate a
  student on both lists. Both survived WO-4.2 unaltered except for the `figure` every rule now
  carries; they are ordinary members of the registry and their work orders may still replace them.

  THE BEHAVIOR RULE IS REGISTERED AND INERT, which is its own work order's acceptance line rather
  than an omission — see `behaviorWindow` below, and inertRules(), which is how the screen says so
  out loud instead of leaving a teacher to guess whether nobody qualified.

  AND THE LIST SCREEN IS NOT HERE. src/signals-view.js draws it, the same split
  src/signal-settings.js makes with the editor and for the same reason: this module owns the
  answers, a surface over it owns the pixels, and the import runs one way.

  EVERY THRESHOLD IS HERE, though, and that is deliberate: `SIGNAL_SETTINGS` below names all nine
  concern values, all five praise values and the cooldown, with the defaults tabulated in
  docs/data-model.md § Signal thresholds. WO-4.2, WO-4.3, WO-4.4 and WO-4.5 read the keys named
  there rather than inventing their own, which is the half of this work order that is convention.

  RANKING IS NOT A FIELD ON A HIT. WO-4.2 orders its list by severity and WO-4.3 ranks by DELTA
  rather than by level, and both of those numbers are already in `numbers` — a `rank` beside them
  would be a second copy of a figure the hit carries, free to disagree with it.

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

  Not now and not in WO-4.2. A signal's explanation is drafted into mail that goes to a guardian
  (docs/data-model.md § Outreach templates, `{{signals.list}}`), so a rule that read that half of
  the roster would make disclosure a one-keystroke mistake — the same reason no merge field
  resolves those paths. Grades, scores, marks, meetings and the outreach log are the whole of what
  a rule may see.
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

   TEN SINCE WO-4.2 — the nine concern rules the data model tabulates, plus the one praise rule
   WO-4.1 registered to prove the contract. WO-4.3 adds the other four praise rules beside them.

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

  WHAT WO-4.4 DOES TO THIS. It writes measure(), it writes say(), and it deletes the `inert` line —
  one rule, in one place, with the threshold keys already named above and already editable. The
  `…Days` window is the right unit here and SIGNAL_SETTINGS says why at its own row: a behavior
  entry is a thing the teacher wrote down at a moment, and "two of them inside a month" is a
  statement about how close together they were rather than about how often the class met.
*/
const behaviorWindow = {
  id: 'behavior-window',
  direction: 'concern',
  keys: ['behaviorCount', 'behaviorWindowDays'],
  inert: 'the behavior log arrives with WO-4.4, and nothing writes an entry for this rule to count '
    + 'yet. Nothing else on this list is affected.',
  measure() { return null; },
  /* Unreachable while `inert` stands, and written out rather than left off so that the rule is a
     whole registry member and not a stub with holes in it. */
  say(numbers, who) {
    return 'In ' + who.className + ', ' + who.name + ' has '
      + plural(numbers.entries, 'behavior note', 'behavior notes') + ' in the last '
      + plural(numbers.days, 'day', 'days') + ' — ' + sayNumber(numbers.need) + ' or more.';
  },
  figure(numbers) {
    return { value: numbers.entries, text: String(numbers.entries), unit: 'noted', tone: 'flat' };
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
     WO-4.3 ranks praise BY DELTA and owns the four rules that have one; if that work order re-cuts
     this rule into one, the figure is the line that changes. */
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
  absenceRun, tardyCount, behaviorWindow, attendanceWindow];

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
    text: ruleText(rule.id), rank: rankOf(rule.id), inert: rule.inert || '' }));
}

/* ────────────────────────────── the pass ────────────────────────────── */

function studentsIn(doc) { return doc && Array.isArray(doc.students) ? doc.students : []; }
function rosterOf(cls) { return cls && Array.isArray(cls.roster) ? cls.roster : []; }

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
function makeContext(doc, cls, termId, through) {
  const classId = cls && cls.id;
  const grades = new Map();
  const windows = new Map();
  const totals = new Map();
  const termWalks = new Map();
  const termRuns = new Map();
  const counted = new Map();
  const beforeGrades = new Map();
  const percents = new Map();
  const missing = new Map();

  /*
    THE TERM'S RANGE, RESOLVED ONCE, and `null` when this class's term is not dated — which reads
    as "every recorded meeting of this class", exactly as the printed attendance record does
    (src/attendance.js's classRecord). src/classes.js's termIsDated() is the shape test; nothing
    here repairs or sorts a term's dates, which is that file's rule 2.

    THE END IS CLIPPED TO `through`. The evaluator takes that argument so a pass can be run as of a
    date — the harness does exactly this — and a term range that ran past it would count meetings
    from after the moment being asked about. Today it changes nothing, because a meeting in the
    future is a record nobody has written; it is what keeps an as-of pass honest.
  */
  const term = (cls && Array.isArray(cls.terms) ? cls.terms : [])
    .filter((t) => t && t.id === termId)[0] || null;
  const dated = termIsDated(term);
  const termFrom = dated ? term.start : '';
  const termTo = dated ? (term.end < through ? term.end : through) : through;

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
      if (!counted.has(studentId)) {
        counted.set(studentId, sequence.filter((a) => {
          const mark = scoreMark(doc, a.id, studentId);
          if (mark.flag === 'excused') return false;
          return mark.flag === 'missing' || mark.value !== null;
        }).map((a) => a.id));
      }
      return counted.get(studentId);
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
