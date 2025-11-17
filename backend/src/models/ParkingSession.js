module.exports = (sequelize, DataTypes) => {
  const ParkingSession = sequelize.define('ParkingSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    vehicleId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'vehicle_id',
      references: {
        model: 'vehicles',
        key: 'id'
      }
    },
    spaceId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'space_id',
      references: {
        model: 'parking_spaces',
        key: 'id'
      }
    },
    entryTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'entry_time'
    },
    exitTime: {
      type: DataTypes.DATE,
      field: 'exit_time'
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'active'
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      field: 'duration_minutes'
    },
    entryImage: {
      type: DataTypes.TEXT,
      field: 'entry_image'
    },
    exitImage: {
      type: DataTypes.TEXT,
      field: 'exit_image'
    }
  }, {
    tableName: 'parking_sessions',
    timestamps: true,
    indexes: [
      {
        fields: ['vehicle_id']
      },
      {
        fields: ['space_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['entry_time']
      }
    ]
  });

  ParkingSession.associate = (models) => {
    ParkingSession.belongsTo(models.Vehicle, {
      foreignKey: 'vehicleId',
      as: 'vehicle'
    });
    ParkingSession.belongsTo(models.ParkingSpace, {
      foreignKey: 'spaceId',
      as: 'space'
    });
    ParkingSession.hasOne(models.Transaction, {
      foreignKey: 'sessionId',
      as: 'transaction'
    });
  };

  return ParkingSession;
};
