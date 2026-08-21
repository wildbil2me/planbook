# WO-8.12 — the privacy policy and the FERPA document · implementation result

**Implementer** Claude (work-order-implementer), Opus · **Date** 2026-08-20
**Status written to the tracker** `🔨 IN PROGRESS` — by `node tools/wo-gate.mjs --tick WO-8.12`,
which refused `✅ DONE` because four Acceptance lines are still `[ ]`. Three of those four are owed
to a deploy, to hardware, and to the owner. The fourth is line 6, which I left open deliberately;
the reason is under its own heading below.

---

## 1. What landed

| File | What changed |
|---|---|
| `privacy.html` **(new)** | The public policy, at the repository root. Pages serves it at `https://planbook.hwgteach.com/privacy` |
| `docs/FERPA.md` **(new)** | The administrator's guide. Roll Call!'s six headings lifted, plus two this app needs and that one does not have |
| `sw.js` | The navigate branch now answers only the app's own document out of the cache; everything else falls through to the network. New `APP_DOCUMENT` set. `CACHE` `planbook-shell-v91` → `v92`. The trap-2 ruling is written at the `SHELL` list |
| `tools/verify-shell.mjs` | New § *"the policy URL is not the app"* — seven checks, at the foot of the file. The static server also records the paths it is asked for (`SERVED`), which is what those checks measure against |
| `tools/verify-deploy.mjs` | New § *"the privacy policy"* — five checks against the live origin, which is where Acceptance line 1 will be closed |
| `tools/README.md` | `check()` call-site count `1070` → `1077`, plus the entry paragraph the sweep's §11 asks for beside it |
| `TESTING.md` | § WO-8.12, with the evidence per Acceptance line and both mutation results |
| `plans/work-orders/phase-8-packaging.md` | Three Acceptance lines ticked, a landing note, status → `🔨 IN PROGRESS`; **and WO-8.5's `Owes` debt paid** (see § 6) |

Nothing was committed and nothing was pushed. **The tree is partly staged and that is an
artefact of the mutation runs, not a decision:** `git add -A` was run before the first mutation
so that `git checkout -- sw.js` could revert the mutation without taking my own unstaged work in
that file with it. `git reset` undoes it if you would rather stage the commit yourself.
`CHANGELOG.md` was not touched — a draft entry is in § 8 for the teacher to accept, reject or
rewrite.

---

## 2. Acceptance, line by line

**1. `[ ]` The policy is live at the verified domain and says the three things WO-3.18 names —
fetched over the wire.** **Owed to a deploy. Not ticked.** I cannot deploy. What is built is the
means to close it: `tools/verify-deploy.mjs` § *"the privacy policy"* fetches `/privacy` off the live
origin and asserts 200, that the document is the policy, that all three claims are present, and that
the contact is no longer the placeholder. Run against the **current** deployment (2026-08-20, real
output read):

```
── the privacy policy (WO-8.12) ──
  GET   /privacy    200 · text/html; charset=utf-8 · cache-control: public, max-age=0, must-revalidate · 204614 B
PASS | the privacy policy answers 200 at /privacy …
FAIL | the document at that URL is the POLICY and not the app shell …  :: 204614 B and it IS the app shell — the policy is not deployed at this path
FAIL | the privacy policy says the three things WO-3.18 names, in plain words  :: 204614 B read, and NOT saying: no vendor server ever receives student data · no account is required · Drive holds only files this app created
PASS | the privacy policy names a contact rather than the placeholder it ships with  :: no placeholder token in the deployed policy
```
```
https://planbook.hwgteach.com · 16 checks · 14 passed · 2 failed
```
Both reds are true and expected: the policy is not deployed, and the deployed `sw.js` is `v91`
against `v92` in the tree. **That first run is why the section has a check nobody planned.**
`/privacy` came back **200 `text/html`, 204,614 bytes** — the app shell, because this host answers
any unrecognised path that way (already documented in `verify-deploy.mjs`'s own header from
2026-08-12). So status and content type cannot tell a deployed policy from a missing one; the check
that can reads the `<title>` and the absence of `#homeView`. Without it this section would have gone
green on a deployment with no policy on it.

*(Note the last PASS is now gated: after that reading I made the placeholder check depend on the
document actually being the policy, so it announces "not run" as a FAIL rather than passing over a
page that has no contact because it has no policy either.)*

**2. `[ ]` 👤 Navigating to the policy on a device that already has the worker installed renders the
policy, not the app.** **Owed to hardware. Not ticked** — this needs a real iPad, a real install and
a force-quit, and I have none of the three. What is done at the desk is the same question asked of a
real worker in headless Edge, and it is the strongest evidence available without the device:

```
PASS | this page is controlled by ./sw.js …  :: navigator.serviceWorker.controller = "http://127.0.0.1:55628/sw.js"
PASS | navigating to the policy on a page this worker controls renders THE POLICY and not the gradebook …
       :: title = "Planbook — Privacy Policy", h1 = "Planbook — Privacy Policy", the app's #homeView present in that document = false, sections = 11
PASS | and that navigation reached the NETWORK …  :: 1 request(s) for /privacy.html during that navigation
```
For the 👤 run: deploy (or bump `CACHE` behind `tools/serve-https.mjs`, the way every 👤 line since
WO-1.3 has been run), **force-quit from the app switcher**, relaunch once so the new worker installs
and activates, then navigate to `/privacy`. Before the fix that shows the gradebook; after it, the
policy.

**3. `[x]` `docs/FERPA.md` has a section on accommodation and medical data, and one on backups, and
the backup section says the JSON contains IEP and medical data in as many words.** Ticked, and the
evidence is the file. The two sections are *"Accommodation, medical and behavior-plan information"*
and *"Backups, and what is in one"*. The backup section's first sentence is:

> **A Planbook backup file contains IEP and 504 plan details, accommodations, case managers, plan
> review dates, medical needs and behavior plans, in plain readable text**, along with the roster,
> attendance, grades and contacts. It is not redacted and it is not encrypted.

It then quotes the posture `docs/data-model.md` § Accommodations rule 4 states — the correct one, the
same a paper folder has — without softening it, and says the app discloses the same thing on the
screen where a backup is saved. I checked that last clause against `index.html`'s `.backup-notice`
block rather than asserting it: the two now name the same list of fields.

**4. `[x]` Nothing in either document claims a behaviour the app does not have.** Ticked. The walk
is § 3 below, sentence class by sentence class, with the code named. **Four claims were written and
then cut or marked** because the walk found nothing under them — that is what makes this a walk
rather than a reading.

**5. `[x]` The two documents agree on every fact, and neither restates the other's argument.**
Ticked. The **data-flow statement is deliberately identical** in both, and each copy carries a
comment saying so and saying to change them in the same sitting — that duplication is the work
order's own deliverable, and it is the only one. Everything else is divided: the policy carries the
`drive.file` argument for a teacher and the FERPA document points at it in one line; the FERPA
document carries the district-review argument, the network-tab demonstration and the static host's
request logs, and the policy mentions none of them. Each names the other by link.

**6. `[ ]` Both are readable by a principal, not only by a developer.** **Left open deliberately, and
it is not marked 👤 in the work order.** I wrote both for that reader and can name what I did —
sentence case, no jargon, one code string in the whole policy and it is quoted from Google's own
consent screen, an amber panel for the one thing the policy does *not* promise so a skimmer still
meets it. But whether a principal can read them is a judgment about a reader I am not, and no run in
this repository settles it. **I could not name evidence for the claim, so I did not tick the box.**
It wants one pass of the owner's eyes and, ideally, the eyes of one person who is not in this
project.

**7. `[ ]` 👤 The owner has decided what contact appears on a public page.** **Not ticked** —
unanswered, and not mine. See § 4.

---

## 3. The walk: every promise, and the code that keeps it

Acceptance line 4, done literally. Grouped by claim; both documents make each of these, in their own
words, except where noted.

| The claim | What keeps it |
|---|---|
| *No server of ours ever receives student information; there is no vendor server or database* | There is no network code at all: `grep -rn "fetch(\|XMLHttpRequest\|sendBeacon" src/*.js` → **zero hits**. `sw.js`'s fetch handler returns early on `url.origin !== self.location.origin`, so nothing cross-origin is even cached. No `functions/`, `_worker.js` or `_routes.json` in the repo, and `verify-deploy.mjs` § "nothing server-side" asserts none is served (PASS on today's run) |
| *No analytics, no tracking, no error reporting, no advertising, no third-party code* | `index.html` contains no external URL of any kind — the only `http`-ish match in the file is a `data:` SVG favicon. No external `<script src>` or `<link href="http…">`. Nothing in `src/` reaches a network |
| *No account is required; the app works fully signed out* | There is no auth module: no `src/auth*.js`, no Google Identity script, WO-7.1 is `⬜ NOT STARTED`. All 1,093 harness checks drive the app without ever signing in |
| *One permission, `drive.file`, reaching only files this app created* | `docs/sync.md` § "The scope, and only this scope". There is no Drive code yet, which is why both documents mark sync **"not in the released app yet"** rather than describing it in the present tense |
| *Everything is kept in the browser's own storage on your device* | `src/store.js` — `indexedDB.open(DB_NAME, …)`, one document per school year |
| *Planbook remembers a few things about this browser rather than about any student* | `src/prefs.js` — `PREFIX = 'planbook_'` and `PREF_DEFAULTS`; `setPref()` refuses a key that is not declared. `wo-sweep.mjs` §4 asserts every key used is declared and that `prefs.js` is the only door; `verify-shell.mjs` asserts every key present in `localStorage` is ours. The four the policy names — last year, last class, install-banner dismissal, last backup — are literally that list |
| *The support details are on the roster: IEP/504, accommodations, case managers, review dates, medical, behavior plans* | `docs/data-model.md` § students → `supports`; `src/supports.js` |
| *They are never on screen by default — a dot, details on a deliberate tap* | `src/supports.js` `supportsVisible()`, asked at the point each datum is produced; `src/roster.js`'s support surface; `src/accommodation-prompt.js` shows counts, never names, until asked |
| *A presentation mode hides every sensitive field at once* | `src/presentation.js` + `src/supports.js` `setPresentationMode()` / `sensitiveValue()` / `setSensitiveText()`; `wo-sweep.mjs` §5 reviews every mention of a sensitive field name outside `src/backup.js` |
| *Creating a test tells the teacher how many students have extended time, without naming one on a screen facing the room* | `src/accommodation-prompt.js` — counts by default, names on a deliberate tap, and **nothing at all** in presentation mode (its own header states the rule and the reason) |
| *A drafted message will never contain accommodation, medical or plan data* | **Marked as unbuilt in both documents.** The rule is `docs/data-model.md` § Accommodations rule 2 and `CLAUDE.md`; the resolver that will enforce it is Phase 5 and does not exist. This is one of the four claims I cut back |
| *The backup contains the support details, and the app says so where you save one* | `src/backup.js` writes the whole document (`new Blob([...], {type:'application/json'})`); `index.html` `.backup-notice` says it in as many words. The FERPA document quotes that disclosure rather than inventing a second one |
| *Nothing is encrypted — browser storage is ordinary storage and the backup is plain text* | True by absence, and checked: the only `crypto` calls in `src/` are `crypto.getRandomValues` / `crypto.randomUUID` in `src/store.js`, both for id generation, and `src/zip.js` says in its header that encryption is deliberately not implemented |
| *Backups are nagged for* | `src/backup.js` (`NAG_ID = 'backupNag'`) and `#backupNag` in `index.html` |
| *An installed app keeps its data; a bookmarked site can be evicted after about a week* | Platform behaviour, recorded in `CLAUDE.md`; the app's answer is `manifest.webmanifest` + `sw.js`'s precache, which `verify-shell.mjs` checks walks the module graph against |
| *The app works with the network off* | `sw.js` SHELL precache + the navigate branch this work order fixed; the harness's own reading — the app's document answered with **0 network requests** — is that branch working |
| *Clearing site data removes everything on that device* | IndexedDB and `localStorage` are site data and there is no third store: `grep document.cookie src/ index.html` → **zero hits** |
| *The static host logs requests for the app's own files* | The honest caveat, in `docs/FERPA.md` only. `_headers` is the whole of the host configuration; there is no analytics binding anywhere |
| *If this policy changes, the date at the top changes* | A promise about the document, not the app, and the date is on the page (20 August 2026). Both documents are dated, per trap 5 |

**The four claims that did not survive the walk**, all now marked or cut:

1. *"the template system refuses to fill in accommodation, medical or plan information"* — present
   tense over code that does not exist. Now future tense and marked *"not in the released app yet"*.
2. *Drive sync*, described as though it shipped. Now marked, in both documents and in the policy's
   own Drive section.
3. *The `mailto:` hand-off*, same. Now marked.
4. *"a record of the outreach you have sent"* in the list of what is stored. `newYearDocument()`
   creates `log: []` and **nothing in `src/` writes to it** — both documents now say the app keeps a
   place for it and the feature that fills it is not shipped.

**Not written, on purpose** (trap 3): no encryption claim, no retention or deletion window, no
"we do not sell your data", no compliance determination, no promise to notify anyone of a change.

---

## 4. The contact line — exactly what the owner replaces, and where

- **The token:** `PLANBOOK-CONTACT-TBD`
- **The one place to edit:** `privacy.html`, the `Contact` section near the foot of the page —
  `<strong>PLANBOOK-CONTACT-TBD</strong>`. It occurs **exactly once** in that file; the header
  comment describes it rather than repeating it, so `grep PLANBOOK-CONTACT-TBD privacy.html` returns
  one line and one edit finishes it.
- **`docs/FERPA.md` deliberately carries no second copy.** Its closing line points at the contact on
  the policy, so there is one address in the repository rather than two to keep in step.
- **The other occurrences are a guard and prose, not edit sites:** `tools/verify-deploy.mjs` matches
  the token to fail a deployment that still carries it, and the work-order note and this file mention
  it. None of them needs changing when the address is decided.
- If the decision is a form rather than an address, the markup takes a link there instead — the
  surrounding sentence reads *"Questions about Planbook or about this policy:"* either way.

I did not invent an address and did not ship the policy silently missing one, per trap 4 and
WO-8.7's ruling that an address in a public file is a spam and phishing target.

---

## 5. Commands run, and what they actually printed

**`node tools/verify-shell.mjs`** — run three times to completion; I waited for each and read the
output. On the delivered tree:

```
1093 checks · 1093 passed · 0 failed · 0 skipped
30,753 lines · 28.1 lines per check · 389s
```
exit 0. The seven new checks are quoted in § 2 above and in `TESTING.md` § WO-8.12.

**Two mutations, both on the delivered tree, both reverted** (`git checkout -- sw.js`, and the tree
was staged first so the revert could not take my own edits with it):

| Mutation | Result actually printed |
|---|---|
| the navigate branch as it was before this work order — every navigation answered out of the cache | `1093 checks · 1091 passed · 2 failed`, exit 1. At the policy URL: `title = "Planbook"`, `h1 = "Planbook"`, *the app's #homeView present in that document = true*, `sections = 0`, and **0 requests for `/privacy.html`** reached the server |
| the navigate branch deleted outright — the fix that overshoots | `1093 checks · 1092 passed · 1 failed`, and it is a **different** check: `1 request(s) for /index.html` during the app's own navigation. Both policy readings stay green, and so does *"the app's own navigation still lands on the app"* — online, with nothing intercepting, everything works. That is why the server-side reading exists at all |

**`node tools/wo-sweep.mjs`** — `33 checks · 29 passed · 1 failed · 3 to review`.

**The one FAIL is not mine, and I want to be precise about it.** It is:

```
FAILED:
  - no CSS custom properties standing in for inline colors
      plans/wo-3-18-runbook.html:9, …:10, …:11, …:12, …:13, +155 more
```

`plans/wo-3-18-runbook.html` is an **untracked file that appeared in the working tree at 20:54,
during this dispatch** — after I had staged everything at 20:47 — and nothing in WO-8.12 created,
edited or referenced it. It is plainly another session's artifact: it declares ~160 CSS custom
properties, links Google Fonts, and has dark-mode blocks, all three of which this repository
forbids. `wo-sweep`'s `STYLE` set is every `.css`/`.html` outside `tools/`, so it is being read.
**Every one of the 160 hits is in that file** (checked with `--verbose`; no other path appears in
the failure). I did not delete it — it is not mine to delete. Before this dispatch the sweep was
`33 checks · 30 passed · 0 failed · 3 to review`, and removing or fixing that file returns it there.
The three REVIEWs are all pre-existing and none of them names a file this work order touched.

**`node tools/verify-deploy.mjs`** — `16 checks · 14 passed · 2 failed`, quoted in § 2. It reached
the real origin; this is a result, not an environment report.

**`node tools/wo-gate.mjs --audit`** — `PASS` after the WO-8.5 debt in § 6 was settled.

---

## 6. Decisions the work order did not settle, and which way I went

1. **The policy's URL is `/privacy`, and the file is `privacy.html` at the root.** Cloudflare Pages
   serves an extensionless path for a `.html` file and redirects the `.html` form — the same
   normalisation that makes `/index.html` a 308 to `/` here, which this repo has already been bitten
   by. So `https://planbook.hwgteach.com/privacy` is the URL to paste into Google's form, and it is
   the one `verify-deploy.mjs` asserts; `/privacy.html` is *observed* on every run so a reader can
   see which way this host is normalising. **I could not verify the redirect direction** — the policy
   is not deployed — so both checks are written to survive being wrong about it: a redirect fails the
   status check with the chain printed, and the content is read at the end of the chain so the words
   are still checked.
2. **The policy is a single self-contained page** rather than linking `src/shell.css`. It is the one
   document that must render for a stranger fetching it cold with no worker, so it is one request
   with nothing to fail independently of it. The values are quoted literally from
   `design/style-guide.md`, colours inline, no dark mode; the reasoning is written in the file's
   header as trap 2's ruling asks for its sibling.
3. **The 44px question.** The page has no controls. Inline links inside prose are text, not controls,
   and the one link that stands on its own line takes `min-height: 44px` in the page's
   `@media (pointer: coarse)` block in the same pass that added it. The distinction is written at the
   rule, next to the `src/home.css` precedent for a line of TEXT under the floor.
4. **`/index.html` counts as the app's own document, not just `/`.** `_headers` already pins both for
   the same reason — a bookmark that works online and not offline is exactly the failure the branch
   exists to prevent. One line, commented at the `APP_DOCUMENT` set.
5. **`docs/FERPA.md` links to GitHub for the source and the policy links to `docs/FERPA.md` on
   GitHub**, because Pages serves `.md` as a file a browser offers to download, and the reader on the
   other end of that link is a principal. The repository is public (WO-8.7 says so in as many words),
   so the link is stable.
6. **WO-8.5's `Owes` debt was paid, and that is a one-line edit inside another work order.** Ticking
   Acceptance line 3 here made `wo-gate.mjs --audit` go red — *"WO-8.5 → WO-8.12's box … is already
   [x]: the debt was paid, so tick this line on that evidence and drop the **Owes** field"*. I did
   exactly that: WO-8.5's `FERPA.md` Acceptance line is now `[x]` with an italic note naming who paid
   it, and `· **Owes** WO-8.12` is off its header. **I did not touch WO-8.5's README deliverables**,
   which are its own and out of scope here. The audit passes again.
7. **`ROADMAP.md` was not touched.** Its `docs/FERPA.md` box belongs to this work order's
   `Closes roadmap` field, and an unfinished work order closes nothing — `--tick` says so and leaves
   the box and the dashboard alone. Tick it when lines 1, 2, 6 and 7 are true; the Phase 8 row then
   goes `1/8` → `2/8` and the overall row `52/81` → `53/81`.

---

## 7. Out of scope — the temptations I declined

- **An in-app link to the policy.** The About modal is where it obviously belongs and it would have
  been four lines. It is [WO-7.3](../../plans/work-orders/phase-7-sync.md)'s own Acceptance box.
  Worth knowing when that lands: the policy is **not** in `sw.js`'s `SHELL`, so tapping that link
  with no network gives the browser's error page. That consequence is ruled and accepted (trap 2), and
  the ruling is written at the `SHELL` list so whoever reverses it finds the argument first.
- **`README.md` and Known limitations.** WO-8.5's, still `⬜`.
- **The demo video, domain verification and the submission.** WO-3.18's, and blocked on WO-7.1.
- **Adding `privacy.html` to `SHELL` "while I was in there".** This is the trap, written down twice
  now — once in `sw.js` and once in the policy's own header.
- **Tidying `_headers` to pin `Cache-Control` on `/privacy`.** Not needed: nothing about the policy
  is on the update path, and the file's own header says what is pinned and why.

---

## 8. Draft `CHANGELOG.md` entry — yours to accept, rewrite or bin

> ### Added
> - **A public privacy policy** at `/privacy`, and **`docs/FERPA.md`**, the guide for a principal or
>   a district technology director. They are one set of facts written for two readers and they carry
>   the same data-flow statement word for word — what leaves the device is nothing, unless you save a
>   backup, turn on Drive sync, or send a message you drafted. The FERPA document says in as many
>   words that a backup contains IEP, 504 and medical details in plain text, which until now the app
>   said only on the screen where you save one.
>
> ### Fixed
> - **The service worker answered every navigation with the app.** On a device with Planbook
>   installed, the privacy policy's own URL rendered the gradebook — invisible from a cold fetch,
>   which is exactly how a reviewer would have seen it. The app's own document still comes from the
>   cache so it opens with the network off; everything else at the origin now goes to the network.

---

## 9. What a verifier should look at first

1. `privacy.html` and `docs/FERPA.md` read cold, against § 3's table — the walk is the substance of
   Acceptance line 4 and it is the thing most worth a second opinion.
2. `sw.js`'s navigate branch and the `APP_DOCUMENT` set, against the mutation results in § 5.
3. `tools/verify-deploy.mjs` § "the privacy policy" — in particular that the check which can actually
   see a missing policy is there, since the two obvious ones pass on a deployment that has none.
4. The four open Acceptance boxes, and whether my reasons for leaving each open hold up. Line 6 is
   the one I most expect to be argued with.
