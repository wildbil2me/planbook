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
     assignments are counted at all is removal, below, where the count is what the teacher is being
     asked to agree to.
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

  if (lastBalanced !== null && lastBalanced !== balanced) {
    announce(balanced ? 'Weights total 100%.'
      : 'Weights total ' + formatWeight(total) + ' percent, not 100. Grades are provisional.');
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
  announce('Added ' + cat.name + ' to ' + cls.name + ' at 0 percent.');
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
  about grade data and the only thing that makes removing a category destructive.

  THE `classId` HALF WAS ADDED AT WO-3.3 AND IT IS NOT DECORATION. This function and the two below
  it filtered by `categoryId` alone, which was safe for exactly as long as a category id could only
  appear in the class it was made in — and duplicate-to-another-class is the feature that ends
  that. A copy carrying its source's `categoryId` into another class would be counted here, and
  destroyed by applyRemoval() below, under a dialog naming a class it was never in.
  src/assignments.js makes sure no such copy is ever written (it matches the target's category by
  name and refuses an id from another class); this is the guard on the other side of that promise,
  for the document that arrives from a restore, a hand edit, or a build older than this one.
*/
function assignmentsIn(doc, classId, categoryId) {
  return (Array.isArray(doc && doc.assignments) ? doc.assignments : [])
    .filter((a) => a.classId === classId && a.categoryId === categoryId).length;
}

/* Everything a removal would destroy, counted off the open document rather than estimated — the
   same shape as src/classes.js's deletionCounts() and for the same reason: "Remove Tests?" is a
   question a tired teacher answers yes to, and "9 assignments and 214 scores" is one she reads.
   Class-scoped since WO-3.3 — see assignmentsIn() above for why that stopped being optional. */
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

function factLine(parent, text) {
  const el = document.createElement('div');
  el.className = 'class-delete-line';
  el.textContent = text;
  parent.append(el);
}

/*
  ── THE POINT OF DEPARTURE FROM src/classes.js's removeTerm(), STATED HERE BECAUSE IT IS ONE ──

  removeTerm() and applyPreset() REFUSE when a term still holds an assignment, and say why: "a
  grade that quietly stops counting is the worst failure this app has." This does not refuse. It
  warns, counts, and then destroys what it counted, which is what WO-3.1's third deliverable asks
  for in those words — "removing a category warns about the assignments it takes with it."

  WHY THE OTHER RULE DOES NOT BEAT IT HERE. Read the refusal's reason exactly: the failure it names
  is a grade that stops counting QUIETLY. Removing a term without cascading would leave assignments
  pointing at a term id that no longer exists — still in `assignments`, still holding scores, still
  looking like work, and counted by nothing. That is an orphan, and an orphan is silent. A category
  removal that takes its assignments and their score columns with it leaves no orphan at all: the
  work is gone, the teacher was shown the count of it before she agreed, and the grade changes for
  a reason she can name. That is the class-delete grammar in this same file — the third precedent,
  the one that is allowed to destroy precisely because it counts first (src/classes.js's
  openDeleteConfirm) — and it is the right one for a container the teacher is choosing to abolish.

  So: nothing in the way, and the category goes on the tap. Something in the way, and she reads
  what goes and taps a second, differently-worded button. The refusal stays where it is; this is a
  different question with a different answer, not a loosening of that one.
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
  const lead = document.getElementById(REMOVE_LEAD_ID);
  if (lead) {
    lead.textContent = 'Removing “' + (cat.name || 'this category') + '” from ' + cls.name
      + ' takes the work filed under it as well. This cannot be undone, and a backup file is the '
      + 'only way back. If you only want it to stop counting, set its weight to 0 instead — the '
      + 'assignments stay and the grade stops using them.';
  }
  const facts = document.getElementById(REMOVE_FACTS_ID);
  if (facts) {
    facts.textContent = '';
    factLine(facts, plural(counts.assignments, 'assignment', 'assignments') + ' and '
      + plural(counts.scores, 'score', 'scores'));
    factLine(facts, 'The remaining categories keep the weights they have, so this class totals '
      + formatWeight(weightTotal(cls) - weightOf(cat)) + '% until you set them.');
  }
  const button = document.getElementById(REMOVE_BTN_ID);
  if (button) button.textContent = 'Remove ' + (cat.name || 'this category');
  openModal(REMOVE_MODAL_ID, opener);
}

/* The only lines in this module that destroy anything, and they destroy exactly what the dialog
   listed: the category, the assignments filed under it IN THIS CLASS, and the score columns
   belonging to those assignments. Students, attendance, terms, every other category — and, since
   WO-3.3 put the `classId` on both tests below, any work in another class that a restored document
   filed under the same id — are untouched. */
function applyRemoval(cls, cat, counts) {
  const name = cat.name || 'the category';
  update((d) => {
    const gone = (Array.isArray(d.assignments) ? d.assignments : [])
      .filter((a) => a.classId === cls.id && a.categoryId === cat.id).map((a) => a.id);
    gone.forEach((assignmentId) => { if (d.scores) delete d.scores[assignmentId]; });
    d.assignments = (Array.isArray(d.assignments) ? d.assignments : [])
      .filter((a) => !(a.classId === cls.id && a.categoryId === cat.id));
    cls.categories = categoriesOf(cls).filter((c) => c.id !== cat.id);
  });
  showCategoryError('');
  renderCategoryList();
  announce('Removed ' + name + ' from ' + cls.name
    + (counts.assignments
      ? ', with ' + plural(counts.assignments, 'assignment', 'assignments') + ' and '
        + plural(counts.scores, 'score', 'scores') + '.'
      : '. Nothing was filed under it.'));
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
