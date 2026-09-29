// Bump this string whenever app.js/styles.css/index.html change so users get the update.
var CACHE_VERSION = 'lessoncal-v2';
var APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(key){
        if(key !== CACHE_VERSION) return caches.delete(key);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method !== 'GET') return; // don't touch POSTs etc.

  var url = new URL(req.url);

  // Cross-origin requests (e.g. the currency rate API, Google Fonts) always go
  // straight to the network — never cached, never blocked. If there's no
  // internet they'll simply fail and the app already handles that gracefully.
  if(url.origin !== self.location.origin){
    event.respondWith(fetch(req).catch(function(){ return new Response('', {status: 503}); }));
    return;
  }

  // Same-origin app shell: cache-first, falling back to network, and to the
  // cached index.html for any navigation when fully offline.
  event.respondWith(
    caches.match(req).then(function(cached){
      if(cached) return cached;
      return fetch(req).then(function(res){
        if(res && res.status===200){
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function(cache){ cache.put(req, copy); });
        }
        return res;
      }).catch(function(){
        if(req.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
