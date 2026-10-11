# WO-1.77 — result (implementer, Claude Opus, 2026-10-11)

Built and verified on the local tree. Not committed. Status line untouched (🤖 CLAIMED). I ticked five of the six Acceptance boxes in `plans/work-orders/phase-1-shell-store-roster.md` and in `TESTING.md` § WO-1.77. The 👤 box is left open.

## Acceptance, line by line

1. **[x] Every `.modal-panel` has exactly one kind, as ruled, and measures it at 1280 and on the iPad lying down. None is over 95vw or overflows at 390×844.**
   - Evidence is the new section `tools/verify/dialog-kinds.mjs`, final run.
   - Source: `38 panels in the source · every one wears exactly one kind`.
   - Live document: `38 in the page, 38 in the source · one kind each`.
   - Against the table: `all 38 as ruled` (21 forms, 13 confirms, 4 reports).
   - Every panel cloned and measured at 1280 fine: `modal-form [640] · modal-confirm [480] · modal-report [900,980]`. The 980 is the Grade sheet's override. The same at 1194×834 coarse.
   - Eight real doors at both sizes: About, Settings, Classes, Roster, Edit student, Paste and the assignment editor read 640; Your details reads 480.
   - At 390×844 coarse, every clone measures 371. 95vw is 370.5 and offsetWidth rounds. Nothing scrolls sideways inside any panel. The seven doors opened over home read `350px sideways [0,0,0,0]`.
   - `copy-class.mjs`'s 920/919 fold check is green with Duplicate at 900, so the premise held and the breakpoint was not moved.
   - `attendance-history.mjs` (Record/Passes 900, Keys/history 640) and `grade-sheet.mjs` (980) are green.
   - One caveat: the assignment editor at 390 reads `371px sideways [134,0,0,0]`. The dialog is inside 95vw and nothing in it scrolls. The 134 is the assignments screen underneath it (see "Found, not fixed").
2. **[x] The harness fails a panel with no kind and one with two kinds. Each is proved by a planted fault, and with the class removed the dialog still draws at 480.**
   - Each fault was a full harness run with `MUTATION WO-1.77` marked in `index.html`. The good file was copied aside first and copied back after.
   - **A, no kind on `settingsModal`:** `1966 · 1959 passed · 7 failed`, all seven in this section. Source and DOM both read `{"overlay":"settingsModal","kinds":[]}`. The width checks read `OFF … "w":480,"ruled":640`. The doors read `settingsModal 480px (ruled 640)`, so the dialog drew at 480 through its real door, on the laptop and on the iPad.
   - **B, two kinds on `classDeleteModal`:** `1966 · 1961 passed · 5 failed`, all five in this section. Source and DOM both read `kinds:["modal-confirm","modal-form"]`. The width checks read `w:640, ruled:480`.
   - The fallback is also a standing check: every panel with all classes but `.modal-panel` removed measures 480 (`38 panels, every one 480 bare`).
   - `grep -rn "MUTATION WO-1.77" index.html src/ tools/ sw.js` was empty after the second revert. `grep -rn MUTATION` shows only prose that was there before this work order.
3. **[x] `design/style-guide.md` § 5 states the three kinds, what decides each, the override rule and the fallback.**
   - The new subsection is "Dialogs: three kinds, and the kind is the width (WO-1.77)".
4. **[x] `verify-shell` and `wo-sweep` pass, and `CACHE` is bumped.**
   - Final `node tools/verify-shell.mjs` after both reverts: `EXIT=0`, `1966 checks · 1966 passed · 0 failed · 0 skipped`, 62,950 lines, 1032s.
   - `node tools/wo-sweep.mjs`: exit 0, `50 checks · 47 passed · 0 failed · 3 to review` (the standing three).
   - The README call-site count went 1953 → 1962. That figure comes from the sweep's own count.
   - `sw.js` went v183 → v184.
5. **[x] `TESTING.md` § WO-1.77** is written under Phase 1, after WO-1.76. It has the Acceptance lines verbatim with evidence.
6. **[ ] 👤 iPad reading.** Owed to the owner. Not ticked.

## Decisions the work order didn't settle

- **About is not built at runtime.** The brief said `src/modal.js` line 8 builds it. That line is a doc comment showing the markup contract. About is in `index.html` with the other 37. I added the kind to the doc comment's example and a paragraph to it.
  - No dialog is built at runtime today. The "runtime" Deliverable is met two ways:
    - The live-document census holds every `.modal-panel` in the page.
    - A MutationObserver records any panel added while the section drives its doors. Its first draft caught the section's own clones; they are now marked and excluded.
  - That check passes today with "none was built at runtime". It is a fence for the future.
- **§ 5 of this style guide is "States".** The modal tiers are § 5 of Roll Call!'s portable-components, not this file. I put the subsection under § 5 because the Acceptance line names § 5, and a note at its head says why.
- **The `.roster-panel`, `.attendance-keys-panel`, `.attendance-report-panel` and `.assign-copy-panel` classes were removed.** Their only rule was a width. Their ruling comments moved to the kind's rule in `src/shell.css` and to each dialog's markup comment.
  - `.grades-report-panel` stays. It is worn beside `modal-report`, and its comment in `src/scores.css` now explains it as the one override.
- **Other harness checks changed because the ruling changed them.**
  - `attendance-history.mjs`: four width checks expected the history dialog at 480. It is ruled a form, so they now expect 640.
  - `roster-width.mjs`: its Acceptance 3 (two checks) moved into `dialog-kinds.mjs`, and its header says so.
- **The assignment editor is opened through the planted assignment's edit door, not + New**, because + New writes to the document. Navigation to it uses the element's own `click()`, not a coordinate click, because the coordinate path did not open the editor at 390. Every other door uses the harness's coordinate clicks.
- **I updated prose that stated a dialog's width as a current fact:**
  - the Settings hub comment in `src/shell.css`
  - the signal card comment in `src/signals-view.css`
  - the date-field note in `src/assignments.css`
  - the markup comments for Settings, Roster, Keys, history, Passes, Duplicate and the Grade sheet in `index.html`

  Historical narratives elsewhere (TESTING, older work orders, mockups) were left alone.

## Fields at the new width (Traps: report, don't restyle)

- `MEASURE |` lines at 1280 give how far the right-most field ends short of the body's content edge:
  - Edit student, Paste and the assignment editor: 0px short of 600, so their fields grow with the panel.
  - Classes and terms: 67px short. Roster: 55px short. In both, the field shares its row with a button, so the gap is the button.
  - About and Settings have no fields.
- Draft an email has no door here, so I read its CSS instead. Its fields are `width:100%` or `flex:1 1 auto`.
- No field was found leaving the right half empty. Nothing is proposed. The 👤 reading settles it.

## Found, not fixed (proposed follow-ups)

1. **The assignments screen scrolls sideways by 134px at 390×844 under a coarse pointer**, with one planted assignment. It is the page, not a dialog. `horizontal-overflow.mjs` does not visit that screen. The cause is not diagnosed; it could be the fixture's blank-dated term. This is worth its own small work order.
2. **`design/style-guide.html`, the rendered twin, does not show the three kinds.** The `.md` says the two are kept in step by hand. I left the twin alone because it is meant to be copied into sibling suite apps, and the kinds are a Planbook departure. Someone should decide whether it gets a note.
3. **The header comment in `tools/verify-shell.mjs` says "Seventy-five files".** That was already stale before this work order (90 were named) and is now 91. `tools/README.md`'s "ninety" is updated to "ninety-one"; the entry file's comment was not.

## Files changed

- `src/shell.css`: the three kinds, their coarse restatement, the Settings hub comment.
- `src/attendance.css`, `src/assignments.css`: width rules moved to the kinds, with comments.
- `src/scores.css`: override comments. `src/signals-view.css`: a comment.
- `src/modal.js`: the doc comment only.
- `index.html`: a kind on all 38 panels, and comments.
- `sw.js`: v184.
- `design/style-guide.md`: § 5 subsection.
- `tools/verify/dialog-kinds.mjs`: new.
- `tools/verify-shell.mjs`: registered the new section.
- `tools/verify/roster-width.mjs`: Acceptance 3 moved out.
- `tools/verify/attendance-history.mjs`: history dialog checks now expect 640.
- `tools/README.md`: count 1962, ninety-one files, WO-1.77 entry.
- `TESTING.md`: § WO-1.77.
- `plans/work-orders/phase-1-shell-store-roster.md`: five boxes ticked.

## Draft CHANGELOG entry (the teacher's to decide)

> **Dialogs are as wide as what is in them.** Every dialog is now one of three kinds: a confirm (480), a form (640) or a report (900). The kind is written on the dialog itself, so the next one added has a rule to follow instead of a teacher to find it too narrow. About, the assignment editor, Draft an email, Settings and fifteen more forms move from 480 to 640. Duplicate goes from 880 to 900, beside the attendance record and hall passes. The Grade sheet keeps its 980 as the one stated exception. Confirms stay at 480. A dialog someone forgets to classify still draws at 480, and the pre-deploy check fails it by name.
