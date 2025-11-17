const { authenticate, authorize } = require('../../src/middleware/auth');
const { verifyAccessToken } = require('../../src/utils/jwt');

jest.mock('../../src/utils/jwt');
jest.mock('../../src/utils/logger', () => ({
  error: jest.fn()
}));

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    test('should authenticate valid token', () => {
      const mockUser = { id: '123', username: 'test', role: 'admin' };
      req.headers.authorization = 'Bearer valid-token';
      verifyAccessToken.mockReturnValue(mockUser);

      authenticate(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject request without token', () => {
      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject invalid token format', () => {
      req.headers.authorization = 'InvalidFormat token';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided'
      });
    });

    test('should reject expired token', () => {
      req.headers.authorization = 'Bearer expired-token';
      verifyAccessToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
    });
  });

  describe('authorize', () => {
    test('should authorize user with correct role', () => {
      req.user = { id: '123', role: 'admin' };
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject user with incorrect role', () => {
      req.user = { id: '123', role: 'technician' };
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should authorize user with any of multiple roles', () => {
      req.user = { id: '123', role: 'technician' };
      const middleware = authorize('admin', 'technician');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should reject unauthenticated request', () => {
      req.user = null;
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authenticated'
      });
    });
  });
});
