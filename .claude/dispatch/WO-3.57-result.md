# WO-3.57 — result

**Implementer:** Claude Opus (work-order-implementer), 2026-10-11. Nothing committed.

## Summary

The calendar's due-date chip now takes the assignment list to the assignment's **`termId`** before the
editor opens. It stores that term in `planbook_openTermIds` and draws the indigo arrival note, *"This
list has moved to Q2, the term "Persuasive essay" is due in."*. A blank close from that door then
shows the amber warning with the arrival note after it, on one line. Both runs passed: harness
2012/2012, and a second 2012/2012 after the mutation round was reverted; sweep 47 passed, 0 failed,
3 to review (the standing three).

**One finding contradicts the work order's premise, and it leaves Acceptance lines 1 and 3 open.**
The Scores screen does have a door into the editor: `+ New assignment` in `#scoresActions`
(`index.html` ~line 1322), on the same `data-assignment-new` hook. Its markup comment says it
"performs the same create action as the assignment list's button". A blank close from it writes
the name and sets the warning on the list's note, `#assignmentsMoved`. That element exists only in
`#assignmentsView`, so on the Scores screen the warning goes to the live region and is not drawn
anywhere. It does appear later, the next time that class's list is opened on that term. I did not
fix this, because no ruling says where a warning goes on the grid. It is the owner's call: a fix
under a new row, a ruling that the delayed warning is enough, or a re-cut of lines 1 and 3.

## Acceptance, line by line

1. **[ ] Every door named, with whether a blank close shows the warning; the Scores screen named as
   having no door today.** — **Left open.** `TESTING.md` § WO-3.57 has a table naming every door,
   read from the code:
   - the name on a list row;
   - `+ New assignment` on the list;
   - the calendar's due date;
   - **`+ New assignment` on Scores** — a blank close from it shows no warning on screen;
   - no other control on Scores opens the editor.

   The second sentence of the line cannot be written truthfully. Evidence: `grep -n
   "data-assignment-new" index.html` finds two buttons (lines 1131 and 1322), and `grep -n
   "assignmentsMoved" src/*.js index.html` finds the note host only in the assignments view.
2. **[x] Calendar door from another term: the list moves, the term is stored, an indigo note; on the
   same term, no note and the stored term unchanged.**
   - Evidence is three new `PASS` checks in `tools/verify/copy-class.mjs`, driven through the real
     controls: the term tab, the class's Calendar pill, the real pager, and the chip found by
     `data-calendar-ref`.
   - **Move case:** stored term, open term and active tab all `tm349_src2`; the note is the exact
     sentence; all four computed colours are indigo, with no amber class. A plain ✕ afterwards keeps
     the note and `rev`.
   - **Same-term case:** note `""`, stored term still `tm349_src2`. On the real October clock,
     `openClassOn()`'s arrival had moved the term to Q1 on the way, so this is the non-trivial case.
   - **Traps case:** a row filed in Q1 and due in Q2 takes the list to Q1.
3. **[ ] A blank close from each door leaves the amber sentence on the list; from the calendar,
   started on another term, with the arrival note after the warning on the same line (DOM and
   computed style).**
   - **Met for the three doors the work order names.** One check reads `#assignmentsMoved`'s text,
     its class and its four computed colours.
   - **Calendar door:** the text is `NAMELESS + " " + arrival`, all four colours are amber, the list
     is on Q2 with the row on it, and the stored name is `Untitled assignment`.
   - **Row name and `+ New` on the list:** WO-3.56's own `clearedPost` and `byX` results, re-asserted.
   - **Left open** for the fourth door, Scores' `+ New`, which has a grid behind it and no list (see
     line 1).
4. **[x] `CACHE` bumped.** — `planbook-shell-v187` → `planbook-shell-v188`.

There are no 👤 or 📆 lines.

## Runs, quoted from output I read

- `node tools/verify-shell.mjs`, delivered tree:
  `2012 checks · 2012 passed · 0 failed · 0 skipped`, 64,252 lines, 1081s, `EXIT=0`.
- Mutation run, two plants at once (M1: the term the due date falls in instead of `termId`; M2:
  "already on that term" judged after the arrival instead of before the tap):
  `2012 checks · 2010 passed · 2 failed`, `EXIT=1`. The only failures were the filed-early check (M1)
  and the same-term check (M2).
- Reverted by copying the saved file back; `cmp` reported it identical, and `grep -rn "MUTATION
  WO-3.57" src index.html tools sw.js TESTING.md` came back empty.
- Post-revert run: `2012 checks · 2012 passed · 0 failed · 0 skipped`, 1085s, `EXIT=0`.
- `node tools/wo-sweep.mjs`: `50 checks · 47 passed · 0 failed · 3 to review`. This is after
  `tools/README.md`'s call-site line went 1996 → 2000; before that edit the sweep was red on exactly
  that line.

## Decisions the work order left open

- **One function in `src/assignments.js` (`openAssignmentFromCalendar(id, wasOnTermId, opener)`)
  rather than a `selectTerm()` in `src/shell.js`.** `openAssignmentEditor()` → `beginSession()`
  clears `listNote` on every open, which would wipe an arrival note set before the open. So the
  steps run in this order: select the term, open the editor, set the note, repaint once. The comment
  above the function argues this, and a comment in the `ASSIGNMENT_DUE` branch points to it. The
  selection is reached only from that branch; `openClassOn()` is untouched.
- **"Already on that term" means the open term before the tap.** `src/shell.js` reads it with
  `classes.getOpenTermId()` before `openClassOn()`, whose `resetRegistry()` → `openTermNearToday()`
  can move the term first. Mutation M2 shows that the other reading draws a note on a list that never
  moved.
- **"is filed in" instead of "is due in"** when the row's `termId` is not the term its due date falls
  in. In that case the owner's wording would be false, and it is exactly the Traps line's case.
- The arrival sentence is also sent through `announce()`, as a create's move does.

## Files changed

- `src/assignments.js` — new exported `openAssignmentFromCalendar()`.
- `src/shell.js` — the `ASSIGNMENT_DUE` branch.
- `sw.js` — v187 → v188.
- `tools/verify/copy-class.mjs` — four checks after WO-3.56's.
- `tools/README.md` — call-site count 1996 → 2000, plus a WO-3.57 count paragraph.
- `TESTING.md` — § WO-3.57.
- `plans/work-orders/phase-3-gradebook.md` — Acceptance lines 2 and 4 ticked; status left at
  🤖 CLAIMED.

## Not done, on purpose

- **`CHANGELOG.md`.** This is a draft for the teacher:
  > **Opening an assignment from the calendar shows it on its own list.** Tapping a due date on the
  > calendar used to open the assignment over whichever term that class's list was last on, so the
  > work you had just edited could be nowhere on screen when the editor closed, and a nameless
  > close's amber warning went with it. The list now moves to the term the assignment is filed in,
  > remembers it, and says so in the indigo note. Close it with no name and the warning leads that
  > same line.
- **The Scores screen's create door** (above). I noticed it and did not build anything for it.
