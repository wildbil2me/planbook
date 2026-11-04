# WO-3.71 — a copied class keeps each category's drop lowest · implementer result

**Implementer** Claude Opus (work-order-implementer), 2026-11-03. Nothing committed, `--start`, `--release` and `--tick` not run.

## Files changed

- `c:\dev\planbook\src\categories.js`: `copyCategories()` carries `dropLowest` when the engine would honour it. New private `honouredDrop(cat)`, and `dropShown()` now reads it.
- `c:\dev\planbook\sw.js`: `CACHE` `planbook-shell-v208` → `v209`.
- `c:\dev\planbook\tools\verify\copy-class.mjs`: the WO-1.22 fixture's source categories gained `dropLowest: 2` (Quizzes), `1.5` (Homework) and `'2'` (Classwork). Tests has no key. Two new `check()` sites sit after WO-3.34's `gradingMode` check.
- `c:\dev\planbook\tools\README.md`: the call-site count went from 2199 to 2201, with a WO-3.71 paragraph after WO-1.92's. The sweep requires this.
- `c:\dev\planbook\TESTING.md`: § WO-3.71 under Phase 3, placed before WO-3.72, with all six Acceptance lines verbatim and their evidence.
- `plans/work-orders/phase-3-gradebook.md` was already modified when I started (the claim). I did not touch it, and I did not tick its boxes. I left that to `--tick` after verification.
- `src/grade-engine.js` and `src/classes.js` were **not touched**.

## The decision the brief left open: how `copyCategories()` follows `dropCountOf()`'s rule without importing it

There is a local predicate, `honouredDrop(cat)`, in `src/categories.js`. It applies the same three conditions as `dropCountOf()` (number, integer, above 0) and returns the count or 0. `copyCategories()` writes `copy.dropLowest = n` only when `n` is truthy, so absent, `0`, `1.5`, `-1` and `'2'` all produce a copy with no key.

- **Why not import the engine's function:** `grade-engine.js` imports `categoriesOf()` from `categories.js`, so importing back would create an import loop (sweep § 33). Exporting or moving `dropCountOf()` would change the engine, which the work order rules out.
- **The better answer I took:** `categories.js` already had a second inline copy of the same predicate, in `dropShown()`, which decides what the drop field shows. I put the predicate in `honouredDrop()` and made `dropShown()` call it. The repo therefore still holds **two** copies of the rule (engine and categories.js), not three. Without that, adding the copy feature would have made a third.
- **Comment sites:** the comment on `honouredDrop()` says the two must agree, why there are two, and which harness reads each (`drop-lowest.mjs` reads the engine's copy, `copy-class.mjs` reads this one). It also says to change both in the same sitting.
- **Where I departed from the brief:** the brief asked for that comment "at both sites". I did **not** add the matching comment beside `dropCountOf()` in `src/grade-engine.js`, because the work order says "Nothing in `src/grade-engine.js` moves", and I read the work order over the brief. If the owner wants the engine side annotated, it is a comment-only edit plus a CACHE bump, and it can ride with the next sitting that opens the engine.

## Acceptance, line by line

1. **Copying a class whose category drops its lowest N gives a class whose matching category drops its lowest N.** Ticked in TESTING.md. Clean run:
   - `PASS | WO-3.71: a copied category keeps its drop lowest — the copy's Quizzes drops its lowest 2, as the source's does  :: copy dropLowest by category = ["(no key)",2,"(no key)","(no key)"]`
   - The copy is made through the real Copy button.
   - The grade side rests on the engine reading the key unchanged. Its grading of `dropLowest: 2` is `drop-lowest.mjs`'s check, green in the same run.
   - I added no separate grade-of-the-copy check. The copy has no assignments, so its grade would be empty either way.
2. **Copying a category with no drop writes no `dropLowest` key.** Ticked.
   - `PASS | WO-3.71: a category with no drop copies with no dropLowest key — neither one absent on the source (Tests) nor one the engine would not honour (Homework 1.5, Classwork '2') — and every copied category holds exactly id, name and weight besides it`
   - Keys: `[["id","name","weight"],["id","name","weight","dropLowest"],["id","name","weight"],["id","name","weight"]]`.
3. **Every other field a copy carries or refuses is unchanged.** Ticked. Every existing WO-1.22 and WO-3.34 copy check passes, unedited, against the fixture that now carries drops:
   - name and position of the copy
   - term labels and dates
   - category names and weights
   - all ids new
   - roster empty, `letterScale` `null`, not archived, no attendance, assignment or pass references
   - weighted copy has no `gradingMode` key; points copy carries `"points"`
   - editing weights in the copy and the source stays independent
   
   The new check also pins each category's other keys to exactly `id`, `name`, `weight`.
4. **With `copyCategories()` leaving the key off, the new check goes red; mutation reverted; TESTING.md shows the red output.** Ticked.
   - The mutation was `if (n) { /* MUTATION WO-3.71: drop the key */ }`.
   - Full run, exit 1: `FAIL | WO-3.71: a copied category keeps its drop lowest … :: copy dropLowest by category = ["(no key)","(no key)","(no key)","(no key)"]`.
   - Summary: `2207 checks · 2206 passed · 1 failed · 0 skipped`, 1195s. That was the only failure.
   - The no-key check stayed green under the mutation, which is correct: it is the other half.
   - I reverted by copying the pre-mutation file back before any other write. `grep -rn MUTATION src/categories.js tools/verify/copy-class.mjs sw.js` finds nothing. `tools/README.md` has old historical prose mentioning MUTATION, but none in lines I wrote.
5. **`node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.** Ticked.
   - **verify-shell** on the reverted tree: `2207 checks · 2206 passed · 0 failed · 1 skipped`, 72,099 lines, 1207s, log `EXIT=0`.
   - **The skip** is the Connect-to-Sync check: "the sign-in attempt was still out at Google 6042ms after the tap". That is the network, not this work order.
   - **wo-sweep:** `52 checks · 49 passed · 0 failed · 3 to review`, exit 0. The three reviews are the standing ones.
   - **Earlier sweep run:** before I updated the count in `tools/README.md`, the sweep failed on exactly that count (2201 sites against 2199 recorded). I fixed it from the sweep's own figure.
6. **`TESTING.md` § WO-3.71 carries these lines verbatim with the evidence for each.** Ticked. The section is at TESTING.md line ~19614.

No line is 👤 or 📆. Nothing here needs an iPad.

## Not done, on purpose

**The `CHANGELOG.md` entry.** The work order lists it as a deliverable, but my standing instructions leave it to the teacher. Draft below.

> ### A copied class keeps each category's drop lowest — 2026-11-03
>
> WO-3.71, owner-directed. `CACHE` v209.
>
> - **Copying a class now carries each category's *drop lowest*** along with its name and weight, so a copy of a class whose Quizzes drop their lowest score drops it too. A category that drops nothing copies with no setting at all, and so does one holding a value the grade never used.

In WO-3.69's entry (CHANGELOG.md line ~430), delete the sentence *"Copying a class's categories does not carry the setting yet."* The bullet would then end at "…and the schema did not change."

## Notes

- I did not add a comment beside `dropCountOf()` in the engine (see the decision above).
- I declined a temptation: `letterScale: null` on the copy is untouched, per the Traps.
- On the closing-a-quarter thread: the brief said it was re-read at claim time and the drop is still per class. I did not re-read it.
