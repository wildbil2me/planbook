# WO-2.28 — correction round 3

**Route** Codex (same implementer) · **Work order** `plans/work-orders/phase-2-attendance.md` § WO-2.28
**Earlier** `.claude/dispatch/WO-2.28-brief.md`, `-correction-1.md`, `-correction-2.md` — all in force.
**Report to** `.claude/dispatch/WO-2.28-result.md` — overwrite it.

**Read this first: the feature is proven and the work order's property holds.** The harness ran
locally, and your own check printed the evidence:

```
matching elapsed nodes = 0, alerted = 1,
announcement = "José Álvarez has been out on a bathroom pass for 5 minutes."
```

Zero banner nodes, the alert fired, the sentence named the student. **That is Acceptance line 2
passing.** The check reported FAIL anyway, because two of the assertions around it are wrong. This
round fixes the assertions, and nothing else.

**Do not touch `src/attendance.js`, `sw.js`, or the work order.** Do not weaken or delete either
check to make it green — both are worth having; they are just written wrong in two specific places
named below.

Run: `752 checks · 750 passed · 2 failed · 248s`. Both failures are yours, and both are mechanical.

---

## Failure 1 — `verify-shell.mjs:10078`: the announcement compared against the wrong name format

Your predicate at line 10075 has one clause that is not printed in its own detail string, which is
why the failure reads as if every clause passed:

```js
&& missingNodeAlert.said === card0.name
  + ' has been out on a bathroom pass for 5 minutes.'
```

**`card0.name` can never produce that sentence.** It is read at `verify-shell.mjs:7614` off
`.attendance-pass-card-name`, which the banner renders **"Álvarez, José"** — last name first, the
card idiom. The announcement is built by `announce()` in `src/attendance.js` from `fullName(student)`,
which renders **"José Álvarez"**. The two formats are different by design, so this equality is false
on a correct build and would stay false forever.

**Fix it the way the check directly above it already does.** Your first check (line 10023, which
passes) asserts the sentence with a regex and does not try to reconstruct the name:

```js
&& /has been out on a bathroom pass for 5 minutes\./.test(scoresAlert.said)
```

Do that, **and keep a real assertion that it names the student** — that clause is in the acceptance
line and must not be dropped to make the check green. Resolve the name from the document rather than
from the card: read the student's `first`/`last` out of the roster and assert the sentence contains
both, or assert against `fullName()`'s own output if the harness can reach it. What you must not do is
compare against the card's label, and what you must not do is delete the name assertion.

Add a one-line comment at the clause saying the card renders "Last, First" and the sentence renders
"First Last", so the next person does not re-make this exact mistake.

---

## Failure 2 — `verify-shell.mjs:10106`: the live region is clobbered after you restore it

```
document content byte-identical apart from save stamps = true, open class = "c_b1",
registry shown = true, elapsed node restored = true, live region restored = false
```

Everything restored except the live region, and **the ordering is why.** At lines 10096–10097 you
write `beforeMissingNodeLive` back into `#srLive`. Then at line 10100 you click back to the registry:

```js
await clickSel('#scoresView [data-class-screen="class"]');
```

That paint calls `paintPassBanner()`, which **announces on its own** — the same announcement this
section already asserts elsewhere, *"N students are out of Period 3 — Biology on hall passes"*. So
your restore is overwritten by the navigation that follows it.

**Fix: restore the live region after the final navigation, not before it.** Move the `#srLive` write
out of the `evalJs` block at 10089–10099 and do it once the registry is back up and has finished
announcing.

**Second, smaller defect in the same check:** `await heard()` is evaluated twice — once in the
predicate at line 10111 and again in the detail string at line 10117. Two reads of a live region that
a running interval can rewrite between them means the message can disagree with the verdict. **Read it
once into a `const` before the `check()` call** and use that value in both places. Every other check in
this section reads its state once and asserts against the snapshot; follow that.

---

## What must still be true when you are done

- **Both checks assert the same things they assert now**, minus the two defects. The restore check
  keeps its document-byte-comparison, its `alerted == null` clause, its restored-node clause and its
  live-region clause.
- **The regression evidence, which is still outstanding and is now unblocked.** Put
  `if (!node) return;` back at the top of the `paintPassElapsed()` loop, run `node tools/wo-sweep.mjs`
  — no — run nothing you cannot run; instead **state clearly in your report that you still cannot
  execute the harness**, and the orchestrator will perform the guard-back mutation and report the red
  count. Do not leave a mutated `src/attendance.js` behind: whatever you do for your own reasoning,
  the delivered file must be byte-identical to what round 1 shipped.
- **`tools/README.md`'s call-site count stays correct.** If your edits change the number of `check()`
  call sites, re-run `node tools/wo-sweep.mjs` and update `tools/README.md:783` and your WO-2.28
  sentence to match. If the count does not move, leave it. The executed figure you wrote as 752 is
  what the run printed, so it is right — do not change it unless your edits add or remove a check.

## Report against these

1. `card0.name` is gone from the announcement assertion; the sentence is matched by pattern and the
   student is still asserted by name, resolved from the document.
2. The live-region restore happens after the final navigation, and `heard()` is read once.
3. `src/attendance.js` and `sw.js` byte-identical to their delivered state.
4. `node tools/wo-sweep.mjs` — report the summary line; it should stay green.
5. State plainly, again, that `verify-shell.mjs` cannot run in your sandbox.

Report honestly rather than favorably. Two rounds of this work order have been lost to assertions
written against a browser you cannot drive — if a clause is one you cannot reason about with
certainty from the source, **say which one** rather than guessing at it.
