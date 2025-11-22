const {
  calculateParkingFee,
  generateReceiptNumber,
  PRICING_CONFIG,
  PRICING_RULES,
  validatePricingInputs,
  isWeekend
} = require('../../src/utils/pricingCalculator');

describe('Pricing Calculator', () => {
  beforeEach(() => {
    process.env.HOURLY_RATE = '5.0';
    process.env.FIRST_HOUR_FREE = 'false';
    process.env.GRACE_PERIOD_MINUTES = '15';
    process.env.MAXIMUM_DAILY_FEE = '50.0';
  });

  afterEach(() => {
    delete process.env.GRACE_PERIOD_MINUTES;
    delete process.env.MAXIMUM_DAILY_FEE;
  });

  describe('calculateParkingFee', () => {
    test('should calculate fee for 1 hour parking', () => {
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = new Date('2024-01-01T11:00:00');

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.hours).toBe(1);
      expect(result.durationMinutes).toBe(60);
      expect(result.amount).toBe(5.0);
      expect(result.hourlyRate).toBe(5.0);
      expect(result.breakdown).toBeDefined();
    });

    test('should calculate fee for 2.5 hours parking (rounds up)', () => {
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = new Date('2024-01-01T12:30:00');

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.hours).toBe(3);
      expect(result.durationMinutes).toBe(150);
      expect(result.amount).toBe(15.0);
      expect(result.chargeableHours).toBe(3);
    });

    test('should calculate fee for 30 minutes parking (rounds up to 1 hour)', () => {
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = new Date('2024-01-01T10:30:00');

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.hours).toBe(1);
      expect(result.durationMinutes).toBe(30);
      expect(result.amount).toBe(5.0);
    });

    test('should apply first hour free when enabled', () => {
      process.env.FIRST_HOUR_FREE = 'true';
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = new Date('2024-01-01T12:00:00');

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.hours).toBe(2);
      expect(result.amount).toBe(5.0); // 2 hours - 1 free = 1 hour charged
      expect(result.appliedRules).toContain(PRICING_RULES.FIRST_HOUR_FREE);
      expect(result.breakdown.discounts).toBe(5.0);
    });

    test('should return 0 for first hour free with 1 hour parking', () => {
      process.env.FIRST_HOUR_FREE = 'true';
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = new Date('2024-01-01T11:00:00');

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.amount).toBe(0);
      expect(result.appliedRules).toContain(PRICING_RULES.FIRST_HOUR_FREE);
    });

    // NEW TESTS FOR ENHANCED FEATURES

    test('should apply grace period for parking under 15 minutes', () => {
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = new Date('2024-01-01T10:10:00'); // 10 minutes

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.amount).toBe(0);
      expect(result.hours).toBe(0);
      expect(result.appliedRules).toContain(PRICING_RULES.GRACE_PERIOD);
    });

    test('should charge after grace period expires', () => {
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = new Date('2024-01-01T10:20:00'); // 20 minutes (over 15)

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.amount).toBeGreaterThan(0);
      expect(result.hours).toBe(1);
      expect(result.appliedRules).not.toContain(PRICING_RULES.GRACE_PERIOD);
    });

    test('should apply weekend pricing on Saturday', () => {
      const entryTime = new Date('2024-01-06T10:00:00'); // Saturday
      const exitTime = new Date('2024-01-06T11:00:00');

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.hourlyRate).toBe(PRICING_CONFIG.WEEKEND_HOURLY_RATE);
      expect(result.amount).toBe(7.0); // Weekend rate
    });

    test('should apply weekend pricing on Sunday', () => {
      const entryTime = new Date('2024-01-07T10:00:00'); // Sunday
      const exitTime = new Date('2024-01-07T11:00:00');

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.hourlyRate).toBe(PRICING_CONFIG.WEEKEND_HOURLY_RATE);
      expect(result.amount).toBe(7.0);
    });

    test('should use weekday pricing on Monday', () => {
      const entryTime = new Date('2024-01-01T10:00:00'); // Monday
      const exitTime = new Date('2024-01-01T11:00:00');

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.hourlyRate).toBe(PRICING_CONFIG.DEFAULT_HOURLY_RATE);
      expect(result.amount).toBe(5.0);
    });

    test('should apply daily cap for long parking durations', () => {
      const entryTime = new Date('2024-01-01T08:00:00');
      const exitTime = new Date('2024-01-01T20:00:00'); // 12 hours = $60, capped at $50

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.amount).toBe(50.0); // Daily cap
      expect(result.appliedRules).toContain(PRICING_RULES.DAILY_CAP);
      expect(result.breakdown.cappedAmount).toBe(10.0); // $60 - $50
    });

    test('should not apply daily cap for short durations', () => {
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = new Date('2024-01-01T14:00:00'); // 4 hours = $20

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.amount).toBe(20.0);
      expect(result.appliedRules).not.toContain(PRICING_RULES.DAILY_CAP);
    });

    test('should accept custom hourly rate via options', () => {
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = new Date('2024-01-01T11:00:00');

      const result = calculateParkingFee(entryTime, exitTime, { hourlyRate: 10.0 });

      expect(result.hourlyRate).toBe(10.0);
      expect(result.amount).toBe(10.0);
    });

    test('should throw error for invalid entry time', () => {
      const entryTime = 'invalid-date';
      const exitTime = new Date('2024-01-01T11:00:00');

      expect(() => calculateParkingFee(entryTime, exitTime)).toThrow('Invalid entry time');
    });

    test('should throw error for invalid exit time', () => {
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = 'invalid-date';

      expect(() => calculateParkingFee(entryTime, exitTime)).toThrow('Invalid exit time');
    });

    test('should throw error when exit time is before entry time', () => {
      const entryTime = new Date('2024-01-01T11:00:00');
      const exitTime = new Date('2024-01-01T10:00:00');

      expect(() => calculateParkingFee(entryTime, exitTime)).toThrow(
        'Exit time cannot be before entry time'
      );
    });

    test('should throw error for parking duration exceeding 30 days', () => {
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = new Date('2024-02-05T10:00:00'); // 35 days later

      expect(() => calculateParkingFee(entryTime, exitTime)).toThrow(
        'Duration cannot exceed 30 days'
      );
    });

    test('should handle boundary case of exactly 30 days', () => {
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = new Date('2024-01-31T10:00:00'); // Exactly 30 days

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.amount).toBe(50.0); // Should be capped
      expect(result.appliedRules).toContain(PRICING_RULES.DAILY_CAP);
    });

    test('should provide detailed breakdown of charges', () => {
      process.env.FIRST_HOUR_FREE = 'true';
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = new Date('2024-01-01T14:00:00'); // 4 hours

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.breakdown).toHaveProperty('baseAmount');
      expect(result.breakdown).toHaveProperty('discounts');
      expect(result.breakdown).toHaveProperty('cappedAmount');
      expect(result.breakdown).toHaveProperty('finalAmount');
      expect(result.breakdown.finalAmount).toBe(result.amount);
    });
  });

  describe('isWeekend', () => {
    test('should return true for Saturday', () => {
      const saturday = new Date('2024-01-06'); // Saturday
      expect(isWeekend(saturday)).toBe(true);
    });

    test('should return true for Sunday', () => {
      const sunday = new Date('2024-01-07'); // Sunday
      expect(isWeekend(sunday)).toBe(true);
    });

    test('should return false for Monday', () => {
      const monday = new Date('2024-01-01'); // Monday
      expect(isWeekend(monday)).toBe(false);
    });

    test('should return false for Friday', () => {
      const friday = new Date('2024-01-05'); // Friday
      expect(isWeekend(friday)).toBe(false);
    });
  });

  describe('validatePricingInputs', () => {
    test('should pass validation for valid dates', () => {
      const entry = new Date('2024-01-01T10:00:00');
      const exit = new Date('2024-01-01T11:00:00');

      expect(() => validatePricingInputs(entry, exit)).not.toThrow();
    });

    test('should throw error for invalid entry time', () => {
      expect(() => validatePricingInputs('invalid', new Date())).toThrow('Invalid entry time');
    });

    test('should throw error for invalid exit time', () => {
      expect(() => validatePricingInputs(new Date(), 'invalid')).toThrow('Invalid exit time');
    });
  });

  describe('generateReceiptNumber', () => {
    test('should generate receipt number with correct format', () => {
      const receipt = generateReceiptNumber();

      expect(receipt).toMatch(/^RCPT-\d+-\d{4}$/);
    });

    test('should generate unique receipt numbers', () => {
      const receipt1 = generateReceiptNumber();
      const receipt2 = generateReceiptNumber();

      expect(receipt1).not.toBe(receipt2);
    });
  });
});
