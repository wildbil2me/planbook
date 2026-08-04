/*
  Planbook service worker — placeholder, deliberately inert. No listeners, no caches.

  WO-1.3 (PWA install path & eviction warning) implements it for real: precache the app shell,
  cache-first for shell assets, a versioned cache name, and old caches deleted on `activate`.

  Nothing registers this file yet, on purpose. WO-1.3 adds the registration in the same work
  order as the caching logic, so a worker can never take control of the page before there is a
  shell worth serving from cache.

  Two things to hold on to when it gets written:

    - A service worker will not register from `file://`. Run a static server locally; that is
      the only reason the "no build step" repo needs a server at all.

    - The cache owns the shell; IndexedDB owns the data. Never cache the year document here.
      A stale copy of a teacher's grades is worse than no copy — see docs/data-model.md.
*/
