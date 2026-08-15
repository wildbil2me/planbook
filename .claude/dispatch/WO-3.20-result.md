# WO-3.20 — one date formatter, and a name that means one thing · result

**Implementer** Claude (work-order-implementer, Opus) · **Date** 2026-08-15
**Work order** `plans/work-orders/phase-3-gradebook.md` § WO-3.20 (line 1508)
**Tree** clean at `400d21d` when I started; nothing committed, nothing pushed.

---

## What landed

Five functions called `shortDate` in `src/`, in three formats, are now three functions with three
names, one of which is shared:

| Function | Where | `2026-09-08` → | Unreadable input |
|---|---|---|---|
| `shortDate()` | **`src/date-text.js`** (new, exported) | `Sep 8` | `''` |
| `weekdayShortDate()` | `src/days-off.js` (local) | `Tue, Sep 8` | the raw string |
| `numericDate()` | `src/attendance.js` (exported, was `shortDate`) | `9/8` | the raw string |

`src/assignments.js`, `src/scores.js` and `src/past-due.js` lost their byte-identical copies and
import the shared one. `src/days-off.js` **composes** its month and day from it and keeps only the
weekday lookup. `src/attendance.js`'s is a **rename only** — `9/8` shares no substring with `Sep 8`,
so there is nothing to compose — with its two importers (`src/attendance-report.js`,
`src/grades-report.js`) updated to the new name.

### The three rulings, and where each is written down

1. **The name.** One function in this app may be called `shortDate`, and it is the `Mon D` one. The
   other two are named for what they produce. Written at `src/date-text.js` § *"The names, and the
   ruling"*, with the reason repeated at each renamed definition.
2. **Empty / malformed / real.** `shortDate()` answers `''` for anything it cannot read; the caller
   decides what an unreadable date *looks like* on its own screen (`|| '—'`, `|| work.due`, or no
   element at all). At `src/date-text.js` § *"What an unreadable date produces"*, as a three-line
   table with the reason under it.
3. **The two renamed formatters still echo their input.** Deliberate, not inherited: changing it
   would change what a screen prints for a malformed date, which this work order forbids. Ruled at
   the shared definition and cross-referenced from both, with the follow-up named (below).

### Comments: which I rewrote, which I kept

Following `.claude/dispatch/WO-3.19-result.md`'s accounting.

- **Rewritten, because the copy they defended no longer exists** — the three "a local copy rather
  than an import, because…" blocks in `src/assignments.js`, `src/scores.js`, `src/past-due.js`. Each
  is now an import comment that says what replaced it and *why the old argument was right about the
  format and wrong about the copy*. `src/scores.js`'s kept its load-bearing clause in capitals: the
  import spends none of its decision 1, because `src/date-text.js` reads no clock. `src/past-due.js`'s
  kept the same, against its decision 5.
- **Kept and extended** — `src/days-off.js`'s explanation of why its format is not `spokenDate()`
  (still true, still the reason the weekday survives) and `src/attendance.js`'s explanation of why
  `9/8` has no year (still true, still that file's own call). Both gained a paragraph naming the
  rename and the collision it ends.
- **Kept, one word changed** — `src/attendance-report.js`'s header paragraph and
  `src/attendance.js:528`, which named `shortDate()` in prose. The argument in
  `src/attendance-report.js` ("a printout that has left the building and disagrees with the screen")
  is the argument this work order applied one file over, so it now says so in a parenthetical rather
  than being rewritten.
- **Extended, and this is the one to read** — `src/grades-report.js`'s import comment now states in
  as many words that this sheet prints an **assignment** due date as `9/18` while the score grid it
  is taken from prints `Sep 18`, that WO-3.20 did not change it, and where the follow-up is written
  up. Prose at the point of departure rather than a silent inconsistency.

### Files changed

- `src/date-text.js` **(new)**
- `src/assignments.js`, `src/scores.js`, `src/past-due.js` — copy deleted, import added
- `src/days-off.js` — composed and renamed to `weekdayShortDate()`
- `src/attendance.js` — `shortDate()` → `numericDate()`, 3 call sites
- `src/attendance-report.js`, `src/grades-report.js` — import + 1 call site each
- `sw.js` — `./src/date-text.js` added to `SHELL`, `CACHE` → `planbook-shell-v66`
- `tools/verify-shell.mjs` — two new static checks (+54 lines)
- `tools/README.md` — recorded call-site count 781 → 783, with the WO-3.20 paragraph the sweep's
  failure text asks for (executed count from the run, not from arithmetic)
- `TESTING.md` — a WO-3.20 section; WO-3.6's paragraph gains a line saying its follow-up landed
- `plans/work-orders/phase-3-gradebook.md` — the five acceptance boxes, with evidence

**Not committed. Not pushed.** No `CHANGELOG.md` entry written — draft at the foot of this file.

---

## Against the Acceptance list, one by one

### 1. `grep -rn "function shortDate" src/` returns one definition of the `Mon D` formatter — ✅ ticked

Ran it. One hit:

```
src/date-text.js:84:export function shortDate(iso) {
```

No two surviving functions of that name can differ, because one name survives. The other two are
`weekdayShortDate()` (`src/days-off.js:169`) and `numericDate()` (`src/attendance.js:683`).

`verify-shell.mjs` now asserts this permanently, and asserts the shape a grep would miss — a module
binding the name to a different formatter via `import { numericDate as shortDate }`. Mutation-tested
on a copy of `src/`, all three reverted:

| Mutation | Result |
|---|---|
| a local `function shortDate` back in `src/scores.js` | **FAIL** — *"defined in src/date-text.js, src/scores.js"* |
| `import { numericDate as shortDate } from './attendance.js'` in `src/scores.js` | **FAIL** — *"bound from elsewhere by src/scores.js ← ./attendance.js"* |
| an import added to `src/date-text.js` | **FAIL** on the leaf check only; the name check stays green |

### 2. Every date on every screen is character-for-character unchanged — ✅ ticked, with the split named

Two things I ran, neither of them reasoning.

**(a) The formatters, exhaustively.** A scratchpad script (not committed — evidence, not a harness)
extracted the **five old implementations out of `git show HEAD:src/…`** and the **three new ones out
of the working tree**, by brace-matching the function source, so nothing was hand-transcribed. Both
sets ran over **1,118 inputs**: every day of 2025, 2026 and 2027, plus `''`, `null`, `undefined`,
`0`, `20260908`, `'  '`, `'garbage'`, `'next Tuesday'`, `'a-b-c'`, `'2026-09'`, `'2026--08'`,
`'2026-09-08x'`, `'2026-9-8'`, `'2026-13-45'`, `'2026-02-30'`, `'2026-00-00'`, a full timestamp,
`{}`, `[]`, `NaN`.

```
IDENTICAL | assignments | 1118 inputs
IDENTICAL | scores      | 1118 inputs
IDENTICAL | past-due    | 1118 inputs
IDENTICAL | days-off    | 1118 inputs
IDENTICAL | attendance  | 1118 inputs
sample: "2026-09-08" → "Sep 8" / "Tue, Sep 8" / "9/8"  ·  "2026-11-26" → "Nov 26" / "Thu, Nov 26" / "11/26"  ·  "" → "" / "" / ""
no differences over 1118 inputs × 5 formatters
```

**(b) The screens.** A full `verify-shell.mjs` run **before** any edit and **after**, diffed. Every
date-shaped string in the two outputs is identical:

| Rendered string | Surface | Formatter |
|---|---|---|
| `due 9/18` ×2, `due 9/25`, `due 10/1`…`due 10/6` | printed grade sheet | `numericDate()` |
| `due Aug 14` ×2 | past-due prompt banner | `shortDate()` |
| `Winter break · Mon, Aug 3 – Fri, Aug 7` | days-off list | `weekdayShortDate()` |
| `Sat, Aug 15` | days-off / calendar panel | `weekdayShortDate()` |

The only lines that differ between the two runs at all are wall-clock stamps (the runs were ten
minutes apart), generated ids, temp-profile paths and the server port.

**What that does and does not cover, stated plainly.** Three of the six surfaces print their dates
into the harness output and are therefore *observed* identical: the past-due prompt, the days-off
list, and the printed grade sheet. The **assignment list**, the **score grid column heads**, the
**attendance grid column heads and pager range**, the **past-due review rows** and the **printed
attendance record** print no date text into any check's detail string, so for those the evidence is
(a) above — the formatter is byte-identical on every input — plus a read of `git diff`, in which
every changed line in those files is a comment, an import, a deleted definition or a call renamed
1:1. I did not find a way to observe those five directly without writing a second browser harness,
which the brief forbids. That is the whole of the gap; nothing about it is assumed on a real device.

### 3. Empty, malformed and real each produce one documented answer, at the definition — ✅ ticked

`src/date-text.js` § *"What an unreadable date produces, decided once"*:

```
a real date   shortDate('2026-09-08')   === 'Sep 8'
empty         shortDate('')             === ''
malformed     shortDate('next Tuesday') === ''
```

with the reason (`''` cannot print `undefined` into a cell a teacher reads as a date; the caller
owns the fallback) and the three call-site fallbacks named. The two renamed formatters' echo
behaviour is ruled at the same place rather than left implied, and cross-referenced from both.

**The decision inside this line, and which way I went.** Deliverable 3 says one of the two raw-input
returns "is wrong on some screen right now". I did **not** change either, because doing so changes
what a screen prints for a malformed date and the Out of scope line forbids any change to what any
screen displays — behaviour-neutrality is the acceptance criterion, and I read it as beating the
hint. So the ruling is documented and one of the two behaviours is preserved-with-a-reason rather
than corrected. If the intent was the correction, this line is the one to send back; it is a
four-line change plus a follow-up's worth of argument about which inputs can reach those two
functions.

### 4. `verify-shell.mjs` green, no check rewritten — ✅ ticked

- **Before, at `400d21d`, untouched tree:** `778 checks · 778 passed · 0 failed · 0 skipped`,
  20,570 lines, 248s, exit 0.
- **After, on the delivered tree:** `780 checks · 780 passed · 0 failed · 0 skipped`, 20,624 lines,
  26.4 lines per check, **252s**, exit 0. (Run twice on the finished code — 247s and 252s — the
  second after the doc edits, so the reported run is the delivered tree and not a near-miss of it.)
- **`wo-sweep.mjs`:** `20 checks · 18 passed · 0 failed · 2 to review`, exit 0. Both REVIEWs are the
  standing ones and name exactly the lines they named before this landed.

**No existing check was edited.** The two added are new, static, and read source rather than a page:
the diff of the two run outputs shows the 778 old result lines unchanged and two lines added.

One sweep interaction worth recording: my first draft of `src/date-text.js` used the phrase *"a
missing due date"* in prose, which put `src/date-text.js:42` on the sweep's **due-date-and-`late`/
`missing`-on-one-line** REVIEW list. I reworded it to *"a due date nobody typed"* — the word was the
English one, not the flag; the file reads no clock and sets no flag — so the REVIEW list is back to
the eight lines it held before. That is a wording change to avoid a decoy, not a check routed
around.

### 5. No import cycle: the shared module imports nothing from `src/` — ✅ ticked

`src/date-text.js` contains no `import` statement at all — not just none from `src/`. Asserted by the
new harness check (`5,861 bytes read, no import statement in it`) and mutation-tested by adding one.
The file's header states the rule and why it is a load-time fact rather than tidiness.

### 👤 lines

**None in this work order**, and I ticked none. Nothing here needs an iPad: no control, no
stylesheet, no touch target, no safe-area inset. Worth saying explicitly since the work order's own
subject is that nothing on screen changes.

---

## Decisions the work order did not settle, and which way I went

1. **The new file is `src/date-text.js`, not `dates.js` or `utils.js`.** `src/README.md` § The
   convention forbids layer names; `date-text` names the artifact — the text of a date — and sits in
   the family of `letter-scale.js`, `print-gate.js`, `live-region.js`. `dates.js` was the runner-up
   and I set it aside as ambiguous next to `calendar.js`, which owns calendar *events*. The header
   states the choice and forbids the file growing into a junk drawer.
2. **The shared export keeps the name `shortDate`.** Deliverable 2 says *"they* may not keep the same
   name" of the other two, so the `Mon D` formatter is the one that keeps it — and Acceptance line 1
   asks the grep to return **one** definition, which renaming all three would have turned into zero.
3. **`weekdayShortDate()` composes; `numericDate()` does not.** Composition removes the duplicated
   month table from `src/days-off.js` and is provably output-identical (the guard is `shortDate()`'s
   own: it returns non-empty only for three numeric fields that make a real day). `9/8` has no
   substring in common with `Sep 8`, so composing there would have been a flag on a function, which
   is what the original comments refused for good reason.
4. **I added two checks to `verify-shell.mjs`** rather than leaving the invariant unguarded. The
   brief says *"add checks for what you build"*, and the work order's own *Why it exists* says
   nothing in the harness or the sweep would fail on the defect it describes. They are static
   (source, not a page) because the failure is precisely one a rendered page cannot show: two correct
   dates. Cost: `tools/README.md`'s recorded count and its executed-check paragraph, both updated
   from the run as § 11's failure text demands. If a verifier reads this as scope creep, the two
   checks and the README paragraph are one revert.

---

## Proposed follow-up work orders

1. **The printed grade sheet prints assignment due dates in the attendance grid's format.**
   `src/grades-report.js:390` renders `due 9/18` where the score grid it is taken from renders
   `Sep 18` — the exact good-faith import WO-3.20 exists to prevent, made before it. **Deliberately
   untouched**: it changes what a teacher's printed paper says, which is outside this work order and
   is a decision about paper rather than about code. `verify-shell.mjs` pins the current output
   (`cols[0].due === 'due 9/18'`, `tools/verify-shell.mjs:18393`), so whoever takes it will be editing a check
   to match new output *legitimately* — worth saying in that work order's Traps, because the rule
   here was the opposite. Size XS; the decision is one sentence, the edit is one word.
2. **Should `numericDate()` and `weekdayShortDate()` stop echoing unreadable input?** The other half
   of deliverable 3, deferred because answering it changes a screen. What it needs first is an answer
   to *which inputs can reach them* — both are fed dates the app generated (`todayISO()`, weekday
   walks, a date input), so the honest question is what a restored or hand-edited document can put
   there. Size XS, and it may correctly end in "no change, now with a reason".
3. **`src/README.md` opens with "Empty today. WO-1.2 puts the first file here."** — stale since
   WO-1.2, and I left it alone as the brief instructs. It is the first thing a new dispatch reads
   about `src/`, and it is false in its first four words. Size XS.

---

## Draft CHANGELOG entry — for the teacher to accept, edit or bin

> **Internal.** One date formatter instead of five. Three screens carried byte-identical copies of
> the same eight lines, and two more functions with the same name produced different strings — so a
> new screen reaching for a date formatter could pick up `9/4` and print it beside a `Sep 4`, with
> nothing to catch it. The shared one lives in `src/date-text.js` and the two other formats are named
> for what they produce. **No date on any screen changed**, which is the point: proved against 1,118
> inputs and a before/after run of the whole harness.

---

## What a verifier should re-run

```
node tools/verify-shell.mjs      # 780 · 780 · 0 · 0, ~250s
node tools/wo-sweep.mjs          # 20 · 18 · 0 failed · 2 to review
grep -rn "function shortDate" src/   # exactly one hit: src/date-text.js:84
```

The formatter-equivalence script is in this session's scratchpad and is not committed; it is
reproducible from this file's description in about twenty lines, or from `git stash` plus the same
corpus. I did not add it to `tools/` because the brief forbids a second harness and because its
subject — the tree *before* this work order — stops existing the moment this lands.
