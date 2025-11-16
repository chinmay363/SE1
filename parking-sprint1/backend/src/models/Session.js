const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Vehicle = require('./Vehicle');
const Slot = require('./Slot');

const Session = sequelize.define('Session', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  entryTime: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  exitTime: { type: DataTypes.DATE, allowNull: true },
  fee: { type: DataTypes.FLOAT, allowNull: true },
});

Vehicle.hasMany(Session);
Session.belongsTo(Vehicle);

Slot.hasMany(Session);
Session.belongsTo(Slot);

module.exports = Session;
