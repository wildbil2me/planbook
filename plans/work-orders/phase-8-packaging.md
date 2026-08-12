# Phase 8 work orders — 1.0 packaging

**Phase goal:** something a stranger can find, evaluate, install, and trust.

Branch: `phase/8-packaging`. The 1.0.0 call itself is [WO-G4](gates.md#wo-g4--the-100-call).

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

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-8.1
**Closes roadmap** Phase 8 → "`README.md` with a Known limitations section" and "`docs/FERPA.md`."

**Why it exists.** The 1.0 criteria require limitations to be "written down before launch, not
discovered by a user." And the FERPA document is a genuine asset with principals and district IT —
no vendor server ever touches student data, and no account is required. That position is worth
stating well.

**Deliverables**
- `README.md`: what it is, install, first attendance mark, and a **Known limitations** section
  naming the gaps out loud — no SIS integration, no multi-teacher, no translation, `mailto:` cannot
  confirm delivery, sync is foreground-only, whatever WO-2.7 shipped without.
- `docs/FERPA.md`, **stronger than Roll Call!'s** because the architecture is stronger: no vendor
  server, no account required, one Drive scope covering only app-created files.
- **It must address accommodation and medical data directly, not only grades** — including the fact
  that the JSON backup contains them and that this is the same posture a paper folder has.
- Data-flow statement: what leaves the device, when, and to where. The honest answer is "nothing,
  unless the teacher turns on sync or sends an email."

**Acceptance**
- [ ] Every README feature has been run end-to-end against real data. *A documented feature that
      fails on a teacher's first day loses that teacher permanently.*
- [ ] Known limitations names at least every gap listed above.
- [ ] `FERPA.md` has a section on accommodation and medical data, and one on backups.
- [ ] Both documents are readable by a principal, not only by a developer.

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

**Ship** — · **Status** 🔨 IN PROGRESS · **Size** S · **Depends on** nothing but a decision
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

1. [ ] **Create the Pages project** against `github.com/wildbil2me/planbook`, production branch `main`.
   Framework preset **None**, build command **empty**, output directory **`/`** — there is no build, so
   the output is the repository as it sits, which is also what puts `_headers` where Pages reads it.
   Attach **no Functions**, and add no `wrangler.toml` and no build command: that is the build system
   this project does not have, and the absence of a `functions/` directory is what makes Acceptance line
   4 a fact rather than a promise. *(Direct Upload — dragging the folder into the dashboard — is the
   alternative if a Git connection is unwanted. Same files either way, and neither adds anything to this
   repository. Note that with `main` as the production branch, nothing deploys while the work is sitting
   on a phase branch.)*

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
2. [ ] **Check that first deploy at its `*.pages.dev` URL, before the custom domain is attached.** HTTPS is
   automatic there, so the app, the service worker registration and both `Cache-Control: no-cache`
   headers can be confirmed on an origin that has nothing to do with the domain — which is what will
   tell a DNS problem from an app problem an hour later. **Put no real class data in at that origin**:
   it is a different origin, so it gets its own IndexedDB, and anything typed there is a second place a
   teacher's grades live.
3. [ ] **Attach `planbook.hwgteach.com`** in the Pages project → Custom domains. The zone is already at
   Cloudflare, so Pages writes the CNAME itself and there is no record to paste anywhere and no
   nameserver to check first. Wait for the certificate to issue — that is the one genuine wait left in
   this sequence.
4. [ ] **Load `https://planbook.hwgteach.com/` and read it, rather than assume it** — this is Acceptance
   line 2. The padlock; the app rendering; the service worker **activated and running** (DevTools →
   Application → Service Workers); `cache-control: no-cache` on the document and on `/sw.js` in the
   Network panel. Then the same URL on the iPad, Share → Add to Home Screen, and a launch from the icon
   with no browser chrome — which is the distribution sentence above, walked end to end.
5. [ ] **Verify `hwgteach.com` with Google** — Acceptance line 3, and what WO-3.18 consumes. The
   verification itself happens in **Search Console**, which is where the Cloud console sends you: add
   `hwgteach.com` as a Domain property, take the TXT record it offers, and put it on the apex in
   Cloudflare DNS. Verify the **apex and not the subdomain** — `hwgteach.com` covers everything under
   it, and it is the name that goes in the client's authorized domains.
6. [ ] **Write the two dates back into this work order** — the day the URL first resolved and the day the
   domain verified — and tick Acceptance lines 2 and 3 on them, the way WO-3.10 records *(Owner, in the
   console, 2026-08-11)* beside each line it closed.

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
- [ ] The URL resolves over HTTPS and serves the app, with the service worker registering — checked
      in a browser, not assumed from the host's marketing. *(Step 4. Nothing is deployed, so nobody has
      seen this; it closes on the owner in a browser and on nothing else.)*
- [ ] The domain is verified in the Cloud console, which is what WO-3.18 consumes. *(Step 5. It has no
      DNS prerequisite left — the zone is already at Cloudflare — so it can be done at any point in the
      sitting, including while the certificate in step 3 is issuing.)*
- [ ] Nothing in the deployment runs server-side code. Stated as a checked fact, because this is the
      line the architecture cannot cross without a decision nobody has made.
      **The repository half is checked, 2026-08-12**: no `functions/` directory, no `package.json`, no
      `wrangler.toml`, nothing server-side anywhere in the tree — what deploys is `index.html`, `src/`,
      `sw.js`, the static assets and `_headers`, and `tools/*.mjs` is run by hand and invoked by no
      deploy, no server and no page load (`tools/README.md` § The rule). `wo-sweep.mjs`'s
      *no dependency manifest anywhere* check asserts that half on every run. **The deployment half is
      the owner's** and cannot be checked before a deployment exists — a Pages project with no Functions
      attached, which is step 1. The box stays open until both halves are true rather than being ticked
      on the half that is.
