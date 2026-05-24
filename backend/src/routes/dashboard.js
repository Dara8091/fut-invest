const { Router } = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { rls } = require('../middleware/rls');

const router = Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Obtener datos del panel principal
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Balance, contratos activos e historial ROI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance: { type: number }
 *                 contracts: { type: array, items: { type: object } }
 *                 roiHistory: { type: array, items: { type: object } }
 */
router.get('/', authenticate, rls, getDashboard);

module.exports = router;
