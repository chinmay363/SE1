const parkingService = require('../../src/services/parkingService');
const { ParkingSpace, ParkingSession, Vehicle, sequelize } = require('../../src/models');

jest.mock('../../src/models');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('ParkingService', () => {
  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock transaction
    mockTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      finished: false,
      LOCK: { UPDATE: 'UPDATE' }
    };

    sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
  });

  describe('allocateSpace', () => {
    test('should allocate parking space successfully', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        licensePlate: 'ABC-1234',
        visitCount: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      const mockSpace = {
        id: 'space-123',
        spaceNumber: '1A01',
        floor: 1,
        zone: 'A',
        status: 'available',
        update: jest.fn().mockResolvedValue(true)
      };

      const mockSession = {
        id: 'session-123',
        vehicleId: 'vehicle-123',
        spaceId: 'space-123',
        status: 'active'
      };

      Vehicle.findOne = jest.fn().mockResolvedValue(mockVehicle);
      ParkingSession.findOne = jest.fn().mockResolvedValue(null); // No existing session
      ParkingSpace.findOne = jest.fn().mockResolvedValue(mockSpace);
      ParkingSession.create = jest.fn().mockResolvedValue(mockSession);

      const result = await parkingService.allocateSpace('ABC-1234');

      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('space');
      expect(result).toHaveProperty('vehicle');
      expect(mockSpace.update).toHaveBeenCalledWith(
        { status: 'occupied', lastOccupied: expect.any(Date) },
        { transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    test('should throw error when no spaces available', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        licensePlate: 'ABC-1234',
        visitCount: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      Vehicle.findOne = jest.fn().mockResolvedValue(mockVehicle);
      ParkingSession.findOne = jest.fn().mockResolvedValue(null);
      ParkingSpace.findOne = jest.fn().mockResolvedValue(null); // No available spaces

      await expect(parkingService.allocateSpace('ABC-1234'))
        .rejects.toThrow('No available parking spaces');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('should throw error when vehicle has active session', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        licensePlate: 'ABC-1234',
        visitCount: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      const mockExistingSession = {
        id: 'existing-session-123',
        vehicleId: 'vehicle-123',
        status: 'active'
      };

      Vehicle.findOne = jest.fn().mockResolvedValue(mockVehicle);
      ParkingSession.findOne = jest.fn().mockResolvedValue(mockExistingSession);

      await expect(parkingService.allocateSpace('ABC-1234'))
        .rejects.toThrow('Vehicle already has an active parking session');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('releaseSpace', () => {
    test('should release parking space successfully', async () => {
      const mockSpace = {
        id: 'space-123',
        spaceNumber: '1A01',
        status: 'occupied',
        update: jest.fn().mockResolvedValue(true)
      };

      ParkingSpace.findByPk = jest.fn().mockResolvedValue(mockSpace);

      const result = await parkingService.releaseSpace('space-123');

      expect(result).toEqual(mockSpace);
      expect(mockSpace.update).toHaveBeenCalledWith(
        { status: 'available' },
        { transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    test('should throw error when space not found', async () => {
      ParkingSpace.findByPk = jest.fn().mockResolvedValue(null);

      await expect(parkingService.releaseSpace('nonexistent'))
        .rejects.toThrow('Parking space not found');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('getAllSpaces', () => {
    test('should return all parking spaces', async () => {
      const mockSpaces = [
        { spaceNumber: '1A01', status: 'available' },
        { spaceNumber: '1A02', status: 'occupied' },
        { spaceNumber: '1A03', status: 'maintenance' }
      ];

      ParkingSpace.findAll = jest.fn().mockResolvedValue(mockSpaces);

      const result = await parkingService.getAllSpaces();

      expect(result).toHaveLength(3);
      expect(ParkingSpace.findAll).toHaveBeenCalledWith({
        order: [['spaceNumber', 'ASC']]
      });
    });
  });

  describe('getSpaceStatistics', () => {
    test('should return space statistics', async () => {
      ParkingSpace.count = jest.fn()
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(60)  // available
        .mockResolvedValueOnce(35)  // occupied
        .mockResolvedValueOnce(3)   // reserved
        .mockResolvedValueOnce(2);  // maintenance

      const result = await parkingService.getSpaceStatistics();

      expect(result).toHaveProperty('total', 100);
      expect(result).toHaveProperty('available', 60);
      expect(result).toHaveProperty('occupied', 35);
      expect(result).toHaveProperty('reserved', 3);
      expect(result).toHaveProperty('maintenance', 2);
      expect(result).toHaveProperty('occupancyRate', '35.00');
    });
  });

  describe('getActiveSessions', () => {
    test('should return active parking sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          status: 'active',
          vehicle: { licensePlate: 'ABC-1234' },
          space: { spaceNumber: '1A01' }
        },
        {
          id: 'session-2',
          status: 'active',
          vehicle: { licensePlate: 'XYZ-9999' },
          space: { spaceNumber: '1A02' }
        }
      ];

      ParkingSession.findAll = jest.fn().mockResolvedValue(mockSessions);

      const result = await parkingService.getActiveSessions();

      expect(result).toHaveLength(2);
      expect(ParkingSession.findAll).toHaveBeenCalledWith({
        where: { status: 'active' },
        include: [
          { association: 'vehicle' },
          { association: 'space' }
        ],
        order: [['entryTime', 'DESC']]
      });
    });
  });
});
