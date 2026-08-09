/*
  Letter grades — the bands a percentage becomes a letter through, and the only place in this app
  that decides what an A is.

  WHY THIS IS ITS OWN FILE. src/teacher.js declines it by name: settings about the gradebook rather
  than about the teacher "belong to the work orders that use them and want their own home." It is
  not a corner of src/categories.js either — that file owns what a class is graded ON and its
  arithmetic is a sum over one class's categories, where this owns what a percentage is CALLED and
  is document-wide with a per-class exception. The two never read each other, and neither imports
  the other.

  THE IMPORT RUNS ONE WAY, exactly as src/categories.js's does: this file imports the store, the
  modal system and the live region, and nothing imports it back except src/shell.js, which resolves
  "which class" for every module here and hands an id down. A findClass() reaching into
  src/classes.js would close the sixth import loop this repo has refused.

  ── THE BOUNDARY IS THE ROUNDING RULE, AND THAT IS THE WHOLE DESIGN ──

  WO-3.2's Why-it-exists: "if 89.5 should be an A, the boundary is 89.5, and there is no separate
  rounding rule to disagree with the SIS about." So there is no rounding anywhere between a
  percentage and a letter. letterFor() compares the number it was handed against `min` unmodified —
  no epsilon, no tolerance, no toFixed on the way in — and there is no option, preference or helpful
  default that rounds a percentage before it is banded. A "round to nearest whole percent" switch is
  precisely the second, disagreeing rule this design deletes, and the Traps line forbids it; so does
  a tolerance or an epsilon wearing its clothes. src/categories.js's BALANCE_EPSILON is not a
  precedent for one here: that tolerance is about a SUM of decimals in IEEE-754 and never touches a
  grade, and this comparison is a single `>=` against a number the teacher typed herself.

  NOTHING IN THIS FILE ROUNDS EVEN FOR DISPLAY. A boundary is printed with String() (see
  boundaryText below), because 89.5 has to read as 89.5 and a formatter is a place a second rule
  moves in later. The four Math.round calls elsewhere in this repo — src/attendance.js's attendance
  percentage, src/categories.js's formatWeight(), src/backup.js's file size in MB and src/passes.js's
  elapsed minutes — are display formatting over numbers that are not grades and do not choose a
  letter; they predate this work order and are not this file's business. (This said "two" and named
  the first pair until the count was actually run; tools/wo-sweep.mjs § 10 now names them, so the
  allowlist lives in the tool that checks it rather than in a comment nobody re-counts.)

  ── WHAT WO-3.4 IMPORTS RATHER THAN REWRITING ──

  letterScaleOf(), scaleForClass(), hasOwnScale(), letterFor(), bandRanges() and scaleFaults() are
  pure functions of a document, a class and a scale — no DOM, no store, no clock — for the reason
  WO-3.4 states about the grade engine: the arithmetic the product's credibility rests on has to be
  verifiable by hand, separately from anything that draws it. WO-3.4 owns category percentage and
  the weighted class grade and **must import letterFor() rather than write a second one**: two
  percentage-to-letter rules is the disagreement this whole design exists to delete. THE GRADE
  ENGINE IS NOT HERE, and nothing in this app displays a grade yet — so the band list in this
  editor is where the mapping is made visible, and there is deliberately no grade preview over
  student data to demonstrate it with.

  ── WHAT "A GAP OR AN OUT-OF-ORDER BAND" CAN MEAN, GIVEN THE SHAPE ──

  A band is `{ letter, min }` and its upper bound is DERIVED — it runs from its own `min` up to, but
  not including, the lowest `min` above it in the list. So the bands are contiguous by construction
  and an INTERIOR GAP IS NOT EXPRESSIBLE: there is no second number to disagree with the next
  band's, and no way to type a hole between 80 and 83. That is why the editor does not check for
  one, and why deliverable 4 — "shows the resulting bands as ranges so a gap or overlap is visible
  on sight" — is the other half of the same answer: printing the derived range is what makes the
  invariant legible without a validator.

  Two failures ARE expressible, and scaleFaults() is exactly those two:

    1. A BAND THAT CAN NEVER BE REACHED. A percentage takes the first band whose `min` it meets,
       reading down, so a band is reachable only if its `min` is strictly below every `min` above it
       in the list. Two bands at 90, or an A at 89.5 sitting above an A− at 90, silently skip one:
       every percentage that would have been an A− is an A first. This is the "overlap" of the
       deliverable and the "out-of-order band" of the acceptance line, and they are the same defect.
       A band whose `min` is not a finite number is in this set too, because letterFor() cannot
       match it.
    2. A GAP AT THE BOTTOM. The lowest reachable `min` above 0 leaves every percentage below it with
       no letter at all — the seed's F sits at 0 for that reason. This is the only true gap the
       shape allows, and it is at the bottom because that is the one edge with nothing below it to
       be contiguous with.

  ── THREE THINGS THAT WILL LOOK LIKE OMISSIONS AND ARE DECISIONS ──

  1. A BOUNDARY IS STORED EXACTLY AS IT WAS TYPED, which is src/categories.js's first decision about
     a weight and docs/data-model.md § Grade math's rule about a score: "a score that silently isn't
     what you typed is the worst thing a gradebook can do." Nothing here clamps, sorts, rounds or
     repairs a number a teacher entered — not 89.5, not 140, not a boundary that makes the scale
     unusable. letterFor() in particular NEVER SORTS: sorting would quietly fix a broken scale, make
     the editor's warning a warning about nothing, and hand the teacher a letter she did not define.

  2. THE WARNING NEVER BLOCKS. A scale mid-edit is ordinarily wrong — every boundary between two
     typed digits is — so nothing is disabled, no save is refused, and the note under the list is a
     standing sentence rather than a dialog. Same call src/categories.js made, in that file's words:
     "the teacher is mid-setup; don't block them, tell them."

  3. A BAND HAS NO ID, unlike a category. docs/data-model.md settles the shape as `{ letter, min }`
     and nothing anywhere references a band: a category is filed under by assignments, so it needs
     stable identity, and a band is only ever read positionally by the mapping above. Rows are keyed
     by index, which is the src/roster.js grammar for guardians and accommodations and for the same
     reason. An id here would be a field nobody reads and a schema change nobody asked for.
*/

import { getDoc, update } from './store.js';
import { openModal } from './modal.js';
import { announce } from './live-region.js';

const SCALE_MODAL_ID = 'letterScaleModal';

const SUBJECTS_ID = 'scaleSubjects';
const OVERRIDE_ID = 'scaleOverride';
const BAND_LIST_ID = 'bandList';
const NOTE_ID = 'scaleNote';
const ADD_ROW_ID = 'bandAddRow';

/* ────────────────────────────── reading, and the mapping ────────────────────────────── */

/* Every read of a scale goes through here, for the reason src/categories.js's categoriesOf() and
   src/classes.js's termsOf() exist: a document can legitimately arrive without the key — from a
   backup written before src/store.js seeded one — and a screen that has to check before it iterates
   is a screen that will eventually forget (src/store.js:102-104). */
function bandsIn(scale) {
  return Array.isArray(scale) ? scale : [];
}

/* The document-wide scale. src/store.js's defaultLetterScale() seeds twelve bands into every new
   document and that is the only place letter boundaries are written by a programmer; nothing here
   re-seeds, and 90/80/70 appears nowhere in this file for any reason. */
export function letterScaleOf(doc) {
  return bandsIn(doc && doc.letterScale);
}

/* Does this class define its own bands? `null` means "use the document default" (docs/data-model.md,
   and src/classes.js writes the sentinel into every new class), so the presence of an ARRAY is the
   override. An override the teacher has emptied is an empty override and not a fallback: treating
   `[]` as "use the default" would make deleting every band silently mean something else, which is a
   second rule of exactly the kind this work order deletes. The editor says so in words instead. */
export function hasOwnScale(cls) {
  return !!cls && Array.isArray(cls.letterScale);
}

/* The bands that actually apply to one class — the whole of the per-class override. */
export function scaleForClass(doc, cls) {
  return hasOwnScale(cls) ? bandsIn(cls.letterScale) : letterScaleOf(doc);
}

/* A band's boundary as a number, or null when it is not one. A band with no numeric `min` cannot be
   matched by letterFor() below, which is why null propagates into the fault list rather than being
   quietly read as 0. */
function minOf(band) {
  const n = Number(band && band.min);
  return Number.isFinite(n) ? n : null;
}

function letterOf(band) {
  return band && band.letter != null ? String(band.letter) : '';
}

/*
  THE MAPPING, and the one function every later screen asks. A percentage maps to the first band
  whose `min` it meets, reading down the list in the order the teacher put them in.

  UNMODIFIED, IN BOTH DIRECTIONS. The percentage is compared as it arrives and the boundary is
  compared as it was typed: `>=`, and nothing else. That is what makes 89.5 an A when the boundary
  is 89.5 and 89.49 the band below — the comparison IS the rounding rule, and there is no second one
  to disagree with the SIS about.

  Returns null when no band matches, which is a real answer rather than a failure: a scale with a
  gap at the bottom has percentages with no letter, and the screen that wanted a letter says so.
  It must never fall back to a letter nobody defined.

  THE LIST IS NOT SORTED FIRST — see decision 1 in this file's header.
*/
export function letterFor(percentage, scale) {
  const n = Number(percentage);
  if (!Number.isFinite(n)) return null;
  const bands = bandsIn(scale);
  for (let i = 0; i < bands.length; i++) {
    const min = minOf(bands[i]);
    if (min !== null && n >= min) return letterOf(bands[i]);
  }
  return null;
}

/*
  THE DERIVED UPPER BOUND OF EVERY BAND, AND THE REACHABILITY VERDICT THAT FALLS OUT OF IT — one
  pass, one answer, so the ranges a teacher reads and the faults the note reports cannot disagree.

  `to` is the lowest boundary above the band, which is where its own range stops; null means nothing
  above it, so it runs up with no ceiling (a grade over 100% is ordinary here — WO-3.4's extra credit
  is a zero-point assignment and nothing caps a percentage). `reachable` is `from < to`, and that
  comparison is the whole validator:

    - the RUNNING MINIMUM is what `to` has to be, not the previous row's boundary. [A 93, B+ 95,
      A− 90] leaves A− reachable between 90 and 93, because 94 is an A before B+ is ever asked. A
      check against the previous row would call A−'s range 90-to-95 and be wrong about 94.
    - an unreachable band does not move the ceiling, because letterFor() reaches the band above it
      first for every percentage it could have claimed.
*/
export function bandRanges(scale) {
  let ceiling = null;
  return bandsIn(scale).map((band) => {
    const from = minOf(band);
    const reachable = from !== null && (ceiling === null || from < ceiling);
    const range = { from: from, to: ceiling, reachable: reachable };
    if (reachable) ceiling = from;
    return range;
  });
}

/*
  THE TWO FAULTS THIS SHAPE CAN EXPRESS, which is acceptance line 3 — caught in the editor, by the
  same function the note on screen is drawn from, so the sentence a teacher reads and the verdict a
  later screen could ask for are one arithmetic.

  `unreachable` holds indexes so the note can name the letters. `gapBelow` is the lowest reachable
  boundary when it is above 0, and null when every percentage has a letter. Why an interior gap is
  not in here at all: this file's header, and the reason is that it is not expressible.
*/
export function scaleFaults(scale) {
  const ranges = bandRanges(scale);
  const unreachable = [];
  let floor = null;
  ranges.forEach((range, i) => {
    if (!range.reachable) { unreachable.push(i); return; }
    if (floor === null || range.from < floor) floor = range.from;
  });
  return {
    bands: ranges.length,
    /* Nothing is reachable at all: an empty scale, or one whose every band is skipped. Its own state
       rather than a gap, because "no percentage has a letter" is not a sentence about a floor. */
    reachable: ranges.length - unreachable.length,
    unreachable: unreachable,
    gapBelow: floor !== null && floor > 0 ? floor : null,
  };
}

/* A boundary as it goes on screen. String() and nothing else — see the header: a formatter is where
   a second rounding rule moves in, and 89.5 has to read as 89.5. An empty string for a band with no
   numeric boundary, which the note reports separately. */
function boundaryText(n) {
  return n === null ? '' : String(n);
}

/* ────────────────────────────── the editor ────────────────────────────── */

/*
  WHICH SCALE IS OPEN, and it is the answer to "where is the per-class override reached from".

  The class manager's row cannot take a seventh control and plans/gradebook-surfaces.md § "And the
  class manager gets less cramped by doing nothing" is explicit that this phase does not re-cut it;
  index.html's own measurements rule out another icon in either header strip at 390px. So the door is
  ONE document-level button in the class manager, beside the list of classes it is about, and the
  override is reached INSIDE this panel: the subject row at the top of it picks the document scale or
  one class, which is the shape WO-3.2's brief names first. The rejected alternatives are in
  index.html above #letterScaleModal, where a teacher-facing decision belongs.

  An id rather than an object, for the reason src/categories.js gives: the document can be replaced
  underneath this module by a restore or a year switch, and an object held across that is a reference
  into a document nobody has open any more. '' means the document-wide scale.
*/
let subjectClassId = '';

/* Whether the last render found the scale clean, so a crossing can be spoken once rather than on
   every keystroke. Reset when the editor opens, because the first render of a scale is not a
   crossing — src/categories.js's lastBalanced, same reasoning. */
let lastClean = null;

function classesIn(doc) { return doc && Array.isArray(doc.classes) ? doc.classes : []; }

/* A plain array lookup, deliberately not an import of src/classes.js — that file owns RESOLUTION
   (which class the teacher is looking at, against a preference that may name one that is gone) and
   this is not that. Same call src/categories.js's findClass() makes, for the same four lines. */
function findClass(id) {
  return classesIn(getDoc()).filter((c) => c.id === id)[0] || null;
}

/* Classes that are still on the bar. `archived` is a plain boolean on the class (src/classes.js:
   "a boolean on the class is the whole of it"), so this is a field read rather than a second copy of
   anything. An archived class keeps whatever override it had — it is put away, not changed — and
   simply stops being offered here. */
function activeClasses(doc) {
  return classesIn(doc).filter((c) => !c.archived);
}

function subjectClass() {
  return subjectClassId ? findClass(subjectClassId) : null;
}

/* The bands the panel is showing: one class's own, or the document's. */
function shownScale() {
  const doc = getDoc();
  const cls = subjectClass();
  return cls ? scaleForClass(doc, cls) : letterScaleOf(doc);
}

/* Whether those bands can be typed into here. A class without an override is shown the bands it
   uses, read-only: editing them would be editing every other class, from a panel whose subject row
   says the name of one. */
function editable() {
  const cls = subjectClass();
  return !cls || hasOwnScale(cls);
}

/* The array a write goes into, created empty if the key is absent. Empty and NOT re-seeded: seeding
   boundaries here would put numbers no teacher chose into the one setting this work order exists to
   take out of the app's hands. src/categories.js's addCategory() does the same for `categories`. */
function bandsForWriting() {
  const doc = getDoc();
  const cls = subjectClass();
  if (cls) return hasOwnScale(cls) ? cls.letterScale : null;
  if (!doc) return null;
  if (!Array.isArray(doc.letterScale)) update(() => { doc.letterScale = []; });
  return doc.letterScale;
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

/* A list of names in a sentence: "Period 3", "Period 3 and AP Bio", "Period 3, AP Bio and Latin". */
function nameList(names) {
  if (names.length < 2) return names.join('');
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}

/* Roll Call!'s `.class-action-btn` outline button, built the way src/classes.js and
   src/categories.js build one. Four lines copied rather than imported, for the reason findClass()
   above is not imported. */
function actionButton(label, hook, value, extraClass) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'class-action-btn' + (extraClass ? ' ' + extraClass : '');
  if (hook) btn.setAttribute(hook, value == null ? '' : value);
  btn.textContent = label;
  return btn;
}

/*
  WHICH SCALE THESE BANDS ARE — the subject row, and the door to the per-class override.

  `.pill` chips rather than a <select>, for the reason src/days-off.js gives about its kind row and
  src/classes.js about term presets: a <select> on an iPad is a spinning wheel over the whole screen,
  and this is a short list with a consequence visible immediately below it. They are NOT in a
  `data-pill-group` — src/shell.js's generic pill handler moves `.active` for a group whose only job
  is to look selected, and this row changes what the panel is showing, so the state is rendered from
  the document like every other row in this app.
*/
function renderSubjects() {
  const box = document.getElementById(SUBJECTS_ID);
  if (!box) return;
  box.textContent = '';
  const doc = getDoc();

  const every = document.createElement('button');
  every.type = 'button';
  every.className = 'pill' + (subjectClassId ? '' : ' active');
  every.setAttribute('data-scale-subject', '');
  every.setAttribute('aria-pressed', subjectClassId ? 'false' : 'true');
  every.textContent = 'Every class';
  box.append(every);

  activeClasses(doc).forEach((cls) => {
    const on = cls.id === subjectClassId;
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'pill' + (on ? ' active' : '');
    pill.setAttribute('data-scale-subject', cls.id);
    pill.setAttribute('aria-pressed', on ? 'true' : 'false');
    /* textContent, not innerHTML: a class name is typed by a teacher. */
    pill.textContent = cls.name;
    /* Said rather than drawn as a mark on the chip. A dot or a star on a pill is a legend to learn;
       the line below this row names the classes with their own bands in words. */
    pill.setAttribute('aria-label', cls.name + (hasOwnScale(cls)
      ? ', which has its own bands' : ', which uses the bands every class uses'));
    box.append(pill);
  });
}

/*
  WHOSE BANDS THESE ARE, AND THE SWITCH.

  Three states, and the writes behind the two buttons are the answer to "what does turning an
  override on write":

    - Turning it ON copies the bands that already apply, so the teacher edits from what she can see
      rather than from a blank list or from a diff. `null` means "use the document default", so the
      copy is the only honest starting point: a stored DIFF against the default would be a second
      thing to keep in step every time the default moved, and a teacher who changed the document A
      boundary would find one class silently following and another not.
    - Turning it OFF writes `null` — the sentinel, not an empty array, because "use the document
      default" is a thing the document already has a word for.

  Turning it off discards the class's own bands, and that is said on the line rather than behind a
  confirm dialog. src/categories.js's removal grammar is the precedent and it draws the line at what
  is DESTROYED: a category removal takes assignments and scores with it, so it counts them first,
  and there is no student data anywhere in a letter scale — nothing is stored per student, no grade
  is written down, and the cost of a mis-tap is retyping boundaries that are still on screen above
  the button until she taps it. A dialog for that would be the third modal in a stack that already
  has two.
*/
function renderOverride() {
  const box = document.getElementById(OVERRIDE_ID);
  if (!box) return;
  box.textContent = '';
  const doc = getDoc();
  const cls = subjectClass();

  const note = document.createElement('span');
  note.className = 'scale-override-note';

  if (!cls) {
    const own = activeClasses(doc).filter(hasOwnScale).map((c) => c.name);
    note.textContent = own.length
      ? nameList(own) + ' ' + (own.length === 1 ? 'has' : 'have') + ' its own bands, so nothing '
        + 'you change here reaches ' + (own.length === 1 ? 'it' : 'them') + '. Every other class '
        + 'uses these.'
      : 'Every class uses these bands. Tap a class above to give that one its own.';
    box.append(note);
    return;
  }

  if (hasOwnScale(cls)) {
    note.textContent = cls.name + ' has its own bands. Changing them changes nothing in any other '
      + 'class, and nothing in the scale every class uses.';
    box.append(note);
    const off = actionButton('Use the bands every class uses', 'data-scale-override-off', cls.id);
    off.setAttribute('aria-label', 'Put ' + cls.name + ' back on the bands every class uses, '
      + 'discarding its own');
    box.append(off);
    return;
  }

  note.textContent = cls.name + ' uses the bands every class uses. They are listed below as they '
    + 'apply to it, and they are edited under “Every class” — so that a change made here cannot '
    + 'reach four other classes by accident.';
  box.append(note);
  const on = actionButton('Give ' + cls.name + ' its own bands', 'data-scale-override-on', cls.id);
  box.append(on);
}

/*
  ONE ROW PER BAND: the letter, the boundary, the range it works out to, reorder, remove.

  Built with createElement rather than innerHTML for the reason src/year-picker.js gives and
  src/categories.js makes real — a letter is typed by a teacher, and a band called "A<b>" has to be
  those characters rather than markup.

  Keyed by INDEX, not by an id — see decision 3 in this file's header.
*/
function bandRow(band, index, siblings, range) {
  const row = document.createElement('div');
  row.className = 'band-row';

  const letter = document.createElement('input');
  letter.className = 'band-letter-input';
  letter.type = 'text';
  letter.value = letterOf(band);
  letter.setAttribute('data-band-field', 'letter');
  letter.setAttribute('data-band-index', String(index));
  letter.setAttribute('aria-label', 'Letter for band ' + (index + 1));
  letter.setAttribute('autocomplete', 'off');
  /* Off for the same reason the year field has it off: a letter grade is not a word, and a spell
     checker underlining "B−" is noise on a field two characters wide. */
  letter.setAttribute('spellcheck', 'false');
  row.append(letter);

  /* The number and its unit as one group, so "%" can never wrap away from the field it belongs to.
     src/categories.js's `.category-weight-field` pair, which lifted Roll Call!'s `.config-num` +
     `.config-num-wrap` (dashboard.html ~711-716): a small centred numeric field with its unit
     beside it, rather than a percent sign typed into the field, which would make the stored value
     a string somebody has to parse. */
  const wrap = document.createElement('div');
  wrap.className = 'band-min-field';

  const min = document.createElement('input');
  min.className = 'band-min';
  /* A real number input: iPadOS gives a numeric keypad for it, and the spinner is the laptop path
     for a teacher nudging a boundary. `min`/`step` are hints to the spinner and to a form validator;
     they are NOT the guard, and nothing here refuses a value it dislikes — decision 1 in the
     header. `step="any"` rather than a decimal step, because 89.5 is the whole point of this
     feature and a browser that calls it invalid against `step="1"` would be arguing with it. */
  min.type = 'number';
  min.min = '0';
  min.step = 'any';
  min.setAttribute('inputmode', 'decimal');
  min.value = boundaryText(minOf(band));
  min.setAttribute('data-band-field', 'min');
  min.setAttribute('data-band-index', String(index));
  min.setAttribute('aria-label', 'Lowest percentage that earns ' + (letterOf(band) || 'this band'));
  wrap.append(min);

  const unit = document.createElement('span');
  unit.className = 'band-min-unit';
  unit.textContent = '%';
  /* Decoration beside a field whose accessible name already says "percentage". */
  unit.setAttribute('aria-hidden', 'true');
  wrap.append(unit);
  row.append(wrap);

  row.append(rangeChip(range));

  const actions = document.createElement('div');
  actions.className = 'band-row-actions';
  /* Explicit up/down rather than drag, for the reason src/classes.js and src/categories.js both
     give: HTML5 drag-and-drop does not fire for touch on iPadOS at all, so a dragged row is a
     laptop-only affordance. The order of this array IS the order the bands are read in, which is
     what makes reordering a real repair for an out-of-order scale — it moves a band without
     changing a single boundary the teacher typed. */
  const up = actionButton('↑', 'data-band-move-up', String(index), 'move');
  up.setAttribute('aria-label', 'Move ' + (letterOf(band) || 'this band') + ' higher');
  up.disabled = index === 0;
  const down = actionButton('↓', 'data-band-move-down', String(index), 'move');
  down.setAttribute('aria-label', 'Move ' + (letterOf(band) || 'this band') + ' lower');
  down.disabled = index === siblings - 1;
  actions.append(up, down);

  /* No confirm, and no `aria-haspopup`: nothing is filed under a band. src/categories.js's Remove
     promises a dialog only on the rows that open one, for the same reason — a promise of a dialog
     that does not open is worse than no promise. */
  const remove = actionButton('Remove', 'data-band-remove', String(index), 'delete');
  remove.setAttribute('aria-label', 'Remove the ' + (letterOf(band) || 'unnamed') + ' band');
  actions.append(remove);

  row.append(actions);
  return row;
}

/* A band that applies to this class but is edited elsewhere: the letter and the range it covers, as
   text. Read-only rather than absent, because "which bands apply to Period 3" is the question a
   teacher opened a class subject to ask, and answering it with a button and no bands would send her
   to another screen to find out what she already had on screen. */
function inheritedRow(band, range) {
  const row = document.createElement('div');
  row.className = 'band-row inherited';
  const letter = document.createElement('span');
  letter.className = 'band-letter';
  letter.textContent = letterOf(band);
  row.append(letter);
  row.append(rangeChip(range));
  return row;
}

/*
  THE DERIVED RANGE, AND THE FOURTH DELIVERABLE.

  This is what makes a scale's shape visible without reading twelve numbers and doing the
  subtraction: every band says what it actually covers. The upper bound is exclusive and the chip
  says so in its title rather than in its text, because "90% up to 93%" is what fits on a row at
  390px and "up to but not including" is what it means.

  A band that can never be reached says exactly that, in the warn palette, and that is acceptance
  line 3 on the row itself rather than only in the note below the list — an A− that reads "never
  reached" beside an A at 89.5 is the defect visible on sight.
*/
function rangeChip(range) {
  const chip = document.createElement('span');
  chip.className = 'band-range';
  if (!range || range.from === null) {
    chip.className += ' warn';
    chip.textContent = 'no boundary';
    chip.title = 'This band has no percentage on it, so nothing can ever land in it. Type the '
      + 'lowest percentage that should earn it.';
    return chip;
  }
  if (!range.reachable) {
    chip.className += ' warn';
    chip.textContent = 'never reached';
    chip.title = 'A band above this one starts at ' + boundaryText(range.to) + '% or lower, and a '
      + 'percentage takes the first band it meets reading down — so every percentage this band '
      + 'would have taken is caught above it. Move it higher, or change a boundary.';
    return chip;
  }
  if (range.to === null) {
    chip.textContent = boundaryText(range.from) + '% and up';
    chip.title = 'Every percentage of ' + boundaryText(range.from) + '% or more, with no ceiling — '
      + 'extra credit can carry a grade past 100%.';
    return chip;
  }
  chip.textContent = boundaryText(range.from) + '% up to ' + boundaryText(range.to) + '%';
  chip.title = 'From ' + boundaryText(range.from) + '% up to but not including '
    + boundaryText(range.to) + '%, which belongs to the band above.';
  return chip;
}

/*
  THE STANDING NOTE, drawn in both states.

  It is a plain line in the panel rather than an error that appears and clears, exactly as
  src/categories.js's total banner is, and for the same two reasons: a scale that is wrong stays
  wrong until it is fixed, and a line that appears only when something is broken makes its own
  absence the message. It NAMES WHAT IS WRONG AND WHICH BAND — "A− can never be reached", not
  "invalid" — because the letter is the thing she can act on.

  NOT AN ARIA-LIVE REGION. There is exactly one in this app (src/live-region.js), and a second one
  updating on every keystroke would read a half-typed boundary out loud. The CROSSING is announced
  instead — clean to faulty, or back — which is the moment a screen-reader user cannot see.
*/
function renderNote() {
  const el = document.getElementById(NOTE_ID);
  if (!el) return;
  const scale = shownScale();
  const bands = bandsIn(scale);
  const faults = scaleFaults(scale);
  const clean = faults.bands > 0 && !faults.unreachable.length && faults.gapBelow === null;

  el.classList.toggle('warn', !clean);
  if (!faults.bands) {
    el.textContent = '⚠ There are no bands here, so no percentage has a letter at all. Add the '
      + 'ones you actually write on a report card.';
  } else if (!faults.reachable) {
    el.textContent = '⚠ Not one of these ' + plural(faults.bands, 'band', 'bands') + ' can be '
      + 'reached, so no percentage has a letter. Every boundary has to be lower than the ones '
      + 'above it, because a percentage takes the first band it meets reading down.';
  } else if (clean) {
    /* Band 0 is the top one whenever the scale is clean — nothing above it, nothing skipped — so
       the sentence reads the ends of the list rather than re-deriving them. */
    const bottom = bands.length - 1;
    el.textContent = 'In order, top to bottom, with no gap: every percentage has exactly one '
      + 'letter. ' + (letterOf(bands[0]) || 'The top band') + ' at '
      + boundaryText(minOf(bands[0])) + '% and up, down to '
      + (letterOf(bands[bottom]) || 'the last band') + ' at '
      + boundaryText(minOf(bands[bottom])) + '%.';
  } else {
    const said = [];
    if (faults.unreachable.length) {
      const names = faults.unreachable.map((i) => letterOf(bands[i]) || 'the band at position '
        + (i + 1));
      said.push('⚠ ' + nameList(names) + ' can never be reached: a band above '
        + (names.length === 1 ? 'it' : 'them') + ' starts at the same percentage or lower, and a '
        + 'percentage takes the first band it meets reading down. Move '
        + (names.length === 1 ? 'it' : 'them') + ' higher, or change a boundary.');
    }
    if (faults.gapBelow !== null) {
      said.push((said.length ? 'And nothing' : '⚠ Nothing') + ' below '
        + boundaryText(faults.gapBelow) + '% has a letter at all, because the lowest band starts '
        + 'there. Set it to 0 if every percentage should earn one.');
    }
    said.push('Nothing is blocked: keep going.');
    el.textContent = said.join(' ');
  }

  if (lastClean !== null && lastClean !== clean) {
    announce(clean
      ? 'The scale is in order: every percentage has exactly one letter.'
      : 'This scale has a band nothing can reach, or a gap at the bottom. Nothing is blocked.');
  }
  lastClean = clean;
}

/*
  THE RANGES, REDRAWN WITHOUT REBUILDING THE ROWS.

  Typing a boundary changes the range of that band AND of the one below it, so the chips have to
  follow per keystroke — but the ROW MUST NOT BE RE-RENDERED, because replacing the input the
  teacher is typing into takes the caret with it. That is the rule src/classes.js's editTermField()
  states and src/categories.js repeats, and here it is the reason the chip is patched in place
  rather than the list being redrawn. It is also the closest this work order gets to showing the
  mapping at work: the derived range moves as the boundary is typed.
*/
function renderRanges() {
  const box = document.getElementById(BAND_LIST_ID);
  if (!box) return;
  const ranges = bandRanges(shownScale());
  const rows = box.querySelectorAll('.band-row');
  for (let i = 0; i < rows.length; i++) {
    const old = rows[i].querySelector('.band-range');
    if (old && ranges[i]) old.replaceWith(rangeChip(ranges[i]));
  }
}

function renderBandList() {
  const box = document.getElementById(BAND_LIST_ID);
  const addRow = document.getElementById(ADD_ROW_ID);
  if (addRow) addRow.classList.toggle('hidden', !editable());
  if (!box) return;
  box.textContent = '';

  const scale = shownScale();
  const bands = bandsIn(scale);
  const ranges = bandRanges(scale);
  if (!bands.length) {
    const empty = document.createElement('div');
    empty.className = 'class-empty';
    empty.textContent = editable()
      ? 'No bands here yet. Add the letters you actually write on a report card, highest first.'
      : 'The scale every class uses has no bands in it, so this class has none either.';
    box.append(empty);
    return;
  }
  /* Rendered in the order the document holds them and never sorted — not by boundary, not by
     letter. The order is the rule (see letterFor), so sorting it here would hide the one defect
     this editor exists to show. */
  const canEdit = editable();
  bands.forEach((band, i) => box.append(canEdit
    ? bandRow(band, i, bands.length, ranges[i])
    : inheritedRow(band, ranges[i])));
}

function renderScale() {
  renderSubjects();
  renderOverride();
  renderBandList();
  renderNote();
}

export function openLetterScaleEditor(opener) {
  /* Always opened on the document-wide scale, because the door is a document-level control in the
     class manager: a panel that remembered the class it was last on would open showing one class's
     bands to a teacher who tapped a button about all of them. */
  subjectClassId = '';
  /* Null rather than false, so the first render is not reported as a crossing — see renderNote(). A
     scale that opens already faulty should show the note, not announce it. */
  lastClean = null;
  renderScale();
  /* Opened through its own hook rather than data-modal-open, for the reason src/classes.js gives:
     the panel is filled from the document, and a modal that opens and then fills in flickers. */
  openModal(SCALE_MODAL_ID, opener);
}

/* The subject row. `''` is the document-wide scale. */
export function selectScaleSubject(classId) {
  const id = classId || '';
  if (id && !findClass(id)) return;
  subjectClassId = id;
  /* A different scale is a different question, so the crossing counter starts again rather than
     announcing that the scale "became" faulty by being looked at. */
  lastClean = null;
  renderScale();
  const cls = subjectClass();
  announce(cls
    ? (hasOwnScale(cls) ? 'Showing ' + cls.name + '’s own bands.'
      : 'Showing the bands ' + cls.name + ' uses, which every class uses.')
    : 'Showing the bands every class uses.');
}

/* ────────────────────────────── writing ────────────────────────────── */

/*
  A letter or a boundary being typed. Called from src/shell.js's `input` listener, so it fires per
  keystroke and the store's debounce is what turns that into one save (src/store.js).

  THE ROW IS NOT RE-RENDERED — see renderRanges() — but the ranges and the note are, on every
  keystroke, because a range that lags the boundary it is derived from is worse than no range.
*/
export function editBandField(input) {
  if (!editable()) return;
  const bands = bandsForWriting();
  const index = Number(input.getAttribute('data-band-index'));
  const field = input.getAttribute('data-band-field');
  if (!Array.isArray(bands) || !Number.isInteger(index)) return;
  const band = bands[index];
  if (!band) return;

  if (field === 'letter') {
    update(() => { band.letter = input.value; });
  } else if (field === 'min') {
    /* An empty field reads as 0 — Number('') is 0 — which is what a teacher who has cleared a box
       to retype it means for the second she is between numbers, and it keeps the ranges honest
       while she does it. A field mid-way through a number ("1e") reports '' too, so there is no
       state in which this stores NaN. It may well make the scale faulty for that second; the note
       says so and nothing is blocked. */
    const n = Number(input.value);
    if (!Number.isFinite(n)) return;
    update(() => { band.min = n; });
  } else {
    return;
  }
  renderRanges();
  renderNote();
}

/*
  A new band, at 0.

  0 RATHER THAN AN INTERPOLATED GUESS, and the reason is stronger here than the one
  src/categories.js gives for a new category at 0%. A boundary is not a share of anything — adding
  a band cannot silently reweight the others — but the boundary IS the grading rule this whole
  feature exists to take out of the app's hands. Halfway between the two bands around it would be
  Planbook deciding what a B+ is, which is exactly what "the app never hardcodes 90/80/70" forbids.
  So it arrives at the bottom, at 0, with the note going amber at once to say the scale is out of
  order — which is the prompt to type the real number.
*/
export function addBand() {
  if (!editable()) return;
  const bands = bandsForWriting();
  if (!Array.isArray(bands)) return;
  update(() => { bands.push({ letter: 'New', min: 0 }); });
  renderScale();
  announce('Added a band at 0 percent. Give it a letter and its lowest percentage.');
  /* Focus and select the new letter, because "New" is a placeholder to type over rather than a
     letter. After the render, for the reason src/classes.js's renderClassList() gives: an input that
     is not yet in the document cannot take focus, and on iPadOS a focus() that misses is a software
     keyboard that never appears. */
  const box = document.getElementById(BAND_LIST_ID);
  const field = box && box.querySelector('.band-row:last-child .band-letter-input');
  if (field) { field.focus(); field.select(); }
}

/*
  Removing a band, on the tap.

  NO CONFIRM, and that is the src/categories.js removal grammar applied rather than ignored: that
  dialog exists because a category takes assignments and their scores with it, and counting what a
  tap destroys is what earns the right to destroy it. Nothing is filed under a band — no student
  record, no score, no assignment references a letter — so there is nothing to count and nothing to
  orphan. What goes is one letter and one number, both of them retypeable, and the removal is said
  out loud so it is not a silent change.
*/
export function removeBand(indexAttr) {
  if (!editable()) return;
  const bands = bandsForWriting();
  const index = Number(indexAttr);
  if (!Array.isArray(bands) || !Number.isInteger(index) || !bands[index]) return;
  const said = letterOf(bands[index]) || 'the unnamed band';
  update(() => { bands.splice(index, 1); });
  renderScale();
  announce('Removed ' + said + '. ' + plural(bands.length, 'band', 'bands') + ' left.');
}

/* Reorder. Swaps with the neighbour, exactly as src/classes.js's moveClass() and
   src/categories.js's moveCategory() do, and says the new position out loud — reordering a list is
   a change a screen-reader user cannot see happen and cannot infer from focus staying put. This is
   the repair for an out-of-order scale that changes no boundary at all. */
function moveBand(indexAttr, delta) {
  if (!editable()) return;
  const bands = bandsForWriting();
  const at = Number(indexAttr);
  if (!Array.isArray(bands) || !Number.isInteger(at)) return;
  const band = bands[at];
  const swapWith = bands[at + delta];
  if (!band || !swapWith) return;
  update(() => { bands[at] = swapWith; bands[at + delta] = band; });
  renderScale();
  announce((letterOf(band) || 'That band') + ' is now ' + (at + delta + 1) + ' of ' + bands.length
    + '.');
}

export function moveBandUp(index) { moveBand(index, -1); }
export function moveBandDown(index) { moveBand(index, 1); }

/* Turning the override on: a COPY of the bands that already applied, with fresh objects. The
   constant in src/store.js and another class's array are both templates here and must never be
   handed out by reference — two classes sharing one band object is two classes whose boundaries
   move together, and it would look like a rendering bug for a week (src/categories.js's
   starterCategories() carries the same warning about the same mistake). */
export function enableOverride(classId) {
  const doc = getDoc();
  const cls = findClass(classId);
  if (!doc || !cls || hasOwnScale(cls)) return;
  const copy = letterScaleOf(doc).map((band) => ({ letter: letterOf(band), min: band.min }));
  update(() => { cls.letterScale = copy; });
  subjectClassId = cls.id;
  lastClean = null;
  renderScale();
  announce(cls.name + ' now has its own bands, copied from the ones every class uses. Editing them '
    + 'changes no other class.');
}

/* And off: the `null` sentinel, which is the document's own word for "use the default". */
export function disableOverride(classId) {
  const cls = findClass(classId);
  if (!cls || !hasOwnScale(cls)) return;
  update(() => { cls.letterScale = null; });
  subjectClassId = cls.id;
  lastClean = null;
  renderScale();
  announce(cls.name + ' is back on the bands every class uses. Its own bands are gone.');
}
