# Phase 4 work orders — Signals: concern **and** praise

**Phase goal:** open the app and see who needs you today — in both directions.

Ship 3, target October 2026 — deliberately after 4–6 weeks of real data exist to run the rules
against. Building these in August means tuning thresholds against nothing.

**The praise half is not decoration.** It is what makes this a teacher's assistant rather than a
gradebook with alarms. And it has a design trap that kills it: **rank by delta, not by level.**

Thresholds and defaults are specified in [`../../docs/data-model.md`](../../docs/data-model.md)
§ Signal thresholds. Implement those numbers as defaults, all of them editable.

**The screens are drawn, and the drawings are not a work order.** [`signals.html`](../../design/mockups/signals.html)
and [`behavior.html`](../../design/mockups/behavior.html) in
[`design/mockups/`](../../design/mockups/README.md) were made 2026-08-20, before any of this phase's
screens existed, under [`PROTOCOL.md`](../../design/mockups/PROTOCOL.md). **Read them before building
WO-4.2, 4.3, 4.4 or 4.5** — `proposed-phase4.css` is written to be lifted into `src/signals-view.css`
almost as-is, and re-deriving it is the mistake `CLAUDE.md` § Reference implementation is about. Each
of the four work orders below carries a **Surface** deliverable naming what the drawing settles.

**Eleven of the drawings' twelve questions were answered by the owner on 2026-08-20**, the day
after they were drawn — and the twelfth on 2026-08-24 by the work order that owned it — and each is written into the work order it belongs to as a **Decided** line
with its consequence. WO-1.25's ruling is why they are here rather than only in the pictures: a
drawing is not a work order, and an amber note is not a tracker. The four that carry the most:

- **Attendance outranks grade drops** (WO-4.2) — the severity question, which was the one that
  changes what the **engine returns** rather than what a screen draws.
- **The signals screen closes in presentation mode rather than redacting** (WO-4.2). The first
  surface in the app that refuses rather than hides, and the cost is accepted: a teacher who leaves
  the projector on for a period loses the screen for that period.
- **Append-only stands, and the correction UI goes** (WO-4.4). The ruling arrived as "you can just
  delete and re-enter", which would have reversed this work order's deliverable, its acceptance line
  and `docs/data-model.md` § log in one move; it was put back to the owner the same day and settled
  the other way. **Nothing in the log is deletable.**
- **Behavior entries and notes part company under a projector** (WO-4.4) — behavior is not built,
  notes are.

**That last question was answered on 2026-08-24, and it was a field rather than a screen:**
`students[].supports` gained `attendanceClause`, free text beside `medical` and `behaviorPlan`, and
a thirteenth accommodation KIND was refused with it — see WO-4.4's own Settled line and
`docs/data-model.md` § Accommodations. **All twelve of the drawings' questions are now closed.**

---

## WO-4.1 — Signal engine & thresholds

**Ship** 3 · **Status** ✅ DONE — 2026-08-19 · **Size** M · **Depends on** WO-2.4, WO-3.4
**Closes roadmap** Phase 4 → "Threshold engine reading every rule from the document, editable in
Settings", "One evaluator produces both lists", "Why is this student here?"

**Why it exists.** One evaluator produces both lists. A student can appear on both at once, and
**that is information rather than a bug** — a student whose grade is climbing while their attendance
falls is exactly who a teacher wants to see twice.

**Deliverables**
- `signals` block in the document holding every threshold — *not* `localStorage`, because these are
  the teacher's settings and must survive a device change and travel through sync.
- A settings editor for every threshold, with the documented defaults pre-filled and a reset.
- One evaluator: takes the document plus a class and term, returns a list of hits, each carrying
  direction (concern/praise), rule id, the student, the **numbers that produced it**, and a
  one-sentence explanation built from those numbers.
- **Windows count meetings, not days**, using WO-2.4's helper. A class may go a week without
  meeting; "4 absences in the last 20 days" is nonsense.
- Explanations are produced **by the rule itself**, not written per-screen — so "why is this student
  here?" is answered by construction and can never drift from the arithmetic.

**Out of scope** — the individual rules (WO-4.2, WO-4.3) and the UI lists.

**Acceptance**
- [x] Every threshold is editable and persists through save, reload, and a backup round-trip.
- [x] The evaluator returns both directions from a single pass.
- [x] A student appearing on both lists renders on both, with different explanations.
- [x] Every hit carries real numbers; no explanation contains a placeholder or a rounded lie.
- [x] All windows are expressed in meetings. Grep for any day-based window and remove it.

---

## WO-4.2 — Concern signals

**Ship** 3 · **Status** ✅ DONE — 2026-08-20 · **Size** M · **Depends on** WO-4.1
**Closes roadmap** Phase 4 → "Concern signals."

**Deliverables** — each rule, each with its documented default, each editable:

| Rule | Default |
|---|---|
| Current weighted grade below | 65% |
| Fell N points across the last N assignments | 10 pts / 4 |
| N consecutive scores under N% | 3 / 60% |
| N missing assignments | 3 |
| Attendance below N% | 90% |
| N absences within the last N **meetings** | 4 / 20 |
| N consecutive absences | 3 |
| N tardies | 5 |
| N behavior log entries within N days | 2 / 30 |

Plus: the concern list UI, per class and across all classes, ordered by severity, each row tapping
through to the student.

- **Surface: a main-area view, and the fifth segment on the class switcher** — drawn in
  [`design/mockups/signals.html`](../../design/mockups/signals.html). It is a surface a teacher works
  down for ten minutes, not a task she dismisses, so it is a view by
  [`../gradebook-surfaces.md`](../gradebook-surfaces.md)'s test; and it is *about* a class without
  being *owned* by one, which is the kind WO-6.6 ruled belongs on the switcher rather than behind a
  panel button. It keeps its own **All classes** filter for the calendar's reason, and arriving from a
  class arrives filtered to it — a door recomputed on arrival, never a stored preference. The drawing
  also settles: concern and praise at `1fr 1fr` with **praise first** below 720px, the **delta** in
  the strong position on every row with the current grade nowhere on it, **one student one row** with
  the other fired rules as tags, and the **signal card as a modal** carrying each rule's sentence over
  the numbers it measured and its threshold named as the teacher's own.
- **Decided: severity means attendance first** *(the owner, 2026-08-20)*. A student who is not in
  the room is the more urgent problem than a student whose grade slipped — the second is often a
  symptom of the first, and it is the one a teacher cannot fix later. **The concern list bands:
  attendance rules ahead of everything else, and inside each band the biggest change leads.** That is
  a property of what the evaluator returns, not of this screen: an ordering this work order builds
  into the list is an ordering WO-6.4's glance panel and Phase 5's send flow both inherit.
  **Deliberately not settled** — where missing work, low scores and tardies sit relative to a grade
  fall. They keep the drawing's order (real deltas first, then counts) and may be re-cut here without
  re-opening the ruling.
- **Decided: the screen closes in presentation mode, it does not redact** *(the owner, 2026-08-20)*.
  Initials protect nobody in a room of thirty who know each other's initials, and this is the only
  surface in the app whose entire content is a ranked list of named students in trouble. It draws an
  `.empty-state` naming the header control that undoes it, so it reads as refused rather than broken.
  **This is the first screen in the app that refuses rather than hides**, and it is a departure from
  how the roster, the calendar and the student detail all behave — say so at the point of departure,
  per `CLAUDE.md` § Conventions.
- **Decided: five segments, wrapped** *(the owner, 2026-08-20)*. The switcher carries Signals as its
  fifth, and **`.screen-nav` in `src/assignments.css` § SHARED gains `flex-wrap: wrap`** so the
  strip becomes two rows at 390px instead of scrolling one silently — WO-6.6's trap, one segment
  further along. That edit is this work order's, not the drawing's, and it touches a shipped sheet
  three views already wear: check Assignments, Scores and Calendar at 390px in the same pass, and
  `verify-shell.mjs`'s existing strip measurement moves from `scrollWidth` to a row count.
- **Decided: the list re-sorts and filters by rule** *(the owner, 2026-08-20)*. A sort control whose
  **default is the ruled order** — attendance first, then the biggest change — with *the biggest
  change*, *lowest grade* and *most missing work* under it; plus a second toolbar strip of `.pill`
  chips filtering by which rule fired. Neither is written to a preference: both recompute on arrival,
  for `src/calendar-view.js`'s reason. What protects the phase's argument is which option the list
  **opens on**, not which options are absent.

**Acceptance**
- [x] Every flag is reproducible by hand from the numbers it shows. Verify all nine.
      *(**Closed 2026-08-20, by the owner, against a test install carrying test grades and test
      attendance.** Four fire on the harness fixture and are reproducible from what they print — the
      absence run, the absence window, attendance-below and grade-below — and the behavior rule is
      inert by construction and asserted as inert. The other four had no fixture that fires them and
      were worked by hand on the device: the grade fall (the **before** figure being the weighted
      grade excluding the window rather than an average of raw scores), the low-score run, missing
      work, and tardies over **recorded meetings** rather than calendar days. That last column was
      the test — a rule can fire correctly and still print a number that does not match what
      produced it.)*
- [x] "Fell N points" measures the weighted grade before and after the window, not raw scores.
      *(Verified by construction rather than by fixture: `src/signals.js`'s `grade-fell` measures
      `ctx.gradeWithout()` against `ctx.grade()` — both weighted-grade readings — and touches no raw
      score. The rule does not fire on the harness fixture, so the numbers themselves are part of
      the line above.)*
- [x] Consecutive-absence counting skips dropped days and untaken days rather than breaking on them.
      *(Measured. The fixture seeds ten calendar days, drops the 8th and records nine meetings; the
      run reads **4 in a row across 9 recorded meetings**, spanning five calendar days. A build that
      broke on either would report 2 and fire nothing at a threshold of 3.)*
- [x] A student with no graded work does not appear on the grade-below rule.
      *(Measured, as an absence from the rendered list rather than a null in a model — the fixture's
      third student would be top of it if no-graded-work were read as a zero.)*
- [x] Editing a threshold changes the list immediately.
      *(Measured on the rendered rows and not only the model: the grade line moved 65 → 40, the 50%
      student left the list, and putting it back brought her back. The threshold was restored by
      **deleting the key**, which is asserted separately — an absent key IS its default.)*
- [x] The behavior rule is inert until WO-4.4 exists, and says so rather than erroring.
      *(Measured. The screen draws the notice from `inertRules()`, so it disappears of its own
      accord the day WO-4.4 lands rather than needing to be found and deleted.)*

**Where this stands.** The build is complete and both tools are green — `verify-shell.mjs` at
`1086 checks · 1086 passed · 0 failed · 0 skipped`, `wo-sweep.mjs` at `29 passed · 0 failed`. The
screen is measured in § *"who needs you, drawn (WO-4.2)"* at the foot of the harness, nineteen checks
against a fixture built for it, and `signalsView` is in `VIEW_PLAN` pointing at that section.
**All six Acceptance lines are closed and the 👤 sitting is green — thirteen readings on 2026-08-20,
written up in `TESTING.md` § WO-4.2.** The four rules no fixture reaches were worked by hand on a test
install rather than left to the term. *(The dispatch that built this was killed by an API error
mid-flight; `.claude/dispatch/WO-4.2-status.md` records what was recovered from the tree and what had
to be re-derived, and `plans/dispatch-retro.md` § "The comment that ran ahead of its code" carries the
scar worth keeping.)*

**Traps** — "N consecutive absences" over a rotating schedule means consecutive *meetings of that
class*. Three absences across three weeks of a twice-weekly section is still three consecutive.

---

## WO-4.3 — Praise signals

**Ship** 3 · **Status** 🔨 IN PROGRESS — built 2026-08-24 · **Size** M · **Depends on** WO-4.1
**Owes** the real-data box (Acceptance line 3) — and nothing else; the 👤 sitting is green, 2026-08-25
**Closes roadmap** Phase 4 → "Praise signals."

**Why it exists.** "Top of the class" surfaces the same four students every week and is worth
nothing. "Came up 14 points since October" surfaces a different student every time, and it's the
message that actually lands at home. **A rule that can only ever fire for high achievers is the
wrong rule.**

**Deliverables** — each with its documented default:

| Rule | Default |
|---|---|
| Rose N points across the last N assignments | 8 pts / 4 |
| N consecutive scores at or above N% | 3 / 90% |
| Came off the concern list (turnaround) | within 21 days |
| No missing work across the last N assignments | 8 |
| Attendance at or above N% over the last N meetings | 100% / 20 |

Plus: the praise list, **ranked by delta** — the size of the change, not the height of the score.
The turnaround rule requires retaining enough history to know a student was previously flagged;
derive it from the log and prior evaluations rather than storing a "was flagged" bit that can go
stale.

- **Surface: the right-hand column of WO-4.2's view, at equal width** — drawn in
  [`design/mockups/signals.html`](../../design/mockups/signals.html), which is where the equal billing
  is argued rather than asserted: a stacked layout buries praise on any screen shorter than both
  lists, and every iPad is. Two consequences the drawing settles for this work order. The column head
  says **biggest climb first** in as many words, because a teacher who reads "Praise" as "the top of
  the class" stops reading it inside a fortnight. And the **delta is the only bold figure on a praise
  row** — the current grade is not drawn at all, since a list that ranks by delta and draws the level
  big is arguing with itself.

- **Decided by the build, not by this work order: the ranking is banded by rule, then by figure**
  *(2026-08-24)*. `praiseOrder()` in `src/signals.js`, the same shape `severityOrder()` has and for
  the same reason — a flat sort on the figure would subtract *rules cleared* from *points* and let
  whichever number happened to be larger lead, which is the question the concern side already
  refuses to ask about 61% and 3 missing. The order is **grade-rose · turnaround · no-missing ·
  attendance-window · high-score-run**, and every position is argued at the array. The last of those
  is trap 2's answer twice over: `high-score-run` *is* the rule that can only ever fire for high
  achievers, so it is registered, it is drawn, and it sorts under everything.
- **Decided by the build: the *Sorted by* control orders the CONCERN list only** *(2026-08-24)*. Two
  of its four options are concern errands with no praise reading, and the only praise reading of
  *lowest grade* is *top of the class* upside down — which is the one thing this phase exists to
  refuse. So the praise column keeps one ranking, its head says *biggest climb first* in as many
  words, and the `<select>`'s aria-label now says which list it orders. **The alternative — a second
  sort control — was declined** on a screen already carrying two filter strips and one sort.
- **Decided by the build: a rule chip narrows the column its rule is in and leaves the other whole**
  *(2026-08-24)*. The strip carries both directions now. Filtering to *a run of low scores* is a
  concern errand, and emptying the praise half while a teacher does it would bury the column this
  phase exists to protect for a reason she never asked for. Reasoned at `columnRows()`.

**Acceptance**
- [x] Sorting the praise list by its default ranking puts the biggest *improvement* first, not the
      highest grade. Verify with a case where a B− student outranks an A student.
      *(Measured on the rendered column, 2026-08-24. The fixture's B− is at **80.50%** and came up
      **16.25** points; the A beneath her is at **94.20%** and came up **9.20**; and the highest
      grade in the class — **96.50%**, an A — is **last of five**. Both letters are read off the
      app's own scale, so the work order's own sentence is true of what was measured. **Proved by
      mutation**: `orderPraise()` cut to a sort on `row.grade` — the build this phase exists to
      refuse — reddens four checks including this one.)*
- [x] The turnaround rule fires for a student who was on the concern list and no longer is.
      *(Measured. The fixture's student is flagged by **two** concern rules at `through − 21 days`
      and by none today; the hit carries `cleared: 2`, `days: 21`, and it fires for **nobody else**
      on the roster. **Derived, not stored** — the document is byte-identical either side of the
      pass and carries no key shaped like a remembered flag, which is asserted separately. **Proved
      by mutation**: sampling the window at today instead of at its far edge reddens five checks.)*
- [ ] Running the praise list two weeks apart on real data surfaces a materially different set of
      students. *(If it doesn't, the ranking is wrong — this is the acceptance test that matters.)*
      *(**Left open deliberately — it wants a real term and there is not one until Sep 2.** What
      exists is the mechanism, measured: the same document evaluated through `{ through }` a
      fortnight apart returns different lists in both directions — the turnaround fires today and
      fired for nobody two weeks ago, because two weeks ago that student was still on the concern
      list. **A fixture built to move is not evidence that a real class moves**, which is the whole
      of what this line asks. Re-run it against the owner's own five classes after ~Sep 16.)*
- [x] A student with a perfect record but no improvement does not dominate the list.
      *(Measured. The fixture's student has every assignment in, every score at or above 90 and
      every meeting attended, and she sorts **last of five** — under both climbers, under the
      turnaround, and under the failing student who has simply handed everything in. She is still
      **on** the column rather than dropped from it: a level is worth saying, it is just not worth
      the strong position.)*
- [x] Every praise hit's explanation contains the delta and the window it was measured over.
      *(Swept over all **fourteen** praise hits the fixture produces, across all five rules, then
      pinned by three hand-written sentences matching character for character. **Read the sweep's
      own terms before treating this as unqualified**: two of the five rules publish a
      before-and-after delta — `grade-rose` in points and `turnaround` in rules cleared — and the
      other three measure a level or a count and have none to state. **The drawing's caption is the
      principle, not the count** — *"four rules have no delta, and they say a count instead"* reads
      across **both** columns and two of its three examples ("5 absences", "61%") are concern-side.
      It establishes that a count is a legitimate figure where there is no before-and-after; the
      number on the praise side is **three of five**. What every one of the
      fourteen carries is **the figure the rule measured and the window it measured it over**, both
      asserted per hit. If the owner reads the line as requiring a numeric delta on all five, this
      box goes back to `- [ ]` and the three level rules need a decision this work order did not
      make.)*

**Where this stands.** The build is complete and both tools are green on the delivered tree —
`verify-shell.mjs` at `1156 checks · 1156 passed · 0 failed · 0 skipped`, 384s, exit 0, and
`wo-sweep.mjs` at `33 checks · 29 passed · 0 failed · 4 to review`, all four pre-existing or answered
at the check. The column is measured in § *"the praise column, drawn (WO-4.3)"* at the foot of the
harness, fifteen checks against a fixture built for it, and two mutations were run and reverted (see
`tools/README.md`). **Four of the five Acceptance lines are closed; the third is calendar-bound and
says so above.** **The 👤 sitting was run by the owner on 2026-08-25 and all eight readings
passed** — `TESTING.md` § WO-4.3 carries them. The two that mattered most both held: the columns are
readable at equal width on a real iPad in both orientations, so the breakpoint did not need moving,
and the one-column drop with praise drawn first was not found infuriating — the drawing's argument
surviving a thumb rather than being taken on trust. **So one box stands between this and ✅, and
nobody can hurry it:** Acceptance line 3 wants a fortnight of a real term, ~Sep 16.

**Traps** — the delta is the ranking *and* the only bold figure on a praise row; the current grade
is not drawn on the row at all. And the turnaround is derived at read time from the evaluator's own
`{ through }`: **there is no "was flagged" bit anywhere in the document and there must never be one.**

---

## WO-4.4 — Behavior & note logging

**Ship** 3 · **Status** ✅ DONE — 2026-08-24 · **Size** S · **Depends on** WO-1.7
**Closes roadmap** Phase 4 → "Behavior/note logging fast enough to do mid-class."

**Why it exists.** The behavior signals have no input without it, and a logging flow that takes
thirty seconds will never be used during a class period.

**Deliverables**
- Append to `log[]` per the data model: `{ id, studentId, at, kind, audience, subject, body }` with
  `kind: "behavior" | "note"`.
- **Append-only.** Roll Call! made hall passes append-only after matching rows by `name + time`
  proved fragile; same reasoning, same answer. Corrections are new entries, not edits.
- Two taps from a class roster to a logged entry, with optional detail.
- Log visible on the student record, newest first.

- **Surface: a modal sheet off the roster row, and a card on the student record** — drawn in
  [`design/mockups/behavior.html`](../../design/mockups/behavior.html). The door is on the **roster**
  and deliberately not on the attendance registry: that row is the critical path by the working
  agreements, and a fourth control on it competes with the tap that marks a student present. Two taps
  means the quick entries write a **complete** record on their own — kind from the strip, subject from
  the chip, time now — with the two fields under them as this work order's "optional detail". The
  drawing also settles that the record card is another `.detail-card` on WO-3.7's screen, newest
  first, and that it is **absent rather than redacted** in presentation mode: a card that redacts its
  bodies still tells a room of thirty that four things have been written down. The suppression is
  asked of `src/supports.js` and not tested here — two askers is two answers eventually.
- **Decided: six pre-written quick entries, and one rule that keeps the back door open** *(the
  owner, 2026-08-20)*. They ship fixed, needing no schema — and **a chip writes a `subject` and never
  a code.** That single constraint is what makes a per-teacher list later a settings block and a
  picker rather than a migration: a written entry is indistinguishable from a typed one the moment it
  lands. The six, in this order: *Off task · Phone out · Disruptive · Showing improvement · Great
  contribution · Helped someone*. **Both directions belong in this sheet** and the middle ground sits
  fourth, which is the first slot after the conduct entries and the one a thumb reaches without
  reading to the end — the phase's own argument at chip scale.
- **Decided: append-only stands, and there is no correction mechanism to build** *(the owner,
  2026-08-20, after a round trip)*. A correction is **an ordinary later entry that says so**: no
  `correctsId`, no strikethrough, no schema change, and no rule about which of two entries a reader
  should believe. The ruling first arrived as *"don't worry about corrections — you can just delete
  and re-enter"*, which would have reversed this work order's Append-only deliverable, its acceptance
  line *"entries are never mutated or deleted"*, and `docs/data-model.md` § log in one move. Put back
  to the owner the same day and settled the other way. **Nothing in the log is deletable**, the Roll
  Call! hall-pass scar behind that rule is untouched, and the acceptance line below stands as written.
- **Decided: behavior entries and notes part company under a projector** *(the owner, 2026-08-20)*.
  Behavior entries are **not built** in presentation mode — absent from the DOM, WO-1.9's standard,
  not redacted and not counted. **Notes to self stay**: they are the teacher's working memory and
  suppressing them costs her the half of the card that has nothing to do with conduct. The card
  therefore survives with fewer entries and **no "2 hidden" line**, because a count is the
  disclosure. Two consequences for the build: `src/supports.js` still owns the answer and the card
  still asks rather than testing presentation mode itself, so what changes is the shape of what the
  model hands back; and the **kind strip comes before the words** in the sheet, which is what makes
  "this may end up on a wall" a decision rather than an accident.
- **Decided: *N* is the attendance rule's own N** *(the owner, 2026-08-20)*. **No new threshold
  key.** The prompt fires on the number *N absences within the last N meetings* already uses — `4` by
  default, and whatever the teacher has since made it — read through `thresholdsOf()` like every
  other. A teacher who loosens her attendance signal loosens this prompt with it, and the two can
  never disagree about what "too many" means.
- **Settled: it is a free-text field, `supports.attendanceClause`** *(the implementer, 2026-08-24,
  the one question this work order owned)*. Free text beside `medical` and `behaviorPlan`, holding
  what the plan says about this student's attendance. **A thirteenth accommodation KIND was the
  alternative and it is refused**, for a reason that is about the other prompt rather than about this
  one: an accommodation row is scoped by `appliesTo`, which names kinds of WORK, and its documented
  default — *empty means everything* — would make every such row fire WO-3.8's assignment-editor
  summary on every assignment in the year. Stopping that takes a rule about one kind living in a
  second file, asked by a prompt that has nothing to do with attendance. The name is
  `attendanceClause` and not `attendance` because this app already has attendance and the shorter
  name is one a grep will misread; not `attendancePlan`, because that reads as a separate document.
  `docs/data-model.md` § Accommodations carries the ruling, and `docs/FERPA.md`, `privacy.html` and
  the backup panel name the new field in the same sitting per `CLAUDE.md` § Accommodations. The
  component was not in question and was not touched — the prompt wears WO-3.8's shipped
  `.accommodation-prompt` whole, which is also what gives it that component's unconditional
  `@media print { display: none }` for nothing.

**Acceptance**
- [x] An entry is logged in under five seconds from the roster.
      *(**The taps were measured and the clock was not, until 2026-08-24.** The harness opens the
      roster, taps the ✎, taps a chip and reads a complete record off the document — two taps, sheet
      closed. The five seconds are a stopwatch and a thumb: **run by the owner on the iPad on
      2026-08-24 and green**, with the clock started at the HOME SCREEN rather than at an open
      roster, so the two taps the drawing's caption worried about are inside the number instead of
      excluded from it. All nine readings of that sitting passed; `TESTING.md` § WO-4.4 carries them.)*
- [x] Entries are never mutated or deleted — verify by inspecting the document after a "correction".
      *(Measured the way the line asks: an entry is read field by field, a correction is written
      through the sheet, and the earlier one is compared byte for byte afterwards. Plus a structural
      reading — `src/log.js` does one `push` and holds no `splice`, `pop`, `shift`, `delete`, no
      assignment into `log[...]`, and no reassignment of `log` **other than the create-on-first-write
      guard `if (!Array.isArray(d.log)) d.log = [];`**, which is CLAUDE.md's own rule and can only
      fire where there is no array to take an entry away from. That exemption is named in the check
      rather than assumed by it: the first cut of the token list caught the guard, called correct code
      a remover, and had no token at all for the `log[...] =` this check was written for.)*
- [x] Behavior entries feed WO-4.2's behavior rule and the count matches.
      *(Measured against a fixture where three different mistakes give three different wrong numbers
      — an entry outside the window, a note rather than an incident, and four that count. The rule
      answers 4 of 6 entries held, its sentence prints the same 4, and a student holding one against
      a threshold of two is not on the list. Asserted with presentation mode ON as well: the mode
      decides what a screen may draw and never what a rule counts.)*
- [x] Behavior notes are suppressed in presentation mode.
      *(Measured as an absence from the whole rendered page rather than as a hidden element, with
      the note to self still there — the owner's ruling of 2026-08-20. No count and no "hidden"
      line, and **the empty sentence is the same sentence in both modes**, so a card whose every
      entry is suppressed cannot be told from one with none.)*
- [x] Marking a student absent for the Nth time surfaces an attendance-related plan clause if one
      exists, and nothing appears in presentation mode. *(Re-homed from WO-3.8, 2026-08-13. That work
      order built the accommodation prompt in the assignment editor and could not build this half:
      `supports` has no attendance-clause field to read and `signals` has no threshold to compare
      against, so the clause and its N are both this work order's to shape. `src/attendance.js` and
      its counts have shipped — the behavior log was never what it was waiting on.)*
      *(Measured through the real cells, with three negatives beside the yes: a student with the same
      absences and an empty clause gets no box, a mark that is not an absence takes the box away, and
      with the mode on `paintAbsencePrompt()` returns false while `toggleAbsenceClause()` called
      straight through the seam puts nothing on the page. The clause is not in the DOM until the
      reveal is tapped. **The thumb readings are 👤** — `TESTING.md` § WO-4.4.)*

**Where this stands. Closed 2026-08-24.** Both tools are green — `verify-shell.mjs` at
`1141 checks · 1141 passed · 0 failed · 0 skipped` (32,219 lines, 390s, exit 0) and `wo-sweep.mjs`
at `33 checks · 30 passed · 0 failed · 3 to review`, all three of those pre-existing and none of
them this work order's. **All five Acceptance lines are closed, and the 👤 sitting is green** —
nine readings run by the owner on the iPad the same day, written up in `TESTING.md` § WO-4.4. Two
shipped checks were **re-cut in place** rather than deleted: WO-4.2's *"the behavior rule is inert"*,
which now asserts that `inertRules()` is empty and that the notice went because the rule landed; and
WO-2.26's *"last in the right-hand column"*, because the log card is under the hall-pass card now.

*(**The dispatch that built this was killed by a session limit at the orchestrator**, after the
implementer's writes had landed and before anything was verified — the third dead dispatch in this
file's history and the first whose prose reported a run. It left a finished status paragraph claiming
both tools green at `1140 · 1140 · 0` and `30 passed · 0 failed`, with four of five Acceptance boxes
ticked under it. **Neither tool had been started.** The real tree read `1141 · 1137 · 4 failed` and
`29 passed · 1 failed`. Three of the four failures were the dispatch's own new checks going red on
correct code — a `.log =` remover token catching the create-on-first-write guard, a print check
reading `textContent` where the gate is CSS, and a CSV check stringifying a `{ name, text }` return
and searching `[object Object]`. **The fourth was real**, and it is the one worth keeping: entries
sorted newest-first by a second-granular stamp under a stable sort came back in write order, so a
correction written seconds after the entry it corrects sorted underneath it — the owner's own
append-only ruling broken by clock precision. `src/log.js`'s `entriesOfKind()` carries the scar and
`plans/dispatch-retro.md` § "The result paragraph that reported a run nobody had started" carries the
lesson. The recovery also discharged WO-3.8's **Owes** pointer, which the dispatch had left standing
after ticking the box that paid it, and wrote the `CHANGELOG.md` entry it never made.)*

*(**One observation from the 👤 sitting, and it is the ruling rather than a defect** — the owner,
2026-08-24: notes to self do not blank under a projector. That is `logKindVisible()` returning `true`
for `note` unconditionally, which is the 2026-08-20 call working as specified. **What the sitting did
not settle is whether the premise holds**: a note is free text whose placeholder invites *anything you
want to remember*, so nothing enforces that it is not about the child, where a behavior entry is
structurally about conduct. Left as found, recorded in `CLAUDE.md` § Accommodations as a known open
edge rather than a bug. Reversing it is the owner's call and costs the useful half of the card; the
cheaper shape if it is ever reversed is a per-entry "keep this off the wall" toggle at write time,
which puts the judgement where the knowledge is. **Not booked.**)*

---

## WO-4.5 — Cooldown & the quiet middle

**Ship** 3 · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-4.2, WO-4.3
**Closes roadmap** Phase 4 → "Contact cooldown" and "The quiet middle."

**Why it exists.** Without the cooldown the list is identical every week, the teacher stops reading
it, and the feature dies — quietly, and without anyone deciding to kill it. The quiet middle is the
other half of the same insight: the students a busy teacher genuinely loses track of are neither
failing nor excelling, and no threshold will ever surface them.

**Deliverables**
- Cooldown: read the outreach `log`, suppress any student contacted about the same signal within
  N days (default 14). Configurable, per the thresholds block.
- Suppressed hits are **hidden, not deleted** — a way to see "3 suppressed by cooldown" and expand.
- The quiet middle: students neither flagged, nor praised, nor contacted all term, listed per class
  with how long it's been.
- Both surfaced on the home screen slot from WO-1.10.

- **Surface: the foot of each of WO-4.2's two columns, and a panel for the quiet middle** — drawn in
  [`design/mockups/signals.html`](../../design/mockups/signals.html). A suppressed row **names the
  contact that silenced it and the date it comes back**, because "3 suppressed" with no names is
  indistinguishable from a list that has quietly lost three students. The quiet middle is a **third
  list and not a third column**: it is ranked by how long it has been rather than by delta, and
  putting it beside two columns that share a ranking would imply it shares one.
- **Decided: *Write anyway* exists** *(the owner, 2026-08-20)*. The cooldown suggests; it does not
  hold the door shut. What keeps it from dissolving the cooldown is **where it sits** — quiet, at the
  end of a muted row, behind an expansion the teacher opened on purpose: three deliberate acts
  against one tap for the rows the engine wants read. A teacher who has just had a phone call has a
  real reason to write again, and a feature that tells her she may not is one she routes around
  outside the app.
- **Decided: the quiet middle is a panel on WO-4.2's screen** *(the owner, 2026-08-20)*. Under the
  two columns, so that view has one state and the switcher never has to say which of two you are on.
  **The consequence is WO-6.4's:** the glance page's `The quiet middle · N` control is a **door onto
  that screen**, landing there and scrolled to this panel — not a surface of its own and not a modal.
  One list, one place, two ways in.

**Acceptance**
- [ ] Logging a contact about a concern removes that student from that signal for 14 days and not
      from other signals.
- [ ] The cooldown reads the log rather than a separate suppression store — verify by restoring a
      backup and confirming cooldowns survive.
- [ ] The quiet-middle list excludes anyone flagged, praised, or contacted this term.
- [ ] Two consecutive weekly runs on real data produce visibly different concern lists.
- [ ] Suppressed hits are recoverable and counted, never silently dropped.

**Traps** — Cooldown keyed on the student rather than the *signal* will hide a new problem because
you emailed about an old one. Key on `student + rule`.
