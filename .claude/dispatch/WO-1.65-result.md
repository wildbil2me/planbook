# WO-1.65: result (implementer)

**Outcome:** the claim is built. It is § 31 of `tools/wo-sweep.mjs`, placed above § 22 so the census still runs last. It was green on the first run over the tree, and it was proved against 16 refused plants and 4 negative controls in `src/glance.js`, each reverted before the next step. `src/` has not moved. All three Acceptance boxes are ticked and each tick has its evidence below. There are no 👤 or 📆 lines. Nothing is committed.

## Files changed

- `tools/wo-sweep.mjs`: new § 31, "the glance reader holds no arithmetic of its own". It adds one `check()`, so the sweep has 50 results now instead of 49.
- `tools/README.md`: line 10 now reads `The verifier's 50-check standing sweep` instead of 49. A dated WO-1.65 clause, in the house style, is added to the end of the `wo-sweep.mjs` row. It covers what § 31 fences, its three allowances and two anchors, and its two blind spots.
- `plans/work-orders/phase-1-shell-store-roster.md`: WO-1.65's three Acceptance boxes are ticked. The status stays `🤖 CLAIMED`, which is the orchestrator's to change. This file already had a diff from `--start`.
- `.claude/dispatch/WO-1.65-result.md`: this file.

`git diff --stat src/` is **empty**. Line endings are unchanged: in all three edited files the CRLF count equals the line count.

## Acceptance, line by line

### 1. `node tools/wo-sweep.mjs` is green with the new claim, and its count matches `tools/README.md`: **met**

The final run, after every edit including the ticks:
```
50 checks · 47 passed · 0 failed · 3 to review
```
(exit 0). The 3 to review are the same three REVIEW items the baseline run printed before I started (`49 checks · 46 passed · 0 failed · 3 to review`).

The § 31 line:
```
PASS | src/glance.js holds no arithmetic of its own — no operator, date comparison, cell read or numeric engine call outside its named allowances  :: 507 line(s) of code in src/glance.js read with comments and string text blanked and `${…}` bodies kept; no refused operator, date comparison, cell or settings read, numeric conversion, count, or any of 33 engine names in use — the 3 named allowances each used once (src/glance.js:341, src/glance.js:268, src/glance.js:506), and the anchors found (26 × `.length`, 33 × `+` building a string). …
PASS | the recorded sweep-check count matches this run  :: 50 results emitted this run, matching tools/README.md:10 …
```
I also ran `node tools/wo-gate.mjs --self-check` (`46 of 46 plants were caught`) and `--audit` (PASS).

### 2. Each refused shape is proved by a mutation that turns the claim red at the line, and each is reverted: **met**

`plant.mjs` in my scratchpad ran these. For each plant it did the following:
1. Applied the plant to `src/glance.js` by exact-string replace, asserting the anchor text appeared exactly once.
2. Ran `node tools/wo-sweep.mjs`.
3. Captured the § 31 line.
4. Ran `git checkout -- src/glance.js`.
5. Asserted the file was byte-identical to the original.

Only then did it move to the next plant. No plant carried the word MUTATION.

Every run below exits 1 with `50 checks · 45 passed · 2 failed`. The second failure in each is § 9 ("src/glance.js changed since planbook-shell-v173…"), which fires whenever a SHELL file is modified. I confirmed that by planting a harmless `+ 0` and reading the FAIL lines.

| Plant | § 31 red line (as printed) |
|---|---|
| `Math.max(0, Object.keys(seen).length)` | `src/glance.js:472 "return Math.max(0, Object.keys(seen).length);" (`Math.`)` |
| `row.open / 1` | `src/glance.js:745 "plural(row.open / 1, '', ''), false);" (`/` — division, or a regular-expression literal …)` |
| `climbing * 1` | `src/glance.js:1037 "plural(flagged, '', '') + '' + climbing * 1" (`*`)` |
| `n % 10 === 1` | `src/glance.js:456 "…(n % 10 === 1 ? one : many); }" (`%`)` |
| `ATTENTION_ROWS - 0` | `src/glance.js:975 "const rest = rows.slice(ATTENTION_ROWS - 0);" (a binary `-`)` |
| **date comparison**: `end > event.date` | `src/glance.js:672 "return end && end > event.date" (a relational `>`, `>=` or `>>`)` |
| `rest.length > 0` | `src/glance.js:976 "if (rest.length > 0) {" (a relational `>` …)` |
| `todayISO(new Date())` | `src/glance.js:1094 "const today = todayISO(new Date());" (`Date` — a date made or read here)` |
| `.sort((a, b) => a.date.localeCompare(b.date))` | `src/glance.js:1095 … (`localeCompare` …), src/glance.js:1095 … (`.sort(` …)` |
| **`leadDaysOf()` read** (import + `const lead = leadDaysOf(doc);`) | `src/glance.js:512 "const lead = leadDaysOf(doc);" (`leadDaysOf` — an engine name …)` |
| `isHeld(row)` (import + call) | `src/glance.js:334 "if (row.state !== '' \|\| isHeld(row)) return;" (`isHeld` …)` |
| cell field `row.flag` | `src/glance.js:334 "if (row.state !== '' \|\| row.flag) return;" (a member read of a score cell or a settings block …)` |
| a second `open += 1` line | `src/glance.js:342 "byAssignment[row.id].open += 1;" (… — and a SECOND site matching an allowance that names one)` |
| `total += row.points` | `src/glance.js:742 "let total = 0; total += row.points;" (`+=` with no string literal on its right …)` |
| `` `The quiet middle · ${quietCount * 1}` `` (`*` inside an interpolation) | `src/glance.js:562 "quietCount ? `${quietCount * 1}` : '');" (`*`)` |
| a third `shiftDays(todayISO(), 1)` | `src/glance.js:443 "const w = leadWindowOf(doc, shiftDays(todayISO(), 1));" (`shiftDays` …)` |

Negative controls. These show what the fence does *not* catch, or catches only indirectly:

| Plant | § 31 result |
|---|---|
| `open = open + 1` (the `+` blind spot) | FAIL, but **only** because the allowance went stale: "queueRows()'s `open += 1` … — an allowance in § 31 that no line of src/glance.js uses any more". The sum itself is not seen. |
| `(climbing + 0)` | **PASS**. This is the stated blind spot, demonstrated. |
| `` `gl-quiet-mark </div> a-b` `` (markup in template text) | **PASS**. Template text is blanked. |
| `[1].indexOf(cls) === -1` | **PASS**. A negative numeric literal is allowed, as the header says. |

After the round:
- `git diff --stat src/` was empty.
- `grep -rn MUTATION src/ tools/` returned 19 lines. **That output is not literally empty.** All 19 are pre-existing prose: `tools/README.md` recovery notes, comments in `tools/verify/*.mjs` and `tools/wo-gate.mjs`, and a "CLASS MUTATION" sentence in `src/shell.js`. `git grep -n MUTATION HEAD -- src tools` also returns 19, so this sitting added none. Neither `src/glance.js` nor any line I added contains the word.

### 3. The claim's header states what it cannot see: **met**

The § 31 banner has a paragraph headed "A FENCE, NOT A READING — WHAT THIS CANNOT SEE". It names:
- **a sum written with `+`**, and why `+` is unfenced. It gives examples: `total = total + row.points` and a `reduce` with `+` pass, while `total += row.points` is caught.
- **arithmetic moved into a helper whose name is not on the list**, for example `sumOf(rows)`.
- numbers composed from unfenced things: `.length` of an array the file built, `slice()` arguments, an index read.
- a regex literal containing a quote, which would derail the scanner.

It then points to `glance-quiet.mjs` and to a person reading the file as the other half. The `tools/README.md` clause repeats both named blind spots.

## Decisions the work order left open

1. **A separate § 31 rather than a sub-claim inside an existing section.** It has one `check()`, the way § 30 does, and sits above § 22 for § 30's reason.
2. **A character scanner rather than claim 5's regex strip.** The brief warned that `glance.js`'s markup would otherwise go red. The scanner keeps `${…}` bodies as code, handles nested templates, and keeps every newline so that cited lines are true. I tested it on a synthetic template before it touched the file, and the `${quietCount * 1}` plant proves it on the real one. Regex literals are not modelled. That limit is stated in the header, and any `/` that survives is refused. The result is loud, not quiet.
3. **I went beyond the WO's minimum list. Each addition is argued in the header:**
   - bitwise `|` `&` `^` `~`
   - numeric conversion (`Number`, `parseInt`/`parseFloat`, `toFixed`/`toPrecision`/`toExponential`)
   - `++`, and `+=` with a non-string right-hand side
   - `localeCompare` and `.sort(` as date-comparison carriers
   - member reads of `.scores` `.v` `.flag` `.was` `.signals` `.leadDays`
   - 33 engine names: thresholds, lead time, grade engine, letter scale, attendance-ledger counts, `signalRules`, `shiftDays`, `daysBetween`

   Engine names count as a *use* only: import declarations are blanked first. `evaluate`, `applyCooldown`, `quietMiddle` and `.reduce(` are deliberately not refused, and the header says why.
4. **Fencing `+=` and `++` is not fencing `+`.** The work order named `open += 1` as an allowed shape, which only makes sense if `+=` is matched. `+=` followed by a string literal still passes, so string growth is not falsely reddened.
5. **The allowance list has three entries, not one.** Beyond `open += 1`, I fenced `shiftDays`/`daysBetween` as date arithmetic and let their two existing, already-argued uses through by name: `weekWindow()` and `leadShown()`. That keeps a third date computation from riding in beside them, and the third-`shiftDays` plant proves it. Each allowance allows exactly **one** site and FAILs as stale if unused. That is stricter than § 30, which allows any number of sites per allowance.
6. **`.length` and string `+` are anchors, not allowances.** They were never refused, so they cannot "go stale" in § 30's sense. Instead each must be found at least once, which is the guard against a scanner that silently ate the code. Claim 5's subscript count works the same way. This keeps them in a named list that FAILs, as the brief asks.

## Verification note

This work order moves nothing in `src/` (`git diff --stat src/` is empty), so I did **not** run `verify-shell.mjs`, as the brief's override allows. `wo-sweep.mjs` is the gate.

## Declined / out of scope

- I did not widen the fence to other files.
- I did not touch `TESTING.md`, which is optional per the brief. The mutation table lives here, and the § 31 header points to this file.
- I left `CHANGELOG.md` alone.

## Draft CHANGELOG entry (for the teacher to decide)

> The sweep now reads `src/glance.js` for the shape of its no-arithmetic rule (§ 31, WO-1.65): no operator, date comparison, cell read or numeric engine call outside three named sites, proved against sixteen plants. It is a fence, not a reading — a sum written with `+`, or arithmetic hidden in a helper it has never heard of, still passes, and `glance-quiet.mjs` remains the behavioural half.

---

## Correction round 1 (2026-10-09)

**The FAIL was correct.** The verifier found that Acceptance line 3 failed because the § 31 header claimed coverage the code did not have. Two things combined to cause it. Findings were de-duplicated on `line|message`, and an allowance was matched against the whole line's text. As a result, a second finding with the same kind and message on an allowed line was dropped as a duplicate, and the first finding used up the allowance. My original table never tested this case: its "second `open += 1`" plant was on a separate line.

### What changed (tools/wo-sweep.mjs § 31 only; no change to src/)

- Every finding now carries its code offset (`index`).
- De-duplication is keyed on `index|why`, so it collapses one finding per offset and message and never one per line.
- An allowance now covers a finding only when the allowance's own regex match on that line **spans the finding's offset**. The new helper is `covers(a, f)`, which re-runs the allowance regex globally over the line and checks the span. If text that matches an allowance appears somewhere else on the line, it no longer excuses a different finding. This also means a plant written *before* the allowed site on the same line is cited correctly. The old line-wide test would have let the plant use up the allowance and then cited the legitimate site instead (plant V2b below).
- Findings are processed in offset order rather than line order.
- Header changes:
  - The ALLOWED bullet now says a second site is red "on its own line or on the allowed line itself, since an allowance covers only the finding its own match spans".
  - A comment above `ALLOWED` records this round and the defect.
  - The "PROVED" paragraph now points to this section.
- The header's two blind spots are unchanged. Its claim that "`total += row.points` IS caught" is now true on an allowed line as well, as plant V1 shows.

I did not soften the header. The code now does what the header says.

### Mutation table

Every plant carried the marker `/* MUTATION */` and was applied by a script (`plant.mjs` in my temp dir), one at a time. Before the first plant the script byte-copied `src/glance.js`. After each sweep run it wrote the original bytes back and checked with `Buffer.equals` that the restore was byte-identical, and it would have aborted if not. Every row below printed `FAIL` for § 31 and cited the planted line. Each § 31 result line was read from that run's own output.

| # | Plant | § 31 red at |
|---|---|---|
| V1 | line 341: `byAssignment[row.id].open += 1; total += row.points;` (the verifier's plant) | `src/glance.js:341` (`+=` with no string literal on its right) |
| V2 | line 268: `…shiftDays(today, WEEK_DAYS_AHEAD), back: shiftDays(today, 7) };` (the verifier's plant) | `src/glance.js:268` (`shiftDays` — an engine name…) |
| V2b | line 268, plant placed **before** the allowed site: `back: shiftDays(today, 7), to: shiftDays(today, WEEK_DAYS_AHEAD)` | `src/glance.js:268`, one citation (`shiftDays`) |
| V3 | line 506: `…daysBetween(w.from, w.to), d2: daysBetween(w.to, today) };` (the verifier's plant) | `src/glance.js:506` (`daysBetween`) |
| C | control, line 341: `… open += 1; Math.max(1);` | `src/glance.js:341` (`Math.`) |
| R1 | `Math.max(0, Object.keys(seen).length)` | `:472` (`Math.`) |
| R2 | `row.open / 1` | `:745` (`/`) |
| R3 | `climbing * 1` | `:1037` (`*`) |
| R4 | `n % 10 === 1` | `:456` (`%`) |
| R5 | `ATTENTION_ROWS - 0` | `:975` (a binary `-`) |
| R6 | date comparison `end > event.date` | `:672` (a relational `>`) |
| R7 | `rest.length > 0` | `:976` (a relational `>`) |
| R8 | `todayISO(new Date())` | `:1094` (`Date`) |
| R9 | `.sort((a, b) => a.date.localeCompare(b.date))` | `:1095` twice (`.sort(` and `localeCompare`) |
| R10 | `leadDaysOf` import plus `const lead = leadDaysOf(doc);` | `:512` (`leadDaysOf`) |
| R11 | `isHeld` import plus `… \|\| isHeld(row)` | `:334` (`isHeld`) |
| R12 | cell read `… \|\| row.flag` | `:334` (a member read of a score cell…) |
| R13 | a second `open += 1` on its own line | `:342` (`+=`) |
| R14 | `let total = 0; total += row.points;` on its own line | `:742` (`+=`) |
| R15 | `` `${quietCount * 1}` `` inside an interpolation | `:562` (`*`) |
| R16 | a third `shiftDays(todayISO(), 1)` on its own line | `:443` (`shiftDays`) |

R1–R16 are the regression plants from the original round, at the same lines and with the same shapes. All 21 runs were red at the line. I did not re-run the original round's four blind-spot demonstrations (`open = open + 1`, `(climbing + 0)`, markup in template text, `[1].indexOf(cls) === -1`). The fix only narrows when an allowance applies, so it cannot turn any of those PASSes red except by refusing them, and refusing them would have shown up as a red clean tree. The clean tree is green (below).

After the round:
- `git diff --stat src/` printed nothing.
- `grep -n MUTATION src/glance.js` found nothing (exit 1).

### Sweep

I re-ran `node tools/wo-sweep.mjs` on the final tree (exit 0), and these lines were read from its output:
- The summary: `50 checks · 47 passed · 0 failed · 3 to review`.
- § 31: PASS, with the three allowances each used once at `src/glance.js:341, :268, :506`.
- § 22: `50 results emitted this run, matching tools/README.md:10`.

The check count is unchanged, so `tools/README.md` needed no edit. The three items to review are the same mockup-banner notes as before and are not this work order's.

### Boxes

I left Acceptance line 3 as it was. The line attests that the header states the two blind spots. That was already true, and the fix makes the header's other claims true without changing what the line attests. The verifier re-marks it. No other box moved.

### Files changed this round

- `c:\dev\planbook\tools\wo-sweep.mjs` (§ 31 only)
- `c:\dev\planbook\.claude\dispatch\WO-1.65-result.md` (this section)
