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

**Status vocabulary:** `⬜ NOT STARTED` · `🤖 CLAIMED — <dispatch>` · `🔨 IN PROGRESS` ·
`✅ DONE — <date>` · `🚧 BLOCKED` · `🔒 GATED` · 🚩 marks a **go-live blocker**.

**🤖 and 🔨 are two different facts, and 2026-08-09 (WO-3.11) is when they stopped being one.**
`🤖 CLAIMED — <dispatch>` is written by `--start` and undone by `--release`: a run has this in flight.
`🔨 IN PROGRESS` is what `--tick` writes over an open Acceptance list: part-built, nobody in flight,
and `--release` refuses it. A work order that **landed** with lines it cannot close is neither — it is
`✅ DONE` with a `**Owes**` field. One glyph for the first two meant `next` stepped over finished work,
WO-3.3's gate failed on it, and `--release` could not be run without knowing which was meant.

**Size:** `S` ≈ a sitting · `M` ≈ a day · `L` ≈ several days, and a candidate for splitting if it
starts to sprawl.

---

## Header fields, and the two ways they rot

The paragraph under a `## WO-x.y — Title` heading is read by `tools/wo-gate.mjs`, `wo-brief.mjs` and
by people. These are the fields it may carry. A field the script has never heard of **used to get
swallowed by whichever field was written before it**; since WO-2.16 it does not, because the boundary
between one field and the next is now a *position* — the start of a header line, or a `·` — rather
than the closed list below. A new field is still a change to `KNOWN_FIELDS` in `wo-gate.mjs` if you
want it read; it is no longer a change to what the field above it means if you forget.

| Field | Read by the tool as |
|---|---|
| **Ship** · **Status** · **Size** · 🚩 | The status line. `--start`, `--release` and `--tick` rewrite **Status** and nothing else |
| **Ship**, specifically | `1`, `2`, `3` — the ship whose table carries it, and whose gate work order depends on it. `—` means **in no ship**, which is a statement and not a blank: either the work order sits outside the delivery plan (the tooling ones — WO-2.14, WO-2.15), or it has been deferred out of a ship (WO-2.7), or no ship covering it exists yet (Phases 5–8, WO-G4 — the delivery table stops at Ship 3). **Every work order carries this field.** It was missing from thirty-three of them until 2026-08-09, which is exactly the rot the row below describes: absent read as *"no ship,"* when it meant *"nobody has said"* |
| **Depends on** | Every `WO-` token is a gate; anything else on the line is reported as prose for a human to read. A `…` between two `WO-` tokens is **two dependencies and not a range** — the gate warns about it and will never expand it, because WO-G2's `WO-2.5 … WO-2.7` left WO-2.6 gating nothing for a week and a parser guessing at ranges invents dependencies nobody typed |
| **Owes** | The work orders carrying this one's re-homed Acceptance lines, and **the one field here that is acted on rather than only reported**. Present exactly when a line has been moved, absent everywhere else. Each named ID must be pointed at by a `- [ ] … → WO-x.y` line below, and each of those pointers must land on **exactly one box that is still `[ ]`** under the target — `--tick` refuses the work order when one does not, and `--audit` resolves every pointer in the directory each run. Quote the target's box after the marker, the way **Closes roadmap** quotes a roadmap box, whenever the wording changed on the way; write the marker **bare**, because a `→ WO-x.y` inside backticks is read as prose about markers |
| **Blocks** | Reported, never acted on, and **never a dependency** — it is the opposite of one. Prose written by a hand rather than a list of IDs: WO-1.1's says `everything` and WO-1.5's ends `— **unblocked as of 2026-08-04**`. Until WO-2.16 the `WO-` tokens on it reached the dependency walk, so WO-1.5 — the backup work order the whole sprint waits on — was reported as *depending on* WO-1.6. Both were ✅ DONE so nothing was gated wrongly, which was luck: the same line between two open work orders is a cycle the gate would have called satisfied |
| **Target** | Reported, never acted on. A date, on three of the four gate work orders — WO-G4 has none, because the 1.0.0 call is the one gate no calendar can set — because a gate is otherwise calendar-bound rather than work-bound. It sat inside `Depends on` until WO-2.16 for the same reason **Blocks** did, and got away with it because a date carries no `WO-` token |
| **Closes roadmap** | Each `"quoted fragment"` must match **exactly one** box in `ROADMAP.md`, which `--tick` then ticks |
| **Amends roadmap** | Reported, never acted on. This work order changes the promise of a box some earlier one already closed — WO-2.12 and WO-2.13 carry it. The *(italic paren note)* it owes `ROADMAP.md` is still a hand edit |
| **Takes from WO-x.y** | Prose. Nothing reads it |
| *anything with no row here* | **Read by nothing, and said so once per gate report.** It is parsed far enough to keep it out of the field written above it, and `node tools/wo-gate.mjs WO-x.y` names it as a field with no row. If it is real, give it both a row here and a line in `KNOWN_FIELDS`; if it is not, take it out of the header block. This row exists because three fields — **Amends roadmap**, **Blocks**, **Target** — were each invented by a hand, absorbed in silence, and found one at a time by a human reading the gate's output and thinking it looked odd |

**A field is recognised by where it sits as much as by its name.** It must start a line of the header
block or follow a `·`, and the asterisks must hold nothing but capitalised words — plus the `WO-x.y`
that `**Takes from WO-2.9**` names its own argument with. Bold *prose* inside a field's value is left
alone and stays part of that value, which is why WO-1.13's *see **Why it exists** below* does not end
its **Closes roadmap** line and WO-1.11's **Not a go-live blocker.** does not end its **Depends on**.
Write a new field at the start of a line, the way every existing one is written, and it will be seen.

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

**A re-homed Acceptance line stays `- [ ]`.** *(2026-08-09, WO-3.11.)* When a line names work another
work order will actually do, leave the box open, add `**Owes** WO-x.y` to the header beside
**Depends on**, and end the line with a bare `→ WO-x.y` and a quotation of the box that carries it now:

```
- [ ] Reweighting recomputes every displayed grade … the crossing in both directions.
      → WO-3.5 "Reweighting recomputes every displayed grade in that class immediately"
```

**Never `- [x]`.** WO-3.1's two were ticked by hand for a day, each with a paragraph underneath saying
that ☑ meant *resolved on this work order, not verified* — and a mark that needs a paragraph to stop it
meaning "verified" is the wrong mark, with the paragraph in a place no check reads. The marker says the
same thing on its face and is checkable from both ends. **The debt ends when the target ticks its box:**
`--audit` then fails on the pointer — a box that is already `[x]` — which is the signal to tick the line
at the source on that evidence and take the **Owes** field off.

**Run `node tools/wo-gate.mjs --audit`.** It checks every fragment in this directory against
`ROADMAP.md`, every `**Owes**` pointer against the box it names, and `ROADMAP.md`'s progress dashboard
against the boxes under its own `## Phase N`
headings. It writes nothing, and it is the cheapest way to find out that a box was reworded under a
work order that will not be ticked for another six weeks.

*(That sweep was run for the first time on 2026-08-08, at WO-2.15, and found **nine** problems across
sixty-three work orders: six fragments quoting a box that had been reworded or elided, one too short
to match safely, one field below the header paragraph, and one quoting a heading rather than a box.
All nine are fixed above, each with a dated note at the fragment. The point is not the nine — it is
that every one of them would have surfaced as a silent no-op at tick time, months later, on a work
order whose author had moved on. Which is exactly what happened to WO-2.5 on 2026-08-08.)*

---

## Citing code

**Cite a symbol, not a line number.** `src/classes.js`'s `dateField()`, `.term-date` in
`src/shell.css`'s coarse block, the DAYS OFF section of `src/shell.css` — never `src/classes.js:1046`.
A symbol is found by grep and moves with the code it names; a line number is a claim about a tree
that is still being edited, and it decays silently. Nothing checks these. No harness reads prose, no
harness opens the sibling repo, and a wrong pointer costs nothing at write time and misleads a reader
months later. The reader is the only instrument there is.

**The two exceptions**, both narrow: a citation into a **frozen artifact** — a specific commit, a
file in Roll Call! that this work is copying from, a dispatch result already written — where the line
cannot move; and a citation a **tool parses**, which the tool's own format decides. When you cite a
line in the sibling repo, cite the symbol *and* the line, because the symbol is what survives and the
line is what a reader checks it against.

*(The scar: WO-2.23, 2026-08-10. Its comment above `.term-date` failed verification **four times in a
row**, every time on a checkably false claim about Roll Call! — three of substance, and then a fourth
where the reasoning was right in every particular and the line number was off by six, pointing a
reader at two modal-width rules. The same work order's own **Why it exists** paragraph carried five
line numbers; by the time it closed, three had drifted under WO-3.17's commit and two under its own
comment additions. It cost five verification rounds to learn that prose about code is unguarded by
construction, and that the cheapest defence is to write pointers that cannot drift.)*

---

## The files

| File | Work orders | Roadmap phase |
|---|---|---|
| [`ROUTING.md`](ROUTING.md) | — | Which agent gets which work order, and why |
| [`gates.md`](gates.md) | WO-G1 … WO-G4 | The delivery gates and the 1.0.0 call |
| [`phase-1-shell-store-roster.md`](phase-1-shell-store-roster.md) | WO-1.1 … WO-1.14 | Phase 1 |
| [`phase-2-attendance.md`](phase-2-attendance.md) | WO-2.1 … WO-2.23 | Phase 2 |
| [`phase-3-gradebook.md`](phase-3-gradebook.md) | WO-3.1 … WO-3.18 | Phase 3 |
| [`phase-4-signals.md`](phase-4-signals.md) | WO-4.1 … WO-4.5 | Phase 4 |
| [`phase-5-outreach.md`](phase-5-outreach.md) | WO-5.1 … WO-5.4 | Phase 5 |
| [`phase-6-calendar-glance.md`](phase-6-calendar-glance.md) | WO-6.1 … WO-6.4 | Phase 6 |
| [`phase-7-sync.md`](phase-7-sync.md) | WO-7.1 … WO-7.3 | Phase 7 🔒 |
| [`phase-8-packaging.md`](phase-8-packaging.md) | WO-8.1 … WO-8.8 | Phase 8 |

---

## Dashboard

| Phase | Work orders | Done | Status |
|---|---|---|---|
| 1 — Shell, store, roster | 14 | 14 | ✅ DONE — 2026-08-06 (reopened twice; last on 2026-08-12) |
| 2 — Attendance | 23 | 21 | 🔨 IN PROGRESS |
| 3 — Gradebook | 18 | 11 | 🔨 IN PROGRESS |
| 4 — Signals | 5 | 0 | ⬜ NOT STARTED |
| 5 — Outreach | 4 | 0 | ⬜ NOT STARTED |
| 6 — Calendar & glance | 4 | 0 | ⬜ NOT STARTED |
| 7 — Drive sync | 3 | 0 | 🔒 GATED — OAuth verification |
| 8 — 1.0 packaging | 8 | 1 | 🔨 IN PROGRESS |
| Gates | 4 | 1 | ⬜ NOT STARTED |
| | **83** | **48** | `[██████░░░░] 58%` |

*Phase 1 was stamped ✅ DONE on 2026-08-06 and reopened the same day. WO-2.1 needed a screen to live
in and found that `<main>` has no navigation — the header class row sets a preference and repaints
itself, and nothing swaps the panel underneath. That is a Phase 1 gap discovered by Phase 2, so it
is booked where it belongs (WO-1.13) rather than smuggled into an attendance work order to keep a
dashboard tidy. The work lands on `phase/2-attendance`, because that is where the tree is.*

---

## Ship 1 — the three weeks that matter

Twenty-one work orders between 2026-08-03 and ~2026-08-24. This is the only stretch where the
ordering is genuinely tight, so it is written out day by day rather than left to be discovered.
**Closed 2026-08-08** — every row ✅ DONE, WO-G1's rehearsal included. *(The count read "twenty"
until 2026-08-09; WO-2.5 was pulled into the table on 2026-08-08 and the sentence above it was not.)*

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

## Ship 2 — first grades

Thirty work orders between 2026-08-09 and ~2026-09-15, ending at
[WO-G2](gates.md#wo-g2--ship-2-gate-first-grades). *(Eighteen when this line was written on 2026-08-09;
corrected 2026-08-10, having drifted every time a row was added — the same decay WO-2.23 booked the
"cite a symbol, not a line number" rule against, arriving through a count instead of a pointer.)*
Written 2026-08-09, the day after Ship 1 closed,
because until it existed there was **no running order at all** past Ship 1 — `next` reads the tables
in this file and had nothing left to read, and the ordering everyone was working from lived in three
documents that disagreed. Naming the disagreements, since they are the reason this table is worth
more than its rows:

- [`../ROADMAP.md:80`](../ROADMAP.md) calls Ship 2 *"categories & weights · assignments · score entry
  with late/missing · weighted grade · letter scale"* — five items, all gradebook.
- **WO-G2's dependency line** wanted all of Phase 3 plus WO-2.5 … WO-2.7 — and got neither, because
  "Phase 3" is not a work order ID and the ellipsis was read as two tokens rather than a range. Ten
  work orders it waits on were invisible to the gate, and WO-2.6 sat in the middle of the range
  gating nothing. Rewritten as an explicit list on 2026-08-09.
- **The `**Ship**` header fields disagreed with both** — WO-2.6, WO-2.7 and WO-2.9 said `**Ship** 2`
  while every Phase 3 work order left the field blank, so by header alone the entire gradebook was in
  no ship at all. **Filled in on 2026-08-09**, and the gap turned out to be four times bigger than
  Phase 3: the field was missing from **thirty-three** work orders, every one from Phase 3 through
  Phase 8 plus WO-G4. Only Phases 1 and 2 and the first three gates ever carried it. Phase 3 → Ship 2
  (WO-G2 depends on all ten), Phase 4 → Ship 3 (WO-G3 depends on Phase 4), Phases 5–8 and WO-G4 → `—`,
  which is not a shrug: the delivery table defines no ship past 3, so they are genuinely in none yet.
  **WO-G2 carries the line that revisits them** when there is a ship to put them in.

**The unit of urgency is different from Ship 1's, and the table is built around that.** Ship 1 raced
a fixed date with students behind it. Ship 2 races a date the owner sets — but from **~Aug 24 the
owner is teaching**, so capacity halves at the exact midpoint. The heavy items are therefore front-
loaded into the two weeks *before* the term rather than spread evenly to Sep 15.

| # | Work order | Size | G2 | Suggested |
|---|---|---|---|---|
| 1 | [WO-2.16](phase-2-attendance.md#wo-216--the-self-check-states-its-precondition-and-blocks-stops-being-a-dependency) Self-check precondition & `**Blocks**` | S | | Aug 10 |
| 2 | [WO-2.17](phase-2-attendance.md#wo-217--the-term-nav-repaints-the-screen-it-is-sitting-on) Term nav repaints its screen | S | | Aug 10–11 |
| 3 | [WO-3.1](phase-3-gradebook.md#wo-31--categories--weights) Categories & weights | S | ✔ | Aug 10–11 |
| 4 | [WO-3.2](phase-3-gradebook.md#wo-32--letter-scale-editor) Letter-scale editor | S | ✔ | Aug 11–12 |
| 5 | [WO-3.11](phase-3-gradebook.md#wo-311--owes-and-splitting-what--in-progress-means) `**Owes**` & the status split | S | | Aug 12, half a day |
| 6 | [WO-3.3](phase-3-gradebook.md#wo-33--assignments) Assignments | M | ✔ | Aug 12–14 |
| 7 | [WO-3.4](phase-3-gradebook.md#wo-34--grade-engine) **Grade engine** | M | ✔ | Aug 14–17 |
| 8 | [WO-2.18](phase-2-attendance.md#wo-218--the-term-switch-checks-cover-every-surface-the-repaint-paints) Term-switch check coverage | S | | Aug 17 |
| 9 | [WO-3.5](phase-3-gradebook.md#wo-35--score-entry-grid) **Score entry grid** | L | ✔ | Aug 17–21 |
| 10 | [WO-2.20](phase-2-attendance.md#wo-220--the-orchestrator-must-not-report-a-spawn-as-a-run) Orchestrator reports a spawn as a run | S | | Aug 21, half a day |
| 11 | [WO-2.19](phase-2-attendance.md#wo-219--the-harnesss-own-check-count-is-checked) Harness check count | S | | Aug 21, half a day |
| 12 | [WO-3.17](phase-3-gradebook.md#wo-317--the-assigned-and-due-fields) The Assigned and Due fields | S | | Aug 22 |
| 13 | [WO-2.23](phase-2-attendance.md#wo-223--every-date-field-in-the-app-is-short-of-44px-on-the-ipad) Date fields are short of 44px | S | | Aug 22, half a day |
| 14 | [WO-3.14](phase-3-gradebook.md#wo-314--percentages-to-two-decimal-places) Percentages to two decimals | S | | Aug 22, half a day |
| 15 | [WO-3.10](phase-3-gradebook.md#wo-310--the-oauth-client-exists-and-asks-for-one-scope) OAuth client & consent screen | S | | Aug 22, an hour |
| 16 | [WO-2.6](phase-2-attendance.md#wo-26--attendance-history--output) Attendance history & output | M | ✔ | Aug 21–24 |
| 17 | [WO-2.21](phase-2-attendance.md#wo-221--the-44px-sweep-can-see-a-screen-that-is-not-the-one-on-screen) 44px sweep sees every view | S | | Aug 25, half a day |
| 18 | [WO-3.12](phase-3-gradebook.md#wo-312--the-grade-engine-cases-cover-the-arguments-the-engine-actually-takes) Grade-engine cases cover real arguments | S | | Aug 25, half a day |
| 19 | [WO-2.22](phase-2-attendance.md#wo-222--a-missing-harness-is-a-failure-and-one-call-per-line-stops-being-an-assumption) A missing harness fails; one call per line is checked | S | | Aug 25, half a day |
| 20 | [WO-2.24](phase-2-attendance.md#wo-224--nothing-in-the-tree-notices-if-the-shared-date-reset-is-deleted) The shared date reset is guarded against deletion | S | | Aug 26, half a day |
| 21 | [WO-3.7](phase-3-gradebook.md#wo-37--per-student-grade-detail) Per-student grade detail | L | ✔ | Aug 25–29 |
| 22 | [WO-8.7](phase-8-packaging.md#wo-87--the-name-and-the-host-decided) **The name and the host, decided** | S | | Aug 28, a sitting |
| 23 | [WO-8.8](phase-8-packaging.md#wo-88--read-the-deployment-not-the-repository) Read the deployment, not the repository | S | | Aug 28, half a day |
| 24 | [WO-3.9](phase-3-gradebook.md#wo-39--grades-print--csv) Grades print & CSV | M | ✔ | Aug 28–Sep 2 |
| 25 | [WO-3.18](phase-3-gradebook.md#wo-318--verification-submitted-) Verification submitted 🔒 | S | | Sep 2, then a queue |
| 26 | [WO-3.6](phase-3-gradebook.md#wo-36--past-due-prompt) Past-due prompt | S | ✔ | Sep 2–4 |
| 27 | [WO-3.8](phase-3-gradebook.md#wo-38--accommodation-prompts-at-point-of-use) Accommodation prompts at point of use | S | ✔ | Sep 4–8 |
| 28 | [WO-2.9](phase-2-attendance.md#wo-29--pass-banner-overdue-alerts-and-history) Pass overdue alerts & history | M | | Sep 8–11 |
| 29 | [WO-3.15](phase-3-gradebook.md#wo-315--a-way-to-add-an-assignment-from-the-score-grid) Add an assignment from the grid | S | | Sep 11 |
| 30 | [WO-3.16](phase-3-gradebook.md#wo-316--left-and-right-arrows-move-across-the-grid) Left and right arrows across the grid | S | | Sep 11–12 |
| 31 | [WO-3.13](phase-3-gradebook.md#wo-313--paste-a-column-of-scores) Paste a column of scores | S | | Sep 12 |
| 32 | [WO-G2](gates.md#wo-g2--ship-2-gate-first-grades) **Ship 2 gate: first grades** | S | — | ~Sep 15 |

*WO-8.8 was given row #23 on 2026-08-12, the day it was booked out of WO-8.7's deployment, and every
row below it moved down one. **It sits directly behind the work order that produced it, and ahead of
everything else, because what it checks is already live.** `planbook.hwgteach.com` is serving the app
now; every deploy from here until someone writes this script is a deploy nobody can verify except by
hand, and the two faults that motivated it were both found that way, both in production, both by the
owner rather than by a tool. Half a day, and it removes the only class of defect in this project with
no instrument pointed at it.*

*WO-1.14 has no row and that is deliberate, which this file's own rule below requires saying rather
than leaving to be noticed. It was booked and shipped inside the same hour, in `8de1ae4`, because the
app was broken in production while the owner watched. A row would schedule work that is already done.
The rule below is about work orders that arrive **open** — the failure it names is a finding that
lands in the directory and never in the order, and a `✅ DONE` work order cannot fail that way.*

*WO-2.24 was given row #20 on 2026-08-10, the day it was booked out of WO-2.23's verification — **the
third time this file has had to record the same failure**, after WO-3.12 and WO-3.10 below. A work
order with no numbered row is invisible to `next`; it is never offered at all. The pattern is now
specific enough to name: **all three were booked by a verifier, out of a work order that had already
passed.** That is the right call every time — the finding does not belong in the passing work order's
diff — but the booking ends with a `**Ship** —` header and nobody's hand on a row, so it lands in the
directory and not in the order. **A work order booked out of a verification needs a row in the same
sitting, or it needs saying out loud that it is deliberately unscheduled.***

*It sits at #20 because #17, #18 and #19 are the other three harness-coverage items and this is a
fourth of the same kind — four half-days that were all reading "Aug 25", which is why this one says
Aug 26 and the block should be read as spilling into it. **It is the second row to cut if the
fortnight tightens**, behind WO-3.12 and for the same reason: nothing in it is a defect. The rule it
guards is correct today, and what is missing is only the check that would notice if somebody deleted
it.*

*WO-3.12 was given a row at #17 on 2026-08-10, having had none since it was booked out of WO-3.4's
verification eight days earlier — **the same failure WO-3.10 had**, and the reason both are worth a
line here: a work order with no numbered row is invisible to `next`, so it is not scheduled late, it is
never offered at all. It is placed **beside WO-2.21 and ahead of WO-3.7** because both are harness
coverage and WO-3.7 is the next work order to consume the grade engine — the coverage is worth more
before another caller arrives than after. **It is also the first row to cut if the fortnight tightens**,
and says so in its own header: nothing in it is a defect, the arithmetic is right today, and what is
missing is only the check that would notice if it stopped being.*

***The OAuth split, 2026-08-10 — three rows where there was one work order that could not be started.***
*WO-3.10 was an M carrying everything from "create a Cloud project" to "submit for verification", and
its own deliverables required a verified domain, which required a naming decision that lived in WO-8.6
in Phase 8. **So the one item on the board paced by an outside party was also the one nobody could pick
up**, and it was invisible here — it had no numbered row, so `next` never offered it.*

*It is now **WO-3.10** (the client and the consent screen — an hour, needs nothing, at #15),
**WO-8.7** (the name and the host — split out of WO-8.6, at #21) and **WO-3.18** (policy, video,
submission — at #23, and then a queue that is not ours). **The three are ordered by what unblocks
what**, not by size: WO-8.7 is the critical path for sync ever reaching another teacher, and it sat
five phases away from where it was needed.*

***WO-3.10 also came off WO-G2's `Depends on` line*** *— see the note under that gate. Ship 2 is first
grades and contains no sync; leaving it there meant a grade-arithmetic gate could slip on Google's
review queue.*

***And the thing the old shape hid: verification gates public launch, not development.*** *An OAuth
client in Testing mode runs `drive.file` today, so the whole of Phase 7 can be built and used on the
owner's own devices long before any paperwork clears. That is why #15 is an hour rather than a phase,
and why it is worth doing whether or not the distribution question is ever answered yes.*

*WO-2.21 was inserted on 2026-08-10, out of WO-3.5's verification, and it is **deliberately ahead of
WO-3.7** — the next work order that adds a view. Every screen added before it lands arrives with the
44px sweep blind to it and needs WO-3.5's by-hand workaround written again; the half day buys that back
for WO-3.7, WO-3.9 and WO-3.6 together. No row below was re-flowed, on the same reasoning as the note
above.*

*WO-2.22 was inserted at #18 on 2026-08-10, out of WO-2.19's verification, which raised two residuals
against the check that work order had just shipped. **It is placed third in the Aug 25 tooling cluster
— behind WO-2.21 and WO-3.12, ahead of WO-3.7 — for one reason: all three are half-day verification-
tooling items and the sitting is worth loading once.** Ahead of WO-3.7 on WO-2.21's argument rather
than its own: WO-3.7 is the next work order that adds a batch of checks, and both halves of WO-2.22
exist to keep the call-site count honest as checks arrive. **If the fortnight tightens this is the
second row to cut, after WO-3.12** — nothing in it is a defect, §11 is right today, and what is
missing is the guard on the premises it is right for. No row below was re-flowed.*

*WO-2.23 was inserted at #13 on 2026-08-10, out of the same iPad sitting that diagnosed WO-3.17 —
which found the fault it was sent to look at and the same fault on every other screen with a date on
it. **It sits immediately after WO-3.17 because the two close in one sitting**: WO-3.17 proves the
mechanism on the hardware, and this one applies it to the two screens WO-3.17 is forbidden to touch.
It is a genuine touch-target failure on three shipped screens rather than a tooling item, and the
reason it went unnoticed for a phase and a half is written into it — **neither harness can see this,
and neither should be asked to**, because the desk browser honours the rule the device ignores and a
check for it would go green on the broken tree.*

*And the drift these notes keep acquiring, since it has now happened three times: **a row number in
prose goes stale the moment a row is inserted above it, and the prose does not notice.** Two rounds of
corrections on 2026-08-10 alone. The second round found the damage was worse than one insertion's
worth: the paragraphs about WO-3.15, WO-3.16 and WO-3.13 were pointing at #20, #21 and #22 when the
table had them at #26, #27 and #28 — stale by six rows, from insertions nobody went back for. **The
convention that survives this is the one the historical notes already use**: "was inserted at #N on
`<date>`" is a fact about a moment and stays true, while "it is now at #N" is a pointer and rots.
Prefer the first, and check the second whenever a row goes in — nothing else will, since
`wo-gate.mjs --audit` reads roadmap fragments and `**Owes**` pointers and never looks at these
numbers.*

*WO-3.14 through WO-3.17 were booked on 2026-08-10 out of the owner's first sitting with the score grid
on real hardware — the four things a working teacher found that no agent and no harness had. **They
split two and two, and the split is by when the thing bites rather than by how big it is** (all four
are S).*

***WO-3.17 and WO-3.14 come before the term opens, at #12 and #14.*** *WO-3.17's first half is a real
defect on real hardware — the Assigned and Due fields overlap and push off screen on the iPad — on the
dialog that creates every assignment the gradebook holds, and the term opens ~Aug 24. WO-3.14 is the
precision mismatch against the school's SIS, which lands on the teacher every time she re-keys a row,
which is week one. Both sit right after the two tooling rows and before WO-2.6.*

***WO-3.15 and WO-3.16 stay late, at #27 and #28.*** *A button that saves three navigations and a pair
of arrow keys are conveniences on a screen that already works, and WO-3.16 in particular carries a real
trap — left and right are also how a caret moves inside a number — which is worth taking slowly rather
than early.*

***No row was re-flowed for the two that moved up, and that is deliberate.*** *They are two sittings
inside a window that runs to ~Sep 15, the same call the WO-2.17 note below records. WO-3.13 moved down
to keep the three convenience-shaped rows together ahead of the gate. **If the fortnight turns out
not to hold two extra sittings, #12 and #14 are not the rows to move** — they are the two that bite in
week one. The rows to move are the three convenience rows at #27 through #29.*

*WO-2.17 was inserted at #2 on 2026-08-09, out of WO-3.3's verification, and every row below it moved
down one. It is dated Aug 10–11 alongside WO-3.1 rather than given a slot of its own — it is half a
day, and the two do not touch the same files — so **no other row's dates were re-flowed**. If that
half day is not there, it is the row to move rather than the ones with a ✔. It is early because it is
a wrong number on the screen the teacher opens every period, and the term opens ~Aug 24.*

*WO-2.18 was inserted at #8 on 2026-08-10, out of WO-2.17's verification, and every row below it moved
down one. **It is deliberately after WO-3.4 and deliberately before WO-3.5.** It buys a teacher
nothing — it is harness coverage for a repaint chain that is correct today — so it does not go ahead
of the grade engine, which is on the G2 gate and is the last M-sized item that fits before capacity
halves. It goes before the score grid because WO-3.5 is the **third** screen to hang off
`afterTermChange()` and the first one term-filtered by construction: a hole in the chain's coverage
starts costing there, not here. It is dated Aug 17 alongside WO-3.5's start rather than given a slot
of its own — it is half a day against a fixture that already exists — so **no other row's dates were
re-flowed**. If that half day is not there, this is the row to move.*

*WO-2.19 was inserted at #10 on 2026-08-10 and every row below it moved down one. **It is deliberately
behind WO-3.5 rather than in front of it.** It makes `wo-sweep.mjs` fail when `verify-shell.mjs`'s check
count and the number written in `tools/README.md` disagree — and WO-3.5 is the largest batch of new
checks since WO-3.4, which is the batch most likely to go in without that line being touched. Ahead of
WO-3.5 the check exists with nothing to catch and costs half a day off the last L item before capacity
halves; behind it, it catches WO-3.5's own miss in the same week. It is dated Aug 21 alongside WO-2.6's
start rather than given a slot of its own — half a day against a file that already exists — so **no
other row's dates were re-flowed**. It carries `**Ship** —` and that is not a contradiction: the ship
field says WO-G2 does not wait on it, this row says when it gets done. Being in no ship is what put
WO-2.14 and WO-2.15 outside every table, and outside every table is where `next` cannot see a work
order at all.*

*WO-3.13 was inserted at #17 on 2026-08-10, split out of WO-3.5's deliverable list, and only WO-G2
moved below it. **It is last before the gate because it is the row to cut**: it closes no roadmap box,
WO-G2 does not depend on it, and a teacher who cannot paste can still type the column. It is also the
one row here whose worth is not yet established — see the question at the head of the work order, which
is whether scores routinely arrive in a pasteable column at all. If the answer is paper, this row comes
out rather than moving.*

*WO-3.11 was inserted at #5 on 2026-08-09 and was the one row here that bought nothing a teacher can
see, until WO-2.18 joined it on 2026-08-10.
It sits before WO-3.3 because WO-3.3 is the next work order that lands with Acceptance lines it cannot
close — its grade-calculation lines wait on WO-3.4 and WO-3.5 — and a `🔨` there blocks WO-3.5, which
depends on it. **It is also the row to cut first if the fortnight tightens**, ahead of everything with
a ✔: the gap it fixes has a hand workaround, and that workaround is written down in WO-3.1.*

**Running in parallel, on nobody's critical path and its own clock:** the OAuth work, **which was one
work order until 2026-08-10 and is now three** — the split is described at WO-3.10, and the short
version is that the half needing nothing was trapped behind the half needing a domain.

- [WO-3.10](phase-3-gradebook.md#wo-310--the-oauth-client-exists-and-asks-for-one-scope) — the client
  and the consent screen. Depended on **nothing**, took an hour in a console, and was **done
  2026-08-11**. It is what lets all of Phase 7 be built against a Testing-mode client long before any
  paperwork clears.
- [WO-8.7](phase-8-packaging.md#wo-87--the-name-and-the-host-decided) — the name and the host,
  decided. **The real critical path**, because it is what a domain requires and a domain is what the
  submission requires. It needs no code and nobody but the owner can do it.
- [WO-3.18](phase-3-gradebook.md#wo-318--verification-submitted-) — policy, video, submission. The
  G2 checklist item (*submitted*, with the date recorded), and the one item here that is
  **calendar-bound rather than work-bound**: submitting late does not cost a week of work, it costs
  however long Google takes. *(The precedent is sitting on disk: Roll Call! is at 0.9.0-beta with
  every engineering blocker closed, held by exactly this class of task.)*

**The hard ordering constraint:** WO-3.1 and WO-3.2 before everything else in the gradebook. Six of
the ten Phase 3 work orders sit behind them, and WO-3.5 — the L, and the screen WO-G2 actually
tests — is four deep. *Ship 1's constraint (backup before anything that writes student data) is
already satisfied here: WO-1.5 backs up the whole year document, and grades land inside it.*

**If the schedule slips**, cut in this order: **WO-2.9** — overdue pass alerts are a convenience over
a log that is already being written correctly · **WO-3.6** past-due prompt, which is a nudge toward
marks the teacher can already set by hand · **WO-3.8** accommodation prompts degrade to what Ship 1
already delivers, the accommodation on the roster where the legal obligation is met, and the prompt
is what makes it convenient rather than what makes it lawful.

**Never cut WO-3.1, WO-3.2, WO-3.4 or WO-3.9.** The first three are the grade math, and grade math
wrong in September is discovered in November by a guardian. WO-3.9 is there for a less obvious
reason: WO-G2 tests *"the printout order matches the SIS entry screen, confirmed against a real
re-key"*, and the SIS has no usable export, so re-keying by hand is the owner's actual recurring
labor. Cutting it does not descope a feature, it descopes the gate.

**Deferred out of Ship 2** — [WO-2.7](phase-2-attendance.md#wo-27--roll-call-importer), the Roll Call!
importer, on 2026-08-09: no live data is coming across, the rosters are pasted fresh, and the ledger
starts empty. It keeps its work order and its roadmap box; it lost its place in the running order and
its seat on WO-G2's dependency line.

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
