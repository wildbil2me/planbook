# WO-8.10 — the app cannot say which build it is running · implementer's report

**Route** Claude (work-order-implementer), Opus tier · **Date** 2026-08-15
**Verification runs** `verify-shell.mjs` **778 of 778, 0 failed, 0 skipped, 254s, exit 0** ·
`wo-sweep.mjs` **20 checks · 17 passed · 1 failed · 2 to review, exit 1** — the one failure is
§9 asking for the `CACHE` bump this work order forbids me to make. It is **mine, not pre-existing**,
and §4 below is the whole of it.

---

## 1. Against the five Acceptance lines

### 1. On a freshly loaded app, the About modal names the running cache and it matches `sw.js`'s `CACHE` — **met**

Verified in `verify-shell.mjs`'s new section (three checks), on a page the harness had been driving
for three minutes:

```
PASS | a page this harness has been driving for three minutes holds exactly one shell cache, and it
       is the one sw.js names  :: caches.keys() filtered to this app = ["planbook-shell-v64"],
       sw.js CACHE = planbook-shell-v64
PASS | the About modal names the cache the browser is actually holding, and does not say there is
       more than one  :: names = ["planbook-shell-v64"], class = "build-caches",
       line = "Running from planbook-shell-v64 — one stored copy on this device, which is what it
       should be."
```

The modal is opened by clicking the real *About Planbook* button in the header, and `CACHE` is
**parsed out of `sw.js` at run time** — no version number is typed into the harness. A third check
(`sw.js still declares a CACHE string this section can read`) guards that parse against the vacuous
pass, the way the SHELL parse at the head of the file already does.

**A finding worth recording:** the harness's browser really does run the service worker.
`http://127.0.0.1:<port>` is a secure context, so `sw.js` registers, activates and precaches within
about 1.5s of a run's first navigation. I measured that with a throwaway probe **before** relying on
it, because the section would otherwise have been asserting over an empty Cache Storage. This is the
first block in that file to read a service worker's work; `tools/README.md`'s *"it has never seen a
service worker"* is still true as written (nothing installs an app, inspects a registration, or
asserts anything about `fetch` interception) and my section's header comment says so precisely.

### 2. A second cache planted by hand — the modal says there is more than one and names both — **met**

The harness plants it itself (`caches.open('planbook-shell-v1')` from the page) and clears it in a
`finally`:

```
PASS | with a second cache planted, the modal SAYS there is more than one BEFORE it lists them
       :: "more than one" at 2, first cache name at 59, line = "⚠ More than one copy of Planbook is
       stored on this device: planbook-shell-v64 and planbook-shell-v1. The last update did not
       finish, so parts of what you are looking at may still be coming from the older one. Quit
       Planbook from the app switcher and open it again — if this line still names more than one,
       send this screen to whoever set Planbook up."
PASS | and it names both of them, in the order Cache Storage answers
PASS | that line is drawn in the style guide's caution palette rather than left in the quiet hint
       grey  :: class = "build-caches warn", background = rgb(255, 248, 230), color = rgb(138, 109, 26)
PASS | clearing that cache again puts the line back to one name with the caution gone
```

**This check was vacuous when I first wrote it, and a mutation is what found it** — see §3.

### 3. With Cache Storage unavailable, the line says so rather than going blank — **met**

Both shapes the brief names, with the *environment* changed rather than the app's own code path
deleted: `window.caches` redefined to `undefined` (the non-secure-origin shape), and redefined to an
object whose `keys()` rejects (the private-window shape). The original property descriptor is kept
and restored in the `finally`.

```
PASS | with Cache Storage absent the line SAYS SO rather than going blank  :: line = "This browser
       will not let Planbook see its own stored copies, so it cannot tell you which build it is
       running. That is not the same as none being stored."
PASS | and with the read REJECTING — the private-window shape — it says which failure it was, in
       different words from the absent-API line and with the browser's own reason on it
       :: line = "Planbook could not read its stored copies on this device, so it cannot tell you
       which build it is running. That is not the same as none being stored. The browser said:
       refused by tools/verify-shell.mjs"
```

The two sentences are asserted to **differ from each other**, so a build that collapsed both into one
message goes red. Both stay in the quiet hint style: the caution amber has to mean exactly one thing
for a teacher to act on it, and *"Planbook cannot answer"* is a different fact from *"Planbook has
answered and the answer is bad"*. That is a decision I made; it is argued at the rule in
`src/shell.css` and in `paintBuildLine()`'s header.

There is a **fifth** state the work order does not name and the app needed anyway: **zero** caches
(*"No copy of Planbook is stored on this device yet, so it will not open without a network…"*). It is
reachable — a first load before the worker finishes, or a browser that never registered one — and it
is the state a blank line would be mistaken for. It has no check of its own; it is exercised by hand
in the state probe recorded in §3 and its absence from the harness is the one gap in my coverage I
would name if asked.

### 4. `verify-shell.mjs` covers both states, planting and clearing the second cache itself — **met**

Twelve `check()` call sites in a new section at the very foot of the file, none in a loop, none a
fixture-guard failure arm, so twelve executed results: **769 → 781 call sites, 766 → 778 executed.**
Clean-up is in a `finally` covering a throw out of any check — the plant and both `window.caches`
overrides — and a final check asserts Cache Storage is byte-for-byte the list the section found:

```
PASS | this section handed Cache Storage back exactly as it found it  :: caches.keys() filtered to
       this app = ["planbook-shell-v64"], found at the top of this section = ["planbook-shell-v64"]
```

One clause is static, in Node: **no file the browser loads may contain a versioned cache name**,
`sw.js` excepted (43 served files read). That is the Traps line as a grep, and it lives beside the
measurements rather than in `wo-sweep.mjs` because it is half of one claim — nothing types the name,
and the thing that reads it moves when Cache Storage moves.

`tools/README.md` records 781 (the sentence `wo-sweep.mjs` §11 greps) and 778 executed, with the
lines/lines-per-check/seconds figures from the delivered run.

### 5. 👤 On the installed iPad, after a deploy — **NOT RUN, and I cannot run it**

Left `- [ ]`. It needs a real installed PWA on real hardware after a real deploy; I have neither the
iPad nor a deploy, and no emulator has either. A green harness closes nothing here. `TESTING.md`
§ WO-8.10 carries the line with two notes for whoever runs it: the deploy has to have happened first
(this line reports the *device*, `verify-deploy.mjs` reports the *origin*), and if it names two, the
first thing to try is what the line itself tells the teacher — quit from the app switcher and reopen.

---

## 2. What is on disk

| File | Change |
|---|---|
| `index.html` | One `<p class="build-caches" id="buildCaches">`, empty on purpose, at the foot of the *This build* section, with the comment saying why it must never be typed. The stale-paragraph comment at the old `:1216` is untouched. |
| `src/shell.css` | `.modal-body .build-caches` (11px hint grey) and `.build-caches.warn` (the style guide §1 caution banner: `#fff8e6` / `#f0dfa8` / `#8a6d1a`), in a new `ABOUT` block after the modal rules. |
| `src/shell.js` | `paintBuildLine()` + `buildLine()` beside the service-worker registration; the `aboutModal` branch in the one click listener; one line of the hook inventory annotated. |
| `tools/verify-shell.mjs` | New section at the foot, 12 checks. |
| `tools/README.md` | Call-site count `769 → 781`; a WO-8.10 entry in the running narrative with the executed count, the service-worker note, and the two clauses worth knowing about. |
| `TESTING.md` | New § WO-8.10 under Phase 8: the five states, acceptance 1–4 ticked with evidence, acceptance 5 open as 👤, the mutation table, and the owed `CACHE` bump. |
| `plans/work-orders/phase-8-packaging.md` | Acceptance boxes 1–4 ticked. **Status line untouched** (`🤖 CLAIMED — 2026-08-15`), box 5 untouched. |

Not touched: `sw.js`, `CHANGELOG.md`, `plans/ROADMAP.md`, `plans/work-orders/README.md`.

---

## 3. Mutations — six runs, all reverted, and one of them found a defect in my own check

Every one is a full harness run against a mutated `src/shell.js`, restored by the driver afterwards
(`git diff` clean on that file at the end of each).

| Mutation | Result |
|---|---|
| the line becomes a constant (**the Traps mutation**) | **6 red** of 778 |
| `.warn` is never applied | **1 red** — the palette check alone |
| painted once, never re-read | **5 red** — everything after the first open |
| the opening sentence deleted: *"⚠ Stored on this device: A and B"* | **0 red — the check was vacuous** |
| the same, against the corrected check | **1 red**: *"more than one" at 256, first cache name at 25* |
| both failure states go blank | **2 red**, both reading `line = ""` |

**The fourth is the one to read.** Written as a bare `/more than one/i` over the whole line, the
check passed a build that had deleted the sentence saying how many — because the line *ends* with
*"if this line still names more than one, send this screen on"* and the phrase was still in the
string. The check now compares **positions**: the count has to be said before the names are listed.
That is the claim the acceptance line actually makes, and unlike a literal substring it survives a
rewrite of the sentence. I would not have found it by reading; the run found it.

The five app states were also read directly in a throwaway probe before the harness section existed
(one cache, two, three, back to one, absent API, rejecting API, zero caches) — that is where the
zero-cache copy was checked, and it is the only state with no standing check.

---

## 4. The one thing that is red, and why I did not fix it

```
FAILED:
  - every SHELL file change is paired with a CACHE bump
      src/shell.css, src/shell.js changed since planbook-shell-v64 was set at 3c6b8c5 — bump CACHE
      in sw.js, or an installed app keeps the shell it already has
```

**This failure is caused by my change.** I am not claiming a pre-existing one. It deserves the whole
argument rather than a line:

- Every runtime file in this app is in `SHELL` — all of `src/*.js`, all of `src/*.css`. `index.html`
  is not (the sweep skips `'./'`), but the only way to put the code there is an inline script, which
  breaks `src/README.md`'s module convention and the delegation rule at the head of `src/shell.js`.
  **There is no implementation of this work order that does not touch a `SHELL` file.**
- So `wo-sweep.mjs` §9 asks for a `CACHE` bump — the house rule, stated in `sw.js`'s own header and
  followed by WO-1.17 in its own commit (*"CACHE → planbook-shell-v64, since src/backup.js is in
  SHELL"*).
- And this work order's **Out of scope** says *"any edit to `sw.js`"*, with the Traps line arguing
  it: the cache name is the fact being reported. I was told to honour Out of scope literally and to
  note the temptation instead of acting on it. **So I did not bump it.**

**The landing commit owes `planbook-shell-v64 → v65`.** It is one character, it turns the sweep
green (`--audit` is already PASS), and it changes no check's meaning — the harness reads `CACHE` out
of `sw.js` at run time, so acceptance line 1 is proved against whatever it says. The precedent for
paying it separately is `430e867`, which paid `f63792f`'s stale-cache debt after WO-8.9's
implementer correctly refused it.

If the orchestrator would rather I had made the bump, it is a one-line correction round and I will
take it — but making it unasked, in the one work order whose Traps section is *about* not touching
`sw.js`, seemed the worse of the two mistakes.

---

## 5. Decisions the work order did not settle

1. **No new module.** `src/about.js` is what `src/README.md`'s "one concern per file" wants, and it
   would have to join `SHELL` and bump `CACHE` in the same commit — the edit that is forbidden. So
   the reader lives in `src/shell.js` beside the service-worker registration, whose own comment says
   registration is there rather than in `install-banner.js` because *caching the shell* and *nagging
   about the home screen* are two concerns. This is the first concern, read back. The departure from
   the one-concern rule is stated at the top of the block rather than left to be noticed.
2. **The About button keeps `data-modal-open`.** A dedicated hook (`data-about-panel`, the shape
   `data-year-picker` and `data-backup-panel` use) would have been the tidier convention, but it
   would silently re-point the coarse-pointer sweep, which clicks the *first* `[data-modal-open]` on
   the page and has a comment saying that element is the About button. So the exception is stated in
   the one click listener instead, and the inventory line says so.
3. **Fill first, then open** — not open-then-fill. `data-year-picker`'s own reason: a modal that
   opens and then fills in is a modal that flickers. Both promise arms open the panel, so a rejected
   read still gets you the rest of the About text.
4. **Only "more than one" is amber.** Argued in §1.3 above and at both the rule and the function.
5. **Names are listed in the order `caches.keys()` answers**, not sorted: that order is roughly
   creation order, so the survivor of a finished update reads last. Sorting would have been a claim
   about which is current, and the page has no honest way to know that without reading `sw.js` — a
   network request, and out of scope.
6. **`⚠` as a bare character in painted text**, matching `src/categories.js` and
   `src/letter-scale.js`. The `<span aria-hidden="true">` wrapper is the convention for the glyph in
   *markup* (`index.html`'s install banner and backup nag); this line is painted, and the closest
   precedent is the painted one.
7. **`textContent` and one created `<strong>`, never `innerHTML`.** Cache names come out of storage
   anything on this origin can write to; a cache name is not markup.

---

## 6. Declined, and noted here instead

- **No update prompt, no "reload to update" banner, no toast.** The work order names it as a
  decision it is not making (`sw.js:127` frames it). I think it is worth a work order eventually —
  the About line tells a teacher what is wrong but only if she opens About — but that is a proposal,
  not this change.
- **No 44px work.** Nothing added is a control: no button, no input, no click target. The
  `@media (pointer: coarse)` block is untouched, deliberately and not by omission.
- **`CLAUDE.md`'s *"has never seen a service worker"* sentence now deserves a precision edit** —
  the harness reads a cache the worker wrote. I did not make it: `CLAUDE.md` and `AGENTS.md` must
  move together, and rewriting an architectural claim is not this work order's to do. The precise
  version is written where it is load-bearing (`tools/README.md`, and the section's own header).
- **The static "no versioned constant" clause could also live in `wo-sweep.mjs`.** I left it in the
  harness for the reason given in §1.4. If a future reader wants it in the grep half too, that is a
  cheap follow-up, not a duplicate.

**Proposed follow-ups** (not booked by me):
1. **The `CACHE` bump** — §4. Strictly the landing commit's, not a work order.
2. **An update prompt**, if the teacher wants one — the decision `sw.js:127` frames.
3. **A zero-cache check in the harness**, if anyone wants that fifth state watched. It needs the
   section to delete the app's own shell cache and put it back, which is a heavier fixture than the
   plant, and I judged the risk of leaving a browser with no shell mid-run not worth it at the end
   of a 254-second file.

---

## 7. Draft `CHANGELOG.md` entry — **not written to the file**; the teacher decides what a change means

> **The About screen says which copy of Planbook this device is running.** After a deploy, the only
> way to learn whether the installed iPad had actually taken the new shell was Safari Web Inspector
> over USB from a Mac — a procedure nobody runs in September, which is how the question stopped being
> asked. The last line of the About modal now answers it, generated from `caches.keys()` every time
> the panel opens and never from a string typed into the markup: a constant would read v64 while the
> browser held v63, which is the exact failure this exists to catch.
>
> **The useful question turned out not to be "which version".** `sw.js` uses `skipWaiting` +
> `clients.claim`, so `activate` deletes every cache that is not the current one — one cache is the
> healthy state, and more than one means the activation did not finish and the app may be serving a
> mix. So the line says the number out loud before it lists the names, in the same caution amber the
> install banner and the backup nag wear, and tells the teacher to quit from the app switcher and
> send the screen on if it happens again. Where Cache Storage cannot be read at all — a non-secure
> origin, a private window — it says which failure that was, because a blank line reads as "no
> caches", which is a different fact and a wrong one.
>
> `verify-shell.mjs` plants the second cache itself and clears it again (766 → 778 checks): a display
> that has only ever shown one name has proved nothing about the case it exists for. Six mutation
> runs, and the fourth caught a check of its own that passed a build with the warning sentence
> deleted — the line ends by saying "if this still names more than one", so the phrase was in the
> string either way. It now asserts the count is said *before* the names are listed.
