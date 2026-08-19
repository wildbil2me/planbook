# WO-2.52 — the register opens on the term, not on the clock · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.52-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude Opus** on the work order's own merits: it is Size `L`, and
its four named decisions each reverse something this repo already has in writing — `writableDate()`'s
founding sentence that marking Friday on Wednesday is a mistake, and WO-2.51's *nothing switches by
itself* — which is judgment about what the spec should be rather than implementation of a settled one.
Teacher-facing banner prose (*Quarter 1 opens in 14 days*) and a design call about how a live future
column reads both land in the same column. The runner-up I set aside: the Deliverables are unusually
precise for an `L`, so a Codex case could be argued from the spec's completeness — but the Acceptance
demands a green `verify-shell.mjs` (~4.4 min) plus at least one mutation proof, which is two or more
full runs against a 20-minute cap on a work order whose method holds a deliberate mutation in the
tree, and a reader who pattern-matches rather than honours reasoning is exactly the wrong reader for
four deliberate reversals.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.52 — the register opens on the term, not on the clock

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-19 · **Size** L · **Depends on** WO-2.50 · WO-2.51 · **Blocks** nothing
**Closes roadmap** Phase 2 → *(no box. Owner-asked 2026-08-19, out of the screen the two rows above it
left behind.)* **Takes from WO-2.51** its *nothing switches by itself* ruling, reversed with the owner
in the same sitting — see **Deliverables** § the jump.

**Owner-asked 2026-08-19, from `https://planbook.hwgteach.com/`:** *instead of showing all dates, it
should only show dates in the selected term, starting with the earliest term date closest to today.
Today is 8/18 but our term starts on 9/2, so I should see a locked 9/2 that I can pre-edit using the
edit interface — not 8/18 — and maybe a bar at the top that says this term opens in x days. It should
also just jump to the next term when that date arrives.*

**Why it exists.** WO-2.50 gave this screen a term bound and WO-2.51 gave it a voice about the term
that holds today. Neither moved the thing both of them are about: **the strip is still anchored on the
clock.** `visibleColumns()` walks weekdays back from `todayISO()`, `futureLimit()` measures the forward
stop from `todayISO()`, and `writableDate()` refuses every date after it. So on 2026-08-19, a fortnight
before her first term, the register draws six columns that are every one of them outside every term:
greyed end to end, no tappable cell, no control but the door to the term editor. **WO-2.50 is working
exactly as specified and the result is a screen with nothing on it.** The teacher who opens her
register to get ready for September is shown six dead days and told to come back later.

**What the fix is, in one sentence: the window follows the TERM and the gate follows the CLOCK, except
where the term says otherwise.** WO-2.1's separation — the window is what is DRAWN, the gate is what is
WRITTEN — is what makes most of this cheap, and it is not being given up. Three of the four decisions
below only move the drawing. The fourth moves the gate, deliberately, and is narrowed so that it can.

**The four decisions, taken with the owner 2026-08-19, each one written here because each one reverses
something this repo already has in writing.**

1. **A future day INSIDE A TERM OF THE CLASS becomes writable.** This overturns `writableDate()`'s
   founding sentence — *marking Friday's attendance on Wednesday is a mistake rather than a feature* —
   and it is narrowed rather than deleted. A future day outside every term is refused exactly as it is
   today, which is every future day of a class whose term dates are not typed. **The feature is paid
   for by typing the dates**, and a class with no dated terms behaves as it does now, to the keystroke.
2. **The selected term moves by itself, ON ARRIVAL AND NOWHERE ELSE.** This overturns WO-2.51's
   deliverable *Nothing switches by itself* and its Trap *do not switch the term for her*. What that
   ruling was protecting is the sentence it was argued with — *an app that moves it for her is an app
   that moved it while she was part-way through entering the last week of Quarter 1* — and arrival is
   the one moment that cannot be true of. It goes in `resetRegistry()`, beside the five other things
   every arrival already resets. **Nothing moves while the screen is open.**
3. **The term is a soft wall.** The strip OPENS inside the term; `◀ Earlier` still walks out of it and
   the days out there stay greyed `Off term` exactly as WO-2.50 draws them. A hard wall would be the
   window enforcing a rule instead of the gate, which is the one thing WO-2.50's own Traps line
   forbids: *a locked column you can see is the feature.*
4. **The bar speaks in both directions** — before a term and after one. A finished term browsed back
   to in February has the same question to answer as one that has not started, and the answer *this
   term ended on October 31* is the same sentence pointing the other way.

**Two costs, on the record before a line is written.** A pre-marked day is a **RECORD**, so Sep 2 is a
recorded meeting from the moment it is marked on Aug 19 — in the term percentage, in the year total and
in both reports, for a class that has not met. That is not a defect of this work order, it is what
marking a day MEANS in this data model, and it is the reason decision 1 is narrowed to days the teacher
has said are school days. And on a day when today is off-term the anchor day is live by default, so
*Everyone's here* is one tap from taking a class that has not happened; the banner and the date heading
above the grid are what make the day it would land on unmissable.

**Deliverables**

- **Three derived dates where there is one, all in `src/attendance.js` beside `editDate()`, none of
  them stored.** They are re-derived every paint the way `futureLimit()` already is, so nothing here
  can go stale across a midnight, a year switch or a restore.
  - **`anchorDate()` — the day the strip is BUILT FROM.** Today when the **selected** term contains
    today, when it is undated, or when there is no term at all; `term.start` when today is before it;
    `term.end` when today is after it. **It reads `getSelectedTerm()`, and that is allowed here and
    only here, because it bounds what is DRAWN.** WO-2.50's decision 1 — the selected tab must never
    bound what is written — is untouched and is checked below.
  - **`focusDate()` — the day the screen is ABOUT.** The unlocked day if there is one, else the anchor.
    This is what `paintActions()` describes and what the date heading reads. Without it the heading
    says *Wednesday, August 19* over a grid whose only column is September 2, which reads as a bug.
  - **`editDate()` — the day that ACCEPTS WRITES.** The unlocked day if there is one; else the anchor
    **when the anchor is today or later**; else nothing at all. That last clause is what keeps February
    honest: browse back to Quarter 1 in February and the anchor is Oct 31, a past day, which must stay
    **locked until the ✏️ is pressed** like every other past day. It answers `''`, which matches no
    column, so every existing `date === editDate()` comparison goes on working unchanged.
- **`visibleColumns()` walks from the anchor.** `weekdayAt()`, `dayColumns()` and `dayColumnCount()`
  do not change — they already take an origin and have simply always been handed today. `pageDaysBack`
  is now weekdays back **from the anchor**, and its comment says so.
- **The forward stop moves with the anchor.** `futureLimit()` becomes **`forwardLimit()`**: it walks
  from `anchorDate()` rather than from `todayISO()`, and the horizon is the furthest of the last
  calendar event **and the selected term's `end`**. Without the second half the strip opens on Sep 2
  with `Later ▶` dead on arrival, because the old horizon is measured from a today that is off screen.
  Keep the single walk; its comment says why it is not asked per index. `pageDays()`'s clamp and
  `paintPager()`'s `later.disabled` follow it, and `Later`'s disabled sentence gains the case it now
  has — *this term ends on October 31* is a different fact from *there is nothing further to look at*.
- **One gate, one edit.** `writableDate(date)` takes the class: *ISO-shaped, and either on or before
  today or inside a term of this class*, off `termContaining()` — **any term, never the selected one**,
  which is WO-2.50 decision 1 surviving the change that is most likely to break it. The rewritten
  header states the departure at the point of departure and names what still governs: every day that is
  in no term is refused by the same sentence as before. Every writer already has the class in hand, and
  a fourth gate spread across nine call sites would be nine chances to forget one.
- **One `writable` flag per column, computed where `editable` already is** — in `renderAttendance()`,
  in `paintColumn()` and in `renderRows()`'s `perColumn` map, which are the three places that already
  hoist `cover` and `offTerm` for the same reason. `editable` becomes `writable && date === editDate()`.
  **`dayHead()` takes it and draws the ✏️ on any writable column that is not the edit date**, which
  collapses its two early returns into one test that is *the same predicate the writer uses* — the rule
  this file states three times over. It also closes the trap in the obvious shortcut: `offTermOf()`
  answers null for a class with **no dated terms**, so a head keyed off `offTerm` alone would draw a
  live-looking pencil on a future day the gate then refuses.
- **The 🚫 stays on today's column and nowhere else.** A class that will not meet next Thursday is a
  calendar event, and WO-2.3 already owns that; `dropClass()` writes a record, and a record is not how
  the future says a class did not meet.
- **The names follow the meaning.** `editingPast` → `editingDay`, `editPastDay()` → `editDay()`,
  `lockPastDay()` → `lockDay()`. A function called `editPastDay` that opens September 2 is the kind of
  name WO-3.20 spent a whole work order removing. **The DOM hooks do not move** — `data-attendance-edit`
  and `data-attendance-lock` are the contract `src/shell.js`'s census documents. This reaches
  `tools/verify-shell.mjs` in about twenty places, which is being edited anyway: its mutation proof
  asserts `acceptedPast.moved.editPastDay === true` beside `acceptedToday === false`, and the
  future-in-term case has to join that pair.
- **`editDate()`'s midnight guard is rewritten**: clear the unlocked day when it equals the anchor —
  there is nothing to unlock on the day the screen is already on. The old `>= today` test throws away
  every future unlock the instant it is made, and it is the single line most likely to be left alone.
- **The bar, and the precedence it joins.** `paintBanner()` already owns this band and already has the
  rule — **one band at a time**. In order:
  1. a day is unlocked → *You are editing September 2, 2026.* with the way back. Unchanged, and its
     condition becomes the unlocked day itself rather than a comparison with today.
  2. **the ANCHOR is not among the columns** → *Showing …* with a button back to it. This is the
     existing off-today band with `todayShown` replaced by `anchorShown`; **without that change it
     fires on Aug 19 and talks over the new message**, which is the one ordering mistake this
     deliverable exists to prevent.
  3. today is in a term that is not the selected one → **WO-2.51's rollover band, untouched.** It
     carries an action, so it beats a bare statement about the same fact.
  4. today is in **no** term of the class and the selected term is dated → the new band:
     *Quarter 1 opens in 14 days.* / *Quarter 1 ended on October 31, 2026.*
  5. nothing.

  **3 and 4 are mutually exclusive by construction** and are written adjacent so a reader can see that.
  WO-2.51 declined to speak on a day that is in no term because WO-2.50's grid was already saying it
  four ways; the anchor has now moved the grid into the term, nothing is saying it, and this band is
  what explains the date on screen.
- **The count is calendar days**, from a small `daysUntil()` beside `parseISO()` — rounded, with the
  comment about the 23- and 25-hour days that make rounding the right answer. `1` reads *opens
  tomorrow*. The finished side uses `plainDate()`, which already exists and carries the year, because
  this band is read months later. **The term is named through `termName()`** and never through a word
  invented here — a class on trimesters has to read correctly with no code change.
- **The presentation of a live future column.** `stateChip()` keeps `Ahead`, unlocked or not: the day
  still has not happened and it is still not an alarm. `cellFor()` keeps the `·` and the `future` tone
  when the column is unlocked and changes only the accessible name and the tooltip, to say the day can
  be marked early. Amber `?` is the *you have a hole here* colour and next Tuesday is still not a hole.
  `src/attendance.css` makes the `editing` treatment win over the `attendance-col-future` wash, so an
  unlocked future column reads as live rather than as greyed-with-buttons.
- **The jump, in the module that owns the preference.** `openTermForToday()` in `src/classes.js` writes
  `openTermIds` when `termContaining(cls.id, todayISO())` names a term other than the selected one. It
  **writes only** — no `refreshClassBar()`, no announcement — because the arrival paint that follows
  redraws the bar anyway, and a render from inside a function documented as not rendering is how a
  double paint starts. **It is called from `resetRegistry()`**, not from `src/shell.js`: that is *the*
  arrival function, its own comment already says every arrival starts on today unpaged and unfiltered,
  and it has two callers. One place to add this is one place to forget it; two is two.
- **`TESTING.md` lines and the `CHANGELOG.md` entry**, per the maintenance protocol, and **bump `CACHE`
  in `sw.js`** — `./` is entry one and `index.html` is not the only file in `SHELL` this touches.

**Acceptance**
- [ ] Today 2026-08-19, one class, terms `Quarter 1` 2026-09-02 – 2026-10-31: the strip opens with
      **9/2 as its newest column**, the bar reads *Quarter 1 opens in 14 days*, and **no August column
      is on screen**. Driven in the harness, not reasoned about.
- [ ] **9/2 is live with nothing pressed** — a cell tap marks it and the record lands on `2026-09-02` —
      and **9/3 is not**: it carries a ✏️, and it accepts marks only after that ✏️ is pressed.
- [ ] `◀ Earlier` from 9/2 still reaches August, and every column out there is greyed `Off term` with
      nothing tappable in it. The soft wall, proved from the inside out.
- [ ] `Later ▶` reaches 10/31 and is disabled there saying why, **on a document with an empty
      calendar** — so the stop being proved is the term's end and not a day off.
- [ ] **A class with no dated terms behaves exactly as it does today**: the anchor is today, no future
      column carries a ✏️, there is no bar, and `writableDate()` refuses tomorrow.
- [ ] **The selected term never bounds a write.** With Q1 ending Oct 31 and Q2 starting Nov 3, the Q1
      tab up and today Nov 4, marking today succeeds — WO-2.50's decision 1, re-proved against the one
      change most likely to have broken it.
- [ ] Today Nov 4, preference on Q1: **arriving at the screen selects Q2** and the strip opens on today.
      Selecting Q1 by hand during that session **sticks**, shows WO-2.51's rollover band, and anchors
      the strip on **10/31, locked** — no cell tappable until its ✏️ is pressed.
- [ ] **Nothing moves the term while the screen is open**: with Q2 selected and the screen painted,
      repeated repaints leave the preference unchanged; only an arrival moves it.
- [ ] Terms labelled `Trimester 1` and `Trimester 2` produce the same sentences with those labels. No
      quarter vocabulary anywhere in the output.
- [ ] `grep -rn "editPastDay|lockPastDay|editingPast|futureLimit" src/ tools/ TESTING.md` returns
      nothing — the rename swept rather than shadowed.
- [ ] `node tools/verify-shell.mjs` green with its check count recorded, and **one mutation proof over
      the new future-in-term branch of `writableDate()`**.
- [ ] 👤 On the iPad, **force-quit from the app switcher first** (`CLAUDE.md`): on 2026-08-19 portrait
      draws **one column and it is 9/2**, the bar is readable at a glance without hunting, and the ✏️
      and the bar's button both clear 44px under `@media (pointer: coarse)`.
- [ ] 👤 Pre-mark 9/2 on the iPad, then read the term percentage: the day counts as a meeting from that
      moment. The cost named in **Why it exists**, seen rather than assumed.

**Traps** — **the anchor is the SELECTED term and the gate is ANY term**, and the whole of WO-2.50
decision 1 is that those are two different questions; a reader who reaches for `getSelectedTerm()` in
`writableDate()` has rebuilt the defect that work order refused, and the acceptance line above is there
because it is one keystroke away. **`futureLimit()` cannot stay measured from today** — the symptom is
a `Later ▶` that is dead the moment the anchor is not today, and it will look like a paging bug rather
than a horizon bug. **The old midnight guard eats every future unlock**; rewrite it in the same edit
that allows one. **Do not draw the ✏️ off `offTerm`** — a class with no dated terms answers null there
and would get a pencil the gate refuses, which is the exact *looks live, takes a tap, does nothing*
control this file refuses three times in writing. **The banner order is load-bearing**: the off-anchor
band must not fire on an unpaged Aug 19, or the new message never appears at all. **`term.label` or
nothing.** **And check the diffstat before committing** (WO-2.49) — this touches `tools/verify-shell.mjs`,
which is the file a CRLF rewrite hides best.

**Out of scope.** A month or week calendar view, and anything that draws term boundaries on one —
Phase 6 owns that, and WO-6.2 already promises term start and end as derived events. Any change to the
home screen, whose cards are about today per class and stay that way. A warning *before* a term ends,
which WO-2.51 already booked to Phase 6. Validating the term date fields against each other — the
header of `src/classes.js` refuses that by name, and nothing here needs it. Sorting or repairing terms.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance.css`
  - `src/attendance.js`
  - `src/classes.js`
  - `src/shell.js`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these before writing, and read the first two in full — this work order is a third
edit to a screen two other work orders just changed, and its Traps are almost entirely about not
undoing them:

- **WO-2.50 in `plans/work-orders/phase-2-attendance.md`** — the term bound on this screen, and in
  particular **its decision 1** (the selected tab must never bound what is written) and its Traps line
  *a locked column you can see is the feature*. Your `writableDate()` edit is the single change in
  this project most likely to break decision 1, and one Acceptance line exists solely to catch it.
- **WO-2.51 in the same file** — the rollover band you are inserting a new band beneath, and the
  *nothing switches by itself* ruling that this work order reverses **only on arrival**. Read what
  that ruling was protecting before you move it; the reversal is narrow on purpose.
- `src/attendance.js` in full, not just the functions named. `visibleColumns()`, `futureLimit()`,
  `writableDate()`, `editDate()`, `paintBanner()`, `paintActions()`, `paintPager()`, `dayHead()`,
  `cellFor()`, `stateChip()`, `renderAttendance()`, `paintColumn()`, `renderRows()` and
  `resetRegistry()` are all named in the Deliverables and several of them read each other.
- `src/classes.js` — `getSelectedTerm()`, `termContaining()`, `termName()`, `openTermIds`, and the
  header comment that refuses term-date validation by name (your Out of scope depends on it).
- `tools/verify-shell.mjs` — the rename reaches it in about twenty places, and its existing mutation
  proof asserting `acceptedPast.moved.editPastDay === true` beside `acceptedToday === false` is the
  pair the new future-in-term case has to join.

**Two notes on the working tree, which is not clean when you arrive.** Both are owner edits made
alongside this work order being written, and neither is yours to revert or explain:

- `sw.js` is already bumped `planbook-shell-v78` → `v79`, uncommitted and undeployed. Your
  Deliverable to bump `CACHE` is still owed — take it to `v80`, so the change you ship gets its own
  cache name and does not ride on a bump made for something else.
- `index.html` has one uncommitted line: a `placeholder="Ms Toomey"` removed from the teacher-name
  field. Unrelated to this work order. Leave it alone.
- `plans/work-orders/phase-2-attendance.md` and `plans/work-orders/README.md` carry this work order's
  own text and its roadmap row. Also expected.

**And the diffstat rule, from the Traps and from WO-2.49.** Before you finish, run `git diff --stat`
and read it. A 5,000-line diff on a file you edited by 100 lines is a CRLF rewrite, not your work —
`tools/verify-shell.mjs` is the file in this repo that hides one best, and you are editing it.

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

## 5. Done means these 13 lines, reported against one by one

1. Today 2026-08-19, one class, terms `Quarter 1` 2026-09-02 – 2026-10-31: the strip opens with **9/2 as its newest column**, the bar reads *Quarter 1 opens in 14 days*, and **no August column is on screen**. Driven in the harness, not reasoned about.
2. **9/2 is live with nothing pressed** — a cell tap marks it and the record lands on `2026-09-02` — and **9/3 is not**: it carries a ✏️, and it accepts marks only after that ✏️ is pressed.
3. `◀ Earlier` from 9/2 still reaches August, and every column out there is greyed `Off term` with nothing tappable in it. The soft wall, proved from the inside out.
4. `Later ▶` reaches 10/31 and is disabled there saying why, **on a document with an empty calendar** — so the stop being proved is the term's end and not a day off.
5. **A class with no dated terms behaves exactly as it does today**: the anchor is today, no future column carries a ✏️, there is no bar, and `writableDate()` refuses tomorrow.
6. **The selected term never bounds a write.** With Q1 ending Oct 31 and Q2 starting Nov 3, the Q1 tab up and today Nov 4, marking today succeeds — WO-2.50's decision 1, re-proved against the one change most likely to have broken it.
7. Today Nov 4, preference on Q1: **arriving at the screen selects Q2** and the strip opens on today. Selecting Q1 by hand during that session **sticks**, shows WO-2.51's rollover band, and anchors the strip on **10/31, locked** — no cell tappable until its ✏️ is pressed.
8. **Nothing moves the term while the screen is open**: with Q2 selected and the screen painted, repeated repaints leave the preference unchanged; only an arrival moves it.
9. Terms labelled `Trimester 1` and `Trimester 2` produce the same sentences with those labels. No quarter vocabulary anywhere in the output.
10. `grep -rn "editPastDay|lockPastDay|editingPast|futureLimit" src/ tools/ TESTING.md` returns nothing — the rename swept rather than shadowed.
11. `node tools/verify-shell.mjs` green with its check count recorded, and **one mutation proof over the new future-in-term branch of `writableDate()`**.
12. 👤 On the iPad, **force-quit from the app switcher first** (`CLAUDE.md`): on 2026-08-19 portrait draws **one column and it is 9/2**, the bar is readable at a glance without hunting, and the ✏️ and the bar's button both clear 44px under `@media (pointer: coarse)`.
13. 👤 Pre-mark 9/2 on the iPad, then read the term percentage: the day counts as a meeting from that moment. The cost named in **Why it exists**, seen rather than assumed.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

