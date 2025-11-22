const { ParkingSpace, ParkingSession, Transaction, Log, SystemEvent, Vehicle, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// ============================================================================
// ADMIN SERVICE CONFIGURATION
// ============================================================================

const ADMIN_CONFIG = {
  CACHE_TTL_MS: 5000, // 5 seconds cache for occupancy data
  DEFAULT_PAGE_SIZE: 100,
  MAX_PAGE_SIZE: 1000,
  REVENUE_CACHE_TTL_MS: 60000, // 1 minute cache for revenue data
};

// Simple in-memory cache
const cache = {
  occupancy: { data: null, timestamp: 0 },
  revenue: new Map(), // Key: startDate-endDate
};

// ============================================================================
// ADMIN SERVICE CLASS
// ============================================================================

class AdminService {
  /**
   * Check if cached data is still valid
   * @param {number} timestamp - Cache timestamp
   * @param {number} ttl - Time to live in milliseconds
   * @returns {boolean}
   */
  isCacheValid(timestamp, ttl) {
    return Date.now() - timestamp < ttl;
  }

  /**
   * Clear all caches
   */
  clearCache() {
    cache.occupancy = { data: null, timestamp: 0 };
    cache.revenue.clear();
    logger.info('Admin service cache cleared');
  }
  /**
   * Get real-time occupancy data with caching
   * @param {boolean} skipCache - Skip cache and fetch fresh data
   * @returns {Promise<Object>}
   */
  async getOccupancy(skipCache = false) {
    // Check cache first
    if (!skipCache && this.isCacheValid(cache.occupancy.timestamp, ADMIN_CONFIG.CACHE_TTL_MS)) {
      logger.debug('Returning cached occupancy data');
      return cache.occupancy.data;
    }

    try {
      // Optimized single query to get all status counts
      const statusCounts = await ParkingSpace.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      // Convert array to object for easy access
      const counts = {
        total: 0,
        available: 0,
        occupied: 0,
        reserved: 0,
        maintenance: 0
      };

      statusCounts.forEach(item => {
        const status = item.status;
        const count = parseInt(item.count, 10);
        counts[status] = count;
        counts.total += count;
      });

      // Get occupancy by floor and zone (optimized query)
      const byFloorAndZone = await ParkingSpace.findAll({
        attributes: [
          'floor',
          'zone',
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['floor', 'zone', 'status'],
        order: [['floor', 'ASC'], ['zone', 'ASC']],
        raw: true
      });

      const occupancyRate = counts.total > 0
        ? ((counts.occupied / counts.total) * 100).toFixed(2)
        : '0.00';

      const result = {
        ...counts,
        occupancyRate,
        byFloorAndZone,
        timestamp: new Date(),
        cached: false
      };

      // Update cache
      cache.occupancy = {
        data: { ...result, cached: true },
        timestamp: Date.now()
      };

      logger.debug('Fetched fresh occupancy data');
      return result;
    } catch (error) {
      logger.error('Error fetching occupancy data:', error);
      throw new Error(`Failed to fetch occupancy data: ${error.message}`);
    }
  }

  /**
   * Get revenue statistics with caching and optimization
   * @param {Date} startDate
   * @param {Date} endDate
   * @param {boolean} skipCache - Skip cache and fetch fresh data
   * @returns {Promise<Object>}
   */
  async getRevenue(startDate, endDate, skipCache = false) {
    const start = startDate || new Date(0);
    const end = endDate || new Date();
    const cacheKey = `${start.toISOString()}-${end.toISOString()}`;

    // Check cache first
    if (!skipCache && cache.revenue.has(cacheKey)) {
      const cached = cache.revenue.get(cacheKey);
      if (this.isCacheValid(cached.timestamp, ADMIN_CONFIG.REVENUE_CACHE_TTL_MS)) {
        logger.debug('Returning cached revenue data');
        return cached.data;
      }
    }

    try {
      const where = {
        status: 'completed',
        transactionDate: {
          [Op.between]: [start, end]
        }
      };

      // Optimized single query to get all aggregate data
      const aggregates = await Transaction.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalRevenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount'],
          [sequelize.fn('AVG', sequelize.col('amount')), 'averageTransaction'],
          [sequelize.fn('MIN', sequelize.col('amount')), 'minTransaction'],
          [sequelize.fn('MAX', sequelize.col('amount')), 'maxTransaction']
        ],
        where,
        raw: true
      });

      const totalRevenue = parseFloat(aggregates.totalRevenue || 0);
      const transactionCount = parseInt(aggregates.transactionCount || 0, 10);
      const averageTransaction = parseFloat(aggregates.averageTransaction || 0);

      // Revenue by date (optimized)
      const revenueByDate = await Transaction.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('transaction_date')), 'date'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where,
        group: [sequelize.fn('DATE', sequelize.col('transaction_date'))],
        order: [[sequelize.fn('DATE', sequelize.col('transaction_date')), 'ASC']],
        raw: true
      });

      // Revenue by payment method (optimized)
      const revenueByMethod = await Transaction.findAll({
        attributes: [
          'paymentMethod',
          [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('AVG', sequelize.col('amount')), 'average']
        ],
        where,
        group: ['paymentMethod'],
        order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']],
        raw: true
      });

      const result = {
        totalRevenue: totalRevenue.toFixed(2),
        transactionCount,
        averageTransaction: averageTransaction.toFixed(2),
        minTransaction: parseFloat(aggregates.minTransaction || 0).toFixed(2),
        maxTransaction: parseFloat(aggregates.maxTransaction || 0).toFixed(2),
        revenueByDate,
        revenueByMethod,
        period: {
          start: startDate || 'beginning',
          end: endDate || 'now'
        },
        cached: false
      };

      // Update cache
      cache.revenue.set(cacheKey, {
        data: { ...result, cached: true },
        timestamp: Date.now()
      });

      // Clean old cache entries (keep last 10)
      if (cache.revenue.size > 10) {
        const firstKey = cache.revenue.keys().next().value;
        cache.revenue.delete(firstKey);
      }

      logger.debug('Fetched fresh revenue data');
      return result;
    } catch (error) {
      logger.error('Error fetching revenue data:', error);
      throw new Error(`Failed to fetch revenue data: ${error.message}`);
    }
  }

  /**
   * Get system logs
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  async getLogs(filters = {}) {
    const where = {};

    if (filters.level) {
      where.level = filters.level;
    }

    if (filters.action) {
      where.action = { [Op.like]: `%${filters.action}%` };
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.startDate && filters.endDate) {
      where.timestamp = {
        [Op.between]: [filters.startDate, filters.endDate]
      };
    }

    const limit = parseInt(filters.limit) || 100;
    const offset = parseInt(filters.offset) || 0;

    const { count, rows } = await Log.findAndCountAll({
      where,
      include: [{ association: 'user', attributes: ['username', 'email'] }],
      order: [['timestamp', 'DESC']],
      limit,
      offset
    });

    return {
      total: count,
      logs: rows,
      limit,
      offset
    };
  }

  /**
   * Get system events
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  async getSystemEvents(filters = {}) {
    const where = {};

    if (filters.eventType) {
      where.eventType = filters.eventType;
    }

    if (filters.severity) {
      where.severity = filters.severity;
    }

    if (filters.component) {
      where.component = filters.component;
    }

    if (filters.resolved !== undefined) {
      where.resolved = filters.resolved;
    }

    const limit = parseInt(filters.limit) || 100;
    const offset = parseInt(filters.offset) || 0;

    const { count, rows } = await SystemEvent.findAndCountAll({
      where,
      order: [['timestamp', 'DESC']],
      limit,
      offset
    });

    return {
      total: count,
      events: rows,
      limit,
      offset
    };
  }

  /**
   * Get traffic analytics
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Object>}
   */
  async getTrafficAnalytics(startDate, endDate) {
    const where = {
      entryTime: {
        [Op.between]: [startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), endDate || new Date()]
      }
    };

    // Sessions by hour
    const sessionsByHour = await ParkingSession.findAll({
      attributes: [
        [sequelize.fn('HOUR', sequelize.col('entry_time')), 'hour'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where,
      group: [sequelize.fn('HOUR', sequelize.col('entry_time'))],
      order: [[sequelize.fn('HOUR', sequelize.col('entry_time')), 'ASC']]
    });

    // Average duration
    const avgDuration = await ParkingSession.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('duration_minutes')), 'avgDuration']],
      where: {
        ...where,
        status: 'completed'
      }
    });

    // Peak hours
    const peakHour = sessionsByHour.length > 0
      ? sessionsByHour.reduce((max, curr) =>
        parseInt(curr.dataValues.count) > parseInt(max.dataValues.count) ? curr : max
      )
      : null;

    return {
      sessionsByHour,
      averageDuration: avgDuration?.dataValues.avgDuration || 0,
      peakHour: peakHour ? peakHour.dataValues.hour : null,
      period: {
        start: startDate || 'last 7 days',
        end: endDate || 'now'
      }
    };
  }

  /**
   * Reset system (for testing/maintenance)
   * @returns {Promise<Object>}
   */
  async resetSystem() {
    const transaction = await sequelize.transaction();

    try {
      // Cancel all active sessions
      await ParkingSession.update(
        { status: 'cancelled' },
        { where: { status: 'active' }, transaction }
      );

      // Reset all parking spaces to available
      await ParkingSpace.update(
        { status: 'available' },
        { where: { status: { [Op.ne]: 'maintenance' } }, transaction }
      );

      await SystemEvent.create({
        eventType: 'maintenance_start',
        severity: 'high',
        component: 'Admin',
        message: 'System reset performed',
        details: { resetAt: new Date() }
      }, { transaction });

      await transaction.commit();

      logger.info('System reset completed');

      return {
        success: true,
        message: 'System reset completed'
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('System reset error:', error);
      throw error;
    }
  }

  /**
   * Get dashboard summary
   * @returns {Promise<Object>}
   */
  async getDashboardSummary() {
    const occupancy = await this.getOccupancy();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const revenue = await this.getRevenue(todayStart, new Date());
    const activeSessions = await ParkingSession.count({ where: { status: 'active' } });
    const totalVehicles = await Vehicle.count();

    // Get unresolved alerts
    const unresolvedAlerts = await SystemEvent.count({
      where: {
        resolved: false,
        severity: { [Op.in]: ['high', 'critical'] }
      }
    });

    return {
      occupancy,
      revenue: {
        today: revenue.totalRevenue,
        transactions: revenue.transactionCount
      },
      activeSessions,
      totalVehicles,
      unresolvedAlerts,
      timestamp: new Date()
    };
  }
}

module.exports = new AdminService();
module.exports.ADMIN_CONFIG = ADMIN_CONFIG;
