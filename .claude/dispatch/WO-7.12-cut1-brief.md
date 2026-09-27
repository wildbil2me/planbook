# WO-7.12 — the lapsed-sign-in check reads Connect before the panel has settled · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.12-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override) — the deciding signal is that the first Deliverable is a diagnosis with a stop-and-report branch (*if it is the app, stop*), which is a judgment trap, not a spec to match. The runner-up was Codex on size XS and harness-only scope, set aside because the Acceptance wants twenty clean runs of a harness that runs ~5 min whole — far past the 20-minute Codex cap — and because the cause is not written down anywhere to implement against.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.12 — the lapsed-sign-in check reads Connect before the panel has settled

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-27 · **Size** XS · **Depends on** WO-7.2 — the check this steadies
**Closes roadmap** *(no box. A harness race, found by WO-7.11's implementer and confirmed red on unmodified `HEAD` by its verifier.)*

**Booked 2026-09-27**, owner-directed, from WO-7.11's verdict, as a 🎒 on
`tools/verify/drive-sync.mjs` — *and taken off it the same day*: it failed again in the next
whole-harness run, and the owner put it between WO-1.55 and WO-7.9, which builds on these checks. `verify/drive-sync.mjs`'s check *"a sign-in that has already run out
when the teacher taps Sync produces the re-auth prompt…"* (~906) failed in 2 of 14 runs of WO-7.11's
tree with **Connect read as hidden**, and once on `8ef1b81` in the verifier's run. The implementer's
account, **a claim and not a finding**: `verify/drive-sign-in.mjs`, which runs directly before, ends
on a real Connect tap whose `connect()` is still waiting on Google's live library when
`drive-sync` seeds its token; when it settles it repaints the panel with that seeded token standing.
`src/drive-sync.js` never repaints Connect, so the check reads whatever the last paint left. A
MutationObserver trace over eight more runs never caught it.

**Worse than booked, 2026-09-27.** WO-1.56's two sessions ran the whole harness eight times on the
real clock, Edge 154. This check failed in five: the implementer's baseline on unmodified `HEAD` and
both of its planted runs, then the verifier's baseline and one of its planted runs. Both sessions'
final runs were green. Neither WO-1.56 file reaches `drive-sign-in` or `drive-sync`, so the change is
not the cause. The rate went from one run in seven to more often than not. At that rate the next
verifier cannot learn much from a green whole-harness run, which is the cost this booking names.

**It is harness-only as far as anyone knows.** A teacher cannot seed a token, so the interleaving
needs the harness to make it. It is booked because a check that is red one run in seven teaches the
next verifier to shrug at red.

**Deliverables**
- **Find the cause before fixing it.** If the pending `connect()` is the culprit, the fix belongs at
  the foot of `verify/drive-sign-in.mjs` — the section hands the page on with nothing in flight — and
  not in a sleep before the check.
- **If it turns out to be the app** — a repaint the panel owes and does not make — stop and report it
  rather than fixing it here; that is a work order in `src/`, not a ride-along.
- Nothing in `src/` moves.

**Acceptance**
- [ ] The cause is named in `TESTING.md` § WO-7.12, with the run that shows it.
- [ ] Twenty consecutive runs of the Phase 7 sections read the check green. *(Or, if they cannot be
      run alone, whole-harness runs enough to say so honestly.)*
- [ ] The whole browser harness shows no new failure.

**Traps** — **No fixed sleep.** A wait on a named condition (nothing in flight, the panel painted) or
nothing. **Do not loosen the check** — Connect back on the screen is the re-auth prompt, and it is half
of what the check exists to prove.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/drive-sync.js`
  - `tools/verify/drive-sync.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/verify/drive-sign-in.mjs` — the section that runs directly before; the suspect is its
  **last** Connect tap, whose `connect()` may still be awaiting Google's live library when
  `drive-sync` seeds its token. Read its foot first.
- `src/drive-sign-in.js` (or wherever `connect()` and the panel paint live — find it with grep) —
  read only. You need to know what "settled" means before you can wait on it.
- `.claude/dispatch/WO-7.11-result.md` and `.claude/dispatch/WO-1.56-result.md` — where the failure
  was seen and counted. Their causal account is **a claim, not a finding**: the WO-7.11 implementer's
  MutationObserver trace never caught it, so treat the pending-`connect()` theory as the hypothesis
  to confirm or kill, not as the answer.

**Orchestrator's notes — the traps this brief adds.**

- **Diagnose first, and make the diagnosis reproducible.** The rate is now ~5 in 8 whole-harness
  runs, so it is catchable. What `TESTING.md` § WO-7.12 needs is *the run that shows it*: a trace or
  a deliberate widening of the window (e.g. temporarily delaying the library's settle) that turns the
  check red on demand, and then the fix that turns it green under the same widening. A temporary
  diagnostic mutation is fine; **mark it `MUTATION` in a comment and revert it before writing any
  prose** (`AGENTS.md` § "If you were dispatched with a work order"). `grep -rn MUTATION tools src`
  must be empty when you finish.
- **The fix is a wait on a named condition, at the foot of `drive-sign-in.mjs`** — the section hands
  the page on with nothing in flight. No fixed sleep. Do not touch the check at ~906 in
  `drive-sync.mjs` to make it pass, and do not loosen it.
- **If the cause is in `src/`** — a repaint the panel owes and does not make, a `connect()` that can
  resolve into a stale panel for a real teacher — **stop, revert, and report it** as a proposed work
  order. Nothing in `src/` moves in this one, and that includes `sw.js`'s `CACHE`.
- **Run count.** `verify-shell.mjs` has no single-section flag; do not add one here (that widens the
  work order — propose it as a follow-up if you want it) and do not write a scratch third harness.
  So the second Acceptance line takes its parenthetical: run the whole harness as many times as your
  time honestly allows — at least ten consecutive, twenty if you can — and report the exact count,
  the green count for that check, and the whole-run totals. Read each log's own `EXIT=` line; a
  `grep -c` exiting 1 on zero matches is not a failed run.
- **Baseline first.** Run the harness on unmodified `HEAD` at least twice before you change anything,
  so "no new failure" has something to be measured against; say what that baseline read.
- **`tools/README.md` records a `check()` count** that `wo-sweep.mjs` compares against. If your fix
  adds or removes a `check(` call, update that number or the sweep goes red (the WO-3.26 last mile).
  Run `node tools/wo-sweep.mjs` last.
- **Leave no scratch files in `tools/`.** Use the session scratchpad for logs.
- **Tick** the Acceptance lines you have honestly closed, and write `TESTING.md` § WO-7.12. Do not
  touch `CHANGELOG.md`.

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

## 5. Done means these 3 lines, reported against one by one

1. The cause is named in `TESTING.md` § WO-7.12, with the run that shows it.
2. Twenty consecutive runs of the Phase 7 sections read the check green. *(Or, if they cannot be run alone, whole-harness runs enough to say so honestly.)*
3. The whole browser harness shows no new failure.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

