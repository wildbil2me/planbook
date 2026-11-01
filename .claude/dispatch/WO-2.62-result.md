# WO-2.62 — result (implementer, Claude Opus)

**Status:** built. Six of seven Acceptance lines closed and ticked in the phase file and in `TESTING.md`
§ WO-2.62. The 👤 line is left open: it needs the iPad and a printer. Nothing committed. **Note:** I
staged my own files (`git add`) before the mutation rounds so a `git checkout` revert could not
overwrite them. `TESTING.md`, `tools/README.md` and the phase file are modified but not staged.

## Against the Acceptance list

1. **Every head's computed `text-align` equals its column's cells', in five tables and the grade
   sheet, on screen and under each print attribute: MET.** New section
   `tools/verify/report-alignment.mjs`, registered right after `verify/print-sheets.mjs`. It plants its
   own class and opens each surface through its real door. For every column it reads the computed
   alignment of the head and of every `tbody`/`tfoot` cell. It does this on screen, then with each of
   `data-attendance-print`, `data-grades-print` and `data-detail-print` set on `<body>` under emulated
   print media. Every table is read under all four conditions, which is more than the line asks for.
   Each column is also checked against what it is for: right for numbers, left for names, dates and
   marks, centre for a grade-sheet assignment. That second comparison matters: once the `thead` patch
   is deleted, putting the old column rule back leaves heads and cells agreeing at left, so a check
   that only asked "does the head match its cells" would pass it. The six tables checked:
   - the record's By student summary
   - the student page's term table
   - day by day
   - the pass counts, including the *All of …* footer
   - the trip table, in the pass dialog and on the student page
   - the grade sheet

   I also put the pre-WO stylesheets back from `HEAD` and ran the scratch subset against them: 8 of
   16 checks went red. The grade-sheet line shows the booked paper defect exactly: *"data-grades-print
   … head center, cell left (Able, Ana) … head center, cell right (86.67%B)"*.
2. **Dash and accessible name: MET.** The record's rows and term B's row of the term table read `—`
   with `aria-label="No recorded meetings"`. The accessible name was read from Chromium's
   accessibility tree (`Accessibility.getPartialAXTree`), not just from the attribute. Rows that
   have meetings carry no label. The card title reads exactly `Attendance · No recorded meetings`.
   `percentText()` is untouched, and so are both CSVs.
3. **`attTotalsRow` gone, `totalsRow` imported, `scope="row"` kept: MET.** `grep attTotalsRow
   src/detail.js` finds nothing, and `scope="row"` was read on every row head. **Import-loop check:**
   I walked `src/attendance-report.js`'s imports transitively (static, multi-line and dynamic forms)
   with a scratch script. It reaches 20 modules: alert-sound, attendance, backup, calendar,
   categories, classes, grade-engine, letter-scale, live-region, modal, passes, prefs, print-gate,
   roster, save-indicator, store, supports, views, year-picker, zip. `detail.js` is not among them.
4. **Both mutations go red and are reverted: MET, with one honest caveat.**
   - **M1** (put the column rule back to a bare `.attendance-report-num`): `16 checks · 10 passed · 6
     failed`.
   - **M2** (take the head selectors out of the grade sheet's two print rules): `16 checks · 15 passed
     · 1 failed`. The red is from the **structural CSSOM check only**. The computed grade-sheet check
     stays green, and it has to: this work order's own screen fix now wins for head and cell, so the
     print rules restate the alignment rather than repair it. That is why the structural check
     exists. It requires every `text-align` rule to name both halves of a grade-sheet column, and it
     refuses any rule that aligns a column class under `thead/tbody/tfoot/th/td`.

   Both mutations were run on a scratch copy of the entry file in the session scratchpad, limited to
   `localstorage-prefs` (which sets `seam`) and `report-alignment`. WO-2.61 used the same method.
   Both were reverted with `git checkout` against the staged tree. `grep -rn "MUTATION WO-2.62" src
   tools index.html sw.js` finds nothing outside `tools/README.md` prose. The red output is in
   `TESTING.md` § WO-2.62.
5. **Harness and sweep pass, CACHE bumped: MET.** `node tools/verify-shell.mjs` on the delivered tree:
   `2205 checks · 2205 passed · 0 failed · 0 skipped`, 71,830 lines, 32.6/check, 1233s, `EXIT=0`
   (read from the log after the process exited). `node tools/wo-sweep.mjs`: `52 checks · 49 passed ·
   0 failed · 3 to review`, exit 0. `CACHE` went v207 → v208. The `tools/README.md` call-site count
   went 2191 → 2199, with a ledger entry: 8 sites, 12 results.
6. **👤 iPad and paper: NOT VERIFIED, left `[ ]`.** It needs the iPad after a force-quit, and one
   printed grade sheet from the laptop.
7. **`TESTING.md` § WO-2.62: MET.** It sits under Phase 2, after WO-2.61, with the Acceptance lines
   verbatim and the evidence for each.

## Decisions the work order did not settle

- **What "the grade sheet's print head rule" is.** I put each head in the same print rule as its
  cells (`body[data-grades-print] .grades-report-student-head, … .grades-report-row-head { … }`, and
  the same for total). The alternative was separate head rules, and the Traps line forbids adding a
  head-only rule. So M2 means removing those two head selectors.
- **The structural check (one extra check site).** I added it because the computed reading cannot
  see M2, for the reason given under line 4.
- **`tools/verify/excused-report.mjs` golden edited.** WO-3.70's captured text held the term table's
  two `No recorded meetings` cells. I changed those two cells to `—` by hand and left a comment
  saying so. Nothing else in the golden changed.
- **The first term-B door.** Term B needed one ungraded assignment so the Scores screen draws rows
  that open the student page. It is stated in the fixture comment.
- **The CSS check reads all three print attributes on every table**, not only the one that prints
  that table. Computed `text-align` does not depend on `display`, so this is a superset of the line.

## Declined, out of scope

- `.attendance-report-day` and `.attendance-report-cell { text-align: center }` (0,1,0) lose to the
  same table-wide left rule, so the record's day-by-day grid is not centred as its CSS intends. Heads
  and cells there still **agree** (both left), so it is not this work order's defect. I left it
  alone; it could be booked separately.
- `src/detail.js` has one leftover double blank line where `attTotalsRow()` was removed. I noticed it
  after the full run and did not touch `src/` again, so the delivered tree is the one that was run.

## Files changed

- `src/attendance-report.js`: `totalsRow()` exported, with the dash and its aria-label
- `src/detail.js`: `attTotalsRow()` deleted; `totalsRow` imported
- `src/attendance.css`: the column rule scoped to the table; the `thead th` patch deleted
- `src/scores.css`: student and total rules scoped to the table; the print rules name each head beside its cells
- `sw.js`: CACHE v208
- `tools/verify/report-alignment.mjs`: new
- `tools/verify-shell.mjs`: import and registration
- `tools/verify/excused-report.mjs`: two golden cells
- `tools/README.md`: call-site count and ledger entry
- `TESTING.md`: § WO-2.62
- `plans/work-orders/phase-2-attendance.md`: six boxes ticked

## CHANGELOG draft (the teacher's call)

> **Numbers sit under their own heads.** In the attendance record's *By student* tab, the student
> page's term table and day by day, and both hall-pass tables, each count is now right-aligned under
> its own column head. Before, every count sat one column to the left of where it seemed to belong.
> On a printed grade sheet, *Student* now sits over the names and *Grade* over the totals. A row with
> no recorded meetings shows `—` in its Attendance column instead of a sentence that spilled into
> the Meetings column, and a screen reader still says "No recorded meetings". The student page's
> attendance title still uses the sentence, and so do emails.
