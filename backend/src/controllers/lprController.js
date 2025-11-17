const lprService = require('../services/lprService');

class LPRController {
  async identify(req, res, next) {
    try {
      const { image, simulateFailure } = req.body;

      const result = await lprService.identifyPlate(image, simulateFailure || false);

      res.json({
        success: true,
        message: 'License plate identified',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'License plate recognition failed'
      });
    }
  }
}

module.exports = new LPRController();
