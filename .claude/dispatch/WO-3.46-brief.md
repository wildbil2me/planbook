# WO-3.46 — a score column can be held out of the grade until it is committed · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.46-result.md` — as your last act, and return it in-band too.

**Routing: Claude, at Opus (on the merits, no override).** The deciding signal is that this work order puts the held column in front of a teacher for the first time: new controls on the score grid's column head, a confirm with teacher-facing wording, and an editor checkbox that has to avoid stacking with WO-3.50's close-time confirm. Those are design and wording calls, and the Traps are about judgment. The runner-up was Codex for the two writers, which really are mechanical. I set that aside because the writers are the small part, and the § 30 change needs a mutation proof that a twenty-minute cap would squeeze.

**Traps the work order does not spell out:**
- **The preview reuses the engine.** Get each figure from `classGrade()` on the document as it is and on a shallow clone with that one assignment's `held` flipped, the way `gradeWithout()` does at `src/signals.js` ~546/974. A name list built from anything else is a second engine. Flipping `held` on the *clone* is a write of `held` outside the writer's file and outside `src/grade-engine.js`, so § 30 will catch it. Either put the preview in the writer's file, or add a helper to `src/grade-engine.js` that returns the flipped clone. Do not widen § 30's exception to cover it. Say in your result which one you chose.
- **§ 30 gets one new exception, for one file.** Take the exception shape and the stale-exception check from `tools/wo-sweep.mjs` ~3830–3875. The stale-exception fault means an exception has to be used, or it goes red, which is a good thing. The destructured-parameter clause matches `{ held }` / `{ ..., held, ... }` in a parameter list. It must stay green on `src/assignments.js:695`'s bare local and on prose. Plant each shape in a **scratch copy** of the tree (or one file restored from git right after) and record red then green. **Search for `MUTATION` before you write your result file.** A mutation left in the tree has shipped twice here.
- **The confirm uses `src/modal.js`** (`openModal`, `setCloseGuard`), like the app's other confirms. Declining has to leave the document byte-identical with `flush()` awaited, because `update()` only schedules a save (the WO-5.3 scar).
- **Extend the harness you already have.** Add checks to `tools/verify/score-grid.mjs`, `assignments.mjs`, `past-due.mjs` and `held-readers.mjs` as they fit, and update `tools/README.md`'s recorded counts in the same edit. A stale count turned the sweep red on WO-3.26.
- **Out of scope:** WO-3.47's readers (the queue, the home card, the grade sheet, detail). The home card's count dropping a held column is expected. Do not fix it here.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.46 — a score column can be held out of the grade until it is committed

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-08 · **Size** M · **Depends on** WO-3.52, WO-3.53
**Closes roadmap** *(no box. Owner-directed, 2026-10-05.)*

**Booked 2026-10-05**, owner-directed, from the owner's reconciling against the SIS: *"Sometimes you
want to enter a grade, but you're rectifying things from the SIS. The challenge is you can't enter a
grade without it applying."* The SIS makes every grade wait for a *commit* before it counts, per cell
and per column range, which the owner calls clunky. **The owner chose per column.** A held column
takes values, flags and notes as any column does, counts toward nothing, and **keeps no history**
until it is committed.

**Cut in four on 2026-10-07, before dispatch, and this is the third piece.** The owner asked about
size after WO-3.50, an M, used most of a usage window. Its commit added 1,815 lines across 16 files,
and this row as booked was larger: an engine change, a history rule with a mutation proof, and new
controls on the score grid. On the WO-6.4 and WO-5.8 precedent it was cut along its own seams, and it
**keeps its id, its title and ruling 4**, so WO-3.48's trap still resolves. The four pieces, in
running order:
1. [WO-3.52](#wo-352--a-held-column-counts-toward-nothing-and-keeps-no-history-in-the-engine): the
   shape, the engine filter, `isHeld()` and `reviseCell()`'s rulings 1 and 2. It lands invisibly,
   because nothing can hold a column yet.
2. [WO-3.53](#wo-353--the-readers-that-hide-a-held-column-ask-the-engine-whether-it-is-held): the
   four readers that hide a held column. Also invisible.
3. **This one**: the writer, the grid's *Hold* and *Commit* controls, the confirm and the editor's
   checkbox. **Holding becomes possible here**, so the two pieces before it make sure the grade,
   the signals, the past-due prompt and outreach already agree on the day it lands.
4. [WO-3.47](#wo-347--every-reader-outside-the-grade-engine-agrees-about-a-held-column): the
   readers that show a held column under its own word (the queue, the home card, the grade sheet,
   student detail). Between this landing and that one, the home card's *N to grade* does not count
   a held column. Keep the gap short; nothing in this work order works around it.

**The shape** is WO-3.52's: `held: true` while held, absent means live, `heldAt` stamped by a hold
(added 2026-10-08 for ruling 2 as amended), and `committedAt` stamped by a commit. This work order
writes all three and reads none directly. It asks `isHeld()`.

**Rulings, the owner's, 2026-10-07.** All four were confirmed as proposed at booking. Rulings 1
(the revision window is measured from the commit) and 2 (a re-held column's trail is frozen, not
cleared) moved to
[WO-3.52](#wo-352--a-held-column-counts-toward-nothing-and-keeps-no-history-in-the-engine) with
`reviseCell()`. These two stay here:
3. **Committing and holding are each one tap behind a confirm that shows what moves.** The confirm
   names the students whose class grade changes, before and after (*"Jordan 84% → 78%"*), and says
   so in words when none does. The preview is `classGrade()` asked twice: once on the document as it
   is, and once on a shallow clone with the column's `held` flipped. `src/signals.js`'s
   `gradeWithout()` is the precedent. **No arithmetic of its own.**
4. **A new column is live.** The assignment editor offers *Hold out of the grade* unticked. Nothing a
   teacher does today changes behaviour unless she asks for a hold. A copy is live whatever its
   source is (WO-3.48's trap).

**Deliverables**
- **One writer for each direction**, each a single `update()`: holding sets `held: true` and stamps
  `heldAt` with `localStamp()`, overwriting an earlier stamp (a column created held gets both);
  committing deletes `held` and stamps `committedAt` with `localStamp()`, overwriting an earlier
  stamp. Nothing on the cells moves in either direction.
- **The score grid shows a held column as held**: a mark on its head, a word for a screen reader,
  and a *Commit* control on the head that opens ruling 3's confirm. A live column's head carries
  *Hold*, behind the same confirm.
- **The assignment editor carries the hold checkbox** (ruling 4), and changing it on an existing
  column goes through the same confirm.
- **WO-3.53's sweep claim names the writer's file** as the one place outside `src/grade-engine.js`
  allowed to write `held`, changed in the same sitting as the writer, with `tools/README.md`'s count
  kept in step.
- **`docs/data-model.md`** gains the writers and the confirm under the held-column section WO-3.52
  wrote.
- **`CACHE` in `sw.js` is bumped.**

**Acceptance**
- [ ] Holding a column writes `held: true` and `heldAt` and nothing else; committing deletes it, stamps
      `committedAt`, and touches no cell. Each is one `update()` and `rev` moves by one.
- [ ] Committing the column moves exactly the grades the confirm named, to the figures it named, in
      a weighted class and in a points class. Holding does the same in the other direction.
- [ ] A confirm whose column moves no grade says so in words, and declining either confirm leaves the
      document byte-identical (`flush()` awaited).
- [ ] A new assignment is live, and its editor shows the checkbox unticked. Ticking it on an existing
      column opens the same confirm as the grid's control.
- [ ] Edits typed through the grid into a held column and then committed reach `reviseCell()` with
      the column's state, so WO-3.52's rulings 1 and 2 hold end to end, not only in the unit checks.
- [ ] A held column is driven through **both** of `reviseCell()`'s callers, `putCell()` in
      `src/scores.js` and `acceptPastDue()` in `src/past-due.js`, and each records no history while
      held and the committed figure after. *(WO-3.52's verifier, 2026-10-08: those two call sites
      were confirmed by reading only, so a misnamed field in either would pass every check. This is
      the first work order that can hold a column through them.)*
- [ ] A held column that is the only work in its category leaves that category empty, and its weight
      passes to the other categories exactly as an empty category's does, checked against a hand
      computation. *(Also WO-3.52's verifier: the engine filter implies it, and no check showed it.)*
- [ ] `wo-sweep.mjs` § 30 names the writer's file as an exception in the same edit that adds the
      writer, and the sweep is green. *(WO-3.53's deliverables promised this and nothing on this list
      held it: § 30 forbids every `.held` outside `src/grade-engine.js`, so the writer turns it red,
      and the easy repair is a wider exception than one file.)* **In the same edit, § 30 also catches
      `held` named in a destructured parameter** — `({ held }) => !held`, `function f({ held })` —
      and nothing wider: a bare `held` is a local variable at `src/assignments.js:695` and a word in
      prose elsewhere, so matching every `held` token goes red on a clean tree. Proved non-vacuous by
      planting each shape in a scratch copy and seeing § 30 go red. *(WO-3.53's verifier, 2026-10-08:
      a destructured parameter passes § 30 today, and it is the shape a filter over assignments is
      most often written in. The owner's ruling, the same day: close it here, where § 30 is open
      anyway, before WO-3.47 builds the readers most likely to use it.)*
- [ ] `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the iPad, after a force-quit: hold a column, type scores, see the grade not move; commit,
      read the confirm's names against the grid, and see the grade move.

**Traps** — **The preview is not a second grade engine.** If the confirm computes a percentage
itself, the confirm and the grid can disagree, which is the failure this repository refuses
everywhere else. **Do not read `.held` in the grid or the editor**; ask `isHeld()`, or WO-3.53's
sweep claim turns red. **The editor already has a confirm at the close** (WO-3.50's scored-move
warning, `settleEditor()`). The hold checkbox opens its confirm **on change, not on close**, so a
teacher who moves a due date and ticks the hold is never shown two dialogs stacked at the close.
And **`openWork()` drops a held column** as a side effect of WO-3.52's filter, so the home card
stops counting it on the day this lands. That gap is
[WO-3.47](#wo-347--every-reader-outside-the-grade-engine-agrees-about-a-held-column)'s to close.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/assignments.js`
  - `src/grade-engine.js`
  - `src/past-due.js`
  - `src/scores.js`
  - `src/signals.js`
  - `tools/README.md`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/modal.js` — the confirm/close-guard pattern; `src/signals.js` `gradeWithout()` — the preview precedent.
- `tools/wo-sweep.mjs` § 30 (~3820–3880) and `tools/verify/held-readers.mjs`, `score-grid.mjs`, `past-due.mjs`, `assignments.mjs`.
- `sw.js` (`CACHE`).

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

## 5. Done means these 10 lines, reported against one by one

1. Holding a column writes `held: true` and `heldAt` and nothing else; committing deletes it, stamps `committedAt`, and touches no cell. Each is one `update()` and `rev` moves by one.
2. Committing the column moves exactly the grades the confirm named, to the figures it named, in a weighted class and in a points class. Holding does the same in the other direction.
3. A confirm whose column moves no grade says so in words, and declining either confirm leaves the document byte-identical (`flush()` awaited).
4. A new assignment is live, and its editor shows the checkbox unticked. Ticking it on an existing column opens the same confirm as the grid's control.
5. Edits typed through the grid into a held column and then committed reach `reviseCell()` with the column's state, so WO-3.52's rulings 1 and 2 hold end to end, not only in the unit checks.
6. A held column is driven through **both** of `reviseCell()`'s callers, `putCell()` in `src/scores.js` and `acceptPastDue()` in `src/past-due.js`, and each records no history while held and the committed figure after. *(WO-3.52's verifier, 2026-10-08: those two call sites were confirmed by reading only, so a misnamed field in either would pass every check. This is the first work order that can hold a column through them.)*
7. A held column that is the only work in its category leaves that category empty, and its weight passes to the other categories exactly as an empty category's does, checked against a hand computation. *(Also WO-3.52's verifier: the engine filter implies it, and no check showed it.)*
8. `wo-sweep.mjs` § 30 names the writer's file as an exception in the same edit that adds the writer, and the sweep is green. *(WO-3.53's deliverables promised this and nothing on this list held it: § 30 forbids every `.held` outside `src/grade-engine.js`, so the writer turns it red, and the easy repair is a wider exception than one file.)* **In the same edit, § 30 also catches `held` named in a destructured parameter** — `({ held }) => !held`, `function f({ held })` — and nothing wider: a bare `held` is a local variable at `src/assignments.js:695` and a word in prose elsewhere, so matching every `held` token goes red on a clean tree. Proved non-vacuous by planting each shape in a scratch copy and seeing § 30 go red. *(WO-3.53's verifier, 2026-10-08: a destructured parameter passes § 30 today, and it is the shape a filter over assignments is most often written in. The owner's ruling, the same day: close it here, where § 30 is open anyway, before WO-3.47 builds the readers most likely to use it.)*
9. `CACHE` in `sw.js` is bumped.
10. 👤 On the iPad, after a force-quit: hold a column, type scores, see the grade not move; commit, read the confirm's names against the grid, and see the grade move.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

