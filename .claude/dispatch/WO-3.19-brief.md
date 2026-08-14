# WO-3.19 — the overdue tint on a score-grid column head · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.19-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at the **Opus** tier, on the work order's own merits — not a fallback,
so do not read this as work the rubric found mechanical. The deciding signal is the second
deliverable: nine comment sites carrying reasoning prose have to be re-cut so that three queued
score-grid work orders (WO-3.13, WO-3.15, WO-3.16) read something true on their way in, and
`src/scores.css:299-303` is a paragraph explaining *why a rule is absent* that has to change shape
rather than change a pointer. That is the "preserve the reasoning" surface, and the "one reader of
the clock" ruling sets a pattern later work orders copy. Runner-up set aside: **Codex**, which the
tint alone would have earned — a hex value lifted verbatim from a mockup, with mechanically checkable
acceptance. The route follows the load-bearing deliverable, and the work order names it out loud:
the comments are "the reason the work order exists."

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.19 — the overdue tint on a score-grid column head

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-13 · **Size** XS · **Depends on** WO-3.6 · **Blocks** nothing
**Closes roadmap** *(no box. The roadmap's Phase 3 past-due line is WO-3.6's and is ticked; this is
the half of the drawing that work order deliberately did not ship.)*

**Booked 2026-08-13, out of WO-3.6's close.** Two things are true at once and one of them has to give.
`design/mockups/proposed.css` draws `.scores-col-due.overdue { color: #8a6d1a; }`, and **nine comment
sites across five files name WO-3.6 as the owner of every rule about a past due date on the score
grid** — `src/scores.css:41` and `:301`, `src/scores.css:450`, `src/assignments.css:203`,
`src/assignments.js:353`, `src/scores.js:49`, `design/mockups/proposed.css:298` among them. WO-3.6
closed ✅ DONE on 2026-08-13 without the tint, on the correct call that it was not in its Deliverables.

**Why it exists.** *The promise is the problem, not the pixel.* Those comments now point a reader at a
**closed** work order for work that was never done — the exact drift class `wo-gate.mjs --audit`
exists to catch and the one shape of it the tool cannot see, because comments are not a tracker.
Three score-grid work orders sit below this one in the queue (WO-3.13, WO-3.15, WO-3.16); every one of
them opens `src/scores.css` and `src/scores.js` and reads those comments on the way in. This is booked
ahead of them so they read a true one.

The tint also earns its place on its own: the banner says *"6 blanks are past due"* and cannot say
**which columns** without the teacher opening the review. A tinted column head says it at a glance,
writes nothing, and is already the idiom on the assignment list one screen over.

**Deliverables**
- **The tint on the score-grid column head** — `.scores-col-due.overdue`, in `#8a6d1a`, lifted from
  `design/mockups/proposed.css` rather than re-derived, and matching the assignment list's own overdue
  colour exactly. Same date test as the prompt: `due` is a real date **strictly before today**.
- **The nine comment sites are repointed or rewritten**, and this is not optional garnish — it is the
  reason the work order exists. A comment that said "WO-3.6 owns this" says what is true after this
  lands. `src/scores.css:299-303` in particular claims the rule is absent *and why*, and that
  paragraph is now the wrong shape.
- **One reader of the clock, not two.** The tint asks the same question the prompt asks. If that means
  exporting a predicate from `src/past-due.js` rather than writing `due < today` a second time in
  `src/scores.js`, do that — `AGENTS.md` now says in as many words not to add a second reader of the
  date.

**Out of scope** — any change to what the prompt counts, any tint on a *cell*, and the assignment
list's existing tint, which already works and is not being re-derived.

**Acceptance**
- [ ] A column whose due date has gone by is tinted; a column due **today**, one due tomorrow, and one
      with no due date are not. The off-by-one is the same one WO-3.6's mutation testing caught.
- [ ] The tint writes nothing: every score cell in the document is byte identical with the tint on
      screen, and no grade moves. It is a colour, not a mark.
- [ ] The tinted columns are **exactly** the assignments the banner's sentence names, asserted against
      the prompt's own set rather than recomputed in the check.
- [ ] A column stops being tinted when its blanks are filled or marked, on the same render — because
      the thing it is reporting has stopped being true.
- [ ] `grep -rn "WO-3.6" src/ design/` returns no comment claiming WO-3.6 owns unbuilt work.
- [ ] 👤 The tint is visible on the iPad in a lit classroom without being mistaken for an error state,
      and is legible against the column head's existing `#a0aab8`.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/proposed.css`
  - `src/assignments.css`
  - `src/assignments.js`
  - `src/past-due.js`
  - `src/scores.css`
  - `src/scores.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, and each for a stated reason:

- **`AGENTS.md`** — your rules for this dispatch, and the third deliverable cites it directly ("now
  says in as many words not to add a second reader of the date"). Find that line and honor it; it is
  the constraint the deliverable is written against.
- **`.claude/dispatch/WO-3.6-result.md`** — `src/past-due.js:219` names it as where this follow-up was
  written up. It also records WO-3.6's mutation testing, which is where Acceptance line 1's off-by-one
  came from. Reuse that test's shape rather than inventing a new one.
- **`src/prefs.js` and `src/shell.js`** — the work order's list of files is not exhaustive. Both carry
  WO-3.6 comments (`src/prefs.js:132`, `src/shell.js:339` and `:1123`) and are in scope for the
  comment-accuracy deliverable if what they say has stopped being true.
- **`design/style-guide.md`** — for the colour rule the tint has to sit inside (inline colours, no
  variables, no dark mode).

**One correction to the work order's own arithmetic, so you do not over-apply the fix.** It says
"nine comment sites"; `grep -rn "WO-3.6" src/ design/` currently returns **19 hits across 8 files**:

```
src/assignments.css:115, :203, :453      src/scores.css:41, :301, :450
src/assignments.js:115, :369, :525       src/scores.js:49, :50, :101, :672
src/past-due.js:3, :219                  src/shell.js:339, :1123
src/prefs.js:132                         design/mockups/proposed.css:298
```

Most of those are correct and must stay: WO-3.6 really does own the past-due **prompt**, and a
comment saying so is true. Acceptance line 5 is deliberately narrower than "no hits" — it asks that
no comment claims WO-3.6 owns **unbuilt** work. Read all 19, change the ones that are now false, and
say in your report which you changed and which you left and why. A blanket rewrite would destroy
accurate provenance, which is the same failure this work order was booked to fix, pointed the other
way.

Note also that the work order cites `src/assignments.js:353` while the live comment sits at `:369` —
line numbers in a work order booked days earlier have drifted. Go by the text, not the number.

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

1. A column whose due date has gone by is tinted; a column due **today**, one due tomorrow, and one with no due date are not. The off-by-one is the same one WO-3.6's mutation testing caught.
2. The tint writes nothing: every score cell in the document is byte identical with the tint on screen, and no grade moves. It is a colour, not a mark.
3. The tinted columns are **exactly** the assignments the banner's sentence names, asserted against the prompt's own set rather than recomputed in the check.
4. A column stops being tinted when its blanks are filled or marked, on the same render — because the thing it is reporting has stopped being true.
5. `grep -rn "WO-3.6" src/ design/` returns no comment claiming WO-3.6 owns unbuilt work.
6. 👤 The tint is visible on the iPad in a lit classroom without being mistaken for an error state, and is legible against the column head's existing `#a0aab8`.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

