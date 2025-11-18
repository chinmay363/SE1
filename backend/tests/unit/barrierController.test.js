const barrierController = require('../../src/controllers/barrierController');
const barrierService = require('../../src/services/barrierService');

jest.mock('../../src/services/barrierService');

describe('BarrierController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {}
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('openEntry', () => {
    test('should open entry barrier successfully', async () => {
      const mockResult = {
        sessionId: 'session-123',
        barrierStatus: 'open'
      };

      req.body = {
        sessionId: 'session-123'
      };

      barrierService.openEntryBarrier.mockResolvedValue(mockResult);

      await barrierController.openEntry(req, res, next);

      expect(barrierService.openEntryBarrier).toHaveBeenCalledWith('session-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Entry barrier opened',
        data: mockResult
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle errors', async () => {
      const error = new Error('Barrier error');
      req.body = {
        sessionId: 'session-123'
      };

      barrierService.openEntryBarrier.mockRejectedValue(error);

      await barrierController.openEntry(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('openExit', () => {
    test('should open exit barrier successfully', async () => {
      const mockResult = {
        sessionId: 'session-456',
        barrierStatus: 'open'
      };

      req.body = {
        sessionId: 'session-456'
      };

      barrierService.openExitBarrier.mockResolvedValue(mockResult);

      await barrierController.openExit(req, res, next);

      expect(barrierService.openExitBarrier).toHaveBeenCalledWith('session-456');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Exit barrier opened',
        data: mockResult
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle errors', async () => {
      const error = new Error('Exit barrier error');
      req.body = {
        sessionId: 'session-456'
      };

      barrierService.openExitBarrier.mockRejectedValue(error);

      await barrierController.openExit(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
