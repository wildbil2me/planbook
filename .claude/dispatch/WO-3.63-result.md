# WO-3.63 — result (implementer, 2026-10-12)

**Status:** four of five Acceptance lines closed and ticked. The 👤 iPad line is open and unticked.
The row is still 🤖 CLAIMED; I ran no --start, --release, --handoff or --tick.

## What changed

- `index.html`, `#assignmentModal`:
  - `#assignmentTermNote` and `#assignmentError` now sit together directly before `.modal-actions`, after the two `.class-hint` paragraphs. The term note is first and the refusal last, nearest Done, which is the owner's order at dispatch.
  - Nothing follows `.modal-actions` in the dialog body any more.
  - One block comment above the pair says why they are there: WO-3.58's rule, the owner's order, and that the refusal is not beside the Name field even though the keyboard may cover it. The term note keeps its WO-3.50 comment.
  - The refusal had no markup comment, so it gained one (WO-3.56 ruling 4, `refuseBlankName()`, the live region, focus).
  - The accommodation prompt did not move. Its comment now records the ruling that it is not a message.
  - The modal's header comment said "the amber line under the fields". It now says "above the buttons (WO-3.63)".
  - No class, margin, colour or wording changed.
- `src/assignments.js`: unchanged. Both elements are found by id, and no comment there names where either one sits. (`showAssignmentError()` says the line "lands in a corner of a dialog". That is still true, so I left it.)
- `sw.js`: `CACHE` v191 → v192.
- `tools/verify/assignments.mjs`:
  - New exported `READ_EDITOR_MESSAGES`, which measures from `getBoundingClientRect()`. It reports: whether each message's bottom is above the next edge; every visible body child drawn in each gap (`toActions`, `noteToErr`); every visible child drawn below the actions row (`below`); every element after `.modal-actions` in the markup (`domAfter`); the computed colours; focus on the Name field; and `#srLive`'s text.
  - Also exports `EDITOR_RED` and `EDITOR_AMBER`.
  - Two new checks sit beside WO-3.50's term-note checks:
    - the note alone, both at a close that stops and when the editor opens in an undated class;
    - the note and the refusal together, in that order, with the name then typed back and the dialog closed.
- `tools/verify/copy-class.mjs`: imports the reader. One new check sits beside WO-3.56's refusal check: the refusal alone, from Done and from *Copy into other classes…*. It confirms that the copy dialog does not open and that Cancel still removes the create. Until now no harness check drove the copy door's blank-name refusal at all.
- `tools/README.md`: the call-site count went 2032 → 2035, taken from the sweep's own count. Its paragraph is added beside WO-3.62's.
- `TESTING.md`: added § WO-3.63 under Phase 3 (before `## Phase 4`). It copies the Acceptance lines verbatim and gives the evidence for each.
- `plans/work-orders/phase-3-gradebook.md`, WO-3.63:
  - The "Open — the owner, at dispatch." paragraph is rewritten as **"Answered 2026-10-12, the owner, at dispatch: as drawn, both."** It keeps the reasoning.
  - The Deliverables line's "(see the Open line)" now points at *Answered*.
  - The Traps line "unless the Open line is answered that way" is replaced with the ruling.
  - Acceptance 1–4 are ticked.
- `plans/work-orders/README.md`, running-order row 168: it said "Two Open lines, the owner's at dispatch". It now records both as answered. This edit was not named in the brief. I made it for the same reason as the others: it called the questions open.
- `design/mockups/README.md`:
  - New section `## Decided, the owner, 2026-10-12, at WO-3.63's dispatch`, placed after "after the verdict" and in that list's style.
  - Collected questions 1 and 2 now read *(**Answered 2026-10-12, the owner: as drawn** — see above.)*
  - Questions 4 onward are untouched.
- `design/mockups/dialog-messages.html`, frame 1:
  - The two amber `mk-caption ask` captions (line 60, "The drawing's guess — order inside the place", and line 61, "The drawing's reading — the accommodation prompt…") are now `mk-caption decided` and headed "Decided, the owner, 2026-10-12, at WO-3.63's dispatch: as drawn".
  - Line 61's last sentence ("If the owner reads the rule as taking it too, … WO-3.63 grows a line") now reads "The owner read the rule as not taking it, so WO-3.63 grows no line for it."
  - WO-3.58's section of the phase file has no sentence calling either question open, so I made no edit there.

## Acceptance, line by line

1. **[x] The refusal is above the buttons, last before them, and focuses Name; the same from Copy into other classes….** `copy-class.mjs` WO-3.63 check, PASS:
   - From Done: refusal box 697.9–731.9, actions from 749.9, gap `[]`, `below` `[]`, `domAfter` `[]`, `focused: true`.
   - From the copy door: same boxes, the copy wording, `focused: true`, copy dialog open `false`.
2. **[x] The term note sits in the same place, directly above the refusal or the buttons; nothing draws after `.modal-actions`.** `assignments.mjs`, two checks, both PASS:
   - Note alone: 687.9–741.9 against actions 759.9, gap `[]`.
   - Both showing: note 665.9–719.9, refusal 729.9–763.9, actions 781.9, both gaps `[]`.
   - `below` and `domAfter` are `[]` in every reading.
3. **[x] Both keep their wording and colours, and the refusal is spoken by the live region.** Read with `getComputedStyle`:
   - Refusal: `rgb(192, 57, 43)` on `rgb(253, 234, 234)`.
   - Note: `rgb(138, 109, 26)` on `rgb(255, 248, 230)`, border `rgb(240, 223, 168)`.
   - The refusal's text is matched exactly for both doors, and `#srLive` equals it.
   - The note is matched against WO-3.50's wording.
4. **[x] Harness and sweep pass; `CACHE` is bumped.**
   - `node tools/verify-shell.mjs`: `2047 checks · 2047 passed · 0 failed · 0 skipped`, 65,281 lines, 1108s, exit 0. I waited for the exit before reading it.
   - `node tools/wo-sweep.mjs`: `51 checks · 48 passed · 0 failed · 3 to review`, exit 0. The three reviews are the standing ones. Its first run failed only on the call-site count; that was fixed and re-run green.
   - `node tools/wo-gate.mjs --audit`: PASS, exit 0.
   - `sw.js` is v192.
5. **[ ] 👤 iPad: open.** I have no iPad. Per the Traps line, the caret in Name raises the keyboard, which may cover the refusal. The person reading this line should record what they see and not move the refusal beside the field.

## Commands run

| Command | Result |
|---|---|
| `node tools/verify-shell.mjs` (first run) | Exit 1. A syntax error in my own new check: an unescaped apostrophe. I fixed it and confirmed with `node --check`. |
| `node tools/verify-shell.mjs` (second run) | Exit 0, 2047/2047 |
| `node tools/wo-sweep.mjs` (first run) | Exit 1, call-site count 2035 against 2032 recorded |
| `node tools/wo-sweep.mjs` (after the fix, then again after TESTING.md) | Exit 0, 51 · 48 · 0 · 3 |
| `node tools/wo-gate.mjs WO-3.63` | PASS (with the expected CLAIMED / interrupted-draft notes) |
| `node tools/wo-gate.mjs --audit` | PASS, exit 0 |
| `git diff \| grep -c "^+.*MUTATION"` | 0 |
| `grep -rn MUTATION` over every touched file | Only the existing prose hits |

## What I could not close, and decisions

- **Not mutation-proved.** I planted no fault, because a second full run is about 18 minutes. On the old layout the reader would report `errAbove: false` and `domAfter: ["#assignmentError"]`, and the hints would show in `toActions`. That is reasoning, not a run, and `TESTING.md` says so. A verifier who wants teeth can move `#assignmentError` back after `.modal-actions` and run the harness.
- **Geometry is measured at 1280×900 on a fine pointer only**, which is the viewport both harness blocks run at. I measured no phone or coarse width; the 👤 line covers the iPad.
- **Decision: one shared reader, exported from `assignments.mjs` and imported by `copy-class.mjs`.** This follows the existing `INSTALL_CLASS_READER` import pattern, so the two places measure the same way.
- **Decision: "between" covers every visible child of `.modal-body` whose box overlaps the gap.** That is stricter than "nothing but the term note" because, in the ruled order, nothing at all may sit between the refusal and the buttons.
- **Out-of-scope temptation, declined:** `showAssignmentError()`'s comment ("lands in a corner of a dialog") could be reworded now that the corner is directly above Done. I left it because it is still true.

## Draft CHANGELOG entry (the teacher's to decide)

> The assignment editor's messages now draw together, just above its buttons. The *needs a name* refusal used to appear under Done, where it was easy to miss. It now sits directly above the buttons, and the amber *no term holds these dates* note sits just above it. Nothing about either message's wording or colour changed.
