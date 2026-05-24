// ============================================
// Wallet Controller (with Balance Lock + Withdrawal Queue)
// ============================================
const db = require('../config/database');
const logger = require('../config/logger');
const { auditLog } = require('../middleware/audit');

const ASSET_NETWORK_MAP = {
    BTC: { asset: 'BTC', network: 'BTC' },
    USDT_TRC20: { asset: 'USDT', network: 'TRC20' },
    USDT_ERC20: { asset: 'USDT', network: 'ERC20' },
};

const ASSET_REGEX = {
    BTC: /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{25,39})$/,
    USDT_TRC20: /^T[A-Za-y0-9]{33}$/,
    USDT_ERC20: /^0x[a-fA-F0-9]{40}$/,
};

/* unused
function getTransaction() {
    return db.transaction(() => {});
}
*/

function withdraw(req, res) {
    const userId = req.user.userId;
    const { asset, address, amount } = req.body;

    if (!asset || !address || !amount) {
        return res.status(400).json({ error: 'Activo, dirección y monto requeridos' });
    }

    const regex = ASSET_REGEX[asset];
    if (!regex) return res.status(400).json({ error: 'Activo no soportado' });
    if (!regex.test(address)) return res.status(400).json({ error: 'Dirección inválida' });

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ error: 'Monto inválido' });

    const networkInfo = ASSET_NETWORK_MAP[asset];
    const feeCfg = db.prepare(
        'SELECT * FROM fee_config WHERE asset = ? AND network = ? AND active = 1'
    ).get(networkInfo.asset, networkInfo.network);

    const minWithdrawal = feeCfg?.min_withdrawal || parseFloat(process.env.MIN_WITHDRAWAL || 10);
    if (parsedAmount < minWithdrawal) {
        return res.status(400).json({ error: `El monto mínimo es $${minWithdrawal}` });
    }

    const maxDaily = parseFloat(process.env.MAX_WITHDRAWAL_PER_DAY || 50000);
    const todayTotal = db.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'withdraw' AND date(created_at) = date('now')"
    ).get(userId);
    if (todayTotal.total + parsedAmount > maxDaily) {
        return res.status(400).json({ error: `Límite diario excedido (máximo $${maxDaily})` });
    }

    // KYC check
    const user = db.prepare('SELECT kyc_status FROM users WHERE id = ?').get(userId);
    if (user?.kyc_status !== 'approved') {
        return res.status(403).json({ error: 'KYC requerido para realizar retiros' });
    }

    const fee = feeCfg?.withdrawal_fee || 0;
    const netAmount = parsedAmount - fee;

    // BEGIN IMMEDIATE transaction (balance lock)
    const withdrawalTx = db.transaction(() => {
        const account = db.prepare('SELECT balance FROM accounts WHERE user_id = ?').get(userId);
        if (!account || account.balance < parsedAmount) {
            throw new Error('Fondos insuficientes');
        }

        // Create transaction record
        const txResult = db.prepare(
            `INSERT INTO transactions (user_id, type, asset, amount, fee, status, wallet_address, metadata)
             VALUES (?, 'withdraw', ?, ?, ?, 'pending', ?, ?)`
        ).run(userId, asset, parsedAmount, fee, address, JSON.stringify({ requestedAt: new Date().toISOString() }));

        // Create withdrawal queue entry
        const queueResult = db.prepare(
            `INSERT INTO withdrawal_queue (user_id, transaction_id, asset, amount, address, fee, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`
        ).run(userId, txResult.lastInsertRowid, asset, netAmount, address, fee);

        // Deduct balance (includes fee)
        db.prepare(
            'UPDATE accounts SET balance = balance - ?, updated_at = datetime(\'now\') WHERE user_id = ?'
        ).run(parsedAmount, userId);

        auditLog(userId, 'withdrawal_requested', 'withdrawal_queue', queueResult.lastInsertRowid,
            null, { amount: parsedAmount, fee, netAmount, asset, address }, null, null);
    });

    try {
        withdrawalTx();
        res.json({
            success: true,
            message: `Solicitud de retiro de $${parsedAmount} USD creada (comisión: $${fee}, neto: $${netAmount}). Pendiente de aprobación.`
        });
    } catch (err) {
        if (err.message === 'Fondos insuficientes') {
            return res.status(400).json({ error: 'Fondos insuficientes' });
        }
        logger.error('Error en withdrawal:', err);
        res.status(500).json({ error: 'Error al procesar retiro' });
    }
}

function deposit(req, res) {
    const userId = req.user.userId;
    const { asset, amount } = req.body;

    if (!asset) return res.status(400).json({ error: 'Activo requerido' });

    const amountVal = amount ? parseFloat(amount) : 0;
    if (amount && (isNaN(amountVal) || amountVal <= 0)) {
        return res.status(400).json({ error: 'Monto inválido' });
    }

    // Generate unique address via payment provider
    const provider = require('../adapters/paymentProvider');
    provider.generateAddress(asset, userId).then(result => {
        const txResult = db.prepare(
            `INSERT INTO transactions (user_id, type, asset, amount, status, wallet_address, provider, metadata)
             VALUES (?, 'deposit', ?, ?, 'pending', ?, ?, ?)`
        ).run(userId, asset, amountVal, result.address, result.provider,
            JSON.stringify({ generatedAt: new Date().toISOString() }));

        db.prepare(
            'INSERT INTO payment_addresses (user_id, asset, address, provider) VALUES (?, ?, ?, ?)'
        ).run(userId, asset, result.address, result.provider);

        auditLog(userId, 'deposit_address_generated', 'payment_address', txResult.lastInsertRowid,
            null, { address: result.address, asset }, null, { req });

        res.json({
            success: true,
            address: result.address,
            asset,
            transactionId: txResult.lastInsertRowid,
            message: `Dirección de depósito generada para ${asset}. Envía los fondos a la dirección indicada.`
        });
    }).catch(err => {
        logger.error('Error generando dirección:', err);
        res.status(502).json({ error: 'Error del proveedor de pagos' });
    });
}

function getTransactions(req, res) {
    const userId = req.user.userId;
    const { limit = 20, offset = 0, type, status } = req.query;

    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [userId];

    if (type) { query += ' AND type = ?'; params.push(type); }
    if (status) { query += ' AND status = ?'; params.push(status); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const transactions = db.prepare(query).all(...params);
    res.json({ transactions, limit: parseInt(limit), offset: parseInt(offset) });
}

module.exports = { withdraw, deposit, getTransactions };
