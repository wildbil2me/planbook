# WO-3.17 — the Assigned and Due fields · result

**Implementer** Claude (work-order-implementer), 2026-08-10
**Status written to the tracker** 🔨 IN PROGRESS — five of six Acceptance lines ticked; line 6 is 👤
and stays open. `wo-gate.mjs --tick` refused ✅ DONE and named the open line, which is correct.

## Verification, run and read

Both commands were run to completion on the tree as it now stands, and these are their own summary
lines rather than a prediction of them:

```
node tools/verify-shell.mjs
563 checks · 563 passed · 0 failed · 0 skipped
13,558 lines · 24.1 lines per check · 182s          (exit 0)

node tools/wo-sweep.mjs
16 checks · 15 passed · 0 failed · 1 to review      (exit 0)
```

The single REVIEW is the standing sensitive-field-name sweep (174 mentions across eleven files),
unchanged by this work order and unrelated to it.

Five runs of `verify-shell.mjs` in total: two that failed and diagnosed the harness (below), one
green, two mutation runs, and the final green one quoted above.

## Against each Acceptance line

### 1. A newly created assignment opens with both dates on today's date, formatted as the field expects — **met**

`createAssignment()` (`src/assignments.js`) now sets `assigned` and `due` to `todayISO()`. Read
through that function rather than a local `new Date()`, because it is built from the local calendar
fields — an assignment written down at eight on an October evening must not be filed as tomorrow's.

Verified by two checks, from both ends. The new WO-3.17 section drives the real **+ New assignment**
button and asserts the document and both `<input type="date">` values against a date derived **in
Node** off the same machine clock (`nodeToday`), not read back from the field it was written from:
`node says 2026-08-10, fields say {"assigned":"2026-08-10","due":"2026-08-10"}`. WO-3.3's own check
was **re-pointed** rather than deleted — it asserted the exact behaviour the owner overruled — and
now asserts today plus the half of that line that never changed, that nothing schedule-shaped fills
these fields.

`nodeToday` was moved (not copied) from the attendance section to above the assignments section so
one definition serves both; its old site carries a pointer.

### 2. Clearing either date and committing stores it empty, and reopening shows it empty — **met**

Two checks. The first clears both dates through the real fields on the real `change` — the event
`assignmentDateCommitted()` rebuilds the input on — and asserts the **rebuilt** field is empty as
well as the document. The second closes the editor, reopens it from the row's Edit button, and
asserts both are still empty rather than re-filled. That second one is the check that would catch a
default applied on *open* instead of on *creation*, and the mutation run confirms it does.

### 3. Editing an existing assignment with a blank date shows blank, not today — **met**

The default lives in `createAssignment()` only; `dateField()` reads `assignment[field]` and decides
nothing. The check plants an assignment with both dates blank — the shape a restore, a hand edit or
an older build leaves, and one no control can make any more — and opens it through the row's real
Edit button. It is asked **first**, before this block has created anything, so nothing the block did
can be what makes it pass.

### 4. The hint text no longer says the dates do not fill themselves in, and still says why there is no next-meeting guess — **met**

Rewritten at `index.html:806`. The bold promise is now *"A new assignment starts with both dates on
today"*, followed by the clearing rule, and then the reasoning is kept **verbatim**: *"Planbook has
no timetable and is not getting one, so there is no 'next meeting' to guess at; a due date is a plain
date you type, and it changes no grade and marks nobody."*

**I rewrote a second copy the work order does not name, and I want that flagged rather than
discovered.** `index.html:1417`, inside the assignment editor dialog itself, carried the same bold
sentence — *"Both dates are plain dates and neither fills itself in"* — an inch from the field. The
work order names only line 806, but deliverable four's own reason ("a UI that contradicts its own
printed promise is worse than either behaviour alone") applies with more force to the note inside the
dialog that does the thing. I judged that leaving it would fail the spirit of the line while passing
its letter. The check reads **both** surfaces, and the mutation run reverting only the editor's copy
turns it red with the list hint still correct.

The markup comment above the dialog (`index.html:1402`), which described the paragraph as "the app's
standing refusal about dates", was updated with it.

### 5. Both fields measure ≥44px under the coarse pointer and neither exceeds the panel width at the narrowest supported width — **met**

Measured at **390 × 844 on an emulated coarse pointer**, with both fields **empty**, which is the
work order's own testing-order trap: after part two a teacher reaches the empty state only by
clearing a date, so the block creates an assignment and clears both dates to get there. The emptiness
is asserted *inside* the same check as the geometry, so a build that stopped clearing could not
quietly turn it into a measurement of two boxes held open by a value.

```
assigned 159.25x44, due 159.25x44
panel 370.5px (capped below its natural 480) spanning 76.75..447.25
content 96.75..427.25, fields 96.75..256 and 268..427.25, gap 12px
```

Neither field crosses the panel edge or the modal body's content edge, neither overlaps the other,
the row's 12px coarse gap is intact, and neither is squeezed narrower than what it draws
(`scrollWidth` against `clientWidth`, the "Days off" spill test from the first iPad sitting).

### 6. 👤 On the iPad, portrait and landscape — **NOT verified, left `- [ ]`**

I do not have an iPad and nothing in this run touches this line. It is left unticked in
`plans/work-orders/phase-3-gradebook.md` and in `TESTING.md`.

**Be exact about what the desk could not see.** The mechanism is iOS Safari painting
`<input type="date">` as a native control at its own intrinsic size while the flex layout shrinks the
element's box. Headless Chromium honours the box already, so it never reproduced the overlap and it
**cannot demonstrate the fix**. What I could measure is that the `appearance: none` reset is live on
both fields as a **computed style** — the declaration reaches the right element — and that is a check
of its own so the one line the whole fix rests on cannot be tidied away silently. It says nothing
about whether iOS obeys it.

## Part one: the reset, and no number tuned

`src/assignments.css` gains exactly one declaration —
`.assign-field-date { -webkit-appearance: none; appearance: none; }` — under a comment carrying the
diagnosis. **No width, no flex-basis, no number of any kind was changed.** The work order's first
move was the right one as far as a desk can tell; the fallback it describes (a larger flex-basis so
the row wraps) was not needed and was not written.

`.term-date` in `src/shell.css` was **not touched**. The app-wide squatness on *Classes & terms* and
*Days off & drops* is booked separately, and copying this line onto that selector would ship an
untested change to two other dialogs under a work order about this one. A note in
`src/assignments.css` says so at the point where the temptation is.

## Two decisions the work order left to me

**The copy dialog does not get the today-default.** The brief asked me to decide deliberately between
the two creation paths and say which. `confirmCopy()` keeps carrying the source's dates unchanged,
for two reasons now written beside the code: the dialog tells the teacher in words that *"the dates
come across as they are"* before she taps, so a copy that re-dated itself would be committing exactly
the fault this work order is fixing in the hint; and a copy that dropped a due date she had already
set is a form to fill in twice, which is the cost the control exists to remove. A blank source stays
blank.

**The creation announcement now names the dates.** `announce()` on creation reads *"…worth 100
points, assigned and due today. Name it."* Everything this app writes into a field on the teacher's
behalf is said out loud with it; a default nobody announced is a value a screen-reader user finds out
about later. This is a small addition beyond the deliverables and I flag it as such.

## A harness trap that cost two runs, and reads exactly like an app defect

Written as a single 390px pass, two checks failed reporting the values of a dialog that had never
opened — the click on a row's **Edit** button landed on nothing, twice, while every measurement in
the same block read correctly.

At 390px the page reports `document.documentElement.clientWidth` **390** and `window.innerWidth`
**524**, while `95vw` resolves to 370.5px. The layout viewport really is 390 and the visual one is
524, so the page sits at a scale of about 0.74. `getBoundingClientRect` answers in layout coordinates
and `Input.dispatchMouseEvent` takes visual ones, so a control at the left edge is hit anyway and one
aimed at the right-hand end of a row is missed by about a third of the screen. Dropping the device
scale factor from 3 to 2 did not fix it, which eliminated that suspicion; what remains unexplained is
what makes the content wider than the viewport at that width.

So the block now runs at **two widths**: everything that clicks a control at 1024 × 768, and only the
geometry at 390, reached with the one control at the top of the panel. A new check asserts the two
viewport widths are equal before anything is clicked, so a return of this reads as one named line
rather than two mystery failures.

**I did not add it to `tools/README.md`'s numbered trap list**, because that list's own stated bar is
two independent diagnoses by two agents and this has one. It is written up at the point in the
harness where it bit, and summarised in `tools/README.md` and `TESTING.md` beside the count.

## Mutations — four, all reverted

| Mutation | Result |
|---|---|
| the default applied on **open** rather than on creation (`dateField()` falls back to `todayISO()`) | **4 red**: blank-shows-blank, cleared-field-empty, reopen-still-empty, and the 390px geometry check — the last because it asserts emptiness in the same breath as the boxes |
| the creation default removed (`assigned: '', due: ''`) | **2 red**: this section's today check and the re-pointed WO-3.3 one |
| the `appearance` reset removed from `.assign-field-date` | **1 red**, computed style reading `auto`. Nothing else moved — the honest limit of what this engine can see |
| the **editor's** note reverted to "neither fills itself in", list hint left correct | **1 red**, on the second surface alone |

Three runs: the last three were applied together, since each turns a different check red and none can
mask another. All reverted; the final green run above is on the reverted tree.

## Files changed

- `c:\dev\planbook\src\assignments.css` — the `appearance` reset, its diagnosis comment, and a note
  in the coarse block about why the 44px floor only now reaches the glass
- `c:\dev\planbook\src\assignments.js` — decision 1 in the header rewritten; the creation-time
  default; the announcement; notes at `dateField()` and `confirmCopy()`
- `c:\dev\planbook\index.html` — the list hint (line ~806), the editor dialog's own note (~1417),
  and the markup comment above the dialog
- `c:\dev\planbook\sw.js` — `CACHE` bumped `planbook-shell-v40` → `v41` (three SHELL files changed)
- `c:\dev\planbook\tools\verify-shell.mjs` — one check re-pointed, nine added in a new section,
  `nodeToday` moved above the assignments section
- `c:\dev\planbook\tools\README.md` — the recorded call-site count 560 → **570**, the executed count
  554 → **563**, and what the new section does
- `c:\dev\planbook\TESTING.md` — a new § WO-3.17 with the checklist, the mutation table and the
  limits
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` — Acceptance lines 1–5 ticked, line 6 left
  open, status written by `wo-gate.mjs --tick`

`CHANGELOG.md` untouched. No commit, no push.

## Left undone, and out-of-scope temptations declined

- **The app-wide date-field squatness** on *Classes & terms* and *Days off & drops*. Named by the
  work order as booked elsewhere; `.term-date` and `src/shell.css:1208` were read and left alone.
- **A due-date suggestion beyond today.** Nothing was built. `src/assignments.js`'s decision 1 now
  states in as many words that today is the only value this file will ever put in a date field it was
  not handed.
- **`design/mockups/assignments.html:423`** still reads *"Both dates are plain dates and neither
  fills itself in."* It is a drawing from 2026-08-09 and a record of what was drawn, not a shipped
  surface; I left it rather than edit a mockup under a behaviour work order. Worth a line in whatever
  work order next touches those mockups.
- **WO-3.3's Acceptance line** *"No date field auto-populates from anything schedule-shaped"* is
  still `[x]` and still true — today is not schedule-shaped, which is the whole reason the owner could
  overrule the older rule without touching the reasoning under it. Left ticked deliberately.
- **The standing "no horizontal overflow at 390×844" check compares `scrollWidth` against
  `innerWidth`.** Under the shrink-to-fit above, `innerWidth` grows to match the content, so that
  comparison can pass while the page really does overflow. I did not touch it — it is outside this
  work order and predates it — but it is a real weakness and would make a small follow-up work order
  worth booking.

## Draft CHANGELOG entry — for the teacher to accept, reject or rewrite

> **The Assigned and Due fields.** A new assignment now starts with both dates on today, which is the
> day you are almost always writing it down on. Type over either one, or clear it and leave it blank
> — a date is still never required, and clearing one leaves it empty. Nothing else fills itself in:
> Planbook still has no timetable and is not getting one, so there is no "next meeting" to advance a
> due date to. Assignments you already have are untouched, and a duplicate still carries its
> original's dates across. On the iPad the two date fields were overlapping each other and pushing
> *Due* off the edge of the panel, because iOS Safari draws a date field as its own native control at
> its own size no matter what the layout asks for; it is told not to now, and both fields sit in the
> panel at a full touch target.
