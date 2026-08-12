# WO-2.24 — nothing in the tree notices if the shared date reset is deleted · result

**Implementer** Claude (work-order-implementer), Opus tier · **Date** 2026-08-12
**Branch** `phase/3-gradebook` · **Nothing committed, nothing pushed** — the brief did not ask for it.

---

## Against the Acceptance list, one line at a time

### 1. `verify-shell.mjs` asserts computed `appearance` on all three surfaces, and the run is green — **met**

`node tools/verify-shell.mjs` on the tree as it now stands, read from the run's output after the
process exited:

```
598 checks · 598 passed · 0 failed · 0 skipped
14,398 lines · 24.1 lines per check · 193s
```

Exit 0. The baseline immediately before the three checks were added was
`595 checks · 595 passed · 0 failed · 0 skipped`, 14,295 lines, 196s.

The three checks, each asked at a point where the dialog was **already** open for other reasons
rather than at a fourth way in:

| Surface | Selector | Check at | Fields |
|---|---|---|---|
| Term editor | `#termList .term-date` | `tools/verify-shell.mjs:2558`, in *classes & terms*, right after the check that Homeroom's one term stores its dates | *Starts* and *Ends*, 2 of 2 |
| Days-off form | `#daysOffModal .term-date` | `tools/verify-shell.mjs:9780`, in the WO-2.3 sub-section, between opening the panel and filling it | `daysOffFrom`, `daysOffTo`, 2 of 2 |
| Student editor | `#supportsReviewDate` | `tools/verify-shell.mjs:5387`, in *support details*, while the plan panel is revealed | plan *Review date*, 1 of 1 |

That is all **five** fields that depend on the shared rule alone, not the three a minimal reading
would have allowed. Their PASS details on the green run:

- *"the term editor is open = true, 2 of 2 field(s) found :: term-date [date] appearance none,
  -webkit-appearance none · term-date [date] appearance none, -webkit-appearance none"*
- *"the days-off panel is open = true, 2 of 2 field(s) found :: daysOffFrom [date] appearance none,
  -webkit-appearance none · daysOffTo [date] appearance none, -webkit-appearance none"*
- *"the support panel is revealed on an open student editor = true, 1 of 1 field(s) found ::
  supportsReviewDate [date] appearance none, -webkit-appearance none"*

**The first Trap is answered by construction, not by luck.** The shared reader `dateResetOn()`
(`tools/verify-shell.mjs:368`, block comment from `:324`) returns `ok` only when *all* of: the
caller's own open-state expression is `true`; the selector matched exactly the expected count; each
element is `type="date"`; each is laying out at least one client rect; each computes `display` other
than `none` and `visibility` other than `hidden`; and each computes `appearance` **and**
`-webkit-appearance` to `none`. The expected-count clause is what stops an `every()` over an empty
list reading as green. For the student editor the open-state expression is the pattern the brief
pointed at rather than an approximation — `supportsBody.classList.contains('hidden') === false`
**and** `supportsRevealBtn[aria-expanded] === 'true'`, plus `#studentModal` not hidden.

### 2. Deleting the BASE rule turns the run red, and the failure names field and sheet — **met**

Run three times over the course of the work, restored every time; the numbers below are the **third**
run, made against the final tree so that nothing in this record is quoted off a tree that no longer
exists. The edit each time was the same single line removed from `src/shell.css`'s BASE section,
comment left in place, which is the shape a "tidy" actually takes:

```
$ git diff --stat src/shell.css
 src/shell.css | 1 -
 1 file changed, 1 deletion(-)
```

```
598 checks · 595 passed · 3 failed · 0 skipped
14,398 lines · 24.1 lines per check · 193s
```

Exit **1**. The three red are exactly the three new checks; nothing else in the harness moved.
**The observed failure text, verbatim** (wrapped here for reading — the harness prints each as one
line):

```
FAIL | the term editor's Starts and Ends carry the shared date reset as a live computed style — the
value that goes back to the platform's own the moment src/shell.css loses that one line, which is
why it is a style being read here and not a height: this engine gives a date input the height its
stylesheet asked for either way, and the height these fields actually draw at is the iPad's answer
and nobody else's  :: the term editor is open = true, 2 of 2 field(s) found :: term-date [date]
appearance auto, -webkit-appearance auto · term-date [date] appearance auto, -webkit-appearance auto
— the only rule in this tree that puts `none` there is input[type="date"] { -webkit-appearance:
none; appearance: none; } in src/shell.css's BASE section

FAIL | the plan Review date carries the shared date reset as a live computed style too — the fifth
field in the app that has no copy of that rule of its own, so deleting src/shell.css's one line
turns this red; what it does not touch is the height the field is drawn at, which this engine gets
right whether the rule is there or not and which only the device can settle  :: the support panel is
revealed on an open student editor = true, 1 of 1 field(s) found :: supportsReviewDate [date]
appearance auto, -webkit-appearance auto — the only rule in this tree that puts `none` there is
input[type="date"] { -webkit-appearance: none; appearance: none; } in src/shell.css's BASE section

FAIL | the days-off form's From and To carry the shared date reset as a live computed style, so a
tidy-up of the one input[type="date"] rule in src/shell.css goes red here rather than nowhere — a
claim about the cascade only, never about how tall or wide these two fields come out, which is a
question this browser answers differently from the one on the teacher's desk  :: the days-off panel
is open = true, 2 of 2 field(s) found :: daysOffFrom [date] appearance auto, -webkit-appearance auto
· daysOffTo [date] appearance auto, -webkit-appearance auto — the only rule in this tree that puts
`none` there is input[type="date"] { -webkit-appearance: none; appearance: none; } in
src/shell.css's BASE section
```

**The restore is confirmed by hash, not by eye:**

```
$ git checkout -- src/shell.css
$ git diff --stat -- src/ index.html sw.js      # prints nothing
$ git hash-object src/shell.css                 09f21b55bca93b7bbb4b6b7fe1f84bcccc0fa065
$ git rev-parse HEAD:src/shell.css              09f21b55bca93b7bbb4b6b7fe1f84bcccc0fa065
$ sed -n '85p' src/shell.css
input[type="date"] { -webkit-appearance: none; appearance: none; }
```

`git status --porcelain` afterwards lists only `TESTING.md`, `tools/README.md`,
`tools/verify-shell.mjs`, `plans/work-orders/phase-2-attendance.md` (already modified when I
arrived — the `--start` claim) and the three untracked dispatch files. **Nothing under `src/` is
modified.**

### 3. Each check's message draws the distinction in its own words — **met**

No message cites WO-2.23, the Trap, a line number or another check. Each states the same two things
in its own surface's terms: `appearance` is a value that *changes* when the rule goes, which is why
the check can fail; and the height is *not* being claimed, because this engine draws the field to
spec either way and only the device can answer it.

- Term editor: *"…which is why it is a style being read here and not a height: this engine gives a
  date input the height its stylesheet asked for either way, and the height these fields actually
  draw at is the iPad's answer and nobody else's."*
- Days-off: *"…a claim about the cascade only, never about how tall or wide these two fields come
  out, which is a question this browser answers differently from the one on the teacher's desk."*
- Review date: *"…what it does not touch is the height the field is drawn at, which this engine gets
  right whether the rule is there or not and which only the device can settle."*

The long form is in the block comment over `dateResetOn()`, under a heading *WHY A COMPUTED STYLE AND
NOT A HEIGHT*. A reader arriving holding the Trap gets the answer from the check line alone and the
argument one jump away.

### 4. `tools/README.md`'s count and `TESTING.md` updated from a run — **met**

Both numbers came off summary lines read after runs exited; neither is arithmetic on the old one.
(The line-count figure was re-taken twice, because two rounds of comment corrections moved it —
14,391 → 14,394 → 14,398 — and each time I re-ran rather than adjusting the number by hand.)

- Call-site sentence at `tools/README.md:636`: **596 → 599**, with a clause naming WO-2.24's three
  literal sites in three sections, none inside a loop.
- New **598 at WO-2.24** paragraph at the end of the count series — WO-3.12's precedent of appending
  the newest rather than inserting it in numeric order — recording the summary line plus three
  sub-paragraphs: why a style and not a height, how the open state is asserted, and the deletion that
  was watched.
- Gap paragraph: `596 − 595 = 1` → **`599 − 598 = 1`**, unmoved for a third work order.
- `TESTING.md` gains § WO-2.24, modelled on § WO-2.22: five acceptance blocks with evidence, the
  failure text tabulated, and a closing note that there is no 👤 line here *because* the one
  device-only claim is the one these checks refuse to make.
- `TESTING.md` § WO-2.23's *"why no check was booked"* note gains a forward-pointing paragraph,
  written as a continuation rather than a reversal: the refusal there was of a **height** check and
  every word still stands; what landed is the last bullet's **computed-style** claim carried to five
  more elements. It ends by saying the 👤 lines above are untouched.

The sweep forced the update and I let it: before the README edit it printed *"FAIL | the recorded
`check()` call-site count matches the harness :: tools/verify-shell.mjs has 599 `check()` call
site(s), up 3 on the 596 recorded at tools/README.md:636 — update that line, and the executed-check
count in the paragraph beside it, from a run rather than by arithmetic"*, exit 1.

### 5. `node tools/wo-sweep.mjs` prints what it printed before, but for the count — **met**

```
17 checks · 16 passed · 0 failed · 1 to review
```

Exit 0. The one REVIEW is the standing sensitive-field-name sweep at **181 mentions** across the same
thirteen files WO-2.22 recorded, byte-identical wording. The two §11 clauses read *"599 `check()`
call site(s) in tools/verify-shell.mjs, matching tools/README.md:636"* and *"599 call-site line(s) in
tools/verify-shell.mjs, none holding a second `check(`"*, against 596 in both before. Nothing else
moved: no CSS touched, so *"no new CSS selectors — 0 added line(s) in tracked src/\*.css"*; no `SHELL`
file touched, so *"planbook-shell-v44 was set at 0345065; no SHELL file has changed since"* and
**`sw.js` is correctly not bumped**.

---

## One thing I found that changes the record, and that the work order's own premise got wrong

**The work order says these five fields "live behind `.hidden` dialogs the harness never opens, so
nothing measures them and nothing ever has."** That was true when WO-2.24 was written and it is not
true now: **WO-2.21 landed in between**, and the coarse sweep opens all three of these dialogs and
asserts 44px on every control in them — two of its three check names say *"date fields included"* and
*"the kind picker and review date included"* in as many words.

That does not weaken the case for this work order. It is the case, measured. On the deleted-rule run
those three height checks were **green in the same run** where the three new style checks went red:

```
PASS | every control in the term editor measures >=44px, date fields included
        :: measured 22; under = []
PASS | every control in the days-off panel measures >=44px on a coarse pointer, date fields and
        class picker included  :: measured 13 (including 6 class button(s)); under = []
PASS | every control in the support panel measures >=44px, the kind picker and review date included
        :: measured 18; under = []
```

So WO-2.23's Trap — *a height check written for this defect passes on the broken tree* — has stopped
being a prediction about a check nobody wrote. It is a reading off three checks that already exist,
taken on the broken tree, in the same run as the red. I have recorded it in all three places the
argument lives: the helper's block comment, `tools/README.md`'s WO-2.24 paragraph, and `TESTING.md`
§ WO-2.24 (which says the premise was re-measured rather than inherited, in the WO-2.22 shape). It
cost two extra harness runs to correct prose I had already written on the stale premise, and it was
worth them.

---

## What I could not verify

- **Everything a real iPad would answer.** No 👤 line is ticked and none is touched. The rendered
  height, width and picker behaviour of these seven fields stay owed to a human under `TESTING.md`
  § WO-2.23. The design of these three checks is to *not* claim any of it: if the shared rule were
  present and iOS still drew the widget, they would be green and the app would still be wrong — which
  the check messages and both documents say out loud rather than leave implied.
- **That the checks would notice the *other* duplicate going.** Deleting `src/assignments.css`'s copy
  of the same two declarations turns **nothing** red: the shared rule still puts `none` on
  `.assign-field-date`, so WO-3.17's existing check stays green. That is the mirror of the hole this
  work order closed, and it is left open deliberately — that duplicate exists for discoverability and
  for keeping two work orders' diffs apart, not because the cascade needs it. **I did not run that
  mutation.** It is reasoning from the cascade, not a measurement, and I am flagging it as such. A
  possible follow-up, not something this work order should have grown to cover.
- **Whether `appearance: auto` is what every Chromium build reports** with the rule gone. I observed
  `auto` three times on the Edge build this machine runs. The checks assert `=== 'none'`, so nothing
  depends on the failing value being any particular string.

## Things I was tempted by and did not do

- **Folding in the height.** The dialogs were open in front of the harness and the boxes were one
  property away — and, as above, the 44px assertions on exactly these fields were passing on the
  broken tree while I watched. Out of scope, and demonstrably useless for this defect. The reader
  goes further than declining to assert the height: it does not even *print* box dimensions, so no
  number in a detail line can drift into the claim later.
- **Fixing a stale line number in the allowlist.** `tools/README.md` and `tools/wo-sweep.mjs` both say
  the one non-line-anchored call site is at `tools/verify-shell.mjs:10773`. It was already at `:10838`
  at HEAD — stale before I arrived — and my insertions moved it to `:10941`. Editing
  `tools/wo-sweep.mjs` is outside this work order, and correcting only the README would leave the two
  files disagreeing, which is worse. I noted the drift in a parenthesis in `tools/README.md` and left
  both numbers alone; nothing resolves that reference programmatically, it is illustration.
- **Touching the reset or `.assign-field-date`'s duplicate.** Neither is modified; `src/` is
  byte-identical to HEAD.
- **Flipping the work order's Status to ✅ DONE.** `plans/work-orders/README.md` says the Status field
  is written by `--start`, `--release` and `--tick`, and a cold verifier has not read this yet. I
  ticked the five Acceptance boxes with a short evidence note on each and left Status at
  `🤖 CLAIMED — 2026-08-12` for the tooling.
- **Writing the `CHANGELOG.md` entry.** Drafted below for the teacher instead.

## Decisions the work order left open, and which way I went

1. **Three call sites rather than one.** The obvious shape is a helper that calls `check()` itself —
   one call site, three results. I refused it: the sweep counts *call-site lines*, so that shape would
   have moved the recorded count by 1 while adding 3 checks, flipped the documented call-site/executed
   gap negative, and bought nothing. Instead `dateResetOn()` returns `{ ok, detail }` and each site
   writes its own `check()`, which is the idiom `homeVsDoc()` already set in this file — and it is
   what lets each surface phrase Acceptance line 3 in its own words.
2. **Where the checks live.** Inline at the three existing dialog-open points rather than in a new
   section at the foot of the file. A new section would have had to re-open all three dialogs: a
   fourth way in, three more fixtures, three more chances to measure a screen that was not up. The
   cost is that the WO-2.24 checks are scattered; the helper's block comment is the one place that
   holds the argument, and all three call sites point at it by name.
3. **Five fields, not three.** The Deliverable names "a `.term-date` in the term editor" and "a
   `.term-date` in the days-off form"; both selectors match the pair rather than one of them, so all
   five unguarded fields are covered by the same three checks. Each asserts its exact expected count,
   so a field appearing or disappearing is a red rather than a silent widening.
4. **Where the README paragraph goes.** At the end of the count series, following WO-3.12, rather than
   inserted in numeric order between "591 at WO-2.21" and the call-site sentence. Chronological append
   keeps the newest run findable and leaves the call-site sentence at line 636, which is where both
   `TESTING.md` and the sweep's own output name it.

## Files changed

| File | Change |
|---|---|
| `c:\dev\planbook\tools\verify-shell.mjs` | New `dateResetOn()` helper with its block comment (`:324`–`:393`, after `INSTALL_WALKER`); three checks at `:2558`, `:5387`, `:9780`. +103 lines, no existing check altered, no existing line removed |
| `c:\dev\planbook\tools\README.md` | Call-site count 596 → 599 with a WO-2.24 clause and a note on the drifted `else check(` line number; gap paragraph `599 − 598 = 1`; new **598 at WO-2.24** paragraph with three sub-paragraphs |
| `c:\dev\planbook\TESTING.md` | New § WO-2.24 with five ticked acceptance blocks, the failure text, and the re-measured premise; a forward-pointing paragraph in § WO-2.23's *"why no check was booked"* note |
| `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` | WO-2.24's five Acceptance boxes ticked with evidence notes. Status left at `🤖 CLAIMED` |

**Not changed:** anything under `src/`, `index.html`, `sw.js`, `tools/wo-sweep.mjs`, `CHANGELOG.md`.
`node tools/wo-gate.mjs --audit` passes — *"every fragment matches exactly one roadmap box, every
**Owes** pointer lands on an open box, and every dashboard row matches its own boxes"* — with the
dashboard unchanged, since WO-2.24 closes no roadmap box.

## Changelog entry, drafted for the teacher to accept, reject or rewrite

> **Tooling.** The one CSS rule that stops iOS drawing its own date widget is now watched. Five date
> fields — the term editor's two, the days-off form's two, and the plan review date — depended on it
> with nothing checking them, so deleting it as a "duplicate" left the whole suite green. Three new
> checks open those dialogs and read the style off the fields; the run goes red if the rule goes.
> They say nothing about how tall the fields draw, which is still an iPad question, and the run
> proved why: the 44px checks on those same fields passed on the broken tree.

---

*Runs behind this report, all read from their output files after the process exited: five
`verify-shell.mjs` runs — baseline (595 green), post-change (598 green), and three deletion runs
(598 · 595 passed · 3 failed, exit 1) either side of two comment corrections — and `wo-sweep.mjs`
four times, ending at `17 checks · 16 passed · 0 failed · 1 to review`, exit 0.*
