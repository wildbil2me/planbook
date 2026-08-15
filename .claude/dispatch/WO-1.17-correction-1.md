# WO-1.17 — correction 1

**Route** Claude (work-order-implementer), Opus — same tier as the original dispatch.
**Verdict being corrected** FAIL, one ❌.
**Original brief** `.claude/dispatch/WO-1.17-brief.md` · **Original result** `.claude/dispatch/WO-1.17-result.md`
**Report to** `.claude/dispatch/WO-1.17-result-correction.md`

The verifier's Acceptance list came back **five for five ✅**, with the two claims it refused to take
on trust reproduced independently: it reverted only `hasSomethingToLose()` in a scratchpad copy and
got the same `766 checks · 764 passed · 2 failed`, and it re-proved the § 14 reconciliation
non-vacuous with six of its own mutations including the exact pre-WO-1.17 state. The mechanism, the
fixtures, the scope calls and all five ticks stood.

**One thing failed, and it is the whole correction.** Quoted verbatim from the verdict:

> ## The ❌
>
> **`c:\dev\planbook\tools\README.md:1078`** — the paragraph about the sweep's own count now
> contradicts itself. This change updated the count at `:1047` (`**20 checks** after WO-1.17`) and at
> `:1081` (`` `20 checks` on this tree ``) but left the back-reference between them:
>
> ```
> **The 19 above is deliberately unguarded, and the asymmetry is the reason §11 was worth building for
> ```
>
> At HEAD all three read 19 and the paragraph was true; it is false now. The fix is one word. This is
> not a nit by this repository's standards — it is the exact drift class the paragraph is a lecture
> about ("a stale figure here is corrected for free by the next person to run the sweep"), it is the
> same class WO-1.18 was booked for, and it sits in the file Acceptance line 5 names as where the
> method is written down.

## What to do

Change the numeral at `tools/README.md:1078` so the sentence is true of the tree it ships on. Read
the whole paragraph before editing it — the sentence is an argument about *why this number is
deliberately unguarded*, and the number is its subject, so the surrounding prose has to still parse
as that argument afterward.

**Do not increment by arithmetic.** That instruction is in the same paragraph, eight lines below the
line you are fixing: *"when you add a check to the sweep, do not increment this number by arithmetic
— run it and copy the summary line."* Run `node tools/wo-sweep.mjs` and copy what it prints. A
correction that violates the rule stated in the paragraph it is correcting is worse than the defect.

## Bounds — this is a one-word fix, and the scope is the reason

- **Do not touch anything else in `tools/README.md`**, and do not re-word the paragraph beyond what
  the numeral requires.
- **Do not touch `src/backup.js`, `tools/wo-sweep.mjs`, `tools/verify-shell.mjs`, `sw.js`,
  `docs/data-model.md`, `TESTING.md`,** or the work order file. All of that verified clean. A diff
  that reaches any of them is a widening, and the shell cache does not need a second bump because no
  file in `SHELL` changes.
- **Do not fix WO-1.18's stale "637".** The verifier noted, separately from the ❌, that WO-1.18's
  own prose cites a call-site count of 637 when the tree is at 769, and that its Acceptance cites
  `tools/verify-shell.mjs:1860` for a comment that this run pushed to `:1869`. **Both are WO-1.18's,
  not yours.** They are being reported to the teacher as findings against that work order. Touching
  them here widens WO-1.17 and buries this fix in the diff meant to show it.

## Verification

`node tools/wo-sweep.mjs` — must stay `20 checks · 18 passed · 0 failed · 2 to review`, both REVIEWs
the standing pair.

You do **not** need to re-run `node tools/verify-shell.mjs` for a prose edit in `tools/README.md`,
and the verifier said so explicitly: *"the re-verification is a `grep`, not a three-minute browser
run, since nothing executable changes."* If you touched anything executable, you went out of bounds —
go back rather than running the harness to cover it.

## Report against

1. The numeral at `tools/README.md:1078` agrees with the sweep's own summary line, and the figure
   came from running it rather than from arithmetic — say which command you ran and what it printed.
2. The paragraph still reads as the argument it was, after the edit.
3. `git diff --stat` shows `tools/README.md` and nothing else newly touched, on top of the eight
   files already in the tree.
