# `src/` — the app's own code

Empty today. WO-1.2 puts the first file here. This note exists because a directory with nothing
in it does not survive a git commit, and because the convention it sets is one every later work
order copies.

## What belongs here

The running app, and only the running app: the modules `index.html` loads. Nothing that a
browser doesn't fetch.

| Not here | Where instead |
|---|---|
| Planning docs, work orders, decision records | `plans/` |
| Reference docs — data model, sync, FERPA | `docs/` |
| The suite visual language | `design/` |
| Anything you run from a terminal | `tools/` (`.mjs`, bare Node) |
| `index.html`, `sw.js`, `manifest.webmanifest` | The repo root — a service worker's scope is its own directory, so `sw.js` cannot move into `src/` without losing control of the pages above it |

## The convention

- **Plain ES modules, `.js`, loaded with `<script type="module" src="src/…">` and relative
  paths.** No bundler, no import map, no transpile step. Planbook is served over HTTPS, where
  modules work natively — that is the reason this repo can be flatter than Roll Call!'s.
- **`kebab-case.js`**, one concern per file, named for the thing it owns (`store.js`,
  `roster.js`, `attendance.js`), not for its layer (`utils.js`, `helpers.js`).
- **Colors inline, from `design/style-guide.md`.** Not CSS variables. This reads like an
  oversight in every file it appears in and is a deliberate suite convention; don't tidy it.
- **No dark mode anywhere** — no `prefers-color-scheme`, no `[data-theme]`.
- **Every new control appears in the `@media (pointer: coarse)` block** with a 44px minimum, in
  the same commit that adds the control. Not in a later touch-up pass; there isn't one.
- **`localStorage` is `planbook_`-prefixed and holds UI preferences only.** Student data lives
  in IndexedDB, one JSON document per year — `docs/data-model.md`.

**Why not one big file like Roll Call!'s `src/dashboard.html`.** That app is a single file
because it opens from `file://`, where module imports are blocked and a service worker cannot
register. Planbook has neither constraint. If splitting ever costs more than it pays, say so in
a decision record rather than quietly reverting — the shape of `src/` is the kind of thing that
gets re-litigated every few months otherwise.
