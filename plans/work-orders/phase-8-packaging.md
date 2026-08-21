# Phase 8 work orders — 1.0 packaging

**Phase goal:** something a stranger can find, evaluate, install, and trust.

The 1.0.0 call itself is [WO-G4](gates.md#wo-g4--the-100-call).

---

## WO-8.1 — `TESTING.md` complete and passing

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** every phase
**Closes roadmap** Phase 8 → "`TESTING.md` complete and fully passing."

**Why it exists.** This is the regression gate. **There is no automated suite and that is a
decision, not an omission** — which puts all the weight on this checklist being real.

**Deliverables**
- Every work order's acceptance lines present in `TESTING.md`, organized by surface rather than by
  phase, since that's how you actually walk an app.
- A full pass on desktop **and on a real iPad**, results dated.
- Gaps found during the pass either fixed or written into `README.md`'s known limitations — never
  quietly ticked.

**Acceptance**
- [ ] Every acceptance line from WO-1.1 through WO-7.3 appears in `TESTING.md`.
- [ ] A complete pass is recorded with a date, a browser version, and an iPadOS version.
- [ ] Nothing is ticked that was written but not run. *(The one rule the whole protocol rests on.)*

---

## WO-8.2 — Demo build

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-8.1
**Closes roadmap** Phase 8 → "Demo build with a fake in-memory dataset, no account."

**Why it exists.** A stranger evaluating a gradebook will not type in a roster to find out whether
they like it. The demo is the top of the adoption funnel, and it doubles as a headless test surface.

**Reference:** Roll Call!'s `tools/build-demo.mjs` — clone the pattern, where **the engine's
*presence* is the switch** rather than a runtime flag that can leak into production.

**Deliverables**
- `tools/build-demo.mjs`, bare Node, no dependencies.
- A fake dataset with enough shape to exercise the interesting cases: an empty category, a
  turnaround student, a quiet-middle student, a dropped day, an untaken day, a student with
  accommodations.
- In-memory only. The demo writes nothing to IndexedDB and cannot be confused for real data.
- Sync and outreach disabled or clearly simulated in demo mode.

**Acceptance**
- [ ] The demo runs with no account, no sign-in, and no permissions.
- [ ] Closing and reopening the demo resets it — nothing persisted.
- [ ] The production build contains no demo dataset and no demo switch.
- [ ] The demo surfaces at least one concern signal and one praise signal on load.
- [ ] Demo accommodation data is obviously fictional.

---

## WO-8.3 — Accessibility pass

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-8.2
**Closes roadmap** Phase 8 → "Accessibility pass: screen reader (NVDA/VoiceOver), keyboard-only,
contrast." *(the parenthetical was missing from the fragment until 2026-08-08, WO-2.15, so it
matched zero boxes — the same rot, and the same shape, as WO-2.5's)*

**Why it exists.** *Roll Call!'s headless run found 66 unlabelled buttons in an area already ticked
done.* **Run the pass, don't assert it.**

**Deliverables**
- Screen reader pass with NVDA and VoiceOver across every screen.
- Keyboard-only pass: every action reachable, focus never lost, focus always visible.
- Contrast check against the palette in `design/style-guide.md`, including the wash-background
  chips and the on-dark secondary text.
- A headless audit run over the demo build, since the demo has data to render.
- Fixes, then a re-run. The re-run is the deliverable, not the first run.

**Acceptance**
- [ ] Zero unlabelled interactive controls across the app, verified by an automated sweep over the
      demo — not by inspection.
- [ ] Every icon-only button has `aria-label` and `title`; every toggle has `aria-pressed`.
- [ ] The whole app is operable keyboard-only, including attendance marking and score entry.
- [ ] Save failures and offline states announce through the `aria-live` region.
- [ ] No contrast failure at AA on any text.

---

## WO-8.4 — Print stylesheets

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-2.6, WO-3.9
**Closes roadmap** Phase 8 → "Print stylesheets for every printable surface."

*(**This read `**Ship** 2` for one commit on 2026-08-19 and was corrected the same day** — WO-1.24,
`d4eeafb`, and its own § Correction. The argument for moving it was that its fourth Acceptance box and
[WO-G2](gates.md#wo-g2--ship-2-gate-first-grades)'s fifth are the same check, so landing this after the
first hand re-key of five classes would cost a second one. **The check was already closed.**
[WO-3.9](phase-3-gradebook.md#wo-39--grades-print--csv) is where the SIS ordering was decided — the
owner answered it on 2026-08-12, it is recorded in that work order so a verifier need not trust the
builder's memory, and on 2026-08-13 the owner printed the sheet and confirmed it against the live SIS.
**Nothing here reorders anything**; the deliverables below are chrome, a header, a modal gate and a
presentation-mode rule. There was no second re-key to buy back.)*

*(**And it cannot close yet, which the move would have made a landed debt.** The first deliverable
names four print surfaces and* **calendar month is not built** *—* [WO-6.3](phase-6-calendar-glance.md)
*is `⬜ NOT STARTED` and `src/calendar.js` is the event model only, no DOM.* **This is not written
as a dependency and should not become one** *— WO-6.3 gates one surface of four, and a `Depends on`
token would hold the whole work order behind Phase 6. A `**Waits on**` field was tried here and taken
back out: `wo-gate.mjs` reported it as a header field nothing reads, and teaching the tracker a fourth
kind of wait is its own work order rather than a line in a correction.*
**Three of the four already have `@media print` blocks** — `src/attendance.css`, `src/detail.css`,
`src/scores.css`, plus one in `src/assignments.css` — because print accreted per work order and
[WO-2.25](phase-2-attendance.md#wo-225--the-print-gate-is-answered-when-it-is-read-on-every-surface)
centralised the mechanism in `src/print-gate.js`. What is genuinely undone is `#printHeader`, which
`grep` finds nowhere outside comments, the calendar surface, and the sweep itself.)*

**Deliverables**
- `@media print` on every printable surface: gradebook, attendance record, student detail,
  calendar month.
- App chrome hidden; the hidden `#printHeader` becomes visible to title the printout.
- `body[data-modal-print]` to print a single modal, per the style guide.
- **Presentation-mode rules apply to print unconditionally** — a printout left on a desk is the same
  disclosure as a projected screen, and there is no toggle to remember.

**Acceptance**
- [ ] Each printable surface produces a clean page with a title, class, term, and date.
- [ ] No app chrome, navigation, or button appears in any printout.
- [ ] No printout contains accommodation, medical, or plan data, regardless of presentation-mode
      state.
- [ ] The gradebook printout is ordered to match the SIS entry screen (WO-3.9).

---

## WO-8.5 — README, FERPA, and known limitations

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-8.1
**Closes roadmap** Phase 8 → "`README.md` with a Known limitations section"

*(**`docs/FERPA.md` came out of this work order on 2026-08-20**, owner-directed, into
[WO-8.12](#wo-812--the-privacy-policy-and-the-ferpa-document) — along with the roadmap box that names
it, the data-flow statement, and the accommodation clause. **Size dropped M → S** with them.
[WO-3.18](phase-3-gradebook.md#wo-318--verification-submitted-)'s first deliverable is a **published
privacy policy**, and its own body has said since 2026-08-10: **"Write them together or write them
twice."** The policy is unblocked today and this work order depends on WO-8.1, which is Phase 8 and
therefore months out — so leaving FERPA here meant either writing the same facts twice or holding the
policy behind `TESTING.md`. **The split is WO-8.7's shape rather than a new idea:** that work order was
cut out of WO-8.6 for the same reason — one part blocked something five phases away and the rest did
not. What stays here is the **README**, which genuinely does want WO-8.1's finished test pass behind
it, because its first Acceptance line is that every documented feature has been run end-to-end.)*

**Why it exists.** The 1.0 criteria require limitations to be "written down before launch, not
discovered by a user." *(The FERPA half of this paragraph moved to WO-8.12 with the document.)*

**Deliverables**
- `README.md`: what it is, install, first attendance mark, and a **Known limitations** section
  naming the gaps out loud — no SIS integration, no multi-teacher, no translation, `mailto:` cannot
  confirm delivery, sync is foreground-only, whatever WO-2.7 shipped without.
- **A link to `docs/FERPA.md` and to the published privacy policy, and no restatement of either.**
  Two documents that paraphrase each other drift, and the one a principal reads is whichever they
  found first.
- **The licence named, and the copyright line that goes with it.** `LICENSE.md` — Apache 2.0 — has
  been in the tree since 2026-08-21 and **nothing outside it says so to a stranger**: `privacy.html`
  and `docs/FERPA.md` name it in a footnote about the source being public, which is a privacy
  argument rather than a licence statement. The README is the file a person who might fork this
  actually opens. Name the licence, link the file, and carry the copyright holder — **copying the
  line already in `LICENSE.md`, never composing a second one.** That appendix ships with
  `[yyyy] [name of copyright owner]` unfilled and was filled on 2026-08-21; a README that words the
  holder differently is the second truth this directory spends most of its rules avoiding.

**Acceptance**
- [ ] Every README feature has been run end-to-end against real data. *A documented feature that
      fails on a teacher's first day loses that teacher permanently.*
- [ ] Known limitations names at least every gap listed above.
- [x] `FERPA.md` has a section on accommodation and medical data, and one on backups.
      *(Paid by [WO-8.12](#wo-812--the-privacy-policy-and-the-ferpa-document) on 2026-08-20, which is
      what the `→` marker on this line and the **Owes** field on the header above were for. Both are
      gone now: `--audit` names a debt whose box has closed, and this is that, settled the way it
      says to.)*
- [ ] `README.md` names the licence, links `LICENSE.md`, and carries the copyright line **as
      `LICENSE.md` words it** — read it, do not retype it from memory.
- [ ] `README.md` is readable by a principal, not only by a developer.

---

## WO-8.6 — Onboarding

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-8.5, WO-8.7
**Closes roadmap** Phase 8 → "Onboarding: install → marking attendance with no documentation."

**Narrowed on 2026-08-10.** This carried the name and the distribution channel until then, and its own
note said why that was wrong: *"If sync is wanted before 1.0, the naming decision is on Phase 3's
critical path, not Phase 8's."* It was right, and the file went on holding the decision in Phase 8
anyway. **Both decisions moved to WO-8.7**, which is scheduled early. What is left here is a build,
and it belongs where it sits.

**Why it exists.** *Roll Call! sat at 0.9.0-beta with every engineering blocker closed, held up by
exactly this. It isn't an engineering task and it doesn't resolve itself.* Naming it as a work order
with acceptance criteria is the only defense.

**Deliverables**
- Onboarding path: install → create a class → paste a roster → mark attendance, with no
  documentation and no warning screen.
- A first-run flow that gets a teacher to their first attendance mark, following Roll Call!'s
  setup-flow skeleton.

**Acceptance**
- [ ] A teacher who has never seen the app installs it and marks attendance for a real class without
      asking a question. Test on an actual person, not a thought experiment.
- [ ] No step in that path requires reading documentation.
- [ ] The name WO-8.7 settled is used consistently in the manifest, the README and the consent screen
      — one name, checked in all three rather than assumed from one.

---

## WO-8.7 — the name and the host, decided

**Ship** — · **Status** ✅ DONE — 2026-08-12 · **Size** S · **Depends on** nothing but a decision
**Blocks** WO-3.18 — there is no domain to verify until this is answered
**Closes roadmap** Phase 8 → "Name and distribution channel decided."

**Split out of WO-8.6 on 2026-08-10**, because it is the only part of it that blocks anything, and it
was blocking from five phases away. WO-3.18 cannot start without a domain; a domain cannot exist
without a host and a name. **This is the critical path for sync ever reaching another teacher**, and
until 2026-08-10 it was an unnumbered bullet inside a Phase 8 work order that depended on a Phase 8
work order.

**Why it is an S and still hard.** Nothing here takes a day to *do* — a host is chosen in an hour and
a domain is bought in ten minutes. It is hard because it is irreversible in the way names are: the
name goes in the manifest, the README, the consent screen a teacher reads before trusting the app, and
the URL she types. **Changing it later means re-verifying with Google**, because the verified domain is
part of what was verified. Decide it once, deliberately, rather than defaulting into it.

**What the host has to be, and it is a short list.** The app is static files and a service worker.
- **HTTPS**, non-negotiable — a service worker will not register without it, and no service worker
  means no offline and no install, which is the eviction protection the whole data-safety argument
  rests on.
- **A custom domain that can be verified** in the Google Cloud console.
- **Nothing else.** No Node, no runtime, no database. Anything more is a backend by another name, and
  `CLAUDE.md` rules on that: it "turns us into a FERPA data processor with breach liability."

**The FERPA property that makes this decision cheap, and that must not be given away.** A static host
serves the app and **never receives student data** — grades, rosters and accommodations live in
IndexedDB in the teacher's own browser, and there is no endpoint to send them to. So the hosting
choice carries no student-data exposure and can be made on price and reliability alone. **That is true
only while it stays static.** The moment anything here grows a server-side component, the choice stops
being neutral and the position that sells this app to a principal is gone.

**Deliverables**
- **The name.** Decided, not shortlisted, and written into this work order.
- **The host.** Decided, and why — price, reliability, custom domain support.
- **The domain**, registered and resolving.
- **The distribution story in a sentence**: how a teacher finds it and what she types.

**The name, the host and the origin, decided — 2026-08-12.** *Three of the four deliverables. The
fourth — the distribution sentence — was written the same day and is below. The decisions here are
still unexecuted: nothing is standing up at that URL yet, and this work order stays `⬜ NOT STARTED`
until it resolves in a browser.*

| | |
|---|---|
| **Name** | **Planbook** — one name, unchanged from the repo |
| **Host** | **Cloudflare Pages**, static assets only, **no `functions/` directory** |
| **Origin** | **`https://planbook.hwgteach.com/`** — its own subdomain |
| **Domain** | **`hwgteach.com`**, registered at **Cloudflare Registrar** |
| **DNS** | Cloudflare, on the registrar's own nameservers — nothing to migrate |

**Why a subdomain and not the apex, which is the part that is expensive to undo.** `hwgteach.com` is a
domain meant to carry more than one thing — Roll Call! is the obvious second. **IndexedDB and service
worker scope are per-origin**, so two apps sharing an origin share a storage namespace and a registration
scope, and this app keeps a year of grades in IndexedDB. A subdomain gives Planbook its own origin, its
own storage, its own install and its own service worker at `/`, and leaves the apex free for a landing
page. A path (`hwgteach.com/planbook/`) would have been the worst of the three: shared storage *and* a
scope-confined service worker whose `start_url` and `scope` must both be pinned to the subpath.

**Verification is unaffected by the choice** — verifying `hwgteach.com` covers its subdomains, which is
what WO-3.18 consumes.

**The name is `Planbook` and the domain does not say so, on purpose.** The consent screen will read
"Planbook" while the URL reads `planbook.hwgteach.com`. That is a small trust cost on the one screen this
architecture exists to keep clean, accepted deliberately: the alternative was renaming an app already
written into `CLAUDE.md`, the docs, the repo and every work order, to chase a domain. **One name, in the
manifest, the README and the consent screen** — WO-8.6's third Acceptance line checks all three rather
than assuming from one.

**Why Pages, and it is not price.** Acceptance line 4 asks that nothing in the deployment runs
server-side code **as a checked fact**. On a platform that has a runtime sitting there unused — GoDaddy's
shared Apache/PHP hosting, **which was genuinely on the table and was rejected for this**: the owner
already pays for it to carry unrelated projects, so putting Planbook there would have cost nothing extra
— the honest claim is "we do not currently run any," which is a promise about behaviour. On Pages with no `functions/` directory there is
nowhere for it to run: crossing the line means adding a directory, which is a tripwire rather than a
memory. Same deployment today, a stronger sentence to say to a principal. The rest is ordinary: free at
this scale, custom domain with automatic HTTPS (**required** — no HTTPS, no service worker, no install,
no eviction protection), and `_headers` control.

**`_headers` is not optional here.** `sw.js` and `index.html` must be served `Cache-Control: no-cache`,
or a teacher sits on a stale shell after a deploy and the `CACHE` bump this repo is disciplined about
buys nothing. This is also what rules out GitHub Pages, which is otherwise a fair fit: free, custom
domain, HTTPS, and no way to set a response header.

**Written — 2026-08-12.** `_headers` sits at the repository root, which is also the Pages output
directory (step 1 below), because with no build there is nowhere else for it to be. It pins **three**
paths rather than the two named above, and the third is the one a teacher actually requests: she types
the bare origin, so the document that carries the shell arrives at `/`, and a rule written for
`/index.html` does not match it. The file itself is consumed by Pages and never served. **It is a claim
until the first deploy answers it** — nothing in this repository can test a header no server has sent
yet, so step 2 reads both off the wire rather than off the file.

**The apex trap, recorded because it does not apply here rather than because it was dodged.** Pages wants
a CNAME, and an apex CNAME needs the flattening/ALIAS support a good many registrars' DNS has never
offered — the usual reason a project like this ends up on a subdomain whether it wanted one or not.
**Cloudflare flattens at the apex**, and `hwgteach.com` is registered there with the zone already on
Cloudflare's own nameservers, so the constraint is simply absent. **That takes nothing away from the
subdomain decision**, which was never made on DNS: it rests on per-origin IndexedDB and service worker
scope, above, and would hold unchanged on a registrar that served an apex CNAME perfectly. Recorded so
that nobody later reads the subdomain as a workaround for a limitation that is not there and "fixes" it
back onto the apex. The zone being native also means the TXT record for Google's domain verification has
somewhere to live from the start, which is what WO-3.18 consumes.

**Registrar and host are the same company, and that is the tradeoff to say out loud.** Cloudflare
Registrar sells at cost — no markup, no cheap-first-year-then-spike — and Cloudflare also runs the DNS
and serves the files, so one account holds the name, the zone and the deployment. Fewer moving parts and
one less credential to lose, at the price of a single vendor whose loss takes all three at once.
**The mitigation is already in this repository rather than in a contingency plan**: the app is static
files in Git and the year document lives in the teacher's own browser, so changing hosts is a redeploy
and changing DNS is a nameserver edit. Nothing student-facing is held at Cloudflare to be stranded —
the same property that made the hosting choice cheap two paragraphs up.

**One thing to say plainly rather than let a district IT person find.** Cloudflare serves the files and
therefore sees request logs — IP, timestamp — like any host. That is not student data, and there is no
endpoint to send student data to, so the claim above holds. But the honest sentence is "they serve the
files and see who fetched them," not "they see nothing." *(And an outage means the app will not **load** —
an installed PWA still runs from its own service worker cache, so a teacher mid-lesson is unaffected.
That is what makes this decision genuinely low-stakes, and it is why the work order says to choose on
price and reliability alone.)*

**The distribution story, in a sentence — 2026-08-12.** *The fourth deliverable, and the last one that
was open.*

> **A teacher hears about Planbook from another teacher, types `planbook.hwgteach.com`, and taps Add to
> Home Screen — no store, no download, no account, and nothing to sign into before she marks her first
> class.**

**The sentence ends at the home screen and not at the first page load, which is the whole reason it is
worth writing down.** iOS evicts IndexedDB after about seven days of non-use for sites that are not
installed, and installed PWAs are exempt — so a teacher who bookmarks Planbook can come back from a
holiday to an empty gradebook. Add to Home Screen is therefore not the polish at the end of the
distribution story, it is the step that makes the app safe to keep a term of grades in, and a version of
this sentence that stops at *"types the URL"* is describing a way to lose them. On the laptop the same
step is the browser's own install; on the iPad it is Share → Add to Home Screen, and that is the one to
say out loud, because it is the device a teacher will guess wrong about.

**No store, and that is not a concession.** A store listing means a native wrapper, a developer account
billed yearly, and a review queue standing between a teacher and a fix on a Tuesday morning. This app is
static files over HTTPS, so **the URL is the distribution channel** — which is also what keeps the rest
of the sentence true: nothing to download means nothing to consent to, and the app runs fully signed-out
by rule, so there is no account gate in front of the first attendance mark.

**What the sentence deliberately does not cover.** It describes a teacher who has already been told
about Planbook by someone she trusts. Nothing here helps a stranger *evaluate* it, and that is
**WO-8.2's demo build** — the top of the adoption funnel is a different sentence with a different
work order behind it.

**And one trap the sentence walks past, recorded rather than fixed here.** What she types is the whole
subdomain. `hwgteach.com` on its own resolves to nothing until something is put at the apex, so a
teacher who drops the first label — or a colleague who repeats the domain and not the app — lands on an
error page and reasonably concludes the app does not exist. The cheap answer is a redirect from the apex
to `planbook.hwgteach.com`; the better one is the landing page the apex was kept free for. Neither is
this work order's, and both should be decided before the URL is said out loud to a second teacher.

**The order the human steps have to happen in — 2026-08-12, re-cut the same day.** *None of these are an
agent's: they need Cloudflare and Google Cloud credentials that no agent holds, and the three Acceptance
lines below that are still open close on them and on nothing else. Written as a sequence rather than a
list because the dependencies are real — the custom domain has nothing to attach to until a project
exists, and the URL cannot be read in a browser until the certificate issues.*

***Three steps shorter than the first draft, because the registrar is Cloudflare.*** *That draft assumed
the name was registered elsewhere and opened with the standard migration — photograph the old zone,
reconcile Cloudflare's import of it record by record, move the nameservers — including the step where a
missed MX record quietly breaks mail. **The assumption was wrong and none of it applies.** `hwgteach.com`
is registered at Cloudflare, so the zone is native and already Active: nothing migrates, there is no
photograph to reconcile against, and no propagation to wait out. What is left is one sitting where the
only waiting is a certificate. Recorded rather than silently deleted, because the migration is what a
reader will assume was skipped by accident.*

1. [x] **Create the Pages project** against `github.com/wildbil2me/planbook`, production branch `main`.
   Framework preset **None**, build command **empty**, output directory **`/`** — there is no build, so
   the output is the repository as it sits, which is also what puts `_headers` where Pages reads it.
   Attach **no Functions**, and add no `wrangler.toml` and no build command: that is the build system
   this project does not have, and the absence of a `functions/` directory is what makes Acceptance line
   4 a fact rather than a promise. *(Direct Upload — dragging the folder into the dashboard — is the
   alternative if a Git connection is unwanted. Same files either way, and neither adds anything to this
   repository. Note that with `main` as the production branch and work landing straight on it, **every
   push to `main` is a production deploy** — there is no branch to stage on. This sentence read
   "nothing deploys while the work is sitting on a phase branch" until 2026-08-16; phase branches were
   retired the day before by WO-1.19, and the reassurance became its opposite.)*

   > **Set the zone's Browser Cache TTL to "Respect Existing Headers" before trusting step 2.**
   > `hwgteach.com` → Caching → Configuration. A new Cloudflare zone defaults it to four hours and
   > rewrites `Cache-Control` on everything the edge caches, `.js` included — so the first deploy
   > served `/sw.js` as `max-age=14400` with a correct `_headers` in place. **The document escapes
   > it and the worker does not**, because HTML is not edge-cached by default, so `/` reads
   > `no-cache` and the one file the pinning exists for reads four hours. Measured on the wire,
   > 2026-08-12.
   >
   > **The dashboard will try to put you in Workers instead, and it is not obvious — hit 2026-08-12.**
   > Cloudflare now funnels a Git import into **Workers Builds**, which asks for a **deploy command** and
   > prefills **`npx wrangler deploy`**. **That prompt is the tell that you are in the wrong flow**: the
   > Pages path asks for a framework preset, a build command and an output directory, and never for a
   > deploy command. Back out to **Workers & Pages → Create → Pages → Connect to Git**.
   >
   > Running it anyway does not work and would not be wanted if it did. `wrangler deploy` reads a
   > `wrangler.jsonc`/`wrangler.toml` that this repository does not have and must not gain, and `npx`
   > wants an npm this project does not use — `wo-sweep.mjs` asserts *no dependency manifest anywhere* on
   > every run, so the config file that would make the command work is the one the sweep fails on.
   >
   > **If the Pages option is ever missing** — Cloudflare has been retiring Pages Git connections on some
   > accounts — **that is a decision, not a workaround.** Workers with static assets can serve this app,
   > but it arrives with a config file and a deploy command, and the "no `functions/` directory, so there
   > is nowhere for server code to run" argument that makes Acceptance line 4 a checked fact has to be
   > re-made in the Workers vocabulary rather than assumed to carry over. Pages Direct Upload keeps the
   > present reasoning intact at the cost of the Git connection. Take it back to the work order.
2. [x] **Check that first deploy at its `*.pages.dev` URL, before the custom domain is attached.** HTTPS is
   automatic there, so the app, the service worker registration and both `Cache-Control: no-cache`
   headers can be confirmed on an origin that has nothing to do with the domain — which is what will
   tell a DNS problem from an app problem an hour later. **Put no real class data in at that origin**:
   it is a different origin, so it gets its own IndexedDB, and anything typed there is a second place a
   teacher's grades live.
3. [x] **Attach `planbook.hwgteach.com`** in the Pages project → Custom domains. The zone is already at
   Cloudflare, so Pages writes the CNAME itself and there is no record to paste anywhere and no
   nameserver to check first. Wait for the certificate to issue — that is the one genuine wait left in
   this sequence.
4. [x] **Load `https://planbook.hwgteach.com/` and read it, rather than assume it** — this is Acceptance
   line 2. The padlock; the app rendering; the service worker **activated and running** (DevTools →
   Application → Service Workers); `cache-control: no-cache` on the document and on `/sw.js` in the
   Network panel. Then the same URL on the iPad, Share → Add to Home Screen, and a launch from the icon
   with no browser chrome — which is the distribution sentence above, walked end to end.
5. [x] **Verify `hwgteach.com` with Google** — Acceptance line 3, and what WO-3.18 consumes. *(Already
   true on 2026-08-12; nothing was added. The TXT below was on the apex from an earlier property. What
   remains is the account check, on the Acceptance line.)* The
   verification itself happens in **Search Console**, which is where the Cloud console sends you: add
   `hwgteach.com` as a Domain property, take the TXT record it offers, and put it on the apex in
   Cloudflare DNS. Verify the **apex and not the subdomain** — `hwgteach.com` covers everything under
   it, and it is the name that goes in the client's authorized domains.
6. [x] **Write the two dates back into this work order** — the day the URL first resolved and the day the
   domain verified — and tick Acceptance lines 2 and 3 on them, the way WO-3.10 records *(Owner, in the
   console, 2026-08-11)* beside each line it closed.

**What the first deploy broke, and why nothing in this repository could have predicted it — 2026-08-12.**
*The URL resolved, the certificate issued, and the app was broken anyway. Both faults live in the gap
between what this repository contains and what the host does with it, which is the gap no local tool
looks into. `verify-shell.mjs` was 628/628 green through both of them.*

- **The shell was served from a redirect, and Safari refused it.** `sw.js` precached `./index.html`;
  Pages answers that path with a **308 to `/`**; `cache.addAll` follows the redirect and stores a
  response with `redirected` set; serving one of those to a navigation is a spec violation. The page
  loaded once and every load after it failed — *"the response served by the service worker has
  redirections"*. On a home-screen icon that is a white screen where a term of grades used to be.
  Fixed in `8de1ae4`: `SHELL` carries `./` alone, `INDEX` points at it, `CACHE` to v46 so `activate`
  drops the poisoned entry. **An earlier draft of this work order called this redirect "harmless
  either way."** It was not, and the only instrument that could say so was a deployment.
- **`_headers` was correct and did not bind.** A Cloudflare zone defaults **Browser Cache TTL to four
  hours** and rewrites `Cache-Control` on anything the edge caches, `.js` included — so `/sw.js` came
  back `max-age=14400` with the `no-cache` rule in place and spelled right. The document escaped only
  because HTML is not edge-cached, so `/` read correctly and hid it. Fixed in the dashboard, not the
  repository: **Caching → Configuration → Respect Existing Headers**, now step 1's first note.

**The two together are one lesson, and it is the verifier's — restated by events rather than argued.**
It flagged that `_headers` is invisible to both harnesses: `wo-sweep.mjs` gates on
`^(index\.html|sw\.js|manifest\.webmanifest|src/)` and `\.(css|html)$`, and an extensionless root file
matches neither. That was right, and understated. **Neither harness can see the deployment at all** —
not the header a zone setting rewrote, not the redirect a host invented, not a file deleted outright.
The follow-up the verifier proposed (fail the sweep when `_headers` is missing or the shell document is
unpinned) covers the third and none of the first two. **What actually caught these was one HTTP request
against the live origin**, and that is the shape the check wants: read `/`, `/sw.js` and `/index.html`
off the wire after a deploy and assert status, `Cache-Control` and redirect behaviour. Not written here
— it needs its own work order, and it is the first check in this project that would require a network.

**What this hands WO-3.18** is a verified domain, plus a production origin — `https://planbook.hwgteach.com`
— that will need adding to the OAuth client's authorized JavaScript origins beside the
`https://localhost:8443` WO-3.10 recorded. **That addition is WO-3.18's**, not this work order's, and it is
the point at which the token flow stops being pinned to one laptop.

**Acceptance**
- [x] The name is written here, and it is one name rather than a preference between two.
      *(`Planbook`, in the table above, settled by `08bd5b9` on 2026-08-12. There is no shortlist here
      and no alternative named anywhere in this section; `manifest.webmanifest` already reads
      `"name": "Planbook"` and `"short_name": "Planbook"`. Checked 2026-08-12. The manifest / README /
      consent-screen consistency check is **WO-8.6's** third line and is not this one's.)*
- [x] The URL resolves over HTTPS and serves the app, with the service worker registering — checked
      in a browser, not assumed from the host's marketing. *(Owner, in a browser and on the iPad,
      **2026-08-12** — the day the URL first resolved. `https://planbook.hwgteach.com/` returns 200
      with the real shell, `cache-control: no-cache` on the document and on `/sw.js`, both read off
      the wire rather than off `_headers`. **It did not pass on the first attempt** and the second
      Acceptance line in this repository that a green harness could not have closed is why — see
      "What the first deploy broke" above.)*
- [x] The domain is verified in the Cloud console, which is what WO-3.18 consumes.
      **Verified already, and by nobody in this work order — 2026-08-12.** Search Console reports the
      owner as a verified owner of `hwgteach.com` with no action taken, because a
      `google-site-verification` TXT was already on the apex, left over from an earlier property on
      this domain (`edhsets`). Confirmed live from a public resolver rather than from the console's
      say-so: `google-site-verification=J2HPTTQjdrkn3g5CScSsmABZYvF9dd6SlWnM9W1KTPE`. **Leave that
      record alone** — Google re-checks and silently unverifies if it disappears, which would break
      sync months later with no visible cause.
      **The box stays open on one thing: which Google account.** Verification is per-account, and
      WO-3.10 recorded the client id without recording the account that owns its Cloud project. If
      the verified account and the project account differ, Search Console goes on saying "verified
      owner" while the Cloud console refuses the domain — a failure that surfaces in WO-3.18 rather
      than here. **Confirmed by the owner 2026-08-12: the two match**, and the account is now named
      beside the client id in WO-3.10 — described rather than spelled out, because this repository is
      public. It is the personal Gmail rather than the school Workspace account, which is also the
      right one to hold it: a school account ends with the job and takes the project and this
      verification with it.
- [x] Nothing in the deployment runs server-side code. Stated as a checked fact, because this is the
      line the architecture cannot cross without a decision nobody has made.
      **The repository half is checked, 2026-08-12**: no `functions/` directory, no `_worker.js`, no
      `_routes.json`, no `package.json`, no `wrangler.toml`, nothing server-side anywhere in the tree — what deploys is `index.html`, `src/`,
      `sw.js`, the static assets and `_headers`, and `tools/*.mjs` is run by hand and invoked by no
      deploy, no server and no page load (`tools/README.md` § The rule). `wo-sweep.mjs`'s
      *no dependency manifest anywhere* check asserts part of that half on every run.
      **`_worker.js` was missing from this list until 2026-08-12 and is the one that mattered most.**
      A `functions/` directory is a visible thing somebody adds on purpose; `_worker.js` is a *single
      file* at the output root that converts a Pages project into a Worker wholesale, and it needs no
      directory, no config and no build. The tripwire this line describes had a hole exactly the width
      of one file. `_routes.json` is listed for the same reason — it exists only to steer requests at
      a worker that should not be there.
      **The deployment half is checked too, by the owner in the dashboard, 2026-08-12.** The build log
      reports no functions directory and skips the step; the deployment's Functions tab shows the
      onboarding copy rather than a script, and Bindings shows the same — no KV, D1, R2, Durable
      Object, Queue, Service or AI binding exists to be reached. Both halves are now true, which is
      what this box was waiting for.
      **One thing on that screen reads worse than it is, and is recorded so nobody re-opens it in
      alarm.** The Functions tab lists an *Invocation route* of
      `{"include": ["/*"], "exclude": [], "description": "Catch-all rule generated by Pages CI"}`,
      which looks like a server-side handler mounted on every path. It is not. Pages CI writes that
      default whether or not a script exists, and **a route with nothing at the end of it invokes
      nothing** — the panels directly above it are the evidence, and so is the repository. What the
      catch-all actually means is that the tripwire is *tighter* than this work order claimed: the day
      a `functions/` directory or a `_worker.js` appears, it is live on `/*` immediately, with no
      routing step to forget. Adding the file is still the deliberate act. Nothing is armed by
      accident, and nothing is one config change away from being armed either.

---

## WO-8.8 — read the deployment, not the repository

**Ship** 2 · **Status** ✅ DONE — 2026-08-12 · **Size** S · **Depends on** WO-8.7
**Closes roadmap** Phase 8 → *(no box. Tooling, not app — the same call as WO-2.19 through WO-2.22.
Booked 2026-08-12, out of WO-8.7's deployment.)*

**Why it exists.** WO-8.7's first deploy shipped two faults, and **every check in this repository was
green through both of them.** `verify-shell.mjs` ran 628 of 628 with zero skips before the deploy and
628 of 628 after the fix — the same number, because it never had anything to say about either one.

- **The shell was served from a redirect** the host invented. `sw.js` precached `/index.html`;
  Cloudflare Pages answers that path with a 308; the cached copy carried the redirect and Safari
  refused to serve it to a navigation. The app loaded once and then would not load again (WO-1.14).
- **`_headers` was correct and did not bind.** The Cloudflare zone's own four-hour browser cache TTL
  rewrote `Cache-Control` on `/sw.js`, so the one file the pinning exists for was served
  `max-age=14400`. The shell document escaped only because HTML is not edge-cached — which is
  precisely why it looked fine.

**Neither fact exists in this repository.** One is the host's routing, one is a dashboard setting in
someone's Cloudflare account. No amount of reading files finds either. **What found both was a single
HTTP request against the live origin**, run by hand during a support conversation, and that is the
instrument this project does not have.

**The verifier saw the edge of this and understated it.** Its WO-8.7 finding was that `_headers` is
invisible to the sweep — `wo-sweep.mjs` gates on `^(index\.html|sw\.js|manifest\.webmanifest|src/)`
and `\.(css|html)$`, and an extensionless root file matches neither, so deleting `_headers` outright
leaves every tool green. True, and the smaller half. **The whole finding is that the deployment is
invisible**, and a check that only asserts `_headers` exists would have passed both of the faults
above: the file was present, correct, and overridden.

**What this is not.** Not a monitor, not an uptime check, not a thing that runs on a schedule or in
CI. `plans/verification-tooling.md` § The boundary is explicit — *"It gates nothing. No git hook, no
CI, no commit check"* — and that rule holds here without amendment. This is a script the owner runs
by hand after a deploy, the way `verify-shell.mjs` is run by hand before one.

**Deliverables**
- **`tools/verify-deploy.mjs`**, bare Node, no dependencies, one file. It takes an origin (defaulting
  to the production one) and reports on what came back.
- **The checks the two faults would have failed**, at minimum:
  - `/` returns 200, is HTML, and carries `Cache-Control: no-cache`.
  - `/sw.js` returns 200, is JavaScript, and carries `Cache-Control: no-cache` — **the check that
    catches a zone setting silently overriding `_headers`.**
  - **Every path in `sw.js`'s `SHELL` list resolves without a redirect.** Read the list out of the
    deployed `sw.js` rather than the local one, and follow nothing: a 3xx on any entry is a failure,
    because that is the WO-1.14 defect in its general form rather than the one instance of it.
  - The deployed `sw.js`'s `CACHE` string matches the working tree's, so "I forgot to push" and "the
    deploy failed" stop looking like "the fix didn't work".
  - No `_worker.js`, no `_routes.json` and no `/functions/` path answers as a script.
- **It says what it read.** Status, `Cache-Control` and redirect chain per path, printed — so a run
  is evidence a human can check rather than a row of green ticks.

**Out of scope** — anything that runs unattended; anything that writes; a second browser harness
(this is `fetch`, not CDP); checking the app's *behaviour* at the origin, which is `TESTING.md`'s and
a real device's job. Do not extend `verify-shell.mjs`: that file boots a browser and is already the
largest thing in `tools/`, and these are header and status assertions that need neither.

**The one genuine departure, and it needs saying out loud.** **This is the first check in this project
that requires a network.** Everything in `tools/` today runs against files on disk or a browser
pointed at `localhost`, which is why it all works on a plane. This one is useless offline and will
fail confusingly on a bad hotel connection. That cost is accepted because the alternative is what
already happened: a class of defect that only production can express, found by a teacher. **It must
fail loudly and unmistakably as "could not reach the origin" rather than as a red check** — a network
error reported as a failed assertion is worse than no check, and `verification-tooling.md`'s
precondition rule is the same argument in a different accent.

**Acceptance**
- [x] Running it against the live origin today passes on every check. *(2026-08-12,
      `https://planbook.hwgteach.com` — `12 checks · 12 passed · 0 failed`, exit 0. `/` and `/sw.js`
      both `no-cache` off the wire, 42 SHELL entries read out of the **deployed** worker and all 200
      with no 3xx, `CACHE` `planbook-shell-v46` on both sides. Printed run in `TESTING.md` § WO-8.8.)*
- [x] **Each check is proved by the defect it is named for.** Point it at a URL that redirects and the
      redirect check goes red; construct a response with a wrong `Cache-Control` and that check goes
      red. Per `verification-tooling.md`'s precondition rule, a check that could not have caught the
      thing it exists for is not evidence — and both of this work order's motivating faults are still
      reproducible, which is a luxury most checks do not get.
      *(Thirteen fixture runs against a throwaway origin, tabulated in `TESTING.md` § WO-8.8. Both
      motivating faults reproduced: `max-age=14400` on `/sw.js` turns 1 red, a `SHELL` carrying
      `./index.html` against a host that 308s it turns 2 red. All twelve checks have been watched
      failing, and the control fixture is green at 12 of 12.)*
- [x] An unreachable origin reports as unreachable, distinctly from any check failing. *(Four shapes,
      each exit **2** under `COULD NOT REACH THE ORIGIN` with no check added and no summary printed:
      `ECONNREFUSED`, `ENOTFOUND`, `UND_ERR_CONNECT_TIMEOUT`, and the fixture killed mid-walk —
      *"nothing was asserted after 7 check(s)"*, seven passes standing, nothing below turned red.)*
- [x] It gates nothing: no hook, no CI, not referenced by any other script, and the app still ships
      without it. *(`grep -rn "verify-deploy"` returns the file, its row and section in
      `tools/README.md`, `TESTING.md`, this work order and the dispatch brief — no script, no
      workflow. No `.github/`, and `.git/hooks` holds only git's samples.)*
- [x] `tools/README.md` gains its section, including **when to run it** — after a deploy, and after
      any change to `_headers`, `sw.js`'s `SHELL` list, or the Cloudflare zone's caching settings.
      *(§ "`verify-deploy.mjs` — the only check here that reads the deployment", plus the table row.
      The when-to-run sentence is its second paragraph, and names all three inputs.)*

**Traps** — **Do not read `SHELL` from the local `sw.js`.** The whole point is to compare what is
deployed against what is intended; sourcing both sides from the working tree checks nothing and will
pass forever. **Do not follow redirects** — `fetch` does by default, and a followed 308 looks exactly
like a 200, which is how the original defect stayed invisible. **Do not add a retry loop.** A flaky
result is information; a retry that hides it turns this into the confident pass over nothing that
`plans/dispatch-retro.md` keeps naming as worse than no check at all.

---

## WO-8.9 — the sweep cannot see `_headers`

**Ship** 2 · **Status** ✅ DONE — 2026-08-15 · **Size** S · **Depends on** —
**Closes roadmap** Phase 8 → *(no box. Tooling, not app — the same call as WO-2.19 through WO-2.22
and WO-8.8. Booked 2026-08-12, out of WO-8.8's follow-ups.)*

**Why it exists.** `_headers` can be deleted from this repository and committed with every check
green. `wo-sweep.mjs` gates the files it reads on `^(index\.html|sw\.js|manifest\.webmanifest|src/)`
and `\.(css|html)$`; an extensionless root file matches neither, so the sweep has never had an
opinion about it. **This is the half of WO-8.7's verifier finding that WO-8.8 deliberately declined**,
recorded there as "the smaller half" — correctly, because the whole finding was that the deployment
was invisible and that is the one WO-8.8 answered.

**WO-8.8 narrowed this without closing it.** `verify-deploy.mjs` now reads `Cache-Control` off the
wire, so a deleted `_headers` would show up as a red check — **but only when a human runs it**, and it
gates nothing by design. Between deleting the file and the next by-hand run, every tool in this
repository is green about a shell and a service worker that are no longer pinned. The gap is small
and it is real, and the fix belongs in the grep-shaped tool rather than the network-shaped one.

**Deliverables**
- **A check in `tools/wo-sweep.mjs`** — a grep, in the tool that is made of greps — asserting that
  `_headers` exists, and that it still pins the three paths it names to `no-cache`.
- **Its failure text says what a green here does not mean.** A passing check proves the file asks for
  the right thing, and nothing whatever about whether the host honours it — that is exactly the false
  comfort WO-8.8 was written against, and this check must not quietly re-offer it. Point at
  `verify-deploy.mjs` by name as the thing that reads the answer.
- **`tools/README.md`'s recorded check count** moves with it. `wo-sweep.mjs` §11 asserts that count
  against reality, so a change that forgets it turns the sweep red on itself.

**Out of scope** — anything that makes a network request; any assertion that the header *binds*, which
is `verify-deploy.mjs`'s job and cannot be answered from disk; widening the sweep's file gate in
general, which is a bigger change with its own blast radius. Fix the one file, not the pattern.

**Acceptance**
- [x] Deleting `_headers` turns `wo-sweep.mjs` red. *(Today it stays green — that is the defect.)*
- [x] Changing `/sw.js`'s pin from `no-cache` to `max-age=14400` — the WO-8.7 fault, written into the
      file rather than imposed by the zone — turns it red.
- [x] The sweep is green on a clean tree, and its check count agrees with `tools/README.md`.
      *19 checks · 17 passed · 0 failed · 2 to review, 2026-08-15. Left open at the dispatch: the
      count agreed at 19, but the green clause was blocked by a pre-existing stale-CACHE failure
      owned by f63792f, which changed `src/scores.css` and `src/scores.js` after
      `planbook-shell-v62`. Closed the same day by the bump to `v63` — a debt outside this work
      order, correctly refused by the implementer and paid by the owner.*
- [x] The failure text names `verify-deploy.mjs` as what proves the header actually binds.

**Traps** — **This is not a second `verify-deploy.mjs`.** It reads a file on disk; it must not fetch
anything, and the sweep must keep working on a plane. **Do not widen the file gate to fix one file** —
the regex is load-bearing elsewhere and a broadened pattern pulls in every dotfile and config at the
root. **Do not let it imply the deployment is checked.** The whole reason this work order is small is
that the large version of it already shipped as WO-8.8.

---

## WO-8.10 — the app cannot say which build it is running

**Ship** 2 · **Status** ✅ DONE — 2026-08-15 · **Size** S · **Depends on** —
**Closes roadmap** Phase 8 → *(no box. The same call as WO-8.7 through WO-8.9 — this is instrument,
not feature. Booked 2026-08-15, out of the v63 deploy.)*

**Why it exists.** After a deploy, the only way to learn whether the installed iPad actually took the
new shell is Safari Web Inspector over USB from a Mac. That is a procedure nobody runs in September,
which means in practice the question stops being asked — and the question matters, because
**WO-8.7's first deploy shipped two faults with every check in this repository green.** The deployment
is now read by `verify-deploy.mjs`, but that reads *the origin*. What no tool here can see is the
device: an installed app carries its own cache, and a deploy that landed perfectly on the host can sit
beside an iPad still serving the old one.

**The useful question is not "which version".** `sw.js` uses `skipWaiting` + `clients.claim`
(`sw.js:114`, `sw.js:122`), so `activate` deletes every cache that is not the current one. One cache
is the healthy state. **Two caches means `activate` did not finish**, and the app may be serving a
mix — which is the failure that actually breaks a screen, and the one a bare version string would
hide by reporting the new name while the old cache sits next to it.

**Deliverables**
- **The About modal's "This build" section reports what `caches.keys()` actually returns**, filtered
  to this app's shells. Generated at open time from Cache Storage — never a constant.
- **More than one is said out loud**, naming each. One cache reads as normal; two says so plainly
  enough that a teacher forwards the screen rather than shrugging at it.
- **Read from the page**, not from the worker. No `postMessage`, no change to `sw.js`.
- **It fails soft and says which failure.** Where Cache Storage is unavailable, the line says so —
  a blank space reads as *"no caches"*, which is a different fact and a wrong one.

**Out of scope** — any surface outside the About modal; an update prompt or a "reload to update"
banner, which is a real decision `sw.js:127` already frames and is not this work order's to make; any
network request; any edit to `sw.js`.

**Acceptance**
- [x] On a freshly loaded app, the About modal names the running cache and it matches `sw.js`'s
      `CACHE`.
- [x] With a second cache planted by hand — `caches.open('planbook-shell-v1')` — the modal says there
      is more than one and names both. *(This is the line that earns the feature. A display that only
      ever shows one name has proved nothing about the case it exists for.)*
- [x] With Cache Storage unavailable, the line says so rather than going blank.
- [x] `verify-shell.mjs` covers both states, planting and clearing the second cache itself. *(The
      harness has never seen a service worker — but Cache Storage is reachable from the page it
      drives, so this case is inside its reach even though the worker is not.)*
- [x] 👤 On the **installed** iPad, after a deploy: the modal names the cache just deployed, and names
      only one.

**Traps** — **Do not read the version from a constant.** A string typed into `index.html` is a claim,
not evidence: it will read `v63` while the browser holds `v62`, which is the exact failure this exists
to catch, now wearing a badge that says it didn't happen. **The paragraph above it already carries a
comment about going stale** (`index.html:1216`) and that comment is the argument — this line must be
generated every time the modal opens, because a build identifier that can be wrong is worse than
none. **Do not touch `sw.js`.** Its cache name is the fact being reported; a work order that edits
both the fact and the report of it can agree with itself while being wrong.

## WO-8.11 — the build line can name a version the screen is not running

**Ship** 3 · **Status** ✅ DONE — 2026-08-18 · **Size** S · **Depends on** WO-8.10
**Closes roadmap** *(no box. Instrument, not feature — the same call WO-8.7 through WO-8.10 made.
Booked 2026-08-16, out of WO-3.24's close-out sitting.)*

**Why it exists.** WO-8.10 gave the About modal a build line read live from `caches.keys()`, and its
central argument is that the useful question is *how many* caches rather than *which version*: one
cache is healthy, two means `activate` did not finish. That is right for the half-landed deploy it
was built for. It does not cover the case found on 2026-08-16.

**A single, correct, healthy cache can sit behind a stale rendered page.** `sw.js` uses `skipWaiting`
+ `clients.claim`, so a new worker takes over the moment it activates and deletes every other cache —
but it does not re-render an open window. The document on screen was fetched before the swap. For
exactly one launch the app therefore reports the new cache on the build line while every pixel came
from the old one, and both statements are true of different things: Cache Storage answers what the
device has **stored**, never what the window was **built from**.

**Found the expensive way.** WO-3.24 reworded one legend row; the owner read the installed iPad three
times and the first two showed the wrong string — first the pre-dispatch wording, then a superseded
attempt — while About read `planbook-shell-v72` throughout. A force-quit from the app switcher and a
cold relaunch produced the delivered text. Two of the three round trips were spent on the assistant
misdiagnosing the device from the desk, against a build line that was reporting honestly. **A support
surface that can be confidently wrong during an update is worse than one that admits it cannot tell**,
and the modal's own closing sentence invites a teacher to forward that screen.

**The decision this settles is the one `sw.js:127` already frames**, and WO-8.10 explicitly declined:
an update prompt was in its Out of scope as *"a real decision ... not this work order's to make"*.

**Deliverables**
- **Choose the route, and write the reasoning where the route is taken.** Two are open:
  - **Page-side only, `skipWaiting` kept.** `navigator.serviceWorker`'s `controllerchange` fires when
    a new worker claims an already-loaded client — which is this case exactly. The page learns it is
    running markup its controller no longer serves, and the build line says so. **Preferred**: it
    edits no `sw.js`, so WO-8.10's "do not touch `sw.js`" trap stands unbroken, and it leaves the
    boot-time guarantee in `sw.js:127` alone.
  - **Drop `skipWaiting`** and tell the teacher an update is ready, which is what the comment at
    `sw.js:127` suggests. Larger blast radius, in the file WO-8.7's white-screen scar lives in.
- **The build line distinguishes stored from rendered.** Where they disagree it says so in a sentence
  a teacher can act on — quit from the app switcher and reopen — rather than naming two versions side
  by side. **A pull-to-refresh is not sufficient and the wording must not imply it is**; that was
  tried on 2026-08-16 and did not clear it.
- **Silence in the healthy case.** The overwhelmingly common state is one cache, freshly rendered,
  and it must stay the quiet single-sentence line WO-8.10 built. A banner on every launch teaches the
  teacher to dismiss the one launch that matters.

**Out of scope** — the update *policy* (whether Planbook ever auto-reloads, prompts, or defers); any
surface outside the About modal; anything about deploys on the host side, which is WO-8.8's.

**Acceptance**
- [x] With a document loaded from cache A and a worker that has since activated cache B, the build
      line says the screen is stale and names the action that fixes it. Driven, not reasoned.
- [x] In the healthy case — one cache, document served from it — the line is exactly what WO-8.10
      ships today, with nothing added.
- [x] The **first-ever load**, where a worker claims a page that had no controller at all, is read as
      healthy and not as staleness. *(This is the trap below, written as a check: `controllerchange`
      fires for both, and conflating them puts a scary sentence in front of every new install.)*
- [x] `verify-shell.mjs` covers both states and hands Cache Storage back as it found it, the way
      WO-8.10's own section does.
- [x] 👤 On the **installed** iPad: deploy, launch once without force-quitting, and confirm the app
      says the screen is stale — the exact sequence that misled the reader on 2026-08-16.

*(Run 2026-08-18 and passed, with one divergence from the wording above: the deploy was local —
`CACHE` bumped `v77` → `v78` on disk behind `tools/serve-https.mjs`, the way every 👤 line since
WO-1.3 has been run — because what starts an Update job is a byte-different `sw.js`, and re-pushing
the same tree would have started nothing at all. The sitting also found what the sequence above does
not say: **iOS resumes a backgrounded app without loading a document**, so `register()` never runs,
no update is looked for, and the app comes back as the build you left with no amber line — a reader
waiting for one has found the resume, not a defect. Full reading in `TESTING.md` § WO-8.11.)*

**Traps** — **`controllerchange` fires on first control as well as on replacement.** A page that has
never had a controller gets one when the worker claims it, and that is not staleness; keying off the
event alone puts a warning in front of every first install. Read `navigator.serviceWorker.controller`
*before* registering to tell the two apart. **Do not add a second source of truth for the version.**
WO-8.10's trap holds — no constant in `index.html` — and this work order adds a fact about the
*document*, not a second claim about the *build*. **Do not make the healthy line longer.** The reason
WO-8.10's sentence works is that a teacher reads it in one glance; a caveat attached to the normal
case is a caveat nobody reads in the abnormal one.

---

## WO-8.12 — the privacy policy and the FERPA document

**Ship** — · **Status** ✅ DONE — 2026-08-21 · **Size** M · **Depends on** WO-8.7 — the domain and the host
to publish at · **Blocks** WO-3.18 — a verification form with no policy URL to paste
**Closes roadmap** Phase 8 → "`docs/FERPA.md`."

**Booked 2026-08-20**, owner-directed, out of the sitting that found WO-3.18's missing dependency —
the two notes under that work order's header are the story. **Split out of
[WO-8.5](#wo-85--readme-ferpa-and-known-limitations)**, which keeps the README.

**Why it exists.** Two readers, one set of facts. The **privacy policy** is a legal artifact at a URL
Google fetches during verification; **`docs/FERPA.md`** is what a principal or a district IT director
reads before letting a teacher put student data in something. WO-3.18 has said since 2026-08-10 that
they say overlapping things and that the answer is to **write them together or write them twice** —
and writing them twice is how the two of them come to disagree about what leaves the device, in
public, with our name on both.

**It is also the half of WO-3.18 that nothing blocks.** That work order cannot film its demo video
until [WO-7.1](phase-7-sync.md#wo-71--auth) exists, and WO-7.1 is an M of token flow with no date. The
policy needs a domain, and the domain has existed since 2026-08-12. Booking this separately is what
stops the one document that could be written today from waiting on the one that cannot.

**The position being written down is a real asset, and it is unusually strong.** No vendor server ever
receives student data — there is no endpoint to send it to. No account is required. The only Google
scope is `drive.file`, which reaches app-created files and nothing else. Outreach leaves by `mailto:`,
so it goes out through the teacher's own mail client and lands in their own sent folder. **Say it
plainly and do not oversell it** — trap 3.

**Deliverables**
- **A published privacy policy at the origin**, saying the three things WO-3.18 names: no vendor
  server ever receives student data, no account is required, and Drive holds only files this app
  created. Plain words, a principal's reading level, no clause a teacher needs a lawyer to parse.
- **`docs/FERPA.md`, stronger than Roll Call!'s** because the architecture is stronger. Roll Call!'s
  own `docs/FERPA.md` is 89 lines under six headings and is the shape to lift — *what data the app
  handles · where it lives, and who can see it · what the vendor receives: nothing · how this maps to
  FERPA · practical safeguards (and one honest caveat)*. Take the structure and the stance; the facts
  differ here, and "what the vendor receives: nothing" is the section where this app is strongest.
  Its `docs/SCOPES.md` is worth reading beside it for how a scope argument is written for a
  non-engineer.
- **The accommodation clause, and it is why this document matters more here than there.**
  `docs/data-model.md` § Accommodations rule 4 says the downloadable JSON now contains IEP and medical
  data, that this is the correct posture and the same one a paper folder has, **and that
  `docs/FERPA.md` must address it directly rather than only discussing grades.** `CLAUDE.md` records
  that until this lands the disclosure lives in the backup UI alone, *"which is the weaker half of the
  obligation."* This deliverable is that half.
- **A data-flow statement: what leaves the device, when, and to where.** The honest answer is
  "nothing, unless the teacher turns on sync or sends an email." Both documents carry it and they
  carry the *same* one.
- **The service-worker fix the policy page cannot be reached without** — trap 1.
- **Cross-references, not duplication.** Each names the other; neither restates the other's argument.

**Out of scope** — the in-app link to the policy, which is
[WO-7.3](phase-7-sync.md#wo-73--verification-complete)'s own Acceptance box; `README.md` and its Known
limitations section, which stay in WO-8.5; and the demo video, the domain verification and the
submission itself, all of which are WO-3.18.

**Traps**

**1. `sw.js` will answer the policy URL with the gradebook, and that is the whole of the first trap.**
`sw.js:156` answers **every** navigation out of the cache — `INDEX` is `new URL('./', self.location).href`,
the app shell, and the path of the request is never looked at. So on any device that has the worker
installed, navigating to the policy renders the gradebook. **The failure is invisible from exactly the
place it will be tested:** Google's reviewer fetches cold, with no worker, and sees the policy; the
owner's iPad has a worker and does not. The fix belongs in that navigate branch — answer `INDEX` for
the app's own navigations and let anything else fall through to the network. Read the header comment
above `SHELL` before touching that file, and **bump `CACHE`**, without which no device sees the change
at all; a force-quit is still the procedure for confirming it on hardware.

**2. Do not put the policy in `SHELL`, and say so at the point of the decision.** It is not shell: it
is a document read once, online, by a reviewer or by a teacher who tapped a link. Precaching it adds a
hand-maintained entry to a list whose own comment says the stylesheet is the one that gets missed, and
buys an offline reading of a legal page nobody reads offline. **The consequence is real and is
accepted:** tapping the policy link with no network gives a browser error page rather than the policy.
If a later work order decides that is wrong it adds one line and one `CACHE` bump — and it should
record why, because this ruling is the reason it is not there already.

**3. Claim nothing the app does not do.** No encryption claim — IndexedDB is not encrypted and neither
is the JSON backup; the honest statement is that the data never leaves the device unless the teacher
sends it. No retention or deletion promise the app cannot keep. No "we do not sell your data," which
is a sentence about a vendor that receives data and reads as an admission that one does. **A privacy
policy that overstates the architecture is worse than a plain one**, because the architecture here is
genuinely strong and every unverifiable sentence beside it invites doubt about the ones that are true.

**4. The contact line is the owner's decision, not the implementer's.** A public policy needs a way to
reach someone, and WO-8.7's note rules that an address in a public file is a spam and phishing target
— which is why that work order describes the account rather than naming it. **This is the one thing
here that cannot be settled from the repository.** Do not invent an address, and do not quietly ship a
policy without one.

**5. Both documents are dated, and a dated document that is wrong is worse than an undated one.** Put
a last-updated date on each, and expect Phase 7 to move the data-flow statement in both the day sync
comes out from behind its flag.

**Acceptance**
- [x] The policy is **live at the verified domain and says the three things WO-3.18 names**, in plain
      words — fetched over the wire rather than asserted from the repo. `verify-deploy.mjs` is the
      only check here that reads the live origin.
      *(**Deployed and green 2026-08-21: `16 checks · 16 passed · 0 failed`** against
      `https://planbook.hwgteach.com`. `/privacy` answers **19,450 B**, titled as the policy and with
      no `#homeView` in it, where the same URL answered 204,614 B of app shell the day before.
      **The first run against a real policy found a false negative in the check itself** — see
      `TESTING.md`; it read the raw response body, so a claim sentence that wrapped across two source
      lines could not match, and it called a sentence missing that was there in those words. Matching
      now happens against a whitespace-normalised copy: a reworded policy still goes red, a reflowed
      one no longer does.)*
- [x] Navigating to the policy on a device that **already has the service worker installed** renders
      the policy and not the app. Force-quit before reading, per `CLAUDE.md`.
      *(👤 **Read on the iPad 2026-08-21 and green**, after the force-quit. Reached through the
      About modal's new Privacy policy row rather than by typing a URL, which is a stronger reading
      than the line asks for: an installed PWA has no address bar, so before those rows there was no
      way to perform this check on hardware at all without a second browser.)*
- [x] `docs/FERPA.md` **has a section on accommodation and medical data, and one on backups** — and
      the backup section says the JSON contains IEP and medical data in as many words.
- [x] Nothing in either document claims a behaviour the app does not have. Walk every sentence that
      makes a promise and name the code that keeps it.
- [x] The two documents agree on every fact, and neither restates the other's argument.
- [x] Both are readable by a principal, not only by a developer.
      *(**The owner read both, 2026-08-21, and passed them.** This is the line the implementer left
      open on purpose because no run in this repository settles it — it wanted one pass of the
      owner's eyes and it has had it.)*
- [x] 👤 The owner has decided what contact appears on a public page, and it is what the policy says.
      *(**Decided 2026-08-21: `privacy@hwgteach.com`, a role alias on the project's own domain, and
      deliberately NOT the personal Gmail the Cloud project and the domain verification sit on.**
      *(It was a second Gmail for about an hour first; the alias carries the same argument further —
      what this page needs from a contact is abandonability, not secrecy.)* The reasoning is
      WO-8.7's ruling read forward and is written at the point of use, in `privacy.html`'s header
      comment: a public legal page will be scraped, and the one thing you want to be able to do with
      a scraped address is abandon it — which is the one thing you cannot do with the account that
      holds the domain verification. The Contact section now carries it as a `.block-link` mailto
      rather than the plain `<strong>` the placeholder wore, so it clears the 44px floor on the
      device a principal is most likely to be holding; `docs/FERPA.md` still keeps no second copy.)*

*(**Built 2026-08-20.** `privacy.html` at the repository root — served by Pages at
`https://planbook.hwgteach.com/privacy`, which is the URL for the verification form — and
`docs/FERPA.md`, plus the `sw.js` navigate fix (`CACHE` `v91` → `v92`) that the policy URL cannot be
reached without. **Four of the seven lines are owed and none of them to a missing deliverable.**
Lines 1 and 2 want a deploy and an installed iPad, which is what the tree is now built to pass:
`tools/verify-deploy.mjs` grew a § "the privacy policy" that reads `/privacy` off the live origin —
and its first run against the CURRENT deployment is the reason it has a check nobody planned, since
**this host answers an unknown path with the app shell at 200**, so `/privacy` came back
`200 text/html, 204,614 bytes` with no policy deployed at all. Status cannot see a missing policy
here; the document can, and does. Line 7 is the owner's: the policy ships with
**`PLANBOOK-CONTACT-TBD`** in its Contact section, once, and the deploy check goes red until it is
replaced. **Line 6 is left unticked on purpose** — whether a principal can read these is a judgment
about a reader the implementer is not, and no run settles it; it wants one pass of the owner's eyes
and nothing more. `verify-shell.mjs` gained seven checks that navigate an iframe at the policy URL
through the installed worker, which is the first block in that file to assert anything about `fetch`
interception.)*

*(**Five of the seven lines closed on 2026-08-21, and the sitting that closed them found the hole
this work order left.** The owner read both documents, decided the contact, and took the iPad
reading — lines 2, 6 and 7. Line 1 is still owed to the push and the deploy. **The hole: WO-8.12
delivered two documents AT THE ORIGIN and nothing in the app pointing at either**, which is correct
for the reader it was written for — a Google reviewer is handed a URL — and leaves a teacher with
no way in at all, because an installed PWA has no address bar. It surfaced as an inability to take
the Acceptance 2 reading the way a teacher would. The fix is owner-directed and outside any work
order: the About modal now carries a **Privacy and student data** section with a row for each,
`src/shell.css` gained `.modal-body .doc-link` — **the first `<a>` tags this app has ever had** —
and `sw.js` went to `v93`. `TESTING.md` § "the About modal's two links" is the record. The reading
also found the guide row 404'ing, and that was not the link: nothing from this work order had been
pushed, so `docs/FERPA.md` did not exist on GitHub and neither did `privacy.html`. **A link into
your own repository is untestable until the commit carrying its target is pushed, and the failure
is indistinguishable from a wrong URL.**)*

---

## WO-8.13 — the About modal names two documents and not the licence

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** nothing
**Closes roadmap** *(no box. The same call WO-8.9 through WO-8.11 made: this is the app reporting a
fact about itself rather than a feature the roadmap costed. Booked 2026-08-21, owner-directed, out
of the sitting that added `LICENSE.md`.)*

**Why it exists.** `LICENSE.md` — Apache 2.0 — landed on 2026-08-21, and the two public documents
that claim the source is public now name it: `privacy.html`'s footer and the *"The source is public"*
bullet in `docs/FERPA.md`. **The app names nothing.** About carries a **Privacy and student data**
section with a row for the policy and a row for the administrators' guide, both added in that same
week, and a teacher — or the colleague she hands the iPad to — has no way from inside the app to
find out what anyone may do with this.

**It is not a compliance job, and dressing it as one would oversell it.** Apache §4 wants a recipient
of the work to receive the licence, and every recipient already does: Cloudflare Pages serves
`/LICENSE.md` out of the repository root, and the same file is on GitHub, pushed. The reader this row
is for is the one WO-8.12's two rows were not written for — somebody wondering whether they may fork
this, run it for their own department, or sell it. **One row. It stays one row.**

**Deliverables**
- **One `.doc-link` row in the About modal**, pointing at `LICENSE.md` on GitHub, with the licence
  named in the link text — *"Apache License 2.0"*, not *"Licence"*. A reader who has to open a file
  to learn which licence it is has been told nothing.
- **Its own section label, not the privacy one.** **Privacy and student data** is an argument about
  student records; a licence filed under it reads as a privacy term. A second
  `modal-section-label` — *Source and licence*, or whatever survives being read aloud — in the same
  grammar as the two that exist, above the build line.
- **`sw.js`'s `CACHE` bumped in the same commit.** `index.html` is what `./` resolves to and `./` is
  entry one in `SHELL`; without the bump no installed device sees the row at all.
- **One `verify-shell.mjs` check.** The two rows beside it are asserted nowhere — they landed outside
  a work order and only `TESTING.md` records them. A check written to read *every* `.doc-link` in
  that modal closes all three at once and is the better shape.
- **A `TESTING.md` line of its own**, and the 👤 reading below.

**Acceptance**
- [ ] The About modal names the licence and links `LICENSE.md`, and the link text says *which*
      licence.
- [ ] The row is **not** inside the **Privacy and student data** section.
- [ ] **No new CSS.** It reuses `.modal-body .doc-link`, including that rule's `(pointer: coarse)`
      entry in `src/shell.css`, which is what gives it 44px. **A row that needs a new rule is the
      wrong shape** — say so in the result rather than adding one quietly.
- [ ] `target="_blank" rel="noopener"`, matching the two rows beside it, for the reason written
      above them in `index.html`.
- [ ] `sw.js` `CACHE` bumped in the same commit that edits `index.html`.
- [ ] `node tools/verify-shell.mjs` green, carrying a check that goes **red** when the row is
      deleted — proved by deleting it once, not by reasoning about it.
- [ ] 👤 On a **force-quit and relaunched** install: the row is there, tapping it opens the licence
      in the browser, and Planbook is still where you left it when you come back.

**Traps** — **The GitHub URL, not `./LICENSE.md`.** A `.md` served off this origin is a file some
browsers download rather than a page they render; GitHub renders it. That argument and the one about
`target="_blank"` are both already written in `index.html` in the comment above the FERPA row — read
it before writing the href rather than re-deriving either. **Unlike that row, this target is already
pushed**, so it is testable the moment it is written; do not take that as a reason to skip checking
it. **Do not restate the licence in the modal.** A summary of Apache 2.0 sitting in this app's UI is
a licence term this project did not write and cannot honour — link it and say its name. **Do not
touch the two rows beside it.** They are `TESTING.md`'s record, not this work order's, and a change
to them here lands in a commit whose message is about something else. **Do not add a version or a
copyright line beside it.** The build line under it is generated from `caches.keys()` for the reason
WO-8.10 gives, and the copyright holder is stated in `LICENSE.md` and nowhere else — a second copy in
the modal is a second thing to keep true.
