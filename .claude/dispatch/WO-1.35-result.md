# WO-1.35 — a ride-along row rises to the top when the rows above it clear · implementation result

**Route** Claude (work-order-implementer) · **Date** 2026-08-28
**Verdict from the implementer's side:** built, six of seven Acceptance lines closed. **Line 5 is half
met and half unmeetable as written** — see § "The one line I could not close" below, which is the
first thing to read.

---

## 1. The before-state, taken before anything was edited

`node tools/wo-gate.mjs next` on the tree as handed over:

```
skipped WO-4.3 — Praise signals
  🔨 IN PROGRESS: part-built work, not a claim …
skipped WO-4.5 — Cooldown & the quiet middle
  🔨 IN PROGRESS: part-built work, not a claim …

next: WO-8.13 — the About modal names two documents and not the licence
  size S
  depends on nothing
…
PASS | gates clear for WO-8.13
```

`node tools/wo-gate.mjs --audit` was green (`PASS | every fragment matches …`), and
`node tools/wo-sweep.mjs` read `34 checks · 31 passed · 0 failed · 3 to review`. **WO-8.13 was not
re-placed in the table at any point in this dispatch** — the row sits exactly where it sat, in
document order, and `--audit` fires on it there. The diff of `plans/work-orders/README.md` contains
no row move; the only two lines it deletes are rows 10 and 18, each replaced in place by the same
line with a mark on the front of its `Suggested` cell.

---

## 2. Against each Acceptance line

### ✅ 1. The mark is defined in `README.md` in a section of its own, carrying WO-1.28's sentence

`plans/work-orders/README.md` § **"Ride-along rows"**, a new section between § "Acceptance-line
marks" and § "Citing code". It opens by saying why it is a section rather than a tenth row in the
header table, in the same terms § "Acceptance-line marks" uses about itself.

The sentence is carried verbatim as a bolded heading sentence:

> **🎒 changes ordering and nothing else.** It closes no box, opens no gate, satisfies no dependency,
> and holds no work order at 🔨 IN PROGRESS.

and it is followed by the equivalence argument in the same shape the 📆 section makes it (*"That
equivalence is load-bearing, exactly as the one above it is — a mark that could refuse by ID is 🔒
GATED under a new name, and 🔒 already exists for the thing it means"*).

**Verified by:** reading the section back in the file. The section also carries the position rule and
its argument, the backtick rule, the "After row 21" refusal, the two live cases, the NOTE-not-FAIL
ruling, and the *glyph is the owner's to change* sentence.

### ✅ 2. `next` skips a marked row, names it, and prints what it rides with

```
skipped WO-8.13 — the About modal names two documents and not the licence
  🎒 rides along with index.html: ⬜ NOT STARTED and fully buildable, but not work to schedule — fold it into a sitting that already has that open. Nothing here refuses it: node tools/wo-gate.mjs --start WO-8.13
```

Same `skipped <ID> — <title>` head line as the 🔨 and 🤖 skips, same one indented sentence under it,
same "and here is what to do about it" ending. The 🔨 sentence ends in `--tick`, the 🤖 sentence ends
in `--release`, and this one ends in `--start`, which is the only one of the three that is *not* a
repair — that difference is written up at `reportSkips()`.

**Verified by:** the run above, and by `--self-check` plant *"`next` steps over a 🎒 ride-along row,
names what it rides with, and offers the row below it"*, which additionally proves the unmarked
baseline, the backtick fence, and that a 🔨 row keeps its status sentence.

### ✅ 3. `node tools/wo-gate.mjs WO-8.13` still produces a full gate report and still clears

```
WO-8.13 — the About modal names two documents and not the licence
  file    plans\work-orders\phase-8-packaging.md:1017
  ship    —   size S
  status  ⬜ NOT STARTED
  depends nothing
  dispatch no files yet
  git     …
PASS | gates clear for WO-8.13
```

Exit 0. Identical to the before-state report except the `git` block, which lists this dispatch's own
edits. `gate()` was not modified at all in this work order — it does not read the mark, which is the
strongest available form of "the mark blocks nothing when the row is asked for by name."

**Verified by:** the run above, and by `--self-check` plant 2, which compares the gate report on the
fixture *before and after* the mark goes on its row, whole, minus the `git` block — and additionally
proves `--start` and `--tick` go through on a marked row (to `✅ DONE`, roadmap box ticked) and that a
dependent's gate still refuses a marked-but-unbuilt dependency.

### ✅ 4. `--audit` reports a marked row that is the first `⬜` in its section, and fires on WO-8.13

```
🎒 ride-along rows in the running order, against the shelf above each one

  ok   WO-6.5   rides with anything   5 open row(s) above it in § After Ship 3 — the sign-in and the paperwork
  NOTE WO-8.13  the shelf above it has emptied. It is the first ⬜ in § After Ship 3 — the sign-in and
                the paperwork (row 10) and it rides with index.html, so `next` steps over it and there
                is nothing left to fold it into. Re-place it, start it by name, or take the 🎒 off —
                which of the three is a human's call, so this is a NOTE and never a problem

  2 ride-along row(s), 1 with nothing open above them — reported, never a problem
```

and the run's closing banner gains a second line under the PASS:

```
     | 1 🎒 row(s) above have run out of shelf. That is a NOTE and not one of the problems counted here — read the section and decide.
```

**It fires on WO-8.13 in the tree as it stands**, with row 10 in its original position. Row 18
(WO-6.5) reads `ok` on the same run, which is the half that stops the check firing on the glyph
rather than on the condition.

**One decision the work order did not settle, and which way I went.** The line says `--audit`
*reports* — it does not say *fails* — and Acceptance line 7 wants `--audit` green on a clean tree
while the brief says not to re-place the row. Those three only hold together if the report is a
**NOTE that does not count into the problem total**, so that is what I built, and I think it is right
on the merits as well as by construction. Every other thing `--audit` prints `BAD` for is two
documents disagreeing, with exactly one correct repair. An empty shelf is not a disagreement: it has
three correct answers (re-place, start, unmark) and which is right is a call about the owner's own
week. A tracker that goes red until a human makes a judgment call teaches its reader to clear it
without making one — WO-1.12's own sentence.

**And it is not only an argument.** I mutated the delivered script so the NOTE counted into
`--audit`'s problem total and re-ran the plants: **three** went red, and two of them were plants no
fixture had broken — WO-1.21's `--audit` plant and the § The files plant, both of which assert
`--audit` exits 0 on a healthy fixture. `--self-check` copies the real `plans/`, so a live NOTE in
the running order would be a live `FAIL` inside every plant that runs `--audit`. That row is in
`tools/README.md`'s mutation table with the finding in its own cell.

### ⚠️ 5. WO-8.13 and row 18 (WO-6.5) wear the mark, and `next` returns **WO-5.2** — HALF MET

**The first half is met and verified.** Row 10's `Suggested` cell now opens
`` 🎒 `index.html` — **Nothing blocks it.** … `` and row 18's opens
`🎒 anything — **Rides along with anything.** …`. Both are read as marks; both are named by
`--audit`; row 10 is skipped by `next`.

**The second half does not hold on this tree and I did not force it.** `next` returns **WO-1.27**, not
WO-5.2:

```
skipped WO-8.13 — the About modal names two documents and not the licence
  🎒 rides along with index.html: …

next: WO-1.27 — a field name in prose is read as a field, and only half the parser knows the rule
```

**Why.** § After Ship 3 holds six more `⬜` rows between row 10 and row 21, and the mark cannot
legitimately reach past them:

| row | work order | status | `Suggested` says | ride-along? |
|---|---|---|---|---|
| 12 | WO-1.27 | ⬜ | "Whenever the tracker is quiet" | **No** — a condition on the tree, and it is the *host* rows 14–16 ride with |
| 14 | WO-1.29 | ⬜ | "pairs with row 12 — same field, same file, one sitting" | Arguably yes |
| 15 | WO-1.30 | ⬜ | "the third of the four tracker rows — 12, 14, 15, 16" | Arguably yes |
| 16 | WO-1.31 | ⬜ | "Pairs with row 15 — same file, same neighbourhood, one sitting" | Arguably yes |
| 19 | WO-2.33 | ⬜ | "When there is an iPad sitting anyway" | Arguably yes |
| 20 | WO-7.2 | ⬜ | "**After Sep 2.** … the wrong shape for the five days before a class starts" | **No** — a date. Marking it is exactly what the fourth Trap forbids |

So **even marking every arguable candidate above, `next` stops at row 20 (WO-7.2) and never reaches
WO-5.2.** The only way to the stated answer is to mark a row whose argument is a calendar date, which
the Traps forbid, or to re-place rows, which the brief forbids. I judged the Traps and the brief to
govern over a predicted output, marked only the two rows the work order names as the live cases, and
am reporting the miss rather than papering over it.

**Three ways to close this line, for the owner/orchestrator to pick from — I made none of them:**

1. **Re-cut the line** to `next` returns **WO-1.27**, which is the honest answer on this tree and is
   itself a sensible one: row 12 is buildable, nothing depends on it, and the tracker is quiet today.
2. **Mark rows 14, 15, 16 and 19** as ride-alongs. Each genuinely matches *fold this into a sitting
   that has X open*; I left them because "Rows 10 and 18 are the two live cases" is the work order's
   own sentence and deprioritising four more rows is a scheduling decision, not an implementation
   one. This still does not produce WO-5.2 — it produces WO-7.2.
3. **Accept the line open.** `--tick WO-1.35` will then write `🔨 IN PROGRESS`, which is the accurate
   status for a work order with one open box.

The box is left `- [ ]` in `plans/work-orders/phase-1-shell-store-roster.md`. I did not reword the
Acceptance line, so the verifier reads it as written.

### ✅ 6. `--self-check` is green with a plant behind each new check, and the count goes up by that many

`24 plants → 27 plants`. `PASS | 27 of 27 plants were caught.` The run's own closing summary gained a
paragraph naming the three, and `tools/README.md`'s narrative count went `twenty-four → twenty-seven`
and `24 plants, 24 caught` → `27 plants, 27 caught`.

The three:

- ``next` steps over a 🎒 ride-along row, names what it rides with, and offers the row below it`
- `🎒 changes ordering and nothing else — the ID still gates clear, --start and --tick are untouched, and it satisfies no dependency`
- `--audit says when the shelf above a 🎒 row has emptied, reports it as a NOTE rather than a problem, and writes nothing`

**Each has a real plant behind it, and each was proved able to fail.** No new synthetic work order was
needed: step 2b has put both fixture rows above every real row since WO-2.16, which is already the
pair a 🎒 plant wants — WO-9.9 with an empty shelf above it, WO-9.8 with a shelf. A new helper
`markFixtureRow()` rewrites a fixture row's `Suggested` cell whole and throws if the write changed
nothing (WO-1.21's "a plant that quietly plants nothing accuses the wrong file").

**Non-vacuity, measured.** Four one-line mutations of the *delivered* script, each driven with
`--self-check --against <copy in TMP>` so no file in the tree was ever edited. Output read, not
predicted:

| Mutation | Result |
|---|---|
| the 🎒 skip deleted from `next()` | `FAIL | 1 of 27` — the `next` plant, alone |
| `gate()` taught to refuse a marked row | `FAIL | 1 of 27` — the ordering plant, alone |
| `rideAlongReport()`'s `if (above)` forced true, so nothing ever reports an empty shelf | `FAIL | 1 of 27` — the audit plant, on its first case only; its second and third stay green |
| the NOTE counted into `--audit`'s problem total | `FAIL | 3 of 27` — the audit plant **plus** WO-1.21's `--audit` plant and the § The files plant |
| control: an unmutated copy | `PASS | 27 of 27 plants were caught.` |

All four rows are now in `tools/README.md`'s mutation table, and the count sentence under it went
"Twelve mutations" → "Sixteen mutations" with the sixteenth's spread called out as its finding.

### ✅ 7. `node tools/wo-sweep.mjs` green and `--audit` green on a clean tree

Final run, on the delivered tree:

```
node tools/wo-sweep.mjs        34 checks · 31 passed · 0 failed · 3 to review
node tools/wo-gate.mjs --audit exit 0, PASS
node tools/wo-gate.mjs --self-check   PASS | 27 of 27 plants were caught.
```

The three `to review` items are the same three the sweep carried before this dispatch — sensitive
field names outside `src/backup.js`, due-date/late-missing on one line, and the two mockup banners.
None of them moved.

**And `verify-shell.mjs`, which I ran rather than assumed.** It ran here, backgrounded, and I waited
for it to exit before writing this:

```
1197 checks · 1197 passed · 0 failed · 0 skipped
35,697 lines · 29.8 lines per check · 397s
[exited with code 0]
```

This work order touches no file under `src/`, no `index.html` and no `sw.js`, so the harness had
nothing new to measure — the green run is a no-regression reading, not evidence for any box above.
(Worth noting against `CLAUDE.md`'s "usually cannot run in a sandboxed agent": on this machine, in
this dispatch, it ran. It took 397s, not ~160s.)

---

## 3. Files changed

- `c:\dev\planbook\tools\wo-gate.mjs` — the mark's parser (`RIDE_ALONG_MARK`, `rideAlongOf()`),
  `runningOrder()`, the `next` skip, `rideAlongReport()` and its `--audit` section, three new
  `--self-check` plants plus `markFixtureRow()` and `rideSection()`, a head-comment paragraph, and a
  `--help` paragraph. `+316 / −17`.
- `c:\dev\planbook\plans\work-orders\README.md` — new § "Ride-along rows"; the marks on rows 10 and
  18; the `shipOneOrder()` → `runningOrder()` citation in § After Ship 3. `+76 / −4`.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` — six of seven Acceptance boxes
  ticked. `+7 / −7` (the seventh changed line is the `🤖 CLAIMED` status the orchestrator's `--start`
  wrote before this dispatch began).
- `c:\dev\planbook\tools\README.md` — plant count, the `--audit` usage block, the three new plants'
  paragraph, four new mutation rows and the count sentence under the table. `+19 / −6`.
- `c:\dev\planbook\plans\work-orders\ROUTING.md` — one parenthetical, because that file says *"`next`
  names every claimed row it stepped over"* and there is now a third kind of skip that is not a
  claim. `+4 / −1`.

No file under `src/`, `index.html`, `sw.js` or `CHANGELOG.md` was touched. No `package.json`, no
dependency. No `localStorage`, no student data, no accommodation/medical/plan field anywhere near
this change.

---

## 4. Decisions the work order did not settle

1. **`--audit` NOTEs rather than FAILs.** Argued and measured under Acceptance line 4 above. This is
   the single most consequential call in the dispatch; if the owner wants it red, the change is one
   line (`ride.notes.length` into the `problems` sum) **and it costs two unrelated plants** — those
   would need re-cutting first.
2. **A position rule for 🎒 where 📆 explicitly refused one.** The mark must *open* the `Suggested`
   cell. 📆's parser accepts the glyph anywhere because 👤 had been written at both ends of forty-two
   existing lines and a rule invented later would have unmarked half of them. 🎒 has never been
   written in a cell before today, so there is nothing to unmark — and "anywhere in the cell" would
   read a cell that *mentions* a ride-along as being one, which is a live hazard in a column of free
   prose. Written up at the constant, and in the README section.
3. **`shipOneOrder()` is gone; `runningOrder()` replaces it.** My change left `shipOneOrder()` with
   no callers, and an uncalled function that a future reader would edit expecting `next` to change is
   a trap I would have been introducing. WO-2.16's own result file proposed exactly this rename as a
   follow-up and nothing took it; the name had been wrong since 2026-08-09 (it read every table, not
   Ship 1's). Both live citations were updated in the same sitting — the step-2b plant comment and
   § After Ship 3's numbering paragraph. Flagging it because it is the one rename in the diff.
4. **`gate()` was not touched.** A ride-along row's gate report says nothing about the mark. The Trap
   says "exactly as it does today", and a NOTE would have made that literally false; the plant asserts
   the two reports are byte-identical, which only works because nothing was added.
5. **A 🎒 with nothing after it** is still read as a mark, and `next` prints
   `rides along with (nothing named — write what it rides with after the 🎒)`. I chose that over
   silently not-a-mark (which loses the row) and over an `--audit` problem (a new failure mode with
   no plant behind it, which is the exact defect the last Trap names).

---

## 5. Out-of-scope temptations declined, and things left undone

- **Teaching `next` to parse the `Suggested` column.** The work order's own Out of scope. Not done,
  not started. The column's sentences are untouched on both marked rows — row 18 still reads
  "**Rides along with anything.**" after the mark, and the mild redundancy with `🎒 anything` is
  deliberate: the mark is the parseable half of a sentence the column keeps.
- **Marking rows 14, 15, 16 and 19** (WO-1.29, WO-1.30, WO-1.31, WO-2.33). Each arguably earns the
  mark; all four are left unmarked and are listed under Acceptance line 5 for the owner. Marking them
  is a scheduling decision about four work orders, not an implementation of this one.
- **Re-placing WO-8.13 down the table.** Forbidden by the brief and by Acceptance line 4's evidence
  requirement. It stays at row 10, and `--audit` says so on every run until somebody decides.
- **Updating row 36's `Suggested` cell** (WO-1.35's own row in § After Ship 3, which currently reads
  the pre-build argument). Every landed row here gets a `✅ <date> — …` cell, but that cell is prose
  about what a change *means*, so I left it with the CHANGELOG entry.
- **`CHANGELOG.md`.** Not written. Draft below.

---

## 6. Draft CHANGELOG entry — for the teacher to accept, reword or discard

> **A row can now say it is a ride-along, and the tracker stops offering it as the next thing to
> build.** Some work orders are not an hour to schedule, they are an hour to fold into a sitting that
> is already open — a link in the About modal, while somebody is in `index.html` anyway. The running
> order has said that in prose for a week, in a column no tool reads, and the only thing keeping such
> a row out of `next`'s way was its *position* at the foot of a table. Position is undone by the rows
> above it succeeding: on 2026-08-28 three of them cleared and `next` began answering with the one row
> that spends a paragraph arguing it should not be answered with. 🎒 in the `Suggested` column now
> says it in a form the tool can read. `next` steps over a marked row, names it, says what it rides
> with, and prints the command that starts it anyway — because a row that vanishes from the report is
> a row nobody remembers, which is the same defect upside down. `--audit` says when the shelf above a
> ride-along has emptied, as a note rather than a failure, because *re-place it*, *start it* and *take
> the mark off* are all correct answers and only a person can pick. The mark changes ordering and
> nothing else: it closes no box, opens no gate, satisfies no dependency, and naming the work order by
> ID produces exactly the gate report it always did.
