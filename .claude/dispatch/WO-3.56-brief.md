# WO-3.56 — an assignment needs a name, and an unnamed one takes one when it is opened · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.56-result.md` — as your last act, and return it in-band too.

**Routing.** Claude Opus, on its own merits: the deciding signals are teacher-facing copy (the owner's
nameless-warning sentence, Done's refusal sentence, the copy foot's reason, `TESTING.md`, `CHANGELOG.md`)
and a Trap that is judgment rather than mechanics — the copy door from the editor (refuse like Done, or
hand the blank on to ruling 1) is yours to decide and argue in a comment. Codex was the runner-up
(an established pattern in `src/assignments.js`, mechanically checkable lines) and was set aside on
those two, plus the harness-run budget a mutation round would need.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.56 — an assignment needs a name, and an unnamed one takes one when it is opened

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-10 · **Size** M · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-10.)*

**Booked 2026-10-10**, out of a reading that turned out not to be a bug. The owner duplicated an
assignment from Homeroom and found the copy dialog's name field empty, expecting the source's
name. The field was doing its job: `startCopy()` fills it with `source.name || ''`, and the source
had never been named. The lead above it said so (*Copying "Untitled assignment"*). But the dialog let
an empty name through, so one tap would have put a nameless copy into every ticked class, each one
drawing as *Untitled assignment*. The editor turned out to have the same gap: it has no Save,
`settleEditor()` never looks at the name, and **+ New assignment then Done leaves a nameless row**,
which is probably how the Homeroom one was made. Rulings 1–3 are the copy dialog and rulings 4–5
the editor, folded in the same day.

**Rulings, the owner's, 2026-10-10**
1. **The copy dialog's name is required.** The copy button is disabled while the name field is
   blank. Whitespace counts as blank, so a field holding only spaces is refused too. This applies
   at both doors: the row's Duplicate and the editor's *Copy into other classes…*.
2. **An existing assignment with no name takes *Untitled assignment* as its name when it is opened
   to edit or to duplicate.** The words are the ones every reader already draws for a nameless
   assignment, so on screen it reads exactly as before, now as a real name the teacher can see and
   type over.
3. **The copy dialog keeps the source's own name as its starting value**, not *Copy of …*. This was
   asked and answered the same day: the dialog copies only into other classes, and the same name in
   each period is what the teacher means.
4. **The editor's Done refuses while the name is blank** (whitespace counts as blank). It says why
   and puts the caret in the name field, the way it already stops on dates no term holds.
   **Cancel is unchanged**: during a create it still removes the row.
5. **Close, Escape and the backdrop with a blank name do not refuse.** The assignment takes
   *Untitled assignment* and **a visible warning says it was saved without a name**. Closing is not
   blocked because a dialog that refuses Escape is a trap, and the no-lost-draft contract
   (`createAssignment()`'s header) says a half-written assignment is kept, not discarded.

**Deliverables**
- **`src/assignments.js`**:
  - `copyReady()` also requires a non-blank `copyName`.
  - `paintCopyFoot()`'s note says why the button is disabled when the name is the only reason.
  - `openAssignmentEditor()` and `startCopy()` apply ruling 2.
  - `settleEditor()` applies rulings 4 and 5. It already tells Done (`follow`) apart from the other
    closes.
  - Ruling 5's warning goes on the list's `listNote`, the visible line under the list's head that
    the moved-work note already uses, with `announce()` beside it for a screen reader.
    **`announce()` alone is not a warning**: it writes to an `.sr-only` live region and draws
    nothing. **The wording is the owner's**: *"Untitled assignment" was saved without a name. Edit
    it to give it a name.* It says *Edit it*, not *Tap Edit*, because WO-3.54 removes the Edit
    button and the name opens the editor instead. **The colour is amber, the owner's ruling,
    2026-10-10, from a drawing**: `.assign-moved`'s shape in `.assign-group-empty`'s colours
    (`#fff8e6` ground, `#f0dfa8` border, `#8a6d1a` text, a `#e0a800` left rule). That means a
    modifier class on the note, set only for this message, so the moved-work note stays indigo.
    No mark is added to the row itself.
- **`src/shell.js`**: if the copy-name input route doesn't already repaint the foot, it does now,
  so the button enables and disables as the teacher types.
- **The harness**: checks for each Acceptance line, beside WO-3.48/3.49's in
  `tools/verify/copy-class.mjs`.
- **`TESTING.md` § WO-3.56**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] With at least one class ticked, clearing the copy dialog's name field disables the copy button
      and the foot note says the copy needs a name. Typing a name enables it again without any
      other input. A name of only spaces stays disabled. Both doors behave the same.
- [ ] Opening the editor on an existing assignment whose stored name is empty writes *Untitled
      assignment* as its name, once, and the editor's name field shows it. Opening it on a named
      assignment writes nothing: no `rev` change after `flush()`.
- [ ] **A brand-new assignment is not affected.** `+ New assignment` still opens the editor with an
      empty name field, and Cancel still removes the row and writes nothing else.
- [ ] Opening Duplicate on an unnamed assignment shows *Untitled assignment* in the name field, and
      the button is enabled once a class is ticked. Copying gives every copy that name, **and the
      source too, in the same `update()`**. Cancel writes nothing (`rev` unchanged after `flush()`),
      which is the dialog's standing rule for every held edit.
- [ ] With the editor's name field blank, Done does not close it: the editor says the assignment
      needs a name and focuses the name field. Typing a name and pressing Done closes it as before.
      Cancel during a create with a blank name still removes the row.
- [ ] With the name blank, Close, Escape and the backdrop each close the editor. The assignment's
      stored name is then *Untitled assignment*, and the list's note reads the owner's sentence in
      amber, while the moved-work note on its own is still indigo (checked in the DOM and computed
      style, not the live region). The same applies when a teacher
      clears an existing assignment's name and closes.
- [ ] 👤 On the teaching iPad: Done refuses a blank name readably, and the nameless warning is
      noticed after a Close.
- [ ] `CACHE` in `sw.js` is bumped.

**Traps** — **A new assignment's empty name is not "an existing untitled assignment".** The create
flow writes `name: ''` and opens the same editor, so ruling 2 has to skip a create (`creatingId`).
Otherwise every new assignment arrives pre-named and the teacher has to clear it before typing.
**Duplicate's Cancel is a promise**: the dialog writes nothing until its button, so ruling 2 is
held there as a proposal and written with the copies, never on open. The editor has no such
promise, because it writes as it is typed. That is why the two doors write at different moments.
**The words are a fact, not a fallback string**: take *Untitled assignment* from wherever the
readers get it, or make a single named constant they share. Don't add another quoted copy;
`src/calendar-derived.js` and `src/glance.js` each already hold one.

**Ruling 5 writes during the close guard**, which already writes a scored move there. Write the
name in the same `update()` as anything else the settle writes, so `rev` moves once.
**Ruling 4's refusal must not reach the copy door**: `openCopyFromCreate()` calls
`settleEditor(follow)` too. Whether *Copy into other classes…* refuses a blank name like Done, or
hands the blank on to the copy dialog's own refusal (ruling 1), is the implementer's to argue in a
comment. Either works, but leaving it undecided does not.

**Not in scope** — **Backfilling names across the year** at load or by
migration: ruling 2 names an assignment only when a teacher opens it, the same forward-only shape
as WO-3.49's `termId`.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/assignments.js`
  - `src/calendar-derived.js`
  - `src/glance.js`
  - `src/shell.js`
  - `tools/verify/copy-class.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/assignments.css` — `.assign-moved` (line ~321) and `.assign-group-empty` (~296); ruling 5's
  amber is a **modifier class** on the list note, set only for that message. Colours are literal hex,
  not CSS variables — that is the suite convention, do not tidy it.
- `src/modal.js` — how the editor's close guard calls `settleEditor()` and what `{ close:false }` does
  for Close/Escape/backdrop versus Done.
- `sw.js` — `CACHE` stood at `planbook-shell-v182` when this brief was written.

**Orchestrator's notes — the traps a cold read will not see.**
- **The "single named constant" is narrower than it looks.** `grep -n "'Untitled assignment'" src/`
  finds ~20 quoted copies across a dozen modules, not the two the Traps name. The work order's demand
  is that *the code you write* adds no new quoted copy: take it from one named constant (exported from
  wherever fits best, e.g. `src/calendar-derived.js`'s `UNTITLED` or a new one in `src/assignments.js`)
  and use that in rulings 2 and 5. Converting the existing `assignment.name || '…'` readers in other
  modules is **out of scope** — list it as a proposed follow-up in your result, do not sweep.
- **`listNote` today is `{ classId, termId, text }` and `paintListNote()` only toggles `hidden`.** The
  amber modifier must be removed whenever a moved-work note replaces it, or the indigo note inherits
  amber — that is exactly what Acceptance line 6's computed-style check is for.
- **`settleEditor()` already returns `{ close:false }` for the unplaced-dates stop and is called from
  three places** (Done's `follow`, the close guard, `openCopyFromCreate()`). Rulings 4 and 5 split on
  `follow`; a create whose row Cancel removes must still write nothing. Write ruling 5's name in the
  **same `update()`** as any scored move the settle already writes (`rev` moves once).
- **WO-3.54 (⬜, not built) will later remove the Edit button.** Do not pre-empt it; the owner's
  sentence already says *Edit it* for that reason.
- **The window is tight.** `wo-gate --start` reported the rolling quota near the median death point.
  If you run a mutation round, revert each mutation before writing anything else, and keep the
  harness runs to what the Acceptance needs. Write the result file as soon as the evidence is in.

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
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
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

1. With at least one class ticked, clearing the copy dialog's name field disables the copy button and the foot note says the copy needs a name. Typing a name enables it again without any other input. A name of only spaces stays disabled. Both doors behave the same.
2. Opening the editor on an existing assignment whose stored name is empty writes *Untitled assignment* as its name, once, and the editor's name field shows it. Opening it on a named assignment writes nothing: no `rev` change after `flush()`.
3. **A brand-new assignment is not affected.** `+ New assignment` still opens the editor with an empty name field, and Cancel still removes the row and writes nothing else.
4. Opening Duplicate on an unnamed assignment shows *Untitled assignment* in the name field, and the button is enabled once a class is ticked. Copying gives every copy that name, **and the source too, in the same `update()`**. Cancel writes nothing (`rev` unchanged after `flush()`), which is the dialog's standing rule for every held edit.
5. With the editor's name field blank, Done does not close it: the editor says the assignment needs a name and focuses the name field. Typing a name and pressing Done closes it as before. Cancel during a create with a blank name still removes the row.
6. With the name blank, Close, Escape and the backdrop each close the editor. The assignment's stored name is then *Untitled assignment*, and the list's note reads the owner's sentence in amber, while the moved-work note on its own is still indigo (checked in the DOM and computed style, not the live region). The same applies when a teacher clears an existing assignment's name and closes.
7. 👤 On the teaching iPad: Done refuses a blank name readably, and the nameless warning is noticed after a Close.
8. `CACHE` in `sw.js` is bumped.

**Write `TESTING.md` § WO-3.56 — it is a deliverable, not a permission.** Add `### WO-3.56 — an assignment needs a name, and an unnamed one takes one when it is opened` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.56` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

