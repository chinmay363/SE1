const parkingService = require('../../src/services/parkingService');
const { ParkingSpace, ParkingSession, Vehicle, SystemEvent } = require('../../src/models');

jest.mock('../../src/models');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('ParkingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('allocateSpace', () => {
    test('should allocate parking space successfully', async () => {
      const mockSpace = {
        id: 'space-123',
        spaceNumber: '1A01',
        floor: 1,
        zone: 'A',
        status: 'available',
        update: jest.fn().mockResolvedValue(true)
      };

      const mockVehicle = {
        id: 'vehicle-123',
        licensePlate: 'ABC-1234'
      };

      const mockSession = {
        id: 'session-123',
        vehicleId: 'vehicle-123',
        spaceId: 'space-123'
      };

      ParkingSpace.findOne = jest.fn().mockResolvedValue(mockSpace);
      Vehicle.findOrCreate = jest.fn().mockResolvedValue([mockVehicle, true]);
      ParkingSession.create = jest.fn().mockResolvedValue(mockSession);
      ParkingSession.findByPk = jest.fn().mockResolvedValue({
        ...mockSession,
        space: mockSpace,
        vehicle: mockVehicle
      });
      SystemEvent.create = jest.fn().mockResolvedValue({});

      const result = await parkingService.allocateSpace('ABC-1234');

      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('space');
      expect(ParkingSpace.findOne).toHaveBeenCalled();
      expect(mockSpace.update).toHaveBeenCalledWith({ status: 'occupied' });
    });

    test('should throw error when no spaces available', async () => {
      ParkingSpace.findOne = jest.fn().mockResolvedValue(null);
      SystemEvent.create = jest.fn().mockResolvedValue({});

      await expect(parkingService.allocateSpace('ABC-1234'))
        .rejects.toThrow('No parking spaces available');
    });
  });

  describe('getAvailableSpaces', () => {
    test('should return list of available spaces', async () => {
      const mockSpaces = [
        { spaceNumber: '1A01', status: 'available' },
        { spaceNumber: '1A02', status: 'available' }
      ];

      ParkingSpace.findAll = jest.fn().mockResolvedValue(mockSpaces);

      const result = await parkingService.getAvailableSpaces();

      expect(result).toHaveLength(2);
      expect(ParkingSpace.findAll).toHaveBeenCalledWith({
        where: { status: 'available' },
        order: [['spaceNumber', 'ASC']]
      });
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
      expect(ParkingSpace.findAll).toHaveBeenCalled();
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

  describe('getSessionById', () => {
    test('should return session by ID', async () => {
      const mockSession = {
        id: 'session-123',
        status: 'active',
        vehicle: { licensePlate: 'ABC-1234' },
        space: { spaceNumber: '1A01' }
      };

      ParkingSession.findByPk = jest.fn().mockResolvedValue(mockSession);

      const result = await parkingService.getSessionById('session-123');

      expect(result).toEqual(mockSession);
      expect(ParkingSession.findByPk).toHaveBeenCalledWith('session-123', {
        include: [
          { association: 'vehicle' },
          { association: 'space' }
        ]
      });
    });

    test('should return null for non-existent session', async () => {
      ParkingSession.findByPk = jest.fn().mockResolvedValue(null);

      const result = await parkingService.getSessionById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
