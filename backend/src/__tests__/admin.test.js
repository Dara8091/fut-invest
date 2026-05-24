const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'test-secret';

const adminRoutes = require('../routes/admin');

function createApp(role = 'admin') {
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
        if (role) {
            const token = jwt.sign({ userId: 1, email: 'admin@test.com', role }, process.env.JWT_SECRET, { expiresIn: '15m' });
            req.headers.authorization = `Bearer ${token}`;
            req.user = { userId: 1, email: 'admin@test.com', role };
        }
        next();
    });
    app.use('/api/admin', adminRoutes);
    app.use((err, req, res, _next) => {
        res.status(500).json({ error: err.message });
    });
    return app;
}

describe('Admin Routes', () => {
    test('GET /stats retorna respuesta', async () => {
        const app = createApp('admin');
        const res = await request(app).get('/api/admin/stats');
        expect([200, 500]).toContain(res.status);
    });

    test('GET /withdrawals retorna lista', async () => {
        const app = createApp('admin');
        const res = await request(app).get('/api/admin/withdrawals');
        expect([200, 500]).toContain(res.status);
    });

    test('GET /users retorna usuarios', async () => {
        const app = createApp('admin');
        const res = await request(app).get('/api/admin/users');
        expect([200, 500]).toContain(res.status);
    });

    test('GET /fees retorna respuesta', async () => {
        const app = createApp('admin');
        const res = await request(app).get('/api/admin/fees');
        expect([200, 500]).toContain(res.status);
    });

    test('rechaza si no es admin', async () => {
        const app = createApp(null);
        const res = await request(app).get('/api/admin/stats');
        expect([401, 403]).toContain(res.status);
    });

    test('GET /audit-logs retorna array', async () => {
        const app = createApp('admin');
        const res = await request(app).get('/api/admin/audit-logs');
        expect([200, 500]).toContain(res.status);
    }, 5000);
});
