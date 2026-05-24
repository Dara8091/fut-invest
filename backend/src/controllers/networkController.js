const db = require('../config/database');

function getNetwork(req, res) {
    const userId = req.user.userId;

    // Obtener todos los nodos de la red del usuario
    const nodes = db.prepare('SELECT * FROM network_nodes WHERE user_id = ? ORDER BY id ASC').all(userId);

    if (nodes.length === 0) {
        return res.json({
            root: null,
            stats: { leftPoints: 0, rightPoints: 0, totalVolume: 0 }
        });
    }

    // Calcular estadísticas
    const root = nodes[0];
    const totalVolume = nodes.reduce((sum, n) => sum + n.volume, 0);

    res.json({
        nodes: nodes.map(n => ({
            id: n.id,
            parentId: n.parent_id,
            side: n.side,
            name: n.name,
            role: n.role,
            pointsLeft: n.points_left,
            pointsRight: n.points_right,
            volume: n.volume
        })),
        stats: {
            leftPoints: root.points_left,
            rightPoints: root.points_right,
            totalVolume
        }
    });
}

module.exports = { getNetwork };
