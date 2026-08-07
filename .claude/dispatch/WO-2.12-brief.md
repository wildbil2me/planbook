# WO-2.12 — Portrait shows today, landscape shows the week · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.12-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, **Opus** tier. The deciding signal is that only the first of four
deliverables is code: the other three are a comment that has to *say which rule is being excepted
and why*, a design cap being reconsidered on taste grounds, and a prior work order's acceptance
line rewritten **with its reason** in two documents — teacher-facing prose and a decision record,
both squarely in `ROUTING.md`'s Claude column. The runner-up I set aside: the `dayColumnCount()`
change itself is a handful of lines of arithmetic already spelled out in the work order, which is a
textbook Codex shape at size `S` — but it is the small end of this work order, ties go to Claude,
and handing the arithmetic to one runner and the prose to another would cost more than it saves.
(WO-2.12 has no row in `ROUTING.md`'s Ship 1 pre-routing table; it was written after that table, so
there is nothing to disagree with.)

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.12 — Portrait shows today, landscape shows the week

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-2.8
**Amends roadmap** Phase 2 → WO-2.1's "students × recent days" grid, in portrait only

**Why it exists.** WO-2.8's 160px `Passes` column joined a grid WO-2.10 had tuned to fit with
nothing to spare, and the day columns paid for it. `dayColumnCount()` became a width budget and
portrait lost columns: four at 768pt, **five at the owner's 834pt 11″**, six only at 1024pt.

WO-2.8 escalated this as a three-way choice — four, five or six, the sixth bought by cutting the
name column to an avatar and an ellipsis. **The owner rejected the question**, 2026-08-07: in
portrait the screen is used at the classroom door to mark *today*, and the six-day window is a
thing you read at a desk. So portrait should show **today only** and landscape should keep six.

What that buys at 834pt: `834 − 80 chrome − 160 Passes − 72 = 522px` for the name column against
today's 232px cap. Full names, no truncation, and the Passes column stops competing for width.

**Deliverables**
- **A portrait rule in `dayColumnCount()`** ([`../../src/attendance.js`](../../src/attendance.js)),
  which is already a width budget and not a breakpoint ladder — this is a few lines, not a rewrite.
- **A documented exception to `MIN_DAY_COLS = 3`**, whose comment currently reads *"Three is the
  fewest this screen will draw."* That rule is not being deleted; it is being given its one
  deliberate exception, and the comment has to say which.
- **The name column's coarse cap revisited** now that it is no longer competing with five day
  columns — it went 256 → 232 under WO-2.8's pressure and that pressure is gone in portrait.
- **WO-2.1's acceptance line 2 rewritten**, in the work order and in
  [`../../TESTING.md`](../../TESTING.md). It is currently qualified with a ⚠ pointing at WO-2.8.
  Six-in-portrait stops being the goal, so the line is not re-closed as written — it is replaced,
  with the reason, and the owner closes the new one.

**Out of scope** — a portrait/landscape toggle the teacher sets by hand. The orientation is the
signal; a preference to override it is a setting nobody will find and everybody will have to
maintain. Also out: any change to what landscape draws.

**Acceptance**
- [ ] Portrait draws exactly one day column — today's — with the Passes column intact.
- [ ] Landscape still draws six, on the same device, with no reload.
- [ ] Rotating the iPad mid-class repaints without losing scroll position or an in-flight mark. 👤
- [ ] Full student names are readable in portrait without truncation, at the owner's roster's
      longest name. 👤
- [ ] The grid's wrap does not overflow in either orientation — the `overflow-x` valve stays shut,
      which is the WO-2.10 defect this must not reopen.
- [ ] A narrow **laptop** window does not fall to one column. Orientation is the signal, not width
      alone, and a 900px browser window is landscape.

**Traps** — **`dayColumnCount()` is measured off `window.innerWidth`, not off the panel**, and the
comment above it explains why: this screen can legitimately be painted while `#classView` is still
hidden, and a hidden element measures zero. Whatever asks the orientation question has to survive
being asked a frame early, the same way the width question does.

**Backfilling a past day needs a day column**, so in portrait the teacher rotates to correct
Tuesday. That is the accepted cost of this trade and it should be written down where WO-2.1's
unlock is described, not left for someone to hit at the door.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these — the work order names three of them only obliquely, and you will not find them by
searching for "WO-2.12":

- **`src/attendance.js` around lines 572–634** — `DAY_COL_PX` / `PASS_COL_PX` / `NAME_COL_COARSE_PX`
  / `NAME_COL_FINE_PX` / `CHROME_PX`, the `MIN_DAY_COLS = 3` comment the work order quotes, and
  `dayColumnCount()` itself with the long comment above it explaining the `window.innerWidth`
  measurement. That comment block **is** the Traps line; read it before you add to it. Note
  `dayColumnCount()` already takes an optional `width` argument the harness passes — whatever you do
  for orientation has to be drivable the same way, or the checks below cannot reach it.
- **`src/attendance.css`** — the `232px` cap at **line 646** inside the `@media (pointer: coarse)`
  block (that is the number the third deliverable revisits), the comment at **line 579** that
  explains why the cap exists and names portrait, and the `overflow-x` safety-valve comment at
  **lines 200–206**, which acceptance line 5 is about. There is also a `@media (max-width: 1024px)`
  block at 752 and a `640px` one at 759 — know what they already do before adding a rule.
- **`TESTING.md` lines ~806 and ~859** — both carry the `⚠ Qualified by WO-2.8` marks. Those two
  lines are the fourth deliverable's TESTING.md half. The work order half is WO-2.1's acceptance
  line 2 in `plans/work-orders/phase-2-attendance.md` (WO-2.1 starts at line 15).
- **WO-2.1's past-column unlock**, wherever it is described in that same file — the Traps section's
  second paragraph says the "rotate to backfill Tuesday" cost gets written down *there*, next to the
  unlock, not only in WO-2.12.
- **`tools/verify-shell.mjs`** — it already drives `dayColumnCount()`; find those checks and extend
  them rather than starting a parallel set.

**A note on the tree you are arriving into.** `git status` is dirty with WO-2.11's finished,
verified, already-ticked work (pass banner, cancel, pass notes) that has not been committed yet.
That is the correct current state of the app — build on it. Do not revert, tidy, or re-verify it,
and do not commit anything.

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

1. Portrait draws exactly one day column — today's — with the Passes column intact.
2. Landscape still draws six, on the same device, with no reload.
3. Rotating the iPad mid-class repaints without losing scroll position or an in-flight mark. 👤
4. Full student names are readable in portrait without truncation, at the owner's roster's longest name. 👤
5. The grid's wrap does not overflow in either orientation — the `overflow-x` valve stays shut, which is the WO-2.10 defect this must not reopen.
6. A narrow **laptop** window does not fall to one column. Orientation is the signal, not width alone, and a 900px browser window is landscape.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

