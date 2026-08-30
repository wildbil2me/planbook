# WO-1.40 — the file a human types is outside every fence · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.40-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at the **Opus** tier, on the work order's own merits — all four Traps
are about *what the check should assert* rather than how to code one (a line-count assertion is
explicitly rejected as an instrument that cries wolf; legitimate asymmetry must stay green; `REVIEW`
may be the honest verdict), which is `ROUTING.md`'s "Traps section is about judgment, not mechanics".
The runner-up was Codex: Size S tooling with a mechanically checkable Acceptance list reads
Codex-shaped, but the spec for *what counts as a contradiction* does not exist outside the work
order, and the Codex column's first requirement is that it does. No pre-routing table row covers
this one.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.40 — the file a human types is outside every fence

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-30 · **Size** S · **Depends on** WO-1.38 ✅ · **Blocks** nothing by
name; it protects every dispatch after it
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.39
made. Booked 2026-08-30 by WO-1.38's verifier, which reported it as a thing nobody had claimed, and
by the session that ticked WO-1.38 and confirmed it.)*

**Why it exists.** WO-1.38 changed the pipeline's shape in **six** files and wrote five of them.
[`.claude/commands/wo.md`](../../.claude/commands/wo.md) — the file a human types to start a dispatch
— still told its caller to relay *"the Acceptance list with each item marked verified / failed /
needs-a-human"* from a run that, under the new rule, deliberately returns no Acceptance list at all.

**The two instructions were in direct conflict, and the session in the middle had to resolve it.**
§ 6 of `work-order-orchestrator.md` says the boundary report *"does not say the work verified, it
marks no Acceptance list, and it relays no self-claim as a finding."* `wo.md` demanded exactly that
list, and pressed: *"do not summarize the Acceptance list; the marks are the point."* The only
material available to satisfy it is the implementer's self-claims — **which is the WO-3.5 defect
arriving one level above the orchestrator, in the one file with no agent standing between it and a
human.** The prose was corrected on 2026-08-30, directly, in the sitting that ticked WO-1.38, on the
same footing as the running-order corrections in `c43eef2` and `b3b0cd7`. **This work order is not
that repair.**

**It is the fence, and the absence of one is the finding.** `.claude/commands/` is named **nowhere**
in the work-order system: no work order references it, `--audit` never reads it, and
`wo-sweep.mjs:53` puts `.claude` in `IGNORE_DIRS` outright. That ignore is *correct for what the
sweep does* — § 2's own comment records that `.claude/` prose is excluded because every dark-mode hit
there is a **statement of the prohibition**, and the same holds for every other app-code claim in the
file. **Correct for app code is not the same as no check at all.** The contrast next door is the
argument: `work-order-orchestrator.md` carries a self-asserting line count precisely because somebody
knew agent files drift, and it had already gone stale once. `wo.md` carries nothing, and went stale
the first time the pipeline moved under it.

**Out of scope.** Un-ignoring `.claude/` in the sweep's file walk. Every § from 1 to 20 would begin
reading agent prose as app code, which is the thing § 2's comment exists to prevent. Also out of
scope: the wording of `wo.md` itself, which is already correct — this builds the thing that would
have caught it, not the thing it caught.

**Build the comparison to take a pair.** [WO-1.41](#wo-141--the-two-files-that-must-never-drift-apart-are-held-together-by-nothing)
was booked the same day and depends on this one: `AGENTS.md` and `CLAUDE.md` carry the same
never-drift rule with nothing enforcing it either, and they are a second instance of exactly this
check. **They need no path trick** — both sit at the repository root and the sweep already walks
them — so the half that carries over is the **comparison**, which is the half worth building once.
A single hard-coded pair is not a defect in this work order and will cost the next one a rewrite;
taking a pair costs nothing here.

**Traps**

- **A line-count self-assertion does not transfer from the file next door.** The orchestrator's works
  because that file grows by accretion; `wo.md` is short prose that is rewritten wholesale, so a
  count would go red on every legitimate edit and be deleted within two dispatches. **An instrument
  that cries wolf gets ignored at the moment it is right** — WO-1.39's own trap, in a second place.
- **The two files must be allowed to differ, and most of the difference is correct.** `wo.md` is the
  caller's file and the orchestrator's is the dispatcher's; the orchestrator-only rules have no
  business here, exactly as WO-1.38's verifier found for `AGENTS.md` and called *narrower telling,
  not drift*. A check demanding symmetry would force the pipeline to be restated a third time. **What
  is wanted is contradiction, not asymmetry** — and on prose only a person can reliably tell those
  apart, so `REVIEW` may be the honest state here rather than `PASS`/`FAIL`. The sweep already has
  one, and already prints *"greppable evidence, not a verdict"* over it.
- **Reach the file by path, not by widening the walk.** A one-line edit to `IGNORE_DIRS` is the
  obvious way in and pulls every agent file into all twenty sections at once.
- **A fence nobody is pointed at is the same defect one level up.** If the only record of this check
  is the check, the next pipeline change looks in `.claude/agents/` and stops there — which is what
  just happened. Something a person reads before editing the pipeline has to name this file.

**Acceptance**
- [ ] The harness reads `.claude/commands/wo.md` and goes red or `REVIEW` when it contradicts
      `.claude/agents/work-order-orchestrator.md` about the pipeline's stops — **driven against a
      planted contradiction**, not asserted in a comment.
- [ ] It gets there by naming the path: `.claude` stays in `wo-sweep.mjs`'s `IGNORE_DIRS` and the
      file walk is unchanged.
- [ ] Legitimate asymmetry stays green — proved with a fixture where `wo.md` omits an
      orchestrator-only rule and nothing fires.
- [ ] `.claude/commands/` is named in the work-order system's own map of what it watches, so the next
      pipeline change has somewhere to look before it edits.
- [ ] Whichever tool it lands in, that tool's plant or fixture count is up by the number of new
      checks and its self-check is green.
- [ ] `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, and each for a stated reason:

- `.claude/commands/wo.md` and `.claude/agents/work-order-orchestrator.md` — **the pair under test.**
  Read both in full before designing anything. The shared subject is *the pipeline's stops*: where a
  dispatch ends, who spawns the verifier, what the boundary report may and may not claim.
- `tools/wo-sweep.mjs` — § 2's comment on why `.claude` is in `IGNORE_DIRS` (line ~53, and the
  discussion near line 197), the file header's definition of `REVIEW` (line ~16), `check()` at line
  ~42, and an existing bounded-`REVIEW` section such as § 19 as a model for output that a person
  actually reads.
- `tools/README.md` — the `--self-check` paragraph, and wherever this tool's check/plant count is
  recorded. **A count recorded there and not updated is the one sweep line that goes red on work
  being done rather than wrong** (WO-3.26). If your work changes a count, change it in the same pass.
- `plans/work-orders/README.md` — candidate home for Acceptance line 4's map of what the work-order
  system watches. Pick where it goes on the Traps' own test: *something a person reads before editing
  the pipeline*.
- `plans/work-orders/phase-1-shell-store-roster.md` § WO-1.41 — the second consumer, already booked
  and depending on this. It needs the same comparison over `AGENTS.md` / `CLAUDE.md`, two files the
  sweep already walks. **Take a pair; do not hard-code one.**

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

## 5. Done means these 6 lines, reported against one by one

1. The harness reads `.claude/commands/wo.md` and goes red or `REVIEW` when it contradicts `.claude/agents/work-order-orchestrator.md` about the pipeline's stops — **driven against a planted contradiction**, not asserted in a comment.
2. It gets there by naming the path: `.claude` stays in `wo-sweep.mjs`'s `IGNORE_DIRS` and the file walk is unchanged.
3. Legitimate asymmetry stays green — proved with a fixture where `wo.md` omits an orchestrator-only rule and nothing fires.
4. `.claude/commands/` is named in the work-order system's own map of what it watches, so the next pipeline change has somewhere to look before it edits.
5. Whichever tool it lands in, that tool's plant or fixture count is up by the number of new checks and its self-check is green.
6. `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

