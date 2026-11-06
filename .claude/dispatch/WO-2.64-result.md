# WO-2.64 — result

Implemented by the work-order-implementer (Sonnet). Nothing committed; no 👤 ticked; CHANGELOG not written.

## Acceptance, line by line

1. **Tones are the low pulse, note for note, harness asserts 6/440/0.6 then 8/523.25/0.62 — met.**
   `playAlertFive()` / `playAlertTen()` in `src/alert-sound.js` copy the audition page's `pulse` entry
   (absolute `t`, triangle, attack 0.01), still two functions. The WO-2.29 check in
   `tools/verify/attendance-passes.mjs` asserts notes/first/peak/oscillators 6/440/0.6/6 and
   8/523.25/0.62/8, keeping the three-axis difference. Three downstream assertions that read the old
   figures (unmuted tone ~932, WO-2.31's two tones) moved too — the brief named only two sites.
2. **Typeless note plays square @ 0.015 — met, proved by a new check.** `playToneSequence()` reads
   `n.type || 'square'` and `n.attack || 0.015`. It is now **exported** (decision below); the harness
   wraps `createOscillator`/`createGain` on the caught context instance, plays a bare note and a typed
   note, and asserts `["square","triangle"]`, attacks `[0.015,0.01]`. Green on both runs.
3. **660 mutation goes red — met.** Changed the first note of `playAlertFive()` to 660 (marked
   `MUTATION`), full run: `2209 checks · 2207 passed · 2 failed`, failures = the WO-2.29 check and
   WO-2.31's first-tone check (both show `"first":660`). Reverted by hand; the red output is in
   `TESTING.md` § WO-2.64. `grep -rn MUTATION` shows only pre-existing prose uses of the word.
4. **verify-shell and wo-sweep pass; CACHE bumped — met.** Final clean `verify-shell`:
   `2209 checks · 2209 passed · 0 failed · 0 skipped`, 1195s, `EXIT=0` (read from the log).
   `wo-sweep`: `52 checks · 49 passed · 0 failed · 3 to review`, exit 0. `CACHE` v210 → v211.
5. **👤 iPad — NOT verified, box left blank.** Needs a real iPad with Sound alerts on (it is a
   Settings switch since WO-1.71, off by default; the brief's "header speaker" wording is stale).
6. **`TESTING.md` § WO-2.64 — met.** Under Phase 2, after WO-2.63, lines verbatim with evidence.

## Decisions the work order did not settle
- **Exported `playToneSequence`.** The default claim needs a note list with no `type`/`attack` and
  neither builder returns one now; the module is already on `window.planbook.alertSound`. A comment
  at the export says it is for the harness only. Alternative would have been recording type/attack in
  the log shape, which still could not exercise a typeless note.
- **No section filter exists** in `verify-shell.mjs`, so the mutation round was a full 1224s run.
- `tools/README.md`: call-site count 2202 → 2203 (sweep went red on it first) plus a WO-2.64
  paragraph beside WO-2.63's.

## Files changed
`src/alert-sound.js`, `sw.js`, `tools/audio-probe.html` (notes, header sentence, and the two play
loops now honour `type`/`attack` — the loops had to or the probe would still play square),
`tools/verify/attendance-passes.mjs`, `tools/README.md`, `TESTING.md`, this file.
Owner's uncommitted booking edits untouched. `alertSoundOn` default, thresholds, `unlockAudio()`,
one-tone-per-tick untouched.

## Temptation declined
`tools/audio-probe.html` still has a 660 Hz sine in the `<audio>` primer WAV (line ~160) — a
different probe, not the app's tone; left alone per "nothing else in the probe".

## Draft CHANGELOG entry
The overdue hall-pass tone is now the Low pulse: a soft low "ba-dum", three times at five minutes and
four quicker, higher times at ten, instead of the buzzy square-wave beeps lifted from Roll Call!. The
owner chose it on 2026-11-05 from seven auditioned options. Sound alerts still defaults off; turning
it on is unchanged. Needs one iPad listen before WO-2.57 makes sound the default.
