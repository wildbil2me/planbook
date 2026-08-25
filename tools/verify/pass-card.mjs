/* pass-card.mjs — the pass card is ONE ROW on a thumb, at the cap (WO-2.11)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel } = h;

/* ───────── the pass card is ONE ROW on a thumb, at the cap (WO-2.11) ─────────
 *
 * The owner's report of 2026-08-07, turned into a measurement. Three open passes drew two rows of
 * buttons in landscape and three in portrait on a real iPad, while the desktop layout — same
 * markup, different media block — was correct. That asymmetry is the whole reason this section
 * exists at 768/1024 with touch on rather than in the desk pass: the defect lived entirely inside
 * `@media (pointer: coarse)`, so every fine-pointer check in this file was green while the device
 * the screen is FOR was wrong.
 *
 * THREE CARDS, NOT TWO. The cap is three per class and three is where the row is tightest; the
 * two-card case elsewhere in this file passed throughout the defect.
 */
console.log('\n--- the pass card is one row at the cap of three (emulated iPad, both orientations) ---');
{
  await send('Emulation.clearDeviceMetricsOverride');
  await new Promise(r => setTimeout(r, 200));

  const biggest = await evalJs(`(function(){
    var doc = window.planbook.store.getDoc();
    if (!doc) return null;
    var best = null, n = -1;
    doc.classes.filter(function(c){ return !c.archived; }).forEach(function(c){
      var len = c.roster ? c.roster.length : 0;
      if (len > n) { n = len; best = c.id; } });
    return n >= 3 ? { id: best, students: n } : null; })()`);

  if (!biggest) {
    skip('the pass card stays one row with three open, on an iPad in both orientations',
      'no unarchived class with three students is on the device at this point in the run — a state, '
        + 'not a pass');
  } else {
    if (await has('#classTabBar [data-view-home]')) await clickSel('#classTabBar [data-view-home]');
    await clickSel('#homeGrid .class-card-open[data-class-tab="' + biggest.id + '"]');
    await new Promise(r => setTimeout(r, 300));

    /* Whatever earlier sections left open, taken back through the card's own Cancel rather than
       through the seam — it writes nothing, so this costs the document nothing to arrive at a known
       three. A loop with a bound rather than `while`, because a Cancel that stopped working would
       otherwise hang the run instead of failing it. */
    for (let i = 0; i < 6; i++) {
      if (!(await has('.attendance-pass-card [data-pass-cancel]'))) break;
      await clickSel('.attendance-pass-card [data-pass-cancel]');
      await new Promise(r => setTimeout(r, 120));
    }
    /* Issued through the buttons a teacher taps, one type each, so the chip on each card is a
       different width and the widest one is really on screen. */
    for (const type of ['bathroom', 'nurse', 'quick']) {
      const sel = '#attendanceBody [data-pass-issue][data-pass-type="' + type + '"]';
      if (await has(sel)) await clickSel(sel);
      await new Promise(r => setTimeout(r, 120));
    }

    const MEASURE = `(function(){
      var cards = Array.prototype.slice.call(document.querySelectorAll('.attendance-pass-card'));
      return cards.map(function(c){
        var main = c.querySelector('.attendance-pass-card-main');
        if (!main) return null;
        var kids = Array.prototype.slice.call(main.children).filter(function(e){
          var r = e.getBoundingClientRect(); return r.width || r.height; });
        if (!kids.length) return null;
        var heights = kids.map(function(e){ return e.getBoundingClientRect().height; });
        var btn = function(s){ var e = c.querySelector(s); if (!e) return null;
          var r = e.getBoundingClientRect();
          return { w: Math.round(r.width), h: Math.round(r.height), l: Math.round(r.left) }; };
        var back = btn('[data-pass-return]'), cancel = btn('[data-pass-cancel]');
        return {
          /* THE SINGLE-ROW TEST. A flex row that has not wrapped is exactly as tall as its tallest
             child; one that has wrapped is about twice that. 2px of slack for subpixel rounding at
             deviceScaleFactor 2 — not enough to swallow a wrapped row, which costs 44 or more. */
          mainH: Math.round(main.getBoundingClientRect().height),
          tallest: Math.round(Math.max.apply(null, heights)),
          back: back, cancel: cancel,
          /* The gap between the two buttons, measured rather than assumed: it is the one dimension
             that was explicitly not allowed to give in buying this row back. */
          gap: (back && cancel) ? Math.round(cancel.l - (back.l + back.w)) : null,
          chip: ((c.querySelector('.attendance-pass-card-type') || {}).textContent || '').trim(),
          name: ((c.querySelector('.attendance-pass-card-name') || {}).textContent || '').trim(),
          /* WO-2.9's figure, which arrived into this row after it had been measured and paid for
             twice. scrollWidth against clientWidth is the "Days off" spill from the first iPad
             sitting asked of the element that grew: a nowrap row can clear every height check and
             still be wider than the card it is in, and 22px of tabular digits is what would do it. */
          clock: (function(){ var e = c.querySelector('[data-pass-elapsed]');
            if (!e) return null; var r = e.getBoundingClientRect();
            return { w: Math.round(r.width), h: Math.round(r.height),
                     text: (e.textContent || '').trim() }; })(),
          spill: Math.round(main.scrollWidth - main.clientWidth)
        };
      }).filter(Boolean); })()`;

    for (const [w, h, label] of [[768, 1024, 'portrait'], [1024, 768, 'landscape']]) {
      await send('Emulation.setDeviceMetricsOverride',
        { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      await new Promise(r => setTimeout(r, 300));
      /* Repainted after the resize for the reason the note-panel section gives above: this grid
         reads `window.innerWidth` when it is drawn, not when it is measured. */
      await evalJs('window.planbook.attendance.renderAttendance()');
      await new Promise(r => setTimeout(r, 250));

      const isCoarse = await evalJs("matchMedia('(pointer: coarse)').matches");
      const cards = await evalJs(MEASURE);
      const wrapped = (cards || []).filter(c => c.mainH > c.tallest + 2);
      const small = (cards || []).filter(c =>
        !c.back || !c.cancel || c.back.h < 44 || c.cancel.h < 44 || c.back.w < 44 || c.cancel.w < 44);
      const tight = (cards || []).filter(c => c.gap === null || c.gap < 8);

      if (isCoarse !== true) {
        check('the emulated iPad-' + label + ' pointer really is coarse (else this measures the '
          + 'desk pass, where the defect never was)', false, 'matchMedia = ' + isCoarse);
      } else if (!cards || cards.length < 3) {
        check('three passes are open, so the row is measured where it is tightest, iPad ' + label,
          false, 'cards on screen = ' + (cards ? cards.length : 'no banner at all')
            + ' — the cap is three and three is the case that broke');
      } else {
        check('the pass card is ONE ROW with three open, on an iPad in ' + label,
          wrapped.length === 0,
          cards.length + ' card(s); ' + cards.map(c => c.name.split(',')[0] + ' ' + c.mainH + 'px'
            + ' vs tallest child ' + c.tallest + 'px').join(' · ')
            + (wrapped.length ? ' — WRAPPED: ' + JSON.stringify(wrapped.map(c => c.name)) : ''));
        check('Return and Cancel still clear 44px and stay 8px+ apart on that one row, iPad ' + label,
          small.length === 0 && tight.length === 0,
          cards.map(c => (c.back ? c.back.w + '×' + c.back.h : 'no Return') + ' / '
            + (c.cancel ? c.cancel.w + '×' + c.cancel.h : 'no Cancel') + ' gap ' + c.gap).join(' · '));
        check('the elapsed clock is on every card and the row still fits inside it, iPad ' + label,
          cards.every(c => c.clock && /^\d+:\d{2}$/.test(c.clock.text) && c.clock.w > 0)
            && cards.every(c => c.spill <= 0),
          cards.map(c => (c.clock ? c.clock.text + ' at ' + c.clock.w + '×' + c.clock.h + 'px'
            : 'NO CLOCK') + ', row over its own box by ' + c.spill + 'px').join(' · '));
        if (label === 'portrait') {
          /* The chip carries the word and NOT the glyph, asserted where it was spent: the emoji came
             off to buy this row, and portrait is the orientation that could not afford it. */
          check('the type chip on each card is a word with no emoji, which is what paid for the row',
            cards.every(c => /^[A-Za-z]+$/.test(c.chip)),
            JSON.stringify(cards.map(c => c.chip)));
        }
      }
    }
    await send('Emulation.clearDeviceMetricsOverride');
    /* The three passes taken back the way they were issued. Nothing runs after this today, but a
       section that leaves three students marked out of the room is a trap for whatever gets
       appended below it — and Cancel is the one exit that leaves the document as it found it. */
    for (let i = 0; i < 6; i++) {
      if (!(await has('.attendance-pass-card [data-pass-cancel]'))) break;
      await clickSel('.attendance-pass-card [data-pass-cancel]');
      await new Promise(r => setTimeout(r, 120));
    }
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  }
}
}
