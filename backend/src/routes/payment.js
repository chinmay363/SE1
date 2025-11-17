const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { createPaymentValidation, confirmPaymentValidation } = require('../middleware/validation');

router.post('/create', createPaymentValidation, paymentController.createPayment);
router.post('/confirm', confirmPaymentValidation, paymentController.confirmPayment);
router.get('/:paymentId', paymentController.getPaymentDetails);
router.get('/:transactionId/receipt', paymentController.generateReceipt);
router.get('/:transactionId/receipt/data', paymentController.getReceiptData);

module.exports = router;
