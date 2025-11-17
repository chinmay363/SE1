const logger = require('../utils/logger');
const { SystemEvent } = require('../models');

/**
 * Simulated License Plate Recognition Service
 * In production, this would interface with actual LPR hardware/API
 */
class LPRService {
  /**
   * Identify license plate from image
   * @param {string} imageData - Base64 encoded image
   * @param {boolean} simulateFailure - Force failure for testing
   * @returns {Promise<Object>}
   */
  async identifyPlate(imageData, simulateFailure = false) {
    const processingDelay = parseInt(process.env.LPR_PROCESSING_DELAY_MS) || 1000;
    const parsedFailureRate = parseFloat(process.env.LPR_FAILURE_RATE);
    const failureRate = isNaN(parsedFailureRate) ? 0.05 : parsedFailureRate;

    // Simulate processing delay
    await this.delay(processingDelay);

    // Simulate failure
    const shouldFail = simulateFailure || Math.random() < failureRate;

    if (shouldFail) {
      await this.logSystemEvent('lpr_failure', 'medium', 'Unable to read license plate');
      throw new Error('License plate recognition failed');
    }

    // Generate a deterministic plate number from the image hash
    const plateNumber = this.generatePlateFromImage(imageData);

    await this.logSystemEvent('lpr_success', 'low', `Plate identified: ${plateNumber}`);

    logger.info('License plate identified:', { plateNumber });

    return {
      licensePlate: plateNumber,
      confidence: 0.95,
      processingTime: processingDelay
    };
  }

  /**
   * Generate a simulated license plate from image data
   * @param {string} imageData
   * @returns {string}
   */
  generatePlateFromImage(imageData) {
    // Create a simple hash from the image data
    let hash = 0;
    for (let i = 0; i < Math.min(imageData.length, 100); i++) {
      hash = ((hash << 5) - hash) + imageData.charCodeAt(i);
      hash = hash & hash;
    }

    // Generate plate number format: ABC-1234
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    const letter1 = letters[Math.abs(hash) % letters.length];
    const letter2 = letters[Math.abs(hash >> 4) % letters.length];
    const letter3 = letters[Math.abs(hash >> 8) % letters.length];

    const num1 = numbers[Math.abs(hash >> 12) % numbers.length];
    const num2 = numbers[Math.abs(hash >> 16) % numbers.length];
    const num3 = numbers[Math.abs(hash >> 20) % numbers.length];
    const num4 = numbers[Math.abs(hash >> 24) % numbers.length];

    return `${letter1}${letter2}${letter3}-${num1}${num2}${num3}${num4}`;
  }

  /**
   * Log system event
   */
  async logSystemEvent(eventType, severity, message) {
    try {
      await SystemEvent.create({
        eventType,
        severity,
        component: 'LPR',
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

module.exports = new LPRService();
