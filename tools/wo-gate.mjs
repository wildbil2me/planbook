#!/usr/bin/env node
// wo-gate.mjs — the dispatch pipeline's gate check, "what's next", and tick applier.
//
//   node tools/wo-gate.mjs WO-1.7          gate report for one work order; non-zero if blocked
//   node tools/wo-gate.mjs next            first NOT STARTED row in the Ship 1 table
//   node tools/wo-gate.mjs --list          every work order and its status
//   node tools/wo-gate.mjs --start WO-1.7 [--dry-run]     claim it: ⬜ NOT STARTED → 🔨 IN PROGRESS
//   node tools/wo-gate.mjs --release WO-1.7 [--dry-run]   the way back: 🔨 IN PROGRESS → ⬜ NOT STARTED
//   node tools/wo-gate.mjs --tick WO-1.7 [--dry-run]
//   node tools/wo-gate.mjs --audit                        the trackers' standing rot check
//   node tools/wo-gate.mjs --self-check [--against <path>] this file's standing check on itself
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
//
// --audit and --self-check (WO-2.15) write nothing anywhere. --audit reads the two trackers and
// reports where they have drifted apart; --self-check copies plans/ to a temp directory, plants the
// violations WO-2.14 and WO-2.15 proved by hand, and fails if any of them stops being caught.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

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
//
// The header vocabulary this script knows, and the reason it is a closed list rather than "whatever
// is bold": a field the parser has never heard of does not go missing, it gets swallowed by
// whichever field's regex runs to the end of the line. **Amends roadmap** did exactly that — it sits
// on WO-2.12's and WO-2.13's `Depends on` line, `depsOf()` scraped it into the dependency field, and
// the gate report announced a "non-work-order clause" on two work orders that depend on exactly one
// thing each. So every known field stops at the next known field, and an unknown one is visible as
// prose on the field before it rather than silently changing what that field means.
//
// **Amends roadmap** is REAL, decided 2026-08-08 (WO-2.15). It records that a work order changes the
// promise of a roadmap box some earlier work order already closed — WO-2.12 narrowing WO-2.1's grid
// to portrait, WO-2.13 changing how often WO-2.4's arithmetic runs. That is the maintenance
// protocol's step 2 (`ROADMAP.md:36`, the *(italic paren note)*) stated at the top of the work order
// that owes it, and it is worth having: the alternative was deleting the clause from two shipped
// work orders because a script could not read it, which is the tail wagging the dog. It is parsed,
// it is reported by `gate()`, and it is NEVER written — amending a box is prose about intent and
// only a human writes that. Documented in `plans/work-orders/README.md` § Header fields so the next
// one is typed the same way.
const KNOWN_FIELDS = ['Ship', 'Status', 'Size', 'Depends on', 'Closes roadmap', 'Amends roadmap', 'Takes from'];

// `**Name** …everything up to the next known field or the end of the header paragraph`.
function fieldRe(name) {
  const others = KNOWN_FIELDS.filter(f => f !== name).join('|');
  return new RegExp(`\\*\\*${name}\\*\\*\\s*(.*?)(?=\\s*·?\\s*\\*\\*(?:${others})\\b|$)`);
}

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

    // A **Closes roadmap** line below the header paragraph is invisible to everything here, and it
    // fails in the quiet direction: `--tick` reports "no **Closes roadmap** line — no roadmap box to
    // tick" and ticks nothing. WO-2.8's sat under a seven-line italic note, one blank line out of
    // reach, and its "Hall passes" box was only ever ticked by hand. Collected rather than parsed,
    // because moving the line is the fix and a parser that reaches past the paragraph would make
    // every stray one permanent.
    const strays = [];
    for (let k = blockStart + block.length; k < end; k++) {
      if (/^\*\*(?:Closes|Amends) roadmap\*\*/.test(lines[k])) strays.push(k);
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
      dependsRaw: field(fieldRe('Depends on')),
      closesRoadmap: field(fieldRe('Closes roadmap')),
      amendsRoadmap: field(fieldRe('Amends roadmap')),
      strayRoadmapLines: strays,                               // 0-indexed, outside the header block
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

  // Reported, never acted on: an amendment is prose about a box some earlier work order closed, and
  // nothing here may edit that box. It is printed because whoever is about to start this work order
  // wants to know it changes a promise already made.
  if (wo.amendsRoadmap) console.log(`  amends  ${wo.amendsRoadmap}`);
  for (const k of wo.strayRoadmapLines) {
    notes.push(`a **Closes/Amends roadmap** line sits below the header paragraph at ${path.relative(REPO, wo.file)}:${k + 1} — nothing in this script can see it, so --tick would tick no box and say so as if there were none. Move it into the header paragraph (--audit lists these)`);
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

// A fragment is matched against ONE roadmap line. Boxes wrap, and a quotation that crosses the wrap
// can never match — quote as far as the line goes and end with an ellipsis, which norm() strips.
// That rule is written down in `plans/work-orders/README.md` § Header fields, because it is the
// difference between WO-2.5's fragment and the box it names.
function roadmapHits(frag, lines) {
  const f = norm(frag);
  if (f.length < 12) return { tooShort: true, hits: [] };
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^-\s*\[[ x]\]/.test(lines[i])) continue;
    if (norm(lines[i]).includes(f)) hits.push(i);
  }
  return { tooShort: false, hits };
}

// **Decision, 2026-08-08 (WO-2.15): a fragment that leaves no box ticked HOLDS the tick. It is not a
// NOTE.** The rule in one sentence — *a **Closes roadmap** fragment that produces no edit and is not
// already ticked is a HELD* — which covers zero matches, several matches, and a fragment too short
// to match safely, because all three are the same fact: the work order names a box, and none gets
// closed. A work order in that state is quoting a box that was reworded or one that never existed,
// and both want a human before the status line says done.
//
// The alternative was already running and already failed. WO-2.5's fragment matched zero boxes,
// `misses` printed exactly that, and the run said PASS and exited 0; nobody had ticked WO-2.5 yet,
// so the box it closes would have stayed open behind a green run. That is the same family as the two
// gaps WO-2.14 closed — the tool does something other than what it was asked, says so quietly, and
// nothing stops. A NOTE among NOTEs is what gets read past, which is the whole reason this file has
// a refusal in it at all.
//
// **"Already ticked" stays a NOTE**, deliberately: the box IS closed, it was just closed earlier, by
// hand or by an amending work order. Nothing is untrue and nothing needs a human.
function roadmapEdits(wo, roadmapText) {
  const fragments = [...wo.closesRoadmap.matchAll(/"([^"]+)"/g)].map(m => m[1]);
  const lines = roadmapText.split('\n');
  const edits = [], notes = [], blockers = [];
  for (const frag of fragments) {
    const { tooShort, hits } = roadmapHits(frag, lines);
    if (tooShort) { blockers.push(`"${frag}" is too short to match a roadmap box safely — quote more of the box`); continue; }
    if (hits.length !== 1) {
      blockers.push(`"${frag}" matched ${hits.length} roadmap boxes${hits.length ? ` (${hits.map(i => `ROADMAP.md:${i + 1}`).join(', ')})` : ''} — it must match exactly one`);
      continue;
    }
    const i = hits[0];
    if (/^-\s*\[x\]/.test(lines[i])) { notes.push(`"${frag}" is already ticked at ROADMAP.md:${i + 1}`); continue; }
    edits.push({ line: i, before: lines[i], after: lines[i].replace(/^(-\s*)\[ \]/, '$1[x]') });
  }
  return { edits, notes, blockers, fragments };
}

// ------------------------------------------------------- the roadmap's own progress dashboard
//
// `ROADMAP.md:36` makes updating the dashboard row a manual fourth step, this script only ever
// writes the dashboard in `work-orders/README.md`, and so nothing has ever read the roadmap's back.
// Found 2026-08-08 with three wrong numerators and a denominator wrong independently of all of them:
// Phase 1 reading 11/12 against twelve ticked boxes and none open, Phase 2 reading 10/16 against
// twelve, and an overall of 22/81 where the rows themselves summed to 25/82.
//
// **Report only, never write.** `--tick` touches the same files after WO-2.15 that it touched
// before, and the roadmap dashboard is not one of them — a tool that silently corrects a summary is
// how the summary stops being read.

const DASHBOARD_HEADING = /^##\s+Progress dashboard/;
const ROADMAP_PHASE_HEADING = /^##\s+Phase\s+(\d+)\b/;

// Ticked and total boxes under each `## Phase N` heading, which is what the dashboard row claims.
function roadmapBoxCounts(lines) {
  const counts = new Map();
  let phase = null;
  for (const line of lines) {
    const h = ROADMAP_PHASE_HEADING.exec(line);
    if (h) { phase = h[1]; counts.set(phase, { done: 0, total: 0 }); continue; }
    if (/^##\s/.test(line)) { phase = null; continue; }
    const b = /^-\s*\[([ x])\]/.exec(line);
    if (b && phase !== null) {
      const c = counts.get(phase);
      c.total++;
      if (b[1] === 'x') c.done++;
    }
  }
  return counts;
}

// The rows of the `## Progress dashboard` table, scoped to that section so no other numbered table
// in the file can be read as one. `| 2 | Attendance | 🔨 IN PROGRESS | 12/16 `[…]` |`, and the
// overall row `| | | **Overall** | **28/82 `[…]`** |`.
function roadmapDashboardRows(lines) {
  let from = lines.findIndex(l => DASHBOARD_HEADING.test(l));
  const rows = new Map();
  let overall = null;
  if (from < 0) return { rows, overall, found: false };
  for (let i = from + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) break;
    const cells = lines[i].split('|');
    if (cells.length < 5) continue;
    if (/\*\*Overall\*\*/.test(lines[i])) {
      const m = /\*\*(\d+)\s*\/\s*(\d+)/.exec(lines[i]);
      if (m) overall = { line: i, done: +m[1], total: +m[2] };
      continue;
    }
    const p = /^\s*(\d+)\s*$/.exec(cells[1]);
    if (!p) continue;
    const m = /(\d+)\s*\/\s*(\d+)/.exec(cells[4]);
    if (m) rows.set(p[1], { line: i, done: +m[1], total: +m[2] });
  }
  return { rows, overall, found: true };
}

// Every disagreement, with both numbers on every line — a drift report that says "does not match" is
// a second thing to go and look up.
function roadmapDashboardDrift(roadmapText) {
  const lines = roadmapText.split('\n');
  const counts = roadmapBoxCounts(lines);
  const { rows, overall, found } = roadmapDashboardRows(lines);
  const problems = [];
  if (!found) return ['ROADMAP.md has no `## Progress dashboard` section — nothing to check against'];

  let sumDone = 0, sumTotal = 0, boxDone = 0, boxTotal = 0;
  for (const [phase, c] of counts) {
    boxDone += c.done; boxTotal += c.total;
    const row = rows.get(phase);
    if (!row) { problems.push(`the boxes under "## Phase ${phase}" count ${c.done}/${c.total}, and the dashboard has no row for that phase`); continue; }
    if (row.done !== c.done || row.total !== c.total) {
      problems.push(`Phase ${phase}: the dashboard row says ${row.done}/${row.total}, the boxes under "## Phase ${phase}" say ${c.done}/${c.total} (ROADMAP.md:${row.line + 1})`);
    }
  }
  for (const [phase, row] of rows) {
    sumDone += row.done; sumTotal += row.total;
    if (!counts.has(phase)) problems.push(`the dashboard has a row for Phase ${phase} reading ${row.done}/${row.total}, and there is no "## Phase ${phase}" heading in the file`);
  }
  if (!overall) {
    problems.push('the dashboard has no **Overall** row — the rows sum to ' + `${sumDone}/${sumTotal}`);
  } else {
    if (overall.done !== sumDone || overall.total !== sumTotal) {
      problems.push(`Overall: the row says ${overall.done}/${overall.total}, its own rows sum to ${sumDone}/${sumTotal} (ROADMAP.md:${overall.line + 1})`);
    }
    if (overall.done !== boxDone || overall.total !== boxTotal) {
      problems.push(`Overall: the row says ${overall.done}/${overall.total}, the boxes in the file count ${boxDone}/${boxTotal} (ROADMAP.md:${overall.line + 1})`);
    }
  }
  return problems;
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
  const rm = held ? { edits: [], notes: [], blockers: [], fragments: [] } : roadmapEdits(wo, roadmapText);
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

  // The second refusal, and the one WO-2.15 added. Everything above has been reported; nothing below
  // this line ticks anything either. It comes before every write, including the status line: an
  // Acceptance list holds a work order open because the WORK is unfinished and 🔨 IN PROGRESS is the
  // true thing to write, whereas a fragment that closes no box or a dashboard that does not add up
  // says the tracker is wrong about itself — and there is no status that makes that true. So this
  // one writes nothing at all and asks for a human.
  const blockers = [...rm.blockers];
  for (const k of wo.strayRoadmapLines) {
    blockers.push(`a **Closes/Amends roadmap** line at ${path.relative(REPO, wo.file)}:${k + 1} is below the header paragraph, where nothing in this script can see it — move it up into the paragraph`);
  }
  // The roadmap dashboard rides the ordinary run rather than --self-check: --self-check plants
  // violations and tests the TOOL, this checks the DOCUMENTS. Same HELD-versus-NOTE call as the
  // zero-match fragment above, and the same answer, for the narrower reason that this is the one
  // moment the tool is trusted to leave the trackers true. It is read BEFORE the writes, so a run
  // never refuses over drift it created itself — and after a clean tick it prints the row the manual
  // step now owes, because "report only" should still mean the human's next keystroke is obvious.
  const driftBefore = roadmapDashboardDrift(roadmapText);
  for (const d of driftBefore) blockers.push(`ROADMAP.md's progress dashboard has drifted — ${d}`);

  if (blockers.length) {
    console.log('');
    console.log(`HELD | ${id}'s Acceptance list is complete, and the trackers it writes into are not:`);
    for (const b of blockers) console.log(`  ${b}`);
    console.log('');
    console.log('NOTE | nothing was written — not the status line, not a roadmap box, not either dashboard.');
    console.log('NOTE | the roadmap dashboard is never written by this tool; it is ROADMAP.md\'s own maintenance step 3. Fix it by hand, then run this again. `--audit` lists every fragment and every row in one pass.');
    return 1;
  }

  // Say how many lines were read, not just that none of them was open: "all 0 lines are ticked" is
  // what a parser that found nothing would print, and it should be visible rather than inferred.
  if (wo.acceptance) console.log(`NOTE | all ${wo.acceptance.length} Acceptance lines are ticked — nothing holds ${id} open`);
  for (const m of rm.notes) console.log(`NOTE | roadmap: ${m}`);
  if (!rm.fragments.length) {
    console.log(wo.closesRoadmap
      ? 'NOTE | this work order\'s **Closes roadmap** line quotes no box — no roadmap box to tick'
      : 'NOTE | this work order has no **Closes roadmap** line — no roadmap box to tick');
  }

  if (!dryRun) {
    fs.writeFileSync(wo.file, phaseLines.join('\n'));
    if (rm.edits.length) fs.writeFileSync(ROADMAP, roadmapLines.join('\n'));
  }

  // Report only, and the reason this is worth printing rather than just refusing next time: ticking
  // a roadmap box is what makes that phase's dashboard row stale, so the run that causes the drift
  // is the one that can name it exactly. The hand edit is ROADMAP.md's maintenance step 3.
  for (const d of roadmapDashboardDrift(roadmapLines.join('\n'))) {
    console.log(`NOTE | ROADMAP.md's dashboard now owes a hand edit — ${d}`);
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

// ---------------------------------------------------------------------------- audit
//
// The standing sweep over the two trackers, read-only. Both halves of it exist because the same rot
// was found twice in one week and both times by a human reading source rather than by anything here:
// a **Closes roadmap** fragment quoted from a box that has since been reworded fails silently and
// only at tick time, which is the worst possible moment to find out, and the roadmap's progress
// dashboard had drifted on three rows and its own total.
//
// It is a flag on this script rather than a script of its own, per plans/verification-tooling.md:
// no tools/lib/, no second harness. It writes nothing.
function audit(wos) {
  const roadmapText = read(ROADMAP);
  const lines = roadmapText.split('\n');
  let fragments = 0, bad = 0, withField = 0;

  console.log('**Closes roadmap** fragments, against ROADMAP.md');
  console.log('');
  for (const wo of wos.values()) {
    const where = `${path.relative(REPO, wo.file)}:${wo.headingLine}`;
    for (const k of wo.strayRoadmapLines) {
      bad++;
      console.log(`  BAD  ${wo.id.padEnd(8)} a **Closes/Amends roadmap** line at ${path.relative(REPO, wo.file)}:${k + 1} is below the header paragraph — invisible to this script; move it into the paragraph`);
    }
    if (!wo.closesRoadmap) continue;
    withField++;
    const frags = [...wo.closesRoadmap.matchAll(/"([^"]+)"/g)].map(m => m[1]);
    if (!frags.length) {
      console.log(`  —    ${wo.id.padEnd(8)} **Closes roadmap** quotes no box: ${clip(wo.closesRoadmap, 70)}`);
      continue;
    }
    for (const frag of frags) {
      fragments++;
      const { tooShort, hits } = roadmapHits(frag, lines);
      if (tooShort) { bad++; console.log(`  BAD  ${wo.id.padEnd(8)} "${frag}" is too short to match safely — quote more of the box   (${where})`); continue; }
      if (hits.length !== 1) {
        bad++;
        console.log(`  BAD  ${wo.id.padEnd(8)} "${clip(frag, 70)}" matched ${hits.length} boxes — must match exactly one   (${where})`);
        continue;
      }
      const i = hits[0];
      console.log(`  ok   ${wo.id.padEnd(8)} ROADMAP.md:${String(i + 1).padEnd(4)} ${/^-\s*\[x\]/.test(lines[i]) ? '[x]' : '[ ]'} ${clip(frag, 62)}`);
    }
  }
  console.log('');
  console.log(`  ${wos.size} work orders, ${withField} with a **Closes roadmap** field, ${fragments} quoted fragments, ${bad} problem(s)`);

  console.log('');
  console.log('ROADMAP.md progress dashboard, against the boxes under each `## Phase N`');
  console.log('');
  const counts = roadmapBoxCounts(lines);
  const { rows, overall } = roadmapDashboardRows(lines);
  for (const [phase, c] of counts) {
    const row = rows.get(phase);
    const ok = row && row.done === c.done && row.total === c.total;
    console.log(`  ${ok ? 'ok  ' : 'BAD '} Phase ${phase}   row ${row ? `${row.done}/${row.total}` : '(none)'}   boxes ${c.done}/${c.total}`);
  }
  let sumDone = 0, sumTotal = 0;
  for (const r of rows.values()) { sumDone += r.done; sumTotal += r.total; }
  console.log(`  ${overall ? `overall row ${overall.done}/${overall.total}` : 'no overall row'}   rows sum ${sumDone}/${sumTotal}`);
  const drift = roadmapDashboardDrift(roadmapText);
  console.log('');
  for (const d of drift) console.log(`FAIL | ${d}`);

  const problems = bad + drift.length;
  console.log('');
  console.log(problems
    ? `FAIL | ${problems} problem(s) across the two trackers. Nothing was written; all of it is a hand edit.`
    : 'PASS | every fragment matches exactly one roadmap box, and every dashboard row matches its own boxes.');
  return problems ? 1 : 0;
}

// ---------------------------------------------------------------------------- self-check
//
// The standing version of what WO-2.14 proved by hand and then lost. Every one of its ten acceptance
// lines was proved by planting a violation and watching the script refuse; every plant was unwound
// the same hour, and the evidence lives in a dispatch transcript nobody will find in November. So
// the plants live here: copy plans/ to a temp directory, plant each violation, run the script
// against the copy, and fail if any of them stops being caught.
//
// It is a flag in the file it checks, not tools/wo-selfcheck.mjs, per plans/verification-tooling.md.
//
// THE TEMP COPY IS THE ONLY FIXTURE, and getting that wrong is the worst bug this file could carry.
// Every path a plant writes goes through plantWrite(), which refuses anything inside REPO — not
// belt-and-braces: WO-2.15 was itself 🔨 IN PROGRESS while this was being written, so a plant that
// escaped into the real plans/ would have corrupted a live work order and looked hand-written
// afterwards. There is no --dry-run in that guard on purpose; the next edit to this code would be
// the one that removes the flag.
//
// THE FIXTURE IS SYNTHETIC ON PURPOSE. WO-2.15's own acceptance list had to be re-cut twice because
// it named real work orders as fixtures and both were spent the same week — WO-2.5 shipped and can
// no longer be ticked, and the three wrong dashboard rows were corrected by hand. A work order this
// function writes into the copy itself cannot be spent, and does not go stale when the trackers move.
//
// WHAT IT DOES NOT COVER, printed by the run because a green check trusted for what it never touched
// is worse than no check: the Acceptance parser against the real work orders, gate()'s dependency
// and ordering walk, `next`'s ordering, recomputeDashboard()'s arithmetic beyond one row and one
// total, --audit against the real trackers, and every word of every real work order. It checks the
// handful of behaviours WO-2.14 and WO-2.15 built, against one work order it made up.

const FIXTURE_ID = 'WO-9.9';
const FIXTURE_FILE = 'phase-3-gradebook.md';
const FIXTURE_PHASE = '3';
const FIXTURE_BOX = 'self-check fixture box, planted in a temp copy and never in the repository';

function fixtureBlock({ status, fragment, open }) {
  return `
---

## ${FIXTURE_ID} — self-check fixture

**Ship** — · **Status** ${status} · **Size** S · **Depends on** nothing
**Closes roadmap** Phase ${FIXTURE_PHASE} → "${fragment}"

**Why it exists.** \`wo-gate.mjs --self-check\` writes this into a temp copy of \`plans/\` and deletes
it with the copy. **If you are reading this inside the repository, a self-check died before its
cleanup ran** — delete this block and the matching fixture box in \`ROADMAP.md\`. Nothing depends on
either, and nothing else in the repository mentions ${FIXTURE_ID}.

**Acceptance**
- [x] the first line, ticked
- [${open ? ' ' : 'x'}] the second line, which one plant unticks
`;
}

// Nothing inside the repository, ever. Called on every path a plant writes.
function assertOutsideRepo(p) {
  const r = path.resolve(p);
  if (r === REPO || r.startsWith(REPO + path.sep)) {
    throw new Error(`--self-check refused to write inside the repository: ${r}`);
  }
  return r;
}

function selfCheck(subjectPath) {
  const subject = path.resolve(subjectPath);
  if (!fs.existsSync(subject)) { console.error(`FAIL | --self-check --against: no such file "${subject}"`); return 1; }

  const sandbox = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'wo-gate-selfcheck-'));
  try {
    return runPlants(subject, sandbox);
  } finally {
    // Both exit paths, including the throwing one: the plants are corrupted tracker files and a
    // leftover copy of them is the next reader's confusing morning.
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
}

function runPlants(subject, sandbox) {
  const rel = p => path.join(sandbox, 'plans', p);
  const readSb = p => fs.readFileSync(rel(p), 'utf8');
  const plantWrite = (p, text) => fs.writeFileSync(assertOutsideRepo(rel(p)), text);

  // 1. The copy. The subject script goes in beside it, so the script under test resolves REPO to the
  //    sandbox and cannot reach the real plans/ even if every other guard here were wrong.
  fs.mkdirSync(path.join(sandbox, 'tools'));
  fs.copyFileSync(subject, assertOutsideRepo(path.join(sandbox, 'tools', 'wo-gate.mjs')));
  fs.cpSync(path.join(REPO, 'plans'), assertOutsideRepo(path.join(sandbox, 'plans')), { recursive: true });

  // 2. The fixture's roadmap box, and the dashboard row it moves. Added before the snapshot so the
  //    copy is self-consistent: a box added without its row would be drift, and the drift plant
  //    below has to be the only thing that puts drift in this copy.
  {
    const lines = readSb('ROADMAP.md').split('\n');
    const at = lines.findIndex(l => ROADMAP_PHASE_HEADING.test(l) && ROADMAP_PHASE_HEADING.exec(l)[1] === FIXTURE_PHASE);
    if (at < 0) throw new Error(`--self-check found no "## Phase ${FIXTURE_PHASE}" heading in ROADMAP.md`);
    let box = -1;
    for (let i = at + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) {
      if (/^-\s*\[[ x]\]/.test(lines[i])) { box = i; break; }
    }
    if (box < 0) throw new Error(`--self-check found no boxes under "## Phase ${FIXTURE_PHASE}"`);
    lines.splice(box, 0, `- [ ] ${FIXTURE_BOX}`);          // before the first box: never inside a wrap
    const { rows, overall } = roadmapDashboardRows(lines);
    const bump = (i, m) => { lines[i] = lines[i].replace(m, (s, d, t) => s.replace(`${d}/${t}`, `${d}/${+t + 1}`)); };
    bump(rows.get(FIXTURE_PHASE).line, /(\d+)\s*\/\s*(\d+)/);
    bump(overall.line, /\*\*(\d+)\s*\/\s*(\d+)/);
    plantWrite('ROADMAP.md', lines.join('\n'));
  }

  // 2b. A Ship 1 row for the fixture, so `next` has something to step over. Every real row in that
  //     table is ✅ DONE, so a run against the copy without this would exercise nothing.
  {
    const p = path.join('work-orders', 'README.md');
    const lines = readSb(p).split('\n');
    let last = -1;
    for (let i = 0; i < lines.length; i++) if (/^\|\s*\d+\s*\|\s*\[(WO-[\dG][\w.]*)\]/.test(lines[i])) last = i;
    if (last < 0) throw new Error('--self-check found no Ship 1 table in work-orders/README.md');
    lines.splice(last + 1, 0, `| 99 | [${FIXTURE_ID}](${FIXTURE_FILE}#wo-99--self-check-fixture) self-check fixture | S | | — |`);
    plantWrite(p, lines.join('\n'));
  }

  // 3. The pristine state every plant is reset to — the copy WITHOUT the fixture work order, so each
  //    plant writes the whole fixture rather than editing the last one's leavings.
  const snapshot = () => {
    const files = new Map();
    const walk = dir => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p); else files.set(path.relative(path.join(sandbox, 'plans'), p), fs.readFileSync(p, 'utf8'));
      }
    };
    walk(path.join(sandbox, 'plans'));
    return files;
  };
  const pristine = snapshot();
  const basePhase = readSb(path.join('work-orders', FIXTURE_FILE));
  const changedSince = snap => {
    const now = snapshot(), out = [];
    for (const [f, text] of now) if (!snap.has(f) || snap.get(f) !== text) out.push(f);
    for (const f of snap.keys()) if (!now.has(f)) out.push(`${f} (deleted)`);
    return out;
  };
  const reset = opts => {
    for (const [f, text] of pristine) plantWrite(f, text);
    plantWrite(path.join('work-orders', FIXTURE_FILE), basePhase + fixtureBlock(opts));
  };

  const run = args => {
    const r = spawnSync(process.execPath, [path.join(sandbox, 'tools', 'wo-gate.mjs'), ...args],
                        { cwd: sandbox, encoding: 'utf8' });
    return { code: r.status === null ? 1 : r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
  };

  // Readers over the copy, deliberately independent of the parser above: the subject is what is
  // being tested, so nothing here may ask it what it wrote.
  const fixtureStatus = () => {
    const m = new RegExp(`## ${FIXTURE_ID} —[\\s\\S]*?\\*\\*Status\\*\\*\\s*([^·\\n]*)`).exec(readSb(path.join('work-orders', FIXTURE_FILE)));
    return m ? m[1].trim() : '(no status line)';
  };
  const fixtureBoxLine = () => readSb('ROADMAP.md').split('\n').find(l => l.includes(FIXTURE_BOX) && /^-\s*\[/.test(l)) || '';
  const readmeRow = () => (readSb(path.join('work-orders', 'README.md')).split('\n').find(l => /^\|\s*3 —/.test(l)) || '').split('|');

  const OK = '⬜ NOT STARTED', RUN = '🔨 IN PROGRESS';
  const plants = [
    {
      name: 'an unticked Acceptance line holds --tick at 🔨 IN PROGRESS instead of ✅ DONE',
      run: () => {
        reset({ status: RUN, fragment: FIXTURE_BOX, open: true });
        const before = snapshot();
        const r = run(['--tick', FIXTURE_ID]);
        const bad = [];
        if (r.code === 0) bad.push('--tick exited 0 over an open Acceptance line');
        if (!/HELD/.test(r.out)) bad.push('the run never said HELD');
        if (!/the second line/.test(r.out)) bad.push('the run did not name the line that held it open');
        if (/✅ DONE/.test(fixtureStatus())) bad.push(`it wrote "${fixtureStatus()}" over an open Acceptance list`);
        if (/^-\s*\[x\]/.test(fixtureBoxLine())) bad.push('it ticked the roadmap box of an unfinished work order');
        if (changedSince(before).some(f => f.endsWith('README.md'))) bad.push('it moved a dashboard');
        return bad;
      },
    },
    {
      name: 'a second --start on a claimed work order is refused',
      run: () => {
        reset({ status: OK, fragment: FIXTURE_BOX, open: false });
        const bad = [];
        const unclaimed = snapshot();
        const first = run(['--start', FIXTURE_ID]);
        if (first.code !== 0) bad.push(`the first --start exited ${first.code}: ${clip(first.out.trim(), 120)}`);
        if (!fixtureStatus().startsWith(RUN)) bad.push(`the first --start left the status at "${fixtureStatus()}"`);
        // A claim is not progress: both dashboards count ✅ DONE and nothing else.
        const moved = changedSince(unclaimed).filter(f => !f.endsWith(FIXTURE_FILE));
        if (moved.length) bad.push(`a claim moved ${moved.join(', ')} — it may only touch the work order's own status line`);
        const before = snapshot();
        const second = run(['--start', FIXTURE_ID]);
        if (second.code === 0) bad.push('a second --start on the same ID exited 0');
        if (changedSince(before).length) bad.push(`the refused --start still wrote ${changedSince(before).join(', ')}`);
        return bad;
      },
    },
    {
      name: '--start on ✅ DONE, 🚧 BLOCKED and 🔒 GATED is refused, and writes nothing',
      run: () => {
        const bad = [];
        for (const status of ['✅ DONE — 2026-01-01', '🚧 BLOCKED', '🔒 GATED — waiting on a fixture']) {
          reset({ status, fragment: FIXTURE_BOX, open: false });
          const before = snapshot();
          const r = run(['--start', FIXTURE_ID]);
          if (r.code === 0) bad.push(`--start on a "${status}" work order exited 0`);
          const changed = changedSince(before);
          if (changed.length) bad.push(`--start on "${status}" wrote ${changed.join(', ')}`);
        }
        return bad;
      },
    },
    {
      name: '--release refuses what nobody claimed, and returns a claimed one to ⬜ NOT STARTED',
      run: () => {
        const bad = [];
        reset({ status: OK, fragment: FIXTURE_BOX, open: false });
        const before = snapshot();
        const r = run(['--release', FIXTURE_ID]);
        if (r.code === 0) bad.push('--release on a ⬜ NOT STARTED work order exited 0');
        if (changedSince(before).length) bad.push(`it wrote ${changedSince(before).join(', ')}`);

        // The way back, which is the whole reason --release exists: a dispatch that died mid-flight
        // leaves a claim behind, and `next` steps over it forever.
        reset({ status: RUN, fragment: FIXTURE_BOX, open: false });
        const claimed = snapshot();
        const back = run(['--release', FIXTURE_ID]);
        if (back.code !== 0) bad.push(`--release on a claimed work order exited ${back.code}: ${clip(back.out.trim(), 120)}`);
        if (!fixtureStatus().startsWith(OK)) bad.push(`--release left the status at "${fixtureStatus()}"`);
        const moved = changedSince(claimed).filter(f => !f.endsWith(FIXTURE_FILE));
        if (moved.length) bad.push(`--release also wrote ${moved.join(', ')}`);
        return bad;
      },
    },
    {
      name: '--dry-run on --start, --release and --tick writes nothing at all',
      run: () => {
        const bad = [];
        // The status each dry run must PRINT as its `+` line and must not WRITE. Reading the banner
        // is not enough — WO-2.14's own acceptance line says compare the file, don't trust the word.
        for (const [status, edit, args] of [[OK, RUN, ['--start', FIXTURE_ID, '--dry-run']],
                                            [RUN, OK, ['--release', FIXTURE_ID, '--dry-run']],
                                            [RUN, '✅ DONE', ['--tick', FIXTURE_ID, '--dry-run']]]) {
          reset({ status, fragment: FIXTURE_BOX, open: false });
          const before = snapshot();
          const r = run(args);
          if (r.code !== 0) bad.push(`${args[0]} --dry-run exited ${r.code}: ${clip(r.out.trim(), 120)}`);
          if (!/DRY RUN/.test(r.out)) bad.push(`${args[0]} --dry-run never said DRY RUN`);
          if (!r.out.split('\n').some(l => l.trim().startsWith('+') && l.includes(edit))) {
            bad.push(`${args[0]} --dry-run never printed the edit it would make (a "+" line reading ${edit})`);
          }
          const changed = changedSince(before);
          if (changed.length) bad.push(`${args[0]} --dry-run wrote ${changed.join(', ')}`);
        }
        return bad;
      },
    },
    {
      name: 'a fully ticked work order still gets ✅ DONE, its roadmap box, and the dashboard',
      run: () => {
        reset({ status: RUN, fragment: FIXTURE_BOX, open: false });
        const rowBefore = readmeRow();
        const r = run(['--tick', FIXTURE_ID]);
        const bad = [];
        if (r.code !== 0) bad.push(`--tick exited ${r.code} on a fully ticked work order: ${clip(r.out.trim(), 160)}`);
        if (!/✅ DONE — \d{4}-\d{2}-\d{2}/.test(fixtureStatus())) bad.push(`the status reads "${fixtureStatus()}"`);
        if (!/^-\s*\[x\]/.test(fixtureBoxLine())) bad.push('the roadmap box it closes was left unticked');
        const rowAfter = readmeRow();
        if (rowBefore.length < 5 || rowAfter.length < 5) bad.push('no Phase 3 row in the work-orders dashboard to read');
        else if (Number(rowAfter[3]) !== Number(rowBefore[3]) + 1) bad.push(`the dashboard Done cell went ${rowBefore[3].trim()} → ${rowAfter[3].trim()}, expected +1`);
        return bad;
      },
    },
    {
      name: 'a **Closes roadmap** fragment matching no box holds the tick and writes nothing',
      run: () => {
        reset({ status: RUN, fragment: 'a roadmap box that no line of ROADMAP.md contains', open: false });
        const before = snapshot();
        const r = run(['--tick', FIXTURE_ID]);
        const bad = [];
        if (r.code === 0) bad.push('--tick exited 0 on a work order whose fragment closes nothing');
        if (!/HELD/.test(r.out)) bad.push('the run never said HELD');
        if (!/matched 0/.test(r.out)) bad.push('the run did not say the fragment matched 0 boxes');
        const changed = changedSince(before);
        if (changed.length) bad.push(`it wrote ${changed.join(', ')}`);
        return bad;
      },
    },
    {
      // The claim outlives the run that made it, so a row that drops out of `next` in silence is a
      // work order lost from the running order while looking healthy. WO-2.14's tenth deliverable.
      name: '`next` names the claimed row it stepped over, and the way back',
      run: () => {
        const bad = [];
        reset({ status: RUN, fragment: FIXTURE_BOX, open: false });
        const claimed = run(['next']);
        if (!new RegExp(`skipped ${FIXTURE_ID}`).test(claimed.out)) bad.push('`next` stepped over a 🔨 IN PROGRESS row without naming it');
        if (!new RegExp(`--release ${FIXTURE_ID}`).test(claimed.out)) bad.push('`next` named the skip without the way back');
        reset({ status: OK, fragment: FIXTURE_BOX, open: false });
        const open = run(['next']);
        if (!new RegExp(`next: ${FIXTURE_ID}`).test(open.out)) bad.push('`next` did not offer the one ⬜ NOT STARTED row in the table');
        if (/skipped/.test(open.out)) bad.push('`next` reported a skip with nothing claimed');
        return bad;
      },
    },
    {
      name: "a wrong count in ROADMAP.md's dashboard holds the tick, with both numbers shown",
      run: () => {
        reset({ status: RUN, fragment: FIXTURE_BOX, open: false });
        const lines = readSb('ROADMAP.md').split('\n');
        const { rows } = roadmapDashboardRows(lines);
        const row = rows.get(FIXTURE_PHASE);
        const wrong = `${row.done + 7}/${row.total}`;
        lines[row.line] = lines[row.line].replace(/(\d+)\s*\/\s*(\d+)/, wrong);
        plantWrite('ROADMAP.md', lines.join('\n'));
        const before = snapshot();
        const r = run(['--tick', FIXTURE_ID]);
        const bad = [];
        if (r.code === 0) bad.push('--tick exited 0 with the roadmap dashboard three ways wrong');
        if (!/HELD/.test(r.out)) bad.push('the run never said HELD');
        if (!r.out.includes(wrong)) bad.push(`the run did not print the number the row carries (${wrong})`);
        if (!r.out.includes(`${row.done}/${row.total}`)) bad.push(`the run did not print the number the boxes count (${row.done}/${row.total})`);
        const changed = changedSince(before);
        if (changed.length) bad.push(`it wrote ${changed.join(', ')}`);
        return bad;
      },
    },
  ];

  console.log('--self-check');
  console.log(`  subject   ${subject}`);
  console.log(`  sandbox   ${sandbox}   (copied from ${path.relative(REPO, path.join(REPO, 'plans'))}, deleted on the way out)`);
  console.log(`  fixture   ${FIXTURE_ID}, written into the copy of ${FIXTURE_FILE} — no real work order is a fixture here`);
  console.log('');

  let failed = 0;
  for (const plant of plants) {
    const bad = plant.run();
    if (bad.length) {
      failed++;
      console.log(`FAIL | ${plant.name}`);
      for (const b of bad) console.log(`     | ${b}`);
    } else {
      console.log(`ok   | ${plant.name}`);
    }
  }

  console.log('');
  console.log(`  ${plants.length} plants, ${plants.length - failed} caught, ${failed} missed.`);
  console.log('  Covers only what WO-2.14 and WO-2.15 built: the two refusals, the three fences, the');
  console.log('  dry runs, one tick that works, and one skip. NOT covered: the Acceptance parser against');
  console.log('  the real work orders, gate()\'s dependency and hard-ordering walk, `next` over the real');
  console.log('  Ship 1 table, the rest of recomputeDashboard()\'s arithmetic, and --audit against the');
  console.log('  real trackers. A green run here is not coverage — it is nine claims about nine plants.');
  console.log('');
  console.log(failed ? `FAIL | ${failed} of ${plants.length} plants were not caught.`
                     : `PASS | ${plants.length} of ${plants.length} plants were caught.`);
  return failed ? 1 : 0;
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
  node tools/wo-gate.mjs --audit                        every **Closes roadmap** fragment against
                                                        ROADMAP.md, and its dashboard against its
                                                        own boxes. Reports; never writes
  node tools/wo-gate.mjs --self-check [--against <path>] plant every violation this script is
                                                        supposed to catch, in a temp copy of plans/,
                                                        and fail if one stops being caught

--start, --release and --tick write into plans/. Run each with --dry-run first and read the diff.
--start claims a work order so a second dispatch can see one is in flight; it moves no dashboard.
--tick reads the work order's own Acceptance list: any line still [ ] and it writes 🔨 IN PROGRESS
instead of ✅ DONE, names the lines, and leaves the roadmap alone. It also refuses, writing nothing,
when a **Closes roadmap** fragment closes no box or ROADMAP.md's dashboard does not match its own
boxes — both are the tracker being wrong about itself, and no status makes that true.
None of them touches a 👤 line in TESTING.md, and none touches CHANGELOG.md, and none of them
writes ROADMAP.md's progress dashboard — that stays a hand edit (ROADMAP.md, maintenance step 3).`);
  process.exit(0);
}

if (argv[0] === '--audit') process.exit(audit(wos));

// --against exists for one acceptance line and is worth the extra argument: "each plant is proved to
// be able to fail" is settled by restoring the pre-WO-2.14 script from git into a temp path and
// watching the plants go red against it — and that script has no --self-check of its own to run. So
// the harness and the subject are separable, and the subject defaults to this file.
if (argv[0] === '--self-check') {
  const i = argv.indexOf('--against');
  process.exit(selfCheck(i >= 0 && argv[i + 1] ? argv[i + 1] : fileURLToPath(import.meta.url)));
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
