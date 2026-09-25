# WO-1.39 — result (implementer, Claude Opus)

**All seven Acceptance lines are met and ticked by hand in the phase file.** None of them is 👤 or 📆. I did not run `--tick`, `--handoff` or `--release`, and the status line still reads `🤖 CLAIMED — 2026-09-24`. I left `CHANGELOG.md` alone. There is no commit.

## Files changed

- `tools/wo-cost.mjs`: adds `--window`, `--line`, `--swapped` and `--root`, plus a header note on the weighted proxy versus the raw-token rule. The existing table and `--detail` output are unchanged.
- `tools/wo-gate.mjs`:
  - `windowLine()`, which spawns wo-cost.mjs and never throws.
  - `--start` prints the window line and accepts `--window-root <dir>`.
  - Help and header usage text.
  - Three self-check plants plus their fixture helpers, and a closing-summary paragraph.
- `tools/README.md`: the `wo-cost.mjs` row, and the `--self-check` paragraph (forty becomes forty-three, `40 of 40` becomes `43 of 43`, plus a WO-1.39 sentence).
- `plans/session-limits.md`: two italic notes. One records a measured correction to the unit; the other says P1 is built as WO-1.39.
- `plans/work-orders/phase-1-shell-store-roster.md`: seven Acceptance boxes ticked. The status line was already changed by the orchestrator's claim.

## Acceptance, line by line

1. **`--window` reports rolling-5h weighted usage across every directory under `~/.claude/projects/`, with the reference figures beside it.** Met. Real run on 2026-09-24:
   `window  13.2M proxy units, rolling 5h, 15 project dirs (1 active) · median dispatch 6.0M, deaths from 16.4M (p25) / 20.3M (median) · swapped accounts? node tools/wo-cost.mjs --swapped`. It exited 0 and the full report said `read 15 project directories, 344 transcript files, 21 touched inside the window, 714 usage lines — 87 ms`.
   - There are **15** directories on this machine today, not the work order's 16. It walks whatever is there.
   - It refuses a root that holds `.jsonl` files directly, i.e. one project's directory, because that would under-read. I drove this against `~/.claude/projects/c--dev-planbook`: exit 1.
2. **It names its unit as a proxy where it prints the number.** Met. The word `proxy` is on the same line as the figure, and the full report states the weights and says it is calibration, not a ceiling. It cites `plans/session-limits.md`.
3. **An unreadable or empty path exits non-zero with a message and never prints `0.0M`, driven.** Met. Each case below was run by hand and read.

   | Case | Result |
   |---|---|
   | root that does not exist | ENOENT, exit 1 |
   | a file given as root | exit 1 |
   | empty root | exit 1 |
   | root holding one empty project directory | exit 1 |
   | a single project directory | exit 1 |
   | default path with `USERPROFILE`/`HOME` pointed at an empty scratch home | exit 1 |

   `grep -c 0.0M` over the bad-path log returned 0. `units()` prints `K` below 0.05M, so no figure can format as `0.0M`, and a genuinely quiet window is said in words (`nothing used in the last 5h — …`). A standing plant covers this too (see line 6).
4. **An account swap can be recorded so the count restarts, and the mechanism is named where the number prints.** Met. `node tools/wo-cost.mjs --swapped` writes `wo-cost-swap.json` beside the transcript root (by default `~/.claude/wo-cost-swap.json`, outside the repo). The rolling sum then starts at whichever is later, the swap time or five hours ago.
   - The line reads `swapped accounts? node tools/wo-cost.mjs --swapped` when no swap is active, and `count restarted by node tools/wo-cost.mjs --swapped` when one is.
   - I drove this on a scratch fixture: 25.0M before the swap, `nothing used since the swap recorded 21:42` after it.
   - A garbage marker prints `swap marker unreadable, ignored` and does not restart the count.
   - I did **not** run `--swapped` against the real `~/.claude`, because it would have zeroed the owner's live reading.
5. **`--start` prints the window line and clears on any number, driven past the death cluster.** Met.
   - **Plant 1:** a fixture tree at 25.0M across two project directories, handed in through `--window-root` in the sandbox. `--start` and `--start --dry-run` both exit 0, and the non-dry run writes `🤖 CLAIMED`.
   - **Real tree:** `--start WO-G2 --dry-run` printed the live line and exited 0 in 0.227s total. `git status` was identical before and after.
   - **Bad default path:** with `USERPROFILE` pointed at a bad path, `--start --dry-run` printed `window  unavailable — no readable transcript directory …` and exited 0.
6. **`--self-check` is green, with a plant behind each new check, and its count is up by that many.** Met: `PASS | 43 of 43 plants were caught` (was 40), exit 0. The three new plants are listed below.

   | Plant | What it checks |
   |---|---|
   | 1 | The line prints and the claim clears at 25.0M. It also refuses a 7-hour-old line sitting in a fresh file. |
   | 2 | Three no-data cases: no wo-cost.mjs, a missing root, and a root with no transcripts. `--window` exits 1, `--start` still claims with `window  unavailable — <reason>`, and neither prints 0.0M. |
   | 3 | A swap restarts the count (to empty, then to 10.0M for a marker an hour old). It is named on the line, the marker lands beside the root, and the marker expires after 5h. |

   **Proved able to fail:**
   - `--against` a copy of `HEAD:tools/wo-gate.mjs` gives 3 red of 43, exactly the three new plants.
   - Nine mutations, each applied to a **scratch copy** of `tools/` + `plans/` in the scratchpad, never the real files. Each one reddened the plant named after it:

   | Mutation | Plants red |
   |---|---|
   | gate refuses past 20M | 1 |
   | unavailable prints 0.0M | 2 |
   | window failure fails the claim | 4, including plant 2 |
   | mtime-only filter | 1 and 3 |
   | walk only one project | 1 and 3 |
   | empty root reads as fresh | 2 |
   | swap ignored | 3 |
   | swap never expires | 3 |
   | `proxy` word removed | 1 |

7. **`wo-sweep.mjs` is green and `--audit` is green.** Met. The final runs, after ticking, were:
   - sweep: `45 checks · 42 passed · 0 failed · 3 to review`, exit 0. The three REVIEWs are the standing ones about `src/` and mockups, and nothing here touches them.
   - audit: `PASS | every fragment matches exactly one roadmap box …`, exit 0.
   - self-check: 43/43, exit 0.

**`grep -rn MUTATION tools/`** found only existing prose (in `tools/verify/*.mjs`, the wo-gate.mjs guard comment, and README). None of it is in my diff: `git diff | grep '^+' | grep -c MUTATION` returned 0.

**`verify-shell.mjs` was not run.** No file under `src/`, `index.html` or `sw.js` changed, so it is not owed, as the brief says.

## Decisions the work order did not settle

- **The window counts every transcript line that carries usage, duplicates included.** This is a finding, not a shortcut. About half the usage lines in a week of transcripts repeat a `(message.id, requestId)` pair, because a streamed response writes one line per content block.
  - I re-measured the eight-row table in the work order. Counting every line reproduces it to the decimal: WO-5.5 6.8, WO-5.2 15.7, and so on. Deduplicating gives 3.6 and 9.1.
  - So the calibration (6.0M, 20.3M) was taken in duplicate-counting units. A deduplicated window beside it would under-read by about half, which is the direction the Traps forbid.
  - I kept it comparable and wrote the finding into `wo-cost.mjs`, `plans/session-limits.md` and `tools/README.md`.
- **The swap marker sits beside the root.** It is `path.dirname(root)/wo-cost-swap.json`, so `~/.claude/` by default: outside the repo and never committed. There is no `localStorage`.
  - Because it follows `--root`, a fixture tree carries its own marker, and a self-check cannot write into the real `~/.claude`.
  - The marker **expires by itself** after 5h, so there is no clear command and no state to forget.
  - A future or unparseable timestamp is ignored and said so on the line.
- **The flag is `--root`, not `--projects`.** `--projects` already means *one project's* directory for the table. Reusing it for "the directory holding them all" would let someone pass their project directory and silently under-read. `--root` is new, and a project-shaped root is refused. `--start` passes it through as `--window-root`.
- **Spawned, not imported.** wo-gate.mjs spawns `wo-cost.mjs --window --line` with a 20s timeout, keeping the arithmetic in one file and the "no script in tools/ imports another" rule intact. Every failure path returns a string, so `--start` cannot fail because of the window.
- **Timing.** The real walk took 87 ms, and the whole `--start --dry-run` took 0.227s. Files are filtered by mtime before any JSONL is parsed, and lines by their own timestamp.
- **The window line prints only after the fence passes.** A refused `--start` does not print it. It also prints under `--dry-run`, which is when someone is deciding.

## Notes, not acted on

- **The death cluster was measured over `c--dev-planbook` alone** (per session-limits.md). An all-projects reading therefore reads at or above that scale, so it errs early. I stated this in the code comment.
- **No `--swapped-at <time>`.** A swap recorded late loses the usage between the swap and the recording, which is a small under-read. It would be a cheap follow-up; I left it out to stay inside the work order.
- **The pipeline docs don't mention the new line yet.** `.claude/agents/work-order-orchestrator.md` and `.claude/commands/wo.md` could tell the orchestrator to read the window line at `--start`. That is a pipeline-file change outside this work order, and § 21 watches that pair.
- **`plans/session-limits.md`'s status line still says "nothing is built".** I added an italic note under P1 instead of rewriting a brainstorm's dated status.

## Draft CHANGELOG entry (the teacher decides)

> `wo-gate.mjs --start` now prints one line saying how much of the usage window is spent: a rolling five-hour sum across every project, in a proxy unit, beside the median dispatch and the point where dispatches have died. It never refuses. `node tools/wo-cost.mjs --window` gives the full reading, and `--swapped` restarts the count after an account swap.
