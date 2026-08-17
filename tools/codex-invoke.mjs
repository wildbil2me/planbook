// Codex dispatch plumbing: the exec-time smoke test and the real dispatch, in one file so the
// codex-resources\ PATH fix (see plans/dispatch-retro.md § Codex) can only be right or wrong in
// one place, not drift between a probe copy and a dispatch copy.
//
// Usage:
//   node tools/codex-invoke.mjs --probe
//   node tools/codex-invoke.mjs --brief <path> --out <path> [--cwd <path>] [--budget <minutes>] --detach
//   node tools/codex-invoke.mjs --status <path> [--wait <seconds>]
//   node tools/codex-invoke.mjs --brief <path> --out <path> [--cwd <path>] [--budget <minutes>]
//   node tools/codex-invoke.mjs --self-check [--against <path>]
//
// --detach is the dispatch shape the orchestrator uses, and the plain --brief/--out form above it is
// the same dispatch held in the caller's own process. WO-2.45 is why they are two: the caller is a
// Bash tool call whose timeout the tool itself caps at 600000 ms, ten minutes, which fires before
// INVOKE_TIMEOUT_MS ever does — so a foreground dispatch is killed by its caller, the exit-3 report
// below is never printed, and the reader who has to go and look at a half-applied mutation is told
// nothing at all. --detach hands the run to a supervisor process that outlives the call; --status
// reads the record it leaves behind. See OUTER_CALL_CEILING_MS.
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
//      --status answers 3 for the same shape one level up: a detached supervisor that is GONE and
//      left no verdict (ABANDONED). Same sentence, same instruction — a dispatch ended before it
//      could say what it did, with its writes still in the tree.
//   4  no verdict YET, and nothing has been judged. --detach exits 4 the moment it has handed the
//      dispatch to a supervisor, and --status exits 4 while that supervisor is still working. It is
//      deliberately not 0: WO-2.20's scar is a spawn reported as a run, and the one defence that
//      cannot be talked around is that the code meaning "started" is not the code meaning
//      "succeeded". Exit 0 from this file still means exactly one thing — codex exited 0 and the
//      output file exists.
//
// Every one of those codes is driven, against a stand-in child and with no codex process anywhere
// near it, by `--self-check` at the foot of this file: 0 if every gate still bites, 1 if one has
// stopped. Both gates in here are behaviour nobody sees on a normal run, which is the whole reason
// that flag exists (WO-2.40); its section comment is the account.

import { spawn, spawnSync } from 'node:child_process';
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
//   - It was not the constraint that bound first, and WO-2.45 is that sentence being acted on
//     rather than only recorded. WO-2.37 wrote here that the outer Bash call's 600000 ms fires
//     before this number and that raising this number moves it not at all — true, and it meant the
//     twenty minutes was a promise nothing could keep. The fix was to move the dispatch OUT of the
//     call rather than to shrink the promise to fit it, so twenty minutes is now the real cap on a
//     --detach dispatch. See OUTER_CALL_CEILING_MS below for the constraint that still binds a
//     foreground one, and plans/verification-tooling.md § "Detaching the Codex dispatch" for the
//     shape that was rejected.
//   - A --timeout flag was considered and refused. A caller who can raise the cap can buy exactly
//     the mid-mutation SIGTERM described above. --budget spends the same argument the other way:
//     the caller states what the Acceptance needs and is refused before anything is dispatched.
// The answer to a work order that does not fit is its ROUTE, not this number — see
// plans/work-orders/ROUTING.md § "Route to Codex", which asks the multiplication at routing time.
const INVOKE_TIMEOUT_MS = 20 * 60 * 1000;

// The OTHER cap, the one this file does not own and cannot raise: the orchestrator runs this script
// from a Bash tool call, and that tool caps its own `timeout` argument at 600000 ms. Ten minutes,
// against the twenty above, and it is a CEILING rather than a preference — "give the outer call
// more" is not an available move, which is what made WO-2.45 a design question and not a constant
// edit.
//
// WHAT IT COSTS WHEN IT FIRES FIRST, because this is the thing the twenty-minute comment above could
// not see. It is the SCRIPT that gets killed, not the child. runInvoke() never reaches its
// started-then-killed branch, never prints the exit-3 diagnosis, and the caller is left holding a
// bare timeout over a tree that may be carrying a half-applied mutation — which is WO-3.15's shape
// (2026-08-14) reached around the side of the code written to prevent it.
//
// So it is read here rather than left in prose, and it is read in exactly one place: bindingCap(),
// which answers what actually constrains THIS invocation. A foreground dispatch is constrained by
// this number; a --detach dispatch is not constrained by it at all, because the supervisor is no
// longer inside the call that gets killed.
const OUTER_CALL_CEILING_MS = 600 * 1000;

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
    else if (a === '--detach') args.detach = true;
    else if (a === '--status') args.status = argv[++i];
    else if (a === '--wait') args.wait = argv[++i];
    else if (a === '--supervise') args.supervise = argv[++i];
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

// WHAT ACTUALLY CONSTRAINS THIS INVOCATION — the whole of WO-2.45 in one function, and the reason
// the answer is computed rather than written down. Before this row the budget gate compared against
// INVOKE_TIMEOUT_MS unconditionally and printed the comparison to the router as a promise, while the
// thing that really ended the dispatch was a number in another file that this one never read. A gate
// that clears a dispatch against a cap nobody is enforcing is worse than no gate: it is a refusal
// that says yes to exactly what it exists to refuse.
//
// So the smaller of the two applies, and the message names which one it was. A foreground dispatch
// dies with the call that made it — 600000 ms. A --detach dispatch is handed to a supervisor that
// outlives the call, so nothing shortens it below its own cap.
function bindingCap(detached) {
  return detached || INVOKE_TIMEOUT_MS <= OUTER_CALL_CEILING_MS
    ? { ms: INVOKE_TIMEOUT_MS, name: 'INVOKE_TIMEOUT_MS', held: 'a detached dispatch runs to its own cap' }
    : { ms: OUTER_CALL_CEILING_MS, name: 'OUTER_CALL_CEILING_MS', held: 'a foreground dispatch dies with the call that made it' };
}

// The pre-flight refusal. It runs BEFORE the install is inspected and before anything is spawned,
// which is the point: whether a work order's Acceptance fits inside the cap is a fact about the
// work order, so the answer has to read the same on a machine with no Codex on it at all. A caller
// that states no budget is not refused — the rubric is where the multiplication is required, this
// is where it can be enforced — and a budget that fits prints so, because a gate that is silent
// when it passes is indistinguishable from a gate nobody wired up.
//
// Since WO-2.45 it fits against bindingCap() rather than against INVOKE_TIMEOUT_MS. The consequence
// worth stating plainly: with a ten-minute ceiling and a ten-minute reserve, NO positive budget fits
// in the foreground, so the answer to a stated budget there is always the refusal below. That is not
// a bug in the arithmetic — it is the arithmetic finally being done against the number that was
// killing the dispatches, and the way out of it is --detach, which the message names.
function refuseIfBudgetDoesNotFit(budgetArg, { detached }) {
  if (budgetArg === undefined) return;
  const stated = Number(budgetArg);
  if (!Number.isFinite(stated) || stated <= 0) {
    fail(2, `codex-invoke: --budget takes the harness minutes this work order's Acceptance needs, as a positive number (got '${budgetArg}').`);
  }
  const cap = bindingCap(detached);
  const budgetMs = stated * 60 * 1000;
  if (budgetMs + WORK_RESERVE_MS > cap.ms) {
    const wayOut = detached
      ? 'route this one to Claude Sonnet (plans/work-orders/ROUTING.md § "Which Claude").'
      : 'pass --detach, which hands the dispatch to a supervisor that outlives this call and restores the 20 min INVOKE_TIMEOUT_MS — or route this one to Claude Sonnet (plans/work-orders/ROUTING.md § "Which Claude").';
    fail(2, `codex-invoke: REFUSED before dispatch — ${minutes(budgetMs)} min of stated harness runs plus the ${minutes(WORK_RESERVE_MS)} min reserve for reading, writing and reverting does not fit inside the ${minutes(cap.ms)} min ${cap.name} (${cap.held}), and a dispatch killed at that cap is SIGTERMed with its mutations still in the tree; nothing ran, nothing was written, the runner was never asked — ${wayOut}`);
  }
  console.log(`codex-invoke: stated run budget ${minutes(budgetMs)} min + ${minutes(WORK_RESERVE_MS)} min reserve fits inside the ${minutes(cap.ms)} min ${cap.name}, which is what binds this dispatch.`);
}

// Every caller-side refusal, in the order they have always fired, kept in ONE place because
// --detach has to make all of them in the caller's own process. That is the half of the foreground
// path worth keeping: exit 2's invariant — nothing was dispatched, the tree is untouched — is only
// useful to a reader who is still there to read it, and a refusal handed to a background process
// would be a refusal nobody sees until they poll for it.
function preflight(args, { detached }) {
  if (!args.brief || !args.out) {
    fail(2, 'codex-invoke: --brief <path> and --out <path> are both required.');
  }
  refuseIfBudgetDoesNotFit(args.budget, { detached });
  const briefPath = resolve(args.brief);
  const outPath = resolve(args.out);
  const cwd = args.cwd ? resolve(args.cwd) : process.cwd();

  if (!existsSync(briefPath)) {
    fail(2, `codex-invoke: brief not found at ${briefPath}`);
  }
  if (!existsSync(codexResourcesDir())) {
    fail(2, `codex-invoke: codex-resources not found at ${codexResourcesDir()} — the Codex standalone install looks missing or moved.`);
  }
  return { briefPath, outPath, cwd };
}

// The dispatch itself. It RETURNS its verdict rather than exiting on it — { code, out, err } — and
// that is the one structural change WO-2.45 made to this path. A supervisor has no stdout anybody is
// reading, so the report has to become a value before it can be written into a status file; the
// alternative was a second copy of these six outcomes, which is how the exit-3 wording and the
// header block would start disagreeing. The streams are preserved rather than merged: `out` is what
// went to stdout before, `err` is what went to stderr, and the messages are unchanged to the byte.
function dispatchOnce({ briefPath, outPath, cwd }) {
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
  if (infra) return { code: 2, err: `codex-invoke: ${infra}` };

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
    return { code: 3, err: `codex-invoke: KILLED, not refused — codex started, ran, and was ended by ${result.signal} before it could exit: ${why}. Nothing rolled the tree back: whatever this dispatch wrote is still in it, INCLUDING any deliberate mutation it was holding mid-check. Read 'git status' and the diff before re-dispatching or re-routing — the work may be partial, half-applied, or complete (WO-3.15 finished its work and was killed anyway). This is not a verdict on the runner and not exit 2's "nothing was dispatched".` };
  }

  if (result.error) {
    return { code: 2, err: `codex-invoke: codex exec could not be run: ${result.error.message}` };
  }

  const wrote = existsSync(outPath);
  const out = `codex exec exited ${result.status}${result.signal ? ` (signal ${result.signal})` : ''}; output ${wrote ? 'written to' : 'MISSING at'} ${outPath}`;

  if (result.status !== 0) {
    return { code: 1, out, err: (result.stderr || '').trim() };
  }
  if (!wrote) {
    // A zero exit with nothing written is a runner that failed and said it succeeded — treat it
    // as a failed dispatch, not a pass with no output.
    return { code: 1, out, err: 'codex exec exited 0 but wrote no output file. Treat as a failed dispatch.' };
  }
  return { code: 0, out };
}

function report({ out, err }) {
  if (out) console.log(out);
  if (err) console.error(err);
}

// The foreground dispatch, unchanged in what it does and now honest about what it is. It is kept
// because --self-check drives every spawn outcome through it and because a human at a terminal has
// no outer timeout to lose to — but it is no longer the shape the orchestrator is told to use, so it
// says so once, before it spends twenty minutes it may not have.
function runInvoke(args) {
  const paths = preflight(args, { detached: false });
  console.error('codex-invoke: foreground dispatch — it dies with the call that started it, and the started-then-killed report dies with it. --detach outlives the caller (WO-2.45).');
  const r = dispatchOnce(paths);
  report(r);
  process.exit(r.code);
}

// ----- --detach, --supervise, --status: the dispatch outlives the call that started it
//
// WO-2.45. The three of them are one mechanism and are best read together.
//
// --detach     makes every caller-side refusal in the caller's own process (so exit 2 still reaches
//              a reader), writes the dispatch record, hands the run to a detached supervisor, and
//              exits 4 — "started, nothing judged". It never exits 0.
// --supervise  is that supervisor, and is not a documented invocation: it is this same file, run
//              again, holding the spawnSync the caller used to hold. It writes its verdict into the
//              record on the way out, on every path.
// --status     is what reads the corpse, and the Traps line on this row is that a dispatch nobody is
//              holding is a dispatch nobody notices dying. Three answers: the verdict (0/1/3) once
//              the record is terminal, 4 while it is still running, and 3 — ABANDONED — for a
//              supervisor that is gone and left none. That last one is the corpse, and it is 3
//              rather than a code of its own because it is the same fact exit 3 already carries:
//              something ran, nobody knows how far it got, go and read the tree.
//
// WHAT THIS DOES NOT DO, said plainly because it is the cost the work order named. Detaching the
// DISPATCH does not detach the ORCHESTRATOR: step 4b's rule — the spawn is not the work — survives
// only because --status --wait blocks, so the caller still sits on the run, in slices that fit
// inside a Bash call instead of in one slice that does not. If a future caller polls once, sees 4
// and writes a report, that is WO-2.20's failure with a new mechanism under it, and no code here can
// stop it; the exit code being 4 rather than 0 is the most this file can do.
const STATUS_VERSION = 1;

// How long past its own cap a supervisor may go before a reader is entitled to call it dead. It
// covers node's startup, the spawn, and the seconds between the SIGTERM and the record being
// written — all small, and generous on purpose: declaring a live dispatch abandoned is the one
// mistake here that sends somebody to read a diff that is still being written.
const ABANDON_GRACE_MS = 2 * 60 * 1000;

// Beside the result file, named after it, so the three files of one dispatch sort together in
// .claude/dispatch/ — the brief that asked, the record of the run, and the result that came back.
function statusPathFor(outPath) {
  return `${outPath.replace(/\.[^.\\/]*$/, '')}.dispatch.json`;
}

function writeStatus(p, record) {
  writeFileSync(p, `${JSON.stringify(record, null, 2)}\n`);
}

// The version is READ and not merely written. A constant stamped into a file and never checked is a
// constant that drifts, and the failure it would drift into is the worst one available here: a
// reader that misinterprets an older record's fields and answers 0 or 4 over a dispatch it has not
// understood. Refusing is the conservative direction — exit 2, nothing judged.
function readStatus(p) {
  let record;
  try {
    record = JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    fail(2, `codex-invoke: the dispatch record at ${p} could not be read as JSON (${e.message}). It is written by --detach and rewritten once by the supervisor; a record that is neither is a file somebody else owns.`);
  }
  if (record.version !== STATUS_VERSION) {
    fail(2, `codex-invoke: the dispatch record at ${p} says version ${record.version}, and this script writes and reads version ${STATUS_VERSION}. Refusing to guess what its fields mean — read the file, or re-dispatch.`);
  }
  return record;
}

// A synchronous sleep, because everything else on this path is synchronous and an async --status
// would mean two ways of reading one file. Atomics.wait on a buffer nothing else can see is the
// stdlib's own answer; it blocks the thread and takes no dependency.
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// Alive rather than exited. `process.kill(pid, 0)` signals nothing and throws ESRCH when there is no
// such process; EPERM means it exists and is not ours, which is still alive. THE RESIDUE, named
// rather than papered over: a pid can be recycled, and a recycled pid reads as alive forever. That
// is why elapsed time is the second arm below and not a nicety — it answers without trusting the pid
// at all, and the two arms only ever disagree in the direction of waiting longer.
function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

function abandonedReason(record) {
  const elapsed = Date.now() - Date.parse(record.startedAt);
  if (record.pid == null) {
    return elapsed > 60_000
      ? `the supervisor never recorded a pid, ${Math.round(elapsed / 1000)}s after --detach wrote this record — it did not come up`
      : null;
  }
  if (!pidAlive(record.pid)) return `the supervisor (pid ${record.pid}) is gone and wrote no verdict`;
  const cap = record.capMs || INVOKE_TIMEOUT_MS;
  if (elapsed > cap + ABANDON_GRACE_MS) {
    return `pid ${record.pid} has been running ${minutes(elapsed)} min, past its own ${minutes(cap)} min cap plus ${minutes(ABANDON_GRACE_MS)} min of grace, and has written no verdict`;
  }
  return null;
}

function runDetach(args) {
  const paths = preflight(args, { detached: true });
  const statusPath = statusPathFor(paths.outPath);
  mkdirSync(dirname(statusPath), { recursive: true });

  // Written BEFORE the spawn, and the pid is filled in by the supervisor itself rather than by this
  // process. Writing it here would mean two writers on one file with no ordering between them: the
  // supervisor can reach its verdict — a refusal from inside dispatchOnce, say — before this process
  // gets its second write in, and the launcher would then clobber a finished record with a running
  // one. One writer per phase, and the pid the file carries is the pid that wrote it.
  const record = {
    version: STATUS_VERSION,
    state: 'running',
    pid: null,
    brief: paths.briefPath,
    out: paths.outPath,
    cwd: paths.cwd,
    budgetMinutes: args.budget === undefined ? null : Number(args.budget),
    capMs: invokeTimeout(),
    startedAt: new Date().toISOString(),
  };
  writeStatus(statusPath, record);

  // The supervisor's own cwd is deliberately NOT the dispatch cwd — it holds every path it needs as
  // an absolute, and on Windows a live process sitting in a directory is a directory nothing can
  // delete. --self-check removes its sandbox on the way out, and a supervisor parked in it would
  // turn that into an EBUSY on a green run.
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), '--supervise', statusPath], {
    cwd: tmpdir(),
    env: process.env,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();

  console.log(`codex-invoke: DISPATCHED and detached — supervisor pid ${child.pid}, cap ${minutes(record.capMs)} min. NOTHING HAS BEEN JUDGED YET.`);
  console.log(`  record  ${statusPath}`);
  console.log(`  read it node tools/codex-invoke.mjs --status ${statusPath} --wait 540`);
  process.exit(4);
}

function runSupervise(statusPath) {
  const p = resolve(statusPath);
  if (!existsSync(p)) fail(2, `codex-invoke --supervise: no dispatch record at ${p}`);
  const record = readStatus(p);
  record.pid = process.pid;
  record.supervisorAt = new Date().toISOString();
  writeStatus(p, record);

  // Every exit from here writes a verdict, including the one nobody planned. A supervisor that dies
  // without writing is the ABANDONED case above, which is a real answer but a worse one — it can
  // only ever say "something happened", where a thrown error can say what.
  let r;
  try {
    r = dispatchOnce({ briefPath: record.brief, outPath: record.out, cwd: record.cwd });
  } catch (e) {
    r = { code: 2, err: `codex-invoke: the supervisor threw before it could reach a verdict: ${e && e.message}` };
  }
  // `stdout`/`stderr` rather than `out`/`err`: `out` is already this record's field for the OUTPUT
  // PATH, and the verdict overwriting the path it was dispatched to is a one-word bug that a reader
  // of the JSON would diagnose as a corrupt record.
  record.state = 'done';
  record.finishedAt = new Date().toISOString();
  record.code = r.code;
  record.stdout = r.out || '';
  record.stderr = r.err || '';
  writeStatus(p, record);
  process.exit(r.code);
}

// --wait blocks, and is capped below the ceiling that started all this: a poll asked to wait longer
// than the call holding it is the same defect one level up. 540 s leaves a minute of margin inside a
// 600000 ms Bash call, and a caller who needs longer makes a second call — which is the point of the
// verdict living in a file rather than in a process.
const MAX_WAIT_S = 540;

function runStatus(statusPath, waitArg) {
  const p = resolve(statusPath);
  if (!existsSync(p)) {
    fail(2, `codex-invoke --status: no dispatch record at ${p} — --detach writes one beside the result file it was given. Nothing was read and nothing is running that this can see.`);
  }
  let waitS = 0;
  if (waitArg !== undefined) {
    waitS = Number(waitArg);
    if (!Number.isFinite(waitS) || waitS < 0) {
      fail(2, `codex-invoke: --wait takes seconds, as a number that is not negative (got '${waitArg}').`);
    }
    if (waitS > MAX_WAIT_S) {
      fail(2, `codex-invoke: --wait is capped at ${MAX_WAIT_S} s (got ${waitS}), so that one poll fits inside the 600000 ms the caller's own call is capped at. Poll again rather than waiting longer in one call.`);
    }
  }
  const deadline = Date.now() + waitS * 1000;
  for (;;) {
    const record = readStatus(p);
    if (record.state === 'done') {
      report({ out: record.stdout, err: record.stderr });
      process.exit(record.code);
    }
    const gone = abandonedReason(record);
    if (gone) {
      fail(3, `codex-invoke --status: ABANDONED — ${gone}. This dispatch started and nothing knows how far it got, which is exit 3's whole meaning: nothing rolled the tree back, so whatever it wrote is still in it, INCLUDING any deliberate mutation it was holding mid-check. Read 'git status' and the diff before re-dispatching or re-routing. Record: ${p}`);
    }
    if (Date.now() >= deadline) {
      const elapsed = Date.now() - Date.parse(record.startedAt);
      console.log(`codex-invoke --status: RUNNING — pid ${record.pid ?? 'not yet recorded'}, ${minutes(elapsed)} min in, cap ${minutes(record.capMs || INVOKE_TIMEOUT_MS)} min. NOTHING HAS BEEN JUDGED YET; poll again.`);
      process.exit(4);
    }
    sleepSync(2000);
  }
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
//
// AND THE BOUNDARY MOVED AT WO-2.45, WHICH IS THAT PARAGRAPH BEING PAID OUT RATHER THAN CONTRADICTED.
// Neither constant changed value. What changed is which constant the gate compares against: 20 min
// belongs to a --detach dispatch, and a FOREGROUND one is held inside a Bash call the tool caps at
// 600000 ms, so the ten-minute reserve alone fills it and no positive budget fits there at all. So
// the pair below is now a pair of pairs — 10 fits and 10.1 does not, both under --detach; 10 and 0.1
// are both refused in the foreground, and the first of those is the exact sentence that read "fits
// inside the 20 min cap" before this row while the call holding it died at ten. The two foreground
// cases are the regression guard for WO-2.45 itself: a subject that goes back to comparing against
// INVOKE_TIMEOUT_MS unconditionally passes both --detach cases and fails both of these.

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

  // Dispatch records planted by hand (WO-2.45). --status answers three ways, and two of them are
  // states no fixture should have to produce by waiting: a supervisor that died, and one still
  // inside a twenty-minute cap. The record is the whole interface between the supervisor and the
  // reader, so planting one is driving the reader — the same shape as wo-gate.mjs planting a tracker
  // rather than running a dispatch to get one.
  const plantRecord = (name, fields) => write(sb(`${name}.dispatch.json`), `${JSON.stringify({
    version: 1,
    state: 'running',
    pid: null,
    brief,
    out: sb(`${name}-result.md`),
    cwd: sandbox,
    budgetMinutes: null,
    capMs: INVOKE_TIMEOUT_MS,
    startedAt: new Date().toISOString(),
    ...fields,
  }, null, 2)}\n`);

  // A pid this run has WATCHED exit, rather than a large number chosen for looking unlikely. The
  // residue: Windows can recycle a pid, and a recycled one would read as alive and turn the case
  // that uses it red on a correct subject. Seconds-scale reuse is remote enough to accept and is
  // recorded here rather than left for somebody to rediscover from one confusing red run.
  const deadPid = spawnSync(process.execPath, ['-e', '0']).pid;

  // Every seam variable is cleared before a case sets its own, so a shell that happens to be
  // carrying one cannot quietly change what is being asserted.
  // `ms` is here for one case and is worth the two lines: --detach's whole claim is that the caller
  // gets its process back BEFORE the dispatch ends, and a subject that quietly ran in the foreground
  // would print the same DISPATCHED line, exit the same 4, and differ only in how long it took.
  const runSubject = (args, seam) => {
    const env = { ...process.env };
    for (const k of SEAM_KEYS) delete env[k];
    Object.assign(env, seam);
    const t0 = Date.now();
    const r = spawnSync(process.execPath, [script, ...args], { cwd: sandbox, env, encoding: 'utf8', timeout: 120_000 });
    return { status: r.status, signal: r.signal, ms: Date.now() - t0, out: `${r.stdout || ''}${r.stderr || ''}` };
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
      name: 'DETACHED: the --budget boundary that FITS says so, and the run goes on to the next gate',
      // Two gates in one case, and the brief is the missing one on purpose: the budget passing has to
      // be visible as the run continuing past it, not just as an absent refusal.
      args: ['--brief', noBrief, '--out', sb('unreached.md'), '--budget', '10', '--detach'], code: 2,
      has: ['stated run budget 10 min + 10 min reserve fits inside the 20 min INVOKE_TIMEOUT_MS', 'brief not found at'],
      hasnt: ['REFUSED'],
    },
    {
      name: 'DETACHED: the --budget boundary that does NOT fit is refused before anything is created',
      args: dispatch(sb('never-created', 'result.md'), ['--budget', '10.1', '--detach']), code: 2,
      has: ['REFUSED before dispatch', '10.1 min of stated harness runs', 'does not fit inside the 20 min INVOKE_TIMEOUT_MS'],
      hasnt: ['fits inside', 'KILLED', 'codex exec exited'],
      // The structural half of the same claim: refuseIfBudgetDoesNotFit() is called BEFORE the
      // mkdirSync and before the spawn. A call moved below either of them still refuses, still exits
      // 2, and leaves this directory behind — which is the mutation the exit code alone cannot see.
      // Under --detach it also has to fire before the RECORD is written, which is the same claim
      // one file further out: a refused dispatch that leaves a record behind is a dispatch --status
      // will report as running forever.
      then: (bad) => {
        if (existsSync(sb('never-created'))) bad.push('the refusal created the output directory, so it ran after mkdirSync rather than before the dispatch');
      },
    },
    {
      // WO-2.45's regression guard, and the case this row exists for. Ten minutes of stated harness
      // runs is what ROUTING.md's own worked examples ask for, and before this row the answer was
      // "fits inside the 20 min cap" — printed to a router, from inside a call that dies at ten.
      name: 'FOREGROUND: the same budget that fits a detached dispatch is refused, against the outer ceiling',
      args: dispatch(sb('never-created-fg', 'result.md'), ['--budget', '10']), code: 2,
      has: ['REFUSED before dispatch', '10 min of stated harness runs', 'does not fit inside the 10 min OUTER_CALL_CEILING_MS', 'a foreground dispatch dies with the call that made it', 'pass --detach'],
      hasnt: ['fits inside', 'KILLED', 'codex exec exited'],
      then: (bad) => {
        if (existsSync(sb('never-created-fg'))) bad.push('the refusal created the output directory, so it ran after mkdirSync rather than before the dispatch');
      },
    },
    {
      // The other side of the foreground boundary, which is that there is no other side: the reserve
      // alone is the whole ceiling, so the smallest statable budget is refused too. Written as its own
      // case because "no budget fits in the foreground" is a claim about the arithmetic and not about
      // the number 10, and a subject that special-cased one value would pass the case above it.
      name: 'FOREGROUND: even a tenth of a minute is refused — the 10 min reserve already fills the ceiling',
      args: dispatch(sb('never-created-fg2', 'result.md'), ['--budget', '0.1']), code: 2,
      has: ['REFUSED before dispatch', '0.1 min of stated harness runs', 'does not fit inside the 10 min OUTER_CALL_CEILING_MS'],
      hasnt: ['fits inside', 'codex exec exited'],
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

    // ----- --detach and --status (WO-2.45): the dispatch outlives the call, and something reads the corpse
    {
      // The row's central claim, driven rather than argued: exit 3 survives when the caller does not.
      // The launcher returns in well under the dispatch's own cap — that is the detaching — and the
      // started-then-killed report is still there afterwards, in a file, with its exit code intact.
      // A subject that ran the dispatch in the foreground fails on `ms`; one whose supervisor never
      // writes a verdict fails on the record; one that regressed the kill split fails on the code.
      name: 'DETACHED, then killed at the cap — the launcher returns 4 in a moment, the verdict is still 3',
      args: dispatch(sb('detached', 'result.md'), ['--detach']), code: 4,
      seam: { CODEX_INVOKE_SELFCHECK_CMD_ARG: sleeps, CODEX_INVOKE_SELFCHECK_TIMEOUT_MS: '4000' },
      has: ['DISPATCHED and detached', 'NOTHING HAS BEEN JUDGED YET'],
      hasnt: ['KILLED', 'could not be run', 'codex exec exited'],
      then: (bad, r) => {
        if (r.ms >= 4000) bad.push(`the launcher took ${r.ms} ms, which is its own dispatch's whole cap — this did not detach, it waited`);
        const rec = sb('detached', 'result.dispatch.json');
        if (!existsSync(rec)) {
          bad.push('--detach wrote no dispatch record, so nothing exists that could read the corpse');
          return;
        }
        const s = runSubject(['--status', rec, '--wait', '60'], BASE);
        if (s.status !== 3) bad.push(`--status answered ${s.status} for a dispatch killed at its cap, expected 3`);
        for (const phrase of ['KILLED, not refused', 'ended by SIGTERM', 'INVOKE_TIMEOUT_MS', 'Read \'git status\' and the diff']) {
          if (!s.out.includes(phrase)) bad.push(`--status never said "${phrase}", so the diagnosis did not survive the detach`);
        }
        if (s.out.includes('could not be run')) bad.push('--status said "could not be run", which belongs to a different exit code');
      },
    },
    {
      name: '--status on a record that does not exist — a caller-side refusal, and nothing is running',
      args: ['--status', sb('no-such-dispatch.json')], code: 2,
      has: ['no dispatch record at', 'Nothing was read'],
      hasnt: ['ABANDONED', 'RUNNING'],
    },
    {
      // The corpse itself, on the arm that will actually happen: the machine went away, or somebody
      // killed the tree, and a record says `running` over a pid that is gone. Driven with a pid this
      // check has watched exit, and with the elapsed arm deliberately NOT in play — capMs is 20 min
      // and the record is seconds old, so only the liveness read can produce this answer.
      name: 'ABANDONED: a record left running by a supervisor that is gone reads as exit 3, not as running',
      args: ['--status', plantRecord('corpse-dead-pid', { pid: deadPid, capMs: 20 * 60 * 1000, startedAt: new Date().toISOString() })], code: 3,
      has: ['ABANDONED', `pid ${deadPid}`, 'is gone and wrote no verdict', 'Read \'git status\' and the diff'],
      hasnt: ['RUNNING', 'NOTHING HAS BEEN JUDGED YET'],
    },
    {
      // The second arm, which is the one that does not trust the pid at all — pid reuse would make a
      // dead supervisor read as alive forever, so elapsed time answers on its own. Driven with THIS
      // process's pid, which is certainly alive, against a cap it is certainly past.
      name: 'ABANDONED: a live pid past its cap and its grace is still a corpse',
      args: ['--status', plantRecord('corpse-overrun', { pid: process.pid, capMs: 1000, startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() })], code: 3,
      has: ['ABANDONED', 'past its own', 'min of grace', 'has written no verdict'],
      hasnt: ['is gone and wrote no verdict', 'RUNNING'],
    },
    {
      // The control the three above need: a record that is genuinely still running must NOT be called
      // a corpse. Without it, a subject whose abandonedReason() returned a string unconditionally
      // would pass every case in this block.
      name: 'control: a record still inside its cap, with a live pid, is RUNNING and exits 4',
      args: ['--status', plantRecord('still-running', { pid: process.pid, capMs: 20 * 60 * 1000, startedAt: new Date().toISOString() })], code: 4,
      has: ['RUNNING', 'NOTHING HAS BEEN JUDGED YET'],
      hasnt: ['ABANDONED', 'KILLED'],
    },
    {
      // The version stamp being read rather than only written. Without this case the check is a
      // constant nothing tests, which is this file's own subject one level down.
      name: 'a dispatch record from a version this script does not read is refused, not guessed at',
      args: ['--status', plantRecord('from-the-future', { version: 99 })], code: 2,
      has: ['says version 99', 'Refusing to guess what its fields mean'],
      hasnt: ['RUNNING', 'ABANDONED', 'KILLED'],
    },
    {
      name: '--wait past the cap that keeps one poll inside the caller\'s own call',
      args: ['--status', plantRecord('unreached-wait', { pid: process.pid, capMs: 20 * 60 * 1000, startedAt: new Date().toISOString() }), '--wait', '541'], code: 2,
      has: ['--wait is capped at 540 s', 'Poll again rather than waiting longer'],
      hasnt: ['RUNNING', 'ABANDONED'],
    },
  ];

  console.log(`  fixture   ${cases.length} cases over 5 stand-in children and 5 planted dispatch records — no codex`);
  console.log(`            process, and no case names a command other than this Node binary and one path`);
  console.log(`            that does not exist`);
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
  console.log('  a phrase of its message, both --budget boundaries at the shipped constants IN BOTH MODES —');
  console.log('  detached against the 20 min cap, foreground against the 10 min ceiling that binds it —');
  console.log('  the started-then-killed split both ways round (timeout and maxBuffer), the never-started');
  console.log('  half beside it, and the three exit codes next door that must not absorb any of them. Since');
  console.log('  WO-2.45 it also drives the detached path end to end: the launcher returning before its own');
  console.log('  dispatch ends, the exit-3 diagnosis surviving in the record, and both arms of the corpse');
  console.log('  read — a supervisor that is gone, and one alive past its cap — with a running control');
  console.log('  beside them so that "everything is abandoned" cannot pass.');
  console.log('  NOT covered, because a green run trusted for what it never touched is worse than no check:');
  console.log('  the runner itself — no codex process is started here, by design and by WO-2.40\'s Traps —');
  console.log('  so SMOKE OK and SMOKE FAILED, the probe\'s git init refusal, withCodexPath()\'s PATH');
  console.log('  prepend (the reason this file exists at all), and the { infra } refusal for a codex that');
  console.log('  resolves at neither location, which the seam short-circuits by design. Nor the externally');
  console.log('  killed child: `signal` set with `error` unset is not producible on win32, which is why the');
  console.log('  branch it would exercise says what it says. Nor a caller that polls --status once, reads 4');
  console.log('  and writes a report anyway, which is a rule in the orchestrator and not a gate in here.');
  console.log('  And nothing here proves a real dispatch works.');
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
// --status and --supervise read a dispatch record; --detach writes one. Refusing the combinations
// rather than picking a winner, on the --probe --budget precedent above: a flag accepted and
// silently ignored reads to its caller as a flag that was honoured.
if (parsed.status !== undefined && (parsed.detach || parsed.brief || parsed.out || parsed.probe)) {
  fail(2, 'codex-invoke: --status reads a dispatch record and starts nothing, so it takes no --brief, --out, --detach or --probe.');
}
if (parsed.wait !== undefined && parsed.status === undefined) {
  fail(2, 'codex-invoke: --wait applies to --status, which is the only thing here that waits.');
}
if (parsed.probe) runProbe();
else if (parsed.supervise !== undefined) runSupervise(parsed.supervise);
else if (parsed.status !== undefined) runStatus(parsed.status, parsed.wait);
else if (parsed.detach) runDetach(parsed);
else runInvoke(parsed);
