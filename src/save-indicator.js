/*
  The save indicator chip: the one place the app tells the teacher whether her work is safe.

  Five states, and the wash colors are the style guide's (§5):

    saving   ⏳ orange wash   a write is in flight
    saved    ✓  green wash    the write landed; the chip fades itself out after 2s
    error    ✕  red wash      the write failed and the teacher has to know
    syncing  ↻  indigo wash   Drive sync is moving the year document (Phase 7)
    retry    ↻  orange wash   a failed write is being retried

  Roll Call! has a sixth state, `queued`, and it is deliberately absent here. `queued`
  means "sitting in the Apps Script outbox waiting for the network"; Planbook writes to
  IndexedDB on the same device, so a write that has not landed has failed rather than
  queued. Reintroducing `queued` would be reintroducing the outbox, which CLAUDE.md rules
  out. See portable-components.md §6 for the original pair.

  Nothing is wired to a store yet — that is WO-1.4, which replaces the stub below with real
  save state. Until then showSaveState() is called by the component shelf's demo buttons
  and by hand from the console.

  `error` and `retry` also go through announce(): the chip is the only signal that a save
  failed, and a screen-reader user has no reason to be looking at it. `saving`/`saved` are
  deliberately silent — announcing every autosave would make the app unusable with a screen
  reader on.
*/

import { announce } from './live-region.js';

const INDICATOR_ID = 'saveIndicator';

/* Text and voice for each state, in one table so adding a state is one entry and not a
   hunt through an if-chain. `voice: null` means visually-only. */
const STATES = {
  saving:  { text: '⏳ Saving…',   voice: null },
  saved:   { text: '✓ Saved',          voice: null },
  error:   { text: '✕ Save failed',    voice: 'Save failed. Your last change may not be stored.' },
  syncing: { text: '↻ Syncing…',  voice: null },
  retry:   { text: '↻ Retrying…', voice: 'Retrying the last save.' }
};

let fadeTimer = null;

export function showSaveState(state) {
  const el = document.getElementById(INDICATOR_ID);
  const spec = STATES[state];
  if (!el || !spec) return;

  clearTimeout(fadeTimer);
  el.className = 'save-indicator ' + state;
  el.textContent = spec.text;
  if (spec.voice) announce(spec.voice);

  /* `saved` is the only self-clearing state: a permanent green chip stops being read, and
     the ones that are not `saved` are all conditions the teacher should keep seeing. The
     className guard means a state that arrives during the 2s window is not wiped by a
     fade queued for the state before it. */
  if (state === 'saved') {
    fadeTimer = setTimeout(() => {
      if (el.className === 'save-indicator saved') el.className = 'save-indicator';
    }, 2000);
  }
}

/* The stub. WO-1.2 has no store, so this is what proves the chip works: one pass through
   all five states, at a pace a human can read. Called by the shelf's "Cycle all five"
   button; deleted when WO-1.4 wires the real thing. */
export function demoSaveCycle() {
  const order = ['saving', 'saved', 'syncing', 'retry', 'error'];
  order.forEach((state, i) => setTimeout(() => showSaveState(state), i * 1100));
}
