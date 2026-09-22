/*
  ── THIS FILE IS HOW `body[data-modal-print]` IS MET, AND THAT IS A RULING (WO-8.4, 2026-09-21) ──

  design/style-guide.md's print idiom is one attribute, `body[data-modal-print]`, that flips the page
  to print a single modal, and WO-8.4's second deliverable asked for it by that name. It is not built,
  and it must not be built beside what is here: the owner ruled on 2026-09-21 that the four
  per-surface gates below discharge that deliverable in a better form. The reason is the paragraph
  headed THE ATTRIBUTE STAYS ONE PER SURFACE — two of this app's four print surfaces are views in
  <main> rather than modals, and one shared attribute re-shows whichever surface its block names, so
  a print from any other surface hides the app and reveals something that is not on screen. Four
  attributes, one mechanism, is the style guide's idiom with a subject per surface rather than a
  second idiom. A later reader who finds `data-modal-print` nowhere in src/ has found the ruling,
  not an omission.

  AND THE STYLE GUIDE'S OTHER HALF, `#printHeader`, IS BUILT, AND IT IS ANSWERED HERE (WO-8.4). The
  one hidden element in index.html that titles every printout is painted by syncAll() below, from
  the surface whose gate is on — see § THE HEADER at the foot of this comment block.

  THE PRINT GATE — one mechanism, four surfaces (WO-2.25; the fourth is WO-6.3's calendar).

  Every print surface in this app is drawn by hiding the rest of the page: its `@media print` block
  is selected under an attribute on <body>, so a Ctrl+P made anywhere else prints the ordinary page
  rather than a blank sheet. That regression has already happened once here, which is why every rule
  in all three blocks is gated — including the ones that only turn something ON.

  THE ATTRIBUTE STAYS ONE PER SURFACE and that part was always right, so it is an ARGUMENT rather
  than a constant in this file: `data-attendance-print` re-shows #attendanceRecordModal,
  `data-detail-print` re-shows #detailView, `data-grades-print` re-shows #gradesRecordModal, and a
  shared one would print the wrong surface rather than nothing — src/scores.css § THE PRINTED PAGE
  says what that costs, at the point where the next author would be tempted. It is the MECHANISM
  below that must stop being copied: it was lifted three times (WO-2.6 wrote it, WO-3.7 copied it,
  WO-3.9 copied it again), so one mistake came to live in three places and be fixed in one.

  WHICH SURFACE IS ON SCREEN IS ALSO AN ARGUMENT, and nothing in this file may learn to answer it.
  A caller hands in a predicate because the two shapes are not alike: two of these surfaces are
  dialogs and one is a view inside <main> (which is why WO-3.7's print block is the hard one), and a
  module that reached for `.hidden`, a modal id or the view system would have to be edited every
  time a fourth surface arrives in a fifth shape. It takes the question and never the answer.

  ── THE GATE IS ANSWERED WHEN IT IS READ, NOT SET ON A TIMER (owner's bug, 2026-08-12) ──

  This block is the record of what went wrong, and it lives here now because it is one story about
  one mechanism rather than three about three. WO-2.6's arrangement, lifted into src/detail.js and
  then into src/grades-report.js, was: set the attribute, call window.print(), take it off 500ms
  later, on the reasoning that window.print() blocks while the browser's own dialog is up. It does
  not always, and the owner found both ways it comes apart on the SECOND tap of one sitting:

    CHROME THROTTLES A REPEATED print(). The second call in a short window is refused with "This
    website has been blocked from automatically printing" — and a REFUSED print() does not block, it
    returns at once. 500ms later the timer took the gate off. Then the teacher pressed Allow, the
    print finally happened with no gate on, and what came out of the printer was the whole app.

    CHANGING PORTRAIT TO LANDSCAPE re-generates the preview from the LIVE DOM. Whatever the
    attribute is at that moment is what prints, and by then the timer had long since cleared it.

  Both are one mistake, not two: the gate was SET at the moment we asked to print and READ at the
  moment the browser actually printed, and those are not the same moment — the gap is however long
  the teacher looks at the preview. So it is answered at the moment it is read instead. `beforeprint`
  fires immediately before the page is serialised — on the delayed print the teacher allowed, and
  again on each re-layout inside the preview — and the answer is not remembered from the tap. It is
  asked of the DOM, through the predicate: is that surface the thing on screen?

  THAT MAKES IT SELF-CORRECTING RATHER THAN BALANCED, which is the property the timer never had. A
  print the teacher BLOCKS outright leaves the attribute on, and nothing takes it off until the next
  print of anything at all asks the question again and clears it. That shape is right and it stays.

  WHAT IS NOT TRUE IS THAT THE ATTRIBUTE LEFT ON COSTS NOTHING. This block said so until 2026-08-13
  — "that costs nothing, because the only block that reads it is @media print" — and @media print is
  not the only reader. src/shell.js's delegated click handler reads <body> as well, because
  `closest()` walks all the way up to it: an attribute sitting on <body> is matched by EVERY click on
  screen for as long as it sits there. The detail screen's Print button was named `data-detail-print`
  — the same string as its own gate — and the owner found what that costs on her own machine within
  the day: press Ignore on Chrome's "blocked from automatically printing" and every click anywhere
  afterwards re-opened the print dialog. The deleted 500ms timer had been hiding it by clearing the
  attribute inside half a second; leaving the gate on, which is the fix above, is what made it
  reachable. The sentence that made the stuck attribute look free is the sentence that cost the bug.

  SO THE GATE MAY STAY ON, UNDER ONE INVARIANT THAT EVERY SURFACE REGISTERING HERE OWES: a gate
  attribute is never also a click hook. The `attr` handed in below must appear nowhere in
  src/shell.js's delegated `closest('[data-…]')` census, and the control that asks for the print is
  therefore named differently ON PURPOSE — `data-detail-sheet-print` for `data-detail-print`,
  `data-attendance-record-print` for `data-attendance-print`, `data-grades-record-print` for
  `data-grades-print`. Two of those three were separate by accident of naming; the fourth surface
  does not get to rely on luck. There is no state here that can get STUCK on — but there is state
  that STAYS on, which is a different sentence, and it is the one this module has to be read under.

  AND IT IS WHY THERE IS NO TIMER LEFT IN THE TREE. The guarantee the timeout used to give — a
  Ctrl+P made when no print surface is up leaves the ordinary page alone — is now given by the same
  listener, in its other arm: the predicate answers false and the attribute comes off. That is the
  claim to keep watching, because it is the one somebody deleting "the else branch that does
  nothing" would take away.

  ── § THE HEADER: #printHeader, PAINTED WHEN THE GATE IS ANSWERED (WO-8.4) ──

  One element in index.html, a direct child of <body> ahead of everything else, styled in
  src/shell.css § PRINT HEADER: what the sheet is, the class, the term, and the day it came off the
  printer. It is display:none on screen and on every print that no gate claimed, and each surface's
  block re-shows it beside its own surface — so a Ctrl+P from the roster prints no empty band.

  IT IS FILLED HERE, AT `beforeprint`, AND NOT BY EACH SURFACE WHEN IT DRAWS, for the reason the
  whole of this file exists. One element is shared by four surfaces; a surface that wrote it on
  open would leave its words there after it closed, and the next Ctrl+P from a different screen
  would print the grade sheet's title over the calendar. The question "which surface is printing"
  is already answered in syncAll(), at the moment the page is serialised, so the header is answered
  from the same answer at the same moment — a throttled print() or a preview turned to landscape
  re-reads both together, and they cannot disagree.

  WHAT A SURFACE HANDS IN IS WORDS AND NOTHING ELSE: `{ title, subject, lines, brief, printed }`,
  five strings and a list of strings, built by the surface out of its own record. This module
  decides where the words go and never what they say — the same division as `isOnScreen`, which
  takes the question and never the answer. It is therefore also incapable of printing anything a
  surface did not hand it, which is the half of WO-8.4's third acceptance line that lives in this
  file: no student, no support field and no review date is on that shape, and nothing here could go
  and fetch one.

  THE CONTINUATION LINE (`.print-header-running`) IS FILLED FROM THE SAME WORDS. The two surfaces
  that force page breaks — the attendance record's day-by-day slices and the grade sheet's slices —
  put an empty one at the head of each slice, and every one in the document is written here at the
  same moment as the header, so a loose second page names the same class and the same print date
  as the first. The owner's ruling (2026-09-21) is that a line at the forced breaks is enough: a
  true running header on every page needs `position: fixed` and a reserved margin, and Chrome and
  Safari disagree enough to print one over a long roster's first row.
*/

const HEADER_ID = 'printHeader';
const RUNNING_CLASS = 'print-header-running';

/*
  Every gate that has registered, as `{ attr, isOnScreen }` and nothing else. The list is the whole
  of what this module knows about the app.

  IT IS A LIST AND NOT ONE GATE PER LISTENER, and that is a decision rather than a tidy-up. The
  sentence above — "the next print of anything at all asks the question again and clears it" — is
  true of `beforeprint` either way, because every registered listener fires on the same event. It is
  NOT true of the belt-and-braces set below unless the question is asked of every surface: a teacher
  who blocks a print of the attendance record outright leaves that attribute on, and on an engine
  that fires no `beforeprint` at all, printing a student's detail afterwards would serialise a page
  carrying two gates and print both surfaces. One answer per print, for every surface, is what stops
  a stale attribute reaching a printer. (It is NOT what stops it reaching a click handler — nothing
  here can do that, and the invariant above is what does.)
*/
const gates = [];

/* createElement and textContent, never innerHTML — a class name is typed by the teacher and a term
   label can hold anything, and both arrive here as words. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/*
  THE HEADER AND EVERY CONTINUATION LINE, written from one surface's words or emptied. Emptied when
  no gate is on, so that a stale title cannot sit in the element waiting for a stylesheet change to
  show it; the element is hidden then anyway, and this is the second reason it prints nothing.
*/
function paintHeader(head) {
  const box = document.getElementById(HEADER_ID);
  const running = document.querySelectorAll('.' + RUNNING_CLASS);
  if (box) box.textContent = '';
  running.forEach((line) => { line.textContent = ''; });
  if (!head) return;

  const printed = 'Printed ' + (head.printed || '');
  if (box) {
    const who = el('div', 'print-header-who');
    who.append(el('div', 'print-header-title', head.title || ''));
    if (head.subject) who.append(el('div', 'print-header-class', head.subject));
    (head.lines || []).filter(Boolean)
      .forEach((line) => who.append(el('div', 'print-header-term', line)));
    const stamp = el('div', 'print-header-stamp');
    stamp.append(el('b', '', printed));
    stamp.append(el('br'));
    stamp.append(document.createTextNode('Planbook'));
    box.append(who, stamp);
  }
  running.forEach((line) => {
    const left = el('span');
    left.append(el('b', '', head.title || ''));
    left.append(document.createTextNode([''].concat([head.subject, head.brief].filter(Boolean))
      .join(' · ')));
    line.append(left, el('span', '', printed + ' · continued'));
  });
}

/* Every gate answered from the DOM, right now, and the header answered from the same answer.
   Returns nothing: the answer is on <body> and in #printHeader, which is where @media print reads
   it. If two surfaces are somehow up at once, both already print (that is the gates' own
   behaviour, unchanged) and the header names the first registered — which is a sheet titled by one
   of the two things on it rather than by nothing. */
function syncAll() {
  const body = document.body;
  if (!body) return;
  let head = null;
  gates.forEach((gate) => {
    if (gate.isOnScreen()) {
      body.setAttribute(gate.attr, '1');
      if (!head && gate.headOf) head = gate.headOf() || null;
    } else {
      body.removeAttribute(gate.attr);
    }
  });
  paintHeader(head);
}

/*
  Register one surface's gate and hand back the sync function.

  `attr`       the <body> attribute this surface's @media print block is selected under.
  `isOnScreen` a function answering, right now and off the DOM, whether that surface is what the
               teacher is looking at.
  `headOf`     (WO-8.4) a function answering what #printHeader should say for that surface, as
               `{ title, subject, lines, brief, printed }` — or null, and the header stays empty.
               Asked only when `isOnScreen` has just said yes. Words only; see § THE HEADER above.

  Called at module scope by each caller rather than around each print, and the reason is a print
  that never came through the app's own button at all: the Ctrl+P a teacher presses with the sheet
  already open is the same sheet and wants the same gate. src/shell.js imports all three surfaces at
  startup, so every gate is live from the first paint.

  The returned function is the belt-and-braces set, for an engine that fires neither event: call it
  immediately before window.print(), because the listeners below can only correct the attribute
  later and something has to be true of <body> before the call.
*/
export function registerPrintGate(attr, isOnScreen, headOf) {
  gates.push({ attr, isOnScreen: () => !!isOnScreen(),
    headOf: typeof headOf === 'function' ? headOf : null });
  /* One pair of listeners for the whole app rather than a pair per surface — same reason the sync is
     over the list: what a print event means is "answer every gate", and two ways of saying that is
     how the next one comes to disagree with the others. */
  if (gates.length === 1) {
    window.addEventListener('beforeprint', syncAll);
    /* Off once the browser is finished, so that <body> outside a print carries nothing. This is the
       tidy path; syncAll() is the safety one, and nothing depends on this firing. */
    window.addEventListener('afterprint', () => {
      const body = document.body;
      if (body) gates.forEach((gate) => body.removeAttribute(gate.attr));
    });
  }
  return syncAll;
}
