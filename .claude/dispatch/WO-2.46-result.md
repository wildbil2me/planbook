# WO-2.46 — result

**Implementer** Claude (work-order-implementer), Opus · **Date** 2026-08-17
**Work order** `plans/work-orders/phase-2-attendance.md` § WO-2.46
**Status left at** 🤖 CLAIMED — `wo-gate.mjs --tick` sets the Status, not me. All seven Acceptance
boxes are ticked; none of them is 👤.

---

## Files changed

- `c:\dev\planbook\tools\verify-shell.mjs` — the whole of the change (+137/−36 lines against HEAD,
  of which ~95 are comment).
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — the seven Acceptance boxes ticked, and
  nothing else. (`git diff --stat` shows 83 lines on this file because the WO-2.46 row itself was
  already uncommitted in the working tree when I arrived; my edit is the 13-line Acceptance block.)

**Nothing under `src/` changed.** `src/live-region.js` was mutated twice as a measurement and
reverted twice. Final `git status --porcelain -- src/` prints nothing.

`node --check tools/verify-shell.mjs` passes. CR bytes in `tools/verify-shell.mjs`: **0** — no
line-ending rewrite.

---

## Runs, in the order they happened

Six full `verify-shell.mjs` runs, all in this environment, all read to their exit before being
reported here. The harness **does** run in this sandbox (as it did on 2026-08-16).

| # | Tree | `announce()` defer | Summary line, verbatim |
|---|---|---|---|
| 0 | unfixed | 30ms | `824 checks · 824 passed · 0 failed · 0 skipped` · `22,191 lines · 26.9 lines per check · 260s` |
| 1 | **unfixed** | **3000ms** | `824 checks · 813 passed · 11 failed · 0 skipped` · `22,191 lines · 26.9 lines per check · 268s` |
| 2 | **fixed** | **3000ms** | `824 checks · 816 passed · 8 failed · 0 skipped` · `22,286 lines · 27.0 lines per check · 279s` |
| 3 | fixed | **30000ms** | `824 checks · 809 passed · 15 failed · 0 skipped` · `22,286 lines · 27.0 lines per check · 298s` |
| 4 | fixed | 30ms | `824 checks · 824 passed · 0 failed · 0 skipped` · `22,286 lines · 27.0 lines per check · 262s` |
| 5 | fixed | 30ms | `824 checks · 824 passed · 0 failed · 0 skipped` · `22,286 lines · 27.0 lines per check · 259s` |

Run 0 was the "can the harness run here at all" probe the brief asked for, taken before I wrote
anything. It doubles as the before-picture: the unfixed tree really was green at 30ms, which is the
row's own point — these three have never been seen red.

`node tools/wo-sweep.mjs` → `20 checks · 18 passed · 0 failed · 2 to review`, exit 0.

---

## Against the Acceptance list, one line at a time

### 1. Each of the three waits exits on the flag **and** the sentence its check tests, from one pair of samples, no fixed sleep in the change, no cap raised — ✅ met

All three now go through `waitForPassAlert()`, whose exit condition is
`alerted === level && saidRe.test(heardNow)` over a `read()`/`heard()` pair taken together, and
which hands back the pair it exited on (unchanged WO-2.42 machinery).

- **`said41`** — `const alert41 = await waitForPassAlert(outA, ALERT_41_SAID, 2);` The three readings
  the check makes now come from that one call: `alert41.said`, `alert41.state.openPasses…`, and
  `card41` off `alert41.state.passBanner.cards[0]`. `cardTicked.over` no longer supplies the card
  half.
- **`saidFive`** — `setTimeout(250)` deleted; `waitForPassAlert(outB, NURSE_FIVE_SAID, 1)`.
- **`saidTen`** — `setTimeout(250)` deleted; `waitForPassAlert(outB, NURSE_TEN_SAID, 2)`.

Both sentence patterns are held in a `const` and passed to **both** the wait and the check, so what
the loop waits for and what the check tests are the same object — the `PASS_ALERT_SAID` precedent.

No sleep was added anywhere. The cap is untouched at `24 × 250ms` — I did not edit the loop bound,
and the same helper still serves the three pre-existing callers. Two sleeps were removed; the fixture
retains exactly one `setTimeout(250)`, the fourth site, deliberately (see line 5).

### 2. Measured as a difference: red on the unfixed tree at 3000ms, green on the fixed one — ✅ met

**Run 1 (unfixed, 3000ms) — the three, quoted verbatim:**

```
FAIL | a trip that crossed BOTH thresholds while nothing was watching escalates once, to the second alert, and says how long it really is  :: the pass now carries alerted = 2 with keys "alerted,classId,id,note,out,studentId,type", the card is at level 2, and what was announced is "nothing has been announced since this sentinel was written"
FAIL | the first alert fires at five minutes: the card escalates, the pass records the level, and the sentence names the student  :: the card is at level 1 reading "5:12", the pass records alerted = 1, and the announcement was "nothing has been announced since this sentinel was written"
FAIL | and the second fires at ten, once, taking the card with it  :: the card is at level 2 reading "10:24", alerted = 2, announced as "nothing has been announced since this sentinel was written"
```

Note what those three lines say about the app: `alerted` was 2/1/2 and the card was at 2/1/2 in every
one of them. The record and the card were correct. Only the announcement was missing — the
two-task race, made visible by widening it.

**Run 2 (fixed, 3000ms):** all three PASS. Full failing set went from 11 to 8.

**The whole delta, reported rather than curated** (Traps: this is data, not a failure):

*Gone between run 1 and run 2 — four:*
- the three above, and
- `and it does not fire again on the next tick, or the next, while the same student is still out` —
  a neighbour I did not touch. It reddened at 3000ms on the unfixed tree because the 41-minute
  announcement had not landed before its `hush()`, so the deferred write arrived *after* the hush and
  the check saw a sentence where it demanded silence. Fixing the wait above it means the sentence has
  arrived before the hush, which is the ordering the check always assumed.

*Still red in both, and none of them mine — seven:*
`announce() lands text in the single polite .sr-only region` · `a term id belonging to ANOTHER class
writes no preference…` · `with the sound off the tone is not played…` · `archiving a class with a
student still out is refused…` · `Enter at the bottom of a column…` · `ArrowLeft at the first
assignment clamps…` · `ArrowRight at the last assignment clamps…`. Every one reads the live region
behind its own margin, which is what the mutation was expected to do to 22,000 lines. Not chased.

*New in run 2 — one, and I want to be explicit that I caused it:*
```
FAIL | a student who comes back and goes out again starts clean: no alert level on the new pass, none in the log entry, and nothing announced  :: the finished trip is {…"minutes":11…}
```
That check asserts `loggedB.minutes === 10`. The pass is wound back 5.2 minutes twice, so it carries
10.4 minutes plus however long the fixture takes between the winds — about 6 seconds of headroom
before it rounds to 11. My two waits, correctly, now *wait for the announcement*, and at a 3000ms
defer that is ~3s each, which spends the headroom. It reddens again at 30000ms (run 3), for the same
reason and harder. **At 30ms the waits return on their first or second sample and the check passes**
— runs 4 and 5 are 824/824 with zero FAIL lines. So: an artifact of the measurement interacting with
the fix, not a defect in it — but I am naming it rather than filing it under "unrelated", because it
was green on the unfixed 3000ms run and red on the fixed one, which is the one direction a reader is
entitled to be told about.

### 3. The new condition can still fail — ✅ met

**Run 3 (fixed, 30000ms — past the 6s cap):** all three go red.

```
FAIL | a trip that crossed BOTH thresholds while nothing was watching escalates once, to the second alert, and says how long it really is  :: … the card is at level 2, and what was announced is "nothing has been announced since this sentinel was written"
FAIL | the first alert fires at five minutes: the card escalates, the pass records the level, and the sentence names the student  :: the card is at level 1 reading "5:18", the pass records alerted = 1, and the announcement was "José Álvarez has been out on a bathroom pass for 5 minutes."
FAIL | and the second fires at ten, once, taking the card with it  :: the card is at level 2 reading "10:37", alerted = 2, announced as "Scores for Period 3 — Biology."
```

On the failure text naming the announcement that never arrived, said precisely: the check **label**
names the announcement that was expected ("the sentence names the student", "the second fires at
ten"); the **detail** prints what was in the live region instead. At the 41-minute site that is
literally `nothing has been announced since this sentinel was written`. At the other two, at 30s, a
*stale earlier* sentence had by then drained into the region — the bathroom five-minute one, and a
navigation announcement — so the detail names, exactly, the wrong announcement. A reader of that
output can tell in one line which announcement failed to arrive and what was there in its place. I
did not add the awaited pattern to the detail string; I judged the existing text sufficient and the
addition out of scope.

Also worth recording: at 30000ms the **three pre-existing WO-2.42 callers** go red too — `with a
pass open, crossing a threshold still fires the alert while the teacher is on Scores`, `with no
banner node for the pass…`, and `and the clock still reaches that student five minutes later…`. The
whole helper family fails past its cap and passes inside it, which is the shape a wait should have.
15 failures total at 30000ms.

### 4. `src/live-region.js` restored byte-identically — ✅ met

- md5 **before the first mutation**: `deb65cffbf947bd3c4d5e3e0e41ea8a8`
- md5 **after the last revert**: `deb65cffbf947bd3c4d5e3e0e41ea8a8`
- `git diff --stat -- src/` → empty. `git status --porcelain -- src/` → empty.

The only line touched was `src/live-region.js:25`, `30` → `3000` → `30` → `30000` → `30`. Nothing was
committed at any point; the tree was never committed dirty. (Hash taken with `md5sum`, which prints
`deb65cffbf947bd3c4d5e3e0e41ea8a8*src/live-region.js` in binary mode — same digest.)

### 5. The `waitForPassAlert()` decision and the fourth-site answer, both in writing at the code — ✅ met

**`waitForPassAlert()` — parameterised, not twinned.** A new comment block sits immediately above the
helper, headed `── WO-2.46: ONE HELPER FOR ALL SIX CALLERS, AND THE LEVEL IS AN ARGUMENT TOO ──`. The
argument, in short: a second local wait would be a *copy of the exit condition*, and a copy of the
exit condition is exactly what `PASS_ALERT_SAID` is held once to prevent one line above it. The
signature is now `(studentId, saidRe, level)`.

**The level takes no default**, and the block says why with a concrete case rather than a principle:
the ten-minute caller winds a pass that is *already* at `alerted === 1`, so a defaulted 1 could never
be satisfied together with the ten-minute sentence — the loop would burn all 24 iterations and hand
back whatever the last read held, and the check would go green off a six-second sleep. That is
WO-2.42's own failure mode in a new field. The three pre-existing callers now pass `1` explicitly
(`:11186`, `:11255`, `:13031` on the fixed tree).

**The fourth site — deliberately left**, with a comment block above it headed `── WO-2.46: THIS SLEEP
IS DELIBERATELY LEFT, AND THE THREE READINGS BELOW ARE NOT ──`. Two reasons, both at the code:

1. Its check reads no announcement — the card's figure, the WO-2.29 sentinel, the note field. All
   three are DOM state that `visibilitychange`'s handler has already written by the time `wakeUp()`'s
   own evaluation returns, because `src/attendance.js` calls `paintPassElapsed()` synchronously from
   that listener. There is no two-task pair, so there is nothing for a poll to close.
2. **A poll here would measure less, not more.** The check is about coming *back* to the screen. But
   the 1s interval recomputes from the same stamp, so a bounded poll for `/^41:\d{2}$/` would be
   satisfied by the interval a second later on a build with no `visibilitychange` handler at all —
   the check would go green having stopped being about the wake. The single read taken right after
   `wakeUp()` is what keeps the claim; the 250ms is slack in front of it, not the defence trap 5
   warns about.

**And the third Deliverable — `said41`'s interval check keeps its exact meaning — is also written at
the code**, in the block headed `── WO-2.46: A SECOND BOUNDED WAIT, AFTER THE POLL AND NOT INSIDE IT
──`. Stated there and repeated here so the verifier can check it against the file:

> *Before this row* the interval check asserted: the card's figure differs from `before1s`, it reads
> 41 or 42 minutes, and the sentinel is still on it — off the exit sample of a loop whose only exit
> condition is the figure changing with nothing but a wait in between.
> *After this row* it asserts **precisely that**, off the same sample of the same loop. The check
> body at `:11390–11394` is byte-identical.

I did **not** fold the escalation into that poll, per the Traps. The reason is in the comment: a loop
that could also exit on an alert might hand the interval check a sample from a paint the *wake* did,
and "the only check here that watches the TIMER rather than the arithmetic" would quietly have become
an arithmetic check while still reading green. A second bounded wait after it costs a few hundred
milliseconds and leaves the older claim where it was.

### 6. `verify-shell.mjs` green on two consecutive unmutated runs — ✅ met

Runs 4 and 5, back to back on the fixed tree at the restored 30ms defer, both:

```
824 checks · 824 passed · 0 failed · 0 skipped
22,286 lines · 27.0 lines per check · 262s      (run 4)
824 checks · 824 passed · 0 failed · 0 skipped
22,286 lines · 27.0 lines per check · 259s      (run 5)
```

Zero `FAIL` lines in either. Exit 0 for both. Check count is unchanged at 824 — this row added no
coverage, as its **Out of scope** requires.

### 7. `node tools/wo-sweep.mjs` green — ✅ met

```
20 checks · 18 passed · 0 failed · 2 to review
```

Exit 0. The two REVIEW items — *sensitive field names outside `src/backup.js`* and *due-date and
late/missing on the same line* — are the standing pair, both pointing only at `src/` files this row
did not touch. Two sweep checks are worth quoting because they bear directly on scope:

- `the recorded check() call-site count matches the harness :: 808 check() call site(s) …, matching
  tools/README.md:955` — unchanged, i.e. no check added or removed.
- `every SHELL file change is paired with a CACHE bump :: planbook-shell-v72 was set at 5ea832f; no
  SHELL file has changed since` — nothing shipped changed, so no `sw.js` bump is owed.

---

## What I could not verify

Nothing in this Acceptance list needs an iPad or human eyes — it is entirely harness work, and I ran
every command I report. **No 👤 line was ticked, and this row has none.** The standing caveat still
applies and I am not claiming past it: a green `verify-shell.mjs` closes no manual item, and the
overdue-alert behaviour this fixture models is still owed to a human on a device.

The one thing I am reporting as *inference* rather than measurement: my claim that the new
`a student who comes back and goes out again starts clean` failure at 3000ms is a wall-clock budget
artifact rests on reading the check (`loggedB.minutes === 10`), the arithmetic of two 5.2-minute
winds, and two 824/824 runs at 30ms. I did not instrument the elapsed time directly.

## Decisions the work order did not settle

1. **`ticked` was deleted.** With the escalation reading its own sample, the interval poll's
   `let ticked = null` had no reader left. I inlined the `read()` inside the loop and dropped the
   binding rather than leave a variable assigned and never used. This *is* an edit inside a loop I
   also claim is untouched, so to be exact: the exit condition, the cap, the sleep and the sample
   handed to the interval check are unchanged; a dead binding went. There is a comment at that line
   saying so.
2. **The `view` round-trip in `waitForPassAlert()` was left unconditional.** Only the two WO-2.28
   walks assert it; the three new callers ignore it and pay one CDP round-trip. Making it conditional
   would have put a second shape in the one function I had just argued should have one. Noted at the
   code.
3. **I did not add the awaited pattern to the three failure-detail strings.** It would have made
   Acceptance 3 read more literally, but it is a change to what a check *prints*, not to what it
   waits on, and this row fixes waits. Flagged here instead.

## Temptations declined, per Out of scope

- **The fourth site's 250ms could be deleted outright and the check would get stronger.** Removing it
  narrows the window in which the 1s interval, rather than the wake, could have done the repaint —
  which is the only way that check could currently go green on a build with no `visibilitychange`
  handler. I left it: the row asked for a sentence about that site, not a change to it, and the
  sentence is at the code. **This is a real, small, available improvement and would make a fine XS
  row.**
- **Seven checks elsewhere read the live region behind their own margin** and reddened under the
  3000ms mutation (listed under Acceptance 2). They are the same trap-5 shape this row exists to
  fix, in other blocks. `verify-shell.mjs`'s rest is explicitly out of scope here, and the Traps line
  says not to chase them. **They are now enumerated, with a reproduction recipe** — set
  `src/live-region.js:25` to 3000, run, revert — which is more than WO-2.42's audit had. A follow-up
  row could take them as a set.
- I did not touch `tools/README.md` trap 5. It already states the rule this row applies; nothing in
  the fix contradicts or extends it.

## Draft CHANGELOG entry — for the teacher to accept, reword or bin

> **Harness** — the three remaining pass-block readings that sampled the live region behind a fixed
> sleep or an unrelated poll now wait on the flag *and* the sentence together, the way WO-2.42's
> helper does. `waitForPassAlert()` takes the alert level as a required argument so one loop serves
> all six sites. Measured rather than asserted: widening `announce()`'s 30ms defer to 3000ms reddens
> all three on the old code and none on the new.
