# WO-2.31 — the held audio context has two ways to die that nothing watches · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.31-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, **Opus** tier. The deciding signal is that the work order refuses to
settle its own spec — the Deliverables list three candidate recovery mechanisms and say in as many
words that the work order does not settle which, which is the rubric's "ambiguous / judgment about
what the spec should be" column, and every Trap on it is a judgment rather than a mechanic. The
runner-up I set aside: size `S`, one-and-a-bit files, and the harness half is a mechanical widening of
one regex — a genuine Codex shape on its own merits, beaten by the fact that the other half is a
design choice made against a file whose every paragraph is a scar. No Codex probe was run; the route
never reached step 2b.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.31 — the held audio context has two ways to die that nothing watches

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-15 · **Size** S · **Depends on** WO-2.29

**Booked 2026-08-14 out of WO-2.29's correction round, and both halves are doors left open by the
fix rather than faults in it.** WO-2.29 shipped a fresh `AudioContext` per alert; the iPad proved on
2026-08-14 that a context built outside a user gesture reports `running`, advances its clock and
plays to nothing, and the correction replaced it with **one** context born in the first gesture and
held for the life of the page. That is the right shape and it is audible on glass. These are the two
ways the held context can still end up dead with nothing saying so — one in the app, one in the
harness that guards it. Both were raised by the correction round's verifier; neither blocked it.
They are one work order because they are one file and one sitting.

**The bug: an interruption that never hides the app disarms it silently.** The held context is
resumed from `visibilitychange → visible`, which is the right hook for a suspend — the app goes to
the background and comes back. **An iOS interruption that leaves the app foregrounded fires no
`visibilitychange` at all.** An incoming call, a FaceTime request, an alarm: iOS interrupts the audio
session, the held context is left interrupted, and because the page never hid, nothing re-arms the
gesture listener and nothing calls `resume()`. The next overdue alert schedules its oscillators onto
a dead context and the teacher hears silence — *the exact failure WO-2.29 was written to fix, through
a door the fix did not close.* It does not self-heal: with the primer consumed and the re-arm bound
only to `visibilitychange`, the audio stays dead until the app is backgrounded and returned, or
reloaded.

**Why it sits at the back of Ship 2 rather than beside the work order that found it.** It needs an
interruption during a period with a student out on a pass, which is rare. It is in Ship 2 rather than
deferred for the same reason WO-2.30 is: **no harness check in this project can reach it** — there is
no way to interrupt an audio session from CDP — so a green run will never find it, and what it
produces is silence rather than an error anybody sees. That combination is what earns a row.

**The harness half: the check that guards the fix can be walked past.** WO-2.29's correction added a
source clause asserting that exactly one `AudioContext` is ever constructed, and it matches the
literal string `new (window.AudioContext`. A bare `new AudioContext()` — which is what anyone writing
this fresh on a modern browser would type, and which is what the file itself would use if the
`webkit` fallback were ever tidied away — **satisfies the code and slips the check**. The guarantee
the whole correction rests on is one refactor away from being unguarded, and the failure mode is a
green harness, which is the failure mode this work order series has already been bitten by twice.

**Deliverables**

- `src/alert-sound.js` — resume the held context on the paths `visibilitychange` cannot see. The
  candidates, and the work order does not settle which: the context's own `statechange`, which fires
  when iOS interrupts it; `focus`/`blur` on the window; or re-arming the gesture listener whenever
  the context is found in any state other than `running` at alert time. **Whichever is chosen, the
  fallback that must exist is the cheap one** — if a tone is asked for and the context is not
  `running`, re-arm the listener so the teacher's next touch anywhere restores audio, and say in a
  comment that the cost is one missed alert rather than a dead feature.
- `tools/verify-shell.mjs` — widen the clause so a bare `new AudioContext(` is caught as well as the
  `window.`-qualified form, and assert against the count of construction sites rather than a literal
  spelling wherever that is possible.

**Acceptance**

- [ ] An interrupted context is recovered without the app being backgrounded and returned: the seam
      shows the alert's tone scheduled on a `running` context after a simulated interruption, and the
      recovery path is driven rather than asserted from source.
- [ ] If the context cannot be recovered without a gesture, the gesture listener is re-armed and the
      seam records that it was — so "waiting for a touch" and "dead" are not the same absence, which
      is the distinction `alertSoundLog()` already draws for the muted case.
- [ ] Rewriting `new (window.AudioContext || window.webkitAudioContext)()` as a bare
      `new AudioContext()` leaves the harness **red**, not green. Watched failing.
- [ ] Still exactly one context over the life of the page, still born in a gesture — WO-2.29's
      guarantees are unchanged and its checks still pass.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but
      for the count.
- [ ] 👤 On the teaching iPad: with a pass running, take an interruption that does not background the
      app, then let a threshold pass. The finding goes in `TESTING.md` § WO-2.31 whichever way it
      falls. 👤

**Traps** — **Do not go back to a context per alert.** That is the shape the iPad falsified on
2026-08-14 and the evidence is in `TESTING.md` § WO-2.29; a context built outside a gesture reports
`running` and plays to nothing. **Do not tune the frequencies, note counts, durations or gains** —
they are Roll Call!'s, tuned by a year of classroom use, and re-deriving them is the WO-2.11 scar.
**Do not accept a source-only assertion for the recovery path.** The seam saying `running` is exactly
what it said all through the failure WO-2.29 shipped with; what has to be shown is a tone scheduled
on a context that was interrupted first. **And no machine can hear anything** — the audible half
stays 👤 and goes to the iPad, as it did twice for WO-2.29.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/alert-sound.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, and each for a stated reason:

- **`TESTING.md` § WO-2.29, the "👤 RUN 2026-08-14 — FAILED" probe table.** Four probes on the
  teaching iPad. It is the evidence behind every rule in `src/alert-sound.js`'s unlock block, and it
  is the thing that makes probe 1 and probe 2 — identical logs, opposite outcomes — the reason a
  `running` state is not evidence of output. Read it before you decide what "recovered" means. You
  will also be adding a § WO-2.31 section to this file for the 👤 line; match its house style.
- **`src/alert-sound.js`'s unlock block comment, lines ~93–145.** Four rules, each labelled
  load-bearing. Note the fourth in particular: the `visibilitychange` re-arm is **unconditional, not
  conditional on the state looking wrong**, and the comment says why. Whatever you add must not
  quietly turn that into a conditional re-arm.
- **`tools/verify-shell.mjs:10659–10716`** — the WO-2.29 correction's check, which is the one you are
  widening. Its comment already names the source clause as "the clause a future edit is most likely to
  break," and this work order is that prediction coming true. The `ctxTime` reasoning in it is what
  makes the check more than a counter reading itself back; do not weaken it while widening the regex.
- **`src/attendance.js`'s `visibilitychange` listener and `paintPassElapsed()`.** The ordering between
  it and `src/alert-sound.js`'s listener is load-bearing and the comment at
  `src/alert-sound.js:198–207` says how it is achieved (import order → body order → registration
  order). If your recovery path adds another listener, say what its ordering guarantee is or show
  that it needs none.

Three notes on shape, none of which decide the design for you:

1. **The seam is where a driven test becomes possible at all.** Acceptance 1 and 2 both ask the seam
   to record something it does not record today, and Acceptance 1 forbids proving the recovery from
   source. `alertAudioState()` and the `alertSoundLog()` entries are the existing vocabulary — the
   muted case's `state: 'silenced'` and the untouched case's `state: 'locked'` are the precedent for
   "waiting for a touch" being a *named* state rather than an absence.
2. **A simulated interruption has to come from somewhere.** CDP cannot interrupt an audio session —
   the work order says so and treats it as settled. Whatever you use to put the context into a
   non-`running` state for the harness must be a real state change on the real held context, not a
   flag the test sets and the code reads; a test double the production path knows about is the
   fixture-that-cannot-fail defect this project has already been bitten by.
3. **Acceptance 3 asks you to watch a check fail.** Make the edit, run the harness, see red, revert,
   see green, and report both outputs. A red you inferred is not a red you watched.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 6 lines, reported against one by one

1. An interrupted context is recovered without the app being backgrounded and returned: the seam shows the alert's tone scheduled on a `running` context after a simulated interruption, and the recovery path is driven rather than asserted from source.
2. If the context cannot be recovered without a gesture, the gesture listener is re-armed and the seam records that it was — so "waiting for a touch" and "dead" are not the same absence, which is the distinction `alertSoundLog()` already draws for the muted case.
3. Rewriting `new (window.AudioContext || window.webkitAudioContext)()` as a bare `new AudioContext()` leaves the harness **red**, not green. Watched failing.
4. Still exactly one context over the life of the page, still born in a gesture — WO-2.29's guarantees are unchanged and its checks still pass.
5. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but for the count.
6. 👤 On the teaching iPad: with a pass running, take an interruption that does not background the app, then let a threshold pass. The finding goes in `TESTING.md` § WO-2.31 whichever way it falls. 👤

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

