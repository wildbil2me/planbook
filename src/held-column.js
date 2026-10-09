/*
  Holding a score column out of the grade, and committing it back (WO-3.46) — the two writers, the
  preview of what each would move, and the confirm that shows it before anything is written.

  WHY IT EXISTS: the owner reconciles against the SIS, and the SIS makes every grade wait for a
  *commit* before it counts. "Sometimes you want to enter a grade, but you're rectifying things from
  the SIS. The challenge is you can't enter a grade without it applying." He chose PER COLUMN: a held
  column takes values, flags and notes like any column, counts toward nothing, and keeps no history
  until it is committed. What "counts toward nothing" means is WO-3.52's, at the grade engine's two
  walks; what a hold and a commit mean for a cell's history is reviseCell()'s, in
  src/score-history.js. This file decides neither. It flips the column, and it says first what the
  flip will move.

  ── THIS IS THE ONE FILE OUTSIDE src/grade-engine.js THAT TOUCHES `held` ──

  An assignment's `held` is READ in one place, isHeld() in src/grade-engine.js, and every screen and
  reader asks it (WO-3.52, WO-3.53). This file is the one exception tools/wo-sweep.mjs § 30 names,
  and the exception is for WRITES ONLY, in exactly two shapes: `.held = true` and `delete ….held`.
  A read of the key here still turns the sweep red, which is why every "is it held?" below is
  isHeld(), the same as everywhere else. Widening the exception to the whole file — the easy repair —
  is what the work order's own Acceptance line refuses.

  ── ONE update() EACH WAY, AND NOTHING ON THE CELLS ──

  Holding sets `held: true` and stamps `heldAt`; committing deletes `held` and stamps `committedAt`.
  Each stamp overwrites the one before (a column held twice is about its LAST hold, which is the
  boundary ruling 2 needs), each is `localStamp()` — the clock-to-string src/score-history.js and
  src/log.js already share — and neither touches a score cell: a cell does not know its column is
  held (WO-3.52's Traps), so there is nothing on it to move. A write that would change nothing — a
  hold of a column already held, a commit of one that is live — is refused rather than written, so
  `rev` never moves for a no-op.

  ── THE PREVIEW IS classGrade() ASKED TWICE, AND NOTHING ELSE ──

  The owner's ruling 3: the confirm names every student whose class grade changes, before and after,
  and says so in words when none does. Both figures are the engine's — once on the document as it
  is, once on a SHALLOW CLONE with this one column's `held` flipped — which is src/signals.js's
  gradeWithout() precedent and src/grading-mode.js's inMode() one. There is no percentage worked out
  in this file and there must never be: a confirm that computed its own figure could disagree with
  the grid behind it, which is the failure this repository refuses everywhere else. The clone is
  built HERE, in the writer's file, rather than by a helper in the engine, because flipping the key
  on a copy is a write of the key and this is the file allowed to write it; the engine keeps its one
  job, reading.

  The comparison is on the percentage the engine returns, exact, with "no grade" a value of its own
  — so a student whose grade goes from nothing to 78% is named, and one whose figure is the same
  float either side is not. Holding a column a student has no cell in moves nothing for her: the
  engine adds a 0/0 for it, and x + 0 is x to the last bit.

  ── WHAT IT IMPORTS, AND WHY src/scores.js IS ONE OF THEM ──

  formatPercent() and gridOrder() are the grid's, for the reason src/grading-mode.js gives over the
  same import: the names are listed in the order the grid draws them and the figures are written the
  way the grid writes them, so a teacher can read the confirm's names straight down against the
  column. Nothing in src/scores.js's graph reaches this file, so no loop closes. src/assignments.js
  imports this file for the editor's checkbox; src/shell.js routes the grid's control and the
  confirm's two buttons here and repaints whatever is behind them afterwards — this file paints only
  its own dialog.
*/

import { getDoc, update } from './store.js';
import { openModal, closeModal } from './modal.js';
import { announce } from './live-region.js';
import { getTerms, termName } from './classes.js';
import { classGrade, isHeld, letterFromPercentage } from './grade-engine.js';
import { formatPercent, gridOrder } from './scores.js';
import { rosterName } from './roster.js';
import { localStamp } from './log.js';

const CONFIRM_MODAL_ID = 'holdModal';
const CONFIRM_TITLE_ID = 'holdTitle';
const CONFIRM_LEAD_ID = 'holdLead';
const CONFIRM_LABEL_ID = 'holdChangesLabel';
const CONFIRM_CHANGES_ID = 'holdChanges';
const CONFIRM_BTN_ID = 'holdConfirmBtn';
const CONFIRM_KEEP_ID = 'holdKeepBtn';

/* The flip the confirm is showing: the assignment's id and which way, or null. An id and a
   direction, never the assignment object, for the reason src/classes.js gives about anything held
   across a render — a restore or a sync can replace the document underneath. */
let pending = null;

function assignmentsIn(doc) { return doc && Array.isArray(doc.assignments) ? doc.assignments : []; }
function classesIn(doc) { return doc && Array.isArray(doc.classes) ? doc.classes : []; }

function findAssignment(doc, id) {
  return assignmentsIn(doc).filter((a) => a && a.id === id)[0] || null;
}

function findClass(doc, id) {
  return classesIn(doc).filter((c) => c && c.id === id)[0] || null;
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

function quoted(assignment) {
  return '“' + ((assignment && assignment.name) || 'Untitled assignment') + '”';
}

/* ────────────────────────────── the two writers ────────────────────────────── */

/*
  HOLD. One update(): `held: true` and a fresh `heldAt`, overwriting an earlier one. A column created
  held gets both, because creating it held is a hold. Refused — no write, `rev` unmoved — when the
  column is already held or is not in the document. Answers whether it wrote.
*/
export function holdColumn(assignmentId) {
  const current = findAssignment(getDoc(), assignmentId);
  if (!current || isHeld(current)) return false;
  update((doc) => {
    const assignment = findAssignment(doc, assignmentId);
    if (!assignment) return;
    assignment.held = true;
    assignment.heldAt = localStamp();
  });
  return true;
}

/*
  COMMIT. One update(): `held` deleted — absent means live, so the column is the bytes a column that
  was never held would be, plus its two stamps — and a fresh `committedAt`, overwriting an earlier
  one. `heldAt` STAYS: it means something only while `held` is set (docs/data-model.md), and a later
  hold overwrites it. Refused when the column is live already. Answers whether it wrote.
*/
export function commitColumn(assignmentId) {
  const current = findAssignment(getDoc(), assignmentId);
  if (!current || !isHeld(current)) return false;
  update((doc) => {
    const assignment = findAssignment(doc, assignmentId);
    if (!assignment) return;
    delete assignment.held;
    assignment.committedAt = localStamp();
  });
  return true;
}

/* ────────────────────────────── the preview ────────────────────────────── */

/* The document with one column flipped, and nothing else copied: `assignments` is a new array and
   the one assignment in it a new object, so every category, weight, letter scale and score cell the
   engine reads is the document's own. A shallow clone, never a write and a revert, which is what
   keeps declining the confirm a true no-op. */
function withColumnFlipped(doc, assignmentId, toHeld) {
  return Object.assign({}, doc, {
    assignments: assignmentsIn(doc).map((a) => {
      if (!a || a.id !== assignmentId) return a;
      if (toHeld) return Object.assign({}, a, { held: true });
      const copy = Object.assign({}, a);
      delete copy.held;
      return copy;
    }),
  });
}

/* One side of one student's line: the engine's percentage, the letter it bands to, and how the
   confirm writes it — the grid's own two-decimal figure, its letter beside it, or "no grade". */
function sideOf(doc, cls, termId, studentId) {
  const grade = classGrade(doc, cls, termId, studentId);
  if (grade.percentage === null) return { percentage: null, letter: null, label: 'no grade' };
  const letter = letterFromPercentage(doc, cls, grade.percentage);
  return { percentage: grade.percentage, letter: letter || null,
    label: formatPercent(grade.percentage) + (letter ? ' ' + letter : '') };
}

/*
  WHAT A HOLD OR A COMMIT OF THIS COLUMN WOULD DO, as data — the whole confirm before any of it is
  drawn, and the seam a check reads it through (window.planbook.heldColumn). Nothing is written.

  `toHeld` is the direction: true when the column is live now and the question is holding it.
  `changes` is every student on the class's roster, in the grid's order, whose class grade in the
  column's own term is a different figure on the two sides — `before` as the document stands,
  `after` with the column flipped. A student whose figure is the same either side is not listed.
*/
export function holdPreview(assignmentId) {
  const doc = getDoc();
  const assignment = findAssignment(doc, assignmentId);
  const cls = assignment ? findClass(doc, assignment.classId) : null;
  if (!assignment || !cls) return null;
  const toHeld = !isHeld(assignment);
  const termId = assignment.termId;
  const flipped = withColumnFlipped(doc, assignment.id, toHeld);
  const changes = [];
  gridOrder(cls).forEach((student) => {
    const before = sideOf(doc, cls, termId, student.id);
    const after = sideOf(flipped, cls, termId, student.id);
    if (before.percentage === after.percentage) return;
    changes.push({ studentId: student.id, name: rosterName(student), before: before, after: after });
  });
  const term = getTerms(cls.id).filter((t) => t.id === termId)[0] || null;
  return {
    assignmentId: assignment.id, classId: cls.id, termId: termId, toHeld: toHeld,
    name: assignment.name || '', className: cls.name || '', termLabel: term ? termName(term) : '',
    changes: changes,
  };
}

/* ────────────────────────────── the confirm ────────────────────────────── */

function factLine(parent, text, hook, value) {
  const line = document.createElement('div');
  line.className = 'mode-change-line';
  if (hook) line.setAttribute(hook, value);
  line.textContent = text;
  parent.append(line);
}

/*
  ONE TAP BEHIND A CONFIRM THAT SHOWS WHAT MOVES (ruling 3), in both directions and from both doors:
  the grid's Hold / Commit on a column head, and the assignment editor's checkbox. The direction is
  the column's state at the tap — a live column is asked about holding, a held one about committing —
  so the two doors cannot ask different questions about the same column.

  It sits over whatever opened it: over the editor, src/modal.js's stack closes it alone on Escape and
  leaves the editor up, having written nothing. The ✕, Escape, the backdrop and Cancel all write
  nothing, because nothing has been written yet — the figures were computed on a clone.
*/
export function openHoldConfirm(assignmentId, opener) {
  const model = holdPreview(assignmentId);
  if (!model) return false;
  pending = { assignmentId: model.assignmentId, toHeld: model.toHeld };
  const doc = getDoc();
  const named = quoted(findAssignment(doc, model.assignmentId));
  const inTerm = model.termLabel ? ' in ' + model.termLabel : '';

  const title = document.getElementById(CONFIRM_TITLE_ID);
  if (title) {
    title.textContent = model.toHeld
      ? 'Hold ' + named + ' out of the grade?'
      : 'Commit ' + named + ' to the grade?';
  }
  const lead = document.getElementById(CONFIRM_LEAD_ID);
  if (lead) {
    lead.textContent = model.toHeld
      ? 'While it is held, ' + named + ' counts toward nothing in ' + (model.className || 'this class')
        + '. You can still type scores, flags and notes into it, and no grade, signal, past-due '
        + 'prompt or message home sees them until you commit it. A score changed while it is held '
        + 'keeps no history of the changes; the score it had before the hold is kept.'
      : 'Every score, flag and missing mark in ' + named + ' counts toward the grade from now on, as '
        + 'it stands. A score you change after this is kept in its history, the way any counted '
        + 'score is.';
  }
  const label = document.getElementById(CONFIRM_LABEL_ID);
  if (label) label.textContent = 'Grades that change' + inTerm;
  const list = document.getElementById(CONFIRM_CHANGES_ID);
  if (list) {
    list.textContent = '';
    if (!model.changes.length) {
      factLine(list, model.toHeld
        ? 'No student’s grade' + inTerm + ' changes — holding it moves nothing yet.'
        : 'No student’s grade' + inTerm + ' changes — committing it moves nothing.',
      'data-hold-none', '');
    }
    model.changes.forEach((c) => {
      factLine(list, c.name + ' — ' + c.before.label + ' → ' + c.after.label,
        'data-hold-change', c.studentId);
    });
  }
  const button = document.getElementById(CONFIRM_BTN_ID);
  if (button) button.textContent = model.toHeld ? 'Hold it out of the grade' : 'Commit it to the grade';
  const keep = document.getElementById(CONFIRM_KEEP_ID);
  if (keep) keep.textContent = model.toHeld ? 'Keep it counting' : 'Keep it held';
  openModal(CONFIRM_MODAL_ID, opener);
  return true;
}

/*
  YES. The writer for the direction the confirm was showing — and only if the column is still in the
  state the confirm described: a sync or another tab that flipped it in between makes the question
  stale, and a stale yes writes nothing. `{ wrote, assignmentId }` so src/shell.js can repaint the
  screens the column is drawn on and put the focus back on the grid's control.
*/
export function confirmHold() {
  const want = pending;
  pending = null;
  closeModal(CONFIRM_MODAL_ID);
  if (!want) return { wrote: false, assignmentId: '' };
  const doc = getDoc();
  const before = findAssignment(doc, want.assignmentId);
  if (!before || isHeld(before) === want.toHeld) return { wrote: false, assignmentId: want.assignmentId };
  const moved = (holdPreview(want.assignmentId) || { changes: [] }).changes.length;
  const wrote = want.toHeld ? holdColumn(want.assignmentId) : commitColumn(want.assignmentId);
  if (wrote) {
    announce(quoted(before) + (want.toHeld
      ? ' is held out of the grade. '
      : ' counts toward the grade now. ')
      + (moved ? plural(moved, 'grade', 'grades') + ' changed.' : 'No grade changed.'));
  }
  return { wrote: wrote, assignmentId: want.assignmentId };
}

/* NO. Nothing has been written — the preview was a clone — so there is nothing to undo. */
export function cancelHold() {
  const want = pending;
  pending = null;
  closeModal(CONFIRM_MODAL_ID);
  const assignment = want ? findAssignment(getDoc(), want.assignmentId) : null;
  if (assignment) {
    announce('Nothing changed. ' + quoted(assignment)
      + (isHeld(assignment) ? ' is still held out of the grade.' : ' still counts toward the grade.'));
  }
}
