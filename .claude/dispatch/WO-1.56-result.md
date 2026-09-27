# WO-1.56 — implementer's result

**Verdict I am claiming:** all four Acceptance lines met, with one caveat on line 3 (below). There
are no 👤 or 📆 lines. Both plants are reverted. `src/` is untouched, so no `CACHE` bump is owed.

## The fix

In `tools/verify/date-zero-key.mjs`, the span from WO-1.55's touch-off through the last check is
now the body of a `try`, and the touch-on is its `finally`. Neither toggle moved in the sequence a
normal run takes: the touch-off still comes after the clicks that open the editor, and the touch-on
still comes before the modal is closed. No check was added or removed. `git diff -w --cached` is 33
insertions and 3 deletions. The raw diff is 231/201 only because the span is indented one level
deeper.

**How the `finally` treats a throw of its own (a decision the brief asked me to make).** A
`typingThrew` flag starts `true` and is cleared at the end of the `try`.
- If the restoring `send` throws while the block is already throwing, the restore's error goes to a
  `console.log` line and the original error propagates. `runSection()` names the real cause.
- If the block finished and only the restore threw, the restore's error is thrown, because then it
  is the cause.

In both cases the section is still reported as thrown (WO-1.44). The planted run confirms it for the
first path: the FAIL line carried the planted message and `date-zero-key.mjs:265`.

## A premise of the booking is wrong

The work order says `date-clear.mjs` "sets its own viewport but not its own touch setting". **It
sets both**, at its line 72 (`setTouchEmulationEnabled { enabled: true, maxTouchPoints: 5 }`), before
it measures anything. So in today's run order the leftover fine pointer lives only from the recovery
reload to that line. The two planted runs differ in the probe and in **no check**. The defect is
real and the `finally` is the right fix, but its live cost in this order is nil. It would stop being
nil if `date-clear` moved or something were inserted between them.

## The reader: a temporary probe, reverted

This was a one-line `console.log` at the top of `date-clear.mjs`'s `run()`, before that section sets
anything. It printed `matchMedia('(pointer: coarse)').matches` and `navigator.maxTouchPoints` and
was marked `MUTATION WO-1.56`. I chose not to make it a permanent check, for two reasons. It would be
a precondition on a neighbour's leftovers, in a section whose run-order comment says it depends on
its neighbours "in neither direction". And no permanent check reaches the thrown path without a
plant.

## Runs (whole harness, real clock, Edge 154.0.4258.37, 2026-09-27; `EXIT=` read from each log's own line)

| Run | Tree | Summary | EXIT |
|---|---|---|---|
| Baseline | HEAD (before any edit) | `1550 checks · 1549 passed · 1 failed · 0 skipped`, 588s. The one failure is WO-7.12's drive-sync lapsed-sign-in flake | `EXIT=1` |
| Plant + `finally` | fix + `throw` after the canary + probe | `1546 checks · 1544 passed · 2 failed`. Section reported thrown "after 1 of its own checks"; probe **`{"coarse":true,"touchPoints":5}`**; second failure is the same flake | `EXIT=1` |
| Plant, restore removed | as above, restoring `send` commented out | `1546 checks · 1544 passed · 2 failed`; probe **`{"coarse":false,"touchPoints":0}`**; PASS/FAIL lines identical to the run above | `EXIT=1` |
| Final | fix only, after revert | **`1550 checks · 1550 passed · 0 failed · 0 skipped`**, 587s | `EXIT=0` |

Revert: I staged the real edit, ran `git checkout -- tools/verify/date-zero-key.mjs tools/verify/date-clear.mjs`,
and `cmp` against a copy saved before the plants showed the file identical. Then
`grep -rn "MUTATION WO-1.56\|WO156-PROBE" tools/ src/` returned nothing (exit 1). All of this
happened before any prose was written.

`node tools/wo-sweep.mjs`: `45 checks · 42 passed · 0 failed · 3 to review`, exit 0 (1539 call
sites, matching `tools/README.md:1226`). I ran it after the ticks too, with the same result.
`node tools/wo-gate.mjs --audit`: PASS, exit 0.

## Acceptance, line by line

- [x] **A throw between the toggles leaves the next section coarse; recorded; reverted first.** The
  plant+`finally` run above. It is recorded in `TESTING.md` § WO-1.56.
- [x] **Mutation-proved.** The restore-removed run above: coarse `false`, zero touch points.
- [x] **Whole harness green on the real clock, no check changes state. Caveat:** the final run is
  1550/1550 with `EXIT=0`. I diffed every PASS/FAIL/SKIP line (detail stripped) against the
  baseline. The names and order are the same, and **exactly one line differs**: the WO-7.12
  drive-sync flake, FAIL in the baseline and PASS in the final. It also failed on unmodified HEAD and
  in both plant runs, and it sits in a section this change does not reach. So I read it as the booked
  flake, not a state change caused here. If the verifier reads "no check changes state" literally,
  this is the one line that does.
- [x] **`TESTING.md` § WO-1.56 answers the second Deliverable.** Answer: **yes, several — 21 of the
  other 38 files.**
  - 18 have a temporary window restored by a plain later `send`: accommodation-prompts,
    calendar-drawn, classes-terms, concern-list, cooldown-quiet, drive-sign-in, drive-sync,
    glance-quiet, outreach, past-due, portrait-landscape, praise-column, register-opens-on-term,
    sync-button, templates, today-goes-to-term, ungraded-count and worker-takeover.
  - 3 turn touch on late, and that is the state they hand on: score-grid, grade-detail and
    grade-sheet.
  - 17 do not diverge.
  - Only two files have any `finally`, and neither restores emulation.
  - 9 of the 21 hand their leftover to a section that does not set its own touch state first. The
    rest are masked, or run last. I did not measure whether those 9 downstream sections' checks
    would actually flip. That part is a reading, not a run.
  - The viewport has the same shape. I noted it and did not audit it in full. None of the 39 files
    was edited.

## Files changed

- `c:\dev\planbook\tools\verify\date-zero-key.mjs`: `try`/`finally` around the toggle span, plus comments.
- `c:\dev\planbook\TESTING.md`: new § WO-1.56 at the foot of Phase 1.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: four Acceptance boxes ticked. I
  left the status as the orchestrator's `🤖 CLAIMED`.
- `c:\dev\planbook\.claude\dispatch\WO-1.56-result.md`: this file.

Not changed: `tools/README.md` (no `check(` added, so the count stands) and `date-clear.mjs`
(the probe was reverted, and the file is identical to HEAD).

## What I could not close / left undone

- **Proposed follow-up (the owner's to book):** `recoverPage()` should restore emulation after a
  throw. Since 29 of the 67 browser sections make no touch call and inherit whatever came before,
  the "known state" is probably *what the thrown section received*, which means wrapping `send` for
  `Emulation.*` at section start, rather than one fixed baseline. I did not build it.
- A throw between the toggles still skips the section's teardown, as before. The `c_wo147` fixture
  class stays in the document, and the prior class is not re-selected. No later check changed state
  because of it in either plant run. That is out of scope and in the same family as the follow-up.
- I did not touch the WO-7.12 flake.

## Output of `grep -rn MUTATION tools/ src/` (the last command before this file)

```
tools/README.md:1381:and `grep -rn MUTATION src/` was run after, not before, the revert.
tools/README.md:1387:`paintBlock()`, each marked `MUTATION`, each restored by copying the pre-mutation file back:
tools/README.md:1394:`git diff --stat src/` was empty after each restore, and `grep -rn MUTATION src/ tools/` read only
tools/README.md:1436:`grep -rn MUTATION` was run over the tree after the second revert, not before it.
tools/README.md:1475:change is about. Both plants carried a `MUTATION` comment, both were reverted with
tools/README.md:1476:`git checkout --` against a fully staged tree, and `grep -rn MUTATION tools/ src/` was read after.)*
tools/README.md:1934:immediately, and `grep -rn MUTATION` over the changed files was read after.
tools/README.md:1978:`grep -rn MUTATION` over both changed files reads nothing.
tools/README.md:2614:pre-WO-2.35 regexes could not see — `const WO235_MUTATION_KEYS = ['S']`, membership-tested below the
tools/verify/keys-legend-guards.mjs:71: * AND EVERY MUTATION IS ASSERTED TO HAVE APPLIED. A `replace()` whose needle has moved is a no-op:
tools/verify/keys-legend-guards.mjs:204:      broke ? 'THE MUTATION MATCHED NOTHING, so this case proved nothing rather than failing '
tools/verify/keys-legend-guards.mjs:251:      broke ? 'THE MUTATION MATCHED NOTHING, so this case proved nothing rather than failing '
tools/verify/keys-legend-guards.mjs:256:          + (gone ? '' : 'THE MUTATION LEFT `' + c.key + '` IN PLACE on one side or the other. ')
tools/verify/outreach.mjs:1572:      FLUSHED FIRST, AND THE MUTATION ROUND IS WHY. `rev` advances inside save(), which update()
tools/verify/score-grid.mjs:1674:          SHORTCUT — IT WAS THE FIRST DRAFT HERE AND THE MUTATION PROVED IT VACUOUS. `.scores-key` is
tools/wo-gate.mjs:2539:// the pen. What proves this precondition still bites is MUTATION — delete the fold here, watch it go
src/shell.js:937:  A CLASS MUTATION ADDED LATER ADDS ITS LINE HERE. The cost of forgetting is a home screen showing
```

All 17 lines are pre-existing prose, and the list is identical to the same grep run before any edit.
None is a live plant.

## Draft CHANGELOG line (the teacher's call)

> Harness: the date-field keystroke section now turns the coarse pointer back on even when it throws,
> so a crash there cannot quietly leave later sections measuring on the wrong device.
