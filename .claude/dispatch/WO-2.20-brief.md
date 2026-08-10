# WO-2.20 — the orchestrator must not report a spawn as a run · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.20-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus**, on the rubric's own merits — not a Codex fallback. The
deciding signal is that every deliverable here is prose in an agent definition whose value is in the
reasoning it preserves; `ROUTING.md` sends "produces teacher-facing prose" and "its Traps section is
about judgment, not mechanics" straight to Claude, and there is no external spec to implement
against. The runner-up consideration I set aside: it is size `S` with a five-line deliverable list,
which reads mechanical enough to look like a Codex row — but the mechanical part is one sentence and
the hard part is writing an instruction that a cold reader *cannot* follow the wrong way, which is
exactly the judgment the rubric reserves.

**One thing to hold while you work.** This work order edits the definition of the agent that
dispatched you. I dispatched you **synchronously and I am blocked on your return** — I will not write
a word of my report until your result file exists. That is the behaviour the work order is asking you
to make unavoidable for the next orchestrator that reads the file. You are, right now, inside the
loop you are fixing.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.20 — the orchestrator must not report a spawn as a run

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-10 · **Size** S · **Depends on** nothing — `.claude/agents/` and
the dispatch status-file convention both exist today · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-2.14, WO-2.15, WO-2.18 and WO-2.19
made.)*

**Not a go-live blocker, and in no ship.** Added 2026-08-10, out of WO-3.5's dispatch. It is at the
top of the running order anyway, ahead of WO-2.19, because it is the one thing on the board that
makes the *next* dispatch safer, and the next dispatch is imminent.

**Why it exists — the incident, in full, because the fix is small and the reasoning is the valuable
part.** On 2026-08-10 the `work-order-orchestrator` was dispatched on WO-3.5. Sixty seconds in it
returned a complete, confident report: the route with its reasoning, the claim written, the brief
written, and *"the implementer is in the background at Opus. Expect 20 to 40 minutes."* Every word was
true except the tense. It had **spawned** the implementer and returned; it had observed no work at all.

The coordinator, reading a finished-shaped report against a status file frozen at the dispatch line,
concluded the child had never launched — and re-dispatched. **It had launched. It was reading.** A
`work-order-implementer` on an L-sized work order reads the brief, the design mockup, the surfaces
document and six or eight source files before it writes anything: on WO-3.5 that was **21 minutes
between spawn and first write.** For those 21 minutes the status file does not grow, no result file
appears, and `git status` is unchanged — the three signals a watcher naturally reaches for, all of
them blind, all of them blind *longest on the largest work orders*, which are exactly the ones a
duplicate hurts most.

**Two implementers then built WO-3.5 concurrently for 19 minutes.** The tree survived — both lifted
`design/mockups/scores.html` and `plans/gradebook-surfaces.md` rather than inventing, so the halves
fit, `src/shell.js` imported exactly the six functions `src/scores.js` exported, and the ids matched.
That is luck resting on a shared brief, not a property of the system. It still cost both defects the
verifier found: each was a file asserting something about a file the *other* implementer owned, which
neither had opened.

**The root cause is one sentence: a report written at spawn time is indistinguishable from a report
written at completion.** Everything downstream — the false stall, the duplicate, the two defects —
follows from a reader being unable to tell those apart. Fix the ambiguity and the rest cannot happen.

**Deliverables**
- **`.claude/agents/work-order-orchestrator.md` does not emit its report until the implementer has
  returned.** If it spawns in the background, it waits — and a long flat stretch in the status file is
  explicitly *not* evidence of failure while it waits.
- **The status line it writes at dispatch says what is actually true**: `spawned, awaiting` rather
  than a duration prediction phrased as an observation. A predicted 20 to 40 minutes is fine as a
  prediction and misleading as a report.
- **The reading phase is written down where the next reader of that file will hit it** — that an
  implementer's first write is not its start, that 20+ minutes of silence is normal on an L, and that
  the mtime-shaped signals are blind for all of it.
- **A rule against re-dispatching a work order that already carries a `🤖 CLAIMED` line**, in the
  orchestrator's own instructions, whatever a status file appears to show. `--release` exists for a
  claim that is genuinely dead and it is a deliberate, named act; a silent second spawn is not.
- **The same reading applied to `work-order-verifier` and `work-order-implementer`** if either can
  report before its own children return. Do not assume it cannot — check.

**Out of scope** — a liveness or heartbeat mechanism, a progress protocol, anything that makes the
agents observable. That is a real and larger piece of work and this one must not become it. **The
cheap fix is to stop producing the ambiguous report**, not to build the instrument that would let a
reader see through it.

**Acceptance**
- [ ] The orchestrator's definition, read start to finish by someone who has not seen this note,
      cannot be followed in a way that reports before the implementer returns.
- [ ] The dispatch-time status line says the child was spawned and is awaited, and predicts a
      duration only in words that read as a prediction.
- [ ] The reading phase and the blindness of the file-based signals are stated in the file, with the
      21-minute measurement from WO-3.5 quoted as the evidence.
- [ ] The definition forbids re-dispatching over a live `🤖 CLAIMED` line and names `--release` as the
      only way a claim is cleared.
- [ ] `work-order-verifier` and `work-order-implementer` are each read and either fixed the same way
      or ruled unaffected in one sentence saying why.
- [ ] The next real dispatch after this lands produces a report that arrives when the work does.
      *(This is the only line that cannot be checked at the desk, and it is deliberately last: the
      failure it names took a full dispatch to surface.)*

---

## 2. Read these first, before writing anything

**Ignore the usual list — this work order touches no app code.** The brief generator scraped
`src/scores.js`, `src/shell.js`, `design/mockups/scores.html` and `plans/gradebook-surfaces.md` out
of the incident narrative in § 1. Those are named there only as *evidence of what the duplicate
dispatch cost*; nothing in this work order changes them, and you do not need to open them. Your
surface is `.claude/agents/` and the two `plans/` files that document the pipeline.

Read these, in this order:

1. **`.claude/agents/work-order-orchestrator.md`** — the file the work order is about. Read it start
   to finish before you change a line of it. The bug is structural: step 4 says "spawn the subagent…
   confirm that file exists before you move on," step 6 says "report" — and nothing between them says
   *wait*. Note also that step 3b already exists and already asks for a status trail; the work order
   is not asking you to invent that, it is asking you to make the trail's flat stretches legible.
2. **`.claude/agents/work-order-implementer.md`** and **`.claude/agents/work-order-verifier.md`** —
   deliverable 5 is explicit that you must *check* rather than assume. An implementer that shells out
   to a long command, or a verifier that spawns anything, has the same hazard. If neither can report
   before a child returns, say so in one sentence naming what you checked.
3. **`plans/work-orders/ROUTING.md`** — the pipeline table at the top, and § "Claiming comes first,"
   which is where the `🤖 CLAIMED` / `🔨 IN PROGRESS` split and `--release` are defined. Deliverable 4
   must agree with that section exactly; do not restate the glyph rules in a way that drifts from it.
4. **`plans/dispatch-retro.md`** — the standing home for *why* a dispatch rule exists. The
   orchestrator definition's own closing rule says "keep this file short… new lessons go to
   `plans/dispatch-retro.md`; only the imperative belongs here." **Honour that split.** The full
   WO-3.5 incident narrative belongs in the retro; what lands in the agent definition is the
   imperative plus the one measurement the work order names.
5. **`tools/wo-gate.mjs`** — skim `--start` / `--release` only, enough to be sure any claim behaviour
   you describe is what the script actually does. Do not change the script; this work order is about
   the instructions, not the tooling.

**A judgment call to name rather than make.** Acceptance line 6 cannot be closed by this run — it
names an event in the *next* dispatch. Leave it `- [ ]`. Whether it should carry a 👤 mark, or the
header should gain `**Owes**` per `ROUTING.md` § "Ticking follows the verdict," is a call to
**propose in your result file**, not to make quietly. Ticking it would be exactly the failure
`ROUTING.md` records at WO-1.8: a tick the implementer's own report could not point at evidence for.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

The standing block, inlined verbatim as every brief carries it. **Most of it is inert here** — this
work order writes no markup, no CSS and no storage, so the colour, touch-target, `localStorage` and
grade-math lines have nothing to bite on. The two that are live are the last two: **stay inside the
Out of scope line**, and **tick only what you can point at evidence for**. Read the rest as the
context you must not contradict in prose rather than as rules you will exercise.

The **Out of scope** line is the one most at risk on this work order. It forbids a liveness or
heartbeat mechanism, a progress protocol, or anything that makes the agents observable — and that is
precisely the fix an engineer reaches for when told "a reader could not tell a spawn from a
completion." The work order has already considered and rejected it: *"the cheap fix is to stop
producing the ambiguous report, not to build the instrument that would let a reader see through
it."* If you find yourself adding a polling loop, a heartbeat file, or a new tool, stop — that is a
proposed follow-up work order in your result file, not this one:

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

**Here these are regression guards, not proof.** This work order changes only Markdown under
`.claude/agents/` and `plans/`, so both commands should print exactly what they print on a clean
tree — run them to show you broke nothing, and say so plainly rather than presenting a green run as
evidence the deliverables were met. Neither harness can read an instruction file, and **do not add a
check that tries to.** The `verify-shell.mjs` note about the sandbox applies: if it reports it cannot
run, say so rather than reporting a pass.

The real evidence for lines 1–5 is the changed prose itself. Quote the lines you wrote, by file and
section, in your result file — that is what the verifier will read them against.

**Do not write a second harness** — if this work order needs a check `verify-shell.mjs` cannot make,
say so in your report as a proposed follow-up.

---

## 5. Done means these 6 lines, reported against one by one

1. The orchestrator's definition, read start to finish by someone who has not seen this note, cannot be followed in a way that reports before the implementer returns.
2. The dispatch-time status line says the child was spawned and is awaited, and predicts a duration only in words that read as a prediction.
3. The reading phase and the blindness of the file-based signals are stated in the file, with the 21-minute measurement from WO-3.5 quoted as the evidence.
4. The definition forbids re-dispatching over a live `🤖 CLAIMED` line and names `--release` as the only way a claim is cleared.
5. `work-order-verifier` and `work-order-implementer` are each read and either fixed the same way or ruled unaffected in one sentence saying why.
6. The next real dispatch after this lands produces a report that arrives when the work does. *(This is the only line that cannot be checked at the desk, and it is deliberately last: the failure it names took a full dispatch to surface.)*

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

