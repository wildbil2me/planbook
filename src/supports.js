/*
  The support block — IEP and 504 plans, a case manager, a review date, accommodations, medical
  needs and behavior plans — and the one door any of it takes to a screen.

  SHAPED LIKE THE REST OF src/, and named for the thing it owns rather than for its layer
  (src/README.md). It holds no DOM of its own: src/roster.js renders the editor and the roster row,
  the way src/classes.js renders terms. What lives here is the shape docs/data-model.md settles, the
  two enumerated lists, and the visibility rule — because the visibility rule is the part that must
  not be re-decided per screen.

  WHY THIS IS ITS OWN FILE, AND THE ONE THING NOT TO UNDO.

  docs/data-model.md § "Accommodations — the most sensitive data in the app" opens with the rule
  that costs the most to break: *never visible by default on a screen that might be projected*.
  Teachers project attendance and gradebooks onto classroom walls, and IEP status on that wall is a
  disclosure to thirty students in one gesture. So every screen that can show a support field asks
  ONE function whether it may — `supportsVisible()`, below — and no screen anywhere decides for
  itself.

  That is not tidiness. WO-1.9 added presentation mode, the global suppression the teacher flips
  before she plugs in the projector, and its whole design rested on there being a single place to
  flip — which there was, so the work order changed one function body and nothing else. A per-screen
  `if` reads identically today, passes today, and fails the first time Phase 4 adds a screen whose
  author did not know the `if` existed. So:

    - `supportsVisible()` is the switch, and presentation mode is the hand on it.
    - `sensitiveValue()` is how a support field reaches a form control.
    - `setSensitiveText()` is how a support field reaches rendered text.

  Nothing outside this file reads `student.supports` and writes what it finds onto the page without
  going through one of those three. A grep for `supportsVisible` is the audit.

  WHAT THIS FILE IS NOT ALLOWED TO GROW INTO. No merge field resolves any of this (rule 2), no
  export, print surface or log line carries it, and the only file it is ever written into is the
  teacher's own JSON backup, whose UI says so in words (rule 4, and src/backup.js's header). If a
  later work order needs a summary sentence out of here for an outreach draft, the answer is no —
  that is the disclosure the rule exists to make impossible by construction.
*/

/* The preference presentation mode lives in, and the only import this file has. src/prefs.js is
   the only door to localStorage in the app; what is stored is a switch position and nothing else,
   and the comment on `presentationMode` there says why that is a fact about the browser rather
   than about a student. */
import { getPref, setPref } from './prefs.js';

/*
  The plan values are the literals docs/data-model.md enumerates — "IEP|504|ELL|none" — and the
  labels are what the teacher taps. `none` is a real stored value rather than an empty string
  because "no plan on file" is an answer she has given, and an empty string is one she has not.
*/
export const PLANS = [
  { value: 'none', label: 'No plan' },
  { value: 'IEP', label: 'IEP' },
  { value: '504', label: '504' },
  { value: 'ELL', label: 'ELL' },
];

/*
  The accommodation kinds, in the order the data model lists them, ending in `other` — which is the
  escape hatch the work order names: anything not on this list is `other` plus free text in
  `detail`. The stored value is the hyphenated token; the label is sentence case because everything
  a teacher reads in this app is (design/style-guide.md §9).
*/
export const ACCOMMODATION_KINDS = [
  { value: 'extended-time', label: 'Extended time' },
  { value: 'separate-setting', label: 'Separate setting' },
  { value: 'read-aloud', label: 'Read aloud' },
  { value: 'calculator', label: 'Calculator' },
  { value: 'reference-sheet', label: 'Reference sheet' },
  { value: 'preferential-seating', label: 'Preferential seating' },
  { value: 'breaks', label: 'Breaks' },
  { value: 'scribe', label: 'Scribe' },
  { value: 'large-print', label: 'Large print' },
  { value: 'chunked', label: 'Chunked assignments' },
  { value: 'check-ins', label: 'Check-ins' },
  { value: 'other', label: 'Something else' },
];

/* ────────────────────────────── the choke point ────────────────────────────── */

/*
  MAY A SUPPORT FIELD BE ON THE SCREEN RIGHT NOW. The only question, asked in the only place.

  It answers no while presentation mode is on, and that is the whole of WO-1.9: one preference,
  read here, and every screen in the app goes quiet at once — including the roster dot, whose mere
  presence says the student has something on file. Nothing else about the app's discreet-by-default
  behavior is a preference: the roster showing a dot instead of the details, and the editor's
  support section arriving collapsed, are how this works with the switch OFF.

  DO NOT ADD A SECOND COPY OF THIS TEST ANYWHERE. A screen that needs to know asks this function;
  a screen that renders a support field hands it to sensitiveValue() or setSensitiveText() below
  and gets the answer for free. That is what makes a screen written in Phase 4 or Phase 6 inherit
  presentation mode without its author having heard of it, and a per-screen `if` is the failure
  the work order predicted by name.
*/
export function supportsVisible() {
  return !presentationMode();
}

/*
  IS PRESENTATION MODE ON. The preference, read fresh every time rather than cached: a cached copy
  is a copy that can disagree with the switch, and the disagreement that costs something is the one
  where the app thinks it is hidden and the projector disagrees.

  `!== false` rather than `=== true`, deliberately. An absent key reads as the declared default —
  `false`, so a browser that has never seen the switch shows support data as it always has. Any
  OTHER value is a preference somebody hand-edited or a half-written write, and the safe way to
  round an unreadable answer is toward hiding: a teacher who finds the details missing taps the
  header control once and has them back, where a teacher who finds them on the wall cannot take
  them back at all.
*/
export function presentationMode() {
  return getPref('presentationMode') !== false;
}

/*
  Turn it on or off, and return where it ended up — which is read back through the same function
  every screen asks rather than echoed from the argument, so a refused write (Safari in a private
  window can make localStorage throw) reports the truth instead of the intention.

  src/presentation.js is the only caller: it owns the header control and the strip that say the
  mode is on. This file owns no DOM and does no re-rendering, so nothing on screen changes because
  of this call — src/shell.js chains the redraws, the way it does for a year switch.
*/
export function setPresentationMode(on) {
  setPref('presentationMode', !!on);
  return presentationMode();
}

/*
  A support field on its way into a form control. Returns '' rather than the value while support
  data is suppressed, so a hidden panel is not sitting in the DOM full of the thing that is
  supposed to be hidden — an element with `display: none` is still an element a screenshot tool, a
  find-in-page, or an accessibility tree can reach.
*/
export function sensitiveValue(value) {
  if (!supportsVisible()) return '';
  return value == null ? '' : String(value);
}

/*
  A support field on its way into rendered text. Same rule, one level up: the caller hands over the
  element as well as the string, so there is no version of this that returns the text and leaves a
  caller free to put it somewhere else.
*/
export function setSensitiveText(el, text) {
  if (!el) return;
  if (!supportsVisible()) {
    el.textContent = '';
    return;
  }
  el.textContent = text == null ? '' : String(text);
}

/* ────────────────────────────── the shape ────────────────────────────── */

/*
  A student's support block, exactly the shape docs/data-model.md:79-91 settles, with every
  collection present and empty rather than absent — the reason is at src/store.js:102-104.

  `plan` seeds to `none` and `accommodations` to an empty array. Nothing here seeds to a value that
  would read as a claim about a student nobody has typed anything about yet.
*/
export function newSupports() {
  return {
    plan: 'none',
    caseManager: { name: '', email: '' },
    reviewDate: '',
    accommodations: [],
    medical: '',
    behaviorPlan: '',
  };
}

/*
  A fresh accommodation row, and the one field that is NOT seeded from the enumerated list: `kind`
  starts empty, and the picker's first option says "Choose one". Seeding it to `extended-time`
  because that is the first token in the data model would mean a card added by a mis-tap claims a
  student has extended time — a false accommodation is a worse error than an unfilled one, and
  empty-means-unset is the idiom every other string field in the document already uses.
*/
export function newAccommodation() {
  return { kind: '', detail: '', appliesTo: [] };
}

/* Read without repairing. Returns null for a student whose record has no support block at all —
   which is reachable: a backup written by the build before this one, or a hand-edited file. Used
   by everything that only wants to look. */
export function readSupports(student) {
  if (!student || !student.supports || typeof student.supports !== 'object') return null;
  return student.supports;
}

/*
  Read, repairing in place. Same job and same reasoning as src/roster.js's counselorOf(): a screen
  that has to check whether the block exists before it writes into it is a screen that will
  eventually forget, and the missing-block case arrives from a restored backup rather than from
  anything this build wrote.

  NO SCHEMA MIGRATION, deliberately. A missing `supports` reads as an empty one everywhere in this
  file, so nothing is lost by filling it in on first use — where a schemaVersion bump would refuse
  every document this build's own backups have already gone out to (src/store.js migrateDocument).
  The repair is a mutation outside update(), exactly as counselorOf's is: it writes no teacher data,
  and the next real edit is what saves it.
*/
export function supportsOf(student) {
  if (!student) return newSupports();
  const s = readSupports(student);
  if (!s) {
    student.supports = newSupports();
    return student.supports;
  }
  if (!s.caseManager || typeof s.caseManager !== 'object') s.caseManager = { name: '', email: '' };
  if (!Array.isArray(s.accommodations)) s.accommodations = [];
  if (typeof s.plan !== 'string' || !PLANS.some((p) => p.value === s.plan)) s.plan = 'none';
  return s;
}

/* Every read of `accommodations` goes through here, for the reason src/roster.js's rosterOf() gives
   about `roster`: a block from another build can legitimately arrive without the key. */
export function accommodationsOf(supports) {
  return supports && Array.isArray(supports.accommodations) ? supports.accommodations : [];
}

/*
  Is there anything on file for this student — the question the roster dot is the answer to, and
  the only question a list view is allowed to ask.

  Deliberately one boolean and not a summary. A helper that returned "IEP · 2 accommodations" would
  be the convenient shape for a row label, and the row is the wall.
*/
export function hasSupports(student) {
  const s = readSupports(student);
  if (!s) return false;
  if (typeof s.plan === 'string' && s.plan && s.plan !== 'none') return true;
  if (s.reviewDate) return true;
  if (s.medical || s.behaviorPlan) return true;
  const manager = s.caseManager && typeof s.caseManager === 'object' ? s.caseManager : {};
  if (manager.name || manager.email) return true;
  return accommodationsOf(s).some((a) => !!a
    && (a.kind || a.detail || (Array.isArray(a.appliesTo) && a.appliesTo.length > 0)));
}

/* ────────────────────────────── small readers ────────────────────────────── */

/* The label for a stored kind, or '' for one this build does not know — a token out of a
   hand-edited file shows as the card's fallback caption rather than as itself, which is the same
   harmless failure src/roster.js gives a dangling roster id. */
export function kindLabel(kind) {
  const found = ACCOMMODATION_KINDS.filter((k) => k.value === kind)[0];
  return found ? found.label : '';
}

export function isKind(kind) {
  return ACCOMMODATION_KINDS.some((k) => k.value === kind);
}

export function isPlan(plan) {
  return PLANS.some((p) => p.value === plan);
}

/*
  `appliesTo` is an array in the document and a comma-separated line in the editor.

  A free-text line rather than a picker over the class's grade categories, and that is a decision
  rather than a shortcut: categories are configured per class (docs/data-model.md), a student is
  commonly in two of the teacher's five, and an accommodation follows the student rather than the
  class — so a picker built from one class's categories would offer the wrong words in the other.
  Empty means everything, which is the data model's own rule and the reason the field can be left
  alone entirely.
*/
export function parseAppliesTo(text) {
  return String(text == null ? '' : text).split(',').map((s) => s.trim()).filter(Boolean);
}

export function appliesToText(list) {
  return Array.isArray(list) ? list.join(', ') : '';
}

/*
  DOES ONE ACCOMMODATION'S `appliesTo` COVER A CATEGORY THE TEACHER NAMED (WO-3.8).

  It is here rather than in the screen that asks it, for the reason supportsVisible() is here: a
  match rule copied into a screen is a match rule that can disagree with the next screen's, and the
  disagreement is silent in the direction that costs something. This file already owns the two
  halves of `appliesTo` — the split on the way in and the join on the way out — so it owns the
  question they exist to answer too. Note what it is NOT: it returns a boolean about one
  accommodation, never a count, a list, or a sentence. The aggregation lives in
  src/accommodation-prompt.js, and the header above says why nothing shaped like a summary may live
  in this file.

  BOTH SIDES ARE TEACHER PROSE, and there is deliberately never going to be an id to join on —
  parseAppliesTo's comment above says why: an accommodation follows the student across five classes
  whose categories differ, so the field is free text on purpose. So this is a comparison between two
  spellings of the same word: `Tests` against `tests`, `Unit Tests` against `test`.

  THE RULE.
    · An empty `appliesTo` means everything. That is docs/data-model.md's own rule and the reason
      the field can be left alone entirely.
    · Both sides are folded to lower case and split on anything that is not a letter or a digit,
      and each word is stemmed by stem() below.
    · One term matches when its words are a SUBSET of the category's words, or the category's are a
      subset of the term's — so `tests` covers `Unit Tests`, and `unit tests` covers `Tests`.
      Word sets rather than substrings, because `art` is a substring of `Participation`, and a
      prompt that fired on that would teach a teacher to stop reading them.
    · A scoped accommodation against an assignment filed under NO category matches nothing. There is
      no name to compare with, and "everything" is what an empty `appliesTo` already means.

  IT LEANS TOWARD FIRING, AND THAT IS THE DECISION — said here so nobody tightens it later. A prompt
  that does not appear is a legal obligation not surfaced, and it is invisible: nothing is on screen
  and nothing says nothing is on screen. A prompt that appears when it need not is one extra line in
  a dialog. Those are not the same size of mistake, so the tie goes to showing — which is also why a
  term that stems to no words at all (`—`, `?`) is treated as no scope rather than as a scope
  nothing can satisfy.
*/
export function appliesToMatches(appliesTo, categoryName) {
  const terms = (Array.isArray(appliesTo) ? appliesTo : parseAppliesTo(appliesTo))
    .map(matchWords).filter((words) => words.length > 0);
  if (!terms.length) return true;
  const cat = matchWords(categoryName);
  if (!cat.length) return false;
  return terms.some((words) => covers(words, cat) || covers(cat, words));
}

function covers(a, b) {
  return a.every((word) => b.indexOf(word) >= 0);
}

function matchWords(text) {
  return String(text == null ? '' : text).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(stem);
}

/*
  A crude stem, and crude is the point: this has to agree with itself about two words a teacher
  typed on two different screens, not to be right about English. Four steps, in order, each guarded
  so a short word is left alone.

    tests  → test    quizzes → quizze → quizz → quiz    classes → classe → class → clas
    test   → test    quiz    → quiz                     class   → clas

  The pairs are what matter: `test`/`tests` land on one string and `quiz`/`quizzes` land on another.
  Nothing here is exported, and no other file may grow a second copy of it.
*/
function stem(word) {
  let w = word;
  if (w.length > 3 && w.slice(-1) === 's') w = w.slice(0, -1);
  if (w.length > 3 && w.slice(-1) === 'e' && 'sxzhc'.indexOf(w.slice(-2, -1)) >= 0) w = w.slice(0, -1);
  if (w.length > 2 && w.slice(-1) === w.slice(-2, -1)) w = w.slice(0, -1);
  return w;
}
