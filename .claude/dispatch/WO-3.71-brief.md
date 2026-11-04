# WO-3.71 — a copied class keeps each category's drop lowest · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.71-result.md` — as your last act, and return it in-band too.

**Routing.** Claude **Opus**, on the work order's own merits. The deciding signal is a judgment trap the Deliverables do not spell out: `dropCountOf()` is private to `src/grade-engine.js`, the engine imports `src/categories.js`, and the work order says nothing in the engine moves — so `copyCategories()` cannot just import the predicate (that is an import loop, which `wo-sweep.mjs` § 33 now fails), and how it honours *"would `dropCountOf()` honour it"* without a second opinion drifting from the engine's is a decision you make and defend in a comment. The work order also owes `TESTING.md` and `CHANGELOG.md` prose. Runner-up Codex was set aside on budget as well: one clean run plus one mutation run of `verify-shell.mjs`, at roughly 20 minutes each on this tree, is twice the runner's 20-minute cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.71 — a copied class keeps each category's drop lowest

**Ship** — · **Status** 🤖 CLAIMED — 2026-11-03 · **Size** S · **Depends on** WO-3.69 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-23.)*

**Booked 2026-10-23**, owner-directed, out of [WO-3.69](#wo-369--a-category-can-drop-each-students-lowest-n-scores)'s
verdict. **Why it exists.** `copyClass()` in `src/classes.js` builds each category through
`copyCategories()` in `src/categories.js`, which calls `newCategory(c.name, c.weight)` and nothing
else. So a class copied from one whose *Quizzes* drop their lowest score arrives with *Quizzes*
dropping nothing, and nothing on screen says so. The setting is a grading decision about the
category, like its weight, which the copy already keeps — the argument WO-3.30 made for
`gradingMode`.

**Deliverables**
- **`copyCategories()` carries `dropLowest`** when the source category has one that `dropCountOf()`
  would honour, and writes no key when it does not. The key stays absent-means-default: a copy of a
  category with no drop gets no `dropLowest` key, not a `0`.
- **The copy's grade is the source's rule.** Nothing in `src/grade-engine.js` moves.
- **`tools/verify/copy-class.mjs`** gains a check that a copied category keeps its drop, and that a
  category with none gets no key.
- **A mutation**: make `copyCategories()` drop the key again, show the new check goes red, and revert
  it before writing anything else.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.71** and the `CHANGELOG.md` entry, which also
  retires WO-3.69's entry's sentence that copying does not carry the setting yet.

**Acceptance**
- [ ] Copying a class whose category drops its lowest N gives a class whose matching category drops
      its lowest N.
- [ ] Copying a category with no drop writes no `dropLowest` key.
- [ ] Every other field a copy carries or refuses is unchanged.
- [ ] With `copyCategories()` leaving the key off, the new check goes red. The mutation is reverted,
      and `TESTING.md` § WO-3.71 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-3.71 carries these lines verbatim with the evidence for each.

**Traps** — **Copy the key, not a number for every category**: writing `dropLowest: 0` into a copy
is the seeded-default mistake CLAUDE.md's settings-block rule refuses. **`letterScale: null` in the
copy is a separate, existing decision** and is not this work order's to change. **If the owner's
closing-a-quarter thread makes the drop per term**, the shape this copies changes; re-read that
thread's note before `--start`.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/categories.js`
  - `src/classes.js`
  - `src/grade-engine.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/copy-class.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/categories.js` — `newCategory()`, `copyCategories()` (~line 98–117), and the `dropLowest` field
  writer (~line 545–570): blank and 0 **delete** the key; only a whole number above 0 is written. That
  is the absent-means-default shape your copy must match.
- `src/grade-engine.js` ~line 150–187 — the `DROP EACH STUDENT'S LOWEST N` comment and `dropCountOf()`.
  Read, do not edit.
- `CHANGELOG.md` line ~419–430 — WO-3.69's entry; its sentence *"Copying a class's categories does not
  carry the setting yet."* is the one this work order retires. Line ~1462 is WO-3.30's copy entry
  (`gradingMode`), the precedent the work order cites.

**Traps the work order does not state, found while briefing:**
- **No import from the engine into `src/categories.js`.** `grade-engine.js:28` imports from
  `categories.js`; the reverse edge closes a loop and turns sweep § 33 red. And `grade-engine.js` is
  not to move, so exporting or relocating `dropCountOf()` is out too. Whatever you do in
  `categories.js` — a local predicate with the same three conditions (number, integer, above zero) is
  the obvious shape — say at both sites, in a comment, that the two must agree and why there are two.
  If you find a better answer that keeps the engine untouched, take it and say why.
- **A malformed source value is not copied.** `dropLowest: 1.5`, `-1`, `'2'` or `0` on the source
  gives a copy with **no key** — the engine already reads those as "drop nothing", so a copy that
  carried them would carry a value nobody can see on screen. Test at least one malformed value
  besides absent.
- **The closing-a-quarter thread was re-read at claim time** (`plans/closing-a-quarter.md` line 18,
  31): the drop is still per class, so the Traps line about a per-term shape does not fire. Nothing
  for you to do there.
- **`CACHE` bump** applies: `src/categories.js` is in `SHELL`.


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

1. Copying a class whose category drops its lowest N gives a class whose matching category drops its lowest N.
2. Copying a category with no drop writes no `dropLowest` key.
3. Every other field a copy carries or refuses is unchanged.
4. With `copyCategories()` leaving the key off, the new check goes red. The mutation is reverted, and `TESTING.md` § WO-3.71 shows the red output.
5. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
6. `TESTING.md` § WO-3.71 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.71 — it is a deliverable, not a permission.** Add `### WO-3.71 — a copied class keeps each category's drop lowest` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.71` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

