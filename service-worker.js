// Service worker sencillo: guarda en caché el "cascarón" de la
// app (HTML, CSS, JS propio, íconos) para que vuelva a abrir
// aunque la conexión esté inestable. El contenido dinámico
// (Supabase) siempre se pide en vivo, nunca se cachea acá.

const CACHE_NAME = "mi-bebe-crece-v1";

const ARCHIVOS_ESENCIALES = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./js/app.js",
  "./js/config.js",
  "./js/supabaseClient.js",
  "./js/auth/auth.js",
  "./js/baby/baby.js",
  "./js/home/home.js",
  "./js/timeline/timeline.js",
  "./js/premium/premium.js",
  "./js/ui/screens.js",
  "./js/content/weeklyDevelopment.js",
  "./js/content/activities.js",
  "./js/content/milestones.js",
  "./js/content/momTips.js",
  "./js/content/motivationalMessages.js",
  "./js/content/vaccines.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_ESENCIALES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(
        claves
          .filter((clave) => clave !== CACHE_NAME)
          .map((clave) => caches.delete(clave))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear llamadas a Supabase: siempre deben ir en vivo.
  if (url.hostname.endsWith("supabase.co")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((respuestaCacheada) => {
      return (
        respuestaCacheada ||
        fetch(event.request).catch(() => caches.match("./index.html"))
      );
    })
  );
});
