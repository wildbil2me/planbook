# WO-1.55 — implementer's result

**Verdict I am claiming:** all four Acceptance lines met. There are no 👤 or 📆 lines. The cause is
the browser, not `src/`. `src/` was touched only by the mutation, and that is reverted.

## The cause

**Edge 154.0.4258.37 ignores `Input.dispatchKeyEvent` digits into a focused `<input type="date">`
while `Emulation.setTouchEmulationEnabled` is on.** `keydown` and `keypress` arrive, but no
`input` or `change` follows and the value does not move. Four pieces of evidence, all from
2026-09-27, all recorded in `TESTING.md` § WO-1.55:

1. **It is not an earlier section's state.** `date-zero-key` fails the same way with only
   `localstorage-prefs` ahead of it.
2. **The keys arrive and the field ignores them.** Capture listeners on the real Due field with
   touch on logged keydown/keypress/keyup and no input/change. `hasFocus()` was true and nothing was
   over the field. With touch off, on the same page and the same field, it typed.
3. **It happens with no app loaded.** A bare date input on `about:blank` in Edge 154 types with
   touch off and does not type with touch on, whatever the mobile flag says. **Chrome 153.0.8010.53**,
   which is installed on this machine, types in all four emulation states.
4. **The unmodified section passes on Chrome 153:** 9/9.

Timeline: Edge's own update log shows 154 installing at 16:01 EDT on 2026-09-26. The
`Application` directory was last written at 22:02:10 that evening, which fits Edge's deferred
launcher swap. Stray headless `msedge.exe` processes would hold that swap off, and WO-7.10 counted
~36 of them. WO-7.10's green run was ~20:00–20:49 and the first red ~22:15. The booking's "updated
2026-09-24, before the green run" came from `msedge.exe`'s file mtime, which is the build date, not
the install date. **The 22:02 swap is inferred from a directory mtime, not read from a log.** What is
proven is the engine difference.

## The fix (harness only)

In `tools/verify/date-zero-key.mjs`, touch emulation now goes **off** after the editor has been
opened the usual way (the clicks stay on the coarse pointer) and before the first key. It goes back
**on** before the section closes the modal, so the page is handed on as it was received. The keys
are still real `Input.dispatchKeyEvent` digits dispatched at the page, and every assertion is
unchanged. Why off is also the faithful setting: known-bugs § 1 calls this the data-loss defect "on
the laptop", and a keyboard is a fine pointer.

**One new check, the canary.** A bare date input planted inside the editor panel is typed `0` `9`
and must read `2026-09-20`, and then it is removed. If it goes red, the browser has stopped taking
keys and the app has not had the chance to do anything wrong. Its failure text says so in capitals.
This is the split this work order had to make by hand.

## Acceptance, line by line

- [x] **The cause is named in `TESTING.md` § WO-1.55, with the evidence.** Written, with the probes,
  the two browsers, the four emulation states, and the timeline including its inferred part.
- [x] **The three checks are green on the whole harness, real clock.** `node tools/verify-shell.mjs`,
  no flag, 2026-09-27 ~06:25–06:35 EDT: `1550 checks · 1550 passed · 0 failed · 0 skipped`, 582s,
  `EXIT=0`, read from the log.
- [x] **Mutation-proved, and reverted before anything else was written.** I put
  `input.replaceWith(dateInput(assignment, field));` back into `assignmentDateCommitted()` under
  `MUTATION WO-1.55`. The section run read `10 checks · 6 passed · 4 failed`. The three checks went
  red with the original symptom (`same element = false, caret in BODY, field ""`), and so did the
  WO-1.48 no-rebuild check. The canary stayed green, as it should. I reverted by hand;
  `git diff -- src/` is empty and `grep -rn "MUTATION WO-1.55" src tools` finds nothing.
  **Extra:** turning touch back on at the new line turned the canary red, reading
  `coarse = true, 2026-11-20` with its browser clause. The file was restored from a saved copy and
  `cmp` shows it identical to the delivered file.
  **Caveat:** the mutation runs used a scratch copy of the harness in the session scratchpad, with a
  section filter running only `localstorage-prefs` and the section under test. They were not
  whole-harness runs. The whole-harness runs are the baseline and the final green.
- [x] **No other check in the harness changes state.** The baseline was taken before any edit:
  `1549 · 1546 passed · 3 failed`, 585s, `EXIT=1`, with exactly these three failing. I diffed its
  PASS/FAIL/SKIP line for every check (detail text stripped) against the final run. The only
  differences are the three FAIL→PASS and the one added canary PASS. The WO-7.12 drive-sync flake
  fired in neither run. **Note for the verifier:** the check count grew by one, and I read "no other
  check changes state" as being about existing checks. Say so if you read it more narrowly.

Other commands: `node tools/wo-sweep.mjs` gives `45 checks · 42 passed · 0 failed · 3 to review`,
exit 0, reading 1539 call sites matching `tools/README.md:1226`. `node tools/wo-gate.mjs --audit`
gives PASS, exit 0.

## Files changed

- `c:\dev\planbook\tools\verify\date-zero-key.mjs`: touch off/on around the typing, plus the canary check.
- `c:\dev\planbook\tools\README.md`: call-site count 1538 → 1539, and a WO-1.55 count-history paragraph after WO-7.11's.
- `c:\dev\planbook\TESTING.md`: new § WO-1.55 at the end of Phase 1.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: four Acceptance boxes ticked. The status line was left as the orchestrator's `🤖 CLAIMED`.
- `c:\dev\planbook\.claude\dispatch\WO-1.55-result.md`: this file.

`src/` is byte-identical to HEAD, so no `CACHE` bump is owed.

## Decisions the work order did not settle

- **Where the pointer changes.** I switch it only for the typing and leave the clicks as they
  were, so nothing else in the section moves. The alternative was running the whole section on a
  fine pointer.
- **Adding a canary check (+1 call site)** instead of folding the browser test into the
  existing precondition check. A separate line names which side failed.
- **The canary goes inside `#assignmentModal .modal-panel`**, so the dialog's focus handling
  has no reason to pull the caret back out of it. It is removed straight after it is read.

## Declined / out of scope (noted, not done)

- **A numbered trap 11 in `tools/README.md` § "Driving a browser over CDP"** ("touch emulation
  makes a date field ignore keys"). The list's rule is "hit and diagnosed twice by two agents". The
  WO-7.11 implementer and verifier hit this but did not diagnose it, so I left it for the owner. The
  comment at the site and the TESTING entry carry it.
- **Other sections:** none types digits into a date field. `attendance-passes.mjs` and
  `calendar-events.mjs` set dates by value and say so at the line, so nothing else is exposed today.
- I did not establish whether Edge's behaviour is intended (a picker-only field on touch, like
  Android) or a regression. I also did not measure whether a touchscreen laptop reports
  `pointer: coarse` or whether real touch behaves like the emulation.
- I did not touch the WO-7.12 drive-sync race.

## Draft CHANGELOG line (the teacher's call)

> Harness: the date-field keystroke checks type on a keyboard pointer again. Edge 154 stopped
> accepting typed digits into date fields under touch emulation, and a new canary check now names
> that as the browser's doing instead of reporting it as the app's.
