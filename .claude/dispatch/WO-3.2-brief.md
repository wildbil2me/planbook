# WO-3.2 — Letter-scale editor · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.2-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus**, on the work order's own merits — not a Codex fallback, so
no probe was run and the runner's record is not in play here. The deciding signal is that two
decisions this work order needs are not made anywhere: **what "a gap" even means for an ordered
`{ letter, min }` list** (ranges are derived, so bands are contiguous by construction and the only
true gap is at the bottom), and **where the per-class override's door goes**, given that
`plans/gradebook-surfaces.md` has just refused to re-cut the class-manager row and WO-3.1 already
found that row's header strip could not take another icon at 390px. Against that, the real runner-up:
this is Size `S`, the schema is settled in `docs/data-model.md`, the seed already exists in
`src/store.js`, and `src/categories.js` is a near-exact template — a genuine Codex case on the
mechanics, and `ROUTING.md`'s "later phases at a glance" names WO-3.4 rather than this one as the
phase's Codex candidate. Ties go to Claude, and acceptance line 4 plus the Traps line are a judgment
trap sitting on top of legitimate existing rounding code (see § 6), which breaks the tie decisively.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.2 — Letter-scale editor

**Ship** 2 · **Status** 🔨 IN PROGRESS · **Size** S · **Depends on** WO-1.4
**Closes roadmap** Phase 3 → "Letter-scale editor."

**Why it exists.** The teacher defines the bands; the app never hardcodes 90/80/70. **This subsumes
rounding** — if 89.5 should be an A, the boundary is 89.5, and there is no separate rounding rule
to disagree with the SIS about.

**Deliverables**
- Document-wide `letterScale` as an ordered list of `{ letter, min }`, editable in Settings.
- Optional per-class override; `null` means use the document default.
- A percentage maps to the first band whose `min` it meets.
- The editor shows the resulting bands as ranges so a gap or overlap is visible on sight.

**Acceptance**
- [ ] Setting an A boundary of 89.5 makes 89.5 an A and 89.49 an A−.
- [ ] A per-class override applies to that class only.
- [ ] A scale with a gap or an out-of-order band is caught in the editor, not at render.
- [ ] There is no rounding code anywhere. Grep for it and confirm.

**Traps** — Do not add a "round to nearest whole percent" option. That is exactly the second
disagreeing rule this design removes.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The surface is already decided — do not re-decide it.**

- `plans/gradebook-surfaces.md` — settled 2026-08-09. The letter-scale editor is a **modal**, in the
  same row of that table as categories, for the same reason: *"Set up in August, revisited a few
  times a year."* The three heavy gradebook screens are views; this is not one of them. You do **not**
  add a `<main>` view, a `src/views.js` id, or a fourth stylesheet.

**The sibling module whose convention this one matches, in every respect:**

- `src/categories.js` — WO-3.1, landed yesterday, and the closest precedent in the repository. Read
  its header comment in full. Three things in it are the same decisions here: **a number is stored
  exactly as it was typed** (nothing clamps, rounds or repairs a boundary a teacher entered), **the
  warning never blocks** (an invalid scale mid-edit is an ordinary state, so nothing is disabled and
  no save is refused), and the pure functions it exports for later work orders to import
  (`weightTotal`, `isProvisional`) rather than each screen re-deriving them. Its module shape — modal
  ids as consts, `openModal`/`closeModal`, `announce()` for the live region, per-keystroke field
  handlers wired from `src/shell.js`'s `input` listener that do **not** re-render the field being
  typed into — is what to follow.
- `src/teacher.js` header, § "THE LIMIT OF WHAT LIVES HERE" — it names the letter scale specifically
  and declines to host it: settings about the gradebook rather than the teacher *"belong to the work
  orders that use them and want their own home."* So this is **its own module**, kebab-case, named for
  what it owns. Not a corner of `teacher.js` and not a corner of `categories.js`.
- `src/README.md` — the `src/` conventions, including the inline-colors rule that reads like an
  oversight and is not.
- `index.html` around lines 933–980 — the `#categoriesModal` markup and the comment above it. Two
  conventions live there: **the words a teacher reads live in `index.html`**, not in a JS string, so
  they can be revised without opening a module; and the list itself is rendered by JS with no specimen
  row in the markup, because a specimen is a second truth.
- `src/shell.css` lines ~712–753, and its `@media (pointer: coarse)` block at ~1133–1148. Modal
  editors style into `shell.css` alongside `.category-*`; the per-screen stylesheet rule
  (`src/<screen>.css`) is for main-area views, which this is not. Whatever you add, add its
  coarse-pointer entries **in the same pass** — there is no later touch-up pass.

**The data, which already exists — do not reseed it:**

- `docs/data-model.md` § Letter grades (~line 354) and the document shape at lines 61–65.
- `src/store.js` `defaultLetterScale()` (~line 98) — twelve bands, already seeded into every new
  document, with a comment saying the teacher edits the boundaries in Settings and that literals like
  these *"belong in seed data and nowhere else."* Read the scale from the document; do not duplicate
  the numbers, and do not hardcode 90/80/70 anywhere for any reason.
- `src/classes.js` line ~218 — a new class already carries `letterScale: null`, so the per-class
  override's storage exists and its `null` sentinel is already written. Line ~608 and ~637 are the
  class-manager row: six controls already, and `classRow()` records why Categories went in the row
  rather than the header strip. `gradebook-surfaces.md` § "And the class manager gets less cramped by
  doing nothing" is explicit that the row is **not** re-cut by this phase.

---

## 2b. The four decisions this work order does not make for you

You were routed to Opus for these. Make each one deliberately, write the reasoning at the point of
the decision the way this repo does everywhere else, and say in your report what you chose.

1. **What "a gap or an out-of-order band" means, given the shape.** A band is `{ letter, min }` and
   its upper bound is *derived* — it runs from its own `min` up to just below the previous band's.
   So bands are contiguous by construction and an interior gap is not expressible; the two failures
   that **are** expressible are a lowest band whose `min` is above 0 (percentages below it map to no
   letter at all) and two bands whose `min`s are equal or ascending (out of order, so the "first band
   whose `min` it meets" rule silently never reaches one of them). Decide what the editor checks,
   check exactly that, and say plainly why an interior gap is not on the list. Deliverable 4 — *"shows
   the resulting bands as ranges so a gap or overlap is visible on sight"* — is the other half of the
   same answer: showing the derived range is what makes the invariant legible without a validator.

2. **Where the per-class override is reached from, and what turning it on writes.** The row cannot
   take a seventh control and the record above forbids re-cutting it, so this needs a home you choose
   and justify — the document-wide editor knowing which class it was opened for is one shape, among
   others. On the write: `null` means *use the document default*, so switching an override **on** most
   sensibly seeds a copy of the current document scale for the teacher to edit from, and switching it
   **off** returns the field to `null`. A stored diff against the default would be a second thing to
   keep in step; if you choose one anyway, say why.

3. **The mapping function is a seam, and it is yours to build but not to grow into a grade engine.**
   Acceptance line 1 cannot be verified without a pure `letterFor(percentage, scale)`-shaped function,
   so build and export it, exactly as `categories.js` exported `weightTotal()` for consumers that did
   not exist yet. But **WO-3.4 owns category percentage and the weighted class grade** and states that
   its hand-computed `docs/grade-math-cases.md` is deliberately its only test suite. Build the
   percentage→letter mapping and stop there; note in your report that WO-3.4 must import this rather
   than write a second one. Nothing in this app displays a grade yet, so the editor's own band list is
   where the mapping is made visible — do **not** build a grade preview over student data to
   demonstrate it.

4. **Out of scope, and it is sitting directly above your work order in the same file.** WO-3.1's note
   about the false *"provisional"* copy in `src/categories.js` and `src/classes.js` is **folded into
   WO-3.5's brief**, by that note's own instruction. Do not fix it here, do not rename
   `isProvisional()`, and do not touch the `verify-shell.mjs` checks that assert that copy. Widening a
   work order is a proposed follow-up in your report, never a drive-by edit.

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

1. Setting an A boundary of 89.5 makes 89.5 an A and 89.49 an A−.
2. A per-class override applies to that class only.
3. A scale with a gap or an out-of-order band is caught in the editor, not at render.
4. There is no rounding code anywhere. Grep for it and confirm.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

---

## 6. Acceptance line 4 is a trap, and it is not "no `Math.round` in the repository"

*"There is no rounding code anywhere. Grep for it and confirm."* Read it against the **Why it
exists** paragraph, which is what it means: the boundary **is** the rounding rule. If 89.5 should be
an A the teacher types 89.5, and there is no second rule that could disagree with the SIS. What must
not exist is **any rounding between a percentage and a letter** — `letterFor()` compares the
percentage it was given against `min`, unmodified, and there is no option, preference, setting or
helpful default anywhere that rounds a percentage before it is banded. The **Traps** line is the same
point from the other side: a *"round to nearest whole percent"* option is precisely the second
disagreeing rule this design deletes. Do not add it, and do not add it in disguise as a tolerance, an
epsilon, or a `toFixed()` on the way in.

**Two legitimate uses of `Math.round` already exist and are not yours to remove:**

- `src/attendance.js:1196` — rounds an attendance percentage **for display**.
- `src/categories.js:181` — `formatWeight()`, rounding a weight total to two decimals **for display**,
  with a comment at ~line 137 arguing exactly why that is safe.

Neither is a grade, neither is a letter, and both predate this work order. Deleting them to make a
grep come out clean would be the tidying failure `CLAUDE.md` warns about. Run the grep, report what
it finds, and **draw the distinction in your report** — display formatting versus a rule that changes
which letter a percentage earns — rather than reporting a bare count either way. If your own editor
needs to *display* a derived range, say so and justify it under the same distinction.

---

## 7. If the browser harness cannot run, say so — do not claim it green

`node tools/verify-shell.mjs` drives a real browser over CDP and has repeatedly failed inside agent
sandboxes while running fine on the owner's machine. If it will not launch for you, report *"could not
run, and why"* verbatim rather than inferring a pass or leaving an acceptance line ambiguous — the
orchestrator re-runs it locally before anything is ticked. A fixture that cannot express the failure
is not evidence either: whatever checks you add must be able to go red.

