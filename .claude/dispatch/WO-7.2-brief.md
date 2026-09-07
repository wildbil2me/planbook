# WO-7.2 — Document transfer & conflicts · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.2-result.md` — as your last act, and return it in-band too.

**Route — Claude, Opus tier.** `ROUTING.md` puts all of Phase 7 in the Claude-only column as a
property of the work, and three of its six triggers fire together here: Size `L`, a surface where a
plausible-looking implementation puts student data — including accommodations and medical notes —
into a second place, and a Traps line that is pure judgment. The runner-up I set aside was Codex on
the `rev`/`baseRev` table, which genuinely is fully specified in `docs/sync.md`; but that table is
the small half, and the halves that are not written down (§ 2b below) are the reason this is `L`.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.2 — Document transfer & conflicts

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-07 · **Size** L · **Depends on** WO-7.1
**Closes roadmap** Phase 7 → "Upload/download the year document", "`rev`/`baseRev` comparison",
"Conflict: keep both", "Handle token expiry gracefully."

*(**`🔒 GATED` until 2026-08-28, and by then it was gating nothing.** The glyph is Phase 7's
original blanket — `docs/sync.md`'s "sync stays behind a flag until it is verified" read as *do not
build any of it yet* — and
[WO-3.10](phase-3-gradebook.md#wo-310--the-oauth-client-exists-and-asks-for-one-scope) demolished
that argument on 2026-08-11 for the whole phase: **verification gates public launch, not
development**, and a Testing-mode client issues real `drive.file` tokens to the owner today.
[WO-7.1](#wo-71--auth) took the glyph off on that reasoning and shipped 2026-08-24; this work order
kept it, with its one `Depends on` ✅ DONE and* **nothing in its body naming a gate** *— which the
§ Header fields rule requires:* `🔒` *means do not start it, and what it is gated **on** is the work
order's to say. It said nothing, so there was nothing to re-check and nothing to lift it.*

**It had also gone circular, exactly as WO-7.1's did.**
[WO-3.18](phase-3-gradebook.md#wo-318--verification-submitted-) *owes Google a demo video* **showing
the scope in use**, *and the only thing that uses the scope is this work order. WO-7.1's note records
the first turn of that loop — the paperwork could not film a sign-in marked do-not-start — and this
is the second: the paperwork cannot film a* file transfer *marked do-not-start. **The lesson is not
about Phase 7.** A `🔒` that names no gate cannot be audited, cannot expire, and outlives the
argument that put it there;* `--audit` *reads fragments, `Owes` pointers and dashboards, and has
never once asked a gated work order what it is waiting for. **Booked as a check nobody has written:**
if a `🔒` must state its gate, something should refuse one that does not.)*

**Why it exists.** The teacher never edits two devices at once — established up front, and it is
what makes whole-document last-writer-wins sound rather than lazy. But "never" is a habit, not a
guarantee, so the conflict path has to be correct anyway.

**Deliverables**
- Upload and download the year document, matched by `appProperties.docId`. `drive.file` limits
  `files.list` to app-created files, so the app lists its own — no folder picker, no stored path.
- `rev` carried in `appProperties` so ordering is readable without downloading the file.
- The comparison, exactly as specified:

  ```
  remote.rev == baseRev   → local is ahead      → upload
  remote.rev >  baseRev   → remote is ahead     → download (if local is unchanged since baseRev)
  both changed            → conflict            → keep both, never discard
  ```

- **Conflict handling: keep both, never merge, never discard.** Write the losing side to Drive as
  `Planbook 2026-2027 (conflict from iPad 2026-11-14).json`, keep the winner active, and **tell the
  teacher plainly what happened and where the other copy is.**
- Token expiry mid-sync fails safely: local data untouched, clear message, retry available.
- The save indicator's syncing / queued / retry states wired up.

**Acceptance**
- [ ] Edit on device A, sync, open on device B: B has A's changes.
- [ ] Edit both devices while offline, then sync both: **two files exist**, the conflict copy is
      named and findable, and no edit from either side is lost.
- [ ] The conflict message names the file and where it went, in plain language.
- [ ] Killing the network mid-upload leaves the local document valid and the remote unchanged or
      complete — never half-written.
- [ ] An expired token during sync produces a re-auth prompt, not a silent no-op.
- [ ] Sync never touches a year document other than the one matched by `docId`.

**Traps** — Silent merge of two gradebooks is how you lose a term of grades and never find out. If
you find yourself writing merge logic, stop: the design says keep both. And remember **sync is not a
backup** — Drive holds one live copy that sync will happily overwrite. WO-1.5 stays mandatory.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/sync.md`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/auth.js` — read the whole header. It is WO-7.1's argument and it addresses you directly.
- `src/store.js` — `update()`, `flush()`, `restoreDocument()` and the `rev` reasoning block at ~line 660.
- `src/save-indicator.js` — the header, before you wire anything.
- `index.html` ~2026–2075 — the Drive panel and the comment block above it.
- `src/backup.js` — the app's other "what leaves this device" surface; match its plainness, not its placement.

---

## 2b. What this work order has to decide, that nothing has decided for you

Five of these. They are why the route is Opus. Argue each at its own point of definition, in the
file, the way `src/auth.js` argues its three — a decision taken by omission and a decision taken on
purpose read identically in a diff.

1. **`baseRev` does not exist anywhere in this tree.** `grep -rn baseRev` finds three prose
   mentions and no code. You are inventing it, and *where it lives* is the decision. Two fences it
   must clear. It must **not** go into `newYearDocument()` — `parseBackup()` validates a restored
   file against the shape that function returns, so a block added there refuses **every backup
   written by every earlier build, by name** (the WO-6.1 scar, `CLAUDE.md` § Data). And
   `localStorage` here is `planbook_`-prefixed **UI preferences only**, which `src/prefs.js`'s
   `PREF_DEFAULTS` enforces by closing the door. A per-device sync bookmark is neither of those
   things. Pick, and write down why the other two were wrong.

2. **`docs/sync.md` leaves you an open question in as many words** — § "What a restore does to
   `rev`", last paragraph: a backup restored from a *different device* brings that file's `docId`,
   and `docId` is what `files.list` matches on. It says *"Write the answer here when it exists."*
   Answering it in that file is part of this work order, not a follow-up.

3. **The deliverable says "syncing / queued / retry" and `queued` must not come back.**
   `src/save-indicator.js`'s header records that `queued` was Roll Call!'s state and belonged to its
   outbox — the thing `CLAUDE.md` § architecture forbids reintroducing. It also records that
   `syncing` currently has **no caller in the app at all**, and that Phase 7 owns it. Wire `syncing`,
   use `retry` as it already exists, and say in your report that you did not add `queued` and why.

4. **`src/auth.js` imports `src/live-region.js` and nothing else, deliberately.** Its header: *"there
   is no path from here to src/store.js, so signing out cannot write, clear or reorder a single
   thing in IndexedDB. A later work order that needs the document should take the token from here
   rather than bring the store in."* You are that later work order. The dependency points one way.

5. **The conflict copy is a second copy of the most sensitive data in this app.** The year document
   carries IEP/504 details, medical needs and behavior plans. Whatever the panel says about a
   conflict file landing in Drive is teacher-facing prose about a disclosure, and it holds the
   standard the backup panel holds.

---

## 2c. Four traps

- **No merge logic.** The work order's own Traps line: if you find yourself writing it, stop. Keep
  both, never discard, and the losing side goes to Drive under a name that says where it came from.
- **Do not widen `hostAllowsSignIn()`.** That is WO-7.3's single remaining deliverable and it is
  the code deliberately holding itself behind the console. It is also why **Acceptance 1 and 2
  cannot be run on an iPad**: the released app never draws the panel. Mark them 👤 — the runnable
  form for the owner is two browser profiles at `https://localhost:8443`, which are two devices as
  far as IndexedDB and `deviceId` are concerned. **Do not tick a 👤 line.**
- **`index.html`'s panel currently says nothing is uploaded yet, and that becomes false the moment
  you land.** `docs/sync.md`: *"Whatever moves a document says so in the same words."* Same sitting.
- **One stale claim you will read and must not believe.** `src/auth.js` ~line 68 calls
  `https://localhost:8443` *"the client's ONLY authorized JavaScript origin"*. It is not — the
  client has carried `https://planbook.hwgteach.com` beside it since 2026-08-21, which the same
  header says correctly fifteen lines later. **Do not fix it** (that is widening this work order);
  name it in your result file as a proposed follow-up so it gets its own row.

**Note on the harness.** `verify-shell.mjs` often cannot run in a sandbox. "Could not run" is a
report about an environment, not a result — say so plainly rather than counting it either way.

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

1. Edit on device A, sync, open on device B: B has A's changes.
2. Edit both devices while offline, then sync both: **two files exist**, the conflict copy is named and findable, and no edit from either side is lost.
3. The conflict message names the file and where it went, in plain language.
4. Killing the network mid-upload leaves the local document valid and the remote unchanged or complete — never half-written.
5. An expired token during sync produces a re-auth prompt, not a silent no-op.
6. Sync never touches a year document other than the one matched by `docId`.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

