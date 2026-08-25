/* keys-legend-scores.mjs — the ⌨ Keys legend on the score grid (WO-3.22)
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

/* ───────── the ⌨ Keys legend enumerates every key the grid binds (WO-3.22) ─────────
 *
 * Static, like the two blocks above, and for a reason of its own: THERE IS NO CANDIDATE UNIVERSE TO
 * PRESS. A driven version of this check would have to type every key a keyboard has at a score cell
 * and watch which ones were swallowed, and the defect it exists for is a key nobody thought of — the
 * one that gets bound next and not written down. A list of keys to try is the same list the legend
 * already is, so pressing them would compare the panel with itself. Reading the two documents is what
 * can actually go red: `handleScoreKey()` is the authority on what the grid answers to, and the panel
 * at `#scoresKeys` is what a teacher opens to learn it.
 *
 * WO-3.22's defect was `↑ ↓`: bound since WO-3.5, promised by the hint under the grid, and absent
 * from the legend until this check was written beside the row that fixes it.
 *
 * A NAIVE COMPARISON IS WRONG IN BOTH DIRECTIONS, and saying how is most of the work here.
 *
 *   "every key in the function is in the panel" — `Backspace` and `Delete` are two bindings and ONE
 *   row (`⌫`), because a teacher does not have two keys in mind; and the function compares against
 *   `Enter`, `ArrowUp` and the rest while the panel is written in glyphs. So a MAP from key name to
 *   the glyph the panel uses stands between them, and a bound key that is not in that map is a FAIL
 *   rather than a skip — that is the clause which makes the next key noisy instead of silent.
 *
 *   "every key in the panel is in the function" — `⇥` is in the legend and is deliberately NOT bound.
 *   `src/scores.js`'s WHAT IS DELIBERATELY NOT BOUND block says why: Tab already means "the next
 *   assignment" natively, because the cells are inputs in document order, so the panel documents the
 *   browser's behaviour rather than this module's. It is excepted BY NAME below, so that the reverse
 *   direction still catches a row left behind by a binding that was removed. `Esc` and the digits are
 *   named in that same block and are in neither place, which is the case this check has nothing to
 *   say about and should not.
 *
 * Both sides are guarded against a vacuous pass: a renamed function, a panel that stopped being
 * literal markup and a regex that quietly stopped matching all produce the empty answer, and empty
 * agrees with everything. HOW they are guarded was re-decided at WO-2.36 and is written out where
 * `vacuity` is built below — each ANCHOR is asserted found, rather than each list asserted long
 * enough — so that retiring a key from the function and the panel together leaves this check green.
 *
 * ONE READ, CALLABLE WITH TEXT, SINCE WO-2.38. Everything this block takes off the two documents is
 * inside readScoresKeys(), which is handed their TEXT rather than their paths and opens no file of its
 * own. The ordinary run below passes what is on disk; the self-check section further down passes
 * MUTATED COPIES IN MEMORY, so every arm of `vacuity` is exercised by the code that ships rather than
 * by a replica of it. That is the whole point of the shape: a second hand-written copy of these reads
 * would agree with this one on the morning it was written and drift afterwards, which is the objection
 * WO-2.36 raised against a second hand-maintained count and it applies word for word to a predicate.
 * Nothing in here reads or writes the tree — a check that mutated `index.html` and reverted it is one
 * crash away from leaving the app broken.
 */
export function readScoresKeys(html, scoresSrc) {
  /* The panel, then the rows inside it, then the glyphs inside those. Sliced rather than searched
     whole, so that a `<kbd>` anywhere else in index.html — the attendance key legend has its own —
     cannot answer for this one. Each step KEEPS THE INDEX IT FOUND rather than only the slice, so the
     guard further down can say which one came back empty. It also stops a real trap: `html.slice(-1)`
     on a missing id is a one-character panel with no `</div>` in it, which reaches the right answer
     (an empty legend) by an accident nobody would want to rely on twice. */
  const panelAt = html.indexOf('id="scoresKeys"');
  const panel = panelAt < 0 ? '' : html.slice(panelAt);
  const panelEnd = panel.indexOf('</div>');
  const legendHtml = panelEnd < 0 ? '' : panel.slice(0, panelEnd);
  const rows = [...legendHtml.matchAll(/<span class="scores-key">([\s\S]*?)<\/span>/g)].map(m => m[1]);
  const glyphs = rows.flatMap(r => [...r.matchAll(/<kbd>([^<]*)<\/kbd>/g)].map(k => k[1].trim()));

  /* The function's own body, and only its own: from its `export function` line to the first `}` in
     the first column after it. Everything below is read out of that slice, so a key bound in a
     neighbouring function is not this check's business and cannot make it green either. Both ends are
     kept and both are checked: a missing closing brace used to give `slice(at, -1)`, which is not an
     empty body but the WHOLE REST OF THE FILE read as if it were this function. */
  const at = scoresSrc.indexOf('export function handleScoreKey(');
  const bodyEnd = at < 0 ? -1 : scoresSrc.indexOf('\n}', at);
  const body = at < 0 || bodyEnd < 0 ? '' : scoresSrc.slice(at, bodyEnd);

  /* `key === '…'` and `letter === '…'` — the second is how `L`, `M` and `X` are compared, through
     the uppercased single character above them. */
  const literalKeys = [...new Set([...body.matchAll(/\b(?:key|letter) === '([^']+)'/g)].map(m => m[1]))];

  /* ── HOW WIDE THIS READ IS, DECIDED AT WO-2.35 RATHER THAN LEFT TO THE FLOOR BELOW ──
   *
   * THE SENTENCE THAT USED TO STAND HERE WAS WITHDRAWN, and withdrawing it is half of that work
   * order. It said that a comparison written any other way "is the honest limit of a static read and
   * the reason the count below is asserted rather than assumed". The first half is true. THE SECOND
   * HALF WAS FALSE, and a comment is exactly where that does damage: `bound.length >= 8` is a FLOOR.
   * An eleventh key bound through a `switch` does not lower it — `bound.length` stays where it was,
   * the floor passes, every key the regex CAN see is still on the legend, and the check goes green
   * over a card that is now missing a row. The floor catches a regex that stopped matching
   * EVERYTHING; it cannot catch one that matches everything it used to and misses only the new
   * thing. A mitigation cited for a case it does not cover is worse than none, because it stops the
   * next reader looking — which is how WO-3.22's own failure mode got a second door.
   * (`bound.length >= 8` IS NO LONGER A GUARD ANYWHERE IN THIS FILE — it survives only as the quoted
   * text above and below. The counts were retired where `vacuity` is built
   * below, and the reasoning for that is written out there. This paragraph is unchanged by it: an
   * invisible binding does not trip the anchor guard that replaced them either, which is exactly why
   * the second check at the foot of this block is still the thing that catches one.)
   *
   * What stands in its place is a read WIDENED to the forms a hand here actually reaches for, plus an
   * assertion that the rest are ABSENT (`refused`, below). Both halves were taken off this tree
   * rather than off a list of what JavaScript can do, because a regex matching a form nobody writes
   * here costs a reader's time forever and catches nothing.
   *
   *   READ — A KEY LIST DECLARED `const NAME = ['…']` AND MEMBERSHIP-TESTED IN THE SLICE. This is not
   *   a hypothetical spelling: src/shell.js's marking listener binds its five letters exactly that way
   *   (`MARK_KEYS.indexOf(code) === -1`), and the sibling check below had to hardcode that one array's
   *   NAME to see them. Finding such a list by its SHAPE instead is what makes a SECOND one visible.
   *   `.includes(` shares the alternation with `.indexOf(` — same form, same payload, not a second
   *   guess; src/ writes `indexOf` in thirty-odd places and `includes` in none today, and one word of
   *   alternation is cheaper than the reader who has to find that out later.
   *
   *   REFUSED, BY NAME AND WITH A CHECK BEHIND IT — `switch`, `e.code`, a prefix/suffix test on the
   *   key, and the key used as a lookup index. Not one of them appears anywhere in src/: there is no
   *   `switch` statement in the whole tree, no `startsWith`, no `.includes(`. That asymmetry is the
   *   whole decision. Reading a form nobody writes is a guess that catches nothing; asserting its
   *   ABSENCE costs one line and goes red the day it arrives, which is a check rather than a comment
   *   asking politely.
   *
   *   `e.code` IS DECIDED SEPARATELY AND ON ITS OWN FACTS, because it is not a spelling of the others.
   *   It is a DIFFERENT PROPERTY WITH DIFFERENT VALUES — `e.code === 'KeyP'` where `e.key === 'P'`,
   *   `'Slash'` where `'?'` is — so a read widened to it would put `KeyP` into `bound` and demand a
   *   legend row for a key no teacher presses and this app does not bind. A map that conflates them
   *   documents a lie. And `.code` is already a heavily used DOMAIN field here — `mark.code`,
   *   `row.code`, `cell.code` are attendance marks — so a looser pattern would read marks as keys.
   *   REFUSED, NEVER READ. If a binding one day genuinely needs `e.code`, this check has to learn the
   *   code→key mapping first, and that is a work order rather than a regex.
   *
   * WHAT IS STILL INVISIBLE, SAID PLAINLY so that nobody has to trust this block twice: a comparison
   * against a variable rather than a literal (`key === SOME_CONST`), and a key list assembled at run
   * time rather than written down. The first no static pattern can read. The second is caught rather
   * than skipped — a CAPS-shaped list membership-tested here that this block cannot resolve to quoted
   * strings is reported by `unresolvedLists` below, which is the floor a newly invisible key list
   * actually trips.
   */
  const testedLists = [...new Set([...body.matchAll(
    /\b([A-Za-z_$][\w$]*)\s*\.\s*(?:indexOf|includes)\s*\(/g)].map(m => m[1]))];
  const listKeys = [];
  const unresolvedLists = [];
  for (const name of testedLists) {
    const decl = scoresSrc.match(new RegExp('const ' + name + ' = \\[([^\\]]*)\\]'));
    const inner = decl ? decl[1] : '';
    /* Only a list of quoted strings is a key list. `siblings.indexOf(assignment)` and its kind drop
       out here on their own shape rather than being excluded by name — and a CAPS-shaped constant
       that does NOT resolve is kept and reported, because that is the one that looks like a key list
       and cannot be read as one. */
    if (decl && /^[\s,]*(?:'[^']*'[\s,]*)+$/.test(inner)) {
      listKeys.push(...[...inner.matchAll(/'([^']*)'/g)].map(m => m[1]));
    } else if (/^[A-Z][A-Z0-9_]*$/.test(name)) {
      unresolvedLists.push(name);
    }
  }

  const bound = [...new Set([...literalKeys, ...listKeys])];

  /* Two bindings, one row: a teacher has one "clear this" key in mind whichever her keyboard calls
     it, and src/scores.js treats them as one. */
  const GLYPH_OF = { Enter: '↵', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
    Backspace: '⌫', Delete: '⌫', L: 'L', M: 'M', X: 'X' };
  /* In the legend and not in the function, on purpose. The value is the key it documents. */
  const LISTED_UNBOUND = { '⇥': 'Tab (the browser\'s own tab order, not this module\'s)' };

  const unmapped = bound.filter(k => !(k in GLYPH_OF));
  const missing = bound.filter(k => k in GLYPH_OF && !glyphs.includes(GLYPH_OF[k]));
  /* `bound`, NOT `Object.keys(GLYPH_OF)` — the whole reverse direction turns on which list is asked.
     GLYPH_OF is maintained here, in this file; asking it whether a legend row is bound compares the
     panel against the harness's own table and answers yes forever, so a binding deleted from
     src/scores.js leaves its row on the card and this check green. WO-3.22 shipped it that way and
     its correction round was the mutation: `ArrowUp` removed from handleScoreKey() with `↑` left on
     the legend read `stray []`, pass true. Asking `bound` is what makes the row go red with it. */
  const stray = glyphs.filter(g => !(g in LISTED_UNBOUND) && !bound.some(k => GLYPH_OF[k] === g));

  /* ── WHY THERE ARE NO EXPECTED COUNTS IN THIS CHECK, DECIDED AT WO-2.36 ──
   *
   * A floor used to stand here: `bound.length >= 8 && glyphs.length >= 8 && rows.length >= 7`, three
   * numbers copied off the tree the morning the check was written. IT WAS RIGHT ABOUT THE DANGER AND
   * WRONG ABOUT THE MEASURE, and both halves are worth having in front of you before you put a number
   * back.
   *
   * The danger is real and has not gone anywhere: EMPTY AGREES WITH EVERYTHING. Lose the panel id,
   * lose the function name, or let one of the regexes above quietly stop matching, and `bound`,
   * `glyphs` and `rows` all come back empty together — so `unmapped`, `missing` and `stray` are empty
   * too, and this check reports a legend and a keyboard in perfect agreement having read neither.
   *
   * The measure was wrong because A HARDCODED COUNT ALSO FIRES ON THE ONE EDIT THAT IS ENTIRELY
   * CORRECT. Retire a key — delete the comparison from handleScoreKey() AND delete its row from the
   * panel, leaving the two documents in exact agreement — and the counts drop, the floor objects, and
   * a correct tree goes red. Whoever hits that reads the failure, checks the tree, finds it right,
   * and edits the number down. A FLOOR THAT IS EDITED EVERY TIME IT FIRES IS A FLOOR NOBODY DEFENDS:
   * by the second time, the reader has been taught it is a formality to step over, and a formality is
   * exactly the shape the vacuous pass arrives in.
   *
   * THERE IS NO HONEST PLACE TO SOURCE AN EXPECTED COUNT FROM — that was looked for, not assumed.
   * The legend's own row count is the thing being guarded, so asserting `bound` against it is the
   * vacuity walking back in through the fix: a lost id empties both sides and they agree at zero.
   * `Object.keys(GLYPH_OF).length` is a table maintained in THIS file, which is precisely the mistake
   * the `stray` line above had to be corrected for — ask the harness's own table and it answers yes
   * forever. A number parked in TESTING.md or a design doc is a second hand-maintained copy in a file
   * nothing executes, and it drifts in silence with the failure pointing at the wrong document. Every
   * candidate is either the guarded list wearing a hat, or the same constant with a longer walk to it.
   *
   * SO THE COUNTS ARE GONE RATHER THAN CORRECTED, because the count was never the thing that caught
   * anything. Follow a PARTIAL loss through: a key that drops out of `bound` while its row stands
   * turns that row `stray`; a row that drops out while its key is still bound turns that key
   * `missing`. The two-way comparison already catches every partial failure, in both directions, and
   * prints the key's name while it does it. The only failure it cannot catch is the one where BOTH
   * sides read nothing — and that is not a matter of degree, it is AN ANCHOR THAT IS NO LONGER IN THE
   * TREE. So the anchors are asserted directly, one by one, by name, in `vacuity` below: the id
   * found, the slice closed, each regex having matched at all. A retirement moves no anchor and never
   * trips it; a rename moves exactly one, and the failure says which.
   *
   * WHAT THAT LEAVES A READER STARING AT A RED LINE. If the message names keys, the function and the
   * panel genuinely disagree and the named key is the work. If the message says NOTHING TO COMPARE,
   * this block has lost its grip on one of the two documents and the named anchor is where to look —
   * it is drift, never a retirement. THERE IS NO THIRD CASE AND NO NUMBER IN HERE TO MOVE: retiring a
   * key means deleting the binding and deleting its row, and then this check is green, which is the
   * whole reason it is shaped this way.
   *
   * `body.length < 200` is the one number left and it is not a census. The slice is about 1.9 kB; the
   * test only separates "the anchor moved and this is the empty string" from "the function is here".
   * Retiring a key moves it by tens of bytes and cannot come near it, so it is not a number anybody
   * is ever asked to edit. The refusal check below guards itself with the same threshold, and that is
   * where this shape was first used here rather than a fourth hardcoded count.
   */
  const vacuity = [];
  /* At most one reason per side, most upstream first: a lost id makes the rows empty too, and three
     lines of consequence would bury the one line of cause. */
  if (panelAt < 0) vacuity.push('index.html has no `id="scoresKeys"` — the legend side was never found');
  else if (panelEnd < 0) vacuity.push('the #scoresKeys panel never closes — no `</div>` after it');
  else if (!rows.length) vacuity.push('no `<span class="scores-key">` inside the panel — the row regex '
    + 'here has stopped reading the markup it was written for');
  else if (!glyphs.length) vacuity.push('no `<kbd>` inside those rows — the glyph regex here has '
    + 'stopped reading the markup it was written for');
  if (at < 0) vacuity.push('src/scores.js has no `export function handleScoreKey(` — the binding side '
    + 'was never found');
  else if (bodyEnd < 0) vacuity.push('handleScoreKey() has no `}` in the first column after it — the '
    + 'slice would have run to the end of the file');
  else if (body.length < 200) vacuity.push('the handleScoreKey() slice is ' + body.length
    + ' byte(s), too short to be that function');
  else if (!bound.length) vacuity.push('no `key === \'…\'`, no `letter === \'…\'` and no key list '
    + 'inside handleScoreKey() — the binding regexes here have stopped reading the code');

  /* The other half of WO-2.35's decision, and the half that is a CHECK rather than a wider regex: the
     four forms above refused by name, asserted absent in this slice. `body.length` is the guard that
     keeps it from passing on nothing — a renamed function slices to '' and '' contains no `switch`
     either. The labels are what a failure prints, so they say what to do about it. */
  const REFUSED = [
    ['a `switch` on the key — write the branches as `key === \'…\'`, or teach this block to read '
      + 'case labels first', /\bswitch\s*\(/],
    ['a comparison against `e.code` — a different property with different values (`KeyP` where '
      + '`e.key` is `P`); this check cannot map it and must not guess', /\be\s*\.\s*code\b/],
    ['a prefix or suffix test on the key — there is no single key name in it to put on the legend',
      /\.\s*(?:startsWith|endsWith)\s*\(/],
    ['the key used as a lookup index — a table keyed by key name binds every entry invisibly',
      /\[\s*(?:e\.key|key|letter|code)\s*\]/],
  ];
  const refused = REFUSED.filter(([, re]) => re.test(body)).map(([label]) => label);

  /* The indices come back with the lists (WO-2.38) so that a fixture can cut a document short at an
     anchor this read found, rather than searching for the anchor a second time with a second copy of
     the pattern. Nothing in the ordinary run below uses them. */
  return { panelAt, panelEnd, rows, glyphs, at, bodyEnd, body, literalKeys, testedLists, listKeys,
    unresolvedLists, bound, GLYPH_OF, unmapped, missing, stray, vacuity, refused };
}

export async function run(h) {
const { ROOT, check, has } = h;

/* The ordinary run: the two documents as they sit on disk, read once and handed straight in. */
{
  const html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
  const scoresSrc = await fs.readFile(path.join(ROOT, 'src', 'scores.js'), 'utf8');
  const { rows, glyphs, body, literalKeys, testedLists, listKeys, unresolvedLists, bound, GLYPH_OF,
    unmapped, missing, stray, vacuity, refused } = readScoresKeys(html, scoresSrc);

  check('every key the score grid binds is on the ⌨ Keys legend, and every entry on that legend is a '
    + 'key it binds — `⇥` excepted by name, because Tab is the browser\'s tab order and src/scores.js '
    + 'says so (WO-3.22: `↑ ↓` were bound, promised by the hint, and not on the card)',
    !vacuity.length && !unmapped.length && !missing.length && !stray.length,
    bound.length + ' key(s) bound by handleScoreKey() [' + bound.join(' ') + '] against '
      + rows.length + ' legend row(s) carrying [' + glyphs.join(' ') + ']'
      + (vacuity.length ? '; NOTHING TO COMPARE, so this would have passed on emptiness — a read here '
        + 'lost its anchor, which no retired key can cause: ' + vacuity.join(' · ') : '')
      + (unmapped.length ? '; BOUND AND UNKNOWN TO THIS CHECK: ' + unmapped.join(', ')
        + ' — add it to GLYPH_OF here and to the legend in index.html, in that order' : '')
      + (missing.length ? '; BOUND AND NOT ON THE LEGEND: '
        + missing.map(k => k + ' (' + GLYPH_OF[k] + ')').join(', ') : '')
      + (stray.length ? '; ON THE LEGEND AND NOT BOUND: ' + stray.join(', ') : ''));

  check('nothing in handleScoreKey() binds a key in a form the legend check above cannot read — no '
    + '`switch`, no `e.code`, no prefix test, no lookup keyed by the key name (WO-2.35: the check '
    + 'above asks whether two documents agree, so a binding it cannot see is not a disagreement and '
    + 'never goes red there on its own)',
    body.length > 200 && !refused.length && !unresolvedLists.length,
    body.length + ' byte(s) of handleScoreKey() read; ' + literalKeys.length + ' literal '
      + 'comparison(s) and ' + listKeys.length + ' key(s) from ' + testedLists.length
      + ' membership-tested list(s)'
      + (refused.length ? '; BOUND IN A FORM THIS READ CANNOT NAME: ' + refused.join(' · ') : '')
      + (unresolvedLists.length ? '; MEMBERSHIP-TESTED AND UNREADABLE: ' + unresolvedLists.join(', ')
        + ' — declare it as `const NAME = [\'…\']` so its keys can be read off the tree' : ''));
}
}
