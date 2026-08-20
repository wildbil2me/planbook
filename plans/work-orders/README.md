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
3. Work on `main`. A work order is a commit or a short stack of them, not a branch — of any kind.
   *(Phase branches were retired on 2026-08-15 by WO-1.19; the reasoning is in `CLAUDE.md`
   § Conventions and in the work order itself. **This step is the only per-phase answer to "where
   does this work go?" — the `Branch: phase/<n>-<slug>` line that opened all eight phase files went
   on 2026-08-16, WO-1.20.** Deleted rather than put in the past tense, for two reasons. No single
   tense fitted: Phases 1–3 named a branch that existed and was deleted, Phases 4–8 named one that
   was never cut, and eight headers in two voices read worse than none. And the answer is now the
   same for every phase, so writing it eight more times would guarantee this work order a successor
   — WO-1.19 rewrote the two files it knew about and there turned out to be six, which is the whole
   reason WO-1.20 exists. When Ship 3 settles branching, this step is the one line that changes.
   The branches themselves are history and the history is kept: `CHANGELOG.md`, WO-1.19's decision
   record, and the dashboard note below on where WO-1.13 landed.)*
4. Move its **Acceptance** lines into `TESTING.md` and run them. They are written to be checklist
   items already.
5. Then, and only then, do the roadmap maintenance protocol: tick the roadmap box, note any
   divergence in an *(italic paren)*, update the dashboard, add the `CHANGELOG.md` entry.

**Do not tick a work order that is written but unverified.** Same rule as the roadmap, same reason.

**Status vocabulary:** `⬜ NOT STARTED` · `🤖 CLAIMED — <dispatch>` · `🔨 IN PROGRESS` ·
`✅ DONE — <date>` · `🚧 BLOCKED` · `🔒 GATED` · `🚫 STRUCK — <date>` · `⏳ DEFERRED — <date>` ·
🚩 marks a **go-live blocker**.

**`🔒 GATED` means do not start it, and what it is gated *on* is the work order's to say.** `next`
skips it and the gate report refuses it in those words. Every use of it in this directory meant
*waiting on Google's OAuth verification* until 2026-08-20, when
[WO-G2](gates.md#wo-g2--ship-2-gate-first-grades) took it for *waiting on the calendar* — four of its
boxes want a real class's real grades, and the term begins Sep 2. **That is the word used as defined
rather than widened**, and it is written here because two examples that happened to agree had started
to look like the definition. It is not `🚫` or `⏳`: the work is coming, it is counted, and the status
goes back to `⬜` when the thing it waits on arrives.

**`🚫` and `⏳` are the two that mean this is not coming, and 2026-08-16 (WO-1.21) is when the tracker
gained a word for it.** `🚫 STRUCK` is a *whether*: the owner decided it should not be built, and the
roadmap box it closes — if it has one — stops being a promise. `⏳ DEFERRED` is a *when*: not now, the
box stands, and it comes back the first time somebody wants the thing. **Neither is counted in either
dashboard**, because a phase with a ceiling under 100% teaches everyone to stop reading the number;
the dashboard below names what came out in the column beside the count, and a roadmap box belonging to
one of them keeps its place in `ROADMAP.md` wearing the matching glyph straight after its checkbox.
**They are two statuses and not one on purpose** — WO-3.13 and WO-2.7 are the two live cases and each
argues the difference in its own words. Neither can be `--start`ed, `--tick`ed or `--release`d, and
neither will ever satisfy a dependency: `wo-gate.mjs` says that in those words rather than reporting a
wait that can never end. **Both are written by hand and reversed by hand** — this is the owner's
decision, and no flag writes or unwrites it.

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
| [`phase-1-shell-store-roster.md`](phase-1-shell-store-roster.md) | WO-1.1 … WO-1.25 | Phase 1 |
| [`phase-2-attendance.md`](phase-2-attendance.md) | WO-2.1 … WO-2.54 | Phase 2 |
| [`phase-3-gradebook.md`](phase-3-gradebook.md) | WO-3.1 … WO-3.26 | Phase 3 |
| [`phase-4-signals.md`](phase-4-signals.md) | WO-4.1 … WO-4.5 | Phase 4 |
| [`phase-5-outreach.md`](phase-5-outreach.md) | WO-5.1 … WO-5.4 | Phase 5 |
| [`phase-6-calendar-glance.md`](phase-6-calendar-glance.md) | WO-6.1 … WO-6.6 | Phase 6 |
| [`phase-7-sync.md`](phase-7-sync.md) | WO-7.1 … WO-7.3 | Phase 7 🔒 |
| [`phase-8-packaging.md`](phase-8-packaging.md) | WO-8.1 … WO-8.12 | Phase 8 |

*None of these files says where its work goes, on purpose. **Work lands on `main`** — step 3 above
is the single answer for every phase, and the `Branch:` line that opened all eight went on
2026-08-16 rather than be maintained in eight copies (WO-1.20).*

**The middle column is first-and-last in document order, and `node tools/wo-gate.mjs --audit` reads
every row of it against the file it names** *(2026-08-16, WO-1.21)*. The `…` is prose shorthand for
"through", never a range to expand — which is why `WO-2.1 … WO-2.34` is correct over thirty-three
work orders, WO-2.2 having been merged into WO-2.1 on 2026-08-06. **Nine rows rot the same way, one
per phase, every time a phase gains a work order**: the Phase 1 row read `WO-1.1 … WO-1.19` from the
day WO-1.20 was booked, and it was fixed here as a check rather than as a row because the next
booking breaks it again otherwise. A file with work orders and no row is caught too — a file nothing
indexes is a file nobody reads.

---

## Dashboard

| Phase | Work orders | Done | Not coming | Status |
|---|---|---|---|---|
| 1 — Shell, store, roster | 25 | 25 | — | 🔨 IN PROGRESS (reopened six times; last on 2026-08-19) |
| 2 — Attendance | 52 | 51 | ⏳ WO-2.7 | 🔨 IN PROGRESS |
| 3 — Gradebook | 25 | 24 | 🚫 WO-3.13 | 🔨 IN PROGRESS |
| 4 — Signals | 5 | 1 | — | 🔨 IN PROGRESS |
| 5 — Outreach | 4 | 0 | — | ⬜ NOT STARTED |
| 6 — Calendar & glance | 6 | 4 | — | 🔨 IN PROGRESS |
| 7 — Drive sync | 3 | 0 | — | ⬜ NOT STARTED — WO-7.1 ungated 2026-08-20; WO-7.2 and WO-7.3 still 🔒 |
| 8 — 1.0 packaging | 12 | 5 | — | 🔨 IN PROGRESS |
| Gates | 4 | 1 | — | 🔒 GATED — WO-G2 waits on Sep 2; WO-G3 on four weeks after it |
| | **136** | **111** | **2** | `[████████░░] 82%` |

***Phase 2 read `50 | 49` here until 2026-08-20, and Phase 8 read `11 | 5`.*** *Both were stale, and
in the direction that undercounts: WO-2.53 and WO-2.54 landed on 2026-08-19–20 without this table being
recomputed, and WO-8.12 was booked on the 20th. **This table is `--tick`'s to write, not a hand's** —
`recomputeDashboard()` reads every phase file and rewrites columns 2, 3 and 4, which is why
`wo-gate.mjs` says in as many words that it does not belong in `--audit`. It went stale anyway, because
`--audit` checks* ROADMAP.md*'s dashboard and never this one, so nothing was watching. The numbers here
were recomputed by hand against the same rule `--tick` applies — total is headings minus struck and
deferred, done is `✅ DONE` — and* **the next `--tick` is still the authority.** *Recorded rather than
quietly corrected, because a count that moves without a reason is the thing the paragraph below is
about.*

***The fourth column arrived on 2026-08-16 (WO-1.21), and it is what makes the third honest.*** *The
count is now work orders somebody intends to write, so a phase can reach 100%; the two that left are
named in the row they left, by `wo-gate.mjs` and out of the same parse that produces the numbers
beside them — a hand-written note would have been true today and stale at the next strike. **Where
they went:*** [*WO-2.7*](phase-2-attendance.md#wo-27--roll-call-importer) *is `⏳ DEFERRED` — the Roll
Call! importer, deferred by the owner on 2026-08-09, keeping its work order, its dependency and its
roadmap box, and coming back the first time somebody wants a prior year read in.*
[*WO-3.13*](phase-3-gradebook.md#wo-313--paste-a-column-of-scores) *is `🚫 STRUCK` — pasting a column
of scores, struck by the owner on 2026-08-15 because the scores arrive on paper. Both are still in
their phase files, in full, with the reasoning at the top; neither was deleted and neither is hidden.
**The denominator went down by two and the percentage went up by one point**, which is the move to
distrust — the guard against it is that the number and the names come out of one pass, so a work
order cannot leave the count without appearing in the column beside it.*

*Phase 1 was stamped ✅ DONE on 2026-08-06 and reopened the same day. WO-2.1 needed a screen to live
in and found that `<main>` has no navigation — the header class row sets a preference and repaints
itself, and nothing swaps the panel underneath. That is a Phase 1 gap discovered by Phase 2, so it
is booked where it belongs (WO-1.13) rather than smuggled into an attendance work order to keep a
dashboard tidy. The work landed on `phase/2-attendance`, because that is where the tree was.*

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

The rows below, between 2026-08-09 and ~2026-09-15, ending at
[WO-G2](gates.md#wo-g2--ship-2-gate-first-grades). *(This sentence opened with a count and no longer
does. It read "Eighteen" on 2026-08-09, was corrected to "Thirty" on 2026-08-10, and was sitting above
fifty-four rows on 2026-08-16 — wrong for longer than it was ever right, and its own note had been
recording the drift without fixing it since the first correction. **The count is struck rather than
corrected a third time**, which is WO-2.23's "cite a symbol, not a line number" rule applied to a
number about this file: the table below is the count, it is three lines away, and it cannot go stale.
The table's last row number moves on its own and is the thing to read if a total is wanted.)*
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
| 17 | [WO-1.15](phase-1-shell-store-roster.md#wo-115--the-restore-compare-cannot-see-what-it-is-about-to-delete) The restore compare cannot see what it deletes | S | | Aug 23, half a day |
| 18 | [WO-2.25](phase-2-attendance.md#wo-225--the-print-gate-is-answered-when-it-is-read-on-every-surface) The print gate is answered when it is read | S | | Aug 13–14, a sitting |
| 19 | [WO-2.21](phase-2-attendance.md#wo-221--the-44px-sweep-can-see-a-screen-that-is-not-the-one-on-screen) 44px sweep sees every view | S | | Aug 25, half a day |
| 20 | [WO-3.12](phase-3-gradebook.md#wo-312--the-grade-engine-cases-cover-the-arguments-the-engine-actually-takes) Grade-engine cases cover real arguments | S | | Aug 25, half a day |
| 21 | [WO-2.22](phase-2-attendance.md#wo-222--a-missing-harness-is-a-failure-and-one-call-per-line-stops-being-an-assumption) A missing harness fails; one call per line is checked | S | | Aug 25, half a day |
| 22 | [WO-2.24](phase-2-attendance.md#wo-224--nothing-in-the-tree-notices-if-the-shared-date-reset-is-deleted) The shared date reset is guarded against deletion | S | | Aug 26, half a day |
| 23 | [WO-3.21](phase-3-gradebook.md#wo-321--nothing-notices-if-the-accommodation-prompt-stops-counting-students) The accommodation prompt's dedupe is unguarded | XS | | Aug 26, an hour |
| 24 | [WO-3.7](phase-3-gradebook.md#wo-37--per-student-grade-detail) Per-student grade detail | L | ✔ | Aug 25–29 |
| 25 | [WO-8.7](phase-8-packaging.md#wo-87--the-name-and-the-host-decided) **The name and the host, decided** | S | | Aug 28, a sitting |
| 26 | [WO-8.8](phase-8-packaging.md#wo-88--read-the-deployment-not-the-repository) Read the deployment, not the repository | S | | Aug 28, half a day |
| 27 | [WO-3.9](phase-3-gradebook.md#wo-39--grades-print--csv) Grades print & CSV | M | ✔ | Aug 28–Sep 2 |
| 28 | [WO-3.6](phase-3-gradebook.md#wo-36--past-due-prompt) Past-due prompt | S | ✔ | Aug 14 |
| 29 | [WO-3.8](phase-3-gradebook.md#wo-38--accommodation-prompts-at-point-of-use) Accommodation prompts at point of use | S | ✔ | Aug 14–15 |
| 30 | [WO-3.19](phase-3-gradebook.md#wo-319--the-overdue-tint-on-a-score-grid-column-head) The overdue tint on a column head | XS | | Aug 15, half a day |
| 31 | [WO-2.9](phase-2-attendance.md#wo-29--pass-banner-overdue-alerts-and-history) Pass overdue alerts & history | M | | Aug 15–16 |
| 32 | [WO-2.26](phase-2-attendance.md#wo-226--the-student-report-screen-shows-the-hall-passes) The Student Report screen shows the hall passes | S | | Aug 16, a sitting |
| 33 | [WO-2.27](phase-2-attendance.md#wo-227--where-the-pass-work-says-one-thing-and-does-another) Where the pass work says one thing and does another | S | | Aug 16, a sitting |
| 34 | [WO-2.28](phase-2-attendance.md#wo-228--the-pass-tick-reads-the-document-not-the-banner) The pass tick reads the document, not the banner | S | | Aug 17, a sitting |
| 35 | [WO-2.29](phase-2-attendance.md#wo-229--the-overdue-alert-gets-its-primary-channel-back) The overdue alert gets its primary channel back | M | | Aug 18, a day + an iPad sitting |
| 36 | [WO-3.15](phase-3-gradebook.md#wo-315--a-way-to-add-an-assignment-from-the-score-grid) Add an assignment from the grid | S | | Aug 17 |
| 37 | [WO-3.16](phase-3-gradebook.md#wo-316--left-and-right-arrows-move-across-the-grid) Left and right arrows across the grid | S | | Aug 17 |
| 38 | [WO-8.9](phase-8-packaging.md#wo-89--the-sweep-cannot-see-_headers) The sweep cannot see `_headers` | S | | Aug 18 |
| 39 | [WO-1.17](phase-1-shell-store-roster.md#wo-117--the-backup-nag-cannot-see-a-year-whose-only-content-is-grades) The backup nag cannot see a grades-only year | S | | Aug 19, half a day |
| 40 | [WO-8.10](phase-8-packaging.md#wo-810--the-app-cannot-say-which-build-it-is-running) The app cannot say which build it is running | S | | Aug 19, a sitting |
| 41 | [WO-1.18](phase-1-shell-store-roster.md#wo-118--the-harness-section-comment-miscounts-its-own-checks) The harness comment miscounts its checks | S | | Aug 19, a word |
| 42 | [WO-1.19](phase-1-shell-store-roster.md#wo-119--the-phase-branch-convention-is-dead-and-still-written-down) The phase-branch convention is dead and still written | S | | Aug 19–20, a sitting |
| 43 | [WO-3.20](phase-3-gradebook.md#wo-320--one-date-formatter-and-a-name-that-means-one-thing) One date formatter, and a name that means one thing | S | | Aug 24, a sitting |
| 44 | [WO-2.30](phase-2-attendance.md#wo-230--archiving-the-open-class-misdirects-the-pass-alert) Archiving the open class misdirects the pass alert | S | | Aug 24, a sitting |
| 45 | [WO-2.31](phase-2-attendance.md#wo-231--the-held-audio-context-has-two-ways-to-die-that-nothing-watches) The held audio context has two ways to die | S | | Aug 24, a sitting |
| 46 | [WO-3.22](phase-3-gradebook.md#wo-322--the-key-legend-omits-a-pair-the-hint-beside-it-promises) The key legend omits a pair the hint promises | S | | Aug 24, a sitting |
| 47 | [WO-3.23](phase-3-gradebook.md#wo-323--the-score-grid-never-learns-which-modifier-keys-were-held) The grid never learns which modifiers were held | S | | Aug 24, a sitting |
| 48 | [WO-1.20](phase-1-shell-store-roster.md#wo-120--the-retired-phase-branch-rule-is-still-live-in-roadmapmd-and-testingmd) The retired branch rule is still live in `ROADMAP.md` | S | | Aug 24, a sitting |
| 49 | [WO-1.21](phase-1-shell-store-roster.md#wo-121--the-tracker-has-no-word-for-work-that-is-not-coming) The tracker has no word for work that is not coming | S | | Aug 24, a sitting |
| 50 | [WO-2.32](phase-2-attendance.md#wo-232--the-overdue-tone-is-withdrawn-and-the-tint-is-the-alert) The overdue tone withdrawn, the tint is the alert | S | | **Built 2026-08-16; one 👤 line open.** An iPad sitting, nothing to build |
| 51 | [WO-3.24](phase-3-gradebook.md#wo-324--no-legend-row-in-this-app-has-ever-been-measured-for-spill) No legend row has been measured for spill | S | | Aug 26, half a day |
| 52 | [WO-2.34](phase-2-attendance.md#wo-234--nothing-compares-the-marking-key-list-with-the-keys-the-screen-answers-to) The marking key list is unchecked against its keys | S | | Aug 26, half a day |
| 53 | [WO-2.35](phase-2-attendance.md#wo-235--a-key-bound-any-way-but-a-literal-comparison-is-invisible-to-both-key-checks) A key bound any way but a literal comparison is invisible | S | | Aug 27, half a day |
| 54 | [WO-2.36](phase-2-attendance.md#wo-236--retiring-a-key-correctly-turns-both-key-checks-red) Retiring a key correctly turns both key checks red | S | | Aug 27, half a day |
| 55 | [WO-2.37](phase-2-attendance.md#wo-237--the-codex-cap-silently-excludes-any-work-order-with-a-slow-acceptance) The Codex cap silently excludes a slow acceptance | S | | Aug 28, half a day |
| 56 | [WO-2.38](phase-2-attendance.md#wo-238--nothing-exercises-the-anti-vacuity-guard-so-it-can-rot-behind-a-green-run) Nothing exercises the anti-vacuity guard | M | | Aug 28, a day |
| 57 | [WO-2.39](phase-2-attendance.md#wo-239--four-line-references-in-toolsreadmemd-have-been-wrong-for-thousands-of-lines) Four line references in tools/README.md are wrong | S | | Aug 29, half a day |
| 58 | [WO-2.40](phase-2-attendance.md#wo-240--the-codex-invoke-gates-have-never-been-exercised-by-anything-but-a-hand) The codex-invoke gates are exercised by nothing | S | | Aug 29, half a day |
| 59 | [WO-2.41](phase-2-attendance.md#wo-241--the-wo-315-mislabel-lives-only-in-a-status-file-that-says-to-delete-it) The WO-3.15 mislabel has no home but a status file | XS | | Aug 29, an hour |
| 60 | [WO-2.42](phase-2-attendance.md#wo-242--waitforpassalert-waits-on-a-flag-its-callers-do-not-assert-so-a-correct-app-can-go-red) waitForPassAlert() waits on a flag its callers do not assert | S | | Aug 30, half a day |
| 61 | [WO-2.44](phase-2-attendance.md#wo-244--wo-gates-repo-write-guard-is-case-blind-to-the-one-thing-it-guards) wo-gate's repo-write guard is case-blind to what it guards | XS | | Aug 30, an hour — **ahead of #62 on purpose** |
| 62 | [WO-2.43](phase-2-attendance.md#wo-243--three-more-pointers-in-toolsreadmemd-miss-by-little-enough-to-be-believed) Three more pointers miss by little enough to be believed | XS | | Aug 30, an hour |
| 63 | [WO-2.45](phase-2-attendance.md#wo-245--the-outer-bash-timeout-binds-ten-minutes-before-the-cap-everything-is-calibrated-to) The outer Bash timeout binds before the cap | M | | **A decision before a keystroke.** Aug 31, a day |
| 64 | [WO-2.46](phase-2-attendance.md#wo-246--three-readings-in-the-pass-block-sit-behind-waits-that-do-not-assert-them) Three readings sit behind waits that do not assert them | S | | Aug 31, half a day |
| 65 | [WO-2.47](phase-2-attendance.md#wo-247--the-repo-write-guard-is-protected-by-prose-in-both-scripts-that-carry-it) The repo-write guard is protected by prose | S | | Aug 31, half a day |
| 66 | [WO-1.16](phase-1-shell-store-roster.md#wo-116--the-term-opens-in-a-fresh-year) **The term opens in a fresh year** | S | | **When the roster arrives — hard stop before the first class.** Re-queued 2026-08-15: premise expired, clean slate, see its amendment |
| 67 | [WO-1.22](phase-1-shell-store-roster.md#wo-122--copy-a-class-carrying-its-terms-and-its-categories) Copy a class, with its terms and categories | S | | Booked and built 2026-08-17, **an hour after the row above it closed** — see the correction below |
| 68 | [WO-3.25](phase-3-gradebook.md#wo-325--a-score-cell-takes-any-string-number-can-read-not-any-number-a-teacher-can-mean) A score cell takes any string `Number()` can read | M | | Sep 1, a day — **ahead of WO-2.48 on purpose** |
| 69 | [WO-1.23](phase-1-shell-store-roster.md#wo-123--import-a-classs-students-and-contacts-from-the-sis-csv) **Import students and contacts from the SIS CSV** | M | | **When the roster arrives — before the first class.** Sep 1–2, a day |
| 70 | [WO-2.50](phase-2-attendance.md#wo-250--a-date-outside-every-term-is-not-a-date-to-mark) **A date outside every term is not a date to mark** | M | | **Before Aug 28 — the window this lives in is open now.** Aug 19, a day |
| 71 | [WO-2.48](phase-2-attendance.md#wo-248--the-sweeps-list-of-guarded-scripts-is-written-down-rather-than-derived) The sweep's list of guarded scripts is not derived | S | | Sep 2, half a day |
| 72 | [WO-2.49](phase-2-attendance.md#wo-249--the-ticks-acceptance-check-cannot-read-a-work-order-with-crlf-line-endings) The tick cannot read a CRLF work order | S | | Sep 2, half a day — **booked out of WO-3.25s tick** |
| 73 | [WO-2.51](phase-2-attendance.md#wo-251--the-term-ended-and-the-screen-never-said-so) The term ended and the screen never said so | S | | Sep 3, half a day — **the first rollover is late October** |
| 74 | [WO-2.52](phase-2-attendance.md#wo-252--the-register-opens-on-the-term-not-on-the-clock) **The register opens on the term, not on the clock** | L | | **Before Sep 2 — the window this lives in is open now.** Aug 20, a day |
| 75 | [WO-3.26](phase-3-gradebook.md#wo-326--the-ungraded-count-on-the-home-screen) The ungraded count on the home screen | S | | Aug 21, half a day |
| 76 | [WO-2.54](phase-2-attendance.md#wo-254--today-goes-to-the-term-and-there-is-no-way-back-to-today) **`Today` goes to the term, and there is no way back to today** | M | | **Before Sep 2 — the register opens in the wrong term right now.** Aug 20, half a day |
| 77 | [WO-2.53](phase-2-attendance.md#wo-253--the-rows-detail-panel-says-what-the-row-already-says) **The row's detail panel says what the row already says** | L | | **Before Sep 2 — while there is no habit to unlearn.** Aug 21, a day |
| 78 | [WO-G2](gates.md#wo-g2--ship-2-gate-first-grades) **Ship 2 gate: first grades** | S | — | ~Sep 15 |

***WO-3.18 left this table on 2026-08-20, owner-directed, and it is the only row ever removed from it
rather than reordered.*** *Its row was #78 and its cell read* **"One uninterrupted sitting, then a
queue. Submit by ~Sep 15."** *The sitting turned out not to exist yet: the work order's third
deliverable is a demo video* **showing the scope in use**, *and nothing in the app uses the scope —
the token flow is* [WO-7.1](phase-7-sync.md#wo-71--auth) *and it has not been built. So WO-3.18 gained
a third dependency, dropped to* `**Ship** —`, *and moved to* [§ After Ship 3](#after-ship-3--the-sign-in-and-the-paperwork)
*with WO-7.1 ahead of it. The full reasoning is in the two notes under its own header;* **the ship
argument is WO-G2's own, from 2026-08-10:** *Ship 2 is first grades and contains no sync, and keeping
the row would have put an M of token flow inside it to protect one checkbox.* **WO-G2's eighth box was
re-homed rather than waived** *— to WO-3.18's own third Acceptance line, with* `--tick` *holding the
pointer, which is the mechanism* [WO-3.11](phase-3-gradebook.md#wo-311--owes-and-splitting-what--in-progress-means)
*built for exactly this. Nothing else in the table moved.*

***Removing #78 pinned `next` on the gate, and that took a second edit the same day.***
`next` *walks these tables in* **document order** *and stops at the first* `⬜`. *WO-3.18 had been
standing in that slot and was a real answer — the cell above said "startable now." With it gone,*
`next` *returned* **WO-G2**, *whose eleven dependencies are all* `✅ DONE` *and which reports* `PASS`
*— and which cannot be worked until there are real grades to run it against.* **It hid seven `⬜` work
orders behind it:** *all four remaining rows of § Ship 3, plus WO-8.12, WO-7.1 and WO-3.18. A `next`
that answers with a row nobody can start, for four weeks, is a `next` people stop running.*

***The fix was the gate's status, not the tool.*** *WO-G2 is* `🔒 GATED` *as of 2026-08-20 — the word
the vocabulary already had, and the gate report's own sentence for it is* **"do not start it,"** *which
is the truth about a checklist waiting on Sep 2.* `next` *now returns* **WO-4.2**, *the head of*
[§ Ship 3](#ship-3--signals) *— so the tool and the running order agree again, and* `CLAUDE.md`*'s
"§ Ship 3 is the running order" is now something* `next` *says rather than something a human has to
know.* **Put WO-G2 back to `⬜` when the grades exist** *— `--tick` refuses the status, so the gate
cannot be closed while wearing it, which is the safety this leans on. **Teaching `next` to skip a gate
by reading its `**Target**` was the alternative and was refused:** it would have taught the tool to
walk past WO-G1, which was the one row nobody was allowed to walk past.*

*WO-2.50 and WO-2.51 were booked on 2026-08-18, owner-directed, out of her own report from the deployed
app: her first term begins Aug 28 and the attendance grid was offering Aug 18 to mark. **WO-2.50 is
rowed ahead of WO-2.48 and WO-2.49**, which had been `next` and `next` after it — the same move rows #61
and #68 made, and the same one-line reversal if the owner wants the housekeeping first. The argument is
the calendar rather than the size: both of those are half-days of harness housekeeping with no deadline,
and **the window WO-2.50's defect lives in is open right now.** Aug 18 → Aug 28 is the setup fortnight,
every tap in it is a test tap, and in this data model a test tap is a recorded meeting in the live
ledger — sitting in the year total and in no term's percentage, where nothing on any screen can find it.
Ten days of that is what the row buys back.*

*WO-2.52 was booked on 2026-08-19, owner-directed, out of the screen the two rows above it left
behind: her term now starts **Sep 2**, and WO-2.50 working exactly as specified means the register
draws six greyed columns with nothing to tap on them until it does. It is rowed **immediately after
WO-2.51** and ahead of the Ship 2 gate for the same reason WO-2.50 was rowed ahead of the housekeeping:
the setup fortnight is the window this lives in, and it is open right now. It is an **L** rather than
the S its sibling rows were, because it moves the write gate and not only the drawing — see its own
four decisions, two of which reverse something already in writing here.*

*WO-3.26 was booked on 2026-08-19, owner-directed, by* [*WO-1.25*](phase-1-shell-store-roster.md#wo-125--phase-6-is-cut-against-a-model-that-is-not-there)
*out of a read-only audit of Phase 6, and it is a **Phase 3** row in this table on the strength of one
standing obligation:* **the home screen accretes** *— every phase adds its line to WO-1.10's screen
rather than deferring it to Phase 6.* `src/home.js` *has appended* `.class-card-signals` *empty since
2026-08-04 with* `WO-3.x — ungraded work` *written in the file as its owner, and the string* `home
screen` *appears in no Phase 3 work order at all, so Phase 3 would have closed with the slot unfilled
and WO-6.4 carrying the debt unmarked. Both its dependencies are* `✅ DONE` *— WO-3.4's engine and
WO-1.10's screen — so it is buildable today rather than late in the phase it belongs to.* **It gates
nothing:** *WO-G2's* `**Depends on**` *is a curated explicit list and not every row in this ship,
which is why* [WO-3.25](phase-3-gradebook.md#wo-325--a-score-cell-takes-any-string-number-can-read-not-any-number-a-teacher-can-mean)
*has sat in this table since 2026-08-17 without gating the gate.* **WO-3.18 and WO-G2 each moved down
one; nothing moved above them.**

*WO-2.53 was booked on 2026-08-20, owner-directed, out of her own reading of the deployed registry: the
⋯ on a row opens a panel that repeats the row. **It was rowed at #76, so it was `next` and WO-3.18 was
not** *(WO-2.54 took #76 the following day, and this row is #77)* — and WO-3.18 and WO-G2 have now
each moved down one a second time, for the second time without anything moving above them, which is
the shape to expect from this table rather than a sign of churn. The
ordering argument is the owner's and it reversed the first answer given: the instinct was
`⏳ DEFERRED`, on the grounds that rewiring the critical-path marking screen thirteen days before
teaching with it is a risk taken for a cosmetic gain. **Her reversal is that the risk runs the other
way** — after Sep 2 there is a term of muscle memory invested in a control that is being removed, so
the change is cheapest now and gets dearer every week. It is an* **L** *and not the S it looks like,
because the note and the un-confirm have to land somewhere before the panel can go, and where they land
is a file whose header promises it holds no writers.*

*WO-2.54 was booked on 2026-08-20, owner-reported off the deployed app, and it is* **a defect in WO-2.52
three days after it shipped** *rather than a new capability: `Today` returns to the selected term's edge
and no control on the screen goes back to today. It is rowed at* **#76, ahead of WO-2.53**, *which had
been `next` for a day — the argument is neither size nor recency but that both rows are in the same file
and one of them is broken. WO-2.53 rewires the registry's row and the pager sits beside it; doing the
defect first means that work rebases onto a pager that is correct, and doing it second means an L landing
on top of a live bug on the critical-path screen twelve days out.* **A one-line reversal if the owner
wants the panel first** — *the same reversal offered at #61 and #70.* **WO-2.53, WO-3.18 and WO-G2 each
moved down one; nothing moved above them**, *which is now the third time in two days and still the shape
of this table rather than churn.*

***WO-8.4 was rowed into this table on 2026-08-19 and taken back out the same day***, *owner-directed
both times, by* [*WO-1.24*](phase-1-shell-store-roster.md#wo-124--the-ships-past-2-have-no-running-order)
*and its § Correction. **The row is recorded rather than erased**, because the argument that put it here
was checkable and nobody checked it. It was: WO-8.4's fourth Acceptance box and* **WO-G2's fifth are the
same check** *— the gradebook printout ordered to match the SIS entry screen — so landing it after a
hand re-key of five classes would cost a second one.*

***The check was already closed, by the work order two rows of prose below this one.***
[*WO-3.9*](phase-3-gradebook.md#wo-39--grades-print--csv) *is where the SIS ordering was decided: the
owner answered it on 2026-08-12, it is recorded there so a verifier need not trust the builder's memory,
and on 2026-08-13 the owner printed the sheet and confirmed it against the live SIS. **WO-8.4 reorders
nothing** — its deliverables are chrome, a header, a modal gate and a presentation-mode rule. And it
cannot close at all yet: one of its four surfaces is the calendar month, which* [*WO-6.3*](phase-6-calendar-glance.md)
*has not built. **So the move would have put a work order that cannot finish into a ship, to protect a
box that was already ticked** — and the "Never cut" paragraph below was making the WO-3.9 argument
correctly the whole time, three paragraphs from where the mistake was written.*

***WO-3.18's cell says what it is waiting on, and it is not a dependency.*** *Owner-reported
2026-08-19: the OAuth submission is a form that wants one uninterrupted sitting, and the days before
the term are being worked in and out of. Both its gates have been clear since WO-8.7 settled the
domain, so it is startable now and has been — **what it costs is attention, not prerequisites.** It
stays rowed ahead of WO-G2 because* **WO-G2's eighth box cannot be ticked until this is submitted**,
*and because the queue it enters afterwards is Google's rather than anybody's here: submitting on ~Sep
15 does not delay Ship 2, it delays* [*Phase 7*](phase-7-sync.md) *by however long the review takes.*

***WO-2.51 is rowed behind both of them instead***, *at #73 and not beside its sibling, because its
deadline is genuinely different: the first term rollover is late October, and a reminder to move to
Quarter 2 has nothing to remind anybody of before then. It also depends on WO-2.50's predicate, so it
could not lead. **They were cut as two rather than one** for that reason and only that one — the lock
must land before the term and the nudge must not hold it up.*

*WO-1.22 was booked on 2026-08-17, owner-directed rather than out of a dispatch, rowed in the same
sitting, dispatched within the hour and closed the same evening — booked, built and ticked between two
readings of this table.*

*WO-3.25 was booked on 2026-08-17, owner-directed, out of the owner's own report that a score cell
takes values it should not. It is rowed **ahead of WO-2.48**, which had been `next`: WO-2.48 is a
half-day of harness housekeeping and WO-3.25 is a wrong-number path in the screen that is the whole
point of Ship 2. The same move row #61 made over #62, and the same one-line reversal if the owner
wants the housekeeping first.*

***It was first seated at #66, ABOVE WO-1.16, on an argument whose premise was already false when it
was written, and it now sits at #67, below it.*** *The argument was: WO-1.16 is the fresh-year cutover,
five classes created from nothing, and a copy button is what makes that setup one keying instead of
five — so land it afterwards and what ships is a button for next August. **WO-1.16 had closed about an
hour earlier**, at commit `0c12da4`, in a log that was on screen when the row was written. So the
placement was not a judgment that turned out badly; it was a claim about the future made after the
future had happened, which is the one kind of tracker error nothing here can catch — `--audit` reads
fragments, pointers and counts, and no check compares a row's reasoning against a status two files
away.*

***The row was dropped rather than the paragraph quietly amended, on the precedent one commit below
it*** *(`71818da`, which corrected WO-2.48's premise and moved it under WO-1.16 for a different
reason). The rows in this table are read in order by people and by `next`, and a done row seated above
the row it claimed to precede reads as a record of something that did not happen. **The cell is the
correction and this paragraph is the reason**; both are left in rather than tidied away, because the
useful thing here is not the position, it is that the argument was checkable in the log and was not
checked.*

***What survives the correction is the feature's own case, which never rested on the ordering.*** *Five
sections that share a calendar and a weighting are set up once rather than five times — true in the week
the term opens, true next August, and true for any teacher who is not the owner. What was actually lost
by landing an hour late is one keying of one year's setup, which is a smaller thing than the paragraph
that argued for it.*

*WO-1.23 was booked on 2026-08-17, owner-directed, and given row #69 **in the same sitting** — the
running order updated at booking rather than afterwards, which is now the second time in a row rather
than the seventh failure. It is a per-class importer for the SIS's contacts export: eight columns, two
rows per student where there are two guardians, and roughly nine fields × twenty-five students × five
sections that are otherwise typed by hand before the first class. **The file's real shape was pasted
into the booking conversation and is quoted verbatim in the work order**, which is why this one is
sized M with a written fixture rather than sized L with an investigation in front of it.*

***It sits behind WO-3.25 and ahead of WO-2.48, and only one half of that is a judgment.*** *The half
that is not: WO-3.25 is `🤖 CLAIMED` with a dispatch in flight, and a row seated above work that is
already being done is the mistake three paragraphs up — a claim about the future written after the
future had started. The half that is: WO-2.48 is half a day of harness housekeeping and this is the
screen that has to be full of real students before ~Aug 24, when the owner starts teaching and capacity
halves. **It inherits the seat WO-1.16 vacated** — the cut band's argument stops applying now that
Ship 2's one deadline-the-world-sets row has closed, and this is the row that replaces it. One line
reverses the order if the housekeeping is wanted first.*

***It is deliberately not 🚩.*** *The paste box plus hand-keyed contacts is a working fallback — slow,
not blocked — and a go-live blocker is a thing without which the term cannot open. What is at stake
here is an evening of typing, five times over, which is worth an M and is not worth a flag.*

***Row #68's cell was reworded in the same edit and that is not tidying.*** *It read* **ahead of #69
on purpose** *and #69 is now this row rather than WO-2.48, so a true sentence became a false one by
somebody else's insertion. It names the work order now.* **A running-order cell that argues against a
row number argues against whatever lands there next** *— WO-2.23's "cite a symbol, not a line number"
rule, in the one file where the numbers are guaranteed to move. Row #61's cell has the same shape and
is left alone: it is correct today, and rewriting a neighbour's reasoning inside this edit is the thing
the correction three paragraphs up says not to do.*

*WO-2.32 was given row #50 on 2026-08-16, having had none since it was booked and built on 2026-08-14.
**It is the fourth work order to land in this directory with no place in the running order**, after
WO-3.10, WO-3.12 and WO-2.24 — and it is the first of the four that was not booked by a verifier. It
was owner-directed at the iPad, mid-sitting, which is its own way of skipping the step: the work was
done before there was anything to schedule, so nobody's hand went to the table. It is not WO-1.14's
case, which is deliberately rowless and says so — that one closed inside the hour, and this one is
🔨 IN PROGRESS with a live 👤 line. **The cell says what is actually left**, which is a sitting rather
than a dispatch: the tint, the silence, and the speaker persisting across a relaunch. Everything below
it moved down one.*

*WO-3.24 and WO-2.34 were booked on 2026-08-16 out of WO-3.22's implementation and its iPad sitting,
and given rows #51 and #52 the same day — the rule six paragraphs down being obeyed rather than
recorded a fifth time. WO-1.16, WO-3.18 and WO-G2 each moved down three; **nothing moved above them**,
which is the placement decision. They go behind WO-1.21 and ahead of WO-1.16 because they are the
**cut band**: neither is a defect, both guard something that is correct today, and WO-1.16 is the one
row in Ship 2 with a deadline the world sets. WO-3.18 keeps its place as the last work order before
the gate.*

***They are two halves of the same finding and were deliberately not made one work order.*** *WO-3.22
existed because nothing compared the score grid's key card with the keys the grid answers to, and it
closed that in one direction on one panel. What the sitting then showed is that the panel had never
been **measured** either — the 2026-08-16 iPad look is the first time any legend row in this app was
examined for spill, and it was a pair of eyes, not an instrument — and that the **attendance** legend
has exactly the comparison gap WO-3.22 was written for, on the screen a teacher is on while students
walk in. One is a layout measurement over `.scores-key`; the other is a document comparison over a
modal `<dl>` with its own map and its own two exceptions. Folding them would put two unrelated claims
in one work order, which is the shape WO-3.22 declined twice inside its own dispatch.*

***WO-3.24 is the first of the two to cut and it carries a risk WO-3.22 could not take.*** *If the
measurement lands red it will be on WO-3.16's `← →` row, which was already the longest in the panel —
and rewording that row is **in** WO-3.24's scope precisely because it was out of WO-3.22's, which is
why the follow-up is a row rather than a correction round. The owner's sitting says it will not go
red; the row exists because "will not" from one pair of widths on one device is not a check.*

*WO-2.35 and WO-2.36 were booked on 2026-08-16 out of WO-2.34's verification and given rows #53 and
#54 the same day. WO-1.16, WO-3.18 and WO-G2 each moved down two; **nothing moved above them**, and
they take WO-3.24 and WO-2.34's placement argument unchanged — the **cut band**, behind the work order
that produced them and ahead of the one row in Ship 2 with a deadline the world sets. Neither is a
defect: both key checks are green and correct on the tree that booked them.*

***They are the two ways a check can be right today and wrong later, and they were deliberately not
made one work order.*** *WO-2.35 is a check that will **pass when it should fail** — both blocks learn
what the code binds by grepping for a literal `=== '…'`, so a key added through a `switch`, an
`includes()` or `e.code` is bound and invisible, and the legend row it needs goes unwritten exactly as
`↑ ↓` did. WO-2.36 is the same two blocks **failing when they should pass** — the anti-vacuity floors
are hardcoded to the counts of the day they were written, so retiring a key on both sides at once, an
edit that leaves the two in perfect agreement, turns them red. One is a hole and the other is a false
alarm; they touch the same four lines and want opposite things from them, which is the argument for
reading them together and against folding them.*

***WO-2.35 is the first of the two to cut, and the reason is a sentence rather than a severity.***
*The score-grid block's comment already names its static-read limit and cites the asserted count as
the reason it is tolerable — and that citation is **false**: a key added through a `switch` leaves
`bound.length` exactly where it was, so the floor it points at never moves. A wrong comment at the
one place a reader goes looking is this project's fifth work order whose deliverable is a true
sentence, after WO-1.18, WO-3.19, WO-3.20 and WO-2.27. WO-2.36's floors, by contrast, are correct
until somebody retires a key, and nobody is retiring one this term.*

***Both carry a routing fact in their Traps, and it is new.*** *WO-2.34 was rubricked to Codex and
re-routed to Claude on arithmetic — `verify-shell.mjs` runs ~262s, and `codex-invoke.mjs`'s hard
20-minute cap cannot hold four of them plus the reading and the writing. These two inherit that shape:
mutation-proved acceptance over a slow harness is now a routing constraint, not a preference. It is
written into each work order rather than only into a dispatch result because that is the whole lesson
of WO-3.19 and WO-3.20 — **a follow-up that lives only in a dispatch result file is a follow-up
nothing reads.** The cap itself is WO-2.37, booked the same day and rowed behind them.*

*WO-2.37 was booked on 2026-08-16 out of the same dispatch and given row #55, behind the two work
orders that hit the cap rather than ahead of them. WO-1.16, WO-3.18 and WO-G2 each moved down one
more. **It is the third row out of one dispatch and the only one of the three that is not about the
app's own harness** — it is about the pipeline that dispatches work orders, which is why its `**Ship**`
field reads `—` on WO-2.20's precedent: tooling sits outside the delivery plan. **It still gets a row,
and that is deliberate rather than a contradiction.** A work order in neither table is one `next` can
never reach — the mistake named at WO-1.17 and WO-1.18 — and a known hole with no row is a hole nobody
schedules.*

***The argument for pulling it forward is real and was not taken.** Fixing the cap first would let
WO-2.35 and WO-2.36 route on their merits instead of on arithmetic, and the orchestrator has now done
that multiplication by hand once and will do it twice more. Against: neither of those two is blocked
by it — a forced route to Claude is a working route — and the two harness rows are the ones with a
false comment and a false alarm in them, which are defects in what the tree says about itself. **If the
orchestrator has to do the arithmetic by hand a third time, that is the signal to pull this row
forward**, not a reason to have placed it first.*

*WO-2.38 and WO-2.39 were booked on 2026-08-16 out of **WO-2.36's verification**, and given rows #56
and #57 the same day. WO-1.16, WO-3.18 and WO-G2 each moved down two more; **nothing moved above
them.** They take the placement argument WO-2.35 and WO-2.36 established unchanged — the cut band,
behind the dispatch that produced them. **Neither is a defect on today's tree**, and WO-2.36 itself
passed: its four Acceptance lines were re-derived independently against mutated copies of the real
files, and the one prose defect the verifier found was corrected before commit rather than booked.*

***WO-2.38 is the guard-that-guards-nothing row, and it is the more interesting of the two.***
*WO-2.36 replaced six hardcoded floors with anchors asserted found by name, which is the right shape
and was proved by mutation on the day. But **on a green tree every branch of that guard is dead
code** — `vacuity` is empty, nothing downstream of it evaluates, and no check in either tool reaches
a single push site. The only thing that has ever executed them is a hand mutation applied twice on
one afternoon and reverted both times. **That is WO-2.36's own argument one level up:** empty agrees
with everything, and a guard nobody exercises agrees with everything too. It is sized M rather than S
because it carries a real design question — a self-test that drives the same predicates brushes
against **"do not write a second harness"**, and the row makes that decision explicitly rather than
assuming a sibling file is allowed.*

***WO-2.39 is the smaller and the more embarrassing.*** *Four `:NNN` pointers in `tools/README.md`
miss by roughly 3,200–3,500 lines each, and they were **already wrong at HEAD before WO-2.36 ran** —
inherited debt, not that row's doing, though it added 145 lines to the file while its entire thesis
was that a comment pointing at the wrong line is a defect. The reason it is a row rather than a quiet
fix is the fourth reference, `:1869`, which has no obvious referent: the honest deliverable there may
be "this pointed at something that no longer exists" rather than a corrected number, and that is a
judgment nobody should make inside somebody else's commit. **It also asks whether this should be
swept mechanically** — `wo-sweep.mjs` already asserts one cross-file number, so the precedent exists
to end the class rather than pay it down once.*

*[**Closed 2026-08-17, and the prediction above came out backwards.** `:1869` **was** resolvable — the
WO-1.15 banner, correct when written and 920 lines behind by the time anyone followed it. The pointer
with no recoverable answer was the fifth one carved in later, block B's `markKeys` read, which was
wrong the day it was typed under every reading and landed a reader on the exact thing its own sentence
exists to contrast itself against. **The sweep was refused**, on the ground that a resolver can only
assert the named line exists and all five wrong pointers named lines that did — the full argument is in
`plans/verification-tooling.md`. Booking a row so the judgment happened in the open rather than inside
someone else's commit is what surfaced both, so the reason it was a row held even though its guess did
not.]*

*WO-2.44 and WO-2.45 were booked on 2026-08-17 out of **WO-2.40's dispatch**, and given rows #61 and
#63 **later the same day rather than at booking — which makes them the fifth and sixth work orders to
land in this directory with no place in the running order**, after WO-3.10, WO-3.12, WO-2.24 and
WO-2.32. **This one has less excuse than any of the four.** WO-2.32's was an owner-directed fix at the
iPad, where the work was done before there was anything to schedule; these two were written as rows, by
one hand, in the sitting that also moved the dashboard from 116 to 118 and re-pointed § The files. Two
of the three artifacts were updated and the third was not. **The tell is that `--audit` passed anyway**
— it checks `**Closes roadmap**` fragments, `**Owes**` pointers, § The files and the dashboard against
its own boxes, and **nothing anywhere checks whether a work order has a row**. So the one artifact
`next` actually reads is the one artifact no gate defends, which is why the failure has now happened six
times and been caught six times by a person. Worth a row of its own; deliberately not written as one
from inside the same sitting that needed it.*

***The placement is an ordering fact rather than a priority.*** *WO-2.44 goes **ahead of** WO-2.43 at
#61 because its deliverable puts prose into `tools/README.md` near `:64`, above all three of the
references WO-2.43 exists to re-anchor — and WO-2.40's 45 insertions at `:116` had already moved those
three by +43 within hours of WO-2.43 being booked, which is recorded in an amendment on the row itself.
Doing WO-2.44 second would shift them a third time. WO-2.43 re-anchors to text and is immune to
everything after it, so it is cheapest last. **WO-2.45 sits behind both at #63** as the only M in the
band and the only one carrying a decision rather than an edit — its cell says so, because a row whose
first act is a design call should not be picked up by somebody with an hour.*

*WO-2.42 and WO-2.43 were booked on 2026-08-17 out of **WO-2.39's verification**, and given rows #60
and #61 the same day. *(WO-2.43 became **#62** later that day when WO-2.44 was inserted ahead of it —
see two paragraphs up for why. The number here is left as it was written; this is the amendment.)* WO-1.16, WO-3.18 and WO-G2 each moved down two more; **nothing moved above
them** — the cut band's argument again, unchanged for the fourth time. **The percentage went down a
point**, from 73% to 72%, which is the honest direction: two rows were added and none closed, and a
denominator that only ever grows when something closes is a denominator being managed.*

***WO-2.42 is the only one of WO-2.39's four follow-ups with a claim on anyone's attention, and it is
the flake that was not one.*** *`verify-shell.mjs` went 824 · 823 · 824 across three runs on an
unchanged documentation-only tree, and the temptation was to log it as intermittent and move on. The
verifier read the helper instead and found the seam: the wait exits on a flag, its three callers assert
the flag **and** the announcement, and the app writes them in that order — so there is a window where
the wait is satisfied and the assertion is not. **That is why this one is rowed ahead of the pointer
work rather than behind it**: a check that reddens one run in three trains its readers to re-run
instead of read, and the next real regression in WO-2.30's block arrives pre-discounted. It is booked
with the diagnosis attached, which makes it a fix rather than an investigation, and sized S on that
basis.*

*WO-2.46 was booked on 2026-08-17 out of **WO-2.42's own sibling audit** and given row #64. WO-1.16,
WO-3.18 and WO-G2 each moved down one; **nothing moved above them** — the cut band's argument for the
fifth time. It goes behind WO-2.45 rather than beside WO-2.42 because the band is ordered by when a
row was booked, not by which row produced it, and this one was booked last.*

***It is the first row here that exists because a deliverable was fulfilled and then read again.***
*WO-2.42 was told to answer whether any sibling wait exits on a proxy — a deliverable written precisely
because "an unasked question is not a deliverable" — and its first answer said no other **named helper**
does, which was true and was not the question anybody needed answered. The correction round found three
**inline** readings behind waits that do not assert them, one of them (`said41`) the closest structural
analogue in the file to the bug that row had just fixed. So the audit was run twice inside one dispatch
and came back different, and* **the row is booked on the second reading, not the first**. *That is the
argument for the deliverable being a written sentence rather than a checked box: nobody re-reads a tick.*

*WO-2.47 was booked on 2026-08-17 out of **WO-2.44's verification** and given row #65 **in the same
sitting as the row itself**, which is the first time in seven that the running order was updated at
booking rather than afterwards — the failure four paragraphs up, not repeated. WO-1.16, WO-3.18 and
WO-G2 each moved down one; **nothing moved above them** — the cut band's argument for the sixth time.
**The percentage did not move**, and that is rounding rather than management: 86/119 and 86/120 both
round to 72%, and the denominator is stated beside it so nobody has to take the bar's word for it.*

***It is deliberately not a reopening of WO-2.44.*** *That row's **Out of scope** refused a new
`--self-check` case in as many words, on the ground that the guard is a property of the harness rather
than a plant — a judgment made in the open, by a row whose whole subject was a measurement, and the
right one for it. Folding this guard back into it would delete the record of that call and leave a
spent work order carrying deliverables nobody dispatched. So the refusal stands where it was written and
the consequence gets its own row, which is the same shape WO-2.46 took out of WO-2.42's deliberate
**Out of scope**. **The half nobody has looked at is `codex-invoke.mjs`** — it has carried this fix since
WO-2.40 and no check in this repository has ever read it, which is why the sweep half of this row is
worth more than its size suggests.*

*WO-2.48 was booked on 2026-08-17 out of **WO-2.47's verification** and given row #67 the same sitting,
the second time running the order was updated at booking rather than afterwards. WO-3.18 and WO-G2 each
moved down one. **The percentage did move this time**, 76% to 75%, and it is the same rounding rather
than a step backwards: 91/120 and 91/121, one denominator apart, landing either side of 75.5. The bar is
unchanged at seven tenths, which is what the bar is actually able to say.*

***It is the first row in the cut band placed BELOW WO-1.16, and that ends a six-row habit rather than
continuing it.*** *WO-2.44 through WO-2.47 all went in above it under one argument — "nothing moved above
them" — which was sound each time and had stopped being examined by the fourth repetition. The owner
examined it here: **is this pressing enough to go there, or is it only precedent?** The honest answer was
precedent, so it moved. **What makes the placement safe rather than merely humble** is that WO-1.16's
trigger is "when the roster arrives" and not a queue slot, so its row number was always close to
decorative — while `wo-gate.mjs next` hands out whatever sits highest, which is the one thing about the
order with teeth. A half-day of toolchain hardening was standing in front of the single Ship 2 row whose
deadline is set by the world.*

***The question that moved it also corrected it.*** *Asking whether the row was pressing sent somebody
to look, and the look found `verify-shell.mjs:1073` already building a temp directory from `os.tmpdir()`
and deleting it recursively with no guard — a third script, live, on a row booked in the belief that the
third script was hypothetical. **So the row got a better argument and a smaller position on the same
afternoon**, which is the opposite of what re-litigating a placement is supposed to do and worth leaving
written down. The correction is on the row itself rather than folded away; its Out of scope now refuses
guarding the harness by the owner's direct call, and `verify-shell.mjs` is carried as a named exemption
with the reason attached — `mkdtemp` makes a fresh directory and the `rm` deletes only that directory, so
the worst case is a stray folder rather than the loss of anything that existed first.*

***It is WO-2.47's own gap, booked by the row that declined to close it.*** *That dispatch found the
sweep's `COPIES` list hardcoded at two files with nothing asserting it is complete, said so, and did not
widen to fix it — the same call WO-2.44 made about WO-2.47 and WO-2.42 made about WO-2.46, three
generations of the same discipline. **The thing worth noticing is that this is the third turn of it.**
WO-2.44 fixed a guard and left it protected by prose; WO-2.47 replaced the prose with two checks and left
the checks' own scope written down as a list; this one derives the list. Each row closes a silence and
leaves a smaller one, named, one level up. That is not a regress to chase forever — the gap this closes
is the last one where a **new** file can join the unwatched set, and what remains after it (a guard under
another name, a sandbox spelled some third way) is out of reach of any textual check and is written down
as such rather than booked. **Each turn was also cheaper than the one before**, which is the argument for
booking at the point of discovery: WO-2.44 was found by a harness escaping into the repository, WO-2.47 by
a verifier reading the fix, and this one by a question about a table row.*

***None of the three has been observed red, and that is deliberate rather than a weakness.*** *WO-2.42
was booked off a failure somebody watched happen; this one is booked off a mechanism somebody can point
at, which is the earlier and cheaper place to catch it. The acceptance is built so the row cannot pass
by assertion: `announce()`'s 30ms defer is raised to three seconds and the three checks must go red on
the unfixed tree and green on the fixed one, so the difference is measured rather than argued. **The
cost is a `src/` mutation on the file whose revert this project has twice had trouble proving**, which
is why the hash discipline is in the acceptance rather than in the traps.*

***WO-2.43 is the tail of WO-2.39 and is deliberately not part of it.*** *Three pointers, two of them
off by nine and ten lines into a 270-line file. WO-2.39 found them in a spot-check it ran to twelve
references rather than the six its Acceptance asked for, reported all twelve, and re-pointed none of
them — out of scope, said so, and named the temptation rather than acting on it. **The reason they are
worth a row at all is that they are the quiet kind:** `:1611` lands on `assignmentsFor()` when the
sentence is about `scoreCell()`, the other function named in the same paragraph, so the reader absorbs
it as their own misreading. A three-thousand-line miss reports itself; a ten-line miss into a
neighbour does not. **Nine other wrong-looking numbers in the same file are out of scope by name**,
because they are a measurement of the WO-2.19 tree and correct as history — the row says so twice,
since the obvious way to fail it is to be helpful.*

***The fourth follow-up was not booked, and neither was the audit the same sitting could have started.***
*WO-2.39 named a sweep clause that would assert every text anchor still occurs in the file it quotes —
non-vacuous, unlike the `:NNN` resolver it refused, because an empty grep is a red. It waits on a
convention for which backticked strings in 1,900 lines of prose are anchors, and **a row whose first line
is "invent a convention nobody asked for" is a row that sits at the back of the order being re-read at
every triage.** The trigger is the convention, not a queue position; the reasoning lives in
`plans/verification-tooling.md`, which is where notes about the harness go.*

*And the same sitting measured how far the practice actually reaches, which is further than
`tools/README.md`: **`src/` carries about seventy `path:NNN` pointers, forty-three of them into Roll
Call!'s `dashboard.html`.** Those forty-three are ungreppable from here and were briefly written up as
the dangerous ones; **they are the opposite.** Roll Call! development is paused in favour of this project
(owner, 2026-08-17), so its line numbers are frozen — it stays deployed and in daily use, and use does
not move a line. The rot is all in this tree, which is the one under daily change: a sample of the
twenty-four in-repo pointers found at least three that miss, one in `src/scores.css`* **corrected on
2026-08-10 and rotted again.** *That is not booked as an audit, deliberately. An*
eighty-pointer sweep across `src/` buys a tidier comment layer and no working software, three weeks
before a real class walks in, and the recurrence proves the audit is the wrong instrument anyway — a
back-catalogue pass leaves the practice that produced it intact. **The standing rule is fix-on-touch:**
WO-2.39's § 11 note is written, so a comment edited for any reason gets a text anchor on the way past,
and the wrong ones die as the files are worked. The two exceptions are rowed as WO-2.43 because a
ten-line miss will not announce itself to the reader who needs it.*

*WO-2.40 and WO-2.41 were booked on 2026-08-16 out of **WO-2.37's dispatch**, and given rows #58 and
#59 the same day. WO-1.16, WO-3.18 and WO-G2 each moved down two more; **nothing moved above them.**
They take the cut band's argument unchanged — behind the dispatch that produced them, ahead of the one
row in Ship 2 with a deadline the world sets. **Neither is a defect**: WO-2.37 passed on its second
verifier pass, and both gates WO-2.40 is about were driven by hand and behaved on the day they
shipped.*

***WO-2.40 is the same shape as WO-2.38 and is deliberately not folded into it.*** *Both are guards
whose every branch is dead code on a green tree, and both were proved once by a hand mutation that no
longer exists. But WO-2.38 is about `verify-shell.mjs` reading the app, where the standing "do not
write a second harness" rule is a live question it has to answer; WO-2.40 is about a dispatch tool
checking its own refusals, where `wo-gate.mjs --self-check` already settles the shape. One carries a
design decision and is sized M; the other carries a seam and is sized S. **The reason they are read
together is the trap they share**: WO-2.37's demonstration had to edit `INVOKE_TIMEOUT_MS` in the real
file and put it back, which is the exact mutate · run · revert hazard WO-2.37 was booked to name, and
neither row may commit a check that does it.*

***WO-2.41 is an hour and it is the one with a clock on it.*** *The only account of the 2026-08-14
kill is a status file whose own third line tells its reader to delete it, and the result file that
triggers that instruction has existed since that afternoon. Every sitting that passes is a sitting in
which somebody obeys the file and the scar goes with it. **This is the fourth row in this directory
whose deliverable is a true sentence in the right place** — after WO-1.18, WO-3.19, WO-3.20 and
WO-2.27, and it is the first of them where the sentence already exists and is simply in a file
marked for deletion.*

***And the pull-forward signal WO-2.37's own note named was never pulled.*** *That note said: if the
orchestrator has to do the cap arithmetic by hand a third time, pull the row forward. It did the
multiplication by hand again while routing WO-2.37 itself — though the route was decided in the Claude
column before the budget could matter, so the signal fired without costing anything. **The rubric now
asks the question, so the count stops here at three.***

*WO-2.31 was booked on 2026-08-14 out of WO-2.29's correction round and placed at the back of Ship 2,
directly behind WO-2.30 and ahead of the gate only. **Both halves of it are doors WO-2.29's fix left
open rather than faults in the fix**, which is why it is a row and not a second correction round: the
one-context shape is right and is audible on glass, and what is missing is a recovery path for an
interruption that never hides the app, plus a harness clause that a bare `new AudioContext()` cannot
walk past. **It takes WO-2.30's placement and WO-2.30's argument** — it needs a rare event (an
incoming call during a period with a student out), no harness check in the project can reach it
because there is no way to interrupt an audio session from CDP, and what it produces is silence
rather than an error anybody sees. A green run will never find it. **The counter-argument, and it is
real:** the failure it describes is the exact failure WO-2.29 was written to fix, on an app that goes
into a classroom in late August, and the two findings would have been lost entirely — they lived only
in a dispatch result file until this row, which is the thing WO-3.19 and WO-3.20 were booked to stop
happening. If the sprint holds, this is a cheap row to pull forward; nothing above it depends on it.*

*WO-2.30 was booked on 2026-08-14 out of WO-2.28's close-out and placed at the back of Ship 2, ahead
of the gate only. **It is a separate bug, not a WO-2.28 loose end** — its cause is
`getSelectedClassId()`'s `list[0]` fallback in `src/classes.js:165`–`170`, not anything in
`paintPassElapsed()`, and it predates the work order that found it. It sits at the back because it
needs a class archived while a student is out on a pass, which is rare; it is in Ship 2 rather than
deferred because **no harness check in the project can currently reach it**, so it will not be found
by a green run, and the failure it produces is a pass alert computed for the wrong room rather than an
error anybody sees.*

*WO-2.28 was booked on 2026-08-14 at row #34, out of WO-2.27's verification, and the rows below it
moved down one. **It is the acceptance line WO-2.27 could not close**, and the reason it became a
work order rather than a correction round is that no correction could close it: the implementer and
the verifier both read the code right, and what they had found was a decision nobody had taken.
**It sits directly under the work order that produced it, and that placement is the argument.** The
context is hot — two agents and the owner have just read this code closely — and the thing under
discussion is a live-classroom behaviour on a surface that ships this term, not a tidy that can wait
for the quiet week.*

***Re-cut the same day, and split.*** *As first written it carried a bug and a design question in one
brief — "how far should the overdue alert follow the teacher?" — and said both halves needed fixing
whichever way the question went. **That was true of one half only, and the correction is the reason
this note is being rewritten rather than left standing.** The bug is real under every answer:
switching class while off the registry silences the alert for both classes until the registry is
repainted, because `paintPassElapsed()`'s per-pass guard kills the threshold check along with the
text write. **The other half was not a gap, it was the question restated** — off the registry the
alert reaches a screen-reader user only, and whether that is wrong depends entirely on the answer.
So WO-2.28 is now the fix alone, which needs no decision and should not wait behind one, and the
question moved to WO-2.29 — where reading the reference implementation answered it.*

***WO-2.29 was booked on 2026-08-14 at row #35, and it exists because the answer was already
written.*** *Roll Call!'s hall-pass alert is a **sound**, with `announce()` beside it under a comment
naming it the accessible mirror for deaf and hard-of-hearing users (`src/dashboard.html:3528`).
Planbook lifted the mirror and left the primary channel behind, then wrote a comment promoting the
mirror to primary — which is the WO-2.11 scar again, and `CLAUDE.md`'s "lift the design with the
function" is the rule it breaks. Once the tone exists, WO-2.28's original question stops being a
question: the alert follows the teacher because it is not on a screen, and it names nobody, so it
walks past the presentation-mode rule that any visible off-registry indicator would collide with.*

***It goes before the term, and it costs a day that WO-1.16 would otherwise have had.*** *That is the
one placement here worth arguing about. The case for early: this is the only WO-2.9 surface that
fails **silently** — a teacher is told nothing and the alert is spent all the same — and its 👤 line
needs an installed PWA, a real iPad and a quiet room to test a suspend-and-resume, none of which the
first week of term provides. The case against is simply that WO-1.16 is the one row with a real
classroom deadline. **If the fortnight tightens, WO-2.29 is the row to move**, not WO-1.16 and not
WO-2.28 — the fix is a sitting and closes a live hole; the sound is a day and closes a design gap
that has been open since WO-2.9 shipped.*

*WO-2.27 was booked on 2026-08-14 at row #33, out of WO-2.9's verification, and the rows below it
moved down one. **Widened the same day, out of WO-2.26's**, from XS to S: two more comment debts and
two harness gaps, and the count came out of its title because it rotted inside a day. **They are
findings that were correctly not acceptance failures**, which is
exactly the kind that evaporates: WO-2.9 and WO-2.26 both passed, so nothing in the tracker was ever
going to carry
them. They are placed here rather than late because one of them is a live timer on a device that
suspends, and the term opens ~Aug 24. **One of the harness gaps is the sharper reason to keep it
early**: WO-2.26's term window has an unproven upper bound, so a date filter that half-rots would
ship green. **Most of the rest are comments**, and this project has now booked
four work orders whose deliverable is a true sentence — WO-1.18, WO-3.19, WO-3.20 and this one. That
is not four accidents either: every dispatch here is briefed by comments before it is briefed by
anything else, so a comment that lies costs a whole run.*

*WO-2.26 was booked on 2026-08-14 at row #32, out of WO-2.9's iPad sitting, and the rows below it
moved down one. **It is placed adjacent to the work order that created it, and that is the argument
for the placement rather than urgency.** Nothing waits on it — a guardian conference is not in the
week the term opens — but it is one sitting against two files whose reasoning is currently in
somebody's head, and both of them, `src/attendance-report.js` and `src/pass-history.js`, open with
headers about a promise the join must not break. The cheap version of this work order is the one
written while the seam is still fresh. **It was found by the owner using the thing**, which is the
fourth time in this phase — WO-2.10, WO-2.11 and WO-2.12 are the others — and that run is worth
reading as a pattern rather than as four accidents: the surfaces this app is judged on are the ones
nobody opens until they need an answer in front of another adult.*

*WO-3.19 and WO-3.20 were inserted on 2026-08-13, out of WO-3.6's close, and the rows between them
moved down one. **Both are debts WO-3.6 created and named rather than paid**, which is the right call
twice over — neither was in its Deliverables — but a follow-up that lives only in a dispatch result
file is a follow-up nothing reads.*

***WO-3.19 was placed early on 2026-08-13, and it is the promise rather than the pixel that put it
there.*** *Nine comment sites in five files say WO-3.6 owns every rule about a past due date on the
score grid, and WO-3.6 closed ✅ DONE without the tint. The three score-grid work orders — WO-3.15,
WO-3.16 and WO-3.13 — sit below it; each opens `src/scores.css` and `src/scores.js` and reads those
comments on the way in. Half a day now
buys three dispatches a true briefing — and `--audit` cannot see this kind of drift, because comments
are not a tracker.*

*(**The three became two on 2026-08-15**, and both had already gone through before WO-3.19 was
picked up: WO-3.15 and WO-3.16 landed on 2026-08-14 and 2026-08-15 reading the untrue comments, and
WO-3.13 was struck. The case for placing WO-3.19 early has therefore expired — it bought nothing,
because the dispatches it was meant to brief overtook it. **The work itself is not expired**: the
nine comment sites still say WO-3.6 owns a tint WO-3.6 never shipped, and they now lie to a reader
rather than to a queue. It stays booked, on its own merits, at its own place in the order — and the
lesson is about placement, which is that booking a briefing ahead of dispatches only pays if it is
actually done first.)*

***WO-3.20 goes late, behind WO-1.16.*** *It depends on the three grid work orders above it for
a real reason: they open the same files, and consolidating a set that is still growing means doing it
twice. And a five-file refactor that changes nothing a teacher sees has no business landing in the week
the term opens. It sits after the fresh-year cutover and still ahead of WO-3.18, which keeps its place
as the last row before the gate.*

***WO-3.21 was inserted at #23 on 2026-08-13, out of WO-3.8's verification, and every row below it
moved down one.*** *It is the **fifth** harness-coverage item booked this way, and it is rowed in the
same sitting it was booked — which is the whole point of the rule four paragraphs down, recorded there
three times over WO-3.10, WO-3.12 and WO-2.24 and now not repeated a fourth. It went in directly below
WO-2.24, keeping the harness-coverage block contiguous, and it belongs to the same cut band: **nothing
in it is a defect**, the `seen` Set it guards is correct today, and what is missing is only the check
that would notice if somebody deleted it. It is an hour rather than the half-day the other four are — the fixture already
exists and the case is one extra accommodation row on a student who is already there — so it is the
**last** of the five to cut, not the first.*

***It went in ahead of WO-3.19, and that placement is a decision rather than an oversight.*** *WO-3.19
has its own written argument for going early, two paragraphs up: nine comment sites name WO-3.6 as
owner of the tint, and three score-grid work orders read them on the way in. That argument is not
weakened by an hour. WO-3.21 is the smaller row and the fixture it needs is fresh out of the sitting
that booked it, while WO-3.19's briefing value is spent against dispatches that sit further down than
either of them. **The owner made the call on 2026-08-13.** If the fortnight tightens, WO-3.21 is the
row to move, not WO-3.19.*

*WO-2.25 was inserted at #18 on 2026-08-13 and every row below it moved down one — **ahead of WO-1.16,
which is the one row here with a real classroom deadline, and that placement is a decision rather than
an oversight.** It was booked out of WO-3.9's own printing: the owner tapped Print twice in one sitting
and the second print came out as the whole app. That bug is fixed on the grade sheet, and the two
older print surfaces still have it, because the mechanism was lifted three times and corrected once.
The argument for going first is that the fix is already written and already proven on one surface, so
this is carrying it rather than finding it — and that the same lift is due a fourth time in Phase 4.
The argument against is WO-1.16's date. **The owner made the call on 2026-08-13.** If the sprint
tightens, this is the row to move, not that one.*

*WO-8.8 was given row #23 on 2026-08-12, the day it was booked out of WO-8.7's deployment, and every
row below it moved down one. **It sits directly behind the work order that produced it, and ahead of
everything else, because what it checks is already live.** `planbook.hwgteach.com` is serving the app
now; every deploy from here until someone writes this script is a deploy nobody can verify except by
hand, and the two faults that motivated it were both found that way, both in production, both by the
owner rather than by a tool. Half a day, and it removes the only class of defect in this project with
no instrument pointed at it.*

*WO-8.9 was booked on 2026-08-12 out of WO-8.8's follow-ups and given row #32, at the back of Ship 2
rather than beside the work order it came from, with only WO-G2 below it. **That is deliberate, and it
is the opposite call from WO-8.8's.** WO-8.8 went to the front because the defect it hunts is live and
unwatched; this one guards a file that is present and correct today, against a deletion nobody has
made. The exposure is the window between someone deleting `_headers` and someone next running
`verify-deploy.mjs` by hand — narrow, and narrowed further by WO-8.8 having shipped. It earns a row
because a known hole with no row is a hole nobody schedules; it earns a late one because scheduling it
ahead of grade math would be paying for tidiness with the term. No row moved except WO-G2, which stays
last where a gate belongs.*

***The open rows were re-dated on 2026-08-13, and WO-1.16 moved from #19 to #36 as a consequence of
that rather than as a decision of its own.*** The trigger was a dispatch problem: `next` hands out the
first ⬜ row in document order, so every `/wo` with no argument was being handed **WO-1.16 — a cutover
the owner performs, where four of five Acceptance lines are 👤 and nothing edits a file here.** The
first instinct was to move the row down, and that was wrong: **row position is the only place this
work order's deadline is written**, so sliding it into the September rows would have made the board
state something false about when it is due. The real fault was that the dates were stale, not that the
row was misplaced. Rows #1–#26 were planned Aug 10–28 and closed Aug 9–13; the board had been running
about a fortnight ahead since WO-8.7, and every note above says so without any of them fixing the
column. **Re-dated against observed throughput — five to seven rows a day, sustained since Aug 9 —
the remaining work lands Aug 13–19, and WO-1.16 falls after it naturally, on Aug 20–23, still before
the first class.** It stops being row #19 because the work that used to sit behind it now sits in
front of it, which is what "ahead of schedule" actually means.

**Two rows did not move up, and neither exception is about pace.** WO-G2 is data-bound — its checklist
wants a real class's weighted grade computed by hand, grades entered across all five classes, and a
backup drill run *after* grades exist — so it cannot happen before the term regardless of how fast the
code lands. WO-3.18 was deliberately delayed to the last row before the gate on 2026-08-12, one day
before this, and its cell is a submit-by rather than a start; re-dating a tail is not a licence to
quietly undo a decision booked the day before. **The ✅ rows keep their original dates on purpose.**
They are a record of what was planned, not a claim about what happened — the same convention that let
row #17 read *Aug 23* while WO-1.15 closed on Aug 12, which is the evidence this re-date is built on.

*WO-1.17 and WO-1.18 were booked on 2026-08-12 out of WO-1.15's verification and given rows #34 and
#35, on WO-8.9's reasoning above rather than WO-8.8's — both guard something that is correct today.
They were briefly written with no row at all, which is the mistake that note exists to name: `next`
reads only the numbered rows in this file (`wo-gate.mjs:544`), so a work order absent from both tables
is one the queue can never reach, and neither `--audit` nor `wo-sweep.mjs` notices. The self-check at
`wo-gate.mjs:1675` guards a row that **drops out** of the running order; it cannot see one that was
never written. **WO-1.17 is latent rather than safe** — score cells cannot exist without an assignment
to hang them on, so a field that is not omitted fires first and the nag appears anyway. It stops being
latent the moment a document can hold scores with no assignment, which is what makes row #34 a
judgment and not an obvious call: if anything before it lets an assignment be deleted while its column
survives, this moves up. WO-3.18 and WO-G2 each moved down two; WO-3.18 stays the last row before the
gate, which is its own deliberate placement.*

*WO-1.15 and WO-1.16 were booked on 2026-08-12 at rows #17 and #18, and everything below them moved
down two. **They are placed by the calendar rather than by the board**, which is why they sit in the
middle of a run of half-day tooling items: from ~Aug 24 the owner is teaching, and WO-1.16 is a
cutover that has to happen **before the first class** or not at all — once real marks land beside the
rehearsal's fabricated ones, separating them means editing a live ledger during a term. That is the
only deadline in Ship 2 that belongs to the world rather than to us.*

*WO-3.18 was moved from #25 to #34 on 2026-08-12 — **the last work order in Ship 2, immediately before
the gate that consumes it** — and the rows between it and there moved up one. **This is a deliberate
delay, decided by the owner, and it is booked as a decision rather than allowed to happen as a slip.**
Three things make it affordable. It blocks nothing that is built here: WO-7.1 depends on WO-3.10, which
is done, so the whole of Phase 7 can be built and run against a Testing-mode client while the paperwork
waits — the only work order behind WO-3.18 is WO-7.3, and what that gates is a **stranger** signing in.
WO-G2's checklist line asks for it **submitted with the date recorded, not approved**, so the gate can
pass with the queue still running. And the board is roughly a fortnight ahead of the dates in this
table: row #25 was suggested for Aug 28 and closed Aug 12.*

*Its date column now reads a **submit-by** rather than a start, because that is the only shape of
deadline this work order has — the work is an afternoon and the wait is somebody else's. **The risk the
move accepts, stated plainly: it is now adjacent to the gate that needs it, with no slack in front of
it.** If it slips again, WO-G2 cannot tick, and that gate's own note is explicit that the honest
options are to submit it or to move the line to a later gate **deliberately** — waving it through is
what these trackers exist to prevent. **The pairing worth remembering when the sitting comes:** its
privacy policy and `docs/FERPA.md` (WO-8.5, currently unscheduled) say overlapping things to different
readers, and WO-3.18 says in its own body — write them together or write them twice.*

*They are a pair, in that order, and the order is the point.* WO-1.15 makes a wrong-direction restore
*visible*; WO-1.16 makes it *impossible*, because restore is keyed by year and an iPad living in
`2030-2031` cannot replace the term at all. The guard lands first so that the rule is enforced before
there is a real ledger worth destroying — but if only one of the two ever gets done, **it must be
WO-1.16**, which is the actual fix. Both come out of the Ship 1 rehearsal's one unclosed note and
`gates.md`'s iPad rules, read together against `src/backup.js` for the first time.*

*WO-1.14 has no row and that is deliberate, which this file's own rule below requires saying rather
than leaving to be noticed. It was booked and shipped inside the same hour, in `8de1ae4`, because the
app was broken in production while the owner watched. A row would schedule work that is already done.
The rule below is about work orders that arrive **open** — the failure it names is a finding that
lands in the directory and never in the order, and a `✅ DONE` work order cannot fail that way.*

*WO-2.7 has no row and that is deliberate too, and it is **one of the two open work orders in the
directory without one** — which is why it is said here rather than left to a count. (**It read "the
only" until 2026-08-17**, and had been wrong since the afternoon WO-2.33 was booked: a hand-written
count, in the one file where nothing counts, inside the section whose whole subject is a work order
nobody notices. WO-2.33's paragraph follows this one.) It was deferred out of Ship 2 on 2026-08-09 by
the owner, and the reasoning is in its own header: no live data is coming across from Roll Call!, the
2026-27 rosters are pasted fresh, and the ledger starts empty, so there is nothing historical that
anyone wants imported. **The deferral is about *when*, not about whether** — it keeps
its work order, its roadmap box and its dependency, and it comes back the first time someone wants a
prior year read in. It also came off WO-G2's `Depends on` line the same day, for the reason recorded
there: a gate that waits on work nobody intends to do is a gate that gets waived. The rule below is
satisfied by that paragraph; this line exists because the paragraph lives in
`phase-2-attendance.md` and the question "why is this not in the running order" gets asked here.*

*[WO-2.33](phase-2-attendance.md#wo-233--the-overdue-tone-is-silent-on-the-ipad-and-nobody-knows-why)
is the second, booked 2026-08-16, and it is **unscheduled rather than deferred** — which is a different
thing and is the reason it gets its own paragraph instead of a line in WO-2.7's. Its header carries
`**Ship** —` and says why in its own words: Ship 2 is grades, the teacher goes live in late August, and
the overdue alert has a **working visual channel** since WO-2.32 withdrew the tone. So the sound is
real work that is not urgent work, and it gets picked up when somebody wants it back. **Nobody has
decided it is not happening**, which is what keeps it `⬜ NOT STARTED` and out of ⏳ DEFERRED: a
deferral is the owner's *when*, written by hand and reversed by hand, and no such call has been made
here. If the tone matters again, this takes a row — not a status change.*

***It is also the target of a live `**Owes**` pointer, and that is the sharper reason to say this out
loud.*** *WO-2.31 is ✅ DONE carrying `**Owes** WO-2.33`, because its sixth Acceptance line was **run
on the iPad and failed** — an interruption that left Planbook on screen silenced both alerts while the
card tinted correctly — so the line stays `- [ ]` under a marker pointing here. That is a debt this
directory is tracking, on a work order the running order cannot offer: `--audit` resolves the pointer
every run and will keep saying `ok`, because the pointer is honest. **What nothing checks is whether
the target is reachable.** Being un-rowed is the right answer today; being un-rowed and unremarked is
the WO-1.17 and WO-1.18 failure, and the difference between the two is this paragraph.*

***And a dispatch could not close it anyway.*** *Two of its four Acceptance lines are 👤 and both need
the installed PWA on the teaching iPad **while the fault is happening** — a reading taken mid-failure,
and an erratic spell from the 2026-08-16 sitting either reproduced or recorded as not reproducing. That
is WO-1.16's shape rather than WO-2.38's: hardware, a quiet room, and the owner's own hands. A row in
the running order would schedule a sitting, not a dispatch, which is worth knowing before anybody gives
it one.*

*WO-2.24 was given row #20 on 2026-08-10, the day it was booked out of WO-2.23's verification — **the
third time this file has had to record the same failure**, after WO-3.12 and WO-3.10 below. A work
order with no numbered row is invisible to `next`; it is never offered at all. The pattern is now
specific enough to name: **all three were booked by a verifier, out of a work order that had already
passed.** That is the right call every time — the finding does not belong in the passing work order's
diff — but the booking ends with a `**Ship** —` header and nobody's hand on a row, so it lands in the
directory and not in the order. **A work order booked out of a verification needs a row in the same
sitting, or it needs saying out loud that it is deliberately unscheduled.***

*It went in beside WO-2.21, WO-3.12 and WO-2.22, the other three harness-coverage items, this being a
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

*It became three rows: **WO-3.10** (the client and the consent screen — an hour, needs nothing),
**WO-8.7** (the name and the host — split out of WO-8.6) and **WO-3.18** (policy, video,
submission — and then a queue that is not ours). **The three are ordered by what unblocks
what**, not by size: WO-8.7 is the critical path for sync ever reaching another teacher, and it sat
five phases away from where it was needed.*

***WO-3.10 also came off WO-G2's `Depends on` line*** *— see the note under that gate. Ship 2 is first
grades and contains no sync; leaving it there meant a grade-arithmetic gate could slip on Google's
review queue.*

***And the thing the old shape hid: verification gates public launch, not development.*** *An OAuth
client in Testing mode runs `drive.file` today, so the whole of Phase 7 can be built and used on the
owner's own devices long before any paperwork clears. That is why WO-3.10 is an hour rather than a
phase, and why it is worth doing whether or not the distribution question is ever answered yes.*

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

***WO-3.17 and WO-3.14 come before the term opens.*** *WO-3.17's first half is a real
defect on real hardware — the Assigned and Due fields overlap and push off screen on the iPad — on the
dialog that creates every assignment the gradebook holds, and the term opens ~Aug 24. WO-3.14 is the
precision mismatch against the school's SIS, which lands on the teacher every time she re-keys a row,
which is week one. Both sit right after the two tooling rows and before WO-2.6.*

***WO-3.15 and WO-3.16 stay late.*** *A button that saves three navigations and a pair
of arrow keys are conveniences on a screen that already works, and WO-3.16 in particular carries a real
trap — left and right are also how a caret moves inside a number — which is worth taking slowly rather
than early.*

***No row was re-flowed for the two that moved up, and that is deliberate.*** *They are two sittings
inside a window that runs to ~Sep 15, the same call the WO-2.17 note below records. WO-3.13 moved down
to keep the three convenience-shaped rows together ahead of the gate. **If the fortnight turns out
not to hold two extra sittings, #12 and #14 are not the rows to move** — they are the two that bite in
week one. The rows to move are the three convenience rows — WO-3.15, WO-3.16 and WO-3.13.*

*(**That relief valve is spent as of 2026-08-15**, and it went without being pulled: WO-3.15 and
WO-3.16 both landed, and WO-3.13 was struck. None of the three is available to move any more, so if
the fortnight comes up short the next candidates have to be found somewhere with a cost attached.)*

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

***The answer was paper, and the row came out on 2026-08-15.** WO-3.13 is struck: `**Ship** —`, out of
the running order, and off WO-3.20's dependency line, which is the half that would have done damage —
the gate accepts only `✅ DONE` and a struck work order can never reach it. Every row below #38 moved
up one. The work order itself is kept for the positional-paste risk analysis in its Deliverables,
which any future attempt at this has to answer. **This is the first row here retired by asking its
question instead of building it**, and it cost the queue nothing: eight days between the split and the
answer, and no code was written in between.*

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
  every engineering blocker closed, held by exactly this class of task.)* **Moved to #34 on
  2026-08-12**, last before the gate — the reasoning is in the row note above, and the short version is
  that nothing built here waits on it and G2 needs it *submitted* rather than approved. **It is the one
  row in this table that cannot be cut**, only rescheduled: cutting it does not descope a feature, it
  descopes the gate.

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

## Ship 3 — signals

The rows below, between 2026-08-20 and **~2026-10-16**, ending at
[WO-G3](gates.md#wo-g3--ship-3-gate-signals). Written 2026-08-19 by
[WO-1.24](phase-1-shell-store-roster.md#wo-124--the-ships-past-2-have-no-running-order),
the day Ship 2's build queue emptied — every row in § Ship 2 is `✅ DONE` except WO-3.18 and
the gate itself, and **WO-G2 is calendar-bound by construction**: four of its nine boxes want a real
class's real grades. *(**WO-3.18 left § Ship 2 entirely on 2026-08-20** — see the note under that
table. The sentence is left standing because it is an argument about the day this table was written,
and because the conclusion it reaches only got stronger: § Ship 2 now holds nothing but its gate.)* So this table is written now for the same reason § Ship 2's was written the day
after Ship 1 closed, and one work order earlier: `next` is about to run out of rows again.

**The unit of urgency is different from Ship 2's, and it is not a deadline.** Ship 1 raced a fixed
date with students behind it; Ship 2 raced a date the owner set. **Ship 3 races the data.**
[WO-G3](gates.md#wo-g3--ship-3-gate-signals) opens only once 4–6 weeks of real grades and attendance
exist, and the term begins **Sep 2** — so the gate cannot run before ~Sep 30 no matter how fast the
building goes, and mid-October is the honest target. That inverts Ship 2's front-loading argument
into something simpler: **build in the setup fortnight because capacity is there, and let the boxes
that need a term of data close on their own schedule.**

| # | Work order | Size | G3 | Suggested |
|---|---|---|---|---|
| 1 | [WO-4.1](phase-4-signals.md#wo-41--signal-engine--thresholds) **Signal engine & thresholds** | M | ✔ | **Aug 20–21, before the term.** Unblocks five work orders — nothing else in Phase 4 or 5 can start |
| 2 | [WO-4.2](phase-4-signals.md#wo-42--concern-signals) Concern signals | M | ✔ | Aug 24–26 — **ahead of WO-4.4 by both of their Acceptance lines** |
| 3 | [WO-4.4](phase-4-signals.md#wo-44--behavior--note-logging) Behavior & note logging | S | ✔ | Aug 27, half a day. Carries [WO-3.8](phase-3-gradebook.md#wo-38--accommodation-prompts-at-point-of-use)'s owed line |
| 4 | [WO-4.3](phase-4-signals.md#wo-43--praise-signals) Praise signals | M | ✔ | Built Aug 31–Sep 1; **its real-data box cannot close before ~Sep 16** |
| 5 | [WO-4.5](phase-4-signals.md#wo-45--cooldown--the-quiet-middle) Cooldown & the quiet middle | M | ✔ | Built Sep 12–13, a weekend; **its real-data box cannot close before ~Sep 23** |
| 6 | [WO-G3](gates.md#wo-g3--ship-3-gate-signals) **Ship 3 gate: signals** | S | — | **~Oct 16**, once four weeks of real data exist |

***The order is not the phase order, because two Acceptance lines carry dependencies their headers do
not.*** *WO-4.4's* `Depends on` *reads WO-1.7 and nothing else, so by header alone it is free to lead
— and its third box is* **"Behavior entries feed WO-4.2's behavior rule and the count matches,"**
*which WO-4.2 has to exist for. WO-4.2's sixth box is the other half:* **"The behavior rule is inert
until WO-4.4 exists, and says so rather than erroring."** *They were cut to land in that order on
purpose, and the table follows the boxes rather than the headers.* **A `Depends on` line is not the
whole dependency graph in this directory** *— that is the fourth time a real ordering constraint has
been found somewhere other than that field, and* `wo-gate.mjs` *reads only the field.*

***Rows 4 and 5 are rowed twice on purpose — built before the term, closed after it.*** *WO-4.3's
third box wants* **"Running the praise list two weeks apart on real data,"** *and WO-4.5's fourth
wants* **"Two consecutive weekly runs on real data."** *A fortnight of term, not a fortnight of
calendar, and the term starts Sep 2. **Rowing them by build date alone would have promised two ticks
in August that no amount of work could earn**, which is the failure the "do not tick what is written
but unverified" rule exists to catch — here, caught in the table instead of at the tick.*

**The capacity assumption is Sep 2 and it moved twice to get there.** § Ship 2's preamble says *"from
~Aug 24 the owner is teaching"*; WO-2.50 moved that to Aug 28 on 2026-08-18 and WO-2.52 moved it to
**Sep 2** on 2026-08-19. That sentence is left standing because it is an argument about how § Ship 2's
table was built and rewriting the premise under a finished table makes the table unreadable — **but
this one is built on Sep 2**, which is what buys rows 1–4 a setup fortnight at full capacity. Rows 5
and 6 are the ones worked in and out of a teaching week, which is why row 5 sits on a weekend and row
6 is a gate rather than a build.

**What Ship 3 does not carry.** Phases 5–8 and WO-G4 keep `**Ship** —`:
[WO-G2](gates.md#wo-g2--ship-2-gate-first-grades)'s ninth box owns that call and says to take it *at*
the gate, when what follows Ship 3 has stopped being hypothetical. **Nothing has been discharged early
after all** — WO-8.4 was moved out of `—` on 2026-08-19 and moved back the same day, so the box the gate
runs is the whole one. [WO-2.33](phase-2-attendance.md#wo-233--the-overdue-tone-is-silent-on-the-ipad-and-nobody-knows-why)
also stays at `—`, the owner's call on 2026-08-19, on the argument its own header makes: the overdue
alert has a working visual channel on hardware, so the tone is real work and not urgent work.

**Never cut WO-4.1.** It is the only thing in this table with no alternative route around it —
WO-4.2, WO-4.3, WO-4.5 and [WO-5.1](phase-5-outreach.md#wo-51--merge-field-resolver) all gate on it,
and so, through those, does every work order in Phases 5 and 6. Cutting anything else here descopes a
list; cutting this one descopes Phase 4, Phase 5, and the glance page.

---

## After Ship 3 — the sign-in and the paperwork

**Two rows, and they are not a ship.** Both carry `**Ship** —`: no gate work order depends on either,
which is what ship membership means in § Header fields. They are here because **a work order with no
row is a work order `next` cannot reach**, and that is the failure
[WO-1.24](phase-1-shell-store-roster.md#wo-124--the-ships-past-2-have-no-running-order) was written
about. Written 2026-08-20, when WO-3.18 came out of § Ship 2 and would otherwise have had nowhere to
land.

| # | Work order | Size | G3 | Suggested |
|---|---|---|---|---|
| 7 | [WO-8.12](phase-8-packaging.md#wo-812--the-privacy-policy-and-the-ferpa-document) **The privacy policy and the FERPA document** | M | — | **Nothing blocks it.** Booked 2026-08-20; dispatch it whenever |
| 8 | [WO-7.1](phase-7-sync.md#wo-71--auth) **Auth — the GIS token flow** | M | — | **Whenever a day opens.** Laptop only, and it unblocks the row below |
| 9 | [WO-3.18](phase-3-gradebook.md#wo-318--verification-submitted-) Verification submitted 🔒 | S | — | The sitting, once there is a sign-in to film and a policy to link. Then somebody else's queue |

***Row 7 was booked the same day this section was, and it is the row to start with.***
[WO-8.12](phase-8-packaging.md#wo-812--the-privacy-policy-and-the-ferpa-document) *is the privacy
policy and* `docs/FERPA.md` *together, split out of* [WO-8.5](phase-8-packaging.md#wo-85--readme-ferpa-and-known-limitations)
*— which keeps the README and dropped M → S. It leads the section because it is the only row here that*
**nothing blocks**: *its one dependency is WO-8.7, done since 2026-08-12, while row 8 is an M of code
and row 9 waits on row 8. WO-3.18's first Acceptance line is re-homed to it, so the policy is asserted
once, in the work order that publishes it. Two things a dispatch should know before opening a file:*
**`sw.js:156` answers every navigation with the app shell**, *so the policy URL renders the gradebook
on any device with the worker installed — invisible to Google's cold fetch and fatal on the owner's
iPad — and* **the contact line on a public policy is the owner's call**, *because* [WO-8.7](phase-8-packaging.md#wo-87--the-name-and-the-host-decided)
*rules that an address in a public file is a spam target. Both are written up as traps in the work
order.*

***The numbering continues § Ship 3's rather than restarting, and that is deliberate.*** `shipOneOrder()`
*reads document order and ignores the number entirely — `tools/wo-gate.mjs` says so at its own
definition — so the digits are for a human. Restarting at 1 under a heading that is not a ship would
read as a fourth ship, which is the thing the paragraph above is at pains to deny.*

***Why these two sit after Ship 3 rather than inside it.*** *WO-7.1 is buildable today — the
Testing-mode client issues real `drive.file` tokens and its* `🔒` *came off 2026-08-20 — so nothing
technical holds it. What holds it is that* **Ship 3 races the data and this races nobody.** [§ Ship
3](#ship-3--signals)*'s rows 2–5 are the ones that must be built in the setup fortnight to have four
weeks of real signals by mid-October; slipping one of those to make room for an M of sync work spends
the only capacity that is genuinely scarce. WO-3.18's own deadline is* [WO-7.3](phase-7-sync.md#wo-73--verification-complete)*,
which is a* `—` *in a phase with no date, and its cost of delay is paid in Phase 7 — public sync
moves right by however long Google's queue takes. **That is the trade this placement accepts, stated
plainly:** the earlier WO-7.1 is built, the earlier the paperwork starts, and every week of drift here
is a week later that a teacher who is not the owner can sign in.*

***The half that is not blocked, and should not wait for the other half.*** *WO-3.18's first
deliverable is a* **published privacy policy at the verified domain**, *which needs no sign-in and no
video. It pairs with* `docs/FERPA.md` *(*[WO-8.5](phase-8-packaging.md#wo-85--readme-ferpa-and-known-limitations)*,
unscheduled) — WO-3.18 says in its own body* **write them together or write them twice** *— and
`CLAUDE.md` records that the backup's accommodation and medical disclosure currently lives in the UI
alone, which is the weaker half of the obligation in* `docs/data-model.md` *§ Accommodations. Drafting
both is the one part of this section that can be done before WO-7.1 exists.*

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
