# WO-4.3 — Praise signals · implementation result

**Status landed at** `🔨 IN PROGRESS — built 2026-08-24`, with **Acceptance line 3 owed to the term**
and one 👤 sitting owed to a real iPad. Four of five boxes closed, both mutation-proved where the
claim was worth mutating.

**Both harnesses, run to completion on the delivered tree, output read:**

```
node tools/verify-shell.mjs
1156 checks · 1156 passed · 0 failed · 0 skipped
32,850 lines · 28.4 lines per check · 383s          exit 0

node tools/wo-sweep.mjs
33 checks · 29 passed · 0 failed · 4 to review      (all four pre-existing or answered at the check)

node tools/wo-gate.mjs --audit      PASS
node tools/wo-gate.mjs --self-check PASS | 18 of 18 plants were caught.
```

Three full `verify-shell` runs happened: a first green one at 384s, two mutation runs (below), and a
final confirming run at 383s on the exact tree being handed over. I waited for each to exit and the
numbers above are copied from its own summary block.

---

## Against the Acceptance list, one by one

### 1. `[x]` Biggest improvement first, not the highest grade — a B− outranking an A

**Closed. Measured on the rendered column**, not on the model alone.

The new harness section plants a class where the highest grade and the biggest climb belong to
different students — the only fixture shape that can tell a correct ranking from a sort on the level.
The run prints:

```
["Bea Wo43Climber B- +16.25","Cy Wo43Riser A +9.20","Dev Wo43Turned null 2",
 "Eli Wo43Sinking D- 8","Ada Wo43Ace A 8"]
```

The B− is at **80.50%** and came up **16.25** points; the A under her is at **94.20%** and came up
**9.20**; the class's **highest** grade, 96.50%, is last. Both letters come out of the app's own
scale, so the work order's sentence is true of what was measured rather than of what I intended.

**Mutation-proved.** `orderPraise()` cut to a sort on `row.grade` — literally the build this phase
exists to refuse — reads `1156 checks · 1152 passed · 4 failed`, exit 1, and the four are exactly the
ordering claim, the perfect-record claim, the row-children census, and the rule-chip check whose
expected names come out of that order. Reverted; the marker is gone from disk (`grep -c` = 0).

### 2. `[x]` The turnaround fires for a student who was on the concern list and no longer is

**Closed.** The hit reads:

```
{"fired":1,"cleared":2,"days":21,"who":"s_wo43dev",
 "say":"In WO-4.3 Praise, Dev Wo43Turned is off the concern list — 2 rules were flagging them
        21 days ago and none is today.","stillConcerned":false}
```

Two concern rules were firing at `through − 21 days` and none fires today; it fires for **nobody
else** on the roster, which is the half that separates a working rule from one that praises everyone.

**No stored bit**, and that is asserted rather than asserted-in-prose: the document is **byte-identical**
either side of a pass that runs the rule on five students, and a regex sweep of the serialised
document finds no key shaped like a remembered flag. `newYearDocument()` gained nothing, so every
backup written by every earlier build still restores.

**Mutation-proved.** Sampling the window at today instead of at its far edge (`shiftDays(through, 0)`
inside `concernAsOf()`) — a build that has the rule registered and can never fire it — reads
`1156 · 1151 passed · 5 failed`. Reverted; marker gone.

### 3. `[ ]` Two weeks apart on real data surfaces a materially different set — **LEFT OPEN**

**Not closed, and I am not going to pretend otherwise.** There is no real data until 2026-09-02.

What I did build is the mechanism check, and it is honest about being one: the same document
evaluated through `{ through }` a fortnight apart returns different lists in **both** directions —
`{"same":false,"gained":["s_wo43dev/turnaround"],"concernSame":false,"concernThen":4,"concernNow":3}`.
The turnaround fires today and fired for nobody two weeks ago, because two weeks ago that student was
still on the concern list.

**A fixture built to move is not evidence that a real class moves**, which is the whole of what this
line asks — it is guarding against a ranking that is stable because it is really the level in
disguise, and only a real roster can answer that. The box stays `- [ ]` in the work order and in
`TESTING.md`, with a `→ the term` pointer and a re-run date of ~Sep 16.

### 4. `[x]` A perfect record with no improvement does not dominate

**Closed. Measured.** The fixture's Ada has every assignment in, every score at or above 90, and
every meeting attended, and she sorts **last of five** — under both climbers, under the turnaround,
and under the *failing* student who has simply handed everything in. She is still **on** the column
rather than dropped from it, which I took to be the right reading: a level is worth saying, it is
just not worth the strong position.

The structural half of this is `PRAISE_RANK` in `src/signals.js`, which is trap 2's answer: bands by
rule first, so a level-only hit can never head a column that has one climber in it.

### 5. `[x]` Every praise hit's explanation contains the delta and the window — **closed with a stated reading**

**Closed**, swept over all **fourteen** praise hits the fixture produces across all five rules, then
pinned by three hand-written sentences matching character for character. Each hit is asserted to
contain (a) the figure its own `figure()` published and (b) a window phrase, with no placeholder.

**This is the one judgement call in the work order I would want overruled if the owner reads it
differently, so it is here in full.** Two of the five praise rules publish a before-and-after delta —
`grade-rose` in points, `turnaround` in rules cleared. The other three (`no-missing`,
`attendance-window`, `high-score-run`) measure a level or a count and have no before to state, which
is the drawing's own caption: *"Four rules have no delta, and they say a count instead."* Trap 2 of
my brief tells me such rules exist and to decide where they sit — it does not tell me to invent
deltas for them, and inventing one would be worse than the gap. So I read "the delta" as *the change
the rule measured, where there is one, and the figure it measured otherwise* — and **every one of the
fourteen names its window either way**.

If that reading is wrong, the box goes back to `- [ ]` and the three level rules need a decision this
work order did not make. The same qualification is written into the tick in `phase-4-signals.md` and
into `TESTING.md`, so nobody meets the tick without meeting the caveat.

---

## What I could not verify — 👤, and none of it is ticked

`verify-shell.mjs` drives a page, not an installed app, and no emulator has a thumb. Eight readings
are listed unticked in `TESTING.md` § WO-4.3. The two that matter most:

- **The two columns at equal width on a real iPad, portrait and landscape.** The harness measures
  620px against 620px in a 1280px window and 370px against 370px at 390px wide. What it cannot tell
  anyone is whether two columns of student names are *readable* on the device this is for. If they
  are not, the fix is the breakpoint, not the ranking.
- **The one-column drop with praise drawn first**, and whether scrolling past praise to reach concern
  is infuriating in practice. The drawing argues the reverse is worse; the device settles it.

And one that is not a layout question at all, which I would put in front of the owner during the
setup fortnight: **is anybody in the praise column who is not also at the top of the class?** If not,
the thresholds want tuning before Sep 2 — not the code.

---

## Decisions the work order did not settle

All three are recorded as **Decided by the build** lines in `phase-4-signals.md` § WO-4.3 and argued
at their own point in the code, so a reader meets the reasoning where the behaviour is.

1. **The praise ranking is banded by rule, then by figure** — `praiseOrder()`, the same shape
   `severityOrder()` already has (trap 3). A flat sort on the figure would subtract *rules cleared*
   from *points* and let whichever number happened to be larger lead, which is the question the
   concern side already refuses to ask about "61%" versus "3 missing". The order is
   **grade-rose · turnaround · no-missing · attendance-window · high-score-run**, and every position
   is argued at the array. `high-score-run` is last because it *is* the rule that can only ever fire
   for high achievers; it is a deliverable, so it is registered and drawn — it just never gets the
   strong position.
2. **The *Sorted by* control orders the CONCERN list only.** Two of its four options are concern
   errands with no praise reading, and the only praise reading of *lowest grade* is *top of the
   class* upside down. So the praise column keeps one ranking, its head says *biggest climb first* in
   as many words, and the `<select>`'s aria-label now reads "Sort the concern list by". **A second
   sort control was declined** on a screen already carrying two filter strips and one sort.
3. **A rule chip narrows the column its rule is in and leaves the other whole.** The strip carries
   both directions now (five chips on WO-4.2's own fixture, nine on mine). Filtering to *a run of low
   scores* is a concern errand; emptying the praise half while a teacher does it would bury the
   column this phase exists to protect, for a reason she never asked for.

Two smaller ones, recorded where they happen:

- **The card shows both directions.** A student on both columns has one card carrying all her rules,
  concern and praise. That is WO-4.1's "a student can be on both at once, and that is information
  rather than a bug" reaching a screen; the alternative — a card that shows only the half of the
  student whose column you tapped — is a screen hiding what it already knows.
- **`.sig-col-empty` is this sheet's own class and is not in the drawing.** The drawing has no state
  for *one* column being empty beside a column that is not, and an `.empty-state` is a centred block
  for a whole screen — half a screen's worth of it beside a working list reads as the working list
  being broken too. Reported in `proposed-phase4.css`'s banner under PROTOCOL.md § When the drawing
  lands, alongside the one thing I **declined** from the drawing (below).

## The one thing I declined from the drawing, and it is the trap-4 answer

`design/mockups/signals.html` draws a praise tag reading **"came off the concern list 9 days ago"**.
That day count is the only figure in the drawing the record cannot produce. Getting it needs either
a stored "was flagged" bit — which WO-4.3 forbids in as many words — or walking every day of the
window, which is twenty-one full concern passes per student per class on a screen a teacher opens
across five classes (WO-2.13's defect, reached from a different direction). **So the rule samples once,
at the far edge of the window, and says only what one sample can prove**: *"2 rules were flagging them
21 days ago and none is today."* It under-fires — a student flagged ten days ago and clear since is
not caught — and that trade is stated at the rule: praise not sent is a missed opportunity, praise
claiming a student came off a list she was never on is what stops the column being trusted.

**A second honest limit, stated rather than glossed** (also now in `docs/data-model.md` § Praise):
only rules whose facts are *dated* can differ across that gap. The ledger and the log are dated; a
score is not, and no window here is taken by due date — `grade-fell`'s own comment refuses that, and
so does `src/assignments.js` decision 4. So four of the nine concern rules genuinely time-travel and
five answer the same thing at both ends. **A grade recovery on its own therefore produces no
turnaround** — it produces `grade-rose`, which is the better sentence for it anyway. This is a limit
of what the document records, not something a schema field should be invented to fix.

## Out of scope — noted and declined

- **A praise-side sort control.** Tempting the moment the column existed. Declined: see decision 2.
- **Dating scores** so the grade rules could time-travel and the turnaround could fire on a grade
  recovery. That is a schema change with an argument behind it and belongs to whoever wants it, not
  to this work order (trap 4: *do not invent a schema field*).
- **WO-4.5's `.sig-hidden` / `.sig-muted` / `.sig-quiet-note`.** Still pending in the drawing's
  banner; the cooldown is the only part of § SIGNALS left unlifted.
- **`plans/ROADMAP.md`'s "Praise signals" box is deliberately still `- [ ]`** — the work order is
  `🔨`, not `✅`, and the dashboard reads 5/8 for Phase 4 unchanged. `wo-gate --audit` passes on that.

---

## Files changed

| File | What |
|---|---|
| `c:\dev\planbook\src\signals.js` | Four praise rules (`grade-rose`, `high-score-run`, `turnaround`, `no-missing`); `PRAISE_RANK` + `praiseOrder()` + `orderHits()`; `countedRows()` (one memo, `countedWork()` now a projection of it); `concernNow()` / `concernAsOf()` and the `historical` guard on `makeContext`; `shiftDays` import; registry now fourteen rules in the data model's own order; header updated |
| `c:\dev\planbook\src\signals-view.js` | Two symmetrical columns in the model (`concern` / `praise`, each `{rows,count,total,note}`), `all` for the card; `columnRows()`, `orderPraise()`, `paintColumn()`; chips both directions; card reads the base row so a student on both lists has one card; `PRAISE_NOTE`, `RULE_DIRECTION`; three new evidence keys |
| `c:\dev\planbook\src\signals-view.css` | `.sig-two`, the phone breakpoint with praise first, `.sig-col-empty`; header's "did not come across" table updated |
| `c:\dev\planbook\index.html` | `.sig-two` wrapper with both columns and their quiet lines; sort `aria-label` scoped to the concern list; panel copy and comments |
| `c:\dev\planbook\sw.js` | `CACHE` → `planbook-shell-v97` (`index.html` is `SHELL` entry one) |
| `c:\dev\planbook\tools\verify-shell.mjs` | New § *"the praise column, drawn (WO-4.3)"* — 15 checks, own fixture, own cleanup; four shipped WO-4.2 checks re-cut in place for the two-column model |
| `c:\dev\planbook\tools\README.md` | Call-site count 1126 → 1141; the WO-4.3 count paragraph, the two mutations, and the re-cut checks |
| `c:\dev\planbook\TESTING.md` | New § WO-4.3 — the four closed boxes, the open one with its `→ the term` pointer, eight unticked 👤 readings, both desk passes and both mutations |
| `c:\dev\planbook\plans\work-orders\phase-4-signals.md` | Status, `Owes`, three *Decided by the build* lines, four ticks with their evidence, one deliberate blank, *Where this stands*, *Traps* |
| `c:\dev\planbook\plans\work-orders\README.md` | Ship 3 running-order row 4 |
| `c:\dev\planbook\docs\data-model.md` | § Praise gains the turnaround's derivation, its two limits, and "there is no `wasFlagged` field, and there must never be one" |
| `c:\dev\planbook\design\mockups\proposed-phase4.css` | § SIGNALS banner now records the WO-4.3 lift; the added class and the declined tag reported per PROTOCOL.md |

Everything is **staged, not committed** — the brief did not say to commit. The diffstat is 1,822
insertions / 116 deletions across 14 files with no line-ending churn (checked; a CRLF rewrite would
show as a whole-file diff).

## Draft `CHANGELOG.md` entry — for the teacher to accept, reject or rewrite

> **Praise, beside concern, ranked by how far someone came.** *Who needs you* now has a second column.
> It is the same width as the first, it is drawn first on a phone, and it is ordered by **biggest
> climb** — the student who came up fourteen points leads the student sitting at 96%, and the current
> grade is not on the row at all. Five rules: a grade that rose, a run of strong scores, nothing
> missing across recent work, attendance over a window, and **coming off the concern list**. That last
> one is worked out fresh every time from what the register and the log already say — nothing in your
> year file remembers that a student was ever flagged, and nothing ever will.

## One follow-up worth booking (not built, not in scope)

The two harnesses cannot answer whether the **8-point / 4-assignment** default is right, and there is
an arithmetic fact about it worth knowing before anyone tunes it: an eight-assignment class of equal
weight **cannot** produce an eight-point rise for a student who finishes at an A — remove the last
four and the earlier four are still 400 points, which caps the rise at seven. `grade-rose` therefore
structurally favours students with a short graded history and students who were low. That is what the
phase wants, and it is also why the fixture's A-who-climbed only exists because three of his cells are
blank. It belongs in the threshold-tuning sitting after the term has a fortnight in it — recorded in
`TESTING.md` § WO-4.3 so it is not lost.
