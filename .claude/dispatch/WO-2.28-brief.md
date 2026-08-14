# WO-2.28 — the pass tick reads the document, not the banner · implementation brief

**Route** Codex
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.28-result.md` — as your last act, and return it in-band too.

**Routing decision.** This routed to **Codex** because there is no judgment left in it: the work order
was re-cut on 2026-08-14 specifically to move the design question out to WO-2.29, leaving a four-line
guard relocation named down to the line (`src/attendance.js:2982`), a reference implementation cited by
line number, no UI, no sensitive surface, and acceptance that is four `verify-shell` assertions. The
`codex-invoke.mjs --probe` passed (exit 0, `SMOKE OK`) immediately before this brief was written. The
runner-up consideration set aside: the 20-line decision-record comment at `src/attendance.js:2899` is
house-voice prose whose accuracy is load-bearing — the exact debt WO-2.27 existed to pay — and that is
the one part of this work order that argued for Claude. **Treat Acceptance line 4 as the hard one, not
the easy one.**

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.28 — the pass tick reads the document, not the banner

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-14 · **Size** S · **Depends on** WO-2.9, WO-2.27

**Booked 2026-08-14 out of WO-2.27's verification, and re-cut the same day once the reference
implementation was read.** It was written as the decision WO-2.27 could not take — *how far should
the overdue alert follow the teacher off the registry?* — carrying a bug and a design question in one
brief. **The design question turned out to be answered already, in Roll Call!, and it is now WO-2.29.**
What is left here is the bug, and it should not wait behind a decision: WO-2.9's overdue alert stops
firing for **both** classes when the teacher switches class while standing anywhere but the registry.

**The bug, and it is one line.** `paintPassElapsed()` (`src/attendance.js:2956`) iterates the open
passes of `openClass()` and then, per pass, does `if (!node) return;` (`src/attendance.js:2982`) when
the banner holds no card for it. That guard was written for the empty-banner case and it kills the
**alert** as well as the text write. So:

- `afterClassChange()` (`src/shell.js:427`) repaints only the class screen currently on view, and
  `paintPassBanner()` is called from just two places, `paintPasses()` (`src/attendance.js:3050`) and
  the registry render (`src/attendance.js:3886`).
- Switch from period 2 to period 3 while standing on Scores and `openClass()` moves while the banner
  still holds period 2's cards. `paintPassElapsed()` then scopes to period 3, finds no matching
  `[data-pass-elapsed]` node for any of its passes, and returns on every one of them.
- **Nothing alerts, for either class**, until the registry is next painted. It recovers there — the
  level is recomputed from elapsed and `markAlerted()` still refuses a non-increase, so a crossed
  threshold announces once on arrival — so this is a delay and not a permanent loss. The delay is
  unbounded: it lasts as long as the teacher stays off the registry.

The honest statement of the alert's reach today is therefore **whatever the last registry paint
drew**, which is narrower than anything the code says about itself, `startPassClock()`'s WO-2.27
paragraph (`src/attendance.js:2899`) included.

**How Roll Call! does it, which is the fix.** Its timer tick (`src/dashboard.html:3511`–`3538`) loops
over `activePasses` — its data — computes elapsed, writes the two DOM figures **guarded** (`if (el)`,
`if (bl)`), and then runs the threshold checks unconditionally. The alert never asks whether an
element exists. That is the same loop this file wants: move the guard so it skips the two DOM writes
and falls through to the threshold check.

**Why this is the fix and not a workaround.** The alternative — call `paintPassBanner()` from
`afterClassChange()` so the hidden banner keeps up — repairs the symptom by painting a screen nobody
is looking at, which is the thing `afterClassChange()`'s own comment declines to do. Reading the
document instead makes the alert independent of the DOM altogether, which is what WO-2.27's paragraph
called *"a driver of their own"* and priced as a work order. It is four lines.

**Deliverables**
- `paintPassElapsed()`'s per-pass guard skips the DOM writes only. The threshold comparison, the
  `fired` collection and the single `update()` run for every open pass of the open class, card or no
  card.
- `startPassClock()`'s paragraph corrected: the interval survives leaving the registry **and** a class
  change, and the alert is scoped to the open class rather than to the last paint.
- Two checks in `tools/verify-shell.mjs`, both on walks that leave the registry rather than stay on
  it: the alert fires with a pass open and the Scores screen up, and it fires for a class switched to
  while off the registry.

**Acceptance**
- [ ] With a pass open and the teacher on the Scores screen, crossing a threshold still fires the
      alert — asserted, on a walk that leaves the registry.
- [ ] **Switching class while off the registry no longer silences the alert for either class.** With
      an open pass in the newly-opened class over a threshold, the alert fires without the registry
      being painted; asserted, and it fails if the guard moves back.
- [ ] The card tint and the elapsed figure are unchanged on the registry itself — every existing
      hall-pass check still prints what it printed.
- [ ] `src/attendance.js:2899` describes the shipped behaviour, and no longer implies the banner is
      what the alert is driven from.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but
      for the count.

**Traps** — **Do not repaint the hidden banner to fix this.** It is the tempting one-liner in
`afterClassChange()` and it treats the symptom; `paintPassElapsed()` reading the document is the fix,
and the two do not both need doing. **Do not widen the scope to cross-class alerts.** The alert stays
scoped to `openClass()` — WO-2.11 left that door open and WO-2.9 and WO-2.26 both declined it on the
record (`src/attendance.js:2968`), and an alert naming a student from the room the teacher is not in
is a third work order with a surface of its own. **Do not touch the `alerted` field's semantics**
while you are in here: it is the record that makes the alert fire once, it is deliberately not copied
by `closePass()` (`src/passes.js:447`), and it is the reason a returning app announces the worse
threshold rather than both. **This does not make the alert reachable** — see WO-2.29. A build that
closes this line has fixed who the alert is *computed* for, not who can perceive it.

---

## 2. Read these first, before writing anything

- `AGENTS.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance.js`
  - `src/passes.js`
  - `src/shell.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Open these specific places, they are where the whole job is:**

- **`src/attendance.js:2890`–`3024`** — the entire clock/paint/alert stretch, as one unit.
  `PASS_CLOCK_MS`, the `startPassClock()` comment block at **2898–2918** (the paragraph Acceptance
  line 4 is about), `paintPassElapsed()`'s own header comment at **2930–2955**, and the function at
  **2956–3024**. **The guard to move is `if (!node) return;` at line 2982.** Below it, the two DOM
  writes are `node.textContent = elapsedText(seconds)` (2984) and the `card.classList.toggle(...)`
  pair (2989–2993) — note the `card` lookup is already `node.closest(...)` and already guarded by
  `if (card)`. Everything from `const level = passes.alertLevelFor(seconds)` onward must run for
  every open pass of the open class whether or not a card exists. `seconds` and `level` come from the
  pass record and `now`, not from the DOM, so they compute fine with no node.
- **`src/attendance.js:2898`–`2918`, read twice.** Its second paragraph — *"THE TICKS ARE NOT NO-OPS
  THERE. The cards the last paint left in the banner are still in the document, so
  paintPassElapsed() still finds their `[data-pass-elapsed]` nodes…"* — is the sentence this work
  order falsifies. It currently explains the alert's survival off the registry by appealing to
  **leftover cards**, and that explanation is both fragile and, on a class change, wrong. After the
  fix the reason is different in kind: the alert is computed from the document, so leftover cards are
  irrelevant to it. Rewrite the paragraph to say the new reason; keep the surrounding structure, the
  capitalised topic sentences, and the WO-2.27 attribution. The last paragraph's *"if that is ever
  wanted, the alerts need a driver of their own first, and that is a decision and a work order"* has
  now partly happened — this work order is that driver for the *computation*. Say so, and point at
  **WO-2.29** for the part that is still missing (nobody can perceive it off the registry). Do not
  delete the paragraph and do not shorten it into a one-liner; this file's comments are its decision
  record and a thinner one is a regression.
- **`src/shell.js:427`** `afterClassChange()` and its comment — **read it, change nothing in it.**
  It is the tempting one-liner the Traps forbid. Its own comment declines to paint screens nobody is
  looking at, and that stays true.
- **`src/passes.js`** — `openPassesFor()`, `alertLevelFor()`, `alertedLevel()`, `markAlerted()`, and
  `closePass()` at **:447**. Read `markAlerted()`/`alertedLevel()` closely enough to satisfy yourself
  the fix cannot double-fire: with no card present the level still has to clear
  `level > alertedLevel(pass)`. **Change nothing in this file.**
- **`tools/verify-shell.mjs:9909`–`10250`** — the existing WO-2.9 block, *"the elapsed clock, the
  alerts and the history"*. **This is the pattern to extend, and the helpers you need already exist
  there**: `windBack(studentId, minutes)` (9936) moves a pass's `out` stamp into the past through the
  store with no repaint, `hush()` (9963) writes a sentinel into `#srLive`, `heard()` (9965) reads it
  back. Note the ordering rule stated at 9996: **hush before the stamp moves, not after**, because
  the clock is live and the alert can land on any tick. Reuse these rather than writing new ones.
- **`tools/verify-shell.mjs:13596` and `:14643`** — smaller existing readers of
  `[data-pass-elapsed]` and `#srLive`. Worth a glance so your new checks read the same way.
- **Roll Call!, the reference implementation:**
  `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\src\dashboard.html`, lines
  **3511–3538**. That is the loop being lifted: it iterates its own data, writes the two figures under
  `if (el)` / `if (bl)`, and runs the threshold checks unconditionally afterwards. Read it before you
  edit, so the shape you produce is that one rather than a rediscovery of it.
- **`tools/README.md` § "Driving a browser over CDP"** — already listed above, and it matters here
  because your two new checks are class-switch walks, which is where the listed traps bite.

**Two notes on the new harness checks specifically.**

1. **Both walks must leave the registry.** A check that stays on the registry passes on the broken
   build, because the registry paint is exactly what currently rescues it. The second walk must
   switch class **while off the registry** and assert the alert fired **without the registry being
   painted in between** — if your walk touches the registry after the switch, it proves nothing.
2. **Acceptance line 2 says "it fails if the guard moves back."** State in your result file that you
   confirmed this, and how — the honest way is to put `if (!node) return;` back where it was, run the
   two new checks, watch them go red, and restore the fix. Report the red count. `"it would fail"` by
   reading is the claim this line exists to stop anyone making, and WO-2.27's verifier had to state a
   real count (739/746) for exactly this reason.

**If `verify-shell.mjs` cannot run in your sandbox, say so plainly and do not report a pass for
lines 1, 2, 3 or 5.** It drives headless Edge over CDP and agent sandboxes have failed to launch it
before. "Could not run" is an environment report, not a result — the orchestrator re-runs it locally
and nothing is ticked on your say-so either way. Writing the checks and being unable to execute them
is an acceptable outcome; claiming they passed is not.

**Scope.** Exactly two files should change: `src/attendance.js` (the guard and the comment block) and
`tools/verify-shell.mjs` (the two new checks). If a third file starts to change, stop and say why in
the result file.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 5 lines, reported against one by one

1. With a pass open and the teacher on the Scores screen, crossing a threshold still fires the alert — asserted, on a walk that leaves the registry.
2. **Switching class while off the registry no longer silences the alert for either class.** With an open pass in the newly-opened class over a threshold, the alert fires without the registry being painted; asserted, and it fails if the guard moves back.
3. The card tint and the elapsed figure are unchanged on the registry itself — every existing hall-pass check still prints what it printed.
4. `src/attendance.js:2899` describes the shipped behaviour, and no longer implies the banner is what the alert is driven from.
5. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but for the count.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

