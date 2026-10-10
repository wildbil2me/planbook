# WO-1.72 — result

**Status: built, and both tools pass. Five of six Acceptance lines are ticked. The 👤 line is still open.**
Nothing is committed. The row is still 🤖 CLAIMED, since I did not run `--start`, `--handoff` or `--tick`. No `MUTATION`
marker is left in the tree: `grep -rn MUTATION` over `src/`, `index.html`, `sw.js`,
`tools/verify/settings-back.mjs` and `design/mockups/proposed-settings.css` finds only the
pre-existing prose line `src/shell.js:1053` ("A CLASS MUTATION ADDED LATER…").

## Acceptance, line by line

1. **Drawn from Settings, and on no other opening — ticked.** Evidence is from `tools/verify/settings-back.mjs` in the full run.
   - **From the hub:** all three dialogs (`rosterModal`, `classesModal`, `teacherModal`) open alone. Each draws one
     "‹ Settings" in its own header, before the title.
   - **Any other way:** I tried the + tab, a script's `.click()` on a door of a *shut* hub, and `openModal()`
     directly, for each of the three. The result was `drawn []` every time.
   - **The Traps sequence, driven in order:**
     - hub → Roster → ✕ → + tab.
     - hub → Roster → ✕ → `openModal('rosterModal')`. There is no route on the second opening, so only the close can have cleared the flag.
     - hub → Classes → ✕, Escape, backdrop or ‹ Settings, then the + tab.
     - hub → Classes → ✕ → the grades screen's Categories.

     Every one gave `drawn []`.
2. **Back reopens the hub with focus on the door used; ✕ and Done close all the way — ticked.**
   - **Back:** each dialog leaves `open ["settingsModal"]` with focus on the door used: `data-roster-manage`,
     `data-class-manage` or `data-teacher-panel`. Only one overlay is open, so back is a close and an open and the hub is
     never stacked over the dialog.
   - **The reopened hub:** its ✕ leaves `open []` with focus on `settingsBtn`, so the gear is still its opener.
   - **✕ and Done:** ✕ on all three, and Done on Your details, leave `open []` with focus on `settingsBtn`.
3. **Coarse pointer, 44px — ticked.** At 390×844 with a coarse pointer, all three measure
   `w 88.3, h 44, font 14px`. The ✕ beside the button is 44, nothing overlaps, and the page does not scroll sideways. `touch-targets.mjs`'s
   roster block now includes the button: `measured 95; under = []`.
4. **Tools pass, CACHE bumped — ticked.**
   - `node tools/verify-shell.mjs` exited 0: `1935 checks · 1935 passed · 0 failed · 0 skipped`,
     61,714 lines, 988s. I waited for `EXIT=0` in the log before reading the summary.
   - `node tools/wo-sweep.mjs` exited 0: `50 checks · 46 passed · 0 failed · 4 to review`. Three REVIEWs are the
     standing ones. The fourth names `.modal-header-lead`. It is a flex wrapper around the button and the title, not a touch target. That check compares against HEAD, so it goes quiet at the commit.
   - `sw.js`: `planbook-shell-v179` → `v180`.
   - `wo-gate.mjs --audit`: PASS.
5. **TESTING.md § WO-1.72 — ticked.** It is under Phase 1, after WO-1.71, with the lines copied verbatim and the
   evidence and the mutation round written out.
6. **👤 iPad — not ticked.** It needs the device. Nothing headless can show how the button looks or feels under a thumb.

## What each inner dialog is (the brief asked)

- **Roster → Edit student (`#studentModal`):** it stacks *over* the roster. `openModal` is called, and the roster is never closed.
- **Classes and terms → Categories (`#categoriesModal`):** it also stacks *over* its parent.

So under "first level only" the parent keeps its button underneath, the inner dialog has none, and
closing the inner one goes back to a parent that still has its button. The harness checks both, including
that back still works from Classes after Categories closes.

## Mutation round (scratch copy of the harness, two sections; files restored from copies taken first)

- **Clean:** 12/12.
- **Close hook deleted:** the forgetting check failed, but only on the `openModal()`-with-no-route case. Every routed opening sets
  the button again on the way in, which is defence in depth and is the reason that case exists.
- **Every route counted as from the hub:** 2 checks failed.
- **Back stacks the hub over the dialog:** 3 failed.
- **No focus moved to the door:** 2 failed.
- **Hub reopened with the door as its opener:** 1 failed.
- **`.modal-back` coarse rule deleted:** at first this *passed*. The coarse block's bare `button { min-height: 44px }`
  already gives the button its height. I added a 14px font assertion to the coarse check, since only the named rule sets that, and it then failed.

## Decisions the work order didn't settle

- **General close hook in `src/modal.js`.** I added `setCloseHook(id, fn)`, a counterpart to `setCloseGuard()`. It runs
  inside `closeModal()`, and every way of closing a dialog goes through there. That is the literal "clear on every close". The route also sets the button
  both ways on every opening, as a second line of defence.
- **"From the hub" means the hub was on screen**, not just that the door sits inside its markup. A
  script's `.click()` on a door of a shut hub draws no button. About fifteen harness sections open these dialogs that way.
- **Back uses `dismissModal()`, not `closeModal()`**, so a close guard would be asked if one were ever added. None of
  the three dialogs has one today. If the dialog stays open, the hub is not reopened.
- **Focus when a dialog opens is unchanged.** The button is drawn *after* `openModal()`, so focus still goes to ✕
  as it did before. Otherwise the new button would have taken first focus.
- **Accessible name:** `aria-label="Back to Settings"`, which contains the visible word "Settings".

## Correction to the brief

The brief said the mockup's `.modal-back` "is 28px and has no coarse rule". That is wrong.
`proposed-settings.css` § TOUCH already had `.modal-back { height: 44px; padding: 0 14px 0 12px;
font-size: 14px; }`, so I lifted it as it was. The banner amendment says it was lifted, not
written during the lift.

## Out of scope, declined

- I did not add `aria-controls` to the hub doors. It would have let the route find its dialog without the hard-coded
  id list in `SETTINGS_BACK_DIALOGS`.
- I did not touch the empty state's "Add your first class". It goes through the same route and correctly gets no button,
  but the harness does not drive it, because it would need a year with no classes.

## Files changed

- `src/modal.js`: `setCloseHook()`, called from `closeModal()`.
- `src/shell.js`: the hook-table entry; `SETTINGS_BACK_DIALOGS`, `showWayBack()`, `throughSettings()`,
  `goBackToSettings()`; the three door routes; the `data-settings-back` click route.
- `src/shell.css`: § SETTINGS BACK, the coarse rule, and `.modal-back` added to the grouped touch-action selector.
- `index.html`: the button in the headers of `#classesModal`, `#rosterModal` and `#teacherModal`, plus the hub comment.
- `sw.js`: v179 → v180.
- `tools/verify/settings-back.mjs` (new) and `tools/verify-shell.mjs` (import and registration).
- `tools/README.md`: call sites 1923 → 1931, and the WO-1.72 paragraph.
- `design/mockups/proposed-settings.css`: index line and banner marked as lifted. `design/mockups/README.md`:
  the landing note, and open question 1 answered. `design/mockups/index.html`: the index entry.
- `TESTING.md` § WO-1.72.
- `plans/work-orders/phase-1-shell-store-roster.md`: 5 boxes ticked; the status is left 🤖 CLAIMED.

## CHANGELOG draft (for the teacher to decide)

### A dialog opened from Settings has a way back to it — 2026-10-10

WO-1.72, owner-directed, from `design/mockups/settings-hub.html` frames D and E. Shell cache v179 → v180.

- **Roster, Classes and terms and Your details now show "‹ Settings" in their header when you opened
  them from Settings.** It takes you back to Settings, on the row you came from, so setting up the
  roster, the classes and the templates in one sitting no longer starts again at the gear each time.
  ✕ and Done still close all the way.
- Opened any other way, such as the + tab or the dialogs inside them (Edit student, Categories), there
  is no back button, because there is no Settings to go back to.
- `tools/verify/settings-back.mjs` is new. All 1935 harness checks pass, and five of six planted faults
  failed as predicted. The sixth led to a sharper check.
