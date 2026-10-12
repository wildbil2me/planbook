# WO-3.61 — the Scores keys open a dialog, and Clear and Note get a key · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.61-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override): ruling 3 makes N's behaviour depend on presentation mode, which is a sensitive surface in ROUTING.md's Claude column, and the deliverables include teacher-facing prose (the dialog's rows, the reworded hint, `TESTING.md`). The runner-up was Codex — the key handling and dialog are a lift of Attendance's shipped pattern and mechanically checkable — set aside because the presentation-mode clause alone decides it. The README table names no route for this row.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.61 — the Scores keys open a dialog, and Clear and Note get a key

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-12 · **Size** M · **Depends on** WO-3.60
**Closes roadmap** *(no box. Owner-directed, 2026-10-11.)*

**Booked 2026-10-11** with WO-3.60, same drawing, frame D. On Attendance ⌨ opens a dialog and `?`
opens it from the keyboard; on Scores it unfolds a strip inside the panel. The strip's rows are
`nowrap`, so each had to be measured for spilling through its border at 390px, and the `← →` row
has been reworded twice to fit (WO-3.16, WO-3.24). The first hint paragraph under the grid restates
nearly every key. And two of the flag bar's five buttons — Clear and Note — have no key at all.
**After WO-3.60**, which moves ⌨ into the toolbar and the flag bar over the grid; both are edited
again here.

**Surface.** [`design/mockups/scores-tidy.html`](../../design/mockups/scores-tidy.html), frame D
(the dialog) and frame A's flag bar and first hint paragraph. No new CSS: the dialog wears
`src/attendance.css`'s `.attendance-keys`, `.attendance-key-row` and `.attendance-key` as shipped,
and the `modal-form` kind (WO-1.77).

**Rulings, the owner's, 2026-10-11**
1. **⌨ opens a dialog**, *Entering scores from the keyboard*, of the `modal-form` kind, with the
   rows frame D draws. `#scoresKeys` and the `keysOpen` disclosure go.
2. **`?` opens it from the Scores screen, including from inside a score cell**, as it does on
   Attendance, and closing it gives focus back to the cell. A score cell asks for a decimal keypad
   and `?` is not a score.
3. **C clears the cell** — exactly what the Clear button does, score and mark together, in one
   press. **N opens the note on the cell**, exactly as the Note button does. Neither is a key the
   grid already uses, so N keeps WO-3.32's Trap rather than reversing it. **Under presentation mode
   N does nothing**, because the Note button is not there either.
4. **The flag bar carries the letters**: *Clear (C)* and *Note (N)*, as it carries L, M and X.
5. **The first hint paragraph shrinks** to frame A's two sentences and points at ⌨. The sentence
   *Escape does nothing here because there is no dialog to close* is reworded to say Escape does
   nothing **on the grid**; the dialog's last row says Escape closes it.
6. **The dialog stays outside WO-3.58's review** — it has no message, note or warning to place.
   WO-3.58's *Not in scope* names it.

**Deliverables**
- **`index.html`**: `#scoresKeys` goes; a `scoresKeysModal` dialog with frame D's rows; the ⌨
  button opens it (`aria-haspopup="dialog"`, no `aria-expanded`); the flag bar's two labels; the
  hint's first paragraph and its Escape sentence.
- **`src/shell.js`**: `?` on the Scores screen opens the dialog with the focused cell as opener, the
  way the Attendance branch does at `e.key === '?'`.
- **`src/scores.js`**: C and N in `handleScoreKey()`; the strip's state and its decision-4 comment
  go.
- **`src/scores.css`**: `.scores-keys`, `.scores-key` and the keys button's expanded state go if
  nothing else wears them.
- **The harness**: `tools/verify/keys-legend-scores.mjs` and `keys-legend-guards.mjs` rewritten for
  a dialog; `score-grid.mjs` and `score-notes.mjs` for the flag bar's words; new checks for `?`, C
  and N.
- **`design/mockups/proposed-scores-tidy.css`'s banner and `README.md` section** amended to say
  frame D landed.
- **`TESTING.md` § WO-3.61**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] ⌨ opens a `modal-form` dialog holding a row for ↵, ⇥, ↑ ↓, ← →, L, M, X, C, ⌫, N and Esc.
      `#scoresKeys` does not exist, and every dialog in `index.html` still wears exactly one kind.
- [ ] `?` pressed inside a score cell opens the dialog, writes nothing into the cell, and closing
      the dialog puts focus back in that cell.
- [ ] C in a cell holding a score and a flag leaves it blank with no flag, as the Clear button does;
      `c` does the same. Ctrl+C in a cell still copies.
- [ ] N in a cell opens that cell's note panel with focus in its field, as the Note button does; `n`
      does the same. Under presentation mode N opens nothing and writes nothing into the cell.
- [ ] The flag bar reads *Clear (C)* and *Note (N)*, and the first hint paragraph is frame A's.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the iPad with a keyboard attached, after a force-quit: `?`, C and N from a score cell,
      and the dialog reads whole upright.

**Traps** — **The character filter.** WO-3.25 refuses characters on their way into a score cell, so
C, N and `?` must be taken by the key handler before that filter sees them, and the handler must
`preventDefault` so none lands in the field. **Modifiers**: `src/shell.js` returns on Ctrl, Alt and
Meta before the score branch, which is what keeps Ctrl+C as copy and Ctrl+N as a new window —
measure that still holds rather than reading it. Shift is not a modifier here: `e.key` is `'C'` with
Shift held, and refusing a modified letter refuses the capital (`handleScoreKey()`'s own comment).
**Check first whether Escape already closes the note panel** and hands focus back; if not, say so in
`TESTING.md` rather than building it — it is not ruled.

**Not in scope** — the column head (WO-3.62), and Attendance's own keys dialog.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/proposed-scores-tidy.css`
  - `design/mockups/scores-tidy.html`
  - `src/attendance.css`
  - `src/scores.css`
  - `src/scores.js`
  - `src/shell.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/keys-legend-scores.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `index.html` — `#attendanceKeysModal` (~line 4739) and its ⌨ opener (~line 967, `data-modal-open`, `aria-haspopup="dialog"`) are the pattern to copy; `#scoresKeys` (~line 1468) and its button (~line 1393) are what goes. Every dialog wears exactly one of `modal-confirm` / `modal-form` / `modal-report` (WO-1.77).
- `src/shell.js` — the Attendance `e.key === '?'` branch (~line 4069) opens `KEYS_MODAL` with the active element as opener. **Note the `tag === 'INPUT'` guard above it returns on any input** — a score cell is an INPUT, so the Scores `?` cannot simply sit beside Attendance's; it belongs in the score-cell branch earlier in the same listener, before the WO-3.25 `beforeinput` filter is reached and with `preventDefault`. `src/modal.js`'s header explains opener focus return (and the Safari note).
- `src/scores.js` — `handleScoreKey()` (~line 2173) and its Shift comment; `keysOpen` / `KEYS_ID` (~lines 195–216, 1484–1540) go. The note panel's header comment (~line 125, ~1860) currently says the note is opened "by its own button and by no key" — that sentence becomes false here and must be reworded, and WO-3.32's Trap (in `plans/work-orders/phase-3-gradebook.md`) is what ruling 3 says N keeps rather than reverses: read it before writing N. Find how the Note button is suppressed under presentation mode and make N ask the same thing, rather than a second `presentationMode()` opinion.
- `tools/verify/keys-legend-guards.mjs`, `score-grid.mjs`, `score-notes.mjs`, and `tools/verify/keys-legend-marking.mjs` (Attendance's dialog checks — the model for the rewritten Scores ones).

**Traps to carry beyond the work order's own:**
- **Mutation discipline.** If you mutate to prove a check bites, mark it `MUTATION` and revert it before you write any doc or tick any box; `grep -rn MUTATION src/ index.html tools/` must be empty when you report. Dead dispatches here have left armed mutations under ticked boxes.
- **Bump `CACHE` in `sw.js`** — `index.html` is in SHELL.
- **`tools/README.md` records harness counts** that `wo-sweep.mjs` checks; if you add check call sites or files, update what it records or the sweep goes red on finished work.
- **Do not touch the column head** (WO-3.62) or Attendance's dialog.
- The Escape-on-note-panel question in Traps is a *finding to record*, not a feature to build.
- Leave the 👤 line open. Write the `CHANGELOG.md` entry as a draft in your result file only.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 7 lines, reported against one by one

1. ⌨ opens a `modal-form` dialog holding a row for ↵, ⇥, ↑ ↓, ← →, L, M, X, C, ⌫, N and Esc. `#scoresKeys` does not exist, and every dialog in `index.html` still wears exactly one kind.
2. `?` pressed inside a score cell opens the dialog, writes nothing into the cell, and closing the dialog puts focus back in that cell.
3. C in a cell holding a score and a flag leaves it blank with no flag, as the Clear button does; `c` does the same. Ctrl+C in a cell still copies.
4. N in a cell opens that cell's note panel with focus in its field, as the Note button does; `n` does the same. Under presentation mode N opens nothing and writes nothing into the cell.
5. The flag bar reads *Clear (C)* and *Note (N)*, and the first hint paragraph is frame A's.
6. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
7. 👤 On the iPad with a keyboard attached, after a force-quit: `?`, C and N from a score cell, and the dialog reads whole upright.

**Write `TESTING.md` § WO-3.61 — it is a deliverable, not a permission.** Add `### WO-3.61 — the Scores keys open a dialog, and Clear and Note get a key` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.61` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

