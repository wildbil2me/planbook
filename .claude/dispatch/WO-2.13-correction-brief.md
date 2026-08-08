# WO-2.13 — correction round 1

**Route** Codex (same implementer as the first round — this is a correction, not a re-route)
**Original brief** `.claude/dispatch/WO-2.13-brief.md` — still in force, read it again, nothing in it is withdrawn
**Your first-round result** `.claude/dispatch/WO-2.13-result.md`
**Report to** `.claude/dispatch/WO-2.13-result.md` — overwrite it, as your last act

A read-only verifier graded your work cold against the seven Acceptance lines and returned **FAIL**.
Four lines passed and are not in dispute. Three did not. Its ❌ findings are quoted **verbatim**
below. Do not argue with the verdict and do not re-litigate the passing lines — fix what is named.

---

## First, a correction to something you believed and wrote down

Your run reported `node tools/verify-shell.mjs` as unrunnable — Edge never writing
`DevToolsActivePort`, Chrome failing with `Access is denied (0x5)` — and you left four boxes open on
that basis, and wrote "blocked in this sandbox" into both `TESTING.md` and the work order.

**That was a sandbox artifact, not a fact about the machine.** The harness runs fine outside it. It
has now been run twice against your tree, by two different parties, both green:
`404 checks · 404 passed · 0 failed · 0 skipped`.

You were right to refuse to invent numbers you could not measure — that instinct was correct and
cost you nothing. But it means **your notes on disk now say something untrue**, and they must be
corrected as part of this round:

- `plans/work-orders/phase-2-attendance.md:1006-1012` — the "Implementation run — 2026-08-08" note.
- `TESTING.md:1681-1687` — the two `[ ]` lines whose stated reason is the sandbox.

Rewrite both to say what is actually true once you are done. If you still cannot launch a browser in
your sandbox this round, **say so plainly again and leave the boxes open again** — do not tick a line
on the strength of this paragraph. A tick you cannot point at your own evidence for is worse than a
blank box. What must not survive is the claim that the harness is broken.

---

## ❌ Finding 1 — a `TypeError` on a reachable teacher action (Acceptance lines 6 and 7)

This is the failure. The verifier reproduced it against your working tree and it is a regression
your refactor introduced. Quoted verbatim:

> `src/attendance.js` throws a `TypeError` on a reachable, ordinary teacher action: **filter the grid
> to one mark, open a row's detail panel, then change that student's mark.** I reproduced it against
> the working tree — it is a regression introduced by this refactor, not a pre-existing fault.
>
> **`paintDetail()` is handed a totals map that no longer contains the student it is drawing.**
>
> The chain, all in `c:\dev\planbook\src\attendance.js`:
>
> - `:3054` — `paintRenderedTotals()` rebuilds `const students = visibleStudents(cls)` **after** the write has landed.
> - `:2067` — `visibleStudents()` membership is `readingOf(record, s.id) === filterCode`, so a student whose mark just changed away from the active filter drops out of that list.
> - `:2880-2885` — `totalsForRender()` keys its `year` / `selected` Maps **only** over the students passed in.
> - `:3062` — that map is passed to `paintDetail(totals)`, whose row is still in the DOM (`setMark` deliberately does not rebuild the tbody, `:1533`).
> - `:3115` — `const year = totals.year.get(student.id);` → `undefined`.
> - `:1189` — `countText()` does `totals[mark.code]` → **`TypeError: Cannot read properties of undefined (reading 'P')`**.
>
> Reproduction output (headless, real build, roster of two, filter `A`, detail open on the absent student, mark corrected to `P`):
>
> ```
> "threw":      "Cannot read properties of undefined (reading 'P')"
> "panelAfter": "(none)"                                              <- panel vanishes
> "rowTotals":  "Term dates not set · Year · P 0 · T 0 · A 1 · E 0 · D 0 · 0%"   <- stale
> "threw2_unconfirmAll": "Cannot read properties of undefined (reading 'P')"
> ```
>
> Collateral, because the throw escapes `setMark` at `:1539`: everything after it is skipped —
> `paintPasses()` (`:1544`, the "Return button still sitting beside a student the teacher has just
> dismissed" the comment there warns about) and the `announce()`. The document write itself is safe;
> the ledger was correct after the crash. `unconfirmAll()` (`:1634`) fails identically.
> `untakeClass()` does not, because `paintDetail`'s state guard returns first.
>
> Before the refactor, `paintDetail()` called `attendanceTotals(cls.id, student.id)` directly and
> could not miss. The map lookup is new.
>
> **Fix shape:** `paintDetail` must not depend on the shared map holding the student — either fall
> back on a miss (`totals.year.get(id) || totalsFrom(totals.yearRecords, id)`, still one fold, not a
> ledger walk), or build the map over a set guaranteed to include `detailFor`. The same miss silently
> leaves filtered-out rows stale at `:3057-3061`.

Note the last sentence: **the stale row at `:3057-3061` is a second symptom of the same miss**, and it
does not throw — it silently displays a wrong number. Fix both, not just the crash.

The fix shape is the verifier's suggestion, not a specification — but whichever route you take, the
Traps in the original work order still bind. A fallback must not become a second ledger walk, must
not be a cache that outlives the render, and must not rebuild the precedence rule.

## ❌ Finding 2 — the before/after measurement (Acceptance line 3)

> **Before/after, two numbers — ❌** Neither number is on disk. The work order
> (`plans/work-orders/phase-2-attendance.md:1006-1012`) and `TESTING.md:1681-1687` both say "not
> obtained / blocked in this sandbox". **That is false here** — I ran the harness and got the
> *after*: `MEASURE | renderAttendance() at 875 records / 175 meetings / 27 rows | 17.20 ms median |
> [14.5 … 20]`. The *before* was never taken on this tree; 76 ms came from an earlier tree by an
> unstated method, so it is not "taken the same way both times". Note the timing block **cannot**
> produce a before figure as written: `verify-shell.mjs:9137` calls `a.resetMeetingDatesCallCount()`,
> which does not exist pre-refactor, and the throw discards the nine samples collected two lines
> above. Return the samples before touching the seam (or wrap it), run it against
> `HEAD:src/attendance.js`, record both.

That last point is the actionable one and it is a defect in **your harness**, not only a missing
number: the timing block as written cannot be pointed at the pre-refactor code, because it calls a
function that only exists after your change, and the resulting throw discards the samples it had
already collected. Make the timing block survive being run against `HEAD:src/attendance.js`, then
take both numbers the same way and record them.

Report all three figures: your before, your after, and whether your before agrees with the recorded
76 ms. **If it does not agree, say so plainly rather than reconciling it** — the 76 ms was taken on
an earlier tree by an unstated method, and a shifted baseline is information, not a discrepancy to
hide. The work order's Acceptance line asks for two numbers taken the same way as each other, which
is a requirement about your two, not about matching a historical figure.

## ❌ Finding 3 — the harness cannot express the defect (this is why the first round went green)

Not a numbered Acceptance line, and the most important thing in the report. Verbatim:

> **Every check of the shared-pass path runs with `filterCode === 'all'` and an empty search box** —
> the one configuration in which `visibleStudents()` is invariant under a mark change and the map can
> never miss. The harness's own repaint check (`verify-shell.mjs:9141-9152`) marks a student with no
> filter set, so the defect is invisible to it by construction. Seventy-nine-style green.
>
> Second: the WO-2.13 fixture's term is `2026-01-01 … 2026-12-31`, spanning all 175 meetings, so term
> totals equal year totals — a swap of the `year` and `selected` maps in the detail panel would read
> identical. WO-2.4's dated-term check breaks that assumption for the class line and the row line, but
> **nothing anywhere asserts detail-panel numbers against expected values**; the only detail assertion
> (`:9145`) is `before ≠ after`.

**A check that cannot fail is not evidence.** Your added checks passed on a tree containing a crash,
which means they were not testing the thing they are named for. This round must close all three gaps:

1. A check that **marks a student under an active filter with the detail panel open** — the exact
   sequence in Finding 1 — and that would have gone red on your first-round tree.
2. A check that a **filtered-out row's totals are not left stale** after such a mark.
3. A detail-panel check that asserts **expected values**, under a term window that does **not** span
   the whole year, so that a `year`/`selected` swap reads red rather than identical.

Also cover `unconfirmAll()`, which the verifier found fails identically.

---

## What was ✅ and must not regress

Do not touch these while fixing the above. They were verified green and are not in dispute.

1. **Byte-identical totals** — all four full return objects match WO-2.4's recorded values exactly
   (`E` → 100%, `U` → 90.9090909090909, no-marks → 100%, zero → `percent: null`). `totalsFrom()`
   (`:1161-1172`) is character-identical arithmetic to the old `attendanceTotals()` body. Keep it so.
2. **The eleven WO-2.4 checks, unmodified** — the verifier diffed the block against `HEAD` and it is
   byte-clean. **Do not edit that block this round either.** Add checks additively.
4. **`meetingDates()` called a constant 2 times per dated-term render**, counted at the seam.
5. **`stateOf()` and `readingOf()` remain single copies.** Its `[x]` tick was confirmed true.

Two smaller notes from the report, neither a failure, both worth your attention while you are in here:

- You wired `paintRenderedTotals()` into `dropClass()` (`:1742`) and `undropClass()` (`:1760`), where
  nothing repainted totals before. The verifier called this "defensible, but no acceptance line covers
  it." Keep it if it is correct, but **say in your report why it is right** — an unasked change with no
  check behind it is how scope creeps.
- The perf block calls `setMark`, which persists the 875-record fixture doc, while its restore
  (`:9139-9140`) is in-memory only. Harmless today because the profile is a throwaway `mkdtemp` and no
  later check reloads — "a landmine if a reload is ever added after it." Worth closing while you are
  editing that block.

---

## Verification, and what to report

```
node tools/verify-shell.mjs      # must be green, and must now contain checks that could have failed
node tools/wo-sweep.mjs
```

`wo-sweep` currently returns 11 checks, 10 pass, 1 `REVIEW` — sensitive field names outside
`src/backup.js`, 172 pre-existing mentions. That REVIEW line is **pre-existing and not yours**; the
verifier grepped your diff and confirmed you added no accommodation, medical, plan, IEP or 504
mention. Leave it alone and do not attempt to "fix" it.

Report against **all seven** Acceptance lines again, not only the three that failed, and state for
each whether you verified it this round or are relying on the previous round's verdict. For the
three ❌ lines, say specifically what changed and which new check would have caught the old defect.

**Acceptance line 7 is 👤 and stays `- [ ]` whatever you do.** It needs a real iPad. The desk-side
half of it is now yours to automate; the human half is not yours to close.
