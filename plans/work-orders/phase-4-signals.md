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

**What the drawings do NOT settle, and what happens if this list is ignored.** WO-1.25's ruling is
that a drawing is not a work order: the questions it raises are answered here or they are not
answered, and an amber note on a picture is not a tracker. Four are the owner's and are carried into
the work orders below as **Open** lines. The one that is not merely cosmetic:

- **What makes one concern worse than another** (WO-4.2). "Ordered by severity" appears in that work
  order and severity across rules is defined nowhere — a 12-point fall against five absences against
  a 61% that has been 61% all term. The drawing invents an order and says so. **This one changes what
  the engine returns, not only what a screen draws.**
- **Whether the signals screen closes or redacts in presentation mode** (WO-4.2). Every other surface
  in the app redacts; this is the only one whose whole content is a ranked list of named students in
  trouble, and it is drawn refusing to open.
- **Whether a suppressed row may be overridden** (WO-4.5) — without it a cooldown is a lockout, with
  it the feature is one tap from being ignored.
- **Whether the log sheet's quick entries are fixed or the teacher's own** (WO-4.4) — fixed needs no
  schema; editable is a settings block and a `docs/data-model.md` change.

The other five are collected in [`design/mockups/README.md`](../../design/mockups/README.md) § Phase 4,
with the two things the drawings assume without asking — one of which is that the absence prompt in
WO-4.4 has a field to read, and it does not.

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

**Ship** 3 · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-4.1
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
- **Open, and both are the owner's** *(from the drawing, 2026-08-20)*. **(a) What severity means
  across rules** — this work order says "ordered by severity" and nothing defines it; the drawing
  invents real-deltas-first and says so, and whichever order is chosen is a property of what the
  engine returns rather than of the screen. **(b) Whether the switcher can carry a fifth segment at
  390px** — `.screen-nav` is `overflow-x: auto`, so a fifth scrolls silently, which is WO-6.6's own
  trap one segment further along. The drawing measures both states and proposes `flex-wrap: wrap`,
  which is one declaration in `src/assignments.css` and therefore this work order's to make, not a
  drawing's.

**Acceptance**
- [ ] Every flag is reproducible by hand from the numbers it shows. Verify all nine.
- [ ] "Fell N points" measures the weighted grade before and after the window, not raw scores.
- [ ] Consecutive-absence counting skips dropped days and untaken days rather than breaking on them.
- [ ] A student with no graded work does not appear on the grade-below rule.
- [ ] Editing a threshold changes the list immediately.
- [ ] The behavior rule is inert until WO-4.4 exists, and says so rather than erroring.

**Traps** — "N consecutive absences" over a rotating schedule means consecutive *meetings of that
class*. Three absences across three weeks of a twice-weekly section is still three consecutive.

---

## WO-4.3 — Praise signals

**Ship** 3 · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-4.1
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

**Acceptance**
- [ ] Sorting the praise list by its default ranking puts the biggest *improvement* first, not the
      highest grade. Verify with a case where a B− student outranks an A student.
- [ ] The turnaround rule fires for a student who was on the concern list and no longer is.
- [ ] Running the praise list two weeks apart on real data surfaces a materially different set of
      students. *(If it doesn't, the ranking is wrong — this is the acceptance test that matters.)*
- [ ] A student with a perfect record but no improvement does not dominate the list.
- [ ] Every praise hit's explanation contains the delta and the window it was measured over.

---

## WO-4.4 — Behavior & note logging

**Ship** 3 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-1.7
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
- **Open, and the drawing could not choose either** *(2026-08-20)*. **(a) Are the six quick entries
  fixed or the teacher's own?** Fixed needs no schema — they write the documented `subject`. Editable
  means a per-teacher list, which is a settings block and a `docs/data-model.md` decision. **(b) How
  does a correction point at what it corrects?** Append-only means a wrong entry stays, and the
  drawing strikes its subject through and puts the correction in the body — which implies a field the
  record does not have. The alternative is an ordinary later entry that simply says so, which needs no
  schema and cannot draw the strikethrough. Either way it is a data-model change, and this work order
  owns it.
- **And the prompt this work order owes has nothing to read yet.** The re-homed line below wants an
  attendance-related plan clause and an *N*; `students[].supports` has no such field and the
  thresholds block has no such key. The drawing wears WO-3.8's shipped `.accommodation-prompt`
  component whole — same sentence-then-scope shape, same single reveal, same hard suppression in the
  projected and print paths — so what is left to decide is the data, not the component.

**Acceptance**
- [ ] An entry is logged in under five seconds from the roster.
- [ ] Entries are never mutated or deleted — verify by inspecting the document after a "correction".
- [ ] Behavior entries feed WO-4.2's behavior rule and the count matches.
- [ ] Behavior notes are suppressed in presentation mode.
- [ ] Marking a student absent for the Nth time surfaces an attendance-related plan clause if one
      exists, and nothing appears in presentation mode. *(Re-homed from WO-3.8, 2026-08-13. That work
      order built the accommodation prompt in the assignment editor and could not build this half:
      `supports` has no attendance-clause field to read and `signals` has no threshold to compare
      against, so the clause and its N are both this work order's to shape. `src/attendance.js` and
      its counts have shipped — the behavior log was never what it was waiting on.)*

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
- **Open, and both are the owner's** *(2026-08-20)*. **(a) Should a suppressed row carry a
  *Write anyway*?** Drawn with one, quietly. Without it this is a lockout rather than a cooldown, and
  a teacher who has just had a phone call has a real reason to override; with it, the feature that
  stops the weekly list being identical is one tap from being ignored. **(b) Is the quiet middle a
  panel on this screen or a page of its own?** The drawing shows it both ways — as a panel here, and
  reached through a `The quiet middle · 9` control in a panel header on the glance page — and both
  cannot be right.

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
