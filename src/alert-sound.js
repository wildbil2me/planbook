/*
  The overdue alert's PRIMARY channel: two tones, the iOS unlock that makes them audible, and the
  one switch that silences them.

  WHY THIS FILE EXISTS (WO-2.29). WO-2.9 shipped the overdue alert as a colour on the pass card and
  a sentence into `#srLive`. `#srLive` is inside `.sr-only` and is visually hidden by design
  (src/live-region.js), so off the registry a sighted teacher was told nothing at all — while the
  alert was spent all the same, because src/passes.js's `alerted` had been written and
  `level > alertedLevel(pass)` is false ever after. Roll Call! has had the missing half for a year:
  its tick plays a tone AND announces, and the comment beside its announce() names the announcement
  as the accessible mirror ("so the alarm isn't sound-only — WCAG 1.4.1 / deaf & hard-of-hearing
  users") rather than as the alert. Planbook lifted the mirror and left the primary channel behind.

  A SOUND, AND NOT A VISIBLE OFF-REGISTRY INDICATOR, and the reason is this app's rule rather than
  Roll Call!'s: a tone follows the teacher across every screen at no cost because it is not a
  screen, and it NAMES NOBODY. The other candidate surface would have to put a student's name or a
  count onto whatever is being projected onto a classroom wall, which is the presentation-mode rule
  in CLAUDE.md. A tone does not go near it. (An indicator is a defensible feature and it needs its
  own work order, not a corner of this one.)

  WHAT IS LIFTED, VERBATIM: Roll Call!'s src/dashboard.html:3464–3508 — playToneSequence()'s
  scheduling loop and the two patterns. THE FREQUENCIES, NOTE COUNTS, DURATIONS AND GAINS ARE NOT
  MINE TO TUNE. They are what a year of use settled on to carry across an occupied classroom and to
  be told apart from each other without counting, and re-deriving a tuned decision is the WO-2.11
  scar. The two builders below stay two functions for the same reason: one parameterised call would
  lose the fact that the patterns are meant to be distinguishable by ear.

  WHAT IS NOT LIFTED IS THE UNLOCK (:3449–3462), and that is a correction rather than a preference:
  the iPad falsified it on 2026-08-14 with this file already shipped. The evidence, and the four
  rules that replace it, are at the unlock block below — read that before touching anything here
  that constructs, resumes or closes an AudioContext.

  WHAT THIS FILE OWNS AND WHAT IT DELIBERATELY DOES NOT. It owns the tones, the unlock, the
  `soundsOn` preference and the header control that flips it. It owns NO part of when an alert is
  due: src/passes.js decides what `alerted` means and src/attendance.js decides that a threshold was
  crossed, and this module is asked for a tone at a level. The pass code should ask for an alert, not
  own an oscillator, which is the whole reason this is a file rather than twenty lines in
  src/attendance.js.

  The preference, the tone and the control are one feature with one off switch, so they are one
  module — unlike presentation mode, which is split because the RULE it enforces (src/supports.js)
  is asked by four other screens. Nothing else asks anything about sound.

  NOTHING HERE TOUCHES A STUDENT. The tone is a level, not a name; the log below carries note counts,
  oscillator counts, an audio clock and no identifier of any kind. That is deliberate — a log line is
  one of the four surfaces CLAUDE.md forbids accommodation, medical or plan data from reaching, and
  the simplest way to keep that true forever is for this module never to be handed a student at all.
*/

import { getPref, setPref } from './prefs.js';
import { announce } from './live-region.js';

const BUTTON_ID = 'soundsBtn';
const ICON_SELECTOR = '[data-sound-icon]';

/* The button's own label, which is also its tooltip. It says the state AND what the tap does, for
   the reason src/presentation.js's pair does: a label that is only the control's name leaves a
   teacher about to start a test guessing which way round the switch is. */
const ON_LABEL = 'Alert sounds are on. Tap to silence the overdue-pass alert.';
const OFF_LABEL = 'Alert sounds are OFF — an overdue pass will not make a sound. Tap to turn them back on.';

/* Feather's `volume-2` and `volume-x`, at the 24x24 / stroke 2.2 the other header icons are drawn
   at. The icon carries the state here, where presentation mode's carries only the mode: a speaker
   with a slash through it means muted whichever way you read it, and the objection src/presentation.js
   raises to a crossed-out eye — that it reads as "things are hidden" on a button that is currently
   hiding nothing — does not apply to a slash that is only DRAWN while the thing is off. */
const ICON_ON = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>'
  + '<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'
  + '<path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>';
const ICON_OFF = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>'
  + '<line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';

/* ── THE PREFERENCE ──

   A UI preference and therefore legal in localStorage (CLAUDE.md, Conventions): what is stored is a
   switch position on this browser, which says nothing about any student. It is emphatically NOT a
   field in the year document — that document syncs and is restored from backup, so a teacher who
   silenced her iPad during a test would silence the laptop too, and a restore would carry the
   silence along with the grades. src/prefs.js holds the default and the reasoning beside it.

   It differs per device on purpose, like `presentationMode`: the iPad in the teacher's hand is the
   one that has to make a noise, and the laptop wired to the projector may well be the one that must
   not. */
export function soundsOn() {
  return getPref('soundsOn') !== false;
}

export function setSoundsOn(on) {
  setPref('soundsOn', !!on);
  return soundsOn();
}

/* ── THE iOS UNLOCK, WHICH IS THE WHOLE RISK — AND WHERE THE LIFT STOPS BEING FAITHFUL ──

   THE PREMISE THIS FILE FIRST SHIPPED ON WAS FALSIFIED ON THE TEACHING iPAD, 2026-08-14. It said
   what Roll Call! says (src/dashboard.html:3449–3462): prime a context inside a one-shot
   `touchstart`, throw it away, and WebKit thereafter treats the DOCUMENT as one whose audio was
   started by a gesture, so any later context may sound. Four probes on the device say otherwise —
   the table is in TESTING.md § WO-2.29, "👤 RUN 2026-08-14 — FAILED":

     1. a context built INSIDE the tap                → created suspended, resume() resolved, AUDIBLE
     2. the same code, a context built 8 s after one  → identical log, SILENT
     3. primer first, then a context 8 s later        → resume() never settled, currentTime 0.00
     4. an <audio> element inside the tap             → audible, which is what rules out Silent Mode

   READ 1 AGAINST 2: identical logs, opposite outcomes. On current WebKit a context created outside
   a gesture reports `running`, advances `currentTime`, and starts its oscillators ONTO NO OUTPUT.
   WHAT CARRIES IS THE CONTEXT, NOT THE DOCUMENT — so the silent primer buffer bought nothing, and
   the first shape of this file, which minted a fresh context per alert five minutes after any
   touch, COULD NEVER HAVE SOUNDED ON iOS. Probe 3 is the second defect: iOS caps concurrent
   AudioContexts, and a build that mints one per alert and another per resume spends that budget in
   an ordinary period, after which resume() does not even fail — it hangs.

   SO THE LIFT DEPARTS HERE, and this paragraph exists rather than a silent rewrite because
   CLAUDE.md requires a departure to name the evidence that beats the Roll Call! rule: the evidence
   is the probe table above, run on the device this ships to. (Roll Call! is the live classroom
   fallback and its 5- and 10-minute tones are very likely failing the same way on iPad, masked by
   its visual banner. That is its own to look at, not this work order's.) THE TUNED HALF OF THE LIFT
   IS UNTOUCHED: frequencies, note counts, durations and gains are still not ours to move — the
   WO-2.11 scar — and playToneSequence()'s scheduling loop below is still line for line. It is only
   the unlock that changes.

   WHAT REPLACES IT. Four rules, each load-bearing:

     ONE CONTEXT, BORN IN A GESTURE. The first touch, click or keypress constructs it, and
     unlockAudio() is the only place in this file that constructs one at all.
     HELD FOR THE LIFE OF THE PAGE AND NEVER close()d. Every later tone is scheduled on it. The
     close()-on-a-timeout that came across with the lift is gone: it is what spent the iOS budget,
     and a closed context cannot be the one the next alert needs.
     NOTHING IS CONSTRUCTED OUTSIDE A GESTURE, EVER. An alert that arrives before the first touch
     schedules nothing and records `state: 'locked'`. Minting one there would be silent anyway
     (probe 2) and would cost a slot (probe 3); the arm is still on, so the next touch fixes it. In
     this app that gap is close to hypothetical — sending a student out is a tap, and the pass must
     be five minutes old before anything asks for a tone.
     A RESUME ON THE WAY BACK, AND AN UNCONDITIONAL RE-ARM. `visibilitychange → visible` resumes THE
     ONE context; it does not mint another, which is the defect probe 3 found. The re-arm is
     unconditional — not conditional on the state looking wrong — because `state` is not evidence of
     output on WebKit, which is this whole file's scar: a context reading `running` after an
     interruption is exactly the thing that cannot be trusted, and the cheapest correction available
     is the teacher's next touch resuming it from inside a gesture.

   THE EVENTS: `touchstart` (the iPad, and Roll Call!'s own), `pointerdown` (the laptop, where there
   is no touchstart), and `keydown` (a teacher driving the app from the keyboard would otherwise
   never unlock it at all). Roll Call! listens for touchstart alone because it is an iPad app in
   practice. */
const GESTURE_EVENTS = ['touchstart', 'pointerdown', 'keydown'];

let audioCtx = null;
/* How many contexts this page has EVER constructed. It must reach 1 and stop, and the harness
   asserts exactly that — see alertAudioState() below for what that number is worth and what it is
   not. */
let contextsMade = 0;
let contextOrigin = 'none';
let armed = false;

/* THE ONLY CONSTRUCTOR CALL IN THIS FILE, and it runs from a user-input listener or not at all.
   Idempotent on purpose: one touch fires pointerdown and touchstart both, and a page that has
   already unlocked should get a resume out of this rather than a second context. */
function unlockAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      contextsMade += 1;
      contextOrigin = 'gesture';
    }
    if (audioCtx.state === 'running') { disarm(); return; }
    /* Not awaited, and it does not need to be: the tones are scheduled on the context's own clock,
       and a resume() that hangs (probe 3's shape, on a context this file will never create) costs
       nothing but a promise nobody is holding. */
    if (audioCtx.resume) {
      audioCtx.resume().then(() => {
        if (audioCtx && audioCtx.state === 'running') disarm();
      }, () => {});
    }
  } catch (e) { /* An unlock that cannot run is not a reason to take the app down. */ }
}

/* Armed until the context is actually running, rather than one-shot the way the lift is: a first
   gesture whose resume() did not take would otherwise leave the page with no second chance. */
function arm() {
  if (armed) return;
  armed = true;
  GESTURE_EVENTS.forEach((type) => {
    document.addEventListener(type, unlockAudio, { passive: true });
  });
}

function disarm() {
  if (!armed) return;
  armed = false;
  GESTURE_EVENTS.forEach((type) => {
    document.removeEventListener(type, unlockAudio);
  });
}

arm();

/* THE WAY BACK FROM A SUSPEND. It resumes the one context and re-arms; it constructs nothing, which
   is the whole of what changed here — the shipped version primed (and closed) a context on every
   resume, and that is the second half of what spent iOS's budget.

   IT RUNS BEFORE src/attendance.js's LISTENER, AND THAT ORDERING IS LOAD-BEARING RATHER THAN LUCKY.
   That module imports this one at its top, so this file's body — and this addEventListener — runs
   first, and listeners on the same target fire in registration order. So on the way back from a
   suspend the context is resumed BEFORE paintPassElapsed() computes the alert that the same event
   is about to fire, which is exactly the case Acceptance line 6 goes to the iPad to try. Moving this
   listener into a function called later, or importing the other way round, quietly reverses it. */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (audioCtx && audioCtx.state !== 'running' && audioCtx.resume) {
    try { audioCtx.resume().then(() => {}, () => {}); } catch (e) {}
  }
  arm();
});

/* ── THE SEAM THE HARNESS READS, AND THE HONEST LIMIT OF IT ──

   A headless browser cannot hear anything, so what it is given instead is a record of what the
   AUDIO PATH DID rather than of what the caller meant to do: an entry is written after the
   oscillators have been constructed, connected and started, and it carries how many of them there
   were and what state the context was in. A build whose tone throws records the error and a short
   count; a build that stopped asking records nothing at all.

   WHAT THIS SEAM CANNOT DO IS TELL AUDIBLE FROM INAUDIBLE, and that is not a caveat, it is the
   defect that shipped: through the whole of the 2026-08-14 failure these entries read
   `played: true, oscillators: 10, state: "running"` on an iPad that made no sound, because
   `running` is exactly what silent probe 2 reported. No browser automation can close that gap; the
   👤 line is the only thing that can, and it is the only thing that did.

   WHAT IT CAN NEWLY ASSERT is the MECHANISM the fix turns on, which is machine-checkable in a way
   audibility is not: that exactly one AudioContext was ever constructed, that it was constructed in
   a gesture, that no alert and no resume constructed another, and that it is still open. Each entry
   therefore carries `ctx` — how many contexts existed when this tone was scheduled — and `ctxTime`,
   the context's own clock at that moment. A per-alert context reads a `ctxTime` of ~0 and pushes
   `ctx` up by one each time; a held one reads its whole age in seconds and never moves the count.
   That is the fingerprint of the falsified build, and it is what alertAudioState() is read against.

   Capped, and read-only from outside. Nothing in the app reads it — src/shell.js's window.planbook
   entry says why a seam is allowed to exist here at all. */
const LOG_CAP = 12;
const soundLog = [];

export function alertSoundLog() {
  return soundLog.map((e) => Object.assign({}, e));
}

/* The context itself, described rather than handed over — a harness holding the real object could
   resume or close it and change the thing it is measuring. `state` is read live, so a build that
   went back to closing the context after the last note reports `closed` here. */
export function alertAudioState() {
  return {
    contexts: contextsMade,
    origin: contextOrigin,
    state: audioCtx ? audioCtx.state : 'none',
    currentTime: audioCtx ? Math.round(audioCtx.currentTime * 1000) / 1000 : 0,
    armed: armed,
  };
}

function record(entry) {
  soundLog.push(entry);
  while (soundLog.length > LOG_CAP) soundLog.shift();
  return entry;
}

/*
  Schedule a list of {f, t, dur, gain?} notes ON THE HELD CONTEXT. AudioContext-only — NO AUDIO
  ASSETS, which is what keeps the no-dependencies rule: an oscillator is a browser API, not a
  library, and nothing is fetched. Each note gets a short attack so the repeated beeps stay crisp
  and attention-grabbing.

  THE SCHEDULING LOOP IS ROLL CALL!'s src/dashboard.html:3467–3485, LINE FOR LINE. What is not
  lifted is the frame around it, and the unlock block above is the argument: that version made its
  own context per sequence and closed it on a timeout after the last note, and on iOS that is a
  context born five minutes after the last touch — silent by construction, and one slot of a capped
  budget. So this one is handed the context, never makes one, and never closes it.

  NO CONTEXT MEANS NO TONE AND NO CONSTRUCTION — the alert arrived before the page was ever touched.
  It is recorded as `locked` rather than swallowed, so the seam can tell it from a build that has
  stopped asking. The arm is still on and the next touch will unlock; nothing here needs to retry.
*/
function playToneSequence(notes) {
  let made = 0;
  const ctx = audioCtx;
  if (!ctx) return { oscillators: 0, state: 'locked', ctx: contextsMade, ctxTime: 0, error: '' };
  try {
    /* Cheap, unawaited, and on a context that was born in a gesture — which is the one kind whose
       resume() the device has been seen to settle (probe 1 against probe 3). */
    if (ctx.state !== 'running' && ctx.resume) { try { ctx.resume().then(() => {}, () => {}); } catch (e) {} }
    const t0 = ctx.currentTime;
    notes.forEach((n) => {
      const start = t0 + n.t, end = start + n.dur, peak = n.gain || 0.32;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.value = n.f; osc.type = 'square';
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(peak, start + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.start(start); osc.stop(end + 0.02);
      made += 1;
    });
    return { oscillators: made, state: ctx.state, ctx: contextsMade,
      ctxTime: Math.round(t0 * 1000) / 1000, error: '' };
  } catch (e) {
    return { oscillators: made, state: 'unavailable', ctx: contextsMade, ctxTime: 0,
      error: (e && e.name) || 'Error' };
  }
}

/* 5-minute alert: a steady repeating two-note beep pattern over ~3 s. */
function playAlertFive() {
  const notes = [];
  let t = 0;
  for (let i = 0; i < 5; i++) {
    notes.push({ f: 660, t: t,        dur: 0.18 });
    notes.push({ f: 660, t: t + 0.24, dur: 0.18 });
    t += 0.6;
  }
  return notes;
}

/* 10-minute alert: faster, higher, more insistent — a rising urgency pattern over ~3 s. */
function playAlertTen() {
  const notes = [];
  let t = 0;
  for (let i = 0; i < 6; i++) {
    const f = 700 + i * 64; // climbs to reinforce that it's more urgent than the 5-min tone
    notes.push({ f: f,       t: t,        dur: 0.14, gain: 0.4 });
    notes.push({ f: f + 120, t: t + 0.18, dur: 0.14, gain: 0.4 });
    t += 0.5;
  }
  return notes;
}

/*
  THE ONE THING src/attendance.js CALLS. A level, and nothing else: no student, no class, no pass.

  ONE TONE PER TICK EVEN WHEN TWO STUDENTS CROSS TOGETHER, at the worse of the levels — the same
  shape as the single sentence beside it, and for a sharper reason. Two sequences started in the
  same millisecond are not two alerts, they are one three-second smear a teacher cannot count or
  identify, and the second tone would be the one that told her less. src/attendance.js's caller is
  where the maximum is taken.

  A SILENCED ALERT IS STILL RECORDED, with `played: false` and no oscillators. That is what lets a
  check tell "the preference silenced it" apart from "nothing asked for it any more", which are the
  same absence to anyone listening. `played: true` means this module TRIED — it is not a claim that
  a room heard anything, and on a page nobody has touched yet it sits beside `state: 'locked'` and a
  count of zero.
*/
export function playOverdueAlert(level) {
  const want = level >= 2 ? 2 : 1;
  const notes = want === 2 ? playAlertTen() : playAlertFive();
  /* The three things that make the two patterns tellable apart, carried into the record so that a
     check can assert it without ears: how many notes, what the first one is, and how loud. */
  const shape = { level: want, notes: notes.length, first: notes[0].f, peak: notes[0].gain || 0.32 };
  if (!soundsOn()) {
    record(Object.assign(shape, { played: false, oscillators: 0, state: 'silenced',
      ctx: contextsMade, ctxTime: 0, error: '' }));
    return false;
  }
  const ran = playToneSequence(notes);
  record(Object.assign(shape, { played: true, oscillators: ran.oscillators,
    state: ran.state, ctx: ran.ctx, ctxTime: ran.ctxTime, error: ran.error }));
  return !ran.error && ran.oscillators > 0;
}

/*
  ── THE CONTROL ──

  Painted from the preference at boot — which is what makes a silence survive a reload and an app
  relaunch — and after every flip.

  Read back from soundsOn() rather than from the value just written, which is this feature's whole
  error path and is src/presentation.js's rule applied to the opposite failure: localStorage can
  refuse a write (Safari in a private window throws on access), and a button that showed itself
  muted anyway would promise a silence the next alert would break. Refused, the button does not
  move.

  NO STRIP UNDER THE HEADER, which presentation mode has and this deliberately does not. That strip
  exists because the cost of forgetting presentation mode is a disclosure to a room; the cost of
  forgetting this one is a missed tone on a screen that is still tinted and a sentence that is still
  announced. A second permanent band across every screen is more than that is worth — and the muted
  icon is on the glass either way.
*/
export function refreshSoundChrome() {
  const on = soundsOn();
  const button = document.getElementById(BUTTON_ID);
  if (!button) return;
  button.classList.toggle('active', !on);
  button.setAttribute('aria-pressed', on ? 'false' : 'true');
  button.setAttribute('aria-label', on ? ON_LABEL : OFF_LABEL);
  button.title = on ? ON_LABEL : OFF_LABEL;
  const icon = button.querySelector(ICON_SELECTOR);
  if (icon) icon.innerHTML = on ? ICON_ON : ICON_OFF;
}

/*
  Flip it. Announced, like every other header switch, and what is announced is the state — a teacher
  who has just turned the sound off is entitled to hear that the sentence and the card colour are
  still there, because that is the difference between a quieter alert and no alert.

  It plays no confirmation tone. A beep on the tap would be useful feedback and it is also a beep in
  a silent room during the exact minute a teacher reaches for this control, so it is the owner's
  call rather than this work order's.
*/
export function toggleAlertSounds() {
  const on = setSoundsOn(!soundsOn());
  refreshSoundChrome();
  announce(on
    ? 'Alert sounds are on. An overdue hall pass will sound as well as being announced.'
    : 'Alert sounds are off. An overdue hall pass is still announced and still colours its card.');
  return on;
}
