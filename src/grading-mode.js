/*
  How a class is graded, set from the categories editor — the mode control, each category's share
  of the points, and the confirmation that says what a switch would do before it does it (WO-3.31).

  ── WHY THIS IS NOT MORE OF src/categories.js ──

  Everything in this file needs the grade engine: pointsShare() for the share lines, classGrade()
  and letterFromPercentage() for the confirmation, gradingModeOf() for which mode is showing. And
  src/grade-engine.js imports src/categories.js, so the editor importing the engine back would close
  a loop — the sixth this repo would have refused. The editor stays a leaf. This module wears the
  engine instead, and src/shell.js calls it: once when the editor opens, after every category change
  (afterCategoryChange()), and on the mode control's three hooks. That is the order-of-operations
  rule every other cross-module question in this app follows, and it is why the editor's file does
  not know this one exists.

  So the editor is drawn in TWO PASSES IN ONE TASK. src/categories.js draws the rows exactly as it
  always has — weight fields live, the weights-total line filled in — and paintEditor() below then
  says the class's mode over them: the weight fields disabled, the total line hidden, a share line
  under each row, the title and opening sentence for points. Both passes run before the browser
  paints, so no frame ever shows the first without the second. What makes that safe is that every
  path that redraws the editor's rows goes through a hook in src/shell.js that chains this module
  afterwards; a new path that redraws them owes the same chain.

  ── WHAT IT IMPORTS, AND WHY src/scores.js IS ONE OF THEM ──

  The class average is the score grid's: classAverage() over gridOrder(), each student's figure the
  engine's own (WO-3.31's own words — "do not write a second mean"). Both are exported from
  src/scores.js for this file, and formatPercent() already was. Importing a screen module for them
  is the established shape rather than a new one: src/signals.js, src/merge-fields.js, src/detail.js
  and src/grades-report.js all import formatPercent() from there, and none of them is imported back.
  Nothing in src/scores.js's graph reaches this file, so no loop closes; and since this module needs
  formatPercent() whatever happens to classAverage(), moving the mean to a leaf of its own would
  still leave the import standing. src/categories.js imports none of this.

  ── NOTHING HERE IS GRADE ARITHMETIC ──

  Every percentage is the engine's, every share is pointsShare()'s and the average is
  classAverage()'s. What this file does is COMPARE two letters and COUNT how many differ — and
  never compare two percentages, because a letter is what goes into the SIS and a grade that moved
  from 91% to 94% inside the same band is not a consequence anybody re-keys. A share is written down
  with formatWeight(), the editor's own formatter for a number in that field's place, so a share and
  the weight beside it can never be written two ways.

  ── THE SWITCH WRITES ONE KEY AND NOTHING ELSE ──

  Weighted is the ABSENT key (gradingModeOf(), and docs/data-model.md): the way to points writes
  `gradingMode: "points"`, and the way back DELETES it rather than writing "weighted", so nothing is
  seeded and a class that went there and back is the bytes it was before it left. The weights are
  never touched by the switch — they are greyed, kept exactly as typed, and they count again the
  moment the key goes. The preview is computed on a shallow COPY of the class carrying the other
  mode, never by writing the document and reverting it, which is what keeps Cancel a true no-op.
*/

import { getDoc, update } from './store.js';
import { openModal, closeModal } from './modal.js';
import { announce } from './live-region.js';
import { getTerms } from './classes.js';
import { formatWeight, weightTotal, categoriesOf } from './categories.js';
import { classGrade, gradingModeOf, letterFromPercentage, pointsShare } from './grade-engine.js';
import { classAverage, formatPercent, gridOrder } from './scores.js';
import { rosterName } from './roster.js';

const EDITOR_MODAL_ID = 'categoriesModal';
const EDITOR_TITLE_ID = 'categoriesModalTitle';
const EDITOR_LIST_ID = 'categoryList';
const EDITOR_TOTAL_ID = 'categoryTotal';
const SHARE_TERM_ID = 'categoryShareTerm';

const CONFIRM_MODAL_ID = 'gradingModeModal';
const CONFIRM_TITLE_ID = 'gradingModeTitle';
const CONFIRM_LEAD_ID = 'gradingModeLead';
const CONFIRM_WARN_ID = 'gradingModeWarn';
const CONFIRM_AVERAGE_LABEL_ID = 'gradingModeAverageLabel';
const CONFIRM_AVERAGES_ID = 'gradingModeAverages';
const CONFIRM_LETTERS_LABEL_ID = 'gradingModeLettersLabel';
const CONFIRM_LETTERS_ID = 'gradingModeLetters';
const CONFIRM_OTHER_LABEL_ID = 'gradingModeOtherLabel';
const CONFIRM_OTHER_ID = 'gradingModeOtherTerms';
const CONFIRM_BTN_ID = 'gradingModeConfirmBtn';

/* What each mode is called on screen — on its pill, in the confirmation, and in what is announced.
   One table, so the pill and the dialog it opens cannot name the same mode two ways. */
const MODE_NAMES = { weighted: 'weighted categories', points: 'total points' };

/* The word a confirmation prints for a student with no grade on one side. A letter that becomes no
   grade is a change (WO-3.31), so it is a value in the comparison like any letter, never a blank. */
const NO_GRADE = 'no grade';

/* Which class and term the editor is showing, as ids, for the reason src/categories.js keeps its own
   as an id: a restore or a year switch can replace the document underneath, and an object held
   across that belongs to a document nobody has open. Set by paintEditor(); read by the repaint
   src/shell.js chains after every category change. */
let editorClassId = '';
let editorTermId = '';

/* The switch the confirmation is showing, or null. Ids and a mode, never the class object. */
let pending = null;

function classesIn(doc) { return doc && Array.isArray(doc.classes) ? doc.classes : []; }

/* A plain array lookup, deliberately not src/classes.js's resolution — see src/categories.js's
   findClass() for why finding a known id is not the same question as "which class is open". */
function findClass(id) {
  return classesIn(getDoc()).filter((c) => c.id === id)[0] || null;
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

function termLabel(term) {
  return term ? (term.label || 'Untitled term') : '';
}

function termOf(classId, termId) {
  return getTerms(classId).filter((t) => t.id === termId)[0] || null;
}

/* The class as it would be in the other mode — a shallow copy, so the categories, terms and letter
   scale the engine reads are the class's own, and only the key differs. Weighted is the key absent,
   exactly as on the document. */
function inMode(cls, mode) {
  const copy = Object.assign({}, cls);
  if (mode === 'points') copy.gradingMode = 'points';
  else delete copy.gradingMode;
  return copy;
}

/* ────────────────────────────── the share lines ────────────────────────────── */

/* One share line, in the words WO-3.31 gives: "Tests — 62% of the points assigned so far", or "No
   work assigned yet" while the term holds no points at all. Never "0%" and never a blank: a share of
   nothing is not a share of zero, and pointsShare() says so by answering null. */
function shareText(row) {
  const name = row.id === null ? row.name : (row.name || 'Untitled category');
  return name + ' — ' + (row.share === null
    ? 'No work assigned yet'
    : formatWeight(row.share) + '% of the points assigned so far');
}

function shareLine(row) {
  const line = document.createElement('div');
  line.className = 'category-share';
  /* Read by nothing in the app — here so a check can find a category's share by what it is rather
     than by its position in the list. `none` is the no-category row, whose engine id is null. */
  line.setAttribute('data-category-share', row.id === null ? 'none' : row.id);
  line.textContent = shareText(row);
  return line;
}

/*
  EVERY ROW pointsShare() RETURNS, and nothing computed here. A category's line goes into that
  category's own row, under its greyed weight; the no-category row — present only when work filed
  under no category holds points — gets a row of its own at the foot of the list, because in a
  points class that work counts and without it the shares do not add up to 100.

  The rows are found by the category id the editor already put on each name field. A share row with
  no editor row (a category the editor did not draw) is drawn at the foot rather than dropped, so the
  list always holds every row the engine returned.
*/
function paintShares(box, doc, cls, termId) {
  box.querySelectorAll('.category-share, .category-loose').forEach((el) => el.remove());
  if (gradingModeOf(cls) !== 'points') return;
  pointsShare(doc, cls, termId).forEach((row) => {
    const field = row.id === null ? null
      : Array.prototype.filter.call(box.querySelectorAll('[data-category-field="name"]'),
        (input) => input.getAttribute('data-category-id') === row.id)[0];
    const home = field ? field.closest('.category-row') : null;
    if (home) { home.append(shareLine(row)); return; }
    const loose = document.createElement('div');
    loose.className = 'category-loose';
    loose.append(shareLine(row));
    box.append(loose);
  });
}

/* ────────────────────────────── the editor, in the class's mode ────────────────────────────── */

/*
  SAY THE CLASS'S MODE OVER WHAT src/categories.js HAS JUST DRAWN — see this file's header for why
  it is a second pass. Weighted is the editor exactly as WO-3.1 built it: every change below is
  undone in weighted mode, so a weighted class's editor is the one it always was.

  IN POINTS MODE THE WEIGHTS ARE GREYED, NEVER CLEARED. The fields keep the numbers as typed and are
  disabled, so no keystroke can reach them; the weights-total line is hidden, because there is
  nothing for weights to add up to in this formula; and a category added now arrives with a weight
  like any other (src/categories.js gives it 0), disabled with the rest, ready for the day the class
  goes back.
*/
export function paintEditor(classId, termId) {
  editorClassId = classId || '';
  editorTermId = termId || '';
  const doc = getDoc();
  const cls = findClass(editorClassId);
  const mode = gradingModeOf(cls);
  const byPoints = mode === 'points';

  const title = document.getElementById(EDITOR_TITLE_ID);
  if (title) title.textContent = byPoints ? 'Categories & points' : 'Categories & weights';

  /* The opening sentence and the two hints carry one block per mode in index.html, and the block
     that is not this class's is hidden — the shape src/scores.js gives its help paragraph (WO-3.39). */
  document.querySelectorAll('#' + EDITOR_MODAL_ID + ' [data-category-mode-text]').forEach((el) => {
    el.classList.toggle('hidden', el.getAttribute('data-category-mode-text') !== mode);
  });
  const shareTerm = document.getElementById(SHARE_TERM_ID);
  if (shareTerm) shareTerm.textContent = termLabel(termOf(editorClassId, editorTermId)) || 'this term';

  /* The mode control. Static markup, updated rather than rebuilt, so the pill a teacher tapped is
     still the element focus goes back to when the confirmation closes. The pill already on is not a
     door to anything — tapping it opens nothing — so only the other one promises a dialog. */
  document.querySelectorAll('#' + EDITOR_MODAL_ID + ' [data-grading-mode]').forEach((pill) => {
    const on = pill.getAttribute('data-grading-mode') === mode;
    pill.classList.toggle('active', on);
    pill.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) pill.removeAttribute('aria-haspopup');
    else pill.setAttribute('aria-haspopup', 'dialog');
  });

  const total = document.getElementById(EDITOR_TOTAL_ID);
  if (total) total.classList.toggle('hidden', byPoints);

  const box = document.getElementById(EDITOR_LIST_ID);
  if (!box) return;
  box.querySelectorAll('.category-weight').forEach((input) => { input.disabled = byPoints; });
  if (cls) paintShares(box, doc, cls, editorTermId);
  else box.querySelectorAll('.category-share, .category-loose').forEach((el) => el.remove());
}

/* The repaint src/shell.js chains after every category change. Nothing to say while the editor is
   shut — afterCategoryChange() only ever runs from inside it, but a closed panel is not repainted
   on the strength of that. */
export function repaintEditor() {
  const overlay = document.getElementById(EDITOR_MODAL_ID);
  if (!overlay || overlay.classList.contains('hidden')) return;
  paintEditor(editorClassId, editorTermId);
}

/* ────────────────────────────── the before and after ────────────────────────────── */

/* One student's side of the comparison: the engine's percentage, and the letter that band is. No
   grade is its own value rather than a missing letter — letterFromPercentage() handed null reads it
   as 0 and answers the lowest band, so a null percentage never reaches it. A grade with no band
   (a scale with a gap) prints its percentage rather than a blank. */
function sideOf(doc, cls, termId, studentId) {
  const grade = classGrade(doc, cls, termId, studentId);
  if (grade.percentage === null) return { percentage: null, letter: null, label: NO_GRADE, key: 'none' };
  const letter = letterFromPercentage(doc, cls, grade.percentage);
  return { percentage: grade.percentage, letter: letter,
    label: letter || formatPercent(grade.percentage) + ' (no letter)', key: 'letter:' + (letter || '') };
}

/* Every student whose LETTER differs between the two modes in one term, in the score grid's order.
   The comparison is on `key` — the letter, or no grade — and never on the percentage. */
function letterChanges(doc, from, to, termId, students) {
  const out = [];
  students.forEach((s) => {
    const before = sideOf(doc, from, termId, s.id);
    const after = sideOf(doc, to, termId, s.id);
    if (before.key !== after.key) {
      out.push({ studentId: s.id, name: rosterName(s), from: before.label, to: after.label,
        fromLetter: before.letter, toLetter: after.letter });
    }
  });
  return out;
}

/*
  WHAT A SWITCH WOULD DO, as data — the whole confirmation before any of it is drawn, and the seam a
  check reads it through. Nothing is written: both sides are computed on copies of the class.

  `before` and `after` are the class average in the open term, the score grid's own figure under
  each mode; `changes` is every student in that term whose letter differs; `otherTerms` is one entry
  per OTHER term of the class, in the class's order, where at least one letter changes, with how
  many — the mode is per class, not per term, so a switch regrades a finished quarter too (the
  owner's ruling, 2026-10-04). `warn` is set when the side being switched TO has no grade at all
  because the weights do not total 100: every letter goes, and that is the case the dialog most
  needs to say in words rather than leave to a list of arrows.
*/
export function previewModeChange(classId, termId) {
  const doc = getDoc();
  const cls = findClass(classId);
  if (!doc || !cls) return null;
  const from = gradingModeOf(cls);
  const to = from === 'points' ? 'weighted' : 'points';
  const before = inMode(cls, from);
  const after = inMode(cls, to);
  const students = gridOrder(cls);

  const averageOf = (version) => classAverage(students,
    (s) => classGrade(doc, version, termId, s.id).percentage);

  const otherTerms = [];
  getTerms(cls.id).forEach((term) => {
    if (term.id === termId) return;
    const count = letterChanges(doc, before, after, term.id, students).length;
    if (count) otherTerms.push({ termId: term.id, label: termLabel(term), count: count });
  });

  let warn = '';
  const probe = classGrade(doc, after, termId, '');
  if (probe.reason === 'weights-unbalanced') {
    warn = categoriesOf(cls).length
      ? 'These weights total ' + formatWeight(weightTotal(cls)) + '%, not 100%, so on weighted '
        + 'categories no student in ' + cls.name + ' has a grade at all — in any term — until they '
        + 'add up. Every letter below goes.'
      : cls.name + ' has no grading categories, so on weighted categories no student in it has a '
        + 'grade at all until it has some.';
  }

  return {
    classId: cls.id, termId: termId, from: from, to: to,
    termLabel: termLabel(termOf(cls.id, termId)),
    before: averageOf(before), after: averageOf(after),
    changes: letterChanges(doc, before, after, termId, students),
    otherTerms: otherTerms, warn: warn,
  };
}

/* ────────────────────────────── the confirmation ────────────────────────────── */

function factLine(parent, text, hook, value) {
  const el = document.createElement('div');
  el.className = 'mode-change-line';
  if (hook) el.setAttribute(hook, value);
  el.textContent = text;
  parent.append(el);
  return el;
}

function averageText(p) { return p === null ? 'no grades yet' : formatPercent(p); }

/*
  A MODE CHANGE MOVES EVERY GRADE IN THE CLASS AT ONCE, so it is never a toggle: the control opens
  this, and nothing is written until its confirm button. Opened from a pill that is not the class's
  current mode; the pill that is current opens nothing (src/shell.js routes only the other one here,
  and this refuses a "switch" to the mode the class is already in).
*/
export function openModeChange(classId, termId, want, opener) {
  const cls = findClass(classId);
  if (!cls || gradingModeOf(cls) === want) return;
  const model = previewModeChange(classId, termId);
  if (!model) return;
  pending = { classId: model.classId, to: model.to };

  const toPoints = model.to === 'points';
  const title = document.getElementById(CONFIRM_TITLE_ID);
  if (title) title.textContent = toPoints ? 'Grade on total points?' : 'Go back to weighted categories?';

  const lead = document.getElementById(CONFIRM_LEAD_ID);
  if (lead) {
    lead.textContent = (toPoints
      ? 'On total points, every grade in ' + cls.name + ' is every point earned over every point '
        + 'possible, work in no category included. The weights are kept exactly as you typed them and '
        + 'stop counting — they come back if you switch back.'
      : 'Back on weighted categories, every grade in ' + cls.name + ' is worked out from the weights '
        + 'again, exactly as you typed them.')
      + ' This changes every grade in the class at once, in every term — including a finished one '
        + 'whose letters are already in the SIS.';
  }

  const warn = document.getElementById(CONFIRM_WARN_ID);
  if (warn) {
    warn.textContent = model.warn;
    warn.classList.toggle('hidden', !model.warn);
  }

  const inTerm = model.termLabel ? ' in ' + model.termLabel : '';
  const avgLabel = document.getElementById(CONFIRM_AVERAGE_LABEL_ID);
  if (avgLabel) avgLabel.textContent = 'Class average' + inTerm;
  const averages = document.getElementById(CONFIRM_AVERAGES_ID);
  if (averages) {
    averages.textContent = '';
    factLine(averages, 'Now, on ' + MODE_NAMES[model.from] + ': ' + averageText(model.before),
      'data-mode-average', 'before');
    factLine(averages, 'On ' + MODE_NAMES[model.to] + ': ' + averageText(model.after),
      'data-mode-average', 'after');
  }

  const lettersLabel = document.getElementById(CONFIRM_LETTERS_LABEL_ID);
  if (lettersLabel) lettersLabel.textContent = 'Letters that change' + inTerm;
  const letters = document.getElementById(CONFIRM_LETTERS_ID);
  if (letters) {
    letters.textContent = '';
    if (!model.changes.length) {
      factLine(letters, 'No student’s letter changes' + (inTerm || ' in this term') + '.');
    }
    model.changes.forEach((c) => {
      factLine(letters, c.name + ' — ' + c.from + ' → ' + c.to, 'data-mode-change', c.studentId);
    });
  }

  /* One line per other term where a letter changes, and none where nothing does — a line saying
     "0 letters would change" for every quiet term would bury the one that matters. */
  const otherLabel = document.getElementById(CONFIRM_OTHER_LABEL_ID);
  const other = document.getElementById(CONFIRM_OTHER_ID);
  if (other) {
    other.textContent = '';
    model.otherTerms.forEach((t) => {
      factLine(other, t.label + ': ' + plural(t.count, 'letter', 'letters') + ' would change.',
        'data-mode-other-term', t.termId);
    });
    other.classList.toggle('hidden', !model.otherTerms.length);
  }
  if (otherLabel) otherLabel.classList.toggle('hidden', !model.otherTerms.length);

  const button = document.getElementById(CONFIRM_BTN_ID);
  if (button) button.textContent = toPoints ? 'Grade on total points' : 'Go back to weighted';

  openModal(CONFIRM_MODAL_ID, opener);
}

/* The mode control's tap, for the class and term the editor is showing. */
export function requestModeChange(want, opener) {
  if (want !== 'points' && want !== 'weighted') return;
  openModeChange(editorClassId, editorTermId, want, opener);
}

/* Yes. ONE update(), and it writes the key or deletes it — nothing else on the class is touched, so
   the weights are byte for byte what they were. src/shell.js chains afterCategoryChange() after
   this, which repaints the editor in its new mode and every screen behind it in its new grades. */
export function confirmModeChange() {
  const want = pending;
  pending = null;
  closeModal(CONFIRM_MODAL_ID);
  const cls = want ? findClass(want.classId) : null;
  if (!cls || gradingModeOf(cls) === want.to) return;
  update(() => {
    if (want.to === 'points') cls.gradingMode = 'points';
    else delete cls.gradingMode;
  });
  announce(cls.name + (want.to === 'points'
    ? ' is graded on total points now. Its weights are kept as you typed them.'
    : ' is graded on weighted categories again, with its weights as you typed them.'));
}

/* No. Nothing has been written — the preview was computed on copies — so there is nothing to undo. */
export function cancelModeChange() {
  pending = null;
  closeModal(CONFIRM_MODAL_ID);
  announce('Nothing changed. The class is graded as it was.');
}
