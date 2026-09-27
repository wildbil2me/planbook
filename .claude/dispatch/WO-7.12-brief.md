# WO-7.12 — the lapsed-sign-in check reads Connect before the panel has settled · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.12-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus**, on its own merits: the first Acceptance line is a cause write-up in
`TESTING.md` (teacher-repo prose), and the Traps are judgment traps — *no fixed sleep*, *do not loosen
the check*, *a green run before WO-7.13 proves nothing*. Codex was set aside on the budget bullet
before the probe: `verify-shell.mjs` has no section filter, so "twenty runs of the Phase 7 sections"
means whole-harness runs at ~4.5–5 min each, far past the 20-minute cap. This is a second cut; the
first stopped correctly on its own "if it is the app" branch and WO-7.13 has since fixed that half.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.12 — the lapsed-sign-in check reads Connect before the panel has settled

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-27 · **Size** XS · **Depends on** WO-7.2 — the check this steadies; WO-7.13 — the repaint the check was reading around
**Closes roadmap** *(no box. A harness race, found by WO-7.11's implementer and confirmed red on unmodified `HEAD` by its verifier.)*

**Re-cut 2026-09-27**, owner-directed, after its first dispatch **stopped correctly on its own
second Deliverable**. Verdict: *stopped correctly, not closeable*. No code landed: `src/` and `tools/`
matched `HEAD` at the verdict. The status went back to `⬜` by hand, because `--release` refuses
`🔍 AWAITING VERDICT` by design. That refusal protects a finished tree, and there was none here. The
first cut's brief, result and status are kept as `.claude/dispatch/WO-7.12-cut1-*.md` so a
re-dispatch does not find a result file and read it as this cut's. **The diagnosis is in
`WO-7.12-cut1-result.md`, and the verifier confirmed its code reading, not its runs.** There are two
layers:
- **The trigger is the harness, as booked.** `auth.disconnect()` clears `busy` and the session. It
  does not clear `pending`. So drive-sign-in's last `connect()` stays in flight into `drive-sync`. It
  then settles on `popup_failed_to_open` and runs `refreshAuthChrome()` over the token `drive-sync`
  seeded, which hides Connect.
- **The reason that can turn the check red is in `src/`.** A `signed-out` `syncNow()` repaints only
  the sync half of the panel. So when the check is green, it is reading Connect from a paint made
  about 340 lines earlier. The fix for that is
  [WO-7.13](#wo-713--a-sign-in-that-lapses-with-about-open-leaves-the-panel-saying-connected),
  and this work order waits on it: steadying the harness first would make a false claim steadily
  green.

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

**Deliverables** *(re-cut 2026-09-27. The first cut's "find the cause" and "if it is the app, stop"
are answered above, and the second is WO-7.13.)*
- **`verify/drive-sign-in.mjs` hands the page on with nothing in flight.** Wait on a named condition
  **before** the foot's `auth.disconnect()`, not after it. After `disconnect()`, `authState().busy`
  reads `false` while `pending` still stands, so it says nothing about what is in flight. The first
  cut's proposal: poll `authState().busy === false`, bounded, and announce a skip if the bound runs
  out. Google's own timeouts are 25s silent plus 180s visible. It is a proposal, not a ruling.
- **Correct the foot's comment** at `tools/verify/drive-sign-in.mjs` (~652–654). *"A request that is
  still out when this file ends is a timer in a browser that is about to be killed"* is false: the
  next section runs in the same page.
- **Make WO-7.13's check assert its own premise.** Its comment says About was *painted signed in*
  before the lapse, and nothing asserts it. In a run where this file's leftover `connect()` is still
  busy, the status line reads *Waiting for Google…* throughout, and the *no longer Connected* clause
  holds without testing anything. Assert `/^Connected/.test(openInStatus)` before the lapse. The
  verifier on WO-7.13 found this and it failed no line there, because the check's other two clauses
  still turn red. It was handed here by name on 2026-09-27, because this is the work order that
  empties that busy state.
- Nothing in `src/` moves. That half is WO-7.13's.

**Acceptance**
- [ ] The cause is named in `TESTING.md` § WO-7.12, with the run that shows it. Both layers go in:
      the harness trigger and the `src/` repaint WO-7.13 fixed. The first cut's trace (`t=999`
      paint over a seeded session) is written to be lifted in.
- [ ] Twenty consecutive runs of the Phase 7 sections read the check green. *(Or, if they cannot be
      run alone, whole-harness runs enough to say so honestly.)*
- [ ] The whole browser harness shows no new failure.

**Traps** — **No fixed sleep.** A wait on a named condition (nothing in flight, the panel painted) or
nothing. **Do not loosen the check** — Connect back on the screen is the re-auth prompt, and it is half
of what the check exists to prove. **A green run before WO-7.13 lands proves nothing about this
work order.** It reads the stale paint from `drive-sync`'s own `disconnect()`, which is the reading
the first cut refused to land.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/drive-sync.js`
  - `tools/verify/drive-sign-in.mjs`
  - `tools/verify/drive-sync.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **`.claude/dispatch/WO-7.12-cut1-result.md`** — the first cut's diagnosis. Read it before the code.
  Its `trace2.log` excerpt (`t=999  connect-attr  hidden:true  signedIn:true …`) is **written to be
  lifted** into `TESTING.md` § WO-7.12, per Acceptance line 1. It is a *verified code reading*, not
  verified runs: re-state it as evidence from that sitting, not as something you re-observed, unless you
  do re-observe it. Ignore `WO-7.12-cut1-brief.md`; this brief supersedes it.
- **`TESTING.md` § WO-7.13** (~line 12274) — the section format to match, and the list of every
  `refreshAuthChrome()` caller. Add § WO-7.12 in the same shape.
- **`src/auth.js`** — read, do not edit: `connect()`, `settle()`, `disconnect()`, `authState()`, and
  what `pending` vs `busy` mean. Your wait condition is only as good as your reading of these.
- **`tools/verify/drive-sync.mjs` ~930–1010** — WO-7.13's check (`openInStatus`, `AUTH_LINE`). The
  third Deliverable adds a `/^Connected/.test(openInStatus)` premise assertion there. The old check
  at ~906 is the one this work order steadies; do not reword its assertion.

**Orchestrator notes — the traps a cold reader would not guess.**
- **Nothing in `src/` moves, and no `CACHE` bump** — `tools/` is not in `SHELL`. If you conclude
  `src/` must change, stop and say so in the result file; that is a new work order, not this one.
- **Where the wait goes.** Before the foot's `auth.disconnect()` in `drive-sign-in.mjs`, never after —
  after it `busy` is `false` with `pending` still set. A bounded poll on a *named* condition, and if
  the bound expires, **announce it** on the harness output rather than proceed silently. Name the
  bound and justify it against Google's 25s + 180s timeouts in the comment. `authState().busy` is the
  first cut's proposal, not a ruling — if your reading of `auth.js` finds a truer condition, use it and
  say why.
- **A new assertion changes the check count.** If `tools/README.md` or any sweep line records a
  `check()` count for these files, a correct change can turn `wo-sweep.mjs` red (the WO-3.26 shape).
  Run the sweep and fix the recorded number if so.
- **The runs.** Establish a baseline on unmodified `HEAD` first (at least one run, to know the flake
  is live on this machine today), then run the whole harness repeatedly with the change in. Run long
  batches with Bash `run_in_background` and write each run to a log under the scratchpad; read each
  log's own `EXIT=` line and the summary, never `grep -c` exit status (zero matches exits 1). Twenty
  is the target; if you cannot fit twenty, report the exact count and say honestly what it supports
  — the Acceptance line allows that and the verifier will check the number against the logs.
- **If you mutate to prove the premise assertion non-vacuous** (e.g. force the pre-lapse status),
  mark it `MUTATION`, revert it before writing anything else, and `grep -rn MUTATION tools/ src/`
  before your result file.
- You may tick Acceptance boxes you have evidence for. Do not touch `CHANGELOG.md`.

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

1. The cause is named in `TESTING.md` § WO-7.12, with the run that shows it. Both layers go in: the harness trigger and the `src/` repaint WO-7.13 fixed. The first cut's trace (`t=999` paint over a seeded session) is written to be lifted in.
2. Twenty consecutive runs of the Phase 7 sections read the check green. *(Or, if they cannot be run alone, whole-harness runs enough to say so honestly.)*
3. The whole browser harness shows no new failure.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

