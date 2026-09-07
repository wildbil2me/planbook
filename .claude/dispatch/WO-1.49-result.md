# WO-1.49 — result

**Role** work-order-implementer (Claude Opus)
**Date** 2026-09-06
**Status left on the row** `🤖 CLAIMED` — untouched, for the orchestrator's `--handoff`.

---

## The ruling: answer 1

**I took answer 1 — the number comes out.** The paragraph at `src/shell.js:598` now names `submit`,
`input` and `keydown` and states no count of document-level listeners at all. Which answer was taken
and why is written at the line, in a block beginning `THIS PARAGRAPH NAMES LISTENERS AND HOLDS NO
COUNT OF THEM, WHICH IS WO-1.49's RULING AND NOT AN OMISSION.`

Three things carried the decision, and the second is the one I would not have found without
re-deriving from the tree as instructed:

1. **The fence fails § 22's own test.** `tools/wo-sweep.mjs` § 22 states in its allowlist why it
   earns its keep: *"The value here is that ONE number is load-bearing for a recovery procedure other
   documents point at."* Nothing anywhere acts on "three other document-level listeners." A reader
   uses the names; the figure carried only the risk. Building answer 2's fence would have added a
   42nd sweep check and a `tools/README.md` count move to guard a figure with no consumer.
2. **The work order's own dates are the evidence, and I checked them rather than quoting them.** The
   row was booked at `2386002` (2026-09-06 14:39) against twelve `document.addEventListener` calls.
   `a78abf9` (2026-09-06 19:47) landed WO-1.48 and took `focusout` out. Measured directly:

   ```
   git show 7d72eac:src/shell.js | grep -c "document.addEventListener"   → 12
   git show a78abf9:src/shell.js | grep -c "document.addEventListener"   → 11
   grep -c "document.addEventListener" src/shell.js                      → 11
   ```

   A figure typed into that comment on the afternoon it was booked would have been wrong by the
   evening. That is the work order's answer-1 argument holding, empirically, inside one day.
3. **`DOMContentLoaded` forces answer 2 to become the census WO-1.47 refused to write.** The Traps
   line requires check and comment to agree *in as many words* about whether the boot hook counts.
   Saying that in the comment turns the paragraph into the thing WO-1.47's correction round
   deliberately declined to turn it into.

The repaired block also tells the next reader not to put a figure back without the fence, and points
at § 22's test before deciding the fence is worth it — so the ruling is re-openable on its own terms
rather than merely asserted.

**The census command is proved against the pre-repair file**, which is the Traps line 5 discipline
applied to the one command the repair now points at: `grep -n document.addEventListener src/shell.js`
returned 12 on the pre-WO-1.48 tree and returns 11 now, so it does catch the drift this row is about.

---

## Against the Acceptance list, line by line

**1. `src/shell.js`'s delegation preamble no longer states a count that disagrees with the file — by
answer 1 or by answer 2, with which answer was taken and why written at the line.** — **Met.**
Verified by reading the paragraph back (`src/shell.js:598-624`). It contains no numeral describing
document-level listeners. `Three other document-level listeners live further down` is gone; the
opening is now `Other document-level listeners live further down`, and the list is introduced as
*the ones named here are named because…* rather than as a count. The `-B/-A` trap of the sentence's
denominator does not arise: **no ratio is stated at all**, so nothing reads as three-of-eleven or
three-of-twelve. I deliberately avoided a numeral even in the historical sentence (`It used to open
by counting them`, and `the drag listeners` rather than *the three drag listeners*) so that a cold
grep of the paragraph finds no listener count of any kind.

**2. If answer 2: the count is asserted by `wo-sweep.mjs` … proved against the pre-repair comment.**
— **Left blank, deliberately, and this is the one box I did not close.** Answer 2 was not taken, so
the antecedent is false and there is no fence to point at. Ticking it would assert a `wo-sweep.mjs`
check that does not exist — the exact WO-1.8 offence. The work order does not say what to do with
the branch not taken; I read it as vacuously satisfied and left the box for the verdict path rather
than ticking it on a condition that did not obtain. **No new check was added to `tools/wo-sweep.mjs`
and no number in `tools/README.md` moved.**

**3. If answer 1: no count remains in the paragraph, and the holding parenthetical WO-1.47 added is
removed rather than left standing beside its own resolution.** — **Met.** The parenthetical
*"(There are more document-level listeners further down than that sentence counts — it names the ones
that were there to name. The census is the listeners themselves; this paragraph is not one and is
deliberately not being turned into one here.)"* is gone in full. Its **point** survives in the
repair rather than its apology: the opening sentence no longer claims completeness, so there is
nothing left to apologise for, and the census-is-the-listeners argument is made once, in the ruling
block, as a resolution rather than as a holding position.

**4. `verify-shell.mjs` green, `wo-sweep.mjs` green, `wo-gate.mjs --audit` green — with
`tools/README.md`'s check count moved to match if answer 2 added one.** — **Met, on runs I read to
completion.** No check was added, so no count moved.

- `node tools/verify-shell.mjs` — **ran here, foreground, waited for exit.** `EXIT=0`.
  Summary as printed: `1299 checks · 1299 passed · 0 failed · 0 skipped` / `40,199 lines · 30.9 lines
  per check · 444s`. This ran **after** the `src/shell.js` and `sw.js` edits and over their final
  text; only `plans/` changed afterwards, which this harness does not read.
- `node tools/wo-sweep.mjs` — `41 checks · 38 passed · 0 failed · 3 to review`. The three review
  items are the standing ones (sensitive field names, due-date/late on one line, mockup banners) and
  are unchanged by this work order. Re-run after the `plans/` tick edit: same figures.
- `node tools/wo-gate.mjs --audit` — `PASS | every fragment matches exactly one roadmap box …`,
  dashboard `overall row 65/81`.

**On "on a clean tree":** the tree is **not committed** — I was not told to commit and did not. All
three tools are green over the working tree. The sweep's CACHE check reports the bump as
`planbook-shell-v110 is not in any commit yet — the bump is uncommitted, which is the rule being
followed`, so that section is designed for exactly this state. A verifier re-running these after a
commit should see identical figures.

---

## Files changed

- `c:\dev\planbook\src\shell.js` — the repair and the ruling. One paragraph replaced; +26 / −8.
- `c:\dev\planbook\sw.js` — `CACHE` bumped `planbook-shell-v109` → `planbook-shell-v110`.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` — Acceptance lines 1, 3 and 4
  ticked. Line 2 left `- [ ]`. **The heading was not touched**, per the Traps line: the anchor
  `#wo-149--a-comment-counts-three-document-level-listeners-and-there-are-twelve` still resolves and
  `plans/work-orders/README.md` row 53 still links to it. The `🤖 CLAIMED` status line is as the
  orchestrator left it.

No other file moved. `git diff --numstat` shows `4/4`, `26/8`, `1/1` — no wholesale line-ending
rewrite anywhere.

---

## Decisions the work order did not settle, and which way I went

**The `sw.js` CACHE bump.** Out of scope says *"This row moves words, or words plus one check. It
moves no behaviour."* A cache-name bump moves no app behaviour, but it is not words either. I took
it because `src/shell.js` is entry-adjacent in `SHELL`, `CLAUDE.md` § Commands makes the pairing
unconditional (*"bump `CACHE` in `sw.js` for any change to a file in `SHELL`"*), and **`wo-sweep.mjs`
FAILED without it** — I saw the red line before making the edit:
`src/shell.js changed since planbook-shell-v109 was set at a78abf9`. Acceptance line 4 requires a
green sweep, so the two clauses are only reconcilable this way. If a verifier reads the bump as
out-of-scope, the alternative is a red sweep, and I judged the Acceptance line to govern. Flagging
it rather than burying it.

**Acceptance line 2's disposition.** Covered above. I left it blank rather than tick it vacuously.

---

## Temptations declined, named rather than acted on

- **`src/shell.js:2841` says "The third document-level listener in this file."** I checked it: by
  position the order is `click` :1717 → `submit` :2796 → `keydown` :2894, so it is **correct**. It is
  also an ordinal rather than a census and it is inside Out of scope's *"every other listener comment
  in the file."* Left alone. Worth knowing it survives this row correct, so nobody re-opens it.
- **`tools/verify/keys-legend-marking.mjs:109` cites `src/shell.js:611`.** My repair shifts every
  line below :598 by about eighteen. That pointer was **already wrong the day it was typed** and the
  paragraph containing it says so at length — its whole subject is that the pointer was wrong, and
  the read it guards is anchored by the code's own text rather than by a line number. Repairing it
  would delete the paragraph's evidence. Out of scope and left alone.
- **`plans/work-orders/README.md` row 53 states "eleven"/"twelve" in its defect description.** Not
  corrected, for the heading's reason: it is a defect report and records what was true when the
  defect was found. The Traps line names only the heading, but the doctrine is the same one and I
  applied it rather than widening the row.
- **Answer 2's fence.** Declined, argued at the line, and the line tells the next reader how to
  re-open it. If the owner wants the fence anyway, it is a new row and it should re-read § 22's
  allowlist first — the `DOMContentLoaded` ruling is the real cost, not the code.
- **`TESTING.md`** gained nothing: this row adds no manual reading, no 👤 line, and no new check, so
  there is no section for it to hold.

---

## What I could not verify

- **Nothing on hardware, and nothing was owed.** This work order has no 👤 line and no 📆 line, and
  the change is a code comment — invisible to a device. No box here needs an iPad, and I ticked none
  that does.
- **`verify-shell.mjs` did run in this environment**, contrary to the usual sandbox caveat, and I
  read its exit code and its summary line before writing any of this. It is quoted above from output
  I read, not predicted. Per `CLAUDE.md` § Commands, a green run of it still closes no 👤 item —
  there are none here to close.
- **The tree is uncommitted.** I did not `git commit` or `git push`; the brief did not ask.

---

## `CHANGELOG.md` draft — for the teacher to accept, reject or rewrite

Not written to the file. A suggestion only:

> **Fixed** — the comment introducing `src/shell.js`'s event delegation counted the document-level
> listeners below it and had been wrong for six of them. The count is gone rather than corrected:
> the paragraph names the three listeners it is actually about and leaves the census to
> `grep -n document.addEventListener src/shell.js`, which cannot go stale. A fence that would have
> policed a corrected number was considered and refused — the figure guarded nothing anybody reads.
