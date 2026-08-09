# Planbook — Product Roadmap to 1.0.0

Goal: take Planbook from nothing to a gradebook and outreach assistant a stranger can install and
trust with a year of student data.

The arc: **absorb attendance → build grading → surface the students who need attention (in both
directions) → contact home → land on a page that shows the week at a glance.**

**This app goes live in a real classroom in late August 2026.** That decision — made 2026-08-03,
with the risk stated and accepted — reorders everything below. See
[Delivery plan](#delivery-plan--live-late-august-2026).

---

## Work orders

Every phase below is cut into work orders in [`work-orders/`](work-orders/) — 58 of them, each with
its own dependencies, deliverables, and testable acceptance criteria. **Start there when you sit
down to build something**; this roadmap says what and why, the work orders say how the work is cut
and in what order.

- [`work-orders/README.md`](work-orders/README.md) — the index, the dashboard, and the day-by-day
  Ship 1 sequence
- [`work-orders/gates.md`](work-orders/gates.md) — the three ship gates and the 1.0.0 call

A work order that contradicts this roadmap is wrong. Keep both ticked together.

---

## Maintenance protocol — read before working a phase

Same discipline as Roll Call!'s `plans/roadmap2.md`, because it works:

1. Tick the box (`- [ ]` → `- [x]`) when the work lands **and** its `TESTING.md` items pass.
2. Append an *(italic paren note)* whenever the outcome differed from what the plan predicted.
3. Update the phase's row in the dashboard.
4. Add a `CHANGELOG.md` entry under `## [Unreleased]`.

**Do not tick a box for work that is written but unverified.** Written-but-unproven is still `- [ ]`.

**Status vocabulary:** `⬜ NOT STARTED` · `🔨 IN PROGRESS` · `✅ DONE — <date>` · `🚧 BLOCKED` · `🔒 GATED`

🚩 marks a **go-live blocker** — it must work before students walk in.

---

## Progress dashboard

| Phase | What | Status | Progress |
|---|---|---|---|
| 0 | Architecture & data model | ✅ DONE — 2026-08-03 | 4/4 `[██████████] 100%` |
| 1 | Shell, store, roster | ✅ DONE — 2026-08-06 | 12/12 `[██████████] 100%` |
| 2 | Attendance | 🔨 IN PROGRESS | 12/16 `[████████░░] 75%` |
| 3 | Gradebook | ⬜ NOT STARTED | 0/10 `[░░░░░░░░░░] 0%` |
| 4 | Signals — concern **and** praise | ⬜ NOT STARTED | 0/8 `[░░░░░░░░░░] 0%` |
| 5 | Outreach | ⬜ NOT STARTED | 0/9 `[░░░░░░░░░░] 0%` |
| 6 | Calendar & the glance page | ⬜ NOT STARTED | 0/8 `[░░░░░░░░░░] 0%` |
| 7 | Drive sync (opt-in) | 🔒 GATED — needs OAuth verification | 0/7 `[░░░░░░░░░░] 0%` |
| 8 | 1.0 packaging | ⬜ NOT STARTED | 0/8 `[░░░░░░░░░░] 0%` |
| | | **Overall** | **28/82 `[███░░░░░░░] 34%`** |

*Corrected 2026-08-08, by hand, after WO-2.5. Phase 1 had read `🔨 IN PROGRESS · 11/12` since it
closed on 2026-08-06 — there was never a twelfth unticked box. Phase 2 was stale by one before
WO-2.5's tick made it two. The overall row said 22/81 while its own rows summed to 25/82: three
wrong numerators and a denominator wrong independently of them. **This table is maintained by hand**
— step 3 of the protocol above — and `wo-gate.mjs` only ever writes the dashboard in
`work-orders/README.md`, so nothing catches it drifting. A report-only drift check is booked as a
deliverable of WO-2.15; until it lands, these numbers are worth recounting rather than trusting.*

---

## Delivery plan — live, late August 2026

Three weeks to day one. The scope that fits is narrower than Phases 1–2, so the cut lines are
drawn here rather than discovered at 11pm on August 23rd.

| Gate | By | What must work |
|---|---|---|
| **Ship 1 — Day one** 🚩 | ~Aug 24 | Install + backup/restore · classes & terms · roster incl. accommodations · attendance marking with one-tap drop · days off · today's state on the home screen |
| **Ship 2 — First grades** | ~Sep 15 | Categories & weights · assignments · score entry with late/missing · weighted grade · letter scale |
| **Ship 3 — Signals** | October | Concern and praise lists, once there are 4–6 weeks of real data to run them against |
| Then | Nov → | Outreach, calendar & glance page, sync, packaging |

**What is deliberately cut from Ship 1**, and why it's safe to cut:

- **The Roll Call! importer.** August is a fresh year with fresh rosters — they get pasted, not
  imported. The importer is for *historical* data and can land any time before it's wanted.
- **Print and CSV output.** Nothing needs printing in week one.
- **Per-student attendance history views.** The data is being recorded; the views can follow.
- **Accommodation prompts at point of use.** The *fields* are Ship 1 (a teacher is legally
  obligated from day one); the contextual prompts are Ship 2.

### The risk, stated plainly

A three-week-old app will be holding a live term of attendance. Two things make that acceptable
rather than reckless, and both are load-bearing:

1. **Roll Call! still works.** It is the fallback, unchanged and deployed. If Planbook stumbles in
   week two, attendance goes back to Roll Call! and nothing is lost. **Do not decommission it.**
2. **Backup and restore ship before anything that creates data** — they are the first items in
   Phase 1, not a Phase 8 formality. The rule: *no feature that writes student data lands before
   the path that gets it back out.*

**The riskiest thing on day one is the attendance ledger itself** — not a schedule, since there
isn't one ([`rotating-schedule.md`](rotating-schedule.md)). What must be right before students walk
in is narrow and testable: a mark lands and survives a reload, a dropped class is distinguishable
from an untaken one, and the percentage matches a hand count. Verify all three against a real class
before trusting it with a term.

---

## Order of work

**1 → 2 → 3 → 4 → 5 → 6 → 8**, with **7** slotted in wherever its external gate opens.

**Storage before features.** Roll Call!'s release criteria name data loss as "the only true blocker
for *any* release." Planbook's version is iOS evicting IndexedDB from a non-installed site after
~7 days. The install warning and backup path get built while there is nothing yet to lose.

**Attendance before grading.** It's the daily-touch surface, it's the flow that must be fastest,
and it's the one that already exists in proven form to port.

**Signals before outreach**, because a draft is worthless if the list of who to write to is wrong.

**The glance page comes after the things it glances at.** Build it before signals and outreach
exist and you build it twice. What ships from Phase 1 onward is a *home screen that accretes*.

**Sync last, but started early.** Phase 7 is `🔒 GATED` on Google OAuth verification, which is
calendar-bound rather than work-bound. **Kick the paperwork off during Phase 3.** Until it lands,
the Phase 1 export file is the iPad story: crude, manual, and real.

---

## Phase 0 — Architecture & data model ✅

**Goal:** decide the things that are expensive to change later, and write down why.

- [x] **Architecture settled** — local-first PWA, one OAuth scope, no backend, no Apps Script.
      [`../CLAUDE.md`](../CLAUDE.md) records the reasoning, not just the choice, because each
      rejected option looks reasonable again in isolation.
- [x] **Data model** — [`../docs/data-model.md`](../docs/data-model.md). One JSON document per
      year: grades, attendance, accommodations, events, templates, thresholds.
- [x] **Sync design** — [`../docs/sync.md`](../docs/sync.md). `drive.file` only, whole-document
      last-writer-wins, conflicts kept rather than merged.
- [x] **Schedule decision record** — [`rotating-schedule.md`](rotating-schedule.md). A cycle model
      was designed and removed the same day. *The record exists because the next session will want
      to build one.*

---

## Phase 1 — Shell, store, roster

**Goal:** the app installs, holds data, survives everything, and can hand that data back.

- [x] 🚩 PWA shell: manifest, service worker, offline app shell, home-screen install. Verify on
      **iPad Safari** — that's the install target that matters.
- [x] 🚩 IndexedDB store: one year document, load-on-open, save-on-change, `rev` increment.
- [x] 🚩 **Backup: one-click JSON download**, plus a nag when the last one is >7 days old.
      *(The nag stays down for a document with nothing in it yet.)*
- [x] 🚩 **Restore: drop a backup file**, with a confirm step naming what's being replaced.
      *Nothing that writes student data lands before this works.* *(Reached from a header button
      rather than the component shelf, and from the boot-failure screen — a recovery path that
      disappears when the app won't boot is not one. The gate is open as of 2026-08-04.)*
- [x] 🚩 Install detection + plain-language warning when running uninstalled — the iOS eviction
      hazard is data loss, not a nicety.
- [x] Lift the frame from Roll Call!'s `design/starter-template.html` and
      `design/portable-components.md`: navy gradient header, white rounded panels, two-row header,
      modal system, save indicator. Rename, `planbook_` prefix.
- [x] 🚩 Class management: create/rename/reorder five-plus classes; term structure per class
      (quarters / semesters / trimesters — never hardcode Q1–Q4). *(Reorder is explicit up/down
      arrows rather than drag — a drag handle fights the scroll of the strip it lives on, and
      arrows are measurable by the 44px pass. Archive and delete are separate operations: archive
      keeps everything and only leaves the tab bar, and delete is offered only on an archived row.
      Term dates are labels on a range — never sorted, never validated, and an empty one is valid,
      which is `plans/rotating-schedule.md` staying deleted.)*
- [x] 🚩 Roster: paste `Last, First`; guardian, counselor, and email fields editable.
- [x] 🚩 **Accommodations on the roster** — IEP/504 plan, accommodation list, medical, behavior
      plan, case manager, review date. Per [`../docs/data-model.md`](../docs/data-model.md).
- [x] 🚩 **Presentation mode** — a global toggle suppressing every sensitive field at once, plus
      discreet-by-default display of accommodations (indicator only; details on deliberate tap).
      Teachers project these screens onto classroom walls.
- [x] 🚩 Home screen v0: **every class in one tap** — the owner's founding requirement. This screen
      accretes through every later phase and becomes Phase 6's glance page.
- [x] **Start `TESTING.md` and `CHANGELOG.md`.** The maintenance protocol above demands both from
      the very first ticked box, so they cannot wait for Phase 8. Both accrete: every phase adds
      its checks and its entries as it goes.

---

## Phase 2 — Attendance

**Goal:** the owner stops opening Roll Call!.

**There is no schedule model** — a class met if it has an attendance record without an exception.
The decision record is [`rotating-schedule.md`](rotating-schedule.md); read it before anyone
proposes a cycle, a rotation, or a meeting pattern. *(A cycle model was designed and removed the
same day, 2026-08-03: the owner's rotation changes randomly, so a model that predicts which classes
meet is a second source of truth that's wrong by first period.)*

- [x] 🚩 Marking screen, **exceptions-only** — the *finished* document holds nothing but exceptions
      to present, and clearing a mark still means present. This runs while students walk in — it is
      the critical-path flow. *(Amended 2026-08-06 by WO-2.10: present is no longer the default a
      student STARTS on. A class being taken also holds a `U` for everyone the teacher has not
      reached yet, and those are deleted as she reaches them — so the rule is re-pointed rather than
      repealed, and a finished class is the same two entries it always was.)*
- [x] 🚩 **`U` for unconfirmed.** A student stays `?` until their own button is tapped, and until
      then they count **absent** — the first tap means "I see you, you're here" and gives `P`, then
      the cycle runs `P → A → E → T → D`. Tapping one student never changes another student's
      display; only "Everyone's here" does that. The document at rest is unchanged: every `U` is
      deleted as its student is confirmed. *(Added 2026-08-06 — WO-2.10. The owner found the
      original model backwards for how she stands in a room: confirming a student present cost four
      taps round the cycle, and one tap silently resolved everyone.)*
- [x] 🚩 **Timestamps on tardies and dismissals**, and a note on any mark. A mark cell is an object;
      `T` and `D` record the moment they settled. *(Added 2026-08-06, folded into WO-2.10. Planbook
      recorded that a student was tardy and never when — Roll Call! has captured it all along.
      Twenty minutes late and two minutes late are different conversations with a guardian.)*
- [x] 🚩 Marks `P / T / A / E / D`, matching Roll Call!'s vocabulary so the owner's habits carry over.
- [x] 🚩 **One-tap drop.** The day loads showing all five classes; the ones that didn't meet get
      marked dropped and are done. No setup, nothing to maintain when the rotation shifts.
- [x] 🚩 **Three distinct states per class per day: taken · dropped · not taken yet.** The third is
      not the second. "Did the class not meet, or did I forget?" is the question the home screen
      exists to answer.
- [x] 🚩 Mark a **past** date — a forgotten day is more common than a dropped one. *(Amended
      2026-08-07 by WO-2.12: a past day needs a day column, and **portrait now draws only today's**,
      so correcting last Tuesday means turning the iPad to landscape. The unlock itself is unchanged
      and paging still works in portrait a day at a time. This is the accepted cost of the trade
      below, not a gap to close.)*
- [x] 🚩 **Hall passes**: bathroom, nurse, quick. One tap out, one tap back, an append-only log keyed
      by student id. **An open pass survives a force-quit** — the app must never lose track of a
      student who is out of the room, which is the one place this deliberately does not copy Roll
      Call!, where active passes live in memory. A pass is not an attendance mark: a student at the
      nurse was present. *(Added 2026-08-06. This was never in this roadmap — the owner found it
      missing the first time she used the finished registry. Phase 2's goal is that she stops
      opening Roll Call!, and she issues passes every period, so its absence made the goal
      unreachable. WO-2.8.)* *(Done 2026-08-07. Two things the owner found in the first iPad sitting
      and neither is in the line above: a misclicked pass has no way out but Return, which writes a
      phantom trip into the append-only log — WO-2.11, 🚩. And the 160px column costs the portrait
      grid a day column — WO-2.12.)* *(WO-2.12 settled 2026-08-07, and not the way it was framed:
      offered four columns, five, or six bought by cutting the name to an avatar, the owner rejected
      the question. **Portrait shows today; landscape shows the week.** The `Passes` column stops
      competing for width in portrait, full names fit, and the grid repaints when the iPad turns.)*
- [ ] Overdue alerts, the elapsed clock, and pass history. *(Cut to Ship 2 — WO-2.9. The banner
      itself moved to WO-2.11 on 2026-08-07; what stays here is the half that has to survive iOS
      suspending a backgrounded PWA.)*
- [x] 🚩 **The pass banner, and cancelling a pass issued by mistake** — writing nothing to the log.
      The append-only rule protects trips that happened; a tap that never sent anyone anywhere is
      not one of them. *(Added 2026-08-07 — WO-2.11. Found the same way hall passes themselves
      were: the owner using the finished thing. Cancel lives on the banner card rather than in the
      pass column, which is both where Roll Call! puts it and the only place with room.)*
      *(Done 2026-08-07. The banner is scoped to the class on screen, a pass carries an optional
      `note` typed on the card and carried into the log entry on return, and `cancelPass()` cannot
      reach a finished pass at all — it is addressed by class and student and never names the
      history array. The 👤 line — whether Cancel and Return can be told apart at speed on glass —
      passed on the owner's iPad the same day, and that sitting returned one thing no acceptance
      line asked for: the card had been styled from scratch rather than lifted from Roll Call!,
      which had already tuned it. Re-cut against the predecessor's own values, and the rule
      generalised into the note under Reference implementation in [`../CLAUDE.md`](../CLAUDE.md).
      That re-cut re-opened the 👤 line it followed, and a second sitting the same day closed it:
      everything worked, and what came back was a layout report — three open passes wrapped their
      buttons onto two rows in landscape and three in portrait, from rules in the coarse block
      alone, while the desktop layout was already right. Fixed, and the harness now measures the
      one-row property at the cap of three in both orientations rather than trusting it.)*
- [x] 🚩 **Days off and pre-drops, set ahead.** A minimal date-picker: mark a date (or range)
      school-wide `no-school`, or drop named classes on a future date when an assembly is known.
      Stored as calendar events and *read* by attendance — never copied. Phase 6 adds the month
      view over the same data.
      *(WO-2.3, 2026-08-07. All five acceptance lines close at the desk — `verify-shell.mjs` 379 of
      379, with six mutation proofs; the largest of them is the Traps line itself, which turns ten
      checks red. Two modules: `src/calendar.js` is the model and `src/days-off.js` is the only
      writer of `doc.events` in the app. Attendance grew a **fourth** state — `covered` — in the one
      function that decides whether a class met, which is where WO-2.1 reserved a slot for it. One
      consequence recorded rather than hidden: a covered day is read-only, so a class that did meet
      on a school-wide day off has to be corrected on the calendar rather than in the register.
      The three 👤 lines it owed were sat on 2026-08-08 and **all three pass**.)*
      *(And the sitting that closed them opened five more things, none of them an acceptance line
      and none of them visible to a headless run — `verify-shell.mjs` 379 → 389, with three further
      mutation proofs. The one that is a real change rather than a fix: **the registry now pages
      forward** as far as the calendar reaches, because a day off could be set ahead and not looked
      at ahead, which made the feature un-checkable by the person relying on it. Writing a future
      date is refused exactly as before — only the columns opened up. The other four were a nowrap
      button narrower than its own label under the touch pass, a form that kept its dates, focus
      landing in a text field so the keyboard covered the list, and the way to the calendar being
      absent from the screen where the tap for it actually happens. **All six were re-sat the same
      day and pass** — `TESTING.md` § WO-2.3 → "What the sitting sent back" carries the eight checks
      and what each one settled. Nothing is owed; WO-2.3 is ✅.)*
- [x] 🚩 Per-student counts and attendance % **over recorded meetings of that class**, per term and
      year, using Roll Call!'s formula `(P+T+E+D)/(P+T+A+E+D)` so both apps agree this year.
- [x] Keyboard path on desktop (row select, `P`/`T`/`A`/`E`, arrows) and 44px touch targets under
      `@media (pointer: coarse)`. Both, not either.
      *(WO-2.5, 2026-08-08. **Hand-ticked, and that is not a shortcut** — `wo-gate.mjs --tick`
      reports this box as `matched 0 roadmap boxes` and would have marked WO-2.5 done while leaving
      it open. That is WO-2.15's third gap, recorded at `work-orders/phase-2-attendance.md:1195`;
      WO-2.15 owns the matcher and wants a fixture other than WO-2.5, so the text above is left as
      it stands rather than edited into agreement. **The box understates what shipped**: it names
      four letters and five landed — `P` `T` `A` `E` `D`, one keystroke each, selection advancing on
      its own. Both halves are real — all four Acceptance lines were confirmed by hand on the laptop
      **and** the iPad on 2026-08-08. What is still owed is the doorway itself: marking a live class
      while it walks in, which no desk can answer and which `TESTING.md` § WO-2.5 keeps open.)*
- [ ] Per-student attendance history view.
- [ ] **Roll Call! importer**: file input taking an exported class spreadsheet (`.csv`/`.xlsx`),
      zero permissions. Idempotent, and previews before it commits — re-running must not double a
      roster. *(Cut from Ship 1: August is a fresh year with pasted rosters.)*
- [ ] Print/CSV output for the attendance record.

---

## Phase 3 — Gradebook

**Goal:** grades entered once or twice a week, in minutes, for five classes.

- [ ] Weighted categories per class, editable, with a visible warning when weights ≠ 100%.
- [ ] **Letter-scale editor** — the teacher defines the bands. The app never hardcodes 90/80/70.
      This subsumes rounding: if 89.5 should be an A, the boundary is 89.5, and there is no
      separate rounding rule to disagree with the SIS about.
- [ ] Assignments: name, points, category, assigned date, due date. *A plain date — there is no
      "next meeting" to default to, and inventing one would require the schedule model Phase 2
      rejects.*
- [ ] Score entry grid — one column per assignment, `Enter` moves down the column. The
      second-most-frequent action in the app; it gets the same care as marking attendance.
- [ ] **`late` and `missing` are marked, never inferred.** Raw score plus a flag. `missing` counts
      as zero; `late` is a record, not a penalty; `EX` leaves the denominator; blank is simply
      ungraded and affects nothing.
- [ ] Past-due blanks generate a **prompt** — "6 blanks are past due, mark them missing?" — that
      the teacher accepts or dismisses. Never arithmetic that happens to them.
- [ ] Weighted grade with **empty categories redistributing their weight** — otherwise every grade
      is wrong until each category has an assignment.
- [ ] Per-student detail: category breakdown, what's missing, what it would take to move.
- [ ] **Accommodation prompts at point of use** — creating a test surfaces "3 students have
      extended time, 2 need a separate setting." A list nobody opens protects nobody.
- [ ] Print/CSV for grades. The SIS has no import, so re-keying is manual and the printout is what
      the owner types from — **order it to match the SIS entry screen.**

**Parallel, non-code:** start OAuth verification paperwork now (see Phase 7).

---

## Phase 4 — Signals: concern **and** praise

**Goal:** open the app and see who needs you today — in both directions.

The praise half has a design trap: **rank by delta, not by level.** "Top of the class" surfaces the
same four students every week and is worthless. "Came up 14 points since October" surfaces a
different student every time, and it's the message that actually lands at home.

- [ ] Threshold engine reading every rule from the document, editable in Settings.
- [ ] **Concern signals:** grade below threshold · falling N points over N assignments · N
      consecutive low scores · N missing assignments · attendance below N% · N absences in a
      window of meetings · N consecutive absences · N tardies · N behavior entries in N days.
- [ ] **Praise signals:** rose N points over N assignments · N consecutive strong scores · came off
      the concern list (a turnaround is the highest-value message home) · a clean stretch with no
      missing work · perfect attendance over a window.
- [ ] One evaluator produces both lists. A student can appear on both, and that's information.
- [ ] **Contact cooldown.** Read the outreach log; suppress anyone contacted about the same signal
      within N days. Without this the list is identical every week and the teacher stops reading
      it — which is how these features die.
- [ ] **The quiet middle.** Students neither flagged nor praised nor contacted all term. The ones a
      busy teacher genuinely loses track of.
- [ ] "Why is this student here?" — every flag explains itself in a sentence with the real numbers.
- [ ] Behavior/note logging fast enough to do mid-class, feeding the behavior signals.

---

## Phase 5 — Outreach

**Goal:** from "this student needs a conversation" to a sent message, without leaving the app or
granting a mail scope.

- [ ] **Templates with merge fields**, per [`../docs/data-model.md`](../docs/data-model.md) —
      student, guardian, grade, delta, missing work, attendance, signals, behavior.
- [ ] **An unresolved merge field never renders blank.** "Dear ," going home is worse than sending
      nothing: unresolved fields stay visible and block the send with a named error.
- [ ] **No merge field ever resolves accommodation, medical, or plan data.** The resolver refuses
      those paths by construction — a template system makes an IEP disclosure a one-keystroke
      mistake otherwise.
- [ ] Separate concern and praise templates. A good praise message reads nothing like a good
      concern message.
- [ ] Audience picker: guardian 1/2, **counselor, admin**. Contacts already live on the roster.
- [ ] **Copy to self**, on by default — a real message in the owner's sent folder is what a school
      asks for when it asks.
- [ ] **`mailto:` handoff** — never a mail scope. It opens the teacher's own client, so the sent
      record lands where a school expects to find it.
- [ ] Editable before sending. Always. A generated message going out unread is the failure mode
      that ends trust in the feature.
- [ ] Log the contact (append-only) and show contact history per student, from the roster and the
      signal card.

---

## Phase 6 — Calendar & the glance page

**Goal:** open the app at 7:40am and know what the day asks of you.

Most of this calendar is **free** — assignment due dates, term boundaries, and which classes met or
were dropped are already stored by Phases 2 and 3, and Phase 2 already authors days off and
pre-drops. Phase 6 adds the month view over that same data plus the remaining event kinds.

**Derived events are never copied into the events list.** Move an assignment's due date and the
calendar must follow by itself; a stored copy creates two truths, and the one the teacher isn't
looking at is the wrong one.

**The glance page is a launcher, not a report.** Every item taps through to the thing that resolves
it. If it can't be acted on, it doesn't earn a place.

- [ ] Event model: date or range, title, kind, optional class and student.
- [ ] Derived events computed at render from assignments, terms, and the schedule — not stored.
- [ ] Month and week views, filterable by class.
- [ ] **The glance page**, in the order a teacher needs it: **every class with today's state —
      taken · dropped · not yet** — each with a one-tap fix · today's and this week's events ·
      what's waiting to be graded · who needs attention · deadlines closing in.
- [ ] Honest empty states. A quiet day says "nothing needs you today", not five empty panels.
- [ ] **Grades-due deadlines** as a first-class event kind with a lead-time warning. Re-keying into
      the SIS is a scheduled job, not something you remember.
- [ ] **IEP/504 review dates** surfaced ahead of time, in presentation-mode-safe form.
- [ ] Recurring events by **materializing** instances rather than storing a recurrence rule. Flat,
      editable, and one instance can move without reasoning about exceptions. *RRULE is V2, if ever.*

---

## Phase 7 — Drive sync (opt-in) 🔒

**Goal:** the same year on the laptop and the iPad, with one scope and no fear.

**Gated on Google OAuth verification** — start the paperwork in Phase 3, not here.

- [ ] Google Identity Services token flow, browser-only, **`drive.file` and nothing else**.
- [ ] Sign-in is opt-in and reversible; the app stays fully functional signed-out, forever.
- [ ] Upload/download the year document, matched by `appProperties.docId`.
- [ ] `rev`/`baseRev` comparison per [`../docs/sync.md`](../docs/sync.md).
- [ ] **Conflict: keep both, never merge, never discard.** Write the loser as a named conflict copy
      and say plainly where it went.
- [ ] Handle token expiry gracefully — no refresh token exists in a browser flow, so sync is a
      foreground act. Never build a feature assuming background sync.
- [ ] Verification complete: privacy policy, verified domain, demo video, a consent screen showing
      one scope and no warning.

---

## Phase 8 — 1.0 packaging

**Goal:** something a stranger can find, evaluate, install, and trust.

- [ ] `TESTING.md` complete and fully passing — started in Phase 1 and grown since. This is the
      regression gate; there is no automated suite and that is a decision, not an omission.
- [ ] Demo build with a fake in-memory dataset, no account — clone the pattern from Roll Call!'s
      `tools/build-demo.mjs` (the engine's *presence* is the switch).
- [ ] Accessibility pass: screen reader (NVDA/VoiceOver), keyboard-only, contrast. *Roll Call!'s
      headless run found 66 unlabelled buttons in an area already ticked done — run the pass, don't
      assert it.*
- [ ] `README.md` with a **Known limitations** section naming the gaps out loud.
- [ ] `docs/FERPA.md` — stronger than Roll Call!'s (no vendor server, no account required) and it
      **must address accommodation and medical data directly**, not only grades.
- [ ] Print stylesheets for every printable surface.
- [ ] Onboarding: install → marking attendance with no documentation.
- [ ] Name and distribution channel decided. *Roll Call! sat at 0.9.0-beta with every engineering
      blocker closed, held up by exactly this. It isn't an engineering task and it doesn't resolve
      itself.*

---

## What 1.0.0 means

Judged on criteria, not on how finished it feels. Roll Call!'s release record is the model: this is
an argument, not a scoreboard, and ticking every box above is the *trigger* for the call, not the
call itself.

| Criterion | Bar |
|---|---|
| Data loss possible under normal use | **No.** Eviction warned about, backups nagged, restore proven, conflicts never silently resolved. The only absolute blocker. |
| Advertised features all work | Every README feature run end-to-end against real data. *A documented feature that fails on a teacher's first day loses that teacher permanently.* |
| A stranger can install it unaided | Install → first attendance mark, no documentation, no warning screen. |
| Attendance ledger correct | Taken / dropped / not-taken never confused, past-date marking works, and percentages match hand counts across a term of a randomly shifting rotation. |
| Grade math correct | Weighted categories, redistribution, late/missing/excused, and the letter scale verified against hand-computed cases — including all-excused categories, zero-point assignments, a term with one assignment. |
| Signals honest | Every flag reproducible by hand from the numbers it shows. Praise ranks by delta. |
| Sensitive data contained | Accommodations invisible in presentation mode, absent from every merge field, and named in `FERPA.md`. |
| Known limitations documented | Written down before launch, not discovered by a user. |
| Manual checklist passing | `TESTING.md` fully checked, on desktop and a real iPad. |
| Distribution decided | Name and channel settled. |

**Explicitly not required for 1.0:** an automated test suite (the manual checklist plus a headless
demo pass is the stated gate), SIS integration (no usable export exists), translation of outreach
(deferred — revisit once real guardian language needs are known), multi-teacher or admin accounts,
and any vendor-hosted backend.

---

## Cross-cutting rules

- Run `TESTING.md` before merging any phase branch; update `CHANGELOG.md` as you go. **Both start
  in Phase 1 and accrete** — a checklist written at the end documents what you remember, not what
  you built.
- One integration branch `main`; phase branches `phase/<n>-<slug>`, so a shippable state always
  exists. Delete once merged.
- **No dependencies, no linter, no test framework, no bundler.** Suite convention. The service
  worker is the only build-adjacent piece.
- Every visible element comes from `design/style-guide.md` or Roll Call!'s
  `design/portable-components.md`. Light theme only — no dark mode. Colors inline.
- **The home screen accretes.** Every phase adds its line rather than leaving it for Phase 6.
- **The consent screen stays at one scope.** `spreadsheets`, a mail scope, or a backend each look
  reasonable in isolation, and each one re-breaks what this architecture was chosen to fix.
- **Roll Call! stays deployed and working until Planbook has survived a full term.** It is the
  fallback, and a fallback you've decommissioned isn't one.
