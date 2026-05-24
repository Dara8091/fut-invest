const { Router } = require('express');

const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const walletRoutes = require('./wallet');
const securityRoutes = require('./security');
const networkRoutes = require('./network');
const paymentRoutes = require('./payment');
const adminRoutes = require('./admin');
const onboardingRoutes = require('./onboarding');
const settingsRoutes = require('./settings');
const referralsRoutes = require('./referrals');
const metricsRoutes = require('./metrics');

const { apiLimiter, userLimiter, depositLimiter, withdrawLimiter, webhookLimiter, forgotPasswordLimiter, resetPasswordLimiter } = require('../middleware/rateLimit');
const { captchaRequired } = require('../middleware/captcha');
const { cacheMiddleware } = require('../middleware/cache');

const router = Router();

router.use(apiLimiter);

router.use('/auth', captchaRequired, authRoutes);
router.use('/auth/forgot-password', forgotPasswordLimiter);
router.use('/auth/reset-password', resetPasswordLimiter);
router.use('/dashboard', cacheMiddleware(30), dashboardRoutes);
router.use('/wallet', userLimiter, walletRoutes);
router.use('/wallet/withdraw', withdrawLimiter);
router.use('/security', userLimiter, securityRoutes);
router.use('/network', networkRoutes);
router.use('/payments/deposit', depositLimiter);
router.use('/payments/webhook', webhookLimiter);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/settings', settingsRoutes);
router.use('/referrals', cacheMiddleware(60), referralsRoutes);
router.use('/metrics', metricsRoutes);

module.exports = router;
