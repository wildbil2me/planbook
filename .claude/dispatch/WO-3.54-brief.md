# WO-3.54 — the assignment list's top matches the other class screens, and its rows get lighter · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.54-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus**, on its own merits: the work order's value is teacher-facing prose (ruling 5's three notes, ruling 6's two, ruling 7's hint sentences, and the hidden sentences carried per grading mode) and Traps that are judgment rather than mechanics — a text-styled button that must keep its focus ring, a roster that deliberately does *not* get the same tidy. Codex was the runner-up, because it is largely a lift of a drawn section onto an established screen, and was set aside on those two signals; ties go to Claude.

**This is a fresh start.** An earlier dispatch of WO-3.54 died in a client crash after claiming and briefing and before writing anything; it was released and its files moved aside, and the tree was clean when this brief was written. Nothing in the tree is a draft of yours to audit.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.54 — the assignment list's top matches the other class screens, and its rows get lighter

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-11 · **Size** M · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-10.)*

**Booked 2026-10-10**, owner-directed, out of a sitting that drew the screen first. The assignment
list is the one class screen whose title row does not end in **← All classes**: *+ New assignment*
holds that corner, and the door home is pushed into a row of its own in the body. Every row carries
five buttons, and an empty category draws a boxed bar under a heading that already says *nothing in
it yet*. **The first of two pieces**, cut at booking to stay below L: this one changes how the
screen looks and adds no behaviour; [WO-3.55](#wo-355--the-assignment-list-sorts-within-each-category-and-writes-nothing)
adds sorting after it.

**Surface.** [`design/mockups/assignments-tidy.html`](../../design/mockups/assignments-tidy.html),
frames A (as it ships at v182) and B, styled in
[`design/mockups/proposed-assign-tidy.css`](../../design/mockups/proposed-assign-tidy.css)
§ ASSIGN TIDY, with `design/mockups/README.md` § "The assignment list, tidied". **Lift the section
rather than re-deriving it** (`PROTOCOL.md` § When the drawing lands), and amend its banner in the
same sitting. Frame C and § ASSIGN SORT are WO-3.55's.

**Rulings, the owner's, 2026-10-10**
1. **← All classes moves to the right end of the title row**, the markup Attendance and Scores
   carry. **+ New assignment takes the body row it vacated, at its right end**
   (`.assign-actions.end`) — the same edge, one level down. The past-due prompt and the
   "arrived from another term" line stay between that row and the table.
2. **The assignment's name opens the editor, and the Edit button goes.** The name is a real
   `<button>` (`.assign-name-btn`) in the name's own type; indigo with a dotted underline under a
   pointer; 44px tall under a coarse one.
3. **Duplicate is a copy icon — two offset squares — and Delete is a bin** (`.assign-icon-btn`, worn
   beside `.class-action-btn` and `.assign-row-btn`). Each keeps an `aria-label` naming the
   assignment and a `title`. Delete keeps `.delete`'s red hover. ✎ is not used: on a roster row it
   opens the log sheet.
4. **↑ ↓ are unchanged.** They set the Scores grid's column order as well as this list's.
5. **An empty category's notice is its own heading** (`.assign-group-head.empty`), in the old bar's
   amber, and the bar goes. The note, by case: *Nothing in it yet · its 20% is shared across the
   others* (weighted, the weight its own); *Nothing in it yet · 0%, counts for nothing* (weight 0);
   *Nothing in it yet · adds nothing until something is in it* (a class graded on total points).
6. **"Not in a category" takes the same move** (`.assign-group-head.unfiled`): red in a weighted
   class, the amber of `.counted` in a points class (WO-3.36), and the bar goes. Weighted note:
   *N assignment(s) · counted toward nothing — tap its name to file it.* Points-class note:
   *N assignment(s) · counted, but in no category — tap its name to file it.*
7. **Nothing lives only in a tooltip**, because a finger never shows one. Each removed bar's full
   sentence is hidden text (`.sr-only`) inside its heading — a `title` on a row is not reliably read
   — and the hint below the list carries, in words: *tap an assignment's name to edit it*; that
   Duplicate is *the two squares on its row*; and that *a category with nothing in it yet does not
   count as a zero — its weight is shared across the others until something is in it.*
8. **The roster keeps "✎ · Edit · Remove"**, on purpose: those rows are people, and *Remove* is the
   right word where a bin is not. A deliberate divergence, not a drift to tidy.

**Answered — the owner, 2026-10-10, before dispatch: the points-class note on "Not in a
category"**, which was not drawn, reads as proposed — now ruling 6's second sentence.

**Deliverables**
- **`index.html`**: `#assignmentsView`'s title row ends in the `data-view-home` button; the body's
  `.assign-actions` holds `data-assignment-new` and gains `end`; the hint gains ruling 7's sentences.
- **`src/assignments.js`**: `assignmentRow()` builds the name button and the two icon buttons and no
  Edit; the empty and unfiled branches of the list painter build a classed heading with its note and
  hidden sentence and no `noticeRow()`; ruling 6's sentence stops saying *Open Edit*.
- **`src/assignments.css`**: § ASSIGN TIDY lifted, its coarse rules into the existing
  `(pointer: coarse)` block and its controls into the top-of-sheet `touch-action` selector.
  `.assign-group-empty` and `.assign-group-orphan` go if nothing else wears them — check first:
  **four** other rules in the sheet borrow that amber by name in their comments (the fourth,
  `.assign-moved-nameless`, landed with WO-3.56 after this was booked). If the class goes, repoint
  each comment at `.assign-group-head.empty` rather than leaving it naming a class that is gone.
- **The harness**: every check that presses Edit or Duplicate by its words, or reads
  `.assign-group-empty` / `.assign-group-orphan`. At least `tools/verify/assignments.mjs`,
  `category-removal.mjs`, `points-grade.mjs`, `copy-class.mjs`, `touch-targets.mjs` and
  `class-tab-keeps-screen.mjs`; grep `tools/verify/` for the hooks before trusting that list. Since
  booking, `copy-class.mjs` (WO-3.56's nameless checks) and `dialog-kinds.mjs` (WO-1.77, a coarse
  `tap()`) also press `data-assignment-edit` — by hook, so they stay green if the hook moves intact.
- **A phone-width baseline for [WO-3.59](#wo-359--the-assignments-screen-scrolls-sideways-at-phone-width)**,
  measured and not fixed: the assignments screen's horizontal overflow at 390×844 under a coarse
  pointer, before this work order's change and after it, written as a note (no box) in `TESTING.md`
  § WO-3.54. WO-3.59 waits on this one partly to see whether it caused a new overflow, and needs the
  two numbers to tell. Fixing the overflow here is WO-3.59's scope, not this one's.
- **`design/mockups/proposed-assign-tidy.css`'s § ASSIGN TIDY banner, `README.md` section and
  `index.html` entry** amended to say the section landed.
- **`TESTING.md` § WO-3.54**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] On the assignment list, the title row's last control is ← All classes (`data-view-home`), and
      + New assignment is the last control of the body's first row, right-aligned.
- [ ] No row carries an Edit button. Tapping a name opens the editor for that assignment, and the
      name button carries `data-assignment-edit`.
- [ ] Each row's Duplicate and Delete are icon buttons whose `aria-label` names the assignment, with
      the `data-assignment-duplicate` and `data-assignment-delete` hooks unchanged; each is at least
      44px square under a coarse pointer.
- [ ] An empty category draws one heading row with `.empty`, the note for its case word for word
      (ruling 5, all three cases), its full sentence in hidden text, and no row after it before the
      next heading. No `.assign-group-empty` element exists.
- [ ] "Not in a category" draws one heading row with `.unfiled` — `.counted` added in a points class
      — and no notice row; its note is ruling 6's for its grading mode, word for word, and does not
      say *Edit*.
- [ ] The hint carries ruling 7's three sentences.
- [ ] 👤 On the teaching iPad, upright: the two doors sit where ruling 1 puts them, a name tap opens
      the editor, both icons read as what they are, and the empty and unfiled headings are legible
      without a bar. WO-3.56's amber nameless warning, on the note line above the table, still
      reads as its own message beside the new top row and the amber headings below it.
- [ ] `CACHE` in `sw.js` is bumped.

**Traps** — **Move the hook, do not rename it.** `data-assignment-edit` routes in `src/shell.js` and
is what the harness presses; it goes onto the name button as it is. **Do not touch the roster** —
ruling 8. **The focus ring stays**: the name button is styled to look like text, and this repository
forbids suppressing a ring to finish the look. **The three removed sentences differ by grading mode
and weight** — the weighted, zero-weight and points branches each have their own, in the comment
above them; carry each into its heading's hidden text, do not collapse them into one.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/README.md`
  - `design/mockups/assignments-tidy.html`
  - `design/mockups/proposed-assign-tidy.css`
  - `src/assignments.css`
  - `src/assignments.js`
  - `src/shell.js`
  - `tools/verify/assignments.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `design/mockups/PROTOCOL.md` § "When the drawing lands" — lift the section, amend its banner in the same sitting.
- `src/roster.js` — **read only, to see what you must not change** (ruling 8).
- The rest of the harness that touches this screen — grep `tools/verify/` for `data-assignment-edit`, `data-assignment-duplicate`, `assign-group-empty`, `assign-group-orphan`, `Edit`/`Duplicate` pressed by text, and `noticeRow` before trusting the Deliverables' list. `copy-class.mjs` and `dialog-kinds.mjs` press the edit hook by hook and should stay green untouched if the hook moves intact.
- `index.html`'s Attendance and Scores title rows — ruling 1 says ← All classes takes *their* markup; copy it, do not compose a new one.

**Traps this brief adds.**
- **Measure the 390×844 coarse-pointer overflow *before* you change anything**, and write the number down (status note or scratch) at once — after your change there is no "before" left to measure. It is a note in `TESTING.md` § WO-3.54, no box, and fixing the overflow is WO-3.59's, not yours.
- **The `CHANGELOG.md` entry is a named Deliverable of this work order**, so write it; it overrides the generic "leave CHANGELOG to the teacher" line in § 3 for this one.
- **Session-limit risk is high on this dispatch** (the gate's window read 18.5M proxy units against a p25 death at 16.4M). Write your files in an order that leaves a coherent tree at each step, keep `TESTING.md`'s evidence current as you go rather than at the end, and if you mutation-test anything: `git add` your work first, mark the plant `MUTATION`, and **revert it before you write anything else** (`AGENTS.md`).
- Bump `CACHE` in `sw.js` once, at the end, against whatever it reads then.

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

1. On the assignment list, the title row's last control is ← All classes (`data-view-home`), and + New assignment is the last control of the body's first row, right-aligned.
2. No row carries an Edit button. Tapping a name opens the editor for that assignment, and the name button carries `data-assignment-edit`.
3. Each row's Duplicate and Delete are icon buttons whose `aria-label` names the assignment, with the `data-assignment-duplicate` and `data-assignment-delete` hooks unchanged; each is at least 44px square under a coarse pointer.
4. An empty category draws one heading row with `.empty`, the note for its case word for word (ruling 5, all three cases), its full sentence in hidden text, and no row after it before the next heading. No `.assign-group-empty` element exists.
5. "Not in a category" draws one heading row with `.unfiled` — `.counted` added in a points class — and no notice row; its note is ruling 6's for its grading mode, word for word, and does not say *Edit*.
6. The hint carries ruling 7's three sentences.
7. 👤 On the teaching iPad, upright: the two doors sit where ruling 1 puts them, a name tap opens the editor, both icons read as what they are, and the empty and unfiled headings are legible without a bar. WO-3.56's amber nameless warning, on the note line above the table, still reads as its own message beside the new top row and the amber headings below it.
8. `CACHE` in `sw.js` is bumped.

**Write `TESTING.md` § WO-3.54 — it is a deliverable, not a permission.** Add `### WO-3.54 — the assignment list's top matches the other class screens, and its rows get lighter` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.54` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

