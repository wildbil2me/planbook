# WO-7.4 — result (implementer, 2026-09-25)

The deployed host is open on `hostAllowsSignIn()`, the Drive panel carries a Testing-mode line, and
both privacy documents plus `about.html` were rewritten in the same sitting. Harness green on the
final tree; sweep green; both harness claims mutation-proved and reverted. **Not pushed.** Nothing
is committed; the tree is an ordinary unstaged working-tree diff (I staged while mutating, then
unstaged with `git reset -q` at the end).

## Against the Acceptance list

1. **`hostAllowsSignIn('planbook.hwgteach.com')` true; LAN, `hwgteach.com`, unrelated host false; the harness asserts the whole table.** **Met, ticked.**
   The harness has a 14-row table, each row checked against an expected answer
   (`tools/verify/drive-sign-in.mjs`, `EXPECT74`). It covers the deployed host, both loopbacks, `192.168.50.142`,
   `hwgteach.com`, `www.` subdomain, `evil-planbook.hwgteach.com`, `planbook.hwgteach.com.example`,
   `…com.evil.example`, an upper-case variant, `localhost.hwgteach.com`, `notlocalhost`, `example.com` and empty.
   Final run: `every row as expected`. Mutation (suffix match `/hwgteach\.com$/`) → red:
   `WRONG for ["hwgteach.com","www.planbook.hwgteach.com","evil-planbook.hwgteach.com","localhost.hwgteach.com"]`.
2. **Signed-out page makes no request to accounts.google.com until Connect.** **Met, ticked.**
   `verify-shell.mjs` now keeps a `netLog` on `h` from `Network.requestWillBeSent`. Only this section
   switches the Network domain on. It reloads the page with the domain on, and asserts two things around the
   Connect tap. Before the tap: `0 request(s) to accounts.google.com and 68 to this origin in the 5567ms since
   the reload; section drawn = true, GIS <script> tags = 0`. After the tap (the non-vacuity half):
   `1 request(s) to accounts.google.com after the tap: ["https://accounts.google.com/gsi/client"]`.
   Mutation (module-level `loadGis()` at boot) → the "before" check went red, and so did two older checks
   I was not aiming at: the section's arrival reading (`GIS <script> tags = 1`) and WO-5.3's outreach check.
3. **privacy.html and FERPA carry the narrowed sentence identically; none of the three pages says sync is unreleased; `verify-deploy.mjs` green after the push.** **Left OPEN: the desk half is met and the push half is owed.**
   The shared sentences, which are identical after stripping tags, backticks and whitespace (checked with a node one-liner: `identical: true`):
   *"Beyond that, Planbook makes no network requests at all — no analytics, no usage tracking, no
   error reporting, no advertising, and no third-party code of any kind — unless Google Drive sync is
   connected, when Google's own sign-in library loads from accounts.google.com. Nothing is fetched
   from Google until Connect is tapped."*
   `/released app|not in the released|not built into/i` matches none of the three pages. Both dates changed
   to 25 September 2026. I re-read `verify-deploy.mjs`: its three policy claims and its `/about` check assert
   nothing the rewrite removed, so I made no edit there. **The live run needs the owner's push.**
4. **The Drive panel names the Testing-mode limit before Connect is tapped.** **Met, ticked.**
   `TESTING_MODE_NOTE` (exported, one constant) in `src/auth.js` is drawn into a new `#driveTestingNote`
   `<p class="class-hint">` placed between the status line and the Connect button. Harness result:
   `drawn = true, above Connect = true, matches the constant = true`. The line is hidden once a sign-in is held (asserted in the
   coarse-pointer Disconnect check). I did not touch the panel's "Sync is not a backup" copy.
5. **👤 Deployed app, cold, laptop.** Not ticked. It needs the push and a real Google account.
6. **👤 iPad, force-quit first.** Not ticked. It needs a real iPad. Download a backup first.

## Commands, as read

- `node tools/verify-shell.mjs`, final tree: `1488 checks · 1488 passed · 0 failed · 0 skipped`,
  46,915 lines, 531s, `EXIT=0` (read from the log's own EXIT line). That is 1485 + 3 new call sites.
- `node tools/wo-sweep.mjs`: `45 checks · 42 passed · 0 failed · 3 to review` (the three standing REVIEWs).
  § 11 reads 1477 call sites against the updated `tools/README.md`.
- `node tools/wo-gate.mjs --audit`: PASS.
- Mutation run (both mutations in one run): `1488 checks · 1484 passed · 4 failed`, `EXIT=1`. I reverted
  both by the inverse edit before writing anything else. `grep -n MUTATION` over every code file I delivered
  (`src/auth.js`, `tools/verify/drive-sign-in.mjs`, `tools/verify-shell.mjs`, `index.html`, `sw.js`) reads
  nothing. The repo-wide `grep -rn MUTATION` still finds older prose in `CLAUDE.md`, `tools/README.md` and a
  `src/shell.js` comment ("A CLASS MUTATION ADDED LATER"). None of those are mine, and none is a live mutation.

## A harness hang I found, and the one line I added for it (decision, please review)

My first green run and the mutation run both printed their summary and then **did not exit for more than
ten minutes**. I read the port table. An Edge browser process had survived `proc.kill()`: on this machine
the spawned `msedge.exe` hands off to a second browser process. That process held one open socket on the
harness's static server. I reproduced it in isolation (scratch script, not committed). The socket had carried
**zero requests**: it was a preconnect. `server.close()` does not end that kind of socket and stops the timer
that would reap it. A baseline run of the pre-WO tree (a HEAD worktree, since removed) printed
`1485 · 1485 · 0 failed` and exited on its own about 1.5 minutes after its summary. That suggests this is a
timing race rather than something my checks cause, but I cannot prove that from one sample.
**What I did:** added `server.closeAllConnections()` after `server.close()` in the teardown, with a comment
explaining why. The final run exited promptly. **What I did not do:** fix the surviving Edge process. It is
still orphaned after every run. I killed it by hand each time, and it looks like a separate pre-existing
defect. I left it alone as out of scope.

## Files changed

`src/auth.js`, `src/shell.js` (two comments), `index.html`, `sw.js` (`v129` → `v130`), `privacy.html`,
`docs/FERPA.md`, `about.html`, `docs/sync.md`, `tools/verify-shell.mjs`, `tools/verify/drive-sign-in.mjs`,
`tools/README.md`, `TESTING.md`, `CLAUDE.md`, `plans/work-orders/phase-7-sync.md`,
`plans/work-orders/phase-3-gradebook.md`, `plans/wo-3-18-video-runbook.html`.

## Decisions the work order did not settle

- **When the Testing line shows:** whenever nobody is signed in. That covers the time before the first tap
  and also after a failed one, which is when a teacher who just met "Access blocked" needs it. It hides once
  signed in. Setting the constant to `''` hides it everywhere.
- **Truth table:** the brief asked for LAN, `hwgteach.com` and one unrelated host. I added the near misses a
  suffix or substring match would let through. `127.0.0.1` stays true even though the OAuth client does not
  list it, because the harness is served from it. The comments now say so; my first draft wrongly said the
  list was "exactly the client's".
- **FERPA's "the one third party in the picture is the static web host"**: I added one sentence naming Google
  as the only other company, and only if the teacher connects Drive. That sentence is not shared with
  privacy.html, so the word-for-word rule is untouched. It seemed needed so the page does not claim less than
  the app does.
- **About modal "This build" paragraph** (index.html): it said "outreach and Drive sync all come after it", and
  the Drive part is now false on the deployed app, so I removed "and Drive sync". The rest of that paragraph
  was already stale (praise, log and outreach have all shipped). **I did not rewrite it.** That is out of
  scope and worth its own small work order.
- **WO-7.3:** the flag deliverable is struck through and says it moved to WO-7.4. Its third Acceptance line
  is now plain prose saying where it went, not a checkbox, so it cannot be ticked twice. I also noted that
  WO-7.3 owes the deletion of `TESTING_MODE_NOTE` on approval. I added "superseded" notes to the historical
  paragraphs in WO-7.1's and WO-3.10's records rather than rewriting them.
- **CLAUDE.md:** I added one dated sentence to the WO-7.1 status block marking the two sentences before it
  as history. `AGENTS.md` has no twin sentence (I grepped it), so I did not edit it. Sweep § 21 is green.
- **`plans/work-orders/gates.md`**: I grepped it and found no stale sentence, so it is unchanged.

## What I could not do

- **`plans/wo-3-18-runbook.html` (the main runbook) is unchanged.** My edit, which added a dated note to
  step 4 saying the real domain now has a sign-in to film and the account must be a listed test user, was
  **denied by the permission classifier**, and I did not retry it. It contains no sentence claiming the
  deployed app has no sign-in (its shot list already assumed the real domain), so nothing in it is false.
  It just does not mention WO-7.4. The video runbook was updated: Blocker 2 is marked discharged with the old
  text kept, the "Decide before you shoot" choice is recorded, the prep list points at the real domain, and
  the rejection-table row is updated.
- Everything 👤, and `verify-deploy.mjs` after the push.

## Temptations declined

- Rewriting the stale About "This build" paragraph (see above).
- Killing the relaunched Edge process properly in `verify-shell.mjs` (for example, killing the process tree).
- Adding a WO-7.4 status cell to either runbook. Sweep § 26 reads those as status claims, and one would go
  stale the moment the tracker moved.

## CHANGELOG draft (the teacher decides)

> **Drive sync is reachable on the live app (WO-7.4).** About ▸ Google Drive sync is now drawn at
> planbook.hwgteach.com, not only on the laptop's local server. Until Google finishes reviewing it,
> only accounts added as test users can connect, and the panel says so before Connect is tapped. The
> privacy policy and the district FERPA guide now say Planbook loads no third-party code *unless*
> you connect Google Drive, when Google's own sign-in library loads. Nothing is fetched from Google
> until you tap Connect, and the test harness checks that on the network itself.
