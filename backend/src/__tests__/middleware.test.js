const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-key';

describe('Middleware: auth', () => {
    const { authenticate } = require('../middleware/auth');

    function mockReq(overrides = {}) {
        return { headers: {}, ...overrides };
    }

    function mockRes() {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    }

    it('debería rechazar petición sin header Authorization', () => {
        const req = mockReq();
        const res = mockRes();
        const next = jest.fn();
        authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('debería rechazar token inválido', () => {
        const req = mockReq({ headers: { authorization: 'Bearer token-malo' } });
        const res = mockRes();
        const next = jest.fn();
        authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('debería aceptar token válido', () => {
        const token = jwt.sign({ userId: 1, email: 'test@test.com' }, process.env.JWT_SECRET);
        const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
        const res = mockRes();
        const next = jest.fn();
        authenticate(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.user.userId).toBe(1);
    });
});

describe('Middleware: validate', () => {
    const { handleValidationErrors } = require('../middleware/validate');

    function mockReq(overrides = {}) {
        return { body: {}, ...overrides };
    }

    function mockRes() {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    }

    it('handleValidationErrors debería pasar si no hay errores', () => {
        const req = mockReq();
        const res = mockRes();
        const next = jest.fn();
        handleValidationErrors(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
