# WO-2.14 — Close two wo-gate blind spots found at WO-2.4 · implementer result

**Route** Claude, Opus tier, on the work order's own merits.
**Date** 2026-08-08.
**Verdict I am claiming** all ten Acceptance lines met, every one by running the thing rather than
reading the fence. None of the ten is a 👤 line, so none is owed to an iPad. One honest wrinkle on
line 10 is written out in full below — the first `verify-shell.mjs` run after the change came back
**399/400**, on a pre-existing time-dependent flake in a check my diff cannot reach; the re-run is
400/400/0-skips/exit 0 and the diagnosis is recorded rather than fixed.

**WO-2.14's own status line in `plans/work-orders/phase-2-attendance.md`: `⬜ NOT STARTED`, with all
ten Acceptance boxes ticked.** That is deliberate and it is what a verifier will find. This dispatch
began before `--start` existed, so nothing claimed it; leaving a `🔨 IN PROGRESS` behind would be
exactly the ambiguity the brief's third caution names — demonstration, claim, or leftover? The status
is the orchestrator's to write with `--tick` after a verdict, and `--tick WO-2.14 --dry-run` (run, not
guessed) says it will write `✅ DONE — 2026-08-08`, tick no roadmap box (this work order has no
**Closes roadmap** line) and move the phase-2 count 7 → 8.

---

## Files changed

| File | What changed |
|---|---|
| `c:\dev\planbook\tools\wo-gate.mjs` | The whole feature. `--start`, `--release`, `parseFile()` reads the Acceptance list, `--tick` branches on it, `next` names what it stepped over, the `gate()` collision note points at the way back, help text. +271/−30 lines. |
| `c:\dev\planbook\plans\work-orders\ROUTING.md` | The claim step as protocol: a new **Claiming comes first** paragraph in § The pipeline, and two sentences added to **Ticking follows the verdict** about the Acceptance-list refusal. |
| `c:\dev\planbook\.claude\agents\work-order-orchestrator.md` | New **### 2c. Claim it, before you write the brief** between the Codex probe and the brief — the point the work order names — plus one paragraph under *Applying the maintenance* about the refusal exiting non-zero. 22 lines. |
| `c:\dev\planbook\tools\README.md` | Truth maintenance: the table row, and the paragraph that said "`wo-gate.mjs --tick` is the only one that writes" — three flags write now, and it says which and what. |
| `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` | **Only** the ten Acceptance boxes under WO-2.14, `- [ ]` → `- [x]`. The status line is untouched. |

`git status --short` at the end of the run:

```
 M .claude/agents/work-order-orchestrator.md
 M plans/work-orders/ROUTING.md
 M plans/work-orders/phase-2-attendance.md
 M tools/README.md
 M tools/wo-gate.mjs
?? .claude/dispatch/WO-2.14-brief.md
?? .claude/dispatch/WO-2.14-status.md
```

The two untracked files are the orchestrator's own dispatch files, present before I started. **No
planted edit survives.** Every violation I planted is accounted for in the "planting and unwinding"
section at the bottom, and `git diff plans/` is empty except for the ten checkboxes above.

Not touched, and deliberately: `CHANGELOG.md` (a draft is at the end of this file, for the teacher to
accept or rewrite), `TESTING.md` (this is harness-of-the-harness work with nothing a teacher can
check by hand — WO-1.12, the same shape, has no `TESTING.md` section either, and says so).

---

## Against the Acceptance list, one by one

### 1. `--start` on a `⬜ NOT STARTED` work order writes `🔨 IN PROGRESS`, and a **second** `--start` on the same ID exits non-zero ✅

Run twice on WO-2.13, which was `⬜ NOT STARTED`:

```
$ node tools/wo-gate.mjs --start WO-2.13
start WO-2.13 — The totals are recomputed once per student; compute them once per render

plans\work-orders\phase-2-attendance.md:926
  - **Ship** 1 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-2.4
  + **Ship** 1 · **Status** 🔨 IN PROGRESS · **Size** S · **Depends on** WO-2.4

NOT touched: the roadmap, the dashboard, and every checkbox. A claim is not progress — the dashboards count ✅ DONE and nothing else.
PASS | WO-2.13 claimed — 🔨 IN PROGRESS. If this dispatch dies, --release WO-2.13 puts it back.
exit1=0

$ node tools/wo-gate.mjs --start WO-2.13
FAIL | WO-2.13 is "🔨 IN PROGRESS" — only ⬜ NOT STARTED may be claimed
     | a dispatch has already claimed it. If that dispatch is gone: --release WO-2.13
exit2=1
```

The write landed on disk (`git diff` showed the one status line changed, quoted in the session) and
the second call refused. Released afterwards; the file is back at `HEAD`.

Also proved that `gate()`'s guard is now armed, which is the point of the whole flag:

```
$ node tools/wo-gate.mjs WO-2.13
NOTE | WO-2.13 is already 🔨 IN PROGRESS — a dispatch has claimed it. Ask before proceeding; if that dispatch is gone, --release WO-2.13 puts it back to ⬜ NOT STARTED
```

### 2. `--start` refuses `✅ DONE`, `🚧 BLOCKED` and `🔒 GATED` without editing the file ✅

No work order in the repo carries `🚧 BLOCKED`, so I **planted one** on WO-2.5 (and unwound it). The
three files that hold the three statuses were hashed before and after all three refusals:

```
$ node tools/wo-gate.mjs --list | grep -E "WO-2.4 |WO-2.5 |WO-7.1 "
WO-2.4   ✅ DONE                 🚩 Counts & attendance percentage
WO-2.5   🚧 BLOCKED                Keyboard & touch pass          <- planted
WO-7.1   🔒 GATED                  Auth

--- --start WO-2.4 ---
FAIL | WO-2.4 is "✅ DONE" — only ⬜ NOT STARTED may be claimed
exit=1
--- --start WO-2.5 ---
FAIL | WO-2.5 is "🚧 BLOCKED" — only ⬜ NOT STARTED may be claimed
exit=1
--- --start WO-7.1 ---
FAIL | WO-7.1 is "🔒 GATED" — only ⬜ NOT STARTED may be claimed
exit=1

=== sha256 of phase-1, phase-2 and phase-7, before vs after ===
IDENTICAL — none of the three refusals edited a file
```

### 3. A claimed work order does **not** move either dashboard ✅

Immediately after the successful `--start WO-2.13` above, with the claim on disk:

```
$ git diff --stat plans/work-orders/README.md plans/ROADMAP.md
(empty)
$ git diff plans/work-orders/phase-2-attendance.md
  ... exactly one changed line, the **Status** field ...
```

`recomputeDashboard()` is untouched by this work order — it still counts
`w.status.startsWith('✅ DONE')` and nothing else, and `applyStart()` never calls it. The proof above
is the file comparison rather than the code reading, per the work order.

### 4. The way back returns a claimed work order to `⬜ NOT STARTED`, and says so in one line ✅

The flag is **`--release`** (my naming choice — see "Decisions the work order didn't settle").

```
$ node tools/wo-gate.mjs --release WO-2.13
release WO-2.13 — The totals are recomputed once per student; compute them once per render

plans\work-orders\phase-2-attendance.md:926
  - **Ship** 1 · **Status** 🔨 IN PROGRESS · **Size** S · **Depends on** WO-2.4
  + **Ship** 1 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-2.4

PASS | WO-2.13 released — the claim is gone, it is ⬜ NOT STARTED again and back in `next`. Nothing else was touched.
exit=0

$ git diff --stat plans/          # nothing: byte-identical to before the claim
$ node tools/wo-gate.mjs next --quiet
WO-2.13                            # back in the running order

$ node tools/wo-gate.mjs --release WO-2.13     # nothing claimed
FAIL | WO-2.13 is "⬜ NOT STARTED" — only a claimed (🔨 IN PROGRESS) work order can be released
exit=1
```

The "one line" is the `PASS |` line. The two-line diff above it is the house style every other write
in this script uses, and I judged consistency worth more than a literally-one-line output; if the
verifier reads that line as "print nothing else", it is a two-line deletion.

### 5. `--tick` on a work order with one unticked Acceptance line writes `🔨 IN PROGRESS`, not `✅ DONE`, and names that line ✅ — the violation was planted

I reproduced the WO-2.4 moment exactly rather than inventing a fixture. Planted, in four edits: WO-2.4
back to `⬜ NOT STARTED` (the status it actually carried through its whole dispatch), **one Acceptance
line unticked**, its roadmap box back to `- [ ]`, and the dashboard back to its pre-tick counts
(phase 2: 6, total 19, 31%).

**First, the counterfactual** — a copy of the pre-WO-2.14 script from `HEAD`, on that planted state,
which is the check being able to catch the gap it is named for:

```
$ git show HEAD:tools/wo-gate.mjs > tools/wo-gate-HEAD-counterfactual.mjs
$ node tools/wo-gate-HEAD-counterfactual.mjs --tick WO-2.4 --dry-run
tick WO-2.4 — Counts & attendance percentage   (DRY RUN — nothing written)

plans\work-orders\phase-2-attendance.md:257
  - **Ship** 1 · **Status** ⬜ NOT STARTED · ...
  + **Ship** 1 · **Status** ✅ DONE — 2026-08-08 · ...
plans\ROADMAP.md:278
  - - [ ] 🚩 Per-student counts and attendance % ...
  + - [x] 🚩 Per-student counts and attendance % ...
plans\work-orders\README.md:57 ... | 13 | 6 |  ->  | 13 | 7 |
plans\work-orders\README.md:65 ... **19** ... 31%  ->  **20** ... 32%
DRY RUN | re-run without --dry-run to apply.
exit=0
```

That is the failure this work order exists for, on screen: the old script stamps done over an open
box, closes the roadmap line, moves both dashboards, and exits 0. (The copy was deleted immediately;
it never wrote anything, being a dry run.)

**Then the new script, same planted state, for real:**

```
$ node tools/wo-gate.mjs --tick WO-2.4
tick WO-2.4 — Counts & attendance percentage

plans\work-orders\phase-2-attendance.md:257
  - **Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-2.1, WO-2.3
  + **Ship** 1 · **Status** 🔨 IN PROGRESS · **Size** M · 🚩 · **Depends on** WO-2.1, WO-2.3

HELD | 1 of 6 Acceptance lines are still [ ] — WO-2.4 is not done:
  plans\work-orders\phase-2-attendance.md:280  A student with one excused absence out of ten meetings shows 100%, not 90%.

NOTE | roadmap boxes left unticked and the dashboard left alone — an unfinished work order closes nothing.
HELD | WO-2.4 left at 🔨 IN PROGRESS. Tick the lines above once they are true, then run this again.
exit=1
```

The line is named with its file and line number as well as its text. A second run against the same
state adds `NOTE | the status line already reads "🔨 IN PROGRESS" — left exactly as it is` rather
than pretending to an edit.

### 6. That same refusal leaves every roadmap box it *Closes* unticked ✅

Read off disk after the refusal above, with the planted `- [ ]` still in place:

```
$ grep -n "Per-student counts and attendance" plans/ROADMAP.md
278:- [ ] 🚩 Per-student counts and attendance % **over recorded meetings of that class**, per term and

$ sed -n '57p;65p' plans/work-orders/README.md
| 2 — Attendance | 13 | 6 | 🔨 IN PROGRESS |
| | **62** | **19** | `[███░░░░░░░] 31%` |
```

Both are the planted pre-tick values — the refusal wrote the status line and nothing else. In code:
`roadmapEdits()` is not called at all on the held path, and `recomputeDashboard()` is unreachable
past the `return 1`.

### 7. `--tick` on a fully ticked work order still writes `✅ DONE — <date>`, ticks its roadmap boxes and recomputes the dashboard ✅

Same planted state, with the one line ticked back the way an orchestrator would once it became true:

```
$ node tools/wo-gate.mjs --tick WO-2.4
tick WO-2.4 — Counts & attendance percentage

plans\work-orders\phase-2-attendance.md:257
  - **Ship** 1 · **Status** 🔨 IN PROGRESS · ...
  + **Ship** 1 · **Status** ✅ DONE — 2026-08-08 · ...
plans\ROADMAP.md:278
  - - [ ] 🚩 Per-student counts and attendance % ...
  + - [x] 🚩 Per-student counts and attendance % ...
plans\work-orders\README.md:57
  - | 2 — Attendance | 13 | 6 | 🔨 IN PROGRESS |
  + | 2 — Attendance | 13 | 7 | 🔨 IN PROGRESS |
plans\work-orders\README.md:65
  - | | **62** | **19** | `[███░░░░░░░] 31%` |
  + | | **62** | **20** | `[███░░░░░░░] 32%` |

NOT touched, by rule: any TESTING.md line carrying 👤, and CHANGELOG.md — that is prose the teacher writes.
PASS | WO-2.4 ticked.
exit=0
```

Byte-for-byte the same four edits the old script planned, and the tree came out **identical to
`HEAD`** afterwards — `git diff plans/` empty, which is the unwind for the whole plant and the
regression check in one.

The success path gained one line I added on purpose:
`NOTE | all N Acceptance lines are ticked — nothing holds <ID> open`. "All 0 lines are ticked" is what
a parser that found nothing would print, and that should be visible rather than inferred — the
vacuous-pass guard `tools/README.md` § "Two rules that follow from those" asks for.

**The parser was checked against every phase file, not one specimen.** I copied `plans/` and the
script into a scratch tree, planted `⬜ NOT STARTED` on every status line there so the fence could not
short-circuit, and ran `--tick <ID> --dry-run` for all 61 work orders. Every count matches an
independent scan I wrote *before* the parser existed: WO-2.1 = 12 (its second item carries an indented
blockquote with blank lines in it, which is why the list must not end at the first blank line),
WO-2.10 = 14, WO-3.4 = 9 (its heading is `**Acceptance** — each verified against a hand computation…`,
not bare), and the four `gates.md` work orders reported as having no list at all. Nothing in the real
repo was touched by that run.

### 8. `--dry-run` on `--start` and on the new `--tick` path prints the exact edit and writes **nothing** ✅

Compared with `sha256sum`, not with the banner. Three dry runs, three comparisons:

```
--start WO-2.13 --dry-run
  before/after sha256 of phase-2-attendance.md, README.md, ROADMAP.md: all three identical
--release WO-2.13 --dry-run
  before/after sha256 of phase-2-attendance.md: identical
--tick WO-2.4 --dry-run   (on the planted, held state — the NEW path)
  before/after sha256 of phase-2-attendance.md, ROADMAP.md, README.md: IDENTICAL
  output: the exact status edit, then HELD | 1 of 6 ..., then
  "DRY RUN | re-run without --dry-run to write 🔨 IN PROGRESS. It will still refuse to write ✅ DONE."
  exit=1
```

The held dry run exits 1 like the real one: a dry run reports what would happen, and what would
happen is a refusal.

### 9. `next` names any `🔨 IN PROGRESS` row it stepped over, and why ✅

With WO-2.13 claimed (a real `--start`, not a hand edit):

```
$ node tools/wo-gate.mjs next
skipped WO-2.13 — The totals are recomputed once per student; compute them once per render
  🔨 IN PROGRESS: a dispatch has claimed it, so this steps over it. If that dispatch is gone: node tools/wo-gate.mjs --release WO-2.13

next: WO-G1 — Ship 1 go-live rehearsal
  ...

$ node tools/wo-gate.mjs next --quiet          # stdout
WO-G1
$ node tools/wo-gate.mjs next --quiet 2>&1 >/dev/null    # stderr
skipped WO-2.13 — The totals are recomputed once per student; compute them once per render
  🔨 IN PROGRESS: a dispatch has claimed it, so this steps over it. If that dispatch is gone: node tools/wo-gate.mjs --release WO-2.13
```

`--quiet`'s stdout is still exactly one ID for whatever parses it; the skip goes to stderr so it
cannot be lost and cannot corrupt the answer.

### 10. `verify-shell.mjs` and `wo-sweep.mjs` still run clean afterward — 400/400/0-skips and exit 0 ✅, with a flake to report

```
$ node tools/wo-sweep.mjs
11 checks · 10 passed · 0 failed · 1 to review        exit 0
```

Identical to the baseline I took before touching anything (the one REVIEW is the standing
sensitive-field-names review).

```
$ node tools/verify-shell.mjs        # baseline, before any edit
400 checks · 400 passed · 0 failed · 0 skipped        exit 0

$ node tools/verify-shell.mjs        # after the change — FIRST run
400 checks · 399 passed · 1 failed · 0 skipped

$ node tools/verify-shell.mjs        # after the change — SECOND run
400 checks · 400 passed · 0 failed · 0 skipped        exit 0
```

**I am not going to call that first run noise without saying what it was.** The failing check was
*"no support detail, and no memory of the panel being open, reached localStorage, and every key
present is ours"* (`tools/verify-shell.mjs:4166`). Its detail listed five keys, all `planbook_`
prefixed, so the failing conjunct was `foundIn(supportBlob).length === 0` — the needle list at
`:3884` includes the plan name `'504'`, and it is searched as a plain substring against the JSON of
every localStorage **value**. That run's `planbook_lastBackupAt` held
`{"2026-2027":1786195504308,"2030-2031":1786195504308}` — an epoch-millisecond stamp written earlier
in the same run, containing the digits `504`. The check went red about the clock.

Why I am confident it is not mine: my diff touches `tools/*.mjs`, `plans/`, and an agent definition —
`index.html`, `src/`, `sw.js` and `manifest` are byte-identical to `HEAD` (`git diff --stat` above),
and the harness loads nothing else. The baseline run on the untouched tree and the second run on the
changed tree both pass; the two runs that differ are two clocks, not two trees.

I did **not** fix it. It is `tools/verify-shell.mjs`, this work order's Out of scope is explicit about
staying in the file that has the blind spots, and narrowing a sensitive-data needle is precisely the
kind of change `tools/README.md` trap 8 says not to make casually. It is written up as a proposed
follow-up below.

---

## Planting and unwinding — every edit I made outside the shipped diff

The tree was clean when I started (only the orchestrator's own `WO-2.14-brief.md` and
`WO-2.14-status.md`, untracked). Four plants, all unwound:

| Plant | Why | How it came back |
|---|---|---|
| `🚧 BLOCKED` on WO-2.5's status | no work order in the repo carries it, and line 2 names it | `git checkout -- plans/work-orders/phase-2-attendance.md`, verified by `git status` |
| WO-2.5 claimed by accident | a shell `&&` chain broke where I expected it to stop, and a `--start WO-2.5` ran for real | `--release WO-2.5`, then confirmed `git diff plans/` empty |
| WO-2.4 back to `⬜ NOT STARTED`, one Acceptance line unticked, its roadmap box unticked, dashboard back to 6/19/31% | lines 5, 6 and 7 — the WO-2.4 case reproduced | the successful `--tick WO-2.4` in line 7 restored all four to their committed values; `git diff plans/` empty afterwards, confirmed |
| A copy of `HEAD`'s script at `tools/wo-gate-HEAD-counterfactual.mjs` | the counterfactual in line 5 | `rm` in the same command; it only ever ran `--dry-run` |
| Every status line set to `⬜ NOT STARTED` across a **copy** of `plans/` in the scratchpad | to reach the Acceptance parser for all 61 work orders including the DONE and GATED ones | never in the repo; the copy lives in the session scratchpad and touches nothing here |

The one thing I changed in `plans/` on purpose is the ten Acceptance boxes under WO-2.14, and the
`git diff` for that file shows those ten lines and nothing else.

---

## Decisions the work order didn't settle, and which way I went

1. **The way back is called `--release`.** It reads as the inverse of a claim, it is not a status
   (`🚧 BLOCKED` stays a human's word, per Out of scope), and it does not suggest failure the way
   `--abandon` would. One flag, one line of output.

2. **The refusal exits 1 and prints a new verb, `HELD`.** Not `FAIL`: nothing failed, the tool wrote
   what was true. Not `PASS`: the caller asked to close a work order and it is not closed. `wo-sweep.mjs`
   set the precedent for a third state that is honest rather than binary (`REVIEW`). Non-zero because
   an orchestrator that reads only the exit code must not record this as a tick applied. The
   orchestrator definition now says in as many words that this is not a failure.

3. **A work order with no `**Acceptance**` block proceeds to `✅ DONE`, loudly.** `gates.md`'s four
   are checklists with no such heading, and refusing them would break a path that works today for a
   file shape the work order never mentions. So: `NOTE | WO-G1 has no **Acceptance** list — nothing
   here could hold it open, so this status is written on the caller's word alone`. Refusing instead
   is a one-line change if the teacher prefers it.

4. **One shared helper, `statusEdit()`, and I want the verifier to look at it.** The trap says not to
   collapse the two gaps into one flag, and I have not: `applyStart()`, `applyRelease()` and
   `applyTick()` each carry their own fence, their own decision and their own write. What they share
   is a function that rewrites the `**Status**` field of one line of text and has no opinion in it —
   it cannot tick a box, read a checkbox, or touch the roadmap. Three copies of that one regex would
   have been three places for the `·` handling to drift. The reasoning is in a comment at the
   function, naming the trap it is answering.

5. **`next --quiet` sends skips to stderr.** Its stdout is one ID that something else parses; a loud
   skip that corrupted that would be a worse bug than the silence it replaces.

6. **WO-2.14's own status stays `⬜ NOT STARTED` with all ten boxes ticked** — reasoning at the top of
   this file.

7. **`CHANGELOG.md:780` still says "`wo-gate.mjs --tick` is the only one that writes."** Left alone: it
   is a released changelog entry describing what was true on the day, and rewriting history there is
   the teacher's call. `tools/README.md`, which is current documentation rather than a record, was
   corrected.

---

## Proposed follow-ups (not done, and not in scope)

1. **The `'504'` needle in `verify-shell.mjs` collides with epoch timestamps.** Diagnosed above; it
   will keep going red about the clock every so often, and it goes red on the check whose subject is
   *sensitive data in localStorage* — the worst place for a cry-wolf. Trap 8 in `tools/README.md` says
   the fix belongs in the environment or the fixture rather than in the assertion: the honest repair is
   to search values for `504` only where a plan value could be, or to make the needle
   `"504"`-with-quotes / word-boundary rather than a bare substring. Small, and it is `verify-shell.mjs`
   rather than this work order's file.

2. **Nothing checks `tools/wo-gate.mjs` on a standing basis, and this work order does not change
   that.** `verify-shell.mjs` drives a browser and `wo-sweep.mjs` greps `src/` — neither can express
   "the tracker was told the truth". The evidence for all ten lines above is planted violations run by
   hand, which is what WO-1.12 did and what the Traps section asks for; it is not a check that will
   still be there in November. `verification-tooling.md`'s one-file rule and "no second harness" are
   both live constraints here, so this is a conversation for the teacher rather than a thing to build:
   the cheapest honest option is a `--self-check` mode inside `wo-gate.mjs` that runs the plants
   against a temp copy of `plans/`, and the reason I did not write it is that it is a new *kind* of
   thing in a file whose work order says it stays what it is.

3. **`--start` is protocol now, but no dispatch has run it yet.** The first real use is the next
   `/wo`. If the orchestrator forgets step 2c, nothing complains — the collision guard just stays
   unarmed as before. Worth watching for one or two dispatches.

---

## Draft `CHANGELOG.md` entry — for the teacher, not written by me

> **Work order dispatch: a work order can now be claimed, and a tick can be refused.**
> `tools/wo-gate.mjs` grew `--start` and `--release`. A dispatch claims its work order before the
> brief is written, which is what finally arms the "already 🔨 IN PROGRESS" guard the gate report has
> printed since the beginning and never been able to fire — WO-2.4 ran two Codex rounds, a correction
> and two verifier passes while the tracker said nobody had started it. A claim writes one status line
> and moves no dashboard; `--release` puts it back when a dispatch dies, and `next` names every claimed
> row it steps over so an abandoned claim cannot quietly delete a work order from the running order.
> `--tick` now reads the work order's own Acceptance list before it writes anything: one box still
> open and it writes `🔨 IN PROGRESS` instead of `✅ DONE`, names the lines that held it open, and
> leaves the roadmap alone. Landing at 🔨 with 👤 lines owed is what this project actually does — WO-2.1,
> WO-2.11, WO-2.12 — and until now it was hand-edited every time, because the tool could only write
> done. At WO-2.4 the offered maintenance would have stamped ✅ DONE on a go-live blocker with two
> lines still owed to the owner; that was caught by reading the source, which is not a control.

---

## What I could not verify

Nothing on this list is owed to an iPad — there is no UI in this work order and no 👤 line in it. Two
honest limits:

- **The Acceptance parser agrees with an independent scan I wrote myself**, before the parser existed
  and with a different block-boundary rule, across all 61 work orders in 9 files. Two readings by the
  same head is weaker evidence than two readings by two heads, and I am saying so rather than calling
  it independent.
- **The `--start` protocol has never been exercised by a real dispatch**, only by me running the flag.
  The prose in `ROUTING.md` and the orchestrator definition is a claim about what the next dispatch
  will do, and the first `/wo` after this is the thing that tests it.
