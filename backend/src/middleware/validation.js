const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

const loginValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const identifyValidation = [
  body('image').notEmpty().withMessage('Image is required'),
  body('simulateFailure').optional().isBoolean(),
  validate
];

const allocateValidation = [
  body('licensePlate').notEmpty().withMessage('License plate is required'),
  body('preferredZone').optional().isString(),
  body('preferredFloor').optional().isInt(),
  validate
];

const releaseSpaceValidation = [
  body('spaceId').notEmpty().withMessage('Space ID is required').isUUID(),
  validate
];

const createPaymentValidation = [
  body('sessionId')
    .notEmpty().withMessage('Session ID is required')
    .isUUID().withMessage('Session ID must be a valid UUID'),
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['cash', 'card', 'digital_wallet', 'mobile'])
    .withMessage('Payment method must be one of: cash, card, digital_wallet, mobile'),
  validate
];

const confirmPaymentValidation = [
  body('paymentId').notEmpty().withMessage('Payment ID is required').isUUID(),
  validate
];

module.exports = {
  validate,
  loginValidation,
  identifyValidation,
  allocateValidation,
  releaseSpaceValidation,
  createPaymentValidation,
  confirmPaymentValidation
};
