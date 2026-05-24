// ============================================
// Admin Controller (pending withdrawals, approve/reject)
// ============================================
const db = require('../config/database');
const logger = require('../config/logger');
const provider = require('../adapters/paymentProvider');
const { auditLog } = require('../middleware/audit');

// Solo admin/superadmin
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });
    }
    next();
}

function getPendingWithdrawals(req, res) {
    const { limit = 20, offset = 0 } = req.query;
    const items = db.prepare(
        `SELECT wq.*, u.email, u.full_name FROM withdrawal_queue wq
         JOIN users u ON u.id = wq.user_id
         WHERE wq.status = 'pending'
         ORDER BY wq.created_at ASC LIMIT ? OFFSET ?`
    ).all(parseInt(limit), parseInt(offset));

    const total = db.prepare(
        "SELECT COUNT(*) as c FROM withdrawal_queue WHERE status = 'pending'"
    ).get().c;

    res.json({ withdrawals: items, total, limit: parseInt(limit), offset: parseInt(offset) });
}

function getAllWithdrawals(req, res) {
    const { status, limit = 50, offset = 0 } = req.query;
    let query = `SELECT wq.*, u.email, u.full_name FROM withdrawal_queue wq JOIN users u ON u.id = wq.user_id`;
    let countQuery = `SELECT COUNT(*) as c FROM withdrawal_queue wq JOIN users u ON u.id = wq.user_id`;
    const params = [];
    const countParams = [];

    if (status) {
        const clause = ` WHERE wq.status = ?`;
        query += clause;
        countQuery += clause;
        params.push(status);
        countParams.push(status);
    }
    query += ` ORDER BY wq.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const items = db.prepare(query).all(...params);
    const total = db.prepare(countQuery).get(...countParams).c;
    res.json({ withdrawals: items, total, limit: parseInt(limit), offset: parseInt(offset) });
}

async function approveWithdrawal(req, res) {
    const { id } = req.params;
    const adminId = req.user.userId;

    const item = db.prepare('SELECT * FROM withdrawal_queue WHERE id = ? AND status = ?').get(id, 'pending');
    if (!item) {
        return res.status(404).json({ error: 'Retiro no encontrado o ya procesado' });
    }

    try {
        const result = await provider.submitWithdrawal(item.asset, item.amount, item.address);

        const updateTx = db.transaction(() => {
            db.prepare(
                `UPDATE withdrawal_queue SET status = 'processing', provider = ?, provider_tx_id = ?, approved_by = ?, approved_at = datetime('now') WHERE id = ?`
            ).run(result.provider || provider.name, result.providerTxId || result.txHash, adminId, id);

            db.prepare(
                `UPDATE transactions SET status = 'processing', tx_hash = ?, provider = ?, provider_tx_id = ?, updated_at = datetime('now') WHERE id = ?`
            ).run(result.txHash, provider.name, result.providerTxId, item.transaction_id);

            db.prepare(
                'UPDATE accounts SET balance = balance - ?, updated_at = datetime(\'now\') WHERE user_id = ?'
            ).run(item.amount, item.user_id);
        });

        updateTx();

        auditLog(adminId, 'withdrawal_approved', 'withdrawal_queue', id,
            { status: 'pending' }, { status: 'processing', providerTxId: result.txHash }, null, req);

        logger.info(`Retiro #${id} aprobado por admin #${adminId}, tx: ${result.txHash}`);
        res.json({ success: true, message: 'Retiro aprobado y enviado al proveedor', txHash: result.txHash });

    } catch (err) {
        logger.error(`Error aprobando retiro #${id}:`, err);
        res.status(502).json({ error: `Error del proveedor: ${err.message}` });
    }
}

function rejectWithdrawal(req, res) {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;

    const item = db.prepare('SELECT * FROM withdrawal_queue WHERE id = ? AND status = ?').get(id, 'pending');
    if (!item) {
        return res.status(404).json({ error: 'Retiro no encontrado o ya procesado' });
    }

    db.transaction(() => {
        db.prepare(
            `UPDATE withdrawal_queue SET status = 'cancelled', error_message = ?, approved_by = ?, approved_at = datetime('now') WHERE id = ?`
        ).run(reason || 'Rechazado por administrador', adminId, id);

        db.prepare(
            `UPDATE transactions SET status = 'cancelled', metadata = json_set(COALESCE(metadata, '{}'), '$.rejection_reason', ?), updated_at = datetime('now') WHERE id = ?`
        ).run(reason || 'Rechazado por administrador', item.transaction_id);
    })();

    auditLog(adminId, 'withdrawal_rejected', 'withdrawal_queue', id,
        { status: 'pending' }, { status: 'cancelled', reason }, null, req);

    res.json({ success: true, message: 'Retiro rechazado' });
}

function getFeeConfig(req, res) {
    const configs = db.prepare('SELECT * FROM fee_config WHERE active = 1').all();
    res.json({ feeConfigs: configs });
}

function updateFeeConfig(req, res) {
    const { id } = req.params;
    const { withdrawal_fee, deposit_fee, min_withdrawal, max_withdrawal, confirmations } = req.body;

    const old = db.prepare('SELECT * FROM fee_config WHERE id = ?').get(id);
    if (!old) return res.status(404).json({ error: 'Configuración no encontrada' });

    db.prepare(
        `UPDATE fee_config SET withdrawal_fee = COALESCE(?, withdrawal_fee), deposit_fee = COALESCE(?, deposit_fee),
         min_withdrawal = COALESCE(?, min_withdrawal), max_withdrawal = COALESCE(?, max_withdrawal),
         confirmations = COALESCE(?, confirmations), updated_at = datetime('now') WHERE id = ?`
    ).run(withdrawal_fee, deposit_fee, min_withdrawal, max_withdrawal, confirmations, id);

    auditLog(req.user.userId, 'fee_config_updated', 'fee_config', id, old, req.body, null, req);
    res.json({ success: true, message: 'Configuración actualizada' });
}

function getUserList(req, res) {
    const { limit = 50, offset = 0 } = req.query;
    const users = db.prepare(
        'SELECT id, email, full_name, role, tier, kyc_status, totp_enabled, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(parseInt(limit), parseInt(offset));

    const total = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    res.json({ users, total, limit: parseInt(limit), offset: parseInt(offset) });
}

function getDashboardStats(req, res) {
    const stats = {
        totalUsers: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
        totalDeposits: db.prepare("SELECT COALESCE(SUM(amount),0) as c FROM transactions WHERE type = 'deposit' AND status = 'completed'").get().c,
        totalWithdrawals: db.prepare("SELECT COALESCE(SUM(amount),0) as c FROM transactions WHERE type = 'withdraw' AND status = 'completed'").get().c,
        pendingWithdrawals: db.prepare("SELECT COUNT(*) as c FROM withdrawal_queue WHERE status = 'pending'").get().c,
        totalFees: db.prepare("SELECT COALESCE(SUM(fee),0) as c FROM transactions WHERE status = 'completed'").get().c,
        totalUsersToday: db.prepare("SELECT COUNT(*) as c FROM users WHERE date(created_at) = date('now')").get().c,
    };
    res.json({ stats });
}

module.exports = { requireAdmin, getPendingWithdrawals, getAllWithdrawals, approveWithdrawal, rejectWithdrawal, getFeeConfig, updateFeeConfig, getUserList, getDashboardStats };
