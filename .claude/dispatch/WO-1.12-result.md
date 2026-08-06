# WO-1.12 — Close two harness blind spots found at WO-1.10 · implementation report

**Route** Claude (work-order-implementer) · **Branch** `phase/1-shell-store-roster` · 2026-08-05

Both fixes are in, both are proven by planting the violation and watching the script fail, and both
scripts are green on the real repo with no planted fixture left behind. One of the eight
`afterClassChange()` branches **cannot** be made to fail by deleting its line, for a structural
reason; that is stated in full below rather than glossed.

---

## Files changed

| File | What changed |
|---|---|
| `c:\dev\planbook\tools\wo-sweep.mjs` | The coarse-block check now asks `git ls-files --others` as well as `git diff HEAD`, so an untracked `src/*.css` is read in full instead of being invisible. +53 / −8 |
| `c:\dev\planbook\tools\verify-shell.mjs` | `window.__cls()` also reports the home grid; a new `homeVsDoc()` and seven checks assert the cards follow the document after each class mutation. +86 / −0 |
| `c:\dev\planbook\tools\README.md` | The running check count, 224 → 231. **Flagged deliberately** — see "Decisions the work order did not settle" below. |

Nothing under `plans/`, `src/`, `CHANGELOG.md` or `TESTING.md` was touched. `git status --short` at
the end of the run shows only those three files plus the two untracked dispatch documents:

```
 M tools/README.md
 M tools/verify-shell.mjs
 M tools/wo-sweep.mjs
?? .claude/dispatch/WO-1.12-brief.md
?? .claude/dispatch/WO-1.12-status.md
```

---

## Baselines, measured live before touching either file

The brief was right that the numbers in the Acceptance text are stale. These are the pre-change
numbers on this tree, `a4d2a83`, tree clean:

| | pre-change (baseline) | post-change | Acceptance text says |
|---|---|---|---|
| `wo-sweep.mjs` | **11 checks · 10 passed · 0 failed · 1 to review**, exit 0 | **11 checks · 10 passed · 0 failed · 1 to review**, exit 0 | "9-passed" — stale |
| `verify-shell.mjs` | **224 checks · 224 passed · 0 failed · 0 skipped**, exit 0 | **231 checks · 231 passed · 0 failed · 0 skipped**, exit 0 | "209/209/0 skips" — stale |
| lines / lines-per-check | 4,716 lines · **21.1 lines per check** | 4,802 lines · **20.8 lines per check** | — |
| wall-clock | script says 70s, `date`-measured **71s** | script says 70s, `date`-measured **71s** | doc says 58s (WO-1.7) |

The single `REVIEW` in `wo-sweep.mjs` is the pre-existing, unrelated "sensitive field names outside
`src/backup.js`" one (170 mentions). It is unchanged, count and file list identical before and after.

**On the two controls `plans/verification-tooling.md` names.** Lines per check went *down*, 21.1 →
20.8: this work order added 86 lines and 7 checks, which is 12.3 lines per added check against a
running average of ~21. That is the "coverage" side of the control's own test, not the "bloat" side.
Wall-clock is unchanged at 71s — the seven additions are all reads of a page-side helper that was
already being called at those exact points, so they cost no extra round trips. **The runtime control
is drifting on its own account, though, and this work order did not cause it:** the document records
58s at WO-1.7 and the run is now 70–71s. That is not near "the point where the run stops being made
before a commit", but it is a 22% rise and someone should notice it before it is 120s. I have not
edited `plans/verification-tooling.md` to record that; it belongs to the teacher's maintenance pass.

---

## The `afterClassChange()` call list, derived rather than trusted

The work order's prose says "eight sites". The real count in `src/shell.js` as it stands is **eleven
calls to `afterClassChange()`**, of which **eight are the branches the work order means** — the ones
in the `click` and `submit` listeners that follow a class mutation — and three are chained from
elsewhere. Cross-checked against every exported mutator in `src/classes.js`; the list is complete,
i.e. there is no exported mutator that changes the card grid and lacks a line.

| # | `src/shell.js` line | Hook / branch | `src/classes.js` mutator | One of "the eight"? |
|---|---|---|---|---|
| 1 | 252 | `data-class-tab` | `selectClass` | yes |
| 2 | 266 | `data-class-move-up` | `moveClassUp` | yes |
| 3 | 270 | `data-class-move-down` | `moveClassDown` | yes |
| 4 | 275 | `data-class-archive` | `archiveClass` | yes |
| 5 | 279 | `data-class-restore` | `restoreClass` | yes |
| 6 | 285 | `data-class-delete-confirm` | `confirmDelete` | yes |
| 7 | 408 | `data-class-create` (submit) | `createClassFromForm` | yes |
| 8 | 413 | `data-class-rename-save` (submit) | `saveRename` | yes |
| 9 | 124 | inside `afterYearChange()` | — | no |
| 10 | 152 | inside `afterRestore()` | — | no |
| 11 | 521 | boot | — | no |

`selectTerm`, `addTerm`, `removeTerm`, `applyPreset`, `editTermField` and `termDateCommitted` are
correctly absent: nothing on a class card comes from a term.

**The count in `plans/` is prose and is not eight if you count calls; it is eight if you count
branches.** As instructed, I did not edit `plans/` to correct it. Both readings are defensible and
the branch reading is the one the Deliverable is about.

---

## Acceptance, line by line

### 1. "A planted, untracked `src/*.css` file with an uncovered coarse-pointer selector is caught by `wo-sweep.mjs`, not silently passed because the diff against `HEAD` is empty."

**Met.** Proven in both directions with the same fixture file on disk.

The fixture, `src/wo112-probe.css`, untracked, never `git add`ed, containing
`.wo112-probe-control` — a control-shaped selector with no rule in any `@media (pointer: coarse)`
block anywhere in the repo:

```css
/* WO-1.12 planted fixture — an untracked per-screen stylesheet, deleted before the work order
   reports. `.wo112-probe-control` is a tappable control with no rule in any coarse block. */
.wo112-probe-panel { display: block; padding: 16px; background: #f8f9fb; }
.wo112-probe-control {
  padding: 6px 10px; border-radius: 8px;
  border: 1.5px solid #eef0f4; background: #fff; color: #1a1a2e;
}
```

**A — the blind spot, demonstrated on the pre-change script.** `tools/wo-sweep.mjs` restored to
`HEAD` with `git checkout`, fixture on disk:

```
=== A. OLD wo-sweep.mjs, planted untracked stylesheet on disk ===
PASS | a @media (pointer: coarse) block exists and has selectors  :: 94 selector(s) in the coarse block
PASS | every control added in this diff appears in the coarse block  :: no new CSS selectors in the working diff
================ SUMMARY ================
11 checks · 10 passed · 0 failed · 1 to review
exit=0
```

That is the exact failure the work order describes: a confident `PASS` whose detail line says "no
new CSS selectors" while an entire new stylesheet with an uncovered touch target sits in `src/`.

**B — the same fixture, the changed script.** Nothing else moved; only `tools/wo-sweep.mjs` was
swapped back to the edited version:

```
=== B. FIXED wo-sweep.mjs, same planted stylesheet still on disk ===
...
REVIEW | CSS selectors added in the working tree with no coarse-block rule  :: .wo112-probe-panel, .wo112-probe-control — confirm each is not a touch target, or add the 44px rule in the same pass (0 added line(s) in tracked src/*.css, 1 untracked stylesheet(s))
...
11 checks · 9 passed · 0 failed · 2 to review
```

**C — the inverse, so the new arm is not "any untracked CSS is a REVIEW".** A coarse block was
appended to the same fixture file and nothing else changed:

```
=== C. FIXED wo-sweep.mjs, planted stylesheet now carries its own coarse block ===
PASS | a @media (pointer: coarse) block exists and has selectors  :: 96 selector(s) in the coarse block
PASS | every control added in the working tree appears in the coarse block  :: 2 new selector(s), all covered — 0 added line(s) in tracked src/*.css, 1 untracked stylesheet(s)
```

Note "96 selector(s)" — the fixture's own coarse block was seen, which is how the two selectors
became covered. The check distinguishes covered from uncovered on an untracked file, which is the
whole claim.

**D — fixture deleted, real repo.** `rm src/wo112-probe.css`, and the sweep is back to its exact
baseline (11 / 10 / 0 / 1, "1260 style line(s) across 2 file(s)"):

```
PASS | every control added in the working tree appears in the coarse block  :: no new CSS selectors — 0 added line(s) in tracked src/*.css, 0 untracked stylesheet(s)
11 checks · 10 passed · 0 failed · 1 to review
```

**Four things to know about how this was implemented, since it is the instrument that grades you.**

- **`REVIEW`, not `FAIL`, is what "caught" means here** and I did not change that. This check has
  always been a `REVIEW` (whether a new selector is a touch target is a reading question), a
  `REVIEW` never fails the run, and turning it into a `FAIL` would be a new *kind* of check, which
  the Out of scope line forbids. What changed is that the selector is now named in the TO REVIEW
  block instead of a green line claiming there was nothing to look at.
- **Guarded against a vacuous pass.** The detail string now always reports what the check actually
  looked at — `0 added line(s) in tracked src/*.css, 0 untracked stylesheet(s)` — because "this
  check looked and found nothing" and "this check could not see anything" printed identically
  before, which is precisely how the blind spot survived a whole work order. There is also a fourth
  arm: if `git` itself cannot be asked, the check now `REVIEW`s saying so rather than reporting a
  clean diff.
- **Two selector-extraction changes, both to keep it from crying wolf on the wider input.**
  Comments are stripped from untracked files before scanning (`src/home.css`'s header quotes its own
  selectors by name four times, and a prose mention would otherwise arrive as a selector that does
  not exist); and the selector pattern now requires a letter after the dot, so `rgba(0,0,0,.5)` in a
  declaration no longer reads as a selector called `.5`.
- **I renamed the check.** "every control added in **this diff**" → "in **the working tree**", in
  both the PASS and REVIEW names. The old name is now false, since the check no longer looks only at
  a diff. This is a name change, not a count change: `wo-sweep.mjs` still reports 11 checks.

### 2. "Deleting one line from `afterClassChange()`'s call list makes `verify-shell.mjs` fail at least one check, for as many of the eight branches as can be driven without new app-side hooks."

**Met for seven of the eight branches. The eighth is provably undrivable and I did not fake it.**

Each row below is a separate full run of `node tools/verify-shell.mjs` with exactly one
`afterClassChange();` removed from `src/shell.js` and nothing else changed, `git checkout --
src/shell.js` between runs. No new app-side hook was added; every mutation is still driven through
the control a teacher touches.

| Branch | line | exit | result | the check that went red |
|---|---|---|---|---|
| `data-class-tab` (select) | 252 | **1** | 231 · 230 passed · **1 failed** | *one tap on a card makes that class the open class, on the card AND on the header tab* — pre-existing check, already covered this branch |
| `data-class-move-up` | 266 | **1** | 231 · 230 · **1 failed** | *and the cards go back with it, in the document's order* |
| `data-class-move-down` | 270 | **1** | 231 · 230 · **1 failed** | *and the cards reorder with it — the grid is the tab bar's second view, not a stale copy* |
| `data-class-archive` | 275 | **1** | 231 · 230 · **1 failed** | *and the card goes off the grid with it, while the dialog is still open* |
| `data-class-restore` | 279 | **1** | 231 · 230 · **1 failed** | *and its card comes back to the grid in that same place* |
| `data-class-delete-confirm` | 285 | **0** | 231 · **231 passed** | **none — see below** |
| `data-class-create` | 408 | **1** | 231 · 230 · **1 failed** | *the home screen gains a card when a class is created through the form* |
| `data-class-rename-save` | 413 | **1** | 231 · 230 · **1 failed** | *and the card carries the new name too, not the one it was rendered with* |

Verbatim transcripts of the seven that fail (trimmed to the plant line and the FAIL line):

```
############ planted: shell.js line 252 ############
  was: "    afterClassChange();"    now: (line deleted)
exit=1
FAIL | one tap on a card makes that class the open class, on the card AND on the header tab
      {"selected":"c_b1","pref":"c_b1","cardMarked":false,"tabMarked":true,"marked":1}

############ planted: shell.js line 266 ############
  was: "    classes.moveClassUp(moveUp.getAttribute('data-class-move-up')); afterClassChange(); return;"
  now: "    classes.moveClassUp(moveUp.getAttribute('data-class-move-up')); return;"
exit=1
FAIL | and the cards go back with it, in the document's order
      7 card(s) ["Period 1 — Biology","Period 3 — Biology",...] for 7 active class(es) ["Period 3 — Biology","Period 1 — Biology",...]; open card ["c_2v2s4a452v"], expected ["c_b1"]

############ planted: shell.js line 270 ############
  now: "    classes.moveClassDown(moveDown.getAttribute('data-class-move-down')); return;"
exit=1
FAIL | and the cards reorder with it — the grid is the tab bar's second view, not a stale copy
      7 card(s) ["Period 3 — Biology","Period 1 — Biology",...] for 7 active class(es) ["Period 1 — Biology","Period 3 — Biology",...]; open card ["c_b1"], expected ["c_0o4n1w2p0r"]

############ planted: shell.js line 275 ############
  now: "    classes.archiveClass(archive.getAttribute('data-class-archive')); return;"
exit=1
FAIL | and the card goes off the grid with it, while the dialog is still open
      7 card(s) [... ,"Homeroom"] for 6 active class(es) [... no Homeroom]; open card ["c_682g4j454p"], expected ["c_682g4j454p"]

############ planted: shell.js line 279 ############
  now: "    classes.restoreClass(restore.getAttribute('data-class-restore')); return;"
exit=1
FAIL | and its card comes back to the grid in that same place
231 checks · 230 passed · 1 failed · 0 skipped

############ planted: shell.js line 408 ############
  now: "    classes.createClassFromForm(); return;"
exit=1
FAIL | the home screen gains a card when a class is created through the form
      1 card(s) ["Period 3 — Biology"] for 7 active class(es) ...
231 checks · 230 passed · 1 failed · 0 skipped

############ planted: shell.js line 413 ############
  was: "    afterClassChange();"    now: (line deleted)
exit=1
FAIL | and the card carries the new name too, not the one it was rendered with
231 checks · 230 passed · 1 failed · 0 skipped
```

And the one that does not, reported as a negative result rather than left out:

```
############ planted: shell.js line 285 ############
  was: "    classes.confirmDelete(); afterClassChange(); return;"
  now: "    classes.confirmDelete(); return;"
exit=0
231 checks · 231 passed · 0 failed · 0 skipped
```

**Why `data-class-delete-confirm` cannot be driven to fail, and why I did not force it.** Delete is
offered on an **archived** row only — that is the safety WO-1.6 bought deliberately, and
`verify-shell.mjs` already asserts it ("no delete control on an active class"). So by the time the
confirm is reachable, the class has *already* been archived, its card is *already* off the grid, and
the active class list does not change when the document record is destroyed. There is nothing on
screen for the redraw to move, so no read of `#homeGrid` can distinguish the call being there from
it being absent. Making it falsifiable would mean either offering delete on an active class (undoing
a safety decision for a check's convenience) or adding an app-side hook, which the acceptance line
excludes by its own wording — "as many of the eight branches as can be driven without new app-side
hooks". I added the check at that site anyway, because it still asserts a real invariant (the grid
must not *regain* a card for a class that no longer exists), and its comment in the source says
plainly that it is weaker than the five above it. **It is not evidence for the redraw, and I am not
claiming it as such.**

**Two of the three non-branch call sites are covered too**, measured the same way, for completeness
rather than because the work order asked:

| Call site | line | exit | what went red |
|---|---|---|---|
| `afterYearChange()` | 124 | **1** | *a fresh document shows a real empty state on the home screen, not blank cards* — `cards = 6` on a year with none |
| `afterRestore()` | 152 | **0** | nothing — see below |
| boot | 521 | **1** | *six classes fit on an iPad screen in portrait without scrolling, at 44px+ targets* — `0 cards in 3 columns` |

`afterRestore()` is a real remaining gap and I did **not** close it, deliberately. It is not one of
the eight branches, and more importantly the fixture makes it unclosable as the run stands: the
backup document the restore section builds and the live document it replaces both hold exactly one
class, `c_b1` "Period 3 — Biology" (`tools/verify-shell.mjs` line 994). Identical class lists on both
sides means a `#homeGrid` read there would pass whether or not the redraw happened — a vacuous check,
which is worse than none. Closing it needs a restore fixture whose incoming document has a different
class list from the outgoing one, which is a fixture change to a section this work order does not
touch. **Proposed as a follow-up below.**

**How the checks are guarded against a vacuous pass** (the brief's specific warning: "a `#homeGrid`
read that finds zero cards must not read as 'the class was removed'"). Every one of the seven goes
through one function, `homeVsDoc()`, which asserts four things at once: the card count is **non-zero**;
the card ids equal the document's *active* class ids **in order**; the card names equal the active
names in order; and exactly the class `src/classes.js` resolves as open carries the `.open` mark
(or none does, if the selected class was just archived or deleted). An empty grid fails the first
clause. A grid that is right about ids and stale about names fails the third. The active list is
derived in Node from the document that `window.__cls()` already returns, so there is no second copy
of "which classes are active" in the harness.

### 3. "Both scripts still run clean against the real repo afterward — no regression in `wo-sweep.mjs`'s 9-passed baseline or `verify-shell.mjs`'s 209/209/0-skips baseline, beyond checks this work order adds on purpose."

**Met, against the live baselines rather than the stale ones.** Final runs on the clean tree, no
fixture on disk, `src/shell.js` restored:

```
=== FINAL wo-sweep ===
11 checks · 10 passed · 0 failed · 1 to review
sweep exit=0
(the single REVIEW is the pre-existing "sensitive field names outside src/backup.js", 170 mentions,
 byte-identical to the pre-change run)

=== FINAL verify-shell exit=0 wall=71s ===
231 checks · 231 passed · 0 failed · 0 skipped
4,802 lines · 20.8 lines per check · 70s
```

- `wo-sweep.mjs`: **identical to baseline** — same 11 checks, same 10 passes, same 1 review, exit 0.
  No check was added or removed; the changed check's *name* and *detail text* changed, its state did
  not.
- `verify-shell.mjs`: **224 → 231, all seven new, all passing, 0 skips before and after.** Every
  pre-existing check still passes; I re-read the full output for `FAIL` and `SKIP` and there are
  none. The seven added are exactly the ones listed in Acceptance 2's table.

---

## What I could not verify

- **Nothing here needs a real iPad**, and I am not claiming any iPad coverage. Both scripts are
  desktop tools; `verify-shell.mjs` still closes no 👤 item, and the run says so itself.
- **`wo-sweep.mjs`'s new `git ls-files` arm was exercised on Windows / Git Bash only**, which is the
  same constraint `verify-shell.mjs` already documents ("Windows browser paths only"). The call uses
  no shell, so the `src/*.css` pathspec is handed to git literally and git does the globbing — I do
  not expect a platform difference, but I have not run it on anything else.
- **The `git`-unavailable arm was reasoned, not executed.** I did not stage a run with `git` off
  `PATH` to watch the fourth arm print. It is three lines and reachable only by an exception from
  `execFileSync`, but "reasoned, not executed" is the honest label.
- **I did not test what happens with an untracked `.css` under `src/` that is `.gitignore`d.** By
  design `--exclude-standard` skips it, which I believe is right (an ignored file is not going to
  ship), but that is a judgment, not a measurement.

---

## Decisions the work order did not settle, and which way I went

1. **`tools/README.md`'s check count, 224 → 231.** That file carries a standing instruction addressed
   to exactly this situation — *"Update this line when you add checks — a stale count here reads as
   'the harness has not been touched since WO-1.3'"* — and it is not one of the files the dispatch
   rules reserve for the teacher (`plans/`, `CHANGELOG.md`, `TESTING.md`, roadmap boxes, the
   dashboard). I updated it, in the file's own idiom, and I am flagging it here because it is the
   one edit outside the two scripts the work order names. **It ticks nothing and closes nothing**;
   it records a count that is now on disk. If the verifier reads it as scope creep it backs out in
   one edit.
2. **Renaming the `wo-sweep.mjs` check from "in this diff" to "in the working tree".** The old name
   became false the moment the check stopped looking only at a diff, and a check whose name lies is
   the shape of problem this work order exists about. Reported under Acceptance 1 so a verifier
   diffing against the baseline output is not surprised by it.
3. **`REVIEW` kept as the outcome for an uncovered new selector, rather than promoted to `FAIL`.**
   Tempting, since an uncovered touch target is a real rule violation — but "is this selector a
   control?" is a reading question, `wo-sweep.mjs`'s own header defines `REVIEW` as the honest state
   for exactly that, and promoting it is a new kind of check. Declined.
4. **Seven separate checks rather than one bundled "the home screen agrees" check.** A bundle would
   have been ~15 lines shorter and would have named the wrong thing when it went red. Seven checks
   means the failure message points at the branch whose line went missing, which is the entire
   purpose.

## Temptations declined, and one proposed follow-up

- **Proposed follow-up — close the `afterRestore()` blind spot.** Measured above: deleting
  `src/shell.js:152` leaves `verify-shell.mjs` at 231/231. The reason is a fixture, not a missing
  mechanism: the restore section's backup document and the document it replaces both hold the same
  single class (`tools/verify-shell.mjs:994`), so the grid looks identical either way. The fix is to
  give the backup fixture a *different* class list from the live document and add one `#homeGrid`
  read to the `applied` block that already exists at line ~1709 — a handful of lines, no new
  mechanism, same kind of check. It sits in the backup section, which WO-1.12 does not touch, so I
  left it. The teacher-visible failure it guards is a restore that leaves the previous year's cards
  on the grid.
- **Declined: making `verify-shell.mjs` assert the `afterClassChange()` call list statically** — a
  grep of `src/shell.js` for one `afterClassChange()` per class-mutating hook. It would catch the
  delete-confirm branch that no driven check can. It is also grep-shaped work in the browser harness,
  which `plans/verification-tooling.md` explicitly routes to `wo-sweep.mjs`, and it is a new *kind*
  of check either way. Not done, and I would want it argued before it is.
- **Declined: fixing `src/README.md`.** The work order's "Why it exists" says *"`src/README.md` makes
  one stylesheet per screen the convention"*. It does not — that convention is stated in
  `src/shell.css`'s header comment and quoted in `src/home.css`'s. `src/README.md` also still opens
  with *"Empty today. WO-1.2 puts the first file here."* on a directory holding eighteen files. Both
  are stale prose, neither is in this work order, and I did not touch either.
- **Declined: recording the 58s → 71s runtime drift in `plans/verification-tooling.md`.** That
  document asks for the number to be reported in the verifier's line, which is done at the top of
  this report. Editing `plans/` is not mine to do.
- **Declined: `tools/lib/`, a shared helper between the two scripts, a config file, a second
  harness.** None was needed. `homeVsDoc()` lives inside `verify-shell.mjs` and `wo-sweep.mjs`
  imports nothing from it; either file still deletes without touching the other.

## Reproducing the proofs

```
# Acceptance 1 — plant an untracked stylesheet with an uncovered control selector
#   (see the fixture under Acceptance 1), then:
node tools/wo-sweep.mjs          # REVIEW naming .wo112-probe-control
rm src/wo112-probe.css
node tools/wo-sweep.mjs          # 11 checks · 10 passed · 0 failed · 1 to review

# Acceptance 2 — remove ONE afterClassChange(); from src/shell.js, then:
node tools/verify-shell.mjs      # exit 1, one FAIL naming that branch
git checkout -- src/shell.js
```

Lines to try, and what each should redden: 252, 266, 270, 275, 279, 408, 413 — one check each.
285 will stay green, for the reason given above.
