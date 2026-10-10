/*
  Attendance, read back — the whole class's record for a term as a page that prints and a file that
  opens in a spreadsheet (WO-2.6), and the card a tap on one student's name opens (WO-2.53, WO-2.60).
  *(The first half said "one student's history" until WO-2.60 moved that history — the term table and
  day by day — to the student page's attendance card, src/detail.js, on the same readers.)*

  ── WHY THIS IS A SEPARATE FILE FROM THE REGISTRY ──

  src/attendance.js is the flow that runs while students walk in: every decision in it is about a
  clock. Nothing here is. These two surfaces are opened sitting down — at a guardian conference, in
  the week grades are due, with a printer or a spreadsheet at the other end — and the work order
  that asked for them says so in as many words ("it becomes urgent the first time a guardian
  conference asks *which days?*"). Two files, because the registry has no room for a screen whose
  answer is a page of paper.

  WHAT IS NOT DUPLICATED HERE, AND THIS IS THE PART TO LEAVE ALONE. Nothing in this file decides
  which meetings count, walks `doc.attendance`, tests `exception`, or asks the calendar anything.
  Every number and every row comes out of readers in src/attendance.js — classRecord() here, and
  termHistory() and termTotals() for the student page since WO-2.60 — and all three sit on ONE walk over ONE set of records
  (walkMeetings). That is WO-2.6's first acceptance line in its own terms: *"a student's history
  lists exactly the meetings counted in their percentage — the two agree"* is a statement about a
  shared source, not about two implementations landing on the same number. A second filter chain in
  this file would agree with itself on any fixture anybody wrote and disagree in November.

  The formatters come from there too — percentText(), plainDate(), numericDate(), dayAbbr() — so a
  printed page and the line above the grid it was taken from say a percentage in the same words, out
  of the same date parser. A printout that has left the building and disagrees with the screen is
  worse than no printout. *(numericDate() was called shortDate() until WO-3.20, which applied this
  paragraph's own argument one file over: the app had five functions of that name in three formats,
  and the one this file imports is the `9/8` that fits a column head. Nothing printed changed.)*

  ── WHAT A STUDENT IS, TO THIS FILE ──

  `{ id, first, last, name, marks, totals }`, and that is the whole of it. classRecord() hands over
  the names a class is marked under and the marks against them; NOTHING else about a student can
  reach this file, because nothing else is on the shape it is given. There is no import of
  src/supports.js here and there is no path to `student.supports` — no accommodation, no medical
  need, no IEP or 504 or behavior plan, no case manager, no guardian and no counselor.

  THAT IS ABSOLUTE AND IT IS NOT A PRESENTATION-MODE RULE. WO-2.6's fourth acceptance line is
  "neither surface emits accommodation, medical, or plan data", full stop — in either mode, with the
  toggle in either position, on the page and in the file. An implementation that read those fields
  and hid them behind the one visibility switch in src/supports.js would satisfy the work order's
  third deliverable ("presentation-mode safe") and still be a one-tap disclosure the day somebody
  flips the switch back. So the data never arrives, which makes the presentation-mode line trivially
  true instead of conditionally true — and it is why this file does not import that module at all.
  A grep for its switch is the audit, and this file must never appear in the answer.
  docs/data-model.md § "Accommodations" and src/supports.js's own header are the rule; the teacher's
  JSON backup is the single exception in this app and its UI says so in words.

  AND NEITHER WO-2.26 NOR WO-2.60 SPENT ANY OF THAT. From WO-2.26 until WO-2.60 the history dialog
  carried a hall-pass count for its student, drawn by src/pass-history.js and appended here without
  being looked inside — the arrangement src/assignments.js has with src/accommodation-prompt.js. WO-2.60
  took the count off (the student page behind the dialog's one door shows every trip), and with it
  the one import of a screen this file had; what is left imports models and shared components only.

  ── THE ONE THING IN HERE THAT WRITES (WO-2.53) ──

  One block, the body of the name tap's card, about the one day the registry accepts writes on: the mark
  in words with its time, the note field when there is a mark to hang one on, and the un-confirm when
  there is a record to put back. It is the row detail panel WO-2.10 built, moved — not a new
  capability. The panel it came from was hollow on the state every row is in at the start of every
  period (the note and the un-confirm were both gated on a confirmed mark), so what it showed
  twenty-six times before the first student was marked was the name, the date and the counts the
  screen behind it was already showing.

  SINCE WO-2.60 IT IS THE WHOLE DIALOG, with one door under it. The term table and day by day that
  sat under it moved to the student page's attendance card (src/detail.js), read through the same
  three readers, so the figures did not change when they moved. Its date is editDate()'s — asked for
  through editableMark() — which is the only day the registry has ever let a note be typed on, so a
  note on a PAST mark still wants that column's ✏ first, exactly as before. When there is no such day
  the block is drawn READ-ONLY — that day's mark and a sentence saying what would open it, out of
  readOnlyMark() — with no input and no hook, so there is still no path through this file that changes
  a mark on it.

  ── THE TWO DOORS ──

  A student's own name in the grid opens today's card for them (the dialog's id still says history,
  which is what it held from WO-2.6 to WO-2.60; renaming it would move every hook and harness read for
  a word). 🖨 Record in the registry's toolbar opens the class's record, which is one surface carrying
  two outputs: Print, and a CSV. Both doors are on the registry because that is the screen a teacher
  is already on when either question comes up.

  ── PRINTING, AND WHY IT IS AN ATTRIBUTE ON <body> ──

  Lifted from Roll Call!'s printStudentReport() (dashboard.html): `data-attendance-print` goes on
  <body> and the @media print block at the foot of src/attendance.css hides everything on the page
  EXCEPT the open record dialog, and only while the attribute is there.

  WHO PUTS IT THERE IS src/print-gate.js AND IT IS NOT A TIMER ANY MORE (WO-2.25). This file used to
  set the attribute, call window.print() and take it off 500ms later, on the reasoning that
  window.print() blocks while the browser's dialog is up. It does not always — the owner printed the
  whole app twice over on 2026-08-12 — so the gate is answered from a `beforeprint` listener at the
  moment the browser serialises the page, by asking whether the record dialog is on screen. The
  reasoning is written out once, over there; this file hands in its attribute and its predicate.

  The attribute is what keeps Ctrl+P honest. A print block that hid the app whenever it felt like it
  would answer a keyboard print on any other screen with a blank sheet of paper, which is the kind
  of thing nobody finds until the day it matters. Planbook has no default print surface — Roll Call!
  prints its registry, and cannot, because Planbook's registry is a six-day WINDOW rather than the
  term (src/attendance.js's header says why). So this is the same idiom with the default half left
  out on purpose.

  ── WHAT "FITS A CLASS ON A PAGE" MEANS HERE ──

  A class fits DOWN a page: one row per student, and a roster of ordinary size lands inside one
  sheet. It is the term's meetings that do not fit ACROSS one — a quarter is forty-odd recorded
  meetings and no arrangement of them and a name column fits a portrait page. So the day-by-day
  table is drawn in SLICES of DATES_PER_SLICE columns, each one repeating the student column and
  starting on a fresh page, and the summary table above them — every student's counts and their
  percentage — is the page a conference actually needs and always fits on its own.

  The slices are on screen as well as on paper, deliberately: what the dialog shows is what comes
  out of the printer, and a preview that quietly reflows is a preview.

  SINCE WO-2.59 THE SUMMARY AND THE SLICES ARE TWO TABS, not one page with the summary above, and
  Print prints the tab on screen — so the summary alone is one sheet for a conference. The slices
  and their twenty-four are unchanged. See § the class's record below.
*/

import { openModal } from './modal.js';
import { announce } from './live-region.js';
/* The open class. The avatar and the term list went with the history at WO-2.60: today's card
   carries no face and no term table — the student page does, from the same imports. */
import { getSelectedClass } from './classes.js';
/* "Mary Van Dyke" in a sentence, off the same shape src/roster.js owns. */
import { fullName } from './roster.js';
/* The one way a file reaches the browser in this app (src/backup.js). Imported rather than copied:
   the revoke delay and the one-download-per-tap rule were both paid for on the owner's own iPad,
   and a second copy of those six lines here would be a second thing to get right. */
import { handToBrowser } from './backup.js';
/* The print gate, for the same reason and with the same scar behind it (WO-2.25): this file used to
   carry its own copy of the mechanism, and that copy is how one bug came to live in three places. */
import { registerPrintGate } from './print-gate.js';
/*
  The ledger, and every number on both surfaces.

  READ-ONLY UNTIL WO-2.53, AND NO LONGER — THE NAME TAP'S CARD WRITES. Exactly three writers reach the
  document from this file's surfaces, all of them in src/attendance.js, which is the module that
  owns the ledger: setNote(), unconfirmStudent() and — since WO-2.55 — setMarkTime(). None is
  imported here and none is called here. What this file paints is the elements that carry their hooks —
  `data-attendance-note` + `data-attendance-note-date`, `data-attendance-time` +
  `data-attendance-time-date`, and `data-attendance-unconfirm` — and
  src/shell.js's one delegated listener routes them, exactly as it did while those elements were on
  the registry row. So there is still no second writer, no second hook and no third gate; what moved
  is where the controls are drawn.

  AND NOTHING HERE RECOMPUTES WHAT THEY WROTE. editableMark() is the one reader WO-2.53 added and it
  is the whole of what this file knows about a writable day: the date the writers default to, the
  reading in that student's cell, its time and note, and the booleans that decide which of the cases
  the block draws. readOnlyMark() (WO-2.60) is its other half — which refusal, on which day, and the
  mark there was — out of the same private gate. The gate stays in the module with the writers in it:
  a dialog asking writableDate() for itself would be a second opinion about what is writable, held by
  a file that cannot see the ledger.

  The class's record — the print surface and the CSV — is still read-only, all of it. There is no
  path through openRecord(), recordCsv() or printRecord() that changes a mark.
*/
import {
  MARKS, UNCONFIRMED, classRecord, editableMark, readOnlyMark,
  percentText, plainDate, numericDate, dayAbbr, spokenDate, clockTime, wallClock, todayISO,
} from './attendance.js';

const HISTORY_MODAL = 'attendanceHistoryModal';
const HISTORY_BODY = 'attendanceHistoryBody';
const HISTORY_TITLE = 'attendanceHistoryTitle';
const RECORD_MODAL = 'attendanceRecordModal';
const RECORD_BODY = 'attendanceRecordBody';

/* The attribute the @media print block keys on. One string, named once, because the stylesheet and
   this file have to agree about it and a typo would print a blank page rather than throw.

   IT STAYS THIS SURFACE'S OWN. `data-detail-print` re-shows #detailView and `data-grades-print`
   re-shows #gradesRecordModal; either one borrowed here would hide the app and reveal something
   that is not on screen — a blank sheet by a different route. One mechanism, one gate per
   surface. */
const PRINT_ATTR = 'data-attendance-print';

/* The words #printHeader carries for the record that is open (WO-8.4), set by openRecord() and read
   by src/print-gate.js at `beforeprint`. Class, term, range and count — the same sentences the
   dialog's own head prints, and nothing about any one student. */
let printHead = null;

/*
  HOW MANY DATE COLUMNS GO ON ONE PRINTED PAGE, and the arithmetic is the whole of it.

  A4 is the narrower of the two papers this will meet — 210mm against Letter's 216 — and the print
  block sets a 10mm margin, so 190mm is what a page has. The student column is 45mm (a surname and a
  first name at 8pt) and a date column is 6mm (two digits over a letter). 45 + 24 x 6 = 189mm.

  So twenty-four, and it is a floor rather than a target: a term with fewer meetings than this draws
  one slice and no page break, which is most of the reason a teacher prints anything mid-term.
*/
const DATES_PER_SLICE = 24;

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

/* ────────────────────────────── the sentences both surfaces share ──────────────────────────────

   One place, so the dialog's subtitle, the printed header and the CSV's file name cannot come to
   disagree about which term a page is of. */

/* "September 8, 2026 – November 7, 2026", or the one date there is, or nothing at all.

   THE RANGE IS A LABEL AND NOT THE DENOMINATOR. Everything in this app counts recorded meetings and
   never calendar days (docs/data-model.md), so this says which days the page covers and the count
   beside it says what the percentages are over. An undated term falls back to the first and last
   meeting there actually was, because a header with an empty range on it says less than one that
   says what it holds. */
function rangeText(record) {
  if (!record.start && !record.end) return '';
  if (!record.start || !record.end) return plainDate(record.start || record.end);
  if (record.start === record.end) return plainDate(record.start);
  return plainDate(record.start) + ' – ' + plainDate(record.end);
}

function meetingsText(n) {
  return n + ' recorded meeting' + (n === 1 ? '' : 's');
}

/* Class, term, range, count — the four things WO-2.6's third acceptance line asks the printed
   header to carry, in one sentence that serves the record's own head and its printed one. */
function recordCaption(record) {
  const parts = [];
  parts.push(record.termLabel ? record.termLabel : 'All recorded meetings');
  if (!record.dated && record.termLabel) parts[0] = record.termLabel + ' (term dates not set)';
  const range = rangeText(record);
  if (range) parts.push(range);
  parts.push(meetingsText(record.dates.length));
  return parts.join(' · ');
}

/* ────────────────────────────── one student, today ────────────────────────────── */

/*
  WAS ROLL CALL!'s STUDENT REPORT, AND IS TODAY'S CARD SINCE WO-2.60. From WO-2.6 this dialog was
  that app's openStudentModal() trimmed — avatar and name, a rate badge, a term-by-term table and the
  days as a table with a running percentage. WO-2.60 moved the two tables to the student page's
  attendance card, where that shape now lives (src/detail.js), and left this dialog the one day.

  IT IS TWO FUNCTIONS SINCE WO-2.53 AND THE SPLIT IS WHAT MAKES THE UN-CONFIRM HONEST. Opening is
  this one: remember whose dialog it is, draw it, and hand it to src/modal.js with its opener.
  Drawing is paintHistory() below, which is called again — with no openModal() and no focus dance —
  when a write made INSIDE the dialog goes the card stale. See the `window` click listener below.
*/
let historyFor = '';       /* whose history the dialog is showing, or '' — one at a time, and it is
                              read only to redraw the dialog that is already on screen. Not
                              persisted, not student data leaving the roster: an id this module was
                              handed one tap ago. */

export function openHistory(studentId, opener) {
  historyFor = studentId || '';
  if (!paintHistory()) return;
  openModal(HISTORY_MODAL, opener);
}

/* Everything inside #attendanceHistoryBody, and the dialog's title, from the open document. Returns
   false only when the host element is missing, which is a page this module cannot draw on at all.

   TODAY'S CARD, AND NOTHING ELSE (WO-2.60, the owner's ruling of 2026-10-09). A tap on a name during
   roll call is "came in at 8:20", "left for the nurse", "un-confirm him" — standing up, one student,
   today. Until that day this dialog put the write block fourth, under a rate badge, a door and a
   pass count, and over a term table, a row for every meeting and a paragraph; those are what a
   conference reads sitting down, and they moved to the student page's attendance card
   (src/detail.js attendanceCard()), which the one door below opens. So the body is the write block —
   or, on a day nothing can be written to, the same block read-only — and the door. No avatar, no
   percentage, no table: the student's name is the title. */
function paintHistory() {
  const studentId = historyFor;
  const body = document.getElementById(HISTORY_BODY);
  if (!body) return false;
  body.textContent = '';
  const title = document.getElementById(HISTORY_TITLE);

  const cls = getSelectedClass();
  const record = classRecord();
  const student = record ? record.students.filter((s) => s.id === studentId)[0] : null;
  if (!cls || !record || !student) {
    if (title) title.textContent = 'Attendance';
    body.append(el('p', 'attendance-report-empty',
      'That student is not on this class’s roster any more, so there is nothing to show.'));
    return true;
  }

  const person = fullName({ first: student.first, last: student.last });
  if (title) title.textContent = person;

  /* ── the one day this card is about (WO-2.53, and read-only since WO-2.60) ── */
  const write = writeBlock(student, person, cls) || readOnlyBlock(student, cls);
  if (write) body.append(write);

  /*
    ONE DOOR, TO THE PAGE THE HISTORY WENT TO (WO-2.60). It carries `data-student-detail` — the hook
    the row's › and the score grid's names carry — so it is a third way into one room rather than a
    room of its own, and src/shell.js closes this dialog and swaps the view; nothing about that screen
    is imported here. The "Grades for …" door that stood under the badge until WO-2.60 is this one:
    the page behind it shows the grade, both attendance tables and every hall pass, so a second door
    or a pass count here would be two answers to the question the page already answers.

    THE WORDS ARE THE DRAWING'S AND WERE NOT RULED ON AT DISPATCH — "Attendance history and grades
    →", because that is where the history went and a teacher looking for it reads the first word.
  */
  const actions = el('div', 'modal-actions');
  const toPage = el('button', 'class-action-btn', 'Attendance history and grades →');
  toPage.type = 'button';
  toPage.setAttribute('data-student-detail', student.id);
  toPage.title = person + '’s page: attendance by term and day by day, grades and hall passes';
  actions.append(toPage);
  body.append(actions);

  return true;
}

/*
  THE WRITE BLOCK, AND THE FOUR CASES IT CARRIES ARE THE FOUR THE ROW PANEL CARRIED (WO-2.10, moved
  by WO-2.53). WO-2.55 put a time field beside the mark for a `T` or a `D` — or, on a `D` that
  closed a hall pass, one sentence saying the pass owns that time — and added no case: the mark in words with its time; the note field when there is a mark
  for a note to live on; the un-confirm when there is a record to put a student back on; and the two
  hint sentences for the two ways there is nothing to type into — a student nobody has confirmed yet,
  and a confirmed-present student, who HAS no entry because present is stored as no mark at all. A
  field there would silently discard what was typed into it, which is the stored-`P` trap arriving
  through a text box, so the block says why instead.

  IT DECIDES NONE OF THAT. editableMark() answers with the date, the reading, the time, the note and
  the two booleans, out of the module that owns the writers; this function words and lays out the
  answer. `null` means there is no day to write on — a past column still locked, a day the class did
  not meet, a covered day, a day outside every term — and then readOnlyBlock() below draws the card
  instead, which carries no input and no hook, so there is still no path through this file that
  changes a mark on such a day. (This said "a window paged off the edit date" until WO-2.60; it was
  never one — editDate() does not move when the window pages, and the block names the day it writes
  on.)

  `tabindex="-1"` ON THE BOX IS FOR THE UN-CONFIRM. Pressing it destroys the control that was
  pressed: the mark goes back to `?`, so the block redraws without the button and without the note
  field, and focus would land on <body> — outside the dialog, for a keyboard user, with the modal's
  Tab trap the only way back in. So the redraw puts focus on the box itself, which is where the thing
  that just changed is. It is not in the Tab order (src/modal.js's focusablesIn() skips
  `[tabindex="-1"]`), so nothing about tabbing through the dialog changes.
*/
function writeBlock(student, person, cls) {
  const now = editableMark(student.id);
  if (!now) return null;

  const box = el('div', 'attendance-report-write');
  box.setAttribute('tabindex', '-1');
  box.setAttribute('data-attendance-write', student.id);
  box.append(el('div', 'attendance-report-write-day', dayLine(now.date, cls)));

  const says = el('span', 'attendance-report-mark attendance-report-write-mark '
    + 'attendance-cell-' + (now.code === UNCONFIRMED ? 'untaken' : now.code),
    markSays(now));
  box.append(says);

  /* THE TIME (WO-2.55), for the tardy nobody could catch in the moment. A native time input, so the
     iPad gives the teacher its own wheel and a laptop its own segments; empty on a past day that was
     never stamped, because the tap stamps only on today's column. The date rides on the element for
     the note field's reason below. editableMark() decides whether it is offered; this only words it. */
  if (now.canTime) {
    const time = document.createElement('input');
    time.type = 'time';
    time.className = 'attendance-report-write-time';
    time.setAttribute('data-attendance-time', student.id);
    time.setAttribute('data-attendance-time-date', now.date);
    time.value = wallClock(now.at);
    time.setAttribute('aria-label', 'Time of ' + person + '’s '
      + wordFor(now.code).toLowerCase() + ' mark on ' + spokenDate(now.date));
    box.append(time);
  } else if (now.timeLocked) {
    /* A dismissal that closed a hall pass. The pass log closed on this same stamp, and a second
       clock for one dismissal would disagree with it — so the time is shown and not offered. */
    box.append(el('span', 'attendance-report-write-hint',
      'This dismissal closed a hall pass, and the pass owns its time'
        + (now.at ? ', ' + clockTime(now.at) : '') + ' — one clock reading for both, so it is not '
        + 'edited here.'));
  }

  if (now.canNote) {
    const field = document.createElement('input');
    field.type = 'text';
    field.className = 'attendance-report-write-note';
    /* The date rides on the element for the reason a cell's does on the registry: which day a
       keystroke lands on must not be a question two files can answer differently. */
    field.setAttribute('data-attendance-note', student.id);
    field.setAttribute('data-attendance-note-date', now.date);
    field.value = now.note;
    field.placeholder = 'Add a note — missed the bus, left for the nurse…';
    field.setAttribute('aria-label', 'Note on ' + person + '’s mark for ' + spokenDate(now.date));
    box.append(field);
  } else {
    box.append(el('span', 'attendance-report-write-hint', now.code === UNCONFIRMED
      ? 'Nobody has confirmed this student yet. Tap their question mark once for present.'
      : 'Nothing to note on a present mark. Change the mark on the grid and a note field '
        + 'appears here.'));
  }

  if (now.canUnconfirm) {
    const back = el('button', 'class-action-btn', 'Un-confirm');
    back.type = 'button';
    back.setAttribute('data-attendance-unconfirm', student.id);
    back.title = 'Put this student back to a question mark, as if nobody had looked at them yet.';
    box.append(back);
  }
  return box;
}

/* "Today · Friday, October 9 · P2 · English III" — the day the card is about and the class, because
   the dialog's title is now the student's name and nothing else on it says which class this is. */
function dayLine(date, cls) {
  return (date === todayISO() ? 'Today · ' : '') + spokenDate(date) + ' · ' + cls.name;
}

/*
  THE CARD ON A DAY IT CANNOT WRITE TO (WO-2.60, ruling 3). Until that work order the dialog drew no
  block at all on such a day and the term tables filled the space; with the tables gone, an empty
  card would be a dialog about nothing. So it shows the mark on the day the screen is about,
  read-only, and says what would open it.

  THE REASON IS NOT DECIDED HERE. readOnlyMark() in src/attendance.js runs the same five tests
  editableMark() does — one private gate, two readers — and hands back which one refused; this
  function owns the sentence for each and nothing else. A test written here (is the day past? is it
  covered?) would be a second opinion about what is writable, held by a file that cannot see the
  ledger, which is the reason the gate was put beside the writers in the first place.

  IT CARRIES NO INPUT AND NO HOOK. `data-attendance-readonly` names the reason for a reader and is
  routed by nothing; there is no `data-attendance-write` on it, so the un-confirm repaint below never
  focuses it, and no `tabindex`, because nothing on it changes under the teacher.

  THE SENTENCES. The drawing worded the locked day only; the other three are this build's, out of
  the reasons and in the words the registry's own note row and controls already use — "The class met
  after all", the 📅 on a covered column, Terms — so the card points at a control the teacher can see.
  None was ruled on at dispatch. A dropped, covered or off-term day has no record of a mark, so it
  draws no chip: there is no mark to show.
*/
const READ_ONLY_SAYS = {
  locked: 'This day is locked. Press its ✏ on the grid to change the mark or add a note.',
  'did-not-meet': 'The class didn’t meet this day, so there is no mark to show. Tap “The class '
    + 'met after all” above the grid if it did.',
  covered: 'This day is off on the calendar, so nobody has a mark on it. Tap the 📅 on its column '
    + 'to see why.',
  'off-term': 'This day is outside every term this class has, so nothing can be marked on it. Add '
    + 'a term or widen one in Terms to open it.',
};

function readOnlyBlock(student, cls) {
  const was = readOnlyMark(student.id);
  if (!was) return null;
  const box = el('div', 'attendance-report-write');
  box.setAttribute('data-attendance-readonly', was.reason);
  box.append(el('div', 'attendance-report-write-day', dayLine(was.date, cls)));
  if (was.code) {
    box.append(el('span', 'attendance-report-mark attendance-report-write-mark '
      + 'attendance-cell-' + (was.code === UNCONFIRMED ? 'untaken' : was.code), markSays(was)));
  }
  box.append(el('span', 'attendance-report-write-hint', READ_ONLY_SAYS[was.reason] || ''));
  return box;
}

/* The mark in words with its time — `Tardy at 8:20 AM` — for the chip above and for the listener
   below that keeps it in step with the time field. */
function markSays(now) {
  return wordFor(now.code) + (now.at ? ' at ' + clockTime(now.at) : '');
}

/*
  THE CHIP FOLLOWS THE TIME FIELD (WO-2.55), and it is the one thing in the dialog that does.
  src/shell.js routes the write on `input` and `change` from `document`; this runs after it for the
  reason the un-confirm listener below gives for being on `window`. It sets ONE text node — the
  chip's — from editableMark(), and never redraws the block: the field it would replace is the one
  under the teacher's thumb, with the iOS wheel open on it.
*/
function followTime(e) {
  if (!historyFor || !e.target || !e.target.closest) return;
  const field = e.target.closest('[data-attendance-time]');
  const modal = document.getElementById(HISTORY_MODAL);
  if (!field || !modal || !modal.contains(field)) return;
  const now = editableMark(historyFor);
  const chip = modal.querySelector('.attendance-report-write-mark');
  if (now && chip) chip.textContent = markSays(now);
}
window.addEventListener('input', followTime);
window.addEventListener('change', followTime);

/*
  AND THE CARD AN UN-CONFIRM MADE INSIDE IT GOES STALE.

  src/attendance.js repaints the registry behind this dialog on every write, and src/shell.js redraws
  the home cards after it — that chain is untouched and it is exactly why this listener exists. The
  grid visibly updating under the overlay looks like the whole answer and is not: the card's chip,
  its note field and the Un-confirm itself are all drawn from the same ledger, and all three are
  wrong the moment a student goes back to `?`. (Until WO-2.60 it was four figures — the badge, two
  table rows and the day-by-day table — which are the student page's to draw now, and that page is
  drawn fresh on arrival.)

  IT LISTENS ON `window`, WHICH IS NOT AN ACCIDENT AND IS THE ONLY DETAIL HERE WORTH ARGUING. The
  write is routed by the one delegated listener in src/shell.js, which is on `document`; a listener
  registered here on `document` would run BEFORE it, because src/shell.js imports this module and
  module-scope listeners register in import order — so it would redraw the dialog from the document
  as it was before the write, and look like a repaint that does not work. `window` is the last object
  in a bubbling event's propagation path, after every `document` listener whatever order they were
  added in, so this always runs after the writer. It writes nothing itself: one guard, one repaint.

  THE NOTE FIELD DELIBERATELY DOES NOT COME THROUGH HERE. `input` is a different event and there is
  no listener for it: re-rendering the dialog on a keystroke would replace the <input> being typed
  into and take the caret and the software keyboard with it. src/attendance.js's setNote() carries
  that reasoning at the writer, and this is the seam it is about.
*/
window.addEventListener('click', (e) => {
  if (!historyFor || !e.target || !e.target.closest) return;
  const modal = document.getElementById(HISTORY_MODAL);
  if (!modal || modal.classList.contains('hidden')) return;
  const back = e.target.closest('[data-attendance-unconfirm]');
  if (!back || !modal.contains(back)) return;
  paintHistory();
  const box = modal.querySelector('[data-attendance-write]');
  if (box && typeof box.focus === 'function') box.focus({ preventScroll: true });
});

/* `U` is deliberately not in MARKS — it is not a sixth code to a teacher — and it is the one reading
   the write block can be handed that no day-by-day table ever sees, because the history rows fold it
   into an absence on the way out of the ledger. Worded the same way src/attendance.js words
   it for a cell's accessible name, so the block and the grid behind it say one thing. */
function wordFor(code) {
  if (code === UNCONFIRMED) return 'Not confirmed';
  const known = MARKS.filter((m) => m.code === code)[0];
  return known ? known.word : code;
}

function totalsRow(label, totals, open) {
  const tr = el('tr', open ? 'attendance-report-open' : '');
  tr.append(cell('th', 'attendance-report-row-head', label));
  MARKS.forEach((mark) => tr.append(el('td', 'attendance-report-num', String(totals[mark.code]))));
  tr.append(el('td', 'attendance-report-num', String(totals.meetings)));
  tr.append(el('td', 'attendance-report-num', percentText(totals)));
  return tr;
}

/* ────────────────────────────── the class's record ────────────────────────────── */

/*
  TWO PARTS, ONE AT A TIME (WO-2.59, the owner's ruling of 2026-10-09). The record is two tabs under
  its head — By student, the summary a conference asks for, and Day by day, the slices of twenty-four
  meetings — and the dialog DRAWS one part at a time rather than hiding the other. That is what makes
  "Print prints the tab on screen" a property of the page rather than of a print rule: the part that
  is not showing is not in the dialog, so there is nothing for @media print to leave behind, and the
  dialog stays the print preview WO-2.6 built it to be. #printHeader's title names the part.

  DOWNLOAD CSV DOES NOT FOLLOW THE TAB, and that is the other half of the same ruling. recordCsv()
  below is handed classRecord() and nothing about which tab is up; it writes both parts, byte for
  byte what it wrote before there were tabs. A CSV is data, not a preview.

  THE TAB IS THIS MODULE'S OWN STATE, put back to the first on every open and never stored — no
  `localStorage`, no field on the document. A remembered tab is a dialog that opens on Day by day
  for a teacher who does not recall leaving it there, which is the remembered-calendar-filter defect
  CLAUDE.md refuses, one screen over. By student opens first because it is the shorter part and the
  one a conference asks for; the mockup drew it that way and the order was not ruled on at dispatch.
*/
const RECORD_PARTS = [
  { id: 'students', label: 'By student' },
  { id: 'days', label: 'Day by day' },
];
let recordPart = RECORD_PARTS[0].id;
/* Whether the dialog drew the tabs at all — it does not when there is no class or nobody on the
   roster, and then the printed title names no part. Read by headOfRecord() at `beforeprint`. */
let recordParted = false;

function partOf(id) {
  return RECORD_PARTS.filter((part) => part.id === id)[0] || null;
}

export function openRecord(opener) {
  recordPart = RECORD_PARTS[0].id;
  if (!paintRecord()) return;
  openModal(RECORD_MODAL, opener);
}

/* A tab tapped. Routed from src/shell.js's delegated listener on `data-attendance-record-part`, a
   hook and not a print gate (src/print-gate.js's invariant). The repaint replaces the button that was
   pressed, so focus goes to its replacement — otherwise it would land on <body>, outside the dialog's
   Tab trap. Returns false, and changes nothing, for a part this module does not have or a dialog that
   is not up. */
export function showRecordPart(id) {
  if (!partOf(id) || !recordOnScreen()) return false;
  recordPart = id;
  paintRecord();
  const tab = document.querySelector('#' + RECORD_MODAL
    + ' [data-attendance-record-part="' + id + '"]');
  if (tab && typeof tab.focus === 'function') tab.focus({ preventScroll: true });
  return true;
}

/* Everything inside #attendanceRecordBody, from the open document and the tab on screen. Returns
   false only when the host element is missing. */
function paintRecord() {
  const body = document.getElementById(RECORD_BODY);
  if (!body) return false;
  body.textContent = '';
  recordParted = false;

  const record = classRecord();
  /* What #printHeader says when this dialog prints — taken now, from the record the dialog is
     drawn from, so the band and the page under it are one reading of the ledger. The print DATE and
     the PART are not in it: both are asked at the moment of printing (headOfRecord() below). */
  printHead = record ? {
    title: 'Attendance record',
    subject: record.className,
    lines: [recordCaption(record)],
    brief: record.termLabel,
  } : null;
  if (!record) {
    body.append(el('p', 'attendance-report-empty',
      'No class is open, so there is no record to print. Open a class first.'));
    return true;
  }

  /* THE PRINTED HEADER, and it is the same element on screen. Class, term, date range and the
     count of recorded meetings, plus the day it was printed — which is what makes a sheet found in
     a folder next June mean anything at all.

     HEARD AND OVERRULED FOR PRINT (WO-8.4, the owner's ruling of 2026-09-21). The argument above —
     one element, so the screen and the sheet cannot say two things — is sound, and it still governs
     the SCREEN: this head is what the dialog shows. On paper it is hidden under this surface's gate
     (src/attendance.css), and the sheet is titled instead by the one shared #printHeader the style
     guide names, laid out the same way on all four printable surfaces. What keeps the two from
     saying different things is that both are built from the same sentences in this file —
     recordCaption() below and in printHead — rather than that they are one element. */
  const head = el('div', 'attendance-report-head attendance-report-print-head');
  const who = el('div', 'attendance-report-who');
  who.append(el('div', 'attendance-report-name', record.className));
  who.append(el('div', 'attendance-report-sub', recordCaption(record)));
  who.append(el('div', 'attendance-report-sub',
    'Printed ' + plainDate(todayISO()) + ' · Planbook'));
  head.append(who);
  body.append(head);

  if (!record.students.length) {
    body.append(el('p', 'attendance-report-empty',
      'There is nobody on this class’s roster yet, so the record is empty. Paste the roster in '
        + 'and every student appears here.'));
    return true;
  }

  /* ── the tabs, and the one part they show ──
     The section labels that used to head each part ("Attendance by student", "Day by day") are the
     tab names now; on paper the part is named in #printHeader's title instead. */
  recordParted = true;
  body.append(partTabs());
  const part = el('div', 'attendance-report-part');
  part.id = 'attendanceRecordPart';
  part.setAttribute('role', 'tabpanel');
  part.setAttribute('aria-labelledby', 'attendanceRecordTab-' + recordPart);
  part.setAttribute('data-attendance-record-shown', recordPart);
  if (recordPart === 'days') {
    /* ── day by day, in slices — and nothing else in this wrapper, because the print block's
       first-child rule is what keeps the first slice on page one ── */
    if (!record.dates.length) {
      part.append(el('p', 'attendance-report-empty',
        'No meetings have been recorded in this term yet, so there is nothing to lay out day by '
          + 'day.'));
    } else {
      for (let from = 0; from < record.dates.length; from += DATES_PER_SLICE) {
        const dates = record.dates.slice(from, from + DATES_PER_SLICE);
        part.append(slice(record, dates, from, record.dates.length));
      }
    }
  } else {
    /* ── the summary: one row per student, and the page a conference needs ── */
    const summary = el('table', 'attendance-report-table');
    const shead = el('thead');
    const srow = el('tr');
    srow.append(cell('th', '', 'Student'));
    MARKS.forEach((mark) => srow.append(cell('th', 'attendance-report-num', mark.code)));
    srow.append(cell('th', 'attendance-report-num', 'Meetings'));
    srow.append(cell('th', 'attendance-report-num', 'Attendance'));
    shead.append(srow);
    summary.append(shead);
    const sbody = el('tbody');
    record.students.forEach((student) => {
      sbody.append(totalsRow(student.name, student.totals, false));
    });
    summary.append(sbody);
    part.append(summary);
  }
  body.append(part);

  body.append(el('p', 'attendance-report-note',
    'This is attendance and nothing else: names, marks and the dates the class actually met. '
      + 'Nothing from a student’s support details is on this page or in the CSV, in either '
      + 'mode — those live on the roster and go nowhere but your own backup file.'));
  return true;
}

/* The strip. It wears the class screen switcher's `.screen-nav` as shipped (src/assignments.css),
   so a teacher who knows one segmented control knows both; `.attendance-report-tabs` and
   `.attendance-report-tab` are src/attendance.css's names for the spacing and the coarse floor. */
function partTabs() {
  const nav = el('nav', 'screen-nav attendance-report-tabs');
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', 'Which part of the record');
  RECORD_PARTS.forEach((part) => {
    const on = part.id === recordPart;
    const tab = el('button', 'screen-nav-btn attendance-report-tab' + (on ? ' active' : ''),
      part.label);
    tab.type = 'button';
    tab.id = 'attendanceRecordTab-' + part.id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', on ? 'true' : 'false');
    tab.setAttribute('aria-controls', 'attendanceRecordPart');
    tab.setAttribute('data-attendance-record-part', part.id);
    nav.append(tab);
  });
  return nav;
}

/* One printed page's worth of date columns, with the student column repeated. The caption is drawn
   only when there is more than one slice: "Meetings 1–24" over a table that is the whole term is a
   label about nothing. */
function slice(record, dates, from, total) {
  const wrap = el('div', 'attendance-report-slice');
  /* THE CONTINUATION LINE (WO-8.4). Every slice after the first starts a printed page
     (src/attendance.css), so a loose page of dates would otherwise say nothing about whose class it
     is. Empty here and hidden on screen: src/print-gate.js writes it at `beforeprint` from the same
     words as #printHeader. THE FIRST SLICE CARRIES NONE SINCE WO-2.59: with the record in tabs, Day
     by day prints its slices alone and the first one is on page one under #printHeader itself — a
     second title two lines under the first is noise, which is the grade sheet's own call. */
  if (from > 0) wrap.append(el('div', 'print-header-running'));
  if (total > dates.length) {
    wrap.append(el('div', 'attendance-report-slice-label',
      'Meetings ' + (from + 1) + '–' + (from + dates.length) + ' of ' + total));
  }
  const table = el('table', 'attendance-report-table attendance-report-grid');
  const thead = el('thead');
  const hrow = el('tr');
  hrow.append(cell('th', '', 'Student'));
  dates.forEach((date) => {
    const th = cell('th', 'attendance-report-day', '');
    th.append(el('span', 'attendance-report-dow', dayAbbr(date)));
    th.append(el('span', 'attendance-report-date', numericDate(date)));
    /* The whole date, for a reader who is not looking at a printed page. */
    th.title = plainDate(date);
    hrow.append(th);
  });
  thead.append(hrow);
  table.append(thead);
  const tbody = el('tbody');
  record.students.forEach((student) => {
    const tr = el('tr');
    tr.append(cell('th', 'attendance-report-row-head', student.name));
    dates.forEach((date) => {
      /* A blank is unreachable — every student in the record has a reading on every date the walk
         produced — and it is drawn as a dash rather than as nothing if a later shape ever makes one,
         because an empty cell in this grid would read as "present" and that is the ambiguity the
         whole registry is built to refuse. */
      const code = student.marks[date] || '';
      const td = el('td', 'attendance-report-cell');
      td.append(el('span', 'attendance-report-mark'
        + (code ? ' attendance-cell-' + code : ''), code || '–'));
      td.title = (code ? wordFor(code) : 'No mark') + ' · ' + plainDate(date);
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);
  wrap.append(table);
  return wrap;
}

/* ────────────────────────────── out of the browser ────────────────────────────── */

/* WHETHER THE RECORD IS WHAT IS ON SCREEN, asked of the DOM every time rather than remembered from
   the tap. This is the predicate src/print-gate.js answers the attribute from; that file carries
   the reasoning, including the two ways the timer this replaced came apart. */
function recordOnScreen() {
  const modal = document.getElementById(RECORD_MODAL);
  return !!modal && !modal.classList.contains('hidden');
}

/* Registered at module scope, not around each print: the Ctrl+P a teacher presses with this dialog
   already open never comes through printRecord() and wants the same gate. src/shell.js imports this
   module at startup, so it is live from the first paint. */
const syncPrintGate = registerPrintGate(PRINT_ATTR, recordOnScreen, headOfRecord);

/* The header's words for the open record, with the print date asked NOW — the moment the page is
   serialised, which is the moment src/print-gate.js calls this — and, since WO-2.59, the part on
   screen named in the title: "Attendance record · Day by day". It is the title rather than a third
   line because the continuation line at each forced break carries the title, so a loose page of
   dates names its part too. */
function headOfRecord() {
  if (!printHead) return null;
  const part = recordParted ? partOf(recordPart) : null;
  return Object.assign({}, printHead, {
    title: printHead.title + (part ? ' · ' + part.label : ''),
    printed: plainDate(todayISO()),
  });
}

export function printRecord() {
  const body = document.body;
  if (!body) return false;
  /* Set here as well, for an engine that fires neither event: the gate has to be on before print()
     is called, and the listeners registered above only correct it later. */
  syncPrintGate();
  window.print();
  return true;
}

/*
  THE FILE, AS TEXT, WITH NO DOM IN IT — the seam src/backup.js's own split named: the half that
  builds a file and the half that hands it over are two functions, so the first one can be driven
  from tools/verify-shell.mjs and asserted character by character. "The CSV opens cleanly in a
  spreadsheet" is otherwise a claim nobody can check without a spreadsheet.

  THE SHAPE IS ROLL CALL!'s, COLUMN FOR COLUMN (exportAttendanceCSV in dashboard.html): the summary
  block first — last name, first name, the five counts, the percentage — then one column per school
  day, oldest first. A teacher who has been exporting from Roll Call! all year opens this in the
  same spreadsheet with the same columns in the same places.

  Three details in it are load-bearing and all three are lifted rather than reasoned out again:

    - A BOM, so Excel reads the file as UTF-8. Without it a name with an accent in it arrives
      mangled, and the teacher's first thought is that the app broke her roster.
    - CRLF line endings, which is what the CSV convention actually says and what Excel is happiest
      with.
    - A cell is quoted only when it holds a quote, a comma or a newline, and a quote inside one is
      doubled. A class called "Period 2, Honors" is a real class name and it must not become two
      columns.
*/
export function recordCsv(record) {
  const rows = [];
  const head = ['Last Name', 'First Name'];
  MARKS.forEach((mark) => head.push(mark.word));
  head.push('Meetings', 'Att %');
  record.dates.forEach((date) => head.push(date));
  rows.push(head);

  record.students.forEach((student) => {
    const row = [student.last, student.first];
    MARKS.forEach((mark) => row.push(student.totals[mark.code]));
    row.push(student.totals.meetings);
    /* Empty rather than "No recorded meetings" when there are none: a sentence in a percentage
       column is a column a spreadsheet cannot add up, and the Meetings column beside it already
       says zero. Everywhere else it is the same string the registry prints. */
    row.push(student.totals.percent === null ? '' : percentText(student.totals));
    record.dates.forEach((date) => row.push(student.marks[date] || ''));
    rows.push(row);
  });

  const text = '﻿' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
  return { name: csvName(record), text: text };
}

function csvCell(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/*
  "Planbook Period 2 Q1 attendance 2026-08-11.csv" — the same "Planbook … <what> <date>" family the
  backup files use, so the whole set sorts together in a Files listing and a teacher can tell at a
  glance which term a file is of.

  The class and term labels are typed by the teacher and can hold anything, including the handful of
  characters iPadOS and Windows both refuse in a file name. They are replaced rather than stripped,
  so "Period 2/3" stays two numbers rather than becoming "Period 23".
*/
function csvName(record) {
  const clean = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = ['Planbook', clean(record.className)];
  if (record.termLabel) parts.push(clean(record.termLabel));
  parts.push('attendance', todayISO());
  return parts.filter(Boolean).join(' ') + '.csv';
}

export function downloadRecordCsv() {
  const record = classRecord();
  if (!record) return false;
  const file = recordCsv(record);
  handToBrowser({ name: file.name,
    blob: new Blob([file.text], { type: 'text/csv;charset=utf-8' }) });
  /* Said rather than shown: this dialog has no status line and does not want one — the file lands
     in the Files app or in Downloads and the browser says so itself. What a screen-reader user gets
     otherwise is a button that does nothing at all. */
  announce('Saved ' + file.name);
  return true;
}
