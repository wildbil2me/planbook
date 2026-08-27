# WO-1.28 — result

**Status on delivery** 🤖 CLAIMED (unchanged). All nine Acceptance boxes ticked by this run; the
`**Status**` line is the orchestrator's `--tick` after a verifier PASS, per `ROUTING.md`
§ "Ticking follows the verdict."

**The mark is `📆`.** It means *no build can close this Acceptance line — it waits on the calendar*,
and it is shaped after `👤` (*no headless browser can close this*). It changes exactly one thing: a
dependency that is `🔨 IN PROGRESS` and whose **every open** Acceptance line is `📆` reports as
**code-complete** with a NOTE, instead of `FAIL | dependency … is 🔨 IN PROGRESS, not ✅ DONE`.

---

## Files changed

| File | What |
|---|---|
| `c:\dev\planbook\tools\wo-gate.mjs` | `CALENDAR_MARK` + `it.calendar` in `marked()`; `isGateWorkOrder()`; `calendarHold()` with its four fences and the chain walk; `gate()`'s dependency walk rewritten around them; a NOTE in `applyTick()`'s HELD branch; two more synthetic fixtures (`WO-G9`, `WO-9.7`) and a `calendar` option on the fixture; six new plants; the closing summary and two header paragraphs |
| `c:\dev\planbook\plans\work-orders\README.md` | **new § "Acceptance-line marks"** — the pair `👤`/`📆`, the five fences, why not `**Owes**`, why not a header field. 72 lines, 0 deletions |
| `c:\dev\planbook\plans\verification-tooling.md` | **new § "A rule stated in a table and enforced nowhere, 2026-08-26 (WO-1.28)"** — the class of defect, with WO-1.27 beside it, and the mutation record. 43 lines, 0 deletions |
| `c:\dev\planbook\plans\work-orders\phase-4-signals.md` | five Acceptance lines marked — 2 × `📆`, 3 × `👤`. 5 insertions, 5 deletions, nothing else |
| `c:\dev\planbook\tools\README.md` | plant count `18 → 24`, four synthetic work orders not two, five new mutation rows, `Seven → Twelve mutations` |
| `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` | WO-1.28's nine boxes ticked, and a **Where this stands** block recording the runs and the two judgement calls |

`git diff --numstat` on the final tree — no file shows a mass rewrite, and every deletion is a line
this run replaced:

```
43	0	plans/verification-tooling.md
72	0	plans/work-orders/README.md
41	10	plans/work-orders/phase-1-shell-store-roster.md
5	5	plans/work-orders/phase-4-signals.md
21	5	tools/README.md
382	19	tools/wo-gate.mjs
```

---

## Against the Acceptance list, one by one

### 1. `node tools/wo-gate.mjs WO-4.5` reports code-complete with a NOTE, and does not FAIL — met

Run on the working tree. Verbatim, trimmed only of the `git` block:

```
WO-4.5 — Cooldown & the quiet middle
  file    plans\work-orders\phase-4-signals.md:454
  ship    3   size M
  status  ⬜ NOT STARTED
  depends WO-4.2   ✅ DONE
  depends WO-4.3   🔨 IN PROGRESS   <-- code-complete; 1 line 📆
  dispatch no files yet

NOTE | dependency WO-4.3 is 🔨 IN PROGRESS and every open Acceptance line on it is 📆 — code-complete, so it does not gate WO-4.5. It is NOT done: 📆 changes dependency gating and nothing else, --tick still refuses to close these lines, and a gate work order still refuses WO-4.3. Still waiting on:
NOTE |   📆 WO-4.3  plans\work-orders\phase-4-signals.md:257  Running the praise list two weeks apart on real data surfaces a materially di…
PASS | gates clear for WO-4.5
exit=0
```

Exit 0, no `FAIL` line, and the outstanding line is named with its file and line number.
`node tools/wo-gate.mjs next` now answers **WO-4.5** and prints this same gate report under it.

### 2. `node tools/wo-gate.mjs WO-G3` still refuses WO-4.3 — met

Same tree, same shell invocation as line 1 (`WO-4.5` then `WO-G3`, one command, no edit between):

```
WO-G3 — Ship 3 gate: signals
  file    plans\work-orders\gates.md:302
  ship    3   size S
  status  ⬜ NOT STARTED
  depends WO-4.1   ✅ DONE
  depends WO-4.2   ✅ DONE
  depends WO-4.3   🔨 IN PROGRESS   <-- 1 line 📆, and a gate does not accept them
  depends WO-4.4   ✅ DONE
  depends WO-4.5   ⬜ NOT STARTED   <-- not done
  depends (prose) WO-4.1, WO-4.2, WO-4.3, WO-4.4, WO-4.5 — all of Phase 4
  target  October 2026, once 4–6 weeks of real data exist

NOTE | WO-G3 is a GATE work order, so 📆 buys WO-4.3 nothing here — refused below. This is the line the gate exists to check:
NOTE |   📆 WO-4.3  plans\work-orders\phase-4-signals.md:257  Running the praise list two weeks apart on real data surfaces a materially di…
NOTE | "Depends on" carries a non-work-order clause — read it yourself: WO-4.1, WO-4.2, WO-4.3, WO-4.4, WO-4.5 — all of Phase 4
FAIL | dependency WO-4.3 is 🔨 IN PROGRESS and code-complete — every open Acceptance line is 📆 — but WO-G3 is a gate work order, and a gate never opens on a deferred line. 📆 moves a wait past the work orders that only need WO-4.3's CODE; the gate is where the wait is actually paid. Tick WO-4.3 once what is named above is true
FAIL | dependency WO-4.5 is ⬜ NOT STARTED, not ✅ DONE
exit=1
```

**The pair is the proof.** One tree, one run, WO-4.3 in both: accepted by WO-4.5, refused by WO-G3,
and the refusal names the reason as *being a gate work order* rather than as a status. The mark did
not eat the gate.

`isGateWorkOrder()` answers on a `WO-G` ID **or** on the file being `gates.md`. The OR is the safe
direction and it is written at the function: over-answering true costs a dependency that stays
refused; under-answering true lets a gate open on the line it exists to check.

### 3. `--tick` refuses to close a marked line, and a plant fails if that regresses — met

`applyTick()` was **not** taught to skip a `📆` line — that is the whole of the change here, and the
plant is what stops the next edit adding it. Live evidence, `--dry-run` so nothing was written
(confirmed: `git diff` on the phase file and `ROADMAP.md` was unchanged after):

```
$ node tools/wo-gate.mjs --tick WO-4.3 --dry-run
HELD | 1 of 5 Acceptance lines are still [ ] — WO-4.3 is not done:
  📆 plans\work-orders\phase-4-signals.md:257  Running the praise list two weeks apart on real data surfaces a materially different set of student…

NOTE | roadmap boxes left unticked and the dashboard left alone — an unfinished work order closes nothing.
NOTE | 1 of those is 📆 — waiting on the calendar, not on a build. That does NOT close them and it does not tick WO-4.3; it only stops WO-4.3 gating the work orders that depend on it for its code. A gate work order still refuses WO-4.3, and so does this tick.
DRY RUN | re-run without --dry-run to write 🔨 IN PROGRESS. It will still refuse to write ✅ DONE.
exit=1
```

**The plant, and it is proved able to fail.** Plant *"📆 closes nothing at tick time — the line stays
[ ] and holds the work order at 🔨, exactly as 👤 does"* reads the box back out of the phase file
after the tick, not just the exit code. Mutation: `applyTick()`'s open-line filter taught to skip
`📆` (`!a.ticked && !a.calendar && …`), driven with `--against` over a copy in the scratchpad so no
repo file was edited:

```
FAIL | 📆 closes nothing at tick time — the line stays [ ] and holds the work order at 🔨, exactly as 👤 does
  24 plants, 23 caught, 1 missed.
```

Exactly that plant, nothing else. Recorded in `tools/README.md`'s mutation table.

### 4. A dependency with one marked and one unmarked open box still FAILs — met

Plant *"one marked and one unmarked open box still FAILs — the mark is on the line, not the work
order"*, green. It uses a fixture option (`calendar: 'mixed'`) that adds a third, unmarked open box —
without it the plant could not express the failure, since every other 📆 plant marks its whole list.

Mutation: `open.every(a => a.calendar)` weakened to `open.some(…)` →
`FAIL | one marked and one unmarked open box still FAILs …`, `24 plants, 23 caught, 1 missed`, and
nothing else moved.

### 5. ⬜ / 🤖 CLAIMED / 🚫 STRUCK / ⏳ DEFERRED are unaffected however their boxes are marked — met

Plant *"only 🔨 qualifies …"*, green. It runs all four statuses against the **same fully-marked**
Acceptance list, so the status word is the only thing that differs, and it additionally asserts that
🚫 and ⏳ keep WO-1.21's own wording — *"it will never be ✅ DONE"* — because a dead end reported as a
wait is the confusion that work order exists to prevent. `notComing()` is asked first in `gate()` and
still wins; 🚫/⏳ cannot reach `calendarHold()` at all, and the ordering is written out rather than
relied on.

Mutation: the 🔨 fence inverted to "anything but ✅ DONE" → that plant red on all four statuses at
once, `24 plants, 23 caught, 1 missed`, nothing else.

### 6. A two-hop defer names both hops in the NOTE — met

Two ways, because WO-4.5 is still ⬜ on the live tree so a real two-hop cannot exist here yet.

**(a) A sandbox copy of `plans/` outside the repository**, with WO-4.5 set to 🔨 and all five of its
open boxes marked — which is what the tree will actually look like ~Sep 13. `WO-6.4 → WO-4.5 → WO-4.3`:

```
$ node tools/wo-gate.mjs WO-6.4          # run in the scratchpad copy
  depends WO-6.3   ✅ DONE
  depends WO-4.5   🔨 IN PROGRESS   <-- code-complete; 6 lines 📆
  depends WO-3.26  ✅ DONE

NOTE | dependency WO-4.5 is 🔨 IN PROGRESS and every open Acceptance line on it is 📆 — code-complete, so it does not gate WO-6.4. …
NOTE |   📆 WO-4.5  plans\work-orders\phase-4-signals.md:491  Logging a contact about a concern removes that student from that signal for 1…
NOTE |   📆 WO-4.5  plans\work-orders\phase-4-signals.md:493  The cooldown reads the log rather than a separate suppression store — verify…
NOTE |   📆 WO-4.5  plans\work-orders\phase-4-signals.md:495  The quiet-middle list excludes anyone flagged, praised, or contacted this ter…
NOTE |   📆 WO-4.5  plans\work-orders\phase-4-signals.md:496  Two consecutive weekly runs on real data produce visibly different concern li…
NOTE |   📆 WO-4.5  plans\work-orders\phase-4-signals.md:497  Suppressed hits are recoverable and counted, never silently dropped.
NOTE |   📆 WO-4.3 (through WO-4.5)  plans\work-orders\phase-4-signals.md:257  Running the praise list two weeks apart on real data surfaces a materially di…
PASS | gates clear for WO-6.4
exit=0
```

Both hops named; the far one carries `(through WO-4.5)`. **The whole chain is stated** — a two-hop
defer that read like a one-hop pass would be worse than the refusal it replaced.

**(b) A plant**, *"a two-hop defer names both hops, and says which one it was reached through"* —
green, and red against the pre-WO-1.28 script. It asserts the far hop's own box text and the literal
`WO-9.7 (through WO-9.9)`, so a build that reported only the near hop fails it.

`calendarHold()` recurses with a `seen` set, so a cycle in the `**Depends on**` graph terminates.

### 7. `--self-check` passes with more plants than today, all new ones named in its summary — met

**18 → 24.** Final run on the delivered tree:

```
ok   | 📆 on every open line of a 🔨 dependency stops it gating, and a gate work order still refuses it
ok   | 📆 closes nothing at tick time — the line stays [ ] and holds the work order at 🔨, exactly as 👤 does
ok   | one marked and one unmarked open box still FAILs — the mark is on the line, not the work order
ok   | only 🔨 qualifies — ⬜, 🤖 CLAIMED, 🚫 STRUCK and ⏳ DEFERRED are unaffected however their boxes are marked
ok   | a two-hop defer names both hops, and says which one it was reached through
ok   | a 🔨 dependency with NO open line at all is not code-complete — it is a work order nobody ticked

  24 plants, 24 caught, 0 missed.
…
PASS | 24 of 24 plants were caught.
exit=0
```

The eighteen that were there before are all still green. The closing summary names the six:

```
  as satisfied. And WO-1.28's SIX, which are the first here to run gate()'s dependency
  walk at all: 📆 on every open line of a 🔨 dependency stops it gating and a GATE work
  order still refuses the same dependency on the same tree in the same plant; 📆 closes
  nothing at tick time, the line staying [ ] and the status 🔨; one marked and one
  unmarked open box still FAILs; ⬜, 🤖, 🚫 and ⏳ are unaffected however their boxes are
  marked, with 🚫/⏳ keeping WO-1.21's "will never be ✅ DONE" wording; a two-hop defer
  names both hops and which one the far one was reached through; and a 🔨 dependency
  with NO open line is refused rather than deferred over an empty list.
```

The **sixth** plant is not in the work order's list and is a fence I added: a 🔨 work order with
**nothing open** is refused rather than deferred. "Every open line is marked" is trivially true of an
empty list, and a defer reported over nothing to wait for reads exactly like a pass. The right answer
is the old refusal, which sends the reader to `--tick`.

The summary's *"NOT covered"* paragraph was narrowed rather than deleted: `gate()`'s **dependency**
walk came off that list and its **ordering** walk stayed on, and `isGateWorkOrder()`'s `gates.md`
arm was added to it — the six plants reach only the `WO-G` ID arm.

**Every new plant is proved able to fail.** Two go red against the pre-WO-1.28 script
(`--self-check --against <the script as of c6a1a4b>` → `22 caught, 2 missed`); the other four assert
*refusals* that the old script also makes for a different reason, so each was proved against a
one-line mutation of the **new** code. Five mutations, each reddening exactly the plant that names it
and nothing else, all driven with `--against` over copies in the scratchpad so no repo file was ever
edited. All five are in `tools/README.md`'s mutation table.

### 8. `--audit` passes, and every work order's parsed fields are unchanged — met, with a count correction

**The tree holds 142 work orders, not 140** — the Acceptance line's figure was the count on the day
it was written, before WO-1.28 and one other were booked. The dump covers all 142.

Captured **before the first edit**, using `wo-gate.mjs`'s own parser (a throwaway that imports
`allWorkOrders()` from a copy with `REPO` pinned; kept in the scratchpad, nothing written to `tools/`):

- `diff audit-before.txt audit-after.txt` → **identical**. `--audit` exits 0 and prints
  `PASS | every fragment matches exactly one roadmap box, every **Owes** pointer lands on an open
  box, …` before and after, byte for byte.
- `diff fields-before.txt fields-after.txt` → **identical**, 142 rows. Each row is
  `ship · status · statusRaw · size · flag · dependsRaw · owesRaw · blocks · target · closesRoadmap ·
  amendsRoadmap · unknownFields · strayRoadmapLines · box count · ticked count · rehome pointers`.
- `diff boxes-before.txt boxes-after.txt` → **5 of 896 Acceptance boxes differ**, and they are exactly
  the five Phase 4 lines this work order marked. Nothing else in the directory moved.

On the **final** tree the only additional header-field change across all 142 is WO-1.28's own
`ticked=0 → ticked=9`, from this run's ticks.

### 9. Phase 4's Acceptance lines carry the right marks — met, with two calls named

Phase 4 held **26** Acceptance boxes and **no `👤` on any of them** — the phase never had WO-1.25's
Phase 6 sweep. Five are now marked:

| | Line | Mark | Why |
|---|---|---|---|
| WO-4.2 | `:142` *Every flag is reproducible by hand … Verify all nine.* | 👤 | Its own note: closed *"by the owner, against a test install"*; four of the nine *"were worked by hand on the device"* |
| WO-4.3 | `:257` *Running the praise list two weeks apart on real data …* | 📆 | Wants a fortnight of a term that starts Sep 2 |
| WO-4.4 | `:378` *An entry is logged in under five seconds from the roster.* | 👤 | *"a stopwatch and a thumb: run by the owner on the iPad"* |
| WO-4.4 | `:405` *Marking a student absent for the Nth time surfaces … a plan clause* | 👤 | *"The thumb readings are 👤 — TESTING.md § WO-4.4"* |
| WO-4.5 | `:496` *Two consecutive weekly runs on real data …* | 📆 | Wants two weeks of a real term |

The mark goes **straight after the checkbox**. That is the convention § "Acceptance-line marks"
states; the parser accepts it anywhere on the line, because `👤` is written at both ends across this
directory depending on whether the whole line or one clause is the human's, and a position rule
invented now would silently unmark half of them. Code spans are stripped first, so prose *about* the
mark is not a mark — the same rule `→ WO-x.y` markers already carry, and the reason § "Acceptance-line
marks" and this report can discuss 📆 without becoming deferred boxes.

**Swept mechanically, not by eye.** All 26 boxes were re-read through the parser's own list-walking
logic and matched against `/real data|real term|a fortnight|two weeks apart|weekly runs|by hand|the
owner|a thumb|iPad|stopwatch|real class/i`. Seven hits; five are marked above. The other two are
**named rather than marked, deliberately**:

- **WO-4.3 `:271`** *"Every praise hit's explanation contains the delta and the window it was measured
  over."* — matched on *"the owner"*, which appears only in the note saying the box goes back to
  `- [ ]` **if** the owner reads the line as requiring a numeric delta on all five rules. That is a
  pending interpretive question about a **closed** box, not evidence the box is waiting for. A 👤
  there would claim a human closed what a fourteen-hit harness sweep closed.
- **WO-4.4 `:400`** *"Behavior notes are suppressed in presentation mode."* — matched on *"the owner's
  ruling of 2026-08-20"*, cited as the reason the feature has the shape it has, not as its evidence.
  It was measured as an absence from the whole rendered page.

Both are recorded in WO-1.28's own **Where this stands** block so the next sweep does not
re-litigate them in silence. WO-4.1's five lines match nothing (its *"Every hit carries real
numbers"* means non-placeholder numbers, not real-classroom data) and WO-4.5's other four boxes are
ordinary buildable lines.

---

## Verification, in full

| Command | Result |
|---|---|
| `node tools/verify-shell.mjs` | `1156 checks · 1156 passed · 0 failed · 0 skipped`, 34,066 lines, 29.5 lines per check, **391s**, **exit 0** |
| `node tools/wo-sweep.mjs` | `33 checks · 30 passed · 0 failed · 3 to review`, **exit 0** |
| `node tools/wo-gate.mjs --audit` | `PASS`, **exit 0** |
| `node tools/wo-gate.mjs --self-check` | `PASS | 24 of 24 plants were caught`, **exit 0** |

`verify-shell.mjs` **ran to completion and I read its exit code** — it is not a prediction. Its count
is unmoved from WO-4.3's and WO-4.4's runs, which is correct: this work order touches no `src/`, no
`index.html`, no `sw.js`, and adds no harness check. **No harness check was added and none was
needed** — `verify-shell.mjs` drives a browser and this work order changes a tracker tool, whose own
check is `--self-check` by `plans/verification-tooling.md` § "The check on `wo-gate.mjs` is a flag
inside `wo-gate.mjs`". Writing a second harness for it is the thing that document forbids.

The sweep's three `to review` are the standing three — sensitive field names outside `src/backup.js`,
due-date/late-missing co-occurrence, and a mockup banner disagreeing with the build. None is this
work order's; none of the files behind them was touched.

`verify-shell.mjs` and the first `wo-sweep.mjs` were run before two cosmetic edits landed
(stripping a doubled 📆 out of one output line, and a `1 line(s)` → `1 line` grammar fix). `wo-sweep`,
`--audit` and `--self-check` were **all re-run afterwards on the final tree** and are the figures
above. `verify-shell.mjs` was not re-run: it reads `index.html`, `src/` and `sw.js`, none of which
this work order touches at all, so a second 391-second run would have measured the same bytes.
**Said rather than assumed** — if the verifier wants it re-run on the exact final tree, it is one
command and nothing in this work order can change its answer.

## Not verified — needs a human

**Nothing here needs an iPad, and I ticked no 👤 line.** Every Acceptance line on WO-1.28 is a
command's output, and every one of them was run and read.

The three `👤` marks I **added** to Phase 4 are records of sittings the owner already ran and that are
already written up in `TESTING.md` §§ WO-4.2 and WO-4.4 — I did not tick those boxes (they were
already `[x]`), and I did not run those readings. If the owner disagrees that any of the three was
closed by a human on hardware, the mark comes off; the evidence I used is each line's own dated note.

## Left undone, and the reason

- **`CHANGELOG.md`** — not written, by rule. A draft is at the foot of this file.
- **The `**Status**` line** — left at 🤖 CLAIMED. `ROUTING.md` gives the status tick to the
  orchestrator after a verifier PASS.
- **WO-4.5 is not built.** Out of scope, literally: this work order unblocks it and stops.

## Decisions the work order did not settle

**1. Where the mark is documented — a section of its own, not a row in § "Header fields."**
The work order asked me to pick and say why. Two reasons. That table describes the **header
paragraph** and says so at its own top; its column heading is *"Read by the tool as"* for **fields**,
and a box mark is not a field — a row there would be a category error the next reader has to undo.
And `👤` **has never been defined anywhere in `plans/work-orders/`** — it is defined in `TESTING.md`'s
legend, for `TESTING.md` lines. The new mark's entire argument is *"it behaves identically to 👤 at
tick time and differently at gate time"*, and a reader cannot check that claim against a mark that is
nowhere written down. So § "Acceptance-line marks" defines **both**, in one table, immediately after
§ "Header fields".

**2. The glyph is 📆, not 📅 and not ⏳.** `src/attendance.js` and `src/classes.js` already label the
Days off and Terms doors `📅` — a glyph doing two jobs in one repository is a glyph a grep cannot
separate. `⏳` was refused for a harder reason: it is the `⏳ DEFERRED` status word **and** the roadmap
`BOX_MARK`, and both mean a **dead end** where this means a **wait with a date on it**. Blurring
WO-1.21's distinction is the one thing this mark must not do.

**3. Mark position is a convention, not a parser rule.** § "Acceptance-line marks" says *write it
straight after the checkbox*, and the five Phase 4 lines are written that way. The parser accepts it
anywhere outside backticks, because `👤` is written at both ends across this directory and a position
rule invented now would silently unmark half of them. Over-reading a mark costs a NOTE; under-reading
one costs a gate.

**4. `isGateWorkOrder()` asks two questions joined by OR** — a `WO-G` ID, or the file being
`gates.md`. They agree on all four real gate work orders. The OR is the safe direction and the
asymmetry is written at the function. The plants reach only the ID arm; the `gates.md` arm is proved
by mutation and is named in the run's own "not covered" list.

**5. An open re-homed line still counts as open** when 📆 is being asked about. That keeps
`**Owes**` untouched in both directions, which the Out-of-scope line requires, and it is the
conservative reading — a `→ WO-x.y` line that is not also `📆` blocks, exactly as any other unmarked
open box does.

## Out-of-scope temptations I declined, and one thing worth booking

- **`ROUTING.md` says *"never tick a 👤 line"* and now has a second mark to say it about.** It is not
  in this work order's Deliverables and I left it alone. The tool refuses the tick either way and
  § "Acceptance-line marks" states the rule, so nothing is broken — but the sentence a dispatch brief
  actually quotes lives in `ROUTING.md` § "Implementers may tick", and it should eventually read
  *"never tick a 👤 or 📆 line."* **Worth a one-line row.** `AGENTS.md` and `CLAUDE.md` § Conventions
  are the same question and the same answer.
- **WO-4.3's `**Owes**` field names no work order.** It reads
  `**Owes** the real-data box (Acceptance line 3) — and nothing else; the 👤 sitting is green,
  2026-08-25` — a **field used as prose**, which is exactly WO-1.27's class of defect and is why
  `--audit` is silent about it (`rehomesOf()` finds no `WO-` token, so there is no pointer to
  resolve). With 📆 on the box it describes, the field is now also **redundant**. Out of scope by
  name — *"`**Owes**` is not touched, extended, or reinterpreted"* — so I did not touch it. It is the
  obvious next thing to look at, and it may be a second live instance for WO-1.27's fixture.
- **§ Ship 3's table cell for WO-4.3** could point at the mark. I checked whether leaving it creates
  drift and it does not: the running order says *"rows 4 and 5 are rowed twice on purpose — built
  before the term, closed after it"*, which is still true and is now enforced rather than only
  stated. The claim that *the tool cannot express this* lives in WO-1.28's own **Why it exists**,
  where it is a dated record of the day it was written.
- **An `--audit` clause for a 📆 on a ⬜ work order** (a mark that means nothing where it sits) was
  considered and left out. Not in Deliverables, and the gate rule already ignores it. It would be a
  cheap addition if a stray mark ever turns up.

## Draft `CHANGELOG.md` entry — for the teacher to accept, reword or discard

> **A work order can now say that a line is waiting on the calendar, and stop blocking work that is
> ready to build.** WO-4.3's praise column shipped on 24 August with one Acceptance line open that no
> amount of building can close — it wants a fortnight of a real term. The gate tool read that as
> *unfinished* and refused WO-4.5, which needs nothing from WO-4.3 but its praise rules. An
> Acceptance line can now carry `📆`, the way it has always been able to carry `👤`: 👤 means *no
> headless browser can close this*, 📆 means *no build can close this*. A dependency whose every open
> line is 📆 reports as **code-complete** and stops gating the work orders that only need its code.
> It closes nothing — the box stays open, the work order stays 🔨 IN PROGRESS, and the Ship 3 **gate**
> refuses it outright, because the gate is where the wait is actually paid.
