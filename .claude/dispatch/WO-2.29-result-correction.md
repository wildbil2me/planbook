# WO-2.29 — correction round result

**Work order** `plans/work-orders/phase-2-attendance.md` § WO-2.29 · **Round** 2 (correction) ·
**Date** 2026-08-14 · **Route** Claude, work-order-implementer

The first round's record is `.claude/dispatch/WO-2.29-result.md` and is untouched. This file is the
second half of the audit trail: what was wrong, what replaced it, and what is still owed to glass.

---

## The one-line version

`src/alert-sound.js` minted a fresh `AudioContext` at alert time, five minutes after any touch. On
current WebKit that context reports `running`, advances `currentTime`, and starts its oscillators
onto no output — so the tone could never have sounded on the iPad, and the seam said `running`
throughout. It now holds **one context, constructed inside the first gesture, never closed**, and
schedules every tone on it. The tuned half of the lift — frequencies, note counts, durations, gains,
and `playToneSequence()`'s scheduling loop — did not move.

---

## Against the Acceptance list, one line at a time

Lines 1–5 and 7 were inherited as `[x]` from round 1 and are **not** taken on trust: the audio path
changed underneath all of them, so each was re-established on the corrected tree by a run I read.

### 1. Crossing either threshold plays its tone, and the two are distinguishable — re-established, `[x]` stands

Verified by the existing check, re-run on the corrected code:

> PASS | each threshold asks for its own tone … :: 2 tone(s) requested across the two winds:
> `[{"level":1,"notes":10,"first":660,"peak":0.32,"played":true,"oscillators":10,"state":"running","ctx":1,"ctxTime":12.901,"error":""},{"level":2,"notes":12,"first":700,"peak":0.4,"played":true,"oscillators":12,"state":"running","ctx":1,"ctxTime":13.171,"error":""}]`

Ten oscillators at 660 Hz then twelve rising from 700 Hz at the higher gain, distinguishable on all
three axes, both started on the held context. The frequencies, note counts, durations and gains are
byte-for-byte what round 1 delivered — I did not touch `playAlertFive()`, `playAlertTen()`, or the
scheduling loop inside `playToneSequence()`. **What this does not say is that a room hears it.**

### 2. `announce()` still fires at both thresholds, same sentence, comment names it the mirror — re-established, `[x]` stands

`src/attendance.js` is unchanged by this round (`git diff` shows only round 1's edits). The harness
asserts the sentences verbatim at both thresholds and again with the sound muted — *"has been out on
a nurse pass for 5 minutes."*, *"… for 10 minutes."*, *"… quick pass for 5 minutes."* — all green in
the delivered run. The comment at `src/attendance.js:3025`–`3037` still names the sentence the
accessible equivalent of the tone (WCAG 1.4.1), and grep for a claim of soundlessness in that file
returns only that WCAG line.

### 3. `soundsOn` silences the tone, leaves announcement and tint alone, `planbook_`, never in the document — re-established, `[x]` stands

Three existing checks green on the corrected tree: the header tap writes `planbook_soundsOn = "false"`
with `the string "soundsOn" anywhere in the year document = false`; the muted threshold records
`played: false, oscillators: 0` while the sentence, the card tint and `alerted = 1` are unchanged; the
second tap sounds again at the second pattern. `src/prefs.js` and the control are untouched by this
round.

### 4. The tone is asserted through a seam, and the check fails if either threshold stops asking — re-established and **strengthened**, `[x]` stands

Round 1's two mutations (gating `playOverdueAlert()` to one level) still bracket this line; I did not
re-run them, because I changed nothing in the caller or in the gating and both arms are unchanged
code. What I did add is the check this line was missing:

**One new `check()` call site** (759 declared, run prints 757), in the same WO-2.9 hall-pass block,
not in a loop and not a failure arm:

> PASS | both tones were scheduled on the ONE AudioContext the first gesture made — the alerts and
> the wake-ups mint no others, and nothing closes it :: before the winds
> `{"contexts":1,"origin":"gesture","state":"running","currentTime":12.731,"armed":true}`, after them
> `{…,"currentTime":13.432,…}`; the five-minute tone was scheduled on context 1 at its clock 12.901s
> and the ten-minute tone on context 1 at 13.171s; `src/alert-sound.js` constructs a context at
> line(s) `[162]`, in `"function unlockAudio() {"`

It asserts, in one place: exactly one context over the page's life, born in a gesture, still open
(`state` read live off the context, so a re-added `close()` reports `closed`), both tones on it, its
clock **older than the reading taken before the winds** rather than older than a number written into
the harness, and — read off the source — exactly one `new (window.AudioContext …)` in the module with
`unlockAudio` as the nearest declaration above it.

**Both mutations were watched failing.** Full runs, not reasoning:

| mutation | result | what went red |
|---|---|---|
| `playToneSequence()` mints its own context again — *the build that shipped and failed* | `757 · 756 passed · 1 failed` | only the new check: tones *"on context 1 at its clock **0s**"* twice, and `[162,284]`, "(2 constructor call sites)" |
| the `visibilitychange` handler mints and closes one, as the shipped build did | `757 · 756 passed · 1 failed` | only the new check, and **only its source clause**: `[162,210]`, "(2 constructor call sites)" — every dynamic reading identical to green |

The first is the point of the whole round: **the four checks from round 1 stayed green under it**,
with ten and twelve oscillators started on a context reading `running`, which is exactly what the iPad
reported while making no sound. The clock is what tells them apart — `0s` says born at the alert,
`12.901s` says born at a tap and kept.

The second mutation is the honest limit stated as a result: a context minted outside the module's own
unlock moves **none** of the dynamic numbers, because nothing in the page can observe a construction
it was not told about. That is why one clause is read off the source, and it is the only clause that
catches that shape. `src/alert-sound.js` was restored byte-identical after both
(md5 `f49d75845807edce9dbfdf16d9beb5bc`); the delivered file is that plus one comment rewrap
(md5 `d14cd751221b16ca30933f10b8acdc48`) and the final green run is a run of the delivered file.

### 5. No comment in `src/attendance.js` still says this app has no sound — re-established, `[x]` stands

`grep -in "no sound|sound-only" src/attendance.js` returns one line, `:3029`, and it is the WCAG
sentence saying the announcement exists *so that the alarm is not sound-only*. That file is unchanged
this round.

### 6. Audible on the teaching iPad, installed PWA, off the registry, after a background and resume — **`[ ]`, and I did not touch the box** 👤

I have no iPad and no machine can close this. **Nothing in this report is offered as evidence for it.**
What I did instead is make the next run decisive, per the brief:

- **The `TESTING.md` recipe is rewritten** for the new mechanism, in two legs that separate the two
  things that can be wrong. **Leg 1 (no suspend):** send a student out — *that tap is the unlock, there
  is no separate "tap anything once" step any more* — move to Scores, stay in the app, wait five
  minutes. A tone here proves the held context sounds from outside a gesture at all. **Leg 2
  (Acceptance line 6):** same setup, background six minutes, come back; pass is a tone on the way in.
- **What a fail tells the owner next** is written down: leg 1 failing means the suspend is irrelevant
  and the alert would have to be *held* until the next gesture rather than played (a queue, and its own
  work order). Leg 1 passing and leg 2 failing means resume-outside-a-gesture does not restore output
  after an interruption — tap once and stay past ten minutes to confirm the re-arm works. Silence even
  then, with the speaker un-slashed, is not the unlock at all, and `audio-probe.html`'s probe 1 answers
  that in one tap.
- **`sw.js` is bumped `v59 → v60`.** Without it the installed iPad keeps serving the build that failed
  and would fail line 6 for a reason that has nothing to do with audio.

### 7. Both commands print what they printed before, but for the count — `[x]`, from output I read

- `node tools/verify-shell.mjs` on the delivered tree: **`757 checks · 757 passed · 0 failed · 0 skipped`**,
  19,877 lines, 26.3 lines per check, **243s**, exit 0. (Five full runs this session: two earlier
  greens at 244s and 242s on trees differing from this one by a harness constant and a comment rewrap,
  the two mutation runs above, and this one on the delivered tree.)
- `node tools/wo-sweep.mjs`: **`18 checks · 16 passed · 0 failed · 2 to review`**, exit 0. Both REVIEWs
  are the standing pair, `src/alert-sound.js` still listed on the sensitive-name REVIEW for the same
  two lines of prose at the same total of 297 mentions, and *"every SHELL file change is paired with a
  CACHE bump"* passes on `planbook-shell-v60`.
- `tools/README.md` updated: **759** `check()` call sites (the sentence `wo-sweep` greps), and the
  WO-2.29 paragraph extended with the correction's one site and the run that measured it.

---

## Files changed in this round

| file | what |
|---|---|
| `c:\dev\planbook\src\alert-sound.js` | the unlock replaced: one gesture-born context, held, never closed; `visibilitychange` resumes it and re-arms; `playToneSequence()` is handed the context and records `ctx`/`ctxTime`; `alertAudioState()` added; the header comment and the seam comment tell the truth about what the log can and cannot say. |
| `c:\dev\planbook\src\shell.js` | the `window.planbook.alertSound` comment — an honesty pass naming why `alertSoundLog()` was not enough, plus the second seam function. |
| `c:\dev\planbook\sw.js` | `CACHE` `planbook-shell-v59 → v60`. |
| `c:\dev\planbook\tools\verify-shell.mjs` | one new `check()`, the prose either side of it corrected, `alertAudioState()` read before and after the winds. |
| `c:\dev\planbook\tools\README.md` | 758 → 759 call sites; the correction's entry and its measured run. |
| `c:\dev\planbook\TESTING.md` | superseded markers on the two now-false paragraphs (kept, not deleted), and **THE CORRECTION** appended after the FAILED block: what changed, the mutations, the fixture assumption, the new 👤 recipe, and what it still cannot prove. |

Deliberately untouched: `audio-probe.html` (not committed, not shipped, not edited, not deleted),
`src/attendance.js`, `index.html`, `src/prefs.js`, `src/shell.css`, and the work order's own Acceptance
list. The FAILED block in `TESTING.md` is byte-identical to what the owner wrote.

---

## Decisions the work order did not settle

1. **An alert with no context records `locked` and constructs nothing.** The alternative was to mint
   one lazily. I refused it: probe 2 says such a context is silent and probe 3 says it costs a capped
   slot and can hang. The cost is a theoretical missed first alert on a page nobody has touched —
   which in this app means a pass was issued without a tap, which cannot happen.
2. **The re-arm on `visibilitychange` is unconditional**, not gated on the state looking wrong. Gating
   it on `state !== 'running'` would trust the exact signal this failure proved untrustworthy.
3. **`keydown` joins `touchstart` and `pointerdown`.** Round 1 added `pointerdown` for the laptop; a
   teacher driving the app from a keyboard would otherwise never unlock audio at all. One more entry
   in an array, removed with the others on success.
4. **One clause of the new check is read off the source file.** Off-idiom for a browser harness, but
   `verify-shell.mjs` already reads `src/*.js` for the prefs sweep, and mutation 2 shows it is the only
   thing that catches a context minted somewhere the module does not count. It is not a second harness.
5. **The listener-order guarantee is written down rather than relied on silently.** `src/attendance.js`
   imports `src/alert-sound.js`, so the sound module's `visibilitychange` handler registers first and
   the context is resumed before `paintPassElapsed()` computes the alert the same event fires.
   Importing the other way round would reverse it, so the module says so at the listener.

## Out of scope, noted rather than done

- **A visible off-registry indicator** — still forbidden here, still needs its own work order and its
  own argument against the presentation-mode rule.
- **Deferring an alert to the next gesture** (a queue) is the plausible next move *if* leg 1 fails on
  glass. I did not build it: it changes when an alert fires, `markAlerted()` has already spent the
  alert by then, and it is speculative until the device says the held context is not enough.
- **Roll Call! is probably failing the same way** on iPad — its `dashboard.html:3451`–`3462` is the
  origin of the falsified unlock, and it is the live classroom fallback. I changed nothing over there;
  the owner's note in `TESTING.md` stands as the pointer.
- **`navigator.audioSession`** — not used, and not from caution: probe 1 and probe 4 were both audible,
  which rules the session category out rather than leaving it untested.
- **No `CHANGELOG.md` entry written.** Draft, if it helps: *"The overdue hall-pass alert now holds a
  single audio context opened by your first touch, instead of opening a new one each time it needs to
  sound. On iPad the old shape could never make a noise."*

## What this correction still cannot prove

That a room hears anything. No machine heard the tone, none can, and the seam that reports `running`
is the same seam that reported `running` all through the failure. Everything added this round is about
the **mechanism** — one context, born in a gesture, never closed, carrying both tones — and a right
mechanism is a necessary condition for the sound, not a sufficient one. I also cannot check the two
things a device holds: whether the resume after an iOS interruption restores output on that iPad, and
whether the installed PWA actually took `planbook-shell-v60`. Acceptance line 6 stays open, stays 👤,
and is the only thing that found this defect the first time.
