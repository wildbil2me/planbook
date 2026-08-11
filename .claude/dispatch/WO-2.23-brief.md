# WO-2.23 — every date field in the app is short of 44px on the iPad · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.23-result.md` — as your last act, and return it in-band too.

**Routing decision** — **Claude, at Opus, on this work order's own merits** (not a Codex fallback;
no probe was run because the rubric never sent it there). The deciding signal is Deliverable 2:
there is no shared input reset in this app and no CSS-custom-property convention to hang one on, so
choosing one-place-versus-per-sheet **establishes a convention** that every future `appearance` reset
copies, and the work order asks for the reasoning to be written *at the rule* — that plus a
`TESTING.md` prose note about why both harnesses are blind here is two Claude triggers. The runner-up
I set aside: size `S` and "one line missing from the whole codebase" reads mechanically enough for
Codex, but the Traps are pure judgment — don't book a check that cannot fail, don't trade the native
picker for pixels, don't touch WO-3.17's overlap — and a run that quietly wins the pixels by removing
the picker is exactly the asymmetric cost that sends ties to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.23 — every date field in the app is short of 44px on the iPad

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-10 · **Size** S · **Depends on** nothing · **Blocks** nothing
**Closes roadmap** *(no box. A defect in three shipped screens, found on the device after all three
closed.)*

**Booked 2026-08-10 from the owner's iPad sitting for WO-3.17**, which was looking at one dialog and
found the same thing on every other screen that has a date on it. *(This work order depends on nothing
and can be picked up cold. It is placed immediately after WO-3.17 in the running order because that
one proves the same mechanism on the hardware and the two close in a single sitting — which is a
scheduling argument, not a dependency, and the `**Depends on**` field says so by saying nothing. The
first draft of this line named WO-3.17 as an aside and `wo-gate.mjs` correctly refused it, which is
WO-2.16's rule doing its job.)*

**Why it exists.** Three screens put an `<input type="date">` in front of the teacher — the assignment
editor's *Assigned* and *Due* (`.assign-field-date`, `src/assignments.js:643`), the term editor's
*Starts* and *Ends*, and the days-off form's *From* and *To* (both `.term-date`, `src/classes.js:1046`
and `src/shell.css:843`). **All six are visibly about half the height of the text fields beside them,
and all six are declared 44px**: `src/assignments.css:269` and `src/shell.css:1208` each name their
date class in a `@media (pointer: coarse)` rule with `min-height: 44px`. The rules are right. The
control ignores them.

**The cause, and it is one line missing from the whole codebase.** iOS Safari paints
`<input type="date">` as a **native control**, and while its native appearance is in force the
author's box model is advisory — which is why `min-height` does nothing here and does everything on
the text field 10px away. `-webkit-appearance: none` is the switch that hands the box back, and
`src/` was grepped for it, for `appearance:`, and for any `input[type=…]` selector at all: **zero
matches for all three.** Nothing in this app has ever told WebKit to stop drawing these natively.

**Neither harness can see this, and that is not a gap either of them should be asked to close.** The
44px sweep skips anything computing to `display: none`, and all six fields live behind `.hidden`
dialogs, so none has ever been measured — but the more important half is that **measuring them would
not help**: desktop Chrome under an emulated coarse pointer honours `min-height` on a date input and
would report a compliant 44px on the broken tree. This is device-only. WO-2.21 does not close it and
must not be read as closing it.

**Deliverables**
- **Every `<input type="date">` in the app renders at the declared 44px floor under a coarse
  pointer**, on the device.
- **The reset lives in one place rather than being pasted into two sheets** — or the work order says
  in a sentence why per-sheet was the better answer here. There is no shared input reset in this app
  today and no CSS custom properties by convention, so this is a real design question with two
  defensible answers; **pick one deliberately and write the reasoning at the rule.**
- **A note in `TESTING.md` recording that this class of defect is invisible to both harnesses and
  why**, so the next reader does not book a check that would have gone green on the broken tree.

**Out of scope** — restyling the date fields beyond what the reset costs, any change to how dates are
stored or parsed, and the assignment dialog's *overlap*, which is WO-3.17's and has a different cause
(that dialog is the only place a date input is given `width: 100%` inside a shrinking flex parent).

**Acceptance**
- [ ] The reset is applied to every date input in the app, in one place or with the per-sheet choice
      argued at the rule.
- [ ] 👤 On the iPad, portrait and landscape: the assignment editor's *Assigned* and *Due*, the term
      editor's *Starts* and *Ends*, and the days-off *From* and *To* are all full-height tappable
      fields rather than squat ones.
- [ ] 👤 **The iPadOS date picker still opens from all six**, and a date picked in it still lands in
      the field. This is the thing the reset could plausibly break.
- [ ] 👤 An empty date field still reads as a field on the device — iOS draws no placeholder in it,
      so "empty" and "not there" are a real pair to tell apart, and empty is a legal value everywhere.
- [ ] 👤 Days off: the dates still clear after a successful add. `src/days-off.js` discards and
      rebuilds the element to beat the picker's retained selection (WO-2.3's scar, reported off the
      hardware on 2026-08-08), and the reset must leave that working.
- [ ] A date field is never allowed to collapse to its tap-target floor: `.term-date` carries
      `min-width: 44px` in the coarse block, and with the native intrinsic width gone the field still
      has to be wide enough to show a whole date.
- [ ] `node tools/verify-shell.mjs` passes whole, and `node tools/wo-sweep.mjs` prints what it printed
      before.

**Traps** — **Do not book a harness check for this.** Chrome under an emulated coarse pointer honours
`min-height` on a date input, so a check written for this defect goes green on the tree that has it —
and a check that cannot fail is worse than no check, because it tells the next reader the rule is
guarded. Record the limit instead. **Do not take the native picker away to win the pixels.** Both
`src/assignments.js:644` and `src/days-off.js` state, in comments, that these are real date inputs
specifically so iPadOS gives the teacher its own picker rather than a text field she types an ISO
string into; if the reset costs the picker on this iPadOS, **stop and report it** rather than shipping
the typed string those comments refuse. **And do not fix the assignment dialog's overlap here** — it
looks like the same bug and it is the same *cause* through a different door, WO-3.17 owns it, and two
work orders editing `.assign-field-date` in the same fortnight is how one of them gets reverted.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/assignments.css`
  - `src/assignments.js`
  - `src/classes.js`
  - `src/days-off.js`
  - `src/shell.css`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `index.html` — two of the date inputs are authored there directly (`#daysOffFrom`, `#daysOffTo` at
  `index.html:2056`/`2062`), and a third at `index.html:1779`. The other three are built in JS
  (`src/assignments.js:671`, `src/classes.js:1052`, `src/days-off.js:266`).
- `design/style-guide.md` §6 — the 44px rule this defect defeats.
- `TESTING.md` — read how existing notes about harness limits are worded before adding yours.

### Three things the work order text could not know, checked at dispatch time

**1. The work order's central premise — "zero matches for all three" — is now stale, and you must
reconcile it rather than trip over it.** WO-2.23 was booked on 2026-08-10 from the same iPad sitting
that produced WO-3.17, and **WO-3.17 landed first** (commit `14b1d7e`, yesterday's HEAD). It already
put the reset on one of the three classes:

```
src/assignments.css:257     .assign-field-date { -webkit-appearance: none; appearance: none; }
```

Read the ~28-line comment above it (`src/assignments.css:229–256`) in full before you touch anything.
It is the diagnosis this work order is built on, written by the run that proved it on the hardware,
and its last paragraph is addressed *to you*: it says the other two screens are "equally short on the
device," that this is "one app-wide failure across three screens," that it "is booked separately,"
and that copying the line onto `.term-date` **from inside WO-3.17** would have shipped an untested
change to two other dialogs. That is your work order, handed over deliberately. So: the reset is not
missing from the whole codebase any more — it exists in exactly one sheet, on one class, with the
reasoning already written at it. **That is the fact your Deliverable 2 design question now turns
on**, and it is a stronger question than the work order knew it was asking: a shared reset must
either supersede that line (and then say what happens to its comment) or sit beside it (and then
justify the duplication). Whichever you pick, the reader who arrives at `src/assignments.css:257`
must not be left confused about why there are two answers in the tree.

**2. There is a seventh date input, and the work order's own Deliverable puts it in scope while its
👤 list does not name it.** `.student-date` — `index.html:1779`, `#supportsReviewDate`, the
accommodation *review date* on the student editor — is an `<input type="date">` with the identical
defect: `src/shell.css:1335` declares `min-height: 44px; min-width: 44px` in the coarse block, and
`src/shell.css:1323–1327`'s comment has *already written the diagnosis* ("a `<select>` and an
`<input type=date>` are drawn by the browser, and neither inherits a height from the box it sits
in") without the reset ever following. Deliverable 1 says **every** `<input type="date">` in the app;
Acceptance line 1 says **every** date input in the app. Include it. Two things about how:

- **This is styling on a sensitive surface, and the line between them is the whole point.** The
  student editor holds accommodation, medical and plan data. Making its date field the right height
  is not a change to that data, to who can see it, or to what any export or merge field emits — and
  it must stay that way. Touch the height/appearance of the control and nothing else in that screen.
- **Say it loudly in your result file.** The four 👤 lines name six fields on three screens and this
  is a seventh on a fourth screen, so the teacher will not know to look at it on the iPad unless you
  tell her to. Report it as an extra device check she should run, in the same breath as the six.

**3. `.term-date` is worn by two screens at once**, which is why Acceptance line 6 exists. The term
editor (`src/classes.js:1052`) and the days-off form (`index.html:2056`/`2062`) share the class, and
`src/assignments.css:241–245` explains what protects them today: `.term-date` sets **no width at
all** and sits in `flex-wrap: wrap` rows of content-sized items, so the native widget's intrinsic
width *is* its layout width. Removing the native appearance removes that intrinsic width. The
`min-width: 44px` already at `src/shell.css:1208` is a **tap-target floor, not a legible-date
width** — line 6 is asking you to make sure a date field never actually sits at 44px showing a
sliver of a date. Reason about what width it takes once the native sizing is gone, and if the answer
is that it needs a real minimum, that minimum is part of what the reset costs rather than the
restyling the Out of scope line forbids — say which it is, at the rule.

### And one instruction about what you cannot do

You have no iPad. Four Acceptance lines are 👤 and **all four are the ones that decide whether this
worked** — the reset either hands the box back or takes the picker with it, and only the hardware
says which. Never tick a 👤 line. Beyond that: your result file is what the teacher will hold in one
hand while holding the iPad in the other, so write the device checks as something runnable in a
single sitting, in the order she should tap them, naming the screen and the control each time. If
you have any reason to suspect the reset costs the picker on iPadOS, the work order says **stop and
report it** rather than shipping the typed ISO string that `src/assignments.js:644`,
`src/days-off.js:53` and `index.html:2022` all explicitly refuse.

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

## 5. Done means these 7 lines, reported against one by one

1. The reset is applied to every date input in the app, in one place or with the per-sheet choice argued at the rule.
2. 👤 On the iPad, portrait and landscape: the assignment editor's *Assigned* and *Due*, the term editor's *Starts* and *Ends*, and the days-off *From* and *To* are all full-height tappable fields rather than squat ones.
3. 👤 **The iPadOS date picker still opens from all six**, and a date picked in it still lands in the field. This is the thing the reset could plausibly break.
4. 👤 An empty date field still reads as a field on the device — iOS draws no placeholder in it, so "empty" and "not there" are a real pair to tell apart, and empty is a legal value everywhere.
5. 👤 Days off: the dates still clear after a successful add. `src/days-off.js` discards and rebuilds the element to beat the picker's retained selection (WO-2.3's scar, reported off the hardware on 2026-08-08), and the reset must leave that working.
6. A date field is never allowed to collapse to its tap-target floor: `.term-date` carries `min-width: 44px` in the coarse block, and with the native intrinsic width gone the field still has to be wide enough to show a whole date.
7. `node tools/verify-shell.mjs` passes whole, and `node tools/wo-sweep.mjs` prints what it printed before.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

