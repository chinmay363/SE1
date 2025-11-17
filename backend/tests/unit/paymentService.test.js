const paymentService = require('../../src/services/paymentService');
const { Payment, Transaction, ParkingSession, sequelize } = require('../../src/models');
const { calculateParkingFee, generateReceiptNumber } = require('../../src/utils/pricingCalculator');

jest.mock('../../src/models');
jest.mock('../../src/utils/pricingCalculator');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('PaymentService', () => {
  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock transaction
    mockTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      finished: false
    };

    // Mock sequelize Transaction with ISOLATION_LEVELS
    sequelize.Transaction = {
      ISOLATION_LEVELS: {
        SERIALIZABLE: 'SERIALIZABLE',
        READ_COMMITTED: 'READ_COMMITTED',
        READ_UNCOMMITTED: 'READ_UNCOMMITTED',
        REPEATABLE_READ: 'REPEATABLE_READ'
      }
    };

    sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
    generateReceiptNumber.mockReturnValue('RCP-12345');
  });

  describe('createPayment', () => {
    test('should create payment successfully', async () => {
      const mockSession = {
        id: 'session-123',
        entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'active',
        vehicle: { licensePlate: 'ABC-1234' },
        space: { spaceNumber: '1A01' }
      };

      const mockTransactionRecord = {
        id: 'transaction-123',
        sessionId: 'session-123',
        amount: 10.00,
        status: 'pending'
      };

      const mockPayment = {
        id: 'payment-123',
        transactionId: 'transaction-123',
        amount: 10.00,
        status: 'initiated'
      };

      ParkingSession.findByPk = jest.fn().mockResolvedValue(mockSession);
      calculateParkingFee.mockReturnValue({ amount: 10.00, durationMinutes: 120 });
      Transaction.findOne = jest.fn().mockResolvedValue(null);
      Transaction.create = jest.fn().mockResolvedValue(mockTransactionRecord);
      Payment.create = jest.fn().mockResolvedValue(mockPayment);

      const result = await paymentService.createPayment('session-123', 'credit_card');

      expect(result).toHaveProperty('payment');
      expect(result).toHaveProperty('transaction');
      expect(result).toHaveProperty('amount', 10.00);
      expect(result).toHaveProperty('durationMinutes', 120);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    test('should throw error for non-existent session', async () => {
      ParkingSession.findByPk = jest.fn().mockResolvedValue(null);

      await expect(paymentService.createPayment('nonexistent', 'credit_card'))
        .rejects.toThrow('Parking session not found');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('should throw error for inactive session', async () => {
      const mockSession = {
        id: 'session-123',
        status: 'completed'
      };

      ParkingSession.findByPk = jest.fn().mockResolvedValue(mockSession);

      await expect(paymentService.createPayment('session-123', 'credit_card'))
        .rejects.toThrow('Parking session is not active');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('confirmPayment', () => {
    test('should confirm payment successfully', async () => {
      const mockSession = {
        id: 'session-123',
        status: 'active',
        entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        exitTime: null,
        update: jest.fn().mockResolvedValue(true),
        space: {
          id: 'space-123',
          update: jest.fn().mockResolvedValue(true)
        }
      };

      const mockTransactionRecord = {
        id: 'transaction-123',
        sessionId: 'session-123',
        amount: 10.00,
        status: 'pending',
        update: jest.fn().mockResolvedValue(true),
        session: mockSession
      };

      const mockPayment = {
        id: 'payment-123',
        transactionId: 'transaction-123',
        amount: 10.00,
        status: 'initiated',
        update: jest.fn().mockResolvedValue(true),
        transaction: mockTransactionRecord
      };

      Payment.findByPk = jest.fn().mockResolvedValue(mockPayment);

      const result = await paymentService.confirmPayment('payment-123');

      expect(result).toHaveProperty('payment');
      expect(result).toHaveProperty('transaction');
      expect(result).toHaveProperty('session');
      expect(mockPayment.update).toHaveBeenCalled();
      expect(mockTransactionRecord.update).toHaveBeenCalled();
      expect(mockSession.update).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    test('should throw error for non-existent payment', async () => {
      Payment.findByPk = jest.fn().mockResolvedValue(null);

      await expect(paymentService.confirmPayment('nonexistent'))
        .rejects.toThrow('Payment not found');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('getPaymentDetails', () => {
    test('should return payment details', async () => {
      const mockPayment = {
        id: 'payment-123',
        amount: 10.00,
        status: 'completed',
        transaction: {
          id: 'transaction-123',
          session: {
            id: 'session-123',
            vehicle: { licensePlate: 'ABC-1234' }
          }
        }
      };

      Payment.findByPk = jest.fn().mockResolvedValue(mockPayment);

      const result = await paymentService.getPaymentDetails('payment-123');

      expect(result).toEqual(mockPayment);
      expect(Payment.findByPk).toHaveBeenCalled();
    });

    test('should return null for non-existent payment', async () => {
      Payment.findByPk = jest.fn().mockResolvedValue(null);

      const result = await paymentService.getPaymentDetails('nonexistent');

      expect(result).toBeNull();
    });
  });
});
