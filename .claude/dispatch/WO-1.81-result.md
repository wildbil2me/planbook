# WO-1.81 — result (implementer, Claude Opus)

Nothing committed. I did not run `--start`, `--handoff` or `--tick`. The row is still 🤖 CLAIMED. I
ticked all five Acceptance boxes in `plans/work-orders/phase-1-shell-store-roster.md`. Each tick
rests on a run I read to its exit, and none of the lines carries 👤 or 📆.

## What was built

- **`tools/wo-sweep.mjs` § 33, "no import loop among the modules in src/".** It sits after § 32 and
  before § 22, and § 22 is still last. It reads every `.js` file directly in `src/`. It collects four
  kinds of relative specifier: static `import … from`, side-effect `import '…'`, `export … from`, and
  a literal `import('…')`. It builds the graph and finds strongly connected components (Tarjan). Then
  it lists every elementary loop inside each component, so a two-module loop is one finding and a
  component holding two loops names both. Each loop prints closed and in order, starting at its
  alphabetically first module, followed by the `file:line` of every import in it. There is no
  allowlist. The banner says it is a fence and not a reading: a specifier built at runtime escapes it.
- **The scanner is shared, not a third blanker.** § 31's character scanner moved out of § 31 into a
  top-level `scanScript(text, { keepText })`. The default mode is the old function exactly. I diffed
  the sweep's output before and after the move and only line numbers changed. § 33 calls it with
  `keepText: true`, which blanks comments but keeps string text, because the specifier is a string. A
  `//` or `/*` inside a string is not taken as a comment. The function also returns the mode the scan
  ended in. If a scan ends inside a string, template, comment or `${`, § 33 fails and names the file.
- **An empty read fails.** These are FAIL branches of the one `check()`: no `src/`, zero modules, zero
  edges, or a derailed scan. So § 22's count moved by exactly one.
- **`tools/README.md`.** The `wo-sweep.mjs` row gains one § 33 clause, and the count moves 51 → 52.
  I confirmed the 52 from § 22's own line, not by adding it up by hand. No module or edge count is
  written in the README or the banner.
- **`TESTING.md` § WO-1.81.** It sits under Phase 1 after WO-1.80. The Acceptance lines are copied
  verbatim; a scratch script compared them with the phase file after normalising whitespace, and all
  five match.

## Against § 5, line by line

1. **`node tools/wo-sweep.mjs` has a check that passes on today's tree and prints how many modules and
   edges it read.** Met.
   - Output: `PASS | no import loop among the modules in src/ … :: 64 module(s) in src/ read with comments stripped and string text kept; 359 distinct import edge(s) from 363 import/export statement(s) (0 a literal dynamic import()), and no loop. …`
   - Cross-check: a scratch script matching column-0 statements in the raw text found the same
     specifiers in all 64 files.
2. **A planted two-module cycle and a planted cycle of three or more each turn it red, naming every
   module in the loop in order. Both plants are reverted, and `TESTING.md` § WO-1.81 shows the red
   output.** Met. Each plant went in and came out with the Edit tool, never `git checkout`.
   - **Two modules:** `date-text.js → score-history.js → date-text.js (src/date-text.js:86, src/score-history.js:70)`.
   - **Three or more:** a `scores.js → assignments.js` plant, on WO-3.66's path. It turned up two
     loops: `accommodation-prompt.js → signals.js → scores.js → assignments.js → accommodation-prompt.js`
     and `assignments.js → held-column.js → scores.js → assignments.js`. A brute-force enumeration of
     every simple path from assignments to scores on the unplanted graph found exactly those two.
   - **Extra, not asked for:**
     - A self-import: `live-region.js → live-region.js`.
     - A loop written only in comments. It stays green.
     - A real import placed after a string holding `//` is red at that line. The commented lines just
       above it are not cited.
   - After each plant, `git diff --stat -- src/` printed nothing.
3. **A check that reads zero modules or zero edges fails rather than passing.** Met. Three plants in
   § 33 itself, each reverted with Edit:
   - File filter changed to `.jsx` → `EMPTY READ: no .js file directly in src/ …`
   - Statement pattern broken → `EMPTY READ: 64 module(s) in src/ and not one import edge …`
   - `keepText: false` (the trap the brief named) → the same zero-edge FAIL.
   - One more `src/` plant tested the derailment arm: a regex literal holding a backtick gave
     `src/live-region.js (the scan ended inside a template) …`.
4. **`node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.** Met.
   - `verify-shell.mjs`: *2061 checks · 2061 passed · 0 failed · 0 skipped*, 1129s, `EXIT=0`. I waited
     for it to exit and read the summary from its log. It was started after the seven plants for
     lines 2 and 3 were out. The derailment plant was made only after it finished.
   - `wo-sweep.mjs`, last run after every edit: `EXIT=0`, *52 checks · 49 passed · 0 failed · 3 to
     review*. The three reviews are the standing three.
   - One caveat: after `verify-shell.mjs` started I made one comment-only edit to `wo-sweep.mjs` (the
     PROVED paragraph). `verify-shell.mjs` does not read that file.
5. **`TESTING.md` § WO-1.81 carries these lines verbatim with the evidence for each.** Met; checked by
   script as described above.

## Final state of the tree

- `git diff --stat -- src/` prints nothing.
- `grep -rn "MUTATION WO-1.81" src/ tools/` finds nothing.
- `grep -rn MUTATION src/ tools/` finds only matches that were already there: prose in
  `src/shell.js:1070`, `tools/verify/*` and `tools/wo-gate.mjs:2800`.

## Files changed

- `c:\dev\planbook\tools\wo-sweep.mjs`: `scanScript()` added, § 31 calling it, § 33 new.
- `c:\dev\planbook\tools\README.md`: the row clause, and 51 → 52.
- `c:\dev\planbook\TESTING.md`: § WO-1.81.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: five ticks. The claim line
  already in the diff was the orchestrator's.
- `c:\dev\planbook\.claude\dispatch\WO-1.81-result.md`: this file.

## Decisions the work order did not settle

- **Empty read: a FAIL branch, not its own check.** This matches § 31's anchors and § 32's ANCHOR
  LOST, and it means the count moves by one.
- **Moving § 31's scanner** was the brief's "reuse it", and that is how I read it. It does touch
  § 31's code. The output was identical before and after, apart from line numbers.
- **Which modules count:** only files directly in `src/`. `src/` has no subdirectory today. A
  specifier that resolves outside that set is printed in the PASS detail, not silently dropped. There
  are none today.
- **Loop naming:** each loop starts at its alphabetically first module, so the same loop always
  prints the same way. Output stops after 20 loops, with "and N more".
- **The two-module plant used `REVISION_WINDOW_MS`, not `reviseCell`.** With `reviseCell`, § 28 also
  went red (only the two score writers may import it), which muddied the evidence. `TESTING.md` says
  so.

## Declined, out of scope

- **Refusing a dynamic `import()` whose argument is not a literal.** It is the exact hole the banner
  names, and there are none today. But it would be a new rule nobody has ruled on, so it is only
  stated in the banner.
- **A real regex-literal mode in `scanScript()`.** The derailment arm fails loudly instead.
- **Widening to `tools/`.** Forbidden by the Traps.

## Worth knowing

The three-module plant found a **second, unnamed route from `assignments.js` to `scores.js`**:
`accommodation-prompt.js → signals.js → scores.js`. Any future `scores.js → assignments.js` import
closes two loops, not the one WO-3.66 found by reading.

## Draft CHANGELOG entry, for the maintenance pass (not written to CHANGELOG.md)

- **`wo-sweep.mjs` § 33 refuses an import loop among the modules in `src/`.** The rule had been held
  six times, each time by one work order's Acceptance line and a throwaway script. Now every run
  reads the static imports, re-exports and literal dynamic imports, with comments stripped. On a loop
  it names every module in order, closed, with the line of each import, so the reader sees where to
  cut. It prints the modules and edges it read, and it fails rather than pass over an empty or
  derailed read. It parses text, so a specifier built at runtime escapes it, and the banner says so.
  § 31's scanner is now shared with it. The sweep is 52 checks.
