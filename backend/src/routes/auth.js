const { Router } = require('express');
const {
    register, login, refresh, verifyEmail, resendVerification,
    forgotPassword, resetPassword, me
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerRules, loginRules, handleValidationErrors } = require('../middleware/validate');
const { forgotPasswordLimiter, resetPasswordLimiter } = require('../middleware/rateLimit');

const router = Router();

router.post('/register', registerRules, handleValidationErrors, register);
router.post('/login', loginRules, handleValidationErrors, login);
router.post('/refresh', refresh);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPassword);
router.get('/me', authenticate, me);

module.exports = router;
