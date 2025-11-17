const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

router.post('/login', loginValidation, authController.login);
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
