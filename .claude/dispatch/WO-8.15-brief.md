# WO-8.15 — the homepage Google is given is an empty gradebook · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-8-packaging.md`
**Report to** `.claude/dispatch/WO-8.15-result.md` — as your last act, and return it in-band too.

**No orchestrator routed this, and no implementer was dispatched.** The work was built inline, in
the owner's own session on 2026-09-25, by the same session that booked the work order — which is the
shortcut the pipeline exists to prevent, caught by the owner afterwards. This brief was generated
retroactively with `node tools/wo-brief.mjs WO-8.15 --route claude`, so the verifier can see what the
work order asked for; it was never handed to anybody as an instruction.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-8.15 — the homepage Google is given is an empty gradebook

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-25 · **Size** S · **Depends on** WO-8.7, WO-8.12 — the domain to
serve it at and the policy it links · **Blocks** WO-3.18 — a verification form whose Homepage field
would otherwise point at "No classes yet."
**Closes roadmap** *(no box. The roadmap costs the policy and the submission; the page Google reads
before either was never named.)*

**Booked 2026-09-25**, owner-directed, out of a fresh-eyes read of WO-3.18 and its two runbooks.
Built the same sitting.

**Why it exists.** Google's branding review reads the homepage URL on the verification form, and a
homepage is expected to say what the app does and to link its privacy policy. Both runbooks put
`https://planbook.hwgteach.com/` in that field. **A reviewer opening it cold sees the app with no
data: "No classes yet." and an *Add your first class* button** — no description of Planbook anywhere
on the screen, and the only privacy link inside the About modal (`index.html`, the *Privacy and
student data* row). Neither runbook named the risk; it surfaced only when the question was asked of
the page rather than of the form. **A rejection costs a round trip in a queue nobody here controls**,
which is the whole reason WO-3.18 is scheduled early.

**The shape decided, and the two it was chosen over.** A static `about.html` at the root, served at
`/about`, and **`/` stays the app**. *Landing page at `/`, app moved to `/app/`* was refused: the
installed iPad and laptop open `./` (`manifest.webmanifest`'s `start_url` and `scope`), the service
worker is scoped to the same path, and moving both mid-term, on devices in daily classroom use, is
not a trade to make for a form field. *The app shows its own front door to a first-time visitor* is
right and is [WO-8.16](#wo-816--a-first-time-visitor-meets-the-front-page-not-an-empty-gradebook) —
an app change with its own traps, booked separately so the submission does not wait on it.

**Deliverables**
- **`about.html` at the repository root**, shaped exactly like `privacy.html` — inline styles quoted
  from `design/style-guide.md`, no manifest, no worker, no JavaScript — saying what Planbook does,
  the three short privacy claims with a link to the policy and to the administrators' guide, how to
  install it on an iPad and in Chrome or Edge, and a way into the app.
- **No `sw.js` change.** The navigate branch answers only `APP_DOCUMENT` since WO-8.12, so a second
  document at this origin already falls through to the network. `about.html` is not in `SHELL`, for
  `privacy.html`'s reason.
- **`tools/verify/about-page.mjs`** — `verify/policy-url.mjs`'s three questions asked of a second
  page, plus the two links the page exists to carry.
- **A `verify-deploy.mjs` section for `/about`**, because this host answers an unknown path with the
  app shell at 200 and only the document can say the page is deployed.
- **The Homepage field in both WO-3.18 runbooks reads `/about`.**

**Acceptance**
- [ ] `about.html` is at the root, says what Planbook does, links the privacy policy and opens the
      app, carries no script, manifest link or worker registration, and is not in `sw.js`'s `SHELL`.
      `tools/verify/about-page.mjs`.
- [ ] Its visible text carries no repository vocabulary and its comment delimiters balance —
      `privacy.html`'s header leaked onto the deployed page once, and only an absence check sees that.
- [ ] On a page `sw.js` controls, navigating to it renders the front page over the network, not the
      gradebook out of Cache Storage.
- [ ] `node tools/verify-deploy.mjs` is green at `/about` against the live origin: titled *About
      Planbook*, not the app shell, linking the policy. *(Red before the deploy, correctly —
      measured 2026-09-25: `267560 B · titled About Planbook = false` — the shell.)*
- [ ] 👤 The owner reads it on the iPad and on the laptop, cold, and the install steps are right on
      both — Safari's *Share → Add to Home Screen*, and the address-bar icon in Edge.
- [ ] Both WO-3.18 runbooks name `https://planbook.hwgteach.com/about` as the Homepage.

**Traps** — **Do not give it a data-flow statement of its own.** `privacy.html` and `docs/FERPA.md`
carry one word for word; a third copy is a third place for it to drift. The page compresses the
policy's *short version* and links the documents that argue it. **Do not claim more than the policy
does** — WO-8.12's trap 3 governs every sentence here too: no encryption, no retention promise, and
nothing about sync being available that the policy's own *not in the released app yet* would
contradict. **No contact address** — the policy carries the one this project publishes, inside the
wrapper that stops Cloudflare rewriting it; a second copy would need both again. **Do not redirect
`/` to `/about`.** That breaks every installed icon and every offline launch, which is the failure
`sw.js`'s navigate branch exists to prevent.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/style-guide.md`
  - `docs/FERPA.md`
  - `tools/verify-deploy.mjs`
  - `tools/verify/about-page.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

<!-- ORCHESTRATOR: add anything else this work order needs open — a Roll Call! design doc, a
     sibling module whose convention this one must match. Delete this marker when done. -->

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
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
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

---

## 5. Done means these 6 lines, reported against one by one

1. `about.html` is at the root, says what Planbook does, links the privacy policy and opens the app, carries no script, manifest link or worker registration, and is not in `sw.js`'s `SHELL`. `tools/verify/about-page.mjs`.
2. Its visible text carries no repository vocabulary and its comment delimiters balance — `privacy.html`'s header leaked onto the deployed page once, and only an absence check sees that.
3. On a page `sw.js` controls, navigating to it renders the front page over the network, not the gradebook out of Cache Storage.
4. `node tools/verify-deploy.mjs` is green at `/about` against the live origin: titled *About Planbook*, not the app shell, linking the policy. *(Red before the deploy, correctly — measured 2026-09-25: `267560 B · titled About Planbook = false` — the shell.)*
5. 👤 The owner reads it on the iPad and on the laptop, cold, and the install steps are right on both — Safari's *Share → Add to Home Screen*, and the address-bar icon in Edge.
6. Both WO-3.18 runbooks name `https://planbook.hwgteach.com/about` as the Homepage.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

