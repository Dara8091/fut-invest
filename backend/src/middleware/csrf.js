module.exports = function csrfOriginCheck(allowedOrigins) {
    return (req, res, next) => {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
        const origin = req.headers['origin'];
        const referer = req.headers['referer'];
        if (!origin && !referer) return next();
        const source = origin || referer;
        if (!allowedOrigins.some(o => source.startsWith(o))) {
            return res.status(403).json({ error: 'Origen no permitido' });
        }
        next();
    };
};