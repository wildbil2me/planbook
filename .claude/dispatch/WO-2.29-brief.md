# WO-2.29 — the overdue alert gets its primary channel back · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.29-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude at Opus tier**, on this work order's own merits rather than
by fallback. The deciding signal is that the core of it is a design-system lift from Roll Call! — the
work order says in as many words to take `playAlertFive()`/`playAlertTen()`'s frequencies and patterns
*as they are*, and names the WO-2.11 re-derivation scar as what happens when someone doesn't — and it
adds a teacher-facing control next to presentation mode, which is prose and placement judgment. The
runner-up I set aside: the harness seam and the WO-2.28 fixture-precondition clause are mechanically
specified and would have been Codex-shaped on their own, but they are the minority of an M-sized lift,
so no Codex probe was run and the tier was not downgraded.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.29 — the overdue alert gets its primary channel back

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-14 · **Size** M · **Depends on** WO-2.9, WO-2.28

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
- [ ] Crossing either threshold plays its tone, and the two are distinguishable from each other.
- [ ] `announce()` still fires at both thresholds, with the same sentence it says today, and the
      comment beside it says it is the accessible equivalent of the sound rather than the alert.
- [ ] The `soundsOn` preference silences the tone and leaves the announcement and the card tint
      alone; it lives under `planbook_` and never in the year document.
- [ ] The tone is asserted in `tools/verify-shell.mjs` through a seam rather than by listening, and
      the check fails if either threshold stops requesting it.
- [ ] No comment in `src/attendance.js` still says this app has no sound.
- [ ] **The alert is audible on the teaching iPad from an installed PWA, on a screen that is not the
      registry, after the app has been backgrounded and resumed.** If the primed context does not
      survive the suspend, the finding and what was done about it are written down here. 👤
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but
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

**The reference implementation, which is the source of this work order and not optional reading.**
`C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\src\dashboard.html`:

- **Lines 3448–3508** — `playToneSequence()`, `playAlertFive()`, `playAlertTen()`, and the iOS
  unlock at `3451`–`3462`. Read the whole span before writing a line of your own module. Copy the
  frequencies, the note counts, the durations and the gains; do not tune them, do not round them,
  do not "simplify" the two sequences into one parameterised call that loses the fact that they are
  meant to be told apart by ear without counting.
- **Lines 3511–3538** — the tick that calls them, gated on `config.soundsOn`, with `announce()`
  beside them under the WCAG 1.4.1 comment. That comment's *reasoning* is what Deliverable 2 asks you
  to carry across; the wording is yours to fit this project's voice.
- Its `CLAUDE.md` and `design/README.md` for house style, per this project's `CLAUDE.md`
  § "Reference implementation".

**Local files whose convention the new module must match:**

- `src/prefs.js` — owns `PREFIX = 'planbook_'` (`:23`) and the rule that a `planbook_` key holds a UI
  preference and nothing else. `soundsOn` goes through here; do not hand-roll a `localStorage` call.
- `src/presentation.js` and `index.html:233`–`251` — the 🖥 presentation-mode button in the header's
  top row, with the reasoning for its placement in the comment above it. The work order says the
  sounds control belongs *beside* that one; read why that button is where it is before you decide
  where yours goes, and honour the 44px `@media (pointer: coarse)` minimum.
- `src/live-region.js` — `#srLive` and `announce()`. Read it to confirm the Trap: it is one shared
  string for the whole app, which is why making it visible is forbidden.
- `src/attendance.js:2899` (WO-2.28's corrected paragraph) and `:3008`–`3011` (the comment that
  claims this app has no sound — Deliverable 4 rewrites it, Acceptance line 5 checks no sibling
  comment still says it).
- `src/passes.js` — `alerted` / `markAlerted()` / `alertedLevel()`. **Read, do not modify.** WO-2.28's
  Traps forbid touching `alerted`'s semantics and that constraint survives into this work order.

**A baseline to compare against, measured on a clean tree at `20e4dd3` before you started:**
`node tools/wo-sweep.mjs` → `18 checks · 16 passed · 0 failed · 2 to review`, with `754` `check()`
call sites in `tools/verify-shell.mjs` matching `tools/README.md:783`. That count is a sweep check in
its own right, so **every `check()` site you add moves it and you must update `tools/README.md:783` in
the same change.** The WO-2.28 fixture clause deliberately does *not* add a site — it upgrades the
existing `!!beforeMissingNodePass` assertion in place, precisely to keep that number still for a guard
rather than a new claim. Run `node tools/verify-shell.mjs` yourself first, before editing anything, so
"prints what it printed before" is a comparison you actually made rather than an assumption.

**Two things to be explicit about in your result file, because the verifier will look for them:**

1. **The seam.** Acceptance line 4 asks for the tone to be asserted "through a seam that exists for
   that." Say what the seam is, why a headless browser can observe it, and how the check would fail if
   a threshold stopped requesting a tone. A seam that only records what the caller intended, without
   the audio path actually being driven, is worth less — say which kind you built.
2. **The 👤 line (Acceptance 6).** You cannot close it and must not tick it. But you can make it
   cheap for the teacher to run: state exactly what to do on the iPad, in what order, and what the
   two outcomes look like. If your design already anticipates a context that dies across a suspend —
   for example by re-priming on `visibilitychange` or on the next gesture — say so, and say what the
   teacher should observe if that path works versus if it doesn't.

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

