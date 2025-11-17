/**
 * Calculate parking fee based on duration
 * @param {Date} entryTime - Entry timestamp
 * @param {Date} exitTime - Exit timestamp
 * @returns {Object} - { amount, durationMinutes, hours }
 */
const calculateParkingFee = (entryTime, exitTime) => {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);

  // Calculate duration in minutes
  const durationMs = exit - entry;
  const durationMinutes = Math.floor(durationMs / (1000 * 60));

  // Calculate hours (round up)
  let hours = Math.ceil(durationMinutes / 60);

  // Get hourly rate from environment
  const hourlyRate = parseFloat(process.env.HOURLY_RATE) || 5.0;
  const firstHourFree = process.env.FIRST_HOUR_FREE === 'true';

  // Apply first hour free if applicable
  if (firstHourFree && hours >= 1) {
    hours = Math.max(0, hours - 1);
  }

  // Calculate amount
  const amount = (hours * hourlyRate).toFixed(2);

  return {
    amount: parseFloat(amount),
    durationMinutes,
    hours: Math.ceil(durationMinutes / 60),
    hourlyRate
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
  generateReceiptNumber
};
