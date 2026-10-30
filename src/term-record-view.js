/*
  Record Q1 grades — the bar on a class's screens, and the dialog its button opens (WO-3.73).

  ── WHY THIS EXISTS ──

  Grades are re-keyed into Blackbaud by hand, and once a quarter is keyed any later change here leaves
  two grades for one student with nothing on screen to say so. src/term-record.js (WO-3.72) is the
  record and the readers; this is the half a teacher sees. Since WO-2.52 a class opens on the term
  holding today by itself, so on the first of November nobody taps from Q1 to Q2 — a notice tied to a
  tap would never reach the teacher who does nothing, who is the one it is for. So the standing
  reminder is a BAR, like the backup nag, and it stays until a recording matches. NO LOCK: nothing
  here refuses an edit, and the bar has no ✕ (plans/closing-a-quarter.md, the owner, 2026-10-23).

  ── THIS FILE COMPUTES NOTHING ──

  Which terms need recording, in what order, in which of three states, how many students changed, who they are, what
  was recorded and what it is now, whether a letter moved, how many boxes are empty, which columns are
  held, how much uncategorized work is outside a weighted grade — every one of those is a reader in
  src/term-record.js, and the bar and the dialog ask THE SAME reader for the same fact. Each of the
  bar's lines is one entry of termsNeedingRecord(), in its order, with its count — which is
  noLongerMatching()'s length — and the bar asks noLongerMatching() nothing itself; the dialog's rows
  are noLongerMatching()'s rows. A second comparison here is the second opinion that lets the bar say
  "2 students" over a dialog listing three (the work order's Traps). What this file adds is words,
  the grid's order (gridOrder(), the grade sheet's — the order Blackbaud is keyed in) and the grid's
  two-decimal figure (formatPercent()).

  ── THE BAR NAMES A COUNT AND NEVER A STUDENT ──

  So it stays up under a projector, which is the whole reason it may: a class name, a term and "2
  students" disclose nothing to a room. It asks presentationMode() nothing, and that is deliberate
  rather than forgotten — there is nothing on it to hide. THE DIALOG is a list of names and grades,
  and is refused while the mode is on, the way the concern list is (src/signals-view.js): it opens
  saying what it would have shown and naming the control that turns the mode off, and it BUILDS NO
  LIST — the facts box is emptied, not hidden, because a list that exists in the DOM is a list a
  later paint can show.

  ── WHERE THE BAR IS, AND WHEN IT IS PAINTED ──

  Under the header, after the backup nag (index.html) — a COPY of `.backup-nag`'s values in
  src/shell.css, not a shared class, for the reason that file gives about the install banner: two
  components that happen to look alike. On the class's five screens — src/views.js's CLASS_SCREENS
  less the calendar, which is a screen ABOUT a class with its own filter and whose month would carry a
  bar about one class over a grid of five — and on no other view: not home (WO-3.74 draws home's own
  bar), not the template editor, not the calendar.

  Painted by src/shell.js on every view change, class change and document replacement, and after a
  recording — NOT on every save, and not subscribed to the store (src/store.js says why no screen
  is): a bar that appeared mid-keystroke while a teacher typed a Q1 score would move the grid under
  her thumb. The backup nag made the same trade for the same reason. So a score corrected in Q1 shows
  in the bar the next time a screen is opened — which is also WO-3.74's moment, leaving the quarter.

  ── ONE LINE PER TERM, IN THE READER'S ORDER (WO-3.77) ──

  The bar names every term the reader lists — unrecorded before changed, newest first, the owner's
  order of 2026-10-29 — one line each, in WO-3.73's wording for that line's state and with its own
  *Record Qn grades* button opening that term's dialog. The order is the reader's and is not touched
  here: nothing below sorts, filters or picks among the entries. One entry draws exactly what WO-3.73
  drew, because a line IS WO-3.73's bar — the text and the button in one wrapping row — and the
  `<aside>` around the lines carries the colour, the border and the padding. Two lines stack, a
  hairline between them (src/shell.css § RECORD NAG says why that and not a second bar). A recording
  removes its own line because the reader stops listing its term, and the bar goes when the list is
  empty.

  ── THE TERM'S SHORT NAME ──

  The owner's word is *Record Q1 grades* (ruling 10). A term's label is the teacher's own text and
  is "Quarter 1" by default (src/classes.js's TERM_PRESETS), so the button shortens a label of the
  shape WORD NUMBER to its initial and the number — "Quarter 1" → "Q1", "Semester 2" → "S2" — and
  uses any other label whole. A DISPLAY abbreviation only: nothing reads meaning out of it, and no
  term is found, compared or filed by it (src/classes.js's header, rule 1).
*/

import { getDoc } from './store.js';
import { openModal, closeModal } from './modal.js';
import { announce } from './live-region.js';
/* The one asker of the rule, imported rather than re-tested (src/supports.js owns it). */
import { presentationMode } from './supports.js';
import { currentView, isClassScreen } from './views.js';
import { getSelectedClass } from './classes.js';
import {
  recordTerm, termsNeedingRecord, newestRecord, noLongerMatching, gradesToRecord, emptyBoxes,
  heldColumns, looseWorkOutOfGrade,
} from './term-record.js';
/* The grid's order and the grid's figure, for src/held-column.js's reason over the same import: a
   teacher reads the dialog straight down against the grade sheet. */
import { formatPercent, gridOrder } from './scores.js';
import { rosterName } from './roster.js';
/* How a date reads in this app (WO-3.20). A record's `at` is a local stamp, and its first ten
   characters are the date — src/contact-history.js's idiom, not a new parse. */
import { shortDate, weekdayShortDate } from './date-text.js';

const BAR_ID = 'termRecordNag';
/* The first line's lead carries this id, so the bar's aria-labelledby names its first — most urgent —
   line, as it named the only one before WO-3.77. */
const BAR_LEAD_ID = 'termRecordNagLead';

const MODAL_ID = 'termRecordModal';
const TITLE_ID = 'termRecordTitle';
const LEAD_ID = 'termRecordLead';
const LABEL_ID = 'termRecordLabel';
const FACTS_ID = 'termRecordFacts';
const LIST_ID = 'termRecordList';
const HINT_ID = 'termRecordHint';
const EMPTY_ID = 'termRecordEmpty';
const HELD_ID = 'termRecordHeld';
const LOOSE_ID = 'termRecordLoose';
const REFUSED_ID = 'termRecordRefused';
const REFUSED_NAME_ID = 'termRecordRefusedName';
const CONFIRM_ID = 'termRecordBtn';
const KEEP_ID = 'termRecordKeep';

/* What the open dialog is about — a class id and a term id, never the objects, for src/classes.js's
   reason about anything held across a render: a restore or a sync can replace the document. */
let pending = null;

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

function termOf(cls, termId) {
  return (cls && Array.isArray(cls.terms) ? cls.terms : [])
    .filter((term) => term && term.id === termId)[0] || null;
}

function classById(doc, classId) {
  return (doc && Array.isArray(doc.classes) ? doc.classes : [])
    .filter((c) => c && c.id === classId)[0] || null;
}

/* The term's name in a sentence, and the short form a button carries — see the header. */
function longName(term) {
  const label = term && typeof term.label === 'string' ? term.label.trim() : '';
  return label || 'This term';
}

export function shortTermName(term) {
  const label = term && typeof term.label === 'string' ? term.label.trim() : '';
  const shape = /^([A-Za-z])[A-Za-z]*\s+(\d+)$/.exec(label);
  if (shape) return shape[1].toUpperCase() + shape[2];
  return label;
}

function recordLabel(term) {
  const short = shortTermName(term);
  return short ? 'Record ' + short + ' grades' : 'Record grades';
}

function className(cls) { return (cls && cls.name) || 'this class'; }

function dateOf(at) { return String(at || '').slice(0, 10); }

/* One student's figure as the grid writes it, with the letter beside it, or "no grade". */
function figure(side) {
  if (!side || side.percentage === null || side.percentage === undefined) return 'no grade';
  return formatPercent(side.percentage) + (side.letter ? ' ' + side.letter : '');
}

/* A list of names in a sentence: "A", "A and B", "A, B and C" — each a node, so a name can be
   emphasised without its text being parsed back out. */
function listNodes(parent, items) {
  items.forEach((node, at) => {
    if (at > 0) parent.append(document.createTextNode(at === items.length - 1 ? ' and ' : ', '));
    parent.append(node);
  });
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ────────────────────────────── the bar ────────────────────────────── */

/*
  WHAT THE BAR SAYS NOW, as data — `{ classId, lines: [{ termId, state, count, lead, more, button }] }`,
  or null when it is not drawn. The seam a check reads it through, and the one place the three
  wordings are chosen. `view` and `classId` default to what is on screen.

  ONE LINE PER ENTRY OF termsNeedingRecord(), IN ITS ORDER (WO-3.77). Each line's term, state and count
  are the entry's, copied and never re-derived — no comparison, no end date, no order is worked out
  here.

  THE THREE WORDINGS ARE THE DRAWING'S, A0, A AND D, and the entry's state picks between them: on
  the end date *ends today*; after it, unrecorded, *has ended*; recorded and no longer matching,
  *have changed* with the count. The date in D is the newest record's, in the app's short format.
*/
function barLine(cls, need) {
  const term = termOf(cls, need.termId);
  const name = longName(term);
  let lead = '';
  let more = '';
  if (need.state === 'ends-today') {
    lead = name + ' ends today.';
    more = 'Record its grades for ' + className(cls) + ' once they are keyed into Blackbaud.';
  } else if (need.state === 'unrecorded') {
    lead = name + ' has ended, and its grades for ' + className(cls) + ' are not recorded.';
    more = 'Record them once they are keyed into Blackbaud, and Planbook will tell you if any of '
      + 'them changes afterwards.';
  } else {
    lead = name + ' grades for ' + className(cls) + ' have changed since you recorded them on '
      + shortDate(dateOf(need.at)) + ' — ' + plural(need.count, 'student', 'students') + '.';
  }
  return { termId: need.termId, state: need.state, count: need.count,
    lead: lead, more: more, button: recordLabel(term) };
}

export function termRecordBarModel(view, classId) {
  const on = view === undefined ? currentView() : view;
  if (!isClassScreen(on) || on === 'calendar') return null;
  const doc = getDoc();
  const cls = classId === undefined ? getSelectedClass() : classById(doc, classId);
  if (!doc || !cls) return null;
  const needs = termsNeedingRecord(doc, cls);
  if (!needs.length) return null;
  return { classId: cls.id, lines: needs.map((need) => barLine(cls, need)) };
}

/* One line of the bar: WO-3.73's markup — the text, then the button — inside a row of its own. The
   button carries the class and the term in the attributes src/shell.js's click handler reads. */
function paintBarLine(classId, line, first) {
  const row = el('div', 'term-record-nag-line');
  row.setAttribute('data-term-record-line', line.termId);
  const text = el('div', 'term-record-nag-text');
  const strong = el('strong');
  const warn = el('span', '', '⚠');
  warn.setAttribute('aria-hidden', 'true');
  const lead = el('span', '', line.lead);
  if (first) lead.id = BAR_LEAD_ID;
  strong.append(warn, document.createTextNode(' '), lead);
  text.append(strong);
  if (line.more) text.append(document.createTextNode(' '), el('span', '', line.more));
  const button = el('button', 'term-record-nag-btn', line.button);
  button.type = 'button';
  button.setAttribute('data-term-record-open', line.termId);
  button.setAttribute('data-term-record-class', classId);
  button.setAttribute('aria-haspopup', 'dialog');
  /* The space between them is WO-3.73's markup, where whitespace stood between the text and the
     button: the flex row draws nothing for it, but the bar's text — what a screen reader reads out —
     is "…Blackbaud. Record Q1 grades", not "…Blackbaud.Record Q1 grades". */
  row.append(text, document.createTextNode(' '), button);
  return row;
}

export function refreshTermRecordBar() {
  const bar = document.getElementById(BAR_ID);
  if (!bar) return;
  const model = termRecordBarModel();
  bar.textContent = '';
  bar.classList.toggle('hidden', !model);
  if (!model) return;
  model.lines.forEach((line, at) => bar.append(paintBarLine(model.classId, line, at === 0)));
}

/* ────────────────────────────── the dialog ────────────────────────────── */

/*
  WHAT THE DIALOG WOULD SHOW, as data — the whole of it before anything is drawn, and the seam a
  check reads. Nothing is written.

    form 'refused'  presentation mode is on: no rows, no figures, no names — nothing is asked of the
                    readers at all, so there is nothing in memory for a later paint to render.
    form 'changed'  the term is recorded and noLongerMatching() names someone: only those students,
                    recorded beside now (frame C, without *What changed*, which is WO-3.75).
    form 'first'    otherwise: every student gradesToRecord() would record — the writer's own list —
                    with the empty boxes, the held columns and, in a weighted class, the
                    uncategorized work outside these grades (frame B).

  Rows are in gridOrder()'s order, and each carries the reader's own figures.
*/
export function termRecordModel(classId, termId) {
  const doc = getDoc();
  const cls = classById(doc, classId);
  const term = termOf(cls, termId);
  if (!doc || !cls || !term) return null;
  const base = { classId: cls.id, termId: term.id, className: className(cls), termName: longName(term),
    shortName: shortTermName(term), button: recordLabel(term) };
  if (presentationMode()) return Object.assign(base, { form: 'refused', rows: [] });

  const order = gridOrder(cls);
  const nameOf = (studentId) => rosterName(order.filter((s) => s.id === studentId)[0]);
  const inOrder = (rows) => order
    .map((student) => rows.filter((row) => row.studentId === student.id)[0])
    .filter((row) => !!row);

  const record = newestRecord(doc, cls, term.id);
  const changed = record ? noLongerMatching(doc, cls, term.id) : null;
  if (record && changed && changed.length) {
    return Object.assign(base, {
      form: 'changed', at: record.at,
      rows: inOrder(changed).map((row) => ({ studentId: row.studentId, name: nameOf(row.studentId),
        recorded: row.recorded, live: row.live, letterChanged: row.letterChanged })),
    });
  }
  return Object.assign(base, {
    form: 'first',
    rows: inOrder(gradesToRecord(doc, cls, term.id)).map((row) => ({ studentId: row.studentId,
      name: nameOf(row.studentId), percentage: row.percentage, letter: row.letter })),
    empty: emptyBoxes(doc, cls, term.id),
    heldColumns: heldColumns(doc, cls, term.id),
    loose: looseWorkOutOfGrade(doc, cls, term.id),
  });
}

function show(id, on) {
  const node = document.getElementById(id);
  if (node) node.classList.toggle('hidden', !on);
  return node;
}

function head(list, texts) {
  texts.forEach((text, at) => {
    list.append(el('span', 'term-record-head' + (at > 0 ? ' term-record-fig' : ''), text));
  });
}

function paintFirstRows(list, rows) {
  head(list, ['Student', 'Grade', 'Letter']);
  rows.forEach((row) => {
    const name = el('span', 'term-record-name', row.name);
    name.setAttribute('data-term-record-row', row.studentId);
    list.append(name, el('span', 'term-record-fig', formatPercent(row.percentage)),
      el('span', 'term-record-fig', row.letter || '—'));
  });
}

/* A letter change is bold; a percentage that moved inside the same letter is quiet, its letter drawn
   in `.term-record-same` so the eye finds the rows Blackbaud's letter has to change on. Which is
   which is noLongerMatching()'s `letterChanged`, not a comparison made here. */
function paintChangedRows(list, rows) {
  head(list, ['Student', 'Recorded', 'Now']);
  rows.forEach((row) => {
    const name = el('span', 'term-record-name', row.name);
    name.setAttribute('data-term-record-row', row.studentId);
    const was = el('span', 'term-record-fig term-record-was', row.recorded ? figure(row.recorded) : 'not recorded');
    let now;
    if (row.letterChanged) {
      now = el('span', 'term-record-fig term-record-moved', figure(row.live));
    } else {
      now = el('span', 'term-record-fig', formatPercent(row.live.percentage) + ' ');
      now.append(el('span', 'term-record-same', row.live.letter || ''));
    }
    now.setAttribute('data-term-record-now', row.letterChanged ? 'letter' : 'percentage');
    list.append(name, was, now);
  });
}

/* *There are 7 empty boxes in Q1, across Exams and Projects.* — the owner's words (the drawing's
   answer 2). Work filed under no category is named last, as *no category*, in italics: it is the
   engine's name for that pile, not a category the teacher made. */
function paintEmpty(model) {
  const line = show(EMPTY_ID, model.empty.count > 0);
  if (!line) return;
  line.textContent = '';
  if (!model.empty.count) return;
  const n = model.empty.count;
  line.append(document.createTextNode(n === 1 ? 'There is ' : 'There are '),
    el('strong', '', plural(n, 'empty box', 'empty boxes')),
    document.createTextNode(' in ' + (model.shortName || model.termName) + ', '
      + (model.empty.categories.length > 1 ? 'across ' : 'in ')));
  listNodes(line, model.empty.categories.map((c) => (c.id === null
    ? el('em', '', c.name) : document.createTextNode(c.name))));
  line.append(document.createTextNode('.'));
}

/* *1 held column, Vocabulary Quiz 4, is not committed, so it counts toward none of these grades.* */
function paintHeld(model) {
  const line = show(HELD_ID, model.heldColumns.length > 0);
  if (!line) return;
  line.textContent = '';
  if (!model.heldColumns.length) return;
  const one = model.heldColumns.length === 1;
  line.append(el('strong', '', plural(model.heldColumns.length, 'held column', 'held columns')),
    document.createTextNode(', '));
  listNodes(line, model.heldColumns.map((h) => el('em', '', h.name || 'Untitled assignment')));
  line.append(document.createTextNode(one
    ? ', is not committed, so it counts toward none of these grades.'
    : ', are not committed, so they count toward none of these grades.'));
}

/* In a weighted class, scored work filed under no category is outside every grade here — it has no
   weight to sit under — and the dialog says so in a line of its own, as it names a held column
   (plans/closing-a-quarter.md, the drawing's answer 2). The count is looseWorkOutOfGrade()'s, which
   answers 0 in a points class, where that work IS in the grade. It counts a column holding only
   missing marks too (the owner, 2026-10-27), so the sentence says *scores or missing marks*: *has
   scores in it* was false for a column of `M`s. */
function paintLoose(model) {
  const n = model.loose.count;
  const line = show(LOOSE_ID, n > 0);
  if (!line) return;
  line.textContent = '';
  if (!n) return;
  line.append(el('strong', '', plural(n, 'assignment', 'assignments')),
    document.createTextNode(n === 1
      ? ' filed under no category has scores or missing marks in it, which are not in these grades: '
        + 'a weighted grade counts only work in a category.'
      : ' filed under no category have scores or missing marks in them, which are not in these '
        + 'grades: a weighted grade counts only work in a category.'));
}

/*
  OPEN IT for one class and term — from the bar's button, and from WO-3.74's home bar and notice when
  they land. Answers false when there is no such class or term. Nothing is written by opening:
  `termRecords` is created by recordTerm() and by nothing else, so a dialog opened and closed leaves
  the document byte for byte as it was.
*/
export function openTermRecordDialog(classId, termId, opener) {
  const model = termRecordModel(classId, termId);
  if (!model) return false;
  pending = { classId: model.classId, termId: model.termId };

  /* Every line that holds words from an earlier opening is emptied first, whichever form this one
     is: the refusal must carry nothing an earlier form wrote, hidden or not. */
  [LIST_ID, LEAD_ID, LABEL_ID, EMPTY_ID, HELD_ID, LOOSE_ID].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = '';
  });
  const list = document.getElementById(LIST_ID);
  const title = document.getElementById(TITLE_ID);
  const lead = document.getElementById(LEAD_ID);
  const label = document.getElementById(LABEL_ID);
  const confirm = document.getElementById(CONFIRM_ID);
  const keep = document.getElementById(KEEP_ID);
  const refused = model.form === 'refused';

  show(REFUSED_ID, refused);
  show(LEAD_ID, !refused);
  show(LABEL_ID, !refused);
  show(FACTS_ID, !refused && model.rows.length > 0);
  show(HINT_ID, model.form === 'changed');
  show(CONFIRM_ID, !refused);
  if (refused || model.form === 'changed') {
    show(EMPTY_ID, false); show(HELD_ID, false); show(LOOSE_ID, false);
  }
  if (confirm) confirm.textContent = model.button;
  const named = document.getElementById(REFUSED_NAME_ID);
  if (named) named.textContent = model.button;

  if (refused) {
    if (title) title.textContent = 'Record ' + model.termName + ' grades';
    if (keep) keep.textContent = 'Close';
  } else if (model.form === 'changed') {
    if (title) title.textContent = model.termName + '’s grades have changed';
    if (lead) {
      lead.textContent = 'Since you recorded ' + model.className + '’s ' + model.termName
        + ' grades on ' + weekdayShortDate(dateOf(model.at)) + ', '
        + plural(model.rows.length, 'student’s grade has', 'students’ grades have')
        + ' moved. Change them in Blackbaud, then record again.';
    }
    if (label) label.textContent = plural(model.rows.length, 'student changed', 'students changed');
    if (list) paintChangedRows(list, model.rows);
    if (keep) keep.textContent = 'Not yet';
  } else {
    if (title) title.textContent = 'Record ' + model.termName + ' grades for ' + model.className + '?';
    if (lead) {
      lead.textContent = 'Recording says these are the grades you have keyed into Blackbaud. '
        + 'Planbook keeps them, and if any of them changes later it tells you who and by how much. '
        + 'Grades stay editable either way.';
    }
    if (label) {
      label.textContent = model.rows.length
        ? plural(model.rows.length, 'student', 'students')
        : 'No student has a grade in ' + model.termName + ' yet';
    }
    if (list) paintFirstRows(list, model.rows);
    paintEmpty(model);
    paintHeld(model);
    paintLoose(model);
    if (keep) keep.textContent = 'Not now';
  }
  openModal(MODAL_ID, opener);
  return true;
}

/*
  YES — record the whole class's term, as one new entry (the changed form records everyone again, not
  only who changed: frame C's caption). Refused while presentation mode is on, which the button is not
  drawn for anyway. Answers whether it wrote, so src/shell.js can repaint the bar.
*/
export function confirmTermRecord() {
  const want = pending;
  pending = null;
  closeModal(MODAL_ID);
  if (!want || presentationMode()) return false;
  const doc = getDoc();
  const cls = classById(doc, want.classId);
  const term = termOf(cls, want.termId);
  if (!cls || !term) return false;
  const entry = recordTerm(cls, term.id);
  if (entry) {
    announce(longName(term) + ' grades for ' + className(cls) + ' are recorded — '
      + plural(entry.grades.length, 'student', 'students') + '.');
  }
  return !!entry;
}

/* NO — *Not now*, *Not yet* or *Close*. Nothing has been written, so there is nothing to undo. The ✕,
   Escape and the backdrop are src/modal.js's and close it the same way, writing nothing either. */
export function cancelTermRecord() {
  const want = pending;
  pending = null;
  closeModal(MODAL_ID);
  if (want && !presentationMode()) announce('Nothing was recorded.');
}
