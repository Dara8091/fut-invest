const { Router } = require('express');
const { toggle2FA, verifyTOTP, get2FAStatus } = require('../controllers/securityController');
const { authenticate } = require('../middleware/auth');
const { rls } = require('../middleware/rls');

const router = Router();

/**
 * @swagger
 * /api/security/toggle-2fa:
 *   post:
 *     tags: [Security]
 *     summary: Activar/desactivar 2FA
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled: { type: boolean }
 *     responses:
 *       200: { description: Estado 2FA actualizado }
 */
router.post('/toggle-2fa', authenticate, rls, toggle2FA);

/**
 * @swagger
 * /api/security/verify-totp:
 *   post:
 *     tags: [Security]
 *     summary: Verificar código TOTP
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string, example: "123456" }
 *     responses:
 *       200: { description: Código válido }
 *       401: { description: Código inválido }
 */
router.post('/verify-totp', authenticate, rls, verifyTOTP);

/**
 * @swagger
 * /api/security/2fa-status:
 *   get:
 *     tags: [Security]
 *     summary: Obtener estado del 2FA
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Estado 2FA }
 */
router.get('/2fa-status', authenticate, rls, get2FAStatus);

module.exports = router;
