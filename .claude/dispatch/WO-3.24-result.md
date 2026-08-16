# WO-3.24 — result

## Flagging this up front, as the brief required

**The measurement went red on a row that was already there — the `← →` row from WO-3.16 — at 390px,
on the clean, unmutated tree, with no lengthening of any kind.** The brief's routing decision said
this is the one path where its tier assumption stops holding, and said to report it before rewording.
I did reword it (the work order's own text puts that in scope and says a check landing red with no
remedy in its own scope is a harness left failing — Acceptance 4 requires `verify-shell.mjs` to pass
whole, which it cannot do while a real, undisputed spill sits unresolved). But the finding itself,
not just the fix, is the thing to weigh: **this is not the "nothing spills today" case the work order
was booked under.**

This does **not** contradict the owner's 2026-08-16 iPad sitting. No iPad is 390px wide (the smallest
iPad portrait is far wider), so "clean on the installed iPad, both orientations" and "spills at 390px
in a headless emulator" are two different claims about two different widths. But 390px is one of the
exact two widths this work order's own Deliverable and Acceptance line 1 name, so it is squarely
inside what I was asked to measure, not a width I chose.

There is a second thing worth flagging with equal weight: **the first draft of the per-row check,
which read the work order's own words literally (`scrollWidth` against `clientWidth` on each row),
was vacuous — it could not have caught anything, ever, on this markup.** `.scores-key` is an
unconstrained `inline-flex` chip with no width or max-width of its own, so it always grows to fit its
own content; a row's `scrollWidth` and `clientWidth` are definitionally equal no matter how long the
text inside it is. I only found this because Acceptance 2 requires running the mutation rather than
reasoning about it — the mutated row measured `1678/1678` and the first-draft check stayed green. I
corrected it to compare each row's `scrollWidth` against the **panel's** available content width
instead (the number a row can actually fail to fit inside, and what the work order's own *Why it
exists* paragraph — "pushes through its own border" — actually describes), and it is that corrected
check that then found the real `← →` spill above. Full pixel figures for every stage are in
`tools/README.md`'s new WO-3.24 paragraph and in `TESTING.md` § WO-3.24.

## Acceptance, one by one

**1. The ⌨ Keys panel is opened through its own button and every `.scores-key` in it is measured, at
390px and 1024px under a coarse pointer.**
Done and verified. `tools/verify-shell.mjs` clicks `#scoresView [data-scores-keys]` (the real button,
not a `.hidden` removal), then reads `aria-expanded` on the button and `#scoresKeys`'s own `.hidden`
class as independent evidence the click landed, guards a plausible row count (`>= 7`, actual 8), then
measures at 1024px (the state the block was already at) and again at 390px, reached by resizing the
emulated viewport rather than reloading — a reload would drop `keysOpen` (a module variable, not a
stored preference) back to `false`, and I wanted one open through the button, not two. `#scoresKeys`'s
own `scrollWidth`/`clientWidth` is read and reported in every detail string as context, never
asserted on its own, per the Traps line. Ran and read myself: yes.

**2. Lengthening one row until it spills turns a check red and names that row — run, not reasoned,
with the counts before and during quoted.**
Done, and it took three runs to land honestly rather than one, because the first two runs are what
found my own bug:
- **First draft of the check, `↵` row stretched to 1678px in a 942px panel:** `799 checks · 799
  passed · 0 failed · 0 skipped` — vacuous, reddened nothing, because the check compared each row to
  its own (always-equal) `clientWidth`.
- **Corrected check (row vs. panel's content width), same mutated tree:** `799 checks · 797 passed ·
  2 failed · 0 skipped`, naming the mutated `↵` row at both widths (`1678/918` at 1024, `1678/304` at
  390) and, at 390px only, `← → across the row, once the caret runs out of number in that direction`
  beside it (`470/304`).
- **Mutation reverted, corrected check re-run on the clean tree:** `799 checks · 798 passed · 1
  failed · 0 skipped` — the one failure is that same pre-existing `← →` row, alone, `470/304` at
  390px. This is the run that proves the second finding above was real and not an artifact of the
  first mutation.
I quote all three counts, not just "before/during", because the honest sequence has three states, not
two — a mutation that reddened nothing on its first try is exactly the kind of vacuous check Acceptance
2's own closing sentence warns against, and reporting only the corrected run's numbers would have hidden
that I built the vacuous version first.

**3. Reverted, and `git diff` carries no trace of the mutation.**
Done. `git checkout -- index.html` against the mutated tree, then `git diff -- index.html` confirmed
empty, before the real (separate, retained) `← →` reword was made on the clean file. Current
`git diff -- index.html` contains only the reword and two comment updates — no "WO-3.24 TEMP MUTATION"
string anywhere. Verified by reading the diff directly, quoted in full below.

**4. `node tools/verify-shell.mjs` passes whole on the delivered tree, with the check count in
`tools/README.md` moved in step.**
Done. Final run on the delivered tree (index.html reworded, verify-shell.mjs with the corrected
check): `799 checks · 799 passed · 0 failed · 0 skipped`, 21,410 lines, 26.8 lines per check, 263s —
against `795 · 795 · 0 · 0` before this work order. `tools/README.md:817`'s call-site sentence moved
798 → 802 (`node tools/wo-sweep.mjs`'s own count, not arithmetic — confirmed by running it), and a new
narrative paragraph after the WO-3.23 entry records the vacuous-first-draft finding and the mutation
table. `node tools/wo-sweep.mjs` is green: `20 checks · 18 passed · 0 failed · 2 to review`, the same
two standing REVIEW lines as before this work order touched anything (I chased down and fixed a
transient third — my own draft comment used the word "supports" as a verb and collided with the
accommodation-data grep; reworded the comment to avoid it, confirmed the REVIEW count back to 297).

**5. 👤 If the check went red on a row that was already there, the reworded row is read on the
installed iPad in both orientations before the box above is ticked.**
**Not ticked, and cannot be from here — no iPad available to this dispatch.** The check *did* go red
on a pre-existing row (see above), which is exactly the condition this line exists for. I have not
read the reworded `← → across the row — → end, ← start` on glass in either orientation. This is a
real, outstanding, human-only item, not a formality — the row that needs eyes is precisely the one a
human already looked at once and found clean, under different wording. Left `[ ]` in both `TESTING.md`
and `plans/work-orders/phase-3-gradebook.md`.

## What I built, concretely

Four new checks in `tools/verify-shell.mjs`, inserted directly after the WO-3.5 fixture's existing
coarse-pointer block (reusing its already-open, already-coarse score grid rather than planting a
second fixture, since the ⌨ Keys button only becomes visible once a class/term/roster/assignment all
exist):
1. The panel opens through its own button (`aria-expanded`, `.hidden`, row-count guard).
2. Every row fits at 1024px — measured as `row.scrollWidth` against the **panel's** available content
   width (`clientWidth` minus its own left/right padding), not the row's own `clientWidth`.
3. The pointer is still coarse after resizing to 390px (guards the resize actually taking effect).
4. Every row still fits at 390px, same comparison.

The container's own `scrollWidth`/`clientWidth` is reported in every detail string as context (and it
does move when a single row overflows, since `flex-wrap` can't shrink an item that doesn't fit even
alone on its own line — worth knowing, since it means the container figure is corroborating rather
than meaningless in this one failure shape), but it is never its own `check()`.

One legend row reworded in `index.html`: `← →`'s row now reads `across the row — → end, ← start`
(was `across the row, once the caret runs out of number in that direction`), keeping `→` paired with
the end of the number and `←` with the start — the asymmetry WO-3.16's own comment says any rewording
must keep visible. Two adjoining HTML comments updated: one that named `← →` as "already the longest
row here" (now false — `↑ ↓` at 297px is, with 7px to spare at 390px — corrected rather than left
stale) and the WO-3.16 comment, which now notes the WO-3.24 shortening and why.

`tools/README.md`: the call-site count sentence and a full narrative paragraph after the WO-3.23
entry, in house format, with every count copied from an actual run.

`TESTING.md`: a new `### WO-3.24` section after WO-3.23's, checkbox list matching Acceptance 1-5
(five ticked, one deliberately not), the desk-half summary, and a five-row mutation table.

`plans/work-orders/phase-3-gradebook.md`: Acceptance boxes 1-4 ticked with evidence inline, box 5 left
`[ ]` with the reasoning, and a new "Two ways the outcome differed from what this work order
predicted" note after the Traps paragraph — the original *Why it exists* / *Not a go-live blocker*
prose is left standing rather than rewritten, per the project's own convention that prose is a record
of what was asked and not something a later finding gets to falsify.

## What I did not do

- Did not touch `Out of scope` items: no restyling of the panel, no touching `white-space`, no work on
  the attendance key `<dl>` (WO-2.34's).
- Did not write a second harness or a new `tools/*.mjs` file — everything lives inside the existing
  `verify-shell.mjs`.
- Did not set the work order's `Status` line or tick any `plans/ROADMAP.md` box — per
  `.claude/agents/work-order-orchestrator.md`, that's `node tools/wo-gate.mjs --tick`'s job, run by the
  orchestrator after a verifier PASS, not mine.
- Did not touch `CHANGELOG.md`.
- Did not shorten `↑ ↓`'s row (297px, 7px of margin at 390px) even though that margin is tight —
  it currently passes, and the work order's scope is "the row that spills," not a preemptive tightening
  of a row that doesn't.

## Files changed

- `tools/verify-shell.mjs` — four new checks (+108 lines net), after the WO-3.5 fixture's coarse block.
- `index.html` — one legend row reworded, two adjoining comments updated.
- `tools/README.md` — call-site count 798 → 802, new narrative paragraph.
- `TESTING.md` — new `### WO-3.24` section.
- `plans/work-orders/phase-3-gradebook.md` — Acceptance boxes updated, new "outcome differed" note.

## Decisions I made that the work order didn't fully settle

- **Where to insert the new checks**: directly inside the existing WO-3.5 fixture block, after its
  coarse-pointer 44px checks, rather than a standalone fixture. Reason: the ⌨ Keys button is hidden
  whenever the score grid has no class/term/roster/assignment (`src/scores.js`'s `renderScores()`),
  so a self-contained fixture would have had to reconstruct most of what WO-3.5's already does. This
  matches the file's existing convention of piggybacking width-sensitive measurements onto an
  already-open, already-fixture-backed screen (see the WO-3.17 block doing the same for the
  Assigned/Due fields).
- **What "each `.scores-key`'s `scrollWidth` against `clientWidth`" means in practice**: I read it as
  "each row's `scrollWidth` against the available width it has to fit inside," not "against its own
  `clientWidth`," because the literal self-comparison is provably vacuous on this markup (see above).
  I flagged this explicitly rather than silently picking one reading, since it changes what the
  Deliverable's own sentence can be taken to mean.
- **Not rewording `↑ ↓` preemptively**, even at a 7px margin, since it isn't the row that spilled and
  the work order scopes the reword to "the row that spills."

## Commands run and read myself

- `node tools/verify-shell.mjs` — run to completion five times over the course of this dispatch (each
  one read in full, not just skimmed for the summary line): first-draft check (799/799 twice, once
  clean and once against the mutation — proving the vacuous bug), corrected check against the mutation
  (799/797/2), corrected check on the reverted tree (799/798/1, finding the real `← →` spill),
  corrected check with `← →`'s first reword attempt (799/798/1, still 35px over budget at 390),
  corrected check with the final reword (799/799/0, twice — once before and once after the unrelated
  `wo-sweep` comment fix). Final, delivered-tree number: `799 checks · 799 passed · 0 failed · 0
  skipped`, 21,410 lines, 26.8 lines per check, 263s.
- `node tools/wo-sweep.mjs` — run three times: baseline (`20 · 17 · 1 failed · 2 review`, the 1 fail
  being the stale call-site count before I updated `tools/README.md`), after my comment introduced a
  transient collision (`20 · 17 · 1 failed · 2 review`, 298 mentions), and final (`20 · 18 · 0 failed
  · 2 review`, matching the pre-dispatch REVIEW baseline exactly).

Every number above is copied from a run I actually watched exit, not predicted.
