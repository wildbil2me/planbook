# WO-1.30 — implementer's result

**Route** Claude (work-order-implementer), Opus · **Date** 2026-09-07
**Work order** `plans/work-orders/phase-1-shell-store-roster.md` § WO-1.30
**Status left as found:** `🤖 CLAIMED — 2026-09-07`. I did not run `--start`, `--handoff` or `--tick`.

---

## The short version

Both arms are in, the sentinel arm first and measured green over all 41 no-dependency work orders
**before** the refusal existed. `--self-check` is **37 → 39**, one plant per arm, both proved
non-vacuous by mutation over copies in the scratchpad — **nothing in the tree was mutated at any
point**, and `git diff` adds the word `MUTATION` to this repository in exactly zero places (the one
occurrence in the diff is a sentence in `TESTING.md` describing this check). WO-G4's field names a
work order and its gate now refuses it on `WO-8.1 is ⬜ NOT STARTED, not ✅ DONE`.

All five Acceptance boxes are ticked in the phase file. There is no 👤 and no 📆 line on this work
order, and nothing here renders or reaches a device.

Everything below that names a command result is quoted from output I read after the command exited.

---

## Against the Acceptance list, one by one

### 1. A `Depends on` with no `WO-` id and a clause that is not a sentinel is a **problem**, not a note — the gate report refuses it. ✅

**Verified against the live reproduction, before repairing it.** With the refusal arm in and WO-G4's
field untouched, `node tools/wo-gate.mjs WO-G4` printed:

```
  depends (prose) every work order
...
FAIL | **Depends on** names no work order, and its value is not one of this directory's
       no-dependency markers: every work order. No id parses out of it, so the dependency walk
       has nothing to check — and zero dependencies is indistinguishable from every dependency
       satisfied, which is this gate clearing on a clause that may mean the opposite. …
EXIT=1
```

**And the defect itself was reproduced and read, not assumed.** I rebuilt the pre-change state
outside the repository — `git show HEAD:tools/wo-gate.mjs` plus `git show HEAD:plans/…/gates.md` into
a scratch directory, so the old script resolved its own `REPO` to that copy — and ran it:

```
  depends (prose) every work order
NOTE | "Depends on" carries a non-work-order clause — read it yourself: every work order
PASS | gates clear for WO-G4
EXIT=0
```

That is the note-beside-a-PASS in as many words, on the last gate of the project.

**Standing guard:** the plant *"the refusal arm — a **Depends on** with no id and no marker is a
problem, while ids beside prose still gate on the ids and still draw the NOTE"*. Proved non-vacuous
by setting `unresolvedClause: false` in a scratchpad copy and running `--self-check --against`:
**1 red of 39**, on the two assertions that are the defect verbatim (*"the gate exited 0 …"*, *"the
refusal is not a FAIL …"*), nothing else moving.

### 2. `—`, `-`, `–`, `none`, `nothing`, `nothing — <any reason>` raise neither a problem nor the prose `NOTE`; all forty-one report as today minus the note. ✅

**Re-measured from the tree on the build day**, as the work order insists, by running the gate report
for every id `--list` returns (169) and classifying each report's `depends` lines — the parser
answering, not a grep:

| Shape | count | was reporting |
|---|---|---|
| real `WO-` ids | **127** | resolved, correct |
| `—` | **21** | `NOTE`, wrongly |
| `nothing` | **15** | silent, correct |
| `nothing` + a reason | **5** | `NOTE`, wrongly |
| a clause naming a real constraint | **1** (WO-G4) | `NOTE` + `PASS` — the defect |

The work order's 2026-09-07 column is **unmoved**. Sentinel set = 21 + 15 + 5 = **41**. The five
reason-carrying ones are WO-2.19, WO-2.20, WO-2.37, WO-3.10 and WO-8.7 — and note **WO-8.7's is
`nothing but a decision`, not `nothing —`**, which is why the test is a *prefix* on `nothing` rather
than an em-dash rule.

**Order of operations honoured.** The sentinel arm was written and landed alone; I captured all 169
gate reports against the pre-change script (via `git stash push tools/wo-gate.mjs`, then popped), and
diffed. With only the sentinel arm live: **26 changed, 143 identical, and no report gained a FAIL.**
The refusal arm went in after that.

**Final before/after over all 169** (both arms + the WO-G4 repair): **27 changed, 142
byte-identical.** The 27 are the 26 markers and WO-G4. Each of the 26 loses its `depends (prose) …`
line and its `NOTE`, and prints the `depends nothing` the 15 bare `nothing` rows already printed.
**No other work order's report moved by a character.**

**Standing guard:** the plant *"the sentinel arm — …"*, which loops eight values through one fixture
(`—`, `-`, `–`, `none`, `NONE`, `nothing`, WO-3.10's own value, WO-8.7's own value) and asserts, for
each, `depends nothing`, no prose NOTE, no refusal, exit 0. Proved non-vacuous twice:

- the naive fix — `unresolvedClause: !ids.length && !!raw.trim()`, i.e. *zero ids plus prose is a
  refusal* — → **5 red of 39**: this plant on all eight values, plus four others whose fixtures write
  `nothing` in that field. This is the mutation that matters most of the two.
- the `nothing` prefix narrowed back to the whole-value `/^nothing$/i` it replaced → **2 red**, on the
  two `nothing <reason>` values only. That is the arm WO-2.19, WO-2.20, WO-2.37, WO-3.10 and WO-8.7
  rest on.

### 3. `WO-G4`'s field names a work order, and its gate refuses it for a reason a reader can check. ✅

The field now reads `**Depends on** WO-8.1 — which stands for every work order here: it is the
regression gate, its own field names the last work order of the span it checks, and there is no 1.0.0
call over a checklist nobody has run`. The report:

```
  depends WO-8.1   ⬜ NOT STARTED   <-- not done
  depends (prose) WO-8.1 — which stands for every work order here: …
NOTE | "Depends on" carries a non-work-order clause — read it yourself: …
FAIL | dependency WO-8.1 is ⬜ NOT STARTED, not ✅ DONE
EXIT=1
```

A dated italic note under WO-G4 records what the field said, that it cleared its own gate, that
WO-8.1 is a **stand-in** and the criteria table below is the actual list, and why a written-out list
was refused (WO-1.24's own argument — it rots at the next booking). **The value names exactly one
`WO-` token on purpose**: an earlier draft mentioned WO-7.3 in the clause, which `depsOf()` would have
read as a second dependency nobody typed.

I also repaired a sentence WO-G3's note carried that this landing made false — *"**WO-8.1 and WO-G4
still carry it** — `every phase` and `every work order`"* — now dated and pointing at both repairs.

### 4. A `Depends on` carrying **both** ids and prose still raises the `NOTE` and still gates on the ids. ✅

**20 work orders carry that shape** (WO-1.11, WO-1.12, WO-1.30, WO-1.36, WO-1.37, WO-1.40, WO-1.42,
WO-1.43, WO-1.45, WO-1.46, WO-2.21, WO-2.22, WO-2.24, WO-2.25, WO-3.18, WO-7.1, WO-7.3, WO-8.1,
WO-8.12, WO-G3) and **all 20 are in the byte-identical 142** — none appears in the changed set.
WO-G4 is now the twenty-first, and WO-1.30's own header is one of them (`WO-1.27 — landed, and it
rewrote…`: `PASS | gates clear for WO-1.30`, with the NOTE, exactly as before).

The refusal plant's case 2 asserts all three halves at once on a fixture: the id is walked
(`depends WO-9.7`), the prose NOTE still prints, the refusal does not fire, and the `FAIL` is
`WO-9.7 is ⬜ NOT STARTED` — the id's refusal, not the clause's. Case 3 adds the commonest shape of
all, a bare id, read off the second fixture's report.

### 5. `--audit` and `--self-check` both pass, and `--self-check` gains a plant per arm. ✅

- `node tools/wo-gate.mjs --audit` → exit **0**, and its output is **byte-identical** to the
  pre-change run (`diff` empty). It does not read this field at all — see the follow-up below.
- `node tools/wo-gate.mjs --self-check` → exit **0**, `39 plants, 39 caught, 0 missed` /
  `PASS | 39 of 39 plants were caught`. Both new plants print `ok`, and both are named in the closing
  summary in a paragraph of their own (*"And WO-1.30's TWO, one per ARM of the field one over …"*),
  which also names what they do **not** cover.
- Also run and green: `node tools/wo-sweep.mjs` → exit **0**, `41 checks · 38 passed · 0 failed ·
  3 to review`, and its verdict list is **identical line for line** to the baseline run (the same
  three standing REVIEWs: sensitive field names, due-date/late-missing, the mockup banner).
- `node tools/verify-shell.mjs` → exit **0**, `1334 checks · 1334 passed · 0 failed · 0 skipped`,
  `41,335 lines · 31.0 lines per check · 436s`. Run twice, before and after, identical. *(It was not
  owed one: it reads `src/`, `index.html`, `sw.js`, the stylesheets and its own harness files under
  `tools/`, and none of the seven files I changed is among them. It was run anyway, in the
  background, and I waited for both exits before writing this.)*

**Mutation rounds, and where they happened.** Four mutations, all applied to **copies in the
scratchpad** and driven with `--self-check --against`; the repository was never edited to hold one, so
there was nothing to revert:

| mutation | result |
|---|---|
| sentinel arm dropped (the naive fix) | **5 red of 39** |
| refusal arm never firing (`unresolvedClause: false`) | **1 red** |
| `nothing` prefix → whole-value `/^nothing$/i` | **2 red** |
| WO-1.29's shared "zero ids over both fields" predicate, **re-measured** | **12 red of 39**, where the same mutation read 13 of 37 before this landed |

All four are rows in `tools/README.md`'s mutation table. The last one is worth reading: the two new
plants are **not** among its twelve, because that mutation lives in `rehomesOf()` on the `--tick` and
`--audit` paths while these two read gate reports. The Traps' claim survives the re-measure at very
nearly the same number.

---

## Files changed

- `tools/wo-gate.mjs` — `NO_DEPENDENCY_MARKS` + `noDependencies()` above `depsOf()`; `depsOf()`
  returns `unresolvedClause` and computes `hasProse` off the same predicate; `gate()`'s dependency
  section gains the refusal arm; two new plants; two existing plants rebased (below); the
  `--self-check` closing summary and its coverage note.
- `plans/work-orders/gates.md` — WO-G4's `Depends on` + a dated note; WO-G3's now-false sentence.
- `plans/work-orders/phase-1-shell-store-roster.md` — WO-1.30's five Acceptance boxes ticked with
  their evidence; three dated notes (the reproduction now closed, the third re-measure, the spent
  line-number citation in Traps). **Status glyph untouched.**
- `plans/work-orders/README.md` — § "Header fields", the **Depends on** row: the six markers, the
  refusal, and *name the work order the clause stands for and keep the clause*.
- `tools/README.md` — `thirty-seven` → `thirty-nine`, `37 of 37` → `39 of 39`, a WO-1.30 paragraph in
  the `--self-check` section (including the two moved plants), four mutation-table rows.
- `plans/verification-tooling.md` — a new scar section, *"The permissive answer, and why the sentinels
  go in first"*.
- `TESTING.md` — § WO-1.30, in the shape WO-1.29's section set, with the reproduction quoted.

`git diff --stat`: 7 files, ~390 insertions / ~41 deletions, the largest being 210 changed lines of
`tools/wo-gate.mjs`'s 4,240 — new code, not a rewrite. **No line endings changed**: all seven files
are pure LF at the byte level (`crlf 0`), as they were.

`CHANGELOG.md` untouched, per the rule — a draft entry is at the foot of this file.

---

## Decisions the work order did not settle, and which way I went

1. **WO-G4's stand-in id is WO-8.1.** The alternatives were WO-G3 (the last ship gate) and a
   written-out list. WO-8.1 is the one work order whose own first Acceptance line is *every acceptance
   line from WO-1.1 through WO-7.3 appears in `TESTING.md`*, its own field already names WO-7.3 on
   exactly this argument, and it is the criterion WO-G4's table calls *Manual checklist passing*. It
   will not rot: a work order booked next month lands in `TESTING.md`, which is WO-8.1's subject.
   **It is a stand-in and the note says so** — WO-G4's criteria include rows WO-8.1 does not gate
   (onboarding, the README), and the criteria table remains the actual list.
2. **A sentinel value now reports `depends nothing` and the clause is no longer echoed.** The other
   reading of *"report exactly as they do today, minus the note"* is to keep the `depends (prose) …`
   line and drop only the `NOTE`. I went the other way: all 41 now report identically, and the 15
   bare `nothing` rows have printed `depends nothing` since the check was written, so this makes the
   set consistent rather than inventing a third shape. The reason a work order gives for depending on
   nothing is still in its header, where a reader is.
3. **The refusal lives in `gate()` only.** `--tick` and `--audit` are untouched: neither reads
   dependencies today (`--tick` never has), and WO-1.29's field is *acted on* where this one is
   *reported*. Consequence to know: a work order carrying this defect can still be `--tick`ed. See
   follow-up 2.
4. **Two existing plants moved, both forced by the new behaviour, both keeping their subject.** This
   is the thing to check me hardest on, so it is stated plainly:
   - WO-1.29's positive control, case 3, wrote `a phase this fixture waits on, written in prose and
     naming no id` and asserted **the gate cleared over it**. WO-1.30 makes that assertion false by
     design. Its value is now `nothing — a reason this fixture writes down, the way five real work
     orders do`, and the assertion is now `depends nothing` and exit 0. **What it guards is
     unchanged** — the value still parses to zero ids, so the shared-predicate mutation still turns
     it red (confirmed: it is red under mutation 4 and under mutations 1 and 3).
   - WO-1.27's bold-prose plant read its value off the report's `depends (prose) …` echo while its
     fixture wrote the default `nothing` in that field; once `nothing` is a marker, the echo is gone.
     Its fixture now writes `WO-9.7` ahead of the bold, which is **WO-1.11's real shape** (`WO-1.5
     **Not a go-live blocker.** Added 2026-08-04 …`) rather than a simplification of it. Both halves
     of that plant still bite — its `**Closes roadmap**`-cut-off half is untouched.
5. **`NONE` is in the plant's value list** to pin the sentinel comparison as case-insensitive, which
   the work order names (`none`) without saying which case.
6. **This work order has no Deliverables or Out-of-scope section** (unlike WO-1.29 next door), so I
   treated the five Acceptance lines plus the Traps as the whole of the spec and confined the change
   to the one field and the one function. Nothing was widened.

---

## Proposed follow-ups — not done, deliberately

1. **`--audit` has no `**Depends on**` section, and this refusal therefore fires one gate report at a
   time.** WO-1.29's field gets a standing directory-wide sweep; this one does not, so a new work
   order booked with `**Depends on** every phase` is caught only when somebody runs its gate. It also
   costs the refusal plant the whole-tree control WO-1.29's plant has — the nearest I could get was a
   second fixture's report, and the comment there says so. A short `--audit` section counting the
   field's shapes and refusing the unresolvable ones is the obvious next row. **Not in this work
   order's Acceptance, which says *the gate report refuses it* three times.**
2. **`--tick` does not read dependencies at all.** Not a gap this work order created, and widening it
   is a design question (should a tick refuse a work order whose dependencies never resolved?) rather
   than a fix. Named here rather than answered.
3. **A whole-run grep for a refusal's wording is unsafe when the wording is a work-order title.** My
   first cut of the refusal plant's case 3 grepped `--list` output for *"names no work order"* and
   went red on **WO-1.30's own title**. Worth remembering before writing another wording assertion
   over a directory-wide command; it is written into the plant's comment.
4. **The em-dash sentinel is now load-bearing in two fields** (`Ship` uses it too) and is documented
   in § "Header fields" for both — but only `Depends on` enforces it. Nothing to do today; a note for
   whoever next writes a check over `Ship`.

---

## What I could not verify

- **Nothing needed a real iPad or human eyes.** No 👤 line, no 📆 line, no rendering, no device: this
  work order changes one tool under `tools/` and prose. I ticked nothing that a person has to see.
- **The refusal has no live input left in the tree** — WO-G4 was the only one and it is repaired — so
  the standing evidence for arm two is the plant and the mutation, not the directory. That is the
  intended state and it is written down at the code, in `TESTING.md`, and above.
- Everything else I ticked, I ran and read: the outputs quoted here come from commands that exited
  before I quoted them, including both 436-second `verify-shell.mjs` runs.

---

## Draft `CHANGELOG.md` entry — the teacher's to accept, reword or drop

> **Fixed** — a work order whose `Depends on` names no work order no longer clears its own gate.
> `wo-gate.mjs` now knows the six ways this directory writes *no dependencies* — `—`, `-`, `–`,
> `none`, `nothing`, and `nothing` with a reason after it — and reports all 41 of them as depending on
> nothing, without the spurious note 26 of them had been drawing since the check was written. A value
> that is none of those and holds no `WO-` id is refused outright, because zero dependencies was
> indistinguishable from every dependency satisfied: WO-G4, the 1.0.0 call, read `every work order`
> and passed its own gate with a footnote beside it. Its field now names WO-8.1 and keeps the clause.
> `--self-check` is at 39 plants, one per arm.
