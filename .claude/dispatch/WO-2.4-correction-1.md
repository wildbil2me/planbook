# WO-2.4 — correction round 1

**Route** Codex (same implementer as the original dispatch)
**Original brief** `.claude/dispatch/WO-2.4-brief.md` — still governs. Re-read it.
**Your previous report** `.claude/dispatch/WO-2.4-result.md`
**Report to** `.claude/dispatch/WO-2.4-result.md` — overwrite it with the corrected report.

A separate verifier read your work cold against the six Acceptance lines and returned **FAIL**. Its
opening line: *"Two defects. Neither is in the arithmetic — that part is correct and I proved it
independently."* Take that seriously in both directions. **Do not re-derive the counting logic.**
All four inlined constraints from the original brief were honored, the retroactive-snow-day
precedence is correct, and Acceptance lines 2, 4 and 5 verified ✅ by live measurement. Fix exactly
the two things below and nothing else.

**One fact that changes your working assumptions:** you reported that browser verification could not
launch (Edge and Chrome, access-denied before CDP). **That was a sandbox artifact, not a machine
fact.** The verifier ran `node tools/verify-shell.mjs` and got *395 checks · 394 passed · 1 FAILED ·
0 skipped*, 138s, exit 1. The browser works. Your six fixtures now have real results, and one is red.
If it will not launch for you again, say so explicitly rather than reporting the fixtures as
untested — but the harness itself is known-good.

---

## ❌ Defect 1 — the fixture for Acceptance line 3 is unsatisfiable by construction

Verbatim from the verifier:

> `c:\dev\planbook\tools\verify-shell.mjs:9124-9132` — three checks assert against **one**
> `result.excused` object, and the first two contradict each other:
>
> ```js
> check('one excused absence in ten recorded meetings is 100%, with E in the numerator',
>   result.excused.E === 1 && result.excused.P === 9 && result.excused.percent === 100, …);
> check('U folds into A in totals and the denominator, …',
>   result.excused.A === 1 && result.excused.meetings === 11
>     && Math.abs(result.excused.percent - (10 / 11 * 100)) < 0.000001, …);
> ```
>
> The fixture pushes a `U` record at `2026-10-05` (line 9107), making it **11** meetings with one
> `A`. `percent === 100` and `percent === 10/11*100` cannot both hold. Check 1 can never pass on any
> correct implementation. Printed result:
> `{"P":9,"T":0,"A":1,"E":1,"D":0,"meetings":11,"attended":10,"percent":90.909…}`.
>
> So the app is right and the harness is red. The brief required both tools green before reporting;
> `verify-shell.mjs` now exits 1, and every future run of it fails until this fixture is split into a
> clean 10-meeting case and a separate U case.

**The fix is the last sentence: split the fixture into two independent cases** — a clean 10-meeting
case with one `E` and no `U` (which must show `percent === 100`, and *is* Acceptance line 3), and a
separate 11-meeting case carrying the `U` (which must show `A === 1`, `meetings === 11`,
`percent === 10/11*100`). Two documents or two result keys; not two assertions over one object.

**Do not fix this by loosening an assertion or by changing the app to match the fixture.** The app is
correct. A check that always fails and a check that cannot fail are the same defect wearing different
signs — see `plans/dispatch-retro.md` on gates that cannot pass.

## ❌ Defect 2 — an undated term is silently the whole year, and still wears the term's label

Verbatim from the verifier:

> `src/classes.js:216-221` states plainly that terms ship with `start: ''`, `end: ''` and that **this
> is a valid term** — a teacher setting up in August has not been given the calendar yet. That is the
> default state of every class right now.
>
> `src/attendance.js` `attendanceTotals()` treats an empty bound as *no* bound
> (`(!from || r.date >= from)`), so `termTotals()` with a blank term returns the year. Rendered, that
> is:
>
> ```
> #attendanceTotals   →  "Quarter 1: 10 recorded meetings · Year: 10 recorded meetings"
> per-student line    →  "Quarter 1 · P 9 · T 0 · A 0 · E 1 · D 0 · 100%"
> ```
>
> Both figures measured live in a browser. The same number twice under two labels, and the
> "Quarter 1" figure is the year. This defeats the deliverable's *"per term and per year"* and it
> lands on **Why it exists**: Roll Call!'s quarters are bounded — each is its own sheet tab — so a
> Planbook "Quarter 1" that spans the year cannot agree with Roll Call!'s Quarter 1. Term windowing
> itself works once dates are present (`start='2026-09-01', end='2026-09-14'` → 5 meetings, not 10),
> so the fix is a display/guard question, not an arithmetic one.

**Note what is and is not broken.** `attendanceTotals()`'s date filtering is correct and windowing
works when dates exist — do not rewrite it. An undated term is a *valid* state per `src/classes.js`,
so this is not an input to reject. The defect is that the UI presents an unbounded figure under a
bounded label, which is a claim the app cannot support.

**Fix it at the display layer**, and let the surface say what it actually knows. A blank-dated term's
figure is the year's figure; the screen should not call it "Quarter 1". Honest options, your call —
suppress the term figure and show only the year, or label it so the teacher can see the term has no
dates yet and knows to set them. Whatever you choose, hold to the same standard Acceptance line 5
already sets for zero meetings: *an honest empty state, not `NaN` or `0%`*. The same principle
applies here — an honest "this term has no dates" beats a confident wrong number. Match existing
copy voice in `src/attendance.js`; do not invent a new visual component.

---

## Also worth fixing, and cheap — not a defect, but named by the verifier

> `:3105-3111` inlines a third copy of the filter chain rather than calling a helper — not a
> violation, but it is the copy that will drift.

Three copies of the meeting-filter chain now exist (`attendance.js:1135`, `:1152`, `:3109`). Collapse
them to one helper if you can do it without touching behavior the verifier already measured green.
If that is not clean, leave it and say so — a drifting copy is worth a comment at minimum.

## What the verifier found absent from your fixtures, and asks you to close

Its own words on what a bug would need in order to hide:

> - The WO-2.4 block **never renders anything**. It calls `attendanceTotals()` directly and asserts
>   on the return value, so the entire "counts visible per class and per student" deliverable is
>   unmeasured — and Defect 2 is invisible to it. It only surfaced when I drove the DOM.
> - It **never passes a term**, so `termTotals()` is never exercised at all. Every assertion is
>   year-scope.
> - It **never tests a roster student absent from `marks`** — the exact bug the brief calls out as
>   one "no test you write will notice."

Add coverage for all three: a check that reads the **rendered DOM** for the per-class and per-student
count surfaces (this is the deliverable "counts visible per class and per student", and it is
currently unmeasured), a check that passes an actual dated term to `termTotals()`, and a check for a
roster student with no entry in `marks` at all — which must read `P 10 · 100%`, not zero. Extend
`tools/verify-shell.mjs`; **do not write a second harness.**

---

## Before you report

```
node tools/verify-shell.mjs      # must exit 0 — it currently exits 1
node tools/wo-sweep.mjs
```

Both green. `verify-shell.mjs` exiting 1 is Defect 1 and is the thing to confirm you have cleared.

Report against the two defects one by one, plus what you did about the filter-chain copies and the
three missing fixtures. **Acceptance lines 1 and 6 remain the owner's** (hand count against a real
class, cross-check against Roll Call!) — do not claim them. Lines 2, 4 and 5 the verifier already
measured ✅; line 3 the app already satisfies and only its fixture is broken. Stay inside the
original **Out of scope** line: no signals, no thresholds, no history view.
