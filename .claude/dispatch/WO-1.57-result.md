# WO-1.57 — result

**Implementer:** Claude (Opus), 2026-09-29. Row was already claimed; no `--start`/`--tick`/`--release`
run. Nothing committed.

## What changed

- `tools/verify-shell.mjs` (the only code change):
  - The recording sits **inside the module-level `send`**. A new `noteWhatItChanges(method, params, reply)`
    watches five methods and records each one on its successful reply:
    `Emulation.setTouchEmulationEnabled` sets `emulation.touch` to its params, or `null` when disabled.
    `setDeviceMetricsOverride` and `clearDeviceMetricsOverride` set `emulation.metrics` to the params or `null`.
    `Page.addScriptToEvaluateOnNewDocument` adds the returned identifier to the running section's set.
    `removeScriptToEvaluateOnNewDocument` deletes it again, on the send.
  - The browser loop sets `sectionStart = { touch, metrics, scripts: new Set() }` before each section,
    which records the state that section received.
  - `putBackWhatTheSectionChanged()` runs as the first step of `recoverPage()`'s `try`, before the
    reload. It removes the section's leftover scripts, then puts back the viewport, then touch. It sends
    only what differs from the section's start, and uses the clear call when the start was "not set".
  - `runSection()` is untouched, and § 25 reads the same lines, 461-479.
- `TESTING.md`: new § WO-1.57. It covers how the state is captured and restored, what is out of reach,
  runs A-D, and all five boxes ticked.
- `tools/README.md`: one sentence in the "A section that throws" paragraph, saying the recovery now
  puts emulation and scripts back. The check count is unchanged.
- `plans/work-orders/phase-1-shell-store-roster.md`: all five Acceptance boxes ticked. The status
  line was left as the orchestrator set it.

Nothing under `src/` moved. No section file is edited in the final tree: the four touched for plants
and probes were copied back from copies saved beforehand. WO-1.56's `finally` in `date-zero-key.mjs`
is untouched. No `check(` was added.

## Acceptance, line by line

All runs are the whole harness on the real clock, 2026-09-29. `EXIT=` is read from each log.

- Run A, baseline (HEAD plus two temporary `console.log` probes, marked `MUTATION WO-1.57`, at the
  heads of `categories-weights.mjs` and `first-run.mjs`): 1598 · 1598 · 0 · 0, EXIT=0.
  - categories-weights probe: coarse false, touchPoints 0, innerWidth 750.
  - first-run probe: fakeGis false, google "undefined", innerWidth 1280.
- Run B, with the change plus planted throws in `classes-terms.mjs` (inside the 768×1024 touch window,
  after the "pointer really is coarse" check) and `sync-button.mjs` (after the stand-in was configured
  and reloaded, right after `const fresh = await read()`): 1478 · 1463 · 11 failed · 4 skipped, EXIT=1.
  - Both throws were reported as FAILs naming their file and line.
  - categories-weights probe: **false / 0 / 750**, identical to A.
  - first-run probe: **fakeGis false, google "undefined"**, identical to A.
- Run C, the same with `await putBackWhatTheSectionChanged();` commented out: 1478 · 1462 · 12 failed ·
  4 skipped, EXIT=1.
  - categories-weights probe: **true / 5 / 768**.
  - first-run probe: **fakeGis true, google "object"**.
  - The only line that differs between B and C (stripped `diff`) is first-run's *"the run's own device
    was never touched … no stand-in library"* check, which went PASS to FAIL.

1. **[x] The throw in the classes-terms touch window leaves categories-weights reading normal values.**
   Run B matches run A on all three values. It is recorded in TESTING.md, and it was reverted before
   anything else was written.
2. **[x] Mutation-proved.** In run C all three values differ.
3. **[x] A sync-button throw leaves the next section with no stand-in, and this is mutation-proved.**
   The evidence is runs B and C above.
   - One run carried both mutations. The readings do not confound each other: classes-terms adds no
     page-start script, and `window.google`/`__fakeGis` come only from one.
   - Revert: the four section files were copied back from their saved originals and the restore line
     was put back.
   - `grep -rn "MUTATION WO-1.57\|WO157-PROBE" tools/ src/` then returned nothing (exit 1).
   - **`grep -rn MUTATION tools/ src/` is NOT empty.** It reads 17 lines, all pre-existing prose (for
     example "THE MUTATION MATCHED NOTHING" in keys-legend-guards.mjs). That is the same 17 that
     `git grep -c MUTATION HEAD -- tools src` counts at HEAD. None of them is mine.
4. **[x] Whole harness green, and the check list is unchanged.** Run D, final tree: 1598 · 1598 · 0 · 0,
   656s, EXIT=0. The stripped PASS/FAIL/SKIP list is identical to run A: the same names, order and
   states. WO-7.12's flake did not fire in A or D.
5. **[x] wo-sweep green.** `45 checks · 42 passed · 0 failed · 3 to review`, exit 0. The reviews are the
   standing three. § 25 passes at 461-479, and § 11 matches 1584 call sites. I re-ran it after the last
   doc edit. `wo-gate.mjs --audit` passes with exit 0.

The planted runs B and C also pay § 25's standing debt, which is owed by anyone who edits
`recoverPage()` or the browser loop. The containment still records each throw, reaches the summary,
and exits 1.

## Decisions the work order didn't settle

- **Recording inside `send`, not in a wrapper on `h.send`.** Helpers such as `load` and `dateResetOn`
  close over the module-level `send`, so recording there sees every CDP call in the run.
  `tools/verify/` opens no socket or target of its own (grep for `Target.`, `sessionId` and `ws.send`
  finds nothing).
- **A failed restore makes `recoverPage()` return false** (the run stops and names the sections that did
  not run) rather than carrying on over emulation nobody chose. This follows the Trap that says a
  failing CDP call goes in the same catch.
- **Only differing state is re-sent,** so a section that tidied up before it threw costs no CDP call.
  Removals are tracked on the send, so a script the section already removed (for example
  worker-takeover's `finally`) is never removed twice. That path was reasoned from the code, not run
  with a plant.
- **The baseline is what the section received,** not what a normal run hands on. After a throw, the next
  section therefore gets the failed section's *starting* state. For the two planted pairs that is the
  same as the normal hand-off. It will not be for a section whose normal exit differs from its entry.
  This is the ruling the work order asked for.

## Declined / out of scope (noted, not acted on)

- **`Emulation.setEmulatedMedia` (24 call sites, mostly print tests) and `setTimezoneOverride` (2, in
  history-dialog-write.mjs) are not put back after a throw.** A throw while the page is in `print` media
  would hand `print` on. It would be the same few lines, but the work order named touch and metrics
  only. I suggest a follow-up booking.
- Leftover `sessionStorage`/`localStorage`/IndexedDB fixture state after a throw, such as sync-button's
  opt-in and the stand-in config, or classes-terms' unset `h.classesBooted`, which causes three skips
  and several downstream FAILs identically in B and C. This is the WO-1.56 "fixture family", explicitly
  out of scope.
- Because of that, categories-weights skips in both planted runs. The emulation half's proof is the
  probe, not a check, just as in WO-1.56.

## Not verified

- No 👤 or 📆 lines exist on this work order. Nothing renders or reaches a device.

## Draft CHANGELOG entry (the teacher's to use or not)

> The browser harness now cleans up after a section that crashes. Before it reloads the page for the
> next section, it takes off any page-start scripts the failed section left behind, such as the fake
> Google sign-in, and puts the screen size and touch setting back to what that section started with.
> Before this, one crash could leave the rest of the run testing a pretend iPad or a fake Google
> library, with nothing to say so. Nothing in the app changed.
