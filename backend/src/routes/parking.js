const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');
const { allocateValidation, releaseSpaceValidation } = require('../middleware/validation');

router.post('/allocate', allocateValidation, parkingController.allocate);
router.post('/spaces/release', releaseSpaceValidation, parkingController.releaseSpace);
router.get('/spaces', parkingController.getAllSpaces);
router.get('/statistics', parkingController.getStatistics);
router.get('/sessions/active', parkingController.getActiveSessions);

module.exports = router;
