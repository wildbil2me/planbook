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

## The files

| File | Work orders | Roadmap phase |
|---|---|---|
| [`ROUTING.md`](ROUTING.md) | — | Which agent gets which work order, and why |
| [`gates.md`](gates.md) | WO-G1 … WO-G4 | The delivery gates and the 1.0.0 call |
| [`phase-1-shell-store-roster.md`](phase-1-shell-store-roster.md) | WO-1.1 … WO-1.12 | Phase 1 |
| [`phase-2-attendance.md`](phase-2-attendance.md) | WO-2.1 … WO-2.7 | Phase 2 |
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
| 1 — Shell, store, roster | 12 | 12 | ✅ DONE — 2026-08-06 |
| 2 — Attendance | 6 | 0 | 🔨 IN PROGRESS |
| 3 — Gradebook | 10 | 0 | ⬜ NOT STARTED |
| 4 — Signals | 5 | 0 | ⬜ NOT STARTED |
| 5 — Outreach | 4 | 0 | ⬜ NOT STARTED |
| 6 — Calendar & glance | 4 | 0 | ⬜ NOT STARTED |
| 7 — Drive sync | 3 | 0 | 🔒 GATED — OAuth verification |
| 8 — 1.0 packaging | 6 | 0 | ⬜ NOT STARTED |
| Gates | 4 | 0 | ⬜ NOT STARTED |
| | **54** | **12** | `[██░░░░░░░░] 22%` |

---

## Ship 1 — the three weeks that matter

Fourteen work orders between 2026-08-03 and ~2026-08-24. This is the only stretch where the ordering
is genuinely tight, so it is written out day by day rather than left to be discovered.
*(Was fifteen: WO-2.2 merged into WO-2.1 on 2026-08-06 — splitting today from past dates is what
produced a marking screen worse than Roll Call!'s. The tombstone in the phase file says why.)*

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
| 12 | [WO-2.3](phase-2-attendance.md#wo-23--days-off--pre-drops) Days off & pre-drops | M | 🚩 | Aug 20 |
| 13 | [WO-2.4](phase-2-attendance.md#wo-24--counts--attendance-percentage) Counts & attendance % | M | 🚩 | Aug 21 |
| 14 | [WO-G1](gates.md#wo-g1--ship-1-go-live-rehearsal) **Ship 1 go-live rehearsal** | M | 🚩 | Aug 22–24 |

**The hard ordering constraint:** WO-1.5 ships before WO-1.6. Nothing that writes student data
lands before the path that gets it back out. Everything else in the table can shuffle.
**Satisfied 2026-08-04** — WO-1.5 verified, iPad half included. WO-1.6 is clear to start.

**If the schedule slips**, cut in this order: WO-1.9 presentation mode degrades to
"accommodations are collapsed by default and there's a hide-everything toggle in the header" ·
WO-2.4 percentages can be read from Roll Call! for a week · WO-1.10 home screen degrades to a class
list. **Never cut WO-1.5, WO-1.3, or WO-G1** — those three are what make going live in three weeks
a considered risk rather than a reckless one.

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
