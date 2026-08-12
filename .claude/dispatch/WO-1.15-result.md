# WO-1.15 — the restore compare cannot see what it is about to delete · implementation result

**Route** Claude, Opus tier (work-order-implementer) · **Dispatch** 2026-08-12
**Work order** `plans/work-orders/phase-1-shell-store-roster.md` § WO-1.15, now `🔨 IN PROGRESS`
**Verification** `verify-shell.mjs` **636 of 636, 0 failed, 0 skipped**, exit 0 · `wo-sweep.mjs`
**17 checks, 15 passed, 0 failed, 2 to review**, exit 0. Both quoted below from output I read.

---

## What shipped

Three things, and nothing else:

1. **`describe()` counts the record.** Four new numbers on both sides of the compare — recorded
   meetings, attendance marks, assignments, score cells — printed in the panel's existing ` · `
   grammar, two lines under the roster line. `src/backup.js`.
2. **A new paragraph in the same dialog** (`#restoreConfirmLoss`) that names, in words, what
   replacing this document with that file would cost — **only when the stored side holds more of the
   record than the file does.** The subtraction is done for the reader.
3. **`ledgerCountsIn(doc)` in `src/attendance.js`**, so "what is a meeting" still has exactly one
   definition in this app.

No new screen, no new flow, no new button, and `confirmRestore()` is untouched — it is still the one
line in the module that writes to disk.

The sentence, verbatim from the run:

> The 2026-2027 school year on this device holds more than the file does. Replacing it loses 3
> recorded meetings, 3 attendance marks, 2 assignments and 3 scores, which this file does not have —
> and the only way back to that is a backup taken from this device. Check that this is the file you
> meant.

---

## Against the Acceptance list, line by line

### 1. `[x]` A backup holding zero marks, restored over a year holding a term of them, shows both counts **before** the button is pressed, and the counts differ on screen

**Verified, by measurement.** `verify-shell.mjs` check *"the compare counts the record on both sides
— meetings, marks, assignments and scores"* reads `#restoreCompare`'s two `.restore-side` cards while
the confirm is up and before anything is clicked. Verbatim detail from the green run:

```
on this device now: "On this device now2026-20271 class · 2 students3 recorded meetings ·
3 attendance marks2 assignments · 3 scoresLast saved Aug 12, 2026, 6:41 PM7 saves"
| in the backup file: "In the backup file2026-20271 class · 2 students0 recorded meetings ·
0 attendance marks0 assignments · 0 scoresLast saved Aug 12, 2026, 6:41 PM5 saves"
```

Note `1 class · 2 students` on **both** sides: the fixture is the file itself with a record added, so
the roster matches by construction and only the record differs. That is the fixture the sixth
acceptance line asks for, and it is what makes the check able to fail against the build this replaces.

### 2. `[x]` The confirm text names what would be lost, not only what would be gained

**Verified.** Two checks, and the second is the one that matters:

- *"and the confirm says in words what would be lost, before the button is pressed"* asserts the
  paragraph is visible, names the year, names all four categories, and says what the way back is.
- *"what it names is the DIFFERENCE, not the count on this device — the reader does not subtract"*
  drives a second file holding 1/1/1/1 against a device holding 3/3/2/3, and the sentence reads
  `loses 2 recorded meetings, 2 attendance marks, 1 assignment and 2 scores`. A zero-record file
  cannot tell a difference from a count; this fixture exists only to separate them. Proved by
  mutation: printing the stored count instead of the excess turns exactly that one check red.

### 3. `[x]` A restore of a *different* year is unaffected — it is a normal, safe act and must not acquire a warning it does not deserve

**Verified, and I had to decide what "different year" means — see *Decisions* below.** Check
*"restoring a year this device does not hold is unaffected"*: a file for a year absent from the device
draws no warning, the outgoing card reads *"Nothing for 2031-2032 is stored here"*, and the button
reads *"Add 2031-2032"*. The Traps line's other half is checked beside it — *"a file holding as much
as this device, or more, gets no warning at all"* — with an own-backup of the same year (3/3/2/3 both
sides) and a file at 4/4/2/4 over a device at 3/3/2/3, both silent.

### 4. `[x]` No accommodation, medical or plan data appears in the panel, in either presentation mode

**Verified as far as a headless browser can, which here is all the way:** the panel cannot leak what
it never counts. The counted list is exhaustive on purpose — meetings, marks, assignments, scores —
and `supports` is deliberately absent, including as a bare number, with the reasoning written at
`describe()`. Check *"no support detail reaches the restore panel, in either presentation mode"*
searches the **whole dialog** (not only the two columns) for three sentinels — `epi-pen in the nurse
office`, `IEP`, `extended-time` — with the mode off and again with it on:

```
presentation off: 813 characters of dialog, sentinels found = [] | presentation on: 813 characters
of dialog, sentinels found = [] (all three are in the file and in the stored document, asserted here)
```

The presence of all three in both documents being described is asserted first, so this is not an
absence check over a student with nothing on file. The mode-off pass is the one that matters: with the
toggle off, support data is visible everywhere else in the app. **What I did not check by eye:** how
this panel looks on a projector. Nothing sensitive is in the DOM to look at, so I believe the risk is
structural rather than visual, but the projector is the owner's instrument.

### 5. `[ ]` 👤 On the iPad the panel still fits and the confirm button keeps its 44px — **NOT TICKED**

I have no iPad and did not tick it. What I can say, and what I cannot:

- **What I did:** added `.modal-body .restore-loss { font-size: 13px; }` to the
  `@media (pointer: coarse)` block **in the same pass** that added the rule. The paragraph is prose,
  not a control, so it takes the size bump the block gives `.class-delete-line`,
  `.backup-other-years` and `.restore-note`, not a 44px floor — the 44px beside it belongs to
  `.class-action-btn`, which both the Replace and Cancel buttons wear, and the existing coarse sweep
  measures those already.
- **What I cannot claim:** that the panel *fits*. The confirm grew four lines of text (two per side)
  plus a paragraph. At 390px the two cards stack (`.restore-side` is `flex: 1 1 200px`), so the real
  question is whether the dialog scrolls to reach the button — and headless Chromium has no thumb, no
  safe-area inset and no teacher in a hurry. `TESTING.md` § WO-1.15 carries four 👤 lines for that
  sitting, all unticked, including *"read the sentence cold, without knowing what it was going to
  say"*, which is the only real test of the prose.

### 6. `[x]` `verify-shell.mjs` gains checks for the new counts, proved against a fixture where the roster matches and the record does not

**Verified.** Eight checks, all inside the existing `backup & restore` section as instructed — no
second harness, no new section. `636 checks · 636 passed · 0 failed · 0 skipped`, 15,750 lines, 206s,
exit 0, up from 628 executed. Call sites 629 → 637; `tools/README.md`'s count sentence, its gap
paragraph and a new growth block were updated from the run rather than by arithmetic, and the sweep
confirms the number.

The fixture, and why it is shaped this way: the planted stored document **is** the run's own backup
file with a record dropped into it, so the two rosters are identical by construction. It is written
straight into IndexedDB rather than through `s.update()`, because the compare's outgoing side is
`readStoredDocument()` — a raw get — so the disk is the surface under test. It is lifted out first and
put back byte for byte, and the put-back is asserted (*"the WO-1.15 fixture is put back byte for byte,
so the sections below inherit nothing"*), because everything after that section reads the same year.

Three deliberate exclusions all live in one four-record fixture, which is what makes `3/3/2/3` a claim
rather than a number: one record carries `exception: 'dropped'` (not a meeting), one mark cell carries
`U` (not a mark), and `scores` is an object `count()` answers **0** for. **A naive counter reads
4/4/2/0 on that document, and all three errors point the same way — reporting a full gradebook as
nothing at stake.**

**Five mutations, each run against the whole harness, all reverted** (tabulated in `TESTING.md`
§ WO-1.15):

| Mutation | Result |
|---|---|
| every attendance record counted as a meeting | **4 red** (`4 recorded meetings`, and the difference check reads 3 where the fixture demands 2) |
| `count(doc.scores)` instead of `countScores()` | **4 red**, each printing `0 scores` on a document holding three |
| the warning fires on any difference (`!==`) rather than an excess (`>`) | **1 red**, the Traps line: *"a file at 4/4/2/4 over a device at 3/3/2/3: warning SHOWN"* |
| the sentence prints the stored count, not the excess | **1 red**, the difference check |
| every replace treated as dangerous | **1 red**, the Traps line, both halves |

`src/attendance.js` and `src/backup.js` were restored after each, and the **final green run above was
made on the tree as it now sits on disk**, after the last revert — not carried forward from before the
mutations.

---

## Commands, and their actual output

Both from runs I waited for and read:

```
$ node tools/verify-shell.mjs
636 checks · 636 passed · 0 failed · 0 skipped
15,750 lines · 24.8 lines per check · 206s
EXIT=0

$ node tools/wo-sweep.mjs
17 checks · 15 passed · 0 failed · 2 to review
```

The sweep's two REVIEWs are the standing ones and neither moved: the sensitive-field-name sweep at
**188 mentions** with the same file list as before this change, and `src/detail.js:349`. Its
CACHE-bump clause reads *"planbook-shell-v47 is not in any commit yet — the bump is uncommitted, which
is the rule being followed"*, and the coarse-block clause *"1 new selector(s), all covered"*.

`node tools/wo-gate.mjs --audit` also passes: *"every fragment matches exactly one roadmap box, every
**Owes** pointer lands on an open box, and every dashboard row matches its own boxes."*

---

## Files changed

| File | What |
|---|---|
| `c:\dev\planbook\src\backup.js` | `countScores()`, `andList()`, `describe()` grows four record counts, `wouldBeLost()`, the loss paragraph in `openRestoreConfirm()`, `LOSS_ID`, one import |
| `c:\dev\planbook\src\attendance.js` | `ledgerCountsIn(doc)` — meetings, notMeeting, marks, for a document that is not open |
| `c:\dev\planbook\index.html` | `#restoreConfirmLoss` in the confirm modal, and the comment above it |
| `c:\dev\planbook\src\shell.css` | `.modal-body .restore-loss`, base and coarse |
| `c:\dev\planbook\sw.js` | `CACHE` → `planbook-shell-v47` (three `SHELL` files changed) |
| `c:\dev\planbook\tools\verify-shell.mjs` | eight checks in the existing `backup & restore` section |
| `c:\dev\planbook\tools\README.md` | call-site count 629 → 637, the gap paragraph, a WO-1.15 growth block |
| `c:\dev\planbook\TESTING.md` | § WO-1.15: desk pass, the five mutations, four 👤 lines |
| `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` | five Acceptance lines ticked with evidence; status `🤖 CLAIMED` → `🔨 IN PROGRESS` via `wo-gate.mjs --tick` |

**Not committed and not pushed** — the brief did not say to. **`CHANGELOG.md` untouched**; a draft is
at the foot of this file.

---

## Decisions the work order did not settle

1. **"Materially more" has no threshold.** Any excess in any of the four categories raises the
   warning. A threshold would be a number in the code deciding for the teacher how many of her own
   marks are worth mentioning, and the alternative failure — a warning on a document that differs by
   one score — is a warning that is *true*. The Traps line's concern is the **safe** case, and the safe
   cases are equality and a richer file, both of which are silent by construction because the test is
   an excess rather than a difference. Written down at `wouldBeLost()`.

2. **A "different year" that the device *does* hold still warns.** Acceptance line 3 says a restore of
   a different year must not acquire a warning it does not deserve; I read that as the safe act —
   adding a year this device has nothing for — and that case is silent. But if the device holds
   2026-2027 with a term in it and an empty 2026-2027 file arrives while 2027-2028 is open, that
   destroys the term just the same, and the warning fires. The test is stored-vs-file for the year
   **named in the file**, never the year on screen, which is also how `restoreDocument()` decides what
   it replaces. If the owner reads line 3 more broadly, this is the line to change.

3. **`U` is not counted as a mark.** `docs/data-model.md` says a `U` counts as an absence *wherever
   attendance is counted* — but also that it never appears in a total, because it means nobody has
   looked at that student yet. On a screen whose job is to say how much is at stake, counting them
   would let a half-taken class report twenty-five marks the teacher never made. The panel therefore
   excludes them, via `codeOf()` so that a pre-WO-2.10 document with bare-string cells counts the
   same. Written down at `ledgerCountsIn()`.

4. **Days that did not meet are counted and not shown.** `ledgerCountsIn()` returns `notMeeting`
   because it is free and `src/classes.js`'s delete confirm names it, but the Deliverables list is
   exhaustive on purpose and a dropped class holds nothing anybody typed. It is not on the panel.

5. **`ledgerCountsIn()` went in `src/attendance.js`, not `src/backup.js`.** Trap 2 said to find where
   the arithmetic lives and reuse it. Nothing exported took a *document* — every reader there goes
   through `stateOf()`/`getDoc()` — so this is a new export in the module that owns the definition
   rather than a second definition in the backup module. It also means `src/backup.js` now imports a
   screen module for the first time; the import is acyclic (`attendance.js` imports neither
   `backup.js` nor anything that does) and the reason is commented at the import. The alternative —
   `!r.exception` written out in `backup.js` — is the copy that could agree with itself and disagree
   with the ledger in the dialog that decides whether a term survives.

---

## Proposed follow-up: `hasSomethingToLose()` omits `scores` (brief § 2, trap 4)

**Checked myself, and the brief is right.** `src/backup.js:1055` (was `:935`) reads:

```js
return count(doc.classes) + count(doc.students) + count(doc.assignments)
  + count(doc.attendance) + count(doc.log) + count(doc.events) + count(doc.templates) > 0;
```

`scores` is absent, and so are `passes` and `openPasses`. **Left alone, as instructed.** Proposed as
its own work order:

> **The backup nag cannot see a term of scores.** `hasSomethingToLose()` decides whether the strip
> appears, and it enumerates seven collections without `scores`, `passes` or `openPasses`. In practice
> a year holding scores holds assignments too, so the nag fires anyway and the defect is latent rather
> than live — which is exactly the kind that survives a rewrite. Two things make it worth booking. It
> would be a real hole the moment anything can delete an assignment while keeping a column of scores,
> or import scores ahead of assignments. And `count()` is the same list-shaped counter that answered
> **0** for a full gradebook in the restore compare until WO-1.15 — `count(doc.scores)` there was the
> defect; here it is not even called. Size XS: `countScores()` now exists three functions above it, so
> the fix is one term in one sum plus two more collections, and one `verify-shell.mjs` fixture (a
> document holding nothing but a score column, asserting the nag is up).

I would not tick anything on WO-1.15's list for this; it is a separate claim about a separate surface.

---

## Out of scope, noted rather than acted on

- **The status line after a successful restore** still reads *"Restored 2026-2027 from the backup: 1
  class and 2 students"* — the roster and not the record, the same blind spot this work order fixed one
  screen earlier. It is *after* the decision rather than before it, so it is not what the Deliverables
  ask for and I left it. It would be two lines and a check, and it would tell a teacher who has just
  restored an old file what she actually got.
- **The outgoing side can be one debounced save stale.** `readStoredDocument()` reads disk, and a save
  is debounced, so a mark entered ~800ms before the drop is not in the outgoing counts — the warning
  can understate by one edit. Fixing it means a `flush()` before the read, which is a write on a path
  whose whole design is that nothing writes until the button, so it needs a decision rather than a
  patch. `restoreDocument()` flushes anyway, so nothing is *lost* that the panel implies is safe; the
  panel just does not know about it yet.
- **Nothing was done about direction.** No device field, no heuristic, no refusal — the Traps line and
  the Out-of-scope line both say so, and the whole fix is that the difference is now visible.
- **WO-1.16 is still the primary fix.** This is defence in depth for the case where both devices hold
  the same year label.

---

## Draft `CHANGELOG.md` entry — for the teacher to accept, reword or drop

```
### Fixed
- The restore confirmation counts the record, not just the roster. It now shows recorded meetings,
  attendance marks, assignments and scores on both sides, and when the year on this device holds more
  than the file does it says so in words — naming what would be lost, before the button is pressed.
  Restoring a year from its own backup, or from a fuller one, is unchanged and says nothing extra.
```
