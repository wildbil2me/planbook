# WO-3.39 — result (implementer)

**Owner's ruling at dispatch: option (a).** A class now draws only its own grading mode's half of the
score grid's third help paragraph. Not committed.

## What was built

- **`index.html`**: the third `.scores-hint` paragraph (*"The grade beside each name is live"*) is
  split. The two opening sentences stay shared. The rest is now two `<span>` blocks inside the same
  `<p class="scores-hint">`: `data-scores-hint-mode="weighted"` and `data-scores-hint-mode="points"`
  (the second starts out `.hidden`). The styling is the same because it is the same paragraph; no CSS
  changed. The weighted sentences were **moved, not rewritten**, and keep their original source line
  breaks. An HTML comment above the paragraph explains the split.
- **`src/scores.js` `renderScores()`**: directly under the existing `hintTerm` line, and so above every
  early return, the function hides whichever block is not `gradingModeOf(cls)`. It reads the mode and
  nothing else. `gradingModeOf(null)` is `'weighted'`, so a screen with no class open shows the
  weighted half, which is what it showed before. `src/grade-engine.js` is untouched.
- **`sw.js`**: `CACHE` bumped from `planbook-shell-v157` to `planbook-shell-v158`.
- **`tools/verify/points-grade.mjs`**:
  - WO-3.36's grid read no longer strips every `.scores-hint`. It removes only help blocks whose
    computed `display` is `none` (brief Trap 4: "drawn" is measured, not inferred from a class name).
  - WO-3.36's grid check now also asserts `helpBlocks === 2`, and its name says the help is included.
  - WO-3.36's separate "help paragraphs mention weights only in conditional sentences" check is
    **deleted** (Trap 3), along with the `hintWeights` read it used. Its comment is rewritten to match.
  - A weighted sibling class `c_wo339w` is planted. It has no `gradingMode` key, one category at 100,
    one student and one scored assignment. Its ids use the `wo330-`/`a330` prefixes, and the cleanup
    removes it.
  - Two new WO-3.39 checks, described under lines 2 and 3 below.
- **`tools/README.md`**: the call-site count changes from 1670 to 1671 (taken from the sweep), and a
  WO-3.39 paragraph records the executed count changing from 1681 to 1682 (taken from the run).
- **`TESTING.md`**: a new § WO-3.39 with the three lines ticked, the before/after points wording, and
  the mutation table.
- **`plans/work-orders/phase-3-gradebook.md`**: the three Acceptance boxes are ticked. I did not change
  the status; it is still `🤖 CLAIMED`, for the orchestrator to move.

## The points sentence: old and new wording (brief Trap 1, for the owner to read)

- **Old:** *"In a class graded on total points there are no weights to balance: the grade is every
  point earned over every point possible, work in no category included, from the first score you
  enter."*
- **New:** *"This class is graded on total points: the grade is every point earned over every point
  possible, work in no category included, from the first score you enter."*

The meaning is kept. The new wording uses "This class" because only a points class ever sees it now.

## Against the Acceptance list

1. **In a points class the score grid's help has no weight wording: ticked.**
   - **Measured** by WO-3.36's existing grid check with the skip removed. In the full run it reads
     PASS: `WO-3.36: in a points class no text on the score grid … its help included …`.
   - **Mutation-proved.** M1 drew both blocks (`toggle('hidden', false && …)`). The scratch run went
     27/30, with 3 red:
     - the WO-3.36 grid check, detail `{"wordFound":"weight","helpBlocks":2,…}`;
     - the weighted word-for-word check;
     - the switch check.
   - Reverted at once: `src/scores.js` was restored from a copy, and its SHA-256 (`d9ebbdd7…`) matched
     the bytes from before the mutation.
2. **A weighted class's help reads word for word as today: ticked.** The new check compares the
   weighted class's drawn third paragraph (whitespace-collapsed) with a literal string. That string is
   the pre-change paragraph minus its points sentence. I checked it against `git show HEAD:index.html`
   by script, not by eye. M3 changed one weighted phrase, *not a provisional one* → *not a provisional
   grade*, and turned exactly this check red (29/30). Reverted, and the `index.html` SHA-256
   (`31582ef3…`) matched.
3. **Switching points → weighted → points draws the right block each time: ticked.** The new check
   reads the help three times, each time with exactly one block drawn and the full expected text:
   - on the points class's grid, before any switch;
   - after the `#classTabBar` tab to the weighted class, then its Scores segment;
   - after the tab back to the points class, then Scores again.

   M2 hard-coded `hintMode = 'weighted'` and turned this check and the WO-3.36 grid check red (28/30).
   Reverted, and the hash matched.

## Commands, quoted from output I read

- `node tools/verify-shell.mjs` (full run on the delivered tree):
  `1682 checks · 1682 passed · 0 failed · 0 skipped`, `53,585 lines · 31.9 lines per check · 710s`,
  `EXIT=0`.
- `node tools/wo-sweep.mjs`: `46 checks · 43 passed · 0 failed · 3 to review`, which are the three
  standing reviews.
- `grep -rn MUTATION` over `src/scores.js index.html sw.js tools/verify/points-grade.mjs` prints
  nothing. The scratch harness `tools/scratch-wo339-verify.mjs` is deleted.

## A failure on the way, recorded honestly

My first full run went **1656/1662 with 6 failed**. I had assumed a header class tab keeps the Scores
screen up. It does not: `selectClass()` in `src/classes.js` sends every class screen except the
calendar and signals back to the registry. The switch reads therefore found `#scoresView` hidden.
`points-grade.mjs` then threw on the grade sheet and skipped its own cleanup, and the leftover
fixture also failed a WO-4.3 "no flag-shaped keys" check further down the run. The fix was in the
harness, not the app: after each tab, tap the Scores segment, which is the path a teacher actually
takes. After that, the two-section scratch run was 30/30 and the full run was 1682/1682.

## Decisions the work order did not settle

- **Hide rather than remove/insert.** I used the app's `.hidden` toggle on static markup, which is the
  file's own idiom, and made the harness measure computed `display`. Removing the nodes would have
  meant rebuilding prose in JS.
- **The points block says "This class is graded on total points"** rather than keeping the
  conditional "In a class graded on…". The block is now only shown to the class it describes.
- **No class open shows the weighted half.** `gradingModeOf(null)` already answers `'weighted'`, so I
  did not special-case it.

## Not verified / not done

- Nothing here needs an iPad. There is no 👤 or 📆 line, and no new control, so there is no 44px item.
- I did not look at the rendered paragraph by eye in a browser. The harness compares its text, not its
  look; the styling cannot have changed, because the blocks are spans inside the same paragraph.
- No `CHANGELOG.md` entry. A draft follows.

## Draft CHANGELOG line (teacher's call)

> The score grid's help no longer explains category weights to a class graded on total points: each
> class reads only the half of the paragraph that describes how it is graded.

## Files changed

- `c:\dev\planbook\index.html`
- `c:\dev\planbook\src\scores.js`
- `c:\dev\planbook\sw.js`
- `c:\dev\planbook\tools\verify\points-grade.mjs`
- `c:\dev\planbook\tools\README.md`
- `c:\dev\planbook\TESTING.md`
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` (three ticks)
- `c:\dev\planbook\.claude\dispatch\WO-3.39-result.md` (this file)
