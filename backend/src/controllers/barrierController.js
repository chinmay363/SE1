const barrierService = require('../services/barrierService');

class BarrierController {
  async openEntry(req, res, next) {
    try {
      const { sessionId } = req.body;

      const result = await barrierService.openEntryBarrier(sessionId);

      res.json({
        success: true,
        message: 'Entry barrier opened',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async openExit(req, res, next) {
    try {
      const { sessionId } = req.body;

      const result = await barrierService.openExitBarrier(sessionId);

      res.json({
        success: true,
        message: 'Exit barrier opened',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BarrierController();
