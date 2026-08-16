# Phase 4 work orders — Signals: concern **and** praise

**Phase goal:** open the app and see who needs you today — in both directions.

Ship 3, target October 2026 — deliberately after 4–6 weeks of real data exist to run the rules
against. Building these in August means tuning thresholds against nothing.

**The praise half is not decoration.** It is what makes this a teacher's assistant rather than a
gradebook with alarms. And it has a design trap that kills it: **rank by delta, not by level.**

Thresholds and defaults are specified in [`../../docs/data-model.md`](../../docs/data-model.md)
§ Signal thresholds. Implement those numbers as defaults, all of them editable.

---

## WO-4.1 — Signal engine & thresholds

**Ship** 3 · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-2.4, WO-3.4
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
- [ ] Every threshold is editable and persists through save, reload, and a backup round-trip.
- [ ] The evaluator returns both directions from a single pass.
- [ ] A student appearing on both lists renders on both, with different explanations.
- [ ] Every hit carries real numbers; no explanation contains a placeholder or a rounded lie.
- [ ] All windows are expressed in meetings. Grep for any day-based window and remove it.

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
