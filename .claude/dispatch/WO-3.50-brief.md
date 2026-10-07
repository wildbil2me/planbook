# WO-3.50 — the due date picks an assignment's term in the editor too · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.50-result.md` — as your last act, and return it in-band too.

**Routing (orchestrator, 2026-10-07).** I routed this to Claude at **Opus**, on its own merits. The rulings are fully stated, but the work is a new editor close path: a scored-move confirmation whose wording names two terms and a score count, a list that switches term and says why, and a code distinction the Traps demand between a date the teacher typed and the clock moving. That is judgment and teacher-facing prose. I set aside Codex, the runner-up because the rulings read as a spec. The UI work rules it out, and so would the arithmetic: one clean run, plus `--today` runs across a term edge, plus any mutation, at ~4.4 min each, against a 20-minute cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.50 — the due date picks an assignment's term in the editor too

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-07 · **Size** M · **Depends on** WO-3.49
**Closes roadmap** *(no box. Owner-directed, 2026-10-06.)*

**Booked 2026-10-06**, owner-directed, alongside
[WO-3.49](#wo-349--the-copy-dialog-is-one-line-per-class-and-the-due-date-picks-each-copys-term).
The owner's rule, from the school's SIS: **a term is never named; the due date places the work.**
WO-3.49 applies it to copies. This applies it to the editor. Today a new assignment is filed under
the term being viewed (`createAssignment()`, `termId: term.id`, ~line 974 of `src/assignments.js`),
and editing its due date never moves it.

**Proposed at booking and approved by the owner on 2026-10-06.** Rulings 1, 2, 4, 5 and 6 stand as
proposed. Ruling 3 is amended.
1. **A new assignment's term is the one holding its due date**, which is today on creation. A teacher
   viewing a term that does not hold today creates work in today's term. The list moves to that term
   and says so, rather than the new row vanishing.
2. **An edited due date moves the assignment when the editor closes, never per keystroke.** The due
   field writes on every keystroke, including a blank one partway through typing a date (WO-1.47's
   phantom), so a term derived on input would flip mid-typing and take the row off the list behind
   the dialog.
3. **A blank due date takes the assigned date, and the due date still picks the term.** *(Amended by
   the owner, 2026-10-06. The booking read "a blank due date uses the assigned date's term", which
   left the due date blank.)* At the close, a blank due date gets the assigned date copied into it and
   is written. The due date is then the only thing that places the work. With both dates blank, or
   with dates no term holds, the assignment stays where it is and the editor says that no term holds
   its dates. The copy happens at close and never on `input`, under ruling 2. **The consequence is
   intended:** a blank due date can never be past due (`src/past-due.js`, `isDate()`), so the copied
   date makes the work eligible for the overdue tint and the past-due prompt from the next day. The
   owner, asked: a "never past due" assignment does not make sense for work that lives in a quarter.
4. **A move that carries scores says so before it happens.** Scores are keyed by assignment, so moving
   a scored assignment changes two terms' grades, and one of them may already be in the SIS. The
   editor names both terms and the number of scores at the close that would move it.
5. **Existing assignments are not re-filed.** No migration: the rule applies when a date is next
   edited, so an old backup restores exactly as it was.
6. **The copy dialog's source line follows the same rule**, lifting WO-3.49's ruling 5.

**Deliverables** — the editor's close path, the create path, the list's term switch and its note, the
scored-move warning, WO-3.49's source save, harness checks in `tools/verify/assignments.mjs` (with
`--today=` across a term edge), `TESTING.md` § WO-3.50, and a `CACHE` bump.

**Acceptance**
- [ ] Creating an assignment files it under the term holding today, and the list shows that term.
- [ ] Typing a due date in another term does not move the assignment until the editor closes. Then it
      moves once, `rev` moves by one, and the list says where it went.
- [ ] Closing with a blank due date and an assigned date writes the assigned date into `due` and files
      by it. Both blank, or dates no term holds, leave the term unchanged, and the editor says so.
- [ ] Closing on a move that carries scores names both terms and the score count before writing, and
      declining leaves the document byte-identical.
- [ ] An old backup restores with every `termId` unchanged.
- [ ] The copy dialog's source moves with its due date on confirm.
- [ ] `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the iPad, after a force-quit: edit a scored assignment's due date across a term edge, read
      the warning, confirm, and read both terms' lists and grades.

**Traps** — **CLAUDE.md's "the grade must never change because a date rolled over" is about the
clock, and this is a date the teacher typed.** Keep the distinction explicit in the code: nothing
here may re-file work because time passed. **Never derive the term on `input`** (ruling 2).

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/assignments.js`
  - `src/past-due.js`
  - `tools/verify/assignments.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/classes.js` `termContaining(classId, date)` (~line 289) — **the predicate to use, and the only one.** It is WO-2.51's read half of WO-2.50's in-term predicate. Overlapping terms are read first-match, and it answers null for a gap or for undated terms. Do not write a second date-to-term function. `src/assignments.js` ~line 1316–1331 is WO-3.49's use of it for copies. Match that.
- `plans/work-orders/phase-3-gradebook.md` § WO-3.49 (~line 3815) and § WO-3.51 (directly after this one). WO-3.49 ruling 5 is the one ruling 6 here lifts. `setCopySource()` (`src/assignments.js` ~1888) and `copyFieldCleared()`'s `sourceField` branch are its source-line save path. WO-3.51's checks in `tools/verify/copy-class.mjs` press the source Clears, so **they must stay green**. If one goes red on a blank source due date, the cause is ruling 3's fallback, so read the check before touching it.
- `src/grading-mode.js` ~lines 290–311 already counts scores per other term with labels (`termLabel`). Look there before composing the scored-move wording from scratch.
- WO-1.47 / WO-1.48 (phase-1 file): the due field writes on every keystroke, including a transient blank. That is why ruling 2 puts the move at close. **The close path must cover every way the editor closes** (Done, Escape, backdrop, opening another row). A close that skips the move is a silent no-file.
- `src/past-due.js` `isDate()`: ruling 3's consequence is intended. Do not suppress the overdue tint for a copied date.
- Ruling 1's "list moves to that term and says so": the list term is a view state. Do not persist it to the document, and if you persist it at all, use `localStorage` (`planbook_`, UI only). Prefer no persistence.
- **Ruling 5 / Acceptance 5:** no migration and no `SCHEMA_VERSION` bump. Nothing new in `newYearDocument()` (see CLAUDE.md, "A settings block is created by its first write").
- **Ruling 4 / Acceptance 4:** the warning goes **before** any `update()`. "Byte-identical on decline" means comparing the serialized document and `rev` after a `flush()` (see CLAUDE.md § WO-5.3: `update()` only schedules a save).
- **Scope.** If a mutation is used to prove a check, revert it before writing anything else (`AGENTS.md`). The 👤 line is not yours to tick. Keep brief-sized doc edits to `TESTING.md` § WO-3.50 and the work order's own boxes.

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

1. Creating an assignment files it under the term holding today, and the list shows that term.
2. Typing a due date in another term does not move the assignment until the editor closes. Then it moves once, `rev` moves by one, and the list says where it went.
3. Closing with a blank due date and an assigned date writes the assigned date into `due` and files by it. Both blank, or dates no term holds, leave the term unchanged, and the editor says so.
4. Closing on a move that carries scores names both terms and the score count before writing, and declining leaves the document byte-identical.
5. An old backup restores with every `termId` unchanged.
6. The copy dialog's source moves with its due date on confirm.
7. `CACHE` in `sw.js` is bumped.
8. 👤 On the iPad, after a force-quit: edit a scored assignment's due date across a term edge, read the warning, confirm, and read both terms' lists and grades.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

