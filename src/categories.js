/*
  Grading categories and their weights — the per-class list a weighted grade is an average of.

  WHY THIS IS ITS OWN FILE WHEN TERMS ARE NOT. src/classes.js keeps terms because "which term is
  open" is only answerable after "which class is open", and that one resolution has to live in a
  single place or the tab bar and the term nav can disagree about what is showing. Categories ask
  no such question: nothing anywhere SELECTS a category, there is no `openCategoryId` and there is
  not going to be one, and the only thing a later screen wants from this module is arithmetic over
  a class object it already holds. That file's own header says what to do when something under
  classes grows a screen — "split then, and keep the resolution here" — and categories arrive with
  a screen on the first day.

  THE IMPORT RUNS ONE WAY, and that is the reason starterCategories() lives here rather than beside
  presetTerms() in src/classes.js. classes.js imports THIS file for the seed; this file imports
  classes.js for nothing at all. Where "the open class" has to be resolved, src/shell.js resolves it
  and hands an id down, which is where every other order-of-operations question in this app is
  answered. A findClass() here that reached into classes.js would close the fifth import loop this
  repo has refused (src/shell.js's header, src/classes.js's header, src/views.js's header).

  WHAT WO-3.4 AND WO-3.5 WILL IMPORT: weightTotal(), isBalanced() and isProvisional(). They are
  pure functions of a class object — no DOM, no store, no clock — for the reason WO-3.4 states
  about the grade engine itself: the arithmetic the product's credibility rests on has to be
  verifiable by hand, separately from anything that draws it. THE GRADE ENGINE IS NOT HERE. WO-3.4
  owns category percentage, weighted class grade and letter-from-percentage, together with the
  hand-computed docs/grade-math-cases.md that is deliberately its only test suite; building any of
  it in this work order would land that arithmetic without the document that checks it.

  THREE THINGS THAT WILL LOOK LIKE OMISSIONS AND ARE DECISIONS:

  1. A WEIGHT IS STORED EXACTLY AS IT WAS TYPED. Nothing here clamps, rounds or repairs a number a
     teacher entered — not a negative, not 140, not 33.33. The field is `min="0"` so the spinner
     will not offer one, and the total banner says what the numbers actually add up to. docs/
     data-model.md § Grade math states the rule this follows: "a score that silently isn't what you
     typed is the worst thing a gradebook can do," and a weight is the same kind of number. A
     writer that quietly stored something else would put the document and the field on screen into
     disagreement, which is the failure, not the protection.

  2. THE WARNING NEVER BLOCKS. Weights that do not total 100 are the ordinary state of a class
     halfway through being set up. So nothing is disabled, no save is refused, and the banner is a
     standing sentence rather than a dialog — the work order's own words are "the teacher is
     mid-setup; don't block them, tell them."

  3. AN EMPTY CATEGORY IS NORMAL AND STAYS NORMAL. A category with no assignments in it is not an
     error here and must never become one: its weight redistributes across the categories that do
     have work (docs/data-model.md § Grade math), which is WO-3.4's arithmetic, and this module
     neither counts assignments per category for that purpose nor warns about it. The only place
     assignments are counted at all is removal, below, where the count is how much work the teacher
     is about to see move to "no category".
*/

import { getDoc, update, newId } from './store.js';
import { openModal, closeModal } from './modal.js';
import { announce } from './live-region.js';

const CATEGORY_MODAL_ID = 'categoriesModal';
const REMOVE_MODAL_ID = 'categoryRemoveModal';

const CATEGORY_LIST_ID = 'categoryList';
const CATEGORY_CLASS_NAME_ID = 'categoriesClassName';
const CATEGORY_TOTAL_ID = 'categoryTotal';
const CATEGORY_ERROR_ID = 'categoryError';

const REMOVE_LEAD_ID = 'categoryRemoveLead';
const REMOVE_FACTS_ID = 'categoryRemoveFacts';
const REMOVE_BTN_ID = 'categoryRemoveBtn';

/*
  What a brand-new class is graded on until the teacher says otherwise, and the only place in this
  app where a category name is written by a programmer. They are seed DATA in exactly the sense
  TERM_PRESETS is: creating a class writes four ordinary categories with ordinary ids, and every
  name and weight is editable, reorderable and removable the moment it exists. Nothing anywhere
  reads these names back off a document — a class does not remember it was seeded, because the
  moment a teacher renames one that fact would be a lie.

  THEY TOTAL 100 ON PURPOSE. A fresh class has to arrive with the warning OFF: a teacher who has
  not made a single decision yet should not be greeted by an app telling her something is wrong.
  Any starter set that did not add up would make the warning the default state and therefore the
  ignorable state.

  Four rather than one, and these four rather than better ones: the requirement is that a class
  arrives usable, not that this guess is right for anybody. Renaming "Classwork" to "Labs" is one
  tap, and a teacher on three categories deletes one.
*/
export const STARTER_CATEGORIES = [
  { name: 'Tests', weight: 40 },
  { name: 'Quizzes', weight: 25 },
  { name: 'Homework', weight: 20 },
  { name: 'Classwork', weight: 15 },
];

/* Fresh objects with fresh ids on every call. The constant above is a template and must never be
   handed out by reference — two classes sharing one category object is two classes whose weights
   move together, and it would look like a rendering bug for a week. */
export function starterCategories() {
  return STARTER_CATEGORIES.map((c) => newCategory(c.name, c.weight));
}

function newCategory(name, weight) {
  /* `k_` for category, from docs/data-model.md § id prefixes and src/store.js:66 — `c_` was
     already class. Opaque like every other id here: nothing compares one to a literal. */
  return { id: newId('k'), name: name, weight: weight };
}

/* WO-1.22 — the category half of copyClass(), called from src/classes.js the one direction this
   file's header says the import runs: classes.js reaches in here, this file reaches back into
   classes.js for nothing. Fresh objects with fresh ids, name and weight only, for the same reason
   starterCategories() above never hands out STARTER_CATEGORIES by reference: two classes sharing
   one category object is two classes whose weights move together. Sharing the ID is the sharper
   version of that failure and the one this work order's Traps line names outright — removalCounts()
   and applyRemoval() below were made safe filtering on categoryId ALONE only after WO-3.3 added the
   classId guard, exactly because a category id appearing in two classes at once is what lets a
   removal in one class count work filed in the other and move it to "no category" (WO-3.43; until
   then it destroyed it). A copy that carried the source's
   id would reopen that door from the other side. */
export function copyCategories(cls) {
  return categoriesOf(cls).map((c) => newCategory(c.name, c.weight));
}

/* ────────────────────────────── reading, and the arithmetic ────────────────────────────── */

/*
  Every read of `categories` goes through here, for the reason src/classes.js's termsOf() exists: a
  class object can legitimately arrive without the key — from a backup written by an older build,
  or from a document created before WO-3.1 — and a screen that has to check before it iterates is a
  screen that will eventually forget to (src/store.js:102-104).
*/
export function categoriesOf(cls) {
  return cls && Array.isArray(cls.categories) ? cls.categories : [];
}

/* A weight that is not a number counts as zero rather than poisoning the sum with NaN. A total of
   NaN would render as "NaN%" and, worse, would compare unequal to 100 and equal to nothing — an
   honest 0 keeps the banner readable and keeps the class provisional, which is the true answer. */
function weightOf(cat) {
  const n = Number(cat && cat.weight);
  return Number.isFinite(n) ? n : 0;
}

/* The number the banner prints and the number WO-3.4 will divide by. */
export function weightTotal(cls) {
  return categoriesOf(cls).reduce((sum, cat) => sum + weightOf(cat), 0);
}

/*
  Is the total 100?

  THE TOLERANCE IS NOT A ROUNDING RULE and is deliberately far too small to be one. It exists for
  one reason: 40.1 + 34.7 + 25.2 is exactly 100 in decimal and 100.00000000000001 in IEEE-754, and
  a teacher whose weights are right must not be told they are wrong by an artifact of binary
  floating point. (Plenty of decimal weights add up exactly — 12.5 + 87.5 is 100 on the nose —
  which is what makes this failure so easy to miss: it appears for some sets and not others, and
  never for the round numbers anyone tests with.) At half a hundredth of a point it cannot mask a
  real gap, because the smallest gap a teacher can type into a two-decimal field is 0.01 — twice
  this. So 33.33 + 33.33 + 33.33 is 99.99, is not 100, and warns, which is correct: those weights
  really do not add up.

  A class with NO categories is not balanced. It has nothing to weight, so there is nothing for a
  grade to be an average of — see provisionalReason() below, which says that in words rather than
  printing "0%" as though a total had been computed.
*/
const BALANCE_EPSILON = 0.005;

export function isBalanced(cls) {
  if (!categoriesOf(cls).length) return false;
  return Math.abs(weightTotal(cls) - 100) < BALANCE_EPSILON;
}

/*
  THE PROVISIONAL DETERMINATION, and the one export this work order makes for screens that do not
  exist yet.

  A grade computed from weights that do not total 100 is arithmetic the teacher did not ask for:
  it is still the best answer available and it is still worth showing — the work order is explicit
  that the app goes on computing while the weights are wrong — but it is not the grade the class
  will have once she finishes. That is what "provisional" means here, and it is a property of the
  CATEGORIES, which is why it is settled in this file and not in the grade engine.

  WO-3.4 and WO-3.5 consume this. What they do NOT get from here is the wording of a label beside a
  percentage: that belongs to the screen that draws the percentage, and there is no such screen
  today. The sentence below is the one this editor prints, and it is about the categories.
*/
export function isProvisional(cls) { return !isBalanced(cls); }

/*
  Two decimals at most, with trailing zeros trimmed: 95, 12.5, 33.33. This is how a number is
  written down, not a rounding rule in WO-3.2's sense — nothing here feeds a letter band, and the
  value stored on the category is untouched by it. A weight typed to more places than this prints
  shortened and still counts in full.

  Exported so that the class manager's own row note (src/classes.js) prints the total in exactly
  the same words the banner does. Two formatters would eventually disagree about 33.335, and the
  teacher would be looking at both numbers at once.
*/
export function formatWeight(n) {
  if (!Number.isFinite(n)) return '0';
  return String(Math.round(n * 100) / 100);
}

/* ────────────────────────────── the editor ────────────────────────────── */

/* Which class the editor is open for, and which category a removal has been proposed for. Both are
   ids rather than objects, for the reason src/classes.js gives: the document can be replaced
   underneath this module by a restore or a year switch, and an object held across that is a
   reference to a class in a document nobody has open any more. */
let categoryClassId = '';
let pendingRemoveId = '';

/* Whether the last render found the weights balanced, so that a crossing can be spoken once
   instead of on every keystroke. Reset when the editor opens, because the first render of a class
   is not a crossing. */
let lastBalanced = null;

function classesIn(doc) { return doc && Array.isArray(doc.classes) ? doc.classes : []; }

/* A plain array lookup, and deliberately not an import. src/classes.js owns RESOLUTION — which
   class the teacher is looking at, resolved against a preference that may name one that is gone —
   and that stays in one place. Finding a known id in an array is not that, and importing classes.js
   to do it would close a loop for four lines (see this file's header). */
function findClass(id) {
  return classesIn(getDoc()).filter((c) => c.id === id)[0] || null;
}

function findCategory(cls, id) {
  return categoriesOf(cls).filter((c) => c.id === id)[0] || null;
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

/* Is this class graded on total points (WO-3.30)? Read off the key directly, and deliberately not
   src/grade-engine.js's gradingModeOf(): that file imports this one, so importing it back would
   close the loop this file's header refuses — the reason src/grading-mode.js exists at all. The rule
   is the one gradingModeOf() states: "points" is the only value that means anything, and an absent
   key is weighted. Used for the sentences this module speaks and for nothing else; no arithmetic
   here branches on it (WO-3.43). */
function gradedOnPoints(cls) { return !!cls && cls.gradingMode === 'points'; }

function showCategoryError(message) {
  const el = document.getElementById(CATEGORY_ERROR_ID);
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
  /* Also spoken, for the reason src/classes.js's showClassError() is: it lands in a corner of a
     dialog a screen-reader user has no reason to move to, and there is exactly one aria-live
     region in this app (src/live-region.js). */
  if (message) announce(message);
}

/* Roll Call!'s `.class-action-btn` outline button, built the way src/classes.js builds one. Four
   lines copied rather than imported, for the reason findClass() above is not imported. */
function actionButton(label, hook, value, extraClass) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'class-action-btn' + (extraClass ? ' ' + extraClass : '');
  btn.setAttribute(hook, value);
  btn.textContent = label;
  return btn;
}

/*
  THE PERSISTENT WARNING, and the second deliverable of this work order.

  It is a standing line in the panel rather than an error that appears and clears, and that is the
  whole of what "persistent" buys: a teacher who has typed 40, 35 and 20 and then gone to look at
  something else finds the same sentence waiting when she comes back. It NAMES THE TOTAL — "95%",
  not "invalid" — because the number is the thing she can act on, and because "these weights are
  wrong" without saying how wrong is a sentence she has to do arithmetic to use.

  It is drawn in both states. The balanced state is a quiet positive line rather than nothing at
  all: a total that appears only when it is wrong makes its own absence the message, and a teacher
  who has just fixed the weights deserves to be told they are fixed rather than left to infer it
  from a banner going away. The warning state is amber and carries the ⚠ — design/style-guide.md §1
  reserves red for what destroys something, and nothing here does.

  NOT AN ARIA-LIVE REGION. There is exactly one in this app (src/live-region.js), and a second one
  updating on every keystroke would read a partly-typed number out loud. Instead the CROSSING is
  announced — balanced to not, or back — which is the moment a screen-reader user cannot see.
*/
function renderTotal(cls) {
  const el = document.getElementById(CATEGORY_TOTAL_ID);
  if (!el) return;
  const cats = categoriesOf(cls);
  const total = weightTotal(cls);
  const balanced = isBalanced(cls);

  el.classList.toggle('warn', !balanced);
  if (!cats.length) {
    el.textContent = '⚠ No categories yet, so there is nothing to weight. A class with no '
      + 'categories has no grade at all — add the ones this class is actually graded on.';
  } else if (balanced) {
    el.textContent = 'Weights total 100%. Every category counts for exactly what it says.';
  } else {
    const off = 100 - total;
    el.textContent = '⚠ Weights total ' + formatWeight(total) + '%, not 100% — '
      + (off > 0 ? formatWeight(off) + '% short' : formatWeight(-off) + '% over')
      + '. Nothing is blocked: keep setting up. Any grade in this class is provisional until '
      + 'they add up.';
  }

  /* In a class graded on total points the line above is hidden (src/grading-mode.js's paintEditor)
     and the weights are in no formula, so "grades are provisional" would be false out loud. A
     crossing there can only come from a removal — the fields are disabled — and it is still spoken,
     because the number is real and kept for the day the class goes back; it just says what it does
     not do (WO-3.43). The weighted sentences are byte-for-byte what they were. */
  if (lastBalanced !== null && lastBalanced !== balanced) {
    if (gradedOnPoints(cls)) {
      announce('The weights now total ' + formatWeight(total) + ' percent. ' + cls.name
        + ' is graded on total points, so they change no grade.');
    } else {
      announce(balanced ? 'Weights total 100%.'
        : 'Weights total ' + formatWeight(total) + ' percent, not 100. Grades are provisional.');
    }
  }
  lastBalanced = balanced;
}

/*
  One row per category: name, weight, reorder, remove.

  Built with createElement rather than innerHTML for the reason src/year-picker.js gives and
  src/classes.js makes real — a category name is typed by a teacher, and a category called
  "Labs & <projects>" has to be those characters rather than markup.
*/
function categoryRow(cls, cat, index, siblings) {
  const row = document.createElement('div');
  row.className = 'category-row';

  const name = document.createElement('input');
  name.className = 'category-name-input';
  name.type = 'text';
  name.value = cat.name || '';
  name.setAttribute('data-category-field', 'name');
  name.setAttribute('data-category-id', cat.id);
  name.setAttribute('aria-label', 'Name of category ' + (index + 1) + ' in ' + cls.name);
  name.setAttribute('autocomplete', 'off');
  row.append(name);

  /* The number and its unit as one group, so "%" can never wrap away from the field it belongs to.
     Lifted from Roll Call!'s `.config-num` + `.config-num-wrap` pair (dashboard.html ~711-716),
     which is the same shape — a small centred numeric field with its unit beside it — rather than
     a percent sign typed into the field, which would make the value a string to parse. */
  const wrap = document.createElement('div');
  wrap.className = 'category-weight-field';

  const weight = document.createElement('input');
  weight.className = 'category-weight';
  /* A real number input: iPadOS gives a numeric keypad for it, and the up/down spinner is a
     laptop path for a teacher nudging one weight to make the total land. `min` is a hint to the
     spinner and to a form validator; it is NOT the guard, and nothing here refuses a value it
     dislikes — see decision 1 in this file's header. */
  weight.type = 'number';
  weight.min = '0';
  weight.step = '1';
  weight.setAttribute('inputmode', 'decimal');
  weight.value = formatWeight(weightOf(cat));
  weight.setAttribute('data-category-field', 'weight');
  weight.setAttribute('data-category-id', cat.id);
  weight.setAttribute('aria-label', 'Weight of ' + (cat.name || 'this category') + ' in '
    + cls.name + ', as a percentage');
  wrap.append(weight);

  const unit = document.createElement('span');
  unit.className = 'category-weight-unit';
  unit.textContent = '%';
  /* Decoration beside a field whose accessible name already says "as a percentage". */
  unit.setAttribute('aria-hidden', 'true');
  wrap.append(unit);
  row.append(wrap);

  const actions = document.createElement('div');
  actions.className = 'category-row-actions';
  /* Explicit up/down rather than drag, for the reason src/classes.js gives about class rows:
     HTML5 drag-and-drop does not fire for touch on iPadOS at all, so a dragged row is a
     laptop-only affordance. The order of this array IS the order categories are listed in — there
     is no `order` field, because two ways to say where a category sits is one way for them to
     disagree. */
  const up = actionButton('↑', 'data-category-move-up', cat.id, 'move');
  up.setAttribute('aria-label', 'Move ' + (cat.name || 'this category') + ' earlier');
  up.disabled = index === 0;
  const down = actionButton('↓', 'data-category-move-down', cat.id, 'move');
  down.setAttribute('aria-label', 'Move ' + (cat.name || 'this category') + ' later');
  down.disabled = index === siblings - 1;
  actions.append(up, down);

  const remove = actionButton('Remove', 'data-category-remove', cat.id, 'delete');
  remove.setAttribute('aria-label', 'Remove ' + (cat.name || 'this category') + ' from ' + cls.name);
  /* The dialog is conditional — a category holding nothing goes on the tap — so this cannot claim
     `aria-haspopup="dialog"` unconditionally. It is set below, per row, when there is something to
     confirm; a promise of a dialog that does not open is worse than no promise. */
  const held = assignmentsIn(getDoc(), cls.id, cat.id);
  if (held) remove.setAttribute('aria-haspopup', 'dialog');
  actions.append(remove);

  row.append(actions);
  return row;
}

function renderCategoryList() {
  const cls = findClass(categoryClassId);
  const heading = document.getElementById(CATEGORY_CLASS_NAME_ID);
  if (heading) heading.textContent = cls ? cls.name : '';
  renderTotal(cls);

  const box = document.getElementById(CATEGORY_LIST_ID);
  if (!box) return;
  box.textContent = '';
  if (!cls) return;

  const cats = categoriesOf(cls);
  if (!cats.length) {
    const empty = document.createElement('div');
    empty.className = 'class-empty';
    empty.textContent = 'No categories in this class yet. Add the ones it is graded on — whatever '
      + 'you actually put in the book.';
    box.append(empty);
    return;
  }
  /* Rendered in the order the document holds them, and never sorted — not by weight, not by name.
     A teacher who put Homework first sees Homework first. */
  cats.forEach((cat, i) => box.append(categoryRow(cls, cat, i, cats.length)));
}

export function openCategoryEditor(classId, opener) {
  if (!findClass(classId)) return;
  categoryClassId = classId;
  pendingRemoveId = '';
  /* Null rather than false, so the first render of a class is not reported as a crossing — see
     renderTotal(). A class that opens already unbalanced should show the banner, not announce it. */
  lastBalanced = null;
  showCategoryError('');
  renderCategoryList();
  /* Opened through its own hook rather than data-modal-open, for the reason src/classes.js gives:
     the panel is filled from the document, and a modal that opens and then fills in flickers. */
  openModal(CATEGORY_MODAL_ID, opener);
}

/* ────────────────────────────── writing ────────────────────────────── */

export function addCategory() {
  const cls = findClass(categoryClassId);
  if (!cls) return;
  /*
    A new category arrives at 0%, and that is the deliberate answer rather than a missing feature.
    Any non-zero guess would silently change every other category's share of the grade the instant
    it was added — the teacher asked for a category, not for a reweighting — and 0 is the only
    number that leaves the existing weights meaning exactly what they meant a second ago. The
    banner goes amber at once and says how far off the total now is, which is the prompt to type
    the real number.
  */
  const cat = newCategory('New category', 0);
  update(() => {
    if (!Array.isArray(cls.categories)) cls.categories = [];
    cls.categories.push(cat);
  });
  showCategoryError('');
  renderCategoryList();
  /* The 0 is still stored in a points class — it waits, disabled, for the day the class goes back
     (src/grading-mode.js) — but saying "at 0 percent" there names a number that counts for nothing
     and reads as though the new category will. WO-3.43. */
  announce(gradedOnPoints(cls)
    ? 'Added ' + cat.name + ' to ' + cls.name + ', which is graded on total points, so it needs no '
      + 'weight.'
    : 'Added ' + cat.name + ' to ' + cls.name + ' at 0 percent.');
  /* Focus and select the new name, because "New category" is a placeholder to type over rather
     than a name. After the render, for the reason src/classes.js's renderClassList() gives: an
     input that is not yet in the document cannot take focus, and on iPadOS a focus() that misses
     is a software keyboard that never appears. */
  const box = document.getElementById(CATEGORY_LIST_ID);
  const field = box && box.querySelector('.category-row:last-child .category-name-input');
  if (field) { field.focus(); field.select(); }
}

/*
  A name or a weight being typed. Called from src/shell.js's `input` listener, so it fires per
  keystroke and the store's debounce is what turns that into one save (src/store.js).

  THE ROW IS NOT RE-RENDERED — replacing the input the teacher is typing into would take the caret
  with it, which is the rule src/classes.js's editTermField() states — but the TOTAL is, on every
  keystroke, because a running total that lags the field it is adding up is worse than no total.
  That is also the closest this work order gets to its fourth acceptance line: the number the grade
  will be computed from is recomputed and redrawn as the weight is typed. What has no consumer yet
  is a displayed grade; see this file's header.
*/
export function editCategoryField(input) {
  const cls = findClass(categoryClassId);
  const id = input.getAttribute('data-category-id');
  const field = input.getAttribute('data-category-field');
  if (!cls || !id) return;
  if (field !== 'name' && field !== 'weight') return;
  const cat = findCategory(cls, id);
  if (!cat) return;

  if (field === 'name') {
    update(() => { cat.name = input.value; });
  } else {
    /* An empty field reads as 0 — Number('') is 0 — which is what a teacher who has cleared a box
       to retype it means for the second she is between numbers, and it keeps the total honest
       while she does it. A field mid-way through a number ("1e") reports '' too, so there is no
       state in which this stores NaN. */
    const n = Number(input.value);
    if (!Number.isFinite(n)) return;
    update(() => { cat.weight = n; });
  }
  showCategoryError('');
  renderTotal(cls);
}

/* Reorder. Swaps with the neighbour, exactly as src/classes.js's moveClass() does, and says the
   new position out loud — reordering a list is a change a screen-reader user cannot see happen
   and cannot infer from focus staying where it was. */
function moveCategory(id, delta) {
  const cls = findClass(categoryClassId);
  if (!cls) return;
  const cats = categoriesOf(cls);
  const at = cats.findIndex((c) => c.id === id);
  const swapWith = cats[at + delta];
  if (at === -1 || !swapWith) return;
  const cat = cats[at];
  update(() => { cats[at] = swapWith; cats[at + delta] = cat; });
  showCategoryError('');
  renderCategoryList();
  announce((cat.name || 'That category') + ' is now ' + (at + delta + 1) + ' of ' + cats.length + '.');
}

export function moveCategoryUp(id) { moveCategory(id, -1); }
export function moveCategoryDown(id) { moveCategory(id, 1); }

/*
  Assignments filed under one category OF ONE CLASS, which is the one question this module asks
  about grade data, and what decides whether removing a category asks first.

  THE `classId` HALF WAS ADDED AT WO-3.3 AND IT IS NOT DECORATION. This function and the two below
  it filtered by `categoryId` alone, which was safe for exactly as long as a category id could only
  appear in the class it was made in — and duplicate-to-another-class is the feature that ends
  that. A copy carrying its source's `categoryId` into another class would be counted here, and
  moved to "no category" by applyRemoval() below (destroyed, before WO-3.43), under a dialog naming
  a class it was never in. src/assignments.js makes sure no such copy is ever written (it matches
  the target's category by name and refuses an id from another class); this is the guard on the
  other side of that promise, for the document that arrives from a restore, a hand edit, or a build
  older than this one.
*/
function assignmentsIn(doc, classId, categoryId) {
  return (Array.isArray(doc && doc.assignments) ? doc.assignments : [])
    .filter((a) => a.classId === classId && a.categoryId === categoryId).length;
}

/* Everything a removal would move, counted off the open document rather than estimated — the same
   shape as src/classes.js's deletionCounts(), and kept since WO-3.43 for a different reason than it
   was written for: nothing is destroyed any more, but the grade still changes in a weighted class,
   and "2 assignments and 41 scores move to no category" is the size of that change in words a
   teacher can check against her list. Class-scoped since WO-3.3 — see assignmentsIn() above. */
function removalCounts(doc, classId, categoryId) {
  const assignments = (Array.isArray(doc.assignments) ? doc.assignments : [])
    .filter((a) => a.classId === classId && a.categoryId === categoryId);
  /* Scores are keyed by assignment, then student (docs/data-model.md), so the count is the number
     of cells in the columns belonging to those assignments. A key that is not there means ungraded
     and is not a score. */
  const scores = assignments.reduce((n, a) => {
    const column = doc.scores && doc.scores[a.id];
    return n + (column ? Object.keys(column).length : 0);
  }, 0);
  return { assignments: assignments.length, scores: scores };
}

/* `.mode-change-line`, the grading-mode confirmation's neutral fact line, rather than the class
   delete's red `.class-delete-line`: since WO-3.43 nothing in this dialog destroys anything, and the
   danger wash would say it did. */
function factLine(parent, text) {
  const el = document.createElement('div');
  el.className = 'mode-change-line';
  el.textContent = text;
  parent.append(el);
}

/*
  ── REMOVING A CATEGORY MOVES ITS WORK TO "NO CATEGORY" (WO-3.43, the owner, 2026-10-04) ──

  WHAT THIS USED TO DO, AND WHY IT STOPPED. WO-3.1's third deliverable — "removing a category warns
  about the assignments it takes with it" — had a removal take the assignments filed under it and
  their score columns, behind a red dialog that counted them first. The argument for that, which
  stood here, was against the alternative: src/classes.js's removeTerm() REFUSES when a term still
  holds work, because "a grade that quietly stops counting is the worst failure this app has", and
  work left pointing at a category that no longer exists was an orphan — still in `assignments`,
  still holding scores, counted by nothing, and SILENT. Destroying it was quieter than nothing only
  in the sense that there was nothing left to be quiet about.

  THE PREMISE IS GONE, SO THE CONCLUSION GOES WITH IT. Work in no category is not silent any more:
  the assignment list draws a "Not in a category" group under every class that has some — red in a
  weighted class, where it counts for nothing, amber in a points class, where it counts (WO-3.36);
  the score grid and the grade sheet name "no category"; and the points engine counts it as a row
  of its own (WO-3.30). So the work stays. The category goes, and each assignment filed under it IN
  THIS CLASS has its `categoryId` set to '' — the value an assignment created in a class with no
  categories already carries (src/assignments.js), so a backup never holds an id for a category that
  is gone. That clearing is tidiness rather than meaning: an id matching no category already read as
  "no category" everywhere.

  What that does to the grade is the class's formula's business, not this file's: on weighted
  categories the work counts for nothing until it is filed again, and the remaining weights are left
  exactly as typed, so the class totals less than 100 until she sets them; on total points the work
  goes on counting, under "no category", and no grade moves. The dialog says whichever is true.

  THERE IS NO "DELETE THE WORK TOO". The owner ruled for one behaviour, and a second button is how
  the destructive path comes back. Deleting an assignment is the assignment list's own Delete, one
  piece of work at a time, with its own count.

  So: nothing filed under it, and the category goes on the tap. Work filed under it, and she reads
  where it goes and what that does to the grade, and taps a button naming the category. The term
  editor's refusal stays where it is; a term id with no term behind it still has no group of its own
  to be found in.
*/
export function removeCategory(id, opener) {
  const doc = getDoc();
  const cls = findClass(categoryClassId);
  if (!doc || !cls) return;
  const cat = findCategory(cls, id);
  if (!cat) return;

  const counts = removalCounts(doc, cls.id, id);
  if (!counts.assignments) {
    applyRemoval(cls, cat, counts);
    return;
  }

  pendingRemoveId = id;
  const byPoints = gradedOnPoints(cls);
  const them = counts.assignments === 1 ? 'it' : 'them';
  const lead = document.getElementById(REMOVE_LEAD_ID);
  if (lead) {
    lead.textContent = 'Removing “' + (cat.name || 'this category') + '” from ' + cls.name
      + ' keeps the work filed under it. The assignments and their scores stay, under no category, '
      + (byPoints
        ? 'and because ' + cls.name + ' is graded on total points, they go on counting toward the '
          + 'grade. You can file ' + them + ' under another category whenever you like.'
        : 'and they stop counting toward the grade until you file ' + them + ' under another '
          + 'category.');
  }
  const facts = document.getElementById(REMOVE_FACTS_ID);
  if (facts) {
    facts.textContent = '';
    factLine(facts, plural(counts.assignments, 'assignment', 'assignments') + ' and '
      + plural(counts.scores, 'score', 'scores') + ' move to no category.');
    if (byPoints) {
      factLine(facts, 'Every point in ' + (counts.assignments === 1 ? 'it' : 'them')
        + ' still counts, so no grade in ' + cls.name + ' changes.');
    } else {
      /* weightTotal() less the one weight leaving — the figure the editor's own total line prints
         the moment the category is gone, through the same formatter. */
      factLine(facts, 'The remaining categories keep the weights they have, so this class totals '
        + formatWeight(weightTotal(cls) - weightOf(cat)) + '% until you set them.');
    }
  }
  const button = document.getElementById(REMOVE_BTN_ID);
  if (button) button.textContent = 'Remove ' + (cat.name || 'this category');
  openModal(REMOVE_MODAL_ID, opener);
}

/* The only lines in this module that touch grade data, and they destroy nothing: the category
   leaves the class, and every assignment filed under it IN THIS CLASS is re-filed under no category
   by clearing its `categoryId` to ''. Not `null` and not a deleted key — '' is the value
   src/assignments.js already writes for an assignment made in a class with no categories, so this
   is not a new shape for a backup to carry. Score columns are not touched at all. Students,
   attendance, terms, every other category — and, since WO-3.3 put the `classId` on the test below,
   any work in another class that a restored document filed under the same id — are untouched. */
function applyRemoval(cls, cat, counts) {
  const name = cat.name || 'the category';
  update((d) => {
    (Array.isArray(d.assignments) ? d.assignments : []).forEach((a) => {
      if (a.classId === cls.id && a.categoryId === cat.id) a.categoryId = '';
    });
    cls.categories = categoriesOf(cls).filter((c) => c.id !== cat.id);
  });
  showCategoryError('');
  renderCategoryList();
  /* Where the work went, rather than a count of what was destroyed (WO-3.43). */
  const moved = counts.assignments;
  announce('Removed ' + name + ' from ' + cls.name
    + (!moved
      ? '. Nothing was filed under it.'
      : '. ' + (moved === 1 ? 'Its assignment is' : 'Its ' + moved + ' assignments are')
        + ' now under no category' + (gradedOnPoints(cls)
          ? ' and still ' + (moved === 1 ? 'counts' : 'count') + ' toward the grade.'
          : ' and ' + (moved === 1 ? 'counts' : 'count') + ' for nothing until you file '
            + (moved === 1 ? 'it' : 'them') + ' again.')));
}

export function confirmRemoveCategory() {
  const doc = getDoc();
  const cls = findClass(categoryClassId);
  const cat = cls ? findCategory(cls, pendingRemoveId) : null;
  const id = pendingRemoveId;
  pendingRemoveId = '';
  closeModal(REMOVE_MODAL_ID);
  if (!doc || !cls || !cat) return;
  applyRemoval(cls, cat, removalCounts(doc, cls.id, id));
}

/* No. Nothing has been written, so there is nothing to undo — which is the point of counting
   before the dialog rather than after it. */
export function cancelRemoveCategory() {
  pendingRemoveId = '';
  closeModal(REMOVE_MODAL_ID);
  announce('Nothing was removed.');
}
