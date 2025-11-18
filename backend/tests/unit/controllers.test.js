const lprController = require('../../src/controllers/lprController');
const barrierController = require('../../src/controllers/barrierController');
const parkingController = require('../../src/controllers/parkingController');
const authController = require('../../src/controllers/authController');

const lprService = require('../../src/services/lprService');
const barrierService = require('../../src/services/barrierService');
const parkingService = require('../../src/services/parkingService');
const authService = require('../../src/services/authService');

jest.mock('../../src/services/lprService');
jest.mock('../../src/services/barrierService');
jest.mock('../../src/services/parkingService');
jest.mock('../../src/services/authService');

describe('Controllers', () => {
  let req, res, next;

  beforeEach(() => {
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
    jest.clearAllMocks();
  });

  describe('LPRController', () => {
    describe('identify', () => {
      test('should identify license plate successfully', async () => {
        const mockResult = {
          licensePlate: 'ABC-123',
          confidence: 0.95
        };

        lprService.identifyPlate.mockResolvedValue(mockResult);
        req.body = { image: 'base64image', simulateFailure: false };

        await lprController.identify(req, res, next);

        expect(lprService.identifyPlate).toHaveBeenCalledWith('base64image', false);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'License plate identified',
          data: mockResult
        });
      });

      test('should handle identification failure', async () => {
        const error = new Error('Recognition failed');
        lprService.identifyPlate.mockRejectedValue(error);
        req.body = { image: 'base64image' };

        await lprController.identify(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Recognition failed'
        });
      });

      test('should default simulateFailure to false', async () => {
        lprService.identifyPlate.mockResolvedValue({ licensePlate: 'XYZ-789' });
        req.body = { image: 'base64image' };

        await lprController.identify(req, res, next);

        expect(lprService.identifyPlate).toHaveBeenCalledWith('base64image', false);
      });

      test('should handle error without message', async () => {
        lprService.identifyPlate.mockRejectedValue(new Error());
        req.body = { image: 'base64image' };

        await lprController.identify(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'License plate recognition failed'
        });
      });
    });
  });

  describe('BarrierController', () => {
    describe('openEntry', () => {
      test('should open entry barrier successfully', async () => {
        const mockResult = { success: true, message: 'Barrier opened' };
        barrierService.openEntryBarrier.mockResolvedValue(mockResult);
        req.body = { sessionId: 'session-123' };

        await barrierController.openEntry(req, res, next);

        expect(barrierService.openEntryBarrier).toHaveBeenCalledWith('session-123');
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Entry barrier opened',
          data: mockResult
        });
      });

      test('should handle entry barrier error', async () => {
        const error = new Error('Barrier malfunction');
        barrierService.openEntryBarrier.mockRejectedValue(error);
        req.body = { sessionId: 'session-123' };

        await barrierController.openEntry(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
      });
    });

    describe('openExit', () => {
      test('should open exit barrier successfully', async () => {
        const mockResult = { success: true, message: 'Exit opened' };
        barrierService.openExitBarrier.mockResolvedValue(mockResult);
        req.body = { sessionId: 'session-456' };

        await barrierController.openExit(req, res, next);

        expect(barrierService.openExitBarrier).toHaveBeenCalledWith('session-456');
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Exit barrier opened',
          data: mockResult
        });
      });

      test('should handle exit barrier error', async () => {
        const error = new Error('Barrier error');
        barrierService.openExitBarrier.mockRejectedValue(error);
        req.body = { sessionId: 'session-456' };

        await barrierController.openExit(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('ParkingController', () => {
    describe('allocate', () => {
      test('should allocate space successfully without preferences', async () => {
        const mockResult = { space: { id: '123' }, session: { id: 'session-789' } };
        parkingService.allocateSpace.mockResolvedValue(mockResult);
        req.body = { licensePlate: 'ABC-123' };

        await parkingController.allocate(req, res, next);

        expect(parkingService.allocateSpace).toHaveBeenCalledWith('ABC-123', {});
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Parking space allocated',
          data: mockResult
        });
      });

      test('should handle allocation error', async () => {
        const error = new Error('No spaces available');
        parkingService.allocateSpace.mockRejectedValue(error);
        req.body = { licensePlate: 'ABC-123' };

        await parkingController.allocate(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
      });

      test('should pass preferred zone and floor', async () => {
        parkingService.allocateSpace.mockResolvedValue({});
        req.body = { licensePlate: 'ABC-123', preferredZone: 'A', preferredFloor: 1 };

        await parkingController.allocate(req, res, next);

        expect(parkingService.allocateSpace).toHaveBeenCalledWith('ABC-123', { zone: 'A', floor: 1 });
      });

      test('should pass only zone when floor not provided', async () => {
        parkingService.allocateSpace.mockResolvedValue({});
        req.body = { licensePlate: 'ABC-123', preferredZone: 'B' };

        await parkingController.allocate(req, res, next);

        expect(parkingService.allocateSpace).toHaveBeenCalledWith('ABC-123', { zone: 'B' });
      });
    });

    describe('getAllSpaces', () => {
      test('should get all spaces', async () => {
        const mockSpaces = [{ id: '1', status: 'available' }];
        parkingService.getAllSpaces.mockResolvedValue(mockSpaces);

        await parkingController.getAllSpaces(req, res, next);

        expect(parkingService.getAllSpaces).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          data: mockSpaces
        });
      });

      test('should handle get spaces error', async () => {
        const error = new Error('Database error');
        parkingService.getAllSpaces.mockRejectedValue(error);

        await parkingController.getAllSpaces(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
      });
    });

    describe('releaseSpace', () => {
      test('should release space successfully', async () => {
        const mockResult = { space: { id: '123', status: 'available' } };
        parkingService.releaseSpace.mockResolvedValue(mockResult);
        req.body = { spaceId: '123' };

        await parkingController.releaseSpace(req, res, next);

        expect(parkingService.releaseSpace).toHaveBeenCalledWith('123');
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Parking space released',
          data: mockResult
        });
      });

      test('should handle release error', async () => {
        const error = new Error('Space not found');
        parkingService.releaseSpace.mockRejectedValue(error);
        req.body = { spaceId: '123' };

        await parkingController.releaseSpace(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
      });
    });

    describe('getStatistics', () => {
      test('should get space statistics', async () => {
        const mockStats = { total: 100, available: 50, occupied: 50 };
        parkingService.getSpaceStatistics.mockResolvedValue(mockStats);

        await parkingController.getStatistics(req, res, next);

        expect(parkingService.getSpaceStatistics).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          data: mockStats
        });
      });

      test('should handle statistics error', async () => {
        const error = new Error('Query failed');
        parkingService.getSpaceStatistics.mockRejectedValue(error);

        await parkingController.getStatistics(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
      });
    });

    describe('getActiveSessions', () => {
      test('should get active sessions', async () => {
        const mockSessions = [{ id: 'session-1', status: 'active' }];
        parkingService.getActiveSessions.mockResolvedValue(mockSessions);

        await parkingController.getActiveSessions(req, res, next);

        expect(parkingService.getActiveSessions).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          data: mockSessions
        });
      });

      test('should handle active sessions error', async () => {
        const error = new Error('Database error');
        parkingService.getActiveSessions.mockRejectedValue(error);

        await parkingController.getActiveSessions(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('AuthController', () => {
    describe('login', () => {
      test('should login successfully with ip and user agent', async () => {
        const mockResult = { token: 'jwt-token', user: { id: '1', username: 'admin' } };
        authService.login.mockResolvedValue(mockResult);
        req.body = { username: 'admin', password: 'password123' };
        req.ip = '127.0.0.1';
        req.get = jest.fn().mockReturnValue('Mozilla/5.0');

        await authController.login(req, res, next);

        expect(authService.login).toHaveBeenCalledWith('admin', 'password123', '127.0.0.1', 'Mozilla/5.0');
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Login successful',
          data: mockResult
        });
      });

      test('should handle login error', async () => {
        const error = new Error('Invalid credentials');
        authService.login.mockRejectedValue(error);
        req.body = { username: 'admin', password: 'wrong' };
        req.ip = '127.0.0.1';
        req.get = jest.fn().mockReturnValue('Mozilla/5.0');

        await authController.login(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
      });
    });

    describe('getProfile', () => {
      test('should get user profile successfully', async () => {
        const mockUser = {
          id: '1',
          username: 'testuser',
          toJSON: jest.fn().mockReturnValue({ id: '1', username: 'testuser' })
        };
        authService.getUserById.mockResolvedValue(mockUser);
        req.user = { id: '1' };

        await authController.getProfile(req, res, next);

        expect(authService.getUserById).toHaveBeenCalledWith('1');
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          data: { id: '1', username: 'testuser' }
        });
      });

      test('should return 404 when user not found', async () => {
        authService.getUserById.mockResolvedValue(null);
        req.user = { id: '999' };

        await authController.getProfile(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'User not found'
        });
      });

      test('should handle get profile error', async () => {
        const error = new Error('Database error');
        authService.getUserById.mockRejectedValue(error);
        req.user = { id: '1' };

        await authController.getProfile(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
      });
    });
  });
});
