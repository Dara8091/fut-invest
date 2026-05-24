const { redisGet, redisSet } = require('../config/redis');

const CACHE_TTL = parseInt(process.env.CACHE_TTL || '60', 10); // seconds

const memoryCache = new Map();
const MEMORY_TTL = 30; // seconds for memory fallback

function cacheMiddleware(ttlSeconds) {
    return async (req, res, next) => {
        const key = `cache:${req.user?.userId || 'anon'}:${req.originalUrl}`;
        const ttl = ttlSeconds || CACHE_TTL;

        // Try Redis first
        const redisResult = await redisGet(key);
        if (redisResult !== null) {
            return res.json(redisResult);
        }

        // Try memory cache
        if (memoryCache.has(key)) {
            const entry = memoryCache.get(key);
            if (Date.now() < entry.expiresAt) {
                return res.json(entry.data);
            }
            memoryCache.delete(key);
        }

        // Override res.json to cache the response
        const originalJson = res.json.bind(res);
        res.json = function (data) {
            if (res.statusCode === 200) {
                redisSet(key, data, ttl * 1000).catch(() => {});
                memoryCache.set(key, { data, expiresAt: Date.now() + MEMORY_TTL * 1000 });
            }
            return originalJson(data);
        };

        next();
    };
}

function invalidateCache(pattern) {
    // Clear memory cache entries matching pattern
    for (const key of memoryCache.keys()) {
        if (key.includes(pattern)) memoryCache.delete(key);
    }
}

module.exports = { cacheMiddleware, invalidateCache };
