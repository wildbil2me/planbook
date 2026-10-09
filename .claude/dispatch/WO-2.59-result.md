# WO-2.59 — result (implementer)

**Status: built. Four of five Acceptance lines ticked on harness evidence; the 👤 line is open.**
Nothing committed. The row is still 🤖 CLAIMED; I ran no `--start`, `--release`, `--handoff` or `--tick`.

## Built as drawn, owner's ruling still owed

The three Open items, built exactly as `design/mockups/attendance-dialogs.html` draws them. No Acceptance tick depends on any of them.

1. **The tabs wear the class screen switcher's look.** They use `.screen-nav` / `.screen-nav-btn` as shipped from `src/assignments.css`. My own names, `.attendance-report-tabs` and `.attendance-report-tab`, carry only the spacing and the coarse 44px floor.
2. **By student opens first.** It is reset on every open.
3. **Keys is 640px**, on the new class `.attendance-keys-panel`.

## Acceptance, line by line

1. **[x] Widths, mutation-proved.** `verify/attendance-history.mjs` opens each dialog through its real door and reads the panel's `offsetWidth`:
   - 1280px, fine pointer: `{"Record":900,"Passes":900,"history":900,"Keys":640}`.
   - 820px: `779/779/779/640`. 779 is 95vw.
   - 1194×834 under a coarse pointer (`matchMedia` asserted true): `900/900/900/640`.

   `verify/grade-sheet.mjs` reads the Grade sheet at 980, 779 and 980 at the same three sizes. For the mutation run I put `max-width` back alone on every rule of all three panel classes (M1–M3). Every reading dropped to 480, and all four width checks went red.
2. **[x] Tabs.**
   - On open: shown `students`, strip `["students*!","days"]`, one summary table, zero slices.
   - Tap *Day by day*: shown `days`, no summary table, one slice, and focus is on the pressed tab.
   - Tap *By student*: back to the summary.
   - Close on *Day by day* and reopen: shown `students`.

   The module draws one part at a time, so the other part is absent from the DOM rather than hidden. M4 removed the reset line in `openRecord()`, and the reopen check went red with `shown "days"`.
3. **[x] Print and CSV.**
   - **Print** (`verify/print-sheets.mjs`, under print media, presentation mode off and on): from By student the boxes are `{"summary":1,"grids":0}` with the title *Attendance record · By student*. From Day by day they are `{"summary":0,"grids":1}` with *Attendance record · Day by day*. Neither sheet has a control with a box, and neither leaks support data.
   - **Continuation line**: on a 30-meeting term it appears only on the second slice, and its text names the part.
   - **CSV**: before any file changed, I captured the SHA-256 of `recordCsv()` for the WO-2.6 fixture, from the tree at `cba8dff` (shell v175). Its CSV path is v174's: WO-2.58 did not touch `src/attendance-report.js`, and its `attendance.js` diff has no `classRecord`, `walkMeetings` or `termTotals`. I used a temporary capture in the section and deleted it afterwards. The new check presses the real Download CSV button on each tab for both terms and reads the Blob as bytes. All four reads match the golden: BOM present, 270 and 686 bytes.
   - **Not measured**: the `:first-child` rule that stops the first Day-by-day slice breaking onto a new page. I read it but did not measure it; no check counts the record's printed pages.
4. **[x] Harness and cache.**
   - `node tools/verify-shell.mjs` after the revert: **`1911 checks · 1911 passed · 0 failed · 0 skipped`**, 60,703 lines, 907s, `EXIT=0`, read from the log.
   - `node tools/wo-sweep.mjs`: **`50 checks · 47 passed · 0 failed · 3 to review`**. The three are the standing reviews.
   - `CACHE` goes from v175 to **v176**.
   - The call-site count in `tools/README.md` goes from 1895 to 1907, with an entry paragraph.
5. **[ ] 👤 Not read.** It needs a laptop print preview and the iPad lying down after a force-quit.

## Runs

| Run | Result |
|---|---|
| Baseline at HEAD, with the temporary CSV capture | 1898/1898, EXIT=0, 907s |
| First full run of the build | 1911 checks, 1910 passed, 1 failed. The failure was my own golden: I wrote the byte counts as string lengths (268/684), but the BOM is three bytes, so the real counts are 270/686. The SHA-256s matched. I fixed the counts and left the hashes alone. |
| Mutations M1–M4, each marked `MUTATION WO-2.59` in the tree | 1911 checks, 1904 passed, 7 failed, EXIT=1. Red: the 3 attendance width checks (480 everywhere), the Grade sheet width check, the reopen check, and 2 cascades in print-sheets (the mode-on record opened on the tab the previous pass left). The CSV check stayed green, as it should. |
| After reverting the mutations (`grep -rn MUTATION src/` shows only an old prose hit in `shell.js`) | 1911/1911, EXIT=0 |

I wrote all prose after the revert.

## Decisions the work order left open

- **The brief's coarse-pointer trap is wrong in its effect, though I fixed both rules anyway.**
  - With the base rule at `width: 900px`, a coarse-block `max-width: 900px` caps nothing, so the iPad would get 900 either way.
  - I changed the coarse lines to `width`, and gave Keys and the Grade sheet coarse rules too, so the coarse block states the panel's width where its reader looks.
  - No mutation of the coarse line alone can go red, and I claimed none. `TESTING.md` says so.
- **The printed title names the part** (*Attendance record · By student*) instead of a third header line, because the continuation line carries the title. `print-sheets` `EXPECT.record` changed to match, and I added a `recorddays` sheet.
- **The first Day-by-day slice carries no continuation line and does not force a page break.** This is the grade sheet's WO-8.4 shape.
- **The section labels the tabs replace are gone**, as drawn. The privacy note under the record prints on both tabs.
- **The empty-term text on Day by day** no longer says "the counts above", because the counts are now on the other tab.
- **The tab hook is `data-attendance-record-part`.** It is routed in `src/shell.js` and listed in its census, and it is not a print gate.
- **Passes and the history dialog are measured in `attendance-history.mjs`**, alongside Record and Keys, since all four open from one screen. `tools/verify/attendance-passes.mjs` is unchanged, although the brief listed it.
- **The tabs have no arrow-key navigation.** They are Tab-order buttons with `role="tab"` and `aria-selected`, as drawn. I did not build the full ARIA tabs keyboard pattern; this is a candidate follow-up.
- **The history dialog widened to 900 as well**, which the Traps line expects until WO-2.60 lands.
- **CHANGELOG.md**: I wrote the entry, because the dispatch prompt and the work order's Deliverables both asked for it. My agent rules say to leave it to the teacher, so treat it as a draft to keep, edit or drop.
- **`design/mockups/README.md`**: I added a short note that items 6–8 landed and the three asks are still open.

## Files changed

`src/attendance-report.js`, `src/attendance.css`, `src/scores.css`, `src/shell.js`, `index.html`, `sw.js`, `tools/verify/attendance-history.mjs`, `tools/verify/grade-sheet.mjs`, `tools/verify/print-sheets.mjs`, `tools/README.md`, `TESTING.md` (§ WO-2.59 under Phase 2), `CHANGELOG.md`, `design/mockups/README.md`, `plans/work-orders/phase-2-attendance.md` (four boxes ticked).
