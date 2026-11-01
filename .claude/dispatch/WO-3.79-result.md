# WO-3.79 — result

**Implementer:** Claude Opus (work-order-implementer), 2026-10-31. Not committed. Row left 🤖 CLAIMED.
**Five of six Acceptance boxes ticked. Box 2 is left open on purpose.** The work order contradicts
itself on one cell shape, and choosing between its two readings is the owner's call. Details are
under "The decision" below.

## What was built

- **The setting line** (`src/term-record-view.js` `SETTING_LINE`) now reads, word for word: *No score
  changed. Something else did — weights, the letter scale, drop lowest, or an assignment's points,
  category or term, or one held or deleted.* `tools/verify/term-record-cause.mjs` pins it by
  equality, and the two WO-3.75 checks that read it (Cole375, Ellis375) now compare against it.
- **A recording seals the window.** `reviseCell()` (`src/score-history.js`) extends the existing
  `sealed` test with a second condition. A cell last written at or before the newest recording of its
  class and term gets pushed by the first live write after that recording, however soon. The held
  branch is untouched.
- **How the boundary reaches `reviseCell()`.** The work order left this to me, and the point of
  departure is stated above `reviseCell()` and at both callers:
  - Both writers (`putCell()` in `src/scores.js`, the sweep in `src/past-due.js`) add three facts to
    the descriptor they already build: `classId` and `termId` from the assignment, and `records`,
    which is `doc.termRecords` as stored.
  - `reviseCell()` finds the newest recording itself, in a private `recordedBoundary()`, comparing
    parsed instants.
  - This adds no import edge and no new export from `src/score-history.js` (§ 28's six are
    unchanged). It also means the two writers never each decide which recording counts. That is the
    arrangement WO-3.52 set up: the caller supplies facts, and `reviseCell()` decides what they mean.
- **`scoreChangeSince()` reads the seal.** The work order does not list this, but without it the
  seal shows nothing. The 9 written a minute after the recording is still inside the five minutes
  after it, so WO-3.75's reader answered *not known* either way. The new clause: if the version at or
  before the recording is stamped less than five minutes before the first version after it, then
  `then` is that version. The ordinary rule can never produce that gap, because a push needs five
  minutes since the cell's `at`, so only a boundary can have pushed it.
- **`newestRecord()`** compares parsed instants through a private `instantRank()`.
  - A stamp that will not parse ranks below every stamp that does.
  - A tie still goes to the later write.
  - It does not import `instantOf()`, because that would be a seventh § 28 export.
- **Docs.** `docs/data-model.md` changes in two places:
  - § Recording a quarter's grades gains a bullet, *A recording is a version boundary*, plus the
    reader's new clause and the new line wording.
  - § score history names the recording as the third boundary, after a hold and a commit.
- **`sw.js`:** `CACHE` goes from `planbook-shell-v202` to `planbook-shell-v203`.
- **`tools/README.md`:** the call-site count goes from 2149 to 2156, with a ledger paragraph.
- **`TESTING.md`:** § WO-3.79 is written.

## The decision the work order did not settle (why box 2 is open)

**Two cells that mean different things are identical in storage.**
- **Cell A:** a score typed weeks before the recording and edited a minute after it. This build
  writes an old version on the trail, then the edit. That is a true *4 → 9*.
- **Cell B:** a write made just before the recording, then edited just after it, both saved by an
  **earlier build**. The earlier build swallowed the first write, so the result is the same: an old
  version on the trail, then the edit. Here the old version is not what the recording saw.

The Traps say an earlier build's edit "still answers *not known*, and that line stays". WO-3.75's
Dunn375 check is exactly cell B, and it still passes. So cell A also reads *not known*.

That leaves Acceptance 2 bounded:
- It **holds** when the 4 was written within the five minutes before the recording. That is the
  swallow Why 2 describes, and it is proved (Gale379, plus the grid check).
- It **does not hold** when the 4 was typed days earlier (Hale379, pinned as a check).

Ticking the box would claim more than the evidence shows.

**Ways to close it.** Each one overrides something already ruled:
1. Add a sixth field to a term record, such as a "sealing build" marker. WO-3.72 rules *exactly the
   five fields*, and `tools/verify/term-record.mjs` asserts the key list.
2. Put a marker on the version the seal pushes. That changes the cell shape in the data model.
3. Hard-code a cut-off date. Fragile, and wrong for a device still running an old build.
4. Trust the trail anyway. Old data in the swallow shape (Dunn's) would then name the wrong earlier
   value, which is the guess WO-3.75 refused. Dunn375 would go red, and the Traps sentence would
   become false.

My recommendation is (1) or (4), and it is the owner's call. Option (4) costs only edits saved in the
last few days, within five minutes either side of a recording.

**One Traps sentence is inaccurate, for the record.** It says "The seal pushes a spare version for an
edit just after recording a cell untouched since September". In fact the five-minute rule already
pushes in that case, because September is more than five minutes before the edit. The seal changes
nothing there, so it does not push a spare version.

## Against the Acceptance list

1. **Deleted assignment → new line, word for word: MET, ticked.** `PASS | WO-3.79 (Acceptance 1): …
   Fenn379, 50.00 F → 80.00 B once *Draft* went, reads exactly *No score changed. Something else did
   — …* and nothing else`. Fenn's only change is the deletion: once Projects is empty its weight
   redistributes, so no weight, scale or drop setting moved her.
2. **4 → 9 one minute after: OPEN.** It is bounded as described above.
   - Met for a 4 written two minutes before the recording: `["score","Act 2 quiz (Exams): 4 → 9 of
     10"]`.
   - Met through the real grid writer: `{"v":9,…,"was":[{"v":4,"at":"…14:23:55-04:00"}]}`.
   - Reads *not known* for a 4 written twenty days before (Hale379).
3. **DST pair, `newestRecord()` returns the second: MET, ticked.** The check gives `{"inOrder":
   "second","reversed":"second","tie":"b","junk":"first/first",…}`. The same check also shows the
   seal using that same newest recording.
4. **Both mutations red and reverted: MET, ticked.**
   - Mutation 1 (`const recorded = NaN;`) turned three checks red: the grid check, Acceptance 2,
     and the seal half of Acceptance 3.
   - Mutation 2 (string `>=` in `newestRecord()`) turned Acceptance 3 red: `inOrder` was `"first"`
     and `junk` was `"junk/junk"`.
   - I stopped both runs once `term-record-cause.mjs` had printed, so each log ends `EXIT=127` with
     no summary line. Before that cut-off, the FAILs listed were the only ones in each run.
   - Each mutation was reverted before anything else was written. `grep -rn "MUTATION WO-3.79"`
     then printed nothing, and the total `MUTATION` count is 18, the same as at HEAD (pre-existing
     prose).
   - The red output is in `TESTING.md` § WO-3.79.
5. **Both tools pass: MET, ticked.**
   - `node tools/verify-shell.mjs` on the delivered tree: `2163 checks · 2163 passed · 0 failed · 0
     skipped`, 69,832 lines, 1223s, `EXIT=0`. An earlier run before the doc edits gave the same
     2163/2163 in 1219s.
   - `node tools/wo-sweep.mjs`: `52 checks · 49 passed · 0 failed · 3 to review`. These are the three
     standing reviews, and I re-ran it after the ticks. The call-site check reads 2156, and the cache
     check is green.
6. **`TESTING.md` § WO-3.79: MET, ticked.** The heading is under Phase 3, and the six lines are
   copied verbatim with evidence for each.

**Not verified:**
- No check drives the past-due sweep's new descriptor after a recording (`src/past-due.js`). I
  checked it only by reading: it is built the same way as `putCell()`'s, which is proven through the
  grid.
- There are no 👤 lines in this work order, and nothing here was read on an iPad.

## Files changed

- `src/score-history.js`
- `src/scores.js`
- `src/past-due.js`
- `src/term-record.js`
- `src/term-record-view.js`
- `docs/data-model.md`
- `sw.js`
- `tools/verify/term-record-cause.mjs`: the new wording, plus a second fixture class (Fenn, Gale, Hale)
  and the DST/seal check
- `tools/verify/score-history.mjs`: one check that types into the grid
- `tools/README.md`
- `TESTING.md`
- `plans/work-orders/phase-3-gradebook.md`: boxes 1 and 3–6 ticked; the status line is still
  🤖 CLAIMED, from `--start`

## Declined, out of scope

- **`recordedBoundary()` with a string-max mutation.** This was not requested. The seal half of the
  Acceptance 3 check would catch it.
- **A third fixture for "a column held since the recording".** The new line names that cause, but the
  work order's acceptance asks only about deletion.

## CHANGELOG draft (for the teacher to decide)

> **What changed names the cause honestly, and a typo fixed after recording keeps the recorded
> score.** When no score of a student's moved, the Record dialog's line now says *something else
> did* and lists everything that can move a grade without a score changing: weights, the letter
> scale, drop lowest, or an assignment's points, category or term, or one held or deleted. It used
> to name only the first three, which sent you to your class settings when the real cause was a
> deleted assignment. Recording a quarter is now a version boundary, like committing a held column:
> type 4, record, fix it to 9 a minute later, and *What changed* reads *4 → 9* instead of *not
> known*. A score typed days before the recording and edited just after it still reads *not known*,
> because it is indistinguishable from an edit an earlier build may have overwritten. Two recordings
> either side of the end of daylight saving are now ordered by when they happened, not by how their
> timestamps sort as text.

## Correction round 1

**Implementer:** Claude Opus (work-order-implementer), 2026-10-31. This is a fresh session working on
round 1's uncommitted tree, built against the work order as amended by the owner's ruling. Nothing is
committed. I ran no `wo-gate` command, and the row still reads 🔍 AWAITING VERDICT.

**All nine Acceptance boxes are ticked** in the phase file and in `TESTING.md` § WO-3.79. The evidence
for each is below.

**First move.** `grep -rn MUTATION src tools/verify` printed only the eight pre-existing matches the
brief lists. Nothing live.

### What changed, file by file

- **`src/score-history.js`**
  - `scoreChangeSince()` no longer has round 1's `pushedAcross` clause or WO-3.75's five-minute test.
    It answers `then: null` only when the column was committed after the recording (WO-3.75's rule,
    kept). Otherwise `then` is the latest version at or before the recording, or blank if there is
    none.
  - The comment above it is rewritten to match the amended Traps. Four paragraphs replace round 1's
    "AND WHEN IT IS KEPT…" and "WHAT STAYS NOT KNOWN…" and WO-3.75's "WHEN THE MOMENT IS NOT KEPT…":
    - *THE READER TRUSTS THE TRAIL ACROSS A RECORDING*;
    - *THE ONE EXCEPTION*: an earlier build's swallow names the wrong *then*, so Dunn375 reads 5 → 8
      where the recording saw 6;
    - *NO VERSION AT OR BEFORE THE MOMENT*;
    - *A COLUMN COMMITTED SINCE THE MOMENT*.
  - The seal (`recordedBoundary()`, `reviseCell()`) is unchanged from round 1.
- **`tools/verify/term-record-cause.mjs`**
  - **Dunn375 is re-pinned** to *5 → 8 of 10*, and the check is kept rather than deleted. It asserts:
    - the engine's `then` is `{ v: 5, flag: '' }`;
    - no *6 →* appears;
    - no *not known* appears.

    The check's message names it as "the earlier-build limit the Traps accept (Record shipped
    2026-10-29, WO-3.73)".
  - **Hale379 is re-pinned** to *4 → 9 of 10*, with no *not known* in the box.
  - **Relabelled:** Gale and Hale are "Acceptance 2, two minutes" and "Acceptance 2, twenty days". The
    DST check is "Acceptance 6".
  - **Prose rewritten:** the file header's Dunn paragraph and its WO-3.79 summary, and the second
    fixture's banner (Hale is now "Acceptance 2 too").
  - **New:** a third fixture class (Ives379) for the past-due sweep, with a check that the fixture
    comes back off afterwards.
- **`tools/verify/score-history.mjs`**: a new other-term / other-class check. It types through the
  grid and plants each recording on its own.
- **`docs/data-model.md`**
  - § Recording a quarter's grades, the *What changed* bullet: the reader trusts the trail. The bullet
    gives the blank-`then` rule and the earlier-build exception with Dunn's numbers. WO-3.75's
    five-minute rule stays, in parentheses, as history.
  - The version-boundary bullet's "Only writes made by this build benefit" becomes "a cell an earlier
    build wrote is read as it stands (the exception above)".
- **`tools/README.md`**
  - The call-site count goes from 2156 to 2159.
  - A new ledger paragraph records this round.
  - Round 1's ledger paragraph is left as it was, because it is history. It still says "the honest
    limit beside it"; the new paragraph explains that the check was re-pinned.
- **`TESTING.md`** § WO-3.79 is rewritten.
  - The nine Acceptance lines are copied verbatim from the amended phase file. A script compared them
    string for string: 9 of 9 equal.
  - Round 1's ticks on "both tools pass" and "verbatim" were replaced with evidence from this tree.
- **`plans/work-orders/phase-3-gradebook.md`**: the seven open WO-3.79 boxes are ticked. Nothing else
  in the file changed.
- **`sw.js`**: not touched this round. Round 1's `v203` bump is still uncommitted, and it covers the
  `src/score-history.js` change (one bump per deploy).

### The `before < 0` decision

**When no version is at or before the recording, `then` is blank** (`{ v: null, flag: '' }`), however
long after the recording the edit came.

- Under the seal, a cell that held anything at the recording keeps that version on its trail.
- A cell cleared with no past is a deleted key, which is nothing.
- So a trail that starts after the recording means the cell held nothing at the recording.

This is the answer WO-3.75 already gave once the first write was five minutes clear. Removing the
guard extends it to any distance.

**The cost:** the earlier-build exception shows up here in a second shape. If an earlier build wrote a
cell at R−1min and replaced it at R+2min, the cell reads *Blank → 8*. That is accepted along with
Dunn's case.

**What I rejected:** keeping a five-minute guard for this case only. It would make a student who had
no score at the recording and was scored a minute after it (the common case) read *not known*. That
is exactly the shape the owner ruled against.

The decision is stated at the point of departure above `scoreChangeSince()` and in
`docs/data-model.md`.

### Against the nine Acceptance lines

1. **The deleted-assignment setting line: met.** Fenn379 reads it exactly (final run).
2. **4 → 9 at both two minutes and twenty days: met.** Gale379 and Hale379 both read
   `Act 2 quiz (Exams): 4 → 9 of 10`. The grid's own writer pushes the 4 too (`score-history.mjs`).
3. **Dunn375 reads 5 → 8 of 10 and is named as the earlier-build limit: met.** The engine's `then` is
   `{"v":5,"flag":""}`.
4. **A recording of another term or another class does not seal: met,** driven through the grid. Both
   cells end as `{"v":9,"at":…}` with no `was`.
5. **The past-due sweep: met,** driven through `acceptPastDue()`.
   - `paintPastDue()` and `acceptPastDue()` ran on the page a minute after the recording.
   - The cell's `was` is `[{v:4,…},{v:null,at:<the blank's stamp>}]`.
   - *What changed* reads `Reading log (All work): Blank → Missing`.
6. **DST `newestRecord()`: met.** It returned
   `{"inOrder":"second","reversed":"second","tie":"b","junk":"first/first",…}`.
7. **Mutations red and reverted: met.**
   - **Run A, the seal removed:** four checks went red.
     - the grid check;
     - Gale379 (`Blank → 9 of 10`);
     - the seal half of the DST check;
     - the sweep (`4 of 10 → Missing`).

     Hale379, Dunn375 and the other-term/class check stayed green, which is correct. Neither Hale nor
     Dunn depends on the seal, and a recording that does not seal looks the same as no seal at all.
   - **Run B, three mutations, each aimed at a different check:**
     - round 1's reader guard put back: Hale379 and Dunn375 went red (*not known*);
     - `recordedBoundary()` ignoring class and term: the other-term/class check went red (a `was`
       appeared);
     - `newestRecord()` on strings: the DST check went red (`inOrder: "first"`, `junk: "junk/junk"`).
   - **Only those FAILs:** both runs had 1,415 PASS lines and no other FAILs. I stopped each run after
     `term-record-cause.mjs` finished, so neither log has a summary line.
   - **Reverted before anything else was written,** each from a copy taken before the mutation.
     Afterwards:
     - `grep -rn "MUTATION WO-3.79" src tools sw.js index.html` printed nothing;
     - the total MUTATION count was 18, the same as HEAD;
     - the md5 of `git diff src/ tools/verify/` matched the clean run's.
   - The red output is pasted in `TESTING.md` § WO-3.79.
8. **Both tools pass: met.**
   - **`node tools/verify-shell.mjs`, final tree:** `2166 checks · 2166 passed · 0 failed · 0 skipped`,
     70,019 lines, 1197s, `EXIT=0`. The clean pre-mutation run on the same code had the same totals,
     in 1220s, `EXIT=0`.
   - **`node tools/wo-sweep.mjs`:** `52 checks · 49 passed · 0 failed · 3 to review`, exit 0. The three
     reviews are the standing ones. The call-site check reads 2159 and the CACHE check is green.
   - **One run between those two was red, and I am reporting it.**
     - It ran on the same tree (same md5) and read `2158 · 2155 · 3 failed`, `EXIT=1`.
     - The first failure was in Phase 7's `verify/sync-button.mjs`:
       `TypeError: Cannot read properties of undefined (reading 'driveSync')` after a pinned-clock
       reload.
     - The other two were knock-on checks in the first-run-doors and outreach sections ("google
       scripts on the page = 1").
     - No file this work order touches is in that path, and a plain re-run with nothing changed was
       green. I read it as a boot-timing flake.
9. **`TESTING.md` § WO-3.79 carries the nine lines verbatim: met.** Checked by script.

No line is 👤 or 📆, and nothing here was read on an iPad.

### Proposed follow-up (out of scope, not acted on)

- **The `verify/sync-button.mjs` flake.** Its Acceptance 5 block (around line 1334) reads
  `window.planbook.driveSync` too soon after the pinned-clock reload. It probably needs a
  `waitForBoot()` before the `PLANT_AT` evalJs. I saw it once in four full runs.

### Files changed this round

- `src/score-history.js`
- `tools/verify/term-record-cause.mjs`
- `tools/verify/score-history.mjs`
- `docs/data-model.md`
- `tools/README.md`
- `TESTING.md`
- `plans/work-orders/phase-3-gradebook.md`
- `.claude/dispatch/WO-3.79-result.md` (this section)

### CHANGELOG draft (for the teacher to decide; replaces round 1's draft)

> **What changed names the cause honestly, and a score fixed after recording keeps what you
> recorded.**
>
> When none of a student's scores moved, the Record dialog's line now says *something else did*. It
> lists everything that can move a grade without a score changing: weights, the letter scale, drop
> lowest, or an assignment's points, category or term, or one held or deleted. It used to name only
> the first three, which sent you to your class settings when the real cause was a deleted
> assignment.
>
> Recording a quarter is now a version boundary, like committing a held column. Type 4, record, fix
> it to 9 a minute later, and *What changed* reads *4 → 9*, not *not known*. That holds whether the 4
> went in two minutes or two weeks before the recording. It also holds for scores you type and for
> blanks the past-due prompt marks missing.
>
> One edge case comes from the two days since Record shipped. A score changed on the earlier build
> within a few minutes either side of a recording may name the score before the one you recorded.
>
> Two recordings either side of the end of daylight saving are now ordered by when they happened, not
> by how their timestamps sort as text.
