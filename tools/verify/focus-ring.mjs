/* focus-ring.mjs — the focus ring, both directions
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

/* ───────────────── the focus ring, both directions ───────────────── */

console.log('\n--- focus ring ---');
const SHEETWALK = `(function(){
  var out=[], bad=[];
  var seen = window.__eachRule(function(r, label){
    if (label.indexOf(':focus-visible')>=0)
      out.push({sel:label, css:r.style.cssText, w:r.style.outlineWidth,
                s:r.style.outlineStyle, c:r.style.outlineColor, off:r.style.outlineOffset,
                props:Array.prototype.slice.call(r.style)});
    var ow=(r.style.outlineWidth||'').trim(), os=(r.style.outlineStyle||'').trim(),
        ol=(r.style.outline||'').trim();
    if (os==='none'||ow==='0px'||ow==='0'||ol==='none'||ol==='0'||ol==='0px')
      bad.push({sel:label, css:r.style.cssText});
  });
  return {out:out, bad:bad, seen:seen, sheets:document.styleSheets.length};
})()`;
const fv = await evalJs(SHEETWALK);
check('the rule walker reached a plausible number of style rules (guards a vacuous pass)',
  fv.seen > 50, 'style rules walked = ' + fv.seen + ' across ' + fv.sheets + ' sheet(s)');
check('exactly one :focus-visible rule, and its selector is global',
  fv.out.length === 1 && fv.out[0].sel === ':focus-visible',
  JSON.stringify(fv.out.map(o => o.sel)));
/* Longhands, not a string compare: Chromium re-serializes the shorthand as
   "rgb(91,111,204) solid 2px" and a naive compare fails on a correct rule. And "declares
   nothing else" is a property-set assertion, not a count — `outline` + `outline-offset`
   enumerates as FOUR longhands (color, style, width, offset), so counting to 2 fails on a
   correct rule too. */
const OUTLINE_PROPS = ['outline', 'outline-color', 'outline-style', 'outline-width', 'outline-offset'];
const strayProps = (fv.out[0]?.props || []).filter(p => !OUTLINE_PROPS.includes(p));
check('it is outline 2px solid rgb(91,111,204) + offset 2px, and declares nothing else',
  !!fv.out[0] && fv.out[0].w === '2px' && fv.out[0].s === 'solid'
    && fv.out[0].c === 'rgb(91, 111, 204)' && fv.out[0].off === '2px' && strayProps.length === 0,
  fv.out[0] ? fv.out[0].css + (strayProps.length ? ' | STRAY: ' + strayProps.join(', ') : '') : 'missing');
check('no rule in any loaded sheet, including inside @media, removes an outline',
  fv.bad.length === 0, JSON.stringify(fv.bad));
}
