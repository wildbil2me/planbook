# WO-3.57 — the nameless warning reaches the teacher wherever the editor closed · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.57-result.md` — as your last act, and return it in-band too.

**Routing.** Claude Opus, on its own merits: the deliverable that matters is teacher-facing prose (the indigo arrival sentence, the `TESTING.md` section) and the Traps are judgment, not mechanics (select the `termId`, never the term the date falls in; keep the selection out of `openClassOn()`). Runner-up was Codex — Size S, every ruling written, mechanically checkable — set aside on the prose. The `CHANGELOG.md` entry is a deliverable of this work order (it says so); draft it there.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.57 — the nameless warning reaches the teacher wherever the editor closed

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-11 · **Size** S · **Depends on** WO-3.56
**Closes roadmap** *(no box. Owner-directed, 2026-10-11.)*

**Booked 2026-10-11**, out of WO-3.56's verdict (its ruling 7). Ruling 5's warning, *"Untitled
assignment" was saved without a name*, goes on the list's `listNote`, which is keyed by class and
term. The verifier found that a blank editor closed from somewhere other than the assignment list
shows the warning only if that list is on screen.

**The premise, checked 2026-10-11, by reading the code; nothing was run.** It holds, but the gap is
narrower than the verdict says. `openAssignmentEditor()` has two callers, and the editor has three
doors:

| Door | A blank close shows the warning? |
|---|---|
| The name on a list row (`data-assignment-edit`, `src/shell.js`) | **Yes.** The row is on the list that is up, so the note is set for the term on screen. |
| `+ New assignment` | **Yes.** A create filed under another term moves the list there first (WO-3.50, ruling 1), so the note is set for the term on screen. |
| A due date on the calendar (`ASSIGNMENT_DUE`, `src/shell.js`) | **Only when the class's open term is the assignment's own.** |

The calendar door is the gap. `openClassOn(classId, 'assignments')` selects the class and shows the
list, but **not the term**: the list shows whichever term was last open for that class. The close
sets the note for the assignment's term, and `paintListNote()` drops a note set for any other term
on the next render. **The lost warning is a symptom.** On that path the assignment being edited is
not on the list behind the dialog at all, so the teacher closes the editor and the work she just
changed is nowhere on screen.

The Scores screen is named in `editorFollows()` as a screen the editor can be open over, but no door
from it opens the editor today.

**Rulings, the owner's, 2026-10-11**
1. **The calendar door moves the list to the assignment's term, and the move is stored.** It calls
   `selectTerm()` for the assignment's term before the editor opens, so the class's saved open term
   (`planbook_openTermIds`) changes, exactly as a create already changes it. Showing the term for
   one visit without storing it was declined: it needs a new mechanism in `src/classes.js`, and the
   next repaint would snap the list back, taking the row away a second time. **This is not the
   calendar-filter rule in CLAUDE.md** ("a door, never a stored preference"): that rule stops a
   remembered filter silently hiding most of the year, and this move is visible, said in a sentence,
   and shows the teacher the work she tapped.
2. **The move says so, in the indigo note**, as a create's move does: *This list has moved to
   Quarter 2, the term "Persuasive essay" is due in.* (The term's and the assignment's own names, not
   those words.) No note when the list was already on that term. A blank close then puts the amber
   warning ahead of it on one line, which `setNamelessNote()` already does for a standing note on the
   same class and term, so that half needs no new code.
3. **A list scrolled so the note is off screen is not this work order's.** It is about where the
   note sits, not which doors reach it, and goes to
   [WO-3.58](#wo-358--the-dialogs-behind-the-assignments-and-scores-screens-are-read-together-and-a-layout-is-ruled).

**Deliverables**
- **`src/shell.js`**: the `ASSIGNMENT_DUE` branch of the calendar's item handler selects the
  assignment's term after `openClassOn()` and before `openAssignmentEditor()`.
- **`src/assignments.js`**: the arrival note (ruling 2), set for the class and term the list moved
  to. Whether `src/shell.js` calls `selectTerm()` and asks this file for the note, or this file
  exports one function that does both, is the implementer's to argue in a comment. Either works;
  leaving it undecided does not.
- **The harness**: checks for each Acceptance line, beside WO-3.56's.
- **`TESTING.md` § WO-3.57**, with the door table above, the Scores screen named as having no door,
  the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] Every door into the assignment editor is named in `TESTING.md` § WO-3.57, with whether a blank
      close from it shows the warning. The Scores screen is named as having no door today.
- [ ] Opening an assignment from the calendar while its class's list is open on another term moves
      the list to the assignment's term, stores that term as the class's open term, and the indigo
      note says the list moved. When the list was already on that term, no note is drawn and the
      stored term is unchanged.
- [ ] A blank close from each door leaves the owner's sentence, in amber, on the list behind the
      editor. From the calendar door it is checked with the list starting on another term, and the
      arrival note follows the warning on the same line (checked in the DOM and computed style, not
      the live region).
- [ ] `CACHE` in `sw.js` is bumped.

**Traps** — **A term with no room for the date.** An assignment's `termId` is the term it is filed
in, which is not always the term holding its due date (WO-3.50's unplaced work). Select the
`termId`, never the term the date falls in, or the list moves to a term the row is not on.
**`openClassOn()` has other callers** (the meeting-state item, at least): the term selection
belongs in the `ASSIGNMENT_DUE` branch, not in `openClassOn()`.

**Not in scope** — changing the wording or the colour of the warning; both are WO-3.56's rulings.
Where the note sits on a scrolled list (ruling 3).

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/assignments.js`
  - `src/classes.js`
  - `src/shell.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/verify/copy-class.mjs` around line 1234 — WO-3.56's nameless-warning checks; yours go beside them.
- `src/classes.js` `selectTerm()` (~line 791) — it acts on `getSelectedClass()`, so it must run after
  `openClassOn()` has selected the class; it writes `planbook_openTermIds` and announces in the live region.

**Traps the work order does not name, found reading the code (orchestrator's reading, check it):**
- **`openAssignmentEditor()`'s edit path clears `listNote` on open** (`src/assignments.js` ~line 1662:
  *"A note about an earlier move is not about the row now being edited."*). An arrival note set in
  `src/shell.js` *before* that call is wiped by it. The arrival note is about the row being edited, so
  either it is set after the clear or the open path is told about the arrival — that ordering is the
  real content of the "argue it in a comment" deliverable. Do not delete the clear; it is right for
  the other doors.
- **Cancel/Done paths that reset `listNote`** (e.g. ~line 1612 `listNote = null` on a discarded create)
  must not be reached by an edit opened from the calendar; confirm the arrival note survives a plain
  close and is followed by the amber warning on a blank close (`setNamelessNote()` keeps a standing
  note for the same class and term — verify that holds for the arrival note's shape).
- **Mutation proof.** If you mutate to prove a check bites, revert it before writing anything else,
  and grep `MUTATION` over your files before you report.

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

## 5. Done means these 4 lines, reported against one by one

1. Every door into the assignment editor is named in `TESTING.md` § WO-3.57, with whether a blank close from it shows the warning. The Scores screen is named as having no door today.
2. Opening an assignment from the calendar while its class's list is open on another term moves the list to the assignment's term, stores that term as the class's open term, and the indigo note says the list moved. When the list was already on that term, no note is drawn and the stored term is unchanged.
3. A blank close from each door leaves the owner's sentence, in amber, on the list behind the editor. From the calendar door it is checked with the list starting on another term, and the arrival note follows the warning on the same line (checked in the DOM and computed style, not the live region).
4. `CACHE` in `sw.js` is bumped.

**Write `TESTING.md` § WO-3.57 — it is a deliverable, not a permission.** Add `### WO-3.57 — the nameless warning reaches the teacher wherever the editor closed` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.57` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

