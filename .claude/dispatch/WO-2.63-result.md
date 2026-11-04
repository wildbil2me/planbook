# WO-2.63 — the day-by-day grid centres its marks under their dates · result

**Implementer** Claude Opus (work-order-implementer), 2026-11-03. Nothing committed. Status line left at
`🤖 CLAIMED` (no `--tick` run). Four of five boxes ticked. The 👤 line is open.

## Files changed

- `src/attendance.css`: the grid's two alignment rules are now `.attendance-report-grid .attendance-report-day`
  and `.attendance-report-grid .attendance-report-cell`, at (0,2,0). They are changed on screen (~1077/1080,
  with a WO-2.62-style comment at the point of the fix) and as the same two restatements in the
  `@media (pointer: coarse)` block (~1503–1504). No head-only rule, no `!important`. `.attendance-report-row-head`
  and the `.attendance-report-dow`/`-date` display rules are untouched.
- `tools/verify/report-alignment.mjs`: one new `check()` site, placed after the record's *By student* reading.
  It reads the *Day by day* tab under all four conditions (screen, plus each of the three print gates under
  emulated print media). It asserts absolute values per element, and asserts the counts it read.
- `sw.js`: `CACHE` changed from `planbook-shell-v209` to `v210`.
- `tools/README.md`: call-site count changed from 2201 to 2202, plus a new "WO-2.63 moved it…" paragraph
  after WO-3.71's.
- `TESTING.md`: new section `### WO-2.63 — the day-by-day grid centres its marks under their dates`, under
  Phase 2, after § WO-2.62.
- `plans/work-orders/phase-2-attendance.md`: Acceptance lines 1, 2, 3 and 5 ticked. The status line still
  carries the `--start` edit that was already on the tree.

## Commands and their exit lines (read from output, not predicted)

- `node tools/verify-shell.mjs`, delivered tree before the CACHE bump: `2208 checks · 2208 passed · 0 failed · 0 skipped`,
  `72,166 lines · 32.7 lines per check · 1194s`, EXIT=0.
- `node tools/verify-shell.mjs`, final tree (after the CACHE, README and TESTING edits): `2208 checks · 2208 passed · 0 failed · 0 skipped`,
  `72,166 lines · 32.7 lines per check · 1195s`, exit 0. The new line reads
  `PASS | WO-2.63 · in the record's Day by day grid … :: 4 readings, each of 3 date heads, 6 mark cells, 2 row heads and 1 Student head`.
- `node tools/wo-sweep.mjs`, final tree: `52 checks · 49 passed · 0 failed · 3 to review` (the three standing REVIEWs), exit 0.
- **Mutation:** all four grid rules (two on screen, two in the coarse block) were put back to bare
  `.attendance-report-day` / `.attendance-report-cell`, each marked `/* MUTATION WO-2.63 */`. The delivered CSS
  was staged first. The run used a scratch copy of the entry file in the session scratchpad, restricted to
  `localstorage-prefs` and `report-alignment` (WO-2.62's arrangement; imports and ROOT rewritten to absolute
  paths, nothing written to `tools/`). Result was EXIT=1, `17 checks · 16 passed · 1 failed · 0 skipped`, with:
  `FAIL | WO-2.63 · … :: screen: date head "TUE3/2" computes left, want center · screen: date head "WED3/3" computes left, want center · screen: date head "THU3/4" computes left, want center · screen: mark cell "P" computes left, want center · screen: mark cell "A" computes left, want center · screen: mark cell "P" computes left, want center · …`.
  All twelve WO-2.62 checks stayed green under the mutation. That is the defect's own shape: their
  head-against-cell comparison excludes the grid.
- **Revert:** `git checkout -- src/attendance.css` against the stage. After that, `git diff src/attendance.css`
  against the stage was empty, and `grep -rn "MUTATION WO-2.63" src tools sw.js index.html` returned exit 1
  (nothing found). The same subset on the reverted tree: `17 checks · 17 passed · 0 failed · 0 skipped`, EXIT=0.
  The file was then unstaged (`git reset -q`), so the working tree holds the change unstaged as delivered.
  `git diff src/attendance.css` against HEAD shows only the two selector changes, the comment, and the two
  coarse-block selector changes.

## Acceptance, line by line

1. **[x] Date heads and mark cells compute `center`; *Student* head and row heads compute `left`, on screen and
   with `data-attendance-print` set.** The new harness check is the evidence. It runs on screen and under each
   of the three print gates (one more than the line asks). It reads `th.attendance-report-day` and
   `td.attendance-report-cell`, never `.attendance-report-mark`, and asserts 3/6/2/1 counts so an empty grid
   cannot pass. I also read the `data-attendance-print` block through by hand: it sets padding, the row head's
   `max-width`, `.attendance-report-day { width: 6mm }` and the mark's size, and no `text-align`. Paper follows
   the screen.
2. **[x] Mutation red, reverted, red output in TESTING.md.** Covered above. The quoted output is in § WO-2.63.
3. **[x] verify-shell and wo-sweep pass; CACHE bumped.** Covered above (v209 to v210).
4. **[ ] 👤 iPad after a force-quit, Day by day tab, marks centred.** Not read. I have no iPad. Owed to the
   owner, with About reading v210.
5. **[x] TESTING.md § WO-2.63 carries the lines verbatim with evidence.** The section exists. The four ticked
   lines plus the open 👤 line are copied verbatim.

## Decisions the work order did not settle

- **One check, not several.** It is a single absolute-value check per grid across the four conditions. It is
  not folded into WO-2.62's `verdict()`, because that function's job is head-against-cell agreement, and the
  brief warns that this is exactly what passes this defect.
- **Every print gate, not only `data-attendance-print`.** This matches how the section already reads every
  other table: computed alignment does not depend on display.
- **The CSSOM structural check was not extended** to the grid classes. A head-only `th.attendance-report-day`
  patch would still leave the `td`s left, and the computed check catches that. So the extension would only
  re-assert what the computed half already sees. Adding it would also change WO-2.62's check message, which
  I judged out of scope.
- **The coarse block restates the scoped selectors** rather than dropping the restatements. The deliverable
  says "on screen and in the coarse block", and that is followed literally.

## Declined / out of scope

- The `BROWSER_SECTIONS` row comment in `tools/verify-shell.mjs` and the file header of
  `tools/verify/report-alignment.mjs` still describe only WO-2.62's tables. The new block carries its own
  banner comment. Widening those two descriptions would be a cosmetic follow-up; I left them alone.

## CHANGELOG draft (for the teacher to decide)

> The attendance record's *Day by day* tab now centres each date over its column and each mark under its
> date, on screen and on paper, as its stylesheet always intended. A table-wide left alignment had been
> outranking it, so every mark sat at the left edge of its column. Names still read down the left edge.
