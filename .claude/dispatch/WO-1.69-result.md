# WO-1.69: result (implementer, Claude Opus)

## What was built
`tools/wo-sweep.mjs` § 19f now checks each `proposed*.css` separately. Two faults are added to the existing collision check's FAIL (*"a pending mockup section styles no class src/ already styles"*), and each one names the sheet and the banner shape the check expects (PROTOCOL.md rule 4):

1. **A sheet that declares a class and parses to zero body sections.** "Declares" comes from the existing `declaredClasses(stripCssComments(...))` helper, so no second helper was written. A sheet that declares no class is not counted, as the Traps require.
2. **A section named in the sheet's header index that has no body banner of that name.**

**Judgment call: I kept both rules.** The header index reads reliably on every sheet, so I did not take the "keep only the first rule" exit. How the index is read:
- It is limited to the opening comment: from the first non-blank line, if that line opens `/*`, up to the first `*/`.
- An entry is a line matching `^\s*§\s+NAME\s+→`. The target is not read.

That handles every shape the brief flagged:
- **Wrapped entries** (`proposed-phase4.css:25`, `proposed-scores.css:37` and `:39`) are read from their first line, which holds the whole name.
- **`proposed-phase6.css:27`** (`§ SHARED → whichever lands first`) reads like any other entry, because the target is never parsed.
- **`proposed-scores.css:42`** is prose that starts with `§` but has no `→`, so it is not an entry.
- **Body banners**, including `proposed-phase7.css:79` with its index-like indent, sit outside the opening comment.

On today's tree the check reads 28 index entries across 9 sheets, and the PASS line prints that count, so rule 2 cannot pass silently over nothing.

**No new `check()` call site.** The sweep stays at 50 checks and the counts recorded in `tools/README.md` do not change. The parser's banner shape was not widened.

## Acceptance, line by line
1. **[x] On a scratch copy, a one-line rewrite of one body banner turns the sweep red, naming the sheet, and is reverted before anything else is written.**
   - **Method.** The sweep reads `design/mockups/` by fixed path, so I copied each sheet to the session scratchpad and collapsed the banner box in place with a scratchpad-only script (`mut.mjs`, never in the repo). I then ran the sweep, copied the backup straight back, and checked that `git status --short design/` was empty before the next step.
   - **Run A** collapsed `proposed-attendance.css` § ATTENDANCE HEADER. Exit 1, `46 passed · 1 failed`, and the FAIL reads *"design/mockups/proposed-attendance.css: its header index names § ATTENDANCE HEADER (line 40) and no body banner of that name parses"*.
     - The same mutation against `git show HEAD:tools/wo-sweep.mjs` gave exit 0 and PASS. That reproduces the defect this work order exists for.
     - I repeated Run A against the final sweep file: same FAIL, restored afterwards, and the clean tree went back to exit 0.
   - **Run B** collapsed both banners in `proposed-copy.css`. Both rules fired, in one entry.
   - **Run C** collapsed both boxed banners in `proposed-phase7.css`, which has no index. Rule 1 fired on its own.
2. **[x] Every `proposed*.css` passes unchanged.** `git status --short design/` is empty. The PASS line says: *"None of the 10 sheet(s) declares a class and parses to zero sections, and all 28 section(s) named in a header index have a body banner"*. Neither rule fires on `proposed-phase7.css:19`, as the brief predicted, and I did not touch that sheet.
3. **[x] Sweep green and audit passes.** `node tools/wo-sweep.mjs` exited 0 with `50 checks · 47 passed · 0 failed · 3 to review` (the same three REVIEWs as before). `node tools/wo-gate.mjs --audit` exited 0. Both were run on the final tree, after every edit.
4. **[x] `TESTING.md` § WO-1.69 is written** under Phase 1, after WO-1.68, with the Acceptance lines copied verbatim and the evidence for each.

**`node tools/verify-shell.mjs`** finished with exit 0 and `1915 checks · 1915 passed · 0 failed · 0 skipped`, read from the log after it exited. Nothing in `src/` moved, so no `CACHE` bump is owed.

**MUTATION check.** I wrote no MUTATION marker. `grep -n MUTATION` over the four changed files and every `proposed*.css` finds only prose that was already there. `git diff -U0 | grep MUTATION` finds only my own TESTING.md sentence describing this check.

## One mistake I made and fixed
My first wording of the new § 19 banner put a literal `/* ══ § … ══ */` inside the block comment, and its `*/` closed the comment early. That turned the sweep into a SyntaxError (exit 1). I caught it on the re-run and reworded it.

The three mutation runs had been made before that banner edit. Their logic is identical to the final file's, and I re-ran Run A against the final file anyway.

## Files changed
- `c:\dev\planbook\tools\wo-sweep.mjs`: the § 19 header paragraph, the per-sheet block after `preambles.set()`, the fault message, and the PASS text.
- `c:\dev\planbook\tools\README.md`: one clause in the `wo-sweep.mjs` row, saying what § 19 now checks and the gap it leaves.
- `c:\dev\planbook\TESTING.md`: the WO-1.69 section.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: the four Acceptance boxes ticked. The status line is left to `--tick`. That file already had the orchestrator's CLAIMED edit, unstaged.

## Proposed follow-ups (out of scope, not acted on)
- **Gap neither rule reaches:** a one-line banner in a sheet with no header index and at least one good section. `proposed-phase7.css:19` (`§ SYNC BUTTON`) is one, in the tree today. It is worse than "read as nothing": its rules fall into the **preamble** above `§ FIRST RUN`, and the collision loop never reads the preamble (only the orphan clause does). So `.hdr-sync-btn`'s state rules have never been compared against `src/`. That section is marked lifted, so nothing is at risk today.
  - There are two possible fixes. One is to give that sheet a header index (an edit to a drawing). The other is a rule that does not depend on an index, for example: fail any comment line in a `proposed*.css` matching `/\*\s*═+\s*§`.
- Unreadable-sheet faults are folded into the collision check. They are not a separate check, which would have added a call site and changed the counts. If the owner prefers a separately named check, that is a one-line move plus a README count bump.

## CHANGELOG draft (the teacher decides)
> The mockup sweep now reads every proposed stylesheet one at a time: a sheet that declares classes but whose sections can't be parsed, or whose header index names a section with no banner, fails the collision check by name instead of passing unread.

No 👤 or 📆 lines. Tooling only.
