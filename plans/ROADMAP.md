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

Every phase below is cut into work orders in [`work-orders/`](work-orders/) — 53 of them, each with
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
| 1 | Shell, store, roster | ⬜ NOT STARTED | 0/12 `[░░░░░░░░░░] 0%` |
| 2 | Attendance | ⬜ NOT STARTED | 0/11 `[░░░░░░░░░░] 0%` |
| 3 | Gradebook | ⬜ NOT STARTED | 0/10 `[░░░░░░░░░░] 0%` |
| 4 | Signals — concern **and** praise | ⬜ NOT STARTED | 0/8 `[░░░░░░░░░░] 0%` |
| 5 | Outreach | ⬜ NOT STARTED | 0/9 `[░░░░░░░░░░] 0%` |
| 6 | Calendar & the glance page | ⬜ NOT STARTED | 0/8 `[░░░░░░░░░░] 0%` |
| 7 | Drive sync (opt-in) | 🔒 GATED — needs OAuth verification | 0/7 `[░░░░░░░░░░] 0%` |
| 8 | 1.0 packaging | ⬜ NOT STARTED | 0/8 `[░░░░░░░░░░] 0%` |
| | | **Overall** | **4/77 `[░░░░░░░░░░] 5%`** |

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
- [ ] 🚩 IndexedDB store: one year document, load-on-open, save-on-change, `rev` increment.
- [ ] 🚩 **Backup: one-click JSON download**, plus a nag when the last one is >7 days old.
- [ ] 🚩 **Restore: drop a backup file**, with a confirm step naming what's being replaced.
      *Nothing that writes student data lands before this works.*
- [x] 🚩 Install detection + plain-language warning when running uninstalled — the iOS eviction
      hazard is data loss, not a nicety.
- [x] Lift the frame from Roll Call!'s `design/starter-template.html` and
      `design/portable-components.md`: navy gradient header, white rounded panels, two-row header,
      modal system, save indicator. Rename, `planbook_` prefix.
- [ ] 🚩 Class management: create/rename/reorder five-plus classes; term structure per class
      (quarters / semesters / trimesters — never hardcode Q1–Q4).
- [ ] 🚩 Roster: paste `Last, First`; guardian, counselor, and email fields editable.
- [ ] 🚩 **Accommodations on the roster** — IEP/504 plan, accommodation list, medical, behavior
      plan, case manager, review date. Per [`../docs/data-model.md`](../docs/data-model.md).
- [ ] 🚩 **Presentation mode** — a global toggle suppressing every sensitive field at once, plus
      discreet-by-default display of accommodations (indicator only; details on deliberate tap).
      Teachers project these screens onto classroom walls.
- [ ] 🚩 Home screen v0: **every class in one tap** — the owner's founding requirement. This screen
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

- [ ] 🚩 Marking screen, **exceptions-only** (present is the default; you tap absences and
      tardies). This runs while students walk in — it is the critical-path flow.
- [ ] 🚩 Marks `P / T / A / E / D`, matching Roll Call!'s vocabulary so the owner's habits carry over.
- [ ] 🚩 **One-tap drop.** The day loads showing all five classes; the ones that didn't meet get
      marked dropped and are done. No setup, nothing to maintain when the rotation shifts.
- [ ] 🚩 **Three distinct states per class per day: taken · dropped · not taken yet.** The third is
      not the second. "Did the class not meet, or did I forget?" is the question the home screen
      exists to answer.
- [ ] 🚩 Mark a **past** date — a forgotten day is more common than a dropped one.
- [ ] 🚩 **Days off and pre-drops, set ahead.** A minimal date-picker: mark a date (or range)
      school-wide `no-school`, or drop named classes on a future date when an assembly is known.
      Stored as calendar events and *read* by attendance — never copied. Phase 6 adds the month
      view over the same data.
- [ ] 🚩 Per-student counts and attendance % **over recorded meetings of that class**, per term and
      year, using Roll Call!'s formula `(P+T+E+D)/(P+T+A+E+D)` so both apps agree this year.
- [ ] Keyboard path on desktop (row select, `P`/`T`/`A`/`E`, arrows) and 44px touch targets under
      `@media (pointer: coarse)`. Both, not either.
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
