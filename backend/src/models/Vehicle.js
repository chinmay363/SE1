module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define('Vehicle', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    licensePlate: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'license_plate'
    },
    make: {
      type: DataTypes.STRING
    },
    model: {
      type: DataTypes.STRING
    },
    color: {
      type: DataTypes.STRING
    },
    firstSeen: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'first_seen'
    },
    lastSeen: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_seen'
    },
    visitCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'visit_count'
    }
  }, {
    tableName: 'vehicles',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['license_plate']
      }
    ]
  });

  Vehicle.associate = (models) => {
    Vehicle.hasMany(models.ParkingSession, {
      foreignKey: 'vehicleId',
      as: 'parkingSessions'
    });
  };

  return Vehicle;
};
