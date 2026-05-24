const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const logger = require('../config/logger');
const emailService = require('../services/emailService');
const analytics = require('../config/analytics');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_DAYS = 7;
const RESET_TOKEN_HOURS = 1;
const trackConversion = analytics.trackConversion;

function generateTokenPair(user) {
    const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 86400000).toISOString();

    db.prepare(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
    ).run(user.id, tokenHash, expiresAt);

    return { accessToken, refreshToken };
}

function register(req, res) {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Generar código de referido único
    const referralCode = 'FI' + crypto.randomBytes(4).toString('hex').toUpperCase();
    if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existing = db.prepare('SELECT id, email_verified FROM users WHERE email = ?').get(email);
    if (existing) {
        if (existing.email_verified) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }
        // Re-register: re-envía verificación
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        db.prepare('UPDATE users SET verification_token = ?, verification_sent = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?').run(tokenHash, existing.id);
        emailService.sendVerificationEmail(email, token).catch(e => logger.warn('Error email:', e.message));
        return res.status(200).json({ message: 'El email ya existe pero no está verificado. Re-enviamos el enlace de verificación.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    const result = db.prepare(
        'INSERT INTO users (email, password_hash, full_name, verification_token, verification_sent, referral_code) VALUES (?, ?, ?, ?, datetime(\'now\'), ?)'
    ).run(email, hash, fullName || 'Inversor', verificationHash, referralCode);

    const userId = result.lastInsertRowid;
    db.prepare('INSERT INTO accounts (user_id, balance) VALUES (?, 0)').run(userId);
    db.prepare('INSERT INTO onboarding_progress (user_id) VALUES (?)').run(userId);

    const user = { id: userId, email, role: 'investor' };
    const tokens = generateTokenPair(user);

    emailService.sendVerificationEmail(email, verificationToken).catch(e => logger.warn('Error email:', e.message));

    trackConversion(userId, 'signup', { email });

    res.status(201).json({
        ...tokens,
        user: { id: userId, email, fullName: fullName || 'Inversor', role: 'investor', tier: 'gold', emailVerified: false }
    });
}

function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.email_verified && process.env.REQUIRE_EMAIL_VERIFICATION !== 'false') {
        return res.status(403).json({ error: 'Email no verificado. Revisa tu bandeja de entrada.', needsVerification: true });
    }

    const tokens = generateTokenPair(user);

    trackConversion(user.id, 'login', { email: user.email });

    res.json({
        ...tokens,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            tier: user.tier,
            kycStatus: user.kyc_status,
            totpEnabled: !!user.totp_enabled,
            emailVerified: !!user.email_verified,
        }
    });
}

function refresh(req, res) {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = db.prepare(
        'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > datetime(\'now\')'
    ).get(tokenHash);

    if (!stored) {
        return res.status(401).json({ error: 'Refresh token inválido o expirado' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(stored.user_id);
    if (!user) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(stored.id);

    const tokens = generateTokenPair(user);

    res.json(tokens);
}

function verifyEmail(req, res) {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token requerido' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = db.prepare(
        'SELECT id, email FROM users WHERE verification_token = ? AND email_verified = 0'
    ).get(tokenHash);

    if (!user) {
        return res.status(400).json({ error: 'Token inválido o expirado. Solicita un nuevo enlace.' });
    }

    db.prepare(
        "UPDATE users SET email_verified = 1, verification_token = NULL, updated_at = datetime('now') WHERE id = ?"
    ).run(user.id);

    logger.info(`Email verificado: ${user.email}`);
    res.json({ message: 'Email verificado correctamente. Ya puedes iniciar sesión.' });
}

function resendVerification(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const user = db.prepare('SELECT id, email_verified FROM users WHERE email = ?').get(email);
    if (!user) return res.status(200).json({ message: 'Si el email existe, recibirás instrucciones.' });
    if (user.email_verified) return res.status(200).json({ message: 'El email ya está verificado. Inicia sesión.' });

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    db.prepare('UPDATE users SET verification_token = ?, verification_sent = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?').run(tokenHash, user.id);

    emailService.sendVerificationEmail(email, token).catch(e => logger.warn('Error email:', e.message));

    res.json({ message: 'Si el email existe, recibirás instrucciones.' });
}

function forgotPassword(req, res) {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email requerido' });
    }

    const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
    if (!user) {
        return res.status(200).json({ message: 'Si el email existe, recibirás instrucciones.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_HOURS * 3600000).toISOString();

    db.prepare('UPDATE reset_tokens SET used = 1 WHERE user_id = ?').run(user.id);
    db.prepare(
        'INSERT INTO reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
    ).run(user.id, tokenHash, expiresAt);

    emailService.sendPasswordResetEmail(email, token).catch(e => logger.warn('Error email:', e.message));
    logger.info(`Password reset solicitado para ${email}`);

    res.json({ message: 'Si el email existe, recibirás instrucciones.' });
}

function resetPassword(req, res) {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token y nueva contraseña requeridos' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const stored = db.prepare(
        'SELECT * FROM reset_tokens WHERE token_hash = ? AND used = 0 AND expires_at > datetime(\'now\')'
    ).get(tokenHash);

    if (!stored) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(hash, stored.user_id);
    db.prepare('UPDATE reset_tokens SET used = 1 WHERE id = ?').run(stored.id);
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(stored.user_id);

    res.json({ message: 'Contraseña actualizada correctamente.' });
}

function me(req, res) {
    const user = db.prepare(
        'SELECT id, email, full_name, role, tier, kyc_status, totp_enabled, email_verified, email_notifications, push_enabled, referral_code, referred_by FROM users WHERE id = ?'
    ).get(req.user.userId);

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tier: user.tier,
        kycStatus: user.kyc_status,
        totpEnabled: !!user.totp_enabled,
        emailVerified: !!user.email_verified,
        emailNotifications: !!user.email_notifications,
        pushEnabled: !!user.push_enabled,
        referralCode: user.referral_code,
        referredBy: user.referred_by,
    });
}

module.exports = { register, login, refresh, verifyEmail, resendVerification, forgotPassword, resetPassword, me };
