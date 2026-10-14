// Forge service worker — cache-first, precaches the whole app shell. Bump VERSION on release.
const PREFIX = `forge-${self.registration.scope}-`;
const VERSION = `${PREFIX}v1.0.2`;
const RUNTIME = `${PREFIX}cdn-v1`;
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './js/anim.js',
  './js/app.js',
  './js/charts.js',
  './js/demo.js',
  './js/exercises.js',
  './js/formcheck.js',
  './js/generator.js',
  './js/logic.js',
  './js/programs.js',
  './js/store.js',
  './js/timer.js',
  './js/tips.js',
  './js/ui.js',
  './js/util.js',
  './js/view-body.js',
  './js/view-history.js',
  './js/view-library.js',
  './js/view-onboarding.js',
  './js/view-plan.js',
  './js/view-session.js',
  './js/view-settings.js',
  './js/view-today.js',
];
// Pose model + wasm (lazy, only after the user opens Form Check) get cached at runtime.
const CDN_HOSTS = ['cdn.jsdelivr.net', 'storage.googleapis.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== VERSION && k !== RUNTIME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.open(VERSION).then(cache => cache.match(req, { ignoreSearch: true })).then(hit => {
        if (hit) return hit;
        return fetch(req).then(res => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            e.waitUntil(caches.open(VERSION).then(c => c.put(req, copy)));
          }
          return res;
        }).catch(() => (req.mode === 'navigate' ? caches.open(VERSION).then(c => c.match('./index.html')) : Response.error()));
      })
    );
    return;
  }

  if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(RUNTIME).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') e.waitUntil(c.put(req, res.clone()));
        return res;
      })))
    );
  }
});
