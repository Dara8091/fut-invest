const logger = require('./logger');

const REDIS_URL = process.env.REDIS_URL || '';

let redisClient = null;

function createRedisClient() {
    if (!REDIS_URL) return null;
    try {
        const Redis = require('ioredis');
        const client = new Redis(REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times * 200, 3000),
            lazyConnect: true,
        });
        client.on('error', (err) => logger.warn('Redis error:', err.message));
        client.on('connect', () => logger.info('Redis conectado'));
        return client;
    } catch (e) {
        logger.warn('Redis no disponible, usando store en memoria:', e.message);
        return null;
    }
}

async function getRedis() {
    if (redisClient) return redisClient;
    redisClient = createRedisClient();
    if (redisClient) {
        try { await redisClient.connect(); } catch { redisClient = null; }
    }
    return redisClient;
}

async function redisIncr(key, windowMs) {
    const client = await getRedis();
    if (!client) return null;
    const multi = client.multi();
    multi.incr(key);
    multi.pttl(key);
    const [count, ttl] = await multi.exec();
    if (ttl[1] <= 0) client.pexpire(key, windowMs).catch(() => {});
    return count[1];
}

async function redisSet(key, value, ttlMs) {
    const client = await getRedis();
    if (!client) return false;
    await client.set(key, JSON.stringify(value), 'PX', ttlMs);
    return true;
}

async function redisGet(key) {
    const client = await getRedis();
    if (!client) return null;
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
}

async function redisDel(key) {
    const client = await getRedis();
    if (!client) return;
    await client.del(key);
}

module.exports = { getRedis, redisIncr, redisSet, redisGet, redisDel };
