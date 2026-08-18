# WO-2.49 — the tick's Acceptance check cannot read a work order with CRLF line endings · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.49-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude, at the Opus tier**, on its own merits rather than by
fallback: the deciding signal is a Traps section that is judgment rather than mechanics — *`\s` does
match `\r` while `.` does not*, so *do not assume a regex is affected because it is nearby, and do not
assume it is safe because the file parsed*, which makes the deliverable an audit of every
end-of-line-anchored parse in a 2,479-line script rather than the one-line split the row names — plus
a deliverable that is **calibrated prose**: the `--self-check` closing note must be rewritten to say
the Acceptance parser is now covered *for this one fault and not generally*, and a sentence that
over-claims there is worse than the sentence it replaced. Same call its three direct precedents in
this file took: WO-2.44, WO-2.47, WO-2.48.

The runner-up I set aside was **Codex**: the spec is unusually complete — it names the file, the line
(`tools/wo-gate.mjs:189`), the replacement (`/\r?\n/`) and the measured evidence — the Acceptance is
mechanically checkable, and the budget is a non-issue, since nothing here needs `verify-shell.mjs` and
`--self-check`, `--audit` and `wo-sweep.mjs` all run in seconds rather than the ~4.4 minutes a run
that puts work orders over the 20-minute cap. It loses on the judgment bullet firing cleanly and on
ties going to Claude. No Codex probe was run, because this is not the Codex route. `ROUTING.md`'s Ship
1 pre-routing table has no row for WO-2.49, so there is no pre-routing to agree or disagree with.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.49 — the tick's Acceptance check cannot read a work order with CRLF line endings

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-18 · **Size** S · **Depends on** nothing · **Blocks** nothing
**Closes roadmap** *(no box. Dispatch tooling, not app — the same call WO-2.20, WO-2.37, WO-2.40, WO-2.44, WO-2.47 and WO-2.48 made.)*

**Booked 2026-08-18, out of WO-3.25's tick, which was one keystroke from landing on nobody's
authority.** Not a go-live blocker and it touches no student data. It is on this list because it is
the failure mode this project has spent six work orders building checks against — a green report from
a check that examined nothing — and this time the check was the one that decides whether a work order
is done.

**Why it exists.** `acceptanceOf()` collects a work order's boxes with
`/^\s*-\s*\[([ x])\]\s*(.+)$/` (`tools/wo-gate.mjs:377`). In JavaScript **`.` does not match `\r`** —
a carriage return is a line terminator, alongside `\n`, `U+2028` and `U+2029` — and the script splits
on `'\n'` (`:189`), so on a CRLF file every line arrives ending in a bare `\r` that `(.+)$` cannot
reach. **Every checkbox in the file becomes invisible.** Measured with bare Node on 2026-08-18, not
read off the spec:

| line as split | `/^\s*-\s*\[([ x])\]\s*(.+)$/` |
|---|---|
| `- [x] hello` | matches |
| `- [x] hello\r` | **no match** |

**What it produced, in full.** WO-3.25's dispatch rewrote `plans/work-orders/phase-3-gradebook.md`
from LF to CRLF — 4,086 lines changed for a ~130-line edit. `--tick WO-3.25 --dry-run` then printed:

```
NOTE | all 0 Acceptance lines are ticked — nothing holds WO-3.25 open
NOTE | this work order has no **Closes roadmap** line — no roadmap box to tick
```

Both sentences are false and both read as reassurance. The work order had **ten** Acceptance lines,
one of them the open 👤 iPad line, and it has a **Closes roadmap** line. Converting the file back to
LF and re-running the same command, on the same content, printed `all 10 Acceptance lines are ticked`
and `this work order's **Closes roadmap** line quotes no box`. **The tick would have written ✅ DONE
over a fully open list**, and the only reason it did not is that the diffstat was read first.

**The damage is wider than `--tick`, and the second NOTE is the proof.** The `**Closes roadmap**`
stray-collector (`:395`) also went blind, so this is not one regex — it is every parse in the file
anchored with `$` or matching to end-of-line, against a whole phase file at once. **Do not fix the
one regex this row names and stop.** What is *not* affected is the parse that finds the work order at
all: `/^##\s+(WO-...)/` and `/^\*\*Acceptance\*\*/` carry no `$`, matched fine, and are exactly why
the failure is silent instead of loud — the script found the work order, found its Acceptance
heading, and reported an empty list as a satisfied one.

**`--self-check` does not catch this, and it is the one gap it already names.** Its closing note lists
*"NOT covered: the Acceptance parser against the real work orders"* — this bug lives inside that
sentence. The seventeen plants are written into a temp copy by the script itself, in LF, so they can
never carry the defect. **A plant that writes LF cannot fail this**, which is the trap below.

**Deliverables**

- **Read the file's lines regardless of terminator.** Split on `/\r?\n/` at `:189` — one place, and it
  fixes every downstream regex at once rather than hardening them one at a time. Prefer this over
  editing `(.+)$`: patching the checkbox regex alone leaves the `**Closes roadmap**` collector and
  anything added later carrying the same latent fault, and the next reader has no way to know which
  regexes were audited.
- **An empty Acceptance list must not print as a satisfied one.** `all 0 Acceptance lines are ticked —
  nothing holds this open` is true only in the way that makes it dangerous. A work order whose
  Acceptance heading is found but whose list parses **empty** is the tracker being wrong about itself
  — the same class as the two conditions `--tick` already refuses on — so **refuse and write nothing**,
  naming the file. `wo.acceptance === null` (no heading at all) is a different case with an existing
  message and stays as it is.
- **A plant, written in CRLF.** It goes in beside the seventeen and it must write `\r\n` explicitly
  rather than inheriting the platform's, or it proves nothing on a machine that already writes LF.
  What it asserts is the refusal above, not the parse — an assertion about a count is satisfied by any
  number, and this row exists because a count reassured somebody.
- **Whatever recorded count this moves**, taken from a run rather than by arithmetic, per
  `wo-sweep.mjs:673`. `--self-check` reports `17 of 17 plants were caught` on the tree that booked this
  row, and `tools/README.md` states that figure.
- **The `--self-check` closing note updated at the sentence that stops being true.** It names the
  Acceptance parser as uncovered; after this row it is covered *for this one fault* and not generally.
  Write that distinction there — the note's honesty is why this row could be aimed, and a reader who
  takes a narrowed gap for a closed one is worse off than before.

**Out of scope: making anything convert line endings.** No `.gitattributes`, no normalisation pass, no
write-side rewrite. **The CRLF file was a symptom and this row is about the instrument, not the
patient** — a gate that reads a file correctly is worth having whatever wrote it, and a gate that
silently repairs its inputs is a gate that stops reporting on them. Whether dispatches should be
prevented from flipping line endings is a real question and **a separate row**; it needs a decision
about `.gitattributes` across a no-dependencies repo, and it does not belong to the parser.

Also out of scope: **`wo-sweep.mjs` and `verify-shell.mjs`**, which have their own parsers and were not
measured for this. If either shares the fault it is a finding for its own row rather than a silent
widening of this one — WO-2.47's and WO-2.48's rule, unchanged.

**Acceptance**
- [ ] A phase file converted to CRLF and otherwise byte-identical parses to the **same** Acceptance
      lists as its LF original — proved by naming the counts for a work order that has boxes, not by a
      green run. `WO-3.25` and its ten lines is the case that produced this row and is the one to use.
- [ ] `--tick` on a CRLF file with an **open** box writes 🔨 IN PROGRESS and names the open line,
      exactly as it does on LF. This is the check the defect actually defeated; a row that only proves
      the count is right has not proved the decision is.
- [ ] The `**Closes roadmap**` stray-collector reads a CRLF file too — shown, because it is the second
      parse that went blind and the evidence the fault was never one regex.
- [ ] An Acceptance heading whose list parses empty makes `--tick` **refuse and write nothing**, naming
      the file. Driven, and `git status --short` proved byte-identical either side.
- [ ] The new plant is CRLF **in its own bytes** — asserted by reading them, not by writing the file
      and trusting the platform — and removing the `:189` fix turns `--self-check` red and names it.
- [ ] On the unmutated tree: `--self-check` green with its count matching `tools/README.md` wherever
      that file states one, `--audit` still PASS, and `node tools/wo-sweep.mjs` unchanged.
- [ ] `git diff --stat -- src/` is empty.

**Traps** — **a plant that writes LF cannot fail this**, and the platform will hand you LF or CRLF
depending on how the file is opened; write the bytes and assert them. **Do not "fix" the trackers by
converting them** — the repository is LF today and the fault is in the reader, so a row that
normalises the files makes its own check unfailable and unprovable in the same move. **`.` not
matching `\r` is not the whole family**: `\s` *does* match `\r`, which is why `/^---\s*$/` and
`/^\*\*[A-Z]/` kept working and why the block boundaries were never wrong — do not assume a regex is
affected because it is nearby, and do not assume it is safe because the file parsed. **And this fault
is invisible to a reader**: the CRLF file renders identically in every editor and every diff view that
hides whitespace, so the only signal at the desk was the diffstat — 4,086 lines for a 130-line edit.
That is `plans/dispatch-retro.md`'s check, doing the job this parser could not.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/dispatch-retro.md`
  - `plans/work-orders/phase-3-gradebook.md`
  - `tools/README.md`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these, and read them before you write:

- **`tools/wo-gate.mjs` around the two lines the row names.** `:189` is the `text.split('\n')` inside
  `parseFile()`; `:377` is the checkbox regex inside `acceptanceOf()`; `:395` is the
  `**Closes roadmap**` stray-collector. The row is explicit that fixing `:189` is preferred **over**
  hardening `(.+)$` — but it is equally explicit that this is *not one regex*. Sweep the whole file
  for parses anchored with `$` or matching to end-of-line and say in your report which ones you
  audited and what you concluded about each. The ones the row already adjudicated and that must not be
  "fixed": `/^##\s+(WO-…)/`, `/^\*\*Acceptance\*\*/`, `/^---\s*$/`, `/^\*\*[A-Z]/`.
- **`tools/wo-gate.mjs` § `--self-check` and its seventeen plants**, including the closing note that
  currently reads *"NOT covered: the Acceptance parser against the real work orders"*. Your new plant
  goes beside the seventeen; the note is rewritten at that sentence and nowhere else.
- **`tools/README.md` wherever it states the plant count.** The row says take the moved number from a
  run, not by arithmetic (`wo-sweep.mjs:673` states that rule).
- **`plans/work-orders/phase-3-gradebook.md`** — the file whose CRLF conversion produced this row, and
  the source of the WO-3.25 / ten-lines case the first Acceptance line asks you to use. **Read it; do
  not convert it.** Make your CRLF copy somewhere temporary and leave the tracker's own bytes alone —
  "do not 'fix' the trackers by converting them" is a Trap, and `git status --short` must be clean of
  it when you finish.
- **`plans/dispatch-retro.md`** — for the diffstat check that caught this, which is the only reason
  the row exists. Do not widen this row into that file's territory.

One process note, because you are editing the script the dispatch pipeline runs on: `--tick` and
`--start`/`--release` are the orchestrator's, not yours. You may drive `--tick … --dry-run` freely as
evidence, and the Acceptance asks you to. Do not run a live `--tick`.

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
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
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

## 5. Done means these 7 lines, reported against one by one

1. A phase file converted to CRLF and otherwise byte-identical parses to the **same** Acceptance lists as its LF original — proved by naming the counts for a work order that has boxes, not by a green run. `WO-3.25` and its ten lines is the case that produced this row and is the one to use.
2. `--tick` on a CRLF file with an **open** box writes 🔨 IN PROGRESS and names the open line, exactly as it does on LF. This is the check the defect actually defeated; a row that only proves the count is right has not proved the decision is.
3. The `**Closes roadmap**` stray-collector reads a CRLF file too — shown, because it is the second parse that went blind and the evidence the fault was never one regex.
4. An Acceptance heading whose list parses empty makes `--tick` **refuse and write nothing**, naming the file. Driven, and `git status --short` proved byte-identical either side.
5. The new plant is CRLF **in its own bytes** — asserted by reading them, not by writing the file and trusting the platform — and removing the `:189` fix turns `--self-check` red and names it.
6. On the unmutated tree: `--self-check` green with its count matching `tools/README.md` wherever that file states one, `--audit` still PASS, and `node tools/wo-sweep.mjs` unchanged.
7. `git diff --stat -- src/` is empty.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

