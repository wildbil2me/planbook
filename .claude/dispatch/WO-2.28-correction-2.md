# WO-2.28 — correction round 2

**Route** Codex (same implementer) · **Work order** `plans/work-orders/phase-2-attendance.md` § WO-2.28
**Earlier** `.claude/dispatch/WO-2.28-brief.md`, `.claude/dispatch/WO-2.28-correction-1.md` — both still in force.
**Report to** `.claude/dispatch/WO-2.28-result.md` — overwrite it.

**Your round-1 work landed and the harness now completes: 752 checks, 751 passed, 248s.** `sw.js` is
at `planbook-shell-v58`, the fixture selection follows the roster query, and `src/attendance.js` is
correct. **Do not touch `src/attendance.js` or `sw.js` again.**

One check is red, and **it is not your bug — the work order was wrong.** The owner has re-cut
Acceptance line 2. This round implements the re-cut.

---

## 1. Why your check failed, so you do not rebuild it the same way

Your walk asserted the teacher was still on Scores after a class switch. The harness said:

```
FAILED: switching class while off the registry computes the newly-opened class's overdue alert
        without repainting the hidden banner
  open class = "c_5e6218132l", Scores shown = false, registry shown = true,
  hidden banner students = ["s_3i0w111t4i"], alerted = 1,
  announcement = "Bo Alpha has been out on a nurse pass for 5 minutes."
```

Everything about the alert was right. What was wrong is the premise: **you cannot switch class and
stay off the registry.** `selectClass()` at `src/classes.js:467`–`475`:

```js
export function selectClass(id) {
  if (!findClass(id)) return;
  setPref('openClassId', id);
  showView('class');      // ← unconditional
```

and `src/shell.js:39` documents `data-class-tab` as making a class open **and putting its working
surface in view**. Every class-tab route lands on the registry, which paints the banner. **Do not go
looking for another navigation route to rescue the old check** — the only one that exists is
`getSelectedClassId()`'s stale-id fallback (`src/classes.js:165`–`170`, archiving or deleting the open
class while on Scores), and the owner has deliberately chosen not to assert a rare route.

---

## 2. The re-cut line 2 — assert the property, not a journey

**Read the work order first.** Its Acceptance section and the paragraph above it were rewritten this
round and explain the decision. The new line:

> **The alert is computed from the document, not from the banner.** With no `[data-pass-elapsed]`
> node in the banner for the pass — the banner emptied, or holding another class's cards — a pass
> over a threshold still fires: `alerted` is written and the sentence names the student. Asserted
> without the registry being painted, and **it goes red if the guard moves back** above the DOM
> writes; state the red count.

**Replace your second check with one that asserts this.** The shape that proves the work order's own
title — *the pass tick reads the document, not the banner* — is:

1. A pass open in the open class, with the teacher **off the registry** (Scores, as in your first
   check, which works and which you should keep).
2. **Remove the pass's `[data-pass-elapsed]` node from the banner** — empty `#passBanner`'s cards, or
   strip that one node — so the document holds an open pass the banner has no card for. Assert that
   you actually achieved this (zero matching nodes) **before** the wind-back, the way this file
   asserts every fixture before using it. A check that silently failed to empty the banner would pass
   on the broken build and prove nothing.
3. `hush()`, then `windBack()` past a threshold, then poll.
4. Assert: `alerted` is written on the pass, the announcement names the student, the registry was
   never shown, and **the banner still holds no node for that pass** — the last one is what stops a
   stray repaint making it green.

This is strictly better than the old check because it does not care how the node came to be missing.
Say so in a comment at the check, in this file's idiom, and **name the reason the navigation version
was dropped** — that `selectClass()` always shows the registry — so nobody re-derives the dead end.

**Restore what you disturb.** Emptying the banner is a DOM edit; the checks after yours must see the
document and the screen as they expected them. Your round-1 restore worked — do the same here and say
what you restored.

**The regression evidence is required this time**, and the harness now runs so nothing blocks it:
put `if (!node) return;` back at the top of the loop, confirm the new check goes red, restore the
fix, and **state the red count in your report.** This is the one clause the line spells out.

---

## 3. `tools/README.md:783` — now yours, and it needs the run's own numbers

Round 1 held this back because the figure has to come from a completed run. **It exists now.** The
sweep says:

```
FAIL | the recorded `check()` call-site count matches the harness  ::  tools/verify-shell.mjs has
     754 `check()` call site(s), up 4 on the 750 recorded at tools/README.md:783
```

`tools/README.md:783` currently opens:

> **`verify-shell.mjs` holds 750 `check()` call sites**, and that is the number `tools/wo-sweep.mjs`
> asserts on every run — the sentence you are reading is the one it greps for, so rewording it turns
> the sweep red rather than turning the check off.

**Update the count, and append a WO-2.28 sentence to the running list at the end of that paragraph**,
in the same form as the entries already there (WO-3.12, WO-2.24, WO-3.7, WO-1.15, WO-3.9, WO-2.25).
Those entries state how many call sites moved, whether any sit in a loop or are failure arms that do
not fire on a green run, **and the number the run prints.** Read three of them before writing yours.

Two constraints, both of which that paragraph enforces on itself:

- **The call-site count is greppable — take it from `node tools/wo-sweep.mjs`, which you can run.**
  It will change again when you rewrite check 2, so run the sweep *after* your edit and use what it
  reports. Do not carry 754 forward if your rewrite moves it.
- **The executed count must come from a run, not arithmetic.** The last completed run printed
  `752 checks · 751 passed · 1 failed · 0 skipped` against 754 call sites — the gap is the fixture
  guards that do not fire on a green run. **You cannot run the harness**, so do not invent the new
  executed number: write the sentence with the call-site count you measured, and **state in your
  report what you believe the executed figure will be and why.** The orchestrator runs the harness
  and will confirm or correct that one figure. Say plainly in the sentence's wording nothing that you
  have not measured.

---

## 4. Files this round

`tools/verify-shell.mjs` and `tools/README.md`. Nothing else. `src/attendance.js`, `sw.js` and the
work order are already correct — **the work order was edited by the orchestrator this round, so read
it, but do not edit it.**

## Report against these

1. Check 2 asserts the missing-node property directly; the emptied banner is asserted before use.
2. The registry is never painted in that walk, and the banner still holds no node for the pass at the
   assertion.
3. The guard put back makes it red — **with the count stated**.
4. The document and the banner are restored; you say what you restored.
5. `tools/README.md:783` carries the measured call-site count and a WO-2.28 sentence in house form,
   with the executed figure flagged as needing the orchestrator's run.
6. `node tools/wo-sweep.mjs` — report the summary line. It should be fully green.

`node tools/verify-shell.mjs` still will not run in your sandbox. **Say so plainly rather than
claiming a pass.** Report honestly rather than favorably.
