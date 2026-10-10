# WO-2.61 — result (implementer, Claude Opus)

**State: built. Acceptance lines 1–5 are ticked, each with evidence from runs whose output I read. Line 6 (👤 iPad) is open. Nothing is committed.** Two files are *staged* (`src/shell.css`, `tools/verify/score-search.mjs`). I staged them so I could revert the mutations with `git checkout` without losing my own edits. The rest is unstaged.

## What was built

**`src/shell.css`** implements ruling 1 as written:
- `.search-box` is now only a positioning context and flex item: `flex: 0 0 360px; position: relative; display: flex; align-items: center`. It has no border, padding or height of its own anywhere, so its box *is* the field's box.
- `.search-box input` carries the 1.5px `#e0e4ea` border, the 8px radius and padding `7px 38px 7px 36px`.
- The 🔍 is the existing `<span aria-hidden="true">`. It is now absolutely positioned at `left: 12.5px`, centred vertically, with `pointer-events: none`. No markup changed.
- `.search-clear` is absolutely positioned at `right: 11px`, centred vertically.
- Coarse block: the `.search-box` rule is gone. `.search-box input` gets `min-height: 44px`, vertical padding 0 and `padding-right: 49px`. `.search-clear` sits at `right: 3px`, 44×44, and the old `margin-right: -8px` is gone.
- The comment explaining why the source template's suppressed outline was not lifted is kept, with one parenthetical added. A block comment above `.search-box` records the ruling and the rejected `:focus-within` shape.
- The focus rule is not touched.

**Other files:**
- **`tools/verify/score-search.mjs`**: a `GEOM` reader plus three new checks, described under line 1 below.
- **`sw.js`**: `CACHE` v177 → v178.
- **`tools/README.md`**: call-site count 1911 → 1914, and a WO-2.61 paragraph with the full-run figures.
- **`TESTING.md`**: § WO-2.61 under Phase 2, with the Acceptance lines verbatim, the evidence and a mutation table.
- **`plans/work-orders/phase-2-attendance.md`**: boxes 1–5 ticked. The status is left at 🤖 CLAIMED for `--tick`.
- **Not changed, by decision:** `index.html`, `src/attendance.css` and `src/scores.css`. I re-read their comments about the box (`attendance.css` ~246 and ~1212, `scores.css` ~125 and ~913, the `index.html` comments above both boxes) and all are still true.

## Against the Acceptance list

1. **Ticked.** The bordered element is the focused one, on both screens.
   - New check in `verify/score-search.mjs`, run on a fine pointer at 1200×900 and again under a coarse one at 1024×768. The field is focused by a real press and holds a long string.
   - Each run confirms:
     - the `<input>` is `activeElement`, matches `:focus-visible`, and draws a `solid 2px` outline;
     - its border is solid on all four sides with an 8px radius;
     - the wrapper's border and padding are 0 and its rect equals the field's to within 0.5px;
     - the 🔍 and ✕ rects lie inside the field's;
     - `elementFromPoint` at the 🔍's centre is the field.
   - Measured on the fine pointer: field l40–r400, h33; 🔍 52.5–71.7; ✕ 369–389.
   - **M1** (border back on the wrapper, `border: none` on the field, marked `MUTATION WO-2.61`): 2 failed, the fine and coarse line-1 checks. Reverted, then green.
2. **Ticked.** Typed text clears both glyphs.
   - The test string is 140 characters, with the caret at the end and the field scrolled to it (`scrollLeft` 565 fine; 767 and 361 coarse).
   - The field's content box is compared against the 🔍's right edge and the ✕'s left edge (under coarse, the ✕'s whole 44px square):
     - fine: text area 77–361, 🔍 ends 71.7, ✕ starts 369;
     - coarse registry: 77–224, ✕ at 227;
     - coarse Scores: 77–630, ✕ at 633.
   - **M2** (padding back to 11px on both pointers): 2 failed. Reverted, then green.
   - **Limit:** this measures the content box, not glyph ink. Chromium clips an input's text to that box; you cannot put a Range over an input's value.
3. **Ticked.** The WO-2.58 behaviours are intact.
   - All three WO-2.58 checks, the WO-3.29 Escape check and the Scores ≥44px check pass **unedited**.
   - The new coarse check also measures both fields at h44 and both ✕ at 44×44, inside the field.
   - `verify/attendance-header.mjs` passes unchanged in the full run.
4. **Ticked.** The focus-ring checks pass unchanged.
   - `focus-ring.mjs` and `wo-sweep.mjs` are not in the diff.
   - The full run shows all three focus-ring checks PASS; sweep § 8 ("no rule removes a focus outline") PASS.
5. **Ticked.** Both tools pass.
   - `node tools/verify-shell.mjs`: `1918 checks · 1918 passed · 0 failed · 0 skipped`, 60,979 lines, 31.8 lines per check, 922s, exit 0, 2026-10-10 on the real clock. This was a full run on the reverted tree; I read its output after it exited.
   - `node tools/wo-sweep.mjs`: `50 checks · 47 passed · 0 failed · 3 to review`, exit 0, re-run after the last README edit.
   - `wo-gate --audit` PASS.
   - `CACHE` is v178.
6. **👤 Not ticked.** This needs the iPad after a force-quit. Safari draws the ring along a border-radius only from 16.4, which no headless run can settle.

## Decisions the work order didn't settle

- **Glyph hook.** I used `.search-box > span[aria-hidden="true"]` rather than adding a class in `index.html`, since the brief said markup changes only if needed.
- **Coarse ✕ placement.** `right: 3px` and padding-right 49px. That keeps the 44px square entirely inside the field's rect and puts the disc about where the fine-pointer ✕ sits.
- **Field background.** Left `transparent`, as the input was before; the wrapper had no background either. So nothing visibly changes but the ring.
- **Mutations ran on a cut-down copy.** I made a scratch copy of the harness in the session scratchpad, not in `tools/`, restricted to `focus-ring`, `score-search` and `attendance-header`. `attendance-header` *skipped* in that copy ("no window.planbook"); I didn't chase why, and it runs and passes in the full run. The full run was on the reverted tree only.
- **`grep -rn "MUTATION WO-2.61" src tools index.html sw.js`** returns nothing.

## Noted, not acted on (out of scope)

- `design/mockups/proposed-attendance.css` still draws the box the old way. The sweep has a standing REVIEW about that drawing's `.search-clear` living in `src/shell.css`; that predates this work order.
- The WO-2.58 check names still say "one beside the field". The ✕ is now *over* the field's edge. I left those names alone because line 3 asks for those checks unedited.

## CHANGELOG draft (the teacher's call)

> **The search boxes draw their focus ring where you'd expect.** Tapping into *Search students…* on the attendance screen or *Find a student…* on Scores now outlines the rounded box you see, with the 🔍 inside the ring — the same halo every other field in the app draws. It used to trace a square inside the box and leave the magnifier outside it. Nothing about searching or the ✕ changed.

## Files

- `c:\dev\planbook\src\shell.css` (staged)
- `c:\dev\planbook\tools\verify\score-search.mjs` (staged)
- `c:\dev\planbook\sw.js`
- `c:\dev\planbook\tools\README.md`
- `c:\dev\planbook\TESTING.md`
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md`
- `c:\dev\planbook\.claude\dispatch\WO-2.61-result.md`
