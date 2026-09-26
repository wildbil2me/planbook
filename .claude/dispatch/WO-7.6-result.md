# WO-7.6 — result (implementer, 2026-09-26)

**Summary.** Only wording changed. The shared data-flow statement in `privacy.html` and `docs/FERPA.md` now names both ways Google's library is reached, and says a device where Connect was never tapped fetches nothing from Google. Every note that claimed the old sentence was "still true word for word" now says what is actually true. `git diff -U0 src/` moves no executable line. `CACHE` is v132 → v133. I inserted no mutation (`grep -rn MUTATION` over the tree finds nothing for WO-7.6). Three Acceptance boxes are ticked. The fourth is post-push and still open.

## The new public sentence (identical in both files after normalising)

> …no third-party code of any kind — unless Google Drive sync is turned on, when Google's own
> sign-in library loads from accounts.google.com. It loads first when Connect is tapped. After that,
> on that device, it loads each time Planbook opens, and Planbook asks accounts.google.com to renew
> the sign-in without a tap — then, and again whenever Planbook comes back onto the screen with the
> sign-in ended — until Disconnect is tapped. On a device where Connect has never been tapped,
> nothing is fetched from Google.

## Acceptance, line by line

1. **[x] One statement, identical, both halves, the never-connected promise.** I took the *Nothing leaves it on its own.* paragraph from each file, stripped tags, `**` and backticks, collapsed whitespace and compared with `===`. Result: `identical: true`. To get there I aligned one old difference: `privacy.html`'s "from **this** website" is now "from **the** website". The two copies had differed on that word since WO-8.12, and the line could not be met literally otherwise. The method is quoted in `TESTING.md` § WO-7.6.
2. **[x] No live claim left.** The grep is quoted verbatim in `TESTING.md` § WO-7.6.
   - **Before:** it hit `privacy.html`, `docs/FERPA.md`, `docs/sync.md` (two places), `index.html:2135`, `src/auth.js` (two places), `src/sync-button.js`, `CLAUDE.md:128` and `tools/verify/drive-sign-in.mjs:354`. All of those were reworded.
   - **After:** 13 hits outside `TESTING.md`, each one classified there. They are past-tense history in CLAUDE.md, a quotation in sync.md, WO-7.4's dated record, WO-7.6's own text and README row, and two harness comments now scoped to "a device that has not opted in".
   - **Also fixed**, though the pattern does not catch it: "a reload is a sign-out", in CLAUDE.md's WO-7.1 block, `docs/sync.md:48`, `src/auth.js` decision 1 and `src/sync-button.js`'s state legend.
   - `AGENTS.md` has no twin of either sentence.
   - `about.html` was read and left alone. It does not say when the library loads.
3. **[x] Network assertions hold, harness green.** `node tools/verify-shell.mjs` on the final tree (third run, after the last edit): **`1517 checks · 1517 passed · 0 failed · 0 skipped`, 47,848 lines, 572s, EXIT=0**. Both network checks read zero requests off the wire:
   - WO-7.4's: `0 request(s) to accounts.google.com and 69 to this origin … GIS <script> tags = 0`, then `1 request(s) … after the tap: ["https://accounts.google.com/gsi/client"]`.
   - WO-7.5's first line: `0 request(s) to accounts.google.com and 69 to this origin; sync button hidden = true … opt-in stored = null`. Its opted-in positive control passes too.
   - `node tools/wo-sweep.mjs`: `45 checks · 42 passed · 0 failed · 3 to review` (the three standing reviews).
   - `wo-gate.mjs --audit`: PASS.
4. **[ ] `verify-deploy.mjs` after the push. Not closable by me.** I re-read its `CLAIMS`. It asserts three sentences (no server of ours, no account is required, Drive holds only the file Planbook itself created), and none of them is the sentence this work order changed. All three still match the edited file.
   - A pre-push run read `19 checks · 18 passed · 1 failed`. The failure is `deployed planbook-shell-v132, working tree planbook-shell-v133`, which just means nothing has been pushed yet.
   - The four policy checks pass against the page that is live now.
   - Nothing in the tool needed updating.

## Decisions the work order did not settle

- **"Turned on", not "connected".** Trap 3: the sentence is about the opt-in, not a live sign-in.
- **"Where Connect has never been tapped", not "never connected".** A Connect tap that fails still loads the library (`rememberOptIn` runs only on success), so the tap is the true boundary. This is stricter than the Acceptance wording and fully covers it.
- **Returning to the screen is described as a token request, not a library load.** `renewSilently()` returns early when the token is live, and on a return the script is already on the page. So the sentence says Planbook "asks accounts.google.com to renew" on a return "with the sign-in ended", rather than claiming a load each time.
- **I updated FERPA.md's own *Last updated* date as well as the policy's.**
- **Two harness texts were corrected, and neither predicate changed.**
  - `tools/verify/drive-sign-in.mjs:661`: the check label said "a signed-out page … this is now the whole of the privacy policy's third-party claim". That is false since WO-7.5, and it is the "signed-out" framing Trap 3 names. It now reads "a page that never opted into sync".
  - `tools/verify-shell.mjs:552`: the `netLog` comment said only one section enables the Network domain. `sync-button.mjs` has done so since WO-7.5.
- **Three harness runs.** The first two ran before one of these comment/label edits, so I re-ran until one run covered the final tree. Only the third is cited.

## Declined / for the orchestrator

- CLAUDE.md's WO-7.5 block still says "The public wording is WO-7.6's to fix, and it must land before WO-3.18 submits". That becomes history once this closes. I left it for the close-out rather than pre-empting it.
- `tools/verify/drive-sign-in.mjs:44-47` (the file header's "a signed-out load … asks for nothing") is also framed as "signed-out". It is accurate for that fixture and I left it alone.
- Nothing needs an iPad. No 👤 line exists here.

## Draft CHANGELOG entry (the teacher decides)

> The privacy policy and the FERPA guide now say exactly when Google is contacted. Once Drive sync is turned on, Google's sign-in library loads on every launch, not only on the Connect tap, until Disconnect. A device where Connect was never tapped still contacts Google not at all. Words only. The app behaves as it did.

## Files changed

- `c:\dev\planbook\privacy.html`
- `c:\dev\planbook\docs\FERPA.md`
- `c:\dev\planbook\docs\sync.md` (its mixed CRLF region, lines 258-528, was restored after an edit normalised it; the diffstat matches `--ignore-cr-at-eol`)
- `c:\dev\planbook\index.html` (comment)
- `c:\dev\planbook\src\auth.js` (comments)
- `c:\dev\planbook\src\sync-button.js` (comments)
- `c:\dev\planbook\sw.js` (v133)
- `c:\dev\planbook\CLAUDE.md`
- `c:\dev\planbook\tools\verify-shell.mjs` (comment)
- `c:\dev\planbook\tools\verify\drive-sign-in.mjs` (comment and check label)
- `c:\dev\planbook\TESTING.md` (§ WO-7.6)
- `c:\dev\planbook\plans\work-orders\phase-7-sync.md` (three boxes ticked; the status is left for `--tick`)

Not committed and not pushed.
