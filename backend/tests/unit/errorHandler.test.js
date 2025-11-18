const { errorHandler, notFound } = require('../../src/middleware/errorHandler');
const logger = require('../../src/utils/logger');

jest.mock('../../src/utils/logger');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      path: '/test/path',
      method: 'GET',
      originalUrl: '/test/path'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    test('should handle error with custom status code', () => {
      const error = new Error('Custom error');
      error.statusCode = 400;

      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledWith('Error occurred:', {
        message: 'Custom error',
        stack: expect.any(String),
        path: '/test/path',
        method: 'GET'
      });

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Custom error'
      });
    });

    test('should handle error with default 500 status code', () => {
      const error = new Error('Server error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error'
      });
    });

    test('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Dev error');
      error.statusCode = 500;

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Dev error',
        stack: expect.any(String)
      });

      process.env.NODE_ENV = originalEnv;
    });

    test('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Prod error');

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Prod error'
      });

      process.env.NODE_ENV = originalEnv;
    });

    test('should use default message when error has no message', () => {
      const error = new Error();
      error.message = '';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal Server Error'
      });
    });
  });

  describe('notFound', () => {
    test('should create 404 error and pass to next middleware', () => {
      req.originalUrl = '/nonexistent/route';

      notFound(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not Found - /nonexistent/route'
        })
      );
    });

    test('should handle different URLs', () => {
      req.originalUrl = '/api/users/999';

      notFound(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not Found - /api/users/999'
        })
      );
    });
  });
});
