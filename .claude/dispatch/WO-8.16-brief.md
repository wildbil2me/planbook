# WO-8.16 — a first-time visitor meets the front page, not an empty gradebook · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-8-packaging.md`
**Report to** `.claude/dispatch/WO-8.16-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override) — on its own merits, not by fallback. The deciding signals are a new visual surface (`src/front-door.css` from the mockup's pending section) and teacher-facing prose on the boot path of every launch, with judgment Traps (decision in the app not the worker, probe must not `open()`, no warning screen, restore must stay reachable). The runner-up — Codex, for the probe as a small read-only store export — was set aside because the probe is a fraction of the work and the rest is convention and taste; no Codex probe was run.

**Traps the orchestrator wants named up front (read the work order for the reasoning):**
- The six **Ruled — 2026-10-04** lines are decisions, not suggestions. In particular: no new `planbook_` key; `getPref('openYear')` first with **no await** before the decision; `indexedDB.databases()` only when it is absent; `databases()` missing/throwing opens the app.
- The decision runs **before `store.boot()`** (`src/shell.js` ~line 4278). A probe that calls `connect()`/`open()` is the defect.
- `sw.js` is not taught to choose. If you touch any file in `SHELL` (`index.html` counts), bump `CACHE` in `sw.js`; a new `src/front-door.*` file in the shell must be added to `SHELL` too, or the installed app loses it offline.
- The skip flag is loopback-only, modelled on `hostAllowsSignIn()` in `src/auth.js`. Existing `verify-shell.mjs` sections pass it; do **not** seed `planbook_openYear` instead. Your new cold section proves: door appears, no `planbook` database created, no `localStorage` key set, and *Use it in this browser* lands on home with *Restore* on it.
- `about.html` words are not retyped (Deliverable 3). If you lift sections into the shell, `wo-sweep.mjs` and `verify-deploy.mjs` may have assertions on `about.html` — read them before moving text.
- `TESTING.md` § WO-8.16 under Phase 8 is a deliverable (§ 5). The 👤 line stays `- [ ]`.
- If you mutate to prove a check bites, mark it `MUTATION` and revert before writing anything else (`AGENTS.md`).


---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-8.16 — a first-time visitor meets the front page, not an empty gradebook

**Ship** 4 · **Status** 🤖 CLAIMED — 2026-10-09 · **Size** M · **Depends on** WO-8.15 — the words it shows ·
**Blocks** WO-8.6 — onboarding's path starts at *install*, and this is the step before it
**Closes roadmap** *(no box. It is the front half of Phase 8's "Onboarding: install → marking
attendance with no documentation", and WO-8.6 closes that one.)*

**Booked 2026-09-25**, owner-directed, the same sitting as WO-8.15.

**Why it exists.** A stranger who types the domain lands in the app with nothing in it. WO-8.15
fixes that for Google by giving the form a different URL; it does nothing for a teacher a colleague
sent the bare address to. **And the stranger on an iPad is the one this project already knows can
lose a term of grades**: `CLAUDE.md` § Data — iOS evicts a non-installed site's IndexedDB after about
a week of non-use, so *the install prompt is data safety*. The install banner says so, but only once
the teacher is already using the app in a tab, which is the state it is warning about.

**The ruling this work order starts from: a front door, not a gate.** Installing cannot be made a
precondition. Firefox on the desktop cannot install a web app at all, school-managed Chromebooks
often have installing switched off, and a teacher on either is the customer *the app must work fully
signed-out* exists to keep. Chrome and Edge on a laptop do not evict the way iOS Safari does, so a
gate there costs something and buys nothing. **A PWA is installed from the page it is**, so the
front door can only explain and send the teacher into the app to install it.

**Deliverables**
- **`/` shows WO-8.15's front page content to a visitor who is both not running installed**
  (`src/install-banner.js`'s own `display-mode: standalone` / `navigator.standalone` test — one
  asker, not two) **and has no school year stored.** Anybody installed, or with data, goes straight
  into the app exactly as today. *"No school year stored" means no year at all — not
  `untouchedYear()`*, ruled below; the probe that answers it is ruling 3 and trap 2.
- **A way past it that is always on the screen** — *Use it in this browser* — and the install steps
  for the device the visitor is on.
- **The words come from `about.html` and are not retyped.** How — fetched, or the front page's
  sections lifted into the shell with `about.html` reduced to them — is the implementer's to argue
  at dispatch, against trap 1.
- **Surface — read [`design/mockups/front-door.html`](../../design/mockups/front-door.html) first**
  (drawn 2026-10-01). It settles the door's shape per device — install steps then the way past on
  iPad Safari, the browser path as the primary on a laptop, no primary on the iOS panel — and styles
  it in `design/mockups/proposed-phase8.css` § FRONT DOOR, bound for `src/front-door.css`.

**Ruled — the owner, 2026-10-04** *(this block was* Open — the owner's before dispatch *until then;
the pre-dispatch read found that `store.boot()` changes the answer to two of its three lines)*
1. **The condition is "no year stored", not "untouched year".** `store.boot()` → `createYear()`
   saves a rev-1 year on the first launch of a fresh origin, so the first pass through the door
   leaves a year behind and the door does not return. Someone who looked once and left without
   doing anything will not see it again; they have seen it once, and that is accepted. The door
   therefore never asks `untouchedYear()` and never depends on its six-fact proof.
2. **_Use it in this browser_ is not remembered — no new preference.** It was proposed as a
   `planbook_` key; under ruling 1 the year `boot()` saves is the memory, and a preference would be
   a second record of the same fact. *(`design/mockups/front-door.html`'s caption on Open line 2
   still reads "proposed: yes, once" — superseded here; the drawing is not re-cut for a caption.)*
3. **The probe is the `planbook_openYear` preference first, then `indexedDB.databases()`.** The
   preference is read through `getPref('openYear')` — `src/prefs.js` is the only door to
   `localStorage`, and `wo-sweep.mjs` fails a second one. The preference present → a year exists → straight into the app, with no await before the decision,
   so nobody who has used the app before waits on a probe. Absent → `indexedDB.databases()`, and the
   door only if `planbook` is not among the names. **`databases()` missing or throwing opens the app
   — doubt draws no door**, because this is a front door and not a gate. It lives in
   `src/store.js` as one more read-only export, so the store stays the one module that knows
   `DB_NAME`. Both halves of an iOS eviction clear together (script-writable storage goes as a
   unit), which is what lets the preference stand in for the database.
4. **iPad Safari: the door, not a gate.** Install steps first, *use it in this browser* below them,
   as drawn. No browser path at all would stand between trap 4's teacher and *Restore*.
5. **A browser that cannot install: its own words where it can be detected, the laptop door where it
   cannot.** Firefox is told apart. A Chromebook with installing switched off is not detectable and
   gets the laptop door. **Do not infer it from `beforeinstallprompt` not firing** — that event's
   timing is the browser's engagement heuristic, and its absence proves nothing.
6. **The harness passes the door with a loopback-only URL flag**, ruled under trap 5.

**Acceptance**
- [ ] A cold, non-installed visit with no stored year shows the front door; an installed launch, and
      a browser visit to a device that already holds a year, both open the app with no flash of it.
- [ ] The door is never the only way forward: *use it in this browser* is present on every device.
- [ ] An offline launch of the installed app is unchanged — `/` is still answered from Cache Storage.
- [ ] Detecting "no school year stored" writes nothing: no IndexedDB database is created by the probe
      and no `localStorage` key is set until the teacher chooses.
- [ ] 👤 On the iPad, in Safari and then installed, and on the laptop in Edge, the owner walks in
      cold and meets the right screen each time.

**Traps** — **1. The decision is made in the app, never in the worker.** The navigate branch answers
`/` from the cache so an installed app opens offline; teaching the worker to choose between two
documents is WO-8.12's defect in reverse. **2. Opening IndexedDB creates it.** A probe that calls
`indexedDB.open()` on a fresh origin leaves an empty database behind, and whatever asks "has this
device got data" next reads that. **And the store knows nothing before it opens one** —
`boot()`'s first act is `connect()`, which is that `open()`, and on a fresh origin it then saves a
year. So the decision is made **before `store.boot()`**, by ruling 3's probe — never `open()` to find
out. The obvious-looking shortcut, "ask the store", is the defect. **3. It is not a warning screen.** WO-8.6's Acceptance says the onboarding
path has none; a front door that leads with *you could lose your data* is one. The caution is one
paragraph, on iOS, beside the steps that fix it. **4. "No school year stored" is not "new here".** A
teacher who has cleared a device to restore a backup onto it has no year and is not a stranger; the
door must not stand between her and *Restore*. *Use it in this browser* landing on the home screen,
where restore already is, is the proposed answer — check it rather than assume it. **5. The harness
is a cold visitor on every run.** `tools/verify-shell.mjs` launches headless Edge on a fresh
`--user-data-dir`: not installed, no year — exactly the door's condition, so every existing check
lands on the door unless it is passed. Pass it with a URL flag (`?door=skip` or the implementer's
name for it) **read only on a loopback host**, the way `hostAllowsSignIn()` in `src/auth.js` gates
on the hostname, so the deployed app cannot be told to skip it. Existing sections pass the flag; a
new section runs without it and proves the door appears cold, that it creates no database, and that
*use it in this browser* lands on the home screen with *Restore* on it. **Do not seed the
preference instead** — a seeded `planbook_openYear` passes today and silently stops passing the
day the probe order changes. **6. "No flash" is a hold on the paint**, not a style: the probe's
async half runs before anything is drawn, and it runs only on a device with no preference, which is
the only device that can be a stranger.

**Out of scope, and unbooked** — asking the browser to keep this site's storage
(`navigator.storage.persist()`, called nowhere in `src/` today). It is a cheap second belt for a
teacher who stays in a Chrome or Edge tab and does not stop iOS's eviction, so it is not this work
order's fix; it is worth a row of its own if the owner wants one.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/front-door.html`
  - `design/mockups/proposed-phase8.css`
  - `src/auth.js`
  - `src/install-banner.js`
  - `src/prefs.js`
  - `src/store.js`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/shell.js` — the boot sequence around `await store.boot()`; the door is decided before it.
- `src/first-run.js` — the empty-state doors (Drive / backup) that *Use it in this browser* lands beside; trap 4's teacher uses them.
- `about.html` and `sw.js` (`SHELL`, `CACHE`, the navigate branch).
- `docs/sync.md` is **not** needed.

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
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
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

1. A cold, non-installed visit with no stored year shows the front door; an installed launch, and a browser visit to a device that already holds a year, both open the app with no flash of it.
2. The door is never the only way forward: *use it in this browser* is present on every device.
3. An offline launch of the installed app is unchanged — `/` is still answered from Cache Storage.
4. Detecting "no school year stored" writes nothing: no IndexedDB database is created by the probe and no `localStorage` key is set until the teacher chooses.
5. 👤 On the iPad, in Safari and then installed, and on the laptop in Edge, the owner walks in cold and meets the right screen each time.

**Write `TESTING.md` § WO-8.16 — it is a deliverable, not a permission.** Add `### WO-8.16 — a first-time visitor meets the front page, not an empty gradebook` under `## Phase 8 — 1.0 packaging`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-8.16` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

