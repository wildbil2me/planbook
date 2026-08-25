/* date-format.mjs — one date formatter, and a name that means one thing
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
const { ROOT, check, load } = h;

/* ───────────────── one date formatter, and a name that means one thing ─────────────────
 *
 * Static, for the same reason the precache block above is: nothing a browser can be driven to do
 * would fail. WO-3.20 found FIVE functions called `shortDate` in `src/` in THREE formats — `Sep 4`,
 * `Thu, Sep 4` and an EXPORTED `9/4` — and the point of that work order is that no check anywhere
 * could tell, because every one of them returns a correct date. A screen that reaches for a date
 * formatter and finds the wrong export renders `9/4` in a column beside one that says `Sep 4`, and
 * the run stays green.
 *
 * So the invariant is asserted on the source rather than on a rendering: ONE definition of that
 * name, in `src/date-text.js`, and nothing may bind the name to anything else. The second clause is
 * the one that matters in a year — a fifth copy arrives as a local function or as
 * `import { numericDate as shortDate }`, and both are caught by the binding rather than by the
 * format, since the format is exactly what a check cannot judge.
 *
 * IMPORT LINES ARE READ, CALL SITES ARE NOT. Comments in this repo quote call names constantly
 * (`shortDate(w.due) || w.due` appears in three of these files as prose), and a call-site scan would
 * arrive here as a false FAIL — `tools/wo-sweep.mjs` § 11 pays for that lesson at length.
 */
{
  const dir = path.join(ROOT, 'src');
  const files = (await fs.readdir(dir)).filter(f => f.endsWith('.js'));
  const defs = [];
  const foreign = [];
  for (const f of files) {
    const text = await fs.readFile(path.join(dir, f), 'utf8');
    if (/function\s+shortDate\s*\(/.test(text)) defs.push('src/' + f);
    for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
      const binds = m[1].split(',').map(s => s.trim());
      const takes = binds.some(b => /(^|\s)shortDate$/.test(b));
      if (takes && m[2] !== './date-text.js') foreign.push('src/' + f + ' ← ' + m[2]);
    }
  }
  /* Guarded against a vacuous pass twice over: an empty src/ and a regex that stopped matching both
     produce the same empty answer as a tree that is correct. */
  check('exactly one function in src/ is named shortDate — it lives in src/date-text.js, and no '
    + 'module binds that name to a different formatter (WO-3.20: `9/4` beside `Sep 4` is two correct '
    + 'dates and reads as a bug)',
    files.length > 20 && defs.length === 1 && defs[0] === 'src/date-text.js' && !foreign.length,
    files.length + ' module(s) read; defined in ' + (defs.join(', ') || 'NOWHERE')
      + (foreign.length ? '; bound from elsewhere by ' + foreign.join(', ') : ''));

  /* Acceptance line 5, and it is a load-time fact rather than a tidiness rule: the suite has no
     bundler, so a cycle between the shared formatter and a screen that imports it is paid on every
     screen in the app. */
  const leaf = await fs.readFile(path.join(dir, 'date-text.js'), 'utf8');
  const imports = [...leaf.matchAll(/^\s*import\s.+$/gm)].map(m => m[0].trim());
  check('src/date-text.js imports nothing — the shared formatter is a leaf, so no screen pays a '
    + 'cycle at load time for wearing it',
    leaf.length > 100 && imports.length === 0,
    leaf.length + ' bytes read'
      + (imports.length ? ', imports: ' + imports.join(' · ') : ', no import statement in it'));
}
}
