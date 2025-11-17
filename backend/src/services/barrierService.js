const logger = require('../utils/logger');
const { SystemEvent } = require('../models');

/**
 * Simulated Barrier Control Service
 * In production, this would interface with actual barrier hardware
 */
class BarrierService {
  /**
   * Open entry barrier
   * @param {string} sessionId
   * @returns {Promise<Object>}
   */
  async openEntryBarrier(sessionId) {
    const delay = parseInt(process.env.BARRIER_OPEN_DELAY_MS) || 2000;

    logger.info('Opening entry barrier:', { sessionId });

    await this.logSystemEvent('barrier_open', 'low', `Entry barrier opened for session ${sessionId}`);

    // Simulate barrier opening delay
    await this.delay(delay);

    return {
      success: true,
      message: 'Entry barrier opened',
      sessionId,
      openTime: new Date()
    };
  }

  /**
   * Open exit barrier
   * @param {string} sessionId
   * @returns {Promise<Object>}
   */
  async openExitBarrier(sessionId) {
    const delay = parseInt(process.env.BARRIER_OPEN_DELAY_MS) || 2000;

    logger.info('Opening exit barrier:', { sessionId });

    await this.logSystemEvent('barrier_open', 'low', `Exit barrier opened for session ${sessionId}`);

    // Simulate barrier opening delay
    await this.delay(delay);

    return {
      success: true,
      message: 'Exit barrier opened',
      sessionId,
      openTime: new Date()
    };
  }

  /**
   * Close barrier
   * @param {string} barrierId
   * @returns {Promise<Object>}
   */
  async closeBarrier(barrierId) {
    const delay = parseInt(process.env.BARRIER_OPEN_DELAY_MS) || 2000;

    logger.info('Closing barrier:', { barrierId });

    await this.logSystemEvent('barrier_close', 'low', `Barrier ${barrierId} closed`);

    // Simulate barrier closing delay
    await this.delay(delay / 2);

    return {
      success: true,
      message: 'Barrier closed',
      barrierId,
      closeTime: new Date()
    };
  }

  /**
   * Log system event
   */
  async logSystemEvent(eventType, severity, message) {
    try {
      await SystemEvent.create({
        eventType,
        severity,
        component: 'Barrier',
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

module.exports = new BarrierService();
