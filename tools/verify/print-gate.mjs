/* print-gate.mjs — a gate attribute is not a click hook (WO-2.25, correction 2)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, evalJs } = h;

/*
  ══════════ A GATE ATTRIBUTE IS NOT A CLICK HOOK (WO-2.25, correction 2) ══════════

  THE BUG THIS SECTION IS THE ONLY COVERAGE FOR, and there was none of it before: the owner ran the
  👤 printer checklist on 2026-08-13, pressed IGNORE on Chrome's "blocked from automatically
  printing", and from then on EVERY CLICK ANYWHERE ON SCREEN re-opened the print dialog.

  Why. src/print-gate.js leaves the gate attribute on <body> when a print is refused — that is the
  fix, and it is right: the next print of anything asks again and clears it. But src/shell.js's
  delegated click handler reaches its controls with `closest()`, which walks all the way up to
  <body>. The detail screen's Print button was named `data-detail-print`, the same string as its own
  gate, so with the gate stuck on <body> every click matched that hook. The deleted 500ms timer had
  been hiding it inside half a second; the fix that stopped clearing the gate is what made it
  reachable. The button is `data-detail-sheet-print` now.

  WHY THIS ASKS ALL THREE SURFACES AND NOT ONLY THE ONE THAT BROKE. The other two escape by luck of
  naming — `data-attendance-record-print` against `data-attendance-print`,
  `data-grades-record-print` against `data-grades-print` — and a check that re-asserted today's
  accident would be worth nothing. This one is the invariant itself, asked of every gate the app
  has: with that gate stuck on <body>, a click on something that is not a control does not print. A
  fourth print surface (Phase 4's signal lists, Phase 6's glance page) that names its button after
  its gate arrives here red on the run that adds it, which is the whole reason the module boundary
  was drawn.

  IT IS ALSO CHEAP TO GET WRONG IN THE OTHER DIRECTION, so the readings are taken per gate and per
  target, window.print is stubbed and restored, and every attribute this block puts on <body> comes
  off before it returns. Three neutral targets: <body> itself (the empty page a teacher taps to
  dismiss nothing), the app header's own box, and <main>. None of the three carries a hook of its
  own — verified by sweeping index.html's containers against the census at the head of src/shell.js
  — so anything that prints from a click on them came down through <body>.

  Last section in the file, after the WO-3.9 teardown, because it depends on no fixture: it needs a
  booted page with the delegated listener live and the three print modules imported, which is every
  page this app draws.
*/
{
  /* WO-6.3's `data-calendar-print` is the fourth, and it is the one this block was written FOR:
     the paragraph above says in as many words that "a fourth print surface (Phase 4's signal lists,
     Phase 6's glance page) that names its button after its gate arrives here red on the run that
     adds it". The surface that arrived is the month grid rather than the glance page, and its
     button is `data-calendar-month-print` — separate on purpose rather than by luck of naming,
     which is what this list is here to prove rather than to assume. */
  const GATES = ['data-attendance-print', 'data-detail-print', 'data-grades-print',
    'data-calendar-print'];
  const stuck = await evalJs(`(function(){
    var GATES = ${JSON.stringify(GATES)};
    var TARGETS = ['body', 'header.header', 'main'];
    var atRest = GATES.filter(function(a){ return document.body.hasAttribute(a); });
    var real = window.print;
    var calls = 0;
    window.print = function(){ calls++; };
    var out = {}, missing = [], errs = [];
    GATES.forEach(function(attr){
      out[attr] = {};
      TARGETS.forEach(function(sel){
        var el = document.querySelector(sel);
        if (!el) { missing.push(sel); return; }
        /* Re-set before every click: on a build that prints, the first click's own syncAll() takes
           the attribute off again, so a single set would leave the second and third targets asking
           a question that is no longer stuck. NO BACKTICKS IN THIS COMMENT. */
        document.body.setAttribute(attr, '1');
        calls = 0;
        try { el.click(); } catch (e) { errs.push(sel + ': ' + ((e && e.message) || e)); }
        out[attr][sel] = calls;
        document.body.removeAttribute(attr);
      });
    });
    window.print = real;
    GATES.forEach(function(a){ document.body.removeAttribute(a); });
    return { out: out, atRest: atRest, missing: missing, errs: errs,
      targets: TARGETS.length, restored: window.print === real,
      left: GATES.filter(function(a){ return document.body.hasAttribute(a); }) }; })()`);
  /* One check per gate rather than one loop over three, for the reason the isolation checks above
     are written per surface: the claim is about that attribute, and a run that reports "one of them
     printed" has made the reader go and find out which. */
  for (const attr of GATES) {
    const readings = stuck && stuck.out ? stuck.out[attr] : null;
    const printed = readings ? Object.keys(readings).filter((sel) => readings[sel] !== 0) : [];
    check('with `' + attr + '` stuck on <body> — a print the browser refused and the teacher '
      + 'dismissed — a click on something that is not a control does NOT print: the gate is read by '
      + '@media print, never matched as a click hook',
      !!readings && stuck.missing.length === 0 && stuck.errs.length === 0
        && Object.keys(readings).length === stuck.targets && printed.length === 0
        && stuck.restored === true && stuck.left.length === 0,
      'window.print() calls per neutral target = ' + JSON.stringify(readings)
        + (printed.length ? ' — printed from ' + JSON.stringify(printed) : '')
        + '; gates on <body> at rest = ' + JSON.stringify(stuck && stuck.atRest)
        + ', targets not found = ' + JSON.stringify(stuck && stuck.missing)
        + ', click errors = ' + JSON.stringify(stuck && stuck.errs)
        + ', window.print restored = ' + (stuck && stuck.restored)
        + ', attributes left on <body> = ' + JSON.stringify(stuck && stuck.left));
  }
}
}
