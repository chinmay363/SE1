const { User, Log } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Login user
   * @param {string} username
   * @param {string} password
   * @param {string} ipAddress
   * @param {string} userAgent
   * @returns {Promise<Object>}
   */
  async login(username, password, ipAddress, userAgent) {
    try {
      // Find user
      const user = await User.findOne({ where: { username } });

      if (!user) {
        await this.logAuthAttempt(null, 'login_failed', ipAddress, userAgent, 'User not found');
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        await this.logAuthAttempt(user.id, 'login_failed', ipAddress, userAgent, 'User inactive');
        throw new Error('Account is inactive');
      }

      // Validate password
      const isValid = await user.validatePassword(password);

      if (!isValid) {
        await this.logAuthAttempt(user.id, 'login_failed', ipAddress, userAgent, 'Invalid password');
        throw new Error('Invalid credentials');
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Log successful login
      await this.logAuthAttempt(user.id, 'login_success', ipAddress, userAgent);

      logger.info('User logged in:', { userId: user.id, username: user.username });

      return {
        user: user.toJSON(),
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Log authentication attempt
   */
  async logAuthAttempt(userId, action, ipAddress, userAgent, message = '') {
    try {
      await Log.create({
        userId,
        level: action.includes('failed') ? 'warn' : 'info',
        action,
        resource: 'auth',
        message: message || action,
        ipAddress,
        userAgent,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to log auth attempt:', error);
    }
  }

  /**
   * Get user by ID
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getUserById(userId) {
    return await User.findByPk(userId);
  }
}

module.exports = new AuthService();
