/*
  The home screen — every class on one page, each one tap away.

  WHY IT EXISTS NOW, before there is anything to glance at. "Every class reachable in one tap" is
  the owner's founding requirement, and this screen is the only place in the app that answers it
  from a standing start: the tab row in the header answers it too, but a strip of tabs is
  navigation, and the thing a teacher opens Planbook to look at is a page. Phase 6 turns this into
  the glance page. It is built now and grown rather than built twice — plans/ROADMAP.md is explicit
  that a glance page built before the things it glances at is a glance page built twice.

  SO THE CARD IS A SLOT, AND THE SLOTS ARE EMPTY ON PURPOSE. classCard() below renders a class's
  identity and then two containers with nothing in them:

    .class-card-state    WO-2.x — whether today's attendance is taken, dropped, or not taken yet
    .class-card-signals  WO-3.x — ungraded work · WO-4.x — the students who need attention

  Empty, not stubbed. A dash, a zero, or a shimmer where a real number goes is a card that looks
  finished and is lying, and this work order's Out of scope line refuses fake counts by name. What
  the slots do carry today is their HEIGHT (src/home.css), so that the line Phase 2 adds drops into
  reserved space instead of reflowing every card on the page. Adding that line is one element and
  one `textContent` inside classCard() — that is the whole of Acceptance line 4, and it is only true
  while this stays the single function that builds a card.

  WHAT A TAP DOES, and why it is not more. Tapping a card makes that class the OPEN class — the
  same state the header's tab row already owns, through the same `data-class-tab` hook, resolved by
  the same src/classes.js. The cards and the tabs are two views of one selection and there is
  deliberately no second answer to "which class is open" anywhere in this file. The attendance and
  gradebook screens a card will eventually open do not exist yet, so a second control on the card
  would be a tap into a placeholder; the one real destination is the class itself.

  NO SUPPORT DATA REACHES THIS SCREEN, which is why this module never asks src/supports.js its one
  visibility question and is deliberately absent from shell.js's flipPresentationMode() redraw
  list. A class name and a colour are not a student's file. The moment a card shows anything out of
  a student's `supports` block — WO-4.x quoting a behavior note into .class-card-signals is the
  obvious way it happens — it asks that module like every other screen does, and it joins that
  list. WO-1.9's own acceptance says to re-verify that inheritance at every later phase; this
  paragraph is where the next reader starts.

  (The function is not named here on purpose. tools/wo-sweep.mjs greps for calls to it to report
  which screens ask, and a mention in a comment saying this one does NOT would show up in that list
  as one that does.)

  IT IS A RENDERER AND NOTHING ELSE. It reads the open document and src/classes.js's read point and
  it writes nothing, so there is no state here to disagree with the header. src/shell.js chains
  refreshHome() wherever a class or the selection can change, the way it chains the class bar onto a
  year switch — see afterClassChange() there.
*/

import { getDoc } from './store.js';
import { getActiveClasses, getSelectedClassId, initials, avatarClass } from './classes.js';

const GRID_ID = 'homeGrid';
const EMPTY_ID = 'homeEmpty';
const EMPTY_CLASSES_ID = 'homeEmptyClasses';
const EMPTY_NO_YEAR_ID = 'homeEmptyNoYear';
const EMPTY_ACTIONS_ID = 'homeEmptyActions';

/*
  Draw the screen from the open document. Called at boot and from every chain in src/shell.js that
  can change which classes exist or which one is open.

  Not subscribed to the store, for the reason src/classes.js gives about the class bar: a subscriber
  fires on every save, and redrawing a screen while a teacher is typing into a dialog over it is how
  focus gets taken out from under her. The moments the answer can change are all known and all
  chained.
*/
export function refreshHome() {
  const grid = document.getElementById(GRID_ID);
  const empty = document.getElementById(EMPTY_ID);
  if (!grid) return;

  const doc = getDoc();
  /* Active classes only, and through src/classes.js rather than by filtering doc.classes here —
     an archived class is one the teacher has put away, and a second opinion about what `archived`
     means is how it comes back onto a screen she thought she had cleared. */
  const list = doc ? getActiveClasses() : [];
  const selectedId = getSelectedClassId();

  grid.textContent = '';
  grid.classList.toggle('hidden', list.length === 0);
  if (empty) empty.classList.toggle('hidden', list.length > 0);
  if (!list.length) { renderEmpty(!!doc); return; }

  list.forEach((cls) => grid.append(classCard(cls, cls.id === selectedId)));
}

/*
  THE CARD RENDERER. One function builds one card, and Acceptance line 4 is the claim that a later
  phase's line lands here and nowhere else.

  Everything is a <span>: a <button>'s content model is phrasing content, so a <div> or a <p> in
  here would be invalid markup that happens to render. The card IS the button rather than a
  container holding one, because the whole card is the target — which is also the note the next
  phase needs: the first card that has to carry a SECOND control (a tappable student name in a
  Phase 4 signal, say) turns this element into a <span> container with the primary tap as its own
  full-bleed button. That is a change inside this function and its stylesheet, which is the boundary
  Acceptance line 4 draws.

  createElement and textContent throughout, never innerHTML: a class name is typed by a teacher and
  pasted out of a school system, and a class called "Bio <3" has to be a class called "Bio <3"
  rather than markup (src/classes.js says the same thing over the same string).
*/
function classCard(cls, isOpen) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'class-card' + (isOpen ? ' open' : '');
  /* The header tab row's own hook, deliberately. Both controls mean "make this the open class", so
     they share one route through src/shell.js and one implementation in src/classes.js. A second
     hook here would be a second answer to which class is open. */
  card.setAttribute('data-class-tab', cls.id);
  if (isOpen) card.setAttribute('aria-current', 'true');
  /* The name is capped and ellipsised on the card (src/home.css), so `title` is where the whole one
     stays reachable — the same arrangement as a header tab. */
  card.title = cls.name;

  const head = document.createElement('span');
  head.className = 'class-card-head';

  /* The same initials and the same one of ten colours the class wears in the manager, imported
     from src/classes.js rather than recomputed: a class that is teal in one place and amber in
     another is a class the teacher has to read twice. */
  const avatar = document.createElement('span');
  avatar.className = 'avatar ' + avatarClass(cls.id);
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = initials(cls.name);
  head.append(avatar);

  const name = document.createElement('span');
  name.className = 'class-card-name';
  name.textContent = cls.name;
  head.append(name);
  card.append(head);

  /* ── the reserved slots ──
     Appended empty, and they stay empty until the work order that owns each one fills it. Their
     space is held by min-height in src/home.css; see this file's header comment for why a
     placeholder here would be worse than nothing. */
  const state = document.createElement('span');
  state.className = 'class-card-state';
  card.append(state);

  const signals = document.createElement('span');
  signals.className = 'class-card-signals';
  card.append(signals);

  return card;
}

/*
  The empty state, which is a deliverable rather than a fallback: a fresh document has to show
  something true that leads to the first class, not a grid of blank cards.

  Two sentences, one shown at a time, both written out in index.html for the reason the install
  banner's copy is — it is the part a teacher actually reads, and it should be revisable without
  opening a JavaScript file. The second is defensive in the same way src/classes.js's
  "No school year open." is: boot leaves the loading screen up when there is no document, so it is
  a state this screen should say rather than a state it should be able to reach.
*/
function renderEmpty(hasDoc) {
  const classes = document.getElementById(EMPTY_CLASSES_ID);
  const noYear = document.getElementById(EMPTY_NO_YEAR_ID);
  const actions = document.getElementById(EMPTY_ACTIONS_ID);
  if (classes) classes.classList.toggle('hidden', !hasDoc);
  if (noYear) noYear.classList.toggle('hidden', hasDoc);
  /* Nowhere to put a class means nothing for the button to do. */
  if (actions) actions.classList.toggle('hidden', !hasDoc);
}
