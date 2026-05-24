const db = require('../config/database');

const STEPS = ['step_welcome', 'step_profile', 'step_deposit', 'step_kyc', 'step_contract'];

function getProgress(req, res) {
    const userId = req.user.userId;
    let progress = db.prepare('SELECT * FROM onboarding_progress WHERE user_id = ?').get(userId);

    if (!progress) {
        db.prepare('INSERT INTO onboarding_progress (user_id) VALUES (?)').run(userId);
        progress = { step_welcome: 0, step_profile: 0, step_deposit: 0, step_kyc: 0, step_contract: 0, completed: 0 };
    }

    const completedSteps = STEPS.filter(s => progress[s]).length;
    const totalSteps = STEPS.length;

    res.json({
        progress: {
            welcome: !!progress.step_welcome,
            profile: !!progress.step_profile,
            deposit: !!progress.step_deposit,
            kyc: !!progress.step_kyc,
            contract: !!progress.step_contract,
        },
        completed: !!progress.completed,
        completedSteps,
        totalSteps,
        percentage: Math.round((completedSteps / totalSteps) * 100),
    });
}

function completeStep(req, res) {
    const { step } = req.body;
    if (!STEPS.includes(step)) {
        return res.status(400).json({ error: 'Paso inválido' });
    }

    db.prepare(
        `UPDATE onboarding_progress SET ${step} = 1, updated_at = datetime('now') WHERE user_id = ?`
    ).run(req.user.userId);

    const progress = db.prepare('SELECT * FROM onboarding_progress WHERE user_id = ?').get(req.user.userId);
    const allDone = STEPS.every(s => progress[s]);
    if (allDone && !progress.completed) {
        db.prepare(
            "UPDATE onboarding_progress SET completed = 1, completed_at = datetime('now'), updated_at = datetime('now') WHERE user_id = ?"
        ).run(req.user.userId);
    }

    res.json({ success: true, completed: allDone });
}

module.exports = { getProgress, completeStep };
