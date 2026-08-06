// Codex dispatch plumbing: the exec-time smoke test and the real dispatch, in one file so the
// codex-resources\ PATH fix (see plans/dispatch-retro.md § Codex) can only be right or wrong in
// one place, not drift between a probe copy and a dispatch copy.
//
// Usage:
//   node tools/codex-invoke.mjs --probe
//   node tools/codex-invoke.mjs --brief <path> --out <path> [--cwd <path>]
//
// Exit codes (the orchestrator reads these, not just the printed text):
//   0  success — probe: SMOKE OK.  invoke: codex exited 0 and the output file exists.
//   1  ran, but failed — a runner verdict. Re-route to Claude; record as transient, re-probe
//      next dispatch. probe: codex ran and wrote nothing. invoke: codex exited non-zero, or
//      exited 0 with no output file (a runner that failed and said it succeeded).
//   2  could not run at all — a harness bug to fix, not a runner verdict. codex-resources\
//      missing, codex not resolvable on PATH or at the fallback path, git init failed, or a
//      required argument/file is missing.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, resolve, dirname, delimiter } from 'node:path';

const CODEX_FALLBACK = 'C:\\Users\\WildB\\AppData\\Local\\Programs\\OpenAI\\Codex\\bin\\codex.exe';
const PROBE_PROMPT = 'Create a file named ok.txt containing the word ok. Do nothing else.';
const PROBE_TIMEOUT_MS = 120_000;
const INVOKE_TIMEOUT_MS = 20 * 60 * 1000;

function codexResourcesDir() {
  return join(homedir(), '.codex', 'packages', 'standalone', 'current', 'codex-resources');
}

// codex-windows-sandbox-setup.exe and codex-command-runner.exe live in codex-resources\, a
// sibling of bin\ inside every installed standalone release, and it is never on PATH by
// default. codex.exe resolving on PATH (from a separate launcher install) proves nothing about
// whether its own helper spawns can resolve by name. Prepending here, on the child's env only,
// is required every invocation — a registry-level PATH write does not reach a session that was
// already running when it was made. Windows env vars are case-insensitive but JS object keys
// are not, so find whatever case the existing PATH key uses rather than assuming "PATH".
function withCodexPath(env) {
  const out = { ...env };
  const key = Object.keys(out).find((k) => k.toLowerCase() === 'path') ?? 'PATH';
  out[key] = `${codexResourcesDir()}${delimiter}${out[key] ?? ''}`;
  return out;
}

function runCodex(codexCmd, args, { input, cwd, timeout }) {
  return spawnSync(codexCmd, args, {
    input,
    cwd,
    env: withCodexPath(process.env),
    encoding: 'utf8',
    timeout,
    maxBuffer: 16 * 1024 * 1024,
  });
}

// Tries codex on PATH first; falls back to the known standalone install location only on
// ENOENT. Returns { infra } if neither resolves — that is a harness problem, not a verdict on
// the runner, and callers exit 2 for it rather than reporting a routing failure.
function runCodexWithFallback(args, opts) {
  let result = runCodex('codex', args, opts);
  if (result.error && result.error.code === 'ENOENT') {
    if (!existsSync(CODEX_FALLBACK)) {
      return { infra: `codex is not resolvable on PATH, and the fallback install (${CODEX_FALLBACK}) does not exist either.` };
    }
    result = runCodex(CODEX_FALLBACK, args, opts);
  }
  return { result };
}

function fail(code, message) {
  console.error(message);
  process.exit(code);
}

function parseArgs(argv) {
  const args = { probe: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--probe') args.probe = true;
    else if (a === '--brief') args.brief = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--cwd') args.cwd = argv[++i];
    else fail(2, `codex-invoke: unrecognized argument '${a}'`);
  }
  return args;
}

function runProbe() {
  if (!existsSync(codexResourcesDir())) {
    fail(2, `codex-invoke --probe: codex-resources not found at ${codexResourcesDir()} — the Codex standalone install looks missing or moved. This is a harness problem, not a runner verdict.`);
  }

  const probeDir = mkdtempSync(join(tmpdir(), 'codex-smoke-'));
  try {
    const init = spawnSync('git', ['init', '--quiet'], { cwd: probeDir, encoding: 'utf8' });
    if (init.status !== 0) {
      // Codex refuses to run outside a trusted directory. A probe that can't run reports
      // SMOKE FAILED for a runner it never tested — worse than no probe. Exit 2, not 1.
      fail(2, `codex-invoke --probe: 'git init' failed in ${probeDir} — probe cannot run.\n${(init.stderr || '').trim()}`);
    }

    const { infra, result } = runCodexWithFallback(
      ['exec', '--cd', probeDir, '--sandbox', 'workspace-write', '-'],
      { input: PROBE_PROMPT, cwd: process.cwd(), timeout: PROBE_TIMEOUT_MS },
    );
    if (infra) fail(2, `codex-invoke --probe: ${infra}`);

    if (result.error) {
      fail(2, `codex-invoke --probe: codex exec could not be run: ${result.error.message}`);
    }

    const wrote = existsSync(join(probeDir, 'ok.txt'));
    if (wrote) {
      console.log('SMOKE OK');
      process.exit(0);
    }

    console.log('SMOKE FAILED');
    console.error(`codex exec exited ${result.status}${result.signal ? ` (signal ${result.signal})` : ''} and wrote no file.`);
    if (result.stderr) console.error(result.stderr.trim());
    process.exit(1);
  } finally {
    rmSync(probeDir, { recursive: true, force: true });
  }
}

function runInvoke(args) {
  if (!args.brief || !args.out) {
    fail(2, 'codex-invoke: --brief <path> and --out <path> are both required.');
  }
  const briefPath = resolve(args.brief);
  const outPath = resolve(args.out);
  const cwd = args.cwd ? resolve(args.cwd) : process.cwd();

  if (!existsSync(briefPath)) {
    fail(2, `codex-invoke: brief not found at ${briefPath}`);
  }
  if (!existsSync(codexResourcesDir())) {
    fail(2, `codex-invoke: codex-resources not found at ${codexResourcesDir()} — the Codex standalone install looks missing or moved.`);
  }

  mkdirSync(dirname(outPath), { recursive: true });
  const brief = readFileSync(briefPath, 'utf8');

  const { infra, result } = runCodexWithFallback(
    // --sandbox workspace-write is hardcoded, not a flag this script exposes — reads anywhere,
    // writes only under cwd, no network. Do not raise it to danger-full-access.
    ['exec', '--cd', cwd, '--sandbox', 'workspace-write', '-o', outPath, '-'],
    { input: brief, cwd, timeout: INVOKE_TIMEOUT_MS },
  );
  if (infra) fail(2, `codex-invoke: ${infra}`);

  if (result.error) {
    fail(2, `codex-invoke: codex exec could not be run: ${result.error.message}`);
  }

  const wrote = existsSync(outPath);
  console.log(`codex exec exited ${result.status}${result.signal ? ` (signal ${result.signal})` : ''}; output ${wrote ? 'written to' : 'MISSING at'} ${outPath}`);

  if (result.status !== 0) {
    if (result.stderr) console.error(result.stderr.trim());
    process.exit(1);
  }
  if (!wrote) {
    // A zero exit with nothing written is a runner that failed and said it succeeded — treat it
    // as a failed dispatch, not a pass with no output.
    console.error('codex exec exited 0 but wrote no output file. Treat as a failed dispatch.');
    process.exit(1);
  }
  process.exit(0);
}

const parsed = parseArgs(process.argv.slice(2));
if (parsed.probe) runProbe();
else runInvoke(parsed);
