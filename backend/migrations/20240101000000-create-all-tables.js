'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'technician'),
        allowNull: false,
        defaultValue: 'technician'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      lastLogin: {
        type: Sequelize.DATE
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Vehicles table
    await queryInterface.createTable('vehicles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      license_plate: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      make: {
        type: Sequelize.STRING
      },
      model: {
        type: Sequelize.STRING
      },
      color: {
        type: Sequelize.STRING
      },
      first_seen: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      last_seen: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      visit_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create ParkingSpaces table
    await queryInterface.createTable('parking_spaces', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      space_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      floor: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      zone: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'A'
      },
      status: {
        type: Sequelize.ENUM('available', 'occupied', 'reserved', 'maintenance'),
        allowNull: false,
        defaultValue: 'available'
      },
      type: {
        type: Sequelize.ENUM('regular', 'handicap', 'electric', 'vip'),
        allowNull: false,
        defaultValue: 'regular'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_occupied: {
        type: Sequelize.DATE
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create ParkingSessions table
    await queryInterface.createTable('parking_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      vehicle_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'vehicles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      space_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'parking_spaces',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      entry_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      exit_time: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'active'
      },
      duration_minutes: {
        type: Sequelize.INTEGER
      },
      entry_image: {
        type: Sequelize.TEXT
      },
      exit_image: {
        type: Sequelize.TEXT
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Transactions table
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'parking_sessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD'
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },
      payment_method: {
        type: Sequelize.ENUM('cash', 'card', 'digital_wallet', 'mobile')
      },
      receipt_number: {
        type: Sequelize.STRING,
        unique: true
      },
      transaction_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Payments table
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      transaction_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'transactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('initiated', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'initiated'
      },
      payment_gateway_ref: {
        type: Sequelize.STRING
      },
      payment_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Logs table
    await queryInterface.createTable('logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      level: {
        type: Sequelize.ENUM('info', 'warn', 'error', 'debug'),
        allowNull: false,
        defaultValue: 'info'
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false
      },
      resource: {
        type: Sequelize.STRING
      },
      resource_id: {
        type: Sequelize.UUID
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      ip_address: {
        type: Sequelize.STRING
      },
      user_agent: {
        type: Sequelize.TEXT
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create SystemEvents table
    await queryInterface.createTable('system_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      event_type: {
        type: Sequelize.ENUM(
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
        allowNull: false
      },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'low'
      },
      component: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      details: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      resolved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      resolved_at: {
        type: Sequelize.DATE
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes
    await queryInterface.addIndex('vehicles', ['license_plate'], {
      unique: true,
      name: 'vehicles_license_plate_unique'
    });

    await queryInterface.addIndex('parking_spaces', ['space_number'], {
      unique: true,
      name: 'parking_spaces_space_number_unique'
    });

    await queryInterface.addIndex('parking_spaces', ['status'], {
      name: 'parking_spaces_status_idx'
    });

    await queryInterface.addIndex('parking_sessions', ['vehicle_id'], {
      name: 'parking_sessions_vehicle_id_idx'
    });

    await queryInterface.addIndex('parking_sessions', ['space_id'], {
      name: 'parking_sessions_space_id_idx'
    });

    await queryInterface.addIndex('parking_sessions', ['status'], {
      name: 'parking_sessions_status_idx'
    });

    await queryInterface.addIndex('transactions', ['session_id'], {
      unique: true,
      name: 'transactions_session_id_unique'
    });

    await queryInterface.addIndex('transactions', ['receipt_number'], {
      unique: true,
      name: 'transactions_receipt_number_unique'
    });

    await queryInterface.addIndex('logs', ['user_id'], {
      name: 'logs_user_id_idx'
    });

    await queryInterface.addIndex('logs', ['level'], {
      name: 'logs_level_idx'
    });

    await queryInterface.addIndex('system_events', ['event_type'], {
      name: 'system_events_event_type_idx'
    });

    await queryInterface.addIndex('system_events', ['severity'], {
      name: 'system_events_severity_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('system_events');
    await queryInterface.dropTable('logs');
    await queryInterface.dropTable('payments');
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('parking_sessions');
    await queryInterface.dropTable('parking_spaces');
    await queryInterface.dropTable('vehicles');
    await queryInterface.dropTable('users');
  }
};
