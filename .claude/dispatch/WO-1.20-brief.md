# WO-1.20 — the retired phase-branch rule is still live in ROADMAP.md and TESTING.md · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.20-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude Opus, on the rubric's own merits rather than as a fallback — the
deciding signal is that this work order's central deliverable is an *undecided* judgment call (the
per-phase `Branch:` headers, which it explicitly refuses to pre-decide and asks you to settle and
justify), sitting alongside prose rewrites to the two documents every phase reads. Both of
`ROUTING.md`'s Claude triggers fire: "produces teacher-facing prose" and "its Traps section is about
judgment, not mechanics." The runner-up I set aside was Codex, since the Acceptance list is a grep
and an `--audit` and so reads as mechanically checkable — but a find-and-replace on "phase branch"
would strip exactly the historical notes the Traps section protects, and telling a live rule from a
historical record is the whole work order. WO-1.20 is not in `ROUTING.md`'s Ship 1 pre-routing table
(booked 2026-08-15, after it), so there is no pre-routing to agree or disagree with.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.20 — the retired phase-branch rule is still live in ROADMAP.md and TESTING.md

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-16 · **Size** S · **Depends on** WO-1.19
**Closes roadmap** Phase 1 → *(no box. Process, not app — same reasoning as WO-1.19, which this
finishes. Booked 2026-08-15.)*

**Why it exists.** WO-1.19 retired phase branches and rewrote the two files its Deliverables named —
`CLAUDE.md` and `plans/work-orders/README.md`. **It named two files and there were six.** The rule it
retired is still written down, in rule voice, in files every phase reads:

- **`plans/ROADMAP.md`, § Cross-cutting rules** — *"One integration branch `main`; phase branches
  `phase/<n>-<slug>`, so a shippable state always exists. Delete once merged."* This is the retired
  convention, stated as a standing rule, in the document that governs every phase. **It is the whole
  reason this work order exists**; the rest are smaller.
- **`plans/ROADMAP.md`, same section** and **`TESTING.md`, line 3** — both gate on *"before merging
  any phase branch."* There are no phase branches, so both now name an event that cannot occur.
  `TESTING.md`'s is the regression gate's **first sentence**, which makes it the copy most likely to
  be read by someone deciding whether to run the checklist at all.
- **`plans/work-orders/phase-8-packaging.md`** — *"nothing deploys while the work is sitting on a
  phase branch."* Inside a Cloudflare Pages setup note, describing a state that can no longer happen.
- **The `Branch: phase/<n>-<slug>` header on every phase file**, phase 1 through phase 8. **This one
  is a genuine judgment call and is deliberately not pre-decided here** — it reads as per-phase
  metadata rather than as an instruction, and phases 4 through 8 have not started, so their headers
  describe a plan rather than a lie. Decide it, act, and say which way you went.

**This is WO-1.19's own defect with a narrower blast radius**, and the same argument applies: a rule
every session reads and no session follows costs attention and buys nothing. WO-1.19's title —
*the convention is dead and still written down* — describes `ROADMAP.md` word for word.

**Why it was not folded into WO-1.19.** Its Deliverables named two files and its Acceptance graded
those two. Widening a work order past its own Acceptance during the dispatch is how scope stops being
reviewable, so the residue was reported to the owner and booked instead. That was the right call and
this is the other half of it.

**Deliverables**
- **`plans/ROADMAP.md` § Cross-cutting rules** no longer states the phase-branch convention as a
  standing rule, and its `TESTING.md` gate names something that can happen.
- **`TESTING.md` line 3** likewise — the regression gate says when to run, in terms that are true.
- **`plans/work-orders/phase-8-packaging.md`** no longer describes deploys waiting on a phase branch.
- **A decision on the per-phase `Branch:` headers**, written down with its reasoning either way.
- **Nothing re-argues the retirement.** It was decided in WO-1.19 on 2026-08-15; this work order
  points at that record rather than restating the case, and **must not reopen it**.

**Out of scope** — the branching shape for Ship 3, which WO-1.19 explicitly left undecided and which
is the owner's call, not a documentation cleanup's; anything on `origin`; `CHANGELOG.md` history,
which records what was true when written and is not edited to match later decisions.

**Acceptance**
- [ ] `grep -rn "phase branch\|phase/<n>" plans/ROADMAP.md TESTING.md` returns nothing that states or
      assumes the retired convention.
- [ ] No file in the repository instructs a reader to work on, merge, or wait on a phase branch.
      *(`CHANGELOG.md` and closed work orders are history and are exempt — they record what was true
      when written.)*
- [ ] The per-phase `Branch:` headers were decided deliberately, and the reasoning is written down
      wherever they ended up.
- [ ] `node tools/wo-gate.mjs --audit` passes.

**Traps** — **Do not reopen the decision.** This is cleanup after a call the owner already made; a
dispatch that re-argues revive-versus-retire has failed the work order. **Do not edit `CHANGELOG.md`
to match** — entries record what was true when written, and rewriting them to agree with a later
decision destroys the only record of the change. **Do not delete the historical notes**, in
`README.md` or the phase files, that describe work having landed on a phase branch; that happened,
and it is the evidence WO-1.19's reasoning rests on. Tense, not deletion.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/ROADMAP.md`
  - `plans/work-orders/README.md`
  - `plans/work-orders/phase-8-packaging.md`
  - `tools/wo-gate.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Also open these — they are the decision record and the model for the voice:**

- **`plans/work-orders/phase-1-shell-store-roster.md` → WO-1.19**, the work order immediately above
  this one in the same file. It is the record of the retirement: what was decided, on whose call,
  on what date, and — in its own Traps and its option-(a) note — what was deliberately *not*
  decided. **Point at it; do not restate its argument.** WO-1.20's first Deliverable bullet and its
  first Trap both say the same thing: a dispatch that re-argues revive-versus-retire has failed.
- **`CLAUDE.md` § Conventions → the Git bullet.** WO-1.19 rewrote it, and it is the canonical
  phrasing of the retirement — including the parenthetical that says this fits how the current
  sprint is worked and *does not settle branching*. Your edits to `ROADMAP.md` and
  `TESTING.md` should read as the same decision stated by the same author, not as a second opinion.
  It is also the model for the "tense, not deletion" move: it keeps the history of the eighteen
  interleaved commits while stating the rule in the past.
- **`plans/work-orders/README.md`**, the other file WO-1.19 rewrote — same purpose.

**Three notes on scope and evidence, so you do not have to guess:**

1. **The sweep is wider than the Acceptance line's grep.** Acceptance line 1 greps two files;
   line 2 says *no file in the repository*. Search the whole tree, then sort every hit into three
   piles — a live rule (fix it), a historical record (leave it, or move it to past tense), or a
   decision record like WO-1.19 and `CHANGELOG.md` (leave it strictly alone). Report the piles.
   `CHANGELOG.md` and closed work orders are exempt by the Acceptance line itself.
2. **The `Branch:` header decision is yours to make and yours to justify.** The work order gives you
   the argument on both sides and stops there. Whichever way you go, the reasoning has to be written
   down *where the headers ended up* — a reader hitting a phase file needs to find it without
   knowing this work order exists.
3. **This work order touches no app code**, so `verify-shell.mjs` has nothing of yours to measure.
   Run it anyway to show you broke nothing — but if it cannot run in your environment, **say
   "could not run" plainly rather than reporting it green or ticking a box on it**. That is a
   reported environment, not a result, and the owner re-runs it locally. `wo-sweep.mjs` and
   `wo-gate.mjs --audit` are the two that actually bear on this work order; `--audit` is Acceptance
   line 4 and must be green with its output quoted.

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

1. `grep -rn "phase branch\|phase/<n>" plans/ROADMAP.md TESTING.md` returns nothing that states or assumes the retired convention.
2. No file in the repository instructs a reader to work on, merge, or wait on a phase branch. *(`CHANGELOG.md` and closed work orders are history and are exempt — they record what was true when written.)*
3. The per-phase `Branch:` headers were decided deliberately, and the reasoning is written down wherever they ended up.
4. `node tools/wo-gate.mjs --audit` passes.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

