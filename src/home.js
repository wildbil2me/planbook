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
  and paid for twice, so the whole of it is worth reading before the next slot is filled. The state
  slot is not a line of text: the work order asked for today's state "with a one-tap fix", and a
  control cannot be nested inside another control, because a <button>'s content model is phrasing
  content and an interactive element is not phrasing content. So the card became a <span> CONTAINER
  holding two buttons — the head, which opened the class, and the state line, which opened the
  marking dialog.

  WO-1.13 TOOK THAT BACK, and the reason is the whole of "retire the redundant selector". Once the
  open class's working surface IS the marking screen, "open Period 3" and "mark Period 3's
  attendance" are the same act — two controls, side by side on one card, meaning one thing. So the
  state line is a <span> again, reporting rather than acting, inside the ONE button that opens the
  class. The one-tap fix WO-2.1 asked for is not lost: it is the card's own tap, which lands on the
  grid, and the target is now the whole card rather than the strip at the bottom of it.

  WHAT A TAP DOES. It makes that class the OPEN class and puts its working surface in <main> —
  the same act the header's tab row performs, through the same `data-class-tab` hook, resolved by
  the same src/classes.js. There is deliberately no second answer to "which class is open" anywhere
  in this file, and since WO-1.13 no second hook either.

  AND THE HEADER'S TAB ROW IS NOT ON SCREEN WHILE THIS ONE IS — cards enter, tabs switch, which is
  the owner's call on WO-1.13's "retire the redundant selector" and the thing to preserve here.
  These cards are the ONE way into a class from the grid; the tab row is drawn on the class view
  only, where it does the job the cards cannot, because by then they are not on screen. Two controls
  meaning one thing, side by side, is the defect that reopened Phase 1. If a later phase wants a
  class switcher on this screen, it already has one: the cards.

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
  claim that a later phase's line lands here and nowhere else. WO-2.1 collected on that claim and
  WO-1.13 collected on it again, in the other direction.

  The card is a <span> container with ONE button in it, and that button holds everything a teacher
  reads: the head, the state line, and the reserved slot. Everything inside it is a <span>, because
  a <button>'s content model is phrasing content and a <div> or a <p> in there would be invalid
  markup that happens to render — which is also why the state line cannot be a control and be
  inside this one.

  THE CONTAINER SURVIVED THE COLLAPSE BACK TO ONE CONTROL, on purpose. The border, the fill and the
  hover belong to the card as an object and the button fills it exactly, so the two are the same
  rectangle either way; keeping the container means the day a later phase needs a second control
  with a MEANING of its own — a "3 to grade" chip that opens the gradebook, say — it goes in beside
  this button rather than round it, and the card is not rebuilt a third time.

  createElement and textContent throughout, never innerHTML: a class name is typed by a teacher and
  pasted out of a school system, and a class called "Bio <3" has to be a class called "Bio <3"
  rather than markup (src/classes.js says the same thing over the same string).
*/
function classCard(cls, isOpen) {
  const card = document.createElement('span');
  card.className = 'class-card' + (isOpen ? ' open' : '');

  /* The one tap: full-bleed across the card, and the whole card is what it covers. */
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'class-card-open';
  /* The header tab row's own hook, deliberately. The card and the tab mean "work on this class
     now", so they share one route through src/shell.js and one implementation in src/classes.js.
     A second hook here would be a second answer to which class is open — which is exactly what
     `data-attendance-open` had become by WO-1.13, and why it is gone. */
  open.setAttribute('data-class-tab', cls.id);
  if (isOpen) open.setAttribute('aria-current', 'true');
  /* The name is capped and ellipsised on the card (src/home.css), so `title` is where the whole one
     stays reachable — the same arrangement as a header tab. */
  open.title = cls.name;

  /* The avatar and the name, on one row. A <span> of their own rather than loose in the button,
     because that row is a flex line and the two slots under it are not. */
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
  open.append(head);

  open.append(stateLine(cls));

  /* ── the slot that is still reserved ──
     Appended empty, and it stays empty until the work order that owns it fills it. Its space is
     held by min-height in src/home.css; see this file's header comment for why a placeholder here
     would be worse than nothing. */
  const signals = document.createElement('span');
  signals.className = 'class-card-signals';
  open.append(signals);

  card.append(open);
  return card;
}

/*
  TODAY'S ATTENDANCE FOR ONE CLASS (WO-2.1), reporting rather than acting since WO-1.13.

  Three states, three sentences, three palettes, on every card including the two where there is
  nothing wrong — because the mistake a teacher actually makes is dropping the wrong class or
  marking the wrong one taken, and a card that only spoke up when Planbook thought something was
  wrong would be a card she could not check.

  "Each with a one-tap fix" is still true and is now the card's own tap: the class's working surface
  is the marking grid, so one tap on this card lands on the column this line is describing. That is
  why this is a <span> and not a button — see the header comment. It needs no accessible name of its
  own for the same reason: it is INSIDE the button that opens the class, so the control reads as
  "Period 3 — Biology, Taken · 2 absent" rather than as one of six buttons all called "Not taken
  yet", which is what the WO-2.1 arrangement had to work around.

  It does NOT decide what the state is. src/attendance.js does, once, for this card and for the
  screen it opens — see the import at the top of this file.

  A HALF-TAKEN CLASS SAYS SO HERE, AND THAT IS A DELIVERABLE RATHER THAN A DETAIL (WO-2.10). A class
  the teacher started and was pulled out of holds a `U` for every student she never reached, each
  one of which counts as an absence — so one stray tap on a card makes a meeting with two dozen
  absences in it. The failure is completely silent, it looks exactly like data, and it is otherwise
  found in November when a percentage is wrong. This line is the surface that makes it loud: the
  text leads with the count (src/attendance.js's stateSummary decides the words, here as everywhere),
  and the caution palette comes with it, because a green "Taken" over twelve students nobody has
  looked at is the sentence the whole design is arranged to prevent.
*/
function stateLine(cls) {
  const summary = stateSummary(cls.id, todayISO());
  const line = document.createElement('span');
  /* A modifier on top of the state's own class, not a state of its own: the class IS taken — a
     meeting exists — and stateOf() would answer "taken" with or without it. That is the test, and
     it is worth stating in those terms because src/attendance.js's stateOf() now has FOUR answers
     rather than three: WO-2.3 added `covered`, for a day a calendar event closes, and that one IS a
     state because the class did not meet. This sentence used to read "still has exactly three
     answers" and was left true by every work order until the one that made it false. */
  /* AND WO-2.50's IS A MODIFIER BY THE SAME TEST — a day outside every term the class has, where
     stateOf() answers `not-taken` and goes on answering it, so the state class is unchanged and this
     rides on top of it exactly as `unconfirmed` does. It is the OPPOSITE tuning, though, and that is
     the whole reason decision 4 put the home screen in scope: `unconfirmed` turns the line amber
     because there is something to act on, and this one turns it quiet because there is not. Five
     cards reading "Not taken yet" in the amber alarm on a day school is not in session for her is
     the same false job the grid was inventing, moved one screen back. The words are
     src/attendance.js's stateSummary(), here as everywhere. */
  line.className = 'class-card-state ' + summary.state
    + (summary.unconfirmed ? ' unconfirmed' : '')
    + (summary.offTerm ? ' off-term' : '');
  line.textContent = summary.text;
  return line;
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
