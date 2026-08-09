# WO-2.15 — wo-gate tells the truth about its own writes · result

**Route** Claude (work-order-implementer) · **Date** 2026-08-08
**Status left on disk** 🔨 IN PROGRESS — all ten Acceptance boxes ticked, the status line untouched.
`--tick WO-2.15` is the orchestrator's step, not mine; its dry run is quoted under line 9 below.

---

## Against the Acceptance list, one by one

### 1. `--self-check` passes on the current tree, and the run says how many plants it made — ✅

`node tools/wo-gate.mjs --self-check` exits 0. The run prints, verbatim:

```
  9 plants, 9 caught, 0 missed.
```

There are nine, not the five the Deliverables name. The five named ones are all there; the other
four exist because other acceptance lines demand them — the happy path (line 9, WO-2.14's line 7),
the zero-match fragment (line 5), the planted wrong dashboard count (line 8), and `next` naming a
skipped claimed row (line 9, WO-2.14's line 9). The run also prints what it does **not** cover, in
five lines, ending `A green run here is not coverage — it is nine claims about nine plants.`

### 2. Each plant is proved to be able to fail — ✅

**The pre-WO-2.14 script.** `git show 7973a42:tools/wo-gate.mjs` into the scratchpad, then
`node tools/wo-gate.mjs --self-check --against <that file>`:

```
FAIL | an unticked Acceptance line holds --tick at 🔨 IN PROGRESS instead of ✅ DONE
FAIL | a second --start on a claimed work order is refused
ok   | --start on ✅ DONE, 🚧 BLOCKED and 🔒 GATED is refused, and writes nothing
FAIL | --release refuses what nobody claimed, and returns a claimed one to ⬜ NOT STARTED
FAIL | --dry-run on --start, --release and --tick writes nothing at all
ok   | a fully ticked work order still gets ✅ DONE, its roadmap box, and the dashboard
FAIL | a **Closes roadmap** fragment matching no box holds the tick and writes nothing
FAIL | `next` names the claimed row it stepped over, and the way back
FAIL | a wrong count in ROADMAP.md's dashboard holds the tick, with both numbers shown
FAIL | 7 of 9 plants were not caught.
```

The two the acceptance line names are red. The acceptance-list plant reports all five of its clauses
independently — `it wrote "✅ DONE — 2026-08-08" over an open Acceptance list`, `it ticked the
roadmap box of an unfinished work order`, `it moved a dashboard`. Two plants stay green against that
subject, which is the point of showing the whole list rather than a count: the old script rejects
`--start` outright, so plant 3 passes **for an unrelated reason** — exactly the Traps failure mode —
and plant 6 passes because the happy path is a regression guard, not a new refusal.

**So each plant was also proved by mutation of the current script**, one one-line mutation at a time,
each run as `--self-check --against <mutant>` (mutants in the scratchpad; the repository file was
never edited for this):

| Mutation | Plants that go red |
|---|---|
| `--start` fence → `if (false)` | 2, 3 |
| `--release` fence → `if (false)` | 4 |
| `if (!dryRun)` → `if (true)` | 5 |
| `held = open.length > 0` → `held = true` | 5, 6, 7, 9 |
| `blockers = [...rm.blockers]` → `[]` | 7 |
| `driftBefore = roadmapDashboardDrift(…)` → `[]` | 9 |
| `reportSkips`' loop → over `[]` | 8 |
| `phaseLines[e.line] = e.after` → no-op | 2, 4 |

Every one of the nine has at least one demonstrated way to go red, and no mutation turns everything
red — the plants discriminate.

### 3. `--self-check` writes nothing inside the repository — ✅

Hashes, not the banner: `find plans -type f -print0 | sort -z | xargs -0 sha256sum | sha256sum`
before and after. `7d8fcc8c1ef5…d986c` before, identical after the green run, after the red run
against the pre-WO-2.14 script, and after a run with a missing `--against` path.

Two further proofs, because "it did not write this time" is weaker than "it cannot":

- **The guard is live.** A copy of the repository was built in the scratchpad (`fakerepo/plans`,
  `fakerepo/tools/wo-gate.mjs`) with `rel()` mutated to aim every plant at `REPO/plans` instead of
  the sandbox. The run dies on the first write with
  `Error: --self-check refused to write inside the repository: …fakerepo\plans\ROADMAP.md`, and the
  fake repository's `plans/` hashes identically before and after. Every plant write goes through
  that guard; there is no `--dry-run` in it, deliberately.
- **The subject cannot reach the real tree either.** The script under test is copied to
  `<sandbox>/tools/wo-gate.mjs`, so it resolves its own `REPO` to the sandbox.

### 4. No temp directory left behind on either exit path, including the failing one — ✅

`ls %TEMP% | grep -c wo-gate-selfcheck` reads `0` after: the green run, the failing run against the
pre-WO-2.14 script, a run with a nonexistent `--against` path, and a **throwing** run — the last
forced in the scratchpad copy by setting `FIXTURE_PHASE = '99'`, which throws inside `runPlants()`
after the sandbox exists. Cleanup is a `finally` around the whole of `runPlants`.

### 5. A zero-match fragment is handled per the decision, on a planted fragment — ✅

Decision: **HELD** (reasoning in §"Three decisions" below and in a comment above `roadmapEdits()`).
Plant 7 writes a fixture whose fragment reads *"a roadmap box that no line of ROADMAP.md contains"*
and asserts exit non-zero, `HELD` in the output, `matched 0` in the output, and **every file in the
copy byte-identical**. WO-2.5 is not the fixture and appears nowhere in `--self-check`.

### 6. WO-2.5's fragment matches exactly one roadmap box, proved by the sweep — ✅

`node tools/wo-gate.mjs --audit`:

```
  ok   WO-2.5   ROADMAP.md:288  [x] Keyboard path on desktop (row select, `P`/`T`/`A`/`E`, arrows…
```

Not proved by `--tick WO-2.5 --dry-run`, which still exits
`FAIL | WO-2.5 is "✅ DONE" — only ⬜ NOT STARTED or 🔨 IN PROGRESS may be ticked` (confirmed).
The box is at **`ROADMAP.md:288`**, not `:280` — the work order's line number was already stale by
eight lines when it was written, which is its own point made a fourth time.

The fragment now stops where the box wraps and carries `…`; the trailing
`` `@media (pointer: coarse)`. Both, not either. `` is on the box's second line and cannot be
matched, because a fragment is compared against **one** line. I left the matcher line-based (see
"declined" below) and wrote the quoting rule into `plans/work-orders/README.md` instead.

### 7. Every `Closes roadmap` fragment in `plans/work-orders/`, all of them — ✅

`--audit` walks all **63** work orders — 53 with the field, **78 quoted fragments** — and prints one
line each: `ok <ID> ROADMAP.md:<line> [x|] <fragment>`, or `BAD` with the reason. It now ends
`PASS | every fragment matches exactly one roadmap box…` and exits 0.

**The first run found nine problems, and all nine are fixed:**

| Work order | What was wrong | Fix |
|---|---|---|
| WO-2.5 | fragment dropped the box's parenthetical → 0 boxes | re-quoted from the box, ellipsis at the wrap |
| WO-2.11 | fragment paraphrased the box → 0 boxes | re-quoted: *"The pass banner, and cancelling a pass issued by mistake"* |
| WO-8.3 | dropped `(NVDA/VoiceOver)` → 0 boxes | re-quoted |
| WO-6.2 | elided the box's middle with `—` → 0 boxes | quoted in full |
| WO-6.1 | `"Event model"` is under 12 chars normalised → refused as unsafe | quoted the whole box |
| WO-3.10 | quoted the roadmap's **Parallel, non-code** line, which is a *paragraph, not a checkbox* | quotation marks off; states there is no box |
| WO-G4 | quoted *What 1.0.0 means*, which is a *heading, not a checkbox* | quotation marks off; states there is no box |
| WO-1.13 | a prose reference, `see "Why it exists"`, was read as a fragment | quotation marks off |
| WO-2.8 | **the whole `**Closes roadmap**` line sat one blank line below the header paragraph**, invisible to every script here — `--tick` would have said "no **Closes roadmap** line" and closed nothing | moved into the header paragraph |

WO-2.8 is the one worth reading twice: its "Hall passes" box was ticked by hand and nobody noticed
the tool could not see the field. `--audit` and `--tick` now both report a `Closes/Amends roadmap`
line found below the header paragraph, and `--tick` refuses on it.

Each fixed fragment carries a dated *(italic paren note)* saying what was wrong, and the general
rules are written up in `plans/work-orders/README.md` § "Header fields, and the two ways they rot" —
see "Where the sweep's findings went" below.

### 8. Every `## Phase N` row against its own boxes, with both numbers, proved on a plant — ✅

On the current tree the check is **clean**, as the brief predicted: rows `4/4, 12/12, 12/16, 0/10,
0/8, 0/9, 0/8, 0/7, 0/8`, overall row `28/82`, rows sum `28/82`, boxes `28/82`. The hand correction
in `c8a2adc` is confirmed correct by an independent count.

Proved two ways, neither on the real tree:

- **Plant 9** corrupts the copy's Phase 3 row by `+7` and asserts `--tick` exits non-zero, says
  `HELD`, prints **both** the number the row carries and the number the boxes count, and writes
  nothing.
- **The 2026-08-08 drift reconstructed** in a scratchpad copy of the repo (Phase 1 → `11/12`,
  Phase 2 → `10/16`, overall → `22/81`), which reports:

```
FAIL | Phase 1: the dashboard row says 11/12, the boxes under "## Phase 1" say 12/12 (ROADMAP.md:52)
FAIL | Phase 2: the dashboard row says 10/16, the boxes under "## Phase 2" say 12/16 (ROADMAP.md:53)
FAIL | Overall: the row says 22/81, its own rows sum to 25/82 (ROADMAP.md:60)
FAIL | Overall: the row says 22/81, the boxes in the file count 28/82 (ROADMAP.md:60)
```

That is the overall row checked against the sum of the rows **and** against the file, as two separate
lines, reproducing the exact numbers the work order records. It is **report only**: nothing in this
change writes `ROADMAP.md`'s dashboard, in any code path.

### 9. `--tick`, `--start` and `--release` behave exactly as before — ✅

WO-2.14's acceptance list is not re-run by hand; it is **encoded as plants**, which is the only form
of it that survives to November:

| WO-2.14's line | Where it now lives |
|---|---|
| 1 — `--start` writes 🔨, a second exits non-zero, proved by running it twice | plant 2 |
| 2 — `--start` refuses ✅ DONE, 🚧 BLOCKED, 🔒 GATED without editing | plant 3 (all three statuses) |
| 3 — a claim moves neither dashboard | plant 2 (asserts only the phase file changed) |
| 4 — the way back returns it to ⬜, and says so | plant 4 (both directions) |
| 5 — one unticked line → 🔨, and names it | plant 1 |
| 6 — that refusal leaves the roadmap box unticked | plant 1 |
| 7 — fully ticked → ✅ DONE, roadmap box, dashboard | plant 6 |
| 8 — `--dry-run` prints the exact edit and writes nothing | plant 5 (asserts the `+` line **and** compares files) |
| 9 — `next` names the row it stepped over | plant 8 |
| 10 — `verify-shell` / `wo-sweep` clean | line 10 below |

Live on the real tree, read-only: `--tick WO-2.5 --dry-run` still refuses on the status fence,
`--tick WO-2.15 --dry-run` shows the ten-line HELD, `next` and the gate reports are unchanged in
shape, and `plans/` hashes identically across all of it. After ticking the ten boxes,
`--tick WO-2.15 --dry-run` plans exactly three edits and nothing else:

```
  + **Ship** — · **Status** ✅ DONE — 2026-08-08 · **Size** M · **Depends on** WO-2.14
NOTE | all 10 Acceptance lines are ticked — nothing holds WO-2.15 open
NOTE | this work order has no **Closes roadmap** line — no roadmap box to tick
plans\work-orders\README.md:107   | 2 — Attendance | 14 | 10 |  →  | 14 | 11 |
plans\work-orders\README.md:115   | | **63** | **24** |  →  | **63** | **25** |
```

**One behaviour did change, and it is the deliverable:** `--tick` now refuses, writing nothing at
all, when a `Closes roadmap` fragment closes no box, when such a line sits below the header
paragraph, or when `ROADMAP.md`'s dashboard disagrees with its own boxes. No file that `--tick`
could touch before can be touched now, and none has been added.

### 10. `verify-shell.mjs` and `wo-sweep.mjs` clean — ✅

```
428 checks · 428 passed · 0 failed · 0 skipped      exit 0
12 checks · 11 passed · 0 failed · 1 to review      exit 0
```

`tools/README.md` says 428 for the tree WO-2.5 left, and 428 is what it measures. The one `REVIEW`
is `wo-sweep`'s standing sensitive-field-names item, which never fails a run and was already there;
nothing in this work order touches `src/`.

---

## The three decisions, and the sub-decisions under them

**1. A zero-match `Closes roadmap` fragment is a `HELD`, not a `NOTE`.** Recommendation taken, and
broadened by one sentence: *a fragment that produces no edit and is not already ticked holds the
tick.* That covers zero matches, several matches, and a fragment too short to match safely, because
all three are the same fact — the work order names a box and none gets closed. Leaving `>1` and "too
short" as NOTEs while zero was a HELD would have left the identical hole under a different arm of
the same `if`. **"Already ticked" stays a NOTE**: the box is closed, just closed earlier, by hand or
by an amending work order — nothing is untrue. The refusal writes **nothing at all**, not even
🔨 IN PROGRESS, because an open Acceptance line means the *work* is unfinished (and 🔨 is the true
status), whereas this means the *tracker* is wrong about itself and there is no status that makes
that true. Reasoning is in the code above `roadmapEdits()` and at the refusal itself.

**2. `**Amends roadmap**` is real.** It is parsed as its own field, reported by `gate()` on its own
line, and **never written**. Three reasons. It carries something a reader wants at the top of a work
order — that this one changes the promise of a box an earlier one already closed (WO-2.12 narrowing
WO-2.1's grid to portrait; WO-2.13 changing how often WO-2.4's arithmetic runs), which is
`ROADMAP.md`'s maintenance step 2 stated where it is owed. The only concrete harm it did was that
`depsOf()` scraped it and announced a "non-work-order clause" on two work orders that depend on
exactly one thing each — a three-line parser fix, not a reason to delete prose from two shipped work
orders. And the alternative reads backwards: removing a field from the record because a script could
not parse it is the tail wagging the dog.

The parser change is slightly larger than that one field: fields now stop at the **next known
field**, from a closed `KNOWN_FIELDS` list, because an unknown bold field does not go missing — it
gets swallowed by whatever regex ran to the end of the line. That is written at the point of
decision, and the field vocabulary is now documented in `plans/work-orders/README.md`.

**3. Roadmap dashboard drift is a `HELD` on `--tick`, and a `NOTE` on the gate report.** Same answer
as decision 1, for a narrower reason: `--tick` is the one moment the tool is trusted to leave the
trackers true, and a NOTE among NOTEs is what gets read past — which is precisely how WO-2.5's
zero-match fragment survived. Two things keep it from being a nuisance:

- **It is read before the writes**, so a run never refuses over drift it created itself.
- **After a clean tick it prints the row the hand edit now owes**, with the new numbers, so the
  manual step is a copy out of the output rather than a second investigation.

On the **gate report** it is a `NOTE`, not a `FAIL`: a gate report answers "may this work order
start", and a stale summary elsewhere is not a reason to refuse to start work. `--audit` gives the
full table on demand. Nothing writes the roadmap dashboard, on any path.

**Sub-decisions I had to make that the work order did not settle:**

- **`--self-check --against <path>`.** Acceptance line 2 requires running the plants against a script
  that has no `--self-check` of its own, so the harness and the subject must be separable. Defaults
  to this file; documented at the flag with that reasoning.
- **`--audit` as the sweep's home, and its name.** Acceptance line 7 says "reported… run it over all
  of them", and a one-off script in a scratchpad is the exact evidence-evaporation this work order
  exists to stop. It is a flag on `wo-gate.mjs`, not a new file. I called it `--audit` rather than
  `--fragments` because it carries the dashboard table too; a verifier looking for line 7 should run
  `--audit`.
- **The self-check fixture is synthetic (`WO-9.9`), written into the copy by the check itself.** No
  real work order is a fixture anywhere in `--self-check`. This work order's own acceptance list had
  to be re-cut twice because it named real fixtures that were spent within the week; a fixture the
  check writes cannot be spent, and does not rot when the trackers move. It carries a paragraph
  addressed to anyone who ever finds it in the repository, telling them a self-check died and how to
  delete it.
- **A `Closes/Amends roadmap` line below the header paragraph is its own blocker.** Not named in the
  work order; found by the sweep at WO-2.8, and it fails in the quiet direction (`--tick` reports
  "no such line" and closes nothing), which is the family this work order exists to close.
- **Nine plants, not five.** The five named, plus four the other acceptance lines demand.

## Where the sweep's findings went

`plans/work-orders/README.md`, a new section **"Header fields, and the two ways they rot"**, placed
between the status vocabulary and the file table — the front door of the trackers, which is where
someone writing a work order header is already reading. It holds the field table (including
`Amends roadmap`), the "one paragraph, no blank line" rule with WO-2.8 as its scar, four numbered
rules for quoting a fragment each traced to the fragment that broke it, the `--audit` invocation,
and a dated paren note recording all nine findings. Not the result file: this file is a dispatch
artifact and nobody reads it while typing a header.

`plans/verification-tooling.md` also gets a short dated section recording **why `--self-check` is a
flag inside `wo-gate.mjs`** and not `tools/wo-selfcheck.mjs` — that document exists precisely to be
found by the next person who thinks splitting it out is good hygiene, and it now names this case,
with the signal to watch: *if the plant count outruns the behaviour count, something is tested twice.*

## Files changed

| File | Why |
|---|---|
| `c:\dev\planbook\tools\wo-gate.mjs` | `--self-check`, `--audit`, the two new refusals, the drift check, `Amends roadmap`, stray-field detection (+703 lines) |
| `c:\dev\planbook\tools\README.md` | the `wo-gate.mjs` row, and what the two new flags do and do not prove |
| `c:\dev\planbook\plans\verification-tooling.md` | why the self-check is a flag and not a file |
| `c:\dev\planbook\plans\work-orders\README.md` | header field vocabulary, fragment-quoting rules, the sweep's nine findings; phase-2 file range `… WO-2.15` |
| `c:\dev\planbook\plans\work-orders\gates.md` | WO-G4's fragment (a heading, not a box) |
| `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` | WO-1.13's accidental fragment |
| `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` | WO-2.5 and WO-2.11 fragments; WO-2.8's stray line moved into the header; WO-2.15's ten Acceptance boxes ticked |
| `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` | WO-3.10's fragment (a paragraph, not a box) |
| `c:\dev\planbook\plans\work-orders\phase-6-calendar-glance.md` | WO-6.1 and WO-6.2 fragments |
| `c:\dev\planbook\plans\work-orders\phase-8-packaging.md` | WO-8.3's fragment |

No `src/` file, no `index.html`, no `sw.js`, no `CHANGELOG.md`, no new file anywhere. No commit, no
push. No `package.json`, no dependency, no `tools/lib/`, no second harness.

## What I could not verify, and what I declined

**Nothing here needed an iPad or human eyes**, and I ticked no 👤 line — WO-2.15 has none. All ten
acceptance lines are mechanically checkable and all ten were checked by running something.

The one honest gap in the evidence: **plants 3 and 6 do not go red against the pre-WO-2.14 script**,
for the unrelated reasons named under line 2. They are proved by mutation instead. If a verifier
wants a single command for that, it is
`--self-check --against <copy with the --start fence disabled>`.

**Temptations declined, each of which would have widened the work order:**

- **Making the matcher join a roadmap box's wrapped lines.** This would let WO-2.5's *original*
  fragment match, and is arguably the better matcher. It changes match semantics for all 78
  fragments (new multi-match risk), and the work order says fix the fragment. Declined; the
  one-line rule is documented instead. **Proposed follow-up if it is ever wanted:** it should come
  with an `--audit` run before and after, since a fragment that matched one line may match two once
  lines are joined.
- **A `--fix-dashboard` that writes `ROADMAP.md`'s progress table.** Explicitly out of scope
  ("report only, never write"), and it would remove the reason anyone reads the row. Declined.
  The tick now prints the row it owes, which is the cheap half.
- **Adding a checkbox to `ROADMAP.md` for the "Parallel, non-code" paragraph** so WO-3.10 could
  close something. That changes Phase 3's denominator and needs a hand dashboard edit. Declined;
  the work order says so in prose now.
- **Editing `ROADMAP.md:288`'s paren note**, which says the box text was "left as it stands rather
  than edited into agreement" because WO-2.15 owned the matcher. Still historically true, and the
  fix went into the fragment as the work order directed. Left alone.
- **`work-orders/README.md`'s dashboard numbers** were already correct (Phase 2 is 14 work orders,
  10 done — there is no WO-2.2); `--tick WO-2.15` will move Done to 11. Not hand-edited.
- `wo-brief.mjs` parses none of these fields (it copies the work order verbatim), so nothing there
  drifted with the parser change. Checked, not changed.

## Draft `CHANGELOG.md` entry — yours to accept, reject or rewrite

> ### Changed
> - `tools/wo-gate.mjs` now refuses to tick a work order whose `Closes roadmap` fragment closes no
>   roadmap box, and one whose roadmap dashboard disagrees with its own boxes. Both used to print a
>   quiet note and then say `PASS` — which is how WO-2.5 shipped with its roadmap box closed by hand.
>   Neither writes anything; the roadmap's progress dashboard remains a hand edit, and the run now
>   prints the row it owes.
> - Nine `Closes roadmap` fragments across the trackers quoted boxes that had been reworded,
>   elided or were never boxes at all, and one sat where no script could see it. All nine are fixed,
>   each with a note saying what was wrong, and the rules for quoting one are in
>   `plans/work-orders/README.md`.
>
> ### Added
> - `wo-gate.mjs --self-check`: copies `plans/` to a temp directory, plants the nine violations the
>   script exists to catch against a work order it invents, runs itself over the copy, and fails if
>   one stops being caught. The evidence for WO-2.14 lived in a dispatch transcript; now it runs.
> - `wo-gate.mjs --audit`: every `Closes roadmap` fragment against `ROADMAP.md`, and `ROADMAP.md`'s
>   dashboard against the boxes under its own headings. Reports; never writes.
