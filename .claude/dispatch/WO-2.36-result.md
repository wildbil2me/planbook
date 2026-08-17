# WO-2.36 — retiring a key correctly turns both key checks red · result

**Written by the main thread, not by the implementer.** The implementer that did this work was
killed before it reported, and the orchestrator that spawned it was killed with it. The tree it left
was complete; the result file was not written. This file records what the work is and, separately,
what was **re-run from scratch** afterwards to establish that the implementer's prose described runs
that actually happened.

**Read the provenance of every number below.** The runs in § "Re-run evidence" are this thread's own,
executed locally on 2026-08-16 after recovery. The implementer's own claimed runs are in
`TESTING.md` § WO-2.36 and `tools/README.md`; where the two overlap they agree, and the one apparent
mismatch is explained at the foot of this file.

---

## The decision, which is Deliverable #1

**The counts are gone from both key checks, and nothing replaced them with another number.** Each
check carried three floors copied off the tree the day it was written — `bound.length >= 8 &&
glyphs.length >= 8 && rows.length >= 7` on the score grid, `>= 9 && >= 9 && >= 8` on the marking
screen. In their place, each block asserts **its anchors found, one by one, by name**: the panel id,
the `</div>`, `KEYS_MODAL`, the id it names in `index.html`, the `<dl>`, the class-view guard,
`MARK_KEYS`, and each regex having matched at all. Failures print under `NOTHING TO COMPARE`, one
reason per side, most upstream first.

The reasoning is written into both blocks in their own words — `tools/verify-shell.mjs:371-422` is
the long form where the score grid's counts stood; the marking block states it in the last paragraph
of its header. Neither points at this work order to explain itself, which Acceptance line 3 required.

**Why no count survived, in one line each:** the legend's own row count is the thing under test and
agrees with itself at zero when the id goes; `Object.keys(GLYPH_OF)` is a table this harness
maintains, which is the exact defect `stray` was corrected for at WO-3.22; a number parked in a doc
is a second hand-maintained copy in a file nothing executes. And the count was never what caught
anything — the two-way comparison already catches every *partial* loss by name, in both directions.
The only case it cannot catch is both sides reading nothing, which is never a matter of degree but an
anchor gone from the tree.

`body.length < 200` is the one number left in either block, on a ~1.9 kB slice. It separates "the
anchor moved and this is the empty string" from "the function is here"; deleting keys cannot come
near it, so nobody is ever asked to edit it.

## Files changed

| File | What |
|---|---|
| `tools/verify-shell.mjs` | Both floors replaced by the `vacuity` anchor guard; both blocks' decision comments; `:NNN` cross-references re-pointed after the insertions moved them |
| `TESTING.md` | New § WO-2.36; two `:NNN` references corrected |
| `tools/README.md` | WO-2.36 paragraph; one `:NNN` reference corrected |
| `plans/work-orders/phase-2-attendance.md` | Status row, Acceptance boxes with evidence |

`git diff --stat -- src/ index.html` is **empty**. No call site was added, so `tools/README.md`'s
asserted count stays 805 and the run still prints 802.

---

## Re-run evidence — this thread's own runs, 2026-08-16

Four full runs at ~4.4 min each. Every mutation was reverted with `git checkout --` and the revert
confirmed with `git diff --stat -- src/ index.html` before the next was applied.

**Baseline, delivered tree.** `802 checks · 802 passed · 0 failed · 0 skipped`, 21,833 lines,
27.2 lines per check, **261s**, exit 0. *(Acceptance 4.)*

**Retire a key on both sides — `'D'` out of `MARK_KEYS` at `src/shell.js:1617` and the Dismissed row
deleted from `index.html:2440-2443`.** The marking key check reports **PASS**:

```
8 key(s) answered below the class-view guard [ArrowDown ArrowUp Escape ? P T A E]
  against 7 legend row(s) carrying [↓ ↑ P T A E Esc ?]
```

That is the exact 8-and-7 the old floor rejected. Run total `802 · 798 · 4`; the four red are the
readings a teacher genuinely loses when `D` stops marking Dismissed — the keyboard-marking sequence,
the selection advance, the focus ring, and the `?` list naming four letters instead of five.
**Neither key check is among them.** *(Acceptance 1 — the case that was red before this row.)*

**`MARK_KEYS` renamed to `MARKING_LETTERS` at both use sites** — an edit that leaves the app working.
`802 · 801 · 1`, exactly one failure, and its counts are **9 and 8, unchanged from the green tree**:

```
NOTHING TO COMPARE … src/shell.js has no `const MARK_KEYS = ['…']` — the letters below are
only whatever the by-shape list read found, and the glyph map was built from nothing
```

This is the run that shows the replacement is **strictly better than what it replaced**, not merely
equivalent: at 9 and 8 the old floor passed, and the only thing that went red was `unmapped`, whose
message sent the reader to edit `GLYPH_OF` — the wrong file. *(Acceptance 2, first of two.)*

**Modal id renamed in `index.html` alone.** `802 · 799 · 3`, marking check red at **0 legend rows**,
naming its own anchor:

```
NOTHING TO COMPARE … index.html has no `id="attendanceKeysModal"` — src/shell.js opens a modal
the markup does not carry, or one of the two spellings was renamed alone
```

Score grid stayed green, correctly — that mutation is on the marking side only. *(Acceptance 2,
second of two.)*

**Line references checked mechanically.** All six cited numbers land on their exact block
boundaries: `:281`/`:333` open and close WO-2.35's read-width comment, `:363`/`:369` the `stray`
scar, `:371`/`:422` the new WO-2.36 decision block. This was the failure mode the brief flagged as
the one this row is about.

## The one apparent mismatch, resolved

`TESTING.md` and `tools/README.md` report `802 · 798 · 4` for the modal-id mutation; this thread
measured `802 · 799 · 3`. **Both are right.** The implementer ran the modal-id rename *and* the
requoted `scores-key` spans in a single run, turning **both** blocks red. This thread ran the modal
id alone, so the score-grid check stayed green and one fewer check failed. The delta is exactly the
one check, in the expected direction.

Timings differ by a second or two run to run (261s here against the 263s recorded); that is noise.

## Verification outcome — PASS, with one correction taken

The `work-order-verifier` ran after this file was first written and returned **PASS** on all four
Acceptance lines. It did not take the runs below on trust: it replicated both `check()` predicates
into a scratchpad and drove them against **in-memory mutations of the real `index.html` and
`src/shell.js`**, leaving the repo untouched. That reproduced the baseline and every mutation above,
added a fourth vacuity mutation nobody had run (`handleScoreKey` renamed → red at 0 bound), and
confirmed partial losses are named in every direction it could construct.

**One prose defect was found and corrected before commit rather than booked.** The marking block
claimed *"Every PARTIAL loss is caught by name in one direction or the other."* That is false there:
`markKeys` is read **file-wide** out of `src/shell.js` rather than out of the listener slice, so a
`MARK_KEYS` left *declared* while the listener stops testing it keeps all five letters in `bound` and
reads 9 against 8 — green, with keyboard marking dead for the teacher. Two things kept it off the
failed list, both checked rather than assumed: the **retired floor was equally green on that tree**,
so Deliverable #2 is intact and this is no regression; and the underlying gap is `Out of scope` by
name, being WO-2.35's question of which bindings the read can see at all. The score-grid twin is
true as written, because there list keys only enter `bound` when membership-tested *inside* the slice.

The claim is now scoped to `bound` and the residue named, in all three places it appeared —
`tools/verify-shell.mjs`, `tools/README.md`, `TESTING.md`. A second, smaller correction: the comment
asserting `` `bound.length >= 8` IS NO LONGER IN THE FILE `` sat seven lines below that exact string,
and now reads "no longer a guard anywhere in this file". Neither edit changes a predicate.

This matters beyond tidiness because `tools/verify-shell.mjs:291-292` — five lines from one of these
claims — says *"a mitigation cited for a case it does not cover is worse than none, because it stops
the next reader looking."* Shipping a false coverage claim in the row whose thesis is that a comment
pointing the wrong way is a defect would have been the WO-2.35 defect re-committed.

**Two follow-ups booked** (2026-08-16, rows #56 and #57):

- **WO-2.38 — nothing exercises the anti-vacuity guard.** On a green tree every branch of `vacuity`
  is dead code; nothing in either tool reaches a push site, so the guard can rot behind `802 · 802 ·
  0`. Sized M for the design question it carries: a self-test driving the same predicates brushes
  against "do not write a second harness," and the row decides that explicitly.
- **WO-2.39 — four `:NNN` references in `tools/README.md` miss by ~3,200–3,500 lines.** Already
  stale at HEAD, so inherited debt rather than this row's doing, though this row added 145 lines to
  it. One reference has no obvious referent, and the row asks whether the class should be swept
  mechanically rather than paid down once.

## Status of the pipeline

**The pipeline completed, out of order.** Orchestrator and implementer ran in the killed session;
the main thread recovered and re-ran the harness; the `work-order-verifier` then gave the cold read
it exists for. The main thread's re-runs were *claim-checking against a known expected answer*, not
a cold read — which is why the verifier was still worth spawning, and why it found something the
re-runs did not.

**The division of labour was forced and is worth recording.** The browser harness does not run
sandboxed, so a verifier subagent cannot produce a `802 · 802 · 0`; a subagent reporting "could not
run" has reported an environment rather than a result. It worked around that by **replicating the
predicates rather than running the tool** — which turns out to be a better check for this row than a
full run would have been, because on a green tree the guard under test is inert and a green run
proves only that it does not false-positive.

**Maintenance protocol, run after the verifier passed:** the status row in
`plans/work-orders/phase-2-attendance.md:3484` now reads `✅ DONE — 2026-08-16`. **No roadmap box
moves** — the row declares harness-not-app, the same call WO-2.34, WO-3.12, WO-3.21 and WO-3.24 made,
and `wo-gate.mjs --audit` confirms every dashboard row still matches its own boxes. `wo-gate.mjs
next` now clears WO-2.37. `plans/work-orders/README.md` gained rows #56 and #57 for the two
follow-ups, with the placement argument written out; WO-1.16, WO-3.18 and WO-G2 each moved down two.

`CHANGELOG.md` is untouched by convention — the teacher decides what a change means.

**Nothing here is a 👤 item.** This row is harness-only; `src/` and `index.html` are byte-identical
across the whole work order, so there is nothing for an iPad to show.
