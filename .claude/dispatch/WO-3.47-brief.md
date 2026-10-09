# WO-3.47 — every reader outside the grade engine agrees about a held column · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.47-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, Opus tier (no model override). The deciding signal is the Traps section: its first sentence says the queue ruling is the one most likely to go wrong by symmetry, which is a judgment trap, and the work puts the word *held* on three teacher-facing screens (ROUTING § Claude). Codex was the runner-up because the owner's reader table is a complete spec. It was set aside because a clean run plus the mutation runs this Acceptance invites would not fit the 20-minute cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.47 — every reader outside the grade engine agrees about a held column

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-08 · **Size** M · **Depends on** WO-3.46
**Closes roadmap** *(no box. Owner-directed, 2026-10-05.)*

**Booked 2026-10-05** with [WO-3.46](#wo-346--a-score-column-can-be-held-out-of-the-grade-until-it-is-committed),
the second half of the same feature. WO-3.52 keeps a held column out of the grade engine. **Ten
modules walk `doc.assignments` themselves** and would go on reading a held column as if it counted.
Then a screen disagrees with itself: the grade says 84% while the concern list says *3 missing* from a
column that is not live.

**Cut on 2026-10-07, before dispatch, and this is the last of four pieces** (the reasoning and the
order are under WO-3.46). It **keeps its id and its title**, because it is the piece after which
every reader agrees. The readers that **hide** a held column went to
[WO-3.53](#wo-353--the-readers-that-hide-a-held-column-ask-the-engine-whether-it-is-held). The
readers that **show** it under its own word stay here, because showing it needs WO-3.46's controls to
read on the iPad, and the queue needs a new engine call.

**The whole reader table, ruled by the owner on 2026-10-07.** Every row was confirmed as proposed.
The detail row, left to the implementer at booking, was ruled *listed, marked held*. The last two
rows were missing from the booking and were ruled the same day.

| Reader | Ruling | Built by |
|---|---|---|
| `src/signals.js` — `sequence` (~1727), so every rule reading `countedWork()` / `scorePercents()` | **Skips held columns.** A signal built from a grade that is not committed contradicts the grade on screen. `gradeWithout()` already goes through `classGrade()`, so it follows the engine by itself | WO-3.53 |
| `src/past-due.js` — the sweep's offer | **Does not offer** to mark blanks in a held column missing. A held column is work in progress, and the sweep's question is about work that is finished and late | WO-3.53 |
| `src/graded-pieces.js` | **Skips held columns**: it answers which categories have counted work, and a held column has none | WO-3.53 |
| `src/merge-fields.js` — `{{missing.list}}` and the grade fields | **Follows the engine**: a held column's `missing` is not listed. A guardian must not be told about a zero that does not count | WO-3.53 |
| `src/glance.js` `queueRows()` and `src/home.js`'s *N to grade* chip | **A held column with blanks still counts as waiting to be graded**, and its row says *held*. Unfinished work is exactly what the queue is for. This needs `openWork()` to report held rows in its own state, or a sibling engine call; **the call goes in `src/grade-engine.js`, not in the reader** (the glance-reader rule in `CLAUDE.md`) | **This** |
| `src/detail.js` — open work and projections | Projections stay out (they follow the engine). **Open work lists a held column, marked *held*.** It agrees with the queue, so a teacher reading one student sees what is still being reconciled | **This** |
| `src/grades-report.js` — the grade sheet and CSV | **Includes the column, marked held** in its head and in the CSV's header cell. The sheet is what is re-keyed into the SIS, and the SIS has its own commit, so leaving the column off would hide the very work being reconciled | **This** |
| `src/calendar-derived.js` — due dates | **Unchanged.** A due date is a date whether or not the column counts | Nobody |
| `src/score-history.js` `scoreHistoryCard()` and `src/score-notes.js` `scoreNotesCard()` | **Unchanged.** A held cell's note and frozen trail still show on student detail. Both cards are about the cell, not the grade | Nobody |

**Deliverables**
- The three rows marked **This**, built at the reader, each asking `isHeld()` (WO-3.52) and never
  reading `.held`.
- **The queue's engine call**, in `src/grade-engine.js` beside `openWork()`: held rows reported in
  their own state, or a sibling export. The glance reader forwards its array and composes nothing.
- A comment at each reader naming this work order and its ruling.
- `docs/data-model.md`'s reader table, which WO-3.53 started, is completed with these rows as built.
- `CACHE` in `sw.js` is bumped if any SHELL file moves.

**Acceptance**
- [ ] The home card's *N to grade* and the waiting queue count a held column with blanks, and its
      queue row says *held*. Committing it leaves the count unchanged until the blanks are filled.
- [ ] A student's detail lists a held column's open work marked *held*, and no projection counts it.
- [ ] The grade sheet and CSV include the held column, marked held in its head and in the CSV's
      header cell, and the class grade printed beside it does not count it.
- [ ] `tools/verify/glance-quiet.mjs` (or its successor) still finds no arithmetic in
      `src/glance.js`, and the sweep claim from WO-3.53 is green.
- [ ] 👤 On the iPad: a held column with a missing score, read on the home card, the concern list and
      the student's detail, all three agreeing with the grade.

**Traps** — **The queue ruling is the one most likely to be got wrong by symmetry**: the readers
WO-3.53 built all hide a held column, and these three deliberately do not. **A reader that
re-implements "is this column held" is the second opinion** that the glance-reader rule forbids.
**Do not touch the score-history or score-notes cards.** They are ruled unchanged, and a held
column's trail showing there is correct.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/calendar-derived.js`
  - `src/detail.js`
  - `src/glance.js`
  - `src/grade-engine.js`
  - `src/graded-pieces.js`
  - `src/grades-report.js`
  - `src/home.js`
  - `src/merge-fields.js`
  - `src/past-due.js`
  - `src/score-history.js`
  - `src/score-notes.js`
  - `src/signals.js`
  - `tools/verify/glance-quiet.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/grade-engine.js` lines ~53-70 and ~194-270. **Read these before designing the queue's call.**
  `isHeld()` is the one asker. `assignmentsFor()` is the choke point that drops held columns, so
  `openWork()` loses them as a side effect. Its comment hands the queue to this work order.

**Traps the orchestrator found in the tree. The work order does not state them.**
- **`openWork()` feeds the projection.** `categoryRows()` calls `openWork()` when a plan is
  given, and `planned()` sums its `open` and `missing` rows. If held rows went back into
  `openWork()`'s array under an existing state, every projection would count the held column, and
  Acceptance line 2 forbids that. Two safe shapes: a **sibling export** (for example
  `heldWork(doc, cls, termId, studentId)`, built from the same `workRows()` branch so the two cannot
  disagree about a cell's state), or a **new state** that `planned()` provably ignores. Choose one
  and say why in the comment. Either way, a mutation that lets held rows reach `planned()` should
  turn the harness red.
- **The glance reader composes nothing.** `queueRows()` may call the new engine function and
  forward its rows. It must not call `isHeld()` itself or filter `doc.assignments`. If the row
  needs a `held` marker, the engine supplies it. `tools/verify/glance-quiet.mjs` and the WO-3.53
  sweep claim (`wo-sweep.mjs` § 30) are the fences. Run both.
- **"Blanks" is the work order's word.** A held cell flagged `missing` is a decision that has
  already been made, so it is not ungraded. Decide whether it counts toward *N to grade*. Base the
  decision on the queue's existing rule for a live column (`open` rows only, per the
  `src/glance.js` header). Follow that rule rather than inventing a new one, and name the choice in
  the result file.
- **Acceptance line 1 has a second half.** *Committing it leaves the count unchanged until the
  blanks are filled.* When a column is committed, its rows move from the held source back to the
  `open` source, and nothing should be counted twice or dropped. Assert both before and after.
- **Do not touch the readers WO-3.53 built** (`signals`, `past-due`, `graded-pieces`,
  `merge-fields`) or the two cards ruled unchanged. If you find a defect there, write it up as a
  follow-up.
- **The 👤 line stays `- [ ]`.** Bump `CACHE` in `sw.js`, because `src/` files are in SHELL.

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

## 5. Done means these 5 lines, reported against one by one

1. The home card's *N to grade* and the waiting queue count a held column with blanks, and its queue row says *held*. Committing it leaves the count unchanged until the blanks are filled.
2. A student's detail lists a held column's open work marked *held*, and no projection counts it.
3. The grade sheet and CSV include the held column, marked held in its head and in the CSV's header cell, and the class grade printed beside it does not count it.
4. `tools/verify/glance-quiet.mjs` (or its successor) still finds no arithmetic in `src/glance.js`, and the sweep claim from WO-3.53 is green.
5. 👤 On the iPad: a held column with a missing score, read on the home card, the concern list and the student's detail, all three agreeing with the grade.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

