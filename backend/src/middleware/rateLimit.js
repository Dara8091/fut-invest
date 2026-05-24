const { redisIncr } = require('../config/redis');

const inMemoryStore = new Map();

async function redisOrMemoryIncr(key, windowMs, _max) {
    const redisCount = await redisIncr(key, windowMs);
    if (redisCount !== null) return redisCount;

    if (!inMemoryStore.has(key)) {
        inMemoryStore.set(key, { count: 0, resetAt: Date.now() + windowMs });
    }
    const entry = inMemoryStore.get(key);
    if (Date.now() > entry.resetAt) {
        entry.count = 0;
        entry.resetAt = Date.now() + windowMs;
    }
    entry.count++;
    return entry.count;
}

// Cleanup memory store every 5 min
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of inMemoryStore) {
        if (now > entry.resetAt) inMemoryStore.delete(key);
    }
}, 300000);

function createLimiter({ windowMs, max, message, keyGenerator }) {
    return async (req, res, next) => {
        const key = keyGenerator ? keyGenerator(req) : req.ip;
        const count = await redisOrMemoryIncr(`rl:${key}`, windowMs, max);
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
        res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + windowMs) / 1000));
        if (count > max) {
            return res.status(429).json({ error: message || 'Demasiadas peticiones. Intenta de nuevo más tarde.' });
        }
        next();
    };
}

const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
});

const apiLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Límite de peticiones excedido.' },
});

const userLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator: (req) => {
        const userId = req.user?.userId || 'anon';
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        return `${userId}:${ip}`;
    },
    message: { error: 'Demasiadas peticiones. Intenta de nuevo en 1 minuto.' },
});

const depositLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 5,
    keyGenerator: (req) => `${req.user?.userId || 'anon'}`,
    message: { error: 'Demasiadas solicitudes de depósito. Espera 1 minuto.' },
});

const withdrawLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 3,
    keyGenerator: (req) => `${req.user?.userId || 'anon'}`,
    message: { error: 'Demasiadas solicitudes de retiro. Espera 1 minuto.' },
});

const webhookLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Demasiados webhooks.' },
});

const resetPasswordLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 3,
    keyGenerator: (req) => {
        const email = req.body?.email || 'unknown';
        const ip = req.ip || 'unknown';
        return `reset:${email}:${ip}`;
    },
    message: { error: 'Demasiadas solicitudes de restablecimiento. Espera 15 minutos.' },
});

const forgotPasswordLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => {
        const email = req.body?.email || 'unknown';
        const ip = req.ip || 'unknown';
        return `forgot:${email}:${ip}`;
    },
    message: { error: 'Demasiadas solicitudes. Espera 1 hora.' },
});

module.exports = { authLimiter, apiLimiter, userLimiter, depositLimiter, withdrawLimiter, webhookLimiter, resetPasswordLimiter, forgotPasswordLimiter, createLimiter };
