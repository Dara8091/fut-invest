const { body, validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Datos inválidos',
            details: errors.array().map(e => ({ field: e.path, message: e.msg })),
        });
    }
    next();
}

const registerRules = [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('fullName').optional().trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
];

const loginRules = [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('Contraseña requerida'),
];

const withdrawRules = [
    body('asset').isIn(['BTC', 'USDT (TRC20)', 'USDT (ERC20)']).withMessage('Activo no soportado'),
    body('address').notEmpty().withMessage('Dirección requerida'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
];

const depositRules = [
    body('asset').isIn(['BTC', 'USDT (TRC20)', 'USDT (ERC20)']).withMessage('Activo no soportado'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
];

module.exports = {
    handleValidationErrors,
    registerRules,
    loginRules,
    withdrawRules,
    depositRules,
};
