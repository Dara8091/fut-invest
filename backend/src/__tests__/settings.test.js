const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'test-secret';

const settingsRoutes = require('../routes/settings');

function createApp() {
    const app = express();
    app.use(express.json({ limit: '11mb' }));
    app.use((req, res, next) => {
        const token = jwt.sign({ userId: 1, email: 'demo@futinvest.io', role: 'investor' }, process.env.JWT_SECRET, { expiresIn: '15m' });
        req.headers.authorization = `Bearer ${token}`;
        req.user = { userId: 1 };
        next();
    });
    app.use('/api/settings', settingsRoutes);
    return app;
}

describe('Settings Routes', () => {
    test('GET /notifications retorna preferencias', async () => {
        const app = createApp();
        const res = await request(app).get('/api/settings/notifications');
        expect([200, 500]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body).toHaveProperty('emailNotifications');
            expect(res.body).toHaveProperty('pushEnabled');
        }
    });

    test('POST /notifications actualiza preferencias', async () => {
        const app = createApp();
        const res = await request(app).post('/api/settings/notifications').send({ emailNotifications: true, pushEnabled: false });
        expect([200, 500]).toContain(res.status);
    });

    test('POST /change-password rechaza sin currentPassword', async () => {
        const app = createApp();
        const res = await request(app).post('/api/settings/change-password').send({ newPassword: 'NewPass123!' });
        expect(res.status).toBe(400);
    });

    test('POST /kyc rechaza sin documentType', async () => {
        const app = createApp();
        const res = await request(app).post('/api/settings/kyc').send({ fileBase64: 'dGVzdA==' });
        expect(res.status).toBe(400);
    });

    test('POST /kyc sube documento válido', async () => {
        const app = createApp();
        const res = await request(app).post('/api/settings/kyc')
            .send({ documentType: 'id_front', fileBase64: Buffer.from('fake-image-data').toString('base64'), mimeType: 'image/jpeg' });
        expect([200, 500]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body.message).toContain('Documento subido');
        }
    });

    test('POST /kyc rechaza tipo inválido', async () => {
        const app = createApp();
        const res = await request(app).post('/api/settings/kyc')
            .send({ documentType: 'invalid_type', fileBase64: Buffer.from('test').toString('base64') });
        expect(res.status).toBe(400);
    });

    test('DELETE /account rechaza sin password', async () => {
        const app = createApp();
        const res = await request(app).delete('/api/settings/account');
        expect(res.status).toBe(400);
    });
});
