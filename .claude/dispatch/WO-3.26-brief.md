# WO-3.26 — the ungraded count on the home screen · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.26-result.md` — as your last act, and return it in-band too.

**Routing decision.** This went to **Claude, Opus tier**, on the sensitive-surface bullet in
`ROUTING.md`: presentation mode is not background here but an explicit Deliverable and an explicit
Acceptance line, and the work order asks you to *re-verify* WO-1.9's inheritance rather than assume
it — that surface is never delegated. The runner-up I set aside: on the other five Codex bullets this
reads Codex-shaped — size S, the spec already settled inside `openWork()`, a `.pill` lift with no new
visual language — but the Codex column is a conjunction and this fails one of its terms. No Codex
probe was run, because it is not a Codex route.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.26 — the ungraded count on the home screen

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-19 · **Size** S · **Depends on** WO-3.4, WO-1.10 · **Blocks** WO-6.4
**Closes roadmap** *(no box. ROADMAP § Phase 3 is 10 of 10 and every box on it is claimed by the work
order that built it. This fills a slot `src/home.js` reserved and named in 2026-08-04, which no
roadmap line ever described — the same shape as WO-3.18, and written without quotation marks anywhere
on this line for the same reason: anything in double quotes here is read as a roadmap fragment.)*

**Booked 2026-08-19, owner-directed, by** [WO-1.25](phase-1-shell-store-roster.md#wo-125--phase-6-is-cut-against-a-model-that-is-not-there)
**out of a read-only audit of Phase 6.**

**Why it exists.** *The home screen accretes* is a standing obligation — every phase adds its line to
WO-1.10's screen rather than deferring it to Phase 6 — and Phase 3 is the phase that owes this one.
`src/home.js` appends `.class-card-signals` empty and names its owner in the file itself,
`WO-3.x — ungraded work`; `src/home.css` holds 24px of reserved height for it so that the first real
datum reflows nothing. **The work order that string points at has never been written.** The phrase
`home screen` appears in no Phase 3 work order at all, and Phase 3 is otherwise finished but for the
OAuth paperwork, so it would have closed with the slot empty and WO-6.4 quietly carrying the debt —
where it would be discovered as a Phase 6 surprise rather than as Phase 3's own line.

**It is worth real value before Ship 2 and it is buildable today.** WO-3.4's engine and WO-1.10's
screen are both ✅ DONE, so nothing here is waiting on anything. What a teacher gets is the answer to
*what have I not graded yet* from the page she opens the app on, on the five cards she is already
looking at.

**It is a Phase 3 work order sitting in § Ship 2 and that does not gate the gate.** WO-G2's
`**Depends on**` is a curated explicit list rather than every row in the ship — [WO-3.25](#wo-325--a-score-cell-takes-any-string-number-can-read-not-any-number-a-teacher-can-mean)
is the precedent, already in that table and named by no gate.

**Deliverables**
- **An ungraded count per class in `.class-card-signals`**, on the home screen's existing card. A
  `.pill`-shaped count inside the 24px the slot already reserves, so no card on the page changes
  height when the first one appears.
- **The count comes from `openWork()` in `src/grade-engine.js` and from nowhere else.** That function
  already owns the three-state answer this needs — `missing` is graded, `open` is ungraded work worth
  points, `bonus` is ungraded work worth zero, and `excused` is in none of them — and a second scan of
  `scores` on this screen is exactly the second answer that comes to disagree with the grade printed
  an inch away. `src/home.js` is a renderer and stays one.
- **What the number counts: assignments, not cells.** An assignment in the open term with at least one
  `open` cell across the class roster. The alternative — blank cells — was considered and not taken:
  the card's tap lands on the class, the grid is organised in columns, and *three assignments waiting*
  is a sentence a teacher can act on where *forty-one blanks* is a number she has to divide first.
  Bonus work is not counted, because zero-point work waiting is not work owed.
- **A class with nothing ungraded shows nothing**, not `0 ungraded`. The slot keeps its height either
  way, so the page does not move; a zero pill is a datum a teacher has to read to learn there is
  nothing to read. *(This is the same call `src/home.js` already makes about the empty slot, and the
  opposite of the honest-empty-state rule only in appearance: an empty state is what a **page** says
  when it has nothing, and this is one chip on a card that has plenty.)*
- **No new control, and that is why there is no new 44px rule.** The count is text inside the card's
  one button, the way `.class-card-state` is since WO-1.13 — `src/home.css` says in as many words why
  that line takes no floor of its own. If this ever becomes tappable it becomes a control and the
  coarse-pointer block gains it in the same pass.
- **Nothing under `supports` reaches this card.** `src/home.js` is deliberately absent from
  `flipPresentationMode()`'s redraw list because a class name and a colour are not a student's file,
  and an ungraded **count** does not change that — it names no student. WO-1.9's acceptance says to
  re-verify that inheritance at every later phase; this is that phase, and the answer is that the
  module stays off the list.

**Acceptance**
- [ ] A class with three assignments holding blank scores shows a count of three; entering the last
      blank score on one of them takes the count to two, with no reload.
- [ ] The count counts what `openWork()` calls `open` and nothing else: a cell marked `excused`, a
      `late` carrying a score, a `0` typed by the teacher, and an assignment marked `missing` are none
      of them ungraded, and a zero-point bonus assignment is not counted either.
- [ ] A class with nothing ungraded shows no chip, and a screenshot of the card in that state is the
      same height as the card beside it carrying a count.
- [ ] The number matches the score grid: open the class and count the columns holding a blank, and
      the two agree.
- [ ] `src/home.js` performs no grade arithmetic of its own — the count is `openWork()`'s rows,
      filtered and grouped, and `wo-sweep.mjs`'s screens-that-ask census still does not list this
      module as one that reads `supports`.
- [ ] Nothing on the card names a student, in presentation mode or out of it.

**Traps** — **Do not infer ungraded from a due date.** Blank means ungraded and affects nothing;
`late` and `missing` are teacher-marked, and `src/past-due.js` is the one place in the app allowed to
read a clock against a blank — it *asks*, and writes only what the teacher accepts. A count that goes
up at midnight is the rule this project has broken and repaired once already.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/grade-engine.js`
  - `src/home.css`
  - `src/home.js`
  - `src/past-due.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these — each one answers a question this work order will raise:

- **`src/detail.js` around lines 143 and 630** — the existing `openWork()` caller, and your
  precedent for how a renderer consumes it without doing arithmetic. Match that shape.
- **`src/grade-engine.js` line 143** — read the signature before you design the call. It is
  `openWork(doc, cls, termId, studentId)`: **per student**, while this work order counts
  *assignments with at least one `open` cell across the class roster*. Reconciling those two is the
  only real design decision in this work order, and it is a union over `openWork()`'s rows — not a
  second scan of `scores`, and not a new engine function unless you can say why the union cannot
  work. Whatever you choose, `src/home.js` still performs no grade arithmetic of its own.
- **`src/home.js` lines 14 and 49–51** — the slot is already named (`WO-3.x — ungraded work`) and
  the file already states, in prose, why it is absent from `flipPresentationMode()`'s redraw list and
  what would change that. Update that comment to say what actually landed; do not silently leave a
  `WO-3.x` placeholder pointing at work that is now done.
- **`src/home.css` lines 165–212** — the 24px (26px coarse) reserved height and the comment
  explaining why it exists. The whole point is that the first real datum reflows nothing, so the chip
  fits *inside* that reserve rather than growing it.
- **`src/shell.js`'s `flipPresentationMode()`** — read the redraw list and confirm `home.js` staying
  off it is still correct once the card carries a count. The work order's answer is that it is; say so
  in your result with the reasoning, and if you conclude otherwise, stop and say that instead of
  changing the list.
- **How the home card knows its term** — `getSelectedTerm()` / `getSelectedClass()` in
  `src/classes.js`. The count is scoped to the open term.
- **`tools/wo-sweep.mjs`'s screens-that-ask census** — Acceptance line 5 asserts this module still
  does not appear in it as one that reads `supports`. Run the sweep and quote what it says.

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

## 5. Done means these 6 lines, reported against one by one

1. A class with three assignments holding blank scores shows a count of three; entering the last blank score on one of them takes the count to two, with no reload.
2. The count counts what `openWork()` calls `open` and nothing else: a cell marked `excused`, a `late` carrying a score, a `0` typed by the teacher, and an assignment marked `missing` are none of them ungraded, and a zero-point bonus assignment is not counted either.
3. A class with nothing ungraded shows no chip, and a screenshot of the card in that state is the same height as the card beside it carrying a count.
4. The number matches the score grid: open the class and count the columns holding a blank, and the two agree.
5. `src/home.js` performs no grade arithmetic of its own — the count is `openWork()`'s rows, filtered and grouped, and `wo-sweep.mjs`'s screens-that-ask census still does not list this module as one that reads `supports`.
6. Nothing on the card names a student, in presentation mode or out of it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

