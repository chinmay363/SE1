const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Vehicle = sequelize.define('Vehicle', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  plate: { type: DataTypes.STRING, unique: true },
  ownerName: { type: DataTypes.STRING },
  isRegistered: { type: DataTypes.BOOLEAN, defaultValue: true },
  role: { type: DataTypes.STRING, defaultValue: 'user' }
});

module.exports = Vehicle;
