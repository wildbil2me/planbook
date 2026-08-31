# WO-1.41 — the two files that must never drift apart are held together by nothing · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.41-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude **Opus**, on `ROUTING.md` § "Route to Claude" — *its Traps section is
about judgment, not mechanics*. Four of the five traps are about which differences between these two
files are correct, and the work order states outright that the shared-rule set cannot be inferred from
the prose; it also writes pipeline prose in suite voice. Runner-up set aside: the mechanical half is
Codex-shaped — a second entry in an array WO-1.40 built to take one — but the plumbing is not where
this work order's value is.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.41 — the two files that must never drift apart are held together by nothing

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-30 · **Size** M · **Depends on** WO-1.40 · **Blocks** nothing by
name; it protects every dispatch after it
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.40
made. Booked 2026-08-30, owner-directed, in the sitting that landed WO-1.38 and booked WO-1.40.)*

**Why it exists.** `CLAUDE.md` § "How work is run here" states it in bold — *"The two files must
never drift apart: **a rule changed here is changed there in the same sitting**"* — and **nothing
enforces it.** A grep over `tools/*.mjs` finds two mentions of `AGENTS.md` and neither is a check:
`wo-brief.mjs:117` picks which of the two to hand an implementer by route, and `wo-sweep.mjs:197` is
a comment explaining why prose is *excluded* from the dark-mode grep. The rule is held by discipline
alone, and WO-1.38 is the demonstration that discipline loses to a pipeline change: six files moved
and one was forgotten, in the same week.

**It is WO-1.40's defect on a surface an order of magnitude larger.** There it is 53 lines of
`wo.md` against one agent file, with a handful of shared claims. Here it is **200 lines of
`AGENTS.md` against 613 of `CLAUDE.md`**, and the shared rules are not one to one — accommodations,
the log's append-only property, the threshold defaults, the 👤 rule and the dispatch recovery
procedure all appear in both, in different words and at different lengths, on purpose.

**Why it depends on WO-1.40 rather than duplicating it.** These two files are at the repository root
and the sweep **already walks them** — only `.claude/` is in `IGNORE_DIRS` — so the half WO-1.40 has
to invent for itself, reaching an ignored path, is not needed here. **What carries over is the
comparison**, which is the hard half and the half worth building once. If WO-1.40 hard-codes a single
pair, this work order pays to undo that; if it takes a pair, this is a second entry and a fixture.
That is the whole reason this row is booked before WO-1.40 is built rather than after.

**Out of scope.** Auditing whether the two files have *already* drifted. That is a reading, and a
person's; this builds the instrument that would say so. If the instrument's first run finds real
drift, that is a finding to hand back — **not a licence to edit either file to make the check pass**,
which would be the tool silently correcting a summary that `wo-gate.mjs:1316` already forbids in the
one place it could have.

**Traps**

- **Most of the difference between these files is correct, and here it is the majority of both.**
  `AGENTS.md` is the dispatched agent's file and `CLAUDE.md` is the repository's: the architecture
  reasoning, the Roll Call! pointers, the status line, the scars and the roadmap links have no
  business being repeated into a briefing document, and a check demanding symmetry fails on nearly
  every line of both. WO-1.38's verifier already named the correct reading for the pair —
  **narrower telling, not drift.**
- **The rule is about rules, not text, and the two are deliberately worded differently.** WO-1.21
  narrowed a flat *"cannot run in a sandboxed agent"* in both files on the same day **so that they
  would say one thing without saying it identically** — a rule that calls a true report impossible
  teaches its reader to disbelieve one. A string-equality check would go red on that repair, which is
  the repair working.
- **This work order edits a file § 21 already watches, and that is new.** The folded repair to
  `.claude/commands/wo.md:49-53` is inside `wo-sweep.mjs` § 21's own watched pair, so a rewrite there
  can make the sweep go `REVIEW` **on the run that proves your change works** — while you are
  extending the same section. **Read that as the fence reporting, not as a regression to code
  around**, and do not touch § 21's allowlist to quiet it: settle the prose so the two files agree,
  then re-run. WO-1.40 never had this interaction — nothing had yet edited a watched file — so
  **re-run `wo-sweep.mjs` after the prose repair as well as after the code change**, and treat a
  green run taken only after the code change as not having tested the repair at all.
- **A `REVIEW` line that lists two hundred lines is a check nobody reads.** The sweep's existing
  review states name a bounded set and say what to do with it. Whatever this reports has to be small
  enough that a person actually reads it on the run where it matters.
- **The set of shared rules cannot be inferred from the prose, and pretending otherwise is the
  failure mode.** Any heuristic over two documents this size will both miss rules and invent them.
  A hand-maintained list of what the two files hold in common is the honest mechanism — it is a
  fourth thing to keep in step, and it is the only one small enough to be kept.

**Acceptance**
- [ ] The harness compares `AGENTS.md` and `CLAUDE.md` on the rules both are meant to carry, and goes
      red or `REVIEW` when they contradict — **driven against a planted contradiction**, not asserted.
- [ ] It reuses the comparison WO-1.40 built, extended to a second pair rather than reimplemented; if
      reuse was not possible, the reason is written where the second copy lives.
- [ ] Legitimate asymmetry stays green — proved with a fixture where `CLAUDE.md` carries a rule
      `AGENTS.md` has no business repeating, and nothing fires.
- [ ] The set of rules held in common is **named in one place a person can read and amend**, not
      inferred by the tool from prose, and that place says it is a fourth thing to keep in step.
- [ ] Whichever tool it lands in, that tool's plant or fixture count is up by the number of new
      checks and its self-check is green.
- [ ] `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

*(**Two prose repairs were folded in on 2026-08-30**, the owner's call, in the sitting that landed
WO-1.40. Both are stale sentences in files this work order already has open, and both were correctly
refused by WO-1.40's implementer and verifier as out of its scope — they are recorded here so they
are not done twice or forgotten.* **`.claude/commands/wo.md:49-53` still reads *"Nothing checks this
file … until WO-1.40 gives this a fence"*** *— WO-1.40 landed, so the sentence is false, and it is
false in the file a human types about the safety model of that file. Worth the care: it names a
fence that now exists as work still pending.* **And the WO-1.40 row in `plans/work-orders/README.md`
still says `.claude/commands/` is named nowhere, in the present tense** *— § "The pipeline's own
files" names it. Both are inside `wo-sweep.mjs` § 21's watched pair or the file that documents it,
so the repair proves itself.)*

- [ ] `.claude/commands/wo.md:49-53` no longer claims nothing checks it, and says what does.
- [ ] The WO-1.40 row in `plans/work-orders/README.md` reads in the past tense.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/work-orders/README.md`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/wo-sweep.mjs` **§ 21** (from its banner comment to the summary block) — the section you are
  extending. Read its banner in full before writing: it is WO-1.40's whole argument, and its
  `DRIFT_PAIRS` comment says in as many words that the list is a list *because WO-1.41 adds a second
  entry*. Every field you need is documented at the top of that block.
- `AGENTS.md` and `CLAUDE.md` — both in full. They are the subject.
- `plans/work-orders/README.md` § "The pipeline's own files" — the map § 21 asserts against, and the
  home of one of the two folded prose repairs.
- `.claude/commands/wo.md` — the other folded repair, lines 49-53.
- `tools/README.md` — the `wo-sweep.mjs` row records a hand-typed check count (`36` today). Acceptance
  line 5 is that number going up by the number of checks you add. Note the italic paragraph under it
  saying nothing checks that number; **that is WO-1.42's job, not yours** — bump it, do not fence it.

### Four things worth knowing before you start

1. **`wo-sweep.mjs` has no `--self-check` and no plant harness** — `wo-gate.mjs` does. So Acceptance
   line 5 reads, for this work order: the count in `tools/README.md` goes up by the number of checks
   you add, and `node tools/wo-gate.mjs --self-check` is green. Do not build a plant harness for the
   sweep to satisfy it.
2. **Acceptance lines 1 and 3 are "driven, not asserted."** Plant a real contradiction into `AGENTS.md`,
   run the sweep, watch it fire, revert. Then plant a legitimate asymmetry — a rule `CLAUDE.md` carries
   that `AGENTS.md` has no business repeating — run it, watch nothing fire, revert. Write down what you
   planted and what came back. **Revert every mutation before you write your result file**; five live
   mutations shipped under ticked boxes on WO-5.3 because a dispatch died mid-round, and
   `grep -rn MUTATION` is now the first move on any dead dispatch. If you are killed, the tree is what
   is judged.
3. **Your own edits can turn § 21 red on the run that proves your change works.** You are editing
   `.claude/commands/wo.md`, which is inside § 21's existing watched pair. That is the fence reporting.
   Settle the prose so the two files agree; **do not touch the existing pair's allowlist to quiet it.**
   Re-run `wo-sweep.mjs` after the prose repair *as well as* after the code change — a green run taken
   only after the code change has not tested the repair.
4. **The `REVIEW` line has to be short enough that a person reads it.** Two hundred lines of evidence is
   a check nobody reads. Whatever your pair reports on a real contradiction, keep it bounded.

### The judgment this work order is actually about

The claim list is hand-maintained and small on purpose. Candidates the work order itself names as
appearing in both files — accommodations, the log's append-only property, the threshold defaults, the
👤 rule, the dispatch recovery procedure — are *starting points to read*, not a list to transcribe. Pick
the few where a contradiction would actually cost something, anchor each to a sentence in the reference
file, and say in the code comment why the ones you left out were left out. **Fewer, well-chosen claims
beat a long list**: every entry is a fourth thing to keep in step, and the honest mechanism is the one
small enough to be kept.

Which file is `reference` and which is `against` is yours to decide and to argue in the comment. § 21's
existing pair anchors every `settled` pattern in the file that *grows by accretion* and requires nothing
of the file that gets rewritten wholesale. Ask which of `AGENTS.md` and `CLAUDE.md` has which property
here — the answer may not be the same shape as the first pair's, and if it is not, say so.

**Out of scope, from the work order and meant literally:** auditing whether the two files have already
drifted. If your instrument's first run finds real drift, that is a finding to hand back in your result
file — **not a licence to edit either file to make the check pass.**

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

## 5. Done means these 8 lines, reported against one by one

1. The harness compares `AGENTS.md` and `CLAUDE.md` on the rules both are meant to carry, and goes red or `REVIEW` when they contradict — **driven against a planted contradiction**, not asserted.
2. It reuses the comparison WO-1.40 built, extended to a second pair rather than reimplemented; if reuse was not possible, the reason is written where the second copy lives.
3. Legitimate asymmetry stays green — proved with a fixture where `CLAUDE.md` carries a rule `AGENTS.md` has no business repeating, and nothing fires.
4. The set of rules held in common is **named in one place a person can read and amend**, not inferred by the tool from prose, and that place says it is a fourth thing to keep in step.
5. Whichever tool it lands in, that tool's plant or fixture count is up by the number of new checks and its self-check is green.
6. `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.
7. `.claude/commands/wo.md:49-53` no longer claims nothing checks it, and says what does.
8. The WO-1.40 row in `plans/work-orders/README.md` reads in the past tense.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

