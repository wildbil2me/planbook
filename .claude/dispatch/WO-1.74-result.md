# WO-1.74 — result (implementer)

**State:** built and verified. All four Acceptance boxes are ticked in the phase file, and each tick has evidence quoted in `TESTING.md` § WO-1.74. None of the four lines is 👤 or 📆. The status is still `🤖 CLAIMED`: the `--tick` to ✅ DONE is the orchestrator's to run. No commit was made.

## What was built
- **`src/roster.js` `studentRow()`**: the name and the "also in" note now sit together in `<span class="roster-row-who">`, and the note is created **only when `others.length`**, so the empty span that used to go on every row is gone. The row's order is now avatar, `.roster-row-who`, support dot, actions. The support dot is still built only when `supportsVisible() && hasSupports(student)`. Its code is unchanged; what moved is the note, which used to sit between the dot and the actions and is now inside the column ahead of the dot. The orphan list ("Not in any class") uses the same function, so it changes too.
- **`src/shell.css` § ROSTER WHO**: the drawing's two child rules, placed directly after `.roster-row-note`. The shared `.roster-row-name` and `.roster-row-note` rules are not edited (days-off and events rows also use them), and `.roster-row-name`'s `flex` is untouched, as the Traps line requires.
- **`sw.js`**: `CACHE` bumped from `planbook-shell-v180` to `planbook-shell-v181`.
- **The harness**: a new section, `tools/verify/roster-who.mjs`, registered right after `settings-back.mjs` in `tools/verify-shell.mjs`. It holds five checks and one `skip()` guard. It plants four classes and four students of its own and removes them at its foot, then restores the open-class preference, the presentation preference and the viewport.
- **Docs**: the § ROSTER WHO banner and the index entry in `design/mockups/proposed-settings.css` now say "lifted" and note the departure below. Same for `design/mockups/README.md`. `tools/README.md` has the call-site count moved from 1933 to 1938 (taken from the sweep's own count) and a WO-1.74 paragraph. `TESTING.md` § WO-1.74 is written.

## Decision the work order did not settle: one departure from the drawing
I first lifted the drawing value for value. The first full run then **failed Acceptance 1**: the three-class row was **51px** and the one-class row **50px**.
- **Cause:** the column was 33px tall in Segoe UI (17px name + 1px gap + 15px note), and the 32px avatar is what sets the height of every other row.
- **Fix:** the column's children now get `line-height: 1.25`. That makes the column about 31px in any font, and both rows measure 50px.
- **Why a line-height and not `gap: 0`:** with `gap: 0` the fit would rest on Segoe's own `normal` line-height, and the iPad draws SF, which this harness cannot render.

The reason is written where the rule departs in `src/shell.css`, and the change is named in the mockup banner and the mockups README. The owner may prefer a different fix, such as a smaller gap or accepting the 1px.

## Acceptance, line by line
1. **[x] At 480px a three-class row is the height of a one-class row, with the note under the name and ✎ · Edit · Remove on the name's line.**
   - **Evidence:** run 2, `roster-who.mjs`: `panel 480px · one-class row 50px, three-class row 50px`.
   - The note is at `top 325.5` against the name's `bottom 324.5`, with the same left edge (473). It is the name's next sibling inside `.roster-row-who`.
   - The buttons' tops are 308.8, 311.3 and 311.3, all above the name's bottom. Their left edges start at 693.5, right of the column's right edge at 683.5.
   - **Limit:** this was measured with a fine pointer only. With a coarse pointer the buttons are 44px and set the row height; that case was reasoned, not measured.
2. **[x] No row carries an empty `.roster-row-note`.**
   - **Evidence:** every row on both lists reports `(0 empty)`. The one-class row and the "Not in any class" row (`wo174-none`) have no note element at all (`null`).
3. **[x] Both tools pass. `CACHE` is bumped.**
   - `node tools/verify-shell.mjs`, run 2, after the fix: `1942 checks · 1942 passed · 0 failed · 0 skipped`, 61,993 lines, 970s, `EXIT=0`, read from the log.
   - `node tools/wo-sweep.mjs`: exit 0, `50 checks · 46 passed · 0 failed · 4 to review`. Three of the four reviews are the standing ones. The fourth is the diff-against-HEAD notice for `.roster-row-who`, which is a text column and not a touch target; it goes quiet at the commit.
   - `sw.js` is at `planbook-shell-v181`.
4. **[x] `TESTING.md` § WO-1.74 carries the lines verbatim with evidence.** It is placed under Phase 1, after § WO-1.73.

**Also asserted (from the Traps line):**
- The row order on both lists, with `support-dot` third and only on the student with a plan on file.
- With presentation mode switched on from the header button, the dot is absent from the DOM (`dots 0`), the row reads avatar, column, actions, and both rows are still 50px.
- Every name inside the column computes `flex 0 0 auto` and is 16.3px tall. A bare `.roster-row-name` outside a column still computes `1 1 140px`.

## Mutation round
Before planting anything I copied the two files to the scratchpad, and restored them from those copies afterwards; I did not use `git checkout`. Two faults were planted together in one full run:
- the note built on every row, with `''` when the student has no other class;
- `flex: none` deleted from `.roster-row-who > *`.

**Result:** `1942 checks · 1938 passed · 4 failed`, and all four failures were this section's:
- **Empty-note check:** red (`"" (1 empty)`).
- **Flex check:** red (`1 1 140px`, 140px tall). This reproduces the Traps line's 140px-tall name.
- **Both height checks:** red (159 vs 172.8px).
- **Order check:** stayed green, which is correct, since neither fault moves an element.

**Height sensitivity at 1px:** proved by run 1 (51 vs 50) on the drawing's original values.

**Not mutation-proved:** the dot's position and its absence under presentation mode.

**Restoration:** after restoring, `grep -rn MUTATION src` finds only `src/shell.js`'s existing "A CLASS MUTATION" comment. The restored files are byte copies of the tree run 2 tested. I did not repeat the 16-minute harness run after restoring.

## Could not verify
- How the change looks on a real iPad (SF font, coarse pointer). The work order has no 👤 line, but the owner may want a glance, since the line-height departure is the one judgment call here.

## Files changed
- `src/roster.js`
- `src/shell.css`
- `sw.js`
- `tools/verify-shell.mjs`
- `tools/verify/roster-who.mjs` (new)
- `tools/README.md`
- `design/mockups/proposed-settings.css`
- `design/mockups/README.md`
- `TESTING.md`
- `plans/work-orders/phase-1-shell-store-roster.md` (the four boxes ticked; the status left as CLAIMED)
- `.claude/dispatch/WO-1.74-result.md`

`git diff --stat` shows no line-ending rewrites (158 insertions, 21 deletions across nine tracked files).

## Out-of-scope notes
- The three harness readers that read `.roster-row-note` (`roster-contacts.mjs:43`, `attendance-passes.mjs:2309`, `calendar-events.mjs:194`) needed no change. The roster one only regex-tests the note of a student who is in another class. The other two read days-off and events rows, which still build their note.

## Draft CHANGELOG entry (the teacher decides)
> **The roster's "also in" note sits under the student's name.** A student you share with another class no longer has a row twice as tall as everyone else's: the note naming her other classes is set in grey under her name, and ✎ · Edit · Remove stay on the same line. Rows for students in only one class no longer carry an empty note.
