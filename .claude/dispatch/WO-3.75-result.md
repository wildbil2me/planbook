# WO-3.75 — the notice says which score changed · result

**Implementer:** Claude (work-order-implementer), 2026-10-31. Nothing committed. The row is still
`🤖 CLAIMED`. I ticked all six Acceptance boxes in `plans/work-orders/phase-3-gradebook.md`, because
none of them is 👤 or 📆 and each has evidence in `TESTING.md` § WO-3.75. I did not write the
`CHANGELOG.md` entry; a draft is at the foot of this file.

## What was built

- **`src/score-history.js`: `scoreChangeSince(cell, moment, column)`.** This is the reader for "what
  a cell held at a moment" that the work order asked for. It returns one of three things:
  - `null`: the cell has not been written since the moment, or it holds the same value and flag now
    as it did then.
  - `{ then, now }`: the value and flag at the moment, beside the value and flag now.
  - `{ then: null, now }`: the cell was written since, but what it held at the moment is not kept.

  It never hands out a note, an `at`, or the trail. The file's banner explains the new door.
- **`src/term-record.js`: `whatChanged(doc, cls, termId)`.** For each row of `noLongerMatching()`, it
  walks every live column of the term in document order and asks `scoreChangeSince()` about each
  cell. An empty `scores` list means the student gets the setting line. This file never reads `was`.
- **`src/term-record-view.js`**: the changed model carries `causes`. `paintCauses()` and
  `causeLine()` add words only.
- **`index.html`**: `#termRecordCauseLabel` and `#termRecordCauses`.
- **`src/shell.css`**: `.term-record-cause`, lifted with its values unchanged, plus
  `.term-record-cause-line`. The drawing shows one score per student, but a student can have two.
- **`sw.js`**: `v201` → `v202`.
- **Harness**: `tools/verify/term-record-cause.mjs` is new, registered after
  `term-record-notice.mjs`. Every fixture cell is written by `reviseCell()` with explicit Dates,
  imported from the page's own module graph (the same way `held-readers.mjs` does it). The recording
  is `gradesToRecord()` taken from the before-state and stamped two days back. In
  `tools/verify/term-record.mjs`, the export list now includes `whatChanged`.
- **Sweep**: in `tools/wo-sweep.mjs` § 28, the banner argues for the sixth export, `ALLOWED` includes
  it, and a new importer check fails unless `src/term-record.js` is its only importer.
- **Docs**:
  - `tools/README.md`: call-site count 2138 → 2149, a WO-3.75 paragraph, and the § 28 row.
  - `docs/data-model.md`: the sentence "nothing reads `was` but student detail" was amended, and a
    *What changed* bullet was added.
  - Both drawing banners were amended.

## Against the Acceptance list

1. **A score changed after a recording appears under *What changed* with its assignment, its
   category, and the value at recording beside the value now: MET.** The harness check passes. It
   reads `Act 2 quiz (Exams): 4 → 9 of 10` and `Essay 1 (Projects): Missing → 8 of 10`. The box's row
   order matches the list's grade-sheet order, and each row is a two-column grid.
2. **Two edits to one cell after a recording show one line, from the recorded value to the latest:
   MET.** The cell was 4, then 7 at R+1h, then 9 at R+3h. It shows as one line, `4 → 9 of 10`. It
   does not show 7 → 9, so the reader takes the latest version at or before the recording, not the
   version before the newest.
3. **A student whose grade moved only through a class setting gets the setting line: MET.** Cole375
   went from 70.00 C to 78.00 C on a weights change alone, and the dialog shows the owner's exact
   sentence.
4. **The check goes red when the reader drops the `was` value: MET.** The mutation was
   `const versions = [cell]; // MUTATION WO-3.75` in `scoreChangeSince()`.
   - It produced 4 FAILs, all in the WO-3.75 section: Acceptance 1, Acceptance 2, trap 4 and trap 2.
   - I stopped the run once the section had printed. The log ends `EXIT=127`, so there is no summary
     line.
   - I reverted the mutation by hand before writing anything else.
   - `grep -rn "MUTATION WO-3.75" src tools sw.js index.html` printed nothing.
   - `grep -rn MUTATION src tools sw.js index.html` printed 18 lines, the same 18 that
     `git grep -n MUTATION HEAD -- src tools sw.js index.html` prints.
   - The red output is quoted in `TESTING.md`.
5. **`verify-shell.mjs` and `wo-sweep.mjs` pass: MET.** Two full harness runs, both read to their
   `EXIT=` line:
   - Before the mutation: `2157 checks · 2157 passed · 0 failed · 0 skipped`, 1203s, `EXIT=0`.
   - The final run, after the revert and all doc edits: `2157 checks · 2157 passed · 0 failed ·
     0 skipped`, 69,597 lines, 1196s, `EXIT=0`.
   - The sweep: `52 checks · 48 passed · 0 failed · 4 to review`, `EXIT=0`. Three of the reviews are
     the standing ones. The fourth is the coarse-block review, which names `.term-record-cause` and
     `.term-record-cause-line`. Neither is a control, so no 44px rule is owed.
6. **`TESTING.md` § WO-3.75 carries the lines verbatim with evidence: MET.** It sits under Phase 3,
   after § WO-3.74.

Nothing in this work order is 👤, and I could not verify anything on an iPad. Nobody has looked at
the box under a thumb or on hardware. That is a reasonable thing to look at the next time the owner
is on the iPad, but no Acceptance line asks for it.

## The traps, as decided

1. **`was` has one reader.** I argued the export in § 28's banner, added it to `ALLOWED`, and pinned
   its importer to `src/term-record.js`. The score-history banner names what the new reader hands
   out, and explains why it asks `presentationMode()` nothing: the dialog refuses before any reader
   is asked. `src/term-record.js` does not touch `was`, and § 28 is green.
2. **Compare instants.** Every comparison is `Date.parse()` on both stamps, the way `reviseCell()`
   already does it. The harness tests this on hand-written stamps either side of the 2026-11-01
   daylight-saving change, in both directions.
3. **Straddling merge window.** When the first version written after the recording is stamped less
   than five minutes after it, `then` is null and the line reads *now 8 of 10 — what it held when you
   recorded is not known*. No value is invented: the fixture's older 5 is still on the trail, and the
   check asserts that neither *5 →* nor *6 →* is shown.
   - **Cost:** an edit made within five minutes after recording, on a cell untouched for weeks,
     produces a byte-identical cell. It also reads "not known". That is honest, never wrong.
   - **Two limits no reading of the store can close.** Both are documented in the code and in
     `TESTING.md`:
     - A burst of writes to one cell that lasts more than five minutes across the recording is not
       seen.
     - A burst across the recording that ends where it began pops its own push back, so the cell
       reads as unwritten since.
   - A cell with no `at` is never "written since", and a trail version with no `at` counts as before
     the recording (`countedBefore()`'s reading).
4. **A cell back where it began.** 4 → 9 → 4 gets no line, because only the two ends are compared.
   That student gets the setting line, and the harness tests it (Ellis375). A change to a note alone
   is not a change either.
5. **Held columns.** A held column is never listed (`isHeld()`), and the harness tests it (Vocab 4
   written after R). A column committed since the recording is listed, with `then: null` for every
   cell written since. Held writes replace however long since, so its trail is not what the recording
   saw.
6. **Mutation.** Reverted before any other write, and the grep was run as described under line 4.

## Decisions the work order did not settle

- **Wording for an unknown value:** *now N of M — what it held when you recorded is not known*.
- **Flag words** are the score-history trail's: *Missing*, *Excused[, N kept]*, *Late[, N]*, *Blank*.
  *of 10* appears once, after the last counted number, and never after a flag word.
- **Two lines for one student** are one row with two lines, which needed the new class
  `.term-record-cause-line`.
- **The reader returns `null`** when the record's `at` will not parse. The box is then not drawn
  rather than wrongly claiming "no score changed". A record written by the app cannot reach this.

## Follow-ups, declined as out of scope

- **`newestRecord()`** (WO-3.72) picks the newest record by comparing `at` as a string. If two
  recordings of one quarter fall inside the repeated hour on 2026-11-01, it can pick the wrong one.
  The window is narrow, but the comparison should probably go through `Date.parse`.
- **A hold or a commit since the recording** moves grades without moving a score. A student moved
  only by that gets the setting line, and the line's list (weights, letter scale, drop lowest) does
  not name it. The wording is the owner's, given verbatim, so I left it.
- **Uncategorized work in a weighted class** is listed when its score moved, even though it is
  outside the weighted grade. I took "every score cell in the quarter" as written. Leaving it out
  would mean a second copy of the engine's "loose" test.

## Files changed

`src/score-history.js`, `src/term-record.js`, `src/term-record-view.js`, `index.html`,
`src/shell.css`, `sw.js`, `tools/verify/term-record-cause.mjs` (new), `tools/verify-shell.mjs`,
`tools/verify/term-record.mjs`, `tools/wo-sweep.mjs`, `tools/README.md`, `docs/data-model.md`,
`design/mockups/proposed-quarter.css`, `design/mockups/closing-a-quarter.html`, `TESTING.md`,
`plans/work-orders/phase-3-gradebook.md` (six boxes ticked; status left `🤖 CLAIMED`).

## CHANGELOG draft (the teacher's to decide)

> **The notice says which score changed (WO-3.75).** When a recorded quarter stops matching, the
> Record dialog now says why, under *What changed*: each score that moved since the recording, from
> what it held then to what it holds now — *Act 2 quiz (Exams): 4 → 9 of 10*, which is the line a
> Blackbaud grade-change form asks for. Two edits to one score are one line, recorded value to latest.
> When no score of a student's moved, one line says a class setting did — weights, the letter scale
> or drop lowest — because those keep no history to name. A score changed within five minutes of the
> recording says its earlier value is not known rather than guessing, and a held column is never
> listed. Under a projector the dialog still refuses.
