// Service worker do PWA Rafael Faria Performance.
// Estratégia conservadora para não quebrar o app SSR + Supabase:
// - assets estáticos com hash (/assets, /icons): cache-first (rápido/offline)
// - HTML/navegação, serverFn e Supabase: sempre rede (sem servir conteúdo velho)
const CACHE = "rfp-cache-v1";
const PRECACHE = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Só mexe em recursos do próprio site.
  if (url.origin !== self.location.origin) return;
  // Nunca cacheia chamadas dinâmicas.
  if (url.pathname.startsWith("/_server") || url.pathname.startsWith("/api")) return;

  // Assets estáticos com hash → cache-first.
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
  }
  // Demais (HTML/navegação): deixa passar direto pela rede (default).
});
