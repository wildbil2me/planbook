# WO-2.3 — Days off & pre-drops · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.3-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at **Opus** tier, on the work order's own merits — the Ship 1
pre-routing table says Codex ("three-state logic, fully specified in `plans/rotating-schedule.md`")
and I am overriding it. The deciding signal is the Codex column's "no new visual language" criterion,
which this fails outright: half the deliverables are a brand-new authoring surface (date **range** +
named-class picker) with no counterpart in this app, plus a fourth state word and palette in a
registry column header that `src/attendance.js` deliberately reserved a slot for *without* specifying,
plus warning copy — and it is a 🚩 go-live blocker, which defaults to Claude unless it lands squarely
in the Codex column. Runner-up I set aside: the precedence half genuinely *is* fully specified and
mechanically checkable, and a `<input type="date">` pair dropped in the existing modal would have made
the UI half a lift rather than a design; I judged the registry-header state and the range semantics too
unspecified for that to hold.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.3 — Days off & pre-drops

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-2.1
**Closes roadmap** Phase 2 → "Days off and pre-drops, set ahead."

**Why it exists.** Two things are known in advance and shouldn't wait for the day to load: holidays
(the whole school is out) and pre-drops (an assembly is shifting Thursday's rotation). Both are
authored as calendar **events** and **read** by attendance — never copied into attendance records.
Delete the holiday and every class follows automatically.

**Reference:** [`../rotating-schedule.md`](../rotating-schedule.md) § Setting exceptions ahead of
time, and its precedence rules. Follow them exactly.

**Deliverables**
- A minimal date-picker UI: mark a date or range school-wide `no-school`, or mark named classes
  `dropped` on a future date.
- Stored as `events[]` entries of kind `no-school` / `dropped` per the data model. Empty `classIds`
  means school-wide.
- The marking screen reads these at render: a covered class shows as not-meeting, with the reason.
- **Precedence:** a class met if it has an attendance record with no exception. Otherwise it did
  not meet, whether from its own record or from a covering event.
- **The one rule protecting history:** a day with attendance actually recorded stays a meeting even
  if a calendar exception is added over it later. Warn, and leave the record alone.

**Out of scope** — the month view over this data (WO-6.3), other event kinds (WO-6.1).

**Acceptance**
- [ ] A `no-school` range across a week shows every class as not-meeting on every date in it.
- [ ] Deleting that event restores all those days to "not taken yet" with no attendance records
      having been touched.
- [ ] A future `dropped` event naming two classes affects only those two.
- [ ] Adding a retroactive snow day over a date that already has recorded attendance **warns and
      does not void the record**. Verify the marks are still there afterward.
- [ ] No attendance record is ever created by authoring an event. Inspect the document to confirm.

**Traps** — Copying the event into attendance records is the obvious implementation and it is the
one thing this design exists to prevent. It creates a second source of truth, and the one the
teacher isn't looking at is the wrong one.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The spec — read both in full, they are the work order's actual content:**

- `plans/rotating-schedule.md` — the whole file, but § "Setting exceptions ahead of time" and
  § "Precedence" are the two the work order says to follow *exactly*. The table in the first names
  which of the three surfaces each kind of exception is authored on, and why they are different
  places. The second is the four-line precedence rule and the one rule protecting history.
- `docs/data-model.md` — the `events[]` entry shape (around line 138: `id` · `date` · `endDate` ·
  `kind` · `title` · `classIds` · `studentId` · `notes`), and § "Events: only what can't be derived",
  which states the same never-copy rule from the data model's side. Note `endDate` already exists in
  the schema: a range is one event, not N events. Do not invent a new field or a new kind.

**The seam is already carved, and it is one function.** `src/attendance.js` was written anticipating
this work order and says so in its own header. Read these before you design anything:

- `src/attendance.js` header, the block headed "THE THREE STATES, AND WHY THERE IS NO SCHEDULE TO
  ASK" (around lines 32–47). It states outright: *"WO-2.3 adds calendar events to the answer (a
  `no-school` range covering the date), and it adds them HERE, in one function, or the app grows a
  second opinion about whether a class met."* Honor that. One place decides.
- `export function stateOf(classId, date)` (around line 872) and the comment above it — the predicate
  every consumer reads through. Its constants are at lines 502–504: `TAKEN` · `DID_NOT_MEET` (whose
  value is the string `'dropped'`) · `NOT_TAKEN`.
- The same header says **"THE COLUMN HEADER IS BUILT FOR A FOURTH REASON ARRIVING — the state chip is
  a word and a palette, not a boolean, so an event-covered day is a fourth word in the same slot."**
  That slot is reserved and empty; choosing the word and the palette is yours, and it is one of the
  reasons this came to Claude. The work order's "shows as not-meeting, **with the reason**" is what
  fills it — the event's `title` is the reason a teacher wants to read there.
- `src/home.js` around line 214 carries a comment asserting *"stateOf() still has exactly three
  answers."* If your change makes that sentence false, the comment is yours to correct — do not
  leave a load-bearing comment lying.
- `src/attendance.js` around line 1017, "THE ONE GATE EVERY WRITER PASSES THROUGH", and the fact that
  future dates are blocked for *attendance writes*. Authoring an event on a future date is the point
  of this work order and must not be caught by that gate — but also must not weaken it. Read the gate
  before you route around it.
- `src/store.js` line 153 — `events: []` is already in the document skeleton. Use it; do not add a
  parallel collection. `update()` there is the write path.

**Conventions to match rather than re-derive:**

- `src/modal.js` — the modal pattern every dialog in this app uses, including the warning you owe for
  the retroactive case.
- `src/classes.js` — form conventions, and `getSelectedClass`; the class list your "named classes"
  picker enumerates comes from here, and nothing may assume a fixed class list (`CLAUDE.md`).
- `src/attendance.css` — the existing column-header chip washes. The fourth state's palette lives
  beside them, inline-color rules unchanged.
- `src/year-picker.js` is a **school-year** picker, not a date picker. It is not the component to
  extend; read it only if its interaction shape is useful.

**Lift from Roll Call!, don't re-derive it** — `CLAUDE.md` § "Reference implementation" and the
WO-2.11 scar it records (a pass banner that kept the card *shape* and invented everything else, caught
against the running app and re-cut the same day). Roll Call! lives at
`C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App`:

- `design/style-guide.md` and `design/portable-components.md` — visual identity, modal patterns, touch
  targets. Take measurements and colours, not just behaviour.
- `src/dashboard.html` — Roll Call! handles "no school" / "day off" / holiday exceptions somewhere in
  here. If it has an author-ahead surface, that is the counterpart to lift. If it turns out not to
  have one, say so plainly in your result rather than quietly designing from scratch.
- If a Roll Call! rule genuinely must not come across, say so in a comment at the point of departure
  and name the local rule that beats it.

**Do not take from Roll Call!:** `src/bridge.gs`, JSONP, the outbox, any Sheets storage. None of it
applies here.

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

1. A `no-school` range across a week shows every class as not-meeting on every date in it.
2. Deleting that event restores all those days to "not taken yet" with no attendance records having been touched.
3. A future `dropped` event naming two classes affects only those two.
4. Adding a retroactive snow day over a date that already has recorded attendance **warns and does not void the record**. Verify the marks are still there afterward.
5. No attendance record is ever created by authoring an event. Inspect the document to confirm.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

