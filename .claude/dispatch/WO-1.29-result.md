# WO-1.29 — the Owes field on WO-4.3 names no work order, and nothing notices · implementation result

**Implementer** Claude Opus (work-order-implementer) · **Date** 2026-09-07
**Status left on the work order** `🤖 CLAIMED — 2026-09-07` — untouched. The handoff and the tick are
the orchestrator's and the verifier's.

**All nine Acceptance boxes are ticked in the work order.** None of them is 👤 or 📆; every one was
closed by a command I ran and read to completion. Evidence per line below, with the caveats stated
rather than glossed.

---

## Files changed — seven

| File | What |
|---|---|
| `c:\dev\planbook\tools\wo-gate.mjs` | `rehomesOf()` refuses a zero-id `**Owes**` value; `--audit`'s `**Owes**` section prints a row per counted work order; the `--tick` HELD heading names both shapes; `OWES_PROSE`, `owesSection()` and two new plants; closing summary |
| `c:\dev\planbook\plans\work-orders\phase-4-signals.md` | WO-4.3's header loses the field; the sentence moves into the body beside **Where this stands** |
| `c:\dev\planbook\plans\work-orders\README.md` | § "Header fields", the **Owes** row, gains the refusal clause |
| `c:\dev\planbook\plans\verification-tooling.md` | the scar — *"A cross-check whose input is a list can pass by being handed an empty one, 2026-09-07 (WO-1.29)"* |
| `c:\dev\planbook\tools\README.md` | plant count 35 → 37, the new plants described, four rows added to the mutation table, the mutation tally 26 → 30 |
| `c:\dev\planbook\TESTING.md` | new § WO-1.29, between § WO-1.27 and § WO-1.40 |
| `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` | WO-1.29's nine Acceptance boxes ticked (the `--start` status edit in this file was already there when I arrived) |

`git diff --stat`: 7 files, 382 insertions, 21 deletions. Largest single file `tools/wo-gate.mjs`,
**204 changed lines of 4,073**.

**No `CHANGELOG.md` entry written** — that is the teacher's. A draft is at the foot of this file.

---

## Against the Acceptance list, one by one

### 1. A header field holding prose with no work-order ID is refused by `--audit`, naming the work order and the file line, and `--self-check` has a plant that fails if that regresses — ✅

Measured **against the real defect**, not only against a fixture. WO-4.3's old header was restored in
a **copy** of the repository in the scratchpad (`plans/` copied, `tools/wo-gate.mjs` copied, the
header line put back by script). Nothing in the tree was edited. `--audit` over that copy:

```
`**Owes**` and its `→ WO-x.y` markers, against the boxes they name

  ok   WO-G2    [ ] → WO-3.18   WO-3.18 OAuth paperwork **submitted**, with the date re…
  ok   WO-2.31  [ ] → WO-2.33   👤 **RUN 2026-08-16 — FAILED, and left unticked deliber…
  BAD  WO-4.3   **Owes** names no work order — its value carries prose and no WO- id: the real-data box (Acceptance line 3) — and nothing else; t…. This field is acted on rather than reported, and every id on it must be pointed at by a "- [ ] … → WO-x.y" line below. Name the work order carrying the re-homed line, or take the field off and say it in the body, where a reader looks for it and no parser does   (phase-4-signals.md:188)
  ok   WO-6.1   [ ] → WO-6.4   A grades-due event warns at its configured lead time.

  4 work order(s) with a **Owes** field or a "→" marker, 3 pointer(s) resolving, 1 problem(s)
```
`AUDIT EXIT=1`.

The wording is the one the Deliverable asked for — *name the work order carrying the line, or take
the field off and say it in prose* — and it quotes § "Header fields" back at the reader (*acted on
rather than reported*, *every id must be pointed at by a `- [ ] … → WO-x.y` line below*).

**The plant, and the proof it bites.** `--self-check` plant *"a **Owes** field that names no work
order is refused by --audit, holds --tick, and never vanishes between the rows and the tally"*. Run
against the previous script — `--self-check --against <git show HEAD:tools/wo-gate.mjs>`:

```
FAIL | a **Owes** field that names no work order is refused by --audit, holds --tick, and never vanishes between the rows and the tally
     | --audit said nothing about a **Owes** field holding prose and no id
     | --audit did not name WO-9.9 as the work order carrying it
     | --audit did not point at the file and line it is written on
     | --audit exited 0 with a **Owes** field that names nothing
     | WO-9.9 was counted into the **Owes** tally and printed no row of its own — which is the defect, printed every run and read by nobody
     | the **Owes** section printed rows for 3 work order(s) and its tally says 4
     | --tick exited 0 on a **Owes** field that names no work order
     | the refused --tick never said HELD
     | the refused --tick did not say why it refused
     | the refused --tick wrote ROADMAP.md, work-orders\phase-3-gradebook.md, work-orders\README.md
FAIL | 1 of 37 plants were not caught.
```

**One caveat, stated rather than hidden.** The refusal points at the work order's **heading** line
(`phase-4-signals.md:188`), not at the header-block line the field is written on. That is the shape
this field's other two refusals already had (they use `wo.headingLine` for a field-level problem) and
I kept it rather than change the report shape of checks this work order does not own. If "the file
line" was meant literally as the field's own line, that is a one-line follow-up.

### 2. `node tools/wo-gate.mjs --tick` refuses a work order whose field parses to zero IDs — ✅

Over the same restored copy (repo untouched), `--tick WO-4.3 --dry-run`:

```
tick WO-4.3 — Praise signals   (DRY RUN — nothing written)

plans\work-orders\phase-4-signals.md:190
  - **Ship** 3 · **Status** 🔨 IN PROGRESS — built 2026-08-24 · **Size** M · **Depends on** WO-4.1
  + **Ship** 3 · **Status** 🔨 IN PROGRESS · **Size** M · **Depends on** WO-4.1

HELD | WO-4.3 has a **Owes** field or a re-homed Acceptance line that does not resolve:
      **Owes** names no work order — its value carries prose and no WO- id: the real-data box (Acceptance line 3) — and nothing else; t…. This field is acted on rather than reported, and every id on it must be pointed at by a "- [ ] … → WO-x.y" line below. Name the work order carrying the re-homed line, or take the field off and say it in the body, where a reader looks for it and no parser does

NOTE | nothing was written — not the status line above, not a roadmap box, not either dashboard.
NOTE | a "→ WO-x.y" marker only stops holding a work order open while it names a box that exists and is still [ ]. Quote the box as it reads now, or take the marker off and tick the line here on its own evidence. `--audit` lists every pointer in one pass.
EXIT=1
```

Against the previous script the same input **exits 0 and writes three files** — that is the last two
lines of the HEAD plant output quoted above, and it is the silent gate the Traps line named.

**One change I made that the work order did not ask for, named here.** The HELD heading read *"has a
re-homed Acceptance line whose pointer does not resolve"*, which is false of a field-only problem —
there is no such line. It now reads *"has a `**Owes**` field or a re-homed Acceptance line that does
not resolve"*. It was already inaccurate for the pre-existing orphaned-field refusal; I judged this
in scope because it is the refusal wording for exactly this field, and the plants assert on `HELD`
rather than on the sentence. Say the word and it goes back.

### 3. The audit's section prints one row per counted work order — ✅

**Before** (baseline, captured before I touched anything):

```
  ok   WO-G2    [ ] → WO-3.18   WO-3.18 OAuth paperwork **submitted**, with the date re…
  ok   WO-2.31  [ ] → WO-2.33   👤 **RUN 2026-08-16 — FAILED, and left unticked deliber…
  ok   WO-6.1   [ ] → WO-6.4   A grades-due event warns at its configured lead time.

  4 work order(s) with a **Owes** field or a "→" marker, 3 pointer(s) resolving, 0 problem(s)
```

**After**: the same three rows, and

```
  3 work order(s) with a **Owes** field or a "→" marker, 3 pointer(s) resolving, 0 problem(s)
```

`diff audit-before.txt audit-after.txt` is **exactly that one line and nothing else** across the
whole 200-line report. On the restored copy above the section reads **4 counted, 4 shown, 1 problem**.

**The trap this line sets, answered honestly.** `4 → 3` happened on the document fix alone. It is not
evidence of anything. The evidence is the plant assertion *"the **Owes** section printed rows for
`ids.size` work order(s) and its tally says `counted`"*, computed from `--audit`'s own printed output,
which reads **3 vs 4** against the previous script (quoted in line 1 above).

**A limit I am declaring rather than letting a verifier find.** The floor that guarantees the
invariant — a `—` row for a counted work order that printed nothing — is **unreachable on a healthy
tree by construction**: a truthy `**Owes**` either parses to ids (then each is pointed at, or it is a
BAD) or parses to none (now a BAD), and a work order with no field is only counted when it carries
markers, which print. The value trims, so a blank field leaves `owesRaw` falsy and is not counted at
all. So **no plant exercises that branch directly.** It was observed firing by mutation — the
section's `continue` skip deleted, run over a scratch copy of the repository — printing 169 rows where
the healthy tree prints 3:

```
  —    WO-G1    counted here and nothing above is about it — **Owes** (blank), no marker   (gates.md:11)
  ok   WO-G2    [ ] → WO-3.18   WO-3.18 OAuth paperwork **submitted**, with the date re…
  —    WO-G3    counted here and nothing above is about it — **Owes** (blank), no marker   (gates.md:302)
  …
```

I kept it, wrote the unreachability into the comment at the branch in the same words, and said so in
`TESTING.md` and in the scar. The Deliverable asks for it in as many words (*"can never again be the
only trace of a defect"*), and the alternative — a recomputed summary number compared against the
loop that produced it — is this work order's own subject one level up.

### 4. WO-4.3 no longer carries the field, its body records the 2026-08-25 👤 sitting, and `wo-gate.mjs WO-4.3` still reports the 📆 line exactly as it does today — ✅, with the third clause explained

The field is gone (`git diff` on `phase-4-signals.md` shows the one deleted line). The sitting is
recorded twice in the body: the pre-existing **Where this stands** paragraph already said *"The 👤
sitting was run by the owner on 2026-08-25 and all eight readings passed — `TESTING.md` § WO-4.3
carries them"*, and I added a dated paragraph beside it quoting the removed field verbatim, saying why
it went, and saying **do not put it back**.

**Read the third clause precisely, because it does not mean what it looks like it means.**
`wo-gate.mjs WO-4.3` **prints no 📆 line, before or after** — 📆 is reported on a **dependent's** gate
report by `calendarHold()`, so WO-4.3's own report never carried one. Both reports are identical but
for the `owes` line disappearing (which is the deliverable) and the `git` block. The place the 📆 line
is actually printed is `wo-gate.mjs WO-4.5`, and there the whole report is identical either side but
for the line number the same line now sits on:

```
< NOTE |   📆 WO-4.3  plans\work-orders\phase-4-signals.md:257  Running the praise list two weeks apart on real data surfaces a materially di…
> NOTE |   📆 WO-4.3  plans\work-orders\phase-4-signals.md:256  Running the praise list two weeks apart on real data surfaces a materially di…
```

The `-1` is the header line removed above it. Nothing about 📆, `calendarHold()` or the fences was
touched. I ticked the box on that reading; if a verifier reads "exactly as it does today" as
requiring an unchanged line number, the box should come back off and the answer is that the line
cannot both move and not move.

### 5. `--audit` passes, and every work order's eight parsed fields are unchanged across all 169 — ✅

```
$ node tools/wo-gate.mjs --audit
PASS | every fragment matches exactly one roadmap box, every **Owes** pointer lands on an open box,
       every uncounted box has a struck or deferred work order behind it, § The files names what its
       files hold, and every dashboard row matches its own boxes.
EXIT=0
```

The dump: a scratchpad script (**not** a tool in `tools/`, and not a harness) slices each build of
`wo-gate.mjs` at its `main` marker, imports it, and runs its own `parseFile()` over every `.md` in
`plans/work-orders/` except `README.md` and `ROUTING.md`, printing `ship`, `status`, `statusRaw`,
`size`, `dependsRaw`, `blocks`, `target`, `closesRoadmap`, `amendsRoadmap` — the eight the line names
plus `statusRaw` — and also `owesRaw` and `unknownFields`. Technique lifted whole from WO-1.27's
result file.

```
$ diff <(grep -v "   owesRaw = " fields-before.txt) <(grep -v "   owesRaw = " fields-after.txt)
IDENTICAL: all 169 work orders, all eight named fields
```

With `owesRaw` **included**, the entire diff across all 169 is one line:

```
1584c1584
<    owesRaw = "the real-data box (Acceptance line 3) — and nothing else; the 👤 sitting is green, 2026-08-25"
---
>    owesRaw = ""
```

which is WO-4.3's, and is the deliverable. **The count is 169, not 141** — the directory has grown
since the work order was booked; the line says to take it from the tree.

### 6. `--self-check` passes with more plants than 35, and the new ones are named in the closing summary — ✅

```
$ node tools/wo-gate.mjs --self-check
ok   | a **Owes** field that names no work order is refused by --audit, holds --tick, and never vanishes between the rows and the tally
ok   | the refusal reads **Owes**'s value and nothing else — a field naming a work order still passes, no field is still skipped, and a prose **Depends on** is untouched
…
  A green run here is not coverage — it is 37 claims about 37 plants.

PASS | 37 of 37 plants were caught.
EXIT=0
```

Baseline before I started: `PASS | 35 of 35 plants were caught`. The closing summary gained a
twelve-line *"And WO-1.29's TWO…"* block naming both.

**How I established each new plant actually bites — this is the part the brief asked me to spell
out.** The two are not provable the same way and saying so is the point.

| Run | Method | Result |
|---|---|---|
| the whole of `wo-gate.mjs` before this work order | `--self-check --against <git show HEAD:tools/wo-gate.mjs>` — nothing in the tree mutated | **1 red of 37**: the zero-id plant, on all ten assertions, quoted under line 1 above. The positive control stays **green** |
| the refusal widened to `**Depends on**` as well — one shared "value parses to zero ids" predicate over both fields | `--against` over a mutated **copy** in the scratchpad | **13 red of 37**. The positive control names two of its three cases; the other twelve are every plant that expects a clean run over a fixture whose `**Depends on** nothing` now parses to zero ids |
| the refusal widened to every `**Owes**` field, however well formed | same method | **6 red of 37**: the positive control on all three cases, plus four plants that tick or audit a healthy field. **The zero-id plant stays green**, which is exactly why the control exists |
| `--audit`'s `if (!wo.owesRaw && !marks.length) continue` deleted | same method | **1 red of 37**: the positive control, on its skipped-work-order case alone. Also the only run in which the floor row is observed firing |

All four rows are written into `tools/README.md`'s mutation table, and the tally there moved 26 → 30
with the "touched nothing else" count 23 → 25.

**Two things about this that I want on the record.** First, **the mutation copies were rebuilt from
the delivered file and every run above re-run after the last edit**, so the numbers quoted are the
delivered plants against the delivered code, not an earlier draft's. Second, `grep -rn MUTATION` over
the repository returns **only prose about the practice** (`CLAUDE.md`, `AGENTS.md`, `CHANGELOG.md`,
`plans/dispatch-retro.md`, `.claude/agents/`) — **no mutation was ever written into a tracked file.**
Every one lived in a scratchpad copy driven through `--against`, and the scratch repository copies
were deleted.

**An intermediate finding worth more than the fix.** The first cut of the positive control's third
case — the `**Depends on**` guard — gave the fixture a prose **Depends on** and *no* `**Owes**` field.
Under the shared-predicate mutation it **caught nothing**, because `--audit` skips a work order with
neither a field nor a marker *before* `rehomesOf()` is ever called on it: the fixture was never read
by the predicate under test. It now carries a well-formed `**Owes**` alongside the prose
**Depends on**, which is what makes the assertion reachable, and the reason is written at the case.
That is this work order's own subject arriving inside its own plant.

### 7. This work order's own header parses with no field of the kind it is about — ✅

`--audit` mentions WO-1.29 exactly once, and it is not in the `**Owes**` section:

```
  —    WO-1.29  **Closes roadmap** quotes no box: Phase 1 → *(no box. Tooling, not app — `wo-gate.mjs` is not a promise…
```

That informational `—` row is drawn identically for WO-1.26, WO-1.27, WO-1.28 and WO-1.30 — every
tooling work order that closes no roadmap box — and it increments no problem counter. `--audit` exits
0. The heading says `Owes` unbolded, and no bold `**Owes**` was written anywhere in the header block;
the gate report on WO-1.29 draws no WO-1.27 NOTE.

### 8. `wo-sweep.mjs` unaffected; `verify-shell.mjs` not touched — ✅

```
$ node tools/wo-sweep.mjs
41 checks · 38 passed · 0 failed · 3 to review
EXIT=0
```

The same three standing REVIEW lines as the baseline run taken before I started (sensitive field
names, due-date/late-missing on one line, the mockup banner) — none of which this work order touches.
The only difference between the baseline and the final output is three reported `:NNN` pointers into
`wo-gate.mjs` and `tools/README.md`, all of which the sweep resolves by text rather than by line.

**`verify-shell.mjs` was not run, and I am saying so rather than quoting a stale run**, which is what
the Acceptance line asks for. This work order touches no file that harness reads — `src/`,
`index.html`, `sw.js`, `manifest.json`, `privacy.html` and `icons/` are byte-identical to HEAD, so
**no `CACHE` bump is owed either**.

### 9. No file's line endings changed — ✅

```
 TESTING.md                                      |  83 ++++++++++
 plans/verification-tooling.md                   |  49 ++++++
 plans/work-orders/README.md                     |   2 +-
 plans/work-orders/phase-1-shell-store-roster.md |  20 +--
 plans/work-orders/phase-4-signals.md            |  14 +-
 tools/README.md                                 |  31 +++-
 tools/wo-gate.mjs                               | 204 +++++++++++++++++++++++-
 7 files changed, 382 insertions(+), 21 deletions(-)
```

No whole-file rewrite: the largest is `tools/wo-gate.mjs` at 204 changed lines of 4,073. Every changed
file re-read for terminators afterwards — `CRLF=0` in all seven. `git config core.autocrlf` is
`false`; there is no `.gitattributes`.

---

## What I could NOT verify, or did not do

- **Nothing needed an iPad or human eyes.** No 👤 line, no 📆 line, no rendering, nothing reaching a
  device. There is no reading here I am deferring.
- **`verify-shell.mjs` was not run.** Deliberate, per Acceptance line 8. I have no result for it and
  am quoting none.
- **The `—` floor row in `--audit` has no live input and no plant of its own.** Spelled out under
  line 3. It is proved by mutation, and I would rather a verifier read that here than discover it.
- **The refusal names the heading line, not the field's own line.** Spelled out under line 1.
- **I did not write the `CHANGELOG.md` entry.** Draft below.
- **I did not change the work order's `Status`.** It is still `🤖 CLAIMED — 2026-09-07`.

## Out-of-scope temptations I declined, recorded rather than acted on

1. **`**Depends on**` — the whole point of the Traps line, and it is genuinely tempting once the
   `owesRaw` predicate is written, because it is four characters away.** I did not touch it, did not
   factor a shared helper, and instead spent a plant case and eleven lines of comment on *why not*.
   The mutation run measures the cost: **13 of 37 plants red**. That is WO-1.30's row and it is
   buildable now.
2. **`--audit`'s `**Owes**` section could name the field's own header line** rather than the heading,
   by finding which line of the block `**Owes**` sits on (`positionalFields()` already computes it).
   That would improve all three of this field's refusals, not just the new one, and it is a change to
   the report shape of two checks this work order does not own. **Proposed follow-up, Size S.**
3. **`wo-sweep.mjs` does not check the self-check plant count** the way it checks the sweep-check
   count (`tools/README.md:10`) and the harness `check()` count (`:1174`). I updated the three plant
   numbers in `tools/README.md` by hand, and nothing in the repository would have noticed if I had
   not — which is `wo-sweep.mjs` § "the recorded sweep-check count" one file over. **Proposed
   follow-up, Size S**, and it is a real hole: WO-1.42 exists because a hand-maintained count in that
   file rotted once already.
4. **`--audit`'s section header still says "`**Owes**` and its `→ WO-x.y` markers, against the boxes
   they name"**, which is now under-describing it — it also checks that a field names something at
   all. Left alone; a section heading is prose the reader parses, and rewording it would have moved a
   string two plants read.

## Decisions the work order did not settle, and which way I went

- **Where in WO-4.3's body the sentence goes.** The Deliverable says *"beside the 📆 line"*; the Traps
  line says the header sentence *"is the only place in the tree that records it"*. **That second
  clause was already false when I arrived** — the **Where this stands** paragraph, three lines below
  the 📆 line, already carried both halves (*"The 👤 sitting was run by the owner on 2026-08-25 and all
  eight readings passed"* and *"Acceptance line 3 wants a fortnight of a real term, ~Sep 16"*). So
  nothing was at risk of being lost. I put the moved sentence **immediately after that paragraph** —
  adjacent to the 📆 line, in body prose no parser reads, quoting the removed field verbatim so the
  header's exact words survive somewhere, and ending with *do not put it back* plus the shape a real
  re-homing would take. I did **not** append it to the 📆 Acceptance line itself: an Acceptance item's
  text is read by `resolveRehome()`'s fragment matcher, and that is the one place in the body prose
  is not inert.
- **One plant or two.** The Deliverable names three behaviours (*caught*, *still passes*, *still
  skipped*) in one sentence. I cut them as **two** plants — the refusal, and a positive control
  carrying all three "must stay silent" cases plus the `**Depends on**` guard — because they are
  proved by different methods and a plant that mixes a defect reproduction with its own controls
  cannot report which half failed. The count rule in `plans/verification-tooling.md` (*"if the plant
  count outruns the behaviour count, something is being tested twice"*) is satisfied: 35 → 37 buys
  two behaviours, the refusal and the row invariant, with the second plant the fence on the first.
- **No fifth `--self-check` fixture.** The Traps line says to check the two existing fixtures before
  adding a third (there are four now). I added **none**: this defect is about what a value *contains*,
  so it is expressed by handing `fixtureBlock()`'s existing `owes` option a prose string. No other
  plant's header changes shape, and the interaction the trap warns about cannot arise. The constant
  is `OWES_PROSE`, with the three characters it must not contain (`WO-`, `·`, `"`) written out at it.

---

## Draft `CHANGELOG.md` entry — for the teacher to accept, reword or discard

> **`wo-gate.mjs` refuses a `**Owes**` field that names no work order, and the audit stops losing a
> row.** The field is the one the tool acts on rather than reports, and WO-4.3 had carried a true
> English sentence in it since August: `--audit` counted the work order, printed no row for it, and
> said `0 problem(s)` — a cross-check that could not fail on the input it was written for, because
> both its loops were handed an empty list. A value with no work-order id is now a refusal, at
> `--audit` and at `--tick`; the audit's section prints a row for every work order it counts, so the
> tally and the rows can never again disagree in silence; and WO-4.3's field is gone, with what it
> said moved into that work order's body beside the 📆 line that now carries the same fact where a
> tool can see it. The refusal is deliberately **not** extended to `**Depends on**`, which is reported
> rather than acted on and legitimately names nothing in about thirty work orders — widening it
> reddens thirteen of the thirty-seven self-check plants, which is the measurement rather than the
> argument.

---

## Commands run, and where the output lives

Everything below was run to completion and its output read. Nothing was backgrounded and written up
before it exited.

| Command | Exit | Output |
|---|---|---|
| `node tools/wo-gate.mjs --audit` (baseline, after, final ×2) | 0 | `audit-before.txt`, `audit-after.txt`, `audit-final.txt`, `audit-final2.txt` |
| `node tools/wo-gate.mjs --audit` over the restored-field copy | 1 | quoted under line 1 |
| `node tools/wo-gate.mjs --tick WO-4.3 --dry-run` over the restored-field copy | 1 | quoted under line 2 |
| `node tools/wo-gate.mjs --self-check` (baseline / final) | 0 / 0 | `35 of 35` → `37 of 37` |
| `node tools/wo-gate.mjs --self-check --against <HEAD>` | 1 | `1 of 37 not caught` |
| `node tools/wo-gate.mjs --self-check --against <3 mutation copies>` | 1 ×3 | `13 / 6 / 1 of 37 not caught` |
| `node tools/wo-gate.mjs WO-4.3`, `WO-4.5`, `WO-1.29` | 0 ×3 | before/after pairs diffed |
| `node tools/wo-sweep.mjs` (baseline / final) | 0 / 0 | `41 checks · 38 passed · 0 failed · 3 to review` |
| the field dump, before and after | 0 | 169 work orders each; diff quoted under line 5 |
| `git diff --stat`, per-file CRLF count, `git config core.autocrlf` | — | quoted under line 9 |
| `grep -rn MUTATION` | — | prose only; no tracked file carries one |

Scratchpad:
`C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\1c1553c6-1119-496d-b34f-683e46ba27c9\scratchpad`.
The two scratch repository copies (`repo3`, `repo-tick`) were deleted after use; the mutation copies,
the dump script and the captured outputs remain there.
