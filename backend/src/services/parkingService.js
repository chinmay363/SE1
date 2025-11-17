const { ParkingSpace, ParkingSession, Vehicle, Transaction, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class ParkingService {
  /**
   * Allocate a parking space
   * @param {string} licensePlate
   * @param {Object} preferences
   * @returns {Promise<Object>}
   */
  async allocateSpace(licensePlate, preferences = {}) {
    const transaction = await sequelize.transaction();

    try {
      // Find or create vehicle
      let vehicle = await Vehicle.findOne({
        where: { licensePlate },
        transaction
      });

      if (!vehicle) {
        vehicle = await Vehicle.create({
          licensePlate,
          firstSeen: new Date(),
          lastSeen: new Date(),
          visitCount: 1
        }, { transaction });
      } else {
        await vehicle.update({
          lastSeen: new Date(),
          visitCount: vehicle.visitCount + 1
        }, { transaction });
      }

      // Check if vehicle already has an active session
      const existingSession = await ParkingSession.findOne({
        where: {
          vehicleId: vehicle.id,
          status: 'active'
        },
        transaction
      });

      if (existingSession) {
        await transaction.rollback();
        throw new Error('Vehicle already has an active parking session');
      }

      // Find available space
      const whereClause = {
        status: 'available',
        isActive: true
      };

      if (preferences.zone) {
        whereClause.zone = preferences.zone;
      }

      if (preferences.floor) {
        whereClause.floor = preferences.floor;
      }

      const space = await ParkingSpace.findOne({
        where: whereClause,
        order: [['spaceNumber', 'ASC']],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!space) {
        await transaction.rollback();
        throw new Error('No available parking spaces');
      }

      // Update space status
      await space.update({
        status: 'occupied',
        lastOccupied: new Date()
      }, { transaction });

      // Create parking session
      const session = await ParkingSession.create({
        vehicleId: vehicle.id,
        spaceId: space.id,
        entryTime: new Date(),
        status: 'active'
      }, { transaction });

      await transaction.commit();

      logger.info('Space allocated:', {
        licensePlate,
        spaceNumber: space.spaceNumber,
        sessionId: session.id
      });

      return {
        session,
        space,
        vehicle
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Space allocation error:', error);
      throw error;
    }
  }

  /**
   * Release a parking space
   * @param {string} spaceId
   * @returns {Promise<Object>}
   */
  async releaseSpace(spaceId) {
    const transaction = await sequelize.transaction();

    try {
      const space = await ParkingSpace.findByPk(spaceId, { transaction });

      if (!space) {
        await transaction.rollback();
        throw new Error('Parking space not found');
      }

      // Update space status
      await space.update({
        status: 'available'
      }, { transaction });

      await transaction.commit();

      logger.info('Space released:', { spaceId, spaceNumber: space.spaceNumber });

      return space;
    } catch (error) {
      await transaction.rollback();
      logger.error('Space release error:', error);
      throw error;
    }
  }

  /**
   * Get all parking spaces with their status
   * @returns {Promise<Array>}
   */
  async getAllSpaces() {
    return await ParkingSpace.findAll({
      order: [['spaceNumber', 'ASC']]
    });
  }

  /**
   * Get parking space statistics
   * @returns {Promise<Object>}
   */
  async getSpaceStatistics() {
    const total = await ParkingSpace.count();
    const available = await ParkingSpace.count({ where: { status: 'available' } });
    const occupied = await ParkingSpace.count({ where: { status: 'occupied' } });
    const reserved = await ParkingSpace.count({ where: { status: 'reserved' } });
    const maintenance = await ParkingSpace.count({ where: { status: 'maintenance' } });

    return {
      total,
      available,
      occupied,
      reserved,
      maintenance,
      occupancyRate: ((occupied / total) * 100).toFixed(2)
    };
  }

  /**
   * Get active parking sessions
   * @returns {Promise<Array>}
   */
  async getActiveSessions() {
    return await ParkingSession.findAll({
      where: { status: 'active' },
      include: [
        { association: 'vehicle' },
        { association: 'space' }
      ],
      order: [['entryTime', 'DESC']]
    });
  }
}

module.exports = new ParkingService();
