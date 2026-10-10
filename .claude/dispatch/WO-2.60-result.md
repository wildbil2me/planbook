# WO-2.60: result

**Implementer:** Claude (work-order-implementer), Opus, 2026-10-09
**Status left at:** 🤖 CLAIMED. I did not run `--start`, `--handoff` or `--tick`. Acceptance lines 1–5 are ticked in `plans/work-orders/phase-2-attendance.md`. Line 6 (👤) is open.
**Mutations:** five were inserted, each marked `MUTATION WO-2.60`. All five were reverted before any doc was written. `grep -rn "MUTATION WO-2.60" src tools index.html sw.js design` returns nothing. `git diff --stat src` came back empty against the staged pre-mutation tree. The index was then unstaged with `git reset -q`, so the working tree is unchanged and nothing is staged or committed.

## What was built

- **A tap on a name now opens today's card.**
  - The dialog title is the student's name.
  - The body is the write block, unchanged: mark, time, note, Un-confirm, same hooks, same routes in `src/shell.js`.
  - Under the block is one door in a `.modal-actions` row: *Attendance history and grades →*. It carries `data-student-detail`.
  - Removed from the dialog: the rate badge, the avatar, the pass count, the "Grades for" door, the term table, day by day and the footnote.
  - The panel is the stock 480px `.modal-panel` and no longer wears `.attendance-report-panel`.
- **A read-only card on a day nothing can be written to.**
  - `src/attendance.js` gained `readOnlyMark()`. It shares a new private `markGate()` with `editableMark()`: the same five tests, run once, returning the refusal reason. `editableMark()` now calls the gate too, and its behaviour is unchanged.
  - `src/attendance-report.js` `readOnlyBlock()` only words the reason.
  - The block carries `data-attendance-readonly="<reason>"`. It has no input, no hook and no tabindex.
  - It shows a chip only when the day has a record with a mark.
- **The present hint is in the teacher's words**, as drawn.
- **The student page's attendance card** (`src/detail.js` `attendanceCard()`) now has, under the five counts:
  - the term table: every term, the open one marked "— open", then Whole year;
  - a closed `<details>` for day by day, newest first, each row with its running fraction.
  - The readers are `termTotals()`, `attendanceTotals()` and `termHistory()`. There is no walk of `doc.attendance` in that file.
- **`src/detail.css`** has § STUDENT ATTENDANCE lifted value for value, plus:
  - a print rule: day by day prints only when it is open, and the chevron is hidden on paper;
  - `.detail-att-days-summary` at 44px in the coarse block.
- **`studentPassSummary()` is deleted.** It had one caller, now gone, and the grep is empty.
- **`sw.js` `CACHE`** is `planbook-shell-v176` → `v177`.

## Acceptance, line by line

1. **[x] A tap on a name opens a dialog titled with the student's name, holding the write block and one door and no table. The door opens that student's page.**
   - `verify/attendance-history.mjs`, through the real name in the grid:
     - one dialog, titled `"Sam Probe"`;
     - 0 tables, 1 block;
     - 0 `.attendance-report-rate` / `.attendance-report-passes` / `.avatar`;
     - `offsetWidth` 480;
     - doors `["wo26-s1:Attendance history and grades →"]`.
   - Following the door: `detailView` is up for *Sam Probe* with 0 dialogs open.
   - `verify/history-dialog-write.mjs`: the dialog is titled *Dee Dismissed*, 0 tables, one door.
   - `verify/grade-detail.mjs`: the door is ≥44px under a coarse pointer, does not spill its label, and lands with focus on the heading.
   - Mutation M1 turned the dialog check red.
2. **[x] Time, note and Un-confirm write exactly as they did, through the same hooks, and Un-confirm repaints the card with focus inside it.**
   - Hooks and routes are unchanged.
   - These pass unchanged: the WO-2.53 note checks (lands on the mark, same `<input>` survives the keystroke, reopened field reads it) and all five WO-2.55 time checks.
   - New check: after Un-confirm the entry is `{"code":"U"}`, the grid cell reads `?`, the dialog is up, and `activeElement` is the write box inside the dialog.
   - **Limit, stated in TESTING.md:** with the repaint removed (M4), the focus check stayed green because the old box is still in the DOM to be focused. The pre-existing redraw check is the one that went red.
3. **[x] On a locked past day the card shows that day's mark, read-only, with its sentence and no input.**
   - `verify/history-dialog-write.mjs`: the strip stands on an ended term's last day, now carrying a record with `A` for that student. Results:
     - write block 0, inputs 0;
     - reason `locked`, chip `Absent`;
     - the drawn sentence word for word;
     - the day line starts with that day's spoken date, not "Today";
     - 0 inputs/buttons/hooks/`[tabindex]` inside the block.
   - The dropped-day case is checked the same way: reason `did-not-meet`, no chip.
   - M1 turned both red.
4. **[x] The student page's attendance card shows every term and the whole year with the same figures the dialog showed at v174 for the same document, and a day by day that is closed until opened and then lists every recorded meeting in the open term with its running fraction.**
   - Term rows, cell by cell:
     - `["WO-2.6 Term — open","1","1","2","1","1","6","67%"]`
     - `["WO-2.6 Long","30","0","0","0","0","30","100%"]`
     - `["Whole year","31","1","3","1","1","37","92%"]`
   - **What "same figures as v174" rests on.** v174's dialog drew this table from `termTotals()`/`attendanceTotals()`, the same calls the card makes now. The figures were also hand-computed from the fixture. **I did not run a v174 tree side by side.**
   - Day by day:
     - closed on arrival: `checkVisibility()` is false on its table;
     - opened by a click;
     - six dates, newest first, with the dropped and out-of-term days absent;
     - `4 of 6 · 67%` on top and `0 of 1 · 0%` at the foot;
     - the `U` day reads *Absent*.
   - After an Un-confirm, the page reads 50% in the title, the open term row, the year row, and today's row (`1 of 2 · 50%`).
   - `print-sheets.mjs`: the term table prints; a closed day by day has no box on paper; an open one prints.
   - M2, M3 and M5 each turned their checks red.
5. **[x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.**
   - `verify-shell.mjs`, final run after the reverts: `1915 checks · 1915 passed · 0 failed · 0 skipped`, 60,894 lines, 920s, exit 0. I read the `EXIT=0` line in the log.
   - `wo-sweep.mjs`: `50 checks · 46 passed · 0 failed · 4 to review`. Three of those are the standing REVIEWs. The fourth is `.detail-att-terms` with no coarse rule; it is a `<table>`, not a touch target.
   - `tools/README.md` call-site count is 1907 → 1911, with a WO-2.60 paragraph.
   - `CACHE` is v176 → v177.
6. **[ ] 👤 iPad reading.** Not done. It needs the iPad.

**Mutation round:** one full run with all five mutations live: `1915 · 1905 passed · 10 failed`. The table is in `TESTING.md` § WO-2.60.
- M1: no read-only card
- M2: day by day oldest first
- M3: `<details>` drawn open
- M4: no repaint after Un-confirm
- M5: the closed-details print rule removed

**First delivered run was 1914/1915.** The closed-on-arrival check measured the table's height, and current Chromium lays a closed `<details>`' content out under `content-visibility: hidden` (231px) even though nothing is drawn. I re-aimed the check at `checkVisibility()` plus the disclosure's own height. The app was not touched. This scar is now written into `tools/README.md`.

## Built as drawn, owner's ruling still owed

1. **The door's words:** `Attendance history and grades →`, exactly as drawn.
2. **The term percentage on the card:** left off, as drawn.
3. **The read-only sentences.** One per refusal, keyed on `readOnlyMark().reason`:
   - `locked` (the drawing's): *"This day is locked. Press its ✏ on the grid to change the mark or add a note."*
   - `did-not-meet` (mine): *"The class didn’t meet this day, so there is no mark to show. Tap “The class met after all” above the grid if it did."*
   - `covered` (mine): *"This day is off on the calendar, so nobody has a mark on it. Tap the 📅 on its column to see why."*
   - `off-term` (mine): *"This day is outside every term this class has, so nothing can be marked on it. Add a term or widen one in Terms to open it."*
   - A dropped, covered or off-term day has no record of a mark, so it draws no chip. A locked day nobody took also draws no chip.
4. **Day by day:**
   - closed on every arrival, including through the card's door, with no scroll-into-view;
   - newest first. `termHistory()` still answers oldest first, and the card reverses the finished rows so each running fraction stays as it was.

## Decisions the work order did not settle

- **"Paged away" is not a refusal reason.** The work order lists it, but `editDate()` does not move when the window pages, so `editableMark()` never refused on it. The WO-2.53 harness already said so. It is documented at `readOnlyMark()`, and no fifth sentence was invented.
- **A future day `writableDate()` refuses folds into `off-term`.** It is only reachable on a future date outside every term.
- **Print of day by day.** The proposed sheet's comment said "prints open". Frame E's caption and `src/detail.js`'s standing rule ("what prints is what is on screen") both say "only if open". I went with "only if open", because forcing a closed `<details>` open on paper is not reliable in Chromium. The departure is recorded in the proposed-CSS banner and in `src/detail.css`.
- **Presentation mode.** I read what the student page hides before adding the tables. Support data never reaches it, and passes, the log, score notes and score history go quiet behind their own modules. The five attendance counts were drawn in both modes, and so was the dialog these tables came from, so the tables draw in both modes and `src/detail.js` still asks the mode nothing. The sentinel sweep reads both surfaces in both modes and finds nothing.
- **The dialog keeps its id `attendanceHistoryModal`.** Renaming it would move every hook and harness read for a word. The comments say so.
- **The door is a plain `.class-action-btn` in `.modal-actions`**, as drawn. It no longer wears `.attendance-report-door`, which ← All students still wears, so that rule stays.
- **Dead CSS removed from `src/attendance.css`.** I deleted `.attendance-report-rate` and `.attendance-report-passes` (base, coarse and print rules) because nothing wears them now. Each deletion is noted where the rule stood. That file was not in the Deliverables, but leaving rules nobody wears is the defect `src/detail.css`'s header names.
- **The read-only sentence lives in a `READ_ONLY_SAYS` object** indexed by the reason. Only `src/merge-fields.js` is fenced against computed keys.

## Not done, and why

- **The 👤 line.** Owed to the owner on the iPad after a force-quit.
- **The covered and off-term read-only sentences are not exercised by the harness.** Building those fixtures (a calendar event over today; a selected undated term beside a dated one) would have been new fixture work. They are verified only by reading `markGate()`.
- **`tools/verify/note-panel.mjs` was left unchanged.** It measures the field or hint inside the 480 panel and still passes; it needed no edit.
- **`CHANGELOG.md` was not written**, per the rule. Draft below.

## Files changed

- `src/attendance.js`
- `src/attendance-report.js`
- `src/detail.js`
- `src/detail.css`
- `src/attendance.css`
- `src/pass-history.js`
- `src/shell.js` (comments only, in the hook census)
- `index.html`
- `sw.js`
- `design/mockups/proposed-attendance.css`
- `design/mockups/README.md`
- `design/mockups/index.html`
- `tools/verify/attendance-history.mjs`
- `tools/verify/history-dialog-write.mjs`
- `tools/verify/attendance-passes.mjs`
- `tools/verify/attendance.mjs`
- `tools/verify/grade-detail.mjs`
- `tools/verify/print-sheets.mjs`
- `tools/README.md`
- `TESTING.md`
- `plans/work-orders/phase-2-attendance.md` (ticks only)

## Draft CHANGELOG entry

```
### A tap on a name opens today — 2026-10-09

WO-2.60, owner-directed, from `design/mockups/attendance-today.html`. Shell cache v176 → v177.

- **A student's name on the attendance screen opens today's card.** The dialog is titled with the
  name and holds that day's mark, its time and note, and Un-confirm — the same controls as before —
  and one door, *Attendance history and grades →*, to the student page. The rate badge, the pass
  count and the tables are gone from it; it is a normal-width dialog again.
- **On a day the card cannot write to, it says so.** A locked past day shows that day's mark and
  tells you to press its ✏; a day the class didn't meet, a day off on the calendar and a day outside
  every term each say what would open them. It used to show nothing.
- **The history moved to the student page.** The attendance card there now has the term-by-term
  table and the whole year under its five counts, and *day by day* below them — closed until you tap
  it, newest first, each row with its running *4 of 6 · 67%*. On paper, day by day prints only if
  it is open.
- A present student's hint now reads *"Nothing to note on a present mark. Change the mark on the
  grid and a note field appears here."*
- Built as drawn, not yet ruled on: the door's words, no percentage on the card, day by day closed
  and newest first, and the wording of three of the four read-only sentences.
```
