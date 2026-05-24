const db = require('../config/database');
const logger = require('../config/logger');

const MAX_ATTEMPTS = parseInt(process.env.LOCKOUT_MAX_ATTEMPTS || '5', 10);
const LOCKOUT_WINDOW_MS = parseInt(process.env.LOCKOUT_WINDOW_MINUTES || '15', 10) * 60000;
const LOCKOUT_DURATION_MS = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '30', 10) * 60000;

function getAttempts(email) {
    try {
        const row = db.prepare('SELECT attempts, locked_until FROM login_attempts WHERE email = ?').get(email);
        if (!row) return { attempts: 0, locked: false };
        if (row.locked_until && Date.now() < row.locked_until) {
            return { attempts: row.attempts, locked: true, lockedUntil: row.locked_until };
        }
        if (row.locked_until && Date.now() >= row.locked_until) {
            db.prepare('DELETE FROM login_attempts WHERE email = ?').run(email);
            return { attempts: 0, locked: false };
        }
        return { attempts: row.attempts, locked: false };
    } catch {
        return { attempts: 0, locked: false };
    }
}

function recordFailedAttempt(email) {
    try {
        const now = Date.now();
        const row = db.prepare('SELECT attempts, first_attempt_at FROM login_attempts WHERE email = ?').get(email);
        if (!row) {
            db.prepare('INSERT INTO login_attempts (email, attempts, first_attempt_at) VALUES (?, 1, ?)').run(email, now);
            return { attempts: 1, locked: false };
        }
        if (now - row.first_attempt_at > LOCKOUT_WINDOW_MS) {
            db.prepare('UPDATE login_attempts SET attempts = 1, first_attempt_at = ?, locked_until = NULL WHERE email = ?').run(now, email);
            return { attempts: 1, locked: false };
        }
        const newAttempts = row.attempts + 1;
        if (newAttempts >= MAX_ATTEMPTS) {
            db.prepare('UPDATE login_attempts SET attempts = ?, locked_until = ? WHERE email = ?').run(newAttempts, now + LOCKOUT_DURATION_MS, email);
            logger.warn(`Cuenta bloqueada: ${email} por ${LOCKOUT_DURATION_MS/60000}min tras ${newAttempts} intentos`);
            return { attempts: newAttempts, locked: true };
        }
        db.prepare('UPDATE login_attempts SET attempts = ? WHERE email = ?').run(newAttempts, email);
        return { attempts: newAttempts, locked: false };
    } catch (err) {
        logger.error('Error registrando intento fallido:', err);
        return { attempts: 0, locked: false };
    }
}

function clearAttempts(email) {
    try {
        db.prepare('DELETE FROM login_attempts WHERE email = ?').run(email);
    } catch (e) {
        logger.warn('Error clearing login attempts:', e.message);
    }
}

function lockoutMiddleware(req, res, next) {
    const email = req.body?.email?.toLowerCase().trim();
    if (!email) return next();
    const { locked, lockedUntil } = getAttempts(email);
    if (locked) {
        const remaining = Math.ceil((lockedUntil - Date.now()) / 60000);
        return res.status(429).json({
            error: `Demasiados intentos. Cuenta bloqueada por ${remaining} minuto(s).`
        });
    }
    next();
}

module.exports = { lockoutMiddleware, recordFailedAttempt, clearAttempts };
