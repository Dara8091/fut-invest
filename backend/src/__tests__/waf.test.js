const { wafMiddleware } = require('../middleware/waf');

function mockReq(url, body, headers = {}) {
    return {
        ip: '192.168.1.1',
        connection: { remoteAddress: '192.168.1.1' },
        url,
        body,
        headers: { 'user-agent': 'Mozilla/5.0', ...headers },
        method: 'POST',
    };
}

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('WAF Middleware', () => {
    beforeEach(() => {
        delete process.env.BLOCKED_COUNTRIES;
        delete process.env.BLOCKED_IPS;
    });

    test('permite petición normal', () => {
        const req = mockReq('/api/auth/login', { email: 'test@test.com', password: 'hello123' });
        const res = mockRes();
        const next = jest.fn();
        wafMiddleware(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('bloquea SQL injection en body', () => {
        const req = mockReq('/api/auth/login', { email: "test'; DROP TABLE users; --" });
        const res = mockRes();
        const next = jest.fn();
        wafMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('bloquea XSS en body', () => {
        const req = mockReq('/api/auth/login', { comment: '<script>alert(1)</script>' });
        const res = mockRes();
        const next = jest.fn();
        wafMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('bloquea path traversal en URL', () => {
        const req = mockReq('/api/../../etc/passwd', {});
        const res = mockRes();
        const next = jest.fn();
        wafMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('bloquea body demasiado grande', () => {
        const largeBody = { data: 'x'.repeat(2 * 1024 * 1024) };
        const req = mockReq('/api/test', largeBody);
        const res = mockRes();
        const next = jest.fn();
        wafMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(413);
    });

    test('bloquea IP en blacklist', () => {
        process.env.BLOCKED_IPS = '192.168.1.1';
        const req = mockReq('/api/test', {});
        const res = mockRes();
        const next = jest.fn();
        wafMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('bloquea comandos en body', () => {
        const req = mockReq('/api/test', { cmd: 'cat /etc/passwd | bash' });
        const res = mockRes();
        const next = jest.fn();
        wafMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('bloquea eval en body', () => {
        const req = mockReq('/api/test', { code: 'eval(someCode)' });
        const res = mockRes();
        const next = jest.fn();
        wafMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
});
