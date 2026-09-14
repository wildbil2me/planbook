# WO-5.12 — A webmail door that is not a `mailto:` · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.12-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus**, on the work order's own merits: it rewrites the data-flow statement
in `privacy.html` and `docs/FERPA.md` — a sensitive surface in `ROUTING.md`, public prose a district
reviewer reads, and the first change to that shared statement since WO-8.12 made it a procedure. The
runner-up set aside: the code half (`composeUrl()`, one `planbook_` pref, a conditional `target`/`rel`)
is Codex-shaped on its own, but it is the smaller half and the Traps put the documents before the code.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.12 — A webmail door that is not a `mailto:`

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-13 · **Size** S · **Depends on** WO-5.7, WO-8.12

**Why it exists.** WO-5.11 was struck on 2026-09-12 because `mailto:` has no answer for a teacher
whose mail is Gmail in a browser tab: with Gmail registered as Chrome's `mailto:` handler, a
same-window link navigates the installed PWA to Gmail's bare compose page and loses the app, and a
`_blank` link opens a tab that sits blank on the `mailto:` URL and never reaches the handler at all
— read on the owner's laptop, installed app and plain tab alike. The app cannot see a browser's
protocol-handler table, so it cannot even tell the teacher what is happening. What is left is
*Copy the draft* (WO-5.7), which works and puts To and Subject into the paste for her to move by
hand. **That is the minority door treated as the fallback, and it is the wrong way round**: at a
Google Workspace school most teachers' mail *is* Gmail in a tab, and `mailto:` was only ever the
right door for the teacher with a desktop client. **Both webmails have a plain https compose URL** —
`https://mail.google.com/mail/?view=cm&fs=1&to=…&su=…&body=…` and
`https://outlook.office.com/mail/deeplink/compose?to=…&subject=…&body=…` — and an https link with
`target="_blank" rel="noopener"` from an installed PWA opens a normal browser tab reliably (it is
how the two document links in the About modal already work). Compose arrives with every field
filled and the PWA stays on the draft. No handler, no scope, no Google script fetched, no
`window.open()`.

**The shape.** One preference, *Where does your mail live?* — **Default mail app** · **Gmail in
the browser** · **Outlook on the web** — and `#outreachOpen`'s `href` built from it: `mailtoUrl()`
for the first, a compose URL for the other two. **The default is `mailto:` and the iPad sees
nothing change.** The preference is a fact about **this device's browser**, not about the teacher
and not about a student — the owner's laptop is Gmail and the owner's iPad is Mail, and one answer
for both would be wrong on one of them — so it lives in `localStorage` under the `planbook_` prefix,
through `src/prefs.js`, per that file's own rule about what a `planbook_` key may hold. It is not in
the year document and does not sync. **It is the same anchor.** WO-5.4's contact-log listener rides
`[data-outreach-handoff]`'s click and never reads the `href`, so the record is written for a webmail
send exactly as for a `mailto:` one, and a blocked draft is refused the same way — no `href` at all.
The `target` and `rel` go on **only when the `href` is https**: the struck WO-5.11 check asserts
their absence on a `mailto:` link and stays exactly as it is, because a `_blank` `mailto:` is still
the thing that reading found. `paintOpen()` sets and strips them with the `href` rather than as
static markup — which is the one place this reverses WO-5.11's reasoning, and it does so because
the attributes are now conditional on something the model knows.

**The privacy policy has to be revisited before this is built, and that is a deliverable and not a
Trap.** `privacy.html` § *What leaves your device, when, and to where* and `docs/FERPA.md`'s twin
carry the data-flow statement **word for word**, and its third item says Planbook *"hands it to your
own mail app."* With this built, choosing Gmail or Outlook puts the recipient's address, the subject
and the whole body of a message about a student **into the URL of a page on `mail.google.com` or
`outlook.office.com`**, and the browser sends that URL when the tab opens. Three things are true
about that and the documents have to say all three: it is the teacher's own click and not a request
the app makes on its own, so *"nothing leaves it on its own"* still holds; it is the same destination
the email is being sent to and the same path Chrome's own handler takes for a `mailto:`, so no new
party sees anything; and it is still a **change to what the statement says**, and a policy that says
*"your own mail app"* while the app opens a Google page is a policy that a district reviewer reads as
wrong. The two files are changed **in the same sitting** — both say so at their own tops — and the
sentence *"no third-party code of any kind"* stays true and stays as written, because a link is not
code. **WO-8.12 is a dependency for that reason**: this is the first work order since it landed to
change the shared statement, and it is the procedure for doing so. *(Item 3 in `docs/FERPA.md` still
reads "Not in the released app yet" and has been false since WO-5.3 landed on 2026-08-29; fix it in
the same pass rather than around it.)*

**Deliverables**
- The preference: three options, in the outreach modal beside the two doors rather than in a
  settings screen the teacher has to know exists, read and written through `src/prefs.js`, default
  *Default mail app*, absent key meaning the default.
- `src/outreach.js` gains `composeUrl(draft, mail)` beside `mailtoUrl()`, reading the same draft
  object so the doors cannot disagree, with the Gmail and Outlook shapes and their own encoding —
  the CRLF-vs-LF ruling WO-5.7 recorded is re-asked for each, and answered at the function.
- `paintOpen()` builds the `href` from the preference, and sets `target="_blank" rel="noopener"`
  when and only when that `href` is https.
- The length warning knows which door is open: `MAILTO_CEILING` is a `mailto:` fact, and each
  compose URL gets its own ceiling and its own sentence, or the warning says it cannot know.
- `privacy.html` and `docs/FERPA.md`: the data-flow statement's third item rewritten in both, word
  for word, to say what a webmail door does with the draft; FERPA's stale *"Not in the released app
  yet"* removed; `verify-deploy.mjs` still green against the live policy after deploy.
- `tools/verify/outreach.mjs`: the Gmail and Outlook `href` shapes asserted on the ready draft with
  the preference set each way, `target`/`rel` present on those and absent on `mailto:`, the
  contact-log entry written on a webmail click, and the blocked draft still carrying no `href`
  under every preference. `tools/README.md`'s count moves with it.
- `CACHE` bumped in `sw.js`.

**Acceptance**
- [ ] With the preference at *Gmail in the browser*, the ready draft's `href` is an https URL on
      `mail.google.com` carrying `to`, `su` and `body`, and the anchor carries `target="_blank"` and
      `rel` containing `noopener`; at *Default mail app* the `href` is the `mailto:` and the anchor
      carries neither — the WO-5.11 check is unchanged and green.
- [ ] A blocked draft has no `href` under all three preferences.
- [ ] A webmail click appends exactly one `contact` entry, the same as a `mailto:` click.
- [ ] The preference is a `planbook_` key and nothing about it reaches the year document —
      `wo-sweep.mjs`'s prefs claim still passes and the document is byte-identical either side of
      changing it.
- [ ] `privacy.html` and `docs/FERPA.md` carry the rewritten third item **word for word**, and
      `docs/FERPA.md` no longer says outreach is not in the released app.
- [ ] 👤 On the laptop, installed PWA, preference at *Gmail in the browser*: *Open in my mail app*
      opens a Gmail compose in a browser tab with recipient, subject and body filled and paragraph
      breaks intact, and the PWA window is still on the draft. **This is the line WO-5.11 could not
      close.**
- [ ] 👤 On the iPad, with the preference untouched, nothing has changed: Mail opens filled, no tab
      and no window left behind.
- [ ] 👤 Preference at *Outlook on the web*, in any browser with an Outlook account: compose opens
      filled. *(The owner has no Outlook account on hand; if this cannot be read, the option ships
      behind the same reading as Gmail's and the line says so rather than being ticked.)*

**Traps** — **Do not fold the preference into the year document because "it is the teacher's
setting."** It is the device's, and a synced answer is wrong on one of the two devices by
construction. **Do not put `target="_blank"` back on a `mailto:` href** — that is the struck work
order, and the check that keeps it out is still there and still right. **Do not reach for
`window.open()`** for the https door either; the anchor is the mechanism and the About modal's two
links are the precedent. **Do not detect Gmail, Chrome, or a handler** — the app cannot, and a
question the teacher answers is more honest than a guess about her browser. **And do not build the
code before the two documents are rewritten**: the data-flow statement is a public promise, the
policy is the page Google fetches during OAuth verification (WO-3.18), and the sitting that ships a
webmail door with the old sentence still live has published a policy that is wrong for as long as
the gap lasts.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/FERPA.md`
  - `src/outreach.js`
  - `src/prefs.js`
  - `tools/README.md`
  - `tools/verify/outreach.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **The two doors as they stand** — `src/outreach.js` lines ~247–376: `encodeField()` (CRLF before
  encoding, RFC 6068), `mailtoUrl()`, the `MAILTO_CEILING` essay (2,000 is a `ShellExecute` fact and
  says so), and `draftText()` with the LF ruling. `composeUrl(draft, mail)` goes beside these and
  re-asks the line-break question **per door, at the function** — Gmail's `body=` and Outlook's are
  query strings on an https URL, not a `mailto:`, so RFC 6068's CRLF reason does not automatically
  carry; decide, and write the reason down where the other two are.
- **Where the href is painted** — `src/outreach-view.js`: `outreachModel()` (~line 490–515) builds
  `url`, `length`, `long`; `paintOpen()` (~680–708) sets/strips `href` and writes the length
  warning; `recordHandoff()` (~1199–1320) is the contact-log write and **reads the model, not the
  anchor** — do not touch it. `src/shell.js` ~2875 is the `[data-outreach-handoff]` click listener.
- **The anchor** — `index.html` ~2690–2725: the `#outreachOpen` comment already records the WO-5.11
  reading. Extend that comment; do not delete it. The three-way preference control lives in this
  modal beside the two doors — use markup the panel already has (a segmented/pill pattern from this
  file), 44px under `pointer: coarse`, no new visual language.
- **The preference** — `src/prefs.js`: `PREF_DEFAULTS` is the whitelist; one new key with a comment in
  the voice of the others saying *why it is this device's fact and not the document's*. Absent key ==
  default. `wo-sweep.mjs` ~line 224–258 greps that no `localStorage` access exists outside prefs.js.
- **The documents** — `privacy.html` lines 268–302 and `docs/FERPA.md` lines 80–101 hold the
  statement. Both carry an HTML comment at the top of the section saying they change together.
  The rewritten item 3 must be the **same words** in both (FERPA's list is Markdown, the policy's is
  HTML — the sentence is what matches). Item 2 (sync) keeps its own "not yet" line — only item 3's
  is false. Do not touch "no third-party code of any kind". `privacy.html` also has an
  `<!--email_off-->` guard around the contact address; leave it.
- **The harness** — `tools/verify/outreach.mjs`: the WO-5.11 check is ~line 480–523 (reads `target`
  and `rel` off the anchor already) — leave it byte-identical and add the new checks beside it.
  `tools/README.md:1213` is the one sentence holding the `check()` count (**1333** now) — `wo-sweep`
  goes red if it drifts from the real count, and it is the one sweep line that goes red on work
  being *done* rather than wrong. `sw.js:37` is `CACHE` (`planbook-shell-v114`).
- **Order of work is a Trap, not a preference**: documents first, then code. Commit nothing that
  ships the webmail door with the old sentence live.
- **Encoding facts to check, not assume**: Gmail's `view=cm` reads `to`, `su`, `body`, `cc`;
  Outlook's `deeplink/compose` reads `to`, `subject`, `body`, `cc`. Both take
  `encodeURIComponent`-style values. Neither has a documented URL ceiling the way `ShellExecute`
  does — browsers cap at roughly 2 MB (Chrome) but Gmail has been observed to drop very long bodies;
  the Deliverable allows "the warning says it cannot know" — take that honest answer over an
  invented number, and say so at the constant.
- **Mutation proof, then revert by name** (`git checkout -- <file>`, never `git checkout .`) and
  `grep -rn MUTATION` over your own files before writing the result. Two worth running: `rel`
  dropped on the https href (the new check must go red), and `target` added to the `mailto:` branch
  (the WO-5.11 check must go red). Tabulate in `TESTING.md` § WO-5.12.
- **Result file**: `.claude/dispatch/WO-5.12-result.md`, written last. Cite the harness's own
  `N checks · N passed` line and the sweep's summary line verbatim; state the three 👤 lines as
  untouched and name what the owner should do on each device.

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

## 5. Done means these 8 lines, reported against one by one

1. With the preference at *Gmail in the browser*, the ready draft's `href` is an https URL on `mail.google.com` carrying `to`, `su` and `body`, and the anchor carries `target="_blank"` and `rel` containing `noopener`; at *Default mail app* the `href` is the `mailto:` and the anchor carries neither — the WO-5.11 check is unchanged and green.
2. A blocked draft has no `href` under all three preferences.
3. A webmail click appends exactly one `contact` entry, the same as a `mailto:` click.
4. The preference is a `planbook_` key and nothing about it reaches the year document — `wo-sweep.mjs`'s prefs claim still passes and the document is byte-identical either side of changing it.
5. `privacy.html` and `docs/FERPA.md` carry the rewritten third item **word for word**, and `docs/FERPA.md` no longer says outreach is not in the released app.
6. 👤 On the laptop, installed PWA, preference at *Gmail in the browser*: *Open in my mail app* opens a Gmail compose in a browser tab with recipient, subject and body filled and paragraph breaks intact, and the PWA window is still on the draft. **This is the line WO-5.11 could not close.**
7. 👤 On the iPad, with the preference untouched, nothing has changed: Mail opens filled, no tab and no window left behind.
8. 👤 Preference at *Outlook on the web*, in any browser with an Outlook account: compose opens filled. *(The owner has no Outlook account on hand; if this cannot be read, the option ships behind the same reading as Gmail's and the line says so rather than being ticked.)*

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

