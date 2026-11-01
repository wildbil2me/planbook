# WO-3.79 — correction round 1

**Route**: Claude Opus, unchanged from round 1 (score-history version semantics are a convention and
judgment surface; see `.claude/dispatch/WO-3.79-status.md`). This is a **correction**, not a new
build: the original implementer's session is gone, so you are a fresh `work-order-implementer`
picking up its tree. The row reads `🔍 AWAITING VERDICT` and stays that way — do not run
`wo-gate.mjs --start`, `--release`, `--handoff` or `--tick`.

**Read first**, in this order:
1. `plans/work-orders/phase-3-gradebook.md` § WO-3.79 (line ~6120) **in full**. It was amended at
   15:31 on 2026-10-31 (uncommitted) and **the amended text is the owner's ruling** — confirmed by
   the owner in session at ~19:54 EDT: *"I made the edit. Send the correction round now."* Build
   against it. Where round 1's brief disagrees with the amended work order, the work order wins.
2. `.claude/dispatch/WO-3.79-brief.md` — round 1's brief (constraints, verification commands,
   pointers, traps). Its § 5 `TESTING.md` deliverable still holds.
3. `.claude/dispatch/WO-3.79-result.md` — round 1's report. Its claims are claims; the verifier
   found four of them wrong against the amended text.
4. `git diff` — round 1's uncommitted tree. Keep what is right; you are changing the reader's rule,
   its pins and its prose, not rebuilding the seal.

**First move**: `grep -rn MUTATION src tools/verify` — expect only the eight pre-existing
comment/harness matches (src/shell.js:1095, keys-legend-guards.mjs, outreach.mjs, score-grid.mjs,
score-search.mjs). Anything else is a live mutation; revert it before anything else.

## The verifier's ❌ lines, verbatim from the amended work order

- [ ] A score recorded at 4, edited to 9 one minute after the recording, reads *4 → 9 of 10*, not
      *not known* — whether the 4 was typed two minutes or twenty days before the recording.
- [ ] Dunn375 (an earlier build's 6 at R−1min swallowed by 8 at R+2min) reads *5 → 8 of 10*, and its
      check names that as the earlier-build limit the Traps accept.
- [ ] A recording of another term, or of another class, does not seal: a cell written two minutes
      before it and edited one minute after keeps one version, as WO-3.33's window has it.
- [ ] The past-due sweep writing *missing* one minute after a recording keeps the version the
      recording saw, driven through `src/past-due.js`'s own writer rather than read off its source.

(Acceptance 1, 4 and 5 by the old numbering — the setting line, `newestRecord()` across DST, and the
mutation line as then written — were ✅. Note the amended list now has nine lines; the mutation line,
"both tools pass" and "verbatim" lines are open too and must be true at your return.)

## The verifier's findings, and what each wants

1. **`src/score-history.js` `scoreChangeSince()` (~lines 362-385, the `pushedAcross` condition at
   ~376-379)** returns `then: null` unless the earlier version sits within five minutes of the first
   version after the recording. Under the amended Deliverable and Traps the reader **trusts the
   trail across a recording**: whenever the trail holds a version at or before the recording **and
   no commit follows the recording**, `then` is that version. A commit after the recording still
   answers *not known* (WO-3.75 — keep that). Decide, and state at the point of departure, what the
   no-version-at-or-before case (`before < 0`) answers; do not change it silently.
2. **`tools/verify/term-record-cause.mjs` ~470-474** pins Hale379 (4 typed 20 days before the
   recording, 9 one minute after) to *not known* → re-pin to *4 → 9 of 10*.
3. **`term-record-cause.mjs` ~255-259** pins Dunn375 to *not known* and forbids *5 →* → re-pin to
   *5 → 8 of 10*, with the check's own message naming it as **the earlier-build limit the Traps
   accept** (the recording saw 6; Record shipped 2026-10-29, WO-3.73). Not deleted.
4. **Prose that now states the old ruling** — rewrite each to the amended Traps:
   - the comment at `src/score-history.js` ~342-348 ("AND WHEN IT IS KEPT…" / "WHAT STAYS NOT
     KNOWN…" — the latter is now false; the swallow is the one exception and it names the wrong
     *then*, not *not known*);
   - the `docs/data-model.md` "honest limit" text round 1 added;
   - the fixture banner at `term-record-cause.mjs` ~372-375;
   - `TESTING.md` § WO-3.79 — **Acceptance lines copied verbatim from the amended phase file**, all
     nine, evidence under each. Remove round 1's ticks for "both tools pass" and "carries these
     lines verbatim" until they are true of *this* tree.
5. **Mutation, again**: with the seal removed, show the new checks red (Hale379 at least, and the
   R+1min-after-a-two-minutes-before case); revert. Also re-show `newestRecord()`-on-strings red if
   your changes touch that path's checks. Paste the red output into `TESTING.md` § WO-3.79. Then
   `grep -rn MUTATION` over every changed file. **Revert a mutation before you write anything else**
   (`AGENTS.md`).
6. **Two uncovered gaps, add fixtures** (both drive the real writers, not read source):
   - a recording of **another term**, and separately of **another class**, does not seal: a cell
     written two minutes before it and edited one minute after keeps one version;
   - the **past-due sweep** (`src/past-due.js`'s own writer) writing *missing* one minute after a
     recording keeps the version the recording saw — and the descriptor *What changed* reads for it.

## Traps worth restating

- `src/term-record.js` imports `src/scores.js` — no new import edge back; the boundary arrives from
  callers as round 1 did.
- A held column is untouched by the seal (WO-3.52).
- Do not widen past the work order. If something outside Deliverables looks wrong, name it as a
  proposed follow-up.
- `sw.js` `CACHE` was bumped in round 1; if you change any SHELL file again, confirm the bump still
  covers it (one bump per deploy is enough — do not bump twice for nothing).
- The tools count in `tools/README.md` (`check()` call sites) goes red on work being done — if you
  add checks, update the recorded number (WO-3.26's scar).

## Verification

`node tools/verify-shell.mjs` (full run, ~4-5 min; read the log's own `EXIT=` line, never `grep -c`)
and `node tools/wo-sweep.mjs`. Both must pass on the final tree, and that run is the one you cite.

## Return

Overwrite nothing of round 1's report: **append** a `## Correction round 1` section to
`.claude/dispatch/WO-3.79-result.md` as your last act — what changed, file by file; the
`before < 0` decision; each of the nine Acceptance lines with your evidence (as claims); the red
mutation output; the final `verify-shell` and sweep totals; anything you could not close. **Leave the
CHANGELOG draft in the result file** (do not edit `CHANGELOG.md`). Do not commit.
