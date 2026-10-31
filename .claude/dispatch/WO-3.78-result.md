# WO-3.78 — result

**Implementer:** Claude Opus (work-order-implementer), 2026-10-30. Nothing committed. No `--start`,
`--handoff` or `--tick` run.

## Mutation check, first

`grep -rn MUTATION src/ index.html` returns one line, `src/shell.js:1091: A CLASS MUTATION ADDED LATER
ADDS ITS LINE HERE…`. That is existing prose, the same hit WO-3.77's result recorded, and not a
planted edit. No `// MUTATION WO-3.78` marker remains. `git diff --quiet -- src/ index.html` succeeds,
so `src/` and `index.html` are byte-identical to HEAD.

## What was built

Only the harness changed. Two `check()` sites were added at the foot of
`tools/verify/term-record-bar.mjs`, after WO-3.77's checks and inside the same `try`, on the same
class:

- **`plantTerms()`** replaces `cls.terms` outright over `evalJs` and the store, with a flushed save,
  and removes this class's `termRecords`. It is a test-only write, following WO-3.67's precedent. No
  way to reorder terms was added to the app.
  - Quarter 1 and Quarter 2 keep their ids (`tm373q1`, `tm373q2`), so the fixture's columns stay
    filed. A third term, `tm378q3`, is new.
  - Cleanup is the section's existing `finally`, which deletes the whole class.
- **Check 1 (agree):** three ended, unrecorded quarters with list, label and date order all
  agreeing. The bar must show Quarter 3, Quarter 2, Quarter 1. Each line must match WO-3.73's *has
  ended* text exactly and carry its own term's button, and the bar model must equal
  `termsNeedingRecord()`.
- **Check 2 (disagree):** the planted list order is `tm373q1` "Quarter 3" (ends −30), `tm373q2`
  "Quarter 1" (ends −1), `tm378q3` "Quarter 2" (ends −15). The bar must read Quarter 2, Quarter 1,
  Quarter 3, and all three lines are compared. The check's message names the planted list, name and
  end-date orders.
  - The last term in the list is in the middle by name and by date. So all four wrong sorts (by name
    or by date, in either direction) put a different line first.
- The file's header gained a short paragraph pointing at the new section.

## Against the Acceptance list

1. **Three ended quarters unrecorded, three lines newest first by term order. Met.** The clean run
   printed `PASS | WO-3.78: with three ended quarters none recorded, the bar shows three lines…`.
   The evidence read the terms back as Q1 2026-09-30, Q2 2026-10-15, Q3 2026-10-29, and the lines
   came out Q3, Q2, Q1.
2. **List, name and end-date orders all different; the lines follow list order. Met.** The same run
   printed `PASS | WO-3.78: with the class's terms planted in LIST order Quarter 3, Quarter 1,
   Quarter 2 — …`. The bar read `tm378q3` Quarter 2, then `tm373q2` Quarter 1, then `tm373q1`
   Quarter 3.
3. **Both mutations red, both reverted, red output in TESTING.md. Met.** Each mutation went into
   `termsNeedingRecord()` directly after the `reduceRight`. Each run was killed after the section
   printed, so each log ends `EXIT=127` with no summary line. Each mutation was reverted with Edit
   before anything else was written, and the grep was re-read after each revert.
   - **By name, descending (`.sort(`):** the WO-3.78 disagree check went FAIL, with the bar reading
     Quarter 3, Quarter 2, Quarter 1. WO-3.72's fence in `tools/verify/term-record.mjs` also went FAIL
     on `"found":[".sort("]`. The agree check and all seven WO-3.77 checks stayed PASS.
   - **By end date, descending, spelled `['sort'](` on purpose:** WO-3.72's fence does not catch a
     mutator named by a string. That run printed 1,384 PASS and **exactly one FAIL**, the WO-3.78
     disagree check, with the bar reading Quarter 1, Quarter 2, Quarter 3.
   - **Which tool went red.** The Traps say a sort would trip "the sweep's `.sort(` refusal", but
     `wo-sweep.mjs` has no such refusal. That fence is WO-3.72's check inside `verify-shell.mjs`.
     Under each mutation `wo-sweep.mjs` failed one line only: the SHELL-file/CACHE-bump pairing,
     because `src/term-record.js` had changed. So the red that counts is the harness's WO-3.78 check
     in both runs, and in the end-date run it is the only red. The full output is in `TESTING.md`
     § WO-3.78.
4. **verify-shell and wo-sweep pass. Met.**
   - `node tools/verify-shell.mjs` was run on the delivered tree: harness and README count edited,
     `src/` at HEAD. It printed `2137 checks · 2137 passed · 0 failed · 0 skipped`, `68,747 lines ·
     32.2 lines per check · 1184s`, `EXIT=0`, on 2026-10-30 with the real clock. That is two more
     than WO-3.77's 2135.
   - After that run, only TESTING.md, the README ledger paragraph and the work-order ticks were
     written, apart from the planted-and-reverted mutations.
   - `node tools/wo-sweep.mjs`, re-run after every edit: `52 checks · 49 passed · 0 failed · 3 to
     review`, `EXIT=0`. The three reviews are the standing ones. The call-site count reads 2127 and
     matches `tools/README.md:1363`.
5. **TESTING.md § WO-3.78 carries the lines verbatim with evidence. Met.** The section is under
   `## Phase 3 — Gradebook`, directly after § WO-3.77.

I ticked all five Acceptance boxes in `plans/work-orders/phase-3-gradebook.md`. None is marked 👤 or
📆. `node tools/wo-gate.mjs WO-3.78` reports `PASS | gates clear`.

## Files changed

- `tools/verify/term-record-bar.mjs`: header paragraph, plus the WO-3.78 section (two checks and the
  `plantTerms` and `termLabels` helpers).
- `tools/README.md`: call-site line 2125 → 2127, and a WO-3.78 ledger paragraph after WO-3.77's.
- `TESTING.md`: § WO-3.78.
- `plans/work-orders/phase-3-gradebook.md`: the five Acceptance boxes ticked. The status line was
  already changed to 🤖 CLAIMED by the orchestrator.
- `.claude/dispatch/WO-3.78-result.md`: this file.

## Decisions the work order did not settle

- **Which direction to mutate.** I used descending for both mutations, the natural way to write
  "newest first by name/date". It is also the direction that leaves every existing check green,
  which reproduces the gap. The fixture is designed so the ascending sorts change the first line too,
  but those were not run.
- **The second mutation's spelling.** I used `['sort'](` so that WO-3.72's fence could not supply the
  red. This shows the behavioural check catches a change the fence cannot see, which is the claim in
  the work order's "Why it exists".
- **"Term name" means `term.label`.** Terms have no `name` field.
- **The Traps' premise about the sweep is wrong** (stated above). This is a wording note on the
  booked work order, not a defect, and I left the work order's Traps as written.

## Could not verify

Nothing here needs an iPad, and there is no 👤 line.

## Out-of-scope notes

None declined. No `src/` defect was found, and `termsNeedingRecord()` already followed list order.

## CHANGELOG draft (for the teacher; `CHANGELOG.md` not edited)

> **The record bar's order is now tested where the orders disagree (WO-3.78).** Every earlier test of
> the bar's *newest first* used two quarters whose list order, names and dates all agreed, so a
> change that sorted the bar by quarter name or end date would have passed unnoticed — and since the
> home bar opens the newest entry, that would send a teacher to the wrong quarter. The harness now
> plants three ended quarters whose list, name and end-date orders all differ and requires the bar to
> follow the class's own term list. Shown red against a sort by name and a sort by end date, both
> reverted. No change to the app.
