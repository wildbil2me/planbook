# WO-3.53 — the readers that hide a held column ask the engine whether it is held · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.53-result.md` — as your last act, and return it in-band too.

**Routing (orchestrator, 2026-10-08).** Claude, at **Opus** (no model override): one of the four
readers is `src/merge-fields.js`, the merge-field resolver, which is a sensitive surface that
`ROUTING.md` never delegates. The runner-up was Codex — three of the four edits are mechanical filter
additions with fixture-checkable Acceptance — and it was set aside on the sensitive surface alone, so
no Codex probe was run.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.53 — the readers that hide a held column ask the engine whether it is held

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-08 · **Size** M · **Depends on** WO-3.52
**Closes roadmap** *(no box. Owner-directed, 2026-10-07.)*

**Cut out of [WO-3.47](#wo-347--every-reader-outside-the-grade-engine-agrees-about-a-held-column)
on 2026-10-07, before dispatch.** It is the second of four pieces; the order is written under
[WO-3.46](#wo-346--a-score-column-can-be-held-out-of-the-grade-until-it-is-committed). These are the
four readers whose ruling is the same: **a held column is not there.** They land before WO-3.46
makes holding possible, so the grade, the concern list, the past-due prompt and a letter home already
agree on the day a teacher first holds a column. Like WO-3.52, this piece lands invisibly, and every
check holds a column by building a fixture.

**Rulings, the owner's, 2026-10-07**, from WO-3.47's reader table, confirmed as proposed:

| Reader | Ruling |
|---|---|
| `src/signals.js` — `sequence` (~1727), so every rule reading `countedWork()` / `scorePercents()` | **Skips held columns.** A signal built from a grade that is not committed contradicts the grade on screen. `gradeWithout()` already goes through `classGrade()`, so it follows WO-3.52 by itself |
| `src/past-due.js` — the sweep's offer | **Does not offer** to mark blanks in a held column missing. A held column is work in progress, and the sweep's question is about work that is finished and late |
| `src/graded-pieces.js` | **Skips held columns**: it answers which categories have counted work, and a held column has none |
| `src/merge-fields.js` — `{{missing.list}}` and the grade fields | **Follows the engine**: a held column's `missing` is not listed. A guardian must not be told about a zero that does not count |

**Deliverables**
- Each ruling, built at the reader, asking `isHeld()` and never reading `.held`, with a comment
  naming this work order.
- **A `wo-sweep.mjs` claim: no file outside `src/grade-engine.js` names `.held`.** It is a sweep
  check rather than a harness check, on the § 17 and § 20 precedent: the harness proves what today's
  paths do, and the grep proves there is no file that could do otherwise. WO-3.46 adds its writer's
  file as the one exception. `tools/README.md`'s `check()` count is kept in step (WO-3.26's scar).
  **`src/merge-fields.js` keeps § 20 claim 5**: the held test is a call to `isHeld()`, never a
  property read named after a token.
- `docs/data-model.md` gains the reader table under the held-column section WO-3.52 wrote, with
  WO-3.47's rows marked as not yet built.
- **`CACHE` in `sw.js` is bumped**: all four readers are in SHELL.

**Acceptance**
- [ ] With a held column holding a `missing` and two low scores for one student, the concern list
      shows nothing from that column. Deleting `held` and committing makes the matching signals fire.
- [ ] The past-due prompt does not name a held column whose due date has passed, and does name it
      once the column is live.
- [ ] `graded-pieces` reports no counted work for a category whose only work is held.
- [ ] `{{missing.list}}` does not name a held column's missing work, and names it once the column is
      live.
- [ ] The sweep claim is green on the delivered tree and red with a `.held` read planted in any one
      of the four readers. **The plant is reverted before anything else is written.**
- [ ] `CACHE` in `sw.js` is bumped.

**Traps** — **A reader that re-implements "is this column held" is the second opinion** that the
glance-reader rule forbids. **Do not touch the queue, the home card, student detail or the grade
sheet.** Those show a held column rather than hide it, and they are WO-3.47's. Treating them by
symmetry with these four is the mistake that row's Traps already name.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/grade-engine.js`
  - `src/graded-pieces.js`
  - `src/merge-fields.js`
  - `src/past-due.js`
  - `src/signals.js`
  - `tools/README.md`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `.claude/dispatch/WO-3.52-result.md` (and `-correction-1.md`): the piece before this one, so you
  know what `isHeld()`, `heldAt` and `committedAt` already are and which harness module
  (`tools/verify/score-history.mjs`) holds held-column fixtures.
- `tools/wo-sweep.mjs` § 17 and § 20: the shape the new claim copies, and claim 5 that
  `src/merge-fields.js` must keep.
- WO-3.47 and WO-3.46 in the same phase file: the readers you must **not** touch, and the writer that
  will later add itself as the claim's one exception.

### Traps the orchestrator found before you start — read before writing the sweep claim

1. **The claim as literally worded is red on today's tree.** `.held` already appears outside
   `src/grade-engine.js` in two places that are not reading an assignment's key:
   - `src/score-history.js:181`, `column.held`: WO-3.52's own `reviseCell()` reads a
     `{ held, heldAt, committedAt }` descriptor that its callers build from `isHeld()`.
   - `src/signals-view.js`, `pass.held` / `held: held`: an unrelated property, the suppressed-rows list.

   `.heldAt` reads also exist in `src/past-due.js` and `src/scores.js`, as the descriptor's input.
   **Decide how the claim tells these apart, and say in the result file what you decided and why.**
   Acceptable shapes are a narrow, named exception list, each with its reason in a comment, or a small
   rename that takes the collision away. **Unacceptable** is a regex loosened until it cannot fire,
   or a rewrite of WO-3.52's history logic. Whatever you choose, Acceptance 5's plant, a bare
   `assignment.held` or `a.held` in each of the four readers, must turn it red. Prove that for
   **each** of the four, one at a time, not for one reader with the rest argued by analogy.
2. **Revert every plant before you write anything else**, then run `grep -rn MUTATION src tools sw.js`
   and get no hits. Two dispatches here died holding a live mutation over a tree whose docs already
   read finished. Stage your own work before any `git checkout` of a planted file, because that
   checkout reverts unstaged edits too.
3. **`src/signals.js`.** Filter at `sequence`, by `isHeld()`, so every rule fed from it follows.
   Acceptance 1 also asks that deleting `held` and committing makes the matching signals fire. That
   is the same fixture with the key removed (WO-3.46's writer does not exist yet), and the fixture
   must be one where those signals really do fire: a missing plus two low scores have to clear the
   default thresholds (`thresholdsOf()`).
4. **`src/past-due.js` already imports `isHeld`** (WO-3.52, for `reviseCell`). Reuse that import.
   The sweep's *offer set* is the thing to filter. Leave the history descriptor alone.
5. **`src/merge-fields.js`.** The `isHeld()` call goes where missing work is gathered, and it must not
   introduce a computed property read (§ 20 claim 5). If the grade fields already go through
   `classGrade()`, say so rather than adding a second filter.
6. **Count `check()` calls after your harness edits** and correct the number in `tools/README.md`
   (WO-3.26's scar: a stale count turns the sweep red on finished work). The `CACHE` in `sw.js` is
   currently `planbook-shell-v170`.
7. **Do not commit.** The orchestrator stops at your return, and a fresh-session verifier grades the
   tree.

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

## 5. Done means these 6 lines, reported against one by one

1. With a held column holding a `missing` and two low scores for one student, the concern list shows nothing from that column. Deleting `held` and committing makes the matching signals fire.
2. The past-due prompt does not name a held column whose due date has passed, and does name it once the column is live.
3. `graded-pieces` reports no counted work for a category whose only work is held.
4. `{{missing.list}}` does not name a held column's missing work, and names it once the column is live.
5. The sweep claim is green on the delivered tree and red with a `.held` read planted in any one of the four readers. **The plant is reverted before anything else is written.**
6. `CACHE` in `sw.js` is bumped.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

