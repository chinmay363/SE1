const { validationResult } = require('express-validator');
const { validate } = require('../../src/middleware/validation');

jest.mock('express-validator', () => ({
  ...jest.requireActual('express-validator'),
  validationResult: jest.fn()
}));

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('should call next() when no validation errors', () => {
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });

    validate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should return 400 when validation errors exist', () => {
    const errors = [
      { msg: 'Username is required', param: 'username' }
    ];

    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => errors
    });

    validate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation errors',
      errors
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should include all validation errors in response', () => {
    const errors = [
      { msg: 'Username is required', param: 'username' },
      { msg: 'Password is required', param: 'password' }
    ];

    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => errors
    });

    validate(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining(errors)
      })
    );
  });
});
