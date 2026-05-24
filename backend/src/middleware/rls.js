// RLS (Row Level Security) simulado a nivel aplicación
// Cada controlador debe filtrar por req.user.userId para garantizar
// que un usuario solo accede a sus propios datos.

function rls(req, res, next) {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    next();
}

module.exports = { rls };
