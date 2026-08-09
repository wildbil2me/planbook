# Phase 6 work orders — Calendar & the glance page

**Phase goal:** open the app at 7:40am and know what the day asks of you.

Branch: `phase/6-calendar-glance`. Deliberately late: **the glance page comes after the things it
glances at.** Build it before signals and outreach exist and you build it twice.

Most of this calendar is **free** — assignment due dates, term boundaries, and which classes met or
were dropped are already stored by Phases 2 and 3, and WO-2.3 already authors days off and
pre-drops. This phase adds the month view over that same data plus the remaining event kinds.

Two rules govern the phase:

- **Derived events are never copied into the events list.** Move an assignment's due date and the
  calendar must follow by itself; a stored copy creates two truths, and the one the teacher isn't
  looking at is the wrong one.
- **The glance page is a launcher, not a report.** If an item can't be acted on, it doesn't earn a
  place.

---

## WO-6.1 — Event model & authoring

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-2.3
**Closes roadmap** Phase 6 → "Event model: date or range, title, kind, optional class and student.",
"Grades-due deadlines", "IEP/504 review dates", "Recurring events by materializing instances."
*(the first fragment stopped at the two words `Event model` until 2026-08-08, WO-2.15 — under twelve
characters once normalised, which the matcher refuses as too short to be safe. Anything in double
quotes on this line is read as a fragment, so a note about one is written in backticks.)*

**Why it exists.** WO-2.3 built the `no-school` and `dropped` kinds because attendance needed them.
This completes the model with the kinds a teacher types in for their own sake — and with the two
date kinds that carry real consequences if missed.

**Deliverables**
- Full `events[]` per the data model: `{ id, date, endDate, kind, title, classIds, studentId,
  notes }`, kinds `no-school | dropped | early-release | grades-due | conference | meeting | trip |
  reminder`.
- Authoring UI for all kinds, with ranges.
- **Grades-due as a first-class kind with a lead-time warning.** Re-keying into the SIS is a
  scheduled job, not something you remember.
- **IEP/504 review dates surfaced ahead of time, in presentation-mode-safe form** — a date and a
  student, never the plan type, and suppressed entirely in presentation mode.
- **Recurring events materialize** into individual entries ("repeat weekly until 2026-12-19")
  rather than storing a recurrence rule. Flat, hand-editable, and one instance can move without
  reasoning about exceptions. *RRULE is V2, if ever.*

**Acceptance**
- [ ] Every event kind can be created, edited, and deleted, with and without a range.
- [ ] A weekly recurrence produces N independent entries; moving one moves only that one.
- [ ] Deleting a materialized series is possible without deleting each instance by hand.
- [ ] A grades-due event warns at its configured lead time.
- [ ] A review date shows as "review coming up" with no plan type visible, and vanishes entirely in
      presentation mode.
- [ ] `no-school` and `dropped` behave exactly as WO-2.3 established — no regression.

---

## WO-6.2 — Derived events

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-6.1, WO-3.3
**Closes roadmap** Phase 6 → "Derived events computed at render from assignments, terms, and the
schedule — not stored." *(the fragment elided the middle of the box until 2026-08-08, WO-2.15. An
ellipsis inside a fragment matches nothing: `norm()` strips it rather than wildcarding it, so a
fragment may stop early but may never skip a middle.)*

**Deliverables**
- Computed at render, never stored:

  | Shown on the calendar | Read from |
  |---|---|
  | Assignment due dates | `assignments[].due` |
  | Term start and end | `classes[].terms[]` |
  | Which classes met, and which were dropped | `attendance[]` |
  | IEP/504 review dates | `students[].supports.reviewDate` |

- Visual distinction between authored and derived items — a derived item is edited at its source,
  and tapping it should go there.

**Acceptance**
- [ ] Changing an assignment's due date moves it on the calendar with no other action.
- [ ] `events[]` contains no derived entry. Inspect the document after using the calendar heavily.
- [ ] Tapping a derived due date opens the assignment, not an event editor.
- [ ] Review dates on the calendar are presentation-mode safe.

---

## WO-6.3 — Month & week views

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-6.2
**Closes roadmap** Phase 6 → "Month and week views, filterable by class."

**Deliverables**
- Month view and week view over authored plus derived events.
- Filter by class; the owner teaches five and rarely wants all of them at once.
- Tap-through from any item to the thing that resolves it.
- Touch and keyboard paths; the coarse-pointer block.

**Acceptance**
- [ ] A month with a break, two pre-drops, six assignments, and a grades-due deadline renders
      legibly on an iPad without horizontal scrolling.
- [ ] The class filter applies to derived items as well as authored ones.
- [ ] A month with nothing in it shows an honest empty state.
- [ ] Every item taps through to its source.

---

## WO-6.4 — The glance page

**Ship** — · **Status** ⬜ NOT STARTED · **Size** L · **Depends on** WO-6.3, WO-4.5
**Closes roadmap** Phase 6 → "The glance page" and "Honest empty states."

**Why it exists.** This is what WO-1.10's home screen has been accreting toward since Phase 1. It
is a **launcher, not a report** — every item taps through to the thing that resolves it.

**Deliverables** — in the order a teacher needs it at 7:40am:
1. **Every class with today's state — taken · dropped · not yet** — each with a one-tap fix.
2. Today's and this week's events.
3. What's waiting to be graded.
4. Who needs attention — concern and praise, post-cooldown, from WO-4.5.
5. Deadlines closing in, including grades-due lead times.

Plus: **honest empty states.** A quiet day says "nothing needs you today", not five empty panels.

**Acceptance**
- [ ] The five sections appear in that order, and every item in every one taps through.
- [ ] The today-state row is correct against a day with a mix of taken, dropped, and untaken classes.
- [ ] A day with nothing pending renders one honest message, not five empty panels.
- [ ] The praise list is present and delta-ranked — not buried behind the concern list.
- [ ] Nothing on the page displays `supports` data, in presentation mode or out of it.
- [ ] The page loads in under a second on an iPad with a full year of data.

**Traps** — Every section here is a summary of something built earlier. If any of it recomputes
grades, attendance percentages, or signals rather than calling WO-2.4 / WO-3.4 / WO-4.1, you have
created a second answer that will eventually disagree with the first.
