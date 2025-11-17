const adminService = require('../../src/services/adminService');
const { ParkingSpace, ParkingSession, Transaction, Vehicle, SystemEvent, sequelize } = require('../../src/models');

jest.mock('../../src/models');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('AdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOccupancy', () => {
    test('should return occupancy statistics', async () => {
      ParkingSpace.count = jest.fn()
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(60)  // available
        .mockResolvedValueOnce(35)  // occupied
        .mockResolvedValueOnce(3)   // reserved
        .mockResolvedValueOnce(2);  // maintenance

      ParkingSpace.findAll = jest.fn().mockResolvedValue([]);

      const result = await adminService.getOccupancy();

      expect(result).toHaveProperty('total', 100);
      expect(result).toHaveProperty('available', 60);
      expect(result).toHaveProperty('occupied', 35);
      expect(result).toHaveProperty('reserved', 3);
      expect(result).toHaveProperty('maintenance', 2);
      expect(result).toHaveProperty('occupancyRate', '35.00');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('getRevenue', () => {
    test('should calculate total revenue', async () => {
      const mockTransactions = [
        { amount: '10.50' },
        { amount: '20.00' },
        { amount: '15.75' }
      ];

      Transaction.findAll = jest.fn()
        .mockResolvedValueOnce(mockTransactions)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await adminService.getRevenue(new Date('2024-01-01'), new Date('2024-01-31'));

      expect(result).toHaveProperty('totalRevenue', '46.25');
      expect(result).toHaveProperty('transactionCount', 3);
      expect(result).toHaveProperty('averageTransaction', '15.42');
    });

    test('should handle empty transactions', async () => {
      Transaction.findAll = jest.fn().mockResolvedValue([]);

      const result = await adminService.getRevenue();

      expect(result).toHaveProperty('totalRevenue', '0.00');
      expect(result).toHaveProperty('transactionCount', 0);
      expect(result).toHaveProperty('averageTransaction', '0.00');
    });
  });

  describe('resetSystem', () => {
    test('should reset system successfully', async () => {
      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(true),
        rollback: jest.fn().mockResolvedValue(true)
      };

      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      ParkingSession.update = jest.fn().mockResolvedValue([1]);
      ParkingSpace.update = jest.fn().mockResolvedValue([1]);
      SystemEvent.create = jest.fn().mockResolvedValue({});

      const result = await adminService.resetSystem();

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'System reset completed');
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(ParkingSession.update).toHaveBeenCalled();
      expect(ParkingSpace.update).toHaveBeenCalled();
      expect(SystemEvent.create).toHaveBeenCalled();
    });

    test('should rollback on error', async () => {
      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(true),
        rollback: jest.fn().mockResolvedValue(true)
      };

      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      ParkingSession.update = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(adminService.resetSystem()).rejects.toThrow('Database error');
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });

  describe('getDashboardSummary', () => {
    test('should return dashboard summary', async () => {
      // Mock getOccupancy
      ParkingSpace.count = jest.fn()
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(60)
        .mockResolvedValueOnce(35)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);
      ParkingSpace.findAll = jest.fn().mockResolvedValue([]);

      // Mock getRevenue
      Transaction.findAll = jest.fn().mockResolvedValue([
        { amount: '50.00' }
      ]);

      // Mock other counts
      ParkingSession.count = jest.fn().mockResolvedValue(35);
      Vehicle.count = jest.fn().mockResolvedValue(500);
      SystemEvent.count = jest.fn().mockResolvedValue(2);

      const result = await adminService.getDashboardSummary();

      expect(result).toHaveProperty('occupancy');
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('activeSessions', 35);
      expect(result).toHaveProperty('totalVehicles', 500);
      expect(result).toHaveProperty('unresolvedAlerts', 2);
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('getTrafficAnalytics', () => {
    test('should return traffic analytics', async () => {
      ParkingSession.findAll = jest.fn().mockResolvedValue([]);
      ParkingSession.findOne = jest.fn().mockResolvedValue({
        dataValues: { avgDuration: 120 }
      });

      const result = await adminService.getTrafficAnalytics(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toHaveProperty('sessionsByHour');
      expect(result).toHaveProperty('averageDuration', 120);
      expect(result).toHaveProperty('period');
    });
  });
});
