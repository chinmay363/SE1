const paymentService = require('../../src/services/paymentService');
const { Payment, Transaction, ParkingSession } = require('../../src/models');
const pricingCalculator = require('../../src/utils/pricingCalculator');

jest.mock('../../src/models');
jest.mock('../../src/utils/pricingCalculator');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    test('should create payment successfully', async () => {
      const mockSession = {
        id: 'session-123',
        entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'active'
      };

      const mockPayment = {
        id: 'payment-123',
        sessionId: 'session-123',
        amount: 10.00,
        status: 'pending'
      };

      ParkingSession.findByPk = jest.fn().mockResolvedValue(mockSession);
      pricingCalculator.calculateFee = jest.fn().mockReturnValue({
        amount: 10.00,
        durationMinutes: 120
      });
      Payment.create = jest.fn().mockResolvedValue(mockPayment);

      const result = await paymentService.createPayment('session-123', 'card');

      expect(result).toHaveProperty('payment');
      expect(result).toHaveProperty('amount', 10.00);
      expect(result).toHaveProperty('durationMinutes', 120);
      expect(Payment.create).toHaveBeenCalledWith({
        sessionId: 'session-123',
        amount: 10.00,
        paymentMethod: 'card',
        status: 'pending'
      });
    });

    test('should throw error for non-existent session', async () => {
      ParkingSession.findByPk = jest.fn().mockResolvedValue(null);

      await expect(paymentService.createPayment('nonexistent', 'card'))
        .rejects.toThrow('Session not found');
    });

    test('should throw error for completed session', async () => {
      const mockSession = {
        id: 'session-123',
        status: 'completed'
      };

      ParkingSession.findByPk = jest.fn().mockResolvedValue(mockSession);

      await expect(paymentService.createPayment('session-123', 'card'))
        .rejects.toThrow('Session already completed');
    });
  });

  describe('confirmPayment', () => {
    test('should confirm payment successfully', async () => {
      const mockPayment = {
        id: 'payment-123',
        sessionId: 'session-123',
        amount: 10.00,
        status: 'pending',
        paymentMethod: 'card',
        update: jest.fn().mockResolvedValue(true)
      };

      const mockTransaction = {
        id: 'transaction-123',
        paymentId: 'payment-123'
      };

      const mockSession = {
        id: 'session-123',
        exitTime: null,
        update: jest.fn().mockResolvedValue(true),
        space: {
          id: 'space-123',
          update: jest.fn().mockResolvedValue(true)
        }
      };

      Payment.findByPk = jest.fn().mockResolvedValue(mockPayment);
      Transaction.create = jest.fn().mockResolvedValue(mockTransaction);
      ParkingSession.findByPk = jest.fn().mockResolvedValue(mockSession);

      const result = await paymentService.confirmPayment('payment-123');

      expect(result).toHaveProperty('transaction');
      expect(result).toHaveProperty('payment');
      expect(result).toHaveProperty('session');
      expect(mockPayment.update).toHaveBeenCalledWith({ status: 'completed' });
      expect(Transaction.create).toHaveBeenCalled();
    });

    test('should throw error for non-existent payment', async () => {
      Payment.findByPk = jest.fn().mockResolvedValue(null);

      await expect(paymentService.confirmPayment('nonexistent'))
        .rejects.toThrow('Payment not found');
    });

    test('should throw error for already completed payment', async () => {
      const mockPayment = {
        id: 'payment-123',
        status: 'completed'
      };

      Payment.findByPk = jest.fn().mockResolvedValue(mockPayment);

      await expect(paymentService.confirmPayment('payment-123'))
        .rejects.toThrow('Payment already completed');
    });
  });

  describe('getPaymentDetails', () => {
    test('should return payment details', async () => {
      const mockPayment = {
        id: 'payment-123',
        amount: 10.00,
        status: 'completed',
        session: {
          id: 'session-123',
          vehicle: { licensePlate: 'ABC-1234' }
        }
      };

      Payment.findByPk = jest.fn().mockResolvedValue(mockPayment);

      const result = await paymentService.getPaymentDetails('payment-123');

      expect(result).toEqual(mockPayment);
      expect(Payment.findByPk).toHaveBeenCalledWith('payment-123', {
        include: expect.any(Array)
      });
    });

    test('should return null for non-existent payment', async () => {
      Payment.findByPk = jest.fn().mockResolvedValue(null);

      const result = await paymentService.getPaymentDetails('nonexistent');

      expect(result).toBeNull();
    });
  });
});
