# WO-3.70 — the student report lists excused work, with any score it kept · result

**Implementer:** Claude (Opus), 2026-11-01. No commit, no push, no `--tick`/`--start`/`--release`/`--handoff`.
Row left `🤖 CLAIMED`. Seven of eight Acceptance boxes ticked in `plans/work-orders/phase-3-gradebook.md`;
the 👤 box is still open.

## What I ran (output I read myself)

| Run | What | Result |
|---|---|---|
| 1 (capture) | `node tools/verify-shell.mjs`, new section with `GOLDEN = null`, **no `src/` file edited yet** | printed `WO370-CAPTURE {…}` (the pre-change report text, CSV, grades, openWork, to-move and missing cards). `2169 checks · 2151 passed · 18 failed`. The WO-3.70 reds were expected, since the feature wasn't built yet. The other reds (worker-takeover, sync-button) came after I bumped `sw.js` and edited `src/` while that run was still going, so they say nothing about the build |
| 2 | full harness, feature built | `2176 checks · 2173 passed · 3 failed`, EXIT=1. The three were existing checks that asserted the report lists no excused piece (re-pinned, see line 6) |
| 3 (mutation) | `kept:` forced to `null` in `excusedRows()` | `2176 checks · 2171 passed · 5 failed · 0 skipped`, EXIT=1. All five are report checks (quoted in `TESTING.md` § WO-3.70) |
| revert | copied back the pre-mutation copy | `cmp` identical. `grep -rn "MUTATION WO-3.70" src tools` gives exit 1, nothing. `grep -rn MUTATION src tools` lists only prose that was already there |
| 4 | full harness after revert | **`2176 checks · 2176 passed · 0 failed · 0 skipped`, 70,393 lines, 1212s, EXIT=0**, real clock |
| sweep | `node tools/wo-sweep.mjs` (after every doc edit) | **`52 checks · 49 passed · 0 failed · 3 to review`**. The three are the standing reviews. § 33 (import loops) is green with the new `detail.js → grades-report.js` edge |
| gate | `node tools/wo-gate.mjs WO-3.70` | `PASS | gates clear` (with the expected CLAIMED / dirty-tree notes) |

## Against § 5, line by line

1. **The screen and CSV list each excused piece, kept score or `Ex` alone.** Met, from run 4. Ana's card has `Ex (62)`, `Ex`, `Ex`. Her CSV has `excused — 62 kept`, `excused`, `excused` after the live and held rows. Opened through the real path (Scores, then her name), the card is drawn and its mark is `rgb(124, 58, 237)`.
2. **Grade, to-move and `openWork()` readers unchanged.** Met, from run 4. Ana's grade in both modes, her openWork rows, her to-move card and her missing card all match the golden from the pre-change build. Her grade also matches the hand figure, 77.5%. The `git diff` of `src/grade-engine.js` removes no line: it adds three functions.
3. **A held column's excused cell is listed once, as held work.** Met, from run 4. It is on the held card as `excused, 7 kept`, it is counted in the card title and in the hero's `1 held`, it is not an excused row, and it has exactly one CSV line.
4. **No excused work gives byte-identical output.** Met, from run 4. Ben's `#detailContent` text and his whole CSV match the golden captured from the unedited build (only the date is masked). Ben has an outstanding row, a missing row, a held row and a dropped row.
5. **The mutation goes red, is reverted, and the red is shown in TESTING.** Met. Run 3 had 5 reds, the revert is confirmed above, and the red lines are quoted in `TESTING.md`.
6. **Both tools pass.** Met: run 4 and the sweep, above.
7. 👤 **iPad, normal and presentation mode.** **Not done, and not ticked.** I have no iPad. The harness only shows that under presentation mode the card draws the same rows and words as in normal mode. The reading steps are in `TESTING.md`.
8. **The `TESTING.md` section exists.** Met. It has the Acceptance lines verbatim, with evidence for each.

## Decisions the work order did not settle

- **A held column's excused cell was listed nowhere before this.** `heldWork()` drops excused cells through `workRows()`. To meet line 3 I added `heldExcusedWork()`, a held twin built on the same `excusedRows()` walk. The held card, the hero's held count and `onHold` now use `heldWork() + heldExcusedWork()`. I did **not** change `heldWork()` itself, because it feeds the home card's *N to grade* and the glance queue, and an excused cell is not work to grade. The cost is two new engine exports where the deliverable named one reader.
- **Work filed under no category is included** in `excusedWork()` (through `looseAssignments()`, live columns only), because line 1 says "each excused piece in the term". In a weighted class its category cell is blank, from `categoryName()`, the screen's own lookup. A held uncategorized excused cell is listed nowhere, since `heldWork()` has no uncategorized scope either. That is an edge case I left alone.
- **Presentation mode:** I followed the branch the held and dropped cards use, which is no `presentationMode()` test at all. An excused piece is a grade fact, not support data, and adding a test would be a second opinion on top of the rule `src/supports.js` owns.
- **Wording.** Screen mark: `Ex (62)` / `Ex`, from `markText()`, which is now exported from `src/grades-report.js`, so there is still only one spelling. CSV State cell: `excused` / `excused — 62 kept`. Held state: `excused` / `excused, 7 kept`, which is the score history's wording lower-cased. Card title: *Excused · N pieces out of the grade*. Points are shown in plain grey, not the red missing chip. The mark is not struck through, because the brief asked for the grade sheet's mark and the sheet does not strike it. The owner may want to judge that on the iPad.
- **Placement:** the card goes after the dropped card, and the CSV rows go last in the Work section. Both follow "after the live and held rows", and every existing line stays where it was.
- **The golden** is captured from the pre-change build, not written by hand. The capture branch (`GOLDEN === null`) is left in the module so it can be re-taken. It is one of the two call sites a green run never reaches. The other is the fixture guard.

## Existing harness checks re-pinned (none deleted)

- `tools/verify/grade-detail.mjs`. The missing-list read now skips `[data-detail-excused-row]`. The WO-3.35 pinned weighted CSVs gained the excused rows and nothing else, and the reason is argued in the pin's own comment, which asks for that.
- `tools/verify/excused-kept.mjs`. The WO-3.68 student-CSV check now asserts the two files differ only in Cy's State cell.

## Files changed

- `src/grade-engine.js`: adds `excusedWork()`, `heldExcusedWork()` and the private `excusedRows()`
- `src/grades-report.js`: `markText()` is exported, and a comment says why
- `src/detail.js`: imports, `heldStateSay()`, `excusedCard()`, `excusedMark()`, the held list concat, the `excused` model key, the CSV rows
- `src/detail.css`: `.detail-excused-pts`, `.detail-excused-mark`, print rules, coarse-pointer sizes
- `sw.js`: `CACHE` v203 → v204
- `tools/verify/excused-report.mjs` (new), `tools/verify-shell.mjs` (registration), `tools/verify/grade-detail.mjs`, `tools/verify/excused-kept.mjs`
- `tools/README.md`: call-site count 2159 → 2171, plus a ledger paragraph
- `TESTING.md` § WO-3.70 (new)
- `plans/work-orders/phase-3-gradebook.md`: 7 boxes ticked
- `.claude/dispatch/WO-3.70-result.md` (this file)

## Declined / out of scope

- I did not add an excused count to the hero line, which would have been a widening. I did not touch `docs/data-model.md`: it is not in the deliverables, and none of its excused claims are now false.

## Draft CHANGELOG entry (the teacher decides)

> **The student report lists excused work.** A student's report now has an *Excused* card listing each piece you excused them from, with the score the cell kept shown the way the grade sheet shows it: `Ex (62)`, or `Ex` alone. Its CSV carries the same rows (`excused`, or `excused — 62 kept`). None of it counts toward the grade or toward *what it would take to move*. An excused cell in a column you are holding is listed with the held work instead. A student with nothing excused gets exactly the report and file they got before. (WO-3.70)
