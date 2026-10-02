# WO-1.54: result

**Implementer** Claude Opus (work-order-implementer) · 2026-10-01 · not committed, as instructed.

All three Acceptance lines are met, and I ticked all three in `plans/work-orders/phase-1-shell-store-roster.md`. None of them is 👤 or 📆. I left the status at 🤖 CLAIMED: no `--tick` or `--handoff`, as the dispatch asked.

## Files changed

- `tools/wo-sweep.mjs`: comment-only, two places, no code changed.
  - A paragraph added to the "second reading" comment block directly above `cards()`, next to the break line. It holds the fixture markup, the command, the two readings to expect, and the warning that whoever edits that loop owes the run again.
  - One sentence added to § 26's banner, in its `--claims-in` paragraph, pointing at that comment.
- `tools/README.md`: one sentence in the `wo-sweep.mjs` row's § 26 passage, after the `06bfa06`/`a16b87c` reproduction. It points at the same comment. The 45-check count is unchanged.
- `plans/work-orders/phase-1-shell-store-roster.md`: the three Acceptance boxes ticked. The other line in that diff, the 🤖 CLAIMED status, was already there from the orchestrator's `--start`.

Nothing under `src/` changed, so I did not run `verify-shell.mjs`. The brief's § 2 says this Acceptance does not ask for it.

## The fixture

I built it outside the tree, in the session scratchpad, as `two-ids.html`. It is shaped like the `plans/runbooks/wo-3-18-runbook.html` dependency strip: one parent `div` holding these cells:

- `WO-1.50` (id cell)
- a description cell with full stops
- `WO-1.52` (id cell)
- a description cell with full stops
- `🚫 struck` (state cell)

The full stops in the description cells make the sentence reading end before the status, so only the card reader can pick the claim up.

**Choosing the state.** The brief warns that § 26 is silent when a claim agrees with the tracker. So the state is `🚫 struck`, which contradicts both ids' real statuses:

| Id | Tracker status (`wo-gate.mjs --list`) |
|---|---|
| WO-1.50 | ⬜ NOT STARTED |
| WO-1.52 | ✅ DONE |

Because of that, each reading prints something you can see, and the two readings are told apart by what they print rather than by silence.

**Showing the file was read.** In both runs, the PASS line of the "can be read" check reports the document and its claim count, so the file was not skipped.

## Acceptance

### 1. [x] One claim for the second id, none for the first

```
node tools/wo-sweep.mjs --claims-in=<scratchpad>/two-ids.html
```

Output, with the paths shortened:

```
§ 26 is pointed at …/two-ids.html by --claims-in, not at the planning documents it names
PASS | planning documents — the tracker and every document § 26 names can be read  :: 212 work order(s) read … 1 document(s) read by path (…/two-ids.html) and 1 status claim(s) found in them — at least one in each
REVIEW | planning documents — no live status claim contradicts the tracker  :: …/two-ids.html:5 "WO-1.52 … 🚫 struck" claims WO-1.52 is 🚫 STRUCK (as "🚫"), and the tracker says ✅ DONE — …
EXIT=0
```

That is one claim, for WO-1.52 (line 5). There is no claim for WO-1.50, and this is more than silence: `🚫 struck` contradicts WO-1.50's ⬜ NOT STARTED, so if any claim had been read for WO-1.50 it would have been listed. The claim count of 1 confirms it.

I also built the fixture exactly as it is printed in the new comment, as `as-documented.html` (the compact two-line markup). It reads the same way: 1 status claim, and one REVIEW finding for WO-1.52.

### 2. [x] The mutation is caught, and the line was restored before anything else was written

1. Before the mutation, `git diff --stat tools/wo-sweep.mjs` was empty, so I had no unstaged edits that a checkout could destroy.
2. I deleted `          if (opensWith(cells[j], ID_AT)) break;` with a Node one-liner. It asserted that the line occurred exactly once, and `git diff` showed that single line removed at hunk `@@ -3301,7 +3301,6 @@`.
3. I ran the same `--claims-in` command:

```
PASS | … 1 document(s) read by path (…/two-ids.html) and 2 status claim(s) found in them — at least one in each
REVIEW | … …/two-ids.html:3 "WO-1.50 … 🚫 struck" claims WO-1.50 is 🚫 STRUCK (as "🚫"), and the tracker says ⬜ NOT STARTED · …/two-ids.html:5 "WO-1.52 … 🚫 struck" claims WO-1.52 is 🚫 STRUCK (as "🚫"), and the tracker says ✅ DONE — …
EXIT=0
```

With the line deleted, the first id inherits the second id's state, so the mutation is caught: 2 claims instead of 1, and WO-1.50 is named.

4. I reverted with `git checkout -- tools/wo-sweep.mjs`, which was safe because step 1 showed nothing of mine was unstaged. Then:
   - `git diff --stat tools/wo-sweep.mjs` was empty.
   - `grep -n "ID_AT)) break" tools/wo-sweep.mjs` returned `3304:          if (opensWith(cells[j], ID_AT)) break;`.

I wrote nothing between the mutation and the revert.

I ran the mutation twice. The first run piped its output through `head -2`, which cut off the REVIEW line, so I put the mutation back in, captured the full output, and reverted again the same way, with the same empty diff and the same grep result. The output quoted above is from the second run.

After all of this, `grep -rn MUTATION tools/wo-sweep.mjs` finds nothing.

### 3. [x] Re-run instructions are where § 26's next reader will look, and the sweep is green at the recorded count

The re-run note is in three places:

- **Directly above `cards()`**, next to the line it protects. It gives the fixture markup, the command, and the expected output both ways: intact reads "1 status claim(s)" and names only WO-1.52; with the line deleted it reads "2 status claim(s)" and names WO-1.50 too.
- **§ 26's banner**, in the `--claims-in` paragraph, which points at that comment.
- **The § 26 passage of the `tools/README.md` row**, which points at the same comment.

After all edits and the ticks, `node tools/wo-sweep.mjs` ends with:

```
45 checks · 42 passed · 0 failed · 3 to review
```

`tools/README.md` records "45-check", so the counts match, and § 22, which checks that count, passed. Both § 26 checks passed on the real planning documents. The 3 REVIEWs were already there before this change: sensitive field names, due-date with late/missing, and the mockup banners.

## Decisions the work order left open

- **I made the proof a one-off `--claims-in` run, not a standing plant or a committed fixture.**
  - A standing check would move the recorded 45-check count and add a fourth thing to keep in step, all for one line in an XS work order.
  - A committed fixture `.html` would need a home that § 26 does not read by default. `tools/` is risky because § 26 already reads one page there by name.
  - The fixture is two lines of markup, so the comment can hold it whole, along with the readings to expect.
  - The cost: this is a proof that someone has to re-run, not a fence. Deleting the line still leaves `node tools/wo-sweep.mjs` green. The comment says whoever edits the loop owes the run, and that relies on a reader seeing it, just as the README's § 25 note about `runSection()` does.
- **The note sits above `cards()`, not in a mutation table.** The `tools/README.md` mutation table covers `wo-gate.mjs --self-check` plants, and this proof is not one of those.
- **The fixture names real ids.** It uses WO-1.50 and WO-1.52, so it goes stale if either one's status becomes 🚫 STRUCK, which would make the state agree with the tracker. The comment says to pick another pair if that happens.

## Proposed follow-up (not built)

If the owner wants this line fenced and not just proved once, a `--self-check`-style plant for `wo-sweep.mjs` would turn the run above into a standing check. It would cost the 45 → 46 count change and an entry in the README. I did not build it because it is outside an XS scope.

## Scratch files

`two-ids.html`, `as-documented.html` and `sweep.log` are in the session scratchpad (`C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\2f09f5e8-1bc6-4bb3-854b-5184076f921b\scratchpad`). Nothing scratch is left in the tree.

## CHANGELOG draft (for the teacher to judge)

> `wo-sweep.mjs` § 26's card reader stops at a second id cell so one strip's state is never pinned on the id before it. No document exercised that line, so deleting it left the sweep green. It is now proved by mutation against a scratch strip, and how to re-run that proof sits beside the line.
