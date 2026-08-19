# WO-1.25 — Phase 6 is cut against a model that is not there · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.25-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude Opus, on its own merits and not by fallback. The deciding signal is
that every deliverable here is work-order prose whose value is judgment — the review-date disclosure
call, the `rotating-schedule.md` trap that has to be written so a future implementer cannot
accidentally build the cycle model, and the 👤 marks that decide what a green harness is allowed to
close — which is three of the six Claude-column reasons at once, over the most sensitive data in the
app. The runner-up was Codex on the argument that nine of the ten Acceptance lines are mechanically
checkable by `wo-gate.mjs`; set aside because *checkable* is not *specified* — the spec for what the
new Phase 6 text should say does not exist outside this work order's own reasoning, and Codex would
be writing the sentences the rubric exists to keep it away from. Codex was not probed: it is not a
candidate for this row.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.25 — Phase 6 is cut against a model that is not there

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-19 · **Size** M · **Depends on** — · **Blocks** every Phase 6
work order; WO-6.1 should not be dispatched against the current cut
**Closes roadmap** Phase 1 → *(no box. Process, not app — a phase re-cut is not a promise the roadmap
makes. Booked 2026-08-19, owner-directed, out of a read-only audit of Phase 6.)*

**Why it exists.** Phase 6 was cut before any of it was built, which is correct, and then a
read-only audit on 2026-08-19 read its four work orders against the tree they will land in. Eleven
things came back. Two of them are the kind this directory exists to catch — **a work order that
invites the one model `plans/rotating-schedule.md` refuses**, and **a work order whose acceptance
cannot be verified until the work order after it exists.** The rest are filing: a deliverable on the
wrong work order, a roadmap fragment following it there, five acceptance lines that need hardware and
carry no 👤, and a home-screen line Phase 3 owed and never wrote.

**None of this is discovered by the tooling and that is not a gap in the tooling.** `wo-gate.mjs`
reads the header block; every finding here lives in a Deliverables table or an Acceptance line.
`--audit` passed clean against Phase 6 on the day of the audit and passes clean against it now.

**The four calls the owner made, 2026-08-19, and what each one settles.**

***A review date on the glance page is a count, not a name.*** *Three lines in the phase collide on
one fact:* `students[].supports.reviewDate` *sits inside the* `supports` *block. WO-6.1 wants review
dates surfaced ahead of time; WO-6.2 puts them on the calendar; and WO-6.4's fifth box says nothing
on that page displays* `supports` *data* **in presentation mode or out of it** *— so read literally,
the one deadline a teacher is legally obliged not to miss is the one deadline the 7:40am page may not
show her, while the month grid she has to go looking for may.* **The call is the launcher reading:**
*the glance page shows* `1 review coming up` *and the name is one tap away, on the surface she
deliberately opened. It discloses strictly less than the roster dot that has shipped since WO-1.7 —
which says that student has something on file — and it is the page's own grammar, since WO-6.4 is a
launcher and not a report. The calendar keeps the name, presentation-gated, because it is already a
surface a teacher opened on purpose.*

***Both authoring surfaces stay, and the rules move underneath them.*** *WO-6.1 authors all eight
kinds;* `src/days-off.js` *already authors two of them. Two doors to one field is not the WO-1.13
defect — the SIS importer and the roster editor have written the same student fields since WO-1.23,
under merge rules written down in* `docs/data-model.md`*.* **Two writers is.** *And today every rule
protecting* `doc.events` *lives in* `createFromForm()` *in* `src/days-off.js` *— a screen module: the
date must parse, an end date may not precede its start, a* `dropped` *event naming no class is
refused, and a range covering recorded meetings routes through* `openConfirm()` *rather than
committing.* `src/calendar.js` *enforces none of it —* `newEvent()` *will build a class-less*
`dropped` *and* `addEvent()` *will store it.* **So the second door inherits nothing unless the rules
move down into the model first**, *which is the WO-2.25 move: one mechanism lifted three times is one
mistake living in three places.*

***WO-6.2 keeps its cut and owes its boxes forward.*** *Three of its four Acceptance lines name a
calendar that WO-6.3 builds —* `src/calendar.js` *is the event model with no DOM in it, which WO-8.4's
own correction note establishes independently. The edge cannot be a* `Depends on`*: WO-6.3 already
depends on WO-6.2 and the pair would be a cycle the gate would call satisfied. It is what* `**Owes**`
*is for.* **A merge into WO-6.3 was the alternative and was not taken** *— it would move the
denominator, the § The files row and the phase count to fix a filing problem.*

***The ungraded count goes back to Phase 3, in Ship 2, next.*** *The standing obligation reads: the
home screen accretes, every phase adds its line rather than deferring it to Phase 6.* `src/home.js`
*appends* `.class-card-signals` *empty and names its owner in the file —* `WO-3.x — ungraded work` *—
and the string* `home screen` *appears in no Phase 3 work order. Phase 3 is 23 of 24 with only the
OAuth paperwork open, so it will close with the slot unfilled and WO-6.4 carrying the debt without a
marker.* **The owner's call is that it is worth real value before Ship 2 and it is buildable today:**
*WO-3.4 and WO-1.10 are both* `✅ DONE`*.* **Ship 2 was the right table for it and the concern raised
against that did not survive checking** *— WO-G2's* `Depends on` *is a curated explicit list, not
every row in the ship, and* [WO-3.25](phase-3-gradebook.md#wo-325--a-score-cell-takes-any-string-number-can-read-not-any-number-a-teacher-can-mean)
*is already a Phase 3 work order sitting in that table without gating the gate.*

**Deliverables**

*In [`phase-6-calendar-glance.md`](phase-6-calendar-glance.md) —*
- **WO-6.2 gets a `**Traps**` block against the schedule model**, naming
  [`../rotating-schedule.md`](../rotating-schedule.md) by path the way WO-2.3 does, plus an
  Acceptance line: a future weekday shows no per-class meeting state at all, and nothing in the phase
  stores or derives which classes are expected to meet. **This is the highest-value line in the work
  order.** `stateOf()` has four answers and only three are facts about the class — `NOT_TAKEN` is the
  did-I-forget state, safe on a home screen asking about today and a wall of amber on a month grid
  asking about twenty weekdays across five classes. The way to silence that wall is to know which
  classes were meant to meet, which is the cycle model that decision record designed and removed in
  one day. WO-2.50 is the precedent for the other fix: a quiet `off-term` modifier, not a schedule.
- **WO-6.2 gets `**Owes** WO-6.3`**, and its first, third and fourth Acceptance lines stay `- [ ]`
  with a bare `→ WO-6.3` marker and a quotation of the box carrying each. Only the second — that
  `events[]` holds no derived entry — can close on WO-6.2's own evidence.
- **Review dates move from WO-6.1 to WO-6.2**: the deliverable, the Acceptance line, and the
  `**Closes roadmap**` fragment with them. A `reviewDate` is derived and is not an `events[]` entry;
  it is a row in WO-6.2's own derived table and in `docs/data-model.md` § Events. Keep WO-6.1's
  stronger wording — no plan type visible, gone entirely in presentation mode — and delete WO-6.2's
  weaker restatement of it.
- **WO-6.4's fifth box is reworded to name what is actually forbidden** — plan type, accommodation
  detail, medical text, behavior-plan text — rather than `supports` data, and gains the
  count-not-name rule above. The current wording is mechanically checkable and the new one is not,
  which is the cost of the call; naming the four fields is what keeps it testable.
- **WO-6.3 gets the print surface it owes WO-8.4**: register the calendar's gate under its own
  `<body>` attribute through `registerPrintGate()`, with an `isOnScreen` predicate in the
  `src/detail.js` shape since the calendar is a view inside `<main>` rather than a dialog, and with
  the print **control** named differently from the gate — `src/print-gate.js`'s invariant, bought by
  the owner's own stuck-attribute bug. One acceptance line: no printout of a calendar month emits a
  review date or any other `supports` value, whatever presentation mode says. Without it a `Ctrl+P`
  on the calendar prints the ordinary page with the review chip on it, and WO-8.4 cannot backstop a
  surface that ships before it.
- **WO-6.1 gains the validation lift** — the four rules in `createFromForm()` move into
  `src/calendar.js` before a second authoring surface exists — and a line saying both surfaces stay.
- **WO-6.1 names the two fields it needs and cannot have**: the grades-due lead time, and whatever
  identifies a materialized series. Neither is in the eight-field record `newEvent()` writes out on
  purpose. A `seriesId` stores no rule and so does not touch the materialize decision; matching on
  title and kind is the alternative and it deletes the second *Faculty meeting* the teacher typed by
  hand. The lead time is a teacher's setting and belongs in the document, per § Signal thresholds'
  reasoning, not under `planbook_`. **The `docs/data-model.md` amendment is a deliverable of WO-6.1
  rather than a side effect of it** — WO-1.7's verifier failed once on a schema edit landing inside
  the commit whose acceptance line graded against it.
- **WO-6.1 says where a grades-due event warns.** If the surface is WO-6.4's *Deadlines closing in*,
  the box is re-homed with `**Owes**`; if it is a banner of its own, that is a deliverable.
- **👤 on the five Acceptance lines that need the device or the owner**: WO-6.3's iPad legibility line
  and its new coarse-pointer line; WO-6.4's *under a second on an iPad* and its *praise not buried*;
  and the review-chip presentation-mode line wherever it lands, on the WO-2.3 precedent that a
  palette read across a room is not a judgement a headless Chrome makes however green it measures.
  WO-6.2's *after using the calendar heavily* is restated as a deterministic script instead.
  Unmarked, `--tick` closes every one of them on a green harness.
- **WO-6.3 gets a 👤 line for the 44px floor.** The standing obligation is a coarse-pointer minimum
  for every new control; a month cell holding four chips at that floor is a month needing two
  screens, and `src/home.css` already makes the cell-the-target call for `.class-card-state`. The
  line does not decide the departure — it puts it under a thumb before WO-6.3 commits, the way the
  score cell's input type went before WO-3.5.
- **WO-6.1 gets a note that most of its first deliverable is built.** WO-2.3 shipped the eight-field
  record, `endDate` on every event, ranges as one entry, the empty-`classIds` rule, and the stable
  two-event overlap answer; `docs/data-model.md` already names all eight kinds. What is left is six
  rows in the `KINDS` table, the authoring surface, a writer for `studentId`, the two fields above
  and the recurrence. Unsaid, its `M` reads as eight fields of new model.
- **WO-6.4 says whether the glance page is `#homeView` or a sixth view.** WO-1.10 says the home
  screen becomes it; `src/views.js` reserves one line for Phase 6 and calls it the calendar. The
  answer decides whether `DEFAULT_VIEW` and `REMEMBERED_AS` are in scope or `VIEWS` and `SCREENS`
  are.

*Outside it —*
- **WO-3.26 booked** in [`phase-3-gradebook.md`](phase-3-gradebook.md): the ungraded count in
  `.class-card-signals`, `**Ship** 2`, and **it closes no roadmap box** — ROADMAP § Phase 3 is 10 of
  10 and every box is claimed, so it takes WO-3.18's form, with no quotation marks anywhere on the
  line. A row in § Ship 2 ahead of WO-3.18 and WO-G2. WO-6.4 gains it as a real `Depends on` in place
  of a silent assumption.
- **WO-1.7's `**Out of scope**` line re-aimed** from WO-6.1 to wherever the review-date deliverable
  lands.
- **§ The files rows and § Dashboard rows** updated for both new work orders. **The README dashboard
  is only rewritten by `--tick`** — `recomputeDashboard()` is called from nowhere else — and
  `--audit` checks ROADMAP's dashboard rather than this one, so a stale row here is caught by
  nothing. Hand it to what the tool would compute and re-run both checks.

**Acceptance**
- [ ] `node tools/wo-gate.mjs --audit` passes, and `--self-check` passes.
- [ ] Every `**Closes roadmap**` fragment in Phase 6 still matches exactly one box, with the IEP/504
      fragment now under the work order that renders it and gone from WO-6.1.
- [ ] `node tools/wo-gate.mjs WO-6.2` reports `**Owes** WO-6.3`, and `--audit` resolves all three
      pointers onto boxes still `[ ]` under WO-6.3.
- [ ] No work order in Phase 6 requires knowing which classes are scheduled to meet on a date, and
      WO-6.2 says so in a `**Traps**` block naming `plans/rotating-schedule.md`.
- [ ] Five Acceptance lines in Phase 6 carry 👤, and no line naming an iPad, a thumb, or a projected
      screen is without one.
- [ ] WO-6.3 names a `<body>` print attribute that is not also a click hook, and no Phase 6 surface
      can print a `supports` value.
- [ ] WO-3.26 exists at `**Ship** 2`, closes no roadmap box, and has a § Ship 2 row ahead of WO-3.18.
- [ ] `node tools/wo-gate.mjs WO-6.4` reports WO-3.26 among its dependencies.
- [ ] The § Dashboard and § The files rows account for WO-1.25 and WO-3.26, and the dashboard's
      numbers match what `recomputeDashboard()` would write.

**Not in scope, and each is a decision rather than an omission.**
- **No Phase 6 code.** This work order edits `plans/` and nothing else. WO-6.1 is the first build and
  it should be dispatched against the re-cut rather than alongside it.
- **The `docs/data-model.md` amendment is named here and written by WO-6.1**, where its acceptance
  can grade against it — not here, where nothing would.
- **The design drawings are not promoted.** `design/mockups/calendar.html` and `glance.html` landed
  on 2026-08-19 in `fa723a9` and carry nine open questions of their own. Several of this work order's
  findings are corroborated there and two — the 44px chips and the review-date collision — were found
  independently by both. **A drawing is not a work order**; the questions it raises are answered in
  the phase file or they are not answered.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/calendar.html`
  - `docs/data-model.md`
  - `plans/rotating-schedule.md`
  - `src/calendar.js`
  - `src/days-off.js`
  - `src/detail.js`
  - `src/home.css`
  - `src/home.js`
  - `src/print-gate.js`
  - `src/views.js`
  - `tools/wo-gate.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

### Also open these, and read them before you write a word of Phase 6

- **`plans/work-orders/phase-6-calendar-glance.md`** — the file you are re-cutting. Read all four
  work orders end to end first. Nine of the ten Acceptance lines below grade this file.
- **`plans/rotating-schedule.md`** — the decision record behind the highest-value line in this work
  order. WO-2.3's `**Traps**` block is the model for how to name it by path; copy that shape.
- **`plans/work-orders/README.md`** — § The files, § Dashboard, and § Ship 2 all take edits, plus
  § "A re-homed Acceptance line stays `- [ ]`" which governs the `**Owes** WO-6.3` move.
- **`plans/work-orders/phase-3-gradebook.md`** — WO-3.18 is the form WO-3.26 copies (a work order
  closing no roadmap box), and WO-3.25 is the precedent for a Phase 3 row sitting in § Ship 2.
- **`design/mockups/calendar.html` and `design/mockups/glance.html`** — landed 2026-08-19 in
  `fa723a9`. Read them for corroboration only. **A drawing is not a work order**: the Out of scope
  line forbids promoting their nine open questions, and two of this work order's findings were
  reached independently of them.
- **`src/print-gate.js`** and **`src/detail.js`** — read enough of `registerPrintGate()` and the
  `isOnScreen` predicate shape to describe WO-6.3's obligation accurately. You are writing a work
  order about this code, not changing it.

### Two things about the shape of this dispatch

1. **You edit `plans/` and nothing else.** No `src/`, no `index.html`, no `docs/`. The
   `docs/data-model.md` amendment is explicitly named as WO-6.1's deliverable and writing it here
   fails the Out of scope line.
2. **The working tree is already dirty with this work order's own authoring** — WO-1.25's text in
   `phase-1-shell-store-roster.md` and two README rows were written by the owner before dispatch and
   are uncommitted. That is expected, not an interrupted run. Do not revert it; build on it.

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

**This work order ships no code**, so the two standing harnesses are regression guards here rather
than evidence: run both, expect them unchanged, and report them as such. The commands that actually
grade this dispatch are `node tools/wo-gate.mjs --audit`, `--self-check`, and the per-work-order
reports `node tools/wo-gate.mjs WO-6.2` / `WO-6.4` named in the Acceptance list. If
`verify-shell.mjs` cannot run in your sandbox, say "could not run" plainly — that is an environment
report, not a result, and it is re-run locally.

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 9 lines, reported against one by one

1. `node tools/wo-gate.mjs --audit` passes, and `--self-check` passes.
2. Every `**Closes roadmap**` fragment in Phase 6 still matches exactly one box, with the IEP/504 fragment now under the work order that renders it and gone from WO-6.1.
3. `node tools/wo-gate.mjs WO-6.2` reports `**Owes** WO-6.3`, and `--audit` resolves all three pointers onto boxes still `[ ]` under WO-6.3.
4. No work order in Phase 6 requires knowing which classes are scheduled to meet on a date, and WO-6.2 says so in a `**Traps**` block naming `plans/rotating-schedule.md`.
5. Five Acceptance lines in Phase 6 carry 👤, and no line naming an iPad, a thumb, or a projected screen is without one.
6. WO-6.3 names a `<body>` print attribute that is not also a click hook, and no Phase 6 surface can print a `supports` value.
7. WO-3.26 exists at `**Ship** 2`, closes no roadmap box, and has a § Ship 2 row ahead of WO-3.18.
8. `node tools/wo-gate.mjs WO-6.4` reports WO-3.26 among its dependencies.
9. The § Dashboard and § The files rows account for WO-1.25 and WO-3.26, and the dashboard's numbers match what `recomputeDashboard()` would write.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

