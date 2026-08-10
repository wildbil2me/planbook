# WO-3.17 — the Assigned and Due fields · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.17-result.md` — as your last act, and return it in-band too.

**Routing decision.** This routed to **Claude at Opus tier on its own merits**, not by fallback. The
deciding signal is `ROUTING.md`'s teacher-facing-prose rule: deliverable four rewrites the bold hint
at `index.html:806` that currently promises "Neither date fills itself in," and it has to come out
true, in suite voice, with the no-timetable reasoning intact — that is not a mechanical edit. The
runner-up consideration I set aside is that part one is unusually well-specified for a Codex row (the
work order names the exact CSS reset to try and the exact mechanism behind it), but it ships in the
same dialog and the same commit as the prose, and this work order's traps are judgment traps rather
than arithmetic: don't tune a width, don't absorb the app-wide squatness fix that is booked
elsewhere, and don't let part two hide part one.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.17 — the Assigned and Due fields

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-10 · **Size** S · **Depends on** WO-3.3 · **Blocks** nothing
**Closes roadmap** *(no box.)*

**Booked 2026-08-10 from the owner's iPad sitting.** Two separate complaints about the same pair of
controls in the assignment editor, kept in one work order because they are one dialog, one file and one
testing sitting on the hardware.

**Part one — they overlap and push off screen on the iPad.** Owner-observed on the device; not
reproduced at the desk, which is the point. `.assign-field` already carries `min-width: 0` and
`flex: 1 1 140px` (`src/assignments.css:216-218`), so the usual flex culprit is pre-empted and the
likelier mechanism is **iOS Safari giving `<input type="date">` an intrinsic width it refuses to shrink
below**, inside a 480px `.modal-panel`, with the coarse block's `min-height: 44px` and larger font
making it worse rather than better. **Diagnose it on the hardware before changing a number** — a width
tuned until it looks right at the desk is how this comes back.

**Diagnosed on the hardware, 2026-08-10, and the guess above is right in outline and wrong where it
matters.** Owner's screenshots in both orientations with the fields empty, plus a comparison pass over
the app's two other date-field screens.

- **Not an orientation bug.** `.modal-panel` is 480px in both orientations (`index.html:988`), and
  portrait and landscape fail identically.
- **Three symptoms, one cause.** The fields are about half the height of *Name* and *Points* despite
  sharing their rule at `src/assignments.css:269`; they overlap instead of sitting in the row's 12px
  coarse gap; and *Due* is clipped by the panel edge. **iOS Safari paints `<input type="date">` as a
  native control**: the flex layout shrinks the element's *box* — so `min-width: 0` is working — while
  the native widget paints at its own intrinsic size regardless. Layout and paint disagree, and every
  symptom falls out of that one fact, including the ignored `min-height`.
- **`-webkit-appearance: none` does not exist anywhere in this codebase.** Grepped `src/` for it, for
  `appearance:`, and for any `input[type=…]` selector: zero matches for all three. Nothing has ever
  told WebKit to stop drawing these natively.
- **Why this screen and not the other two, confirmed rather than assumed.** The term editor and the
  days-off form both wear `.term-date` (`src/shell.css:684`), which sets **no width**, in a
  `flex-wrap: wrap` row of content-sized items — the widget's intrinsic width *is* its layout width,
  so nothing is forced and nothing overlaps. `.assign-field-date` is **the only date input in the app
  given `width: 100%`** (`src/assignments.css:222`), inside `flex: 1 1 140px; min-width: 0`. A 140px
  basis in a 480px panel shrinks the pair to roughly 210px each and never triggers the wrap, so this
  is the one place the box is forced narrower than the widget draws.

**So the first thing to try is the reset, not a width.** `-webkit-appearance: none; appearance: none`
on `.assign-field-date`, then re-open on the device. Predicted: the 44px lands, the gap appears, the
clipping goes, and no number is tuned. If that is not it, the fallback is a larger flex-basis so the
row wraps to two lines the way `.term-dates` does — but that is the second answer and it is the one
the paragraph above warns about.

**The squatness is not this work order's.** The owner reports the date fields on *Classes & terms* and
on *Days off & drops* are equally short — both carry `min-height: 44px` in their own coarse blocks
(`src/shell.css:1208`) and neither takes it. That is an app-wide touch-target failure on three
shipped screens, it is one shared fix rather than one dialog's, and it is booked separately. **What
belongs here is the overlap**, which is this dialog's alone.

**A testing-order trap this work order creates for itself.** Part two makes both dates default to
today, so once it lands a newly created assignment never shows the empty state the owner photographed.
**Prove part one against empty fields**, independently of part two, or the fix will look done because
the symptom moved out of the default path and into the one a teacher reaches by clearing a date.

**Part two — both dates should offer today.** Today is the overwhelmingly common value for *Assigned*
and a reasonable start for *Due*, and typing it on an iPad picker costs more than it should.

**The rule this part contradicts, which the owner has overruled.** `index.html:806` tells the teacher in
bold that **"Neither date fills itself in,"** and gives a reason: Planbook has no timetable and is not
getting one, so there is no "next meeting" to guess at. That reason survives — **this is not a guess at
a schedule, it is today's date, which is a fact.** But the sentence is now false and it is load-bearing
prose in the hint the teacher reads. **Update it in the same commit**; a UI that contradicts its own
printed promise is worse than either behaviour alone. Say what the app does now and keep the timetable
half, which is still true and still worth saying.

**Deliverables**
- The two fields sized so that **both are fully visible and neither overlaps the other or the panel
  edge** on the iPad in both orientations, with the fix made against the real mechanism.
- Both dates **default to today on a newly created assignment**, editable to anything, and **empty stays
  a legal value** — a date is not required and clearing one must not re-fill it.
- **An assignment being edited is never touched.** The default is a creation-time default; opening an
  existing assignment with a blank *Due* leaves it blank.
- The hint at `index.html:806` rewritten to match, keeping its no-timetable reasoning.

**Out of scope** — a due-date suggestion of any kind beyond today. That is WO-3.6's territory and it is
the thing the no-timetable rule actually forbids.

**Acceptance**
- [ ] A newly created assignment opens with both dates on today's date, formatted as the field expects.
- [ ] Clearing either date and committing stores it empty, and reopening shows it empty.
- [ ] Editing an existing assignment with a blank date shows blank, not today.
- [ ] The hint text no longer says the dates do not fill themselves in, and still says why there is no
      next-meeting guess.
- [ ] Both fields measure ≥44px under the coarse pointer and neither exceeds the panel width at the
      narrowest supported width.
- [ ] 👤 On the iPad, portrait and landscape: both fields fully visible, no overlap, nothing off screen.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/assignments.css`
  - `src/shell.css`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these — the work order names line numbers but not every file that has to change:

- **`src/assignments.js`** — the dialog this work order is about. `.assign-field-date` is built at
  roughly line 643; the field rows at 674–685; a second field-builder path exists near 968–1016 (the
  **copy** dialog, `index.html:1456`). Decide deliberately whether the today-default belongs to both
  creation paths or only the new-assignment one, and say which you chose and why. A default that
  silently rewrites dates on a copied assignment would violate deliverable three in spirit.
- **`index.html`** — the hint at line 806 (deliverable four) and the `.modal-panel` width at line 988
  that the diagnosis leans on.
- **`src/shell.css:684`** (`.term-date`) and **`src/shell.css:1208`** — read these to understand
  *why* the other two date screens do not fail, and then **leave them alone**. The squatness on those
  screens is booked as a separate app-wide work order and is explicitly not yours.
- **`plans/work-orders/phase-3-gradebook.md` § WO-3.3** — the work order this depends on, for the
  conventions the assignment editor already established.

Three things to hold onto while you work:

1. **Try the reset first.** `-webkit-appearance: none; appearance: none` on `.assign-field-date` is
   the work order's stated first move, and it predicts that no number needs tuning. If you end up
   changing a width or a flex-basis anyway, that is the *second* answer and you must say in your
   report why the first one was not enough — a width tuned at the desk is the failure this work order
   names by name.
2. **The 👤 line stays `- [ ]`.** You do not have an iPad. Line 5 is the desk-side measurement you
   *can* make with `verify-shell.mjs`; line 6 is the hardware confirmation you cannot. Do not blur
   them together.
3. **Part one must be provable against empty fields.** Part two removes the empty default state from
   the normal path. Whatever check you add for line 5 has to exercise the fields *empty*, or it will
   pass for the wrong reason once part two lands.

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

1. A newly created assignment opens with both dates on today's date, formatted as the field expects.
2. Clearing either date and committing stores it empty, and reopening shows it empty.
3. Editing an existing assignment with a blank date shows blank, not today.
4. The hint text no longer says the dates do not fill themselves in, and still says why there is no next-meeting guess.
5. Both fields measure ≥44px under the coarse pointer and neither exceeds the panel width at the narrowest supported width.
6. 👤 On the iPad, portrait and landscape: both fields fully visible, no overlap, nothing off screen.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

