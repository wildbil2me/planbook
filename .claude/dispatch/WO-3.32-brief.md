# WO-3.32 — a score cell can carry a note · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.32-result.md` — as your last act, and return it in-band too.

**Routing: Claude Opus, on its own merits.** The deciding signal is the sensitive surfaces — this
work order touches presentation mode, the merge-field resolver, backup/restore and potentially
`privacy.html` / `docs/FERPA.md`, all of which are Claude-only in `ROUTING.md`. The runner-up
consideration set aside was that the data half (an optional key on a cell) is small and Codex-shaped;
but the grid mark and the in-grid editor are new visual language and the keyboard trap is judgment,
so it is not split.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.32 — a score cell can carry a note

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-04 · **Size** M · **Depends on** WO-3.5 — the grid whose cells this annotates
**Closes roadmap** *(no box. Owner-requested, 2026-10-02.)*

**Booked 2026-10-02**, owner-directed, from the same sitting as WO-3.30. A revised essay, a
conference, *turned in after the absence*: the reason behind a score has nowhere to go today. **It
goes first of the pair** so that [WO-3.33](#wo-333--a-changed-score-cell-keeps-what-it-was)'s history
holds notes from its first entry.

**The precedent is the attendance mark.** *"Any mark may carry a `note`"*, optional and absent where
unused (`docs/data-model.md`, the mark cell rule). A score cell gets the same field on the same terms.

**Deliverables**
- **An optional `note` on a score cell**, absent where unused, and never an empty string left behind
  by clearing it. A note can sit on any cell, including a blank, a `missing` or an `excused`. The
  grade engine does not read it.
- **Add, read, edit and clear it from the score grid without leaving the grid.** A cell with a note
  shows a discreet mark. The note also shows on student detail beside its assignment. The Surface is
  undrawn: draw it first under `design/mockups/PROTOCOL.md`, or the dispatch rules it is small enough
  not to need one.
- **Under the projector, a score note is absent**: not in the DOM, and its mark is gone too, in
  presentation mode on every screen that draws it. That holds **whatever attendance-mark notes do**
  (the owner's ruling, 2026-10-02, before dispatch). The score grid is the screen most likely to be on
  the wall, and a note is free text about one student. If mark notes turn out to show on the
  projector, the implementer records that as a finding and does not change attendance here.
- **The note goes nowhere outside the app.** No merge field resolves it (the whitelist already
  refuses it, and a check says so). The printed grade sheet leaves it out. It is in the backup. If
  `privacy.html` and `docs/FERPA.md` list what a backup holds, both gain it **in the same sitting**,
  per the rule at the top of each file.

**Acceptance**
- [ ] A note added, edited and cleared from the grid round-trips through the document, and clearing
      it removes the key.
- [ ] Adding or changing a note changes no grade on any screen.
- [ ] A cell with a note shows the mark, and student detail shows the note beside its assignment.
- [ ] In presentation mode no note text and no note mark is in the DOM, on the grid or on student
      detail. **Mutation-proved**: a note rendered regardless of the mode goes red.
- [ ] `{{score.note}}` and every path into a cell are refused by the merge-field resolver, and the
      printed grade sheet contains no note text.
- [ ] A backup written before this lands restores unchanged, and a year with notes round-trips.
- [ ] Keyboard entry in the grid is unchanged: Tab, the arrows and Enter move exactly as before, and
      no shortcut used for flags is taken by the note.
- [ ] 👤 On the iPad, adding a note to a cell and reading it back works under a thumb.

**Traps** — **Do not open the note on a keystroke the grid already uses.** Score entry is the fast
path. **Do not mirror the note into the log.** One note in two places is two records, the same reason
a tardy's time lives in the mark cell and nowhere else.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/PROTOCOL.md`
  - `docs/FERPA.md`
  - `docs/data-model.md`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- Sibling conventions to match rather than re-derive (pointers, not a walkthrough):
  - `src/scores.js` — the grid. `writeCell()` and the "`null` means delete the key" rule (~401–424)
    are where a cell is written; the key routing is ~1590–1700 (`L`/`M`/`X` flags, Enter, arrows,
    the one bound `Esc` on the search box ~1024). Read the header's note on why a modal closes on
    `Esc` (~17) before choosing how the note opens.
  - The attendance mark note — `docs/data-model.md` (~145, ~237) for the field rule, and
    `src/attendance.js` / `src/pass-history.js` for how an existing note is edited and how
    `presentationMode()` (from `src/supports.js`) is asked. **Use `presentationMode()`, not a
    second definition.**
  - `src/merge-fields.js` — the whitelist is an array scanned by `===`; you are adding a **check**,
    not a refusal list entry. Read § Accommodations in `CLAUDE.md` on why.
  - `src/grades-report.js` — the printed grade sheet. `src/backup.js` — `parseBackup()` validates
    against `newYearDocument()`'s shape; adding an optional key on a cell must not refuse an old
    backup.
  - `src/detail.js` — student detail, where the note shows beside its assignment.

**Traps the work order does not spell out:**

- **No screen repaints on `notify()`** (`src/store.js` above `subscribe()`); after writing a note,
  repaint what you changed yourself.
- **Bump `CACHE` in `sw.js`** if you touch any file in `SHELL`.
- **Mutations:** this work order demands one (a note rendered regardless of mode goes red). Mark it
  with the word `MUTATION` in a comment while it is in, and **revert it before writing anything
  else** — `AGENTS.md` § "If you were dispatched with a work order". Three dead dispatches here left
  live mutations under ticked boxes. Run `grep -rn MUTATION src/ tools/ index.html` before your
  result file.
- **The Surface is undrawn.** Either draw it under `design/mockups/PROTOCOL.md` or say in the result
  file, in a sentence, why it is small enough not to need one. Either is acceptable; silence is not.
- **The attendance-note finding** is a report line, not a change: if mark notes show under the
  projector, record it and leave attendance alone (owner's ruling, 2026-10-02).
- **The session window is near the range where dispatches have died** (gate printed 20.4M against a
  16.4M p25). Tick boxes and write the result file as you close things, not all at the end.

Size M: expect a long read before the first write; that is normal.

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

1. A note added, edited and cleared from the grid round-trips through the document, and clearing it removes the key.
2. Adding or changing a note changes no grade on any screen.
3. A cell with a note shows the mark, and student detail shows the note beside its assignment.
4. In presentation mode no note text and no note mark is in the DOM, on the grid or on student detail. **Mutation-proved**: a note rendered regardless of the mode goes red.
5. `{{score.note}}` and every path into a cell are refused by the merge-field resolver, and the printed grade sheet contains no note text.
6. A backup written before this lands restores unchanged, and a year with notes round-trips.
7. Keyboard entry in the grid is unchanged: Tab, the arrows and Enter move exactly as before, and no shortcut used for flags is taken by the note.
8. 👤 On the iPad, adding a note to a cell and reading it back works under a thumb.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

