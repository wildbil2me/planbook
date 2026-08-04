# `tools/` — scripts, run by hand

Empty today. The first inhabitant is the demo build in Phase 8 (WO-8.2), modelled on Roll Call!'s
`tools/build-demo.mjs`. This note exists because an empty directory does not survive a git
commit, and because the rule below is one the repo will be tempted to break.

## The rule

**Anything scripted is a `.mjs` file here, run under bare Node, with zero dependencies.**

```
node tools/build-demo.mjs
```

That is the whole invocation. There is no `npm run`, because there is no `package.json` — and
there is not going to be one, not even "just for scripts." A `package.json` is how a bundler
arrives six weeks later; it has been proposed and rejected before (see `CLAUDE.md`, and
`plans/b-hygiene.md` in Roll Call!).

- **`.mjs`, not `.js`.** Without a `package.json` declaring `"type": "module"`, Node reads `.js`
  as CommonJS. The extension is what makes `import` work here — it isn't a style preference.
- **Node's standard library only.** `node:fs`, `node:path`, `node:url`. If a script needs a
  dependency, the script is doing too much.
- **No script may be required to run the app.** Everything in `tools/` builds something
  optional — a demo, a report, a fixture. `index.html` and `src/` are served as they sit on
  disk, and a teacher's laptop never runs Node.
- **Exit non-zero on failure and say what failed.** These get run once every few months by
  someone who has forgotten how they work.
