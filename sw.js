/*
  Planbook service worker — the app shell, cached, so an installed Planbook opens with the
  network off.

  Two rules govern everything below, and the second one is the one that gets broken by
  accident from three work orders away:

    1. The cache owns the shell; IndexedDB owns the data. Never cache the year document, and
       never cache a response from anywhere but this origin. A stale copy of a teacher's
       grades is worse than no copy (docs/data-model.md), and a catch-all fetch handler is how
       a Drive response full of student data ends up sitting in the Cache Storage of a shared
       laptop. The origin test in `fetch` below is that rule, written as code.

    2. SHELL is a hand-maintained list and CACHE is a hand-bumped string. Add a file to src/
       and it will work fine in every test you run — a live network serves it — and then be
       missing the first time a teacher opens the app on a plane. Add the file to SHELL and
       bump CACHE in the same commit that creates it.

       That goes for STYLESHEETS too, not just modules, and the stylesheet is the one that gets
       missed: tools/verify-shell.mjs walks the module graph transitively and would catch a
       forgotten .js, and it does not read the <link> tags at all. A per-screen sheet left out of
       this list is an app that opens offline, works, and is unstyled from the panel down.

       WRITE NO APOSTROPHE INSIDE THE ARRAY BELOW, comments included. That check reads SHELL by
       matching single-quoted strings out of the array text, so one apostrophe in a comment pairs
       with the next one and swallows every real entry between them — and what it reports is every
       module in the app suddenly missing from the precache. Found the honest way, at WO-1.10, by
       writing this very note in the wrong place.

  A service worker will not register from `file://`. Run a static server locally; that is the
  only reason the "no build step" repo needs a server at all.
*/

/* Bump on every deploy that changes any file in SHELL. The name is the version: `activate`
   deletes every cache that is not this one, which is what makes a deploy replace the shell
   rather than layer on top of it. */
const CACHE = 'planbook-shell-v14';

/* Relative to this file, which is why sw.js lives at the repo root: a service worker can only
   control pages at or below its own directory (src/README.md). Kept relative rather than
   absolute so the app still works served from a subdirectory. */
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/shell.css',
  './src/home.css',
  './src/shell.js',
  './src/home.js',
  './src/modal.js',
  './src/live-region.js',
  './src/save-indicator.js',
  './src/prefs.js',
  './src/install-banner.js',
  './src/store.js',
  './src/year-picker.js',
  './src/backup.js',
  './src/zip.js',
  './src/classes.js',
  './src/roster.js',
  './src/supports.js',
  './src/presentation.js',
  './src/teacher.js',
  './icons/icon-152.png',
  './icons/icon-167.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

const INDEX = new URL('./index.html', self.location).href;
const SHELL_PATHS = new Set(SHELL.map((p) => new URL(p, self.location).pathname));

self.addEventListener('install', (event) => {
  /* `reload` defeats the HTTP cache during precache. Without it a deploy can precache the
     browser-cached copy of the file it is supposed to be replacing — the cache name changes,
     the bytes do not, and the update silently does nothing. */
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/*
  skipWaiting + claim means a new worker takes over immediately rather than waiting for every
  window to close. That is the right trade *while this condition holds*: every shell module is
  a static import resolved at boot, so a running page never fetches a file later and can never
  be handed a v2 module by a v1 page. The first dynamic import(), lazily-fetched template, or
  on-demand stylesheet breaks that, and then an immediate takeover can mix two versions inside
  one running app. If you add one, drop skipWaiting and tell the teacher an update is ready
  instead — do not leave both.
*/

self.addEventListener('fetch', (event) => {
  const req = event.request;

  /* Anything that is not a plain same-origin GET goes to the network untouched and unstored.
     Phase 7's Drive traffic is the case this exists for. */
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  /* A navigation offline has to land on the cached shell, whatever path it asked for —
     otherwise a home-screen launch shows the browser's offline page and looks like data loss
     to someone whose grades are in there. */
  if (req.mode === 'navigate') {
    event.respondWith(caches.match(INDEX).then((hit) => hit || fetch(req)));
    return;
  }

  /* Cache-first, and only for the shell. Nothing else is intercepted at all: a URL that is
     not on the list is not the shell, and a response the app did not precache is not ours to
     keep. There is no network-first path because there is nothing on a network to be first
     about — Planbook has no backend. */
  if (!SHELL_PATHS.has(url.pathname)) return;
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
