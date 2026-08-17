# WO-2.41 — the WO-3.15 mislabel lives only in a status file that says to delete it · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.41-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude Opus**, on the work order's own merits. The deciding signal
is that both deliverables are judgment: prose in this repository's own retro voice, plus a call the
work order deliberately refuses to make for you — three treatments of the stale exit-code sentence
are named as acceptable and choosing among them is the deliverable. `ROUTING.md` § "Route to Claude"
hits twice here, on "produces teacher-facing prose … docs" and on "its Traps section is about
judgment, not mechanics." The runner-up set aside: at size XS with a mechanically checkable
Acceptance line 4, this reads Codex-shaped on the surface — but a runner rewriting a dated retro
entry is precisely the "quietly undoes a decision, costs more to find than to sit through" asymmetry
the ties rule exists for. No Codex probe was run; step 2b applies to the Codex route only.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.41 — the WO-3.15 mislabel lives only in a status file that says to delete it

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-17 · **Size** XS · **Depends on** WO-2.37 · **Blocks** nothing
**Closes roadmap** *(no box. Documentation, not app — the same call WO-2.39 made.)*

**Not a go-live blocker, and the fault it records is already fixed.** Booked 2026-08-16 out of
WO-2.37's dispatch, which fixed it. This row is about where the account of it lives.

**Why it exists.** `plans/dispatch-retro.md` is where this project keeps the scar that produced a
rule — `CLAUDE.md` says so in as many words. The 2026-08-14 kill is not in it. The only account is
`.claude/dispatch/WO-3.15-status.md`, **whose own third line instructs the reader to delete the file
once the result file exists** — and the result file has existed since that afternoon. So the one
record of the worst dispatch failure mode this pipeline has is sitting in a file marked for deletion,
and the entry ends *"Proposed follow-up, not fixed here."*

**And § Codex now says two thirds of a scheme.** Its closing paragraph reads *"exit 1 is a runner
verdict, exit 2 is a harness bug"* — true when it was written, and WO-2.37 added exit 3 and re-scoped
exit 2 from *"a harness bug"* to *"never started"*. WO-2.37's implementer left the sentence alone
deliberately and said so on the record: it sits inside a past-tense narrative that ends *"Verified
2026-08-06"*, and editing a dated retro entry to describe today is its own kind of wrong. **That call
is the question this row settles rather than inherits.**

**Deliverables**
- **A § Codex entry for 2026-08-14** — what the kill actually did (seven files written, the run killed
  at the cap, exit 2 reported over 206 insertions), what it cost, and what the same event reports now.
  Written the way this file writes: the scar first, the rule it produced second.
- **A decision on the stale sentence.** Corrected in place, given a dated parenthetical, or left as
  history with the current scheme stated in the new entry and a pointer between them. Any of the three
  is acceptable; two accounts of the exit codes with nothing joining them is not.
- **The status file's instruction honoured or explicitly overridden**, once its content has a home.

**Out of scope** — any change to `tools/codex-invoke.mjs`, and any re-litigation of the exit-code
scheme itself. This row moves an account and settles a sentence; it decides nothing about the codes.
Also out of scope: the other dispatch status files in `.claude/dispatch/`, whatever their own first
lines say.

**Acceptance**
- [ ] `plans/dispatch-retro.md` § Codex carries the 2026-08-14 kill, with the numbers, and a reader
      arriving at it learns what exit 3 is for without opening another file.
- [ ] No sentence in that file describes the exit codes in a way that is false today, or if one is
      kept as history it is dated and points at the current account.
- [ ] `.claude/dispatch/WO-3.15-status.md` is either deleted on its own instruction or carries a line
      saying why it is being kept.
- [ ] `node tools/wo-gate.mjs --audit` is `PASS` and `git diff --stat -- src/` is empty.

**Traps** — **Do not rewrite the history to be about the fix.** The entry's value is what the failure
looked like from the inside on the day, which is why the status file's own wording is the best source
in the repository. **Do not quietly delete the "Verified 2026-08-06" narrative** — it is the record of
four probes and a fix, and it is still true about what it describes. **The retro is not a changelog:**
if the entry starts listing what WO-2.37 built, it has gone somewhere else.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/dispatch-retro.md`
  - `tools/codex-invoke.mjs`
  - `tools/wo-gate.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, in this order:

- **`.claude/dispatch/WO-3.15-status.md`** — 45 lines, and the Traps call it *"the best source in the
  repository"* for what the failure looked like from the inside. The kill is the entry dated
  `2026-08-14 19:33`; the two lines after it and the last four lines are what the failure went on to
  cost. Read the whole file before you compress any of it.
- **`plans/dispatch-retro.md` § Codex** (from `## Codex — four probes, a fix, and the first run that
  landed`, through the `### WO-2.4, 2026-08-08` subsection). Note the shape you are writing into: a
  dated narrative, scar first, rule second, with a `###` subsection used when one dated event earns
  its own heading. The sentence this row settles is *"exit 1 is a runner verdict, exit 2 is a harness
  bug"*, in the paragraph beginning *"It now lives in `tools/codex-invoke.mjs`"*, immediately above
  *"Verified 2026-08-06."*
- **`plans/work-orders/phase-2-attendance.md` § WO-2.37** — the row that added exit 3 and re-scoped
  exit 2. Read it for what the codes mean today; do not re-narrate what it built (third Trap).
- **`tools/codex-invoke.mjs`** — read-only here, and named in **Out of scope**. Read its exit-code
  handling so the new entry is accurate about the current scheme; change nothing in it.
- **`.claude/agents/work-order-orchestrator.md` step 2b/4 and `tools/README.md`** — the readers of
  the exit codes. You are not changing a code, so nothing has to propagate; open them only far enough
  to be sure your new entry does not contradict what they already say.

**On the two verification commands in § 4.** Acceptance line 4 names the ones this row is graded on:
`node tools/wo-gate.mjs --audit` and an empty `git diff --stat -- src/`. Run `node tools/wo-sweep.mjs`
as well — it is cheap and it reads `plans/`. `verify-shell.mjs` drives the app in a browser and takes
~4.4 minutes; if your change touches no file under `src/` or `index.html`, say so with the empty
diffstat as evidence and skip it, exactly as the WO-2.40 row above yours recorded doing. Report which
commands you ran and their output either way — "not applicable" stated with evidence is a result;
silence is not.

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

## 5. Done means these 4 lines, reported against one by one

1. `plans/dispatch-retro.md` § Codex carries the 2026-08-14 kill, with the numbers, and a reader arriving at it learns what exit 3 is for without opening another file.
2. No sentence in that file describes the exit codes in a way that is false today, or if one is kept as history it is dated and points at the current account.
3. `.claude/dispatch/WO-3.15-status.md` is either deleted on its own instruction or carries a line saying why it is being kept.
4. `node tools/wo-gate.mjs --audit` is `PASS` and `git diff --stat -- src/` is empty.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

