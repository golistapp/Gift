const CACHE_NAME = 'giftorax-premium-v1';
const DYNAMIC_CACHE = 'giftorax-dynamic-v1';

const CORE_ASSETS = [
    '/',
    '/index.html',
    '/lead-form.html',
    '/portal.html',
    '/experience.html',
    '/landing-assets/style.css',
    '/landing-assets/main.js',
    'https://ik.imagekit.io/hryqx2lst9/qr-memory-gift/1000198391-optimized.jpg'
];

// 1. Install & Cache Core Assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CORE_ASSETS);
        })
    );
});

// 2. Activate & Clean Old Caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// 3. Smart Fetch Strategy
self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Network First for HTML (Fallback to Cache, then Offline Page)
    if (req.mode === 'navigate' || req.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(req)
                .then((networkRes) => {
                    return caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(req, networkRes.clone());
                        return networkRes;
                    });
                })
                .catch(() => {
                    return caches.match(req).then((cachedRes) => {
                        if (cachedRes) return cachedRes;
                        // Beautiful Offline Fallback
                        return new Response(
                            `<!DOCTYPE html>
                            <html lang="en">
                            <head>
                                <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>Offline - GiftoraX</title>
                                <style>
                                    body { background: #05020a; color: #fff; font-family: 'Poppins', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; margin: 0; }
                                    h2 { font-size: 2rem; background: linear-gradient(135deg, #ffffff 0%, #ffb5c8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px; }
                                    p { color: #b3b3b3; font-size: 1.1rem; max-width: 80%; }
                                </style>
                            </head>
                            <body>
                                <h2>You’re offline… <br>but your memories are safe ❤️</h2>
                                <p>Reconnect to the internet to continue your magical journey.</p>
                            </body>
                            </html>`,
                            { headers: { 'Content-Type': 'text/html' } }
                        );
                    });
                })
        );
    } 
    // Cache First for Assets (Images, CSS, JS)
    else {
        event.respondWith(
            caches.match(req).then((cachedRes) => {
                return cachedRes || fetch(req).then((networkRes) => {
                    return caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(req, networkRes.clone());
                        return networkRes;
                    });
                });
            })
        );
    }
});
