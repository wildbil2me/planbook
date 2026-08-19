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

  THE RULES THEMSELVES, all but two. WO-4.2 owns the nine concern rules, WO-4.3 the five praise
  rules, WO-4.4 the behavior log, WO-4.5 the cooldown, and the concern and praise LIST SCREENS are
  nobody's yet. Two rules are registered — `grade-below` and `attendance-window` — and they are
  here to prove the contract above rather than to be the feature: an engine with no rules in it
  cannot demonstrate both directions from one pass, and one with a single rule cannot demonstrate a
  student on both lists. They are ordinary members of the registry and their work orders may
  replace them.

  EVERY THRESHOLD IS HERE, though, and that is deliberate: `SIGNAL_SETTINGS` below names all nine
  concern values, all five praise values and the cooldown, with the defaults tabulated in
  docs/data-model.md § Signal thresholds. WO-4.2, WO-4.3, WO-4.4 and WO-4.5 read the keys named
  there rather than inventing their own, which is the half of this work order that is convention.

  RANKING IS NOT A FIELD ON A HIT. WO-4.2 orders its list by severity and WO-4.3 ranks by DELTA
  rather than by level, and both of those numbers are already in `numbers` — a `rank` beside them
  would be a second copy of a figure the hit carries, free to disagree with it. Ordering is the
  list screen's business; this module answers who and why.

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

import { weightedClassGrade } from './grade-engine.js';
import { lastMeetings, attendanceTotals, todayISO } from './attendance.js';
import { fullName } from './roster.js';
/* The app's two number formatters, imported rather than re-declared. formatPercent() is how every
   percentage in Planbook is written down — two fixed decimals, because the SIS carries two and this
   number is re-keyed into it by hand (src/scores.js) — and src/detail.js already imports it from
   there for exactly this reason: two formatters that have to agree is the answer this repo keeps
   refusing, and the one that drifts is the one nobody is looking at. formatWeight() is the other
   half of that rule pointed at a different kind of number: a threshold is a figure the TEACHER
   TYPED, like a category's weight, so it prints the way she typed it — "65", "89.5" — rather than
   as "65.00%". Which formatter a number takes is decided by where the number came from. */
import { formatPercent } from './scores.js';
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
function sayPercent(value, line, sense) {
  const n = Number(value);
  if (satisfies(Number(n.toFixed(2)), line, sense)) return formatPercent(n);
  for (let places = 3; places <= 6; places++) {
    const shown = n.toFixed(places);
    if (satisfies(Number(shown), line, sense)) return shown + '%';
  }
  /* Unreachable with a finite number and a finite line — six decimals is far past where a
     percentage can hide — and it prints the value whole rather than throwing, because a sentence
     is not the place to discover a defect. */
  return String(n) + '%';
}

/* A threshold, or a count of things, as the teacher would write it: 65, 89.5, 20. */
function sayNumber(value) { return formatWeight(Number(value)); }

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

/* ────────────────────────────── the rules ──────────────────────────────

   Two of them, and this file's header says at length why only two. Both are ordinary registry
   members: WO-4.2 and WO-4.3 add theirs beside them and may re-cut these.
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
};

const RULES = [gradeBelow, attendanceWindow];

/* The registry, as data. A list screen wants to name a rule it is filtering by, and the editor
   wants to know which rules read a threshold it is about to change. A copy rather than the array
   itself: a caller that sorted it would be reordering every evaluation after it. */
export function signalRules() {
  return RULES.map((rule) => ({ id: rule.id, direction: rule.direction, keys: rule.keys.slice() }));
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

  `t` is the thresholds resolved once. A rule reads `ctx.t.gradeBelow` rather than calling a
  resolver, so a rule cannot accidentally read a raw key off the document and get `undefined`.
*/
function makeContext(doc, cls, termId, through) {
  const classId = cls && cls.id;
  const grades = new Map();
  const windows = new Map();
  const totals = new Map();
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
