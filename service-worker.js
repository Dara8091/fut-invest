const CACHE = 'futinvest-v3';
const OFFLINE_URL = '/offline.html';
const ASSETS = [
    '/', '/index.html', '/style.css', '/app.js', '/api.js', '/i18n.js', '/config.js',
    '/manifest.json', '/service-worker.js', '/public/assets/app-lazy.js',
];

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        await cache.addAll(ASSETS);
        const offline = new Response(
            '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Sin conexión - fut.invest</title><style>body{background:#080C14;color:#E8EDF5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px}h1{color:#00D4FF}.offline-icon{font-size:64px;margin-bottom:16px}p{color:#8892B0}</style></head><body><div><div class="offline-icon">📡</div><h1>Sin conexión</h1><p>No hay conexión a Internet.<br>Algunas funciones pueden no estar disponibles.<br>Los datos se sincronizarán cuando recuperes la conexión.</p></div></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
        await cache.put(OFFLINE_URL, offline);
        self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
        await self.clients.claim();
    })());
});

// IndexedDB for offline queue
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('futinvest-offline', 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('pending')) db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache', { keyPath: 'url' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function queueRequest(request, body) {
    const db = await openDB();
    const tx = db.transaction('pending', 'readwrite');
    tx.objectStore('pending').add({ url: request.url, method: request.method, body, timestamp: Date.now() });
    await tx.done;
}

async function getCachedData(url) {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(url);
    if (cached) return cached;
    const db = await openDB();
    const tx = db.transaction('cache', 'readonly');
    const entry = await new Promise((r) => { const req = tx.objectStore('cache').get(url); req.onsuccess = () => r(req.result); });
    if (entry) return new Response(entry.data, { headers: { 'Content-Type': entry.contentType } });
    return null;
}

async function cacheApiResponse(url, data, contentType) {
    const db = await openDB();
    const tx = db.transaction('cache', 'readwrite');
    tx.objectStore('cache').put({ url, data, contentType, timestamp: Date.now() });
    await tx.done;
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // API requests: network-first with offline fallback
    if (url.pathname.startsWith('/api/')) {
        if (request.method !== 'GET') {
            // Queue POST/PUT/DELETE for background sync
            event.respondWith((async () => {
                try {
                    const response = await fetch(request.clone());
                    return response;
                } catch {
                    const clone = await request.clone().text();
                    await queueRequest(request.url, clone);
                    return new Response(JSON.stringify({ queued: true, message: 'Petición encolada para cuando haya conexión.' }), {
                        status: 202, headers: { 'Content-Type': 'application/json' },
                    });
                }
            })());
            return;
        }

        // GET API: stale-while-revalidate
        event.respondWith((async () => {
            const cached = await getCachedData(request.url);
            try {
                const response = await fetch(request);
                if (response.ok) {
                    const clone = response.clone();
                    const data = await clone.text();
                    cacheApiResponse(request.url, data, response.headers.get('Content-Type') || 'application/json');
                }
                return response;
            } catch {
                if (cached) return cached;
                return new Response(JSON.stringify({ error: 'Sin conexión' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
            }
        })());
        return;
    }

    // Static assets: cache-first
    event.respondWith(
        caches.match(request).then((cached) => cached || fetch(request).then((response) => {
            if (response.ok && response.type === 'basic') {
                const clone = response.clone();
                caches.open(CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
        }).catch(() => {
            if (request.mode === 'navigate') return caches.match(OFFLINE_URL);
            return new Response('Offline', { status: 503 });
        }))
    );
});

// Background sync for queued requests
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-pending') {
        event.waitUntil((async () => {
            const db = await openDB();
            const tx = db.transaction('pending', 'readonly');
            const all = await new Promise((r) => { const req = tx.objectStore('pending').getAll(); req.onsuccess = () => r(req.result); });
            for (const item of all) {
                try {
                    await fetch(item.url, { method: item.method, body: item.body, headers: { 'Content-Type': 'application/json' } });
                    const tx2 = db.transaction('pending', 'readwrite');
                    tx2.objectStore('pending').delete(item.id);
                    await tx2.done;
                } catch {}
            }
        })());
    }
});
