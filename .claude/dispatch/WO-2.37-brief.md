# WO-2.37 — the Codex cap silently excludes any work order with a slow acceptance · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.37-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude at the Opus tier**: the deliverable is a change to
`ROUTING.md`'s own rubric plus a reasoned decision on a constant, which is convention-establishing
process prose — two of the Claude column's six triggers outright — and its Traps are judgment traps
("do not raise the cap to a number that makes the symptom go away") rather than mechanics. The
runner-up I set aside: size S, no `src/`, and a sweep-checkable Acceptance list all read Codex-shaped,
but the rubric does not get handed to the runner the rubric governs. No Codex probe was run, because
the route never reached the Codex column — **and note the irony you are being paid to remove: I did
this arithmetic by hand, unprompted, exactly as the work order says every orchestrator currently must.**

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.37 — the Codex cap silently excludes any work order with a slow acceptance

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-16 · **Size** S · **Depends on** nothing — `codex-invoke.mjs` and
`ROUTING.md` both exist today · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-2.14, WO-2.15, WO-2.18, WO-2.19 and
WO-2.20 made.)*

**Not a go-live blocker, and the runner is not broken.** Booked 2026-08-16 out of WO-2.34's dispatch.
`codex-invoke.mjs` works; its probe passed that day (`SMOKE OK`, exit 0). **Do not go looking for a
fault in the runner; there isn't one.** What is missing is anybody being told about a limit that
decides routes.

**Why it exists.** WO-2.34 was rubricked to **Codex** on the merits — spec complete inside the work
order, a byte-level precedent ninety lines up the same file, acceptance proved by mutation rather
than by eye, `src/` out of scope entirely. It was re-routed to Claude on **arithmetic**:
`verify-shell.mjs` was measured at 264s on that tree, its Acceptance needed one clean run plus three
mutation runs, and ~17.6 minutes of that leaves nothing inside `INVOKE_TIMEOUT_MS` — `20 * 60 * 1000`
at `tools/codex-invoke.mjs`, a hard cap — for reading the precedent or writing the check. The route
was decided correctly. **The problem is that it was decided by hand, once, by an orchestrator that
happened to do the multiplication.**

**`ROUTING.md`'s rubric has no input for it.** Every question the rubric asks is about the *work* —
is the spec complete, is there a precedent, is the acceptance mechanical, does it touch design. None
of them asks how long proving it takes. So the cap does not appear in the routing decision at all; it
appears, or fails to appear, depending on whether the person routing thinks of it unprompted. **Two
more work orders that hit this cap were booked the same day** — WO-2.35 and WO-2.36 both need two to
three full harness runs, and both carry the arithmetic in their Traps because there was nowhere else
to put it. Writing the same fact into every future work order by hand is the state this row exists to
end.

**The failure it produces is not a slow run, and this is the sharp end.** `runCodex()` passes
`timeout` to `spawnSync`, which **SIGTERMs the child** when it expires. Anything the run has already
written to the tree stays written. And the work orders this cap excludes are precisely the ones whose
method is *mutate · run · revert* — so the run most likely to be killed is the one holding a
deliberate mutation in `index.html` or `src/` at the moment it dies. **That is not a failed check; it
is a broken app with nobody watching**, discovered whenever somebody next reads a diff. WO-2.34's
brief named this risk in as many words and routed around it. Nothing in the tree names it.

**Deliverables**
- **The constraint written into `ROUTING.md`'s rubric as an input**, in the form the rubric already
  uses — harness runtime × runs the Acceptance demands, against the cap — so it is asked rather than
  remembered.
- **A decision on `INVOKE_TIMEOUT_MS` itself, with its reasoning**: raised, made per-invocation so a
  caller can buy what a work order needs, or deliberately left at twenty minutes with the route
  forced. Any of the three is acceptable. Leaving the number unexamined now that it is known to
  decide routes is not.
- **Something that states the exclusion rather than leaving it to be rediscovered.** A refusal before
  the run starts is worth more than a SIGTERM seventeen minutes in; if that is judged not worth
  building, write why where the orchestrator reads it.
- **The mid-run kill's effect on the tree, stated at `INVOKE_TIMEOUT_MS`.** The constant currently
  reads as a patience setting. It is also the thing that decides whether a half-applied mutation gets
  left behind, and the comment above it should say so.

**Out of scope** — re-routing any work order already dispatched, changing what `verify-shell.mjs`
measures or how long it takes, and the two key-check rows this was booked beside (WO-2.35, WO-2.36).
If the honest answer is that the cap stays and some work orders simply route to Claude forever, that
is a finding to write down, not a failure to fix.

**Acceptance**
- [ ] `ROUTING.md`'s rubric asks about the cost of proving the work, not only about the work, and a
      reader routing a mutation-proved work order is led to the multiplication rather than expected
      to invent it.
- [ ] The `INVOKE_TIMEOUT_MS` decision is written down with its reasoning, whichever way it went.
- [ ] The comment at `INVOKE_TIMEOUT_MS` says what expiry does to the working tree — SIGTERM, and
      whatever the run had already written stays written.
- [ ] If a pre-flight refusal was built, it refuses a dispatch whose stated run budget exceeds the
      cap and says so in one line — demonstrated, not described. If it was not built, the reasoning
      is written where the orchestrator reads it.
- [ ] `node tools/wo-sweep.mjs` is green and `git diff --stat -- src/` is empty — this work order
      touches tooling and prose only.

**Traps** — **The runner is not the subject.** The probe passed; a work order that ends up
"investigating Codex" has gone somewhere else. **Do not raise the cap to a number that makes the
symptom go away** — four harness runs fit in forty minutes and five do not, and the next slow
acceptance is a bigger number again; the deliverable is that the constraint is *visible*, whatever it
is set to. **A dispatch that times out is not a route that failed**, and the report should not read
like one. **This is the third row booked out of one dispatch** — read WO-2.35 and WO-2.36 first, and
note that both of them are among the work orders this cap would exclude.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/codex-invoke.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Also open these — most of this work order is reading:**

- **`plans/work-orders/ROUTING.md`, whole.** It is the primary deliverable's target. Note the *form*
  the rubric already uses: two bulleted columns ("Route to **Codex** when the work order has all of
  these" / "Route to **Claude** when *any* of these is true"), then "Ties go to Claude", then the
  "Which Claude" table. Deliverable 1 says "in the form the rubric already uses" — a new input has to
  read like the ones beside it, and has to be answerable by someone who has only read the work order.
  Decide deliberately whether the cost-of-proof question belongs as a Codex-column bullet, a
  Claude-column bullet, a row in the "Which Claude" table, or a short section of its own; say which
  you chose and why in your result.
- **`.claude/agents/work-order-orchestrator.md`, step 2 and step 2b.** This is "where the orchestrator
  reads" for Acceptance line 4's fallback clause. Two cautions if you edit it: its own standing rules
  carry a **line count** ("It grew 169 → 274 lines in one day … took it to **322**") and an explicit
  instruction to correct that number in the same edit — a stale count there is the failure that file
  names itself. And it says new lessons go to `plans/dispatch-retro.md`, only the imperative belongs
  in the agent file. Prefer making the rubric carry the reasoning and the agent file carry at most a
  pointer.
- **`plans/dispatch-retro.md` § Codex.** The narrative home for this class of lesson.
- **The three sibling rows in `plans/work-orders/phase-2-attendance.md`: WO-2.34, WO-2.35, WO-2.36.**
  The Traps require it. WO-2.34 is the re-route this row was booked out of; WO-2.35 and WO-2.36 both
  carry the same arithmetic hand-written into their Traps, and both landed on Claude. **They are your
  worked examples** — the rubric input you write should, applied to those three rows cold, produce the
  routes they actually got. Say in your result whether it does. WO-2.34's Acceptance line 5 records a
  measured `verify-shell.mjs` runtime (263s / 264s) that is the real number to reason from.
- **`plans/verification-tooling.md`** for why the harness costs what it costs.

**Three things to hold onto while you work:**

1. **A refusal must be demonstrable without a live Codex run.** Acceptance line 4 says *demonstrated,
   not described*. If you build a pre-flight check, it has to reject before `spawnSync` is reached, so
   the demonstration is a fast command with a printed line and an exit code — not a twenty-minute
   dispatch. If the demonstration would need a real runner, that is a signal the check is in the wrong
   place.
2. **`codex-invoke.mjs`'s header comment block documents exit codes 0 / 1 / 2 with sharp semantics**
   (1 = a runner verdict, 2 = could not run at all — a harness bug). Any new refusal path has to land
   somewhere in that scheme deliberately, and the header block must still be true afterwards. An exit
   code that makes a caller-side budget refusal look like a runner verdict would re-create, in the
   tooling, exactly the confusion this work order is removing from the prose.
3. **The work order explicitly blesses "the cap stays" as an outcome** — see Out of scope. Deciding to
   leave `INVOKE_TIMEOUT_MS` at twenty minutes is a pass, provided the reasoning is written down.
   Raising it to make the symptom go away is the named trap.

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

**Orchestrator note on which of the two to run.** Acceptance line 5 names `wo-sweep.mjs` and an empty
`git diff --stat -- src/`, and names `verify-shell.mjs` nowhere — deliberately, because this work
order changes prose and `tools/` only and the harness drives `index.html` and `src/`, neither of which
you may touch. So `wo-sweep.mjs` is required and `verify-shell.mjs` is not. If you find yourself
needing a harness run, stop: it means you have edited something line 5 says you did not. **A work
order about the cost of proving work should not spend 4.4 minutes proving a file it never opened.**

---

## 5. Done means these 5 lines, reported against one by one

1. `ROUTING.md`'s rubric asks about the cost of proving the work, not only about the work, and a reader routing a mutation-proved work order is led to the multiplication rather than expected to invent it.
2. The `INVOKE_TIMEOUT_MS` decision is written down with its reasoning, whichever way it went.
3. The comment at `INVOKE_TIMEOUT_MS` says what expiry does to the working tree — SIGTERM, and whatever the run had already written stays written.
4. If a pre-flight refusal was built, it refuses a dispatch whose stated run budget exceeds the cap and says so in one line — demonstrated, not described. If it was not built, the reasoning is written where the orchestrator reads it.
5. `node tools/wo-sweep.mjs` is green and `git diff --stat -- src/` is empty — this work order touches tooling and prose only.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

