# WO-3.81 — a missing mark on work filed under no category is listed nowhere · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.81-result.md` — as your last act, and return it in-band too.

**Routing.** Claude Opus, on its own merits: the deciding signal is that this changes what `src/merge-fields.js` reads for `{{missing.list}}`/`{{missing.count}}` — the merge-field resolver is a sensitive surface that is never delegated — and it also moves the concern list's missing-count input in `src/signals.js`. Runner-up set aside: Codex on the size (S, a union of two existing readers in four places); the sensitive surface excludes it outright, and the clean run plus two mutation runs (~13+ min) would be tight against its cap anyway.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.81 — a missing mark on work filed under no category is listed nowhere

**Ship** — · **Status** 🤖 CLAIMED — 2026-11-01 · **Size** S · **Depends on** WO-3.76 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-11-01, out of WO-3.76's verdict.)*

**Booked 2026-11-01**, owner-directed, out of [WO-3.76](#wo-376--n-to-grade-skips-work-filed-under-no-category)'s
survey (`TESTING.md` § WO-3.76). Four readers of missing work ask `openWork()`, which walks categories
only. That means a `missing` mark on uncategorized work is never named. In a points class that mark is
**in the grade as a zero**, so the grade drops and nothing says why:
- student detail's *Missing work* card (`missingCard()`)
- the student CSV's `Work` rows
- `{{missing.list}}` and `{{missing.count}}` (`src/merge-fields.js`), which go home to a guardian
- the signal engine's missing-count rule (`src/signals.js`)

**Deliverables**
- **The four readers take in the `missing` rows of `uncategorizedWork()`** beside `openWork()`'s,
  grouped or named under *no category* where a reader groups. Neither `openWork()` nor any projection
  is widened.
- **Ruled by the owner, 2026-11-01, before `--start`: it counts as missing everywhere, and it costs
  points only where the class charges them.** The question was: in a **weighted** class,
  uncategorized work is in no grade (the owner, 2026-10-23), so should its missing mark still count
  toward the concern list's missing rule and `{{missing.count}}`, or count in a points class only,
  where the zero is charged? **It counts in both kinds of class**: the card, the CSV,
  `{{missing.list}}`, `{{missing.count}}` and the missing-count rule all take it in a weighted class
  as in a points class. Three reasons:
  - **The missing rule asks whether work is being handed in, not what the grade is.** Falling grades
    and low scores have their own rules, and a missing mark on uncategorized work is still work not
    handed in.
  - **A count must agree with the list beside it.** The card lists the mark in either mode, so
    `{{missing.count}}` reading 2 over a list of three would be the screen disagreeing with itself,
    and the same mismatch would reach a guardian's email.
  - **Uncategorized is usually a filing slip.** Giving the assignment a category makes the mark count
    anyway, so counting it now keeps the concern list from depending on whether the gradebook has
    been tidied yet.

  **The limit that comes with the ruling**: in a weighted class nothing may treat the mark as costing
  points. No projection takes it in, and no sentence (a concern explanation, a merge field, a card
  line) may say or imply that it lowers the grade there. That half stays with `openWork()` and the
  grade engine, which already leave it out.
- **`src/merge-fields.js` keeps its whitelist untouched** (§ 20's five claims). The change is in what
  the resolver for an existing name reads, not in which names exist.
- **A mutation per reader that can go silently wrong**: at least the card and `{{missing.list}}`.
  Show each red and revert it before writing anything else.
- **Two gaps WO-3.80's verifier named, folded in because this row opens the same harness**
  (`tools/verify/uncategorized-to-grade.mjs`), owner-directed 2026-11-01: a fixture student with
  **both** a categorized and an uncategorized held blank, asserting the held card lists the
  categorized row first; and the queue check comparing held rows **in the order drawn**, not after a
  sort.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.81** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] In a points class, an uncategorized assignment marked missing is listed on student detail's
      *Missing work* card, in the student CSV, and in a draft using `{{missing.list}}`, each under or
      beside *no category*.
- [ ] In a weighted class, the same mark is listed on the card, in the CSV and in `{{missing.list}}`,
      and counts toward the missing rule and `{{missing.count}}`, per the owner's 2026-11-01 ruling,
      and no sentence claims it lowers the grade.
- [ ] No projection's figures move, and no grade changes.
- [ ] With the uncategorized reader dropped from the card and from `{{missing.list}}`, each check goes
      red. Both mutations are reverted, and `TESTING.md` § WO-3.81 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-3.81 carries these lines verbatim with the evidence for each.

**Traps** — **The concern list's cooldown and its sentences are Phase 4's**: a missing count that
grows changes who is flagged on the next pass, so the harness pins the count, not only the list.
**A signal rule is handed its own measured numbers and nothing else** (CLAUDE.md, WO-4.1): the union
is taken where `missingWork()` is built, never inside a rule. **Never fold uncategorized rows into
`openWork()`**: it feeds every *what it would take to move* projection.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/merge-fields.js`
  - `src/signals.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/uncategorized-to-grade.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **The precedent to copy, already in the tree:** `src/term-record.js` `looseWorkOutOfGrade()` (~line 452) unions
  `uncategorizedWork(...).filter((row) => row.state === 'missing')` beside another engine reader. Same shape, four more places:
  - `src/merge-fields.js` ~line 325 (`openWork(...).filter(missing)` feeding both `{{missing.list}}` and `{{missing.count}}` — one list, so count and list cannot disagree).
  - `src/signals.js` ~line 1932, the `missingWork()` ctx reader — **the union goes here, never inside the `missingCount` rule** (Traps).
  - student detail's `missingCard()` and the student CSV's `Work` rows — find them with `grep -rn "missingCard\|openWork" src/`.
  - Name the row with `LOOSE_NAME` from `src/grade-engine.js` where a reader groups by category; do not write a second copy of the words.
- **Comments that become false and must be corrected in the same edit** (a comment that runs ahead of or behind its code is a scar here):
  `src/signals.js` `missingCount`'s header says the count is "the same list of rows the grade already charged this student for at full
  points", and the `missingWork()` comment says "it is the same list the grade charged for". In a weighted class the uncategorized mark is
  charged nothing — reword both so they make no grade claim. Also check `missingCount.early()`'s bound (`has.assignments`): confirm whether it
  counts uncategorized assignments, and say what you found in the result file; do not widen it unless it is wrong.
- **The weighted-class sentence check** is real work, not a formality: read the `missingCount.say()` sentence, the card's line, and any
  merge-field wording, and confirm none says or implies the mark lowers the grade. The rule's current sentence ("has N assignments marked
  missing") makes no grade claim — keep it that way.
- **Mutations**: drop the uncategorized half from the card and from `{{missing.list}}`, run, show red, revert — `git diff` clean on those
  lines **before writing anything else** (AGENTS.md). Stage your own edits before any `git checkout` used to revert, or it reverts them too.
  Before returning, `grep -rn MUTATION src/ tools/` must be empty.
- **WO-3.80's two folded gaps** are in `tools/verify/uncategorized-to-grade.mjs`: a student with both a categorized and an uncategorized
  held blank (assert the categorized row is listed first on the held card), and the queue's held-row comparison taken in draw order, not sorted.
- **Session-limit risk is high on this dispatch** (the window was already past the p25 death level at claim time). Write the result file
  early with a running account and update it, so a death leaves a record; never leave a mutation in the tree across a long step.

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

## 5. Done means these 6 lines, reported against one by one

1. In a points class, an uncategorized assignment marked missing is listed on student detail's *Missing work* card, in the student CSV, and in a draft using `{{missing.list}}`, each under or beside *no category*.
2. In a weighted class, the same mark is listed on the card, in the CSV and in `{{missing.list}}`, and counts toward the missing rule and `{{missing.count}}`, per the owner's 2026-11-01 ruling, and no sentence claims it lowers the grade.
3. No projection's figures move, and no grade changes.
4. With the uncategorized reader dropped from the card and from `{{missing.list}}`, each check goes red. Both mutations are reverted, and `TESTING.md` § WO-3.81 shows the red output.
5. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
6. `TESTING.md` § WO-3.81 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.81 — it is a deliverable, not a permission.** Add `### WO-3.81 — a missing mark on work filed under no category is listed nowhere` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.81` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

