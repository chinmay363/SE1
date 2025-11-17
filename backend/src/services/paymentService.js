const { Transaction, Payment, ParkingSession, Vehicle, ParkingSpace, sequelize } = require('../models');
const { calculateParkingFee, generateReceiptNumber } = require('../utils/pricingCalculator');
const logger = require('../utils/logger');
const { SystemEvent } = require('../models');

// ============================================================================
// PAYMENT CONFIGURATION CONSTANTS
// ============================================================================

const PAYMENT_CONFIG = {
  SUPPORTED_METHODS: ['credit_card', 'debit_card', 'cash', 'mobile_wallet', 'upi'],
  PAYMENT_TIMEOUT_MS: 30000,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  PROCESSING_DELAY_MS: 1000
};

const PAYMENT_STATUS = {
  INITIATED: 'initiated',
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

class PaymentError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ============================================================================
// PAYMENT SERVICE CLASS
// ============================================================================

class PaymentService {
  /**
   * Validate payment method
   * @param {string} paymentMethod
   * @throws {PaymentError} If payment method is invalid
   */
  validatePaymentMethod(paymentMethod) {
    if (!paymentMethod || typeof paymentMethod !== 'string') {
      throw new PaymentError('Payment method is required', 'INVALID_PAYMENT_METHOD');
    }

    if (!PAYMENT_CONFIG.SUPPORTED_METHODS.includes(paymentMethod.toLowerCase())) {
      throw new PaymentError(
        `Unsupported payment method. Supported methods: ${PAYMENT_CONFIG.SUPPORTED_METHODS.join(', ')}`,
        'UNSUPPORTED_PAYMENT_METHOD'
      );
    }
  }

  /**
   * Validate session for payment
   * @param {Object} session
   * @throws {PaymentError} If session is invalid
   */
  validateSession(session) {
    if (!session) {
      throw new PaymentError('Parking session not found', 'SESSION_NOT_FOUND', 404);
    }

    if (session.status !== 'active') {
      throw new PaymentError(
        `Parking session is not active. Current status: ${session.status}`,
        'SESSION_NOT_ACTIVE'
      );
    }

    if (session.exitTime) {
      throw new PaymentError('Parking session already has exit time', 'SESSION_ALREADY_EXITED');
    }
  }
  /**
   * Create a payment transaction with validation and error handling
   * @param {string} sessionId
   * @param {string} paymentMethod
   * @returns {Promise<Object>}
   */
  async createPayment(sessionId, paymentMethod) {
    // Validate inputs
    if (!sessionId) {
      throw new PaymentError('Session ID is required', 'INVALID_SESSION_ID');
    }

    this.validatePaymentMethod(paymentMethod);

    const dbTransaction = await sequelize.transaction({
      isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    try {
      // Get parking session with lock to prevent race conditions
      const session = await ParkingSession.findByPk(sessionId, {
        include: [
          { association: 'vehicle' },
          { association: 'space' }
        ],
        lock: dbTransaction.LOCK.UPDATE,
        transaction: dbTransaction
      });

      // Validate session
      this.validateSession(session);

      // Calculate parking fee with error handling
      const exitTime = new Date();
      let feeCalculation;
      try {
        feeCalculation = calculateParkingFee(session.entryTime, exitTime);
      } catch (calcError) {
        throw new PaymentError(
          `Fee calculation failed: ${calcError.message}`,
          'FEE_CALCULATION_ERROR'
        );
      }

      const { amount, durationMinutes, appliedRules, breakdown } = feeCalculation;

      // Check if transaction already exists (idempotency)
      let transactionRecord = await Transaction.findOne({
        where: { sessionId },
        transaction: dbTransaction
      });

      if (transactionRecord && transactionRecord.status === TRANSACTION_STATUS.COMPLETED) {
        throw new PaymentError(
          'Payment already completed for this session',
          'PAYMENT_ALREADY_COMPLETED'
        );
      }

      if (!transactionRecord) {
        // Create new transaction
        transactionRecord = await Transaction.create({
          sessionId,
          amount,
          currency: 'USD',
          status: TRANSACTION_STATUS.PENDING,
          paymentMethod: paymentMethod.toLowerCase(),
          receiptNumber: generateReceiptNumber(),
          transactionDate: new Date()
        }, { transaction: dbTransaction });

        logger.info('Transaction created:', {
          transactionId: transactionRecord.id,
          sessionId,
          amount
        });
      }

      // Create payment record
      const payment = await Payment.create({
        transactionId: transactionRecord.id,
        amount,
        paymentMethod: paymentMethod.toLowerCase(),
        status: PAYMENT_STATUS.INITIATED,
        paymentDate: new Date(),
        metadata: {
          durationMinutes,
          appliedRules,
          breakdown,
          initiatedAt: new Date().toISOString()
        }
      }, { transaction: dbTransaction });

      await dbTransaction.commit();

      logger.info('Payment created successfully:', {
        sessionId,
        paymentId: payment.id,
        transactionId: transactionRecord.id,
        amount,
        paymentMethod
      });

      await this.logSystemEvent(
        'payment_created',
        'low',
        `Payment initiated for session ${sessionId}. Amount: $${amount}`
      );

      return {
        payment,
        transaction: transactionRecord,
        session,
        amount,
        durationMinutes,
        appliedRules,
        breakdown
      };
    } catch (error) {
      // Only rollback if transaction hasn't been finished yet
      if (!dbTransaction.finished) {
        await dbTransaction.rollback();
      }

      logger.error('Payment creation error:', {
        sessionId,
        paymentMethod,
        error: error.message,
        stack: error.stack
      });

      // Re-throw PaymentError as-is, wrap other errors
      if (error instanceof PaymentError) {
        throw error;
      }

      throw new PaymentError(
        `Failed to create payment: ${error.message}`,
        'PAYMENT_CREATION_FAILED',
        500
      );
    }
  }

  /**
   * Simulate payment gateway processing with retry logic
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>}
   */
  async processPaymentGateway(attempt = 1) {
    const processingDelay = PAYMENT_CONFIG.PROCESSING_DELAY_MS;

    // Simulate random payment gateway failures (10% failure rate for testing)
    const shouldFail = Math.random() < 0.1 && attempt < PAYMENT_CONFIG.MAX_RETRY_ATTEMPTS;

    await this.delay(processingDelay);

    if (shouldFail) {
      throw new Error('Payment gateway timeout');
    }

    return {
      success: true,
      gatewayRef: `PG-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Confirm payment with retry logic and comprehensive error handling
   * @param {string} paymentId
   * @returns {Promise<Object>}
   */
  async confirmPayment(paymentId) {
    // Validate input
    if (!paymentId) {
      throw new PaymentError('Payment ID is required', 'INVALID_PAYMENT_ID');
    }

    const dbTransaction = await sequelize.transaction({
      isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    });

    try {
      // Fetch payment with lock
      const payment = await Payment.findByPk(paymentId, {
        include: [{
          association: 'transaction',
          include: [{
            association: 'session',
            include: ['vehicle', 'space']
          }]
        }],
        lock: dbTransaction.LOCK.UPDATE,
        transaction: dbTransaction
      });

      if (!payment) {
        throw new PaymentError('Payment not found', 'PAYMENT_NOT_FOUND', 404);
      }

      if (payment.status === PAYMENT_STATUS.COMPLETED) {
        throw new PaymentError('Payment already completed', 'PAYMENT_ALREADY_COMPLETED');
      }

      if (payment.status === PAYMENT_STATUS.FAILED) {
        throw new PaymentError('Cannot confirm failed payment', 'PAYMENT_FAILED');
      }

      if (!payment.transaction) {
        throw new PaymentError('Transaction not found for payment', 'TRANSACTION_NOT_FOUND', 404);
      }

      // Process payment with retry logic
      let gatewayResponse;
      let lastError;

      for (let attempt = 1; attempt <= PAYMENT_CONFIG.MAX_RETRY_ATTEMPTS; attempt++) {
        try {
          gatewayResponse = await this.processPaymentGateway(attempt);
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error;
          logger.warn(`Payment processing attempt ${attempt} failed:`, {
            paymentId,
            error: error.message
          });

          if (attempt < PAYMENT_CONFIG.MAX_RETRY_ATTEMPTS) {
            await this.delay(PAYMENT_CONFIG.RETRY_DELAY_MS * attempt);
          }
        }
      }

      if (!gatewayResponse) {
        throw new PaymentError(
          `Payment processing failed after ${PAYMENT_CONFIG.MAX_RETRY_ATTEMPTS} attempts: ${lastError?.message}`,
          'PAYMENT_GATEWAY_ERROR',
          502
        );
      }

      // Update payment status
      await payment.update({
        status: PAYMENT_STATUS.COMPLETED,
        paymentGatewayRef: gatewayResponse.gatewayRef,
        metadata: {
          ...payment.metadata,
          completedAt: new Date().toISOString(),
          gatewayProcessedAt: gatewayResponse.processedAt,
          attempts: PAYMENT_CONFIG.MAX_RETRY_ATTEMPTS
        }
      }, { transaction: dbTransaction });

      // Update transaction status
      await payment.transaction.update({
        status: TRANSACTION_STATUS.COMPLETED
      }, { transaction: dbTransaction });

      // Update session with exit information
      const exitTime = new Date();
      const durationMinutes = Math.floor(
        (exitTime - new Date(payment.transaction.session.entryTime)) / (1000 * 60)
      );

      await payment.transaction.session.update({
        exitTime,
        durationMinutes,
        status: 'completed'
      }, { transaction: dbTransaction });

      // Release parking space
      await payment.transaction.session.space.update({
        status: 'available'
      }, { transaction: dbTransaction });

      await dbTransaction.commit();

      logger.info('Payment confirmed successfully:', {
        paymentId,
        transactionId: payment.transactionId,
        gatewayRef: gatewayResponse.gatewayRef,
        sessionId: payment.transaction.sessionId
      });

      await this.logSystemEvent(
        'payment_processed',
        'low',
        `Payment processed for session ${payment.transaction.sessionId}. Amount: $${payment.amount}`
      );

      return {
        payment,
        transaction: payment.transaction,
        session: payment.transaction.session,
        gatewayResponse
      };
    } catch (error) {
      // Only rollback if transaction hasn't been finished yet
      if (!dbTransaction.finished) {
        await dbTransaction.rollback();
      }

      logger.error('Payment confirmation error:', {
        paymentId,
        error: error.message,
        stack: error.stack
      });

      await this.logSystemEvent(
        'payment_failed',
        'medium',
        `Payment failed for payment ID ${paymentId}: ${error.message}`
      );

      // Re-throw PaymentError as-is, wrap other errors
      if (error instanceof PaymentError) {
        throw error;
      }

      throw new PaymentError(
        `Failed to confirm payment: ${error.message}`,
        'PAYMENT_CONFIRMATION_FAILED',
        500
      );
    }
  }

  /**
   * Get payment details
   * @param {string} paymentId
   * @returns {Promise<Object>}
   */
  async getPaymentDetails(paymentId) {
    return await Payment.findByPk(paymentId, {
      include: [{
        association: 'transaction',
        include: [{
          association: 'session',
          include: ['vehicle', 'space']
        }]
      }]
    });
  }

  /**
   * Log system event
   */
  async logSystemEvent(eventType, severity, message) {
    try {
      await SystemEvent.create({
        eventType,
        severity,
        component: 'Payment',
        message,
        details: {}
      });
    } catch (error) {
      logger.error('Failed to log system event:', error);
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new PaymentService();
module.exports.PaymentError = PaymentError;
module.exports.PAYMENT_CONFIG = PAYMENT_CONFIG;
module.exports.PAYMENT_STATUS = PAYMENT_STATUS;
module.exports.TRANSACTION_STATUS = TRANSACTION_STATUS;
