module.exports = (sequelize, DataTypes) => {
  const ParkingSpace = sequelize.define('ParkingSpace', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    spaceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'space_number'
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    zone: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'A'
    },
    status: {
      type: DataTypes.ENUM('available', 'occupied', 'reserved', 'maintenance'),
      allowNull: false,
      defaultValue: 'available'
    },
    type: {
      type: DataTypes.ENUM('regular', 'handicap', 'electric', 'vip'),
      allowNull: false,
      defaultValue: 'regular'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    lastOccupied: {
      type: DataTypes.DATE,
      field: 'last_occupied'
    }
  }, {
    tableName: 'parking_spaces',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['space_number']
      },
      {
        fields: ['status']
      },
      {
        fields: ['floor', 'zone']
      }
    ]
  });

  ParkingSpace.associate = (models) => {
    ParkingSpace.hasMany(models.ParkingSession, {
      foreignKey: 'spaceId',
      as: 'parkingSessions'
    });
  };

  return ParkingSpace;
};
