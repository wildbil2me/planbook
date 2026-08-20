# WO-6.6 — correction 1

**Route** Claude (work-order-implementer), Opus — unchanged from the original dispatch.
**Original brief** `c:\dev\planbook\.claude\dispatch\WO-6.6-brief.md`
**Original result** `c:\dev\planbook\.claude\dispatch\WO-6.6-result.md`
**Report to** `c:\dev\planbook\.claude\dispatch\WO-6.6-result-correction.md`

The verifier read the tree cold and returned **FAIL** on exactly one line. Twelve of the thirteen
desk-checkable Acceptance lines passed on the verifier's own runs, the three 👤 lines are correctly
🙋, all four flagged risk areas came back clean, and the harness run reproduced at
**1040 checks · 1040 passed · 0 failed · 0 skipped**. **Do not rebuild anything.** This is a
one-line documentation correction and nothing else.

---

## The verifier's ❌, verbatim

> **`c:\dev\planbook\TESTING.md:7156` ticks a box whose claim a grep disproves.**
>
> ```
> - [x] `openClassId` is written in exactly one function — `src/classes.js`'s `selectClass()` — and
>       `grep` proves it: no `setPref('openClassId'` anywhere else in `src/`.
> ```
>
> The grep does not prove it. It contradicts the first half:
>
> ```
> $ grep -rn "setPref('openClassId'" src/
> src/classes.js:650:  setPref('openClassId', id);                                        ← selectClass()
> src/classes.js:975:  if (activeClasses(getDoc()).length === 1) setPref('openClassId', cls.id);  ← createClass()
> ```
>
> This is the WO-1.8 shape exactly: the same dispatch's own note in
> `plans/work-orders/phase-6-calendar-glance.md:656-665` says *"the honest answer to 'is it one
> function' is no"* and leaves the phase-file box open — and then forty lines away in the gate
> document the same criterion is restated as satisfied and ticked. `TESTING.md` is the gate
> (`CLAUDE.md` § Commands), so the false tick is in the document that closes the work order. Fix is
> one line: untick it, or reword it to the second clause only, which is true.

And from its Acceptance table, on line 7 — note that it agrees with you on the substance:

> ❌ **False as written, and it was false before this dispatch opened.** Two writers (above).
> `git show HEAD:src/classes.js` has both, at :629 and :954. `git log -S` puts the `createClass()`
> writer in **33bab80, 2026-08-04** — fifteen days earlier. WO-6.6 added no writer: `selectClass()`'s
> only change is `showView(currentView() === 'calendar' ? 'calendar' : 'class')`. **The implementer is
> right on both halves.** The line's second clause is ✅; its first clause the tree has never
> satisfied. This is an owner call on the criterion, not a defect in WO-6.6 — but it is a ❌ against
> the text, and the tick in `TESTING.md` is the offence, not the code.

## What to change, and what not to

**Change one thing.** `TESTING.md:7156` — the tick and the claim under it. Your own note at
`plans/work-orders/phase-6-calendar-glance.md:656-665` is **correct and stays exactly as it is**; the
gate document has to stop contradicting it. Either untick the box, or reword it to the clause that is
true — *no `setPref('openClassId'` outside `src/classes.js`, and WO-6.6 added no writer* — and point
at the phase-file note for the first clause and whose call it is. A `TESTING.md` line a teacher reads
and a grep disproves is worse than an open box, which is the whole reason this came back FAIL.

**Do not** touch `src/classes.js` to make the first clause true. Collapsing `createClass()`'s writer
into `selectClass()` is a change to how a teacher's first class becomes the open one, it predates
this work order by fifteen days, and it is outside WO-6.6's Deliverables. If you think it should
happen, it is a proposed follow-up work order in your report.

**Do not** re-run the full harness for this. `TESTING.md` is not in `SHELL` and carries no `check()`
call sites — nothing about a prose edit there can move the 1040 or the count sentence. Run
`node tools/wo-sweep.mjs` to confirm it is still green and leave `verify-shell.mjs` alone; say in your
report that you skipped it and why. If you believe a re-run is genuinely required, say so rather than
running it silently.

## Report

Report to `c:\dev\planbook\.claude\dispatch\WO-6.6-result-correction.md` and return it in-band. Short
is correct here: what the line says now, the sweep's output, and anything you chose not to do. The
verifier reads it again cold.
