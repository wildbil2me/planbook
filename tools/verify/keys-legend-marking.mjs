/* keys-legend-marking.mjs — the ⌨ Keys legend on the marking screen (WO-2.34)
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

/* ───── the ⌨ Keys legend on the marking screen answers to the same keydown listener (WO-2.34) ─────
 *
 * WO-3.22's sibling, one screen over, booked out of that work order's own implementation: both sides
 * were read the same day and found in agreement, so this is a check for the NEXT key that goes
 * undocumented rather than evidence of one now. `#attendanceKeysModal` in index.html documents
 * `↓ ↑`, `P`, `T`, `A`, `E`, `D`, `Esc` and `?`; the keydown listener in src/shell.js holds `MARK_KEYS`
 * beside the ArrowDown/ArrowUp, Escape and `?` branches of the same function. Nothing compared the
 * two, which is exactly the gap that let `↑ ↓` go undocumented on the score grid until WO-3.22.
 *
 * IT IS THE SAME CLAIM AND NOT THE SAME CHECK — four structural facts about this legend that the
 * score-grid check above does not have to deal with, each one a silent vacuous pass if missed:
 *
 *   1. `.attendance-key-row` is a <div> and the modal nests several levels deep. WO-3.22 sliced its
 *      flat panel to the first `</div>`; done here that truncates at the end of the FIRST row. So
 *      this block reads the `<dl class="attendance-keys">…</dl>` that wraps every row, and matches
 *      each row on its OWN closing tag (no row nests a further <div>, so a non-greedy match cannot
 *      run past its own end).
 *
 *   2. The glyphs live in `<dt>`, and a glyph turns up outside one too: the lead paragraph has a bare
 *      `<strong>↓</strong>`, and the first row's own `<dd>` prose repeats `↓` inside a `.attendance-key`
 *      kbd ("The first ↓ picks up the top name"). A regex over every `.attendance-key` in the legend
 *      double-counts that one. This block reads glyphs out of each row's `<dt>` alone; the `<dd>` half
 *      is captured and thrown away.
 *
 *   3. The modal id exists twice — the attribute in index.html and `KEYS_MODAL` in src/shell.js — and
 *      Acceptance line 4 wants a rename of either to go red. DECISION: this reads `KEYS_MODAL`'s
 *      STRING VALUE out of src/shell.js and searches index.html for that literal id, rather than
 *      typing `attendanceKeysModal` a second time in this file. Renaming the value in shell.js without
 *      updating the markup — or the reverse — both leave the id unfound, the legend slice empty, and
 *      the check below red, by name, at the id itself since WO-2.36. That is Deliverable #2's "trust
 *      src/shell.js" rule extended to the id it opens, not just the keys.
 *
 *   4. The listener delegates the score grid's ENTIRE binding set from inside itself, ABOVE the
 *      `currentView() !== 'class'` guard (a `keydown` on `[data-score-cell]` routes to
 *      `scores.handleScoreKey()` and returns) — that is the check above's subject, not this one's. So
 *      this block reads only the slice BELOW that guard, anchored on the same literal text the source
 *      carries — `if (views.currentView() !== 'class') return;` — through the listener's own closing
 *      `});`. A key bound above that line is invisible here on purpose, the same way a key bound in a
 *      neighbouring function is invisible to the check above.
 *
 * ONE SHARED CHECK OR TWO, DECIDED RATHER THAN LEFT UNSAID: kept as two independent check() blocks.
 * The four facts above are not cosmetic — a different slice strategy (dl-to-its-own-`</dl>` vs
 * first-`</div>`), a different glyph source (`<dt>`-only vs every kbd in the panel), a second file
 * read for the id, and a listener body bounded by a guard's literal text rather than a function's own
 * braces. A helper general enough to cover both shapes would take a slicing strategy, a glyph source
 * and an id source as parameters — three more decisions than either check makes today — to save a few
 * lines of structural duplication, and it would put WO-3.22's already-corrected block at risk for that
 * saving. WO-3.22's block above kept its own call site, its own `GLYPH_OF` and its own mutation
 * behaviour through that decision, and still does.
 *
 * WO-2.35 WIDENED BOTH READS AND GAVE EACH BLOCK A REFUSAL CHECK OF ITS OWN, and doing it twice is
 * what the decision above costs — the reasoning is written out once, at the `bound` line of the block
 * above (`:288-340`), because that is where the sentence it withdraws used to stand. In short: the
 * count that used to floor this check was a FLOOR and nothing more. A tenth key bound through a
 * `switch` or an `e.code` comparison did not lower it, so the floor passed, every key this block CAN
 * see was still on the card, and the legend quietly lost a row. (That count is gone as of WO-2.36 —
 * see the paragraph below — and the sentence survives the change intact, because an invisible binding
 * does not trip the anchor guard that replaced it either.) So the read now also finds a KEY LIST
 * DECLARED `const NAME = ['…']` AND MEMBERSHIP-TESTED in the slice — the form this very listener uses
 * for `MARK_KEYS`, found by shape here rather than by that one name, so that a SECOND such list is
 * visible — and the forms it still cannot read are asserted ABSENT by the second check() below rather
 * than left to a floor that cannot move. `e.code` is refused there BY NAME and never read: it is a
 * different property with different values (`KeyP` where `e.key` is `P`, `Slash` where `?` is), and
 * `.code` is this app's attendance-mark field besides, so widening to it would document keys nobody
 * presses. The residue that is still invisible is named at the block above too.
 *
 * THE SAME SCAR APPLIES HERE AS THERE (`:370-376` above): `stray` below asks `bound` — the keys read
 * out of src/shell.js — not `Object.keys(GLYPH_OF)`, which is a table this file maintains and would
 * answer "still bound" forever, letter deleted or not. Both sides are guarded against a vacuous pass
 * the same way: a renamed modal id, a renamed `MARK_KEYS` constant, or a regex that quietly stopped
 * matching all produce the same empty answer, and empty agrees with everything.
 *
 * WHAT GUARDS THAT, SINCE WO-2.36: THE ANCHORS, ASSERTED FOUND — NOT THE LENGTHS, ASSERTED LONG.
 * This check used to require `bound.length >= 9 && glyphs.length >= 9 && rows.length >= 8`, three
 * numbers read off the tree the day it was written, and the trouble with them was not that they were
 * wrong. It was that RETIRING A KEY CORRECTLY BROKE THEM. Take a letter out of `MARK_KEYS` and delete
 * its row from the card — both sides, in perfect agreement, the two directions this check polices
 * both satisfied — and the counts fall to 8 and 7 and only the numbers object. The person who did it
 * would read the red, check the tree, find it right, and edit the numbers down; and a number that is
 * edited every time it fires has taught its next reader to step over it, which is the one habit a
 * guard against a silent pass cannot survive. Nor is there anywhere honest to source a count FROM:
 * the card's own row count is the thing under test, and `GLYPH_OF` is a table this file maintains,
 * so either one agrees with itself at zero the moment the modal id goes missing.
 * SO THE COUNTS ARE GONE, AND NOTHING REPLACED THEM, because the two-way comparison was already
 * doing the work they were credited with: a letter that drops out of `bound` while its row stands
 * comes back as `stray`, and a row that goes while its letter is bound comes back as `missing`.
 * Every partial loss THAT REACHES `bound` OR THE CARD is caught by name in one direction or the
 * other. Scoped deliberately, because the unscoped sentence is false here and was corrected at the
 * verification of WO-2.36 rather than shipped: `markKeys` is read FILE-WIDE out of src/shell.js —
 * readMarkingKeys() below matches `const MARK_KEYS = [` against `shellSrc`, the whole file, and not
 * against `body` — so a `MARK_KEYS` that is still DECLARED while the listener
 * has stopped testing it leaves all five letters in `bound`, the card untouched, `missing` and
 * `stray` both empty and every anchor present — 9 against 8, green, with keyboard marking dead for
 * the teacher.
 * (That read was cited as `:611` from WO-2.36 until WO-2.39, and the number was wrong the day it was
 * typed, whichever file it meant: `src/shell.js:611` is prose in the comment over
 * afterAssignmentChange() and has been since before that commit — `MARK_KEYS` is at `:1617` there and
 * has not moved — and `:611` in THIS file was `guardAnchor`, the listener-slice read this sentence
 * exists to distinguish itself FROM. So it is anchored by the code's own text instead. A paragraph
 * whose whole subject is that a mitigation cited for a case it does not cover is worse than none
 * cannot carry a pointer that lands its reader on the other read.)
 * THAT IS THE SAME RESIDUE THE SECOND check() BELOW EXISTS FOR, not a hole this guard
 * opened: the retired floor was equally green on that tree, which is the point WO-2.35 made in
 * different words. The block above says it at `:298-299` and it governs here too — a mitigation
 * cited for a case it does not cover is worse than none, because it stops the next reader looking.
 * What the comparison cannot catch is the case where both sides read NOTHING — and that case is
 * never a matter of degree, it is
 * an anchor gone from the tree: `KEYS_MODAL`, the id in index.html, the `<dl>`, the class-view guard,
 * `MARK_KEYS`, or one of the regexes above. So `vacuity` below names each of them and fails on the
 * one that is missing. RETIRING A KEY MOVES NO ANCHOR, so it stays green; a rename moves exactly one,
 * so the failure says which — and there is no number in this block for anybody to move afterwards.
 * The long form of the same decision, and the candidates it rules out, are at the sibling block above
 * where its own counts were retired in the same pass (`:378-429`).
 *
 * ONE READ, CALLABLE WITH TEXT, SINCE WO-2.38 — the same change made to the sibling above and for the
 * same reason, which is written out there in full. readMarkingKeys() takes the two documents' TEXT, so
 * the self-check section at the foot of the static blocks can hand it mutated copies in memory and
 * watch each arm of `vacuity` below fire, without a second copy of any of these reads existing and
 * without anything ever writing to the tree.
 */
export function readMarkingKeys(html, shellSrc) {
  /* The id, read from src/shell.js rather than typed a second time here — fact 3 above. */
  const modalIdMatch = shellSrc.match(/const KEYS_MODAL = '([^']+)'/);
  const modalId = modalIdMatch ? modalIdMatch[1] : '';
  const modalAt = modalId ? html.indexOf('id="' + modalId + '"') : -1;
  const dlAt = modalAt < 0 ? -1 : html.indexOf('<dl class="attendance-keys">', modalAt);
  const dlEnd = dlAt < 0 ? -1 : html.indexOf('</dl>', dlAt);
  const legendHtml = dlAt < 0 || dlEnd < 0 ? '' : html.slice(dlAt, dlEnd);

  /* Each row on its own closing </div> (fact 1); glyphs out of the <dt> half alone (fact 2). */
  const rows = [...legendHtml.matchAll(
    /<div class="attendance-key-row">\s*<dt>([\s\S]*?)<\/dt>\s*<dd>[\s\S]*?<\/dd>\s*<\/div>/g
  )].map(m => m[1]);
  const glyphs = rows.flatMap(dt => [...dt.matchAll(/<kbd class="attendance-key">([^<]*)<\/kbd>/g)]
    .map(k => k[1].trim()));

  /* The listener's body below the score-grid delegation (fact 4) — from the class-view guard's own
     literal text to the listener's own closing `});`. */
  const guardAnchor = "if (views.currentView() !== 'class') return;";
  const listenerAt = shellSrc.indexOf(guardAnchor);
  const listenerEnd = listenerAt < 0 ? -1 : shellSrc.indexOf('\n});', listenerAt);
  const body = listenerAt < 0 || listenerEnd < 0 ? '' : shellSrc.slice(listenerAt, listenerEnd);

  /* Every literal `e.key === '…'` comparison in that slice — ArrowDown, ArrowUp, Escape and `?` today,
     and whatever the next branch adds tomorrow, read the same way rather than named by hand. */
  const literalKeys = [...new Set([...body.matchAll(/e\.key === '([^']+)'/g)].map(m => m[1]))];

  /* MARK_KEYS itself, parsed as quoted letters rather than assumed to still be ['P','T','A','E','D'] —
     a letter added or removed there moves `bound` below without this file being told twice. */
  const markKeysMatch = shellSrc.match(/const MARK_KEYS = \[([^\]]*)\]/);
  const markKeys = markKeysMatch
    ? [...markKeysMatch[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];

  /* ANY key list membership-tested in the slice, found by shape rather than by name — WO-2.35, and
     the reasoning is at `:288-340`. `MARK_KEYS` comes back through here as well as through the read
     above, which is why `bound` is a Set; the point is the list that is NOT `MARK_KEYS`. It arrives
     with its letters unmapped, so the check below names them rather than skipping them — the same
     "noisy instead of silent" call `unmapped` already makes. A CAPS-shaped list this cannot resolve
     to quoted strings is reported instead of dropped, which is the floor an unreadable list trips. */
  const testedLists = [...new Set([...body.matchAll(
    /\b([A-Za-z_$][\w$]*)\s*\.\s*(?:indexOf|includes)\s*\(/g)].map(m => m[1]))];
  const listKeys = [];
  const unresolvedLists = [];
  for (const name of testedLists) {
    const decl = shellSrc.match(new RegExp('const ' + name + ' = \\[([^\\]]*)\\]'));
    const inner = decl ? decl[1] : '';
    if (decl && /^[\s,]*(?:'[^']*'[\s,]*)+$/.test(inner)) {
      listKeys.push(...[...inner.matchAll(/'([^']*)'/g)].map(m => m[1]));
    } else if (/^[A-Z][A-Z0-9_]*$/.test(name)) {
      unresolvedLists.push(name);
    }
  }

  const bound = [...new Set([...literalKeys, ...markKeys, ...listKeys])];

  /* The map from key name to the glyph the card uses. Only the arrows and Escape read differently
     from their own name; `?` and every MARK_KEYS letter map to themselves, the letters without being
     spelled out by hand — a letter added to that array needs an edit to the card, not to this map. */
  const GLYPH_OF = { ArrowDown: '↓', ArrowUp: '↑', Escape: 'Esc', '?': '?' };
  for (const k of markKeys) GLYPH_OF[k] = k;

  const unmapped = bound.filter(k => !(k in GLYPH_OF));
  const missing = bound.filter(k => k in GLYPH_OF && !glyphs.includes(GLYPH_OF[k]));
  /* `bound`, not `Object.keys(GLYPH_OF)` — see the block comment above and `:370-376` in the check
     this one is the sibling of. Asking the map instead of the listener is the defect WO-3.22 shipped
     and had to correct; asking `bound` is what lets a row go stray when the key that justified it is
     gone. */
  const stray = glyphs.filter(g => !bound.some(k => GLYPH_OF[k] === g));

  /* THE ANCHORS, ASSERTED FOUND — this is what stands where `bound.length >= 9 && glyphs.length >= 9
     && rows.length >= 8` used to, and the reasoning is in the last paragraph of the block comment
     above. In one line: those three numbers went red on a CORRECT retirement, there was nowhere
     honest to source them from, and the two-way comparison below already catches every partial loss
     by name — so the only thing left for a guard to do is refuse to compare two documents it never
     found. One reason per side, most upstream first, because a lost id empties the rows as well and
     the cause is worth more than three lines of consequence. */
  const vacuity = [];
  if (!modalIdMatch) vacuity.push('src/shell.js has no `const KEYS_MODAL = \'…\'` — this block reads '
    + 'the id from there rather than typing it here, so there was nothing to look for in index.html');
  else if (modalAt < 0) vacuity.push('index.html has no `id="' + modalId + '"` — src/shell.js opens a '
    + 'modal the markup does not carry, or one of the two spellings was renamed alone');
  else if (dlAt < 0) vacuity.push('no `<dl class="attendance-keys">` inside that modal');
  else if (dlEnd < 0) vacuity.push('that `<dl>` never closes');
  else if (!rows.length) vacuity.push('no `.attendance-key-row` inside it — the row regex here has '
    + 'stopped reading the markup it was written for');
  else if (!glyphs.length) vacuity.push('no `<kbd class="attendance-key">` in those rows\' `<dt>`s — '
    + 'the glyph regex here has stopped reading the markup it was written for');
  if (listenerAt < 0) vacuity.push('src/shell.js no longer contains the class-view guard this slice '
    + 'starts at — `' + guardAnchor + '`');
  else if (listenerEnd < 0) vacuity.push('the listener below that guard has no closing `});`');
  else if (body.length < 200) vacuity.push('the slice below the guard is ' + body.length
    + ' byte(s), too short to be that listener');
  else if (!bound.length) vacuity.push('no `e.key === \'…\'` and no key list below the guard — the '
    + 'binding regexes here have stopped reading the code');
  /* Named on its own rather than left to `unmapped`, which is what caught this before and blamed the
     wrong file: with the constant renamed, WO-2.35's by-shape read still finds the letters, so they
     arrive in `bound` while GLYPH_OF — built from `markKeys` — is empty, and the message told the
     reader to go and edit GLYPH_OF. The cause is the rename, and now it says so. */
  if (!markKeysMatch) vacuity.push('src/shell.js has no `const MARK_KEYS = [\'…\']` — the letters '
    + 'below are only whatever the by-shape list read found, and the glyph map was built from nothing');

  /* WO-2.35's refusal check, written out here rather than shared with the block above — the same
     price the one-check-or-two decision already pays, and the same reason: this slice's key variables
     are `e.key` and the `code` it is uppercased into, where that one has `key` and `letter`, so even
     the pattern list is not the same text. `body.length` guards against a vacuous pass: a moved guard
     slices to '', and '' contains no `switch` either. */
  const REFUSED = [
    ['a `switch` on the key — write the branches as `e.key === \'…\'`, or teach this block to read '
      + 'case labels first', /\bswitch\s*\(/],
    ['a comparison against `e.code` — a different property with different values (`KeyP` where '
      + '`e.key` is `P`); this check cannot map it and must not guess', /\be\s*\.\s*code\b/],
    ['a prefix or suffix test on the key — there is no single key name in it to put on the legend',
      /\.\s*(?:startsWith|endsWith)\s*\(/],
    ['the key used as a lookup index — a table keyed by key name binds every entry invisibly',
      /\[\s*(?:e\.key|key|letter|code)\s*\]/],
  ];
  const refused = REFUSED.filter(([, re]) => re.test(body)).map(([label]) => label);

  /* `modalId` and the indices come back with the lists (WO-2.38) so that a fixture can rename the id
     this read found, or cut a document short at it, rather than typing `attendanceKeysModal` a third
     time — fact 3 above is why this file does not spell that id at all. */
  return { modalId, modalAt, dlAt, dlEnd, rows, glyphs, listenerAt, listenerEnd, body, literalKeys,
    markKeys, testedLists, listKeys, unresolvedLists, bound, GLYPH_OF, unmapped, missing, stray,
    vacuity, refused };
}

export async function run(h) {
const { ROOT, check, has } = h;

/* The ordinary run: the two documents as they sit on disk, read once and handed straight in. */
{
  const html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
  const shellSrc = await fs.readFile(path.join(ROOT, 'src', 'shell.js'), 'utf8');
  const { rows, glyphs, body, literalKeys, testedLists, listKeys, unresolvedLists, bound, GLYPH_OF,
    unmapped, missing, stray, vacuity, refused } = readMarkingKeys(html, shellSrc);

  check('every key the attendance-marking listener answers to is on the ⌨ Keys legend, and every '
    + 'entry on that legend is a key it answers to (WO-2.34, WO-3.22\'s sibling on the marking screen)',
    !vacuity.length && !unmapped.length && !missing.length && !stray.length,
    bound.length + ' key(s) answered below the class-view guard [' + bound.join(' ') + '] against '
      + rows.length + ' legend row(s) carrying [' + glyphs.join(' ') + ']'
      + (vacuity.length ? '; NOTHING TO COMPARE, so this would have passed on emptiness — a read here '
        + 'lost its anchor, which no retired key can cause: ' + vacuity.join(' · ') : '')
      + (unmapped.length ? '; BOUND AND UNKNOWN TO THIS CHECK: ' + unmapped.join(', ')
        + ' — add it to GLYPH_OF here and to the legend in index.html, in that order' : '')
      + (missing.length ? '; BOUND AND NOT ON THE LEGEND: '
        + missing.map(k => k + ' (' + GLYPH_OF[k] + ')').join(', ') : '')
      + (stray.length ? '; ON THE LEGEND AND NOT BOUND: ' + stray.join(', ') : ''));

  check('nothing below the class-view guard binds a key in a form the legend check above cannot read '
    + '— no `switch`, no `e.code`, no prefix test, no lookup keyed by the key name (WO-2.35: the check '
    + 'above asks whether two documents agree, so a binding it cannot see is not a disagreement and '
    + 'never goes red there on its own)',
    body.length > 200 && !refused.length && !unresolvedLists.length,
    body.length + ' byte(s) of the listener read below the guard; ' + literalKeys.length + ' literal '
      + 'comparison(s) and ' + listKeys.length + ' key(s) from ' + testedLists.length
      + ' membership-tested list(s)'
      + (refused.length ? '; BOUND IN A FORM THIS READ CANNOT NAME: ' + refused.join(' · ') : '')
      + (unresolvedLists.length ? '; MEMBERSHIP-TESTED AND UNREADABLE: ' + unresolvedLists.join(', ')
        + ' — declare it as `const NAME = [\'…\']` so its keys can be read off the tree' : ''));
}
}
