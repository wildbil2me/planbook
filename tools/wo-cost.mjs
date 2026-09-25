#!/usr/bin/env node
// wo-cost.mjs — what each dispatch cost, from the transcripts.
//
//   node tools/wo-cost.mjs                     the table
//   node tools/wo-cost.mjs --detail WO-1.5     one work order, agent by agent
//   node tools/wo-cost.mjs --projects <dir>    transcripts live somewhere else
//   node tools/wo-cost.mjs --window            rolling-5h usage across EVERY project, beside the
//                                              reference points it is calibrated against (WO-1.39)
//   node tools/wo-cost.mjs --swapped           record an account swap, so the window count restarts
//
// WO-1.39's flags are about the WINDOW, not about a dispatch, and are read in their own section below
// — see "the window" for the unit, the swap marker, and why --window takes --root and not --projects.
//
// The pipeline's overhead is only arguable with numbers. This reads the session transcripts Claude
// Code already writes and decomposes each dispatch into implementation, orchestration, and
// verification — which is the split that says whether the premium is buying anything.
//
// Written because the same analysis was rebuilt from scratch four times in one afternoon, in a
// scratchpad, and thrown away each time. That is the same shape as the two throwaway browser
// harnesses that became verify-shell.mjs (plans/verification-tooling.md).
//
// **Output tokens and cached reads are never summed.** They bill at very different rates, and a
// single "tokens" number makes the pipeline look about ten times more expensive than it is.
// *(**--window does add them, and it is not an exception to that rule** (WO-1.39). The rule is about a
// RAW token total, which pretends a cached read and an output token are the same thing. The window
// figure is PRICE-WEIGHTED — output x5, cache-write x1.25, input x1, cache-read x0.1, the unit
// plans/session-limits.md defines — which is the one way of adding them that says they are not. It
// prints as a proxy, with its weights, and the table below stays unweighted and unsummed.)*
//
// Limitation, stated rather than discovered: the transcript path is per-user and per-machine, the
// same way verify-shell.mjs is Windows-browser-paths-only. Override it with --projects.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const argv = process.argv.slice(2);
const flag = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };

const PROJECTS = flag('--projects')
  || path.join(os.homedir(), '.claude', 'projects', 'c--dev-planbook');
const DETAIL = flag('--detail');

// The window's flags (WO-1.39). --swapped implies --window: recording a swap and not being shown what
// the count now reads would leave the caller to guess whether it took.
const SWAPPED = argv.includes('--swapped');
const WINDOW = SWAPPED || argv.includes('--window');
const LINE = argv.includes('--line');
const WINDOW_ROOT = path.resolve(flag('--root') || path.join(os.homedir(), '.claude', 'projects'));
const SWAP_FILE = path.join(path.dirname(WINDOW_ROOT), 'wo-cost-swap.json');

/* ────────────────────────────── the window (WO-1.39) ──────────────────────────────
   `--start` asks whether the gates are clear; this answers the other question — is there a window to
   fit a dispatch in. It is ADVISORY by construction: it returns a report, and nothing in this file or
   in wo-gate.mjs refuses on the number. The threshold is the owner's and the unit is a proxy, so a
   tool that refused on either would be a second opinion with a worse instrument.

   THE UNIT IS A PROXY and every place it prints says so. Weighted exactly as plans/session-limits.md
   defines it, because the two reference points were measured in it and a figure in any other unit
   would sit beside them meaning nothing. It is calibrated against this project's own session-limit
   deaths, never against a published ceiling, and the ceiling itself moved whenever the plan did.

   IT COUNTS EVERY TRANSCRIPT LINE THAT CARRIES USAGE, duplicates included, and that is measured rather
   than lazy. A streamed response writes one line per content block and each carries the same usage,
   so roughly half the lines in a week of transcripts repeat a (message.id, requestId) pair already
   seen. Deduplicating is the "correct" sum — and it reads WO-5.5 at 3.6M and WO-5.2 at 9.1M, where
   session-limits.md's table says 6.8 and 15.7. Counting every line reproduces that table to the
   decimal, all eight rows. So the calibration counted duplicates, and a deduplicated figure beside it
   would under-read by about half against its own reference points — the one direction this
   instrument must not err in. Change both or neither.

   EVERY DIRECTORY under the root, not this project's. The window is the account's, and a project-
   scoped reading is invisible to the other sessions burning it. One consequence, stated rather than
   discovered: the death cluster was measured over c--dev-planbook alone, so an all-projects figure
   reads at or above the scale the cluster was taken on. That errs early, which is the safe way.

   A ZERO THAT MEANS "NO DATA" MUST NOT LOOK LIKE ONE THAT MEANS "FRESH WINDOW" (WO-2.4's round-two
   defect: a check that cannot run and a check that cannot fail are the same defect in different
   signs). So a missing, unreadable or empty root EXITS 1 with a message, a root that is one project's
   directory rather than the directory holding them is refused as an under-read, and a genuine fresh
   window is said in words. This file never formats a figure as `0.0M` — below 0.05M it prints K.

   AN ACCOUNT SWAP MAKES THE COUNT OVER-READ and nothing in a transcript records one — no line names
   the account that served it. So the swap is recorded by a person: `--swapped` writes a timestamp to
   SWAP_FILE, and the rolling sum starts at whichever is later, that timestamp or five hours ago. The
   marker lives BESIDE the transcript root rather than in this repository (it is a fact about the
   account, not about the code, and would otherwise be one commit from being shared) and rather than
   anywhere of its own (so a --root pointed at a fixture tree takes its own marker with it, and a
   self-check can never write into a real ~/.claude). It expires by itself: a swap five hours old
   restarts nothing, so there is no command to clear it and no state to forget about. */

const WEIGHTS = { output: 5, cacheWrite: 1.25, input: 1, cacheRead: 0.1 };
const WINDOW_MS = 5 * 3600e3;

// The reference points, from plans/session-limits.md § "2. A large work order is most of a window on
// its own" (measured 2026-08-29). Read the death figures as the size of the hole, never as a wall.
const REFERENCE = { medianDispatch: 6.0e6, deathP25: 16.4e6, deathMedian: 20.3e6 };

const SWAP_CMD = 'node tools/wo-cost.mjs --swapped';

// Never `0.0M`: below 0.05M a toFixed(1) would print exactly the zero the trap forbids, about a
// window that is not empty.
function units(v) {
  if (v >= 0.05e6) return `${(v / 1e6).toFixed(1)}M`;
  return v >= 500 ? `${Math.round(v / 1e3)}K` : '<1K';
}

function clock(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function weigh(u) {
  return WEIGHTS.output * (u.output_tokens || 0)
       + WEIGHTS.cacheWrite * (u.cache_creation_input_tokens || 0)
       + WEIGHTS.input * (u.input_tokens || 0)
       + WEIGHTS.cacheRead * (u.cache_read_input_tokens || 0);
}

// A refusal, in the shape every other refusal in tools/ has. Returns the exit code so the caller can
// `return fail(...)` — --window's whole contract is that this path is never a number.
function fail(...lines) {
  console.error(`FAIL | ${lines[0]}`);
  for (const l of lines.slice(1)) console.error(`       ${l}`);
  return 1;
}

function readSwap(now) {
  if (!fs.existsSync(SWAP_FILE)) return { at: null };
  try {
    const at = Date.parse(JSON.parse(fs.readFileSync(SWAP_FILE, 'utf8')).at);
    if (!Number.isFinite(at)) return { at: null, broken: 'it holds no readable "at" timestamp' };
    if (at > now + 60e3) return { at: null, broken: `its timestamp ${new Date(at).toISOString()} is in the future` };
    return { at };
  } catch (err) {
    return { at: null, broken: err.message };
  }
}

function windowReport() {
  const t0 = Date.now();

  // 1. The root, before anything is written or summed.
  let top;
  try {
    if (!fs.statSync(WINDOW_ROOT).isDirectory()) return fail(`${WINDOW_ROOT} is not a directory`, 'Pass --root <dir> — the directory holding every project\'s transcripts.');
    top = fs.readdirSync(WINDOW_ROOT, { withFileTypes: true });
  } catch (err) {
    return fail(`no readable transcript directory at ${WINDOW_ROOT} (${err.code || err.message})`,
                'The path is per-user and per-machine. Pass --root <dir> — the directory holding every project\'s transcripts.',
                'Nothing was measured, so there is no figure to print — not even a zero.');
  }
  if (top.some(e => e.isFile() && e.name.endsWith('.jsonl'))) {
    return fail(`${WINDOW_ROOT} holds transcripts directly — it looks like ONE project's directory, not the directory holding them all`,
                'A project-scoped reading under-reads: every other project burns the same window. Pass --root its parent.');
  }
  const projects = top.filter(e => e.isDirectory()).map(e => e.name).sort();

  // 2. The swap, recorded before the read so the report below is the count it restarted.
  if (SWAPPED) {
    try {
      fs.writeFileSync(SWAP_FILE, JSON.stringify({ at: new Date(t0).toISOString(), by: SWAP_CMD }, null, 2) + '\n');
    } catch (err) {
      return fail(`could not record the swap at ${SWAP_FILE} (${err.code || err.message})`);
    }
  }
  const now = Date.now();
  const swap = readSwap(now);
  const swapActive = swap.at !== null && swap.at > now - WINDOW_MS;
  const from = swapActive ? swap.at : now - WINDOW_MS;

  // 3. Every .jsonl under every project, stat'ed; only those touched inside the window are parsed.
  //    A file last written before `from` cannot hold a line inside it, and this runs on every --start.
  let files = 0, newest = 0;
  const fresh = [];
  const walk = (dir, project) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p, project); continue; }
      if (!e.name.endsWith('.jsonl')) continue;
      files++;
      const m = fs.statSync(p).mtimeMs;
      if (m > newest) newest = m;
      if (m >= from) fresh.push({ p, project });
    }
  };
  try {
    for (const name of projects) walk(path.join(WINDOW_ROOT, name), name);
  } catch (err) {
    return fail(`could not walk ${WINDOW_ROOT} (${err.code || err.message} at ${err.path || '?'})`,
                'A walk that skipped a directory would under-read, which is worse than not measuring.');
  }
  if (!files) {
    return fail(`no transcripts anywhere under ${WINDOW_ROOT} — ${projects.length} project director${projects.length === 1 ? 'y' : 'ies'}, 0 .jsonl files`,
                'An empty path is no data, not a fresh window. Pass --root <dir> if your transcripts live elsewhere.');
  }

  // 4. The sum. Every line carrying usage, inside [from, now] by its own timestamp — see the section
  //    comment for why duplicates are counted.
  let total = 0, lines = 0;
  const byProject = new Map();
  for (const { p, project } of fresh) {
    let text;
    try { text = fs.readFileSync(p, 'utf8'); }
    catch (err) { return fail(`could not read ${p} (${err.code || err.message})`, 'A skipped transcript would under-read, which is worse than not measuring.'); }
    for (const line of text.split('\n')) {
      if (!line.includes('"usage"')) continue;
      let e; try { e = JSON.parse(line); } catch { continue; }
      const u = e.message?.usage;
      const at = Date.parse(e.timestamp);
      if (!u || !Number.isFinite(at) || at < from || at > now) continue;
      const w = weigh(u);
      total += w; lines++;
      byProject.set(project, (byProject.get(project) || 0) + w);
    }
  }

  // 5. The line. Number, unit-as-proxy, reference points and the swap mechanism all on ONE line,
  //    because it is the line wo-gate.mjs --start prints and each of the four is owed where the
  //    number is (WO-1.39, Acceptance 2 and 4).
  const active = byProject.size;
  const scope = `${projects.length} project dir${projects.length === 1 ? '' : 's'} (${active} active)`;
  const since = swapActive ? `since the swap recorded ${clock(swap.at)}` : 'rolling 5h';
  const figure = total > 0
    ? `${units(total)} proxy units, ${since}, ${scope}`
    : `nothing used ${swapActive ? `since the swap recorded ${clock(swap.at)}` : 'in the last 5h'} — newest transcript ${now - newest < 3600e3 ? `${Math.round((now - newest) / 60e3)} min` : `${((now - newest) / 3600e3).toFixed(1)}h`} old, ${scope}; proxy units`;
  const ref = `median dispatch ${units(REFERENCE.medianDispatch)}, deaths from ${units(REFERENCE.deathP25)} (p25) / ${units(REFERENCE.deathMedian)} (median)`;
  const swapPart = swapActive ? `count restarted by ${SWAP_CMD}`
                 : `swapped accounts? ${SWAP_CMD}`;
  const one = `window  ${figure} · ${ref} · ${swapPart}${swap.broken ? ' · swap marker unreadable, ignored' : ''}`;

  if (LINE) { console.log(one); return 0; }

  const ms = Date.now() - t0;
  console.log(one);
  console.log('');
  if (SWAPPED) console.log(`  swap      RECORDED at ${clock(swap.at)} — ${SWAP_FILE}`);
  console.log('  unit      a PROXY, not a vendor number: output x5 + cache-write x1.25 + input x1 + cache-read x0.1,');
  console.log('            summed over every transcript line that carries usage. Calibrated against this project\'s');
  console.log('            own session-limit deaths (plans/session-limits.md), never against a published ceiling,');
  console.log('            and it moved whenever the plan did. Read 20.3M as the size of the hole, not a wall.');
  console.log('  counted   duplicate lines too: a streamed response repeats its usage on each content block, and');
  console.log('            the calibration counted them all — a deduplicated figure would read about half and');
  console.log('            under-read against its own reference points.');
  console.log(`  window    ${clock(from)} → ${clock(now)}${swapActive ? ' — starts at the recorded swap, not 5h ago' : ' — rolling 5h'}`);
  if (swapActive) {
    console.log(`  swap      active: ${SWAP_FILE}`);
    console.log(`            expires by itself at ${clock(swap.at + WINDOW_MS)}; re-run ${SWAP_CMD} at the next swap.`);
  } else if (swap.broken) {
    console.log(`  swap      marker at ${SWAP_FILE} ignored — ${swap.broken}. The count is NOT restarted.`);
  } else {
    console.log(`  swap      none active. After switching accounts, ${SWAP_CMD} restarts the count;`);
    console.log(`            it writes ${SWAP_FILE} and expires by itself 5h later.`);
    if (swap.at !== null) console.log(`            (last recorded ${new Date(swap.at).toISOString()}, outside the window)`);
  }
  for (const [name, w] of [...byProject].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${units(w).padStart(8)}  ${name}`);
  }
  console.log(`  read      ${projects.length} project directories, ${files} transcript files, ${fresh.length} touched inside the window, ${lines} usage lines — ${ms} ms`);
  console.log('');
  console.log('Advisory. Nothing refuses on this figure — the threshold is the owner\'s, and this does not read /usage.');
  return 0;
}

if (argv.includes('--help') || argv.includes('-h')) {
  console.log(`wo-cost.mjs — what each dispatch cost

  node tools/wo-cost.mjs                     per-work-order decomposition
  node tools/wo-cost.mjs --detail WO-1.5     one work order, agent by agent
  node tools/wo-cost.mjs --projects <dir>    transcripts elsewhere
  node tools/wo-cost.mjs --window            rolling-5h usage across every project, in a PROXY
                                             unit, beside the median dispatch and the death cluster
  node tools/wo-cost.mjs --window --line     the same, as the one line wo-gate.mjs --start prints
  node tools/wo-cost.mjs --swapped           record an account swap: the window count restarts now
  node tools/wo-cost.mjs --window --root <dir>
                                             the directory HOLDING every project's transcripts —
                                             not one project's, which is what --projects names

Reads Claude Code session transcripts. Default location:
  ${PROJECTS}
The window reads every directory under:
  ${WINDOW_ROOT}
and keeps its swap marker beside that directory, at:
  ${SWAP_FILE}

The window figure is advisory. Nothing refuses on it; the threshold is the owner's.`);
  process.exit(0);
}

if (WINDOW) process.exit(windowReport());

if (!fs.existsSync(PROJECTS)) {
  console.error(`FAIL | no transcript directory at ${PROJECTS}`);
  console.error('       Pass --projects <dir> if your Claude Code transcripts live elsewhere.');
  process.exit(1);
}

/* ────────────────────────────── read the agent runs ────────────────────────────── */

const STAGE = {
  'work-order-orchestrator': 'orchestration',
  'work-order-implementer': 'implementation',
  'work-order-verifier': 'verification',
};

function readAgent(metaPath) {
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const jsonl = metaPath.replace(/\.meta\.json$/, '.jsonl');
  if (!fs.existsSync(jsonl)) return null;

  let out = 0, cacheRead = 0, cacheWrite = 0, freshIn = 0, turns = 0, peak = 0;
  let first = null, last = null, verdict = '';
  const tools = {};

  for (const line of fs.readFileSync(jsonl, 'utf8').split('\n')) {
    if (!line) continue;
    let e; try { e = JSON.parse(line); } catch { continue; }

    if (e.timestamp) {
      if (!first || e.timestamp < first) first = e.timestamp;
      if (!last || e.timestamp > last) last = e.timestamp;
    }
    const u = e.message?.usage;
    if (u) {
      turns++;
      out += u.output_tokens || 0;
      cacheRead += u.cache_read_input_tokens || 0;
      cacheWrite += u.cache_creation_input_tokens || 0;
      freshIn += u.input_tokens || 0;
      const ctx = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
      if (ctx > peak) peak = ctx;
    }
    const c = e.message?.content;
    if (Array.isArray(c)) {
      for (const b of c) if (b.type === 'tool_use') tools[b.name] = (tools[b.name] || 0) + 1;
      const text = c.filter(b => b.type === 'text').map(b => b.text).join('');
      if (text.length > 400) verdict = text;          // last substantial message wins
    }
  }

  return {
    id: path.basename(metaPath).replace(/^agent-|\.meta\.json$/g, ''),
    type: meta.agentType,
    stage: STAGE[meta.agentType] || 'other',
    desc: meta.description || '',
    parent: meta.parentAgentId || null,
    depth: meta.spawnDepth,
    first, last,
    minutes: first && last ? (new Date(last) - new Date(first)) / 60000 : 0,
    turns, out, cacheRead, cacheWrite, freshIn, peak, tools, verdict,
  };
}

const agents = [];
for (const session of fs.readdirSync(PROJECTS)) {
  const dir = path.join(PROJECTS, session, 'subagents');
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.meta.json'))) {
    const a = readAgent(path.join(dir, f));
    if (a && STAGE[a.type]) agents.push(a);
  }
}
agents.sort((a, b) => String(a.first).localeCompare(String(b.first)));

if (!agents.length) {
  console.error(`FAIL | no work-order agent transcripts under ${PROJECTS}`);
  process.exit(1);
}

/* ────────────────────────────── group by work order ──────────────────────────────
   Most descriptions name the work order ("Implement WO-1.5"). WO-1.1's orchestrator was described
   as "Route and dispatch WO phase-1 shell" and names none, so an unlabelled parent inherits from
   whichever child it spawned. */

const byId = new Map(agents.map(a => [a.id, a]));
function woOf(a) {
  const m = /WO-[\dG][\d.]*/.exec(a.desc);
  if (m) return m[0];
  const child = agents.find(c => c.parent === a.id && /WO-[\dG][\d.]*/.test(c.desc));
  if (child) return /WO-[\dG][\d.]*/.exec(child.desc)[0];
  const parent = a.parent && byId.get(a.parent);
  if (parent) return woOf(parent);
  return '(unlabelled)';
}
for (const a of agents) a.wo = woOf(a);

const orders = new Map();
for (const a of agents) {
  if (!orders.has(a.wo)) orders.set(a.wo, { id: a.wo, agents: [], first: a.first, last: a.last });
  const o = orders.get(a.wo);
  o.agents.push(a);
  if (a.first < o.first) o.first = a.first;
  if (a.last > o.last) o.last = a.last;
}

const sum = (list, k) => list.reduce((n, a) => n + a[k], 0);
const stageSum = (list, stage, k) => sum(list.filter(a => a.stage === stage), k);

/* ────────────────────────────── detail view ────────────────────────────── */

if (DETAIL) {
  const o = orders.get(DETAIL);
  if (!o) { console.error(`FAIL | no agent runs recorded for ${DETAIL}`); process.exit(1); }
  console.log(`${o.id} — ${o.agents.length} agent run(s)\n`);
  for (const a of o.agents) {
    console.log(`${String(a.first).slice(11, 16)}Z  ${a.minutes.toFixed(1).padStart(5)}m  ${a.type}`);
    console.log(`   ${a.desc}`);
    console.log(`   turns ${a.turns}   output ${a.out.toLocaleString()}   cache read ${(a.cacheRead / 1e6).toFixed(2)}M   cache write ${Math.round(a.cacheWrite / 1000)}K   peak ctx ${Math.round(a.peak / 1000)}K`);
    const t = Object.entries(a.tools).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}:${v}`).join(' ');
    if (t) console.log(`   tools ${t}`);
    if (a.stage === 'verification' && a.verdict) {
      console.log(`   verdict ${a.verdict.split('\n').find(l => l.trim())?.slice(0, 90) || '(none)'}`);
    }
    console.log('');
  }
  process.exit(0);
}

/* ────────────────────────────── the table ────────────────────────────── */

const rows = [...orders.values()].sort((a, b) => String(a.first).localeCompare(String(b.first)));

const pad = (s, n) => String(s).padStart(n);
console.log('Output tokens by stage, per work order. Cached reads are listed separately and never');
console.log('summed with output — they bill at a fraction of the rate.\n');
console.log('WO        impl      orch    verify     total   premium   cache rd   wall   agents');
console.log('───────────────────────────────────────────────────────────────────────────────────');

let tImpl = 0, tOrch = 0, tVer = 0, tCache = 0;
for (const o of rows) {
  const impl = stageSum(o.agents, 'implementation', 'out');
  const orch = stageSum(o.agents, 'orchestration', 'out');
  const ver = stageSum(o.agents, 'verification', 'out');
  const total = impl + orch + ver;
  const cache = sum(o.agents, 'cacheRead');
  const wall = (new Date(o.last) - new Date(o.first)) / 60000;
  const premium = impl ? `${Math.round(((orch + ver) / impl) * 100)}%` : '—';
  tImpl += impl; tOrch += orch; tVer += ver; tCache += cache;
  console.log(`${o.id.padEnd(8)} ${pad(impl.toLocaleString(), 8)} ${pad(orch.toLocaleString(), 9)} ${pad(ver.toLocaleString(), 9)} ${pad(total.toLocaleString(), 9)} ${pad(premium, 9)} ${pad((cache / 1e6).toFixed(2) + 'M', 10)} ${pad(wall.toFixed(0) + 'm', 6)} ${pad(o.agents.length, 7)}`);
}

const tTotal = tImpl + tOrch + tVer;
console.log('───────────────────────────────────────────────────────────────────────────────────');
console.log(`${'ALL'.padEnd(8)} ${pad(tImpl.toLocaleString(), 8)} ${pad(tOrch.toLocaleString(), 9)} ${pad(tVer.toLocaleString(), 9)} ${pad(tTotal.toLocaleString(), 9)} ${pad(Math.round(((tOrch + tVer) / tImpl) * 100) + '%', 9)} ${pad((tCache / 1e6).toFixed(1) + 'M', 10)}`);

console.log('');
console.log(`Pipeline overhead: ${(tOrch + tVer).toLocaleString()} output tokens on top of ${tImpl.toLocaleString()} of implementation`);
console.log(`  orchestration  ${tOrch.toLocaleString()}  (${Math.round((tOrch / tTotal) * 100)}% of all output)`);
console.log(`  verification   ${tVer.toLocaleString()}  (${Math.round((tVer / tTotal) * 100)}% of all output)`);

// Orchestration cost per dispatch is the number that drifts: every retro adds prose that every
// future dispatch pays to read. Trend it rather than reporting a single average.
const orchRuns = rows.map(o => ({ id: o.id, out: stageSum(o.agents, 'orchestration', 'out') })).filter(r => r.out);
if (orchRuns.length > 1) {
  console.log('\nOrchestration output per dispatch (watch this trend — it is the one that drifts):');
  console.log('  ' + orchRuns.map(r => `${r.id} ${r.out.toLocaleString()}`).join('   '));
}

console.log('\n`--detail WO-1.5` breaks one dispatch into its agent runs, with tool mix and verdict.');
