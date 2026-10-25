# WO-1.84 — the harness's no-remover checks have never been read against one list of removers · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.84-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (no model override). The deciding signal is that the deliverable is a
*reading* written as `TESTING.md` prose — a catalogue whose every shape needs a removes/reorders/adds
argument, a per-fence verdict on whether its own words overclaim, and a recommendation — and the Traps
are judgment traps (*n/a is not passes*, *do not fix as you go*), ROUTING § Route to Claude. The
runner-up set aside: the probe runs themselves are mechanical and Codex-shaped, but they are the means,
not the work.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.84 — the harness's no-remover checks have never been read against one list of removers

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-24 · **Size** M · **Depends on** WO-1.83 · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.83 made.)*

**Booked 2026-10-24**, owner-directed, out of WO-1.83's verdict. **An inventory, not a repair**:
the owner's ruling is that the gaps get found in one go *before* a correction is booked, rather
than one verdict at a time. WO-1.82 restored the log's append-only check, its verifier found two
removers past it, and WO-1.83 closed those two. Then WO-1.83's verifier found three more:

- `d['log'] += ''` and `d.log += ""` — a compound assignment that turns the array into a string.
  WO-1.83's `.length` pattern counts compound assignment as assignment, but the `.log` and
  bracketed-key patterns do not, so **the file's patterns disagree with the file's own argument**.
- `[d.log] = [[]]` — a destructuring assignment.

None of the three is in the check's *a fence, not a reading* line, which since WO-1.83 names five
shapes as everything that passes. The pattern is three verdicts running, each finding shapes the
last one did not list. **And the log's check is not the only one built this way.** At least five
more checks in the harness refuse a remover or a writer by searching source text, and none has
been read against a common list:

- `tools/verify/log-entries.mjs` — *append-only is structural rather than promised*, `src/log.js`
- `tools/verify/contact-log.mjs` — the `splice` search over `src/log.js`
- `tools/verify/term-record.mjs` — `REMOVERS`, over `src/term-record.js` (WO-3.72's append-only writer)
- `tools/wo-sweep.mjs` § 17 — `src/calendar-derived.js` has no writer
- `tools/wo-sweep.mjs` § 20, claim 4 — `src/merge-fields.js` has no writer
- `tools/wo-sweep.mjs` § 24 — `src/outreach.js` writes nothing

Nothing is known to be wrong in any of the files those checks guard. **The fences have unread
edges; the fields do not have known holes.**

**Deliverables**
- **The full list of fences**, starting from the six above and grown by a search of `tools/` for
  any other check that refuses a writer, remover or mutation by matching source text. A check found
  this way is added to the inventory, not left out because it was not on the list.
- **One catalogue of removal and mutation shapes**, written once and used for every fence. At least:
  plain, compound (`+=`, `-=`, `||=`, `??=`, …) and destructuring assignment to the collection;
  dotted, bracketed (any quote, template literal) and computed (`d[k]`) keys; writes through an
  alias; `length` writes, including `length--` and `length -= n`; each mutating `Array.prototype`
  method by name; `delete` in each key form; `Object.assign`, `Reflect.set`,
  `Reflect.deleteProperty`, `Object.defineProperty`; and replacement of the containing document.
  Each shape is argued as *removes or overwrites an entry*, *reorders only* or *adds only*, the
  test WO-1.83 applied to `.reverse(` and `.sort(`.
- **Every shape run against every fence** through an in-memory probe of the check's own matching
  code, the method WO-1.83's verifier used (`plant.mjs`). **No plant goes into `src/`.** The probe
  is a throwaway in the scratchpad. It is not committed, and its source is quoted in `TESTING.md`.
- **A table in `TESTING.md` § WO-1.84**: fence by shape, each cell *refused*, *passes* or *n/a*
  with a one-line reason. Under it, for each fence, whether its own prose (detail line, header
  comment, `tools/README.md` entry) claims more than the table supports.
- **A recommendation for the correction**, ending the section: which passing shapes are worth
  refusing and which belong in a *fence, not a reading* line, grouped into one or more M/S work
  orders. **Nothing is booked from it in this work order**; booking is the owner's.
- **`TESTING.md` § WO-1.84** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] `TESTING.md` § WO-1.84 lists every fence the search found, each with its file, line and the
      source file it guards, and states the search that found them.
- [ ] The catalogue is in `TESTING.md` § WO-1.84, and every shape carries its *removes*, *reorders*
      or *adds* reading.
- [ ] Every cell of the fence-by-shape table is filled, and each *passes* cell has been produced by
      the probe, not by reading the regex.
- [ ] Each fence's own prose is marked as matching the table or overclaiming, quoting the words.
- [ ] No file under `src/` or `tools/` differs from `HEAD` when the work order closes, apart from
      `TESTING.md`, `CHANGELOG.md` and this phase file. `node tools/verify-shell.mjs` and
      `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-1.84 carries these lines verbatim with the evidence for each.

**Traps** — **Do not fix as you go.** The ruling is to inventory first, so a check tightened in
this work order is a correction landed before it was asked for, and it changes the table under
the rows already read. **The probe must run the check's code, not a copy of its regexes**: a
copied regex is the WO-1.82 defect (three patterns that never matched what their comments
described), arriving in the tool that is meant to find it. **A shape no fence's own claim covers
is n/a, not *passes*.** § 17's *no writer* does not promise to catch reordering, and marking it red
for that would book a widening by symmetry, which WO-1.83 refused. **Nothing in `src/` moves**, so
no `CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/calendar-derived.js`
  - `src/log.js`
  - `src/merge-fields.js`
  - `src/outreach.js`
  - `src/term-record.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/verify/contact-log.mjs`
  - `tools/verify/log-entries.mjs`
  - `tools/verify/term-record.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `TESTING.md` § WO-1.83 (around line 4587) and `.claude/dispatch/WO-1.83-result.md` — the prior work
  on the log's check, the five shapes its *fence, not a reading* line names, and the `.reverse(`/`.sort(`
  reorders-only argument you are to apply to every shape.

### Orchestrator notes — the traps this brief adds

- **This work order ships no code.** § 4's *"Add checks for what you build"* is boilerplate here:
  Acceptance 5 requires that **nothing under `src/` or `tools/` differs from `HEAD`** at close. The
  probe lives only in the scratchpad
  (`C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\81253719-bb85-4668-9fe5-110cd70df2ba\scratchpad`)
  and its source is quoted in `TESTING.md`.
- **Running "the check's own code".** Most fences are inline in a `run(h)` body (e.g.
  `tools/verify/term-record.mjs:372-389`, `log-entries.mjs:~368-435`), and `contact-log.mjs:~677` runs
  inside a `page.evaluate` string. WO-1.83's verifier `plant.mjs` is not in the tree. The method: at
  probe time, **read the harness file and slice out the check's code text** by stable anchors (assert
  the slice was found), then execute that text against an in-memory substitute for the guarded source —
  the real `src/` file with one planted shape spliced in. Never retype a regex or token list into the
  probe. If a fence genuinely cannot be executed that way, say so in its row and why; do not fall back to
  reading the regex for a *passes* cell (Acceptance 3).
- **A positive control per fence**: each fence against the unmodified source (must pass) and against a
  shape it is known to refuse (must refuse), so a probe that silently fails to plant cannot report
  *passes* everywhere.
- **Read each fence's guarded file from its code, not from the work order's list.** E.g. the
  `contact-log.mjs` check's message names `src/contact-history.js`; the work order says `src/log.js`.
  Record what the code actually reads; a discrepancy is a finding, not something to smooth over.
- **The search for more fences** (Deliverable 1) is stated as commands in `TESTING.md` — e.g. greps over
  `tools/` for `indexOf('.`, `REMOVERS`, `splice`, `no writer`, `writes nothing`, `append-only`,
  `update(` — and every hit is triaged: kept as a fence, or excluded with a reason.
- **`CHANGELOG.md`**: the work order lists the entry as a deliverable and Acceptance 5 permits the file,
  so write it — this overrides § 3's general "leave CHANGELOG to the teacher" line for this work order.
- **Mutation hygiene still applies**: before reporting, `git diff --stat src/ tools/` (must be empty)
  and `grep -rn MUTATION src/ tools/` (must find nothing new).
- Both harnesses run green **from this tree** before you report; cite summary lines and exit codes.
  `wo-sweep` REVIEW lines are not failures — read its summary line.

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

## 5. Done means these 6 lines, reported against one by one

1. `TESTING.md` § WO-1.84 lists every fence the search found, each with its file, line and the source file it guards, and states the search that found them.
2. The catalogue is in `TESTING.md` § WO-1.84, and every shape carries its *removes*, *reorders* or *adds* reading.
3. Every cell of the fence-by-shape table is filled, and each *passes* cell has been produced by the probe, not by reading the regex.
4. Each fence's own prose is marked as matching the table or overclaiming, quoting the words.
5. No file under `src/` or `tools/` differs from `HEAD` when the work order closes, apart from `TESTING.md`, `CHANGELOG.md` and this phase file. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
6. `TESTING.md` § WO-1.84 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.84 — it is a deliverable, not a permission.** Add `### WO-1.84 — the harness's no-remover checks have never been read against one list of removers` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.84` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

