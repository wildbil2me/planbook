# WO-3.32 — a score cell can carry a note · result

**Recovered dispatch.** The first implementer built this work order and was killed by an API session
limit during its mutation round (M2). This second run did **not rebuild**: it audited the delivered
tree against the brief, re-ran M2 to a recorded result, re-ran both tools on the delivered tree, and
did the doc pass that was still owed. **No code was changed in this run**; the audit found no defect
against the brief.

## Safety state

- On arrival: `src/shell.js` and `src/score-notes.js` were byte-identical (`cmp`) to the pre-mutation
  copies in the session scratchpad, line 1984 read `scores.renderScores();`, and
  `grep -rn MUTATION src tools index.html sw.js docs privacy.html` matched only long-standing prose
  (`src/shell.js:982`, `tools/README.md`, three `tools/verify/*.mjs` comments, `tools/wo-gate.mjs`).
- M2 was applied with a `MUTATION M2` marker **after** staging every WO-3.32 file, run, then reverted by
  copying `shell.js.orig` back; `cmp` reported identical, `git diff --stat` against the index was empty,
  and the same grep after the revert matched only the long-standing prose above.
- **No mutation is live in the delivered tree.**

## Commands, with the output read

- `node tools/verify-shell.mjs` on the delivered tree (after the M2 revert):
  `1745 checks · 1745 passed · 0 failed · 0 skipped`, `55,472 lines · 31.8 lines per check · 761s`,
  `EXIT=0`. The WO-3.32 section is 24 results, all PASS.
- `node tools/wo-sweep.mjs` after the doc pass: `46 checks · 43 passed · 0 failed · 3 to review`, exit 0 —
  the three standing reviews (sensitive names, due-date lines, the mockup banner). Before the doc pass
  it was red on exactly one line, the `check()` call-site count (1712 recorded, 1737 actual).
- `node tools/wo-gate.mjs --audit`: PASS. `node tools/wo-gate.mjs WO-3.32`: gates clear; status still
  🤖 CLAIMED (not touched).

## Mutation round

| Mutation | Result |
|---|---|
| M1 · `scoreNotesVisible()` returns `true` (`src/score-notes.js`) | `1745 checks · 1743 passed · 2 failed`, EXIT=1 — **the first implementer's run**; I did not re-run it, but I read its log (`scratchpad/vsM1.log`): the two FAILs are the grid and student-detail presentation-mode checks |
| M2 · `scores.renderScores();` deleted from `flipPresentationMode()` (`src/shell.js`) | **Run this session**: `1745 checks · 1743 passed · 2 failed · 0 skipped`, 55,472 lines, 763s, `EXIT=1`. Red: the grid check (4 note strings, 4 marks, "has a note", tooltip, Note button shown, panel open holding the note) **and the student-detail check** — the card was correctly absent, but the hidden grid behind it still held all four notes in its DOM. That second red is the evidence for leaving both repaints unguarded by the current view |

## Acceptance, line by line

Evidence for every headless line is `tools/verify/score-notes.mjs` in the green run above. I did **not**
tick the phase file's boxes or change its status line (left for the verifier / `--tick`, as instructed).
I ticked the matching headless lines in `TESTING.md` § WO-3.32 from that run.

1. **Round-trip; clearing removes the key** — met. Typed through the panel → `{ v: 80, note }`; edited →
   new text; whitespace-only field → `{ v: 80 }` with no `note` key; Remove note on a blank holding only
   a note deletes the cell and its emptied column.
2. **No grade changes on any screen** — met for the screens checked: grid grade cells, grid summary,
   `classGrade()` directly, the grade sheet's record, and the assignment list's entered count (a
   note-only blank is not "entered"). Not mutation-proved.
3. **Mark on the grid; note beside its assignment on student detail** — met (mark drawn, aria-hidden,
   tooltip `Note: …`, accessible name "…, has a note"; detail card rows in column order).
4. **Presentation mode: no note text and no mark in the DOM, grid and detail; mutation-proved** — met.
   Flipped from the header **with the panel open**; searched `outerHTML` and every field's value. M1 and
   M2 both go red.
5. **`{{score.note}}` and every path into a cell refused; grade sheet has no note** — met: 19 spellings
   each block, stay intact, carry no note; full palette carries none; grade sheet dialog, record and CSV
   carry none. Also: no note in `log[]`, none in the student CSV.
6. **Pre-WO backup restores unchanged; a year with notes round-trips** — met, both through
   `parseBackup()` and through the real restore confirm read back off IndexedDB.
7. **Keyboard unchanged; no flag shortcut taken** — met: Enter (incl. clamp), arrows, Tab, Escape across
   noted cells; L/⌫/X/M/digits on noted cells carry the note; `n`/`N` open nothing; the panel never opens
   from a key.
8. **👤 iPad, under a thumb** — **not verified; needs a real iPad.** Left unticked in both files. The
   coarse-pointer emulation measured the Note button and the panel's three controls at ≥44px, which
   is a green run, not a tick.

## Audit — kept vs changed

Everything delivered was **kept**. Read deliverable by deliverable and trap by trap:

- `note` field: one writer per screen path (`writeNote()`), `writeCell()` carries an existing note
  through value/flag/clear writes, `acceptPastDue()` carries it too, whitespace deletes the key, a
  note-only cell is `{ v: null, note }`. The grade engine, `graded-pieces.js`, `openWork()` (home
  ungraded chip, grading queue) all read `v`/`flag` only — confirmed by reading them.
- Grid: Note button in the flag bar, static panel in `index.html`, no key bound (Trap 1 honoured).
- Not mirrored into the log (Trap 2 honoured; harness checks `log[]`).
- One asker of the mode: `src/score-notes.js` `visibleNoteOf()`/`scoreNotesVisible()` via
  `presentationMode()` from `src/supports.js` — no second definition. `src/detail.js` still imports
  nothing from `supports.js`.
- Merge fields: no change to `src/merge-fields.js` (the whitelist already refuses); a check says so.
- Grade sheet untouched; detail card wears `.log-card` (print gate); CSV untouched.
- `sw.js` CACHE v162→v163 and `./src/score-notes.js` added to `SHELL`.
- 44px for the Note button, field, Remove note and Done under `@media (pointer: coarse)`. Colours inline.
- `privacy.html` and `docs/FERPA.md` each gained the note in their "what data" list in the same sitting,
  dates bumped to 4 October 2026 in both; the shared data-flow statement is untouched. Neither
  document's backup section enumerates score fields (they say "grades"), so nothing further was owed
  there. `docs/data-model.md` gained the example cell and the rule paragraph.

## Decisions the work order left open

- **The Surface was ruled too small to draw** (by the first implementer; I agree): the panel is
  `src/attendance.css`'s `.attendance-report-write` block lifted value for value, the mark an indigo
  corner at the cell's top-left. Stated at the rule in `src/scores.css` and in the phase file.
- **`flipPresentationMode()` repaints the grid and detail regardless of current view** — the only
  unguarded entries there. M2 shows why: a hidden grid is still a DOM holding the note in `title`.
- **Clear and ⌫ never take a note off**; only the panel does (no undo in the app).
- **A note-only cell is not "entered"** on the assignment list's coverage count.

## Finding (not changed, per the owner's 2026-10-02 ruling)

**Attendance-mark notes do show under the projector.** `src/attendance.js` `cellFor()` puts a mark's
note on the register cell's tooltip and accessible name, and `src/attendance-report.js`'s write block
shows it in a field; neither asks `presentationMode()`. Recorded in the phase file and `TESTING.md`.

## Gaps and declined temptations

- **The past-due prompt's note carry (`src/past-due.js` `acceptPastDue()`) has no harness check.** It
  is correct by reading; a check would be a small addition to `score-notes.mjs` or `past-due.mjs`.
  Proposed follow-up rather than a second 13-minute run here.
- **Loss-confirmation counts** (`src/categories.js` `removalCounts()`, `src/classes.js` deletion counts,
  `src/roster.js` student delete, `src/backup.js` `countScores()`) count a note-only cell as a "score".
  These are at-stake counts, not grades, and a note would be lost with the cell, so they were left
  alone; flagged for the owner in case the wording "N scores" should exclude them.
- Not touched: attendance-note visibility (owner's ruling), any WO-3.33 history.

## Files changed (whole work order, both runs)

- New: `src/score-notes.js`, `tools/verify/score-notes.mjs`
- Code: `src/scores.js`, `src/scores.css`, `src/detail.js`, `src/detail.css`, `src/assignments.js`,
  `src/past-due.js`, `src/shell.js`, `index.html`, `sw.js`, `tools/verify-shell.mjs`
- Docs: `docs/data-model.md`, `docs/FERPA.md`, `privacy.html`,
  `plans/work-orders/phase-3-gradebook.md` (status line by `--start`; this run added the "Built
  2026-10-04" block — no boxes ticked), `TESTING.md` (new § WO-3.32; headless lines ticked, 👤 open),
  `tools/README.md` (call-site count 1712→1737, file count seventy-nine→eighty, ledger entry)
- Dispatch: `.claude/dispatch/WO-3.32-brief.md`, `-status.md`, this file
- Not committed. All WO files except this run's three doc edits and this file are staged (staged
  before M2 so a checkout could not clobber them).

## CHANGELOG draft (the teacher decides)

> **A score can carry a note.** Tap a score, tap **Note** in the bar above the grid, and type the
> reason behind it — a revised essay, a conference, turned in after the absence. A small corner marks
> the cell, and the note is on the student's detail page beside its assignment. It changes no grade,
> it is never printed or put in a message, and in presentation mode it and its mark disappear.
