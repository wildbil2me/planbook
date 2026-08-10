# WO-3.5 — correction round 1

**Verdict from the verifier: FAIL.** Two defects, plus four things nobody wrote and four comments that
lie about them. Eight of the ten Acceptance lines verified clean by driving a browser, so the screen
you built is largely right — **do not rebuild it.** This is a repair, not a second attempt.

**Read `.claude/dispatch/WO-3.5-brief.md` first if you have not.** It is unchanged and still governs.

**Context you need:** through an orchestration error of mine, two implementers built this work order
concurrently — one wrote `src/scores.js` and `src/scores.css`, the other wrote `index.html`,
`src/shell.js`, `src/views.js` and `sw.js`. They converged because both lifted the mockup and
`plans/gradebook-surfaces.md`. **Both defects below are seams between the two halves**: each is a place
where one implementer's file asserts something about a file the other one owned, and nobody opened the
third file that both were talking about. You are now the only agent on this work order.

---

## ❌ Defect 1 — the score grid has no door. It is unreachable from the running app.

The verifier's finding, verbatim:

> `src/screen-nav.js:60` still reads:
>
> ```js
> { view: 'scores', label: 'Scores', pending: 'Entering scores is not built yet.' },
> ```
>
> `segment()` (`src/screen-nav.js:102-110`) returns early on a truthy `pending`, so the Scores button
> ships **disabled, with no `data-class-screen` attribute**. `src/shell.js:671-672` is the only caller
> of `showClassScreen()`, and that hook is the only route into `#scoresView`; `src/views.js:83`'s
> `REMEMBERED_AS` collapses the stored view to `class`, so boot cannot land there either.
> `index.html:900-902` deliberately removed the drawing's second door — "the switcher two inches above
> already goes there."
>
> Driven, not read: with a class open, the strip renders `class:ok, assignments:ok` and a disabled
> `Scores` carrying `title="Entering scores is not built yet."`.
>
> This is the concurrency seam, and it is in the comments. `index.html:867-870` asserts:
>
> > src/screen-nav.js's Scores segment stops being disabled because this view exists — **nothing in
> > that file changed for it.**
>
> and `src/screen-nav.js:51-55` had promised the mechanism that would make that true — "`enabled` is
> asked of src/views.js rather than stored." It never was. `pending` is a hardcoded string. The
> implementer who wrote `index.html` trusted a comment in a file neither of them opened.

**Until this is fixed, no acceptance line is reachable by a teacher.**

Fix it, and note there are two ways: drop the `pending` string, or **make `enabled` the question
`src/screen-nav.js:51-55` says it already is** — asked of `src/views.js` rather than stored. The second
is what that header promises and it is why `index.html`'s claim was reasonable. Prefer it if it is
genuinely as small as it looks, because it makes WO-3.7 (`detail`) land without touching this file
either, which is the whole point of the design. If it is not small, drop the `pending` string and
**correct `src/screen-nav.js`'s header comment** so it stops promising a mechanism that does not exist.
Do not leave the comment and the code disagreeing a second time.

## ❌ Defect 2 — Acceptance line 8: moving an assignment between categories does not update displayed grades.

The verifier's finding, verbatim:

> Driven with the assignment editor open over the grid, moving *HW One* (10/10) from Homework(20) to
> Tests(50):
>
> ```
> before: 87.0%B   chips ["Tests 50%","Quizzes 30%","Homework 20%"]
> after : 87.0%B   chips ["Tests 50%","Quizzes 30%","Homework 20%"]
> engine: 84.88636363636364 / B
> ```
>
> The engine moved; the screen did not. Root cause: there is **no `afterAssignmentChange()` chain** in
> `src/shell.js`. `src/assignments.js:837` `setAssignmentCategory()` ends at `renderAssignments()`.
> Compare `src/shell.js:380-403` (`afterCategoryChange`) and `src/shell.js:423-425`
> (`afterLetterScaleChange`), both of which carry
> `if (views.currentView() === 'scores') scores.renderScores();` with long comments about exactly this
> staleness. Every assignment mutation — move, rename, points, delete, reorder, duplicate — is missing
> from that pattern.
>
> What *does* work, and I drove it: a move made on the assignment list is correct on the grid the next
> time the grid renders (87.0%B restored). So the arithmetic follows the move; the **displayed** grade
> does not follow it *immediately*, which is the word the box uses and the reason the box exists
> separately.

Build `afterAssignmentChange()` in `src/shell.js`, shaped like `afterCategoryChange()` immediately
above it, and call it from the assignment mutations in `src/assignments.js`. **The category move at
`src/assignments.js:837` is the minimum** — that is the box — but the verifier is right that rename,
points, delete, reorder and duplicate have the same staleness, and points in particular changes every
grade in the class. Cover them.

**Do not widen this into a refactor of `src/assignments.js`.** Add the chain and call it.

The number that discharges this box, from the other implementer's own analysis: moving case 1's `a1`
from Tests to Homework should take a displayed **87.0% → 86.7%**. The verifier's independent drive got
`87.0% → 84.886%` on a different move. Either way, **the displayed figure must change on the keystroke**,
and neither is a weights change — which is the entire reason this is its own box.

---

## Four things nobody wrote — and four shipped comments that say otherwise

The verifier called this out as worse than the defects in one respect, and I agree:

> **No harness checks and no `TESTING.md` entries were written — and three shipped comments assert that
> both exist.**
>
> - `src/scores.js:24` — "*`Esc` … tools/verify-shell.mjs presses it mid-column.*" It does not. No check
>   in that file touches this screen.
> - `src/scores.css:200-202` — "*The pair is asserted in one check in tools/verify-shell.mjs, on both
>   pointers, so the width and the offset cannot drift apart in a later edit.*" There is no such check;
>   the width and the offset can drift apart tomorrow.
> - `src/scores.js:388` and `src/scores.css:280` — "*the keypad … is a 👤 line in TESTING.md*".
>   `TESTING.md`'s last Phase 3 section is WO-3.3 at line 2149. There is no WO-3.5 section.
>
> A comment that names a check which does not exist is worse than silence: the next reader stops
> looking.

**3a. Write the harness checks in `tools/verify-shell.mjs`.** The verifier named the minimum set: the
25-down-a-column path · `Enter` at the bottom · the three flag fills as computed style · the cleared
key's absence from the document · the weights crossing 100 **in both directions** · the category move ·
the frozen-column width/offset pair that `scores.css:201` already claims is asserted.

**Read this next paragraph before you write a single check.** It is the most valuable thing the
verifier found and it will silently defeat you:

> **What would have to be true for a bug on this screen to be invisible? The screen would have to be
> hidden — and it is.** `verify-shell.mjs:10523-10538` measures
> `document.querySelectorAll('button, input, …')` and skips anything with `display: none`; `.hidden` is
> `display: none !important` (`src/shell.css:70`). Nothing in the 537-check run opens `#scoresView` —
> and, because of defect 1, **nothing in that run can**. So the standing 44px sweep walked straight past
> ~240 score inputs and reported green. That is the same shape as the backup-nag escape: a green run
> over a fixture that cannot express the failure. I broke it by forcing the view open under an
> asserted-coarse pointer before measuring.

So: **the coarse-pointer pass must open this view first**, or it keeps measuring nothing and reporting
green. A check that cannot fail is not a check. `window.planbook.scores` was added at
`src/shell.js:1620-1627` to make the stored document readable from the harness and **nothing reads it** —
that is your seam for the cleared-key check.

**3b. Write the `TESTING.md` § WO-3.5 section.** None exists; the last Phase 3 section is WO-3.3 at line
2149. Follow the established voice and structure. It owes at least the 👤 lines the code already refers
to: the iPadOS decimal keypad, the 96px column under a thumb, the frozen column under momentum scroll,
and landscape usability. **Mark them 👤 and leave them `- [ ]`** — you do not have an iPad, and the
owner ticks those.

**3c. Correct the four lying comments** — `src/scores.js:24`, `src/scores.js:388`, `src/scores.css:201`,
`src/scores.css:280`. Once 3a and 3b land, most become true; make each one true or delete the claim. Do
not leave a comment pointing at a check you did not write.

**3d. One prose disagreement, minor and non-blocking:**

> `src/scores.css:179-182` says the name cell "*is a `<th scope="row">` and not a `<td>` — src/scores.js
> builds it that way*". `src/scores.js:643-647` deliberately builds a `<td>` and explains why. The rule
> names both, so nothing renders wrong; the two files simply disagree in prose about the markup between
> them.

Make them agree. The `<td>` is what ships and it has a stated reason; fix the CSS comment.

---

## What the verifier confirmed is right — do not "improve" any of it

Eight lines verified by driving a browser, not by reading: 25 scores in 25 keystroke-groups with the
stored map checked against **drawn row order** rather than roster order · `Enter` at the bottom holding
its place with a live-region announcement · the three flag states distinct four ways (fill, border,
glyph, `aria-label`) · clearing removing the key *and* the empty column key · live recompute matching
`docs/grade-math-cases.md` case 1 · **`Esc` pressed twice mid-column** losing nothing, held by there
being no binding at all · the weights banner naming the total with "provisional" appearing nowhere ·
and line 10's crossing driven in **both** directions, the disappearing half first.

Also confirmed clean and not to be disturbed: the reported `scoresSummary`/`scoresTotals` swap **did not
happen**; all fifteen ids resolve. Paste-a-column (WO-3.13) is correctly absent. No clock is read, so
WO-3.6's territory is untouched. No support data on the screen. `sw.js` bumped `v39 → v40` correctly.
The surface is a view in `<main>`, not a modal.

---

## Verification before you report

```
node tools/verify-shell.mjs      # was 537/537; it must be green AND larger than 537
node tools/wo-sweep.mjs          # 13 pass / 0 fail / 2 REVIEW, both already read and answered
```

The two REVIEWs are expected and were adjudicated by the verifier: the `src/scores.js:65` hit is prose
saying no support data appears on this screen, and the six container selectors are not touch targets
(21 controls measured, none under 44px). Do not "fix" either.

**If `verify-shell.mjs` cannot launch a browser, say "could not run" explicitly** and name it as needing
a human. Do not report it green and do not report it as a code failure.

You may tick boxes your own run actually closed. **Never tick a 👤 line.** Leave `CHANGELOG.md` to the
teacher. Do not widen the work order — anything outside its Deliverables is a proposed follow-up in your
report.

**Append to `.claude/dispatch/WO-3.5-status.md` as you go**, and **write your report to
`.claude/dispatch/WO-3.5-result.md`** as your last act, replacing what is there. Report against all ten
Acceptance lines and against each numbered item above.
