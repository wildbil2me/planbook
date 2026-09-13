# WO-5.11 — A web mail handler takes the PWA window with it · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.11-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus**. `ROUTING.md` puts all of Phase 5 in the Claude column
as a property of the work, and this one's Traps are judgment rather than mechanics — *do not reach
for `window.open()`*, *`noopener` is not optional* — plus a deliverable that is a reasoned paragraph
at a point of departure in `src/outreach-view.js`'s header. Set aside: on arithmetic alone it is
Codex-shaped (XS, one clean run plus one mutation run ≈ 8.8 min), but a budget fit never overrides
the Claude column.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.11 — A web mail handler takes the PWA window with it

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-12 · **Size** XS · **Depends on** WO-5.7

**Why it exists.** `#outreachOpen` is a plain `<a href="mailto:…">` with no `target`, and
`src/outreach-view.js`'s header gives three reasons it is a link and not a scripted navigation —
the second being that *iOS opens a `mailto:` link more reliably than a scripted navigation*. All
three hold. What none of them considered is a **web** handler for the scheme. On 2026-09-12 the
owner registered Gmail as Chrome's `mailto:` handler on the laptop (the setting is per browser
profile and Gmail had never been allowed to ask), clicked *Open in my mail app* from the installed
PWA, and the app window **navigated** to `mail.google.com/mail/?extsrc=mailto&url=…` — Gmail's
bare compose-only page, outside the app's scope, no address bar, Planbook gone from under it. The
owner's words: *"it opens it in a broken email window within the PWA."* With an OS client the
scheme never touches the window, which is why WO-5.3's two hardware readings did not see this.

**The fix is one attribute** — `target="_blank" rel="noopener"` on the anchor. A web handler then
opens in a real browser tab, with To, Subject and body filled, and the PWA stays on the draft. An
OS handler ignores `target` entirely, so Outlook and Mail on the desktop see no change. **The whole
cost is the iPad**: Safari has a history of leaving an empty tab or window behind for a `mailto:`
carrying `_blank`, and the iPad is the device that decides go-live. If it does that here, this work
order reverses itself and says so — an honest outcome, not a failure of the reading.

**It is a work order rather than a line typed in the moment for two reasons.** The 👤 reading above
is the whole of it; nothing on a desk can take it. And the contact-log listener in `src/shell.js`
rides this anchor's click, WO-5.9's mutation round proved the browser follows the `href` even when
that listener throws, and `tools/verify/outreach.mjs` asserts the `href` — a new attribute on the
same element needs a check beside those so a later hand cannot strip it back to the shape that
looked complete for two weeks.

**Deliverables**
- `target="_blank" rel="noopener"` on `#outreachOpen` in `index.html`, present whether or not the
  draft is ready — an anchor with no `href` is not a link and the attributes do nothing on it.
- The three-reason comment in `src/outreach-view.js`'s header gains a fourth, at the point of
  departure: what a web handler does to a same-window `mailto:`, and why `_blank` is safe for an OS
  handler.
- A check in `tools/verify/outreach.mjs` beside the `href` check, asserting `target === '_blank'`
  and `rel` containing `noopener` on the ready draft; `tools/README.md`'s count moves with it.
- `CACHE` bumped in `sw.js` — `index.html` is in `SHELL`.

**Acceptance**
- [ ] 👤 On the laptop, with mail.google.com registered as Chrome's `mailto:` handler, *Open in my
      mail app* from the **installed** PWA opens a Gmail compose in a browser tab with recipient,
      subject and body filled, and the PWA window is still showing the draft.
- [ ] 👤 On the iPad, the same tap opens Mail with the draft filled and leaves **no blank tab and no
      blank window** behind, in Safari or in the installed app. **This is the line that decides
      it** — if it fails, the attribute comes out and the failure is written at the point of
      departure.
- [ ] The contact-log entry is still written on the click: the existing check in
      `tools/verify/contact-log.mjs` passes unchanged.
- [ ] A blocked draft is still not a link — no `href` — and the new check asserts the attributes
      only on a ready one.
- [ ] The mutation — the attribute removed — turns exactly the new check red.

**Traps** — **Do not reach for `window.open()` or a click handler that assigns `location`.** The
header's second reason is the one that bites: a scripted navigation on iOS is what the anchor exists
to avoid, and `preventDefault()` on this click is what WO-5.4's listener deliberately never calls.
The attribute keeps the browser's own navigation and changes only where it lands. **`rel="noopener"`
is not optional** — without it the new tab holds a `window.opener` onto a page carrying a student's
draft. **And nothing here detects the handler, offers to register Gmail, or explains a Chrome
settings page.** The app cannot see a browser's protocol-handler table, and the webmail teacher's
documented door is WO-5.7's *Copy the draft*; this work order only stops the other door taking the
app with it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/outreach-view.js`
  - `src/shell.js`
  - `tools/README.md`
  - `tools/verify/contact-log.mjs`
  - `tools/verify/outreach.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `index.html` — the anchor is at ~line 2698 (`id="outreachOpen" data-outreach-handoff`), with two
  comment blocks above and beside it that already argue *why a link* and *why the hook does not
  intercept*. The new attributes go on that element in the static markup; read both comments first
  and extend the first one with one sentence rather than writing a third.
- `src/outreach-view.js` § "THE HANDOFF IS A REAL LINK" (~line 111) — the three-reason list. The
  fourth reason goes **in that list**, at the point of departure, and must say both halves: what a
  web handler does to a same-window `mailto:` (Chrome navigated the installed PWA to
  `mail.google.com/mail/?extsrc=mailto&url=…`, outside scope, no address bar) and why `_blank` is
  safe for an OS handler (the scheme never touches the window, so `target` is ignored). Say plainly
  that the iPad reading is the one that can reverse it. `paintOpen()` sets and removes `href` — check
  it does not rebuild the element or strip attributes it did not set.
- `src/shell.js` ~line 575 — the delegated listener on `[data-outreach-handoff]`. **Do not touch it.**
  It exists in the brief so you know what rides the click.
- `tools/verify/outreach.mjs` — `DRAWN` (~line 104) reads `href` / `hasHref` / `aria-disabled` off
  the anchor. Add `target` and `rel` to that snapshot, then one `check()` beside the existing
  `href` check on the **ready** draft asserting `target === '_blank'` and `rel` contains
  `noopener`. Add nothing on the blocked draft beyond what the fourth Acceptance line needs — the
  attributes are present either way; the claim is only that a blocked draft still has no `href`,
  which the existing `hasHref` check already makes.
- `tools/README.md` ~line 1213 — **"The harness holds N `check()` call sites"**. `wo-sweep.mjs` § 22
  diffs that number against the run; a new `check()` without the bump turns the sweep red. Count with
  the sweep, not by hand. Also add a WO-5.11 entry to the README's per-work-order harness notes,
  matching the shape of the WO-5.7 one — state the mutation and the exact check it turns red.
- `sw.js` line 37 — `CACHE = 'planbook-shell-v113'`; bump to `v114`.
- `TESTING.md` — add a § WO-5.11 block: the two 👤 lines as they are written, **unticked**, and the
  desk-side lines your run closed.

**Two traps the work order states and one it does not.**

1. The **mutation round** is *one* attribute removed from `index.html` (drop `target`, or drop `rel`
   — pick one, state which) → run `node tools/verify-shell.mjs` → confirm **exactly** the new check
   is red and nothing else → `git checkout -- index.html` **by name**, never `git checkout .`.
   Stage your other edits before the mutation, or the revert eats them. Then re-run clean. Report
   both run totals.
2. **A dead dispatch leaves the mutation in the tree.** Do the mutation last, after every doc edit,
   and write `MUTATION` in a comment on the mutated line while it is in — that is the word
   `grep -rn MUTATION` looks for on recovery.
3. **Not in the work order:** `rel="noopener"` on an anchor with no `href` is harmless and stays;
   do not make `paintOpen()` toggle `target`/`rel` with the `href`. The Deliverable says *present
   whether or not the draft is ready* and means static markup.

**Budget expectation.** Two harness runs (~4.4 min each) plus a mutation revert. If `verify-shell`
cannot run in your sandbox, say *could not run* and do not tick — it is re-run locally before any
box closes.

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

## 5. Done means these 5 lines, reported against one by one

1. 👤 On the laptop, with mail.google.com registered as Chrome's `mailto:` handler, *Open in my mail app* from the **installed** PWA opens a Gmail compose in a browser tab with recipient, subject and body filled, and the PWA window is still showing the draft.
2. 👤 On the iPad, the same tap opens Mail with the draft filled and leaves **no blank tab and no blank window** behind, in Safari or in the installed app. **This is the line that decides it** — if it fails, the attribute comes out and the failure is written at the point of departure.
3. The contact-log entry is still written on the click: the existing check in `tools/verify/contact-log.mjs` passes unchanged.
4. A blocked draft is still not a link — no `href` — and the new check asserts the attributes only on a ready one.
5. The mutation — the attribute removed — turns exactly the new check red.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

