# WO-1.68 — the shared-box excuse says exact and matches a substring, and its mismatch branch is proved by nothing · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.68-result.md` — as your last act, and return it in-band too.

**Routing.** Claude Opus, on its own merits: it edits `tools/wo-gate.mjs`, a pipeline file, its
deciding act is a judgment (which way the comment and the code should agree, and why), and it owes
`TESTING.md` prose. The runner-up was Codex — the plants themselves are mechanical and XS — set aside
because the Traps are about judgment (no `amends` rule; do not reword the real excuse to suit a
plant), and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.68 — the shared-box excuse says exact and matches a substring, and its mismatch branch is proved by nothing

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-09 · **Size** XS · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.67 made.)*

**Booked 2026-10-09**, owner-directed, out of WO-1.67's verdict. A ride-along on `tools/wo-gate.mjs`:
fold it into the next sitting that has that file open.

**Why it exists.** WO-1.67 added `doublyClaimedBoxes()` and a `SHARED_BOXES` excuse list. Its
verifier passed it and named one gap: no `--self-check` plant tests whether an excuse is too loose.
Reading the code adds a second thing, and it is the one worth the row.

- **The comment and the code disagree.** The comment above `SHARED_BOXES` says the excuse is *"an
  exact roadmap-line match after norm(), so a rewording of the box drops the excuse and the box
  reports"*. The code is `norm(lines[line]).includes(norm(s.box))` — a substring test. A rewording
  that keeps the quoted words intact keeps the excuse. Harm today is close to nil, because only a box
  with two claimants is looked at and the claimant set must still match, but it is a comment that
  runs ahead of its code, which is the shape `plans/dispatch-retro.md` records.
- **The mismatch branch has no plant.** An excused box whose claimant set differs from the entry's
  (a third claimant, or a different pair) is reported, and so is an excuse whose box no longer has two
  claimants. The real tree exercises only the excused case, on every `--audit`; the other two are
  proved by nothing standing, only by WO-1.67's verifier mutating once.

**Deliverables**
- Make the comment and the code agree on how an excuse matches its box. Exact is the likelier answer,
  since it is what the comment argues for; decide it and say why where `SHARED_BOXES` is defined.
- `--self-check` gains plants for: an excused box with a third claimant (reported), and an excuse
  whose box has one claimant (reported as stale). If the match goes exact, a plant for a reworded box
  that keeps the excuse's words (reported).
- `tools/README.md`'s recorded self-check count, and the "NOT covered by them: SHARED_BOXES" lines in
  `--self-check`'s own output, updated to what is now covered.

**Acceptance**
- [ ] The comment above `SHARED_BOXES` and the matching code say the same thing, shown by quoting
      both in `TESTING.md` § WO-1.68.
- [ ] Each new plant is red under a mutation of the branch it covers, on a scratch copy, and every
      mutation is reverted before anything else is written.
- [ ] `node tools/wo-gate.mjs --audit` and `--self-check` pass, `node tools/wo-sweep.mjs` is green,
      and `tools/README.md`'s recorded counts match. The excused WO-2.1 / WO-2.10 box still reads
      excused on the real tree.
- [ ] `TESTING.md` § WO-1.68 carries these lines verbatim with the evidence for each.

**Traps** — **Do not add a rule for `amends`.** WO-1.67 excused the one case by name on purpose; a
rule would be a reading of the sentence, which its Traps refuse. **Do not touch the real excuse's
wording to make a plant pass.** **This changes `tools/wo-gate.mjs`, a pipeline file**: read
`plans/work-orders/README.md` § "The pipeline's own files" before editing it. **Nothing in `src/`
moves**, so no `CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/dispatch-retro.md`
  - `plans/work-orders/README.md`
  - `tools/README.md`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Pointers and traps the work order does not spell out** (orchestrator, read from the tree at
dispatch; check them, do not take them on trust):

- **Where it lives.** `tools/wo-gate.mjs` ~1764–1812: the comment above `SHARED_BOXES`, the const,
  and `doublyClaimedBoxes(wos, lines)` — the match is line ~1799,
  `norm(lines[line]).includes(norm(s.box))`. `norm()` is at ~1548. The `--self-check` prose naming
  what WO-1.67's plants do NOT cover is at ~5024–5025; find WO-1.67's two plants in the self-check
  body and follow their pattern for the new ones.
- **"Exact" is not free, and this is the decision the work order hands you.** The real roadmap line
  is `plans/ROADMAP.md:275`:
  `- [x] 🚩 Marking screen, **exceptions-only** — the *finished* document holds nothing but exceptions`.
  The excuse's `box` is `'Marking screen, exceptions-only'` — a fragment, not the line. A literal
  `norm(line) === norm(s.box)` would drop the real excuse and turn `--audit` red. So decide what
  "exact" compares (e.g. the whole normalised box text after the checkbox, or the excuse quoting it
  in full, or the same fragment resolution the claim walk itself uses via `roadmapHits()`), and write
  why at `SHARED_BOXES`. If you conclude substring is the right answer after all, the work order
  allows that too — then the comment changes, not the code, and the reworded-box plant is not owed.
  **Changing the excuse's `box` string is permitted only if the matching rule you chose requires it**
  — never to make a plant pass (Traps). Say which in `TESTING.md`.
- **`SHARED_BOXES` is a module-level const.** Plants need a way to feed an excuse list without
  editing the real one; the smallest seam (e.g. an optional parameter defaulting to `SHARED_BOXES`)
  is the expected shape. Do not restructure the check.
- **Counts.** `tools/README.md` records the self-check count and the `--audit` figures; grep it for
  the current number before and after. `wo-sweep.mjs` checks some of those figures, so a stale one
  turns the sweep red — that is the WO-3.26 shape.
- **Mutations.** On a scratch copy of `wo-gate.mjs` (in the scratchpad, not `tools/`), one mutation
  per new plant, each shown red. Mark nothing `MUTATION` in the real file. Revert before writing any
  other file, and leave no scratch file in `tools/`.
- Pipeline map: `plans/work-orders/README.md` § "The pipeline's own files" — read before editing.

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
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
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

## 5. Done means these 4 lines, reported against one by one

1. The comment above `SHARED_BOXES` and the matching code say the same thing, shown by quoting both in `TESTING.md` § WO-1.68.
2. Each new plant is red under a mutation of the branch it covers, on a scratch copy, and every mutation is reverted before anything else is written.
3. `node tools/wo-gate.mjs --audit` and `--self-check` pass, `node tools/wo-sweep.mjs` is green, and `tools/README.md`'s recorded counts match. The excused WO-2.1 / WO-2.10 box still reads excused on the real tree.
4. `TESTING.md` § WO-1.68 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.68 — it is a deliverable, not a permission.** Add `### WO-1.68 — the shared-box excuse says exact and matches a substring, and its mismatch branch is proved by nothing` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.68` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

