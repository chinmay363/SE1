const { Transaction, Payment, ParkingSession, Vehicle, ParkingSpace, sequelize } = require('../models');
const { calculateParkingFee, generateReceiptNumber } = require('../utils/pricingCalculator');
const logger = require('../utils/logger');
const { SystemEvent } = require('../models');

class PaymentService {
  /**
   * Create a payment transaction
   * @param {string} sessionId
   * @param {string} paymentMethod
   * @returns {Promise<Object>}
   */
  async createPayment(sessionId, paymentMethod) {
    const transaction = await sequelize.transaction();

    try {
      // Get parking session
      const session = await ParkingSession.findByPk(sessionId, {
        include: [
          { association: 'vehicle' },
          { association: 'space' }
        ],
        transaction
      });

      if (!session) {
        await transaction.rollback();
        throw new Error('Parking session not found');
      }

      if (session.status !== 'active') {
        await transaction.rollback();
        throw new Error('Parking session is not active');
      }

      // Calculate parking fee
      const exitTime = new Date();
      const { amount, durationMinutes } = calculateParkingFee(session.entryTime, exitTime);

      // Check if transaction already exists
      let transactionRecord = await Transaction.findOne({
        where: { sessionId },
        transaction
      });

      if (!transactionRecord) {
        // Create transaction
        transactionRecord = await Transaction.create({
          sessionId,
          amount,
          currency: 'USD',
          status: 'pending',
          paymentMethod,
          receiptNumber: generateReceiptNumber(),
          transactionDate: new Date()
        }, { transaction });
      }

      // Create payment record
      const payment = await Payment.create({
        transactionId: transactionRecord.id,
        amount,
        paymentMethod,
        status: 'initiated',
        paymentDate: new Date(),
        metadata: { durationMinutes }
      }, { transaction });

      await transaction.commit();

      logger.info('Payment created:', {
        sessionId,
        paymentId: payment.id,
        amount
      });

      return {
        payment,
        transaction: transactionRecord,
        session,
        amount,
        durationMinutes
      };
    } catch (error) {
      // Only rollback if transaction hasn't been finished yet
      if (!transaction.finished) {
        await transaction.rollback();
      }
      logger.error('Payment creation error:', error);
      throw error;
    }
  }

  /**
   * Confirm payment
   * @param {string} paymentId
   * @returns {Promise<Object>}
   */
  async confirmPayment(paymentId) {
    const transaction = await sequelize.transaction();

    try {
      const payment = await Payment.findByPk(paymentId, {
        include: [{
          association: 'transaction',
          include: [{
            association: 'session',
            include: ['vehicle', 'space']
          }]
        }],
        transaction
      });

      if (!payment) {
        await transaction.rollback();
        throw new Error('Payment not found');
      }

      // Simulate payment processing
      await this.delay(1000);

      // Update payment status
      await payment.update({
        status: 'completed',
        paymentGatewayRef: `PG-${Date.now()}`
      }, { transaction });

      // Update transaction status
      await payment.transaction.update({
        status: 'completed'
      }, { transaction });

      // Update session
      const exitTime = new Date();
      const durationMinutes = Math.floor(
        (exitTime - new Date(payment.transaction.session.entryTime)) / (1000 * 60)
      );

      await payment.transaction.session.update({
        exitTime,
        durationMinutes,
        status: 'completed'
      }, { transaction });

      // Release parking space
      await payment.transaction.session.space.update({
        status: 'available'
      }, { transaction });

      await this.logSystemEvent('payment_processed', 'low',
        `Payment processed for session ${payment.transaction.sessionId}`);

      await transaction.commit();

      logger.info('Payment confirmed:', {
        paymentId,
        transactionId: payment.transactionId
      });

      return {
        payment,
        transaction: payment.transaction,
        session: payment.transaction.session
      };
    } catch (error) {
      // Only rollback if transaction hasn't been finished yet
      if (!transaction.finished) {
        await transaction.rollback();
      }
      await this.logSystemEvent('payment_failed', 'medium',
        `Payment failed: ${error.message}`);
      logger.error('Payment confirmation error:', error);
      throw error;
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
