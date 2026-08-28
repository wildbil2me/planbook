# WO-1.35 — a ride-along row rises to the top when the rows above it clear · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.35-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude **Opus**, on this work order's own merits: it *establishes a
convention* — a new mark in the work-order vocabulary, defined as its own README section in suite
voice — and its Traps are judgment rather than mechanics, since telling a real ride-along from a row
whose `Suggested` column merely says "after row 21" is a reading call no rule settles. The runner-up
I set aside was Codex: the tooling half is mechanically checkable through `--self-check` and
`--audit`, but the deliverable that matters is prose plus a retrofit ruling, and the file it edits is
the one the whole dispatch pipeline branches on.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.35 — a ride-along row rises to the top when the rows above it clear

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-28 · **Size** M · **Depends on** — · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.34
made. Booked 2026-08-28, owner-directed, found by reading `next` against the table it answers from.)*

**Why it exists.** Some rows in the running order are not work to schedule, they are work to **fold
into a sitting that is already open** — an hour of `index.html` while someone is in `index.html`
anyway. `plans/work-orders/README.md` has said that in prose for a week, in the `Suggested` column
and nowhere a tool can read: row 18 reads *"Rides along with anything…"*, row 34 read *"Rides along
with row 33"*, and row 10 — [WO-8.13](phase-8-packaging.md#wo-813--the-about-modal-names-two-documents-and-not-the-licence)
— spends a paragraph on it:

> *Row 10 was booked 2026-08-21, and it is **last on purpose**. Nothing blocks it and nothing depends
> on it, which is exactly why it sits at the foot of the table: `next` stops at the first `⬜` in
> document order, so a row placed higher would put an hour of `index.html` in front of an M of sync
> work and five signal boxes that race the term.*

**The mitigation was its position in the table, and position is not stable.** The rows that were
meant to sit above it have cleared — row 7 ✅, row 8 ✅, row 9 🔒 and not startable — so on
2026-08-28 WO-8.13 became the first `⬜` in document order and `next` began answering with it. It
rose by attrition, not by readiness, and it did so **silently**: nothing in the report says the row
it just named spent a paragraph arguing it should not be named. The row's own note is the fence, and
`wo-gate.mjs` cannot read it.

**This is the fifth time a real ordering constraint has been found somewhere other than the header
fields**, and § Ship 3's own preamble keeps the count: *"A `Depends on` line is not the whole
dependency graph in this directory — that is the fourth time … and `wo-gate.mjs` reads only the
field."* The first four were dependencies. **This one is not a dependency** — nothing blocks WO-8.13
and it blocks nothing — which is why no amount of work on `Depends on` would have caught it, and why
it wants a mark of its own rather than a sixth reading of that field.

**The shape to build.** A mark in the `Suggested` column that says *this row is a ride-along*, and
names what it rides with — a file, or a work order. `next` **skips a marked row and says so**, in
the same shape it already prints `skipped WO-4.3 — Praise signals` for a 🔨. `--audit` reports a
marked row that has become the **first `⬜` in its section**, because that is precisely the state
this work order was written out of: the shelf above it emptied and the fold-it-in plan ran out of
hosts. 🎒 is the suggested glyph and the **glyph is the owner's to change; the behaviour is not.**

**Out of scope.** Teaching `next` to read the `Suggested` column. It is free prose by design — thirty
rows of argument in thirty different shapes — and a parser over it would be the second truth the
`--audit` rules exist to prevent. The mark is the parseable half of a sentence the column already
writes, and the column keeps the sentence.

**Traps**

- **It is not a status, and it must not become one.** A ride-along row is `⬜ NOT STARTED` and fully
  buildable. The mark rides beside the status the way 📆 rides beside a checkbox — and per WO-1.28's
  equivalence sentence, it **changes ordering and nothing else**: it closes no box, opens no gate,
  satisfies no dependency, and holds no work order at 🔨.
- **Naming the ID must still start it.** `node tools/wo-gate.mjs WO-8.13` produces a full gate report
  and clears, exactly as it does today. A mark that refuses by ID is 🔒 under a new name, and 🔒
  already exists for the thing it means. This is the line that separates *deprioritised* from
  *forbidden*, and it is the one worth a plant of its own.
- **`next` must never skip silently.** A row that vanishes from the report is a row nobody
  remembers — which is the defect, inverted. The 🔨 skip lines are the model: name it, and say why.
- **Do not retro-fit the mark to a row whose `Suggested` column merely says "After row 21."** That is
  a sequence, and `Depends on` already carries it. Only a row whose argument is *fold this into a
  sitting that has X open* earns the mark. Rows 10 and 18 are the two live cases; read every other
  candidate against that sentence rather than against the word "after".
- **A mark inside backticks is prose about the mark, not a mark** — the rule 📆 and `→ WO-x.y`
  already carry, and the reason § Header fields can describe 🎒 without every row of it becoming one.
- **The audit check needs a plant.** `--self-check` is 24 claims about 24 plants and says so in as
  many words; a twenty-fifth check with no plant behind it is the vacuous-fixture defect WO-1.33 was
  written about, arriving in the tool that polices it.

**Acceptance**
- [ ] The mark is defined in `plans/work-orders/README.md` in a section of its own — the same call
      § "Acceptance-line marks" made about being a section rather than a tenth row in the header
      table — carrying WO-1.28's "changes ordering and nothing else" sentence in as many words.
- [ ] `next` skips a marked row, names it, and prints what it rides with, in the same shape it
      already prints a skipped 🔨.
- [ ] `node tools/wo-gate.mjs WO-8.13` still produces a full gate report and still reports its gates
      clear — the mark blocks nothing when the row is asked for by name.
- [ ] `--audit` reports a marked row that is the first `⬜` in its section, and **fires on WO-8.13 in
      the tree as it stands today** before that row is re-placed.
- [ ] WO-8.13 and row 18 (WO-6.5) wear the mark, and `node tools/wo-gate.mjs next` returns
      **WO-5.2**.
- [ ] `--self-check` is green with a plant behind each new check, and the count in its own report
      goes up by that many.
- [ ] `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/work-orders/README.md`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Four things to have open, and one measurement to take before you edit anything.**

- `plans/work-orders/README.md` § "Acceptance-line marks" (line ~156) is the **precedent this
  section copies** — it is the call the Acceptance list points at when it says "a section of its own,"
  and it is where WO-1.28's *changes ordering and nothing else* sentence lives. Quote that sentence;
  do not paraphrase it.
- In `tools/wo-gate.mjs`, the existing `skipped WO-4.3 — Praise signals` path in `next` is the
  **shape to match**, not a shape to invent. Read it before designing the 🎒 skip line.
- `--self-check`'s plant mechanism: the 24 claims are 24 mutations, and the last Trap says a
  twenty-fifth check with no plant behind it is the exact defect WO-1.33 exists to prevent. A new
  check earns a new plant, and the count in the report goes up by what you added.
- The two live candidates named in the work order are **row 10 (WO-8.13)** and **row 18 (WO-6.5)**.
  Read every other row against the sentence *fold this into a sitting that has X open* — not against
  the word "after".

**Take the before-state first.** `node tools/wo-gate.mjs next` answers **WO-8.13** on the tree as it
stands right now, and Acceptance line 4 wants `--audit` to fire on that row *in that state*. So the
job is to **mark rows, not re-place them** — if you move WO-8.13 down the table you have destroyed
the evidence the fourth box asks for and papered over the defect instead of catching it. Line 5's
`next` → **WO-5.2** must fall out of the mark being honoured, not out of a reordered table.

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

1. The mark is defined in `plans/work-orders/README.md` in a section of its own — the same call § "Acceptance-line marks" made about being a section rather than a tenth row in the header table — carrying WO-1.28's "changes ordering and nothing else" sentence in as many words.
2. `next` skips a marked row, names it, and prints what it rides with, in the same shape it already prints a skipped 🔨.
3. `node tools/wo-gate.mjs WO-8.13` still produces a full gate report and still reports its gates clear — the mark blocks nothing when the row is asked for by name.
4. `--audit` reports a marked row that is the first `⬜` in its section, and **fires on WO-8.13 in the tree as it stands today** before that row is re-placed.
5. WO-8.13 and row 18 (WO-6.5) wear the mark, and `node tools/wo-gate.mjs next` returns **WO-5.2**.
6. `--self-check` is green with a plant behind each new check, and the count in its own report goes up by that many.
7. `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

