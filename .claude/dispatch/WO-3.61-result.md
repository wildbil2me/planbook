# WO-3.61: result. The Scores keys open a dialog, and Clear and Note get a key

**Implementer:** Claude (Opus), 2026-10-12. The row stays `🤖 CLAIMED`: no `--start`, `--release`,
`--handoff` or `--tick` was run. Acceptance lines 1–6 are ticked in the phase file. The 👤 line is
open.

## What landed, by file

- `index.html`
  - `#scoresKeys` (the strip of `nowrap` rows) is deleted.
  - ⌨ now opens the dialog through `data-modal-open="scoresKeysModal"`, with `aria-haspopup="dialog"`
    and no `aria-expanded`. The `aria-label="Keys"` is unchanged. The title now reads "Keys — enter
    scores from the keyboard; press ? for the list".
  - New `#scoresKeysModal` dialog, placed right after Attendance's twin:
    - `modal-form`, using Attendance's shipped `.attendance-keys` rows (no new CSS)
    - frame D's lead text, and 11 rows: ↵ ⇥ ↑↓ ←→ L M X C ⌫ N Esc
    - the N row departs from frame D (see the finding below)
  - The flag bar reads *Clear (C)* and *Note (N)*.
  - The first hint paragraph is now frame A's text, followed by ruling 5's reworded sentence:
    "Escape does nothing on the grid."
  - Comments on the flag bar and the note panel are updated.
- `src/shell.js`
  - `const SCORE_KEYS_MODAL`.
  - `?` inside a score cell opens the dialog with that cell as the opener. It is caught before
    `handleScoreKey()`, with `preventDefault`.
  - `?` anywhere else on the Scores view that is not a field also opens it, with the focused element
    as opener. This branch sits above the class-view guard, so it falls outside the slice
    `keys-legend-marking` reads.
  - The `data-scores-keys` route and its hook-registry entry are removed. Comments are updated,
    including the `beforeinput` comment.
- `src/scores.js`
  - In `handleScoreKey()`:
    - C maps to `'clear'`, which goes through the same `applyFlag()` the Clear button uses.
    - N calls `openScoreNote(input)` only when `scoreNotesVisible()` is true. That is the same
      question that hides the Note button. N is swallowed either way and says nothing.
  - `openScoreNote(cell)` takes an optional cell. The button passes nothing, so its behaviour is
    unchanged.
  - `keysOpen`, `KEYS_ID`, `KEYS_BTN_SEL`, `paintKeys()` and `toggleScoreKeys()` are gone.
  - Header decision 4 is reworded into the general rule it had become. I kept the number because
    search, pill and sort cite it.
  - The comments for the note panel, `applyFlag` and `handleScoreKey` now describe C, N, `?` and the
    measured Ctrl guard.
- `src/scores.css`
  - `.scores-keys`, `.scores-key` and their coarse lines are deleted, with a note left where they
    stood.
  - `.scores-keys-btn` stays: ⌨ still wears it and it carries the coarse 44px width floor.
- `src/past-due.js`: a comment pointed at `keysOpen`; it now points at decision 4.
- `sw.js`: `CACHE` `planbook-shell-v189` → `planbook-shell-v190`.
- Harness
  - `tools/verify/keys-legend-scores.mjs` is rewritten for the dialog:
    - it slices from the modal id to its own `<dl>`, stopping at the next `modal-overlay`
    - glyphs come from `<dt>` only
    - C and N are added to `GLYPH_OF`, and `Esc` is excepted by name
  - `tools/verify/keys-legend-guards.mjs`:
    - five dialog-shaped arm cases replace the four strip-shaped ones, so there are now 20 arms and
      20 cases
    - the X-retirement case is rewritten for dialog rows
  - `tools/verify/keys-legend-marking.mjs`: one fix, bounding the `<dl>` search at the next dialog
    (see the finding below).
  - `tools/verify/score-grid.mjs`: the WO-3.24 spill block for the strip is now a dialog block. It
    opens the dialog through ⌨ and checks its kind, rows, aria and focus. It checks that rows fit at
    1024 and at 390, and that Escape hands focus back to ⌨.
  - `tools/verify/score-notes.mjs`:
    - the WO-3.32 "N opens nothing" clause is removed, since that behaviour is reversed by ruling
    - a new block of 8 checks for the flag-bar words and hint, `?` in a cell, `?` on a button,
      Ctrl+C and Ctrl+N, C/c against Clear, N/n against Note, the Escape/Enter finding, and N under
      presentation mode
  - `tools/verify/score-sort.mjs`: the ⌨ hook is now `data-modal-open`, the aria checks are now for
    `aria-haspopup`, and the flag-bar check runs with the dialog open.
  - `tools/verify/dialog-kinds.mjs`: `scoresKeysModal` is added to the `modal-form` row of the
    ruled table.
- `tools/README.md`: the call-site count 2012 → 2021, plus a WO-3.61 paragraph giving the executed
  count 2023 → 2033.
- `design/mockups/proposed-scores-tidy.css` banner and `design/mockups/README.md` section: both say
  frame D landed, and name the N-row departure.
- `TESTING.md` § WO-3.61, under Phase 3.
- `plans/work-orders/phase-3-gradebook.md`: boxes 1–6 ticked and a short "Built 2026-10-12" note.

## Acceptance, line by line

1. **⌨ opens a modal-form dialog with the 11 rows; `#scoresKeys` does not exist; every dialog in
   `index.html` wears exactly one kind.** Met.
   - `verify/score-grid.mjs` clicked the real ⌨ and read: `kinds:["modal-form"]`,
     `haspopup:"dialog"`, `expanded:null`, focus inside, glyphs `↵ ⇥ ↑↓ ←→ L M X C ⌫ N Esc`, and
     `stripGone:true`.
   - The static legend check passes: 12 keys bound against 11 rows.
   - Both of `dialog-kinds`' checks pass: the source check and the live ruled-table check.
2. **`?` in a score cell opens the dialog, writes nothing, and closing puts focus back in the cell.**
   Met.
   - Shift+`?` in a cell holding 80: the dialog opens with focus inside, the field still reads `80`,
     and the document is unchanged.
   - Escape closes it and focus returns to `a332-essay/wo332-s1`.
3. **C clears score and flag, as Clear does; `c` too; Ctrl+C still copies.** Met.
   - On a cell holding `{v:6, flag:'late'}`, all three routes (the button, C, c) end in the same
     state: `{has:false, field:"", flagged:false}`.
   - A real Ctrl+C with the `copy` command attached: the keydown reached the page uncancelled (a
     `window` listener read `c+ctrl:false`), one `copy` event fired, and the cell was unchanged.
   - I did not read the clipboard's contents. The `copy` event is the evidence that the copy ran.
4. **N opens that cell's note panel with focus in the field, as Note does; `n` too; under
   presentation mode N opens and writes nothing.** Met.
   - The button, N and n all read identically: panel open, focus in the field, the note in the field,
     the label "Note on WO-3.32 Essay for Ben Birch", and the score untouched.
   - Under presentation mode (turned on through `#presentationBtn`): the panel stays shut and empty,
     the caret stays in the cell, the field is unchanged, and the document is unchanged. A sentinel
     in the live region was not replaced, so N said nothing.
5. **The flag bar reads Clear (C) and Note (N); the first hint paragraph is frame A's.** Met.
   - The five button labels were read from the DOM.
   - The hint read: "Type a score and press Enter — … no mouse. Every key is behind ⌨. Everything on
     this grid is Q1, and every keystroke saves as you make it. Escape does nothing on the grid."
6. **verify-shell and wo-sweep pass; `CACHE` bumped.** Met. Both results below are read from output
   after the process exited.
   - `node tools/verify-shell.mjs`: `2033 checks · 2033 passed · 0 failed · 0 skipped`, 64,908
     lines, 1083s, `EXIT=0`.
   - `node tools/wo-sweep.mjs`: `50 checks · 47 passed · 0 failed · 3 to review`, `EXIT=0`. The 3
     reviews are standing ones and none is about this work order. I re-ran the sweep after the last
     doc edits, with the same result.
   - `CACHE` is v190.
7. **👤 iPad with a keyboard: `?`, C and N from a cell, and the dialog upright.** Not closed, and not
   ticked. It needs the teaching iPad with a hardware keyboard, after a force-quit.

**Planted faults.** All are recorded in TESTING.md. Each was marked `MUTATION`, run on a
section-only scratch copy of the harness, and reverted by copying the pre-mutation file back. The
scratch copy was deleted before the sweep and before the full run.

| Fault | What went red |
|---|---|
| N's presentation guard removed | the presentation check |
| Ctrl removed from the modifier guard | the Ctrl check: Ctrl+C cleared the cell, Ctrl+N opened the note, and no copy fired |
| C unmapped | the static legend check and the C check |
| The `?` cell branch disabled | the `?` check |

With the `?` branch disabled, the field still read 80: WO-3.25's `beforeinput` filter refused the
character, which is the second line of defence holding.

**`grep -rn MUTATION src/ index.html tools/ sw.js`:** this is not literally empty. It returns 18
hits, and every one is prose that was already in the tree at HEAD. Per file the count is equal to or
lower than HEAD's; `score-grid.mjs` went from 2 to 1 because I removed the WO-3.24 block that said
"THE MUTATION PROVED IT VACUOUS". None of the hits is a plant, and `grep -rn "MUTATION M" src/` is
empty. The brief's "must be empty" was not achievable even on a clean HEAD, so I am reporting the
real result rather than calling it empty.

## The Escape-on-note-panel finding

The Traps asked: *does Escape already close the note panel and hand focus back?* **No.** I measured
it on the build:

- with the panel opened by `n`, Escape leaves the panel open with focus in the field
- Enter does the same
- only *Done* hands focus back to the cell

I did not build anything here, because it is not ruled. It is recorded in TESTING.md, the index.html
comments, the src/scores.js note-panel comment, and the phase file's Built note.

It did change one piece of shipped text. Frame D's N row says "Enter or Esc puts you back in the
cell", which is false on this build. The shipped row says "Note on this cell, in a panel above the
grid. **Done** puts you back in the cell; the note is already saved." A check in `score-notes.mjs`
asserts the measured behaviour, and that the N row names Done and promises neither key. If a later
work order makes Escape close the panel, that check goes red beside the row it has to reword. The
mockup banner and README name the departure.

## Decisions the work order did not settle

- **Where `?` lives.** It is in `src/shell.js`, not `handleScoreKey()`, because opening a dialog is
  shell.js's job, as it is on Attendance. A side effect is that `?` is not in `bound` for the static
  legend check. That is consistent with frame D drawing no `?` row; the ⌨ title says it instead.
- **`?` away from a cell.** It also opens the dialog from anywhere on the Scores view that is not a
  field, reading ruling 2's "from the Scores screen". It is excluded in INPUT, TEXTAREA, SELECT and
  contentEditable elements, so the note field and the search box keep `?` as text.
- **N under presentation mode is silent**, with no announcement, following ruling 3's "does
  nothing". `openScoreNote()` keeps its spoken refusal, which no tap can reach while the button is
  hidden.
- **Decision 4 in `src/scores.js`.** The brief said "the strip's state and its decision-4 comment
  go". I removed the state and its comment. I reworded the header's decision 4 rather than deleting
  it, because `searchText`, `categoryId` and `sortBy`, plus `src/past-due.js`, cite "decision 4", and
  renumbering would have broken those citations.
- **The hint paragraph** is frame A's three sentences plus the reworded Escape sentence. Ruling 5
  keeps that sentence (reworded), and acceptance line 5 asks for frame A's words, so the paragraph
  carries both.
- **Harness fix outside the score files.** I bounded `readMarkingKeys()`'s `<dl>` search at the next
  dialog. Once a second `attendance-keys` list existed below Attendance's, an unbounded search
  borrowed it, and the guard case "a second class on the attendance-keys list" went from green to
  "NO ARM FIRED". This touches Attendance's legend *checks*, not Attendance's dialog, which stays out
  of scope as the work order says.

## Declined (out of scope)

- WO-3.62's column head is untouched.
- Attendance's dialog is untouched.
- I did not make Escape or Enter close the note panel. It was tempting, and frame D's text even
  assumes it, but it is not ruled.

## Draft CHANGELOG entry (for the teacher to decide)

> **Scores: the keys are a dialog, and Clear and Note have letters.** ⌨ on the Scores screen now
> opens *Entering scores from the keyboard*, the same kind of list Attendance's ⌨ opens, and `?`
> opens it from inside a score cell, with the caret going back where it was when you close it. Two
> new keys: **C** clears the cell (score and mark together, in one press, exactly as the Clear
> button does) and **N** opens the note on the cell, exactly as the Note button does. N does nothing
> under presentation mode, because the Note button isn't there either. The flag bar now reads
> *Clear (C)* and *Note (N)*. The paragraph under the grid is shorter and points at ⌨ for the full
> list. Escape still does nothing on the grid. In the note panel, only *Done* puts you back in the
> cell.
