// ─────────────────────────────────────────────────────────────────────────────
// Service Worker — VIDA BNPL Calculator
//
// WHAT IT DOES
//   Pages ("/" and single-segment paths like "/gloworld")
//     → network-first. A clean 200 is saved under its path (no query string)
//       TOGETHER with every file it needs. Offline, the saved copy for that
//       exact path is served, or /offline.html if there is none. A saved page
//       is never served at any other path.
//   Static files (/_next/static/*, /_next/image, fonts, icons, logo…)
//     → cache-first.
//   Not touched: non-GET, cross-origin (PostHog etc.), /api/*, and every other
//     same-origin request (e.g. Next.js RSC data) — those go straight to network.
//
// CLEANUP RULE
//   We remember up to MAX_SAVED_PAGES pages. For each saved page we keep a list
//   of the files it uses. When one more page is saved than the limit allows,
//   the page visited online longest ago is removed, and then any file that no
//   remaining saved page uses (and that is not in the precache list) is removed.
//   A file that a saved page still uses is never deleted. A new copy of a page
//   only replaces the old one after all of its files are safely stored.
//   When CACHE_VERSION changes, old caches are deleted as a whole (pages and
//   their files together), so a page is never left without its files.
//
// skipWaiting: yes (install).   clients.claim: yes (activate).
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = 'v4';
const STATIC_CACHE = `bnpl-static-${CACHE_VERSION}`;
const PAGES_CACHE = `bnpl-pages-${CACHE_VERSION}`;
const META_CACHE = `bnpl-meta-${CACHE_VERSION}`;
const KNOWN_CACHES = [STATIC_CACHE, PAGES_CACHE, META_CACHE];

const MAX_SAVED_PAGES = 10;
const META_KEY = '/__sw-meta__/pages.json';
const LAZY_KEEP_MS = 10 * 60 * 1000; // 10 minutes

const PRECACHE_URLS = [
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html',
];

const ORIGIN = self.location.origin;
const abs = (path) => new URL(path, ORIGIN).href;
const PRECACHE_ABS = new Set(PRECACHE_URLS.map(abs));

// ─── Install / activate ──────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((n) => !KNOWN_CACHES.includes(n)).map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** "/" or one segment without a dot, e.g. "/gloworld". */
function isPagePath(pathname) {
  return pathname === '/' || /^\/[^/.]+$/.test(pathname);
}

function isStaticAsset(url) {
  if (url.origin !== ORIGIN) return false;
  const p = url.pathname;
  return (
    p.startsWith('/_next/static/') ||
    p.startsWith('/_next/image') ||
    p.startsWith('/fonts/') ||
    p.startsWith('/icons/') ||
    PRECACHE_ABS.has(abs(p)) ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|eot|css|js)$/i.test(p)
  );
}

function shouldIgnore(request, url) {
  return (
    request.method !== 'GET' ||
    url.origin !== ORIGIN ||
    url.pathname.startsWith('/api/') ||
    url.pathname === '/sw.js'
  );
}

/** Cache key for a page: path only, no query string. */
const pageKey = (pathname) => abs(pathname);

// One-at-a-time lock so saves and cleanups never overlap.
let queue = Promise.resolve();
function locked(fn) {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

async function readMeta() {
  const cache = await caches.open(META_CACHE);
  const res = await cache.match(META_KEY);
  if (!res) return { pages: {} };
  try {
    return await res.json();
  } catch {
    return { pages: {} };
  }
}

async function writeMeta(meta) {
  const cache = await caches.open(META_CACHE);
  await cache.put(
    META_KEY,
    new Response(JSON.stringify(meta), { headers: { 'Content-Type': 'application/json' } })
  );
}

/** Same-origin static file URLs referenced by an HTML or CSS text. */
function extractAssetUrls(text, baseUrl) {
  const found = new Set();
  const decoded = text.replace(/&amp;/g, '&').replace(/\\u0026/g, '&').replace(/\\\//g, '/');
  const patterns = [
    /\/_next\/static\/[A-Za-z0-9_\-./~%@[\]]+\.(?:js|css|woff2?|ttf|otf|png|svg|jpg|jpeg|webp|ico)/g,
    /\/_next\/image\?[^"'\s\\<>)]+/g,
    /(?:src|href)=["'](\/[^"'?#]+\.(?:png|svg|ico|jpg|jpeg|webp|woff2?|css|js)(?:\?[^"']*)?)["']/g,
    /url\(\s*["']?([^"')]+\.(?:woff2?|ttf|otf|png|svg|jpg|jpeg|webp)(?:\?[^"')]*)?)["']?\s*\)/g,
  ];
  for (const re of patterns) {
    for (const m of decoded.matchAll(re)) {
      const raw = m[1] || m[0];
      try {
        const u = new URL(raw.split(' ')[0], baseUrl);
        if (isStaticAsset(u)) found.add(u.href);
      } catch {
        /* ignore */
      }
    }
  }
  return found;
}

/**
 * Make sure every URL is in STATIC_CACHE. Returns false if a file could not be
 * downloaded because of a network error (the page copy must then not be saved).
 * Files that answer 404 are skipped — the page could not use them anyway.
 */
async function ensureCached(urls) {
  const cache = await caches.open(STATIC_CACHE);
  const stored = new Set();
  let ok = true;
  await Promise.all(
    [...urls].map(async (href) => {
      try {
        if (await cache.match(href, { ignoreVary: true })) {
          stored.add(href);
          return;
        }
        const res = await fetch(href, { credentials: 'same-origin' });
        if (res.ok) {
          await cache.put(href, res);
          stored.add(href);
        }
      } catch {
        ok = false;
      }
    })
  );
  return { ok, stored };
}

/** Add CSS-referenced files (fonts, images) so they work offline even if not yet used. */
async function withCssDependencies(urls) {
  const all = new Set(urls);
  const cache = await caches.open(STATIC_CACHE);
  for (const href of urls) {
    if (!/\.css(\?|$)/i.test(href)) continue;
    const res = await cache.match(href, { ignoreVary: true });
    if (!res) continue;
    const css = await res.clone().text();
    for (const dep of extractAssetUrls(css, href)) all.add(dep);
  }
  return all;
}

/**
 * Save a page: html text + all its files. The old copy is only replaced once
 * every file is stored. Then enforce the limit and clean up unused files.
 */
function savePage(pathname, html, extraUrls = []) {
  return locked(async () => {
    const pageUrl = pageKey(pathname);
    let urls = extractAssetUrls(html, pageUrl);
    for (const u of extraUrls) {
      try {
        const parsed = new URL(u, ORIGIN);
        if (isStaticAsset(parsed)) urls.add(parsed.href);
      } catch {
        /* ignore */
      }
    }
    let result = await ensureCached(urls);
    if (!result.ok) return; // keep the previous complete copy
    urls = await withCssDependencies(result.stored);
    result = await ensureCached(urls);
    if (!result.ok) return;

    const meta = await readMeta();
    const previous = meta.pages[pathname];
    // Files this page loaded on its own after the HTML (a font after "Calculate",
    // a lazy chunk). Keep the ones seen recently; older ones belong to an older
    // build and are dropped so the list cannot grow forever.
    const lazy = {};
    if (previous && previous.lazy) {
      for (const [href, ts] of Object.entries(previous.lazy)) {
        if (ts > Date.now() - LAZY_KEEP_MS) lazy[href] = ts;
      }
    }

    const pagesCache = await caches.open(PAGES_CACHE);
    await pagesCache.put(
      pageUrl,
      new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    );
    meta.pages[pathname] = { savedAt: Date.now(), assets: [...result.stored], lazy };
    await enforceLimitAndCleanup(meta);
    await writeMeta(meta);
  });
}

async function enforceLimitAndCleanup(meta) {
  const pagesCache = await caches.open(PAGES_CACHE);
  const paths = Object.keys(meta.pages).sort(
    (a, b) => meta.pages[a].savedAt - meta.pages[b].savedAt
  );
  while (paths.length > MAX_SAVED_PAGES) {
    const oldest = paths.shift();
    delete meta.pages[oldest];
    await pagesCache.delete(pageKey(oldest));
  }

  const needed = new Set(PRECACHE_ABS);
  for (const p of Object.values(meta.pages)) {
    for (const a of p.assets) needed.add(a);
    for (const a of Object.keys(p.lazy || {})) needed.add(a);
  }

  const staticCache = await caches.open(STATIC_CACHE);
  for (const req of await staticCache.keys()) {
    if (!needed.has(req.url)) await staticCache.delete(req);
  }

  // An older service worker can still write to its own cache for a moment after
  // this one took over. Remove any such leftover caches here as well.
  for (const name of await caches.keys()) {
    if (!KNOWN_CACHES.includes(name)) await caches.delete(name);
  }
}

/** A saved page loaded another file (lazy chunk, font): add it to its list. */
function trackAsset(clientId, href) {
  if (!clientId) return Promise.resolve();
  return locked(async () => {
    const client = await self.clients.get(clientId);
    if (!client) return;
    const path = new URL(client.url).pathname;
    const meta = await readMeta();
    const page = meta.pages[path];
    if (!page) return;
    page.lazy = page.lazy || {};
    if (page.assets.includes(href)) return;
    const cache = await caches.open(STATIC_CACHE);
    if (!(await cache.match(href, { ignoreVary: true }))) return;
    page.lazy[href] = Date.now();
    await writeMeta(meta);
  });
}

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (shouldIgnore(request, url)) return;

  // Page navigations: network-first.
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event, url));
    return;
  }

  // Static files: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        // ignoreVary: /_next/image answers vary by Accept header; any saved variant works.
        const hit = await cache.match(request, { ignoreVary: true });
        if (hit) {
          event.waitUntil(trackAsset(event.clientId, url.href));
          return hit;
        }
        try {
          const res = await fetch(request);
          if (res.ok && res.type === 'basic') {
            await cache.put(request, res.clone());
            event.waitUntil(trackAsset(event.clientId, url.href));
          }
          return res;
        } catch {
          return Response.error();
        }
      })()
    );
  }
  // Everything else: not intercepted.
});

async function handleNavigation(event, url) {
  try {
    const res = await fetch(event.request);
    if (
      isPagePath(url.pathname) &&
      res.status === 200 &&
      res.type === 'basic' &&
      !res.redirected &&
      (res.headers.get('Content-Type') || '').includes('text/html')
    ) {
      const copy = res.clone();
      event.waitUntil(copy.text().then((html) => savePage(url.pathname, html)));
    }
    return res;
  } catch {
    const pagesCache = await caches.open(PAGES_CACHE);
    if (isPagePath(url.pathname)) {
      const saved = await pagesCache.match(pageKey(url.pathname));
      if (saved) return saved;
    }
    const staticCache = await caches.open(STATIC_CACHE);
    const offline = await staticCache.match(abs('/offline.html'));
    return (
      offline ||
      new Response("<h1>You're offline</h1>", {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    );
  }
}

// ─── First visit: the page asks us to save it ────────────────────────────────
// Sent by components/ServiceWorkerRegister.tsx when this service worker did not
// handle the page load itself — a first visit, or a page loaded by an older
// version just before this one took over: { type: 'SAVE_PAGE', pathname, resources }.
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'SAVE_PAGE' || typeof data.pathname !== 'string') return;
  if (!isPagePath(data.pathname)) return;
  const resources = Array.isArray(data.resources) ? data.resources : [];

  event.waitUntil(
    (async () => {
      try {
        const res = await fetch(pageKey(data.pathname), {
          cache: 'no-cache',
          credentials: 'same-origin',
          redirect: 'manual',
        });
        const type = res.headers.get('Content-Type') || '';
        if (res.status !== 200 || res.type !== 'basic' || !type.includes('text/html')) return;
        const html = await res.text();
        await savePage(data.pathname, html, resources);
      } catch {
        /* offline right now — the next online visit will save it */
      }
    })()
  );
});
