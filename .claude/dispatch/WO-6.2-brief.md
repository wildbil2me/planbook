# WO-6.2 — Derived events · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-6-calendar-glance.md`
**Report to** `.claude/dispatch/WO-6.2-result.md` — as your last act, and return it in-band too.

**Routing decision.** This went to **Claude at the Opus tier** because it surfaces IEP/504 review
dates on a calendar and must suppress them entirely in presentation mode — accommodations/plan data
*and* presentation mode, two of the surfaces `ROUTING.md` says are never delegated. The runner-up
consideration set aside: it is size `S`, a pure read-side module with no writer, over a schema that
is already settled in `docs/data-model.md`, which is the Codex shape almost exactly. It lost to the
sensitive surface and to a `Traps` section that is entirely judgment rather than mechanics — *do not
build the schedule model this grid will make look necessary* is precisely the kind of rule a model
optimizing for a tidy month grid will undo. No tier override was passed; Opus is the agent's own
default and it is the right one here.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-6.2 — Derived events

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-19 · **Size** S · **Depends on** WO-6.1, WO-3.3 · **Owes** WO-6.3
**Closes roadmap** Phase 6 → "Derived events computed at render from assignments, terms, and the
schedule — not stored.", "IEP/504 review dates" *(the first fragment elided the middle of the box
until 2026-08-08, WO-2.15. An ellipsis inside a fragment matches nothing: `norm()` strips it rather
than wildcarding it, so a fragment may stop early but may never skip a middle. The second arrived
from WO-6.1 on 2026-08-19, WO-1.25 — a `reviewDate` is read at render out of a student record and is
never an `events[]` entry, which makes it a row in the table below rather than a kind above.)*

**Why it exists.** Everything on this calendar that the teacher did not type is already in the
document, and copying any of it into `events[]` would create the second truth the phase header
forbids. This work order is the read side: one answer per row of the table below, and no writer.

**The roadmap box says *the schedule* and there is no schedule to read.** The fragment above is
quoted as the box words it, and the thing it names is the **attendance ledger** — recorded meetings
plus the exceptions authored over them — which is the only meeting record this app has ever had. It
is not a meeting pattern, and nothing in this work order may invent one; `**Traps**` at the foot of
this work order is the whole argument.

**Deliverables**
- Computed at render, never stored:

  | Shown on the calendar | Read from |
  |---|---|
  | Assignment due dates | `assignments[].due` |
  | Term start and end | `classes[].terms[]` |
  | Which classes met, and which were dropped | `attendance[]` |
  | IEP/504 review dates | `students[].supports.reviewDate` |

- **IEP/504 review dates surfaced ahead of time, in presentation-mode-safe form** — a date and a
  student, **never the plan type**, and **suppressed entirely in presentation mode**. That is WO-6.1's
  wording, kept whole when the deliverable moved here on 2026-08-19 (WO-1.25); the weaker restatement
  that used to sit in this work order's acceptance list — "presentation-mode safe" and nothing more —
  is gone, because two sentences about one rule is how the weaker one comes to be the one somebody
  builds against. **The name stays on the calendar**, presentation-gated, because this is a surface a
  teacher opened on purpose. The glance page reads differently, and says why in WO-6.4's fifth box.
- Visual distinction between authored and derived items — a derived item is edited at its source,
  and tapping it should go there.
- **Nothing here answers "which classes meet on this date".** The attendance-derived answers are the
  ones already recorded — taken, dropped, covered — and the fourth state `src/attendance.js`'s
  `stateOf()` can return, `NOT_TAKEN`, is not carried onto a future date by this work order. See
  `**Traps**`.

**Acceptance**
- [ ] Changing an assignment's due date moves it on the calendar with no other action.
      → WO-6.3 "A derived due date moves with its assignment: change the date on the assignment and
      the month grid shows it on the new day, with no other action"
- [ ] `events[]` contains no derived entry, checked deterministically rather than by feel: seed a
      month holding an assignment due date, a term boundary, a recorded meeting, a planned drop and a
      review date; render it, page one month forward and one back, and re-read `doc.events` — it holds
      the same entries, by `id`, that were authored before the render.
- [ ] Tapping a derived due date opens the assignment, not an event editor.
      → WO-6.3 "Every item taps through to its source"
- [ ] A review date reaches the calendar as a date and a student and nothing else — no plan type, no
      accommodation, no medical or behavior-plan text — and is gone entirely in presentation mode.
      → WO-6.3 "A review date on a month cell shows a date and a name and no plan type"
- [ ] A future weekday shows **no per-class meeting state at all**: the derived answers are read from
      `attendance[]` and from authored `no-school` / `dropped` events, so a weekday with neither is
      blank rather than *not taken yet*, and nothing in this work order stores, derives, caches or
      infers which classes were expected to meet.

**Traps** — **Do not build the schedule model this grid will make look necessary.**
[`../rotating-schedule.md`](../rotating-schedule.md) — `plans/rotating-schedule.md` — is a settled
decision record: a cycle model was designed and removed on the same day, because the schedule rotates
*and* changes at random, and a second source of truth about which classes meet has to be corrected by
hand anyway. **The trap is specific to a month view and does not exist on the home screen.**
`stateOf()` has four answers and only three of them are facts about the class; `NOT_TAKEN` is the
*did-I-forget* state, which is exactly right on a home screen asking about **today** and is a wall of
amber on a grid asking about twenty weekdays across five classes. The obvious way to quiet that wall
is to know which classes were meant to meet — which is the cycle model that document rejects, reached
from the rendering side rather than the modelling side, which is why it will look new. **The fix is
the other one:** draw nothing where nothing was recorded, and if a distinction is wanted for days the
school is not in session, take WO-2.50's precedent — a quiet `off-term` modifier read off the term
bounds, not a schedule.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/rotating-schedule.md`
  - `src/attendance.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these before writing — this work order is a read over five existing modules and matching
their conventions is most of the job:

- `src/calendar.js` — **the module this work order extends.** WO-6.1 landed here yesterday: the
  eight-field `newEvent()`, `eventFault()`, `coversDate()`, `coversClass()`, `coveringEvent()`,
  `exceptionsIn()`, `generalEventsIn()`, the series helpers, and `settingsIn()` / `leadDaysOf()` /
  `setLeadDays()`. Read `.claude/dispatch/WO-6.1-result.md` for what it decided and why. The derived
  read side belongs beside that model, and it has **no writer** — not one function in what you add
  may call `addEvent()`, `updateEvent()`, or otherwise touch `doc.events`.
- `src/attendance.js` — `stateOf()` and its four answers. **`NOT_TAKEN` is the one this work order
  must never return onto a future date**; acceptance line 5 is written to catch exactly that. Read
  the work order's `Traps` alongside it.
- `src/assignments.js` — where `assignments[].due` is written and what a tap-through target looks
  like. WO-6.3 builds the DOM, but the derived record you return has to carry enough identity for it
  to open the assignment rather than an event editor (acceptance 3).
- `src/supports.js` and `src/roster.js` — `supports.reviewDate` lives at `src/supports.js:168` and is
  edited on the roster. Note `SUPPORT_FIELDS` at `src/roster.js:647`: `reviewDate` sits in the same
  record as `medical` and `behaviorPlan`, so **the shape you return must make it impossible to leak
  the neighbours** — return a date and a student identity, never the supports object, never the plan
  type, never a spread of the record. Acceptance 4 is the one a plausible implementation fails.
- `src/presentation.js` — the existing presentation-mode gate, and how the nine modules that already
  consult it do so. Match that convention rather than inventing a second one; a review date is
  **gone entirely** in presentation mode, not redacted, not shown as an unlabeled dot.
- `docs/data-model.md` § Events and its line 408 on why `reviewDate` earns its place, plus line 517's
  table — the same four rows as this work order's Deliverables. If the code and that table disagree
  after your change, say which one you moved and why.
- `plans/rotating-schedule.md` — the settled decision record the `Traps` block cites. Read it before
  you write anything that answers "which classes meet on this date", because the answer is that
  nothing here does.

Two notes on scope. Three of the five Acceptance lines (1, 3, 4) are re-homed to **WO-6.3** and
close there, not here — leave them `- [ ]`, and the `**Owes** WO-6.3` on the header is what makes
that correct rather than an omission. And `src/calendar.js` has no DOM by design; if a line seems to
need one, that is WO-6.3's work order and not a reason to widen this one.

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

## 5. Done means these 5 lines, reported against one by one

1. Changing an assignment's due date moves it on the calendar with no other action. → WO-6.3 "A derived due date moves with its assignment: change the date on the assignment and the month grid shows it on the new day, with no other action"
2. `events[]` contains no derived entry, checked deterministically rather than by feel: seed a month holding an assignment due date, a term boundary, a recorded meeting, a planned drop and a review date; render it, page one month forward and one back, and re-read `doc.events` — it holds the same entries, by `id`, that were authored before the render.
3. Tapping a derived due date opens the assignment, not an event editor. → WO-6.3 "Every item taps through to its source"
4. A review date reaches the calendar as a date and a student and nothing else — no plan type, no accommodation, no medical or behavior-plan text — and is gone entirely in presentation mode. → WO-6.3 "A review date on a month cell shows a date and a name and no plan type"
5. A future weekday shows **no per-class meeting state at all**: the derived answers are read from `attendance[]` and from authored `no-school` / `dropped` events, so a weekday with neither is blank rather than *not taken yet*, and nothing in this work order stores, derives, caches or infers which classes were expected to meet.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

