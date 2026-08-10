# WO-2.18 — the term-switch checks cover every surface the repaint paints · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.18-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at the Opus tier, on the work order's own merits. The deciding signal is
that the Traps here are pure judgment rather than mechanics — "do not widen `paintRenderedTotals()` to
make it easier to observe" and "do not assert the detail panel by re-reading the totals map" are both
traps a model optimising for an easy-to-write check walks straight into, and the mutation step asks you
to edit `src/attendance.js` and restore it byte-identically while Acceptance line 5 forbids any `src/`
drift at all. The runner-up I set aside: the Acceptance list is mechanically checkable and there is no
UI here, which reads Codex — but the spec for this one lives *inside* the work order as prose reasoning
rather than in `docs/data-model.md`, and honouring prose reasoning is what the Claude column is for.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.18 — the term-switch checks cover every surface the repaint paints

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-10 · **Size** S · **Depends on** WO-2.17 · **Blocks** nothing, and
that is the point — it is the row to cut first if the fortnight tightens
**Closes roadmap** *(no box. Harness, not app: nothing here changes what a teacher sees. It closes no
product box, and inventing one would be the drift WO-2.15 and WO-2.16 exist to catch — the same call
WO-2.17 made.)*

**Not a go-live blocker.** Added 2026-08-10, out of WO-2.17's verification. Nothing here writes
student data or reaches a classroom, and **nothing here is a defect in what WO-2.17 shipped** — the
behaviour is correct today. What is missing is the check that would notice if it stopped being.

**Why it exists.** `paintRenderedTotals()` paints **three** surfaces that know which term is open —
the class line, one line per student row, and the open detail panel (`src/attendance.js:3300-3306`).
Its own header comment says so, in those words. WO-2.17's seven harness checks assert the first two
and **no fixture has a detail panel open across the term switch**. So deleting `paintDetail(totals)`
at `src/attendance.js:3306` leaves all seven green while an open panel keeps the previous term's
figures on screen — which is the original WO-2.17 defect, surviving inside the work order that fixed
it, on the one surface a teacher opens *because* she wants the detail.

**A check that asserts two of three painted surfaces licenses the third to be deleted.** That is the
general statement, and it is worth more than the instance: this is the second time on this chain that
correct numbers have been mistaken for a correct fix. WO-2.17's verifier ran a blanket-repaint
mutation and watched both "the figures moved" checks stay green — the row sentinel was the only thing
that separated the right fix from a wrong one that computed the right answer. Same shape here, one
surface along.

**And the second half of an Acceptance line was read rather than run.** WO-2.17's fourth line asks
that `selectTerm()` still return without writing when the term id does not belong to the open class
(`src/classes.js:478-479`). Nothing in the harness ever drives it with another class's term id, so
that half was confirmed by reading the guard. The guard is two lines and obviously right, which is
exactly the condition under which a guard gets refactored away — and the failure it prevents is a
preference naming a term the open class does not have, which is the case `src/classes.js:480-483`
keys the whole preference per class to avoid.

**Deliverables**
- **A check with a detail panel open across the term switch**, asserting the panel's own figures move
  with the class line and the row line. The WO-2.17 fixture already builds what this needs — two dated
  terms, `wo217-student`, three meetings against five — so this extends that block rather than
  standing up a second one.
- **The check is proved by a mutation, and the proof is written down.** Drop `paintDetail(totals)` at
  `src/attendance.js:3306`, run the harness, and the new check must go red **while the other seven
  stay green**. If they all go red, the fixture is coupled and the check is not measuring what it
  claims. Record the mutation and its result in `tools/README.md`, the way WO-2.17's is.
- **A check that drives `selectTerm()` with a term id belonging to a different class** and asserts
  that nothing was written: the preference unchanged, the class bar unmoved, and no announcement. Two
  classes with terms already exist in the fixtures; this needs an id from one aimed at the other.

**Out of scope** — anything in `src/`. If a check goes red against current code, that is a defect
found and it gets its own work order; do not fix the app from inside this one. And **no new fixture
year** — everything here hangs off what WO-2.17 already builds.

**Acceptance**
- [ ] With a detail panel open, switching term moves the panel's figures in the same paint as the
      class line and the row line.
- [ ] Deleting `paintDetail(totals)` at `src/attendance.js:3306` turns the new panel check red and
      leaves WO-2.17's seven green — run, not reasoned, with the counts before and after quoted.
- [ ] `selectTerm()` called with another class's term id writes no preference, moves no highlight and
      announces nothing — asserted from the harness rather than from reading the guard.
- [ ] `node tools/verify-shell.mjs` passes whole, and `node tools/wo-sweep.mjs` shows no new line.
- [ ] `src/` is byte-identical to HEAD across the whole work order.

**Traps** — **Do not widen `paintRenderedTotals()` to make it easier to observe.** The narrowness is
the deliverable WO-2.17 shipped, and a check that needs the code changed to be checkable is measuring
the change. **And do not assert the detail panel by re-reading the totals map** — read the text the
teacher reads, out of the panel in the DOM, for the same reason WO-2.17's row sentinel is an attribute
on a surviving element rather than a count: a figure recomputed correctly and never painted is the
whole bug.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance.js`
  - `src/classes.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Open these at the exact places, because everything this work order asks for extends something that
already exists rather than standing anything new up:

- **`tools/verify-shell.mjs:6580-6760`** — the whole WO-2.17 block, `the term nav repaints the screen
  it is sitting on`. Its header comment (6580-6603) is the design rationale for the seven checks you
  must leave green. Its fixture (6606-6673) is the one you extend: `TERM_A`/`TERM_B` =
  `tm_wo217a`/`tm_wo217b`, `wo217-student`, three meetings in one window against five in the other,
  and the `data-wo217-sentinel` attribute planted on one grid row at 6670-6671. **No new fixture year
  — hang the two new checks off this block.**
- **`src/attendance.js:3295-3310`** — `paintRenderedTotals()` and its header comment naming the three
  surfaces. Line 3306 is the `paintDetail(totals)` call you will delete, run, and restore.
- **`src/classes.js:470-490`** — `selectTerm()`, its two-line foreign-term guard at 478-479, and the
  per-class preference key at 480-483 that explains why the guard matters.
- **`tools/README.md:442-459`** — WO-2.17's own entry, ending "Two mutations, both reverted and
  tabulated in `TESTING.md` § WO-2.17." That paragraph is the shape your record must match, and the
  **522** count at its head is the running total you update. The mutation table itself lives in
  **`TESTING.md:1842`** § WO-2.17 — put yours alongside it, same table format.

Three things to hold onto while you work:

- **The mutation is the deliverable, not a formality.** Acceptance line 2 says *run, not reasoned*.
  Quote the pass/fail counts before the mutation, after the mutation, and after the revert. If all
  eight go red the fixture is coupled and the check is not measuring what it claims — say that plainly
  rather than adjusting until it looks right.
- **`src/` must come back byte-identical.** Prove it, do not assert it: `git status --short src/` and
  `git diff --stat src/` both empty at the end, quoted in your result file.
- **`Closes roadmap` is deliberately no box.** Do not invent one. This is harness, not app; nothing
  here changes what a teacher sees. Tick nothing outside this work order's own Acceptance list and the
  `TESTING.md` / `tools/README.md` records the Deliverables ask for.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Inlined verbatim from `plans/work-orders/ROUTING.md` into every brief, on both routes:

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

## 5. Done means these 5 lines, reported against one by one

1. With a detail panel open, switching term moves the panel's figures in the same paint as the class line and the row line.
2. Deleting `paintDetail(totals)` at `src/attendance.js:3306` turns the new panel check red and leaves WO-2.17's seven green — run, not reasoned, with the counts before and after quoted.
3. `selectTerm()` called with another class's term id writes no preference, moves no highlight and announces nothing — asserted from the harness rather than from reading the guard.
4. `node tools/verify-shell.mjs` passes whole, and `node tools/wo-sweep.mjs` shows no new line.
5. `src/` is byte-identical to HEAD across the whole work order.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

