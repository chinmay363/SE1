const authController = require('../../src/controllers/authController');
const authService = require('../../src/services/authService');

jest.mock('../../src/services/authService');

describe('AuthController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      user: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent')
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('login', () => {
    test('should login successfully', async () => {
      const mockResult = {
        user: { id: '123', username: 'testuser' },
        token: 'jwt-token-123'
      };

      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      authService.login.mockResolvedValue(mockResult);

      await authController.login(req, res, next);

      expect(authService.login).toHaveBeenCalledWith(
        'testuser',
        'password123',
        '127.0.0.1',
        'test-user-agent'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: mockResult
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle login errors', async () => {
      const error = new Error('Invalid credentials');
      req.body = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      authService.login.mockRejectedValue(error);

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    test('should return user profile successfully', async () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        toJSON: jest.fn().mockReturnValue({
          id: '123',
          username: 'testuser',
          email: 'test@example.com'
        })
      };

      req.user = { id: '123' };

      authService.getUserById.mockResolvedValue(mockUser);

      await authController.getProfile(req, res, next);

      expect(authService.getUserById).toHaveBeenCalledWith('123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser.toJSON()
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 404 when user not found', async () => {
      req.user = { id: '123' };

      authService.getUserById.mockResolvedValue(null);

      await authController.getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle errors', async () => {
      const error = new Error('Database error');
      req.user = { id: '123' };

      authService.getUserById.mockRejectedValue(error);

      await authController.getProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
