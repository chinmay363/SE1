const paymentService = require('../services/paymentService');
const { generateReceipt } = require('../utils/pdfGenerator');

class PaymentController {
  async createPayment(req, res, next) {
    try {
      const { sessionId, paymentMethod } = req.body;

      const result = await paymentService.createPayment(sessionId, paymentMethod);

      res.json({
        success: true,
        message: 'Payment created',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmPayment(req, res, next) {
    try {
      const { paymentId } = req.body;

      const result = await paymentService.confirmPayment(paymentId);

      res.json({
        success: true,
        message: 'Payment confirmed',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentDetails(req, res, next) {
    try {
      const { paymentId } = req.params;

      const payment = await paymentService.getPaymentDetails(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  async generateReceipt(req, res, next) {
    try {
      const { transactionId } = req.params;

      const payment = await paymentService.getPaymentDetails(transactionId);

      if (!payment || !payment.transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const receiptData = {
        receiptNumber: payment.transaction.receiptNumber,
        transactionDate: payment.transaction.transactionDate,
        licensePlate: payment.transaction.session.vehicle.licensePlate,
        spaceNumber: payment.transaction.session.space.spaceNumber,
        entryTime: payment.transaction.session.entryTime,
        exitTime: payment.transaction.session.exitTime,
        durationMinutes: payment.transaction.session.durationMinutes,
        amount: payment.transaction.amount,
        paymentMethod: payment.transaction.paymentMethod,
        status: payment.transaction.status
      };

      const pdfBuffer = await generateReceipt(receiptData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=receipt-${receiptData.receiptNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  async getReceiptData(req, res, next) {
    try {
      const { transactionId } = req.params;

      const payment = await paymentService.getPaymentDetails(transactionId);

      if (!payment || !payment.transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const receiptData = {
        receiptNumber: payment.transaction.receiptNumber,
        transactionDate: payment.transaction.transactionDate,
        licensePlate: payment.transaction.session.vehicle.licensePlate,
        spaceNumber: payment.transaction.session.space.spaceNumber,
        entryTime: payment.transaction.session.entryTime,
        exitTime: payment.transaction.session.exitTime,
        durationMinutes: payment.transaction.session.durationMinutes,
        amount: payment.transaction.amount,
        paymentMethod: payment.transaction.paymentMethod,
        status: payment.transaction.status
      };

      res.json({
        success: true,
        data: receiptData
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
