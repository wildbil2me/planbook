# WO-2.29 — the overdue alert gets its primary channel back · implementation result

**Implementer** Claude (work-order-implementer), Opus tier
**Date** 2026-08-14
**Work order** `plans/work-orders/phase-2-attendance.md` (WO-2.29, from line 2837)
**Status line** left as the orchestrator set it — `🤖 CLAIMED — 2026-08-14`.

---

## Summary

`src/alert-sound.js` is new: Roll Call!'s two alert tones at Roll Call!'s own frequencies, note
counts, durations and gains; its `touchstart` unlock; and the `soundsOn` preference.
`paintPassElapsed()` asks it for a tone at a level and knows nothing else about it. A speaker button
joined the header beside presentation mode. The comment claiming this app has no sound is gone, and
so is the sibling paragraph that said the alert was imperceptible off the registry.

**Both harness runs finished and I read their output.**

| run | result |
|---|---|
| `verify-shell.mjs` baseline, clean tree at `20e4dd3` | `752 checks · 752 passed · 0 failed · 0 skipped`, 249s, exit 0 |
| `verify-shell.mjs` on the delivered tree | `756 checks · 756 passed · 0 failed · 0 skipped`, 251s, exit 0 |
| `wo-sweep.mjs` baseline | `18 checks · 16 passed · 0 failed · 2 to review` |
| `wo-sweep.mjs` on the delivered tree | `18 checks · 16 passed · 0 failed · 2 to review` |

Plus two mutation runs, below, which are what makes Acceptance line 4 evidence rather than a claim.

---

## Against the Acceptance list, one by one

### 1. Crossing either threshold plays its tone, and the two are distinguishable — ✅ ticked

**Verified**, through the escalation walk that already existed in the harness: one student, wound to
5.2 minutes and then to 10.4, one threshold at a time. The new check reads the seam either side and
gets exactly two entries:

```
PASS | each threshold asks for its own tone, and the two are not the same tone …
  :: 2 tone(s) requested across the two winds:
  [{"level":1,"notes":10,"first":660,"peak":0.32,"played":true,"oscillators":10,"state":"running","error":""},
   {"level":2,"notes":12,"first":700,"peak":0.4, "played":true,"oscillators":12,"state":"running","error":""}]
```

Those are Roll Call!'s numbers unchanged — five 660 Hz pairs at the default 0.32 gain, six pairs
rising from 700 Hz in 64 Hz steps at 0.4. I copied the note-building loops and `playToneSequence()`
line for line from `dashboard.html:3467`–`3508` and tuned nothing. The two builders stayed two
functions rather than one parameterised call, for the reason the work order names.

**What I did not verify, and where the line is.** No machine heard anything and none can. What the
run establishes is that the audio path ran end to end: ten and twelve oscillators respectively were
constructed, connected and `start()`ed on an `AudioContext` whose state read `running`, and the two
sequences differ on all three axes a human tells them apart by. Audibility in a room is Acceptance
line 6, which is blank. I read line 1 as the machine-checkable half — if it also meant audible, line
6 would be redundant — and ticked it on that reading. If the verifier reads line 1 as "a human heard
two different tones", it should be untucked and folded into line 6.

### 2. `announce()` still fires at both thresholds, same sentence, comment rewritten — ✅ ticked

**Verified.** The two pre-existing checks still assert the sentences verbatim (*"…has been out on a
nurse pass for 5 minutes."* / *"…for 10 minutes."*), and the new muted check asserts the same
sentence lands with the sound switched off:

```
PASS | with the sound off the tone is not played … :: … the announcement was
      "Marcus Aurelio has been out on a quick pass for 5 minutes."
```

The comment at `src/attendance.js` (now ~`:3020`) no longer promotes the announcement to primary. It
says it is the accessible equivalent of the tone above it, so the alarm is not sound-only for a deaf
or hard-of-hearing teacher (WCAG 1.4.1), that it is the mirror and not the alert, and that this is
why `soundsOn` reaches the tone alone and never the sentence or the card colour. Roll Call!'s
reasoning, in this project's voice, rather than its wording.

### 3. `soundsOn` silences the tone and leaves the announcement and card tint alone — ✅ ticked

**Verified**, driven through the real header control rather than through `setPref`:

```
PASS | one tap on the header switch mutes the alert … :: aria-pressed = true, lit = true,
      slash strokes on the icon = 2, planbook_soundsOn = "false",
      the string "soundsOn" anywhere in the year document = false
PASS | with the sound off the tone is not played … :: what the tick asked for =
      [{"level":1,…,"played":false,"oscillators":0,"state":"silenced"}],
      the card is at level 1 reading "5:14", alerted = 1, and the announcement was "…for 5 minutes."
PASS | and turning it back on is the same one tap … :: what the tick asked for =
      [{"level":2,…,"played":true,"oscillators":12,"first":700}], planbook_soundsOn = "true"
```

`inDoc` is a substring search for `soundsOn` over the whole serialised year document, and it is
`false`. The key goes through `src/prefs.js` — the sweep's *"no localStorage access outside
src/prefs.js"* and *"every getPref/setPref key is declared in PREF_DEFAULTS"* (`9 declared, 7 used`)
both still pass. Nothing in `src/passes.js` was touched; `git status` confirms it is not in the diff.

### 4. The tone is asserted through a seam, and fails if either threshold stops requesting it — ✅ ticked

**Verified, including the failure**, which needed two mutations because the line says *either*. Each
is one line of `src/attendance.js` — the `playOverdueAlert()` call gated to a single level:

| mutation | result | what went red |
|---|---|---|
| fires at level 2 only | `756 · 754 passed · 2 failed` | *"each threshold asks for its own tone"* (`1 tone(s) requested`, the level-2 entry alone) and *"with the sound off the tone is not played"* (`what the tick asked for = []`) |
| fires at level 1 only | `756 · 754 passed · 2 failed` | *"each threshold asks for its own tone"* (`1 tone(s) requested`, the level-1 entry alone) and *"turning it back on is the same one tap"* (`what the tick asked for = []`) |

Two red each time and not four: under each mutation the checks about the *other* threshold stayed
green, which is what says these are checks about a threshold rather than about the module. I read
both summary lines and both `FAIL` lines out of the run output. `src/attendance.js` was restored
byte-identical afterwards — md5 `e065501fb1ac2354a3b81a2bed2d242f` before the first mutation and
after the last, and the confirmation run above was made on the restored tree.

**What the seam is** (the brief asks for this explicitly). `window.planbook.alertSound.alertSoundLog()`
returns a capped list of what the audio path *did*. The entry is pushed **inside**
`playToneSequence()`, after the `forEach` that constructs, connects and `start()`s the oscillators
has run to the end, and it carries `oscillators` (counted in that loop), the `AudioContext`'s state,
and any thrown error's name. A headless browser can observe it because it is a plain object on the
page, and Edge really does give the page a live `AudioContext` — every played entry in the run reads
`"state":"running"`.

**Which kind of seam it is**: the strong kind for the played case, and necessarily the weak kind for
the silenced one. A build that stopped scheduling oscillators cannot produce `oscillators: 10` — the
count is not a parameter, it is an increment inside the loop. A build that stopped *asking* produces
no entry at all, which is what both mutations demonstrated. The one entry that records intent rather
than action is the silenced one (`played: false, oscillators: 0`), and it exists on purpose: with no
entry there, "the preference silenced it" and "nothing asks for a tone any more" are the same
absence, and the mute check would pass on a build with the feature ripped out. The unmute check is
what closes that hole from the other side.

### 5. No comment in `src/attendance.js` still says this app has no sound — ✅ ticked

**Verified by reading.** Two comments had to go, not one:

- `:3013` — *"Here there is no sound at all, so this sentence and the colour on the card are the
  alert."* Rewritten as described under line 2.
- `:2918` (the WO-2.27/2.28 paragraph above `startPassClock()`) — *"It did not make the alert
  perceptible to a sighted teacher away from the registry; that remaining channel is WO-2.29."*
  This is the sibling comment the acceptance line is guarding against; it now records that
  WO-2.29 landed and that the paragraph's old ending was true for two days.

I grepped the file for `sound|audible|silen|beep|tone` case-insensitively and read every hit. The
remaining `tone` matches are `src/attendance.js:2558`–`2591`, which is the attendance cell's colour
*tone* and predates all of this.

### 6. Audible on the teaching iPad, installed, off the registry, after a suspend — ⬜ NOT TICKED (👤)

**I cannot close this and did not tick it.** No iPad, no installed PWA, no suspend. `verify-shell.mjs`
has never seen a service worker. Everything above is a desk reading.

**Exactly what closes it**, so it is cheap to run:

1. Deploy, then open the **installed** app from the home-screen icon (not Safari). Check the header
   speaker is *not* slashed.
2. Send a student out on a pass.
3. **Tap anything once.** That is the unlock — the primer fires on the first `touchstart`.
4. Move to **Scores** (any screen that is not the registry).
5. Lock the iPad or switch apps for **six minutes**, then come back.

- **Pass:** a tone within a second or two of coming back — five two-note beeps over about three
  seconds — with the pass card still tinted behind it on the registry.
- **Fail:** silence, with the card tinted and the sentence in the live region. That is exactly the
  pre-WO-2.29 behaviour, so silence means the primed permission did not survive the suspend.

**If it fails**, the design already anticipates it: the primer **re-arms on `visibilitychange →
visible`**, so the next screen touch after the resume should restore audio without a relaunch. To
tell the two failure shapes apart, tap once more after the resume and let the pass cross **ten**
minutes. A tone then means the prime died across the suspend and re-arming works — the design
handles it and the only cost is that the very first alert after a resume can be silent, which is
worth booking as a follow-up. Still silent means the prime never took at all, which is a different
bug and points at the unlock rather than the suspend. Either finding belongs in `TESTING.md`
§ WO-2.29, where the steps above are already written down.

### 7. Both tools print what they printed before, but for the count — ✅ ticked, with one honest caveat

`verify-shell.mjs`: `752 → 756`, zero failed, zero skipped, both runs exit 0. The four new executed
results are the four new call sites; none is in a loop and none is a failure arm, so the executed
count moved by exactly four. The call-site count moved `754 → 758` and `tools/README.md:783` was
updated in the same change, with the history paragraph beside it extended — the sweep's count check
passes.

`wo-sweep.mjs`: `18 checks · 16 passed · 0 failed · 2 to review`, identical to baseline. Three
detail lines moved, and one of them is more than a count:

- `9 declared, 7 used` (was `8 declared, 6 used`) — `soundsOn`.
- `387 selector(s) in the coarse block` (was 386), and *"2 new selector(s), all covered"*.
- **The `sensitive field names` REVIEW now lists `src/alert-sound.js`**, `297` mentions where it was
  `295`. This is a file joining a REVIEW list, not just a number moving, so I am flagging it rather
  than burying it. The two lines are both prose in the module header: `:36` cross-references
  `src/supports.js` (the same kind of reference that already puts `src/presentation.js` on that list)
  and `:41` says the module is never handed a student because a log line is one of the surfaces
  CLAUDE.md protects. I read the file: it has no student data in it of any kind — the only thing it
  is ever passed is an integer alert level. I kept both mentions because the list exists to be read
  and the second sentence is the guarantee itself; rewording them to dodge the grep would have made
  the file quieter and the promise weaker.

---

## Files changed

| file | what |
|---|---|
| `c:\dev\planbook\src\alert-sound.js` | **new.** The two tones, `playToneSequence()`, the iOS unlock, the `soundsOn` preference, the header chrome, the seam. |
| `c:\dev\planbook\src\attendance.js` | one call added to `paintPassElapsed()`; the `announce()` comment rewritten; the `startPassClock()` paragraph corrected; one import. |
| `c:\dev\planbook\src\prefs.js` | `soundsOn: true` and its reasoning. |
| `c:\dev\planbook\index.html` | the `#soundsBtn` header control. |
| `c:\dev\planbook\src\shell.css` | `.hdr-mode-btn.active`'s comment generalised to both switches; coarse block gains `.header-actions { gap: 6px }` and `.header-top`'s gap. |
| `c:\dev\planbook\src\shell.js` | import, census line for `data-sounds-toggle`, the delegated handler, the boot paint, the `window.planbook.alertSound` seam entry. |
| `c:\dev\planbook\sw.js` | `./src/alert-sound.js` in `SHELL`, `CACHE` bumped `v58 → v59`. |
| `c:\dev\planbook\tools\verify-shell.mjs` | four new `check()` sites; the WO-2.28 fixture-precondition clause. |
| `c:\dev\planbook\tools\README.md` | the call-site count `754 → 758` and the history sentence. |
| `c:\dev\planbook\TESTING.md` | the WO-2.29 section, with the mutation table and the 👤 procedure. |
| `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` | Acceptance 1–5 and 7 ticked; 6 left blank; status line untouched. |

`src/passes.js` was read and **not modified**. `alerted` / `markAlerted()` / `alertedLevel()` are
untouched.

### The WO-2.28 fixture clause

Done as specified — an upgrade in place, not a new site. `beforeMissingNodePass` is now parsed and
asserted to carry no `alerted` key, on the fixture check at `:10069`, and the saved record is printed
in the detail line:

```
PASS | the document-driven alert fixture removes this pass's elapsed node while Scores remains up,
       before the stamp moves — over a pass that has not already alerted
  :: saved pass = {"id":"p_0c04711o4w",…,"out":"2026-08-14T15:24:10-04:00"},
     carrying no `alerted` key = true, matching elapsed nodes = 0, …
```

The call-site count moved by four rather than five, which is the point of putting it there.

---

## Decisions the work order did not settle

1. **The header had room for the control, but not much — and it is measured.** Before I wrote
   anything I measured the top row at 390×844 on an emulated coarse pointer: `344.1px` of content in
   `390px`, i.e. **45.9px of slack**, and a 44px control plus the row's 8px gap wants 52. WO-1.9 had
   already spent the whole title block to buy its own button, and the remaining candidate was the 📓.
   I took the gaps instead — `.header-actions` 8→6 and `.header-top` 12→8, both in the coarse block —
   which frees 12px. Re-measured after: `384.1px` in `390px`, and the harness's own check reads
   `no horizontal overflow at 390x844 :: {"sw":390,"iw":390}`. The 📓 stays. Both figures are written
   into the CSS comment so the next control added there argues against a number.
2. **`.hdr-mode-btn.active` is shared, and its meaning is now stated as "this switch is away from its
   default."** Presentation mode defaults off, so lit means hidden; sounds default on, so lit means
   muted. One rule, two buttons, no new colour. The alternative — a bespoke muted style — would have
   added a selector and a second grammar for the same idea.
3. **The icon carries the state as well** (speaker ↔ speaker-with-slash). `src/presentation.js`
   objects to a crossed-out eye because a permanent slash reads as "things are hidden" on a button
   that is hiding nothing; a slash that is only *drawn* while muted does not have that problem, and I
   said so at the point of departure.
4. **No strip under the header for the mute.** Presentation mode has one because the cost of
   forgetting it is a disclosure to a room. The cost of forgetting this one is a missed tone on a
   card that is still tinted and a sentence that is still announced. A second permanent band on every
   screen is more than that is worth. Written into `src/alert-sound.js`.
5. **No confirmation beep when the sound is switched back on.** It is genuinely useful feedback and
   it is also a beep in a silent room during the exact minute a teacher touches this control. That is
   the owner's call, not this work order's.
6. **One tone per tick, at the worse level**, when two students cross together — the same shape as
   the single sentence beside it. Two three-second sequences started in the same millisecond are one
   smear nobody can count.
7. **The unlock got three additions to the lift**, all commented where they depart: it re-arms on
   `visibilitychange → visible` (a one-shot primer cannot answer a suspend, which is the whole 👤
   question); it listens for `pointerdown` as well as `touchstart` (there is no `touchstart` on the
   laptop half of this app's life); and `playToneSequence()` resumes a context that comes up
   suspended. None of them changes what a touch on an iPad does.
8. **The module owns the preference and the button as well as the tones.** Presentation mode is split
   across two files because the *rule* it enforces is asked by four other screens; nothing else in
   this app asks anything about sound, so a third file for a two-state button would have been three
   files for one control. The boundary the work order actually draws — `src/attendance.js` does not
   own an oscillator — is honoured.

---

## Out of scope, declined, and worth booking

- **A visible off-registry indicator.** The Traps forbid it here and the reasoning is sound. Worth
  saying that the tone does not fully replace it for a teacher who has muted the app during a test
  and then forgets — the muted speaker in the header is the only surface that answers her.
- **Configurable alert thresholds.** `src/passes.js:119`–`131` says that when a settings surface
  arrives, `ALERT_ONE_MIN` / `ALERT_TWO_MIN` become `src/prefs.js` defaults. This work order added
  the app's first non-modal preference *control*, which makes that surface a little more plausible,
  and it is still not mine to build.
- **The first alert after a resume may be silent** if iOS drops the audio permission across a
  suspend. The primer re-arms, so the *second* one will not be — but the design cannot pre-empt the
  very first without a gesture. If the 👤 line comes back "silent on the way in, fine after one tap",
  that is a real finding and it deserves its own small work order (candidates: prime inside the
  service worker's resume path, or hold the alert until the next touch and fire it then). I did not
  pre-build any of it.
- **A settings screen.** Not touched. The work order was explicit that the control belongs in the
  header instead, and I agree with it after seeing how tight that row is — a settings screen would
  have been the easier build.

---

## Draft `CHANGELOG.md` entry — for the teacher to accept, reject or rewrite

> **Overdue hall passes now make a sound.** A student five minutes out gets a steady double beep; ten
> minutes gets a faster, rising one, so the two are tellable apart without counting. The alert
> follows you off the registry — it will reach you on the score grid or a student's detail, which is
> where it was silent before. The spoken announcement and the colour on the pass card are unchanged.
> A new speaker button in the header silences the sound in one tap for a test, and shows a slash
> through it while it is off; the announcement and the card colour stay either way.

---

## Honest residue

- **Acceptance 6 is open and only an iPad closes it.** The unlock path is the entire risk of this
  work order and nothing on this desk touched it.
- **Acceptance 1 is ticked on a reading of the word "plays"** that treats audibility as line 6's job.
  Named above so the verifier can disagree cheaply.
- **The sweep's REVIEW file list grew by one file.** Named above rather than folded into "but for the
  count".
- **`.claude/dispatch/WO-2.29-status.md` is untracked and I did not write it** — I do not know
  whether it predates this dispatch or was written alongside it; I only ever read the brief.
- Nothing was committed or pushed. The brief did not ask for it.
