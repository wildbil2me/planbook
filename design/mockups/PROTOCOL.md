# Drawing a screen before it is built — the protocol

**How a mockup gets made here, and what has to be true before one is committed.**
Written 2026-08-20, after the second round of drawings, and it is a write-up of an existing
practice rather than a new one.

Two rounds have been drawn: the gradebook screens on 2026-08-09 (`811e4f7`, `53624d3`) and the
Phase 6 pair on 2026-08-19 (`fa723a9`). **Neither came through the work-order pipeline** — three of
the four commits that have ever touched this directory carry no `WO-` id, and the fourth is a later
correction to a drawing that already existed. The rules were nonetheless reconstructed *identically*
the second time, from reading the first round, which is the signal that they are stable enough to
write down.

This file exists for one more reason, and it is the honest one. The load-bearing rule below — rule
5, the collision check — was described in [`README.md`](README.md) as *"checked by stripping its
comments and diffing its selectors against `src/*.css`, not by reading it"*, and that check was run
**by hand, once, per round**, in a directory no harness looked at. A third round done by a different
session would have skipped it without knowing it existed. It is now
[`tools/wo-sweep.mjs`](../../tools/wo-sweep.mjs) § 19, which every dispatch already runs.

---

## When to draw, and when not to

**Draw when a surface decision is cheaper to argue with as a picture than as a build.** Both rounds
had one question each that justified them: *are the gradebook's three heavy screens views or
modals* (2026-08-09, answered in [`../../plans/gradebook-surfaces.md`](../../plans/gradebook-surfaces.md)),
and *what does the glance page this app has been accreting toward since Phase 1 actually look like*
(2026-08-19). A drawing that answers no question is a screenshot of a screen that does not exist yet.

**Do not draw a screen Roll Call! already has.** `CLAUDE.md` § Reference implementation is
unambiguous: lift the design with the function, copy rather than re-derive. The scar is WO-2.11's
pass banner, which kept the original's card *shape* and invented everything else, and was re-cut the
same day the owner read it against the running app. A drawing is for a screen with **no** counterpart
over there.

**A drawing is not a work order.** WO-1.25 ruled on this in as many words
([`../../plans/work-orders/phase-1-shell-store-roster.md`](../../plans/work-orders/phase-1-shell-store-roster.md)
§ *Not in scope*): the questions a drawing raises are answered in the phase file, or they are not
answered. Corroboration in a drawing is not a tick, and an amber note is not a tracker.

---

## What a drawing is made of

| Piece | Rule |
|---|---|
| One `.html` per surface | Linked from [`index.html`](index.html), this directory's contents page |
| `proposed*.css` | **The half that lifts.** Cut into `§` sections, each naming the stylesheet it becomes and the work order that carries it |
| `mockup.css` | **The half that does not.** Every class `mk-` prefixed; deliberately ugly, so a screenshot can never pass for the app |
| A section in [`README.md`](README.md) | What is here, what it proposes, and every open question collected out of the pictures |

One `proposed*.css` per round, not per page, so the drawings of one round share a grammar. The app's
own rule is one stylesheet per screen — the `§` banners are the cut lines, and splitting is
mechanical.

---

## The rules

**1 · Draw before the build, never after.** Both rounds were drawn before a line of their screens
existed, which is the whole value: a drawing made afterwards is a second description of shipped code,
and it will disagree with it within a fortnight.

**2 · Link `../../src/shell.css`, never copy it.** Nothing is re-derived, so a drawing cannot quietly
disagree with the app. If the shell changes, the drawings change with it; if one of them breaks, that
is information. A drawing whose page carries its own copy of a shipped rule is the second truth this
repo has refused seven times.

**3 · Two stylesheets, and the boundary is load-bearing.** `proposed*.css` is written to be carried
into the app almost as-is. `mockup.css` stays behind — that is why they are separate files rather than
one, and why every class in the second is `mk-` prefixed. **Nothing in `src/` uses that prefix**, so
the chrome cannot collide with the app.

**4 · A section banner names its target stylesheet and its work order, and is amended when it lands.**

```
     § SCORE GRID       →  src/scores.css        (WO-3.5)
     § GLANCE           →  src/glance.css        (WO-6.4)
```

The banner is read by § 19 to decide whether a section is **pending** (its target does not exist yet)
or **landed** (it does). A section with no target at all is treated as pending — which is correct for
a `§ SHARED` that has not been carried anywhere yet, and wrong the moment it lands, so **amend the
banner in the same sitting as the lift.** `proposed.css`'s own `§ SHARED` went eleven days saying
*"whichever work order lands first"* after WO-3.3 had already landed it in `src/assignments.css`.

**A section extending a stylesheet that already ships says `not yet lifted`, and that overrides the
file test.** File existence is only a proxy for "this has been lifted"; the banner is the record, and
the two part company the moment a drawing adds to an old sheet rather than proposing a new one:

```
     § LOG SHEET     →  src/shell.css    (WO-4.4 — not yet lifted)
     § LOG RECORD    →  src/detail.css   (WO-4.4 — not yet lifted)
```

Both of those files have existed for weeks. Without the token § 19 reads them as landed and stops
checking the very names that most need it — new ones going into an old sheet. The token was added
2026-08-20, drawing the Phase 4 room: the first two rounds happened to propose only new stylesheets,
so nothing had ever exercised this half of the rule. **Drop the token in the same sitting as the
lift**, exactly as with the target itself.

**5 · A pending section styles no class `src/` already styles.** This is the rule everything else
protects. Two stylesheets must never style the same class, so a name a drawing invents has to be
unclaimed on the day it is drawn. It caught a real violation on its first hand-run on 2026-08-09:
`.detail-hero .avatar { width: 44px }`, the shorter way to enlarge the hero's avatar and exactly the
thing the rule forbids. It is `.detail-avatar` now, a second class worn alongside `.avatar`.

Three things are outside the rule, and each is a decision rather than an oversight:

- **A class worn as shipped.** `.panel`, `.class-action-btn`, `.search-box`, `.pill`, `.avatar`,
  `.modal-*`, `.class-card*` are used and never restyled from a drawing, so they define no rule and
  the check never sees them.
- **A state word compound-qualified by the sheet's own class.** `.gl-row.warn` and
  `.screen-nav-btn.active` are the posture `src/attendance.css` takes with `.attendance-state.taken`.
  The check reads a class as *declared* only where it is the sole class of a compound, so a bare
  `.warn { }` in a drawing is a violation and `.gl-row.warn` is not.
- **The cross-cutting blocks** — the grouped `touch-action` selector at the top of the sheet, and
  `§ TOUCH` / `§ RESPONSIVE` at the bottom. They re-mention controls declared above and introduce no
  name of their own. § 19 allowlists them **by name**, so a round that invents a third one goes red
  and the fix is to name it in the check.

Once a section has landed, its names *are* in `src/` — that is what a lift looks like — and the check
flips to asking whether they landed in the stylesheet the banner promised.

**6 · No JavaScript, and no number that recomputes.** No `<script>`, no `on*=` handler, no
`javascript:` href. Nothing reads or writes a document. Every figure on the page is typed in by hand,
which is what makes a drawing arguable — a live number invites a reader to check the arithmetic
instead of the layout.

**7 · The black band, on every page.** `.mk-notice` across the top, above the app frame rather than
inside it, saying **DRAWINGS, NOT THE APP** and when the round was drawn. `mockup.css` is deliberately
ugly against the app's palette for the same reason: *"if a screenshot of one of these pages ever gets
mistaken for the running app, this file failed and should get louder."*

**8 · Never in `sw.js`'s precache.** These files are not part of the app. A drawing in `SHELL` is a
drawing installed on a teacher's iPad.

**9 · The phase file gets the pointer, in the same sitting.** A drawing nothing links to is a drawing
nobody building the screen will read, and the drawing does not get to be the thing that tells them:
WO-1.25's ruling is that **a drawing is not a work order** — its questions are answered in the phase
file or they are not answered. So a room is not finished until, in
[`../../plans/work-orders/`](../../plans/work-orders/README.md):

- The phase file carries a block naming the drawings and saying to read them before building.
- **Every work order the room draws for gains a `Surface` deliverable** naming what the drawing
  settles — the shape Phase 3 used (`phase-3-gradebook.md`, WO-3.3 · 3.5 · 3.7) and Phase 4 copied.
- **Every question that is the owner's gains an `Open` line in the work order it belongs to**, so it
  is answered by whoever cuts that row rather than by an implementer reading an amber note alone.

That last one is what makes the pointer worth having, and `tools/wo-brief.mjs` then does the rest for
free: it scans a work order for the files it references, so a drawing named in a `Surface` deliverable
appears in the dispatch brief's *Read these first* list without anyone adding it there. Check with
`node tools/wo-brief.mjs WO-x.y | head -80`. Since 2026-08-20 § 19 **fails a sweep** whose drawing names an unbuilt work order that does not
name a drawing back, so this rule is checked rather than remembered — it found WO-6.4 the hour it was
written, drawn twice since the 19th with no work order pointing at it. **This rule is the one the first two rounds did not
follow** — Phase 3's drawings got their `Surface` lines and Phase 6's got nothing, which is why
`proposed-phase6.css` § CALENDAR was re-derived by the very work order it was drawn for.

**10 · Annotate every guess, and never delete an answered one.** Amber where the drawing had to guess
and the guess was not the drawing's to make; green **DECIDED** when it has been answered, *in place* —
"a drawing that quietly absorbs a decision loses the record of there having been a choice." Every
question is also collected in [`README.md`](README.md), so it survives a reader who only looks at the
pictures.

---

## Follow the app's own stylesheet rules, so that "lift" means lift

The rules `src/shell.css`'s header sets, applied to `proposed*.css` from the first line:

- Colours written out inline, **never** as custom properties.
- **No dark mode.** Not here either.
- One grouped `touch-action` / `user-select` selector at the top, naming every tappable class the
  sheet adds.
- A `@media (pointer: coarse)` block at the **end**, naming every one of those controls again, at the
  44px floor — added in the same pass as the control, not afterwards.
- A departure from 44px is the owner's ruling, written out at its point of departure. The one that
  exists (the 28px month chip) **is not a precedent a drawing may cite.**

`wo-sweep.mjs` §§ 2, 3 and 6 already read this directory for the first three, because its `STYLE` set
includes `design/`. A drawing that invents a custom property fails the same check the app does.

---

## When the drawing lands

**Amend the banner** (rule 4) in the same sitting as the lift.

**If the build renamed the drawing's classes, say so in the same sitting.** This has happened once and
nothing recorded it: `proposed-phase6.css` § CALENDAR proposes twenty-eight `.cal-*` classes, and
WO-6.3 shipped `src/calendar-view.css` with twenty of its own under `.calendar-*`. **Not one of the
drawn names reached the file its banner promised** — the section was re-derived rather than lifted,
which is rule 2's failure at stylesheet scale, and the drawing still reads as though it were the
source. § 19 raises that as a REVIEW rather than a failure, because a rename can be right; what it
cannot be is silent.

**What the build declined to take stays drawn, and gets a note.** Four classes in § SCORE GRID and
seven in § STUDENT DETAIL exist in the drawing and in no stylesheet — the half of each drawing its
work order deliberately did not ship. That is a legitimate end state, and the reason § 19 counts
un-arrived classes rather than failing on them. A section where **nothing** arrived is the different
fact, and is the one it reports.

---

## Before you commit a drawing

```
node tools/wo-sweep.mjs        # § 19 is the mockup section — seven checks and one review
```

§ 19 asserts rules 3, 5, 6, 7, 8 and 9, plus one rule this file adds by having a contents page: **every
drawing is linked from `index.html`**, so a round cannot leave an orphan nobody opens.

Two things it cannot check, and they are the two that matter most:

- **Whether the annotations are honest.** A guess drawn without an amber note reads as a decision.
- **Whether the drawing is any good.** It goes to the owner, on the real tablet, over
  `node tools/serve-https.mjs` — `https://<lan-ip>:8443/design/mockups/`. Both rounds produced
  questions that only a thumb could answer, and both said so in the drawing rather than deciding it.

---

## What this protocol does not decide

**Whether a drawing needs a work order.** Both rounds landed outside the pipeline and the practice
survived it; `CLAUDE.md` says every change goes through a work order. The two have not been
reconciled, and this file is not the place to do it — it is the owner's call, and it should be made
against a real proposal rather than predicted here.

**What gets drawn next.** The answer is derived, not maintained: read the `⬜ NOT STARTED` rows in
[`../../plans/work-orders/README.md`](../../plans/work-orders/README.md) and ask which of them
proposes a surface with no counterpart in Roll Call!. Phase 4 was that answer on 2026-08-20 and was
drawn the same day — [`signals.html`](signals.html) and [`behavior.html`](behavior.html), the third
room, this file's first use.

**What is left after it is the whole of Phase 5:** the template editor with its field palette, the
send flow's audience picker, and contact history. That is the one with the most to lose from being
built unargued — the field palette is a disclosure control, and `CLAUDE.md` § Accommodations is the
standard it has to meet. The signal card in `signals.html` already holds Phase 5's door as a single
disabled control, deliberately and no further: what is behind it is that phase's decision, and a
drawing that filled it in would be pre-empting the room it is supposed to make arguable.
