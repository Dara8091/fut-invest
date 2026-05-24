const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const {
    generateDepositAddress, handleWebhook, getDepositStatus, quoteWithdrawal, exportCSV
} = require('../controllers/paymentController');

const router = Router();

router.post('/deposit/address', authenticate, asyncHandler(generateDepositAddress));
router.get('/deposit/:transactionId/status', authenticate, getDepositStatus);
router.post('/webhook', asyncHandler(handleWebhook));
router.post('/quote', authenticate, quoteWithdrawal);
router.get('/export/csv', authenticate, exportCSV);

module.exports = router;
