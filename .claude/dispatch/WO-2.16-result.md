# WO-2.16 — result

**Implementer** Claude (work-order-implementer, Opus tier) · **Date** 2026-08-09
**Work order** `plans/work-orders/phase-2-attendance.md:1321`
**Status left on disk** 🔨 IN PROGRESS, all eleven Acceptance boxes ticked. **`--tick` was not run** —
a work order that is written but unverified does not get stamped, and the verifier reads this cold.

---

## Files changed

| File | What changed |
|---|---|
| `c:\dev\planbook\tools\wo-gate.mjs` | The field boundary (positional, not lexical), `**Blocks**` and `**Target**` as real fields, an unknown-field NOTE, an ellipsis-range warning, `--self-check`'s precondition and its early exit, the `next` plant un-coupled from the live running order, `verdict()` replacing four head-clips |
| `c:\dev\planbook\plans\work-orders\README.md` | § "Header fields": the paragraph above the table, a **Blocks** row, a **Target** row, an *anything with no row here* row, and a new paragraph stating the position rule |
| `c:\dev\planbook\tools\README.md` | `--self-check`'s paragraph gains its precondition and the un-clipped failure output |
| `c:\dev\planbook\plans\verification-tooling.md` | § "The check on `wo-gate.mjs`…": one paragraph recording that the precondition is deliberately **not** a tenth plant |
| `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` | WO-2.16's eleven Acceptance boxes ticked. (The file was already modified before I started — the orchestrator's `--start` claim.) |

**Not touched:** `CHANGELOG.md` (draft below, for the teacher). `TESTING.md` — it has no `wo-gate`
section at all (`grep -n "wo-gate" TESTING.md` → nothing), consistent with WO-2.14/WO-2.15 treating
this as harness rather than app. `plans/work-orders/phase-1-shell-store-roster.md` — the two
`**Blocks**` lines are the fixtures and are byte-unchanged (`git diff` on that file is empty).
`src/` — nothing in this work order has a UI surface, so there is no control to give 44px to and no
`localStorage` key to prefix.

---

## Against the eleven Acceptance lines

### 1. Dashboard drift in a temp copy → stops before planting, names the drift ✔

Method as dictated: a copy of `plans/` **and** `tools/` outside the repository
(`…\scratchpad\sc1\`), so the script under test resolves `REPO` to the scratch dir and the live
`plans/` is not reachable at all. The planted row is the exact historical drift the work order names:

```
  - | 1 | Shell, store, roster | ✅ DONE — 2026-08-06 | 12/12 `[██████████] 100%` |
  + | 1 | Shell, store, roster | ✅ DONE — 2026-08-06 | 11/12 `[██████████] 100%` |
```

`node …\sc1\tools\wo-gate.mjs --self-check` → **exit 1**, and it never plants:

```
FAIL | --self-check requires the trackers to be clean before it can plant anything,
     | and the copy it just made is not. Nothing was planted; no fixture was written.

     | ROADMAP.md's progress dashboard — Phase 1: the dashboard row says 11/12, the boxes under "## Phase 1" say 12/12 (ROADMAP.md:52)
     | ROADMAP.md's progress dashboard — Overall: the row says 28/82, its own rows sum to 27/82 (ROADMAP.md:60)

  0 plants made. A plant failure has to mean a plant failed — …
FAIL | 2 problem(s) in the trackers, copied from plans/. `node tools/wo-gate.mjs --audit` shows them …
```

Corroboration that this is what changed: the **pre-change** script, run against the same drifted
copy, printed `9 plants, 6 caught, 3 missed` and named *"`--dry-run` on `--start`, `--release` and
`--tick` writes nothing at all"* and *"a fully ticked work order still gets ✅ DONE…"* — the two the
work order predicted — plus the `next` plant, which was independently red. Its 160-character clip
showed the banner and the `-`/`+` preview and never reached the word `HELD`, exactly as recorded.

`git diff -- plans/` confirms the live `plans/ROADMAP.md` was never touched.

### 2. The other `HELD`: a `Closes roadmap` fragment matching zero boxes ✔

Second scratch copy (`…\scratchpad\sc2\`), one fragment reworded so it quotes no box:

```
  - **Closes roadmap** Phase 1 → "Start `TESTING.md` and `CHANGELOG.md`"
  + **Closes roadmap** Phase 1 → "Start a testing checklist and a changelog that no box mentions"
```

→ **exit 1**, `0 plants made`, and the reason:

```
     | WO-1.1 (phase-1-shell-store-roster.md:13) quotes "Start a testing checklist and a changelog that no box menti…", which matches 0 roadmap boxes and must match exactly one
```

### 3. Clean tree: still nine plants, all caught, count still printed ✔

`node tools/wo-gate.mjs --self-check` → **exit 0**, `9 plants, 9 caught, 0 missed.` The plant array is
untouched in length; the precondition is not in it. The run now also prints a `trackers  clean in the
copy — no ROADMAP.md dashboard drift, no fragment closing zero boxes` line, so the precondition is
visible when it passes as well as when it fails.

### 4. The `next` plant passes with a populated running order — proved both ways ✔

- **With ⬜ NOT STARTED rows ahead** (today's tree: twelve NOT STARTED plus a claimed WO-2.16 in the
  Ship 2 table): new script `9 plants, 9 caught`. The pre-change script on the same tree:
  `8 caught, 1 missed`, four sub-failures on the `next` plant — the red state the brief recorded.
- **With none** (`…\scratchpad\sc3\`, the thirteen Ship 2 running-order rows deleted so the running
  order is Ship 1 with every row ✅ DONE — the tree's actual 2026-08-08 state; `next` there prints
  *"nothing ⬜ NOT STARTED left in the Ship 1 table"*): new script `9 plants, 9 caught`. The
  pre-change script in that same copy is **also** green — which is the finding, not a footnote: the
  old plant only ever passed under that condition, and had been silently resting on it since it was
  written.

The fix: the fixture's running-order row goes **above every real row** rather than below the last one,
so `next` reaches it whatever the live tables contain. Claimed, it is the skip that gets named;
unclaimed, it is what `next` offers. The comment at the old `:1025-1026` is rewritten in place and now
records why the sentence that made the assumption reasonable is the sentence that hid it.

### 5. A genuine plant failure still reports as one, with the `HELD` reason visible ✔

Proved by **mutating the subject script**, not by drifting the trackers. The mutation is one number in
a copy of the subject, run through the documented `--against` seam (which exists for exactly this —
"each plant is proved to be able to fail"), so the repository's own `tools/wo-gate.mjs` was never
mutated and there is nothing to restore:

```
  - if (f.length < 12) return { tooShort: true, hits: [] };
  + if (f.length < 200) return { tooShort: true, hits: [] };
```

`node tools/wo-gate.mjs --self-check --against …\wo-gate.mutated.mjs` → exit 1, `9 plants, 6 caught,
3 missed`, and the reason survives:

```
FAIL | a fully ticked work order still gets ✅ DONE, its roadmap box, and the dashboard
     | --tick exited 1 on a fully ticked work order:
     |   HELD | WO-9.9's Acceptance list is complete, and the trackers it writes into are not:
     |   "self-check fixture box, planted in a temp copy and never in the repository" is too short to match a roadmap box safely — quote more of the box
     | the status reads "🔨 IN PROGRESS"
     | the roadmap box it closes was left unticked
     | the dashboard Done cell went 0 → 0, expected +1
```

The two cases are distinguishable in the output itself, which is the point of the line: tracker drift
prints `FAIL | --self-check requires the trackers to be clean…` with `0 plants made` and no plant
names; a broken script prints `FAIL | <plant name>` with the subject's own verdict indented under it.

*Note for the verifier, stated plainly:* the brief said *"If you mutate `tools/wo-gate.mjs` to prove
line 5, restore it and show the tree clean afterward."* I did not need to — `--against` makes the
subject a separate file. `git status --short` shows no untracked files under `tools/`, and the only
modified tools file is the intended `tools/wo-gate.mjs` change itself.

### 6. `WO-1.5` no longer reports `WO-1.6` as a dependency; its `**Blocks**` line unchanged ✔

```
WO-1.5 — Backup & restore
  depends WO-1.4   ✅ DONE
  blocks  WO-1.6 and every work order after it — **unblocked as of 2026-08-04**
```

The `depends WO-1.6 ✅ DONE` line and the prose NOTE that carried it are gone. On disk,
`phase-1-shell-store-roster.md:195` still reads `**Blocks** WO-1.6 and every work order after it —
**unblocked as of 2026-08-04**`, and `git diff` on that file is empty.

### 7. `WO-1.1` no longer scrapes `**Blocks** everything` into its dependency field ✔

```
WO-1.1 — Repo skeleton & docs spine
  depends nothing
  blocks  everything
```

Was: `depends (prose) nothing · **Blocks** everything` plus a NOTE. Line 15 on disk is unchanged.

### 8. `--list` and `next` unchanged on every other work order ✔

Two diffs, because one of them has a confound I am not going to paper over.

**Same-instant, code-versus-code** (`git show HEAD:tools/wo-gate.mjs` into `tools/wo-gate.HEADCOPY.mjs`
so both runs see the identical dirty tree, then deleted):

```
########## --list, pre-change script vs post-change script, same tree, same minute
IDENTICAL
########## next, pre-change script vs post-change script, same tree, same minute
IDENTICAL
```

`next --quiet` also byte-identical (`WO-3.1`, with the WO-2.16 skip on stderr).

**Against the captured baselines** in § 2 of the brief: `--list` is **identical, zero differences**.
`next` differs in exactly one place, and it is not code:

```
-  git     1 changed path(s)
+  git     5 changed path(s)
            M plans/work-orders/phase-2-attendance.md
+           M tools/wo-gate.mjs
+          ?? .claude/dispatch/WO-2.16-brief.md
+          ?? .claude/dispatch/WO-2.16-status.md
+          ?? tools/wo-gate.HEADCOPY.mjs
```

That is `gate()`'s `git status --short` block reporting the working tree, which is dirtier now because
this work order is in it. The same-instant diff above holds that constant and comes out identical.

**Stronger than the line asks, and worth recording:** the two changed lines do not appear in `--list`
or `next` at all, so those two outputs changed by *nothing*. To find where the change does land I ran
`gate()` over **all 64 work orders**, old script versus new, same minute: **5 of 64 differ** — WO-1.1
and WO-1.5 (`**Blocks**`), WO-G1, WO-G2 and WO-G3 (`**Target**`). Nothing else in the tree moved.
`--audit`'s full output is byte-identical old versus new, exit 0 both.

The five changes in full: each loses a `depends (prose) …`/`NOTE | "Depends on" carries a
non-work-order clause` pair, and gains `blocks`/`target`. WO-G3 keeps a prose NOTE, correctly reduced
from `Phase 4 **Target** October 2026, …` to `Phase 4`. WO-G1 gains the new ellipsis warning in place
of the prose NOTE it used to get by accident (see judgment call 5 below).

### 9. `**Blocks**` has a row, and the table says what becomes of a field with no row ✔

`plans/work-orders/README.md:49` is the **Blocks** row; `:50` is a **Target** row; `:54` is the
*anything with no row here* row, which states the consequence where someone inventing a field will be
looking: read by nothing, named once per gate report, parsed only far enough to stay out of the field
above it, and either give it both a row and a `KNOWN_FIELDS` line or take it out of the header block.
The paragraph above the table (`:38-42`) was rewritten, because its old sentence — *"it gets swallowed
by whichever field is written before it"* — is now false. A new paragraph at `:56-61` states the
position rule with both of the shapes it has to survive.

### 10. Writes nothing in the repository, no temp directory on any exit path ✔

Measured, not asserted — `sha256` over every file in `plans/` before and after, and a directory listing
of `%TEMP%` for `wo-gate-selfcheck-*`, across **all three** exit paths in one run:

```
pass path           exit 0   9 plants,
plant-failure path  exit 1   9 plants,
EARLY EXIT path     exit 1   0 plants made

plans/ before   15 files  7c2678e1840bd564c34fb4557ae4dfde49e95c6664cdd7790646e19cd2975a19
plans/ after    15 files  7c2678e1840bd564c34fb4557ae4dfde49e95c6664cdd7790646e19cd2975a19
SAME — --self-check wrote nothing inside plans/

wo-gate-selfcheck-* dirs in C:\Users\WildB\AppData\Local\Temp: before 0, after 0
NONE LEFT on any of the three exit paths
```

The early exit was exercised **with `REPO` resolving to the real repository**, which needs a harness
whose precondition finds something and cannot be arranged by editing `plans/`. So a throwaway copy of
the script with one extra `problems.push(…)` was written to `tools/wo-gate.EARLYEXIT.mjs`, run, and
deleted in the same script; `git status --short` after shows no trace of it. The early exit returns
from `runPlants()`, so the `finally` in `selfCheck()` that WO-2.15 built still owns the cleanup — the
new path adds no second place where a directory could be forgotten. `git status --short` at the end
lists only the five intended files plus the two dispatch files.

### 11. `verify-shell.mjs` and `wo-sweep.mjs` clean ✔

```
node tools/verify-shell.mjs   →  428 checks · 428 passed · 0 failed · 0 skipped   exit 0
                                 9,924 lines · 23.2 lines per check · 145s
node tools/wo-sweep.mjs       →  12 checks · 11 passed · 0 failed · 1 to review   exit 0
```

428 matches `tools/README.md` ("428 when it left", WO-2.5). The single `REVIEW` is the standing
`sensitive field names outside src/backup.js` one — a `REVIEW` never fails the run, it was there before
this work order, and no `src/` file was touched. I added no checks to either harness and wrote no
third one: nothing in this work order is a claim a browser could measure, and every one of the eleven
lines above was settled by running `wo-gate.mjs` itself against copies. Lines-per-check is 23.2 against
the ~17.9 recorded in `verification-tooling.md`; that drift is pre-existing and none of it is mine.

**Ran green locally in this session, not inferred** — including `verify-shell.mjs`, which the standing
note says agents often cannot run.

---

## The four judgment calls

**1. Is `**Blocks**` a real field?** Yes — real, and handled exactly as **Amends roadmap** is: parsed,
reported by `gate()`, never acted on, never written. The work order recommended it and the
recommendation holds up: it is information a human wants at the top of a work order, it reads naturally
beside `Depends on`, and the alternative was deleting a clause from two shipped work orders because a
script could not read it. The hard half is that it is **prose, not a schema** — `everything`, and a
line ending `— **unblocked as of 2026-08-04**` — so it is a field of its own precisely so that no `WO-`
token on it can reach `depsOf()`. Reasoning is at the `KNOWN_FIELDS` declaration and at the print site
in `gate()`.

**I promoted `**Target**` in the same pass, and that is one field more than the work order's Out-of-scope
line literally allows** ("its reading of one field"). Naming it because a verifier should not have to
find it: with the class fix in place, an unknown field is *reported* as unknown, and leaving `Target`
unknown would print a NOTE nobody can act on under all four gate reports forever. This project's own
rule — *"a control that goes red for a reason the reader learns to dismiss is worse than no control"*
(WO-1.12), quoted in this very work order — says don't. Promoting it costs one array entry and one
table row, and it leaves the unknown-field NOTE with **zero live instances**, which is the correct
resting state for a control: armed, silent, and firing the first time someone invents `**Supersedes**`.
If the verifier reads Out of scope strictly, the narrow fix is to delete `'Target'` from
`KNOWN_FIELDS` and its table row; the class fix and everything else stands without it, and four gate
reports gain a permanent NOTE.

**2. How does the clip stop hiding the `HELD` reason?** Not a longer clip, not the last line, not a
flag. A `verdict()` helper that keeps the run's **verdict lines** — every `HELD |`/`FAIL |` header plus
the indented lines under it, capped at twelve, falling back to the last three non-empty lines when
there is no verdict at all. Rejected, with the reasoning in the comment at the function: a longer clip
is the same bug with a bigger number and would still cut a long `HELD` block; the *last* line of a
`HELD` is the instruction (*"Tick the lines above…"*, *"the roadmap dashboard is never written by this
tool…"*), not the cause; and a flag defaults to the broken behaviour, so the reason stays hidden for
whoever hits this next — which is the whole failure being fixed. Applied at all four sites that clipped
captured output, not just the one the work order cited, because the other three fail the same way.

**3. Is the unknown-field fix general or per-field?** General — the class, as instructed. The boundary
between fields is now **positional rather than lexical**: a field ends at the next bold token *written
where a field is written*, known or not. `KNOWN_FIELDS` remains the closed list of fields that are
*read*; it is no longer the list that decides where the previous field stops. The guard that makes this
safe is that a field must be **both** at a field position (start of a header line, or after a `·`)
**and** field-shaped (capitalised words only, plus the `WO-x.y` that `**Takes from WO-2.9**` names its
own argument with). Both halves are load-bearing and both are proved against the real tree: WO-1.13's
*see **Why it exists** below* is field-shaped but mid-sentence, WO-1.11's **Not a go-live blocker.** is
at a field position but not field-shaped, and neither is treated as a field — confirmed by the 64-work-order
diff, in which both work orders' reports are byte-identical. I checked this against every bold token in
every header block in the repository before writing the regex, not after: nine field-shaped tokens
(`Ship`, `Status`, `Size`, `Depends on`, `Blocks`, `Target`, `Closes roadmap`, `Amends roadmap`,
`Takes from …`) and six prose ones, all six correctly ignored.

**4. What does the field table now say about a field with no row?** That it is **read by nothing, and
said so once per gate report** — parsed far enough to keep it out of the field above it, named by
`wo-gate.mjs WO-x.y`, and owed either a row plus a `KNOWN_FIELDS` line or removal from the header
block. It is written as a row in the table rather than as prose above it, because the second half of
acceptance line 9 asks for the consequence to be where someone inventing a field is actually looking.
It carries its scar like the rows around it: three fields, each invented by a hand, each absorbed in
silence, each found by a human reading the gate's output and thinking it looked odd.

**5. One call the work order left as an option, and I took it — the ellipsis warning.** The work order's
parenthetical says: *"If this work order adds anything there, it is a **warning** when a dependency
line contains `…` between two `WO-` tokens, never an expansion."* I added the warning, for a reason
that is a consequence of my own change rather than an improvement I fancied: WO-G1 still carries
`**Depends on** WO-1.1 … WO-2.4`, and the only thing that ever made a reader look at it was the prose
NOTE raised by `**Target**` bleeding into the field — which this work order removes. Without the
warning, the fix makes an existing hazard quieter. It is a NOTE, it never expands anything, and the
comment at the site says why a parser must not guess at a range.

---

## Out-of-scope temptations declined

- **`shipOneOrder()` is misnamed and its comment is stale.** It reads *every* running-order table in
  `work-orders/README.md`, not the Ship 1 one, and `next`'s empty-case message still says *"nothing ⬜
  NOT STARTED left in the Ship 1 table"* even when it has just walked Ship 2. My 2b comment had to say
  "running-order" to be accurate while the function beside it says "Ship 1". Left alone: renaming the
  function is cosmetic, and changing that output string would change `next`'s output, which acceptance
  line 8 forbids. **Proposed follow-up:** rename `shipOneOrder()` → `runningOrder()` and re-word the
  empty-case line, as a two-line change with its own before/after diff.
- **`--audit` could sweep unknown header fields across all 64 work orders in one pass** instead of one
  gate report at a time. That is the natural home for it and it would have found all three of these
  fields in one run. Not asked for, and `--audit`'s scope is fragments and the roadmap dashboard.
  **Proposed follow-up**, small.
- **`Takes from` cannot actually be read.** `fieldRe('Takes from')` builds `\*\*Takes from\*\*`, and the
  one live instance is written `**Takes from WO-2.9**`, so the field is never parsed — it works as a
  *terminator* only because of the `\b` in the lookahead. Harmless today (nothing reads the field, and
  the table says so) and a genuine latent trap the moment anyone wants to read it. Not touched.
- **The two `**Blocks**` lines' prose** — untouched, per instruction. They are the fixtures.
- **The drift in the real trees** — there is none to fix. `--audit` is green on this tree, so the
  "do not fix the drift you find" trap never had a chance to bite. Had it gone red I would have
  reported it and stopped.
- **A tenth plant for the precondition** — declined, per the Traps. It runs before any plant exists,
  the plant count is still nine for nine behaviours, and I recorded that reasoning in
  `plans/verification-tooling.md` where the next person deciding whether their addition is a plant
  will look.

## Nothing here needed an iPad or human eyes

All eleven lines are harness behaviour, settled by running the script. No 👤 line exists in this work
order's Acceptance list, and I ticked none anywhere else. There is no UI surface, no student data, no
merge field, no print path, and no `localStorage` key in this change, so the constraints that usually
need a device have no target here.

## Boxes I ticked, in one list

`plans/work-orders/phase-2-attendance.md:1439-1468` — WO-2.16's Acceptance lines **1 through 11**, all
eleven, each with the evidence above. `node tools/wo-gate.mjs --tick WO-2.16 --dry-run` reads them
back as `NOTE | all 11 Acceptance lines are ticked — nothing holds WO-2.16 open`. Nothing else in the
repository has a box that this work order closes.

## Changelog entry, drafted for the teacher to accept, reject or rewrite

> ### Tooling
> - `wo-gate.mjs`: `**Blocks**` and `**Target**` are header fields in their own right, reported and
>   never acted on. `**Blocks**` had been read as a *dependency*, so WO-1.5 — the backup work order the
>   whole sprint is ordered around — was reported as waiting on WO-1.6 rather than the other way round.
>   Both were done, so nothing was gated wrongly; between two open work orders it would have been a
>   cycle the gate called satisfied. The underlying defect was general and is fixed generally: any
>   header field the script has never heard of used to be swallowed by the field written above it, and
>   the boundary between fields is now a position rather than a closed list of names. A field with no
>   row in the field table is now named by the gate as unread instead of quietly changing what its
>   neighbour means.
> - `wo-gate.mjs --self-check` states its precondition and checks it first: the trackers have to be
>   clean, because the check copies them and drift is what `--tick` refuses over. A dirty copy stops
>   the run with the drift named and nothing planted, instead of running nine plants and reporting two
>   healthy ones as failures. When a plant does fail, the subject's own `HELD` and its cause survive
>   into the output rather than being clipped off at 160 characters.
> - The `next` plant no longer depends on what the live running order happens to contain — its fixture
>   row sits above every real row. It had been red since the Ship 2 table was written, for a reason
>   that was not a defect in `next`.
