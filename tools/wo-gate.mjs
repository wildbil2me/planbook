#!/usr/bin/env node
// wo-gate.mjs — the dispatch pipeline's gate check, "what's next", and tick applier.
//
//   node tools/wo-gate.mjs WO-1.7          gate report for one work order; non-zero if blocked
//   node tools/wo-gate.mjs next            first NOT STARTED row in the Ship 1 table
//   node tools/wo-gate.mjs --list          every work order and its status
//   node tools/wo-gate.mjs --start WO-1.7 [--dispatch <label>] [--dry-run]
//                                                         claim it: ⬜ NOT STARTED → 🤖 CLAIMED
//   node tools/wo-gate.mjs --release WO-1.7 [--dry-run]   the way back: 🤖 CLAIMED → ⬜ NOT STARTED
//   node tools/wo-gate.mjs --tick WO-1.7 [--dry-run]
//   node tools/wo-gate.mjs --audit                        the trackers' standing rot check
//   node tools/wo-gate.mjs --self-check [--against <path>] this file's standing check on itself
//
// The orchestrator ran steps 1, 2 and 2b of its own definition as 8-13 Read and Bash calls plus the
// reasoning to interpret them, every dispatch. All of it is deterministic parsing of a header line
// that is already machine-readable, so it lives here instead.
//
// --start, --release and --tick write into plans/, which every other agent is forbidden to touch.
// The fences are at each of them: one named work order, never a 👤 line, never CHANGELOG.md, and
// --dry-run prints the exact edit first. See plans/work-orders/ROUTING.md for who runs them and when.
//
// The status a work order carries is the record; these three are a convenience over it. Every
// 🔨 IN PROGRESS in plans/ before WO-2.14 was typed by hand and will be again the first time this
// script is wrong about something, so nothing here may make that line harder to hand-edit.
//
// WO-3.11 split what 🔨 IN PROGRESS used to mean, because it meant two unrelated things and nothing
// here could tell them apart: *a dispatch is building this right now*, and *this landed and was
// verified with some Acceptance lines open on purpose*. WO-3.1 was the second and read as the first
// for a day — `next` stepped over it, WO-3.3's gate failed on it, and `--release` could not be run
// safely because a dead dispatch and an intentionally-open work order were the same three glyphs.
//
// So a claim is now **🤖 CLAIMED — <dispatch>**, written by --start and undone by --release, and
// 🔨 IN PROGRESS keeps only its honest meaning: work genuinely part-built, which is what --tick
// writes when a line is still open. Landed-with-lines-owed is ✅ DONE plus a **Owes** field, and the
// lines it owes stay `- [ ]` carrying a `→ WO-x.y` marker that --tick honours ONLY when it can find
// the matching open box under the named target. The pointer has to resolve or the tick is held —
// that conditional is the whole design, because a marker the tool trusts is just a `- [x]` spelled
// with an arrow, and the `- [x]` is what WO-3.11 exists to undo.
//
// --audit and --self-check (WO-2.15) write nothing anywhere. --audit reads the two trackers and
// reports where they have drifted apart; --self-check copies plans/ to a temp directory, plants the
// violations WO-2.14 and WO-2.15 proved by hand, and fails if any of them stops being caught. Since
// WO-2.16 it checks its own precondition first — the trackers must be clean, because the copy
// inherits their drift and drift makes a healthy plant report a failure.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WO_DIR = path.join(REPO, 'plans', 'work-orders');
const README = path.join(WO_DIR, 'README.md');
const ROADMAP = path.join(REPO, 'plans', 'ROADMAP.md');
const DISPATCH = path.join(REPO, '.claude', 'dispatch');

// The status vocabulary, from plans/work-orders/README.md. Order matters: longest first, so
// "✅ DONE — 2026-08-04" doesn't match a bare prefix of something else. `🤖 CLAIMED — <dispatch>`
// (WO-3.11) has that same compound shape and is read the same way — every status read in this file
// is a startsWith, so the suffix is carried by the file and ignored by the parse.
//
// WO-1.21 added the last two, and they are the first statuses here that mean **this is not coming**.
// Everything above them is a position on a road that ends at ✅ DONE; these two say the road stops.
// Two work orders had been sitting in ⬜ NOT STARTED saying the opposite of what the owner decided —
// WO-3.13 struck on 2026-08-15, WO-2.7 deferred on 2026-08-09 — and nothing was blocked by it,
// which is why it went a week unnoticed: the damage was arithmetic. Phase 3 could never read 23/23
// and ROADMAP.md's Phase 2 row could never read 16/16, and a percentage with a floor under 100%
// teaches its reader to stop looking at it.
//
// **They are two statuses rather than one, and that is the constraint rather than a taste.** 🚫 is a
// *whether* — do not build this, and its roadmap box stops being a promise. ⏳ is a *when* — not now,
// the box stands, and it comes back the first time somebody wants the thing. Both work orders argue
// the distinction in their own words and WO-3.13 names it outright ("it is struck rather than
// deferred, and that is a different thing from WO-2.7"), so a single NOT-HAPPENING status would have
// been simpler and would have thrown away the only fact anybody needs from either of them later.
const STATUSES = ['✅ DONE', '⬜ NOT STARTED', '🔨 IN PROGRESS', '🤖 CLAIMED', '🚧 BLOCKED', '🔒 GATED',
                  '🚫 STRUCK', '⏳ DEFERRED'];

// The pair, asked as one question, wherever the two behave alike: neither is counted, neither can be
// started, ticked or released, and neither will ever satisfy a dependency. Everywhere they differ,
// the two are named separately on purpose — a helper that flattens them is how the distinction dies.
const STRUCK = '🚫 STRUCK', DEFERRED = '⏳ DEFERRED';
function notComing(status) { return status.startsWith(STRUCK) || status.startsWith(DEFERRED); }

// The glyph a roadmap box wears when the work order that closes it is not coming (WO-1.21). It sits
// immediately after the checkbox — `- [ ] ⏳ **DEFERRED …** — the box text` — and the position is the
// whole guard: a glyph anywhere else on the line is prose about a deferral, not a deferral. The box
// stays `- [ ]` rather than becoming `- [x]` or being deleted, because both of those lie. Ticking it
// claims work that never happened; deleting it loses the promise the roadmap made.
const BOX_MARK = /^-\s*\[([ x])\]\s*(🚫|⏳)/;

// The hard ordering constraint, stated in CLAUDE.md, the phase file, and the orchestrator's gates.
// No feature that writes student data ships before the path that gets it back out.
const HARD_ORDER = { after: 'WO-1.5', appliesTo: id => /^WO-1\.(\d+)$/.test(id) && +id.split('.')[1] >= 6 };

function read(f) { return fs.readFileSync(f, 'utf8'); }

// ---------------------------------------------------------------------------- parsing

// A work order is a `## WO-x.y — Title` heading followed by one paragraph of `**Field** value`
// pairs separated by `·`, which may wrap across lines. Join the paragraph, then pull fields out
// by name — splitting on `·` breaks because "WO-1.1 … WO-2.4" carries its own separators.
//
// The header vocabulary this script knows, and the reason it is a closed list rather than "whatever
// is bold": a field the parser has never heard of does not go missing, it gets swallowed by
// whichever field's regex runs to the end of the line. **Amends roadmap** did exactly that — it sits
// on WO-2.12's and WO-2.13's `Depends on` line, `depsOf()` scraped it into the dependency field, and
// the gate report announced a "non-work-order clause" on two work orders that depend on exactly one
// thing each.
//
// **Amends roadmap** is REAL, decided 2026-08-08 (WO-2.15). It records that a work order changes the
// promise of a roadmap box some earlier work order already closed — WO-2.12 narrowing WO-2.1's grid
// to portrait, WO-2.13 changing how often WO-2.4's arithmetic runs. That is the maintenance
// protocol's step 2 (`ROADMAP.md:36`, the *(italic paren note)*) stated at the top of the work order
// that owes it, and it is worth having: the alternative was deleting the clause from two shipped
// work orders because a script could not read it, which is the tail wagging the dog. It is parsed,
// it is reported by `gate()`, and it is NEVER written — amending a box is prose about intent and
// only a human writes that. Documented in `plans/work-orders/README.md` § Header fields so the next
// one is typed the same way.
//
// **Blocks** and **Target** are REAL too, decided 2026-08-09 (WO-2.16), and handled exactly as
// **Amends roadmap** is: parsed, reported by gate(), never acted on and never written. `**Blocks**`
// is why that work order exists. WO-1.5 carries `**Blocks** WO-1.6 and every work order after it` on
// the line under its header, and depsOf() read the `WO-` token out of it and reported *"depends
// WO-1.6 ✅ DONE"* — the sprint's one hard ordering constraint pointing backwards, since WO-1.5 is
// the backup work order that WO-1.6 waits on. Both were ✅ DONE, so nothing was gated wrongly, and
// that is luck rather than design: the same line between two OPEN work orders is a cycle, and the
// gate would have called the ordering satisfied while pointing the wrong way down it. It is real
// because it is genuine information a human wants at the top of a work order and it reads naturally
// beside `Depends on`.
//
// **Target** is real for a narrower reason: three of the four gate work orders carry a date on the
// line under their header (`gates.md:14`, `:183`, `:219`) — WO-G4 has none, since the 1.0.0 call is
// the one gate no calendar can set — and a gate is otherwise calendar-bound rather than work-bound:
// the date is the point of it. Leaving it unknown was the other option and was rejected: it would
// print an unknown-field NOTE nobody can act on under every gate report forever, and *"a control
// that goes red for a reason the reader learns to dismiss is worse than no control"* (WO-1.12).
//
// **Neither is ever a list of IDs.** `**Blocks**` is prose written by a hand, not a schema: WO-1.1's
// says `everything` and WO-1.5's ends `— **unblocked as of 2026-08-04**`. So no `WO-` token on a
// `**Blocks**` line may reach depsOf(), which is why this is a field of its own rather than a second
// thing read out of `Depends on`.
//
// **Owes** is REAL, decided 2026-08-09 (WO-3.11), and it is the one field here that is ACTED ON
// rather than only reported. It names the work orders carrying this one's re-homed Acceptance lines,
// and it is present exactly when a line has been moved — absent on all but a handful. It is read
// twice: --tick refuses a work order whose **Owes** disagrees with its own `→` markers, and --audit
// resolves every pointer to a real, open box. That is the difference between a debt and a claim.
const KNOWN_FIELDS = ['Ship', 'Status', 'Size', 'Depends on', 'Owes', 'Blocks', 'Target', 'Closes roadmap', 'Amends roadmap', 'Takes from'];

// **The closed list stopped being the boundary — WO-2.16.** The old rule here said an unknown field
// "is visible as prose on the field before it rather than silently changing what that field means",
// and both halves of that were wrong. It is not visible: the gate report reads plausibly and three
// fields sat mis-read for a week. And it does change what the field before it means, because a `WO-`
// token inside it becomes a dependency. Three instances, one defect — **Amends roadmap**, **Blocks**,
// **Target** — so the fix is to the class and not to the three names: **a field ends at the next bold
// token written where a field is written**, known or not.
//
// "Where a field is written" is the whole guard, and it is why this is not simply "any bold token".
// Header blocks carry bold prose as well as fields, in both of the ways that could go wrong:
// WO-1.13's **Closes roadmap** note says *see **Why it exists** below*, which is field-SHAPED and
// mid-sentence, and WO-1.11's block opens a line with **Not a go-live blocker.**, which is at a field
// POSITION and not field-shaped. A field is both at once — at the start of a header line or after a
// `·`, and nothing inside the asterisks but capitalised words, plus the `WO-x.y` that
// `**Takes from WO-2.9**` names its own argument with.
const FIELD_NAME = String.raw`[A-Z][A-Za-z]*(?: [a-z][A-Za-z]*)*`;
const FIELD_TOKEN = new RegExp(String.raw`(?:^|·)\s*\*\*(${FIELD_NAME})(?: WO-[\dG][\w.]*)*\*\*`, 'g');

// Every field-shaped token in one header block, in the order written. Read off the block's LINES and
// not off the joined paragraph, because "the start of a line" is a position the join destroys.
function fieldsIn(block) {
  const names = [];
  for (const line of block) {
    for (const m of line.matchAll(FIELD_TOKEN)) if (!names.includes(m[1])) names.push(m[1]);
  }
  return names;
}

// `**Name** …everything up to the next field or the end of the header paragraph`. `present` is this
// block's own fields, so an unknown one terminates the field before it exactly as a known one does.
function fieldRe(name, present = []) {
  const others = [...new Set([...KNOWN_FIELDS, ...present])].filter(f => f !== name).join('|');
  return new RegExp(`\\*\\*${name}\\*\\*\\s*(.*?)(?=\\s*·?\\s*\\*\\*(?:${others})\\b|$)`);
}

// **Split on either terminator, and this is the only place the file decides what a line is
// (WO-2.49).** A phase file written by a dispatch that flipped the line endings arrives CRLF, and a
// split on '\n' alone leaves a bare `\r` on the end of every line. That is invisible to a reader and
// fatal to the parses below: JavaScript's `.` does not match `\r` — it is a line terminator, like
// `\n`, `U+2028` and `U+2029` — so `(.+)$` cannot reach the end of a line that ends in one, and
// **every checkbox in the file goes missing**. Measured on 2026-08-18: `- [x] hello` matches
// checkboxesOf()'s regex and `- [x] hello\r` does not.
//
// It is fixed here rather than at the regexes because it was never one regex. On the CRLF copy of
// phase-3-gradebook.md that produced this row, `--tick WO-3.25 --dry-run` reported *"all 0
// Acceptance lines are ticked"* over ten open boxes AND *"no **Closes roadmap** line"* over a work
// order that has one — two parses blind at once, and the next one added would have been the third.
// `\s` DOES match `\r`, which is why `/^##\s+(WO-…)/`, `/^\*\*Acceptance\*\*/`, `/^---\s*$/` and
// `/^\*\*[A-Z]/` went on working and why the failure was silent: the script found the work order,
// found its Acceptance heading, and read an empty list as a satisfied one.
//
// **This does not convert anything.** The writers (--start, --release, --tick) split the file's own
// text on '\n' and join on '\n', so each line keeps whatever terminator it arrived with and a CRLF
// file is written back CRLF. A reader that repaired its input would stop reporting on it; whether a
// dispatch should be able to flip a tracker's line endings at all is a separate question and a
// separate row.
function parseFile(file) {
  const text = read(file);
  const lines = text.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^##\s+(WO-[\dG][\w.]*)\s+—\s+(.+?)\s*$/.exec(lines[i]);
    if (!m) continue;
    const block = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;          // skip the blank after the heading
    const blockStart = j;
    while (j < lines.length && lines[j].trim()) block.push(lines[j++]);
    const joined = block.join(' ');
    const present = fieldsIn(block);

    const field = re => { const r = re.exec(joined); return r ? r[1].trim() : ''; };
    const statusRaw = field(/\*\*Status\*\*\s*([^·]*)/);
    const status = STATUSES.find(s => statusRaw.startsWith(s)) || statusRaw || '(none)';

    // The rest of the work order — heading to the next `---` rule or the next `## WO-`, which is
    // wo-brief.mjs's boundary rule, deliberately. Only the Acceptance list is read out of it.
    let end = lines.length;
    for (let k = j; k < lines.length; k++) {
      if (/^---\s*$/.test(lines[k]) || /^##\s+WO-/.test(lines[k])) { end = k; break; }
    }

    // A **Closes roadmap** line below the header paragraph is invisible to everything here, and it
    // fails in the quiet direction: `--tick` reports "no **Closes roadmap** line — no roadmap box to
    // tick" and ticks nothing. WO-2.8's sat under a seven-line italic note, one blank line out of
    // reach, and its "Hall passes" box was only ever ticked by hand. Collected rather than parsed,
    // because moving the line is the fix and a parser that reaches past the paragraph would make
    // every stray one permanent.
    const strays = [];
    for (let k = blockStart + block.length; k < end; k++) {
      if (/^\*\*(?:Closes|Amends) roadmap\*\*/.test(lines[k])) strays.push(k);
    }

    out.push({
      id: m[1],
      title: m[2],
      file,
      headingLine: i + 1,
      blockStart,                                              // 0-indexed line of the header block
      blockLines: block.length,
      acceptance: acceptanceOf(lines, j, end),                 // null when there is no list at all
      ship: field(/\*\*Ship\*\*\s*([^·]*)/),
      status,
      statusRaw,
      size: field(/\*\*Size\*\*\s*([^·]*)/),
      flag: /🚩/.test(joined),
      dependsRaw: field(fieldRe('Depends on', present)),
      owesRaw: field(fieldRe('Owes', present)),
      blocks: field(fieldRe('Blocks', present)),
      target: field(fieldRe('Target', present)),
      closesRoadmap: field(fieldRe('Closes roadmap', present)),
      amendsRoadmap: field(fieldRe('Amends roadmap', present)),
      unknownFields: present.filter(f => !KNOWN_FIELDS.includes(f)),
      strayRoadmapLines: strays,                               // 0-indexed, outside the header block
    });
  }
  return out;
}

// The Acceptance list is the work order's own account of whether it is finished, and this parser
// did not read it until WO-2.14 — which is how --tick came to write "done" over a list of open
// boxes and print PASS. It runs from the **Acceptance** field to the next bold field, usually
// **Traps**, and each item is a `- [ ]` or `- [x]` that may wrap onto indented continuation lines.
//
// Three things it must not get wrong, all of them read off the phase files rather than off one
// specimen:
//   - The list does NOT end at the first blank line. WO-2.1's second item carries an indented
//     blockquote with blank lines around it, and ten more items follow it.
//   - The heading is not always bare: WO-3.4's reads "**Acceptance** — each verified against a hand
//     computation, recorded in `docs/grade-math-cases.md`:".
//   - Leading whitespace on the `-` is allowed. If a future work order indents an item, it still
//     counts — an item this misses is an item that cannot hold a work order open, and that error
//     runs in the dangerous direction.
//
// The line shapes are wo-brief.mjs's acceptanceLines(), on purpose: two scripts reading one list two
// different ways is how the brief and the tracker start disagreeing about what was asked for.
// A work order with no **Acceptance** field but with checkboxes in its body is holding its list
// somewhere this parser was not looking. That is every gate work order: WO-G1 … WO-G4 keep theirs
// under `### The rehearsal`, `### Ship gate` and friends, and the original comment here recorded the
// gap as a fact about gates.md rather than as a defect — "no list at all — gates.md is like this."
//
// The consequence was the worst-placed one available. `--tick WO-G1` would have stamped ✅ DONE with
// every box open, on the one work order whose entire stated purpose is guarding against *declaring
// done*, and whose failure mode is going live on an app nobody rehearsed. It printed an honest NOTE
// saying the status rested on the caller's word alone — which is WO-2.14's honesty working, and is
// also a warning on a 🚩 go-live blocker, which is a thing people read past.
//
// So: no field, but boxes present → the boxes ARE the list. Deliberately NOT a second **Acceptance**
// heading bolted into gates.md, because two lists read two ways is how the brief and the tracker
// start disagreeing about what was asked for — the rule this file states twenty lines up.
//
// Over-collecting is the safe direction here and under-collecting is not: an extra box can only hold
// a work order open until a human ticks it, while a missed one closes a gate that was never run.
function checkboxesOf(lines, from, to) {
  const out = [];
  for (let j = from; j < to; j++) {
    const m = /^\s*-\s*\[([ x])\]\s*(.+)$/.exec(lines[j]);
    if (m) out.push({ line: j, ticked: m[1] === 'x', text: m[2].trim() });
    else if (out.length && /^\s{2,}\S/.test(lines[j])) out[out.length - 1].text += ' ' + lines[j].trim();
  }
  return out.length ? marked(out) : null;                      // genuinely no list — say so, as before
}

// ------------------------------------------------------------------ re-homed lines (WO-3.11)
//
// `- [ ] …the line… → WO-3.5 "quoted from the box that carries it now"`. The marker says the work
// this line names is owed by another work order, and the whole point of it is that a reader and a
// script can both check that claim without the paragraph of explanation the `- [x]` version needed.
//
// **The quoted fragment is optional and it is what makes rewording detectable.** Without it the
// line's own text is the fragment, which is right when a line was moved verbatim; WO-3.1's two were
// not — one was superseded by the owner and rewritten, the other picked up a clause on the way — so
// both quote the target's wording, exactly as **Closes roadmap** quotes a roadmap box. Same reason,
// same rules, same failure caught: a box reworded under a pointer that will not be read for weeks.
// **A marker inside backticks is prose about markers, not a marker**, and that rule was paid for on
// the first run of this code: WO-3.11's own seventh Acceptance line says the two lines are converted
// *"from `- [x]` to `- [ ] → WO-3.5`"*, and --audit read the work order that invented the syntax as
// carrying a pointer of its own. It is the same rule README.md § "Header fields" already states for
// **Closes roadmap** fragments — write notes about a thing in backticks and the parser leaves them
// alone — so a real marker is written bare, and the tick that depends on it says so when it holds.
const REHOME_MARKER = /→\s*(WO-[\dG][\w.]*)\s*(?:"([^"]*)")?/g;
const CODE_SPAN = /`[^`]*`/g;

function marked(items) {
  for (const it of items) {
    it.rehomes = [...it.text.replace(CODE_SPAN, '').matchAll(REHOME_MARKER)]
      .map(m => ({ target: m[1], fragment: m[2] || '' }));
  }
  return items;
}

// Does one `→ WO-x.y` pointer resolve? It resolves when the named work order exists, carries an
// Acceptance list, and exactly one **open** box in it matches the fragment.
//
// Every one of those four conditions is a way the debt could quietly stop existing, and "already
// ticked" is deliberately a failure rather than a pass: a ticked target box means the debt was paid
// and this pointer is stale, so the line here should be ticked on that evidence and the **Owes**
// field taken off. That is a human's edit — the tool's job is to stop the pair drifting apart in
// silence, which is the whole complaint WO-3.11 was written about.
function resolveRehome(mark, wos) {
  const target = wos.get(mark.target);
  if (!target) return `→ ${mark.target} names a work order that does not exist`;
  if (!target.acceptance || !target.acceptance.length) return `→ ${mark.target} has no Acceptance list for the line to land in`;
  const f = norm(mark.fragment || mark.text);
  if (f.length < 12) return `→ ${mark.target} carries a fragment too short to match a box safely — quote more of it`;
  const hits = target.acceptance.filter(b => norm(b.text).includes(f));
  if (hits.length !== 1) {
    return `→ ${mark.target} matched ${hits.length} of its ${target.acceptance.length} Acceptance boxes — it must match exactly one${hits.length ? '' : '. The box was deleted or reworded; quote it as it reads now'}`;
  }
  if (hits[0].ticked) return `→ ${mark.target}'s box at ${path.relative(REPO, target.file)}:${hits[0].line + 1} is already [x] — the debt was paid, so tick this line on that evidence and drop the **Owes** field`;
  return null;                                                 // resolved: the box exists and is open
}

// Every pointer on one work order, resolved. `holds` are the lines that may stop counting as open;
// `problems` are the pointers that may not, in the words the refusal prints.
function rehomesOf(wo, wos) {
  const holds = [], problems = [];
  for (const a of wo.acceptance || []) {
    if (!a.rehomes || !a.rehomes.length) continue;
    const why = a.rehomes.map(m => resolveRehome({ ...m, text: a.text.replace(REHOME_MARKER, '') }, wos)).filter(Boolean);
    if (why.length) problems.push({ item: a, why });
    else if (!a.ticked) holds.push(a);
  }

  // The **Owes** field and the markers are two statements of one fact, and either one alone rots.
  // A field naming a work order no line points at is a debt nobody can find; a line pointing
  // somewhere the field does not name is a debt the header does not admit to.
  const named = [...new Set((wo.owesRaw.match(/WO-[\dG][\w.]*/g) || []))];
  const pointed = [...new Set((wo.acceptance || []).flatMap(a => (a.rehomes || []).map(m => m.target)))];
  for (const id of named) {
    if (!pointed.includes(id)) problems.push({ item: null, why: [`**Owes** names ${id} and no Acceptance line carries a "→ ${id}" marker`] });
  }
  for (const id of pointed) {
    if (!named.includes(id)) problems.push({ item: null, why: [`an Acceptance line points at ${id} and **Owes** does not name it — add it beside **Depends on**`] });
  }
  return { holds, problems, named, pointed };
}

function acceptanceOf(lines, from, to) {
  let i = -1;
  for (let k = from; k < to; k++) if (/^\*\*Acceptance\*\*/.test(lines[k])) { i = k; break; }
  if (i < 0) return checkboxesOf(lines, from, to);             // gates.md: the boxes are the list
  const out = [];
  for (let j = i + 1; j < to; j++) {
    const l = lines[j];
    if (/^\*\*[A-Z]/.test(l)) break;                           // the next bold field ends the list
    const m = /^\s*-\s*\[([ x])\]\s*(.+)$/.exec(l);
    if (m) out.push({ line: j, ticked: m[1] === 'x', text: m[2].trim() });
    else if (out.length && /^\s{2,}\S/.test(l)) out[out.length - 1].text += ' ' + l.trim();  // wrapped
  }
  return marked(out);
}

function allWorkOrders() {
  const files = fs.readdirSync(WO_DIR)
    .filter(f => f.endsWith('.md') && f !== 'README.md' && f !== 'ROUTING.md')
    .map(f => path.join(WO_DIR, f));
  const map = new Map();
  for (const f of files) for (const wo of parseFile(f)) map.set(wo.id, wo);
  return map;
}

// "WO-1.1" → dependency. "nothing", "everything", "Phase 3" → not a work order this script can
// resolve, and reported as such rather than silently passed.
function depsOf(wo) {
  const ids = [...(wo.dependsRaw.match(/WO-[\dG][\w.]*/g) || [])];
  const prose = wo.dependsRaw.replace(/WO-[\dG][\w.]*/g, '').replace(/[…,\s·]/g, '');
  return { ids: [...new Set(ids)], hasProse: prose.length > 0 && !/^nothing$/i.test(wo.dependsRaw.trim()) };
}

// The running order in README.md. Rows look like:
//   | 6 | [WO-1.6](phase-1-...#wo-16--classes--terms) Classes & terms | M | 🚩 | Aug 10–11 |
//
// Named for the Ship 1 table it was written against, and it has read EVERY numbered work-order row
// in that file since the Ship 2 table was written on 2026-08-09 — document order, so Ship 1 first
// and then Ship 2. Worth knowing before writing a check against it, because the name says otherwise.
function shipOneOrder() {
  const rows = [];
  for (const line of read(README).split('\n')) {
    const m = /^\|\s*\d+\s*\|\s*\[(WO-[\dG][\w.]*)\]/.exec(line);
    if (m) rows.push(m[1]);
  }
  return rows;
}

// ---------------------------------------------------------------------------- gate report

function gitStatus() {
  try {
    return execFileSync('git', ['status', '--short'], { cwd: REPO, encoding: 'utf8' }).trimEnd();
  } catch {
    return '(git unavailable)';
  }
}

function dispatchFiles(id) {
  const names = ['brief', 'result', 'status', 'codex-blocked'];
  const found = {};
  for (const n of names) {
    const p = path.join(DISPATCH, `${id}-${n}.md`);
    found[n] = fs.existsSync(p) ? p : null;
  }
  return found;
}

function gate(id, wos) {
  const wo = wos.get(id);
  if (!wo) { console.error(`FAIL | no work order ${id} in ${path.relative(REPO, WO_DIR)}`); return 1; }

  const problems = [];
  const notes = [];

  console.log(`${wo.id} — ${wo.title}`);
  console.log(`  file    ${path.relative(REPO, wo.file)}:${wo.headingLine}`);
  console.log(`  ship    ${wo.ship || '—'}   size ${wo.size || '—'}   ${wo.flag ? '🚩 go-live blocker' : ''}`);
  console.log(`  status  ${wo.status}`);

  // 1. Dependencies
  const { ids, hasProse } = depsOf(wo);
  if (!ids.length && !hasProse) {
    console.log('  depends nothing');
  } else {
    for (const dep of ids) {
      const d = wos.get(dep);
      const st = d ? d.status : '(not found)';
      // ✅ DONE passes, and 🤖 CLAIMED and 🔨 IN PROGRESS both block — WO-3.11's rule, and the
      // reason the split was worth having: a dependency that landed with lines owed elsewhere is
      // ✅ DONE plus **Owes**, so it stops gating its dependents while still saying what it owes.
      const ok = st.startsWith('✅ DONE');
      const owed = d && d.owesRaw ? `   owes ${d.owesRaw}` : '';
      console.log(`  depends ${dep.padEnd(8)} ${st}${ok ? owed : '   <-- not done'}`);
      // A dependency that is not coming can never become ✅ DONE, so this gate can never open on its
      // own — the difference between a wait and a dead end, and the reader has to be told which. Both
      // of WO-1.21's two were taken off the dependency lines they sat on at the moment they were
      // decided (WO-3.13 off WO-3.20, WO-2.7 off WO-G2) precisely because of this, and the note under
      // each says why: a gate that waits on work nobody intends to do is a gate that gets waived.
      if (!ok && d && notComing(d.status)) {
        problems.push(`dependency ${dep} is ${d.status} — it will never be ✅ DONE, so this gate cannot open. Take it off the **Depends on** line, or revive ${dep} by hand and say so in its header`);
      } else if (!ok) {
        problems.push(`dependency ${dep} is ${st}, not ✅ DONE`);
      }
    }
    if (hasProse) {
      console.log(`  depends (prose) ${wo.dependsRaw}`);
      notes.push(`"Depends on" carries a non-work-order clause — read it yourself: ${wo.dependsRaw}`);
    }
    // An ellipsis between two `WO-` tokens is a range a human wrote and this parser must not guess
    // at: WO-G2's line read `Phase 3, WO-2.5 … WO-2.7` until 2026-08-09, and WO-2.6 sat in the middle
    // of it gating nothing. A WARNING, never an expansion (WO-2.16) — teaching the parser to fill in
    // a range means it invents dependencies nobody typed. It is here rather than left alone because
    // the same work order took away the accident that made anyone look: WO-G1's `**Target**` clause
    // used to bleed into this field and raise the prose NOTE above, and now it does not.
    if (/WO-[\dG][\w.]*\s*…\s*WO-[\dG][\w.]*/.test(wo.dependsRaw)) {
      notes.push(`"Depends on" has a "…" between two WO- tokens, and it is read as two dependencies rather than a range — every ID between them gates nothing. If a range is meant, write the IDs out: ${wo.dependsRaw}`);
    }
  }

  // Reported, never acted on: an amendment is prose about a box some earlier work order closed, and
  // nothing here may edit that box. It is printed because whoever is about to start this work order
  // wants to know it changes a promise already made.
  if (wo.amendsRoadmap) console.log(`  amends  ${wo.amendsRoadmap}`);

  // The same treatment, for the same reason, decided at WO-2.16. `**Blocks**` is the one that used to
  // be read as a dependency — pointing the wrong way down the sprint's one hard ordering constraint —
  // so it is printed here where a human reads it and nowhere near depsOf(). `**Target**` is a date,
  // and a gate work order's date is the point of it.
  if (wo.blocks) console.log(`  blocks  ${wo.blocks}`);
  if (wo.target) console.log(`  target  ${wo.target}`);

  // **Owes** is printed here and resolved by --audit and --tick. A pointer that has stopped
  // resolving is named on the gate report too, because the gate is what somebody reads before
  // picking the work order up, and a debt that no longer lands anywhere is a thing to know first.
  if (wo.owesRaw || (wo.acceptance || []).some(a => a.rehomes && a.rehomes.length)) {
    const { holds, problems: rehomeProblems } = rehomesOf(wo, wos);
    console.log(`  owes    ${wo.owesRaw || '(no **Owes** field)'}   ${holds.length} re-homed line(s) resolving`);
    for (const p of rehomeProblems) {
      for (const w of p.why) notes.push(`a re-homed Acceptance line does not resolve${p.item ? ` (${path.relative(REPO, wo.file)}:${p.item.line + 1})` : ''}: ${w}`);
    }
  }

  // The lesson of the three fields WO-2.16 found, armed for the fourth. An unknown field used to be
  // absorbed into whichever field was written before it, silently and plausibly; now it terminates
  // that field and is named here once, by the ID that carries it. There is no live instance of this
  // in the tree as of 2026-08-09 and that is the intended state — it fires the first time somebody
  // invents **Supersedes**, and it is the reason the field table in work-orders/README.md can say
  // what becomes of a field with no row.
  for (const f of wo.unknownFields) {
    notes.push(`**${f}** is a header field nothing reads — no row in plans/work-orders/README.md § "Header fields", no line in KNOWN_FIELDS. It is parsed only far enough to keep it out of the field written before it. Give it both, or take it out of the header block`);
  }
  for (const k of wo.strayRoadmapLines) {
    notes.push(`a **Closes/Amends roadmap** line sits below the header paragraph at ${path.relative(REPO, wo.file)}:${k + 1} — nothing in this script can see it, so --tick would tick no box and say so as if there were none. Move it into the header paragraph (--audit lists these)`);
  }

  // 2. The hard ordering constraint
  if (HARD_ORDER.appliesTo(wo.id)) {
    const anchor = wos.get(HARD_ORDER.after);
    const ok = anchor && anchor.status.startsWith('✅ DONE');
    console.log(`  order   ${HARD_ORDER.after} before ${wo.id}: ${ok ? 'satisfied' : 'NOT SATISFIED'}`);
    if (!ok) problems.push(`the hard ordering constraint is not satisfied: ${HARD_ORDER.after} is ${anchor ? anchor.status : 'missing'}`);
  }

  // 3. Gated, and 4. already started
  if (wo.status.startsWith('🔒 GATED')) problems.push(`${wo.id} is 🔒 GATED — do not start it`);
  if (wo.status.startsWith('✅ DONE')) notes.push(`${wo.id} is already ✅ DONE — ask before proceeding`);
  // The two halves of what 🔨 used to mean, said in two different sentences (WO-3.11). A claim has a
  // way back and a part-built work order does not, so the advice under them is not the same advice.
  if (wo.status.startsWith('🤖 CLAIMED')) notes.push(`${wo.id} is 🤖 CLAIMED — a dispatch has it in flight. Ask before proceeding; if that dispatch is gone, --release ${wo.id} puts it back to ⬜ NOT STARTED`);
  if (wo.status.startsWith('🔨 IN PROGRESS')) notes.push(`${wo.id} is 🔨 IN PROGRESS — part-built, and nobody is claiming to be working on it. This is what --tick writes over an open Acceptance list, so pick it up where it stopped; --release refuses this status by design`);
  if (wo.status.startsWith('🚧 BLOCKED')) problems.push(`${wo.id} is 🚧 BLOCKED`);
  // WO-1.21's two, and they fail rather than note for the same reason 🔒 GATED does: the gate report
  // is read by somebody about to start, and both answers are "not this one". The refusals say who
  // decided and point at the paragraph, because reviving either is a decision and not a command.
  if (wo.status.startsWith(STRUCK)) {
    problems.push(`${wo.id} is ${wo.status} — the owner decided it should not be built. Do not start it; reviving it is a hand edit of this status line and a note in the work order saying what changed`);
  }
  if (wo.status.startsWith(DEFERRED)) {
    problems.push(`${wo.id} is ${wo.status} — not now rather than not ever, and nothing is scheduling it. Do not start it without the owner putting it back: a hand edit of this status line to ⬜ NOT STARTED and a row in the running order`);
  }

  // 5. Interrupted-run evidence
  const files = dispatchFiles(wo.id);
  const have = Object.entries(files).filter(([, v]) => v).map(([k]) => k);
  console.log(`  dispatch ${have.length ? have.join(', ') : 'no files yet'}`);
  const git = gitStatus();
  console.log(`  git     ${git ? `${git.split('\n').length} changed path(s)` : 'clean'}`);
  if (git) for (const l of git.split('\n')) console.log(`          ${l}`);
  if (git && files.brief && !files.result) {
    notes.push('brief exists, result does not, and the tree is dirty — treat as an INTERRUPTED DRAFT: audit it line by line against the brief before building on it (see plans/dispatch-retro.md § Interrupted runs)');
  }

  console.log('');
  for (const n of notes) console.log(`NOTE | ${n}`);
  for (const p of problems) console.log(`FAIL | ${p}`);
  if (!problems.length) console.log(`PASS | gates clear for ${wo.id}`);
  return problems.length ? 1 : 0;
}

// ---------------------------------------------------------------------------- next

// A claimed row drops out of "next" the moment --start exists, and a running order that steps over
// a work order in silence is how one gets forgotten. So every skip is named, with the way back
// attached: a dispatch that died mid-flight leaves the claim behind, and from here that looks
// exactly like a dispatch still working.
//
// In --quiet mode the skips go to stderr, because stdout there is one ID that something else reads.
// Since WO-3.11 there are two reasons to step over a row and they get two different sentences,
// because they want two different things done about them. A 🤖 claim has a way back — `--release`.
// A 🔨 does not and must not: it is part-built work, `--release` refuses it by design, and the way
// back is to finish it. One line for both was exactly the confusion the split removed.
function reportSkips(claimed, quiet) {
  const say = quiet ? console.error : console.log;
  for (const wo of claimed) {
    say(`skipped ${wo.id} — ${wo.title}`);
    say(wo.status.startsWith('🤖 CLAIMED')
      ? `  ${wo.status}: a dispatch has claimed it, so this steps over it. If that dispatch is gone: node tools/wo-gate.mjs --release ${wo.id}`
      : `  🔨 IN PROGRESS: part-built work, not a claim — nothing is in flight and --release refuses this status. Pick it up where it stopped, or finish and --tick it`);
  }
  if (claimed.length && !quiet) console.log('');
}

function next(wos, quiet) {
  const claimed = [];
  for (const id of shipOneOrder()) {
    const wo = wos.get(id);
    if (!wo) continue;
    if (wo.status.startsWith('🔨 IN PROGRESS') || wo.status.startsWith('🤖 CLAIMED')) { claimed.push(wo); continue; }
    if (wo.status.startsWith('⬜ NOT STARTED')) {
      reportSkips(claimed, quiet);
      if (quiet) { console.log(wo.id); return 0; }
      console.log(`next: ${wo.id} — ${wo.title}`);
      console.log(`  size ${wo.size || '—'}${wo.flag ? '   🚩 go-live blocker' : ''}`);
      console.log(`  depends on ${wo.dependsRaw || 'nothing'}`);
      console.log('');
      return gate(wo.id, wos);
    }
  }
  reportSkips(claimed, quiet);
  console.log('next: nothing ⬜ NOT STARTED left in the running order in work-orders/README.md');
  return 0;
}

// ---------------------------------------------------------------------------- dashboard

const PHASE_ROWS = [
  ['phase-1-shell-store-roster.md', /^\|\s*1 —/],
  ['phase-2-attendance.md',         /^\|\s*2 —/],
  ['phase-3-gradebook.md',          /^\|\s*3 —/],
  ['phase-4-signals.md',            /^\|\s*4 —/],
  ['phase-5-outreach.md',           /^\|\s*5 —/],
  ['phase-6-calendar-glance.md',    /^\|\s*6 —/],
  ['phase-7-sync.md',               /^\|\s*7 —/],
  ['phase-8-packaging.md',          /^\|\s*8 —/],
  ['gates.md',                      /^\|\s*Gates\s*\|/],
];

function bar(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const filled = Math.floor(pct / 10);
  return `\`[${'█'.repeat(filled)}${'░'.repeat(10 - filled)}] ${pct}%\``;
}

// Recompute every Done count from the phase files rather than trusting the number already there.
// WO-1.1 sat verified with the dashboard reading 0 because five hand edits are easy to postpone;
// a tracker that lies about what is finished is the failure this exists to prevent.
//
// **The denominator stopped being "every work order in the file" at WO-1.21**, and the fourth column
// is the price of that. A struck or deferred work order leaves the count — otherwise the phase has a
// ceiling below 100% forever — but a number that rises because something was hidden is worse than the
// number it replaced, so the thing that left is named in the row it left, by this function, out of the
// same parse. A hand note would have done the job today and rotted at the next strike; the reader who
// sees 23 where there are 24 headings gets told which one and why in the cell beside it.
function recomputeDashboard(text) {
  const edits = [];
  let lines = text.split('\n');
  let grandTotal = 0, grandDone = 0, grandOut = 0;

  for (const [file, rowRe] of PHASE_ROWS) {
    const p = path.join(WO_DIR, file);
    if (!fs.existsSync(p)) continue;
    const wos = parseFile(p);
    const out = wos.filter(w => notComing(w.status));
    const total = wos.length - out.length;
    const done = wos.filter(w => w.status.startsWith('✅ DONE')).length;
    grandTotal += total; grandDone += done; grandOut += out.length;

    const i = lines.findIndex(l => rowRe.test(l));
    if (i < 0) { edits.push({ line: -1, note: `no dashboard row matched ${file}` }); continue; }
    const cells = lines[i].split('|');
    // | label | work orders | done | not coming | status |
    if (cells.length < 6) continue;
    const before = lines[i];
    cells[2] = ` ${total} `;
    cells[3] = ` ${done} `;
    cells[4] = ` ${out.length ? out.map(w => `${w.status.startsWith(STRUCK) ? '🚫' : '⏳'} ${w.id}`).join(' · ') : '—'} `;
    const after = cells.join('|');
    if (before !== after) { edits.push({ line: i, before, after }); lines[i] = after; }
  }

  const ti = lines.findIndex(l => /^\|\s*\|\s*\*\*\d+\*\*\s*\|/.test(l));
  if (ti >= 0) {
    const before = lines[ti];
    const after = `| | **${grandTotal}** | **${grandDone}** | **${grandOut}** | ${bar(grandDone, grandTotal)} |`;
    if (before !== after) { edits.push({ line: ti, before, after }); lines[ti] = after; }
  }
  return { text: lines.join('\n'), edits, grandTotal, grandDone, grandOut };
}

// ---------------------------------------------------------------------------- claim, and release

// Rewrite the **Status** field of one line and nothing else, leaving every other field and every `·`
// exactly where the hand that typed them put them. This is the ONLY thing --start, --release and
// --tick share, and it is deliberately a text edit with no opinion in it: each of the three decides
// its own status, for its own reason, behind its own fence.
//
// That separation is the work order's instruction, not tidiness. It used to be load-bearing in a way
// WO-3.11 has now fixed at the source: --start wrote 🔨 IN PROGRESS because a run began and --tick
// wrote the same words because the work was not finished, so one status carried two meanings and
// nothing downstream could tell them apart. --start writes 🤖 CLAIMED now. Keep the three paths
// separate anyway — a common path that decides the status for its caller is how a future --start
// starts ticking checkboxes.
function statusEdit(phaseLines, wo, statusText) {
  let line = -1;
  for (let i = wo.blockStart; i < wo.blockStart + wo.blockLines; i++) {
    if (phaseLines[i] && phaseLines[i].includes('**Status**')) { line = i; break; }
  }
  if (line < 0) return null;
  const before = phaseLines[line];
  const after = before.replace(/(\*\*Status\*\*\s*)([^·]*?)(\s*(?:·|$))/, `$1${statusText}$3`);
  return { line, before, after };
}

function printEdit(file, e) {
  console.log(`${path.relative(REPO, file)}:${e.line + 1}`);
  console.log(`  - ${e.before.trim()}`);
  console.log(`  + ${e.after.trim()}`);
}

// --start: claim a work order, so a second dispatch can see one is already in flight.
//
// The guard for that collision has been in gate() since the beginning — "already claimed — ask
// before proceeding" — and until WO-2.14 nothing could arm it, because the only thing that wrote
// a status was --tick and --tick is the last step. WO-2.4 sat at ⬜ NOT STARTED through two Codex
// rounds, a correction brief and two verifier passes.
//
// **What goes in `🤖 CLAIMED — <dispatch>` when the caller names nothing: today's date.** The suffix
// answers the question a stale claim actually raises — *how long has this been sitting?* — and the
// only other identifier available here is the work order ID, which is already on the line above it.
// `--dispatch <label>` overrides it for a caller that has something better to say, and a label
// carrying a `·` is refused rather than written, because `·` is what separates one header field from
// the next and a status that swallows the field after it is worse than no label at all.
function applyStart(id, wos, dryRun, label) {
  const wo = wos.get(id);
  if (!wo) { console.error(`FAIL | no work order ${id}`); return 1; }

  // Fence: only an unclaimed work order can be claimed. Everything else — already claimed, part-
  // built, done, blocked, gated — is either a collision or a caller with the wrong ID, and both want
  // a human before anything is written.
  if (!wo.status.startsWith('⬜ NOT STARTED')) {
    console.error(`FAIL | ${id} is "${wo.status}" — only ⬜ NOT STARTED may be claimed`);
    if (wo.status.startsWith('🤖 CLAIMED')) {
      console.error(`     | a dispatch has already claimed it. If that dispatch is gone: --release ${id}`);
    }
    if (wo.status.startsWith('🔨 IN PROGRESS')) {
      console.error(`     | this one is part-built rather than claimed — nothing is in flight, and --release refuses it (WO-3.11).`);
      console.error(`     | Picking it up is a hand edit of the status line, deliberately: it is a judgement about half-finished work.`);
    }
    // The two that are not a position on the road (WO-1.21). Claiming one is a caller with a stale
    // running order or a stale memory, and the answer is not "try again" — it is a decision the owner
    // takes, in the work order's own prose, before anything here is run.
    if (notComing(wo.status)) {
      console.error(`     | ${wo.status.startsWith(STRUCK) ? 'struck' : 'deferred'}: this work order is not coming, and no flag here reverses that.`);
      console.error(`     | Reviving it is a hand edit — the status line back to ⬜ NOT STARTED, with a dated paragraph in the work order saying what changed and who decided.`);
    }
    return 1;
  }

  if (label && /[·*\n|]/.test(label)) {
    console.error(`FAIL | --dispatch label "${label}" carries one of · * | or a newline — those break the header field parse. Nothing was written`);
    return 1;
  }

  const phaseText = read(wo.file);
  const phaseLines = phaseText.split('\n');
  const e = statusEdit(phaseLines, wo, `🤖 CLAIMED — ${label || today()}`);
  if (!e) { console.error(`FAIL | no **Status** line found under ${id}`); return 1; }

  console.log(`start ${id} — ${wo.title}${dryRun ? '   (DRY RUN — nothing written)' : ''}`);
  console.log('');
  printEdit(wo.file, e);

  if (!dryRun) {
    phaseLines[e.line] = e.after;
    fs.writeFileSync(wo.file, phaseLines.join('\n'));
  }

  console.log('');
  console.log('NOT touched: the roadmap, the dashboard, and every checkbox. A claim is not progress — the dashboards count ✅ DONE and nothing else.');
  console.log(dryRun ? 'DRY RUN | re-run without --dry-run to apply.'
                     : `PASS | ${id} claimed — ${e.after.replace(/.*\*\*Status\*\*\s*/, '').replace(/\s*·.*$/, '')}. If this dispatch dies, --release ${id} puts it back.`);
  return 0;
}

// --release: the way back. A claim outlives the run that made it, and a dispatch that dies mid-flight
// leaves the work order looking healthy while `next` steps over it forever — the tracker lying in the
// other direction. This is the one line that undoes it.
//
// It is not a status for *why* a run stopped. 🚧 BLOCKED already exists for that and a human sets it.
//
// **It touches 🤖 CLAIMED and nothing else (WO-3.11), and the refusal is the feature.** While a claim
// and a part-built work order were the same three glyphs, this could not be run safely at all — the
// caller had to know which of the two meanings the file meant, and being wrong meant setting finished
// work back to ⬜ NOT STARTED where `next` would hand it to somebody as unstarted. Now the file says
// which, so the fence can, and a caller who is wrong gets a refusal instead of a silent demotion.
function applyRelease(id, wos, dryRun) {
  const wo = wos.get(id);
  if (!wo) { console.error(`FAIL | no work order ${id}`); return 1; }

  if (!wo.status.startsWith('🤖 CLAIMED')) {
    console.error(`FAIL | ${id} is "${wo.status}" — only a claimed (🤖 CLAIMED) work order can be released`);
    if (wo.status.startsWith('🔨 IN PROGRESS')) {
      console.error(`     | 🔨 IN PROGRESS is part-built work, not a claim: there is no dispatch to release and nothing here would be undoing one.`);
    }
    if (wo.status.startsWith('✅ DONE')) {
      console.error(`     | ${id} landed. If it landed with Acceptance lines owed elsewhere, that is what its **Owes** field and its "→ WO-x.y" lines are for — not a status change.`);
    }
    return 1;
  }

  const phaseText = read(wo.file);
  const phaseLines = phaseText.split('\n');
  const e = statusEdit(phaseLines, wo, '⬜ NOT STARTED');
  if (!e) { console.error(`FAIL | no **Status** line found under ${id}`); return 1; }

  console.log(`release ${id} — ${wo.title}${dryRun ? '   (DRY RUN — nothing written)' : ''}`);
  console.log('');
  printEdit(wo.file, e);

  if (!dryRun) {
    phaseLines[e.line] = e.after;
    fs.writeFileSync(wo.file, phaseLines.join('\n'));
  }

  console.log('');
  console.log(dryRun ? 'DRY RUN | re-run without --dry-run to apply.'
                     : `PASS | ${id} released — the claim is gone, it is ⬜ NOT STARTED again and back in \`next\`. Nothing else was touched.`);
  return 0;
}

// ---------------------------------------------------------------------------- tick

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// The roadmap boxes are matched through the work order's own **Closes roadmap** line, which quotes
// the box text. Fragments are truncated at their ellipsis and compared normalized. Zero or several
// matches is reported and left alone — guessing which box to tick is exactly the thing not to do.
// Trailing punctuation is stripped because a **Closes roadmap** fragment quotes the box only as far
// as it needs to: WO-1.7 quotes "…and email fields." where the roadmap box reads "…and email fields
// editable." The sentence-ending period is the quoter's, not the box's.
function norm(s) {
  return s.replace(/`/g, '').replace(/\*\*/g, '').replace(/[…]|\.\.\./g, '')
          .replace(/\s+/g, ' ').trim().replace(/[.;,:]+$/, '').toLowerCase();
}

// A fragment is matched against ONE roadmap line. Boxes wrap, and a quotation that crosses the wrap
// can never match — quote as far as the line goes and end with an ellipsis, which norm() strips.
// That rule is written down in `plans/work-orders/README.md` § Header fields, because it is the
// difference between WO-2.5's fragment and the box it names.
function roadmapHits(frag, lines) {
  const f = norm(frag);
  if (f.length < 12) return { tooShort: true, hits: [] };
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^-\s*\[[ x]\]/.test(lines[i])) continue;
    if (norm(lines[i]).includes(f)) hits.push(i);
  }
  return { tooShort: false, hits };
}

// **Decision, 2026-08-08 (WO-2.15): a fragment that leaves no box ticked HOLDS the tick. It is not a
// NOTE.** The rule in one sentence — *a **Closes roadmap** fragment that produces no edit and is not
// already ticked is a HELD* — which covers zero matches, several matches, and a fragment too short
// to match safely, because all three are the same fact: the work order names a box, and none gets
// closed. A work order in that state is quoting a box that was reworded or one that never existed,
// and both want a human before the status line says done.
//
// The alternative was already running and already failed. WO-2.5's fragment matched zero boxes,
// `misses` printed exactly that, and the run said PASS and exited 0; nobody had ticked WO-2.5 yet,
// so the box it closes would have stayed open behind a green run. That is the same family as the two
// gaps WO-2.14 closed — the tool does something other than what it was asked, says so quietly, and
// nothing stops. A NOTE among NOTEs is what gets read past, which is the whole reason this file has
// a refusal in it at all.
//
// **"Already ticked" stays a NOTE**, deliberately: the box IS closed, it was just closed earlier, by
// hand or by an amending work order. Nothing is untrue and nothing needs a human.
function roadmapEdits(wo, roadmapText) {
  const fragments = [...wo.closesRoadmap.matchAll(/"([^"]+)"/g)].map(m => m[1]);
  const lines = roadmapText.split('\n');
  const edits = [], notes = [], blockers = [];
  for (const frag of fragments) {
    const { tooShort, hits } = roadmapHits(frag, lines);
    if (tooShort) { blockers.push(`"${frag}" is too short to match a roadmap box safely — quote more of the box`); continue; }
    if (hits.length !== 1) {
      blockers.push(`"${frag}" matched ${hits.length} roadmap boxes${hits.length ? ` (${hits.map(i => `ROADMAP.md:${i + 1}`).join(', ')})` : ''} — it must match exactly one`);
      continue;
    }
    const i = hits[0];
    if (/^-\s*\[x\]/.test(lines[i])) { notes.push(`"${frag}" is already ticked at ROADMAP.md:${i + 1}`); continue; }
    edits.push({ line: i, before: lines[i], after: lines[i].replace(/^(-\s*)\[ \]/, '$1[x]') });
  }
  return { edits, notes, blockers, fragments };
}

// ------------------------------------------------------- the roadmap's own progress dashboard
//
// `ROADMAP.md:36` makes updating the dashboard row a manual fourth step, this script only ever
// writes the dashboard in `work-orders/README.md`, and so nothing has ever read the roadmap's back.
// Found 2026-08-08 with three wrong numerators and a denominator wrong independently of all of them:
// Phase 1 reading 11/12 against twelve ticked boxes and none open, Phase 2 reading 10/16 against
// twelve, and an overall of 22/81 where the rows themselves summed to 25/82.
//
// **Report only, never write.** `--tick` touches the same files after WO-2.15 that it touched
// before, and the roadmap dashboard is not one of them — a tool that silently corrects a summary is
// how the summary stops being read.

const DASHBOARD_HEADING = /^##\s+Progress dashboard/;
const ROADMAP_PHASE_HEADING = /^##\s+Phase\s+(\d+)\b/;

// Ticked and total boxes under each `## Phase N` heading, which is what the dashboard row claims.
//
// A box carrying 🚫 or ⏳ right after its checkbox is **out of both numbers** (WO-1.21) and counted in
// `out` instead, so the row it feeds can reach 100% while the promise stays visible in the file. That
// is the deferral's whole shape: WO-2.7 keeps its box, and the Phase 2 row stops advertising a gap
// nobody is working on. The marker is checked against the work order that closes the box by --audit,
// so the two cannot drift apart in silence — which is the only thing that makes an uncounted box
// honest rather than a way of making a number go up.
function roadmapBoxCounts(lines) {
  const counts = new Map();
  let phase = null;
  for (const line of lines) {
    const h = ROADMAP_PHASE_HEADING.exec(line);
    if (h) { phase = h[1]; counts.set(phase, { done: 0, total: 0, out: 0 }); continue; }
    if (/^##\s/.test(line)) { phase = null; continue; }
    const b = /^-\s*\[([ x])\]/.exec(line);
    if (b && phase !== null) {
      const c = counts.get(phase);
      if (BOX_MARK.test(line)) { c.out++; continue; }
      c.total++;
      if (b[1] === 'x') c.done++;
    }
  }
  return counts;
}

// Every roadmap box wearing a marker, with the line it is on and which marker it wears. Used by
// --audit to hold it against the work order that closes it, in both directions.
function markedBoxes(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = BOX_MARK.exec(lines[i]);
    if (m) out.push({ line: i, mark: m[2], ticked: m[1] === 'x' });
  }
  return out;
}

// The rows of the `## Progress dashboard` table, scoped to that section so no other numbered table
// in the file can be read as one. `| 2 | Attendance | 🔨 IN PROGRESS | 12/16 `[…]` |`, and the
// overall row `| | | **Overall** | **28/82 `[…]`** |`.
function roadmapDashboardRows(lines) {
  let from = lines.findIndex(l => DASHBOARD_HEADING.test(l));
  const rows = new Map();
  let overall = null;
  if (from < 0) return { rows, overall, found: false };
  for (let i = from + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) break;
    const cells = lines[i].split('|');
    if (cells.length < 5) continue;
    if (/\*\*Overall\*\*/.test(lines[i])) {
      const m = /\*\*(\d+)\s*\/\s*(\d+)/.exec(lines[i]);
      if (m) overall = { line: i, done: +m[1], total: +m[2] };
      continue;
    }
    const p = /^\s*(\d+)\s*$/.exec(cells[1]);
    if (!p) continue;
    const m = /(\d+)\s*\/\s*(\d+)/.exec(cells[4]);
    if (m) rows.set(p[1], { line: i, done: +m[1], total: +m[2] });
  }
  return { rows, overall, found: true };
}

// Every disagreement, with both numbers on every line — a drift report that says "does not match" is
// a second thing to go and look up.
function roadmapDashboardDrift(roadmapText) {
  const lines = roadmapText.split('\n');
  const counts = roadmapBoxCounts(lines);
  const { rows, overall, found } = roadmapDashboardRows(lines);
  const problems = [];
  if (!found) return ['ROADMAP.md has no `## Progress dashboard` section — nothing to check against'];

  let sumDone = 0, sumTotal = 0, boxDone = 0, boxTotal = 0;
  for (const [phase, c] of counts) {
    boxDone += c.done; boxTotal += c.total;
    const row = rows.get(phase);
    if (!row) { problems.push(`the boxes under "## Phase ${phase}" count ${c.done}/${c.total}, and the dashboard has no row for that phase`); continue; }
    if (row.done !== c.done || row.total !== c.total) {
      problems.push(`Phase ${phase}: the dashboard row says ${row.done}/${row.total}, the boxes under "## Phase ${phase}" say ${c.done}/${c.total} (ROADMAP.md:${row.line + 1})`);
    }
  }
  for (const [phase, row] of rows) {
    sumDone += row.done; sumTotal += row.total;
    if (!counts.has(phase)) problems.push(`the dashboard has a row for Phase ${phase} reading ${row.done}/${row.total}, and there is no "## Phase ${phase}" heading in the file`);
  }
  if (!overall) {
    problems.push('the dashboard has no **Overall** row — the rows sum to ' + `${sumDone}/${sumTotal}`);
  } else {
    if (overall.done !== sumDone || overall.total !== sumTotal) {
      problems.push(`Overall: the row says ${overall.done}/${overall.total}, its own rows sum to ${sumDone}/${sumTotal} (ROADMAP.md:${overall.line + 1})`);
    }
    if (overall.done !== boxDone || overall.total !== boxTotal) {
      problems.push(`Overall: the row says ${overall.done}/${overall.total}, the boxes in the file count ${boxDone}/${boxTotal} (ROADMAP.md:${overall.line + 1})`);
    }
  }
  return problems;
}

// ------------------------------------------------- work that is not coming (WO-1.21)
//
// A struck or deferred work order leaves both dashboards' denominators, and the box it closes leaves
// ROADMAP.md's. **That is a number going up because something was taken out of it**, which is the one
// move this whole file exists to distrust — so the two halves have to agree, in both directions, or
// the deferral is just a way of hiding a promise. The status is in a phase file, the marker is in
// ROADMAP.md, and nothing but this reads them together.
//
// Both directions, because each is a different lie. A not-coming work order whose box is still counted
// leaves a phase permanently short of 100% — the defect this was written for. A marked box with no
// not-coming work order behind it is a promise that stopped being counted because somebody typed a
// glyph, which is worse: the roadmap quietly shrank and the tracker never said so.
function notComingProblems(wos, lines) {
  const problems = [], ok = [];
  const claimed = new Map();                                   // roadmap line → the work order on it

  for (const wo of wos.values()) {
    if (!notComing(wo.status)) continue;
    const want = wo.status.startsWith(STRUCK) ? '🚫' : '⏳';
    const frags = [...wo.closesRoadmap.matchAll(/"([^"]+)"/g)].map(m => m[1]);
    if (!frags.length) { ok.push(`${wo.id.padEnd(8)} ${want} closes no roadmap box — nothing to mark`); continue; }
    for (const frag of frags) {
      const { tooShort, hits } = roadmapHits(frag, lines);
      if (tooShort || hits.length !== 1) continue;             // the fragment walk above owns this
      const i = hits[0];
      claimed.set(i, wo);
      const m = BOX_MARK.exec(lines[i]);
      if (!m) {
        problems.push(`${wo.id} is ${wo.status} and the box it closes at ROADMAP.md:${i + 1} is still counted — put "${want}" straight after the checkbox, and take the box out of that phase's dashboard row by hand`);
      } else if (m[2] !== want) {
        problems.push(`${wo.id} is ${wo.status} and the box it closes at ROADMAP.md:${i + 1} is marked "${m[2]}" — struck and deferred are different facts and the box has the other one`);
      } else if (m[1] === 'x') {
        problems.push(`ROADMAP.md:${i + 1} is marked "${want}" and ticked at the same time — a box for work nobody did cannot be [x]`);
      } else {
        ok.push(`${wo.id.padEnd(8)} ${want} ROADMAP.md:${String(i + 1).padEnd(4)} marked and uncounted   ${clip(norm(lines[i]).replace(/^[🚫⏳\s]*/, ''), 52)}`);
      }
    }
  }

  for (const b of markedBoxes(lines)) {
    if (claimed.has(b.line)) continue;
    problems.push(`ROADMAP.md:${b.line + 1} carries "${b.mark}" and no ${b.mark === '🚫' ? STRUCK : DEFERRED} work order closes it — an uncounted box with nothing behind it. Name the work order in the box and give it the matching status, or take the marker off and put the box back in the count`);
  }
  return { problems, ok };
}

// ------------------------------------------------- § The files, against the files (WO-1.21)
//
// `| phase-1-shell-store-roster.md | WO-1.1 … WO-1.19 | Phase 1 |` was true until 2026-08-15 and read
// as fact for a day after it stopped being. Nine rows rot the same way, every time a phase gains a
// work order, and the fix that lasts is not nine corrected rows — it is the row being checked against
// the file it names. The claim each row makes is exactly first-and-last in document order: the `…` is
// prose shorthand and never a range, which is why WO-2.2 being merged away leaves `WO-2.1 … WO-2.34`
// correct over thirty-three work orders.
const FILES_HEADING = /^##\s+The files\s*$/;
const FILES_ROW = /^\|\s*\[`?([\w.-]+\.md)`?\]\([^)]*\)\s*\|([^|]*)\|/;

function fileRowProblems() {
  const lines = read(README).split('\n');
  const from = lines.findIndex(l => FILES_HEADING.test(l));
  if (from < 0) return { problems: ['plans/work-orders/README.md has no `## The files` section — nothing to check the phase files against'], ok: [] };

  const problems = [], ok = [];
  const seen = new Set();
  for (let i = from + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) {
    const m = FILES_ROW.exec(lines[i]);
    if (!m) continue;
    const [, file, claim] = m;
    seen.add(file);
    const p = path.join(WO_DIR, file);
    if (!fs.existsSync(p)) { problems.push(`§ The files names ${file} at README.md:${i + 1} and there is no such file in ${path.relative(REPO, WO_DIR)}`); continue; }
    const ids = parseFile(p).map(w => w.id);
    const said = claim.match(/WO-[\dG][\w.]*/g) || [];
    const want = ids.length ? [...new Set([ids[0], ids[ids.length - 1]])] : [];
    if (said.join(' … ') !== want.join(' … ')) {
      problems.push(`§ The files says ${file} holds "${said.join(' … ') || claim.trim()}" (README.md:${i + 1}) and it holds ${want.join(' … ') || 'no work orders'} — ${ids.length} of them`);
    } else {
      ok.push(`${file.padEnd(30)} ${want.join(' … ') || '—'}   ${ids.length} work order(s)`);
    }
  }

  for (const f of fs.readdirSync(WO_DIR)) {
    if (!f.endsWith('.md') || f === 'README.md' || seen.has(f)) continue;
    if (parseFile(path.join(WO_DIR, f)).length) problems.push(`${f} holds work orders and § The files has no row for it — a file nothing indexes is a file nobody reads`);
  }
  return { problems, ok };
}

// One Acceptance line, short enough to read in a list of them. The file:line beside it is how you
// get to the whole thing, and WO-2.1's second item is 900 characters of blockquote.
function clip(s, n = 100) {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

function applyTick(id, wos, dryRun) {
  const wo = wos.get(id);
  if (!wo) { console.error(`FAIL | no work order ${id}`); return 1; }

  // Fence: only a work order that is open may be ticked. Re-ticking a done one, or ticking one
  // that is BLOCKED or GATED, is a sign the caller has the wrong ID. 🤖 CLAIMED joined the list at
  // WO-3.11 and had to: it is what every dispatch now runs under, and --tick is its last step.
  if (!(wo.status.startsWith('⬜ NOT STARTED') || wo.status.startsWith('🔨 IN PROGRESS') || wo.status.startsWith('🤖 CLAIMED'))) {
    console.error(`FAIL | ${id} is "${wo.status}" — only ⬜ NOT STARTED, 🤖 CLAIMED or 🔨 IN PROGRESS may be ticked`);
    if (notComing(wo.status)) {
      console.error(`     | there is nothing here to tick: no status means "finished" for work nobody did, and the roadmap box it names (if any) stays [ ] and marked.`);
    }
    return 1;
  }

  // Re-homed lines, before anything else is decided (WO-3.11). A `- [ ] … → WO-x.y` line names work
  // this work order is not going to do, and it stops holding this work order open — **but only when
  // the pointer resolves to an open box under the named target.** A marker the tool takes on trust
  // is a `- [x]` spelled with an arrow, and the hand-ticked `- [x]` with a paragraph under it
  // explaining that it did not mean "verified" is the exact thing WO-3.11 exists to replace.
  //
  // A pointer that does NOT resolve refuses in the second style rather than the first: nothing is
  // written at all, not even 🔨 IN PROGRESS. The distinction is WO-2.15's and it holds here — an open
  // Acceptance line means the WORK is unfinished and there is a true status for that; a pointer into
  // a box that was reworded or deleted means the TRACKER is wrong about itself, and no status makes
  // that true. Same for a **Owes** field that disagrees with the markers under it.
  const rehome = rehomesOf(wo, wos);

  // The work order's own Acceptance list decides which status this writes. Before WO-2.14 this
  // hardcoded ✅ DONE and had never read a checkbox, so at WO-2.4 the offered maintenance would have
  // stamped "done" on a 🚩 go-live blocker with two lines still owed to the owner — caught by reading
  // the source, not by the tool refusing.
  //
  // An open line holds the work order at 🔨 IN PROGRESS, which is the project's own convention
  // (WO-2.1, WO-2.11 and WO-2.12 all landed there with 👤 lines owed) and was unreachable through
  // this tool until now. It writes a status because the work is unfinished — and since WO-3.11 that
  // is all 🔨 means, --start having taken 🤖 CLAIMED for the other half.
  const open = wo.acceptance ? wo.acceptance.filter(a => !a.ticked && !rehome.holds.includes(a)) : [];
  const held = open.length > 0;

  const planned = [];

  // 1. The work order's own Status line.
  const phaseText = read(wo.file);
  const phaseLines = phaseText.split('\n');
  const se = statusEdit(phaseLines, wo, held ? '🔨 IN PROGRESS' : `✅ DONE — ${today()}`);
  if (!se) { console.error(`FAIL | no **Status** line found under ${id}`); return 1; }
  const statusUnchanged = se.before === se.after;                // already 🔨 IN PROGRESS, held again
  if (!statusUnchanged) { planned.push({ file: wo.file, ...se }); phaseLines[se.line] = se.after; }

  // 2. The roadmap boxes this work order closes — and not one of them while a line is open. An
  //    unfinished work order closes nothing, however much of it is finished.
  const roadmapText = read(ROADMAP);
  const rm = held ? { edits: [], notes: [], blockers: [], fragments: [] } : roadmapEdits(wo, roadmapText);
  const roadmapLines = roadmapText.split('\n');
  for (const e of rm.edits) { planned.push({ file: ROADMAP, ...e }); roadmapLines[e.line] = e.after; }

  // 3. The dashboard, recomputed after the status edit lands.
  const readmeBefore = read(README);

  // Report
  console.log(`tick ${id} — ${wo.title}${dryRun ? '   (DRY RUN — nothing written)' : ''}`);
  console.log('');
  for (const e of planned) printEdit(e.file, e);
  if (statusUnchanged) console.log(`NOTE | the status line already reads "${wo.status}" — left exactly as it is`);
  if (wo.acceptance === null) console.log(`NOTE | ${id} has no **Acceptance** list — nothing here could hold it open, so this status is written on the caller's word alone`);

  // The refusal WO-2.49 added, and it comes before every other one because it is about whether this
  // script can read the work order at all. An **Acceptance** heading with no boxes under it is the
  // tracker being wrong about itself — the same class as the two refusals below and not the same as
  // `wo.acceptance === null`, which is a work order that keeps its list somewhere else (gates.md) and
  // has its own NOTE above. So: refuse, name the file, and write nothing.
  //
  // `all 0 Acceptance lines are ticked — nothing holds this open` is true in exactly the way that
  // makes it dangerous, and it is what this run printed on a CRLF copy of a work order with ten open
  // boxes on 2026-08-18. The split above is the fix for that file; this is the fence for the next
  // way a list goes empty, because the tick is the one moment anything here is trusted to decide
  // that a work order is finished, and an empty list can only ever say "I found nothing to read".
  if (wo.acceptance && !wo.acceptance.length) {
    console.log('');
    console.log(`HELD | ${id} has an **Acceptance** heading and no boxes under it — ${path.relative(REPO, wo.file)}:${wo.headingLine}`);
    console.log('');
    console.log('NOTE | nothing was written — not the status line above, not a roadmap box, not either dashboard.');
    console.log('NOTE | a list that parses empty is not a list that is satisfied. Either the boxes are written where this parser does not look, or the file cannot be read the way it is written — check the work order\'s own list and its line endings before running this again.');
    return 1;
  }

  // The first refusal, and since WO-3.11 it comes before the one about open lines, because it is
  // about the tracker rather than about the work: every `→ WO-x.y` marker must land somewhere, and
  // the **Owes** field must name what the markers point at. It names the line, and it writes nothing.
  if (rehome.problems.length) {
    console.log('');
    console.log(`HELD | ${id} has a re-homed Acceptance line whose pointer does not resolve:`);
    for (const p of rehome.problems) {
      if (p.item) console.log(`  ${path.relative(REPO, wo.file)}:${p.item.line + 1}  ${clip(p.item.text, 80)}`);
      for (const w of p.why) console.log(`      ${w}`);
    }
    console.log('');
    console.log('NOTE | nothing was written — not the status line above, not a roadmap box, not either dashboard.');
    console.log('NOTE | a "→ WO-x.y" marker only stops holding a work order open while it names a box that exists and is still [ ]. Quote the box as it reads now, or take the marker off and tick the line here on its own evidence. `--audit` lists every pointer in one pass.');
    return 1;
  }

  // The second refusal. Everything above has been reported; nothing below this line ticks anything.
  if (held) {
    console.log('');
    console.log(`HELD | ${open.length} of ${wo.acceptance.length} Acceptance lines are still [ ] — ${id} is not done:`);
    for (const a of open) {
      console.log(`  ${path.relative(REPO, wo.file)}:${a.line + 1}  ${clip(a.text)}`);
    }
    console.log('');
    console.log('NOTE | roadmap boxes left unticked and the dashboard left alone — an unfinished work order closes nothing.');
    if (!dryRun) fs.writeFileSync(wo.file, phaseLines.join('\n'));
    console.log(dryRun
      ? 'DRY RUN | re-run without --dry-run to write 🔨 IN PROGRESS. It will still refuse to write ✅ DONE.'
      : `HELD | ${id} left at 🔨 IN PROGRESS. Tick the lines above once they are true, then run this again.`);
    return 1;
  }

  // The third refusal, and the one WO-2.15 added. Everything above has been reported; nothing below
  // this line ticks anything either. It comes before every write, including the status line: an
  // Acceptance list holds a work order open because the WORK is unfinished and 🔨 IN PROGRESS is the
  // true thing to write, whereas a fragment that closes no box or a dashboard that does not add up
  // says the tracker is wrong about itself — and there is no status that makes that true. So this
  // one writes nothing at all and asks for a human.
  const blockers = [...rm.blockers];
  for (const k of wo.strayRoadmapLines) {
    blockers.push(`a **Closes/Amends roadmap** line at ${path.relative(REPO, wo.file)}:${k + 1} is below the header paragraph, where nothing in this script can see it — move it up into the paragraph`);
  }
  // The roadmap dashboard rides the ordinary run rather than --self-check: --self-check plants
  // violations and tests the TOOL, this checks the DOCUMENTS. Same HELD-versus-NOTE call as the
  // zero-match fragment above, and the same answer, for the narrower reason that this is the one
  // moment the tool is trusted to leave the trackers true. It is read BEFORE the writes, so a run
  // never refuses over drift it created itself — and after a clean tick it prints the row the manual
  // step now owes, because "report only" should still mean the human's next keystroke is obvious.
  const driftBefore = roadmapDashboardDrift(roadmapText);
  for (const d of driftBefore) blockers.push(`ROADMAP.md's progress dashboard has drifted — ${d}`);

  if (blockers.length) {
    console.log('');
    console.log(`HELD | ${id}'s Acceptance list is complete, and the trackers it writes into are not:`);
    for (const b of blockers) console.log(`  ${b}`);
    console.log('');
    console.log('NOTE | nothing was written — not the status line, not a roadmap box, not either dashboard.');
    console.log('NOTE | the roadmap dashboard is never written by this tool; it is ROADMAP.md\'s own maintenance step 3. Fix it by hand, then run this again. `--audit` lists every fragment and every row in one pass.');
    return 1;
  }

  // Say how many lines were read, not just that none of them was open: "all 0 lines are ticked" is
  // what a parser that found nothing would print, and it should be visible rather than inferred.
  // Since WO-2.49 the 0 cannot reach this line — the refusal above takes it — and the count is still
  // printed here, because "visible rather than inferred" is the reason it was ever printed at all.
  if (wo.acceptance) {
    console.log(`NOTE | all ${wo.acceptance.length} Acceptance lines are ticked — nothing holds ${id} open`
      .replace('are ticked', rehome.holds.length ? `are ticked or re-homed (${rehome.holds.length} re-homed, each resolving to an open box)` : 'are ticked'));
  }
  // Said on the way out as well as in the header, because this is the run that writes ✅ DONE over a
  // work order with `- [ ]` lines still on it, and the reader of the output is the person who has to
  // believe that is honest. The lines are named, with where the debt went.
  for (const a of rehome.holds) {
    console.log(`NOTE | ${path.relative(REPO, wo.file)}:${a.line + 1} stays [ ] and is owed by ${a.rehomes.map(m => m.target).join(', ')} — ${clip(a.text, 70)}`);
  }
  for (const m of rm.notes) console.log(`NOTE | roadmap: ${m}`);
  if (!rm.fragments.length) {
    console.log(wo.closesRoadmap
      ? 'NOTE | this work order\'s **Closes roadmap** line quotes no box — no roadmap box to tick'
      : 'NOTE | this work order has no **Closes roadmap** line — no roadmap box to tick');
  }

  if (!dryRun) {
    fs.writeFileSync(wo.file, phaseLines.join('\n'));
    if (rm.edits.length) fs.writeFileSync(ROADMAP, roadmapLines.join('\n'));
  }

  // Report only, and the reason this is worth printing rather than just refusing next time: ticking
  // a roadmap box is what makes that phase's dashboard row stale, so the run that causes the drift
  // is the one that can name it exactly. The hand edit is ROADMAP.md's maintenance step 3.
  for (const d of roadmapDashboardDrift(roadmapLines.join('\n'))) {
    console.log(`NOTE | ROADMAP.md's dashboard now owes a hand edit — ${d}`);
  }

  // Dashboard last, so it counts the status edit we just made. In a dry run the phase file on disk
  // is unchanged, so the preview adds this tick by hand rather than reading it back.
  const preview = dryRun ? recomputeDashboardPreview(readmeBefore, wo) : recomputeDashboard(readmeBefore);
  for (const e of preview.edits) {
    if (e.line < 0) { console.log(`NOTE | dashboard: ${e.note}`); continue; }
    console.log(`${path.relative(REPO, README)}:${e.line + 1}`);
    console.log(`  - ${e.before.trim()}`);
    console.log(`  + ${e.after.trim()}`);
  }
  if (!dryRun && preview.edits.length) fs.writeFileSync(README, preview.text);

  console.log('');
  console.log('NOT touched, by rule: any TESTING.md line carrying 👤, and CHANGELOG.md — that is prose the teacher writes.');
  console.log(dryRun ? 'DRY RUN | re-run without --dry-run to apply.' : `PASS | ${id} ticked.`);
  return 0;
}

// A dry run must not write the phase file, so the dashboard preview counts this work order as done
// without it being on disk yet.
function recomputeDashboardPreview(readmeText, wo) {
  const real = recomputeDashboard(readmeText);
  const file = path.basename(wo.file);
  const row = PHASE_ROWS.find(([f]) => f === file);
  if (!row) return real;
  const lines = real.text.split('\n');
  const i = lines.findIndex(l => row[1].test(l));
  if (i < 0) return real;
  const cells = lines[i].split('|');
  const before = real.edits.find(e => e.line === i)?.before ?? lines[i];
  cells[3] = ` ${Number(cells[3].trim()) + 1} `;
  lines[i] = cells.join('|');
  const edits = real.edits.filter(e => e.line !== i);
  edits.push({ line: i, before, after: lines[i] });

  const ti = lines.findIndex(l => /^\|\s*\|\s*\*\*\d+\*\*\s*\|/.test(l));
  if (ti >= 0) {
    const tCells = lines[ti].split('|');
    const total = Number(tCells[2].replace(/\*/g, '').trim());
    const done = Number(tCells[3].replace(/\*/g, '').trim()) + 1;
    const out = Number(tCells[4].replace(/\*/g, '').trim());          // carried, never moved by a tick
    const tBefore = real.edits.find(e => e.line === ti)?.before ?? lines[ti];
    lines[ti] = `| | **${total}** | **${done}** | **${out}** | ${bar(done, total)} |`;
    const rest = edits.filter(e => e.line !== ti);
    rest.push({ line: ti, before: tBefore, after: lines[ti] });
    return { text: lines.join('\n'), edits: rest };
  }
  return { text: lines.join('\n'), edits };
}

// ---------------------------------------------------------------------------- audit
//
// The standing sweep over the two trackers, read-only. Both halves of it exist because the same rot
// was found twice in one week and both times by a human reading source rather than by anything here:
// a **Closes roadmap** fragment quoted from a box that has since been reworded fails silently and
// only at tick time, which is the worst possible moment to find out, and the roadmap's progress
// dashboard had drifted on three rows and its own total.
//
// It is a flag on this script rather than a script of its own, per plans/verification-tooling.md:
// no tools/lib/, no second harness. It writes nothing.
function audit(wos) {
  const roadmapText = read(ROADMAP);
  const lines = roadmapText.split('\n');
  let fragments = 0, bad = 0, withField = 0;

  console.log('**Closes roadmap** fragments, against ROADMAP.md');
  console.log('');
  for (const wo of wos.values()) {
    const where = `${path.relative(REPO, wo.file)}:${wo.headingLine}`;
    for (const k of wo.strayRoadmapLines) {
      bad++;
      console.log(`  BAD  ${wo.id.padEnd(8)} a **Closes/Amends roadmap** line at ${path.relative(REPO, wo.file)}:${k + 1} is below the header paragraph — invisible to this script; move it into the paragraph`);
    }
    if (!wo.closesRoadmap) continue;
    withField++;
    const frags = [...wo.closesRoadmap.matchAll(/"([^"]+)"/g)].map(m => m[1]);
    if (!frags.length) {
      console.log(`  —    ${wo.id.padEnd(8)} **Closes roadmap** quotes no box: ${clip(wo.closesRoadmap, 70)}`);
      continue;
    }
    for (const frag of frags) {
      fragments++;
      const { tooShort, hits } = roadmapHits(frag, lines);
      if (tooShort) { bad++; console.log(`  BAD  ${wo.id.padEnd(8)} "${frag}" is too short to match safely — quote more of the box   (${where})`); continue; }
      if (hits.length !== 1) {
        bad++;
        console.log(`  BAD  ${wo.id.padEnd(8)} "${clip(frag, 70)}" matched ${hits.length} boxes — must match exactly one   (${where})`);
        continue;
      }
      const i = hits[0];
      console.log(`  ok   ${wo.id.padEnd(8)} ROADMAP.md:${String(i + 1).padEnd(4)} ${/^-\s*\[x\]/.test(lines[i]) ? '[x]' : '[ ]'} ${clip(frag, 62)}`);
    }
  }
  console.log('');
  console.log(`  ${wos.size} work orders, ${withField} with a **Closes roadmap** field, ${fragments} quoted fragments, ${bad} problem(s)`);

  // The third section, added at WO-3.11 for the same reason as the first: a pointer quoted from a box
  // that has since been reworded fails silently and only at tick time, and the tick that finds out is
  // weeks later on a work order whose author has moved on. The difference is that a **Closes roadmap**
  // fragment names a box in ROADMAP.md and a `→ WO-x.y` marker names a box in another work order, so
  // this walk is over the same directory it is standing in.
  console.log('');
  console.log('`**Owes**` and its `→ WO-x.y` markers, against the boxes they name');
  console.log('');
  let pointers = 0, owesBad = 0, withOwes = 0;
  for (const wo of wos.values()) {
    const marks = (wo.acceptance || []).filter(a => a.rehomes && a.rehomes.length);
    if (!wo.owesRaw && !marks.length) continue;
    withOwes++;
    const { problems: rehomeProblems } = rehomesOf(wo, wos);
    for (const p of rehomeProblems) {
      owesBad++;
      const where = p.item ? `${path.basename(wo.file)}:${p.item.line + 1}` : `${path.basename(wo.file)}:${wo.headingLine}`;
      for (const w of p.why) console.log(`  BAD  ${wo.id.padEnd(8)} ${w}   (${where})`);
    }
    for (const a of marks) {
      if (rehomeProblems.some(p => p.item === a)) continue;
      pointers += a.rehomes.length;
      console.log(`  ok   ${wo.id.padEnd(8)} ${a.ticked ? '[x]' : '[ ]'} → ${a.rehomes.map(m => m.target).join(', ')}   ${clip(a.text.replace(REHOME_MARKER, '').trim(), 56)}`);
    }
  }
  if (!withOwes) console.log('  —    no work order carries a **Owes** field or a re-homed line');
  console.log('');
  console.log(`  ${withOwes} work order(s) with a **Owes** field or a "→" marker, ${pointers} pointer(s) resolving, ${owesBad} problem(s)`);

  // The two WO-1.21 sections. Both are about the tracker describing itself, which is the same family
  // as everything above: a claim written by a hand, in a file, that nothing has ever read back.
  console.log('');
  console.log('🚫 struck and ⏳ deferred work orders, against the roadmap boxes they name');
  console.log('');
  const nc = notComingProblems(wos, lines);
  for (const l of nc.ok) console.log(`  ok   ${l}`);
  for (const p of nc.problems) console.log(`  BAD  ${p}`);
  if (!nc.ok.length && !nc.problems.length) console.log('  —    no work order is struck or deferred, and no roadmap box is marked');

  console.log('');
  console.log('`README.md` § The files, against the work orders each file actually holds');
  console.log('');
  const fr = fileRowProblems();
  for (const l of fr.ok) console.log(`  ok   ${l}`);
  for (const p of fr.problems) console.log(`  BAD  ${p}`);

  console.log('');
  console.log('ROADMAP.md progress dashboard, against the boxes under each `## Phase N`');
  console.log('');
  const counts = roadmapBoxCounts(lines);
  const { rows, overall } = roadmapDashboardRows(lines);
  for (const [phase, c] of counts) {
    const row = rows.get(phase);
    const ok = row && row.done === c.done && row.total === c.total;
    console.log(`  ${ok ? 'ok  ' : 'BAD '} Phase ${phase}   row ${row ? `${row.done}/${row.total}` : '(none)'}   boxes ${c.done}/${c.total}${c.out ? `   (+${c.out} not coming, uncounted)` : ''}`);
  }
  let sumDone = 0, sumTotal = 0;
  for (const r of rows.values()) { sumDone += r.done; sumTotal += r.total; }
  console.log(`  ${overall ? `overall row ${overall.done}/${overall.total}` : 'no overall row'}   rows sum ${sumDone}/${sumTotal}`);
  const drift = roadmapDashboardDrift(roadmapText);
  console.log('');
  for (const d of drift) console.log(`FAIL | ${d}`);

  const problems = bad + drift.length + owesBad + nc.problems.length + fr.problems.length;
  console.log('');
  console.log(problems
    ? `FAIL | ${problems} problem(s) across the two trackers. Nothing was written; all of it is a hand edit.`
    : 'PASS | every fragment matches exactly one roadmap box, every **Owes** pointer lands on an open box, every uncounted box has a struck or deferred work order behind it, § The files names what its files hold, and every dashboard row matches its own boxes.');
  return problems ? 1 : 0;
}

// ---------------------------------------------------------------------------- self-check
//
// The standing version of what WO-2.14 proved by hand and then lost. Every one of its ten acceptance
// lines was proved by planting a violation and watching the script refuse; every plant was unwound
// the same hour, and the evidence lives in a dispatch transcript nobody will find in November. So
// the plants live here: copy plans/ to a temp directory, plant each violation, run the script
// against the copy, and fail if any of them stops being caught.
//
// It is a flag in the file it checks, not tools/wo-selfcheck.mjs, per plans/verification-tooling.md.
//
// THE TEMP COPY IS THE ONLY FIXTURE, and getting that wrong is the worst bug this file could carry.
// Every path a plant writes goes through plantWrite(), which refuses anything inside REPO — not
// belt-and-braces: WO-2.15 was itself 🔨 IN PROGRESS while this was being written, so a plant that
// escaped into the real plans/ would have corrupted a live work order and looked hand-written
// afterwards. There is no --dry-run in that guard on purpose; the next edit to this code would be
// the one that removes the flag.
//
// THE FIXTURE IS SYNTHETIC ON PURPOSE. WO-2.15's own acceptance list had to be re-cut twice because
// it named real work orders as fixtures and both were spent the same week — WO-2.5 shipped and can
// no longer be ticked, and the three wrong dashboard rows were corrected by hand. A work order this
// function writes into the copy itself cannot be spent, and does not go stale when the trackers move.
//
// WHAT IT DOES NOT COVER, printed by the run because a green check trusted for what it never touched
// is worse than no check: the Acceptance parser otherwise — WO-2.49 plants ONE fault in it, a CRLF
// fixture, and nothing else of it is exercised and none of it against a real list — gate()'s dependency
// and ordering walk, `next`'s ordering, recomputeDashboard()'s arithmetic beyond one row and one
// total, --audit against the real trackers, and every word of every real work order. It checks the
// handful of behaviours WO-2.14 and WO-2.15 built, against one work order it made up.
//
// IT HAS A PRECONDITION, AND SINCE WO-2.16 IT SAYS SO FIRST. The copy is made from the live plans/,
// so it inherits whatever drift the trackers are carrying, and drift makes plants fail — `--tick`
// refuses over a ROADMAP.md dashboard that does not add up, which is exactly what WO-2.15 built it to
// do, so the plant that ticks the fixture goes red for a reason that is not about the script at all.
// Proved on 2026-08-09, twice, in scratch copies of plans/ and tools/ outside the repository: set one
// `## Phase N` dashboard row back to the `11/12` this tree carried on the morning of 2026-08-08, and
// the pre-WO-2.16 script names *"`--dry-run` on `--start`, `--release` and `--tick` writes nothing at
// all"* and *"a fully ticked work order still gets ✅ DONE, its roadmap box, and the dashboard"* as
// failures. Both plants had behaved perfectly. So the drift readers run over the copy FIRST, and a
// dirty copy stops the run with the drift as the reason.
//
// The precondition is NOT a tenth plant, deliberately (WO-2.16's trap). It runs before any plant
// exists, it tests the TRACKERS rather than the script, and folding it into the plant loop is how the
// next reader concludes that the trackers are what --self-check checks. They are its fixture.

const FIXTURE_ID = 'WO-9.9';
const FIXTURE_FILE = 'phase-3-gradebook.md';
const FIXTURE_PHASE = '3';
const FIXTURE_BOX = 'self-check fixture box, planted in a temp copy and never in the repository';

// The second fixture, added at WO-3.11: the work order the first one's re-homed line points AT, and
// the dependent whose gate the first one used to hold shut. Both roles at once on purpose — that is
// the real shape (WO-3.1 owed WO-3.5 and gated WO-3.3 through it), and a pointer plant needs a target
// that is itself synthetic. Naming a real work order as the target is the mistake WO-2.15's own
// acceptance list had to be re-cut twice for: every real fixture is spent within the week.
const TARGET_ID = 'WO-9.8';
const TARGET_BOX = 'the re-homed line, carried by the target fixture';

// `target` says what WO-9.8 does with the box WO-9.9's pointer names: carries it open, carries it
// ticked, reworded it, or deleted it. Those four are the whole life of a pointer, and three of them
// have to hold the tick.
function targetBoxLine(target) {
  if (target === 'ticked') return `- [x] ${TARGET_BOX}`;
  if (target === 'reworded') return '- [ ] a box whose wording moved out from under the pointer';
  if (target === 'deleted') return '- [ ] an unrelated box, and nothing else — the named one is gone';
  return `- [ ] ${TARGET_BOX}`;
}

// `boxes: false` writes the **Acceptance** heading with nothing under it (WO-2.49). That is a state a
// work order can be in for two quite different reasons — its list is written somewhere this parser
// does not look, or the file cannot be read the way it is written — and it is the state EVERY work
// order in a CRLF file was in until parseFile() started splitting on either terminator. It is a
// separate option rather than `open: 'none'` because "no boxes at all" is not a third tick state.
function acceptanceSection({ open, rehome, boxes }) {
  if (!boxes) return 'This heading carries no boxes, deliberately: a list that parses empty is not a list that is satisfied.';
  return `- [x] the first line, ticked
- [${open ? ' ' : 'x'}] the second line, which one plant unticks${rehome ? `\n- [ ] ${rehome}` : ''}`;
}

function fixtureBlock({ status, fragment, open, owes = '', rehome = '', target = 'open', boxes = true }) {
  return `
---

## ${FIXTURE_ID} — self-check fixture

**Ship** — · **Status** ${status} · **Size** S · **Depends on** nothing${owes ? ` · **Owes** ${owes}` : ''}
**Closes roadmap** Phase ${FIXTURE_PHASE} → "${fragment}"

**Why it exists.** \`wo-gate.mjs --self-check\` writes this into a temp copy of \`plans/\` and deletes
it with the copy. **If you are reading this inside the repository, a self-check died before its
cleanup ran** — delete this block, the ${TARGET_ID} block under it, and the matching fixture box in
\`ROADMAP.md\`. Nothing depends on any of them, and nothing else in the repository mentions
${FIXTURE_ID} or ${TARGET_ID}.

**Acceptance**
${acceptanceSection({ open, rehome, boxes })}

---

## ${TARGET_ID} — self-check target fixture

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** ${FIXTURE_ID}

**Why it exists.** The work order ${FIXTURE_ID}'s re-homed line points at, and the dependent its
status gates. Written into the same temp copy and deleted with it.

**Acceptance**
${targetBoxLine(target)}
`;
}

// Nothing inside the repository, ever. Called on every path a plant writes, and on the sandbox that
// holds them.
//
// COMPARED CASE-INSENSITIVELY ON WINDOWS (WO-2.44) — a case-sensitive compare against a
// case-insensitive filesystem, which is a guard that waves through the exact thing it exists to
// refuse. `REPO` above and the sandbox below come from two different sources — `import.meta.url` and
// `os.tmpdir()` — which on win32 disagree about the CASE OF THE DRIVE LETTER: `c:\dev\planbook`
// against `C:\dev\planbook\…`, one `startsWith` answering false about a path plainly inside the
// repository. Neither side's spelling is stable enough to rely on; both were observed for `REPO` on
// one machine, decided by how node was launched. The shape of the bug and its measurement are once, in
// `tools/README.md` § the `--self-check` paragraph; the two lines below are copied from
// `assertOutsideRepo()` in `tools/codex-invoke.mjs`, which hit it first, and are deliberately NOT
// shared with it — no script in `tools/` imports another.
//
// `fold` and not the local `norm` the sibling uses: this file already has a module-level `norm()`
// for markdown fragments, and a shadow of it here is a shadow nobody reading this function expects.
// Worse, deleting that shadow as redundant would fall through to the markdown `norm()`, which also
// lowercases — so the guard would go on looking correct. A distinct name makes that edit throw.
function assertOutsideRepo(p) {
  const fold = (s) => (process.platform === 'win32' ? path.resolve(s).toLowerCase() : path.resolve(s));
  const r = fold(p);
  const repo = fold(REPO);
  if (r === repo || r.startsWith(repo + path.sep)) {
    // The un-folded path, so the reader is shown what they passed and not a lowercased echo of it.
    throw new Error(`--self-check refused to write inside the repository: ${path.resolve(p)}`);
  }
  return path.resolve(p);
}

// The precondition over the guard ITSELF, before the sandbox exists (WO-2.47). `assertOutsideRepo()`
// is silent when it works and silent when it fails, which is WO-2.44's trap, and a regression would be
// exactly as quiet as the original defect: WO-2.40's first cut ran all seventeen plants inside
// `C:\dev\planbook\.guard-probe\…` and printed `PASS | 17 of 17`. Nothing in this script, in --audit or
// in the sweep would have said a word.
//
// THIS IS NOT A PLANT AT ALL, and it must not be counted as one. (It said "not an eighteenth" until
// WO-2.49 wrote an eighteenth — the ordinal was never the claim, and it rots the first time the array
// grows.) The plants are about tracker rot, and since WO-2.49 about one fault in the reader that reads
// them; this is about whether the guard that keeps them out of the repository still folds. The count is
// recorded in tools/README.md, in this run's own output and in WO-2.44's acceptance, so a precondition
// arriving as a plant would make three records wrong at once. Same reasoning as trackerDrift()'s
// precondition below (WO-2.16), and it reports the same way: before anything is planted, saying so.
//
// THREE FACTS, BECAUSE TWO OF THEM DO NOT SEPARATE THE FAILURE MODES:
//   1. A path inside the repository, spelled the way REPO is spelled, is refused. This one passes
//      even with the fold deleted — an unfolded compare of two identically-spelled paths is correct —
//      so on its own it proves nothing about WO-2.44's defect. It is here because it is the claim the
//      guard exists to make, and because its failure means something quite different from 2's.
//   2. The same path with the drive letter's case FLIPPED is refused, on win32 only. This is the one
//      that catches the fold coming back out. On POSIX that path is genuinely a different, outside
//      path, and asserting a throw there would be asserting a bug. Note what 2 is really about:
//      `import.meta.url` yields whatever case launched node — `REPO` was observed answering both
//      `c:\dev\planbook` and `C:\dev\planbook` on one machine in one sitting — so the pre-WO-2.44
//      guard was not dependably broken, it was correct BY COINCIDENCE OF INVOCATION, which is worse.
//      "Either spelling" is the property, and that is why the probe flips rather than lowercases.
//   3. A path that really is outside is NOT refused. Without this, "the fold was deleted" and "it
//      throws at everything" are the same red line, and the second would also stop every plant below.
//
// AND `--against` CANNOT PROVE ANY OF IT, which makes this unlike every other check in this file. The
// plants run the SUBJECT — a copy of this script, possibly an old one — in a child process; this
// assertion runs in the INVOKING script, because the invoking script is the one that makes the sandbox
// and writes the plants, and therefore the one whose guard is actually protecting the repository.
// `--self-check --against <a copy from before WO-2.44>` passes this precondition while running the
// buggy guard, and that is correct behaviour rather than a hole: the buggy copy is not the one holding
// the pen. What proves this precondition still bites is MUTATION — delete the fold here, watch it go
// red — which is the pattern `tools/README.md`'s WO-3.11 mutation table already uses, and the row for
// this one is in that table with the same caveat written beside it.
function guardFolds() {
  // Strings only. assertOutsideRepo() resolves and compares; it touches no filesystem, so none of
  // these three paths is created, and the probe leaves nothing behind to clean up.
  const inside = path.join(REPO, '.probe');
  // The repository's parent, and NOT os.tmpdir(): TMP is exactly what a person testing this guard
  // points into the tree, and a probe built from it would report "a path outside the repository was
  // refused" about a path that was inside it. The one shape this gets wrong is a checkout at a drive
  // root, where dirname() answers the root back and fact 3 would go red on a correct guard — left
  // unhandled rather than branched around, because it fails loud and the message names the path.
  const outside = path.join(path.dirname(REPO), 'wo-gate-guard-probe-outside');
  // The first ASCII letter of an absolute path on win32 is its drive letter, which is the pair
  // WO-2.44 was actually about (`c:` against `C:`). Written as "first letter" rather than as a
  // /^[A-Za-z]:/ rewrite so that a UNC or extended-length root flips its first letter too rather
  // than silently skipping the assertion.
  const at = [...inside].findIndex(ch => /[A-Za-z]/.test(ch));
  const flipped = at < 0 ? inside
    : inside.slice(0, at)
      + (inside[at] === inside[at].toLowerCase() ? inside[at].toUpperCase() : inside[at].toLowerCase())
      + inside.slice(at + 1);

  const refuses = (p) => { try { assertOutsideRepo(p); return false; } catch { return true; } };
  const problems = [];

  if (!refuses(inside))
    problems.push(`assertOutsideRepo() did not refuse ${inside}, which is inside the repository. That is the whole of what this guard is for.`);

  if (process.platform === 'win32') {
    if (at < 0)
      problems.push(`assertOutsideRepo() could not be asked about a flipped drive letter: ${inside} contains no ASCII letter to flip. The win32 fact is unasserted, which is not the same as passing.`);
    else if (!refuses(flipped))
      problems.push(`assertOutsideRepo() did not refuse ${flipped}, which is ${inside} with the drive letter's case flipped and therefore the same directory on this filesystem. This is WO-2.44's defect exactly: the win32 fold is gone from the compare, so the guard is correct only when REPO happens to be spelled the way node was launched.`);
  }

  if (refuses(outside))
    problems.push(`assertOutsideRepo() refused ${outside}, which is outside the repository. A guard that throws at everything refuses the sandbox too — it is not a stricter guard, it is a broken one, and it would stop every plant below for a reason that has nothing to do with them.`);

  return { problems, inside, flipped, outside, flippable: at >= 0 };
}

// The precondition, over the COPY, before a plant exists: the two things that can earn a `HELD` and
// therefore turn a healthy plant red. Both readers are --audit's own — roadmapDashboardDrift() and
// roadmapHits() — pointed at a different directory, which is the whole reason parseFile() takes a
// path and roadmapDashboardDrift() takes text.
//
// Only these two, and the boundary is not obvious enough to leave unwritten: drift in
// work-orders/README.md's dashboard does NOT belong here (--tick recomputes that table itself, so it
// cannot hold a tick), and a **Closes roadmap** line below the header paragraph does not either — a
// stray only blocks the tick of the work order carrying it, and the fixture carries its own header.
// A zero-match fragment in some other work order cannot break a plant today for the same reason; it
// is checked anyway, because it is the same tracker rot and the next plant to tick something other
// than the fixture would find out the hard way.
function trackerDrift(plansDir) {
  const roadmapText = fs.readFileSync(path.join(plansDir, 'ROADMAP.md'), 'utf8');
  const lines = roadmapText.split('\n');
  const problems = roadmapDashboardDrift(roadmapText).map(d => `ROADMAP.md's progress dashboard — ${d}`);

  const dir = path.join(plansDir, 'work-orders');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'README.md' && f !== 'ROUTING.md');
  for (const f of files) {
    for (const wo of parseFile(path.join(dir, f))) {
      for (const frag of [...wo.closesRoadmap.matchAll(/"([^"]+)"/g)].map(m => m[1])) {
        const { tooShort, hits } = roadmapHits(frag, lines);
        if (tooShort) problems.push(`${wo.id} (${f}:${wo.headingLine}) quotes "${frag}", which is too short to match a roadmap box safely`);
        else if (hits.length !== 1) problems.push(`${wo.id} (${f}:${wo.headingLine}) quotes "${clip(frag, 60)}", which matches ${hits.length} roadmap boxes and must match exactly one`);
      }
    }
  }
  return problems;
}

// What a failing plant prints as its evidence, and the reason it is not a clip of the first n
// characters any more (WO-2.16). Every refusal in this file states its verdict on the way OUT — a
// `HELD |` header with its reasons indented under it — so the head-clip showed the banner and cut the
// reason off. On 2026-08-09 that cost a reader a morning: a copied ROADMAP.md carrying this tree's own
// dashboard drift earned a HELD, two plants reported it as their own failure, and neither could say
// why.
//
// The verdict lines, then. Not the last line — the last line of a HELD is the instruction, not the
// cause. Not the whole captured run behind a flag either: a flag is a second thing to know about
// before the output is readable, and it defaults to the broken behaviour, which is how the reason
// stays hidden for whoever hits this next. A plant failure is rare enough to afford twelve lines.
function verdict(out) {
  const lines = out.split('\n');
  const keep = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*(?:HELD|FAIL)\s*\|/.test(lines[i])) continue;
    keep.push(lines[i].trim());
    for (let j = i + 1; j < lines.length && /^\s+\S/.test(lines[j]); j++) keep.push(lines[j].trim());
  }
  const tail = lines.filter(l => l.trim()).slice(-3).map(l => l.trim());   // no verdict at all: the end of it
  return (keep.length ? keep : tail).slice(0, 12).map(l => `  ${l}`);
}

function selfCheck(subjectPath) {
  const subject = path.resolve(subjectPath);
  if (!fs.existsSync(subject)) { console.error(`FAIL | --self-check --against: no such file "${subject}"`); return 1; }

  // 0. The guard precondition, before the sandbox exists — see guardFolds() above for the three facts,
  //    for why this is a precondition and not a plant at all, and for why `--against` cannot
  //    reach it. Stopping here costs no plant: on a tree where the guard folds, every plant is still
  //    made and still counted.
  const guard = guardFolds();
  if (guard.problems.length) {
    console.log('');
    console.log('FAIL | --self-check checks its own repo-write guard before it makes a sandbox, and');
    console.log('     | assertOutsideRepo() is not refusing what it must. Nothing was planted, no');
    console.log('     | sandbox was made, and plans/ was not copied anywhere.');
    console.log('');
    for (const p of guard.problems) console.log(`     | ${p}`);
    console.log('');
    console.log('  0 plants made, and this is NOT one of the plants — those are about tracker rot,');
    console.log('  and this is about whether the guard that keeps them out of the repository still');
    console.log('  folds on win32 (WO-2.44, WO-2.47). The count above is unchanged by this check.');
    console.log('');
    console.log('  `--against` cannot see this: the guard protecting the repository during a run is');
    console.log('  THIS file\'s, whatever subject was named. The fold at assertOutsideRepo() is the');
    console.log('  thing to read, and `tools/README.md`\'s mutation table records it going red.');
    console.log('');
    console.log(`FAIL | ${guard.problems.length} problem(s) in this script's assertOutsideRepo(). Every path a plant writes goes through it, and so does the sandbox that holds them.`);
    return 1;
  }
  console.log('--self-check precondition');
  console.log(`  guard     assertOutsideRepo() refuses ${guard.inside}${guard.flippable && process.platform === 'win32' ? ` at either drive-letter case (${guard.flipped} too)` : ''} and allows ${guard.outside}`);
  console.log('            — checked before the sandbox exists, and not one of the plants (WO-2.47)');

  const sandbox = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'wo-gate-selfcheck-'));
  try {
    // The sandbox itself goes through the guard, not only the paths written under it (WO-2.44).
    // mkdtemp() reads TMP, which is outside this file's control, so this is the one path that can put
    // the whole copy of plans/ inside the repository without any single write below being wrong — and
    // refusing here stops the run before that copy is made rather than one write into it.
    assertOutsideRepo(sandbox);
    return runPlants(subject, sandbox);
  } finally {
    // Both exit paths, including the throwing one: the plants are corrupted tracker files and a
    // leftover copy of them is the next reader's confusing morning.
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
}

function runPlants(subject, sandbox) {
  const rel = p => path.join(sandbox, 'plans', p);
  const readSb = p => fs.readFileSync(rel(p), 'utf8');
  const plantWrite = (p, text) => fs.writeFileSync(assertOutsideRepo(rel(p)), text);

  console.log('--self-check');
  console.log(`  subject   ${subject}`);
  console.log(`  sandbox   ${sandbox}   (copied from ${path.relative(REPO, path.join(REPO, 'plans'))}, deleted on the way out)`);

  // 1. The copy. The subject script goes in beside it, so the script under test resolves REPO to the
  //    sandbox and cannot reach the real plans/ even if every other guard here were wrong.
  fs.mkdirSync(path.join(sandbox, 'tools'));
  fs.copyFileSync(subject, assertOutsideRepo(path.join(sandbox, 'tools', 'wo-gate.mjs')));
  fs.cpSync(path.join(REPO, 'plans'), assertOutsideRepo(path.join(sandbox, 'plans')), { recursive: true });

  // 1b. The precondition, stated and checked before anything is planted. See the section comment: the
  //     copy inherits the trackers' drift, drift earns a `HELD`, and a `HELD` makes a healthy plant
  //     report a failure that is not about the script. Stopping here costs no plant — every plant is
  //     still made and still counted on a clean tree — and it is the one exit path where the answer
  //     "go and read the two plants it named" is wrong, so it names the trackers instead.
  const drift = trackerDrift(path.join(sandbox, 'plans'));
  if (drift.length) {
    console.log('');
    console.log('FAIL | --self-check requires the trackers to be clean before it can plant anything,');
    console.log('     | and the copy it just made is not. Nothing was planted; no fixture was written.');
    console.log('');
    for (const d of drift) console.log(`     | ${d}`);
    console.log('');
    console.log('  0 plants made. A plant failure has to mean a plant failed — the plants check this');
    console.log('  script, and the trackers are the fixture they run against, so drift in the fixture');
    console.log('  is reported here rather than as two unrelated plants going red (WO-2.16).');
    console.log('');
    console.log(`FAIL | ${drift.length} problem(s) in the trackers, copied from plans/. \`node tools/wo-gate.mjs --audit\` shows them against the real files; all of it is a hand edit, and nothing here will make one.`);
    return 1;
  }

  // 2. The fixture's roadmap box, and the dashboard row it moves. Added before the snapshot so the
  //    copy is self-consistent: a box added without its row would be drift, and the drift plant
  //    below has to be the only thing that puts drift in this copy.
  {
    const lines = readSb('ROADMAP.md').split('\n');
    const at = lines.findIndex(l => ROADMAP_PHASE_HEADING.test(l) && ROADMAP_PHASE_HEADING.exec(l)[1] === FIXTURE_PHASE);
    if (at < 0) throw new Error(`--self-check found no "## Phase ${FIXTURE_PHASE}" heading in ROADMAP.md`);
    let box = -1;
    for (let i = at + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) {
      if (/^-\s*\[[ x]\]/.test(lines[i])) { box = i; break; }
    }
    if (box < 0) throw new Error(`--self-check found no boxes under "## Phase ${FIXTURE_PHASE}"`);
    lines.splice(box, 0, `- [ ] ${FIXTURE_BOX}`);          // before the first box: never inside a wrap
    const { rows, overall } = roadmapDashboardRows(lines);
    const bump = (i, m) => { lines[i] = lines[i].replace(m, (s, d, t) => s.replace(`${d}/${t}`, `${d}/${+t + 1}`)); };
    bump(rows.get(FIXTURE_PHASE).line, /(\d+)\s*\/\s*(\d+)/);
    bump(overall.line, /\*\*(\d+)\s*\/\s*(\d+)/);
    plantWrite('ROADMAP.md', lines.join('\n'));
  }

  // 2b. A running-order row for the fixture, so `next` has something to step over — placed ABOVE
  //     every real row, which is the whole of the fix WO-2.16 made here.
  //
  //     It used to go below the last real row, under the comment "Every real row in that table is
  //     ✅ DONE, so a run against the copy without this would exercise nothing." That was true on
  //     2026-08-08, when Ship 1 had just closed and there was no running order past it, and it was
  //     false the next morning: the Ship 2 table put twelve ⬜ NOT STARTED rows ahead of the fixture,
  //     `next` answered one of those and never reached row 99, and the plant reported four failures,
  //     none of which was a defect in `next`. The sentence that made the assumption reasonable is the
  //     sentence that made it invisible — so the assumption is gone rather than restated.
  //
  //     From the top, the fixture is the first row `next` reads whatever the live tables contain:
  //     claimed, it is the skip that gets named; unclaimed, it is what `next` offers. Neither
  //     assertion depends on a real row's status any more. The number in the cell is decoration —
  //     `shipOneOrder()` reads document order, not the number — and 0 says so.
  {
    const p = path.join('work-orders', 'README.md');
    const lines = readSb(p).split('\n');
    const first = lines.findIndex(l => /^\|\s*\d+\s*\|\s*\[(WO-[\dG][\w.]*)\]/.test(l));
    if (first < 0) throw new Error('--self-check found no running-order table in work-orders/README.md');
    lines.splice(first, 0,
      `| 0 | [${FIXTURE_ID}](${FIXTURE_FILE}#wo-99--self-check-fixture) self-check fixture | S | | — |`,
      `| 0 | [${TARGET_ID}](${FIXTURE_FILE}#wo-98--self-check-target-fixture) self-check target fixture | S | | — |`);
    plantWrite(p, lines.join('\n'));
  }

  // 2c. The § The files row for the phase file the fixture is appended to (WO-1.21). Every reset()
  //     writes WO-9.9 and WO-9.8 into that file, so the index saying which work orders it holds has
  //     to say WO-9.8 as well or --audit is reporting the fixture as rot. Same rule as step 2 above,
  //     and the same reason: the only drift in this copy may be drift a plant put there.
  {
    const p = path.join('work-orders', 'README.md');
    const lines = readSb(p).split('\n');
    const i = lines.findIndex(l => l.includes(`](${FIXTURE_FILE})`));
    if (i < 0) throw new Error(`--self-check found no § The files row for ${FIXTURE_FILE}`);
    const cells = lines[i].split('|');
    cells[2] = ` ${(cells[2].match(/WO-[\dG][\w.]*/) || [`WO-${FIXTURE_PHASE}.1`])[0]} … ${TARGET_ID} `;
    lines[i] = cells.join('|');
    plantWrite(p, lines.join('\n'));
  }

  // 3. The pristine state every plant is reset to — the copy WITHOUT the fixture work order, so each
  //    plant writes the whole fixture rather than editing the last one's leavings.
  const snapshot = () => {
    const files = new Map();
    const walk = dir => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p); else files.set(path.relative(path.join(sandbox, 'plans'), p), fs.readFileSync(p, 'utf8'));
      }
    };
    walk(path.join(sandbox, 'plans'));
    return files;
  };
  const pristine = snapshot();
  const basePhase = readSb(path.join('work-orders', FIXTURE_FILE));
  const changedSince = snap => {
    const now = snapshot(), out = [];
    for (const [f, text] of now) if (!snap.has(f) || snap.get(f) !== text) out.push(f);
    for (const f of snap.keys()) if (!now.has(f)) out.push(`${f} (deleted)`);
    return out;
  };
  const reset = opts => {
    for (const [f, text] of pristine) plantWrite(f, text);
    plantWrite(path.join('work-orders', FIXTURE_FILE), basePhase + fixtureBlock(opts));
  };

  const run = args => {
    const r = spawnSync(process.execPath, [path.join(sandbox, 'tools', 'wo-gate.mjs'), ...args],
                        { cwd: sandbox, encoding: 'utf8' });
    return { code: r.status === null ? 1 : r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
  };

  // Readers over the copy, deliberately independent of the parser above: the subject is what is
  // being tested, so nothing here may ask it what it wrote.
  const fixtureStatus = () => {
    const m = new RegExp(`## ${FIXTURE_ID} —[\\s\\S]*?\\*\\*Status\\*\\*\\s*([^·\\n]*)`).exec(readSb(path.join('work-orders', FIXTURE_FILE)));
    return m ? m[1].trim() : '(no status line)';
  };
  const fixtureBoxLine = () => readSb('ROADMAP.md').split('\n').find(l => l.includes(FIXTURE_BOX) && /^-\s*\[/.test(l)) || '';
  const readmeRow = () => (readSb(path.join('work-orders', 'README.md')).split('\n').find(l => /^\|\s*3 —/.test(l)) || '').split('|');

  // The target fixture's box, read the same way and for the same reason: a plant about a pointer has
  // to be able to say what the box at the other end of it looks like.
  const targetBoxState = () => {
    const block = readSb(path.join('work-orders', FIXTURE_FILE)).split(`## ${TARGET_ID} —`)[1] || '';
    const line = block.split('\n').find(l => /^-\s*\[[ x]\]/.test(l)) || '';
    return line.trim();
  };

  // The fixture's roadmap box, taken out of the count the way a real one is: the marker straight
  // after the checkbox, and the two rows that were counting it moved down. Both halves in one step,
  // deliberately — a marked box left in a dashboard row is drift, drift earns a `HELD`, and a plant
  // that goes red for drift it planted itself is the WO-2.16 morning all over again.
  const markFixtureBox = mark => {
    const lines = readSb('ROADMAP.md').split('\n');
    const i = lines.findIndex(l => l.includes(FIXTURE_BOX) && /^-\s*\[/.test(l));
    if (i < 0) throw new Error('--self-check could not find the fixture box to mark');
    lines[i] = lines[i].replace(/^(-\s*\[[ x]\]\s*)/, `$1${mark} `);
    const { rows, overall } = roadmapDashboardRows(lines);
    const drop = (at, re) => { lines[at] = lines[at].replace(re, (s, d, t) => s.replace(`${d}/${t}`, `${d}/${+t - 1}`)); };
    drop(rows.get(FIXTURE_PHASE).line, /(\d+)\s*\/\s*(\d+)/);
    drop(overall.line, /\*\*(\d+)\s*\/\s*(\d+)/);
    plantWrite('ROADMAP.md', lines.join('\n'));
  };

  const OK = '⬜ NOT STARTED', RUN = '🔨 IN PROGRESS', CLAIM = '🤖 CLAIMED';
  const STRUCK_AT = `${STRUCK} — 2026-01-01`, DEFERRED_AT = `${DEFERRED} — 2026-01-01`;
  const plants = [
    {
      name: 'an unticked Acceptance line holds --tick at 🔨 IN PROGRESS instead of ✅ DONE',
      run: () => {
        // From 🤖 CLAIMED, which is where a dispatch's last step now runs from (WO-3.11): this plant
        // is the one that proves --tick both accepts a claim and answers it with the OTHER glyph.
        reset({ status: `${CLAIM} — 2026-01-01`, fragment: FIXTURE_BOX, open: true });
        const before = snapshot();
        const r = run(['--tick', FIXTURE_ID]);
        const bad = [];
        if (r.code === 0) bad.push('--tick exited 0 over an open Acceptance line');
        if (!/HELD/.test(r.out)) bad.push('the run never said HELD');
        if (!/the second line/.test(r.out)) bad.push('the run did not name the line that held it open');
        if (/✅ DONE/.test(fixtureStatus())) bad.push(`it wrote "${fixtureStatus()}" over an open Acceptance list`);
        if (!fixtureStatus().startsWith(RUN)) bad.push(`a held tick left the status at "${fixtureStatus()}", not 🔨 IN PROGRESS`);
        if (/^-\s*\[x\]/.test(fixtureBoxLine())) bad.push('it ticked the roadmap box of an unfinished work order');
        if (changedSince(before).some(f => f.endsWith('README.md'))) bad.push('it moved a dashboard');
        return bad;
      },
    },
    {
      name: 'a second --start on a claimed work order is refused',
      run: () => {
        reset({ status: OK, fragment: FIXTURE_BOX, open: false });
        const bad = [];
        const unclaimed = snapshot();
        const first = run(['--start', FIXTURE_ID]);
        if (first.code !== 0) bad.push(`the first --start exited ${first.code}:`, ...verdict(first.out));
        if (!fixtureStatus().startsWith(CLAIM)) bad.push(`the first --start left the status at "${fixtureStatus()}"`);
        // A claim is not progress: both dashboards count ✅ DONE and nothing else.
        const moved = changedSince(unclaimed).filter(f => !f.endsWith(FIXTURE_FILE));
        if (moved.length) bad.push(`a claim moved ${moved.join(', ')} — it may only touch the work order's own status line`);
        const before = snapshot();
        const second = run(['--start', FIXTURE_ID]);
        if (second.code === 0) bad.push('a second --start on the same ID exited 0');
        if (changedSince(before).length) bad.push(`the refused --start still wrote ${changedSince(before).join(', ')}`);
        return bad;
      },
    },
    {
      name: '--start on ✅ DONE, 🔨 IN PROGRESS, 🚧 BLOCKED and 🔒 GATED is refused, and writes nothing',
      run: () => {
        const bad = [];
        // 🔨 joined the list at WO-3.11 and is the interesting one: part-built work is not free to
        // claim, because a claim on it would say a dispatch is in flight when the truth is that one
        // stopped. Picking it up is a hand edit, deliberately.
        for (const status of ['✅ DONE — 2026-01-01', RUN, '🚧 BLOCKED', '🔒 GATED — waiting on a fixture']) {
          reset({ status, fragment: FIXTURE_BOX, open: false });
          const before = snapshot();
          const r = run(['--start', FIXTURE_ID]);
          if (r.code === 0) bad.push(`--start on a "${status}" work order exited 0`);
          const changed = changedSince(before);
          if (changed.length) bad.push(`--start on "${status}" wrote ${changed.join(', ')}`);
        }
        return bad;
      },
    },
    {
      name: '--release refuses ⬜, ✅ DONE and 🔨 IN PROGRESS, and returns a 🤖 claimed one to ⬜ NOT STARTED',
      run: () => {
        const bad = [];
        // ✅ DONE and 🔨 joined this list at WO-3.11 and are the reason the split was worth having.
        // While a claim and a landed-with-lines-owed work order were the same three glyphs, running
        // this on the wrong one set finished work back to ⬜ NOT STARTED, where `next` hands it to the
        // next dispatch as unstarted. The fence can only refuse what the file can distinguish.
        for (const status of [OK, '✅ DONE — 2026-01-01', RUN]) {
          reset({ status, fragment: FIXTURE_BOX, open: false });
          const before = snapshot();
          const r = run(['--release', FIXTURE_ID]);
          if (r.code === 0) bad.push(`--release on a "${status}" work order exited 0`);
          if (changedSince(before).length) bad.push(`--release on "${status}" wrote ${changedSince(before).join(', ')}`);
        }

        // The way back, which is the whole reason --release exists: a dispatch that died mid-flight
        // leaves a claim behind, and `next` steps over it forever.
        reset({ status: `${CLAIM} — 2026-01-01`, fragment: FIXTURE_BOX, open: false });
        const claimed = snapshot();
        const back = run(['--release', FIXTURE_ID]);
        if (back.code !== 0) bad.push(`--release on a claimed work order exited ${back.code}:`, ...verdict(back.out));
        if (!fixtureStatus().startsWith(OK)) bad.push(`--release left the status at "${fixtureStatus()}"`);
        const moved = changedSince(claimed).filter(f => !f.endsWith(FIXTURE_FILE));
        if (moved.length) bad.push(`--release also wrote ${moved.join(', ')}`);
        return bad;
      },
    },
    {
      name: '--dry-run on --start, --release and --tick writes nothing at all',
      run: () => {
        const bad = [];
        // The status each dry run must PRINT as its `+` line and must not WRITE. Reading the banner
        // is not enough — WO-2.14's own acceptance line says compare the file, don't trust the word.
        for (const [status, edit, args] of [[OK, CLAIM, ['--start', FIXTURE_ID, '--dry-run']],
                                            [`${CLAIM} — 2026-01-01`, OK, ['--release', FIXTURE_ID, '--dry-run']],
                                            [`${CLAIM} — 2026-01-01`, '✅ DONE', ['--tick', FIXTURE_ID, '--dry-run']]]) {
          reset({ status, fragment: FIXTURE_BOX, open: false });
          const before = snapshot();
          const r = run(args);
          if (r.code !== 0) bad.push(`${args[0]} --dry-run exited ${r.code}:`, ...verdict(r.out));
          if (!/DRY RUN/.test(r.out)) bad.push(`${args[0]} --dry-run never said DRY RUN`);
          if (!r.out.split('\n').some(l => l.trim().startsWith('+') && l.includes(edit))) {
            bad.push(`${args[0]} --dry-run never printed the edit it would make (a "+" line reading ${edit})`);
          }
          const changed = changedSince(before);
          if (changed.length) bad.push(`${args[0]} --dry-run wrote ${changed.join(', ')}`);
        }
        return bad;
      },
    },
    {
      name: 'a fully ticked work order still gets ✅ DONE, its roadmap box, and the dashboard',
      run: () => {
        reset({ status: `${CLAIM} — 2026-01-01`, fragment: FIXTURE_BOX, open: false });
        const rowBefore = readmeRow();
        const r = run(['--tick', FIXTURE_ID]);
        const bad = [];
        if (r.code !== 0) bad.push(`--tick exited ${r.code} on a fully ticked work order:`, ...verdict(r.out));
        if (!/✅ DONE — \d{4}-\d{2}-\d{2}/.test(fixtureStatus())) bad.push(`the status reads "${fixtureStatus()}"`);
        if (!/^-\s*\[x\]/.test(fixtureBoxLine())) bad.push('the roadmap box it closes was left unticked');
        const rowAfter = readmeRow();
        if (rowBefore.length < 5 || rowAfter.length < 5) bad.push('no Phase 3 row in the work-orders dashboard to read');
        else if (Number(rowAfter[3]) !== Number(rowBefore[3]) + 1) bad.push(`the dashboard Done cell went ${rowBefore[3].trim()} → ${rowAfter[3].trim()}, expected +1`);
        return bad;
      },
    },
    {
      name: 'a **Closes roadmap** fragment matching no box holds the tick and writes nothing',
      run: () => {
        reset({ status: RUN, fragment: 'a roadmap box that no line of ROADMAP.md contains', open: false });
        const before = snapshot();
        const r = run(['--tick', FIXTURE_ID]);
        const bad = [];
        if (r.code === 0) bad.push('--tick exited 0 on a work order whose fragment closes nothing');
        if (!/HELD/.test(r.out)) bad.push('the run never said HELD');
        if (!/matched 0/.test(r.out)) bad.push('the run did not say the fragment matched 0 boxes');
        const changed = changedSince(before);
        if (changed.length) bad.push(`it wrote ${changed.join(', ')}`);
        return bad;
      },
    },
    {
      // The claim outlives the run that made it, so a row that drops out of `next` in silence is a
      // work order lost from the running order while looking healthy. WO-2.14's tenth deliverable.
      //
      // Every assertion here is about the FIXTURE's row, which step 2b puts above every real one. It
      // used to assert against "the one ⬜ NOT STARTED row in the table", which was an assertion about
      // the live running order wearing a plant's clothes — see 2b.
      name: '`next` names both kinds of skipped row — 🤖 with the way back, 🔨 without one',
      run: () => {
        const bad = [];
        reset({ status: `${CLAIM} — 2026-01-01`, fragment: FIXTURE_BOX, open: false });
        const claimed = run(['next']);
        if (!new RegExp(`skipped ${FIXTURE_ID}`).test(claimed.out)) bad.push('`next` stepped over a 🤖 CLAIMED row without naming it');
        if (!new RegExp(`--release ${FIXTURE_ID}`).test(claimed.out)) bad.push('`next` named the skip without the way back');

        // The other half of the split (WO-3.11): 🔨 is still skipped — part-built work is not the
        // next thing to start — but --release refuses it, so offering it as the way back would send
        // the reader to a command that says no. The two sentences are the whole point of the glyph.
        reset({ status: RUN, fragment: FIXTURE_BOX, open: false });
        const partBuilt = run(['next']);
        if (!new RegExp(`skipped ${FIXTURE_ID}`).test(partBuilt.out)) bad.push('`next` stepped over a 🔨 IN PROGRESS row without naming it');
        if (!/part-built/.test(partBuilt.out)) bad.push('`next` did not say what 🔨 IN PROGRESS means when it skipped one');
        if (new RegExp(`node tools/wo-gate.mjs --release ${FIXTURE_ID}`).test(partBuilt.out)) {
          bad.push('`next` offered --release as the way back out of 🔨 IN PROGRESS, which refuses it');
        }

        reset({ status: OK, fragment: FIXTURE_BOX, open: false });
        const open = run(['next']);
        if (!new RegExp(`next: ${FIXTURE_ID}`).test(open.out)) bad.push('`next` did not offer the fixture row, which sits above every real row in the copy');
        // No skip at all, not just no skip of the fixture: the fixture is the first row, so `next`
        // returns at it before it can reach a real claim. That stays true whatever the live table has
        // claimed — which is the difference between this assertion and the one it replaced.
        if (/skipped/.test(open.out)) bad.push('`next` reported a skip with nothing claimed ahead of the fixture');
        return bad;
      },
    },
    // ------------------------------------------------------------------ WO-3.11's four
    //
    // Three of these plant a violation the split invented; the fourth plants the thing that is
    // supposed to WORK, and it is not optional. A resolver that answered "no" to every pointer would
    // pass all three violation plants in a row and would have broken the one behaviour the field
    // exists for. The same trap caught WO-3.1's float tolerance and WO-3.2's sorted scale: a check
    // that only ever sees the failure it is named after goes green against a build that fails
    // everything. So the positive path is planted beside them, in both marker forms.
    {
      name: 'a re-homed line whose pointer resolves stops holding the work order open, in both marker forms',
      run: () => {
        const bad = [];
        // Bare marker: the line's own text is the fragment, which is right when a line moved
        // verbatim. Quoted marker: the fragment is quoted from the target, which is what WO-3.1's two
        // lines need, because one was superseded by the owner and the other picked up a clause.
        for (const [form, rehome] of [['bare', `${TARGET_BOX} → ${TARGET_ID}`],
                                      ['quoted', `a line this fixture will not close → ${TARGET_ID} "${TARGET_BOX}"`]]) {
          reset({ status: `${CLAIM} — 2026-01-01`, fragment: FIXTURE_BOX, open: false, owes: TARGET_ID, rehome, target: 'open' });
          const r = run(['--tick', FIXTURE_ID]);
          if (r.code !== 0) bad.push(`--tick exited ${r.code} on a ${form} pointer that resolves:`, ...verdict(r.out));
          if (!/✅ DONE — \d{4}-\d{2}-\d{2}/.test(fixtureStatus())) bad.push(`the ${form} form left the status at "${fixtureStatus()}"`);
          if (!/^-\s*\[ \]/.test(targetBoxState())) bad.push(`the ${form} form ticked the target's box: "${targetBoxState()}"`);
          if (!/stays \[ \] and is owed by/.test(r.out)) bad.push(`the ${form} form wrote ✅ DONE over an open line without saying which line or who owes it`);

          // And the dependent's gate, which is the reason any of this exists: WO-3.1 at 🔨 failed
          // WO-3.3's gate for a fortnight of nothing.
          const g = run([TARGET_ID]);
          if (g.code !== 0) bad.push(`${TARGET_ID}'s gate still fails after its dependency ticked (${form} form):`, ...verdict(g.out));
        }
        return bad;
      },
    },
    {
      name: 'a target box deleted or reworded holds the tick, names the line, and writes nothing',
      run: () => {
        const bad = [];
        for (const target of ['reworded', 'deleted']) {
          reset({
            status: `${CLAIM} — 2026-01-01`, fragment: FIXTURE_BOX, open: false, owes: TARGET_ID,
            rehome: `a line this fixture will not close → ${TARGET_ID} "${TARGET_BOX}"`, target,
          });
          const before = snapshot();
          const r = run(['--tick', FIXTURE_ID]);
          if (r.code === 0) bad.push(`--tick exited 0 with the target box ${target}`);
          if (!/HELD/.test(r.out)) bad.push(`the ${target} run never said HELD`);
          if (!/a line this fixture will not close/.test(r.out)) bad.push(`the ${target} run did not name the line whose pointer failed`);
          if (!/matched 0/.test(r.out)) bad.push(`the ${target} run did not say the pointer matched 0 boxes`);
          const changed = changedSince(before);
          if (changed.length) bad.push(`the ${target} run wrote ${changed.join(', ')}`);
        }
        return bad;
      },
    },
    {
      name: 'an unresolvable **Owes** fails --audit and holds the tick — missing work order, and a box already ticked',
      run: () => {
        const bad = [];
        // Two ways a pointer stops meaning anything. The second is the quiet one and the reason
        // --audit gained this check: the target ticked the box, the debt was paid, and the pair of
        // documents now say something that was true last month.
        const cases = [
          ['a work order that does not exist', { owes: 'WO-9.1', rehome: `a line this fixture will not close → WO-9.1 "${TARGET_BOX}"`, target: 'open' }, /does not exist/],
          ['a target box already ticked', { owes: TARGET_ID, rehome: `a line this fixture will not close → ${TARGET_ID} "${TARGET_BOX}"`, target: 'ticked' }, /already \[x\]/],
        ];
        for (const [what, opts, says] of cases) {
          reset({ status: `${CLAIM} — 2026-01-01`, fragment: FIXTURE_BOX, open: false, ...opts });
          const before = snapshot();
          const a = run(['--audit']);
          if (a.code === 0) bad.push(`--audit exited 0 with ${what}`);
          if (!says.test(a.out)) bad.push(`--audit did not say why the pointer failed (${what})`);
          if (changedSince(before).length) bad.push(`--audit wrote ${changedSince(before).join(', ')} — it may write nothing, ever`);
          const t = run(['--tick', FIXTURE_ID]);
          if (t.code === 0) bad.push(`--tick exited 0 with ${what}`);
          if (changedSince(before).length) bad.push(`the refused --tick wrote ${changedSince(before).join(', ')}`);
        }

        // And the field on its own: **Owes** naming a work order no line points at is a debt nobody
        // can find, which is the state the header lands in when a line is edited and the field is not.
        reset({ status: `${CLAIM} — 2026-01-01`, fragment: FIXTURE_BOX, open: false, owes: TARGET_ID, target: 'open' });
        const orphan = run(['--audit']);
        if (orphan.code === 0) bad.push('--audit exited 0 on a **Owes** field with no line pointing at it');
        return bad;
      },
    },
    {
      // Acceptance line 5, and the shape WO-3.1 was actually in: verified work sitting at 🔨 because
      // two of its lines named a screen nothing had built. `next` stepped over it — right for a live
      // dispatch, wrong for this — and the work order that DEPENDS on it was offered with a gate that
      // could not pass. The fixture reproduces that state rather than the repository being reverted
      // into it, because WO-3.1 is ✅ DONE on disk and a fixture cannot be spent.
      name: '`next` stops hiding a dependent once the work order above it lands with its lines re-homed',
      run: () => {
        const bad = [];
        const opts = {
          fragment: FIXTURE_BOX, open: false, owes: TARGET_ID,
          rehome: `${TARGET_BOX} → ${TARGET_ID}`, target: 'open',
        };
        // WO-3.1's old state: the same work order, at 🔨, with the same line open.
        reset({ ...opts, status: RUN });
        const before = run(['next']);
        if (!new RegExp(`skipped ${FIXTURE_ID}`).test(before.out)) bad.push('`next` did not step over the 🔨 row');
        if (!new RegExp(`next: ${TARGET_ID}`).test(before.out)) bad.push(`\`next\` did not reach ${TARGET_ID} behind the 🔨 row`);
        if (before.code === 0) bad.push(`\`next\` offered ${TARGET_ID} with a passing gate while its dependency was 🔨 IN PROGRESS`);
        if (!new RegExp(`dependency ${FIXTURE_ID} is 🔨`).test(before.out)) bad.push('the failing gate did not name the dependency that failed it');

        // The same tree, ticked under the new rules.
        reset({ ...opts, status: `${CLAIM} — 2026-01-01` });
        const t = run(['--tick', FIXTURE_ID]);
        if (t.code !== 0) bad.push(`--tick exited ${t.code} on the re-homed fixture:`, ...verdict(t.out));
        const after = run(['next']);
        if (after.code !== 0) bad.push(`\`next\` still exits ${after.code} after the dependency landed:`, ...verdict(after.out));
        if (!new RegExp(`next: ${TARGET_ID}`).test(after.out)) bad.push(`\`next\` did not offer ${TARGET_ID} once ${FIXTURE_ID} was ✅ DONE`);
        if (!new RegExp(`PASS \\| gates clear for ${TARGET_ID}`).test(after.out)) bad.push(`${TARGET_ID}'s gate did not pass with its dependency ✅ DONE`);
        if (/skipped/.test(after.out)) bad.push('`next` still stepped over the landed work order');
        return bad;
      },
    },
    // ------------------------------------------------------------------ WO-1.21's four
    //
    // A status the script has never seen is a status nothing guards, and these are the first two that
    // mean the work is not coming — so they are also the first two that can take a work order out of a
    // count. Three of the four plant violations; the fourth plants the arithmetic that is supposed to
    // WORK, on the same reasoning that put a resolving pointer beside WO-3.11's three refusals: a
    // build that took every work order out of every count would pass all three violation plants.
    {
      name: '🚫 STRUCK and ⏳ DEFERRED are refused by --start, --tick and --release, and write nothing',
      run: () => {
        const bad = [];
        for (const status of [STRUCK_AT, DEFERRED_AT]) {
          for (const flag of ['--start', '--tick', '--release']) {
            reset({ status, fragment: FIXTURE_BOX, open: false });
            const before = snapshot();
            const r = run([flag, FIXTURE_ID]);
            if (r.code === 0) bad.push(`${flag} on a "${status}" work order exited 0`);
            const changed = changedSince(before);
            if (changed.length) bad.push(`${flag} on "${status}" wrote ${changed.join(', ')}`);
          }
          // And the gate, which is what somebody reads before picking a work order up. A wait that
          // can never end has to read differently from a wait.
          reset({ status, fragment: FIXTURE_BOX, open: false });
          const g = run([FIXTURE_ID]);
          if (g.code === 0) bad.push(`the gate report on a "${status}" work order exited 0`);
          const dep = run([TARGET_ID]);                          // WO-9.8 depends on WO-9.9
          if (dep.code === 0) bad.push(`${TARGET_ID}'s gate passed with its dependency "${status}"`);
          if (!/will never be ✅ DONE/.test(dep.out)) bad.push(`${TARGET_ID}'s gate reported a "${status}" dependency as an ordinary wait`);
        }
        return bad;
      },
    },
    {
      name: 'a work order that is not coming leaves the dashboard denominator and is named in the row it left',
      run: () => {
        const bad = [];
        // The dashboard in work-orders/README.md is only ever rewritten by a successful --tick, and
        // --tick refuses the struck work order itself — so the tick that recomputes it is the target
        // fixture's, next door in the same phase file. That is the real shape too: a strike is a hand
        // edit, and the number moves the next time anything in that phase lands.
        const row = status => {
          reset({ status, fragment: FIXTURE_BOX, open: false, target: 'ticked' });
          const r = run(['--tick', TARGET_ID]);
          if (r.code !== 0) bad.push(`--tick ${TARGET_ID} exited ${r.code} with ${FIXTURE_ID} at "${status}":`, ...verdict(r.out));
          return readmeRow();
        };
        const open = row(OK);
        if (open.length < 6) { bad.push(`no Phase 3 dashboard row with a "Not coming" column to read: ${open.join('|')}`); return bad; }

        for (const [status, glyph] of [[STRUCK_AT, '🚫'], [DEFERRED_AT, '⏳']]) {
          const out = row(status);
          if (Number(out[2]) !== Number(open[2]) - 1) bad.push(`"${status}" left the work-order count at ${out[2].trim()}, expected ${Number(open[2]) - 1} — one fewer than the ${open[2].trim()} counted while it was ⬜`);
          if (!out[4].includes(FIXTURE_ID)) bad.push(`the count dropped and the "Not coming" cell does not name ${FIXTURE_ID}: "${out[4].trim()}" — a number that goes up because something was hidden`);
          if (!out[4].includes(glyph)) bad.push(`the "Not coming" cell does not say which of the two "${status}" is: "${out[4].trim()}"`);
        }
        return bad;
      },
    },
    {
      name: '--audit holds the two halves together — an uncounted box, the status behind it, and which of the two it is',
      run: () => {
        const bad = [];
        const audit = what => {
          const before = snapshot();
          const r = run(['--audit']);
          if (changedSince(before).length) bad.push(`--audit wrote ${changedSince(before).join(', ')} on ${what} — it may write nothing, ever`);
          return r;
        };

        // 1. The defect this was written for: not coming, and its box still counted. The phase can
        //    never reach 100% and nothing says why.
        reset({ status: STRUCK_AT, fragment: FIXTURE_BOX, open: false });
        let r = audit('a struck work order whose box is still counted');
        if (r.code === 0) bad.push('--audit exited 0 with a struck work order whose roadmap box is still in the count');
        if (!/still counted/.test(r.out)) bad.push('--audit did not say the box was still being counted');

        // 2. The positive path, which is not optional: marked, uncounted, and agreeing.
        reset({ status: STRUCK_AT, fragment: FIXTURE_BOX, open: false });
        markFixtureBox('🚫');
        r = audit('a struck work order whose box is marked');
        if (r.code !== 0) bad.push('--audit exited non-zero on a struck work order whose box is marked and uncounted:', ...verdict(r.out));
        if (!/not coming, uncounted/.test(r.out)) bad.push('--audit did not report the uncounted box beside that phase\'s box count');

        // 3. A marked box with nothing behind it — the roadmap quietly shrinking.
        reset({ status: OK, fragment: FIXTURE_BOX, open: false });
        markFixtureBox('🚫');
        r = audit('a marked box with an ⬜ work order behind it');
        if (r.code === 0) bad.push('--audit exited 0 on a box marked 🚫 with no struck work order closing it');
        if (!/no 🚫 STRUCK work order closes it/.test(r.out)) bad.push('--audit did not say the marked box has nothing behind it');

        // 4. The distinction itself, which is the trap this work order was written around: a *when*
        //    wearing a *whether*'s glyph. Nothing else in this file can tell those two apart.
        reset({ status: DEFERRED_AT, fragment: FIXTURE_BOX, open: false });
        markFixtureBox('🚫');
        r = audit('a deferred work order whose box is marked struck');
        if (r.code === 0) bad.push('--audit exited 0 with a ⏳ DEFERRED work order whose box is marked 🚫');
        if (!/different facts/.test(r.out)) bad.push('--audit did not say that struck and deferred are different facts');
        return bad;
      },
    },
    {
      name: '§ The files is checked against the files it names — a stale range, and a file with no row',
      run: () => {
        const bad = [];
        const p = path.join('work-orders', 'README.md');
        const lit = FIXTURE_FILE.replace(/\./g, '\\.');
        const rowRe = new RegExp('^\\|\\s*\\[`?' + lit + '`?\\]');

        reset({ status: OK, fragment: FIXTURE_BOX, open: false });
        const clean = run(['--audit']);
        if (clean.code !== 0) bad.push('--audit exited non-zero on a § The files table that matches its files:', ...verdict(clean.out));

        // The rot itself: a row that was true until a phase gained a work order. This is the state
        // the Phase 1 row was actually in on 2026-08-15, reproduced on a fixture that cannot be spent.
        //
        // The stale claim is written **by cell**, not by a search-and-replace over the ids already in
        // the row. The first cut of this plant replaced `WO-3.x … WO-3.y` — which is what the row says
        // in the repository and not what it says here, because step 2c above has already rewritten it
        // to end at the fixture, `WO-3.1 … WO-9.8`. The pattern matched nothing, the "stale" row was
        // still the true one, --audit passed on it, and the plant reported the checker as missing when
        // the checker was fine. **A plant that quietly plants nothing accuses the wrong file**, so the
        // write is unconditional and the line is asserted to have moved before the run that reads it.
        const lines = readSb(p).split('\n');
        const i = lines.findIndex(l => rowRe.test(l));
        if (i < 0) { bad.push(`--self-check found no ${FIXTURE_FILE} row in § The files`); return bad; }
        const stale = lines.slice();
        const cells = stale[i].split('|');
        cells[2] = ` WO-${FIXTURE_PHASE}.1 … WO-${FIXTURE_PHASE}.9 `;
        stale[i] = cells.join('|');
        if (stale[i] === lines[i]) { bad.push(`the stale-row plant changed nothing — the row already reads "${lines[i].trim()}", so --audit was asked about a row that is correct`); return bad; }
        plantWrite(p, stale.join('\n'));
        let r = run(['--audit']);
        if (r.code === 0) bad.push('--audit exited 0 on a § The files row naming work orders its file does not hold');
        if (!new RegExp('§ The files says ' + lit + ' holds').test(r.out)) bad.push('--audit did not name the stale row or the file it is wrong about');

        // And the other direction: a file full of work orders that the index does not mention.
        const gone = lines.slice();
        gone.splice(i, 1);
        plantWrite(p, gone.join('\n'));
        r = run(['--audit']);
        if (r.code === 0) bad.push('--audit exited 0 with a phase file that § The files has no row for');
        if (!/no row for it/.test(r.out)) bad.push('--audit did not say the file has no row in § The files');
        return bad;
      },
    },
    {
      name: "a wrong count in ROADMAP.md's dashboard holds the tick, with both numbers shown",
      run: () => {
        reset({ status: `${CLAIM} — 2026-01-01`, fragment: FIXTURE_BOX, open: false });
        const lines = readSb('ROADMAP.md').split('\n');
        const { rows } = roadmapDashboardRows(lines);
        const row = rows.get(FIXTURE_PHASE);
        const wrong = `${row.done + 7}/${row.total}`;
        lines[row.line] = lines[row.line].replace(/(\d+)\s*\/\s*(\d+)/, wrong);
        plantWrite('ROADMAP.md', lines.join('\n'));
        const before = snapshot();
        const r = run(['--tick', FIXTURE_ID]);
        const bad = [];
        if (r.code === 0) bad.push('--tick exited 0 with the roadmap dashboard three ways wrong');
        if (!/HELD/.test(r.out)) bad.push('the run never said HELD');
        if (!r.out.includes(wrong)) bad.push(`the run did not print the number the row carries (${wrong})`);
        if (!r.out.includes(`${row.done}/${row.total}`)) bad.push(`the run did not print the number the boxes count (${row.done}/${row.total})`);
        const changed = changedSince(before);
        if (changed.length) bad.push(`it wrote ${changed.join(', ')}`);
        return bad;
      },
    },
    // ------------------------------------------------------------------ WO-2.49's one
    //
    // The first plant about the READER rather than about a refusal, and it had to be: on a CRLF work
    // order every checkbox goes missing, and `--tick WO-3.25 --dry-run` printed *"all 0 Acceptance
    // lines are ticked — nothing holds WO-3.25 open"* over ten open boxes, one of them a 👤 line. It
    // was one keystroke from ✅ DONE and the only thing that stopped it was a human reading a
    // diffstat. Nothing in the seventeen above could have seen it: the plants are written into the
    // copy by this script, in LF, so they can never carry the defect. **A plant that writes LF cannot
    // fail this** — which is why the bytes below are written `\r\n` explicitly and then read back and
    // counted rather than trusted to the platform.
    //
    // Both halves are here and neither is redundant. The empty-list half stays GREEN with the split
    // in parseFile() reverted — the CRLF file parses empty, so the refusal fires, for the wrong
    // reason — so the CRLF file WITH a list is the half that reddens when that fix goes. The refusal
    // half is what reddens if applyTick()'s fence goes instead. Neither asserts a count: an assertion
    // about a count is satisfied by any number, and a count is what reassured somebody here.
    {
      name: 'a CRLF work order is read line for line, and an **Acceptance** heading with no boxes under it refuses the tick',
      run: () => {
        const bad = [];
        const p = path.join('work-orders', FIXTURE_FILE);

        // Rewrite the fixture's phase file with `\r\n` on every line, then read the bytes back and
        // count them. Asserted rather than assumed, both ways round: a machine that already writes
        // CRLF would make the write meaningless, and one that translates on the way out would make
        // it a lie. `latin1` because these are bytes, not text.
        const toCrlf = what => {
          plantWrite(p, readSb(p).split(/\r?\n/).join('\r\n'));
          const raw = fs.readFileSync(rel(p), 'latin1');
          const nl = (raw.match(/\n/g) || []).length, crlf = (raw.match(/\r\n/g) || []).length;
          if (!crlf || nl !== crlf) bad.push(`the ${what} fixture is not CRLF in its own bytes — ${crlf} of ${nl} newlines carry a \\r, so this plant proves nothing`);
        };
        const stillCrlf = what => {
          const raw = fs.readFileSync(rel(p), 'latin1');
          const nl = (raw.match(/\n/g) || []).length, crlf = (raw.match(/\r\n/g) || []).length;
          if (nl !== crlf) bad.push(`the ${what} rewrote ${FIXTURE_FILE} with LF endings (${crlf} of ${nl} newlines carry a \\r) — this reads either terminator, it does not convert one into the other`);
        };

        // 1. A CRLF work order with an open line. The decision, not the count: HELD, at
        //    🔨 IN PROGRESS, naming the line that held it — exactly what the LF fixture gets from the
        //    first plant in this array. Read on a split of '\n' alone, this list is empty and the run
        //    refuses in the other direction instead, which is what makes this half fail loudly.
        reset({ status: `${CLAIM} — 2026-01-01`, fragment: FIXTURE_BOX, open: true });
        toCrlf('open-line');
        const held = run(['--tick', FIXTURE_ID]);
        if (held.code === 0) bad.push('--tick exited 0 over an open Acceptance line in a CRLF file');
        if (/no boxes under it/.test(held.out)) bad.push('--tick read a CRLF work order\'s Acceptance list as empty — the boxes are there and every one of them ends in \\r');
        if (!/HELD/.test(held.out)) bad.push('the run never said HELD on a CRLF file with an open line');
        if (!/the second line/.test(held.out)) bad.push('the run did not name the open line of a CRLF file');
        if (!fixtureStatus().startsWith(RUN)) bad.push(`a held tick on a CRLF file left the status at "${fixtureStatus()}", not 🔨 IN PROGRESS`);
        if (/^-\s*\[x\]/.test(fixtureBoxLine())) bad.push('it ticked the roadmap box of a CRLF work order with a line still open');
        stillCrlf('held tick');

        // 2. The heading with nothing under it. It writes nothing at all — the tracker being wrong
        //    about itself, and no status makes that true — and it names the file, because the reader
        //    of this output has to be able to go and look at the list that would not parse.
        reset({ status: `${CLAIM} — 2026-01-01`, fragment: FIXTURE_BOX, open: false, boxes: false });
        toCrlf('empty-list');
        const before = snapshot();
        const empty = run(['--tick', FIXTURE_ID]);
        if (empty.code === 0) bad.push('--tick exited 0 on an **Acceptance** heading with no boxes under it');
        if (!/HELD/.test(empty.out)) bad.push('the run never said HELD over an empty Acceptance list');
        if (/Acceptance lines are ticked/.test(empty.out)) bad.push('an Acceptance list that parses empty printed as a satisfied one — "all 0 lines are ticked" is the sentence this refusal exists to stop');
        if (!new RegExp(FIXTURE_FILE.replace(/\./g, '\\.')).test(empty.out)) bad.push(`the refusal did not name the file it could not read a list in (${FIXTURE_FILE})`);
        const changed = changedSince(before);
        if (changed.length) bad.push(`the refused --tick wrote ${changed.join(', ')} — it may write nothing at all`);
        return bad;
      },
    },
  ];

  // The subject and sandbox lines are printed before the copy is made, up at step 1, so that the
  // precondition's early exit has a header above it. This one waits until there is a fixture to name.
  console.log(`  fixture   ${FIXTURE_ID}, written into the copy of ${FIXTURE_FILE} — no real work order is a fixture here`);
  console.log(`  trackers  clean in the copy — no ROADMAP.md dashboard drift, no fragment closing zero boxes`);
  console.log('');

  let failed = 0;
  for (const plant of plants) {
    const bad = plant.run();
    if (bad.length) {
      failed++;
      console.log(`FAIL | ${plant.name}`);
      for (const b of bad) console.log(`     | ${b}`);
    } else {
      console.log(`ok   | ${plant.name}`);
    }
  }

  console.log('');
  console.log(`  ${plants.length} plants, ${plants.length - failed} caught, ${failed} missed.`);
  console.log('  Covers what WO-2.14, WO-2.15, WO-3.11, WO-1.21 and WO-2.49 built: the four refusals,');
  console.log('  the fences on each of --start, --release and --tick, the dry runs, one tick that works,');
  console.log('  both kinds of skip, the four about **Owes** and its pointers, WO-1.21\'s four — 🚫/⏳');
  console.log('  refused, out of the count and named where it left, held against the box they stopped');
  console.log('  counting, and § The files against the files — and ONE FAULT in the Acceptance parser:');
  console.log('  a fixture written CRLF in its own bytes, whose boxes a reader splitting on "\\n" alone');
  console.log('  cannot see, plus the heading with no boxes under it that must refuse rather than read');
  console.log('  as satisfied. NOT covered: the Acceptance parser otherwise. It is still never run');
  console.log('  against a real work order\'s list, and one terminator is one way it can go blind and');
  console.log('  not the class of them — a narrowed gap, not a closed one. Nor is gate()\'s');
  console.log('  hard-ordering walk, `next` over the real running order, the rest of');
  console.log('  recomputeDashboard()\'s arithmetic, or --audit against the real trackers.');
  console.log(`  A green run here is not coverage — it is ${plants.length} claims about ${plants.length} plants.`);
  console.log('');
  console.log(failed ? `FAIL | ${failed} of ${plants.length} plants were not caught.`
                     : `PASS | ${plants.length} of ${plants.length} plants were caught.`);
  return failed ? 1 : 0;
}

// ---------------------------------------------------------------------------- main

const argv = process.argv.slice(2);
const wos = allWorkOrders();

if (!argv.length || argv.includes('--help') || argv.includes('-h')) {
  console.log(`wo-gate.mjs — gates, next, claims and ticks for Planbook work orders

  node tools/wo-gate.mjs WO-1.7               gate report; exits non-zero if blocked
  node tools/wo-gate.mjs next [--quiet]       first NOT STARTED in the running order
  node tools/wo-gate.mjs --list               every work order and its status
  node tools/wo-gate.mjs --start WO-1.7 [--dispatch <label>] [--dry-run]
                                                        claim it — ⬜ NOT STARTED → 🤖 CLAIMED —
                                                        <label, or today's date>
  node tools/wo-gate.mjs --release WO-1.7 [--dry-run]   the way back, for a dispatch that died.
                                                        🤖 CLAIMED only; it refuses every other status
  node tools/wo-gate.mjs --tick WO-1.7 [--dry-run]
  node tools/wo-gate.mjs --audit                        every **Closes roadmap** fragment against
                                                        ROADMAP.md, every **Owes** pointer against
                                                        the box it names, every 🚫/⏳ work order
                                                        against the box it takes out of the count,
                                                        § The files against the files, and the
                                                        dashboard against its own boxes.
                                                        Reports; never writes
  node tools/wo-gate.mjs --self-check [--against <path>] plant every violation this script is
                                                        supposed to catch, in a temp copy of plans/,
                                                        and fail if one stops being caught. Requires
                                                        the trackers to be clean first, and says so
                                                        instead of planting if they are not

--start, --release and --tick write into plans/. Run each with --dry-run first and read the diff.
--start claims a work order so a second dispatch can see one is in flight; it moves no dashboard.
--tick reads the work order's own Acceptance list: any line still [ ] and it writes 🔨 IN PROGRESS
instead of ✅ DONE, names the lines, and leaves the roadmap alone. It also refuses, writing nothing,
when a **Closes roadmap** fragment closes no box or ROADMAP.md's dashboard does not match its own
boxes — both are the tracker being wrong about itself, and no status makes that true.

The four statuses this writes are four different facts (WO-3.11). 🤖 CLAIMED — <dispatch>: a run has
it in flight, and --release is the way back. 🔨 IN PROGRESS: part-built, nobody in flight, --release
refuses it. ✅ DONE plus a **Owes** field: landed, with Acceptance lines owed to the work orders that
will actually close them — those lines stay - [ ] and carry a "→ WO-x.y" marker, and --tick honours
one only while it can find the matching OPEN box under that target.
None of them touches a 👤 line in TESTING.md, and none touches CHANGELOG.md, and none of them
writes ROADMAP.md's progress dashboard — that stays a hand edit (ROADMAP.md, maintenance step 3).

Two statuses this NEVER writes (WO-1.21), because both are the owner's decision and a hand edit:
🚫 STRUCK — <date, reason> is a *whether*: do not build it, and the roadmap box it closes stops
being counted, marked "🚫" straight after its checkbox so it is still visible. ⏳ DEFERRED —
<date, reason> is a *when*: not now, the box stands and stays marked "⏳", and it comes back the
first time somebody wants the thing. Neither is counted in either dashboard, neither can be
--start-ed, --tick-ed or --release-d, and neither will ever satisfy a dependency — the gate says so
in those words rather than reporting a wait that can never end.`);
  process.exit(0);
}

if (argv[0] === '--audit') process.exit(audit(wos));

// --against exists for one acceptance line and is worth the extra argument: "each plant is proved to
// be able to fail" is settled by restoring the pre-WO-2.14 script from git into a temp path and
// watching the plants go red against it — and that script has no --self-check of its own to run. So
// the harness and the subject are separable, and the subject defaults to this file.
if (argv[0] === '--self-check') {
  const i = argv.indexOf('--against');
  process.exit(selfCheck(i >= 0 && argv[i + 1] ? argv[i + 1] : fileURLToPath(import.meta.url)));
}

if (argv[0] === '--list') {
  for (const wo of wos.values()) {
    console.log(`${wo.id.padEnd(8)} ${wo.status.padEnd(22)} ${wo.flag ? '🚩' : '  '} ${wo.title}`);
  }
  process.exit(0);
}

if (argv[0] === 'next') process.exit(next(wos, argv.includes('--quiet')));

// Three separate blocks for three separate writes. Each names its own flag in its own error, so a
// mistyped ID is reported by the thing the caller actually ran.
if (argv[0] === '--start') {
  const id = argv[1];
  if (!id || !/^WO-/.test(id)) { console.error('FAIL | --start needs an explicit work order ID, e.g. --start WO-1.7'); process.exit(1); }
  const d = argv.indexOf('--dispatch');
  process.exit(applyStart(id, wos, argv.includes('--dry-run'), d >= 0 ? argv[d + 1] : ''));
}

if (argv[0] === '--release') {
  const id = argv[1];
  if (!id || !/^WO-/.test(id)) { console.error('FAIL | --release needs an explicit work order ID, e.g. --release WO-1.7'); process.exit(1); }
  process.exit(applyRelease(id, wos, argv.includes('--dry-run')));
}

if (argv[0] === '--tick') {
  const id = argv[1];
  if (!id || !/^WO-/.test(id)) { console.error('FAIL | --tick needs an explicit work order ID, e.g. --tick WO-1.7'); process.exit(1); }
  process.exit(applyTick(id, wos, argv.includes('--dry-run')));
}

if (/^WO-/.test(argv[0])) process.exit(gate(argv[0], wos));

console.error(`FAIL | unrecognized argument "${argv[0]}" — try --help`);
process.exit(1);
