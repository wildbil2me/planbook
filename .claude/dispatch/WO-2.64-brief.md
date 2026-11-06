# WO-2.64 — the overdue tone becomes the low pulse · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.64-result.md` — as your last act, and return it in-band too.

**Routing: Claude Sonnet, by budget fallback.** The work itself is Codex-shaped — the note lists are
copied from `tools/tone-audition.html`, every Acceptance line but the 👤 is mechanically checkable, and
the Traps are mechanics — but `verify-shell.mjs` now runs ~20 minutes (WO-2.63: 1194s) and this
Acceptance demands a clean run plus a mutation run, which cannot fit Codex's 20-minute cap
(`ROUTING.md` § "Which Claude": a budget refusal is Sonnet). Opus was set aside: the head rewrite is a
factual record of the owner's choice, not a judgment trap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.64 — the overdue tone becomes the low pulse

**Ship** — · **Status** 🤖 CLAIMED — 2026-11-05 · **Size** S · **Depends on** — · **Blocks** WO-2.57
**Closes roadmap** *(no box. Owner-directed, 2026-11-05, out of the overdue-tone design thread.)*

**Booked 2026-11-05**, the owner's ruling in [`plans/overdue-tone.md`](../overdue-tone.md). WO-2.57's
two-week trial passed — every overdue pass chimed — but the owner does not like the sound, and
WO-2.57 is about to make it the default on every device. Of the seven candidates on
[`tools/tone-audition.html`](../../tools/tone-audition.html) the owner picked **option 6, Low pulse**,
*"for now"* — so this replaces the tone, and a later change of mind is a new thread, not a reason to
build this one loosely.

**What changes.** Today's tone is Roll Call!'s, lifted note for note: square-wave pairs at 660 Hz
(5 minutes) and rising pairs from 700 Hz at a higher gain (10 minutes), about three seconds each. The
low pulse is a soft triangle-wave *ba-dum*, lower in pitch:

| Level | Pattern | Notes |
|---|---|---|
| 5 minutes | three pairs, 0.9 s apart; each pair `{440 Hz, t 0, dur 0.16, gain 0.6}` then `{440 Hz, t 0.19, dur 0.20, gain 0.5}` | 6 |
| 10 minutes | four pairs, 0.6 s apart; each pair `{523.25 Hz, t 0, dur 0.14, gain 0.62}` then `{523.25 Hz, t 0.16, dur 0.17, gain 0.52}` | 8 |

Both are `type: 'triangle'`, `attack: 0.01`, no partials — the audition page's `pulse` entry is the
source of truth, and it is copied, not re-derived.

**Deliverables**
- **`src/alert-sound.js`**: `playAlertFive()` and `playAlertTen()` return the low pulse's note lists,
  and stay **two functions** (the file's own rule). `playToneSequence()` reads a per-note `type` and
  `attack`, defaulting to `'square'` and `0.015` so a note without them plays exactly as today.
- **The file's head rewritten, not trimmed**: the paragraph saying *"THE FREQUENCIES, NOTE COUNTS,
  DURATIONS AND GAINS ARE NOT MINE TO TUNE"* was true of the lift from Roll Call! and is false the day
  the owner re-tunes it. Say what the tone now is, that the owner chose it on 2026-11-05 from an
  audition, and where the audition lives. The lift's history can stay as history.
- **`tools/verify/attendance-passes.mjs`**: the WO-2.29 check (~716) and the WO-2.31 one (~1027) move
  to the new figures — notes 6 and 8, first frequency 440 and 523.25, peaks 0.6 and 0.62 — and the
  comment above the first stops calling them Roll Call!'s numbers. The two levels must still differ on
  all three axes.
- **`tools/audio-probe.html`** plays the new pattern, because its header promises *"a difference
  between this page and the app is a difference in the app"* and that stays true only if it follows.
  Change the notes and the sentence naming what it plays; nothing else in the probe.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-2.64** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] The 5-minute and 10-minute tones are the low pulse's note lists above, note for note, and the
      harness asserts the recorded shape: 6 notes from 440 Hz at peak 0.6, then 8 from 523.25 Hz at
      peak 0.62.
- [ ] A note with no `type` or `attack` still plays as a square wave with a 0.015 s attack.
- [ ] With the 5-minute tone's first frequency put back to 660 the check goes red; it is reverted, and
      `TESTING.md` § WO-2.64 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the iPad, after a force-quit, with the header speaker on: a pass crossing each threshold
      plays the low pulse, audible from across the room, and the two levels can be told apart without
      counting. If the level needs tuning, the gains settled at this reading are written into
      `TESTING.md` and the harness moves with them.
- [ ] `TESTING.md` § WO-2.64 carries these lines verbatim with the evidence for each.

**Traps** — **Do not flip the default**: `alertSoundOn` stays `false` and is WO-2.57's to change.
**Do not touch the thresholds, `unlockAudio()`, or the one-tone-per-tick rule.** **No audio files** —
oscillators only, which is what keeps the no-dependencies rule. **Do not merge the two builders into
one parameterised call**; the harness reads them as two shapes on purpose.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/overdue-tone.md`
  - `src/alert-sound.js`
  - `tools/audio-probe.html`
  - `tools/tone-audition.html`
  - `tools/verify-shell.mjs`
  - `tools/verify/attendance-passes.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `plans/overdue-tone.md` — the design note carrying the owner's ruling; cite it from the file head.

**Orchestrator notes — the traps this brief adds:**

- **The tree is dirty before you start, and it is the owner's, not a dead dispatch.** Uncommitted:
  `plans/design-threads.md`, `plans/work-orders/README.md`, `plans/work-orders/phase-2-attendance.md`
  (this work order's own booking lives in that diff), and untracked `plans/overdue-tone.md` and
  `tools/tone-audition.html` (your source of truth). **Never `git checkout`, `git restore`, `git stash`
  or `git clean` anything** — it would destroy the booking. Revert your mutation by editing the line
  back by hand, then `grep -rn MUTATION src tools` must find nothing of yours. Edit, never `sed -i`,
  and keep each file's line endings as you found them.
- **Copy the `pulse` entry, do not re-derive it.** `tools/tone-audition.html` ~line 210: `N.A4` is 440,
  `N.C5` is 523.25; `rep(n, gap, fn)` repeats the pair `n` times at `gap`-second offsets — read `rep`
  and `N` in that file to get the absolute `t` of every note right, and match the shape `alert-sound.js`
  already returns (its existing builders show whether `t` is absolute or relative).
- **`playToneSequence()` defaults**: a note with no `type` plays `'square'`, no `attack` plays `0.015`.
  The second Acceptance line wants that proved, not asserted by reading — a harness check on a note
  object without the keys, or the recorded oscillator type/attack for such a note, whichever the
  existing `attendance-passes.mjs` recording machinery can see. Read how the WO-2.29/WO-2.31 checks
  record notes before choosing.
- **Run budget**: two full `verify-shell.mjs` runs at ~20 minutes each (clean, final). For the
  mutation round you may run only the section that holds the WO-2.29/2.31 checks if the harness
  supports a section filter (see `tools/README.md`); paste the red output into `TESTING.md` § WO-2.64.
  Run harness commands in the background with output to a log and read its `EXIT=` line — `grep -c`
  on a green log exits 1 and looks like a failure.
- **`sw.js` `CACHE` bump** is required (`src/alert-sound.js` is in `SHELL`); `tools/audio-probe.html`
  and the harness are not.
- **`tools/README.md`** may record call-site or check counts that `wo-sweep.mjs` compares; if the sweep
  goes red on a count after your change, update the recorded number — that is the last mile, not scope
  creep.
- **CHANGELOG.md**: draft the entry in your result file; do not write it to the file.
- Do not tick the 👤 line. Do not commit.

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
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
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

1. The 5-minute and 10-minute tones are the low pulse's note lists above, note for note, and the harness asserts the recorded shape: 6 notes from 440 Hz at peak 0.6, then 8 from 523.25 Hz at peak 0.62.
2. A note with no `type` or `attack` still plays as a square wave with a 0.015 s attack.
3. With the 5-minute tone's first frequency put back to 660 the check goes red; it is reverted, and `TESTING.md` § WO-2.64 shows the red output.
4. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
5. 👤 On the iPad, after a force-quit, with the header speaker on: a pass crossing each threshold plays the low pulse, audible from across the room, and the two levels can be told apart without counting. If the level needs tuning, the gains settled at this reading are written into `TESTING.md` and the harness moves with them.
6. `TESTING.md` § WO-2.64 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-2.64 — it is a deliverable, not a permission.** Add `### WO-2.64 — the overdue tone becomes the low pulse` under `## Phase 2 — Attendance`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-2.64` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

