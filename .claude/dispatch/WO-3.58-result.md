# WO-3.58 — result

**Implementer:** Claude (Opus), 2026-10-12. Review only: nothing in `src/`, `index.html` or `sw.js`
moved. No mutation was planted, so there is nothing to revert. `grep MUTATION` over the new drawing
finds nothing. Nothing is committed.

## Acceptance, line by line

1. **[x] Every dialog in the confirmed scope has a frame as it is now, showing where its messages draw.**
   `design/mockups/dialog-messages.html` has frames 1–10, one for each of the ten dialogs the owner
   confirmed, drawn at the WO-1.77 width for its kind. Every message has a magenta `.mk-hit` outline
   and a number. I drew the "now" positions from the code, not from the markup alone, because some
   messages are injected at runtime. `TESTING.md` § WO-3.58 lists every `index.html` / `src/` line
   each position came from. Four dialogs change (frames 1, 2, 6 and 10) and have a "proposed" frame
   beside the "now" one. The other six already comply and are drawn once, labelled "nothing moves."
   I checked the page source against the code and looked at one headless-Edge screenshot of the top
   of the page, which renders cleanly. **No human has read it on the iPad.**
2. **[x] The rule is written as the owner's ruling, with the editor's refusal as its first case.**
   It is in the phase file under WO-3.58 § "Rulings, the owner's, 2026-10-12, at dispatch", ruling 2,
   copied word for word from the brief. Ruling 1 records the scope. I added one labelled reading: the
   editor has no Save, so "Cancel/Save" is taken to mean its buttons row. I don't believe that widens
   the ruling, but the verifier should check it.
3. **[x] The build is booked as rows below L, and the drawing passes § 19.**
   - Four rows at the foot of `phase-3-gradebook.md` and as rows 168–171 of the running order. All
     are Size S, ⬜ NOT STARTED, depend on WO-3.58, name their dialogs, and have a Surface line
     pointing at the drawing.
   - `node tools/wo-sweep.mjs`: `51 checks · 48 passed · 0 failed · 3 to review`, exit 0. All § 19
     lines pass, and the 3 reviews are the standing ones. `node tools/wo-gate.mjs --audit`: PASS.
   - `node tools/verify-shell.mjs`, run to completion on the finished tree:
     `2044 checks · 2044 passed · 0 failed · 0 skipped`, 1079s, `EXIT=0`.

`TESTING.md` § WO-3.58 is written, under Phase 3, just before Phase 4. I did not write a
`CHANGELOG.md` entry. I did not change the status line, which stays 🤖 CLAIMED.

## The rows booked

| Row | Dialogs | What |
|---|---|---|
| WO-3.63 (S) | `assignmentModal` | The first case. The refusal and the amber term note go into one place, directly above Done. Has one 👤. |
| WO-3.64 (S) | `assignmentMoveModal`, `categoriesModal` | The move confirm's note (currently under its buttons) moves above them. `#categoryError` moves up beside the total, or is deleted. |
| WO-3.65 (S) | `gradesRecordModal` | The no-grade banner and the three empty-state sentences move above Print and CSV. What prints must not change. |
| WO-3.66 (S) | the Scores screen (not a dialog) | The nameless warning drawn on Scores. **Its placement is an Open line for the owner.** Has one 👤. |

I updated the dashboard by hand: Phase 3 `61 | 59` → `65 | 59`, total `270 | 259` → `274 | 259`,
95%, with a dated note in the style of the earlier ones. The files table now reads WO-3.1 … WO-3.66.

## Not ruled — awaiting the owner

- **The Scores-screen warning (WO-3.57 ruling 4).** I drew S1 (after the past-due prompt, before the
  summary row) and S2 (under the summary row, beside + New). The drawing leans S1. I wrote this up as
  a proposal, not a ruling, in the drawing, the phase file and WO-3.66.
- **WO-3.57 ruling 3 (a scrolled list's note off screen)** was also handed to this review, but the
  brief did not mention it and the owner's scope of ten dialogs does not reach it. I did not draw or
  rule it. It is Open line (c) on WO-3.66 so it does not get lost.

## Decisions the work order did not settle, and which way I went

- **What counts as a "message."** I treated a message as a sentence drawn only when something is
  true. Standing prose (leads, hints, field captions) is not one. Exception: the move confirm's
  static note sits under its buttons, the rule names "notes," so I moved it.
- **Order inside the editor's one place.** I put the refusal last, touching Done. This is Open on WO-3.63.
- **The accommodation prompt.** I read it as not a message and left it under the fields. This is
  Open on WO-3.63.
- **Copy-dialog per-line amber flags.** I left each one on its own line. Not booked.
- **The grading-mode warning.** It complies as written. If "one place" is read strictly as "directly
  above the buttons," it would move and its wording ("Every letter below goes") would become false.
  I left it. Not booked.
- **The Grade sheet's key and printed note.** I read them as part of the sheet, not messages, so they stay.
- **No `proposed*.css`.** Every proposal moves a shipped element, so there is no § 19 section. As a
  result § 19's back-pointer check cannot tie the four rows to the drawing; I wrote the Surface lines
  by hand.
- **Convention I set.** `mockup.css` gained `.mk-hit`, `.mk-hit-tag` and `.mk-elide`, magenta and
  hatched, which future dialog reviews can reuse.

## Finding

`#categoryError` has never been written to. `showCategoryError('')` is called five times, always
with an empty string, and has been since WO-3.1. I booked it as WO-3.64's Open line rather than
fixing it.

## Files changed

- `design/mockups/dialog-messages.html` (new)
- `design/mockups/mockup.css`
- `design/mockups/index.html`
- `design/mockups/README.md`
- `plans/work-orders/phase-3-gradebook.md`
- `plans/work-orders/README.md`
- `TESTING.md`
- `.claude/dispatch/WO-3.58-result.md`

## Not verified

- No human has read the drawing on the iPad.
- I did not run `--tick`.

## Draft CHANGELOG line (the teacher's call)

The dialogs behind Assignments and Scores were read together, and the owner ruled that a dialog's
messages draw above its buttons, in one place. Four small rows are booked to make it so, starting
with the editor's "needs a name."
