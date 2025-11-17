module.exports = (sequelize, DataTypes) => {
  const Log = sequelize.define('Log', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    level: {
      type: DataTypes.ENUM('info', 'warn', 'error', 'debug'),
      allowNull: false,
      defaultValue: 'info'
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    resource: {
      type: DataTypes.STRING
    },
    resourceId: {
      type: DataTypes.UUID,
      field: 'resource_id'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ipAddress: {
      type: DataTypes.STRING,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: 'user_agent'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'logs',
    timestamps: false,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['level']
      },
      {
        fields: ['action']
      },
      {
        fields: ['timestamp']
      }
    ]
  });

  Log.associate = (models) => {
    Log.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Log;
};
