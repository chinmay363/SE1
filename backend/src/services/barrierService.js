const logger = require('../utils/logger');
const { SystemEvent } = require('../models');

// ============================================================================
// BARRIER CONFIGURATION CONSTANTS
// ============================================================================

const BARRIER_CONFIG = {
  DEFAULT_OPEN_DELAY_MS: 2000,
  DEFAULT_CLOSE_DELAY_MS: 1000,
  BARRIER_TIMEOUT_MS: 10000,
  MAX_CONSECUTIVE_FAILURES: 3,
  HEALTH_CHECK_INTERVAL_MS: 60000 // 1 minute
};

const BARRIER_STATE = {
  CLOSED: 'closed',
  OPENING: 'opening',
  OPEN: 'open',
  CLOSING: 'closing',
  ERROR: 'error',
  MAINTENANCE: 'maintenance'
};

const BARRIER_TYPE = {
  ENTRY: 'entry',
  EXIT: 'exit'
};

// ============================================================================
// BARRIER STATE TRACKING
// ============================================================================

const barrierState = {
  entry: {
    state: BARRIER_STATE.CLOSED,
    lastOperation: null,
    consecutiveFailures: 0,
    lastHealthCheck: Date.now()
  },
  exit: {
    state: BARRIER_STATE.CLOSED,
    lastOperation: null,
    consecutiveFailures: 0,
    lastHealthCheck: Date.now()
  }
};

// ============================================================================
// BARRIER SERVICE CLASS
// ============================================================================

/**
 * Simulated Barrier Control Service with state management
 * In production, this would interface with actual barrier hardware
 */
class BarrierService {
  /**
   * Get current barrier state
   * @param {string} barrierType - 'entry' or 'exit'
   * @returns {Object}
   */
  getBarrierState(barrierType) {
    return { ...barrierState[barrierType], barrierType };
  }

  /**
   * Update barrier state
   * @param {string} barrierType - 'entry' or 'exit'
   * @param {string} state - New state
   */
  updateBarrierState(barrierType, state) {
    barrierState[barrierType].state = state;
    barrierState[barrierType].lastOperation = new Date();
  }

  /**
   * Check if barrier is available for operation
   * @param {string} barrierType - 'entry' or 'exit'
   * @throws {Error} If barrier is not available
   */
  validateBarrierAvailable(barrierType) {
    const state = barrierState[barrierType];

    if (state.state === BARRIER_STATE.MAINTENANCE) {
      throw new Error(`${barrierType} barrier is under maintenance`);
    }

    if (state.state === BARRIER_STATE.ERROR) {
      throw new Error(`${barrierType} barrier is in error state`);
    }

    if (state.state === BARRIER_STATE.OPENING || state.state === BARRIER_STATE.CLOSING) {
      throw new Error(`${barrierType} barrier operation already in progress`);
    }

    if (state.consecutiveFailures >= BARRIER_CONFIG.MAX_CONSECUTIVE_FAILURES) {
      throw new Error(`${barrierType} barrier has exceeded maximum consecutive failures`);
    }
  }

  /**
   * Record barrier operation success
   * @param {string} barrierType - 'entry' or 'exit'
   */
  recordSuccess(barrierType) {
    barrierState[barrierType].consecutiveFailures = 0;
  }

  /**
   * Record barrier operation failure
   * @param {string} barrierType - 'entry' or 'exit'
   */
  recordFailure(barrierType) {
    barrierState[barrierType].consecutiveFailures++;
    if (barrierState[barrierType].consecutiveFailures >= BARRIER_CONFIG.MAX_CONSECUTIVE_FAILURES) {
      this.updateBarrierState(barrierType, BARRIER_STATE.ERROR);
    }
  }
  /**
   * Open entry barrier with state management and error handling
   * @param {string} sessionId
   * @returns {Promise<Object>}
   */
  async openEntryBarrier(sessionId) {
    const barrierType = BARRIER_TYPE.ENTRY;

    try {
      // Validate barrier is available
      this.validateBarrierAvailable(barrierType);

      // Update state to opening
      this.updateBarrierState(barrierType, BARRIER_STATE.OPENING);

      logger.info('Opening entry barrier:', { sessionId, barrierType });

      const delay = parseInt(process.env.BARRIER_OPEN_DELAY_MS) || BARRIER_CONFIG.DEFAULT_OPEN_DELAY_MS;

      // Simulate barrier opening delay with timeout
      await Promise.race([
        this.delay(delay),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Barrier operation timeout')), BARRIER_CONFIG.BARRIER_TIMEOUT_MS)
        )
      ]);

      // Update state to open
      this.updateBarrierState(barrierType, BARRIER_STATE.OPEN);
      this.recordSuccess(barrierType);

      await this.logSystemEvent(
        'barrier_open',
        'low',
        `Entry barrier opened for session ${sessionId}`
      );

      // Auto-close after a few seconds (simulated)
      setTimeout(() => {
        this.updateBarrierState(barrierType, BARRIER_STATE.CLOSED);
      }, delay + 3000);

      return {
        success: true,
        message: 'Entry barrier opened',
        sessionId,
        barrierType,
        state: BARRIER_STATE.OPEN,
        openTime: new Date()
      };
    } catch (error) {
      this.recordFailure(barrierType);
      this.updateBarrierState(barrierType, BARRIER_STATE.ERROR);

      logger.error('Entry barrier error:', {
        sessionId,
        error: error.message
      });

      await this.logSystemEvent(
        'barrier_error',
        'high',
        `Entry barrier failed to open for session ${sessionId}: ${error.message}`
      );

      throw new Error(`Failed to open entry barrier: ${error.message}`);
    }
  }

  /**
   * Open exit barrier with state management and error handling
   * @param {string} sessionId
   * @returns {Promise<Object>}
   */
  async openExitBarrier(sessionId) {
    const barrierType = BARRIER_TYPE.EXIT;

    try {
      // Validate barrier is available
      this.validateBarrierAvailable(barrierType);

      // Update state to opening
      this.updateBarrierState(barrierType, BARRIER_STATE.OPENING);

      logger.info('Opening exit barrier:', { sessionId, barrierType });

      const delay = parseInt(process.env.BARRIER_OPEN_DELAY_MS) || BARRIER_CONFIG.DEFAULT_OPEN_DELAY_MS;

      // Simulate barrier opening delay with timeout
      await Promise.race([
        this.delay(delay),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Barrier operation timeout')), BARRIER_CONFIG.BARRIER_TIMEOUT_MS)
        )
      ]);

      // Update state to open
      this.updateBarrierState(barrierType, BARRIER_STATE.OPEN);
      this.recordSuccess(barrierType);

      await this.logSystemEvent(
        'barrier_open',
        'low',
        `Exit barrier opened for session ${sessionId}`
      );

      // Auto-close after a few seconds (simulated)
      setTimeout(() => {
        this.updateBarrierState(barrierType, BARRIER_STATE.CLOSED);
      }, delay + 3000);

      return {
        success: true,
        message: 'Exit barrier opened',
        sessionId,
        barrierType,
        state: BARRIER_STATE.OPEN,
        openTime: new Date()
      };
    } catch (error) {
      this.recordFailure(barrierType);
      this.updateBarrierState(barrierType, BARRIER_STATE.ERROR);

      logger.error('Exit barrier error:', {
        sessionId,
        error: error.message
      });

      await this.logSystemEvent(
        'barrier_error',
        'high',
        `Exit barrier failed to open for session ${sessionId}: ${error.message}`
      );

      throw new Error(`Failed to open exit barrier: ${error.message}`);
    }
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
module.exports.BARRIER_CONFIG = BARRIER_CONFIG;
module.exports.BARRIER_STATE = BARRIER_STATE;
module.exports.BARRIER_TYPE = BARRIER_TYPE;
