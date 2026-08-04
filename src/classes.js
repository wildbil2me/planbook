/*
  Classes and terms — the tab bar at the top of the app, the manager behind it, and the term
  nav that every later screen asks "which term am I in?".

  WHY THE TWO LIVE IN ONE FILE. src/README.md says one concern per file, named for the thing it
  owns, and terms look like a second thing. They are not separable here: a term belongs to a
  class, so "which term is selected" is only answerable after "which class is selected", and the
  resolution of both — the pref names a class that was archived, or a term that was removed, so
  fall back to the first one that exists — has to happen in exactly one place or the tab bar and
  the term nav can disagree about what is open. Splitting them either duplicates that resolution
  or closes an import loop between the two modules, and shell.js:82-89 already records this repo
  refusing to close one. If terms grow their own screen, split then and keep the resolution here.

  SHAPED LIKE src/year-picker.js, which is the shape src/backup.js follows too: a shell feature
  in its own file, driven by the data-* hooks shell.js routes to it, rendering rows with
  createElement rather than innerHTML, and reporting its refusals into its own dialog rather than
  onto the save chip. The chip means "did a save land"; "type a name for this class" is not a save.

  THE READ POINT. getSelectedClass() and getSelectedTerm() below are what WO-2.x and WO-3.x
  import to find out which class and which term the teacher is looking at. Nothing else in the
  app should reach for the preference keys behind them.

  THREE THINGS THAT WILL LOOK LIKE OMISSIONS AND ARE DECISIONS:

  1. TERM IDS ARE OPAQUE. Every term id comes out of newId('tm'). docs/data-model.md line 54
     sketches `"terms": [{ "id": "Q1", … }]` and that is illustrative shorthand in a schema
     sketch — the work order's Traps line overrides it. Nothing here compares a term id against a
     literal, switches on one, or parses meaning out of one, and the string "Q1" appears nowhere
     in this file. Seed labels are whole words ("Quarter 1"), which are what a teacher edits.
     `t_` was already taken by template (src/store.js), hence `tm_`.

  2. TERM DATES ARE NOT A SCHEDULE. plans/rotating-schedule.md records a cycle model that was
     designed and deleted the same day, because the owner's rotation also changes at random and a
     second source of truth about which class meets when is worse than none. Term dates here are
     labels on a range and nothing else: they are never sorted, never repaired, never checked for
     gaps or overlaps, never used to decide which term is current, and an empty date is valid — a
     teacher who has not looked up the school calendar yet still needs the term to exist. The
     amount of validation in this file is deliberately close to none.

  3. ARCHIVE AND DELETE ARE DIFFERENT OPERATIONS. Archive keeps every attendance record,
     assignment and score and takes the class off the tab bar. Delete destroys them. So delete is
     offered only on an archived row: getting a class out of the way is one tap that costs
     nothing, and destroying a term of attendance is two taps and a dialog that counts what goes.
*/

import { getDoc, update, newId } from './store.js';
import { openModal, closeModal } from './modal.js';
import { announce } from './live-region.js';
import { getPref, setPref } from './prefs.js';

const CLASS_MODAL_ID = 'classesModal';
const TERM_MODAL_ID = 'termsModal';
const DELETE_MODAL_ID = 'classDeleteModal';

const TAB_BAR_ID = 'classTabBar';
const TERM_NAV_ID = 'termNav';
const DIVIDER_ID = 'headerDivider';
const RIGHT_ID = 'headerRightControls';

const CLASS_LIST_ID = 'classList';
const ARCHIVED_SECTION_ID = 'classArchivedSection';
const ARCHIVED_LIST_ID = 'classArchivedList';
const NEW_INPUT_ID = 'classNewInput';
const CLASS_ERROR_ID = 'classError';

const TERM_LIST_ID = 'termList';
const TERM_CLASS_NAME_ID = 'termsClassName';
const TERM_ERROR_ID = 'termError';

const DELETE_LEAD_ID = 'classDeleteLead';
const DELETE_FACTS_ID = 'classDeleteFacts';
const DELETE_BTN_ID = 'classDeleteBtn';

/*
  The term structures a teacher can start from, and the only place in this app where a term label
  is written by a programmer. They are seed DATA: applying one writes four ordinary terms with
  ordinary ids, and every label, date and count is editable afterwards. Nothing anywhere reads
  these keys back off a document — a class does not remember that it was made from `quarters`,
  because the moment the teacher renames one term that fact would be a lie.

  Whole words rather than "Q1": the label is what a teacher reads in the header, and it is also
  the thing she is most likely to want to change. A four-character label looks like a code that
  belongs to the app.

  The keys are the `data-preset` and `data-term-preset` values in index.html, which is the one
  coupling here worth knowing about — a key renamed on one side is a preset that silently falls back
  to the default on the other.
*/
export const TERM_PRESETS = {
  quarters: { label: 'Quarters', terms: ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'] },
  semesters: { label: 'Semesters', terms: ['Semester 1', 'Semester 2'] },
  trimesters: { label: 'Trimesters', terms: ['Trimester 1', 'Trimester 2', 'Trimester 3'] },
  fullYear: { label: 'One term', terms: ['Full year'] },
};

/* What a brand-new class gets when the teacher does not choose otherwise. Four quarters is the
   commonest shape in US secondary schools and it is one tap to replace — the requirement is that
   a class arrives usable, not that this guess is right for everybody. */
const DEFAULT_PRESET = 'quarters';

/* Which class row is being renamed in place, and which class the term editor is open for. Both
   are ids rather than objects: the document can be replaced underneath this module by a restore
   or a year switch, and an object held across that is a reference to a class that is no longer in
   any document. */
let renamingId = '';
let termClassId = '';
let pendingDeleteId = '';

/* ────────────────────────────── reading the document ────────────────────────────── */

function classesIn(doc) { return doc && Array.isArray(doc.classes) ? doc.classes : []; }

/* Every read of `terms` goes through here. A class object can legitimately arrive without the
   key — from a restored backup written by another build, or from a migration step that has not
   been written yet — and a screen that has to check before it iterates is a screen that will
   eventually forget to (src/store.js:102-104). */
function termsOf(cls) { return cls && Array.isArray(cls.terms) ? cls.terms : []; }

/* `archived` is absent on a class this build did not create, and absent means active. */
function isArchived(cls) { return !!(cls && cls.archived); }

function activeClasses(doc) { return classesIn(doc).filter((c) => !isArchived(c)); }
function archivedClasses(doc) { return classesIn(doc).filter(isArchived); }

function findClass(id) {
  return classesIn(getDoc()).filter((c) => c.id === id)[0] || null;
}

/* Part of the read surface below rather than a helper: a later screen asking "what terms does this
   class have?" must not reach into doc.classes itself, or the tolerance for a class with no `terms`
   key has to be written again in every screen that asks. */
export function getTerms(classId) { return termsOf(findClass(classId)); }

/*
  THE READ POINT — the two accessors every later screen imports.

  Which class and which term the teacher is looking at is a fact about this browser, not about a
  student: the iPad can sit on Period 1 while the laptop sits on Period 5 without either being
  wrong, exactly as they can sit on different years (src/prefs.js). So the answer is a `planbook_`
  preference holding an id, resolved against the open document on every read.

  Resolved, and never trusted: the preference can name a class that has since been archived or
  deleted, or a term that was removed, and in both cases the answer is the first one that exists
  rather than nothing. A header that goes blank because a stored id went stale reads as the app
  losing the class.
*/
export function getSelectedClassId() {
  const list = activeClasses(getDoc());
  if (!list.length) return '';
  const want = getPref('openClassId');
  return list.some((c) => c.id === want) ? want : list[0].id;
}

export function getSelectedClass() {
  const id = getSelectedClassId();
  return id ? findClass(id) : null;
}

export function getSelectedTermId() {
  const cls = getSelectedClass();
  if (!cls) return '';
  const terms = termsOf(cls);
  if (!terms.length) return '';
  const map = getPref('openTermIds') || {};
  const want = map[cls.id];
  return terms.some((t) => t.id === want) ? want : terms[0].id;
}

export function getSelectedTerm() {
  const cls = getSelectedClass();
  const id = getSelectedTermId();
  if (!cls || !id) return null;
  return termsOf(cls).filter((t) => t.id === id)[0] || null;
}

/* ────────────────────────────── writing ────────────────────────────── */

/*
  A new class, carrying the whole shape docs/data-model.md settles, with every collection present
  and empty rather than absent — the reason is at src/store.js:102-104. `categories` stays empty
  on purpose: weights are WO-3.1 and out of scope here, and a category seeded now would be a
  weight nobody chose sitting in the grade math the moment WO-3.1 lands.

  `archived: false` is the one field not in that document's sketch. The work order asks for
  archiving, archiving has to survive a save, and a boolean on the class is the whole of it.
*/
function newClass(name, presetKey) {
  return {
    id: newId('c'),
    name: name,
    archived: false,
    terms: presetTerms(presetKey),
    categories: [],
    letterScale: null,
    roster: [],
  };
}

function presetTerms(presetKey) {
  const preset = TERM_PRESETS[presetKey] || TERM_PRESETS[DEFAULT_PRESET];
  return preset.terms.map((label) => newTerm(label));
}

/* Dates start empty and that is a valid term. See the header comment: a teacher setting up in
   August has not been given the calendar yet, and a term she cannot create until she has it is a
   term she creates wrong. */
function newTerm(label) {
  return { id: newId('tm'), label: label, start: '', end: '' };
}

/* ────────────────────────────── the header ────────────────────────────── */

/*
  The class tab row and the term nav, redrawn from the open document. Called at boot, after every
  change made in this module, and — chained from shell.js rather than from a store subscription —
  after a year switch and after a restore, both of which replace the document wholesale.

  Not subscribed to the store: a subscriber fires on every save, and redrawing the header while a
  teacher is typing into the manager would take focus out of whatever she was typing into. The
  four moments the answer can change are all known.
*/
export function refreshClassBar() {
  const bar = document.getElementById(TAB_BAR_ID);
  const nav = document.getElementById(TERM_NAV_ID);
  const divider = document.getElementById(DIVIDER_ID);
  const right = document.getElementById(RIGHT_ID);
  if (!bar) return;

  const doc = getDoc();
  const list = activeClasses(doc);
  const selectedId = getSelectedClassId();

  bar.textContent = '';
  if (!list.length) {
    /* A blank navy strip reads as a bug; "No classes yet." is the truth, and the button beside it
       is the first thing a teacher on a fresh install has to be able to find. */
    const empty = document.createElement('span');
    empty.className = 'hdr-empty';
    empty.textContent = doc ? 'No classes yet.' : 'No school year open.';
    bar.append(empty);
    if (doc) bar.append(addClassTab('Add a class'));
  } else {
    list.forEach((cls) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'cls-tab' + (cls.id === selectedId ? ' active' : '');
      tab.setAttribute('data-class-tab', cls.id);
      if (cls.id === selectedId) tab.setAttribute('aria-current', 'true');
      /* textContent, not innerHTML, and this is the file where that stops being hypothetical:
         the string below is typed by a teacher and pasted from a school system, and a class
         called "Bio <3" has to be a class called "Bio <3" rather than markup. */
      tab.textContent = cls.name;
      /* The tab is capped at 40vw and ellipsised (src/shell.css), so a long name can be cut on
         screen. `title` is where the whole one stays reachable; the class manager is the other
         place it is always shown in full. */
      tab.title = cls.name;
      bar.append(tab);
    });
    bar.append(addClassTab('+'));
  }

  /* The right-hand half only exists when there is a class to be in a term of. An empty divider
     and an empty nav on a fresh install are two pieces of furniture explaining nothing. */
  const showTerms = list.length > 0;
  if (divider) divider.classList.toggle('hidden', !showTerms);
  if (right) right.classList.toggle('hidden', !doc);

  if (!nav) return;
  nav.textContent = '';
  if (!showTerms) return;

  const cls = getSelectedClass();
  const terms = termsOf(cls);
  const selectedTermId = getSelectedTermId();

  if (!terms.length) {
    /* A class with no terms is reachable — a restored document from another build, or a teacher
       who removed the last one — and the nav is the shortest path back to fixing it. */
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'q-btn';
    add.setAttribute('data-term-manage', '');
    add.textContent = 'Add terms';
    nav.append(add);
    return;
  }

  terms.forEach((term) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'q-btn' + (term.id === selectedTermId ? ' active' : '');
    btn.setAttribute('data-term-select', term.id);
    if (term.id === selectedTermId) btn.setAttribute('aria-current', 'true');
    btn.textContent = term.label || 'Untitled term';
    btn.title = btn.textContent;
    nav.append(btn);
  });

  keepInView(bar, bar.querySelector('.cls-tab.active'));
  keepInView(nav, nav.querySelector('.q-btn.active'));
}

/*
  Scroll the selected tab back into its own strip, which became necessary the moment those strips
  started scrolling instead of squeezing (shell.css, `.cls-tab`). Rebuilding a scroller's children
  resets its `scrollLeft` to 0, and this function rebuilds both strips on every call — so with six
  classes at full width on a 390px screen, a teacher whose open class is the fifth one gets a header
  scrolled to the left with nothing on it looking selected. Both halves of that read as "Planbook
  forgot which class I was in", and only one of them is even about scrolling.

  The strip's own `scrollLeft` and nothing else: `scrollIntoView` would be shorter and would also be
  allowed to scroll every ancestor, which on a header inside a page is how the whole document ends
  up nudged sideways to reveal a tab.
*/
function keepInView(strip, el) {
  if (!strip || !el) return;
  const s = strip.getBoundingClientRect();
  const e = el.getBoundingClientRect();
  /* A hidden or not-yet-laid-out strip measures zero, and the arithmetic below would be noise. */
  if (!s.width) return;
  if (e.left < s.left) strip.scrollLeft -= (s.left - e.left) + 8;
  else if (e.right > s.right) strip.scrollLeft += (e.right - s.right) + 8;
}

function addClassTab(label) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cls-tab cls-tab-add';
  btn.setAttribute('data-class-manage', '');
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.setAttribute('title', 'Manage classes and terms');
  if (label === '+') btn.setAttribute('aria-label', 'Add a class');
  btn.textContent = label;
  return btn;
}

/* Said out loud, because selecting a class or a term changes two words in the header and nothing
   else — there is no reason for a screen-reader user to be reading the header at that moment. */
export function selectClass(id) {
  if (!findClass(id)) return;
  setPref('openClassId', id);
  refreshClassBar();
  const cls = findClass(id);
  const term = getSelectedTerm();
  announce(cls.name + (term ? ', ' + (term.label || 'untitled term') : '') + ' is open.');
}

export function selectTerm(termId) {
  const cls = getSelectedClass();
  if (!cls || !termsOf(cls).some((t) => t.id === termId)) return;
  /* Per class, keyed by class id — the same shape and the same reason as PREF_DEFAULTS.
     lastBackupAt. Term ids are unique to their class, so one id for the whole browser would be
     wrong for every class except the one it came from, and switching class would silently answer
     "which term" with a term that class does not have. */
  const map = Object.assign({}, getPref('openTermIds') || {});
  map[cls.id] = termId;
  setPref('openTermIds', map);
  refreshClassBar();
  const term = termsOf(cls).filter((t) => t.id === termId)[0];
  announce((term.label || 'Untitled term') + ' is open in ' + cls.name + '.');
}

/* ────────────────────────────── the manager ────────────────────────────── */

function showClassError(message) {
  const el = document.getElementById(CLASS_ERROR_ID);
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
  /* Also spoken: it lands in a corner of a dialog a screen-reader user has no reason to move to,
     and there is exactly one aria-live region in this app (src/live-region.js). */
  if (message) announce(message);
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

/* Initials for the row avatar. "Period 3 — Biology" reads as P3, which is what the teacher calls
   it; a single letter for every "Period n" class would make all five look alike. */
function initials(name) {
  const words = String(name || '').trim().split(/[\s—–_/-]+/).filter(Boolean);
  if (!words.length) return '?';
  const second = words.length > 1 ? words[1][0] : (words[0][1] || '');
  return (words[0][0] + second).toUpperCase();
}

/* The ten avatar colors are assigned by `id % 10` in Roll Call!, where a class id is a number.
   Planbook's ids are base36 strings (src/store.js), so the same ten are picked by summing the
   characters: stable for the life of the class, identical on every device, and stored nowhere. */
function avatarClass(id) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return 'av' + (sum % 10);
}

function actionButton(label, hook, value, extraClass) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'class-action-btn' + (extraClass ? ' ' + extraClass : '');
  btn.setAttribute(hook, value);
  btn.textContent = label;
  return btn;
}

/*
  One row per class. Built with createElement for the reason year-picker.js:58-62 gives and this
  file makes real: the name is teacher-typed and SIS-pasted text.

  The row shows the term count rather than the roster count. Rosters arrive at WO-1.7; a "0
  students" on every row today would be a number that means "not built yet".
*/
function classRow(cls, index, siblings) {
  const row = document.createElement('div');
  row.className = 'class-row' + (isArchived(cls) ? ' archived' : '');

  const avatar = document.createElement('div');
  avatar.className = 'avatar ' + avatarClass(cls.id);
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = initials(cls.name);
  row.append(avatar);

  const actions = document.createElement('div');
  actions.className = 'class-row-actions';

  if (cls.id === renamingId) {
    /* A <form> rather than a button with a keydown handler, for the reason shell.js:117-119
       gives: Enter-to-submit and the iPad's software "go" key come free with it and with nothing
       else. Escape is not bound here — modal.js owns Escape and closes the dialog with it, and
       two meanings for one key inside one panel is worse than a Cancel button. */
    const form = document.createElement('form');
    form.className = 'class-rename-form';
    form.setAttribute('data-class-rename-save', cls.id);

    const input = document.createElement('input');
    input.className = 'rename-input';
    input.type = 'text';
    input.value = cls.name;
    input.setAttribute('aria-label', 'New name for ' + cls.name);
    input.setAttribute('autocomplete', 'off');
    form.append(input);
    row.append(form);

    const save = document.createElement('button');
    save.type = 'submit';
    save.className = 'class-action-btn primary';
    save.textContent = 'Save';
    form.append(save);
    actions.append(actionButton('Cancel', 'data-class-rename-cancel', ''));
  } else {
    const name = document.createElement('span');
    name.className = 'class-row-name';
    name.textContent = cls.name;
    row.append(name);

    const note = document.createElement('span');
    note.className = 'class-row-note';
    const terms = termsOf(cls);
    note.textContent = terms.length ? plural(terms.length, 'term', 'terms') : 'No terms yet';
    row.append(note);

    if (isArchived(cls)) {
      actions.append(actionButton('Restore', 'data-class-restore', cls.id, 'restore'));
      const del = actionButton('Delete', 'data-class-delete', cls.id, 'delete');
      del.setAttribute('aria-haspopup', 'dialog');
      actions.append(del);
    } else {
      /* Explicit up/down rather than drag. HTML5 drag-and-drop does not fire for touch on
         iPadOS at all, so a dragged row is a laptop-only affordance — and the acceptance line
         says "by drag OR by explicit up/down controls". These work with a thumb, with a
         keyboard, and with a screen reader, which drag does with none of. */
      const up = actionButton('↑', 'data-class-move-up', cls.id, 'move');
      up.setAttribute('aria-label', 'Move ' + cls.name + ' earlier');
      up.disabled = index === 0;
      const down = actionButton('↓', 'data-class-move-down', cls.id, 'move');
      down.setAttribute('aria-label', 'Move ' + cls.name + ' later');
      down.disabled = index === siblings - 1;
      actions.append(up, down);

      const termsBtn = actionButton('Terms', 'data-term-manage', cls.id);
      termsBtn.setAttribute('aria-haspopup', 'dialog');
      actions.append(termsBtn);
      actions.append(actionButton('Rename', 'data-class-rename', cls.id));
      actions.append(actionButton('Archive', 'data-class-archive', cls.id, 'archive'));
    }
  }

  row.append(actions);
  return row;
}

function renderClassList() {
  const doc = getDoc();
  const list = document.getElementById(CLASS_LIST_ID);
  const archivedList = document.getElementById(ARCHIVED_LIST_ID);
  const archivedSection = document.getElementById(ARCHIVED_SECTION_ID);
  if (!list) return;

  const active = activeClasses(doc);
  list.textContent = '';
  if (!active.length) {
    const empty = document.createElement('div');
    empty.className = 'class-empty';
    empty.textContent = 'No classes yet. Add your first one below.';
    list.append(empty);
  } else {
    active.forEach((cls, i) => list.append(classRow(cls, i, active.length)));
  }

  const archived = archivedClasses(doc);
  if (archivedSection) archivedSection.classList.toggle('hidden', archived.length === 0);
  if (archivedList) {
    archivedList.textContent = '';
    archived.forEach((cls, i) => archivedList.append(classRow(cls, i, archived.length)));
  }

  /* The focus goes to the rename field after the list is in the document, not before: an input
     that is not yet in the page cannot take focus, and on iPadOS a focus() that misses is a
     software keyboard that never appears. */
  if (renamingId) {
    const input = list.querySelector('[data-class-rename-save="' + cssId(renamingId) + '"] .rename-input');
    if (input) { input.focus(); input.select(); }
  }
}

/* Ids are generated by newId() — base36 and `_` — so this is belt and braces rather than a
   sanitizer. It is here because the day an id comes from somewhere else, a selector built by
   concatenation is an injection point rather than a bug. */
function cssId(id) { return String(id).replace(/["\\\]]/g, ''); }

export function openClassManager(opener) {
  showClassError('');
  renamingId = '';
  renderClassList();
  const input = document.getElementById(NEW_INPUT_ID);
  if (input) input.value = '';
  /* Opened through its own hook rather than data-modal-open, for the reason year-picker.js
     gives: the panel is filled from the document, and a modal that opens and then fills in is a
     modal that flickers. */
  openModal(CLASS_MODAL_ID, opener);
}

export function createClassFromForm() {
  const input = document.getElementById(NEW_INPUT_ID);
  if (!input) return;
  const name = input.value.trim();
  if (!name) {
    showClassError('Give the class a name first — whatever you call it out loud is the right '
      + 'answer, and you can change it later.');
    input.focus();
    return;
  }
  if (!getDoc()) {
    showClassError('There is no school year open, so there is nowhere to put a class yet.');
    return;
  }

  /* Which term structure the new class starts with: the active pill in the create form. The
     pills are a `data-pill-group`, which shell.js already single-selects — reusing that is why
     there is no fourth hook here, and why the choice is a row of touch targets rather than a
     <select>, which on an iPad is a spinning wheel over the whole screen. */
  const chosen = document.querySelector('#classNewPresets .pill.active');
  const presetKey = chosen ? chosen.getAttribute('data-preset') : DEFAULT_PRESET;

  const cls = newClass(name, presetKey);
  update((doc) => { classesIn(doc).push(cls); });
  input.value = '';
  showClassError('');
  renamingId = '';

  /* A first class becomes the open one, because the alternative is a teacher who has just made a
     class looking at a header that says nothing is selected. Later ones do not steal the
     selection out from under whatever she was doing. */
  if (activeClasses(getDoc()).length === 1) setPref('openClassId', cls.id);

  renderClassList();
  refreshClassBar();
  announce('Added ' + cls.name + ' with ' + plural(termsOf(cls).length, 'term', 'terms') + '.');
  input.focus();
}

export function startRename(id) {
  if (!findClass(id)) return;
  showClassError('');
  renamingId = id;
  renderClassList();
}

export function cancelRename() {
  renamingId = '';
  showClassError('');
  renderClassList();
}

export function saveRename(id) {
  const row = document.querySelector('[data-class-rename-save="' + cssId(id) + '"] .rename-input');
  const cls = findClass(id);
  if (!row || !cls) return;
  const name = row.value.trim();
  if (!name) {
    showClassError('A class needs a name. Cancel the rename if you want to keep “' + cls.name + '”.');
    row.focus();
    return;
  }
  const was = cls.name;
  update(() => { cls.name = name; });
  renamingId = '';
  showClassError('');
  renderClassList();
  refreshClassBar();
  announce('Renamed ' + was + ' to ' + name + '.');
}

/*
  Reorder. The array IS the order — there is no `order` field, because two ways to say where a
  class sits is one way for them to disagree, and the tab bar renders doc.classes in order.

  A move swaps with the next class of the same kind, active with active and archived with
  archived, so the arrows move a row past the row above or below it on screen even when the
  document interleaves the two.
*/
function moveClass(id, delta) {
  const doc = getDoc();
  const cls = findClass(id);
  if (!doc || !cls) return;
  const all = classesIn(doc);
  const siblings = all.filter((c) => isArchived(c) === isArchived(cls));
  const at = siblings.indexOf(cls);
  const swapWith = siblings[at + delta];
  if (!swapWith) return;

  const a = all.indexOf(cls);
  const b = all.indexOf(swapWith);
  update(() => { all[a] = swapWith; all[b] = cls; });

  renderClassList();
  refreshClassBar();
  /* Spoken with its new position, because reordering a list is a change a screen-reader user
     cannot see happen and cannot infer from focus staying where it was. */
  const now = classesIn(getDoc()).filter((c) => isArchived(c) === isArchived(cls)).indexOf(cls) + 1;
  announce(cls.name + ' is now ' + now + ' of ' + siblings.length + '.');
}

export function moveClassUp(id) { moveClass(id, -1); }
export function moveClassDown(id) { moveClass(id, 1); }

/* Archive keeps everything and takes the class off the tab bar. Nothing is deleted, nothing is
   copied, and restoring puts it back exactly where it was in the order. */
export function archiveClass(id) {
  const cls = findClass(id);
  if (!cls) return;
  update(() => { cls.archived = true; });
  renamingId = '';
  showClassError('');
  renderClassList();
  refreshClassBar();
  announce(cls.name + ' is archived. Everything in it is kept — restore it here any time.');
}

export function restoreClass(id) {
  const cls = findClass(id);
  if (!cls) return;
  update(() => { cls.archived = false; });
  showClassError('');
  renderClassList();
  refreshClassBar();
  announce(cls.name + ' is back on the class bar.');
}

/* ────────────────────────────── delete, and what it costs ────────────────────────────── */

/*
  Everything the delete would destroy, counted off the open document rather than estimated. These
  are the numbers the confirm dialog prints, and they are the whole reason it is a dialog and not
  a `confirm()`: "OK to delete Period 3?" is a question a tired teacher answers yes to, and
  "attendance for 46 recorded meetings, 31 assignments, 620 scores" is one she reads.

  Meetings are counted as RECORDED MEETINGS — attendance records without an exception — which is
  what everything in this app counts (plans/rotating-schedule.md). Days marked as not meeting are
  named separately, because they are also destroyed and they are not meetings.
*/
function deletionCounts(doc, cls) {
  const records = (Array.isArray(doc.attendance) ? doc.attendance : [])
    .filter((r) => r.classId === cls.id);
  const meetings = records.filter((r) => !r.exception).length;
  const assignments = (Array.isArray(doc.assignments) ? doc.assignments : [])
    .filter((a) => a.classId === cls.id);
  /* Scores are keyed by assignment, then student (docs/data-model.md), so the count is the
     number of cells in the columns belonging to this class's assignments. A key that is not
     there means ungraded and is not a score. */
  const scores = assignments.reduce((n, a) => {
    const column = doc.scores && doc.scores[a.id];
    return n + (column ? Object.keys(column).length : 0);
  }, 0);
  return {
    records: records.length,
    meetings: meetings,
    notMeeting: records.length - meetings,
    assignments: assignments.length,
    scores: scores,
    roster: Array.isArray(cls.roster) ? cls.roster.length : 0,
    terms: termsOf(cls).length,
  };
}

function factLine(parent, text) {
  const el = document.createElement('div');
  el.className = 'class-delete-line';
  el.textContent = text;
  parent.append(el);
}

export function openDeleteConfirm(id, opener) {
  const doc = getDoc();
  const cls = findClass(id);
  if (!doc || !cls) return;
  /* Set here and read only by confirmDelete(), which only the button inside the dialog calls — so a
     value left behind by a teacher who closed the dialog with the ✕ can do nothing on its own, and
     the next open replaces it. Same shape and same reasoning as src/backup.js's `pending`. */
  pendingDeleteId = id;

  const counts = deletionCounts(doc, cls);
  const lead = document.getElementById(DELETE_LEAD_ID);
  if (lead) {
    lead.textContent = 'Deleting ' + cls.name + ' removes the class and everything recorded in '
      + 'it. This cannot be undone, and a backup file is the only way back. If you only want it '
      + 'out of the way, leave it archived instead.';
  }

  const facts = document.getElementById(DELETE_FACTS_ID);
  if (facts) {
    facts.textContent = '';
    /* Named in the order a teacher would miss them. The zero cases are printed too — "nothing
       has been recorded in it yet" is the sentence that makes deleting a class created by
       mistake feel safe, and hiding the line would leave her guessing. */
    if (counts.records) {
      factLine(facts, 'Attendance for ' + plural(counts.meetings, 'recorded meeting', 'recorded meetings')
        + (counts.notMeeting ? ', and ' + plural(counts.notMeeting, 'day', 'days') + ' marked as not meeting' : ''));
    }
    if (counts.assignments) {
      factLine(facts, plural(counts.assignments, 'assignment', 'assignments') + ' and '
        + plural(counts.scores, 'score', 'scores'));
    }
    if (counts.terms) factLine(facts, plural(counts.terms, 'term', 'terms'));
    if (counts.roster) {
      factLine(facts, plural(counts.roster, 'student', 'students') + ' on its roster — the '
        + 'students themselves stay in the school year, because a student belongs to the year '
        + 'rather than to one class');
    }
    if (!counts.records && !counts.assignments && !counts.roster) {
      factLine(facts, 'Nothing has been recorded in this class yet — no attendance, no '
        + 'assignments, no students.');
    }
  }

  const button = document.getElementById(DELETE_BTN_ID);
  if (button) button.textContent = 'Delete ' + cls.name;

  openModal(DELETE_MODAL_ID, opener);
}

/*
  Yes. The only line in this module that destroys anything, and it destroys exactly what the
  dialog listed: the class, its attendance records, its assignments, and the score columns
  belonging to those assignments.

  What it deliberately leaves alone:
    - STUDENTS. A student belongs to the school year and can be in two classes (WO-1.7), so
      deleting a class deletes a roster list, never a person's record.
    - CALENDAR EVENTS AND THE LOG. An event names classIds, and an EMPTY classIds means
      school-wide (docs/data-model.md) — so pruning a deleted class out of a two-class event
      eventually empties one and silently promotes it to the whole school. A dangling id matches
      no class and shows up nowhere, which is the harmless failure. The log is append-only for
      the reason docs/data-model.md gives, and rewriting history to tidy it is the opposite.
*/
export function confirmDelete() {
  const doc = getDoc();
  const cls = findClass(pendingDeleteId);
  pendingDeleteId = '';
  if (!doc || !cls) { closeModal(DELETE_MODAL_ID); return; }

  const name = cls.name;
  const counts = deletionCounts(doc, cls);

  update((d) => {
    const gone = (Array.isArray(d.assignments) ? d.assignments : [])
      .filter((a) => a.classId === cls.id).map((a) => a.id);
    gone.forEach((assignmentId) => { if (d.scores) delete d.scores[assignmentId]; });
    d.assignments = (Array.isArray(d.assignments) ? d.assignments : [])
      .filter((a) => a.classId !== cls.id);
    d.attendance = (Array.isArray(d.attendance) ? d.attendance : [])
      .filter((r) => r.classId !== cls.id);
    d.classes = classesIn(d).filter((c) => c.id !== cls.id);
  });

  closeModal(DELETE_MODAL_ID);
  renamingId = '';
  renderClassList();
  refreshClassBar();
  announce('Deleted ' + name + ', with ' + plural(counts.records, 'attendance record', 'attendance records')
    + ' and ' + plural(counts.assignments, 'assignment', 'assignments') + '.');
}

/* No. Nothing has been written, so there is nothing to undo — which is the point of counting
   before the dialog rather than after it. */
export function cancelDelete() {
  pendingDeleteId = '';
  closeModal(DELETE_MODAL_ID);
  announce('Nothing was deleted.');
}

/* ────────────────────────────── terms ────────────────────────────── */

function showTermError(message) {
  const el = document.getElementById(TERM_ERROR_ID);
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
  if (message) announce(message);
}

/* Assignments in a term, which is the one question this module asks about grade data and the one
   thing that makes removing a term destructive. There is no assignment screen yet — WO-3.x owns
   that — so this is zero for every class today, and it is written now because the term editor is
   what will still be removing terms when it is not. */
function assignmentsInTerm(doc, termId) {
  return (Array.isArray(doc.assignments) ? doc.assignments : [])
    .filter((a) => a.termId === termId).length;
}

function termRow(cls, term, index) {
  const row = document.createElement('div');
  row.className = 'term-row';

  const label = document.createElement('input');
  label.className = 'term-label-input';
  label.type = 'text';
  label.value = term.label || '';
  label.setAttribute('data-term-field', 'label');
  label.setAttribute('data-term-id', term.id);
  label.setAttribute('aria-label', 'Name of term ' + (index + 1) + ' in ' + cls.name);
  label.setAttribute('autocomplete', 'off');
  row.append(label);

  const dates = document.createElement('div');
  dates.className = 'term-dates';
  dates.append(dateField(cls, term, 'start'), dateField(cls, term, 'end'));
  row.append(dates);

  const remove = actionButton('Remove', 'data-term-remove', term.id, 'delete');
  remove.setAttribute('aria-label', 'Remove ' + (term.label || 'this term') + ' from ' + cls.name);
  row.append(remove);
  return row;
}

/* One truth for the two captions, because resetDateField() below has to rebuild a field without
   being told what it was called. */
const DATE_LABELS = { start: 'Starts', end: 'Ends' };

function dateField(cls, term, field) {
  const labelText = DATE_LABELS[field] || '';
  const wrap = document.createElement('label');
  wrap.className = 'term-date-field';

  const caption = document.createElement('span');
  caption.className = 'term-date-label';
  caption.textContent = labelText;
  wrap.append(caption);

  const input = document.createElement('input');
  input.className = 'term-date';
  /* A real date input, so iPadOS gives the teacher its own picker rather than a text field she
     has to type an ISO string into. Empty is allowed and stays empty — there is no min, no max,
     and nothing comparing this field to the other one. See the header comment: these dates are
     labels on a range, and the moment anything validates them into a calendar this app has the
     schedule model plans/rotating-schedule.md deleted. */
  input.type = 'date';
  input.value = typeof term[field] === 'string' ? term[field] : '';
  input.setAttribute('data-term-field', field);
  input.setAttribute('data-term-id', term.id);
  input.setAttribute('aria-label', labelText + ' — ' + (term.label || 'term') + ' in ' + cls.name);
  wrap.append(input);
  return wrap;
}

/*
  Clearing a date on iPadOS, which is a WebKit quirk and was found on the hardware rather than here.

  The date popover keeps its OWN selection, separate from the input's value. Clear a field that
  held 2026-09-04 and the calendar still has September 4th highlighted — so tapping September 4th
  again changes nothing from the picker's point of view, no `input` event fires, and the field stays
  empty. The teacher's workaround is to tap a neighbouring day and come back, which is worse than an
  annoyance: it writes a date she never wanted into the year document on the way past.

  So a cleared field is thrown away and rebuilt. A fresh element has no picker state, and the next
  tap opens a calendar with nothing selected, where every date — including the one just cleared —
  registers on the first tap.

  ON `change`, NOT ON `input`, and that distinction is the whole reason this is a second function
  rather than three lines inside editTermField(). A desktop date field reports its value as '' while
  it is being typed into ("09/0…" is not a date yet), so `input` fires with an empty value several
  times per date entered. Rebuilding on those would replace the element under the caret on the
  second keystroke. `change` fires when a value is committed — the picker's Clear, or a blur — and
  never mid-typing.
*/
export function termDateCommitted(input) {
  const cls = findClass(termClassId);
  const termId = input.getAttribute('data-term-id');
  const field = input.getAttribute('data-term-field');
  if (!cls || !termId) return;
  if (field !== 'start' && field !== 'end') return;
  if (input.value) return;
  const term = termsOf(cls).filter((t) => t.id === termId)[0];
  if (!term) return;

  /* Written here as well as in editTermField(), for the browser that commits a picker change
     without an `input` event first: the document is what the rebuilt field reads its value from,
     and a cleared field that never reached the store would come back holding the old date.

     The write is conditional and the rebuild below is not, which is the right way round. By the
     time `change` fires, the `input` listener has usually already stored the '' — so testing the
     stored value to decide whether to REBUILD would skip the rebuild in the exact case it exists
     for. What the test is good for is not saving the document over an identical copy of itself, and
     not bumping `rev` for a term date that was already empty (docs/sync.md). */
  if (term[field]) update(() => { term[field] = ''; });
  const wrap = input.closest('.term-date-field');
  if (wrap) wrap.replaceWith(dateField(cls, term, field));
}

function renderTermList() {
  const cls = findClass(termClassId);
  const list = document.getElementById(TERM_LIST_ID);
  const name = document.getElementById(TERM_CLASS_NAME_ID);
  if (name) name.textContent = cls ? cls.name : '';
  if (!list) return;

  list.textContent = '';
  if (!cls) return;
  const terms = termsOf(cls);
  if (!terms.length) {
    const empty = document.createElement('div');
    empty.className = 'class-empty';
    empty.textContent = 'This class has no terms yet. Start from one of the structures above, or '
      + 'add them one at a time.';
    list.append(empty);
    return;
  }
  /* Rendered in the order the document holds them, and never sorted by date. A teacher who
     writes her terms out of order sees them in the order she wrote them, which is the only order
     this app knows anything about. */
  terms.forEach((term, i) => list.append(termRow(cls, term, i)));
}

export function openTermEditor(classId, opener) {
  const id = classId || getSelectedClassId();
  if (!findClass(id)) return;
  termClassId = id;
  showTermError('');
  renderTermList();
  openModal(TERM_MODAL_ID, opener);
}

export function addTerm() {
  const cls = findClass(termClassId);
  if (!cls) return;
  const terms = termsOf(cls);
  /* Numbered by how many there are, which is a starting point and not a promise: rename it and
     nothing anywhere notices, because no code reads a number out of a label. */
  const term = newTerm('Term ' + (terms.length + 1));
  update(() => {
    if (!Array.isArray(cls.terms)) cls.terms = [];
    cls.terms.push(term);
  });
  showTermError('');
  renderTermList();
  renderClassList();
  refreshClassBar();
  announce('Added ' + term.label + ' to ' + cls.name + '.');
}

export function removeTerm(termId) {
  const doc = getDoc();
  const cls = findClass(termClassId);
  if (!doc || !cls) return;
  const term = termsOf(cls).filter((t) => t.id === termId)[0];
  if (!term) return;

  const held = assignmentsInTerm(doc, termId);
  if (held) {
    /* Refused rather than cascaded. Removing the term an assignment lives in would leave that
       assignment pointing at nothing, and a grade that quietly stops counting is the worst
       failure this app has. WO-3.x owns moving an assignment between terms; until then the
       honest answer is to say what is in the way. */
    const those = held === 1 ? 'it' : 'them';
    showTermError('“' + (term.label || 'That term') + '” still holds '
      + plural(held, 'assignment', 'assignments') + ', so it has not been removed. Move '
      + those + ' to another term, or delete ' + those + ', first.');
    return;
  }

  update(() => { cls.terms = termsOf(cls).filter((t) => t.id !== termId); });
  showTermError('');
  renderTermList();
  renderClassList();
  refreshClassBar();
  announce('Removed ' + (term.label || 'the term') + ' from ' + cls.name + '.');
}

/*
  Apply a starting structure, which REPLACES the term list. Refused if any of the terms it would
  replace holds an assignment, for the reason removeTerm() gives — a preset is a shortcut for
  setting a class up, not a way to lose a quarter of grades.
*/
export function applyPreset(presetKey) {
  const doc = getDoc();
  const cls = findClass(termClassId);
  const preset = TERM_PRESETS[presetKey];
  if (!doc || !cls || !preset) return;

  const held = termsOf(cls).reduce((n, t) => n + assignmentsInTerm(doc, t.id), 0);
  if (held) {
    showTermError('This class already holds ' + plural(held, 'assignment', 'assignments')
      + ' in its terms, so the structure has not been replaced. Rename the terms you have, or add '
      + 'and remove them one at a time.');
    return;
  }

  update(() => { cls.terms = presetTerms(presetKey); });
  showTermError('');
  renderTermList();
  renderClassList();
  refreshClassBar();
  announce(cls.name + ' now has ' + plural(termsOf(cls).length, 'term', 'terms') + '.');
}

/*
  A label or a date being typed. Called from shell.js's `input` listener, so it fires per
  keystroke and the store's debounce is what turns that into one save (src/store.js).

  The row is NOT re-rendered — replacing the input the teacher is typing into would take the
  caret with it — but the header nav is, so the tab she is naming updates as she names it.
*/
export function editTermField(input) {
  const cls = findClass(termClassId);
  const termId = input.getAttribute('data-term-id');
  const field = input.getAttribute('data-term-field');
  if (!cls || !termId || !field) return;
  const term = termsOf(cls).filter((t) => t.id === termId)[0];
  if (!term) return;
  if (field !== 'label' && field !== 'start' && field !== 'end') return;

  const value = input.value;
  update(() => { term[field] = value; });
  showTermError('');
  if (field === 'label') {
    refreshClassBar();
  }
}
