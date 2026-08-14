/*
  Hall passes, read back (WO-2.9) — the class's trips and one student's, off the append-only log.

  ── WHY THIS IS ITS OWN FILE ──

  Same seam src/attendance-report.js is on the other side of: src/attendance.js is the flow that
  runs while students walk in and every decision in it is about a clock, and nothing here is. This
  dialog is opened sitting down — at a conference, or on the afternoon somebody asks how often one
  student is out of the room — and it writes nothing at all.

  It is NOT part of src/attendance-report.js, and that is deliberate rather than tidy. That module's
  header makes a promise this one cannot make: it never imports src/supports.js, has no path to a
  student's `supports` block, and says so as the thing that keeps its printed record and its CSV
  clean in either presentation mode. This surface has to ASK about presentation mode — see below —
  so putting it in there would mean writing "this file does not import that module" directly above
  the import. Two files, two promises, both true.

  ── WHAT IT READS, AND WHY THAT MAKES ACCEPTANCE LINE 4 FREE ──

  `passes` and nothing else, through src/passes.js's own readers. A cancelled pass was taken out of
  `openPasses` and never written to `passes` (WO-2.11), so there is no cancelled trip here to filter
  out — it is absent by construction rather than by a rule this file remembers to apply. A history
  that walked both collections and marked the open ones "still out" would have needed that rule, and
  a rule like that is right on the day it is written.

  For the same reason nothing here counts minutes for itself: `minutes` was computed at the moment
  of return and stored (docs/data-model.md), the tallies come out of src/passes.js's tallyPasses(),
  and the class total under the table is the same function over the same list. A second loop in this
  file would agree with the first one on every fixture anybody wrote.

  ── NAMES, AND THE ONE SWITCH ──

  Presentation mode suppresses every name on this surface. That is WO-2.9's fifth acceptance line
  and it is a real risk rather than a formality: WO-2.11 recorded that the pass BANNER is
  deliberately not gated, on the argument that passes are issued during a live class and
  presentation mode is a parent-teacher-night tool, so the two never overlap. That argument is true
  of the banner and false of this dialog — a pass history is exactly the thing that gets opened
  beside a guardian, and it is a list of other people's children by name.

  IT ASKS `presentationMode()` RATHER THAN `supportsVisible()`, and both come from src/supports.js
  so this is not a second copy of the switch — it is the same switch, read through the accessor that
  matches the question. `supportsVisible()` asks whether a SUPPORT FIELD may be drawn, and nothing
  in this file is one: there is no accommodation, medical, plan or case-manager data here, no import
  that could produce any, and no path to `student.supports` at all. What is hidden here is a name.

  WHAT IS HIDDEN IS THE NAMES AND NOT THE NUMBERS, which is the other place this differs from a
  support surface. src/accommodation-prompt.js paints nothing whatever in presentation mode — not
  even a count — because "3 students have extended time" projected in a room of thirty narrows to
  individuals about a legally protected category. A trip to the bathroom is not that, and the
  work order asks for names to be suppressed rather than for the view to go dark: the teacher
  standing beside a guardian can still read how many trips this class has taken. The rows keep their
  counts and lose the person, and the door into one student's trips closes with the names, because
  a screen naming one student is the same disclosure one row down.
*/

import { openModal } from './modal.js';
import { announce } from './live-region.js';
/* The class the registry is on, and the avatar the roster row, the home card and the pass banner
   already wear — one answer per student across every surface (WO-1.10). */
import { getSelectedClass, initials, avatarClass } from './classes.js';
/* "Van Dyke, Mary" in a list and "Mary Van Dyke" in a sentence, off src/roster.js's own shapes
   rather than re-derived here — the reason src/attendance-report.js gives at the same import. */
import { rosterName, fullName } from './roster.js';
/* The one switch, read through the accessor that matches the question — see the header. */
import { presentationMode } from './supports.js';
/* The model: which trips, whose, on what day, and every number under this dialog. */
import * as passes from './passes.js';
import { getDoc } from './store.js';
/* How a stamp and a date READ, out of the two files that own those answers for this screen. No
   second copy: a dialog with its own opinion about what hour `…T09:12:00-04:00` says is a dialog
   that disagrees with the card the trip was watched on. */
import { clockTime, plainDate, dayAbbr } from './attendance.js';

const MODAL = 'passHistoryModal';
const BODY = 'passHistoryBody';
const TITLE = 'passHistoryTitle';

/* createElement and textContent, never innerHTML — src/attendance.js says why over the same
   strings: a student's name is pasted out of a school system and has to survive being one. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function cell(tag, className, text) {
  const node = el(tag, className, text);
  if (tag === 'th') node.setAttribute('scope', className === 'attendance-report-row-head'
    ? 'row' : 'col');
  return node;
}

/* ────────────────────────────── the words ────────────────────────────── */

/*
  HOW A NAME REACHES THIS DIALOG — every name, through one function, which is the shape
  src/supports.js's own three accessors take and for the same reason: a per-row `if` is a per-row
  `if` somebody forgets. Nothing below this line calls rosterName() or fullName() directly.

  The replacement is a WORD rather than a blank, so a row still reads as a row and the table still
  has a left-hand column. It is deliberately the same word on every row: an ordinal ("Student 3")
  would be stable, and a stable ordinal beside a class list on a wall is a name by another route.
*/
function shownName(student, list) {
  if (presentationMode()) return 'A student in this class';
  if (!student) return 'A student no longer on this roster';
  return list ? rosterName(student) : fullName(student);
}

function tripsText(n) {
  return n + (n === 1 ? ' trip' : ' trips');
}

function minutesText(n) {
  return n + (n === 1 ? ' minute out' : ' minutes out');
}

/* The subtitle both views carry: how many trips, how many minutes, and the span they fall in. The
   span is a LABEL rather than a denominator — the same distinction src/attendance-report.js draws
   about a term's date range — and it comes off the first and last entry, which is meaningful
   because `passes` is appended to in the order trips ended and never reordered. */
function caption(list) {
  const totals = passes.tallyPasses(list);
  const parts = [tripsText(totals.total), minutesText(totals.minutes)];
  if (list.length) {
    const first = passes.passDate(list[0]);
    const last = passes.passDate(list[list.length - 1]);
    if (first && last) parts.push(first === last ? plainDate(first)
      : plainDate(first) + ' – ' + plainDate(last));
  }
  return parts.join(' · ');
}

/* The strip that says why the names are gone. On the dialog rather than only in the header control,
   because a teacher who opened this expecting a roster and found none needs the reason where she is
   looking. Style-guide §1's "special state" purple, the same one src/shell.css's presentation strip
   wears — this is the same mode saying the same thing on a second surface. */
function presentationStrip() {
  return el('p', 'pass-history-quiet',
    'Presentation mode is on, so names are hidden here. The counts are this class’s; turn the mode '
      + 'off in the header to see who they belong to.');
}

/* ────────────────────────────── the class ────────────────────────────── */

/*
  ROLL CALL!'s HALL PASS SUMMARY (dashboard.html:4803), column for column: student, the three types,
  the total, and the minutes out. Sorted by total descending as it is over there — this table exists
  to answer "who is out of my room the most", and an alphabetical list answers "is this student on
  the list", which the per-student view answers better.

  WHAT IS ADDED IS THE LINE UNDER IT. Roll Call! prints no class total; WO-2.9's third acceptance
  line is *"the history view's totals match the log; a hand count of one student's passes agrees"*,
  and a total nobody can see is not a total anybody can check.

  WHAT IS NOT FILTERED IS THE TERM. Everything else read back on this screen is scoped to the open
  term, and this is not: a pass is not a term-shaped thing — it has a stamp and no term id — and
  scoping it would mean this file inventing a second date-window rule beside the one
  src/attendance.js owns. So the dialog says what it holds in as many words, and the date span in
  the subtitle is what tells a teacher which stretch of the year she is reading.
*/
export function openPassHistory(opener) {
  const body = document.getElementById(BODY);
  const title = document.getElementById(TITLE);
  if (!body) return;
  body.textContent = '';

  const cls = getSelectedClass();
  const doc = getDoc();
  if (title) title.textContent = 'Hall passes';
  if (!cls || !doc) {
    body.append(el('p', 'attendance-report-empty',
      'No class is open, so there are no hall passes to show. Open a class first.'));
    show(opener, 'No class is open.');
    return;
  }

  const list = passes.passesFor(doc, cls.id);
  const head = el('div', 'attendance-report-head');
  const who = el('div', 'attendance-report-who');
  who.append(el('div', 'attendance-report-name', cls.name));
  who.append(el('div', 'attendance-report-sub', caption(list)));
  head.append(who);
  body.append(head);
  if (presentationMode()) body.append(presentationStrip());

  if (!list.length) {
    body.append(el('p', 'attendance-report-empty',
      'No hall passes have been recorded for ' + cls.name + ' yet. A trip appears here when the '
        + 'student comes back — a pass that was cancelled never happened and is not counted.'));
    body.append(note());
    show(opener, 'No hall passes recorded yet.');
    return;
  }

  /* One row per student who has actually been out, built off the LOG rather than off the roster:
     a student who left the class in October still has October's trips, and a roster walk would
     quietly drop them out of a total the teacher is being asked to check. */
  const rows = [];
  const seen = {};
  list.forEach((entry) => {
    if (seen[entry.studentId] !== undefined) return;
    seen[entry.studentId] = true;
    const mine = passes.passesForStudent(doc, cls.id, entry.studentId);
    const student = findStudent(doc, entry.studentId);
    rows.push({
      id: entry.studentId,
      student: student,
      name: shownName(student, true),
      totals: passes.tallyPasses(mine),
    });
  });
  rows.sort((a, b) => (b.totals.total - a.totals.total)
    || a.name.localeCompare(b.name));

  body.append(el('div', 'attendance-report-label', 'By student'));
  const table = el('table', 'attendance-report-table');
  const thead = el('thead');
  const hrow = el('tr');
  hrow.append(cell('th', '', 'Student'));
  ['Bath', 'Nurse', 'Quick', 'Trips', 'Minutes'].forEach((label) => {
    hrow.append(cell('th', 'attendance-report-num', label));
  });
  thead.append(hrow);
  table.append(thead);

  const tbody = el('tbody');
  rows.forEach((row) => {
    const tr = el('tr');
    const first = cell('th', 'attendance-report-row-head', '');
    first.append(studentCell(row));
    tr.append(first);
    [row.totals.bathroom, row.totals.nurse, row.totals.quick, row.totals.total, row.totals.minutes]
      .forEach((n, i) => {
        /* A zero is a dash, as Roll Call! draws it: a column of noughts is a column that has to be
           read, and what a teacher is looking for here is the one number that is not small. The
           two totals always print, because "—" in a total column reads as missing. */
        tr.append(el('td', 'attendance-report-num', i > 2 || n ? String(n) : '—'));
      });
    tbody.append(tr);
  });
  table.append(tbody);

  /* THE LINE ACCEPTANCE LINE 3 IS ABOUT. One tally over the whole class list — not a sum of the
     rows above it, which would be this file agreeing with itself. */
  const totals = passes.tallyPasses(list);
  const tfoot = el('tfoot');
  const frow = el('tr');
  frow.append(cell('th', 'attendance-report-row-head', 'All of ' + cls.name));
  [totals.bathroom, totals.nurse, totals.quick, totals.total, totals.minutes].forEach((n) => {
    frow.append(el('td', 'attendance-report-num', String(n)));
  });
  tfoot.append(frow);
  table.append(tfoot);
  body.append(table);
  body.append(note());

  show(opener, rows.length + (rows.length === 1 ? ' student has' : ' students have')
    + ' taken a hall pass in this class.');
}

/* The student's own cell: the avatar the rest of the app gives them, and their name as a door into
   their trips. In presentation mode it is TEXT and not a button — the row behind that door names
   one student in a heading, and a door that opens onto the thing being hidden is not hidden. */
function studentCell(row) {
  if (presentationMode()) {
    const flat = el('span', 'pass-history-who', row.name);
    return flat;
  }
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pass-history-who pass-history-door';
  btn.setAttribute('data-pass-history-student', row.id);
  const face = el('div', 'avatar ' + avatarClass(row.id),
    row.student ? initials(rosterName(row.student)) : '?');
  face.setAttribute('aria-hidden', 'true');
  btn.append(face, el('span', 'pass-history-who-name', row.name));
  btn.setAttribute('aria-label', 'Every hall pass '
    + (row.student ? fullName(row.student) : 'this student') + ' has taken');
  btn.title = 'Every trip, with the times and any note';
  return btn;
}

/* ────────────────────────────── one student ────────────────────────────── */

/*
  ROLL CALL!'s HALL PASS HISTORY TABLE on its student report (dashboard.html:4718): date, type, out,
  back, minutes, and the note on its own row underneath (`.sr-pass-note`). Lifted, with one column's
  worth of difference — how the trip ENDED.

  `endedBy` is on every entry because src/passes.js stores it rather than inferring it, and this is
  the surface that exists for: *"back after 4 minutes"* and *"dismissed after 4 minutes"* are
  different facts about a student, and the second one means the teacher marked them `D` while they
  were still out rather than that they walked back in. Roll Call! says the same thing by appending
  "· Dismissed" to the note, which is the same information somewhere a reader has to parse.
*/
export function openStudentPasses(studentId, opener) {
  const body = document.getElementById(BODY);
  const title = document.getElementById(TITLE);
  if (!body) return;
  body.textContent = '';

  const cls = getSelectedClass();
  const doc = getDoc();
  if (title) title.textContent = 'Hall passes';

  /* The whole view is refused in presentation mode rather than drawn with its heading blanked: this
     one is ABOUT one student, so a page of their trips with the name taken off is still a page
     about a person sitting beside whoever is reading it. The class summary behind it is the surface
     that stays useful, and this says how to get back to it. */
  if (presentationMode()) {
    body.append(presentationStrip());
    body.append(backDoor());
    show(opener, 'Names are hidden while presentation mode is on.');
    return;
  }

  const student = cls && doc ? findStudent(doc, studentId) : null;
  if (!cls || !doc) {
    body.append(el('p', 'attendance-report-empty',
      'No class is open, so there are no hall passes to show. Open a class first.'));
    show(opener, 'No class is open.');
    return;
  }

  const list = passes.passesForStudent(doc, cls.id, studentId);
  const head = el('div', 'attendance-report-head');
  const avatar = el('div', 'avatar ' + avatarClass(studentId),
    student ? initials(rosterName(student)) : '?');
  avatar.setAttribute('aria-hidden', 'true');
  const who = el('div', 'attendance-report-who');
  who.append(el('div', 'attendance-report-name', shownName(student, false)));
  who.append(el('div', 'attendance-report-sub', cls.name + ' · ' + caption(list)));
  head.append(avatar, who);
  body.append(head);
  body.append(backDoor());

  if (!list.length) {
    body.append(el('p', 'attendance-report-empty',
      'No hall passes are recorded for this student in ' + cls.name + '.'));
    body.append(note());
    show(opener, 'No hall passes recorded for this student.');
    return;
  }

  const table = el('table', 'attendance-report-table');
  const thead = el('thead');
  const hrow = el('tr');
  hrow.append(cell('th', '', 'Date'));
  hrow.append(cell('th', '', 'Type'));
  hrow.append(cell('th', '', 'Out'));
  hrow.append(cell('th', '', 'Back'));
  hrow.append(cell('th', 'attendance-report-num', 'Minutes'));
  thead.append(hrow);
  table.append(thead);

  const tbody = el('tbody');
  list.forEach((entry) => {
    const tr = el('tr');
    const date = cell('th', 'attendance-report-row-head', '');
    const on = passes.passDate(entry);
    date.append(el('span', 'attendance-report-dow', dayAbbr(on)));
    date.append(el('span', 'attendance-report-date', plainDate(on)));
    tr.append(date);

    const kind = passes.passType(entry.type);
    const type = el('td');
    /* The row's own pass buttons' palette, worn rather than re-chosen — the same call
       src/attendance-report.js makes about the five mark colours. An unknown type from a
       hand-edited document renders its stored value with no fill, which is legible and says what is
       actually in the record. */
    type.append(el('span', 'pass-history-type' + (kind ? ' ' + kind.type : ''),
      kind ? kind.word : String(entry.type || '—')));
    tr.append(type);

    tr.append(el('td', '', clockTime(entry.out) || '—'));
    const back = el('td');
    back.append(el('span', '', clockTime(entry.back) || '—'));
    if (entry.endedBy === passes.BY_DISMISSAL) {
      back.append(el('span', 'pass-history-ended', 'dismissed'));
    }
    tr.append(back);
    tr.append(el('td', 'attendance-report-num',
      typeof entry.minutes === 'number' ? String(entry.minutes) : '—'));
    tbody.append(tr);

    /* The note on its own row under the trip it belongs to, spanning the table — Roll Call!'s
       `.sr-pass-note`, which is what the field on the banner card was built to reach (WO-2.11). */
    if (entry.note) {
      const noteRow = el('tr', 'pass-history-note-row');
      const noteCell = el('td', 'pass-history-note');
      noteCell.setAttribute('colspan', '5');
      noteCell.append(el('span', 'pass-history-note-label', 'Note: '));
      noteCell.append(document.createTextNode(entry.note));
      noteRow.append(noteCell);
      tbody.append(noteRow);
    }
  });
  table.append(tbody);
  body.append(table);
  body.append(note());

  show(opener, tripsText(list.length) + ' on screen for one student.');
}

/* The way back to the class summary. A control rather than a second door in the toolbar: this
   dialog is one surface with two readings of the same log, and closing it to reopen it is two taps
   and a lost scroll position. */
function backDoor() {
  const btn = el('button', 'class-action-btn attendance-report-door', '← All students');
  btn.type = 'button';
  btn.setAttribute('data-pass-history-all', '');
  btn.title = 'Back to every student’s trips in this class';
  return btn;
}

/*
  THE SENTENCE UNDER BOTH TABLES, and every clause of it is a rule from somewhere else in the app
  that a teacher reading a total is entitled to know:

    · a cancelled pass is not here, because it never happened (WO-2.11),
    · a student who is out RIGHT NOW is not here either, because a trip is counted when it ends —
      which is why the banner and this dialog can disagree by one and both be right,
    · and nothing on this page is attendance. A student at the bathroom was present.
*/
function note() {
  return el('p', 'attendance-report-note',
    'Every trip that ended is here, oldest first, for as long as this class has existed — a pass '
      + 'that was cancelled never happened and was never written down, and a student who is out of '
      + 'the room right now is counted when they come back. None of this is attendance: a student '
      + 'on a hall pass was present.');
}

/* A pass names a student by id and never by name (docs/data-model.md), so this is the one lookup
   this file needs — and an id that names nobody produces a row that says so rather than a blank
   one, because the trip did happen and its minutes belong in the class total. */
function findStudent(doc, id) {
  const all = doc && Array.isArray(doc.students) ? doc.students : [];
  return all.filter((s) => s && s.id === id)[0] || null;
}

/*
  OPEN IT, OR SWAP WHAT IS IN IT.

  Both views can be reached with this dialog already on screen — the class summary opens one
  student's trips, and the ← comes back — and openModal() refuses a second push of an overlay it is
  already holding, so on that path it is the content that changed and nothing else. Two things then
  have to be done by hand that an open does for free:

    · FOCUS. The control that was tapped has just been thrown away with the old table, so focus is
      on <body> and a keyboard user is outside the trap the dialog thinks it is holding. The first
      control in the new body gets it, which is the ← on the student view and the first name on the
      class one — the same place openModal() would have put it.
    · AND SAYING SO. A table swapped underneath a screen-reader user is silent otherwise. The
      sentence carries the count and never a name, so it obeys the rule the view it describes does.
*/
function show(opener, said) {
  const overlay = document.getElementById(MODAL);
  const already = !!overlay && !overlay.classList.contains('hidden');
  openModal(MODAL, opener);
  if (already) {
    const body = document.getElementById(BODY);
    const first = body ? body.querySelector('button, a[href], input, select, textarea') : null;
    if (first) first.focus({ preventScroll: true });
    announce(said);
  }
}
