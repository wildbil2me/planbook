# WO-8.15 — the homepage Google is given is an empty gradebook · implementer result

**Route** none — built inline in the owner's session · **Date** 2026-09-25 · **Status on the row**
`🔍 AWAITING VERDICT`, written by `--handoff` after this file.

**Read this first.** No implementer was dispatched. The session that booked this work order also
built it, checked its own work and ticked four boxes, and the owner stopped it there: the verifier
had never run. The four ticks have been **taken back off**, in the phase file and in `TESTING.md`, so
every box on this work order is open for the verdict to decide. The row was set back to `⬜` by hand,
claimed with `--start` and handed off with `--handoff`, so the tools wrote the status and the dates
are real. **Everything below is the builder's claim, not evidence.**

---

## What changed, by path

| File | What |
|---|---|
| `about.html` | **New, untracked.** The front page, shaped like `privacy.html`: inline styles, no script, no manifest link, no worker registration. |
| `tools/verify/about-page.mjs` | **New, untracked.** Seven `check()` calls. |
| `tools/verify-shell.mjs` | +2 lines: one `import`, one `BROWSER_SECTIONS` row directly after `verify/policy-url.mjs`. |
| `tools/verify-deploy.mjs` | +29 lines: a `/about` section after the policy's, two checks. |
| `tools/README.md` | Call sites `1467` → `1474`, "seventy-one" → "seventy-two" files, and a ledger paragraph for WO-8.15. |
| `TESTING.md` | `### WO-8.15` at the foot of `## Phase 8`, boxes all open. |
| `plans/wo-3-18-runbook.html`, `plans/wo-3-18-video-runbook.html` | Homepage field → `/about`; video shot 02 starts there. |
| `plans/work-orders/phase-8-packaging.md` | WO-8.15 and WO-8.16 booked; WO-8.6 gains `WO-8.16` in `Depends on`. |
| `plans/work-orders/phase-3-gradebook.md` | WO-3.18 gains `WO-8.15` in `Depends on`, with a dated note. |
| `plans/work-orders/README.md` | Rows 80 and 81; § The files range `WO-8.1 … WO-8.16`. |
| `CHANGELOG.md` | An entry for WO-8.15, **written before any verdict**. Judge whether it claims more than the verdict supports. |

**Not touched:** anything under `src/`, `index.html`, `sw.js` (so no `CACHE` bump), `privacy.html`,
`docs/FERPA.md`, the manifest.

**Nothing is committed.** The whole delivery is the working tree.

## What the builder claims to have run

- `node tools/verify-shell.mjs` on this tree: `1485 checks · 1485 passed · 0 failed · 0 skipped`,
  542s, exit 0. That is 1478 plus the seven new checks.
- A mutation round, one run, three breaks applied from scratchpad copies (not `git checkout`), each
  marked `MUTATION WO-8.15`: `./about.html` added to `SHELL`; a visible paragraph containing
  `plans/work-orders`; the policy link replaced by a comment. Claimed result: `1485 checks · 1482
  passed · 3 failed`, and the three reds are exactly the three checks aimed at. Reverted from the
  copies. **Grep for `MUTATION` yourself.**
- `node tools/wo-sweep.mjs`: `45 checks · 42 passed · 0 failed · 3 to review`, the three REVIEWs
  claimed to be the standing ones.
- `node tools/wo-gate.mjs --audit`: PASS, after the § The files range was fixed.
- `node tools/verify-deploy.mjs` against the live origin: `19 checks · 18 passed · 1 failed`. The red
  is the new `/about` document check, reading the app shell, **because the page is not deployed.**

## What cannot close before the verdict, and why that is not a failure

- **Acceptance 4 (live `/about`) is owed to a push, and the push waits on this verdict.** A push to
  `main` is a production deploy. The order is: verdict, commit, push, `verify-deploy.mjs` green at
  `/about`, then the box. Grade whether the check *would* close the line; it cannot be run green today.
- **Acceptance 5 is 👤**: the owner, cold, on the iPad and the laptop.

## Where the builder is least sure, and worth your time

1. **Google's homepage requirement is quoted from memory**, not from Google's current branding help
   page. The work order's *Why it exists* rests on it. Check whether it overstates the requirement.
2. **The install steps** for iPad Safari and Chrome/Edge are written from general knowledge. The
   Chrome menu wording was softened because browsers move that menu item between versions.
3. **The page's claims against `privacy.html`**: the Traps line says it must claim nothing the policy
   does not. Read the *Where your students' information goes* panel and the sync sentence against
   the policy's own wording, including its *not in the released app yet*.
4. **The fixture assumption.** `about-page.mjs` reads the page's links with a regex over the markup
   outside comments. Ask what shape of link would get past it, and whether the leak-marker list can
   see anything that is not repository vocabulary.
5. **Scope.** WO-8.16, the WO-3.18 and WO-8.6 dependency edits, and the README rows came out of the
   same sitting. They are booking, not building, but they are in this tree.

## Correction round 1

2026-09-25. **The fix is for the verifier's one failure**: Trap 2, about.html:200-201 said Drive sync
is available, and the policy says it is not. Nothing else was rebuilt, no box was ticked, nothing was
committed or pushed.

**The changed lines** (`about.html`, the third `<li>` of *Where your students' information goes*):

Before:
```
        <strong>Google Drive sync is optional</strong>, off unless you turn it on, and asks only
        for access to the one file Planbook creates in your own Drive.
```
After:
```
        <strong>If you choose to turn on Google Drive sync, Drive holds only the file Planbook
        itself created.</strong> <em>Not in the released app yet.</em>
```
The bold sentence is privacy.html:235-236's short-version sentence word for word. The italic phrase
is privacy.html:296's caveat without its "— see below", because this page has no "below" for it to
point at. Nothing new is claimed. The phrases "off unless you turn it on" and "asks only for access"
are gone. With them went the only claim that sync is something a user can actually do on the
deployed origin, where `hostAllowsSignIn()` returns false. The markup keeps the same shape as the
two `<li>` above it: a `<strong>` lead, then plain text, with no inline style added.

**Other files touched:** none, apart from this section. CHANGELOG.md's WO-8.15 entry (lines 15-29)
says "the privacy position in three lines" and does not quote the sync sentence. TESTING.md § WO-8.15
does not mention Drive or sync. So neither needed a change. `tools/verify/about-page.mjs` does not
assert the sentence's text (grepped for `drive|sync`: no hits), so no check had to move.

**Commands, results read from their own output:**
- `node tools/verify-shell.mjs` printed `1485 checks · 1485 passed · 0 failed · 0 skipped`, then
  `46,803 lines · 31.5 lines per check · 538s`, and the log ended `EXIT=0`. This came from its own
  log after the run exited.
- `node tools/wo-sweep.mjs` printed `45 checks · 42 passed · 0 failed · 3 to review` and exited 0.
  The three to review are standing sweep-wide notes and do not concern this page.
- `node tools/wo-gate.mjs --audit` printed `PASS | every fragment matches exactly one roadmap box, …
  and every dashboard row matches its own boxes.` (overall row 72/81), and exited 0.
- No mutation was made in this round. `grep -rn "MUTATION WO-8.15"`, excluding TESTING.md's record
  of the first round and this folder, found nothing (grep exit 1). A bare `grep -rn MUTATION` over
  code files returns only standing prose in `src/shell.js` and `tools/`. None of it is this work
  order's.

**Not verifiable here:** how the sentence reads on the deployed `/about`. That waits for a deploy,
and `verify-deploy.mjs` was not run because nothing is deployed. Also, `about.html` is intent-to-add
in the index (an empty staged blob). The working tree holds the corrected text.
