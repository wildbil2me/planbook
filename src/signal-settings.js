/*
  The threshold editor — #signalsModal, and the only place a signal threshold is typed.

  WHY IT IS NOT IN src/signals.js. That module is the engine: WO-4.2's and WO-4.3's rules import it,
  and so will WO-5.1's `{{signals.list}}` resolver, none of which want a modal. This is the same
  split src/attendance.js and src/attendance-report.js have — the thing that owns the answers, and a
  surface over it — and the import runs ONE WAY: this file reads `SIGNAL_SETTINGS`, the defaults and
  the resolver out of src/signals.js, and src/signals.js imports nothing back. A module that reached
  back would close the sixth import loop this repo has refused (src/shell.js's header,
  src/classes.js's, src/views.js's, src/categories.js's).

  THE TABLE OF THRESHOLDS IS OVER THERE AND NOT HERE, including the words this panel prints. Twenty-
  two keys named in two places is twenty-two chances for the panel and the engine to disagree about
  what a setting is called, which is how a field comes to write a key nothing reads —
  `tools/wo-sweep.mjs` § 4 exists because WO-1.4 shipped exactly that against `localStorage`. So
  SIGNAL_SETTINGS carries the key, the default, the label, the unit and the accessible name
  together, and this file renders it.

  WHERE THE DOOR IS. In the class manager, under Letter grades, because that panel is where the
  YEAR is set up and these are year-wide settings that travel with the document. It is the same
  answer WO-3.2 gave for the letter scale and for the same two reasons: `plans/gradebook-surfaces.md`
  refuses to re-cut the class row, and index.html measures the header strip at 390px and records
  that a fourth control there overflows. src/teacher.js is not the host for the reason it is not the
  letter scale's: this is a setting about the gradebook, not about the teacher.

  WHAT THIS PANEL DOES NOT HAVE, and both absences are deliberate:

    NO SAVE BUTTON. Every field writes as it is typed and the store debounces the burst into one
    save, which is the standing contract everywhere a teacher types in this app.

    NO WARNING STATE. The categories panel and the letter-scale panel both carry a standing line
    that goes amber, because a set of weights and a set of bands can be WRONG in a way that has a
    consequence. A threshold cannot: a teacher who wants to hear about a grade below 70 has not
    made a mistake. The standing line here counts what she has changed and says what the reset
    would do, and it is quiet in both states.
*/

import { getDoc, update } from './store.js';
import { openModal } from './modal.js';
import { announce } from './live-region.js';
import { SIGNAL_SETTINGS, THRESHOLD_KEYS, defaultThreshold, thresholdOf, changedThresholds }
  from './signals.js';
import { formatWeight } from './categories.js';

const SIGNALS_MODAL_ID = 'signalsModal';
const SIGNAL_LIST_ID = 'signalList';
const SIGNAL_NOTE_ID = 'signalNote';

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

/* ────────────────────────────── the panel ────────────────────────────── */

/*
  THE STANDING LINE. It says how many thresholds the document does not agree with the shipped
  defaults about, because that is the only fact about this panel a teacher cannot see at a glance —
  twenty-two numbers do not tell you which two you moved in September. It also says what the reset
  below it does, where she is standing when she wonders.

  A plain line rather than an aria-live region, for the reason src/categories.js's total is one:
  there is exactly one live region in this app (src/live-region.js), and a second one updating per
  keystroke would read a half-typed number aloud.
*/
function renderNote() {
  const el = document.getElementById(SIGNAL_NOTE_ID);
  if (!el) return;
  const changed = changedThresholds(getDoc());
  el.textContent = changed.length
    ? plural(changed.length, 'threshold', 'thresholds') + ' of ' + THRESHOLD_KEYS.length
      + ' differ from what Planbook ships with. Putting them back sets every one of the '
      + THRESHOLD_KEYS.length + ' to its own default — it does not clear the ones you typed one at '
      + 'a time.'
    : 'All ' + THRESHOLD_KEYS.length + ' thresholds are at the values Planbook ships with. Type '
      + 'over any of them: they are yours, they are stored with this year rather than on this '
      + 'device, and they travel to your other devices with it.';
}

/*
  ONE FIELD. Roll Call!'s `.config-num` + `.config-num-wrap` pair (its src/dashboard.html ~711-716),
  lifted with its measurements the way src/categories.js's weight field and src/letter-scale.js's
  boundary field were: a small centred numeric field with its unit beside it in the secondary grey,
  the two as one flex item so the unit can never wrap away from the number it belongs to. The unit is
  a sibling and not a character inside the box, because "%" typed into the field would make the
  stored value a string somebody has to parse.
*/
function thresholdField(doc, field) {
  const wrap = document.createElement('span');
  wrap.className = 'signal-field';

  if (field.before) {
    const before = document.createElement('span');
    before.className = 'signal-before';
    before.textContent = field.before;
    /* Read as part of the input's own accessible name, which the `aria` string in
       SIGNAL_SETTINGS already spells out in full, so a screen reader is not handed the connective
       twice. */
    before.setAttribute('aria-hidden', 'true');
    wrap.append(before);
  }

  const input = document.createElement('input');
  input.className = 'signal-num';
  /* A real number input: iPadOS gives a numeric keypad for it, and the spinner is the laptop path
     for a teacher nudging a threshold. `min` is a hint to the spinner and NOT the guard — nothing
     here refuses a value it dislikes, for the reason src/categories.js states about a weight: a
     value that silently isn't what was typed is worse than one that is visibly odd. `step="any"`
     because a threshold can be 89.5 as legitimately as a letter boundary can. */
  input.type = 'number';
  input.min = '0';
  input.step = 'any';
  input.setAttribute('inputmode', 'decimal');
  input.value = formatWeight(thresholdOf(doc, field.key));
  input.setAttribute('data-signal-threshold', field.key);
  input.setAttribute('aria-label', field.aria);
  input.setAttribute('autocomplete', 'off');
  wrap.append(input);

  const unit = document.createElement('span');
  unit.className = 'signal-unit';
  unit.textContent = field.unit;
  /* Decoration beside a field whose accessible name already says what the number is in. */
  unit.setAttribute('aria-hidden', 'true');
  wrap.append(unit);

  return wrap;
}

/*
  ONE ROW PER RULE, which is one line of the table in docs/data-model.md § Signal thresholds. A rule
  with two numbers in it is one row with two fields, because "fell 10 points across the last 4
  assignments" is one decision a teacher makes in one go and two rows would make it read as two.

  Built with createElement rather than innerHTML, for the reason every other list in this app is:
  nothing here is teacher-typed today, and the day something is, this is already the safe shape.
*/
function ruleRow(doc, rule) {
  const row = document.createElement('div');
  row.className = 'signal-row';

  const text = document.createElement('div');
  text.className = 'signal-rule';
  text.textContent = rule.text;
  row.append(text);

  const fields = document.createElement('div');
  fields.className = 'signal-fields';
  rule.fields.forEach((field) => fields.append(thresholdField(doc, field)));
  row.append(fields);
  return row;
}

function renderList() {
  const box = document.getElementById(SIGNAL_LIST_ID);
  if (!box) return;
  box.textContent = '';
  const doc = getDoc();

  SIGNAL_SETTINGS.forEach((group) => {
    const label = document.createElement('div');
    label.className = 'modal-section-label';
    label.textContent = group.label;
    box.append(label);
    /* Rendered in the order docs/data-model.md tabulates them and never sorted — the two tables and
       this panel are read side by side while the thresholds are being tuned. */
    group.rules.forEach((rule) => box.append(ruleRow(doc, rule)));
  });
}

function renderSignalSettings() {
  renderList();
  renderNote();
}

export function openSignalSettings(opener) {
  renderSignalSettings();
  /* Opened through its own hook rather than data-modal-open, for the reason src/classes.js gives:
     the panel is filled from the document, and a modal that opens and then fills in flickers. */
  openModal(SIGNALS_MODAL_ID, opener);
}

/* ────────────────────────────── writing ────────────────────────────── */

/*
  A THRESHOLD BEING TYPED. Called from src/shell.js's `input` listener, so it fires per keystroke and
  the store's debounce is what turns that into one save (src/store.js).

  THE ROW IS NOT RE-RENDERED — replacing the input the teacher is typing into would take the caret
  with it, which is the rule src/classes.js's editTermField() states and src/categories.js and
  src/letter-scale.js both repeat. Only the standing line is redrawn, because it counts the very
  thing that is being typed.

  An empty field reads as 0, exactly as a weight and a band boundary do: `Number('')` is 0, which is
  what a teacher who has cleared a box to retype it means for the second she is between numbers, and
  a field mid-way through a number ("1e") reports '' too, so there is no state in which this stores
  NaN. A 0 threshold is a threshold — "grade below 0%" fires for nobody — and nothing is blocked
  while she types the real one.
*/
export function editThreshold(input) {
  const key = input.getAttribute('data-signal-threshold');
  if (!key || THRESHOLD_KEYS.indexOf(key) < 0) return;
  if (defaultThreshold(key) === undefined) return;
  const n = Number(input.value);
  if (!Number.isFinite(n)) return;
  update((d) => {
    /* Created empty if a document arrived without it — a restore from another build, a hand edit.
       src/letter-scale.js's bandsForWriting() does the same for `letterScale`. */
    if (!d.signals || typeof d.signals !== 'object' || Array.isArray(d.signals)) d.signals = {};
    d.signals[key] = n;
  });
  renderNote();
}

/*
  THE RESET, AND IT DELETES RATHER THAN WRITING THE DEFAULTS IN.

  That is not a shortcut. src/store.js seeds `signals: {}` and its comment settles why: the evaluator
  reads a missing key as its default, because every document written before a threshold existed is
  missing it. So an absent key IS the default, and it is the only way of holding one that keeps
  following the shipped number if that number is ever re-tuned. A document that stored `65` would
  sit on 65 forever while the tables in docs/data-model.md moved underneath it, and a teacher who
  had never touched the panel would be pinned to a decision she never made — the same argument
  src/letter-scale.js makes for writing `null` rather than a copy of the bands when a per-class
  override is turned off.

  It removes only the keys THIS BUILD NAMES. Anything else in the block is left exactly where it is:
  a key this build does not know about cannot be one of its defaults, so deleting it would be
  throwing away somebody else's setting to tidy up.
*/
export function resetThresholds() {
  const before = changedThresholds(getDoc()).length;
  update((d) => {
    if (!d.signals || typeof d.signals !== 'object' || Array.isArray(d.signals)) { d.signals = {}; return; }
    THRESHOLD_KEYS.forEach((key) => { delete d.signals[key]; });
  });
  /* The whole list, not just the note: every field on screen is showing a number that may have just
     changed underneath it. The caret rule above does not apply — this is a button, so nobody is
     typing into a field at the moment it is pressed. */
  renderSignalSettings();
  announce(before
    ? 'Put ' + plural(before, 'threshold', 'thresholds') + ' back to the value Planbook ships with.'
    : 'Every threshold was already at the value Planbook ships with. Nothing changed.');
}
