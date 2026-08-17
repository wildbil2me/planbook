// Codex dispatch plumbing: the exec-time smoke test and the real dispatch, in one file so the
// codex-resources\ PATH fix (see plans/dispatch-retro.md § Codex) can only be right or wrong in
// one place, not drift between a probe copy and a dispatch copy.
//
// Usage:
//   node tools/codex-invoke.mjs --probe
//   node tools/codex-invoke.mjs --brief <path> --out <path> [--cwd <path>] [--budget <minutes>]
//   node tools/codex-invoke.mjs --self-check [--against <path>]
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
//
// Every one of those codes is driven, against a stand-in child and with no codex process anywhere
// near it, by `--self-check` at the foot of this file: 0 if every gate still bites, 1 if one has
// stopped. Both gates in here are behaviour nobody sees on a normal run, which is the whole reason
// that flag exists (WO-2.40); its section comment is the account.

import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, resolve, dirname, delimiter, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

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

// ----- the --self-check seam
//
// Four environment reads, in one place, and they exist so that --self-check at the foot of this file
// can drive the spawn paths WITHOUT editing the constants above. Editing them is exactly what
// WO-2.37's hand demonstration had to do — INVOKE_TIMEOUT_MS put down to 6 seconds in the real file
// and restored afterwards — on the one file whose own header explains what an interrupted mutation
// costs. A committed check must not repeat that, so the paths are made callable instead (WO-2.40).
//
// ENVIRONMENT RATHER THAN FLAGS, on purpose and not for brevity. A flag would be a documented way
// for a caller to point a dispatch at a command of their choosing, which is the same argument that
// keeps --sandbox hardcoded below; each of these is nonsense outside the self-check, nothing in the
// repository sets them but selfCheck(), and any run that has one set says so on stderr before it
// does anything else. A seam that can be active silently is a seam that eventually is.
//
//   ..._CMD             spawned instead of `codex`, with the PATH fallback SKIPPED — see
//                       runCodexWithFallback(), where skipping it is the load-bearing part
//   ..._CMD_ARG         one argument inserted ahead of the codex args, because every stand-in child
//                       is `node <script>` and Windows will not spawn a .mjs directly
//   ..._TIMEOUT_MS      stands in for INVOKE_TIMEOUT_MS on the dispatch spawn and for nothing else.
//                       refuseIfBudgetDoesNotFit() keeps reading the real constant, deliberately:
//                       the boundary the self-check asserts is then the boundary this file ships
//   ..._RESOURCES_DIR   stands in for codex-resources\. Without it, reaching any spawn path would
//                       need a Codex install present — and a check that goes yellow on a machine
//                       where the runner is the thing being routed around is the Traps line
const SEAM = {
  cmd: process.env.CODEX_INVOKE_SELFCHECK_CMD || null,
  cmdArg: process.env.CODEX_INVOKE_SELFCHECK_CMD_ARG || null,
  timeoutMs: Number(process.env.CODEX_INVOKE_SELFCHECK_TIMEOUT_MS) > 0
    ? Number(process.env.CODEX_INVOKE_SELFCHECK_TIMEOUT_MS)
    : null,
  resourcesDir: process.env.CODEX_INVOKE_SELFCHECK_RESOURCES_DIR || null,
};
if (SEAM.cmd || SEAM.cmdArg || SEAM.timeoutMs || SEAM.resourcesDir) {
  console.error(`codex-invoke: SELF-CHECK SEAM ACTIVE — spawning ${SEAM.cmd || 'codex'}${SEAM.cmdArg ? ` ${SEAM.cmdArg}` : ''}, cap ${SEAM.timeoutMs ?? 'unchanged'} ms, resources ${SEAM.resourcesDir ?? 'unchanged'}. Only --self-check sets these, and a real dispatch must never print this line.`);
}

// The cap this run will actually wait. Identical to INVOKE_TIMEOUT_MS unless --self-check is
// driving, which is the only reason it is a function rather than the constant read in place.
function invokeTimeout() {
  return SEAM.timeoutMs ?? INVOKE_TIMEOUT_MS;
}

function codexResourcesDir() {
  return SEAM.resourcesDir ?? join(homedir(), '.codex', 'packages', 'standalone', 'current', 'codex-resources');
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
  // The --self-check seam, and it deliberately does NOT fall back. A fixture that hands in a command
  // which does not exist is driving the never-started case; resolving that to the real codex.exe
  // would spawn the runner the Traps forbid and answer a question nobody asked. It is also why
  // --self-check refuses to run at all against a subject that has lost this branch.
  if (SEAM.cmd) return { result: runCodex(SEAM.cmd, SEAM.cmdArg ? [SEAM.cmdArg, ...args] : args, opts) };
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

  // WO-2.40's second adjacent finding, ANSWERED IN WRITING RATHER THAN MOVED, and the finding as
  // booked has its order wrong: this already runs BELOW the codex-resources check, not above it, so
  // the two refusals it was worried about both fire before the directory exists. What survives is
  // smaller and real — runCodexWithFallback() can still return { infra } after this line, which is
  // an exit 2 whose invariant says the working tree is untouched, and by then dirname(outPath) has
  // been created. Left as it is for three reasons. `recursive: true` over a directory that exists
  // writes nothing, and in every documented invocation that directory is .claude/dispatch/, which
  // has existed since the pipeline did. Git does not track an empty directory, so the invariant as a
  // reader USES it — "there is no diff to go and read" — is not the one being bent. And moving the
  // call below the { infra } refusal means resolving the command before creating the directory,
  // which is a restructure of runCodexWithFallback() rather than the one-line move it looks like.
  mkdirSync(dirname(outPath), { recursive: true });
  const brief = readFileSync(briefPath, 'utf8');

  const { infra, result } = runCodexWithFallback(
    // --sandbox workspace-write is hardcoded, not a flag this script exposes — reads anywhere,
    // writes only under cwd, no network. Do not raise it to danger-full-access.
    ['exec', '--cd', cwd, '--sandbox', 'workspace-write', '-o', outPath, '-'],
    { input: brief, cwd, timeout: invokeTimeout() },
  );
  if (infra) fail(2, `codex-invoke: ${infra}`);

  // Started, then killed — see the probe's copy of this split for the `signal` discriminator. It
  // matters more here than there: a dispatch reaching this line has been running for up to twenty
  // minutes with write access to the tree, so calling it "could not be run" and exiting 2 tells the
  // one reader who could catch a half-applied mutation that there is nothing to look at. That is
  // WO-3.15's mislabel (see the exit-code block at the top), and it is fixed by giving the case its
  // own code rather than by softening exit 2's invariant, which is load-bearing for the --budget
  // refusal below it.
  //
  // WO-2.40's first adjacent finding, ANSWERED IN WRITING AND LEFT ALONE: a child killed from
  // OUTSIDE this script would have `signal` set and `error` unset, would fall past this branch, and
  // would be reported as exit 1 — the runner-verdict code, for a kill that produced no verdict. True
  // in the abstract and NOT PRODUCIBLE on the platform this file runs on, measured on node v24.16.0
  // / win32 rather than assumed: `taskkill /F` on the child, and the child sending itself SIGTERM,
  // both report `status 1 · signal null · error undefined`. Windows has no signals, so libuv fills
  // term_signal in only when it did the killing itself — which is the timeout (ETIMEDOUT) and the
  // maxBuffer overrun (ENOBUFS), both of which set `error` and both of which land here. So the two
  // conditions select the same set, and widening this one buys nothing that could be driven, while
  // the `why` below would need an arm for a kill this script cannot explain. What an external kill
  // DOES look like here is `status 1, signal null` — byte-identical to codex exiting 1, and not
  // separable by anything spawnSync reports. That residue is named rather than papered over. If this
  // file ever runs on POSIX, this is the branch to widen to `if (result.signal)`, and --self-check
  // will need a case that can produce the state before it is worth doing.
  if (result.error && result.signal) {
    const why = result.error.code === 'ETIMEDOUT'
      ? `it hit the ${minutes(invokeTimeout())} min INVOKE_TIMEOUT_MS`
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

// ---------------------------------------------------------------------------- self-check
//
// The standing version of what WO-2.37 proved by hand and then threw away. Both gates in this file —
// the --budget pre-flight refusal and the started-then-killed split — were driven once, on the day
// they shipped, in a scratchpad repo with INVOKE_TIMEOUT_MS and PROBE_TIMEOUT_MS temporarily edited
// in the real file and put back afterwards. The evidence was correct and it is gone, the method was
// mutate · run · revert on the one file whose header explains what an interrupted mutation costs, and
// the whole value of each gate is behaviour nobody sees on a normal run. So the cases live here
// instead: copy this script to a temp directory, drive each refusal by its exit code and by a phrase
// of its message, and fail if one of them stops biting.
//
// It is a flag in the file it checks, not tools/codex-invoke-selfcheck.mjs, per
// plans/verification-tooling.md § "The check on wo-gate.mjs is a flag inside wo-gate.mjs" — a check
// on a script is exactly the kind of addition that arrives looking like it wants its own file.
//
// FOUR DECISIONS ARE LIFTED FROM wo-gate.mjs --self-check RATHER THAN RE-DERIVED, because that is
// the same job in the same suite and it states them as decisions:
//   - THE TEMP COPY IS THE ONLY FIXTURE. Every path anything here writes goes through
//     assertOutsideRepo(), which refuses anything inside REPO, and there is no --dry-run escape in
//     that guard on purpose: the next edit to this code would be the one that removes the flag.
//   - THE FIXTURE IS SYNTHETIC — a brief nobody reads, an empty directory standing in for
//     codex-resources\, five stand-in children written on the way in. Nothing here is a real
//     dispatch, so nothing here can be spent or go stale, which is the mistake wo-gate.mjs's own
//     acceptance list had to be re-cut twice for.
//   - THE SUBJECT IS SEPARABLE. `--self-check --against <path>` runs the cases over a different copy
//     of this script, which is how "deleting a gate turns this red" gets SHOWN without a byte being
//     written into tools/ — the only way WO-2.40's acceptance lines 3 and 4 hold at the same time.
//   - THE RUN PRINTS WHAT IT DOES NOT COVER, because a green check trusted for what it never touched
//     is worse than no check.
//
// NO CODEX PROCESS IS EVER SPAWNED, which is the Traps line, and it is structural rather than
// promised. Every case sets ..._CMD, so runCodexWithFallback() short-circuits before it looks up
// `codex` on PATH and before it considers CODEX_FALLBACK; the only two commands any case names are
// this Node binary and one path that does not exist. A subject that has LOST that branch cannot be
// driven safely at all — the never-started case hands it a command that does not exist, and the
// fallback would resolve that to the real codex.exe and dispatch a brief — so the precondition below
// refuses to run a single case against one and says so instead.
//
// THE PRECONDITION IS NOT A CASE, deliberately, and for wo-gate.mjs's reason (WO-2.16): it asserts
// something about whether the FIXTURE can reach the subject, not about whether a gate bites, and
// folding it into the case list is how the next reader concludes that the seam is what --self-check
// checks. It is also the one exit path where "go and read the case it named" is the wrong advice.
//
// WHAT WOULD HIDE A DEFECT HERE, named because § Fixture assumptions in plans/dispatch-retro.md is
// three defects that escaped a green run: a fixture that cannot tell a child that never started from
// one that started and was killed. Both report `status null` and both arrive carrying an `error`;
// `signal` is the only discriminator. So the never-started case (ENOENT) and BOTH kill cases are
// driven — the timeout AND the 16 MB maxBuffer overrun — because a subject keyed on
// `error.code === 'ETIMEDOUT'` rather than on `signal` passes the timeout case and mislabels the
// overrun as never-started. One case cannot express that difference; two can.
//
// THE BUDGET BOUNDARY IS WRITTEN DOWN AS 10 AND 10.1, and that is a claim about the shipped numbers
// rather than a fixture detail: INVOKE_TIMEOUT_MS 20 min less WORK_RESERVE_MS 10 min leaves exactly
// ten minutes of stated harness runs. The seam deliberately does not reach that gate, so what these
// two cases assert is the arithmetic a router is actually promised — the hard 20-minute cap named in
// tools/README.md and in plans/work-orders/ROUTING.md § "Route to Codex", both of which quote the
// script's own fit line. If either constant moves, these two cases go red, and that is intended
// rather than brittle: three files carry that number, and a cap that changes without them changing is
// the drift this suite keeps paying for.

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SEAM_KEYS = ['CODEX_INVOKE_SELFCHECK_CMD', 'CODEX_INVOKE_SELFCHECK_CMD_ARG',
                   'CODEX_INVOKE_SELFCHECK_TIMEOUT_MS', 'CODEX_INVOKE_SELFCHECK_RESOURCES_DIR'];

// Nothing inside the repository, ever. Called on every path this section writes or copies onto, and
// on the sandbox that holds them.
//
// COMPARED CASE-INSENSITIVELY ON WINDOWS, and that is not fussiness — the first cut of this guard did
// not, and it waved a whole fixture through into the repository. `REPO` comes from `import.meta.url`
// as `c:\dev\planbook`; `mkdtempSync` on the same machine answers `C:\dev\planbook\…`. One drive
// letter differs in case, `startsWith` says false, and a guard whose entire job is refusing paths
// inside the repository reports that a path inside the repository is outside it. Found by pointing
// TMP at a directory in the tree and watching all seventeen cases run there (WO-2.40) — which is the
// only way to find it, since the guard is silent when it works and silent when it does not.
function assertOutsideRepo(p) {
  const norm = (s) => (process.platform === 'win32' ? resolve(s).toLowerCase() : resolve(s));
  const r = norm(p);
  const repo = norm(REPO);
  if (r === repo || r.startsWith(repo + sep)) {
    throw new Error(`--self-check refused to write inside the repository: ${resolve(p)}`);
  }
  return resolve(p);
}

// What a failing case prints as its evidence. The subject's refusals are one long line each, so this
// clips per line rather than clipping the run — wo-gate.mjs's verdict() learned that the hard way,
// where a head-clip showed the banner and cut the reason off. The seam's own banner is dropped for
// the same reason: it is identical on every case and it is one of only four lines there is room for.
function evidence(out) {
  return out.split('\n').map(l => l.trim())
    .filter(l => l && !l.includes('SELF-CHECK SEAM ACTIVE')).slice(-4)
    .map(l => `  ${l.length > 200 ? `${l.slice(0, 200)}…` : l}`);
}

function selfCheck(subjectPath) {
  const subject = resolve(subjectPath);
  if (!existsSync(subject)) {
    console.error(`FAIL | --self-check --against: no such file "${subject}"`);
    return 1;
  }
  const sandbox = mkdtempSync(join(realpathSync(tmpdir()), 'codex-invoke-selfcheck-'));
  try {
    // The sandbox goes through the same guard as everything written into it. mkdtemp() reads TMPDIR,
    // which is outside this file's control, so this is the one path that could put the fixture inside
    // the repository without any of the writes below being wrong.
    assertOutsideRepo(sandbox);
    return runCases(subject, sandbox);
  } finally {
    // Both exit paths, including the throwing one: what is left behind is a copy of this script and
    // the stand-in children, and a reader who finds those in a temp directory has to work out
    // whether they are a fixture or somebody's half-finished edit.
    rmSync(sandbox, { recursive: true, force: true });
  }
}

function runCases(subject, sandbox) {
  const sb = (...p) => assertOutsideRepo(join(sandbox, ...p));
  const write = (p, text) => { writeFileSync(assertOutsideRepo(p), text); return p; };

  console.log('--self-check');
  console.log(`  subject   ${subject}`);
  console.log(`  sandbox   ${sandbox}   (deleted on the way out)`);

  // 1. The precondition, read off the subject's TEXT and not by running it. See the section comment:
  //    a subject with no seam resolves a fixture's nonexistent command to the real codex.exe.
  const subjectText = readFileSync(subject, 'utf8');
  const absent = SEAM_KEYS.filter(k => !subjectText.includes(k));
  if (absent.length) {
    console.log('');
    console.log('FAIL | --self-check cannot drive this subject without risking the real runner, so it drove');
    console.log('     | nothing at all. 0 cases run; no stand-in child was started.');
    console.log('');
    for (const k of absent) console.log(`     | the subject never reads ${k}`);
    console.log('');
    console.log('  Every case hands the subject a command to spawn instead of codex. A subject that does not');
    console.log('  read that seam looks `codex` up on PATH and then falls back to CODEX_FALLBACK — so the');
    console.log('  never-started case, whose whole method is a command that does not exist, would resolve to');
    console.log('  the real codex.exe and dispatch a brief to it. Reported here rather than as a row of red');
    console.log('  cases because it is a fact about the fixture, not about a gate (WO-2.16\'s rule, one file');
    console.log('  over). A subject from before WO-2.40 is expected to land here.');
    return 1;
  }

  // 2. The copy, and the synthetic fixture around it. Every path below is built by sb(), so every one
  //    of them has been through the guard. The subject goes in beside a tools/ of its own, so nothing
  //    it resolves relative to its own location can reach the repository even if the guard were wrong.
  mkdirSync(sb('tools'));
  const script = sb('tools', 'codex-invoke.mjs');
  copyFileSync(subject, script);

  const BRIEF_MARK = 'WO-2.40 self-check: the brief the stand-in child echoes back';
  const brief = write(sb('brief.md'), `${BRIEF_MARK}\n`);
  const noBrief = sb('no-such-brief.md');
  const resources = sb('codex-resources');
  mkdirSync(resources);
  const noResources = sb('no-such-codex-resources');
  const noCommand = sb('no-such-codex.exe');

  // The stand-in children. A sleeping process.execPath reproduces the timeout case exactly — that was
  // measured in WO-2.37's correction round and is not re-derived here.
  const child = (name, body) => write(sb(`stand-in-${name}.mjs`), body);
  const sleeps = child('sleeps', 'setTimeout(() => {}, 60_000);\n');
  const floods = child('floods',
    `// 25 MB, to overrun the hardcoded 16 MB maxBuffer: signal SIGTERM, error ENOBUFS.\n`
    + `const chunk = 'x'.repeat(64 * 1024);\n`
    + `for (let i = 0; i < 400; i++) process.stdout.write(chunk);\n`);
  const exits7 = child('exits-7', 'process.exit(7);\n');
  const quiet = child('quiet', '// Exits 0 having written nothing: the runner that failed and said it succeeded.\n');
  const writes = child('writes',
    `import { readFileSync, writeFileSync } from 'node:fs';\n`
    + `// Writes the brief it was handed on stdin to the -o path it was handed in argv, which is how a\n`
    + `// case can assert the dispatch really reached the child rather than that a process launched.\n`
    + `const out = process.argv[process.argv.indexOf('-o') + 1];\n`
    + `let stdin = '';\n`
    + `try { stdin = readFileSync(0, 'utf8'); } catch { stdin = '(stdin unreadable)'; }\n`
    + `writeFileSync(out, stdin);\n`);

  // Every seam variable is cleared before a case sets its own, so a shell that happens to be
  // carrying one cannot quietly change what is being asserted.
  const runSubject = (args, seam) => {
    const env = { ...process.env };
    for (const k of SEAM_KEYS) delete env[k];
    Object.assign(env, seam);
    const r = spawnSync(process.execPath, [script, ...args], { cwd: sandbox, env, encoding: 'utf8', timeout: 120_000 });
    return { status: r.status, signal: r.signal, out: `${r.stdout || ''}${r.stderr || ''}` };
  };

  const BASE = {
    CODEX_INVOKE_SELFCHECK_CMD: process.execPath,
    CODEX_INVOKE_SELFCHECK_CMD_ARG: quiet,
    CODEX_INVOKE_SELFCHECK_RESOURCES_DIR: resources,
  };
  const dispatch = (out, extra = []) => ['--brief', brief, '--out', out, '--cwd', sandbox, ...extra];

  // `hasnt` is not decoration. The WO-3.15 mislabel was a real message under a real exit code, so the
  // kill cases assert that "could not be run" is ABSENT as well as that exit 3 is present — a subject
  // that reports both codes' text would satisfy a check that only looked for the right phrase.
  const cases = [
    // ----- caller-side refusals, none of which reaches a spawn
    {
      name: 'no arguments at all — the missing --brief/--out refusal',
      args: [], code: 2,
      has: ['--brief <path> and --out <path> are both required'],
    },
    {
      name: '--brief without --out',
      args: ['--brief', brief], code: 2,
      has: ['are both required'],
    },
    {
      name: '--out without --brief',
      args: ['--out', sb('unreached.md')], code: 2,
      has: ['are both required'],
    },
    {
      name: 'an unrecognized flag',
      args: ['--make-it-faster'], code: 2,
      has: ["unrecognized argument '--make-it-faster'"],
    },
    {
      name: '--budget on --probe, which is not a dispatch',
      args: ['--probe', '--budget', '4'], code: 2,
      has: ['--budget applies to a dispatch, not to --probe'],
      hasnt: ['SMOKE'],
    },
    {
      name: 'a non-numeric --budget',
      args: dispatch(sb('unreached.md'), ['--budget', 'about an hour']), code: 2,
      has: ["as a positive number (got 'about an hour')"],
      hasnt: ['fits inside'],
    },
    {
      name: 'a --budget of zero',
      args: dispatch(sb('unreached.md'), ['--budget', '0']), code: 2,
      has: ["as a positive number (got '0')"],
      hasnt: ['fits inside'],
    },
    {
      name: 'the --budget boundary that FITS says so, and the run goes on to the next gate',
      // Two gates in one case, and the brief is the missing one on purpose: the budget passing has to
      // be visible as the run continuing past it, not just as an absent refusal.
      args: ['--brief', noBrief, '--out', sb('unreached.md'), '--budget', '10'], code: 2,
      has: ['stated run budget 10 min + 10 min reserve fits inside the 20 min cap', 'brief not found at'],
      hasnt: ['REFUSED'],
    },
    {
      name: 'the --budget boundary that does NOT fit is refused before anything is created',
      args: dispatch(sb('never-created', 'result.md'), ['--budget', '10.1']), code: 2,
      has: ['REFUSED before dispatch', '10.1 min of stated harness runs', 'does not fit inside the 20 min'],
      hasnt: ['fits inside', 'KILLED', 'codex exec exited'],
      // The structural half of the same claim: refuseIfBudgetDoesNotFit() is called BEFORE the
      // mkdirSync and before the spawn. A call moved below either of them still refuses, still exits
      // 2, and leaves this directory behind — which is the mutation the exit code alone cannot see.
      then: (bad) => {
        if (existsSync(sb('never-created'))) bad.push('the refusal created the output directory, so it ran after mkdirSync rather than before the dispatch');
      },
    },
    {
      name: 'codex-resources missing, dispatch mode',
      args: dispatch(sb('unreached.md')), code: 2,
      seam: { CODEX_INVOKE_SELFCHECK_RESOURCES_DIR: noResources },
      has: ['codex-resources not found at', 'looks missing or moved'],
      hasnt: ['KILLED', 'codex exec exited'],
    },
    {
      name: 'codex-resources missing, probe mode — a harness problem, not a runner verdict',
      args: ['--probe'], code: 2,
      seam: { CODEX_INVOKE_SELFCHECK_RESOURCES_DIR: noResources },
      has: ['This is a harness problem, not a runner verdict'],
      hasnt: ['SMOKE'],
    },

    // ----- the spawn paths, against a stand-in child
    {
      name: 'STARTED THEN KILLED at the cap — exit 3, and never exit 2\'s "could not be run"',
      args: dispatch(sb('killed', 'result.md')), code: 3,
      seam: { CODEX_INVOKE_SELFCHECK_CMD_ARG: sleeps, CODEX_INVOKE_SELFCHECK_TIMEOUT_MS: '900' },
      has: ['KILLED, not refused', 'ended by SIGTERM', 'INVOKE_TIMEOUT_MS', 'Read \'git status\' and the diff'],
      hasnt: ['could not be run', 'never started'],
    },
    {
      name: 'STARTED THEN KILLED on a maxBuffer overrun — still exit 3, and told apart by the signal',
      // The case that makes the discriminator claim non-vacuous: a subject keyed on ETIMEDOUT by name
      // instead of on `signal` passes the case above and calls this one never-started.
      args: dispatch(sb('overrun', 'result.md')), code: 3,
      seam: { CODEX_INVOKE_SELFCHECK_CMD_ARG: floods },
      has: ['KILLED, not refused', 'ENOBUFS'],
      hasnt: ['could not be run', 'INVOKE_TIMEOUT_MS'],
    },
    {
      name: 'NEVER STARTED — exit 2, and never exit 3\'s "KILLED"',
      args: dispatch(sb('never', 'result.md')), code: 2,
      seam: { CODEX_INVOKE_SELFCHECK_CMD: noCommand },
      has: ['codex exec could not be run', 'ENOENT'],
      hasnt: ['KILLED'],
    },
    {
      name: 'control: started, ran, exited non-zero — the runner verdict is still a 1',
      args: dispatch(sb('exited-7', 'result.md')), code: 1,
      seam: { CODEX_INVOKE_SELFCHECK_CMD_ARG: exits7 },
      has: ['codex exec exited 7', 'MISSING at'],
      hasnt: ['KILLED', 'could not be run'],
    },
    {
      name: 'control: exited 0 having written nothing — a runner that failed and said it succeeded',
      args: dispatch(sb('silent', 'result.md')), code: 1,
      has: ['codex exec exited 0 but wrote no output file'],
      hasnt: ['KILLED'],
    },
    {
      name: 'control: the success path still succeeds, and the brief really reached the child',
      args: dispatch(sb('wrote', 'result.md')), code: 0,
      seam: { CODEX_INVOKE_SELFCHECK_CMD_ARG: writes },
      has: ['output written to'],
      hasnt: ['MISSING at', 'KILLED'],
      // Guards against a vacuous run of the whole section: if the stand-in child is being launched
      // but not handed the dispatch, every case above could be passing for the wrong reason.
      then: (bad) => {
        const out = sb('wrote', 'result.md');
        if (!existsSync(out)) bad.push('the child wrote no output file, so nothing here proves it was handed the dispatch');
        else if (!readFileSync(out, 'utf8').includes(BRIEF_MARK)) bad.push('the output file does not carry the brief, so the child was launched without being given one');
      },
    },
  ];

  console.log(`  fixture   ${cases.length} cases over 5 stand-in children — no codex process, and no case names a command`);
  console.log(`            other than this Node binary and one path that does not exist`);
  console.log('');

  let failed = 0;
  for (const c of cases) {
    const bad = [];
    const r = runSubject(c.args, { ...BASE, ...(c.seam || {}) });
    if (r.status !== c.code) {
      bad.push(`exited ${r.status === null ? `null — this run was itself ended by ${r.signal}` : r.status}, expected ${c.code}`);
    }
    for (const phrase of c.has || []) if (!r.out.includes(phrase)) bad.push(`the run never said "${phrase}"`);
    for (const phrase of c.hasnt || []) if (r.out.includes(phrase)) bad.push(`the run said "${phrase}", which belongs to a different exit code`);
    if (c.then) c.then(bad, r);
    if (bad.length) {
      failed++;
      console.log(`FAIL | ${c.name}`);
      for (const b of bad) console.log(`     | ${b}`);
      for (const l of evidence(r.out)) console.log(`     |${l}`);
    } else {
      console.log(`ok   | ${c.name}`);
    }
  }

  console.log('');
  console.log(`  ${cases.length} cases, ${cases.length - failed} caught, ${failed} missed.`);
  console.log('  Covers what WO-2.37 built and drove by hand: every caller-side refusal by exit code AND by');
  console.log('  a phrase of its message, both --budget boundaries at the shipped constants, the');
  console.log('  started-then-killed split both ways round (timeout and maxBuffer), the never-started half');
  console.log('  beside it, and the three exit codes next door that must not absorb any of them.');
  console.log('  NOT covered, because a green run trusted for what it never touched is worse than no check:');
  console.log('  the runner itself — no codex process is started here, by design and by WO-2.40\'s Traps —');
  console.log('  so SMOKE OK and SMOKE FAILED, the probe\'s git init refusal, withCodexPath()\'s PATH');
  console.log('  prepend (the reason this file exists at all), and the { infra } refusal for a codex that');
  console.log('  resolves at neither location, which the seam short-circuits by design. Nor the externally');
  console.log('  killed child: `signal` set with `error` unset is not producible on win32, which is why the');
  console.log('  branch it would exercise says what it says. And nothing here proves a real dispatch works.');
  console.log('');
  console.log(failed ? `FAIL | ${failed} of ${cases.length} gates have stopped biting.`
                     : `PASS | ${cases.length} of ${cases.length} cases behaved. A green run is not coverage — read the paragraph above it.`);
  return failed ? 1 : 0;
}

// --against exists for one acceptance line and is worth the extra argument, exactly as it is in
// wo-gate.mjs: "deleting any one of those gates turns the check red" is settled by putting a copy of
// this script somewhere outside the repository, taking one gate out of THAT copy, and watching the
// cases go red against it. The harness and the subject are separable, and the subject defaults to
// this file — which is the only way to show it without a mutation ever entering tools/.
const argv = process.argv.slice(2);
if (argv[0] === '--self-check') {
  const i = argv.indexOf('--against');
  process.exit(selfCheck(i >= 0 && argv[i + 1] ? argv[i + 1] : fileURLToPath(import.meta.url)));
}

const parsed = parseArgs(argv);
// --budget describes a dispatch, and the probe is not one. Refusing the combination is cheaper
// than a flag that is accepted and silently ignored, which reads as a budget that was checked.
if (parsed.probe && parsed.budget !== undefined) {
  fail(2, 'codex-invoke: --budget applies to a dispatch, not to --probe (the probe caps itself at two minutes).');
}
if (parsed.probe) runProbe();
else runInvoke(parsed);
