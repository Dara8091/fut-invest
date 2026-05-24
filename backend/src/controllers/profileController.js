const db = require('../config/database');
const logger = require('../config/logger');

function getProfile(req, res) {
    const userId = req.user.userId;

    const user = db.prepare('SELECT id, email, full_name, role, tier, kyc_status, totp_enabled, email_verified, email_notifications, push_enabled, referral_code, referred_by, created_at, updated_at FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const account = db.prepare('SELECT balance, accumulated_earnings, daily_roi FROM accounts WHERE user_id = ?').get(userId) || { balance: 0, accumulated_earnings: 0, daily_roi: 1.85 };

    const activeContracts = db.prepare("SELECT COUNT(*) as count FROM contracts WHERE user_id = ? AND status = 'active'").get(userId);
    const recentTx = db.prepare("SELECT id, type, asset, amount, fee, status, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5").all(userId);
    const pendingWithdrawals = db.prepare("SELECT COUNT(*) as count FROM withdrawal_queue WHERE user_id = ? AND status = 'pending'").get(userId);

    res.json({
        user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            tier: user.tier,
            kycStatus: user.kyc_status,
            totpEnabled: !!user.totp_enabled,
            emailVerified: !!user.email_verified,
            emailNotifications: !!user.email_notifications,
            pushEnabled: !!user.push_enabled,
            referralCode: user.referral_code,
            referredBy: user.referred_by,
            memberSince: user.created_at,
        },
        account: {
            balance: account.balance,
            accumulatedEarnings: account.accumulated_earnings,
            dailyRoi: account.daily_roi,
        },
        activeContracts: activeContracts.count,
        pendingWithdrawals: pendingWithdrawals.count,
        recentTransactions: recentTx,
        depositMethods: [
            { id: 'crypto', name: 'Criptomonedas', icon: 'currency_bitcoin', currencies: ['USDT_TRC20', 'USDT_ERC20', 'BTC'], enabled: true },
            { id: 'bank', name: 'Transferencia Bancaria', icon: 'account_balance', currencies: ['USD', 'EUR'], enabled: true, info: 'Banco: FutInvest Inc.\nCuenta: 1234-5678-9012-3456\nSWIFT: FUTIUS42\nBeneficiario: FutInvest LLC' },
            { id: 'card', name: 'Tarjeta de Crédito/Débito', icon: 'credit_card', currencies: ['USD', 'EUR'], enabled: true, info: 'Monto mínimo: $50\nComisión: 2.9% + $0.30\nProcesado por Stripe' },
        ],
        withdrawalMethods: [
            { id: 'crypto', name: 'Criptomonedas', icon: 'currency_bitcoin', enabled: true, minAmount: 10, fee: 'Según red' },
            { id: 'bank', name: 'Transferencia Bancaria', icon: 'account_balance', enabled: true, minAmount: 100, fee: '$5.00', processingTime: '1-3 días hábiles' },
        ],
    });
}

function updateProfile(req, res) {
    const userId = req.user.userId;
    const { fullName, emailNotifications, pushEnabled } = req.body;

    const updates = [];
    const params = [];
    if (fullName !== undefined) { updates.push('full_name = ?'); params.push(fullName); }
    if (emailNotifications !== undefined) { updates.push('email_notifications = ?'); params.push(emailNotifications ? 1 : 0); }
    if (pushEnabled !== undefined) { updates.push('push_enabled = ?'); params.push(pushEnabled ? 1 : 0); }

    if (updates.length === 0) return res.status(400).json({ error: 'Sin campos para actualizar' });

    updates.push("updated_at = datetime('now')");
    params.push(userId);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    res.json({ success: true, message: 'Perfil actualizado' });
}

module.exports = { getProfile, updateProfile };
