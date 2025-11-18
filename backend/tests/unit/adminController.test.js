const adminController = require('../../src/controllers/adminController');
const adminService = require('../../src/services/adminService');

jest.mock('../../src/services/adminService');

describe('AdminController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      query: {},
      body: {},
      params: {}
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('getOccupancy', () => {
    test('should return occupancy data successfully', async () => {
      const mockOccupancy = {
        total: 100,
        occupied: 75,
        available: 25
      };

      adminService.getOccupancy.mockResolvedValue(mockOccupancy);

      await adminController.getOccupancy(req, res, next);

      expect(adminService.getOccupancy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockOccupancy
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle errors and call next', async () => {
      const error = new Error('Database error');
      adminService.getOccupancy.mockRejectedValue(error);

      await adminController.getOccupancy(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getRevenue', () => {
    test('should return revenue data with date filters', async () => {
      const mockRevenue = {
        total: 5000,
        breakdown: []
      };

      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      adminService.getRevenue.mockResolvedValue(mockRevenue);

      await adminController.getRevenue(req, res, next);

      expect(adminService.getRevenue).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockRevenue
      });
    });

    test('should return revenue data without date filters', async () => {
      const mockRevenue = {
        total: 10000,
        breakdown: []
      };

      adminService.getRevenue.mockResolvedValue(mockRevenue);

      await adminController.getRevenue(req, res, next);

      expect(adminService.getRevenue).toHaveBeenCalledWith(null, null);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockRevenue
      });
    });

    test('should handle errors', async () => {
      const error = new Error('Service error');
      adminService.getRevenue.mockRejectedValue(error);

      await adminController.getRevenue(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getLogs', () => {
    test('should return logs with filters', async () => {
      const mockLogs = {
        rows: [{ id: 1, message: 'Test log' }],
        count: 1
      };

      req.query = {
        level: 'info',
        action: 'login',
        userId: '123',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        limit: '10',
        offset: '0'
      };

      adminService.getLogs.mockResolvedValue(mockLogs);

      await adminController.getLogs(req, res, next);

      expect(adminService.getLogs).toHaveBeenCalledWith({
        level: 'info',
        action: 'login',
        userId: '123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        limit: '10',
        offset: '0'
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLogs
      });
    });

    test('should handle errors', async () => {
      const error = new Error('Logs error');
      adminService.getLogs.mockRejectedValue(error);

      await adminController.getLogs(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getSystemEvents', () => {
    test('should return system events with filters', async () => {
      const mockEvents = {
        rows: [{ id: 1, eventType: 'error' }],
        count: 1
      };

      req.query = {
        eventType: 'error',
        severity: 'high',
        component: 'lpr',
        resolved: 'true',
        limit: '20',
        offset: '0'
      };

      adminService.getSystemEvents.mockResolvedValue(mockEvents);

      await adminController.getSystemEvents(req, res, next);

      expect(adminService.getSystemEvents).toHaveBeenCalledWith({
        eventType: 'error',
        severity: 'high',
        component: 'lpr',
        resolved: true,
        limit: '20',
        offset: '0'
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockEvents
      });
    });

    test('should handle resolved=false', async () => {
      const mockEvents = { rows: [], count: 0 };

      req.query = {
        resolved: 'false'
      };

      adminService.getSystemEvents.mockResolvedValue(mockEvents);

      await adminController.getSystemEvents(req, res, next);

      expect(adminService.getSystemEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          resolved: false
        })
      );
    });

    test('should handle resolved=undefined', async () => {
      const mockEvents = { rows: [], count: 0 };

      adminService.getSystemEvents.mockResolvedValue(mockEvents);

      await adminController.getSystemEvents(req, res, next);

      expect(adminService.getSystemEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          resolved: undefined
        })
      );
    });

    test('should handle errors', async () => {
      const error = new Error('Events error');
      adminService.getSystemEvents.mockRejectedValue(error);

      await adminController.getSystemEvents(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getTrafficAnalytics', () => {
    test('should return traffic analytics with date range', async () => {
      const mockAnalytics = {
        totalEntries: 100,
        totalExits: 95,
        peakHours: []
      };

      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      adminService.getTrafficAnalytics.mockResolvedValue(mockAnalytics);

      await adminController.getTrafficAnalytics(req, res, next);

      expect(adminService.getTrafficAnalytics).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalytics
      });
    });

    test('should handle errors', async () => {
      const error = new Error('Analytics error');
      adminService.getTrafficAnalytics.mockRejectedValue(error);

      await adminController.getTrafficAnalytics(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('resetSystem', () => {
    test('should reset system successfully', async () => {
      const mockResult = {
        message: 'System reset successful'
      };

      adminService.resetSystem.mockResolvedValue(mockResult);

      await adminController.resetSystem(req, res, next);

      expect(adminService.resetSystem).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    test('should handle errors', async () => {
      const error = new Error('Reset error');
      adminService.resetSystem.mockRejectedValue(error);

      await adminController.resetSystem(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getDashboard', () => {
    test('should return dashboard summary', async () => {
      const mockSummary = {
        occupancy: { total: 100, occupied: 75 },
        revenue: 5000,
        recentEvents: []
      };

      adminService.getDashboardSummary.mockResolvedValue(mockSummary);

      await adminController.getDashboard(req, res, next);

      expect(adminService.getDashboardSummary).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSummary
      });
    });

    test('should handle errors', async () => {
      const error = new Error('Dashboard error');
      adminService.getDashboardSummary.mockRejectedValue(error);

      await adminController.getDashboard(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
