/*
  Calendar events — the general authoring surface, and the SECOND door onto `doc.events`.

  ── WHY THERE ARE TWO DOORS AND WHY THAT IS NOT WO-1.13's REDUNDANT SELECTOR ──

  src/days-off.js authors the two kinds ATTENDANCE READS — `no-school` and `dropped` — and keeps
  its own screen, its own warning about a week that was really taught, and `commit()`, which is
  still the only place a day off is written. This file authors the six kinds a teacher types in for
  her own sake: an early release, a grades-due date, a conference, a meeting, a trip, a reminder.
  Nothing here can write a day off, and nothing over there can write a trip.

  Two doors onto one array is the arrangement the SIS importer and the roster editor have had over
  the student record since WO-1.23. Two WRITERS of one RULE is the thing that arrangement cannot
  survive, and that is what WO-6.1 spent its first deliverable on: every rule protecting
  `doc.events` moved down into src/calendar.js BEFORE this file existed, so both forms ask
  eventFault() the same question and get the same sentence back. The rules were in the other
  screen's createFromForm() until then, which was survivable only while there was one door.

  ── WHAT THIS SCREEN CANNOT DO, AND THE REASON IS NOT ABOUT SCREENS ──

  It cannot say which classes MEET on a date. Not for the class picker, not for the repeat, not
  anywhere. plans/rotating-schedule.md is a settled decision record: a cycle model was designed and
  removed the same day, because the rotation also changes at random. The temptation arrives here as
  a kindness — "repeat weekly, but skip the weeks that class doesn't meet" — and that kindness is
  the cycle model wearing a convenience's clothes. A weekly repeat puts an entry on every seventh
  day, holidays included, and the teacher deletes the one she does not want.

  ── THE REPEAT MATERIALIZES, WHICH IS WHY THIS FORM HAS NO EDIT-THE-SERIES ──

  "Repeat weekly until 2026-12-19" writes N whole events, each with its own id and its own dates,
  and stores no rule anywhere. So moving the third one moves the third one and nothing else, which
  is the acceptance line — and it is also why editing here edits ONE instance. There is no rule to
  re-run and no exception list to keep. What the series label buys is the other direction: deleting
  all of them at once, without the teacher removing eleven rows by hand and without this file
  matching on title and kind, which would take the second *Faculty meeting* she typed herself.

  ── AND NO WARNING SURFACE FOR THE LEAD TIME ──

  The grades-due lead time is typed here, stored in the document by src/calendar.js's setLeadDays()
  and validated there. WHERE it warns is WO-6.4's *Deadlines closing in* on the glance page, which
  is the 7:40am surface and the place a lead time is worth anything. A banner of this panel's own
  would be a second answer to one question, which is the thing this repo keeps refusing — and it
  would be on a screen the teacher has already opened on purpose, which is the one place she does
  not need warning.

  ── WHAT IT DOES NOT WRITE ──

  It writes into `doc.events` through src/calendar.js and nowhere else. It does not touch
  `doc.attendance` and never could: none of the six kinds it authors is one src/attendance.js
  reads, so nothing typed here can close a period, and there is no confirm dialog on this screen
  for the same reason there is one on the other — no meeting is ever at risk.

  It reads a student's NAME and nothing else about them. No plan, no accommodation, no medical or
  behavior text reaches this panel, this list, or the `studentId` it stores — the id is a pointer,
  and every screen that resolves it asks src/supports.js before it shows anything sensitive.
*/

import { getDoc, update } from './store.js';
import { announce } from './live-region.js';
import { openModal } from './modal.js';
import { getActiveClasses } from './classes.js';
import { rosterName } from './roster.js';
import { weekdayShortDate } from './date-text.js';
import * as calendar from './calendar.js';

const MODAL_ID = 'eventsModal';
const KIND_ID = 'eventKinds';
const TITLE_ID = 'eventTitle';
const FROM_ID = 'eventFrom';
const TO_ID = 'eventTo';
const UNTIL_ID = 'eventUntil';
const REPEAT_ROW_ID = 'eventRepeatRow';
const CLASS_PICKER_ID = 'eventClassPicker';
const STUDENT_ID = 'eventStudent';
const NOTES_ID = 'eventNotes';
const LEAD_ROW_ID = 'eventLeadRow';
const LEAD_ID = 'eventLead';
const ERROR_ID = 'eventError';
const LIST_ID = 'eventList';
const SUBMIT_ID = 'eventSubmit';
const CANCEL_EDIT_ID = 'eventCancelEdit';

/* ── THE VIEW STATE ──
   Three values, none of them student data and none persisted. `chosenClassIds` is held here rather
   than read off the buttons at submit time for the reason src/days-off.js gives at the same place:
   the picker is redrawn whenever the panel opens, and a selection that lived only in the DOM would
   be a selection the next open silently changed. `editingId` is the one row this form is currently
   about — empty means it is adding. */
let chosenKind = 'grades-due';
let chosenClassIds = [];
let editingId = '';

function showError(message) {
  const el = document.getElementById(ERROR_ID);
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
  /* Also spoken, for src/days-off.js's reason: it lands in a corner of a dialog a screen-reader
     user has no reason to move to, and there is one aria-live region in this app. */
  if (message) announce(message);
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

function classNameOf(id) {
  const cls = getActiveClasses().filter((c) => c.id === id)[0];
  return cls ? cls.name : '';
}

/* Every student in the open year, `Last, First`, in that order. The document's own roster rather
   than the open class's: a conference is about a student who may not be in the class the teacher
   happens to have open, and this panel belongs to no class. rosterName() is imported rather than
   re-derived so this list and the marking screen spell a half-typed name the same way. */
function allStudents() {
  const doc = getDoc();
  return (doc && Array.isArray(doc.students) ? doc.students : [])
    .slice()
    .sort((a, b) => (rosterName(a).toLowerCase() < rosterName(b).toLowerCase() ? -1 : 1));
}

function studentNameOf(id) {
  const s = allStudents().filter((x) => x.id === id)[0];
  return s ? rosterName(s) : '';
}

/* The range in words, and a one-day event says one date rather than the same date twice. The same
   two lines src/days-off.js's rangeText() is, over the same formatter in src/date-text.js — the
   two lists sit one modal apart and must not spell `Thu, Nov 26` two ways. */
function rangeText(event) {
  const to = event.endDate && event.endDate > event.date ? event.endDate : '';
  return weekdayShortDate(event.date) + (to ? ' – ' + weekdayShortDate(to) : '');
}

/* Who it is about, in the teacher's own words. An empty `classIds` is every class, which is the
   data model's rule for every kind of event and not just for a holiday. A named id that no longer
   resolves is shown as such rather than dropped, for src/days-off.js's reason: a row that quietly
   covers less than it says is worse than an honest gap. */
function scopeText(event) {
  const ids = Array.isArray(event.classIds) ? event.classIds : [];
  const classes = !ids.length ? 'Every class'
    : ids.map((id) => classNameOf(id) || 'a class that has been deleted').join(', ');
  const who = event.studentId ? studentNameOf(event.studentId) : '';
  return classes + (who ? ' · ' + who : '');
}

/* ────────────────────────────── the form ────────────────────────────── */

/*
  WHICH KIND IS BEING AUTHORED. The pills are a `data-pill-group`, which src/shell.js already
  single-selects, and they are a row of touch targets rather than a <select> for the reason
  src/classes.js and src/days-off.js both give: a <select> on an iPad is a spinning wheel over the
  whole screen.

  The default is `grades-due` rather than the leftmost pill, and that is deliberate. It is the one
  kind on this panel with a consequence if it is missed — re-keying a term into the SIS is a
  scheduled job — and it is the kind WO-6.1 exists to make first-class. Nothing is ambiguous about
  a default that is not first: the pill that is lit is the pill that is chosen.
*/
export function setKind(kind) {
  if (!calendar.isGeneralKind(kind)) return;
  chosenKind = kind;
  showError('');
  paintKind();
}

function paintKind() {
  const group = document.getElementById(KIND_ID);
  if (group) {
    group.querySelectorAll('[data-event-kind]').forEach((btn) => {
      const on = btn.getAttribute('data-event-kind') === chosenKind;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  /* The lead time belongs to one kind, so it is on screen for one kind. A field that is always
     visible and only sometimes means anything is a field a teacher fills in for a trip. */
  const lead = document.getElementById(LEAD_ROW_ID);
  if (lead) lead.classList.toggle('hidden', chosenKind !== 'grades-due');
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
    empty.textContent = 'No classes yet. Anything you add now is about the whole year — it covers '
      + 'whatever classes you add later.';
    picker.append(empty);
    return;
  }
  /* A class chosen and since archived stops being offered, so it stops being chosen — otherwise the
     next event would silently name a class the teacher can no longer see. src/days-off.js's rule. */
  chosenClassIds = chosenClassIds.filter((id) => list.some((c) => c.id === id));
  list.forEach((cls) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const on = chosenClassIds.indexOf(cls.id) >= 0;
    btn.className = 'toggle-btn' + (on ? ' active' : '');
    btn.setAttribute('data-event-class', cls.id);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = cls.name;
    picker.append(btn);
  });
}

/* The student this event is about, or nobody. A <select> rather than the `.toggle-btn` row the
   classes get, and the departure is measured rather than stylistic: five classes make five
   buttons and a hundred and forty students make a wall. It is the same control src/roster.js uses
   for an accommodation kind, and it carries the coarse block's 44px like that one does. */
function paintStudentPicker(selected) {
  const sel = document.getElementById(STUDENT_ID);
  if (!sel) return;
  sel.textContent = '';
  const none = document.createElement('option');
  none.value = '';
  none.textContent = 'Nobody in particular';
  sel.append(none);
  allStudents().forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = rosterName(s);
    sel.append(opt);
  });
  /* A stored id whose student has since been deleted is kept as an option rather than silently
     falling back to "nobody" — an edit that quietly dropped it would be this form changing a field
     the teacher never touched. */
  if (selected && !allStudents().some((s) => s.id === selected)) {
    const gone = document.createElement('option');
    gone.value = selected;
    gone.textContent = 'a student who has been deleted';
    sel.append(gone);
  }
  sel.value = selected || '';
}

function paintLead() {
  const field = document.getElementById(LEAD_ID);
  if (field) field.value = String(calendar.leadDaysOf(getDoc()));
}

/* ────────────────────────────── the three date fields ────────────────────────────── */

/*
  A DATE FIELD, THROWN AWAY AND REBUILT — the iPadOS picker quirk, for the fifth time in this app.
  src/classes.js's termDateCommitted() carries the long version and this is not a sixth copy of the
  reasoning: a cleared `<input type="date">` on iPadOS keeps its picker's own selection, so the day
  just used cannot be re-picked until the element itself is gone. src/days-off.js, src/roster.js and
  src/assignments.js each hold their own copy of these ten lines, each pointing at that one, which
  is the convention this file follows rather than inventing a sixth home for it.
*/
function rebuildDateField(input) {
  if (!input || !input.parentNode) return null;
  const fresh = document.createElement('input');
  fresh.type = 'date';
  fresh.className = input.className;
  fresh.id = input.id;
  const label = input.getAttribute('aria-label');
  if (label) fresh.setAttribute('aria-label', label);
  const hook = input.getAttribute('data-event-date');
  if (hook) fresh.setAttribute('data-event-date', hook);
  input.replaceWith(fresh);
  return fresh;
}

function clearDates() {
  rebuildDateField(document.getElementById(FROM_ID));
  rebuildDateField(document.getElementById(TO_ID));
  rebuildDateField(document.getElementById(UNTIL_ID));
}

/*
  On `change` and never on `input`, for src/classes.js's reason: a desktop date field reports ''
  several times while a date is being typed into it, so an `input`-driven rebuild would replace the
  element under the caret on the second keystroke.

  `To` FOLLOWS `From` here as it does on the days-off form, and for the same reason — a one-day
  event is then one field. `Repeat until` does NOT follow it: an until-date equal to the start is a
  series of exactly one, which is a control that appears to do nothing, and an empty repeat field is
  the honest way to say "this happens once".
*/
export function dateCommitted(input) {
  if (!input) return;
  const which = input.getAttribute('data-event-date');
  if (!input.value) { rebuildDateField(input); return; }
  if (which !== 'from') return;
  const toEl = document.getElementById(TO_ID);
  if (!toEl) return;
  if (toEl.value && toEl.value >= input.value) return;
  toEl.value = input.value;
  showError('');
}

/* ────────────────────────────── the list ────────────────────────────── */

/*
  One row per event this panel can author, in date order, with the two ways out of it — edit, and
  remove. Built with createElement rather than as markup for the reason every list in this app is:
  the title and the notes are teacher-typed and the class and student names are SIS-pasted.

  A ROW IN A SERIES CARRIES A THIRD CONTROL, and only rows in a series do. "Remove all 12" beside a
  single conference would be a button that means nothing; beside the fourth of twelve Tuesdays it is
  the whole of the third acceptance line.
*/
function paintList() {
  const list = document.getElementById(LIST_ID);
  if (!list) return;
  list.textContent = '';
  const doc = getDoc();
  const events = doc ? calendar.generalEventsIn(doc) : [];
  if (!events.length) {
    const empty = document.createElement('div');
    empty.className = 'roster-empty';
    empty.textContent = 'Nothing here yet. Put in the dates you already know about — when grades '
      + 'are due, the conferences, the trips — and they are waiting for you on the morning they '
      + 'matter. Holidays and planned drops have their own screen, because those close a class.';
    list.append(empty);
    return;
  }
  events.forEach((event) => list.append(eventRow(event, events)));
}

function eventRow(event, all) {
  const row = document.createElement('div');
  row.className = 'roster-row' + (event.id === editingId ? ' editing' : '');

  const info = calendar.kindInfo(event.kind);
  const badge = document.createElement('span');
  /* The same word the model's table gives, so a kind reads the same here as it does anywhere else
     this app names one — src/days-off.js's badge takes it from the same place. A kind this build
     does not know prints its own raw value rather than nothing: an honest oddity beats a blank. */
  badge.className = 'event-kind';
  badge.textContent = info ? info.word : event.kind;
  row.append(badge);

  const name = document.createElement('span');
  name.className = 'roster-row-name';
  name.textContent = (event.title || (info ? info.word : 'Event')) + ' · ' + rangeText(event);
  row.append(name);

  const note = document.createElement('span');
  note.className = 'roster-row-note';
  note.textContent = scopeText(event) + (event.notes ? ' · ' + event.notes : '');
  row.append(note);

  const actions = document.createElement('div');
  actions.className = 'roster-row-actions';

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'class-action-btn';
  edit.setAttribute('data-event-edit', event.id);
  edit.textContent = 'Edit';
  edit.setAttribute('aria-label', 'Edit ' + (event.title || (info ? info.word : 'this event'))
    + ', ' + rangeText(event));
  actions.append(edit);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'class-action-btn delete';
  remove.setAttribute('data-event-remove', event.id);
  remove.textContent = 'Remove';
  remove.setAttribute('aria-label', 'Remove ' + (event.title || (info ? info.word : 'this event'))
    + ', ' + rangeText(event) + ', from the calendar');
  actions.append(remove);

  const siblings = event.seriesId
    ? all.filter((e) => e.seriesId === event.seriesId).length : 0;
  if (siblings > 1) {
    const all2 = document.createElement('button');
    all2.type = 'button';
    all2.className = 'class-action-btn delete';
    all2.setAttribute('data-event-remove-series', event.seriesId);
    all2.textContent = 'Remove all ' + siblings;
    all2.setAttribute('aria-label', 'Remove all ' + siblings + ' repeats of '
      + (event.title || (info ? info.word : 'this event')) + ' from the calendar');
    actions.append(all2);
  }

  row.append(actions);
  return row;
}

/* ────────────────────────────── opening it ────────────────────────────── */

export function openEvents(opener) {
  resetForm();
  paintList();
  paintLead();
  /* Opened through its own hook rather than data-modal-open, for src/year-picker.js's reason: the
     panel is filled from the document, and a modal that opens and then fills in flickers. */
  openModal(MODAL_ID, opener);
}

/* The form back to empty, and the dates emptied through the rebuild that makes emptying them safe
   on iPadOS. Called on open and after every write, for the reason src/days-off.js states from the
   first real sitting on hardware: a form that keeps last entry's dates is a form where the next add
   silently inherits them. */
function resetForm() {
  editingId = '';
  chosenClassIds = [];
  showError('');
  paintKind();
  paintClassPicker();
  paintStudentPicker('');
  const title = document.getElementById(TITLE_ID);
  if (title) title.value = '';
  const notes = document.getElementById(NOTES_ID);
  if (notes) notes.value = '';
  clearDates();
  paintEditingState();
}

/* What the form says it is about to do. Adding and editing are the same eight fields and two
   different sentences, so the panel says which one is on screen rather than leaving a teacher to
   infer it from a date field that filled itself in. */
function paintEditingState() {
  const submit = document.getElementById(SUBMIT_ID);
  if (submit) submit.textContent = editingId ? 'Save changes' : 'Add to the calendar';
  const cancel = document.getElementById(CANCEL_EDIT_ID);
  if (cancel) cancel.classList.toggle('hidden', !editingId);
  /* A repeat re-materializes, and an edit is about one instance — see the header. So the repeat
     field is off screen while editing rather than present and ignored, which is the shape that
     silently drops something a teacher typed. */
  const repeat = document.getElementById(REPEAT_ROW_ID);
  if (repeat) repeat.classList.toggle('hidden', !!editingId);
}

/* ────────────────────────────── writing one ────────────────────────────── */

/*
  THE SUBMIT. It reads the form, asks the model whether that can be true, and then adds, edits, or
  materializes a series. Three outcomes from one button because the teacher made one decision — the
  form already says which of the three it is about.
*/
export function createFromForm() {
  const doc = getDoc();
  if (!doc) {
    showError('There is no school year open, so there is nowhere to put an event yet.');
    return;
  }
  const titleEl = document.getElementById(TITLE_ID);
  const notesEl = document.getElementById(NOTES_ID);
  const studentEl = document.getElementById(STUDENT_ID);
  const fromEl = document.getElementById(FROM_ID);
  const toEl = document.getElementById(TO_ID);
  const untilEl = document.getElementById(UNTIL_ID);
  if (!fromEl || !toEl) return;

  const from = fromEl.value;
  const to = toEl.value;
  const until = editingId ? '' : (untilEl ? untilEl.value : '');
  const title = titleEl ? titleEl.value : '';
  const extra = {
    studentId: studentEl ? studentEl.value : '',
    notes: notesEl ? notesEl.value : '',
  };

  /* THE RULES ARE THE MODEL'S. This form shows the sentence and puts the caret back; it does not
     decide what is refusable — see the header, and src/days-off.js, which asks the same question
     through the same function. */
  const fault = until
    ? calendar.seriesFault(chosenKind, from, to, chosenClassIds, until)
    : calendar.eventFault(chosenKind, from, to, chosenClassIds);
  if (fault) {
    showError(fault.message);
    if (fault.field === 'from' && fromEl.focus) fromEl.focus();
    if (fault.field === 'to' && toEl.focus) toEl.focus();
    if (fault.field === 'until' && untilEl && untilEl.focus) untilEl.focus();
    return;
  }

  if (editingId) { saveEdit(from, to, title, extra); return; }

  if (until) {
    const made = calendar.newSeries(chosenKind, from, to, title, chosenClassIds, extra, until);
    if (!made || !made.length) return;
    update((d) => { made.forEach((one) => calendar.addEvent(d, one)); });
    afterWrite(plural(made.length, 'entry', 'entries') + ' added — '
      + (title ? title + ', ' : '') + 'weekly from ' + rangeText(made[0]) + ' to '
      + rangeText(made[made.length - 1]) + '. Each one stands on its own: move or remove any of '
      + 'them and the rest stay where they are.');
    return;
  }

  const event = calendar.newEvent(chosenKind, from, to, title, chosenClassIds, extra);
  /* Never null after a clean eventFault() — the two calls ask the same question. Read as the guard
     it is: if this file and the model ever stop agreeing, nothing is written. */
  if (!event) return;
  update((d) => { calendar.addEvent(d, event); });
  const info = calendar.kindInfo(event.kind);
  afterWrite((event.title ? event.title + ' — ' : '') + (info ? info.said : 'an event')
    + ' on ' + rangeText(event) + ', ' + scopeText(event).toLowerCase() + '.');
}

function saveEdit(from, to, title, extra) {
  const id = editingId;
  let saved = null;
  update((d) => {
    saved = calendar.updateEvent(d, id, {
      date: from, endDate: to, title: title, classIds: chosenClassIds,
      studentId: extra.studentId, notes: extra.notes,
    });
  });
  if (!saved) { showError('That event is no longer on the calendar.'); resetForm(); paintList(); return; }
  const info = calendar.kindInfo(saved.kind);
  afterWrite((saved.title ? saved.title + ' — ' : '') + (info ? info.said : 'that event')
    + ' now reads ' + rangeText(saved) + '. '
    + (saved.seriesId ? 'Only this one moved; the rest of the repeat is where it was.' : ''));
}

/*
  WHAT HAPPENS AFTER EVERY WRITE, in one place so that the add path and the two edit paths cannot
  drift apart about it.

  FOCUS GOES TO THE BUTTON, NOT BACK TO A TEXT FIELD, and on an iPad that is the difference between
  seeing what you just did and not — src/days-off.js carries the long version, reported by the owner
  from hardware on 2026-08-08: focusing a text field summons the software keyboard, which covers the
  bottom half of the screen, which is where the list this add just changed lives.
*/
function afterWrite(said) {
  resetForm();
  paintList();
  const submit = document.getElementById(SUBMIT_ID);
  if (submit) submit.focus();
  announce(said);
}

/* ────────────────────────────── editing one ────────────────────────────── */

/*
  THE ROW, LOADED BACK INTO THE FORM. The kind is shown and not changeable — src/calendar.js's
  updateEvent() refuses a kind change and says why there: it would move an event between this panel
  and the days-off one, which is a delete and a re-add said confusingly.
*/
export function editEvent(id) {
  const doc = getDoc();
  const event = doc ? calendar.findEvent(doc, id) : null;
  if (!event || calendar.isAttendanceKind(event.kind)) return;
  editingId = event.id;
  chosenKind = calendar.isGeneralKind(event.kind) ? event.kind : chosenKind;
  chosenClassIds = (Array.isArray(event.classIds) ? event.classIds : []).slice();
  showError('');
  paintKind();
  paintClassPicker();
  paintStudentPicker(event.studentId || '');

  const title = document.getElementById(TITLE_ID);
  if (title) title.value = event.title || '';
  const notes = document.getElementById(NOTES_ID);
  if (notes) notes.value = event.notes || '';
  /* The two date fields are rebuilt and then filled, rather than assigned over whatever the picker
     was last showing — the iPadOS quirk above cuts both ways, and a field that has been typed into
     and cleared keeps a selection that the value does not describe. */
  clearDates();
  const fromEl = document.getElementById(FROM_ID);
  if (fromEl) fromEl.value = event.date || '';
  const toEl = document.getElementById(TO_ID);
  if (toEl) toEl.value = event.endDate && event.endDate > event.date ? event.endDate : '';

  paintEditingState();
  paintList();
  const info = calendar.kindInfo(event.kind);
  announce('Editing ' + (event.title || (info ? info.said : 'that event')) + ', '
    + rangeText(event) + '. Change what you need and save it, or cancel to leave it as it is.');
}

export function cancelEdit() {
  const was = !!editingId;
  resetForm();
  paintList();
  if (was) announce('Left that event as it was.');
}

/* ────────────────────────────── removing ────────────────────────────── */

/*
  No confirm, and it is the same test src/days-off.js applies: an event is a line the teacher typed,
  it destroys nothing on the way out, and putting it back costs two fields. The class manager uses
  that same test to decide that archiving needs no dialog and deleting does.
*/
export function removeEvent(id) {
  const doc = getDoc();
  const event = doc ? calendar.findEvent(doc, id) : null;
  if (!event || calendar.isAttendanceKind(event.kind)) return;
  const info = calendar.kindInfo(event.kind);
  const said = (event.title || (info ? info.word : 'That event')) + ', ' + rangeText(event);

  update((d) => { calendar.removeEvent(d, id); });
  if (editingId === id) resetForm();
  showError('');
  paintList();
  announce(said + ' is off the calendar.');
}

/*
  AND THE WHOLE SERIES, which is the third acceptance line: possible without deleting each instance
  by hand. It removes by the LABEL and never by matching title and kind — that second one would take
  the *Faculty meeting* the teacher typed separately on a week the repeat had already covered, and
  she would have no way of telling which rows had gone.

  It also carries no confirm, which is a decision rather than an oversight: twelve rows is more than
  one, but every one of them is a line she typed, none of them destroys anything on the way out, and
  the button says the count before she presses it.
*/
export function removeSeries(seriesId) {
  const doc = getDoc();
  const rows = doc ? calendar.seriesIn(doc, seriesId) : [];
  if (!rows.length) return;
  const info = calendar.kindInfo(rows[0].kind);
  const said = rows[0].title || (info ? info.word : 'That event');
  let gone = 0;
  update((d) => { gone = calendar.removeSeries(d, seriesId); });
  if (editingId && rows.some((r) => r.id === editingId)) resetForm();
  showError('');
  paintList();
  announce('All ' + plural(gone, 'repeat', 'repeats') + ' of ' + said + ' are off the calendar.');
}

/* ────────────────────────────── the lead time ────────────────────────────── */

/*
  THE ONE SETTING ON THIS PANEL, and it is about the year rather than about the event being typed —
  which is why it is written the moment it is typed, like every other field in this app that edits a
  setting, and why the copy beside it in index.html says it applies to every grades-due date.

  No repaint of the row it is in: replacing the input the teacher is typing into would take the
  caret with it, which is the rule src/classes.js's editTermField() states and three other panels
  repeat. An empty field reads as 0 — `Number('')` — which is a real answer here (warn on the day
  itself) and is what a teacher who has cleared the box to retype it means for the second she is
  between numbers.
*/
export function editLeadDays(input) {
  if (!input) return;
  const n = Number(input.value);
  if (!Number.isFinite(n)) return;
  update((d) => { calendar.setLeadDays(d, n); });
}

/*
  WHAT THIS FILE DOES NOT REPAINT, and it is deliberate rather than missing: nothing behind this
  dialog reads these six kinds yet. The home cards and the registry read `no-school` and `dropped`
  and nothing else (src/calendar.js's coveringEvent()), so an entry typed here changes nothing on
  the screens underneath it — which is exactly why there is no afterCalendarChange() chained onto
  these hooks in src/shell.js and why that absence is worth a paragraph.

  WO-6.3's month grid and WO-6.4's glance page are the first readers. When either lands, its repaint
  joins the chain in src/shell.js — which is where this app states the order things happen in — and
  not an import of that module from here.
*/
