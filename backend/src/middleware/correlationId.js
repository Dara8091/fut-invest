const crypto = require('crypto');

function correlationIdMiddleware(req, res, next) {
    const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] ||
        `fut_${crypto.randomBytes(12).toString('hex')}`;

    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    // Override logger methods to include correlation ID
    const originalLog = console.log;
    const prefix = `[${correlationId}]`;

    const logger = {
        info: (msg, ...args) => originalLog(`${prefix} ${msg}`, ...args),
        warn: (msg, ...args) => originalLog(`${prefix} WARN: ${msg}`, ...args),
        error: (msg, ...args) => originalLog(`${prefix} ERROR: ${msg}`, ...args),
    };
    req.logger = logger;

    next();
}

module.exports = { correlationIdMiddleware };
