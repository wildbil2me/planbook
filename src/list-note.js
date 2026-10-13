/*
  The list's note — the one line that says work arrived on a term's list from another term (WO-3.50),
  or that an assignment closed with no name took one (WO-3.56, in amber) — and the one paint that
  draws it on every screen that wears it (WO-3.66).

  ── ONE NOTE, NEVER A COPY ──

  The note is a VIEW STATE, `listNote`: `{ classId, termId, text, nameless? }`, held in this module
  and nowhere else — never in the document, never in `localStorage`. It was a `let` in
  src/assignments.js until WO-3.66, when the Scores screen needed to draw it too: a blank close of
  the editor opened from Scores' `+ New assignment` set the amber warning on a list the teacher was
  not looking at. The owner's ruling S1 (design/mockups/dialog-messages.html) is that Scores draws
  the SAME line, read from the same note — so the two screens can never disagree about it, and
  opening the editor clears it on both. A second note kept by src/scores.js would be a second truth, which is the work order's
  Trap in as many words.

  ── WHY A MODULE OF ITS OWN (WO-3.66, ruling (d)) ──

  The obvious shape — src/scores.js importing a paint out of src/assignments.js — closes an import
  loop: src/assignments.js imports src/held-column.js, which imports src/scores.js (formatPercent and
  gridOrder). wo-sweep.mjs does not look for loops, so nothing would have said so. This file is the
  shape src/past-due.js already has with `[data-past-due]`: one module, one paint, every host filled
  from it. It imports src/classes.js and nothing else, and it must never import src/assignments.js or
  src/scores.js — both of those import it.

  ── THE HOSTS ──

  Every screen that wears the note carries an empty `[data-list-note]` element. Two today: the
  assignment list's `#assignmentsMoved` and the score grid's `#scoresMoved`, which sits after the
  past-due prompt and before `#scoresTop` — OUTSIDE that row, because src/scores.js hides it in every
  "nothing to grade" state and the note can coexist with one of them, a class with no roster (ruling
  (e)). A third screen costs one element in the markup and no line here.

  ── WHEN IT IS DROPPED, AND WHY A SCORES VISIT CAN DROP IT ──

  paintListNote() keeps the note only while the class and the term it is about are the selected
  ones, and drops it the first time they are not — so going back to that term later does not bring
  back a note about a move the teacher has long since read. That rule was the list's alone before
  WO-3.66 and is now both screens': a Scores render on another class or term drops it as a list
  render would. That is decided rather than inherited. The selection is ONE fact shared by both
  screens (src/classes.js), read here at paint time and never handed in, so neither screen can paint
  against a class or term older than the one the other would — there is no "Scores rendered the
  previous term first during the editor's close" for this to trip on: the close selects its term
  before it repaints anything (src/assignments.js settleEditor(), src/shell.js afterEditorSettled()).
  What changes is narrow and on purpose: a note set from a screen that draws neither host (the
  calendar or a student's page, with the editor not following its term) used to survive a Scores
  visit on another term and now does not. A note is drawn only while its term is up — on either
  screen now — and a Scores screen on another term is that term not being up.

  THE SETTERS DO NOT PAINT. A note can be set for a term that is not the one up — the editor closed
  from a screen it does not follow — and a paint at that moment would drop it before the teacher
  reached the list it is about. The caller repaints its screen when its screen is up, as it always
  did. clearListNote() is the exception, because clearing cannot drop anything that should stay:
  it empties every host at once. Today its callers also re-render the list, whose paint reaches both
  hosts anyway (a mutation that took this draw out stayed green — WO-3.66's TESTING.md section), so
  the draw is what makes "opening the editor clears it from both screens" true of the clear itself
  rather than of whatever its caller happens to repaint next.
*/

import { getSelectedClass, getSelectedTerm } from './classes.js';

const HOST_SEL = '[data-list-note]';

let listNote = null;

/* Every host, drawn from `listNote` as it stands. The element is reused, so the amber modifier is set
   for the nameless warning and taken off on every other draw (WO-3.56) — a moved-work note drawn
   after a warning would otherwise inherit its amber. */
function drawHosts() {
  Array.prototype.forEach.call(document.querySelectorAll(HOST_SEL), (el) => {
    el.textContent = listNote ? listNote.text : '';
    el.classList.toggle('hidden', !listNote);
    el.classList.toggle('assign-moved-nameless', !!listNote && !!listNote.nameless);
  });
}

/*
  THE PAINT, called by each screen's own render — src/assignments.js's renderAssignments() and
  src/scores.js's renderScores() — with nothing: it asks src/classes.js which class and term are up,
  exactly as paintPastDue() does. Drops the note when they are not the ones it is about.
*/
export function paintListNote() {
  const cls = getSelectedClass();
  const term = getSelectedTerm();
  const termId = term ? term.id : '';
  if (listNote && !(cls && listNote.classId === cls.id && listNote.termId === termId)) listNote = null;
  drawHosts();
}

/* WORK THAT ARRIVED ON THIS TERM'S LIST (WO-3.50, WO-3.57): indigo. Replaces any note standing. */
export function noteMovedWork(classId, termId, text) {
  listNote = { classId, termId, text };
}

/*
  THE NAMELESS WARNING (WO-3.56, ruling 5): amber, `warning` first. `moved` is the moved-work
  sentence when the same close also moved the work; when it did not, a moved-work note already up
  for this same list — a create that took the list onto today's term — is kept behind the warning
  rather than replaced by it, because it is still true and it is the only sentence saying why the
  list is on a term the teacher did not pick. The warning's words are src/assignments.js's and are
  handed in, so they stay in one place.
*/
export function noteNameless(classId, termId, warning, moved) {
  const standing = !moved && listNote && !listNote.nameless && listNote.classId === classId
    && listNote.termId === termId ? listNote.text : '';
  const after = moved || standing;
  listNote = { classId, termId, nameless: true, text: warning + (after ? ' ' + after : '') };
}

/* Takes the note down everywhere at once, and says whether there was one — the editor's open
   (src/assignments.js beginSession(): "a note about an earlier move is not about the row now being
   edited") and the create's Cancel. */
export function clearListNote() {
  const had = !!listNote;
  listNote = null;
  drawHosts();
  return had;
}
