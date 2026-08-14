# WO-2.28 — correction round 1

**Route** Codex (same implementer) · **Work order** `plans/work-orders/phase-2-attendance.md` § WO-2.28
**Original brief** `.claude/dispatch/WO-2.28-brief.md` — still in force, read it again.
**Report to** `.claude/dispatch/WO-2.28-result.md` — overwrite it with the corrected report.

Your source change is **right and is not in question.** `src/attendance.js` — the guard at 2982 now
wraps only the two DOM writes, the threshold comparison runs for every open pass, and the rewritten
comment block at 2898–2918 says the new reason rather than the old one. **Do not touch
`paintPassElapsed()` or that comment again.** Two things are wrong, and neither is the fix.

---

## 1. Your second harness check crashes the whole run

You could not execute the harness; the orchestrator ran it locally. **Your first new check passes:**

```
PASS | with a pass open, crossing a threshold still fires the alert while the teacher is on Scores
     — on a walk that left the registry  ::  Scores shown = true, registry shown = false,
       alerted = 1, announcement = "José Álvarez has been out on a bathroom pass for 5 minutes."
```

**Your second one aborts the process**, and everything after it in the file never runs:

```
Error: nothing to click for [data-pass-issue="undefined"][data-pass-type="nurse"] [0]
    at clickSel (file:///c:/dev/planbook/tools/verify-shell.mjs:280:19)
    at async file:///c:/dev/planbook/tools/verify-shell.mjs:10041:3
```

`alertStudent` is `undefined`. The cause is this line of yours:

```js
const alertClass = ids.filter((id) => id !== passClass)[0];
```

**That class has no students in it, on purpose,** and the harness already says so 60 lines above where
you were working — `tools/verify-shell.mjs:9272`–`9279`:

> *Any other class that has students on it — this run leaves one active class with an empty roster on
> purpose, and a check whose "next door" had no rows in it would assert nothing about a screen. Which
> one it lands on does not matter; that it has rows is asserted below.*

and it picks its neighbour by asking the document, not by index:

```js
const otherClass = await evalJs(`(function(){
  var d = window.planbook.store.getDoc();
  var c = d.classes.filter(function(x){ return !x.archived
    && x.id !== ${JSON.stringify(passClass)} && (x.roster || []).length > 0; })[0];
  return c ? c.id : ''; })()`);
```

**Fix your selection to use that established pattern** — either reuse the existing `otherClass` const
if it is still in scope where you are, or repeat its document query. Do not select a class by index.

**Two more things while you are in there, both of which that section models:**

- **Assert your fixture before you use it.** `9272`–`9279`'s companion check asserts the neighbour has
  rows precisely so an empty one fails loudly instead of throwing a selector error. Your walk should
  fail as a red `check()` with a readable message if `alertClass` or `alertStudent` comes back empty —
  never as a stack trace that takes the remaining ~9,500 lines of the file down with it. A fixture that
  cannot express its own failure is the thing `tools/README.md` warns about repeatedly.
- **Your restore path is untested and now suspect.** You cancel the second class's pass and return to
  `passClass` at the foot of the walk. The WO-2.9 checks that follow yours never executed, so nobody
  knows whether they still pass. **Leave the document exactly as you found it** — the same obligation
  WO-2.26's block carries — and say in your report what you restored and how you satisfied yourself
  it was complete.

**Acceptance line 2 also still owes its regression evidence.** Once the walk runs, put
`if (!node) return;` back at the top of the loop, confirm your two new checks go red, restore the fix,
and **state the red count in your report.** You could not do this before because the harness would not
start; the crash above is not what "it fails if the guard moves back" means.

---

## 2. `sw.js` — the CACHE bump. **This one is the orchestrator's fault, not yours.**

`node tools/wo-sweep.mjs` fails:

```
FAIL | every SHELL file change is paired with a CACHE bump  ::  src/attendance.js changed since
     planbook-shell-v57 was set at cea2583 — bump CACHE in sw.js, or an installed app keeps the
     shell it already has
```

My brief said *"Exactly two files should change"*, and you correctly obeyed it and flagged the
conflict rather than silently widening scope. **That instruction was wrong** and I am withdrawing it.
Bumping `CACHE` is a standing project rule — `sw.js:14`–`17` states it at the constant itself — and it
applies to every change to a file in `SHELL`. An installed PWA that does not get the bump keeps serving
the broken `paintPassElapsed()`, which would make this entire work order invisible to the one device it
was written for.

**Bump `sw.js:37` from `planbook-shell-v57` to `planbook-shell-v58`.** Nothing else in `sw.js`.

---

## 3. What is deliberately NOT yours this round

`tools/wo-sweep.mjs`'s other failure is the recorded `check()` count at `tools/README.md:783` — 750
recorded against 752 actual. **Leave `tools/README.md` alone.** That paragraph's convention is that
each work order records both the call-site count *and the number the run prints*, and the executed
figure has to come from a completed green run, which you cannot produce. The orchestrator will run the
harness once your fix lands and dispatch that line separately with real numbers. Do not guess it and do
not edit that file.

**So this round touches exactly two files: `tools/verify-shell.mjs` and `sw.js`.**

---

## Report against these

1. `alertClass` / `alertStudent` are selected by roster content, not by index, following
   `verify-shell.mjs:9272`–`9279`.
2. The walk fails as a red `check()` rather than a thrown selector error if its fixture is empty.
3. The document is restored at the foot of the walk, and you say what you restored.
4. `sw.js` CACHE reads `planbook-shell-v58`, and nothing else in that file moved.
5. `src/attendance.js` is byte-identical to what you already delivered.
6. `node tools/wo-sweep.mjs` — report the summary line. It should now show one remaining failure, the
   `tools/README.md` count, which is mine and not yours.

`node tools/verify-shell.mjs` will still not run in your sandbox. **Say so plainly again rather than
claiming a pass** — the orchestrator runs it. Report honestly rather than favorably.
