const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} = require('../../src/utils/jwt');

describe('JWT Utilities', () => {
  const mockUser = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    role: 'admin'
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  describe('generateAccessToken', () => {
    test('should generate a valid access token', () => {
      const token = generateAccessToken(mockUser);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });

    test('should include user data in token payload', () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyAccessToken(token);

      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });
  });

  describe('generateRefreshToken', () => {
    test('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockUser);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });

    test('should include minimal user data in refresh token', () => {
      const token = generateRefreshToken(mockUser);
      const decoded = verifyRefreshToken(token);

      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.username).toBe(mockUser.username);
    });
  });

  describe('verifyAccessToken', () => {
    test('should verify valid access token', () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyAccessToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded.id).toBe(mockUser.id);
    });

    test('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token'))
        .toThrow('Invalid or expired access token');
    });
  });

  describe('verifyRefreshToken', () => {
    test('should verify valid refresh token', () => {
      const token = generateRefreshToken(mockUser);
      const decoded = verifyRefreshToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded.id).toBe(mockUser.id);
    });

    test('should throw error for invalid refresh token', () => {
      expect(() => verifyRefreshToken('invalid-token'))
        .toThrow('Invalid or expired refresh token');
    });
  });
});
