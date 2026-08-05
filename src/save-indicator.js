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

  WO-1.4 wired it: src/store.js calls showSaveState() around every write of the year
  document — `saving` before, `saved` on the transaction completing, `retry` for the one
  retry, `error` when that fails too. Nothing sets `syncing`; Phase 7 owns it.

  WO-1.10 removed demoSaveCycle(), the WO-1.2 stub that ran one pass through all five states at a
  pace a human can read. Its only callers were the component shelf's five state buttons and the
  console, the shelf went, and a demo with no fixture is dead code the next reader has to prove is
  dead. One consequence, recorded rather than fixed: `syncing` now has NO caller in the app at all —
  Phase 7's Drive sync is what will paint it, and until then it is a state in the table below and
  nothing more.

  The chip is declared in <header> since WO-1.10, having lived in the shelf's inset toolbar before
  that. src/shell.css pins it to the top-right corner of the viewport either way, above the modal
  tier, because every edit in this app happens inside a modal that covers the header.

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
