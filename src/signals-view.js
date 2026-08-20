/*
  Who needs you — the concern list, drawn (WO-4.2).

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

  ── WHAT IS HELD HERE, AND WHY NONE OF IT IS REMEMBERED ──

  Three values: which class the list is about, what it is sorted by, and which rule it is filtered
  to. None of the three is written to localStorage, and that is the owner's ruling of 2026-08-20
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
import { evaluate, severityOrder, signalFigure, signalRules, ruleText, ruleThresholdText,
  inertRules } from './signals.js';
/* The grade beside a name on the card, and the key the *Lowest grade* sort reads. It is the same
   engine every other grade in this app comes out of; nothing here sums a cell. */
import { weightedClassGrade } from './grade-engine.js';
import { formatPercent } from './scores.js';
import { formatWeight } from './categories.js';

const CLASSES_ID = 'signalsClasses';
const RULES_ID = 'signalsRules';
const SORT_ID = 'signalsSort';
const LIST_ID = 'signalsList';
const HEAD_ID = 'signalsConcernHead';
const COLUMN_ID = 'signalsConcern';
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

/* ── THE VIEW STATE ──
   Three values, none of them student data and none of them persisted — the header says why. */
let filterClassId = '';
let sortBy = RULED;
let filterRuleId = '';

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
  EVERY CONCERN HIT IN EVERY CLASS ON SCREEN, GROUPED ONE ROW PER STUDENT PER CLASS.

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
  classesShown().forEach((cls) => {
    const termId = getOpenTermId(cls.id);
    const term = getTerms(cls.id).filter((t) => t.id === termId)[0] || null;
    const hits = evaluate(doc, cls, termId).filter((hit) => hit.direction === 'concern');
    if (!hits.length) return;
    severityOrder(hits).forEach((hit) => {
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
  return rows;
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
  THE ORDER THE ROWS ARE DRAWN IN.

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
     was built anyway: a list that exists in memory is a list a later screen can render. */
  const all = blocked || !doc ? [] : collect(doc);

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

  const rules = signalRules()
    .filter((rule) => rule.direction === 'concern' && counts[rule.id])
    .sort((a, b) => a.rank - b.rank)
    .map((rule) => ({ id: rule.id, text: rule.text, count: counts[rule.id] }));

  /* THE RULE FILTER MOVES THE LEAD as well as choosing the rows. Filtering to the attendance rules
     and then reading a headline about a grade would be the filter answering a question the teacher
     did not ask; the sentence she is shown is the one from the rule she filtered to. */
  const shown = all.filter((row) => !filterRuleId
    || row.hits.some((hit) => hit.ruleId === filterRuleId));
  shown.forEach((row) => {
    row.lead = filterRuleId
      ? row.hits.filter((hit) => hit.ruleId === filterRuleId)[0]
      : row.hits[0];
    row.tags = row.hits.filter((hit) => hit !== row.lead);
  });

  return {
    blocked: blocked,
    classId: filterClassId,
    ruleId: filterRuleId,
    sort: sortBy,
    note: SORT_NOTES[sortBy] || SORT_NOTES[RULED],
    classes: classes.map((cls) => ({ id: cls.id, name: cls.name })),
    rules: rules,
    rows: order(shown),
    /* What the head counts: the rows on screen. The two numbers differ the moment a rule chip is
       pressed, and the one a teacher is looking at is the list in front of her. */
    count: shown.length,
    total: all.length,
    inert: inertRules().filter((rule) => rule.direction === 'concern'),
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
  if (column) column.classList.toggle('hidden', model.blocked);
  /* The toolbars go with the list. A filter strip over a refusal is a control that changes nothing
     a teacher can see, which reads as a screen that is broken rather than one that is closed. */
  document.querySelectorAll('#signalsView .sig-toolbar').forEach((strip) => {
    strip.classList.toggle('hidden', model.blocked);
  });

  paintClassFilter(model);
  paintRuleFilter(model);
  paintSort(model);

  const head = document.getElementById(HEAD_ID);
  if (head) {
    head.textContent = '';
    head.append(document.createTextNode('Concern · ' + model.count));
    head.append(el('span', 'sig-col-note', model.note));
  }

  list.textContent = '';
  model.rows.forEach((row) => list.append(rowButton(row)));

  const empty = document.getElementById(EMPTY_ID);
  if (empty) empty.classList.toggle('hidden', model.blocked || model.rows.length > 0);
  const lead = document.getElementById(EMPTY_LEAD_ID);
  if (lead) {
    const cls = model.classId ? classNameOf(model.classId) : '';
    lead.textContent = model.ruleId
      ? 'Nobody is flagged for ' + ruleText(model.ruleId).toLowerCase()
        + (cls ? ' in ' + cls : '') + '.'
      : 'Nobody is flagged right now' + (cls ? ' in ' + cls : '') + '.';
  }

  paintInert(model);
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
  model.rules.forEach((rule) => add(rule.id, rule.text + ' · ' + rule.count,
    'Show only the students ' + rule.text.toLowerCase() + ' caught'));
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
};

/* A measured percentage takes the app's own two-decimal formatter; a line a teacher typed takes
   formatWeight(), which prints it the way she typed it. Which one a number takes is decided by
   where the number came from — src/signals.js's import block sets that rule and this follows it. */
const MEASURED_PERCENT = ['percentage', 'before', 'after', 'percent', 'lowest'];
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

  /* Phase 5's whole presence on this card, and it is a door rather than a feature: WO-5.3 and
     WO-5.4 both reach for "the signal card" by name, and what this buys is that the shape of the
     card does not change when outreach lands. */
  const draft = el('button', 'sig-card-act', 'Draft an email');
  draft.type = 'button';
  draft.disabled = true;
  draft.title = 'Outreach arrives with Phase 5.';
  box.append(draft);
  return box;
}

function rowFor(key) {
  return signalsModel().rows.filter((row) => row.key === key)[0] || null;
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
