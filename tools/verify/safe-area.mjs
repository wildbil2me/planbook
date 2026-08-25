/* safe-area.mjs — safe-area insets: the precondition, not just the declaration
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export async function run(h) {
const { ROOT, check, skip, evalJs } = h;

/* ───────────────── safe-area insets: the PRECONDITION, not just the declaration ─────────────────
 *
 * This check exists because two agents verified WO-1.2's safe-area work by confirming the
 * env() declarations were present, and both handed the line to a human as "needs a real iPad."
 * Neither asked whether the declarations could resolve non-zero at all. They cannot without
 * viewport-fit=cover: iOS resolves every inset to 0 without it, so the iPad pass succeeds by
 * having nothing to test. Deferring to hardware is what you do AFTER ruling out a static
 * precondition, not instead of it.
 */

console.log('\n--- safe-area insets ---');
const html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
const viewport = (html.match(/<meta[^>]+name=["']viewport["'][^>]*>/i) || [''])[0];
const usesEnv = await evalJs(`(function(){ var hits=[];
  window.__eachRule(function(r, label){
    if ((r.style.cssText||'').indexOf('env(safe-area-inset')>=0) hits.push(label);
  });
  return hits; })()`).then(h => h.length);
console.log('viewport meta   : ' + viewport.trim());
console.log('rules using env(safe-area-inset*) : ' + usesEnv);
if (usesEnv === 0) {
  skip('env(safe-area-inset*) is usable on iOS', 'no rule uses it yet');
} else {
  check('env(safe-area-inset*) can resolve non-zero on iOS — viewport-fit=cover is set',
    /viewport-fit\s*=\s*cover/i.test(viewport),
    /viewport-fit/i.test(viewport) ? viewport.trim()
      : usesEnv + ' rules declare an inset, but without viewport-fit=cover iOS resolves every one'
        + ' of them to 0. The declarations are inert and no iPad pass can tell you so.');
}
}
