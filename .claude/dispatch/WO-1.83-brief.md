# WO-1.83 — the log's append-only check passes two ways of emptying the log · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.83-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override). Codex is out on the proof budget alone: the
Acceptance demands one clean `verify-shell.mjs` run, one per plant (four), and a final pass — about six
runs at ~4.4 min, ~26 min against a 20-minute cap — and the work order also sits in the Claude column on
its merits: `TESTING.md` prose, and a Trap that is judgment rather than mechanics (*a widened list is
argued per token, not by symmetry*; the detail line must name what **still** passes). The runner-up was
Sonnet, on the reading that a regex edit is mechanical; set aside because the deliverable that matters
is the honest *what still passes* sentence, which is a noticing-what-is-absent job.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.83 — the log's append-only check passes two ways of emptying the log

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-24 · **Size** XS · **Depends on** WO-1.82 · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.82 made.)*

**Booked 2026-10-24**, owner-directed, out of WO-1.82's verdict. With WO-1.82's three regexes
restored and green, its verifier planted two more removers into a copy of `src/log.js` and **both
passed** the check headed *append-only is structural rather than promised* in
`tools/verify/log-entries.mjs`:

- `d.log.length = 0` — empties the array in place. It is not a reassignment of `.log`, not an
  assignment into `.log[...]`, and none of the five tokens.
- `d['log'] = []` — a reassignment written with brackets, which `/\.log\s*=[^=]/` cannot see because
  there is no `.log` in it. `d["log"]` and a template-literal key are the same hole.

The check says so since WO-1.82's commit — its detail line ends *a fence, not a reading* and names
both — rather than claiming nothing *could ever* remove an entry. Nothing is known to be wrong in
`src/log.js`, which carries neither shape today; **the fence has two known gaps, not the field**.

**Deliverables**
- **Both shapes refused**: an assignment to `.length` of anything in `src/log.js`, and a bracketed
  `log` key (any quote) followed by an assignment, each named in the check's `found` list. Add
  `.fill(` and `.copyWithin(` to the token list in the same edit — both overwrite entries in place —
  and nothing wider: **a widened list is argued per token, not by symmetry**.
- **The detail line's *a fence, not a reading* clause rewritten** to name what still passes after
  this, or removed only if the verifier can name nothing — never left naming two holes that are
  closed.
- **Four plants**, each red and then reverted before anything else is written: `d.log.length = 0`,
  `d['log'] = []`, `d["log"] = []` and `d.log.fill(null)`, each added to a writer in `src/log.js`.
- **`TESTING.md` § WO-1.83** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] `node tools/verify-shell.mjs` passes, the append-only check still reports 2 pushes and the
      guard present 2 times, and its removers read none.
- [ ] Each of the four plants turns the check red, naming the remover. All four are reverted, and
      `TESTING.md` § WO-1.83 shows the red output.
- [ ] The check's detail line names what still passes it, or `TESTING.md` § WO-1.83 records that the
      verifier could name nothing.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-1.83 carries these lines verbatim with the evidence for each.

**Traps** — **Plants go in `src/log.js` and come out before anything else is written** (AGENTS.md,
the WO-5.1 scar), and **stage before planting**: a `git checkout` to revert a plant reverts unstaged
work in that file too. **A `.length =` token must not fire on a read** — `x.length === 0` and
`x.length == 0` are reads, so the search refuses `=` only when no `=` follows it, as the reassignment
regex does. **Nothing in `src/` moves in the end**, so no `CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/log.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/log-entries.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/verify/log-entries.mjs` ~lines 360–421 — the check, and the long comment above it that
  WO-1.82 wrote. **That comment's "A FENCE, NOT A READING" paragraph names the two holes this work
  order closes**, exactly like the detail line does; rewrite it in the same edit, or the comment is
  left asserting two open holes over code that closes them (the "comment that ran ahead of its code"
  scar, inverted).
- `TESTING.md` § WO-1.82 (line ~4507) and the `CHANGELOG.md` WO-1.82 entry near the top — the sibling
  shape to match for § WO-1.83 and the changelog entry.

**Traps the orchestrator adds:**
- There is no single-section flag on `verify-shell.mjs`: every plant is a full run (~4–5 min). Use
  `--today` only if a date collision appears, and say so. Expect a run's output to be long; capture it
  to a file in your scratchpad and quote the append-only check's line, not the whole log.
- **Bracketed key, any quote**: `d['log']`, `d["log"]` and `` d[`log`] `` all need to match — but
  only when followed by an assignment that is not `==`/`===`, the same `=[^=]` discipline as the
  existing regex. A `.length` regex must likewise leave `.length === 0`, `.length == 0`, and
  `.length - 1` alone; check `src/log.js` actually has no `.length =` today before trusting a green run.
- A tagged name in `found` per shape (e.g. `'assignment to .length'`, `'bracketed log key assigned'`),
  so a red line says which plant fired.
- `.fill(` and `.copyWithin(` are tokens; confirm neither appears in `src/log.js` legitimately first.
- Plant protocol (AGENTS.md, WO-5.1 scar): `git add` your harness edits **before** planting, plant one
  shape at a time, run, record the red line, revert `src/log.js` with `git checkout -- src/log.js`, and
  confirm `git diff --stat src/` is empty before the next plant. `grep -rn MUTATION src/` must be empty
  before you write the result file. Nothing in `src/` moves in the end, so no `CACHE` bump.
- Do not commit; leave the tree for the verifier.

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
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
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

1. `node tools/verify-shell.mjs` passes, the append-only check still reports 2 pushes and the guard present 2 times, and its removers read none.
2. Each of the four plants turns the check red, naming the remover. All four are reverted, and `TESTING.md` § WO-1.83 shows the red output.
3. The check's detail line names what still passes it, or `TESTING.md` § WO-1.83 records that the verifier could name nothing.
4. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
5. `TESTING.md` § WO-1.83 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.83 — it is a deliverable, not a permission.** Add `### WO-1.83 — the log's append-only check passes two ways of emptying the log` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.83` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

