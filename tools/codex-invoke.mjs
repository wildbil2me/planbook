// Codex dispatch plumbing: the exec-time smoke test and the real dispatch, in one file so the
// codex-resources\ PATH fix (see plans/dispatch-retro.md § Codex) can only be right or wrong in
// one place, not drift between a probe copy and a dispatch copy.
//
// Usage:
//   node tools/codex-invoke.mjs --probe
//   node tools/codex-invoke.mjs --brief <path> --out <path> [--cwd <path>] [--budget <minutes>]
//
// --budget states, in minutes, what this work order's Acceptance will spend on harness runs:
// verify-shell.mjs runtime x the number of full runs it demands. It buys nothing and raises
// nothing — it is the caller's own arithmetic, handed over so that a dispatch which cannot fit is
// refused before it starts rather than SIGTERMed in the middle of a mutation. See
// INVOKE_TIMEOUT_MS below, and plans/work-orders/ROUTING.md § "Route to Codex", which asks for the
// same multiplication before a brief is written.
//
// Exit codes (the orchestrator reads these, not just the printed text):
//   0  success — probe: SMOKE OK.  invoke: codex exited 0 and the output file exists.
//   1  ran, but failed — a runner verdict. Re-route to Claude; record as transient, re-probe
//      next dispatch. probe: codex ran and wrote nothing, which includes a codex killed at
//      PROBE_TIMEOUT_MS — it was asked and did not write inside two minutes, and that is the
//      answer the probe exists to give. invoke: codex exited non-zero, or exited 0 with no output
//      file (a runner that failed and said it succeeded).
//   2  never started — codex was not asked, or could not be. Nothing was dispatched and the
//      working tree is untouched. That invariant is what the two kinds share: a harness bug to fix
//      (codex-resources\ missing, codex not resolvable on PATH or at the fallback path, git init
//      failed) and a caller-side refusal (a required argument or file missing, an unrecognized
//      flag, or a --budget that does not fit inside INVOKE_TIMEOUT_MS). Neither is a verdict on
//      the runner. The budget refusal in particular is a ROUTING fact — it must never arrive
//      dressed as exit 1, which is the code that means codex ran and may have left work behind.
//   3  invoke only: started, then KILLED — SIGTERMed at INVOKE_TIMEOUT_MS (or on a maxBuffer
//      overrun) before it could exit. Not a verdict either way, and emphatically not a 2: nothing
//      rolls the tree back, so this dispatch's writes are still in it, up to and including a
//      deliberate mutation it was holding mid-check. Read `git status` and the diff before doing
//      anything else — the work may be partial, half-applied, or complete. WO-3.15 (2026-08-14) is
//      why the code exists: codex wrote all seven of its files, failed to exit, was killed at the
//      cap, and this script reported "could not be run" and exit 2 over 206 insertions sitting in
//      the tree. A reader who trusts exit 2's invariant does not go looking.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, resolve, dirname, delimiter } from 'node:path';

const CODEX_FALLBACK = 'C:\\Users\\WildB\\AppData\\Local\\Programs\\OpenAI\\Codex\\bin\\codex.exe';
const PROBE_PROMPT = 'Create a file named ok.txt containing the word ok. Do nothing else.';
const PROBE_TIMEOUT_MS = 120_000;

// The cap on a WHOLE dispatch: reading the work order and the precedent, writing the code,
// reverting the mutations, writing the result file, and every harness run in between.
//
// WHAT EXPIRY DOES TO THE WORKING TREE, because this reads like a patience setting and is not.
// runCodex() hands this to spawnSync as `timeout`, and spawnSync SIGTERMs the child when it
// expires. Whatever the run had already written to the tree stays written — nothing here rolls it
// back and nothing downstream takes a snapshot to roll back to. The work orders this cap actually
// excludes are the ones whose method is mutate · run · revert, so the run most likely to be killed
// is the one holding a deliberate mutation in index.html or src/ at the moment it dies. That is
// not a failed check to re-run; it is a broken app with nobody watching, found whenever somebody
// next reads a diff. runInvoke() reports that kill as its own exit code — 3, never 2 — because the
// caller who has to go and read the diff is the one reading the exit code.
//
// LEFT AT TWENTY MINUTES ON PURPOSE (WO-2.37) — examined rather than inherited:
//   - Raising it to fit today's slowest Acceptance is the wrong shape of fix. verify-shell.mjs is
//     ~4.4 min a run on this tree, so four runs fit inside forty minutes and five do not, and the
//     next slow Acceptance is a bigger number again. A cap picked to make one symptom disappear
//     hides the same exclusion one work order further out, and teaches its next reader nothing.
//   - It is not the constraint that binds first anyway. The orchestrator runs this script from a
//     Bash call it is told to give 600000 ms — ten minutes, which
//     .claude/agents/work-order-orchestrator.md step 4 calls "what actually protects the session"
//     and which is the largest timeout that call takes. That fires first, it is outside this file,
//     and raising the number here moves it not at all.
//   - A --timeout flag was considered and refused. A caller who can raise the cap can buy exactly
//     the mid-mutation SIGTERM described above. --budget spends the same argument the other way:
//     the caller states what the Acceptance needs and is refused before anything is dispatched.
// The answer to a work order that does not fit is its ROUTE, not this number — see
// plans/work-orders/ROUTING.md § "Route to Codex", which asks the multiplication at routing time.
const INVOKE_TIMEOUT_MS = 20 * 60 * 1000;

// Held back from the cap for the half of a dispatch that is not a harness run — the reading, the
// writing, the revert, the result file. It is a judgment, not a measurement: nothing in this repo
// times a Codex dispatch's reading, and the one reading time that IS recorded is a Claude
// implementer's 21 minutes on WO-3.5 (orchestrator step 3b), which is longer than the whole cap.
// So half the cap is deliberately coarse, and the refusal below prints every term rather than a
// verdict — a reader who thinks the reserve is wrong should be able to argue with this number
// instead of with the arithmetic around it.
const WORK_RESERVE_MS = 10 * 60 * 1000;

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
    else if (a === '--budget') args.budget = argv[++i];
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

    // spawnSync reports a child that was STARTED AND THEN KILLED in `error` too — ETIMEDOUT at
    // PROBE_TIMEOUT_MS, ENOBUFS on a maxBuffer overrun, both with signal SIGTERM — so "there is an
    // error" is not the same question as "did codex run". `signal` is the discriminator: it is set
    // only for a child that existed long enough to be signalled, and is null for ENOENT and EACCES,
    // where nothing ever started. Only the never-started half is exit 2. A probe that hung is left
    // to fall through to the ok.txt check below, because "was asked, wrote nothing" is exactly the
    // verdict the probe is for, and the report line already prints the signal.
    if (result.error && !result.signal) {
      fail(2, `codex-invoke --probe: codex exec could not be run: ${result.error.message}`);
    }

    const wrote = existsSync(join(probeDir, 'ok.txt'));
    if (wrote) {
      console.log('SMOKE OK');
      process.exit(0);
    }

    console.log('SMOKE FAILED');
    console.error(`codex exec exited ${result.status}${result.signal ? ` (killed by ${result.signal}${result.error ? `, ${result.error.code}` : ''})` : ''} and wrote no file.`);
    if (result.stderr) console.error(result.stderr.trim());
    process.exit(1);
  } finally {
    rmSync(probeDir, { recursive: true, force: true });
  }
}

const minutes = (ms) => (ms / 60000).toFixed(1).replace(/\.0$/, '');

// The pre-flight refusal. It runs BEFORE the install is inspected and before anything is spawned,
// which is the point: whether a work order's Acceptance fits inside the cap is a fact about the
// work order, so the answer has to read the same on a machine with no Codex on it at all. A caller
// that states no budget is not refused — the rubric is where the multiplication is required, this
// is where it can be enforced — and a budget that fits prints so, because a gate that is silent
// when it passes is indistinguishable from a gate nobody wired up.
function refuseIfBudgetDoesNotFit(budgetArg) {
  if (budgetArg === undefined) return;
  const stated = Number(budgetArg);
  if (!Number.isFinite(stated) || stated <= 0) {
    fail(2, `codex-invoke: --budget takes the harness minutes this work order's Acceptance needs, as a positive number (got '${budgetArg}').`);
  }
  const budgetMs = stated * 60 * 1000;
  if (budgetMs + WORK_RESERVE_MS > INVOKE_TIMEOUT_MS) {
    fail(2, `codex-invoke: REFUSED before dispatch — ${minutes(budgetMs)} min of stated harness runs plus the ${minutes(WORK_RESERVE_MS)} min reserve for reading, writing and reverting does not fit inside the ${minutes(INVOKE_TIMEOUT_MS)} min INVOKE_TIMEOUT_MS, and a dispatch killed at that cap is SIGTERMed with its mutations still in the tree; nothing ran, nothing was written, the runner was never asked — route this one to Claude Sonnet (plans/work-orders/ROUTING.md § "Which Claude").`);
  }
  console.log(`codex-invoke: stated run budget ${minutes(budgetMs)} min + ${minutes(WORK_RESERVE_MS)} min reserve fits inside the ${minutes(INVOKE_TIMEOUT_MS)} min cap.`);
}

function runInvoke(args) {
  if (!args.brief || !args.out) {
    fail(2, 'codex-invoke: --brief <path> and --out <path> are both required.');
  }
  refuseIfBudgetDoesNotFit(args.budget);
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

  // Started, then killed — see the probe's copy of this split for the `signal` discriminator. It
  // matters more here than there: a dispatch reaching this line has been running for up to twenty
  // minutes with write access to the tree, so calling it "could not be run" and exiting 2 tells the
  // one reader who could catch a half-applied mutation that there is nothing to look at. That is
  // WO-3.15's mislabel (see the exit-code block at the top), and it is fixed by giving the case its
  // own code rather than by softening exit 2's invariant, which is load-bearing for the --budget
  // refusal below it.
  if (result.error && result.signal) {
    const why = result.error.code === 'ETIMEDOUT'
      ? `it hit the ${minutes(INVOKE_TIMEOUT_MS)} min INVOKE_TIMEOUT_MS`
      : `${result.error.code}: ${result.error.message}`;
    fail(3, `codex-invoke: KILLED, not refused — codex started, ran, and was ended by ${result.signal} before it could exit: ${why}. Nothing rolled the tree back: whatever this dispatch wrote is still in it, INCLUDING any deliberate mutation it was holding mid-check. Read 'git status' and the diff before re-dispatching or re-routing — the work may be partial, half-applied, or complete (WO-3.15 finished its work and was killed anyway). This is not a verdict on the runner and not exit 2's "nothing was dispatched".`);
  }

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
// --budget describes a dispatch, and the probe is not one. Refusing the combination is cheaper
// than a flag that is accepted and silently ignored, which reads as a budget that was checked.
if (parsed.probe && parsed.budget !== undefined) {
  fail(2, 'codex-invoke: --budget applies to a dispatch, not to --probe (the probe caps itself at two minutes).');
}
if (parsed.probe) runProbe();
else runInvoke(parsed);
