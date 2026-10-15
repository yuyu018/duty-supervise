/* 督導勤務記錄：離線快取
   - 本站檔案：先連網取最新版，沒網路時用快取
   - 辨識元件（jsdelivr）：先用快取，沒有才下載 */
const CACHE = "supervise-v2026.10.15c";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./index.html")))
    );
  } else if (url.hostname === "cdn.jsdelivr.net" || url.hostname === "cdnjs.cloudflare.com") {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
        return res;
      }))
    );
  }
});
