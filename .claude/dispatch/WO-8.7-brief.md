# WO-8.7 — the name and the host, decided · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-8-packaging.md`
**Report to** `.claude/dispatch/WO-8.7-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude at Opus tier, on its own merits — not a probe fallback.**
The deciding signal is that what remains of WO-8.7 is judgment and teacher-facing prose rather than
mechanics: the one open deliverable is the distribution sentence, and the work order is dense with
traps a tidy implementer would "improve" (subdomain over apex, no `functions/` directory, the
deliberate name/domain mismatch on the consent screen). It also feeds Google domain verification,
which is the WO-3.18 / OAuth surface `ROUTING.md` keeps on the Claude side. The runner-up set aside:
the `_headers` file alone is mechanically specified and would route Codex cleanly, but it is a small
fraction of this work order and does not carry the rest.

**Read this before anything else — this work order is mostly not yours to close.** Commit `08bd5b9`
(2026-08-12) already recorded the name, the host and the origin into the work order text, and
deliberately left the status open. Three of the four Acceptance lines can only be closed by a human
at a browser holding GoDaddy, Cloudflare and Google Cloud credentials that no agent has. **Your job
is not to fake those.** It is to close what is genuinely closable on disk, and to leave the human
steps in a state where the teacher can execute them in one sitting without re-deriving anything.
Section 2b below draws the line precisely.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-8.7 — the name and the host, decided

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-12 · **Size** S · **Depends on** nothing but a decision
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

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `plans/work-orders/phase-8-packaging.md` in full — not only the WO-8.7 section. **WO-8.6 sits
  directly above it** and owns the "one name in the manifest, the README and the consent screen"
  check. That check is WO-8.6's, not yours.
- `manifest.webmanifest` — read it, do not edit it. It already says `"name": "Planbook"` with
  `start_url` and `scope` both `"./"`, which is exactly what the subdomain-origin decision needs.
  Confirming that costs nothing and is worth a line in your report.
- `sw.js` — specifically its `CACHE` constant and how the shell is cached. The `_headers`
  requirement in the work order exists to protect that discipline; know what you are protecting.
- `git show 08bd5b9` — the commit that recorded the three settled decisions, and its message,
  which states the reasoning in the teacher's own voice. Match that voice.

---

## 2b. Scope — what is yours, what is the teacher's, what is neither

**Yours, and this is the whole of it:**

1. **The distribution sentence** — the fourth Deliverable, and the only one still open. One
   sentence: how a teacher finds the app and what she types. Write it into the WO-8.7 section of
   `plans/work-orders/phase-8-packaging.md`, alongside the decision table that is already there.
   Teacher voice, suite voice — read `CHANGELOG.md` and the existing work order prose for the
   register. This is the deliverable that most needs taste rather than throughput.
2. **`_headers`** — the work order says in bold that it "is not optional here," which puts it in
   scope even though it is not itself a bullet in Deliverables. Repo root. `sw.js` and `index.html`
   served `Cache-Control: no-cache`. Get the Cloudflare Pages `_headers` syntax right — path
   pattern on its own line, header lines indented beneath — and comment nothing into it that the
   format cannot carry. If you conclude it belongs somewhere other than the repo root for how Pages
   builds this project, say so and explain rather than guessing.
3. **The execution sequence for the human steps.** Someone has to know the order, and the order has
   real dependencies: nameservers move to Cloudflare before the Pages custom domain can be attached,
   and the Google verification TXT record lands in Cloudflare DNS only after that. Write it as an
   ordered, checkable sequence into the WO-8.7 section — **not a new document.** The established
   convention for this work order is that its decisions live in its own section, which is what
   `08bd5b9` did. If you believe a `docs/deploy.md` is the right home, propose it as a follow-up
   work order in your result file; do not create it.
4. **Acceptance line 1**, which the settled name already satisfies — tick it if you agree it is
   met, and say what evidence you ticked it on.
5. **The repo half of Acceptance line 4.** There is no `functions/` directory, no `package.json`,
   no server-side anything. You can check and state that half as fact. The other half — that the
   deployed Pages project has no Functions attached — is the teacher's, because the deployment does
   not exist yet. Split the line honestly rather than ticking it whole.

**The teacher's, and you must mark them 🙋 rather than attempt them:** creating the Cloudflare
account and Pages project, moving `hwgteach.com`'s nameservers at GoDaddy, attaching the
`planbook.hwgteach.com` custom domain, the first deploy, loading the URL in a browser to confirm
HTTPS and service worker registration, and verifying the domain in the Google Cloud console.
Acceptance lines 2 and 3 close on those and on nothing else. **Do not tick them.** Do not report
them as "should work" — a prediction in an Acceptance report reads as a result to the next person.

**Neither — do not touch:**

- `manifest.webmanifest`, `index.html`, the README, or any consent-screen copy. Name consistency
  across those three is **WO-8.6's** Acceptance line 3, and it is a different work order.
- The roadmap boxes for anything but this work order.
- Any deploy script, CI config, wrangler file, or `package.json`. `CLAUDE.md` forbids the last
  outright and the rest are a build system this project does not have.
- The reasoning already recorded in the WO-8.7 section. The apex argument, the Pages-over-GoDaddy
  argument and the request-logs paragraph were each argued once. Add to them; do not rewrite them.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

Two notes specific to this dispatch. **`verify-shell.mjs` drives a real browser and agents have
repeatedly reported it as "could not run" when it runs fine outside the sandbox** — if it fails to
launch for you, say exactly that, with the error, rather than reporting a failing app. And expect
`wo-sweep.mjs` to be the one that actually matters here: a new root-level `_headers` file is the
kind of untracked artifact a sweep has been blind to before, so check that it is seen.

---

## 5. Done means these 4 lines, reported against one by one

1. The name is written here, and it is one name rather than a preference between two.
2. The URL resolves over HTTPS and serves the app, with the service worker registering — checked in a browser, not assumed from the host's marketing.
3. The domain is verified in the Cloud console, which is what WO-3.18 consumes.
4. Nothing in the deployment runs server-side code. Stated as a checked fact, because this is the line the architecture cannot cross without a decision nobody has made.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

