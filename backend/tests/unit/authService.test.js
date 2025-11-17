const authService = require('../../src/services/authService');
const { User, Log } = require('../../src/models');
const { generateAccessToken, generateRefreshToken } = require('../../src/utils/jwt');

jest.mock('../../src/models');
jest.mock('../../src/utils/jwt');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    test('should login user with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        isActive: true,
        validatePassword: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({ id: 'user-123', username: 'testuser' })
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      Log.create = jest.fn().mockResolvedValue({});
      generateAccessToken.mockReturnValue('access-token');
      generateRefreshToken.mockReturnValue('refresh-token');

      const result = await authService.login('testuser', 'password123', '127.0.0.1', 'TestAgent');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(mockUser.validatePassword).toHaveBeenCalledWith('password123');
      expect(mockUser.update).toHaveBeenCalled();
      expect(Log.create).toHaveBeenCalled();
    });

    test('should throw error for non-existent user', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      Log.create = jest.fn().mockResolvedValue({});

      await expect(
        authService.login('nonexistent', 'password', '127.0.0.1', 'TestAgent')
      ).rejects.toThrow('Invalid credentials');

      expect(Log.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login_failed',
          message: 'User not found'
        })
      );
    });

    test('should throw error for inactive user', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        isActive: false
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      Log.create = jest.fn().mockResolvedValue({});

      await expect(
        authService.login('testuser', 'password', '127.0.0.1', 'TestAgent')
      ).rejects.toThrow('Account is inactive');

      expect(Log.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login_failed',
          message: 'User inactive'
        })
      );
    });

    test('should throw error for invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        isActive: true,
        validatePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      Log.create = jest.fn().mockResolvedValue({});

      await expect(
        authService.login('testuser', 'wrongpassword', '127.0.0.1', 'TestAgent')
      ).rejects.toThrow('Invalid credentials');

      expect(mockUser.validatePassword).toHaveBeenCalledWith('wrongpassword');
      expect(Log.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login_failed',
          message: 'Invalid password'
        })
      );
    });
  });

  describe('getUserById', () => {
    test('should return user by ID', async () => {
      const mockUser = { id: 'user-123', username: 'testuser' };
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.getUserById('user-123');

      expect(result).toEqual(mockUser);
      expect(User.findByPk).toHaveBeenCalledWith('user-123');
    });

    test('should return null for non-existent user', async () => {
      User.findByPk = jest.fn().mockResolvedValue(null);

      const result = await authService.getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('logAuthAttempt', () => {
    test('should log successful auth attempt', async () => {
      Log.create = jest.fn().mockResolvedValue({});

      await authService.logAuthAttempt('user-123', 'login_success', '127.0.0.1', 'TestAgent');

      expect(Log.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          level: 'info',
          action: 'login_success',
          resource: 'auth',
          ipAddress: '127.0.0.1',
          userAgent: 'TestAgent'
        })
      );
    });

    test('should log failed auth attempt', async () => {
      Log.create = jest.fn().mockResolvedValue({});

      await authService.logAuthAttempt('user-123', 'login_failed', '127.0.0.1', 'TestAgent', 'Invalid password');

      expect(Log.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          level: 'warn',
          action: 'login_failed',
          message: 'Invalid password'
        })
      );
    });

    test('should handle logging errors gracefully', async () => {
      Log.create = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        authService.logAuthAttempt('user-123', 'login_success', '127.0.0.1', 'TestAgent')
      ).resolves.not.toThrow();
    });
  });
});
