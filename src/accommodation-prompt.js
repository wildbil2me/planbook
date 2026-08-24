/*
  The accommodation prompt — the summary that appears in the assignment editor when the work being
  written down falls in a category somebody's accommodation applies to (WO-3.8).

  ── WHY IT EXISTS, AND WHY THIS IS THE MOMENT ──

  docs/data-model.md § Accommodations rule 3: *"Surfaced where the work happens. Creating a test
  prompts '3 students have extended time, 2 need a separate setting.' A list nobody opens protects
  nobody."* A teacher is legally obligated to implement an accommodation; a roster field she has to
  remember to open is a field she opens in September and not in March. So the prompt goes where the
  decision is made — in the dialog where a test is written down, at the moment its category is
  chosen — and it says how many, not who, until she asks.

  ── ITS OWN FILE, AND WHAT THAT BUYS ──

  Shaped like src/past-due.js, which is the same kind of thing one work order earlier: a prompt with
  a host in the markup, painted by the screen that wears it at the end of its own render, owning no
  navigation and knowing about no other surface. The reasons are the ones src/README.md gives for a
  feature per file, plus one that is specific to this feature: THIS IS THE ONLY PLACE OUTSIDE
  src/roster.js THAT READS A STUDENT'S `supports` BLOCK. Keeping it to one small file is what makes
  the standing sweep in tools/wo-sweep.mjs § 5 a short read rather than a hunt through a
  1,300-line screen module — src/assignments.js has no path to `student.supports` at all, and must
  not grow one.

  ── THE FOUR RULES THIS FILE IS BUILT OUT OF, none of which it decides for itself ──

  1. MAY ANY OF THIS BE ON SCREEN — src/supports.js's `supportsVisible()`, asked here and never
     re-implemented. In presentation mode this file paints NOTHING: not the names, not the sentence,
     not the count, not a collapsed box with a number in it. The host is emptied and hidden, because
     a count is itself a disclosure — "3 students have extended time" on a projected screen, in a
     room of thirty, beside a roster on the wall, narrows to individuals. WO-3.8's acceptance line
     says "not even the count" for that reason, and absent-from-the-DOM is the only reading of it
     that survives a screenshot tool, a find-in-page or the accessibility tree
     (src/supports.js's sensitiveValue() carries the long version).

  2. WHICH ACCOMMODATIONS APPLY — src/supports.js's `appliesToMatches()`, which owns the comparison
     between two pieces of teacher prose and the decision to lean toward showing. Nothing here
     re-derives it, and nothing here reads `appliesTo` directly.

  3. COUNTS BY DEFAULT, NAMES ON A DELIBERATE TAP — docs/data-model.md rule 1, the same shape
     src/roster.js's support panel takes: the dot is the indicator and the tap is the disclosure.
     Here the counts are the indicator and "Show which students" is the tap. THE NAMES RE-HIDE ON
     EVERY REPAINT — a category change, a re-opened dialog, a presentation-mode flip — for the
     reason src/roster.js's refreshSupportSurfaces() drops its reveal: a panel that sprang back open
     would be putting a student's file on screen without the deliberate tap the rule asks for.

  4. NOTHING HERE REACHES A PRINTOUT, AN EXPORT, A MERGE FIELD OR A LOG LINE. Every string that
     comes out of `supports` is written through `setSensitiveText()` rather than onto an element, so
     a caller cannot route one somewhere else; the three print gates already hide everything but
     their own surface (`body > * { display: none }`), and src/assignments.css carries one more
     `@media print` rule that hides this block whatever the gate says. There is no exporter here, no
     `console.*`, and the announcements below say that something is on screen without saying a word
     of what it says — which is src/roster.js's toggleSupports() rule and src/presentation.js's.

  ── WHAT IS DELIBERATELY NOT HERE ──

  No preference. Whether the names are showing is a fact about the last ten seconds, not about this
  browser, and src/prefs.js's list is the shorter for not carrying it — the same call
  src/past-due.js makes about its review. Nothing in this file writes to the year document either:
  it reads, counts, and draws.

  ── AND SINCE WO-4.4 THERE ARE TWO PROMPTS IN HERE, WHICH IS DELIBERATE ──

  The second is the ABSENCE prompt: mark a student absent once too often and the plan's attendance
  clause is offered, at the moment of use, on the registry. docs/data-model.md § Accommodations rule
  3 names both in one breath — *"Creating a test prompts '3 students have extended time'. Marking a
  student absent for the fourth time shows their plan has an attendance clause."* — so they are two
  instances of one rule rather than two features.

  THEY SHARE THIS FILE BECAUSE OF THE SENTENCE AT THE TOP OF IT: this is the only place outside
  src/roster.js that reads a student's `supports` block, and tools/wo-sweep.mjs § 5 is a short read
  because of it. A third module would have widened that set by a third for one paragraph of markup,
  and the paragraph is the same paragraph: the same `.accommodation-prompt` component, the same
  sentence-then-scope shape, the same single reveal, and the same one question asked of
  src/supports.js. What is NOT shared is state — two hosts, two `painted` records, two reveals — so
  neither prompt can put the other's content on screen.

  THE SECOND ONE READS THE SIGNAL ENGINE RATHER THAN COUNTING FOR ITSELF, and that is the owner's
  ruling of 2026-08-20 obeyed structurally: *N is the attendance rule's own N*, no new threshold key,
  so a teacher who loosens her attendance signal loosens this prompt with it. It runs one evaluate()
  pass for one student and looks for the `absence-window` hit — so the prompt fires exactly when the
  rule fires, and the two cannot come to disagree about which meetings were in the window either.
*/

import { announce } from './live-region.js';
/* The four rules above, in one import. `readSupports` rather than `supportsOf`, deliberately: this
   file only ever looks, and supportsOf() repairs a missing block in place — a mutation, however
   harmless, made by a prompt that is drawing itself. */
import {
  ACCOMMODATION_KINDS, accommodationsOf, appliesToMatches, attendanceClauseOf, kindLabel,
  readSupports, setSensitiveText, supportsVisible,
} from './supports.js';
/* WO-4.4's half. `evaluate` is the whole of the absence prompt's arithmetic — see the header — and
   nothing here re-counts an absence or reads a threshold for itself. The import runs one way:
   src/signals.js has never heard of this file and must not, because a rule that could reach a
   support block is the disclosure that module's own header refuses. */
import { evaluate } from './signals.js';
/* Which day the registry's writers will accept, and what the cell it just wrote says. Exported for
   src/attendance-report.js at WO-2.53 and read here for the second time: it answers the two things
   this prompt needs — the day a mark landed on and the code on it — without this file holding a
   second opinion about which column is writable. */
import { editableMark } from './attendance.js';
/* How a student's name reads in a list. Imported from src/roster.js for the reason src/past-due.js
   imports the same function: a second copy of those eight lines could be right about a hyphen, a
   suffix or a half-typed name in a way this one is not. The import runs one way — nothing in
   src/roster.js knows this file exists. */
import { fullName, rosterName } from './roster.js';
import { getDoc } from './store.js';

/* The screen that wears this prompt carries an empty host with this attribute, and this file paints
   every one it finds. One today — the assignment editor — and a second costs one element in the
   markup rather than a line here, which is the same contract `[data-past-due]` has with
   src/past-due.js and `[data-screen-nav]` has with src/screen-nav.js. */
const HOST_SEL = '[data-accommodation-prompt]';
/* The registry's own host, WO-4.4's. A different attribute rather than a second element carrying the
   first, so neither draw() can find the other's host and paint a category summary onto the marking
   screen. Markup, never a click target. */
const ABSENCE_HOST_SEL = '[data-absence-prompt]';

/* Whether the names are showing. Reset by every paint — see rule 3 in the header. */
let namesShown = false;

/*
  WHAT THE PROMPT IS ABOUT, held between the paint that computed it and the tap that expands it.
  Held as ids and plain strings rather than as objects out of the document, for the reason
  src/past-due.js gives about `previewed`: the document can be replaced underneath this module by a
  restore or a year switch, and an object held across that is work in a document nobody has open.

  `{ groups: [{ kind, clause, students: [{ id, name }] }], where: '' }`
*/
let painted = { groups: [], where: '' };

/* ────────────────────────────── the words ────────────────────────────── */

/*
  HOW EACH KIND READS IN THE SENTENCE, in the teacher's own register and written out rather than
  generated. docs/data-model.md's worked example is *"3 students have extended time, 2 need a
  separate setting."* — two different verbs in one sentence, because that is how the two facts read
  out loud, and a generated "2 students have separate setting" is the sentence that tells a teacher
  a computer wrote it. Twelve kinds is a table small enough to write once and read at a glance
  (design/style-guide.md §9: sentence case, the teacher's words).

  A KIND WITH NO ROW FALLS BACK RATHER THAN BREAKING. One on src/supports.js's list that nobody
  added here reads "N need <its label>"; one that is not on that list at all — from a hand-edited
  file or a later build — reads "N have an accommodation on file", which is true of every row that
  reaches this file and discloses nothing about which. Neither case can produce an empty clause.
*/
const KIND_CLAUSE = {
  'extended-time': { one: 'has extended time', many: 'have extended time' },
  'separate-setting': { one: 'needs a separate setting', many: 'need a separate setting' },
  'read-aloud': { one: 'needs it read aloud', many: 'need it read aloud' },
  calculator: { one: 'needs a calculator', many: 'need a calculator' },
  'reference-sheet': { one: 'needs a reference sheet', many: 'need a reference sheet' },
  'preferential-seating': { one: 'has preferential seating', many: 'have preferential seating' },
  breaks: { one: 'needs breaks', many: 'need breaks' },
  scribe: { one: 'needs a scribe', many: 'need a scribe' },
  'large-print': { one: 'needs large print', many: 'need large print' },
  chunked: { one: 'needs it chunked', many: 'need it chunked' },
  'check-ins': { one: 'needs check-ins', many: 'need check-ins' },
  other: { one: 'has something else on file', many: 'have something else on file' },
};
const UNKNOWN_CLAUSE = { one: 'has an accommodation on file', many: 'have an accommodation on file' };

function clauseFor(kind) {
  if (KIND_CLAUSE[kind]) return KIND_CLAUSE[kind];
  const label = kindLabel(kind);
  if (label) return { one: 'needs ' + label.toLowerCase(), many: 'need ' + label.toLowerCase() };
  return UNKNOWN_CLAUSE;
}

/* The sentence. The FIRST clause carries the word "students" and the rest carry only a number,
   which is what makes a two-part sentence read as one: *"3 students have extended time, 2 need a
   separate setting."* — the data model's own example, produced rather than approximated. */
function sentenceOf(groups) {
  return groups.map((group, i) => {
    const n = group.students.length;
    const verb = n === 1 ? group.clause.one : group.clause.many;
    if (i > 0) return n + ' ' + verb;
    return n + ' ' + (n === 1 ? 'student' : 'students') + ' ' + verb;
  }).join(', ') + '.';
}

/* ────────────────────────────── the set ────────────────────────────── */

function studentsIn(doc) { return doc && Array.isArray(doc.students) ? doc.students : []; }

/* A roster id that names nobody is dropped rather than counted — the same harmless failure
   src/past-due.js's rosterOf() describes, out of a restored or hand-edited document. */
function rosterOf(cls) {
  const doc = getDoc();
  const ids = cls && Array.isArray(cls.roster) ? cls.roster : [];
  return ids.map((id) => studentsIn(doc).filter((s) => s.id === id)[0]).filter(Boolean);
}

/*
  IS THIS ROW A ROW AT ALL. `newAccommodation()` writes an empty one the moment a teacher taps Add,
  and an empty row carries an empty `appliesTo` — which means "everything" and would therefore fire
  this prompt on every assignment in the year over a mis-tap. The test is `hasSupports()`'s own,
  restated because that function answers about a STUDENT and this question is about a ROW.
*/
function isRealRow(row) {
  return !!row && !!(row.kind || row.detail
    || (Array.isArray(row.appliesTo) && row.appliesTo.length > 0));
}

/*
  ONE WALK OF THE OPEN CLASS'S ROSTER — every student on it, every accommodation on file for them
  that applies to this category, grouped by kind.

  COUNTED IN STUDENTS AND NOT IN ROWS: a student carrying two extended-time rows is one student who
  needs extended time, and "4 students have extended time" over a roster of three is the kind of
  number that makes a teacher stop believing the prompt.

  THE ORDER IS src/supports.js's OWN LIST, never the counts. An order that moved as she typed would
  be a sentence that reads differently every time she opens the dialog, and the enumerated list is
  the order docs/data-model.md puts them in.
*/
function groupsFor(cls, categoryName) {
  if (!supportsVisible() || !cls) return [];
  const buckets = new Map();
  rosterOf(cls).forEach((student) => {
    const seen = new Set();
    accommodationsOf(readSupports(student)).forEach((row) => {
      if (!isRealRow(row) || !appliesToMatches(row.appliesTo, categoryName)) return;
      const kind = typeof row.kind === 'string' ? row.kind : '';
      if (seen.has(kind)) return;
      seen.add(kind);
      if (!buckets.has(kind)) buckets.set(kind, []);
      buckets.get(kind).push({ id: student.id, name: rosterName(student) });
    });
  });

  const order = ACCOMMODATION_KINDS.map((k) => k.value)
    .filter((value) => buckets.has(value))
    .concat([...buckets.keys()].filter((kind) => !ACCOMMODATION_KINDS.some((k) => k.value === kind)));
  return order.map((kind) => ({ kind: kind, clause: clauseFor(kind), students: buckets.get(kind) }));
}

/* Where these came from, in words, because a count with no scope on it is a count a teacher has to
   guess at. The second sentence is the one that answers "is this about to end up somewhere" before
   she has to ask — it is the same promise src/backup.js's panel makes about the file it writes. */
function whereOf(categoryName) {
  const scope = categoryName
    ? 'They apply to work in “' + categoryName + '”, which is where this assignment counts.'
    : 'They apply to every kind of work, and this assignment is not filed under a category yet.';
  return scope + ' This is on screen only — it is never printed, exported or put in a draft — and '
    + 'presentation mode hides it entirely.';
}

/* ────────────────────────────── the prompt ────────────────────────────── */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function countOf(groups) {
  const ids = new Set();
  groups.forEach((group) => group.students.forEach((student) => ids.add(student.id)));
  return ids.size;
}

/*
  ONE HOST, DRAWN FROM `painted` AND NOTHING ELSE — so the sentence, the button's label and the
  names cannot disagree about what this prompt is about, and so the tap that expands it does not
  have to walk the document again.

  EMPTY AND HIDDEN IS THE PRESENTATION-MODE STATE, and it is the same state as "nothing applies
  here": there is no third rendering with a number in it and no styling that only looks absent.
*/
function draw() {
  const hosts = Array.prototype.slice.call(document.querySelectorAll(HOST_SEL));
  const groups = supportsVisible() ? painted.groups : [];
  hosts.forEach((host) => {
    host.textContent = '';
    host.classList.toggle('hidden', !groups.length);
    if (!groups.length) return;

    const said = el('div', 'accommodation-prompt-said');
    /* Through setSensitiveText() rather than onto the element, for the reason src/roster.js gives
       at every one of its own support fields: this string is derived from `supports`, and the funnel
       is what makes "hidden in presentation mode" a property of the writing rather than of somebody
       having remembered the check above. Both are here on purpose. */
    const lead = el('span', 'accommodation-prompt-lead');
    setSensitiveText(lead, sentenceOf(groups));
    said.append(lead);
    said.append(el('span', 'accommodation-prompt-where', painted.where));
    host.append(said);

    const actions = el('div', 'accommodation-prompt-actions');
    const reveal = el('button', 'class-action-btn accommodation-prompt-btn',
      namesShown ? 'Hide the names' : 'Show which students');
    reveal.type = 'button';
    reveal.setAttribute('data-accommodation-names', '');
    reveal.setAttribute('aria-expanded', namesShown ? 'true' : 'false');
    /* The label and the tooltip say what the tap DOES and what it costs, and neither says who: a
       control whose name is a student's name has already made the disclosure it is guarding. */
    reveal.title = 'Shows which students on this roster these apply to. It is the same information '
      + 'as the roster and it is on screen until you hide it again.';
    actions.append(reveal);
    host.append(actions);

    if (!namesShown) return;
    const list = el('div', 'accommodation-prompt-names');
    groups.forEach((group) => {
      const row = el('div', 'accommodation-prompt-group');
      const label = el('span', 'accommodation-prompt-kind');
      setSensitiveText(label, kindLabel(group.kind) || 'Accommodation on file');
      row.append(label);
      const names = el('div', 'accommodation-prompt-people');
      group.students.forEach((student) => {
        names.append(el('span', 'accommodation-prompt-name', student.name));
      });
      row.append(names);
      list.append(row);
    });
    host.append(list);
  });
}

/*
  THE PROMPT, RECOMPUTED FROM THE OPEN DOCUMENT AND REDRAWN. Called by src/assignments.js whenever
  the editor's category could have changed under it — on open, on create, on a category pick, and on
  a presentation-mode flip — and by nothing else.

  IT TAKES THE CLASS AND THE CATEGORY NAME rather than asking which class is open, and that is the
  one place this file departs from src/past-due.js's shape. The prompt is about the category CHOSEN
  IN THE DIALOG, which is a thing only the editor knows: a summary computed from the open class's
  first category, or computed once on open and left standing while the teacher changes the picker,
  is worse than no summary at all, because it is read as current.

  Returns how many students it covers — 0 when nothing applies or when presentation mode is on — so
  the caller can say that something appeared without this file having to know how it would say it.
*/
export function paintAccommodationPrompt(cls, categoryName) {
  /* The names go back behind the tap on every repaint — rule 3 in the header. */
  namesShown = false;
  const groups = groupsFor(cls, categoryName);
  painted = { groups: groups, where: whereOf(categoryName || '') };
  draw();
  return countOf(groups);
}

/*
  THE DELIBERATE TAP. Guarded on the same question every other line in this file asks rather than on
  a second copy of it, so a teacher who turned presentation mode on with this dialog open cannot
  reach the names through a button that is no longer drawn — and could not reach them through the
  keyboard or the console either.

  WHAT IS ANNOUNCED IS THAT THEY ARE SHOWING, NEVER WHAT THEY SAY. "Ada Probe needs extended time"
  is the sentence that reads a student's file out loud in a room; src/roster.js's toggleSupports()
  and src/presentation.js both make the same distinction, and this is the third instance of it.
*/
export function toggleAccommodationNames() {
  if (!supportsVisible() || !painted.groups.length) return;
  namesShown = !namesShown;
  draw();
  announce(namesShown
    ? 'The names these apply to are now on screen, in this dialog only.'
    : 'The names are hidden again. The counts are still on screen.');
}

/* ══════════════════════════════════════════════════════════════════════════════
   THE ABSENCE PROMPT (WO-4.4) — the second instance of docs/data-model.md rule 3
   ══════════════════════════════════════════════════════════════════════════════ */

/*
  WHAT IT SAYS, AND THE ORDER IT SAYS IT IN. Same shape as the prompt above, because it is the same
  component: the fact first — *"That is Owen Bennett's 4th absence in the last 9 recorded meetings"*
  — then the scope, then one button that reveals the clause itself. What a teacher reads at a glance
  is a number she can act on; what she reads if the box makes her uneasy is where it came from and
  where it does not go.

  IT DEPARTS FROM THE DRAWN SENTENCE IN ONE PLACE AND THIS IS THE POINT OF DEPARTURE.
  design/mockups/behavior.html draws *"That is Owen's 4th absence in this class."* — a first name and
  no window. The window is back because the rule's window is the last N recorded MEETINGS and not the
  term: a student with ten absences on the year and four inside the window would be told this was her
  fourth, which is a wrong number beside a child's name on the screen where the number is the whole
  content. The name is `fullName()` rather than a first name for the plainer reason: two Owens on one
  roster is a real class, and the prompt is about exactly one of them.

  IT HOLDS ONE STUDENT AND NEVER A LIST. The prompt above counts a roster and says how many; this one
  is about the student whose row was just tapped, so there is no count to protect and the name is
  already on the screen it is drawn over. What is protected is the CLAUSE, which sits behind the same
  deliberate tap the roster dot is, and the whole prompt is absent while presentation mode is on.
*/
let paintedAbsence = { studentId: '', lead: '', clause: '' };
let clauseShown = false;

/* The scope sentence, and it is a constant because it never varies: one student, one clause, one
   promise about where it goes. The second half is whereOf()'s own words above, so the two prompts
   make a teacher one promise rather than two. */
const ABSENCE_WHERE = 'Their plan has something on file about attendance. This is on screen only — '
  + 'it is never printed, exported or put in a draft — and presentation mode hides it entirely.';

/* Turned into an ordinal rather than printed as a bare number, because "That is 4 absence" is the
   sentence a teacher reads as a bug. Small and local: nothing else in this app orders a number. */
function ordinal(n) {
  const num = Math.floor(Number(n) || 0);
  const tens = num % 100;
  if (tens >= 11 && tens <= 13) return num + 'th';
  const ones = num % 10;
  if (ones === 1) return num + 'st';
  if (ones === 2) return num + 'nd';
  if (ones === 3) return num + 'rd';
  return num + 'th';
}

function plural(n, one, many) {
  return n + ' ' + (n === 1 ? one : many);
}

/*
  ONE HOST, DRAWN FROM `paintedAbsence` AND NOTHING ELSE — the same contract draw() has above, and
  the same two states: something to say, or empty and hidden. There is no third rendering that hints
  at a clause without showing one.
*/
function drawAbsence() {
  const hosts = Array.prototype.slice.call(document.querySelectorAll(ABSENCE_HOST_SEL));
  const live = supportsVisible() && !!paintedAbsence.clause;
  hosts.forEach((host) => {
    host.textContent = '';
    host.classList.toggle('hidden', !live);
    if (!live) return;

    const said = el('div', 'accommodation-prompt-said');
    /* The lead is attendance arithmetic and carries no support field at all, so it goes on the
       element directly — but the WHOLE BOX is gone in presentation mode anyway (see `live` above),
       because the box's existence is what says this student has something on file. */
    said.append(el('span', 'accommodation-prompt-lead', paintedAbsence.lead));
    said.append(el('span', 'accommodation-prompt-where', ABSENCE_WHERE));
    host.append(said);

    const actions = el('div', 'accommodation-prompt-actions');
    const reveal = el('button', 'class-action-btn accommodation-prompt-btn',
      clauseShown ? 'Hide what it says' : 'Show me what it says');
    reveal.type = 'button';
    reveal.setAttribute('data-absence-clause', '');
    reveal.setAttribute('aria-expanded', clauseShown ? 'true' : 'false');
    /* The label says what the tap DOES and never a word of what it will show — src/roster.js's rule
       about the dot's own label, one screen along. */
    reveal.title = 'Shows what this student’s plan says about attendance. It is the same '
      + 'information as the roster and it is on screen until you hide it again.';
    actions.append(reveal);
    host.append(actions);

    if (!clauseShown) return;
    const box = el('div', 'accommodation-prompt-names');
    const text = el('p', 'accommodation-prompt-clause');
    /* Through setSensitiveText() rather than onto the element, for the reason every support field in
       this app takes that funnel: "hidden in presentation mode" becomes a property of the writing
       rather than of somebody having remembered the check above. Both are here on purpose. */
    setSensitiveText(text, paintedAbsence.clause);
    box.append(text);
    host.append(box);
  });
}

/*
  A MARK JUST LANDED ON A STUDENT — should the prompt be up, and saying what.

  Called by src/shell.js after both marking paths (the tap on a cell and the keyboard letter), which
  is where every other order of operations in this app is stated; src/attendance.js does not know
  this prompt exists and must not, because it would then be one import away from a support block.

  FIVE THINGS HAVE TO BE TRUE, cheapest first with the disclosure last:

    1. Presentation mode is off. Nothing is built otherwise — not the sentence, not the box.
    2. The mark that just landed reads `A`. Marking a student PRESENT is not the moment to raise
       their plan, and a student who was already over the line must not have the prompt follow her
       around the screen; `editableMark()` answers what the writable column says right now.
    3. The signal engine's `absence-window` rule fires for this student. That is the owner's N and
       the owner's window, read where they already live — see the header.
    4. There is a clause on file. No clause, no prompt: WO-4.4's acceptance line is "surfaces an
       attendance-related plan clause IF ONE EXISTS", and a box saying nothing is on file would be a
       box announcing that this app looked.
    5. And the clause itself is behind the tap, never in the first paint.

  It returns whether it painted, so a caller can say something happened without this file having to
  know how it would say it — paintAccommodationPrompt()'s own contract.
*/
export function paintAbsencePrompt(cls, termId, studentId) {
  clauseShown = false;
  paintedAbsence = { studentId: '', lead: '', clause: '' };

  const doc = getDoc();
  const student = studentsIn(doc).filter((s) => s && s.id === studentId)[0];
  if (!supportsVisible() || !doc || !cls || !student) { drawAbsence(); return false; }

  const mark = editableMark(studentId);
  if (!mark || mark.code !== 'A') { drawAbsence(); return false; }

  const hit = evaluate(doc, cls, termId, { studentIds: [studentId] })
    .filter((h) => h.ruleId === 'absence-window')[0];
  if (!hit) { drawAbsence(); return false; }

  const clause = attendanceClauseOf(readSupports(student)).trim();
  if (!clause) { drawAbsence(); return false; }

  paintedAbsence = {
    studentId: studentId,
    lead: 'That is ' + fullName(student) + '’s ' + ordinal(hit.numbers.absences)
      + ' absence in the last '
      + plural(hit.numbers.meetings, 'recorded meeting', 'recorded meetings') + '.',
    clause: clause,
  };
  drawAbsence();
  return true;
}

/* Take it off the screen, and forget what it was about. Called when the registry redraws under it —
   a class switch, a paged window, a term change — and when presentation mode flips, because a
   suppression that only applies to the NEXT render leaves the box on the glass of the iPad the
   teacher just turned toward the room (src/shell.js's flipPresentationMode carries the long
   version). */
export function clearAbsencePrompt() {
  clauseShown = false;
  paintedAbsence = { studentId: '', lead: '', clause: '' };
  drawAbsence();
}

/* Which student the prompt is about, or ''. Read by tools/verify-shell.mjs through the seam and by
   nothing in the app. It answers WHO, never what the clause says: a getter that handed back a
   teacher's own words about a child would be the one export this file's header refuses. */
export function absencePromptStudent() { return paintedAbsence.studentId; }

/*
  THE DELIBERATE TAP, guarded on the same question as everything else here rather than on a second
  copy of it — so a teacher who turned presentation mode on with the prompt up cannot reach the
  clause through a button that is no longer drawn, or through the keyboard, or through the console.

  WHAT IS ANNOUNCED IS THAT IT IS SHOWING, NEVER WHAT IT SAYS. Reading a plan's attendance clause
  aloud is the disclosure the tap is guarding; toggleAccommodationNames() above and src/roster.js's
  toggleSupports() make the same distinction, and this is the fourth instance of it.
*/
export function toggleAbsenceClause() {
  if (!supportsVisible() || !paintedAbsence.clause) return;
  clauseShown = !clauseShown;
  drawAbsence();
  announce(clauseShown
    ? 'What their plan says about attendance is now on screen, on this screen only.'
    : 'It is hidden again. The prompt is still there.');
}
