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

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** nothing but a decision
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

**The name, the host and the origin, decided — 2026-08-12.** *Three of the four deliverables. Only the
distribution sentence is still open, and the decisions below are still unexecuted — nothing is standing
up at that URL yet. This work order stays `⬜ NOT STARTED` until it resolves in a browser.*

| | |
|---|---|
| **Name** | **Planbook** — one name, unchanged from the repo |
| **Host** | **Cloudflare Pages**, static assets only, **no `functions/` directory** |
| **Origin** | **`https://planbook.hwgteach.com/`** — its own subdomain |
| **Domain** | **`hwgteach.com`**, held at GoDaddy |
| **DNS** | Cloudflare, registration staying at GoDaddy |

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
shared Apache/PHP hosting, which was the alternative already paid for — the honest claim is "we do not
currently run any," which is a promise about behaviour. On Pages with no `functions/` directory there is
nowhere for it to run: crossing the line means adding a directory, which is a tripwire rather than a
memory. Same deployment today, a stronger sentence to say to a principal. The rest is ordinary: free at
this scale, custom domain with automatic HTTPS (**required** — no HTTPS, no service worker, no install,
no eviction protection), and `_headers` control.

**`_headers` is not optional here.** `sw.js` and `index.html` must be served `Cache-Control: no-cache`,
or a teacher sits on a stale shell after a deploy and the `CACHE` bump this repo is disciplined about
buys nothing. This is also what rules out GitHub Pages, which is otherwise a fair fit: free, custom
domain, HTTPS, and no way to set a response header.

**The apex trap, recorded before somebody walks into it.** Pages wants a CNAME, and an apex CNAME needs
flattening/ALIAS support that GoDaddy's DNS has long not offered. The domain's **nameservers point at
Cloudflare** — registration can stay at GoDaddy, this moves DNS only, and it is free and reversible. It
also puts the TXT record for Google's domain verification in the same place as everything else, which is
what WO-3.18 consumes.

**Cloudflare Registrar sells at cost** — no markup, no cheap-first-year-then-spike. Worth knowing if the
name ever moves to a domain of its own.

**One thing to say plainly rather than let a district IT person find.** Cloudflare serves the files and
therefore sees request logs — IP, timestamp — like any host. That is not student data, and there is no
endpoint to send student data to, so the claim above holds. But the honest sentence is "they serve the
files and see who fetched them," not "they see nothing." *(And an outage means the app will not **load** —
an installed PWA still runs from its own service worker cache, so a teacher mid-lesson is unaffected.
That is what makes this decision genuinely low-stakes, and it is why the work order says to choose on
price and reliability alone.)*

**Acceptance**
- [ ] The name is written here, and it is one name rather than a preference between two.
- [ ] The URL resolves over HTTPS and serves the app, with the service worker registering — checked
      in a browser, not assumed from the host's marketing.
- [ ] The domain is verified in the Cloud console, which is what WO-3.18 consumes.
- [ ] Nothing in the deployment runs server-side code. Stated as a checked fact, because this is the
      line the architecture cannot cross without a decision nobody has made.
