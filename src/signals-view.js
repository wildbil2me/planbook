/*
  Who needs you — the concern list, the praise list, and the two things WO-4.5 added under them:
  the rows the cooldown took out of each column, and the quiet middle (WO-4.2, WO-4.3, WO-4.5).

  ── BOTH COLUMNS, AT EQUAL WIDTH, AND THAT IS AN ARGUMENT RATHER THAN A LAYOUT (WO-4.3) ──

  The praise half is what makes this a teacher's assistant rather than a gradebook with alarms
  (plans/ROADMAP.md Phase 4), and the way it dies is by being STACKED: a screen shorter than both
  lists buries it, and every iPad is. So the two are `1fr 1fr` on a laptop and praise is drawn
  FIRST below 720px, which is the one place the drawing breaks the symmetry and it breaks it toward
  the half a teacher would otherwise never scroll to (src/signals-view.css § the two columns).

  AND IT RANKS BY DELTA, NOT BY LEVEL. The head says *biggest climb first* in as many words, the
  bold figure on a praise row is the change, and the current grade is not on the row at all — a list
  that ranks by delta and draws the level big is arguing with itself. The ordering itself is
  src/signals.js's praiseOrder(), for the reason severityOrder() lives there.

  ── WHAT THIS FILE IS, AND THE TWO IT IS NOT ──

  It is a RENDERER, and the split it makes with src/signals.js is the one src/signal-settings.js
  already makes with the same module: that file owns the answers — which student, which rule, which
  numbers, which sentence, and since this work order which order — and this one owns the pixels.
  The import runs ONE WAY. Nothing here decides whether a rule fired, nothing here writes a
  sentence, and nothing here sorts a list by a rule of its own.

  IT IS NOT A SECOND OPINION ABOUT WHY A STUDENT IS HERE. Every line of prose under a name is
  `hit.explanation`, built by the rule out of the numbers it published and nothing else; every
  figure in the strong position is `figure(numbers)`, chosen by the same rule out of the same
  numbers. A screen that composed either would be free to disagree with the arithmetic it is
  sitting on top of, which is exactly what WO-4.1's shape was built to make impossible.

  IT IS ALSO NOT A WRITER. There is no update() below and no store call at all — the only thing on
  this screen that changes the document is the thresholds panel, which is src/signal-settings.js's,
  reached through the door in the panel header and chained back here by src/shell.js.

  ── AND THE TWO LISTS THAT ARE NOT COLUMNS (WO-4.5) ──

  A COOLDOWN FOOT PER COLUMN, and it is at the foot rather than in the list because the rows it
  counts are rows the engine has decided not to ask for again yet. It says the COUNT in both states
  and the expansion NAMES each student and the contact that silenced her: "3 suppressed" with no
  names is indistinguishable from a list that has quietly lost three students, and a teacher who
  cannot check a suppression stops trusting the list it was taken from.

  AND THE QUIET MIDDLE IS A PANEL UNDER THE PAIR (the owner, 2026-08-20), so this view has one
  state and the switcher never has to say which of two you are on. It is a THIRD LIST AND NOT A
  THIRD COLUMN: the two columns share a ranking and this one does not — it is ordered by how long
  it has been, which is a different question with a different unit.

  NEITHER OF THEM IS DECIDED HERE. src/signals.js's applyCooldown() says which hits are silenced
  and quietMiddle() says who is on the third list, for severityOrder()'s reason: WO-6.4's glance
  page asks both questions too, and three surfaces answering them is three answers.

  ── WHAT IS HELD HERE, AND WHY NONE OF IT IS REMEMBERED ──

  Five values: which class the list is about, what it is sorted by, which rule it is filtered
  to, whether each column's cooldown expansion is open, and which suppressed rows *Write anyway*
  has taken back. None of them is written to localStorage, and that is the owner's ruling of 2026-08-20
  ("neither is written to a preference: both recompute on arrival") resting on src/calendar-view.js's
  reason — a remembered filter is a list quietly hiding four fifths of what a teacher asked for,
  set by nobody she can remember, on the screen she opened to find out who needs her.

  EVERY ARRIVAL OPENS ON THE RULED ORDER AND ON EVERY RULE. What protects the phase's argument is
  which option the list opens on rather than which options are absent: *Lowest grade* is a real
  errand on a Friday, and a teacher who takes it goes back next week to a ranking that surfaces
  someone new. A list that OPENED on the level would never surface anyone new at all
  (plans/ROADMAP.md Phase 4).

  AND THE CLASS FILTER IS DECIDED BY THE DOOR SHE CAME THROUGH — every class from the home screen's
  way in, the open class from the Signals segment inside one. Recomputed on every arrival, which is
  what makes it a door rather than a memory, and the toolbar's *All classes* sits beside it saying
  so.

  ── PRESENTATION MODE IS ASKED HERE, AND THAT IS THE DEPARTURE ──

  This screen CLOSES while the projector is on (the owner, 2026-08-20). It is the first surface in
  the app that refuses rather than hides, and src/signals-view.css carries the argument at its own
  point of departure.

  IT ASKS `presentationMode()` AND NOT `supportsVisible()`, which is src/pass-history.js's
  distinction and this file inherits it word for word: both come from src/supports.js, so this is
  the same switch rather than a second copy of it, read through the accessor that matches the
  question. `supportsVisible()` asks whether a SUPPORT FIELD may be drawn, and there is not one on
  this screen — no accommodation, no medical need, no plan, no case manager, no review date, no
  import that could produce any and no path to `student.supports` from here. What is refused is a
  ranked list of named students in trouble, which is a disclosure of a different kind and one no
  amount of redaction fixes.

  It also cannot follow src/calendar-view.js's arrangement, where the model returns an empty list
  and the screen never hears of the mode: nothing here comes through a reader that could suppress
  it, because the data is grades, scores, marks and meetings — the whole of what a rule may see.
  There is nowhere upstream for the refusal to live.
*/

import { getDoc } from './store.js';
import { getActiveClasses, getOpenTermId, getTerms, termName, initials, avatarClass }
  from './classes.js';
import { fullName } from './roster.js';
import { announce } from './live-region.js';
import { openModal } from './modal.js';
/* The switch, and only the switch — see this file's header for why it is this accessor and not
   the visibility rule beside it. */
import { presentationMode } from './supports.js';
/* The engine. `evaluate` produces the hits, `severityOrder` is the owner's ruling about which of
   them matters most, `signalFigure` is the number a row draws big, and the last three are the
   words a chip, a threshold line and an inert notice say — every one of them read from the same
   table the editor renders, so the two cannot come to disagree. */
/* `praiseOrder` and `orderHits` joined at WO-4.3 and are the same kind of thing as `severityOrder`:
   the engine's answer to "which of these matters most", asked once and inherited by every surface
   rather than re-decided per screen. */
/* `applyCooldown` and `quietMiddle` joined at WO-4.5, and both are the engine's for
   severityOrder()'s reason: WO-6.4's glance page and the home screen's card ask the same two
   questions, and three surfaces filtering a list for themselves is three answers. */
import { evaluate, severityOrder, praiseOrder, orderHits, signalFigure, signalRules, ruleText,
  ruleThresholdText, inertRules, applyCooldown, quietMiddle } from './signals.js';
/* The grade beside a name on the card, and the key the *Lowest grade* sort reads. It is the same
   engine every other grade in this app comes out of; nothing here sums a cell. */
import { weightedClassGrade } from './grade-engine.js';
import { formatPercent } from './scores.js';
import { formatWeight } from './categories.js';
/* The app's one date formatter (WO-3.20). A suppressed row prints two dates — when the contact
   went out and when the student comes back — and a second spelling of `Sep 6` on a screen that
   already has one is the five-copies state that file exists to end. */
import { shortDate } from './date-text.js';

const CLASSES_ID = 'signalsClasses';
const RULES_ID = 'signalsRules';
const SORT_ID = 'signalsSort';
const LIST_ID = 'signalsList';
const HEAD_ID = 'signalsConcernHead';
const CONCERN_EMPTY_ID = 'signalsConcernEmpty';
/* WO-4.3's half of the screen. `signalsList` keeps its name — it was the only list when it was
   named — and the praise column's three ids say which column they are, which is the naming this
   file would use for both if it were being written today. */
const PRAISE_LIST_ID = 'signalsPraiseList';
const PRAISE_HEAD_ID = 'signalsPraiseHead';
const PRAISE_EMPTY_ID = 'signalsPraiseEmpty';
/* WO-4.5's, and they come in pairs: a foot that counts what the cooldown took out of the column,
   and the container it expands into. */
const CONCERN_HIDDEN_ID = 'signalsConcernHidden';
const CONCERN_QUIET_ID = 'signalsConcernQuiet';
const PRAISE_HIDDEN_ID = 'signalsPraiseHidden';
const PRAISE_QUIET_ID = 'signalsPraiseQuiet';
const QUIET_ID = 'signalsQuiet';
const QUIET_HEAD_ID = 'signalsQuietHead';
const QUIET_LIST_ID = 'signalsQuietList';
const QUIET_EMPTY_ID = 'signalsQuietEmpty';
const COLUMN_ID = 'signalsColumns';
const INERT_ID = 'signalsInert';
const EMPTY_ID = 'signalsEmpty';
const EMPTY_LEAD_ID = 'signalsEmptyLead';
const BLOCKED_ID = 'signalsBlocked';
const CARD_MODAL_ID = 'signalCardModal';
const CARD_TITLE_ID = 'signalCardTitle';
const CARD_BODY_ID = 'signalCardBody';

/* The four the <select> in index.html offers, and the first is the ruled one. `RULED` is what every
   arrival resets to. */
const RULED = 'ruled';
const SORTS = [RULED, 'change', 'grade', 'missing'];

/* What the column head says it is ordered by, per sort. The head says it OUT LOUD for the reason
   the drawing gives about the praise column: a ranking a teacher has to infer is a ranking she will
   infer wrongly, and this one is the phase's whole argument. */
const SORT_NOTES = {
  ruled: 'attendance first, then the biggest change',
  change: 'the biggest change first',
  grade: 'the lowest grade first',
  missing: 'the most missing work first',
};

/*
  AND THE PRAISE COLUMN'S HEAD SAYS ONE THING, ALWAYS — *biggest climb first*, in as many words,
  which design/mockups/signals.html settles for this work order: a teacher who reads "Praise" as
  "the top of the class" stops reading it inside a fortnight, and the heading cannot carry the
  ranking on its own.

  IT IS A CONSTANT AND NOT A `SORT_NOTES` ENTRY BECAUSE THE SORT CONTROL DOES NOT REACH THIS COLUMN.
  Two of its four options — *lowest grade* and *most missing work* — are concern errands with no
  praise reading at all, and the only praise reading the third has is "top of the class", which is
  the one thing this phase exists to refuse. So the `<select>` orders the concern list, its own
  aria-label says so, and each column's head states what it is ordered by; a teacher comparing the
  two heads can see which control moved which list. **This is a decision WO-4.3 did not settle** —
  it is recorded here rather than in a work order because the alternative, a second sort control,
  is a second control on a screen that already carries two filter strips and one sort.
*/
const PRAISE_NOTE = 'biggest climb first';

/* Which column a rule belongs to, built once from the registry. A chip filters the column its rule
   is in and leaves the other alone — the two lists answer different questions, and a teacher who
   narrows one has not stopped caring about the other. */
const RULE_DIRECTION = Object.create(null);
signalRules().forEach((rule) => { RULE_DIRECTION[rule.id] = rule.direction; });

/* ── THE VIEW STATE ──
   Five values since WO-4.5, none of them student data and none of them persisted — the header
   says why, and the two new ones are the plainest case it makes: whether a teacher opened the
   cooldown's expansion, and which rows she took back out of it, are facts about this minute. A
   remembered *Write anyway* would be a cooldown a teacher had switched off in March and could not
   remember switching off, which is the same failure a remembered filter is. */
let filterClassId = '';
let sortBy = RULED;
let filterRuleId = '';

/* Which column's suppressed rows are open, per direction. Closed on every arrival: the rows the
   engine wants read are the ones in the column, and an expansion that was open when she left is an
   expansion she has to close again before the list means what it says. */
const expanded = { concern: false, praise: false };

/* THE ROWS *WRITE ANYWAY* HAS TAKEN BACK, keyed `studentId|ruleId|classId`.

   THE CLASS IS IN THE KEY AND IT IS NOT IN THE COOLDOWN'S. The suppression is student + rule and
   nothing else, because `log[]` carries no `classId` and cannot say which section an email was
   about (src/log.js). This is the other half of the same fact read from the screen's side: the
   same student in two classes is TWO ROWS and two conversations — this file's own collect() says
   so — so taking one of them back is not a decision about the other. */
const writtenAnyway = Object.create(null);

/* Which student's card is open, as `studentId|classId`. Not persisted either, and not a selection:
   it is which dialog is on screen this second, and it is cleared when the list is rebuilt under it. */
let openCardKey = '';

/* ────────────────────────────── the pass ────────────────────────────── */

function classesShown() {
  const all = getActiveClasses();
  if (!filterClassId) return all;
  return all.filter((cls) => cls.id === filterClassId);
}

function studentIn(doc, id) {
  return (doc && Array.isArray(doc.students) ? doc.students : []).filter((s) => s && s.id === id)[0]
    || null;
}

function rowKey(hit) { return hit.studentId + '|' + hit.classId; }

/*
  EVERY HIT IN EVERY CLASS ON SCREEN, BOTH DIRECTIONS, GROUPED ONE ROW PER STUDENT PER CLASS.

  IT COLLECTS BOTH HALVES IN ONE WALK SINCE WO-4.3, and that is WO-4.1's argument arriving on the
  screen rather than a convenience: one evaluator produces both lists, a student can be on both at
  once, and that is information rather than a bug. Two walks would make that state a coincidence
  between two loops instead of one pass's honest answer, and the first time they disagreed about
  which term a class was open on nobody would notice.

  A BASE ROW CARRIES ALL OF A STUDENT'S HITS IN BOTH DIRECTIONS, ordered by the engine — concern by
  severity, then praise by climb (`orderHits`). The two COLUMNS are derived from it below, each
  holding that direction's slice; the CARD is built from the base row and shows both, which is the
  one place on this screen a teacher sees the whole student at once.

  ONE STUDENT, ONE ROW (the drawing, and WO-4.2 never says how many rows one student may hold). A
  student who is failing AND missing work AND absent is one conversation, not three, and three rows
  for her would push two other students off the screen while telling the teacher nothing she does
  not learn from the first. The other rules ride as tags and the card opens with all of them in
  full.

  THE SAME STUDENT IN TWO CLASSES IS TWO ROWS, and that is not the same thing. Those are two
  conversations — different work, different meetings, possibly different guardianship of the
  problem — and the hits carry the class they were evaluated for precisely so a cross-class list can
  keep them apart.

  WHICH TERM: each class's own open term, read through src/classes.js's getOpenTermId(). That is the
  map the home screen's ungraded count reads for the same reason (WO-3.26) — this screen asks about
  five classes at once and none of them is necessarily the selected one, and a screen that read the
  preference itself would be a second opinion about which term a class is open on.
*/
function collect(doc) {
  const rows = [];
  const byKey = Object.create(null);
  const held = [];
  const quiet = [];
  classesShown().forEach((cls) => {
    const termId = getOpenTermId(cls.id);
    const term = getTerms(cls.id).filter((t) => t.id === termId)[0] || null;
    const hits = evaluate(doc, cls, termId);

    /* THE QUIET MIDDLE IS TAKEN OFF THE SAME PASS, and off the FULL pass rather than the
       post-cooldown one: a student whose only signal is currently silenced has been both flagged
       and written home about, which is two of the three things this list excludes. */
    quietMiddle(doc, cls, termId, { hits: hits }).forEach((row) => {
      const student = studentIn(doc, row.studentId);
      quiet.push(Object.assign({}, row, {
        key: row.studentId + '|' + cls.id,
        className: cls.name,
        name: student ? fullName(student) : '',
        avatar: avatarClass(cls.id),
      }));
    });

    if (!hits.length) return;

    /*
      AND THE COOLDOWN IS APPLIED HERE, ONCE, BEFORE ANYTHING IS GROUPED INTO A ROW.

      A student's row carries every rule she tripped, so a suppression applied after the grouping
      would have to reach inside a row and take one hit out of it — leaving a row whose headline is
      a rule the teacher was told is silenced. Applied to the hits, the arithmetic stays the engine's
      and the grouping below is unchanged: a student silenced on her only signal has no row at all,
      and a student silenced on one of three has a row about the other two.
    */
    const cool = applyCooldown(doc, hits);
    const stillHeld = new Set();
    cool.suppressed.forEach((row) => {
      const key = row.hit.studentId + '|' + row.hit.ruleId + '|' + cls.id;
      /* Taken back by *Write anyway*, so it goes back on the list as an ordinary hit and is not
         counted at the foot: it is not suppressed any more. */
      if (writtenAnyway[key]) return;
      stillHeld.add(row.hit);
      const student = studentIn(doc, row.hit.studentId);
      held.push(Object.assign({}, row, {
        key: key,
        direction: row.hit.direction,
        className: cls.name,
        name: student ? fullName(student) : '',
        avatar: avatarClass(cls.id),
      }));
    });
    /* Filtered out of the ORIGINAL array rather than read off `cool.shown`, so the hits stay in the
       order the pass produced them — roster order, which is the tiebreak every sort below rests on. */
    const live = hits.filter((hit) => !stillHeld.has(hit));
    if (!live.length) return;

    orderHits(live).forEach((hit) => {
      const key = rowKey(hit);
      if (!byKey[key]) {
        const student = studentIn(doc, hit.studentId);
        const grade = weightedClassGrade(doc, cls, termId, hit.studentId);
        byKey[key] = {
          key: key,
          studentId: hit.studentId,
          classId: cls.id,
          className: cls.name,
          termLabel: termName(term),
          name: student ? fullName(student) : '',
          avatar: avatarClass(cls.id),
          hits: [],
          /* Kept for the two sorts that are not about a signal at all. Null is "no graded work",
             which is the grade engine's own answer and never a zero. */
          grade: grade && grade.percentage !== null ? grade.percentage : null,
          letter: grade ? grade.letter : null,
        };
        rows.push(byKey[key]);
      }
      byKey[key].hits.push(hit);
    });
  });
  /* THE QUIET LIST IS RANKED ACROSS EVERY CLASS ON SCREEN, not within each one. quietMiddle()
     orders one class; five of them concatenated would read as five short lists pretending to be
     one, with a student nobody has spoken to in forty days sitting under one nobody has spoken to
     in three. A row with no clock at all leads, for the reason the engine gives. */
  quiet.sort((a, b) => (b.days === null ? Infinity : b.days) - (a.days === null ? Infinity : a.days));
  return { rows: rows, held: held, quiet: quiet };
}

/* How much missing work a row is carrying, read off the hit that measured it rather than counted
   again here. A row whose missing rule did not fire is a row this sort has nothing to say about,
   and it goes to the bottom rather than being called zero. */
function missingOn(row) {
  const hit = row.hits.filter((h) => h.ruleId === 'missing-count')[0];
  return hit ? hit.numbers.missing : -1;
}

function leadFigure(row) {
  return signalFigure(row.lead) || { value: 0, text: '', unit: '', tone: 'flat' };
}

/*
  ONE COLUMN'S ROWS, DERIVED FROM THE BASE ROWS (WO-4.3).

  A shallow copy per column rather than a `lead` written onto the base row: the same student can be
  on both lists, and one row object cannot hold two leads. The copies share nothing that is written
  to — a base row is read-only from here down.

  THE RULE FILTER APPLIES TO THE COLUMN ITS RULE IS IN, and leaves the other column whole. Filtering
  to *absences* is a concern errand; emptying the praise half while she does it would bury the half
  of the screen this phase exists to protect, and it would do it for a reason a teacher never asked
  for. The same is true the other way round.

  AND THE FILTER MOVES THE LEAD as well as choosing the rows — WO-4.2's rule, unchanged: filtering
  to the attendance rules and then reading a headline about a grade would be the filter answering a
  question the teacher did not ask.
*/
function columnRows(base, direction) {
  const mine = filterRuleId && RULE_DIRECTION[filterRuleId] === direction ? filterRuleId : '';
  const out = [];
  base.forEach((row) => {
    const hits = row.hits.filter((hit) => hit.direction === direction);
    if (!hits.length) return;
    if (mine && !hits.some((hit) => hit.ruleId === mine)) return;
    const lead = mine ? hits.filter((hit) => hit.ruleId === mine)[0] : hits[0];
    out.push(Object.assign({}, row, { hits: hits, lead: lead,
      tags: hits.filter((hit) => hit !== lead) }));
  });
  return out;
}

/* How many rows that column would hold with no rule filter on it — the number a head would show
   before a chip was pressed. Counted off the base rows rather than by running columnRows() twice. */
function columnTotal(base, direction) {
  return base.filter((row) => row.hits.some((hit) => hit.direction === direction)).length;
}

/*
  THE ORDER THE CONCERN ROWS ARE DRAWN IN.

  THE DEFAULT IS THE ENGINE'S, NOT THIS FILE'S. `ruled` hands the lead hits straight to
  severityOrder() — the owner's severity ruling, which lives in src/signals.js because WO-6.4's
  glance panel and Phase 5's send flow inherit the same order and three surfaces sorting for
  themselves is three answers.

  The other three are this screen's, and each is a different question a teacher actually has:
  the biggest movement anywhere, her failing students together on a Friday, and who owes her the
  most work. None of them is written to a preference and none of them is what an arrival opens on.
*/
function order(rows) {
  if (sortBy === 'grade') {
    return rows.slice().sort((a, b) => {
      if (a.grade === b.grade) return 0;
      if (a.grade === null) return 1;
      if (b.grade === null) return -1;
      return a.grade - b.grade;
    });
  }
  if (sortBy === 'missing') {
    return rows.slice().sort((a, b) => missingOn(b) - missingOn(a));
  }
  if (sortBy === 'change') {
    /* A real change first, whatever rule produced it, then the counts — which is the drawing's own
       reading of "ranked by delta" and the one place this screen sorts across rules. A count and a
       change are not comparable and are never compared: `flat` sinks below every `down` and `up`
       before any number is looked at. */
    return rows.slice().sort((a, b) => {
      const fa = leadFigure(a);
      const fb = leadFigure(b);
      const movedA = fa.tone === 'flat' ? 0 : 1;
      const movedB = fb.tone === 'flat' ? 0 : 1;
      if (movedA !== movedB) return movedB - movedA;
      return Math.abs(fb.value || 0) - Math.abs(fa.value || 0);
    });
  }
  const leads = severityOrder(rows.map((row) => row.lead));
  return leads.map((hit) => rows.filter((row) => row.lead === hit)[0]).filter(Boolean);
}

/*
  THE ORDER THE PRAISE ROWS ARE DRAWN IN, AND THERE IS ONLY ONE OF IT.

  praiseOrder() is the engine's — banded by rule, biggest figure inside the band — and this column
  has no alternative to offer, which is the point rather than an omission. The sort control's other
  three options are *the biggest change* (which is already this), *lowest grade* and *most missing
  work*; the only praise reading of the last two is "top of the class", and a praise list that can be
  re-sorted into the top of the class is a praise list that will be, on the Friday a teacher is in a
  hurry. What protects the phase's argument on the concern side is which option the list OPENS on;
  what protects it here is that the wrong option does not exist.
*/
function orderPraise(rows) {
  const leads = praiseOrder(rows.map((row) => row.lead));
  return leads.map((hit) => rows.filter((row) => row.lead === hit)[0]).filter(Boolean);
}

/*
  THE WHOLE OF WHAT IS ON SCREEN, AS DATA, WITH NO DOM IN IT.

  The same build-it / hand-it-over split src/calendar-view.js's calendarModel() and
  src/detail.js's detailModel() make, and for both of their reasons. Every decision about which
  student is on this list, in what order, with which sentence leading, is made once here — and it
  can be asserted without a check that also has to be right about markup. tools/verify-shell.mjs
  reads this and then reads the DOM as well, so a model that is right about a list nobody drew
  still fails.

  NOTHING FROM A STUDENT'S SUPPORT BLOCK IS ON THIS SHAPE and there is no path to one: a row holds a
  name, a class, an avatar colour, a grade and the hits, and a hit's whole vocabulary is grades,
  scores, marks, meetings and the sentences built from them (src/signals.js's header).
*/
export function signalsModel() {
  const doc = getDoc();
  const blocked = presentationMode();
  const classes = getActiveClasses();
  /* A class archived behind this screen cannot leave the filter pointing at it — the same
     resolution src/calendar-view.js gives, and the same one src/classes.js gives a stale
     `openClassId`. */
  if (filterClassId && !classes.some((c) => c.id === filterClassId)) filterClassId = '';

  /* Nothing is evaluated at all while the mode is on. The refusal is not a filter over a list that
     was built anyway: a list that exists in memory is a list a later screen can render. And the
     quiet middle inherits that refusal rather than testing for it — there is one asker of
     presentationMode() on this screen and it is the line above (src/supports.js owns the rule). */
  const pass = blocked || !doc ? { rows: [], held: [], quiet: [] } : collect(doc);
  const all = pass.rows;

  /* The chips count STUDENTS, not hits, and they count them BEFORE the rule filter is applied — a
     chip whose number changed when you pressed it would be a chip nobody could use to compare two
     rules. */
  const counts = Object.create(null);
  all.forEach((row) => {
    const seen = Object.create(null);
    row.hits.forEach((hit) => {
      if (seen[hit.ruleId]) return;
      seen[hit.ruleId] = true;
      counts[hit.ruleId] = (counts[hit.ruleId] || 0) + 1;
    });
  });

  /* BOTH DIRECTIONS SINCE WO-4.3, concern chips first and each group in its own table's order —
     `rank` is the rule's position within its direction (src/signals.js), so the praise chips read
     biggest-climb-first exactly as the column under them does. A rule nobody tripped still gets no
     chip: a control that empties the screen is not worth a strip position. */
  const chipsFor = (direction) => signalRules()
    .filter((rule) => rule.direction === direction && counts[rule.id])
    .sort((a, b) => a.rank - b.rank)
    .map((rule) => ({ id: rule.id, direction: direction, text: rule.text,
      count: counts[rule.id] }));
  const rules = chipsFor('concern').concat(chipsFor('praise'));

  const concern = columnRows(all, 'concern');
  const praise = columnRows(all, 'praise');

  return {
    blocked: blocked,
    classId: filterClassId,
    ruleId: filterRuleId,
    sort: sortBy,
    classes: classes.map((cls) => ({ id: cls.id, name: cls.name })),
    rules: rules,
    /* THE TWO COLUMNS, SYMMETRICAL — same fields, same meanings, so a reader of either half is a
       reader of both. `count` is what is on screen and `total` is what the column holds with no
       rule filter on it; the two differ the moment a chip is pressed, and the one a teacher is
       looking at is the list in front of her. */
    concern: {
      rows: order(concern),
      count: concern.length,
      total: columnTotal(all, 'concern'),
      note: SORT_NOTES[sortBy] || SORT_NOTES[RULED],
      /* WHAT THE COOLDOWN TOOK OUT OF THIS COLUMN, and it is on the model rather than counted from
         the rows for the acceptance line's own reason: a suppressed hit is RECOVERABLE and COUNTED,
         never silently dropped, and a number the screen could only get by subtracting two other
         numbers is a number nobody can put a name to. */
      suppressed: pass.held.filter((row) => row.direction === 'concern'),
      expanded: expanded.concern,
    },
    praise: {
      rows: orderPraise(praise),
      count: praise.length,
      total: columnTotal(all, 'praise'),
      note: PRAISE_NOTE,
      suppressed: pass.held.filter((row) => row.direction === 'praise'),
      expanded: expanded.praise,
    },
    /* THE THIRD LIST, AND IT IS NOT A THIRD COLUMN (the drawing, and the owner's 2026-08-20
       ruling). It is ranked by how long it has been rather than by how much changed, which is a
       different question with a different unit, and it is drawn as a panel under the pair. */
    quiet: { rows: pass.quiet, count: pass.quiet.length },
    /* Every base row, both directions, unfiltered — what the card is built from. It is here rather
       than re-collected because opening a card would otherwise be a second full evaluation, and
       because the card must show a student's whole picture even when a rule chip has narrowed the
       column she was tapped in. */
    all: all,
    inert: inertRules(),
  };
}

/* ────────────────────────────── drawing it ────────────────────────────── */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function classNameOf(id) {
  const cls = getActiveClasses().filter((c) => c.id === id)[0];
  return cls ? cls.name : '';
}

/*
  ONE ROW, AND IT IS A <button>.

  Every row goes to the same place — the card — which is WO-6.4's rule about the glance page
  applied here: a row that goes somewhere and a row that does not must not look alike, and the way
  to guarantee that is for there to be no second kind. It gets a control's keyboard path for free,
  and the focus ring src/shell.css draws on :focus-visible and nothing in this repo suppresses.

  THE SENTENCE IS NOT TRUNCATED. src/signals-view.css leaves room for the longest one a rule can
  write, and a renderer that cut the string would take the whole explanation away from a screen
  reader and from find-in-page as well as from the eye.
*/
function rowButton(row) {
  const figure = leadFigure(row);
  const button = el('button', 'sig-row');
  button.type = 'button';
  button.setAttribute('data-signal-row', row.key);

  const avatar = el('span', 'avatar ' + row.avatar, initials(row.name));
  avatar.setAttribute('aria-hidden', 'true');
  button.append(avatar);

  const main = el('span', 'sig-row-main');
  const name = el('span', 'sig-row-name');
  name.append(document.createTextNode(row.name));
  name.append(el('span', 'sig-row-class', row.className));
  main.append(name);
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

  /* The whole row said in one string, because a screen reader reading the pieces of a button in
     document order gets "RE Ruth Egan Anatomy 5 absences in the last 20 recorded meetings — 4 or
     more 5 absences ›", and the sentence is the part that matters. */
  button.setAttribute('aria-label', row.lead.explanation + ' Opens why ' + row.name
    + ' is on this list.');
  return button;
}

/*
  WHO A CONTACT WENT TO, in the words a suppressed row says it in.

  `audience` IS AN ENUM AND THIS IS THE ONLY PLACE IT BECOMES A SENTENCE — the same arrangement
  every other vocabulary in this app has, and the reason it is a small table rather than four
  branches: a value this build has never heard of falls through to a sentence that names no
  recipient rather than to `undefined`, which is what a restored file from a later build would
  otherwise put on the screen.

  NOTHING ELSE OF THE ENTRY REACHES HERE. src/signals.js hands the screen a date and this enum and
  nothing more — no subject, no body — so this function could not print what a teacher wrote if it
  wanted to.
*/
const AUDIENCE_TEXT = {
  guardian: 'their guardian', counselor: 'their counselor',
  admin: 'an administrator', student: 'them',
};

/*
  THE SENTENCE UNDER A SUPPRESSED NAME, and it is the screen's rather than a rule's — which is a
  departure from this file's header and is deliberate.

  The header's rule is that every line of prose under a name is `hit.explanation`, so that an
  explanation cannot drift from the arithmetic behind it. That rule is unbroken: the hit's own
  sentence is printed FIRST and unchanged, and what this adds after it is a fact about the APP's
  behaviour — you wrote about this, and here is when it comes back — which no rule measured and
  none could. It also must not live on the hit: `hit.explanation` is drafted into mail through
  WO-5.1's `{{signals.list}}`, and an email home that opened "you emailed his guardian about this on
  Sep 6" would be the cooldown's bookkeeping arriving in a guardian's inbox.
*/
function cooldownWhy(row) {
  const who = AUDIENCE_TEXT[row.audience] || '';
  const when = row.days === 0 ? 'today'
    : row.days === 1 ? 'yesterday'
      : 'on ' + (shortDate(row.on) || row.on) + ', ' + row.days + ' days ago';
  return (who ? 'You wrote to ' + who + ' about this ' : 'You wrote about this ') + when
    + '. Back on the list on ' + (shortDate(row.until) || row.until) + '.';
}

/*
  ONE SUPPRESSED ROW, AND IT IS NOT A BUTTON.

  The whole point of the cooldown is that this student is not being asked for again yet, so the row
  STATES the fact and the contact that caused it; the one thing on it that acts is the control at
  its end. That is design/mockups/proposed-phase4.css's ruling at its own class, and it is also what
  makes *Write anyway* survivable — quiet, small, at the end of a muted row, behind an expansion the
  teacher opened on purpose. Three deliberate acts against one tap for the rows the engine wants
  read.

  IT NAMES THE CONTACT AND THE DATE SHE COMES BACK, which is the Surface deliverable in as many
  words: "3 suppressed" with no names is indistinguishable from a list that has quietly lost three
  students.
*/
function mutedRow(row) {
  const box = el('div', 'sig-muted');
  box.setAttribute('data-signal-held', row.key);

  const avatar = el('span', 'avatar ' + row.avatar, initials(row.name));
  avatar.setAttribute('aria-hidden', 'true');
  box.append(avatar);

  const main = el('span', 'sig-row-main');
  const name = el('span', 'sig-row-name');
  name.append(document.createTextNode(row.name));
  name.append(el('span', 'sig-row-class', row.className));
  main.append(name);
  main.append(el('span', 'sig-row-why', row.hit.explanation + ' ' + cooldownWhy(row)));
  box.append(main);

  const undo = el('button', 'sig-undo', 'Write anyway');
  undo.type = 'button';
  undo.setAttribute('data-signal-undo', row.key);
  /* Three buttons all called "Write anyway" is three controls a screen reader cannot tell apart,
     which is the same failure the row button's own aria-label fixes one list up. */
  undo.setAttribute('aria-label', 'Write anyway about ' + row.name + ' — '
    + ruleText(row.hit.ruleId).toLowerCase() + ', in ' + row.className);
  box.append(undo);
  return box;
}

/*
  THE FOOT OF A COLUMN THE COOLDOWN TOOK ROWS OUT OF: the count, and the door onto it.

  IT SAYS THE COUNT IN BOTH STATES, open and closed, because the acceptance line is that a
  suppressed hit is COUNTED as well as recoverable — a control that stopped saying how many once you
  opened it would be a count you had to close the thing to read.

  IT SAYS WHY IN PLAIN WORDS AND NOT "COOLDOWN". The teacher never set a thing called a cooldown;
  what she did was write to somebody recently, and that is what the button says.
*/
function paintHidden(column, buttonId, listId) {
  const button = document.getElementById(buttonId);
  const list = document.getElementById(listId);
  const rows = column.suppressed || [];
  if (button) {
    button.classList.toggle('hidden', rows.length === 0);
    button.setAttribute('aria-expanded', column.expanded ? 'true' : 'false');
    button.textContent = rows.length + ' you wrote about recently · '
      + (column.expanded ? (rows.length === 1 ? 'hide it' : 'hide them')
        : (rows.length === 1 ? 'show it' : 'show them'));
  }
  if (list) {
    list.textContent = '';
    const open = rows.length > 0 && column.expanded;
    list.classList.toggle('hidden', !open);
    if (open) rows.forEach((row) => list.append(mutedRow(row)));
  }
}

/*
  ONE COLUMN: its head, its rows, and the quiet line that stands in for them when it has none.

  BOTH COLUMNS GO THROUGH THIS, which is what stops the praise half becoming the concern half with
  different words in it — one function means one row shape, one head shape and one empty rule, and a
  change to either column is a change to both. The head says what the column is ordered by OUT LOUD
  because a ranking a teacher has to infer is a ranking she will infer wrongly, and on the praise
  side that inference is *the top of the class*, which is the whole thing this phase exists to
  refuse (design/mockups/signals.html).
*/
function paintColumn(headId, label, column, list, emptyId, hiddenId, heldListId) {
  const head = document.getElementById(headId);
  if (head) {
    head.textContent = '';
    head.append(document.createTextNode(label + ' · ' + column.count));
    head.append(el('span', 'sig-col-note', column.note));
  }
  if (list) {
    list.textContent = '';
    column.rows.forEach((row) => list.append(rowButton(row)));
  }
  const empty = document.getElementById(emptyId);
  /* The copy is in index.html and is not written here: it is the part a teacher actually reads, and
     it should be revisable without opening a JavaScript file (the install banner's rule, and the
     calendar's). What this owns is whether it is on screen. */
  if (empty) empty.classList.toggle('hidden', column.rows.length > 0);
  paintHidden(column, hiddenId, heldListId);
}

/* Paint the screen from the open document. Called on every arrival and from the chains in
   src/shell.js that can change what is on this list — a threshold typed, a threshold reset, a
   score, a mark, a class or a term. Not subscribed to the store, for the reason src/home.js gives
   about the cards: a subscriber fires on every save, and redrawing a screen while a teacher is
   typing into a dialog over it is how focus gets taken out from under her. */
export function renderSignals() {
  const list = document.getElementById(LIST_ID);
  if (!list) return;
  const model = signalsModel();

  const column = document.getElementById(COLUMN_ID);
  const blocked = document.getElementById(BLOCKED_ID);
  if (blocked) blocked.classList.toggle('hidden', !model.blocked);
  /* The toolbars go with the list. A filter strip over a refusal is a control that changes nothing
     a teacher can see, which reads as a screen that is broken rather than one that is closed. */
  document.querySelectorAll('#signalsView .sig-toolbar').forEach((strip) => {
    strip.classList.toggle('hidden', model.blocked);
  });

  paintClassFilter(model);
  paintRuleFilter(model);
  paintSort(model);

  paintColumn(HEAD_ID, 'Concern', model.concern, list, CONCERN_EMPTY_ID,
    CONCERN_HIDDEN_ID, CONCERN_QUIET_ID);
  paintColumn(PRAISE_HEAD_ID, 'Praise', model.praise,
    document.getElementById(PRAISE_LIST_ID), PRAISE_EMPTY_ID,
    PRAISE_HIDDEN_ID, PRAISE_QUIET_ID);

  /*
    THE BIG EMPTY STATE IS FOR A SCREEN WITH NOTHING ON EITHER SIDE, and a column that is empty
    while the other is not gets a quiet line inside its own head instead. The two facts are
    different: "every rule ran and none fired" is a good day worth a paragraph, and "nobody is
    climbing this week" is one column's news that must not take the other column off the screen to
    tell. Drawn in that order, so the columns come down only when both are silent.
  */
  /* AND A SUPPRESSED ROW KEEPS THE COLUMNS UP (WO-4.5). "Every rule ran and none fired" is a good
     day worth a paragraph; a screen that said it over two rows the cooldown had just silenced would
     be telling a teacher nobody is flagged while holding the names of the students who are. */
  const nothing = model.concern.rows.length === 0 && model.praise.rows.length === 0
    && model.concern.suppressed.length === 0 && model.praise.suppressed.length === 0;
  if (column) column.classList.toggle('hidden', model.blocked || nothing);
  const empty = document.getElementById(EMPTY_ID);
  if (empty) empty.classList.toggle('hidden', model.blocked || !nothing);
  const lead = document.getElementById(EMPTY_LEAD_ID);
  if (lead) {
    const cls = model.classId ? classNameOf(model.classId) : '';
    /* THE SENTENCE NAMES THE COLUMN THE FILTERED RULE BELONGS TO (WO-4.3). "Nobody is flagged for a
       run of strong scores" is a screen telling a teacher the wrong thing about a good result. */
    const praiseRule = model.ruleId && RULE_DIRECTION[model.ruleId] === 'praise';
    lead.textContent = model.ruleId
      ? (praiseRule ? 'Nobody is praised for ' : 'Nobody is flagged for ')
        + ruleText(model.ruleId).toLowerCase() + (cls ? ' in ' + cls : '') + '.'
      : 'Nobody is flagged and nobody is climbing right now'
        + (cls ? ' in ' + cls : '') + '.';
  }

  paintQuiet(model);
  paintInert(model);
}

/*
  HOW LONG IT HAS BEEN, in the slot the delta holds on the other two lists.

  QUIET GREY AND NEVER RED OR GREEN, which is the stylesheet's ruling and the reason this list is
  not a third column: there is no direction to a silence. A student nobody has written about in
  forty days is neither falling nor climbing, and that is precisely why no threshold produces her.

  `days === null` IS NOT ZERO AND IS NOT DRAWN AS ONE. It is the engine's answer for a class whose
  term carries no dates and a student nothing has ever been written about — there is no clock to
  read, and a `0 days` there would say something happened today.
*/
function sinceFigure(row) {
  const box = el('span', 'sig-since');
  if (row.days === null) {
    box.append(document.createTextNode('Nothing'));
    box.append(el('span', 'sig-delta-unit', 'ever written'));
    return box;
  }
  box.append(document.createTextNode(row.days + (row.days === 1 ? ' day' : ' days')));
  box.append(el('span', 'sig-delta-unit', 'since anything'));
  return box;
}

/*
  ONE QUIET ROW, AND IT IS A `.sig-row` LIKE EVERY OTHER ROW ON THIS SCREEN — same avatar, same
  name-and-sentence block, same chevron, a different figure on the end. A row that goes somewhere
  and a row that does not must not look alike, and the way to guarantee that is for there to be no
  second kind (WO-6.4's rule, applied here as it is one list up).

  WHERE IT GOES IS THE STUDENT'S RECORD AND NOT THE SIGNAL CARD, and that is the one place this row
  parts company with the two columns. The card answers "why is this student on the list", and the
  whole of what is true about a quiet student is that she is on no list; the thing that resolves
  "I have lost track of her" is her record. src/shell.js owns where the tap goes, as it owns every
  other order-of-operations answer in this app.
*/
function quietRow(row) {
  const button = el('button', 'sig-row');
  button.type = 'button';
  button.setAttribute('data-signal-quiet', row.key);

  const avatar = el('span', 'avatar ' + row.avatar, initials(row.name));
  avatar.setAttribute('aria-hidden', 'true');
  button.append(avatar);

  const main = el('span', 'sig-row-main');
  const name = el('span', 'sig-row-name');
  name.append(document.createTextNode(row.name));
  name.append(el('span', 'sig-row-class', row.className));
  main.append(name);
  main.append(el('span', 'sig-row-why', row.explanation));
  button.append(main);

  button.append(sinceFigure(row));
  const go = el('span', 'sig-row-go', '›');
  go.setAttribute('aria-hidden', 'true');
  button.append(go);

  button.setAttribute('aria-label', row.explanation + ' Opens ' + row.name + '\u2019s record.');
  return button;
}

/*
  THE QUIET MIDDLE, DRAWN — a panel under the two columns, on this same screen (the owner,
  2026-08-20).

  ITS HEAD CARRIES THE COUNT IN THE WORDS WO-6.4 DRAWS ON THE GLANCE PAGE, `The quiet middle · N`,
  because that control is a door onto this panel and the two must not be one number apart.

  IT DOES NOT ASK presentationMode(). The panel goes down with the rest of the screen because
  `model.blocked` is the one answer this view took, one function up — a second test here is the
  second opinion tools/wo-sweep.mjs counts.
*/
function paintQuiet(model) {
  const panel = document.getElementById(QUIET_ID);
  if (!panel) return;
  panel.classList.toggle('hidden', model.blocked);

  const head = document.getElementById(QUIET_HEAD_ID);
  if (head) {
    head.textContent = model.quiet.count
      ? 'The quiet middle · ' + model.quiet.count : 'The quiet middle';
  }
  const list = document.getElementById(QUIET_LIST_ID);
  if (list) {
    list.textContent = '';
    model.quiet.rows.forEach((row) => list.append(quietRow(row)));
  }
  const empty = document.getElementById(QUIET_EMPTY_ID);
  if (empty) empty.classList.toggle('hidden', model.quiet.rows.length > 0);
}

/*
  "All classes" and one chip per active class, rebuilt from the document on every paint — so a class
  archived behind this screen cannot leave a chip pointing at it. `.pill` is worn as shipped and NOT
  put inside a `data-pill-group`: that container hands the single-select to src/shell.js's generic
  handler, and this strip is repainted from the model on every tap, so two things would be moving
  one `.active` class between them.
*/
function paintClassFilter(model) {
  const host = document.getElementById(CLASSES_ID);
  if (!host) return;
  host.textContent = '';
  const add = (id, label, title) => {
    const button = el('button', 'pill' + (model.classId === id ? ' active' : ''), label);
    button.type = 'button';
    button.setAttribute('data-signals-filter', id);
    button.setAttribute('aria-pressed', model.classId === id ? 'true' : 'false');
    button.title = title;
    host.append(button);
  };
  add('', 'All classes', 'Show every class on this list');
  model.classes.forEach((cls) => add(cls.id, cls.name, 'Show only ' + cls.name));
}

/*
  ONE CHIP PER RULE THAT ACTUALLY FIRED, in the ruled order, each with how many students it caught.

  A chip for a rule nobody tripped is a control that empties the screen, so the strip is drawn from
  what came back rather than from the registry — which also means the strip says, at a glance, which
  rules are doing any work this week. The words are src/signals.js's ruleText(), which is the same
  string the thresholds panel prints beside the field that tunes it.
*/
function paintRuleFilter(model) {
  const host = document.getElementById(RULES_ID);
  if (!host) return;
  host.textContent = '';
  const add = (id, label, title) => {
    const button = el('button', 'pill' + (model.ruleId === id ? ' active' : ''), label);
    button.type = 'button';
    button.setAttribute('data-signals-rule', id);
    button.setAttribute('aria-pressed', model.ruleId === id ? 'true' : 'false');
    button.title = title;
    host.append(button);
  };
  add('', 'All rules', 'Show every rule that fired');
  /* The title says which COLUMN the chip narrows, because that is the half of the behaviour a
     teacher cannot see until she presses it: a praise chip leaves the concern list exactly as it
     was, and the other way round. */
  model.rules.forEach((rule) => add(rule.id, rule.text + ' · ' + rule.count,
    rule.direction === 'praise'
      ? 'Show only the students ' + rule.text.toLowerCase() + ' praised — the concern list stays'
      : 'Show only the students ' + rule.text.toLowerCase() + ' caught — the praise list stays'));
}

/* Which option the <select> is showing. The options themselves are markup — this screen's fixed
   control, and a renderer that rebuilt them would move a control out from under a thumb mid-tap. */
function paintSort(model) {
  const select = document.getElementById(SORT_ID);
  if (select) select.value = model.sort;
}

/*
  A RULE THAT CANNOT FIRE YET SAYS SO — WO-4.2's last acceptance line.

  Written from src/signals.js's inertRules() rather than from a sentence typed here, which is what
  makes it disappear of its own accord on the day WO-4.4 lands: that work order deletes one line in
  the rule and this notice goes with it. It is quiet grey and not amber, because nothing is wrong,
  and it sits inside the panel rather than in an empty state, because the list above it is working.

  It is drawn even when the list is empty and hidden when the mode is on, in that order: "no rule
  fired" and "one rule is not running" are two different facts and a teacher reading an empty list
  is owed both, while a refused screen says one thing only.
*/
function paintInert(model) {
  const line = document.getElementById(INERT_ID);
  if (!line) return;
  const show = !model.blocked && model.inert.length > 0;
  line.classList.toggle('hidden', !show);
  if (!show) { line.textContent = ''; return; }
  line.textContent = (model.inert.length === 1 ? 'One rule is not running yet: '
    : model.inert.length + ' rules are not running yet: ')
    + model.inert.map((rule) => rule.text.toLowerCase() + ' — ' + rule.why).join(' ')
    + ' Nothing above is affected.';
}

/* ────────────────────────────── the card ──────────────────────────────

   ONE STUDENT, EVERY RULE SHE TRIPPED, AND THE ARITHMETIC UNDER EACH SENTENCE.

   THE LABELS ARE THIS SCREEN'S AND THE NUMBERS ARE THE RULE'S, which is the whole of what this
   block does with a hit. A key nothing below names prints under its own name rather than being
   dropped: a rule added by WO-4.3 or WO-4.4 shows its evidence on this card with no edit here, and
   the failure mode of the other choice is a card that silently stops showing half of why somebody
   is on the list.
*/
const EVIDENCE = {
  percentage: 'grade', below: 'the line', fell: 'fell by', points: 'the line',
  before: 'before', after: 'after', assignments: 'window', asked: 'asked for',
  run: 'in a row', need: 'the line', under: 'each under', scores: 'the scores',
  lowest: 'lowest', missing: 'marked missing', absences: 'absences',
  meetings: 'recorded meetings', attended: 'attended', percent: 'attendance',
  atLeast: 'the line', tardies: 'tardies', entries: 'entries', days: 'days',
  /* WO-4.3's three. `cleared` is how many concern rules were firing at the far edge of the
     turnaround window and are not firing now — a count of RULES, which is why it takes the plain
     formatter and not the percentage one. */
  rose: 'rose by', highest: 'highest', cleared: 'rules cleared',
};

/* A measured percentage takes the app's own two-decimal formatter; a line a teacher typed takes
   formatWeight(), which prints it the way she typed it. Which one a number takes is decided by
   where the number came from — src/signals.js's import block sets that rule and this follows it. */
const MEASURED_PERCENT = ['percentage', 'before', 'after', 'percent', 'lowest', 'highest'];
const LINE_PERCENT = ['below', 'under', 'atLeast'];

function evidenceText(key, value) {
  if (Array.isArray(value)) return value.map((v) => formatPercent(v)).join(' · ');
  if (MEASURED_PERCENT.indexOf(key) >= 0) return formatPercent(value);
  if (LINE_PERCENT.indexOf(key) >= 0) return formatWeight(value) + '%';
  return formatWeight(value);
}

function evidenceRow(numbers) {
  const box = el('div', 'sig-card-ev');
  Object.keys(numbers).forEach((key) => {
    const item = el('span', 'sig-card-ev-item', (EVIDENCE[key] || key) + ' ');
    item.append(el('b', '', evidenceText(key, numbers[key])));
    box.append(item);
  });
  return box;
}

function cardRule(doc, hit) {
  const box = el('div', 'sig-card-rule ' + hit.direction);
  box.append(el('div', 'sig-card-rule-why', hit.explanation));
  box.append(evidenceRow(hit.numbers));
  /* Named as HERS, because an absent threshold key IS its default and a card that showed a number
     without saying it is adjustable teaches a teacher that the app has opinions she cannot argue
     with. The door is the Thresholds button in the actions below rather than a link inside this
     line: one route onto that panel, more doors. */
  box.append(el('div', 'sig-card-thresh', 'Your threshold: ' + ruleThresholdText(doc, hit.ruleId)));
  return box;
}

function cardActions() {
  const box = el('div', 'sig-card-acts');
  const grades = el('button', 'sig-card-act', 'Open their grades');
  grades.type = 'button';
  grades.setAttribute('data-signal-card-detail', '');
  box.append(grades);

  const thresholds = el('button', 'sig-card-act', 'Thresholds');
  thresholds.type = 'button';
  thresholds.setAttribute('data-signal-panel', '');
  thresholds.setAttribute('aria-haspopup', 'dialog');
  box.append(thresholds);

  /* Phase 5's whole presence on this card, and THE DOOR IS OPEN (WO-5.3, 2026-08-28). It was drawn
     disabled at WO-4.2 so that the shape of the card would not have to change when outreach landed,
     and it did not: one attribute replaced `disabled` and the title, and nothing else on this card
     moved. Where it goes is resolved in src/shell.js, which is where the order things happen in is
     stated — this screen does not know what a draft is. */
  const draft = el('button', 'sig-card-act', 'Draft an email');
  draft.type = 'button';
  draft.setAttribute('data-signal-card-draft', '');
  box.append(draft);
  return box;
}

/*
  THE BASE ROW BEHIND A TAP, and it is read off `model.all` rather than off either column since
  WO-4.3. A student on both lists has one card, carrying every rule she tripped in both directions —
  which is WO-4.1's "a student can be on both at once, and that is information rather than a bug"
  arriving where a teacher can act on it. Tapping her name in either column opens the same card, so
  the concern half of a climbing student cannot be hidden by the column she was tapped in.
*/
function rowFor(key) {
  return signalsModel().all.filter((row) => row.key === key)[0] || null;
}

/*
  THE ROW BEHIND THE OPEN CARD, AS A DRAFT'S FOUR FACTS (WO-5.3) — the student, her class, the term
  and the hits. Read by src/shell.js on the way to the send flow and by nothing else.

  THE HITS ARE THE ONES ALREADY ON THE ROW rather than a second evaluate() pass. The draft speaks
  from the signals the card in front of the teacher is drawn from — `{{grade.delta}}` reads one of
  them — and a fresh pass would answer about the document as it stands now, which is a different
  question from the one she tapped. src/merge-fields.js's contextOf() states the same rule from the
  far end.
*/
export function openCardTarget() {
  const row = rowFor(openCardKey);
  if (!row) return null;
  return { studentId: row.studentId, classId: row.classId,
    termId: getOpenTermId(row.classId), hits: row.hits };
}

/*
  OPEN THE CARD FOR ONE ROW. The list stays exactly where it is behind it — that is the reason this
  is a modal and not a seventh view (plans/gradebook-surfaces.md), and the reason the row is a
  button rather than a link.

  It re-reads the model rather than trusting what was drawn, so a card opened on a stale row — one
  whose student came off the list while a dialog was open over it — has nothing to draw and says
  so by not opening at all.
*/
export function openSignalCard(key, opener) {
  const row = rowFor(String(key || ''));
  const body = document.getElementById(CARD_BODY_ID);
  if (!row || !body) return false;
  const doc = getDoc();
  openCardKey = row.key;

  const title = document.getElementById(CARD_TITLE_ID);
  if (title) title.textContent = row.name;

  body.textContent = '';
  const hero = el('div', 'sig-card-hero');
  const avatar = el('span', 'avatar ' + row.avatar, initials(row.name));
  avatar.setAttribute('aria-hidden', 'true');
  hero.append(avatar);
  const who = el('div', 'sig-card-who');
  who.append(el('div', 'sig-card-name', row.name));
  who.append(el('div', 'sig-card-sub', row.className + (row.termLabel ? ' · ' + row.termLabel : '')
    + ' · ' + row.hits.length + (row.hits.length === 1 ? ' rule fired' : ' rules fired')));
  hero.append(who);
  /* The current grade in the quiet position, on purpose: it is context for the delta rather than
     the reason this student is on the list, and drawing it big would put the level back in charge
     of a screen built to replace it. */
  const grade = el('div', 'sig-card-grade',
    row.grade === null ? 'No grade yet' : formatPercent(row.grade));
  if (row.grade !== null && row.letter) {
    grade.append(document.createElement('br'));
    grade.append(document.createTextNode(row.letter));
  }
  hero.append(grade);
  body.append(hero);

  body.append(el('div', 'modal-section-label', 'Why they are on the list'));
  row.hits.forEach((hit) => body.append(cardRule(doc, hit)));

  body.append(el('div', 'modal-section-label', 'What to do'));
  body.append(cardActions());

  openModal(CARD_MODAL_ID, opener);
  return true;
}

/* Which student the open card is about, read back for src/shell.js — which owns where a tap GOES,
   the way it owns every other order-of-operations answer in this app. This module knows who is on
   the card; it deliberately does not know how to open a class, and a renderer that did would have
   to import the navigation that imports it. */
export function signalCardTarget() {
  if (!openCardKey) return null;
  const parts = openCardKey.split('|');
  return { studentId: parts[0], classId: parts[1] || '' };
}

/* ────────────────────────────── the controls ──────────────────────────────

   Every one of these ends in a render and a spoken sentence, and none of them writes anything.
   What they change is which rows are on screen, which is a fact about this browser and this minute.
*/

/*
  ARRIVAL. Called by src/shell.js when this becomes the view in <main>, and not on a repaint — the
  same split src/calendar-view.js's resetCalendar() makes, and for the same reason: a teacher who
  has just filtered to one rule must not be put back on all of them because something behind her
  redrew the screen.

  EVERY ARRIVAL OPENS ON THE RULED ORDER AND ON EVERY RULE, and on the class the arrival is ABOUT —
  '' from the home screen's door, the open class from the Signals segment inside one. Recomputed
  here on every arrival rather than kept, which is what makes it the door rather than a memory.
*/
export function resetSignals(classId) {
  filterClassId = String(classId || '');
  sortBy = RULED;
  filterRuleId = '';
  openCardKey = '';
  /* AND THE COOLDOWN CLOSES AGAIN (WO-4.5). Both of these are the arrival rule above applied to the
     two controls this work order added: an expansion left open is a list that is not the list the
     engine wants read, and a *Write anyway* carried across an arrival is a suppression a teacher
     turned off once and cannot remember turning off. */
  expanded.concern = false;
  expanded.praise = false;
  Object.keys(writtenAnyway).forEach((key) => { delete writtenAnyway[key]; });
}

/* OPEN OR CLOSE ONE COLUMN'S SUPPRESSED ROWS. Nothing is written and nothing is remembered — what
   changes is which rows are on screen, which is a fact about this browser and this minute. */
export function toggleSuppressed(direction) {
  const which = direction === 'praise' ? 'praise' : 'concern';
  expanded[which] = !expanded[which];
  renderSignals();
  const model = signalsModel();
  const column = which === 'praise' ? model.praise : model.concern;
  announce(expanded[which]
    ? column.suppressed.length + ' you wrote about recently, shown.'
    : 'Hidden again.');
}

/*
  *WRITE ANYWAY* — the owner's ruling, 2026-08-20. The cooldown suggests; it does not hold the door
  shut.

  IT WRITES NOTHING. This screen has no update() in it and this control does not give it one: what
  it does is put one row back on the list for as long as this arrival lasts, which is the same kind
  of state the class filter and the sort are. A teacher who has just had a phone call has a real
  reason to write again, and a feature that told her she may not is one she routes around outside
  the app; a feature that recorded her decision in the year document would be a suppression she
  could not find to undo.
*/
export function writeAnyway(key) {
  const id = String(key || '');
  if (!id) return false;
  writtenAnyway[id] = true;
  renderSignals();
  announce('Back on the list.');
  return true;
}

/* Which student a quiet row is about, read back for src/shell.js — the same split
   signalCardTarget() makes, and for the same reason: this module knows who the row is about and
   deliberately does not know how to open a class. */
export function quietRowTarget(key) {
  const parts = String(key || '').split('|');
  return parts[0] ? { studentId: parts[0], classId: parts[1] || '' } : null;
}

export function setSignalsFilter(classId) {
  filterClassId = String(classId || '');
  renderSignals();
  const cls = filterClassId ? classNameOf(filterClassId) : '';
  announce(cls ? cls + ' only.' : 'Every class.');
}

export function setSignalsRule(ruleId) {
  filterRuleId = String(ruleId || '');
  renderSignals();
  announce(filterRuleId ? ruleText(filterRuleId) + ' only.' : 'Every rule.');
}

export function setSignalsSort(value) {
  const want = SORTS.indexOf(String(value)) >= 0 ? String(value) : RULED;
  if (want === sortBy) return;
  sortBy = want;
  renderSignals();
  announce('Sorted by ' + (SORT_NOTES[sortBy] || SORT_NOTES[RULED]) + '.');
}
