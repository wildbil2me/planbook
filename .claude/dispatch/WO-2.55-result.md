# WO-2.55 — result

**Six of seven Acceptance lines are closed and ticked. The seventh is 👤 (the iPad) and is still open.**
Nothing is committed. Status is still `🤖 CLAIMED`; I did not run `--tick`, `--handoff` or `--start`.

## What landed
- `c:\dev\planbook\src\attendance.js`
  - **`setMarkTime(studentId, text, date)`** sits beside `setNote()` and uses its gates: `writableDate`, `offTermDay`, a record that is not an exception, and a mark on that student. It adds two more: the code must be `T` or `D`, and the cell must carry no `passId`.
  - It parses `HH:MM`, and anything else that is not blank is refused. It builds the stamp as `stampNow(new Date(y, m-1, d, hh, mm))`, so the offset comes from the mark's own date.
  - A blank field deletes `at`. An unchanged value writes nothing.
  - It does not repaint the dialog. It does repaint the one registry column behind the dialog (see decisions).
  - **`wallClock(iso)`** is a new export that gives `HH:MM` for the input's value.
  - **`editableMark()`** now also returns `canTime` and `timeLocked`.
- `c:\dev\planbook\src\attendance-report.js`
  - `writeBlock()` draws an `<input type="time">` carrying `data-attendance-time` and `data-attendance-time-date`, for `canTime`.
  - A pass-linked `D` gets one sentence instead of the input: the pass owns its time.
  - The chip text is now built by `markSays()`.
  - A new `window` `input`/`change` listener (`followTime`) updates only the chip's text.
  - The header comments now say three writers.
- `c:\dev\planbook\src\shell.js`: the time field is routed on `input`, beside the note, and again on `change`. The attribute catalogue has the new attribute.
- `c:\dev\planbook\src\attendance.css`: `.attendance-report-write-time`, plus `min-height/min-width: 44px` in the coarse block.
- `c:\dev\planbook\sw.js`: `CACHE` `planbook-shell-v145` → `v146`.
- `c:\dev\planbook\docs\data-model.md` § Attendance: the `at` sentence is reworded to "the tap stamps only on today's column; the teacher may type a time on any writable day". It also covers the offset rule and the pass exception.
- `c:\dev\planbook\tools\verify\history-dialog-write.mjs`: a new WO-2.55 block with nine `check()` sites, eight of which run on a green run.
- `c:\dev\planbook\tools\README.md`: call-site count 1573 → 1582, plus a ledger paragraph.
- `c:\dev\planbook\TESTING.md` § WO-2.55, added directly after § WO-2.56.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md`: Acceptance boxes 1–6 ticked. The 👤 box is left open.

## Acceptance, line by line
1. **[x] Past-day `T` at 8:20.**
   - The harness pins the page zone to America/New_York and picks the nearest weekday whose offset differs from today's: 2026-03-06 at `-05:00`, against today's `-04:00`. It unlocks that day with `editDay`, marks the student `T` through `setMark`, which writes `{"code":"T"}`, then clicks the name and sets the field to `08:20`.
   - The document holds `{"code":"T","at":"2026-03-06T08:20:00-05:00"}`. The chip reads "Tardy at 8:20 AM" and the input element survived the write.
   - After the dialog closed, the grid cell read `8:20a`, and a reopened dialog read `08:20`.
2. **[x] Today's column.**
   - The field opened on `08:14`. Typing `07:55` gave `{"code":"T","at":"2026-09-28T07:55:00-04:00"}`, and the cell read `7:55a`.
   - `setMark` to `A` and then back to `T` gave a fresh stamp (`21:48:47-04:00`).
   - Caveat: the cycle was driven through `setMark()`, the writer every tap routes through, not by clicking the cell.
3. **[x] Pass-linked `D`.** The dialog draws 0 time inputs and shows the sentence. A direct `setMarkTime()` left the cell byte-identical.
4. **[x] `A`/`E`/`P`/`U`.** Each block has 0 time inputs. A direct `setMarkTime` leaves `{"code":"A"}`, `{"code":"E"}`, `null` (no entry) and `{"code":"U"}`.
5. **[x] Mutation-proved.**
   - The mutation spliced `stampNow()`'s offset (the moment of typing) onto the typed time and was marked `MUTATION`. I ran a trimmed copy of `verify-shell.mjs` that ends at `history-dialog-write.mjs`.
   - Result: `376 checks · 375 passed · 1 failed`, exit 1. The failure was the past-day check: `...T08:20:00-04:00` against the expected `-05:00`.
   - I reverted before writing anything else, by copying the pre-mutation file back; `cmp` says it is identical.
   - I deleted the trimmed copy from `tools/`. `grep -rn MUTATION src tools` finds only the standing prose hits (shell.js:956 and the README ledger).
6. **[x] Tools.**
   - `node tools/verify-shell.mjs` (full run): **`1596 checks · 1596 passed · 0 failed · 0 skipped`**, 50,699 lines, 638s, `EXIT=0`, read from the log. This was 1588 before.
   - `src/` is byte-identical to the tree that run tested: the mutation was the only change after it, and it is reverted and `cmp`-checked.
   - `node tools/wo-sweep.mjs`: **45 checks · 42 passed · 0 failed · 3 to review** (the three standing REVIEWs).
   - `wo-gate.mjs --audit` passes.
7. **[ ] 👤 iPad.** Not verifiable here, and not ticked. `CACHE` is bumped to v146, so a force-quit and relaunch shows the build.

## Decisions the work order didn't settle
- **Which event writes:** both `input` and `change`, with the writer doing nothing when the value is unchanged. The document then always holds what the field shows, so a half-spun wheel cannot leave a stale `at`, whichever event iOS fires last. The reasoning is in a comment at the listener.
- **Repaint:** `setMarkTime` repaints the single registry column behind the dialog, via `paintColumn(on)`. It never repaints the dialog.
  - Why: a time is drawn in the grid cell and a note is not, and without the repaint the cell would show the tap's time after the dialog closed.
  - This is a deliberate departure from `setNote()`'s "does not repaint", which I read as being about the surface the field sits on. It is argued in the writer's header.
  - A verifier reading "It does not repaint" literally may question it, so it is flagged here.
- **Chip:** it follows the field through one text-node update in a `window` listener. Nothing is redrawn.
- **Pass sentence wording:** "This dismissal closed a hall pass, and the pass owns its time, 9:02 AM — one clock reading for both, so it is not edited here." The chip next to it also shows 9:02, so the time appears twice. That was left as is, but the sentence could drop it.
- **Offset for a time in the spring-forward gap:** it takes the `Date` constructor's answer (02:30 becomes 03:30). This is noted and not guarded.

## Not done / out of scope
- I did not write the `CHANGELOG.md` entry. A draft is below.
- I did not add editing of a pass's own times or a pass-linked `D`'s time (ruling 3).

## Draft CHANGELOG entry
> **A tardy's time can be corrected afterwards (WO-2.55).** Tap a student's name: beside the note in the history dialog there is now a time field for a tardy or a dismissal. It opens on the time the tap stamped, or empty on a past day that was never stamped. Whatever you set is what the mark says, and the grid shows it when the dialog closes. A time typed for a past day carries that day's own clock offset, so an October tardy typed in November is still an EDT time. The tap itself is unchanged: one tap per student, and it stamps only on today's column. A dismissal that closed a hall pass keeps the pass's time and says so.
