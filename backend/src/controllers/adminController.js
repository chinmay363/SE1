const adminService = require('../services/adminService');

class AdminController {
  async getOccupancy(req, res, next) {
    try {
      const occupancy = await adminService.getOccupancy();

      res.json({
        success: true,
        data: occupancy
      });
    } catch (error) {
      next(error);
    }
  }

  async getRevenue(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const revenue = await adminService.getRevenue(start, end);

      res.json({
        success: true,
        data: revenue
      });
    } catch (error) {
      next(error);
    }
  }

  async getLogs(req, res, next) {
    try {
      const filters = {
        level: req.query.level,
        action: req.query.action,
        userId: req.query.userId,
        startDate: req.query.startDate ? new Date(req.query.startDate) : null,
        endDate: req.query.endDate ? new Date(req.query.endDate) : null,
        limit: req.query.limit,
        offset: req.query.offset
      };

      const logs = await adminService.getLogs(filters);

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }

  async getSystemEvents(req, res, next) {
    try {
      const filters = {
        eventType: req.query.eventType,
        severity: req.query.severity,
        component: req.query.component,
        resolved: req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined,
        limit: req.query.limit,
        offset: req.query.offset
      };

      const events = await adminService.getSystemEvents(filters);

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  async getTrafficAnalytics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const analytics = await adminService.getTrafficAnalytics(start, end);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }

  async resetSystem(req, res, next) {
    try {
      const result = await adminService.resetSystem();

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req, res, next) {
    try {
      const summary = await adminService.getDashboardSummary();

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
