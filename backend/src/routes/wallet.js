const { Router } = require('express');
const { withdraw, deposit, getTransactions } = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');
const { rls } = require('../middleware/rls');
const { withdrawRules, depositRules, handleValidationErrors } = require('../middleware/validate');

const router = Router();

/**
 * @swagger
 * /api/wallet/withdraw:
 *   post:
 *     tags: [Wallet]
 *     summary: Solicitar retiro
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               asset: { type: string, enum: [BTC, "USDT (TRC20)", "USDT (ERC20)"] }
 *               address: { type: string }
 *               amount: { type: number }
 *     responses:
 *       200: { description: Retiro solicitado }
 */
router.post('/withdraw', authenticate, rls, withdrawRules, handleValidationErrors, withdraw);

/**
 * @swagger
 * /api/wallet/deposit:
 *   post:
 *     tags: [Wallet]
 *     summary: Generar dirección de depósito
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               asset: { type: string }
 *               amount: { type: number }
 *     responses:
 *       200: { description: Dirección generada }
 */
router.post('/deposit', authenticate, rls, depositRules, handleValidationErrors, deposit);

/**
 * @swagger
 * /api/wallet/transactions:
 *   get:
 *     tags: [Wallet]
 *     summary: Historial de transacciones
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de transacciones }
 */
router.get('/transactions', authenticate, rls, getTransactions);

module.exports = router;
