# Gradebook mockups

**Drawn 2026-08-09**, before any Phase 3 screen was built. Open
[`index.html`](index.html) — or, with `node tools/serve-https.mjs` running,
`https://<your-lan-ip>:8443/design/mockups/`.

These are **drawings**. There is no JavaScript in any of them, nothing reads or writes a document,
and no number recomputes. Every page says so in a black band across the top, and `mockup.css` exists
to keep that band impossible to mistake for a component of the app.

## Why they exist

To make one decision arguable before it got expensive: **the assignment list, the score entry grid
and the per-student detail are main-area views, not modals.** The reasoning, and the rule it follows,
is [`../../plans/gradebook-surfaces.md`](../../plans/gradebook-surfaces.md). WO-3.3, WO-3.5 and
WO-3.7 each carry a **Surface** deliverable and a trap pointing at it.

The second reason is the annotations — places where a drawing had to guess and the guess was not the
drawing's to make. Amber ones are still **open**; green ones marked **DECIDED** have since been
answered and are kept in place rather than deleted, because a drawing that quietly absorbs a decision
loses the record of there having been a choice. **Two are decided and ten are open** — the two
decisions each spawned a smaller question of their own — and they are listed at the bottom of this
file so they are not lost when someone reads only the pictures.

## What is here

| File | What |
|---|---|
| `index.html` | Contents, and what to look at on a tablet |
| `scores.html` | Score entry grid — WO-3.5 |
| `assignments.html` | Assignment list and its modal editor — WO-3.3 |
| `student.html` | Per-student grade detail — WO-3.7 |
| `class-manager.html` | The class manager row, two variants, deliberately undecided |
| `proposed.css` | **The half that lifts.** Proposed styles for all three views |
| `mockup.css` | **The half that does not.** The "this is a drawing" chrome |

## How they relate to the real stylesheets

Each page links `../../src/shell.css` **directly**. Nothing is copied and nothing is re-derived, so a
drawing cannot quietly disagree with the app — if the shell changes, these change with it, and if one
of them breaks, that is information. The header, the panel, `.class-action-btn`, `.search-box`,
`.modal-*`, `.avatar` and `.class-row` are all worn as shipped.

`proposed.css` **defines no rule that targets a class any `src/` stylesheet styles** — checked by
stripping its comments and diffing its selectors against `src/*.css`, not by reading it. The check
caught one violation on the first run: `.detail-hero .avatar { width: 44px }`, which is the shorter
way to enlarge the hero's avatar and exactly the thing the rule forbids. It is now `.detail-avatar`,
a second class worn alongside `.avatar` — the shape `.hdr-mode-btn` uses.

The one shared name still in the file is `.active`, and it is always compound-qualified by one of
this sheet's own classes (`.screen-nav-btn.active`), which is the posture `src/attendance.css` takes
with `.attendance-state.taken`. It splits three ways on lift, at the section banners:

```
§ SCORE GRID       →  src/scores.css        (WO-3.5)
§ ASSIGNMENT LIST  →  src/assignments.css   (WO-3.3)
§ STUDENT DETAIL   →  src/detail.css        (WO-3.7)
§ SHARED           →  whichever lands first
```

It follows the app's own stylesheet rules so that "lift" means lift: colours inline and never as
custom properties, no dark mode, one grouped touch-action selector at the top, and a
`@media (pointer: coarse)` block at the end naming every control the file adds.

**These files are not in `sw.js`'s precache and must never be.** They are not part of the app.

## Decided since the drawings were made

Both on **2026-08-09**, by the owner, and both are recorded in
[`../../docs/data-model.md`](../../docs/data-model.md) § Grade math, which is the authority. The
drawings have been redrawn to match and carry green **DECIDED** notes where the amber ones were.

- **There is no grade at all until the weights total 100** — not a provisional figure, not a figure
  with a label on it. This *replaces* a paragraph WO-3.1 added to the data model that morning, which
  said the engine should divide by the actual total; the work order's own result file had flagged
  that paragraph as the thing to cut if it had legislated into WO-3.4's territory. It had.
  Consequences: WO-3.1's Acceptance line 2 is struck and rewritten, and **`src/categories.js`'s copy
  is now false** — it promises a provisional grade where there will be none. That correction is a
  code change coupled to a `verify-shell.mjs` check and is folded into WO-3.5's brief.
- **Extra credit is a zero-point assignment**, needing no flag, field or category type. It falls out
  of a category being `sum(earned) / sum(possible)` — which this decision therefore also pins.
  A category may exceed 100% and so may the overall grade; nothing caps either.

## The open questions, collected

Ten, in the order a reader meets them. Each is drawn in place with an amber note.

1. **The score cell is `type="text"` + `inputmode="decimal"`, not `type="number"`.** WO-3.1's weight
   field is a real number input and passed the iPad sitting — but that is one 58px field in a dialog,
   where this is ~240 of them in 96px columns. Needs a device before WO-3.5 commits.
2. **A category holding only zero-point assignments has `possible = 0`.** Not 100%, not 0%, and a
   crash in a naive engine — and a teacher reaches it by making an "Extra credit" category and
   putting only extra credit in it, which is the obvious thing to do. It should redistribute like an
   empty category. *Added to WO-3.4's acceptance list; it is the tail of the extra-credit decision
   rather than a separate question.*
3. **What does "class average" say when there is no grade?** Presumably the same em dash — but the
   per-assignment footer averages are computed from points, not weights, and have no reason to
   disappear with it. Drawn that way; worth confirming.
4. **Five buttons per assignment row** is the class manager's crowding problem again, at nine rows.
   Drawn wide on purpose so it can be seen rather than argued about.
5. **Three hand-rolled form layouts and counting** — the categories editor, the roster's
   `.student-field`, and now the assignment editor. This is normally where the suite lifts a field
   component from `design/portable-components.md` instead. Cheaper before WO-3.3 than after.
6. **Should the per-student detail be reachable in presentation mode at all?** WO-3.7 only requires
   that no `supports` data appears. A named student's failing grade on a projector is a different
   kind of disclosure and the work order is silent on it. **The owner's call.**
7. **Class manager: variant A or variant B.** Six controls with a wrapping row on long class names,
   or five with Terms and Categories folded behind one door at the cost of a tap. Nothing in Phase 3
   is blocked on it.
8. **The removal confirm counts data, not effort.** "2 assignments and 10 scores" is honest about
   what is destroyed, but an assignment worth 25 points with no scores in it costs nothing by that
   sentence's arithmetic — while still being work the teacher set up and would have to set up again.
   Cheaper to settle before WO-3.3 makes removals common.
9. **Five controls per category row inside a 480px dialog** — the class manager's crowding, one level
   down. Worth reading on the tablet beside `class-manager.html` rather than separately.
10. **"What it would take to move" has to count outstanding bonus work**, now that extra credit is
    real — and "score 75% on everything left" is ambiguous when one of those is worth 0 points.
    Bonus work needs its own line in that arithmetic. WO-3.7's; not yet drawn.

## What the drawings deliberately do not decide

**How the class view switches between its screens.** Attendance, assignments, scores and a student's
detail are all views of one open class and something has to move between them. A segmented control
under the panel title is drawn in all three so there is something concrete to argue with — but
WO-3.3 owns that decision, because it is the first work order that needs it. Drawing it is not
choosing it.
