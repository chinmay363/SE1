const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Slot = sequelize.define('Slot', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  slotCode: { type: DataTypes.STRING, unique: true },
  isOccupied: { type: DataTypes.BOOLEAN, defaultValue: false },
  distanceRank: { type: DataTypes.INTEGER, allowNull: false }
});

module.exports = Slot;
