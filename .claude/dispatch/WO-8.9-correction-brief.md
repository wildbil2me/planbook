# WO-8.9 — correction round 1

**Route** Codex (same implementer as the original dispatch)
**Original brief** `.claude/dispatch/WO-8.9-brief.md` — still authoritative for everything it says.
**Your previous report** `.claude/dispatch/WO-8.9-result.md`
**Report to** `.claude/dispatch/WO-8.9-result.md` — overwrite it with the corrected report, and
return it in-band too.

The verifier read your work cold and returned **FAIL** on one Acceptance line. Three of the four
lines verified clean and it broke your parser seven ways without fooling it — the check itself is
sound and is **not** what you are being asked to change. Do not rewrite `tools/wo-sweep.mjs`'s new
block. The defect is a false number in `tools/README.md`.

---

## The ❌, in the verifier's own words

> **3. The sweep is green on a clean tree, and its check count agrees with `tools/README.md` — ❌**
>
> The count clause holds: the sweep prints 19, and `tools/README.md` reads 19 in every place the
> number now appears — line 10 (table row), 1037, 1055, 1058. Nothing was left behind at 17.
>
> The defect is in the same edit, at **`tools/README.md:1058`**:
>
> > of every run — `19 checks · 15 passed · 0 failed · 4 to review` on this tree — in about a second
>
> This tree prints `19 checks · 16 passed · 1 failed · 2 to review`. The line Codex wrote is its
> **sandbox** tally, and the mechanism is exact: the sweep's two git-dependent checks
> (`tools/wo-sweep.mjs:311` and `:429`) set `gitAnswered = false` and degrade to REVIEW when git
> cannot answer. One PASS and one FAIL each became a REVIEW — 16/1/2 → 15/0/4, which is precisely
> the sandbox figure. So Codex's environment was structurally incapable of seeing the failing check,
> and it transcribed that blindness into the README as fact.
>
> It lands six lines below the instruction not to do it (`tools/README.md:1064`): *"do not increment
> this number by arithmetic — run it and copy the summary line"* — and inside the paragraph headed
> *"A cross-reference between the two harnesses is a claim, and it can be false."* The README's own
> § argues this number is safe to leave unguarded because any run corrects it; this is the
> counter-case, a number wrong on the day it was written. Fix: replace with the true line, or drop
> the pass/fail breakdown and keep only `19 checks`.

And on the tick you wrote:

> The tick on this line at `plans/work-orders/phase-8-packaging.md:634` is therefore unearned. Its
> cited evidence (`19 checks · 15 passed · 0 failed · 4 to review`, `WO-8.9-result.md:7`) is a figure
> no run of this tree produces. The other three ticks I checked the same way and all three are true.

---

## What to do

**1. Fix `tools/README.md:1058`.** Prefer the file's own rule six lines below it — run the sweep and
copy the summary line it actually prints. Note that the true line contains a **failing** check, which
is transient (see item 3), so the surrounding prose may need a word about that, or you may take the
verifier's alternative and keep only `19 checks` without the pass/fail breakdown. **Say which you
chose and why** in your report. Check whether the same false breakdown was written anywhere else in
the file; the verifier found the count itself correct at lines 10, 1037, 1055 and 1058, but only
audited `:1058` for the breakdown.

**2. Make the tick at `plans/work-orders/phase-8-packaging.md:634` honest.** Acceptance 3 has two
clauses. The *count* clause is true and you can evidence it. The *"green on a clean tree"* clause is
**not true of this tree today** — for a reason that is not yours (item 3). A tick you cannot point at
evidence for is worse than a blank box, and that rule is in your original brief. So either leave that
line `- [ ]` with a short annotation naming the pre-existing failure and the commit that owes it, or
find honest evidence for both clauses. Do not restate the sandbox figure as evidence for anything.

**3. Do not fix the pre-existing failure — it is not yours, and touching it would widen this work
order.** For your report, the verifier proved it out with a detached worktree at HEAD:

> Identical failure on a tree containing none of WO-8.9's changes. `src/scores.css` and
> `src/scores.js` last changed at **f63792f** ("Strike WO-3.13"), which lands *after* **cafc096** set
> `planbook-shell-v62`. The debt belongs to whoever owns f63792f; `sw.js` needs a `CACHE` bump before
> the next deploy.

Leave `sw.js` alone. Name the debt in your report; do not pay it.

**4. Run the sweep for real and quote the actual output.** Your sandbox cannot make git comparisons,
so two of its checks degrade to REVIEW and its summary line is systematically wrong. **Do not copy
your own sandbox summary into any file again.** If you cannot produce the true line in your
environment, write the report saying exactly that and leave `:1058` in a form that does not assert a
breakdown you could not observe — an unverifiable number is the whole defect being corrected here.

`node tools/verify-shell.mjs` will not start in your sandbox; that is known and expected. It was run
locally: **762 checks · 762 passed · 0 failed · 0 skipped, exit 0**. Do not attempt to work around it.

---

## Out of scope for this correction

The new check block in `tools/wo-sweep.mjs` (it passed seven adversarial fixtures — leave it) · the
file gate regex · `sw.js` and the CACHE bump · anything under `src/` · the two standing REVIEW lines.
Three files are already changed; this correction should touch at most two of them.
