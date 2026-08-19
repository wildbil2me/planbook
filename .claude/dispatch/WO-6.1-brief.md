# WO-6.1 — Event model & authoring · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-6-calendar-glance.md`
**Report to** `.claude/dispatch/WO-6.1-result.md` — as your last act, and return it in-band too.

**Routing decision.** This went to **Claude, Opus** — it is the first row of Phase 6 and establishes
the event-authoring conventions WO-6.2, WO-6.3 and WO-6.4 all copy, which is a Claude trigger on its
own, and its Deliverables carry two judgment traps a clean-code optimizer reliably undoes: a
recurrence must **materialize** into N flat entries rather than store a rule, and nothing in this
phase may learn which classes are *expected* to meet on a date. It also amends `docs/data-model.md`,
which is prose. The runner-up I set aside: the validation lift out of `src/days-off.js` and down into
`src/calendar.js` is a mechanically-checkable refactor against rules that already exist and reads
Codex-shaped in isolation — but it is one deliverable of six, and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-6.1 — Event model & authoring

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-19 · **Size** M · **Depends on** WO-2.3 · **Owes** WO-6.4
**Closes roadmap** Phase 6 → "Event model: date or range, title, kind, optional class and student.",
"Grades-due deadlines", "Recurring events by materializing instances."
*(the first fragment stopped at the two words `Event model` until 2026-08-08, WO-2.15 — under twelve
characters once normalised, which the matcher refuses as too short to be safe. Anything in double
quotes on this line is read as a fragment, so a note about one is written in backticks. The fourth
fragment — the `IEP/504 review dates` box — went to WO-6.2 on 2026-08-19, WO-1.25, with the
deliverable and the acceptance line that belong to it: a `reviewDate` is **derived** and is not an
`events[]` entry, so the work order that computes it is the one that closes it.)*

**Why it exists.** WO-2.3 built the `no-school` and `dropped` kinds because attendance needed them.
This completes the model with the kinds a teacher types in for their own sake — and with the date
kind that carries a real consequence if missed.

**Most of the first deliverable is already built, and the `M` is not eight fields of new model**
*(2026-08-19, WO-1.25)*. WO-2.3 shipped the eight-field record in `src/calendar.js`'s `newEvent()`,
`endDate` written on every event, a range as one entry rather than one per day, the empty-`classIds`
rule, and a stable answer when two events cover one date; `docs/data-model.md` § Events already names
all eight kinds. **What is actually left** is six rows in the `KINDS` table, the authoring surface for
them, the first writer of `studentId`, the two fields named below that the record does not have, the
recurrence, and the validation lift. Read the size against that list.

**Deliverables**
- Full `events[]` per the data model: `{ id, date, endDate, kind, title, classIds, studentId,
  notes }`, kinds `no-school | dropped | early-release | grades-due | conference | meeting | trip |
  reminder`. Six of the eight kinds are new; the record is not.
- **The validation moves down into the model before a second door opens onto it.** Every rule
  protecting `doc.events` today lives in `createFromForm()` in `src/days-off.js`, which is a screen
  module: the date must parse, an end date may not precede its start, a `dropped` event naming no
  class is refused, and a range covering recorded meetings routes through that file's `openConfirm()`
  rather than committing. `src/calendar.js` enforces none of it — `newEvent()` will build a class-less
  `dropped` and `addEvent()` will store it. Move the four rules into `src/calendar.js` and have the
  days-off form call them, **before** this work order's authoring UI becomes the second caller. That
  is the WO-2.25 move: one mechanism lifted twice is one mistake living in two places.
- **Both authoring surfaces stay.** `src/days-off.js` keeps its own screen and this work order adds
  the general one. Two doors onto one field is not WO-1.13's redundant selector — the SIS importer
  and the roster editor have written the same student fields since WO-1.23, under merge rules written
  down in `docs/data-model.md`. **Two writers would be**, which is what the bullet above prevents:
  `commit()` in `src/days-off.js` stays the one place a day off is written, and the rules it enforces
  stop being its own.
- Authoring UI for all kinds, with ranges.
- **Grades-due as a first-class kind with a lead-time warning.** Re-keying into the SIS is a
  scheduled job, not something you remember. **Where it warns is WO-6.4's *Deadlines closing in*, not
  a banner of this work order's own** *(the open question WO-1.25 named, answered here 2026-08-19)* —
  the glance page is the 7:40am surface and a lead time is exactly the kind of item it exists to
  raise, and a second warning surface for one fact is the second answer this repo keeps refusing. The
  cost is real and is stated rather than hidden: the acceptance line for the warning is re-homed
  below and cannot close on this work order's own evidence.
- **Two fields this work order needs and the record does not have.** Neither is in `newEvent()`'s
  eight, and both were left out on purpose rather than by oversight:
  - **the grades-due lead time** — a teacher's setting, so it belongs in the document beside the rest
    of her settings, on the reasoning `docs/data-model.md` § Signal thresholds gives, and **not**
    under `planbook_`, which is UI preferences only.
  - **whatever identifies a materialized series**, so that "delete the whole series" is possible. A
    `seriesId` stores no recurrence rule and so does not reopen the materialize decision — it is a
    label on instances that already exist. The alternative is matching on title and kind, and that
    one deletes the second *Faculty meeting* the teacher typed by hand.
- **The `docs/data-model.md` amendment is a deliverable of this work order**, written here and graded
  by the acceptance line below. It was named by WO-1.25 and deliberately not written there: WO-1.7's
  verifier failed once on a schema edit that landed inside the commit whose acceptance line graded
  against it.
- **Recurring events materialize** into individual entries ("repeat weekly until 2026-12-19")
  rather than storing a recurrence rule. Flat, hand-editable, and one instance can move without
  reasoning about exceptions. *RRULE is V2, if ever.*

**Acceptance**
- [ ] Every event kind can be created, edited, and deleted, with and without a range.
- [ ] A weekly recurrence produces N independent entries; moving one moves only that one.
- [ ] Deleting a materialized series is possible without deleting each instance by hand.
- [ ] The four rules refuse from the model rather than from a form: a `dropped` event naming no class,
      an end date before its start, and an unparseable date are each refused when built through
      `src/calendar.js` directly, with no screen module in the call stack.
- [ ] `docs/data-model.md` § Events names the lead-time field and the series identifier, and the
      record it documents is field-for-field the record `newEvent()` writes.
- [ ] A grades-due event warns at its configured lead time.
      → WO-6.4 "A grades-due event appears under Deadlines closing in on every day inside its lead
      time, and taps through to the event"
- [ ] `no-school` and `dropped` behave exactly as WO-2.3 established — no regression.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/calendar.js`
  - `src/days-off.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these before you write:

- **`plans/work-orders/phase-6-calendar-glance.md` in full, not just your own section.** The three
  rules in the phase header govern every row in the phase, and one of them binds you directly:
  *nothing in this phase may learn which classes are expected to meet on a date.* WO-6.2's `**Traps**`
  block carries the whole argument — read it even though it is not your work order, because the
  temptation arrives from the rendering side and will look new when it does.
- **`plans/rotating-schedule.md`** — the settled decision record behind that rule. A cycle model was
  designed and removed on the same day. Do not rebuild it, in any form, including a "just for
  recurrence" weekday pattern that happens to know a class meets on Tuesdays.
- **`src/calendar.js` in full** (192 lines) — this is the module you are extending. Note what already
  exists: the eight-field `newEvent()`, `addEvent()`, `removeEvent()`, `findEvent()`, `coversDate()`,
  `coversClass()`, `coveringEvent()`, `exceptionsIn()`, the `KINDS` table, and the header comment
  about `classIds` being the difference between the two kinds of event. **The record is not new. Six
  rows of `KINDS` are.**
- **`src/days-off.js` in full** (587 lines) — specifically `createFromForm()`, `commit()` and
  `openConfirm()`. The four validation rules you are moving down into the model live in
  `createFromForm()` today. After your change `src/days-off.js` must **call** those rules rather than
  restate them, and `commit()` stays the one place a day off is written. Do not delete the days-off
  screen and do not fold it into your new authoring surface — the work order says both doors stay.
- **A sibling authoring surface to match rather than invent.** Your general event-authoring UI is a
  new surface, so lift its shape from what this repo already does for a form rather than designing
  one: read `src/days-off.js`'s form markup and `index.html` around it, and follow the same
  structure, spacing and control sizing. Roll Call!'s `design/portable-components.md` (under
  `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\design\`) is the source for a
  modal pattern this repo has not built yet — copy, do not re-derive (`CLAUDE.md` § "Lift the design
  with the function").
- **`src/views.js` and `src/screen-nav.js`** — read the header of `src/views.js` before you add
  anything. **WO-6.3 owns the sixth view (`calendar`), not you.** If your authoring surface needs a
  home, it is a modal or it hangs off the existing days-off screen — adding a `VIEWS` entry here
  takes a decision that belongs to the next work order.
- **`docs/data-model.md` § Events and § Signal thresholds.** § Events already names all eight kinds;
  your amendment adds the **lead-time field** and the **series identifier**, and the acceptance line
  grades that the documented record is field-for-field the record `newEvent()` writes. § Signal
  thresholds carries the reasoning for why a teacher's setting lives in the document rather than
  under `planbook_` — the lead time follows it.

Two things about scope, stated so you do not have to guess:

- **The lead-time *warning surface* is not yours.** The grades-due lead time is a stored setting you
  add and validate here; where it is *shown* is WO-6.4's *Deadlines closing in* panel. Do not build a
  banner, a toast, or a home-screen chip for it. The acceptance line for the warning is re-homed to
  WO-6.4 and **must stay `- [ ]`** with its `-> WO-6.4 ...` pointer intact.
- **`sw.js`.** If you add a file to `SHELL`, or change any file already in it — `index.html` counts,
  since `./` is entry one — bump `CACHE`. Its current value is `v83`.

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

1. Every event kind can be created, edited, and deleted, with and without a range.
2. A weekly recurrence produces N independent entries; moving one moves only that one.
3. Deleting a materialized series is possible without deleting each instance by hand.
4. The four rules refuse from the model rather than from a form: a `dropped` event naming no class, an end date before its start, and an unparseable date are each refused when built through `src/calendar.js` directly, with no screen module in the call stack.
5. `docs/data-model.md` § Events names the lead-time field and the series identifier, and the record it documents is field-for-field the record `newEvent()` writes.
6. A grades-due event warns at its configured lead time. → WO-6.4 "A grades-due event appears under Deadlines closing in on every day inside its lead time, and taps through to the event"
7. `no-school` and `dropped` behave exactly as WO-2.3 established — no regression.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

