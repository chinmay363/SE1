// ============================================================================
// PRICING CONFIGURATION CONSTANTS
// ============================================================================

const PRICING_CONFIG = {
  DEFAULT_HOURLY_RATE: 5.0,
  WEEKEND_HOURLY_RATE: 7.0,
  GRACE_PERIOD_MINUTES: 15,
  MAXIMUM_DAILY_FEE: 50.0,
  MINIMUM_CHARGE: 0.0,
  CURRENCY: 'USD'
};

const PRICING_RULES = {
  FIRST_HOUR_FREE: 'first_hour_free',
  GRACE_PERIOD: 'grace_period',
  DAILY_CAP: 'daily_cap'
};

// ============================================================================
// PRICING VALIDATION
// ============================================================================

/**
 * Validate date inputs for pricing calculation
 * @param {Date} entryTime - Entry timestamp
 * @param {Date} exitTime - Exit timestamp
 * @throws {Error} If dates are invalid
 */
const validatePricingInputs = (entryTime, exitTime) => {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);

  if (isNaN(entry.getTime())) {
    throw new Error('Invalid entry time');
  }

  if (isNaN(exit.getTime())) {
    throw new Error('Invalid exit time');
  }

  if (exit < entry) {
    throw new Error('Exit time cannot be before entry time');
  }

  const durationMs = exit - entry;
  const maxDurationDays = 30;
  if (durationMs > maxDurationDays * 24 * 60 * 60 * 1000) {
    throw new Error(`Duration cannot exceed ${maxDurationDays} days`);
  }
};

/**
 * Check if date is a weekend
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

// ============================================================================
// PRICING CALCULATION
// ============================================================================

/**
 * Calculate parking fee based on duration with advanced pricing rules
 * @param {Date} entryTime - Entry timestamp
 * @param {Date} exitTime - Exit timestamp
 * @param {Object} options - Optional pricing overrides
 * @returns {Object} - { amount, durationMinutes, hours, appliedRules, breakdown }
 */
const calculateParkingFee = (entryTime, exitTime, options = {}) => {
  // Validate inputs
  validatePricingInputs(entryTime, exitTime);

  const entry = new Date(entryTime);
  const exit = new Date(exitTime);

  // Calculate duration in minutes
  const durationMs = exit - entry;
  const durationMinutes = Math.floor(durationMs / (1000 * 60));

  // Apply grace period
  const gracePeriod = parseInt(process.env.GRACE_PERIOD_MINUTES) || PRICING_CONFIG.GRACE_PERIOD_MINUTES;
  if (durationMinutes <= gracePeriod) {
    return {
      amount: 0,
      durationMinutes,
      hours: 0,
      hourlyRate: 0,
      appliedRules: [PRICING_RULES.GRACE_PERIOD],
      breakdown: {
        baseAmount: 0,
        discounts: 0,
        finalAmount: 0
      }
    };
  }

  // Determine hourly rate (weekend vs weekday)
  const baseHourlyRate = isWeekend(entry) ? PRICING_CONFIG.WEEKEND_HOURLY_RATE : PRICING_CONFIG.DEFAULT_HOURLY_RATE;
  const hourlyRate = parseFloat(options.hourlyRate || process.env.HOURLY_RATE || baseHourlyRate);

  // Calculate hours (round up)
  const totalHours = Math.ceil(durationMinutes / 60);
  let chargeableHours = totalHours;

  // Track applied rules
  const appliedRules = [];
  let discount = 0;

  // Apply first hour free if applicable
  const firstHourFree = process.env.FIRST_HOUR_FREE === 'true';
  if (firstHourFree && totalHours >= 1) {
    chargeableHours = Math.max(0, totalHours - 1);
    discount = hourlyRate;
    appliedRules.push(PRICING_RULES.FIRST_HOUR_FREE);
  }

  // Calculate base amount
  let amount = chargeableHours * hourlyRate;

  // Apply daily cap
  const maxDailyFee = parseFloat(process.env.MAXIMUM_DAILY_FEE) || PRICING_CONFIG.MAXIMUM_DAILY_FEE;
  const originalAmount = amount;
  if (amount > maxDailyFee) {
    amount = maxDailyFee;
    appliedRules.push(PRICING_RULES.DAILY_CAP);
  }

  // Ensure minimum charge
  amount = Math.max(amount, PRICING_CONFIG.MINIMUM_CHARGE);

  return {
    amount: parseFloat(amount.toFixed(2)),
    durationMinutes,
    hours: totalHours,
    chargeableHours,
    hourlyRate,
    appliedRules,
    breakdown: {
      baseAmount: parseFloat((chargeableHours * hourlyRate).toFixed(2)),
      discounts: parseFloat(discount.toFixed(2)),
      cappedAmount: originalAmount > maxDailyFee ? parseFloat((originalAmount - maxDailyFee).toFixed(2)) : 0,
      finalAmount: parseFloat(amount.toFixed(2))
    }
  };
};

/**
 * Generate a unique receipt number
 * @returns {string}
 */
const generateReceiptNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RCPT-${timestamp}-${random}`;
};

module.exports = {
  calculateParkingFee,
  generateReceiptNumber,
  PRICING_CONFIG,
  PRICING_RULES,
  validatePricingInputs,
  isWeekend
};
