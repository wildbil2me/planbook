# WO-1.30 — a Depends on that names no work order clears its own gate · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.30-result.md` — as your last act, and return it in-band too.

**Routed to Claude at Opus.** The deciding signal is the Traps section: it is judgment rather
than mechanics, and it says in bold that the obvious fix — *zero ids plus prose is a refusal* —
refuses ~41 work orders that are correct today, while separately forbidding reuse of WO-1.29's
near-identical `rehomesOf()` predicate at a measured cost of 13 of 37 `--self-check` plants.
Secondary: this is the pipeline's own gate tool, so a wrong change misreports every gate report in
the directory. The runner-up I set aside is genuine — the spec is complete inside the work order and
the Acceptance is mechanically checkable by `--audit`/`--self-check`, which is the Codex shape — but
ties go to Claude, and the tier is Opus on merit, not a fallback.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.30 — a Depends on that names no work order clears its own gate

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-07 · **Size** M · **Depends on** WO-1.27 — landed, and it rewrote
the function this one reads its input from; see Traps · **Blocks** nothing; every gate report in the
directory runs through the function this fixes
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — `wo-gate.mjs` is not a promise the roadmap
makes, the way WO-1.26 through WO-1.29 are not. Booked 2026-08-28, owner-directed, found while
reading WO-8.1's gate report during an unrelated sitting.)*

**Why it exists.** `depsOf()` at `tools/wo-gate.mjs` extracts dependencies with one match and reports
whatever is left over as prose:

```js
const ids = [...(wo.dependsRaw.match(/WO-[\dG][\w.]*/g) || [])];
const prose = wo.dependsRaw.replace(/WO-[\dG][\w.]*/g, '').replace(/[…,\s·]/g, '');
return { ids: [...new Set(ids)], hasProse: prose.length > 0 && !/^nothing$/i.test(wo.dependsRaw.trim()) };
```

When `ids` comes back empty the gate has nothing to check, and **an empty dependency list is
indistinguishable from a satisfied one.** The work order clears. `hasProse` is true, so a
`NOTE` prints beside the `PASS` — and **a note beside a PASS reads as a footnote, not a refusal.**

**The live instance is the last gate of the whole project.**
[WO-G4](gates.md#wo-g4--the-100-call) — the 1.0.0 call — reads `**Depends on** every work order`.
That is the truest dependency line in this directory and it resolves to **zero**. Its sibling,
WO-8.1's `every phase`, was found and repaired by hand on 2026-08-28; **this one is deliberately
left standing as the reproduction**, and closing it is an Acceptance line below. WO-1.27 had to
build a fixture because its defect was repaired the day it was found — this one does not.

***The rot is the same one § Ship 2 named on 2026-08-09, and this is its third face.*** *There, an
absent* `**Ship**` *read as* **"in no ship"** *when it meant* **"nobody has said."** *In WO-8.1 an
unparseable* `**Depends on**` *read as* **"nothing blocks this"** *when it meant* **"everything
does."** *Absence and unparseability keep resolving to the permissive answer, in a directory whose
entire job is refusing work that is not ready.*

**What makes this an M rather than an S, and it is the whole of the risk.** The obvious fix —
*zero ids plus prose is a refusal* — **refuses forty-odd work orders that are correct today**,
including the three written to repair this family. **Take the figure from the tree on the day.** The
second column below was measured 2026-09-07 across all 169; the first is the 2026-08-28 measurement
across 143 this row was booked on, kept beside it because the whole point of the table is that it
moves.

| Shape | 2026-08-28 · 143 | 2026-09-07 · 169 | What it means | Today |
|---|---|---|---|---|
| Real `WO-` ids | 111 | 127 | a dependency | resolved, correct |
| `—` | 14 | 21 | **no dependencies** | `NOTE`, wrongly |
| `nothing` | ~11 | 15 | **no dependencies** | silent, correct |
| `nothing — <reason>` | 5 | 5 | **no dependencies, and why** | `NOTE`, wrongly |
| a clause naming a real constraint | 1 | 1 | **everything** | `NOTE` + `PASS` — the defect |

Only the last row is the bug, and it is the same single work order in both columns — **WO-G4**. So
is the `nothing — <reason>` set: WO-2.19, WO-2.20, WO-2.37, WO-3.10 and WO-8.7, unmoved in ten days.
Everything that grew grew on the two shapes that mean *no dependencies*, and that is the reading to
take from the movement: **the spurious half of this check gets worse every week and the real half
does not.**

**The em dash is this directory's own "no dependencies" marker.** Twenty-one work orders used it on
2026-09-07 — WO-1.15, WO-1.17, WO-1.18, WO-1.19, WO-1.21, WO-1.24, WO-1.25, WO-1.26, WO-1.27,
WO-1.28, WO-1.29, WO-1.31, WO-1.32, WO-1.33, WO-1.35, WO-1.38, WO-1.39, WO-1.44, WO-3.22, WO-8.9 and
WO-8.10 — and § "Header fields" uses `—` the same way for **Ship**. It has been raising a spurious
`NOTE` on every one of those runs since the check was written, which is the other half of why the
real one was never read: **the note is noise twenty-one times for every once it means something**,
and that ratio has worsened by half again since the row was booked.

**Traps**

- **WO-1.27 has landed, and the re-measure it asked for is the table's second column.** `depsOf()`
  reads `wo.dependsRaw`, which was set from `fieldRe('Depends on', present)` — **the function
  WO-1.27 deleted.** There is no `fieldRe()` left to cite: the value now comes from
  `field('Depends on')` at `tools/wo-gate.mjs:420`, fed by `positionalFields()` at `:256`, and the
  2026-09-07 column was measured against that parser. What did **not** change is the code this row
  fixes — the `depsOf()` quoted above is byte-identical to `tools/wo-gate.mjs:650`. **Re-measure
  again before writing the sentinel arm**: the table is evidence with a date on it, not a constant,
  and it has already moved once.
- **WO-1.29 has landed one field over, and its answer is not this one's.** `rehomesOf()` refuses an
  `Owes` value that parses to zero work-order ids — flatly, with no sentinel arm — because `Owes` is
  *acted on* and a zero-id value there is illegitimate in every case. `Depends on` is *reported*,
  and a zero-id value is legitimate **forty-one times out of forty-two**. **Do not reuse that
  predicate**, and do not read WO-1.29's refusal as the shape to copy: its own Traps forbid the
  sharing from the other side, and the cost is measured rather than argued — one "value parses to
  zero ids" predicate over both fields reddens **13 of the 37** `--self-check` plants, recorded in
  `tools/README.md` § the mutation table. The sentinel arm below is what buys those thirteen back.
- **Widen the sentinels before turning on the refusal, never after.** `/^nothing$/i` is tested
  against the **whole trimmed value**, so `nothing — no domain, no name, no policy` (WO-3.10) does
  not match it and neither do WO-2.19, WO-2.20, WO-2.37 or WO-8.7. A prefix test, plus `—`, `–`,
  `-` and `none`. Get this arm green on every one of them — forty-one on 2026-09-07, counted from
  the tree that day — before the refusal arm is written, or the run that proves the fix is a run
  that refuses the directory.
- **Do not teach it to expand a range.** WO-2.16 settled that `WO-2.5 … WO-2.7` is two dependencies
  and a WARNING, never three. Nothing here may start inventing ids nobody typed.
- **Do not invent a field.** § "Header fields" records three fields — **Amends roadmap**,
  **Blocks**, **Target** — each invented by a hand and absorbed in silence. The answer lives inside
  the existing field.
- **Do not write a bold `Depends on` in this work order's own prose.** The reason has changed and
  the instruction has not. It rested on `fieldRe()` matching a field name anywhere in the collapsed
  header block; `fieldRe()` is gone, so a bold `Depends on` in body prose now draws WO-1.27's
  not-positional `NOTE` naming its line rather than a phantom field. That is a report to answer for
  rather than a wrong parse, which is smaller — and it is still noise on a row whose entire subject
  is a `NOTE` nobody reads. The heading and the table above say it unbolded.
- **`--self-check` is at 37 plants and each arm wants one.** It read 24 when this row was booked,
  35 before WO-1.29 and 37 after — take the count from `--self-check` on the day rather than from
  this line. A plant that only proves the refusal fires is half a check: the sentinel arm is the one
  that would have caught the naive fix.

**Acceptance**
- [ ] A `Depends on` holding no `WO-` id and a clause that is not a no-dependency sentinel is a
      **problem**, not a note — the gate report refuses it.
- [ ] `—`, `-`, `–`, `none`, `nothing`, and `nothing — <any reason>` raise neither a problem nor the
      prose `NOTE`. All forty-one work orders using them — the count re-measured on the day, not
      taken from this line — report exactly as they do today, minus the note.
- [ ] `WO-G4`'s field names a work order, and its gate report refuses it for a reason a reader can
      check rather than clearing it.
- [ ] A `Depends on` carrying **both** ids and prose still raises the `NOTE` and still gates on the
      ids — that is the correct case and there are dozens of it.
- [ ] `--audit` and `--self-check` both pass, and `--self-check` gains a plant per arm.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/wo-gate.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `plans/work-orders/README.md` § "Header fields" — the field vocabulary, and the source of the
  ruling that `—` is this directory's own *no dependencies* marker (it uses it for **Ship** too).
- `plans/work-orders/gates.md` § WO-G4 — the live reproduction, left standing on purpose.
  Acceptance line 3 puts its `Depends on` in scope: it must name a work order and then be refused
  for a checkable reason. Nothing else about WO-G4 is yours to change.
- `tools/wo-gate.mjs` — three places, all cited by the Traps and all worth reading before you
  write: `depsOf()` at `:650` (the code you are fixing, byte-identical to the quote),
  `field('Depends on')` at `:420` fed by `positionalFields()` at `:256` (WO-1.27's parser, which
  supplies your input), and `rehomesOf()` (WO-1.29's flat refusal — the shape you must **not**
  reuse; its own Traps forbid the sharing from the other side).
- `tools/README.md` § the mutation table — where the 13-of-37 figure lives, and where a new plant
  per arm gets recorded. `--self-check` reads **37 of 37** today; take the count from the command,
  not from the work order's prose.

**Two orders of operations the work order is emphatic about.** Re-measure the table's shape counts
from the tree on the day before you write the sentinel arm — the table is dated evidence and has
already moved once (143 → 169). And get the sentinel arm green on every no-dependency row **before**
the refusal arm exists, or the run that proves the fix is the run that refuses the directory.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 5 lines, reported against one by one

1. A `Depends on` holding no `WO-` id and a clause that is not a no-dependency sentinel is a **problem**, not a note — the gate report refuses it.
2. `—`, `-`, `–`, `none`, `nothing`, and `nothing — <any reason>` raise neither a problem nor the prose `NOTE`. All forty-one work orders using them — the count re-measured on the day, not taken from this line — report exactly as they do today, minus the note.
3. `WO-G4`'s field names a work order, and its gate report refuses it for a reason a reader can check rather than clearing it.
4. A `Depends on` carrying **both** ids and prose still raises the `NOTE` and still gates on the ids — that is the correct case and there are dozens of it.
5. `--audit` and `--self-check` both pass, and `--self-check` gains a plant per arm.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

