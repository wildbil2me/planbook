# WO-3.50 — result (implementer, 2026-10-07)

**Summary.** Built, and green on both tools. The due date now picks the term for the assignment in the
editor and for the copy dialog's source line. On creation that is the term holding today, and the list
follows it. After an edit it happens when the editor closes, never on `input`. A scored move asks first.
Seven of eight Acceptance boxes are ticked in `plans/work-orders/phase-3-gradebook.md`. The 👤 line is
left open. The status was not touched (still `🤖 CLAIMED`). No `--start`, `--release`, `--handoff`,
commit or push.

## Verification, quoted from output I read

- `node tools/verify-shell.mjs` (real clock, 2026-10-07), final tree:
  `1832 checks · 1832 passed · 0 failed · 0 skipped`, 57,962 lines, 852s, `EXIT=0`.
- `node tools/verify-shell.mjs --today=2026-11-10` (Quarter 2, across the Q1/Q2 edge from the real
  clock's Q1), final tree: `1832 checks · 1832 passed · 0 failed · 0 skipped`, 842s, `EXIT=0`. The run
  printed *THE CLOCK WAS MOVED*.
  - I diffed its titles against the real-clock run. Six differ, and each differs only by the date or
    term it prints: this block's three create checks, WO-3.49's create-door check, and the two WO-2.56
    state-line checks.
- `node tools/wo-sweep.mjs`: `48 checks · 45 passed · 0 failed · 3 to review`, `EXIT=0`.
  - The call-site count reads 1826, matching `tools/README.md:1256`.
  - All three REVIEWs were there before this work order. The due-date line it cites, `src/shell.js:286`,
    is the existing `data-past-due-accept` row moved down 7 lines.
- `grep -rn MUTATION src/ tools/ index.html sw.js` finds only comments that were there before (the same
  list as before I started). All mutations were made in a throwaway copy outside the repo (see below).

**One earlier run is worth knowing about.** The first `--today=2026-11-10` run of this tree was red:
`1808 checks · 1802 passed · 6 failed`. The cause was the harness, not the app.

- WO-3.3's section in `verify/assignments.mjs` types a fixed 2026-09-18 due date into *Unit 1 test*.
- On a Quarter 2 clock the new assignment goes into Q2. Done then correctly moves it back to Q1, so five
  checks saw one assignment where they expected two, and the section threw before my block.
- Fixed in the harness: the section now asks `termContaining()` whether 2026-09-18 picks the term the
  first assignment went into. If it does not, it types today into both fields.
- Confirmed from run output: the real clock types 2026-09-14/09-18, and Q2 types 2026-11-10.
- My first attempt at this fix compared against one term's edges. It went red again because the terms
  this run leaves overlap.

## Acceptance, line by line

1. **[x] A new assignment is filed under the term holding today, and the list shows that term.**
   - From a list put on the quarter that does *not* hold today, the row lands in today's quarter: Q1 on
     the real clock, Q2 under `--today=2026-11-10`.
   - The summary, the active term tab and the row all show that quarter, and the note says why.
   - Done with the dates untouched writes nothing (`rev` unmoved after a flush).
   - Cancel removes the row and puts the list back on the quarter it was showing.
   - Mutation M2 turns 3 checks red.
2. **[x] Typing a due date in another term moves nothing until the editor closes. Then it moves once,
   `rev` +1, and the list says where it went.**
   - The date was typed through `input`, including the phantom blank. The row stays in Q1 and on Q1's
     list while the editor is open.
   - Done files it in Q2 with `rev` +1. The list moves to Q2, and its note reads *“WO-3.50 Plain” moved
     here from Q1: its due date, Nov 12, is in Q2, and the due date picks the term.*
   - Escape and a mouse press on the backdrop each do the same on their own row. The ✕ is the close in
     the fill check.
   - "Opening another row" is driven through `openAssignmentEditor()` on the seam, because no on-screen
     door reaches it while the dialog covers the list.
   - Mutations M1 (the gestures skip the guard) and M3 (the term worked out on `input`, which is the
     trap) turn 10 and 7 checks red; M3 also makes the section throw.
3. **[x] A blank due date takes the assigned date and files by it. Both blank, or dates no term holds,
   leave the term unchanged, and the editor says so.**
   - A Cleared due date stays blank while the editor is open. The ✕ writes the assigned date into `due`
     (`rev` +1).
   - With the assigned date typed into Q2 and the due date Cleared, it moves to Q2 in one save.
   - Both dates Cleared, or a due date of 2027-03-01: the first close stops and writes nothing, and the
     editor's amber line says why and that it stays in Q1. The second close goes through.
   - In a class whose terms have no dates, the editor says so on opening and the close never stops.
   - Mutation M8 turns 2 checks red.
4. **[x] A move that carries scores names both terms and the score count before writing, and declining
   leaves the document byte-identical.**
   - The confirm is *Move it to Q2?* and reads *2 scores move from Q1 to Q2.*, plus a sentence about the
     SIS.
   - The whole-document `JSON.stringify` after a flush is identical before Done and after Done with the
     confirm open.
   - Escape on the confirm goes back to the editor.
   - *Keep it in Q1* leaves the whole document byte-identical, with `rev` unmoved.
   - *Move it to Q2* gives `rev` +1, a byte-identical score column, and the list on Q2.
   - Mutations M4 and M7 turn 5 and 3 checks red.
5. **[x] An old backup restores with every `termId` unchanged.**
   - The run's own document includes a row filed in Q1 and due in Q2, which is what an older build
     leaves. It goes through `backup.restoreFromText()`, `confirmRestore()` and a reload.
   - Every assignment's `termId` matches the file's.
   - Opening and closing that row with no date changed writes nothing.
   - There is no migration and no `SCHEMA_VERSION` change; `src/store.js` is untouched.
   - Mutation M5 (ruling 5 off) turns 2 checks red.
6. **[x] The copy dialog's source moves with its due date on confirm.**
   - Before the confirm, the source line reads *this assignment · Q1 · moves to Q2 on saving*, and its
     amber line names the 1 score.
   - The confirm writes the source's due date and Q2 in the same `update()` as the copy (`rev` +1), and
     the list follows.
   - Mutation M6 turns 1 check red.
7. **[x] `CACHE` is `planbook-shell-v169`** (was v168).
8. **[ ] 👤 Not ticked: it needs a real iPad.** Nothing here reads the score grid or a student page's
   grades after a move. The move changes only `termId`, and those screens read `termId`, but that is an
   argument, not a reading.

**Mutation round.** Eight mutations, M1 to M8.

- They were run in a copy of the tree under the session scratch directory, never in the working tree.
- A script wrote each mutation, ran a two-section subset (year store plus `verify/assignments.mjs`), and
  restored the file byte for byte. It printed `restored` after every run.
- Control: `48 checks · 47 passed · 0 failed · 1 skipped`. The skip is WO-3.3's fixture guard, because
  the subset leaves that fixture out. All 21 WO-3.50 checks were green, on both clocks.
- Every mutation turned at least one check red. The table is in `TESTING.md` § WO-3.50.

## Decisions the work order didn't settle

1. **How "every way the editor closes" is caught.**
   - `src/modal.js` gained `setCloseGuard()` and `dismissModal()`. Escape, the backdrop and every
     `data-modal-close` (✕, Done) now call `dismissModal()`.
   - `closeModal()` stays unguarded, for code that has already decided to close.
   - `src/shell.js` sets the guard on `#assignmentModal`, because shell knows which screens to repaint.
   - One consequence: the harness's own `window.planbook.closeModal(...)` calls skip the guard. That is
     why existing sections that type dates and close through the seam are unaffected.
2. **Ruling 5 is enforced by comparing the dates against a snapshot taken when the editor opened.**
   - An editor where no date changed re-files nothing. A date typed and then typed back counts as no
     change.
   - Without this, merely opening and closing an old row would migrate it.
3. **Dates no term holds stop the close once.** The editor's amber line says so, and closing again with
   the same dates goes through. This is my reading of "the editor says so". An editor that has closed
   cannot say anything, and a stop that blocked the close forever would trap the teacher.
4. **A class whose terms have no dates never stops the close.**
   - The editor says so as soon as it opens, because no date could ever place the work there.
   - Otherwise a teacher who never typed term dates would be stopped on every date edit.
5. **Declining the scored move writes nothing, not even ruling 3's copied due date.** I read
   "byte-identical" literally. The ✕ and Escape on the confirm go back to the editor; *Keep* closes both
   dialogs.
6. **"The list moves to that term" uses `selectTerm()`.** That is the term strip's own writer, so it
   writes the existing `planbook_openTermIds` UI preference.
   - This adds no new key and no new persistence.
   - The list, the header strip and the score grid stay in agreement.
   - The note over the list is module state only. It shows while that class and term are up and is
     dropped on any other.
   - The list follows only when the list or the score grid is behind the editor. From the calendar or a
     student page, the open term is not changed, and the announcement says where the work went.
7. **The create's Cancel puts the list back on the term it was showing.** Nothing was added, so there
   is nothing to follow.
8. **The scored-move count is the coverage bar's count (`enteredCount`).** It counts entries with a
   value or a flag against the roster. Note-only cells are not scores.
9. **The copy dialog source line works out its move as the line is drawn,** the way every other line
   in that dialog already does, and again at confirm.
   - Ruling 2's "never on `input`" is about a write moving the row behind the dialog, and this dialog
     writes nothing before its confirm.
   - The source's amber line is how ruling 4 reaches this dialog: it names the scores before the
     button.
10. **Hint text changed in step with the behaviour.**
    - The list hint and the editor's own note now say the due date picks the term.
    - They no longer promise that "clearing one leaves it empty", which ruling 3 made false for the due
      date at the close.
    - WO-3.17's checks for "no timetable", "next meeting" and "today" still pass.
11. **Two `copy-class.mjs` checks were rewritten for ruling 3,** as the brief predicted. They confirmed
    a source with a blank due date, and now assert that the assigned date is written into `due` (term
    unchanged). The create-door block also goes back to Q2 before its next Edit.

## Known limits (stated in TESTING.md, not built around)

- The move happens at the close. A due date typed and then abandoned (the app killed, a reload with the
  dialog up) is written but not moved. It moves the next time a date on that row is edited and the
  editor closes.
- Copies are still WO-3.49's. A copy with a blank due date keeps it blank, while its source now takes
  ruling 3's copy. I declined to change copies because that is outside this work order's scope.

## Out-of-scope temptations I declined

- Applying ruling 3 to the copies themselves, so a copy with a blank due date also takes its assigned
  date.
- A note on `docs/data-model.md` that `termId` is now derived from `due` at the close.
- Drawing a list note on the score grid. Today the grid only switches term and announces.

## Files changed

- `src/assignments.js`, `src/modal.js`, `src/shell.js`, `src/assignments.css`, `index.html`, `sw.js`
- `tools/verify/assignments.mjs`, `tools/verify/copy-class.mjs`, `tools/README.md`
- `TESTING.md` (§ WO-3.50, inserted before § WO-3.51)
- `plans/work-orders/phase-3-gradebook.md` (seven boxes ticked; status untouched)
- `.claude/dispatch/WO-3.50-result.md` (this file)

## CHANGELOG draft (for the teacher to take or leave)

> **The due date now decides which term an assignment is in, everywhere you edit one.** A new assignment
> goes into the term today is in. If you were looking at another term, the list moves there and says so.
> Change an assignment's due date and close the editor, and it moves to the term that date falls in, with
> the list following. A due date left blank takes the assigned date. If the assignment already has
> scores, Planbook asks first and names both terms and how many scores would move, because one of those
> terms may already be in the SIS. Assignments you open and close without changing a date stay exactly
> where they are, so nothing old is re-filed. The copy dialog's source line follows the same rule.
