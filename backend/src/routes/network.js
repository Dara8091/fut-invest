const { Router } = require('express');
const { getNetwork } = require('../controllers/networkController');
const { authenticate } = require('../middleware/auth');
const { rls } = require('../middleware/rls');

const router = Router();

/**
 * @swagger
 * /api/network:
 *   get:
 *     tags: [Network]
 *     summary: Obtener estructura de red binaria
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Nodos y estadísticas de la red
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nodes: { type: array, items: { type: object } }
 *                 stats:
 *                   type: object
 *                   properties:
 *                     leftPoints: { type: integer }
 *                     rightPoints: { type: integer }
 *                     totalVolume: { type: number }
 */
router.get('/', authenticate, rls, getNetwork);

module.exports = router;
