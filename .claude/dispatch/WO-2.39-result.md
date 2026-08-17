# WO-2.39 — four line references in tools/README.md have been wrong for thousands of lines · result

**Implementer** Claude (work-order-implementer), Opus tier · **Date** 2026-08-17
**Work order** `plans/work-orders/phase-2-attendance.md` § WO-2.39 (line 3789)
**Brief** `.claude/dispatch/WO-2.39-brief.md`

---

## Headline

All five references are fixed. **Four of the five are now anchored by the target file's own text and
carry no line number at all**; the fifth (`:1869`) turned out to be **resolvable after all**, and is
recorded as resolved *and* re-anchored by text. **The sweep was refused**, with the argument written
into two files. No check was built, so the demonstrate-failing-then-passing clause does not apply —
said plainly rather than left implied.

One thing the work order predicted did not hold, and it is the more interesting half of the row:
`:1869` was **not** unresolvable. Block B's `markKeys` pointer **was**, and worse than the work order
knew — it was wrong the day it was typed, in both readings, which I proved from the commit that wrote
it rather than inferred.

---

## Acceptance line 1 — each of the four references resolves to what it claims, or says something that cannot go stale, with the reasoning recorded for any that could not be resolved

**Met.** All four now name their referent in `verify-shell.mjs`'s own words. Every number below was
re-grepped **after** the last edit this row makes, per the Traps line — the greps are given so the
verifier can re-run them.

| # | `tools/README.md` | Was cited | Referent, freshly grepped | The grep |
|---|---|---|---|---|
| 1 | `:833` | `:10773` | `tools/verify-shell.mjs:14295` | `grep -n 'else check(' tools/verify-shell.mjs` — exactly 1 hit |
| 2 | `:1453` | `:12532` | `tools/verify-shell.mjs:16313` | `grep -n "the WO-3.5 fixture is real: a class of 25 with case 1" tools/verify-shell.mjs` |
| 3 | `:1763` | `:17574` | `tools/verify-shell.mjs:21381` | `grep -n "doc.students.push(person('wo38-s1', 'Ashdown'" tools/verify-shell.mjs` — 1 hit |
| 4 | `:1488` | `:1869` | `tools/verify-shell.mjs:2789` | `grep -n 'Eight checks, and the fixture is the whole argument' tools/verify-shell.mjs` — 1 hit |

**None of the four now carries a number as a live pointer.** Each carries the greppable text instead,
plus a dated note of what the old number was, so the next reader knows a citation died rather than
thinking one was never there. Confirming grep — the only surviving occurrences of the old numbers are
those explicit `cited as … until WO-2.39` notes:

```
$ grep -n '10773\|12532\|17574\|`:1869`' tools/README.md tools/wo-sweep.mjs tools/verify-shell.mjs
tools/README.md:988:then `:10773`, and then stopped moving while the call site kept going …
tools/README.md:1453:  categories` (cited as `tools/verify-shell.mjs:12532` until WO-2.39, by then …
tools/README.md:1763:`doc.students.push(person('wo38-s1', 'Ashdown'` — one hit; cited as `tools/verify-shell.mjs:17574`
tools/README.md:1488:now, and grepping that phrase is how to find it. This sentence cited `tools/verify-shell.mjs:1869`
```

### `:1869` resolved — the work order expected prose, and the answer was a real referent

The row said *"unresolved — find what it meant"* and predicted the honest deliverable might be "this
pointed at something that no longer exists." **It does exist.** The reference names a section banner in
`verify-shell.mjs`, and the sentence quotes its text, which is what made it findable:

```
$ grep -n 'the fixture is the whole argument' tools/verify-shell.mjs
2789:   * Eight checks, and the fixture is the whole argument. describe() used to count `classes` and
```

That is the **WO-1.15** block's header (`/* ─── WO-1.15: the compare can see what it is about to
delete ───`, two lines above). Three independent confirmations that this is what `:1869` meant:

1. `.claude/dispatch/WO-1.18-result.md:13` — *"One word, line 1869: 'Seven checks' → 'Eight checks'.
   Nothing else — 1 insertion, 1 deletion."* The README sentence is describing exactly that edit.
2. `.claude/dispatch/WO-1.18-result.md:26` — *"The header has moved. It is at `:1869` now, not
   `:1860`."* So `:1869` was **correct when written** and rotted afterwards, unlike block B below.
3. `tools/README.md`'s own § two paragraphs down names the candidate set as *"the WO-1.15 block, and
   WO-1.17's"* — and WO-1.17's is the one it calls *precisely right*. WO-1.15's is the one that was
   wrong. Consistent.

So this pointer died the ordinary way: correct at birth, 920 lines short of its referent by today. The
README now names the phrase and records the number as history.

### Reasoning recorded for the one number that stayed a number

`tools/verify-shell.mjs:68` in the same sentence as reference 1 **lands** (it is the `check()`
definition — see the spot-check) and is out of this row's scope, so I left it. Reported rather than
quietly changed.

---

## Acceptance line 2 — the fifth reference, block B's `markKeys` pointer, is corrected or replaced with something that cannot rot

**Met, and by the honest route the line names: the number cannot be established, and the comment now
says what it should have said instead.** I did not adopt either candidate number.

`tools/verify-shell.mjs`'s block B said *"`markKeys` is read FILE-WIDE out of src/shell.js (`:611`)"*.
I read it both ways as the brief required, against the commit that **wrote** the sentence — found with
`git log -S'read FILE-WIDE out of src/shell.js' --oneline -- tools/verify-shell.mjs`, which returns
exactly `392a80d Retire the hardcoded floors in both key checks (WO-2.36)`:

| Reading | At `392a80d`, the commit that wrote it | Today |
|---|---|---|
| `src/shell.js:611` | prose in the comment over `afterAssignmentChange()` (`git show 392a80d:src/shell.js \| sed -n '605,618p'`) | same prose, `src/shell.js:611` |
| `src/shell.js`, the actual `MARK_KEYS` | `:1617` (`git show 392a80d:src/shell.js \| grep -n MARK_KEYS`) | `:1617` — **it never moved** |
| `tools/verify-shell.mjs:611` | `const guardAnchor = "if (views.currentView() !== 'class') return;";` | — |
| the harness's own file-wide read | `:622-624` (`const markKeysMatch = shellSrc.match(…)`) | `:655` |

**So `:611` was wrong on the day it was typed, under every reading, and this is stronger than the work
order knew.** The work order established that neither `:611` is the read *today*; the git archaeology
shows neither ever was. And the harness-relative reading is worse than merely wrong: `:611` in that
file was `guardAnchor` — **the listener-slice read that the sentence exists to distinguish itself
from.** A pointer that lands the reader on the opposite of the thing being contrasted, inside a
paragraph whose subject is *"a mitigation cited for a case it does not cover is worse than none."*

**What the comment says now** (`tools/verify-shell.mjs:594-606`), anchored to code, no number:

> `markKeys` is read FILE-WIDE out of src/shell.js — readMarkingKeys() below matches
> `const MARK_KEYS = [` against `shellSrc`, the whole file, and not against `body` — so a `MARK_KEYS`
> that is still DECLARED while the listener has stopped testing it leaves all five letters in `bound`
> … (That read was cited as `:611` from WO-2.36 until WO-2.39, and the number was wrong the day it was
> typed, whichever file it meant: … and `:611` in THIS file was `guardAnchor`, the listener-slice read
> this sentence exists to distinguish itself FROM. …)

`readMarkingKeys` and `const MARK_KEYS = [` are both single-hit greps, and both name the two things the
sentence contrasts. Re-grepped last: `grep -n 'const markKeysMatch' tools/verify-shell.mjs` →
`655`, and `grep -n MARK_KEYS src/shell.js` → `1617`, `1699`. The comment cites neither number.

**This is a comment-only change.** No executable line moved; `git diff -- tools/verify-shell.mjs`
touches nothing but the block comment, and the `check()` call-site count is unchanged at 808 (below).

---

## Acceptance line 3 — a spot-check of at least six other `:NNN` references in `tools/README.md`, reported whether they land or not

**Met — twelve references checked, not six.** Every `:NNN` in the file other than the four I owned.
(Excluded as not line references: `:8080` and `:8000` in § "Testing on the iPad", the time string
`"T8:14a"` at `:395`, and the JSON literal `{"body":1,…}` at `:825`.)

**Verdict: 4 land · 6 do not · 2 are self-declaring and need nothing.**

| At | Reference | Resolves to | Verdict |
|---|---|---|---|
| `:833` | `tools/verify-shell.mjs:68` | `function check(name, ok, detail) {` | **LANDS** |
| `:1252` | `:370-376` (into the harness) | the `bound` / `Object.keys(GLYPH_OF)` clause WO-3.22 carries — exactly the seven lines named | **LANDS** |
| `:1759` | `src/accommodation-prompt.js:186` | `const seen = new Set();` | **LANDS** |
| `:1777` | `:190-191` (same file) | `if (seen.has(kind)) return;` / `seen.add(kind);` — the Set's two call sites | **LANDS** |
| `:1392` | `tools/verify-shell.mjs:495` | a string fragment | **Does not land — but correct as written.** It is quoted *failure text* from a mutation run (`"…:495 hold(s) more than one check("`), a record of a reading rather than an instruction to look. Not debt. |
| `:1252` | `:281-287` | — | **Self-declared stale in its own sentence** (*"`:281-287` when this was written"*). Honest; needs nothing. |
| `:1454` | `:4814` | `totalling 100. Read off the document for every class…` | **Does not land** |
| `:1454` | `:6708` | blank line | **Does not land** |
| `:1454` | `:10143` | blank line | **Does not land** |
| `:1454` | `:12632` | `&& projected.trips.length === 0 …` | **Does not land** |
| `:1461` | `:11557` | blank line | **Does not land** |
| `:1461-62` | `:11269` | a `check(` — but a different one (the 41-minute clock) | **Does not land, and looks like it does.** The hazard case. |
| `:1462` | `:11296` | `ticked = await read();` | **Does not land** |
| `:1462` | `:11332` | a comment line | **Does not land** |
| `:1462` | `:11338` | a comment line | **Does not land** |
| `:1608` | `src/grade-engine.js:35-36` | `recorded, just as extra-credit scores do. */` / `function numberOrZero(value) {` — the `classId`/`termId` filters are at **`:44-45`** | **Does not land — off by 9** |
| `:1611` | `src/grade-engine.js:41-42` | `function assignmentsFor(…)` / `const classId = cls && cls.id;` — the `scoreCell()` `studentId` lookup is at **`:51-52`** | **Does not land — off by 10, and it lands on the *other* function named in the same sentence.** The worst shape in the file: plausible, adjacent, wrong. |
| `:1767` | `tools/README.md:783` (self-reference) | `them made almost none. Three things about it are worth knowing.` — the call-site sentence is at **`:830`** | **Does not land** |

**Two findings that size the remaining debt honestly rather than inflating it:**

- **The nine numbers in the two bullets at `:1454` and `:1461-62` are scoped by the paragraph above
  them**, which already says the WO-2.19 instrumentation *"has **not** been re-run since, so treat the
  three counts in it as the measurement of that tree rather than of this one."* They are line numbers
  **on the WO-2.19 tree**, not live pointers. I did not re-resolve them (out of scope), and I added
  half a clause at `:1454-56` saying so in as many words, so the next reader is not left to infer it.
- **The two `src/grade-engine.js` references at `:1608` and `:1611` are the real remaining debt**, and
  they are the dangerous kind — small deltas into a 270-line file, landing on plausible neighbours.
  Out of scope for this row; **named as a proposed follow-up below.**

---

## Acceptance line 4 — the sweep question is answered in writing; if a check was built it is demonstrated failing before passing

**Met. I refused the sweep, and no check was built — so there is no failing-then-passing transcript to
paste, and I am not pretending otherwise.** The tree was never mutated for a demonstration and needed
no restoring.

The argument, written into two files:

- `plans/verification-tooling.md` § **"The `:NNN` pointers into the harness are anchored by text, not
  swept, 2026-08-17 (WO-2.39)"** — the full reasoning, sitting beside the WO-2.38 self-test section
  whose rules it has to live under.
- `tools/README.md` § 11, after the "20 above is deliberately unguarded" paragraph — **"Point into the
  harness by its own words, not by a line number"**, for the reader who is in that file.

**The decisive argument, in one line: a clause can only assert that the named line exists, and all
five references this row fixed pointed at lines that do.** `verify-shell.mjs` is 22,149 lines;
`:10773`, `:12532`, `:17574`, `:1869` and `src/shell.js:611` (in a 2,346-line file) would every one
have passed a line-exists check on the day it was wrong. That is `wo-sweep.mjs`'s own oldest failure
shape — a green-looking wrong answer — and its header warns about it twice. It is also exactly why
§11's existing cross-file assertion earns its keep and this one would not: **§11 compares a count, and
a count cannot be satisfied by a wrong-but-plausible value.** A `:NNN` resolver can be satisfied by
nothing but plausibility.

**The second argument is that the non-vacuous version defeats itself.** To check that a pointer lands,
the README must state the text it expects there — and once the reference carries the text, the number
is redundant. The check's precondition *is* the fix that makes the check unnecessary. So the answer is
the anchor, not the sweep, which is also the third deliverable.

**What I named as available and did not build:** a clause asserting that every anchor `tools/README.md`
quotes into the harness still *occurs* there. That one is genuinely non-vacuous — an empty grep is a
red — but it needs a machine-readable convention for which backticked strings in 1,900 lines of prose
are anchors, which is the same convention retrofit §11 already priced and rejected for section-end
markers. Written down as the check to reach for if the anchors are ever put to a convention. **Not
built, and not a second harness**: it would be a clause in `wo-sweep.mjs`, the named precedent — I
declined it on cost, not on shape.

**Third deliverable — the note on anchoring by text — is the `tools/README.md` § 11 paragraph above.**
It names the failure mode (`else check(` is one hit in 22,000 lines; a wrong number reads as a right
one; an empty grep reads as "go and look"), points at `guardAnchor` in `verify-shell.mjs` as the
existing example of the idiom, and carves out the one case where a number legitimately stays: **a
record of a reading** — a quoted failure message, a measurement of the tree that day — as opposed to
an instruction to go and look. That carve-out is what keeps the nine WO-2.19 numbers and the `:495`
quotation from reading as debt somebody should go and "fix."

---

## Acceptance line 5 — `node tools/wo-sweep.mjs` green, `git diff --stat -- src/` empty

**Met.** Both run on the delivered tree, after the last edit.

```
$ node tools/wo-sweep.mjs
================ SUMMARY ================
20 checks · 18 passed · 0 failed · 2 to review
$ echo $?
0
```

The two REVIEWs are the standing pair (`sensitive field names outside src/backup.js`, `due-date and
late/missing on the same line`), documented in `tools/README.md` as read and dismissed on every run.
**0 failed.** The two clauses this row could plausibly have broken are green and quoted:

```
PASS | the recorded `check()` call-site count matches the harness  :: 808 `check()` call site(s) in
      tools/verify-shell.mjs, matching tools/README.md:830 — call sites, not executed checks
PASS | one `check()` call per line in the harness  :: 808 call-site line(s) …, none holding a second `check(`
```

808 is unchanged from HEAD, which is the check that my block-comment edits added no call site and moved
no count. The sentence §11 greps (`tools/README.md:830`) is untouched.

```
$ git diff --stat -- src/
$
```

**Empty.** Nothing under `src/` was touched at any point. Full diffstat, checked against the
CRLF-rewrite hazard — 119 insertions across 5 files for a change of this size is proportionate:

```
 plans/verification-tooling.md           | 38 +++++++++++++++++
 plans/work-orders/phase-2-attendance.md | 12 +++---
 tools/README.md                         | 72 ++++++++++++++++++++++++++--------
 tools/verify-shell.mjs                  | 15 +++++--
 tools/wo-sweep.mjs                      |  9 ++++-
 5 files changed, 119 insertions(+), 27 deletions(-)
```

`node --check` passes on both edited `.mjs` files.

### `verify-shell.mjs` — it *did* run here, three times, and one run was not green

Not an environment report: the harness ran in this dispatch. I am reporting all three runs because the
middle one matters.

| Run | Tree | Result | Exit |
|---|---|---|---|
| 1 | after the block-B edit, before the last comment re-wrap | `824 checks · 824 passed · 0 failed · 0 skipped`, 22,150 lines, 261s | 0 |
| 2 | final tree | `824 checks · 823 passed · 1 failed · 0 skipped`, 22,150 lines, 261s | **1** |
| 3 | final tree, unchanged from run 2 | `824 checks · 824 passed · 0 failed · 0 skipped`, 22,150 lines, 260s | 0 |

(An earlier fourth invocation exited 1 on `/vs.log: Permission denied` — my redirect path, not the
harness. Discarded and re-run; mentioned so the count of invocations in any log matches this report.)

**Run 2's single failure, verbatim:**

```
FAIL | and the clock still reaches that student five minutes later, because the class it belongs to
is still the one that is open  :: the open class is "c_b1", the pass belongs to "c_b1" and records
alerted = 1; the announcement was "nothing has been announced since this sentinel was written"
```

**My reading, stated as a reading rather than a verdict: an intermittent check, not a regression.**
Three reasons, and the third is the one that persuades me:

1. Runs 1 and 3 are 824/824 on the same tree. The check is `tools/verify-shell.mjs:12897`, in
   WO-2.30's hall-pass block — nothing WO-2.39 touched. This row changed documentation and two block
   comments; `git diff --stat -- src/` is empty.
2. It samples an `aria-live` announcement after winding a clock, one check after another check that
   also writes to the same live region — a two-writes-in-a-row sampling race.
3. **The failure signature is not the defect's.** `TESTING.md:3486` records what this check prints on
   the unfixed build it was written for: *"the open class is `c_2b2z71075k`, the pass belongs to
   `c_b1` and records `alerted = undefined`"* — wrong room, no alert. Run 2 printed *"the open class
   is `c_b1`, the pass belongs to `c_b1` and records `alerted = 1`"*: **right room, alert fired.** The
   app behaved; only the announcement sample missed.

**I am not ticking anything on the strength of that, and I am not calling the check sound.** Acceptance
line 5 names `wo-sweep.mjs` only, and that is green. `verify-shell.mjs` is green on two of three runs
over this tree and I have said which. **Proposed follow-up below.** If the owner wants a fourth run
before accepting, that is a reasonable ask and I have not pre-empted it.

**No 👤 line is ticked, and none was touched.** This row has none — it is documentation and two
comments; nothing renders, so there is nothing for a real iPad or human eyes to read. Said explicitly
because the brief asks for it, not because a box was skipped.

---

## Files changed

- `c:\dev\planbook\tools\README.md` — the four references re-anchored to text (`:833`, `:1453`,
  `:1488`, `:1763`); the `else check(` drift parenthetical at `:987-992` rewritten now that neither
  carrier cites a line; half a clause at `:1454-56` marking the nine WO-2.19 numbers as that tree's
  measurement; the new § 11 paragraph on anchoring by text at `:1573-1596`.
- `c:\dev\planbook\tools\verify-shell.mjs` — block B's `markKeys` pointer re-anchored to
  `readMarkingKeys()` and `const MARK_KEYS = [`, with the archaeology recorded at the point of
  departure. **Block comment only; no executable line changed.**
- `c:\dev\planbook\tools\wo-sweep.mjs` — § 11's allowlist bullet, the co-carrier of the same
  `else check(` reference, re-anchored to `grep -n 'else check(' tools/verify-shell.mjs`. **Comment
  only.** (See the scope decision below — this file is not in the row's Out of scope list, and fixing
  one carrier without the other is what `tools/README.md` itself says not to do.)
- `c:\dev\planbook\plans\verification-tooling.md` — new § "The `:NNN` pointers into the harness are
  anchored by text, not swept, 2026-08-17 (WO-2.39)", 38 lines, after the WO-2.38 section.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — the five Acceptance boxes ticked.
  **The `🤖 CLAIMED — 2026-08-17` on the Status line was already in the working tree when I started**
  (the orchestrator's `--start`, after the session's git snapshot); it is not mine and I left it. I did
  **not** run `--tick` or write `✅ DONE` — per `.claude/agents/work-order-orchestrator.md:246`, that
  is the exit from `🤖 CLAIMED` and it is not the implementer's to write.
- **No `CHANGELOG.md` entry** — the teacher's call. A draft is at the foot of this file.
- **No commit, no push** — the brief did not ask.
- `sw.js` `CACHE` **not** bumped, deliberately: nothing in `SHELL` changed. `wo-sweep.mjs` § 9 agrees
  (*"planbook-shell-v72 was set at 5ea832f; no SHELL file has changed since"*).

---

## Decisions the work order did not settle, and which way I went

**1. `tools/wo-sweep.mjs:595` carried the same `:10773` reference, and I fixed it too.** This is the
one place I went past the narrowest reading of the row, so it gets the most words.

The row's **Out of scope** names the `:NNN` references inside `tools/verify-shell.mjs` and inside
`TESTING.md`. It does not name `wo-sweep.mjs`. And `tools/README.md:987` — the paragraph I was fixing
— states the trap in its own words: the number *"sat in two files that had to be corrected in step or
read as disagreeing."* Fixing the README alone would have left a known-wrong number in the sweep and
the README's note about it either false or in need of keeping. Fixing both removed the disagreement
instead of relocating it. It is a two-line comment edit in a file the brief told me to read as the
named precedent, with no behaviour change and the call-site count unmoved at 808. **If the verifier
reads this as widening, I would rather be corrected than have shipped a pointer I had measured as
wrong.**

**2. Text anchors instead of corrected numbers — for all five, including the three that had a clean
numeric answer.** The Deliverables allow either (*"corrected, or replaced with something that does not
rot where no correct number exists"*). I took the second for all of them because this is the third work
order in a row to re-point the same handful of numbers, and because the row's own history shows a
corrected number is not safe either: two of the three re-resolutions done in commit `820f41c` were
*close enough to look right* and landed eleven lines and several hundred lines off. The Traps forbid
deleting the pointer; **I did not delete any pointer, I changed its currency** — every one now carries
a single-hit grep plus the number it used to be, so nothing a reader wanted was removed. My insertions
into `verify-shell.mjs` moved references 1-3 by nine lines within the hour, which is the argument
making itself.

**3. I left the four extra numbers at `:1454` and the five at `:1461-62` alone.** Nine known-wrong
numbers, in the sentence next to one I was fixing, and I did not touch them. Out of scope
(*"Re-auditing the rest is not this row"*), and the paragraph above them already scopes them as a
WO-2.19-tree measurement — so they are a record of a reading, which is the category my own note carves
out as legitimately staying a number. I added a clause saying so rather than silently leaving the
reader to work it out. **The temptation was real and I am recording it rather than acting on it.**

**4. I did not rewrite the work order's own table**, which still says `:1869` is *"unresolved — find
what it meant."* It is resolved, above, with evidence. Editing the row's prose is not an implementer's
job; the same goes for `plans/work-orders/README.md:519-527`, whose booking narrative says `:1869`
*"has no obvious referent"* and predicts the deliverable may be *"this pointed at something that no
longer exists."* Both are accurate records of what was believed at booking. **The orchestrator or
verifier may want to add one sentence to each saying how it came out** — flagged rather than done.

**5. Exact deltas are in the notes; the notes say when they were measured.** `3,522 / 3,781 / 3,807`
and `920` appear in both the README paragraph and the `verification-tooling.md` section, each framed as
what WO-2.39 measured on the tree it delivered. I deliberately did **not** put a delta in the inline
per-reference notes ("thousands of lines short of it") — a delta to a *current* position is a number
that rots, which is the whole subject. I also corrected my own first draft, which had copied the work
order's *"3,200–3,500 lines each"* onto all four: three are 3,500-3,800 and the fourth is 920. Rounding
a figure to the one already written down is the small version of this row's own defect.

---

## Proposed follow-up work orders — not done, named

1. **The two `src/grade-engine.js` references at `tools/README.md:1608` and `:1611` are wrong by 9 and
   10 lines**, and `:41-42` lands on `assignmentsFor()`'s signature when the sentence is about
   `scoreCell()`'s `studentId` lookup — the *other* function named in the same paragraph. Small deltas
   into a short file are the most convincing kind of wrong. Both should become text anchors. XS.
2. **`tools/README.md:1767`'s self-reference `tools/README.md:783`** misses the call-site sentence,
   which is at `:830`. A file citing its own line number is the one case where a text anchor is free
   (the sentence is already quoted verbatim by `wo-sweep.mjs` § 11). XS.
3. **`verify-shell.mjs:12897` — *"the clock still reaches that student five minutes later"* — is
   intermittent.** One failure in three consecutive runs on an unchanged tree, with a signature
   distinct from the defect the check exists for (right class, `alerted = 1`, announcement unsampled).
   `tools/README.md` trap 5 is exactly this — *"a fixed sleep before a measurement is a race, and it
   hides defects rather than only causing flakes"* — and trap 5's own lesson is that the flaky-looking
   check is worth investigating rather than writing off. It samples a live region one check after
   another check writes to the same live region. S. **This one I would book first of the three**: it is
   the only item here that can make a real red look like noise.
4. **A `wo-sweep.mjs` clause asserting that every anchor `tools/README.md` quotes into
   `verify-shell.mjs` still occurs there** — non-vacuous, unlike the `:NNN` resolver refused above,
   because an empty grep is a red. Blocked on a convention for marking which backticked strings are
   anchors. Reasoning already written into `plans/verification-tooling.md`; this is the row that would
   act on it. M, and not urgent.

---

## Draft `CHANGELOG.md` entry — the teacher decides whether and how this lands

> **Documentation.** Five line-number pointers into the verification harness were re-anchored to the
> code's own text rather than corrected: four in `tools/README.md`, off by up to 3,807 lines and
> inherited across three work orders, and one in `verify-shell.mjs` that had never been right. A
> pointer that misses by three thousand lines does not read as stale, it reads as a pointer, and it
> sends the reader into unrelated code convinced they have misread the document. A grep for `else
> check(` finds one hit and cannot rot with an insertion; a line number rots the next time anybody
> adds a check. Whether to police this mechanically was asked and answered no — a check can only
> confirm the named line exists, and every one of the five wrong pointers named a line that did.

---

## What I could not verify

- **Nothing here needs an iPad or human eyes.** No 👤 line exists on this row and none is ticked.
  Nothing renders; the whole change is prose and two comments.
- **`verify-shell.mjs` is green on runs 1 and 3 and red on run 2**, all three over this tree, all three
  quoted above with their summary lines. I could not make run 2's failure reproduce, so **I cannot
  state that the check is flaky rather than marginal** — I can state that the app behaviour it asserts
  was correct in the failing run (`alerted = 1`, correct open class) and that the failing signature
  differs from the one `TESTING.md:3486` records for the defect. Booked as follow-up 3 rather than
  diagnosed here, which would have been a different work order.
- **The nine numbers at `tools/README.md:1454` and `:1461-62` I resolved but did not re-point**, so
  they remain wrong-as-line-numbers while being correct-as-history. I have reported each individually
  above; I have not verified that every one of them was right on the WO-2.19 tree, only that none is
  right on this one.
