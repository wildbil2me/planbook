# WO-3.67 — result (second dispatch): built; green clean, red mutated, reverted

**Verdict.** I built the re-cut as it was booked, and all four Acceptance lines are met on evidence I
read myself. I ticked no box and did not change the status (`🤖 CLAIMED`), as the dispatch instruction
asked. Nothing in `src/` changed, so no `CACHE` bump is owed.

## What changed

- `tools/verify/copy-class.mjs` § "Acceptance 4: a class with no roster". After the existing blank close
  on P2's list and its reading (`s4list`), the fixture does three things:
  - It blanks `#scoresMoved` over `evalJs`: empty `textContent`, `hidden` added, `assign-moved-nameless`
    removed.
  - It reads both hosts (`s4emptied`).
  - It goes home → P2's card → `#classView [data-class-screen="scores"]`, with a reading at home
    (`s4home`) and one on the card's landing screen (`s4card`).

  The old `scoresPill()` straight from the list is gone. That was the route that let the list's paint
  stand in for Scores'. All the existing assertions are kept unchanged, in the same check. The new
  ones, added beside them:
  - the blank returned 1, and the Scores host reads `""` at height 0 afterwards;
  - the list host still holds `NAMELESS`, which proves the note was not dropped;
  - home is `homeView` with the Scores host empty;
  - the card lands on `classView` for P2 with the Scores host still empty, so no `assignmentsView` came
    between the blank and Scores.

  The check label gained a closing clause naming the route and WO-3.67. A comment above the route says
  why it is not a detour through another class or term, and why there is no `+ New assignment` door.
- `TESTING.md` § WO-3.67, under Phase 3 after § WO-3.66: what was built, the four Acceptance lines
  verbatim, and the evidence under each. The boxes are left unticked.

## Against the Acceptance list

1. **The check reaches the no-roster Scores with the host emptied by the fixture and no list rendered
   after it, and passes.** Met. `node tools/verify-shell.mjs`: `2061 checks · 2061 passed · 0 failed ·
   0 skipped`, 1107s, `EXIT=0` (read from the log's own line). The check prints
   `"emptied":[1,"assignmentsView","",0,"“Untitled assignment” was saved without "]` and
   `"route":["homeView","","classView","c_wo349_p2",""]`, and its final reading shows the amber note at
   36px with `#scoresTop` hidden and h 0.
2. **Mutated, it goes red; reverted; the red is recorded in TESTING.md.** Met.
   - I replaced `paintListNote();` at `src/scores.js:1220` with a `MUTATION WO-3.67` comment. The run
     gave `2061 checks · 2057 passed · 4 failed`, 1103s, `EXIT=1`.
   - The reworked check FAILs with the Scores host `""` at h 0, the **list host still holding the
     note**, and the same `emptied`/`route`. So the note was alive and only Scores' paint was missing.
     The other three reds are WO-3.66's lines 1–3, as in WO-3.66's own mutation.
   - Reverted with `git checkout -- src/scores.js`. `cmp` against a pre-plant copy reads identical.
     `grep -rn MUTATION src tools` was run before any prose was written. It found only pre-existing
     hits (`src/shell.js:1070`, `tools/README.md`, `keys-legend-guards.mjs`, `outreach.mjs`,
     `score-grid.mjs`, `score-search.mjs`, `wo-gate.mjs:2800`).
3. **`verify-shell.mjs` and `wo-sweep.mjs` pass.** Met.
   - The verify-shell figures are under item 1. That clean run came *before* the mutation. The tree it
     ran on is byte-identical to the delivered tree: `src/scores.js` was restored and `cmp`'d, and
     nothing else in the tree was touched between the run and now except `TESTING.md` and this file,
     which the harness does not read as app code. I did not run a third full harness run after the
     revert. That is why this is stated as identity rather than as a fresh run.
   - `node tools/wo-sweep.mjs`: `52 checks · 49 passed · 0 failed · 3 to review`, exit 0. The 3 are the
     standing reviews. The sweep was run before the mutation and again after the revert.
4. **The TESTING.md section carries the lines verbatim with evidence.** Met. It is written, and the
   lines were copied from the brief's § 1.

No 👤 or 📆 lines are on this work order.

## Decisions and notes

- **The CHANGELOG entry was not written.** The work order's Deliverables list "the `CHANGELOG.md`
  entry". The brief's § 3 and my standing instructions both say to leave it to the teacher, so I left
  it out. Draft, if wanted:
  > *Test-only.* WO-3.66's check that the warning draws on a no-roster class's Scores screen now
  > empties that screen's line itself and arrives from home, so it fails if the Scores screen ever
  > stops drawing the line on its own. It used to pass on the strength of the assignment list having
  > drawn it first. Nothing a teacher sees changed.
- **The trip home dropped nothing.** The Traps worried it might. The `s4card` reading's list host still
  carries the note, and Scores redrew it in the clean run. `afterClassChange()` and `home.refreshHome()`
  call no `paintListNote()`. Only `renderAssignments()` and `renderScores()` do.
- **I kept it one check rather than adding a second.** The Deliverable says the existing assertions
  stay, and this is the same claim with a stronger route. As a result the `tools/README.md` call-site
  count does not move, and § 22 / § 11 stay green.
- The harness took ~18.5 min a run (1107s clean, 1103s mutated), consistent with the first dispatch.

## Files changed

- `c:\dev\planbook\tools\verify\copy-class.mjs`
- `c:\dev\planbook\TESTING.md`
- `c:\dev\planbook\.claude\dispatch\WO-3.67-result.md` (this file)

`src/` is untouched, and so is `plans/work-orders/phase-3-gradebook.md` (its diff was already in the
tree when I started). Nothing was committed.
