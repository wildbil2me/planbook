# WO-3.33 — a changed score cell keeps what it was · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.33-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus** (no model override). The deciding signal is two sensitive
surfaces: presentation mode (the history mark and the trail must be *absent from the DOM* under the
projector, the owner's 2026-10-04 ruling) and backup/restore (every older backup must restore unchanged
and a year with history must round-trip) — ROUTING § "Route to Claude", not delegated. Runner-up set
aside: the store-shape half (`at`, `was`, the five-minute rule) is close to a mechanical spec, but the
sensitive surfaces alone settle the route, and the grid mark's design next to WO-3.32's note mark is
judgment. **The Open this work order carried is ruled** (commit `c933b35`); nothing is left for you to
ask the owner before building.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.33 — a changed score cell keeps what it was

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-04 · **Size** M · **Depends on** WO-3.32 — the note a history entry carries
**Closes roadmap** *(no box. Owner-requested, 2026-10-02.)*

**Booked 2026-10-02**, owner-directed. English runs on revision, and today a revision overwrites the
score: *72, revised to 88* is lost the moment the 88 is typed, though that rise is exactly the delta
the praise column exists for. **The history is of the whole cell, not of the score.** Each earlier
version is the cell as it was, with its value, flag and note, so *Missing → Late, 70 → 88* is kept
with no separate flag tracking.

**Deliverables**
- **Every write to a score cell stamps `at`**, a local ISO timestamp with its offset, the mark cell's
  rule. A cell written before this lands has no `at`, and that is valid.
- **Overwriting a cell pushes its previous value, flag, note and `at` onto `was`**, oldest first.
  Only the current fields count toward any grade. `was` is absent until the first change.
- **A write within five minutes of the cell's last write replaces it without pushing**, so
  correcting a typo leaves no history entry. Five minutes is measured from the current cell's `at`,
  and a cell with no `at` always pushes. *(The owner's ruling, 2026-10-02, before dispatch.)*
- **The score grid marks a cell that has history**, and student detail shows the trail under its
  assignment: *Missing (Sep 14) → Late, 70 (Sep 20) → 88 (Oct 1)*. *(The owner's ruling, 2026-10-02.)*
  The history mark has to read as different from WO-3.32's note mark at a glance, since one cell can
  carry both. **Neither shows under the projector** *(the owner's ruling, 2026-10-04, at dispatch)*:
  in presentation mode the grid's history mark and student detail's trail are **absent from the
  page**, not dimmed or counted. That is WO-3.32's treatment of the note mark and the note, and
  `flipPresentationMode()` already repaints the grid for it. The mark says only that a score changed;
  hiding it is the direction that discloses nothing about one student on a wall.
- **Nothing reads history but student detail.** No signal rule, merge field, grade or print. What
  history means for signals is parked in `plans/future-features.md` § Gradebook as a ruling for the
  owner, not a detail for this work order.

**Acceptance**
- [ ] Changing a cell's score, flag or note more than five minutes after its last write pushes the previous
      cell onto `was` with its `at`, and the current cell carries a new `at`.
- [ ] A change within five minutes replaces the cell and pushes nothing, checked on the harness's
      shifted clock either side of the boundary.
- [ ] Every grade on every screen is byte-identical to the same document with every `was` removed.
      **Mutation-proved**: an engine that reads a history entry goes red.
- [ ] Student detail lists the history in order, with dates, and a cell with no history shows nothing
      extra.
- [ ] A cell with history carries the grid's history mark and a cell without it does not, and a cell
      with both a note and history shows both marks, told apart. In presentation mode neither the
      history mark nor the student-detail trail is in the DOM.
- [ ] A backup written before this lands restores unchanged, and a year with history round-trips.
- [ ] No exported reader outside the detail screen's own path returns `was`, and a sweep check keeps
      it that way.
- [ ] 👤 On the iPad, revising a score and opening the student shows the history reading clearly.

**Traps** — **Do not push on every keystroke.** The grid commits on leaving a cell, and the store's
save is debounced, so a version is a commit, not a key. **Do not let a signal read `was`.** CLAUDE.md
records that the turnaround rule cannot see a grade recovery because *a score is not dated*. That
stops being true here, and changing what a rise means is the owner's ruling, not this work order's.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/future-features.md`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **Where the writes are.** `src/scores.js` — the cell writer around ~439 (the one that carries a
  note across a value/flag change and keeps `{ v: null, note }`), `editScore()` ~1457, and the note
  writers `editScoreNote()` / `removeScoreNote()` ~1716–1737. **Every path that writes a cell** must
  stamp `at` and apply the push-or-replace rule — find them all (grep `scores[` writes across `src/`,
  including paste/sweep paths such as `src/past-due.js`), and say in your report which ones you found.
  A note-only edit counts as a change to the cell (Acceptance 1 says *score, flag or note*).
- **The pattern to copy for the projector.** `src/score-notes.js` (WO-3.32): one asker of
  `presentationMode()` for notes, a `visible…` reader, and screens that never ask the mode
  themselves. History wants the same shape — one module owns the "may this be drawn" question, and
  `wo-sweep` counts the askers, so check what it will say before adding one.
- **The `at` format.** `docs/data-model.md` § the mark cell's `at` (~248–260): local time with its
  offset, the same form as `localStamp()` in `src/log.js`. Reuse the existing stamp; do not write a
  third.
- **The engine.** `src/grade-engine.js` `scoreCell()` ~49 — the place a history read would leak into a
  grade, and so the natural target for Acceptance 3's mutation.
- **Restore.** `src/backup.js` `parseBackup()` and CLAUDE.md § "A settings block is created by its
  first write, never seeded": `newYearDocument()` gains nothing, and no `SCHEMA_VERSION` bump.
- `docs/data-model.md` § scores — update it for `at` and `was` in the same sitting.

**Traps the work order does not spell out**

- **The five-minute boundary needs a clock finer than `--today`.** `verify-shell.mjs --today=` shifts
  the date, not minutes. Acceptance 2 wants both sides of the boundary checked, so the writer needs a
  `now` it can be handed (as `localStamp(now)` already takes one) or the harness needs a clock it can
  set inside the page. Extend the existing harness — **no second harness, no throwaway script**.
- **Do not push on a no-op.** Leaving a cell whose value, flag and note did not change is not a
  change; a commit that changes nothing must neither push nor restamp. Decide it and test it.
- **"Neither shows under the projector" covers the cell's accessible name and tooltip too**, exactly as
  WO-3.32 did for "has a note". Absent from the DOM means no attribute, no class, no count.
- **Acceptance 7's sweep check** goes in `tools/wo-sweep.mjs` as a numbered section, and its call-site
  count in `tools/README.md` must be updated in the same edit (WO-3.26's red sweep was exactly this).
- **Bump `CACHE` in `sw.js`** if any file in `SHELL` changes.
- **Revert every mutation before writing anything else**, and `grep -rn MUTATION src tools index.html`
  must be empty before you report (AGENTS.md; WO-5.1, WO-5.3 and WO-5.4 each shipped one).
- `plans/future-features.md` § Gradebook should already carry the parked signals question — confirm
  it does; add it if not. Do not act on it.
- Commit nothing; the orchestrator's session does not commit either. Leave the tree for the verifier.

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

## 5. Done means these 8 lines, reported against one by one

1. Changing a cell's score, flag or note more than five minutes after its last write pushes the previous cell onto `was` with its `at`, and the current cell carries a new `at`.
2. A change within five minutes replaces the cell and pushes nothing, checked on the harness's shifted clock either side of the boundary.
3. Every grade on every screen is byte-identical to the same document with every `was` removed. **Mutation-proved**: an engine that reads a history entry goes red.
4. Student detail lists the history in order, with dates, and a cell with no history shows nothing extra.
5. A cell with history carries the grid's history mark and a cell without it does not, and a cell with both a note and history shows both marks, told apart. In presentation mode neither the history mark nor the student-detail trail is in the DOM.
6. A backup written before this lands restores unchanged, and a year with history round-trips.
7. No exported reader outside the detail screen's own path returns `was`, and a sweep check keeps it that way.
8. 👤 On the iPad, revising a score and opening the student shows the history reading clearly.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

