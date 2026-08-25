/* modal.mjs — the modal, driven rather than read
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

/* ───────────────── the modal, driven rather than read ───────────────── */

/*
  RE-POINTED AT WO-1.10, and the reason is the whole reason that work order carries this file.
  This section used to drive `#aboutModal` through `[data-modal-open]`, and the second and third of
  those openers were two buttons on the WO-1.2 component shelf, labelled "Open from here" and "Open
  from here instead" — fixtures whose only job was to make focus-return falsifiable. Deleting the
  shelf left one opener on the page and this whole block would have degraded to an announced SKIP:
  correct behaviour, and worthless, because a run that is mostly skips proves nothing.

  So it drives the class manager instead, which needs no fixtures at all. `#classesModal` has two
  REAL openers that are on screen on every launch — the "+" (or "Add a class") tab at the end of the
  header's class strip, and the gear beside it on the bottom row — and they go through the same
  openModal() with the same opener argument, so every behaviour asserted below is asserted about the
  code path a teacher actually uses. It is a better fixture than the one it replaces: the shelf's two
  buttons sat side by side in one container, where these two are in different containers, one of them
  inside a horizontal scroller.

  SCOPED TO `header`, and that is not tidiness. `[data-class-manage]` now appears three times: those
  two, plus "Add your first class" in the home screen's empty state — which is INSIDE a `.hidden`
  container whenever the other two are worth clicking. querySelectorAll counts hidden elements, so an
  unscoped selector would hand clickSel an element measuring 0x0 and the click would land in the
  top-left corner of the viewport on whatever happens to be there. That is the viewport-coordinate
  trap in clickSel's own comment, arriving through the fixture instead of through the scroll offset.
*/
console.log('\n--- modal behaviour ---');
const MODAL = '#classesModal';
const OPENER = 'header [data-class-manage]';
/* Visible openers, not present ones, for the reason in the block above. */
const openerCount = await evalJs("Array.prototype.slice.call(document.querySelectorAll("
  + JSON.stringify(OPENER) + ")).filter(function(e){return e.offsetWidth>0||e.offsetHeight>0}).length");
if (!(await has(MODAL)) || openerCount < 2) {
  /* Two openers for one modal is what makes focus-return falsifiable: an implementation that
     always returns focus to the first opener on the page passes with one and fails with two. */
  skip('modal opens, traps focus, closes, and returns focus to its opener',
    'needs ' + MODAL + ' and >=2 visible ' + OPENER + ' on the page; found ' + openerCount);
} else {
  const INSTALL = [
    'window.__panel=function(){return document.querySelector("' + MODAL + ' [role=\'dialog\']")};',
    'window.__f=function(){',
    '  var sel="a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]),'
      + ' textarea:not([disabled]), [tabindex]:not([tabindex=\'-1\'])";',
    '  return Array.prototype.slice.call(window.__panel().querySelectorAll(sel))',
    '    .filter(function(n){return n.offsetWidth>0||n.offsetHeight>0});',
    '};1',
  ].join('\n');
  await evalJs(INSTALL);

  /* clickSel is the shared helper defined above, with the viewport-coordinate trap in its
     comment. It is shared because the store section drives the year picker the same way. */
  const key = async (k, code, vk, mods = 0) => {
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: mods });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: mods });
    await new Promise(r => setTimeout(r, 120));
  };
  const isOpen = () => evalJs("!document.querySelector('" + MODAL + "').classList.contains('hidden')");
  const activeIs = (nth) => evalJs("document.activeElement===document.querySelectorAll("
    + JSON.stringify(OPENER) + ")[" + nth + "]");

  const second = Math.min(2, openerCount - 1);
  await clickSel(OPENER, second);
  check('modal opens on click', await isOpen());
  check('focus moved inside the panel', await evalJs('window.__panel().contains(document.activeElement)'));

  await evalJs('(function(){var f=window.__f();f[f.length-1].focus();return 1})()');
  await key('Tab', 'Tab', 9);
  check('Tab from the last focusable wraps to the first, inside the panel',
    await evalJs('(function(){var f=window.__f();return document.activeElement===f[0]})()'));
  await key('Tab', 'Tab', 9, 8);
  check('Shift+Tab from the first wraps to the last',
    await evalJs('(function(){var f=window.__f();return document.activeElement===f[f.length-1]})()'));

  await key('Escape', 'Escape', 27);
  check('Escape closes the modal', !(await isOpen()));
  check('Escape returns focus to the opener that was clicked, not the first on the page',
    await activeIs(second));

  const other = second === 1 ? 0 : 1;
  await clickSel(OPENER, other);
  const bd = await evalJs("(function(){var r=document.querySelector('" + MODAL + "').getBoundingClientRect();return {x:r.x+6,y:r.y+6}})()");
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: bd.x, y: bd.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bd.x, y: bd.y, button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 200));
  check('backdrop click closes the modal', !(await isOpen()));
  check('backdrop close returns focus to ITS opener, a different button', await activeIs(other));

  /* A press that starts inside the panel and ends on the backdrop is a text selection, not a
     dismissal. Closing on it loses whatever the teacher was typing. */
  await clickSel(OPENER, other);
  const ins = await evalJs("(function(){var r=document.querySelector('" + MODAL + " .modal-body').getBoundingClientRect();return {x:r.x+12,y:r.y+12}})()");
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: ins.x, y: ins.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bd.x, y: bd.y, button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 200));
  check('press inside + release on the backdrop does NOT close it', await isOpen());

  /* From the WO-1.7 iPad sitting. Every student and guardian edit happens inside a modal, and
     a modal covers the header the indicator lives in — so the teacher changed a guardian's
     email, closed the panel, and had nothing telling her it landed. The save was real; the
     silence was the defect. Measured rather than reviewed, because a stacking bug reads as
     perfectly correct in the stylesheet. Asserted with a modal actually open, so it is the
     painted result and not the declared value. */
  const stack = await evalJs(`(function(){
    var i = getComputedStyle(document.getElementById('saveIndicator'));
    var o = getComputedStyle(document.querySelector('${MODAL}'));
    return { ind: parseInt(i.zIndex, 10), overlay: parseInt(o.zIndex, 10),
             pos: i.position, taps: i.pointerEvents }; })()`);
  check('the save indicator outranks the modal overlay, so a save is visible from inside a panel',
    stack.ind > stack.overlay && stack.pos === 'fixed',
    'indicator z-index ' + stack.ind + ' (' + stack.pos + ') vs overlay ' + stack.overlay);
  /* At rest the chip is `opacity: 0` and still occupies its corner. Without this it would be an
     invisible tap target sitting over the top-right of every screen in the app. */
  check('and at rest it cannot swallow a tap in the corner it occupies',
    stack.taps === 'none', 'pointer-events: ' + stack.taps);

  await key('Escape', 'Escape', 27);
}
}
