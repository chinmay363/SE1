const { ParkingSpace, ParkingSession, Transaction, Log, SystemEvent, Vehicle, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class AdminService {
  /**
   * Get real-time occupancy data
   * @returns {Promise<Object>}
   */
  async getOccupancy() {
    const total = await ParkingSpace.count();
    const available = await ParkingSpace.count({ where: { status: 'available' } });
    const occupied = await ParkingSpace.count({ where: { status: 'occupied' } });
    const reserved = await ParkingSpace.count({ where: { status: 'reserved' } });
    const maintenance = await ParkingSpace.count({ where: { status: 'maintenance' } });

    // Get occupancy by floor and zone
    const byFloorAndZone = await ParkingSpace.findAll({
      attributes: [
        'floor',
        'zone',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['floor', 'zone', 'status']
    });

    return {
      total,
      available,
      occupied,
      reserved,
      maintenance,
      occupancyRate: ((occupied / total) * 100).toFixed(2),
      byFloorAndZone,
      timestamp: new Date()
    };
  }

  /**
   * Get revenue statistics
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Object>}
   */
  async getRevenue(startDate, endDate) {
    const where = {
      status: 'completed',
      transactionDate: {
        [Op.between]: [startDate || new Date(0), endDate || new Date()]
      }
    };

    const transactions = await Transaction.findAll({ where });

    const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const transactionCount = transactions.length;

    // Revenue by date
    const revenueByDate = await Transaction.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('transaction_date')), 'date'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where,
      group: [sequelize.fn('DATE', sequelize.col('transaction_date'))],
      order: [[sequelize.fn('DATE', sequelize.col('transaction_date')), 'ASC']]
    });

    // Revenue by payment method
    const revenueByMethod = await Transaction.findAll({
      attributes: [
        'paymentMethod',
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where,
      group: ['paymentMethod']
    });

    return {
      totalRevenue: totalRevenue.toFixed(2),
      transactionCount,
      averageTransaction: (totalRevenue / transactionCount || 0).toFixed(2),
      revenueByDate,
      revenueByMethod,
      period: {
        start: startDate || 'beginning',
        end: endDate || 'now'
      }
    };
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
