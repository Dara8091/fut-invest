const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const {
    generateDepositAddress, handleWebhook, getDepositStatus, quoteWithdrawal, exportCSV,
    getBankTransferInfo, requestCardDeposit, getDepositMethods
} = require('../controllers/paymentController');

const router = Router();

router.get('/methods', authenticate, getDepositMethods);
router.post('/deposit/address', authenticate, asyncHandler(generateDepositAddress));
router.get('/deposit/:transactionId/status', authenticate, getDepositStatus);
router.get('/deposit/bank-info', authenticate, getBankTransferInfo);
router.post('/deposit/card', authenticate, requestCardDeposit);
router.post('/webhook', asyncHandler(handleWebhook));
router.post('/quote', authenticate, quoteWithdrawal);
router.get('/export/csv', authenticate, exportCSV);

module.exports = router;
