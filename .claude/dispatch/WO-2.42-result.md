# WO-2.42 — result

**Route** Claude (work-order-implementer) · **Reported** 2026-08-17
**Work order** `plans/work-orders/phase-2-attendance.md` § WO-2.42

---

## The short version

The seam was where the work order said it was, and the work order's diagnosis survived contact. What
it did not name is the *mechanism*, and the mechanism is the whole reason a poll can lose this race:
`announce()` in `src/live-region.js` **defers its `textContent` write by 30ms** (`setTimeout`, so a
repeated message reaches assistive tech as a change), while `paintPassElapsed()` marks the record
synchronously. Two writes, **two tasks** — and a poll between CDP round-trips can sit in the gap. The
flag reads 1 and the live region still holds `hush()`'s sentinel.

The fix is a conjunction, not a clock: the loop exits when the flag reads 1 **and** the caller's own
pattern matches the live region, evaluated on the **same pair of samples**, and that pair is what the
caller is handed. Cap unchanged at 24 × 250ms. No sleep added. No assertion weakened.

Four `verify-shell.mjs` runs green (three consecutive, plus one after the red demonstration was
reverted), one deliberate red reproducing `TESTING.md`'s recorded WO-2.30 signature, `wo-sweep.mjs`
green, `git diff --stat -- src/` empty.

---

## Against the five Acceptance lines, one by one

### 1. `waitForPassAlert()`'s exit condition includes the announcement its callers test, and no fixed sleep was added anywhere in the change — **met**

`tools/verify-shell.mjs`, the helper now reads:

```js
  const waitForPassAlert = async (studentId, saidRe) => {
    const arrived = (s, heardNow) => !!studentId
      && (s.openPasses.filter((p) => p.studentId === studentId)[0] || {}).alerted === 1
      && saidRe.test(heardNow);
    let state = await read();
    let said = await heard();
    for (let i = 0; i < 24 && !arrived(state, said); i++) {
      await new Promise(r => setTimeout(r, 250));
      state = await read();
      said = await heard();
    }
```

- **The loop count is unchanged** — still `24`, still `250`ms between polls. Nothing was made rarer by
  waiting longer, which is the trap this row is the subject of.
- **No sleep was added.** The only `setTimeout` in the changed code is the poll interval that was
  already there. `git diff -- tools/verify-shell.mjs` adds no `new Promise(r => setTimeout` anywhere.
- **No check was weakened.** All three call sites still assert the announcement, and the two that also
  look for the student's first and last name in `said` still do, unchanged.
- The pattern is a shared const declared beside the helper —
  `const PASS_ALERT_SAID = /has been out on a bathroom pass for 5 minutes\./;` — **passed in by each of
  the three call sites and tested by each of their three checks**, so what the wait waits for and what
  the check asserts are literally the same object rather than two copies that can drift.
- A ~30-line note sits above the helper (the second deliverable): what it waits for, why the flag alone
  is not it, the 30ms `announce()` defer that makes it a race, why a bigger cap is trap 5 wearing a
  poll's clothes, and what a fourth caller has to do (hush before winding, name its own pattern).

**Verified by:** reading the diff (`git diff -- tools/verify-shell.mjs`, 51 insertions / 10 deletions —
proportional, no CRLF flip), `node --check tools/verify-shell.mjs` → `SYNTAX_OK`, and the four green
runs below, which exercise all three call sites.

### 2. `node tools/verify-shell.mjs` green on three consecutive runs — **met**

Three consecutive runs on the fixed tree, before anything was mutated. Exit code `0` on all three,
zero `FAIL` lines in the captured output of each. Summary lines, quoted:

**Run 1**
```
================ SUMMARY ================
824 checks · 824 passed · 0 failed · 0 skipped
22,191 lines · 26.9 lines per check · 253s
```

**Run 2**
```
================ SUMMARY ================
824 checks · 824 passed · 0 failed · 0 skipped
22,191 lines · 26.9 lines per check · 253s
```

**Run 3**
```
================ SUMMARY ================
824 checks · 824 passed · 0 failed · 0 skipped
22,191 lines · 26.9 lines per check · 253s
```

**A fourth green run after the red demonstration was reverted**, so the tree as it now stands is
proven green rather than inferred to be:

```
================ SUMMARY ================
824 checks · 824 passed · 0 failed · 0 skipped
22,191 lines · 26.9 lines per check · 253s
```

All four ran to completion in the foreground and the numbers above are copied from output I read.
None of them was backgrounded or predicted. Total harness wall clock for this dispatch: five runs,
~21 minutes.

*Honest note on what three greens can and cannot prove:* three greens is what the work order asks for
because the unfixed helper produced two in three. It is evidence, not proof — the fix is argued from
the mechanism (the exit condition now includes the deferred write it used to race), and the run count
is the corroboration.

### 3. The check is demonstrated still able to go red for the reason it exists — **met**

The mutation, in `src/classes.js` `archiveClass()` — the same defect `TESTING.md:3486` records, the
open-pass refusal removed:

```js
-  const out = openPassesFor(getDoc(), id).length;
+  const out = 0; /* WO-2.42 RED DEMONSTRATION — TEMPORARY, REVERTED IN THE SAME SITTING */
```

Result: `824 checks · 822 passed · 2 failed · 0 skipped`, 259s, **exit 1**. The two reds are the two
`TESTING.md` § WO-2.30 records for this defect, and the second is the check this row is about:

```
FAIL | and the clock still reaches that student five minutes later, because the class it belongs to
is still the one that is open  ::  the open class is "c_4f2i6a6k5z", the pass belongs to "c_b1" and
records alerted = undefined; the announcement was "nothing has been announced since this sentinel
was written"
```

and one line above it, green, the fixture check that names the class the misdirection falls to:

```
PASS | the archive walk starts from one student out of THIS class, on a fresh pass, with another
active class for the open class to fall back to  ::  … 6 active class(es), this one first = true,
the one archiving would fall to = "c_4f2i6a6k5z"
```

**Wrong room, no alert, sentinel announcement** — the defect's signature, exactly as recorded. That is
what makes it distinguishable from the flake it replaces, which printed *right* room, `alerted = 1`,
sentinel announcement. The fixed helper reddens on the defect and no longer reddens on a correct app.

**The revert is proved by hash, not by eye.** `md5sum src/classes.js` before the mutation:
`8506f8915eb7725b67b2e8593856ef89`. After `git checkout -- src/classes.js`:
`8506f8915eb7725b67b2e8593856ef89`. Confirmed again after the fourth harness run. **The
`df7b2e98c83d7e00543ce5b0da9b7991` recorded in `TESTING.md:3492` is the WO-2.30-era hash and no longer
matches this file** — `src/classes.js` has legitimately changed since — so the proof is against the
hash taken in this sitting, and `TESTING.md`'s new entry says so rather than leaving a reader to
wonder which hash is wrong.

### 4. The sibling-helper question is answered in writing — **met**

**This one was alone.** No other wait in `tools/verify-shell.mjs` exits on a proxy for the thing its
callers check. I walked every polling construct in the file (`waitFor*`, `while (Date.now() < until)`,
bounded `for` loops with an `await` and an exit test, and the in-page `for` loops inside `evalJs`
strings). Each falls into one of three safe shapes:

- **Exits on the very reading its check makes.** `waitForBoot()` (callers assert boot came up); the
  interval-tick poll at the 41-minute clock check (exits on the figure having *changed*, which is the
  claim); `openAboutAndRead()`, which is the model this fix follows — it waits on **both** clauses its
  checks read (`seen.open && seen.text`) and returns the sample it exited on.
- **Is handed the caller's own condition as an argument.** `audioUntil(cond)` and `nextTone(had)` in
  the WO-2.31 audio block; each leg passes the state it is about to assert.
- **Deliberately over-waits.** `newDownloads()` keeps watching for half a second past the expected
  count, because "it wrote a file for the year it said it skipped" is one of the failures those checks
  exist for and a poll that stops at `want` cannot see it.

**The near miss, examined and cleared:** the two boot-failure polls (`refusedBoot`, `soloRefused`) exit
on `#loadingError` being *visible* while their checks assert its **detail text** — structurally the
same shape as the bug fixed here. It is not a race, because `showBootFailure()` in `src/shell.js`
unhides the box and writes the detail inside one synchronous function with no `await` and no
`setTimeout` between them. There is no in-between state for a poll to observe. That is the criterion
that separates this case from `waitForPassAlert()`'s: **the flag and the announcement are written in
different tasks**; the box and its detail are not.

**What the audit did turn up, and I left alone:** the five- and ten-minute threshold checks in this
same hall-pass section use a **fixed `await new Promise(r => setTimeout(r, 250))`** after `wakeUp()`
and then read `heard()` (`saidFive`, `saidTen`). Those are not proxy waits, so they are not this row's
subject — but they are trap 5's own shape aimed at the same 30ms deferred write, with a 220ms margin,
and a loaded machine could in principle close that gap. **Proposed follow-up, not fixed here:** replace
those two sleeps with a poll on the sentence, the way this row's helper now waits. I did not do it
because it is outside the three call sites the work order scopes, and because touching it would have
put an unrelated change inside the three-run evidence.

### 5. `node tools/wo-sweep.mjs` green, `git diff --stat -- src/` empty — **met**

```
================ SUMMARY ================
20 checks · 18 passed · 0 failed · 2 to review
```

Exit `0`. Both REVIEWs are the standing pair (`sensitive field names outside src/backup.js`,
`due-date and late/missing on the same line`) — the same two every recent entry in `TESTING.md`
records. Run twice: once after the harness fix, once after the documentation edits. Green both times.
The call-site clause is green and unchanged at `808 check() call site(s)` matching `tools/README.md` —
this row added no check, it fixed a wait.

`git diff --stat -- src/` produces **no output at all** (`wc -l` = 0), verified after the revert and
again after the fourth harness run.

---

## Files changed

| File | What |
|---|---|
| `tools/verify-shell.mjs` | The fix, the note above the helper, the shared `PASS_ALERT_SAID` const, and its use at the three call sites and in their three assertions. 51 insertions, 10 deletions. |
| `tools/README.md` | Trap 5 gains a paragraph: a poll can be the same mistake one level in. See "Decisions" below — this is a judgment call beyond the three deliverables. |
| `plans/work-orders/phase-2-attendance.md` | Status → ✅ DONE, five Acceptance boxes ticked, and a "How it came out" note carrying the mechanism, the numbers, the red signature, the hash, and the sibling answer. |
| `TESTING.md` | New WO-2.42 entry after WO-2.38, with the three greens, the red run and its quoted failure line, the md5 proof, and the sibling audit. |

`src/classes.js` was mutated for the red demonstration and restored byte-identically in the same
sitting (md5 above). It is **not** in the diff.

**Not touched:** `CHANGELOG.md` — that entry is the teacher's to write. A draft, if wanted:

> **Fixed** — `verify-shell.mjs`'s overdue-pass wait exited on the alert flag while its checks assert
> the flag *and* the announcement, so a correct app reddened about one run in three. It now waits for
> the sentence a teacher would actually hear. Harness only; no app change.

---

## Decisions the work order did not settle

1. **The pattern is a required argument with no default**, and the same const is used in the three
   checks' own assertions. The alternative — a default inside the helper — would let a fourth caller
   silently inherit the bathroom/5-minute sentence and then spend six seconds waiting for words nobody
   was going to say, with the resulting red blaming the app. Required forces the fourth caller to name
   what it asserts. Sharing the const (rather than leaving three regex literals) is what makes "the
   wait waits for what the check tests" true by identity rather than by inspection. **This is not a
   weakening**: each check tests exactly the string it tested before.
2. **The first/last-name clauses were not folded into the wait.** `announce()` writes the sentence in
   one `textContent` assignment, so a half-written announcement is not an observable state — matching
   the tail is matching the whole of it, name included. Folding them in would add nothing and would
   couple the helper to two of its three callers. The reasoning is in the note at the helper so the
   next reader does not have to re-derive it.
3. **No "started hushed" precondition was added to the helper**, though `plans/dispatch-retro.md`
   § "Fixture assumptions" invites that kind of guard. It would be *wrong* here: all three walks
   `hush()` before `windBack()`, but the alert can fire on the first interval tick after the stamp
   moves — before the helper's first read — so asserting the live region reads the sentinel at entry
   would itself flake. The non-vacuity argument that does hold is written at the helper instead: the
   flag is still in the conjunction, and every pass these walks wind is already asserted to arrive
   carrying no `alerted` key.
4. **`tools/README.md` trap 5 gained a paragraph.** This is a fourth artifact beyond the work order's
   three deliverables and I am flagging it rather than burying it. The case for it: the work order
   names trap 5 as its own subject, every harness scar in this project lives in that section, and a
   trap that says "poll instead of sleeping" is exactly what a future implementer will read before
   writing the next proxy poll. The case against: it is scope the work order did not ask for. It
   changes no behaviour, and `wo-sweep.mjs` is green over it. Revert it freely if the judgment is that
   the helper's own note is enough.
5. **A `TESTING.md` entry was written**, though WO-2.39, WO-2.40 and WO-2.41 have none (WO-2.38, also
   harness-only, does). The evidence this row's Acceptance demands — three summary lines, a red run, a
   hash — is exactly what that file holds for every other row, and leaving it only in a dispatch file
   would put it where nobody looks.

---

## What I could not verify

- **Nothing here needs an iPad and no 👤 line was ticked** — this row has none. The harness is a
  desk-only change and its own summary still says a green run closes no 👤 item.
- **The frequency claim is not measured.** "One run in three" is WO-2.39's observation, not something I
  reproduced deliberately: I did not attempt to force the *old* helper red on demand, because the
  window is a 30ms task boundary and provoking it would mean timing manipulation that proves less than
  the mechanism does. What I can state is that the unfixed exit condition can be satisfied while the
  announcement is unwritten, that the fixed one cannot, and that four consecutive runs of the fixed
  helper were green.
- **The sibling audit is a read, not a measurement.** I walked the polling constructs in a 22k-line
  file by grep and by eye. I am confident in the three-shape classification above and in the
  boot-failure analysis, which I checked against `src/shell.js`'s source rather than assuming. A wait
  hidden inside an `evalJs` string that I did not grep for is the residual risk; the four in-page loops
  I did find (`nextTone`, `audioUntil`, the backup-panel poll, the 40-sample absence loop) are all
  accounted for above.
