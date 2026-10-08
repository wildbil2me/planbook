# WO-3.52 — result (implementer, Claude Opus)

**Outcome:** built and verified. All seven Acceptance lines are ticked in
`plans/work-orders/phase-3-gradebook.md`, and none of them is a 👤 or a 📆 line. The status line still
reads `🤖 CLAIMED`, because `--tick` and the status belong to the pipeline. Nothing is committed.

## Files changed

- `c:\dev\planbook\src\grade-engine.js`: `isHeld(assignment)` is exported and is the only code that
  reads `.held`. Only `held === true` holds. It is filtered at `assignmentsFor()` and at
  `looseAssignments()`, each with a comment saying why. There is no filter anywhere else in the engine.
- `c:\dev\planbook\src\score-history.js`: `reviseCell(old, next, now, column)` takes a new fourth
  argument, `{ held, committedAt }`. The held path and the post-commit boundary are explained in a
  comment above the function, with a one-line pointer from the file header. The file has no new
  import and no new export.
- `c:\dev\planbook\src\scores.js`: `putCell()` looks up the assignment and passes
  `{ held: isHeld(a), committedAt: a.committedAt }`. It imports `isHeld` from the grade engine.
- `c:\dev\planbook\src\past-due.js`: the accept write passes the same object, built from the
  assignment in the document being updated. It imports `isHeld`.
- `c:\dev\planbook\sw.js`: `CACHE` goes from v169 to v170.
- `c:\dev\planbook\docs\data-model.md`:
  - `held` and `committedAt` are added to the assignment sketch.
  - A paragraph on the history rule for held columns sits under the score cells.
  - A new section, *Held columns*, sits under the grade math, ahead of *Extra credit*.
- `c:\dev\planbook\tools\verify\grade-engine.mjs`: 4 new checks.
- `c:\dev\planbook\tools\verify\score-history.mjs`: 5 new checks.
- `c:\dev\planbook\tools\README.md`: the call-site count goes from 1826 to 1835, plus a WO-3.52
  paragraph with the executed count.
- `c:\dev\planbook\TESTING.md`: a new § WO-3.52 with its boxes, the decision below, and the mutation
  table.
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md`: the 7 Acceptance boxes ticked.

## The decision the work order did not settle (please read)

Ruling 1 contradicts its own Acceptance line.

- **What the ruling says:** the window "starts at whichever is later, the cell's `at` or the column's
  `committedAt`".
- **What Acceptance line 3 asks:** a cell typed at T, committed at T+2m and changed at T+3m must
  **push**.
- **Why the two clash:**
  - Read literally, the window opens at T+2m, so the change at T+3m is one minute inside it. It would
    replace the cell and drop the 72.
  - Measuring from `at` alone (the mutation the line asks for) also replaces.
  - So the literal reading fails the line, and its mutation could not be told apart from it.

**What I built:** the commit is a version boundary.

- A cell last written at or before `committedAt` is the committed version, and the next change pushes
  it. This is the same thing a cell with no `at` already does.
- A write after the commit opens an ordinary window from its own `at`. That `at` is the later of the
  two times, so "starts at whichever is later" still holds for that write.

This satisfies the Acceptance line, the ruling's 9:00/9:02/9:03 example, and its stated purpose. A
cell stamped in the same second as the commit counts as before it, because stamps only record whole
seconds and an extra history entry is cheaper than losing a committed score. I wrote it down above
`reviseCell()`, in `docs/data-model.md` and in `TESTING.md`. If the owner meant something else,
Ruling 1's wording needs changing; the code is a one-line change.

## Acceptance, line by line

1. **[x] A held column's scores, `missing` and `excused` move no grade.** Three checks in
   `grade-engine.mjs` cover a weighted class, a points class, and a points class's uncategorized work.
   Each one asks `classGrade`, `categoryPercentage` and `letterFromPercentage` twice: once on the
   document as written, and once with `held` deleted. Every expected value is a literal I worked out
   by hand.
   - Held: all three students are at 90% A.
   - Live, weighted: Ada 72.5% C (category 55%), Ben 67.5% F (category 45%).
   - Live, points: Ada 66.67% F, Ben 60% F.
   - **On `excused`:** an excused cell is in neither total whether its column is held or live, so
     deleting `held` cannot "move" it. The checks assert that Cy (excused) reads 90% A both ways and
     say so in the check name, rather than claiming a movement the grade math rules out. I ticked the
     line on that reading; a verifier may want to look at that word.
2. **[x] A held cell edited three times leaves no `was`.** The edits are 10 minutes apart. On a live
   column the same three edits push three versions, which I check as the control. After a commit at
   9:31, the edit at 9:37 pushes the committed 78 with its `at`.
3. **[x] Ruling 1.** Typed at 9:00, committed 9:02, changed 9:03: the 72 is pushed. A change at 9:04
   then replaces the 75 and pushes nothing more.
   - Mutation-proved in a **throwaway copy under the scratch directory, never in the working tree**:
     `const sealed = false`, which measures from `at` alone.
   - With the mutation: `80 checks · 79 passed · 1 failed`, and the one red was the Ruling 1 check,
     reading `{"v":75,"at":"NOW"}` with no `was`.
   - Control copy without the mutation: `80 checks · 80 passed · 0 failed`.
   - The subset run was year-document-store, grade-engine and score-history.
4. **[x] Ruling 2.** I used a live cell with a two-version trail, one of whose entries has a key order
   that `versionOf()` would never write. I held the column and edited it three ways: outside the
   window, back to its last version inside the window (which would pop on a live column), and blanked.
   After every edit, `JSON.stringify(was)` is identical to the stored trail, and the blanked cell is
   kept as `{v:null, at, was}`.
5. **[x] An older document restores with every column live.** After `score-history.mjs`'s real
   restore of its earlier-shape backup, `isHeld()` is false for every assignment on the page, and none
   has a `held` or `committedAt` key.
6. **[x] `reviseCell()` with no fourth argument behaves as before.** There are 11 cases with literal
   expected answers, covering every rule in WO-3.33. Passing `undefined`, `{}` and `{held:false}`
   gives identical answers. WO-3.33's own 15 grid checks run **unedited** and pass on the delivered
   tree.
7. **[x] `CACHE`:** `planbook-shell-v169` becomes `planbook-shell-v170`.

There is a second mutation as well, the held filter deleted at both choke points (M2), in a scratch
copy: `80 checks · 77 passed · 3 failed`, the weighted, points and uncategorized checks each reading
held equal to live. It is recorded in `TESTING.md`.

## Final totals (all read from finished output)

- **`node tools/verify-shell.mjs`** on the delivered tree:
  `1841 checks · 1841 passed · 0 failed · 0 skipped`, 58,262 lines, 31.6 lines per check, 835s,
  `EXIT=0`. The previous count was 1832; this adds 9.
  - An earlier full run was **killed** by me, not left to finish. Its subset twin had already shown
    two float-comparison reds in my new checks (55.00000000000001 compared against 55). I fixed them
    by rounding to six places in the check, then reran in full.
- **`node tools/wo-sweep.mjs`** (after all edits): `48 checks · 45 passed · 0 failed · 3 to review`,
  `EXIT=0`.
  - The 3 items to review are identical to the run before any of my edits (diffed).
  - § 28 is green unchanged: still 5 exports, and `reviseCell` is still imported only by
    `src/past-due.js` and `src/scores.js`.
  - § 11 is green at 1835.
- **`node tools/wo-gate.mjs --audit`:** PASS.
- **`grep -rn MUTATION src/ tools/`** is **not empty**. It returns 19 lines, and they are the same 19
  comment and prose lines `git grep MUTATION HEAD -- src tools` returns at HEAD. `git diff -- src tools
  sw.js | grep -c MUTATION` is **0**, so this work order left no mutation behind. The two mutations
  only ever existed in scratch copies, which are now deleted.

## What I could not verify

Nothing in this work order needs an iPad or human eyes. It draws nothing, and no build can write
`held` yet.

## Notes and things I declined

- **Possible tension in Ruling 2, flagged for the owner, not acted on.** The ruling says held edits
  "replace the current version and push nothing". So a live 88 that already counted, held and then
  edited to 90, is replaced. After commit the trail does not show the 88. That is what the ruling and
  Acceptance line 4 say, so I built it that way. It does sit a little awkwardly next to "Holding a
  column must never be a way to make a revised score disappear". The ruling protects the existing
  `was`, but not the live current version at the moment of holding. WO-3.46's writer could push the
  current version at hold time if the owner wants it kept.
- **The new harness checks reach `reviseCell()` through `import()`** of the module the page already
  loaded. I did not add a `window.planbook` seam, because a seam in `src/shell.js` would have been a
  third importer that § 28 forbids. This is the first `import()` in `tools/verify/`, and the README
  paragraph says so.
- **`past-due.js` still offers to mark blanks in a held column missing.** That is WO-3.53's (readers
  that hide a held column), and it is out of scope here. The write itself goes through the held rule
  correctly.
- **`openWork()` loses held columns.** That is intended and was not worked around.

## CHANGELOG draft (the teacher decides)

> The grade engine now understands a *held* column: an assignment marked `held` counts toward no
> grade, category or letter, in either grading mode, and edits to its scores leave no history until
> it is committed — at which point the committed score is the first thing a later change keeps. A
> column that already had a history keeps it untouched while held. Nothing in the app can hold a
> column yet; that arrives with WO-3.46.

---

## Correction round 1 (implementer, Claude Opus, 2026-10-08)

**Outcome:** the owner's amendments to Rulings 1 and 2 are built and verified on the uncommitted tree.
Acceptance line 4, unticked by the amendment, is ticked again on the evidence below. All seven boxes
now read `[x]`; none is a 👤 or 📆 line. The status stays `🔍 AWAITING VERDICT`. No `--start`,
`--release`, `--handoff` or `--tick` was run, and nothing is committed.

### What changed

- **Ruling 1 needed no code.** The comment above `reviseCell()`, `docs/data-model.md` and `TESTING.md`
  now state "the commit is a version boundary" as the owner's ruling, confirmed 2026-10-08, rather
  than as a reading waiting on him. `TESTING.md` keeps the old wording as history in one italic
  sentence.
- **Ruling 2, a hold is a version boundary:**
  - `src/score-history.js`: `reviseCell()`'s fourth argument is now `{ held, heldAt, committedAt }`.
    A new private helper, `countedBefore(cell, heldAt)`, decides whether the stored cell held a
    score that counted before the hold.
  - When it did, the held branch appends `versionOf(old)` to the stored `was`. The stored entries
    are not re-read through `versionOf()`, so they stay byte for byte.
  - Later held writes find a cell stamped after `heldAt` and push nothing.
  - A blank as the first held write keeps `{ v: null, at, was }`.
  - A held cell blanked with no past and nothing to push is still deleted.
  - The block comment above `reviseCell()` is rewritten around the owner's principle, and the file
    header's exceptions line names the hold.
  - No new import, no new export, so § 28 stays green.
- **The callers:** `src/scores.js` `putCell()` and `src/past-due.js`'s accept both pass
  `heldAt: assignment ? assignment.heldAt : undefined`. Their comments now say they hand over the
  hold and commit stamps and decide nothing with them.
- **`docs/data-model.md`:**
  - `heldAt` is in the assignment sketch.
  - The score-cell history paragraph is rewritten as "A hold and a commit are version boundaries".
  - § Held columns gains a `heldAt` bullet.
  - § Held columns also gains the principle, in the owner's terms: every score that counted toward
    a grade appears in the trail and versions that never counted do not, with the WO-3.33 five-minute
    window as the one deliberate exception.
  - The "nothing writes it yet" line names `heldAt`.
- **`tools/verify/score-history.mjs`:**
  - The line-2 fixture now carries `heldAt` (8:59), so it tests a cell *first typed while held*
    instead of relying on a missing stamp. Its check name says so. The narrowed line matches what the
    check asserts.
  - The Ruling 2 check is rewritten in place for the amended line.
  - **One new check** covers the boundary's edges.
  - The old "blanked with no past" and "no-op" assertions moved into the new check, with fixtures
    typed after the hold.
- **`TESTING.md` § WO-3.52:** new rulings section, rewritten boxes for lines 2 and 4, a new box for
  the edges, the round-1 mutation table, and the new full-run line.
- **`tools/README.md`:** the count goes from 1835 to 1836, plus a correction-round sentence with the
  executed count.
- **The phase file:** line 4 is ticked. No other edit; the owner's text is untouched.
- **`sw.js`:** stays at `planbook-shell-v170`. Nothing was committed at v170, so the first build's
  bump still covers this change.

### Decisions the corrected work order left open

1. **What counts as "a value" at the hold boundary: a value or a flag.** These are the two fields
   the grade math (`tally()`) reads.
   - A `missing` with no number counted as a zero, and an `excused` took the work out of the
     denominator. Both are pushed. A scoreless `late` is pushed too, as a flag the teacher set.
   - A cell holding only a note, or a blank kept for its past (`{ v: null, at, was }`), counted
     toward nothing. It pushes nothing, and its trail is frozen as it stands.
   - Why: the work order says "the score a cell held… blank included". I read "blank included" as
     being about the *edit*, which matches the coordinator's "that includes blanking". I applied the
     principle "every score that counted appears in the trail, and versions that never counted do
     not" to the stored cell.
   - The check asserts `missing`, `excused` and note-only explicitly.
2. **A missing `heldAt` pushes nothing.** This follows the shape text: "read as held from before any
   cell was typed". A missing `at` *with* a `heldAt` counts as before the hold, per the coordinator.
3. **Same second counts as before at both boundaries.** Both are compared as parsed instants
   (`Date.parse`), the way the window already is.
   - The known cost: a held write made in the very second of the hold, followed by another held
     write, keeps the first as a spare entry.
   - That spare is a version that never counted. It is unavoidable at one-second granularity without
     a cell marker, which the Traps forbid.
   - It is stated in the comment above `reviseCell()`. The same applies to a write in the commit's
     own second.
4. **After a commit, the trail's key order is normalised.** The first live write re-reads earlier
   versions through `versionOf()`. That is WO-3.33's existing behaviour, not changed here.
   "Byte for byte" is asserted across the held edits, which is what the line asks for. The
   post-commit leg compares against a literal in the data model's key order. The check carries a
   comment saying so.

### Acceptance line 4: evidence

**The new check, Ruling 2 as amended.** A live 88 at 8:58 sits over a two-version trail, with one
entry in a key order `versionOf()` never writes. The column is held at 9:00. The 88 is then edited
three times:

- **9:01**, inside the 88's own window:
  - Control: the same edit on a live column replaces, and leaves `was.length === 2`.
  - Held: `was` is the old trail byte for byte plus `{ v: 88, at: 8:58 }`.
- **9:02 and 9:20:** `JSON.stringify(was)` is unchanged.
- **Blank as the first held edit:** `{ v: null, at: NOW, was: <same> }`.
- **Commit at 9:30, change at 9:31:** the trail reads the old two, then 88, then the committed 92.

**The new boundary check**, against a 9:00:00 hold with every edit at 9:00:30:

| Cell | Result |
|---|---|
| Stamped 9:00:00 (same second) | pushed |
| Stamped 9:00:01 | not pushed |
| No `at` | pushed |
| Column has no `heldAt` | not pushed |
| `missing` with no number | pushed |
| `excused` with no number | pushed |
| Note only | not pushed |
| Typed after the hold, then blanked, no past | deleted |
| No-op write | `{ write: false }` |
| After a 9:00:00 commit, cell stamped 9:00:00 | pushed |

**Mutation round.** Every mutant ran in a throwaway copy of the final tree under the session scratch
directory, never in the working tree. Each copy ran a three-section subset: `year-document-store`,
`grade-engine` and `score-history`. All copies are now deleted. Every result below was read from
finished output.

| Run | Result |
|---|---|
| Control (no mutation) | `81 checks · 81 passed · 0 failed · 0 skipped`, EXIT=0 |
| **M3**, the first build's rule: `countedBefore(...)` → `false`, so held edits never push | `81 · 79 passed · 2 failed`: the amended Ruling 2 check and the boundary check |
| M4: `stamped <= hold` → `<` (same second read as after the hold) | `81 · 80 · 1`: the boundary check |
| M5: `stamped <= committed` → `<` (same second read as after the commit) | `81 · 80 · 1`: the boundary check |
| M1 re-run: `sealed = false` | `81 · 79 · 2`: the Ruling 1 check, plus the boundary check's commit-second edge |

### Final totals (all read from finished output)

- **`node tools/verify-shell.mjs`, full, on the working tree:**
  `1842 checks · 1842 passed · 0 failed · 0 skipped`, 58,319 lines, 31.7 lines per check, 854s,
  `EXIT=0`. It ran after the last edit to any file under `src/` or `tools/verify/`. Only prose files
  (`TESTING.md`, `tools/README.md`, the phase file) changed after it started.
- **`node tools/wo-sweep.mjs`:** `48 checks · 45 passed · 0 failed · 3 to review`, exit 0.
  - The 3 reviews are the standing three (sensitive field names, due-date with late/missing, the
    mockup banner).
  - § 11 reads 1836, matching `tools/README.md:1286`.
- **`node tools/wo-gate.mjs --audit`:** PASS, exit 0.
- **`git diff -- src tools sw.js | grep -c MUTATION`:** `0`.

### Files changed this round

- `c:\dev\planbook\src\score-history.js`
- `c:\dev\planbook\src\scores.js`
- `c:\dev\planbook\src\past-due.js`
- `c:\dev\planbook\docs\data-model.md`
- `c:\dev\planbook\tools\verify\score-history.mjs`
- `c:\dev\planbook\tools\README.md`
- `c:\dev\planbook\TESTING.md`
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` (the line-4 tick only)

### What I could not verify

Nothing here needs an iPad or human eyes. No build writes `held` or `heldAt` yet; that is WO-3.46's
hold writer. Every check plants these keys in a fixture.

### Declined / for the owner

- **No hold writer and no control were built.** WO-3.46's amended text (writer stamps `heldAt`) is
  its own to build.
- **The same-second spare entry** (decision 3) is the one place the principle bends. Closing it would
  need a cell-level marker, which the Traps rule out.

### Revised CHANGELOG draft (the teacher decides)

> The grade engine now understands a *held* column: an assignment marked `held` counts toward no
> grade, category or letter, in either grading mode. Its score history follows one rule: every score
> that counted toward a grade stays in the trail, and versions that never counted do not. Holding a
> column is a boundary, so the first change to a score that was already counting keeps that score,
> however soon after it was typed. Edits made while held replace one another. Committing is a
> boundary too: the first change after a commit keeps the committed score. A column that already had
> a history keeps it untouched. Nothing in the app can hold a column yet; that arrives with WO-3.46.
