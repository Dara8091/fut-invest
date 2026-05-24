const db = require('../config/database');
const logger = require('../config/logger');
const provider = require('../adapters/paymentProvider');
const { sendNotification } = require('./notificationService');

const BATCH_SIZE = parseInt(process.env.WITHDRAWAL_BATCH_SIZE || 10);
const POLL_INTERVAL = parseInt(process.env.WITHDRAWAL_POLL_INTERVAL_MS || 30000);

let intervalHandle = null;

function processBatch() {
    const pending = db.prepare(
        `SELECT wq.*, u.email, u.full_name FROM withdrawal_queue wq
         JOIN users u ON u.id = wq.user_id
         WHERE wq.status = 'pending'
         ORDER BY wq.created_at ASC
         LIMIT ?`
    ).all(BATCH_SIZE);

    if (pending.length === 0) return;

    logger.info(`Procesando lote de ${pending.length} retiros pendientes`);

    for (const item of pending) {
        try {
            const result = provider.submitWithdrawal(item.asset, item.amount, item.address);

            if (result && result.txHash) {
                const updateTx = db.transaction(() => {
                    db.prepare(
                        `UPDATE withdrawal_queue SET status = 'processing', provider = ?, provider_tx_id = ?, processed_at = datetime('now') WHERE id = ?`
                    ).run(result.provider || provider.name, result.providerTxId || result.txHash, item.id);

                    db.prepare(
                        `UPDATE transactions SET status = 'processing', tx_hash = ?, provider = ?, provider_tx_id = ?, updated_at = datetime('now') WHERE id = ?`
                    ).run(result.txHash, provider.name, result.providerTxId, item.transaction_id);
                });

                updateTx();

                sendNotification(item.user_id, 'retiro_procesado', {
                    email: item.email,
                    amount: item.amount,
                    asset: item.asset,
                    txHash: result.txHash,
                    status: 'processing',
                });

                logger.info(`Retiro #${item.id} procesado automáticamente, tx: ${result.txHash}`);
            }
        } catch (err) {
            logger.error(`Error procesando retiro #${item.id}: ${err.message}`);

            db.prepare(
                `UPDATE withdrawal_queue SET status = 'failed', error_message = ?, processed_at = datetime('now') WHERE id = ?`
            ).run(err.message, item.id);

            db.prepare(
                `UPDATE transactions SET status = 'failed', updated_at = datetime('now') WHERE id = ?`
            ).run(item.transaction_id);

            sendNotification(item.user_id, 'retiro_fallido', {
                email: item.email,
                amount: item.amount,
                asset: item.asset,
                error: err.message,
                status: 'failed',
            });
        }
    }
}

function start() {
    if (intervalHandle) return;
    logger.info(`Withdrawal worker iniciado (intervalo: ${POLL_INTERVAL}ms, batch: ${BATCH_SIZE})`);
    processBatch();
    intervalHandle = setInterval(processBatch, POLL_INTERVAL);
}

function stop() {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
        logger.info('Withdrawal worker detenido');
    }
}

module.exports = { start, stop, processBatch };
