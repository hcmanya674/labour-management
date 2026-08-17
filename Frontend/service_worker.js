/* ==========================================
   Labour Management System
   Service Worker
========================================== */

const CACHE_NAME = "labour-management-v2";

/* ==========================================
   INSTALL
========================================== */

self.addEventListener("install", event => {

    console.log("Service Worker: Installing...");

    // Activate the new service worker immediately
    self.skipWaiting();

});


/* ==========================================
   ACTIVATE
========================================== */

self.addEventListener("activate", event => {

    console.log("Service Worker: Activating...");

    event.waitUntil(

        caches.keys().then(cacheNames => {

            return Promise.all(

                cacheNames.map(cacheName => {

                    if (cacheName !== CACHE_NAME) {

                        console.log(
                            "Deleting old cache:",
                            cacheName
                        );

                        return caches.delete(cacheName);

                    }

                })

            );

        }).then(() => {

            // Take control of all open pages
            return self.clients.claim();

        })

    );

});


/* ==========================================
   FETCH
========================================== */

self.addEventListener("fetch", event => {

    const request = event.request;

    // Only handle GET requests
    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);


    /* ==========================================
       DO NOT CACHE FIREBASE / EXTERNAL REQUESTS
    ========================================== */

    if (
        url.origin !== self.location.origin
    ) {

        return;

    }


    /* ==========================================
       HTML FILES
       
       NETWORK FIRST
       
       Always try Firebase first.
       Cache is only used when offline.
    ========================================== */

    if (
        request.mode === "navigate" ||
        url.pathname.endsWith(".html") ||
        url.pathname === "/"
    ) {

        event.respondWith(

            fetch(request)

                .then(response => {

                    // Save latest version
                    const responseClone =
                        response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {

                            cache.put(
                                request,
                                responseClone
                            );

                        });

                    return response;

                })

                .catch(() => {

                    // Offline → use cached version
                    return caches.match(request);

                })

        );

        return;

    }


    /* ==========================================
       CSS / JS / IMAGES
       
       NETWORK FIRST
       
       This ensures updated files are
       obtained after deployment.
    ========================================== */

    if (
        url.pathname.endsWith(".css") ||
        url.pathname.endsWith(".js") ||
        url.pathname.endsWith(".png") ||
        url.pathname.endsWith(".jpg") ||
        url.pathname.endsWith(".jpeg") ||
        url.pathname.endsWith(".svg") ||
        url.pathname.endsWith(".webp") ||
        url.pathname.endsWith(".json")
    ) {

        event.respondWith(

            fetch(request)

                .then(response => {

                    const responseClone =
                        response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {

                            cache.put(
                                request,
                                responseClone
                            );

                        });

                    return response;

                })

                .catch(() => {

                    return caches.match(request);

                })

        );

        return;

    }


    /* ==========================================
       OTHER REQUESTS
    ========================================== */

    event.respondWith(

        fetch(request)

            .catch(() => {

                return caches.match(request);

            })

    );

});