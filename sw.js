const appName = "restaurant-reviews-app"
const staticCacheName = appName + "-v1.5";
// seperating imgs cach from the main cach
const contentImgsCache = appName + "-images";

// array for tracking the caches
var allCaches = [
  staticCacheName,
  contentImgsCache
];

/** At Service Worker Install time, cache all static assets */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/', // this caches index.html
        '/restaurant.html',
        '/css/styles.css',
        '/css/styles-medium.css',
        '/css/styles-large.css',
        '/js/dbhelper.js',
        '/js/mapbox.js',
        '/js/main.js',
        '/js/restaurant_info.js',
        'js/register-sw.js',
        'data/restaurants.json'

      ]);
    })
  );
});

/** At Service Worker Activation, Delete previous caches, if any */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith(appName) &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
/** Hijack fetch requests */
self.addEventListener('fetch', function(event) {
  const requestUrl = new URL(event.request.url);

  // only highjack request made to our local app without APIs
  if (requestUrl.origin === location.origin) {

    // allowing to access the restaurant Ids to the cache by using startWith method.
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(caches.match('/restaurant.html'));
      return;
    }
    // If the request pathname starts with /img, then we need to handle images.
if (requestUrl.pathname.startsWith('/img')) {
  event.respondWith(serveImage(event.request));
  return;
}
  }

  // the default behavior is respond with cached elements if any, falling back to network.
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

function serveImage(request) {
  let imageStorageUrl = request.url;

// cache one image by stripping the suffix and extension
  imageStorageUrl = imageStorageUrl.replace(/-small\.\w{3}|-medium\.\w{3}|-large\.\w{3}/i, '');

  return caches.open(contentImgsCache).then(function(cache) {
    return cache.match(imageStorageUrl).then(function(response) {
      // if image is in cache, return it, else fetch from network, cache a clone, then return network response
      return response || fetch(request).then(function(networkResponse) {
        cache.put(imageStorageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
