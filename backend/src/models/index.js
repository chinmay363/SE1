const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool || {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {
  sequelize,
  Sequelize,
  User: require('./User')(sequelize, Sequelize.DataTypes),
  Vehicle: require('./Vehicle')(sequelize, Sequelize.DataTypes),
  ParkingSpace: require('./ParkingSpace')(sequelize, Sequelize.DataTypes),
  ParkingSession: require('./ParkingSession')(sequelize, Sequelize.DataTypes),
  Transaction: require('./Transaction')(sequelize, Sequelize.DataTypes),
  Payment: require('./Payment')(sequelize, Sequelize.DataTypes),
  Log: require('./Log')(sequelize, Sequelize.DataTypes),
  SystemEvent: require('./SystemEvent')(sequelize, Sequelize.DataTypes)
};

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
