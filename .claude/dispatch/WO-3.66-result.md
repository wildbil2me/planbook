# WO-3.66 — result (implementer, Claude Opus, 2026-10-12)

A blank close from Scores' `+ New assignment` now shows the amber warning on the Scores screen, drawn from the same note the list uses. Six of seven Acceptance lines are met and ticked. The 👤 iPad line is open. Both tools are green on the delivered tree. Nothing is committed.

## What was built

- **`src/list-note.js` (new)** — ruling (d). It holds:
  - the one `listNote`, `{ classId, termId, text, nameless? }`;
  - three setters: `noteMovedWork()`, `noteNameless(classId, termId, warning, moved)` (it composes the warning with any moved-work note already standing, moved from `setNamelessNote()`) and `clearListNote()`;
  - one paint, `paintListNote()`, which fills every `[data-list-note]` host the way `src/past-due.js` fills `[data-past-due]`.
  - Its only import is `./classes.js`. The header comment explains why it exists (the loop through `src/held-column.js`).
- **`src/assignments.js`** — no `listNote` binding is left (`grep -n listNote src/assignments.js` finds nothing).
  - Every former `listNote = …` write now goes through a setter.
  - `paintListNote()` and `LIST_NOTE_ID` are gone.
  - `setNamelessNote()` is now a thin wrapper that passes `NAMELESS_WARNING` in, so the wording stays in this file.
  - `beginSession()` does `if (clearListNote()) renderAssignments();`.
- **`src/scores.js`** — imports `paintListNote` from `./list-note.js` and calls it right after `paintPastDue()`, above the "nothing to grade" return, so it draws even when there is no roster.
- **`index.html`**:
  - `#assignmentsMoved` gained `data-list-note`.
  - New host `<p class="assign-moved hidden" id="scoresMoved" data-list-note>` sits in `#scoresView` after `#scoresPastDue` and before `#scoresTop`, outside it (S1, ruling (e)). Both have markup comments.
  - No CSS changed: the line is the shipped `.assign-moved` / `.assign-moved-nameless`.
- **`sw.js`** — `CACHE` v194 → v195, and `./src/list-note.js` added to `SHELL` with a comment.
- **`tools/verify/copy-class.mjs`** — four new checks after WO-3.57's door checks (details under Acceptance).
- **`TESTING.md`**:
  - § WO-3.66 added under Phase 3.
  - § WO-3.57's door table: the Scores `+ New assignment` row is amended to *"drawn, on the Scores screen"*, pointing at § WO-3.66.
- **`tools/README.md`** — call-site line 2045 → 2049 (from the sweep's own count), plus a WO-3.66 paragraph after WO-3.65's.
- **`plans/work-orders/phase-3-gradebook.md`** — six non-👤 Acceptance boxes ticked. The status line was left alone, as the brief said.

## Acceptance, line by line

1. **[x] Blank close from Scores' + New assignment → amber sentence on Scores, between the past-due prompt and the summary row; the list shows the same note.**
   - Checked in `copy-class.mjs` through the real controls, reading `#scoresMoved`'s DOM and `getComputedStyle`, never the live region:
     - text equals the owner's sentence;
     - all four colours are amber: `rgb(138, 109, 26)`, `rgb(255, 248, 230)`, `rgb(224, 168, 0)`, and the top border colour.
   - Placement, checked two ways:
     - **In the markup:** after `#scoresPastDue`, before `#scoresTop`, not inside it, same parent.
     - **Drawn:** the past-due prompt's bottom is at 422, the note is 36px tall, and the summary row's top is at 482.
   - The past-due prompt was visible during the reading; a fixture plants a past-due blank and the check asserts it.
   - The list on the same term showed the same string, in amber.
   - PASS.
2. **[x] Create from Scores filed under another term → indigo on Scores; amber ahead of indigo when both apply.**
   - Scores opened on Q2 on the real October clock. The create filed into Q1 and the grid followed.
   - Scores showed the indigo `"The new assignment is in Q1, not Q2: …"`, and the list host had the same text.
   - After ✕ with a blank name, one amber element read: warning, then the create note. The list showed the identical string.
   - PASS.
   - Under a `--today` that no fixture term holds, the check's name says it was not exercised.
3. **[x] Opening the editor again clears it from both screens; another class or term does not draw it.**
   - The editor was reopened from the new column's head on the grid. With the editor still up, both hosts were bare (`"open":[true,"",""]`), and they stayed bare after it closed.
   - After a fresh blank close:
     - the Q2 tab left Scores bare, and back on Q1 it was still bare (dropped);
     - another class's tab (P4) with Scores up was bare.
   - PASS.
4. **[x] Class with no roster: the note draws on Scores, with `#scoresTop` hidden.**
   - P2 has no roster. Blank close from its list (the Scores button is inside the hidden row there), then the Scores pill.
   - `#scoresTop` is `.hidden` with height 0, and the empty line says there are no students.
   - The note is drawn at 36px in amber, outside the row.
   - PASS.
5. **[x] No import loop.**
   - `src/list-note.js` has one import, `./classes.js`.
   - A throwaway walker in my scratchpad (not added to the tree) found:
     - list-note reaches 11 modules, and neither `assignments.js`, `scores.js` nor itself;
     - `scores.js` neither imports nor reaches `assignments.js`.
   - Nothing in the repo checks this going forward; see the proposals below.
6. **[x] verify-shell and wo-sweep pass; `CACHE` bumped.**
   - `node tools/verify-shell.mjs`: `2061 checks · 2061 passed · 0 failed · 0 skipped`, 65,797 lines, 1101s, EXIT=0, real clock 2026-10-12. This run was on the delivered tree after both mutation rounds were reverted.
   - `node tools/wo-sweep.mjs`: `51 checks · 48 passed · 0 failed · 3 to review` (the standing three).
   - `node tools/wo-gate.mjs --audit`: PASS.
   - `CACHE` is v195.
7. **[ ] 👤 iPad, force-quit, upright: + New from Scores, ✕ with no name, the warning is noticed.**
   - **Not done.** I have no iPad. The harness shows the line is drawn, amber and in place, but not that a teacher's eye goes to it.

## Mutation rounds

Every plant was marked `MUTATION WO-3.66`. Files were copied aside first, copied back after, and `cmp` reported them identical. `grep -rln "MUTATION WO-3.66"` now finds only `TESTING.md` prose.

- **Run 1 — M2 (`clearListNote()` stops drawing) and M3 (`#scoresMoved` moved inside `#scoresTop`):** `2061 · 2057 · 4 failed`, EXIT=1.
  - M3 turned the checks for lines 1, 2 and 4 red (order false; on the empty roster `h: 0`). It also broke WO-3.60's first-drawn-row check.
  - **M2 stayed green; it is an equivalent mutant.** Both callers re-render the list right after the clear, and `renderAssignments()` → `paintListNote()` paints every host, including the Scores one.
  - I kept the draw in `clearListNote()` so the clear is true by itself, and its comment says this mutation stayed green.
- **Run 2 — M5 (paint never drops) and M6 (opening the editor does not clear):** `2061 · 2059 · 2 failed`, EXIT=1.
  - The line 3 check went red; its detail shows M6 in the `open` reading and M5 in the `term` and `cls` readings.
  - WO-3.57's same-term calendar check also went red under M6.

## The first run's red, and the fix

- The first full run had one failure: *every module reachable from index.html is precached by sw.js*. Nine modules read as missing.
- Cause: my comment inside `sw.js`'s `SHELL` array contained an apostrophe ("list's"), and `verify/precache.mjs` reads that array's quoted strings.
- Fix: reworded the comment. The check passed in all three later runs.
- This is recorded in `tools/README.md`'s WO-3.66 paragraph as a trap worth knowing.

## Decisions the work order left to me

- **The drop (the brief asked for a conscious call).**
  - The list's rule is kept: the first paint on another class or term drops the note. Because both screens now paint, a Scores render on another class or term drops it too.
  - The paint reads the selection from `src/classes.js` at paint time and is never handed a class or term, so neither screen can paint against an older selection than the other. The editor's close selects its term before anything repaints.
  - One narrow change in behaviour: a note set while on the calendar or a student page used to survive a Scores visit on another term, and now does not.
  - This is written at the top of `src/list-note.js` and in TESTING.
- **Setters do not paint.** Painting at set time would drop a note set for a term that is not on screen (the editor closed from a screen it does not follow). Only the clear paints, because a clear cannot drop anything that should stay.
- **Naming I chose (no precedent existed):**
  - module `src/list-note.js`, hook `data-list-note`;
  - Scores host id `scoresMoved`, mirroring `assignmentsMoved`;
  - the internal binding is `listNote`, to match the work order's wording.

## Noticed but left alone (out of scope)

- `plans/work-orders/README.md` running-order row 171 still says WO-3.66 is "not ruled", with Open lines. The brief said the work order's own text governs; that row is stale for the orchestrator or tick to fix.
- **Proposed follow-up:** a `wo-sweep` check for import cycles under `src/`. Ruling (d) exists because nothing catches a loop, and line 5 is held only by my one-off walk.
- `CHANGELOG.md` was not touched, per the brief. Draft entry for the teacher:
  > The Scores screen now shows the assignment list's note. Close a new assignment there without naming it and the amber "saved without a name" line appears at the top of the grid, under the past-due prompt. A new assignment that lands in another term says so in indigo, as the list does. Opening the editor again clears it on both screens.

## Files changed

- `c:\dev\planbook\src\list-note.js` (new)
- `c:\dev\planbook\src\assignments.js`
- `c:\dev\planbook\src\scores.js`
- `c:\dev\planbook\index.html`
- `c:\dev\planbook\sw.js`
- `c:\dev\planbook\tools\verify\copy-class.mjs`
- `c:\dev\planbook\tools\README.md`
- `c:\dev\planbook\TESTING.md`
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` — Acceptance ticks only. The status-line diff is the orchestrator's claim and was already there.
- `c:\dev\planbook\.claude\dispatch\WO-3.66-result.md` (this file)
