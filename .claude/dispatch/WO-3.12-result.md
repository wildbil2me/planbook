# WO-3.12 — result

Harness- and doc-only work. `src/grade-engine.js` was mutated four times during verification and
reverted every time; the tree ends byte-identical to HEAD. All runs below are real runs I executed
and read the output of — no arithmetic substitutes for a summary line anywhere in this report.

## Acceptance, one by one

**1. A case with weights `40.1 / 34.7 / 20` asserts the message string reads `94.8%`, not `94.80000000000001%`.**
Met. Added as "case 8, third direction" in `tools/verify-shell.mjs` (calls the existing
`case8Fixture([40.1, 34.7, 20])`, does not touch the function) and as a third paragraph under
section 8 of `docs/grade-math-cases.md`. Passes on a clean tree; proof below.

**2. Reverting `formatWeight(total)` at `src/grade-engine.js:96` to raw concatenation turns that check red and leaves WO-3.4's thirteen green — run, not reasoned, with the counts before and after quoted.**
Met. Before: `595 checks · 595 passed · 0 failed · 0 skipped`. Mutated
`'The category weights total ' + formatWeight(total) + ...'` to
`'The category weights total ' + total + ...'`. During: `595 checks · 594 passed · 1 failed · 0 skipped`,
the one FAIL named `case 8, third direction: decimal weights totalling 94.8 read "94.8%", never
"94.80000000000001%"`, detail `"The category weights total 94.80000000000001%, so there is no grade
yet."`. WO-3.4's thirteen and every other check stayed green. Reverted; `git diff --stat
src/grade-engine.js` empty afterward.

**3. An assignment in a second class does not move the subject's grade, and dropping the `classId` filter turns that check red on its own.**
Met. Added case 13 (`c1`/`c2`, both term `t1`, both category `tests`; `a1` on `c1` is `34/40`, `a2`
on `c2` is `100/100`). Before: `595 · 595 · 0 · 0`. Mutated `assignmentsFor()` at
`src/grade-engine.js:35` by deleting `&& assignment.classId === classId`. During: `595 · 594 · 1
failed · 0`, the one FAIL named `case 13 (an assignment filed under another class)...`, detail
`class 95.71428571428572` (= 134/140, `a2` wrongly pulled in) against the expected `class 85`.
Nothing else moved. Reverted; diff empty.

**4. An assignment in a second term does not move the subject's grade, and dropping the `termId` filter turns that check red on its own.**
Met. Added case 14 (one class `c1`, `a1` on `t1` is `34/40`, `a2` on `t2` is `100/100`). Before:
`595 · 595 · 0 · 0`. Mutated the same function's `:36`, deleting `&& assignment.termId === termId`.
During: `595 · 594 · 1 failed · 0`, the one FAIL named `case 14 (an assignment filed under another
term)...`, detail `class 95.71428571428572`, the identical wrong value for the identical reason one
term over. Nothing else moved. Reverted; diff empty.

**5. A second student's cells do not move the subject's grade, and reading the first student's cell regardless of id turns that check red on its own.**
**Partially met — I am not ticking this one.** Added case 15 (one assignment, `scores: { a1: { s2:
{v:1}, s1: {v:34}, s3: {v:40} } }`, `s2` written first on purpose). The behavior claim — a second and
third student's cells don't move `s1`'s grade — is true and asserted, and passes clean:
`595 · 595 · 0 · 0`. But the mutation half does not isolate. I changed `scoreCell()` at
`src/grade-engine.js:41-42` from `byAssignment[studentId]` (guarded by `hasOwnProperty`) to
`byAssignment[Object.keys(byAssignment)[0]]` — reading whichever cell is first, regardless of the
requested id, which is exactly "reading the first student's cell regardless of id." During:
`595 · 590 passed · 5 failed · 0 skipped` — **five** red, not one: case 15 (`class 2.5`, matching the
hand-computed `1/40` if `s2`'s cell were read for `s1` — the prediction was exact) **and four checks
belonging to WO-3.5's score-grid section** (`the displayed grade is docs/grade-math-cases.md case 1
to the digit...`, `moving an assignment to another category moves EVERY displayed grade...`, `and
moving it back restores every displayed grade...`, `and the grades come back the moment the weights
reach 100 again...`).

I investigated rather than reported it as a pass, per the brief's instruction. The reason: WO-3.5's
harness fixture is a real, rendered 25-student class (`c_wo35` / `tm_wo35`), and its own acceptance
line 5 already asks `weightedClassGrade()` for one specific student's (`wo35-s20`) grade on the real
screen. `classId` and `termId` isolated cleanly because that fixture is single-class/single-term —
dropping either guard has nothing spurious to pull in from a document that has no second class or
term. `studentId` is different in kind: dropping it corrupts every student's cell in *any*
multi-student document, and a 25-student class is exactly that, so the same mutation that proves case
15 also breaks WO-3.5's pre-existing coverage of the identical argument, through a different path. I
do not believe a narrower mutation exists that both faithfully represents "drop the studentId lookup"
and spares WO-3.5's checks — any such narrowing would stop being the defect the Deliverables describe.
This is the WO-2.18 shape (a mutation reddening more than predicted because the harness was already
watching the same line from elsewhere), scaled up. Recorded in full — the exact five names, the exact
counts, the exact wrong value — in `tools/README.md`'s new WO-3.12 paragraph and in `TESTING.md` §
WO-3.12's mutation table, rather than smoothed into a one-line success. Reverted; diff empty
afterward.

**6. The new cases are written into `docs/grade-math-cases.md` with hand-computed expected values.**
Met. Case 8 gained a third paragraph (the `40.1/34.7/20` direction). New cases 13, 14 and 15 added at
the foot of the document, each with the JSON fragment, the hand-computed fraction, and the expected
value, in the same form as the existing twelve — which are unedited (`git diff` on that file adds
lines only; no existing case's text moved).

**7. `node tools/verify-shell.mjs` passes whole, and `node tools/wo-sweep.mjs` shows no new line.**
Met. Final run: `595 checks · 595 passed · 0 failed · 0 skipped`, `14,295 lines · 24.0 lines per check
· 194s`, exit 0. `node tools/wo-sweep.mjs`: `16 checks · 15 passed · 0 failed · 1 to review`, exit 0
— the same standing counts as before this work order (the one REVIEW line is the pre-existing
sensitive-field-name sweep, untouched here). One sweep line did need a same-commit fix to stay at
that count: `tools/README.md:636`'s recorded `check()` call-site figure (592) was stale the moment I
added four literal call sites, so the sweep's own "the recorded call-site count matches the harness"
line went red until I moved it to 596 — that edit is in `tools/README.md`, not a new line in the
sweep's output.

**8. `src/` is byte-identical to HEAD across the whole work order.**
Met. `git diff --stat src/grade-engine.js` returns empty after every one of the four reverts and
again at the very end; `git diff --stat src/` (whole directory) is empty right now. `node --check
src/grade-engine.js` passes.

## Files changed

- `tools/verify-shell.mjs` — one comment update in the grade-engine block's header (records that
  WO-3.12 is the follow-up the WO-3.4 comment named), plus four new checks: case 8's third direction
  (after the existing `case8balanced` check) and cases 13-15 (after `case12`, before the section's
  closing brace).
- `docs/grade-math-cases.md` — case 8 gained a third paragraph; cases 13, 14, 15 appended at the end.
  Cases 1-12 are untouched.
- `tools/README.md` — the running check-count line at `:636` moved 592 → 596; a new "595 at WO-3.12"
  narrative paragraph plus the honest-exception paragraph, in the style of the WO-2.21 entry above it.
- `TESTING.md` — new `### WO-3.12` section in Phase 3, with the two-column mutation table and the
  same honest-exception account, placed after WO-3.14 (the last existing Phase 3 entry).
- `plans/work-orders/phase-3-gradebook.md` — WO-3.12's own Acceptance checkboxes ticked for lines
  1-4 and 6-8; line 5 left unticked with an inline note pointing at the fuller account, for the reason
  above.
- `src/grade-engine.js` — touched four times during verification (three filter/format mutations plus
  the studentId-lookup mutation), reverted every time. `git diff` on this file is empty.

## What I could not verify / left undone

- No 👤 line exists for this work order and none was added — it is explicitly harness-and-doc-only,
  and the work order's own "Closes roadmap" note forbids inventing a product box for it.
- Acceptance line 5's mutation does not isolate to one check, as detailed above. I did not force a
  narrower mutation to manufacture isolation, because I believe any mutation that would spare WO-3.5's
  checks would no longer represent the argument this line is about. This is a judgment call; a
  different implementer might have tried harder to find a scoped mutation, or might have decided the
  coupling itself is disqualifying rather than acceptable-and-documented. I went with documenting it
  in full rather than either hiding it or blocking on it, since the underlying claim (studentId is
  load-bearing) came out proven, just not narrowly.
- I did not touch `tools/wo-sweep.mjs` itself — no new check was needed there; the one line it
  required (`tools/README.md`'s call-site count) was a doc fix, not a sweep change.
- `CHANGELOG.md` — left to the teacher, as instructed. A draft, if useful: *"Four more grade-engine
  test cases, closing gaps a mutation-testing pass at WO-3.4 found: a decimal-weight case that
  exercises the `formatWeight()` fix, and cases proving the engine actually filters by class, term
  and student rather than happening to get the right answer on fixtures too simple to tell. No
  arithmetic changed — src/ is untouched."*

## Decisions the work order didn't settle

- **Where to place the decimal-weight case.** The Deliverables say "extend WO-3.4's case-8 fixture,"
  which I read as calling the existing `case8Fixture()` function with new weights rather than writing
  a fresh fixture — done that way, and the existing `case8unbalanced`/`case8balanced` checks are
  untouched.
- **Where the new cases land in numbering.** I numbered them 13/14/15, continuing the existing
  sequence, and placed the decimal-weight variant as case 8's "third direction" rather than as its own
  numbered case, since it shares case 8's fixture function and its unbalanced-weight subject.
- **How to record acceptance line 5.** Discussed at length above — left unticked in both `TESTING.md`
  and the work order file itself, with the full mutation table and honest-exception paragraph standing
  in place of a tick.
