/* 宠物俄语通 — offline cache. Shell: cache-first with background refresh; data: stale-while-revalidate. */
const V = "mm-v17-pets-resources";
const SHELL = ["resources.css", "resources.js", "resources-data.js", "motion.js", "./", "index.html", "style.css", "v3.css", "pets.js", "v3.js", "memo3.js", "classics.js", "vendor/matter.min.js", "cat.js", "pet.js", "app.js", "pages.js", "study.js", "exam.js", "library.js", "feed.js", "play.js", "cloud-config.js", "cloud.js", "social.js", "img/pose/walk.webp", "img/pose/crouch.webp", "img/pose/pounce.webp", "img/pose/ball.webp", "img/pose/hero.webp", "img/item/ball.webp", "img/item/wand.webp", "img/item/bowl.webp", "img/item/feather.webp", "manifest.webmanifest", "icons/icon-192.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin || /\/data\/resources\//.test(new URL(req.url).pathname)) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(req);
    const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
