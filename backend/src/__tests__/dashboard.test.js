const path = require('path');

process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret-key';

const db = require('../config/database');
const schema = require('fs').readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf-8');
db.exec(schema);

const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('Demo123!', 10);
db.prepare('INSERT INTO users (email, password_hash, full_name, tier) VALUES (?, ?, ?, ?)').run('demo@test.com', hash, 'Demo', 'black');
const user = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@test.com');
db.prepare('INSERT INTO accounts (user_id, balance, accumulated_earnings, daily_roi) VALUES (?, 12450.75, 342.10, 1.85)').run(user.id);

const { getDashboard } = require('../controllers/dashboardController');

function mockReq(overrides = {}) {
    return { body: {}, headers: {}, user: { userId: user.id }, ...overrides };
}

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('GET /api/dashboard', () => {
    it('debería devolver datos del dashboard', () => {
        const req = mockReq();
        const res = mockRes();
        getDashboard(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            balance: 12450.75,
            accumulatedEarnings: 342.10,
            dailyRoi: 1.85,
            tier: 'black',
        }));
    });

    it('debería incluir activeCapital', () => {
        const req = mockReq();
        const res = mockRes();
        getDashboard(req, res);
        const data = res.json.mock.calls[0][0];
        expect(data).toHaveProperty('activeCapital');
        expect(typeof data.activeCapital).toBe('number');
    });

    it('debería devolver roiHistory como array', () => {
        const req = mockReq();
        const res = mockRes();
        getDashboard(req, res);
        const data = res.json.mock.calls[0][0];
        expect(Array.isArray(data.roiHistory)).toBe(true);
    });
});
