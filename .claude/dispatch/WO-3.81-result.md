# WO-3.81: a missing mark on work filed under no category is listed nowhere (result)

**Implementer:** Claude Opus, 2026-11-01. **State:** complete. There is no mutation in the tree. All six Acceptance boxes are ticked in `plans/work-orders/phase-3-gradebook.md`; none of them is 👤 or 📆. The status is left at 🤖 CLAIMED: I did not run `--tick`, `--release` or `--handoff`. No commit was made.

## What was built

Four readers now add the `missing` rows of `uncategorizedWork()` to the ones from `openWork()`. This applies in both grading modes, per the owner's ruling of 2026-11-01. Neither `openWork()` nor any projection was changed.

- **`src/merge-fields.js`**: the `missing()` memo in `contextOf()` combines the two readers. That one list feeds both `{{missing.list}}` and `{{missing.count}}`, so the count and the list cannot disagree. The whitelist is untouched, and sweep § 20 is green with its 16 fields.
- **`src/signals.js`**: the combining happens in `missingWork()` inside `makeContext()`, not inside the `missingCount` rule, as the Traps section requires.
  - I reworded the comments that made a false grade claim: the rule header ("the same list of rows the grade already charged… at full points"), `missingWork()`'s own comment, the import comment, the context table, and the held-column paragraph.
  - The `say()` sentence is unchanged and makes no grade claim.
- **`src/detail.js`**: one new `missingPieces()` list feeds the *Missing work* card, the hero's *N missing* and the CSV Work rows.
  - **Points class:** an uncategorized row shows `no category` and the red `N pts` pill, because the zero is charged there.
  - **Weighted class:** the row shows `no category · not in the grade` with no pill, and is left out of the title's "points at stake". When such a row exists, the card note gains one sentence: *"The exception is work filed under no category: it carries no weight in this class, so its missing mark is listed here and is not in the grade."*
  - **CSV:** rows read `no category,…,marked missing` in both modes.
  - The card now carries the attribute `data-detail-missing` so the harness can find it.
- **`sw.js`**: v206 → v207.
- **`docs/data-model.md`**: two rows of the held-column table now name `uncategorizedWork()`.
- **`tools/verify/uncategorized-to-grade.mjs`**:
  - New block `missingLoose()`: 3 Acceptance checks, a cleanup check and a fixture-guard arm.
  - The two gaps WO-3.80's verifier named are folded into `heldLoose()`. A third student, Cal, has a categorized and an uncategorized held blank, and a new check asserts the categorized row comes first on the held card. The queue check now compares the reader's rows and the panel's buttons in the order drawn: live `c(2) e u h(2)`, held `e u c(held) h(held)`. I worked those orders out by hand before the run, and the run matched.
- **`tools/README.md`**: the call-site count moves 2185 → 2191, and there is a ledger paragraph.
- **`TESTING.md` § WO-3.81**: written, with every Acceptance line copied verbatim and its evidence.

## Against the Acceptance list

1. **Points class: card, CSV and `{{missing.list}}` each show the mark under or beside *no category*.** Met. The PASS line in the full run asserts the exact card rows, the title (*200 points at stake*), the hero (*3 missing*), the CSV Work section byte for byte, and the list text.
2. **Weighted class: listed, counted, and no sentence claims a grade cost.** Met.
   - The card rows read `not in the grade`, there is only one pill, and the title is *100 points at stake*.
   - The note's exception sentence is present.
   - `{{missing.count}}` is 3 in both classes.
   - `missing-count` fires at the default threshold of 3 with `numbers.missing` = 3. With `openWork()` alone the count would be 1 and the rule would not fire.
   - With the class name removed, the rule's sentence matches none of `/grade|point|zero|lower|cost|charge/i`.
   - I also read the wording myself: the `say()` sentence, both fields' palette text, and the card. The old note's "already in … grade above" was the one false sentence for these rows, and the exception sentence corrects it.
3. **No projection's figures move, and no grade changes.** Met. The hand-worked figures are points Ada 30·30·30 and Ben 84·86.67·70; weighted Ada 45·45·45 and Ben 85·85·85. They are identical before and after every reader ran, and `openWork()` still returns e2 alone. All WO-3.76 and WO-3.80 projection checks are green.
4. **Mutations on the card and on `{{missing.list}}` go red, are reverted, and the red output is in `TESTING.md`.** Met.
   - I ran them on a scratch harness limited to four sections (focus-ring, modal, year-document-store, uncategorized-to-grade), which I deleted afterwards. The clean tree gives 58/58.
   - **Card mutation:** 2 failures; the card, hero and CSV fall back to e2 alone while the list stays whole.
   - **`{{missing.list}}` mutation:** 2 failures; the list reads "Wo381 essay two" and the count reads 1.
   - **Extra signals mutation:** 1 failure; the rule stops firing while the count still reads 3. This shows the harness checks the count itself, not only the list, as the Traps section asks.
   - Each mutation was reverted by copying back the clean file, and `diff -q` confirmed it identical.
5. **`verify-shell.mjs` and `wo-sweep.mjs` pass.** Met.
   - Full run on the delivered tree: `2193 checks · 2193 passed · 0 failed · 0 skipped`, `71,349 lines · 32.5 lines per check · 1222s`, `EXIT=0`.
   - Sweep: `52 checks · 49 passed · 0 failed · 3 to review`, `EXIT=0`, run twice; the second time was after the last doc edits. The 3 reviews are the standing ones.
   - I stopped one earlier full run on purpose at about check 1370, because comment-only edits had landed mid-run. Its numbers are not used anywhere.
6. **`TESTING.md` section is written.** Met.

## `grep -rn MUTATION src/ tools/`

This is **not empty: it returns 18 lines**. They are exactly the 18 that `git grep -n MUTATION HEAD -- src tools` returns: pre-existing prose, the same set WO-3.80 recorded. Nothing I added contains the word: `git diff -U0 -- src tools sw.js | grep -c MUTATION` gives 0. The brief's "must be empty" cannot be met on this tree without deleting comments that were already there, and I did not delete them.

## `missingCount.early()`'s bound, as the brief asked

`has.assignments` comes from `ctx.termWork().length`, which is `sequence`: every live assignment in the class and term, whatever its category. So it already counts uncategorized assignments, and I did not widen it.

## Decisions the work order didn't settle

- **The hero's *N missing* changed as well**, even though it is not one of the four readers named. It sits beside the card, and the ruling's own reason ("a count must agree with the list beside it") applies to it directly.
- **Weighted-class card presentation.** The uncategorized row shows the words *not in the grade* in muted text instead of the red points pill, and is left out of "points at stake". If every missing row is uncharged, the title reads *Missing work · N pieces*. I added no new CSS and no new control.
- **CSV wording**: the state reads `marked missing` in both modes, which makes no cost claim. I did not add a weighted-only marker to the CSV.

## Declined (out of scope; could be booked)

- Uncategorized **open** (blank) work is still missing from student detail's outstanding count, the to-move card and the CSV's outstanding rows. Those all read from `openWork()`, which feeds the projection. WO-3.80 already records the same gap.
- In a weighted class the excused card still prints a loose excused piece with no category. This is WO-3.80's declined item, and I left it alone.

## Not verified

Nothing on a real iPad. No line here is 👤, but nobody has looked at the card's new muted row on a device.

## CHANGELOG draft (for the teacher)

> A piece of work marked missing but filed under no category now shows up wherever missing work is listed: the student's *Missing work* card, the student CSV, `{{missing.list}}` and `{{missing.count}}` in drafts, and the concern list's missing-work rule. In a points class it counts as the zero it already was in the grade. In a weighted class it is listed and counted as missing, and the card says it is *not in the grade*, because uncategorized work carries no weight there. No grade or projection changes. `CACHE` v206 → v207.

## Files changed

- `src/merge-fields.js`, `src/signals.js`, `src/detail.js`
- `sw.js`
- `docs/data-model.md`
- `tools/verify/uncategorized-to-grade.mjs`, `tools/README.md`
- `TESTING.md`
- `plans/work-orders/phase-3-gradebook.md` (boxes only)
- `.claude/dispatch/WO-3.81-result.md` (this file)

I did not touch `.claude/dispatch/WO-3.81-status.md`; its changes were already there when I started.
