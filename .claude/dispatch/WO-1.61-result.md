# WO-1.61 — result

**Implementer:** Claude Opus (work-order-implementer), 2026-10-04. Not committed.

## What changed

- `tools/wo-sweep.mjs` § 9: the `SHELL` parse now maps `'./'` to `index.html`
  (`const p = m[1] === './' ? 'index.html' : m[1].replace(/^\.\//, '')`), with a comment above it
  saying why, and why the mapping lives in the reading of `SHELL` and not in `SHELL` (sw.js's header:
  `./index.html` on that list is a white screen on the first navigation). The old trailing comment
  "'./' is the index, not a file on disk" is gone. `sw.js` is untouched.
- `tools/wo-sweep.mjs` § 9 offender loop: **kept** `!NEVER_EXCUSED.includes(f)` and added a comment.
  Decision: it is now live for `index.html` — a trailered `index.html` change is listed as an
  offender as well as in `misused`, rather than appearing as "excused by trailer" next to a FAIL. Its
  `sw.js` half still cannot fire (sw.js is not in SHELL; its change is the bump); it stays so the one
  list means the same thing at both places it is read.
- `TESTING.md`: new § WO-1.61 after § WO-1.60, with the clone record.
- `plans/work-orders/phase-1-shell-store-roster.md`: three WO-1.61 Acceptance boxes ticked. Status
  left at `🤖 CLAIMED` for the orchestrator. (That file already had an unrelated modification in the
  tree before I started — the `--start` claim.)

## Pre-check (re-run, not trusted)

`git log -1 --format=%h -S planbook-shell-v165 -- sw.js` → `3f3369b`.
`git diff --name-only 3f3369b..HEAD` lists no `index.html` (and no SHELL file). So the real tree's
§ 9 stays green after the fix, and it does — see line 3.

## Against the Acceptance list

1. **`index.html` committed with no bump turns § 9 red and names it — met.** Throwaway clone of the
   repo at `7a008e5` under the session scratchpad, `origin` removed, fixed sweep committed as base.
   Comment line appended to `index.html`, committed with no bump:
   `FAIL | every SHELL file change is paired with a CACHE bump :: index.html changed since
   planbook-shell-v165 was set at 3f3369b — bump CACHE in sw.js, or an installed app keeps the shell
   it already has`, whole-sweep exit 1. The pre-fix sweep (HEAD's file) on the same commit read
   `PASS … no SHELL file has changed since` — so the red is the fix. Also read: trailered `index.html`
   commit → FAIL naming it in both halves; uncommitted `index.html` edit → FAIL. Every fixture was
   undone with `git reset --hard` in the clone; the clone was deleted afterwards. The real tree never
   held an `index.html` edit: `git diff --name-only HEAD -- index.html sw.js src/` is empty, and
   `grep -rn MUTATION tools/ src/ index.html sw.js` shows only pre-existing prose. Recorded in
   `TESTING.md` § WO-1.61.
2. **`index.html` committed together with a CACHE bump leaves § 9 green — met.** Clone, one commit
   editing `index.html` and bumping to `v166`: `PASS … planbook-shell-v166 was set at 76ebafd; no
   SHELL file has changed since`; no FAIL in the run, exit 0.
3. **Names/order unchanged; real tree's § 9 unchanged — met.** Real tree, sweep before and after the
   edit: 48 result lines each, `PASS|FAIL|REVIEW | <name>` sequence identical (diffed). Whole-output
   diff is one line: the census's own line number `wo-sweep.mjs:3880` → `:3891`, still 89 call sites.
   § 9 on the real tree after: `PASS | every SHELL file change is paired with a CACHE bump ::
   planbook-shell-v165 was set at 3f3369b; no SHELL file has changed since` — same as before. Final
   sweep exit 0 (three REVIEWs, the same three as before).

`verify-shell.mjs` was **not run**: no file under `src/`, `index.html` or `sw.js` changed, and the
brief says it is not needed here. No 👤 or 📆 lines exist on this work order.

## Notes

- The edit kept LF line endings (`grep -c $'\r'` is 0 on both HEAD's and the working copy of
  `tools/wo-sweep.mjs`); diffstat is 15 lines in that file, all mine.
- Not done, out of scope: nothing else in § 9's header needed changing — it already said
  index.html is entry one of SHELL, which is now true of the code.

## Changelog draft (for the teacher to decide)

> The sweep's cache check now watches `index.html`. It had always dropped `./`, entry one of the
> shell list, so an `index.html` edit with no cache bump passed — the opposite of what the docs
> said. Nothing a device gets changed.
