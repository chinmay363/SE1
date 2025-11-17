const { calculateParkingFee, generateReceiptNumber } = require('../../src/utils/pricingCalculator');

const PRICING_CONFIG = {
  WEEKDAY_HOURLY_RATE: 5.0,
  WEEKEND_HOURLY_RATE: 7.0
};

describe('Pricing Calculator', () => {
  beforeEach(() => {
    process.env.HOURLY_RATE = '5.0';
    process.env.WEEKEND_HOURLY_RATE = '7.0';
    process.env.FIRST_HOUR_FREE = 'false';
  });

  describe('calculateParkingFee', () => {
    test('should calculate fee for 1 hour parking', () => {
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = new Date('2024-01-01T11:00:00');

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.hours).toBe(1);
      expect(result.durationMinutes).toBe(60);
      expect(result.amount).toBe(5.0);
    });

    test('should calculate fee for 2.5 hours parking (rounds up)', () => {
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = new Date('2024-01-01T12:30:00');

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.hours).toBe(3);
      expect(result.durationMinutes).toBe(150);
      expect(result.amount).toBe(15.0);
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
    });

    test('should return 0 for first hour free with 1 hour parking', () => {
      process.env.FIRST_HOUR_FREE = 'true';
      const entryTime = new Date('2024-01-01T10:00:00');
      const exitTime = new Date('2024-01-01T11:00:00');

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.amount).toBe(0);
    });

    test('should apply weekend pricing on Saturday', () => {
      // Saturday is day 6
      const entryTime = new Date('2024-01-06T10:00:00'); // Saturday
      const exitTime = new Date('2024-01-06T11:00:00');

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.hourlyRate).toBe(PRICING_CONFIG.WEEKEND_HOURLY_RATE);
      expect(result.amount).toBe(7.0); // Weekend rate
    });

    test('should apply weekend pricing on Sunday', () => {
      // Sunday is day 0
      const entryTime = new Date('2024-01-07T10:00:00'); // Sunday
      const exitTime = new Date('2024-01-07T11:00:00');

      const result = calculateParkingFee(entryTime, exitTime);

      expect(result.hourlyRate).toBe(PRICING_CONFIG.WEEKEND_HOURLY_RATE);
      expect(result.amount).toBe(7.0);
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
