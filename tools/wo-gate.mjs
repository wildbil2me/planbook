#!/usr/bin/env node
// wo-gate.mjs — the dispatch pipeline's gate check, "what's next", and tick applier.
//
//   node tools/wo-gate.mjs WO-1.7          gate report for one work order; non-zero if blocked
//   node tools/wo-gate.mjs next            first NOT STARTED row in the Ship 1 table
//   node tools/wo-gate.mjs --list          every work order and its status
//   node tools/wo-gate.mjs --tick WO-1.7 [--dry-run]
//
// The orchestrator ran steps 1, 2 and 2b of its own definition as 8-13 Read and Bash calls plus the
// reasoning to interpret them, every dispatch. All of it is deterministic parsing of a header line
// that is already machine-readable, so it lives here instead.
//
// --tick writes into plans/, which every other agent is forbidden to touch. Its fences are at
// applyTick(): one named work order, never a 👤 line, never CHANGELOG.md, and --dry-run prints the
// exact edit first. See plans/work-orders/ROUTING.md for who is allowed to run it and when.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WO_DIR = path.join(REPO, 'plans', 'work-orders');
const README = path.join(WO_DIR, 'README.md');
const ROADMAP = path.join(REPO, 'plans', 'ROADMAP.md');
const DISPATCH = path.join(REPO, '.claude', 'dispatch');

// The status vocabulary, from plans/work-orders/README.md. Order matters: longest first, so
// "✅ DONE — 2026-08-04" doesn't match a bare prefix of something else.
const STATUSES = ['✅ DONE', '⬜ NOT STARTED', '🔨 IN PROGRESS', '🚧 BLOCKED', '🔒 GATED'];

// The hard ordering constraint, stated in CLAUDE.md, the phase file, and the orchestrator's gates.
// No feature that writes student data ships before the path that gets it back out.
const HARD_ORDER = { after: 'WO-1.5', appliesTo: id => /^WO-1\.(\d+)$/.test(id) && +id.split('.')[1] >= 6 };

function read(f) { return fs.readFileSync(f, 'utf8'); }

// ---------------------------------------------------------------------------- parsing

// A work order is a `## WO-x.y — Title` heading followed by one paragraph of `**Field** value`
// pairs separated by `·`, which may wrap across lines. Join the paragraph, then pull fields out
// by name — splitting on `·` breaks because "WO-1.1 … WO-2.4" carries its own separators.
function parseFile(file) {
  const text = read(file);
  const lines = text.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^##\s+(WO-[\dG][\w.]*)\s+—\s+(.+?)\s*$/.exec(lines[i]);
    if (!m) continue;
    const block = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;          // skip the blank after the heading
    const blockStart = j;
    while (j < lines.length && lines[j].trim()) block.push(lines[j++]);
    const joined = block.join(' ');

    const field = re => { const r = re.exec(joined); return r ? r[1].trim() : ''; };
    const statusRaw = field(/\*\*Status\*\*\s*([^·]*)/);
    const status = STATUSES.find(s => statusRaw.startsWith(s)) || statusRaw || '(none)';

    out.push({
      id: m[1],
      title: m[2],
      file,
      headingLine: i + 1,
      blockStart,                                              // 0-indexed line of the header block
      blockLines: block.length,
      ship: field(/\*\*Ship\*\*\s*([^·]*)/),
      status,
      statusRaw,
      size: field(/\*\*Size\*\*\s*([^·]*)/),
      flag: /🚩/.test(joined),
      dependsRaw: field(/\*\*Depends on\*\*\s*(.*?)(?=\s*·\s*\*\*|\s*\*\*Closes roadmap\*\*|$)/),
      closesRoadmap: field(/\*\*Closes roadmap\*\*\s*(.*)$/),
    });
  }
  return out;
}

function allWorkOrders() {
  const files = fs.readdirSync(WO_DIR)
    .filter(f => f.endsWith('.md') && f !== 'README.md' && f !== 'ROUTING.md')
    .map(f => path.join(WO_DIR, f));
  const map = new Map();
  for (const f of files) for (const wo of parseFile(f)) map.set(wo.id, wo);
  return map;
}

// "WO-1.1" → dependency. "nothing", "everything", "Phase 3" → not a work order this script can
// resolve, and reported as such rather than silently passed.
function depsOf(wo) {
  const ids = [...(wo.dependsRaw.match(/WO-[\dG][\w.]*/g) || [])];
  const prose = wo.dependsRaw.replace(/WO-[\dG][\w.]*/g, '').replace(/[…,\s·]/g, '');
  return { ids: [...new Set(ids)], hasProse: prose.length > 0 && !/^nothing$/i.test(wo.dependsRaw.trim()) };
}

// The Ship 1 table in README.md is the running order. Rows look like:
//   | 6 | [WO-1.6](phase-1-...#wo-16--classes--terms) Classes & terms | M | 🚩 | Aug 10–11 |
function shipOneOrder() {
  const rows = [];
  for (const line of read(README).split('\n')) {
    const m = /^\|\s*\d+\s*\|\s*\[(WO-[\dG][\w.]*)\]/.exec(line);
    if (m) rows.push(m[1]);
  }
  return rows;
}

// ---------------------------------------------------------------------------- gate report

function gitStatus() {
  try {
    return execFileSync('git', ['status', '--short'], { cwd: REPO, encoding: 'utf8' }).trimEnd();
  } catch {
    return '(git unavailable)';
  }
}

function dispatchFiles(id) {
  const names = ['brief', 'result', 'status', 'codex-blocked'];
  const found = {};
  for (const n of names) {
    const p = path.join(DISPATCH, `${id}-${n}.md`);
    found[n] = fs.existsSync(p) ? p : null;
  }
  return found;
}

function gate(id, wos) {
  const wo = wos.get(id);
  if (!wo) { console.error(`FAIL | no work order ${id} in ${path.relative(REPO, WO_DIR)}`); return 1; }

  const problems = [];
  const notes = [];

  console.log(`${wo.id} — ${wo.title}`);
  console.log(`  file    ${path.relative(REPO, wo.file)}:${wo.headingLine}`);
  console.log(`  ship    ${wo.ship || '—'}   size ${wo.size || '—'}   ${wo.flag ? '🚩 go-live blocker' : ''}`);
  console.log(`  status  ${wo.status}`);

  // 1. Dependencies
  const { ids, hasProse } = depsOf(wo);
  if (!ids.length && !hasProse) {
    console.log('  depends nothing');
  } else {
    for (const dep of ids) {
      const d = wos.get(dep);
      const st = d ? d.status : '(not found)';
      const ok = st.startsWith('✅ DONE');
      console.log(`  depends ${dep.padEnd(8)} ${st}${ok ? '' : '   <-- not done'}`);
      if (!ok) problems.push(`dependency ${dep} is ${st}, not ✅ DONE`);
    }
    if (hasProse) {
      console.log(`  depends (prose) ${wo.dependsRaw}`);
      notes.push(`"Depends on" carries a non-work-order clause — read it yourself: ${wo.dependsRaw}`);
    }
  }

  // 2. The hard ordering constraint
  if (HARD_ORDER.appliesTo(wo.id)) {
    const anchor = wos.get(HARD_ORDER.after);
    const ok = anchor && anchor.status.startsWith('✅ DONE');
    console.log(`  order   ${HARD_ORDER.after} before ${wo.id}: ${ok ? 'satisfied' : 'NOT SATISFIED'}`);
    if (!ok) problems.push(`the hard ordering constraint is not satisfied: ${HARD_ORDER.after} is ${anchor ? anchor.status : 'missing'}`);
  }

  // 3. Gated, and 4. already started
  if (wo.status.startsWith('🔒 GATED')) problems.push(`${wo.id} is 🔒 GATED — do not start it`);
  if (wo.status.startsWith('✅ DONE')) notes.push(`${wo.id} is already ✅ DONE — ask before proceeding`);
  if (wo.status.startsWith('🔨 IN PROGRESS')) notes.push(`${wo.id} is already 🔨 IN PROGRESS — ask before proceeding`);
  if (wo.status.startsWith('🚧 BLOCKED')) problems.push(`${wo.id} is 🚧 BLOCKED`);

  // 5. Interrupted-run evidence
  const files = dispatchFiles(wo.id);
  const have = Object.entries(files).filter(([, v]) => v).map(([k]) => k);
  console.log(`  dispatch ${have.length ? have.join(', ') : 'no files yet'}`);
  const git = gitStatus();
  console.log(`  git     ${git ? `${git.split('\n').length} changed path(s)` : 'clean'}`);
  if (git) for (const l of git.split('\n')) console.log(`          ${l}`);
  if (git && files.brief && !files.result) {
    notes.push('brief exists, result does not, and the tree is dirty — treat as an INTERRUPTED DRAFT: audit it line by line against the brief before building on it (see plans/dispatch-retro.md § Interrupted runs)');
  }

  console.log('');
  for (const n of notes) console.log(`NOTE | ${n}`);
  for (const p of problems) console.log(`FAIL | ${p}`);
  if (!problems.length) console.log(`PASS | gates clear for ${wo.id}`);
  return problems.length ? 1 : 0;
}

// ---------------------------------------------------------------------------- next

function next(wos, quiet) {
  for (const id of shipOneOrder()) {
    const wo = wos.get(id);
    if (wo && wo.status.startsWith('⬜ NOT STARTED')) {
      if (quiet) { console.log(wo.id); return 0; }
      console.log(`next: ${wo.id} — ${wo.title}`);
      console.log(`  size ${wo.size || '—'}${wo.flag ? '   🚩 go-live blocker' : ''}`);
      console.log(`  depends on ${wo.dependsRaw || 'nothing'}`);
      console.log('');
      return gate(wo.id, wos);
    }
  }
  console.log('next: nothing ⬜ NOT STARTED left in the Ship 1 table');
  return 0;
}

// ---------------------------------------------------------------------------- dashboard

const PHASE_ROWS = [
  ['phase-1-shell-store-roster.md', /^\|\s*1 —/],
  ['phase-2-attendance.md',         /^\|\s*2 —/],
  ['phase-3-gradebook.md',          /^\|\s*3 —/],
  ['phase-4-signals.md',            /^\|\s*4 —/],
  ['phase-5-outreach.md',           /^\|\s*5 —/],
  ['phase-6-calendar-glance.md',    /^\|\s*6 —/],
  ['phase-7-sync.md',               /^\|\s*7 —/],
  ['phase-8-packaging.md',          /^\|\s*8 —/],
  ['gates.md',                      /^\|\s*Gates\s*\|/],
];

function bar(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const filled = Math.floor(pct / 10);
  return `\`[${'█'.repeat(filled)}${'░'.repeat(10 - filled)}] ${pct}%\``;
}

// Recompute every Done count from the phase files rather than trusting the number already there.
// WO-1.1 sat verified with the dashboard reading 0 because five hand edits are easy to postpone;
// a tracker that lies about what is finished is the failure this exists to prevent.
function recomputeDashboard(text) {
  const edits = [];
  let lines = text.split('\n');
  let grandTotal = 0, grandDone = 0;

  for (const [file, rowRe] of PHASE_ROWS) {
    const p = path.join(WO_DIR, file);
    if (!fs.existsSync(p)) continue;
    const wos = parseFile(p);
    const total = wos.length;
    const done = wos.filter(w => w.status.startsWith('✅ DONE')).length;
    grandTotal += total; grandDone += done;

    const i = lines.findIndex(l => rowRe.test(l));
    if (i < 0) { edits.push({ line: -1, note: `no dashboard row matched ${file}` }); continue; }
    const cells = lines[i].split('|');
    // | label | work orders | done | status |
    if (cells.length < 5) continue;
    const before = lines[i];
    cells[2] = ` ${total} `;
    cells[3] = ` ${done} `;
    const after = cells.join('|');
    if (before !== after) { edits.push({ line: i, before, after }); lines[i] = after; }
  }

  const ti = lines.findIndex(l => /^\|\s*\|\s*\*\*\d+\*\*\s*\|/.test(l));
  if (ti >= 0) {
    const before = lines[ti];
    const after = `| | **${grandTotal}** | **${grandDone}** | ${bar(grandDone, grandTotal)} |`;
    if (before !== after) { edits.push({ line: ti, before, after }); lines[ti] = after; }
  }
  return { text: lines.join('\n'), edits, grandTotal, grandDone };
}

// ---------------------------------------------------------------------------- tick

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// The roadmap boxes are matched through the work order's own **Closes roadmap** line, which quotes
// the box text. Fragments are truncated at their ellipsis and compared normalized. Zero or several
// matches is reported and left alone — guessing which box to tick is exactly the thing not to do.
// Trailing punctuation is stripped because a **Closes roadmap** fragment quotes the box only as far
// as it needs to: WO-1.7 quotes "…and email fields." where the roadmap box reads "…and email fields
// editable." The sentence-ending period is the quoter's, not the box's.
function norm(s) {
  return s.replace(/`/g, '').replace(/\*\*/g, '').replace(/[…]|\.\.\./g, '')
          .replace(/\s+/g, ' ').trim().replace(/[.;,:]+$/, '').toLowerCase();
}

function roadmapEdits(wo, roadmapText) {
  const fragments = [...wo.closesRoadmap.matchAll(/"([^"]+)"/g)].map(m => m[1]);
  const lines = roadmapText.split('\n');
  const edits = [], misses = [];
  for (const frag of fragments) {
    const f = norm(frag);
    if (f.length < 12) { misses.push(`fragment too short to match safely: "${frag}"`); continue; }
    const hits = [];
    for (let i = 0; i < lines.length; i++) {
      if (!/^-\s*\[[ x]\]/.test(lines[i])) continue;
      if (norm(lines[i]).includes(f)) hits.push(i);
    }
    if (hits.length !== 1) { misses.push(`"${frag}" matched ${hits.length} roadmap boxes — not ticking it`); continue; }
    const i = hits[0];
    if (/^-\s*\[x\]/.test(lines[i])) { misses.push(`"${frag}" is already ticked at ROADMAP.md:${i + 1}`); continue; }
    edits.push({ line: i, before: lines[i], after: lines[i].replace(/^(-\s*)\[ \]/, '$1[x]') });
  }
  return { edits, misses, fragments };
}

function applyTick(id, wos, dryRun) {
  const wo = wos.get(id);
  if (!wo) { console.error(`FAIL | no work order ${id}`); return 1; }

  // Fence: only a work order that is open may be ticked. Re-ticking a done one, or ticking one
  // that is BLOCKED or GATED, is a sign the caller has the wrong ID.
  if (!(wo.status.startsWith('⬜ NOT STARTED') || wo.status.startsWith('🔨 IN PROGRESS'))) {
    console.error(`FAIL | ${id} is "${wo.status}" — only ⬜ NOT STARTED or 🔨 IN PROGRESS may be ticked`);
    return 1;
  }

  const planned = [];

  // 1. The work order's own Status line.
  const phaseText = read(wo.file);
  const phaseLines = phaseText.split('\n');
  let statusLine = -1;
  for (let i = wo.blockStart; i < wo.blockStart + wo.blockLines; i++) {
    if (phaseLines[i] && phaseLines[i].includes('**Status**')) { statusLine = i; break; }
  }
  if (statusLine < 0) { console.error(`FAIL | no **Status** line found under ${id}`); return 1; }
  const newStatus = phaseLines[statusLine].replace(
    /(\*\*Status\*\*\s*)([^·]*?)(\s*(?:·|$))/,
    `$1✅ DONE — ${today()}$3`
  );
  planned.push({ file: wo.file, line: statusLine, before: phaseLines[statusLine], after: newStatus });
  phaseLines[statusLine] = newStatus;

  // 2. The roadmap boxes this work order closes.
  const roadmapText = read(ROADMAP);
  const rm = roadmapEdits(wo, roadmapText);
  const roadmapLines = roadmapText.split('\n');
  for (const e of rm.edits) { planned.push({ file: ROADMAP, ...e }); roadmapLines[e.line] = e.after; }

  // 3. The dashboard, recomputed after the status edit lands.
  const readmeBefore = read(README);

  // Report
  console.log(`tick ${id} — ${wo.title}${dryRun ? '   (DRY RUN — nothing written)' : ''}`);
  console.log('');
  for (const e of planned) {
    console.log(`${path.relative(REPO, e.file)}:${e.line + 1}`);
    console.log(`  - ${e.before.trim()}`);
    console.log(`  + ${e.after.trim()}`);
  }
  for (const m of rm.misses) console.log(`NOTE | roadmap: ${m}`);
  if (!rm.fragments.length) console.log('NOTE | this work order has no **Closes roadmap** line — no roadmap box to tick');

  if (!dryRun) {
    fs.writeFileSync(wo.file, phaseLines.join('\n'));
    if (rm.edits.length) fs.writeFileSync(ROADMAP, roadmapLines.join('\n'));
  }

  // Dashboard last, so it counts the status edit we just made. In a dry run the phase file on disk
  // is unchanged, so the preview adds this tick by hand rather than reading it back.
  const preview = dryRun ? recomputeDashboardPreview(readmeBefore, wo) : recomputeDashboard(readmeBefore);
  for (const e of preview.edits) {
    if (e.line < 0) { console.log(`NOTE | dashboard: ${e.note}`); continue; }
    console.log(`${path.relative(REPO, README)}:${e.line + 1}`);
    console.log(`  - ${e.before.trim()}`);
    console.log(`  + ${e.after.trim()}`);
  }
  if (!dryRun && preview.edits.length) fs.writeFileSync(README, preview.text);

  console.log('');
  console.log('NOT touched, by rule: any TESTING.md line carrying 👤, and CHANGELOG.md — that is prose the teacher writes.');
  console.log(dryRun ? 'DRY RUN | re-run without --dry-run to apply.' : `PASS | ${id} ticked.`);
  return 0;
}

// A dry run must not write the phase file, so the dashboard preview counts this work order as done
// without it being on disk yet.
function recomputeDashboardPreview(readmeText, wo) {
  const real = recomputeDashboard(readmeText);
  const file = path.basename(wo.file);
  const row = PHASE_ROWS.find(([f]) => f === file);
  if (!row) return real;
  const lines = real.text.split('\n');
  const i = lines.findIndex(l => row[1].test(l));
  if (i < 0) return real;
  const cells = lines[i].split('|');
  const before = real.edits.find(e => e.line === i)?.before ?? lines[i];
  cells[3] = ` ${Number(cells[3].trim()) + 1} `;
  lines[i] = cells.join('|');
  const edits = real.edits.filter(e => e.line !== i);
  edits.push({ line: i, before, after: lines[i] });

  const ti = lines.findIndex(l => /^\|\s*\|\s*\*\*\d+\*\*\s*\|/.test(l));
  if (ti >= 0) {
    const tCells = lines[ti].split('|');
    const total = Number(tCells[2].replace(/\*/g, '').trim());
    const done = Number(tCells[3].replace(/\*/g, '').trim()) + 1;
    const tBefore = real.edits.find(e => e.line === ti)?.before ?? lines[ti];
    lines[ti] = `| | **${total}** | **${done}** | ${bar(done, total)} |`;
    const rest = edits.filter(e => e.line !== ti);
    rest.push({ line: ti, before: tBefore, after: lines[ti] });
    return { text: lines.join('\n'), edits: rest };
  }
  return { text: lines.join('\n'), edits };
}

// ---------------------------------------------------------------------------- main

const argv = process.argv.slice(2);
const wos = allWorkOrders();

if (!argv.length || argv.includes('--help') || argv.includes('-h')) {
  console.log(`wo-gate.mjs — gates, next, and ticks for Planbook work orders

  node tools/wo-gate.mjs WO-1.7               gate report; exits non-zero if blocked
  node tools/wo-gate.mjs next [--quiet]       first NOT STARTED in the Ship 1 table
  node tools/wo-gate.mjs --list               every work order and its status
  node tools/wo-gate.mjs --tick WO-1.7 [--dry-run]

--tick writes into plans/. Run it with --dry-run first and read the diff.
It never touches a 👤 line in TESTING.md and never touches CHANGELOG.md.`);
  process.exit(0);
}

if (argv[0] === '--list') {
  for (const wo of wos.values()) {
    console.log(`${wo.id.padEnd(8)} ${wo.status.padEnd(22)} ${wo.flag ? '🚩' : '  '} ${wo.title}`);
  }
  process.exit(0);
}

if (argv[0] === 'next') process.exit(next(wos, argv.includes('--quiet')));

if (argv[0] === '--tick') {
  const id = argv[1];
  if (!id || !/^WO-/.test(id)) { console.error('FAIL | --tick needs an explicit work order ID, e.g. --tick WO-1.7'); process.exit(1); }
  process.exit(applyTick(id, wos, argv.includes('--dry-run')));
}

if (/^WO-/.test(argv[0])) process.exit(gate(argv[0], wos));

console.error(`FAIL | unrecognized argument "${argv[0]}" — try --help`);
process.exit(1);
