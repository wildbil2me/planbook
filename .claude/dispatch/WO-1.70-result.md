# WO-1.70 — result (implementer)

**Outcome:** built and all four Acceptance lines closed and ticked. No 👤 or 📆 lines exist on this work order. Status left at `🤖 CLAIMED — 2026-10-10`. I did not run `--tick`, `--start` or `--release`, and I did not commit.

## What changed

- `tools/wo-gate.mjs`
  - Added one `--self-check` plant directly after WO-1.68's third-claimant plant: *"an excuse naming a work order that does not claim its box is reported, and the excuse is named as not this set"*. It goes through `runExcused()`. The fixture box is claimed by WO-9.9 (via `fragment`) and WO-9.8 (via `targetCloses`). The excuse is `{ ...FIXTURE_EXCUSE, ids: [WO-9.9, WO-9.8, WO-9.7] }`. WO-9.7 is the chain fixture: it exists in the sandbox and claims nothing, because no `chainCloses` is passed.
  - **Control:** the exact `FIXTURE_EXCUSE` over the same tree must read `ok … excused` and produce no `BAD` row for the fixture.
  - **Plant assertions:**
    - a `BAD` row with both claimants, *claimed by 2 work orders*, and *which is not this set*, with WO-9.7 in the message
    - the box is not also read as excused
    - no stale-excuse row
    - exactly one problem more than the control
    - a non-zero exit
    - no file written (`snapshot()` / `changedSince()`)
  - Added five coverage print-out lines ("And WO-1.70's ONE …") after WO-1.68's.
  - The check itself (line 1819) is **unchanged**.
- `tools/README.md`
  - "fifty-two" became "fifty-three".
  - Added a paragraph for this plant after WO-1.68's.
  - The quoted run line is now `53 plants, 53 caught, 0 missed` / `PASS | 53 of 53 plants were caught`.
- `TESTING.md`: added § `### WO-1.70 — an excuse naming a work order that does not claim its box is proved by nothing` under Phase 1, after § WO-1.75. It has the four Acceptance lines verbatim with evidence.
- `plans/work-orders/phase-1-shell-store-roster.md`: all four Acceptance boxes are ticked. The status line was already modified by the orchestrator's claim. I changed it with a line-targeted `sed -i` on the four checkbox lines; the diffstat shows 5+/5− for the file (claim + four ticks), so line endings were not rewritten.

## Against the Acceptance list

1. **The mutation turns the new plant red, and only that one. Reverted before anything else was written.** Met.
   - I copied `tools/wo-gate.mjs` to the session scratchpad and deleted ` && ex.ids.every(id => set.has(id))` there. `diff` against the real file showed line 1819 only.
   - I ran `node tools/wo-gate.mjs --self-check --against <scratch>`: exit 1, `53 plants, 52 caught, 1 missed.` / `FAIL | 1 of 53 plants were not caught.`
   - The only FAIL is the new plant. Its detail shows `ok ROADMAP.md:409 WO-9.9 + WO-9.8 — excused`, `0 problem(s)`, exit 0. Exactly 52 `ok` lines.
   - I deleted the scratch copy straight after. The real file was never mutated: `git diff --stat` at that point showed only the plant's insertions.
   - `grep -rn MUTATION tools/` gives 18 hits, the same 18 as `git grep -n MUTATION HEAD -- tools/`. All are old prose, none of them new.
   - Order: plant written, then the pre-docs `--self-check` (53/53), then the mutation run, then revert, then documentation.
2. **The real `--audit` still reads `ROADMAP.md:275` as excused.** Met. Exit 0, and the output includes `ok   ROADMAP.md:275  WO-2.1 + WO-2.10 — excused: WO-2.10 amends the box WO-2.1 closed …` and `1 box(es) claimed by more than one work order, 1 excused in SHARED_BOXES, 0 problem(s)`. I re-ran it after ticking: still exit 0, PASS.
3. **`--self-check`, `--audit`, `wo-sweep.mjs` and the README count all agree.** Met.
   - `--self-check`: exit 0, `PASS | 53 of 53 plants were caught.`
   - `--audit`: exit 0, PASS.
   - `wo-sweep.mjs`: exit 0, `50 checks · 47 passed · 0 failed · 3 to review`. These are the three standing REVIEWs, and I ran it after the edits.
   - The README count is 53.
4. **`TESTING.md` § WO-1.70 is written.** Met.

I ran `node tools/verify-shell.mjs` on the finished tree and waited for it to exit: exit 0, `1918 checks · 1918 passed · 0 failed · 0 skipped`.

## The Trap: did the plant go red against today's script?

No. It was green on its first run against the unmutated script. So there was no defect to report and nothing was repaired.

## Which lines the plant does and does not produce (the brief asked)

- `if (ex) used.add(ex);` (line 1818) runs **before** the set test on line 1819. An excuse naming A, B and C over a box that A and B claim is still recorded as used, so the stale-excuse loop stays silent.
- The plant produces one `BAD` row. It is the double-claim message with the suffix ` (an excuse for this box names WO-9.9, WO-9.8, WO-9.7, which is not this set)`.
- It produces no `SHARED_BOXES excuses … stale` row, and the plant asserts that this row is absent.

## Decisions the work order didn't settle

- **The third id is WO-9.7, the existing chain fixture, not a made-up id.** The work order says "a third work order that does not claim the box", and the brief says one "that exists". A nonexistent id would also pass `set.has()` = false, but it would test the less realistic case.
- **The plant is placed right after the third-claimant plant**, not after all three of WO-1.68's, because it is the other half of the same set test. The banner comment "WO-1.68's three" above the group is left as is, and the new plant carries its own WO-1.70 comment.

## Notes

- The work order's Deliverables say "drop this case from what is not covered". WO-1.68's NOT-covered print-out never listed this case, so there was nothing to drop. I added a positive "And WO-1.70's ONE" entry instead, saying the case was unproved until now.
- Nothing in `src/` moved, so no `CACHE` bump.
- Draft CHANGELOG line, for the teacher to decide on: *"The self-check now proves the second half of the shared-box excuse's set test — an excuse naming a work order that does not claim its box is reported, not honoured (53 plants)."*

## Files changed

- c:\dev\planbook\tools\wo-gate.mjs
- c:\dev\planbook\tools\README.md
- c:\dev\planbook\TESTING.md
- c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md (four ticks; the claim was already there)
- c:\dev\planbook\.claude\dispatch\WO-1.70-result.md (this file)
