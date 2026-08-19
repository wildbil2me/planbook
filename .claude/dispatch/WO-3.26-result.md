# WO-3.26 — the ungraded count on the home screen · result

**Written on pickup, not by the implementer.** The orchestrator process died after the implementer's
writes had all landed and before any report was made. Nothing below is the implementer's own account;
it is what the tree says, re-derived from the diff and from two full tool runs on the delivered tree.
Where a claim could only have come from reasoning the dead run did not leave behind, it is marked as
such rather than reconstructed.

## Files changed

| File | What |
|---|---|
| `src/home.js` | `ungradedCount()` + `ungradedChip()` + `rosterIdsOf()`; the signals slot gains its first occupant; header comment re-verifies WO-1.9's presentation-mode inheritance |
| `src/classes.js` | `getSelectedTermId()` split — new exported `getOpenTermId(classId)` resolves the open term for a *named* class; the old function is now one call to it |
| `src/home.css` | `.class-card-count` chip, shaped by value rather than borrowing `shell.css`'s `.pill`; named in the coarse block with the font bump and no 44px floor |
| `sw.js` | `CACHE` v83 → v84 |
| `tools/verify-shell.mjs` | +387 lines: one new section, 11 `check()` call sites, 9 executed on a green run |
| `tools/README.md` | recorded call-site count 955 → 966, plus the WO-3.26 entry (written on pickup) |
| `plans/work-orders/phase-3-gradebook.md` | status ⬜ → 🤖 CLAIMED |

## Verification, both runs on the delivered tree

- `node tools/verify-shell.mjs` — **`984 checks · 984 passed · 0 failed · 0 skipped`**, 26,741 lines,
  27.2 lines per check, 315s, **exit 0**. All nine WO-3.26 checks green; WO-1.10's pre-existing
  *"still reserves Phase 3 and 4's space"* check is still green, since its own six-class fixture has
  no ungraded work to put a chip on.
- `node tools/wo-sweep.mjs` — **22 checks · 20 passed · 0 failed · 2 to review**. The two REVIEWs are
  the standing pair (sensitive field names; due-date beside late/missing) and neither moved.
- `node --check` clean on all four `.js`/`.mjs` files; no CRLF rewrite anywhere in the diff.

## Acceptance, one by one

1. **three blanks → 3, entering the last one → 2, no reload — VERIFIED.** Harness: the card reads
   `3 to grade`, then `2 to grade` after a score is typed through the grid, redrawn by `src/shell.js`'s
   existing chain.
2. **counts `open` and nothing else — VERIFIED.** The fixture plants all five decoys (excused, a
   `late` carrying a score, a teacher-typed `0`, a column marked `missing`, zero-point bonus work) plus
   another term's untouched work; the count is 3, not 7.
3. **no chip when nothing is waiting, and the card is the same height — VERIFIED, and measured the
   only way that asserts anything.** `0 chip(s)` on the clear card. Height is settled by removing the
   chip from the tree and watching the grid not move — `grid 562px with, 562px without; slot 24px
   either way; chip 21.19px` — because the grid stretches cards to a common height, so comparing two
   cards would have passed whatever the chip's height was.
4. **matches the score grid — VERIFIED.** Counted off the drawn grid: 7 columns, 4 holding a blank, of
   which 3 are worth points; the card says 3. The one column the two disagree about is the zero-point
   bonus one, which is ungraded work that is not work *owed*.
5. **no grade arithmetic in `src/home.js`, and still off the `supports` census — VERIFIED.** The count
   is `openWork()`'s rows filtered on `state === 'open'` and unioned into a `Set` of assignment ids;
   no cell is read in this file. `wo-sweep.mjs` names `src/supports.js`'s askers as
   `accommodation-prompt.js`, `pass-history.js`, `roster.js` — `home.js` is not among them.
6. **nothing names a student, in presentation mode or out — VERIFIED.** Harness drives the card fresh
   with the mode on: same string both ways, and a search for the fixture's four unique surnames finds
   none on the grid.

**No 👤 line on this work order.** Nothing here is owed to a real iPad beyond the standing rule that a
green harness closes no human item; the coarse-pointer reading was taken under emulation and is
labelled as such in the section.

## What is NOT done

- ~~No mutation round was run~~ — **run on pickup, three mutations, all attributable.** *(1)* the
  `row.state === 'open'` filter deleted → `979 passed · 5 failed`, the card reading `5 to grade`.
  *(2)* a cell counted per student instead of one assignment → `979 passed · 5 failed`, the same five,
  which is why the fixture carries three students and not one. *(3)* the `if (!n) return null` guard
  removed → `980 passed · 4 failed`, and the fourth red is **WO-1.10's own check**, three weeks older
  than this work: its six-class fixture has no ungraded work, so every card grew a `0 to grade` chip,
  and the assertion that an empty slot holds its height turns out to double as the guard against a chip
  on a card with nothing to say. `src/home.js` restored byte-for-byte and compared after each round.
- **The cold-eyes verifier never ran.** A session limit killed it on its first tool call. The
  verification above was done by the session that also wrote this file and the `tools/README.md`
  entry, so it is not independent on those two. Reported as a weaker verdict rather than papered over;
  the mutation round is what partly covers it, since it asks the harness rather than the reader.
- **Maintenance protocol is still owed** — see the report to the owner.
- `tools/.vs.new`, a scratch copy of the inserted harness block left behind by the killed run, was
  byte-compared against the block and deleted.
