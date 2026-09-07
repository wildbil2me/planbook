# WO-7.2 — Document transfer & conflicts — dispatch status

- 2026-09-07 — gates checked: PASS. Depends on WO-7.1 ✅ DONE, tree clean, no prior dispatch files.
- 2026-09-07 — route **Claude, Opus tier**. ROUTING.md puts all of Phase 7 in the Claude-only column
  as a property of the work; Size L, OAuth/student-data surface, and a judgment Traps line
  ("if you find yourself writing merge logic, stop"). Runner-up set aside: Codex on the rev/baseRev
  table, which IS fully specified — but the table is the small half and docs/sync.md explicitly
  defers the rest ("Open for Phase 7, not decided here"). No Codex probe run.
- 2026-09-07 — claim: `--start WO-7.2` ran, row now `🤖 CLAIMED — 2026-09-07`.
- 2026-09-07 — brief written: `.claude/dispatch/WO-7.2-brief.md`, 13.3 KB, 0 markers left.
  Added § 2b (five undecided things: where baseRev lives, the foreign-docId question docs/sync.md
  leaves open, the `queued` state that must not come back, auth.js's one-way import, the conflict
  copy as a second copy of sensitive data) and § 2c (four traps).
- 2026-09-07 — implementer spawned at **Opus**, brief `.claude/dispatch/WO-7.2-brief.md`, awaiting
  return. Expect 20-40 min; a flat status file and unchanged `git status` for the first ~20 is the
  normal reading phase, not a hang.
- 2026-09-07 — **dispatch died at the implementer, killed by an API session limit** (the orchestrator's
  last words were "spawning the implementer now"; the implementer had in fact run ~1h and written
  1,768 new lines plus 12 modified files). Seventh dead dispatch here, fourth killed by a quota.
  **Recovered by the parent session, not re-dispatched** — the WO-3.26 / WO-5.2 precedent.
  `grep -rn MUTATION` clean. Row was `🤖 CLAIMED`, NOT `🔍 AWAITING VERDICT`, so `/wo WO-7.2` would
  have re-routed and rebuilt over finished work rather than going to the verifier.
- 2026-09-07 — **one defect found and repaired in the delivered tree**: a raw NUL byte at
  `tools/verify/drive-sync.mjs:713` made the whole file binary to `grep`, silently exempting it from
  `grep -rn MUTATION`. Repaired to an explicit boolean; the naive fix (deleting the NUL) would have
  left `indexOf('')` and a permanently vacuous check.
- 2026-09-07 — **mutation round run by the parent session, one mutation per run**: 6 of 7 caught,
  M2 correctly not caught (defence in depth — the stub filters `docId` server-side as Google does).
  Full table in `.claude/dispatch/WO-7.2-result.md`.
- 2026-09-07 — **a blind spot in the delivered harness, reported and NOT repaired**: the
  *never half-written* check reads the in-memory bookmark and is blind to a premature IndexedDB
  write; its neighbour caught the damage. Left for the verifier and the owner.
- 2026-09-07 — tools on the shipping tree: verify-shell **1331/1331 EXIT=0**, sweep **41·38·0·3**,
  `--audit` **PASS**. Four Acceptance lines ticked with notes; two left open, both 👤 (two devices).
  Work staged, **uncommitted**. `--handoff` run; the verifier is owed and must be a fresh session.
- 2026-09-07 — **fresh session, entering at `🔍 AWAITING VERDICT`.** Gate re-checked: PASS, depends
  WO-7.1 ✅ DONE, tree still holds the 17 staged paths. Not re-routed, not re-briefed, not released.
  Verifier spawned at **Opus**, told in as many words it is a FIRST pass and that the result file,
  the status file and the dirty tree are claims to check rather than findings to confirm. Awaiting
  verdict.
- 2026-09-07 — **verdict in: FAIL.** Four ❌, all in the wiring rather than the state machine.
  DEFECT-1 `src/shell.js:1821` — `auth.connect()` calls `refreshAuthChrome()` only, which never
  touches `#driveSyncBtn`, so connecting does not reveal the Sync button and the feature is
  unreachable in the modal session that signs it in. DEFECT-2 `src/shell.js:1822` — the mirror on
  disconnect. DEFECT-3 `TESTING.md:9570-9573` — the two-device procedure predicts `download` where
  `planFor()` returns `conflict`, so a teacher following it records a failure against working code.
  DEFECT-4 `TESTING.md:9597-9598` — asserts a control absent that DEFECT-2 leaves present.
  Acceptance 1 and 2 are ❌ (not 🙋): both are gated on a control that is never drawn. 3-6 ✅ and
  every desk tick substantiated; no 👤 line was ticked by an agent. Harnesses re-run by the verifier
  itself: verify-shell 1331/1331 EXIT=0, sweep 41·38·0·3, `--audit` PASS, `grep -rn MUTATION` clean,
  NUL-byte repair confirmed non-vacuous. **Why the harness was green over DEFECT-1**:
  `tools/verify/drive-sync.mjs:859-861` closes and reopens the About modal immediately before the
  only check asserting the button is visible — the one path that paints it, and not the one a
  teacher takes.
- 2026-09-07 — correction round: brief `.claude/dispatch/WO-7.2-correction-brief.md`, implementer
  spawned at **Opus** (first miss, no re-route, no tier change). Row stays `🔍 AWAITING VERDICT`.
- 2026-09-07 — **correction implementer returned.** All four ❌ addressed plus both smaller findings.
  DEFECT-1/2 repaired in `src/shell.js` by chaining a repaint from the two Drive handlers (rejected
  the notification-bus alternative because `src/auth.js` would have to import `src/drive-sync.js`
  and reverse the one-way dependency `verify/drive-sign-in.mjs` fences); connect repaints on BOTH
  promise arms. DEFECT-3/4 rewritten in `TESTING.md` to the five-step corrected bootstrap, including
  a step the verifier did not name — delete the bootstrap conflict copy before Acceptance 2, since
  both copies would carry an identical filename. Three new checks in
  `tools/verify/drive-sync.mjs`, one of them the modal-never-closed path. Six full verify-shell runs
  at ~7.5 min each; final **1334/1334 EXIT=0**, sweep 41·38·0·3, `--audit` PASS, `grep -rn MUTATION`
  clean. Owed mutation planted and reverted: preserve-then-overwrite swapped reddens exactly the
  ordering check. `tools/README.md` call count 1320 → 1324. Its own claim, unchecked by me: the
  corrected bootstrap is **traced, not run** end to end. Verifier re-dispatched.
- 2026-09-07 — **the line above is false, and this is the eighth dead dispatch — the second on this
  work order and the fifth killed by a quota.** The orchestrator wrote "Verifier re-dispatched" and
  was then killed by an API session limit at that exact spawn; its own last words were "Correction
  landed. Recording it, then sending it back through the verifier." **No verifier ran on the
  corrected tree** — no verdict artifact of any kind exists, and the status file's mtime (14:25) is
  one minute after `WO-7.2-correction-result.md` (14:24), which is the whole of the gap. Left as
  written above rather than edited, because a status file that quietly repairs its own false claims
  teaches the next reader to trust the rest of it; this is the WO-1.38 shape at one level up —
  **prose ahead of the act**, and the act was the last thing the session had time for.
- 2026-09-07 — recovered by the parent session on a fresh account. Standing first move run before
  anything else: `grep -rn MUTATION` over `src/ tools/ index.html sw.js` — the only `src/` hit is
  the pre-existing prose at `src/shell.js:852`, every other hit is `tools/` prose about the
  practice. **No live mutation.** The NUL-byte lesson from this work order's own first recovery was
  re-run as a scan rather than assumed: no changed file is binary to `grep` and no changed file
  carries a `\x00`, so the mutation grep above was not silently exempting anything. Tree still holds
  the 17 staged paths plus the two untracked correction files; nothing committed, nothing pushed.
- 2026-09-07 — verifier spawned by the parent session as a **SECOND pass over a corrected tree**,
  told that the first verdict's four ❌ are the focus but not the boundary, that
  `WO-7.2-correction-result.md` is a claim to check rather than a finding to confirm, and that the
  correction implementer's own unchecked claim — *the corrected bootstrap is traced, not run* — is
  named in its brief. Row unchanged at `🔍 AWAITING VERDICT`. Not re-routed, not re-briefed, not
  released.
- 2026-09-07 — **second verifier pass over the corrected tree returned: PASS WITH MANUAL CHECKS.**
  All four of the first verdict's ❌ are repaired and each repair was checked against the tree
  rather than against `WO-7.2-correction-result.md`. DEFECT-1/2 are `src/shell.js:1863-1871`
  chaining `afterDriveAuthChange()` (`src/shell.js:1771-1774`) — connect on **both** arms of the
  promise, disconnect on the next statement, and `auth.connect()` really is `async`
  (`src/auth.js:452`), so the `.then` cannot throw. DEFECT-3/4 are `TESTING.md:9568-9592` and
  `TESTING.md:9645-9653`. **The corrected bootstrap was traced independently** against
  `restoreDocument()`, `readSyncState()`, `planFor()`, `keepBoth()` and `bringDown()` and every
  step of it holds: step 3 is `conflict` because `restoreDocument()` preserves `incoming.docId`
  and writes no bookmark, so `planFor(localRev, RA, null)` hits the `baseRev == null` arm at
  `src/drive-sync.js:245`; then A downloads because `remote > base` with `local === base`; and the
  **delete-the-bootstrap-conflict-copy** instruction is genuinely required, because both conflict
  copies are named off `remote.deviceLabel` and `todayLocal()` and on one machine that is the same
  filename twice. Acceptance 3-6 ✅ with the harness lines quoted; Acceptance 1 and 2 are **👤 and
  not ❌** this time — the static precondition was ruled out rather than assumed: `hostAllowsSignIn()`
  accepts `localhost`, `serve-https.mjs` serves `:8443` and `make-cert.mjs` puts `DNS:localhost` in
  the certificate, and the control is now drawn in the session that enables it.
- 2026-09-07 — tools re-run by the verifier, not quoted from the correction result:
  `verify-shell.mjs` **1334 checks · 1334 passed · 0 failed · 0 skipped**, 41,335 lines, 449s,
  **exit 0** — *zero* skips, so the connect check's bounded skip arm did **not** fire (its detail
  line reads *"676ms after the tap, Sync shown = true, About still open = true"*, and the
  non-vacuity clause reads *"with the token seeded and nothing tapped, Sync shown = false"*).
  `wo-sweep.mjs` **41 · 38 · 0 · 3**, exit 0, the three REVIEW lines the same three the tree
  carried. `wo-gate.mjs --audit` **PASS**, `overall row 65/81`. `grep -rn MUTATION` over
  `src/ tools/ index.html sw.js` — one pre-existing prose hit at `src/shell.js:852` and eleven in
  `tools/` prose about the practice; **no live mutation**. No changed or untracked file carries a
  NUL byte.
- 2026-09-07 — **three things reported and not repaired, none of them blocking a box.** (1) The
  fixture assumption this tree does *not* break: **one document, one bookmark.** Nothing anywhere
  puts two records in the `sync` store and asks for one by `docId` — `grep -n
  "openYear|readSyncState|writeSyncState" tools/verify/drive-sync.mjs` returns nothing — and that
  keying is the mechanism answering `docs/sync.md`'s open question. The code was read instead:
  `store.readSyncState(docId)`, `keyPath: 'docId'`, and `markFor === doc.docId` guarding the
  in-memory copy. (2) `verify/year-document-store.mjs`'s bookmark-field clause is **vacuous where
  it runs** — its own detail line this run reads `holding 0 bookmark(s) … []`, because that section
  is index 282 of `BROWSER_SECTIONS` and `drive-sync.mjs` is 342. It is already named at
  `tools/verify/drive-sync.mjs:577-582` and the same claim is made over a real record at
  `:602-607`, so this is wording that overstates one check rather than a hole. (3) The **stale
  sync outcome is now more visible, not less**: this run's disconnect check read the panel
  *before* the tap as `"Your Google sign-in has run out, so nothing was synced…"` over a live
  session, and after the repair a teacher who follows that sentence and taps Connect gets the
  repaint — with the sentence still there. Pre-existing in shape, booked as the correction round's
  follow-up 1, and it is the owner's ruling because clearing `outcome` blanks the one place a
  lapsed-token failure is written.
- 2026-09-07 — verifier did **not** commit, did **not** push, ticked nothing. The eight `[x]` in
  the staged diff are four Acceptance lines in `plans/work-orders/phase-7-sync.md` and their four
  twins in `TESTING.md`; **no 👤 line is ticked anywhere in the delivery**, and each of the eight
  was graded against a harness line read in this run's own output. `next` reports **WO-G2**, all
  eleven dependencies ✅ DONE, `PASS | gates clear for WO-G2`.
- 2026-09-07 — **the two 👤 lines are closed by the owner, on hardware, and WO-7.2 is ✅ DONE.**
  Two Chrome profiles at `https://localhost:8443`, one Google account, the five-step corrected
  bootstrap in `TESTING.md` run in order. The owner reports all five behaved as the procedure
  predicts — including the two that read as failures and are not: step 3's bootstrap **conflict**
  (B holding A's `docId` with no sync bookmark, the *no bookmark, remote exists* row) and step 5's
  **two files** with A's edit inside the named conflict copy. **This is the first end-to-end run of
  the corrected bootstrap across two IndexedDBs** — the correction implementer had flagged it as
  *traced, not run*, and that claim is now discharged by the owner rather than by a harness.
- 2026-09-07 — `--tick WO-7.2` applied: row → `✅ DONE — 2026-09-07`, four ROADMAP.md boxes ticked,
  `README.md` Phase 7 count 1 → 2 and the suite total 138 → 139. Two dashboard hand edits the tool
  names and does not make: ROADMAP.md Phase 7 row `2/7` → `6/7`, Overall `65/81` → `69/81`. One
  stale sentence the tool's count update left behind and no check would have caught — the README
  Phase 7 row still read *"WO-7.2 and WO-7.3 still 🔒"* under a corrected count — rewritten to name
  WO-7.2 done and leave WO-7.3 gated. `--audit` **PASS**, `overall row 69/81   rows sum 69/81`,
  every dashboard row matching its own boxes; sweep **41 · 38 · 0 · 3**, the same three standing
  REVIEW lines, none of them moved.
- 2026-09-07 — **the dispatch is complete and the commit is the owner's.** Tree staged and
  uncommitted. `sw.js` `CACHE` is `planbook-shell-v112`, never committed (`git log -S` over `sw.js`
  returns nothing), so it is still correct for a single push; **a second push of this work order
  needs v113.** `next` returns **WO-G2 — Ship 2 gate: first grades**, all eleven dependencies
  ✅ DONE, target ~2026-09-15, with the first real grades going in **2026-09-08**.
