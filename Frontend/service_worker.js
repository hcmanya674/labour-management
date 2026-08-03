/* ==========================================
   Labour Management System
   Service Worker
========================================== */

const CACHE_NAME = "labour-management-v1";

/* Files to cache */
const FILES_TO_CACHE = [

    "/",

    "index.html",

    "../../pages/auth/loginindex.html",

    "../../pages/leader/dashboard.html",

    "../../pages/admin/admin.html",

    "css/style.css",
    "js/common/script.js",

    "../../js/admin/admin.js",

    "../../js/common/firebase.js",

    "manifest.json",

    "images/labourproject.png",

    "images/labourproject2.png"

];


/* ==========================================
   INSTALL
========================================== */

self.addEventListener("install", event => {

    console.log("Service Worker Installed");

    event.waitUntil(

        caches.open(CACHE_NAME)

        .then(cache => {

            return cache.addAll(FILES_TO_CACHE);

        })

    );

});


/* ==========================================
   ACTIVATE
========================================== */

self.addEventListener("activate", event => {

    console.log("Service Worker Activated");

    event.waitUntil(

        caches.keys().then(cacheNames => {

            return Promise.all(

                cacheNames.map(cache => {

                    if(cache !== CACHE_NAME){

                        return caches.delete(cache);

                    }

                })

            );

        })

    );

});


/* ==========================================
   FETCH
========================================== */

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)

        .then(response => {

            return response || fetch(event.request);

        })

    );

});