/* inline-colors.mjs — inline colors, no custom properties
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

/* ───────────────── inline colors, no custom properties ───────────────── */

console.log('\n--- no CSS custom properties ---');
const VARWALK = `(function(){ var found=[];
  window.__eachRule(function(r, label){
    for (var k=0;k<r.style.length;k++) if (r.style[k].indexOf('--')===0)
      found.push('DECLARES '+label+' {'+r.style[k]+'}');
    if ((r.style.cssText||'').indexOf('var(--')>=0) found.push('USES var() in '+label);
  });
  return found; })()`;
const vars = await evalJs(VARWALK);
check('zero custom-property declarations and zero var() uses at runtime',
  vars.length === 0, JSON.stringify(vars));
}
