# WO-1.92 — result (implementer, 2026-11-03)

## The verdict

**The flake did not happen this sitting, so I have not named its cause.** I made six full runs of
`node tools/verify-shell.mjs` and one 400-reload soak, and none of them had a boot failure. What this
work order leaves behind is a permanent, read-only addition to the harness's failure messages. The
next time a boot fails, the message names the module that failed, its status and size, whether the
service worker answered it, and the worker's state. It does this even in the "request with no event"
shape, where the page today reports nothing at all. A scratch probe proved it on both paths
(`load()` and `mustBoot()`).

## What I could not close

- **The cause.** It did not recur in N = 6 clean full runs of my own, nor in the soak. I did not
  propose an app work order, because nothing points at `src/` or `sw.js`. I did not make a harness
  fix either, because nothing points there. TESTING.md § WO-1.92 § 5 says how the next failure message
  decides between the two.
- **N is weak evidence, and I am saying so rather than moving it.** The work order and the brief both
  assumed the flake hits about one run in three. The earlier dispatches' scratchpad logs say it is
  closer to **one in twelve**: 10 occurrences in about 117 full runs since 2026-10-24, all in browser
  sections 88–96, and 7 of the 10 at `sync-button.mjs`'s 23:30 same-day reload. At that rate six clean
  runs in a row happen about 59% of the time with nothing changed. I wrote this into the status file
  before run 5 and kept N at 6.

## Occurrences seen

**None in this sitting.** Every run's `FAIL | §` lines were captured into the status file as the run
ended, and there were none. The ten historical occurrences are tabulated in TESTING.md § WO-1.92 § 1:

- log-entries, 2026-10-25;
- sync-button ×2, 2026-10-27;
- sync-button, 2026-10-31;
- sync-button ×3, 2026-11-01;
- front-door, 2026-11-01;
- cooldown-quiet, 2026-11-02;
- WO-1.91's pre-capture run, not on disk.

All but the last two predate `load()`'s error capture. So **no occurrence on record carries a page
error** that would name its cause.

## Against the Acceptance list

1. **TESTING.md quotes every boot failure, or says it did not recur in N runs and what was tried.**
   Ticked. It says plainly that the failure did not recur in N = 6, gives the rate correction, and
   lists what was tried: the historical record, the instrument and its probe, and the soak. § 4 also
   lists what was not tried and why: run-wide `Network.loadingFailed`, and attaching to the service
   worker's target.
2. **A harness cause is fixed there, and the fix is neither a longer budget nor a retry.** Ticked as
   **"the condition did not arise."** No budget changed and no retry was added. **This tick is a
   judgment call:** the line's premise never arose. If the orchestrator reads a conditional that never
   fired as un-tickable, untick it. The evidence text says exactly what happened.
3. **An app cause leaves `src/` and `sw.js` untouched, and the report names the app work order.**
   Ticked on the same "condition did not arise" basis. `git status --short src/ sw.js` is empty and
   `CACHE` is still v208. No app work order is proposed. Same caveat as line 2.
4. **Three consecutive green full runs on one tree, with the run lines quoted.** Ticked. Runs 2–6 are
   five consecutive green runs on `dec9b0442069`, all `2205/2205`, `EXIT=0`, 1200–1230s. That md5 is
   the final tree: I re-took it after all edits and it still reads `dec9b0442069`. Run 1 was green too,
   but it started on `e417debc78b5` before the instrument was written, so it counts toward N and not
   toward the three.
5. **`node tools/wo-sweep.mjs` passes.** Ticked. `52 checks · 49 passed · 0 failed · 3 to review`,
   `EXIT=0`, run last after every doc edit. The 3 are the standing reviews.
6. **The lines are copied verbatim, with evidence.** Ticked.

No 👤 or 📆 lines.

## The one harness change

In `tools/verify-shell.mjs` (+60/−2):

- **`MODULE_READING`, `readModules()` and `whatItReceived()`**, placed beside `saidSince()`. They read
  the page's Resource Timing for every `src/*.js` (status, decoded size, worker or not,
  `deliveryType`, duration), the document's own entry, the controller and registration state, and
  `caches.keys()`.
- **The comparison baseline is `moduleBaseline`**, read once after the first `load()`. That way no
  copy of SHELL has to be kept in step.
- **The output is appended to `load()`'s throw and `mustBoot()`'s throw**, and to nothing else. It is
  bounded at 3s.
- **Why I trusted Resource Timing:** measured on this Edge, a module blocked outright, with the worker
  on, still gets an entry: status 0, 0 bytes, not through the worker. The page reports no error at all
  in that case.

**Departure from the brief's sequencing.** The brief said to add diagnostics *if the first failure
carries no page error*. I added this one before any failure, during run 1. My reasoning: at about one
failure in twelve runs, each occurrence costs hours, so the first one must carry everything. The
previous occurrence that had error capture to work with (the pre-capture run) read exactly the silent
shape. Earlier runs still count as occurrences, and the three green runs are all on the final tree,
which is the condition the brief attached.

## Decisions the work order did not settle

- **Should conditional lines 2 and 3 be ticked when their premise never arose?** I ticked them, said
  so in the evidence, and flagged it above.
- **Whether to keep or move N.** I kept it at 6 after finding the true rate. Moving it mid-collection
  would have made the stopping rule depend on the results.

## Temptations declined, and follow-ups

- **A run-wide `Network.enable` to capture `loadingFailed`.** I declined it because it changes what the
  run is (TESTING § 4). Do not add it without arguing that.
- **2,515 stale `pb-verify-*` browser profiles** in `%LOCALAPPDATA%\Temp` (counted with `ls | wc -l`),
  dated back to 2026-08-12. `fs.rm` evidently fails while Edge still holds the files. This is unrelated to this flake,
  since every run gets a fresh `mkdtemp`, but it is disk litter. I did not touch it. It is a candidate
  S work order.
- **A soak inserted at position 88** (rather than at the end), or a soak that repeats sections 84–96,
  could test the "something a late section leaves behind" suspect. I did not do it because it is
  outside N and the sections are not idempotent.

## Files changed

- `c:\dev\planbook\tools\verify-shell.mjs`: the instrument.
- `c:\dev\planbook\tools\README.md`: the WO-1.92 ledger paragraph after WO-1.93's. No count moved.
- `c:\dev\planbook\TESTING.md`: § WO-1.92, under Phase 1, after § WO-1.93.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: the six WO-1.92 Acceptance
  boxes ticked. The status line is still 🤖 CLAIMED, as the orchestrator set it; I ran no `--tick`.
- `c:\dev\planbook\.claude\dispatch\WO-1.92-status.md`: run-by-run evidence, appended as each run
  ended.
- `c:\dev\planbook\.claude\dispatch\WO-1.92-result.md`: this file.

Scratch files, never in the tree, all in the session scratchpad
`C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\266d31b9-e952-46b5-95ec-a6a594378800\scratchpad\`:

- `probe\rt.mjs` (the Resource Timing measurement);
- `probe\make-probe.mjs` and its generated copies (the MUTATION probes);
- `soak\make-soak.mjs` and its copies;
- `runs.sh`;
- `run1.log`…`run6.log`, `soak\soak.log`, `probe\probe.log`, `sweep0.log`, `sweep-final.log`.

## Required outputs, verbatim

`grep -rn MUTATION tools/ src/ sw.js` matches only prose that was already there before this work
order. Nothing is mine, and there is nothing in `sw.js`:

```
tools/README.md:1518, 1524, 1531, 1573, 1612, 1613, 2071, 2115, 3697 (ledger prose)
tools/verify/keys-legend-guards.mjs:71, 217, 264, 269
tools/verify/outreach.mjs:1578
tools/verify/score-grid.mjs:1777
tools/verify/score-search.mjs:829
tools/wo-gate.mjs:2800
src/shell.js:1095   ("A CLASS MUTATION ADDED LATER ADDS ITS LINE HERE")
```

`git status --short`:

```
 M TESTING.md
 M plans/work-orders/phase-1-shell-store-roster.md
 M tools/README.md
 M tools/verify-shell.mjs
?? .claude/dispatch/WO-1.92-brief.md
?? .claude/dispatch/WO-1.92-status.md
```

(plus this result file once written). `git diff --numstat`:

| Added | Removed | File |
|---|---|---|
| 191 | 0 | `TESTING.md` |
| 7 | 7 | `plans/work-orders/phase-1-shell-store-roster.md` (one line is the orchestrator's CLAIMED status) |
| 11 | 0 | `tools/README.md` |
| 60 | 2 | `tools/verify-shell.mjs` |

No line endings were rewritten.

## Draft CHANGELOG entry (the teacher decides)

> **The harness says what a page that never booted was handed (WO-1.92).** When a reload's page fails
> to start, the failure message now lists, module by module, what that page actually received: which
> module came back empty or never arrived, whether the offline copy (the service worker) or the
> network answered it, and what the worker held at the time. Until now the commonest version of this
> failure said nothing at all. It recurs about once in twelve full runs, always late in the run, and
> it did not recur in six runs today, so its cause is still open. The next time it happens, the
> message will say which of two places to look.
