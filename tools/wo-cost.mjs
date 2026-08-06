#!/usr/bin/env node
// wo-cost.mjs — what each dispatch cost, from the transcripts.
//
//   node tools/wo-cost.mjs                     the table
//   node tools/wo-cost.mjs --detail WO-1.5     one work order, agent by agent
//   node tools/wo-cost.mjs --projects <dir>    transcripts live somewhere else
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

if (argv.includes('--help') || argv.includes('-h')) {
  console.log(`wo-cost.mjs — what each dispatch cost

  node tools/wo-cost.mjs                     per-work-order decomposition
  node tools/wo-cost.mjs --detail WO-1.5     one work order, agent by agent
  node tools/wo-cost.mjs --projects <dir>    transcripts elsewhere

Reads Claude Code session transcripts. Default location:
  ${PROJECTS}`);
  process.exit(0);
}

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
