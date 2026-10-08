# WO-1.64 result — the harness floor comes back to 2026-07-01

**Short version.** I built all four deliverables and ticked all six Acceptance boxes, each on output I read myself. The floor is **2026-07-01**, found by running it. The WO-3.27 check is green with the banner and without it. Two mutations turn it red. `src/`, `index.html` and `sw.js` are untouched, so no `CACHE` bump is owed. Nothing is committed. The work order's status still reads `🤖 CLAIMED`; changing it is the orchestrator's job.

## What changed
- `tools/verify/score-grid.mjs`: the WO-3.27 laptop-viewport check now reads `fit.top >= -0.5 && fit.bottom <= fit.inner + 0.5`. Before, it was `>= 0` / `<= fit.inner`. A comment above the block explains the half-pixel and gives the -0.12 / 0.38 readings. The check's title is unchanged. The fixture and its due date are unchanged.
- `tools/verify/lib-dates.mjs`:
  - `TODAY_FLOOR` goes from `2026-09-19` to `2026-07-01`.
  - Dates that don't exist are now refused. After the shape test, the date is built and compared back to the input string. If it doesn't match, the parse throws the typo's own `Error` message. This runs before the floor comparison.
  - The refusal now names `concern-list.mjs`'s June 2026 term and gives no failure count.
  - The floor comment is rewritten: the June term sets the floor, and a short history of the one work order it sat at 09-19.
- `tools/verify-shell.mjs`: the usage text at the head says 2026-07-01, names the June term, and mentions that dates that don't exist are refused.
- `tools/README.md` § `--today`:
  - The typo paragraph now covers dates that don't exist.
  - The floor paragraph is rewritten around the June term.
  - "fifteen red lines" is dropped.
  - The old "what the floor costs" passage is now a short italic history note.
- `TESTING.md`: new § WO-1.64 with every run below.
- `plans/work-orders/phase-1-shell-store-roster.md`: the six WO-1.64 Acceptance boxes are ticked. Nothing else in the file changed.

## Against the Acceptance list
1. **[x] The check passes with and without the banner.**
   - `--today=2026-07-01` (no banner): PASS, `{"pageY":505,"top":-0.12,"bottom":639.88,"height":640,…}`.
   - Real clock, 2026-10-07 (banner drawn): PASS, `{"pageY":576,"top":0.38,"bottom":640.38,…}`.
   - Both full runs are green. The detail lines are in TESTING.md.
2. **[x] A real overflow still turns it red.** I made both mutations in scratch copies of the tree, never in `c:\dev\planbook`, so there was nothing to revert in the repo.
   - **m1:** delivered `- 0.5` tolerance, box pushed 30px past the viewport bottom, real clock, banner drawn. Result: 1832 · 1831 · **1 failed**, EXIT=1, `{"top":190.38,"bottom":830.38}`.
   - **m2:** tolerance changed to `- 5` / `+ 5` plus the same push, `--today=2026-07-01`, no banner. Result: 1 failed, EXIT=1, `{"top":189.88,"bottom":829.88}`.
   - **A decision you should look at:** I did not run the `- 5` change on its own. Loosening the tolerance only lets more pages pass, and the real page measures -0.12 / +0.38, both inside -5. So `- 5` alone cannot turn the check red. I read the line's "or" as satisfied by the push mutation, and used the `- 5` change to show that even a tenfold allowance still catches a 30px overflow. If the verifier reads "`- 5` turns it red" as a separate requirement, it cannot be met as written.
3. **[x] The new floor runs green and the day before is refused.**
   - `--today=2026-07-01`: `1832 checks · 1832 passed · 0 failed · 0 skipped`, 2,043 lines, 14m18s, EXIT=0.
   - `--today=2026-06-30`: EXIT=1 in 0.231s with 0 checks. The output has no serving/CLOCK/PASS/FAIL line, and the floor message names the June term.
   - Nothing else holds the floor higher.
4. **[x] Dates that don't exist are refused.**
   - `2026-13-40`: EXIT=1 in 0.234s. `2026-02-30`: EXIT=1 in 0.227s. Both print the typo message (`--today wants a YYYY-MM-DD date, and got "…"`). Neither output has a serving/CLOCK/PASS/FAIL line, so Edge never launched.
   - `2026-02-28` passes the parse and is then refused **by the floor** (EXIT=1, 0.227s). That is the floor's refusal, not the parse's.
5. **[x] The real-clock run is unchanged.** HEAD `9deb818`, extracted with `git archive` to scratch: 1832/1832, EXIT=0. The delivered tree: 1832/1832, 2,039 lines, EXIT=0. I diffed the two runs' PASS/FAIL/SKIP title sequences with the detail stripped, and they are identical.
6. **[x] The four places agree.** All four say 2026-07-01 and name concern-list's June term. None of them gives a failure count. I grepped `lib-dates.mjs`, `verify-shell.mjs` and the README section for "fifteen" and failure counts: the only hit is `verify-shell.mjs:282` "fifteen sections", which is about something else.

## Runs and other checks
- Four of the full runs (HEAD, real clock, m1, m2) ran at the same time on 16 cores, while the 07-01 run was still going. Each took about 14m15s, and nothing went red that wasn't a target.
- `node tools/wo-sweep.mjs`: `48 checks · 45 passed · 0 failed · 3 to review`, EXIT=0.
- `grep -rn MUTATION tools/ src/` finds no line of mine; filtering it for `WO-1.64` gives 0.
- `git diff --stat` shows six files and 144+/64−, with no whole-file rewrites.

## Could not verify
Nothing here needs an iPad or human eyes. There are no 👤 or 📆 lines.

## Things I chose not to do
- I did not probe an upper bound. That is out of scope.
- I did not re-fixture anything.

## CHANGELOG draft (for you to decide)
"The harness's `--today` takes the first eighteen days of September again. A layout check had compared a scroll position to the exact pixel, and it only passed when a past-due banner happened to be drawn. It now allows the half-pixel its neighbours already allow. The floor is back at the June-term fixture (2026-07-01), and a date that doesn't exist, like 2026-02-30, is refused instead of rolling over."
