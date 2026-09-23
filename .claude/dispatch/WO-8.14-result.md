# WO-8.14 — the three doc links in About are measured by nothing · implementer result

**Route** Claude, Opus tier · **Date** 2026-09-22 · **Status on the row** left at `🤖 CLAIMED`
(the orchestrator's `--handoff` moves it; `AGENTS.md` § "The verifier is a fresh session").

---

## What changed, by absolute path

| File | What |
|---|---|
| `c:\dev\planbook\tools\verify\touch-targets.mjs` | **+53 lines, one new `check()`**, inside the existing About-modal block (the one that clicks `[data-modal-open]`), immediately after the `mm` sweep's check. Reads `.modal-overlay:not(.hidden) .doc-link`, records each row's text, `href` and measured box, asserts `dl.length > 0 && dlUnder.length === 0`, and names all three rows in the evidence. A `skip()` arm mirrors the sweep above it for the "no modal opened" case. |
| `c:\dev\planbook\tools\README.md` | **+32/−10.** (1) the greppable call-site sentence `1450` → **`1451`**; (2) a new ledger paragraph after WO-8.4's, recording sites, executed count, the measurement, the mutation and the revert; (3) **one repair my own change forced** — see *"The one thing I changed that is not in the Deliverables"* below. |
| `c:\dev\planbook\TESTING.md` | **+70 lines**, a `### WO-8.14` section at the foot of `## Phase 8`, after WO-8.13's. Five Acceptance items with evidence, plus what the desk cannot pay off. |
| `c:\dev\planbook\plans\work-orders\phase-8-packaging.md` | **Five Acceptance boxes ticked** (`- [ ]` → `- [x]`). Nothing else in the section touched. |

**`c:\dev\planbook\src\shell.css` is byte-identical to `HEAD`** — it was mutated for one run and
restored; `git diff src/shell.css` is empty. No `src/` file moved, so **`sw.js` `CACHE` was not
bumped and must not be**: nothing in `SHELL` changed. No `CHANGELOG.md` entry written (the
teacher's).

---

## The evidence line, verbatim from the run

```
PASS | every .doc-link row in the open About modal measures >=44px on a coarse pointer — the policy,
the administrators' guide and the licence, each named here rather than counted in aggregate
  :: measured 3: "Privacy policy →" (./privacy.html) 440x44;
     "Planbook and student-data privacy — the guide for administrators →"
       (https://github.com/wildbil2me/planbook/blob/main/docs/FERPA.md) 440x44;
     "Released under the Apache License 2.0 →"
       (https://github.com/wildbil2me/planbook/blob/main/LICENSE.md) 440x44;
     under 44 = []
```

All three rows named individually, each with its own href and its own measured box. The aggregate
`measured 3` is there only as a guard against a vacuous pass, not as a substitute for the three.

---

## The mutation round — run, not reasoned

**Before (delivered tree):** `1462 checks · 1462 passed · 0 failed · 0 skipped`, exit 0.

**Mutation applied** to `c:\dev\planbook\src\shell.css`, in the `(pointer: coarse)` block, marked
`MUTATION WO-8.14` in a comment:

```css
/* before */ .modal-body .doc-link { min-height: 44px; display: flex; align-items: center; }
/* after  */ .modal-body .doc-link { display: flex; align-items: center; }
```

**After (mutated tree, full run):** `1462 checks · 1461 passed · 1 failed · 0 skipped`, exit 1.
**Exactly one red, and it is the new check.** Its evidence:

```
measured 3: "Privacy policy →" (./privacy.html) 440x33;
            "…the guide for administrators →" (…/docs/FERPA.md) 440x33;
            "Released under the Apache License 2.0 →" (…/LICENSE.md) 440x33;
under 44 = [ all three rows, repeated with their hrefs ]
```

`440x33` is the rows' natural line box with the floor taken away — the same three rows, 11px short
of a thumb, on a screen that had been green about them for thirteen months of build history.

**Reverted before anything else was written.** The declaration was written back by exact string
replacement (no `git checkout` — trap 2 in the brief). Confirmations, both read after the revert:

- `git diff src/shell.css` → **empty**.
- `grep -rn MUTATION src/shell.css tools/verify/touch-targets.mjs` → **no match, exit 1**. Nothing
  I touched carries the word. (`grep -rn MUTATION` over the wider tree returns only pre-existing
  prose in `tools/README.md` and `TESTING.md` describing *earlier* work orders' mutation rounds.)

---

## Harness and sweep totals

**`node tools/verify-shell.mjs`** — run **three times**, all to completion, all read from their own
logs, none predicted:

| Run | Tree | Result |
|---|---|---|
| 1 | delivered (new check in, stylesheet intact) | `1462 checks · 1462 passed · 0 failed · 0 skipped`, 46,234 lines, 31.6 lines per check, **527s**, exit 0 |
| 2 | mutated | `1462 checks · 1461 passed · 1 failed · 0 skipped`, 46,234 lines, **525s**, exit 1 |
| 3 | restored (final) | `1462 checks · 1462 passed · 0 failed · 0 skipped`, 46,234 lines, 31.6 lines per check, **524s**, exit 0 |

Executed checks **1461 → 1462**, one site, one result; the −11 gap between call sites and results is
unchanged. The figures written into `tools/README.md` and `TESTING.md` are run 1's (527s); runs 1
and 3 are identical in every number but the seconds, and the tree they measured is the same tree —
the docs edited between them are files no harness section reads (grep-checked: only prose mentions
of `TESTING.md` exist in `tools/verify/*.mjs`, no `readFileSync` of either document).

**`node tools/wo-sweep.mjs`** — final: `42 checks · 39 passed · 0 failed · 3 to review`, exit 0.
§ 11 reads **`1451 check() call site(s) across 71 harness file(s), matching tools/README.md:1213`**.
The three REVIEWs are the standing pre-existing ones (sensitive field names outside `src/backup.js`,
due-date-beside-late/missing, the mockup banner disagreement) — unchanged by this work order, and
the same three the sweep printed before I touched anything.

**The count I recorded in `tools/README.md`: 1451 call sites** (taken from the sweep's own printed
count, never by arithmetic) **and 1462 executed** (taken from the harness run).
*(First sweep run, before the README edit, failed exactly as designed: "the harness has 1451 …, up 1
on the 1450 recorded at tools/README.md:1213". That is the fence working.)*

---

## Acceptance, line by line

- [x] **1 — every `.doc-link` measured ≥44px under an emulated coarse pointer, all three named.**
      Evidence line above, from runs 1 and 3. The pointer is genuinely coarse: the section's first
      check asserts `matchMedia('(pointer: coarse)')` and gates everything below it, and it was
      `PASS` in both runs. **Verified by run, not by reading.**
- [x] **2 — red when the declaration is deleted.** Run 2 above: one red, all three rows at `440x33`,
      exit 1, restored immediately. **Verified by run.**
- [x] **3 — both tools green, sweep's recorded count matching.** Run 3 and the final sweep above.
      **Verified by run.**
- [x] **4 — `tools/README.md`'s count matches the run.** `tools/README.md:1213` reads 1451 and the
      sweep asserts it against the tree on every run; the ledger paragraph beside it records 1462
      executed from the harness. **Verified by run.**
- [x] **5 — the `TESTING.md` line links back rather than restating.** The new section's second
      paragraph points at § WO-8.13's Acceptance 3 and at the same line in
      `plans/work-orders/phase-8-packaging.md`, says "read it there", and carries forward only the
      one sentence worth repeating (*a work order's own reasoning is not a fence*). The story is
      told in neither place twice. **Verified by reading both documents; a judgement line, so the
      verifier should read it as one.**

**No 👤 line and no 📆 line in this work order**, which is the point of it — the thing being closed
is a measurement a headless browser makes better than a thumb. Nothing here is owed to the iPad.

---

## Decisions the work order did not settle, and which way I went

**1. One new `check()` rather than three more elements in the existing sweep's selector.** The
Deliverables say "widened to reach anchors" and the Traps say "widen the existing sweep; do not
write a second one". Those pull slightly apart in one place: folding `.doc-link` into the `mm`
selector is the most literal widening, but the `mm` check's evidence names **only what failed**, and
Acceptance line 1 demands all three rows **named individually**. I went with one new `check()`
**inside the same block, on the same open, with no second `evalJs` apparatus and no second
section** — the sweep reaches anchors now; it does so through one more assertion rather than through
a wider selector on the existing one. Reasons written into the comment at the point of departure:
(a) the `mm` check splits its set three ways around controls that come and go with state
(Connect/Disconnect), which no `.doc-link` does; (b) Acceptance 1's naming requirement; and (c)
doing **both** — widening `mm` *and* adding the named check — would be the second-opinion defect the
Traps name, so I deliberately did not. Note also that it changes the call-site count, which is what
"`tools/README.md`'s check count updated to whatever the run emits" anticipates; a pure selector
widening would have left the count at 1450 and had nothing to update.

**2. It counts nothing and asserts no href.** `verify/build-line.mjs` already asks whether the rows
are exactly three, at three hrefs, in document order, with `target` and `rel`. Re-asking here would
be the same second opinion. The only structural guard in the new check is `dl.length > 0`, against
measuring an empty set. Consequence, stated rather than hidden: if two of the three rows were
deleted, **this** check would stay green on the survivor and `build-line.mjs` would go red. That is
the division of labour on purpose, and it is written into both the code comment and `TESTING.md`.

**3. Scope of the selector.** `.modal-overlay:not(.hidden) .doc-link` — the open overlay's shape,
matching the sweep it sits in, not every `<a>` in every modal (Traps) and not `#aboutModal` by id
(the block has just opened About and nothing else is on screen). No `.doc-link` exists outside the
About modal in `index.html`.

---

## The one thing I changed that is not in the Deliverables

`tools/README.md` carried, in the call-site allowlist paragraph: *"the one `else check(` in the
harness — **grep it, there is exactly one** — is why the pattern is not line-anchored."* **My new
check is the second `else check(`**, so that sentence — one that explicitly invites a reader to
verify it by grep — was false the moment I wrote the check. I repaired it in place (now: two, both
in `verify/touch-targets.mjs`'s About block, with an italic note saying what changed and when),
because leaving behind a false sentence that my own edit created, in the very file the Deliverables
told me to update, is the exact failure this work order exists to record. It changes no behaviour:
`wo-sweep.mjs` § 11's pattern is unanchored and counted both sites correctly before and after.
**Flagging it explicitly** so the verifier does not read it as scope creep — it is in a file already
in scope, and it is a consequence of the change rather than an improvement to something else.

## Temptations declined, as proposed follow-ups

1. **`TESTING.md` § WO-8.13's 👤 reading now carries a clause that is going stale.** The owner's
   2026-09-21 hardware reading ends: *"All three doc rows read comfortably thumb-sized — **which is
   the only check on that anywhere in this project** — see Acceptance 3 above and WO-8.14."* After
   this landing it is no longer the only check. I did **not** edit it: it is a dated reading by the
   owner, and Acceptance line 5 says WO-8.13's entry *already* carries the correction and asks this
   work order to link back rather than rework it. Worth a one-clause amendment by whoever lands
   this, or worth leaving as a timestamped record — the owner's call, not mine.
2. **`wo-sweep.mjs` has no grep asserting `.modal-body .doc-link`'s coarse declaration exists.** The
   Traps rule that a grep "belongs in `wo-sweep.mjs` if anywhere" and that the missing thing was the
   *measurement*. The measurement is what landed. A § claiming the declaration by grep would be a
   second asker of a question now answered by a measurement, so I think it should **not** be added;
   noting it only because "if anywhere" leaves the door ajar.
3. **The other modal sweeps in this file still select `button, input`** (a few add
   `select, textarea`). No other modal in the app holds an anchor that is a control today, so
   widening them would have been speculative and the Traps refuse "every `<a>` in every modal". If a
   future modal gains a link-as-control, it needs its own line in its own sweep — and the comment I
   added says where the pattern is.

## What I could not close

Nothing in the Acceptance list. Two honest limits on what the green means, both written into
`TESTING.md` as well:

- The measurement is taken at the harness's emulated **1024×768, deviceScaleFactor 2, mobile
  metrics**, which is what makes `(pointer: coarse)` true. It proves the rule engages and the rows
  clear it there. A real iPad in portrait is narrower; what changes with width on these rows is the
  wrap, which can only make them taller — reasoned, not measured, and said so.
- The check measures what is **drawn**. A `.doc-link` that was `display: none` at the moment the
  modal opens would leave this set the way a hidden button leaves the sweep above it. There has
  never been one; the sweep above names its hidden controls out loud and this one has had none to
  name.

## Draft CHANGELOG entry — for the teacher to accept, reword or drop

> **Verification** — The three document links in About (privacy policy, administrators' guide,
> licence) are now measured on every harness run, at 44px under a coarse pointer. They had never
> been measured by anything: every modal sweep looked for buttons and inputs, and a document link is
> neither. Deleting the one line of CSS that made them thumb-sized used to leave the whole run
> green; it now turns it red and names all three rows.
