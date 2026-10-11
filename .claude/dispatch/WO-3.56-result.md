# WO-3.56 — an assignment needs a name, and an unnamed one takes one when it is opened · implementer's result

**Implementer** Claude (Opus), 2026-10-10, **killed by a machine crash** before it reported. **Last mile**
finished by the orchestrating session on 2026-10-11, at the owner's direction. Nothing committed.

## What happened

The implementer's code and harness checks were all on disk. It had not yet written `TESTING.md`, the
`tools/README.md` call-site count or this file, and `--handoff` had not run. The orchestrating session
checked the tree in this order:

1. `grep -rn MUTATION` and a diff scan: no planted mutation, no TODO.
2. Line endings and the diffstat: nothing deleted that the work order did not ask for.
3. `node tools/verify-shell.mjs`: green.
4. `node tools/wo-sweep.mjs`: one failure, the stale count.

Then it wrote the three missing pieces and ticked the boxes its own run closed. **No line of `src/`,
`index.html`, `sw.js` or the harness was changed after the crash.**

## What was built (as found in the tree)

- **`src/assignments.js`**:
  - `UNTITLED_ASSIGNMENT` is exported and replaces three quoted copies inside this file. The copies in
    other modules are left alone, as the work order's scope says.
  - `nameIsBlank()` treats whitespace as blank.
  - An existing unnamed assignment is named on open, in the editor and in Duplicate. A create is never
    named this way.
  - `applyPlan()` names a blank assignment on any close that is not Done and sets the amber list note
    (`setNamelessNote()`).
  - `settleEditor(follow, door)` refuses a blank name for `'done'` and `'copy'`.
  - The copy dialog's confirm is disabled while its name is blank (`copyReady()`). A copy names an
    unnamed source in the same `update()`.
- **`src/shell.js`**:
  - `[data-assignment-done]` is answered ahead of the generic `[data-modal-close]`.
  - Keep, in the term-move confirm, now chains `afterEditorSettled()`.
  - The hook table is updated.
- **`index.html`**: the editor's Done gains `data-assignment-done` and keeps `data-modal-close`.
- **`src/assignments.css`**: the `.assign-moved-nameless` amber modifier.
- **`sw.js`**: `CACHE` bumped from v182 to v183.
- **Harness**:
  - Seven new checks in `tools/verify/copy-class.mjs`.
  - WO-3.50's *Done on that new assignment* check in `tools/verify/assignments.mjs` now types a name
    before Done, because Done refuses a blank one.
- **Written in the last mile**:
  - `TESTING.md` § WO-3.56.
  - `tools/README.md`: the call-site count from 1946 to 1953, plus a WO-3.56 paragraph.
  - The phase file: Acceptance lines 1–6 and 8 ticked.

## Decision the verifier should read

**The create door ('copy') refuses a blank name**, the same as Done. The work order's Traps left this
open. The argument is in the comment above `settleEditor()`. In short, the alternative stores
*Untitled assignment* and opens the copy dialog already enabled, which brings back the nameless copies
that ruling 1 exists to stop.

## Acceptance, line by line

Lines 1–6 are closed by the seven WO-3.56 checks. The evidence for each is in `TESTING.md` § WO-3.56.

- Line 7 (👤, the iPad) is open and owed to the owner.
- Line 8 (`CACHE`) is closed.

## Runs

- `node tools/verify-shell.mjs`: `1957 checks · 1957 passed · 0 failed · 0 skipped`, 1025s, `EXIT=0`,
  2026-10-11.
- `node tools/wo-sweep.mjs`: `50 checks · 47 passed · 0 failed · 3 to review` (the usual three),
  2026-10-11.

## Not done

- **No mutation round.** The verifier should decide whether one is owed. Possible targets: the
  `door` check in `settleEditor()`, `nameIsBlank()`'s trim, and the amber toggle in `paintListNote`.
- **`CHANGELOG.md`** is left to the maintenance protocol.
