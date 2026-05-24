const path = require('path');
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret-key';
process.env.FRONTEND_URL = 'http://localhost:8000';

const db = require('../config/database');
const schema = require('fs').readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf-8');
db.exec(schema);

// Seed user + account
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('Test123!', 10);
db.prepare('INSERT INTO users (email, password_hash, full_name, email_verified, kyc_status) VALUES (?, ?, ?, 1, ?)').run('pay@test.com', hash, 'Pay User', 'approved');
const user = db.prepare('SELECT id FROM users WHERE email = ?').get('pay@test.com');
db.prepare('INSERT INTO accounts (user_id, balance) VALUES (?, 50000)').run(user.id);

// Seed fee config
const feeInsert = db.prepare('INSERT INTO fee_config (asset, network, withdrawal_fee, deposit_fee, min_withdrawal, max_withdrawal, confirmations) VALUES (?, ?, ?, ?, ?, ?, ?)');
feeInsert.run('USDT', 'TRC20', 2.0, 0, 10, 50000, 1);
feeInsert.run('USDT', 'ERC20', 8.0, 0, 20, 50000, 12);

const { generateDepositAddress, getDepositStatus, quoteWithdrawal, exportCSV } = require('../controllers/paymentController');
const { withdraw, getTransactions } = require('../controllers/walletController');
const { getAllWithdrawals } = require('../controllers/adminController');

function mockReq(overrides = {}) {
    return { body: {}, headers: {}, user: { userId: user.id, role: 'investor' }, params: {}, query: {}, ...overrides };
}
function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
}

describe('Payment Controller', () => {
    test('quoteWithdrawal retorna fee y netAmount', () => {
        const req = mockReq({ body: { asset: 'USDT', network: 'TRC20', amount: 100 } });
        const res = mockRes();
        quoteWithdrawal(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            fee: 2.0,
            netAmount: 98,
            grossAmount: 100,
        }));
    });

    test('quoteWithdrawal rechaza monto mínimo', () => {
        const req = mockReq({ body: { asset: 'USDT', network: 'TRC20', amount: 5 } });
        const res = mockRes();
        quoteWithdrawal(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('quoteWithdrawal rechaza red no soportada', () => {
        const req = mockReq({ body: { asset: 'BTC', network: 'TRC20', amount: 100 } });
        const res = mockRes();
        quoteWithdrawal(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('generateDepositAddress crea dirección', async () => {
        const req = mockReq({ body: { asset: 'USDT_TRC20', amount: 100 } });
        const res = mockRes();
        await generateDepositAddress(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            address: expect.any(String),
            asset: 'USDT_TRC20',
        }));
    });

    test('getDepositStatus retorna 404 para tx inexistente', () => {
        const req = mockReq({ params: { transactionId: 9999 } });
        const res = mockRes();
        getDepositStatus(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('exportCSV retorna CSV con header', () => {
        const req = mockReq();
        const res = mockRes();
        exportCSV(req, res);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Fecha,Tipo,Activo'));
    });
});

describe('Wallet Withdraw Flow', () => {
    test('withdraw rechaza activo no soportado', () => {
        const req = mockReq({ body: { asset: 'INVALID', address: '0x123', amount: 100 } });
        const res = mockRes();
        withdraw(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('withdraw rechaza dirección inválida', () => {
        const req = mockReq({ body: { asset: 'USDT_TRC20', address: 'invalid', amount: 100 } });
        const res = mockRes();
        withdraw(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('withdraw crea withdrawal queue', () => {
        const req = mockReq({ body: { asset: 'USDT_TRC20', address: 'TGxAbCdEfGhIjKlMnOpQrStUvWxYx12345', amount: 100 } });
        const res = mockRes();
        withdraw(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('getTransactions retorna array', () => {
        const req = mockReq({ query: {} });
        const res = mockRes();
        getTransactions(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            transactions: expect.any(Array),
        }));
    });
});

describe('Admin Withdrawal Flow', () => {
    test('getAllWithdrawals retorna withdrawals', () => {
        const req = mockReq({ user: { userId: user.id, role: 'admin' }, query: {} });
        const res = mockRes();
        getAllWithdrawals(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            withdrawals: expect.any(Array),
        }));
    });
});
