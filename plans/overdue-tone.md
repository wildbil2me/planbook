# The overdue tone — choosing what it sounds like

**Status: built** 2026-11-05 — the owner picked **option 6, Low pulse**; built by
[WO-2.64](work-orders/phase-2-attendance.md#wo-264--the-overdue-tone-becomes-the-low-pulse), ✅ and read on the iPad the same day. WO-2.57 flips the default next; its lock came off the same day.

**Started 2026-11-04**, the owner's call, out of WO-2.57's trial. The two-week classroom trial
passed — every overdue pass chimed at its thresholds on the teaching iPad, the owner's word on
2026-11-04 — and in the same breath: *"I don't love the chime."* WO-2.57 flips `alertSoundOn` to
default **on**, and its Traps forbid touching the tone, so running it as booked would make a sound
the owner does not like the default on every teacher's device. The owner chose to **pick the sound
first and flip the default after**.

## Where the sound is drawn

There is no drawing under `design/mockups/` and there cannot be: PROTOCOL forbids JavaScript, and a
sound is nothing without it. The audition is [`tools/tone-audition.html`](../tools/tone-audition.html),
a hand-run page in the same sense as `tools/audio-probe.html`, published as a private claude.ai
artifact so the iPad can play it on its own speaker without the dev server:
<https://claude.ai/artifact/DTbo3MaJk7ajiJ498ab86q>. Republish from the same file path after editing.

**Every candidate is oscillators only**, scheduled the way `playToneSequence()` schedules them, so the
winner moves into `src/alert-sound.js` as two note lists — no audio file, no dependency. A bell or
marimba note is several oscillators (its partials), each with its own decay; `playToneSequence()`
would gain `type`, `attack` and `partials` per note, which is a small change to one function.

| # | Option | What changes against today | 5-min | 10-min |
|---|---|---|---|---|
| 0 | **Current** — Roll Call!'s square beeps | (reference, note for note from `src/alert-sound.js`) | ~2.8 s | ~2.8 s |
| 1 | Same beeps, softer | Waveform only (triangle) — isolates "the buzz" | ~2.8 s | ~2.8 s |
| 2 | Doorbell | Falling bell ding-dong, once | ~2.1 s | ~2.4 s |
| 3 | Marimba | Wooden rising three-note figure | ~1.6 s | ~1.9 s |
| 4 | Gentle nudge | Two-note "bloop", under a second | ~0.5 s | ~1.2 s |
| 5 | Rising chime | High C–E–G bell arpeggio | ~1.5 s | ~2.3 s |
| 6 | Low pulse | Lower-pitched "ba-dum" heartbeat | ~2.2 s | ~2.1 s |

The page has a **classroom-noise** switch (brown noise with a slow wobble, level adjustable) because
carrying across an occupied room is the reason the current tone is square-wave, and a softer option
has to clear that bar too.

## Ruled

- **2026-11-05, the owner: option 6, Low pulse** — *"let's go with low pulse for now."* The "for now"
  is recorded on purpose: this is a pick, not a final word, and a later change of mind reopens this
  thread rather than editing WO-2.64 in flight. The pick answers question 2, keeps the two levels
  distinct (3), and leaves loudness to WO-2.64's iPad reading (4). Question 1 was not answered
  separately.

## Open questions (as asked, 2026-11-04)

1. **What is it about the current chime?** The buzz (option 1 settles that alone), the length, the
   pitch, or that it sounds like an alarm. The answer may make the choice for us.
2. **Which option, or which parts of which** — a timbre from one and a pattern from another is a
   fine answer.
3. **Do the two levels stay audibly different?** Today the 10-minute tone is the 5-minute tone made
   faster, higher and louder, so it can be told apart without counting. Every candidate keeps that;
   whether it is still wanted is the owner's call.
4. **Loudness** is matched by ear on the page, not measured. The winner's gain is tuned on the iPad
   when it is built, across the room, with real noise.

## What happens once it is ruled

Book one **S** work order for the new tone in `src/alert-sound.js` (the note lists, and
`playToneSequence()` widened to take a waveform, an attack and partials), with a 👤 line read on the
iPad across a room. It must also rewrite the *"THE FREQUENCIES … ARE NOT MINE TO TUNE"* paragraph at
the head of that file, which is true of the lift from Roll Call! and becomes false the day the owner
re-tunes it. **WO-2.57 then depends on it** and stays `🔒` until it lands; its trial line is already
met.

`tools/audio-probe.html` plays the current note pattern on purpose; whether it follows the new tone
is a question for that work order, not for this thread.
