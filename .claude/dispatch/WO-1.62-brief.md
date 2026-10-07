# WO-1.62 — a run under --today in Quarter 2 is red before any work order touches it · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.62-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (on its own merits, no `model` override). The deciding signal is
that this is diagnosis before fixing, and the Traps are about judgment: don't blame the app, don't
skip a check to make it pass, and confirm or rule out a stated hypothesis. It also writes
`TESTING.md` prose. The runner-up was Codex, because the defect is harness-only and the acceptance
is mechanical. I set it aside on the budget: the Acceptance needs at least four full
`verify-shell.mjs` runs (real clock, Q2, Q3, the mutation) at 1806+ checks, which is well past
Codex's 20-minute cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.62 — a run under --today in Quarter 2 is red before any work order touches it

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-06 · **Size** S · **Depends on** —
**Closes roadmap** *(no box. A harness defect, owner-directed, 2026-10-06.)*

**Booked 2026-10-06**, owner-directed, out of WO-3.49's verdict.

**The defect.** `node tools/verify-shell.mjs --today=2026-11-10` fails 11 checks on `e3abd60`, before
WO-3.49 landed, and the same 11 by title on WO-3.49's tree. So a full run dated in Quarter 2, which
starts 2026-11-01, is red on `main`, and every verifier from now to then has to diff a `--today` run
against a baseline to tell its own failures from these. The real clock is green (1806/1806 on
`9a5b316`). The failures are in two groups, and they may not share a cause:

- **One class-tab term-nav check.** Likely a fixture or expectation that assumes today is in Quarter 1.
  This is WO-1.44's *a fixture colliding with a date* again, in a section that has not met that date.
- **`build-line.mjs`, `stuck-update.mjs` and `worker-takeover.mjs`**, with `worker-takeover` throwing
  *Maximum call stack size exceeded* from inside a `Date` call. **A hypothesis, not a finding:**
  `SHIFT_PAGE_CLOCK` in `tools/verify-shell.mjs` captures `var Real = Date`. If it ever runs in a realm
  where `Date` is already the proxy and `window.__clockShifted` is not set, `Real` is the proxy, and
  its `now` getter calls `Real.now()`, which goes back through the same getter until the stack runs
  out. All three sections are about the service worker and reloads, which is where a fresh realm or a
  second install would come from. Confirm or rule it out before fixing anything.

**Deliverables** — each of the 11 failures traced to its cause, recorded in `TESTING.md` § WO-1.62
by check title, and fixed in the harness. If the clock patch is the cause, it is fixed so that
installing it twice cannot recurse, and the comment above it says why.

**Acceptance**
- [ ] `node tools/verify-shell.mjs --today=2026-11-10` is green on the delivered tree, with the same
      number of checks as a real-clock run, apart from any check that names its date dependence.
- [ ] The real-clock run is unchanged in check titles and count and is still green.
- [ ] If the clock patch is changed, a mutation restoring the recursion turns a check red.
      Mutation-proved and recorded in `TESTING.md` § WO-1.62. **The mutation is reverted before
      anything else is written** (`AGENTS.md`).
- [ ] `--today=2026-01-20` (Quarter 3, a date after a year boundary) is also run and its result
      recorded. Failures there that this work order does not fix are named, not fixed.

**Traps** — **The app is probably innocent**, as it was in WO-1.44: look for the harness or fixture
assumption before the commit that broke it. **A check made to pass by skipping it under `--today` is
not a fix**. If a check really cannot run on a shifted clock, it says so in its own output, and
WO-1.44's rule that a shifted run says so stands. Nothing in `src/` should move. If something there
must, stop and report it rather than fixing it inside this work order.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `plans/work-orders/phase-1-shell-store-roster.md` § WO-1.44 (line ~4151) and `TESTING.md`
  § WO-1.44. That is where `--today` and `runSection()` containment came from, and where *the app was
  innocent* was learned. Follow its TESTING.md section's shape for § WO-1.62.
- `.claude/dispatch/WO-3.49-result.md` lines 20–31. This is the only record of the 11 failures:
  `1791 checks · 1780 passed · 11 failed · 0 skipped` on `e3abd60` at `--today=2026-11-10`. The titles
  are **not** listed there. Your first act is a baseline `--today=2026-11-10` run on the clean tree,
  to get the eleven titles yourself.
- `tools/verify/term-nav.mjs`, `build-line.mjs`, `stuck-update.mjs` and `worker-takeover.mjs` (if
  that last one is a section rather than a file, `grep -rn worker-takeover tools/`).
- `AGENTS.md` § "If you were dispatched with a work order". It has the mutation-revert rule.

**Orchestrator notes. These are the traps the work order does not spell out.**
- **The hypothesis has a guard against it as written.** `window.__clockShifted` is set before
  `var Real = Date`, so a second install *in the same realm* returns early. Before you accept the
  recursion story, find the realm where the flag is absent but `Date` is already the proxy. Or find
  a different recursion: for example, `new Real(...)` inside `apply`, or a `Reflect.get` that reaches
  `now` through a getter. Also check whether the SW-related sections open a second target, a new
  page, or `Page.addScriptToEvaluateOnNewDocument` twice, and whether they use their own CDP
  session. **Report which one it was, with the evidence.**
- **Q2 versus Q3 for one term-nav check.** A fix that hard-codes "pick Q2" just moves the collision
  to the next quarter. Derive the expectation from the fixture's terms and the shifted today, so it
  holds at 2026-01-20 too.
- **Count parity.** A shifted run's count may legitimately differ only for a check that names its
  date dependence in its own output. WO-3.49's run had one skip (Drive Connect in About), so find out
  whether that one is date-dependent, and say so either way.
- **Stage before mutating** (`git add` your fix first). `git checkout` on a mutated file reverts your
  own unstaged edits, and this has happened here before. Run `grep -rn MUTATION tools/ src/` before
  you write the result file.
- `tools/README.md` records counts of harness call sites that `wo-sweep.mjs` checks. If you add
  `check()` calls or sections, re-run the sweep and update the recorded count, or the sweep goes red
  on finished work (WO-3.26).
- A full run is slow (several minutes). Run it in the background to a log and read the log's own
  exit line. `grep -c` returning 1 on zero matches is not a failed run.
- Do not commit. The orchestrator's session handles that after the verifier.

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
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
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

## 5. Done means these 4 lines, reported against one by one

1. `node tools/verify-shell.mjs --today=2026-11-10` is green on the delivered tree, with the same number of checks as a real-clock run, apart from any check that names its date dependence.
2. The real-clock run is unchanged in check titles and count and is still green.
3. If the clock patch is changed, a mutation restoring the recursion turns a check red. Mutation-proved and recorded in `TESTING.md` § WO-1.62. **The mutation is reverted before anything else is written** (`AGENTS.md`).
4. `--today=2026-01-20` (Quarter 3, a date after a year boundary) is also run and its result recorded. Failures there that this work order does not fix are named, not fixed.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

