const db = require('../config/database');

function metricsMiddleware(req, res, next) {
    const start = Date.now();
    const originalEnd = res.end.bind(res);
    res.end = function (...args) {
        const duration = Date.now() - start;
        try {
            const hour = new Date().toISOString().slice(0, 13) + ':00:00';
            db.prepare(
                `INSERT INTO metrics_hourly (hour, endpoint, method, status_code, response_time_ms, count, user_id, ip_address)
                 VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
            ).run(hour, req.route?.path || req.path, req.method, res.statusCode, duration,
                req.user?.userId || null, req.ip || req.connection?.remoteAddress || null);
        } catch {
            // metrics no deben romper la request
        }
        return originalEnd(...args);
    };
    next();
}

module.exports = { metricsMiddleware };
