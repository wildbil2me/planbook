/*
  THE PRINT GATE — one mechanism, three surfaces, and a fourth coming (WO-2.25).

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
*/

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

/* Every gate answered from the DOM, right now. Returns nothing: the answer is on <body>, which is
   the only place @media print can read it. */
function syncAll() {
  const body = document.body;
  if (!body) return;
  gates.forEach((gate) => {
    if (gate.isOnScreen()) body.setAttribute(gate.attr, '1');
    else body.removeAttribute(gate.attr);
  });
}

/*
  Register one surface's gate and hand back the sync function.

  `attr`       the <body> attribute this surface's @media print block is selected under.
  `isOnScreen` a function answering, right now and off the DOM, whether that surface is what the
               teacher is looking at.

  Called at module scope by each caller rather than around each print, and the reason is a print
  that never came through the app's own button at all: the Ctrl+P a teacher presses with the sheet
  already open is the same sheet and wants the same gate. src/shell.js imports all three surfaces at
  startup, so every gate is live from the first paint.

  The returned function is the belt-and-braces set, for an engine that fires neither event: call it
  immediately before window.print(), because the listeners below can only correct the attribute
  later and something has to be true of <body> before the call.
*/
export function registerPrintGate(attr, isOnScreen) {
  gates.push({ attr, isOnScreen: () => !!isOnScreen() });
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
