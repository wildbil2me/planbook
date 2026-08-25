/* horizontal-overflow.mjs — no horizontal overflow at any breakpoint
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, has } = h;

/* ───────────────── no horizontal overflow at any breakpoint ───────────────── */

console.log('\n--- horizontal overflow ---');
for (const [w, h, dsf] of [[1024, 768, 2], [768, 1024, 2], [390, 844, 3]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile: true });
  await new Promise(r => setTimeout(r, 400));
  const o = await evalJs('({sw:document.documentElement.scrollWidth, iw:window.innerWidth})');
  check('no horizontal overflow at ' + w + 'x' + h, o.sw <= o.iw, JSON.stringify(o));

  /*
    The page not overflowing is not the same as the header being readable, which is what the first
    device sitting found: the two strips scrolled correctly and the buttons inside them were
    compressed to narrower than their own labels, so the names were laid out across the rounded
    background and over its edge. `flex-shrink: 0` in shell.css is the fix and this is the
    measurement — a button whose label does not fit inside it, at the width where it was seen.

    A button sitting at its `max-width` cap is exempt: that one is ellipsised on purpose, and an
    ellipsis is the label not fitting by design rather than by accident.
  */
  const spill = await evalJs(`(function(){
    var els = document.querySelectorAll('#classTabBar .cls-tab, #termNav .q-btn');
    var out = [];
    for (var i = 0; i < els.length; i++) {
      var e = els[i], cs = getComputedStyle(e);
      var cap = parseFloat(cs.maxWidth);
      var capped = !isNaN(cap) && e.getBoundingClientRect().width >= cap - 1;
      if (!capped && e.scrollWidth > e.clientWidth + 1) {
        out.push({ text: e.textContent, scrollW: e.scrollWidth, clientW: e.clientWidth });
      }
      if (cs.flexShrink !== '0' || cs.whiteSpace !== 'nowrap') {
        out.push({ text: e.textContent, flexShrink: cs.flexShrink, whiteSpace: cs.whiteSpace });
      }
    }
    return { measured: els.length, bad: out }; })()`);
  check('no class tab or term button is squeezed narrower than its own label at ' + w + 'x' + h,
    spill.measured > 0 && spill.bad.length === 0,
    'measured ' + spill.measured + '; bad = ' + JSON.stringify(spill.bad));

  /*
    The other half of that fix, and a defect it introduced. Once the tabs stopped squeezing they
    started scrolling, and refreshClassBar() rebuilds the strip's children on every call — which
    resets `scrollLeft` to 0. So the teacher whose open class is the last of six got a header
    scrolled to the left with no tab on it looking selected, which reads as the app having forgotten
    which class she was in.

    Measured on the LAST class, because the first one is visible whether or not anything works.
  */
  /* Read off the DOM rather than through `window.__cls`: that reader is re-installed after each
     reload for the sections that use it, and this one runs past the last of them. */
  const tabScroll = await evalJs(`(function(){
    var strip = document.getElementById('classTabBar');
    var tabs = strip.querySelectorAll('[data-class-tab]');
    if (!tabs.length) return { noTabs: true };
    window.planbook.classes.selectClass(tabs[tabs.length - 1].getAttribute('data-class-tab'));
    var el = strip.querySelector('.cls-tab.active');
    if (!el) return { noActive: true };
    var s = strip.getBoundingClientRect(), e = el.getBoundingClientRect();
    return { overflows: strip.scrollWidth > strip.clientWidth + 1,
             inView: e.left >= s.left - 1 && e.right <= s.right + 1,
             scrollLeft: strip.scrollLeft, text: el.textContent,
             strip: { left: Math.round(s.left), right: Math.round(s.right),
                      scrollW: strip.scrollWidth, clientW: strip.clientWidth },
             tab: { left: Math.round(e.left), right: Math.round(e.right) } }; })()`);
  if (tabScroll.noTabs) {
    skip('the open class is scrolled into view on the tab strip at ' + w + 'x' + h,
      'no classes on the bar at this point in the run');
  } else {
    /* Asserted before the scroll question, because a strip of zero width answers that question
       "no" for a reason that has nothing to do with scrolling — and it is a whole class bar the
       teacher cannot see. This is how the 390px flex-basis defect was found. */
    check('the class tab strip has real width to scroll at ' + w + 'x' + h,
      tabScroll.strip.clientW >= 96, JSON.stringify(tabScroll.strip));
    if (tabScroll.overflows === false) {
      skip('the open class is scrolled into view on the tab strip at ' + w + 'x' + h,
        'the strip fits every tab at this width, so there is nothing to scroll');
    } else {
      check('the open class is scrolled into view on the tab strip at ' + w + 'x' + h,
        tabScroll.inView === true, JSON.stringify(tabScroll));
    }
  }
}
}
