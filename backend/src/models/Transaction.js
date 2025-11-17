module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'session_id',
      references: {
        model: 'parking_sessions',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    paymentMethod: {
      type: DataTypes.ENUM('credit_card', 'debit_card', 'cash', 'mobile_wallet', 'upi'),
      field: 'payment_method'
    },
    receiptNumber: {
      type: DataTypes.STRING,
      unique: true,
      field: 'receipt_number'
    },
    transactionDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'transaction_date'
    }
  }, {
    tableName: 'transactions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['session_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['transaction_date']
      },
      {
        unique: true,
        fields: ['receipt_number']
      }
    ]
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.ParkingSession, {
      foreignKey: 'sessionId',
      as: 'session'
    });
    Transaction.hasMany(models.Payment, {
      foreignKey: 'transactionId',
      as: 'payments'
    });
  };

  return Transaction;
};
