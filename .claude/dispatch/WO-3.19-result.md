# WO-3.19 — result

**Status written:** 🔨 IN PROGRESS (via `node tools/wo-gate.mjs --tick WO-3.19`, after hand-ticking
Acceptance lines 1–5). The tool refuses ✅ DONE while line 6 — the 👤 iPad line — is open, and writes
🔨 IN PROGRESS instead: *"HELD | 1 of 6 Acceptance lines are still [ ] — WO-3.19 is not done."* That is
the convention its own source names (WO-2.1, WO-2.11 and WO-2.12 all landed there with 👤 lines owed).
It also undid the 🤖 CLAIMED, so nothing now says a dispatch is in flight. `plans/work-orders/README.md`
also allows *"✅ DONE with an `**Owes**` field"* for work that landed with lines it cannot close, but
`**Owes**` names re-homed work orders and this line is owed to a person with an iPad, not to WO-x.y —
so I took the status the tool writes rather than hand-editing one it would refuse.

**No commit, no push.** `CHANGELOG.md` untouched; a draft entry is at the foot of this file.

---

## What was built

**One CSS rule and one branch.** `.scores-col-due.overdue { color: #8a6d1a; }` in `src/scores.css`,
lifted verbatim from `design/mockups/proposed.css:301` — colour only, no weight or size change, so the
head cannot grow when a date goes by and move a grid somebody has a thumb in. `columnHead()` in
`src/scores.js` adds the class and the assignment list's own `title`, word for word.

**The predicate.** `src/past-due.js` gains one export:

```js
export function pastDueAsksAbout(assignmentId) {
  return previewed.some((work) => work.id === assignmentId);
}
```

That is a read of the set the banner was drawn from, not a second walk and not a second comparison.
`src/scores.js` still imports no `todayISO()` and contains no `<` against a date — its decision 1 is
intact, which is the whole reason the tint is built this way rather than as three lines of local
arithmetic. `paintPastDue()` already ran earlier in the same `renderScores()`, above the head row; that
ordering is now load-bearing and is commented as such at both ends.

**One test hook.** `columnHead()` sets `data-score-col="<assignment.id>"` on the `<th>`. Nothing in the
app reads it. It exists so the check can *name* the tinted columns instead of mapping head position
onto cell position — the same job the ids on `src/past-due.js`'s review chips already do.

---

## Acceptance, one by one

**1. A column whose due date has gone by is tinted; today, tomorrow and no-date are not.**
**Met.** `verify-shell.mjs` PASS, quoted from the run: *"the overdue tint is on exactly the column
heads the prompt is asking about … :: tinted heads = `["wo36-past","wo36-past2"]` :: the prompt is
asking about `["wo36-past","wo36-past2"]` :: heads printing a due date =
`["wo36-past","wo36-past2","wo36-today","wo36-soon"]`"*. The `dueHeads` half is the vacuous-pass guard:
the column due **today** is present and *grey*, rather than absent from a list of nothing. The undated
column prints no `.scores-col-due` at all, so there is no element for the class to sit on.

The off-by-one itself is **not re-tested here, deliberately**. The tint reads the prompt's set, so
`assignment.due < today` is still asked in exactly one place and WO-3.6's recorded `<=` mutation (9
red) remains its only test. Adding a second off-by-one fixture would have been asserting the same
comparison twice from two directions and calling it two checks.

**2. The tint writes nothing.**
**Met.** PASS: *"the tint writes NOTHING: … amber heads on screen = `["wo36-past","wo36-past2"]`;
scores byte-identical to the plant = true; grades `["68.00%","75.00%","—","—","—"]` :: engine
`["68.00%","75.00%","—","—","—"]`"*. The comparison is over **all** of `doc.scores`, not this fixture's
own columns — a build that wrote somewhere else would pass a narrower reading by being out of frame —
and it spans every render the tint has been up for since the plant: a coarse pass, two page reloads,
four navigations and two `Esc` presses with the caret in a cell. It is taken beside a reading that two
heads were actually amber, so a build with no tint could not pass it.

**3. The tinted columns are exactly the assignments the banner names, against the prompt's own set.**
**Met**, twice over. The check derives its expected set from the assignment half of the review's own
`data-past-due-cell` ids read off the screen — no list of ids is written in the check — and both sides
print in the PASS line quoted under item 1. It is also true by construction: `columnHead()` asks
`pastDueAsksAbout()`, which reads the same `previewed` the sentence and the review are drawn from, so
there are not two computations that could agree by luck.

**4. A column stops being tinted when its blanks are filled or marked, on the same render.**
**Met.** PASS: *"and the two column heads stop being amber on that same render … amber heads
`["wo36-past","wo36-past2"]` -> `[]`; heads printing a due date
`["wo36-past","wo36-past2","wo36-today","wo36-soon"]` -> `["wo36-past","wo36-past2","wo36-today","wo36-soon"]`"*
— the tint comes off, the head does not empty. Taken from the same reading as WO-3.6's existing
*"after accepting … missing glyphs in the grid = 6"*, which is what makes "the same render" a fact
rather than a hope.

**Mutation-tested.** I replaced `pastDueAsksAbout()` with the obvious wrong build — its own
`isDate(a.due) && a.due < todayISO()` off the document, i.e. the second reader of the clock the third
deliverable forbids — and re-ran the full harness: **`714 checks · 713 passed · 1 failed`**, and the one
red is this line. Items 1, 2 and 3 all stayed green, because a date-only tint agrees with the prompt
right up until the blanks are marked. `src/past-due.js` was then restored and `cmp` confirms it is
byte-identical to the pre-mutation file.

**5. `grep -rn "WO-3.6" src/ design/` returns no comment claiming WO-3.6 owns unbuilt work.**
**Met.** Still 19 hits across 8 files — the brief's correction to the work order's "nine" was right, and
I did not treat the grep as something to drive to zero. What each one does now:

*Rewritten, because they had become false:*

| Site | Was | Is |
|---|---|---|
| `src/scores.css:37-42` | *"THREE THINGS THE DRAWING HAS THAT ARE DELIBERATELY NOT HERE … the overdue tint on a column head (WO-3.6 owns everything about a due date)"* | **TWO** things, with a paragraph recording that the third was the tint, left behind by WO-3.5 and again by WO-3.6, and carried across at WO-3.19 |
| `src/scores.css:299-303` | a paragraph explaining why the rule is **absent** | the rule, plus why `#8a6d1a` is lifted rather than chosen, that it is colour-only, that the set is decided in `src/past-due.js` — and a closing paragraph quoting what stood there and saying why it was wrong to leave standing |
| `src/scores.css:446-451` | the grade sheet's head is *"a plain date compared to nothing (WO-3.6 owns everything about a past due date)"* | still a plain date, now as a stated **departure** from the grid one file up: this sheet is printed, its print block takes every colour to grey, and an amber date would either do nothing or put a grading nudge on a page that gets handed to somebody |
| `src/scores.js:44-57` (decision 1) | *"the drawing's overdue tint on that head is still deliberately absent" / "still not built"* | *"NOTHING IN THIS FILE READS A CLOCK … and that is still true now that the tint is built, which is the whole reason it is built the way it is"*, with a WO-3.19 paragraph beside the WO-3.6 one |
| `src/scores.js:101-106` | the import comment names one import | names both, and says the second is a **question** rather than a paint, imported so as not to become a second reader of the date |
| `src/scores.js:672-675` | why `paintPastDue()` is called on both sides of the empty-state return | that, plus why the call is **above** the head row: move it below and every head answers about the class before |

*Gained a clause, because they were true but incomplete:*

- `src/assignments.css:125` — the shared-ink paragraph said *"the drawing's `.scores-col-due.overdue`"*.
  It is `src/scores.css`'s now, and the signal is at three volumes rather than two.
- `src/assignments.js:115` — the import comment now says why the score grid asks the module instead of
  copying this file's comparison, and that the two tints answer **different questions** (a column not
  fully *entered* vs. blanks the prompt is asking about), which is why a "Not now" leaves this one amber.
- `src/prefs.js:132` — a dismissal now silences two things rather than one; nothing about what is
  *stored* changes.
- `src/shell.js:1123` — the redraw chain gained the honest consequence: "Not now" takes the amber off
  too, but not until the next render, and rebuilding the grid to fix that is a cost this paragraph
  already refuses to pay for a tap that wrote nothing.
- `design/mockups/proposed.css:297` — records that this is the one rule in § SCORE GRID that WO-3.5 did
  not take, and where it went.

*Left exactly as they were, because they are true:* `src/assignments.css:203` and `:453`,
`src/assignments.js:377` and `:538`, `src/past-due.js:3` and `:225`, `src/scores.js:708`,
`src/shell.js:339`, and the first sentence of `src/assignments.css:115`. WO-3.6 really does own the
prompt, the accept, the dismissal preference and the three buttons; a comment saying so is provenance,
and a blanket rewrite would have destroyed it — which is this work order's own failure pointed the
other way.

**6. 👤 The tint is legible on the iPad in a lit classroom and not mistaken for an error state.**
**Not met — not attempted. I have no iPad and cannot have one.** The box is left `- [ ]` in both the
work order and `TESTING.md` § WO-3.19. What the desk can say and did: the ink resolves to
`rgb(138, 109, 26)` on the score grid's column head **and** on the assignment list's due date in the
same reading, so the two screens carry one amber; and the base rule's 9px → 10px coarse step still
applies to the tinted span, because the tint changes nothing but colour. Whether 9px amber against the
neighbouring `#a0aab8` reads as a nudge or as a fault at arm's length in a lit room is exactly what no
emulator can answer.

---

## Verification actually run

- **`node tools/verify-shell.mjs`** — ran to completion, twice.
  - Unmutated tree: **`714 checks · 714 passed · 0 failed · 0 skipped`**, 18,235 lines, 25.5 lines per
    check, **233s**. All four new checks in the PASS list; quoted above.
  - Mutated tree (the date-reading predicate): **`714 checks · 713 passed · 1 failed`**, the one red
    being acceptance line 4's check.
- **`node tools/wo-sweep.mjs`** — **`17 checks · 15 passed · 0 failed · 2 to review`**. Both REVIEWs are
  WO-3.6's, unchanged: the sensitive-field-name line at 275 mentions (same file list, same count as the
  baseline I took before writing anything), and the due-date line at the same **8** prose lines it named
  before, at shifted line numbers. Nothing this work order wrote added a hit to either. The new selector
  `.scores-col-due.overdue` reports as *"1 new selector(s), all covered"* — its base `.scores-col-due` is
  already in the coarse block, and the tint is a colour on a label rather than a control, which is now
  said in the coarse block itself so the next reader does not have to prove it was considered.
- **`node tools/wo-gate.mjs --audit`** — 93 work orders, 0 problems; every `**Owes**` pointer resolves;
  every dashboard row matches its boxes.
- **`node tools/wo-gate.mjs --self-check`** — 13 of 13 plants caught.

Four `check()` call sites were added, so `tools/README.md`'s asserted count went 713 → 717 with a
WO-3.19 paragraph in the ledger; `wo-sweep.mjs`'s call-site check is green against the new number.
`sw.js`'s `CACHE` went to `planbook-shell-v53` in the same pass as the three SHELL files that changed.

---

## Decisions the work order did not settle, and which way I went

**1. What the tint's set *is*, once a dismissal exists.** Acceptance line 3 says "exactly the
assignments the banner's sentence names" and line 4 says a column stops being tinted when its blanks are
marked — together those are the prompt's `previewed` set, which is filtered by `pastDueDismissed`. So
**"Not now" takes the tint off as well as the banner.** The argument that decided it is already in the
tree: `src/assignments.css` calls the tint and the banner *"the same signal at two volumes"*, and
silencing one volume and not the other leaves an amber head with nothing on screen to explain it. The
alternative — a second view of the same walk that ignores dismissals — is a second set, and the third
deliverable is about there being one. Written down at `src/past-due.js`'s export and at
`src/prefs.js:132`.

**2. The consequence I could not remove, stated rather than hidden.** `dismissPastDue()` repaints its
own banner and nothing else — `src/shell.js` deliberately does **not** redraw the screen for a tap that
wrote no cell, because rebuilding the grid under a half-typed digit is the cost that comment refuses.
So after "Not now" the heads stay amber until the next render. I did not change that chain: it is a
deliberate decision with its reasoning at the call site, and a colour one render stale is a smaller cost
than a caret one render lost. Noted in `src/shell.js` and in `TESTING.md` § WO-3.19.

**3. The two tints do not agree after a dismissal, and that is not a bug.** The assignment list's amber
date is its own comparison over its own set — `due < today && enteredCount < roster`, which counts a
`late` blank as *entered* and knows nothing about dismissals. The score grid's says "the prompt is
asking about this column". They are two questions that mostly coincide. Out of scope forbids touching
the list's tint and I did not; I wrote the difference down at `src/assignments.js:115`, where a reader
comparing the two screens will look.

**4. A test-only attribute.** `data-score-col` on the `<th>`. Precedent is `data-past-due-cell` on the
review chips, added by WO-3.6 for the same reason: an acceptance line about *which* things is otherwise
a claim nobody can read back. Alternative considered and rejected: mapping head index onto cell index in
the check, which is correct today and goes quietly wrong the first time a column is inserted.

---

## Out of scope — the temptations, declined

- **A tint on a cell.** Named in Out of scope. The set is per assignment *and per student*, so
  `previewed` would have supported it in about four lines, and it would have been the wrong thing: a
  blank cell that is styled is a blank that looks like a state somebody chose, which `src/scores.css`
  already says in as many words two rules further down.
- **Changing what the prompt counts.** Untouched. `pastDueBlanks()`, `isUntouched()` and the dismissal
  filter are exactly as WO-3.6 left them; the only edit inside that function's neighbourhood is prose.
- **The assignment list's existing tint.** Untouched, including the fact that it uses a wider set.
- **`shortDate()` is still the third copy of the same eight lines.** WO-3.20 owns that; I added no
  fourth and imported none of the three.
- **A `.scores-col-due.overdue` line in the coarse block.** A dead rule restating a colour would have
  looked like diligence. A comment naming it and saying why it needs no line is what the block's own
  convention actually asks for.

---

## Files changed

- `src/scores.css` — the rule, the header census (three things → two), the grade-sheet head's
  departure, the coarse-block note
- `src/scores.js` — decision 1, the import, `columnHead()` (the tint, the `title`, `data-score-col`),
  the `paintPastDue()` ordering note
- `src/past-due.js` — `pastDueAsksAbout()` and its reasoning; decision 5 gains "one comparison, two
  things drawn"
- `src/assignments.js` — two comment sites (the import, the tint's `title` provenance)
- `src/assignments.css` — the shared-ink paragraph
- `src/prefs.js` — what a dismissal now silences
- `src/shell.js` — the redraw chain's new consequence
- `design/mockups/proposed.css` — records where the rule went
- `sw.js` — `CACHE` → `planbook-shell-v53`
- `tools/verify-shell.mjs` — four checks and the `READ` fields they need, inside the WO-3.6 section
- `tools/README.md` — call-site count 713 → 717, with the ledger entry
- `TESTING.md` — a § WO-3.19 section; WO-3.6's "what is not here" paragraph corrected
- `plans/work-orders/phase-3-gradebook.md` — five Acceptance boxes ticked with their evidence, status
  written by `--tick`

---

## Draft `CHANGELOG.md` entry — yours to keep, cut or rewrite

```
### Added
- The score grid's column heads now print an overdue due date in amber, for exactly the work the
  past-due prompt is asking about. The banner says how many blanks are past due; the tint says which
  columns, without opening the review. It writes nothing and marks nobody — it is the same colour the
  assignment list has always used for the same fact, and it goes as soon as the blanks are filled or
  marked.
```
