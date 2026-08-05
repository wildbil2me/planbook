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

    // Raw localStorage access outside prefs.js bypasses the enforcement entirely.
    const raw = grepLines(CODE.filter(f => rel(f) !== 'src/prefs.js'), /localStorage\s*\./);
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

  let diff = '';
  try { diff = execFileSync('git', ['diff', '-U0', 'HEAD', '--', 'src/*.css'], { cwd: REPO, encoding: 'utf8' }); } catch {}
  const added = new Set();
  for (const line of diff.split('\n')) {
    if (!line.startsWith('+') || line.startsWith('+++')) continue;
    for (const m of line.slice(1).matchAll(/(^|,)\s*(\.[\w-]+)/g)) added.add(m[2]);
  }
  const missing = [...added].filter(sel => ![...coarseSelectors].some(c => c.includes(sel)));
  if (!added.size) {
    check('every control added in this diff appears in the coarse block', true, 'no new CSS selectors in the working diff');
  } else if (!missing.length) {
    check('every control added in this diff appears in the coarse block', true, `${added.size} new selector(s), all covered`);
  } else {
    review('CSS selectors added in this diff with no coarse-block rule',
      `${missing.join(', ')} — confirm each is not a touch target, or add the 44px rule in the same pass`);
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
