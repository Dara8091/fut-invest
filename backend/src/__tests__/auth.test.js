const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret-key';
process.env.FRONTEND_URL = 'http://localhost:8000';

const db = require('../config/database');
const schema = require('fs').readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf-8');
db.exec(schema);

const hash = bcrypt.hashSync('Test123!', 10);
db.prepare('INSERT INTO users (email, password_hash, full_name, email_verified) VALUES (?, ?, ?, 1)').run('test@test.com', hash, 'Test User');
const user = db.prepare('SELECT id FROM users WHERE email = ?').get('test@test.com');
db.prepare('INSERT INTO accounts (user_id, balance) VALUES (?, 10000)').run(user.id);

const { register, login, me } = require('../controllers/authController');

function mockReq(overrides = {}) {
    return { body: {}, headers: {}, user: null, ...overrides };
}

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('POST /api/auth/register', () => {
    it('debería rechazar registro sin email', () => {
        const req = mockReq({ body: { password: '123456' } });
        const res = mockRes();
        register(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('debería rechazar registro sin password', () => {
        const req = mockReq({ body: { email: 'new@test.com' } });
        const res = mockRes();
        register(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debería registrar un nuevo usuario', () => {
        const req = mockReq({ body: { email: 'new@test.com', password: 'Test123!', fullName: 'Nuevo' } });
        const res = mockRes();
        register(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            user: expect.objectContaining({ email: 'new@test.com' })
        }));
    });

    it('debería manejar email ya verificado como duplicado', () => {
        const req = mockReq({ body: { email: 'test@test.com', password: 'Test123!' } });
        const res = mockRes();
        register(req, res);
        expect(res.status).toHaveBeenCalledWith(409);
    });
});

describe('POST /api/auth/login', () => {
    it('debería rechazar login sin credenciales', () => {
        const req = mockReq({ body: {} });
        const res = mockRes();
        login(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debería rechazar credenciales inválidas', () => {
        const req = mockReq({ body: { email: 'test@test.com', password: 'wrong' } });
        const res = mockRes();
        login(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('debería hacer login exitoso', () => {
        const userCheck = db.prepare('SELECT email, password_hash FROM users WHERE email = ?').get('test@test.com');
        expect(userCheck).toBeDefined();
        expect(bcrypt.compareSync('Test123!', userCheck.password_hash)).toBe(true);

        const req = mockReq({ body: { email: 'test@test.com', password: 'Test123!' } });
        const res = mockRes();
        login(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            user: expect.objectContaining({ email: 'test@test.com' })
        }));
    });
});

describe('GET /api/auth/me', () => {
    it('debería rechazar sin token', () => {
        const req = mockReq({ user: null });
        const res = mockRes();
        const next = jest.fn();
        require('../middleware/auth').authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('debería devolver perfil con token válido', () => {
        const token = jwt.sign({ userId: user.id, email: 'test@test.com' }, process.env.JWT_SECRET);
        const req = mockReq({ user: jwt.verify(token, process.env.JWT_SECRET) });
        const res = mockRes();
        me(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@test.com' }));
    });
});
