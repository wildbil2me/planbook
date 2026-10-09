# WO-1.68 — result

**Implementer:** Claude (work-order-implementer), 2026-10-09. I did not run `--start`, `--release`, `--handoff` or `--tick`, and I did not commit. The row still reads 🤖 CLAIMED.

## The decision: exact, comparing the whole line

An excuse is now matched **exactly**. Its `box` must equal the roadmap box's whole first line, with the checkbox stripped, using `===` after `norm()`:

```
const box = norm(lines[line]).replace(/^-\s*\[[ x]\]\s*/, '');
const ex = SHARED_BOXES.find(s => box === norm(s.box));
```

- **The real excuse's `box` string had to change, because this rule requires it.** No plant needed the change. The old fragment `'Marking screen, exceptions-only'` cannot be `===` to any line.
- The excuse now reads `'🚩 Marking screen, **exceptions-only** — the *finished* document holds nothing but exceptions'`, copied from `plans/ROADMAP.md:275`.
- Measured with `node -e` against that line:
  - the old fragment: `===` false, `.includes()` true
  - the new string: `===` true
- **Why exact (written at `SHARED_BOXES`):**
  - A fragment is what a *claim* matches on, and it is meant to survive edits to the box.
  - An excuse is a person's judgment about the box as it is worded.
  - The words after the fragment are where a box changes what it promises, so a change there should make someone look at the excuse again.
- **Two limits, both stated in the comment:**
  - Only the box's first line is compared. That is the same line `roadmapHits()` reads, so rewording a wrapped continuation line does not drop the excuse.
  - A marker written after the checkbox (⏳, 🚫) does drop it.
- I added no rule for `amends`.

## Seam: a different shape from the one the brief suggested

The brief suggested an optional parameter that defaults to `SHARED_BOXES`. I did not use one:
- A plant that calls the function in-process tests the script that is running. Under `--against <copy>` the running script is still the real one, so a mutation in the copy could never turn that plant red. That would break this file's established way of proving plants with mutations.
- Instead, `runExcused()` in `--self-check` writes a second copy of the *sandbox's* script (`<sandbox>/tools/wo-gate-excused.mjs`). The copy has the plant's synthetic excuse inserted after the `const SHARED_BOXES = [` line, and the plant runs `--audit` through it.
  - Because the copy is made from the subject, any `--against` mutation is carried into it.
  - The real excuses stay in the copy, so the WO-2.1 / WO-2.10 box still reads as excused there.
  - The script gains no flag and no environment variable. An input that can excuse a double claim would be a hole a person could use too.
- If the anchor line is ever reformatted, the plant throws loudly; it does not pass silently.
- `doublyClaimedBoxes()` itself is not restructured.

## Acceptance, line by line

1. **[x] The comment above `SHARED_BOXES` and the matching code say the same thing, shown by quoting both in `TESTING.md` § WO-1.68.** Both are quoted there. The comment now says "an exact roadmap-line match after norm() — `box` is the box's WHOLE line with its checkbox taken off, compared with `===`", and the code does that. The `BAD` row's advice now says to excuse a box "by its whole line, checkbox off".

2. **[x] Each new plant is red under a mutation of the branch it covers, on a scratch copy, and every mutation is reverted before anything else is written.**
   - Every mutation was a `sed` on a copy in the session scratchpad, outside the repo, with one changed line each (checked with `diff`). Each was run with `node tools/wo-gate.mjs --self-check --against <copy>`.
   - The real `tools/wo-gate.mjs` was never mutated, so there was nothing to revert. No `MUTATION` marker was written.
   - All four mutations were re-run against the final file, after the last edit to the `BAD` message, with the same results:

   | Mutation | Result | Plants that went red |
   |---|---|---|
   | Claimant-subset test replaced with `true` | `FAIL \| 1 of 52` | The third-claimant plant |
   | Stale-excuse loop disabled | `FAIL \| 2 of 52` | The stale plant, plus the reworded-box plant's stale assertion |
   | Match put back to `box.includes(norm(s.box))` | `FAIL \| 1 of 52` | The reworded-box plant |
   | Excused branch never taken (tests the controls) | `FAIL \| 5 of 52` | Both controls (third-claimant and reworded-box), plus three older plants that expect a clean real-tree `--audit` |
   | Pre-WO-1.68 script (`git show HEAD:tools/wo-gate.mjs`) | `FAIL \| 1 of 52` | The reworded-box plant, which is the defect this work order names |

3. **[x] `--audit` and `--self-check` pass, the sweep is green, `tools/README.md`'s recorded counts match, and the WO-2.1 / WO-2.10 box still reads excused.**
   - `--audit`: exit 0 and PASS, both before and after ticking. It printed `ok   ROADMAP.md:275  WO-2.1 + WO-2.10 — excused: …` and `1 box(es) claimed by more than one work order, 1 excused in SHARED_BOXES, 0 problem(s)`.
   - `--self-check`: exit 0, `52 plants, 52 caught, 0 missed.` / `PASS | 52 of 52 plants were caught.`
   - `tools/README.md` now says fifty-two and `52 of 52`, and has a WO-1.68 paragraph with the mutation readings above.
   - `node tools/wo-sweep.mjs`: exit 0, `50 checks · 47 passed · 0 failed · 3 to review`. The three are the standing REVIEWs. I ran it before and after ticking.

4. **[x] `TESTING.md` § WO-1.68 carries these lines verbatim with the evidence for each.** The section sits under Phase 1, after § WO-1.67.

**`node tools/verify-shell.mjs`** (required by § 4 of the brief, even though nothing in `src/` moved): exit 0, `1881 checks · 1881 passed · 0 failed · 0 skipped`, 885s. I read it off the finished run's own output. It ran on the final `tools/`; the only edits made after it started were the `TESTING.md` section, the ticks and the sweep's evidence line.

**Nothing I could not verify.** There is no 👤 line and no 📆 line.

## Files changed

- `c:\dev\planbook\tools\wo-gate.mjs`:
  - comment, `SHARED_BOXES` string and match in `doublyClaimedBoxes()`
  - the `BAD` advice wording
  - a `chainCloses` option on `fixtureBlock()`
  - `runExcused()` and shared readers
  - three plants
  - the self-check's closing prose
- `c:\dev\planbook\tools\README.md`: count 49→52 and a WO-1.68 paragraph. The "SHARED_BOXES is not planted" sentence is kept as an italic history note.
- `c:\dev\planbook\TESTING.md`: § WO-1.68.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: the four Acceptance boxes are ticked. The status is untouched.

No scratch files are in the repo; mutation copies live only in the session scratchpad. `git diff --stat`: 4 files, +231 / −18.

## Notes for the record

- **Declined (out of scope):** `plans/work-orders/README.md:125` says SHARED_BOXES excuses "by name". That is still true, so I left it, although it could now say "by its whole line".
- **Convention set:** a plant that needs a different value of a module-level constant gets it through a rewritten copy of the sandbox's script, not through a seam in the tool. That keeps `--against` mutation proofs working.
- **CHANGELOG draft** (for the teacher to decide on): "`--audit`'s shared-box excuse now matches the box's whole line, as its comment always claimed. Rewording an excused box makes `--audit` red until someone re-reads the excuse. `--self-check` now plants the three ways an excuse can fail (52 plants)."
