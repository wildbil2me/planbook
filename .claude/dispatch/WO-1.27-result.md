# WO-1.27 — implementer's result

**Work order** `plans/work-orders/phase-1-shell-store-roster.md` § WO-1.27
**Route** Claude (work-order-implementer), Opus
**Date** 2026-09-06

**All seven Acceptance lines are ticked, and one of them cost a document repair I want read before
the rest of this file.** There is no 👤 line and no 📆 line on this work order, so nothing here is
deferred to hardware or to the calendar.

---

## The one thing that is not in the work order

**The tree was not clean.** The work order says so in bold — *"The blank line is repaired and the
tree is clean — do not go looking for a live reproduction"* — and it is true of the **shape** it
names (WO-6.3's, repaired 2026-08-25) and not of the **class**.

`plans/work-orders/phase-2-attendance.md`, WO-2.52's header block, carried this:

```
**Closes roadmap** Phase 2 → *(no box. Owner-asked 2026-08-19, out of the screen the two rows above it
left behind.)* **Takes from WO-2.51** its *nothing switches by itself* ruling, reversed with the owner
in the same sitting — see **Deliverables** § the jump.
```

`**Takes from WO-2.51**` is a **real field** — § "Header fields" has a row for it — written
mid-sentence, where the position rule does not read it as one. The old parser terminated
**Closes roadmap** on it by *name*, wherever it sat. The new parser does not, because the
Deliverables say in as many words that *"a field-shaped token anywhere else is prose and belongs to
whatever value it sits inside."* So on the first run of the before/after dump, **exactly one work
order's parse moved**, and it was this one:

```
1258c1258
<    Closes roadmap  |Phase 2 → *(no box. Owner-asked … left behind.)*|
---
>    Closes roadmap  |Phase 2 → *(no box. Owner-asked … left behind.)* **Takes from WO-2.51** its
                      *nothing switches by itself* ruling, reversed with the owner in the same
                      sitting — see **Deliverables** § the jump.|
```

**Three ways out, and I took the third.**

1. Keep the old *value-end* rule (terminate on any known field **name**, wherever it sits) and fix
   only where a value *starts*. That makes Acceptance 3 pass with no document touched — and it
   contradicts the Deliverable sentence quoted above, leaving half the rule still keyed to a name
   instead of a position. Rejected: it is the same two-readers-one-rule shape the work order exists
   to end.
2. Ship the changed value and report it. Rejected: Acceptance 3 says *unchanged*, and a verifier
   reading cold would be right to fail one diff line.
3. **Repair the document** — move the field to the start of a line, which is exactly what the new
   NOTE tells a human to do and what § "Header fields" already says (*"Write a new field at the start
   of a line"*). The rendered markdown is unchanged (a single newline inside a paragraph), and the
   parse is byte-identical either side of it.

The repair is three lines in `phase-2-attendance.md` and nothing else; I did **not** add a note
inside WO-2.52's header block, because prose in a header block is what caused this in the first
place. The record is here, in `TESTING.md` § WO-1.27, and in the § "Header fields" paragraph.

**Full disclosure on the evidence, because this makes the headline diff a comparison of two things
at once.** Three dumps were taken, all kept in the scratchpad:

| dump | parser | tree | result |
|---|---|---|---|
| `fields-before.txt` | pre-WO-1.27 | as handed to me | the baseline |
| `fields-mid3.txt` | new | as handed to me | **one** work order differs: WO-2.52, above |
| `fields-final.txt` | new | as delivered | **identical to the baseline, all 169** |

**Scope call, named because the work order did not settle it.** Repairing WO-2.52 is a document edit
in a work order this one does not name. I judged it inside the fence: the scope fence forbids adding
a header field, changing `KNOWN_FIELDS`, and re-touching WO-6.3, and this is none of those — it is
the tree being brought into line with a rule the README already stated, by the mechanism this work
order builds. If the verifier disagrees, the alternative is option 1 above and it is a parser change,
not a smaller one.

---

## Against the Acceptance list, one by one

### 1. `` here under WO-6.2's `**Owes**`.)* `` yields no `Owes` value, and a plant fails if that regresses — ✅

`--self-check` plant, first of four:
*"a field name written in prose is not read as a field, and the report names the line it sits on"*.
It plants WO-6.3's shape into the fixture's header block via the new `trailer` option — an italic
note running straight on into the paragraph with no blank line, ending in the field name inside
backticks — and asserts four things about the gate report: **no `owes` line at all**, nothing
matching the tail of the note, the NOTE is drawn, and **the NOTE names the file and line the token
is on**, computed by the plant from the sandbox file rather than hard-coded.

**Proved non-vacuous against the previous script itself**, which is the defect and not a model of it:

```
$ node tools/wo-gate.mjs --self-check --against <git show HEAD:tools/wo-gate.mjs>
FAIL | a field name written in prose is not read as a field, and the report names the line it sits on
     | the report printed "owes    `.)*   0 re-homed line(s) resolving" over a header block whose only
     |   **Owes** is inside backticks in an italic note — this is WO-6.3's phantom, which surfaced on
     |   two other work orders
     | the tail of the italic note was printed as a field value
     | no NOTE was drawn for a field-shaped token sitting where a field is not written
     | the NOTE did not name phase-3-gradebook.md:2313, the line the token is on — a note that cannot
     |   say where is what let WO-6.3's run for a week
FAIL | 1 of 35 plants were not caught.
```

`owes    ` `` `.)* `` is the phantom the work order describes, reproduced verbatim. The other 34
plants stay green under that subject, which is the plant doing its job rather than a broad failure.

### 2. WO-1.13's **Closes roadmap** and WO-1.11's **Depends on** parse byte-identically — ✅

Read out of `parseFile()` itself, both builds, quoted whole:

**WO-1.13 `Closes roadmap` — before:**
```
Phase 1 → *(no roadmap line; this closes a gap the roadmap assumed closed — see **Why it exists** below. The quotation marks came off that reference on 2026-08-08: the sweep reads anything in double quotes on this line as a roadmap fragment, and this one matched no box.)*
```
**after:** identical, character for character.

**WO-1.11 `Depends on` — before:**
```
WO-1.5 **Not a go-live blocker.** Added 2026-08-04, out of WO-1.5's verification.
```
**after:** identical, character for character.

Both are also inside the 169-work-order diff on line 3 below, so neither rests on a spot check.

### 3. `--audit` passes, and every work order's nine parsed fields are unchanged across all 139 — ✅ *(169 today)*

```
$ node tools/wo-gate.mjs --audit
PASS | every fragment matches exactly one roadmap box, every **Owes** pointer lands on an open box,
       every uncounted box has a struck or deferred work order behind it, § The files names what its
       files hold, and every dashboard row matches its own boxes.
EXIT=0
```
and the **whole output is byte-identical** to the baseline captured before I touched the parser —
`diff audit-before.txt audit-after.txt` is empty.

The dump: a scratchpad script slices each build of `wo-gate.mjs` at its `main` marker, imports it,
and calls its own `parseFile()` over every `.md` in `plans/work-orders/` except `README.md` and
`ROUTING.md`. It prints `Ship`, `Status`, `statusRaw`, `Size`, `Depends on`, `Owes`, `Blocks`,
`Target`, `Closes roadmap`, `Amends roadmap` and `unknownFields` for each.

```
$ diff <(grep -v "^== " fields-before.txt) <(grep -v "^== " fields-final.txt)
IDENTICAL: all 169 work orders, all field values
```

**The count is 169, not 139** — the directory has grown since the work order was booked on
2026-08-25. The dump covers all of them, which is a superset of what the line asks for. *(The `^== `
lines are the id-and-heading-line headers, filtered out of the compare because the WO-2.52 repair
adds one line to `phase-2-attendance.md` and shifts WO-2.53's and WO-2.54's heading line numbers by
one. Nothing else in either dump moves; the unfiltered diff is exactly those two lines.)*

**One intermediate finding worth the record.** The first cut of the new parse differed on **two**
work orders, not one. The second was WO-3.18, whose **Depends on** wraps onto a third line ending
`… goes in the form ·` with `**Blocks**` opening the line below. The old lookahead's `\s*·?\s*` ate
that separator across the line break; `FIELD_TOKEN` matches the next field on `^` and leaves the `·`
behind on the line above. `fieldValues()` now drops one trailing `·`, and **only when a next field
exists** — the last field in a block keeps whatever is there, which is what the old lazy match ran to
`$` and did. That is a fidelity fix, not a new rule, and it is written out at the line.

### 4. `--self-check` passes with more plants, and the new ones are named in the closing summary — ✅

```
$ node tools/wo-gate.mjs --self-check
...
  And WO-1.27's FOUR, the first here about WHERE a field is written rather than what
  it says: a field name in prose — WO-6.3's italic note running on into the header
  block, ending in `**Owes**` inside backticks — yields no **Owes** value and draws a
  NOTE naming its line, where it used to be captured as one and printed on two other
  work orders; bold prose inside a value stays in the value, from both sides at once —
  a header line OPENING with bold that is not field-shaped, and field-shaped bold
  MID-value ahead of the quoted fragment, which an over-tightened parse cuts off into
  a silent "no roadmap box to tick" — and no NOTE fires on either, because prose that
  names no field this script reads must draw nothing; a **Takes from WO-x.y** field
  parses, id and all, and ends the field before it; and the four fields that share one
  line after a `·` — **Status**, **Size**, **Depends on**, **Owes** — all parse, which
  is the normal case a line-start-only rule loses silently.
...
  A green run here is not coverage — it is 35 claims about 35 plants.

PASS | 35 of 35 plants were caught.
EXIT=0
```

**31 → 35.** *(The work order says the count stands at 18; that was true when it was booked on
2026-08-25 — WO-1.35 and WO-1.38 have added seven since.)*

The four brought no new fixture, only three new **shapes** for the one there is: `afterStatus`,
`closesProse` and `trailer` on `fixtureBlock()`, each lifted from a real header block in
`plans/work-orders/` with the ids changed. They are inserted **before** WO-1.38's four rather than at
the end, for the reason WO-1.38's own comment gives: those write a `<WO>-result.md` into the
sandbox's `.claude/dispatch/`, which `reset()` does not clear, and three of my four read a gate
report line by line.

**All four proved able to fail.** Every mutation was applied to a **copy in the scratchpad** and
driven with `--against`, so **nothing in the tree was ever mutated** and there is nothing to revert.
I inserted no `MUTATION` comment anywhere; `grep -rn MUTATION tools/ src/ plans/` returns only
pre-existing prose in `tools/README.md` and two harness files, none of it mine.

| mutation of `FIELD_TOKEN` | plants red |
|---|---|
| — (the pre-WO-1.27 script, `git show HEAD:`) | **1 of 35** — the prose-field plant, on all four assertions |
| position prefix deleted (any bold terminates a value) | **2 of 35** — the prose-field plant, and the bold-prose plant on *"the **Closes roadmap** fragment was cut off by the field-shaped bold written ahead of it — --tick found no box to tick"* |
| `WO-` id clause deleted ("no digits in a field name") | **1 of 35** — the `**Takes from WO-x.y**` plant, on both arms: the field is swallowed into **Depends on**, whose id then becomes *"depends WO-9.7   ⬜ NOT STARTED   <-- not done"* |
| position prefix narrowed to `^` (line-start only) | **33 of 35** — including the plant aimed at it, which names the three fields it can see: `ship    —   size —`, `status  (none)`, `owes    (no **Owes** field)` |

All four rows are now in `tools/README.md`'s mutation table, with its running tally corrected
22 → 26.

### 5. A non-positional field-shaped token draws a NOTE naming the line, and no work order draws one today — ✅

The NOTE, on the gate report, beside the existing "field nothing reads" note:

```
NOTE | **Owes** sits in WO-9.9's header block at plans\work-orders\phase-3-gradebook.md:2313 but not
       where a field is written — it neither starts the line nor follows a "·". It is read as prose
       inside the value around it and no **Owes** value comes of it, which is deliberate; this is a
       NOTE because prose in a header block may legitimately name a field. If it was meant AS a
       field, put it at the start of a line (plans/work-orders/README.md § "Header fields")
```

The census, run over the delivered tree:

```
$ node tools/wo-gate.mjs --list  → 169 ids → node tools/wo-gate.mjs <id> for each
$ grep -c "but not where a field is written" allgates-final.txt
0
```

*(That `grep -c` exits 1 on a zero count. The number printed is the result; the exit status is the
known `grep -c` trap and not a failed command.)*

**It took the WO-2.52 repair to make that zero** — before it, WO-2.52 drew one, correctly.

**A decision the work order left open: how wide the NOTE should be.** A NOTE on *every*
field-shaped token that is not positional fires on **four** work orders in today's tree, and three of
them are innocent prose — WO-1.13's *see **Why it exists** below*, WO-2.53's
*see **Why it exists** § the seventh control*, and WO-3.25's `` `ROADMAP.md`'s **Score entry grid**
line ``. That version cannot satisfy this Acceptance line, and it is the wrong control anyway:
*"a control that goes red for a reason the reader learns to dismiss is worse than no control"*
(WO-1.12). So the NOTE is narrowed to names **something reads** — `KNOWN_FIELDS` plus the block's own
positional fields — which is exactly the class that could have been mis-read. **The honest limit:** a
field-shaped token whose name nothing reads is still invisible, and stops being safely invisible the
day a name is added to `KNOWN_FIELDS` without its § "Header fields" row. Written out at the function.

`--audit` gains nothing from this, per the work order's Out of scope line. The note lives on the gate
report only.

### 6. `verify-shell.mjs` and `wo-sweep.mjs` are unaffected — ✅

```
$ node tools/verify-shell.mjs
================ SUMMARY ================
1299 checks · 1299 passed · 0 failed · 0 skipped
40,199 lines · 30.9 lines per check · 433s
EXIT=0
```
It ran to completion here — 433 seconds, backgrounded, and I waited for the exit before writing this
line rather than predicting it. *(It usually cannot run in a sandboxed agent; this environment can,
and per `CLAUDE.md` that is a green run and still closes no 👤 item. There are none on this work
order.)*

```
$ node tools/wo-sweep.mjs
41 checks · 38 passed · 0 failed · 3 to review
EXIT=0
```
The three REVIEW lines are the standing ones — sensitive field names, due-date/late-missing, the
mockup banner — the same three `TESTING.md` § WO-1.44 records, and none of them touches this work
order.

Neither tool reads `wo-gate.mjs`. Both were run because "unaffected" is a claim to measure.

### 7. No file's line endings changed — ✅

```
$ git diff --stat
 TESTING.md                                      |  80 +++++++
 plans/verification-tooling.md                   |  56 +++++
 plans/work-orders/README.md                     |  14 ++
 plans/work-orders/phase-1-shell-store-roster.md |  42 +++-
 plans/work-orders/phase-2-attendance.md         |   5 +-
 tools/README.md                                 |  28 ++-
 tools/wo-gate.mjs                               | 297 ++++++++++++++++++++++--
 7 files changed, 482 insertions(+), 40 deletions(-)
```

No whole-file rewrite: the largest single figure is `tools/wo-gate.mjs` at 297 changed lines of
3,873, and that is new code. Every changed file was re-read for terminators afterwards — **`CRLF=0`
in all seven**, as before. `git config core.autocrlf` is `false` and there is no `.gitattributes`.

*(One near miss worth recording, since it is the same family as WO-3.25's scar. My first edit helper
used `String.replace(needle, replacementString)`, and one replacement fragment contained a `` $` ``
sequence — this repository's prose is full of backticks next to code. `replace()` expanded it and
spliced the whole prefix of `wo-gate.mjs` into the middle of itself. Caught by `node --check` on the
next command, reverted with `git checkout --`, all edits reapplied through a **function**
replacement, and the helper now carries a comment saying why. Nothing of it survives in the tree —
`git diff` was clean at the moment of the revert except for the pre-existing `--start` claim.)*

---

## What is on disk

| file | what changed |
|---|---|
| `tools/wo-gate.mjs` | `positionalFields()` — the position rule, once, with offsets. `fieldsIn()` reads it. New `fieldValues()` reads it and replaces `fieldRe()`/`field()` entirely. New `strayFieldTokens()` reads it and feeds a new `strayFields` on every parsed work order, which `gate()` turns into a NOTE. `fixtureBlock()` gains `afterStatus`, `closesProse`, `trailer`. Four new plants and the closing summary. |
| `plans/work-orders/phase-2-attendance.md` | WO-2.52's `**Takes from WO-2.51**` moved to the start of a line — the repair described at the top of this file. Three lines. |
| `plans/work-orders/phase-1-shell-store-roster.md` | WO-1.27's seven Acceptance boxes ticked, each with the evidence in an italic note. Status left at 🤖 CLAIMED for the orchestrator's `--handoff`. |
| `plans/work-orders/README.md` | § "Header fields" gains the paragraph saying the rule is enforced in both halves, what the one-sided version cost, and that a stray token draws a NOTE and not a refusal. |
| `plans/verification-tooling.md` | New § *"The other half of that rule, and what half an implementation costs"*, closing the pointer WO-1.28's section already made to this work order. |
| `tools/README.md` | Plant count 31 → 35 with a paragraph on what the four cover and why they are not last; four rows in the mutation table; tally 22 → 26. |
| `TESTING.md` | New § WO-1.27 in the Phase 1 block, between WO-1.26 and WO-1.40. |

`src/`, `index.html`, `sw.js`, `privacy.html`, `manifest.json` and `icons/` are untouched — **no
`CACHE` bump is owed.**

---

## Not done, and why

- **No `CHANGELOG.md` entry.** That is the teacher's. A draft, if it helps:
  > **Fixed** — `wo-gate.mjs` read a field name written in prose as a field. The rule that a header
  > field is recognised by *where it sits* was enforced when naming fields and not when reading their
  > values, so an italic note that ran on into a header block could put a phantom **Owes** on a work
  > order that never had one — and print it on two others. Both readers now share one predicate, and
  > a field-shaped token written where a field is not written draws a note naming its line. One live
  > instance was found and repaired in WO-2.52's header block.
- **Status line untouched.** It reads 🤖 CLAIMED. `--handoff` is the orchestrator's step and `--tick`
  is the verifier's.
- **No third harness.** The before/after dump is a scratchpad script, not a tool in `tools/` — it is
  a one-time proof, and the standing guard is the four plants. Naming that plainly: **the dump does
  not re-run**, and nothing in the repository will notice if a future change moves a parsed value.
  A standing version would want a checked-in golden file, which is a different work order and a
  new thing to maintain; I did not open it.

## Temptations declined, noted rather than acted on

- **`upToDot()` looks redundant and is not.** `Ship`, `Status` and `Size` still cut at the first `·`
  rather than taking their whole positional span, because WO-1.13's line reads `**Size** M · 🚩 ·`
  and its **Size** is `M`. Deleting it as "the position rule already handles this" changes that
  work order's `Size` to `M · 🚩 ·`. There is a comment at the line.
- **`--audit` could report stray field tokens across the directory in one pass**, which would be
  cheaper to read than 169 gate reports. Out of scope by the work order's own Out of scope line —
  and worth a row if the note ever fires on something nobody is reading a gate report for.
- **`wo-brief.mjs` has not been checked for the same defect.** The work order names `wo-gate.mjs` and
  I stayed there. If `wo-brief.mjs` parses header fields with its own regex, it has the same bug
  today. I did not read it, so this is a flag and not a finding.
- **The § "Header fields" table row for `**Takes from WO-x.y**`** still says only *"Prose. Nothing
  reads it"*, which is true and now slightly incomplete — it is read far enough to end the field
  before it. Left alone: the paragraph under the table says it, and the row is the summary.
