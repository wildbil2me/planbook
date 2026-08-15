/*
  Days off & planned drops — the one screen in this app that AUTHORS a calendar exception, and the
  one that has to say out loud what it will not do.

  ── WHY THERE IS A SCREEN AT ALL, WHEN A DROP IS ALREADY ONE TAP ──

  Two things are known in advance and shouldn't wait for the day to load: holidays, where the whole
  school is out, and pre-drops, where an assembly is shifting Thursday's rotation. Both are things
  the teacher finds out about in a September email and would otherwise have to remember to act on
  each morning — plans/rotating-schedule.md § "Setting exceptions ahead of time" is the decision
  record, and its table says which of the three surfaces each kind of exception belongs on and why
  they are different places. "We didn't meet today" stays a tap on the registry. THIS is the other
  two rows of that table.

  ── WHAT IT WRITES, AND THE ONE THING IT MUST NEVER WRITE ──

  It writes into `doc.events` through src/calendar.js and NOWHERE ELSE. It does not touch
  `doc.attendance`, it does not import src/attendance.js's writers, and there is no path through
  this file that creates an attendance record — which is the work order's fifth acceptance line and
  the Traps paragraph it comes from. Copying the event onto records is the obvious implementation:
  five classes across a three-day break is fifteen `{ classId, date, exception }` rows and the
  marking screen would need no changes at all. It is also the one thing this design exists to
  prevent, because the copy is a second source of truth — shorten the break by a day and the stale
  rows survive it, each one asserting that a class did not meet on a day it did.

  The read side is one function in src/attendance.js (stateOf) and it goes the other way: the
  registry ASKS the calendar at render. Delete the holiday here and every class follows on the next
  paint, because there was never a copy to go and find.

  ── THE WARNING, AND WHY IT IS A WARNING AND NOT A REFUSAL ──

  A snow day is usually added the morning after — retroactively, over dates that may already have
  real attendance on them. plans/rotating-schedule.md § Precedence: *"a day with attendance actually
  recorded stays a meeting, even if a calendar exception is added over it later. Someone marking a
  retroactive snow day must not silently void a period's real attendance. Warn, and leave the record
  alone."*

  The LEAVING ALONE is structural rather than careful: stateOf() answers the record before it
  consults the calendar, so nothing this file can write is able to void a mark. That is what lets
  the warning be a warning. What it is for is the other half — the teacher who thinks she has closed
  Tuesday and has not, because Tuesday holds a period she taught. So the confirm names the classes
  and the dates, and the event is not written until she says yes. A refusal here would be worse:
  Monday and Wednesday of that snow week are still legitimately closed, and an app that will not
  record a two-day closure because one period was marked in the middle of it is an app she works
  around.

  The confirm is only raised when there IS something to protect. A holiday over an empty November
  is one tap, because a dialog that appears every time is a dialog that gets tapped through.

  ── THE FORM, AND THE TWO WEBKIT FACTS BUILT INTO IT ──

  A kind, a title, a from-date, an optional to-date, and — for a planned drop — which classes. Real
  `<input type="date">` fields, so iPadOS gives the teacher its own picker rather than a text field
  she has to type an ISO string into; the same call src/classes.js's term dates make, and the
  comment there records what that costs.

  THE DATES CLEAR AFTER A SUCCESSFUL ADD, AND THE FIELDS ARE THROWN AWAY TO DO IT. This shipped the
  other way round and was wrong on the hardware — the owner reported it on 2026-08-08 after the
  first real sitting: a form that keeps last entry's dates is a form where the next add silently
  inherits them, and reading the list to check what you just did means reading past two fields that
  are still talking about it.

  Keeping them was not arbitrary, though, and the reason it was done has NOT gone away. It is the
  WebKit fact src/classes.js's termDateCommitted() documents from the same hardware: the date
  popover keeps its OWN selection, separate from the input's value, so a field cleared in code still
  has that day highlighted in the picker and tapping it again fires no `input` event at all. Clear
  these two naively and the teacher entering a run of half-days cannot re-pick the day she just
  used.

  So they are cleared the way that file clears one — the element is discarded and rebuilt. A fresh
  `<input type="date">` has no picker state, so the calendar opens with nothing selected and every
  date, including the one just used, registers on the first tap. The trap is answered rather than
  avoided, which is why the behaviour could finally follow what the teacher asked for.

  AND `To` FOLLOWS `From`. Picking a start date fills the end date with the same day, so a one-day
  closure is one field and a break is one field plus a nudge forward. It only ever fills a field
  that is empty or that holds a date BEFORE the new start — a `to` the teacher set herself is hers,
  and the only time overwriting it is right is when it has just become impossible.

  THE CLASS PICKER IS `.toggle-btn`, NOT CHECKBOXES. shell.css says why where that class is
  declared: a checkbox is 16px of target that no padding makes bigger, and this list is read on an
  iPad. It is drawn from getActiveClasses() every time the panel opens, because nothing in this app
  may assume a fixed class list (CLAUDE.md) and a class archived this morning should not still be
  offered here this afternoon.

  ── AND THE FUTURE DATES ──

  src/attendance.js has a gate that refuses every attendance write after today, and that gate is
  untouched by this file — nothing here calls anything behind it. Authoring an event on a future
  date is the entire point of this work order and it is a write to a DIFFERENT array; the day
  something in here reaches for setMark() or takeClass() to "apply" an event, the gate is being
  routed around and the Traps paragraph has been lost.
*/

import { getDoc, update } from './store.js';
import { announce } from './live-region.js';
import { openModal, closeModal } from './modal.js';
import { getActiveClasses } from './classes.js';
import * as calendar from './calendar.js';
/* Read-only, and one function of it: what counts as a recorded meeting is src/attendance.js's
   answer and must not get a second copy here — see meetingsBetween() there. */
import { meetingsBetween, spokenDate } from './attendance.js';
/* The month and day of a date, in the words every other screen uses for them (WO-3.20). This list
   puts a weekday in front of it and nothing else — see weekdayShortDate() below, which is composed
   rather than copied so that `Nov 26` is one string in this app rather than four. */
import { shortDate } from './date-text.js';

const MODAL_ID = 'daysOffModal';
const CONFIRM_ID = 'daysOffConfirmModal';
const KIND_ID = 'daysOffKinds';
const TITLE_ID = 'daysOffTitle';
const FROM_ID = 'daysOffFrom';
const TO_ID = 'daysOffTo';
const CLASS_ROW_ID = 'daysOffClasses';
const CLASS_PICKER_ID = 'daysOffClassPicker';
const LIST_ID = 'daysOffList';
const ERROR_ID = 'daysOffError';
const CONFIRM_LEAD_ID = 'daysOffConfirmLead';
const CONFIRM_FACTS_ID = 'daysOffConfirmFacts';

/* ── THE VIEW STATE ──
   Two values, neither of them student data and neither persisted. The chosen classes are held here
   rather than read off the buttons at submit time for the reason the buttons themselves are
   `aria-pressed` toggles: the list is redrawn whenever the panel opens, and a selection that lived
   only in the DOM would be a selection the next open silently changed. */
let chosenKind = calendar.NO_SCHOOL;
let chosenClassIds = [];
/* The event a confirm dialog is about, held between the two taps and cleared by both exits. Nothing
   is written until the yes. */
let pendingEvent = null;

function showError(message) {
  const el = document.getElementById(ERROR_ID);
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
  /* Also spoken: it lands in a corner of a dialog a screen-reader user has no reason to move to,
     and there is exactly one aria-live region in this app (src/live-region.js). */
  if (message) announce(message);
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

function classNameOf(id) {
  const cls = getActiveClasses().filter((c) => c.id === id)[0];
  return cls ? cls.name : '';
}

/* `2026-11-26` → `Thu, Nov 26`.

   NOT CALLED shortDate(), AND THAT IS THE POINT OF WO-3.20: it produces a different string from the
   src/date-text.js function of that name, and two functions with one name and two answers is how a
   later screen renders one format beside another in good faith. The name says what comes out. The
   MONTH AND DAY come from that file rather than from a second copy of the same lookup, so this list
   and the assignment list cannot drift apart about what `Nov 26` looks like; the weekday in front is
   this screen's own, because a day off is checked against a school week and the weekday IS the fact
   being read.

   Shorter than src/attendance.js's spokenDate(), which is the full sentence a screen reader gets: a
   list of ten rows wants the short one and the accessible name wants the long one, so both appear
   below and neither is re-derived here.

   AN UNREADABLE DATE IS ECHOED BACK rather than dropped — this row's own answer, kept as it was
   because WO-3.20 changed no screen. The shared formatter answers '' instead and its definition
   carries the ruling for both. The guard is shortDate()'s: it returns a non-empty string only for
   three numeric fields that make a real day, so the parse below cannot be reached with anything
   `new Date()` would call invalid. */
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function weekdayShortDate(iso) {
  const said = shortDate(iso);
  if (!said) return String(iso || '');
  const parts = String(iso).split('-');
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return DOW[d.getDay()] + ', ' + said;
}

/* The range in words, and a one-day event says one date rather than the same date twice. */
function rangeText(event) {
  const to = event.endDate && event.endDate > event.date ? event.endDate : '';
  return weekdayShortDate(event.date) + (to ? ' – ' + weekdayShortDate(to) : '');
}

/* Who it covers, in the teacher's own class names. An empty `classIds` is school-wide, which is the
   data model's rule and the reason a holiday is one entry rather than one per class. A named id
   that no longer resolves — the class was deleted after the event was written — is shown as such
   rather than dropped, because a row that quietly covers fewer classes than it says is worse than
   an honest gap. */
function scopeText(event) {
  const ids = Array.isArray(event.classIds) ? event.classIds : [];
  if (!ids.length) return 'Every class';
  return ids.map((id) => classNameOf(id) || 'a class that has been deleted').join(', ');
}
/* The same fact inside a sentence. Only the app's own two words move to lower case: a class name is
   the teacher's own text and "period 3 — biology" is not how she writes it. Same rule, and the same
   reason, as src/attendance.js's coverSaid(). */
function scopeSaid(event) {
  const ids = Array.isArray(event.classIds) ? event.classIds : [];
  return ids.length ? scopeText(event) : 'every class';
}

/* ────────────────────────────── the form ────────────────────────────── */

/*
  Which kind is being authored, and the one visible consequence of it: a planned drop names classes
  and a no-school day does not. The pills are a `data-pill-group`, which src/shell.js already
  single-selects — reusing that is why there is no second hook for the pressed state, and why the
  choice is a row of touch targets rather than a <select>, which on an iPad is a spinning wheel over
  the whole screen (src/classes.js makes the same call for term presets).
*/
export function setKind(kind) {
  if (!calendar.kindInfo(kind)) return;
  chosenKind = kind;
  showError('');
  paintKind();
}

function paintKind() {
  const row = document.getElementById(CLASS_ROW_ID);
  if (row) row.classList.toggle('hidden', chosenKind !== calendar.DROPPED);
  const group = document.getElementById(KIND_ID);
  if (!group) return;
  group.querySelectorAll('[data-dayoff-kind]').forEach((btn) => {
    const on = btn.getAttribute('data-dayoff-kind') === chosenKind;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

export function toggleClass(id) {
  if (!id) return;
  const at = chosenClassIds.indexOf(id);
  if (at >= 0) chosenClassIds.splice(at, 1);
  else chosenClassIds.push(id);
  showError('');
  paintClassPicker();
}

function paintClassPicker() {
  const picker = document.getElementById(CLASS_PICKER_ID);
  if (!picker) return;
  picker.textContent = '';
  const list = getActiveClasses();
  if (!list.length) {
    const empty = document.createElement('span');
    empty.className = 'roster-empty';
    empty.textContent = 'No classes yet, so there is nothing to drop. A school-wide day off still '
      + 'works — it covers whatever you add later.';
    picker.append(empty);
    return;
  }
  /* A class that was chosen and has since been archived stops being offered here, so it stops
     being chosen too — otherwise the next event would silently name a class the teacher can no
     longer see. */
  chosenClassIds = chosenClassIds.filter((id) => list.some((c) => c.id === id));
  list.forEach((cls) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const on = chosenClassIds.indexOf(cls.id) >= 0;
    btn.className = 'toggle-btn' + (on ? ' active' : '');
    btn.setAttribute('data-dayoff-class', cls.id);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = cls.name;
    picker.append(btn);
  });
}

/* ────────────────────────────── the two date fields ────────────────────────────── */

/*
  A DATE FIELD, THROWN AWAY AND REBUILT. src/classes.js's termDateCommitted() carries the long
  version of why; the short one is that a cleared `<input type="date">` on iPadOS keeps its picker's
  selection, so the day just used cannot be re-picked until the element itself is gone.

  Written as a rebuild of the ELEMENT rather than as a `value = ''`, and both places this file
  empties a date go through it — the commit below and the change hook underneath. Two ways to clear
  a field would be one way that works and one that strands the teacher on the day she is most likely
  to want twice.
*/
function rebuildDateField(input) {
  if (!input || !input.parentNode) return null;
  const fresh = document.createElement('input');
  fresh.type = 'date';
  fresh.className = input.className;
  fresh.id = input.id;
  const label = input.getAttribute('aria-label');
  if (label) fresh.setAttribute('aria-label', label);
  const hook = input.getAttribute('data-dayoff-date');
  if (hook) fresh.setAttribute('data-dayoff-date', hook);
  input.replaceWith(fresh);
  return fresh;
}

function clearDates() {
  rebuildDateField(document.getElementById(FROM_ID));
  rebuildDateField(document.getElementById(TO_ID));
}

/*
  A DATE THE TEACHER HAS COMMITTED. Two jobs, and they are the two halves of the same iPadOS
  paragraph in the header.

  ON `change`, NOT ON `input`, for the reason src/classes.js gives at the same hook: a desktop date
  field reports '' several times while a date is being typed into it, so an `input`-driven rebuild
  would replace the element under the caret on the second keystroke. `change` fires when a value is
  committed — the picker's own Clear, or a blur — and never mid-typing.
*/
export function dateCommitted(input) {
  if (!input) return;
  const which = input.getAttribute('data-dayoff-date');
  /* Cleared by hand, on the field that has the picker-state problem. Rebuilt for the same reason
     the commit rebuilds them: an empty field the teacher emptied is one she is about to re-fill. */
  if (!input.value) { rebuildDateField(input); return; }
  if (which !== 'from') return;

  /* `To` follows `From` — see the header. A `to` already past the new start is left exactly as the
     teacher set it; only an empty one, or one that the new start has just made impossible, moves. */
  const toEl = document.getElementById(TO_ID);
  if (!toEl) return;
  if (toEl.value && toEl.value >= input.value) return;
  toEl.value = input.value;
  showError('');
}

/* ────────────────────────────── the list of what is already there ────────────────────────────── */

/*
  One row per exception on the calendar, in date order, with what it covers and the way to remove
  it. Built with createElement rather than as markup for the reason src/year-picker.js gives and
  this file makes real twice over: the title is teacher-typed and the class names are SIS-pasted.

  It lists the two kinds this build authors and nothing else. WO-6.1's conferences and grades-due
  entries live in the same array and are deliberately not shown here — this panel is "days off and
  drops", and a Remove beside a meeting reminder on a screen called that is a mis-tap waiting to be
  reported as data loss.
*/
function paintList() {
  const list = document.getElementById(LIST_ID);
  if (!list) return;
  list.textContent = '';
  const doc = getDoc();
  const events = doc ? calendar.exceptionsIn(doc) : [];
  if (!events.length) {
    const empty = document.createElement('div');
    empty.className = 'roster-empty';
    empty.textContent = 'Nothing on the calendar yet. Add the breaks you already know about — '
      + 'every class follows them, and nothing is written into your attendance to undo later.';
    list.append(empty);
    return;
  }
  events.forEach((event) => list.append(eventRow(event)));
}

function eventRow(event) {
  const row = document.createElement('div');
  row.className = 'roster-row';

  const info = calendar.kindInfo(event.kind);
  const badge = document.createElement('span');
  /* The same word the registry's column head shows for this event, from the same table in
     src/calendar.js — a teacher who reads "Planned drop" over Thursday should find "Planned drop"
     here and not a synonym. */
  badge.className = 'dayoff-kind' + (event.kind === calendar.DROPPED ? ' drop' : '');
  badge.textContent = info ? info.word : event.kind;
  row.append(badge);

  const name = document.createElement('span');
  name.className = 'roster-row-name';
  name.textContent = (event.title || (info ? info.word : 'Day off')) + ' · ' + rangeText(event);
  row.append(name);

  const scope = document.createElement('span');
  scope.className = 'roster-row-note';
  scope.textContent = scopeText(event);
  row.append(scope);

  const actions = document.createElement('div');
  actions.className = 'roster-row-actions';
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'class-action-btn delete';
  remove.setAttribute('data-dayoff-remove', event.id);
  remove.textContent = 'Remove';
  remove.setAttribute('aria-label', 'Remove ' + (event.title || (info ? info.word : 'this event'))
    + ', ' + rangeText(event) + ', from the calendar');
  actions.append(remove);
  row.append(actions);
  return row;
}

/* ────────────────────────────── opening it ────────────────────────────── */

export function openDaysOff(opener) {
  showError('');
  pendingEvent = null;
  paintKind();
  paintClassPicker();
  paintList();
  const title = document.getElementById(TITLE_ID);
  if (title) title.value = '';
  /* And the dates, for the same reason the commit clears them: a panel that opens holding last
     Tuesday's range is a panel where the next add inherits a date nobody chose today. */
  clearDates();
  /* Opened through its own hook rather than data-modal-open, for the reason src/year-picker.js
     gives: the panel is filled from the document, and a modal that opens and then fills in is a
     modal that flickers. */
  openModal(MODAL_ID, opener);
}

/* ────────────────────────────── writing one ────────────────────────────── */

/*
  THE SUBMIT. Reads the form, refuses what cannot be true, and then either writes or raises the
  warning — and the order of those two is the whole of the history rule: nothing is in the document
  when the confirm appears.
*/
export function createFromForm() {
  const doc = getDoc();
  if (!doc) {
    showError('There is no school year open, so there is nowhere to put a day off yet.');
    return;
  }
  const titleEl = document.getElementById(TITLE_ID);
  const fromEl = document.getElementById(FROM_ID);
  const toEl = document.getElementById(TO_ID);
  if (!fromEl || !toEl) return;

  const from = fromEl.value;
  const to = toEl.value;
  if (!calendar.isDate(from)) {
    showError('Pick the date it starts. A single day just needs that one — the second date is for '
      + 'a break that runs over several.');
    fromEl.focus();
    return;
  }
  if (to && !calendar.isDate(to)) { showError('That end date did not read as a date.'); return; }
  if (to && to < from) {
    showError('The break ends before it starts. Swap the two dates, or clear the second one if it '
      + 'is a single day.');
    toEl.focus();
    return;
  }
  if (chosenKind === calendar.DROPPED && !chosenClassIds.length) {
    showError('Choose which classes are not meeting. A drop that names nobody would close the '
      + 'whole school, which is what the other kind is for.');
    return;
  }

  const event = calendar.newEvent(chosenKind, from, to,
    titleEl ? titleEl.value : '',
    chosenKind === calendar.DROPPED ? chosenClassIds : []);

  /* Every meeting already recorded under this range, for the classes this event would cover. The
     range is the event's own, so a one-day snow day asks about one day. */
  const clashes = meetingsBetween(event.date, event.endDate)
    .filter((m) => calendar.coversClass(event, m.classId));
  if (clashes.length) { openConfirm(event, clashes); return; }

  commit(event);
}

/*
  THE ONE PLACE AN EVENT IS WRITTEN, reached from the form when there is nothing to protect and from
  the confirm when the teacher has read what there is. One writer, so "authoring an event creates no
  attendance record" is a claim about four lines rather than about two paths.
*/
function commit(event) {
  update((d) => { calendar.addEvent(d, event); });
  pendingEvent = null;
  showError('');
  /* The whole form empties — the title, and both dates through the rebuild that makes emptying them
     safe on iPadOS. See the header. */
  const titleEl = document.getElementById(TITLE_ID);
  if (titleEl) titleEl.value = '';
  clearDates();
  paintList();

  /*
    FOCUS GOES TO THE BUTTON, NOT BACK TO THE TITLE, and on an iPad that is the difference between
    seeing what you just did and not. Focusing a text field summons the software keyboard, which
    comes up over the bottom half of the screen — which is where the list this add just changed
    lives. The teacher taps Add, the keyboard slides up, and the row she is trying to confirm is
    behind it. The owner reported exactly that on 2026-08-08.

    The submit button is where the thumb already is, it takes focus without a keyboard, and a
    keyboard user landing there is one Tab from the title with nothing skipped. Left unfocused
    entirely, focus would fall to <body> and a screen-reader user would lose their place in the
    dialog altogether.
  */
  const form = document.querySelector('[data-dayoff-create]');
  const submit = form ? form.querySelector('button[type="submit"]') : null;
  if (submit) submit.focus();

  const info = calendar.kindInfo(event.kind);
  announce((event.title ? event.title + ' — ' : '') + (info ? info.said : 'a day off')
    + ' on ' + rangeText(event) + ', covering ' + scopeSaid(event)
    + '. Nothing was written into your attendance.');
}

/* ────────────────────────────── the warning ────────────────────────────── */

/*
  WHAT IS ALREADY RECORDED UNDER THIS RANGE, named class by class and day by day, before anything is
  written. The dialog's own words say the thing a teacher needs to hear and would otherwise have to
  infer from a green column: the attendance STAYS.

  It is the classDeleteModal pattern — a second overlay on src/modal.js's stack, filled from the
  document, with the two facts and the two buttons — because "delete this class" and "close a week
  the school was open for" are the same gesture in different clothes, and the only thing separating
  them is what is on screen when the teacher taps yes.
*/
function openConfirm(event, clashes) {
  pendingEvent = event;
  const lead = document.getElementById(CONFIRM_LEAD_ID);
  const facts = document.getElementById(CONFIRM_FACTS_ID);
  const info = calendar.kindInfo(event.kind);

  if (lead) {
    lead.textContent = (event.title ? '“' + event.title + '” ' : (info ? info.word + ' ' : ''))
      + 'covers ' + rangeText(event) + ', and ' + plural(clashes.length, 'period', 'periods')
      + ' in there ' + (clashes.length === 1 ? 'has' : 'have')
      + ' attendance already recorded. Those stay exactly as they are — a day you really taught '
      + 'goes on counting as a meeting, and not one mark is touched. Every OTHER day in the range '
      + 'closes.';
  }
  if (facts) {
    facts.textContent = '';
    clashes.forEach((m) => {
      const line = document.createElement('span');
      line.className = 'dayoff-keeps-line';
      line.textContent = (classNameOf(m.classId) || 'A class no longer on the list')
        + ' — ' + spokenDate(m.date);
      facts.append(line);
    });
  }
  openModal(CONFIRM_ID);
}

export function confirmCreate() {
  const event = pendingEvent;
  closeModal(CONFIRM_ID);
  if (!event) return;
  commit(event);
}

export function cancelCreate() {
  pendingEvent = null;
  closeModal(CONFIRM_ID);
  announce('Nothing was added to the calendar.');
}

/* ────────────────────────────── removing one ────────────────────────────── */

/*
  DELETE THE HOLIDAY AND EVERY CLASS FOLLOWS. That sentence is the whole payoff of never having
  copied the event onto a record, and it is one filter in src/calendar.js — there is nothing else to
  unpick, because nothing else was written. Every day the event covered goes back to whatever it was
  before: not taken yet, unless the class has a record of its own on it.

  No confirm. An event is a line the teacher typed, it destroys nothing on the way out, and re-adding
  it costs two fields — which is exactly the test the class manager uses to decide that archiving
  needs no dialog and deleting does.
*/
export function removeDayOff(id) {
  const doc = getDoc();
  const event = doc ? calendar.findEvent(doc, id) : null;
  if (!event) return;
  const info = calendar.kindInfo(event.kind);
  const said = (event.title || (info ? info.word : 'That day off')) + ', ' + rangeText(event);

  update((d) => { calendar.removeEvent(d, id); });
  showError('');
  paintList();
  announce(said + ' is off the calendar. Every day it covered is back to not taken yet, and no '
    + 'attendance was changed.');
}

/*
  WHAT THIS FILE DOES NOT REPAINT, and it is deliberate rather than missing: the home cards and the
  registry behind this dialog both READ events, and both are redrawn by src/shell.js's
  afterCalendarChange() chained onto the hooks that reach the two writers above.

  The same arrangement, and the same reasoning, as src/attendance.js and src/classes.js: this module
  would otherwise have to import src/home.js and src/attendance.js to repaint them, and shell.js is
  where this app states the order things happen in. The cost of forgetting a link in that chain is a
  teacher who closes this panel and finds the grid behind it still showing a week she has just
  cancelled.
*/
