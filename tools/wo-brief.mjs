#!/usr/bin/env node
// wo-brief.mjs — assemble the mechanical two-thirds of a dispatch brief.
//
//   node tools/wo-brief.mjs WO-1.7 [--route claude|codex] > .claude/dispatch/WO-1.7-brief.md
//
// A brief is the audit trail: what was actually asked for, separate from what the agent decided to
// do. Most of it is text that already exists on disk — the work order verbatim, the constraints
// block verbatim, the acceptance list restated. WO-1.5's brief was 15 KB of largely-existing prose
// against 14,629 output tokens of orchestrator spend, which is the largest single sink in the
// pipeline.
//
// So this writes the copyable parts and leaves marked placeholders for the parts that need
// judgment. The orchestrator fills those in and deletes the markers. A brief that still contains a
// TODO marker when it reaches an implementer is an incomplete brief, and the marker is there to
// make that obvious rather than subtle.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WO_DIR = path.join(REPO, 'plans', 'work-orders');
const ROUTING = path.join(WO_DIR, 'ROUTING.md');

const argv = process.argv.slice(2);
const id = argv.find(a => /^WO-/.test(a));
const routeArg = (argv[argv.indexOf('--route') + 1] || '').toLowerCase();
const route = ['claude', 'codex'].includes(routeArg) ? routeArg : 'claude';

const HELP = `wo-brief.mjs — assemble a dispatch brief

  node tools/wo-brief.mjs WO-1.7 [--route claude|codex] > .claude/dispatch/WO-1.7-brief.md

Writes the verbatim sections and leaves <!-- ORCHESTRATOR: ... --> markers where judgment is owed.`;

// Asking for help is not a failure, and the brief goes to stdout — so help goes to stdout too only
// when it was asked for, and to stderr when it is a usage error that must not land in a brief file.
if (argv.includes('--help') || argv.includes('-h')) { console.log(HELP); process.exit(0); }
if (!id) { console.error('FAIL | wo-brief.mjs needs a work order ID\n\n' + HELP); process.exit(1); }

const read = f => fs.readFileSync(f, 'utf8');

// ---------------------------------------------------------------------------- the work order

// Work orders in a phase file run from their `## WO-x — Title` heading to the next `---` rule.
function findWorkOrder(woId) {
  for (const f of fs.readdirSync(WO_DIR).filter(n => n.endsWith('.md') && !['README.md', 'ROUTING.md'].includes(n))) {
    const file = path.join(WO_DIR, f);
    const lines = read(file).split('\n');
    const start = lines.findIndex(l => new RegExp(`^##\\s+${woId.replace('.', '\\.')}\\s+—`).test(l));
    if (start < 0) continue;
    let end = lines.length;
    for (let i = start + 1; i < lines.length; i++) {
      if (/^---\s*$/.test(lines[i]) || /^##\s+WO-/.test(lines[i])) { end = i; break; }
    }
    return { file, text: lines.slice(start, end).join('\n').trimEnd(), lines, start };
  }
  return null;
}

const wo = findWorkOrder(id);
if (!wo) { console.error(`FAIL | no work order ${id} under ${path.relative(REPO, WO_DIR)}`); process.exit(1); }

const title = (/^##\s+WO-[\dG][\w.]*\s+—\s+(.+?)\s*$/m.exec(wo.text) || [, id])[1];

// ---------------------------------------------------------------------------- acceptance

// The Acceptance list is restated as the thing to report against, so the implementer answers a
// list rather than narrating. Checkbox syntax is stripped: this is a report template, not a
// tracker, and no agent may tick a box.
function acceptanceLines(text) {
  const lines = text.split('\n');
  const i = lines.findIndex(l => /^\*\*Acceptance\*\*/.test(l));
  if (i < 0) return [];
  const out = [];
  for (let j = i + 1; j < lines.length; j++) {
    const l = lines[j];
    if (/^\*\*[A-Z]/.test(l)) break;                       // next bold field ends the list
    const m = /^\s*-\s*\[[ x]\]\s*(.+)$/.exec(l);
    if (m) out.push(m[1].trim());
    else if (out.length && /^\s{2,}\S/.test(l)) out[out.length - 1] += ' ' + l.trim();  // wrapped
  }
  return out;
}

// ---------------------------------------------------------------------------- referenced files

// Anything the work order points at by path is a file the implementer needs open. Derived rather
// than remembered, because the orchestrator forgetting one is how an agent designs a second visual
// language from scratch.
function referencedFiles(text) {
  const hits = new Set();
  const re = /(?:^|[\s(`[])((?:\.\.\/)*(?:docs|design|plans|src|tools)\/[\w./-]+\.(?:md|js|mjs|css|html))/g;
  let m;
  while ((m = re.exec(text))) hits.add(m[1].replace(/^(\.\.\/)+/, ''));
  return [...hits].filter(f => fs.existsSync(path.join(REPO, f))).sort();
}

// ---------------------------------------------------------------------------- constraints

// Verbatim from ROUTING.md § "What every Codex brief must carry" — verbatim on purpose. Every line
// in it is a constraint that has already cost someone a day, and a paraphrase is how one of them
// quietly loses its teeth.
function constraintsBlock() {
  const lines = read(ROUTING).split('\n');
  const i = lines.findIndex(l => /^##\s+What every Codex brief must carry/.test(l));
  if (i < 0) { console.error('FAIL | ROUTING.md has no "What every Codex brief must carry" section'); process.exit(1); }
  let end = lines.length;
  for (let j = i + 1; j < lines.length; j++) if (/^##\s/.test(lines[j])) { end = j; break; }
  return lines.slice(i + 1, end).join('\n').trim();
}

// ---------------------------------------------------------------------------- emit

const acc = acceptanceLines(wo.text);
const refs = referencedFiles(wo.text);
const contextDoc = route === 'codex' ? 'AGENTS.md' : 'CLAUDE.md';

const out = [];
const p = s => out.push(s);

p(`# ${id} — ${title} · implementation brief`);
p('');
p(`**Route** ${route === 'codex' ? 'Codex' : 'Claude (work-order-implementer)'}`);
p(`**Work order** \`${path.relative(REPO, wo.file).replace(/\\/g, '/')}\``);
p(`**Report to** \`.claude/dispatch/${id}-result.md\` — as your last act, and return it in-band too.`);
p('');
p('<!-- ORCHESTRATOR: replace this line with the routing decision — the route, the deciding signal,');
p('     and the runner-up consideration you set aside. Two or three sentences. -->');
p('');
p('---');
p('');
p('## 1. The work order, verbatim');
p('');
p('Every section of it, including **Why it exists** and **Traps**. These are not background: they');
p('record decisions already made and already argued. An implementation that undoes one has failed');
p('the work order however clean the code looks.');
p('');
p(wo.text);
p('');
p('---');
p('');
p('## 2. Read these first, before writing anything');
p('');
p(`- \`${contextDoc}\` — the architecture and the reasoning that must not be undone.`);
if (refs.length) {
  p('- Referenced by this work order:');
  for (const f of refs) p(`  - \`${f}\``);
}
p('- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects');
p('  rather than harness bugs, and that two agents have each rediscovered from scratch.');
p('');
p('<!-- ORCHESTRATOR: add anything else this work order needs open — a Roll Call! design doc, a');
p('     sibling module whose convention this one must match. Delete this marker when done. -->');
p('');
p('---');
p('');
p('## 3. Constraints — non-negotiable, and each one has already cost someone a day');
p('');
p(constraintsBlock());
p('');
p('---');
p('');
p('## 4. Verification');
p('');
p('```');
p('node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong');
p('node tools/wo-sweep.mjs          # the eight standing greps');
p('```');
p('');
p('Both must be green before you report. **Do not write a second harness** — if this work order');
p('needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.');
p('Add checks for what you build; a fixture that cannot express the failure is not evidence.');
p('');
p('---');
p('');
p(`## 5. Done means these ${acc.length ? `${acc.length} line${acc.length === 1 ? '' : 's'}` : 'lines'}, reported against one by one`);
p('');
if (acc.length) {
  acc.forEach((a, i) => { p(`${i + 1}. ${a}`); });
  p('');
  p('Report honestly rather than favorably. A separate verifier reads your work cold against this');
  p('list and sees none of your reasoning — claiming a line you did not meet costs a correction');
  p('round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.');
} else {
  p('<!-- ORCHESTRATOR: this work order has no parseable Acceptance list — restate it by hand. -->');
}
p('');

process.stdout.write(out.join('\n') + '\n');
