# WO-5.16 — result (implementer, 2026-09-26)

## What changed
- `src/shell.js` `afterRestore()`: deleted the second `outreachView.resetOutreach()` and the comment
  above it. The two comments are merged into one, above `resetTemplates()`, keeping both halves: an
  open draft is dropped and its modal closed, and a draft is about a student in the document that has
  just been put away. I added one sentence naming the Trap's reason for the order ("Both run before
  afterClassChange() so the screen repaints with nothing stale behind it"). No call moved;
  `afterDownload()` and its comment block are untouched; the two other `resetTemplates()` sites are
  untouched.
- `sw.js`: `CACHE` `planbook-shell-v136` to `planbook-shell-v137`.
- `plans/work-orders/phase-5-outreach.md`: both Acceptance boxes ticked, with the evidence inline.
  The status is still `🤖 CLAIMED` because the orchestrator owns status.
- `TESTING.md`: a short § WO-5.16 at the end of Phase 5, recording the harness run.

`git diff --stat`: TESTING.md +11, phase-5-outreach.md +9/-5, src/shell.js +3/-4, sw.js +1/-1. All
four files were LF before the edits and the diff shows no line-ending churn.

## Acceptance, line by line
1. **[x] `afterRestore()` contains exactly one `resetOutreach()` call, and no comment in it describes
   a second one.** I extracted the function body with `sed -n '/^function afterRestore/,/^}/p'
   src/shell.js`, and `grep -c "resetOutreach()"` on it prints `1`. I read the merged comment
   directly, and it describes one draft reset.
2. **[x] The whole browser harness is green, including the restore and WO-7.7's download checks.**
   I ran `node tools/verify-shell.mjs` on the real clock and waited for it to exit. It printed
   `1538 checks · 1538 passed · 0 failed · 0 skipped`, `48,369 lines · 31.4 lines per check · 574s`,
   and `EXIT=0`. Every check in § "backup & restore" passed, including "accepting the confirm
   restores the file byte-for-byte". The four WO-7.7 checks passed too: the header-button download
   redraws, upload, in-sync and failure do not redraw, About's Sync redraws, and in-sync from About
   does not redraw.

`node tools/wo-sweep.mjs`: `45 checks · 42 passed · 0 failed · 3 to review`. Those are the three
standing REVIEWs, and none of them is about these files.

The only `MUTATION` hit in `src/shell.js` or `sw.js` is at shell.js:936, which is existing prose
("A CLASS MUTATION ADDED LATER…"). I did not run a mutation round.

## Not verified / notes
- No 👤 or 📆 lines on this work order.
- **Coverage gap (proposed follow-up, not built):** nothing in `tools/verify/` checks that a restore
  closes an open outreach draft. `grep -rn "resetOutreach" tools/` finds nothing. So the green run
  shows the deletion broke nothing, but it would stay green if the remaining call were deleted too.
  A check that opens a draft, restores, and asserts the outreach modal is closed would cover it. I
  left it out because the work order asks for a one-line deletion and does not ask for one.
- **Decision:** the merged comment carries one extra sentence stating why the chain order matters,
  taken from the Trap. It is documentation of the existing order and changes no behaviour.

## Changelog draft (the teacher's call)
- Housekeeping: a restore (and a Drive download, which runs the same chain) now closes an open
  outreach draft once rather than twice. No visible change.

## Files
- c:\dev\planbook\src\shell.js
- c:\dev\planbook\sw.js
- c:\dev\planbook\plans\work-orders\phase-5-outreach.md
- c:\dev\planbook\TESTING.md
