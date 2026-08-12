# WO-8.8 — read the deployment, not the repository · implementation result

**Route** Claude (work-order-implementer, Opus) · **Date** 2026-08-12
**Work order** `plans/work-orders/phase-8-packaging.md` § WO-8.8

**Summary.** `tools/verify-deploy.mjs` exists, one file, bare Node, no dependencies. It runs green
against `https://planbook.hwgteach.com` — `12 checks · 12 passed · 0 failed`, exit 0 — and all
twelve of its checks have been watched failing against the defect each is named for, on a throwaway
fixture origin. Both motivating faults were reproduced. The network was reachable from this machine,
so **no acceptance line here is deferred to a human**; there is no 👤 line in this work order and
none was ticked.

---

## Against the Acceptance list, one by one

### 1. Running it against the live origin today passes on every check — **met**

`node tools/verify-deploy.mjs` (default origin), 2026-08-12, run twice: once at 20:06Z on the first
draft and again after the last edit. Both `12 checks · 12 passed · 0 failed`, exit **0**. Final run:

```
PASS | the shell document answers 200  :: 200
PASS | the shell document is HTML  :: text/html; charset=utf-8
PASS | the shell document carries Cache-Control: no-cache  :: cache-control: no-cache
PASS | /sw.js answers 200  :: 200
PASS | /sw.js is JavaScript  :: application/javascript
PASS | /sw.js carries Cache-Control: no-cache  :: cache-control: no-cache
PASS | the deployed sw.js declares a SHELL list this check can read  :: 42 entries, ./ … ./icons/icon-512.png
PASS | every path in the deployed SHELL resolves without a redirect  :: 42 path(s), every one answered without a 3xx
PASS | every path in the deployed SHELL answers 200  :: 42 path(s), all 200
PASS | every path in the deployed SHELL answers with the content type its name implies  :: 42 of 42 path(s) carry a type this check knows, and each matched
PASS | the deployed sw.js CACHE matches the working tree  :: both planbook-shell-v46
PASS | no _worker.js, _routes.json or /functions/ path answers as a script  :: 4 path(s) probed, none of them answered with script or config content. A 200 here is this host serving the shell for an unknown path, not a file

https://planbook.hwgteach.com · 12 checks · 12 passed · 0 failed
```

Per-path evidence is printed above each block — status, content type, `Cache-Control`, byte count,
and `cf-cache-status`. Two lines from the real run worth quoting, because they are the two faults
this work order is made of, now readable rather than inferred:

```
  GET   /sw.js       200 · application/javascript · cache-control: no-cache · 7154 B · cf-cache-status: REVALIDATED
  GET   /index.html  308 · → / · (no content-type) · cache-control: no-cache · 0 B · cf-cache-status: DYNAMIC
```

**The network was reachable from this machine.** I flag that explicitly because the brief warned
about the inverse: had it not been, this line would have been *needs-a-human* with
`node tools/verify-deploy.mjs` as the command to run, not a pass and not a failure. It did not come
to that.

### 2. Each check is proved by the defect it is named for — **met**

Proved by running, not by reasoning. A throwaway fixture origin (`fixture.mjs` in the session
scratchpad, **not committed** — the same posture as every mutation table in `TESTING.md`: run,
recorded, nothing left in the tree) serves one deployment fault per mode. Thirteen runs, tabulated
in `TESTING.md` § WO-8.8. Condensed, with the actual output:

| Fixture | Result |
|---|---|
| `/sw.js` served `public, max-age=14400` — **the WO-8.7 zone fault** | **1 red**, exit 1: *"cache-control: public, max-age=14400 — a positive max-age here is the Cloudflare zone rewriting `_headers`, not the file being wrong. Caching → Configuration → Respect Existing Headers"* |
| `/` served `public, max-age=0, must-revalidate` | **1 red** |
| deployed `SHELL` carries `./index.html`, host 308s it — **the WO-1.14 fault** | **2 red**: *"1 of 13 redirect: ./index.html 308 → / 200"* and *"./index.html → 308"* |
| deployed `CACHE` `v45` vs working tree `v46` | **1 red**: *"the origin is not serving this tree. Either the push has not landed, the build failed, or you are reading the wrong origin"* |
| a precached stylesheet answering the shell at 200 | **1 red** on content type. The 200 check stays **green** — which is the point |
| `/_worker.js` answering `200 application/javascript` | **1 red** |
| an apostrophe inside the deployed `SHELL` array | **4 red**: *"3 entries parsed … below the floor of 10"* plus three walk checks reporting *"not run"* |
| deployed `SHELL` carries an entry the local `sw.js` does not, which 404s | **1 red** — the proof the list is read off the wire, since a build parsing the local file never requests that path |
| `/sw.js` served as `text/html` | **6 red**, cascading |
| `/` answering `308 → /app/` | **4 red** |
| `/` answering `application/json` | **2 red** |
| control fixture, everything correct | **12 of 12 green, exit 0** |
| fixture killed after four requests | **not a red check** — see line 3 |

The control run matters as much as the reds: an all-red rig proves nothing about a check's aim.

**Trap 2 measured on the live origin rather than argued.** `fetch('/index.html', { redirect:
'manual' })` reports `308 /`; the same request with `fetch`'s default reports `200`,
`redirected: true`, `text/html`, `url: https://planbook.hwgteach.com/`. That is the WO-1.14 defect
being invisible, in two lines, on the real host.

### 3. An unreachable origin reports as unreachable, distinctly — **met**

Four shapes, each exiting **2** (checks exit 0 or 1) under a `COULD NOT REACH THE ORIGIN` banner,
with **no check added and no summary printed**:

- closed port → `fetch failed  [ECONNREFUSED]`
- name that does not resolve → `fetch failed  [ENOTFOUND]`
- unroutable address → `fetch failed  [UND_ERR_CONNECT_TIMEOUT]`
- **fixture killed part way through the SHELL walk** → `fetch failed  [UND_ERR_SOCKET]`, and:

```
  This is NOT a failed check and says nothing about the deployment. The network
  did not answer, so nothing was asserted after 7 check(s).
  There is deliberately no retry: run it again yourself when you have a network,
  because a loop that hides a flaky answer is a confident pass over nothing.

  0 check(s) had failed before the connection did.
```

The seven passes already made stand; nothing below them was turned red. That fourth case is the one
that could have gone wrong quietly, so it was built deliberately rather than assumed.

### 4. It gates nothing — **met**

`grep -rn "verify-deploy"` over the repository returns: the file itself (its own header), its table
row and section in `tools/README.md`, `TESTING.md` § WO-8.8, the work order, and the two dispatch
files. **No script, no workflow, no hook.** There is no `.github/`, and `.git/hooks` holds only
git's `.sample` files. Nothing imports it and nothing spawns it. The app is `index.html` and `src/`
served as they sit; no deploy, server or page load runs Node.

### 5. `tools/README.md` gains its section — **met**

New section `## verify-deploy.mjs — the only check here that reads the deployment`, placed before
the `verify-shell.mjs` section so the CDP traps stay attached to the harness they belong to, plus a
row in the table at the top of the file. **When to run it is its second paragraph**, and names all
three inputs the work order asks for: after a deploy, and after any change to `_headers`, `sw.js`'s
`SHELL` list, or the Cloudflare zone's caching settings. The section also records the three traps,
the unreachable rule and exit codes, the fixture proof, and the host behaviours the checks are
shaped around.

---

## Verification commands, from output I read

| Command | Result |
|---|---|
| `node tools/verify-shell.mjs` | **628 checks · 628 passed · 0 failed · 0 skipped**, 15,480 lines, 24.6 lines per check, **200s**, exit 0. Run to completion in the background and read after it exited — not predicted |
| `node tools/wo-sweep.mjs` | **17 checks · 15 passed · 0 failed · 2 to review**, exit 0. Both `REVIEW`s are the standing ones (sensitive field names; `src/detail.js:349`) and neither is mine — I touched no `src/` file |
| `node tools/wo-gate.mjs --audit` | exit 0, *"every fragment matches exactly one roadmap box, every **Owes** pointer lands on an open box, and every dashboard row matches its own boxes"* |
| `node tools/verify-deploy.mjs` | 12 of 12, exit 0 (above) |

`verify-shell.mjs` is untouched, so its count is unchanged and the sweep's §11 clause still passes at
629 call sites.

---

## Files changed

- **`C:\dev\planbook\tools\verify-deploy.mjs`** — new, 438 lines, no dependencies, one file.
- **`C:\dev\planbook\tools\README.md`** — table row + new section (Acceptance 5).
- **`C:\dev\planbook\TESTING.md`** — new `### WO-8.8` section under Phase 8, with the acceptance
  evidence and the thirteen-fixture table. Its Phase 8 preamble sentence was adjusted, since it read
  *"Nothing here yet"*.
- **`C:\dev\planbook\plans\work-orders\phase-8-packaging.md`** — the five Acceptance boxes ticked with
  parenthetical evidence. **The `**Status**` line was left at `🤖 CLAIMED`** for `wo-gate.mjs --tick`,
  and `CHANGELOG.md` was not touched.

Nothing in `src/`, `index.html`, `sw.js`, `_headers` or `manifest.webmanifest` was modified. No
commit, no push.

---

## Decisions the work order did not settle, and which way I went

1. **Content type is asserted per SHELL entry, which is a strengthening.** The work order's minimum
   is *"resolves without a redirect"*. Measured on the live host first: **any unknown path answers
   200 with the shell document**, byte-identical to `/` (`/nope-does-not-exist`, 2026-08-12). So a
   SHELL entry that was never deployed comes back **200 and green**, `addAll` succeeds, and the app
   caches HTML under the name of a stylesheet — an offline app that opens unstyled. The status alone
   cannot see it; the type can. Taken as inside *"at minimum"*, and it is the check the
   `shell-differs` and `missing-file` fixtures exercise.
2. **The SHELL parse has a floor of 10 entries, and a failed parse FAILs three downstream checks as
   "not run" rather than skipping them.** An empty list walks perfectly. This is `sw.js`'s own
   apostrophe scar arriving through the deployment, and WO-2.22's precedent that an unrunnable check
   is a `FAIL` and not a `REVIEW`.
3. **`/index.html` is read on every run and carries no verdict.** It is the one path on Pages known
   to redirect, so reading it keeps the redirect detector from being trusted on a green run alone —
   if that line stops saying 308 on this host, suspect the detector. It is not a check because
   another origin may answer it perfectly well. It prints under `· ` as `OBSERVED`-style prose.
4. **Exit code 2 for unreachable**, distinct from 1 for a failed check and 0 for green, documented in
   the header and in `tools/README.md`.
5. **A `TESTING.md` section was added** although Acceptance names only the tool and the README. The
   mutation evidence for line 2 has to live somewhere on disk, and `TESTING.md` is where WO-2.19,
   WO-2.22 and WO-2.24 put exactly this. Flagging it because it is a file the Acceptance list does
   not mention.
6. **I ticked the five Acceptance boxes.** There is no 👤 line in this work order, every line was
   closed by something I ran and read, and each tick carries its evidence inline.

---

## A finding that is not about the deployment: `process.exit()` after `fetch` on Windows

The first draft ended with `process.exit(code)`. Driving the fixtures, **every** run came back
`3221226505` (`0xC0000409`, bash reports 127) with complete and correct output already printed.
Isolated with a five-line script: `process.exit(0)` after a `fetch` aborted the process in **2 of 5**
runs on Node v24.16.0; `process.exitCode` with a natural exit was correct **3 of 3**, and costs
nothing — the sockets are unref'd, so a run still ends in about half a second. A tool whose entire
product is an exit status handing back a random one is the worst defect available to it, so the tool
sets the code rather than calling exit, and the header says why so nobody tidies it back.

**Not acted on, and worth someone's ten minutes:** `wo-sweep.mjs`, `wo-gate.mjs` and
`verify-shell.mjs` all end in `process.exit()`. None of them uses `fetch`/undici, which is where I
saw this, so I have no evidence they are affected and did not go looking — out of scope, and a
speculative edit to the harness is the last thing this work order should ship.

---

## What I could not verify, and what I declined

- **Nothing here needed an iPad or human eyes**, and nothing was deferred on those grounds. The tool
  reads headers; it makes no claim about rendering, touch targets or install behaviour, and its own
  closing line says so.
- **Windows only.** Everything above was measured on Windows 11 / Node v24.16.0. Nothing in the file
  is platform-specific, but I have not run it on macOS or Linux, and the `process.exit` finding is
  explicitly a Windows observation.
- **The server-side block cannot prove no worker is running.** A live `_worker.js` intercepts every
  path including its own. What is asserted is that no such asset is *served* as script or config;
  the repository half of that claim is WO-8.7's, checked in the tree and in the dashboard. Said
  plainly in the code and in the README rather than left for a reader to discover.
- **Declined, in scope terms:** no `_headers` check added to `wo-sweep.mjs` (the WO-8.7 verifier's
  proposal — the work order calls it the smaller half, and it belongs to whoever picks it up); no
  `--json` or machine-readable output; no scheduled or unattended mode; no second harness; nothing
  added to `verify-shell.mjs`; no caller of any kind, which Acceptance 4 asserts.
- **Draft `CHANGELOG.md` entry, for the teacher to accept, reject or rewrite** — *"Added
  `tools/verify-deploy.mjs`: a by-hand check that reads the deployed origin over HTTP — status,
  `Cache-Control`, and every precache entry resolved without following a redirect — after WO-8.7
  shipped two faults that every check in this repository was green through. An origin that cannot be
  reached is reported as unreachable rather than as a failure."*
