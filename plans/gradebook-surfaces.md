# Gradebook surfaces: which screens are views and which stay modals

**Decision record — 2026-08-09. Status: settled.**

The gradebook's three heavy screens — **the assignment list, the score entry grid, and the
per-student detail** — are **main-area views** in `<main>`, siblings of `#homeView` and
`#classView`, toggled by `.hidden`. The two setup editors — **categories and letter scales** — stay
**modals**.

This document exists because the evidence in the repository points the other way. Every class-scoped
editor built before this date is a modal: the class manager, the term editor, the roster paste box,
the student editor, the categories panel WO-3.1 has just added. Someone briefing WO-3.5 will read
that precedent, follow it, and be following the evidence. The rule that says otherwise is real, is
older than this record, and is easy to miss because it is written down in a Phase 1 work order about
attendance.

## The rule this is decided by, which is not new

WO-1.13 — the work order that moved attendance out of a dialog and into `#classView` — drew the line
in the same breath, at
[`work-orders/phase-1-shell-store-roster.md`](work-orders/phase-1-shell-store-roster.md):

> **Modals keep what they are good at**: the class manager, the term editor, the roster paste box,
> the student editor, the delete confirms. A modal is right for a task you finish and dismiss and
> wrong for the surface a teacher works in all period. Do not convert them.

`index.html`'s `<main>` comment says the same thing to anyone reading the markup. So the test already
exists and it is a good one:

**A surface a teacher works in → a view. A task a teacher finishes and dismisses → a modal.**

Nothing here changes that rule. This record only applies it to five screens it was written before,
and writes the answers down where the work orders can see them.

## Applying it

| Screen | Work order | Surface | Why |
|---|---|---|---|
| Score entry grid | WO-3.5 | **View** | Its own work order calls it "the second-most-frequent action in the app" and says it "gets the same care as marking attendance". Attendance is a view. |
| Assignment list | WO-3.3 | **View**, with modal editors | The list is a surface you scan and work down; creating one assignment is a task you finish. Same shape as the roster. |
| Per-student detail | WO-3.7 | **View** | Its own text already calls it "the screen open during a guardian conference". |
| Categories & weights | WO-3.1 | **Modal** — shipped | Set up in August, revisited a few times a year. |
| Letter-scale editor | WO-3.2 | **Modal** — shipped | Same. Reached from a document-level door in the class manager rather than from a class row, because the row is not re-cut (below); the per-class override is a subject row inside the panel. |

### The score grid is the one that cannot be a modal

Three reasons, in the order they bite:

1. **A modal's dismissal contract fights the entry contract.** WO-3.5's first acceptance line is
   "entering 25 scores down a column takes 25 keystroke-groups and no mouse". A modal closes on
   `Esc` — that is the shell's own behaviour, in `src/modal.js`, and it is correct for a modal. One
   stray `Esc` two-thirds of the way down a column, and the surface holding the teacher's place is
   gone. The keyboard is the point of this screen and the keyboard is what a modal reserves for
   leaving.
2. **A focus trap and a grid want the same keys.** Tab cycles within a dialog by design. In a grid
   Tab moves across a row, which is the neighbouring assignment, which is a different thing to type.
3. **`.modal-panel` is 480px wide, `max-width: 95vw`.** Students down and assignments across needs
   the 1300px `.main` gives it, the way `.attendance-panel` takes the full width after the owner
   overruled its 720px cap on 2026-08-06 for exactly this reason — a panel narrower than its main
   area "reads as a window that never closed". That correction is recorded in `src/attendance.css`
   and should not be re-learned a third time.

### And the class manager gets less cramped by doing nothing

The class manager's row now carries six controls — `↑ ↓ · Terms · Categories · Rename · Archive` —
and the row is the reason this question came up at all. WO-3.1 put Categories there because the
header strip could not take a fourth icon without horizontal overflow at 390px
(`src/classes.js`, `classRow()`).

**This record does not re-cut the class manager**, and no work order is opened to do it. It only
stops three more doors being added to it: if the assignment list, the score grid and the per-student
detail were all modals reached from a class row, the row would carry nine controls and the pop-up
would be the app's real home screen. They are views reached from the class view instead, so the
manager keeps the four setup tasks that genuinely belong to it.

If the row is still cramped once Phase 3 lands, that is a real complaint with a cheap answer —
Terms and Categories are both setup, and could fold behind one **Set up** door — but it is a
different decision, and it should be made against the finished row rather than predicted here.

**WO-3.2 took this literally and the row is untouched.** *(2026-08-09, in that work order's build.)*
The letter scale needed a door and had three places it could not go: a seventh control on the row
(this section), a fourth icon in either header strip (`index.html`'s own 390px measurements), and the
teacher's own details panel (`src/teacher.js` declines it by name). So it is a **document-level
control in the class-manager panel** — under the class list and its hints, not on a row — and the
per-class override is reached from a subject row *inside* that panel: "Every class", then one `.pill`
per class on the bar. The row was going to be the obvious answer and the record above is the reason it
is not; the same shape is available to any later document-wide setting that needs a home.

## What was considered and rejected

**Making the gradebook one big modal with tabs inside it.** It keeps every class-scoped screen in
one place, which is the tidy answer. Rejected: it makes the app's most-used screen a dialog, and it
puts the tab strip that switches classes (in the header, outside the dialog) and a tab strip that
switches screens (inside it) on screen at once, meaning two rows of tabs and neither of them
obviously the one you want.

**Promoting categories and letter scales to views too, for consistency.** Rejected because
consistency is not the rule — the rule is what the teacher is doing. A view for a screen opened
twice a year costs a navigation target on the class view forever, and the class view's strip is
already the scarcest space in the app.

**Opening a work order to convert anything.** There is nothing to convert. WO-3.3, WO-3.5 and
WO-3.7 are all `⬜ NOT STARTED`; they get a deliverable line and a trap each, and build the right
thing the first time. A conversion work order would only exist if we let them build the wrong thing
first.

## What follows from this

- WO-3.3, WO-3.5 and WO-3.7 each carry a **Surface** deliverable naming the view and a **Trap**
  against the modal system. Added 2026-08-09, in this same pass.
- `src/views.js` gains view ids as those work orders land. Its header already anticipates later
  views; adding three is what it was written for, and there is still no router, no history stack and
  no hash.
- Each new view gets `src/<screen>.css` loaded after `src/shell.css`, styling only its own class
  names, with its own `@media (pointer: coarse)` block at the end — the convention `src/shell.css`'s
  header sets and `home.css` and `attendance.css` both follow. **Two stylesheets must never style the
  same class.**
- Mockups of all four screens, built against the real stylesheets, live in
  [`../design/mockups/`](../design/mockups/README.md). They are drawings, not code, and they say so.

## How the class view navigates between its screens

**Decided 2026-08-09 by the owner**, against the candidate drawn in `../design/mockups/`. This
section asked the question until that date and is kept as an answer rather than replaced, because
WO-3.3 is briefed off it.

**A segmented control under the panel title, carrying three tabs: Attendance · Assignments ·
Scores.** Light-surface grammar, on the white panel, not in the header strip — that strip already
carries the class tabs, the term nav and three icon buttons, and `src/classes.js` records that a
fourth control up there puts the page into horizontal overflow at 390px. The class tabs answer
*which class*; this answers *which screen of it*.

**Per-student detail is not a fourth tab.** It is reached by tapping a student from any of the
three, and the strip then shows that student's name as a fourth segment *while you are in it* — a
breadcrumb back, which appears because you went somewhere. The drawings had it as a peer tab labelled
"A student", set apart by a gap that admitted it was a different kind of destination; the gap was the
right instinct and the wrong fix. A tab you cannot enter without first choosing a student is either
dead on a freshly-opened class or it invents a selection the teacher did not make, and neither belongs
on the app's primary navigation. WO-3.7's own first sentence — "the screen open during a guardian
conference" — describes arriving from a name, never from a nav bar.

**A class always opens on Attendance**, never on the screen it was left on. Attendance is the
critical path: marked at the door while thirty students walk in, and the one flow whose speed the
working agreements name. Grade entry across five classes pays a second tap per class for it, and that
is the right way round — the fast path should be the one with the class arriving, not the one at a
desk. Last-screen memory also means opening 2nd period and not immediately knowing what you are
looking at.

**The two strips on screen at once were put to the owner and accepted.** It is the same objection
that killed the tabs-in-a-modal option below — class tabs in the navy header, screen tabs on the
white panel — and it is answered by the registers being different rather than by there being fewer
strips. Recorded because it was raised and answered, not because it went unnoticed.

## What this record does not decide

**Whether the class manager's row gets re-cut** — see above; that is a decision to make against the
finished row rather than predicted here.
