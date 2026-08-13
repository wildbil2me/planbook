# WO-3.6 — Past-due prompt · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.6-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude, Opus tier**, on its own merits rather than as a fallback.
The deciding signal is that this work order's whole value is in *not* doing the obvious thing: the
project asserts "`late` and `missing` are teacher-marked, never inferred from a date" in `CLAUDE.md`,
`docs/data-model.md` § "Missing is marked, never inferred", `src/assignments.js` decision 1 and
`src/scores.js` decision 1 — and WO-3.6 asks you to read the due date anyway, as a suggestion and
nothing else. That is a judgment trap, and it comes with teacher-facing copy and an unspecified
surface. The runner-up I set aside: the four Acceptance lines are unusually mechanically checkable,
which is a genuine Codex signal — but the spec lives nowhere outside the work order, so there is
nothing for a spec-follower to match against.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.6 — Past-due prompt

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-13 · **Size** S · **Depends on** WO-3.5
**Closes roadmap** Phase 3 → "Past-due blanks generate a prompt."

**Why it exists.** An earlier draft computed missing from the due date — blank plus past-due equalled
zero. Explicit marking is better and it's what the owner asked for: the grade never changes because
a date rolled over, and a teacher who hasn't finished grading isn't accidentally failing half the
class. The due date is still useful, but **only as a prompt**.

**Deliverables**
- On opening an assignment or a class gradebook: "6 blanks are past due — mark them missing?"
- Accept marks them all `missing`; dismiss does nothing and stays dismissed for that assignment.
- A way to review which blanks it means before accepting.

**Acceptance**
- [ ] Dismissing the prompt changes no score and no grade.
- [ ] The grade before accepting is identical to the grade with the prompt never shown.
- [ ] Accepting writes `{ v: null, flag: "missing" }` to exactly the previewed cells.
- [ ] A dismissed prompt does not reappear on every render.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **`src/scores.js`, the whole header comment, and decision 1 in particular.** WO-3.5 landed the
  score grid two days ago and wrote your work order into its own source: *"NOTHING READS A CLOCK.
  Not `todayISO()`, not `new Date()`, nothing … everything about a past due date on this screen is
  WO-3.6's prompt."* You are the work order that gets to read the clock on that screen. When you do,
  that comment becomes stale — update it in the same pass, in the same voice, rather than leaving a
  file that denies what it now does.
- **`src/assignments.js`, decisions 1, 3 and 4**, and `renderRow()`'s overdue tint around line 350.
  The tint is the app's existing answer to "this date has gone by" — it *changes no stored value and
  marks no student*, and its `title` string is the register the prompt's copy should sound like.
  Read `todayISO()`'s import comment there too: it is the one clock in the file, imported from
  `src/attendance.js` rather than re-derived, and for a stated reason.
- **`docs/data-model.md` § "Scores" and § "Missing is marked, never inferred"** (around lines 97–105
  and 258–268). The prompt sentence in your Deliverables is quoted verbatim from that second section
  — this work order is that paragraph's implementation.
- **`plans/gradebook-surfaces.md`**, for the surface test, and `src/modal.js` for what a modal
  actually does when it opens.
- **`src/prefs.js`** — the only code allowed to touch `localStorage`, with a closed `PREF_DEFAULTS`
  list and a header explaining what may and may not go in it.
- `src/grade-engine.js` for how a flag reaches a grade, and `design/mockups/` for the drawings of
  these screens.

### Five things this work order will run into, named here so they are not discovered late

These are not extra requirements. They are collisions between your Deliverables and decisions
already recorded elsewhere in the repo. Decide each one deliberately and **say in your result file
what you decided and why** — the way `src/scores.js` and `src/assignments.js` both write their
decisions down at the top of the file.

1. **"Blank" has a precise meaning in this schema, and one kind of blank is not one.**
   `docs/data-model.md` says *no key at all = not graded yet*, and separately that
   `{ v: null, flag: "excused" }` is a blank cell that **leaves the denominator**. Sweeping an
   excused student into `missing` would turn a deliberate teacher decision into a zero. Whatever set
   the prompt counts, the count in the sentence, the rows in the review, and the cells written on
   accept must all be the same set — Acceptance line 3 says *exactly the previewed cells*, and the
   cheapest way to make that true is one computed set used three times rather than three walks of
   the document.
2. **The surface is yours to choose, and one wrong choice regresses a shipped acceptance line.**
   WO-3.5's score grid has no dialog anywhere in it and `Esc` is deliberately unbound; that is an
   acceptance line of a ✅ DONE work order, and `tools/verify-shell.mjs` presses `Esc` twice
   mid-column to prove it. A prompt that opens a focus-trapping modal on arriving at that view would
   break it. `plans/gradebook-surfaces.md`'s test is *a surface you work in → a view; a task you
   finish and dismiss → a modal*, which does not obviously settle a banner that appears unasked.
   Choose, justify, and do not regress the existing check.
3. **Where a dismissal lives is a real question with a rule on each side.** `localStorage` is
   `planbook_`-prefixed **UI preferences only, never student data**, and `PREF_DEFAULTS` is a closed
   list by construction. The year document syncs and is restored from backup, but adding a field to
   it is a schema change and `docs/data-model.md` is the record that would have to say so. Either
   answer can be right; an undocumented one cannot.
4. **An empty due date is valid** (`src/assignments.js` decision 1) and can never be past due.
   Neither can a due date that has not arrived. And read the clock through the app's one clock —
   `todayISO()` from `src/attendance.js` — not `new Date()`, for the reason its import comment gives.
5. **Acceptance lines 1 and 2 are about a grade that must not move.** All the arithmetic is
   `src/grade-engine.js`'s; do not compute a percentage in whatever file you write. Proving those
   two lines means comparing a grade before and after with the prompt shown and dismissed, and
   against a run where it never appeared — a `verify-shell.mjs` fixture, not an argument.

The copy in the Deliverables — *"6 blanks are past due — mark them missing?"* — is a real
deliverable. It pluralises, it names a number, and it is a question rather than a warning. Suite
voice, `design/style-guide.md`, and the tone of the overdue tint's `title` beside it.

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
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
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

## 5. Done means these 4 lines, reported against one by one

1. Dismissing the prompt changes no score and no grade.
2. The grade before accepting is identical to the grade with the prompt never shown.
3. Accepting writes `{ v: null, flag: "missing" }` to exactly the previewed cells.
4. A dismissed prompt does not reappear on every render.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

