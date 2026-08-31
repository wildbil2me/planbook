# WO-1.42 — the sweep's own check count is maintained by hand · implementer's result

**Route** Claude Opus (work-order-implementer) · **Date** 2026-08-31
**Verdict from this seat** all four Acceptance lines closed and ticked, every one driven rather than
reasoned. One thing outside the Acceptance list is red and is named in § 6 below:
`node tools/verify-shell.mjs` fails on this tree and fails identically at HEAD.

---

## 1. What landed

`tools/wo-sweep.mjs` gains **§ 22**, at the foot of the file below every other section. It emits two
checks:

- **`the sweep-count census is the last thing this sweep pushes`** — the ordering fixture. It reads
  this file's own text, takes every non-comment `check(`/`review(` call site, and asserts the **last**
  one is the census at the foot of § 22.
- **`the recorded sweep-check count matches this run`** — the census. It reads
  `The verifier's N-check standing sweep` out of `tools/README.md` by its sentence and holds `N`
  against `results.length + 1`.

`tools/README.md` moves `38-check` → `40-check`, the `wo-sweep.mjs` row gains a clause naming § 22,
and the italic paragraph under the table — which said in the present tense that nothing checks this
number — is repaired without losing the `33` → `36` → `38` rot history it records.

### The one literal, named plainly

The `+ 1` is the only number in the section that is not a line index or a message clip. `check()`
pushes as it prints, so at the moment the census computes, `results` is short by exactly one entry —
its own, not yet pushed. **It is not a total and it does not move when the sweep gains a section**;
what makes it sound is the ordering check beside it, which is why the two ship as one section. I am
flagging it here rather than hoping it goes unnoticed: if a verifier reads Acceptance line 2 as
forbidding *any* integer literal, this is the line to argue about. I read the trap as forbidding a
second hand-maintained **total** — "a literal in the check that must be edited whenever the count
changes" — and `+ 1` is never edited when the count changes.

### Two design calls the work order did not settle

- **One census call site, not one per branch.** § 11 calls `check()` out of each branch arm; § 22
  computes `ok`/`detail` in the branches and calls once, at the foot. The reason is that the ordering
  fixture asserts the position of a *single line*, so the census needs one unambiguous target. Said
  in a comment at the point of departure.
- **The ordering fixture names the census by the identifier it is called with** (`SWEEP_COUNT`), so a
  rename reddens it. That is § 11's anchor rule; the alternatives — matching on position, or counting
  the call sites this block is expected to hold — reintroduce the hand-maintained number the section
  exists to refuse. Also in the allowlist.

### One honest hole, written into the allowlist

The fixture reads **call sites, not the call graph**. A future section added below § 22 that pushed
its result through a helper defined *above* § 22 would leave the last literal call site standing at
the census and the fixture green. No such helper exists — every push in this file is a literal call
at its own site, which is the property § 11 already rests on one file over — but it is a real limit
and it is written down where the next reader will be standing.

---

## 2. Acceptance, line by line

**1. The count recorded in `tools/README.md` is asserted against `results.length` at runtime, and a
wrong number goes red — driven against a planted wrong count.** ✅ **Ticked.**

Driven three ways, each restored afterwards:

- Planted `The verifier's **39**-check standing sweep` →
  `FAIL | the recorded sweep-check count matches this run :: tools/README.md:10 records a 39-check sweep and this run emitted 40, up 1 — change that one number to 40 and change nothing here; there is no figure in tools/wo-sweep.mjs to keep in step with it.`
  Summary `40 checks · 36 passed · 1 failed · 3 to review`, **exit 1**.
- Anchor sentence **reworded** to *"The verifier's standing sweep of 40 checks, as greps"* →
  `FAIL … tools/README.md no longer contains the sentence this section reads (\`The verifier's N-check standing sweep\`) — restore the wording or re-point this section; a reworded sentence must not read as a passing count`, **exit 1**. This is § 11's rule honoured: a reworded sentence goes loud, never quiet.
- Number stated **twice** (a second sentence planted at the head of the file) →
  `FAIL … tools/README.md states the count 2 times (tools/README.md:3, tools/README.md:12) — one sentence holds it, or the sweep cannot say which one it is asserting`, **exit 1**.

It is a `check()` and not a `review()`, per the third trap.

**2. No second hard-coded total anywhere in the check; editing the sweep's real count is the only
edit a maintainer makes.** ✅ **Ticked**, with the `+ 1` disclosed in § 1 above.

The integers in § 22 are: the `+ 1` for the census's own unpushed entry; `i + 1` and
`sites.length - 1` for line numbering and array indexing; and `90`/`87`, which clip an offending line
for the failure message. **No count of checks is written down anywhere in the tool.** The failure
detail names both the file:line to edit and the value to write.

**3. The assertion reads the total after every section has run, proved by a fixture that would catch
an early read.** ✅ **Ticked.**

Planted a stand-in section that pushes a result **below** § 22 —
`{ check('MUTATION planted section 23', true, 'stands in for a section added below the census'); }`
immediately above the summary block. Result:

```
FAIL | the sweep-count census is the last thing this sweep pushes  :: the last result-pushing call
site in this file is tools/wo-sweep.mjs:2751 "check('MUTATION planted section 23', true, 'stands in
for a section added below the cen…", not the census at the foot of § 22 — anything that pushes after
the census makes it read its own position rather than the total …
PASS | the recorded sweep-check count matches this run  :: 40 results emitted this run, matching
tools/README.md:10 …

41 checks · 37 passed · 1 failed · 3 to review
```
exit 1.

**Read that pair carefully, because it is the whole argument for the fixture existing**: the census
itself stayed **green at 40** while the run actually emitted **41**. That is the silent early-read the
second trap describes, and nothing but the ordering check catches it. (This fixture was driven twice
— once at first landing, quoting `:2742`, and again after later prose edits moved the section, which
is where the `:2751` above comes from. The quoted line number in `TESTING.md` is the second one, so
the record reproduces against the tree as delivered.)

**4. `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.** ✅ **Ticked.**

```
node tools/wo-sweep.mjs   →  40 checks · 37 passed · 0 failed · 3 to review     exit 0
node tools/wo-gate.mjs --audit  →  PASS | every fragment matches exactly one roadmap box …   exit 0
```
The three REVIEWs are the standing ones — the sensitive-field-name census, the due-date/late-missing
census, and the mockup-banner one — and are unchanged from before this work order (`38 · 35 · 0 · 3`
then, `40 · 37 · 0 · 3` now: **+2 checks, +2 passes, no new REVIEW**). `node tools/wo-gate.mjs
--self-check` was also run: `PASS | 31 of 31 plants were caught`, exit 0.

---

## 3. Mutations planted and reverted

Five plants in total, all reverted, **all reverted before a line of prose was written**, and every one
driven against **copies taken before the round** (`tools/README.md` and `tools/wo-sweep.mjs` copied to
the scratchpad and restored from those copies) rather than with `git checkout --`. That is WO-1.40's
method and the one WO-1.41's own entry recommends, for the reason it gives: a dispatch that dies
between the plant and the revert leaves the armed file in the tree.

| # | What was planted | Where | What it printed | Reverted |
|---|---|---|---|---|
| 1 | `39-check` for `40-check` | `tools/README.md:10` | census `FAIL`, exit 1 | ✅ |
| 2 | anchor sentence reworded | `tools/README.md:10` | census `FAIL` (sentence gone), exit 1 | ✅ |
| 3 | the number stated a second time | `tools/README.md:3` | census `FAIL` (stated twice), exit 1 | ✅ |
| 4 | a pushing section below § 22 | `tools/wo-sweep.mjs`, above the summary | ordering `FAIL`, census silently green, `41 checks`, exit 1 | ✅ |
| 5 | #1 and #4 re-driven at the final file state | as above | same, at `:2751` | ✅ |

**The tree was restored and proved restored.** `diff -q` against the pre-mutation copies reported
both files **byte-identical**; `grep -rn MUTATION tools/wo-sweep.mjs tools/README.md` returns only the
three standing prose mentions in `tools/README.md` (lines 1255, 1296, 1774) and **no hit at all in
`tools/wo-sweep.mjs`**; and `node tools/wo-sweep.mjs` is back to `40 · 37 · 0 · 3`, exit 0.

---

## 4. Files changed

- `c:\dev\planbook\tools\wo-sweep.mjs` — **+133, −0.** New § 22 at the foot of the file, above the
  summary block. Nothing else in the file was touched; the diff is additions only.
- `c:\dev\planbook\tools\README.md` — **+18, −9.** `38-check` → `40-check`; the `wo-sweep.mjs` row
  gains a clause naming § 22; the italic paragraph under the table is rewritten from *"That count is
  hand-maintained and nothing checks it"* to *"That count **was** hand-maintained and nothing checked
  it **until 2026-08-31**"*, keeping the whole `33` → `36` → `38` history and the note about why
  WO-1.41 did not do this, and adding what § 22 does, what the maintainer's one edit is, and the two
  things it still does not do.
- `c:\dev\planbook\TESTING.md` — **+55, −0.** A § WO-1.42 entry in WO-1.41's shape, with the four
  driven fixtures quoted, plus the `verify-shell.mjs` note in § 6 below.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` — **+5, −5.** The four Acceptance
  boxes ticked. *(The `**Status** 🤖 CLAIMED` line in that file was already changed by the
  orchestrator's `--start` before I began; it is in the diff and is not mine.)*

No app code, no stylesheet, no `index.html`, no `sw.js`. **No `CACHE` bump is owed.**

---

## 5. What I did not do, and why

- **WO-1.43 is marked `🎒 WO-1.42` — a ride-along on this very sitting — and I left it alone.** It
  wants two repairs inside the same twenty lines of § 21 I was reading. I had the file open, which is
  exactly the condition the mark is for, but it is a separate work order with its own Acceptance list
  and no brief in front of me, and a work order that grows is a work order that cannot be verified.
  **Naming it here so the temptation is on the record:** the next sitting that opens `wo-sweep.mjs`
  should take it, and this one would have been the natural host.
- **I did not widen this into a census of every number in `tools/README.md`** (fourth trap). The page
  holds several — the harness's line counts, the executed-check prose, section numbers. The allowlist
  says in as many words that they belong to § 11 or to nobody and that a census of the rest is a
  different work order.
- **I did not touch `plans/work-orders/README.md`.** Its running-order row 48 still describes WO-1.42
  in the booking tense (*"Whenever the tracker is quiet…"*). Running-order prose is the orchestrator's
  to maintain — WO-1.40's implementer left the equivalent row for the same reason — and the
  § "The pipeline's own files" table is unaffected: it maps the pipeline's *files*, and its own note
  already says the scripts live in `tools/README.md`, "which is their own map and says which of them
  checks itself." That sentence is more true now, not less.
- **I left two dated sentences in `TESTING.md` alone** — WO-1.40's entry at :1119 (*"with a note
  saying nothing checks it"*) and WO-1.41's at :1182 (*"still saying nothing checks it — WO-1.42's
  job, not this one's"*). Those are records of what a landing produced on its day, not live claims
  about the tree, and the second one explicitly hands the job here. Flagging them in case the verifier
  reads them as prose this work order made false.
- **`CHANGELOG.md` — not written.** Draft in § 7 if it is wanted.

---

## 6. What I could not verify, and one thing that is red

- **`node tools/verify-shell.mjs` is RED on this tree, and it is red at HEAD.** It is not in this work
  order's Acceptance list (line 4 names `wo-sweep.mjs` and `--audit`), but the brief's § 4 lists it,
  so it was run — **twice, to completion, and both runs were read**. Both died in the same place:

  ```
  Error: nothing to click for #daysOffList [data-dayoff-remove="undefined"] [0]
      at clickSel (tools/verify-shell.mjs:465:19)
      at async passes (tools/verify/attendance-passes.mjs:2481:3)
  Node.js v24.16.0
  EXIT=1
  ```
  with **five `FAIL` lines before the crash**, all in the days-off / planned-drop flow — the first
  reads *"the event is {} on 2026-09-09 (today is 2026-08-31)"*. It is **deterministic, not a flake**
  (identical failure, identical stack, two runs), and **this work order cannot be the cause**:
  `git diff --numstat` lists only `TESTING.md`, `plans/work-orders/phase-1-shell-store-roster.md`,
  `tools/README.md` and `tools/wo-sweep.mjs`, so every app file is byte-identical to HEAD, and the
  harness loads none of the four. **It wants its own look before 2026-09-02.** No summary line was
  printed by either run, so I cannot report a check total for it — only the crash.
- **Nothing here needs an iPad, a thumb or a human eye.** There is no 👤 line and no 📆 line on this
  work order, nothing renders, nothing reaches a device, and I ticked no box of either kind.
- **One property I reasoned rather than drove:** that the total stays 40 across a *clean* tree as well
  as this dirty one. I read §§ 6 and 9 — the two sections that ask git what has changed — and every
  branch of both pushes exactly one entry, so committing cannot move the number. I did not build a
  clean checkout to prove it. If the count is ever wrong immediately after a commit, that is the
  assumption to test first.

---

## 7. `CHANGELOG.md` draft, if it is wanted

> **Tooling.** The sweep now counts itself. `tools/README.md` records how many checks
> `wo-sweep.mjs` runs, a person typed that number, and nothing read it — it was found stale by one
> during WO-1.40, and a stale count in that file is the tell two dead-dispatch recoveries were caught
> by. `wo-sweep.mjs` § 22 holds the recorded figure against `results.length`, what the run actually
> pushed, and goes red when they differ. There is no second number inside the tool: the one edit,
> when the sweep gains or loses a check, is the figure in `tools/README.md`, and the failure names
> the line and the value to write. Because the total is only final once every section has run, § 22
> is the last section in the file and a second check asserts that it is — planting a section below it
> leaves the census reading its own position, green, while the summary prints a larger number, which
> is the failure that check exists to catch.
