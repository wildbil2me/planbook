/* precache.mjs — the precache covers the module graph
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
const { ROOT, check, has } = h;

/* ───────────────── the precache covers the module graph ─────────────────
 *
 * Static, and deliberately so. `plans/verification-tooling.md` allows "static preconditions
 * that silently disable a feature", which is exactly this: nothing else in this file so much
 * as opens `sw.js`, because it drives a page and never an installed app.
 *
 * WO-1.4 shipped `src/store.js` and `src/year-picker.js` without adding either to SHELL, and
 * every desk check still passed — a served page fetches them over the network without
 * complaint. Only an installed app with the network gone shows it, and by then it is on a
 * teacher's iPad, where the symptom is an app that will not open. This is the safe-area
 * precondition again in a new place: a check that reports green while measuring nothing.
 */
{
  const swSrc = await fs.readFile(path.join(ROOT, 'sw.js'), 'utf8');
  const shellBlock = swSrc.match(/const SHELL\s*=\s*\[([\s\S]*?)\]/);
  const shell = shellBlock
    ? [...shellBlock[1].matchAll(/'([^']+)'/g)].map(m => m[1].replace(/^\.\//, ''))
    : [];
  check('sw.js still declares a SHELL array this check can read',
    shell.length > 0, shell.length + ' entries');

  /* Transitive, not just the entry points: a module reached only through shell.js's imports
     is exactly as absent offline as one named in index.html, and easier to forget. */
  const seen = new Set();
  async function walk(rel) {
    if (seen.has(rel) || !rel.endsWith('.js')) return;
    seen.add(rel);
    let src = '';
    try { src = await fs.readFile(path.join(ROOT, rel), 'utf8'); } catch { return; }
    for (const m of src.matchAll(/import[^'"]*['"]([^'"]+)['"]/g)) {
      if (!m[1].startsWith('.')) continue;
      await walk(path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1])));
    }
  }
  const html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
  for (const m of html.matchAll(/<script\b[^>]*>/gi)) {
    if (!/type\s*=\s*["']module["']/i.test(m[0])) continue;
    const src = m[0].match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (src) await walk(src[1].replace(/^\.\//, ''));
  }
  const missing = [...seen].filter(rel => !shell.includes(rel));
  /* Guarded against a vacuous pass: an empty walk and a complete one are the same value here,
     and a regex that stops matching would report the empty one as green. */
  check('every module reachable from index.html is precached by sw.js',
    seen.size >= 3 && missing.length === 0,
    seen.size + ' modules walked'
      + (missing.length ? ', NOT in SHELL: ' + missing.join(', ') : ''));
}
}
