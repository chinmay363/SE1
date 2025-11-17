module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'transaction_id',
      references: {
        model: 'transactions',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'payment_method'
    },
    status: {
      type: DataTypes.ENUM('initiated', 'processing', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'initiated'
    },
    paymentGatewayRef: {
      type: DataTypes.STRING,
      field: 'payment_gateway_ref'
    },
    paymentDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'payment_date'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    indexes: [
      {
        fields: ['transaction_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['payment_date']
      }
    ]
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Transaction, {
      foreignKey: 'transactionId',
      as: 'transaction'
    });
  };

  return Payment;
};
