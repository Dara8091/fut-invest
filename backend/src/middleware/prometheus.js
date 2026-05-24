const prometheus = require('prom-client');

const httpRequestCounter = new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total de requests HTTP',
    labelNames: ['method', 'endpoint', 'status'],
});

const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duración de requests HTTP',
    labelNames: ['method', 'endpoint', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

const activeUsersGauge = new prometheus.Gauge({
    name: 'futinvest_active_users',
    help: 'Usuarios activos conectados vía WebSocket',
});

const totalBalanceGauge = new prometheus.Gauge({
    name: 'futinvest_total_balance',
    help: 'Balance total de la plataforma',
});

const signupsCounter = new prometheus.Counter({
    name: 'futinvest_signups_total',
    help: 'Total de registros de usuarios',
});

const depositsCounter = new prometheus.Counter({
    name: 'futinvest_deposits_total',
    help: 'Total de depósitos',
    labelNames: ['asset'],
});

const withdrawalsCounter = new prometheus.Counter({
    name: 'futinvest_withdrawals_total',
    help: 'Total de retiros',
    labelNames: ['asset'],
});

const feesCounter = new prometheus.Counter({
    name: 'futinvest_fees_total',
    help: 'Total de comisiones generadas',
});

const roiGauge = new prometheus.Gauge({
    name: 'futinvest_roi_rate',
    help: 'Tasa de ROI actual',
    labelNames: ['user_id'],
});

function prometheusMiddleware(req, res, next) {
    const start = Date.now();
    const originalEnd = res.end.bind(res);

    res.end = function (...args) {
        const duration = (Date.now() - start) / 1000;
        const endpoint = req.route?.path || req.path;
        const status = res.statusCode;

        httpRequestCounter.inc({ method: req.method, endpoint, status });
        httpRequestDuration.observe({ method: req.method, endpoint, status }, duration);

        return originalEnd(...args);
    };
    next();
}

module.exports = {
    prometheusMiddleware,
    httpRequestCounter,
    httpRequestDuration,
    activeUsersGauge,
    totalBalanceGauge,
    signupsCounter,
    depositsCounter,
    withdrawalsCounter,
    feesCounter,
    roiGauge,
};
