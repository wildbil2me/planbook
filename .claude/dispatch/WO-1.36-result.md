# WO-1.36 — result (implementer, Claude Opus, 2026-10-01)

**Verdict I'm claiming:** all 7 Acceptance lines are met and ticked in
`plans/work-orders/phase-1-shell-store-roster.md`. None of them is 👤 or 📆. Nothing committed.

**The ruling: GLOBAL.** The shelf above a 🎒 row is now every `⬜` row above it in the whole running
order, whatever heading it sits under. Per-section, the keying WO-1.35 shipped, lost.

## Baselines, captured before any edit

- `node tools/wo-gate.mjs --self-check`: **`PASS | 44 of 44 plants were caught.`**, exit 0.
- `node tools/wo-gate.mjs --audit`: exit 0. The ride-along section printed 7 rows, with
  `ok WO-8.13 ✅ DONE — the mark is spent; it rode with index.html`, and
  `7 ride-along row(s), 0 with nothing open above them`.
- `node tools/wo-sweep.mjs`: exit 0, `45 checks · 42 passed · 0 failed · 3 to review`.

## Against the Acceptance list

1. **The keying is ruled on in prose at `rideAlongReport()`.** Done. A new paragraph above the
   function, "THE SHELF IS THE WHOLE RUNNING ORDER…", states the per-section argument and says why it
   lost. The NOTE prints *"`next` steps over it and there is nothing left to fold it into"*. Under
   per-section keying that sentence could be printed while an open row sat above it in an earlier
   section. In that state both halves are false: `next` stops at the earlier open row and never
   reaches this one, and that earlier row is a sitting that could host the fold (the row rides with
   a file, not a section). The paragraph also notes two things. Global keying can only print fewer
   NOTEs than per-section, never more. And a `⬜` 🎒 row above still counts as shelf, which is the
   same under either keying and is left alone. The code is now one counter (`let openAbove = 0`)
   instead of a `Map`. The NOTE text reads "the first ⬜ in the running order — row N of § X —", and
   the `ok` line reads "N open row(s) above it in the running order".
2. **A plant puts a 🎒 row in a later section than an open `⬜` row, on a shelf it planted itself.**
   Done. The new plant is named *"--audit measures a 🎒 row's shelf over the whole running order…"*.
   - It lifts the WO-9.9 and WO-9.8 fixture rows onto two headings it writes itself
     (`## Self-check shelf A …` and `## Self-check shelf B …`). They go directly above the heading of
     the first real table, so no real section is borrowed, no real row changes heading, and WO-9.9 is
     still the first row `next` reads.
   - It checks independently of the subject script that a `## Self-check shelf B` line now sits
     between the two rows. If it doesn't, the plant throws.
   - **Ruled case:** WO-9.9 is `⬜`. WO-9.8 must be `ok … 1 open row(s) above it in the running
     order`, with no NOTE. `next` must answer WO-9.9 and must not step over WO-9.8.
   - **Control:** same shelves, with WO-9.9 `🤖 CLAIMED`. WO-9.8 must be a NOTE that names
     `§ Self-check shelf B`, and `next` must step over it. Because both shelves sit above every real
     row, nothing depends on what the real trackers hold this week.
3. **That plant goes red under the losing keying, and that is recorded in `tools/README.md`'s
   mutation table.** Done. I restored the per-section `Map` in a scratchpad copy (with a `MUTATION`
   marker) and ran `--self-check --against` it. Result: `FAIL | 1 of 46 plants were not caught.`
   Only the shelf plant failed, on its ruled case; its control and all three WO-1.35 plants stayed
   green. That is the original defect reproduced. Running the current plants against HEAD's script
   also gave 1 red of 46: the same plant, plus its NOTE-wording assertion. Both results are in a new
   table row.
4. **No comment in `tools/wo-gate.mjs` claims a distinction no plant pays for.** Done.
   - The "§ Ship 3 and § After Ship 3 are different shelves" comment above `runningOrder()` is
     replaced. It now says the heading is carried only so the NOTE can say where the row sits, and
     it quotes the retired sentence in a dated parenthetical.
   - Two more comments that said "first ⬜ in its section" were reworded: the one above
     `rideAlongReport()` and WO-1.35's audit plant case 1. That plant's failure message was reworded
     too.
   - `grep "its section\|different shelves"` over `tools/wo-gate.mjs` now finds only that quoted
     parenthetical.
5. **`applyRelease()`'s missing-result-file arm is reached by a plant, and the two arms are proved to
   differ.** Done. The new plant is named *"--release on 🔍 AWAITING VERDICT with NO result file
   behind it…"*.
   - **No file:** it removes any `WO-9.9-result.md` from the sandbox, then asserts that the refusal
     exits non-zero, writes nothing, and prints `.claude/dispatch/WO-9.9-result.md is the report it
     would orphan — and there is no such file`.
   - **File present:** it writes the file and asserts that the sentence is absent and the name is
     followed by `.`.
   - It also asserts the two outputs are not byte-identical.
   - It restores the sandbox's dispatch state in a `finally`, so its place in the array doesn't
     matter.
   - **Mutations** (scratchpad copies, `--against`):
     - Ternary forced to `''`: 1 red of 46, only this plant.
     - Ternary forced to the *no such file* sentence: 1 red of 46, only this plant.
     - WO-1.38's release plant stayed green under both. That is the gap this plant closes, because
       WO-1.38's plant writes the file first.
   - Both mutation rows are in the table.
6. **`--self-check` is green and its count goes up by the number added.** Before: `PASS | 44 of 44`.
   After: **`46 plants, 46 caught, 0 missed.` / `PASS | 46 of 46 plants were caught.`**, exit 0. Two
   plants added, 44 → 46. I updated the closing summary and `tools/README.md`: "forty-four" →
   "forty-six", the `44 of 44` sentence → `46 of 46`, and a new WO-1.36 paragraph.
7. **`wo-sweep` is green, and `--audit` is green with WO-8.13's NOTE reading as it does today.**
   - Sweep after all edits: exit 0, `45 checks · 42 passed · 0 failed · 3 to review`, the same as the
     baseline.
   - `--audit`: exit 0. WO-8.13's line is byte-identical, and the section still reports
     `0 with nothing open above them`.
   - **Finding (not adjusted away):** I diffed `--audit` before and after. Exactly one real line
     changed, and only in wording, not in count or kind. WO-1.54's
     `ok … 1 open row(s) above it in § After Ship 3 — the sign-in and the paperwork` now reads
     `ok … 1 open row(s) above it in the running order`. I ticked the box with a note that says so.

## Also run

`node tools/verify-shell.mjs` ran locally to exit and printed `1600 checks · 1600 passed · 0 failed ·
0 skipped`, `EXIT=0`. Nothing in `src/` or `index.html` changed.

## Mutation hygiene

- Every mutation was made in a scratchpad copy driven with `--against`. The tree was never mutated,
  and those copies have been deleted.
- `git diff -U0 | grep '^+.*MUTATION'` finds nothing.
- `grep -rn MUTATION tools/` is **not literally empty**. It returns pre-existing prose: 9 hits in
  `tools/README.md`, 4 in `tools/verify/keys-legend-guards.mjs`, 1 each in `outreach.mjs`,
  `score-grid.mjs` and `wo-gate.mjs`. For every one of those files the count is the same at HEAD.
  None of them is a live mutation.

## Files changed

- `tools/wo-gate.mjs`: the ruling and the single counter, the reworded comments and NOTE/ok text,
  the two new plants, and the summary paragraph.
- `tools/README.md`: the plant count, the WO-1.36 paragraph, and three mutation-table rows.
- `plans/work-orders/README.md`: in § "Ride-along rows", "in its section" → "in the running order",
  with a dated parenthetical.
- `plans/work-orders/phase-1-shell-store-roster.md`: the 7 boxes ticked, with short notes. The row's
  `🤖 CLAIMED` status line was already modified when I arrived and I did not touch it.

## Handed back, not done

- **`CLAUDE.md:667` is now stale.** It says `--audit` "reports a ride-along that has become the first
  `⬜` in its section". I did not edit `CLAUDE.md`. Suggested repair: "…the first `⬜` in the running
  order (WO-1.36 ruled the shelf global: an open row in an earlier section counts)…". `AGENTS.md`
  does not carry the phrase, and § 21's claim list didn't fire on it (the sweep stayed green).
- WO-1.35's ticked Acceptance line (`phase-1-shell-store-roster.md`, "first `⬜` in its section") and
  the WO-1.35 paragraph in `tools/README.md` that calls step 2b's pair "already the pair a 🎒 plant
  needs" are historical. I left both as written. The new WO-1.36 paragraph in `tools/README.md`
  corrects the second explicitly.

## Decisions the work order did not settle

- **Wording of the `ok` and NOTE lines.** Under global keying "N open row(s) above it in § X" is no
  longer what the number measures, so it now says "in the running order". The NOTE still names the
  section as a place: "row N of § X".
- **Where the planted shelves go.** Directly above the first real table's heading, not at the end
  of the file. Both shelves then sit above every real row, so every assertion, including the exact
  count of 1, is independent of real tracker content. Step 2b's order (WO-9.9 first, WO-9.8 second)
  is preserved, not inherited.
- **The missing-file arm is a plant of its own, not two more cases in WO-1.38's release plant.** Its
  name is what lets a mutation of that ternary name the arm it broke. It is self-cleaning, so it
  doesn't disturb WO-1.38's "writes the result file and runs last" ordering.

## Out-of-scope temptation declined

A `⬜` 🎒 row above another 🎒 row counts as shelf, but `next` steps over both. So the lower row can
read `ok` while `next` reaches it anyway. This is the same under either keying and is not this work
order's question. It is named in the ruling paragraph and nothing more.

## CHANGELOG draft (the teacher decides)

> **A ride-along's shelf is the whole running order, and a plant proves it — 2026-10-01 (WO-1.36).**
> `--audit`'s 🎒 NOTE says `next` will step over the row. It now counts open rows the way `next`
> reads them, across every heading, where it used to count only the row's own section. Two
> `--self-check` plants (44 → 46) separate behaviours that one check used to hide. One puts the open
> row and the ride-along under two headings of its own. The other covers `--release`'s refusal when
> the result file it names does not exist. Each goes red under the mutation it was written against.
