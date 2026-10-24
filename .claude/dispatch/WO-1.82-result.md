# WO-1.82 — result (implementer, Claude Opus)

## Summary

The fix is in `tools/verify/log-entries.mjs`, in the append-only check, and it is the only code that changed. The three regexes have their backslashes back. The guard is no longer just printed: the check now counts it and fails unless it finds exactly two, one per writer. All three plants went red, naming the right half each time, and all three are reverted. `src/` matches HEAD: `git diff --stat -- src/` printed nothing, and `grep -rn "MUTATION WO-1.82" src/ tools/` found nothing. None of the six Acceptance lines is 👤 or 📆, and I ticked all six in the phase file, each on evidence quoted in `TESTING.md` § WO-1.82. I did not touch the status (`🤖 CLAIMED`); that is the orchestrator's `--handoff`.

## Against the Acceptance list

1. **verify-shell passes and reports the guard as present: met.** `node tools/verify-shell.mjs`, waited out to its exit: *2117 checks · 2117 passed · 0 failed · 0 skipped*, 1166s, `EXIT=0`. The check's detail now reads `the create-on-first-write guard is present 2 time(s), one per writer; removers found: none`. Before the fix it printed `present = false` on every run.
2. **Each remover plant turns the check red and names it: met.** Both plants went in `writeEntry()` and each cost a full run. Each run ended *2116 passed · 1 failed*, `EXIT=1`, and the one failure was this check.
   - `d.log = d.log.filter((e) => !!e);` → `removers found: ["reassignment of .log"]; FAILED ON: remover(s) ["reassignment of .log"]`
   - `d.log[d.log.length - 1] = entry;` → `removers found: ["assignment into .log[...]"]; FAILED ON: remover(s) ["assignment into .log[...]"]`
   - The full red lines are quoted in TESTING.md. Both plants were reverted with the Edit tool.
3. **Renaming `d.log` in the guard turns the check red: met.** The guard became `if (!Array.isArray(d['log'])) d['log'] = [];`. The run ended *2116 passed · 1 failed*, `EXIT=1`, with `present 1 time(s) … FAILED ON: create-on-first-write guard found 1 time(s), not 2`. Reverted.
4. **Other regexes of the same shape in `tools/`: none found, and TESTING.md says so.**
   - A scratch scanner (outside the repo) read 2,745 regex literals across the 107 `.js`/`.mjs` files under `tools/` and flagged nothing.
   - I ran the same scanner on the HEAD copy of `log-entries.mjs` to show it is not vacuous. It flagged exactly the three regexes this work order repairs.
   - I also read every `new RegExp(...)` in `tools/` for the string form of the same bug. Each one doubles its backslashes or uses `String.raw`.
   - So there is nothing to book.
5. **verify-shell and wo-sweep pass: met.**
   - verify-shell: the run under line 1. Nothing in `src/` or `tools/` changed after it. The harness edit was staged before that run and has no unstaged diff, and verify-shell reads neither TESTING.md nor `plans/`.
   - wo-sweep: `EXIT=0`, *52 checks · 49 passed · 0 failed · 3 to review* (the three standing reviews). I ran it three times: after the plants came out, after the docs were written, and after the last TESTING.md edit. All three gave the same result.
   - `wo-gate.mjs --audit`: `EXIT=0`.
6. **TESTING.md section: met.** `### WO-1.82 — the log's append-only check has three regexes with no backslashes`, under Phase 1 after WO-1.81. It has the six lines verbatim with evidence for each.

## Decisions the work order left open

- **The guard count is checked as `=== 2`, not `>= 1`.** `src/log.js` carries the guard twice. With `>= 1`, one writer could lose its guard and the check would stay green, which is the silence this work order exists to end. Plant C shows the difference: it renamed only one of the two guards, and it went red.
- **The strip is global, and the count uses `match()`.** A strip that removes only the first match leaves the second guard in the text being searched, and the working reassignment regex then fires on correct code. Counting with `match()` instead of `.test()` avoids the `/g` lastIndex problem. Both reasons are recorded in the code comment.
- **No new `check()`.** The guard is folded into the existing check's pass condition, and a `FAILED ON:` clause names which part failed. So the `tools/README.md` count did not move.
- **The plants change no behaviour.** That keeps the append-only check as the only red line in each run, so the evidence shows only this check. Plant B therefore differs from the work order's `d.log[0] = …` example: it writes the entry just pushed back into its own slot. I also confirmed offline that the index regex fires on the literal `d.log[0] = entry` form.

## Not closed / caveats

- **The failure wording is slightly awkward.** When the guard count is wrong, the detail still says "present 1 time(s), one per writer". The `FAILED ON` clause states the actual failure. I left it alone because changing the harness would have cost another 20-minute run to re-evidence line 1.
- **Run timing.** Each verify-shell run took about 19.5 minutes (1166s), not the brief's estimate of about 4.4. That is four full runs in total.
- **How the backslashes may have been lost.** While I was writing the scanner, a quoted bash heredoc collapsed its `\\` to `\`. That is a plausible way three regexes lost their backslashes together. A possible follow-up, which I did not do here: make the scanner a sweep section so this cannot happen again unseen. Today nothing stops a fourth regex arriving without its backslashes.

## Files changed

- `tools/verify/log-entries.mjs` (staged)
- `TESTING.md` (§ WO-1.82 added)
- `plans/work-orders/phase-1-shell-store-roster.md` (six Acceptance boxes ticked; the CLAIMED status line was already modified by `--start`)

## CHANGELOG draft (the teacher's call)

> The log's append-only check now actually checks. Since WO-4.4, three of its regexes had lost their backslashes, so the part meant to catch a reassignment of the log, or a write into it by index, could never fire, and the guard it reported was "not present" on every run, unread. The regexes are repaired, the guard is counted (one per writer) rather than printed, and planted removers now turn it red by name. Nothing in the app changed.
