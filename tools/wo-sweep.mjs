#!/usr/bin/env node
// wo-sweep.mjs — the verifier's standing sweep, as greps, run in one command.
//
//   node tools/wo-sweep.mjs            exits non-zero if anything FAILs
//   node tools/wo-sweep.mjs --verbose  prints every hit, not just the count
//
// `plans/verification-tooling.md` directs grep-shaped checks away from the browser harness:
// "Anything a grep settles correctly should be settled by grep, in the verifier's standing sweep."
// This is that sweep. It is not a second harness — it opens no browser, drives nothing, and every
// check here is a text search that `verify-shell.mjs` would have to spend 400 lines of automation
// to do worse.
//
// Three states, and the third is the honest one:
//   PASS    — the rule holds
//   FAIL    — the rule is broken, with file:line. Exits non-zero.
//   REVIEW  — greppable evidence that needs a human decision. Never fails the run; it narrows
//             what the verifier has to read rather than pretending to have decided it.
//
// Each check carries its own allowlist, because the allowlists are the part that gets re-derived.
// WO-1.2's verifier had to reason from scratch that every `prefers-color-scheme` hit in the repo
// was prose *stating the prohibition*. That reasoning is written down here instead.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERBOSE = process.argv.includes('--verbose');

/* ────────────────────────────── result bookkeeping ──────────────────────────────
   Same shape as tools/verify-shell.mjs, so a verifier reads one format from two commands. */

const results = [];
function check(name, ok, detail) {
  results.push({ name, state: ok ? 'pass' : 'fail', detail: detail || '' });
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? '  :: ' + detail : ''));
}
function review(name, detail) {
  results.push({ name, state: 'review', detail });
  console.log('REVIEW | ' + name + '  :: ' + detail);
}

/* ────────────────────────────── file walking ────────────────────────────── */

const IGNORE_DIRS = new Set(['.git', 'node_modules', 'certs', 'icons', '.claude']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const ALL = walk(REPO);
const rel = p => path.relative(REPO, p).replace(/\\/g, '/');

// The app's own source. Prose (.md) is excluded from every code check by construction: the docs
// state the prohibitions, so searching them finds the rule and calls it the violation.
const isCode = p => !/\.md$/i.test(p) && /^(index\.html|sw\.js|manifest\.webmanifest|src\/)/.test(rel(p));
const CODE = ALL.filter(isCode);
const STYLE = ALL.filter(p => /\.(css|html)$/i.test(p) && !/^tools\//.test(rel(p)));

function grepLines(files, re, skipLine) {
  const hits = [];
  for (const f of files) {
    let text;
    try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
    text.split('\n').forEach((line, i) => {
      re.lastIndex = 0;
      if (re.test(line) && !(skipLine && skipLine(line, f))) hits.push({ file: rel(f), line: i + 1, text: line.trim() });
    });
  }
  return hits;
}

// CSS rules in a .html file live inside <style>; everything else in the file is markup, script, and
// comments. Scanning the whole file would call `<!--note: something-->` a custom property, which is
// a false FAIL on a stylesheet rule that does not exist — and a check that cries wolf gets ignored,
// which costs more than the check was worth.
function styleScopedLines(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');
  if (!/\.html$/i.test(file)) return lines.map((text, i) => ({ line: i + 1, text }));
  const out = [];
  let inStyle = false;
  lines.forEach((l, i) => {
    if (/<style[\s>]/i.test(l)) inStyle = true;
    if (inStyle) out.push({ line: i + 1, text: l });
    if (/<\/style>/i.test(l)) inStyle = false;
  });
  return out;
}

function grepStyle(files, re, skipLine) {
  const hits = [];
  for (const f of files) {
    for (const { line, text } of styleScopedLines(f)) {
      re.lastIndex = 0;
      if (re.test(text) && !(skipLine && skipLine(text, f))) hits.push({ file: rel(f), line, text: text.trim() });
    }
  }
  return hits;
}

function report(hits) {
  if (!hits.length) return '';
  const shown = VERBOSE ? hits : hits.slice(0, 5);
  const s = shown.map(h => `${h.file}:${h.line}`).join(', ');
  return hits.length > shown.length ? `${s}, +${hits.length - shown.length} more (--verbose)` : s;
}

/* ══════════════════════════ 1. no dependency manifest ══════════════════════════ */

{
  const banned = ALL.filter(p => /(^|\/)(package\.json|package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(rel(p)));
  const modules = fs.existsSync(path.join(REPO, 'node_modules'));
  check('no dependency manifest anywhere', !banned.length && !modules,
    banned.length ? banned.map(rel).join(', ') : modules ? 'node_modules/ exists' : 'no package.json, no lockfile, no node_modules');
}

/* ══════════════════════════ 2. no dark mode ══════════════════════════
   Allowlist: none needed. Prose is already excluded — every hit in AGENTS.md, CLAUDE.md,
   design/style-guide.md, src/README.md, TESTING.md, plans/ and .claude/ is a statement of the
   prohibition, and tools/ is excluded because the harness greps for these strings by name. */

{
  const hits = grepLines(CODE, /prefers-color-scheme|data-theme/);
  check('no dark-mode rules in app code', !hits.length,
    hits.length ? report(hits) : 'no prefers-color-scheme, no [data-theme] in index.html, sw.js, manifest, or src/');
}

/* ══════════════════════════ 3. colors inline, not CSS variables ══════════════════════════
   design/style-guide.md declares this deliberate, and src/shell.css states why at its head. The
   trap is an agent "tidying" it into custom properties. */

{
  const decl = grepStyle(STYLE, /(^|[\s;{])--[a-z][\w-]*\s*:/i);
  const uses = grepStyle(STYLE, /var\(\s*--/);
  const hits = [...decl, ...uses];
  // Report lines actually scanned, not files opened. index.html has no <style> block, so it
  // contributes zero scannable lines — "2 files clean" would be counting a file this check never
  // read, which is the shape of a green run over an empty fixture.
  const scanned = STYLE.reduce((n, f) => n + styleScopedLines(f).length, 0);
  check('no CSS custom properties standing in for inline colors', !hits.length,
    hits.length ? report(hits) : `${scanned} style line(s) across ${STYLE.filter(f => styleScopedLines(f).length).length} file(s), clean of --custom-props and var()`);
}

/* ══════════════════════════ 4. localStorage holds UI preferences only ══════════════════════════
   src/prefs.js makes this structural rather than promised: setPref() refuses a key absent from
   PREF_DEFAULTS. So the greppable check is that every key any caller uses is declared there.
   WO-1.4 shipped setPref('openYear') against a key that was never declared, and prefs.js silently
   refused the write — the audit caught it, nothing else would have. */

{
  const prefsFile = path.join(REPO, 'src', 'prefs.js');
  if (!fs.existsSync(prefsFile)) {
    review('localStorage keys declared in PREF_DEFAULTS', 'src/prefs.js not found — check by hand');
  } else {
    const src = fs.readFileSync(prefsFile, 'utf8');
    const block = /export const PREF_DEFAULTS\s*=\s*\{([\s\S]*?)\n\};/.exec(src);
    const declared = new Set();
    if (block) for (const m of block[1].matchAll(/^\s{2}([A-Za-z_]\w*)\s*:/gm)) declared.add(m[1]);

    const used = new Map();
    for (const f of CODE) {
      const text = fs.readFileSync(f, 'utf8');
      text.split('\n').forEach((line, i) => {
        for (const m of line.matchAll(/\b(?:set|get)Pref\s*\(\s*['"]([^'"]+)['"]/g)) {
          if (!used.has(m[1])) used.set(m[1], `${rel(f)}:${i + 1}`);
        }
      });
    }
    const undeclared = [...used].filter(([k]) => !declared.has(k));
    check('every getPref/setPref key is declared in PREF_DEFAULTS', !undeclared.length,
      undeclared.length ? undeclared.map(([k, w]) => `${k} (${w})`).join(', ')
        : `${declared.size} declared, ${used.size} used, all accounted for`);

    // Raw localStorage access outside prefs.js bypasses the enforcement entirely. Matches both
    // dot access (localStorage.getItem) and bracket access (localStorage['x']) — a regex anchored
    // on the dot alone lets bracket notation through unseen.
    const raw = grepLines(CODE.filter(f => rel(f) !== 'src/prefs.js'), /localStorage\s*[.[]/);
    check('no localStorage access outside src/prefs.js', !raw.length,
      raw.length ? report(raw) : 'prefs.js is the only door');
  }
}

/* ══════════════════════════ 5. sensitive data stays on the roster ══════════════════════════
   The permitted path is the JSON backup, whose own UI says so. Everything else — merge fields,
   exports, print surfaces, log lines — must not carry `supports` data. This one REVIEWs rather
   than FAILs: whether a mention emits is a reading question, and a grep that guessed would either
   cry wolf on the roster editor or wave through the one line that matters. */

{
  const SENSITIVE = /\bsupports\b|\baccommodations?\b|\bbehaviou?rPlan\b|\bmedical\b|\bIEP\b|\b504\b/;
  const PERMITTED = new Set(['src/backup.js']);   // the backup, and only the backup
  const hits = grepLines(CODE.filter(f => !PERMITTED.has(rel(f))), SENSITIVE);
  const files = [...new Set(hits.map(h => h.file))];
  if (!hits.length) {
    check('no sensitive field names outside the permitted path', true, 'nothing outside src/backup.js mentions supports/accommodation/medical/plan');
  } else {
    review('sensitive field names outside src/backup.js',
      `${hits.length} mention(s) in ${files.join(', ')} — read each and confirm none of them emits to a merge field, export, print surface, or log line`);
  }
}

/* ══════════════════════════ 5b. one place decides whether support data is on screen ═══════════
   WO-1.8 routes every sensitive render through src/supports.js, and WO-1.9's presentation mode is
   built on that being true: its Traps line says per-screen conditionals pass that work order and
   fail in Phase 4. A grep settles this one exactly — the rule is "supportsVisible is DEFINED once
   and CALLED from the screens", and the failure it catches is a second copy of the test appearing
   in the file that needed it, which is the shape the mistake actually takes. */

{
  const OWNER = 'src/supports.js';
  const ownerFile = path.join(REPO, 'src', 'supports.js');
  if (!fs.existsSync(ownerFile)) {
    check('the support-visibility rule is defined in exactly one place', true,
      'src/supports.js does not exist yet — nothing renders support data');
  } else {
    const defs = grepLines(CODE, /function\s+supportsVisible\b/);
    const calls = grepLines(CODE.filter(f => rel(f) !== OWNER), /\bsupportsVisible\s*\(/);
    const callers = [...new Set(calls.map(h => h.file))];
    check('the support-visibility rule is defined in exactly one place',
      defs.length === 1 && defs[0].file === OWNER,
      defs.length === 1 && defs[0].file === OWNER
        ? `defined in ${OWNER}, asked by ${callers.length} other file(s): ${callers.join(', ') || 'none yet'}`
        : `${defs.length} definition(s): ${report(defs) || 'none'} — WO-1.9 flips one switch, not several`);
  }
}

/* ══════════════════════════ 6. new controls carry 44px ══════════════════════════
   verify-shell.mjs measures this properly, under an emulated coarse pointer, and that measurement
   is the real check. What a grep adds is the diff view: a control added in this working tree whose
   selector never appears in the coarse block. New is a diff concept, so this asks git. */

{
  const cssFiles = STYLE.filter(p => /\.css$/.test(rel(p)));
  const coarseSelectors = new Set();
  let coarseFound = false;
  // Anchored at line start and requiring the opening brace, because src/shell.css's own header
  // comment discusses `@media (pointer: coarse)` in backticks twenty lines in. A loose match finds
  // the prose, tracks braces through a comment, and reports an empty block on a stylesheet with
  // forty rules in it — a green-looking wrong answer, which is the worst kind.
  const OPENS_COARSE = /^@media\s*\(\s*pointer:\s*coarse\s*\)\s*\{/;
  for (const f of cssFiles) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    for (let start = 0; start < lines.length; start++) {
      if (!OPENS_COARSE.test(lines[start])) continue;
      coarseFound = true;
      let depth = 0;
      for (let i = start; i < lines.length; i++) {
        depth += (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
        if (i > start) for (const m of lines[i].matchAll(/(^|,)\s*([.#][\w-]+[^,{]*)/g)) coarseSelectors.add(m[2].trim());
        if (depth <= 0 && i > start) { start = i; break; }
      }
    }
  }
  check('a @media (pointer: coarse) block exists and has selectors', coarseFound && coarseSelectors.size > 0,
    coarseFound ? `${coarseSelectors.size} selector(s) in the coarse block` : 'no @media (pointer: coarse) block found');

  /*
    "New" was `git diff HEAD` alone until WO-1.12, and a diff against HEAD sees NOTHING in a file
    git has never been told about. At WO-1.10 that meant all nine selectors in the brand-new
    src/home.css were invisible here, and this check printed "1 new selector(s), all covered" about
    a selector from shell.css — a true sentence about the wrong file. src/README.md makes one
    stylesheet per screen the convention, so every screen after that one trips it the same way.

    So the two sources are asked separately, because they are two different questions. A TRACKED
    stylesheet's new lines are the `+` side of its diff. An UNTRACKED stylesheet is new in its
    entirety — every selector in it is an added selector — and `git ls-files --others` is what names
    those. Comments are stripped out of the untracked half first: a stylesheet header in this repo
    quotes its own selectors by name (src/home.css does it four times), and a prose mention would
    otherwise arrive here as a selector that does not exist.
  */
  let diff = '';
  let untracked = [];
  let gitAnswered = true;
  try {
    const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' });
    diff = git(['diff', '-U0', 'HEAD', '--', 'src/*.css']);
    untracked = git(['ls-files', '--others', '--exclude-standard', '--', 'src/*.css'])
      .split('\n').map(s => s.trim()).filter(Boolean);
  } catch { gitAnswered = false; }

  const newLines = [];
  let addedLines = 0;
  for (const line of diff.split('\n')) {
    if (!line.startsWith('+') || line.startsWith('+++')) continue;
    newLines.push(line.slice(1));
    addedLines++;
  }
  for (const f of untracked) {
    let text = '';
    try { text = fs.readFileSync(path.join(REPO, f), 'utf8'); } catch { continue; }
    for (const line of text.replace(/\/\*[\s\S]*?\*\//g, '\n').split('\n')) newLines.push(line);
  }
  // A class name cannot start with a digit, and requiring a letter is what keeps `rgba(0,0,0,.5)`
  // out: the comma in a declaration value otherwise reads as the comma in a selector list, and the
  // check REVIEWs a selector called `.5`. A check that cries wolf gets ignored.
  const added = new Set();
  for (const line of newLines) {
    for (const m of line.matchAll(/(^|,)\s*(\.[A-Za-z_-][\w-]*)/g)) added.add(m[2]);
  }
  const missing = [...added].filter(sel => ![...coarseSelectors].some(c => c.includes(sel)));
  // The sources are reported even when the answer is "nothing new", because "this check looked and
  // found nothing" and "this check could not see anything" print identically otherwise — which is
  // exactly how the blind spot above survived a whole work order.
  const looked = `${addedLines} added line(s) in tracked src/*.css, ${untracked.length} untracked stylesheet(s)`;
  if (!gitAnswered) {
    review('CSS selectors added in the working tree with no coarse-block rule',
      'git could not be asked what is new here, so this check saw nothing — which is not the same as nothing being new. Run the 44px pass by hand.');
  } else if (!added.size) {
    check('every control added in the working tree appears in the coarse block', true,
      `no new CSS selectors — ${looked}`);
  } else if (!missing.length) {
    check('every control added in the working tree appears in the coarse block', true,
      `${added.size} new selector(s), all covered — ${looked}`);
  } else {
    review('CSS selectors added in the working tree with no coarse-block rule',
      `${missing.join(', ')} — confirm each is not a touch target, or add the 44px rule in the same pass (${looked})`);
  }
}

/* ══════════════════════════ 7. late and missing are teacher-marked ══════════════════════════
   The grade must never change because a date rolled over. A line that mentions a due date and a
   late/missing flag together is where that rule breaks, so it gets read rather than decided. */

{
  const hits = grepLines(CODE, /\b(due|dueDate|dueAt)\b/i).filter(h => /\b(late|missing)\b/i.test(h.text));
  if (!hits.length) check('late/missing never inferred from a due date', true, 'no line mentions a due date and a late/missing flag together');
  else review('due-date and late/missing on the same line',
    `${report(hits)} — confirm the flag is teacher-marked, never derived from the date`);
}

/* ══════════════════════════ 8. focus outlines survive ══════════════════════════
   Allowlist: a rule that removes the outline and restores it in the same declaration block is the
   documented :focus-visible pattern, so `outline: none` immediately followed by an outline
   declaration is not a hit. Anything else is. */

{
  const hits = grepStyle(STYLE, /outline\s*:\s*(none|0)\b/i, (line) => /outline\s*:\s*(none|0)[^;]*;\s*outline/i.test(line));
  check('no rule removes a focus outline', !hits.length,
    hits.length ? report(hits) : 'no `outline: none` / `outline: 0` in any stylesheet or markup file');
}

/* ══════════════════════════ 9. a SHELL file changed without a CACHE bump ══════════════════════
   sw.js states the rule in its own header: "Add the file to SHELL and bump CACHE in the same commit
   that creates it," because `activate` deletes every cache that is not the current one — the name IS
   the version, and an unchanged name means the installed app keeps the shell it already has.

   Nothing enforced it, and it had already been broken twice when this check was written. WO-2.4 and
   WO-2.13 both changed src/attendance.js and left CACHE at v30, which was set at WO-2.3. Every other
   attendance commit had bumped it, so the habit was real and the two misses were invisible: an
   installed iPad on v30 keeps serving the pre-WO-2.4 module, and what the teacher does not get is
   the counts, the percentage, and the fix — on the one device that matters. Neither run of
   verify-shell.mjs could see it, because the harness fetches over a live network where the newest
   file is always served.

   "Changed" is a diff concept, so this asks git — and it asks it across COMMITS, not just the
   working tree. A working-tree-only check would have gone green on the exact defect that produced
   it, both offences having already been committed. The question is therefore: since the commit that
   introduced the CACHE string now in sw.js, has any file in SHELL changed?

   A CACHE value that appears in no commit at all is a bump sitting uncommitted in the working tree.
   That is the rule being followed, not broken, so it passes — the whole point is to bump before you
   deploy, and the deploy is the commit. */

{
  const swPath = path.join(REPO, 'sw.js');
  if (!fs.existsSync(swPath)) {
    check('every SHELL file change is paired with a CACHE bump', true, 'sw.js does not exist yet');
  } else {
    const swText = fs.readFileSync(swPath, 'utf8');
    const cacheM = /const CACHE\s*=\s*'([^']+)'/.exec(swText);
    // SHELL is read the same way sw.js documents: single-quoted strings out of the array text. The
    // apostrophe warning in sw.js's header is about exactly this parse, so it is honoured, not
    // re-derived — one apostrophe in a comment inside the array pairs with the next and swallows
    // every real entry between them.
    const shellM = /const SHELL\s*=\s*\[([\s\S]*?)\n\];/.exec(swText);
    const shellFiles = new Set();
    if (shellM) {
      for (const m of shellM[1].matchAll(/'([^']+)'/g)) {
        const p = m[1].replace(/^\.\//, '');
        if (p && !p.endsWith('/')) shellFiles.add(p);   // './' is the index, not a file on disk
      }
    }

    if (!cacheM || !shellM || !shellFiles.size) {
      review('every SHELL file change is paired with a CACHE bump',
        `sw.js parsed to ${shellFiles.size} SHELL entr(ies) and ${cacheM ? 'a' : 'no'} CACHE string — read it by hand rather than trusting this check`);
    } else {
      const cache = cacheM[1];
      let gitAnswered = true;
      let introducedAt = '';
      let changed = new Set();
      try {
        const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' });
        // The commit that introduced the CACHE string sw.js carries right now. -S counts
        // occurrences, so this is the commit where this exact version string appeared.
        introducedAt = git(['log', '-1', '--format=%H', '-S', cache, '--', 'sw.js']).trim();
        if (introducedAt) {
          for (const f of git(['diff', '--name-only', `${introducedAt}..HEAD`]).split('\n')) {
            if (f.trim()) changed.add(f.trim());
          }
        }
        // Uncommitted work counts too: a SHELL file edited but not yet committed is still a
        // shell change that owes a bump, and catching it before the commit is the point.
        for (const f of git(['diff', '--name-only', 'HEAD']).split('\n')) if (f.trim()) changed.add(f.trim());
      } catch { gitAnswered = false; }

      const offenders = [...changed].filter(f => shellFiles.has(f)).sort();
      if (!gitAnswered) {
        review('every SHELL file change is paired with a CACHE bump',
          'git could not be asked what has changed, so this check saw nothing — which is not the same as nothing having changed. Confirm the CACHE bump by hand before deploying.');
      } else if (!introducedAt) {
        // Not in history: the bump is in the working tree, ahead of the commit that will carry it.
        check('every SHELL file change is paired with a CACHE bump', true,
          `${cache} is not in any commit yet — the bump is uncommitted, which is the rule being followed`);
      } else if (!offenders.length) {
        check('every SHELL file change is paired with a CACHE bump', true,
          `${cache} was set at ${introducedAt.slice(0, 7)}; no SHELL file has changed since`);
      } else {
        check('every SHELL file change is paired with a CACHE bump', false,
          `${offenders.join(', ')} changed since ${cache} was set at ${introducedAt.slice(0, 7)} — bump CACHE in sw.js, or an installed app keeps the shell it already has`);
      }
    }
  }
}

/* ══════════════════════════ 10. no rounding between a percentage and a letter ══════════════════
   WO-3.2's design, in one sentence: the boundary the teacher types IS the rounding rule, so if 89.5
   should be an A she types 89.5 and there is no second rule to disagree with the SIS about. The
   Traps line forbids the second rule outright — no "round to nearest whole percent" option, ever,
   and no tolerance or epsilon wearing its clothes.

   Nothing enforced it. The acceptance line was settled by hand in the dispatch that built the
   feature, and then `tools/verify-shell.mjs` wrote down that the grep "is made in tools/wo-sweep.mjs"
   — which was not true, and is the reason this section exists. A prohibition whose only guard is a
   comment saying it is guarded is worse than an unguarded one: the next reader stops looking.

   Three clauses, and the split between FAIL and REVIEW is the point.

   (a) THE OPTION SHAPE IS A HARD FAIL, anywhere in the app's code. `roundGrades`, `gradeRounding`,
   `roundToWholePercent` — the identifier is the feature, and there is no version of it that wants a
   human to weigh in. Zero today, and it must stay zero.

   (b) src/letter-scale.js ROUNDS NOTHING, EVEN FOR DISPLAY, which its own header promises: a
   boundary is printed with String() because 89.5 has to read as 89.5. That module owns the mapping,
   so a rounding primitive appearing in it needs no judgment either.

   (c) EVERYWHERE ELSE ON THE PATH IS A REVIEW, not a FAIL. WO-3.4's grade engine imports letterFor()
   and will legitimately want Math.round to draw "87%" — display formatting over a percentage is not
   the banned thing, and a check that failed on it would be turned off within a work order. So any
   rounding primitive in a file that touches the mapping is handed to the verifier by file:line with
   the question already framed: does this round on the way to a letter?

   Comment lines are excluded from all three. The prohibition is *stated* in prose in
   src/letter-scale.js's header — naming toFixed and Math.round to forbid them — and a check that
   reads the rule as the violation is the false FAIL this file's own header warns about twice.

   The four Math.round calls that predate WO-3.2 are allowlisted by name below rather than by
   pattern, because "display formatting over a number that is not a grade" is a judgment somebody
   made once and the names are what record it. A fifth one shows up as a REVIEW. */

{
  // Which lines in a file are comment rather than code. Block state has to be carried line to line,
  // so this cannot be a grepLines predicate — that only ever sees one line. Both comment syntaxes
  // that appear in this repo's code are handled: JS block and line comments, and markup comments.
  // Written with `//` rather than a block, because a block comment that has to *name* the delimiters
  // it is looking for closes itself at the first one it mentions.
  function commentLines(file) {
    const set = new Set();
    let inBlock = false;
    let inMarkup = false;
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      const wasIn = inBlock || inMarkup;
      if (!inBlock && /\/\*/.test(line) && !/\/\*[\s\S]*?\*\//.test(line)) inBlock = true;
      if (!inMarkup && /<!--/.test(line) && !/<!--[\s\S]*?-->/.test(line)) inMarkup = true;
      const opened = !wasIn && (inBlock || inMarkup);
      // A line that opens or closes a block, sits inside one, is a full one-line comment, or is a
      // `//` line — all prose as far as this check is concerned.
      if (wasIn || opened || /^\s*(\/\/|\*|<!--)/.test(line) || /\/\*[\s\S]*?\*\//.test(line)
          || /<!--[\s\S]*?-->/.test(line)) set.add(i + 1);
      if (inBlock && /\*\//.test(line)) inBlock = false;
      if (inMarkup && /-->/.test(line)) inMarkup = false;
    });
    return set;
  }

  const codeOnly = (files, re) => {
    const hits = [];
    for (const f of files) {
      const comments = commentLines(f);
      let text;
      try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
      text.split('\n').forEach((line, i) => {
        re.lastIndex = 0;
        if (re.test(line) && !comments.has(i + 1)) hits.push({ file: rel(f), line: i + 1, text: line.trim() });
      });
    }
    return hits;
  };

  const ROUNDS = /\b(toFixed|toPrecision|Number\.EPSILON|Math\.(?:round|ceil|floor))\b/;

  /* (a) The option that must never exist. Both word orders, because the identifier could be written
     either way round, plus the bare "round to whole/nearest" phrasing. */
  {
    const OPTION = /\b(?:round\w*(?:percent|grade|score|letter|whole|nearest)\w*|(?:percent|grade|score|letter)\w*round(?:ing|ed)?\w*)\b/i;
    const hits = codeOnly(CODE, OPTION);
    check('no round-to-whole-percent option exists', !hits.length,
      hits.length
        ? report(hits) + ' — WO-3.2 Traps: the boundary the teacher types is the rounding rule, and a second one is the thing this design deletes'
        : 'no identifier in the app pairs rounding with a percentage, grade, score or letter');
  }

  /* (b) The module that owns the mapping. Named explicitly rather than found by pattern: if this
     file is ever renamed, the check going quiet is the failure, so it says so out loud. */
  {
    const scale = CODE.filter(p => rel(p) === 'src/letter-scale.js');
    if (!scale.length) {
      review('src/letter-scale.js rounds nothing, even for display',
        'src/letter-scale.js is not where this check expects it — the module that owns the percentage-to-letter mapping moved or was renamed, and this clause is now watching nothing. Point it at the new path.');
    } else {
      const hits = codeOnly(scale, ROUNDS);
      check('src/letter-scale.js rounds nothing, even for display', !hits.length,
        hits.length
          ? report(hits) + ' — letterFor() compares against `min` unmodified and a boundary prints with String(); a formatter here is where a second rule moves in'
          : 'no toFixed, toPrecision, Number.EPSILON or Math.round/ceil/floor outside its prose');
    }
  }

  /* (c) The rest of the path, handed over undecided. */
  {
    // Allowlisted by name, with what each one formats — all four predate WO-3.2, none is a grade.
    const PREDATES = new Set([
      'src/attendance.js',   // the attendance percentage, and a column count, and a UTC offset
      'src/categories.js',   // formatWeight(), and BALANCE_EPSILON over a SUM of decimals
      'src/backup.js',       // a file size in MB, and a backup's age in days
      'src/passes.js',       // elapsed minutes on a hall pass
    ]);
    const TOUCHES_MAPPING = /\b(letterFor|letterScaleOf|scaleForClass|hasOwnScale|bandRanges|scaleFaults)\b/;
    const onPath = CODE.filter((p) => {
      if (rel(p) === 'src/letter-scale.js' || PREDATES.has(rel(p))) return false;
      let text;
      try { text = fs.readFileSync(p, 'utf8'); } catch { return false; }
      return TOUCHES_MAPPING.test(text);
    });
    const hits = codeOnly(onPath, ROUNDS);
    if (!hits.length) {
      check('nothing rounds on the way to a letter', true,
        onPath.length
          ? `${onPath.length} file(s) touch the mapping (${onPath.map(rel).join(', ')}) and none of them round`
          : 'no file outside src/letter-scale.js touches the mapping yet — WO-3.4\'s grade engine will be the first');
    } else {
      review('rounding in a file that touches the percentage-to-letter mapping',
        `${report(hits)} — display formatting over a percentage is allowed; rounding a percentage BEFORE it is banded is not. Read which one this is, and add the file to PREDATES with a note if it is the former.`);
    }
  }
}

/* ────────────────────────────── summary ────────────────────────────── */

const fails = results.filter(r => r.state === 'fail');
const reviews = results.filter(r => r.state === 'review');
console.log('\n================ SUMMARY ================');
console.log(`${results.length} checks · ${results.filter(r => r.state === 'pass').length} passed · ${fails.length} failed · ${reviews.length} to review`);
if (reviews.length) {
  console.log('\nTO REVIEW (greppable evidence, not a verdict):');
  reviews.forEach(r => console.log('  - ' + r.name + '\n      ' + r.detail));
}
if (fails.length) {
  console.log('\nFAILED:');
  fails.forEach(f => console.log('  - ' + f.name + (f.detail ? '\n      ' + f.detail : '')));
}
console.log('\nThis is the grep half of the sweep. `node tools/verify-shell.mjs` is the half that');
console.log('measures, and neither closes a 👤 item — those stay owed to a human on a real iPad.');

process.exit(fails.length ? 1 : 0);
