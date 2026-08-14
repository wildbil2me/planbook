# WO-2.29 — the overdue alert gets its primary channel back · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.29-result-correction.md` — as your last act, and return it
in-band too. **Do not overwrite `.claude/dispatch/WO-2.29-result.md`**; that is the first round's
record and half the audit trail.

**Routing.** Claude, **Opus** tier. The deciding signal is that this is a cross-repo design-lift
judgment call: Roll Call!'s iOS unlock — the thing being lifted — has just been falsified on glass,
so the work is deciding what of the lift stays faithful (frequencies, note counts, durations, gains:
the WO-2.11 scar) and what must depart, then writing the comment prose that records why a lifted
decision was overridden. The runner-up was Codex, since the owner's recommended fix shape reads
nearly as a spec; set aside because the value here is in what the module's comments *claim* and what
the harness is *permitted to assert*, and a comment asserting a falsified premise is precisely the
defect that shipped last round.

---

## 0. THIS IS A CORRECTION ROUND. READ THIS SECTION FIRST.

WO-2.29 shipped, verified green, and then **failed its 👤 line on the teaching iPad on 2026-08-14**.
This is the same shape WO-1.11 and WO-2.12 took: **the Acceptance criteria stand exactly as written
below and are not to be renegotiated.** Acceptance line 6 is a **confirmed ❌**, not a deferral. What
is wrong is the unlock's *mechanism*.

**Do not re-derive the diagnosis.** It was written from the device with probe evidence attached.

### READ FIRST, before any other file

`TESTING.md` § WO-2.29 — the block headed **"👤 RUN 2026-08-14 — FAILED"** (from roughly line 3175).
It carries the full probe evidence, the four-row log table, and the reasoning. Everything below is a
summary of it, not a replacement for it.

### The diagnosis, in one line

On current WebKit an `AudioContext` created **outside** a user gesture reports `running`, advances
`currentTime`, and starts its oscillators **onto no output**. `src/alert-sound.js` mints a fresh
context at alert time (`playToneSequence()`, ~line 184), five minutes after any touch, so **it can
never sound on iOS**.

The premise this module is built on — stated in its own unlock comment at ~lines 88–95, that WebKit
unlocks the *document* and lets later contexts run — **is what the probe falsified.** Probe 1 (context
built inside the tap) was **audible**; probe 2 (identical code, context built 8 seconds later) was
**SILENT**, with **identical logs**. What carries is the **context**, not the document. The silent
primer buffer buys nothing.

Silent Mode and `navigator.audioSession` are **ruled out**, not untested: probe 1 was raw Web Audio
and it was heard on that device.

### A second defect, found alongside

Probe 3 showed `resume()` **hanging** — neither resolving nor rejecting — on a context created after
the primer had already minted and closed one, with `currentTime` stuck at `0.00`. **iOS caps
concurrent `AudioContext`s**, and this module mints one per alert *plus* one on every
`visibilitychange → visible`. Ordinary classroom use spends the budget.

### The fix shape — recommended by the owner, but **you own it**

One `AudioContext` created **inside the first gesture**, held for the life of the page, **never
`close()`d**, with every later tone scheduled on that same context. `visibilitychange` **resumes that
same context** rather than priming a new one, and re-arms a touch listener for the case where a
resume outside a gesture does not restore output. This dissolves the probe-3 hang as a side effect.

If your reading of the evidence leads somewhere better, take it — and say why in your report. What is
not open: **the frequencies, note counts, durations and gains are still not ours to tune.** The
WO-2.11 scar stands and the lift from Roll Call!'s `dashboard.html:3467`–`3508` stays faithful. **It
is only the unlock that changes.**

### The verification problem — confront it, do not paper over it

**The existing `alertSoundLog()` seam reported green throughout this failure.** It records that
oscillators started on a context reading `running` — which is *exactly what silent probe 2 reported*.
The harness cannot tell audible from inaudible and **no browser automation can**.

So: **your correction must not claim the harness proves audibility.** What it *should* do is consider
what the seam can **newly** assert — the properties the fix actually turns on, which are
machine-checkable in a way audibility is not. For instance:

- that **exactly one** `AudioContext` is ever constructed over the life of the page;
- that it was constructed **inside a gesture**;
- that **no later alert constructs another**;
- that the held context is never `close()`d.

Those are real claims about the fix's mechanism. The **audible** check stays 👤 and goes back to the
iPad — and the `TESTING.md` 👤 rerun recipe needs rewriting to match the new mechanism, since the old
one instructs the teacher to distinguish "the prime died" from "the prime never took", a distinction
this diagnosis has replaced.

### State of the tree — your gate check should not be surprised

- **The tree is intentionally dirty and none of it is contamination.** WO-2.29's own delivered work is
  uncommitted: `src/alert-sound.js` plus 10 modified files, at HEAD `20e4dd3`. **Do not revert it.**
  You are correcting it in place. The owner has not yet decided whether it commits before or after
  this correction.
- **`audio-probe.html` at the repo root must NOT be committed, shipped, or edited.** Untracked,
  temporary, deliberately **not** in `sw.js`. It is the diagnostic that produced the evidence above and
  the owner is keeping it so the fix can be verified on the device the same way. **Leave it alone** —
  do not add it to `sw.js`, do not tidy it, do not delete it. The owner deletes it when the correction
  is confirmed on glass.
- `sw.js` is currently at `planbook-shell-v59`. A correction that changes shipped source needs the
  cache bumped again, or the installed iPad will not receive it — and an iPad that did not receive the
  fix would fail the 👤 line for a reason that has nothing to do with audio.

### Scope

This is the **existing** work order. Do not widen it. The visible off-registry indicator is still
forbidden here (it has its own Trap and needs its own work order), `#srLive` still must not be made
visible, and the sound still must not ship without its off switch.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.29 — the overdue alert gets its primary channel back

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-14 correction · **Size** M · **Depends on** WO-2.9, WO-2.28

**Booked 2026-08-14, out of WO-2.27's close and a reading of Roll Call!.** WO-2.27 asked whether the
pass clock should keep running once the teacher leaves the registry. Answering it turned up something
better than an answer: **the alert is missing the half that makes the question moot**, and the half
is sitting finished in the reference implementation.

**What WO-2.9 shipped, and what it lifted from.** Planbook's overdue alert is two things: a class on
the pass card, and `announce()` into `#srLive`. `#srLive` lives inside `.sr-only`
(`src/live-region.js:4`) and is **visually hidden by design**. So off the registry the card is on a
banner nobody is looking at and the sentence is inaudible to anyone not running a screen reader — a
sighted teacher entering scores with a student twenty minutes gone is told **nothing**, while the
alert is spent all the same, because `markAlerted()` has written `alerted` to the pass and
`level > alertedLevel(pass)` is false ever after. `src/attendance.js:3008`–`3011` says this is by
design: *"there is no sound at all, so this sentence and the colour on the card are the alert."*

**Roll Call! is where that sentence comes from, and it says the opposite.** Its tick fires
`playAlertFive()` / `playAlertTen()` on the two thresholds, gated on `config.soundsOn`
(`src/dashboard.html:3528`–`3536`), and calls `announce()` beside them under a comment naming its
job: *"Announce as text too, so the alarm isn't sound-only (WCAG 1.4.1 / deaf & hard-of-hearing
users)."* **`announce()` is the accessible mirror of an alert, not the alert.** Planbook lifted the
mirror, left the primary channel behind, and then wrote a comment promoting the mirror to primary.
That is a re-derivation of a decision a year of classroom use already tuned, which is the failure
`CLAUDE.md` names under *"Lift the design with the function."*

**Why a sound is the right surface here specifically, and not just the inherited one.** It follows
the teacher across every screen at no cost, because it is not a screen. And **it names nobody** —
which matters more in this app than in Roll Call!, since the alternative surface, a visible
off-registry indicator, would have to put a student's name or a count on whatever the teacher is
projecting onto a classroom wall. The presentation-mode rule in `CLAUDE.md` is the one that would
have to be negotiated; a tone does not go near it.

**What to lift, and the scar that comes with it.** All of `src/dashboard.html:3448`–`3508`, in this
project's idiom:

- `playToneSequence(notes)` — AudioContext oscillators, **no audio assets**, a fresh context per
  sequence closed on a timeout after the last note. This is the shape that keeps the no-dependencies
  rule: it is a browser API, not a library, and nothing is fetched.
- `playAlertFive()` — a steady two-note 660 Hz beep, five times over ~3 s. `playAlertTen()` — six
  rising pairs from 700 Hz at a higher gain, deliberately more insistent than the first. **Take the
  frequencies and the patterns as they are.** They are tuned to carry across an occupied classroom
  and to be told apart from each other without counting; re-deriving them is the WO-2.11 scar again.
- **The iOS unlock, which is the whole risk.** iOS Safari will not let an `AudioContext` created
  outside a user gesture make a sound, so Roll Call! primes one inside a one-shot `touchstart`
  listener and removes it (`src/dashboard.html:3451`–`3462`). Planbook is an installed PWA that iOS
  suspends; the question this work order must actually answer on glass is whether a context primed at
  the start of a period is still good after a suspend-and-resume, and what to do if it is not.

**The preference.** `soundsOn`, defaulting on, in `localStorage` under `planbook_` — a UI preference
and therefore allowed there (`CLAUDE.md`, Conventions), never in the year document. A teacher
proctoring a test needs one tap to silence it, and it belongs beside the presentation-mode control
rather than buried in a settings screen nobody opens mid-period.

**Deliverables**
- The two alert tones and the unlock, lifted, in a module of their own rather than inside
  `src/attendance.js` — the pass code should ask for an alert, not own an oscillator.
- Both thresholds fire the tone as well as `announce()`, and `announce()` stays, with Roll Call!'s
  reason for it carried across in the comment rather than re-invented.
- The `soundsOn` preference, its control, and the sound respecting it.
- `src/attendance.js:3008`–`3011` rewritten: the sentence claiming the app has no sound is the exact
  comment debt WO-2.27 existed to pay, and it will be false the moment this lands.
- A harness check that the tone is requested at each threshold and suppressed when the preference is
  off. The harness cannot hear anything — assert the call, through a seam that exists for that.
- **A precondition clause on WO-2.28's missing-node fixture, while you are in that block.** The alert
  check at `tools/verify-shell.mjs:10083` asserts `alerted === 1` after the clock is wound back and
  never asserts it was **not** `1` before, and `waitForPassAlert()` (`:10005`–`10006`) loops *until*
  the flag is `1` — so a pre-set flag returns on the first read and the check goes green having
  proved nothing.

  **It is not vacuous today, and not by luck:** `:10035`–`10036` cancel the pass and re-issue it, so
  the record the fixture starts from is new and carries no `alerted` key at all — the same property
  the key-set check at `:10209` pins down. What is missing is the guard that keeps that true when
  someone later reorders the block, which is exactly the shape
  [`../dispatch-retro.md`](../dispatch-retro.md) § "Fixture assumptions" says escapes a green run.

  **Put the clause on the fixture check at `:10069`, not on the alert check at `:10083`** — that is
  where the precondition belongs, and `beforeMissingNodePass` (`:10053`–`10056`) is already captured
  there and already asserted, as a bare `!!beforeMissingNodePass` truthiness test. Upgrade that one
  clause to assert the saved record carries no `alerted` key. **A clause on a check that exists, not
  a new `check()` site**: a new site churns the 754 call-site count `tools/README.md:783` has just
  settled, for a fixture guard rather than a new claim.

  *(An earlier draft of this line said "the wound assertion", which is a misreading worth naming
  because it points at the wrong check. `missingNodeWound` is the return of `windBack()` at `:9936` —
  **wound** as the past tense of **wind**, the clock wound back 5.2 minutes, as the comment at
  `:10324` uses it. No injury, no wound to assert on.)*

**Acceptance**
- [x] Crossing either threshold plays its tone, and the two are distinguishable from each other.
- [x] `announce()` still fires at both thresholds, with the same sentence it says today, and the
      comment beside it says it is the accessible equivalent of the sound rather than the alert.
- [x] The `soundsOn` preference silences the tone and leaves the announcement and the card tint
      alone; it lives under `planbook_` and never in the year document.
- [x] The tone is asserted in `tools/verify-shell.mjs` through a seam rather than by listening, and
      the check fails if either threshold stops requesting it.
- [x] No comment in `src/attendance.js` still says this app has no sound.
- [ ] **The alert is audible on the teaching iPad from an installed PWA, on a screen that is not the
      registry, after the app has been backgrounded and resumed.** If the primed context does not
      survive the suspend, the finding and what was done about it are written down here. 👤
- [x] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but
      for the count.

**Traps** — **Do not make `#srLive` visible** as a shortcut to a sighted alert. It is one string
shared by the whole app (`src/live-region.js`) and a pass alert is not the only thing that lands in
it; exposing it would put every announcement the app makes on the glass. **Do not add a visible
off-registry indicator in this work order.** It is a defensible feature and it collides with the
presentation-mode rule — a count is arguable, a name is a disclosure — so it needs its own argument
and its own work order, not a corner of this one. **Do not ship a sound with no off switch**, and do
not make the off switch a year-document field: a teacher who cannot silence it during a test will
silence the whole app instead. **The 👤 line is not optional and no harness closes it.** The unlock
path is the entire risk and `verify-shell.mjs` has never seen a service worker, an installed app, or
a suspend.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance.js`
  - `src/live-region.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**For this correction round specifically, open these too:**

- **`TESTING.md` § WO-2.29, the "👤 RUN 2026-08-14 — FAILED" block** — the primary evidence. Read it
  before you read the code, so you read the code knowing what is false in it.
- **`src/alert-sound.js`** — the module being corrected. Its unlock comment (~lines 88–109) states
  the falsified premise and its two "departures from the lift"; `playToneSequence()` (~line 181) is
  where the per-alert context is minted; the `visibilitychange` handler (~line 139) is where the
  extra one is.
- **`audio-probe.html`** at the repo root — **read-only, and do not commit, edit or delete it.** It is
  the probe that produced the table. Useful for seeing exactly what was measured.
- **`src/attendance.js`** around `paintPassElapsed()` (~lines 3008–3040) — the one caller, plus the
  `visibilitychange` listener WO-2.28 added there. Note there are now two `visibilitychange`
  listeners in play across two modules; understand how they interact before adding a third.
- **`tools/verify-shell.mjs`** ~lines 10342–10540 — the existing seam checks, the ones that were green
  through the failure. Their prose about what the seam measures is now partly false and needs the
  same honesty pass the code does.
- **`src/shell.js`** ~line 2159 — the `window.planbook` seam exposure and its comment on why a seam is
  allowed to exist at all.
- **Roll Call!'s `src/dashboard.html:3448`–`3508`** at
  `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App` — the origin of the lift. Read it
  to keep the tuned half faithful while the unlock departs. Per `CLAUDE.md`: where a Roll Call! rule
  genuinely must not come across, **say so in a comment at the point of departure and name the local
  rule or evidence that beats it.** This correction is exactly that case, and the probe table is the
  evidence to name.
- **`plans/dispatch-retro.md`** § "Fixture assumptions" — for what makes a new harness check evidence
  rather than decoration.

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

## 5. Done means these 7 lines, reported against one by one

1. Crossing either threshold plays its tone, and the two are distinguishable from each other.
2. `announce()` still fires at both thresholds, with the same sentence it says today, and the comment beside it says it is the accessible equivalent of the sound rather than the alert.
3. The `soundsOn` preference silences the tone and leaves the announcement and the card tint alone; it lives under `planbook_` and never in the year document.
4. The tone is asserted in `tools/verify-shell.mjs` through a seam rather than by listening, and the check fails if either threshold stops requesting it.
5. No comment in `src/attendance.js` still says this app has no sound.
6. **The alert is audible on the teaching iPad from an installed PWA, on a screen that is not the registry, after the app has been backgrounded and resumed.** If the primed context does not survive the suspend, the finding and what was done about it are written down here. 👤
7. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but for the count.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

### How this correction round reports against that list

- **Lines 1–5 and 7 currently read `[x]`** from the first round. **They are not free.** You are
  changing the audio path underneath them, so re-establish each one on the corrected code and say so
  with evidence. If your change makes one of them false, say that plainly rather than leaving the
  tick standing — a tick inherited from a build that no longer exists is the worst kind.
- **Line 6 stays `- [ ]`.** It is 👤, you have no iPad, and it is the line that caught this failure.
  Do not tick it, do not soften it, and do not let any harness output be presented as evidence for
  it. Your job on line 6 is to make the *next* iPad run decisive: rewrite the `TESTING.md` 👤 recipe
  so it tests the new mechanism, and say what a **pass** and a **fail** each look like — including
  what a fail would tell the owner next, the way the old recipe tried to.
- **`TESTING.md` § WO-2.29 gets appended to, not rewritten.** The FAILED block is evidence and stays
  exactly as the owner wrote it. Add the correction's own entry after it. The stale sentences
  elsewhere in that section — the ones asserting the seam's guarantees and the old unlock design —
  should be corrected where they are now false, but **do not delete the record of what was believed
  and found wrong.** That record is why the next reader will not rebuild the same thing.
- **The mutation-testing discipline from the first round is the bar to match.** That round watched
  both threshold arms go red under mutation, which is what made line 4 evidence. Any new check you
  add about context identity, count, or gesture-origin should be watched failing too — a check that
  cannot fail is the `dispatch-retro.md` § "Fixture assumptions" shape, and this work order has just
  been burned by a check that could not fail in the way that mattered.
- **Say out loud, in your report, what your correction still cannot prove.** The first round did this
  well (*"No machine heard anything and none can"*) and it is the reason the 👤 line was run at all.
  Keep that habit.

