/*
  Presentation mode — the one switch a teacher hits before she plugs in the projector, and the two
  pieces of chrome that say it is on.

  WHY IT EXISTS. Teachers project attendance and gradebook screens onto classroom walls. IEP status
  on that wall is a disclosure to thirty students, and remembering which screens are safe is not a
  plan — so there is one control, in the header, that suppresses every support field in the app at
  once. docs/data-model.md § Accommodations rule 1 is the rule; this is the hand on it.

  WHAT THIS FILE OWNS, AND WHAT IT DELIBERATELY DOES NOT. It owns the header button, the strip that
  appears under the header while the mode is on, and the words both of them say. It owns NO part of
  the visibility rule: whether a support field may be on screen is src/supports.js's single
  question, and this module's whole contribution to it is calling setPresentationMode(). There is
  no second test here, and adding one would be the exact failure the work order names — a screen
  built in Phase 4 inherits presentation mode because it asks that one question, and it can only
  inherit something that lives in one place.

  It also does no re-rendering of anything but its own two elements. src/shell.js chains the
  redraws of the screens that can be holding support data, the way it chains the class bar onto a
  year switch — same reason: neither module has to import the other.

  TWO THINGS THAT LOOK LIKE OVERSIGHTS.

  The button is icon-only and its ON state is a solid white fill on the navy header, which is the
  suite's own on-dark active grammar (`.q-btn.active`, design/style-guide.md §5) and the loudest
  thing this chrome can say without a label the 390px header has no room for. The strip underneath
  is the other half of "obviously on when it's on", and it is the half that survives a teacher not
  looking at the header at all.

  And the strip is not amber. Amber in this app means "act on this" — the install banner and the
  backup nag — and red means "this destroys something". Presentation mode is neither: it is a
  standing state the teacher chose, so it takes the style guide's "special state" purple (§1).
*/

import { presentationMode, setPresentationMode } from './supports.js';
import { announce } from './live-region.js';

const BUTTON_ID = 'presentationBtn';
const STRIP_ID = 'presentationStrip';

/* The button's own label, which is also its tooltip. It says the state AND what the tap does,
   because a control whose label is only its name ("Presentation mode") leaves a teacher who is
   about to project guessing which way round it is. */
const ON_LABEL = 'Presentation mode is on — support details are hidden. Tap to turn it off.';
const OFF_LABEL = 'Presentation mode is off. Tap to hide every support detail before you project.';

/*
  Paint the chrome from the preference. Called at boot — which is what makes the mode survive a
  reload and an app relaunch — and after every flip.

  Read back from presentationMode() rather than from the value that was just written, and that is
  the whole error path this feature has: localStorage can refuse a write (Safari in a private
  window throws on access), and a button that lit up anyway would be a promise that support data
  was hidden when it was not. Refused, the button simply does not move, which is a teacher tapping
  it again rather than a teacher trusting it.
*/
export function refreshPresentationChrome() {
  const on = presentationMode();
  const button = document.getElementById(BUTTON_ID);
  const strip = document.getElementById(STRIP_ID);
  if (button) {
    button.classList.toggle('active', on);
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    button.setAttribute('aria-label', on ? ON_LABEL : OFF_LABEL);
    button.title = on ? ON_LABEL : OFF_LABEL;
  }
  if (strip) strip.classList.toggle('hidden', !on);
}

/*
  Flip it. Both controls that carry the hook — the header button and the strip's own "Turn it off"
  — land here, because the strip only exists while the mode is on and so its tap can only ever mean
  off.

  Announced, and what is announced is the state and never a word of what is now hidden or shown.
  "Support details for Ada Probe are back on screen" is the sentence that reads a student's file
  out loud in a room; src/roster.js's toggleSupports() makes the same distinction.
*/
export function togglePresentationMode() {
  const on = setPresentationMode(!presentationMode());
  refreshPresentationChrome();
  announce(on
    ? 'Presentation mode is on. Support details are hidden everywhere in Planbook.'
    : 'Presentation mode is off. Support details can be opened again.');
  return on;
}
