/*
  The save indicator chip: the one place the app tells the teacher whether her work is safe.

  Five states, and the wash colors are the style guide's (§5):

    saving   ⏳ orange wash   a write is in flight
    saved    ✓  green wash    the write landed; the chip fades itself out after 2s
    error    ✕  red wash      the write failed and the teacher has to know
    syncing  ↻  indigo wash   Drive sync is moving the year document (WO-7.2)
    retry    ↻  orange wash   a failed write is being retried

  Roll Call! has a sixth state, `queued`, and it is deliberately absent here. `queued`
  means "sitting in the Apps Script outbox waiting for the network"; Planbook writes to
  IndexedDB on the same device, so a write that has not landed has failed rather than
  queued. Reintroducing `queued` would be reintroducing the outbox, which CLAUDE.md rules
  out. See portable-components.md §6 for the original pair.

  WO-1.4 wired it: src/store.js calls showSaveState() around every write of the year
  document — `saving` before, `saved` on the transaction completing, `retry` for the one
  retry, `error` when that fails too.

  WO-1.10 removed demoSaveCycle(), the WO-1.2 stub that ran one pass through all five states at a
  pace a human can read. Its only callers were the component shelf's five state buttons and the
  console, the shelf went, and a demo with no fixture is dead code the next reader has to prove is
  dead. One consequence, recorded rather than fixed: `syncing` had NO caller in the app at all for
  the next twenty work orders, because Phase 7's Drive sync was what would paint it.

  WO-7.2 IS THAT WORK ORDER, AND `syncing` HAS A CALLER AS OF 2026-09-07. src/drive-sync.js paints
  it when a transfer is actually about to leave the device, and paints `retry` for the one retry it
  makes of a request that is safe to repeat — the same one-retry shape src/store.js uses, and for
  the same reason. So this table now has two writers rather than one, and they divide cleanly:
  THE STORE OWNS EVERY STATE ABOUT THIS DEVICE'S OWN STORAGE AND SYNC OWNS `syncing`.

  WHAT SYNC DELIBERATELY DOES NOT PAINT IS `error`, and that is a ruling rather than an oversight.
  This chip's `error` reads "✕ Save failed" and announces "Your last change may not be stored" —
  and a sync that fails means nothing of the kind: every failure path in src/drive-sync.js leaves
  the document on this device exactly as it was. Painting this red for one would tell a teacher her
  grades are in danger at the moment they are not, which is the same lie as a green tick over a
  write that was thrown away, in the other direction. A failed sync reports in the Drive panel in
  the About modal, which is where the teacher tapped and where the sentence can be a paragraph.

  The chip is declared in <header> since WO-1.10, having lived in the shelf's inset toolbar before
  that. src/shell.css pins it to the top-right corner of the viewport either way, above the modal
  tier, because every edit in this app happens inside a modal that covers the header.

  `error` and `retry` also go through announce(): the chip is the only signal that a save
  failed, and a screen-reader user has no reason to be looking at it. `saving`/`saved` are
  deliberately silent — announcing every autosave would make the app unusable with a screen
  reader on.

  ONE KNOWN IMPRECISION, LEFT ALONE ON PURPOSE (WO-7.2). `retry` announces "Retrying the last
  save", which is exactly right for src/store.js and slightly wrong for src/drive-sync.js, where
  what is being retried is a request to Drive rather than a save. Three ways to fix it were
  weighed and all three cost more than the imprecision: re-wording it to something that covers
  both makes the STORE's announcement vaguer, and the store's is the one a teacher hears when her
  grades are at risk; a sixth state means a sixth wash colour for a condition that lasts six
  hundred milliseconds; and taking `retry` off sync leaves the deliverable's named state unwired.
  The visible half — "↻ Retrying…" — is accurate for both. Recorded here rather than in a report
  nobody will find, because the next reader to notice it should know it was seen.
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
