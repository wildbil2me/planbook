# WO-1.18 — the harness section comment miscounts its own checks · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.18-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude, Opus tier**. The deciding signal is Deliverable 2: it asks
for a recorded judgment on whether `wo-sweep.mjs` can catch section-header count drift — build the
check or write down why it is not worth building — which is an open question rather than a spec to
execute, in a harness this project has decided its prose *is* the reasoning. The runner-up I set
aside: Deliverable 1 is one word and its acceptance line is mechanically countable, which reads Codex
on the rubric; but a work order whose second half is unanswered is a tie, and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.18 — the harness section comment miscounts its own checks

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-15 · **Size** S · **Depends on** —
**Closes roadmap** Phase 1 → *(no box. Documentation drift inside the harness, found on 2026-08-12 by
the WO-1.15 verifier.)*

**Why it exists.** The section header at `tools/verify-shell.mjs:1860` opens *"Seven checks, and the
fixture is the whole argument"* over a section that holds **eight**. The count was right when it was
written and a check was added before the work order landed.

**Booked rather than fixed in passing, because this repository already treats harness
self-description as load-bearing.** WO-2.19 exists solely to check the harness's own check count, and
`wo-sweep.mjs` asserts that the `check()` call-site total matches the number recorded in
`tools/README.md` — currently 637, and it passes. A section header that miscounts is the same drift
one level below where any of that looks. The number is not important; a reader who finds it wrong
learns to skim the prose that carries the reasoning, and in this harness the prose is the reasoning.

**Size is the floor, not the estimate.** `S` ≈ a sitting and this is a word. It is booked so it is not
lost, and it is a natural pick-up alongside the next piece of harness work rather than a sitting of
its own.

**Deliverables**
- **The comment says eight.**
- **A judgment recorded, either way, on whether the sweep can see this class of drift** — a
  section-header count that disagrees with the `check()` calls beneath it is mechanically checkable,
  and the sweep already counts call sites per line. Do it or write down why it is not worth it; do
  not leave the question unasked.

**Out of scope** — renumbering or reorganising the section; any change to what the eight checks
assert; the two standing `wo-sweep.mjs` REVIEW items, which are read and dismissed each run on
purpose.

**Acceptance**
- [ ] The comment at `tools/verify-shell.mjs:1860` matches the number of `check()` calls in its
      section, counted rather than assumed.
- [ ] `verify-shell.mjs` still runs green at its then-current total, and `tools/README.md`'s recorded
      call-site count still matches — a comment fix must not touch either, and if it does, something
      other than a comment was changed.
- [ ] The sweep question above is answered in writing, in the work order or in `tools/README.md`.

**Traps** — **Do not "fix" the count by deleting a check.** **Do not renumber neighbouring section
headers to match a scheme** — the other headers are not known to be wrong, and a sweep that changes
twenty comments to fix one buries the fix in the diff that is supposed to show it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these — Deliverable 2 cannot be answered honestly without them:

- `tools/wo-sweep.mjs` — the sweep you are being asked to judge. Its existing check that reconciles
  the `check()` call-site total against the number recorded in `tools/README.md` is the closest
  precedent for the check Deliverable 2 asks about; read how it counts call sites before deciding
  whether it can be pointed at a section instead of at the file.
- `plans/work-orders/phase-2-attendance.md:1683` — **WO-2.19**, which exists solely to check the
  harness's own check count. Read it before you decide, so your answer says how a section-level check
  would relate to that one rather than silently duplicating or contradicting it.
- The section at `tools/verify-shell.mjs:1860` itself, and enough of its neighbours to see how these
  headers are written — for reading only. The Traps line forbids renumbering or reorganising them.

**Two notes on scope, since this work order is one word plus a decision.** First: whichever way you
answer Deliverable 2, the answer is a written one, and *"not worth it"* is a fully acceptable answer
if you can say why — the work order asks that the question not be left unasked, not that a check be
built. Second: if you do build a sweep check, it goes in `tools/wo-sweep.mjs` and it updates that
file's own recorded check count the way the sweep's other checks do. Do not start a third harness.

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

## 5. Done means these 3 lines, reported against one by one

1. The comment at `tools/verify-shell.mjs:1860` matches the number of `check()` calls in its section, counted rather than assumed.
2. `verify-shell.mjs` still runs green at its then-current total, and `tools/README.md`'s recorded call-site count still matches — a comment fix must not touch either, and if it does, something other than a comment was changed.
3. The sweep question above is answered in writing, in the work order or in `tools/README.md`.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

