const express = require('express');
const router = express.Router();
const lprController = require('../controllers/lprController');
const { identifyValidation } = require('../middleware/validation');

router.post('/identify', identifyValidation, lprController.identify);

module.exports = router;
