/*
  The home screen — every class on one page, each one tap away.

  WHY IT EXISTS NOW, before there is anything to glance at. "Every class reachable in one tap" is
  the owner's founding requirement, and this screen is the only place in the app that answers it
  from a standing start: the tab row in the header answers it too, but a strip of tabs is
  navigation, and the thing a teacher opens Planbook to look at is a page. Phase 6 turns this into
  the glance page. It is built now and grown rather than built twice — plans/ROADMAP.md is explicit
  that a glance page built before the things it glances at is a glance page built twice.

  SO THE CARD IS A SLOT. classCard() below renders a class's identity and then two containers:

    .class-card-state    WO-2.1 — whether today's attendance is taken, dropped, or not taken yet
    .class-card-signals  WO-3.x — ungraded work · WO-4.x — the students who need attention

  The second is still empty, and empty rather than stubbed: a dash, a zero, or a shimmer where a
  real number goes is a card that looks finished and is lying. What an empty slot carries is its
  HEIGHT (src/home.css), so that the line a later phase adds drops into reserved space instead of
  reflowing every card on the page.

  THE FIRST SLOT WAS FILLED BY WO-2.1, and it cost this card its shape — which was foreseen here
  and is worth reading before the next one is filled. The state slot is not a line of text: the
  work order asks for today's state "with a one-tap fix", and a control cannot be nested inside
  another control, because a <button>'s content model is phrasing content and an interactive
  element is not phrasing content. So the card is now a <span> CONTAINER holding a full-bleed
  primary button — this file's paragraph below predicted exactly that, for exactly this reason —
  plus the state button beside it. WO-1.10's own acceptance line said adding the Phase 2 line
  should touch only the card renderer, and it did: this function and its stylesheet, and nothing
  else on the screen.

  WHAT A TAP DOES, and why there are now two of them. Tapping the card's head makes that class the
  OPEN class — the same state the header's tab row already owns, through the same `data-class-tab`
  hook, resolved by the same src/classes.js. The cards and the tabs are two views of one selection
  and there is deliberately no second answer to "which class is open" anywhere in this file. The
  state button is not a second answer either: it carries `data-attendance-open`, and src/shell.js
  routes that through the SAME selection before it opens the marking screen — so the card, the tab
  and the state line all mean "this class" and one module resolves all three.

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

  IT IS A RENDERER AND NOTHING ELSE. It reads the open document, src/classes.js's read point and
  src/attendance.js's state predicate, and it writes nothing — so there is no state here to
  disagree with the header or with the marking screen. src/shell.js chains refreshHome() wherever a
  class, the selection, or today's attendance can change, the way it chains the class bar onto a
  year switch — see afterClassChange() and afterAttendanceChange() there.
*/

import { getDoc } from './store.js';
import { getActiveClasses, getSelectedClassId, initials, avatarClass } from './classes.js';
/* The state slot's whole content, from the module that owns what a state IS. Nothing here decides
   whether a class was taken, dropped or forgotten; src/attendance.js's stateSummary() decides it
   once, for this card and for the marking screen both, which is what stops the two disagreeing
   about the same class on the same day. */
import { stateSummary, todayISO } from './attendance.js';

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
  THE CARD RENDERER. One function builds one card, and WO-1.10's fourth acceptance line is the
  claim that a later phase's line lands here and nowhere else. WO-2.1 collected on that claim.

  The card is a <span> container with two buttons in it — the head, which opens the class, and the
  state line, which opens the marking screen. Everything inside a button is a <span>, because a
  <button>'s content model is phrasing content and a <div> or a <p> in there would be invalid
  markup that happens to render.

  createElement and textContent throughout, never innerHTML: a class name is typed by a teacher and
  pasted out of a school system, and a class called "Bio <3" has to be a class called "Bio <3"
  rather than markup (src/classes.js says the same thing over the same string).
*/
function classCard(cls, isOpen) {
  const card = document.createElement('span');
  card.className = 'class-card' + (isOpen ? ' open' : '');

  /* The primary tap: full-bleed across the card, and it is what used to be the whole card. */
  const head = document.createElement('button');
  head.type = 'button';
  head.className = 'class-card-open';
  /* The header tab row's own hook, deliberately. Both controls mean "make this the open class", so
     they share one route through src/shell.js and one implementation in src/classes.js. A second
     hook here would be a second answer to which class is open. */
  head.setAttribute('data-class-tab', cls.id);
  if (isOpen) head.setAttribute('aria-current', 'true');
  /* The name is capped and ellipsised on the card (src/home.css), so `title` is where the whole one
     stays reachable — the same arrangement as a header tab. */
  head.title = cls.name;

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

  card.append(stateControl(cls));

  /* ── the slot that is still reserved ──
     Appended empty, and it stays empty until the work order that owns it fills it. Its space is
     held by min-height in src/home.css; see this file's header comment for why a placeholder here
     would be worse than nothing. */
  const signals = document.createElement('span');
  signals.className = 'class-card-signals';
  card.append(signals);

  return card;
}

/*
  TODAY'S ATTENDANCE FOR ONE CLASS, AND THE TAP THAT FIXES IT (WO-2.1).

  Three states, three sentences, three palettes, and it is a button in all three — including the two
  where there is nothing wrong. "Each with a one-tap fix" reads most obviously as a route out of
  "not taken yet", but the mistake a teacher actually makes is dropping the wrong class or marking
  the wrong one taken, and a card that only offered the fix when Planbook thought one was needed
  would be a card with no way back from either. One control, always the same control, always one
  tap from the same place on the grid.

  It does NOT decide what the state is. src/attendance.js does, once, for this card and for the
  screen it opens — see the import at the top of this file.
*/
function stateControl(cls) {
  const summary = stateSummary(cls.id, todayISO());
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'class-card-state ' + summary.state;
  btn.setAttribute('data-attendance-open', cls.id);
  btn.setAttribute('aria-haspopup', 'dialog');
  /* The visible text says the state; the accessible name has to say the state AND whose, because a
     grid of six cards otherwise reads as six buttons all called "Not taken yet". Style guide §7. */
  btn.setAttribute('aria-label', summary.text + ' — attendance for ' + cls.name);
  btn.title = summary.text + ' — take attendance for ' + cls.name;
  btn.textContent = summary.text;
  return btn;
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
