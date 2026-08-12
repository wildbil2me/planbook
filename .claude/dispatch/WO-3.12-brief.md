# WO-3.12 — the grade-engine cases cover the arguments the engine actually takes · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.12-result.md` — as your last act, and return it in-band too.

**Routing decision.** This work order routed to **Codex** on the rubric — the spec is complete and
inside the work order (exact fixture values, the exact expected string), the Acceptance lines are
literally counts of green and red checks, there is no UI and no sensitive surface, and WO-2.17 and
WO-2.18 already fixed the pattern for recording mutations. It was **re-routed to Claude Sonnet**
before dispatch on one piece of evidence: `tools/verify-shell.mjs:192` builds the browser profile
with `fs.mkdtemp(path.join(os.tmpdir(), 'pb-verify-'))`, a write *outside the repo*, and Codex runs
under `--sandbox workspace-write`, which cannot make that directory — so Codex could not have run
the harness at all, and seven of the eight Acceptance lines here are run evidence. (The Codex probe
itself passed clean, `SMOKE OK`, exit 0; the runner is healthy, the sandbox is the constraint.) The
runner-up I set aside: raising the tier to Opus on the WO-2.4 precedent, where Codex's only landed
run took two FAILs and both were harness-vacuity defects. Declined — that would be re-rubricing a
work order whose mutation protocol is spelled out line by line, and the Opus verifier is the
backstop for exactly that failure.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.12 — the grade-engine cases cover the arguments the engine actually takes

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-11 · **Size** S · **Depends on** WO-3.4 · **Blocks** nothing, and
that is deliberate — the arithmetic is right today, so this is a row to cut if the fortnight tightens
**Closes roadmap** *(no box. Harness, not app: nothing here changes what a teacher sees. Inventing a
product box for harness work is the drift WO-2.15 and WO-2.16 exist to catch — the same call WO-2.17
and WO-2.18 both made.)*

**Not a go-live blocker, and nothing here is a defect.** Added 2026-08-10, out of WO-3.4's second
verification. `src/grade-engine.js` is correct as shipped and its twelve worked cases all pass. **Do
not go hunting for a bug; there isn't one.** What is missing is the check that would notice if the
code stopped being correct.

**Why it exists.** WO-3.4's thirteen harness checks were mutation-tested at verification, and nine of
nine arithmetic mutants died — dropping the `possible === 0` guard, making `missing` stop adding to
`possible`, treating `excused` as `missing`, penalising `late`, capping the class grade at 100,
dividing by 100 instead of `activeWeight`, skipping the `isBalanced()` gate, returning `0` for no
graded work, and letting a blank cell add to `possible`. That suite is real evidence. **Five mutants
survived**, and they fall into two groups, both of which are about the *inputs the cases use* rather
than about the arithmetic they check.

**Group 1 — the fix that landed this week has no standing check.** WO-3.4's correction round routed
the weight total through `formatWeight()` (`src/grade-engine.js:96`) so the engine's "no grade yet"
message and the categories banner stop disagreeing about the same class on the same screen. The only
unbalanced-weight fixture in the harness is `50 / 30 / 15 = 95` — **integers, which is exactly the
case where the bug could not appear.** Measured at verification: reverting `formatWeight(total)` to
raw concatenation leaves **all thirteen checks green.** The defect was real — with `40.1 / 34.7 / 20`
the banner read `94.8%` and the engine read `94.80000000000001%` — and the fix is real, and today
nothing would catch it coming back. A fixture whose values cannot express the failure is the shape
this project has now recorded three times.

**Group 2 — every case is one class, one term, one student.** `c1`, `t1`, `s1` throughout
`docs/grade-math-cases.md`. An engine that ignored `classId`, `termId` or `studentId` **entirely**
passes all thirteen checks — confirmed by mutation, not by inspection: three separate mutants
dropping those filters all stayed green. The filters do hold in the source
(`src/grade-engine.js:34-37` and `:41-42`), which is why this is missing coverage and not a live
defect. But the engine's whole job is to answer *for one student, in one class, in one term*, and its
three most important arguments are currently unexercised. This is the WO-3.3 `classId` scar sitting
forty lines above WO-3.4 in this same file, in the one place that scar has not yet been checked.

**Deliverables**
- **A decimal-weight case.** Extend WO-3.4's case-8 fixture with `[40.1, 34.7, 20]` and assert the
  message reads `The category weights total 94.8%, so there is no grade yet.` — the string, not the
  number, because the string is what the teacher reads and what disagreed with the banner.
- **Multi-class, multi-term, multi-student fixtures**, so that each of the three filters is
  independently exercised: an assignment in another class, an assignment in another term, and a
  second and third student with different cells, each asserted to leave the subject's grade untouched.
- **Every new check is proved by a mutation, and the proof is written down.** Revert
  `formatWeight(total)` to raw concatenation and the decimal-weight check must go red **while the
  other thirteen stay green**. Drop each of the three filters in turn and the matching check must go
  red while the rest stay green. If a mutation reddens everything, the fixture is coupled and the
  check is not measuring what it claims. Record each mutation and its result in `tools/README.md`,
  the way WO-2.17's and WO-2.18's are.
- **`docs/grade-math-cases.md` gains the new cases** in the same hand-computed form as the existing
  twelve, since that document is the suite's source of truth and a check whose expected value is not
  written there has nowhere to be checked against.

**Out of scope** — anything in `src/`. The arithmetic is verified correct; this work order adds no
behaviour. If a new check goes red against current code, **that is a defect found and it gets its own
work order** — do not fix the app from inside this one. Also out of scope: the weight-`0` message
noted at WO-3.4's verification (a category holding the only graded work at weight `0` reports "There
is no graded work yet", which is factually off though the numeric answer is right). That is a wording
question for the screen that renders it, and it belongs to WO-3.5 or later.

**Acceptance**
- [ ] A case with weights `40.1 / 34.7 / 20` asserts the message string reads `94.8%`, not
      `94.80000000000001%`.
- [ ] Reverting `formatWeight(total)` at `src/grade-engine.js:96` to raw concatenation turns that
      check red and leaves WO-3.4's thirteen green — run, not reasoned, with the counts before and
      after quoted.
- [ ] An assignment in a second class does not move the subject's grade, and dropping the `classId`
      filter turns that check red on its own.
- [ ] An assignment in a second term does not move the subject's grade, and dropping the `termId`
      filter turns that check red on its own.
- [ ] A second student's cells do not move the subject's grade, and reading the first student's cell
      regardless of id turns that check red on its own.
- [ ] The new cases are written into `docs/grade-math-cases.md` with hand-computed expected values.
- [ ] `node tools/verify-shell.mjs` passes whole, and `node tools/wo-sweep.mjs` shows no new line.
- [ ] `src/` is byte-identical to HEAD across the whole work order.

**Traps** — **A mutation that reddens every check has proved nothing.** The point of each proof is
that one check moves and the others do not; that is what separates a check that measures its own
subject from a fixture so coupled that any damage anywhere shows up everywhere. And **do not rewrite
the existing twelve cases to be multi-class.** They are the hand-computed record that WO-3.4 was
verified against, they are readable by a teacher with a calculator, and their simplicity is a feature.
Add cases; do not complicate the ones that exist.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/grade-math-cases.md`
  - `src/grade-engine.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these, and the reason for each:

- **`tools/verify-shell.mjs:4072` onward — the `grade engine (WO-3.4)` block.** That is the whole of
  your working surface. Case 8, the unbalanced-weight case you are extending, is at **`:4245`** and
  its balanced counterpart at **`:4252`**. The engine seam the block drives is
  `window.planbook.gradeEngine` (`:4105`).
- **`src/grade-engine.js:96`** — the `formatWeight(total)` call your first mutation reverts, and
  `:34-37` / `:41-42` — the three filters your other three mutations drop. **Read them; do not
  change them.** Acceptance line 8 is that `src/` comes out byte-identical to HEAD.
- **`TESTING.md` § WO-2.17 (line 1842) and § WO-2.18 (line 1877).** These are the *format* the work
  order means when it says "the way WO-2.17's and WO-2.18's are." The split in practice: the
  **mutation table** lives in a new `TESTING.md` § WO-3.12 — a two-column `| Mutation | Result |`
  table, each row naming what was changed and what went red — and `tools/README.md` gets the
  **narrative paragraph** with the new check count and the closing sentence
  *"N mutations, all reverted and tabulated in `TESTING.md` § WO-3.12."*
- **`tools/README.md:487`** — *"Update this line when you add checks."* The running count lives
  there and you must move it.

### The baseline, measured on this tree just now — do not do arithmetic on it

```
591 checks · 591 passed · 0 failed · 0 skipped · 194s
```

Quote the *after* figure from a run, not from `591 + N`. `tools/README.md` has recorded a stale
count three times, most recently reading 522 when the tree measured 535, and each time the arithmetic
was the reason. **Watch the `skipped` column specifically: it is `0` now and must still be `0` when
you finish.**

### Three scars this work order sits directly on top of

- **A check that cannot fail and a check that cannot run are the same defect wearing different
  signs, and only one of them shows in a summary line.** WO-2.4 shipped ten checks behind an early
  `if (!term) return null`; every one skipped, and the suite still exited 0. That is why each of your
  new checks needs its mutation actually run — a green suite proves nothing about a check that never
  executed. See `plans/dispatch-retro.md:186`.
- **A shared fixture carries invariants that are somebody else's acceptance criteria.** The
  Deliverables say to *extend* WO-3.4's case-8 fixture and to add multi-class/term/student fixtures.
  Extending is not editing: WO-3.4's twelve hand-computed cases are the record it was verified
  against, and the Traps line forbids complicating them. If a fixture you need conflicts with one
  that exists, stand up your own rather than reshaping theirs — and if a block lends itself state, it
  removes it in its own restore.
- **A fixture whose values cannot express the failure is not evidence.** That is the entire premise
  of this work order (`50 / 30 / 15` are integers, so the float bug could not appear), so do not
  reproduce it in the fixtures you add. The multi-class, multi-term and multi-student fixtures each
  need to carry a cell whose value would *visibly move the subject's grade* if the matching filter
  were dropped — a second student whose scores happen to average the same as the first proves
  nothing.

### The shape of a finished mutation proof

For each of the four mutations, the report needs the same three things, quoted from real runs:
the summary line **before** the mutation, the summary line **during** it, and the **name** of the
check or checks that went red. The pass condition is *one check moves and the rest do not*. If a
mutation reddens more than its own check, say so plainly and investigate the coupling rather than
reporting it as a success — WO-2.18 found exactly that (a mutation it predicted would turn one red
turned two) and the honest note is what made the result usable. Revert every mutation before the
final run.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Inlined verbatim into every brief, whatever the route. Most of these do not bind a harness-only work
order — there is no UI here and nothing new for a teacher to touch — but the last two do, and the
last one is the one to re-read:

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

## 5. Done means these 8 lines, reported against one by one

1. A case with weights `40.1 / 34.7 / 20` asserts the message string reads `94.8%`, not `94.80000000000001%`.
2. Reverting `formatWeight(total)` at `src/grade-engine.js:96` to raw concatenation turns that check red and leaves WO-3.4's thirteen green — run, not reasoned, with the counts before and after quoted.
3. An assignment in a second class does not move the subject's grade, and dropping the `classId` filter turns that check red on its own.
4. An assignment in a second term does not move the subject's grade, and dropping the `termId` filter turns that check red on its own.
5. A second student's cells do not move the subject's grade, and reading the first student's cell regardless of id turns that check red on its own.
6. The new cases are written into `docs/grade-math-cases.md` with hand-computed expected values.
7. `node tools/verify-shell.mjs` passes whole, and `node tools/wo-sweep.mjs` shows no new line.
8. `src/` is byte-identical to HEAD across the whole work order.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

