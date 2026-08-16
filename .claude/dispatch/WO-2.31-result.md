# WO-2.31 — result

**Implementer** Claude (work-order-implementer), Opus tier · **Date** 2026-08-15
**Brief** `.claude/dispatch/WO-2.31-brief.md` · **Work order** `plans/work-orders/phase-2-attendance.md:3081`

---

## Files changed

| File | What |
|---|---|
| `src/alert-sound.js` | The `statechange` recovery path, the mandated alert-time fallback, three counters and `rearmed` on the seam |
| `tools/verify-shell.mjs` | The `Proxy` that catches the constructed context, three new checks, and the widened source clause |
| `sw.js` | `CACHE` `planbook-shell-v67` → `v68` |
| `src/shell.js` | One sentence in the `window.planbook.alertSound` comment, naming the three new counters and why they are counts |
| `tools/README.md` | The recorded `check()` call-site count 788 → 791, and a WO-2.31 paragraph in the running history |
| `TESTING.md` | New `### WO-2.31` section, including the 👤 procedure — **left unticked** |
| `plans/work-orders/phase-2-attendance.md` | Acceptance boxes 1–5 ticked; box 6 (👤) left blank |

`src/alert-sound.js` as delivered: md5 `ffc9a600f5c63b252f77fc1c23546c25`. No file was rewritten to
CRLF (`file` reports plain UTF-8 on all seven).

## What I built, and the two choices the work order left open

**The recovery mechanism: the context's own `statechange`.** Registered inside `unlockAudio()` at the
one place a context is constructed, so there is one context and one registration. Any state that is
not `running` re-arms **first** and then makes the cheap unawaited `resume()` try — the re-arm is the
half that cannot fail, the resume is the optimistic half that costs a promise nobody holds if it
hangs the way probe 3's did. It **stays armed afterwards even when the resume reports success**,
which reads like a missing `disarm()` and is the unlock block's fourth rule applied here: `running`
is not evidence of output on WebKit. `focus`/`blur` was rejected in a comment at the point of
departure — it fires for a dozen things that are not audio and is not guaranteed for an interruption
banner that never takes focus. **The listener needs no ordering guarantee**, and the comment says so
rather than inventing one: it is registered on the *context*, not on `document`, so it shares its
target with nothing in the app and no import order can reverse it. WO-2.29's four rules are
untouched; the `visibilitychange` re-arm is still unconditional, and the block now says "Five rules
— four from the correction, and the fifth from WO-2.31".

**The cheap fallback exists as required.** `playToneSequence()` re-arms whenever the context it is
handed is not `running`, before it schedules, and the comment says in as many words that the cost is
one missed alert rather than a dead feature.

**How the seam records it.** Log entries gain `rearmed`; `alertAudioState()` gains `interruptions`,
`recoveries`, `wakeResumes`. I chose a **new field rather than a new pseudo-state name** for the
waiting case: `state` stays the live context state, because `suspended` / `interrupted` / `closed`
are three different findings on a device, and `locked` / `silenced` are used only where there is no
real state to report. `rearmed: true` beside a state that is not `running` is "waiting for a touch";
its absence is "dead". Counts rather than flags, because a context recovered twenty milliseconds ago
reads identically to one never disturbed.

**How the harness interrupts a real context.** `src/alert-sound.js` describes its context rather than
handing it over, deliberately, and I did not weaken that. Instead `verify-shell.mjs` installs a
`Proxy` on `window.AudioContext` with `Page.addScriptToEvaluateOnNewDocument` before the first
navigation and keeps the instances. Nothing in `src/` knows it exists, nothing branches on it, and
the module calls the same constructor and gets back a context it made itself. **No test hook was
added to production code.** That the two halves hold the same object is asserted rather than assumed:
the module's own `interruptions` count has to move when the harness suspends it.

---

## Against the Acceptance list, one by one

### 1. An interrupted context is recovered without the app being backgrounded and returned — driven, not asserted from source. ✅ ticked

**How I verified it.** New check in the WO-2.9 hall-pass block. A pass is issued (that tap is the
last gesture the block allows itself), then `suspend()` is called on the real held context. **Nothing
calls `wakeUp()` and nothing clicks between the interruption and the tone** — a `visibilitychange`
would recover it through the path that already worked and a click is a gesture that would recover it
through the unlock. The tick is `src/attendance.js`'s own one-second pass clock, polled for with a
six-second ceiling. From the delivered run:

> PASS | an interruption that never hides the app is recovered by the module itself: the next
> alert's tone is scheduled on a running context, with no visibilitychange and no touch in between
> :: before the interruption `{"contexts":1,"origin":"gesture","state":"running","currentTime":16.971,"armed":false,"interruptions":0,"recoveries":0,"wakeResumes":0}`,
> after it `{"contexts":1,"origin":"gesture","state":"running","currentTime":17,"armed":true,"interruptions":1,"recoveries":1,"wakeResumes":0}`;
> the tone that followed was `{"level":1,"notes":10,"first":660,"peak":0.32,"played":true,"oscillators":10,"state":"running","ctx":1,"ctxTime":17.28,"rearmed":false,"error":""}`
> and the pass records alerted = 1

`wakeResumes: 0` is the "not backgrounded and returned" clause. `ctxTime 17.28 > 16.971` is the one
clock running on across the interruption rather than an alert-time context reading ~0.

**What this does not prove**, and I want it on the record: the simulated interruption is
`suspend()`, not an iOS audio-session interruption. Chromium has no `interrupted` state, so what was
exercised is the `state !== 'running'` branch the device's `interrupted` also takes — not the literal
WebKit value. That `statechange` fires on an iOS interruption at all is documented behaviour I could
not confirm without the device; it is part of what Acceptance 6 settles.

### 2. If it cannot be recovered without a gesture, the listener is re-armed and the seam records it. ✅ ticked

**How I verified it.** Second leg, deterministic rather than racy: the instance's `resume()` is
replaced with a promise that never settles — **probe 3's exact shape from the 2026-08-14 iPad run**
— so the module calls what it always calls, gets back what the device gave it, and the context stays
down for as long as the leg needs. Then a threshold is crossed:

> PASS | and a tone asked for on a context that will not come back re-arms the gesture listener and
> says so in the log — "waiting for a touch" and "dead" are not the same silence :: with resume()
> hanging the module reads `{…,"state":"suspended","armed":true,"interruptions":2,"recoveries":1,"wakeResumes":0}`
> and the tone it then asked for was `{"level":2,"notes":12,"first":700,"peak":0.4,"played":true,"oscillators":12,"state":"suspended","ctx":1,"ctxTime":17.331,"rearmed":true,"error":""}`

A third check then closes the loop the work order describes — the teacher's next touch restores it,
and the touch used is an ordinary one (the tap that cancels the pass); nothing in the app knows it is
special:

> PASS | and the teacher's next touch anywhere is what restores it… :: after the tap the module reads
> `{"contexts":1,"origin":"gesture","state":"running","currentTime":17.48,"armed":false,"interruptions":2,"recoveries":2,"wakeResumes":0}`;
> the log is byte-identical at 5 entr(ies) and 2 pass(es) open

### 3. A bare `new AudioContext()` leaves the harness red. Watched failing. ✅ ticked

**Watched, twice, on the tree as delivered.** Mutation applied, run, red read off the terminal,
reverted, run, green — and the reverted file's md5 matches the delivered one.

| mutation | result | what went red |
|---|---|---|
| the one site rewritten `new AudioContext()` | `788 checks · 787 passed · 1 failed`, exit 1 | only the WO-2.29 mechanism check: *"constructs a context at line(s) [188], in "function unlockAudio() {", and **NOT** through the window.AudioContext \|\| window.webkitAudioContext pair — a bare constructor drops the fallback older WebKit needs…"* |
| a **second** site spelled bare, minting and closing a context on `visibilitychange` (the shipped build's shape, in the spelling the old clause could not see) | `788 checks · 787 passed · 1 failed`, exit 1 | the same check, now on the count: *"line(s) [188,293]"*, *"(2 constructor call sites)"* |

**A judgment call I had to make here, and the verifier should look at it.** The Deliverable says
"widen the clause so a bare `new AudioContext(` is caught as well as the `window.`-qualified form,
and assert against the count of construction sites rather than a literal spelling" — but Acceptance 3
says a bare **rewrite** must leave the harness red. A count taken with a spelling-agnostic matcher
finds one site in `unlockAudio` either way and would be *green* on the rewrite, which contradicts
line 3. I satisfied both, in two clauses: `AUDIO_CTOR` counts sites regardless of spelling (so a
second bare site can no longer hide — mutation 2 above), **and** the one site is separately asserted
to still carry the `window.AudioContext || window.webkitAudioContext` pair, as a trip-wire with its
reason in the failure text — dropping the fallback is a decision about which devices can make a sound
and belongs in a work order, not in a tidy-up. If the reviewer reads line 3 differently, the second
clause is one boolean to remove.

*Worth noting about mutation 2, because it is the argument for widening at all:* every dynamic
reading under it was identical to the green run — `contexts: 1`, `wakeResumes: 0`, both tones on one
clock — because nothing in the page can observe a construction the module was not told about. That is
WO-2.29's own mutation-2 finding, reproduced in the spelling that used to slip past.

### 4. Still exactly one context, still born in a gesture; WO-2.29's guarantees and checks intact. ✅ ticked

WO-2.29's mechanism check passes unchanged on the delivered tree, now reading the widened clause:

> PASS | both tones were scheduled on the ONE AudioContext the first gesture made … :: … src/alert-sound.js
> constructs a context at line(s) [188], in "function unlockAudio() {", through the
> window.AudioContext || window.webkitAudioContext pair

All three new checks also assert `contexts === 1` and `origin === 'gesture'` **after** the
interruptions, and `ctx: 1` on every tone. Nothing was added that constructs a context: the
`statechange` handler and the alert-time fallback both only `arm()` and `resume()`. The unlock
block's four rules are unedited except for the fifth being appended and "Four" becoming "Five"; the
`visibilitychange` re-arm is still unconditional.

### 5. Both commands print what they printed before, but for the count. ✅ ticked

Both run locally on this machine (not a sandbox), read off the terminal:

```
node tools/verify-shell.mjs
  788 checks · 788 passed · 0 failed · 0 skipped
  21,003 lines · 26.7 lines per check · 260s          exit 0

node tools/wo-sweep.mjs
  20 checks · 18 passed · 0 failed · 2 to review      exit 0
```

Both REVIEWs are the standing pair, and `src/alert-sound.js` is on the sensitive-name list for the
same **two** lines of prose it has been on since WO-2.29 (checked by grep: a cross-reference to
`src/supports.js`, and the sentence saying the module is never handed a student). My comments added
no sensitive names.

The sweep was red twice on the way and both were fixed rather than reported: it required the
`CACHE` bump (`v67` → `v68`, without which an installed iPad keeps the build with this hole in it),
and it required `tools/README.md`'s recorded call-site count to move 788 → 791. The 788 executed vs
791 sites gap is the three pre-existing allowlisted non-calls; my three sites are all executed, none
in a loop and none a failure arm.

`node tools/wo-gate.mjs --audit` is also clean (`PASS | every fragment matches exactly one roadmap
box…`).

### 6. 👤 On the teaching iPad. ⬜ **NOT ticked — I have no iPad.**

`TESTING.md` § WO-2.31 carries the procedure so a human can run it: confirm the About line reads
`planbook-shell-v68` first, send a student out, then take an interruption that leaves Planbook on
screen (an incoming call/FaceTime answered and ended from the banner, or a Clock alarm firing over
the top — **not** an app switch or a screen lock, either of which is a `visibilitychange` and tests
the path that already worked), and let the five-minute threshold pass untouched. It also says what
the next two taps mean if it fails, because that finding is worth as much as a pass: a tone at ten
minutes after one touch says the re-arm works and the resume-without-a-gesture does not, which is a
different work order (deferring an alert to the next gesture rather than playing it into a dead
context); nothing after that tap points at `tools/audio-probe.html` probe 1.

---

## What I could not verify

- **Anything audible.** No machine heard a tone and none can. Every claim added here is about the
  mechanism, which is a necessary condition for the sound and not a sufficient one.
- **The real iOS interruption.** See Acceptance 1 above — `suspend()` exercises the branch, not the
  WebKit `interrupted` value, and whether `statechange` fires on an iOS audio-session interruption is
  taken from documentation rather than from the device.
- **That the fallback's re-arm helps on the device.** On Chromium `resume()` outside a gesture always
  works, so the "next touch restores it" leg is real but easy; on iOS it is the whole point.

## Decisions I made that the work order did not settle

1. **`statechange` over `focus`/`blur`** — argued in the module at the point of departure.
2. **`rearmed` as a field, not a fourth pseudo-state** — keeps `state` truthful, since `suspended`,
   `interrupted` and `closed` are three different findings on a device.
3. **Stay armed after a successful auto-recovery.** Deliberate, and commented, because it looks like
   a missing `disarm()`.
4. **The harness reaches the context by proxying the constructor**, not by a new export from `src/`.
5. **The webkit trip-wire** as the way to satisfy Acceptance 3 alongside the spelling-agnostic count
   — see Acceptance 3 above; this is the one place I would expect a reviewer to want a second look.
6. **I did not run `node tools/wo-gate.mjs --tick`.** The status line is still `🤖 CLAIMED` — which
   is true while this is in flight — and the phase dashboard is `--tick`'s to recompute. Hand-ticking
   the acceptance boxes without it leaves no drift `--audit` can see, and it is clean.

## Out-of-scope temptations I declined

- **Adding `focus`/`blur` as a belt-and-braces third path.** Two recovery paths plus the mandated
  fallback is what the Deliverable asks for; a third would be more listeners for the same event with
  no way to tell which one fired.
- **Queueing an alert that arrives on a down context, to play on the next gesture.** This is the real
  fix if the 👤 run says the device will not resume outside a gesture, and `TESTING.md` § WO-2.29
  already named it as "a queue and a work order of its own". Today the tone is scheduled anyway and
  the listener is re-armed, which is the trade the work order specified. **Proposed follow-up, not
  booked.**
- **Making the second-bare-constructor mutation a permanent check.** It is a mutation, not a fixture;
  the widened count is what guards it now.
- **Touching Roll Call!'s frequencies, note counts, durations or gains, or the context-per-alert
  shape.** Untouched, as the Traps require.
- **A third harness.** Not written. I did not find a check these two could not make: the
  interruption, the hung resume and the re-arm are all reachable from `verify-shell.mjs` once the
  constructor is proxied.

## Draft CHANGELOG entry — for the teacher to write or discard

> **Fixed** — an overdue hall-pass alert stayed silent for the rest of the period if the iPad was
> interrupted without Planbook leaving the screen (a call, a FaceTime request, an alarm). The alert
> now notices the interruption itself and comes back; if the device will not restore sound without
> being touched, the next tap anywhere restores it and one alert is lost rather than all of them.
