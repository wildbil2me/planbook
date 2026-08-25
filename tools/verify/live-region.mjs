/* live-region.mjs — the live region
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, evalJs, seam } = h;

/* ───────────────── the live region ───────────────── */

console.log('\n--- aria-live ---');
const regions = await evalJs("document.querySelectorAll('[aria-live]').length");
check('exactly one aria-live region in the document', regions === 1, 'found ' + regions);
if (!seam) {
  skip('announce() lands text in the live region', 'no window.planbook seam');
} else {
  const live = await evalJs(`(async function(){ window.planbook.announce('probe text');
    await new Promise(function(r){setTimeout(r,150)});
    var e=document.querySelector('[aria-live]');
    return {text:e.textContent, live:e.getAttribute('aria-live'), cls:e.className}; })()`);
  check('announce() lands text in the single polite .sr-only region',
    live.text === 'probe text' && live.live === 'polite' && live.cls.indexOf('sr-only') >= 0,
    JSON.stringify(live));
}
}
