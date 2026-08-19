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

// The same derivation `wo-gate.mjs` and `codex-invoke.mjs` use, and it is LEFT AS IT IS deliberately
// (WO-2.44). The case-blind compare those two had to fix is a `startsWith` against `REPO`; there is no
// such compare here. Every path below is built from `REPO` by `path.join`, the only thing ever compared
// against it is `path.relative()` — which win32 answers case-insensitively, measured both drive-letter
// orderings — and this file writes nothing anywhere, so there is no guard here to be wrong. The shape
// of that bug is in `tools/README.md`, once, rather than restated in each script that derives a repo
// root.
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

// Which lines in a file are comment rather than code. Block state has to be carried line to line,
// so this cannot be a grepLines predicate — that only ever sees one line. Both comment syntaxes
// that appear in this repo's code are handled: JS block and line comments, and markup comments.
// Written with `//` rather than a block, because a block comment that has to *name* the delimiters
// it is looking for closes itself at the first one it mentions.
//
// It sits up here rather than inside a section because two checks need it — §10's rounding greps,
// which is where it was written, and §11's count of the harness's own `check()` calls. Moved at
// WO-2.19, unchanged; a second copy of block-comment tracking is worse than a shared six lines.
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
  // `commentLines()` moved to the helpers at the head of this file at WO-2.19, unchanged — §11
  // needs the same block-comment tracking and a second copy of it would be the worse answer.
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

/* ══════════════════════════ 11. the harness's own size is written down ══════════════════════════
   `tools/README.md` records how big `verify-shell.mjs` is, and until WO-2.19 that number was
   maintained by whoever landed a work order remembering to update it. It was missed at WO-1.5 (the
   line said 79 against a tree of 82), at WO-2.18 (522 against 535, WO-3.4's thirteen never having
   reached it) and again at WO-3.5, whose seventeen are recorded in `TESTING.md` and not there. A
   number maintained by remembering is not maintained, so this asks a grep instead.

   WHAT IS ASSERTED HERE IS CALL SITES, NOT EXECUTED CHECKS, and the two are permanently unequal.
   `verify-shell.mjs` prints `results.length` — how many times `check()` and `skip()` actually ran —
   and a grep cannot know that. Measured at WO-2.19 by instrumenting a throwaway copy of the harness:
   of 560 call sites a green run fires 532, ten of those fire more than once (one of them ten times,
   inside a loop over viewports), and twenty-eight never fire at all because they are the failure arm
   of a fixture guard. 532 + 22 = 554, and 560 − 554 = 6 is two unrelated corrections cancelling
   rather than six branches somebody could go and name. The full account is in `tools/README.md`
   beside the count. Making the grep agree with the run would mean running the run, and this file
   opens no browser by design (see the header). So the sweep asserts the number it can count,
   `tools/README.md` states which number that is, and the executed count lives beside it as prose. A
   check that compared the two and passed when they were close would restate the problem it was
   written to solve.

   ALLOWLIST, so the next reader does not re-derive it:
   - `tools/verify-shell.mjs:68` is `function check(name, ok, detail)` — the definition, excluded by
     name. It is the only occurrence of `check(` in that file that is not a call.
   - The one `else check(` in the harness — `grep -n 'else check(' tools/verify-shell.mjs`, exactly one
     hit — is the one call site not first on its line. The pattern is therefore NOT line-anchored; it
     matches `check(` anywhere a call could be written. (Cited by line here until WO-2.39 — `:10570`,
     then `:10773` — while the call site went on to `:10838`, `:10941`, and thousands of lines past
     that. The number was illustration rather than something either tool resolves, and it lived in two
     files that had to be corrected in step or read as disagreeing, so neither ever was. Both are
     anchored by the text now.)
   - `.check(` and `recheck(` are excluded by construction — the character before `check` may not be
     a word character or a dot. Neither shape exists in the harness today; the guard is so that one
     arriving does not silently inflate the count.
   - Comment lines are excluded. The harness quotes call names in its prose constantly (`letterFor()`,
     `paintDetail(totals)`), and a comment that came to mention `check()` would otherwise arrive here
     as a call site that does not exist — the false FAIL this file's header warns about twice. Zero
     comment lines match today.
   - THE COUNT IS A COUNT OF LINES, not of occurrences: one entry is pushed per line that holds a
     call, so it equals the count of calls only while no line holds two. That was a premise nowhere
     written down until WO-2.22; the second check in this section now asserts it and names the line if
     it stops being true, because a call appended to a line that already had one would move no number,
     pass here, and leave `tools/README.md` quietly wrong. Counting occurrences instead is the wrong
     fix and was refused: `check(` also appears in trailing comments and in the harness's own quoted
     prose, and `commentLines()` excludes whole comment lines rather than trailing ones, so occurrence
     counting would trade a hypothetical undercount for a plausible overcount and a false FAIL. No
     call-site line in the harness held a second occurrence of any shape when this was written.

   The number is read out of `tools/README.md` by its sentence rather than a marker comment, because
   a marker is a thing to keep in sync with the prose beside it. If that sentence is reworded the
   check goes RED and says so, which is the loud failure; it never goes quiet. */

{
  const harnessPath = path.join(REPO, 'tools', 'verify-shell.mjs');
  const readmePath = path.join(REPO, 'tools', 'README.md');
  if (!fs.existsSync(harnessPath) || !fs.existsSync(readmePath)) {
    // A missing file FAILs. It was a REVIEW until WO-2.22, and this file's header defines REVIEW as
    // "greppable evidence that needs a human decision" — a vanished harness is not a decision anybody
    // is being asked to make, it is the one condition under which every claim this section makes is
    // void. It is also the same shape as the empty-grep failure below, one step further along: a run
    // that exits 0 over a file that is not there reads green from a distance and is not.
    check('the recorded `check()` call-site count matches the harness', false,
      `${!fs.existsSync(harnessPath) ? 'tools/verify-shell.mjs' : 'tools/README.md'} is not where this check expects it — the count is now watching nothing, and so is the one-call-per-line check beside it. Restore the file or point this check at the new path.`);
  } else {
    const comments = commentLines(harnessPath);
    const CALL = /(^|[^A-Za-z0-9_$.])check\s*\(/;
    const DEFINITION = /function\s+check\s*\(/;
    const sites = [];
    fs.readFileSync(harnessPath, 'utf8').split('\n').forEach((line, i) => {
      if (comments.has(i + 1) || DEFINITION.test(line) || !CALL.test(line)) return;
      sites.push({ file: 'tools/verify-shell.mjs', line: i + 1, text: line.trim() });
    });

    // The sentence in tools/README.md that carries the number, and where it sits.
    const RECORDED = /holds (\d+) `check\(\)` call sites/g;
    const readmeLines = fs.readFileSync(readmePath, 'utf8').split('\n');
    const stated = [];
    readmeLines.forEach((line, i) => {
      RECORDED.lastIndex = 0;
      for (const m of line.matchAll(RECORDED)) stated.push({ n: Number(m[1]), at: `tools/README.md:${i + 1}` });
    });

    if (!sites.length) {
      // A pattern that matches nothing reads exactly like a harness with no checks in it. Failing
      // loudly here is the guard against a green run over an empty grep, which is the shape of
      // wrongness this whole section exists to catch in the other file.
      check('the recorded `check()` call-site count matches the harness', false,
        'no `check()` call site found in tools/verify-shell.mjs at all — the pattern in tools/wo-sweep.mjs has stopped matching, which reads green from a distance and is not');
    } else if (stated.length !== 1) {
      check('the recorded `check()` call-site count matches the harness', false,
        stated.length
          ? `tools/README.md states the count ${stated.length} times (${stated.map(s => s.at).join(', ')}) — one sentence holds it, or the sweep cannot say which one it is asserting`
          : 'tools/README.md no longer contains the sentence this check reads (`… holds N `check()` call sites …`) — restore the wording or re-point this check; a reworded sentence must not read as a passing count');
    } else if (stated[0].n !== sites.length) {
      check('the recorded `check()` call-site count matches the harness', false,
        `tools/verify-shell.mjs has ${sites.length} \`check()\` call site(s), ${sites.length > stated[0].n ? 'up' : 'down'} ${Math.abs(sites.length - stated[0].n)} on the ${stated[0].n} recorded at ${stated[0].at} — update that line, and the executed-check count in the paragraph beside it, from a run rather than by arithmetic. Sites run ${sites[0].file}:${sites[0].line}..${sites[sites.length - 1].line}`);
    } else {
      check('the recorded `check()` call-site count matches the harness', true,
        `${sites.length} \`check()\` call site(s) in tools/verify-shell.mjs, matching ${stated[0].at} — call sites, not executed checks; the gap is named there`);
    }

    // The premise the count above rests on, asserted rather than assumed (WO-2.22). The push is one
    // entry per line, so the number is a count of lines; it is a count of calls only while no line
    // holds two. A second call appended to a line that already holds one is the one edit that moves
    // nothing here — see the allowlist above for why this is the clause to make, and why counting
    // occurrences into the number itself is not.
    const OCCURRENCES = /(^|[^A-Za-z0-9_$.])check\s*\(/g;
    const doubled = sites.filter(s => (s.text.match(OCCURRENCES) || []).length > 1);
    check('one `check()` call per line in the harness', !doubled.length,
      doubled.length
        ? `${report(doubled)} hold(s) more than one \`check(\` — the count above pushes one entry per line, so a second call on a line that already has one moves no number and leaves the count in tools/README.md quietly wrong. Put it on its own line. (If the second occurrence is a trailing comment rather than a call, this clause still reads the line as written: move the comment.)`
        : `${sites.length} call-site line(s) in tools/verify-shell.mjs, none holding a second \`check(\` — which is what makes the count above a count of calls`);
  }
}

/* ══════════════════════ 12. every delegated hook is in the inventory ══════════════════════
   `src/shell.js` opens with a list under *"The hooks, all handled by the one listener below"* that
   names every `data-*` attribute the one click listener routes on. It is the first thing a dispatch
   looking for the delegation seam reads, and an inventory is a promise of completeness in a way a
   paragraph is not: a missing row does not read as "this list is partial", it reads as "no such hook
   exists".

   IT HAD BEEN ROTTING ACROSS AT LEAST TWO WORK ORDERS WHEN THIS WAS WRITTEN. Seven hooks were
   delegated and absent — WO-2.9's three (`data-pass-history`, `-history-all`, `-history-student`)
   and four older ones from WO-2.6 (`data-attendance-history`, `data-attendance-record`, and that
   record's print and CSV controls). WO-2.26's verifier found the three because it happened to be
   reading WO-2.9; nobody had ever flagged the other four. Listing them by hand fixes today and
   leaves the mechanism running, which is why WO-2.27's own deliverable says this rule matters more
   than the seven rows.

   THE DIFF RUNS ONE WAY, AND THE OTHER WAY WOULD DESTROY THE LIST. Delegated-and-not-listed is a
   real omission, every time: the hook exists, the listener handles it, and the file's own census
   does not mention it. Listed-and-not-delegated is NOT the mirror of that and is mostly correct
   documentation — it came to twenty-two entries on the day this was written, and the ones that are
   not `closest()` targets are there for good reasons. **That number is a snapshot and not a
   promise**: it moves whenever a row is added, and it moved once before this comment was a day old
   (see the gates below). Recount it, do not trust it:
     · VALUE-CARRYING COMPANIONS read off an element some OTHER hook matched — `data-pass-type`,
       `data-score-student`, `data-term-id`, `data-assignment-id`, `data-accommodation-index`,
       `data-guardian-index`, `data-paste-index`, `data-band-index`, `data-category-id`,
       `data-attendance-date`, `data-attendance-note-date`.
     · FORM AND FIELD HOOKS reached by the `submit` and `input` listeners further down that file,
       through `matches()` or `getAttribute()` rather than `closest()` — `data-year-create`,
       `data-class-create`, `data-class-rename-save`, `data-dayoff-create`, `data-roster-create`.
     · MARKUP THAT IS NOT A CONTROL AT ALL — the empty hosts a module paints into (`data-past-due`,
       `data-accommodation-prompt`), and three GATE attributes the inventory names in prose precisely
       so that the next reader does not confuse a gate with a hook (`data-grades-print`,
       `data-detail-print`, `data-attendance-print`; WO-2.25's scar is written out at that row).
       **The third one is why the count above carries a warning.** `data-attendance-print` entered
       the block inside the prose of the `data-attendance-record-print` row that WO-2.27 itself
       added — the hook ASKS, the gate ANSWERS, and the row says so — so this enumeration was one
       short before the file it describes had been saved twice. Corrected 2026-08-14.
     · AND ONE THAT IS NOT AN ATTRIBUTE AT ALL: `data-model`, which is the scan reading
       `docs/data-model.md` out of a sentence. It is harmless in the direction this rule runs and it
       is the clearest possible demonstration of why the other direction cannot be automated.
   A sweep that asserted both directions and deleted the difference would strip working
   documentation and call it tidying. So this asserts one direction and says so out loud, because a
   rule whose asymmetry is undocumented is the next comment debt.

   WHAT IS SEARCHED, AND THE TWO BOUNDS ON IT:
   - The delegated set is every `data-*` token inside a `closest('…')` selector in `src/shell.js` —
     tokens rather than the first match, so a compound selector (`closest('[data-pill-group] .pill')`
     today, `closest('[data-a][data-b]')` tomorrow) contributes both. `src/shell.js` holds the only
     DELEGATED listener, which is the convention its own header sets — but it is **not** the only
     file calling `closest()` on a `data-` attribute, and the difference is the reason this scan is
     not widened to `src/`. `src/attendance.js:2327` walks to `tr[data-attendance-row]`: an
     intra-module marker the same module painted and reads back, never routed by the one listener
     and correctly absent from the inventory. Widening the scan would make that the rule's first
     false positive, and a rule that cries wolf on correct code is un-run within a month. The bound
     that matters is the other one: if a second file ever grows a DELEGATED listener, this rule will
     not see it — worth knowing rather than worth a clause today.
     *(Corrected 2026-08-14, the sitting after this section landed. It read "the only file in `src/`
     that calls `closest()` on a `data-` attribute", which was wrong when it was written — inside a
     work order about comment debt, in the comment arguing the rule's own scope.)*
   - The inventory side is every `data-*` token ANYWHERE in the block, not just the ones in the
     left-hand column. That is deliberately the permissive read, because it is the reader's: the
     acceptance line this rule stands on says a reader who SEARCHES the list either finds the hook
     or finds a sentence saying the list is partial, and a reader searches with Ctrl-F. A hook
     mentioned only inside another row's paragraph passes here and is a documentation smell rather
     than a broken promise.

   The block is found by the two sentences that open and close it, and a rewording FAILs loudly for
   the reason §11's count does: a check that goes quiet when its anchor moves is worse than no check.
   A run with an empty delegated set FAILs for the same reason — it reads exactly like an app with no
   hooks in it. */

{
  const shellPath = path.join(REPO, 'src', 'shell.js');
  if (!fs.existsSync(shellPath)) {
    check('every delegated hook is in src/shell.js\'s inventory', false,
      'src/shell.js is not where this check expects it — the delegation seam moved, and this rule is now watching nothing. Point it at the new path.');
  } else {
    const lines = fs.readFileSync(shellPath, 'utf8').split('\n');
    const OPENS = /The hooks, all handled by the one listener below/;
    const CLOSES = /Delegation also means markup rendered later/;
    const from = lines.findIndex(l => OPENS.test(l));
    const to = lines.findIndex(l => CLOSES.test(l));

    // Every data-* token inside a closest('…') selector, with the line it was found on, so a FAIL
    // says where to go and not just what is missing.
    const delegated = new Map();
    lines.forEach((line, i) => {
      for (const call of line.matchAll(/closest\(\s*'([^']*)'/g)) {
        for (const m of call[1].matchAll(/data-[a-z0-9-]+/g)) {
          if (!delegated.has(m[0])) delegated.set(m[0], `src/shell.js:${i + 1}`);
        }
      }
    });

    if (from < 0 || to < 0 || to <= from) {
      check('every delegated hook is in src/shell.js\'s inventory', false,
        'the hook inventory in src/shell.js no longer opens with "The hooks, all handled by the one listener below" and close with "Delegation also means markup rendered later" — restore the wording or re-point this check; a reworded header must not read as a passing diff');
    } else if (!delegated.size) {
      check('every delegated hook is in src/shell.js\'s inventory', false,
        'no closest(\'[data-…\') call found in src/shell.js at all — the pattern in tools/wo-sweep.mjs has stopped matching, which reads green from a distance and is not');
    } else {
      const listed = new Set();
      for (let i = from; i < to; i++) {
        for (const m of lines[i].matchAll(/data-[a-z0-9-]+/g)) listed.add(m[0]);
      }
      const missing = [...delegated].filter(([hook]) => !listed.has(hook));
      check('every delegated hook is in src/shell.js\'s inventory',
        !missing.length,
        missing.length
          ? missing.map(([hook, where]) => `${hook} (${where})`).join(', ')
            + ` — delegated by the one listener and absent from the census at src/shell.js:${from + 1}. Add the row, or say in one line that the list is not exhaustive; a list a few rows short is the same false promise. (This diff runs ONE WAY: an entry with no closest() call is not the mirror of this and is usually correct — see the comment at this check.)`
          : `${delegated.size} delegated attribute(s) in the one listener, all of them findable in the ${listed.size}-attribute census at src/shell.js:${from + 1} — the diff run delegated→inventory only, on purpose`);
    }
  }
}

/* ══════════════════════ 13. the update path is pinned in _headers ══════════════════════
   `_headers` is deliberately outside CODE and STYLE: it is an extensionless root file, while both
   gates are load-bearing and intentionally narrow. Read this one file directly instead of widening
   either gate and pulling unrelated root files into every other check.

   Cloudflare Pages syntax is a path on an unindented line with its headers indented below it. Lines
   beginning with `#` are comments, so they are discarded before stanza parsing; a commented-out
   path or Cache-Control line must not satisfy this check. This only proves what the repository asks
   for. Whether the host honours it exists on the wire and belongs to `verify-deploy.mjs`. */

{
  const headersPath = path.join(REPO, '_headers');
  const expected = ['/sw.js', '/index.html', '/'];
  const pinned = new Set();
  if (fs.existsSync(headersPath)) {
    let stanza = '';
    for (const line of fs.readFileSync(headersPath, 'utf8').split('\n')) {
      if (/^\s*#/.test(line) || !line.trim()) continue;
      if (!/^\s/.test(line)) {
        stanza = line.trim();
        continue;
      }
      const header = /^\s+Cache-Control\s*:\s*(.*?)\s*$/i.exec(line);
      if (header && header[1].split(',').some(directive => directive.trim().toLowerCase() === 'no-cache')) pinned.add(stanza);
    }
  }
  const missing = expected.filter(route => !pinned.has(route));
  check('_headers asks for no-cache on /sw.js, /index.html and /', fs.existsSync(headersPath) && !missing.length,
    !fs.existsSync(headersPath)
      ? '_headers is missing — this disk check proves only what the repository asks for; run verify-deploy.mjs to prove the header actually binds on the host'
      : missing.length
        ? `${missing.join(', ')} ${missing.length === 1 ? 'is not pinned' : 'are not pinned'} to no-cache by an active stanza in _headers — this disk check proves only what the repository asks for; run verify-deploy.mjs to prove the header actually binds on the host`
        : 'all three active stanzas ask for no-cache on disk; verify-deploy.mjs is what proves the header actually binds on the host');
}

/* ══════════ 14. every documented collection is classified by the backup nag ══════════
   `hasSomethingToLose()` in `src/backup.js` decides whether the backup nag is allowed to appear, and
   it decides it by enumerating the collections that count as content. That enumeration is the one
   thing standing between a teacher and the iOS eviction in `CLAUDE.md`, and until WO-1.17 it was
   kept in step with `docs/data-model.md` by hand — which is to say it was not kept in step at all.
   WO-2.8 added `openPasses` and `passes` to the document on 2026-08-06 and neither reached the sum;
   `scores` had never been in it. The nag could not see a year whose only content was grades. Nothing
   noticed for six days, and what did notice was a verifier reading the file for another reason.

   SO THE LIST IS RECONCILED AGAINST THE DOCUMENTATION RATHER THAN AGAINST MEMORY, here, in a command
   every dispatch already runs. `src/backup.js` carries two lists — `CONTENT_COLLECTIONS`, each row
   pairing a key with the counter that is right for its shape, and `NOT_CONTENT`, every other
   top-level key with the reason it is not content. Between them they must name exactly the top-level
   keys of the document sketch under `## The document` in `docs/data-model.md`. A collection added
   there and classified in neither list FAILs by name; so does a key classified in both, and so does
   one classified in code that the document does not describe — which is what a typo in a key name
   looks like (`count(doc.scoress)` is 0 forever and throws nothing).

   THE DIFF RUNS BOTH WAYS, unlike § 12's, and the difference is worth stating because that section
   argues the opposite. There, the two sides are a listener and a prose census with twenty-two
   legitimate extra rows. Here both sides are closed sets of the same thing — the top-level keys of
   one document — so an asymmetry would just be a hole, and the direction § 12 has to give up
   (listed-and-not-delegated) is the direction that catches the typo here.

   AND THE COUNTER IS CHECKED AGAINST THE DOCUMENTED SHAPE, which is the same defect's other half.
   `count(doc.scores)` answers 0 for a full gradebook — `scores` is an object keyed by assignment and
   then by student, not an array — so "add `scores` to the sum" looks exactly like the fix and
   changes nothing. The sketch says which shape each key is (`[` or `{`), so this asserts that a
   collection documented as a list uses the list counter and a collection documented as an object
   does NOT: `countScores()` is the one that exists today, and a future map with a different shape
   needs a counter of its own rather than either of them.

   WHAT THIS CANNOT CATCH, said out loud so the next reader does not over-trust it: a wrong DECISION.
   An entry parked in `NOT_CONTENT` with a plausible sentence beside it passes here — the rule forces
   the decision to be made and written down, not to be right. Nor does it see a collection that
   reaches `src/store.js` and never reaches `docs/data-model.md`: that document is the source of
   truth this rule is built on, and a collection missing from it is a different rot with a different
   owner. Worth knowing rather than worth a clause today.

   Both anchors — the `## The document` fence, and the two `const` lines — FAIL loudly when they move
   rather than going quiet, for the reason § 11's count does. */

{
  const modelPath = path.join(REPO, 'docs', 'data-model.md');
  const backupPath = path.join(REPO, 'src', 'backup.js');
  const NAME = 'every collection docs/data-model.md names is classified by hasSomethingToLose()';
  if (!fs.existsSync(modelPath) || !fs.existsSync(backupPath)) {
    check(NAME, false,
      `${!fs.existsSync(modelPath) ? 'docs/data-model.md' : 'src/backup.js'} is not where this check expects it — the nag's collection list is now reconciled against nothing. Restore the file or point this check at the new path.`);
  } else {
    // The document sketch: the first fenced block after `## The document`. Top-level keys are the
    // ones at exactly two spaces of indent — everything inside a class, a student or a score column
    // is deeper — and the first character of the value says which shape the key is.
    const modelLines = fs.readFileSync(modelPath, 'utf8').split('\n');
    const heading = modelLines.findIndex(l => /^##\s+The document\s*$/.test(l));
    const fence = heading < 0 ? -1 : modelLines.findIndex((l, i) => i > heading && /^```/.test(l));
    const close = fence < 0 ? -1 : modelLines.findIndex((l, i) => i > fence && /^```\s*$/.test(l));
    const documented = new Map();
    if (fence >= 0 && close > fence) {
      for (let i = fence + 1; i < close; i++) {
        const m = /^ {2}"([A-Za-z][A-Za-z0-9_]*)":\s*(\S)/.exec(modelLines[i]);
        if (m) documented.set(m[1], m[2] === '[' ? 'list' : m[2] === '{' ? 'map' : 'scalar');
      }
    }

    // The two lists in src/backup.js, by their own `const` lines. The row shape is asserted rather
    // than assumed: a regex that quietly matched nothing would read green from a distance.
    const backupText = fs.readFileSync(backupPath, 'utf8');
    const listAt = (name) => {
      const from = backupText.indexOf(`const ${name} = [`);
      if (from < 0) return null;
      const to = backupText.indexOf('\n];', from);
      return to < 0 ? null : backupText.slice(from, to);
    };
    const contentBlock = listAt('CONTENT_COLLECTIONS');
    const notBlock = listAt('NOT_CONTENT');
    const content = new Map();
    const notContent = new Set();
    if (contentBlock) {
      for (const m of contentBlock.matchAll(/\{\s*key:\s*'([A-Za-z][A-Za-z0-9_]*)',\s*counter:\s*([A-Za-z][A-Za-z0-9_]*)\s*\}/g)) {
        content.set(m[1], m[2]);
      }
    }
    if (notBlock) {
      for (const m of notBlock.matchAll(/\{\s*key:\s*'([A-Za-z][A-Za-z0-9_]*)',\s*why:/g)) notContent.add(m[1]);
    }

    if (!documented.size) {
      check(NAME, false,
        'the document sketch in docs/data-model.md could not be read — this check looks for a fenced block after a `## The document` heading and takes the keys indented by exactly two spaces. Restore that shape or re-point the check; a sketch it cannot parse must not read as a passing diff');
    } else if (!contentBlock || !notBlock || !content.size || !notContent.size) {
      check(NAME, false,
        `src/backup.js no longer carries both lists in the shape this check reads (\`const CONTENT_COLLECTIONS = [\` and \`const NOT_CONTENT = [\`, rows of \`{ key: '…', counter: … }\` and \`{ key: '…', why: … }\`) — found ${content.size} content row(s) and ${notContent.size} exclusion(s). Restore the shape or re-point the check: an enumeration this sweep cannot see is the exact state WO-1.17 exists to end`);
    } else {
      const classified = new Set([...content.keys(), ...notContent]);
      const unclassified = [...documented.keys()].filter(k => !classified.has(k));
      const unknown = [...classified].filter(k => !documented.has(k));
      const both = [...content.keys()].filter(k => notContent.has(k));
      // Only over keys the sketch actually describes: a content row naming a key that is not in the
      // document at all is already reported above, and saying anything about its "shape" here would
      // be describing a shape nobody wrote down.
      const misCounted = [...content].filter(([key, counter]) => {
        const shape = documented.get(key);
        if (!shape) return false;
        if (shape === 'list') return counter !== 'count';
        if (shape === 'map') return counter === 'count';
        return true;      // a scalar is not a collection and cannot be content
      });
      const faults = [];
      if (unclassified.length) faults.push(`${unclassified.join(', ')} — documented in docs/data-model.md and in neither list in src/backup.js. Add it to CONTENT_COLLECTIONS with the counter its shape needs, or to NOT_CONTENT with the reason it is not something a teacher would miss; the nag is silent about it until you do`);
      if (unknown.length) faults.push(`${unknown.join(', ')} — classified in src/backup.js and not a top-level key of the sketch in docs/data-model.md. Either the document grew a collection nobody wrote down, or this is a misspelled key, which counts 0 forever and throws nothing`);
      if (both.length) faults.push(`${both.join(', ')} — in CONTENT_COLLECTIONS and NOT_CONTENT at once; one of the two is a decision somebody made twice`);
      if (misCounted.length) faults.push(misCounted.map(([key, counter]) => `${key} is documented as ${documented.get(key) === 'map' ? 'an object' : documented.get(key) === 'list' ? 'a list' : 'a scalar'} and paired with ${counter}()`).join('; ')
        + ' — count() answers 0 for anything that is not an array, so a map counted with it reads as an empty year (see countScores() in src/backup.js); a scalar is not a collection at all');
      check(NAME, !faults.length,
        faults.length ? faults.join(' · ')
          : `${documented.size} top-level key(s) in docs/data-model.md § The document, all of them classified in src/backup.js — ${content.size} counted as content (${[...content].map(([k, c]) => k + ' by ' + c + '()').join(', ')}) and ${notContent.size} excluded with a reason`);
    }
  }
}

/* ══════ 15. the repo-write guard: who is on the list, and does the fold still hold ══════
   `tools/wo-gate.mjs` and `tools/codex-invoke.mjs` each carry an `assertOutsideRepo()` that refuses
   any path inside the repository. `wo-gate.mjs --self-check` sends every plant path AND the sandbox
   holding them through it; the plants are deliberately corrupted tracker files, and the `finally`
   that deletes the sandbox would be deleting live `plans/` if one ever escaped. `codex-invoke.mjs`
   sends its own fixture through its copy.

   TWO CLAIMS, IN ONE SECTION AND IN THIS ORDER. The census below asks who belongs in `COPIES` at
   all; the per-file loop under it asks whether each declared copy still folds. The census runs
   first and hands the loop the files it has already read, because the loop's thoroughness is worth
   exactly as much as the list is complete. It lives HERE rather than in a section of its own so
   that an edit to `COPIES` has a reason to read the thing policing `COPIES` — a § 16 that existed
   only to watch this array would separate the assertion from the thing asserted (WO-2.48).

   NOTHING ASSERTED THE LIST WAS COMPLETE UNTIL WO-2.48. It was complete by observation and not by
   construction: the guard was declared exactly twice repo-wide, in exactly the two scripts that
   build a sandbox out of `os.tmpdir()`. Two facts that agreed, with no check standing behind
   either. The failure has a shape, and the pattern is two-for-two: a third script under `tools/`
   grows a sandbox — every script that has needed one has needed the guard — and its author copies
   the guard, correctly, because these copies are copied on purpose. The new copy joins a set this
   section does not read. It is watched by nothing while the loop below goes on reporting green
   about the two files it was told about, which is the silence WO-2.47 closed one level down. A
   list is prose with brackets around it.

   THE DIFF RUNS BOTH WAYS, as § 14's does and for § 14's reason: both sides are closed sets of the
   same thing. Derived-and-undeclared is the third copy nobody watched. Declared-and-underived is
   not symmetry for its own sake — the cheapest way to silence a red run here is to delete a file
   from `COPIES`, which turns the check green while removing the coverage, and a declared entry the
   scan can no longer find is also what a rename looks like. Each direction says which way it went.

   TWO SIGNALS, UNIONED, BECAUSE EITHER ALONE MISSES THE CASE THAT MATTERS. A top-level
   `function assertOutsideRepo(` finds a third COPY of the guard. A temp-dir sandbox — `mkdtemp` in
   either flavour, or a `mkdirSync` in a file that also reaches for `tmpdir()` — finds a third
   script that sandboxes and FORGOT the guard, which is the dangerous direction and the one a scan
   for the guard's own name is blind to by construction. A file matching either signal and named by
   neither list below is a fault.

   TWO LISTS, BECAUSE THE SANDBOX SIGNAL HAS A TRUE POSITIVE THAT IS NOT A DEFECT. `COPIES` is the
   guarded set, and `EXEMPT` is the set this section deliberately does not watch, each entry
   carrying its reason in the file rather than in a work order nobody re-reads. An exemption with a
   sentence attached is a decision; a file silently missing from an array is the thing this census
   exists to end. So a file in NEITHER list FAILs, which is what makes adding a fourth script a
   deliberate act.

   AND `verify-shell.mjs` IS EXEMPT RATHER THAN GUARDED, WHICH WAS RULED ON DIRECTLY (WO-2.48). It
   is a real hit on the second signal: it builds a browser profile directory out of `os.tmpdir()`
   and recursively force-deletes it at the bottom of the run, with no guard anywhere near it. The
   blast radius is genuinely smaller and that is the whole of the argument — `mkdtemp()` creates a
   FRESH UNIQUE directory and the only removal in the script targets that same directory, so the
   worst case is a stray folder appearing and then being deleted again, where `wo-gate --self-check`
   would be deleting a sandbox holding copies of the live trackers. The temptation on the day this
   landed was to make the derived set and the guarded set agree by guarding the harness; a row that
   builds an alarm does not also do what the alarm asks. If that removal is ever pointed at a path
   the harness did not itself create, the exemption is void — and the reason string is where a
   reader will look.

   WHAT THE DERIVED SCAN STILL CANNOT SEE, said plainly, because a reader who takes it for a proof
   of completeness has been misled by a check that exists because somebody took a list for one. It
   narrows the unwatched set; it does not close it. A guard under a different name is invisible to
   the first signal. A sandbox spelled some third way is invisible to the second — a `mkdir()` under
   a path read out of `process.env.TMP`, a shell-out to `mktemp`, a directory named from a constant.
   Comment lines are dropped before either pattern runs, for § 11's reason (this section names both
   patterns in its own prose, and a scan that read prose would report this very file as the third
   copy on the day it landed), so a sandbox inside a commented-out block is not seen either. Nothing
   outside the top level of `tools/` is scanned at all: `src/` touches no filesystem, and widening
   buys nothing while giving the check a way to be wrong. And a script that writes into the
   repository ON PURPOSE and correctly — `make-cert.mjs` into `certs/`, `make-icons.mjs` into
   `icons/` — is not the subject here and never appears. As in § 14, what this forces is that the
   decision be made and written down, not that it be right: an entry parked in `EXEMPT` with a
   plausible sentence beside it passes.

   THE COMPARE IS CASE-FOLDED ON WIN32, AND THAT IS THE PART THAT ROTS. `REPO` comes from
   `import.meta.url` and the sandbox from `os.tmpdir()`, and on Windows the two disagree about the case
   of the drive letter — `c:\dev\planbook` against `C:\dev\planbook\…` — so an unfolded `startsWith`
   answers false for a path plainly inside the repository. WO-2.40's first cut ran all seventeen plants
   inside `C:\dev\planbook\.guard-probe\…` and printed `PASS | 17 of 17`; WO-2.44 fixed the second copy.
   The shape of that bug is written out once, in `tools/README.md` § the `--self-check` paragraph.

   WHY THIS IS A SWEEP CHECK AND NOT A BEHAVIOURAL ONE. The two copies are DUPLICATED ON PURPOSE — no
   script in `tools/` imports another, which is the suite's no-dependencies rule reaching into its own
   toolchain — so "both copies still fold" is a claim neither file can make about the other, and there
   is nowhere else for it to live. `wo-gate.mjs` does check its own copy behaviourally, at the
   precondition in `selfCheck()` (WO-2.47); `codex-invoke.mjs`'s copy is checked by nothing at all
   except this.

   WHAT THIS CANNOT SEE, said plainly so the next reader does not take it for behavioural coverage of a
   file nothing behaviourally covers: **a textual check guards against DELETION, not against subtle
   breakage.** A fold applied to the wrong variable, a `startsWith` that lost its `path.sep`, an
   `endsWith` typo, a helper that lowercases and then compares against something else — all of them keep
   every token below and pass here. What it catches is the fold being taken back out, which is the
   regression that has actually happened, twice, in this repository. The behavioural half of the claim
   for `wo-gate.mjs` is its own precondition; for `codex-invoke.mjs` there is none, and that is a known
   gap rather than an oversight (WO-2.47 put an end-to-end subprocess probe out of scope: on regression
   it performs the escape it is testing for).

   FAIL, NEVER REVIEW, INCLUDING WHEN EITHER SCAN MATCHES NOTHING. A missing file, a missing function,
   or a pattern that has stopped matching all read green from a distance if they are allowed to pass
   quietly — the same rule §11 and §12 apply, and the same reason. Zero files carrying either signal
   means the census broke, not that the repository got safer. */

{
  const CENSUS = 'every tools/*.mjs carrying the guard or a temp-dir sandbox is on a written list';
  const NAME = 'both copies of assertOutsideRepo() still case-fold on win32';
  const COPIES = ['tools/wo-gate.mjs', 'tools/codex-invoke.mjs'];
  // The exemptions. The reason IS the decision — a reader weighs it, and calls it void when it stops
  // being true — so it is written here rather than left to be re-derived from the file it describes.
  // Pointed at by its own words and not by a line number, per tools/README.md § pointers.
  const EXEMPT = [
    { file: 'tools/verify-shell.mjs',
      why: 'its sandbox is the browser profile directory `udd`, made by one `mkdtemp()` above the launch — a fresh unique path — and the only removal in the script is the `fs.rm(udd, { recursive: true, force: true })` on its last line, of that same directory. The worst it can do is leave a stray folder behind; it can never delete something that existed first, which is why WO-2.48 named it here instead of guarding it. Void the moment that removal is pointed at a path the harness did not itself create' },
  ];
  const faults = [];
  const proof = [];

  /* The census: every tools/*.mjs, and which of the two signals it carries. Comment lines go first —
     see the note above about this file reporting itself — and the guard pattern stays ANCHORED at
     column zero, which is the other half of the same protection: the regex literal below is itself a
     line of this file carrying the guard's name. Prove that by running the sweep, not by reading it. */
  const scanned = new Map();
  for (const name of fs.readdirSync(path.join(REPO, 'tools')).sort()) {
    if (!/\.mjs$/i.test(name)) continue;
    const file = path.join(REPO, 'tools', name);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const prose = commentLines(file);
    const firstCodeLine = (re) => {
      for (let i = 0; i < lines.length; i++) {
        if (prose.has(i + 1)) continue;
        re.lastIndex = 0;
        if (re.test(lines[i])) return i + 1;
      }
      return 0;
    };
    const guard = firstCodeLine(/^function\s+assertOutsideRepo\s*\(/);
    // `mkdtemp` in either flavour is a sandbox on its own. A bare `mkdirSync` is not — every script
    // that writes an output file makes a directory — so it counts only in a file that also reaches
    // for `tmpdir()`, which is the conjunction that makes the second signal worth having.
    const mkdtempAt = firstCodeLine(/\bmkdtemp(Sync)?\s*\(/);
    const mkdirAt = firstCodeLine(/\bmkdirSync\s*\(/);
    const sandbox = mkdtempAt || (mkdirAt && firstCodeLine(/\btmpdir\s*\(/) ? mkdirAt : 0);
    scanned.set('tools/' + name, { lines, guard, sandbox });
  }

  const declared = new Map([...COPIES.map(f => [f, 'declared in COPIES']),
    ...EXEMPT.map(e => [e.file, 'declared in EXEMPT'])]);
  const signalled = [...scanned].filter(([, s]) => s.guard || s.sandbox);
  const where = ([f, s]) => `${f} (${[s.guard ? `guard at :${s.guard}` : null, s.sandbox ? `temp-dir sandbox at :${s.sandbox}` : null].filter(Boolean).join(', ')})`;
  const censusFaults = [];

  if (!signalled.length) {
    censusFaults.push(`neither signal matched anything in ${scanned.size} tools/*.mjs — no top-level \`function assertOutsideRepo(\` and no temp-dir sandbox anywhere. The guard is declared twice and the sandboxes exist, so zero hits means the patterns in tools/wo-sweep.mjs § 15 have stopped matching, not that the toolchain stopped writing outside the repository. That reads green from a distance and is not`);
  } else {
    const unclassified = signalled.filter(([f]) => !declared.has(f));
    const unfound = [...declared.keys()].filter(f => !(scanned.get(f) && (scanned.get(f).guard || scanned.get(f).sandbox)));
    if (unclassified.length) {
      censusFaults.push(`${unclassified.map(where).join(', ')} — found by this scan and named by neither COPIES nor EXEMPT in tools/wo-sweep.mjs § 15, so nothing below reads it and nothing anywhere checks it. Add it to COPIES if it carries the guard and the loop below will assert the fold; add it to EXEMPT, with the reason its blast radius is bounded, if it does not need one. An exemption with a sentence attached is a decision — an omission is the silence this census exists to end`);
    }
    if (unfound.length) {
      censusFaults.push(`${unfound.map(f => `${f} (${declared.get(f)})`).join(', ')} — ${unfound.length === 1 ? 'carries' : 'carry'} neither signal now: no top-level \`function assertOutsideRepo(\` and no temp-dir sandbox. Either the file moved or was renamed, or the guard and the sandbox it was listed for are gone. Deleting the entry is the cheap way to make this green and it removes the coverage; re-point it, or say in the same edit what became of the thing it was watching`);
    }
  }

  check(CENSUS, !censusFaults.length,
    censusFaults.length
      ? censusFaults.join(' · ')
      : `${signalled.filter(([f]) => COPIES.includes(f)).map(where).join(', ')} — declared in COPIES and checked below. `
        + (EXEMPT.length ? EXEMPT.map(e => `${e.file} is EXEMPT: ${e.why}`).join(' · ') : 'Nothing is exempt')
        + `. ${scanned.size} tools/*.mjs scanned; no other file carries either signal. This narrows the unwatched set rather than closing it — a guard under another name, or a sandbox spelled some third way, is invisible here (see the comment at this check)`);

  for (const relPath of COPIES) {
    const seen = scanned.get(relPath);
    const file = path.join(REPO, ...relPath.split('/'));
    if (!seen && !fs.existsSync(file)) {
      faults.push(`${relPath} is not where this check expects it — the guard it carries is now watched by nothing. Restore the file or point this check at the new path; a copy this sweep cannot read must not read as a passing fold`);
      continue;
    }

    // The function, by its own name, down to the first unindented `}`. Both copies are top-level
    // declarations; a nested or re-spelled one FAILs here rather than going quiet. The lines come
    // from the census above wherever it has them, so the two claims in this section read one file.
    const lines = seen ? seen.lines : fs.readFileSync(file, 'utf8').split('\n');
    const from = lines.findIndex(l => /^function\s+assertOutsideRepo\s*\(/.test(l));
    if (from < 0) {
      faults.push(`${relPath} has no top-level \`function assertOutsideRepo(\` — the guard has been renamed, moved or removed, and this check has stopped matching anything in it`);
      continue;
    }
    let to = lines.findIndex((l, i) => i > from && /^\}/.test(l));
    if (to < 0) to = lines.length;
    const body = lines.slice(from, to + 1).join('\n');
    const param = (/^function\s+assertOutsideRepo\s*\(\s*([A-Za-z_$][\w$]*)\s*\)/.exec(lines[from]) || [])[1];

    // The fold itself: a helper whose body branches on win32 and lowercases. The two copies spell it
    // differently on purpose (`fold` here, `norm` there — wo-gate.mjs's comment says why), so the
    // name is captured rather than assumed.
    const DECL = /const\s+([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>[^;]*'win32'[^;]*\.toLowerCase\(\)/;
    const decl = DECL.exec(body);
    if (!decl) {
      faults.push(`${relPath}:${from + 1} — \`assertOutsideRepo()\` no longer declares a helper that branches on \`'win32'\` and calls \`.toLowerCase()\`. That is the fold, and without it the guard compares \`c:\\dev\\planbook\` against \`C:\\dev\\planbook\\…\` and reports that a path inside the repository is outside it (WO-2.40, WO-2.44)`);
      continue;
    }
    const fold = decl[1];
    const applied = (body.match(new RegExp(`(^|[^A-Za-z0-9_$.])${fold}\\s*\\(`, 'g')) || []).length;
    const onRepo = new RegExp(`${fold}\\s*\\(\\s*REPO\\s*\\)`).test(body);
    const onArg = param && new RegExp(`${fold}\\s*\\(\\s*${param}\\s*\\)`).test(body);
    if (!onRepo || !onArg) {
      // Both sides, because folding one of them is the same defect wearing the fix's clothes: the
      // premise WO-2.44 shipped on held that win32 gives a lowercase drive letter, and it gives
      // whatever case launched node, so a compare with one side folded is right or wrong by accident
      // of invocation.
      faults.push(`${relPath}:${from + 1} — \`${fold}()\` is declared but applied to ${applied} path(s), and the compare must fold BOTH sides: ${onArg ? '' : `\`${fold}(${param})\` is missing; `}${onRepo ? '' : `\`${fold}(REPO)\` is missing`}. \`import.meta.url\` yields whatever case launched node, so folding one side leaves the guard correct only by coincidence of spelling`);
      continue;
    }
    proof.push(`${relPath}:${from + 1} folds with ${fold}() on both sides`);
  }

  check(NAME, !faults.length,
    faults.length
      ? faults.join(' · ')
      : `${proof.join(', ')} — duplicated on purpose, so this is the only place the claim can be made about both. Textual: it catches the fold being DELETED, not a fold applied wrongly (see the comment at this check)`);
}

/* ══════ 16. the documented event record IS the record newEvent() writes ══════
   WO-6.1's fifth acceptance line: `docs/data-model.md` § Events names the lead-time field and the
   series identifier, "and the record it documents is field-for-field the record `newEvent()`
   writes." That is a reconciliation between a table and an object literal, which is § 14's shape
   one level down — and it gets a check for § 14's reason. The pair was in step on the day it was
   written, by hand, with nothing standing behind it; a tenth field added to `newEvent()` and not to
   the table is invisible to every other check in this repo and to `verify-shell.mjs`, which reads
   the app against itself.

   THE FAILURE IT IS FOR IS NOT A TYPO. It is a later work order adding a field — WO-6.2's derived
   events, WO-6.3's grid, anything that wants one more thing on an entry — and documenting it in
   prose beside the table rather than in it, or in the table and not in the code. Either way the two
   halves of the schema disagree and the one somebody reads is the wrong one, which is the same
   sentence this repository writes about a second source of truth everywhere else.

   THE HARNESS MAKES THE OTHER HALF OF THE SAME CLAIM and the two are not redundant.
   `verify-shell.mjs` asks the running app what `newEvent()` returned and compares it against nine
   names typed into the harness; this compares those nine names against the DOCUMENT. Neither one
   alone catches a field renamed in both the code and the harness, and together they do.

   Both anchors FAIL loudly when they move rather than going quiet, for the reason § 11's count
   does: the table is found by the heading `### The record, field for field` and the literal by
   `export function newEvent(`. A rewording is a red run and a sentence saying which anchor moved. */

{
  const NAME = 'docs/data-model.md § Events documents the record newEvent() actually writes';
  const modelPath = path.join(REPO, 'docs', 'data-model.md');
  const calPath = path.join(REPO, 'src', 'calendar.js');
  if (!fs.existsSync(modelPath) || !fs.existsSync(calPath)) {
    check(NAME, false,
      `${!fs.existsSync(modelPath) ? 'docs/data-model.md' : 'src/calendar.js'} is not where this check expects it — the event record is now reconciled against nothing. Restore the file or point this check at the new path.`);
  } else {
    // The table: every row under `### The record, field for field`, up to the next `###`. A row is
    // `| \`field\` | … |`, so the field name is the first backticked token on the line.
    const modelLines = fs.readFileSync(modelPath, 'utf8').split('\n');
    const from = modelLines.findIndex(l => /^###\s+The record, field for field\s*$/.test(l));
    const to = from < 0 ? -1 : modelLines.findIndex((l, i) => i > from && /^###\s/.test(l));
    const documented = [];
    if (from >= 0) {
      for (let i = from + 1; i < (to < 0 ? modelLines.length : to); i++) {
        const m = /^\|\s*`([A-Za-z][A-Za-z0-9_]*)`\s*\|/.exec(modelLines[i]);
        if (m) documented.push(m[1]);
      }
    }

    // The literal: the keys assigned inside `newEvent()`'s returned object, in source order, down
    // to the first unindented `}`. Keys at exactly four spaces of indent are the record's own —
    // anything deeper belongs to a nested value, and there is none today.
    const calLines = fs.readFileSync(calPath, 'utf8').split('\n');
    const fnAt = calLines.findIndex(l => /^export function newEvent\s*\(/.test(l));
    let fnEnd = fnAt < 0 ? -1 : calLines.findIndex((l, i) => i > fnAt && /^\}/.test(l));
    if (fnEnd < 0) fnEnd = calLines.length;
    const written = [];
    if (fnAt >= 0) {
      for (let i = fnAt; i < fnEnd; i++) {
        const m = /^ {4}([A-Za-z][A-Za-z0-9_]*):/.exec(calLines[i]);
        if (m) written.push(m[1]);
      }
    }

    // And the two fields the acceptance line names by name. `seriesId` has to be in the record
    // above; the lead time is deliberately NOT — it is a document-level setting — so it is asserted
    // as being NAMED in the section rather than as being a row of the table.
    const section = (() => {
      const at = modelLines.findIndex(l => /^##\s+Events: only what can't be derived\s*$/.test(l));
      if (at < 0) return '';
      const end = modelLines.findIndex((l, i) => i > at && /^##\s/.test(l));
      return modelLines.slice(at, end < 0 ? modelLines.length : end).join('\n');
    })();

    const faults = [];
    if (from < 0) faults.push('docs/data-model.md has no `### The record, field for field` heading — the table this check reads is gone or renamed, and a section it cannot parse must not read as a passing diff');
    if (fnAt < 0) faults.push('src/calendar.js has no top-level `export function newEvent(` — the builder moved or was renamed, and this check is now watching nothing');
    if (from >= 0 && !documented.length) faults.push('the record table under `### The record, field for field` parsed to zero rows — a row is `| `field` | … |`, and a table this check cannot read is the same green-from-a-distance failure § 11 guards against');
    if (fnAt >= 0 && !written.length) faults.push('`newEvent()` parsed to zero written fields — the returned object literal is not in the shape this check reads (keys at four spaces of indent)');
    if (documented.length && written.length && documented.join(',') !== written.join(',')) {
      const missing = written.filter(k => documented.indexOf(k) < 0);
      const extra = documented.filter(k => written.indexOf(k) < 0);
      faults.push(`the table says [${documented.join(', ')}] and newEvent() writes [${written.join(', ')}]`
        + (missing.length ? ` — ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} written and not documented` : '')
        + (extra.length ? ` — ${extra.join(', ')} ${extra.length === 1 ? 'is' : 'are'} documented and not written` : '')
        + (!missing.length && !extra.length ? ' — the same nine in a different ORDER, which is still a table a reader compares against the code line by line' : ''));
    }
    if (!section) faults.push('docs/data-model.md has no `## Events: only what can\'t be derived` section — the two fields WO-6.1 added are now named nowhere this check can see');
    else {
      if (section.indexOf('gradesDueLeadDays') < 0) faults.push('§ Events does not name `gradesDueLeadDays` — the grades-due lead time is a stored setting and the acceptance line asks for it by name');
      if (section.indexOf('seriesId') < 0) faults.push('§ Events does not name `seriesId` — the series identifier is what makes deleting a materialized repeat possible, and it is undocumented');
    }

    check(NAME, !faults.length,
      faults.length ? faults.join(' · ')
        : `${documented.length} documented field(s) — ${documented.join(', ')} — matching newEvent() at src/calendar.js:${fnAt + 1} name for name and in order, with gradesDueLeadDays and seriesId both named in § Events`);
  }
}

/* ══════ 17. the derived half of the calendar has no writer, and no neighbour in the record ══════
   WO-6.2's whole premise: "Everything on this calendar that the teacher did not type is already in
   the document, and copying any of it into `events[]` would create the second truth the phase
   header forbids. This work order is the read side: one answer per row of the table below, and no
   writer."

   `verify-shell.mjs` makes the RUNTIME half of that claim — it seeds a month, pages a month each
   way and re-reads `doc.events` by id. This makes the STRUCTURAL half, and the two are not
   redundant: the harness proves that today's code paths wrote nothing on today's fixture, and this
   proves there is nothing in the file that COULD write, on any input, including the ones nobody
   thought to seed. A cache added later "just for the month being drawn" is exactly the change that
   passes a fixture and fails the premise.

   THE SECOND CLAIM IS THE ONE THAT MATTERS MOST. `reviewDate` shares a student record with
   `medical`, `behaviorPlan`, `plan`, `caseManager` and the accommodations list (src/roster.js's
   SUPPORT_FIELDS), and the acceptance line is that a review reaches the calendar "as a date and a
   student and nothing else". So the record `reviewDatesIn()` builds is read out of the file and its
   field names are compared against the six, and the body of that function is searched for the names
   of the neighbours. The harness asserts the same six against six names typed into the harness;
   neither one alone catches a field renamed in both the code and the harness, and together they do
   — § 16's argument, applied to the record in this phase with the most to lose.

   Both anchors FAIL loudly when they move rather than going quiet, for the reason § 11's count
   does: the file is found by path and the record by `export function reviewDatesIn(`. */

{
  const NAME = 'src/calendar-derived.js reads and never writes, and a review carries no neighbour';
  const derivedPath = path.join(REPO, 'src', 'calendar-derived.js');
  if (!fs.existsSync(derivedPath)) {
    check(NAME, false,
      'src/calendar-derived.js is not where this check expects it — WO-6.2\'s read side is now watched by nothing, and neither is the shape of the review record. Restore the file or point this check at the new path.');
  } else {
    const lines = fs.readFileSync(derivedPath, 'utf8').split('\n');
    const comments = commentLines(derivedPath);
    const code = lines.map((l, i) => (comments.has(i + 1) ? '' : l));

    // Every way this module could reach a write. The store's own door, the four functions in
    // src/calendar.js that change `doc.events`, the two builders that would only exist here in
    // order to store what they built, the two preference writers, and supportsOf() — which repairs
    // a student's support block IN PLACE and so is a write wearing a read's name.
    const WRITERS = /\b(update|addEvent|updateEvent|removeEvent|removeSeries|newEvent|newSeries|setLeadDays|setMark|setPref|setPresentationMode|supportsOf)\s*\(/;
    // And the shapes a direct mutation of the document takes, on either of the two names this
    // repository gives it.
    const MUTATES = /\b(doc|d)\.[A-Za-z_$][\w$]*\s*(=[^=]|\.(push|pop|shift|unshift|splice|sort|reverse|fill)\s*\()/;
    const writes = [];
    code.forEach((line, i) => {
      if (WRITERS.test(line) || MUTATES.test(line)) {
        writes.push({ file: 'src/calendar-derived.js', line: i + 1, text: line.trim() });
      }
    });

    // The guard against a vacuous pass: an emptied file has no writers in it either. The module has
    // to still be the module — importing the readers it declares, and exporting the five answers.
    const text = code.join('\n');
    const READS = ['./calendar.js', './attendance.js', './classes.js', './roster.js',
      './supports.js'];
    const ANSWERS = ['assignmentDuesIn', 'termEdgesIn', 'meetingStatesIn', 'reviewDatesIn',
      'derivedItemsIn'];
    const missingReads = READS.filter(m => text.indexOf(`from '${m}'`) < 0);
    const missingAnswers = ANSWERS.filter(f => text.indexOf(`export function ${f}(`) < 0);

    // The review record, field for field, read out of the object literal reviewDatesIn() pushes.
    // Keys at six spaces of indent are the record's own; there is nothing nested in it, which is
    // the point of the record.
    const RECORD = ['derived', 'kind', 'classId', 'date', 'studentId', 'name'];
    const fnAt = lines.findIndex(l => /^export function reviewDatesIn\s*\(/.test(l));
    let fnEnd = fnAt < 0 ? -1 : lines.findIndex((l, i) => i > fnAt && /^\}/.test(l));
    if (fnEnd < 0) fnEnd = lines.length;
    const built = [];
    for (let i = fnAt; i >= 0 && i < fnEnd; i++) {
      if (comments.has(i + 1)) continue;
      const m = /^ {6}([A-Za-z][A-Za-z0-9_]*):/.exec(lines[i]);
      if (m) built.push(m[1]);
    }
    // And the neighbours, searched for in that function's own code. `readSupports` survives it on
    // purpose — the capital S is not the field name, and it is the sanctioned reader.
    const NEIGHBOURS = /\b(plan|medical|behaviou?rPlan|accommodations?|caseManager|supports)\b/;
    const near = [];
    for (let i = fnAt; i >= 0 && i < fnEnd; i++) {
      if (comments.has(i + 1)) continue;
      if (NEIGHBOURS.test(lines[i])) near.push({ file: 'src/calendar-derived.js', line: i + 1 });
    }

    const faults = [];
    if (writes.length) faults.push(`${report(writes)} can write — the read side of the calendar reaches a document mutation or a store call, which is the second truth this work order exists not to create`);
    if (missingReads.length) faults.push(`src/calendar-derived.js no longer imports ${missingReads.join(', ')} — the module this check is about has changed shape, and a file that reads nothing has no writers in it either, which reads green from a distance`);
    if (missingAnswers.length) faults.push(`src/calendar-derived.js exports no ${missingAnswers.join(', no ')} — the four rows of the Deliverables table and the call that returns them are what this file is, and their absence must not read as a passing no-writer check`);
    if (fnAt < 0) faults.push('src/calendar-derived.js has no top-level `export function reviewDatesIn(` — the record this check reconciles is gone or renamed, and the six-field claim is now asserted only by the harness against six names typed into the harness');
    else if (!built.length) faults.push('`reviewDatesIn()` builds no record this check can read — the returned object literal is not in the shape this check parses (keys at six spaces of indent), and a function it cannot read must not read as a passing diff');
    else if (built.join(',') !== RECORD.join(',')) {
      const extra = built.filter(k => RECORD.indexOf(k) < 0);
      faults.push(`the review record is [${built.join(', ')}] and a date and a student is [${RECORD.join(', ')}]`
        + (extra.length ? ` — ${extra.join(', ')} ${extra.length === 1 ? 'is' : 'are'} on a record that is allowed a date and a student and nothing else` : ' — the same six in a different ORDER, which is still a record a reader compares against the acceptance line field by field'));
    }
    if (near.length) faults.push(`${report(near)} names a support field other than reviewDate inside reviewDatesIn() — plan, medical, behavior-plan, accommodation and case-manager data may not be within reach of the record that goes on the calendar`);

    check(NAME, !faults.length,
      faults.length ? faults.join(' · ')
        : `no store call, no doc mutation and none of ${'update/addEvent/updateEvent/removeEvent/removeSeries/newEvent/newSeries/setLeadDays/setMark/setPref/setPresentationMode/supportsOf'} in ${code.filter(Boolean).length} line(s) of code; the five answers are exported over five read-only imports, and reviewDatesIn() at src/calendar-derived.js:${fnAt + 1} builds exactly [${built.join(', ')}] with no other support field inside it`);
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
