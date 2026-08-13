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
*/

import { announce } from './live-region.js';
/* The four rules above, in one import. `readSupports` rather than `supportsOf`, deliberately: this
   file only ever looks, and supportsOf() repairs a missing block in place — a mutation, however
   harmless, made by a prompt that is drawing itself. */
import {
  ACCOMMODATION_KINDS, accommodationsOf, appliesToMatches, kindLabel, readSupports,
  setSensitiveText, supportsVisible,
} from './supports.js';
/* How a student's name reads in a list. Imported from src/roster.js for the reason src/past-due.js
   imports the same function: a second copy of those eight lines could be right about a hyphen, a
   suffix or a half-typed name in a way this one is not. The import runs one way — nothing in
   src/roster.js knows this file exists. */
import { rosterName } from './roster.js';
import { getDoc } from './store.js';

/* The screen that wears this prompt carries an empty host with this attribute, and this file paints
   every one it finds. One today — the assignment editor — and a second costs one element in the
   markup rather than a line here, which is the same contract `[data-past-due]` has with
   src/past-due.js and `[data-screen-nav]` has with src/screen-nav.js. */
const HOST_SEL = '[data-accommodation-prompt]';

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
