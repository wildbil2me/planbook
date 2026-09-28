# WO-7.16 — result

**Status: lines 1 to 3 are met and ticked. Line 4 is owed after the push, which is the owner's to make. Nothing is committed and nothing is pushed. No mutation was made.**

## What changed
The only thing that changed is wording. The app behaves exactly as before, and `git diff -U0 src/` touches comment lines only.

- **The shared data-flow statement is re-worded in `privacy.html` and `docs/FERPA.md`, identically.** The old gate, *"unless Google Drive sync is turned on"*, is gone. It now reads *"except for Google Drive sync, which uses Google's own sign-in library from accounts.google.com"*. The statement then says:
  - The library first loads on a **tap**: Connect in About, or Open from Google Drive on the first screen of a device with nothing on it yet.
  - It loads at every launch only **once a sign-in succeeds**. That is the opt-in, and it stays until sync is switched off in About.
  - A sign-in is requested only on a tap of Connect, the sync button, or Open from Google Drive.
  - Nothing is fetched on a device where neither Connect nor Open from Google Drive was ever tapped.

  Both *Last updated* dates now read 28 September 2026.
- **I checked each claim against the committed code:**
  - `first-run.js` `tapDriveDoor()` calls `auth.reconnect()` first, and that reaches `loadGis()`.
  - The opt-in is set only by `shell.js` `afterDriveAuthChange(true)`, which both doors reach, and only on success.
  - The *Sign in to Google* button inside the dialog carries the same `data-first-run-drive` hook, so it is the same door.
- **A dated WO-7.16 sentence was added to the comment above both copies of the statement.**
- **Notes corrected:**
  - `index.html` (the Drive block comment)
  - `src/auth.js` (around line 82, and the `loadGis()` comment)
  - `src/sync-button.js` (the `start()` comment)
  - `docs/sync.md` (around line 79, plus a WO-7.16 sentence in the parenthetical around line 565)
  - `CLAUDE.md`'s WO-7.4 parenthetical
  - two harness notes found by reading rather than by grep:
    - the `netLog` comment in `tools/verify-shell.mjs` said *"two sections"*; since WO-7.9 there are three
    - one check label in `tools/verify/drive-sign-in.mjs`, where only the text changed and the predicate did not
- **Checked and left alone:**
  - `AGENTS.md` has no twin of the sentence (grep returns nothing).
  - `about.html` says nothing about when the library loads.
  - `tools/verify-deploy.mjs` `CLAIMS` asserts none of the changed words, so no claim needed updating.

## Acceptance
1. **[x] The statement is identical in both files, names both doors, and makes the neither-door promise.** I ran WO-7.6's normalise-and-compare method and it returned `identical: true`. The normalised text is quoted in `TESTING.md` § WO-7.16.
2. **[x] No live claim is left.** The grep and a classification of every hit are in `TESTING.md` § WO-7.16. What is left falls into three groups:
   - **The new wording itself:** the new statement at `privacy.html:307,311` and `FERPA.md:112,116`, and the comment's dated sentences at `privacy.html:282,295` and `FERPA.md:101`.
   - **Connect named as one of three ways, not the only one:** `index.html:2180` and `auth.js:82`.
   - **History, quotes, or accurate descriptions:**
     - `auth.js:429` quotes the old sentence as history.
     - `CLAUDE.md:129` is past tense.
     - `sync.md:558,560,564` is the WO-7.5 and WO-7.6 dated record.
     - `drive-sign-in.mjs:675` and `verify-shell.mjs:563` describe what that fixture measures, which is still accurate.
     - `drive-sign-in.mjs:725` is unrelated.
     - `CHANGELOG.md`, `phase-7-sync.md` and `README.md` rows are dated records.
3. **[x] The network assertions hold and the harness is green.** `node tools/verify-shell.mjs` printed `1572 checks · 1572 passed · 0 failed · 0 skipped`, 49,959 lines, 615s, `EXIT=0`, on the real clock. I read the log after it exited. The network checks it reported:

   | Check | Before any tap | After the tap |
   |---|---|---|
   | WO-7.4 | `0 request(s) to accounts.google.com and 70 to this origin` | `1 … ["https://accounts.google.com/gsi/client"]` |
   | WO-7.5 (never connected) | 0 requests | — |
   | WO-7.9 line 3 (neither door taken) | `0 request(s) … and 70 to http://localhost:60776` | door tap: `1 … /gsi/client` |

   After the run I re-wrapped one over-long comment line in `src/sync-button.js`. It changes no executable line.
4. **[ ] Owed after the push:** `verify-deploy.mjs`, and a check that the live `/privacy` shows "Last updated 28 September 2026" and "Open from Google Drive". I did not tick this, because it cannot be closed until the push.

## `wo-sweep.mjs` is red: one decision for you before committing
`node tools/wo-sweep.mjs` printed `45 checks · 41 passed · 1 failed · 3 to review`. The three "to review" items are the standing REVIEWs. The one failure is:

> every SHELL file change is paired with a CACHE bump :: src/auth.js, src/sync-button.js changed since planbook-shell-v143 was set at 665b18c

I followed the brief's explicit instruction not to bump `CACHE`, because v143 has not shipped. But this check compares against the commit that set the string, not against what has shipped. So it will **stay red after the commit too**, unless `CACHE` goes to v144.

- Bumping to v144 is harmless, since no device has v143.
- The alternative is to accept one red run until the next bump.

The brief asks for both tools to be green, and its no-bump ruling rules that out. I'm reporting the conflict rather than overriding the ruling.

## Choices the work order left open
- **"except for Google Drive sync" replaces "unless sync is turned on".** Trap 3 says a cancelled door tap loads the library but turns nothing on. So the old condition was false as a gate, not just incomplete.
- **Pronouns.** The statement uses passive "is tapped" and no "you", so the two files can stay word-for-word identical. `FERPA.md` is written in the third person.
- **No fourth door is named for "Sign in to Google" inside the dialog.** It carries the same hook and belongs to the same door.

## Line endings
- `docs/sync.md` has mixed CRLF/LF endings in HEAD, and my Edit calls normalised the whole file (a 590-line diff). I rebuilt it from HEAD using a line diff that keeps HEAD's endings; the diff is now 13 lines.
- In every other file I touched, HEAD has no CRs and the working copy has none either.

## Files changed
`privacy.html`, `docs/FERPA.md`, `index.html`, `src/auth.js`, `src/sync-button.js`, `docs/sync.md`, `CLAUDE.md`, `tools/verify-shell.mjs`, `tools/verify/drive-sign-in.mjs`, `TESTING.md` (new § WO-7.16, before § Phase 8), `plans/work-orders/phase-7-sync.md` (ticked lines 1 to 3; the CLAIMED row was already there from the orchestrator).

Diffstat: 11 files, +195 / −54.

## Draft CHANGELOG line (yours to decide)
The privacy policy and `docs/FERPA.md` now name the second way Google's sign-in library can load. That is *Open from Google Drive*, on the first screen of a new device, alongside Connect. A device where neither was ever tapped still contacts Google not at all.

## Declined as out of scope
`reconnect()` announces "Reconnected to Google Drive." on a first-run sign-in. WO-7.9's result already notes this. It is a wording defect in the app itself, not in the documents, so it is not this work order's to fix.

## Correction round

2026-09-28, against the verifier's FAIL on Acceptance 2 and its record defect. Comments and record text only: no executable line moved, `sw.js` untouched (`CACHE` stays `planbook-shell-v144`, the owner's bump), nothing committed.

### Fixes

1. `tools/verify/drive-sign-in.mjs:360-368`: this is the "THE WIRE, WATCHED FROM A SIGNED-OUT LOAD (WO-7.4)" comment the verifier cited at :358-362. It had said the policy claims no third-party code "UNLESS a teacher connects", and that loadGis() appends the script "when Connect is tapped and at no other moment". It now quotes "except for Google Drive sync" and the promise about devices where no sign-in door was ever tapped. It says the script is appended on a non-opted-in device only when a sign-in door is tapped, and that this section measures one door, Connect. The other door (WO-7.9, written into the policy by WO-7.16) is credited to `tools/verify/first-run.mjs`, and the launch half still to `sync-button.mjs`.
2. `tools/verify/drive-sign-in.mjs:44-49`: the header "the wire" bullet (was :45-47). It had quoted "none unless a teacher connects Drive" and said "the Connect tap is what asks". It now quotes "except for Google Drive sync (since WO-7.16)" and limits the Connect tap to this section. It also says the first-run door's tap asks too, and that `first-run.mjs` measures it. The file no longer contradicts its own label, which is now at :680 after the rewrap; the label text is unchanged.
3. `src/auth.js:755-757`: the `preloadSignIn()` comment (the secondary item). It had quoted the policy as "on a device where Connect succeeded". It now quotes "Once a sign-in succeeds … the library loads each time Planbook opens (WO-7.16's wording, which covers both sign-in doors)".
4. `TESTING.md` § WO-7.16, Acceptance 2: the grep is widened, and a dated note records the widening and the three fixes. A correction-round sub-list classifies every hit the widened pattern adds.
5. `TESTING.md` § WO-7.16, after "Both tools": a dated paragraph. It records the owner's ruling and the calling session's bump to `planbook-shell-v144` (this supersedes the first round's "CACHE not bumped" sentences, which stay as that round's record), plus the green sweep re-run.

### Wider grep and its hits

```
grep -rnE -i "connect (was|has) never|where Connect (was|has)|loads first when Connect|only when Connect|until Connect|loads only on the Connect|only on the Connect tap|appended on the Connect tap|when Connect is tapped|at no other moment|unless a teacher connects|none unless|unless Google Drive sync is turned on|Connect (tap )?is what asks|Connect succeeded|only (thing|tap|door)[^.]*Connect" \
  --include=*.html --include=*.md --include=*.js --include=*.mjs . | grep -v "^./.claude/" | grep -v "^./TESTING.md"
```

After the fixes, no hit is a live claim that the library loads only on the Connect tap. Classified:
- `privacy.html:307`, `:311`, `docs/FERPA.md:112`, `:116`: the new statement itself.
- `privacy.html:282`, `:295`, `docs/FERPA.md:101`: the statement's dated comment.
- `src/auth.js:82`, `index.html:2180`: Connect named as one way among several.
- `src/auth.js:429`: quotes what the documents "used to say".
- `CLAUDE.md:127`, `:129`, and `docs/sync.md:74`, `:558`, `:560`, `:564`: dated history (WO-7.4 and WO-7.5/7.6), each followed in the same passage by WO-7.9 and WO-7.16.
- `tools/verify/drive-sign-in.mjs:48`, `:680`, `:707` and `tools/verify-shell.mjs:563`: describe what that fixture measures. `:48` now names the second door right after. `:730` is not this claim ("until connect() returns").
- `plans/work-orders/phase-7-sync.md:112`, `:398`, `:415`, `:437`, `:663`, `:691-755`, `:1458-1503` and `plans/work-orders/README.md:1867`, `:1879`: dated records and the rows naming them.
- `CHANGELOG.md:151-155`, `:196`: dated history.

### Tools

- `node --check tools/verify/drive-sign-in.mjs` and `node --check src/auth.js`: both clean.
- `node tools/wo-sweep.mjs` (re-run after the TESTING.md edits): `45 checks · 42 passed · 0 failed · 3 to review`, `EXIT=0`. The three are the standing REVIEWs.
- `verify-shell.mjs` was not re-run, because no predicate or check expression was touched.
- `grep -rn MUTATION` over the changed files: no hit in any code file. The TESTING.md hits (:1276, :1543-1546, :1679-1680, :1813-1814, :2028-2035, :2133) are older work orders' records of reverted mutations.

The Acceptance 2 box in `plans/work-orders/phase-7-sync.md` is left as it was, for the verifier to decide.

## Correction round 3

2026-09-28, against the second verifier's ❌ on Acceptance 2, on the owner's ruling. Comment and record text only: no executable line moved, `sw.js` untouched (`CACHE` stays `planbook-shell-v144`), nothing committed or pushed, and no mutation made.

### Changes
1. `src/auth.js:79-89`, the `hostAllowsSignIn()` origin-list comment under "OPEN SINCE WO-7.4". It no longer reads "no third-party code UNLESS a teacher connects Drive". It now says that the policy narrowed in WO-7.4's sitting and has been re-worded since, and that as of WO-7.16 (2026-09-28) it reads "except for Google Drive sync, which uses Google's own sign-in library". It names both doors: Connect in About, and Open from Google Drive, whose tap loads the library even when the sign-in is then cancelled at Google's window, "so a device can hold the library without ever connecting". It also names the launch-time preload on a device where a sign-in succeeded. The comment grew by two lines, so later `auth.js` line numbers shift by +2. For example, the old-wording quote is now at `:431`. `node --check src/auth.js` is clean.
2. `plans/work-orders/phase-7-sync.md:1502` and `TESTING.md:12762`: Acceptance 2 is unticked (`- [ ]`), for the verifier to decide. The other boxes are unchanged.
3. `TESTING.md` § WO-7.16, after the first correction round's sub-list: a dated "Correction round 3" block. It records the auth.js fix, the exact line-break-insensitive command, its result, and every hit classified. It also covers `plans/wo-3-18-video-runbook.html:359-360`.

### Line-break-insensitive search
The file set is the same as before: every `.html`, `.md`, `.js` and `.mjs` in the tree, minus `.git/`, `.claude/`, `node_modules/` and `TESTING.md`. Before matching, the command collapses each file's whitespace, newlines included, to a single space. It then maps each match back to its original line span. The phrase list is the round-2 list plus six alternatives.
```
node -e 'const fs=require("fs"),P=require("path");const RE=/connect (was|has) never|where Connect (was|has)|loads first when Connect|only when Connect|until Connect|loads only on the Connect|only on the Connect tap|appended on the Connect tap|when Connect is tapped|at no other moment|unless a teacher connects|none unless|unless Google Drive sync is turned on|Connect (tap )?is what asks|Connect succeeded|only (thing|tap|door)[^.]*Connect|unless[^.]{0,60}connects|when a teacher connects|teacher who connects|never (been )?tapped[^.]{0,20}Connect|Connect[^.]{0,20}never (been )?tapped|loads only (on|when)|only (on|when)[^.]{0,20}Connect (is )?tap/gi;const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const p=P.join(d,e.name);if(e.isDirectory())return[".git",".claude","node_modules"].includes(e.name)?[]:walk(p);return/\.(html|md|js|mjs)$/.test(e.name)&&p!=="TESTING.md"?[p]:[]});for(const f of walk(".")){const s=fs.readFileSync(f,"utf8");let flat="",at=[],ln=1,ws=false;for(let i=0;i<s.length;i++){const c=s[i];if(/\s/.test(c)){if(!ws){flat+=" ";at.push(ln);ws=true}}else{flat+=c;at.push(ln);ws=false}if(c==="\n")ln++}for(const m of flat.matchAll(RE)){const a=at[m.index],b=at[m.index+m[0].length-1];console.log(f.split(P.sep).join("/")+":"+(a===b?a:a+"-"+b)+": "+m[0])}}'
```
I ran it from the repo root after the rewording: 61 hit lines, exit 0. The command copied out of `TESTING.md` is byte-identical to the one I ran, checked with `diff`. `src/auth.js:79-89` no longer matches. **No hit is a live false claim.** Classified:
- **New statement:** `privacy.html:307`, `:311`, `docs/FERPA.md:112`, `:116`.
- **The statement's dated comment:**
  - `privacy.html:278-279` and `FERPA.md:86-87`: WO-7.6's "a Connect succeeded".
  - `privacy.html:282`: inside WO-7.6's dated sentence, which the WO-7.16 sentence twelve lines later contradicts on purpose.
  - `privacy.html:294-295` and `FERPA.md:100-101`: the WO-7.16 sentence itself.
- **Live and true, with Connect as one way among several:** `index.html:2180`.
- **Quote of the old wording, marked "used to say":** `src/auth.js:431`.
- **Dated history:**
  - `CLAUDE.md:127`, `:129`
  - `docs/sync.md:74`, `:558`, `:560`, `:564`
  - `CHANGELOG.md:151`, `:154`, `:155`, `:196`
  - `phase-7-sync.md:112`, `:112-113`, `:398`, `:415`, `:437`, `:663`, `:691`, `:701`, `:717-718`, `:727`, `:743`, `:754`, `:755`, `:1447`, `:1458` (×2), `:1459`, `:1486`, `:1489`, `:1503`
  - `plans/work-orders/README.md:1867` (×2), `:1879` (×2)
  - **`plans/wo-3-18-video-runbook.html:359-360`**, left as written. It sits under the heading "Blocker 2 — discharged 2026-09-25, by WO-7.4" and is past tense ("narrowed their third-party sentence in the same sitting"). It records what WO-7.4 did that day, not what the policy reads now.
- **Fixture descriptions (what the Connect-door section measures):** `tools/verify/drive-sign-in.mjs:48`, `:680`, `:707`, and `tools/verify-shell.mjs:563`.
- **Not this claim (noise from the widening):**
  - "teacher who connects", about the nothing-is-uploaded copy: `CHANGELOG.md:1359`, `CLAUDE.md:141`, `phase-7-sync.md:124`, `src/auth.js:22`, `drive-sign-in.mjs:217`.
  - `src/auth.js:456`: "connects to the wi-fi".
  - `phase-7-sync.md:829` and `src/shell.js:1806`: "downloads only when".
  - `src/shell.js:2243-2244`: the opt-in's "ONLY thing that clears it".
  - `src/drive-sync.js:556-559`: a `[^.]*` span that runs into a button label.
  - `drive-sign-in.mjs:730`: "until connect() returns".

### Judgement calls
- **`privacy.html:282`.** It reads in the present tense, "A device where Connect was never tapped fetches nothing from Google". But it sits inside WO-7.6's dated sentence, in a comment whose later WO-7.16 sentence corrects it in as many words. The brief says dated history stays as written, so I classified it as history and did not edit it. If the verifier reads it as live, the fix is one word: "fetched".
- **The runbook.** It is an operational document, but the passage is a dated past-tense record under a "discharged" heading. So I classified it as history rather than rewording it.

### Tools
- `node --check src/auth.js`: clean. No other JS file changed this round.
- `node tools/wo-sweep.mjs`: `45 checks · 42 passed · 0 failed · 3 to review`, exit 0. The three are the standing REVIEWs.
- `grep -rn MUTATION`:
  - `src/auth.js`: nothing.
  - `plans/work-orders/phase-7-sync.md:367`: WO-5.3's historical record.
  - `TESTING.md`: every hit is an older work order's record of a reverted mutation. None falls in § WO-7.16.
- There are no CR bytes in any of the three files touched.
- `verify-shell.mjs` was not re-run, because no predicate or executable line was touched.

Files touched this round: `src/auth.js`, `TESTING.md`, `plans/work-orders/phase-7-sync.md`, `.claude/dispatch/WO-7.16-result.md`.

## Correction round 4

2026-09-28, on the owner's ruling, against the third verifier's FAIL on Acceptance 2. Only comment text and check-label text changed:
- No executable line or predicate moved.
- `sw.js` `CACHE` is untouched and stays `planbook-shell-v144`.
- `CLAUDE.md` was not edited.
- Nothing was committed or pushed, and no mutation was made.

### Method
This round did not use phrase-list matching. Every mention of the sign-in machinery was enumerated, then read in its own sentence:
```
PAT='connect|open from google drive|drive door|first-run door|first-run drive|google.s (sign-in )?library|\bgis\b|accounts\.google|gsi|hostAllowsSignIn|loadGis|preloadSignIn|opt-in|opted.in|driveSyncOptIn|requestToken|requestAccessToken|reconnect|ensureFreshToken|access token'
grep -rliE "$PAT" src tools sw.js index.html privacy.html about.html docs plans
grep -rniE "$PAT" <file>
```
After the edits this finds 55 files and 1,196 hit lines. I also read `CHANGELOG.md`, `CLAUDE.md` and `AGENTS.md` (0 hits).

I checked the four triggers against the code before writing any wording:
- **Connect:** `auth.connect()`.
- **The first-run door:**
  - It calls `reconnect()`, which loads the library even if the sign-in is then cancelled.
  - On success it runs `afterDriveAuthChange(true)`, which sets the opt-in, then `listDriveYears()`. That reaches `googleapis.com` with neither Connect nor Sync tapped.
- **The header button:**
  - Its tap runs `reconnect()` and then `syncNow()`.
  - It is drawn only on a device that is already opted in, so it never sets the opt-in.
  - It fetches the library if the preload has not landed.
- **The launch preload:** it runs on opted-in devices only, loads the library, and asks for no token.

The file list and the grouped classification table are in `TESTING.md` § WO-7.16, "Correction round 4".

### Counts
- **Live-false and fixed:** 19 passages in 12 files. These include the verifier's 5.
- **Live-true claims that were read closely:** about 20 rows. Examples:
  - the new statement in `privacy.html` and `docs/FERPA.md`
  - "the door's tap is the Connect"
  - `ensureFreshToken`
  - `preloadSignIn`
  - fixture descriptions
- **Live-true or noise in bulk:** about 600 lines. This is fixture state and selectors, UI strings, "connection", "alongside", IDB `connect()`, and the like. These counts are estimates: I read the lines in context but did not tally them one by one.
- **Dated history or records:** about 330 lines. This covers:
  - the phase-7 work-order file
  - `plans/work-orders/README.md` rows
  - the runbooks
  - `CHANGELOG.md`
  - `tools/README.md` count records
  - the dated comment blocks in `privacy.html` and `FERPA.md`
  - the dated passages in `docs/sync.md`
  - `CLAUDE.md:127-133` and `:158-159`, which are dated and were **not edited, by the owner's instruction**

### Changes (file:line after edits)
1. `sw.js:156-162`: the library is fetched on demand on a tap of Connect or Open from Google Drive, at launch on an opted-in device, or on the header's tap if that preload failed.
2. `tools/verify/drive-sign-in.mjs:148-151`: the check label now matches item 1. The predicate is unchanged.
3. `src/drive-sync.js:101-106`: the Drive hosts are reached from About's Sync, from the header button (which signs in first), or from the door's `listDriveYears()` and `pullYear()` with neither Connect nor Sync tapped.
4. `src/drive-sync.js:642-644`: `signedInAgain()` is called after a Connect *or* door sign-in.
5. `src/shell.js:2111-2118`: the opt-in has two setters, Connect's answer and the door's answer (`:2308`). A cancelled door tap sets nothing, and the header button never reaches this code.
6. `src/shell.js:4677-4679`: a token exists only after a sign-in tap, which is one of Connect, the header button, or the door.
7. `src/shell.js:897-899`: the opt-in is set by Connect and the door, and cleared by About's switch-off.
8. `src/shell.js:660-662`: About's Sync button is hidden until there is a token from any of the three taps.
9. `src/sync-button.js:155-158`: `rememberOptIn()` is reached from both doors, never from the header's own tap.
10. `src/prefs.js:212-213`: the opt-in turns `true` on the first successful sign-in from either door.
11. `src/prefs.js:235-238`: a `false` device makes no request to Google *at launch or on a return to view*. A tap of either door does reach Google, and a cancelled tap leaves the value `false`.
12. `src/auth.js:602-605`: `reconnect()` is the header's only way back in, and the door is its second caller. Connect goes through `connect()`.
13. `src/auth.js:440-446` (the `loadGis()` comment) and `:86-88` (the append list): both now include the header's `reconnect()` append when the preload has not landed. This is noted as widening nothing, because only opted-in devices have that button.
14. `index.html:2185-2190`: the same header-tap sentence.
15. `src/first-run.js:49-51` and `docs/sync.md:254-255`: they said the library is "kept off" a device that never opted in. That is now scoped to the *launch*, because a tap of either door still fetches it. `docs/sync.md` was edited with a byte-level replace, so its mixed CRLF/LF endings are unchanged (293 CRs before and after).
16. `tools/verify/first-run.mjs:366-369`: the label now says the library loads "only on a sign-in tap (here, the Drive door)". Label only.
17. `tools/verify/drive-sync.mjs:221-223`: the comment now says the helper takes the door's answer too.
18. `TESTING.md` § WO-7.16: a new dated "Correction round 4" block holding the method, file list, table and counts. Acceptance 2 is left unticked there and in `phase-7-sync.md:1502`.

### Noted, not edited
- `plans/work-orders/phase-8-packaging.md:1433` still describes the WO-7.5 silent renewal that WO-7.10 removed. That is a stale work-order record, but it is not this claim.
- `docs/FERPA.md:75` says Google is brought in "only by connecting Google Drive sync herself". That is about data sharing, not code loading. I left it because the public documents are outside this round.

### Tools
- `node --check` is clean on all ten changed JS/MJS files, including `sw.js`.
- `node tools/wo-sweep.mjs` printed **`45 checks · 42 passed · 0 failed · 3 to review`, EXIT=0**. The 3 to review are the three standing REVIEWs.
- `grep -n MUTATION` over the changed files found only `src/shell.js:953` ("A CLASS MUTATION ADDED LATER…"). That line is also present in HEAD and is not a live mutation.
- I did not run `verify-shell.mjs`: only labels and comments moved.

**Files touched this round:** `sw.js`, `src/drive-sync.js`, `src/shell.js`, `src/sync-button.js`, `src/prefs.js`, `src/auth.js`, `src/first-run.js`, `index.html`, `docs/sync.md`, `tools/verify/drive-sign-in.mjs`, `tools/verify/first-run.mjs`, `tools/verify/drive-sync.mjs`, `TESTING.md`, `.claude/dispatch/WO-7.16-result.md`.
