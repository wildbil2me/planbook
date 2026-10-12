# WO-3.65 — result (implementer, 2026-10-12)

**The no-grade banner and the three empty-state sentences now draw above Print and CSV, the sheet under them is unchanged, and the printed page puts the banner first under `#printHeader`, as it did before.** Both tools are green. Nothing was committed and `--tick` was not run. The row is still 🤖 CLAIMED. I ticked all five Acceptance boxes in the phase file, because I have evidence for each one. None of them is a 👤 line.

## What was built

- **`index.html`:** a new empty `<div id="gradesRecordMessages"></div>` is the first child of `#gradesRecordModal .modal-body`, directly before `.grades-report-actions`. Its markup comment explains the rule and why the host prints. It has no class and no CSS rule of its own.
- **`src/grades-report.js`:**
  - New constant `RECORD_MESSAGES`.
  - `openGrades()` now empties the host and the body on every open, before any branch can return (the no-class early return included).
  - The banner and all three `.grades-report-empty` sentences now go into the host instead of the body.
  - The head, label, slices, key and note stay in `#gradesRecordBody`, in their order.
  - No wording, class or margin changed. `src/scores.css` is untouched.
- **`sw.js`:** `planbook-shell-v193` → `planbook-shell-v194`.
- **Harness, `tools/verify/grade-sheet.mjs`:** 7 new checks, inserted between the two-mode pass for acceptance line 4 and the coarse pass. They open the sheet seven times through the seam:
  1. Balanced (the baseline).
  2. Weights at 95.
  3. 95 with nothing assigned (a second, empty term).
  4. Nothing assigned.
  5. Empty roster at 95.
  6. No class open (every class archived for one open, each `archived` restored exactly).
  7. Balanced again.

  Each open is read from the drawn boxes, the way WO-3.63 and WO-3.64 measured theirs. The order is chosen so that a host that was not emptied on open would carry a stale message into the next reading.
- **Harness, `tools/verify/print-sheets.mjs`:** 1 new check, placed before the belt block. It reads the banner on paper at 95, and the empty host at 100.
- **Docs:**
  - `TESTING.md` § WO-3.65, under Phase 3.
  - `tools/README.md`: call-site count 2037 → 2045 (taken from the sweep), plus a WO-3.65 ledger paragraph.
  - `design/mockups/README.md`: a "Decided … before WO-3.65's dispatch" section.
  - `design/mockups/dialog-messages.html`: frame 10's print caption changed from `ask` to `decided`, matching what WO-3.64 did for frame 6.
  - Phase file: the five boxes ticked, and a "Found at build" note.

## Acceptance, line by line

1. **Banner above Print and CSV, the sheet otherwise unchanged — PASS.**
   - At weights 95 the host holds exactly the `.grade-none` banner, with the text "The category weights total 95%, so there is no grade yet."
   - Its lowest edge is at 142 and Print/CSV start at 154.
   - There is no message elsewhere in the dialog.
   - The body's children are `[head, label, slice, slice, key, note]`, identical to the balanced sheet's.
2. **Three empty states above the buttons, not under; the banner above the sentence — PASS.**
   - In every case the sentence is alone in the host, above both buttons, and no message appears in the body.
   - Nothing assigned: the body is `["grades-report-head"]`.
   - Empty roster: the body is `["grades-report-head"]`.
   - No class: the body is `[]`.
   - At 95 with nothing assigned, the host is `["grade-none","grades-report-empty"]`, `bannerOverSentence: true`, and its lowest edge is at 453, above Print at 461.
   - The head staying in the body is ruling 2.
3. **No message: the host is empty and adds no space — PASS.**
   - `hostH 0`. Margins, padding and borders all read `0px`.
   - `actionsOffset 0`: the actions row starts exactly at the body's content top, where it was when it was the first child.
   - The same reading holds after the no-class open, which shows the host is emptied on every open.
4. **The printed sheet is unchanged — PASS** (from `print-sheets.mjs`, read in print emulation after `beforeprint`).
   - At 95: `gate true`, `first: "grade-none"`.
   - The banner's top (111.1) is below the header's bottom (92.2).
   - The actions row and the head have no box.
   - The banner is in the print block's style: no background colour, a black left rule of 3px.
   - The printed text runs in order: banner 0 · label 58 · key 856 · note 923.
   - At 100 the host has no box and the label comes first.
   - **Supporting evidence from the mutation run (below):** with the banner put back in the body, where it was before the move, the printed reading was identical — `first: "grade-none"`, order `[0,58,856,923]`.
5. **Tools pass, CACHE bumped — PASS.**
   - `node tools/verify-shell.mjs`: `2057 checks · 2057 passed · 0 failed · 0 skipped`, 65,595 lines, 1088s, EXIT=0, real clock, 2026-10-12. I read this from the log's own summary and EXIT line after the run finished.
   - `node tools/wo-sweep.mjs`: `51 checks · 48 passed · 0 failed · 3 to review`, exit 0. The three are the standing review items.
   - `node tools/wo-gate.mjs --audit`: PASS.
   - `sw.js` is at v194.

## Mutation round (optional, run anyway)

- I ran it in a throwaway copy of the tree under the scratchpad. The real tree was never mutated, and the copy has been deleted.
- Three mutations in one run:
  - M1: banner appended to the body.
  - M2: host not emptied on open.
  - M3: `#gradesRecordMessages` hidden under the print gate.
- Result: `2057 checks · 2050 passed · 7 failed`, EXIT=1. The seven failures are exactly seven of the eight new checks, and no other check went red.
- The balanced baseline stayed green, which is correct: it is the first open, so the host has nothing stale in it.
- `grep -rn MUTATION` over the delivered files finds only older prose in `tools/README.md`.

## Runs that went red before the green one

The first full run was 2055/2057, EXIT=1. Both failures were mistakes in my new harness code; the app's readings were correct both times:
- The no-class sentence was copied short of its last clause ("Open a class first.").
- `innerText` applies `text-transform`, so the label prints as `GRADES BY STUDENT` and a mixed-case `indexOf` found nothing.

I fixed both in the harness, and both are recorded in `tools/README.md`.

## Finding to bring back: half of ruling 1's premise is false

Ruling 1 says the banner and an empty sentence both draw today "with the weights off 100 **and** an empty roster (or nothing assigned)". **With an empty roster they never both draw.** `gradesRecord()` asks the balance question of a student (`probe = students[0]`), so with nobody on the roster `unbalanced` is false and only the sentence draws.

- The pair can only appear over a roster with nothing assigned in the term. That case is where I measured it, and the host takes both, banner first, as ruled.
- I did not change this behaviour, because it is outside this work order. The empty-roster check asserts the sentence alone at 95, which is what the sheet drew before the move.
- It is recorded in the phase file ("Found at build"), in `TESTING.md` and in the mockups README.

Whether an empty roster with unbalanced weights *should* also show the banner is the owner's call. If the answer is yes, it would be a small row on `gradesRecord()`.

## What I could not verify

- Paper from a real printer. Chromium's print emulation is evidence about Chromium only.
- How the moved messages look on an iPad. The row has no 👤 line, and none was claimed.
- I did not read the pre-move build directly. Line 4's "where it printed" rests on ruling 3's argument plus the M1 reading above.

## Decisions the work order didn't settle

- **Host shape.** A bare `<div>` with an id, styled only by its children. The banner keeps its own 12px bottom margin, which separates it from the buttons, as frame 10 draws. An empty host has no box. I added no new CSS.
- **Mockup bookkeeping.** I followed WO-3.64's lead: a "Decided" section in the mockups README, and frame 10's print caption marked `decided`.
- **Out of scope, left alone.** The attendance record (`attendanceRecordModal`) has the same buttons-first shape and the same messages-under-buttons pattern. I did not touch it.

## Files changed

- `c:\dev\planbook\index.html`
- `c:\dev\planbook\src\grades-report.js`
- `c:\dev\planbook\sw.js`
- `c:\dev\planbook\tools\verify\grade-sheet.mjs`
- `c:\dev\planbook\tools\verify\print-sheets.mjs`
- `c:\dev\planbook\tools\README.md`
- `c:\dev\planbook\TESTING.md`
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md`
- `c:\dev\planbook\design\mockups\README.md`
- `c:\dev\planbook\design\mockups\dialog-messages.html`
- `c:\dev\planbook\.claude\dispatch\WO-3.65-result.md` (this file)

`plans/first-run.md` was not touched.

## Draft CHANGELOG entry (the teacher's to keep or rewrite)

> **The grade sheet says what is wrong before you print it.** When the category weights do not add
> up to 100, the warning that there is no grade now sits above Print and Download CSV instead of
> under them — and so do the sentences for a sheet with nothing on it (no class open, nobody on the
> roster, nothing assigned this term). The sheet itself, and what comes out of the printer, are
> unchanged.
