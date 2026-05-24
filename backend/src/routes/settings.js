const { Router } = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');
const logger = require('../config/logger');
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { removeAllSubscriptions } = require('../services/webPushService');

const router = Router();
router.use(authenticate);

router.post('/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Contraseña actual y nueva requeridas' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
        return res.status(403).json({ error: 'Contraseña actual incorrecta' });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(hash, req.user.userId);
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(req.user.userId);

    auditLog(req.user.userId, 'password_changed', 'users', req.user.userId, null, null, null, req);
    logger.info(`Contraseña cambiada para user #${req.user.userId}`);
    res.json({ message: 'Contraseña actualizada correctamente.' });
});

router.get('/notifications', (req, res) => {
    const user = db.prepare('SELECT email_notifications, push_enabled FROM users WHERE id = ?').get(req.user.userId);
    res.json({
        emailNotifications: user?.email_notifications ?? true,
        pushEnabled: user?.push_enabled ?? false,
    });
});

router.post('/notifications', (req, res) => {
    const { emailNotifications, pushEnabled } = req.body;
    db.prepare(
        `UPDATE users SET email_notifications = ?, push_enabled = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(emailNotifications ? 1 : 0, pushEnabled ? 1 : 0, req.user.userId);
    res.json({ message: 'Preferencias actualizadas.' });
});

router.post('/push-subscribe', (req, res) => {
    const { subscription } = req.body;
    if (!subscription?.endpoint) return res.status(400).json({ error: 'Suscripción inválida' });

    const webPushService = require('../services/webPushService');
    webPushService.addSubscription(req.user.userId, subscription);
    res.json({ message: 'Suscripción registrada.' });
});

router.post('/push-unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) {
        removeAllSubscriptions(req.user.userId);
    } else {
        const webPushService = require('../services/webPushService');
        webPushService.removeSubscription(req.user.userId, endpoint);
    }
    res.json({ message: 'Suscripción eliminada.' });
});

router.delete('/account', (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Contraseña requerida' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);
    if (!bcrypt.compareSync(password, user.password_hash)) {
        return res.status(403).json({ error: 'Contraseña incorrecta' });
    }

    db.transaction(() => {
        // Anonymize personal data (GDPR right to erasure)
        const anonymized = `deleted_${req.user.userId}_${Date.now()}@anonymized.futinvest.io`;
        db.prepare(
            `UPDATE users SET email = ?, password_hash = ?, full_name = 'Usuario Eliminado',
             kyc_status = 'rejected', kyc_document_url = NULL, verification_token = NULL,
             totp_enabled = 0, email_verified = 0, updated_at = datetime('now')
             WHERE id = ?`
        ).run(anonymized, '', req.user.userId);

        db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(req.user.userId);
        removeAllSubscriptions(req.user.userId);
    })();

    auditLog(req.user.userId, 'account_deleted', 'users', req.user.userId, null, null, null, req);
    logger.info(`Cuenta eliminada: user #${req.user.userId}`);
    res.json({ message: 'Cuenta eliminada correctamente.' });
});

router.post('/kyc', (req, res) => {
    const { documentType, fileBase64, mimeType } = req.body;
    if (!documentType || !fileBase64) {
        return res.status(400).json({ error: 'Tipo de documento y archivo requeridos' });
    }

    const validTypes = ['id_front', 'id_back', 'passport', 'selfie', 'proof_of_address'];
    if (!validTypes.includes(documentType)) {
        return res.status(400).json({ error: 'Tipo de documento inválido' });
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const decoded = Buffer.from(fileBase64, 'base64');
    if (decoded.length > MAX_SIZE) {
        return res.status(400).json({ error: 'Archivo demasiado grande (máx 10MB)' });
    }

    const fileHash = crypto.createHash('sha256').update(decoded).digest('hex');
    const fileUrl = `data:${mimeType || 'image/jpeg'};base64,${fileBase64}`;

    // Delete previous pending documents for same type
    db.prepare('DELETE FROM kyc_documents WHERE user_id = ? AND document_type = ? AND status = \'pending\'')
        .run(req.user.userId, documentType);

    db.prepare(
        `INSERT INTO kyc_documents (user_id, document_type, file_url, file_hash) VALUES (?, ?, ?, ?)`
    ).run(req.user.userId, documentType, fileUrl, fileHash);

    // Update user KYC status if pending
    const user = db.prepare('SELECT kyc_status FROM users WHERE id = ?').get(req.user.userId);
    if (user?.kyc_status === 'pending') {
        db.prepare('UPDATE users SET kyc_status = \'pending\', updated_at = datetime(\'now\') WHERE id = ?')
            .run(req.user.userId);
    }

    auditLog(req.user.userId, 'kyc_document_uploaded', 'kyc_documents', null, null, null, null, req);
    logger.info(`KYC document uploaded: user #${req.user.userId}, type=${documentType}`);
    res.json({ message: 'Documento subido correctamente. Revisaremos tu verificación pronto.' });
});

module.exports = router;
