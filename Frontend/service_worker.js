/* ==========================================
   LABOUR MANAGEMENT SYSTEM
   SERVICE WORKER
========================================== */

const CACHE_NAME = "labour-management-v3";


/* ==========================================
   INSTALL
========================================== */

self.addEventListener("install", event => {

    console.log(
        "Installing Service Worker:",
        CACHE_NAME
    );

    // Do not wait for old service worker
    self.skipWaiting();

});


/* ==========================================
   ACTIVATE
========================================== */

self.addEventListener("activate", event => {

    console.log(
        "Activating Service Worker:",
        CACHE_NAME
    );

    event.waitUntil(

        caches.keys().then(cacheNames => {

            return Promise.all(

                cacheNames.map(cacheName => {

                    if (
                        cacheName !== CACHE_NAME
                    ) {

                        console.log(
                            "Removing old cache:",
                            cacheName
                        );

                        return caches.delete(
                            cacheName
                        );

                    }

                })

            );

        }).then(() => {

            return self.clients.claim();

        })

    );

});


/* ==========================================
   FETCH
========================================== */

self.addEventListener("fetch", event => {

    if (
        event.request.method !== "GET"
    ) {

        return;

    }

    event.respondWith(

        fetch(event.request)

            .then(response => {

                return response;

            })

            .catch(() => {

                return caches.match(
                    event.request
                );

            })

    );

});