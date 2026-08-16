# WO-2.35 — a key bound any way but a literal comparison is invisible to both key checks · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.35-result.md` — as your last act, and return it in-band too.

**Routing decision.** This routed to **Claude at the Opus tier** because its central deliverable is a
decision rather than an implementation — *"a decision on how wide the binding read should be, written
into the harness comment where the next reader hits it"* — and its Traps are judgment throughout
(*"do not widen the pattern by guessing"*, *"`e.code` is a different property, not a different
spelling"*), which is `ROUTING.md`'s "Traps about judgment, not mechanics" test. The runner-up I set
aside: size S, zero `src/` change in the delivered tree, and a regex edit inside a static-analysis
block, which reads Codex-shaped under "acceptance criteria are mechanically checkable." I set it
aside because nothing here is specified outside the work order for a runner to match — the spec *is*
the decision you are being asked to take — and because the work order's own Traps call the two
~4.5-minute harness runs *"a routing fact before it is an implementation one."* You are on Opus on
the work order's own merits, not as a fallback.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.35 — a key bound any way but a literal comparison is invisible to both key checks

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-16 · **Size** S · **Depends on** WO-2.34 · **Blocks** nothing, and
that is deliberate — both checks are correct on today's tree, so this is a row to cut if the fortnight
tightens
**Closes roadmap** *(no box. Harness, not app: nothing here changes what a teacher sees. The same call
WO-3.12, WO-3.21, WO-3.24 and WO-2.34 made.)*

**Not a go-live blocker, and nothing here is a defect.** Booked 2026-08-16 out of WO-2.34's
verification. Every key either check reads is written as a literal comparison today, so both are
telling the truth about the tree they are on. **Do not go hunting for an undocumented key; there
isn't one.** What is missing is the check noticing when a key stops being written that way.

**Why it exists.** Both key-legend checks in `tools/verify-shell.mjs` learn what the code binds by
grepping for a literal equality: the score-grid block matches `key === '…'` and `letter === '…'`
inside `handleScoreKey()`, and WO-2.34's marking-screen block matches `e.key === '…'` below the
class-view guard, plus the quoted letters of `MARK_KEYS`. **A binding written any other way is bound
and invisible** — a `switch (e.key)` with `case` labels, an `includes()` or `indexOf()` over an array
that is not `MARK_KEYS`, a `startsWith`, a comparison against `e.code` rather than `e.key`, or a
lookup object keyed by the key name. The check reads the same number of bound keys it read yesterday,
finds every one of them on the legend, and passes — while the legend is missing the row for the key
that was just added. That is precisely the failure WO-3.22 was written to stop, arriving through a
door WO-3.22 left open.

**The limit is known and written down, which is what makes this a row rather than a defect.** The
score-grid block's own comment names it — *"A comparison written any other way arrives here as a key
this block cannot see, which is the honest limit of a static read and the reason the count below is
asserted rather than assumed."* WO-2.34 inherited the shape deliberately. **But the second half of
that sentence does not hold, and that is the finding.** The asserted count is a floor —
`bound.length >= 8` on the score grid, `>= 9` on the marking screen — and a key added through a
`switch` does not lower it. `bound.length` stays exactly where it was, the floor passes, and nothing
goes red. The floors catch a regex that stops matching *everything*; they cannot catch a regex that
matches everything it used to and misses only the new thing. **A mitigation that does not cover the
case it is cited for is worse than none**, because the comment stops the next reader looking.

**Deliverables**
- **A decision on how wide the binding read should be**, written into the harness comment where the
  next reader hits it: widen the pattern to the forms a hand actually reaches for here, or assert the
  *absence* of the forms it cannot read, or both. Either is acceptable; leaving it unsaid is not.
- **Whichever is built, it covers both blocks** — the score grid's and the marking screen's. The two
  were deliberately kept separate by WO-2.34 and that decision stands; covering both does not mean
  merging them.
- **A floor that a new invisible binding actually trips**, if the chosen answer is the assert-the-
  absence one. A grep that finds `switch (e.key)` in the listener and fails, naming it, is a check;
  a comment saying not to write one is not.
- **The `e.code` case decided by name.** It is the one form on the list that is not a stylistic
  variant — it reads a different property with different values, and a check widened to spell it
  wrong would be worse than one that admits it cannot see it.

**Out of scope** — merging the two blocks into a shared helper (WO-2.34 decided that and gave its
reasoning), rewording either legend, and adding or removing any binding. If widening the read turns
either check red against current code, **that is a defect found and it gets its own work order.**

**Acceptance**
- [ ] Both key checks are covered — score grid and marking screen — and both still pass on the
      delivered tree.
- [ ] Adding a binding in a form the pre-work-order check could not see, with no legend row added,
      turns a check red and names it — run, not reasoned, with the counts before and during quoted.
      **This is the whole work order**; a green run proving nothing changed is not evidence.
- [ ] The existing mutations still work: removing a bound key while its row stays, and deleting a row
      while its key stays bound, both still go red on both blocks. Run at least one of the four.
- [ ] The decision is written in the harness comment, and the score-grid comment's claim about the
      asserted count is corrected or removed — it is currently false.
- [ ] `node tools/verify-shell.mjs` passes whole, the check count in `tools/README.md` moved in step
      if a call site was added, and `git diff --stat -- src/` is empty across the whole work order.

**Traps** — **The floors are not the mitigation and the comment says they are.** Read WO-2.34's
result and this work order's third paragraph before trusting either block's comment on this point.
**Do not widen the pattern by guessing**: a regex that matches a form nobody writes here costs a
reader's time forever and catches nothing. **`e.code` is a different property, not a different
spelling** — `e.code === 'KeyP'` where `e.key === 'P'`, and a map that conflates them documents a
key the app does not bind. **Acceptance needs at least two full harness runs at ~4.5 minutes each**,
which is a routing fact before it is an implementation one.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **`.claude/dispatch/WO-2.34-result.md`** — the Traps section names it directly: *"Read WO-2.34's
  result and this work order's third paragraph before trusting either block's comment on this
  point."* WO-2.34 built the marking-screen block you are widening and wrote down why it inherited
  the score grid's shape. Read it before you touch the block.
- **The two blocks themselves, which are adjacent and both in scope:**
  - `tools/verify-shell.mjs:253-301` — the score-grid block (WO-3.22). Its `bound` regex is
    `/\b(?:key|letter) === '([^']+)'/g` over the body of `handleScoreKey()`. The comment at
    `:266-269` is the one the work order says is currently false: it cites the asserted count as the
    mitigation for a comparison written another way, and Acceptance line 4 wants that corrected or
    removed.
  - `tools/verify-shell.mjs:303-422` — the marking-screen block (WO-2.34). Its `bound` is
    `e.key === '…'` literals below the class-view guard, unioned with the quoted letters parsed out
    of `MARK_KEYS`. Its long header comment carries four structural facts and two decisions
    (one-check-or-two, and `stray` asking `bound` rather than `GLYPH_OF`) — **preserve all of them.**
- **`src/scores.js` → `handleScoreKey()`, and `src/shell.js` → the keydown listener** holding
  `MARK_KEYS`, `KEYS_MODAL` and the class-view guard. These are the two bodies both checks read. You
  are reading them to learn **what forms this codebase's hands actually reach for** — that is the
  evidence base for "do not widen by guessing." A sweep of `src/` for `switch (`, `e.code`,
  `.includes(` and `indexOf(` near key handling is legitimate evidence-gathering; picking forms off
  the work order's list because they are listed is the guessing it forbids. The work order names the
  candidate forms but does **not** decide which are real here. That call is yours, and it belongs in
  the comment with its reasoning.
- **`plans/work-orders/phase-2-attendance.md` § WO-2.34** (immediately above WO-2.35) and the
  WO-3.22 row in `plans/work-orders/phase-3-grades.md` — the two work orders whose scars this one
  inherits. WO-3.22's shipped defect (`stray` asking the harness's own table, which answers "still
  bound" forever) is the shape of mistake to not re-make in a new form.

**Four things specific to this dispatch, none of them re-litigable:**

1. **Acceptance line 2 is the work order, and it is a run, not an argument.** You must actually add
   a binding in a form the pre-work-order check could not see, with no legend row, and watch a check
   go red and name it. Quote the `bound.length` counts before and during. A green run proving
   nothing changed is explicitly not evidence.
2. **That mutation must be reverted.** Acceptance line 5 requires `git diff --stat -- src/` empty
   **across the whole work order**, and line 2 requires you to have edited `src/` temporarily to
   prove the check bites. Both are true at once only if you restore. Verify the restore with the
   command itself, not from memory, and quote it.
3. **Two blocks, still two blocks.** Covering both does not mean merging them — merging is named in
   **Out of scope**, and WO-2.34's header comment already argued the point at length. Whatever you
   build, build it twice if that is what keeping them independent costs.
4. **If widening turns either check red against current, unmutated code, stop and report it.** The
   work order is explicit: *"that is a defect found and it gets its own work order."* Do not fix the
   app, do not reword a legend, do not soften the pattern to make the red go away.

**On running the harness.** `verify-shell.mjs` drives headless Edge over CDP and often cannot run in
a sandboxed agent — but it *did* run in one twice on 2026-08-16, so try it properly before concluding
anything. Here the distinction matters more than usual: Acceptance line 2 **cannot be satisfied by
reasoning**, so "could not run the harness" is a **blocked** report on lines 1, 2, 3 and 5, not a
pass with a caveat. Say so plainly if it happens and leave those boxes `- [ ]`; the run gets redone
at the desk. Budget for the wall clock — two full passes at ~4.5 minutes each is the floor, and the
mutation cycle needs more.

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

## 5. Done means these 5 lines, reported against one by one

1. Both key checks are covered — score grid and marking screen — and both still pass on the delivered tree.
2. Adding a binding in a form the pre-work-order check could not see, with no legend row added, turns a check red and names it — run, not reasoned, with the counts before and during quoted. **This is the whole work order**; a green run proving nothing changed is not evidence.
3. The existing mutations still work: removing a bound key while its row stays, and deleting a row while its key stays bound, both still go red on both blocks. Run at least one of the four.
4. The decision is written in the harness comment, and the score-grid comment's claim about the asserted count is corrected or removed — it is currently false.
5. `node tools/verify-shell.mjs` passes whole, the check count in `tools/README.md` moved in step if a call site was added, and `git diff --stat -- src/` is empty across the whole work order.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

