const db = require('../config/database');
const { listCurrencies } = require('../config/currencies');

function getDashboard(req, res) {
    const userId = req.user.userId;

    const account = db.prepare('SELECT * FROM accounts WHERE user_id = ?').get(userId);
    if (!account) {
        return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    const contracts = db.prepare('SELECT * FROM contracts WHERE user_id = ? AND status = ?').all(userId, 'active');

    const roiHistory = db.prepare(
        'SELECT rate, gain, date FROM roi_history WHERE user_id = ? ORDER BY date DESC LIMIT 5'
    ).all(userId);

    const user = db.prepare('SELECT tier, full_name FROM users WHERE id = ?').get(userId);

    // Multi-currency balances
    const balancesRaw = db.prepare(
        "SELECT asset, SUM(CASE WHEN type IN ('deposit','roi_payout') THEN amount WHEN type='withdraw' THEN -amount ELSE 0 END) as balance FROM transactions WHERE user_id = ? AND status = 'completed' GROUP BY asset"
    ).all(userId);

    const currencies = listCurrencies();
    const balances = currencies.map(c => {
        const match = balancesRaw.find(b => b.asset === c.code);
        return { code: c.code, name: c.name, symbol: c.symbol, decimals: c.decimals, balance: match ? match.balance : 0, networks: c.networks };
    });

    res.json({
        balance: account.balance,
        accumulatedEarnings: account.accumulated_earnings,
        dailyRoi: account.daily_roi,
        tier: user.tier,
        fullName: user.full_name,
        activeCapital: contracts.reduce((sum, c) => sum + c.amount, 0),
        contracts: contracts.map(c => ({
            ref: c.contract_ref,
            amount: c.amount,
            tier: c.tier,
            roiMin: c.roi_range_min,
            roiMax: c.roi_range_max,
            harvested: c.harvested,
            harvestTarget: c.harvest_target,
            progress: (c.harvested / c.harvest_target) * 100
        })),
        roiHistory,
        balances,
        currencies,
    });
}

module.exports = { getDashboard };
