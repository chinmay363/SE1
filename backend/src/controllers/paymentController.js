const paymentService = require('../services/paymentService');
const { PaymentError } = paymentService;
const { generateReceipt } = require('../utils/pdfGenerator');

// ============================================================================
// CONTROLLER HELPER METHODS
// ============================================================================

/**
 * Standardized success response
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Standardized error response
 */
const errorResponse = (res, error, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
};

// ============================================================================
// PAYMENT CONTROLLER CLASS
// ============================================================================

class PaymentController {
  /**
   * Validate create payment request
   */
  validateCreatePaymentRequest(req) {
    const { sessionId, paymentMethod } = req.body;
    const errors = [];

    if (!sessionId) {
      errors.push('sessionId is required');
    }

    if (!paymentMethod) {
      errors.push('paymentMethod is required');
    }

    if (errors.length > 0) {
      const error = new Error('Validation failed');
      error.code = 'VALIDATION_ERROR';
      error.details = errors;
      error.statusCode = 400;
      throw error;
    }
  }

  /**
   * Create payment with enhanced validation and error handling
   */
  async createPayment(req, res, next) {
    try {
      // Validate request
      this.validateCreatePaymentRequest(req);

      const { sessionId, paymentMethod } = req.body;

      const result = await paymentService.createPayment(sessionId, paymentMethod);

      return successResponse(res, result, 'Payment created successfully', 201);
    } catch (error) {
      if (error instanceof PaymentError) {
        return errorResponse(res, error, error.statusCode);
      }
      if (error.code === 'VALIDATION_ERROR') {
        return errorResponse(res, error, 400);
      }
      next(error);
    }
  }

  /**
   * Validate confirm payment request
   */
  validateConfirmPaymentRequest(req) {
    const { paymentId } = req.body;

    if (!paymentId) {
      const error = new Error('paymentId is required');
      error.code = 'VALIDATION_ERROR';
      error.statusCode = 400;
      throw error;
    }
  }

  /**
   * Confirm payment with enhanced validation and error handling
   */
  async confirmPayment(req, res, next) {
    try {
      // Validate request
      this.validateConfirmPaymentRequest(req);

      const { paymentId } = req.body;

      const result = await paymentService.confirmPayment(paymentId);

      return successResponse(res, result, 'Payment confirmed successfully');
    } catch (error) {
      if (error instanceof PaymentError) {
        return errorResponse(res, error, error.statusCode);
      }
      if (error.code === 'VALIDATION_ERROR') {
        return errorResponse(res, error, 400);
      }
      next(error);
    }
  }

  /**
   * Get payment details with validation
   */
  async getPaymentDetails(req, res, next) {
    try {
      const { paymentId } = req.params;

      if (!paymentId) {
        return errorResponse(res, { message: 'Payment ID is required', code: 'INVALID_PAYMENT_ID' }, 400);
      }

      const payment = await paymentService.getPaymentDetails(paymentId);

      if (!payment) {
        return errorResponse(res, { message: 'Payment not found', code: 'PAYMENT_NOT_FOUND' }, 404);
      }

      return successResponse(res, payment, 'Payment details retrieved successfully');
    } catch (error) {
      if (error instanceof PaymentError) {
        return errorResponse(res, error, error.statusCode);
      }
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
