// ============================================
// Audit Logging Middleware
// ============================================
const db = require('../config/database');

function auditLog(userId, action, entityType, entityId, oldValue, newValue, metadata, req) {
    const ip = req?.ip || req?.connection?.remoteAddress || null;
    const ua = req?.headers?.['user-agent'] || null;
    db.prepare(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(userId, action, entityType, entityId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ip, ua,
        metadata ? JSON.stringify(metadata) : null
    );
}

function auditMiddleware(action, entityType) {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            if (res.statusCode < 400 && req.user) {
                auditLog(req.user.userId, action, entityType, null, null, body, req);
            }
            return originalJson(body);
        };
        next();
    };
}

module.exports = { auditLog, auditMiddleware };
