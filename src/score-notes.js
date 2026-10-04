/*
  A note on one score cell — the reason behind a mark (WO-3.32). A revised essay, a conference,
  *turned in after the absence*: free text the teacher types on the cell itself, read back on the
  grid and on student detail, and nowhere else.

  ── THE FIELD, AND ITS PRECEDENT ──

  `note` is an optional key on a score cell, absent where unused, on exactly the terms an attendance
  mark's `note` has (docs/data-model.md, the mark cell rule): written as typed, and an empty or
  whitespace-only field DELETES the key rather than storing `""`. It may sit on any cell — a score,
  a blank, a `missing`, an `excused` — so a cell holding nothing but a note is `{ v: null, note }`,
  which every reader already treats as ungraded. THE GRADE ENGINE NEVER READS IT, and neither does
  anything else that decides: the engine, the past-due prompt, the signals and the grade sheet all
  read a cell through `v` and `flag` and stop there. The one writer is src/scores.js's writeNote(),
  beside writeCell(), which is the only other function in the app that writes a score cell from a
  screen.

  THE NOTE LIVES IN THE CELL AND NOWHERE ELSE (WO-3.32's Traps). It is not mirrored into `log[]`:
  one note in two places is two records, the same reason a tardy's time lives in the mark cell and
  nowhere else.

  ── THIS FILE IS THE ONE ASKER ──

  A score note is free text about one student, and the score grid is the screen most likely to be on
  a classroom wall. So under presentation mode it is ABSENT — no text, no mark, no "has a note" in an
  accessible name, on every screen that draws one — whatever an attendance mark's note does (the
  owner's ruling, 2026-10-02). It is not support data, so the question is presentationMode() rather
  than supportsVisible(), which is src/pass-history.js's distinction rather than a new one.

  THE QUESTION IS ASKED HERE AND ONLY HERE. src/scores.js reads a note through visibleNoteOf() and
  nothing else, and src/detail.js — which by its own header may not ask the mode at all — appends the
  card scoreNotesCard() hands back, the arrangement it already has with src/pass-history.js and
  src/log-sheet.js. So the grid's mark, the grid's panel and the detail card cannot disagree about
  whether a note may be on screen: there is one answer and it is this file's.

  ── WHAT IT DOES NOT DO ──

  IT IS NOT A WRITER: no store import, no update(). It never reaches the merge-field resolver — the
  resolver's whitelist has no name that walks into a cell, which tools/verify/score-notes.mjs asks it
  — nor the printed grade sheet, which reads a cell through src/scores.js's scoreMark() and gets a
  value and a flag. The backup carries it, because the backup carries the document.
*/

import { presentationMode } from './supports.js';

/* createElement and textContent, never innerHTML: a note is typed by a teacher and has to be those
   characters rather than markup. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* The note a cell carries, AS STORED — for writers, which have to keep it across a change of value
   or flag whatever mode the screen is in. Nothing that DRAWS may call this; see visibleNoteOf(). A
   whitespace-only string reads as no note, which is what the writer would have stored for it. */
export function noteOf(cell) {
  if (!cell || typeof cell !== 'object' || Array.isArray(cell)) return '';
  return typeof cell.note === 'string' && cell.note.trim() ? cell.note : '';
}

/* MAY A SCORE NOTE BE ON SCREEN RIGHT NOW. The one question, asked in the one place. */
export function scoreNotesVisible() {
  return !presentationMode();
}

/* The note a cell carries, AS IT MAY BE DRAWN: '' under presentation mode, so a caller that builds
   a mark, a tooltip or an accessible name out of the answer builds nothing. Every reader that puts a
   note on a page reads it through here. */
export function visibleNoteOf(cell) {
  if (!scoreNotesVisible()) return '';
  return noteOf(cell);
}

/* One cell of the document, through the same guard every reader of `scores` uses — a cell that is
   not an object is no cell (src/scores.js's cellOf()). Not imported from there: that file imports
   this one, and the read is four lines. */
function cellIn(doc, assignmentId, studentId) {
  const column = doc && doc.scores ? doc.scores[assignmentId] : null;
  if (!column || !Object.prototype.hasOwnProperty.call(column, studentId)) return null;
  const cell = column[studentId];
  return cell && typeof cell === 'object' && !Array.isArray(cell) ? cell : null;
}

/*
  THE NOTES ON ONE STUDENT'S SCORES, as a card for student detail — each note beside the assignment
  it is on, in the order the document holds the open class's work in the open term (the grid's own
  column order).

  NULL WHEN THERE IS NOTHING TO DRAW, and that covers two cases on purpose: a student with no notes,
  and presentation mode. Both give the same answer, so the card's absence on a projected screen
  says nothing about whether a note exists — a card drawn empty in one case and missing in the other
  would be the count arriving by layout instead of by number.

  IT WEARS `.log-card`, WHICH IS THE PRINT GATE (src/detail.css hides that class on paper, and
  src/contact-history.js wears it for the same reason): the note goes nowhere outside the app, and a
  student report a guardian carries out of the building is outside it. studentCsv() names its own
  columns and none of them is this.
*/
export function scoreNotesCard(doc, cls, termId, studentId) {
  if (!scoreNotesVisible() || !doc || !cls || !termId) return null;
  const work = (Array.isArray(doc.assignments) ? doc.assignments : [])
    .filter((a) => a && a.classId === cls.id && a.termId === termId);
  const rows = [];
  work.forEach((a) => {
    const note = visibleNoteOf(cellIn(doc, a.id, studentId));
    if (note) rows.push({ assignment: a, note: note });
  });
  if (!rows.length) return null;

  const card = el('div', 'detail-card log-card');
  /* What tells this card apart from the two others wearing `.log-card` — read by
     tools/verify/score-notes.mjs, and not a delegated hook: there is no control on it. */
  card.setAttribute('data-score-notes-card', '');
  card.append(el('div', 'detail-card-title', 'Notes on scores'));
  rows.forEach((row) => {
    const line = el('div', 'detail-missing-row');
    line.setAttribute('data-score-note-row', row.assignment.id);
    line.append(el('span', 'detail-missing-name', row.assignment.name || 'Untitled assignment'));
    line.append(el('span', 'detail-score-note', row.note));
    card.append(line);
  });
  card.append(el('p', 'detail-card-note',
    'Notes you added to a score on the Scores screen. They change no grade, and they stay on your '
      + 'screen: not on the printed sheet, not in the CSV, and no message template can reach them.'));
  return card;
}
