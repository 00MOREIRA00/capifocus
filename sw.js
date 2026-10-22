// Service worker do Capifocus (#19): deixa o app instalável e funcionando offline.
// Estratégia "rede primeiro": online, sempre busca a versão mais nova (e atualiza o cache);
// offline, usa o que ficou guardado. Assim uma versão antiga nunca fica presa no aparelho.
const CACHE = "capifocus-v1.12.0";
const ASSETS = [
  "./",
  "index.html",
  "manifest.json",
  "css/app.css",
  "css/mascot.css",
  "css/seasonal.css",
  "js/theme.js",
  "js/components/mascot.js",
  "js/seasonal.js",
  "js/app.js",
  "js/dom.js",
  "js/timer.js",
  "js/stats.js",
  "js/tasks.js",
  "js/lofi.js",
  "assets/fonts/Nunito.woff2",
  "assets/fonts/Fredoka.woff2",
  "assets/fonts/CapiTerror.woff2",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-maskable-512.png",
  "assets/icons/apple-touch-icon.png",
  "assets/mascot/capy-default.png",
  "assets/mascot/capy-focus.png",
  "assets/mascot/capy-break.png",
  "assets/mascot/capy-completed.png",
  "assets/mascot/capy-radio.png",
  "assets/mascot/capy-rabugenta.png",
  "assets/icons/favicon-32.png",
  "assets/icons/favicon-192.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("capifocus-") && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(request, copy)); }
        return response;
      })
      .catch(() => caches.match(request).then(hit => hit || (request.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});

// Notificação de fim de etapa: ao tocar, volta para o app (ou abre se estiver fechado).
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) if ("focus" in client) return client.focus();
      return self.clients.openWindow ? self.clients.openWindow("./") : undefined;
    })
  );
});
