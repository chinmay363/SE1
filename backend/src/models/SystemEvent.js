module.exports = (sequelize, DataTypes) => {
  const SystemEvent = sequelize.define('SystemEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    eventType: {
      type: DataTypes.ENUM(
        'barrier_open',
        'barrier_close',
        'barrier_failure',
        'lpr_success',
        'lpr_failure',
        'payment_processed',
        'payment_failed',
        'system_startup',
        'system_shutdown',
        'maintenance_start',
        'maintenance_end',
        'alert_triggered'
      ),
      allowNull: false,
      field: 'event_type'
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'low'
    },
    component: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    details: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    resolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    resolvedAt: {
      type: DataTypes.DATE,
      field: 'resolved_at'
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'system_events',
    timestamps: false,
    indexes: [
      {
        fields: ['event_type']
      },
      {
        fields: ['severity']
      },
      {
        fields: ['component']
      },
      {
        fields: ['resolved']
      },
      {
        fields: ['timestamp']
      }
    ]
  });

  return SystemEvent;
};
