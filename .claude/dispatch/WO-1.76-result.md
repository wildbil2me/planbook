# WO-1.76 — the roster dialog is wide enough for its rows · implementer's result

**Implementer** Claude (Opus), 2026-10-10. Nothing committed.

## What was built

- **`src/shell.css`** now has `.roster-panel { width: 640px; }` straight after `.modal-panel`. Its comment names WO-1.76, says why it is `width` and not `max-width`, and says 640 is **provisional pending the owner's iPad reading**. The rule is repeated in the `(pointer: coarse)` block next to the roster rules, the same way `src/attendance.css` repeats the Keys panel's width. `.modal-panel` is not edited. On a phone the `(max-width: 640px)` block's `.modal-panel { width: 95vw }` still wins, because it comes later in the file.
- **`index.html`**: `#rosterModal`'s panel gets `class="modal-panel roster-panel"`, with a line in the comment above it. The WO-1.72 back-button header is not touched.
- **`sw.js`**: `CACHE` bumped from `planbook-shell-v181` to `planbook-shell-v182`.
- **New harness section `tools/verify/roster-width.mjs`**, registered right after `roster-who.mjs`, with 8 checks. It plants its own data (two classes, two students) and removes it at the end.
- **`tools/verify/roster-who.mjs`**: its read now holds the panel at 480 inline for one synchronous read and puts it back before returning. No check in it was changed. Without this, WO-1.74's 480px check would either fail or, as the Traps line warns, measure at the wrong width.
- **`tools/README.md`**: the call-site count went from 1938 to 1946, taken from the sweep's own count. I added a WO-1.76 paragraph after WO-1.74's.
- **`TESTING.md` § WO-1.76** is written under Phase 1.
- **Phase file**: Acceptance lines 3, 4 and 5 are ticked. Lines 1, 2 and 6 are open (reasons below). The status is still `🤖 CLAIMED`; I did not run `--tick`.

## Acceptance, line by line

1. **Open, and left open on purpose.** The line asks for "the width the owner ruled", and the work order says he rules on the number after seeing it on the iPad. That hasn't happened yet. The default, 640, measured green:
   - 1280×800, fine pointer: `panel 640px · sideways page 0, overlay 0, panel 0, body 0, rows inside true`.
   - 390×844, coarse: `panel 350px` (under the 370.5px that 95vw allows), nothing scrolls sideways.
   - iPad upright 820×1180 and lying down 1194×834, coarse: `panel 640px` both, nothing sideways.
   
   If he rules 640, this line closes on this evidence. Any other number means changing two lines in `src/shell.css` and `WANT` in the new section.
2. **Open on the middle clause only** ("the dot is where the owner ruled"); the brief says I can't close that. The other two clauses are met at 640:
   - Fine pointer: `order ["avatar","roster-row-who","support-dot","roster-row-actions"] · name lines 1 · buttons ["✎","Edit","Remove"] · note "also in AP Literature"`. Every child of the row overlaps every other vertically, which is how the check tells it is one line.
   - The same holds on the emulated iPad, upright and lying down.
   - The test student is `Castellanos-Whitfield, Anastasia “Ana”`, with a 504 on file, in two classes.
3. **Ticked.** Measured at 1280 fine and at 1194 coarse:
   - Through real doors, the representative set: Settings, Classes and terms, Your details, the single-student form (Edit over the roster) and Paste a list. All five read 480.
   - All 32 stock `.modal-panel`s in the document, each cloned into a hidden holder and measured, read 480. That includes every confirm.
   - The six panels with their own width are listed separately: assignmentCopy 880, roster 640, attendanceKeys 640, attendanceRecord 900, gradesRecord 980, passHistory 900.
4. **Ticked.**
   - `node tools/verify-shell.mjs` on the finished tree: `EXIT=0`, `1950 checks · 1950 passed · 0 failed · 0 skipped`, 62,335 lines, 1015s. I waited for it to exit and read the summary.
   - `node tools/wo-sweep.mjs` after reverting the mutation: exit 0, `50 checks · 47 passed · 0 failed · 3 to review` (the usual three).
   - `CACHE` is bumped.
5. **Ticked.** The section exists, with the six lines copied verbatim and evidence for each.
6. **👤, open.** Needs the owner on a real iPad.

## The dot, measured (owner question 3): the panel width is not the cause

From the `MEASURE |` lines at 640:
- **Fine pointer:** name text ends 618.1, note text ends 497.5, name column ends 731.5, dot at 741.5..763.5, actions start 773.5. **The dot sits 123.4px past the end of the name and 10px before ✎.**
- **Coarse, upright and lying down:** the dot sits **52.4px** past the end of the name and 10px before ✎.

Widening the panel moved the dot **further** from the name. The dot comes right after `.roster-row-who`, which is `flex: 1 1 140px` and takes all the extra width. So the dot always sits on the left edge of the actions, whatever the width. That stretching name column, not the narrow dialog, is what the owner was seeing. I did not change `src/roster.js` or the row CSS. The choice is still the owner's: beside the name, or where WO-1.74 left it. A new check asserts only that the dot is where WO-1.74 left it, so it goes red if the order changes, but it holds neither answer.

## Mutation round

I planted the work order's own Traps fault: `.modal-panel` itself widened to 640, marked `MUTATION WO-1.76`, with `src/shell.css` copied aside first. Full run: `1950 checks · 1944 passed · 6 failed`.
- Both new 480 checks went red.
- So did four existing WO-2.59/WO-2.60 checks (the attendance history card read 640).
- WO-1.74's row check **stayed green at `panel 480px`**, which shows the 480 hold works.
- The 640 checks stayed green, which is correct.

I restored the file from the copy before writing anything else. Afterwards `grep -rn "MUTATION WO-1.76" src tools index.html sw.js` finds nothing, and `grep -rn MUTATION` turns up only older prose and identifiers.

I planted no fault for the repeated coarse rule. It is redundant by design, so deleting it changes no measurement, the same as Keys.

## Decisions the work order didn't settle

- **Holding WO-1.74's read at 480 instead of leaving its check to fail.** Its check asserts a 480 panel taken from CSS. Holding the width inline for one synchronous read keeps that measurement honest and leaves nothing behind on the element.
- **"Every dialog" was measured two ways.** Real doors cover the representative set; cloning covers all 32. The clone is sound because every width rule is keyed to the panel's own classes; the only `#…Modal .modal-panel` rules are print-only, and I checked that with grep.
- **Coarse emulation** uses `mobile: true` at deviceScaleFactor 2 for the iPad sizes, as `attendance-history.mjs` does.

## Things noticed, not acted on

- `tools/README.md` l.1370 says the harness spans "the eighty files under `tools/verify/`". It already named 89 before this change and names 90 now. That count was already stale and nothing checks it; I left it.
- **Another session is working in the tree.** It added `design/mockups/index.html` (modified), `design/mockups/assignments-tidy.html` and `design/mockups/proposed-assign-tidy.css` (untracked) while I worked. None of that is mine; leave it out of a WO-1.76 commit.

## Files changed (mine)

- `src/shell.css`
- `index.html`
- `sw.js`
- `tools/verify/roster-width.mjs` (new)
- `tools/verify/roster-who.mjs`
- `tools/verify-shell.mjs`
- `tools/README.md`
- `TESTING.md`
- `plans/work-orders/phase-1-shell-store-roster.md` (3 ticks; the `CLAIMED` status line was already there)

`git diff --stat` shows only added and changed lines, no whole-file rewrites; all files are LF.

## Draft CHANGELOG entry (the teacher's to decide)

> **The roster dialog is wider (WO-1.76).** Roster & contacts now opens at 640px on a laptop and an iPad instead of the 480px every other dialog uses. A student's name, the "also in" note, the support dot and ✎ · Edit · Remove have room on one line. Every other dialog, including confirms and the single-student form, stays at 480, and on a phone the dialog still fits the screen. The width is provisional until it has been read on the iPad. The support dot was not moved: the extra width went to the name column, so the dot still sits next to the buttons rather than the name. Where it belongs is still an open question.
