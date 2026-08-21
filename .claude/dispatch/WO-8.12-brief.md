# WO-8.12 — the privacy policy and the FERPA document · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-8-packaging.md`
**Report to** `.claude/dispatch/WO-8.12-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude, Opus tier**. The deciding signal is that this work order
sits in two Claude-only columns at once — it produces public legal and teacher-facing prose, and
`ROUTING.md` names *"anything in `docs/FERPA.md`"* and accommodation/medical data explicitly on the
never-delegate list; the accommodation clause here is the strongest form of that. The runner-up I set
aside: the `sw.js` navigate-branch fix in trap 1 is fully specified and Codex-shaped in isolation, but
it is one deliverable out of six and the other five are judgment about what may truthfully be claimed
in public with the project's name on it.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-8.12 — the privacy policy and the FERPA document

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-20 · **Size** M · **Depends on** WO-8.7 — the domain and the host
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
- [ ] The policy is **live at the verified domain and says the three things WO-3.18 names**, in plain
      words — fetched over the wire rather than asserted from the repo. `verify-deploy.mjs` is the
      only check here that reads the live origin.
- [ ] Navigating to the policy on a device that **already has the service worker installed** renders
      the policy and not the app. Force-quit before reading, per `CLAUDE.md`.
- [ ] `docs/FERPA.md` **has a section on accommodation and medical data, and one on backups** — and
      the backup section says the JSON contains IEP and medical data in as many words.
- [ ] Nothing in either document claims a behaviour the app does not have. Walk every sentence that
      makes a promise and name the code that keeps it.
- [ ] The two documents agree on every fact, and neither restates the other's argument.
- [ ] Both are readable by a principal, not only by a developer.
- [ ] 👤 The owner has decided what contact appears on a public page, and it is what the policy says.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Open these too — the work order names all of them and each one is load-bearing:**

- `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\docs\FERPA.md` — Roll Call!'s own,
  **89 lines under six headings**, and the work order says it is *the shape to lift*: what data the app
  handles · where it lives and who can see it · what the vendor receives: nothing · how this maps to
  FERPA · practical safeguards and one honest caveat. Take the structure and the stance. **The facts
  differ here and Planbook's are stronger** — Roll Call! has an Apps Script bridge and Google Sheets
  storage; Planbook has neither. Do not carry a sentence across that is true over there and false here.
- `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\docs\SCOPES.md` — read beside it for
  **how a scope argument is written for a non-engineer**. That register is the deliverable.
- `docs/data-model.md` § Accommodations — **rule 4 is the source of the third Acceptance line.** It says
  the downloadable JSON now contains IEP and medical data, that this is the correct posture and the same
  one a paper folder has, and that `docs/FERPA.md` must address it directly rather than only discussing
  grades. Quote the posture; do not soften it.
- `docs/sync.md` — the `drive.file` argument in its existing form. The policy's Drive sentence must not
  disagree with it.
- `sw.js` — **trap 1 lives at the `req.mode === 'navigate'` branch** (currently
  `event.respondWith(caches.match(INDEX).then((hit) => hit || fetch(req)))`, which never looks at the
  request path). Read the whole header comment above `SHELL` before touching the file — rule 2 there,
  the apostrophe warning, and the note explaining why `./index.html` is deliberately not on the list.
  `CACHE` is currently `planbook-shell-v91` and **must be bumped in the same commit**.
- `index.html` — the backup panel's existing accommodation disclosure. `CLAUDE.md` calls it *"the weaker
  half of the obligation"* until this work order lands; the new document is the other half and the two
  must say the same thing.
- `tools/verify-deploy.mjs` — the only check that reads the live origin, named in Acceptance line 1.

**Two things this brief settles for you, so you do not have to guess:**

1. **The contact line (trap 4) is the owner's, and has not been answered yet.** Acceptance line 7 is 👤
   and will stay `- [ ]`. **Do not invent an address**, and do not ship the policy silently missing one.
   Write the policy with the contact section present and its value a single, unmissable, clearly-marked
   placeholder — one token, appearing exactly once, easy to grep and easy for the owner to replace with
   one edit — and say in your report exactly what the owner has to change and where. The repo's own
   precedent for why this cannot be settled here is `plans/work-orders/phase-3-gradebook.md` around
   line 831: *"An address in a public file is a spam and phishing target, and unlike a client id it is
   not protected by an origin list."*
2. **You cannot deploy, and Acceptance lines 1 and 2 cannot close on your run.** Line 1 wants the policy
   fetched over the wire from `https://planbook.hwgteach.com/`; line 2 wants a force-quit on an installed
   iPad. Build both so they *can* pass — get the file into the tree at the right path, fix the navigate
   branch, bump `CACHE` — then report them as owed to a deploy and to hardware. **Do not tick either.**
   If `tools/verify-deploy.mjs` needs a new check to make line 1 answerable after the deploy, adding it
   there is in scope and is the right place; a new standalone script is not.

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

---

## 5. Done means these 7 lines, reported against one by one

1. The policy is **live at the verified domain and says the three things WO-3.18 names**, in plain words — fetched over the wire rather than asserted from the repo. `verify-deploy.mjs` is the only check here that reads the live origin.
2. Navigating to the policy on a device that **already has the service worker installed** renders the policy and not the app. Force-quit before reading, per `CLAUDE.md`.
3. `docs/FERPA.md` **has a section on accommodation and medical data, and one on backups** — and the backup section says the JSON contains IEP and medical data in as many words.
4. Nothing in either document claims a behaviour the app does not have. Walk every sentence that makes a promise and name the code that keeps it.
5. The two documents agree on every fact, and neither restates the other's argument.
6. Both are readable by a principal, not only by a developer.
7. 👤 The owner has decided what contact appears on a public page, and it is what the policy says.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

