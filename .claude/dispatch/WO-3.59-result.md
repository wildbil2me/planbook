# WO-3.59 — result (implementer)

**Outcome:** all four Acceptance lines met and ticked. None of them is 👤 or 📆. Not committed. Status row still reads `🤖 CLAIMED — 2026-10-11`. I ran no `--start`/`--release`/`--handoff`/`--tick`.

## The cause (reproduced, not taken from § WO-3.54)

At 390×844 with dsf 3, `mobile: true`, touch emulation on and `(pointer: coarse)` reading true, I planted a real-shaped class: a dated Quarter 1 (today −30 … today +30), three weighted categories, two students, and four dated assignments, two in Essays and two in Reading quizzes. On that class the assignment list scrolled the **page** sideways by **149px**, while its table scrolled 228px inside its own box.

The element that sets the page's `scrollWidth` is the Actions column head's `<span class="sr-only">Actions</span>`. I found it by removing each absolute or fixed box from the page in turn and reading `scrollWidth` again. With the fix reverted the check prints this, verbatim:

`span.sr-only "Actions" in <th> · position absolute · offsetParent body · page scrolls 0px without it`

Why it escapes: `.sr-only` uses `position: absolute`. An overflow box only clips an absolutely positioned descendant when it is that descendant's containing block or contains it. Nothing between the span and `<html>` was positioned, so the page itself was the containing block. `.assign-table-wrap`'s `overflow-x: auto` scrolled the table but not the span, and the span stayed at its static position past the right edge of the screen.

**The fixture is ruled out.** My dated fixture overflowed by 149px. WO-3.54's blank-dated fixture read 135px on the same reverted run, and WO-1.77's read 134px. All three overflowed, and the span was the cause each time.

## The fix

`src/assignments.css`: `.assign-table-wrap { position: relative; overflow-x: auto; … }`, with a comment explaining it. This makes the wrap the containing block, so its own scroll clips everything absolutely positioned in the table. It has no z-index, so it creates no stacking context.

I weighed two other places for the fix:
- **The span itself.** The work order forbids fixing only the span. It would also fail for WO-3.55: a button planted in the `<th>` has its own `.sr-only` name, and that escapes the same way. The mutation run measured it at 161px.
- **`.sr-only` globally.** This would lay out every hidden span in the app at the page's top-left. The header also copies `.sr-only`'s declarations by hand (`src/shell.css` ~2656).

I chose the wrap because "horizontal scroll belongs to the table" was already that rule's stated promise. `CACHE` in `sw.js` went from v185 to v186.

## Acceptance

1. **[x] § WO-3.59 names the element and why, or shows only the fixture did.** `TESTING.md` § WO-3.59 (under Phase 3, after WO-3.54) names the span and the containing-block mechanism, and rules out the blank-dated term with a dated fixture.
2. **[x] 390×844 coarse, assignments in ≥2 categories, no overflow; `horizontal-overflow.mjs` checks it; reverting the fix fails it.**
   - **New block** at the foot of `tools/verify/horizontal-overflow.mjs`. It plants the fixture and walks home → class card → Assignments.
   - **First check** asserts all of these: on `assignmentsView`, coarse true, vw 390, 4 rows in 2 categories read from the rows actually drawn, the table box scrolls more than 0 (so the check can't pass on a list too narrow to test anything), and the page overflow is 0 or less.
   - **Second check** plants WO-3.55's shape in the Actions `<th>` (a button holding an `.sr-only` name) and asserts the same.
   - **Fixed tree:** both PASS, page 0px.
   - **Mutation:** I staged the work, removed `position: relative` and left a `MUTATION WO-3.59` comment in its place, ran the full harness, then restored with `git checkout -- src/assignments.css`. Result: `1982 checks · 1980 passed · 2 failed`, exit 1. The two failures were exactly the WO-3.59 checks, at 149px and 161px, and each named its span. `grep -rn MUTATION src index.html tools sw.js` afterwards finds no WO-3.59 hits. The remaining hits are pre-existing prose: `src/shell.js:1059` and `tools/README.md`.
   - **Every run, no mutation needed:** a `MEASURE |` line takes the fix off inside the page (a `<style>` forcing `position: static`) and names the cause. On the final green run it printed 149px, carried by the Actions span.
3. **[x] verify-shell and wo-sweep pass; CACHE bumped.**
   - `node tools/verify-shell.mjs` on the delivered tree, after the revert: `1982 checks · 1982 passed · 0 failed · 0 skipped`, 63,562 lines, 1042s, exit 0.
   - `node tools/wo-sweep.mjs`: `50 checks · 46 passed · 0 failed · 4 to review`, exit 0. Before that I had to move the `tools/README.md` call-site line from 1976 to 1978; until I did, the sweep was red. I also added a WO-3.59 paragraph beside the WO-3.54 one.
   - The 4 reviews are the standing three plus the coarse-block review for `.assign-table-wrap`. My answer: it is a scroll box, not a control, so it needs no 44px rule.
   - `wo-gate.mjs --audit` passes.
4. **[x] § WO-3.59 carries the lines verbatim with evidence.** Yes.

## What I could not close
Nothing on the list. I have not looked at a real phone or iPad. No line asks for one, but a device reading would be the human confirmation.

## Other screens at phone width (reported, not fixed)
In the same run, on the same class at 390×844 coarse, Attendance and Scores overflow the page by **0px**, on both the fixed and the reverted tree. `#attendanceCaption` and `#scoresCaption` are `.sr-only` too, but a `<caption>` sits at the table's left edge, inside the viewport. The same element affects no other screen I measured. I measured nothing else.

## Decisions and notes
- **Where the fix lives:** the wrap, for the reasons above.
- **Two report-only `MEASURE` lines.** One shows the cause with the fix off; the other gives Attendance and Scores at phone width. They make no assertions and are there so the next work order has a baseline.
- **The cause-finder is a removal test, not an edge test.** My first draft compared right edges against `scrollWidth`. On the first mutation run it found nothing for check 1 and only the probe button for check 2. On a mobile viewport, a page that overflows also gets zoomed out, which broke the coordinate-based clicks the report-only screen changes used (they measured the list twice). I rewrote both: removal-based detection, and element `.click()` for those report-only navigations. The assertions did not change. I re-ran the mutation on the final code, and that run is the one quoted above. The first mutation run (same 149/161px FAILs) is noted in TESTING.
- **WO-3.54's MEASURE line** in `assignment-list-tidy.mjs` still said "WO-3.59's to fix". I changed its prose and printed text so it points at the new assertion. The line itself remains a reading and asserts nothing.
- **A run takes ~17.5 minutes (1040s), not the 4.5 the brief budgets.** I made three full runs.

## Files changed
- `src/assignments.css`: the `position: relative` and its comment.
- `sw.js`: CACHE v185 → v186.
- `tools/verify/horizontal-overflow.mjs`: the new block, two checks, a header note and the `nodeDaysFromToday` import.
- `tools/verify/assignment-list-tidy.mjs`: prose in the comment and MEASURE text only.
- `tools/README.md`: call-site count 1976 → 1978, plus a WO-3.59 paragraph.
- `TESTING.md`: § WO-3.59.
- `plans/work-orders/phase-3-gradebook.md`: four Acceptance boxes ticked.
- `.claude/dispatch/WO-3.59-result.md`: this file.

Staging: `src/assignments.css`, `sw.js` and `tools/verify/horizontal-overflow.mjs` are staged from the mutation round. The README, TESTING and assignment-list-tidy edits and the CSS comment wording are unstaged.

## Draft CHANGELOG entry (for the teacher to judge)
On a phone, the assignment list no longer slides the whole app sideways. A hidden "Actions" label in the table's last heading was positioned against the page instead of against the table's scroll box, so the page grew to fit it. The table still scrolls inside its own box, as it always should have.
