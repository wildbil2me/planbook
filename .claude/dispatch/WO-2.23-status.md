# WO-2.23 dispatch status

Pollable while the dispatch runs. Deleted once `.claude/dispatch/WO-2.23-result.md` exists.

- `2026-08-10` — gates checked, `PASS`, tree clean, no prior dispatch files. Depends on nothing.
- `2026-08-10` — work order read in full (`plans/work-orders/phase-2-attendance.md:1964`).
- `2026-08-10` — **routed Claude / Opus, on its own merits.** Deciding signal: Deliverable 2 asks the
  implementer to establish the app's first shared-input-reset convention and argue it at the rule,
  plus a `TESTING.md` prose note. Runner-up set aside: size `S` and a one-line fix reads Codex-shaped,
  but the Traps are judgment (a check that cannot fail, the native picker, WO-3.17's boundary).
  No Codex probe run — the rubric never sent it there.
- `2026-08-10` — claimed: `🤖 CLAIMED — 2026-08-10`.
- `2026-08-10` — brief written, `.claude/dispatch/WO-2.23-brief.md`, all markers filled. Three
  dispatch-time findings added that the work order text could not know: WO-3.17 already landed the
  reset on `.assign-field-date` so the "zero matches" premise is stale; `.student-date` is a seventh
  date input in scope by Deliverable 1 but unnamed in the 👤 list; `.term-date` is worn by two screens
  and loses its intrinsic width to the reset.
- `2026-08-10` — **implementer spawned at Opus, awaiting return.** Expect 20–40 min. A flat status
  file, an absent result file and an unchanged `git status` are the normal shape of the first ~20
  minutes (the implementer reads before it writes) and are not evidence it died. Do not spawn a
  second one against this claim.
- `2026-08-10` — **implementer returned** after ~19½ min. `.claude/dispatch/WO-2.23-result.md` written.
  Landed a shared `input[type="date"]` reset in `src/shell.css` BASE (element selector, not per-class),
  `.term-date` coarse `min-width` 44 → 160px, a comment paragraph on WO-3.17's `.assign-field-date`
  line, `sw.js` v41 → v42, a `TESTING.md` § WO-2.23. Ticked Acceptance 1, 6, 7; left the four 👤 lines
  open; status written `🔨 IN PROGRESS` by `--tick`. Reports `verify-shell` 563/563 and `wo-sweep`
  16 checks / 1 standing REVIEW.
- `2026-08-10` — **verifier spawned at Opus, awaiting verdict.**
- `2026-08-10` — **verdict in: FAIL**, one ❌, and it is prose rather than code. Acceptance 6's 160px
  value verifies (measured: ~307px of row against ~215px of field-plus-caption, costs a wrapped line,
  no overflow) but its stated provenance is false — Roll Call!'s `#dateJumpInput` is a `<select>`,
  not an `<input type="date">`, and Roll Call!'s real date inputs carry no reset and no `min-width`.
  The claim is written in three places. Lines 1 and 7 ✅, lines 2–5 🙋 (iPad). Verifier ran both
  harnesses itself and confirmed 563/563 and 16 · 15 · 0 · 1 at 174 mentions.
- `2026-08-10` — **correction dispatched to the same implementer** (first miss, not a re-route).
- `2026-08-10` — **correction returned.** Prose in four places; it re-verified all eight of the
  verifier's reference claims against the Roll Call! file before rewriting, kept 160px, re-sourced the
  picker reassurance to WO-3.17, and chose to *include* the ≤640px 130px drop in the rule's reasoning.
- `2026-08-10` — **second verdict: FAIL.** The original ❌ is fixed and verified true in all four
  places. But the correction added one *new* checkable claim — the sentence explaining why the 130px
  drop was not copied ("a phone concession for a header bar which must not wrap, and these two rows
  may") — and both halves are false about the source file: `#dateJumpInput` sits in `.search-row`, not
  a header bar, and `.search-row` is `flex-wrap: wrap` at `dashboard.html:977`. Plus a stale figure:
  `TESTING.md` § WO-2.23 says style lines `4462 → 4547`; the sweep now prints `4557`.
- `2026-08-10` — **stopped and brought the user in.** Two FAILs is the rule's stop point. Status is
  `🔨 IN PROGRESS` (part-built, nothing in flight, `--release` correctly refuses it). No third round
  dispatched, nothing ticked, nothing committed.
- `2026-08-10` — **owner chose: the main session makes the correction, not a third dispatch.** The
  remaining work was one clause and one number, and the same author had written a false claim about
  the sibling repo twice.
- `2026-08-10` — **round 3: FAIL.** The rewritten sentence verified true in all six particulars, but
  the round exposed an *older* false claim two sentences earlier that rounds 1–2 never examined: the
  source select "showing a date plus a disclosure arrow", "at least as wide", "roughly double" the
  headroom. Settled by rendering, not argument — `appearance: none` is exactly what removes that
  arrow, and the source control measures **narrower** than the destination (83px vs 139px, Chrome).
- `2026-08-10` — **fixed by deleting the argument rather than replacing it.** A fourth argument is how
  you get a fourth failure. The paragraph now claims only that 160px has held a date open under these
  same two reset declarations on one real control for a year, states outright that no measurement,
  headroom or comparison is claimed, and forbids re-deriving the floor from a desktop measurement.
- `2026-08-10` — **round 4: FAIL, and different in kind.** Reasoning sound in every particular; one
  wrong *pointer* — `:985-986` cited as `.header-top`/`.header-bottom` when those lines are
  `.modal-panel`/`.config-modal-panel`. An off-by-6, in a paragraph whose own text says *be exact
  about what it was copied from, because a reader acting on it would have been misled.*
- `2026-08-10` — **round 5: PASS.** Scoped to the failure mode round 4 exposed rather than rounds 1–3's:
  every line-number citation in the block extracted and opened, cited-as against actually-is. All nine
  land. `verify-shell` 563/563/0/0 with zero skips; `wo-sweep` 16 · 15 · 0 · 1 at the standing 174
  mentions; style lines 4571 matching `TESTING.md`.
- `2026-08-10` — **owner walked the four 👤 lines on the hardware** and ticked them himself, plus the
  seventh field the work order never named. Recorded at `TESTING.md` § WO-2.23 with the hardware-only
  finding nobody had: the date pins **centre, horizontally and vertically**, in the taller box.
- `2026-08-10` — **`--tick` run: `✅ DONE — 2026-08-10`.** Phase 2 16 → 17 of 22, total 37 → 38 of 80.
  `--audit` clean. `CHANGELOG.md` entry written under `### Fixed`.
- `2026-08-10` — **standing rule adopted from the scar**, `plans/work-orders/README.md` → *Citing
  code*: cite a symbol, not a line number. This work order's own **Why it exists** paragraph was
  rewritten to symbols — it carried five line numbers and three had drifted under WO-3.17's commit,
  two under its own comment additions.

**A correction owed to `-result.md`, which is kept as written rather than edited.** That file is the
implementer's report and states the disclosure-arrow claim as fact at its `:139-141` and `:419-422`.
It is false, for the reason round 3 proved above. The record stands; this note is the correction.
