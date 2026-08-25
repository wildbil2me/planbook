/* keys-legend-guards.mjs — the two anti-vacuity guards, exercised on supplied text (WO-2.38)
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
import { readScoresKeys } from './keys-legend-scores.mjs';
import { readMarkingKeys } from './keys-legend-marking.mjs';

export async function run(h) {
const { ROOT, check, has } = h;

/* ───── the two anti-vacuity guards above are exercised on supplied text, every run (WO-2.38) ─────
 *
 * WO-2.36 replaced six hardcoded floors with the two `vacuity` arrays above — each anchor asserted
 * found, one by one, by name. **On a green tree every arm of both is dead code.** `vacuity` is empty,
 * so nothing downstream of `if (!vacuity.length)` is ever evaluated, and until this section existed the
 * only thing that had ever executed a single arm was a hand mutation, applied twice on one afternoon
 * and reverted both times. Rename `panelAt`, tighten one of the regexes until an `else if` becomes
 * unreachable, or let an `indexOf` start answering `0` where the code tests `< 0`, and nothing goes
 * red: the run prints its usual total and the reader still believes both legends are policed. That is
 * WO-2.36's own argument one level up — empty agrees with everything, and so does a guard nobody
 * exercises.
 *
 * WHERE THIS LIVES, AND WHY IT IS NOT A FILE OF ITS OWN. A sibling script is the obvious shape, since
 * nothing in here needs a browser and this file is the browser harness. IT IS THE WRONG SHAPE, and the
 * rule is already written down twice: `plans/verification-tooling.md`'s boundary table says **one
 * file — no `tools/lib/`, no second harness, no plugin seam**, and its § "The check on `wo-gate.mjs`
 * is a flag inside `wo-gate.mjs`" settles this exact case in the other direction from
 * § "The grep half moves out". A check on a tool lives IN the tool it checks. A sibling here would
 * need these two reads EXPORTED, and an export is the shared seam those rules exist to prevent — the
 * alternative, a sibling with its own copy of the reads, is the second hand-maintained copy WO-2.36
 * refused for counts, agreeing with this file on the morning it is written and drifting afterwards.
 * The "needs no browser" objection is answered by the file itself: the two blocks above, the precache
 * read and this section all run before a browser is launched. This is the one harness, not the browser
 * half of two.
 *
 * (WO-1.26 TOOK ONE PREMISE OF THAT PARAGRAPH AWAY AND LEFT THE CONCLUSION STANDING. The two reads
 * are exported now — `readScoresKeys` and `readMarkingKeys` are imported at the top of this file from
 * the two sections that own them — because after the split every section is a module and every shared
 * helper is an export, so "an export is the shared seam" argues for nothing here any more. What has
 * not changed: this is still ONE harness of one process, this is still not a sibling script with its
 * own copy of the reads, and this still rides the ordinary run rather than a flag, on the
 * writes/spawns/waits distinction below — which never had anything to do with how many files the
 * harness was in. `plans/verification-tooling.md` § WO-2.38 carries the same note.)
 *
 * IT RIDES THE ORDINARY RUN RATHER THAN A `--self-check` FLAG, and that is where it parts from
 * `wo-gate.mjs` — on the difference between the two subjects, not on taste. That flag copies `plans/`
 * to a temp directory and plants violations in it: it WRITES, it is slow, and it carries a
 * precondition (clean trackers) that can stop it for reasons that are not about the script. None of
 * that is true here. These cases are string operations on text this run has already read, they cost
 * milliseconds, they write nothing anywhere, and they need no fixture but the tree. A flag would make
 * them opt-in — and an opt-in guard against rot is precisely the fault this section exists to fix,
 * since nobody would pass it and the arms would rot behind a green run exactly as before. **So the
 * rule to carry forward is neither "always a flag" nor "always the run": the self-test belongs in the
 * file it tests, riding the ordinary run when it is cheap and side-effect-free, and standing behind a
 * flag when it must write, spawn or wait.** (WO-2.40 asks the same question of `codex-invoke.mjs`,
 * which spawns and has no always-on report of its own — a flag there, this shape here, one rule.)
 *
 * THE GREEN TREE IS NOT THE FIXTURE, so every case mutates a COPY IN MEMORY and reads that. Nothing
 * here opens `index.html` or `src/` for writing and no case can leave a mutation behind: a check that
 * edits the tree and reverts is one crash away from leaving the app broken, which is the hazard
 * WO-2.37 is booked over.
 *
 * AND EVERY MUTATION IS ASSERTED TO HAVE APPLIED. A `replace()` whose needle has moved is a no-op:
 * the read comes back exactly as the green tree's, no arm fires, and a case written to prove an arm
 * fires would prove nothing while printing PASS — this section's own version of the fault it is here
 * to catch upstairs. So edit() and cut() throw on a needle that matches nothing, the loop catches it,
 * and the case goes red naming the needle rather than passing on emptiness.
 */
{
  const html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
  const scoresSrc = await fs.readFile(path.join(ROOT, 'src', 'scores.js'), 'utf8');
  const shellSrc = await fs.readFile(path.join(ROOT, 'src', 'shell.js'), 'utf8');

  /* The real reads, once. The cases below rename and cut at what THESE came back with — the modal id,
     the index of a panel or a function — rather than searching for the same anchors again with a
     second copy of the pattern. Fact 3 of the marking block is why this file still does not spell
     `attendanceKeysModal` anywhere. */
  const realScores = readScoresKeys(html, scoresSrc);
  const realMarking = readMarkingKeys(html, shellSrc);

  const edit = (text, from, to) => {
    const out = text.replace(from, to);
    if (out === text) throw new Error('nothing to replace: ' + from);
    return out;
  };
  const editAll = (text, from, to) => {
    const out = text.split(from).join(to);
    if (out === text) throw new Error('nothing to replace: ' + from);
    return out;
  };
  /* Truncation, which is how the "…never closes" and "…has no `}` after it" arms are reached: the
     anchor is found and the thing that should follow it is not in the document at all. */
  const cut = (text, at) => {
    if (!(at > 0) || at >= text.length) throw new Error('nothing to cut at index ' + at);
    return text.slice(0, at);
  };
  const splice = (text, at, insert) => {
    if (!(at > 0) || at >= text.length) throw new Error('nothing to splice at index ' + at);
    return text.slice(0, at) + insert + text.slice(at);
  };

  /* ONE CASE PER ARM, in the order the arms are written above, each naming the anchor its failure text
     has to blame. `arm` is a slice of that text rather than the whole of it, because the whole of it is
     a sentence that will be reworded and the anchor is what may not change silently. Several of the
     mutations are the ones WO-2.36's verification drove by hand in a scratchpad that no longer exists —
     a renamed `handleScoreKey`, a renamed `MARK_KEYS`, a renamed modal id, requoted `scores-key` spans,
     the glyph regex broken, a truncated slice — plus one per arm those eight never reached. Several are
     VALID HTML that renders identically (a second class on a span, a `<kbd>` given an attribute), which
     is the realistic shape of this rot: nobody breaks the markup, they tidy it. */
  const ARMS = [
    { what: 'the score panel\'s id renamed in index.html',
      arm: 'index.html has no `id="scoresKeys"`',
      read: () => readScoresKeys(edit(html, 'id="scoresKeys"', 'id="scoresKeyRing"'), scoresSrc) },
    { what: 'index.html truncated inside the score panel, so it never closes',
      arm: 'the #scoresKeys panel never closes',
      read: () => readScoresKeys(cut(html, realScores.panelAt + 30), scoresSrc) },
    { what: 'a second class added to every `scores-key` span — valid HTML, identical rendering, and '
        + 'the row regex reads nothing',
      arm: 'no `<span class="scores-key">` inside the panel',
      read: () => readScoresKeys(
        editAll(html, '<span class="scores-key">', '<span class="scores-key legend">'), scoresSrc) },
    { what: 'every bare `<kbd>` in index.html given an attribute, so the glyph regex reads nothing',
      arm: 'no `<kbd>` inside those rows',
      read: () => readScoresKeys(editAll(html, '<kbd>', '<kbd class="key">'), scoresSrc) },
    { what: 'handleScoreKey() renamed in src/scores.js',
      arm: 'src/scores.js has no `export function handleScoreKey(`',
      read: () => readScoresKeys(html,
        edit(scoresSrc, 'export function handleScoreKey(', 'export function handleScoreKeyPress(')) },
    { what: 'src/scores.js truncated inside handleScoreKey(), so the slice would run to the end of '
        + 'the file',
      arm: 'handleScoreKey() has no `}` in the first column after it',
      read: () => readScoresKeys(html, cut(scoresSrc, realScores.at + 60)) },
    { what: 'a `}` in the first column 50 bytes into handleScoreKey(), leaving a slice too short to '
        + 'be that function',
      arm: 'the handleScoreKey() slice is',
      read: () => readScoresKeys(html, splice(scoresSrc, realScores.at + 50, '\n}')) },
    { what: 'a second space in every `key === \'…\'`, so the binding regexes read nothing',
      arm: 'no key list inside handleScoreKey()',
      read: () => readScoresKeys(html, editAll(scoresSrc, ' === \'', ' ===  \'')) },
    { what: 'the `KEYS_MODAL` constant renamed in src/shell.js',
      arm: 'src/shell.js has no `const KEYS_MODAL',
      read: () => readMarkingKeys(html,
        edit(shellSrc, 'const KEYS_MODAL = ', 'const KEYS_MODAL_ID = ')) },
    { what: 'the marking modal\'s id renamed in index.html alone, src/shell.js still opening the old '
        + 'one',
      arm: 'index.html has no `id="' + realMarking.modalId + '"`',
      read: () => readMarkingKeys(edit(html, 'id="' + realMarking.modalId + '"',
        'id="' + realMarking.modalId + 'Legend"'), shellSrc) },
    { what: 'a second class on the `attendance-keys` list',
      arm: 'no `<dl class="attendance-keys">` inside that modal',
      read: () => readMarkingKeys(
        edit(html, '<dl class="attendance-keys">', '<dl class="attendance-keys legend">'), shellSrc) },
    { what: 'index.html truncated inside that `<dl>`, so it never closes',
      arm: 'that `<dl>` never closes',
      read: () => readMarkingKeys(cut(html, realMarking.dlAt + 40), shellSrc) },
    { what: 'a second class on every `attendance-key-row`, so the row regex reads nothing',
      arm: 'no `.attendance-key-row` inside it',
      read: () => readMarkingKeys(editAll(html, '<div class="attendance-key-row">',
        '<div class="attendance-key-row wide">'), shellSrc) },
    { what: 'a second class on every `attendance-key` kbd, so the glyph regex reads nothing',
      arm: 'no `<kbd class="attendance-key">` in those rows',
      read: () => readMarkingKeys(editAll(html, '<kbd class="attendance-key">',
        '<kbd class="attendance-key big">'), shellSrc) },
    { what: 'the class-view guard rewritten with double quotes — same behaviour, and the slice this '
        + 'block reads starts at the literal text',
      arm: 'src/shell.js no longer contains the class-view guard',
      read: () => readMarkingKeys(html, edit(shellSrc,
        'if (views.currentView() !== \'class\') return;',
        'if (views.currentView() !== "class") return;')) },
    { what: 'src/shell.js truncated below that guard, so the listener never closes',
      arm: 'the listener below that guard has no closing `});`',
      read: () => readMarkingKeys(html, cut(shellSrc, realMarking.listenerAt + 120)) },
    { what: 'a `});` 50 bytes below the guard, leaving a slice too short to be that listener',
      arm: 'the slice below the guard is',
      read: () => readMarkingKeys(html,
        splice(shellSrc, realMarking.listenerAt + 50, '\n});')) },
    { what: 'a second space in every `e.key === \'…\'` and a `MARK_KEYS` spread from somewhere else, '
        + 'so nothing below the guard reads as a key',
      arm: 'no `e.key === \'…\'` and no key list below the guard',
      read: () => readMarkingKeys(html, edit(editAll(shellSrc, 'e.key === \'', 'e.key ===  \''),
        /const MARK_KEYS = \[[^\]]*\]/, 'const MARK_KEYS = [...MARK_LETTERS]')) },
    { what: 'the `MARK_KEYS` constant renamed, which is the case that used to blame GLYPH_OF',
      arm: 'src/shell.js has no `const MARK_KEYS',
      read: () => readMarkingKeys(html,
        edit(shellSrc, 'const MARK_KEYS = [', 'const MARK_LETTERS = [')) },
  ];

  for (const c of ARMS) {
    let facts = null;
    let broke = '';
    try { facts = c.read(); } catch (e) { broke = String((e && e.message) || e); }
    const named = facts ? facts.vacuity.filter(v => v.indexOf(c.arm) >= 0) : [];
    check('the anti-vacuity guard fires, and blames the right anchor, on ' + c.what + ' — driven '
      + 'through the same read the check above uses, on text mutated in memory (WO-2.38)',
      !!facts && facts.vacuity.length === 1 && named.length === 1,
      broke ? 'THE MUTATION MATCHED NOTHING, so this case proved nothing rather than failing '
          + 'quietly: ' + broke
        : named.length === 1 && facts.vacuity.length === 1
          ? 'expected an arm naming `' + c.arm + '`, got: ' + facts.vacuity.join(' · ')
        : !facts.vacuity.length
          ? 'NO ARM FIRED, and the guard therefore passed on emptiness — the arm that should have '
            + 'named `' + c.arm + '` has been deleted, inverted, or made unreachable by an arm '
            + 'above it'
        : !named.length
          ? 'A DIFFERENT ARM FIRED — expected `' + c.arm + '`, got: ' + facts.vacuity.join(' · ')
            + '. Either an arm above this one now catches the case, or its condition was inverted'
          : 'expected ONE arm naming `' + c.arm + '` and got ' + facts.vacuity.length
            + ' at once, so this input trips more than the arm it was written for: '
            + facts.vacuity.join(' · '));
  }

  /* THE OTHER DIRECTION, and the one WO-2.36 exists for: a retirement done properly moves no anchor,
     so it must trip NO arm and leave the whole check green. `was` is the real read, asked whether the
     key was there to begin with — without that clause a mutation that removed nothing would report a
     green retirement, which is this section passing on emptiness in the one place it would look most
     convincing. */
  const RETIREMENTS = [
    { what: '`X` retired from the score grid — the `letter === \'X\'` comparison out of '
        + 'handleScoreKey() and the `X excused` row off the legend',
      key: 'X', glyph: 'X', was: realScores,
      read: () => readScoresKeys(
        edit(html, /\s*<span class="scores-key"><kbd>X<\/kbd>[^<]*<\/span>/, ''),
        edit(scoresSrc, 'letter === \'X\' ? \'excused\' : ', '')) },
    { what: '`D` retired from the marking screen — the letter out of `MARK_KEYS` and the Dismissed '
        + 'row off the card, which is the case the retired floor went red on',
      key: 'D', glyph: 'D', was: realMarking,
      read: () => readMarkingKeys(
        edit(html, /\s*<div class="attendance-key-row">\s*<dt><kbd class="attendance-key">D<\/kbd><\/dt>[\s\S]*?<\/div>/, ''),
        edit(shellSrc, /const MARK_KEYS = \[[^\]]*\]/, m => m.replace(/,\s*'D'/, ''))) },
  ];

  for (const c of RETIREMENTS) {
    let facts = null;
    let broke = '';
    try { facts = c.read(); } catch (e) { broke = String((e && e.message) || e); }
    const wasBound = c.was.bound.indexOf(c.key) >= 0 && c.was.glyphs.indexOf(c.glyph) >= 0;
    const gone = !!facts && facts.bound.indexOf(c.key) < 0 && facts.glyphs.indexOf(c.glyph) < 0;
    check('a correct retirement trips no arm and leaves the check green: ' + c.what + ' — the two '
      + 'documents in exact agreement, driven through the read rather than by editing the tree '
      + '(WO-2.36\'s case, and what the six retired floor numbers went red on)',
      gone && wasBound && !facts.vacuity.length && !facts.unmapped.length && !facts.missing.length
        && !facts.stray.length,
      broke ? 'THE MUTATION MATCHED NOTHING, so this case proved nothing rather than failing '
          + 'quietly: ' + broke
        : (wasBound ? '' : 'THE KEY WAS NOT BOUND ON THE REAL TREE TO BEGIN WITH, so this case is '
            + 'retiring nothing and would go green whatever the guard did — repoint it at a key the '
            + 'grid still binds. ')
          + (gone ? '' : 'THE MUTATION LEFT `' + c.key + '` IN PLACE on one side or the other. ')
          + facts.bound.length + ' key(s) bound [' + facts.bound.join(' ') + '] against '
          + facts.rows.length + ' legend row(s) carrying [' + facts.glyphs.join(' ') + ']'
          + (facts.vacuity.length ? '; AN ARM FIRED ON A CORRECT RETIREMENT, which is the failure '
            + 'WO-2.36 replaced the floors to avoid: ' + facts.vacuity.join(' · ') : '')
          + (facts.unmapped.length ? '; unmapped: ' + facts.unmapped.join(', ') : '')
          + (facts.missing.length ? '; missing: ' + facts.missing.join(', ') : '')
          + (facts.stray.length ? '; stray: ' + facts.stray.join(', ') : ''));
  }

  /* THE TABLE ABOVE IS COMPLETE, ASSERTED RATHER THAN BELIEVED. Deleting an arm leaves its case with
     nothing to find and that case goes red; deleting the case with it, or adding a twelfth arm to a
     block and no case for it, is what this line catches instead. Without it the set of arms and the
     set of cases are two hand-maintained lists that agree until somebody edits one — the same
     objection this whole section raises against the guard upstairs. The pattern is written with
     escapes so that it does not count itself, and this comment names no push site for the same
     reason. */
  /* THE TWO FILES THE ARMS ARE IN, WHICH IS NO LONGER THIS ONE (WO-1.26). This read was
     `fileURLToPath(import.meta.url)` while the whole harness was one file; the arms it counts are
     the `vacuity.push(` sites inside readScoresKeys() and readMarkingKeys(), and those went to the
     two section files above when the split moved them. Reading this file instead would count zero
     arms against eighteen cases and go red for a reason that has nothing to do with the guard —
     or, worse, count zero against zero if the cases ever went with them. The two are named by
     relative URL rather than assembled off `ROOT`, so a rename breaks the read loudly. Nineteen
     before the split and nineteen after. */
  const own = (await fs.readFile(new URL('./keys-legend-scores.mjs', import.meta.url), 'utf8'))
    + (await fs.readFile(new URL('./keys-legend-marking.mjs', import.meta.url), 'utf8'));
  const armSites = (own.match(/vacuity\s*\.\s*push\s*\(/g) || []).length;
  check('every arm of both `vacuity` arrays has a case above — the arms counted in this file against '
    + 'the cases written for them (WO-2.38: an arm nothing exercises is the fault this section is '
    + 'here for, and it arrives by addition as easily as by rot)',
    armSites === ARMS.length,
    armSites + ' arm(s) pushed across the two legend readers against ' + ARMS.length + ' case(s) above'
      + (armSites === ARMS.length ? '' : armSites > ARMS.length
        ? ' — an arm has no case: add one to ARMS above, on an input that trips it and nothing else'
        : ' — a case has no arm: the arm it was written for has been deleted or folded into another, '
          + 'and the red case above names the anchor that stopped being blamed'));
}
}
