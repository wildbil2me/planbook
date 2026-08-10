# WO-2.17 — the term nav repaints the screen it is sitting on · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.17-result.md` — as your last act, and return it in-band too.

**Why you have this.** Routed to Claude at the Opus tier on the work order's own merits: it
establishes a convention — the Deliverables ask that the repaint become *a property of the term
change* rather than something each screen remembers to request, which makes it the chain WO-3.5's
score grid and every later class screen will copy, and `src/shell.js`'s chain functions carry
load-bearing comment prose that has to be written in that file's voice. The runner-up was Codex: size
S, no sensitive surface, a named existing pattern to match, and a mechanically checkable Acceptance
list — set aside because both Traps are judgment calls (do not blanket-repaint; do not move term
resolution into a screen module) of exactly the shape a model optimizing for clean code tidies away.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.17 — the term nav repaints the screen it is sitting on

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-09 · **Size** S · **Depends on** nothing
**Closes roadmap** *(no box. This is a defect found by WO-3.3's verification, in code Phase 2
shipped — it closes no product box, and inventing one to make the dashboard tidier is the drift
WO-2.15 and WO-2.16 exist to catch.)*

**Why it exists.** `classes.selectTerm()` writes the preference, repaints the class bar, and announces
the change (`src/classes.js:477-490`). It repaints **nothing else**. That was right while the term nav
sat on exactly one screen and that screen did not care: the attendance registry is a window of recent
dates, and the columns do not move when the term does.

**But the totals under it are term-scoped, and they always have been.** `paintClassTotals()` is fed
`totalsForRender(cls, getSelectedTerm(), visibleStudents(cls))` — `src/attendance.js:3405`, and again
at `:3174` and `:3289`. So tapping *Quarter 2* on the registry moves the highlight in the header, says
"Quarter 2 is open" out loud, and leaves **Quarter 1's percentages on the screen**, with nothing to
tell the teacher which term the number belongs to. It corrects itself on the next repaint from any
other cause, which is what has kept it invisible: mark one student and the numbers jump, and the jump
reads as the mark landing rather than as the term finally arriving.

**Found by WO-3.3's verifier on 2026-08-09**, in the assignment list rather than here — that screen is
term-filtered top to bottom, so the whole body went wrong at once instead of one line of it, and the
defect was impossible to miss. WO-3.3's correction round fixed its own screen in one line
(`src/shell.js:614-628`) and deliberately did **not** reach into attendance: repainting the registry
from that branch would have hidden this rather than fixed it, and the note at `shell.js:624-626` says
so at the point of departure. This work order is the other half, booked where the code lives.

**The general shape, which is the reason this is a work order and not a one-line patch.** The term nav
is a header control that every class screen sits underneath, and the number of those screens is
growing — attendance, assignments, and WO-3.5's score grid, which is term-filtered by construction.
Each new screen that reads `getSelectedTerm()` and does not repaint on a term change is this same bug
again. The fix should make the repaint a property of the term change rather than a thing each screen
remembers to ask for.

**Deliverables**
- **A term change repaints whatever class screen is up.** The pattern to match is
  `afterCategoryChange()` in `src/shell.js` — the chain the category controls already use, and the one
  WO-3.3's assignment-list line was hung off.
- **The registry's totals line is correct immediately after a term switch**, with no second action
  needed to bring it right.
- **The order of operations stays in `src/shell.js`.** `src/classes.js` must not learn what screens
  exist; its header records that it is the read point for "which class, which term" and nothing more,
  and an import from it into the screens would close a loop this repo has refused four times.

**Out of scope** — the term nav's own appearance, `openTermIds`, and anything about which term is
*selected*. This is about what repaints after it changes, not about the choice.

**Acceptance**
- [ ] Switching term on the attendance registry updates the totals line in the same paint — no mark,
      no reload, no second tap.
- [ ] Switching term on the assignment list still repaints it (WO-3.3's line, which must not regress).
- [ ] A screen that does not read the term is not repainted by a term change — the fix is a chain, not
      a blanket repaint of everything.
- [ ] `src/classes.js` gains no import from a screen module, and `selectTerm()` still returns without
      writing when the term id does not belong to the open class.
- [ ] The harness proves the pre-fix failure: a check that reads the totals line after a term switch
      and goes red against the current code. 👤 *not needed — this one is measurable at the desk.*

**Traps** — **Do not fix this by repainting every class screen on every term change.** The registry
paints a grid of students × days and the score grid will be larger still; a blanket repaint is a cost
that arrives on the flow the whole app is measured by, and `src/attendance.js`'s own history is one
long argument about paint cost (WO-2.13 exists because the totals were computed once per student).
Paint what is up, the way `afterCategoryChange()` does. **And do not move the term resolution into a
screen module** to make the repaint easier — `src/classes.js:6-12` argues that classes and terms are
not separable, and the resolution living in one place is why a preference naming a removed term
answers correctly everywhere.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance.js`
  - `src/classes.js`
  - `src/shell.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, and each for a named reason:

- **`src/shell.js:297-372`** — `afterClassChange()`, `paintClassScreen()`, `showClassScreen()` and
  `afterCategoryChange()`, read as a set. This is the family your work joins, and the comment on each
  one states which repaints it does *and does not* do and why. The new chain's comment is expected to
  read like these: what changed, what is painted, what is deliberately not, and the cost of getting it
  wrong. Match that register — it is the file's convention as much as the code is.
- **`src/shell.js:614-628`** — the `[data-term-select]` handler as WO-3.3's correction round left it,
  including the note at `:624-626` saying the registry's gap is *not that work order's to close*. That
  note is the pointer that produced this work order. When your fix lands, that comment should no
  longer describe the code beneath it; leave the shape of the reasoning intact while making it true.
- **`src/views.js`** — `currentView()` and `isClassScreen()`, the two predicates every existing chain
  branches on. Acceptance line 3 ("a screen that does not read the term is not repainted") is a claim
  about which branch you write, so know what these already answer.
- **`src/attendance.js:3170-3180`, `:3285-3295`, `:3400-3415`** — the three `totalsForRender(cls,
  getSelectedTerm(), …)` call sites named in *Why it exists*, and whatever exported entry point paints
  the totals line. Find the narrowest repaint that makes Acceptance line 1 true; WO-2.13's history
  (cited in Traps) is the argument against reaching for the widest one.
- **`src/assignments.js`** — `renderAssignments()`, the other end of the chain, so Acceptance line 2
  is a thing you preserved on purpose rather than by luck.
- **`tools/verify-shell.mjs:5810-5875`** — WO-3.3's existing term-switch check on the assignment list.
  Your new check belongs beside it and should be recognizably its sibling. Note that section's own
  comment already says the registry's term-totals gap is "left to whoever owns it" — that is you.
- **`tools/verify-shell.mjs:11556-11700`** — the WO-2.13 attendance-totals block, for how this harness
  reads `.attendance-student-totals` text out of a live page. Reuse those selectors rather than
  inventing a way to read the same line.

**On Acceptance line 5.** It asks you to prove the *pre-fix* failure, which means running the new
check against the unfixed code and seeing it go red before you fix anything. Do that first, and put
the red output in your result file — a check written after the fix, that has never failed, is not
evidence. `git stash` is a fine way to get back to the unfixed tree if you have already edited.

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

1. Switching term on the attendance registry updates the totals line in the same paint — no mark, no reload, no second tap.
2. Switching term on the assignment list still repaints it (WO-3.3's line, which must not regress).
3. A screen that does not read the term is not repainted by a term change — the fix is a chain, not a blanket repaint of everything.
4. `src/classes.js` gains no import from a screen module, and `selectTerm()` still returns without writing when the term id does not belong to the open class.
5. The harness proves the pre-fix failure: a check that reads the totals line after a term switch and goes red against the current code. 👤 *not needed — this one is measurable at the desk.*

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

