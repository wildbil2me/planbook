# WO-8.7 — the name and the host, decided · implementation result

**Route** Claude (work-order-implementer), Opus tier · **Date** 2026-08-12 · **Branch** `phase/3-gradebook`

**One sentence up front: three of the four Acceptance lines are still open and I did not attempt
them.** They need a browser holding GoDaddy, Cloudflare and Google Cloud credentials. What I closed is
the one line the settled name already satisfies, the repository half of line 4 stated as a checked
fact, the distribution sentence, the `_headers` file, and an ordered execution sequence so the owner
can run the human half in one sitting without re-deriving the order.

---

## Files changed

| File | What |
|---|---|
| `_headers` | **New**, repo root. Pins `/sw.js`, `/index.html` and `/` to `Cache-Control: no-cache`, with the reasoning in `#` comments |
| `plans/work-orders/phase-8-packaging.md` | WO-8.7 section only: the distribution sentence and its three supporting paragraphs, a `_headers`-written paragraph, the nine-step execution sequence, the Acceptance edits, and one sentence of the 2026-08-12 status note amended |

Nothing else was touched. `manifest.webmanifest`, `index.html`, the README, `sw.js`, `ROADMAP.md`, the
dashboard, `TESTING.md` and `CHANGELOG.md` are all unmodified. No commit was made — the brief did not
ask for one, so the tree is left dirty with `_headers` untracked.

---

## Against the Acceptance list, one by one

### 1. The name is written here, and it is one name rather than a preference between two. — **ticked**

`- [x]`, with the evidence written beside it in the work order.

**What I checked, and how.** The decision table records `Planbook` as the name; I read the whole WO-8.7
section and there is no shortlist, no alternative and no "or" anywhere in it — the only naming
*tension* recorded is the deliberate name/domain mismatch, which is a decision about the domain and
not a second candidate name. I also read `manifest.webmanifest`: `"name": "Planbook"` and
`"short_name": "Planbook"`, with `start_url` and `scope` both `"./"`, which is what the
subdomain-origin decision needs and costs nothing to confirm.

**What I deliberately did not claim.** "One name in the manifest, the README and the consent screen"
is **WO-8.6's** third Acceptance line and I checked only the manifest, because that file was on my
read list and the other two are another work order's check. The tick above is on *this* line's
wording — one name written here — not on cross-file consistency.

### 2. The URL resolves over HTTPS and serves the app, with the service worker registering. — **open, 🙋 the teacher's**

**Not attempted, not ticked, and nobody has seen it.** Nothing is deployed; there is no Cloudflare
account, no Pages project and no DNS. I have no way to observe this and no basis for predicting it,
so the box stays `- [ ]` with a note naming step 7 as where it closes. Step 7 spells out what to read
rather than what to assume: padlock, app rendering, service worker *activated and running* in DevTools,
`cache-control: no-cache` on the document and on `/sw.js`, then the iPad install.

### 3. The domain is verified in the Cloud console. — **open, 🙋 the teacher's**

**Not attempted, not ticked.** It cannot even be started until the nameservers are answering at
Cloudflare (step 3), because that is where the TXT record has to live. Step 8 carries it, including
the one detail that is easy to get wrong: the verification UI is **Search Console's**, reached from the
Cloud console, and the property to verify is the **apex** `hwgteach.com` rather than the subdomain.

### 4. Nothing in the deployment runs server-side code, as a checked fact. — **split honestly; box left open**

**The repository half I checked and stated as fact**, in the work order under the line:

- `find` over the whole tree (excluding `.git`) for `package*.json`, `wrangler*`, a `functions/`
  directory, `_headers` and `_redirects` returned **nothing** before my change — so there is no
  `functions/` directory, no `package.json`, no lockfile and no wrangler config anywhere.
- What would deploy is `index.html`, `src/`, `sw.js`, the static assets and now `_headers`.
  `tools/*.mjs` is bare Node run by hand and is invoked by no deploy, no server and no page load
  (`tools/README.md` § The rule).
- `wo-sweep.mjs`'s first check asserts that half on every run: `PASS | no dependency manifest anywhere
  :: no package.json, no lockfile, no node_modules`.

**The deployment half is the owner's** — a Pages project with no Functions attached — and it cannot be
checked before a deployment exists. So the box stays `- [ ]`. Ticking it on the half I could see is
exactly the failure mode the brief names, and the line's own wording ("in the deployment") is about the
half I cannot reach.

---

## The deliverables I did close

### The distribution sentence

> **A teacher hears about Planbook from another teacher, types `planbook.hwgteach.com`, and taps Add to
> Home Screen — no store, no download, no account, and nothing to sign into before she marks her first
> class.**

Three supporting paragraphs sit under it in the work order, in the register of the surrounding prose:

- **It ends at the home screen on purpose.** iOS evicts IndexedDB after ~7 days of non-use for
  non-installed sites; a version of this sentence that stops at "types the URL" describes a way to lose
  a term of grades. That is the one clause in it that is load-bearing rather than descriptive.
- **No store is not a concession** — a listing means a native wrapper, a yearly developer account and a
  review queue between a teacher and a Tuesday-morning fix. The URL *is* the channel, which is also
  what keeps "no account, nothing to sign into" true.
- **What it does not cover**, said out loud: it describes a teacher who has already been told about
  Planbook. A stranger *evaluating* it is WO-8.2's demo build and a different sentence.

And one trap recorded rather than fixed: `hwgteach.com` on its own resolves to nothing, so a teacher
who drops the first label lands on an error page and concludes the app does not exist. I named the two
answers (an apex redirect, or the landing page the apex was kept free for) and left the decision to the
owner rather than inventing scope.

### `_headers`

Repo root, Cloudflare Pages syntax: path pattern on its own line, headers indented beneath, `#`
comments. **It pins three paths, not two**, and that is the one substantive judgment call in the file:
the work order names `sw.js` and `index.html`, but a teacher types the bare origin, so the request that
carries the shell arrives at `/` — and a Pages rule written for `/index.html` does not match a request
for `/`. Pinning only the two named paths would have satisfied the work order's words and missed the
request it exists for. I added `/` and explained why both in the file and in the work order.

The comments state the mechanism accurately rather than maximally: browsers now mostly bypass their own
HTTP cache when fetching a service worker script, so the header is the floor under "mostly" rather than
the only thing standing between the teacher and a stale shell. I did not weaken the work order's
"`_headers` is not optional here" — I left that paragraph untouched and added a dated one under it.

### The execution sequence

Nine numbered steps in the WO-8.7 section — **not a new document**, per the brief. The dependencies the
brief named are written as dependencies rather than left implicit: nameservers move (3) before Pages can
attach the custom domain (6), and Google's TXT record has nowhere to live until the same thing is true
(8). Two things in it are mine rather than the work order's, and I flag them as judgment:

- **Step 1 and 2 exist because of a trap the work order does not carry.** Moving nameservers with an
  incomplete Cloudflare import silently breaks the domain's mail — MX and mail-authentication TXT
  records — and nothing announces it. Photographing the GoDaddy zone first and reconciling the import
  before the switch is two minutes that prevent a failure whose symptom appears days later.
- **Step 5 checks the deploy at its `*.pages.dev` URL before the custom domain is attached**, which is
  what tells a DNS problem from an app problem an hour later. It carries a warning not to type real
  class data at that origin: different origin, different IndexedDB, and a second place a teacher's
  grades live.

---

## Verification — both commands, run to completion, output quoted

**`node tools/verify-shell.mjs`** — it launched a browser here without trouble. Backgrounded, waited
for exit, exit code **0**:

```
================ SUMMARY ================
628 checks · 628 passed · 0 failed · 0 skipped
15,480 lines · 24.6 lines per check · 200s
```

628 executed against the 629 call sites `tools/README.md` records, which is the gap that file already
explains. Nothing I changed is app code, so this run says the tree is unbroken rather than that it
tested anything of mine.

**`node tools/wo-sweep.mjs`** — exit **0**:

```
17 checks · 15 passed · 0 failed · 2 to review
```

The two `REVIEW`s are the standing ones (`sensitive field names outside src/backup.js`, 188 mentions;
`due-date and late/missing on the same line` at `src/detail.js:349`). Both are in `src/` files I did not
touch, so they are pre-existing and neither is mine to resolve.

**`node tools/wo-gate.mjs --audit`** — run because I edited a tracker file. `PASS | every fragment
matches exactly one roadmap box, every **Owes** pointer lands on an open box, and every dashboard row
matches its own boxes.`

**`node tools/wo-gate.mjs WO-8.7`** — `PASS | gates clear`, and its git block lists `?? _headers`, which
answers the brief's question directly: **the gate sees the new root file.** The sweep is a different
answer — see below.

### The one thing the sweep is blind to, reported rather than fixed

`wo-sweep.mjs` **walks** `_headers` (it is not in `IGNORE_DIRS`) but **no check reads it**: `isCode` is
`^(index\.html|sw\.js|manifest\.webmanifest|src/)` and `STYLE` is `.css|.html`, so a root file with no
extension falls outside every check in the file. The green run above says nothing whatever about
`_headers`. I did not add a check, on the brief's "this is the whole of it" — see the declined
temptations below — but the shape of the one that should exist is in the follow-up section.

### What no harness here can check at all

`_headers` is a claim about a server that does not exist yet. Neither harness opens a network
connection to a host, and no fixture can express "Cloudflare Pages parsed this file and sent this
header." That is why step 5 and step 7 both read the header off the wire in DevTools rather than off
the file, and why the work order now says the file "is a claim until the first deploy answers it."

---

## Decisions the work order did not settle, and which way I went

1. **Three paths in `_headers`, not two.** Reasoning above. The alternative — following the work
   order's two names literally — leaves the most common request in the app unpinned.
2. **`#` comments in `_headers`.** Cloudflare Pages and Netlify both document `#` as a comment line, and
   the repo's whole idiom is that a file explains itself. I am confident in the syntax from knowledge,
   not from a deploy; if the first deploy reports a parse warning, the comment block is the first thing
   to suspect and deleting it costs nothing.
3. **`1. [ ]` for the execution steps rather than `- [ ]`.** "Ordered and checkable" wants both a
   sequence and a tick. `wo-gate.mjs`'s Acceptance parser requires a leading `-`, so the numbered form
   is invisible to it — and the steps sit *above* the `**Acceptance**` heading anyway, which is where
   that parser starts. Both belts are deliberate: nothing I added can be mistaken for an Acceptance box.
4. **I amended one sentence of the 2026-08-12 status note.** It read *"Only the distribution sentence is
   still open"*, which my own work made false. I changed that clause and nothing else, keeping both
   load-bearing halves verbatim in substance — the decisions are unexecuted, and the work order stays
   `⬜ NOT STARTED` until the URL resolves in a browser. The three arguments the brief protects (apex,
   Pages-over-GoDaddy, request logs) are untouched; I added beside them and rewrote none of them.
5. **I left the `**Status**` field at `🤖 CLAIMED — 2026-08-12`.** It is not in my scope list, and the
   correct successor is a judgment for the orchestrator: `--tick` would write `🔨 IN PROGRESS` over the
   still-open lines, which is arguably the true state now (part-built, nobody in flight), but it would
   also tick the roadmap box *"Name and distribution channel decided."*, and this section says in its own
   words that the work order stays `⬜ NOT STARTED` until the URL resolves. **Do not run `--tick` on the
   strength of this report.** `--release` back to `⬜ NOT STARTED` is the reading that matches the
   section's own prose.

## Temptations declined, recorded because they will recur

- **A `wo-sweep.mjs` check for `_headers`.** The obvious one: fail if the file is missing, or if either
  `/sw.js` or the shell document is not pinned to `no-cache`. I did not add it — section 2b of the brief
  is an exhaustive list and this is not on it, and an 18th check also makes `tools/README.md`'s
  "**17 checks** since WO-2.22" stale, which is a second file and a second decision. **Proposed as a
  follow-up work order**, and worth it: `_headers` is one deletion away from silently reverting the
  entire `CACHE`-bump discipline, and today literally nothing in this repo would notice.
- **A `docs/deploy.md`.** The brief pre-empted this and it was tempting once the sequence reached nine
  steps. Declined; the sequence lives in the work order section, which is what `08bd5b9` established.
  If a second app ever deploys to this domain, that is the moment to lift it out.
- **Adding `https://planbook.hwgteach.com` to the OAuth client's authorized origins.** Named at the foot
  of the sequence as WO-3.18's, not done, not planned here.
- **Pinning `manifest.webmanifest` in `_headers`.** Two files are named in the work order; a manifest is
  in `SHELL` and answered from Cache Storage. Left alone rather than grown.

## Changelog entry — draft only, not written

`CHANGELOG.md` is untouched; the teacher decides what a change means. A draft for the *Added* section
if it is wanted:

> **WO-8.7 — the distribution sentence, and the file that keeps a deploy from being invisible.** How a
> teacher gets Planbook is now written down in one sentence: she hears about it from another teacher,
> types `planbook.hwgteach.com`, and taps Add to Home Screen. No store, no download, no account. The
> sentence ends at the home screen rather than at the first page load on purpose — iOS evicts a
> non-installed site's storage after about a week, so installing is what makes the app safe to keep a
> term of grades in. A root-level `_headers` file pins the service worker and the shell document to
> `no-cache`, without which the hand-bumped cache version buys nothing and a teacher opens last week's
> app after every deploy. The nine steps that stand this up — nameservers, Pages project, custom domain,
> Google verification — are ordered in the work order; none of them have been run, and the URL does not
> resolve yet.

## What is left for the teacher, in one list

Steps 1–9 of the sequence in the WO-8.7 section. Acceptance lines **2**, **3** and the deployment half
of **4** close there and nowhere else. Line 1 is closed and evidenced.
