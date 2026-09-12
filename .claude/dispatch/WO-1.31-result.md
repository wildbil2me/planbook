# WO-1.31 — a 🔒 GATED work order that never says what it is gated on · implementation result

**Implementer** Claude (Opus) · **Date** 2026-09-12 · **Work order**
`plans/work-orders/phase-1-shell-store-roster.md` § WO-1.31

**Status on return:** all five Acceptance lines closed and ticked, every one against output I ran and
read. No 👤 line and no 📆 line exists on this work order. One decision the work order did not settle
is named in § 3 below and it is the thing to read first.

---

## 1. Against the Acceptance list, one by one

### 1. A bare `🔒 GATED` is reported as a problem naming the § "Header fields" rule it breaks — ✅

**Closed, with evidence I ran.** Two readers, not one:

- `gate()` (`tools/wo-gate.mjs:1040`) pushes a **second problem** under the refusal the lock already
  earns. The first message is byte-identical to the one that has always been there; the new one names
  the work order, quotes its status line as typed, and cites
  `plans/work-orders/README.md § "Header fields"` and the rule in its own words.
- `--audit` gains a directory-wide section, `gatedProblems()` at `tools/wo-gate.mjs:1756`, reported
  as **BAD and counted into the verdict**.

**The evidence is the first run of the check over the untouched tree.** Before any suffix was
written, `node tools/wo-gate.mjs --audit` printed a BAD row for each of the three live locks —
WO-G3 (`gates.md:317`), WO-3.18 (`phase-3-gradebook.md:1419`), WO-7.3 (`phase-7-sync.md:352`) — and
ended `FAIL | 3 problem(s) across the two trackers`, exit 1. That output is quoted in `TESTING.md`
§ WO-1.31.

Why a section in `--audit` as well as the gate report, when the work order only asks for "a problem":
the Why-it-exists paragraph names `--audit`'s blindness as part of the defect, and **a lock is the
one status that guarantees nobody runs a gate report on it** — which is exactly how WO-7.2's survived
seventeen days. The gate-report half alone would have been a check nobody ever triggers.

### 2. `🔒 GATED — <text>` passes and is still refused for being gated — ✅

**Closed.** `node tools/wo-gate.mjs WO-7.3` now prints
`status  🔒 GATED — Google's verdict on a submission nobody has made yet` and ends
`FAIL | WO-7.3 is 🔒 GATED — do not start it`, exit 1, with no second sentence. Same for WO-G3. The
plant asserts both directions on the fixture.

**The one thing that makes this work, and the trap in it:** `parseFile()` normalises a status to the
`STATUSES` entry it starts with, so `wo.status` is a bare `'🔒 GATED'` whether a suffix was typed or
not. The check reads **`wo.statusRaw`**, which nothing else in the file had ever used. A version
reading `wo.status` is green on a healthy tree and wrong on every input — mutation-proved, **4 red of
40**.

**One change beyond the letter of the line, declared:** `gate()` now prints `wo.statusRaw` on its
`status` line (`tools/wo-gate.mjs:912`). Before, the report refused a reader for a lock and showed
them the glyph without the gate — on the one screen written for somebody about to start the work
order. It changes what is printed and not what is parsed; `--list` keeps the normalised status, where
a suffix would break the column.

### 3. WO-G2, WO-G3, WO-3.18 and WO-7.3 each carry a suffix, and `--audit` passes — ✅ (read this one)

**Closed, and the line as written names two work orders that are not gated.** `--audit` is `PASS`,
exit 0, with both live locks under `ok`.

The brief established the census was stale (live set of three, not four: WO-G2 came off in `3149bea`).
**On the day it was two, not three** — see § 3 below for WO-3.18. What is on disk:

| Work order | What it got | Taken from |
|---|---|---|
| WO-G3 | `🔒 GATED — four weeks of a real term's grades and attendance, ~Sep 30` | its own 2026-08-28 lock note, *"put it back to `⬜` when four weeks of real grades and attendance exist"* |
| WO-7.3 | `🔒 GATED — Google's verdict on a submission nobody has made yet` | its `**Depends on**` clause (*"approval cannot follow from a client nobody submitted"*) and the phase header's *"the gate is on public launch"* |
| WO-G2 | **nothing** — it is `⬜` and takes no suffix | brief, § "Four things verified at dispatch time" |
| WO-3.18 | **nothing** — its lock came off in this sitting | § 3 below |

**How I read an Acceptance line naming a work order that is no longer gated:** as a line whose
subject is *every lock in the directory carries its gate*, whose census went stale between booking and
build. I did not silently satisfy it by writing a suffix onto a work order that is not locked — that
would be a false status line in a work order about documents that lie. Instead the line **stays and
carries an italic paren note** recording both moves, the work order body's census sentence carries a
longer one, and the Traps bullet carries a short one. That is the directory's own idiom for a
superseded sentence (WO-1.30's Traps table, WO-3.18's own Acceptance line 1) and it leaves the
original wording readable.

### 4. § "Header fields" records the suffix in its `🔒 GATED` row — ✅

**Closed, in two places, because the § "Header fields" table has no `🔒 GATED` row to amend** — it is
keyed by **field**, and the status vocabulary lives in § "How to use one" above it. I read the line
as asking for both halves and wrote both in the same sitting:

- **§ "Header fields" gains a `**Status**, specifically` row** (`README.md:106`), beside the
  `**Ship**, specifically` row it is modelled on. It records all six suffixed statuses, that the
  first three carry a date and `🔒` carries a sentence, that **nothing parses the suffix**, the em
  dash, and that `🚧 BLOCKED` is outside the rule. This is the row the refusal message cites, so the
  citation has to land somewhere real.
- **The `🔒 GATED` paragraph in § "How to use one"** gains the rule itself (`README.md:50-63`) and
  points at the row for the grammar — because that paragraph is where the obligation was stated in
  the first place, and a reader who meets the glyph there must not have to reach the field table to
  learn it now has a second half.

No `Gated on` field was added; the work order refuses one and the table records that refusal three
times.

### 5. `--self-check` gains a plant for the bare-lock refusal — ✅

**Closed. 39 → 40 plants, `PASS | 40 of 40 plants were caught`, exit 0.** One plant over three
states — bare, stated, and `🚧 BLOCKED`, which must stay out of the rule — because they are one claim
about one status line and a plant per state would need three fixtures asserting about each other. It
brought no new fixture and no new `fixtureBlock()` shape: the value goes into the existing `status`
option, and the suffix it writes (*waiting on a fixture*) is the one two older plants have written
since WO-2.14, which is why the parser needed nothing. It runs after WO-1.30's two and before
WO-1.21's four.

**Five mutations, every one driven with `--against` over a copy in the scratchpad. Nothing in the
tree was mutated** — `grep -rn MUTATION tools/ src/ plans/ index.html` returns only pre-existing prose
about earlier mutation rounds. All five are tabulated in `tools/README.md`:

| Mutation | Result |
|---|---|
| the second `problems.push` deleted from `gate()` | **1 red of 40**, on the two assertions that are the defect verbatim |
| `gateUnstated()` reading the normalised `wo.status` | **4 red of 40** — every lock in the sandbox's copy of the real directory reads as unstated, `--audit` fails for the whole run, three unrelated plants redden with mine. The breadth is the finding |
| the rule widened to `🚧 BLOCKED` (the forbidden widening) | **1 red of 40**, on the one assertion aimed at it |
| `gl.problems.length` dropped from `--audit`'s total — BAD rows above a `PASS` | **1 red of 40** — see below |
| `gatedProblems()` stubbed out entirely | **1 red of 40**, on four assertions at once |

**The fourth mutation found a hole in my plant rather than in the code, and this is the honest part of
the round.** Against the plant's first cut — which asserted the BAD row and not the count — it was
**green on all forty**: WO-1.29's counted-and-silent defect arriving in a new section. The plant
gained two verdict assertions (`--audit` must exit non-zero and must print `FAIL | N problem(s)`) and
the mutation now reddens it. That is recorded in `tools/README.md` and in `TESTING.md` rather than
quietly fixed.

---

## 2. Harnesses

| Command | Baseline (brief) | After |
|---|---|---|
| `node tools/wo-gate.mjs --audit` | `PASS`, exit 0 | `PASS`, exit 0 — with the new section reading `ok` twice |
| `node tools/wo-gate.mjs --self-check` | `39/39`, exit 0 | `PASS \| 40 of 40 plants were caught`, exit 0 |
| `node tools/wo-sweep.mjs` | `41 checks · 0 FAIL` | `41 checks · 38 passed · 0 failed · 3 to review`, exit 0 — the same three standing REVIEW lines, and § 22's count check still green (I added no sweep check, so `tools/README.md`'s `41` is unmoved) |
| `node tools/verify-shell.mjs` | — | `1334 checks · 1334 passed · 0 failed · 0 skipped`, 447s — **exit code not read, see below** |

**`verify-shell.mjs`: what I actually observed.** I backgrounded it, waited, and read its complete
output: the summary block above plus its closing sentences. **I did not see an exit code.** The
wrapper's `EXIT=` line never appeared; the `node tools/verify-shell.mjs` process was still alive
~15 minutes after printing its final line (confirmed by `Get-CimInstance Win32_Process`), so it prints
its verdict and then does not release the shell in this environment. I am reporting the verdict it
printed and not rounding it up to *exit 0*. The run touches no file this work order changes, and
`1334 · 1334 · 0 · 0` matches the last recorded green run in `TESTING.md` (WO-1.30).

**Line endings:** every changed file re-read byte-wise — `CRLF=0` in all eight, which is what they
were. `core.autocrlf` is `false` and there is no `.gitattributes`. No file was reformatted; the
largest diff is `tools/wo-gate.mjs` at +170/-7.

---

## 3. The decision the work order did not settle: WO-3.18's lock came off

**This is the one thing in this dispatch a verifier should weigh rather than check.**

The brief's census listed WO-3.18 as one of three live locks needing a suffix. When I read its body
for the sentence to copy, the gate it states is:

> **"Put it back to `⬜` when WO-7.2 lands"** — its own 2026-08-28 note.

**WO-7.2 landed `✅ DONE — 2026-09-07`**, five days before this dispatch. `src/drive-sync.js` carries
the year document both ways against `https://www.googleapis.com/upload/drive/v3/files`, so the scope
is in use and the demo video has a file transfer to film; `CLAUDE.md` already says the video is
unblocked. Every one of WO-3.18's five dependencies is `✅ DONE`.

So there was no truthful suffix to write. The three options:

1. Write `🔒 GATED — WO-7.2's file transfer` anyway. **Refused**: false on the day it was written, in
   a work order whose subject is tracker statements nobody reads back.
2. Leave it bare `🔒`. **Refused**: the new check reddens `--audit`, and Acceptance line 3 requires it
   to pass. Worse, it leaves the tree in the exact state the work order exists to make impossible.
3. **Take the lock off** — which is what § "How to use one" says a `🔒` does when the thing it waits
   on arrives, and what the work order's own note instructs in as many words.

**I took option 3**, by hand, `🔒 GATED` → `⬜ NOT STARTED`, with an italic paren note in WO-3.18
recording what changed, when, and that `🔒` is one hand edit away if the owner wants it back.

**Three things that make this smaller than it looks, and one that does not.**

- **`next` is unmoved.** `node tools/wo-gate.mjs next --quiet` answered **WO-G2** before the change
  and answers **WO-G2** after it — WO-G2 is in § Ship 2, ahead of § After Ship 3 row 9 in document
  order. I ran both.
- **No dashboard moves.** ⬜ and 🔒 are both uncounted; only `✅ DONE` counts.
- **The running-order cell was corrected in the same sitting**, because my edit is what made it false:
  row 9 said *"Gate-clear and not startable — behind row 20 … WO-7.2 is unbuilt"*. Its new cell says
  startable, keeps the old wording as a quoted supersession, and keeps the scheduling argument
  (*a shoot, a console trip and a form — not an hour to fold into a teaching week*) where the
  `Suggested` column belongs rather than in a status field.
- **What it does not do:** it is a status change to a work order that is not this one, made by an
  implementer. If the owner wants WO-3.18 held shut for a reason nobody has written down, the repair
  is one line and the note says so.

**It also changes what this work order is.** The body says *"There is no live instance, and that is
worth saying out loud … this work order is a plant, not a repair."* That remains true of the defect
as stated — a lock that **never** named its gate. What the first run of the check found is the other
half of the same failure and it was live: **a gate stated, discharged, and outliving the condition
anyway.** The census note in the body records this; `TESTING.md` records it; and the limit is written
at `gatedProblems()` and in § "How to use one" so that a green section is never read as a claim that
every lock is still earning its glyph. **A grep can ask whether a gate is stated. Only a person can
ask whether it is still live.**

---

## 4. Files changed

| File | What |
|---|---|
| `c:\dev\planbook\tools\wo-gate.mjs` | `GATED`/`GATE_STATED`/`gateUnstated()`/`unstatedGateProblem()` (:145-180); the second refusal in `gate()` (:1040); `statusRaw` on the report's status line (:912); `gatedProblems()` (:1756); the `--audit` section and its contribution to the verdict; the 40th `--self-check` plant; `--help` and the run's closing "NOT covered" summary |
| `c:\dev\planbook\plans\work-orders\README.md` | § "How to use one": the suffix rule under the `🔒 GATED` paragraph · § "Header fields": the `**Status**, specifically` row · § After Ship 3: row 9's `Suggested` cell |
| `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` | WO-1.31: the census note, the Traps note, the five Acceptance boxes ticked with notes |
| `c:\dev\planbook\plans\work-orders\gates.md` | WO-G3's status suffix |
| `c:\dev\planbook\plans\work-orders\phase-7-sync.md` | WO-7.3's status suffix · a note on WO-7.2's *"booked as a check nobody has written"* paragraph recording that it now exists |
| `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` | WO-3.18: `🔒 GATED` → `⬜ NOT STARTED` and the note explaining it |
| `c:\dev\planbook\tools\README.md` | the `--self-check` paragraph (thirty-nine → forty plants, WO-1.31's sentence, the count line) · five mutation-table rows · the table's own arithmetic sentence (thirty → thirty-five, five → six that touched something else) |
| `c:\dev\planbook\TESTING.md` | § WO-1.31, a new section between WO-1.30 and WO-1.40 |

**Not touched, deliberately:** `src/`, `index.html`, `sw.js`, `manifest.json`, `icons/`,
`privacy.html` — **no `CACHE` bump is owed**. `CHANGELOG.md` — the teacher's (draft below).
`tools/wo-sweep.mjs` — no new sweep check, so `tools/README.md`'s `41` did not move.

---

## 5. Out of scope, honoured — and the temptations

- **WO-1.51** (the `\b` that keeps `nothing` a sentinel) sits at `depsOf()`, about forty lines from
  code I edited, and I read it twice while working. **Untouched.** Its `--self-check` count will move
  from 40, not 39, when it lands.
- **`🚧 BLOCKED`** was never widened into. It would have been two characters in `gateUnstated()` and
  the plant now asserts against it — which is the cheapest way this rule could grow by accident,
  since both statuses refuse four lines apart in the same branch.
- **What `🔒 GATED` does** is unchanged: it still refuses outright, `--start`/`--tick`/`--release`
  still behave exactly as before (the existing plants over those paths already use the suffixed form
  and stayed green untouched).
- **Declined, and worth booking if anyone wants it:** § After Ship 3 **row 20's cell is stale** — it
  describes WO-7.2 as *"`⬜` since 2026-08-28 … After Sep 2"* when WO-7.2 is `✅ DONE — 2026-09-07`.
  My row-9 edit now points at it (*"row 20 landed"*), so the two cells read oddly together. I did not
  touch it: it was stale before I arrived, `--audit` does not read `Suggested` cells, and the running
  order is the owner's to sequence. It is a one-cell hand edit.
- **Declined:** an `--audit` section for `**Depends on**`, which WO-1.30's `TESTING.md` names as the
  obvious follow-up and which my new section is the working model for. Different field, different
  work order.

---

## 6. Draft `CHANGELOG.md` entry — yours to write or discard

> **The tracker asks a locked work order what it is waiting for.** `🔒 GATED` has always meant two
> things — *do not start it*, and *what it is gated on is the work order's to say* — and only the
> first was enforced. The gate now goes on the status line (`🔒 GATED — <what it waits for>`), a bare
> lock is refused on its own gate report and again across the whole directory in `--audit`, and the
> two live locks say what they are waiting for. A third turned out to have been waiting on something
> that arrived five days earlier, and came off.

---

## 7. What I could not verify

- **`verify-shell.mjs`'s exit code** — the run printed `1334 checks · 1334 passed · 0 failed ·
  0 skipped` and then held the shell open; I read the verdict, not the code. § 2.
- **Nothing needing an iPad, a thumb, or human eyes** arises here: no file a device receives was
  touched. There is no 👤 line and no 📆 line on this work order, and I ticked none of either.
- **Whether WO-3.18 should be startable** is a judgment I made and flagged rather than verified. § 3.
