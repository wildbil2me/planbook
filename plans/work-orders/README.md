# Work orders — the path to 1.0.0

[`../ROADMAP.md`](../ROADMAP.md) says **what** Planbook will be and **why** each decision was made.
These work orders say **how the work is cut and in what order**. The roadmap stays the source of
truth for intent; a work order that contradicts it is wrong.

A **work order** is one self-contained brief: enough context to start cold, a bounded set of
deliverables, and acceptance criteria that are testable rather than felt. It is sized to be picked
up, finished, and verified without needing to hold the rest of the project in your head.

---

## How to use one

1. Open the work order. Read its **Why it exists** — it carries the reasoning that must not be
   undone, restated so you don't have to go find it.
2. Check **Depends on**. If a dependency isn't ✅, you are about to build on sand.
3. Work on the phase branch (`phase/<n>-<slug>`), not a branch per work order. A work order is a
   commit or a short stack of them.
4. Move its **Acceptance** lines into `TESTING.md` and run them. They are written to be checklist
   items already.
5. Then, and only then, do the roadmap maintenance protocol: tick the roadmap box, note any
   divergence in an *(italic paren)*, update the dashboard, add the `CHANGELOG.md` entry.

**Do not tick a work order that is written but unverified.** Same rule as the roadmap, same reason.

**Status vocabulary:** `⬜ NOT STARTED` · `🔨 IN PROGRESS` · `✅ DONE — <date>` · `🚧 BLOCKED` · `🔒 GATED`
· 🚩 marks a **go-live blocker**.

**Size:** `S` ≈ a sitting · `M` ≈ a day · `L` ≈ several days, and a candidate for splitting if it
starts to sprawl.

---

## Header fields, and the two ways they rot

The paragraph under a `## WO-x.y — Title` heading is read by `tools/wo-gate.mjs`, `wo-brief.mjs` and
by people. These are the fields it may carry. **A field the script has never heard of does not go
missing — it gets swallowed by whichever field is written before it**, so a new one is a change to
`KNOWN_FIELDS` in `wo-gate.mjs` and not just a line of prose.

| Field | Read by the tool as |
|---|---|
| **Ship** · **Status** · **Size** · 🚩 | The status line. `--start`, `--release` and `--tick` rewrite **Status** and nothing else |
| **Depends on** | Every `WO-` token is a gate; anything else on the line is reported as prose for a human to read |
| **Closes roadmap** | Each `"quoted fragment"` must match **exactly one** box in `ROADMAP.md`, which `--tick` then ticks |
| **Amends roadmap** | Reported, never acted on. This work order changes the promise of a box some earlier one already closed — WO-2.12 and WO-2.13 carry it. The *(italic paren note)* it owes `ROADMAP.md` is still a hand edit |
| **Takes from WO-x.y** | Prose. Nothing reads it |

**Everything must sit in one paragraph with no blank line in it.** The header block ends at the
first blank line, and a field below that line is invisible to every script here — WO-2.8's
**Closes roadmap** sat one blank line out of reach under an italic note, so `--tick` would have
reported "no **Closes roadmap** line" and closed nothing, and its box was only ever ticked by hand.

**Quoting a `Closes roadmap` fragment — four rules, each one learned from a fragment that matched
nothing.** The matcher normalises backticks, `**`, ellipses, trailing punctuation and case, then asks
whether one roadmap line *contains* the fragment.

1. **Quote the box, do not paraphrase it.** WO-2.11 wrote *"Cancel a pass issued by mistake, writing
   nothing to the log"* for a box that reads *"The pass banner, and cancelling a pass issued by
   mistake — writing nothing to the log."*
2. **Include the parentheticals.** WO-2.5 and WO-8.3 both dropped one and both matched zero boxes.
3. **A fragment is matched against ONE line.** Roadmap boxes wrap; stop where the box wraps and end
   with `…`, which is stripped. You may stop early, you may never skip a middle — an ellipsis in the
   *middle* of a fragment matches nothing, which is how WO-6.2's fragment failed.
4. **Anything in double quotes on that line is read as a fragment**, including inside an *(italic
   paren note)*. Write notes about fragments in backticks, and use no quotation marks at all when the
   work order closes no box — WO-1.13, WO-3.10 and WO-G4 each pointed at a heading or a paragraph
   rather than a checkbox, and each was reported as rot until the quotation marks came off.

**Run `node tools/wo-gate.mjs --audit`.** It checks every fragment in this directory against
`ROADMAP.md`, and `ROADMAP.md`'s progress dashboard against the boxes under its own `## Phase N`
headings. It writes nothing, and it is the cheapest way to find out that a box was reworded under a
work order that will not be ticked for another six weeks.

*(That sweep was run for the first time on 2026-08-08, at WO-2.15, and found **nine** problems across
sixty-three work orders: six fragments quoting a box that had been reworded or elided, one too short
to match safely, one field below the header paragraph, and one quoting a heading rather than a box.
All nine are fixed above, each with a dated note at the fragment. The point is not the nine — it is
that every one of them would have surfaced as a silent no-op at tick time, months later, on a work
order whose author had moved on. Which is exactly what happened to WO-2.5 on 2026-08-08.)*

---

## The files

| File | Work orders | Roadmap phase |
|---|---|---|
| [`ROUTING.md`](ROUTING.md) | — | Which agent gets which work order, and why |
| [`gates.md`](gates.md) | WO-G1 … WO-G4 | The delivery gates and the 1.0.0 call |
| [`phase-1-shell-store-roster.md`](phase-1-shell-store-roster.md) | WO-1.1 … WO-1.13 | Phase 1 |
| [`phase-2-attendance.md`](phase-2-attendance.md) | WO-2.1 … WO-2.14 | Phase 2 |
| [`phase-3-gradebook.md`](phase-3-gradebook.md) | WO-3.1 … WO-3.10 | Phase 3 |
| [`phase-4-signals.md`](phase-4-signals.md) | WO-4.1 … WO-4.5 | Phase 4 |
| [`phase-5-outreach.md`](phase-5-outreach.md) | WO-5.1 … WO-5.4 | Phase 5 |
| [`phase-6-calendar-glance.md`](phase-6-calendar-glance.md) | WO-6.1 … WO-6.4 | Phase 6 |
| [`phase-7-sync.md`](phase-7-sync.md) | WO-7.1 … WO-7.3 | Phase 7 🔒 |
| [`phase-8-packaging.md`](phase-8-packaging.md) | WO-8.1 … WO-8.6 | Phase 8 |

---

## Dashboard

| Phase | Work orders | Done | Status |
|---|---|---|---|
| 1 — Shell, store, roster | 13 | 13 | ✅ DONE — 2026-08-06 (reopened and reclosed same day) |
| 2 — Attendance | 14 | 11 | 🔨 IN PROGRESS |
| 3 — Gradebook | 10 | 0 | ⬜ NOT STARTED |
| 4 — Signals | 5 | 0 | ⬜ NOT STARTED |
| 5 — Outreach | 4 | 0 | ⬜ NOT STARTED |
| 6 — Calendar & glance | 4 | 0 | ⬜ NOT STARTED |
| 7 — Drive sync | 3 | 0 | 🔒 GATED — OAuth verification |
| 8 — 1.0 packaging | 6 | 0 | ⬜ NOT STARTED |
| Gates | 4 | 1 | ⬜ NOT STARTED |
| | **63** | **25** | `[████░░░░░░] 40%` |

*Phase 1 was stamped ✅ DONE on 2026-08-06 and reopened the same day. WO-2.1 needed a screen to live
in and found that `<main>` has no navigation — the header class row sets a preference and repaints
itself, and nothing swaps the panel underneath. That is a Phase 1 gap discovered by Phase 2, so it
is booked where it belongs (WO-1.13) rather than smuggled into an attendance work order to keep a
dashboard tidy. The work lands on `phase/2-attendance`, because that is where the tree is.*

---

## Ship 1 — the three weeks that matter

Twenty work orders between 2026-08-03 and ~2026-08-24. This is the only stretch where the ordering
is genuinely tight, so it is written out day by day rather than left to be discovered.

*(Four changes on 2026-08-06, all from one root cause — building attendance without holding it
against Roll Call! first, screen by screen. **WO-2.2 merged into WO-2.1**, because splitting today
from past dates produced a marking screen worse than the app it replaces. **WO-1.13 added**, because
that screen then had nowhere to live but a modal. **WO-2.8 added**, because the owner opened the
finished registry and found the hall passes she issues every period simply absent — never in the
roadmap, never in a work order, never dropped by anyone, just never written down. Each was found by
the owner using the thing, not by a check. **WO-2.10 added**, because she then found the marking
model itself backwards: a cell that starts on `?` and jumps to `A` makes confirming a student
present cost four taps, and one tap resolved the whole room. That is the pattern worth naming: the
harness cannot fail a feature nobody specified, and it cannot fail a model that works exactly as
designed while being wrong for the room it ships into.)*

*(Two more on 2026-08-07, both from the owner's first iPad sitting with the finished hall passes,
and the pattern above repeating a third time. **WO-2.11 added**, 🚩, because a misclicked pass has
no way out but Return — which writes a phantom trip into a log that is append-only by rule and read
by Phase 4 as a signal. It pulls **the banner card forward out of WO-2.9**, because cancel needs a
surface and the 160px pass column has no room for one — which is how Roll Call! does it, and the
"dropdown" this was first written around turned out not to exist. **WO-2.12 added**, because
WO-2.8's escalation asked the wrong question:
offered four, five or six day columns in portrait, the owner said portrait should show today and
landscape should show the week. Neither is a defect in WO-2.8, which verified clean on all seven
acceptance lines; both are what using it on glass revealed. **WO-2.13 added**, because WO-2.4's
verifier broke its own fixture to ask what it could not express and found the per-student totals
being recomputed once per row — 76 ms per render at a year of data, on the screen that has to keep
up with students walking in. Not a defect in WO-2.4, which is arithmetically correct and verified;
it is the cost of that arithmetic being asked twenty-six times for one answer, and the same file
already hoists three other reads for exactly this reason.)*

| # | Work order | Size | 🚩 | Suggested |
|---|---|---|---|---|
| 1 | [WO-1.1](phase-1-shell-store-roster.md#wo-11--repo-skeleton--docs-spine) Repo skeleton & docs spine | S | | Aug 3–4 |
| 2 | [WO-1.2](phase-1-shell-store-roster.md#wo-12--app-shell--design-frame) App shell & design frame | M | | Aug 4–5 |
| 3 | [WO-1.3](phase-1-shell-store-roster.md#wo-13--pwa-install-path--eviction-warning) PWA install path & eviction warning | M | 🚩 | Aug 5–6 |
| 4 | [WO-1.4](phase-1-shell-store-roster.md#wo-14--year-document-store) Year document store | M | 🚩 | Aug 6–7 |
| 5 | [WO-1.5](phase-1-shell-store-roster.md#wo-15--backup--restore) **Backup & restore** | M | 🚩 | Aug 7–8 |
| 6 | [WO-1.6](phase-1-shell-store-roster.md#wo-16--classes--terms) Classes & terms | M | 🚩 | Aug 10–11 |
| 7 | [WO-1.7](phase-1-shell-store-roster.md#wo-17--roster--contacts) Roster & contacts | M | 🚩 | Aug 11–12 |
| 8 | [WO-1.8](phase-1-shell-store-roster.md#wo-18--accommodations-on-the-roster) Accommodations on the roster | M | 🚩 | Aug 12–13 |
| 9 | [WO-1.9](phase-1-shell-store-roster.md#wo-19--presentation-mode) Presentation mode | S | 🚩 | Aug 13 |
| 10 | [WO-1.10](phase-1-shell-store-roster.md#wo-110--home-screen-v0) Home screen v0 | M | 🚩 | Aug 14 |
| 11 | [WO-2.1](phase-2-attendance.md#wo-21--attendance-registry-students--recent-days) Attendance registry: students × recent days | L | 🚩 | Aug 17–19 |
| 12 | [WO-1.13](phase-1-shell-store-roster.md#wo-113--main-area-views-make-the-header-actually-navigate) Main-area views | M | 🚩 | Aug 19–20 |
| 13 | [WO-2.10](phase-2-attendance.md#wo-210--mark-cells-unconfirmed-timed-and-noted) Mark cells: unconfirmed, timed, noted | L | 🚩 | Aug 19–20 |
| 14 | [WO-2.8](phase-2-attendance.md#wo-28--hall-passes-issue-hold-return) Hall passes: issue, hold, return | M | 🚩 | Aug 20 |
| 15 | [WO-2.11](phase-2-attendance.md#wo-211--the-pass-banner-and-cancelling-a-pass-issued-by-mistake) Pass banner & cancel | M | 🚩 | Aug 20 |
| 16 | [WO-2.12](phase-2-attendance.md#wo-212--portrait-shows-today-landscape-shows-the-week) Portrait shows today | S | | Aug 20 |
| 17 | [WO-2.3](phase-2-attendance.md#wo-23--days-off--pre-drops) Days off & pre-drops | M | 🚩 | Aug 20–21 |
| 18 | [WO-2.4](phase-2-attendance.md#wo-24--counts--attendance-percentage) Counts & attendance % | M | 🚩 | Aug 21 |
| 19 | [WO-2.13](phase-2-attendance.md#wo-213--the-totals-are-recomputed-once-per-student-compute-them-once-per-render) Totals once per render, not per student | S | | Aug 21–22 |
| 20 | [WO-2.5](phase-2-attendance.md#wo-25--keyboard--touch-pass) **Keyboard & touch pass** | S | 🚩 | Aug 22 |
| 21 | [WO-G1](gates.md#wo-g1--ship-1-go-live-rehearsal) **Ship 1 go-live rehearsal** | M | 🚩 | Aug 22–24 |

**The hard ordering constraint:** WO-1.5 ships before WO-1.6. Nothing that writes student data
lands before the path that gets it back out. Everything else in the table can shuffle.
**Satisfied 2026-08-04** — WO-1.5 verified, iPad half included. WO-1.6 is clear to start.

**If the schedule slips**, cut in this order: WO-2.12 portrait layout — five day columns and a
readable name column is a worse fit than one column, not a broken screen · WO-1.9 presentation mode degrades to
"accommodations are collapsed by default and there's a hide-everything toggle in the header" ·
WO-2.4 percentages can be read from Roll Call! for a week · WO-1.10 home screen degrades to a class
list. **Never cut WO-1.5, WO-1.3, WO-2.5, or WO-G1** — those four are what make going live in three
weeks a considered risk rather than a reckless one.

*(WO-2.5 joined that list and moved into Ship 1 on 2026-08-08, when the laptop became the device of
record for the term — see WO-G1's decision record. It is the keyboard path, and without it a class
of 25 is marked by mouse while students walk in. A work order that was a Ship 2 polish item under
the old model is a go-live blocker under the new one; the deliverable did not change, the standard
it is built to did.)*

---

## Standing obligations

These are not work orders because they never finish. They apply to every one that follows.

- **`TESTING.md` and `CHANGELOG.md` accrete.** Every work order adds its acceptance lines and its
  changelog entry as it lands. A checklist written at the end documents what you remember.
- **The home screen accretes.** Every phase adds its line to WO-1.10's screen rather than deferring
  it to Phase 6.
- **The consent screen stays at one scope.** `drive.file`. Not `spreadsheets`, not a mail scope,
  not a backend.
- **No dependencies, no framework, no bundler, no linter, no test framework.** The service worker
  is the only build-adjacent piece.
- **No merge field, log line, print surface, or export ever emits accommodation, medical, or plan
  data** — except the JSON backup, which says so in its own UI.
- **Roll Call! stays deployed** until Planbook has survived a full term.
- **Every new control appears in the `@media (pointer: coarse)` block** with a 44px minimum.
