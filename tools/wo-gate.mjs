#!/usr/bin/env node
// wo-gate.mjs — the dispatch pipeline's gate check, "what's next", and tick applier.
//
//   node tools/wo-gate.mjs WO-1.7          gate report for one work order; non-zero if blocked
//   node tools/wo-gate.mjs next            first NOT STARTED row in the Ship 1 table
//   node tools/wo-gate.mjs --list          every work order and its status
//   node tools/wo-gate.mjs --start WO-1.7 [--dry-run]     claim it: ⬜ NOT STARTED → 🔨 IN PROGRESS
//   node tools/wo-gate.mjs --release WO-1.7 [--dry-run]   the way back: 🔨 IN PROGRESS → ⬜ NOT STARTED
//   node tools/wo-gate.mjs --tick WO-1.7 [--dry-run]
//
// The orchestrator ran steps 1, 2 and 2b of its own definition as 8-13 Read and Bash calls plus the
// reasoning to interpret them, every dispatch. All of it is deterministic parsing of a header line
// that is already machine-readable, so it lives here instead.
//
// --start, --release and --tick write into plans/, which every other agent is forbidden to touch.
// The fences are at each of them: one named work order, never a 👤 line, never CHANGELOG.md, and
// --dry-run prints the exact edit first. See plans/work-orders/ROUTING.md for who runs them and when.
//
// The status a work order carries is the record; these three are a convenience over it. Every
// 🔨 IN PROGRESS in plans/ before WO-2.14 was typed by hand and will be again the first time this
// script is wrong about something, so nothing here may make that line harder to hand-edit.

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

    // The rest of the work order — heading to the next `---` rule or the next `## WO-`, which is
    // wo-brief.mjs's boundary rule, deliberately. Only the Acceptance list is read out of it.
    let end = lines.length;
    for (let k = j; k < lines.length; k++) {
      if (/^---\s*$/.test(lines[k]) || /^##\s+WO-/.test(lines[k])) { end = k; break; }
    }

    out.push({
      id: m[1],
      title: m[2],
      file,
      headingLine: i + 1,
      blockStart,                                              // 0-indexed line of the header block
      blockLines: block.length,
      acceptance: acceptanceOf(lines, j, end),                 // null when there is no list at all
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

// The Acceptance list is the work order's own account of whether it is finished, and this parser
// did not read it until WO-2.14 — which is how --tick came to write "done" over a list of open
// boxes and print PASS. It runs from the **Acceptance** field to the next bold field, usually
// **Traps**, and each item is a `- [ ]` or `- [x]` that may wrap onto indented continuation lines.
//
// Three things it must not get wrong, all of them read off the phase files rather than off one
// specimen:
//   - The list does NOT end at the first blank line. WO-2.1's second item carries an indented
//     blockquote with blank lines around it, and ten more items follow it.
//   - The heading is not always bare: WO-3.4's reads "**Acceptance** — each verified against a hand
//     computation, recorded in `docs/grade-math-cases.md`:".
//   - Leading whitespace on the `-` is allowed. If a future work order indents an item, it still
//     counts — an item this misses is an item that cannot hold a work order open, and that error
//     runs in the dangerous direction.
//
// The line shapes are wo-brief.mjs's acceptanceLines(), on purpose: two scripts reading one list two
// different ways is how the brief and the tracker start disagreeing about what was asked for.
// A work order with no **Acceptance** field but with checkboxes in its body is holding its list
// somewhere this parser was not looking. That is every gate work order: WO-G1 … WO-G4 keep theirs
// under `### The rehearsal`, `### Ship gate` and friends, and the original comment here recorded the
// gap as a fact about gates.md rather than as a defect — "no list at all — gates.md is like this."
//
// The consequence was the worst-placed one available. `--tick WO-G1` would have stamped ✅ DONE with
// every box open, on the one work order whose entire stated purpose is guarding against *declaring
// done*, and whose failure mode is going live on an app nobody rehearsed. It printed an honest NOTE
// saying the status rested on the caller's word alone — which is WO-2.14's honesty working, and is
// also a warning on a 🚩 go-live blocker, which is a thing people read past.
//
// So: no field, but boxes present → the boxes ARE the list. Deliberately NOT a second **Acceptance**
// heading bolted into gates.md, because two lists read two ways is how the brief and the tracker
// start disagreeing about what was asked for — the rule this file states twenty lines up.
//
// Over-collecting is the safe direction here and under-collecting is not: an extra box can only hold
// a work order open until a human ticks it, while a missed one closes a gate that was never run.
function checkboxesOf(lines, from, to) {
  const out = [];
  for (let j = from; j < to; j++) {
    const m = /^\s*-\s*\[([ x])\]\s*(.+)$/.exec(lines[j]);
    if (m) out.push({ line: j, ticked: m[1] === 'x', text: m[2].trim() });
    else if (out.length && /^\s{2,}\S/.test(lines[j])) out[out.length - 1].text += ' ' + lines[j].trim();
  }
  return out.length ? out : null;                              // genuinely no list — say so, as before
}

function acceptanceOf(lines, from, to) {
  let i = -1;
  for (let k = from; k < to; k++) if (/^\*\*Acceptance\*\*/.test(lines[k])) { i = k; break; }
  if (i < 0) return checkboxesOf(lines, from, to);             // gates.md: the boxes are the list
  const out = [];
  for (let j = i + 1; j < to; j++) {
    const l = lines[j];
    if (/^\*\*[A-Z]/.test(l)) break;                           // the next bold field ends the list
    const m = /^\s*-\s*\[([ x])\]\s*(.+)$/.exec(l);
    if (m) out.push({ line: j, ticked: m[1] === 'x', text: m[2].trim() });
    else if (out.length && /^\s{2,}\S/.test(l)) out[out.length - 1].text += ' ' + l.trim();  // wrapped
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
  if (wo.status.startsWith('🔨 IN PROGRESS')) notes.push(`${wo.id} is already 🔨 IN PROGRESS — a dispatch has claimed it. Ask before proceeding; if that dispatch is gone, --release ${wo.id} puts it back to ⬜ NOT STARTED`);
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

// A claimed row drops out of "next" the moment --start exists, and a running order that steps over
// a work order in silence is how one gets forgotten. So every skip is named, with the way back
// attached: a dispatch that died mid-flight leaves the claim behind, and from here that looks
// exactly like a dispatch still working.
//
// In --quiet mode the skips go to stderr, because stdout there is one ID that something else reads.
function reportSkips(claimed, quiet) {
  const say = quiet ? console.error : console.log;
  for (const wo of claimed) {
    say(`skipped ${wo.id} — ${wo.title}`);
    say(`  🔨 IN PROGRESS: a dispatch has claimed it, so this steps over it. If that dispatch is gone: node tools/wo-gate.mjs --release ${wo.id}`);
  }
  if (claimed.length && !quiet) console.log('');
}

function next(wos, quiet) {
  const claimed = [];
  for (const id of shipOneOrder()) {
    const wo = wos.get(id);
    if (!wo) continue;
    if (wo.status.startsWith('🔨 IN PROGRESS')) { claimed.push(wo); continue; }
    if (wo.status.startsWith('⬜ NOT STARTED')) {
      reportSkips(claimed, quiet);
      if (quiet) { console.log(wo.id); return 0; }
      console.log(`next: ${wo.id} — ${wo.title}`);
      console.log(`  size ${wo.size || '—'}${wo.flag ? '   🚩 go-live blocker' : ''}`);
      console.log(`  depends on ${wo.dependsRaw || 'nothing'}`);
      console.log('');
      return gate(wo.id, wos);
    }
  }
  reportSkips(claimed, quiet);
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

// ---------------------------------------------------------------------------- claim, and release

// Rewrite the **Status** field of one line and nothing else, leaving every other field and every `·`
// exactly where the hand that typed them put them. This is the ONLY thing --start, --release and
// --tick share, and it is deliberately a text edit with no opinion in it: each of the three decides
// its own status, for its own reason, behind its own fence.
//
// That separation is the work order's instruction, not tidiness. --start writes 🔨 IN PROGRESS
// because a run began; --tick writes the same words because the work is not finished. They arrive at
// one status for unrelated reasons, and a common path that cannot tell them apart is how a future
// --start starts ticking checkboxes.
function statusEdit(phaseLines, wo, statusText) {
  let line = -1;
  for (let i = wo.blockStart; i < wo.blockStart + wo.blockLines; i++) {
    if (phaseLines[i] && phaseLines[i].includes('**Status**')) { line = i; break; }
  }
  if (line < 0) return null;
  const before = phaseLines[line];
  const after = before.replace(/(\*\*Status\*\*\s*)([^·]*?)(\s*(?:·|$))/, `$1${statusText}$3`);
  return { line, before, after };
}

function printEdit(file, e) {
  console.log(`${path.relative(REPO, file)}:${e.line + 1}`);
  console.log(`  - ${e.before.trim()}`);
  console.log(`  + ${e.after.trim()}`);
}

// --start: claim a work order, so a second dispatch can see one is already in flight.
//
// The guard for that collision has been in gate() since the beginning — "already 🔨 IN PROGRESS —
// ask before proceeding" — and until WO-2.14 nothing could arm it, because the only thing that wrote
// a status was --tick and --tick is the last step. WO-2.4 sat at ⬜ NOT STARTED through two Codex
// rounds, a correction brief and two verifier passes.
function applyStart(id, wos, dryRun) {
  const wo = wos.get(id);
  if (!wo) { console.error(`FAIL | no work order ${id}`); return 1; }

  // Fence: only an unclaimed work order can be claimed. Everything else — already running, done,
  // blocked, gated — is either a collision or a caller with the wrong ID, and both want a human
  // before anything is written.
  if (!wo.status.startsWith('⬜ NOT STARTED')) {
    console.error(`FAIL | ${id} is "${wo.status}" — only ⬜ NOT STARTED may be claimed`);
    if (wo.status.startsWith('🔨 IN PROGRESS')) {
      console.error(`     | a dispatch has already claimed it. If that dispatch is gone: --release ${id}`);
    }
    return 1;
  }

  const phaseText = read(wo.file);
  const phaseLines = phaseText.split('\n');
  const e = statusEdit(phaseLines, wo, '🔨 IN PROGRESS');
  if (!e) { console.error(`FAIL | no **Status** line found under ${id}`); return 1; }

  console.log(`start ${id} — ${wo.title}${dryRun ? '   (DRY RUN — nothing written)' : ''}`);
  console.log('');
  printEdit(wo.file, e);

  if (!dryRun) {
    phaseLines[e.line] = e.after;
    fs.writeFileSync(wo.file, phaseLines.join('\n'));
  }

  console.log('');
  console.log('NOT touched: the roadmap, the dashboard, and every checkbox. A claim is not progress — the dashboards count ✅ DONE and nothing else.');
  console.log(dryRun ? 'DRY RUN | re-run without --dry-run to apply.'
                     : `PASS | ${id} claimed — 🔨 IN PROGRESS. If this dispatch dies, --release ${id} puts it back.`);
  return 0;
}

// --release: the way back. A claim outlives the run that made it, and a dispatch that dies mid-flight
// leaves the work order looking healthy while `next` steps over it forever — the tracker lying in the
// other direction. This is the one line that undoes it.
//
// It is not a status for *why* a run stopped. 🚧 BLOCKED already exists for that and a human sets it.
function applyRelease(id, wos, dryRun) {
  const wo = wos.get(id);
  if (!wo) { console.error(`FAIL | no work order ${id}`); return 1; }

  if (!wo.status.startsWith('🔨 IN PROGRESS')) {
    console.error(`FAIL | ${id} is "${wo.status}" — only a claimed (🔨 IN PROGRESS) work order can be released`);
    return 1;
  }

  const phaseText = read(wo.file);
  const phaseLines = phaseText.split('\n');
  const e = statusEdit(phaseLines, wo, '⬜ NOT STARTED');
  if (!e) { console.error(`FAIL | no **Status** line found under ${id}`); return 1; }

  console.log(`release ${id} — ${wo.title}${dryRun ? '   (DRY RUN — nothing written)' : ''}`);
  console.log('');
  printEdit(wo.file, e);

  if (!dryRun) {
    phaseLines[e.line] = e.after;
    fs.writeFileSync(wo.file, phaseLines.join('\n'));
  }

  console.log('');
  console.log(dryRun ? 'DRY RUN | re-run without --dry-run to apply.'
                     : `PASS | ${id} released — the claim is gone, it is ⬜ NOT STARTED again and back in \`next\`. Nothing else was touched.`);
  return 0;
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

// One Acceptance line, short enough to read in a list of them. The file:line beside it is how you
// get to the whole thing, and WO-2.1's second item is 900 characters of blockquote.
function clip(s, n = 100) {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
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

  // The work order's own Acceptance list decides which status this writes. Before WO-2.14 this
  // hardcoded ✅ DONE and had never read a checkbox, so at WO-2.4 the offered maintenance would have
  // stamped "done" on a 🚩 go-live blocker with two lines still owed to the owner — caught by reading
  // the source, not by the tool refusing.
  //
  // An open line holds the work order at 🔨 IN PROGRESS, which is the project's own convention
  // (WO-2.1, WO-2.11 and WO-2.12 all landed there with 👤 lines owed) and was unreachable through
  // this tool until now. It writes a status because the work is unfinished — nothing to do with
  // --start, which writes the same words because a run began.
  const open = wo.acceptance ? wo.acceptance.filter(a => !a.ticked) : [];
  const held = open.length > 0;

  const planned = [];

  // 1. The work order's own Status line.
  const phaseText = read(wo.file);
  const phaseLines = phaseText.split('\n');
  const se = statusEdit(phaseLines, wo, held ? '🔨 IN PROGRESS' : `✅ DONE — ${today()}`);
  if (!se) { console.error(`FAIL | no **Status** line found under ${id}`); return 1; }
  const statusUnchanged = se.before === se.after;                // already 🔨 IN PROGRESS, held again
  if (!statusUnchanged) { planned.push({ file: wo.file, ...se }); phaseLines[se.line] = se.after; }

  // 2. The roadmap boxes this work order closes — and not one of them while a line is open. An
  //    unfinished work order closes nothing, however much of it is finished.
  const roadmapText = read(ROADMAP);
  const rm = held ? { edits: [], misses: [], fragments: [] } : roadmapEdits(wo, roadmapText);
  const roadmapLines = roadmapText.split('\n');
  for (const e of rm.edits) { planned.push({ file: ROADMAP, ...e }); roadmapLines[e.line] = e.after; }

  // 3. The dashboard, recomputed after the status edit lands.
  const readmeBefore = read(README);

  // Report
  console.log(`tick ${id} — ${wo.title}${dryRun ? '   (DRY RUN — nothing written)' : ''}`);
  console.log('');
  for (const e of planned) printEdit(e.file, e);
  if (statusUnchanged) console.log(`NOTE | the status line already reads "${wo.status}" — left exactly as it is`);
  if (wo.acceptance === null) console.log(`NOTE | ${id} has no **Acceptance** list — nothing here could hold it open, so this status is written on the caller's word alone`);

  // The refusal. Everything above has been reported; nothing below this line ticks anything.
  if (held) {
    console.log('');
    console.log(`HELD | ${open.length} of ${wo.acceptance.length} Acceptance lines are still [ ] — ${id} is not done:`);
    for (const a of open) {
      console.log(`  ${path.relative(REPO, wo.file)}:${a.line + 1}  ${clip(a.text)}`);
    }
    console.log('');
    console.log('NOTE | roadmap boxes left unticked and the dashboard left alone — an unfinished work order closes nothing.');
    if (!dryRun) fs.writeFileSync(wo.file, phaseLines.join('\n'));
    console.log(dryRun
      ? 'DRY RUN | re-run without --dry-run to write 🔨 IN PROGRESS. It will still refuse to write ✅ DONE.'
      : `HELD | ${id} left at 🔨 IN PROGRESS. Tick the lines above once they are true, then run this again.`);
    return 1;
  }

  // Say how many lines were read, not just that none of them was open: "all 0 lines are ticked" is
  // what a parser that found nothing would print, and it should be visible rather than inferred.
  if (wo.acceptance) console.log(`NOTE | all ${wo.acceptance.length} Acceptance lines are ticked — nothing holds ${id} open`);
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
  console.log(`wo-gate.mjs — gates, next, claims and ticks for Planbook work orders

  node tools/wo-gate.mjs WO-1.7               gate report; exits non-zero if blocked
  node tools/wo-gate.mjs next [--quiet]       first NOT STARTED in the Ship 1 table
  node tools/wo-gate.mjs --list               every work order and its status
  node tools/wo-gate.mjs --start WO-1.7 [--dry-run]     claim it — ⬜ NOT STARTED → 🔨 IN PROGRESS
  node tools/wo-gate.mjs --release WO-1.7 [--dry-run]   the way back, for a dispatch that died
  node tools/wo-gate.mjs --tick WO-1.7 [--dry-run]

--start, --release and --tick write into plans/. Run each with --dry-run first and read the diff.
--start claims a work order so a second dispatch can see one is in flight; it moves no dashboard.
--tick reads the work order's own Acceptance list: any line still [ ] and it writes 🔨 IN PROGRESS
instead of ✅ DONE, names the lines, and leaves the roadmap alone.
None of them touches a 👤 line in TESTING.md, and none touches CHANGELOG.md.`);
  process.exit(0);
}

if (argv[0] === '--list') {
  for (const wo of wos.values()) {
    console.log(`${wo.id.padEnd(8)} ${wo.status.padEnd(22)} ${wo.flag ? '🚩' : '  '} ${wo.title}`);
  }
  process.exit(0);
}

if (argv[0] === 'next') process.exit(next(wos, argv.includes('--quiet')));

// Three separate blocks for three separate writes. Each names its own flag in its own error, so a
// mistyped ID is reported by the thing the caller actually ran.
if (argv[0] === '--start') {
  const id = argv[1];
  if (!id || !/^WO-/.test(id)) { console.error('FAIL | --start needs an explicit work order ID, e.g. --start WO-1.7'); process.exit(1); }
  process.exit(applyStart(id, wos, argv.includes('--dry-run')));
}

if (argv[0] === '--release') {
  const id = argv[1];
  if (!id || !/^WO-/.test(id)) { console.error('FAIL | --release needs an explicit work order ID, e.g. --release WO-1.7'); process.exit(1); }
  process.exit(applyRelease(id, wos, argv.includes('--dry-run')));
}

if (argv[0] === '--tick') {
  const id = argv[1];
  if (!id || !/^WO-/.test(id)) { console.error('FAIL | --tick needs an explicit work order ID, e.g. --tick WO-1.7'); process.exit(1); }
  process.exit(applyTick(id, wos, argv.includes('--dry-run')));
}

if (/^WO-/.test(argv[0])) process.exit(gate(argv[0], wos));

console.error(`FAIL | unrecognized argument "${argv[0]}" — try --help`);
process.exit(1);
