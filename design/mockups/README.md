# Mockups

Two rooms. **The gradebook drawings** were made 2026-08-09, before any Phase 3 screen was built;
**the Phase 6 drawings** were made 2026-08-19, before any of Phase 6 existed at all. Open
[`index.html`](index.html) — or, with `node tools/serve-https.mjs` running,
`https://<your-lan-ip>:8443/design/mockups/`.

Everything below the next divider is about the gradebook drawings, which came first. The Phase 6
pair has its own section at the bottom of this file; the rules — no JavaScript, the black band,
`src/shell.css` linked rather than copied, never in `sw.js`'s precache — are the same for both.

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
loses the record of there having been a choice. **Three are decided and ten are open** — the first
two decisions each spawned a smaller question of their own, and the third is the screen switcher,
which was the question these drawings existed to make arguable. All are listed at the bottom of this
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

## The one the drawings deliberately did not decide, and its answer

**How the class view switches between its screens — decided 2026-08-09 by the owner.** A segmented
control under the panel title was drawn in all three pages so there was something concrete to argue
with, and arguing with it changed two things:

- **Three tabs, not four.** Attendance · Assignments · Scores. The drawings carried a fourth,
  *A student*, set apart by a gap that admitted it was a different kind of destination. The gap was
  the right instinct and the wrong fix: a tab you cannot enter without first choosing a student is
  either dead on a freshly-opened class or it invents a selection nobody made. Detail is reached by
  tapping a name, and the strip shows that name as a **breadcrumb** only while you are in it — which
  is what `student.html` was already drawing, and the reason that page needed no redraw.
- **A class always opens on Attendance**, never on the screen it was left on. Marking at the door
  while the class walks in is the critical path; grade entry pays a second tap per class for it.

`assignments.html` and `scores.html` have lost their *A student* tab and all three pages carry green
**DECIDED** notes. The record is
[`../../plans/gradebook-surfaces.md`](../../plans/gradebook-surfaces.md) § "How the class view
navigates between its screens", and WO-3.3 now carries it as a deliverable with two acceptance lines
rather than as a question.

---

# Phase 6 — the calendar and the glance page

**Drawn 2026-08-19**, and a long way ahead of the work: Ship 2 is still waiting on the term, and
Phase 6 is the last phase before packaging. They exist anyway for the reason
`plans/ROADMAP.md` gives for putting the glance page late — *"build it before signals and outreach
exist and you build it twice"* — which cuts the other way too. **The home screen has been
accreting toward this page since WO-1.10, and every phase between here and there adds a line to
it.** A drawing of the destination is what stops each of those lines being designed on its own.

| File | What |
|---|---|
| `glance.html` | The glance page — WO-6.4. Drawn twice: a Tuesday with things on it, and a quiet day |
| `calendar.html` | Month view, week view, the same month projected, and the event editor — WO-6.1 · 6.2 · 6.3 |
| `proposed-phase6.css` | **The half that lifts**, split three ways at its section banners |

`proposed-phase6.css` is a second file rather than more of `proposed.css`, because one of those
sheets describes a phase that has shipped and the other describes a phase that has not. It obeys
the same rule — **no selector targets a class any `src/*.css` styles** — and it obeys it more
strictly than its predecessor had to: every rule's key compound is anchored on a `cal-` or `gl-`
class this sheet owns, checked mechanically against the 536 class names the app's five stylesheets
define. Neither prefix appears anywhere in `src/`. It splits:

```
§ SHARED          →  whichever lands first
§ CALENDAR        →  src/calendar-view.css   (WO-6.3)
§ EVENT EDITOR    →  src/events.css          (WO-6.1)
§ GLANCE          →  src/glance.css          (WO-6.4)
```

`src/calendar.js` already exists and is the event **model** (WO-2.3). The view is not it — hence
`calendar-view.css`, since a module with no DOM in it should not acquire a stylesheet named after
it.

`glance.html` links `src/home.css` as well as `src/shell.css`, because the first thing on that page
*is* the home grid: `.class-card`, `.class-card-state` and `.class-card-signals` are worn exactly as
shipped, and the only new class on that panel is the chip that goes in the slot. If WO-6.4 ever
needs to restyle one of them, that drawing breaks loudly, which is the point.

## What the drawings propose

Six things that are decisions rather than renderings, each argued at the point it appears:

1. **Colour is urgency; the glyph is the kind.** Twelve event kinds in four washes — not meeting ·
   in your diary · due from you · inside its lead time — rather than twelve palettes. The reason is
   `src/assignments.css`'s own, about `.cat-chip` carrying no colour per category: a palette that
   has to be memorised is not a palette.
2. **A derived item is plain and carries `↗`.** Never dashed — dashed already means "the class did
   not meet" in three places, and a second meaning for one border style is how a grammar stops
   being one.
3. **A holiday tints the cell; a planned drop tints only a chip.** One is a fact about the day,
   the other about two classes. One event naming two classes, never two events.
4. **`Repeat weekly` says out loud that it is making fourteen separate rows**, before the button
   rather than after it, and the edit dialog carries a *Delete all 14* beside *Delete this one*.
   That second button is the price of materializing instead of storing an RRULE, and it is worth
   paying.
5. **Concern and praise are `1fr 1fr`, side by side.** A stack buries whichever is second on any
   screen shorter than both lists, and every iPad is. At the phone breakpoint they stack and
   **praise is drawn first**, for the same reason they are equal above it.
6. **A quiet day is one panel, and it shows its warrant.** The other four do not exist — the
   decision is about how many panels there *are*, which is why it cannot live inside any of them
   as an empty state. The four chips say what was checked, because a bare "nothing needs you" on a
   teacher's busiest morning is one she will go behind and verify.

## The open questions, collected

Nine, in the order a reader meets them. Each is drawn in place with an amber note. **None is
settled**, and three of them are cheaper to answer now than after a work order is cut.

*On the calendar —*

1. **Mon–Fri, or the full seven?** Five columns buy each day 20% of the width instead of 14%, which
   on an iPad is a title rather than an ellipsis. But a Saturday trip has nowhere to go, and a
   teacher who types one and cannot find it will not trust the calendar again. Drawn at five.
2. **The chips are not 44px**, and every other control in the app is. Four items in a September
   cell at a 44px floor is a month that needs two screens. The proposal makes the *cell* the
   target — the same call `src/home.css` makes for `.class-card-state` — and **it needs a thumb on
   the real tablet before WO-6.3 commits**, exactly as the score cell's input type did before
   WO-3.5.
3. **Month · Week is a second segmented control.** `.screen-nav` ships already, but its ARIA says
   "Screens for this class" and its module resolves through `src/views.js`'s class screens. Same
   shape, different meaning: generalise the component or carry two that look identical. *Cheaper
   before WO-6.3 than after.*
4. **What happens to “Days off”?** WO-2.3's dialog authors `no-school` and `dropped`; WO-6.1's
   editor authors all eight kinds including those two. Two authoring surfaces for the same two
   kinds is the "two controls meaning one thing" defect that reopened Phase 1. Drawn as though the
   dialog has gone — the home panel's `📅 Days off` button is `📅 Calendar` on the glance page.
5. **Which kinds take a class list?** `no-school` is school-wide and `dropped` refuses an empty
   one — both already shipped in `src/calendar.js`. The other six are undecided, and `studentId`
   has been in the schema since day one with nothing ever writing it. Drawn with the class picker
   omitted, which is the version that ducks the question.
6. **Eight kind pills is three wrapped lines at 390px.** A `<select>` is what `src/shell.css`
   explicitly rejected for the iPad on `.dayoff-kinds`. Third option: the `+ Add` on a cell offers
   the four common kinds and "more…" opens the rest.
7. **Five rail dots with no labels.** The colours are `avatarClass(id)`'s and are the same ten the
   teacher already reads on the class cards — but a dot has no initials on it and the week panel
   has no key. Drawn with the answer in a `title`, which is the option that fails silently on a
   tablet.

*On the glance page —*

8. **The chips on a card report; they do not tap through.** WO-6.4 says every item taps through,
   and "3 to grade" landing on the attendance grid is a half-answer — but the card has been a
   single `<button>` since WO-1.13 and a control cannot nest inside a control. The proposal is
   that **the card says how many and the panels below say who**. That is a defensible reading of
   the work order and it is not the only one. **The owner's call.**
9. **Five panels is two scrolls on an iPad**, which puts "who needs you" — the reason the app
   exists — below the fold at 7:40am. Reorder is ruled out by the work order; collapsing panels
   3–5 to their counts, or a two-column page above 1024px, are not. **Worth reading on the real
   iPad against this drawing.**

## The one that is not a preference

**There is no IEP/504 review date anywhere on the glance page, and that is two work orders in the
same phase disagreeing.** WO-6.1 asks for review dates "surfaced ahead of time, in
presentation-mode-safe form"; WO-6.2 puts them on the calendar and requires them to vanish when
projected; and WO-6.4's acceptance says *"Nothing on the page displays `supports` data, in
presentation mode or out of it"* — where a review date is `students[].supports.reviewDate`.

Read literally, **the one deadline a teacher is legally obliged not to miss is the one deadline
*Closing in* may not show her.** It is drawn literally so the gap is visible. The safe resolution
is probably that a date and a name is not "displaying supports data" — but that sentence has to be
written into the work order before an implementer decides it alone, in a file nobody reviews for
disclosure. `CLAUDE.md` § Accommodations is the standard it has to meet.

## And one thing the drawings assume without asking

**Signals need 4–6 weeks of real data before they fire at all** (Phase 4's own note), and Phase 6
sits behind Phase 4. From Sep 2 until mid-October, every day is a quiet day for panels 4 and 5 —
so `glance.html`'s second drawing is what the glance page looks like for the first six weeks of
the term it ships into. Either that is fine, because the class grid and the grading queue are real
from day one, or the empty state needs a second voice for **"not yet" rather than "nothing"**.
It is the state the owner will see most.
