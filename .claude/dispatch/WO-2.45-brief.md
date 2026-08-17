# WO-2.45 — the outer Bash timeout binds ten minutes before the cap everything is calibrated to · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.45-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude, Opus tier** (no `model` override — the implementer's own
`model: opus` frontmatter is the right default here). The deciding signal is that the central
deliverable is *a choice between two shapes* plus the written reasoning for the rejected one: that
is `ROUTING.md`'s "its Traps section is about judgment, not mechanics" and "it establishes a
convention" — how a Codex dispatch is supervised is a convention every future dispatch copies — and
the output is process prose in `.claude/agents/work-order-orchestrator.md`, `tools/README.md` and
`plans/verification-tooling.md`. The runner-up I set aside: the mechanical half is genuinely
Codex-shaped — two constants, one arithmetic gate, two `--self-check` boundary cases — but none of
those numbers can be chosen until the design question is answered, so the Codex-shaped work is
strictly downstream of the part Codex must not do. No Codex probe was run, because this is not the
Codex route. The Ship 1 pre-routing table does not carry WO-2.45, so there is nothing to disagree
with.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.45 — the outer Bash timeout binds ten minutes before the cap everything is calibrated to

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-17 · **Size** M · **Depends on** WO-2.40 · **Blocks** nothing
**Closes roadmap** *(no box. Dispatch tooling, not app — the same call WO-2.20, WO-2.37 and WO-2.40 made.)*

**Not a go-live blocker, and it has been declined by name three times** — WO-2.37 put it out of scope,
WO-2.40 put it out of scope again, and both dispatches proposed it as somebody else's row. Booked
2026-08-17 so that the third refusal is the last one. **This is the row that is not XS**, and it is the
one the other two were protecting.

**Why it exists.** `.claude/agents/work-order-orchestrator.md:220-221` instructs the orchestrator to
give the Codex Bash call a **600000 ms** timeout, and adds that the script's internal cap is 20 minutes
*"but the outer timeout is what actually protects the session."* Ten minutes against twenty. Everything
downstream is calibrated to the twenty:

- `INVOKE_TIMEOUT_MS = 20 * 60 * 1000` (`codex-invoke.mjs:83`)
- `WORK_RESERVE_MS = 10 * 60 * 1000` (`:92`)
- the `--budget` refusal at `:264`, which **approves** up to ten minutes of stated harness runs on the
  arithmetic *"10 + 10 fits inside 20"* — and prints that arithmetic to the router as a promise

**So the gate WO-2.37 built approves dispatches the outer call cannot possibly hold**, and it tells the
router so in a printed sentence. That is worse than an unguarded cap: it is a guard that clears the
exact dispatch it exists to refuse.

**The sharper consequence is what it does to exit 3.** The started-then-killed report — *"no verdict
either way, go and read the diff"* — is printed by `codex-invoke.mjs` when **it** SIGTERMs its child at
its own cap. If the outer Bash timeout fires first, the script itself is the thing killed; it never
reaches that branch, never prints the diagnosis, and the orchestrator sees a bare Bash timeout over a
tree that may be holding a half-applied mutation. **That is the 2026-08-14 shape exactly** — the scar
WO-2.37 fixed and WO-2.40 made permanent — reachable around the side of both. The two rows that just
hardened this path hardened the ten minutes nobody gets to.

**And 600000 is a ceiling, not a preference.** The Bash tool caps `timeout` at 600000 ms, so *"raise
the outer number to match the inner one"* is not available. That is what makes this a design question
rather than a constant edit, and it is why the two rows that met it declined it.

**Deliverables**
- **A decision between the two shapes that are actually available**, with the reasoning written where
  the next router meets it:
  - **Shrink the cap to fit.** `INVOKE_TIMEOUT_MS` below ten minutes, and `WORK_RESERVE_MS` and the
    `--budget` arithmetic re-derived against the smaller number. Honest, small, and it narrows the
    Codex route further — which WO-2.37 already called the wrong shape of fix in the other direction.
  - **Detach and poll.** The dispatch outlives the Bash call; the orchestrator starts it, returns, and
    reads a status file. This restores exit 3 by construction, since the script is no longer inside
    the thing that gets killed — and it is a change to how a dispatch is supervised, not to a number.
- **Whichever lands, the printed arithmetic must stop over-promising.** If a router is told a budget
  fits, it must fit the constraint that actually binds.
- **The three files that read these numbers move together** — `codex-invoke.mjs`,
  `work-order-orchestrator.md`, `tools/README.md` — and the reader count is now one agent file plus
  `tools/README.md`, re-checked by grep rather than inherited (WO-2.40's note on this row's ancestor).

**Out of scope** — the runner itself; `codex-invoke.mjs --self-check`, which asserts the boundary at 10
and 10.1 **deliberately** and will go red when a constant moves (WO-2.40 wrote that down as intended,
not brittle — so **updating those two cases is part of this row, and their going red is the check
working**); and anything about which work orders route to Codex, which is `ROUTING.md`'s subject.

**Acceptance**
- [ ] The mismatch is demonstrated before it is fixed: a dispatch shape that `--budget` clears and the
      outer call cannot hold, named with its arithmetic. A row that begins *"obviously"* has skipped
      the only step that proves the premise.
- [ ] One of the two shapes is chosen, built, and the **rejected** one is written down with why —
      `plans/verification-tooling.md`, the file that already holds this thread's decisions.
- [ ] After the change, no printed sentence tells a router that a budget fits unless it fits the
      binding constraint. Shown on both sides of the boundary.
- [ ] `codex-invoke.mjs --self-check` passes again, with its boundary cases moved to the new numbers
      and the move explained at the cases.
- [ ] If exit 3 survives a kill at the binding constraint, that is **driven**, not asserted — the whole
      point of WO-2.40 is that this branch is exercised rather than reasoned about.
- [ ] `node tools/wo-sweep.mjs` green and `git diff --stat -- src/` empty.

**Traps** — **Do not spawn Codex to measure this**, WO-2.40's Traps line unchanged: every number here
is reachable with a stand-in child through the seam WO-2.40 built. **Detach-and-poll is the tempting
answer and it is the one with the hidden cost** — a dispatch nobody is holding is a dispatch nobody
notices dying, and this pipeline's oldest scar (`plans/dispatch-retro.md` § the 2026-08-14 kill) is a
run whose death was misreported. If it detaches, say what reads the corpse. **Shrinking the cap is not
the safe default just because it is smaller**: it silently takes work orders off the Codex route, which
is the invisible exclusion WO-2.37 exists to have made visible.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/dispatch-retro.md`
  - `plans/verification-tooling.md`
  - `tools/README.md`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The subject files, all four of them:**

- `tools/codex-invoke.mjs` — the whole file, header comment included. `INVOKE_TIMEOUT_MS` at `:83`,
  `WORK_RESERVE_MS` at `:92`, the `--budget` refusal at `:264` and the *approval* it prints at
  `:267`, the exit-3 branch around `:327-332`, and the `--self-check` seam and case list from `:94`
  and `:357` down. The seam comment at `:409-411` states the boundary arithmetic in prose
  (*"20 min less 10 min leaves exactly ten minutes… the arithmetic a router is actually promised"*)
  and is itself a thing that moves with the constants.
- `.claude/agents/work-order-orchestrator.md` — step 4, and `:220` specifically. **Note the file's
  own length rule** in § Standing rules: it states its current line count and requires that number
  be corrected in the same edit that changes the length. That rule is load-bearing and this row is
  exactly the kind of edit that has stale'd it before.
- `tools/README.md` — `:127-128` (`INVOKE_TIMEOUT_MS` is twenty minutes / SIGTERM) and `:181`
  (*"two seconds against a twenty-minute dispatch"*).
- `plans/verification-tooling.md` — where the rejected shape gets written down. Acceptance line 2
  names this file; it already holds this thread's decisions.

**Prior art you should read rather than re-derive**, all in `.claude/dispatch/`:
`WO-2.37-result.md` (the row that chose to leave the cap at twenty and wrote down why — its § on the
`INVOKE_TIMEOUT_MS` decision, and its hand demonstration at `:280-296`) and `WO-2.40-result.md`
(the `--self-check` seam, its stand-in children, the boundary pair at `--budget 10` / `10.1`, and
its own closing note at `:290` that the outer 600000 ms Bash timeout binds first — this row is that
note booked). The Traps line *"do not spawn Codex to measure this"* means the seam described in
`WO-2.40-result.md` is your instrument; the WO-2.37 approach of editing the real constant in place
is the thing the seam was built to replace.

**One thing my own grep turned up that the Deliverables may understate — surface it either way.**
The third Deliverable says the reader count is *"one agent file plus `tools/README.md`, re-checked
by grep rather than inherited."* I re-checked, and `plans/work-orders/ROUTING.md` also states the
number to a router, four times: `:140-141` (*"a hard 20 minutes for the whole dispatch"*), `:157`,
`:160` (*"`--budget 9` answers 'fits inside the 20 min cap'"*) and `:173`. `plans/work-orders/README.md:484`
states it once more. The **Out of scope** line puts ROUTING.md's *subject* out of bounds — "anything
about which work orders route to Codex" — which is not the same as its arithmetic going stale. Do
not silently widen and do not silently leave a number that now over-promises: Acceptance line 3 says
*no printed sentence tells a router that a budget fits unless it fits the binding constraint*, and
`ROUTING.md:160` is a sentence of exactly that kind sitting in the file the router reads every
dispatch. Make the call, do the smallest thing consistent with it, and **say in your report which
way you went and why** — including if you deliberately left one alone.

**Do not widen past that.** The runner, the routing rubric's actual content, and `wo-gate.mjs` are
not this row.

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

## 5. Done means these 6 lines, reported against one by one

1. The mismatch is demonstrated before it is fixed: a dispatch shape that `--budget` clears and the outer call cannot hold, named with its arithmetic. A row that begins *"obviously"* has skipped the only step that proves the premise.
2. One of the two shapes is chosen, built, and the **rejected** one is written down with why — `plans/verification-tooling.md`, the file that already holds this thread's decisions.
3. After the change, no printed sentence tells a router that a budget fits unless it fits the binding constraint. Shown on both sides of the boundary.
4. `codex-invoke.mjs --self-check` passes again, with its boundary cases moved to the new numbers and the move explained at the cases.
5. If exit 3 survives a kill at the binding constraint, that is **driven**, not asserted — the whole point of WO-2.40 is that this branch is exercised rather than reasoned about.
6. `node tools/wo-sweep.mjs` green and `git diff --stat -- src/` empty.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

