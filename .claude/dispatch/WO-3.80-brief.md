# WO-3.80 — a held column filed under no category is listed nowhere · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.80-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (routed on its own merits, no model override). The deciding signal is that the work order leaves an engine design choice to you — widen `heldWork()`/`heldExcusedWork()` to `looseAssignments()`, or add a held twin of `uncategorizedWork()` — and its Traps are judgment, not mechanics: the hero's *· N held* line must still agree with the held card, and `src/glance.js` forwards and never computes (§ 31). Runner-up set aside: Codex, on "Size S, and WO-3.76 already set the pattern"; ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.80 — a held column filed under no category is listed nowhere

**Ship** — · **Status** 🤖 CLAIMED — 2026-11-01 · **Size** S · **Depends on** WO-3.76 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-11-01, out of WO-3.76's verdict.)*

**Booked 2026-11-01**, owner-directed, out of [WO-3.76](#wo-376--n-to-grade-skips-work-filed-under-no-category)'s
verdict. That work order's third line kept a held uncategorized column out of *N to grade*, which is
right: held work counts toward nothing. But `heldWork()` and `heldExcusedWork()` walk categories only,
as `openWork()` does, so that column is **listed nowhere** either. It is not on the card, the queue,
student detail or the student CSV. That breaks CLAUDE.md's rule from WO-3.47: **counting toward nothing
is not the same as hidden**. A teacher who holds an uncategorized column while re-keying it against
Blackbaud sees it vanish. The owner ruled the edge as built on 2026-11-01 (`TESTING.md` § WO-3.70),
and named this row: *one row widens both held readers to the uncategorized pile and takes a ruling on
the home card's* N to grade*, because `heldWork()` feeds it.*

**Deliverables**
- **Held uncategorized work is listed** wherever held work is listed today: the home card, the
  queue, student detail's held card and the student CSV's held rows. It is grouped under *no
  category* (`LOOSE_NAME`), after the class's own categories, as WO-3.76 does for open work.
- **The engine answers it.** Either the two held readers take in `looseAssignments()`, or the engine
  gains a held twin of `uncategorizedWork()`. That is the implementer's call, stated at the point of
  departure. `openWork()` is not widened, and no screen tests a cell or reads `.held` (`wo-sweep.mjs`
  § 30).
- **Ruled by the owner, 2026-11-01, before `--start`: held uncategorized work shows on the home card
  and the queue under its held word, exactly as held categorized work does.** The question was
  whether it should show there or stay off the card. *N to grade* still counts only open work. Two
  reasons:
  - **WO-3.47's rule names the home card.** Counting toward nothing is not the same as hidden, and
    leaving off only the uncategorized held columns would make the card depend on how a column was
    filed. A teacher would hold a column and then not find it where held work normally shows.
  - **The hero's *· N held* line must agree with the held card** (the owner's 2026-11-01 ruling on
    WO-3.70). The simplest way to keep them agreeing is to give uncategorized work no special case.
- **A mutation**: drop the uncategorized half from the held reader, show the check go red, and revert
  it before writing anything else.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.80** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] A held column filed under no category, with one blank and one excused cell, is listed on
      student detail's held card and in the student CSV's held rows, in a weighted class and in a
      points class.
- [ ] The home card and the queue show it under its held word, as they show a held categorized
      column, per the owner's 2026-11-01 ruling, and *N to grade* is unchanged by the hold.
- [ ] No projection's figures move, and committing the column moves its work back to open exactly
      as a categorized column's does.
- [ ] With the uncategorized half dropped from the held reader, the check goes red. The mutation is
      reverted, and `TESTING.md` § WO-3.80 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-3.80 carries these lines verbatim with the evidence for each.

**Traps** — **A held row and an open row must never answer for the same cell**: the held reader and
`uncategorizedWork()` split on `isHeld()`, as `heldWork()` and `openWork()` do. **`src/glance.js`
forwards, it does not compute** (WO-6.7, § 31). **The hero's *· N held* line points at the held card**
(the owner's 2026-11-01 ruling on WO-3.70), so the two must still agree once the card grows.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/glance.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/grade-engine.js` — `looseAssignments()` (~l.100), `heldWork()` (~l.343), `uncategorizedWork()` (~l.372), `heldExcusedWork()` (~l.434), `LOOSE_NAME` (~l.613). Read the comments above each: they carry the WO-3.47 / WO-3.70 / WO-3.76 rulings, and **several state today's scope in words** ("categorized work only", "a HELD uncategorized column is in none of them"). Those sentences become false the moment you land — correct each in the same edit, including `src/glance.js` ~l.334-341 and `src/home.js` ~l.411-421.
- The four consumers: `src/home.js` (~l.162, ~l.434 — the card), `src/glance.js` (~l.179, ~l.361-362 — the queue), `src/detail.js` (~l.1120 and ~l.1320 — the held card and the student CSV's held rows). If you widen the held readers in the engine these may need no change beyond comments; if you add a twin, each gains a call. Either way state the choice at the point of departure, as the work order demands.
- `tools/verify/held-readers.mjs` and `tools/verify/uncategorized-to-grade.mjs` — the harness modules that already pin this edge. **The latter likely asserts the as-built edge this work order reverses** (held uncategorized column listed nowhere / off the card): turn that assertion around rather than deleting it, and correct its comment. Extend these rather than adding a new harness file unless the layout clearly wants one.
- `TESTING.md` § WO-3.70 and § WO-3.76 — the owner's rulings this rests on, and the shape your own § WO-3.80 should take.
- `tools/wo-sweep.mjs` § 30 (no `.held` read outside the engine; writer only in `src/held-column.js`) and § 31 (the glance fence).

**Traps worth stating out loud, beyond the work order's own:**
- **No double-listing.** `heldExcusedWork()` / `excusedWork()` split held vs live, and `uncategorizedWork()` leaves held columns out via `looseAssignments()`. Keep every cell answered by exactly one reader — the excused cell on a held uncategorized column goes on the held card, not the excused report. Assert that, not just presence.
- ***N to grade* must not move on the hold.** Pin the number before and after the hold in the harness.
- **Grouping order**: *no category* (`LOOSE_NAME`) after the class's own categories, as WO-3.76 does for open work — in both a weighted and a points class (Acceptance line 1 names both).
- **Mutation discipline** (AGENTS.md): mark it `MUTATION`, watch it go red, revert it **before writing anything else**; `grep -rn MUTATION src/ tools/` must be empty before you report.
- **Bump `CACHE` in `sw.js`** — the `src/` files you touch are in `SHELL`.
- **Do not touch WO-3.81** (missing marks on uncategorized work): `.claude/dispatch/WO-3.81-status.md` is another, unclaimed row's trail. Leave it alone; do not widen into `missingCard()` or `src/merge-fields.js`.
- `CHANGELOG.md`: draft the entry in your result file; the teacher decides whether it lands.

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

1. A held column filed under no category, with one blank and one excused cell, is listed on student detail's held card and in the student CSV's held rows, in a weighted class and in a points class.
2. The home card and the queue show it under its held word, as they show a held categorized column, per the owner's 2026-11-01 ruling, and *N to grade* is unchanged by the hold.
3. No projection's figures move, and committing the column moves its work back to open exactly as a categorized column's does.
4. With the uncategorized half dropped from the held reader, the check goes red. The mutation is reverted, and `TESTING.md` § WO-3.80 shows the red output.
5. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
6. `TESTING.md` § WO-3.80 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.80 — it is a deliverable, not a permission.** Add `### WO-3.80 — a held column filed under no category is listed nowhere` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.80` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

