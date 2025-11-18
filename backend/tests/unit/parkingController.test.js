const parkingController = require('../../src/controllers/parkingController');
const parkingService = require('../../src/services/parkingService');

jest.mock('../../src/services/parkingService');

describe('ParkingController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {}
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('allocate', () => {
    test('should allocate parking space successfully', async () => {
      const mockResult = {
        session: { id: 'session-123' },
        space: { spaceNumber: '1A01' },
        vehicle: { licensePlate: 'ABC-1234' }
      };

      req.body = {
        licensePlate: 'ABC-1234'
      };

      parkingService.allocateSpace.mockResolvedValue(mockResult);

      await parkingController.allocate(req, res, next);

      expect(parkingService.allocateSpace).toHaveBeenCalledWith('ABC-1234', {});
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Parking space allocated',
        data: mockResult
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should allocate parking space with preferences', async () => {
      const mockResult = {
        session: { id: 'session-123' },
        space: { spaceNumber: '2B05' },
        vehicle: { licensePlate: 'XYZ-9999' }
      };

      req.body = {
        licensePlate: 'XYZ-9999',
        preferredZone: 'B',
        preferredFloor: 2
      };

      parkingService.allocateSpace.mockResolvedValue(mockResult);

      await parkingController.allocate(req, res, next);

      expect(parkingService.allocateSpace).toHaveBeenCalledWith('XYZ-9999', {
        zone: 'B',
        floor: 2
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Parking space allocated',
        data: mockResult
      });
    });

    test('should handle errors', async () => {
      const error = new Error('No spaces available');
      req.body = {
        licensePlate: 'ABC-1234'
      };

      parkingService.allocateSpace.mockRejectedValue(error);

      await parkingController.allocate(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('releaseSpace', () => {
    test('should release parking space successfully', async () => {
      const mockResult = {
        id: 'space-123',
        spaceNumber: '1A01',
        status: 'available'
      };

      req.body = {
        spaceId: 'space-123'
      };

      parkingService.releaseSpace.mockResolvedValue(mockResult);

      await parkingController.releaseSpace(req, res, next);

      expect(parkingService.releaseSpace).toHaveBeenCalledWith('space-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Parking space released',
        data: mockResult
      });
    });

    test('should handle errors', async () => {
      const error = new Error('Space not found');
      req.body = {
        spaceId: 'space-123'
      };

      parkingService.releaseSpace.mockRejectedValue(error);

      await parkingController.releaseSpace(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getAllSpaces', () => {
    test('should return all parking spaces', async () => {
      const mockSpaces = [
        { spaceNumber: '1A01', status: 'available' },
        { spaceNumber: '1A02', status: 'occupied' }
      ];

      parkingService.getAllSpaces.mockResolvedValue(mockSpaces);

      await parkingController.getAllSpaces(req, res, next);

      expect(parkingService.getAllSpaces).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSpaces
      });
    });

    test('should handle errors', async () => {
      const error = new Error('Database error');

      parkingService.getAllSpaces.mockRejectedValue(error);

      await parkingController.getAllSpaces(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getStatistics', () => {
    test('should return parking statistics', async () => {
      const mockStats = {
        total: 100,
        available: 60,
        occupied: 35,
        occupancyRate: '35.00'
      };

      parkingService.getSpaceStatistics.mockResolvedValue(mockStats);

      await parkingController.getStatistics(req, res, next);

      expect(parkingService.getSpaceStatistics).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    test('should handle errors', async () => {
      const error = new Error('Stats error');

      parkingService.getSpaceStatistics.mockRejectedValue(error);

      await parkingController.getStatistics(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getActiveSessions', () => {
    test('should return active parking sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          vehicle: { licensePlate: 'ABC-1234' },
          space: { spaceNumber: '1A01' }
        },
        {
          id: 'session-2',
          vehicle: { licensePlate: 'XYZ-9999' },
          space: { spaceNumber: '1A02' }
        }
      ];

      parkingService.getActiveSessions.mockResolvedValue(mockSessions);

      await parkingController.getActiveSessions(req, res, next);

      expect(parkingService.getActiveSessions).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSessions
      });
    });

    test('should handle errors', async () => {
      const error = new Error('Sessions error');

      parkingService.getActiveSessions.mockRejectedValue(error);

      await parkingController.getActiveSessions(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
