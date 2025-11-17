const express = require('express');
const router = express.Router();
const barrierController = require('../controllers/barrierController');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');

router.post('/entry',
  [body('sessionId').notEmpty().isUUID(), validate],
  barrierController.openEntry
);

router.post('/exit',
  [body('sessionId').notEmpty().isUUID(), validate],
  barrierController.openExit
);

module.exports = router;
