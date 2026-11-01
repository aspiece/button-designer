/* GitHub Pages offline shell. Never caches student uploads or private projects. */
const VERSION = 'button-studio-pwa-20261101-v7';
const SHELL = VERSION + '-shell';
const RUNTIME = VERSION + '-runtime';
const SCOPE = self.registration.scope;
const ROOT = new URL(SCOPE);
const FILES = [
  './', './studio/', './phase1.js?v=20261101', './phase2.js?v=20261101c', './phase3.js?v=20261101',
  './phase1.css?v=20261101-all-screens', './phase2.css?v=20261101c', './phase3.css?v=20261101',
  './library.js?v=20261101', './library.css?v=20261101', './studio/general.css?v=20261101',
  './pwa.js?v=20261101', './pwa.css?v=20261101', './manifest.json', './manifest-general.json',
  './icons/icon-192.png', './icons/icon-512.png', './logos/catalog.json', './approved-art/catalog.json'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES.map(p => new URL(p, ROOT).href))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k.startsWith('button-studio-pwa-') && ![SHELL,RUNTIME].includes(k)).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
async function remember(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return;
  const cache = await caches.open(RUNTIME);
  await cache.put(request, response.clone());
  const keys = await cache.keys();
  if (keys.length > 75) await Promise.all(keys.slice(0,keys.length-75).map(key => cache.delete(key)));
}
self.addEventListener('fetch', event => {
  const request=event.request, url=new URL(request.url);
  if (request.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  if (request.mode === 'navigate' || ['script','style','image','font'].includes(request.destination) || /\.json$/.test(url.pathname)) {
    event.respondWith((async () => {
      try {
        const network = await fetch(request);
        if (network.ok) event.waitUntil(remember(request, network));
        return network;
      } catch (_) {
        const fromRuntime=await caches.match(request);
        if (fromRuntime) return fromRuntime;
        if (request.mode==='navigate') {
          const fallback = url.pathname.startsWith(ROOT.pathname+'studio/') ? './studio/' : './';
          return (await caches.match(new URL(fallback,ROOT).href)) || Response.error();
        }
        return Response.error();
      }
    })());
  }
});
