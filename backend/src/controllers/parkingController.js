const parkingService = require('../services/parkingService');

class ParkingController {
  async allocate(req, res, next) {
    try {
      const { licensePlate, preferredZone, preferredFloor } = req.body;

      const preferences = {};
      if (preferredZone) preferences.zone = preferredZone;
      if (preferredFloor) preferences.floor = preferredFloor;

      const result = await parkingService.allocateSpace(licensePlate, preferences);

      res.json({
        success: true,
        message: 'Parking space allocated',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async releaseSpace(req, res, next) {
    try {
      const { spaceId } = req.body;

      const result = await parkingService.releaseSpace(spaceId);

      res.json({
        success: true,
        message: 'Parking space released',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllSpaces(req, res, next) {
    try {
      const spaces = await parkingService.getAllSpaces();

      res.json({
        success: true,
        data: spaces
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req, res, next) {
    try {
      const stats = await parkingService.getSpaceStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveSessions(req, res, next) {
    try {
      const sessions = await parkingService.getActiveSessions();

      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ParkingController();
