# Routing — which agent gets which work order

[`README.md`](README.md) says how a work order is used. This file says **who does it**: a Claude
Code agent or a Codex agent. It exists so the choice is a rule rather than a mood, and so the
reasoning is auditable after the fact.

The orchestrator (`.claude/agents/work-order-orchestrator.md`) reads this file every dispatch. If
you disagree with a routing it made, change the rubric here rather than arguing with the agent.

---

## The pipeline

Three agents, each with a different job and deliberately different powers.

| Agent | Does | Can write? |
|---|---|---|
| **work-order-orchestrator** | Checks gates, routes, writes the brief, dispatches, relays, applies verified ticks | yes |
| **work-order-implementer** *or* **Codex** | Builds the one work order it was handed | yes |
| **work-order-verifier** | Reads the work order cold, walks the Acceptance list, names what's next | **no** |

The verifier has no Write and no Edit on purpose. A verifier that can quietly repair what it finds
stops being a verifier and becomes a second implementer with nobody checking it. It also never sees
the implementation reasoning — it reads the work order fresh, so it grades what is on disk rather
than what someone meant.

The orchestrator does not grade its own dispatch. It chose the route and wrote the brief, which
makes it the wrong party to mark the homework.

**Ticking follows the verdict.** On a verifier PASS, and once you say go, the orchestrator applies
the ticks whose evidence is a command the verifier ran: the work order `Status`, the roadmap box,
the dashboard counts, and the 👤-free `TESTING.md` lines.

**The implementer may also tick as it goes, as of 2026-08-06** — see § "Implementers may tick" below
for what changed and why. **The verifier still never ticks**, and that is not the same rule wearing
a different hat: in a phase file the acceptance criterion **is** the checkbox, one line of text, so
write access there would let the judge reword the test it just failed. Its read-only tool grant is
what makes that impossible rather than merely discouraged.

Two things nobody closes on evidence they do not have. **👤 lines** need a real iPad and stay
`- [ ]` however good the desk-side evidence looks — a rule about hardware rather than about
authority, so retiring the implementer's tick ban left it untouched. **The `CHANGELOG.md` entry** is
prose about what a change means; draft it freely, but it lands on the teacher's say-so.

The rule this serves is the project's own — *do not tick a work order that is written but
unverified* ([`../ROADMAP.md`](../ROADMAP.md) → maintenance protocol). Note what it actually
conditions on: **verified**, not *human*. An earlier version of this pipeline read it as "no agent
may tick," which cost nothing until WO-1.1 passed clean and then sat with the dashboard reading `0`
done, because five hand edits are easy to postpone. A tracker that lies about what is finished is
the failure the rule was written to prevent, so the enforcement moved to where the evidence is.

---

## Implementers may tick — the rule that was retired, 2026-08-06

Every brief used to carry this, verbatim: *"Do not tick roadmap boxes, edit `plans/`, or touch
`CHANGELOG.md` / `TESTING.md` — the teacher does maintenance, after the verifier reports."* The
`work-order-implementer` definition stated it twice and called it "the one process rule this project
states twice." The verifier had a standing check enforcing it: *"Nothing was ticked. A box already
ticked when you arrive is evidence the verdict was pre-empted."*

**It was ignored by every implementer that had the opportunity, and enforcing it never once caught a
defect.** WO-1.7's commit ticked the full set. WO-1.8's did the same and drew a **FAIL** for it — a
FAIL whose own opening line reads *"All five Acceptance lines verify clean. The failure is on the
boundary rule, not the code."* That is a verifier run, and the correction round behind it, spent on
bookkeeping instead of on the accommodations screen it existed to grade.

The verifier that raised it asked for the decision to be taken once rather than re-litigated every
dispatch: *"either the brief's rule holds and this gets reverted, or the rule is retired and my
'nothing was ticked' check is retired with it."* **Retired 2026-08-06.** Implementers tick as they
go. A tracker that is current is worth more than a tracker that is ceremonially clean, and the
ceremony was generating FAILs that said the code was fine.

**What did not move with it, and must not be assumed to have:**

- **👤 lines still need a real iPad.** No agent has one. That is a claim about hardware, not about
  authority, and it survives this change completely.
- **The verifier still cannot write at all.** Different rule, sharper reason — see the pipeline
  table above.
- **A tick still has to be true.** WO-1.8's three 👤 lines were ticked by an implementer whose own
  result file listed them under "what I could not verify." That is the failure this ban was actually
  aimed at, and it is the part worth remembering. Those three stood only because the teacher
  confirmed on 2026-08-06 that she had run them by hand — had she not, they would have come back off.

---

## The one-line version

**Codex gets work that is fully specified. Claude gets work that requires judgment about what the
spec should be.**

Most of Planbook's work orders were written *with* the reasoning attached — the "Why it exists"
paragraph exists precisely because the constraints are non-obvious and easy to undo. A work order
whose value is in honoring that reasoning is a Claude job. A work order whose value is in correctly
implementing arithmetic already written down in [`../../docs/data-model.md`](../../docs/data-model.md)
is a Codex job.

---

## Route to **Codex** when the work order has all of these

- **The spec lives outside the work order and is complete.** Grade math, attendance counts, signal
  thresholds — the formula is in `docs/data-model.md` or the roadmap, and the job is to make code
  match it.
- **Acceptance criteria are mechanically checkable.** "Empty categories redistribute weight" can be
  verified by running it. "Colors match the style guide" cannot — that needs eyes.
- **No new visual language.** Either no UI, or UI that is a lift of a component already built.
- **It touches none of the sensitive surfaces** listed below.
- **Conventions already exist to follow.** Codex is good at matching an established pattern and
  worse at choosing one.

Typical shape: a pure module with a clear input and output. Store layer, grade engine, CSV parser,
percentage math, signal ranking, service worker cache plumbing.

## Route to **Claude** when *any* of these is true

- **The work order touches a sensitive surface.** Accommodations, medical, or plan data ·
  presentation mode · the merge-field resolver · backup and restore · OAuth scope decisions ·
  anything in `docs/FERPA.md`. These are the places where a plausible-looking implementation is a
  legal disclosure. Not delegated, ever.
- **It establishes a convention.** The first work order in a phase, the app shell, the file layout.
  Whatever it decides, everything after it copies.
- **It is a design-system lift from Roll Call!.** Requires reading another repo's design docs and
  exercising taste about what transfers. Cross-repo reading plus judgment.
- **It produces teacher-facing prose.** Install warnings, error copy, `CHANGELOG.md`, `TESTING.md`,
  docs. Suite voice is a thing you have or don't.
- **Its Traps section is about judgment, not mechanics.** "The style guide's 'colors inline, not CSS
  variables' reads like a mistake and is not. Don't tidy it." A model optimizing for clean code will
  tidy it.
- **Size is `L`, or the work order is ambiguous.** Split it or think it through first; don't hand
  sprawl to a second process.

## Ties go to Claude

Not because Codex is worse, but because the cost is asymmetric. A Codex run that quietly undoes an
architectural decision costs more to find and unwind than the Claude run costs to sit through. 🚩
go-live blockers in particular default to Claude unless they land squarely in the Codex column.

## Which Claude — the tier is a second question

**"Claude" is not one destination, and treating it as one is what made Phase 1 more expensive than it
had to be.** WO-1.4, WO-1.6 and WO-1.7 all landed in the Claude column *by fallback, not by rubric* —
every one was classified Codex on its own merits and moved only because the runner was down. They ran
on Opus anyway, because the fallback had exactly one address. That is **433,460 output tokens of
implementation, 36% of the phase's total**, spent at the top tier on work this file had already
judged not to need it.

So the route is two questions, and the second reads off the answer to the first:

| The work order… | Implementer | Because |
|---|---|---|
| routes to **Codex**, probe passes | Codex | unchanged |
| routes to **Codex**, probe fails | **Claude Sonnet** | the rubric already found no judgment in it; a down runner does not change the work |
| routes to **Claude** on its own merits | **Claude Opus** | it is there for one of the six reasons above, and every one of them is a judgment call |

The distinction to hold onto: **a fallback is not a re-rubricing.** A work order that reaches Sonnet
this way still has its Codex reasoning intact in the Because column, exactly as the ⏸ suspension kept
it. If a Sonnet fallback produces work the verifier fails twice, that is the signal to re-read the
rubric — not to quietly raise the tier and try again.

**The verifier is always Opus, and this is not a cost decision to revisit.** It is 23% of output and
looks like box-ticking, which is precisely what makes it the tempting place to save and the wrong
one. This pipeline's documented failure mode is *a confident pass over nothing* — three defects
escaped a green run in Phase 1 with Opus already reading them, and every real verifier catch was the
subtle kind: the fixture assumption that could not fail, the sweep blind to untracked stylesheets,
the zip cross-validated against three foreign readers. Noticing what is *absent* is the first thing
to degrade. The audit function is the last thing to make cheaper.

**The orchestrator stays Opus too**, for a duller reason: it is 10% of output, `wo-gate.mjs` and
`wo-brief.mjs` already took its mechanical half, and what remains is the one decision the entire
dispatch branches on. Small saving, concentrated risk.

**Mechanically, the tier is a spawn-time override, not a file edit.**
`.claude/agents/work-order-implementer.md` stays `model: opus` — the safe default — and a fallback
dispatch passes `model: sonnet` on the Agent call, which takes precedence over the frontmatter. A
downgrade should be a deliberate act named in the routing sentence, never a default someone forgot to
raise back.

## The runner's actual record: 0 for 4, then a fix

**WO-1.4, WO-1.6 and WO-1.7 all routed to Codex correctly by this rubric, and all three died at exec
time** — `codex-windows-sandbox-setup.exe: program not found`, helper failures across read,
`apply_patch`, and exec. None produced a line of code. The routing was right all three times; what
failed was the runner. The WO-1.12 probe (below) made it four, failing before a brief was even
written.

**Root cause found and fixed 2026-08-06.** `codex-windows-sandbox-setup.exe` and
`codex-command-runner.exe` live in `codex-resources\`, a directory sitting beside `bin\` inside every
installed standalone release — and that directory was never on `PATH`. `codex.exe` resolving on
`PATH` (from a separate launcher install) said nothing about whether its own helper spawns could
resolve by name, which is consistent with all four failures above. The fix is one line, set inline in
every Codex invocation rather than persisted to the registry (a persisted `PATH` write does not reach
a session already running when it was made, and a dispatch cannot tell whether it was):

```powershell
$env:PATH = "$env:USERPROFILE\.codex\packages\standalone\current\codex-resources;$env:PATH"
```

The `current` junction is used rather than a version string so the fix survives Codex's own
auto-updates. Verified with the project's own exec-time probe, twice, cleanly: **2 for 2 `SMOKE OK`**
on 2026-08-06, immediately after the run of 4 straight failures above. The fix and the probe both now
live in one script, `node tools/codex-invoke.mjs` (`--probe` / `--brief`/`--out`), so the same `PATH`
prepend backs the health check and the real dispatch instead of being retyped at each call site. Full
account in [`../dispatch-retro.md`](../dispatch-retro.md) § Codex; the orchestrator instructions that
invoke the script are
[`../../.claude/agents/work-order-orchestrator.md`](../../.claude/agents/work-order-orchestrator.md)
step 2b.

**This is what ended the suspension below.** That section had already written down its own exit
condition — one probe that writes a file — so the passing probe lifted it without anyone having to
remember to check, and the Ship 1 table's ⏸ marks came off in the same pass on 2026-08-06.

At WO-1.7 the failure was the cleanest of the three, and the most alarming: **`codex exec` exited
zero having written nothing.** A non-zero exit is a runner that failed. A zero exit with an empty
tree is a runner that failed and said it succeeded — which is why the probe checks for a file that
must exist rather than for an exit code.

**Treat this as a transient condition, not a standing fact about the machine.** `codex doctor`
reported healthy after WO-1.4, and a `--sandbox workspace-write` run completed normally later. The
orchestrator re-probes every dispatch rather than writing the route off.

But **`codex doctor` does not predict it**. At WO-1.6 it reported `16 ok · 0 fail · sandbox ✓` six
minutes before the exec that wrote nothing. Doctor reports *installation* health; a dispatch depends
on *exec-time helper* health. So the gate is now a real write — a `codex exec` that creates a file in
a temp directory under the same sandbox flags, checked for existence. The full account is in
[`../dispatch-retro.md`](../dispatch-retro.md) § Codex.

**If a third Codex dispatch fails at exec time**, the orchestrator says so in its report and proposes
moving the pre-routed table below to Claude until one run lands. That is the teacher's call, not the
orchestrator's — but two failures is a pattern and three is a decision.

### The decision, taken 2026-08-05

**The third failure came at WO-1.7, and the teacher made the call: every pending Codex row moves to
Claude until one Codex run lands.** The rows are marked *suspended* rather than rewritten, and each
one keeps the reasoning that put it in the Codex column, because **the rubric is not what failed and
must not be quietly edited to match a broken runner.** Restoring the table is a one-pass revert once
a probe writes a file.

The three completed rows are left exactly as they were routed. They are a record of a decision made
on the day, not a plan; rewriting them would erase the evidence this section is built on.

**What would end the suspension:** one `codex exec` that creates a file in a temp directory under the
dispatch sandbox flags. That is the probe the orchestrator already runs every dispatch, so the
suspension lifts itself the first time it passes — nobody has to remember to check.

**A probe bug found in the same run, and worth more than the routing decision.** The WO-1.7 probe
failed its first attempt on its *own* defect: it built a bare temp directory, and Codex refuses to
run outside a trusted directory, so it died with `Not inside a trusted directory` before exec was
ever reached. A probe that always fails is a probe that always re-routes — it would have condemned a
healthy runner forever while reporting it as broken, and the report would have looked exactly like
the three real failures above. The probe now runs `git init` in the temp directory first. This is the
third variant of that failure mode recorded in [`../dispatch-retro.md`](../dispatch-retro.md);
**a gate that cannot pass is worse than no gate, because it produces confident wrong answers.**

---

## Ship 1 — pre-routed

Advisory. The orchestrator still re-derives from the work order text; if it disagrees with this
table it says so and explains why.

| # | Work order | Route | Because |
|---|---|---|---|
| 1 | WO-1.1 Repo skeleton & docs spine | **Claude** | Establishes every convention; writes `TESTING.md` and `CHANGELOG.md` prose |
| 2 | WO-1.2 App shell & design frame | **Claude** | Cross-repo design lift; the inline-colors trap |
| 3 | WO-1.3 PWA install path & eviction warning | **Claude** | Teacher-voice warning copy is the deliverable that matters |
| 4 | WO-1.4 Year document store | **Codex** | Schema is fully specified in `docs/data-model.md`; mechanically verifiable |
| 5 | WO-1.5 Backup & restore | **Claude** | Sensitive surface — the backup carries accommodation data and must say so |
| 6 | WO-1.6 Classes & terms | **Codex** | CRUD against a settled schema, on conventions WO-1.2 established |
| 7 | WO-1.7 Roster & contacts | **Codex** | Same, plus paste-parsing — a well-defined transform |
| 8 | WO-1.8 Accommodations on the roster | **Claude** | The most sensitive data in the app |
| 9 | WO-1.9 Presentation mode | **Claude** | Sensitive surface; failure mode is disclosure to a classroom wall |
| 10 | WO-1.10 Home screen v0 | **Claude** | Answers "did the class not meet, or did I forget?" — judgment about what to surface |
| 11 | WO-2.1 Attendance registry: students × recent days | **Claude** | Size L, on the critical path, speed-of-use is a design problem |
| 12 | WO-1.13 Main-area views | **Claude** | Another design-system lift from Roll Call!, and it re-parents a screen the harness drives |
| 13 | WO-2.8 Hall passes: issue, hold, return | **Claude** | Another Roll Call! lift, and the persistence rule inverts the reference's own design |
| 14 | WO-2.3 Days off & pre-drops | **Codex** | Three-state logic, fully specified in `plans/rotating-schedule.md` |
| 15 | WO-2.4 Counts & attendance % | **Codex** | Pure arithmetic over recorded meetings |
| 16 | WO-G1 Ship 1 go-live rehearsal | **Claude** | A judgment call about whether to ship |

*(WO-2.2 was merged into WO-2.1 on 2026-08-06 and its row retired. It had routed **Codex** on
"small, bounded, follows WO-2.1's pattern" — reasoning that was sound for the work order as written
and wrong about the work order existing at all. The lesson is not about the route: a row that
follows another row's pattern that closely is a candidate for not being its own row.)*

**Suspension lifted 2026-08-06.** The three rows above sat as **Claude** ⏸ from 2026-08-05, when
Codex was 0 for 3 (then 0 for 4, counting the WO-1.12 probe), until the `codex-resources\` `PATH` fix
landed and the exec-time probe went 2 for 2 — full account in
[`../dispatch-retro.md`](../dispatch-retro.md) § Codex. The Because column never changed while
suspended, and it does not change now either: the reasoning that put these rows in the Codex column
was correct the whole time. Only the Route cell moved, both times. If a future Codex dispatch dies at
exec time again, the same mechanism applies — re-suspend the affected rows, mark them ⏸, and leave
the Because column alone.

**Later phases, at a glance:** WO-3.4 grade engine and WO-4.1 signal engine are the strongest Codex
candidates in the project — both are specified arithmetic with testable output. WO-3.8, WO-3.10, all
of Phase 5 (merge fields and outreach), and all of Phase 7 (OAuth scope) are Claude-only — that is a
property of the work, not a runner's record.

---

## What every Codex brief must carry

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
