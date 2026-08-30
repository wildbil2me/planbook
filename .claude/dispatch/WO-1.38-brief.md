# WO-1.38 — the verifier is spawned on the far side of the implementer's spend · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.38-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude **Opus**, on its own merits. The deciding signal is that the
deliverable *is* the dispatch pipeline's convention — it rewrites `.claude/agents/work-order-orchestrator.md`
§ 5/§ 6 and `AGENTS.md`, and it adds a fourth status to a vocabulary whose 🔨/🤖 split already cost
WO-3.11 to get right; four of the five Traps are judgment rather than mechanics, and everything after
this work order copies whatever it decides. Runner-up I set aside: the `tools/wo-gate.mjs` half read
alone is Codex-shaped — a status constant, a `next` branch, a refusal, some `--self-check` plants,
all mechanically checkable — but the glyph choice and the wording of the refusal are exactly what
ROUTING § "Route to Claude" holds back, so no Codex probe was run.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.38 — the verifier is spawned on the far side of the implementer's spend

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-30 · **Size** S · **Depends on** — · **Blocks** nothing by name;
it protects every dispatch after it
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.37
made. Booked 2026-08-30, owner-directed, out of a transcript audit of all 124 dispatches this
project has run. The findings are in [`../session-limits.md`](../session-limits.md).)*

**Why it exists.** Ten dispatches carry a session-limit death, and **every one of them died at a
handoff** — the parent's first API call after a child returned:

| WO | Where it died |
|---|---|
| WO-1.4 | orchestrator, mid-run, while the implementer kept working |
| WO-2.46 | step 5, moments after spawning the verifier |
| WO-3.26 | between the implementer's writes and any verdict |
| WO-4.2 | between the last write and anybody's first reading |
| WO-4.4 | between the last write and verification |
| WO-4.5 | at the handoff to the verifier |
| WO-5.1 | at the handoff to the implementer's return |
| WO-5.2 | between the implementer's return and the verifier's spawn |
| WO-5.3 | at the handoff to its verifier |
| WO-5.4 | at the handoff back from the implementer |

**Six of the ten are the implementer/verifier seam.** That is mechanical rather than unlucky: the
seam is where the parent resumes carrying the largest context it will ever hold, immediately after
the child has spent the window. § 3b already records that orchestrators carry a session-limit
message in 22% of runs against 11% and 10% for the other two roles, and reads it as *the
orchestrator idles longest*. The cost data says something sharper — the orchestrator is **15.3%** of
a dispatch's spend and the implementer **69.3%**. The role that dies twice as often as the others
spends a fifth as much. **It is not dying of its own consumption.**

**And the seam is already proven to survive a break.** WO-5.2 and WO-5.4 both had the verifier
re-dispatched alone, cold, against a recovered tree, and both returned real verdicts — WO-5.2's
found a defect nobody else had. The verifier is *built* for cold eyes; it is the one role whose
value does not depend on having watched the build.

**The shape to build.** The verifier is dispatched from a **fresh session, always** — the owner's
call on 2026-08-30, uniform rather than size-gated, because `Size` does not predict cost (WO-1.39's
own table: Size S ran 6.8–13.3M units and Size M ran 7.2–15.7M, overlapping almost entirely). § 5
of [`work-order-orchestrator.md`](../../.claude/agents/work-order-orchestrator.md) stops at *the
implementer returned and the status line is written*; the verifier is a new dispatch. A planned cold
start is strictly better than the accidental one the quota has imposed ten times.

**This creates a state the trackers cannot currently express**, and that is the real deliverable: a
row that is `🤖 CLAIMED` with **nothing in flight and a finished implementer behind it**. Today that
reads as an abandoned claim — § 2c says an abandoned claim hides a work order from `next` while the
tracker looks healthy, and `next` names claimed rows as the cue that one is stale. Under this rule
that cue fires on healthy rows, routinely.

**Out of scope.** Renegotiating § 4b. It forbids *reporting on a child that has not returned*, and
nothing here touches that: the child has returned and been recorded before anything moves. What
moves is only when the next child is spawned. Also out of scope: the armed-mutation window, which
this does not narrow by one turn — see the third trap.

**Traps**

- **`--release` on the new state would throw away a finished implementer's work.** Someone reads the
  stale-claim cue, releases the row to `⬜`, and a tree full of complete unverified work is now
  unclaimed and unremembered — WO-3.26's *artifacts read as finished work* arriving from the
  opposite direction. The new state must be told apart from an abandoned claim **by the tool**, not
  by whoever is reading.
- **The verifier is a first pass and must be told so in as many words.** WO-2.46's scar exactly: a
  fresh verifier that finds traces of a run which returned nothing will try to reconcile with them.
  The implementer's self-claims are handed over as *claims to check*, never as findings to confirm.
- **This does not cover the mutation round, and must not be read as covering it.** The armed window
  is inside the implementer's run and is exactly as long as it was. WO-5.1 and WO-5.4 both died
  holding a live mutation, and a later verifier is no help to a tree that is already dangerous.
  `grep -rn MUTATION` stays the first move on every dead dispatch, tidy or not.
- **§ 6's tense test still governs the boundary report.** The report written when the implementer
  returns says the verifier is **owed**, never that the work verified. A boundary is a good place to
  write a spawn-time report by accident, which is the WO-3.5 defect this pipeline was built out of.

**Acceptance**
- [ ] § 5 of `.claude/agents/work-order-orchestrator.md` says the verifier is dispatched from a fresh
      session on **every** work order, and § 6 says the report at that boundary names the verifier as
      owed.
- [ ] `AGENTS.md` carries the same rule — the two must never drift apart, and this one is a rule.
- [ ] A row whose implementer has returned and whose verifier is owed is a state `wo-gate.mjs`
      writes and reads, distinct from both an in-flight claim and an abandoned one.
- [ ] `next` skips such a row and **says which of the three it is**, in the same shape it already
      prints a skipped 🔨 and a skipped 🎒.
- [ ] `--release` on that state refuses, or warns naming the result file it would orphan; the
      refusal is driven and proved, not asserted in a comment.
- [ ] `--self-check` is green with a plant behind each new check and its own count up by that many.
- [ ] `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Open these as well:

- **`plans/session-limits.md`** — the transcript audit of all 124 dispatches that this work order and
  WO-1.39 were booked out of. It is the evidence behind the table in § Why it exists.
- **`tools/wo-gate.mjs`** — one file, ~3,280 lines, and its header comment block is the design record
  for the status vocabulary you are extending. Read **WO-3.11's paragraph at the top** (why 🔨 and 🤖
  were split, and why `--release` touches exactly one of them) and **WO-1.35's `🎒` section around
  line 489** before choosing anything. The four places that will need you: `STATUSES` (~95),
  `reportSkips()` / the `next` loop (~829–865), `--start` (~988) and `--release` (~1046), and
  `selfCheck()` (~2092).
- **`.claude/agents/work-order-orchestrator.md`** § 5, § 6, § 4b and the last Standing rule.
- **`AGENTS.md`** — `CLAUDE.md` § "How work is run here" makes this mandatory, not optional:
  *a rule changed in one is changed in the other in the same sitting.*
- **`plans/work-orders/ROUTING.md`** § "The pipeline" — it describes the three-agent sequence in
  prose. Judge for yourself whether it now says something false; if it does, that is in scope.

### Five things you would otherwise find the hard way

1. **The glyph is the owner's to change and the behaviour is not** — WO-1.35's precedent for `🎒`,
   stated in `CLAUDE.md` § Commands. Pick a defensible one, say in your result file *why* that one,
   and say plainly that it is the owner's to overrule.
2. **The orchestrator file states its own line count in its last Standing rule and instructs you to
   correct it in the same edit. It currently reads 354 and the file is 412 lines** — already stale
   before you touch it. Leave it stating the true post-edit count. The rule's own text says why a
   length rule that misstates the length is the first rule a reader discounts.
3. **The new state has to answer to more than `next`.** Decide and state what it does under
   `--audit`, under `--tick` (does the verdict path still work from it, or must it pass through
   something first?), and as a **dependency** on another work order's gate report — `🤖 CLAIMED`
   blocks there today, and a state that silently unblocked would be a defect nothing in the
   Acceptance list catches.
4. **Trap 1 is the whole reason the state exists**: an abandoned claim and a claim with a finished
   implementer behind it must be told apart **by the tool**, not by whoever is reading. Acceptance
   line 5 says the `--release` refusal is *driven and proved, not asserted in a comment* — that means
   an actual `--self-check` plant, not a code comment claiming it.
5. **Do not renegotiate § 4b, and do not narrow the armed-mutation window** — the Out of scope line
   and Trap 3 both say so. The child still returns and is still recorded before anything moves; all
   that changes is when the *next* child is spawned. `grep -rn MUTATION` stays the first move on a
   dead dispatch, and this work order must not be written as if it helps with that.

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

## 5. Done means these 7 lines, reported against one by one

1. § 5 of `.claude/agents/work-order-orchestrator.md` says the verifier is dispatched from a fresh session on **every** work order, and § 6 says the report at that boundary names the verifier as owed.
2. `AGENTS.md` carries the same rule — the two must never drift apart, and this one is a rule.
3. A row whose implementer has returned and whose verifier is owed is a state `wo-gate.mjs` writes and reads, distinct from both an in-flight claim and an abandoned one.
4. `next` skips such a row and **says which of the three it is**, in the same shape it already prints a skipped 🔨 and a skipped 🎒.
5. `--release` on that state refuses, or warns naming the result file it would orphan; the refusal is driven and proved, not asserted in a comment.
6. `--self-check` is green with a plant behind each new check and its own count up by that many.
7. `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

