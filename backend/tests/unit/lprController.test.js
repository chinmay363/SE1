const lprController = require('../../src/controllers/lprController');
const lprService = require('../../src/services/lprService');

jest.mock('../../src/services/lprService');

describe('LPRController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {}
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('identify', () => {
    test('should identify license plate successfully', async () => {
      const mockResult = {
        plateNumber: 'ABC-1234',
        confidence: 0.95
      };

      req.body = {
        image: 'base64-image-data'
      };

      lprService.identifyPlate.mockResolvedValue(mockResult);

      await lprController.identify(req, res, next);

      expect(lprService.identifyPlate).toHaveBeenCalledWith('base64-image-data', false);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'License plate identified',
        data: mockResult
      });
    });

    test('should handle simulateFailure flag', async () => {
      const mockResult = {
        plateNumber: 'XYZ-9999',
        confidence: 0.85
      };

      req.body = {
        image: 'base64-image-data',
        simulateFailure: true
      };

      lprService.identifyPlate.mockResolvedValue(mockResult);

      await lprController.identify(req, res, next);

      expect(lprService.identifyPlate).toHaveBeenCalledWith('base64-image-data', true);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'License plate identified',
        data: mockResult
      });
    });

    test('should handle errors and return 500', async () => {
      const error = new Error('Recognition failed');
      req.body = {
        image: 'base64-image-data'
      };

      lprService.identifyPlate.mockRejectedValue(error);

      await lprController.identify(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Recognition failed'
      });
    });

    test('should handle errors with no message', async () => {
      const error = new Error();
      req.body = {
        image: 'base64-image-data'
      };

      lprService.identifyPlate.mockRejectedValue(error);

      await lprController.identify(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'License plate recognition failed'
      });
    });
  });
});
