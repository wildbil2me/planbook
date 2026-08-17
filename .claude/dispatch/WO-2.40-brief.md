# WO-2.40 — the codex-invoke gates have never been exercised by anything but a hand · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.40-result.md` — as your last act, and return it in-band too.

**Routing decision.** This went to **Claude Opus on its own merits, not as a Codex fallback** — no
probe was run, because step 2b is Codex-route only. The deciding signal is that two of the six
Deliverables are open judgment calls the work order refuses to pre-answer (*"a line of code if it is
wrong and a written sentence if it is right"*; *"a decision on who runs this and when — any answer,
written down"*), and its Traps require that any such decision propagate to two agent files and
`tools/README.md` **in the same sitting** — convention plus suite-voice prose, twice over in the
Claude column. The runner-up I set aside: this is pure plumbing against a fully settled spec with no
UI at all, the strongest Codex reading available on this row, and the run budget would have fit since
nothing here spawns a browser — but Acceptance line 4 demands a mutate · run · revert cycle inside
`tools/codex-invoke.mjs` **itself**, the file that spawns a Codex dispatch, so a run killed at the cap
would leave the dispatch plumbing half-edited. That is `ROUTING.md` § "Route to Codex"'s hard
condition one file deeper, and it decides the row.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.40 — the codex-invoke gates have never been exercised by anything but a hand

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-17 · **Size** S · **Depends on** WO-2.37 · **Blocks** nothing
**Closes roadmap** *(no box. Dispatch tooling, not app — the same call WO-2.20 and WO-2.37 made.)*

**Not a go-live blocker, and nothing here is a defect today.** Booked 2026-08-16 out of WO-2.37's
dispatch, where the implementer and the verifier proposed it independently and neither built it.
Both gates below were driven by hand on the day they shipped and both behaved. This row is about the
day after.

**Why it exists.** WO-2.37 added two caller-side gates to `tools/codex-invoke.mjs`, and **the whole
value of each one is behaviour nobody sees on a normal run**:

- `refuseIfBudgetDoesNotFit()`, called from `runInvoke()` before anything is spawned. If that call is
  deleted, or moved below the spawn, or the comparison is inverted, every dispatch in this project
  still passes and the next work order with a slow Acceptance is SIGTERMed mid-mutation exactly as
  before.
- The **started-then-killed** split in `runInvoke()` — `result.error && result.signal` → exit 3. If
  that regresses, a killed dispatch goes back to reporting exit 2, whose documented invariant is that
  the working tree is untouched. **That is not hypothetical: it is the WO-3.15 scar**, 2026-08-14,
  where Codex wrote all seven of its files, was killed at the cap, and the script reported "could not
  be run" over 206 insertions sitting in the tree.

**The only thing that has ever executed either path is a hand.** WO-2.37's demonstrations ran in a
scratchpad throwaway repo with `INVOKE_TIMEOUT_MS` and `PROBE_TIMEOUT_MS` **temporarily edited in the
real file** and restored afterwards — mutate · run · revert, on the one file whose own comment warns
what an interrupted mutation costs. The evidence was correct and it is gone, and repeating it costs
the next reader the same afternoon. **This is WO-2.38's argument one file over:** a gate nobody
exercises agrees with everything.

**The mechanism is already measured and should not be re-derived.** WO-2.37's correction round
established the discriminator by running it — `TIMEOUT` gives `status null · signal SIGTERM · error
ETIMEDOUT`, `ENOENT` gives `status null · signal null`, a `maxBuffer` overrun gives `signal SIGTERM ·
error ENOBUFS` — and established that a sleeping `process.execPath` reproduces the timeout case
exactly. That is the stand-in child; what is missing is a seam to hand it in.

**Deliverables**
- **A `--self-check` on `codex-invoke.mjs`**, on `wo-gate.mjs --self-check`'s precedent: a tool that
  proves its own gates still bite. **This is not the "second harness" question WO-2.38 has to
  answer** — the checks live in the file they check, which is the shape this suite already blesses.
- **A seam for the command and the timeouts**, so the paths can be driven without editing the
  constants. The smallest change that makes them callable, not a rewrite of `runInvoke()`.
- **Every caller-side gate driven by its exit code**, with no real Codex process spawned: both
  `--budget` boundaries, the non-numeric budget, `--probe --budget`, the missing `--brief`/`--out`,
  the missing brief file, the unrecognized flag, and the started-then-killed branch against the
  stand-in child.
- **A decision, either way, on the two adjacent findings WO-2.37's verifier named and explicitly did
  not call defects.** (a) An **externally** killed child — `signal` set, `error` unset — falls past
  the exit-3 branch and is reported as exit **1**, the runner-verdict code, for a kill that produced
  no verdict. (b) `mkdirSync(dirname(outPath))` runs ahead of the `codex-resources` check, so a later
  exit 2 can leave an empty output directory behind after a run that never started. Each is a line of
  code if it is wrong and a written sentence if it is right.
- **A decision on who runs this and when** — `wo-sweep.mjs`, the orchestrator's step 2b beside the
  probe, or by hand at the next change to the file. Any answer, written down.

**Out of scope** — the runner itself (`--probe`'s real spawn is not the subject; WO-2.37's Traps
already say so), raising `INVOKE_TIMEOUT_MS`, and the orchestrator's outer 600000 ms Bash timeout —
which is the constraint that actually binds first and is a work order of its own if anyone wants it
pursued. Re-verifying WO-2.37's five Acceptance lines is not this row either; they passed.

**Acceptance**
- [ ] Every caller-side refusal in `codex-invoke.mjs` is driven and asserted on **both** its exit code
      and a distinguishing phrase of its message, in one run, with no Codex process spawned.
- [ ] The started-then-killed branch reports exit **3** against a stand-in child, and a never-started
      child still reports exit **2**, in that same run. The two cases are distinguished by `signal`,
      not by the error code's name.
- [ ] Nothing the check writes reaches `tools/`, `src/` or `index.html` — no constant is mutated and
      restored, at any point, by anything committed. **This is the acceptance line with a scar behind
      it:** the hazard WO-2.37 exists to name is a mutation left in the tree by a run that died.
- [ ] Deleting any one of those gates, or inverting its condition, turns the check red — shown, not
      argued. A self-check that passes whether or not the thing it checks exists is this row's own
      failure repeated inside itself.
- [ ] The two adjacent findings above are answered in writing, and anything fixed in answering them is
      covered by the run.
- [ ] `node tools/wo-sweep.mjs` is green and `git diff --stat -- src/` is empty.

**Traps** — **Do not spawn Codex to test the plumbing.** Every gate here is reachable without it, and
a check that needs the runner installed is a check that goes yellow on a machine where the runner is
the thing being routed around. **Do not test by editing the constants**, which is precisely what the
hand demonstration had to do and precisely what a committed check must not. **A child that never
started and a child that was started and killed are the two cases under test** — a fixture that
cannot tell them apart cannot express the failure, which is this file's oldest lesson (§ Fixture
assumptions in `plans/dispatch-retro.md`). **The exit codes are read by two agent files and by
`tools/README.md`**; if a decision here changes one, it changes all of them in the same sitting.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/dispatch-retro.md`
  - `tools/README.md`
  - `tools/codex-invoke.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The precedent the work order names, and it is worth reading closely rather than glancing at:**

- **`tools/wo-gate.mjs`, the `self-check` section** — the block comment at `// ----- self-check`
  (around line 1417) and `selfCheck()` (around line 1579). It is the same job in the same suite:
  standing proof of gates that were once proved by hand and lost. Four of its decisions are load-
  bearing here and are *stated as decisions*, so adopt them or say why not: the fixture is a **temp
  copy**, never the repository; every write goes through one guard that refuses any path inside the
  repo, with no `--dry-run` escape in that guard on purpose; the fixture is **synthetic** so it cannot
  go stale or be spent; and the run **prints what it does not cover**, because a green check trusted
  for what it never touched is worse than no check.
- **`tools/wo-gate.mjs` around line 2308**, the `--against <path>` comment. It exists for *exactly*
  this row's Acceptance line 4: *"the harness and the subject are separable, and the subject defaults
  to this file."* Separating them is how "deleting a gate turns the check red" gets **shown** without
  a single byte written into `tools/` — which is the only way lines 3 and 4 are satisfiable at the
  same time. Reach your own conclusion, but if you invent a different mechanism, say in the result
  file why this one did not serve.
- **`plans/verification-tooling.md`** — the harness reasoning, and specifically why a self-check is a
  flag in the file it checks rather than a `tools/wo-selfcheck.mjs`. The work order leans on this to
  say it is *not* WO-2.38's second-harness question.
- **`.claude/dispatch/WO-2.37-result.md`** — the dispatch that built both gates. The measured
  discriminator (`ETIMEDOUT`/`SIGTERM` vs `ENOENT`/`null`, and the sleeping `process.execPath` as the
  stand-in child) came out of its correction round. **Do not re-derive it**; the work order says so.
- **The three readers of these exit codes, since the Traps make them one edit:**
  `.claude/agents/work-order-orchestrator.md` (steps 2b and 4), `AGENTS.md`, and `tools/README.md`.
  Grep them for `exit 2` / `exit 3` before you change any exit code's meaning. If your answer to
  either adjacent finding moves a code, all of them move in this dispatch or none do.
- **`plans/dispatch-retro.md` § Fixture assumptions** — named in the Traps. The failure mode is a
  fixture that cannot express the failure it exists to catch.

**One note on § 4 below.** The Acceptance names `node tools/wo-sweep.mjs` green and
`git diff --stat -- src/` empty; it does not name `verify-shell.mjs`, and this work order should touch
no app file at all. Run the sweep. If you find yourself with a reason to run the browser harness, that
is a signal you have edited something outside `tools/` — read the diff before you continue.

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

1. Every caller-side refusal in `codex-invoke.mjs` is driven and asserted on **both** its exit code and a distinguishing phrase of its message, in one run, with no Codex process spawned.
2. The started-then-killed branch reports exit **3** against a stand-in child, and a never-started child still reports exit **2**, in that same run. The two cases are distinguished by `signal`, not by the error code's name.
3. Nothing the check writes reaches `tools/`, `src/` or `index.html` — no constant is mutated and restored, at any point, by anything committed. **This is the acceptance line with a scar behind it:** the hazard WO-2.37 exists to name is a mutation left in the tree by a run that died.
4. Deleting any one of those gates, or inverting its condition, turns the check red — shown, not argued. A self-check that passes whether or not the thing it checks exists is this row's own failure repeated inside itself.
5. The two adjacent findings above are answered in writing, and anything fixed in answering them is covered by the run.
6. `node tools/wo-sweep.mjs` is green and `git diff --stat -- src/` is empty.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

