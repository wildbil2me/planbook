# WO-3.4 — Grade engine · correction round 1

**Route** Claude Sonnet · **Work order** `plans/work-orders/phase-3-gradebook.md` § WO-3.4
**Original brief** `.claude/dispatch/WO-3.4-brief.md` — read it first; it still governs.
**Report to** `.claude/dispatch/WO-3.4-result.md`, replacing the reconstruction now in that file.

## What happened before you

WO-3.4 was routed to Codex, which built `src/grade-engine.js` and `docs/grade-math-cases.md`. The
orchestrator process then died mid-dispatch, so no implementer result was ever written and the
verifier ran late. **The arithmetic is good** — a cold verifier executed the shipped module against
all twelve worked cases and every one matched, the Traps line is satisfied, both 2026-08-09 owner
rulings are honored, and nothing was reimplemented that should have been consumed. **Do not rebuild
any of that.** Two narrow defects failed it, both outside the acceptance grid, and they are your
whole job.

You are not the implementer that produced this, which is a deliberate departure from the
same-implementer protocol: both fixes are mechanical, and this dispatch has already died once
mid-flight. The reasoning is recorded in `.claude/dispatch/WO-3.4-status.md`.

---

## Defect 1 — quoted verbatim from the verifier

> ### ❌ 1 — a second formatter for the weight total, and it visibly disagrees with the banner
>
> `C:\dev\planbook\src\grade-engine.js:95-96`
>
> ```js
>     return noGrade('weights-unbalanced',
>       'The category weights total ' + total + '%, so there is no grade yet.', total, []);
> ```
>
> Raw concatenation. `src/categories.js:179` exports `formatWeight()` and its comment
> (`categories.js:170-178`) says why in words: *"Two formatters would eventually disagree about
> 33.335, and the teacher would be looking at both numbers at once."* Seven call sites across
> `categories.js`, `classes.js` and `assignments.js` consume it. `grade-engine.js:96` is the only
> place in the repo that renders a weight total into a sentence without it.
>
> Measured, with weights 40.1 / 34.7 / 20 (`inputmode="decimal"` at `categories.js:320`, so a
> teacher can type these):
>
> ```
> categories.js:270 banner : "⚠ Weights total 94.8%, not 100% — 5.2% short"
> grade-engine.js:96 message: "The category weights total 94.80000000000001%, so there is no grade yet."
> ```
>
> Same total, same class, same screen. This is the exact IEEE-754 artifact `BALANCE_EPSILON` was
> written to keep off the teacher's screen (`categories.js:129-146`), leaking back through the front
> door. `src/letter-scale.js:31-33` names `categories.js`'s `formatWeight()` explicitly as sanctioned
> display formatting over "numbers that are not grades and do not choose a letter" — so this is not
> the no-rounding rule protecting the message; it is the convention being departed from with no
> comment naming a local rule that beats it. Fix is `formatWeight(total)` and the import.

**Your fix.** Import `formatWeight` from `./categories.js` alongside the three functions already
imported there, and use it for the total inside the message. **Do not write a second formatter**,
do not round anything else, and leave the numeric `weightTotal` field on the returned object raw —
it is a number for callers, not display text. The formatting belongs only in the message string.

---

## Defect 2 — quoted verbatim from the verifier

> ### ❌ 2 — a comment asserting harness coverage that does not exist
>
> `C:\dev\planbook\src\shell.js:1446-1448`
>
> > *"The browser verifier reads its answers through this seam so the worked cases exercise the
> > shipped module rather than a second copy of the arithmetic in the harness."*
>
> `tools/verify-shell.mjs` is **byte-identical to HEAD** (`git diff --stat HEAD --
> tools/verify-shell.mjs` is empty; last touched by `2958e14`, WO-2.17). It contains **zero** calls
> to `gradeEngine`, `weightedClassGrade`, `categoryResult` or `categoryPercentage` — the six
> `WO-3.4` hits in that file are all forward-looking comments left by WO-3.1/3.2/3.3. The seam was
> opened and nothing was plugged into it. `window.planbook.gradeEngine` currently exists for a
> reader that was never written, and the comment will tell the next implementer — WO-3.5 depends on
> this engine — that the arithmetic is covered when nothing runs it.

And the verifier's fixture finding, which is why this matters more than a stale comment:

> `verify-shell.mjs` never calls the grade engine. Its 522 green checks are **zero** evidence for
> any of the 12 lines above; every one of them rests on a prose document nothing executes, plus the
> run I did by hand today. `docs/grade-math-cases.md:3` calls itself "the grade engine's test suite"
> — a suite with no runner, which will drift silently the first time WO-3.5 or Phase 4 touches this
> module, and drift is undetectable because nothing compares the two.

**The owner's ruling: write the checks. Do not delete the claim.** The comment becomes true.

**Your fix.** Add a WO-3.4 section to `tools/verify-shell.mjs` that drives all twelve worked cases
from `docs/grade-math-cases.md` through `window.planbook.gradeEngine`, so the arithmetic is genuinely
covered before WO-3.5 builds on it.

Follow the pattern the two neighbouring sections already set for modules with no screen — the
categories block at ~line 3196 and the letter-grades block at ~line 3599. Read both before you
start. What they establish, and what you copy:

- **A seam guard first.** Both check `typeof window.planbook.<mod>.<fn> === 'function'` and `skip()`
  with a plain reason if it is absent — and WO-3.1's says the absence "is a defect and not a stage of
  the build". Yours should say the same; the seam exists now.
- **Read through the seam, never recompute.** WO-3.1's header is explicit: *"a check that summed the
  weights itself would go green against a build where the banner does its own arithmetic."* The same
  trap is yours in sharper form — **a check that computes `80 × 0.5 + 90 × 0.3 + 100 × 0.2` itself
  and compares to its own answer agrees with itself perfectly and proves nothing.** The expected
  values are the ones written in `docs/grade-math-cases.md`, and they are the literal numbers in your
  assertions.
- **A section header comment in the house voice**, saying what is driven, what is not, and why.
- **Use the existing `check(name, ok, detail)` and `skip(name, why)` helpers and `evalJs()`.** Do not
  add a new harness, a new runner, or a second reporting path.

**The document is the source of truth.** Expected values come from `docs/grade-math-cases.md`. If the
code and the document disagree, **the document wins** — unless the document is arithmetically wrong,
in which case **stop and report rather than editing the document to match the code.** That direction
is the whole point of a hand-computed suite.

Case 8 needs both directions in one check-pair (weights at 95 returning no grade with the reason
naming the total, then the same document corrected to 100 returning 87). Case 12 asserts
`reason === 'no-graded-work'` and a null percentage — not `0`, not `NaN`.

---

## Explicitly out of scope for this round

The verifier also found this, and the owner chose the narrower option:

> **every documented case uses exactly one class (`c1`), one term (`t1`) and one student (`s1`).**
> An engine that ignored `classId`, `termId` or `studentId` entirely would pass all twelve.

**Do not widen into multi-class, multi-term or multi-student fixtures.** The verifier tested those
three filters separately and confirmed they hold, so the risk is a deliverable that cannot express
the failure rather than a live defect. It becomes a proposed follow-up work order, which the
orchestrator will raise. Do not build it here.

Also unchanged from the original brief: **no UI** (the work order's Out of scope line), no second
`total === 100` comparison, no second rounding rule, no clamping, no extra-credit flag or field, and
no rename of `isProvisional()` — that correction is owed elsewhere and is not yours.

The verifier noted one more thing that is **not** a defect and **not** yours to fix: if the only
graded work sits in a weight-`0` category, the engine says "There is no graded work yet", which is
factually off though the numeric answer is right. No acceptance line covers it. Leave it.

---

## Before you report

Run both, and paste the real summary lines:

```
node tools/verify-shell.mjs
node tools/wo-sweep.mjs
```

`verify-shell.mjs` runs in this environment — it took 163s and returned 522 checks, 522 passed, 0
skipped before your change. Your section should raise the check count. **A skip is not a pass**; if
your section skips, say so and treat it as unfinished work.

You may tick the Acceptance boxes in `plans/work-orders/phase-3-gradebook.md` that your harness
section now genuinely covers — a tick must point at a check that ran. **Do not touch `CHANGELOG.md`**
(the owner words it) and **do not commit anything**. Leave the work order Status line at
`🤖 CLAIMED — 2026-08-10`; the orchestrator closes it after the verifier re-reads.

Report against the twelve Acceptance lines one by one, and say plainly what you changed in each of
the three files you touch.
